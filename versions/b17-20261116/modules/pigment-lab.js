import {escapeHTML as esc} from './storage.js';
import {PIGMENT_LAB_ID,PIGMENT_SOURCES,PIGMENT_COLOR_DEFAULTS,PIGMENT_COLOR_LIMITS,PIGMENT_COLOR_PRESETS,PIGMENT_ASSAY_DEFAULTS,PIGMENT_ASSAY_LIMITS,evaluatePigmentColor,evaluatePigmentAssay} from './pigment-model.js';
export {PIGMENT_LAB_ID} from './pigment-model.js';

const STEPS=['basis','difference','conclusion'];
const LABELS={basis:'選比較基準',difference:'拆解差示訊號',conclusion:'限定結論'};
const HEADINGS={basis:'這個色差，可以歸因於樣品嗎？',difference:'四個吸光值，怎麼組成一個差示訊號？',conclusion:'外觀與方法讀值，各支持什麼結論？'};
const COLOR_FIELDS={L:{label:'L* · 明度',...PIGMENT_COLOR_LIMITS.L},a:{label:'a* · 綠 ↔ 紅',...PIGMENT_COLOR_LIMITS.a},b:{label:'b* · 藍 ↔ 黃',...PIGMENT_COLOR_LIMITS.b}};
const ASSAY_FIELDS={a1_520:'pH 1.0 · A₅₂₀',a1_700:'pH 1.0 · A₇₀₀',a45_520:'pH 4.5 · A₅₂₀',a45_700:'pH 4.5 · A₇₀₀',dilutionFactor:'總稀釋倍數紀錄 DF'};
const MODES={paired:'每個 pH 先扣 700，再相減','difference-only':'只把兩個 520 讀值相減','single-reading':'只用 pH 1.0 的 520 讀值'};
const CHOICES={basis:{appearance:'可比較色座標，尚不能推色素量',degradation:'可直接算出色素分解量',incomparable:'條件不同，不能直接歸因於樣品'},conclusion:{color:'只靠 ΔE*ab 就足夠',single:'只靠一個波長的吸光值就足夠',evidence:'仍需成分、回收與比較條件等證據'}};
const ISSUES={'missing-correction':'目前算法未完成兩 pH 的背景修正與差示，只供錯誤方法對照。','negative-corrected-reading':'至少一個 pH 扣除 700 nm 後為負值；需檢查混濁修正與空白條件。','nonpositive-difference':'校正後兩 pH 差值不大於 0；保留符號供診斷，不表達正的當量濃度。','signal-outside-range':'pH 1.0 的 A₅₂₀ 不在本題採用的 0.2–1.4 範圍；不是要求四個讀值或差值都在此範圍。','concentration-outside-study':'原樣液換算值超出共同試驗的 20–3000 mg/L 適用範圍；這不是檢出限。'};
const fresh=()=>({choice:'',checked:false,reference:false,seen:false});
const fmt=value=>{if(!Number.isFinite(value))return '—';if(value===0)return '0';return Math.abs(value)<.001||Math.abs(value)>=1e6?value.toExponential(3).replace('e-',' × 10^−').replace('e+',' × 10^'):String(Number(value.toPrecision(5)));};
const sign=value=>`${value>0?'+':''}${fmt(value)}`;
const numeric=value=>typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())?Number(value):NaN;
const safeHref=value=>typeof value==='string'&&/^#[a-z][a-z0-9/-]*$/i.test(value)?value:'#learn/review';
const secureUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const drafts=new WeakMap();
const detailKeys=['color','assay','writing','original','revision','notes','sources'];
function draftFor(owner,key,startStep) {
  const create=()=>({step:startStep,mode:'',colorError:'',color:{...PIGMENT_COLOR_DEFAULTS},
    raw:Object.fromEntries(Object.keys(ASSAY_FIELDS).map(key=>[key,String(PIGMENT_ASSAY_DEFAULTS[key])])),
    answers:Object.fromEntries(STEPS.map(key=>[key,fresh()])),visited:new Set([startStep]),
    writing:{draft:'',original:'',conclusion:'',retained:false,draftContext:null,originalContext:null,retainedContext:null,conclusionContext:null,initial:null,stale:false},
    open:Object.fromEntries(detailKeys.map(key=>[key,false])),savedParts:null,savedVersions:[],review:'',saving:false,saveStatus:'',views:new Set()});
  if(!owner||!['object','function'].includes(typeof owner))return create();
  let byLesson=drafts.get(owner);if(!byLesson){byLesson=new Map();drafts.set(owner,byLesson);}
  const lesson=typeof key==='string'&&key?key:PIGMENT_LAB_ID;
  if(!byLesson.has(lesson))byLesson.set(lesson,create());
  return byLesson.get(lesson);
}
let instance=0;

