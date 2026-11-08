// Source-bounded retrieval practice. No efficacy, dose or disease-risk model.
export const RESVERATROL_ID = 'resveratrol-evidence';

const deepFreeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const RESVERATROL_SOURCES = deepFreeze([
  {id: 'resv-chebi27881', label: 'ChEBI 27881：resveratrol 的化學分類與結構', url: 'https://www.ebi.ac.uk/chebi/CHEBI:27881', scope: '權威化學資料庫的分類與結構；支持多酚／二苯乙烯酚類身分，不提供人體療效。'},
  {id: 'resv-chebi45713', label: 'ChEBI 45713：trans-resveratrol', url: 'https://www.ebi.ac.uk/chebi/CHEBI:45713', scope: '權威化學資料庫；trans 對應所選 E 配置，不把所有白藜蘆醇都當成同一幾何異構物。'},
  {id: 'resv-stojanovic2001', label: 'Stojanović 等，2001：所選模型中的抗氧化比較', url: 'https://pubmed.ncbi.nlm.nih.gov/11414688/', scope: '已核讀原始研究的 PubMed 摘要，未讀全文。γ 輻解脂質體與水相脈衝輻解體系；結論不外推為人體療效或唯一反應機制。'},
  {id: 'resv-wallerath2002', label: 'Wallerath 等，2002：培養內皮細胞的 eNOS 與 NO', url: 'https://pubmed.ncbi.nlm.nih.gov/12270858/', scope: '已核讀 Europe PMC 的原始研究摘要，未讀全文。HUVEC／EA.hy 926 培養細胞的 eNOS 表達與 NO 觀察；不是人體口服試驗。'},
  {id: 'resv-wong2011', label: 'Wong 等，2011：單次介入後的 FMD', url: 'https://research-portal.uea.ac.uk/en/publications/acute-resveratrol-supplementation-improves-flow-mediated-dilatati/', scope: '已核讀作者機構公開的完整摘要，未讀論文全文。19 位超重／肥胖且血壓輕度升高成年人、雙盲隨機交叉、介入後 1 小時的 FMD；未量測疾病事件。'},
  {id: 'resv-vandermade2017', label: 'van der Made 等，2017：四週介入的 FMD 比較', url: 'https://pubmed.ncbi.nlm.nih.gov/28604618/', scope: '已核讀 Europe PMC 的原始研究摘要，未讀全文。45 位超重／稍肥胖志願者、隨機交叉、四週介入期與至少四週洗脫期；未以此證明所有情境有效或無效。'}
]);

