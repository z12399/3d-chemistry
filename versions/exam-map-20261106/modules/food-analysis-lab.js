import {escapeHTML as esc} from './storage.js';
import {FOOD_ANALYSIS_ID, FOOD_ANALYSIS_CASES, FOOD_ANALYSIS_SOURCES, FOOD_RECOVERY_CASES, FOOD_REREAD_CASE, createAnalysisInputs, evaluateAnalysis, evaluateRecovery, evaluateRepeatability} from './food-analysis-model.js';
export {FOOD_ANALYSIS_ID as FOOD_ANALYSIS_LAB_ID} from './food-analysis-model.js';

let instance = 0;
const mounted = new WeakMap(), ownerDrafts = new WeakMap();
const steps = ['讀值', '比值校正', '前處理', 'mg/100 g', '加標回收'];
const fmt = (value, digits = 3) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value !== 0 && (Math.abs(value) < 10 ** -digits || Math.abs(value) >= 1e7)) return value.toExponential(3);
  if (value !== 0 && Math.abs(value) < 1) return value.toLocaleString('en-US', {maximumSignificantDigits: 4});
  return Number(value.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits: digits});
};
const numeric = value => typeof value === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()) && Number.isFinite(Number(value)) ? Number(value) : null;
const input = (prefix, key, label, unit) => `<label for="${prefix}-${key}">${label} · ${unit}<input id="${prefix}-${key}" data-fa-input="${key}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${prefix}-preparation-error"></label>`;
const REREAD_FIELDS = {mean:'平均值',sampleSd:'樣本 SD（n−1）',rsdPercent:'RSD'};
const REREAD_SCOPE = '同萃取液重讀可討論儀器／讀取階段的重複性；本題沒有真實儀器量測，也未拆分其他重讀因素，不能視為完整方法不確定度。';
const REREAD_CHOICES = {
  limited:'只描述同一萃取液重讀的分散，其他可靠性仍需證據',
  sampling:'已量到取樣與萃取造成的全部變動',
  bias:'RSD 小就證明没有固定偏差',
  complete:'這組 RSD 就是完整量測不確定度',
};
const freshReread = () => ({checked:false,reference:false,seen:false});
function freshDraft(startStep) {
  return {step:startStep,caseId:'f5',blankChoice:'',blankReviewed:false,blankReference:false,blankReferenceSeen:false,blankProvided:startStep>0,recoveryStage:'pre-extraction',
    blankFeedback:startStep>0?'本課依題設先帶入扣空白基準，可直接接續；尚未記為你的作答。':'',
    recoveryAnswers:{'pre-extraction':'','post-extraction':''},details:{},seenSteps:[],savedParts:{},savedVersions:[],observations:[],selectedObservation:'',selectedSaved:'',pending:null,status:'',active:null,
    reread:{opened:false,answers:{mean:'',sampleSd:'',rsdPercent:''},choice:'',writing:'',writingContext:'',firstContext:'',original:null,retainedContext:'',retainedCondition:'',retainedSnapshot:'',revision:'',revisionContext:'',stale:false,numbers:freshReread(),evidence:freshReread()},
    drafts:Object.fromEntries(FOOD_ANALYSIS_CASES.map(item=>{const values=createAnalysisInputs(item.id),dilution=values.dilutions[0];return[item.id,{sampleMassG:String(values.sampleMassG),extractFinalMl:String(values.extractFinalMl),aliquotMl:dilution?String(dilution.aliquotMl):'',finalMl:dilution?String(dilution.finalMl):'',totalAnswer:'',totalAttempted:false,totalReviewed:false,totalReference:false,totalReferenceSeen:false,totalProvided:startStep===4&&item.id==='f5',totalFeedback:'',modified:false}];}))};
}
function draftFor(owner,key,startStep) {
  if(!owner||!['object','function'].includes(typeof owner))return freshDraft(startStep);
  let map=ownerDrafts.get(owner);if(!map){map=new Map();ownerDrafts.set(owner,map);}
  if(!map.has(key))map.set(key,freshDraft(startStep));
  return map.get(key);
}
const safeReviewHref=value=>typeof value==='string'&&/^#(?:learn|process|micro)\/review$/.test(value)?value:'#learn/review';
const failureMessage=error=>{try{return typeof error?.message==='string'?error.message.slice(0,180):'';}catch{return '';}};

