// Qualitative, idealised one-condition comparisons. No rate or colour estimator.
export const BROWNING_COMPARISON_ID = 'browning-comparison';
const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};

export const BROWNING_SOURCES = deepFreeze([
  {id: 'bcomp-iubmb-catechol', label: 'IUBMB：EC 1.10.3.1 鄰二酚氧化', url: 'https://iubmb.qmul.ac.uk/enzyme/EC1/10/3/1.html', locator: '官方反應式與酵素範圍；不是所有酚類都等同底物。'},
  {id: 'bcomp-chow2011', label: 'Chow 等，2011：蘋果 PPO、加熱與抗壞血酸', url: 'https://doi.org/10.1016/j.foodchem.2011.05.017', locator: '出版社摘要及可讀正文片段；加熱後仍可殘存活性，需獨立量測。'},
  {id: 'bcomp-jiang2021', label: 'Jiang & Penner，2021：AA 對 PPO 測定的影響', url: 'https://pubmed.ncbi.nlm.nih.gov/34681535/', locator: 'PubMed 摘要與原文 Introduction 可讀片段；顯色抑制不等於酵素失活。'},
  {id: 'bcomp-hemmler2018', label: 'Hemmler 等，2018：核糖／胺基酸模型與空白', url: 'https://www.nature.com/articles/s41598-018-34335-5', locator: 'Introduction；Results 的 Reaction monitoring、Formation of reaction products；Figure 1 圖說。'},
  {id: 'bcomp-aalaei2018', label: 'Aalaei 等，2018：奶粉儲存中的早期梅納指標', url: 'https://ifst.onlinelibrary.wiley.com/doi/10.1111/ijfs.13803', locator: '本批核讀出版社 Summary；可利用離胺酸的變化，不是色澤量測。'},
  {id: 'bcomp-lee2011', label: 'Lee 等，2011：蔗糖熱分解', url: 'https://experts.illinois.edu/en/publications/investigation-of-thermal-decomposition-as-the-kinetic-process-tha/', locator: '作者大學的完整摘要；熱轉化受時間與溫度共同影響，未用於計算速率。'},
  {id: 'bcomp-kurata1967', label: 'Kurata & Sakurai，1967：AA 非氧化降解', url: 'https://www.jstage.jst.go.jp/article/bbb1961/31/2/31_2_170/_article', locator: '出版社摘要及原始 PDF 可讀片段；酸性模型、無氧仍可形成降解產物。'}
]);

export const BROWNING_PREDICTIONS = deepFreeze([
  {id: 'blocked', label: '所問的入口被阻斷'},
  {id: 'possible', label: '仍可能進行或接續'},
  {id: 'uncertain', label: '目前條件不足以判斷'}
]);