export const RESVERATROL_CASES = deepFreeze([
  {
    id: 'skeleton', title: '1．先辨骨架',
    prompt: '兩個芳環經中央兩個碳相連，帶有 3、5、4′ 三個酚羥基。所選 trans-resveratrol 屬於哪一類？',
    context: '先從連接方式分類，再談作用。中央雙鍵的 trans 在此對應 E 配置；酚羥基數目本身不能決定是否為類黃酮。',
    options: [
      {id: 'flavonoid', label: '類黃酮：C₆–C₃–C₆ 骨架', feedback: '類黃酮的 C₆–C₃–C₆ 碳骨架，與此處中央只有兩個碳的連接不同。多酚不是類黃酮的同義詞。'},
      {id: 'stilbenoid', label: '二苯乙烯酚類：C₆–C₂–C₆ 骨架', feedback: '兩個芳環以 C₂ 相連，符合所選白藜蘆醇的二苯乙烯骨架；它是多酚，但不是類黃酮。'},
      {id: 'carotenoid', label: '類胡蘿蔔素：長鏈共軛多烯', feedback: '這裡是兩芳環與中央 C₂，不是類胡蘿蔔素的長鏈共軛多烯骨架。'}
    ],
    answer: 'stilbenoid',
    explanation: '白藜蘆醇可歸入多酚中的二苯乙烯酚類。辨識依據是 C₆–C₂–C₆ 連接與 3、5、4′ 酚羥基；所選 trans 形為 E。不要因為「植物、多酚、抗氧化」就把它列為類黃酮。',
    sourceIds: ['resv-chebi27881', 'resv-chebi45713']
  },
  {
    id: 'radical', title: '2．反應式支持到哪裡？',
    prompt: '看到總括教學式 LOO• + ArOH → LOOH + ArO•，再讀到指定輻解體系中的抗氧化比較，可以作出哪個結論？',
    context: 'Stojanović 等以 γ 輻解脂質體及水相脈衝輻解研究白藜蘆醇／類似物；摘要指出在所測體系中，4′ 位 para-OH 的抗氧化表現優於 3、5 位 meta-OH 的比較。教學式只概括一個氫原子（1 H⁺ 與 1 e⁻）轉移，不是量得的反應動畫。',
    options: [
      {id: 'system-limited', label: '支持該體系的抗氧化反應；不能直接推出全身療效', feedback: '反應物、自由基種類、基質與量測端點都有範圍。可以解釋所選模型中的鏈終止概念，但仍需另查人體暴露與結果。'},
      {id: 'all-ros', label: '已證明能清除人體內所有 ROS', feedback: '一條總括式與指定體系的比較，沒有量到人體內所有 ROS，也沒有證明全身結果。'},
      {id: 'unique-mechanism', label: '已證明這是任何條件下唯一的抗氧化機制', feedback: '總括教學式不是唯一微觀機制的證明。研究體系與不同反應途徑不能略去。'}
    ],
    answer: 'system-limited',
    explanation: '酚可在所選反應中提供氫原子，使過氧自由基形成氫過氧化物，而留下酚氧自由基；自由基沒有憑空消失。這個記帳式及指定類似物比較，不代表已清除全部 ROS、確立唯一微觀機制或證實人體療效。',
    sourceIds: ['resv-stojanovic2001']
  },
  {
    id: 'enos', title: '3．細胞機制與人體試驗',
    prompt: '培養人內皮細胞的 eNOS 表達與 NO 觀察，直接支持哪一層主張？',
    context: 'Wallerath 等研究 HUVEC 與 EA.hy 926 培養細胞。摘要報告較長時間處理後 eNOS 表達與 eNOS-derived NO 增加，也另有短期 NO 觀察。本站只比較研究層級，不由細胞結果估算人體反應。',
    options: [
      {id: 'oral-trial', label: '已完成口服人體試驗，證明血管功能一定改善', feedback: '「人來源細胞」仍是培養細胞研究，不等於對成年人進行口服隨機試驗。'},
      {id: 'clinical-event', label: '已證明心肌梗塞發生率降低', feedback: '細胞的 eNOS／NO 端點沒有量到心肌梗塞事件；不能跨越到疾病結局。'},
      {id: 'cell-mechanism', label: '在所測培養細胞中，提供 eNOS／NO 的機制線索', feedback: '研究直接觀察培養細胞的表達與 NO；可以作為候選機制，但人體口服暴露及疾病結果需要其他證據。'}
    ],
    answer: 'cell-mechanism',
    explanation: '可寫成「培養人內皮細胞的 eNOS 表達／NO 研究，提供候選機制」。不能寫成人體口服療效或疾病預防已獲證明，也不能據此認定另一人體 FMD 結果一定由相同機制造成。',
    sourceIds: ['resv-wallerath2002']
  },
  {
    id: 'acute', title: '4．人體指標不是疾病事件',
    prompt: '19 位指定人群的單次介入後 1 小時，FMD 有上升。哪個說法與研究端點相符？',
    context: 'Wong 等的雙盲隨機交叉研究，納入超重／肥胖且血壓輕度升高的成年人。FMD（血流介導擴張）是血管內皮功能指標；本站不提供劑量或使用建議。',
    options: [
      {id: 'disease-prevention', label: '已證明長期飲用紅酒可預防心血管疾病', feedback: '研究介入、觀察時間與端點都不同；FMD 上升不能換成紅酒或疾病事件的因果結論。'},
      {id: 'measured-indicator', label: '支持該人群與短期條件下的 FMD 指標改善', feedback: '這是人體研究且直接量了 FMD；它的時間、人群與端點仍有限定。'},
      {id: 'same-pathway', label: '已直接證明培養細胞的 eNOS 途徑就是此結果的唯一原因', feedback: '兩篇研究不是同一條已實測的因果鏈；FMD 讀值不能單獨鑑別唯一分子機制。'}
    ],
    answer: 'measured-indicator',
    explanation: '人體 FMD 的短期改善比細胞端點更接近人體血管功能，但仍不是心肌梗塞、死亡等疾病結局。作答須保留指定人群、單次介入與 1 小時的範圍。',
    sourceIds: ['resv-wong2011']
  },
  {
    id: 'chronic', title: '5．未顯著與研究差異',
    prompt: '另一項四週介入研究的空腹與餐後 FMD 和安慰劑均無顯著差異。應如何與前一項短期研究並讀？',
    context: 'van der Made 等納入 45 位超重／稍肥胖志願者，採隨機交叉、四週介入期及至少四週洗脫期。兩篇研究的人群、時間與設計不同，不是直接操弄「長期／短期」的同一實驗。',
    options: [
      {id: 'retain-conditions', label: '保留兩篇各自的條件；未顯著不等於效果精確為零', feedback: '可以記錄該研究未見 FMD 顯著差異；不能把它推為全部情境無效，也不能只用時間差解釋兩篇結果。'},
      {id: 'zero-everywhere', label: '已證明所有人、所有情境的效果都恰好為零', feedback: '無顯著差異不是精確零效果的證明；單一人群與研究條件也不能覆蓋全部情境。'},
      {id: 'duration-cause', label: '兩篇已直接證明「吃久了就失效」的因果關係', feedback: '研究的人群與設計同時不同，不能把研究間差異全歸因於介入時間。'}
    ],
    answer: 'retain-conditions',
    explanation: '同時保留「單次介入後的 FMD 上升」與「另一四週研究未見顯著差異」的研究身分。要判斷差異來源，需能比較條件的研究；不能把未顯著寫成零，或把兩篇當成時間的單一因果試驗。',
    sourceIds: ['resv-wong2011', 'resv-vandermade2017']
  },
  {
    id: 'transfer', title: '6．換一種多酚再判讀',
    prompt: '原創情境：某新非類黃酮多酚在試管降低脂質氧化讀值，目前沒有人體資料。下一個合理判讀是什麼？',
    context: '這是自編的遷移練習，不代表真實產品或新臨床研究，也不是官方原題重製。不要只憑「多酚」名稱或一個試管端點跳到人體結論。',
    options: [
      {id: 'clinical-success', label: '只要試管抗氧化，就已證明能治療心血管疾病', feedback: '試管脂質氧化沒有量到人體暴露或疾病結果；不能直接推為治療有效。'},
      {id: 'no-human-no-effect', label: '沒有人體資料，就已證明在人體完全無效', feedback: '缺少資料與已證明無效不同。應指出未知及需要的比較，不能把未知當零。'},
      {id: 'identify-gaps', label: '只支持該體系；仍需人體暴露、適當對照及臨床結局證據', feedback: '先保留直接量到的端點，再說明跨到人體與疾病結局還缺的證據。這不等於已確定有效或已確定無效。'}
    ],
    answer: 'identify-gaps',
    explanation: '可支持的主張先停在試管的所測體系；跨到人體需要暴露與適當對照，跨到疾病主張還需相應臨床結局。練習的是證據與主張的距離，不提供治療或保健建議。',
    sourceIds: []
  }
]);

