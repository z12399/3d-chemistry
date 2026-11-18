import {escapeHTML as esc} from './storage.js';
import {EXTRUSION_LAB_ID, EXTRUSION_DEFAULT_INPUT, EXTRUSION_AXES, EXTRUSION_METRICS, getExtrusionComparison, compareTwoRows} from './extrusion-model.js';
import {EXTRUSION_SOURCES, EXTRUSION_ROWS, EXTRUSION_STUDY, EXTRUSION_PROCESS_STEPS, EXTRUSION_FOOD_USES, EXTRUSION_LIMITS} from '../data/extrusion-evidence.js';
export {EXTRUSION_LAB_ID} from './extrusion-model.js';

const owners = new WeakMap(), mounted = new WeakMap();
const modes = {flow:'看加工流程', compare:'比較研究紀錄'};
const safeHref = value => typeof value === 'string' && /^#(?:learn|process|micro)\/review$/.test(value) ? value : '#process/review';
const clone = value => structuredClone(value);
const fmt = value => Number(value.toPrecision(5)).toString();
const varietyName = value => value === 'Paso144' ? 'Paso 144' : value;
const shortSource = source => source.id.includes('usda') ? 'USDA' : source.id.includes('fao') ? 'FAO' : source.id.includes('gonzalez') ? '研究原文' : '官方題目';
const shortStep = item => ({'conditional-expansion':'出模膨發','study-post-treatment':'研究後處理'}[item.id] || item.label);
const sourceLinks = ids => EXTRUSION_SOURCES.filter(source => ids.includes(source.id)).map(source => `<a href="${esc(source.url)}" data-ex-source="${esc(source.id)}" target="_blank" rel="noopener noreferrer" title="${esc(source.title)}">${esc(shortSource(source))} ↗</a>`).join(' · ');
const rowConditions = row => `${row.variety}；M ${row.moisturePercentReported}%（乾／濕基未明）；T ${row.extrusionTemperatureC} °C（作者所報）`;
const rowName = row => `原表第 ${row.tableRow} 列${row.centerRunOrdinal ? ` · 中心第 ${row.centerRunOrdinal} 次` : ''} · ${row.variety}`;
const rowText = point => `${rowName(point.row)}：${point.displayValue}；${rowConditions(point.row)}。`;
const comparisonKey = input => [input.axis, input.metric, input.axis === 'variety' ? '*' : input.variety, input.axis === 'moisture' ? '*' : input.moisture, input.axis === 'temperature' ? '*' : input.temperature].join(':');
const detailLabels = {methods:'研究方法', raw:'原表紀錄', limits:'限制與原文疑點', sources:'來源', writing:'解釋與修訂', records:'保留的觀察', notes:'筆記預覽'};
let sequence = 0;

function fresh() {
  return {mode:'flow', step:EXTRUSION_PROCESS_STEPS[0].id, food:EXTRUSION_FOOD_USES[0].id, input:{...EXTRUSION_DEFAULT_INPUT}, pairs:{}, details:{},
    seen:{modes:[], steps:[], comparisons:[], details:[], sources:[]},
    writing:{draft:'', original:null, revision:'', firstContext:null, lastContext:null, retainedContext:null, revisionContext:null, revisionVersion:0, retainedCondition:null},
    records:[], selectedRecord:'', saved:{}, savedVersions:[], selectedSaved:'', pending:null, status:'', active:null};
}
function draftFor(owner, key) {
  if (owner === null || !['object','function'].includes(typeof owner)) return fresh();
  let drafts = owners.get(owner); if (!drafts) owners.set(owner, drafts = new Map());
  if (!drafts.has(key)) drafts.set(key, fresh());
  return drafts.get(key);
}