export const BROWNING_CASES = deepFreeze([
  {
    id: 'ppo', label: '切片蘋果：PPO 起始步驟', short: '酵素性褐變',
    principle: '有活性的 PPO 讓合適酚類與氧反應生成醌；醌的後續顯色還包含非酵素反應。',
    conditions: ['有活性的 PPO', '合適鄰二酚與可用 O₂', '成分已接觸，尚未累積醌'],
    path: ['合適酚類＋O₂', 'PPO 催化形成醌', '後續反應可形成色素'],
    quality: '切片蘋果通常希望保留淺色外觀；是否需要褐色，仍依食品製備目標決定。',
    control: '減少氧接觸、選擇適合的 pH、確認酵素失活或還原醌，是不同控制位置；處理也可能改變質地、風味與營養。',
    scope: '理想化起始模型：以可被該 PPO 辨識的鄰二酚為底物；不把蘋果中的全部反應都歸給 PPO。完全無可用氧、已確認無活性是題設狀態，不是一般包裝或一次加熱必然達到的結果。',
    sourceIds: ['bcomp-iubmb-catechol', 'bcomp-chow2011', 'bcomp-jiang2021'],
    interventions: [
      {id: 'oxygen', label: '完全移除可用氧', change: '可用 O₂：有 → 無', question: '新的 PPO 催化鄰二酚氧化能否繼續？', verdict: 'blocked', heading: '這個需氧入口被阻斷', explanation: 'O₂ 是此催化反應的反應物。題設完全無可用氧時，不能繼續走這個起始步驟；低氧包裝不自動等同這個理想條件。', path: ['合適酚類；無可用 O₂', 'PPO 氧化入口受阻', '不據此保證全部褐變停止'], evidence: '核對溶氧、殘餘 PPO 活性和是否已有醌；低氧不能直接標成無氧。', missing: '可用 O₂'},
      {id: 'enzyme', label: '反應前已確認 PPO 失活', change: '起始 PPO：有活性 → 無活性', question: '新的 PPO 催化鄰二酚氧化能否開始？', verdict: 'blocked', heading: '催化入口缺少有活性的 PPO', explanation: '這裡已明確確認 PPO 失活，且尚未累積醌。它阻斷的是所選酵素催化入口，並未排除其他非酵素反應。', path: ['酚類＋O₂', 'PPO 已確認失活', '新催化入口受阻'], evidence: '用適當底物獨立測殘餘活性；不要只以顏色淺推定失活。', missing: '有活性的 PPO'},
      {id: 'phenol', label: '移除可被辨識的酚類底物', change: '合適鄰二酚：有 → 無', question: '指定的 PPO／鄰二酚起始反應能否進行？', verdict: 'blocked', heading: '有酵素和氧，仍需合適底物', explanation: '該入口缺少可被 PPO 辨識的鄰二酚；其他酚類也不能不經核對就當成相同底物。', path: ['PPO＋O₂', '缺少所選酚類底物', '指定入口受阻'], evidence: '確認底物身份與殘餘含量；不是只測總酚或把任何酚都視為等效。', missing: '合適鄰二酚'},
      {id: 'heated', label: '加熱過，但未測殘餘活性', change: 'PPO 狀態：有活性 → 尚未確認', question: '只知道加熱過，就能判定 PPO 入口被關閉嗎？', verdict: 'uncertain', heading: '加熱史不能代替殘餘活性', explanation: '失活受酵素來源、溫度、時間與基質影響。蘋果 PPO 原研究在所測加熱條件下仍有殘餘活性；本題未提供足以判定失活的量測。', path: ['酚類＋O₂', 'PPO 活性尚未確認', '先測活性，再判斷入口'], evidence: '需相應樣品的時間—溫度歷程、處理後冷卻條件及殘餘 PPO 活性。', missing: '已確認的 PPO 活性'},
      {id: 'after-quinone', label: '已形成醌，再讓 PPO 失活', change: '已有醌時，PPO：有活性 → 無活性', question: 'PPO 失活後，已生成醌的後續顯色是否仍可能？', verdict: 'possible', heading: '既有醌仍可能接續反應', baseline: ['已有相同量的醌', 'PPO 仍有活性', '其餘反應條件相同'], baselinePath: ['已有醌；PPO 仍有活性', '催化供給與後續反應並存', '色素仍可能形成'], explanation: '停止新的催化生成，不會自動移除已生成的醌或色素。醌後續反應可不靠 PPO，先後順序因此很重要。', path: ['已有醌', '後續非酵素反應仍可能', '失活不等於把顏色倒回去'], evidence: '分開追蹤殘餘活性、醌／下游產物和色澤；有醌的起始組不能假裝是零產物空白。', missing: '後續供給的新醌'},
      {id: 'ascorbate', label: '加入可作用的抗壞血酸', change: '可用 AA：未加入 → 加入', question: '顯色被延緩，是否就能排除 PPO 催化仍在進行？', verdict: 'possible', heading: '還原醌可以暫時延緩顯色', explanation: 'AA 可把生成的醌還原回酚類，自己被氧化；此時淺色不能證明 PPO 已失活。AA 耗盡或後續反應改變後，仍需重新追蹤。', path: ['PPO 可生成醌', 'AA 可將醌還原', '顯色與酵素活性分開量'], evidence: '同時量 AA、PPO 活性和色澤；注意 AA 可干擾以醌顯色測活性的結果。', missing: '由色澤判斷活性的依據'}
    ]
  },
  {
    id: 'maillard', label: '糖與胺基：梅納反應入口', short: '非酵素性：梅納',
    principle: '還原糖可反應的羰基與胺基縮合，接著進入重排、裂解和縮合網路；不必先有 PPO。',
    conditions: ['還原糖的可反應羰基', '可反應胺基', '相同 pH、水分與反應時間'],
    path: ['糖羰基＋胺基', '早期縮合／重排', '後續產物與可能的褐色'],
    quality: '麵包烘烤可利用這類反應形成表皮色澤與香氣；相同反應在不希望變色的食品中則可能降低品質。',
    control: '調整反應物、pH、時間、溫度和水分條件；不以去除 PPO 當作關閉梅納反應的控制。',
    scope: '是原創的入口對照，不重現文獻速率。原研究利用糖單獨、胺基酸單獨的空白區分產物來源；其未緩衝模型和本題理想化固定 pH 的對照不可混同。',
    sourceIds: ['bcomp-hemmler2018', 'bcomp-aalaei2018'],
    interventions: [
      {id: 'amine', label: '移除可反應胺基', change: '可反應胺基：有 → 無', question: '指定的糖羰基—胺基縮合入口能否開始？', verdict: 'blocked', heading: '梅納入口缺少胺基', explanation: '移除胺基會阻斷這個糖—胺基入口，但糖本身仍可能有熱轉化；不能將「沒有梅納入口」改寫為「完全不會褐變」。', path: ['糖羰基仍在', '缺少可反應胺基', '糖本身的轉化另行考慮'], evidence: '用糖單獨、胺基單獨與混合組對照；測反應物和具辨識力的產物，不只看顏色。', missing: '可反應胺基'},
      {id: 'ppo-off', label: '只讓 PPO 失活', change: 'PPO：有活性 → 無活性', baseline: ['糖羰基與可反應胺基', '另有活性 PPO', '其餘條件理想化地保持相同'], question: '糖羰基與胺基都還在，梅納入口能否仍存在？', verdict: 'possible', heading: '梅納入口不依賴 PPO', explanation: '使 PPO 失活只針對酵素催化的路徑，並未移除羰基或胺基。即使同一食品中有 PPO，這個非酵素入口仍可能存在。', path: ['糖羰基＋胺基仍在', '不要求 PPO 催化', '非酵素反應仍可能'], evidence: '若用加熱失活，熱歷程本身也會影響化學反應，不能宣稱真實食品只改一個條件。', missing: '以 PPO 失活排除梅納的依據'},
      {id: 'cool', label: '由加熱改為較低溫儲存', change: '溫度降低；其他題設條件不變', question: '較低溫就能把梅納反應當成不可能嗎？', verdict: 'possible', heading: '低溫可改變速度，並非入口的刪除鍵', explanation: '羰基與胺基仍可接觸；梅納反應也可在儲存條件發生。未給定這個樣品的時間資料，不能由此填入可見褐變量或減速百分比。', path: ['糖羰基＋胺基', '入口仍可能', '時間尺度與顯色程度待量測'], evidence: '同批樣品固定條件，追蹤相同反應指標與時間；不要把看不出顏色當成沒有早期反應。', missing: '通用速率與顏色數值'}
    ]
  },
  {
    id: 'caramel', label: '糖加熱：焦糖化', short: '非酵素性：糖熱轉化',
    principle: '糖本身可經熱轉化、脫水、裂解與縮合；焦糖化不要求胺基參與。',
    conditions: ['指定糖樣品', '給定的熱歷程', '沒有預先加入胺基來源'],
    path: ['糖', '熱轉化反應網路', '香氣與色素可能形成'],
    quality: '製作焦糖可利用色澤與風味；是否合適仍看成品目標及加熱程度，不能把越深色當成越好。',
    control: '控制糖種類、pH、含水量與時間—溫度歷程；沒有一個數字能當所有糖、所有配方的共同開關。',
    scope: '熱轉化需保留時間與溫度；Lee 等的蔗糖研究不能推出所有糖的共同門檻。本工作台沒有溫度—色澤、速率或產率模型。',
    sourceIds: ['bcomp-lee2011', 'bcomp-hemmler2018'],
    interventions: [
      {id: 'add-amine', label: '加入可反應胺基', change: '可反應胺基：無 → 有', question: '加入胺基後，糖本身的熱轉化是否必須消失？', verdict: 'possible', heading: '兩種入口可以並存', explanation: '加胺基不會把糖的熱轉化變成不可能，還可能開啟糖—胺基反應。混合配方不能只選一個名稱，就宣稱所有褐色來自那一路。', path: ['糖的熱轉化可繼續', '另有糖羰基—胺基入口', '各路貢獻需要分別辨認'], evidence: '比較糖單獨、胺基單獨、混合樣品；HMF 或褐色本身不是唯一的路徑指紋。', missing: '單一來源的證明'},
      {id: 'sugar', label: '移除糖，作無糖空白', change: '糖前驅物：有 → 無', question: '在沒有預成糖降解物的空白中，指定的糖熱轉化入口還在嗎？', verdict: 'blocked', heading: '指定前驅物缺席', explanation: '這個理想空白沒有糖，也沒有預先形成的糖降解物，因此不能走所選的糖熱轉化入口。它不是對所有食品褐變的排除試驗。', path: ['無糖／無預成糖降解物', '所選前驅物入口缺席', '其他來源不在此模型內'], evidence: '空白要查糖及預成降解物；若仍含其他前驅物，需另設對照。', missing: '糖前驅物'}
    ]
  },
  {
    id: 'ascorbic', label: '酸性飲料：抗壞血酸降解', short: '非酵素性：AA 路徑',
    principle: 'AA 可先被氧化，再接續降解；酸與熱下也存在不需要氧的降解分支。',
    conditions: ['抗壞血酸 AA', '指定酸性與熱／儲存條件', '氧氣狀態另作對照'],
    path: ['AA', '氧化或非氧化降解', '下游產物可能參與褐變'],
    quality: '含 AA 的飲料需分開追蹤營養成分與顏色：AA、DHA 和後續產物是不同量，單看顏色或 AA 剩餘量都不完整。',
    control: '管理氧、溫度、儲存時間與配方，並追蹤 AA、DHA 和下游產物；酸化或除氧不能當成所有褐變的通用解法。',
    scope: 'Kurata 與 Sakurai 的酸性模型支持無氧仍有 AA 降解；它不提供本頁四類食品的相對速度，也不證明每份飲料都走同一路徑。',
    sourceIds: ['bcomp-kurata1967'],
    interventions: [
      {id: 'oxygen', label: '除去氧氣，保留酸／熱條件', change: '可用 O₂：有 → 無', question: 'AA 的全部降解與下游褐變可能性都會被刪除嗎？', verdict: 'possible', heading: '除氧後仍有非氧化分支', explanation: '特定酸性條件下，AA 可不經氧氣而降解並形成糠醛等產物。因此除氧可針對氧化分支，卻不能據此保證 AA 完全穩定或永不褐變。', path: ['AA；酸／熱條件仍在', '非氧化降解仍可能', '產物與顏色分開追蹤'], evidence: '確認起始 AA／DHA、氧狀態、溫度與時間，並追蹤下游產物。糠醛也不是 AA 的唯一來源指紋。', missing: '所有分支已關閉的證明'},
      {id: 'ppo-off', label: '只讓 PPO 失活', change: 'PPO：有活性 → 無活性', baseline: ['AA 與指定酸／熱條件', '另有活性 PPO', '其餘條件理想化地保持相同'], question: 'AA 的非酵素降解能否仍然發生？', verdict: 'possible', heading: '失活 PPO 不會移除 AA 的化學路徑', explanation: '這裡問的是 AA 的非酵素降解；它不以活性 PPO 為必要條件。AA 在切面還原醌的作用，不能替代對儲存飲料降解的判斷。', path: ['AA 仍在', '非酵素降解入口仍可能', '不以 PPO 活性預測全部顏色'], evidence: '把 PPO 控制與 AA／DHA／產物的時間資料分開；食品中還可能有糖等其他前驅物。', missing: '由酵素失活排除化學降解的依據'}
    ]
  }
]);

