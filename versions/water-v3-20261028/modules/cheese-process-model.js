// Finite original product-role exercises. These are not production or culture instructions.
export const CHEESE_PROCESS_ID = 'cheese-process-reasoning';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CHEESE_SOURCES=freeze([
  {id:'cheese-source-guelph-families',label:'University of Guelph：Cheese Families',url:'https://books.lib.uoguelph.ca/cheesemakingtechnologyebook/chapter/cheese-families/',scope:'權威教材區分不同凝乳家族及鮮食／熟成產品。本課只採代表情境，不說所有天然乾酪必用凝乳酵素、必經熟成或相同的分離方式。'},
  {id:'cheese-source-guelph-basic',label:'University of Guelph：The Basic Process',url:'https://books.lib.uoguelph.ca/cheesemakingtechnologyebook/chapter/1-introduction-to-cheese-making/',scope:'已讀開頭文字，採凝乳與乳清的物料身分：乳清不是純水，分離不能當全部蛋白與脂肪皆留在凝乳。限定選定代表，不採圖形、分配率或製造設定。'},
  {id:'cheese-source-guelph-ripening',label:'University of Guelph：Ripening and Packaging',url:'https://books.lib.uoguelph.ca/cheesemakingtechnologyebook/chapter/5-2-ripening-and-packaging/',scope:'已讀General Principles及選定蛋白／脂肪水解文字；熟成的生化改變不同於乳清分離，風味與質地依產品及條件而異。不採培養條件、時間表或通用品質曲線。'},
  {id:'cheese-source-guelph-processed',label:'University of Guelph：Processed Cheese',url:'https://books.lib.uoguelph.ca/cheesemakingtechnologyebook/chapter/8-7-processed-cheese/',scope:'採既有天然乾酪重新組織，以及乳化鹽改變Ca—casein關係、蛋白水合與乳化的概念；不採配方、製造條件、舊法規或安全門檻。'},
  {id:'cheese-source-deshwal2024',label:'Deshwal 等（2024）：加工乾酪中鈣與蛋白的分配研究',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11314599/',scope:'已核讀原始研究的選定文字：水可萃取鈣可涉及可溶與蛋白相關的鹽；所成複合物受鹽類與pH等條件影響。水可萃取不等於全部游離Ca；本課不移植實驗數值或預測產品質地。'}
]);
export const CHEESE_ROUTES=freeze([
  {id:'fresh',label:'本課指定：鮮食酸凝天然乾酪',input:'milk',coagulation:'acid',separate:true,ripening:false,emulsify:false,note:'給定此例以乳為起點，經酸凝並分出乳清，鮮食而不另設熟成；不是所有鮮食乾酪的共同流程。'},
  {id:'ripened',label:'本課指定：酵素凝乳並熟成的天然乾酪',input:'milk',coagulation:'enzyme',separate:true,ripening:true,emulsify:false,note:'給定此例由乳凝乳、分出乳清並熟成；不代表其他天然乾酪一定如此。'},
  {id:'processed',label:'本課指定：既有乾酪＋乳化鹽的加工乾酪',input:'cheese',coagulation:'none',separate:false,ripening:false,emulsify:true,note:'給定原料已是天然乾酪，本次著重混合與重新組織；原料可已熟成，本次沒有另設熟成或重新由乳製凝乳。'}
]);
export const CHEESE_PATH_FIELDS=freeze([
  {id:'input',label:'本段起始原料',options:[{id:'milk',label:'乳'},{id:'cheese',label:'既有天然乾酪'}]},
  {id:'coagulation',label:'本段新做的凝乳作用',options:[{id:'acid',label:'酸凝'},{id:'enzyme',label:'凝乳酵素作用'},{id:'none',label:'本段不重新由乳做凝乳'}]},
  {id:'separate',label:'本段是否分出乳清',boolean:true},
  {id:'ripening',label:'本段是否另設熟成',boolean:true},
  {id:'emulsify',label:'本段是否以乳化鹽改變蛋白的乳化角色',boolean:true}
]);
export const CHEESE_ROLE_FOCI=freeze([
  {id:'calcium',label:'Ca—casein關係',relation:'乳化鹽與鈣交互作用 → 改變酪蛋白之間的關聯',answer:'calcium'},
  {id:'water',label:'蛋白與水',relation:'Ca—casein關係改變 → 蛋白分散／水合行為改變',answer:'water'},
  {id:'fat',label:'蛋白與脂肪',relation:'蛋白狀態與水合改變 → 蛋白參與脂肪乳化的條件改變',answer:'fat'}
]);
export const CHEESE_STATIONS=freeze([
  {id:'path',title:'1．把產品的角色鏈接起來',prompt:'先看選定產品的給定條件，再改變下方角色。這條概念鏈是否與該例一致？這只核對描述，不預測真實產品會否成功。',options:[{id:'consistent',label:'角色鏈與本例給定描述一致；尚未因此驗證品質或安全'},{id:'mismatch',label:'至少一個角色與本例描述不符，應指出是哪個環節'},{id:'same-process',label:'所有乾酪都必須使用同一凝乳和熟成流程'}]},
  {id:'whey',title:'2．分出乳清，物料真的都去哪裡？',prompt:'某天然乾酪情境把凝乳與乳清分開。哪個敘述保留物料身分？',options:[{id:'mixture',label:'乳清含水及可溶成分，亦可含乳清蛋白等；實際分配仍依產品與方法'},{id:'water-only',label:'乳清是純水，全部蛋白與脂肪必定100%留在凝乳'},{id:'gone',label:'分離後乳清成分不再屬於原乳的物料收支'}]},
  {id:'role',title:'3．沿Ca、蛋白、水與脂肪追因果',prompt:'選一條要解釋的關係。哪個敘述最能補上目前標出的環節，而沒有把它當成實測品質保證？',options:[{id:'calcium',label:'乳化鹽可改變Ca—casein關係；不是只用名稱便指定酸化程度'},{id:'water',label:'酪蛋白狀態改變會影響其分散／水合；水合不是新生成蛋白質'},{id:'fat',label:'蛋白可參與脂肪乳化；乳化鹽的角色不宜簡化成普通界面活性劑直接包住全部脂肪'},{id:'universal',label:'只要增加任何乳化鹽，所有配方都必定更軟、更易融且更安全'}]},
  {id:'ripening',title:'4．熟成在哪一段，哪些不能概括？',prompt:'依目前選定產品，怎樣解釋「熟成」才沒有偷換本段與原料歷史？',options:[{id:'fresh',label:'此鮮食酸凝例沒有另設熟成；不能據此說所有天然乾酪都不熟成'},{id:'ripened',label:'此選定天然乾酪有熟成；不能推成所有天然乾酪必經同樣熟成'},{id:'processed',label:'此加工段沒有另設熟成，但使用的天然乾酪可能早已熟成；不能倒改原料歷史'},{id:'all',label:'天然或加工乾酪一律必須在本段新做完全相同的熟成'}]},
  {id:'evidence',title:'5．研究量到的鈣，等於哪個物件？',prompt:'Deshwal等研究區分水可萃取的鈣與蛋白／鹽相關狀態。只看到「水可萃取鈣」便能把它全稱為游離Ca離子嗎？',options:[{id:'fraction',label:'不能；這是方法定義的萃取部分，可含不同形態，需另有物種與方法證據'},{id:'free',label:'可以；凡能被水萃取的鈣必定全是游離Ca離子'},{id:'quality',label:'可以；這一項便足以決定硬度、融化、感官與安全'}]},
  {id:'transfer',title:'6．少了油析出，就把全部品質判好了？',prompt:'原創假想比較僅給定：同條件觀察下，配方甲的油析出較少；未量測硬度、融化、感官或安全。如何修訂「甲必定全面較好」？',options:[{id:'qualified',label:'先保留油析出這項觀察，其他特性需相符量測；不能用一個端點包辦全部品質'},{id:'all-good',label:'油析出較少就等於更軟、更易融、更好吃又安全'},{id:'no-effect',label:'其他資料未給，所以反過來可以證明甲在所有特性都沒作用'}]}
]);
const routes=new Map(CHEESE_ROUTES.map(x=>[x.id,x])),stations=new Map(CHEESE_STATIONS.map(x=>[x.id,x])),foci=new Map(CHEESE_ROLE_FOCI.map(x=>[x.id,x]));
const text=v=>typeof v==='string'?v:'';
const lock=(o,k,v)=>Object.defineProperty(o,k,{value:v,writable:false,configurable:false,enumerable:true});
export function getCheeseRoute(id){const r=routes.get(id);if(!r)throw new RangeError('Unknown cheese route');return r;}
export function getCheeseStation(id){const s=stations.get(id);if(!s)throw new RangeError('Unknown cheese station');return s;}
export function getCheeseFocus(id){const f=foci.get(id);if(!f)throw new RangeError('Unknown cheese role focus');return f;}
function pathValues(route){return Object.fromEntries(CHEESE_PATH_FIELDS.map(f=>[f.id,route[f.id]]));}
function validatePath(value){
  if(!value||typeof value!=='object'||Object.keys(value).length!==5||CHEESE_PATH_FIELDS.some(f=>!Object.hasOwn(value,f.id)||(f.boolean?typeof value[f.id]!=='boolean':!f.options.some(o=>o.id===value[f.id]))))throw new TypeError('Exactly five valid conceptual role fields are required');
  return value;
}
function valid(d){
  if(!d||typeof d!=='object'||!d.paths||!d.trials||typeof d.trials!=='object'||Array.isArray(d.trials))throw new TypeError('A cheese draft is required');
  getCheeseStation(d.stationId);getCheeseRoute(d.routeId);getCheeseFocus(d.focusId);
  for(const r of CHEESE_ROUTES)validatePath(d.paths[r.id]);return d;
}
export function createCheeseDraft(){return {stationId:'path',routeId:'fresh',focusId:'calcium',paths:Object.fromEntries(CHEESE_ROUTES.map(r=>[r.id,pathValues(r)])),trials:{},synthesis:'',details:{}};}
export function setCheeseControl(d,key,value){
  valid(d);
  if(key==='stationId')getCheeseStation(value);
  else if(key==='routeId'){if(!['path','ripening'].includes(d.stationId))throw new RangeError('Unavailable route control');getCheeseRoute(value);}
  else if(key==='focusId'){if(d.stationId!=='role')throw new RangeError('Unavailable focus control');getCheeseFocus(value);}
  else{
    const f=CHEESE_PATH_FIELDS.find(x=>x.id===key);
    if(d.stationId!=='path'||!f||(f.boolean?typeof value!=='boolean':!f.options.some(o=>o.id===value)))throw new RangeError('Unknown or invalid cheese role control');
    d.paths[d.routeId][key]=value;return d;
  }
  d[key]=value;return d;
}
export function evaluateCheesePath(routeId,values){
  const route=getCheeseRoute(routeId);validatePath(values);
  const differences=CHEESE_PATH_FIELDS.filter(f=>values[f.id]!==route[f.id]).map(f=>({id:f.id,label:f.label,given:route[f.id],current:values[f.id]}));
  return {routeId,consistent:differences.length===0,differences,controls:{...values},predictsProductSuccess:false};
}
function context(d){
  valid(d);
  if(d.stationId==='path')return {routeId:d.routeId,controls:{...d.paths[d.routeId]}};
  if(d.stationId==='ripening')return {routeId:d.routeId};
  if(d.stationId==='role')return {focusId:d.focusId};
  return {};
}
export function getCheeseKey(d){valid(d);return ['path','ripening'].includes(d.stationId)?`${d.stationId}/${d.routeId}`:d.stationId==='role'?`role/${d.focusId}`:d.stationId;}
export function getCheeseTrial(d){const key=getCheeseKey(d);if(!Object.hasOwn(d.trials,key))d.trials[key]={choice:'',reason:'',revision:'',checked:null};return d.trials[key];}
export function chooseCheeseAnswer(d,id){const item=getCheeseStation(d.stationId);if(!item.options.some(o=>o.id===id))throw new RangeError('Unknown cheese answer');getCheeseTrial(d).choice=id;return d;}
export function evaluateCheese(d){
  valid(d);let answer,explanation,path=null;
  if(d.stationId==='path'){
    path=evaluateCheesePath(d.routeId,d.paths[d.routeId]);answer=path.consistent?'consistent':'mismatch';
    explanation=path.consistent?'這條角色鏈與本課選定產品的給定描述一致。這只核對物件與功能，沒有計算實際成品、產率、質地或安全；別的乾酪類型仍可能採不同作用。':`與本例描述不符的環節：${path.differences.map(x=>x.label).join('、')}。本例給定：${CHEESE_PATH_FIELDS.map(f=>`${f.label}＝${cheeseFieldLabel(f.id,getCheeseRoute(d.routeId)[f.id])}`).join('；')}。這是在修正概念描述，不是判定一個實際配方必然失敗。`;
  }else if(d.stationId==='whey'){
    answer='mixture';explanation='分離是把物料帶往不同部分，不會讓乳清物質消失。乳清除水外還有可溶成分，也可含乳清蛋白等；不能把所有蛋白質等同酪蛋白，或假設脂肪與蛋白都100%留在凝乳。實際分配需產品、處理和量測資料，本課沒有給通用回收率。';
  }else if(d.stationId==='role'){
    answer=d.focusId;const f=getCheeseFocus(d.focusId);
    explanation=f.relation+'。這是把乳化鹽、酪蛋白、水與脂肪的作用接起來；不能把乳化鹽只說成加酸，或把其作用等同普通界面活性劑直接包裹脂肪。鹽種、pH、組成及處理都會影響結果，沒有「更多鹽必定更軟／更易融」的通則。';
  }else if(d.stationId==='ripening'){
    answer=d.routeId;explanation=getCheeseRoute(d.routeId).note+' 熟成可涉及蛋白與脂肪等的改變，會依產品與條件而不同；本課不提供時間表、微生物培養或感官效果預測。';
  }else if(d.stationId==='evidence'){
    answer='fraction';explanation='水可萃取是方法定義的部分，不是單一化學物種。Deshwal等的研究區分可溶與蛋白相關的鹽及其條件依賴性；水可萃取鈣不能全當游離Ca離子，也不能單靠這項數值包辦硬度或融化等特性。沒有移植該研究配方或數值。';
  }else{
    answer='qualified';explanation='本原創比較只給同條件下油析出較少這一項資訊，沒有給硬度、融化、感官或安全。先保留已觀察端點，再找各主張所需的相符量測與對照；未給資料留未知，不反向稱全部無效。加工乾酪的多項特性也不能由一條Ca關係直接換算。';
  }
  return {answer,explanation,path,context:context(d)};
}
export function cheeseFieldLabel(id,value){const f=CHEESE_PATH_FIELDS.find(x=>x.id===id);if(!f)throw new RangeError('Unknown cheese field');return f.boolean?(value?'有':'無'):f.options.find(x=>x.id===value)?.label??'未支援';}
export function canCheckCheese(d){const t=getCheeseTrial(d);return !t.checked&&getCheeseStation(d.stationId).options.some(o=>o.id===t.choice);}
export function checkCheeseAnswer(d){
  const t=getCheeseTrial(d);if(!canCheckCheese(d))return false;const e=evaluateCheese(d);
  const misconceptions={'same-process':'把選定例的作用推成所有乾酪共通流程，會抹去凝乳家族與鮮食／熟成差別。','water-only':'乳清不是純水；也不能把所有蛋白等同酪蛋白。',gone:'分離只改物料去向，並不讓乳清中的物質從收支消失。',universal:'鹽種、pH與組成都影響結果，不能由更多鹽保證所有品質單調改善。',all:'要分開本段新增熟成與原料早先的歷史，並限定選定產品。',free:'方法可萃取部分不是單一化學物種；不能把可萃取全部改稱游離離子。',quality:'一個萃取端點不會包辦硬度、融化、感官或安全。','all-good':'一項油析出觀察沒有量到其他品質；不能跨端點直接轉換。','no-effect':'未給資料應保留未知，不能反向證明全部無效。'};
  const correct=t.choice===e.answer,feedback=correct?'此判讀符合本題給定材料。':misconceptions[t.choice]??'對照目前選定的產品、環節與本段角色，別把另一條路徑搬來。';
  const s=freeze({stationId:d.stationId,key:getCheeseKey(d),choice:t.choice,reason:text(t.reason),correct,feedback,...e});
  lock(t,'checked',s);lock(t,'reason',s.reason);return true;
}
export function currentCheeseDiffers(d){const t=getCheeseTrial(d);return Boolean(t.checked&&(t.choice!==t.checked.choice||JSON.stringify(context(d))!==JSON.stringify(t.checked.context)));}
export function cheeseContextLabel(c){if(c.routeId){const r=getCheeseRoute(c.routeId);return r.label+(c.controls?'；'+CHEESE_PATH_FIELDS.map(f=>`${f.label}＝${cheeseFieldLabel(f.id,c.controls[f.id])}`).join('；'):'');}return c.focusId?getCheeseFocus(c.focusId).label:'固定題目材料';}
export function buildCheeseSummary(d){
  valid(d);const lines=['乾酪：產品角色、乳化與量測身分','三條角色鏈及遷移材料為本課選定／原創概念情境，不是製造配方、實驗軌跡、培養程序或品質預測。',`目前任務：${d.stationId}`];
  for(const[key,t]of Object.entries(d.trials).filter(([,t])=>t.choice||t.reason||t.revision||t.checked).sort(([a],[b])=>a<b?-1:a>b?1:0)){
    const [station,part]=key.split('/'),current=station==='path'?{routeId:part,controls:{...d.paths[part]}}:station==='ripening'?{routeId:part}:station==='role'?{focusId:part}:{};
    const item=getCheeseStation(station),choiceLabel=id=>item.options.find(o=>o.id===id)?.label??'未選';
    lines.push('',`題目：${item.title}`,`目前選項：${choiceLabel(t.choice)}`,'目前條件：'+cheeseContextLabel(current),'核對前理由：',text(t.reason));
    if(t.checked){const s=t.checked;lines.push(`初答（首次核對）：${choiceLabel(s.choice)}`,'首次核對條件：'+cheeseContextLabel(s.context),`首次核對：${s.correct?'符合本題材料與界線':'需修訂'}`,'核對時理由：',s.reason,'選項回饋：',s.feedback,'核對說明：',s.explanation);if(t.choice!==s.choice||JSON.stringify(current)!==JSON.stringify(s.context))lines.push('此槽目前條件或選項已改，舊核對不代表目前答案。');}
    else lines.push('尚未核對；不計為答對。');
    lines.push('修訂：',text(t.revision));
  }
  const key=getCheeseKey(d),trial=d.trials[key];lines.push('','目前角色／焦點：'+cheeseContextLabel(context(d)));
  if(trial?.checked)lines.push(currentCheeseDiffers(d)?'目前條件或選項已改；舊核對不代表目前答案的評分。':'目前條件及選項與首次核對相同。');
  lines.push('','我的整合短答：',text(d.synthesis),'','初答首次核對固定，自由文字未自動評分。已附加的可讀摘要才隨原筆記匯出；未保存盤面不會在重載後重建。');return lines.join('\n');
}
