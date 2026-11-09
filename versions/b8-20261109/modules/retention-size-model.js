// Original synthetic evidence-selection cases. No empirical trajectories or new general calculator.
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;},clone=v=>JSON.parse(JSON.stringify(v));
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:freeze(v),writable:false,configurable:false,enumerable:true});
export const RETENTION_SIZE_VERSION='retention-size/1';
export const RETENTION_SIZE_BRANCHES=freeze({
 retention:{title:'營養留存：先選分析與食用範圍，再核來源',anchor:'vitamin-true-retention',href:'#learn/vitamins/vitamin-true-retention/observe',guided:'總維生素C：乾濕基與分析對象 R_A',faded:'獨立遷移：添加來源與食用部分 R_B'},
 size:{title:'粒徑：先選群體、平均基準與量測方法',anchor:'colloid-size-distribution',href:'#learn/colloids/colloid-size-distribution/observe',guided:'物理粒級與方法摘要 S_A',faded:'獨立遷移：另一群體與體積粒級 S_B'}
});
export const RETENTION_SIZE_SOURCES=freeze([
 {id:'retention',title:'USDA Table of Nutrient Retention Factors,2007',url:'https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/retn06.pdf',scope:'比較處理前後營養總量須配合重量及分析基準；以下數字為原創合成報告，非USDA實測資料或保留因子。'},
 {id:'nutrition-true-retention-method',title:'Murphy等：Comparisons of Methods for Calculating Retentions',url:'https://www.ars.usda.gov/ARSUserFiles/80400525/Data/Classics/retn_murphy.pdf',scope:'真實留存與濃度比較不同；本台外加來源歸屬另由題設獨立帳提供，不由總量倒推出來源。'},
 {id:'emulsion-guelph-homogenization',title:'University of Guelph：Homogenization',url:'https://books.lib.uoguelph.ca/dairyscienceandtechnologyebook/chapter/homogenization-of-milk-and-milk-products/',scope:'粒徑與界面需配合模型及定義；球形幾何面積不是吸附覆蓋、聚集動力學或實際保存穩定性的量測。'},
 {id:'rs-source-nist-dls2015',title:'NIST SP1200-6：DLS尺寸（2015修訂1.2版）',url:'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1200-6.pdf',scope:'水動力學尺寸是依擴散與模型定義的量，不能把Rh直接當幾何直徑或任意平均值當d32。本題不教授DLS操作。'}
]);
export const RETENTION_SIZE_REMEDIATION=freeze([
 {token:'retention-total',branch:'retention',href:'#learn/vitamins/vitamin-true-retention/understand?rsprep=retention-total',label:'先將濃度換同範圍總量',why:'濃度必須乘相應重量及基準，再比較同一分析對象。'},
 {token:'retention-analyte',branch:'retention',href:'#learn/vitamins/vitamin-c-assay-identity/understand?rsprep=retention-analyte',label:'AA與總維生素C',why:'AA-only和以AA當量表示的AA+DHA不是同一被測量。'},
 {token:'retention-boundary',branch:'retention',href:'#learn/vitamins/vitamin-true-retention/understand?rsprep=retention-boundary',label:'食用範圍與原料來源',why:'全成品、食用部分、混來源總量與原料來源量分別核帳。'},
 {token:'retention-recovery',branch:'retention',href:'#learn/processing/analysis-recovery-matrix/understand?rsprep=retention-recovery',label:'分析回收與可比較性',why:'先核分析定義與回收資格，不能由單一比值宣告生成或吸收。'},
 {token:'size-basis',branch:'size',href:'#learn/colloids/colloid-size-distribution/understand?rsprep=size-basis',label:'數目、體積與矩平均',why:'同一群體的不同加權平均回答不同問題。'},
 {token:'size-metric',branch:'size',href:'#learn/colloids/colloid-size-distribution/understand?rsprep=size-metric',label:'Rh與幾何直徑',why:'水動力學半徑不能直接填入球形物理直徑公式。'},
 {token:'size-assumptions',branch:'size',href:'#learn/colloids/colloid-size-distribution/understand?rsprep=size-assumptions',label:'球形、相體積與群體',why:'6V/d32需同群體的分散相體積及相容的球形物理尺寸。'},
 {token:'size-interface',branch:'size',href:'#learn/colloids/colloid-interface-area/understand?rsprep=size-interface',label:'幾何面積與穩定證據',why:'面積可算不代表吸附覆蓋足夠或保存穩定性已測得。'}
]);
const question=(id,label,options,answer,why,remedies)=>({id,label,options,answer,why,remedies});
export const RETENTION_SIZE_DIAGNOSTIC=freeze({
 retention:[
 question('total','一項乾基濃度要換成該批總量，應配哪個重量？',[['matched','同批乾物質重量'],['wet','任意濕重'],['concentration','不必重量，只比濃度']],'matched','先配合分母；乾基濃度乘乾物質重量。',['retention-total']),
 question('analyte','原報AA-only，成品報AA+DHA，能直接稱總維生素C留存嗎？',[['same','不能；需一致分析定義與回收資格'],['yes','可以；都是維生素C'],['greater','大於100%即證合成']],'same','先匹配被測量，不能把不同分析對象或回收差異當留存。',['retention-analyte','retention-recovery']),
 question('origin','已知外加營養投入量，能從最終混合總量直接扣全部投入量嗎？',[['remaining','不能；須該食用範圍內仍存的添加來源量'],['input','可以；投入量就是最後存量'],['cap','先把超過100%的結果截成100%']],'remaining','外加投入不等於食用部分仍存的外加來源量。',['retention-boundary'])
 ],
 size:[
 question('mean','球形模型A=6V/d32中的d32可用哪個值替代？',[['compatible','同群體、相容物理直徑分布算得的d32'],['any','任何標成平均粒徑的值'],['radius','直接填水動力學半徑Rh']],'compatible','d32為體積/表面積對應的矩比，不是任意平均值。',['size-basis','size-metric']),
 question('population','物理粒徑分布與V來自不同批或過濾後子群，應？',[['match','先匹配群體及體積範圍'],['pool','只要單位相同就合併'],['double','一律把半徑乘2後視為d32']],'match','相同單位不能修復群體與量測定義不一致。',['size-assumptions','size-metric']),
 question('stability','球形面積已算出，是否代表乳化食品穩定性已證明？',[['evidence','否；還需界面、聚集與相關端點證據'],['yes','是；面積唯一決定穩定性'],['small','平均越小必定所有品質越好']],'evidence','幾何量與吸附/聚集及實際品質證據不同。',['size-interface'])
 ]
});
export const RETENTION_SIZE_VIEWS=freeze([{id:'diagnostic',label:'可跳過的先備診斷'},{id:'guided',label:'先選資料，再推導與部分提示'},{id:'faded',label:'獨立選資料與短答，再選自核'}]);
const model='全部為原創合成報告；只作條件式推理，非實驗數據、營養吸收或食品安全保證。先勾納入目標推理的資料，再讀所選記錄；可讀後排除不相容資料。';
const records=freeze({
 retention:{guided:{id:'R_A',model,task:'求同批食用成品相對原料的總維生素C留存百分比。先選相容記錄、換總量，再說理由與限制。',qualification:'總C定義為AA+DHA並以mg AA當量表示；本題指定分析回收已配對可比，無添加C；同批乾濕基須各自配對。'},faded:{id:'R_B',model,task:'判讀食用部分相對原料的營養留存；自行選證據、計算可得量，說明來源及結論界線。',qualification:'另一次配製，含帶入C的添加物。各報告總C皆mg AA當量；食用部分有獨立分析，不假設全成品均勻；只問實際食用部分。'}},
 size:{guided:{id:'S_A',model,task:'估同一群體Q的球形幾何總界面面積（m²），先選足夠記錄，再說方法與限制。',qualification:'物理球形直徑及油相體積為題設精確值；不含非球形修正、吸附或聚集預測。'},faded:{id:'S_B',model,task:'判讀另一群體P能支持的幾何面積與產品結論；自行選資料、計算、說明適用條件與缺項。',qualification:'群體P與Q不同。物理球形幾何為指定模型；不同方法及平均基準不能自動互換。'}}
});
// This private bank is not serialized wholesale. Only actually opened AND selected records enter a context.
const cards=freeze({
 retention:{guided:[
 {id:'ra-analysis',label:'分析報告甲',data:{scope:'R_A同批總C',raw:'2mg/g乾物質',consumed:'0.2mg/g濕重'}},
 {id:'ra-mass',label:'批次份量記錄',data:{scope:'R_A同批',rawDryG:8,consumedWetG:60}},
 {id:'ra-other',label:'分析報告乙',data:{scope:'R_A同批AA-only',raw:'1mg/g乾物質',consumed:'0.15mg/g濕重'}},
 {id:'ra-wet',label:'另一個重量摘要',data:{scope:'R_A同批原料',rawWetG:80,qualification:'不是乾物質重量'}}
 ],faded:[
 {id:'rb-input',label:'投入記錄',data:{scope:'R_B總C投入',nativeMg:40,addedInputMg:20}},
 {id:'rb-consumed',label:'食用部分報告',data:{scope:'R_B獨立取樣的食用部分',wetG:160,totalC:'30mg/100g濕重'}},
 {id:'rb-whole',label:'全部成品報告',data:{scope:'R_B全成品，非均勻假設',wetG:200,totalC:'26mg/100g濕重'}},
 {id:'rb-other',label:'另一分析指標',data:{scope:'R_B食用部分AA-only',wetG:160,AA:'20mg/100g濕重'}},
 {id:'rb-origin',label:'來源歸屬獨立附頁',data:{scope:'R_B食用160g內，獨立來源帳',addedSourceRemainingMg:18,qualification:'是仍存添加來源量，不是投入量'}}
 ]},
 size:{guided:[
 {id:'sa-classes',label:'粒級與顆數報告',data:{population:'Q',physicalDiameterUm:[2,4],numberRatio:[8,1]}},
 {id:'sa-volume',label:'相體積與幾何資格',data:{population:'Q',oilMl:2,model:'物理直徑的球形油滴'}},
 {id:'sa-method',label:'另一方法平均值',data:{population:'Q',hydrodynamicRadiusUm:1.5,qualification:'合成Rh摘要；非幾何直徑，未由此粒級分布推導或驗證DLS擬合'}},
 {id:'sa-moment',label:'幾何矩平均摘要',data:{population:'Q',d43Um:3}}
 ],faded:[
 {id:'sb-method',label:'水動力學摘要',data:{population:'P',hydrodynamicRadiusUm:2,qualification:'合成Rh摘要；不能當物理d32，未由此粒級分布推導或驗證DLS擬合'}},
 {id:'sb-moment',label:'幾何矩平均摘要',data:{population:'P',d43Um:4}},
 {id:'sb-volume',label:'相體積與幾何資格',data:{population:'P',oilMl:3,model:'物理直徑的球形油滴'}},
 {id:'sb-classes',label:'粒級原始附頁',data:{population:'P',physicalDiameterUm:[3,6],classOilMl:[2,1]}},
 {id:'sb-other',label:'另一批粒級報告',data:{population:'Q',physicalDiameterUm:[2,4],numberRatio:[8,1]}}
 ]}
});
export const RETENTION_SIZE_WORKED=freeze({
 retention:{given:'獨立W：同一分析對象，原料4mg/g乾物質×5g乾物；食用成品1mg/g濕重×12g。',reason:'只選同對象且重量分母匹配的報告，得20mg與12mg，故60%。若另一報告只測AA，不混入總C；W不是R_A或R_B。'},
 size:{given:'獨立W：某群體指定物理球形d32=6µm，油相V=1mL；另附一個不同群體的Rh。',reason:'選同群體的物理d32及V，A=6×10⁻⁶/(6×10⁻⁶)=1m²。不同群體Rh不納入；面積不單獨證明穩定。W不是S_A或S_B。'}
});
function branchInfo(branch){if(typeof branch!=='string'||!Object.hasOwn(RETENTION_SIZE_BRANCHES,branch))throw new RangeError('Unknown retention-size prerequisite branch');return RETENTION_SIZE_BRANCHES[branch];}
function validView(view){if(!RETENTION_SIZE_VIEWS.some(x=>x.id===view))throw new RangeError('Unknown retention-size prerequisite task');return view;}
const trial=()=>({answers:{},response:'',revision:'',firstChoices:{},beforeSupport:[],selectedCards:[],openedCards:[],firstSelection:null,readRequests:[],independent:null,first:null,revisionChecks:[]});
export function createRetentionSizeDraft(branch){branchInfo(branch);const d={view:'diagnostic',trials:Object.fromEntries(RETENTION_SIZE_VIEWS.map(x=>[x.id,trial()])),workedSeen:false,hintSeen:false,recordSeen:false,sourcesSeen:false,verificationSeen:false,skipped:false,continueRequests:0,remedyRequests:[],contexts:[],displayLog:[],details:{}};lock(d,'branch',branch);return d;}
export function getRetentionSizeTrial(d){branchInfo(d?.branch);validView(d?.view);if(!d?.trials?.[d.view])throw new TypeError('A retention-size prerequisite draft is required');return d.trials[d.view];}
export function setRetentionSizeView(d,view){getRetentionSizeTrial(d);d.view=validView(view);return d;}
export function retentionSizeCardOptions(branch,view){branchInfo(branch);validView(view);return view==='diagnostic'?[]:cards[branch][view].map(({id,label})=>({id,label}));}
export function retentionSizeContext(d){const t=getRetentionSizeTrial(d);return d.view==='diagnostic'?{version:RETENTION_SIZE_VERSION,branch:d.branch,view:d.view,given:'核對總量、分析對象、群體與模型；沒有實際食品操作。'}:{version:RETENTION_SIZE_VERSION,branch:d.branch,view:d.view,...clone(records[d.branch][d.view]),selected:[...t.selectedCards],records:Object.fromEntries(cards[d.branch][d.view].filter(c=>t.selectedCards.includes(c.id)&&t.openedCards.includes(c.id)).map(c=>[c.id,clone(c.data)]))};}
export function setRetentionSizeCard(d,id,checked){const t=getRetentionSizeTrial(d);if(typeof checked!=='boolean'||!retentionSizeCardOptions(d.branch,d.view).some(c=>c.id===id))throw new RangeError('Foreign or invalid evidence card');if(checked&&!t.selectedCards.includes(id))t.selectedCards.push(id);else if(!checked)t.selectedCards=t.selectedCards.filter(x=>x!==id);return d;}
export function readRetentionSizeCards(d){const t=getRetentionSizeTrial(d);if(d.view==='diagnostic'||!t.selectedCards.length)return false;const fresh=t.selectedCards.filter(x=>!t.openedCards.includes(x));if(!fresh.length)return false;const before=contextId(d);beforeSupport(d,'records');if(!t.firstSelection)lock(t,'firstSelection',{ids:[...t.selectedCards],contextId:before,exposure:exposure(d)});t.openedCards.push(...fresh);const after=contextId(d);t.readRequests.push(freeze({ids:[...t.selectedCards],opened:fresh,before,after}));return true;}
function contextId(d){const c=retentionSizeContext(d),s=JSON.stringify(c);let i=d.contexts.findIndex(x=>JSON.stringify(x)===s);if(i<0){d.contexts.push(freeze(c));i=d.contexts.length-1;}return i+1;}
export function markRetentionSizeShown(d){const id=contextId(d);if(d.displayLog.at(-1)!==id)d.displayLog.push(id);return id;}
const exposure=d=>({worked:d.workedSeen,hint:d.hintSeen,cards:Object.fromEntries(Object.entries(d.trials).filter(([v])=>v!=='diagnostic').map(([v,t])=>[v,[...t.openedCards]])),sources:d.sourcesSeen,verification:d.verificationSeen,shown:[...new Set(d.displayLog)]});
export function setRetentionSizeAnswer(d,key,raw){getRetentionSizeTrial(d);if(d.view==='faded'&&!d.verificationSeen)throw new RangeError('Open prompted verification after keeping the independent draft');const t=getRetentionSizeTrial(d),keys=d.view==='diagnostic'?RETENTION_SIZE_DIAGNOSTIC[d.branch].map(x=>x.id):['amount','claim','evidence'];if(!keys.includes(key)||typeof raw!=='string')throw new TypeError('Unknown answer or non-text raw value');t.answers[key]=raw;if(raw&&!Object.hasOwn(t.firstChoices,key))lock(t.firstChoices,key,{value:raw,contextId:contextId(d),exposure:exposure(d)});return d;}
export function setRetentionSizeText(d,kind,raw){const t=getRetentionSizeTrial(d);if(!['response','revision'].includes(kind)||typeof raw!=='string')throw new TypeError('Text is required');if(kind==='response'&&(t.first||t.independent))return false;t[kind]=raw;return true;}
function beforeSupport(d,kind){const t=getRetentionSizeTrial(d);t.beforeSupport.push(freeze({kind,answers:clone(t.answers),response:t.response,revision:t.revision,contextId:contextId(d),exposure:exposure(d)}));}
export function sealRetentionSizeIndependent(d){const t=getRetentionSizeTrial(d);if(d.view!=='faded')throw new RangeError('Independent snapshot belongs to the faded task');if(t.independent)return false;lock(t,'independent',{response:t.response,contextId:contextId(d),exposure:exposure(d),answered:Boolean(t.response.trim()),prompt:'generic-only'});lock(t,'response',t.response);return true;}
export function requestRetentionSizeSupport(d,kind){getRetentionSizeTrial(d);const flag={worked:'workedSeen',hint:'hintSeen',sources:'sourcesSeen',verification:'verificationSeen'}[kind];if(!flag||(['worked','hint'].includes(kind)&&d.view!=='guided')||(['verification'].includes(kind)&&d.view!=='faded'))throw new RangeError('Unsupported support for this task');if(d[flag])return false;beforeSupport(d,kind);if(kind==='verification')sealRetentionSizeIndependent(d);d[flag]=true;return true;}
export function skipRetentionSizeDiagnostic(d){getRetentionSizeTrial(d);d.skipped=true;d.view='guided';return d;}
export function requestRetentionSizeRemedy(d,token){if(!RETENTION_SIZE_REMEDIATION.some(r=>r.token===token&&r.branch===d.branch))throw new RangeError('Foreign or unknown remedy');d.remedyRequests.push(freeze({token,contextId:contextId(d)}));}
export function requestRetentionSizeContinue(d){getRetentionSizeTrial(d);d.continueRequests++;}
export function parseRetentionSizeAmount(raw){if(typeof raw!=='string'||!raw.trim()||raw.length>128)return null;const s=raw.trim(),m=/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i.exec(s);if(!m)return null;const n=Number(s),fraction=m[3]??m[4]??'',digits=(m[2]??'')+fraction,coefficient=BigInt(digits||'0')*(m[1]==='-'?-1n:1n),power=Number(m[5]??'0')-fraction.length;if(!Number.isFinite(n)||!Number.isInteger(power)||Math.abs(power)>1000||(coefficient!==0n&&n===0))return null;return {numerator:power>=0?coefficient*10n**BigInt(power):coefficient,denominator:power<0?10n**BigInt(-power):1n};}
export function retentionSizeFields(branch,view){branchInfo(branch);validView(view);if(view==='diagnostic')return RETENTION_SIZE_DIAGNOSTIC[branch];const r=branch==='retention';return [
 {id:'amount',type:'number',label:r?(view==='guided'?'總C留存百分比（填數字）':'食用部分原料來源總C留存百分比（不足填「資料不足」）'):'球形幾何總面積，以m²計（不足填「資料不足」）'},
 {id:'claim',label:'哪項直接回答本題所求的量／範圍？',options:r?[['matched','同分析與重量基準的總量比可算'],['mixed','混來源比可算，原料來源量仍缺'],['native','來源帳與食用範圍已配對，可算原料來源'],['input','外加投入量可直接當食用部分仍存量']]:[['geometry','相容群體的物理粒級與油相體積支持面積'],['mean-only','已知體積及矩平均，面積仍不唯一'],['rh','任意Rh乘2就是d32'],['pool','不同群體只要單位相同即可合併']]},
 {id:'evidence',label:'結論界線與資料選擇',options:r?[['bounded','只納相容總C及範圍；不由比值證吸收或生成'],['all','全部報告一起代入才完整'],['cap','超過100%必為錯誤，先截100%']]:[['bounded','匹配群體/方法/加權與球形條件；不據面積保證穩定'],['all','所有平均值相加就是分布'],['stable','面積算出即代表產品穩定']]}
 ];}
