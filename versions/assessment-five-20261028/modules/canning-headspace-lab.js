import {escapeHTML as esc} from './storage.js';
import {CANNING_HEADSPACE_LAB_ID,HEADSPACE_DEFAULT_INPUT,HEADSPACE_TEACHING_RANGE,HEADSPACE_SOURCES,HEADSPACE_METHODS,HEADSPACE_EXAMPLES,evaluateHeadspaceState,traceHeadspaceTemperature} from './canning-headspace-model.js';
export {CANNING_HEADSPACE_LAB_ID} from './canning-headspace-model.js';

const modes={methods:'工序與方法',pressure:'頭空壓力',evidence:'證據判讀'};
const fields={sealTemperatureC:'密封時溫度',sealPressureKPaAbs:'密封時總壓',viewTemperatureC:'檢視溫度',outsidePressureKPaAbs:'外部壓力'};
const choices={limited:'只能描述此時的內外壓差',method:'可以唯一反推出排氣方法',sterile:'可以確認商業無菌'};
const explanation='單一真空讀值不足以唯一反推排氣方法或密封條件，也不能證明商業無菌、封口完整或容器強度。需保留製程紀錄、量測基準及相應檢驗。';
const detailKeys=['equations','writing','history','sources','preview'];
const drafts=new WeakMap(),mounted=new WeakMap(),clone=x=>structuredClone(x);
const fmt=x=>Number.isFinite(x)?Number(x.toFixed(3)).toString():'—';
const signed=x=>`${x>0?'+':''}${fmt(x)}`;
const number=x=>typeof x==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(x.trim())?Number(x):NaN;
const safeHref=x=>/^#(?:learn|process|micro)\/review$/.test(x)?x:'#process/review';
const fresh=()=>({mode:'methods',method:HEADSPACE_METHODS[0].id,raw:Object.fromEntries(Object.entries(HEADSPACE_DEFAULT_INPUT).map(([k,v])=>[k,String(v)])),choice:'',checked:false,reference:false,seen:false,writing:{reason:'',revision:''},first:null,records:[],details:{},seenModes:[],seenSources:[],savedParts:null,savedVersions:[],saving:false,status:'',views:new Set()});
function draftFor(owner,key){if(!owner||!['object','function'].includes(typeof owner))return fresh();let map=drafts.get(owner);if(!map){map=new Map();drafts.set(owner,map);}if(!map.has(key))map.set(key,fresh());return map.get(key);}
function snapshot(d){return clone({mode:d.mode,method:d.method,raw:d.raw,choice:d.choice,checked:d.checked,reference:d.reference,seen:d.seen,writing:d.writing,seenModes:d.seenModes,seenSources:d.seenSources});}
const bounds=k=>k.endsWith('C')?[HEADSPACE_TEACHING_RANGE.minTemperatureC,HEADSPACE_TEACHING_RANGE.maxTemperatureC,.1]:k==='sealPressureKPaAbs'?[HEADSPACE_TEACHING_RANGE.minSealPressureKPaAbs,HEADSPACE_TEACHING_RANGE.maxSealPressureKPaAbs,.1]:[HEADSPACE_TEACHING_RANGE.minOutsidePressureKPaAbs,HEADSPACE_TEACHING_RANGE.maxOutsidePressureKPaAbs,.1];
function evaluate(raw){
 const values=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,number(v)])),invalid=Object.keys(fields).filter(k=>{const [min,max]=bounds(k);return !Number.isFinite(values[k])||values[k]<min||values[k]>max;});
 if(invalid.length)return {value:null,invalid,error:invalid.map(k=>`${fields[k]}須填入 ${bounds(k)[0]}–${bounds(k)[1]} ${k.endsWith('C')?'°C':'kPa abs'} 的數字`).join('；')};
 try{return {value:evaluateHeadspaceState(values),error:'',invalid:[]};}catch(error){const saturated=error.message.includes('below saturated');return {value:null,invalid:saturated?['sealPressureKPaAbs']:[],error:saturated?'密封總壓低於此溫度的純水飽和蒸氣壓，與足量液水、氣液平衡假設不相容':'模型暫時無法計算；原輸入仍保留'};}
}
function readings(raw){const r=evaluate(raw).value;return r?`水蒸氣 ${fmt(r.waterVaporKPa)} + 非凝結氣體 ${fmt(r.noncondensableKPa)} = 內部總壓 ${fmt(r.insidePressureKPaAbs)} kPa abs；內減外 ${signed(r.insideMinusOutsideKPa)} kPa。`:'輸入無效；未保留上一組計算結果。';}
function stateText(s){const method=HEADSPACE_METHODS.find(x=>x.id===s.method);return [`畫面：${modes[s.mode]}；定性方法：${method.label}（與數值情境分開）`,...Object.entries(s.raw).map(([k,v])=>`${fields[k]}：${v||'空白'} ${k.endsWith('C')?'°C':'kPa abs'}`),readings(s.raw),`當時曾顯示畫面：${s.seenModes.map(x=>modes[x]).join('、')}（未設盲測）`,`自己的判讀：${choices[s.choice]||'未選'}；${s.checked?'已核對':'未核對'}；${s.seen?'曾看核對／參考':'未看核對／參考'}`,`目前理由：${s.writing.reason||'未填'}`,`後續修訂：${s.writing.revision||'未填'}`].join('\n');}
let sequence=0;

