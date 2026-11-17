import {POULTRY_CONTAMINATION_ID, POULTRY_PATHOGENS, POULTRY_SOURCES, POULTRY_PREDICTION, evaluatePoultryRoutes, choosePoultryPrediction, checkPoultryPrediction, createPoultrySessionStore} from './poultry-contamination-model.js';
import {escapeHtml as esc, textareaValue, subscribeWorkbench, markWorkbenchChanged, refreshWorkbenchFeedback, saveWorkbenchSummary} from './workbench-session.js';
export {POULTRY_CONTAMINATION_ID} from './poultry-contamination-model.js';
const drafts = createPoultrySessionStore();
let instance = 0;

export function mountPoultryContaminationLab(container, id = POULTRY_CONTAMINATION_ID, options = {}) {
  if (id !== POULTRY_CONTAMINATION_ID) throw new RangeError(`Unsupported poultry lab: ${id}`);
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const {draftOwner, draftKey = id, onSaveSummary} = options;
  const owner = draftOwner && ['object', 'function'].includes(typeof draftOwner) ? draftOwner : container;
  const record = drafts.get(owner, draftKey), state = record.draft, prefix = `pc-${++instance}`;
  refreshWorkbenchFeedback(record);
  let disposed = false;
  container.innerHTML = `<section class="poultry-lab" data-pc-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="pcl-head"><p class="pcl-kicker">動手追蹤</p><h3 id="${prefix}-title">加熱之後，還有哪些路徑？</h3><p>假設生禽肉已有目標菌。先預測，再一次改一個接觸條件。</p></header>
    <details class="pcl-detail" data-pc-detail="prediction"><summary>起始判斷與修訂</summary><fieldset class="pcl-prediction"><legend>${esc(POULTRY_PREDICTION.prompt)}</legend>${POULTRY_PREDICTION.options.map(option => `<label class="pcl-choice"><input type="radio" name="${prefix}-prediction" data-pc-prediction value="${option.id}"><span>${esc(option.label)}</span></label>`).join('')}<button type="button" data-pc-check>記錄並檢查路徑</button><div data-pc-feedback aria-live="polite"></div></fieldset></details>
    <p class="pcl-prompt" data-pc-unrevealed>先選一項起始判斷，便可操作下方三條路徑。首次選擇會保留。</p>
    <div class="pcl-work" data-pc-work hidden>
      <fieldset class="pcl-controls"><legend>改變接觸條件</legend><label class="pcl-choice"><input type="checkbox" data-pc-control="heatEffective"><span>禽肉的有效加熱已成立<small>條件前提；不能用顏色或「有加熱」代替驗證。</small></span></label><label class="pcl-choice"><input type="checkbox" data-pc-control="separateCooked"><span>熟肉使用獨立潔淨砧板<small>取消熟肉再碰生肉砧板的接觸。</small></span></label><label class="pcl-choice"><input type="checkbox" data-pc-control="rinseRaw"><span>沖洗生肉，水花碰到即食菜<small>本情境明定飛濺接觸；配菜未再加熱。</small></span></label></fieldset>
      <div class="pcl-results" data-pc-results aria-live="polite"></div>
      <p class="pcl-boundary">箭頭表示接觸路徑，不表示菌數或發病機率。全部列出路徑被排除，也不等於食品已證實安全。</p>
    </div>
    <details class="pcl-detail" data-pc-detail="ecology"><summary>換一種菌，哪個判斷要改？</summary><label class="pcl-select" for="${prefix}-pathogen">比較菌種<select id="${prefix}-pathogen" data-pc-pathogen>${Object.entries(POULTRY_PATHOGENS).map(([key, value]) => `<option value="${key}">${esc(value.name)}</option>`).join('')}</select></label><div data-pc-ecology></div><p>切換菌種不改接觸箭頭。生長需求不同，不能直接換成「不會被轉移」。兩菌也可能同時存在，這裡只是分別閱讀。</p></details>
    <details class="pcl-detail" data-pc-detail="notes"><summary>我的觀察與本課筆記（選填）</summary><label class="pcl-select" for="${prefix}-observation">寫出一項改變與它切斷的路徑<textarea id="${prefix}-observation" data-pc-observation rows="3" maxlength="2000">${textareaValue(state.observation)}</textarea></label><button type="button" data-pc-save>附加目前比較到本課筆記</button><p data-pc-save-status role="status"></p><p class="pcl-small">包含起始選擇、修訂、目前條件與觀察；失敗時草稿保留，可重試。</p></details>
    <details class="pcl-detail" data-pc-detail="sources"><summary>情境假設與來源</summary><p>這是原創定性情境，預設原料已有所選菌，並明定砧板與飛濺接觸；不是追溯某次真實事件。沒有加入手部、包裝、儲存等全部可能路徑。</p><p>「有效加熱已成立」只代表針對目標菌、產品與實際條件已有合適的處理證據，模型才排除此段；不設定通用溫度、殺菌率或零存活。生熟分離及避免沖洗飛濺分別控制其他接觸。</p>${POULTRY_SOURCES.map(source => `<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a><br><small>${esc(source.locator)}</small></p>`).join('')}<p>來源支持危害、生態與控制邏輯；本圖的三條箭頭與開關是教學整理。未用舊版疾病負擔統計，也未聲稱兩菌的臺灣盛行率排名。</p></details>
  </section>`;
  const root = container.querySelector('.poultry-lab'), $ = selector => root.querySelector(selector);
  const label = answer => POULTRY_PREDICTION.options.find(option => option.id === answer)?.label ?? '尚未選擇';
  function updatePrediction() {
    root.querySelectorAll('[data-pc-prediction]').forEach(input => {input.checked = input.value === state.prediction.current;});
    $('[data-pc-check]').disabled = state.prediction.current === null;
    $('[data-pc-check]').textContent = state.prediction.checked ? '核對目前判斷' : '記錄並檢查路徑';
    $('[data-pc-feedback]').innerHTML = state.prediction.checked ? `<p><strong>${state.prediction.current === POULTRY_PREDICTION.correct ? '目前判斷符合這個情境。' : '目前判斷仍漏看了一條路徑。'}</strong></p><p>${esc(POULTRY_PREDICTION.explanation)}</p><p class="pcl-small">首次：${esc(label(state.prediction.first))}<br>首次核對：${esc(label(state.prediction.checkedSelection))}<br>目前：${esc(label(state.prediction.current))}</p>` : '';
  }
  function updateRoutes() {
    $('[data-pc-work]').hidden = !state.revealed;
    $('[data-pc-unrevealed]').hidden = state.revealed;
    root.querySelectorAll('[data-pc-control]').forEach(input => {input.checked = state.controls[input.dataset.pcControl];});
    const routes = evaluatePoultryRoutes(state.controls), active = routes.filter(route => route.open);
    $('[data-pc-results]').innerHTML = `<p class="pcl-result-title">${active.length ? '仍有污染路徑未被排除' : '本情境列出的三條路徑均被排除'}</p><ol class="pcl-routes">${routes.map(route => `<li class="pcl-route ${route.open ? 'is-open' : 'is-blocked'}" data-pc-route="${route.id}" data-open="${route.open}"><div class="pcl-route-head"><strong>${esc(route.name)}</strong><span>${route.open ? '路徑仍開啟' : '本模型排除'}</span></div><div class="pcl-chain" aria-label="${esc(route.nodes.join(' 到 '))}">${route.nodes.map((node, index) => `${index ? '<span class="pcl-arrow" aria-hidden="true">→</span>' : ''}<span class="pcl-node">${esc(node)}</span>`).join('')}</div><p>${esc(route.reason)}</p></li>`).join('')}</ol>`;
  }
  function updateEcology() {
    const pathogen = POULTRY_PATHOGENS[state.pathogen];
    $('[data-pc-pathogen]').value = state.pathogen;
    $('[data-pc-ecology]').innerHTML = `<h4>${esc(pathogen.name)} <i>${esc(pathogen.scientific)}</i></h4><p>${esc(pathogen.reservoir)}</p><p>${esc(pathogen.ecology)}</p><p><strong>對路徑判斷的影響：</strong>${esc(pathogen.implication)}</p>`;
  }
  function updateSave() {if (!disposed) {$('[data-pc-save-status]').textContent = record.message; $('[data-pc-save]').disabled = !!record.pending;}}
  updatePrediction(); updateRoutes(); updateEcology(); updateSave();
  root.querySelectorAll('[data-pc-detail]').forEach(detail => {detail.open = Boolean(state.details[detail.dataset.pcDetail]);});
  const onChange = event => {
    if (disposed) return;
    const target = event.target;
    if (target.matches('[data-pc-prediction]')) {choosePoultryPrediction(state, target.value); updatePrediction();}
    else if (target.matches('[data-pc-control]')) {state.controls[target.dataset.pcControl] = target.checked; updateRoutes();}
    else if (target.matches('[data-pc-pathogen]')) {state.pathogen = target.value; updateEcology();}
    markWorkbenchChanged(record);
  };
  const onInput = event => {if (!disposed && event.target.matches('[data-pc-observation]')) {state.observation = event.target.value; markWorkbenchChanged(record);}};
  const onClick = event => {
    if (disposed) return;
    if (event.target.closest?.('[data-pc-check]')) {checkPoultryPrediction(state); updatePrediction(); updateRoutes(); markWorkbenchChanged(record);}
    else if (event.target.closest?.('[data-pc-save]')) void saveWorkbenchSummary(record, onSaveSummary);
  };
  const onToggle = event => {if (!disposed && event.target.matches?.('[data-pc-detail]')) state.details[event.target.dataset.pcDetail] = event.target.open;};
  const unsubscribe = subscribeWorkbench(record, updateSave);
  root.addEventListener('change', onChange); root.addEventListener('input', onInput); root.addEventListener('click', onClick); root.addEventListener('toggle', onToggle, true);
  return () => {
    if (disposed) return;
    state.observation = $('[data-pc-observation]').value;
    root.querySelectorAll('[data-pc-detail]').forEach(detail => {state.details[detail.dataset.pcDetail] = detail.open;});
    markWorkbenchChanged(record); disposed = true; unsubscribe();
    root.removeEventListener('change', onChange); root.removeEventListener('input', onInput); root.removeEventListener('click', onClick); root.removeEventListener('toggle', onToggle, true);
  };
}