/** Discrete observations from one study, beside a qualitative process diagram. */
export function mountExtrusionLab(root, id = EXTRUSION_LAB_ID, {draftOwner, draftKey = EXTRUSION_LAB_ID, onSaveSummary, reviewHref = '#process/review'} = {}) {
  if (id !== EXTRUSION_LAB_ID) throw new RangeError('Unknown extrusion activity');
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  const d = draftFor(draftOwner, draftKey);
  mounted.get(root)?.dispose(); d.active?.dispose();
  const prefix = `extrusion-${++sequence}`, $ = selector => root.querySelector(selector), $$ = selector => root.querySelectorAll(selector);
  let disposed = false, result, rowOptionsSignature = '', recordCount = -1, savedCount = -1;
  const remember = (list, value) => { if (!list.includes(value)) list.push(value); };
  const step = () => EXTRUSION_PROCESS_STEPS.find(item => item.id === d.step);
  const food = () => EXTRUSION_FOOD_USES.find(item => item.id === d.food);
  const currentPair = () => d.pairs[comparisonKey(d.input)];
  const select = (key, label, options) => `<label for="${prefix}-${key}" data-ex-label="${key}">${label}<select id="${prefix}-${key}" data-ex-control="${key}">${options.map(([value,text]) => `<option value="${esc(String(value))}">${esc(text)}</option>`).join('')}</select></label>`;
  const icons = [
    '<path d="M10 14h44L44 32v17H20V32Z"/><path d="M17 8h5m9 0h5m9 0h5M24 37h16m-16 7h16"/>',
    '<rect x="9" y="18" width="47" height="28" rx="5"/><path d="m14 39 9-15 9 15 9-15 9 15M9 51h47M20 10l4-5m8 5 4-5m8 5 4-5"/>',
    '<path d="M8 19h28l12 9v10l-12 9H8M35 19v28m14-19h9m-9 5h9m-9 5h9"/>',
    '<path d="M7 30h15m-3-7 8 7-8 7"/><circle cx="40" cy="23" r="6"/><circle cx="52" cy="38" r="8"/><circle cx="36" cy="46" r="4"/><path d="m37 12 3-6m12 20 5-4"/>',
    '<rect x="10" y="12" width="45" height="42" rx="4"/><path d="M15 21h35M15 30h35M15 39h35m-28 9h5m8 0h5"/>'
  ];
  root.innerHTML = `<section class="extrusion-lab" aria-labelledby="${prefix}-title">
    <header class="ex-header"><h2 id="${prefix}-title">擠壓加工：從流程到觀察</h2><p>加工示意 · 糙米研究紀錄</p></header>
    <nav class="ex-tabs" aria-label="擠壓工作台畫面">${Object.entries(modes).map(([key,label]) => `<button type="button" data-ex-mode="${key}" aria-pressed="false">${label}</button>`).join('')}</nav>
    <section data-ex-panel="flow">
      <div class="ex-flow-grid"><div><div class="ex-flow" role="group" aria-label="選擇加工階段">${EXTRUSION_PROCESS_STEPS.map((item,index) => `<button type="button" data-ex-step="${esc(item.id)}" aria-pressed="false" class="${item.layer === 'study-protocol' ? 'ex-study-step' : ''}"><svg viewBox="0 0 66 64" aria-hidden="true">${icons[index]}</svg><span>${index+1} · ${esc(shortStep(item))}</span>${item.layer === 'study-protocol' ? '<small>本研究</small>' : ''}</button>`).join('')}</div>
        <p class="ex-caption">選節點查看作用。這是工序示意，不表示時間、溫壓或流速。</p>
        <div class="ex-step-reading"><h3 data-ex-step-title></h3><p data-ex-mechanism></p><p class="ex-caption" data-ex-step-boundary></p><div class="ex-inline-sources" data-ex-step-sources></div></div></div>
      <aside class="ex-use">${select('food','食品用途',EXTRUSION_FOOD_USES.map(item => [item.id,item.label]))}<h3>這個用途需要什麼？</h3><p data-ex-purpose></p><p class="ex-caption" data-ex-use-boundary></p><div class="ex-inline-sources" data-ex-use-sources></div></aside></div>
    </section>
    <section data-ex-panel="compare" hidden>
      <div class="ex-controls">${select('axis','比較變因',EXTRUSION_AXES.map(item => [item.id,item.label]))}${select('metric','觀察指標',EXTRUSION_METRICS.map(item => [item.id,item.label]))}${select('variety','固定品種',[['Fortuna','Fortuna'],['Paso 144','Paso 144']])}${select('moisture','固定 M（% · 基準未明）',[[14,'14'],[16.5,'16.5'],[19,'19']])}${select('temperature','固定 T（°C · 作者所報）',[[160,'160'],[175,'175'],[190,'190']])}</div>
      <div class="ex-comparison-grid"><div class="ex-plot-column"><div class="ex-plot-heading"><h3 data-ex-metric-title></h3><span data-ex-point-count></span></div><p class="ex-caption" data-ex-fixed></p><div class="ex-chart-scroll" tabindex="0" role="region" aria-label="研究離散點圖，窄螢幕可橫向捲動"><svg data-ex-chart viewBox="0 0 500 290" role="img" aria-labelledby="${prefix}-chart-title"></svg></div><p class="ex-caption" data-ex-jitter></p><p class="ex-caption" data-ex-stage></p></div>
      <aside class="ex-pair"><h3>選兩筆原列</h3><div class="ex-pair-controls">${select('rowA','A',[])}${select('rowB','B',[])}</div><div class="ex-values"><div class="ex-value-a"><span>A</span><strong data-ex-value-a></strong></div><div class="ex-value-b"><span>B</span><strong data-ex-value-b></strong></div><div><span>B − A</span><strong data-ex-difference></strong></div></div><p class="ex-unit" data-ex-unit></p><p data-ex-pair-reason></p><p class="ex-caption" data-ex-changed></p><p class="ex-caption" data-ex-pair-boundary></p><details data-ex-detail="pair"><summary>這兩列的條件與原值</summary><pre class="ex-raw" data-ex-pair-raw></pre></details></aside></div>
      <p class="ex-boundary">只比較同一研究的原表紀錄；M 的乾／濕基與 T 的量測位置未交代。不推估未量測條件或最佳參數。</p>
    </section>
    <details data-ex-detail="methods"><summary>研究方法與量測階段</summary><div class="ex-detail-body"><p>材料為保留麩皮與胚芽的糙米碎粒（0.42–1.19 mm），品種 Fortuna 與 Paso 144。研究使用 Brabender 20 DN 單螺桿，螺桿 150 rpm、壓縮比 4:1，模口直徑 3 mm、長 20 mm。</p><p>各次運轉前 1 小時調水。M 是作者所報 14、16.5、19%；T 是作者所報 160、175、190 °C。每品種 11 列，包含三次中心条件，共 22 列。乾／濕基、溫度量測位置與實際供料量未明列。</p><p>SMEC 由穩定運轉時的扭矩與出料質量流率計算，質量採供料含水條件的基準；不是設備總電耗、加熱或乾燥能耗。</p><p>擠出樣品在 50 °C 乾燥至作者所報 6% 含水量，裝袋後評估 E 與 SV；6% 的乾／濕基與保存時間未明。E = D/d，是平均產品直徑除以模口直徑；SV 是體積除以乾質量。兩者不等於孔隙率。</p><p>直徑與 SV 方法各描述十塊樣品，原文另述重複測定；這些不等於十次獨立製程。逐格 SD／SE／CI 與原始測定未提供，本圖不畫誤差棒、不合併中心列、不插值。</p><p>加工圖中的一般工序與這份單螺桿研究分開；官方用途資料的雙螺桿描述不會取代本研究設備。</p></div></details>
    <details data-ex-detail="raw"><summary>22 筆原表紀錄</summary><div class="ex-table-scroll" tabindex="0" role="region" aria-label="原表紀錄，窄螢幕可橫向捲動"><table><caption>González et al. · Table 2；保留原列及小數精度。中心列未合併。</caption><thead><tr><th>原列／品種</th><th>M %<br>基準未明</th><th>T °C<br>作者所報</th><th>E = D/d</th><th>SV<br>mL/g 乾質量</th><th>SMEC<br>J/g 供料條件</th></tr></thead><tbody>${EXTRUSION_ROWS.map(row => `<tr><th scope="row">${esc(rowName(row))}</th><td>${esc(String(row.moisturePercentReported))}</td><td>${esc(String(row.extrusionTemperatureC))}</td><td>${esc(row.rawSourceStrings.E)}</td><td>${esc(row.rawSourceStrings.SV)}</td><td>${esc(row.rawSourceStrings.SMEC)}</td></tr>`).join('')}</tbody></table></div></details>
    <details data-ex-detail="limits"><summary>資料限制與 9 個原文疑點</summary><div class="ex-detail-body">${EXTRUSION_LIMITS.map(item => `<article><h3>${esc(item.label)}</h3><p>${esc(item.treatment)}</p><p class="ex-caption">${esc(item.locator)}</p><details><summary>原文觀察</summary><p>${esc(item.observed)}</p></details></article>`).join('')}</div></details>
    <details data-ex-detail="sources"><summary>來源與題目連結</summary><div class="ex-detail-body">${EXTRUSION_SOURCES.map(item => `<article><a href="${esc(item.url)}" data-ex-source="${esc(item.id)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} ↗</a><p>${esc(item.locator || '')}</p><p class="ex-caption">${esc(item.note || '')}</p></article>`).join('')}<p>官方題目詢問加工目的與兩種食品用途；原表比較是本課延伸，不是官方答案或整體考試覆蓋證明。</p></div></details>
    <div class="ex-record-bar"><button type="button" data-ex-action="record">保留這次觀察</button><span data-ex-record-count></span></div>
    <details data-ex-detail="writing"><summary>寫下解釋與修訂（選填）</summary><p>原文保留後固定不變，後續文字寫在修訂。首次保留只代表第一次按下保留；畫面資料已可查看，這裡沒有盲答設計，也不自動評分。</p><label for="${prefix}-draft">我的首次解釋<textarea id="${prefix}-draft" data-ex-write="draft" rows="4"></textarea></label><button type="button" data-ex-action="retain">保留這份原文</button><p class="ex-caption" data-ex-writing-context></p><details data-ex-detail="original"><summary>已保留的原文與當時條件</summary><pre class="ex-raw" data-ex-original></pre></details><label for="${prefix}-revision">後續修訂<textarea id="${prefix}-revision" data-ex-write="revision" rows="4" disabled></textarea></label><p class="ex-caption" data-ex-writing-stale></p></details>
    <details data-ex-detail="records"><summary>回看保留的觀察</summary>${select('record','觀察紀錄',[])}<pre class="ex-raw" data-ex-record-text></pre><p>回看只顯示當時內容，不覆蓋目前條件或文字。</p></details>
    <details data-ex-detail="notes"><summary>本次將附加的內容</summary><label for="${prefix}-preview">新增內容預覽<textarea id="${prefix}-preview" data-ex-preview readonly rows="6"></textarea></label><div class="ex-buttons"><button type="button" data-ex-action="copy-pending">選取待存內容</button><button type="button" data-ex-action="copy-full">選取完整摘要</button></div><label for="${prefix}-full">目前完整摘要<textarea id="${prefix}-full" data-ex-full readonly rows="6"></textarea></label>${select('saved','已成功附加的版本',[])}<pre class="ex-raw" data-ex-saved-text></pre></details>
    <div class="ex-save"><button type="button" class="ex-primary" data-ex-action="save"${typeof onSaveSummary === 'function' ? '' : ' disabled'}>附加到本課筆記</button><p data-ex-save-status role="status"></p><a href="${esc(safeHref(reviewHref))}">我的複習 →</a></div><p class="ex-caption">同頁離開再回來可接續；重新整理前請保存筆記。</p>
  </section>`;

  for (const detail of $$('[data-ex-detail]')) detail.open = Boolean(d.details[detail.dataset.exDetail]);
  function captureDetails() {
    for (const detail of $$('[data-ex-detail]')) {
      d.details[detail.dataset.exDetail] = detail.open;
      if (detail.open) remember(d.seen.details, detail.dataset.exDetail);
    }
  }
  function comparison() {
    const value = getExtrusionComparison(d.input), key = comparisonKey(d.input);
    if (!d.pairs[key]) d.pairs[key] = {a:value.points[0].id, b:value.points.at(-1).id};
    const pair = d.pairs[key];
    return {value, pair, difference:compareTwoRows(d.input, pair.a, pair.b)};
  }
  function currentContext() {
    if (d.mode === 'flow') return `加工流程：${step().label}；用途：${food().label}。`;
    const {value,pair} = comparison();
    return `${value.metric.label}；比較${value.xLabel}；${value.fixedContext}；A ${rowName(value.points.find(item => item.id === pair.a).row)}；B ${rowName(value.points.find(item => item.id === pair.b).row)}。`;
  }
  function exposure() {
    return `當時顯示${d.mode === 'compare' ? '研究離散點與 A／B 原列' : '加工流程示意'}；本頁曾查看畫面：${d.seen.modes.map(key => modes[key]).join('、') || '尚未記錄'}；曾展開：${d.seen.details.map(key => detailLabels[key] || key).join('、') || '無'}；曾開啟來源連結 ${d.seen.sources.length} 個。首次保留不是盲答。`;
  }
  const writingContext = () => `${currentContext()} ${exposure()}`;
  function readingText() {
    if (d.mode === 'flow') return `${step().mechanism}\n界線：${step().boundary}\n用途：${food().purpose}\n用途界線：${food().boundary}`;
    const {value,difference} = comparison();
    return [`指標：${value.metric.label}（${value.metric.unit}）`, `A ${rowText(difference.left)}`, `B ${rowText(difference.right)}`, `B − A = ${difference.deltaText} ${difference.unit}。${difference.reason}`, `量測階段：${value.metric.sourceStage}`, `界線：${difference.boundary}`].join('\n');
  }
  function snapshotRecord() {
    captureDetails();
    return clone({mode:d.mode, step:d.step, food:d.food, input:d.input, pair:currentPair(), context:currentContext(), reading:readingText(), exposure:exposure(), writing:d.writing});
  }
  const recordText = record => [`${record.context}`, record.reading, record.exposure, `當時原文（原樣）：\n${record.writing.original ?? record.writing.draft}`, `首次編寫條件：${record.writing.firstContext || '尚未編寫'}`, record.writing.retainedContext ? `保留原文時條件：${record.writing.retainedContext}` : '當時尚未保留原文。', `當時修訂（原樣）：\n${record.writing.revision}`, record.writing.revisionContext ? `修訂時條件：${record.writing.revisionContext}` : '當時尚未修訂。'].join('\n');
  function parts() {
    captureDetails();
    const w = d.writing, body = {intro:'擠壓加工觀察 · 定性流程與 González et al. 原表離散資料；不插值、不推最佳製程或安全結論。'};
    if (d.mode === 'flow') body[`flow:${d.step}:${d.food}`] = `${currentContext()}\n${readingText()}`;
    else body[`comparison:${comparisonKey(d.input)}`] = `${currentContext()}\n${readingText()}`;
    body['seen:mode:'+d.mode] = `已顯示：${modes[d.mode]}；本活動沒有盲答設計。`;
    for (const key of d.seen.details.filter(key => ['methods','raw','limits','sources','pair'].includes(key))) body['seen:detail:'+key] = `曾展開：${detailLabels[key] || 'A／B原列條件'}。`;
    for (const id of d.seen.sources) { const source = EXTRUSION_SOURCES.find(item => item.id === id); if (source) body['seen:source:'+id] = `曾開啟來源連結：${source.title}；${source.url}`; }
    body.source = '研究來源：González et al.（2013）, Table 2；https://pmc.ncbi.nlm.nih.gov/articles/PMC4745535/。加工流程與用途另見本課官方來源。';
    body.writingStatus = w.original === null ? '原文狀態：尚未保留。' : '原文狀態：已保留，不能覆寫。';
    body.writingText = w.original !== null || w.draft ? `我的原文（原樣）：\n${w.original ?? w.draft}` : '未保留草稿：未填或已清空。';
    if (w.firstContext) body.firstContext = `首次編寫條件：${w.firstContext}`;
    if (w.lastContext) body.lastContext = `最近編寫條件：${w.lastContext}`;
    if (w.retainedContext) body.retainedContext = `保留原文時條件：${w.retainedContext}`;
    body.revision = w.revision ? `我的修訂（原樣）：\n${w.revision}` : '修訂：未填或已清空。';
    if (w.revisionContext) body.revisionContext = `修訂時條件：${w.revisionContext}`;
    for (const [index,record] of d.records.entries()) body[`record:${index}`] = `保留觀察 ${index+1}（固定快照）：\n${recordText(record)}`;
    return body;
  }
  function pending() {
    const all = parts(), changed = Object.entries(all).filter(([key,value]) => d.saved[key] !== value);
    const full = Object.values(all).join('\n\n');
    const text = changed.length ? Object.keys(d.saved).length ? [`擠壓加工 · 本次新增／修改`,currentContext(),...changed.map(([,value]) => value)].join('\n\n') : full : '';
    return {parts:all,full,text};
  }
  function renderChart(value, pair) {
    const chart = $('[data-ex-chart]'), left = 60, top = 20, width = 400, height = 210;
    const xs = [...new Set(value.points.map(point => point.x))], ys = value.points.map(point => point.value);
    const low = Math.min(...ys), high = Math.max(...ys), span = high-low || Math.max(1,high*.1);
    const yMin = Math.max(0,low-span*.2), yMax = high+span*.2;
    const y = n => top+height-(n-yMin)/(yMax-yMin)*height;
    const numeric = d.input.axis !== 'variety';
    const x = point => numeric ? left+width*.1+(point.x-Math.min(...xs))/(Math.max(...xs)-Math.min(...xs)||1)*width*.8 : left+width*(xs.indexOf(point.x)+.5)/xs.length;
    const groups = new Map(); for (const point of value.points) { if (!groups.has(point.x)) groups.set(point.x,[]); groups.get(point.x).push(point.id); }
    const title = `${value.metric.label}，${value.points.length} 筆原表觀察，橫軸為${value.xLabel}`;
    const ticks = [0,.25,.5,.75,1].map(ratio => yMin+(yMax-yMin)*ratio);
    chart.innerHTML = `<title id="${prefix}-chart-title">${esc(title)}</title><desc>只有原表離散點。中心重複列分開顯示；水平錯位只避免重疊，不改變實際条件。選圓點可設為 B。</desc>${ticks.map(tick => `<line x1="${left}" y1="${y(tick)}" x2="${left+width}" y2="${y(tick)}" class="ex-gridline"/><text x="${left-10}" y="${y(tick)+5}" text-anchor="end">${fmt(tick)}</text>`).join('')}<line x1="${left}" y1="${top+height}" x2="${left+width}" y2="${top+height}" class="ex-axis"/>${xs.map(position => { const point = value.points.find(item => item.x === position); return `<text x="${x(point)}" y="${top+height+28}" text-anchor="middle">${esc(numeric ? `${position}` : varietyName(String(position)))}</text>`; }).join('')}<text x="${left+width/2}" y="${top+height+57}" text-anchor="middle">${esc(value.xLabel)}${value.xUnit ? ` · ${esc(value.xUnit)}` : ''}</text>${value.points.map(point => { const group=groups.get(point.x), offset=(group.indexOf(point.id)-(group.length-1)/2)*15, a=point.id===pair.a, b=point.id===pair.b; return `<g data-ex-point="${esc(point.id)}" tabindex="0" role="button" aria-label="設為 B：${esc(rowName(point.row))}，${esc(point.displayValue)} ${esc(value.metric.unit)}"><title>${esc(rowText(point))}</title>${a||b ? `<circle cx="${x(point)+offset}" cy="${y(point.value)}" r="10" class="${a?'ex-a-ring':'ex-b-ring'}"/>` : ''}<circle data-ex-observation="${esc(point.id)}" cx="${x(point)+offset}" cy="${y(point.value)}" r="5" class="${b?'ex-dot-b':a?'ex-dot-a':'ex-dot'}"/>${a||b ? `<text x="${x(point)+offset}" y="${y(point.value)-16}" text-anchor="middle" class="ex-point-label">${a&&b?'A/B':a?'A':'B'}</text>` : ''}</g>`; }).join('')}`;
    $('[data-ex-jitter]').textContent = [...groups.values()].some(group => group.length>1) ? '中心三次運轉各是一點；左右錯位只避免重疊，實際 M／T 相同。點選圓點可設為 B。' : '每一點是一筆原表紀錄。點選圓點可設為 B；這裡沒有連線、插值或誤差棒。';
  }
  function renderStudy() {
    result = comparison();
    const {value,pair,difference} = result;
    const signature = value.points.map(item => item.id).join('|');
    if (signature !== rowOptionsSignature) {
      rowOptionsSignature = signature;
      const options = value.points.map(item => `<option value="${esc(item.id)}" title="${esc(item.label)}">第${item.row.tableRow}列 · ${esc(item.row.variety)}${item.row.centerRunOrdinal ? ` · 中心${item.row.centerRunOrdinal}` : ''}</option>`).join('');
      $('[data-ex-control="rowA"]').innerHTML = options; $('[data-ex-control="rowB"]').innerHTML = options;
    }
    for (const key of ['axis','metric','variety','moisture','temperature']) $('[data-ex-control="'+key+'"]').value = String(d.input[key]);
    for (const key of ['variety','moisture','temperature']) $('[data-ex-label="'+key+'"]').hidden = d.input.axis === key;
    $('[data-ex-control="rowA"]').value = pair.a; $('[data-ex-control="rowB"]').value = pair.b;
    $('[data-ex-metric-title]').textContent = value.metric.label;
    $('[data-ex-point-count]').textContent = `${value.points.length} 筆原列`;
    $('[data-ex-fixed]').textContent = value.fixedContext;
    $('[data-ex-stage]').textContent = `量測階段：${value.metric.sourceStage}`;
    $('[data-ex-value-a]').textContent = difference.left.displayValue; $('[data-ex-value-b]').textContent = difference.right.displayValue;
    $('[data-ex-difference]').textContent = difference.deltaText; $('[data-ex-unit]').textContent = value.metric.unit;
    $('[data-ex-pair-reason]').textContent = difference.reason;
    $('[data-ex-changed]').textContent = difference.changedVariables.length ? `兩列不同處：${difference.changedVariables.map(item => `${item.label} ${item.from} → ${item.to}`).join('；')}` : difference.sameRow ? 'A 與 B 是同一列。' : '表列條件相同，這是不同次中心運轉。';
    $('[data-ex-pair-boundary]').textContent = '差值只是原表 B − A；不代表顯著性、普遍因果或食品安全。';
    $('[data-ex-pair-raw]').textContent = `A ${rowText(difference.left)}\nB ${rowText(difference.right)}\n${difference.left.row.sourceLocator}\n${difference.right.row.sourceLocator}\n\n${difference.boundary}`;
    renderChart(value,pair);
  }
  function renderJournal() {
    const w=d.writing, draft=$('[data-ex-write="draft"]'), revision=$('[data-ex-write="revision"]');
    if (draft.value!==w.draft) draft.value=w.draft; if(revision.value!==w.revision)revision.value=w.revision;
    draft.readOnly=w.original!==null; revision.disabled=w.original===null;
    $('[data-ex-action="retain"]').disabled=w.original!==null || !w.draft.trim();
    $('[data-ex-writing-context]').textContent=w.firstContext ? `首次編寫：${w.firstContext}` : '尚未編寫；開始時會記錄當時畫面與已查看的資料。';
    $('[data-ex-original]').textContent=w.original===null ? '尚未保留原文。' : `${w.original}\n\n首次編寫：${w.firstContext}\n保留時：${w.retainedContext}`;
    $('[data-ex-writing-stale]').textContent=w.original!==null&&w.retainedCondition!==currentContext() ? '目前條件已改變，保留原文仍屬於當時條件；可在修訂中補充。' : '';
    $('[data-ex-record-count]').textContent=d.records.length ? `已保留 ${d.records.length} 次` : '尚未保留觀察';
    if(recordCount!==d.records.length){recordCount=d.records.length;$('[data-ex-control="record"]').innerHTML='<option value="">選擇觀察</option>'+d.records.map((item,index)=>`<option value="${index}">第 ${index+1} 次 · ${esc(modes[item.mode])}</option>`).join('');}
    $('[data-ex-control="record"]').value=d.selectedRecord;
    const record=/^(?:0|[1-9]\d*)$/.test(d.selectedRecord)?d.records[Number(d.selectedRecord)]:null;
    $('[data-ex-record-text]').textContent=record?recordText(record):'保留後可在這裡回看。';
    if(savedCount!==d.savedVersions.length){savedCount=d.savedVersions.length;$('[data-ex-control="saved"]').innerHTML='<option value="">選擇已存版本</option>'+d.savedVersions.map((item,index)=>`<option value="${index}">第 ${index+1} 次附加</option>`).join('');}
    $('[data-ex-control="saved"]').value=d.selectedSaved;
    const version=/^(?:0|[1-9]\d*)$/.test(d.selectedSaved)?d.savedVersions[Number(d.selectedSaved)]:null;
    $('[data-ex-saved-text]').textContent=version?`當次新增：\n${version.text}\n\n當時完整摘要：\n${version.full}`:'';
    const next=pending(),over=next.text.length>10000;
    $('[data-ex-preview]').value=next.text;$('[data-ex-full]').value=next.full;
    $('[data-ex-action="save"]').disabled=typeof onSaveSummary!=='function'||Boolean(d.pending)||!next.text||over;
    $('[data-ex-save-status]').textContent=d.pending?'正在附加；仍可繼續操作。':over?'待存內容超過 10,000 字元，尚未送出；全文保留，可選取複製。':!next.text?'目前內容已附加至筆記。':d.status || (typeof onSaveSummary==='function'?'':'目前可選取摘要複製。');
  }
  function render() {
    if(disposed)return;
    captureDetails();remember(d.seen.modes,d.mode);
    if(d.mode==='flow')remember(d.seen.steps,d.step);else remember(d.seen.comparisons,comparisonKey(d.input));
    for(const [key] of Object.entries(modes)){$('[data-ex-panel="'+key+'"]').hidden=d.mode!==key;$('[data-ex-mode="'+key+'"]').setAttribute('aria-pressed',String(d.mode===key));}
    for(const button of $$('[data-ex-step]'))button.setAttribute('aria-pressed',String(button.dataset.exStep===d.step));
    $('[data-ex-control="food"]').value=d.food;
    $('[data-ex-step-title]').textContent=step().label;$('[data-ex-mechanism]').textContent=step().mechanism;$('[data-ex-step-boundary]').textContent=step().boundary;
    $('[data-ex-step-sources]').innerHTML=sourceLinks(step().sourceIds);
    $('[data-ex-purpose]').textContent=food().purpose;$('[data-ex-use-boundary]').textContent=food().boundary;$('[data-ex-use-sources]').innerHTML=sourceLinks(food().sourceIds);
    renderStudy();renderJournal();
  }
  function save() {
    if(disposed||d.pending||typeof onSaveSummary!=='function')return;
    const captured=pending();if(!captured.text||captured.text.length>10000){renderJournal();return;}
    d.pending=captured;d.status='';renderJournal();
    const finish=ack=>{if(d.pending!==captured)return;d.pending=null;if(ack===true){Object.assign(d.saved,captured.parts);d.savedVersions.push({text:captured.text,full:captured.full});d.status='';}else d.status='尚未保存；新增內容仍可重試或選取複製。';d.active?.render();};
    try{const answer=onSaveSummary(captured.text);if(answer!==null&&['object','function'].includes(typeof answer)&&typeof answer.then==='function')Promise.resolve(answer).then(finish,()=>finish(false));else finish(answer);}catch{finish(false);}
  }
  function onClick(event) {
    if(disposed)return;captureDetails();
    const target=event.target?.closest?.('[data-ex-source],button,[data-ex-point]');if(!target||!root.contains(target)||target.disabled)return;
    const a=target.dataset;
    if(a.exSource){remember(d.seen.sources,a.exSource);renderJournal();return;}
    if(Object.hasOwn(modes,a.exMode)){d.mode=a.exMode;render();return;}
    if(EXTRUSION_PROCESS_STEPS.some(item=>item.id===a.exStep)){d.step=a.exStep;render();return;}
    if(a.exPoint&&result.value.points.some(item=>item.id===a.exPoint)){currentPair().b=a.exPoint;d.status='';render();$('[data-ex-point="'+a.exPoint+'"]')?.focus?.({preventScroll:true});return;}
    if(a.exAction==='record'){const record=snapshotRecord();d.records.push(record);d.selectedRecord=String(d.records.length-1);d.status='';renderJournal();return;}
    if(a.exAction==='retain'){const w=d.writing;if(w.original===null&&w.draft.trim()){w.original=w.draft;w.retainedContext=writingContext();w.retainedCondition=currentContext();d.status='';renderJournal();}return;}
    if(a.exAction==='save'){save();return;}
    if(['copy-pending','copy-full'].includes(a.exAction)){const field=$(a.exAction==='copy-pending'?'[data-ex-preview]':'[data-ex-full]');field.focus();field.select?.();}
  }
  function onChange(event) {
    if(disposed)return;captureDetails();
    const target=event.target?.closest?.('[data-ex-control]');if(!target||!root.contains(target))return;
    const key=target.dataset.exControl,value=target.value;
    if(['axis','metric','variety','moisture','temperature'].includes(key)){
      const candidate={...d.input,[key]:['moisture','temperature'].includes(key)&&/^(?:\d+)(?:\.\d+)?$/.test(value)?Number(value):value};
      try{getExtrusionComparison(candidate);}catch{target.value=String(d.input[key]);return;}d.input=candidate;
    }else if(key==='food'&&EXTRUSION_FOOD_USES.some(item=>item.id===value))d.food=value;
    else if(['rowA','rowB'].includes(key)&&result.value.points.some(item=>item.id===value))currentPair()[key==='rowA'?'a':'b']=value;
    else if(key==='record'){d.selectedRecord=value;renderJournal();return;}
    else if(key==='saved'){d.selectedSaved=value;renderJournal();return;}
    else{render();return;}
    d.status='';render();
  }
  function onInput(event) {
    if(disposed)return;
    const target=event.target?.closest?.('[data-ex-write]');if(!target||!root.contains(target))return;
    captureDetails();const key=target.dataset.exWrite,w=d.writing;
    if(!['draft','revision'].includes(key))return;
    if((key==='draft'&&w.original!==null)||(key==='revision'&&w.original===null)){renderJournal();return;}
    if(target.value===w[key])return;w[key]=target.value;
    if(key==='draft'){w.firstContext??=writingContext();w.lastContext=writingContext();}else{w.revisionContext=writingContext();w.revisionVersion++;}
    d.status='';renderJournal();
  }
  function onToggle(event) {if(disposed||!root.contains(event.target)||!event.target?.dataset?.exDetail)return;captureDetails();renderJournal();}
  function onKey(event) {if(disposed||!['Enter',' '].includes(event.key))return;const target=event.target?.closest?.('[data-ex-point]');if(!target||!root.contains(target))return;event.preventDefault?.();onClick({target});}
  function dispose() {if(disposed)return;captureDetails();disposed=true;for(const [type,handler] of listeners)root.removeEventListener(type,handler,type==='toggle');if(d.active===view)d.active=null;if(mounted.get(root)===view)mounted.delete(root);}
  const view={dispose,render},listeners=[['click',onClick],['change',onChange],['input',onInput],['toggle',onToggle],['keydown',onKey]];
  d.active=view;mounted.set(root,view);for(const [type,handler] of listeners)root.addEventListener(type,handler,type==='toggle');
  render();return dispose;
}
