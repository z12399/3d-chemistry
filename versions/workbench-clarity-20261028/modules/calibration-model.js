// Arithmetic for a conditional linear-calibration teaching model.
// Statistical adequacy, matrix equivalence and method validation are not inferred.
export const CALIBRATION_LAB_ID = 'analysis-calibration';
const finite = Number.isFinite;
const fail = message => ({ok:false,issues:[message]});
const mean = values => values.reduce((sum,value)=>sum+value/values.length,0);
const freeze = value => { if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value; };

export function fitCalibration(points,{throughOrigin=false}={}) {
  if(typeof throughOrigin!=='boolean')return fail('校正模式無效。');
  if(!Array.isArray(points)||points.length<3||points.length>500)return fail('需提供 3–500 筆校正讀值。');
  if(points.some(p=>!p||!finite(p.x)||p.x<0||!finite(p.y)))return fail('標準濃度須為非負有限數，響應須為有限數。');
  if(new Set(points.map(p=>p.x)).size<3)return fail('至少需要三個不同的標準濃度。');
  const n=points.length,xMean=mean(points.map(p=>p.x)),yMean=mean(points.map(p=>p.y));
  const sxx=points.reduce((s,p)=>s+(p.x-xMean)**2,0);
  const sxy=points.reduce((s,p)=>s+(p.x-xMean)*(p.y-yMean),0);
  const denominator=throughOrigin?points.reduce((s,p)=>s+p.x*p.x,0):sxx;
  const numerator=throughOrigin?points.reduce((s,p)=>s+p.x*p.y,0):sxy;
  if(![xMean,yMean,sxx,sxy,denominator,numerator].every(finite)||denominator<=0)return fail('校正值超出可可靠計算的數值尺度。');
  const slope=numerator/denominator,intercept=throughOrigin?0:yMean-slope*xMean;
  if(!finite(slope)||slope<=0||!finite(intercept))return fail('本活動需要有限且為正的校正斜率。');
  const residuals=points.map((p,i)=>({id:p.id??String(i),x:p.x,y:p.y,fitted:intercept+slope*p.x,residual:p.y-(intercept+slope*p.x)}));
  const sse=residuals.reduce((s,p)=>s+p.residual*p.residual,0);
  const sst=points.reduce((s,p)=>s+(p.y-yMean)**2,0),df=n-(throughOrigin?1:2);
  const residualSd=Math.sqrt(sse/df),rSquared=sst>0?1-sse/sst:null;
  if(sse===0&&residuals.some(p=>p.residual!==0)||sst===0&&points.some(p=>p.y!==yMean))return fail('響應差異太小，平方後失去數值精度。');
  if(![sse,sst,residualSd,...residuals.flatMap(p=>[p.fitted,p.residual])].every(finite)||rSquared!==null&&!finite(rSquared))return fail('擬合結果超出可可靠計算的數值尺度。');
  return {ok:true,mode:throughOrigin?'origin':'free',n,levels:new Set(points.map(p=>p.x)).size,
    slope,intercept,xMean,yMean,sxx,range:{min:Math.min(...points.map(p=>p.x)),max:Math.max(...points.map(p=>p.x))},
    df,residualSd,sse,sst,rSquared,residuals,
    rSquaredDefinition:'1 − SSE / Σ(y − 平均y)²；兩種模式都使用中心化分母。',
    interpretation:'數學擬合不證明線性、等變異、基質等效或方法已確效。'};
}

function validFit(fit) {
  return fit?.ok===true&&finite(fit.slope)&&fit.slope>0&&finite(fit.intercept)&&
    finite(fit.range?.min)&&finite(fit.range?.max)&&fit.range.min<fit.range.max;
}

function classifyRange(fit,estimate) {
  const tolerance=8*Number.EPSILON*Math.max(Math.abs(fit.range.min),Math.abs(fit.range.max),Math.abs(estimate));
  return estimate<0?'negative':estimate<fit.range.min-tolerance?'below':estimate>fit.range.max+tolerance?'above':'inside';
}

export function inverseCalibration(fit,responses) {
  if(!validFit(fit))return fail('尚無有效校正式。');
  if(!Array.isArray(responses)||responses.length<1||responses.length>100||responses.some(y=>!finite(y)))return fail('需提供 1–100 個有限響應，不能有空白或非法值。');
  const meanResponse=mean(responses),estimate=(meanResponse-fit.intercept)/fit.slope;
  const individualEstimates=responses.map(y=>(y-fit.intercept)/fit.slope);
  const responseSd=responses.length>1?Math.sqrt(responses.reduce((s,y)=>s+(y-meanResponse)**2,0)/(responses.length-1)):null;
  if(![meanResponse,estimate,...individualEstimates,...(responseSd===null?[]:[responseSd])].every(finite))return fail('逆算結果超出可可靠計算的數值尺度。');
  const rangeStatus=classifyRange(fit,estimate);
  return {ok:true,meanResponse,estimate,replicates:responses.length,responseSd,individualEstimates,
    rangeStatus,withinRange:rangeStatus==='inside',
    interpretation:rangeStatus==='inside'?'位於標準範圍內；仍需確認模型與基質適合。':'只顯示外推算術；不可當作已支持的定量結果。'};
}

