/** Ideal, isothermal pipe transport and normalized tracer mass; no safety process prediction. */
export const RESIDENCE_TIME_ID='processing-residence-time';
export const RESIDENCE_TIME_LAB_ID=RESIDENCE_TIME_ID;

function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const RESIDENCE_TIME_LIMITS=freeze({
  tau:[0.5,4],radiusFraction:[0,1],timeToTau:[0,4],cutoffToTau:[0,4],pulseWidthToTau:[0,0.5],pulseWidthChoices:[0,0.2,0.5],
  flows:['laminar','plug'],trackRadii:[0,0.25,0.5,0.75,0.9,0.98,1],
});
export const RESIDENCE_TIME_SOURCES=freeze([
  {id:'rtd-source-eth2020',title:'ETH Zürich：Residence Time Distribution 實驗講義',url:'https://ethz.ch/content/dam/ethz/special-interest/mavt/process-engineering/macro-dam/Practica/BA_ResidenceTimeDistribution_HS_2020.pdf',note:'理想充分發展牛頓圓管層流、E 與累積分率；τ 以前為 75%，不沿用原文約 80% 的文字。'},
  {id:'rtd-source-fogler-ch13',title:'University of Michigan／Fogler：Distributions of Residence Times for Chemical Reactors',url:'https://public.websites.umich.edu/~essen/html/byconcept/chapter13.pdf',note:'脈衝示蹤、RTD、層流與理想塞流；本工具沒有匯入真實食品示蹤資料。'},
  {id:'rtd-source-fda-aseptic2005',title:'FDA：Aseptic Processing and Packaging for the Food Industry（2005 檢查參考）',url:'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-guides/aseptic-processing-and-packaging-food-industry',note:'最快部分與保持管的工程動機；不是本工具可採用的安全排程或臺灣現行法規。'},
]);
export const RESIDENCE_TIME_ASSUMPTIONS=freeze([
  '層流：單相、不可壓縮、等溫牛頓流體；直圓管充分發展穩態流、無滑移，忽略徑向與軸向擴散。',
  '示蹤不反應、不吸附、不改變流動；入口濃度在截面均一，按通過截面的流量加權。',
  '理想塞流只是所有流線停留 τ 的參照，不等同所有紊流，也不套用層流無滑移壁面。',
  'τ 只調整指定理想模型的時間尺度；未由流量、黏度、管徑計算 Reynolds 數，不聲稱真實流況。',
  '不含入口發展、彎管、非牛頓、顆粒滑移、熱傳、菌數或殺菌安全驗證。',
]);
const UNITS=freeze({time:'min',density:'min^-1',scaledDensity:'dimensionless',cumulative:'fraction of injected tracer mass',firstMoment:'min',conditionalMean:'min',radiusFraction:'r/R',positionFraction:'z/L',speedRatio:'u/u_bar'});
const WEIGHTING=freeze({
  markerRole:'spatial-sample-not-equal-mass',
  markerNote:'標記只是特定半徑的空間樣本；不能把已離開的標記個數當回收質量。有限入口脈衝的標記代表 t=0 進入的前緣樣本。',
  authority:'analytic-cumulative-injected-mass-fraction',
  laminarRadialDensity:'4 rho (1-rho^2)',plugRadialDensity:'2 rho',
  note:'均一入口濃度的示蹤質量依環帶流量 u(r) 2πr dr 加權；解析累積分率才是本模型的回收比例。',
  wallNote:'層流壁面零速是零面積、零通量的理想邊界，不代表有限比例的示蹤物永久滯留。',
});
const PARAMETER_KEYS=new Set(['flow','tau','time','cutoff','pulseWidth','radiusFraction']);
function finite(value,name){if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name+' must be a finite number');return value;}
function bounded(value,lo,hi,name){finite(value,name);if(value<lo||value>hi)throw new RangeError(name+' outside supported domain');return value;}
function parameters(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||![Object.prototype,null].includes(Object.getPrototypeOf(input)))throw new TypeError('Residence-time parameters must be a plain object');
  for(const key of Object.keys(input))if(!PARAMETER_KEYS.has(key))throw new TypeError('Unsupported residence-time parameter: '+key);
  const flow=input.flow===undefined?'laminar':input.flow;
  if(!RESIDENCE_TIME_LIMITS.flows.includes(flow))throw new RangeError('Unknown ideal flow');
  const tau=bounded(input.tau===undefined?2:input.tau,0.5,4,'tau');
  const pulseWidth=bounded(input.pulseWidth===undefined?0:input.pulseWidth,0,0.5*tau,'pulseWidth');
  if(pulseWidth>0&&(tau+pulseWidth===tau||!Number.isFinite(1/pulseWidth)))throw new RangeError('Positive pulse width must be representable relative to tau');
  const time=bounded(input.time===undefined?0:input.time,0,4*tau,'time');
  const cutoff=bounded(input.cutoff===undefined?2*tau:input.cutoff,0,4*tau,'cutoff');
  const radiusFraction=bounded(input.radiusFraction===undefined?0.5:input.radiusFraction,0,1,'radiusFraction');
  return {flow,tau,time,cutoff,pulseWidth,radiusFraction};
}
function distributionTime(value,tau){finite(value,'distribution time');if(value<0||!Number.isFinite(value/tau))throw new RangeError('Distribution time must be nonnegative and representable in units of tau');return value;}
function flowName(flow){if(!RESIDENCE_TIME_LIMITS.flows.includes(flow))throw new RangeError('Unknown ideal flow');return flow;}