const caseById = new Map(RESVERATROL_CASES.map(item => [item.id, item]));
const emptyTrial = () => ({first: null, current: null, reason: '', checked: false, checkedSelection: null, checkedReason: '', revision: ''});
const requireDraft = draft => {
  if (!draft || typeof draft !== 'object' || !draft.trials || typeof draft.trials !== 'object' || Array.isArray(draft.trials)) throw new TypeError('A resveratrol draft is required');
  return draft;
};
const text = value => typeof value === 'string' ? value : '';
const lockValue = (object, name, value) => Object.defineProperty(object, name, {value, enumerable: true, writable: false, configurable: false});

export function createResveratrolDraft() {
  return {caseId: 'skeleton', trials: {}, synthesis: '', details: {}};
}

export function getResveratrolCase(id) {
  const item = caseById.get(id);
  if (!item) throw new RangeError(`Unknown resveratrol case: ${String(id)}`);
  return item;
}

export function getResveratrolTrial(draft) {
  requireDraft(draft);
  const item = getResveratrolCase(draft.caseId);
  if (!Object.hasOwn(draft.trials, item.id)) draft.trials[item.id] = emptyTrial();
  return draft.trials[item.id];
}

export function setResveratrolCase(draft, id) {
  requireDraft(draft);
  getResveratrolCase(id);
  draft.caseId = id;
  return draft;
}

export function chooseResveratrol(draft, optionId) {
  requireDraft(draft);
  const item = getResveratrolCase(draft.caseId);
  if (!item.options.some(option => option.id === optionId)) throw new RangeError(`Unknown option for ${item.id}: ${String(optionId)}`);
  const trial = getResveratrolTrial(draft);
  if (trial.first === null) lockValue(trial, 'first', optionId);
  trial.current = optionId;
  return trial;
}

export function checkResveratrol(draft) {
  const trial = getResveratrolTrial(draft);
  const item = getResveratrolCase(draft.caseId);
  if (!item.options.some(option => option.id === trial.current)) return false;
  if (trial.checked) return true;
  const reason = text(trial.reason);
  lockValue(trial, 'checkedSelection', trial.current);
  lockValue(trial, 'checkedReason', reason);
  lockValue(trial, 'reason', reason);
  lockValue(trial, 'checked', true);
  return true;
}

export function buildResveratrolSummary(draft) {
  requireDraft(draft);
  getResveratrolCase(draft.caseId);
  const lines = ['白藜蘆醇：骨架、機制與證據判讀', '原創六站提取練習；核對只針對選項，不自動評分自由文字或判定學習成效。'];
  for (const item of RESVERATROL_CASES) {
    const trial = Object.hasOwn(draft.trials, item.id) ? draft.trials[item.id] : emptyTrial();
    const label = id => item.options.find(option => option.id === id)?.label ?? '尚未選擇';
    const checked = trial.checked === true && item.options.some(option => option.id === trial.checkedSelection);
    lines.push('', item.title, `初答：${label(trial.first)}`, `核對：${checked ? (trial.checkedSelection === item.answer ? '核對時選項符合本題證據範圍' : '核對時選項需修正') : '尚未核對；不計為答對'}`);
    lines.push(`核對時選項：${checked ? label(trial.checkedSelection) : '尚未核對'}`, `目前選項：${label(trial.current)}`);
    lines.push('初答理由（核對後保留）：', text(trial.reason), '核對時理由：', checked ? text(trial.checkedReason) : '尚未核對', '修訂：', text(trial.revision));
    if (checked) lines.push('核對說明：', item.explanation);
  }
  lines.push('', '整合短答：', text(draft.synthesis), '', '範圍：權威化學資料庫與具名研究摘要；未讀論文全文，不作完整臨床綜述、完整反應機制、保健建議或官方標準答案。');
  return lines.join('\n');
}
