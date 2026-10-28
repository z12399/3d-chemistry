import {escapeHTML as esc} from './storage.js';
import {
  VITAMIN_C_LAB_ID, BALANCE_FORMS, FOOD_RECORDS, VITAMIN_C_SOURCES,
  VITAMIN_C_ASSAY_DEFAULTS, evaluateBalance, evaluateHydrolysis, evaluateAssay, compareFood,
} from './vitamin-c-model.js';
export {VITAMIN_C_LAB_ID} from './vitamin-c-model.js';

const STEPS = ['balance', 'assay', 'food'];
const LABELS = {balance: '配電子帳', assay: '選量測定義', food: '讀食品觀測'};
const HEADINGS = {
  balance: '氧化成 DHA，少了幾個 H⁺ 與電子？',
  assay: '這個數字，量到 AA 還是總 C？',
  food: 'AA 下降，兩個分項的和也一樣下降嗎？',
};
const ASSAY_MODES = {direct: '直接量 AA', reduced: '還原處理後量總 C'};
const ASSAY_CHOICES = {
  aa: '只能描述 AA，還不知道 DHA 分項',
  difference: '在配對方法前提下，可由差值估計 DHA 的 AA 當量',
  unreportable: '目前配對不支持有效分項報告；先檢查基準、還原與回收',
  loss: '這個讀值就是維生素 C 已分解的量',
};
const FOOD_CHOICES = {
  separate: '可描述兩天分項均值；尚不能宣稱顯著差異或速率',
  loss: 'AA 的減少量就是總維生素 C 的損失量',
  kinetics: '兩個日期已足以確定連續反應速率與顯著性',
};
const HYDROLYSIS_CHOICES = {
  connectivity: '還需連接與結構證據；分子式不能唯一辨認物種',
  dkg: 'C₆H₈O₇ 只可能是 DKG，已可排除水合 DHA',
  hydrate: 'C₆H₈O₇ 只可能是水合 DHA，已可排除 DKG',
};
const HYDROLYSIS_KEYS = ['hydrolysis', 'hydrolysis-identity'];
const SOURCE_LABELS = {'sources':'結構、資料與來源','food-source':'食品原表與推論界線','balance-boundary':'半反應記帳邊界','assay-boundary':'配對前提與讀值界線','ascorbic-acid':'中性 AA 結構來源','dehydroascorbic-acid':'形式未水合 DHA 結構來源'};
const sourceLabel = key => SOURCE_LABELS[key] || VITAMIN_C_SOURCES.find(source => source.id === key)?.title || key;
const MOLECULE_IDS = ['ascorbic-acid', 'dehydroascorbic-acid'];
const fresh = () => ({choice: '', checked: false, reference: false, seen: false});
const fmt = value => !Number.isFinite(value) ? '—' : value === 0 ? '0' : Math.abs(value) < .001 || Math.abs(value) >= 1e6 ? value.toExponential(3) : String(Number(value.toPrecision(5)));
const signed = value => `${value > 0 ? '+' : ''}${fmt(value)}`;
const numeric = value => typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()) ? Number(value) : NaN;
const safeHref = value => typeof value === 'string' && /^#[a-z][a-z0-9/-]*$/i.test(value) ? value : '#learn/review';
const secureUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } };
const drafts = new WeakMap(), mounted = new WeakMap();
// Drafts live only in this page/module instance; notes remain an explicit action.
const clone = value => JSON.parse(JSON.stringify(value));
function draftFor(owner, key) {
  const freshDraft = () => ({state:null, first:null, records:[], savedParts:null, savedVersions:[], saving:false, status:'', views:new Set()});
  if (!owner || !['object', 'function'].includes(typeof owner)) return freshDraft();
  let byKey = drafts.get(owner);
  if (!byKey) { byKey = new Map(); drafts.set(owner, byKey); }
  if (!byKey.has(key)) byKey.set(key, freshDraft());
  return byKey.get(key);
}
const sameCamera = (a,b) => {
  const near = (x,y) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x-y) <= 64*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(y));
  return !!a && !!b && ['position','up','target'].every(key => Array.isArray(a[key]) && Array.isArray(b[key]) && a[key].length === 3 && b[key].length === 3 && a[key].every((x,i) => near(x,b[key][i]))) && ['maxDistance','aspect'].every(key => near(a[key],b[key]));
};
let instance = 0;