// (q - log(1+q))/q²; direct subtraction loses the onset's second-order mass.
function logarithmicRemainderRatio(q){
  if(q===0)return 0.5;
  if(q<0.01){let sum=0.5,power=q;for(let n=3;n<=12;n++){sum+=(n%2?-1:1)*power/n;power*=q;}return sum;}
  return (q-Math.log1p(q))/(q*q);
}

function distribution(p,time){
  const {flow,tau,pulseWidth}=p,x=time/tau,w=pulseWidth/tau;
  const firstArrival=flow==='laminar'?tau/2:tau,mean=tau+pulseWidth/2;
  let density=0,cumulative=0,firstMoment=0,unrecoveredFraction=1,remainingFirstMoment=mean;
  const atom=flow==='plug'&&pulseWidth===0?{time:tau,mass:1}:null;
  if(flow==='plug'){
    if(pulseWidth===0){
      if(time>=tau){cumulative=1;firstMoment=tau;unrecoveredFraction=0;remainingFirstMoment=0;}
      if(time===tau)density=null;
    }else{
      // Compare to the same represented endpoint before subtracting tau, so a
      // completed finite plug pulse cannot leave a rounding-sized false tail.
      const elapsed=time>=tau+pulseWidth?pulseWidth:Math.max(0,time-tau);
      cumulative=elapsed/pulseWidth;unrecoveredFraction=1-cumulative;
      if(time>=tau&&time<tau+pulseWidth)density=1/pulseWidth;
      firstMoment=cumulative*(tau+elapsed/2);
      remainingFirstMoment=unrecoveredFraction*(tau+(pulseWidth+elapsed)/2);
    }
  }else if(pulseWidth===0){
    if(x>=0.5){
      const aOverX=0.5/x;
      unrecoveredFraction=aOverX*aOverX;
      cumulative=((x-0.5)/x)*(1+aOverX);
      firstMoment=tau*((x-0.5)/x);
      remainingFirstMoment=tau*aOverX;
      density=2*unrecoveredFraction/x/tau;
    }
  }else if(x>0.5){
    const y=x-w;
    if(y<0.5){
      const d=x-0.5,q=2*d;
      cumulative=(d/x)*(d/w);unrecoveredFraction=1-cumulative;
      density=(d/w)*(1+0.5/x)/x/tau;
      firstMoment=tau*(d/w)*d*(0.5+logarithmicRemainderRatio(q));
      remainingFirstMoment=mean-firstMoment;
    }else{
      const ratio=w/y,r=logarithmicRemainderRatio(ratio);
      unrecoveredFraction=(0.5/x)*(0.5/y);
      cumulative=(x-0.5)/x+(0.5/x)*((y-0.5)/y);
      density=unrecoveredFraction*(1/x+1/y)/tau;
      firstMoment=tau*((y-0.5)/y+w/2+(0.25/y)*ratio*r);
      const logRatio=ratio===0?1:Math.log1p(ratio)/ratio;
      remainingFirstMoment=tau*(0.25/y)*(1+logRatio);
    }
  }
  return {
    kind:atom?'atom':'density',time,density,scaledDensity:density===null?null:tau*density,cumulative,firstMoment,
    conditionalMean:cumulative>0?firstMoment/cumulative:null,conditionalMeanStatus:cumulative>0?'collected-only':'no-recovered-mass',
    unrecoveredFraction,remainingFirstMoment,atom,mean,firstArrival,lastArrival:flow==='plug'?tau+pulseWidth:null,
    tailStatus:flow==='laminar'?'unbounded-positive-tail':'bounded',
    identity:pulseWidth===0?'instantaneous-inlet-mass-rtd':'finite-rectangular-inlet-outlet-response',
    timeOrigin:'start-of-inlet-injection',pulseWidth,densityBoundaryConvention:atom?'unit atom; cumulative right-continuous':flow==='plug'?'rectangle left-closed right-open':'piecewise analytic density',
    units:UNITS,
  };
}