export function getBrowningCase(id) {
  const value = BROWNING_CASES.find(item => item.id === id);
  if (!value) throw new RangeError(`Unknown browning case: ${id}`);
  return value;
}
export function getBrowningIntervention(caseId, interventionId) {
  const value = getBrowningCase(caseId).interventions.find(item => item.id === interventionId);
  if (!value) throw new RangeError(`Unknown browning intervention: ${caseId}/${interventionId}`);
  return value;
}
export function evaluateBrowningComparison(caseId, interventionId, applied = true) {
  const item = getBrowningCase(caseId), intervention = getBrowningIntervention(caseId, interventionId);
  return {
    caseId, interventionId, applied: Boolean(applied),
    conditions: [...(intervention.baseline || item.conditions)],
    path: [...(applied ? intervention.path : intervention.baselinePath || item.path)],
    verdict: applied ? intervention.verdict : null,
    change: applied ? intervention.change : '尚未套用，兩組保持原條件',
    heading: applied ? intervention.heading : '原條件',
    explanation: applied ? intervention.explanation : item.principle
  };
}
export function createBrowningDraft() {
  return {caseId: 'ppo', interventionId: 'oxygen', applied: false, trials: {}, observation: '', details: {}};
}
export function setBrowningCase(draft, id) {
  const item = getBrowningCase(id);
  draft.caseId = id; draft.interventionId = item.interventions[0].id; draft.applied = false;
}
export function setBrowningIntervention(draft, id) {
  getBrowningIntervention(draft.caseId, id); draft.interventionId = id; draft.applied = false;
}
export const browningTrialKey = (caseId, interventionId) => `${caseId}/${interventionId}`;
export function getBrowningTrial(draft) {
  getBrowningIntervention(draft.caseId, draft.interventionId);
  const key = browningTrialKey(draft.caseId, draft.interventionId);
  if (!draft.trials[key]) draft.trials[key] = {first: null, current: null, checked: false, checkedSelection: null, reason: '', checkedReason: null, revision: ''};
  return draft.trials[key];
}
export function chooseBrowningPrediction(draft, value) {
  if (!BROWNING_PREDICTIONS.some(option => option.id === value)) throw new RangeError(`Unknown prediction: ${value}`);
  if (!draft.applied) return false;
  const trial = getBrowningTrial(draft);
  if (trial.first === null) trial.first = value;
  trial.current = value; return true;
}
export function checkBrowningPrediction(draft) {
  if (!draft.applied) return false;
  const trial = getBrowningTrial(draft);
  if (!trial.current || trial.checked) return false;
  trial.checked = true; trial.checkedSelection = trial.current; trial.checkedReason = trial.reason;
  return true;
}
export function buildBrowningSummary(draft) {
  const item = BROWNING_CASES.find(row => row.id === draft.caseId);
  const action = item?.interventions.find(row => row.id === draft.interventionId);
  const label = value => BROWNING_PREDICTIONS.find(row => row.id === value)?.label || '尚未選擇';
  const lines = ['【褐變條件對照】', `目前：${item?.label || '尚未完整'}；${action?.label || '尚未完整'}；${draft.applied ? '已套用變更' : '原條件'}`, '理想化條件推論；沒有計算速率、色差或各機制貢獻。'];
  for (const row of BROWNING_CASES) for (const intervention of row.interventions) {
    const trial = draft.trials?.[browningTrialKey(row.id, intervention.id)];
    if (!trial || (!trial.first && !trial.reason?.trim() && !trial.revision?.trim())) continue;
    lines.push(`${row.label}／${intervention.label}`, `首次：${label(trial.first)}`);
    if (trial.checked) {
      lines.push(`核對時：${label(trial.checkedSelection)}`, `核對時理由：${trial.checkedReason || '未填'}`, `核對後目前：${label(trial.current)}`, `條件推論：${intervention.heading}。${intervention.explanation}`);
      if (trial.revision?.trim()) lines.push(`修訂理由：${trial.revision}`);
    } else {
      lines.push(`核對前目前：${label(trial.current)}`);
      if (trial.reason?.trim()) lines.push(`預判理由：${trial.reason}`);
    }
  }
  if (draft.observation?.trim()) lines.push(`我的觀察：${draft.observation}`);
  lines.push('來源：IUBMB EC 1.10.3.1；Chow 2011；Jiang & Penner 2021；Hemmler 2018；Aalaei 2018；Lee 2011；Kurata & Sakurai 1967。', '單一褐色或 HMF／糠醛訊號不能唯一判定機制；控制方法仍須核對食品與品質目標。');
  return lines.join('\n');
}