/** Hypothetical readings, never a laboratory report. No learning answers or browser storage are written. */
export function mountFoodAnalysisLab(container, id = FOOD_ANALYSIS_ID, {startStep = 0, onSaveSummary, draftOwner, draftKey = id, reviewHref = '#learn/review'} = {}) {
  if (!container || typeof container.querySelector !== 'function' || typeof container.addEventListener !== 'function') throw new TypeError('A DOM container is required');
  if (id !== FOOD_ANALYSIS_ID) throw new RangeError('Unknown food analysis activity');
  if (!Number.isInteger(startStep) || startStep < 0 || startStep > 4) throw new RangeError('Unknown food analysis starting step');
  if(typeof draftKey!=='string'||!draftKey.trim())throw new TypeError('A food analysis lesson key is required');
  mounted.get(container)?.dispose();
  const state=draftFor(draftOwner,draftKey,startStep);state.active?.dispose();
  const prefix = `food-analysis-${++instance}`, $ = selector => container.querySelector(selector);
  let disposed=false,step=state.step,caseId=state.caseId,blankChoice=state.blankChoice,blankReviewed=state.blankReviewed,blankReference=state.blankReference,blankReferenceSeen=state.blankReferenceSeen,blankProvided=state.blankProvided,recoveryStage=state.recoveryStage,summaryParts={},observationCount=-1,savedCount=-1;
  const reread=state.reread,drafts=state.drafts;
  const rereadResult = evaluateRepeatability(FOOD_REREAD_CASE.readings);
  function captureState(){Object.assign(state,{step,caseId,blankChoice,blankReviewed,blankReference,blankReferenceSeen,blankProvided,recoveryStage});for(const node of container.querySelectorAll('[data-fa-detail]'))state.details[node.dataset.faDetail]=node.open;}
  const condition=()=>{const d=drafts[caseId];return `第 ${step+1} 步「${steps[step]}」；配對紀錄 ${caseId.toUpperCase()}；試料「${d.sampleMassG}」g，萃取定容「${d.extractFinalMl}」mL，取液「${d.aliquotMl}」mL、定容「${d.finalMl}」mL；${recoveryStage==='pre-extraction'?'萃取前':'萃取後'}加標；重讀自己填入 ${Object.entries(REREAD_FIELDS).map(([key,label])=>`${label}「${reread.answers[key]}」`).join('、')}；證據選擇 ${REREAD_CHOICES[reread.choice]||'未選'}`;};
  const exposure=()=>`空白參考${blankReferenceSeen?'曾看':'未看'}；中間量參考${drafts[caseId].totalReferenceSeen?'曾看':'未看'}；重讀計算核對／參考${reread.numbers.seen?'曾看':'未看'}；重讀證據核對／參考${reread.evidence.seen?'曾看':'未看'}`;
  const writingContext=()=>`${reread.numbers.seen||reread.evidence.seen?'最後修改時已看過核對／參考':'最後修改時尚未看核對／參考'}（僅指重讀示範）；${condition()}；${exposure()}`;
  const blankReady = () => blankProvided || (blankReviewed && blankChoice === 'subtract') || blankReference;
  function currentInputs() {
    const values = createAnalysisInputs(caseId), draft = drafts[caseId];
    return {...values, sampleMassG: numeric(draft.sampleMassG), extractFinalMl: numeric(draft.extractFinalMl),
      dilutions: values.dilutions.length ? [{aliquotMl: numeric(draft.aliquotMl), finalMl: numeric(draft.finalMl)}] : []};
  }
  function currentResult() { return evaluateAnalysis(currentInputs()); }
  const readingCard = (label, hook, unit = '原始 A') => `<div class="fa-reading"><span>${label}</span><strong data-fa-value="${hook}">—</strong><small>${unit}</small></div>`;
  container.innerHTML = `<section class="food-analysis-lab" aria-labelledby="${prefix}-title">
    <header><p class="fa-evidence">教學假想資料 · D-glucose</p><h2 id="${prefix}-title">GOPOD 分析工作台</h2><p class="fa-scope">操作只保留在本頁；${draftOwner&&['object','function'].includes(typeof draftOwner)?'同頁返課可接續。':''}${typeof onSaveSummary === 'function' ? '按下附加後，才會把新內容存到本課筆記。' : '可選取摘要複製到筆記。'}重新整理或關頁前，請先保存或複製。</p></header>
    <div class="fa-progress-row"><label for="${prefix}-step">量測鏈<select id="${prefix}-step" data-fa-control="step">${steps.map((label, index) => `<option value="${index}">${index + 1} · ${label}</option>`).join('')}</select></label><span class="fa-progress-count" data-fa-progress>1 / 5</span></div>
    <p class="fa-current-case" data-fa-current-case></p>
    <section class="fa-stage" data-fa-stage="0" aria-labelledby="${prefix}-stage-0"><h3 id="${prefix}-stage-0" tabindex="-1">先辨認訊號的基準</h3><p class="fa-question">樣品和標準，都要如何處理試劑空白？</p>
      <label for="${prefix}-case">選一組配對的假想測定<select id="${prefix}-case" data-fa-control="case">${FOOD_ANALYSIS_CASES.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label>
      <div class="fa-readings">${readingCard('試劑空白', 'blank')}${readingCard('1 mg/mL 標準', 'standard')}${readingCard('樣品', 'sample')}</div>
      <div class="fa-choice-row" role="group" aria-label="選擇空白處理"><button type="button" data-fa-blank="subtract" aria-pressed="false">樣品與標準都扣空白</button><button type="button" data-fa-blank="raw" aria-pressed="false">直接用兩個原始讀值相比</button></div>
      <div class="fa-actions"><button type="button" class="fa-primary" data-fa-action="check-blank">檢查選擇</button><button type="button" class="fa-text" data-fa-action="reveal-blank">看空白處理參考</button></div><p class="fa-feedback" role="status" data-fa-blank-feedback></p>
      <p class="fa-note">此題的 A 尚未扣空白。真實儀器若已對試劑空白歸零，不能再扣一次；試劑空白也不能自動移除食品色澤或濁度。</p>
    </section>
    <section class="fa-stage" data-fa-stage="1" aria-labelledby="${prefix}-stage-1" hidden><h3 id="${prefix}-stage-1" tabindex="-1">用同批標準做比值校正</h3><p class="fa-question">換得的是加 GOPOD 前分析液的濃度。</p>
      <div class="fa-readings">${readingCard('樣品淨 A', 'net-sample', 'A')}${readingCard('標準淨 A', 'net-standard', 'A')}${readingCard('分析液濃度', 'concentration', 'mg/mL')}</div>
      <p class="fa-validation" data-fa-range></p><p class="fa-note">0.1 mL 分析液的工作區間為 4–100 μg，即 0.04–1.0 mg/mL。單點比值不等於本次已驗證整段線性。</p>
      <button type="button" class="fa-text" data-fa-action="return-readings">返回讀值，選另一組配對測定</button>
    </section>
    <section class="fa-stage" data-fa-stage="2" aria-labelledby="${prefix}-stage-2" hidden><h3 id="${prefix}-stage-2" tabindex="-1">核對取樣、定容與稀釋</h3><p class="fa-question">每一個乘除項，對應哪一份樣品？</p>
      <div class="fa-fields">${input(prefix, 'sampleMassG', '進入萃取的原樣試料', 'g')}${input(prefix, 'extractFinalMl', '萃取液最後定容', 'mL')}<div data-fa-dilution-field>${input(prefix, 'aliquotMl', '取萃取液', 'mL')}</div><div data-fa-dilution-field>${input(prefix, 'finalMl', '稀釋後定容', 'mL')}</div></div>
      <p class="fa-note" data-fa-preparation-summary></p><p id="${prefix}-preparation-error" class="fa-validation" data-fa-preparation-error></p>
      <p class="fa-note">欄位修改視為修正記錄，不是模擬改條件後的新實驗。若要比較新稀釋方案，返回讀值選 F1／F5／F10；讀值與方案會一起切換。</p><button type="button" class="fa-text" data-fa-action="reset-record">還原此組前處理記錄</button>
    </section>
    <section class="fa-stage" data-fa-stage="3" aria-labelledby="${prefix}-stage-3" hidden><h3 id="${prefix}-stage-3" tabindex="-1">先算整份萃取液，再回到 100 g</h3><p class="fa-question">這份萃取液一共測得多少 mg D-glucose？</p>
      <label for="${prefix}-total-answer">填入你的中間結果 · mg<input id="${prefix}-total-answer" data-fa-input="totalAnswer" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${prefix}-total-feedback"></label><div class="fa-actions"><button type="button" class="fa-primary" data-fa-action="check-total">檢查中間結果</button><button type="button" class="fa-text" data-fa-action="reveal-total">看本組計算參考</button></div><p id="${prefix}-total-feedback" class="fa-feedback" role="status" data-fa-total-feedback></p>
      <div class="fa-result" data-fa-report data-valid="false"><span>D-glucose · 按目前記錄換算</span><strong data-fa-report-value>—</strong><small>mg/100 g 原樣；未依回收率修正</small></div><p class="fa-validation" data-fa-report-status></p>
      <p class="fa-note">分析液濃度已由匹配的同批比值得到，不再乘 3.1/0.1 = 31，也不再除一次 0.1 mL。這不是總糖或乾基含量。</p>
    </section>
    <section class="fa-stage" data-fa-stage="4" aria-labelledby="${prefix}-stage-4" hidden><h3 id="${prefix}-stage-4" tabindex="-1">加標回收能檢查到哪一段？</h3><p class="fa-question">以下是獨立、固定的 F5 配對案例，並非你修改後的記錄。</p>
      <label for="${prefix}-recovery">加標位置<select id="${prefix}-recovery" data-fa-control="recovery">${FOOD_RECOVERY_CASES.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label>
      <div class="fa-readings">${readingCard('未加標測得', 'recovery-unspiked', 'mg，同一比較基準')}${readingCard('加標後測得', 'recovery-spiked', 'mg，同一比較基準')}${readingCard('已知加入', 'recovery-added', 'mg')}</div><p class="fa-note" data-fa-recovery-context></p>
      <div class="fa-result"><span>這一份加標設計的回收率</span><strong data-fa-recovery-value>—</strong><small>不自設通用合格門檻，也不把含量除以回收率。</small></div>
      <p class="fa-question">能因此證明原生 D-glucose 已全部萃取嗎？</p><div class="fa-choice-row" role="group" aria-label="判讀回收率"><button type="button" data-fa-recovery-answer="limited">不能；加標部分的行為不一定相同</button><button type="button" data-fa-recovery-answer="complete">可以，回收率足以驗證整個方法</button></div><p class="fa-feedback" role="status" data-fa-recovery-feedback></p>
      <details class="fa-details" data-fa-reread data-fa-detail="reread"><summary>同一萃取液重讀很一致，方法就可靠嗎？</summary><div class="fa-detail-body">
        <p class="fa-note">固定、原創假想的同一萃取液三次重讀：${FOOD_REREAD_CASE.readings.map(value=>fmt(value)).join('、')} ${esc(FOOD_REREAD_CASE.unit)}。這是獨立示範，不是上方含量或加標案例的重複值；修改前處理或切換回收位置，不會生成新的重讀實驗。</p>
        <p>自己算平均值、樣本 SD 與 RSD。樣本變異數的分母是 n−1；RSD = 100 × 樣本 SD / 平均值。</p>
        <div class="fa-fields">${Object.entries(REREAD_FIELDS).map(([key,label])=>`<label for="${prefix}-reread-${key}">${label} · ${key==='rsdPercent'?'%':esc(FOOD_REREAD_CASE.unit)}<input id="${prefix}-reread-${key}" data-fa-input="reread-${key}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${prefix}-reread-feedback-${key}"><span id="${prefix}-reread-feedback-${key}" class="fa-feedback" role="status" data-fa-reread-feedback="${key}"></span></label>`).join('')}</div>
        <div class="fa-actions"><button type="button" class="fa-primary" data-fa-action="check-reread-numbers">核對我的三個結果</button><button type="button" class="fa-text" data-fa-action="reveal-reread-numbers">看重讀計算參考</button></div>
        <p class="fa-question">這組重讀結果支持哪種證據結論？</p><div class="fa-choice-row" role="group" aria-label="判讀同萃取液重讀">${Object.entries(REREAD_CHOICES).map(([value,label])=>`<button type="button" data-fa-reread-answer="${value}" aria-pressed="false">${label}</button>`).join('')}</div>
        <div class="fa-actions"><button type="button" class="fa-primary" data-fa-action="check-reread-evidence">核對我的證據結論</button><button type="button" class="fa-text" data-fa-action="reveal-reread-evidence">看證據範圍參考</button></div><p class="fa-feedback" role="status" data-fa-reread-evidence-feedback></p>
        <label for="${prefix}-reread-writing">我的判讀與還需要的證據<textarea id="${prefix}-reread-writing" data-fa-input="reread-writing" rows="3" placeholder="分開說重讀變動、取樣／萃取、固定偏差與完整不確定度。"></textarea></label><p class="fa-note" data-fa-reread-writing-status>尚未留下文字；不自動評分。</p>
        <div class="fa-writing-actions"><button type="button" data-fa-action="retain-writing">保留這段原文</button></div><p class="fa-note" data-fa-writing-stale></p>
        <details class="fa-details" data-fa-detail="writing"><summary>原文與修訂</summary><div class="fa-detail-body"><pre class="fa-snapshot-text" data-fa-original>尚未保留原文。</pre><label for="${prefix}-reread-revision">修訂我的重讀判讀<textarea id="${prefix}-reread-revision" data-fa-input="reread-revision" rows="3" disabled placeholder="保留原文後，另寫哪些判讀要改、還缺什麼證據。"></textarea></label><p class="fa-note" data-fa-revision-context></p></div></details>
        <p class="fa-note">本例計算樣本 SD，不以母體 SD 或平均值的標準誤代替。它沒有提供獨立取樣、重新萃取、參考值或完整不確定度預算；不設通用合格門檻。</p>
        <p class="fa-note">${esc(REREAD_SCOPE)}</p>
      </div></details>
    </section>
    <div class="fa-equation-box"><p class="fa-equation" data-fa-equation></p><p class="fa-current-caption" data-fa-equation-caption></p></div>
    <nav class="fa-stage-nav" aria-label="量測鏈步驟"><button type="button" data-fa-action="previous">上一步</button><button type="button" class="fa-primary" data-fa-action="next">下一步</button></nav>
    <section class="fa-journal" aria-labelledby="${prefix}-journal-title"><h3 id="${prefix}-journal-title">觀察與筆記</h3><div class="fa-actions"><button type="button" data-fa-action="record-observation">保留目前觀察</button>${typeof onSaveSummary==='function'?'<button type="button" class="fa-primary" data-fa-action="save-summary">附加新內容到本課筆記</button>':''}<button type="button" data-fa-action="select-pending">選取待存內容</button></div><p class="fa-feedback fa-journal-status" role="status" data-fa-save-status></p><p class="fa-note" data-fa-observation-count></p>
      <details class="fa-details" data-fa-detail="journal"><summary>查看摘要與保留的版本</summary><div class="fa-detail-body"><p class="fa-note">只有確認保存的新內容會進入筆記；完整摘要可另行選取複製。保留觀察不等於保存，也不代表已掌握。</p><label for="${prefix}-pending">本次待存內容<textarea id="${prefix}-pending" data-fa-pending-summary readonly></textarea></label><label for="${prefix}-summary">完整假想案例與計算記錄<textarea id="${prefix}-summary" data-fa-summary readonly></textarea></label><div class="fa-actions"><button type="button" data-fa-action="select-summary">選取完整摘要文字</button></div><label for="${prefix}-observation">固定觀察<select id="${prefix}-observation" data-fa-control="observation"><option value="">選擇觀察</option></select></label><pre class="fa-snapshot-text" data-fa-observation-text></pre><label for="${prefix}-saved">已確認保存的版本<select id="${prefix}-saved" data-fa-control="saved"><option value="">選擇版本</option></select></label><pre class="fa-snapshot-text" data-fa-saved-text></pre><a href="${esc(safeReviewHref(reviewHref))}">到我的複習查看筆記 →</a></div></details>
    </section>
    <div class="fa-principle"><p>β-D-glucose + O₂ → D-glucono-1,5-lactone + H₂O₂</p><p class="fa-note">GOx 原理：後續以 POD 耦合顯色讀取訊號；定量使用同批 D-glucose 標準。</p></div>
    <details class="fa-details" data-fa-detail="principle"><summary>反應原理與這個方法的界線</summary><div class="fa-detail-body"><p>GOx 生成內酯與 H₂O₂，內酯可後續水解。H₂O₂ + 色原 —POD→ 醌亞胺色素，是耦合顯色示意，沒有完整列出原子、質子與係數；色原為 p-hydroxybenzoic acid 與 4-aminoantipyrine。</p><p>方法條件：0.1 mL 分析液配 3.0 mL GOPOD，510 nm、1 cm 光徑，指定終點條件。這些不是任意食品已確效的萃取流程。官方要求同批標準與重複測定；原含量與加標案例只有簡化假想批均值，不替它們生成 SD。另列的固定重讀示範可計算自己的樣本 SD，但不代表真實食品的方法重複性或完整不確定度。</p><p>回收率接近 100% 也不證明沒有固定背景、取樣偏差或原生分析物釋出問題。萃取前與後兩個設計不能直接相除，當成已證明的萃取效率。</p></div></details>
    <details class="fa-details" data-fa-detail="sources"><summary>完整假想資料與方法來源</summary><div class="fa-detail-body"><p>原含量與加標資料都是原創教學假想的批均值，並非廠商或食品實測，也沒有它們各自的完整重複讀值。另列的固定同萃取液重讀示範是獨立假想數據。共同空白 A = 0.030；1.0 mg/mL 標準 A = 1.030。基準試料 5 g、萃取後定容 100 mL。</p><div class="fa-table-wrap" tabindex="0" role="region" aria-label="假想配對測定記錄"><table><thead><tr><th>紀錄</th><th>額外稀釋</th><th>樣品原始 A</th></tr></thead><tbody>${FOOD_ANALYSIS_CASES.map(item => `<tr><th>${esc(item.id.toUpperCase())}</th><td>${item.inputs.dilutions.length ? item.inputs.dilutions.map(d => `${fmt(d.aliquotMl)} → ${fmt(d.finalMl)} mL`).join('；') : '無'}</td><td>${item.inputs.rawSample.toFixed(3)}</td></tr>`).join('')}</tbody></table></div><p>獨立回收案例：未加標 A = 0.280；萃取前加標 A = 0.370，加入 50 mg／5 g 試料；萃取後加標 A = 0.375，加入 1 mg／10 mL 分析液。對照份補等量溶劑且定容相同。</p><ul>${FOOD_ANALYSIS_SOURCES.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul><p class="fa-note">只以自己的文字重述方法事實；不轉載方法手冊或原圖。此活動不產生真實檢驗報告、法規合格或營養標示認證。</p></div></details>
  </section>`;

  function syncInputs() {
    const draft = drafts[caseId];
    for (const key of ['sampleMassG', 'extractFinalMl', 'aliquotMl', 'finalMl', 'totalAnswer']) $(`[data-fa-input="${key}"]`).value = draft[key];
  }
  function reportAllowed(result) { return blankReady() && result.usable && (drafts[caseId].totalReviewed || drafts[caseId].totalReference || drafts[caseId].totalProvided); }
  function blockReason(result) {
    if (!blankReady()) return '先回讀值檢查空白處理，或查看參考；後續公式仍可閱讀。';
    if (!result.usable) return result.range === 'above-working-range' ? '樣品超過工作區間；請選另一組配對稀釋測定，這裡不產生有效報告。' : result.range === 'below-working-range' ? '樣品低於工作區間；不能把公式估值當成有效定量。' : result.errors.map(error => error.message).join('；') || '目前記錄不可計算，請返回前處理檢查。';
    return '先檢查整份萃取液的中間結果，或查看本組計算參考。';
  }
  const rereadActive = () => step === 4 && $('[data-fa-reread]').open;
  const rereadReference = key => key === 'mean' ? `平均 = (2450 + 2500 + 2550) / 3 = ${fmt(rereadResult.mean)} mg/100 g。`
    : key === 'sampleSd' ? `樣本 SD = √[(−50)² + 0² + 50²] / √(3−1) = ${fmt(rereadResult.sampleSd)} mg/100 g；不是母體 SD 或標準誤。`
    : `RSD = 100 × ${fmt(rereadResult.sampleSd)} / ${fmt(rereadResult.mean)} = ${fmt(rereadResult.rsdPercent)}%。`;
  const rereadEvidenceReference = '只描述同一萃取液這三次重讀的分散。沒有獨立取樣、重新萃取或參考值，不能把它當成取樣／萃取變動、沒有固定偏差的證明，或完整量測不確定度。';
  function rereadCorrect(key) {
    const value = numeric(reread.answers[key]), expected = rereadResult[key];
    // Numerical answer tolerance, not an analytical acceptance criterion.
    return value !== null && value >= 0 && Math.abs(value-expected) <= Math.max(1e-8, Math.abs(expected)*1e-6);
  }
  function invalidateReread(keys = ['numbers','evidence']) {
    for (const key of keys) { reread[key].checked = false; reread[key].reference = false; }
    if (reread.writing) reread.stale = true;
  }
  function drawReread() {
    for (const key of Object.keys(REREAD_FIELDS)) {
      const raw = reread.answers[key], field = $(`[data-fa-input="reread-${key}"]`);
      if (field.value !== raw) field.value = raw;
      const value = numeric(raw);
      field.setAttribute('aria-invalid', String(reread.numbers.checked && (value === null || value < 0)));
      let feedback = '';
      if (reread.numbers.checked) feedback = value === null ? '請填有限數字；空白不等於 0。' : value < 0 ? '本題結果須為非負數字。' : rereadCorrect(key) ? '與這組固定讀值相符。' : `還不相符。${key === 'mean' ? '先將三次讀值相加，再除以 n。' : key === 'sampleSd' ? '樣本 SD 用 n−1；不要填母體 SD 或平均值的標準誤。' : 'RSD 用樣本 SD 除以平均，再乘 100%。'}`;
      else if (reread.numbers.reference) feedback = `參考：${rereadReference(key)}`;
      $(`[data-fa-reread-feedback="${key}"]`).textContent = feedback;
    }
    container.querySelectorAll('[data-fa-reread-answer]').forEach(button=>button.setAttribute('aria-pressed', String(button.dataset.faRereadAnswer === reread.choice)));
    $('[data-fa-action="check-reread-evidence"]').disabled = !reread.choice;
    $('[data-fa-reread-evidence-feedback]').textContent = reread.evidence.checked ? `${reread.choice === 'limited' ? '這項證據結論符合題設。' : '這項結論超過資料。'} ${rereadEvidenceReference}` : reread.evidence.reference ? `參考：${rereadEvidenceReference}` : '';
    const writingField = $('[data-fa-input="reread-writing"]');
    if (writingField.value !== reread.writing) writingField.value = reread.writing;
    writingField.readOnly=reread.original!==null;
    const revisionField=$('[data-fa-input="reread-revision"]');
    if(revisionField.value!==reread.revision)revisionField.value=reread.revision;
    revisionField.disabled=reread.original===null;
    $('[data-fa-action="retain-writing"]').disabled=reread.original!==null||!reread.writing.trim();
    $('[data-fa-original]').textContent=reread.original===null?'尚未保留原文。':`${reread.original}\n\n首次編寫：${reread.firstContext}\n保留時：${reread.retainedContext}\n\n當時觀察：\n${reread.retainedSnapshot}`;
    $('[data-fa-revision-context]').textContent=reread.revisionContext?`修訂時：${reread.revisionContext}`:'修訂另行保留，不覆寫原文。';
    $('[data-fa-writing-stale]').textContent=reread.original!==null&&reread.retainedCondition!==condition()?'目前條件已改變；固定原文仍屬保留時的條件，可在修訂補充。':'';
    $('[data-fa-reread-writing-status]').textContent = reread.writing ? `${reread.writingContext.split('；')[0]}${reread.stale ? '；答案或判讀已修改，文字待重新檢查。' : ''}${reread.original!==null?'；原文已固定，後續請寫修訂。':''} 文字不自動評分。` : '尚未留下文字；不自動評分。';
    let lines = [`同萃取液重讀示範｜${reread.opened ? '已開啟' : '尚未開啟'}；獨立於原含量與固定回收案例。`];
    if (reread.opened) {
      lines.push(`固定原創假想重讀：${FOOD_REREAD_CASE.readings.join('、')} ${FOOD_REREAD_CASE.unit}；同一萃取液，n=${rereadResult.n}。`);
      for (const [key,label] of Object.entries(REREAD_FIELDS)) {
        const raw = reread.answers[key];
        lines.push(`${label}自己填入：${raw.trim() === '' ? '未填' : raw}${raw.trim() === '' ? '' : key === 'rsdPercent' ? '%' : ' mg/100 g'}；${reread.numbers.checked ? rereadCorrect(key) ? '已核對相符' : '已核對，待調整' : '未核對'}。`);
        if (reread.numbers.reference) lines.push(`計算參考：${rereadReference(key)}`);
      }
      lines.push(`重讀計算：${reread.numbers.seen ? '曾看核對／參考' : '未看核對／參考'}。`, `證據結論自己的選擇：${REREAD_CHOICES[reread.choice] || '未選'}；${reread.evidence.checked ? reread.choice === 'limited' ? '已核對相符' : '已核對，待調整' : '未核對'}；${reread.evidence.seen ? '曾看核對／參考' : '未看核對／參考'}。`);
      if (reread.evidence.checked || reread.evidence.reference) lines.push(`證據範圍核對／參考：${rereadEvidenceReference}`);
      lines.push('此樣本 SD 不是原含量／回收案例的 SD，也不是固定偏差或完整不確定度。', REREAD_SCOPE);
    }
    summaryParts.reread=lines.join('\n');
    // The text part has one stable identity before and after explicit retention.
    // Metadata changes must not append the same learner prose a second time.
    if(reread.opened){
      summaryParts.writing=`重讀示範自己的文字：${(reread.original??reread.writing)||'未寫'}（不自動評分）`;
      summaryParts.writingMetadata=`原文狀態：${reread.original===null?'未保留草稿':'已保留'}\n首次編寫：${reread.firstContext||'未寫'}\n最後修改時：${reread.writingContext||'未寫'}${reread.stale?'；答案或判讀後來已修改。':''}\n保留原文時條件：${reread.retainedContext||'尚未保留'}${reread.original===null&&!reread.writing?'\n未保留草稿：未填或已清空':''}${reread.retainedSnapshot?'\n原文保留時的固定觀察：\n'+reread.retainedSnapshot:''}`;
      summaryParts.revision=`重讀判讀修訂：${reread.revision||'未寫或已清空'}\n修訂時條件：${reread.revisionContext||'未寫'}`;
    }
  }
  function pendingSummary(){
    const parts={...summaryParts};
    for(let index=0;index<state.observations.length;index++)parts[`observation-${index}`]=`固定觀察 ${index+1}\n${state.observations[index]}`;
    const full=Object.values(parts).join('\n\n'),changed=Object.entries(parts).filter(([key,value])=>state.savedParts[key]!==value);
    return {parts,full,text:changed.length?Object.keys(state.savedParts).length?['GOPOD 分析工作台 · 本次新增／修改',...changed.map(([,value])=>value)].join('\n\n'):full:''};
  }
  function drawJournal(){
    const next=pendingSummary(),over=next.text.length>10000;
    $('[data-fa-summary]').value=next.full;$('[data-fa-pending-summary]').value=next.text;
    const save=$('[data-fa-action="save-summary"]');if(save)save.disabled=Boolean(state.pending)||!next.text||over;
    $('[data-fa-save-status]').textContent=state.pending?'正在附加；仍可繼續操作。':over?'待存內容超過 10,000 字元，尚未送出；全文保留，請先選取複製。':state.status||(!next.text?'已追加到本課筆記；目前沒有新內容。':Object.keys(state.savedParts).length?'摘要已變更；本次只附加新增或修改的部分。':typeof onSaveSummary==='function'?'尚未保存；可附加新內容到本課筆記。':'可選取摘要複製到筆記。');
    $('[data-fa-observation-count]').textContent=state.observations.length?`已保留 ${state.observations.length} 次觀察；保留後可回看。`:'可先固定目前觀察，再繼續改條件。';
    if(observationCount!==state.observations.length){observationCount=state.observations.length;$('[data-fa-control="observation"]').innerHTML='<option value="">選擇觀察</option>'+state.observations.map((_,index)=>`<option value="${index}">第 ${index+1} 次觀察</option>`).join('');}
    if(savedCount!==state.savedVersions.length){savedCount=state.savedVersions.length;$('[data-fa-control="saved"]').innerHTML='<option value="">選擇版本</option>'+state.savedVersions.map((_,index)=>`<option value="${index}">第 ${index+1} 次附加</option>`).join('');}
    $('[data-fa-control="observation"]').value=state.selectedObservation;$('[data-fa-control="saved"]').value=state.selectedSaved;
    const validIndex=value=>/^(?:0|[1-9]\d*)$/.test(value)?Number(value):-1;
    $('[data-fa-observation-text]').textContent=state.observations[validIndex(state.selectedObservation)]||'保留後可在這裡回看。';
    const saved=state.savedVersions[validIndex(state.selectedSaved)];$('[data-fa-saved-text]').textContent=saved?`當次新增：\n${saved.text}\n\n當時完整摘要：\n${saved.full}`:'';
  }
  function saveSummary(){
    if(disposed||state.pending||typeof onSaveSummary!=='function')return;
    const captured=pendingSummary();if(!captured.text||captured.text.length>10000){drawJournal();return;}
    state.pending=captured;state.status='';drawJournal();
    const finish=(ack,error)=>{if(state.pending!==captured)return;state.pending=null;if(ack===true){Object.assign(state.savedParts,captured.parts);state.savedVersions.push(Object.freeze({text:captured.text,full:captured.full}));state.status='';}else{const message=failureMessage(error);state.status=`尚未保存${message?'：'+message:'；請查看課內儲存提示'}。摘要仍可選取複製。`;}state.active?.render();};
    try{const answer=onSaveSummary(captured.text);if(answer!==null&&['object','function'].includes(typeof answer)&&typeof answer.then==='function')Promise.resolve(answer).then(value=>finish(value),error=>finish(false,error));else finish(answer);}catch(error){finish(false,error);}
  }
  function draw() {
    if(disposed)return;captureState();if(!state.seenSteps.includes(step))state.seenSteps.push(step);summaryParts={};
    const result = currentResult(), values = currentInputs(), draft = drafts[caseId], ready = blankReady(), valid = ready && result.usable, report = reportAllowed(result), recovery = evaluateRecovery(recoveryStage);
    $('[data-fa-control="step"]').value = String(step); $('[data-fa-control="case"]').value = caseId; $('[data-fa-control="recovery"]').value = recoveryStage;
    $('[data-fa-progress]').textContent = `${step + 1} / 5 · ${steps[step]}`;
    $('[data-fa-current-case]').textContent=`目前配對紀錄：${caseId.toUpperCase()} · 樣品原始 A ${values.rawSample.toFixed(3)}${draft.modified?' · 前處理記錄已修改，讀值仍屬這一組':''}`;
    $('[data-fa-blank-feedback]').textContent=state.blankFeedback;
    $('[data-fa-total-feedback]').textContent=draft.totalFeedback;
    const recoveryAnswer=state.recoveryAnswers[recoveryStage];
    container.querySelectorAll('[data-fa-recovery-answer]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.faRecoveryAnswer===recoveryAnswer)));
    $('[data-fa-recovery-feedback]').textContent=!recoveryAnswer?'':recoveryAnswer==='limited'?'這個限制抓對了。加標部分的回收不代表原生 D-glucose 同樣容易釋出，也未驗證取樣代表性。':'這個結論超過資料。加標回收只檢查指定位置加入的那一份；即使接近 100%，仍可能有固定背景與取樣偏差。';
    container.querySelectorAll('[data-fa-stage]').forEach(panel => panel.hidden = Number(panel.dataset.faStage) !== step);
    const readings = {blank: values.rawBlank.toFixed(3), standard: values.rawStandard.toFixed(3), sample: values.rawSample.toFixed(3), 'net-sample': ready ? fmt(result.net.sample) : '—', 'net-standard': ready ? fmt(result.net.standard) : '—', concentration: ready ? fmt(result.analysisSolutionMgMl) : '—', 'recovery-unspiked': fmt(recovery.unspikedMg), 'recovery-spiked': fmt(recovery.spikedMg), 'recovery-added': fmt(recovery.addedMg)};
    for (const [key, value] of Object.entries(readings)) $(`[data-fa-value="${key}"]`).textContent = value;
    container.querySelectorAll('[data-fa-blank]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.faBlank === blankChoice)));
    $('[data-fa-action="check-blank"]').disabled = !blankChoice;
    $('[data-fa-range]').textContent = !ready ? blockReason(result) : result.range === 'within-range' ? `${fmt(result.assayUg)} μg/assay，在本方法工作區間內；不等於這份食品的方法已確效。` : blockReason(result);
    const hasDilution = createAnalysisInputs(caseId).dilutions.length > 0;
    container.querySelectorAll('[data-fa-dilution-field]').forEach(node => node.hidden = !hasDilution);
    for (const key of ['aliquotMl', 'finalMl']) $(`[data-fa-input="${key}"]`).disabled = !hasDilution;
    $('[data-fa-preparation-summary]').textContent = `${hasDilution ? `額外稀釋 F = ${fmt(result.dilutionFactor)}` : '此組沒有額外稀釋，F = 1'}。一次測定固定取 0.1 mL 分析液。${draft.modified ? '目前是你修正的紀錄。' : ''}`;
    const preparationErrors = result.errors.filter(error => /sampleMassG|extractFinalMl|dilutions|aliquotMl|finalMl|mgPer100g/.test(error.field));
    $('[data-fa-preparation-error]').textContent = preparationErrors.map(error => error.message).join('；');
    for (const key of ['sampleMassG', 'extractFinalMl', 'aliquotMl', 'finalMl']) $(`[data-fa-input="${key}"]`).setAttribute('aria-invalid', String(preparationErrors.some(error => error.field === 'mgPer100g' || error.field.includes(key) || (['aliquotMl', 'finalMl'].includes(key) && error.field.startsWith('dilutions')))));
    $('[data-fa-action="check-total"]').disabled = !valid;
    $('[data-fa-action="reveal-total"]').disabled = !valid;
    $('[data-fa-report]').dataset.valid = String(report);
    $('[data-fa-report-value]').textContent = report ? fmt(result.mgPer100g, 2) : '—';
    $('[data-fa-report-status]').textContent = report ? `${draft.totalProvided ? '這是題設帶入的未加標參考，未記為學生作答。' : '按目前記錄換算的教學結果。'}仍未證明完全萃取或取樣代表性。` : blockReason(result);
    $('[data-fa-recovery-context]').textContent = recoveryStage === 'pre-extraction' ? '固定 F5：另取等質量 5 g 試料，萃取前加 50 mg；兩份最後均定容 100 mL。比較的是整份萃取液的 mg。' : '固定 F5：各取同萃取液 2 mL，分別定容至 10 mL；一份加 1 mg，對照補等量溶劑。比較的是這兩份分析液各自的 mg。';
    $('[data-fa-recovery-value]').textContent = recovery.usable ? `${fmt(recovery.recoveryPercent, 2)}%` : '—';
    const formulas = [
      'ΔA樣品 = A樣品 − A空白；ΔA標準 = A標準 − A空白',
      ready ? `c分析液 = ${fmt(result.net.sample)} / ${fmt(result.net.standard)} × 1 mg/mL = ${fmt(result.analysisSolutionMgMl)} mg/mL` : 'c分析液 = ΔA樣品 / ΔA標準 × 1 mg/mL',
      hasDilution ? `F = ${fmt(numeric(draft.finalMl))} mL / ${fmt(numeric(draft.aliquotMl))} mL；c萃取液 = c分析液 × F` : 'F = 1；c萃取液 = c分析液',
      report ? `${fmt(result.totalMg, 2)} mg / ${fmt(values.sampleMassG)} g × 100 g = ${fmt(result.mgPer100g, 2)} mg/100 g` : 'M = c分析液 × F × V萃取液；w = M / m試料 × 100 g',
      `回收率 = (${fmt(recovery.spikedMg)} − ${fmt(recovery.unspikedMg)}) mg / ${fmt(recovery.addedMg)} mg × 100% = ${fmt(recovery.recoveryPercent, 2)}%`
    ];
    $('[data-fa-equation]').textContent = formulas[step];
    $('[data-fa-equation-caption]').textContent = step === 4 ? '獨立固定 F5 教學案例；不套用你在前處理改過的數字。' : '教學假想資料；公式結果與真實量測可靠性分開判讀。';
    $('[data-fa-action="previous"]').disabled = step === 0;
    $('[data-fa-action="next"]').disabled = step === steps.length - 1;
    $('[data-fa-action="next"]').textContent = step < steps.length - 1 ? `下一步：${steps[step + 1]} →` : '已走到最後一步';
    $('[data-fa-summary]').value = `教學假想資料 · GOPOD D-glucose\n配對紀錄：${caseId.toUpperCase()}${draft.modified ? '（前處理紀錄經修改）' : ''}\n原始 A：blank ${values.rawBlank.toFixed(3)}；標準 ${values.rawStandard.toFixed(3)}；樣品 ${values.rawSample.toFixed(3)}\n空白處理：${ready ? '樣品與標準各扣同批空白' : '尚未核對'}\n分析液濃度：${ready ? fmt(result.analysisSolutionMgMl) : '—'} mg/mL（加 GOPOD 前）\n試料 ${draft.sampleMassG || '—'} g；萃取定容 ${draft.extractFinalMl || '—'} mL；額外稀釋 F=${fmt(result.dilutionFactor)}\n全份萃取液：${report ? fmt(result.totalMg, 2) : '—'} mg\nD-glucose：${report ? fmt(result.mgPer100g, 2) : '—'} mg/100 g 原樣；未依回收修正\n狀態：${report ? '教學換算已顯示；不代表真實食品定量已確效' : blockReason(result)}\n獨立固定 F5 回收案例：${recoveryStage === 'pre-extraction' ? '萃取前加標' : '萃取後加標'} ${fmt(recovery.recoveryPercent, 2)}%；與上述修改紀錄無關。\n仍需查取樣代表性、基質干擾與原生分析物的萃取行為。`;
    $('[data-fa-summary]').value += `\n稀釋記錄：${hasDilution ? `取 ${draft.aliquotMl || '—'} mL，定容至 ${draft.finalMl || '—'} mL` : '無額外稀釋'}\n同一回收基準：未加標 ${fmt(recovery.unspikedMg)} mg；加標後 ${fmt(recovery.spikedMg)} mg；已知加入 ${fmt(recovery.addedMg)} mg。`;
    const blankProcess = blankProvided ? '依題設帶入，未記為學生作答' : blankReference ? '查看參考後使用扣空白' : blankReviewed && blankChoice === 'subtract' ? `自己選擇扣空白並檢查${blankReferenceSeen ? '（先前看過參考）' : ''}` : blankReviewed ? '已檢查，但選擇未相符' : '尚未核對';
    const totalProcess = draft.totalReviewed ? `自行填入並核對相符${draft.totalReferenceSeen ? '（先前看過參考）' : ''}` : draft.totalReference ? '查看計算參考，未記為學生作答' : draft.totalProvided ? '依題設帶入參考，未記為學生作答' : draft.totalAttempted ? '已檢查，但輸入未相符' : '尚未核對';
    $('[data-fa-summary]').value += `\n操作紀錄：\n空白處理來源：${blankProcess}\n中間量自己填入：${draft.totalAnswer || '未填'}${draft.totalAnswer ? ' mg' : ''}\n中間量處理：${totalProcess}\n檢查與參考只記錄本次操作，不代表已掌握。`;
    if (blankReferenceSeen || draft.totalReferenceSeen) $('[data-fa-summary]').value += '\n曾查看參考；查看參考不代表已掌握。';
    summaryParts.analysis=$('[data-fa-summary]').value;
    summaryParts.context=`目前步驟：${step+1} · ${steps[step]}\n曾查看步驟：${state.seenSteps.map(index=>`${index+1} · ${steps[index]}`).join('、')}\n回收判讀自己的選擇：${recoveryAnswer==='limited'?'不能；加標部分的行為不一定相同':recoveryAnswer==='complete'?'可以，回收率足以驗證整個方法':'未選'}\n${recoveryAnswer?`回收判讀回覆：${$('[data-fa-recovery-feedback]').textContent}`:'回收判讀尚未作答'}`;
    drawReread();
    drawJournal();
  }
  function moveTo(value) {
    if (!Number.isInteger(value) || value < 0 || value >= steps.length) return;
    captureState();state.status='';
    step = value;
    if (rereadActive()) reread.opened = true;
    draw();
    const heading = $(`#${prefix}-stage-${step}`);
    heading?.focus?.({preventScroll: true});
    heading?.scrollIntoView?.({block: 'start', behavior: 'instant'});
  }
  function resetTotal(message = '上游記錄已改變；先前輸入保留，請重新檢查中間結果。') {
    drafts[caseId].totalAttempted = false; drafts[caseId].totalReviewed = false; drafts[caseId].totalReference = false; drafts[caseId].totalProvided = false;
    drafts[caseId].totalFeedback = message;
  }
  function onInput(event) {
    if (disposed || !container.contains(event.target)) return;
    captureState();
    const target = event.target, key = target?.dataset?.faInput;
    if (key?.startsWith('reread-')) {
      if (!rereadActive()) return;
      const name = key.slice(7);
      if (name === 'writing') {
        if(reread.original!==null){drawReread();drawJournal();return;}
        if(reread.writing===target.value)return;
        reread.writing = target.value; reread.stale = false;
        reread.writingContext=writingContext();reread.firstContext||=reread.writingContext;
      } else if(name==='revision'){
        if(reread.original===null){drawReread();drawJournal();return;}
        if(reread.revision===target.value)return;
        reread.revision=target.value;reread.revisionContext=writingContext();
      } else if (Object.hasOwn(reread.answers,name)) { if(reread.answers[name]===target.value)return;reread.answers[name] = target.value; invalidateReread(); }
      else return;
      state.status='';reread.opened = true; draw(); return;
    }
    if (!['sampleMassG', 'extractFinalMl', 'aliquotMl', 'finalMl', 'totalAnswer'].includes(key) || target.disabled) return;
    if(drafts[caseId][key]===target.value)return;
    state.status='';
    drafts[caseId][key] = target.value;
    resetTotal(key === 'totalAnswer' ? '' : undefined);
    if (key !== 'totalAnswer') drafts[caseId].modified = true;
    draw();
  }
  function onChange(event) {
    if (disposed || !container.contains(event.target)) return;
    captureState();
    const target = event.target, key = target?.dataset?.faControl, value = target?.value;
    if (key === 'step') { if (/^[0-4]$/.test(value)) moveTo(Number(value)); else target.value = String(step); }
    else if (key === 'case') {
      if (!FOOD_ANALYSIS_CASES.some(item => item.id === value)) { target.value = caseId; return; }
      caseId = value;state.status=''; syncInputs(); draw();
    } else if (key === 'recovery') {
      if (!['pre-extraction', 'post-extraction'].includes(value)) { target.value = recoveryStage; return; }
      recoveryStage = value;state.status='';draw();
    } else if(key==='observation'||key==='saved'){
      const entries=key==='observation'?state.observations:state.savedVersions;
      if(value!==''&&(!/^(?:0|[1-9]\d*)$/.test(value)||!entries[Number(value)])){drawJournal();return;}
      state[key==='observation'?'selectedObservation':'selectedSaved']=value;drawJournal();
    }
  }
  function onToggle(event) {
    if (disposed || !container.contains(event.target)) return;
    captureState();
    if(event.target === $('[data-fa-reread]')&&rereadActive()&&!reread.opened){reread.opened=true;state.status='';draw();}
  }
  function onClick(event) {
    if (disposed) return;
    captureState();
    const target = event.target?.closest?.('[data-fa-action], [data-fa-blank], [data-fa-recovery-answer], [data-fa-reread-answer]');
    if (!target || !container.contains(target) || target.disabled) return;
    if (target.dataset.faRereadAnswer) {
      if (!rereadActive() || !Object.hasOwn(REREAD_CHOICES,target.dataset.faRereadAnswer)) return;
      if(reread.choice===target.dataset.faRereadAnswer)return;
      state.status='';reread.opened = true; reread.choice = target.dataset.faRereadAnswer; invalidateReread(['evidence']); draw(); return;
    }
    if (target.dataset.faBlank) {
      if (!['subtract', 'raw'].includes(target.dataset.faBlank)) return;
      blankChoice = target.dataset.faBlank; blankReviewed = false; blankReference = false; blankProvided = false; resetTotal();
      state.status='';state.blankFeedback = ''; draw(); return;
    }
    if (target.dataset.faRecoveryAnswer) {
      if(!['limited','complete'].includes(target.dataset.faRecoveryAnswer))return;
      state.recoveryAnswers[recoveryStage]=target.dataset.faRecoveryAnswer;state.status='';draw();
      return;
    }
    const action = target.dataset.faAction;
    if (['check-reread-numbers','reveal-reread-numbers','check-reread-evidence','reveal-reread-evidence'].includes(action)) {
      if (!rereadActive()) return;
      const record = action.endsWith('numbers') ? reread.numbers : reread.evidence;
      if (action.startsWith('check-')) {
        if (record === reread.evidence && !reread.choice) return;
        record.checked = true;
      } else record.reference = true;
      record.seen = true; reread.opened = true;state.status=''; draw(); return;
    }
    if (action === 'previous') { moveTo(step - 1); return; }
    if (action === 'next') { moveTo(step + 1); return; }
    if (action === 'return-readings') { moveTo(0); return; }
    if (action === 'select-summary') { $('[data-fa-summary]').focus(); $('[data-fa-summary]').select?.(); return; }
    if(action==='select-pending'){state.details.journal=true;$('[data-fa-detail="journal"]').open=true;$('[data-fa-pending-summary]').focus();$('[data-fa-pending-summary]').select?.();return;}
    if(action==='save-summary'){saveSummary();return;}
    if(action==='record-observation'){state.observations.push([condition(),exposure(),summaryParts.analysis,summaryParts.context,summaryParts.reread].join('\n\n'));state.selectedObservation=String(state.observations.length-1);state.status='';drawJournal();return;}
    if(action==='retain-writing'){
      if(!rereadActive()||reread.original!==null||!reread.writing.trim())return;
      reread.original=reread.writing;reread.retainedCondition=condition();reread.retainedContext=`${condition()}；${exposure()}`;reread.retainedSnapshot=[summaryParts.analysis,summaryParts.context,summaryParts.reread].join('\n\n');state.status='';draw();return;
    }
    state.status='';
    if (action === 'check-blank') {
      if (!blankChoice) return;
      blankReviewed = true;
      state.blankFeedback = blankChoice === 'subtract' ? '此題原始讀值尚未扣空白；樣品與同批標準各扣一次，再計比值。' : '直接取原始 A 比值會把共同背景帶入。此題應先將樣品與標準各扣一次 0.030，再相除。';
    } else if (action === 'reveal-blank') {
      blankReference = true; blankReferenceSeen = true; blankProvided = false; blankChoice = 'subtract';
      state.blankFeedback = '參考已顯示：樣品與標準各扣 0.030。這只是本題基準處理，不表示食品背景已全部排除。';
    } else if (action === 'check-total' || action === 'reveal-total') {
      const result = currentResult(); if (!blankReady() || !result.usable) return;
      if (action === 'reveal-total') {
        drafts[caseId].totalReference = true; drafts[caseId].totalReferenceSeen = true;
        drafts[caseId].totalFeedback = `參考：${fmt(result.analysisSolutionMgMl)} mg/mL × ${fmt(result.dilutionFactor)} × ${fmt(numeric(drafts[caseId].extractFinalMl))} mL = ${fmt(result.totalMg, 2)} mg。`;
      } else {
        const answer = numeric(drafts[caseId].totalAnswer), tolerance = Math.min(.0051, Math.abs(result.totalMg) * .001) + Number.EPSILON * Math.abs(result.totalMg) * 8;
        const correct = answer !== null && answer > 0 && Math.abs(answer - result.totalMg) <= tolerance;
        drafts[caseId].totalAttempted = true;
        drafts[caseId].totalReviewed = correct;
        drafts[caseId].totalFeedback = correct ? '中間結果與目前記錄相符。接著以這份試料的質量換算到每 100 g。' : answer === null ? '先填一個有限數值，或查看本組計算參考。' : '還不相符。先把分析液濃度乘額外稀釋倍數，再乘整份萃取定容體積；不要再乘 31。';
      }
    } else if (action === 'reset-record') {
      const values = createAnalysisInputs(caseId), d = values.dilutions[0], draft = drafts[caseId];
      Object.assign(draft, {sampleMassG: String(values.sampleMassG), extractFinalMl: String(values.extractFinalMl), aliquotMl: d ? String(d.aliquotMl) : '', finalMl: d ? String(d.finalMl) : '', modified: false});
      resetTotal('已還原此組前處理；你的中間答案保留，請重新核對。'); syncInputs();
    } else return;
    draw();
  }
  for(const node of container.querySelectorAll('[data-fa-detail]'))node.open=Boolean(state.details[node.dataset.faDetail]);
  function dispose(){if(disposed)return;captureState();disposed=true;container.removeEventListener('input',onInput);container.removeEventListener('change',onChange);container.removeEventListener('click',onClick);container.removeEventListener('toggle',onToggle,true);if(state.active===view)state.active=null;if(mounted.get(container)===view)mounted.delete(container);}
  const view={dispose,render:draw};state.active=view;mounted.set(container,view);
  syncInputs(); draw();
  container.addEventListener('input', onInput); container.addEventListener('change', onChange); container.addEventListener('click', onClick);
  container.addEventListener('toggle', onToggle, true);
  return dispose;
}