/** Time may exceed the interactive four-tau display; the analytical tail is not cut off. */
export function residenceDistribution(input={},time=0){
  const p=parameters(input);distributionTime(time,p.tau);return freeze(distribution(p,time));
}

/** Exact fraction of steady volume flow (and uniform-concentration tracer mass) in an annulus. */
export function annularFlowFraction(flow,inner,outer){
  flowName(flow);bounded(inner,0,1,'inner radius');bounded(outer,0,1,'outer radius');
  if(outer<inner)throw new RangeError('Annulus outer radius must not be smaller than inner radius');
  const area=(outer-inner)*(outer+inner);
  return flow==='plug'?area:area*((1-outer)*(1+outer)+(1-inner)*(1+inner));
}
function track(p,radiusFraction,time){
  const speedRatio=p.flow==='plug'?1:2*(1-radiusFraction)*(1+radiusFraction);
  const stationary=speedRatio===0,travelTime=stationary?null:p.tau/speedRatio;
  const distanceFraction=(time/p.tau)*speedRatio;
  return {radiusFraction,speedRatio,travelTime,travelTimeStatus:stationary?'infinite-ideal-wall':'finite',
    distanceFraction,positionFraction:Math.min(1,distanceFraction),exited:!stationary&&time>=travelTime,
    status:stationary?'stationary-wall':time>=travelTime?'exited':'inside',injectionTime:0,
    radialFlowDensity:p.flow==='plug'?2*radiusFraction:4*radiusFraction*(1-radiusFraction)*(1+radiusFraction),
    markerRole:WEIGHTING.markerRole,pointMassFraction:0};
}
/** A spatial marker entering at injection start. Marker counts are never tracer mass fractions. */
export function radialTrack(input={},radiusFraction=0.5,time=0){
  const p=parameters(input);bounded(radiusFraction,0,1,'radiusFraction');bounded(time,0,4*p.tau,'track time');
  return freeze(track(p,radiusFraction,time));
}

export function evaluateResidenceTime(input={}){
  const p=parameters(input),end=Math.min(p.time,p.cutoff);
  const outlet=distribution(p,p.time),observed=distribution(p,end),isLaminar=p.flow==='laminar';
  return freeze({
    id:RESIDENCE_TIME_ID,origin:'specified-ideal-model',parameters:p,units:UNITS,weighting:WEIGHTING,assumptions:RESIDENCE_TIME_ASSUMPTIONS,
    selectedTrack:track(p,p.radiusFraction,p.time),tracks:RESIDENCE_TIME_LIMITS.trackRadii.map(radius=>track(p,radius,p.time)),
    instantaneousRtd:distribution({...p,pulseWidth:0},p.time),outlet,
    observation:{...observed,end,cutoff:p.cutoff,censored:p.time>=p.cutoff,hasUnobservedTail:observed.unrecoveredFraction>0,recoveredFraction:observed.cumulative},
    firstArrival:outlet.firstArrival,
    whole:{mass:1,meanResidenceTime:p.tau,meanOutletTime:p.tau+p.pulseWidth/2,
      secondMomentStatus:isLaminar?'diverges':'finite',secondMoment:isLaminar?null:p.tau*p.tau+p.tau*p.pulseWidth+p.pulseWidth*p.pulseWidth/3,
      variance:isLaminar?null:p.pulseWidth*p.pulseWidth/12,
      meanIdentity:p.pulseWidth===0?'rtd-mean':'outlet-mean-from-injection-start'},
  });
}

/** Sampling is only for drawing. This point array does not define recovered mass or replace an atom. */
export function sampleResidenceCurve(input={},options={}){
  const p=parameters(input);
  if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Sampling options required');
  for(const key of Object.keys(options))if(!['end','count'].includes(key))throw new TypeError('Unknown sampling option');
  const count=options.count===undefined?161:options.count,end=options.end===undefined?4*p.tau:options.end;
  if(!Number.isInteger(count)||count<2||count>2001)throw new RangeError('Sample count must be 2–2001');
  distributionTime(end,p.tau);if(end===0)throw new RangeError('Sample end must be positive');
  return freeze(Array.from({length:count},(_,index)=>distribution(p,end*(index/(count-1)))));
}
