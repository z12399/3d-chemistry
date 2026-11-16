import {createWorkbenchSessionStore} from './workbench-session.js';

export const POULTRY_CONTAMINATION_ID = 'poultry-contamination';
export const POULTRY_PATHOGENS = Object.freeze({
  salmonella: Object.freeze({name: '沙門氏菌', scientific: 'Salmonella', reservoir: '可存在人與動物腸道；糞便污染可把它帶入食品或環境。', ecology: '相關食品不只禽肉；生鮮與乾燥食品都曾涉及。食品中的增殖取決於基質、溫度等條件，不能由「已污染」直接推出正在大量生長。', implication: '沿生肉、器具與熟食的接觸查路徑，不用是否看見增殖來決定是否防止轉移。', sourceIds: Object.freeze(['poultry-cdc-salmonella', 'poultry-fda-bbb'])}),
  campylobacter: Object.freeze({name: '彎曲桿菌', scientific: 'Campylobacter（以 C. jejuni 為例）', reservoir: '可存在禽類腸道等部位；帶菌動物未必顯示生病。生或未充分加熱禽肉是重要食源。', ecology: 'C. jejuni 為微需氧菌，生長偏好低於大氣的氧濃度，對乾燥等環境壓力較脆弱。這些生長與存活特性，不等於接觸空氣便立即消失。', implication: '不能以「微需氧」排除短時間接觸轉移；生肉器具與即食食品仍需分開。', sourceIds: Object.freeze(['poultry-cdc-campylobacter', 'poultry-fda-bbb'])})
});
export const POULTRY_SOURCES = Object.freeze([
  Object.freeze({id: 'poultry-cdc-chicken', label: 'CDC｜Chicken and Food Poisoning', url: 'https://www.cdc.gov/food-safety/foods/chicken.html', locator: 'Raw chicken can have germs；Steps to safer chicken（2024-04-29）'}),
  Object.freeze({id: 'poultry-cdc-campylobacter', label: 'CDC｜About Campylobacter infection', url: 'https://www.cdc.gov/campylobacter/about/index.html', locator: 'Spread；How Campylobacter cause illness（2026-08-12）'}),
  Object.freeze({id: 'poultry-cdc-salmonella', label: 'CDC｜About Salmonella infection', url: 'https://www.cdc.gov/salmonella/about/index.html', locator: 'Spread；How Salmonella cause illness（2024-10-04）'}),
  Object.freeze({id: 'poultry-fda-bbb', label: 'FDA｜Bad Bug Book，第 2 版', url: 'https://www.fda.gov/media/83271/download', locator: 'Salmonella spp.：Organism / Sources；Campylobacter jejuni：Organism / Sources（2012；PDF 第 9、12、14、16 頁）'}),
  Object.freeze({id: 'poultry-fda-home', label: 'FDA｜Food Safety at Home', url: 'https://www.fda.gov/consumers/womens-health-topics/food-safety-home', locator: 'Clean；Separate：生肉沖洗飛濺與生熟食品分開'})
]);
export const POULTRY_PREDICTION = Object.freeze({
  prompt: '起始情境：禽肉已有效加熱，但熟肉放回接觸過生肉的砧板，洗肉水花也碰到即食配菜。能排除所有列出的污染路徑嗎？',
  options: Object.freeze([
    Object.freeze({id: 'all', label: '能；有效加熱會涵蓋整份餐點的所有接觸。'}),
    Object.freeze({id: 'bypass', label: '不能；砧板與飛濺路徑繞過了禽肉加熱。'}),
    Object.freeze({id: 'oxygen', label: '換成彎曲桿菌就能；接觸空氣後不會再轉移。'})
  ]),
  correct: 'bypass',
  explanation: '加熱只作用於經過該處理的禽肉。其後的生肉砧板接觸，以及碰到未再加熱配菜的水花，都繞過這個節點；微需氧也不表示一碰空氣就沒有存活與轉移。'
});