/** A single 3D endpoint viewer, redox accounting, and two distinct measurement exercises. */
export function mountVitaminCLab(container, id = VITAMIN_C_LAB_ID, {
  startStep = 'balance', draftOwner, draftKey = id, onSaveSummary, reviewHref = '#learn/review',
} = {}) {
  if (id !== VITAMIN_C_LAB_ID) throw new RangeError('Unknown vitamin C activity');
  if (!STEPS.includes(startStep)) throw new RangeError('Unknown vitamin C step');
  if (!container?.querySelector || !container?.addEventListener) throw new TypeError('A DOM container is required');
  mounted.get(container)?.();
  const draft = draftFor(draftOwner, draftKey);
  const prefix = `vitamin-c-${++instance}`;
  const $ = selector => container.querySelector(selector);
  const $$ = selector => container.querySelectorAll(selector);
  const control = name => $(`[data-vc-control="${name}"]`);
  const action = name => $(`[data-vc-action="${name}"]`);
  const text = (selector, value) => { $(selector).textContent = value; };
  let answers = Object.fromEntries([...STEPS, ...HYDROLYSIS_KEYS].map(key => [key, fresh()]));
  let visited = new Set([startStep]);
  let coefficients = Object.fromEntries(BALANCE_FORMS.map(form => [form.id, {protons: '', electrons: ''}]));
  let hydrolysisRaw = {water: '', protons: '', electrons: ''};
  let assayRaw = {direct: String(VITAMIN_C_ASSAY_DEFAULTS.direct), total: String(VITAMIN_C_ASSAY_DEFAULTS.total)};
  let writing = {text: '', revision: '', context: '', stale: false, revisionContext: '', revisionStale: false};
  const aborter = new AbortController();
  let step = startStep, formId = 'neutral', moleculeId = 'ascorbic-acid';
  let foodId = FOOD_RECORDS.find(record => record.id === 'lb50-f125')?.id || FOOD_RECORDS[0].id;
  let mode = '', disposed = false, viewer = null, molecules = null, selectedAtom = '';
  let showHydrogen = false, allLabels = false, rotateEnabled = !(typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  let balanceResult = null, assayResult = null, balanceError = '', assayError = '';
  let hydrolysisResult = null, hydrolysisError = '', hydrolysisOpened = false;
  let structureStatus = '準備代表結構…';
  let details = {}, cameras = {}, seenSources = [];
  function restoreDraft() {
    const state = draft.state;
    if (!state) return;
    ({step, formId, moleculeId, foodId, mode, selectedAtom, showHydrogen, allLabels, rotateEnabled, hydrolysisOpened} = state);
    ({answers, coefficients, hydrolysisRaw, assayRaw, writing, details, cameras, seenSources} = clone(state));
    visited = new Set(state.visited);
  }
  function captureCamera() {
    if (!viewer?.cameraState) return;
    const view = viewer.cameraState();
    if (!sameCamera(cameras[moleculeId], view)) cameras[moleculeId] = clone(view);
  }
  function snapshot() {
    captureCamera();
    return clone({step, formId, moleculeId, foodId, mode, selectedAtom, showHydrogen, allLabels, rotateEnabled, hydrolysisOpened,
      answers, coefficients, hydrolysisRaw, assayRaw, writing, details, cameras, seenSources, visited:[...visited]});
  }
  function retainDraft() { draft.state = snapshot(); }
  restoreDraft();

  const choices = (key, values) => `<div class="vc-choices">${Object.entries(values).map(([value, label]) => `<button type="button" data-vc-choice="${value}" data-vc-for="${key}" aria-pressed="false">${label}</button>`).join('')}</div>`;
  const checkButtons = key => `<div class="vc-actions"><button type="button" class="vc-primary" data-vc-action="check" data-vc-for="${key}">核對我的${key === 'balance' || key === 'hydrolysis' ? '配平' : '判讀'}</button><button type="button" data-vc-action="reference" data-vc-for="${key}">看參考</button></div><p class="vc-feedback" role="status" data-vc-feedback="${key}"></p>`;
  const options = values => values.map(value => `<option value="${value}">${value}</option>`).join('');
  const lettuceValues = [...new Set(FOOD_RECORDS.map(record => record.lettucePercent))];
  const fillValues = [...new Set(FOOD_RECORDS.map(record => record.fillGrams))];
  container.innerHTML = `<section class="vitamin-c-lab" aria-labelledby="${prefix}-title">
    <p class="vc-kicker" id="${prefix}-title">維生素 C · 結構、記帳與量測</p>
    <nav class="vc-steps" aria-label="維生素 C 工作台步驟">${STEPS.map(key => `<button type="button" data-vc-step="${key}" aria-pressed="false">${LABELS[key]}</button>`).join('')}</nav>
    <h2 class="vc-heading" data-vc-heading tabindex="-1"></h2>
    <div class="vc-layout">
      <div class="vc-molecule">
        <div class="vc-form-choice" role="group" aria-label="選擇獨立代表結構"><button type="button" data-vc-molecule="ascorbic-acid" aria-pressed="true">AA · 中性</button><button type="button" data-vc-molecule="dehydroascorbic-acid" aria-pressed="false">DHA · 形式未水合</button></div>
        <div class="vc-identity"><strong data-vc-molecule-name>AA · 中性代表構象</strong><span data-vc-molecule-formula>C₆H₈O₆</span></div>
        <div class="vc-viewer" data-vc-viewer aria-label="可旋轉的維生素 C 獨立代表結構"><div class="vc-viewer-status" data-vc-viewer-status role="status">準備代表結構…</div></div>
        <div class="vc-scene-tools"><button type="button" data-vc-action="fit">回到整體</button><button type="button" data-vc-action="rotation" aria-pressed="true">拖曳旋轉已開啟</button></div>
        <p class="vc-caption" data-vc-structure-note>代表構象；切換端點不是反應軌跡。</p>
        <details data-vc-detail="viewer"><summary>位點、鍵盤轉動與顯示</summary>
          <div class="vc-camera" role="group" aria-label="以按鈕轉動分子"><button type="button" data-vc-turn="left" aria-label="分子視角向左轉">← 左轉</button><button type="button" data-vc-turn="right" aria-label="分子視角向右轉">右轉 →</button><button type="button" data-vc-turn="up" aria-label="分子視角向上轉">↑ 上轉</button><button type="button" data-vc-turn="down" aria-label="分子視角向下轉">下轉 ↓</button></div>
          <label class="vc-field" for="${prefix}-atom">選取一個原子<select id="${prefix}-atom" data-vc-control="atom"><option value="">不選取</option></select></label><button type="button" data-vc-action="focus-atom">聚焦選取原子與鄰居</button>
          <label class="vc-toggle"><input type="checkbox" data-vc-control="hydrogen">顯示所有氫</label><label class="vc-toggle"><input type="checkbox" data-vc-control="labels">顯示所有原子標籤</label><p class="vc-caption">平時只標示選取原子；原子編號是此圖的 ID，不跨結構追蹤原子。</p>
        </details>
      </div>
      <div class="vc-work">
        <section data-vc-panel="balance">
          <label class="vc-field" for="${prefix}-form">用哪個反應物形式配平？<select id="${prefix}-form" data-vc-control="form">${BALANCE_FORMS.map(form => `<option value="${esc(form.id)}">${esc(form.label)}</option>`).join('')}</select></label>
          <p class="vc-caption" data-vc-form-note></p>
          <div class="vc-equation" data-vc-equation></div>
          <div class="vc-coefficients">${['protons', 'electrons'].map((key, index) => `<label class="vc-field" for="${prefix}-${key}">右側 ${index ? 'e⁻' : 'H⁺'} 的係數<select id="${prefix}-${key}" data-vc-control="${key}"><option value="">自己選</option>${options([0, 1, 2, 3, 4])}</select></label>`).join('')}</div>
          <p class="vc-error" role="status" data-vc-balance-error></p>${checkButtons('balance')}
          <details data-vc-detail="balance-boundary"><summary>半反應的記帳邊界</summary><p>同時檢查元素與電荷。電子不是 H 原子；氧化半反應也沒有單獨交代最後的電子受體。選擇的質子化形式會改變 H⁺ 係數。</p><p>此處 DHA 是配平用的形式未水合代表，不等於水中所有 DHA 的真實形式；沒有水合、開環或後續不可逆分解的動力學。</p></details>
          <details data-vc-hydrolysis data-vc-detail="hydrolysis">
            <summary>DHA 加水之後，還要放出電子嗎？</summary>
            <p>指定終點為中性 DKG。此帳從形式未水合 DHA 出發，左側補 H₂O、右側補 H⁺ 與 e⁻，自己檢查元素及電荷。若起點已是水合雙環 DHA，不再加一次水。</p>
            <div class="vc-equation" data-vc-hydrolysis-equation></div>
            <div class="vc-coefficients">${Object.entries({water:'左側 H₂O',protons:'右側 H⁺',electrons:'右側 e⁻'}).map(([key,label]) => `<label class="vc-field" for="${prefix}-hydrolysis-${key}">${label} 的係數<select id="${prefix}-hydrolysis-${key}" data-vc-control="hydrolysis-${key}"><option value="">自己選</option>${options([0, 1, 2, 3, 4])}</select></label>`).join('')}</div>
            <p class="vc-error" role="status" data-vc-hydrolysis-error></p>${checkButtons('hydrolysis')}
            <p>只知道分子式 C₆H₈O₇，能唯一區分水合 DHA 與開環 DKG 嗎？</p>
            ${choices('hydrolysis-identity', HYDROLYSIS_CHOICES)}${checkButtons('hydrolysis-identity')}
            <p class="vc-caption">依 Dewhirst & Fry（2018）的形式界線，以未游離中性形式自行配平淨帳，不混用圖中的陰離子；不是逐步機構、水合平衡或速率。3D 仍是獨立的 AA／形式未水合 DHA，沒有 DKG 或水合 DHA 模型。</p>
          </details>
        </section>
        <section data-vc-panel="assay" hidden>
          <p class="vc-caption">獨立假想配對樣品 · mg AA 當量／100 g。與食品原表不是同一批紀錄。</p>
          <p>先選擇量測定義，再判讀讀值。</p><div class="vc-choices" role="group" aria-label="選擇量測定義">${Object.entries(ASSAY_MODES).map(([value, label]) => `<button type="button" data-vc-mode="${value}" aria-pressed="false">${label}</button>`).join('')}</div>
          <div class="vc-coefficients">${['direct', 'total'].map(key => `<label class="vc-field" for="${prefix}-${key}">${key === 'direct' ? '直接量 AA' : '還原後總 C'}<input id="${prefix}-${key}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-vc-control="${key}" value="${esc(assayRaw[key])}"></label>`).join('')}</div>
          <div class="vc-result"><span data-vc-assay-label>尚未選量測定義</span><strong data-vc-assay-value>—</strong><p data-vc-assay-note></p></div>
          <p class="vc-equation" data-vc-assay-equation>先選量測定義</p><p class="vc-error" role="status" data-vc-assay-error></p>
          ${choices('assay', ASSAY_CHOICES)}${checkButtons('assay')}
          <details data-vc-detail="assay-boundary"><summary>配對前提與讀值界線</summary><p>讀值範圍 0–1000 是本教學介面限制。兩筆須有相同原樣基準，並確認還原、選擇性與回收條件，才能以差值估計 DHA 的 AA 當量。不是直接量到 DHA 的真實質量，也不能從一筆濃度倒推出分解量。</p><p>修改的是假想紀錄，不代表執行新實驗；負差保留供診斷，不截為 0。</p></details>
        </section>
        <section data-vc-panel="food" hidden>
          <p class="vc-caption" data-vc-food-context></p>
          <div class="vc-food-controls"><label class="vc-field" for="${prefix}-lettuce">配方中的萵苣比例<select id="${prefix}-lettuce" data-vc-control="lettuce">${lettuceValues.map(value => `<option value="${value}">${value}% LB</option>`).join('')}</select></label><label class="vc-field" for="${prefix}-fill">包裝充填量<select id="${prefix}-fill" data-vc-control="fill">${fillValues.map(value => `<option value="${value}">${value} g</option>`).join('')}</select></label></div>
          <div class="vc-legend"><span>AA</span><span>DHAA（原表用語）</span></div>
          <div data-vc-food-observations></div>
          <p class="vc-caption">長度使用固定共同刻度，只比較兩個已觀測日期；不補畫日期間的曲線。</p>
          <p class="vc-source-line" data-vc-food-source></p>
          ${choices('food', FOOD_CHOICES)}${checkButtons('food')}
          <details data-vc-detail="food-source"><summary>差值、原表讀值與推論界線</summary><p data-vc-food-difference></p><p>兩均值和是本頁另算，未附加誤差棒、顯著性或反應速率；不是從原文取得的總量獨立量測。</p><div class="vc-table-wrap"><table><caption>選定配方的刊載兩分項均值</caption><thead><tr><th>日期</th><th>AA</th><th>DHAA</th><th>兩均值和</th></tr></thead><tbody data-vc-food-table></tbody></table></div><p data-vc-food-boundary></p></details>
        </section>
      </div>
    </div>
    <details class="vc-own" data-vc-detail="writing"><summary>寫下判讀與後續修訂</summary><label class="vc-field" for="${prefix}-writing">我的判讀與需要補的證據<textarea id="${prefix}-writing" rows="3" data-vc-control="writing" placeholder="用自己的話，分開說結構、量測定義與資料支持的範圍。"></textarea></label><p class="vc-caption" data-vc-writing-status>主要判讀尚未填寫；不自動評分。</p><label class="vc-field" for="${prefix}-revision">後續修訂<textarea id="${prefix}-revision" rows="3" data-vc-control="revision"></textarea></label><p class="vc-caption" data-vc-revision-status>後續修訂尚未填寫；不自動評分。</p><p class="vc-caption">按下保留會固定當時文字；修改目前文字不改寫首次保留。</p></details>
    <div class="vc-record-bar"><button type="button" data-vc-action="record">保留這次判讀</button><span data-vc-record-count></span></div>
    <details data-vc-detail="history"><summary>首次保留、後續觀察與已附加版本</summary><h3>首次保留</h3><pre data-vc-first></pre><h3>後續觀察</h3><div data-vc-records></div><h3>已附加版本</h3><div data-vc-saved></div></details>
    <nav class="vc-bottom-nav" aria-label="切換維生素 C 工作台步驟"><button type="button" data-vc-action="previous">上一步</button><button type="button" data-vc-action="next">下一步</button></nav>
    <p class="vc-caption">同頁離開再回來可接續；重新載入前請附加筆記並匯出。查看與核對不代表已掌握。</p>
    <details data-vc-detail="preview"><summary>本次將附加的新增內容</summary><label class="vc-field" for="${prefix}-summary">自己的選擇、核對及目前資料<textarea id="${prefix}-summary" rows="8" readonly data-vc-summary></textarea></label><div class="vc-actions"><button type="button" data-vc-action="select-summary">選取摘要文字</button>${typeof onSaveSummary === 'function' ? '<button type="button" class="vc-primary" data-vc-action="save">存到本課筆記</button>' : ''}</div><p class="vc-feedback" role="status" data-vc-save-status></p><a href="${esc(safeHref(reviewHref))}">到我的複習查看筆記 →</a></details>
    <details data-vc-detail="sources"><summary>結構、資料與來源</summary><p data-vc-identity-note></p><p>旋轉改變的是觀看方向，不是分子反應、單鍵自由能或溶液構象比例。畫面沒有把真實分項量測轉成 3D 分子族群。</p><ul>${VITAMIN_C_SOURCES.map(source => { const url = secureUrl(source.url); return `<li>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-vc-source="${esc(source.id || source.title)}">${esc(source.title)} ↗</a>` : esc(source.title)}</li>`; }).join('')}</ul><p data-vc-structure-source></p></details>
  </section>`;

  function calculate() {
    balanceResult = null; balanceError = ''; assayResult = null; assayError = '';
    hydrolysisResult = null; hydrolysisError = '';
    const current = coefficients[formId];
    if (current.protons !== '' && current.electrons !== '') {
      try { balanceResult = evaluateBalance(formId, {protons: numeric(current.protons), electrons: numeric(current.electrons)}); }
      catch { balanceError = '係數須為 0–4 的整數；沒有沿用上一組核對。'; }
    }
    if (Object.values(hydrolysisRaw).every(value => value !== '')) {
      try { hydrolysisResult = evaluateHydrolysis(Object.fromEntries(Object.entries(hydrolysisRaw).map(([key,value]) => [key,numeric(value)]))); }
      catch { hydrolysisError = '係數須為 0–4 的整數；沒有沿用上一組水解核對。'; }
    }
    if (mode) {
      try { assayResult = evaluateAssay({mode, direct: numeric(assayRaw.direct), total: numeric(assayRaw.total)}); }
      catch { assayError = '請輸入 0–1000 的有效十進位讀值；下游結果已清除。'; }
    }
  }

  function explanation(key) {
    if (key === 'hydrolysis') return '指定中性形式的淨帳為 C₆H₆O₆ + H₂O → C₆H₈O₇：左側 1 H₂O，右側 0 H⁺、0 e⁻。此帳從形式未水合 DHA 出發；若已是水合雙環 DHA，不再加一次水。元素與電荷均守恆；這不是第二次二電子氧化，也未描述逐步開環機構。';
    if (key === 'hydrolysis-identity') return '水合 DHA 與開環 DKG 可有相同元素式，還要查連接與結構證據。此題已指定 DKG 終點；單靠配平或 C₆H₈O₇，不能鑑定未知物種或食品中的比例。';
    if (key === 'balance') {
      const form = BALANCE_FORMS.find(item => item.id === formId);
      return `此形式右側為 ${form.expectedProtons ?? form.expectedH} H⁺ 與 ${form.expectedElectrons} e⁻。元素與電荷需同時守恆；這是半反應記帳，不是反應軌跡。`;
    }
    if (key === 'assay') {
      if (!mode) return '直接法描述 AA；配對還原後的讀值才按題設代表總 C。差值還依賴相同基準與方法回收等條件。';
      if (!assayResult) return '目前紀錄無效，需先修正讀值，再限定結論。';
      if (!assayResult.reportable) return '目前配對紀錄不支持有效的分項報告。負差可提示檢查還原、基準或回收，不是負的 DHA 含量。';
      return mode === 'direct' ? '直接量 AA 尚未包含 DHA 分項；不能把 AA 濃度當成分解量或全部維生素 C。' : '題設的配對還原方法以總 C 減 AA，得到 DHA 的 AA 當量。這不等於直接量得 DHA 真實質量，也不單獨證明分解路徑。';
    }
    return '兩個日期只能描述所選處理下 AA、DHAA 的刊載均值，以及本頁另算的兩均值和；不能直接宣稱顯著差異、連續速率或把 AA 減少全當成總 C 損失。';
  }

  function revisionConditionContext() {
    let condition = '';
    if (step === 'balance') {
      const form = BALANCE_FORMS.find(item => item.id === formId), current = coefficients[formId];
      condition = `${form.label}；右側 H⁺=${current.protons === '' ? '未選' : current.protons}、e⁻=${current.electrons === '' ? '未選' : current.electrons}`;
      if (hydrolysisOpened) condition += `；DHA 後續帳 H₂O=${hydrolysisRaw.water === '' ? '未選' : hydrolysisRaw.water}、H⁺=${hydrolysisRaw.protons === '' ? '未選' : hydrolysisRaw.protons}、e⁻=${hydrolysisRaw.electrons === '' ? '未選' : hydrolysisRaw.electrons}`;
    } else if (step === 'assay') {
      condition = `${ASSAY_MODES[mode] || '未選量測定義'}；直接 AA=${assayRaw.direct === '' ? '空白' : assayRaw.direct}、還原後總 C=${assayRaw.total === '' ? '空白' : assayRaw.total} mg AA 當量／100 g`;
    } else {
      condition = `${FOOD_RECORDS.find(item => item.id === foodId).label}；第 1／9 日刊載均值`;
    }
    return `修訂最後修改於「${LABELS[step]}」；${condition}；${Object.values(answers).some(answer => answer.seen) ? '已看過核對／參考' : '尚未看核對／參考'}`;
  }

  function revisionContextText(value) {
    const context = typeof value.revisionContext === 'string' && value.revisionContext ? value.revisionContext : '修訂條件未記錄，不回填為目前條件';
    return context + (value.revisionStale === true ? '；條件已更改，請重新檢查這段修訂。' : '');
  }

  function scientificParts() {
    const record = FOOD_RECORDS.find(item => item.id === foodId), food = compareFood(foodId);
    const form = BALANCE_FORMS.find(item => item.id === formId), current = coefficients[formId];
    const opening = [
      '維生素 C 工作台｜代表結構、假想量測與食品原表是不同證據層。',
      `3D：${moleculeId === 'ascorbic-acid' ? '中性 AA' : '形式未水合 DHA'}；代表構象，不是反應軌跡。`,
      `半反應形式：${form.label}；自己的係數 H⁺=${current.protons || '未選'}，e⁻=${current.electrons || '未選'}。3D 不呈現單陰離子形態。`,
      `假想紀錄：直接 AA=${assayRaw.direct || '空白'}；還原後總 C=${assayRaw.total || '空白'} mg AA 當量／100 g。自己的量測定義：${ASSAY_MODES[mode] || '未選'}。`,
    ];
    const lines = Object.fromEntries(['intro','structure','balance-current','assay-raw'].map((key,i) => [key,opening[i]]));
    if (assayResult) lines['assay-result'] = `目前讀值=${fmt(assayResult.measurementValue)}；${mode === 'reduced' ? '差值=' + fmt(assayResult.difference) + ' mg AA 當量／100 g；' : ''}${assayResult.reportable ? '可按題設方法定義表達，非方法確效。' : '目前不能表達有效分項報告。'}`;
    else lines['assay-result'] = mode ? '假想紀錄無效，下游已清除。' : '尚未選量測定義；沒有推定總 C 或 DHA。';
    lines.food = `食品原表：${record.label}；${food.unit}。第1日 AA=${record.day1.aaText}，DHAA=${record.day1.dhaaText}；第9日 AA=${record.day9.aaText}，DHAA=${record.day9.dhaaText}。` + '\n\n' + `刊載兩均值和（本頁另算）：${fmt(food.day1.total)} → ${fmt(food.day9.total)}；Δ=${signed(food.change.total)} ${food.unit}。沒有從均值和推算誤差、顯著性或速率。`;
    for (const key of STEPS) {
      const answer = answers[key];
      const choice = key === 'balance' ? `H⁺ ${current.protons || '未選'}；e⁻ ${current.electrons || '未選'}` : (key === 'assay' ? ASSAY_CHOICES : FOOD_CHOICES)[answer.choice] || '未選';
      lines['answer-' + key] = `${LABELS[key]}｜${visited.has(key) ? '已開啟' : '尚未開啟'}；自己的判讀：${choice}；${answer.checked ? '已核對' : '未核對'}；${answer.seen ? '曾看核對／參考' : '未看核對／參考'}。${answer.checked || answer.reference ? '\n核對／參考：' + explanation(key) : ''}`;
    }
    lines.hydrolysis = `DHA 後續變化｜${hydrolysisOpened ? '已開啟' : '尚未開啟'}；3D 不呈現 DKG 或水合 DHA。`;
    if (hydrolysisOpened) {
      const coefficientChoice = `左側 H₂O ${hydrolysisRaw.water === '' ? '未選' : hydrolysisRaw.water}；右側 H⁺ ${hydrolysisRaw.protons === '' ? '未選' : hydrolysisRaw.protons}；e⁻ ${hydrolysisRaw.electrons === '' ? '未選' : hydrolysisRaw.electrons}`;
      for (const key of HYDROLYSIS_KEYS) {
        const answer = answers[key], choice = key === 'hydrolysis' ? coefficientChoice : HYDROLYSIS_CHOICES[answer.choice] || '未選';
        const result = key === 'hydrolysis' && answer.checked && hydrolysisResult ? `元素${hydrolysisResult.atomBalance ? '守恆' : '未守恆'}；電荷${hydrolysisResult.chargeBalance ? '守恆' : '未守恆'}。` : '';
        lines['answer-' + key] = `${key === 'hydrolysis' ? 'DHA 水解淨帳' : '分子式與身分'}｜自己的選擇：${choice}；${answer.checked ? '已核對' : '未核對'}；${answer.seen ? '曾看核對／參考' : '未看核對／參考'}。${result}${answer.checked || answer.reference ? '\n核對／參考：' + explanation(key) : ''}`;
      }
    }
    lines.writing = `自己的文字：${writing.text === '' ? '未寫' : writing.text}（不自動評分）`;
    lines['writing-context'] = `最後修改時：${writing.context || '未寫'}${writing.stale ? '；之後條件已更改，文字待重新檢查。' : ''}`;
    lines.revision = `後續修訂：${writing.revision === '' ? '未寫' : writing.revision}${writing.revision ? '\n修訂條件：' + revisionContextText(writing) : ''}`;
    lines.sources = VITAMIN_C_SOURCES.map(source => `${source.title}：${source.url}`).join('\n\n');
    return lines;
  }

  function recordText(state) {
    const forms = BALANCE_FORMS.map(form => `${form.label}：H⁺=${state.coefficients[form.id].protons || '未選'}；e⁻=${state.coefficients[form.id].electrons || '未選'}`).join('\n');
    const answerLines = Object.entries(state.answers).map(([key,a]) => `${LABELS[key] || (key === 'hydrolysis' ? 'DHA 水解淨帳' : '分子式與身分')}：${(key === 'assay' ? ASSAY_CHOICES : key === 'food' ? FOOD_CHOICES : HYDROLYSIS_CHOICES)[a.choice] || '未選'}；${a.checked ? '已核對' : '未核對'}；${a.seen ? '曾看核對／參考' : '未看核對／參考'}`).join('\n');
    return `畫面：${LABELS[state.step]}；3D：${state.moleculeId === 'ascorbic-acid' ? '中性 AA' : '形式未水合 DHA'}；原子 ${state.selectedAtom || '未選'}\n${forms}\nDHA 水解原始係數：H₂O=${state.hydrolysisRaw.water || '未選'}；H⁺=${state.hydrolysisRaw.protons || '未選'}；e⁻=${state.hydrolysisRaw.electrons || '未選'}\n假想原始讀值：AA=${state.assayRaw.direct || '空白'}；總 C=${state.assayRaw.total || '空白'} mg AA 當量／100 g；${ASSAY_MODES[state.mode] || '尚未選定義'}\n食品：${FOOD_RECORDS.find(r => r.id === state.foodId).label}\n${answerLines}\n自己的文字：${state.writing.text || '未寫'}\n${state.writing.context || '尚未修改文字'}${state.writing.stale ? '；條件已更改' : ''}\n後續修訂：${state.writing.revision || '未寫'}${state.writing.revision ? '\n修訂條件：' + revisionContextText(state.writing) : ''}\n曾開啟來源：${state.seenSources.map(sourceLabel).join('、') || '無'}（不表示讀懂）`;
  }
  function parts() {
    // Stable labels keep a change to one answer from resending later sections.
    const p = scientificParts();
    p['全部配平形式'] = '各形式原始係數\n' + BALANCE_FORMS.map(form => `${form.label}：H⁺=${coefficients[form.id].protons || '未選'}；e⁻=${coefficients[form.id].electrons || '未選'}`).join('\n');
    p['目前錯誤'] = `輸入診斷：半反應 ${balanceError || '無'}；水解 ${hydrolysisError || '無'}；假想讀值 ${assayError || '無'}。`;
    p['顯示偏好'] = `觀看設定：原子 ${selectedAtom || '未選'}；顯示氫 ${showHydrogen ? '是' : '否'}；全部標籤 ${allLabels ? '是' : '否'}；拖曳 ${rotateEnabled ? '開' : '關'}。`;
    p['視角'] = `保留視角：${JSON.stringify(cameras)}（觀看設定，不是物理運動）。`;
    p['來源開啟'] = `曾開啟來源：${seenSources.map(sourceLabel).join('、') || '無'}（不表示讀懂）。`;
    p['首次'] = draft.first ? '首次保留（第一次按下保留；非盲測或學習成效）\n' + recordText(draft.first) : '首次保留：尚未保留。';
    draft.records.forEach((record,i) => { p['觀察-' + i] = `保留觀察 ${i+1}\n` + recordText(record); });
    return p;
  }
  function pending() {
    const p = parts(), changed = Object.entries(p).filter(([key,value]) => !draft.savedParts || draft.savedParts[key] !== value).map(([,value]) => value);
    return {parts:clone(p), text:changed.length ? (draft.savedParts ? '維生素 C 工作台｜本次新增／修改\n\n' : '') + changed.join('\n\n') : ''};
  }
  function summary() { return pending().text; }
  function settleSave(captured, success, error) {
    if (success === true) {
      draft.savedParts = captured.parts;
      draft.savedVersions.push(captured.text);
      draft.status = '已追加到本課筆記，可到我的複習查看。';
    } else draft.status = error ? '尚未保存；筆記暫時無法寫入，摘要仍可選取複製。' : '尚未保存；摘要仍可選取複製。';
    draft.saving = false;
    for (const paint of draft.views) paint();
  }
  function save() {
    if (disposed || draft.saving || typeof onSaveSummary !== 'function') return;
    retainDraft();
    const captured = pending();
    if (!captured.text) return;
    if (captured.text.length > 10000) { draft.status = '新增內容超過 10,000 字，尚未送出或截斷；全文可選取複製。'; render(); return; }
    draft.saving = true; draft.status = '正在附加…'; render();
    try {
      const result = onSaveSummary(captured.text);
      if (result && typeof result.then === 'function') Promise.resolve(result).then(value => settleSave(captured,value), error => settleSave(captured,false,error));
      else settleSave(captured,result);
    } catch (error) { settleSave(captured,false,error); }
  }

  function renderFood() {
    const record = FOOD_RECORDS.find(item => item.id === foodId), result = compareFood(foodId);
    control('lettuce').value = String(record.lettucePercent); control('fill').value = String(record.fillGrams);
    text('[data-vc-food-context]', `食品研究觀測 · ${result.unit} · 第 1 與第 9 日`);
    const maxTotal = Math.max(...FOOD_RECORDS.flatMap(item => [item.day1.aa + item.day1.dhaa, item.day9.aa + item.day9.dhaa]));
    const axisMax = Math.ceil(maxTotal * 10) / 10;
    $('[data-vc-food-observations]').innerHTML = ['day1', 'day9'].map((day, index) => `<div class="vc-observation"><div class="vc-observation-head"><span>第 ${index ? '9' : '1'} 日</span><strong>兩均值和 ${fmt(result[day].total)}</strong></div><div class="vc-bar" aria-hidden="true"><span class="vc-bar-aa" style="width:${record[day].aa / axisMax * 100}%"></span><span class="vc-bar-dhaa" style="width:${record[day].dhaa / axisMax * 100}%"></span></div><div class="vc-observation-values"><span>AA ${esc(record[day].aaText)}</span><span>DHAA ${esc(record[day].dhaaText)}</span></div></div>`).join('') + `<p class="vc-caption">共同刻度：0–${fmt(axisMax)} ${esc(result.unit)}；兩均值和由本頁另算。</p>`;
    text('[data-vc-food-difference]', `第 9 日 − 第 1 日：AA ${signed(result.change.aa)}；DHAA ${signed(result.change.dhaa)}；兩均值和 ${signed(result.change.total)} ${result.unit}。`);
    $('[data-vc-food-table]').innerHTML = ['day1', 'day9'].map((day, index) => `<tr><td>第 ${index ? '9' : '1'} 日</td><td>${esc(record[day].aaText)}</td><td>${esc(record[day].dhaaText)}</td><td>${fmt(result[day].total)}（另算）</td></tr>`).join('');
    text('[data-vc-food-boundary]', typeof result.boundary === 'string' ? result.boundary : '原表的分項均值不等於個別樣品的反應軌跡。');
    text('[data-vc-food-source]', '原始分項數值來自研究表格；完整來源列於下方。');
  }

  function render() {
    if (disposed) return;
    retainDraft();
    text('[data-vc-heading]', HEADINGS[step]);
    for (const node of $$('[data-vc-step]')) node.setAttribute('aria-pressed', String(node.dataset.vcStep === step));
    for (const node of $$('[data-vc-panel]')) node.hidden = node.dataset.vcPanel !== step;
    for (const node of $$('[data-vc-molecule]')) node.setAttribute('aria-pressed', String(node.dataset.vcMolecule === moleculeId));
    const current = coefficients[formId];
    control('form').value = formId;
    for (const key of ['protons', 'electrons']) control(key).value = current[key];
    text('[data-vc-form-note]', formId === 'monoanion' ? '此題配平 AA 單陰離子；左側 3D 仍是所選的中性代表端點，不是此陰離子的構象。' : '此題從中性 AA 配平。3D 是所選端點的代表構象，不會播放反應過程。');
    $('[data-vc-equation]').innerHTML = `<span>${formId === 'neutral' ? 'C₆H₈O₆' : 'C₆H₇O₆⁻'} → C₆H₆O₆</span> <span>+ ${current.protons === '' ? '?' : esc(current.protons)} H⁺</span> <span>+ ${current.electrons === '' ? '?' : esc(current.electrons)} e⁻</span>`;
    text('[data-vc-balance-error]', balanceError);
    for (const key of Object.keys(hydrolysisRaw)) control(`hydrolysis-${key}`).value = hydrolysisRaw[key];
    const hydrolysisCoefficient = key => hydrolysisRaw[key] === '' ? '?' : esc(hydrolysisRaw[key]);
    $('[data-vc-hydrolysis-equation]').innerHTML = `<span>C₆H₆O₆ + ${hydrolysisCoefficient('water')} H₂O</span> <span>→ C₆H₈O₇</span> <span>+ ${hydrolysisCoefficient('protons')} H⁺</span> <span>+ ${hydrolysisCoefficient('electrons')} e⁻</span>`;
    text('[data-vc-hydrolysis-error]', hydrolysisError);
    for (const key of HYDROLYSIS_KEYS) {
      const answer = answers[key];
      for (const node of $$('[data-vc-choice]')) if (node.dataset.vcFor === key) node.setAttribute('aria-pressed', String(answer.choice === node.dataset.vcChoice));
      for (const node of $$('[data-vc-action="check"]')) if (node.dataset.vcFor === key) node.disabled = key === 'hydrolysis' ? !hydrolysisResult : !answer.choice;
      let feedback = '';
      if (answer.checked) {
        const correct = key === 'hydrolysis' ? hydrolysisResult?.correct : answer.choice === 'connectivity';
        feedback = `${correct ? '這項判讀符合題設。' : '這項判讀需要調整。'} `;
        if (key === 'hydrolysis' && hydrolysisResult) feedback += `元素${hydrolysisResult.atomBalance ? '守恆' : '未守恆'}；電荷${hydrolysisResult.chargeBalance ? '守恆' : '未守恆'}。`;
        feedback += explanation(key);
      } else if (answer.reference) feedback = `參考：${explanation(key)}`;
      text(`[data-vc-feedback="${key}"]`, feedback);
    }
    for (const node of $$('[data-vc-mode]')) node.setAttribute('aria-pressed', String(node.dataset.vcMode === mode));
    for (const key of ['direct', 'total']) {
      if (control(key).value !== assayRaw[key]) control(key).value = assayRaw[key];
      const value = numeric(assayRaw[key]); control(key).setAttribute('aria-invalid', String(!Number.isFinite(value) || value < 0 || value > 1000));
    }
    text('[data-vc-assay-label]', !mode ? '尚未選量測定義' : mode === 'direct' ? '直接量測的 AA' : '還原後總 C · 以 AA 當量表達');
    text('[data-vc-assay-value]', assayResult ? `${fmt(assayResult.measurementValue)} mg／100 g` : '—');
    text('[data-vc-assay-note]', !mode ? '自己選擇要讀的量測定義；看參考不會代選。' : !assayResult ? '沒有沿用上一組計算值。' : !assayResult.reportable ? '負差保留供诊斷；此組不能表達有效的 DHA 分項。' : mode === 'direct' ? '僅為 AA；沒有把未量得的 DHA 當成 0。' : '假想配對紀錄；差值代表 DHA 的 AA 當量，並非 DHA 真實質量。');
    text('[data-vc-assay-equation]', !mode ? '先選量測定義' : !assayResult ? '輸入無效 · 下游已清除' : mode === 'direct' ? `AA = ${fmt(assayResult.aa)} mg／100 g；總 C 尚未知` : `總 C − AA = ${assayRaw.total} − ${assayRaw.direct} = ${fmt(assayResult.difference)} mg AA 當量／100 g`);
    text('[data-vc-assay-error]', assayError);
    for (const key of STEPS) {
      const answer = answers[key];
      for (const node of $$('[data-vc-choice]')) if (node.dataset.vcFor === key) node.setAttribute('aria-pressed', String(answer.choice === node.dataset.vcChoice));
      for (const node of $$('[data-vc-action="check"]')) if (node.dataset.vcFor === key) node.disabled = key === 'balance' ? !balanceResult : key === 'assay' ? !answer.choice || !mode || !assayResult : !answer.choice;
      let feedback = '';
      if (answer.checked) {
        const correct = key === 'balance' ? balanceResult?.correct : key === 'food' ? answer.choice === 'separate' : Boolean(assayResult) && answer.choice === (!assayResult.reportable ? 'unreportable' : mode === 'direct' ? 'aa' : 'difference');
        feedback = `${correct ? '這項判讀符合題設。' : '這項判讀需要調整。'} `;
        if (key === 'balance' && balanceResult) feedback += `元素${balanceResult.atomBalance ? '守恆' : '未守恆'}；電荷${balanceResult.chargeBalance ? '守恆' : '未守恆'}。`;
        feedback += explanation(key);
      } else if (answer.reference) feedback = `參考：${explanation(key)}`;
      text(`[data-vc-feedback="${key}"]`, feedback);
    }
    action('previous').disabled = step === 'balance'; action('next').disabled = step === 'food';
    if (control('writing').value !== writing.text) control('writing').value = writing.text;
    if (control('revision').value !== writing.revision) control('revision').value = writing.revision;
    control('hydrogen').checked = showHydrogen; control('labels').checked = allLabels;
    text('[data-vc-writing-status]', writing.text ? `${writing.context}${writing.stale ? '；條件已更改，請重新檢查這段文字。' : ''} 文字不自動評分。` : '主要判讀尚未填寫；不自動評分。');
    text('[data-vc-revision-status]', writing.revision ? `${revisionContextText(writing)} 文字不自動評分。` : '後續修訂尚未填寫；不自動評分。');
    const pendingText = summary();
    $('[data-vc-summary]').value = pendingText;
    text('[data-vc-save-status]', draft.saving ? '正在附加…' : draft.status.startsWith('已追加') && pendingText ? '已追加上一版；目前有新增或修改尚未附加。' : draft.status || (!pendingText ? '沒有尚未附加的新內容。' : ''));
    if (action('save')) action('save').disabled = draft.saving || !$('[data-vc-summary]').value;
    text('[data-vc-record-count]', `${draft.records.length} / 12 次保留`);
    action('record').disabled = draft.records.length >= 12;
    text('[data-vc-first]', draft.first ? recordText(draft.first) : '尚未保留；首次保留不代表盲測。');
    $('[data-vc-records]').innerHTML = draft.records.map((record,i) => `<details><summary>觀察 ${i+1} · ${esc(LABELS[record.step])}</summary><pre>${esc(recordText(record))}</pre></details>`).join('');
    $('[data-vc-saved]').innerHTML = draft.savedVersions.map((value,i) => `<details><summary>已附加版本 ${i+1}</summary><pre>${esc(value)}</pre></details>`).join('');
  }

  function invalidate(key) {
    answers[key].checked = false; answers[key].reference = false;
    if (writing.text) writing.stale = true;
    if (writing.revision) writing.revisionStale = true;
    draft.status = '';
  }

  function move(next) {
    if (!STEPS.includes(next) || next === step) return;
    step = next; visited.add(step);
    if (step === 'balance' && $('[data-vc-hydrolysis]').open) hydrolysisOpened = true;
    render();
    $('[data-vc-heading]').focus({preventScroll: true});
    $('[data-vc-heading]').scrollIntoView?.({block: 'nearest', behavior: 'instant'});
  }

  function rotationState() {
    action('rotation').setAttribute('aria-pressed', String(rotateEnabled));
    action('rotation').textContent = rotateEnabled ? '拖曳旋轉已開啟' : '開啟拖曳旋轉';
    if (viewer) { viewer.controls.enabled = rotateEnabled; viewer.renderer.domElement.style.touchAction = rotateEnabled ? 'none' : 'pan-y'; }
  }

  function showMolecule(fit = false, rebuildAtomOptions = false) {
    const molecule = molecules?.find(item => item.id === moleculeId);
    if (!molecule) return;
    text('[data-vc-molecule-name]', molecule.name); text('[data-vc-molecule-formula]', molecule.formula);
    text('[data-vc-structure-note]', moleculeId === 'dehydroascorbic-acid' ? '形式未水合 DHA；不代表水中的主要水合形態。切換端點不是軌跡。' : '中性 AA 的計算代表構象；不是反應軌跡或溶液構象比例。');
    text('[data-vc-identity-note]', molecule.identityNote || '計算代表構象，不代表實測溶液構象。');
    const url = secureUrl(molecule.source);
    $('[data-vc-structure-source]').innerHTML = url ? `目前結構身份來源：<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-vc-source="${esc(moleculeId)}">${esc(molecule.name)} ↗</a>` : '目前結構来源隨本機資料附錄。';
    if (rebuildAtomOptions) control('atom').innerHTML = '<option value="">不選取</option>' + molecule.atoms.map(atom => `<option value="${esc(atom.id)}">${esc(atom.id)} · ${esc(atom.element)}</option>`).join('');
    control('atom').value = selectedAtom;
    action('focus-atom').disabled = !selectedAtom || !viewer;
    if (!viewer) return;
    viewer.showH = showHydrogen; viewer.showLabels = true; viewer.labelsOnlySelected = !allLabels;
    viewer.setMolecule(molecule, {fit, selected: selectedAtom ? [selectedAtom] : []});
  }

  function focusAtom() {
    const molecule = molecules?.find(item => item.id === moleculeId);
    if (!viewer || !selectedAtom || !molecule) return;
    const ids = new Set([selectedAtom]);
    for (const bond of molecule.bonds) {
      if (bond.a === selectedAtom) ids.add(bond.b);
      if (bond.b === selectedAtom) ids.add(bond.a);
    }
    viewer.fit([...ids]);
  }

  function turn(direction) {
    if (!viewer) return;
    const offset = viewer.camera.position.clone().sub(viewer.controls.target);
    const axis = direction === 'left' || direction === 'right' ? viewer.camera.up.clone().normalize() : offset.clone().cross(viewer.camera.up).normalize();
    const angle = (direction === 'left' || direction === 'up' ? 1 : -1) * Math.PI / 12;
    offset.applyAxisAngle(axis, angle);
    if (direction === 'up' || direction === 'down') viewer.camera.up.applyAxisAngle(axis, angle).normalize();
    viewer.camera.position.copy(viewer.controls.target).add(offset);
    viewer.camera.lookAt(viewer.controls.target); viewer.controls.update();
  }

  function onInput(event) {
    if (disposed || !container.contains(event.target)) return;
    const key = event.target.dataset?.vcControl;
    if (key === 'revision') {
      writing.revision = event.target.value;
      writing.revisionContext = writing.revision ? revisionConditionContext() : '';
      writing.revisionStale = false; draft.status = ''; render(); return;
    }
    if (key === 'writing') {
      writing.text = event.target.value;
      writing.context = `最後修改於「${LABELS[step]}」；${Object.values(answers).some(answer => answer.seen) ? '已看過核對／參考' : '尚未看核對／參考'}`;
      writing.stale = false; draft.status = ''; render();
    } else if (step === 'assay' && Object.hasOwn(assayRaw, key)) {
      assayRaw[key] = event.target.value; invalidate('assay'); calculate(); render();
    }
  }

  function onChange(event) {
    if (disposed || !container.contains(event.target)) return;
    const key = event.target.dataset?.vcControl, value = event.target.value;
    if (key === 'form' && step === 'balance') {
      if (!BALANCE_FORMS.some(form => form.id === value)) { render(); return; }
      formId = value; invalidate('balance'); calculate(); render();
    } else if (['protons', 'electrons'].includes(key) && step === 'balance') {
      coefficients[formId][key] = value; invalidate('balance'); calculate(); render();
    } else if (key?.startsWith('hydrolysis-') && step === 'balance' && $('[data-vc-hydrolysis]').open && Object.hasOwn(hydrolysisRaw, key.slice(11))) {
      hydrolysisOpened = true; hydrolysisRaw[key.slice(11)] = value;
      for (const answerKey of HYDROLYSIS_KEYS) invalidate(answerKey);
      calculate(); render();
    } else if (key === 'atom') {
      const molecule = molecules?.find(item => item.id === moleculeId);
      selectedAtom = molecule?.atoms.some(atom => atom.id === value) ? value : ''; showMolecule(); render();
    } else if (key === 'hydrogen' || key === 'labels') {
      if (key === 'hydrogen') showHydrogen = Boolean(event.target.checked); else allLabels = Boolean(event.target.checked);
      showMolecule(); render();
    } else if (['lettuce', 'fill'].includes(key) && step === 'food') {
      const current = FOOD_RECORDS.find(record => record.id === foodId);
      const next = FOOD_RECORDS.find(record => record.lettucePercent === (key === 'lettuce' ? Number(value) : current.lettucePercent) && record.fillGrams === (key === 'fill' ? Number(value) : current.fillGrams));
      if (next) { foodId = next.id; invalidate('food'); }
      renderFood(); render();
    }
  }

  function onToggle(event) {
    if (disposed || !container.contains(event.target)) return;
    const key = event.target.dataset?.vcDetail;
    if (!key) return;
    details[key] = Boolean(event.target.open);
    if (event.target.open && ['sources','food-source','balance-boundary','assay-boundary'].includes(key) && !seenSources.includes(key)) seenSources.push(key);
    if (key === 'hydrolysis' && event.target.open && step === 'balance') hydrolysisOpened = true;
    render();
  }

  function onClick(event) {
    if (disposed) return;
    const source = event.target?.closest?.('[data-vc-source]');
    if (source && container.contains(source)) { if (!seenSources.includes(source.dataset.vcSource)) seenSources.push(source.dataset.vcSource); render(); return; }
    const node = event.target?.closest?.('button');
    if (!node || !container.contains(node) || node.disabled) return;
    if (node.dataset.vcStep) { move(node.dataset.vcStep); return; }
    if (MOLECULE_IDS.includes(node.dataset.vcMolecule)) {
      captureCamera(); moleculeId = node.dataset.vcMolecule; selectedAtom = ''; showMolecule(true, true); if (cameras[moleculeId]) viewer?.restoreCameraState?.(cameras[moleculeId]); render(); return;
    }
    if (node.dataset.vcTurn) { turn(node.dataset.vcTurn); render(); return; }
    if (node.dataset.vcMode && step === 'assay' && Object.hasOwn(ASSAY_MODES, node.dataset.vcMode)) {
      mode = node.dataset.vcMode; invalidate('assay'); calculate(); render(); return;
    }
    if (step === 'balance' && $('[data-vc-hydrolysis]').open && HYDROLYSIS_KEYS.includes(node.dataset.vcFor)) {
      const key = node.dataset.vcFor, name = node.dataset.vcAction;
      hydrolysisOpened = true;
      if (key === 'hydrolysis-identity' && Object.hasOwn(HYDROLYSIS_CHOICES, node.dataset.vcChoice)) {
        answers[key].choice = node.dataset.vcChoice; invalidate(key); render(); return;
      }
      if (name === 'check' || name === 'reference') {
        if (name === 'check') {
          if (key === 'hydrolysis' ? !hydrolysisResult : !answers[key].choice) return;
          answers[key].checked = true;
        } else answers[key].reference = true;
        answers[key].seen = true; draft.status = ''; render(); return;
      }
    }
    if (node.dataset.vcChoice && node.dataset.vcFor === step && Object.hasOwn(step === 'assay' ? ASSAY_CHOICES : step === 'food' ? FOOD_CHOICES : {}, node.dataset.vcChoice)) {
      answers[step].choice = node.dataset.vcChoice; invalidate(step); render(); return;
    }
    const name = node.dataset.vcAction;
    if (name === 'previous' || name === 'next') { move(STEPS[STEPS.indexOf(step) + (name === 'next' ? 1 : -1)]); return; }
    if (name === 'fit') { viewer?.fit(); render(); return; }
    if (name === 'focus-atom') { focusAtom(); render(); return; }
    if (name === 'rotation') { rotateEnabled = !rotateEnabled; rotationState(); render(); return; }
    if (name === 'record') { if (draft.records.length < 12) { const value = snapshot(); if (!draft.first) draft.first = clone(value); draft.records.push(value); draft.status = '已保留當時判讀；尚未附加至筆記。'; render(); } return; }
    if ((name === 'check' || name === 'reference') && node.dataset.vcFor === step) {
      if (name === 'check') {
        if (step === 'balance' ? !balanceResult : step === 'assay' ? !answers.assay.choice || !mode || !assayResult : !answers.food.choice) return;
        answers[step].checked = true;
      } else answers[step].reference = true;
      answers[step].seen = true; draft.status = ''; render(); return;
    }
    if (name === 'select-summary') { $('[data-vc-summary]').focus(); $('[data-vc-summary]').select?.(); return; }
    if (name === 'save') save();
  }

  function validateStructures(data) {
    if (!Array.isArray(data?.molecules)) throw new TypeError('缺少結構資料');
    for (const id of MOLECULE_IDS) {
      const molecule = data.molecules.find(item => item.id === id);
      if (!molecule?.atoms?.length || !Array.isArray(molecule.bonds)) throw new TypeError('代表結構不完整');
      const ids = new Set(molecule.atoms.map(atom => atom.id));
      if (ids.size !== molecule.atoms.length || molecule.atoms.some(atom => typeof atom.id !== 'string' || !Array.isArray(atom.position) || atom.position.length !== 3 || !atom.position.every(Number.isFinite)) || molecule.bonds.some(bond => !ids.has(bond.a) || !ids.has(bond.b))) throw new TypeError('代表結構格式無效');
    }
    return data.molecules;
  }

  async function loadViewer() {
    try {
      const response = await fetch(new URL('../data/vitamin-c-structures.json', import.meta.url), {signal: aborter.signal});
      if (disposed) return;
      if (!response.ok) throw new Error('結構資料載入失敗');
      const data = await response.json(); if (disposed) return;
      molecules = validateStructures(data); showMolecule(false, true);
      const {MoleculeViewer} = await import('./viewer.js'); if (disposed) return;
      viewer = new MoleculeViewer($('[data-vc-viewer]'), {onAtom: atom => {
        if (disposed) return;
        selectedAtom = atom.id; showMolecule(); render();
      }});
      viewer.labelLayer.id = `${prefix}-labels`; viewer.labelLayer.classList.add('vc-labels');
      viewer.controls.staticMoving = true;
      viewer.renderer.domElement.setAttribute('aria-label', '代表分子；可拖曳轉動，亦可使用下方鍵盤轉動按鈕');
      structureStatus = ''; $('[data-vc-viewer-status]').hidden = true;
      rotationState(); showMolecule(true, true);
      if (cameras[moleculeId]) viewer.restoreCameraState?.(cameras[moleculeId]);
      viewer.controls.addEventListener?.('end', cameraChanged);
      render();
    } catch (error) {
      if (disposed) return;
      viewer?.dispose(); viewer = null;
      for (const node of $('[data-vc-viewer]').querySelectorAll('canvas,.vc-labels,#atom-labels')) node.remove();
      structureStatus = '3D 未載入；仍可配平與讀取量測資料。';
      text('[data-vc-viewer-status]', structureStatus); $('[data-vc-viewer-status]').hidden = false;
      render();
    }
  }

  function cameraChanged() { if (!disposed) render(); }
  for (const node of $$('[data-vc-detail]')) node.open = Boolean(details[node.dataset.vcDetail]);
  calculate(); renderFood(); rotationState();
  container.addEventListener('input', onInput); container.addEventListener('change', onChange); container.addEventListener('click', onClick);
  container.addEventListener('toggle', onToggle, true);
  draft.views.add(render);
  render();
  const dispose = () => {
    if (disposed) return;
    retainDraft(); disposed = true; aborter.abort();
    draft.views.delete(render);
    viewer?.controls.removeEventListener?.('end', cameraChanged);
    if (mounted.get(container) === dispose) mounted.delete(container);
    container.removeEventListener('input', onInput); container.removeEventListener('change', onChange); container.removeEventListener('click', onClick);
    container.removeEventListener('toggle', onToggle, true);
    viewer?.dispose(); viewer = null;
    for (const node of $('[data-vc-viewer]').querySelectorAll('canvas,.vc-labels,#atom-labels')) node.remove();
  };
  mounted.set(container, dispose);
  dispose.ready = loadViewer();
  return dispose;
}
