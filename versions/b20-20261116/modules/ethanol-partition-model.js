// Original two-component bookkeeping. No operating conditions or VLE prediction.
export const ETHANOL_PARTITION_ID='ethanol-partition-reasoning';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const ETHANOL_SOURCES=freeze([
 {id:'alcohol-source-openstax-physical',label:'OpenStax Chemistry 2e：物理與化學變化',url:'https://openstax.org/books/chemistry-2e/pages/1-3-physical-and-chemical-properties',scope:'用物質身分是否改變區分轉化與物理分離；不是本課質量分配數字的來源。'},
 {id:'alcohol-source-openstax-composition',label:'OpenStax Chemistry 2e：組成表示',url:'https://openstax.org/books/chemistry-2e/pages/3-4-other-units-for-solution-concentrations',scope:'質量分率與體積組成有不同分母。本課只用質量，不把數字改標ABV，也不假設混合體積相加。'},
 {id:'alcohol-source-mit-vle',label:'MIT 5.60：兩相組成與槓桿關係',url:'https://ocw.mit.edu/courses/5-60-thermodynamics-kinetics-spring-2008/b5cd1c8f454de7fbe66491468c6b1d5a_lec_2122.pdf',scope:'採一致組成基準下的兩相總量與成分收支關係；原講義以莫耳表示。本課明示改用一致的質量基準，不預測相組成或實際製程。'},
 {id:'alcohol-source-cristino2013',label:'Cristino等2013：乙醇／水汽液平衡原始研究',url:'https://trc.nist.gov/ThermoML/10.1016/j.fluid.2012.12.014.html',scope:'來源資料採乙醇莫耳分率及具條件的量測。本課不把它的數字直接改為質量分率，不重建實測曲線，也不由本課指定分配宣稱平衡或可達濃度。'}
]);
const abs=n=>n<0n?-n:n,gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a;};
const R=(n,d=1n)=>{if(d===0n)throw new RangeError('除數不能為零。');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};};
const add=(a,b)=>R(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>R(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>R(a.n*b.n,a.d*b.d),div=(a,b)=>R(a.n*b.d,a.d*b.n),cmp=(a,b)=>a.n*b.d===b.n*a.d?0:a.n*b.d>b.n*a.d?1:-1;
const ZERO=R(0n),ONE=R(1n),MAX=R(1000000000000n),MIN_NORMAL=2**-1022;
class InfeasibleError extends RangeError {}
class ResolutionError extends RangeError {}
function numeric(r,fraction=false){
 if(r.n===0n)return 0;
 let v=Number(r.n)/Number(r.d);
 if(!Number.isFinite(v)||v===0){
  const ns=abs(r.n).toString(),ds=r.d.toString(),nl=ns.slice(0,17),dl=ds.slice(0,17);
  const [coefficient,exponent]=String(Number(nl)/Number(dl)).split('e');
  const e=Number(exponent||0)+(ns.length-nl.length)-(ds.length-dl.length);
  v=Number(coefficient+'e'+e)*(r.n<0n?-1:1);
 }
 if(!Number.isFinite(v)||Math.abs(v)<MIN_NORMAL||(fraction&&((v===1&&cmp(r,ONE)!==0)||(v===0&&r.n!==0n))))throw new RangeError('數字超出本課可可靠顯示的範圍；沒有把小正量改成零。');
 return v;
}
function parse(value,fraction,label){
 if(!['string','number'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value))throw new TypeError(label+'需要有限十進位數。');
 const s=String(value).trim();if(!s||s.length>100)throw new RangeError(label+'尚未填入有效十進位數；原輸入不當成零。');
 const m=s.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);if(!m)throw new RangeError(label+'不是有效十進位數；原輸入不當成零。');
 const whole=m[2]||'0',dec=m[3]??m[4]??'',exponent=Number(m[5]||0);if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>308||whole.length+dec.length>70)throw new RangeError(label+'超出本課數值範圍。');
 let n=BigInt(whole+dec)*(m[1]==='-'?-1n:1n),d=1n;const scale=dec.length-exponent;if(scale>=0)d=10n**BigInt(scale);else n*=10n**BigInt(-scale);const r=R(n,d);
 if(cmp(r,ZERO)<0||cmp(r,fraction?ONE:MAX)>0)throw new RangeError(label+(fraction?'須介於0與1。':'須介於0與10¹²個本課質量單位。'));
 numeric(r,fraction);return r;
}
export function parseEthanolNumber(value,{fraction=false}={}){try{return numeric(parse(value,fraction,'輸入'),fraction);}catch{return null;}}
const exact=r=>r.n.toString()+'/'+r.d.toString();
const empty={mass:0,ethanol:0,water:0,ethanolFraction:null};
function stream(m,e){const w=sub(m,e);if(cmp(m,ZERO)<0||cmp(e,ZERO)<0||cmp(w,ZERO)<0)throw new InfeasibleError('指定組成會移出超過現有的某一成分；沒有把負數截為零。');return {mass:numeric(m),ethanol:numeric(e),water:numeric(w),ethanolFraction:m.n===0n?null:numeric(div(e,m),true)};}
function ledger(F,z,D,y){
 const E=mul(F,z),DE=mul(D,y),B=sub(F,D),BE=sub(E,DE);
 const feed=stream(F,E),draw=stream(D,DE),residue=stream(B,BE);
 return {feed,draw,residue,exactConserved:true,exactAmounts:{feed:exact(F),ethanolFeed:exact(E),draw:exact(D),ethanolDraw:exact(DE),residue:exact(B),ethanolResidue:exact(BE)},drawDirection:D.n===0n||F.n===0n?null:cmp(y,z),residueDirection:B.n===0n||F.n===0n?null:cmp(div(BE,B),z)};
}
const invalid=error=>({status:error instanceof InfeasibleError?'infeasible':error instanceof ResolutionError?'unresolved':'invalid',error:error.message,exactConserved:false,feed:null,draw:null,residue:null,equilibriumVerified:false,actualProcessPredicted:false});
export function calculateEthanolSplit({feed,feedFraction,draw,drawFraction,partitionKnown=true}={}){
 try{
  if(typeof partitionKnown!=='boolean')throw new TypeError('組成資料的有無須明確指定。');
  const F=parse(feed,false,'總量F'),z=parse(feedFraction,true,'進料乙醇質量分率z'),D=parse(draw,false,'Y股總量D');if(cmp(D,F)>0)throw new InfeasibleError('移出總量D不能超過總量F。');
  const y=partitionKnown?parse(drawFraction,true,'Y股乙醇質量分率y'):null;
  if(F.n===0n)return {status:'empty',feed:{...empty},draw:{...empty},residue:{...empty},exactConserved:true,drawDirection:null,residueDirection:null,equilibriumVerified:false,actualProcessPredicted:false};
  if(!partitionKnown&&(D.n===0n||cmp(D,F)===0||z.n===0n||cmp(z,ONE)===0))return {status:'unique',...ledger(F,z,D,z),compositionSource:'boundary-conservation',equilibriumVerified:false,actualProcessPredicted:false};
  if(!partitionKnown)return {status:'insufficient',feed:stream(F,mul(F,z)),draw:{mass:numeric(D),ethanol:null,water:null,ethanolFraction:null},residue:{mass:numeric(sub(F,D)),ethanol:null,water:null,ethanolFraction:null},exactConserved:false,error:'未給Y股組成，不能把它代填成純水或指定乙醇量。',equilibriumVerified:false,actualProcessPredicted:false};
  return {status:'unique',...ledger(F,z,D,y),equilibriumVerified:false,actualProcessPredicted:false};
 }catch(error){return invalid(error);}
}
export function calculateEthanolPhaseSplit({feed,feedFraction,xFraction,yFraction}={}){
 try{
  const F=parse(feed,false,'總量F'),z=parse(feedFraction,true,'總乙醇質量分率z'),x=parse(xFraction,true,'X股指定分率x'),y=parse(yFraction,true,'Y股指定分率y');
  if(F.n===0n)return {status:'empty',feed:{...empty},draw:{...empty},residue:{...empty},splitFraction:null,exactConserved:true,drawDirection:null,residueDirection:null,equilibriumVerified:false,actualProcessPredicted:false};
  if(cmp(x,y)===0){if(cmp(z,x)!==0)throw new InfeasibleError('正總量且x＝y≠z，兩股組成無法重建總組成。');return {status:'underdetermined',feed:stream(F,mul(F,z)),draw:null,residue:null,splitFraction:null,exactConserved:false,error:'x＝y＝z只能知道沒有組成富集，不能唯一推兩股量；也不是共沸已被證明。',equilibriumVerified:false,actualProcessPredicted:false};}
  const ratio=div(sub(z,x),sub(y,x));if(cmp(ratio,ZERO)<0||cmp(ratio,ONE)>0)throw new InfeasibleError('z不在兩個指定組成x、y之間，會要求負量或超出總量的物流。');
  const nx=numeric(x,true),ny=numeric(y,true);if(Math.abs(nx-ny)<=8*Number.EPSILON*Math.max(Math.abs(nx),Math.abs(ny)))throw new ResolutionError('x與y相異但過於接近，本課不提供可靠的分配數字；這不是把兩者改成相等或證明不可行。');
  const D=mul(F,ratio);return {status:'unique',...ledger(F,z,D,y),splitFraction:numeric(ratio,true),equilibriumVerified:false,actualProcessPredicted:false};
 }catch(error){return invalid(error);}
}
export const ETHANOL_STATIONS=freeze([
 {id:'ledger',title:'1．高濃度的那一股，新增了乙醇嗎？',prompt:'改變本課指定的F、z、D、y，查看兩股質量帳。哪一句保留成分總量與資料界線？',options:[{id:'conserved',label:'可核兩股成分收支；某股較濃不代表產生新乙醇'},{id:'unknown',label:'組成資料未給，不能代填各股乙醇量或純水假設'},{id:'empty',label:'總量為零，沒有可定義的實際物流分率'},{id:'infeasible',label:'指定配分超出總量或成分庫存，無法用非負兩股重建'},{id:'new',label:'濃度較高表示分離另外製造了乙醇'}]},
 {id:'lever',title:'2．兩個組成，能反推分配量嗎？',prompt:'給定總量F、總組成z及兩股指定組成x、y。它們能否唯一決定兩股量？',options:[{id:'unique',label:'可由兩成分收支唯一推量；尚未證明實際相平衡可達'},{id:'underdetermined',label:'x＝y＝z，分配量未定；相同組成不等於已證共沸'},{id:'empty',label:'總量為零，沒有實際兩股組成或可用的分配比例'},{id:'infeasible',label:'指定x、y、z不能以非負兩股量滿足總組成'},{id:'unresolved',label:'兩個指定組成太接近，本課不提供可靠數字，尚未判為相等或不可行'},{id:'anything',label:'任何x、y、z都能靠截掉負數得到實際製程'}]},
 {id:'stream',title:'3．先分清質量與質量分率',prompt:'選一股物流。依目前給定資料，它的乙醇質量分率是否高於原總組成？',options:[{id:'higher',label:'所選非零物流的乙醇質量分率較高；總乙醇仍須看兩股'},{id:'not-higher',label:'所選非零物流的質量分率沒有較高；不能改用乙醇量代替分率'},{id:'undefined',label:'所選股量為零、未定或組成資料不足，分率不能填0'},{id:'created',label:'選到較濃物流就能忽略另一股並增加總乙醇'}]},
 {id:'formation',title:'4．形成與重新分配的作用不同',prompt:'依目前選定的作用，哪個敘述區分物質身分的轉化與重新分配？',options:[{id:'reaction',label:'形成乙醇涉及化學轉化；原料成分身分會改變'},{id:'split',label:'這個兩股物理分配只重新分配已存在成分，沒有形成新乙醇'},{id:'same',label:'只要乙醇分率增加，就一定發生了形成乙醇的反應'}]},
 {id:'evidence',title:'5．收支成立，等於相平衡已核實嗎？',prompt:'依目前給定的證據範圍，可以對兩股組成與實際可達性說到哪一步？',options:[{id:'balance',label:'只有收支閉合；仍需相符體系、條件、組成基準與方法證據'},{id:'qualified',label:'另有相符條件的組成證據，可支持該受限比較；不是通用設備或時間預測'},{id:'universal',label:'任何收支閉合數字都已證明真實平衡，且x＝y就必定是共沸'}]},
 {id:'transfer',title:'6．換單位或產品之前，先補什麼？',prompt:'另一說法把本課質量分率直接標成ABV，並把原文莫耳分率直接代入質量帳。你會怎麼修訂？',options:[{id:'basis',label:'先核對質量、莫耳及體積分母；換算須有相應資料，不能只改標籤'},{id:'same',label:'都是百分比，所以質量、莫耳和體積數字永遠相同'},{id:'guarantee',label:'只要代入本帳本，就能保證任何飲品的成分、品質與安全'}]}
]);
const stations=new Map(ETHANOL_STATIONS.map(s=>[s.id,s])),text=v=>typeof v==='string'?v:'',lock=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:false,enumerable:true,configurable:false});
export const getEthanolStation=id=>{const s=stations.get(id);if(!s)throw new RangeError('Unknown ethanol station');return s;};
export function createEthanolDraft(){return {stationId:'ledger',mode:'amount',streamId:'draw',partitionKnown:true,processId:'split',evidenceId:'balance',raw:{feed:'100',feedFraction:'0.1',draw:'20',drawFraction:'0.3',xFraction:'0.05'},trials:Object.fromEntries(ETHANOL_STATIONS.map(s=>[s.id,{choice:'',reason:'',revision:'',checked:null}])),synthesis:'',details:{}};}
function valid(d){if(!d||typeof d!=='object'||!d.raw||!d.trials||typeof d.trials!=='object'||Array.isArray(d.trials))throw new TypeError('An ethanol draft is required');getEthanolStation(d.stationId);if(!['amount','phase'].includes(d.mode)||!['draw','residue'].includes(d.streamId)||typeof d.partitionKnown!=='boolean'||!['reaction','split'].includes(d.processId)||!['balance','matched'].includes(d.evidenceId)||Object.keys(d.raw).length!==5||['feed','feedFraction','draw','drawFraction','xFraction'].some(k=>!Object.hasOwn(d.raw,k)||typeof d.raw[k]!=='string')||ETHANOL_STATIONS.some(s=>!Object.hasOwn(d.trials,s.id)))throw new TypeError('Invalid ethanol controls');return d;}
export function setEthanolControl(d,key,value){valid(d);const choices={stationId:[...stations.keys()],mode:['amount','phase'],streamId:['draw','residue'],processId:['reaction','split'],evidenceId:['balance','matched']};if(Object.hasOwn(d.raw,key)){if(typeof value!=='string')throw new RangeError('Raw numeric text is required');d.raw[key]=value;return d;}if(key==='partitionKnown'){if(typeof value!=='boolean')throw new RangeError('A boolean evidence state is required');}else if(!Object.hasOwn(choices,key)||!choices[key].includes(value))throw new RangeError('Unknown ethanol control');d[key]=value;return d;}
export function ethanolResult(d){valid(d);const phase=d.stationId==='lever'||d.stationId==='stream'&&d.mode==='phase';return phase?calculateEthanolPhaseSplit({feed:d.raw.feed,feedFraction:d.raw.feedFraction,xFraction:d.raw.xFraction,yFraction:d.raw.drawFraction}):calculateEthanolSplit({...d.raw,partitionKnown:d.partitionKnown});}
function context(d){valid(d);if(d.stationId==='formation')return {processId:d.processId};if(d.stationId==='evidence')return {evidenceId:d.evidenceId};if(d.stationId==='transfer')return {};const mode=d.stationId==='lever'?'phase':d.stationId==='ledger'?'amount':d.mode,known=mode==='phase'||d.partitionKnown;return {raw:{feed:d.raw.feed,feedFraction:d.raw.feedFraction,...(mode==='phase'?{xFraction:d.raw.xFraction}:{draw:d.raw.draw}),...(known?{drawFraction:d.raw.drawFraction}:{})},mode,partitionKnown:known,...(d.stationId==='stream'?{streamId:d.streamId}:{})};}
export function getEthanolTrial(d){valid(d);if(!Object.hasOwn(d.trials,d.stationId))d.trials[d.stationId]={choice:'',reason:'',revision:'',checked:null};return d.trials[d.stationId];}
export function chooseEthanolAnswer(d,id){if(!getEthanolStation(d.stationId).options.some(o=>o.id===id))throw new RangeError('Unknown ethanol answer');getEthanolTrial(d).choice=id;return d;}
export function evaluateEthanol(d){valid(d);let answer,explanation,result=null;
 if(['ledger','lever','stream'].includes(d.stationId)){result=ethanolResult(d);if(result.status==='invalid')return {answer:null,explanation:result.error,result,context:context(d)};}
 if(result?.status==='infeasible')return {answer:d.stationId==='stream'?'undefined':'infeasible',explanation:result.error+' 這是收支不相容，不把指定數字當成實際分離結果。',result,context:context(d)};
 if(result?.status==='unresolved')return {answer:d.stationId==='stream'?'undefined':'unresolved',explanation:result.error,result,context:context(d)};
 if(d.stationId==='ledger'){answer=result.status==='empty'?'empty':result.status==='insufficient'?'unknown':'conserved';explanation=result.status==='empty'?'總量為零時，兩股量均為零，0／0沒有實際組成；不能將它填成0%乙醇。':result.status==='insufficient'?'只知道總量與移出量不能決定成分去向；乙醇與水都可能分入兩股。沒有給組成時不套用既有「蒸氣純水」的非揮發溶質假設。':'兩股乙醇量相加回到原量，水也各自守恆。較高的質量分率是分母與分配改變，不是形成新乙醇。這是本課指定分配的收支，不是實測汽液平衡或製程預測。';}
 else if(d.stationId==='lever'){answer=result.status;explanation=result.status==='empty'?'沒有總量時，沒有可定義的實際兩股組成或分配比。':result.status==='underdetermined'?result.error:'一致質量基準下，F＝X＋Y、Fz＝Xx＋Yy。x≠y且z在其間時可由收支推Y／F＝(z−x)／(y−x)；端點可使其中一股為零。給定組成不等於已證明真實汽液平衡；x＝y本身也不是共沸證據。';}
 else if(d.stationId==='stream'){const s=result[d.streamId];answer=!s||s.ethanolFraction===null?'undefined':(d.streamId==='draw'?result.drawDirection:result.residueDirection)>0?'higher':'not-higher';explanation=answer==='undefined'?'零量、未定量或缺組成資料的物流，不能把未知分率寫成0。先保留題目資料範圍，再看可定義的量。':'質量分率的分母是這一股總質量；乙醇量較多或較少是另一個問題。比較所選股之外，仍須保留另一股成分。較濃不表示形成新乙醇，也不是ABV。';}
 else if(d.stationId==='formation'){answer=d.processId;explanation=d.processId==='reaction'?'化學形成涉及物質身分改變；既有發酵課處理其代謝與計量。本課不再計實際發酵產率，也不以物理分離的濃度上升代替化學形成。':'這個兩股分配模型沒有反應項，乙醇與水各自守恆。它改變的是去向與分率，不把既有分子變成新乙醇；實際過程如另有反應，需另外建立證據與收支。';}
 else if(d.stationId==='evidence'){answer=d.evidenceId==='matched'?'qualified':'balance';explanation=d.evidenceId==='matched'?'這是原創給定的證據狀態：另有相符體系、條件、組成基準與方法的組成證據。它可支持該受限比較，不把本課數字校準成通用VLE，不提供設備、時間或可達產品預測。':'收支閉合只是必要的記帳一致性，不自動證明相平衡或可達組成。原始研究的莫耳分率也不能直接代入本質量帳；還需相符條件及基準的物性證據。相同組成可能只是指定分配，不能單由x＝y宣布共沸。';}
 else{answer='basis';explanation='質量分率、莫耳分率與體積分率有不同分母。原文莫耳分率要有分子量及一致轉換才能用質量基準；ABV另涉及體積定義與相應資料，不能假定混合體積相加或只改單位。此處沒有飲用、產品品質或安全判定。';}
 return {answer,explanation,result,context:context(d)};
}
export function canCheckEthanol(d){const t=getEthanolTrial(d);return !t.checked&&evaluateEthanol(d).answer!==null&&getEthanolStation(d.stationId).options.some(o=>o.id===t.choice);}
export function checkEthanolAnswer(d){const t=getEthanolTrial(d);if(!canCheckEthanol(d))return false;const r=evaluateEthanol(d),wrong={new:'較高分率不能創造乙醇，先合計兩股乙醇量。',anything:'不可行的組成不能靠負數截零修成真實過程。',created:'選股不能改變原總量，也不能省略另一股。',same:'物質身分、組成分母與數字必須分開，不因都寫百分比就相同。',universal:'閉合的收支不替代相平衡、方法與條件證據。',guarantee:'本課記帳沒有產品、飲用或食品安全預測。'};const correct=t.choice===r.answer;const s=freeze({...r,choice:t.choice,reason:text(t.reason),correct,feedback:correct?'此判讀符合本題指定資料與界線。':wrong[t.choice]??'先對照目前資料是否足夠、物流是否有量，再分開總量與分率。'});lock(t,'checked',s);lock(t,'reason',s.reason);return true;}
export function currentEthanolDiffers(d){const t=getEthanolTrial(d);return Boolean(t.checked&&(t.choice!==t.checked.choice||JSON.stringify(context(d))!==JSON.stringify(t.checked.context)));}
export function ethanolContextLabel(c){if(c.processId)return c.processId==='reaction'?'化學形成角色':'兩股物理分配角色';if(c.evidenceId)return c.evidenceId==='matched'?'另有相符條件組成證據（原創給定）':'僅有收支資料';if(!c.raw)return '固定組成基準題';const r=c.raw;return `模式${c.mode==='phase'?'由兩股組成推量':'指定Y股量'}；F=${r.feed}；z=${r.feedFraction}；${c.mode==='phase'?`x=${r.xFraction}`:`D=${r.draw}`}；y=${c.partitionKnown?r.drawFraction:'未給'}${c.streamId?'；所選'+(c.streamId==='draw'?'Y股':'X股'):''}`;}
export function formatEthanolNumber(v){if(v===null)return '未定義／未給';if(v===0)return '0';return Math.abs(v)<1e-6||Math.abs(v)>=1e9?v.toExponential(15):Number(v.toPrecision(16)).toString();}
export function buildEthanolSummary(d){valid(d);const lines=['乙醇：形成、分配與兩成分質量帳','所有數值為本課原創指定質量資料，不是實測汽液曲線、設備或操作建議。','共享數值草稿（未給資料或未核對時，不當成觀測）：',`F=${d.raw.feed}；z=${d.raw.feedFraction}；D=${d.raw.draw}；x=${d.raw.xFraction}；y草稿=${d.raw.drawFraction}`,`模式=${d.mode==='phase'?'由兩股組成推量':'指定Y股量'}；y資料=${d.partitionKnown?'已給':'未給，草稿值不能代填'}；所選股=${d.streamId==='draw'?'Y股':'X股'}`];for(const station of ETHANOL_STATIONS){const t=d.trials[station.id];if(!t||![t.choice,t.reason,t.revision,t.checked].some(Boolean))continue;const label=id=>station.options.find(o=>o.id===id)?.label??'未選';lines.push('',station.title,'目前判讀：'+label(t.choice),'核對前理由：',text(t.reason));if(t.checked){const s=t.checked;lines.push('初答（首次核對）：'+label(s.choice),'首次核對條件：'+ethanolContextLabel(s.context),`首次核對：${s.correct?'符合本題指定資料':'需修訂'}`,'核對說明：',s.explanation,'選項回饋：',s.feedback);if(s.result?.status==='unique')for(const [key,title]of [['feed','原總量'],['draw','Y股'],['residue','X股']]){const r=s.result[key];lines.push(`${title}：總質量${formatEthanolNumber(r.mass)}；乙醇${formatEthanolNumber(r.ethanol)}；水${formatEthanolNumber(r.water)}；乙醇質量分率${formatEthanolNumber(r.ethanolFraction)}`);}if(t.choice!==s.choice)lines.push('目前改選不倒改首次核對。');}else lines.push('尚未核對，不計為答對。');lines.push('修訂：',text(t.revision));}lines.push('','目前條件：'+ethanolContextLabel(context(d)));if(getEthanolTrial(d).checked)lines.push(currentEthanolDiffers(d)?'目前條件或選項已改；舊核對不代表目前結果。':'目前條件及選項與首次核對相同。');lines.push('','我的整合短答：',text(d.synthesis),'','初答首次核對固定；自由文字未自動評分。有限六槽，數值後改不另開無限歷史。成功附加的是可讀摘要，不重建未保存盤面。');return lines.join('\n');}