/** Quasistatic endpoints for a rigid pure-water headspace; no retort schedule. */
export function mountCanningHeadspaceLab(root,id=CANNING_HEADSPACE_LAB_ID,{draftOwner,draftKey=CANNING_HEADSPACE_LAB_ID,onSaveSummary,reviewHref='#process/review'}={}){
 if(id!==CANNING_HEADSPACE_LAB_ID)throw new RangeError('Unknown canning activity');
 if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
 mounted.get(root)?.();
 const d=draftFor(draftOwner,draftKey),prefix=`ch-${++sequence}`,$=s=>root.querySelector(s),$$=s=>root.querySelectorAll(s),f=s=>$(`[data-ch-${s}]`),action=s=>$(`[data-ch-action="${s}"]`);
 let disposed=false,result=null,historySignature='';
 const range=bounds;
 const dirty=()=>{if(!d.saving)d.status='';};
 function invalidate(){d.checked=false;d.reference=false;dirty();}
 function parts(){const s=snapshot(d),r=evaluate(d.raw).value;return {intro:'【罐頭脫氣與頭空壓力】v1\n原創純水、剛性定容、密封後非凝結氣體量固定、均溫平衡狀態模型；非實測罐頭、時間模擬或製程建議。本活動未設盲測；首次保留只代表第一次按下保留。',method:`定性方法：${HEADSPACE_METHODS.find(x=>x.id===d.method).label}；畫面：${modes[d.mode]}。方法不自動指定數值情境。`,inputs:Object.entries(d.raw).map(([k,v])=>`${fields[k]}：${v||'空白'} ${k.endsWith('C')?'°C':'kPa abs'}`).join('\n'),result:readings(d.raw)+(r?`\n密封時非凝結分壓 ${fmt(r.sealNoncondensableKPa)} kPa；密封時水蒸氣分壓 ${fmt(r.sealWaterVaporKPa)} kPa。`:''),answer:`自己的判讀：${choices[d.choice]||'未選'}；${d.checked?'已核對':'未核對'}；${d.seen?'曾看核對／參考':'未看核對／參考'}${d.checked||d.reference?'\n'+explanation:''}`,writing:`目前理由：${d.writing.reason||'未填'}\n後續修訂：${d.writing.revision||'未填'}（自由文字未自動評分）`,first:d.first?'首次保留\n'+stateText(d.first):'首次保留：尚未保留',...Object.fromEntries(d.records.map((s,i)=>['record-'+i,`觀察 ${i+1}\n`+stateText(s)])),exposure:`曾顯示：${d.seenModes.map(x=>modes[x]).join('、')}；曾開啟來源：${d.seenSources.join('、')||'無'}（不表示讀懂）`,scope:'不推定氧氣比例、溶解氣體、傳熱時間、產品熱膨脹、罐體形變、密封完整或商業無菌。曲線橫軸為溫度，不是時間。',sources:HEADSPACE_SOURCES.map(s=>`${s.title}\n${s.url}`).join('\n')};}
 function pending(){const p=parts(),changed=Object.entries(p).filter(([k,v])=>!d.savedParts||d.savedParts[k]!==v).map(([,v])=>v);return {parts:clone(p),full:Object.values(p).join('\n\n'),text:changed.length?(d.savedParts?'【罐頭脫氣與頭空壓力】本次新增／修改\n\n':'')+changed.join('\n\n'):''};}
 function summary(){if(disposed)return;const p=pending();f('preview').value=p.text;action('save').disabled=d.saving||typeof onSaveSummary!=='function'||!p.text;f('status').textContent=d.status||(!p.text?'沒有尚未附加的新內容。':'');}
 function drawGraph(){
  const svg=f('graph');if(!result){svg.innerHTML='<text x="280" y="130" text-anchor="middle">請修正輸入後查看曲線</text>';svg.setAttribute('aria-label','輸入無效，壓力曲線已清除');return;}
  const trace=traceHeadspaceTemperature(result.input||Object.fromEntries(Object.entries(d.raw).map(([k,v])=>[k,number(v)]))),max=Math.ceil(Math.max(...trace.map(r=>r.insidePressureKPaAbs),result.input?.outsidePressureKPaAbs||number(d.raw.outsidePressureKPaAbs))/50)*50;
  const X=t=>52+(t-20)/75*480,Y=p=>228-p/max*184;
  const path=k=>trace.map((r,i)=>`${i?'L':'M'}${X(r.input?.viewTemperatureC??r.viewTemperatureC).toFixed(2)},${Y(r[k]).toFixed(2)}`).join(' ');
  const outside=number(d.raw.outsidePressureKPaAbs),temp=number(d.raw.viewTemperatureC);
  svg.setAttribute('aria-label',`平衡狀態壓力對溫度曲線。${readings(d.raw)}`);
  svg.innerHTML=`<text x="52" y="22">絕對壓力（kPa）</text>${[0,.5,1].map(q=>`<line class="ch-grid" x1="52" x2="532" y1="${Y(q*max)}" y2="${Y(q*max)}"/><text x="43" y="${Y(q*max)+5}" text-anchor="end">${fmt(q*max)}</text>`).join('')}<line class="ch-outside-line" x1="52" x2="532" y1="${Y(outside)}" y2="${Y(outside)}"/>${['waterVaporKPa','noncondensableKPa','insidePressureKPaAbs'].map((k,i)=>`<path class="ch-curve ch-curve-${i}" d="${path(k)}"/>`).join('')}<line class="ch-cursor" x1="${X(temp)}" x2="${X(temp)}" y1="44" y2="228"/><circle cx="${X(temp)}" cy="${Y(result.insidePressureKPaAbs)}" r="5" class="ch-current"/>${[20,45,70,95].map(t=>`<text x="${X(t)}" y="251" text-anchor="middle">${t}</text>`).join('')}<text x="292" y="275" text-anchor="middle">檢視溫度（°C）</text>`;
 }
 function paint(){
  if(disposed)return;if(!d.seenModes.includes(d.mode))d.seenModes.push(d.mode);
  const calc=evaluate(d.raw);result=calc.value;
  $$('[data-ch-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.chMode===d.mode)));$$('[data-ch-panel]').forEach(el=>el.hidden=el.dataset.chPanel!==d.mode);
  const method=HEADSPACE_METHODS.find(x=>x.id===d.method);$$('[data-ch-method]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.chMethod===d.method)));
  f('method-title').textContent=method.label;f('method-mechanism').textContent=method.mechanism;f('method-scope').textContent=method.scope;
  f('method-symbol').textContent=d.method==='vacuum'?'空氣 → 抽出':d.method==='steam'?'蒸氣 → 置換空氣':'加熱 → 氣體逸出';
  f('error').textContent=result?'':'輸入待修正：'+calc.error+'；曲線與結果已清除。';
  for(const k of Object.keys(fields)){const el=$(`[data-ch-input="${k}"]`),slider=$(`[data-ch-range="${k}"]`),[min,max]=range(k),value=number(d.raw[k]),valid=Number.isFinite(value)&&value>=min&&value<=max;if(el.value!==d.raw[k])el.value=d.raw[k];el.setAttribute('aria-invalid',String(calc.invalid.includes(k)));slider.disabled=!valid;if(valid)slider.value=String(value);slider.setAttribute('aria-valuetext',valid?`${fmt(value)} ${k.endsWith('C')?'°C':'kPa abs'}`:'輸入待修正');}
  f('preset').value=HEADSPACE_EXAMPLES.find(x=>Object.keys(fields).every(k=>x.input[k]===number(d.raw[k])))?.id||'custom';
  for(const [key,field] of [['vapor','waterVaporKPa'],['gas','noncondensableKPa'],['inside','insidePressureKPaAbs']])f(key).textContent=result?fmt(result[field]):'—';
  f('delta').textContent=result?`${signed(result.insideMinusOutsideKPa)} kPa`:'—';f('delta-caption').textContent=!result?'尚未計算':Math.abs(result.insideMinusOutsideKPa)<1e-8?'此狀態內外等壓':result.insideMinusOutsideKPa<0?'內壓低於外壓 · 此時有真空差壓':'內壓高於外壓 · 此時不是正真空';
  f('inside-note').textContent=result?`密封時非凝結分壓 ${fmt(result.sealNoncondensableKPa)} kPa；目前在 ${d.raw.viewTemperatureC} °C。`:'沒有沿用上一組讀值。';
  f('formula-current').textContent=result?`P內 = (${fmt(result.sealNoncondensableKPa)} × ${(number(d.raw.viewTemperatureC)+273.15).toFixed(2)} / ${(number(d.raw.sealTemperatureC)+273.15).toFixed(2)}) + ${fmt(result.waterVaporKPa)} = ${fmt(result.insidePressureKPaAbs)} kPa abs`:'—';
  drawGraph();$$('[data-ch-choice]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.chChoice===d.choice)));action('check').disabled=!d.choice||!result;
  f('feedback').textContent=d.checked?`${d.choice==='limited'?'這項判讀符合題設。':'這項推論超出讀值能支持的範圍。'} ${explanation}`:d.reference?explanation:'';
  f('evidence-reading').textContent=readings(d.raw);action('record').disabled=d.records.length>=12;f('count').textContent=`${d.records.length} / 12 次`;
  for(const el of $$('[data-ch-writing]'))if(el.value!==d.writing[el.dataset.chWriting])el.value=d.writing[el.dataset.chWriting];
  const hs=JSON.stringify([d.first,d.records,d.savedVersions]);if(hs!==historySignature){f('first').textContent=d.first?stateText(d.first):'尚未保留。本活動未設盲測；首次保留只代表第一次按下保留。';f('records').innerHTML=d.records.map((s,i)=>`<details><summary>觀察 ${i+1} · ${esc(modes[s.mode])}</summary><pre>${esc(stateText(s))}</pre><button type="button" data-ch-replay="${i}">回放這次條件</button></details>`).join('');f('saved').innerHTML=d.savedVersions.map((s,i)=>`<details><summary>已附加版本 ${i+1}</summary><pre>${esc(s)}</pre></details>`).join('');historySignature=hs;}
  summary();
 }
 const control=k=>{const [min,max,step]=range(k),unit=k.endsWith('C')?'°C':'kPa abs';return `<label class="ch-control" for="${prefix}-${k}"><span>${fields[k]} <small>${unit}</small></span><input id="${prefix}-${k}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-ch-input="${k}" aria-describedby="${prefix}-error"><input type="range" data-ch-range="${k}" min="${min}" max="${max}" step="${step}" aria-label="調整${fields[k]}（${unit}）"></label>`;};
 root.innerHTML=`<section class="canning-headspace-lab"><nav class="ch-tabs" aria-label="罐頭工作台畫面">${Object.entries(modes).map(([k,v])=>`<button type="button" data-ch-mode="${k}" aria-pressed="false">${v}</button>`).join('')}</nav>
 <section data-ch-panel="methods"><h2>密封前，怎麼減少容器中的空氣？</h2><ol class="ch-flow"><li>充填</li><li class="ch-active">排氣</li><li>密封</li><li>後續熱處理</li><li>冷卻</li></ol><p class="ch-caption">這是密封後再熱處理的罐藏工序示意；排氣也可在封口設備內完成。</p><div class="ch-method-grid"><div class="ch-can" aria-label="排氣概念示意，沒有預測食品或氣體運動"><div class="ch-can-arrow" data-ch-method-symbol></div><div class="ch-can-space">頭空</div><div class="ch-can-food">內容物</div></div><div><div class="ch-buttons">${HEADSPACE_METHODS.map(m=>`<button type="button" data-ch-method="${esc(m.id)}">${esc(m.label)}</button>`).join('')}</div><h3 data-ch-method-title></h3><p class="ch-method-text" data-ch-method-mechanism></p><p class="ch-caption" data-ch-method-scope></p></div></div><p class="ch-scope">排氣有助減少空氣與氧化、降低熱處理時的壓力負荷，並形成冷卻後真空；各項效果仍受產品與製程條件影響。</p></section>
 <section data-ch-panel="pressure" hidden><h2>內壓下降，是哪個分壓改變？</h2><p class="ch-caption">原創平衡狀態模型 · 純水、剛性定容 · 曲線是溫度，不是時間</p><div class="ch-pressure-grid"><div class="ch-chart-column"><div class="ch-chart-wrap" tabindex="0" role="region" aria-label="壓力對溫度圖，窄螢幕可橫向捲動"><svg data-ch-graph viewBox="0 0 570 288" role="img"></svg></div><div class="ch-legend"><span class="ch-legend-vapor">水蒸氣</span><span class="ch-legend-gas">非凝結氣體</span><span class="ch-legend-total">內部總壓</span><span class="ch-legend-outside">外壓</span></div><div class="ch-sum"><span>水蒸氣<strong data-ch-vapor></strong></span><b>+</b><span>非凝結氣體<strong data-ch-gas></strong></span><b>=</b><span>內部總壓<strong data-ch-inside></strong></span></div><p class="ch-caption">以上均為 kPa abs。非凝結氣體不能直接當成純氧。</p><div class="ch-current-result"><span>內壓 − 外壓</span><strong data-ch-delta></strong><p data-ch-delta-caption></p></div></div><div class="ch-controls"><label>數值情境<select data-ch-preset>${HEADSPACE_EXAMPLES.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}<option value="custom">自己調整的條件</option></select></label><p class="ch-caption">情境不指定實際排氣方法，也不是製程建議。</p>${Object.keys(fields).map(control).join('')}<p id="${prefix}-error" class="ch-error" data-ch-error role="status"></p></div></div><p class="ch-caption" data-ch-inside-note></p><details data-ch-detail="equations"><summary>當前算式、假設與範圍</summary><p class="ch-equation" data-ch-formula-current></p><p>P非凝結,密封 = P密封 − P飽和(T密封)。密封後 P非凝結(T) = P非凝結,密封 × T(K) / T密封(K)。P內(T) = P非凝結(T) + P飽和(T)。水蒸氣壓依 IAPWS 飽和關係式。</p><p>密封總壓低於該溫度的純水飽和蒸氣壓，與本題足量液水、氣液平衡假設不相容；會拒絕計算。液體可凝結或蒸發，非凝結氣體量固定。外壓只進入差壓計算。</p><p>20–95 °C 與壓力滑桿範圍是教材選定的操作域，並非罐藏建議或公式完整有效域。忽略水活性、溶解氣體、食品熱膨脹、洩漏、容器形變與傳熱時間；不提供殺菌排程。</p></details></section>
 <section data-ch-panel="evidence" hidden><h2>一個真空讀值，能證明什麼？</h2><div class="ch-evidence-reading" data-ch-evidence-reading></div><p>可先在「頭空壓力」切換兩個等內壓情境，對照不同的密封條件。</p><div class="ch-choices">${Object.entries(choices).map(([k,v])=>`<button type="button" data-ch-choice="${k}" aria-pressed="false">${v}</button>`).join('')}</div><div class="ch-buttons"><button type="button" data-ch-action="check">核對我的判讀</button><button type="button" data-ch-action="reference">看參考解釋</button></div><p class="ch-feedback" data-ch-feedback role="status"></p><p class="ch-caption">核對選項不代替評閱自己的解釋。壓力模型不能判定食品是否安全。</p></section>
 <div class="ch-record-bar"><button type="button" data-ch-action="record">保留這次觀察</button><span data-ch-count></span></div><details data-ch-detail="writing"><summary>寫下解釋與修訂</summary><label>目前理由<textarea rows="3" data-ch-writing="reason"></textarea></label><label>後續修訂<textarea rows="3" data-ch-writing="revision"></textarea></label><p>保留觀察時會固定保存當時文字。回放條件不覆蓋目前文字；自由文字不自動評分。</p></details><details data-ch-detail="history"><summary>回看與回放保留內容</summary><h3>首次保留</h3><pre data-ch-first></pre><h3>觀察記錄</h3><div data-ch-records></div><h3>已附加版本</h3><div data-ch-saved></div></details><details data-ch-detail="sources"><summary>來源與官方題目</summary>${HEADSPACE_SOURCES.map(s=>`<article><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-ch-source="${esc(s.id)}">${esc(s.title)}</a><p>${esc(s.locator||'')}。${esc(s.note||'')}</p></article>`).join('')}<p>114 年食品加工學第 11 題詢問罐藏脫氣的目的與方法。這是原創教學延伸，並非官方完整解答或考試覆蓋率。</p></details><details data-ch-detail="preview"><summary>本次將附加的新增內容</summary><textarea data-ch-preview readonly rows="8" aria-label="本次新增摘要"></textarea></details><div class="ch-save"><button type="button" data-ch-action="save">附加至本課筆記</button><span data-ch-status role="status"></span><a href="${esc(safeHref(reviewHref))}">我的複習 →</a></div><p class="ch-caption">同頁離開再回來可接續；重新載入前請附加筆記並匯出。</p></section>`;
 async function save(){if(disposed||d.saving||typeof onSaveSummary!=='function')return;const captured=pending();if(!captured.text)return;if(captured.text.length>10000){d.status='新增內容超過 10,000 字，尚未送出或截斷；全文可選取複製。';summary();return;}d.saving=true;d.status='正在附加…';for(const view of d.views)view();try{if(await onSaveSummary(captured.text)===true){d.savedParts=captured.parts;d.savedVersions.push(captured.text);d.status='已附加至本課筆記。';}else d.status='尚未保存；新增內容仍可重試或複製。';}catch(error){d.status='尚未保存：'+(error?.message||String(error));}finally{d.saving=false;for(const view of d.views)view();}}
 function onClick(event){if(disposed)return;const el=event.target.closest('button,a[data-ch-source]');if(!el||!root.contains(el))return;const a=el.dataset;
  if(Object.hasOwn(modes,a.chMode)){d.mode=a.chMode;dirty();paint();return;}
  if(HEADSPACE_METHODS.some(m=>m.id===a.chMethod)){d.method=a.chMethod;dirty();paint();return;}
  if(Object.hasOwn(choices,a.chChoice)){d.choice=a.chChoice;d.checked=false;dirty();paint();return;}
  if(a.chSource){if(!d.seenSources.includes(a.chSource))d.seenSources.push(a.chSource);dirty();summary();return;}
  if(a.chReplay!==undefined){const s=d.records[Number(a.chReplay)];if(!s)return;d.mode=s.mode;d.method=s.method;d.raw=clone(s.raw);d.choice=s.choice;d.checked=false;d.reference=false;d.status='已回放條件；目前文字與已保留內容不變。';paint();return;}
  if(a.chAction==='record'&&d.records.length<12){const s=snapshot(d);if(!d.first)d.first=clone(s);d.records.push(s);d.status='已保留這次觀察；尚未附加至筆記。';paint();}
  if(a.chAction==='check'&&d.choice&&result){d.checked=true;d.seen=true;dirty();paint();}
  if(a.chAction==='reference'){d.reference=true;d.seen=true;dirty();paint();}
  if(a.chAction==='save')void save();
 }
 root.addEventListener('click',onClick);
 for(const el of $$('[data-ch-input],[data-ch-range]'))el.oninput=()=>{if(disposed)return;const key=el.dataset.chInput||el.dataset.chRange;d.raw[key]=el.value;invalidate();paint();};
 for(const el of $$('[data-ch-writing]'))el.oninput=()=>{if(disposed)return;d.writing[el.dataset.chWriting]=el.value;dirty();summary();};
 f('preset').onchange=()=>{if(disposed)return;const p=HEADSPACE_EXAMPLES.find(x=>x.id===f('preset').value);if(!p)return;d.raw=Object.fromEntries(Object.entries(p.input).map(([k,v])=>[k,String(v)]));invalidate();paint();};
 for(const key of detailKeys){const el=$(`[data-ch-detail="${key}"]`);el.open=!!d.details[key];el.ontoggle=()=>{if(!disposed)d.details[key]=el.open;};}
 d.views.add(paint);paint();
 function dispose(){if(disposed)return;disposed=true;d.views.delete(paint);root.removeEventListener('click',onClick);$$('[data-ch-input],[data-ch-range],[data-ch-writing],[data-ch-detail],[data-ch-preset]').forEach(el=>{el.oninput=null;el.onchange=null;el.ontoggle=null;});if(mounted.get(root)===dispose)mounted.delete(root);}
 mounted.set(root,dispose);return dispose;
}