/** Two independent hypothetical measurement exercises; neither predicts food RGB colors. */
export function mountPigmentLab(container,id=PIGMENT_LAB_ID,{startStep='basis',draftOwner,draftKey=PIGMENT_LAB_ID,onSaveSummary,reviewHref='#learn/review'}={}) {
  if(id!==PIGMENT_LAB_ID)throw new RangeError('Unknown pigment activity');
  if(!STEPS.includes(startStep))throw new RangeError('Unknown pigment step');
  if(!container?.querySelector||!container?.addEventListener)throw new TypeError('A DOM container is required');
  const prefix=`pigment-${++instance}`,$=selector=>container.querySelector(selector),$$=selector=>container.querySelectorAll(selector);
  const state=draftFor(draftOwner,draftKey,startStep),{color,raw,answers,visited,writing}=state;
  let {step,mode,colorError}=state,disposed=false,colorView=evaluatePigmentColor(color),assayView=null,invalid=[],historyVersion=-1;
  const control=key=>$(`[data-pg-control="${key}"]`),action=key=>$(`[data-pg-action="${key}"]`);
  const text=(selector,value)=>{$(selector).textContent=value;};
  const anyReference=()=>STEPS.some(key=>answers[key].seen);
  const context=()=>Object.freeze({seen:anyReference(),step});
  const changed=()=>{if(!state.saving)state.saveStatus='';};
  const contextText=value=>value?`${value.seen?'已看核對／參考':'尚未看核對／參考'}；當時在「${LABELS[value.step]}」`:'尚未留下文字';
  const input=(key)=>`<label class="pg-field" for="${prefix}-${key}">${ASSAY_FIELDS[key]}<input id="${prefix}-${key}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-pg-control="${key}" aria-describedby="${prefix}-assay-error" value="${esc(raw[key])}"></label>`;
  const question=(key,prompt)=>`<div class="pg-question"><p>${prompt}</p><div class="pg-choices">${Object.entries(CHOICES[key]).map(([value,label])=>`<button type="button" data-pg-choice="${value}" data-pg-for="${key}" aria-pressed="false">${label}</button>`).join('')}</div><div class="pg-actions"><button type="button" class="pg-primary" data-pg-action="check" data-pg-for="${key}">核對我的判讀</button><button type="button" data-pg-action="reference" data-pg-for="${key}">看參考解釋</button></div><p class="pg-feedback" role="status" data-pg-feedback="${key}"></p></div>`;
  container.innerHTML=`<section class="pigment-lab" aria-labelledby="${prefix}-title">
    <p class="pg-kicker" id="${prefix}-title">色素量測工作台 · 兩個獨立假想練習</p>
    <nav class="pg-steps" aria-label="色素工作台步驟">${STEPS.map(key=>`<button type="button" data-pg-step="${key}" aria-pressed="false">${LABELS[key]}</button>`).join('')}</nav>
    <h2 class="pg-heading" tabindex="-1" data-pg-heading></h2>
    <section data-pg-panel="basis">
      <div class="pg-control-grid"><label class="pg-field" for="${prefix}-preset">B 的假想讀值<select id="${prefix}-preset" data-pg-control="preset">${PIGMENT_COLOR_PRESETS.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}<option value="custom">自己調整的讀值</option></select></label><label class="pg-field" for="${prefix}-basis">A／B 的量測條件<select id="${prefix}-basis" data-pg-control="basis"><option value="matched">相同光源與量測條件</option><option value="different-illuminant">B 改用另一光源</option></select></label></div>
      <p class="pg-caption" data-pg-basis-context></p><p class="pg-error" role="status" data-pg-color-error></p>
      <div class="pg-axis-set" aria-label="三個色座標的數值位置，不是食品色票">${Object.entries(COLOR_FIELDS).map(([key,spec])=>`<div class="pg-axis-row"><div class="pg-axis-label"><strong>${spec.label}</strong><span data-pg-axis-reading="${key}"></span></div><div class="pg-axis-track" aria-hidden="true"><span class="pg-axis-line"></span><span class="pg-point pg-reference" data-pg-point="${key}-reference"></span><span class="pg-point pg-sample" data-pg-point="${key}-sample"></span></div><div class="pg-axis-ends" aria-hidden="true"><span>${spec.min}</span><span>${spec.max}</span></div></div>`).join('')}</div>
      <p class="pg-caption">圓圈 A 是參考，菱形 B 是目前讀值；每列有自己的刻度。位置不換算成螢幕食品顏色。</p>
      <div class="pg-result"><span data-pg-color-result-label></span><strong data-pg-color-result></strong><p data-pg-color-result-note></p></div>
      ${question('basis','依目前量測基準，這組比較能支持什麼？')}
      <details data-pg-details="color"><summary>調整三軸讀值，查看完整差值式</summary>${Object.entries(COLOR_FIELDS).map(([key,spec])=>`<label class="pg-range" for="${prefix}-${key}"><span>${spec.label}<output for="${prefix}-${key}" data-pg-color-reading="${key}"></output></span><input id="${prefix}-${key}" type="range" min="${spec.min}" max="${spec.max}" step="any" data-pg-control="${key}" value="${color[key]}"></label>`).join('')}<p class="pg-equation">ΔE*ab = √[(ΔL*)² + (Δa*)² + (Δb*)²]</p><p data-pg-color-formula></p><p data-pg-color-polar></p><p>這是 CIELAB 的代數距離，不是色素損失百分比，也沒有設定通用肉眼辨識門檻。若光源不同，不能把座標差直接歸因於樣品變化。</p></details>
    </section>
    <section data-pg-panel="difference" hidden>
      <p class="pg-caption">獨立假想待測液；與前一步的 L*a*b* 不是同一組樣品資料。</p>
      <div class="pg-absorbance-grid"><fieldset><legend>pH 1.0</legend>${input('a1_520')}${input('a1_700')}</fieldset><fieldset><legend>pH 4.5</legend>${input('a45_520')}${input('a45_700')}</fieldset></div>
      <p class="pg-caption">四值已相對蒸餾水空白讀取；700 nm 用於各 pH 的混濁修正，不再重扣水空白。吸光度 A 無單位。</p>
      <p class="pg-error" role="status" id="${prefix}-assay-error" data-pg-assay-error></p>
      <p class="pg-question-text">你會怎麼組合這四個讀值？</p><div class="pg-choices">${Object.entries(MODES).map(([value,label])=>`<button type="button" data-pg-mode="${value}" aria-pressed="false">${label}</button>`).join('')}</div>
      <div class="pg-actions"><button type="button" class="pg-primary" data-pg-action="check" data-pg-for="difference">核對這個算法</button><button type="button" data-pg-action="reference" data-pg-for="difference">看差示法參考</button></div><p class="pg-feedback" role="status" data-pg-feedback="difference"></p>
      <div class="pg-result" data-pg-assay-result><span data-pg-assay-result-label></span><strong data-pg-assay-result-value></strong><p data-pg-assay-result-note></p></div>
      <div class="pg-current-formula"><span data-pg-current-formula-label></span><p data-pg-current-formula></p><p data-pg-current-concentration></p></div>
      <div class="pg-corrected" data-pg-corrected hidden><p>pH 1.0 校正後<strong data-pg-corrected-1></strong></p><p>pH 4.5 校正後<strong data-pg-corrected-45></strong></p></div>
      <details data-pg-details="assay"><summary>稀釋紀錄、當量常數與方法界線</summary>${input('dilutionFactor')}<p>DF 是同一份樣品在兩個 pH 的總稀釋倍數紀錄；修改紀錄只重算原液基準，不預測吸光度會如何改變。本題固定單步緩衝稀釋至少 5 倍，DF 上限 1000 是教學介面限制。</p><p class="pg-equation">A = (A₅₂₀ − A₇₀₀)pH1.0 − (A₅₂₀ − A₇₀₀)pH4.5<br>c = A × 449.2 × DF × 1000 / (26900 × 1)</p><p>固定光徑 1 cm；MW = 449.2 g/mol，ε = 26900 L·mol⁻¹·cm⁻¹。結果以原樣液的 cyanidin-3-glucoside（C3G）當量 mg/L 表達，不代表已鑑定出 C3G，也不是所有色素的總量或食品 mg/100 g。</p><p>本題檢查 pH 1.0 的 A₅₂₀ 是否在 0.2–1.4；不是把四個讀值或 A 差值都限制在此範圍。共同試驗的原液 20–3000 mg/L 是適用聲明，不是檢出限。本題可按式表達，不等於真實方法已確效或樣品已通過品質檢驗。</p><p>依來源於配製後 20–50 min 讀值，並確認實際 pH 與緩衝能力；520 nm 是本法固定讀點，不是所有色素的 λmax。700 nm 修正也不能排除所有干擾。</p></details>
    </section>
    <section data-pg-panel="conclusion" hidden>
      <p class="pg-caption">色座標與差示法是兩個獨立假想練習；不能把兩者串成同份樣品的反應軌跡。</p>
      <details data-pg-details="writing"><summary>原稿與保留</summary><div data-pg-draft-editor><label class="pg-field" for="${prefix}-draft">先留下目前的解釋<textarea id="${prefix}-draft" rows="3" data-pg-control="draft" placeholder="看到變色或吸光改變，現在能說到哪裡？"></textarea></label><p class="pg-caption" data-pg-draft-context></p><button type="button" data-pg-action="retain">保留這份原稿</button></div>
      <details data-pg-original-archive data-pg-details="original" hidden><summary>查看保留的原稿</summary><p class="pg-own-text" data-pg-original></p><p class="pg-caption" data-pg-original-context></p></details></details>
      <div tabindex="-1" class="pg-claim-anchor" data-pg-claim-anchor>${question('conclusion','要聲稱「指定色素已分解」，哪項判讀最完整？')}</div>
      <details data-pg-details="revision"><summary>修訂與下一項證據</summary><label class="pg-field" for="${prefix}-conclusion">我的修訂與下一項證據<textarea id="${prefix}-conclusion" rows="4" data-pg-control="conclusion" placeholder="保留哪個觀察？撤回哪個推論？還要查什麼？"></textarea></label><p class="pg-caption" data-pg-conclusion-context></p><p class="pg-caption">選項只核對推論範圍；你的自由文字不自動評分。</p></details>
    </section>
    <nav class="pg-bottom-nav" aria-label="切換色素工作台步驟"><button type="button" data-pg-action="previous">上一步</button><button type="button" data-pg-action="next">下一步</button></nav>
    <details data-pg-details="notes"><summary>操作摘要與筆記</summary><p>同一頁內離開再回來可接續；重載前請附加到本課筆記並匯出。</p><label class="pg-field">回看已附加內容<select data-pg-review></select></label><pre class="pg-own-text" data-pg-review-text></pre><label class="pg-field" for="${prefix}-summary">完整目前摘要<textarea id="${prefix}-summary" rows="9" readonly data-pg-summary></textarea></label><label class="pg-field">本次將附加的新增內容<textarea rows="7" readonly data-pg-append></textarea></label><div class="pg-actions"><button type="button" data-pg-action="select-summary">選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" class="pg-primary" data-pg-action="save">附加到本課筆記</button>':''}</div><p class="pg-feedback" role="status" data-pg-save-status></p><a href="${esc(safeHref(reviewHref))}">到我的複習查看筆記 →</a></details>
    <details data-pg-details="sources"><summary>來源與本工作台的界線</summary><p>所有可改讀值均為假想教學紀錄。沒有把 RGB 色票當食品顏色預測，也沒有用單一酸鹼方程代表花青素的水合、開環、共色、配位與降解系統。</p><ul>${PIGMENT_SOURCES.map(source=>{const url=secureUrl(source.url);return `<li>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`:esc(source.title)}</li>`;}).join('')}</ul><button type="button" data-pg-action="reset">重設教學紀錄</button><p>重設讀值與算法，保留自己的文字和曾看核對／參考的歷史。</p></details>
  </section>`;

  function calculateAssay() {
    const values=Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,numeric(value)]));
    invalid=Object.keys(values).filter(key=>!Number.isFinite(values[key])||(key==='dilutionFactor'?(!Number.isInteger(values[key])||values[key]<PIGMENT_ASSAY_LIMITS.dilutionFactor.min||values[key]>PIGMENT_ASSAY_LIMITS.dilutionFactor.max):(values[key]<PIGMENT_ASSAY_LIMITS.absorbance.min||values[key]>PIGMENT_ASSAY_LIMITS.absorbance.max)));
    assayView=null;if(invalid.length)return;
    try{assayView=evaluatePigmentAssay({...values,mode:mode||'paired'});}catch{invalid=Object.keys(raw);}
  }
  function explanation(key) {
    if(key==='basis')return colorView.comparable?'這兩筆量測條件相同，可以描述 L*a*b* 座標差；ΔE*ab 不能直接換算色素量、分解率或安全性。':'A 與 B 的光源不同。三個數字仍能計算代數距離，但不能把它當作樣品變色的證據；先統一量測條件。';
    if(key==='difference')return `所選方法須先各自扣除 700 nm，再取兩 pH 的差值。${assayView?`依目前讀值，兩列校正值為 ${fmt(assayView.corrected.pH1)}、${fmt(assayView.corrected.pH45)}，差值 ${fmt(assayView.corrected.delta)}。`:'目前輸入無效，沒有沿用舊計算值。'}數值能否按式表達仍須檢查訊號與適用範圍；不代填你的算法。`;
    return '相同量測條件下，色座標可描述外觀差異；核對背景修正、DF、光徑與方法適用條件後，差示結果可表達為原樣液的總單體花青素 C3G 當量。要聲稱指定色素已分解，仍需指定成分、分析回收與可比較的前後取樣等證據。色差不等於分解量；當量也不是 C3G 身分鑑定、所有色素總量或分解路徑證明。這兩組教材數字彼此獨立，不能合併成同一樣品的前後證據。';
  }
  function expected(key) {return key==='basis'?(colorView.comparable?'appearance':'incomparable'):key==='difference'?'paired':'evidence';}
  function resultReason() {return assayView?.method.issues.map(code=>code==='nonpositive-difference'&&assayView.corrected.delta>0?'所選算法的候選訊號不大於 0；保留符號供診斷，不能用這個算法作定量報告。':ISSUES[code]||'尚有方法條件需要查核。').join(' ')||'';}
  function ownCandidate() {return mode&&assayView?assayView.candidate:null;}
  function summaryParts() {
    const candidate=ownCandidate(),parts={
      intro:'色素量測工作台｜兩個獨立假想練習，不是同份樣品的聯合證據。',
      color:`顏色基準：A D65／2°／45:0；B ${color.basis==='matched'?'D65':'光源 A'}／2°／45:0。A = (40,30,10)，B = (${fmt(color.L)},${fmt(color.a)},${fmt(color.b)})。\n\n色座標代數距離 ΔE*ab = ${fmt(colorView.deltaEab)}；${colorView.comparable?'條件相同，可描述色座標差異；不等於色素量變化。':'量測條件不可比；此數字不能作樣品變色證據。'}`,
    };
    const assay=['吸光紀錄（已相對蒸餾水空白）：'+Object.entries(raw).map(([key,value])=>`${ASSAY_FIELDS[key]} = ${value.trim()||'空白'}`).join('；'),`自己的算法：${MODES[mode]||'未選'}。`];
    if(!mode)assay.push('尚未產生自己的候選報告。');else if(!candidate)assay.push('輸入無效；下游結果已清除，沒有沿用舊值。');else assay.push(`候選訊號 = ${fmt(candidate.absorbance)}；換算值 = ${fmt(candidate.concentrationMgL)} mg/L（原樣液 C3G 當量）。${mode==='paired'&&assayView.method.reportable?'本題可按式表達；不代表方法已確效。':'不可作此方法報告，只供診斷／錯誤方法對照。'} ${resultReason()}`);
    parts.assay=assay.join('\n\n');
    for(const key of STEPS){const answer=answers[key],choice=key==='difference'?MODES[mode]:CHOICES[key][answer.choice];parts['answer-'+key]=`${LABELS[key]}｜${visited.has(key)?'已開啟':'尚未開啟'}；自己的選擇：${choice||'未作答'}；${answer.checked?'已核對':'未核對'}；${answer.seen?'曾看核對／參考':'未看核對／參考'}${answer.checked||answer.reference?'\n核對／參考：'+explanation(key):''}`;}
    parts.initial=`自己的原稿（${writing.retained?'已保留':'未按保留'}）：${writing.retained?writing.original:writing.draft.trim()?writing.draft:'未寫'}\n\n原稿最後修改時：${contextText(writing.retained?writing.originalContext:writing.draftContext)}${writing.retained?'；保留時：'+contextText(writing.retainedContext):''}`;
    parts.revision=`自己的修訂：${writing.conclusion.trim()?writing.conclusion:'未寫'}（未自動評分）\n\n修訂最後修改時：${contextText(writing.conclusionContext)}${writing.stale?'。讀值或算法之後曾改變，文字保留供重新檢查。':''}`;
    parts.scope='使用 MW 449.2、ε 26900、光徑 1 cm；沒有以 mg/100 g 食品或全部色素量報告。查看、核對與保存不代表已掌握。';
    parts.sources=PIGMENT_SOURCES.map(source=>`${source.title}：${source.url}`).join('\n\n');
    return parts;
  }
  function syncDraft() {Object.assign(state,{step,mode,colorError});}
  function syncPanels() {for(const key of detailKeys){const panel=$('[data-pg-details="'+key+'"]');if(panel)state.open[key]=panel.open;}}
  function onToggle(event) {if(disposed||!event?.target?.dataset?.pgDetails)return;syncPanels();}
  function pending() {
    const parts=Object.freeze(summaryParts()),full=Object.values(parts).join('\n\n');
    const updates=Object.entries(parts).filter(([key,value])=>!state.savedParts||state.savedParts[key]!==value).map(([,value])=>value);
    return Object.freeze({parts,full,text:!state.savedParts?full:updates.length?['色素量測工作台｜本次變更（接續已保存摘要）',...updates].join('\n\n'):''});
  }
  function drawJournal() {
    if(disposed)return;
    const next=pending();$('[data-pg-summary]').value=next.full;$('[data-pg-append]').value=next.text;
    const select=$('[data-pg-review]');
    if(historyVersion!==state.savedVersions.length){select.innerHTML='<option value="">選擇已附加內容</option>'+state.savedVersions.map((_,i)=>`<option value="saved-${i+1}">已附加摘要 ${i+1}</option>`).join('');historyVersion=state.savedVersions.length;}
    select.value=state.review;
    const saved=state.savedVersions.find((_,i)=>state.review==='saved-'+(i+1));
    text('[data-pg-review-text]',saved?saved.text:'已附加的文字固定保留；回看不改寫原稿、修訂或量測條件。');
    text('[data-pg-save-status]',state.saveStatus||(!next.text?'沒有尚未附加的新內容。':next.text.length>10000?'新增內容超過 10,000 字，尚未保存；完整文字保留，可選取複製。':'只附加尚未保存或後來修改的內容。'));
    if(action('save'))action('save').disabled=state.saving||!next.text;
  }
  function save() {
    if(state.saving||typeof onSaveSummary!=='function')return;
    const captured=pending();if(!captured.text)return;
    if(captured.text.length>10000){state.saveStatus='新增內容超過 10,000 字，尚未保存、未送出、未截斷；完整文字可複製。';drawJournal();return;}
    state.saving=true;state.saveStatus='正在附加…';drawJournal();
    const settle=success=>{
      state.saving=false;
      if(success){state.savedParts=captured.parts;state.savedVersions.push(Object.freeze({text:captured.text,full:captured.full,parts:captured.parts}));state.saveStatus='已追加這批新增內容到本課筆記；後續修改仍保留。';}
      else state.saveStatus='尚未保存；原稿、修訂與待附加文字仍保留，可重試或複製。';
      for(const update of state.views)update();
    };
    try{const result=onSaveSummary(captured.text);if(result&&typeof result.then==='function')Promise.resolve(result).then(value=>settle(value===true),()=>settle(false));else settle(result===true);}catch{settle(false);}
  }
  function render() {
    if(disposed)return;syncDraft();text('[data-pg-heading]',HEADINGS[step]);for(const node of $$('[data-pg-step]'))node.setAttribute('aria-pressed',String(node.dataset.pgStep===step));for(const node of $$('[data-pg-panel]'))node.hidden=node.dataset.pgPanel!==step;
    control('basis').value=color.basis;control('preset').value=PIGMENT_COLOR_PRESETS.find(p=>Object.keys(COLOR_FIELDS).every(key=>p.state[key]===color[key]))?.id||'custom';text('[data-pg-color-error]',colorError);
    text('[data-pg-basis-context]',`A：D65／2°／45:0；B：${color.basis==='matched'?'D65':'光源 A'}／2°／45:0。A 固定為 (40, 30, 10)。`);
    for(const [key,spec] of Object.entries(COLOR_FIELDS)){control(key).value=String(color[key]);control(key).setAttribute('aria-valuetext',fmt(color[key]));text(`[data-pg-color-reading="${key}"]`,fmt(color[key]));text(`[data-pg-axis-reading="${key}"]`,`A ${fmt(colorView.reference[key])} ／ B ${fmt(colorView.sample[key])} · Δ ${sign(colorView.delta[key])}`);for(const role of ['reference','sample'])$(`[data-pg-point="${key}-${role}"]`).setAttribute('style',`left:${(colorView[role][key]-spec.min)/(spec.max-spec.min)*100}%`);}
    text('[data-pg-color-result-label]',colorView.comparable?'此量測條件下的 ΔE*ab':'目前比較條件');text('[data-pg-color-result]',colorView.comparable?fmt(colorView.deltaEab):'不可比');text('[data-pg-color-result-note]',colorView.comparable?'描述色座標差異，不代表色素損失率。':'先讓 A、B 的光源與量測條件一致；代數距離留在詳細式中。');
    text('[data-pg-color-formula]',`√[(${fmt(colorView.delta.L)})² + (${fmt(colorView.delta.a)})² + (${fmt(colorView.delta.b)})²] = ${fmt(colorView.deltaEab)}${colorView.comparable?'':'（僅代數距離，不作樣品變色證據）'}`);
    const hue=value=>value===null?'未定義（C*=0）':`${fmt(value)}°`;text('[data-pg-color-polar]',`B 的 C*ab = ${fmt(colorView.sample.chroma)}；色相角 h° = ${hue(colorView.sample.hueDegrees)}。中性色的色相角不強行設成 0°。`);
    for(const key of Object.keys(raw)){if(control(key).value!==raw[key])control(key).value=raw[key];control(key).setAttribute('aria-invalid',String(invalid.includes(key)));}
    text('[data-pg-assay-error]',invalid.length?`請修正 ${invalid.map(key=>ASSAY_FIELDS[key]).join('、')}。吸光值限 0–2；DF 須為 5–1000 的整數。下游結果已清除。`:'');
    for(const node of $$('[data-pg-mode]'))node.setAttribute('aria-pressed',String(node.dataset.pgMode===mode));
    const candidate=ownCandidate(),reportable=Boolean(candidate&&mode==='paired'&&assayView.method.reportable);
    text('[data-pg-assay-result-label]',!mode?'自己的候選結果':!candidate?'輸入待修正':reportable?'本題可按式表達':'不可作此方法報告');text('[data-pg-assay-result-value]',!mode?'尚未選算法':candidate?`${fmt(candidate.concentrationMgL)} mg/L`:'—');
    text('[data-pg-assay-result-note]',!mode?'先選你要採用的算法；看參考不會替你選。':!candidate?'沒有沿用上一組計算值。':`${mode==='paired'?'原樣液 C3G 當量。':'錯誤方法對照的換算值，非有效定量報告。'} ${resultReason()}${reportable?' 這不代表已鑑定 C3G、所有色素量或方法已確效。':''}`);
    text('[data-pg-current-formula-label]',!mode?'選定算法後，這裡顯示當前算式':MODES[mode]);
    let formula='—';if(candidate){formula=mode==='paired'?`(${raw.a1_520} − ${raw.a1_700}) − (${raw.a45_520} − ${raw.a45_700}) = ${fmt(candidate.absorbance)}`:mode==='difference-only'?`${raw.a1_520} − ${raw.a45_520} = ${fmt(candidate.absorbance)}`:`A₅₂₀,pH1.0 = ${fmt(candidate.absorbance)}`;}
    text('[data-pg-current-formula]',formula);text('[data-pg-current-concentration]',candidate?`c = ${fmt(candidate.absorbance)} × 449.2 × ${raw.dilutionFactor} × 1000 / (26900 × 1)`:'');
    $('[data-pg-corrected]').hidden=!(candidate&&mode==='paired');text('[data-pg-corrected-1]',candidate&&mode==='paired'?fmt(assayView.corrected.pH1):'—');text('[data-pg-corrected-45]',candidate&&mode==='paired'?fmt(assayView.corrected.pH45):'—');
    for(const key of STEPS){const answer=answers[key];for(const node of $$('[data-pg-choice]'))if(node.dataset.pgFor===key)node.setAttribute('aria-pressed',String(answer.choice===node.dataset.pgChoice));for(const node of $$('[data-pg-action="check"]'))if(node.dataset.pgFor===key)node.disabled=key==='difference'?!mode||!assayView:!answer.choice;const chosen=key==='difference'?mode:answer.choice;text(`[data-pg-feedback="${key}"]`,answer.checked?`${chosen===expected(key)?'這項判讀符合題設。':'這項判讀需要調整。'} ${explanation(key)}`:answer.reference?`參考：${explanation(key)}`:'');}
    for(const key of ['draft','conclusion'])if(control(key).value!==writing[key])control(key).value=writing[key];control('draft').readOnly=writing.retained;$('[data-pg-draft-editor]').hidden=writing.retained;$('[data-pg-original-archive]').hidden=!writing.retained;action('retain').disabled=!writing.draft.trim();
    text('[data-pg-draft-context]',writing.draft?`最後修改時：${contextText(writing.draftContext)}`:`目前：${contextText(context())}`);text('[data-pg-original]',writing.original);text('[data-pg-original-context]',`最後修改時：${contextText(writing.originalContext)}；保留時：${contextText(writing.retainedContext)}`);text('[data-pg-conclusion-context]',writing.conclusion?`最後修改時：${contextText(writing.conclusionContext)}${writing.stale?'。讀值或算法已改，請重新檢查自己的文字。':''}`:'尚未留下修訂。');
    action('previous').disabled=step==='basis';action('next').disabled=step==='conclusion';drawJournal();
  }
  function invalidate() {for(const answer of Object.values(answers)){answer.checked=false;answer.reference=false;}if(writing.draft||writing.conclusion)writing.stale=true;changed();}
  function move(next) {if(!STEPS.includes(next)||next===step)return;step=next;visited.add(step);changed();render();$('[data-pg-heading]').focus({preventScroll:true});$('[data-pg-heading]').scrollIntoView?.({block:'nearest',behavior:'instant'});}
  function changeColor(next) {try{const result=evaluatePigmentColor(next);Object.assign(color,next);colorView=result;colorError='';invalidate();}catch{colorError='讀值超出題設範圍；已保留上一組有效色座標。';}render();}
  function onInput(event) {
    if(disposed||!container.contains(event.target))return;const key=event.target.dataset?.pgControl;
    if(step==='basis'&&Object.hasOwn(COLOR_FIELDS,key)){changeColor({...color,[key]:numeric(event.target.value)});return;}
    if(step==='difference'&&Object.hasOwn(raw,key)){raw[key]=event.target.value;invalidate();calculateAssay();render();return;}
    if(step==='conclusion'&&key==='draft'&&!writing.retained){writing.draft=event.target.value;writing.draftContext=context();}
    else if(step==='conclusion'&&key==='conclusion'){writing.conclusion=event.target.value;writing.conclusionContext=context();writing.stale=false;}
    else return;changed();render();
  }
  function onChange(event) {
    if(disposed||!container.contains(event.target))return;const value=event.target.value;if(event.target===$('[data-pg-review]')){state.review=typeof value==='string'&&/^saved-[1-9]\d*$/.test(value)&&Number(value.slice(6))<=state.savedVersions.length?value:'';drawJournal();return;}if(step!=='basis')return;const key=event.target.dataset?.pgControl;
    if(key==='basis'){changeColor({...color,basis:value});return;}
    if(key==='preset'){const preset=PIGMENT_COLOR_PRESETS.find(p=>p.id===value);if(!preset){render();return;}changeColor({...color,...Object.fromEntries(Object.keys(COLOR_FIELDS).map(key=>[key,preset.state[key]]))});}
  }
  function onClick(event) {
    if(disposed)return;const node=event.target?.closest?.('button');if(!node||!container.contains(node)||node.disabled)return;
    if(node.dataset.pgStep){move(node.dataset.pgStep);return;}
    if(node.dataset.pgMode&&step==='difference'&&Object.hasOwn(MODES,node.dataset.pgMode)){mode=node.dataset.pgMode;invalidate();calculateAssay();render();return;}
    if(node.dataset.pgChoice&&node.dataset.pgFor===step&&Object.hasOwn(CHOICES[step]||{},node.dataset.pgChoice)){answers[step].choice=node.dataset.pgChoice;answers[step].checked=false;answers[step].reference=false;changed();render();return;}
    const name=node.dataset.pgAction;
    if(name==='previous'||name==='next'){move(STEPS[STEPS.indexOf(step)+(name==='next'?1:-1)]);return;}
    if((name==='check'||name==='reference')&&node.dataset.pgFor===step){const answer=answers[step];if(name==='check'){if(step==='difference'?!mode||!assayView:!answer.choice)return;answer.checked=true;}else answer.reference=true;answer.seen=true;changed();render();return;}
    if(name==='retain'&&step==='conclusion'&&!writing.retained&&writing.draft.trim()){writing.initial=Object.freeze({text:writing.draft,originalContext:writing.draftContext,retainedContext:context()});writing.original=writing.initial.text;writing.originalContext=writing.initial.originalContext;writing.retainedContext=writing.initial.retainedContext;writing.retained=true;changed();render();$('[data-pg-claim-anchor]').focus({preventScroll:true});$('[data-pg-claim-anchor]').scrollIntoView?.({block:'nearest',behavior:'instant'});return;}
    if(name==='reset'){Object.assign(color,PIGMENT_COLOR_DEFAULTS);for(const key of Object.keys(raw))raw[key]=String(PIGMENT_ASSAY_DEFAULTS[key]);mode='';colorError='';colorView=evaluatePigmentColor(color);invalidate();calculateAssay();render();return;}
    if(name==='select-summary'){$('[data-pg-summary]').focus();$('[data-pg-summary]').select?.();return;}
    if(name==='save')save();
  }
  for(const key of detailKeys){const panel=$('[data-pg-details="'+key+'"]');panel.open=state.open[key];panel.ontoggle=onToggle;}
  state.views.add(drawJournal);calculateAssay();container.addEventListener('input',onInput);container.addEventListener('change',onChange);container.addEventListener('click',onClick);render();
  return ()=>{if(disposed)return;syncDraft();syncPanels();disposed=true;state.views.delete(drawJournal);for(const key of detailKeys){const panel=$('[data-pg-details="'+key+'"]');if(panel?.ontoggle===onToggle)panel.ontoggle=null;}container.removeEventListener('input',onInput);container.removeEventListener('change',onChange);container.removeEventListener('click',onClick);};
}
