// Connectivity and neutral-form bookkeeping for one existing lactose lesson.
// This is not a microscopic lactose trajectory or a new electron-library route.
export const LACTOSE_SITE_LESSON_ID = 'carb-disaccharide-site-transfer';
export const LACTOSE_SITE_TASKS = Object.freeze({
  opening: Object.freeze({
    label: '甲 · 只開 B 的還原端',
    prompt: '保持乳糖完整，只把 B（Glc）的半縮醛環打開。預測哪一條鍵改變、橋上哪兩段保留，以及淨耗水。',
    expected: Object.freeze({bond:'BC1-BO5',bridge:'both',water:'0'}),
    outcome: 'BC1–BO5 斷開，BC1–BO1 由單鍵變成羰基雙鍵；AC1–BO4 和 BO4–BC4 都保留。中性產物仍是一個完整乳糖，分子式 C₁₂H₂₂O₁₁，淨耗水 0。淨用水為 0，不等於水沒有參與質子接力。',
  }),
  hydrolysis: Object.freeze({
    label: '乙 · 指定的糖苷鍵水解',
    prompt: '對照下方原電子庫的乳糖酸水解分支：在 Gal 的 AC1 端切開糖苷鍵。這一段只計水解，不接著計產物的變旋。',
    expected: Object.freeze({bond:'AC1-BO4',bridge:'glucose-side',water:'1'}),
    outcome: 'AC1–BO4 斷開，BO4–BC4 保留在 Glc 上；水的氧接到 AC1。水解後得到 Gal + Glc，兩個分子，淨耗水 1。這是原模型指定的分支，不是所有條件下唯一的路徑。',
  }),
});
export const LACTOSE_SITE_OPTIONS = Object.freeze({
  bond: Object.freeze([
    Object.freeze({value:'BC1-BO5',label:'BC1–BO5 · B 的環內鍵'}),
    Object.freeze({value:'AC1-BO4',label:'AC1–BO4 · Gal 端的橋鍵'}),
    Object.freeze({value:'BO4-BC4',label:'BO4–BC4 · Glc C4 端的橋鍵'}),
  ]),
  bridge: Object.freeze([
    Object.freeze({value:'both',label:'AC1–BO4 與 BO4–BC4 都保留'}),
    Object.freeze({value:'glucose-side',label:'只保留 BO4–BC4'}),
    Object.freeze({value:'neither',label:'兩段都不保留'}),
  ]),
  water: Object.freeze([
    Object.freeze({value:'0',label:'0 · 沒有淨耗水'}),
    Object.freeze({value:'1',label:'1 · 淨消耗一個 H₂O'}),
  ]),
});
const empty = () => ({bond:'',bridge:'',water:'',reason:''});
export function lactoseSiteDraft(input={}) {
  const draft=empty();
  for(const field of ['bond','bridge','water']) {
    if(LACTOSE_SITE_OPTIONS[field].some(option=>option.value===input?.[field]))draft[field]=input[field];
  }
  if(typeof input?.reason==='string')draft.reason=input.reason.slice(0,2000);
  return draft;
}
export function evaluateLactoseSite(taskId,input) {
  const task=LACTOSE_SITE_TASKS[taskId];
  if(!task)throw new Error('未指定有效的乳糖任務。');
  const draft=lactoseSiteDraft(input);
  const missing=['bond','bridge','water'].filter(field=>draft[field]==='');
  if(missing.length)return {complete:false,correct:false,missing,draft};
  const fields=Object.fromEntries(['bond','bridge','water'].map(field=>[field,draft[field]===task.expected[field]]));
  const correct=Object.values(fields).every(Boolean);
  const selectedBond={
    'BC1-BO5':'你選的是 B 的環內鍵。只切這條環內鍵，不會分開 Gal–O–Glc；橋仍連著，仍是一個分子。要形成中性開鏈端，還需 BC1–BO1 成為羰基並完成質子轉移。',
    'AC1-BO4':'你選的是 Gal 端的糖苷橋鍵。切斷它會分開 Gal 和 Glc 的連通；BO4–BC4 仍在 Glc 上。這對應指定的水解分支，還需要水完成產物。',
    'BO4-BC4':'你選的是 Glc C4 與橋氧之間的鍵。這會破壞橋與 Glc 的連通，既不是 B 還原端開環，也不是原電子庫在 AC1 端切鍵的指定分支。',
  }[draft.bond];
  const feedback=[selectedBond,
    fields.bridge?'橋的保留判讀符合本任務。':taskId==='opening'?'只開 B 環時，橋上的 AC1–BO4 和 BO4–BC4 都要保留。少留任何一段，就不是完整乳糖的開環。':'本水解分支切 AC1–BO4，留下 BO4–BC4；不是把橋的兩段都切掉。',
    fields.water?'淨耗水判讀符合本任務。':taskId==='opening'?'開環只是同一分子的半縮醛／羰基互換與質子轉移，淨耗水為 0；溶劑水參與轉移不等於水被淨消耗。':'這一段水解淨消耗 1 個 H₂O，C₁₂H₂₂O₁₁ + H₂O → 2 C₆H₁₂O₆；不要把之後產物的變旋併進這個帳。'];
  return {complete:true,correct,fields,draft,feedback,outcome:task.outcome};
}
export function lactoseSiteSummary(taskId,result) {
  if(!LACTOSE_SITE_TASKS[taskId]||!result?.complete)throw new Error('請先核對完整的三項預測。');
  result=evaluateLactoseSite(taskId,result.draft);
  if(!result.complete)throw new Error('預測資料無效，請重新核對。');
  const label=(field)=>LACTOSE_SITE_OPTIONS[field].find(option=>option.value===result.draft[field])?.label;
  if(['bond','bridge','water'].some(field=>!label(field)))throw new Error('預測資料無效，請重新核對。');
  return ['乳糖部位核對｜'+LACTOSE_SITE_TASKS[taskId].label,
    '我的預測：切 '+label('bond')+'；'+label('bridge')+'；'+label('water')+'。',
    '核對結果：'+(result.correct?'三項相符。':'仍有項目需要修正。'),
    '本任務的結構／收支：'+LACTOSE_SITE_TASKS[taskId].outcome,
    ...(result.draft.reason?['我的理由：'+result.draft.reason]:[]),
    '範圍：這是連接與中性式收支判讀；一般半縮醛機構套用於此部位是教材推論，不表示酸條件保證保留糖苷橋。'].join('\n');
}