const evidenceStatus=(branch,view,evidence)=>{const available=retentionSizeCardOptions(branch,view).map(x=>x.id),s=evidence?.selected??[],o=evidence?.opened??[];if(!Array.isArray(s)||!Array.isArray(o)||s.some(x=>!available.includes(x))||o.some(x=>!available.includes(x)))throw new TypeError('Invalid evidence selection');const used=s.filter(x=>o.includes(x));const has=id=>used.includes(id),r=branch==='retention',g=view==='guided',base=r?(g?has('ra-analysis')&&has('ra-mass'):has('rb-input')&&has('rb-consumed')):(g?has('sa-classes')&&has('sa-volume'):has('sb-volume')&&(has('sb-moment')||has('sb-classes'))),full=g?base:r?base&&has('rb-origin'):base&&has('sb-classes'),bad=r?(g?['ra-other']:['rb-other']):(g?['sa-method']:['sb-method','sb-other']);return{base,full,bad:used.filter(x=>bad.includes(x)),unread:s.some(x=>!o.includes(x))};};
export function evaluateRetentionSize(branch,view,answers={},evidence={selected:[],opened:[]}){branchInfo(branch);validView(view);if(!answers||typeof answers!=='object')answers={};let fields;if(view==='diagnostic')fields=RETENTION_SIZE_DIAGNOSTIC[branch].map(q=>({id:q.id,label:q.label,complete:q.options.some(x=>x[0]===answers[q.id]),correct:answers[q.id]===q.answer,expected:q.options.find(x=>x[0]===q.answer)[1],why:q.why,remedies:q.remedies}));else{
 const r=branch==='retention',g=view==='guided',s=evidenceStatus(branch,view,evidence),qualified=s.base&&!s.bad.length&&!s.unread,unknown=!s.full,number=r?'75':g?'4.5':'5',expected=unknown?'資料不足':number,parsed=parseRetentionSizeAmount(answers.amount),exact=parseRetentionSizeAmount(number),qs=retentionSizeFields(branch,view),claim=r?(g?'matched':s.full?'native':'mixed'):s.full?'geometry':'mean-only';
 const whyAmount=!s.base?'尚未讀取並選入足夠的相容記錄；先核分析/群體與分母，不從未開資料補數。':r?(g?'乾基2×8=16mg；濕基0.2×60=12mg，總C留存12/16×100=75%。':unknown?'食用混來源30×160/100=48mg；相對原料40mg的120%不是原料來源留存。外加投入不能當仍存量。':'食用總C48mg減同範圍仍存添加來源18mg，原料來源30mg；30/40×100=75%。'):(g?'N比8:1且d為2/4µm，兩粒級體積相等；d32=8/3µm，A=6V/d32=4.5m²。':unknown?'同群體V與d43是可知量；單一矩平均不唯一決定分布或d32，不能用Rh代替。':'同群體體積粒級給A=6×2/3+6×1/6=5m²，d32=18/5µm；與d43=4µm相容。');
 const whySelection=s.bad.length?'目前納入不相容目標的記錄：'+s.bad.join('、')+'。須匹配本題分析對象、量測方法與群體；AA-only不能替代總C，Rh不能替代物理直徑，不同群體不能直接合併。讀後可排除不相容資料。':s.unread?'仍有勾選而未讀的記錄；先保留草稿並讀取，不能用未見數值。':!s.base?'目前資料組合尚不足支持指定推理。':'選定資料已配對目標範圍；相容的輔助記錄可作基準換算或交叉核對，仍不能代替必要資料。';
 const claimWhy=qualified&&r&&!g&&answers.claim==='matched'?whySelection+'這個總量可比的陳述可能成立，但沒有回答食用部分的原料來源能否辨識；本題須按已開啟的來源資料，區分仍缺與已配對。':qualified&&r&&g&&answers.claim==='native'?whySelection+'本題無添加C且範圍相同，總C留存與原料來源C留存等價；這不表示已做獨立來源追蹤。':whySelection;
 fields=[{id:'amount',label:qs[0].label,complete:typeof answers.amount==='string'&&(answers.amount.trim()==='資料不足'||parsed!==null),correct:qualified&&(unknown?answers.amount?.trim()==='資料不足':parsed!==null&&parsed.numerator*exact.denominator===exact.numerator*parsed.denominator),expected:s.base?expected:'先選讀相容記錄',why:whyAmount,remedies:r?['retention-total','retention-boundary']:['size-basis','size-assumptions']},
 ...[['claim',claim,claimWhy,r?['retention-analyte','retention-boundary']:['size-metric','size-assumptions']],['evidence','bounded',r?'總量比須匹配分析、乾濕基與實際食用範圍；外加來源另核，不把大於100%當生成或錯誤。':'球形幾何需物理直徑及相體積；Rh、矩平均、群體不同不能互換，面積不等於穩定性。',r?['retention-recovery']:['size-interface']]].map(([id,key,why,remedies])=>{const q=qs.find(x=>x.id===id);return{id,label:q.label,complete:q.options.some(x=>x[0]===answers[id]),correct:qualified&&(answers[id]===key||(r&&g&&id==='claim'&&answers[id]==='native')),expected:s.base?q.options.find(x=>x[0]===key)[1]:'先選讀相容記錄',why,remedies};})];
 }return freeze({fields,correctCount:fields.filter(x=>x.correct).length,total:fields.length,complete:fields.every(x=>x.complete),correct:fields.every(x=>x.correct),reasonAutograded:false,conversionPrediction:null,targetRetention:null,foodSafety:null});}

