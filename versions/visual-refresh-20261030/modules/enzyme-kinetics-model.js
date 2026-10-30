/** Original, unit-agnostic teaching calculations; no experimental protocol.
 * Units must be consistent within a call. Defaults can be read as mM and min.
 * "Exact progress" means the reduced irreversible MM ODE, not full mass action.
 */
const freeze=Object.freeze;
export const ENZYME_KINETICS_DEFAULTS=freeze({
  progress:freeze({s0:4,km:1,vmax:1,duration:10,points:101,windowStart:0,windowEnd:2,windowPoints:21}),
  inhibition:freeze({substrate:1,km:1,vmax:1,inhibitor:1,ki:1,kiPrime:2,mode:'mixed'}),
  fit:freeze({kmBounds:freeze([0.001,1000])}),
});
export const ENZYME_KINETICS_LIMITS=freeze({
  positiveMin:1e-12,magnitudeMax:1e12,pointCount:freeze({min:2,max:2001}),maxObservations:2000,
  inhibitionModes:freeze(['none','competitive','uncompetitive','pure-noncompetitive','mixed']),
});
export const ENZYME_KINETICS_SOURCES=freeze([
  freeze({id:'enzyme-progress-qssa',title:'Eilertsen et al. · MM 耗損與初始暫態',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6612542/',scope:'§3.1–3.2，式 (20)、(23)：QSSA 後的受質耗損 ODE 與 Lambert-W 解。此處自行積分及求根，不模擬初始複合物建立。'}),
  freeze({id:'enzyme-inhibition-delft',title:'TU Delft · 競爭與反競爭抑制',url:'https://interactivetextbooks.tudelft.nl/biochemistry/content/Chapter_4_Enzyme_regulation.html',scope:'§4.2 式 (4.5)–(4.6) 與 §4.3 式 (4.7)–(4.8)：KI、KI′ 與抑制因子。只採公式，不推論實際結構結合位點。'}),
  freeze({id:'enzyme-mixed-prism',title:'GraphPad 官方 · 一般混合抑制式',url:'https://www.graphpad.com/guides/prism/latest/curve-fitting/reg_mixered_model.htm',scope:'Model 的 VmaxApp、KmApp 公式。該頁 Alpha=KI′/KI；本模組 alpha=1+I/KI、alphaPrime=1+I/KI′，不可混用符號。'}),
  freeze({id:'enzyme-initial-niha',title:'NIH Assay Guidance Manual · 初速與原尺度擬合',url:'https://www.ncbi.nlm.nih.gov/books/NBK92007/',scope:'What is initial velocity?、Measurement of Km and Vmax 的官方搜尋索引正文。說明耗損及倒數變換改變誤差；未採 10% 為所有反應通用硬門檻。'}),
  freeze({id:'enzyme-least-squares-nist',title:'NIST · 最小平方法與自由截距',url:'https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd431.htm',scope:'SSE 定義及含截距直線 OLS。此處 RMSE=sqrt(SSE/n)，不是該頁的 sqrt(SSE/(n-p)) 殘差標準差。'}),
  freeze({id:'enzyme-nonlinear-nist',title:'NIST · 非線性最小平方的限制',url:'https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd142.htm',scope:'非線性估計與局部極值／離群值限制；此處不輸出信賴區間。'}),
]);
export const ENZYME_KINETICS_ASSUMPTIONS=freeze([
  '耗損採單受質、不可逆、固定酵素活性與固定 Km/Vmax 的簡化 MM 速率律；P=S₀−S。不含逆反應、產物抑制、失活、傳質或前穩態暫態。',
  't=0 是簡化速率律的起點；initialVelocity 是此模型瞬間斜率。觀測視窗則對指定等距 P(t) 點作自由截距 OLS，不強迫過原點，也不把有限視窗斜率視為瞬間初速。',
  '抑制式假設可逆、無活性 EI/ESI 群與可視為固定的游離抑制劑濃度；不適用緊密結合耗竭、時間依賴失活或用曲線證明真實結合位點。',
  'alpha=1+I/KI，alphaPrime=1+I/KI′。純非競爭強制 KI′=KI；一般 mixed 保留兩者。Km 不是普遍等同解離常數。',
  '未加權 NLS 把每個原始速率觀測等權計入，包括重複值。S=0 的預測固定為 0；負速率可作背景扣除後的觀測，但模型不生成負反應速率。',
  'Km 受指定正上下界限制，Vmax≥0。邊界與局部靈敏度診斷不是信賴區間或物理確證；informative 只表示本次數值檢查未標示弱辨識。',
  'LB 只對 S>0 且 v>0 的資料作 1/v 對 1/S 的 OLS；排除列表必須保留。有效解另在全部原始點回算原尺度 SSE，與倒數尺度 SSE 分開。',
  '數值不自帶單位。示例可用 mM 與 min；實測資料保留原單位，不可把任意訊號速率或 ppm 自動轉成 mM。',
]);

function object(input){if(input===null||typeof input!=='object'||Array.isArray(input))throw new TypeError('Inputs must be an object');}
function magnitude(value,name,{positive=false,signed=false,allowTiny=false}={}){
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`${name} must be finite`);
  const absolute=Math.abs(value);
  if((!signed&&value<0)||(positive&&value<=0)||absolute>ENZYME_KINETICS_LIMITS.magnitudeMax||(!allowTiny&&absolute>0&&absolute<ENZYME_KINETICS_LIMITS.positiveMin))throw new RangeError(`${name} outside supported numeric domain`);
  return value;
}
function count(value,name){if(!Number.isInteger(value)||value<2||value>ENZYME_KINETICS_LIMITS.pointCount.max)throw new RangeError(`${name} must be an integer in [2,2001]`);return value;}
const sum=values=>values.reduce((total,value)=>total+value,0);
const mmRate=(s,km,vmax)=>{
  if(s===0||vmax===0)return 0;
  const fraction=s/(km+s);
  return fraction<1e-290?Math.exp(Math.log(vmax)+Math.log(s)-Math.log(km+s)):vmax*fraction;
};
function residualSummary(observed,predictions){
  const residuals=observed.map((value,i)=>value-predictions[i]),sse=sum(residuals.map(value=>value*value));
  if(!Number.isFinite(sse))throw new RangeError('Residual calculation exceeds numeric range');
  return {predictions,residuals,sse,rmse:Math.sqrt(sse/observed.length)};
}

/** Exact implicit solution of S0-S+Km*ln(S0/S)=Vmax*t within floating precision.
 * y=ln(S0/S) avoids evaluating log(0) during root finding. No time stepping.
 * Underflow is explicit: substrate=0 then denotes numeric resolution, not a
 * mathematical finite completion time. logSubstrate remains available.
 */
export function integratedMichaelisMenten(input={}){
  object(input);const {s0=4,km=1,vmax=1,time=0}=input;
  magnitude(s0,'s0');magnitude(km,'km',{positive:true});magnitude(vmax,'vmax');magnitude(time,'time',{allowTiny:true});
  const initialVelocity=mmRate(s0,km,vmax);
  if(s0===0)return {time,substrate:0,product:0,initialVelocity:0,velocity:0,depletionFraction:0,logSubstrate:null,logSubstrateReason:'zero-initial-substrate',substrateUnderflow:false};
  if(time===0||vmax===0)return {time,substrate:s0,product:0,initialVelocity,velocity:initialVelocity,depletionFraction:0,logSubstrate:Math.log(s0),logSubstrateReason:null,substrateUnderflow:false};
  const amount=vmax*time,a=s0/km,b=amount/km,d=(amount-s0)/km;
  // y-d=a*exp(-y) is stable near depletion; the expm1 form is stable
  // at very small conversion. Avoid subtracting separately rounded a and b.
  let low=Math.max(b/(a+1),d),high=Math.min(b,Math.max(d,0)+Math.log1p(a)),y=low;
  for(let iteration=0;iteration<160;iteration++){
    const tail=a*Math.exp(-y),f=y<=1?a*(-Math.expm1(-y))+y-b:y-d-tail;
    const scale=y<=1?b:Math.max(Math.abs(d),y,tail);
    if(Math.abs(f)<=8*Number.EPSILON*scale)break;
    if(f>0)high=y;else low=y;
    let next=y-f/(tail+1);
    if(!(next>low&&next<high))next=low+(high-low)/2;
    if(next===y)break;y=next;
    if(iteration===159)throw new RangeError('Integrated MM solver did not converge');
  }
  const logSubstrate=Math.log(s0)-y,substrate=y<700?s0*Math.exp(-y):Math.exp(logSubstrate),product=s0*(-Math.expm1(-y));
  return {time,substrate,product,initialVelocity,velocity:mmRate(substrate,km,vmax),depletionFraction:product/s0,
    logSubstrate,logSubstrateReason:null,substrateUnderflow:substrate===0};
}

// Center both axes before fitting. The intercept is unconstrained.
function ols(xs,ys){
  const xCenter=sum(xs)/xs.length,yCenter=sum(ys)/ys.length;
  const xx=sum(xs.map(x=>(x-xCenter)**2));
  if(xx===0)return null;
  const slope=sum(xs.map((x,i)=>(x-xCenter)*(ys[i]-yCenter)))/xx,intercept=yCenter-slope*xCenter;
  const predictions=xs.map(x=>yCenter+slope*(x-xCenter));
  if(!Number.isFinite(slope)||!Number.isFinite(intercept))throw new RangeError('OLS exceeds numeric range');
  return {slope,intercept,...residualSummary(ys,predictions)};
}

/** Observations are equally spaced in time and each receives equal OLS weight. */
export function enzymeProgress(input={}){
  object(input);const p={...ENZYME_KINETICS_DEFAULTS.progress,...input};
  const {s0,km,vmax,duration,points,windowStart,windowEnd,windowPoints}=p;
  magnitude(duration,'duration',{positive:true,allowTiny:true});count(points,'points');count(windowPoints,'windowPoints');
  magnitude(windowStart,'windowStart',{allowTiny:true});magnitude(windowEnd,'windowEnd',{allowTiny:true});
  if(!(windowStart<windowEnd&&windowEnd<=duration))throw new RangeError('Window must satisfy 0 <= start < end <= duration');
  const at=time=>integratedMichaelisMenten({s0,km,vmax,time});
  const series=Array.from({length:points},(_,i)=>at(i===points-1?duration:duration*i/(points-1)));
  const observations=Array.from({length:windowPoints},(_,i)=>at(i===windowPoints-1?windowEnd:windowStart+(windowEnd-windowStart)*i/(windowPoints-1)));
  const startState=observations[0],endState=observations.at(-1),regression=ols(observations.map(s=>s.time),observations.map(s=>s.product));
  if(!regression)throw new RangeError('Observation times are not distinguishable at numeric precision');
  return {parameters:{s0,km,vmax,duration,points,windowStart,windowEnd,windowPoints},series,initialVelocity:series[0].initialVelocity,
    window:{start:windowStart,end:windowEnd,points:observations,pointCount:windowPoints,ols:regression,startState,endState,
      startDepletionFraction:startState.depletionFraction,endDepletionFraction:endState.depletionFraction,
      depletionFraction:endState.depletionFraction-startState.depletionFraction}};
}

/** General reversible inhibition; inhibitor is free I, not a fitted total dose. */
export function inhibitionKinetics(input={}){
  object(input);const p={...ENZYME_KINETICS_DEFAULTS.inhibition,...input};
  const {substrate,km,vmax,inhibitor,ki,kiPrime,mode}=p;
  magnitude(substrate,'substrate');magnitude(km,'km',{positive:true});magnitude(vmax,'vmax');
  magnitude(inhibitor,'inhibitor');magnitude(ki,'ki',{positive:true});magnitude(kiPrime,'kiPrime',{positive:true});
  if(!ENZYME_KINETICS_LIMITS.inhibitionModes.includes(mode))throw new RangeError('Unknown inhibition mode');
  const alpha=['competitive','pure-noncompetitive','mixed'].includes(mode)?1+inhibitor/ki:1;
  const alphaPrime=mode==='pure-noncompetitive'?alpha:['uncompetitive','mixed'].includes(mode)?1+inhibitor/kiPrime:1;
  const apparentKm=km*(alpha/alphaPrime),apparentVmax=vmax/alphaPrime;
  return {velocity:mmRate(substrate,apparentKm,apparentVmax),alpha,alphaPrime,apparentKm,apparentVmax,
    lineweaverBurk:vmax===0?{slope:null,intercept:null,reason:'zero-vmax'}:{slope:alpha*km/vmax,intercept:alphaPrime/vmax,reason:null}};
}

function observations(points){
  if(!Array.isArray(points)||points.length<1||points.length>ENZYME_KINETICS_LIMITS.maxObservations)throw new RangeError('Expected 1..2000 raw observations');
  return Array.from(points,(point,index)=>{
    object(point);const {substrate,velocity}=point;
    magnitude(substrate,`point ${index} substrate`);magnitude(velocity,`point ${index} velocity`,{signed:true});
    return {substrate,velocity};
  });
}
function bounds(options){
  object(options);const {kmBounds=ENZYME_KINETICS_DEFAULTS.fit.kmBounds}=options;
  if(!Array.isArray(kmBounds)||kmBounds.length!==2)throw new TypeError('kmBounds must contain two positive numbers');
  kmBounds.forEach((v,i)=>magnitude(v,`kmBounds[${i}]`,{positive:true}));
  if(kmBounds[0]>=kmBounds[1])throw new RangeError('kmBounds must be increasing');
  return [...kmBounds];
}
function baseFlags(data){return [data.some(p=>p.substrate===0)?'zero-substrate-observations':null,data.some(p=>p.velocity<0)?'negative-rate-observations':null].filter(Boolean);}
function unidentified(data,flags,reason,positiveLevels){
  const positive=data.filter(p=>p.substrate>0),mean=positive.length?Math.max(0,sum(positive.map(p=>p.velocity))/positive.length):0;
  const predictions=data.map(p=>p.substrate===0?0:mean),zeroMaximum=positive.length>0&&mean===0;
  return {status:'unidentifiable',km:null,vmax:zeroMaximum?0:null,
    ...residualSummary(data.map(p=>p.velocity),predictions),flags:[...flags,reason,...zeroMaximum?['zero-vmax']:[]],
    boundary:{km:null,vmax:zeroMaximum?'zero':null},
    identifiability:{status:'not-identifiable',reasons:[reason],distinctPositiveSubstrates:positiveLevels,sensitivityCorrelation:null,scaledJacobianCondition:null,substrateToKmRange:null}};
}

/** Unweighted original-rate NLS; repeated rows retain their individual weight.
 * At fixed K, V=max(0,sum(v*f)/sum(f*f)), f=S/(K+S). Search log K using a
 * global coarse scan, refining every bracketed minimum, plus both endpoints.
 * Flags are local numerical/coverage diagnostics, not confidence intervals.
 */
export function fitMichaelisMenten(points,options={}){
  const data=observations(points),kmBounds=bounds(options),flags=baseFlags(data);
  const positiveLevels=new Set(data.filter(p=>p.substrate>0).map(p=>p.substrate)).size;
  if(positiveLevels<2)return {...unidentified(data,flags,positiveLevels===0?'no-positive-substrate':'single-positive-substrate-level',positiveLevels),kmBounds};
  const rateScale=Math.max(...data.map(p=>Math.abs(p.velocity)))||1,ys=data.map(p=>p.velocity/rateScale);
  function profile(logKm){
    const km=Math.exp(logKm),fractions=data.map(p=>p.substrate/(km+p.substrate));
    // Rescale the basis so small f values do not cause a vanishing denominator.
    const basisScale=Math.max(...fractions),g=fractions.map(f=>f/basisScale);
    const amplitude=Math.max(0,sum(g.map((value,i)=>value*ys[i]))/sum(g.map(value=>value*value)));
    const predictions=g.map(value=>amplitude*value),score=sum(ys.map((v,i)=>(v-predictions[i])**2));
    return {logKm,km,vmax:amplitude*rateScale/basisScale,score,predictions:predictions.map(v=>v*rateScale)};
  }
  const low=Math.log(kmBounds[0]),high=Math.log(kmBounds[1]),steps=256;
  const scanned=Array.from({length:steps+1},(_,i)=>profile(low+(high-low)*i/steps));
  let best=scanned.reduce((a,b)=>b.score<a.score?b:a);
  function refine(a,b){
    const ratio=(Math.sqrt(5)-1)/2;let c=b-ratio*(b-a),d=a+ratio*(b-a),fc=profile(c),fd=profile(d);
    for(let i=0;i<110&&b-a>2e-13;i++){
      if(fc.score<fd.score){b=d;d=c;fd=fc;c=b-ratio*(b-a);fc=profile(c);}
      else {a=c;c=d;fc=fd;d=a+ratio*(b-a);fd=profile(d);}
    }
    for(const candidate of [fc,fd,profile((a+b)/2)])if(candidate.score<best.score)best=candidate;
  }
  for(let i=1;i<steps;i++)if(scanned[i].score<=scanned[i-1].score&&scanned[i].score<=scanned[i+1].score
    &&(scanned[i].score<scanned[i-1].score||scanned[i].score<scanned[i+1].score))refine(scanned[i-1].logKm,scanned[i+1].logKm);
  if(best.vmax===0){
    const result=unidentified(data,flags,'zero-vmax',positiveLevels);
    result.vmax=0;result.boundary.vmax='zero';
    result.predictions=data.map(()=>0);Object.assign(result,residualSummary(data.map(p=>p.velocity),result.predictions));
    result.flags=[...new Set(result.flags)];return {...result,kmBounds};
  }
  const boundary={km:best===scanned[0]?'lower':best===scanned.at(-1)?'upper':null,vmax:null};
  if(boundary.km){best.km=kmBounds[boundary.km==='lower'?0:1];flags.push(`km-${boundary.km}-bound`);}
  const positive=data.filter(p=>p.substrate>0),ratios=positive.map(p=>p.substrate/best.km),range=[Math.min(...ratios),Math.max(...ratios)];
  const jV=data.map(p=>p.substrate/(best.km+p.substrate)),jK=jV.map((f,i)=>-f*(best.km/(best.km+data[i].substrate)));
  const vv=sum(jV.map(x=>x*x)),kk=sum(jK.map(x=>x*x));
  const correlation=Math.max(-1,Math.min(1,sum(jV.map((v,i)=>v*jK[i]))/Math.sqrt(vv*kk)));
  const condition=Math.abs(correlation)===1?null:Math.sqrt((1+Math.abs(correlation))/(1-Math.abs(correlation)));
  const reasons=[];
  if(boundary.km)reasons.push('bounded-optimum');
  if(range[1]<0.1)reasons.push('substrate-range-below-km');
  if(range[0]>10)reasons.push('substrate-range-above-km');
  if(Math.abs(correlation)>=0.995)reasons.push('correlated-parameter-sensitivities');
  if(condition===null)reasons.push('numerically-collinear-sensitivities');
  if(data.length<=2)reasons.push('no-residual-degrees-of-freedom');
  flags.push(...reasons);
  return {status:'ok',km:best.km,vmax:best.vmax,kmBounds,...residualSummary(data.map(p=>p.velocity),best.predictions),flags:[...new Set(flags)],boundary,
    identifiability:{status:reasons.length?'weak':'informative',reasons,distinctPositiveSubstrates:positiveLevels,sensitivityCorrelation:correlation,scaledJacobianCondition:condition,substrateToKmRange:range}};
}

/** Reciprocal OLS comparison. Never turn negative/zero reciprocal coefficients
 * into positive MM parameters. Original-scale errors include ALL raw rows;
 * includedOriginalSSE additionally reports the subset actually used in LB.
 */
export function fitLineweaverBurk(points){
  const data=observations(points),included=[],excluded=[];
  data.forEach((p,index)=>{
    const reasons=[p.substrate<=0?'nonpositive-substrate':null,p.velocity<=0?'nonpositive-velocity':null].filter(Boolean);
    if(reasons.length)excluded.push({index,...p,reasons});else included.push({index,...p});
  });
  const flags=excluded.length?['excluded-nonpositive-observations']:[];
  const empty={km:null,vmax:null,predictions:null,residuals:null,sse:null,rmse:null,includedOriginalSSE:null,excluded,includedIndices:included.map(p=>p.index)};
  if(included.length<2||new Set(included.map(p=>p.substrate)).size<2)return {...empty,status:'unavailable',slope:null,intercept:null,transformedSSE:null,transformedRMSE:null,flags:[...flags,'insufficient-reciprocal-design']};
  const fit=ols(included.map(p=>1/p.substrate),included.map(p=>1/p.velocity));
  if(!fit)return {...empty,status:'unavailable',slope:null,intercept:null,transformedSSE:null,transformedRMSE:null,flags:[...flags,'indistinguishable-reciprocal-design']};
  const linear={slope:fit.slope,intercept:fit.intercept,transformedSSE:fit.sse,transformedRMSE:fit.rmse};
  if(!(fit.slope>0&&fit.intercept>0))return {...empty,...linear,status:'nonphysical',flags:[...flags,'nonphysical-reciprocal-fit']};
  const vmax=1/fit.intercept,km=fit.slope/fit.intercept;
  if(!Number.isFinite(vmax)||!Number.isFinite(km))return {...empty,...linear,status:'nonphysical',flags:[...flags,'reciprocal-parameter-overflow']};
  const original=residualSummary(data.map(p=>p.velocity),data.map(p=>mmRate(p.substrate,km,vmax)));
  return {...empty,...linear,...original,status:'ok',km,vmax,flags,
    includedOriginalSSE:sum(included.map(p=>original.residuals[p.index]**2))};
}