export function evaluatePoultryRoutes(controls) {
  for (const key of ['heatEffective', 'separateCooked', 'rinseRaw']) if (typeof controls?.[key] !== 'boolean') throw new TypeError(`${key} must be boolean`);
  return [
    {id: 'heat', name: '原料經加熱', nodes: ['受污染生禽肉', '禽肉加熱', '供餐禽肉'], open: !controls.heatEffective, reason: controls.heatEffective ? '依「有效加熱已成立」的前提，此路徑在模型中被處理節點排除。' : '沒有有效加熱已成立的證據，此路徑保留。'},
    {id: 'board', name: '砧板再引入', nodes: ['受污染生禽肉', '生肉砧板', '已加熱禽肉'], open: !controls.separateCooked, reason: controls.separateCooked ? '熟肉使用獨立潔淨接觸面，本情境的生肉砧板路徑不成立。' : '已加熱禽肉再碰生肉砧板；前段加熱沒有處理這次轉移。'},
    {id: 'splash', name: '飛濺至配菜', nodes: ['受污染生禽肉', '沖洗水花', '即食配菜'], open: controls.rinseRaw, reason: controls.rinseRaw ? '本情境明定沖洗水花碰到即食配菜，且配菜未再加熱。' : '本情境不沖洗生禽肉，這條沖洗飛濺路徑未啟動。'}
  ];
}

export function createPoultryDraft() {
  return {pathogen: 'salmonella', controls: {heatEffective: true, separateCooked: false, rinseRaw: true}, prediction: {first: null, current: null, checkedSelection: null, checked: false, revisions: []}, revealed: false, observation: '', details: {prediction: true, ecology: false, notes: false, sources: false}};
}
export function choosePoultryPrediction(draft, answer) {
  if (!POULTRY_PREDICTION.options.some(option => option.id === answer)) throw new RangeError(`Unknown prediction: ${answer}`);
  const prediction = draft.prediction;
  if (prediction.first === null) prediction.first = answer;
  if (prediction.current !== answer) prediction.revisions.push(answer);
  prediction.current = answer;
}
export function checkPoultryPrediction(draft) {
  if (draft.prediction.current === null) return false;
  if (!draft.prediction.checked) draft.prediction.checkedSelection = draft.prediction.current;
  draft.prediction.checked = true; draft.revealed = true; return true;
}
const predictionLabel = id => POULTRY_PREDICTION.options.find(option => option.id === id)?.label ?? '尚未選擇';
export function buildPoultrySummary(draft) {
  const pathogen = POULTRY_PATHOGENS[draft.pathogen];
  if (!pathogen) throw new RangeError(`Unknown pathogen: ${draft.pathogen}`);
  const routes = evaluatePoultryRoutes(draft.controls), prediction = draft.prediction;
  return [
    '【禽肉污染路徑工作台】',
    '原創定性情境：假設生禽肉已有所選菌；不是個案檢驗結果或發病風險估算。',
    `目前菌種：${pathogen.name}（${pathogen.scientific}）`,
    `條件：有效加熱已成立＝${draft.controls.heatEffective ? '是' : '否／尚未證實'}；熟肉使用獨立潔淨面＝${draft.controls.separateCooked ? '是' : '否'}；沖洗生肉且水花碰到即食菜＝${draft.controls.rinseRaw ? '是' : '否'}`,
    `目前結果：${draft.revealed ? routes.map(route => `${route.name}：${route.open ? '路徑仍開啟' : '本模型排除'}`).join('；') : '尚未揭示'}`,
    '起始預測情境固定為：有效加熱、熟肉碰生肉砧板、沖洗水花碰即食菜。',
    `首次選擇：${predictionLabel(prediction.first)}`,
    `首次核對：${prediction.checked ? predictionLabel(prediction.checkedSelection) : '尚未核對'}`,
    `目前選擇：${predictionLabel(prediction.current)}`,
    `選擇歷程：${prediction.revisions.length ? prediction.revisions.map(predictionLabel).join(' → ') : '尚未選擇'}`,
    `生態判讀：${pathogen.ecology}`,
    `我的觀察：${draft.observation.trim() ? draft.observation : '尚未填寫'}`,
    '界線：箭頭只表示本情境可能接觸，未估菌數、轉移量或感染機率。有效加熱須有符合產品及條件的驗證；全部列出路徑被排除，不等於食品已證實安全。'
  ].join('\n');
}
export const createPoultrySessionStore = () => createWorkbenchSessionStore({createDraft: createPoultryDraft, buildSummary: buildPoultrySummary});