export function compareValidation(fit,sample) {
  if(!sample||!finite(sample.target)||sample.target<=0||!Array.isArray(sample.responses))return fail('驗證樣品須有正的標稱值及原始響應。');
  const inverse=inverseCalibration(fit,sample.responses.map(p=>p?.value));
  if(!inverse.ok)return inverse;
  const difference=inverse.estimate-sample.target,relativeBias=100*difference/sample.target;
  if(!finite(relativeBias))return fail('偏差超出可可靠計算的數值尺度。');
  return {...inverse,target:sample.target,difference,relativeBias,
    interpretation:'標稱值用於比較回算偏差；不是食品含量、通用允收範圍或全部方法真確度。'};
}

export function calibrationUncertainty(fit,{estimate,replicates=1}={}) {
  if(!validFit(fit)||fit.mode!=='free')return fail('這條不確定度公式限自由截距的線性校正。');
  if(!finite(estimate)||!Number.isInteger(replicates)||replicates<1||replicates>1000)return fail('估計值須有限；未來獨立量測次數需為 1–1000 的整數。');
  if(!finite(fit.residualSd)||fit.residualSd<0||!finite(fit.sxx)||fit.sxx<=0||!Number.isInteger(fit.n)||fit.n<3)return fail('校正統計量無效。');
  if(classifyRange(fit,estimate)!=='inside')return fail('不在校正範圍內，本活動不顯示不確定度。');
  const scale=(fit.residualSd/fit.slope)**2;
  const terms=[{id:'repeat',label:'未來樣品均值',factor:1/replicates},
    {id:'center',label:'校正中心',factor:1/fit.n},
    {id:'distance',label:'離校正中心的距離',factor:(estimate-fit.xMean)**2/fit.sxx}];
  const variance=scale*terms.reduce((s,t)=>s+t.factor,0),standardUncertainty=Math.sqrt(variance);
  if(!finite(scale)||!finite(variance)||!finite(standardUncertainty))return fail('不確定度超出可可靠計算的數值尺度。');
  if(scale===0&&fit.residualSd>0||variance===0&&scale>0||terms.some(t=>t.factor>0&&scale>0&&scale*t.factor===0))return fail('不確定度太小，已超出可可靠表示的數值尺度。');
  return {ok:true,estimate,replicates,standardUncertainty,variance,df:fit.n-2,
    components:terms.map(t=>({...t,variance:scale*t.factor,standardComponent:Math.sqrt(scale*t.factor),fraction:variance>0?scale*t.factor/variance:0})),
    interpretation:'線性、固定x、獨立等變異y且未知樣品同響應變異時的一階近似標準不確定度；不是95%區間或完整方法不確定度。'};
}

export const CALIBRATION_TEACHING_SCENARIOS=freeze([
  {id:'linear',label:'假想：固定變異的直線',description:'原創教學資料，所有濃度的響應散布相同。假設標準x的誤差可忽略，各響應獨立。',uncertaintyAllowed:true,
    response:32,expected:'conditional',explanation:'這份題設採線性及固定響應變異；仍須把適用假設與真正方法確效分開。'},
  {id:'curved',label:'假想：漂亮R²下的彎曲',description:'原創教學資料，直線項另加0.3(x−3.5)²；保留全部濃度，沒有因擬合不好刪點。',uncertaintyAllowed:false,
    response:32,expected:'revise',explanation:'殘差在兩端與中間呈系統方向，應重新研究範圍或模型；R²高仍不足以接受直線。'},
  {id:'fan',label:'假想：散布隨濃度變大',description:'原創教學資料，各濃度的響應擾動按x放大；不把相同權重當作已合理。',uncertaintyAllowed:false,
    response:32,expected:'revise',explanation:'殘差散布隨濃度改變；應檢查變異模型與加權依據，不能直接套等變異不確定度。'}
].map(s=>({...s,xUnit:'mg/L',yUnit:'教學響應單位',evidence:'原創假想資料，非食品實測',
  standards:Array.from({length:6},(_,k)=>k+1).flatMap(x=>[-.15,.05,.10].map((error,i)=>{
    const y=Number((4+8*x+(s.id==='curved'?.3*(x-3.5)**2:0)+(s.id==='fan'?[-.06,.02,.04][i]*x:error)).toFixed(6));
    return {id:`${s.id}-${x}-${i+1}`,x,y,displayX:String(x),displayY:y.toFixed(3)};
  }))})));

export function createTeachingScenario(id='linear') {
  const scenario=CALIBRATION_TEACHING_SCENARIOS.find(s=>s.id===id);
  if(!scenario)throw new RangeError('Unknown calibration teaching scenario');
  return JSON.parse(JSON.stringify(scenario));
}