function signature(d){const t=getRetentionSizeTrial(d);return JSON.stringify({answers:t.answers,response:t.response,revision:t.revision,context:retentionSizeContext(d)});}
export function latestRetentionSizeCheck(d){const t=getRetentionSizeTrial(d);return t.revisionChecks.at(-1)??t.first;}
export function retentionSizeStale(d){const c=latestRetentionSizeCheck(d);return Boolean(c&&c.signature!==signature(d));}
export function checkRetentionSize(d){const t=getRetentionSizeTrial(d);if(d.view==='faded'&&!d.verificationSeen)throw new RangeError('Keep an independent draft and explicitly open prompted verification first');const sig=signature(d);if(latestRetentionSizeCheck(d)?.signature===sig)return false;const first=!t.first,s={answers:clone(t.answers),response:first&&d.view!=='faded'?t.response:t.revision,contextId:contextId(d),exposure:exposure(d),result:evaluateRetentionSize(d.branch,d.view,t.answers,{selected:t.selectedCards,opened:t.openedCards}),signature:sig};if(first){if(!t.independent)lock(t,'response',t.response);lock(t,'first',s);}else t.revisionChecks.push(freeze(s));return true;}
export function retentionSizeReference(d){getRetentionSizeTrial(d);return d.branch==='retention'?['先寫分析對象及實際食用範圍，再選分母相配的重量與濃度。','將同對象換成總量；乾基不能直接乘濕重，AA不能自動代總C。','外加投入與食用部分仍存量不同；混來源比不自動是原料來源留存。','由可比資料給條件式結論；比值不單獨證吸收、生成或品質。']:['先配對群體、物理直徑與分散相體積；分數目或體積加權。','d32支援球形A=6V/d32；d43或單一平均不唯一決定分布。','Rh是水動力學半徑，2Rh仍不是自動成立的物理d32。','可算面積仍需吸附、聚集及品質證據才能談產品穩定。'];}
export function buildRetentionSizeSummary(d){getRetentionSizeTrial(d);const texts=[],feedback=[],exposures=[],policy={reasonAutograded:false,conversionPrediction:null,targetRetention:null,foodSafety:null};let policyUsed=false;const intern=(arr,v,prefix)=>{const str=typeof v==='string'?v:JSON.stringify(v);let i=arr.findIndex(x=>x===str);if(i<0){arr.push(str);i=arr.length-1;}return prefix+(i+1);},tid=v=>intern(texts,v,'T'),xid=v=>intern(exposures,v,'X'),fid=v=>intern(feedback,v,'F');
 const packedResult=r=>{const out={...r,fields:r.fields.map(fid)};if(Object.entries(policy).every(([k,v])=>Object.hasOwn(r,k)&&r[k]===v)){for(const k of Object.keys(policy))delete out[k];out.policy='G1';policyUsed=true;}return out;},snap=s=>[s.answers,tid(s.response),s.contextId,xid(s.exposure),s.result?packedResult(s.result):null];
 const rows=Object.entries(d.trials).filter(([id,v])=>d.displayLog.some(n=>d.contexts[n-1]?.view===id)||Object.keys(v.answers).length||v.response||v.revision||v.first||v.beforeSupport.length).map(([id,v])=>({slot:id,currentAnswers:v.answers,response:tid(v.response),revision:tid(v.revision),independent:v.independent?{text:tid(v.independent.response),context:v.independent.contextId,exposure:xid(v.independent.exposure),answered:v.independent.answered,prompt:v.independent.prompt}:null,cards:{selected:v.selectedCards,opened:v.openedCards,firstSelection:v.firstSelection?{ids:v.firstSelection.ids,context:v.firstSelection.contextId,exposure:xid(v.firstSelection.exposure)}:null,readRequests:v.readRequests},firstChoices:Object.fromEntries(Object.entries(v.firstChoices).map(([k,s])=>[k,[s.value,s.contextId,xid(s.exposure)]])),beforeSupport:v.beforeSupport.map(s=>[s.kind,...snap(s).slice(0,4),tid(s.revision)]),firstChecked:v.first?snap(v.first):null,revisionChecks:v.revisionChecks.map(snap)}));
 const packRegistry=(items,prefix)=>items.map((c,i)=>{let best=JSON.stringify(c);for(let j=0;j<i;j++){const prior=items[j],omit=Object.keys(prior).filter(k=>!Object.hasOwn(c,k)),delta=Object.fromEntries(Object.entries(c).filter(([k,v])=>!Object.hasOwn(prior,k)||JSON.stringify(v)!==JSON.stringify(prior[k]))),packed={base:prefix+(j+1),...(omit.length?{omit}:{}),...delta},text=JSON.stringify(packed);if(text.length<best.length)best=text;}return prefix+(i+1)+' '+best;});const contextRows=packRegistry(d.contexts,'C');
 return [`【${RETENTION_SIZE_BRANCHES[d.branch].title}｜${RETENTION_SIZE_VERSION}】`,'合成報告；獨立短答與提示後自核分開；自由理由未自動判分，不稱盲測。',`branch=${d.branch}；實際顯示順序C=${JSON.stringify(d.displayLog)}；跳診斷=${d.skipped}；返回原課請求=${d.continueRequests}`,`目前曝光=${xid(exposure(d))}；補救請求=${JSON.stringify(d.remedyRequests)}`,'C題設及X曝光：含base者先展開base、刪omit欄位、以其餘delta覆寫還原；只記實際引用。',...contextRows,d.workedSeen?'已顯示獨立W：'+JSON.stringify(RETENTION_SIZE_WORKED[d.branch]):'未顯示獨立W。',d.hintSeen?'已顯示部分提示：先選相容分析/群體、分母與範圍，再核總量或幾何及限制。':'未顯示部分提示。','序列欄位順序：firstChoices=[value,C,X]；firstChecked/revisionChecks=[answers,T,C,X,feedback]；beforeSupport=[kind,answers,T,C,X,revisionT]。其餘具名欄位照存。',JSON.stringify(rows),'曝光X：',...packRegistry(exposures.map(x=>JSON.parse(x)),'X'),...(policyUsed?['共用核對政策G1（feedback含policy時合併還原）：',`G1 ${JSON.stringify(policy)}`]:[]),'只有已核對者的feedback F：',...feedback.map((f,i)=>`F${i+1} ${f}`),'摘要格式：raw-T/2；原文T長度索引（UTF-16 code units；依T1、T2…順序）：'+JSON.stringify(texts.map(s=>s.length)),'完整原文T（相同文字只登一次）：',...texts.map((s,i)=>`T${i+1}:\n${s}\n`),'來源ID：'+RETENTION_SIZE_SOURCES.map(s=>s.id).join('；')].join('\n');}
