// Original finite qualitative gate model, not enzyme kinetics or a culture protocol.
export const FEEDBACK_INHIBITION_ID = 'feedback-inhibition-reasoning';
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const FEEDBACK_CONDITIONS = freeze([
  {id:'substrate',label:'入口底物仍可用'},
  {id:'cofactor',label:'本模型必要的輔因子可用'},
  {id:'enzyme',label:'入口酵素仍完整可作用'},
  {id:'signal',label:'假設終產物的抑制調節作用啟用'}
]);
export const FEEDBACK_SOURCES = freeze([
  {id:'micro-batch-source-gallagher1998',label:'Gallagher 等（1998）：大腸桿菌生合成型蘇胺酸脫胺酶',url:'https://pubmed.ncbi.nlm.nih.gov/9562556/',scope:'已核讀摘要：此具名酵素受路徑終產物異白胺酸抑制，也受纈胺酸活化。這支持特定前段步驟的調節；不代表所有產物都抑制。摘要提出的調節位點仍屬暫定，沒有用來指定本課的結合位點。'}
]);
export const FEEDBACK_STATIONS = freeze([
  {id:'gate',title:'1．先判斷入口條件',editable:true,prompt:'依目前四個條件，這個原創模型容許 S 經入口酵素形成 I 嗎？判斷的是模型的允許條件，不是真實反應速率。',options:[{id:'allowed',label:'模型入口允許形成 I'},{id:'blocked',label:'至少一個門條件未滿足，模型入口不允許'},{id:'all-destroyed',label:'只要終產物存在，所有酵素一定永久損壞'}]},
  {id:'loop',title:'2．把回饋箭頭接回哪裡？',editable:false,prompt:'概念路徑 S → I → P 中，P 是路徑終產物。下列哪一條關係最能表達本課的終產物回饋抑制？',options:[{id:'earlier',label:'P 對前段的調節步驟產生抑制作用'},{id:'substrate-competition',label:'P 必定與 S 搶同一個底物結合位點'},{id:'all-enzymes',label:'P 必定不可逆地破壞所有路徑酵素'}]},
  {id:'release',title:'3．移除訊號之前，先看其他門',editable:true,prompt:'在保留其他三個目前條件下，概念上把終產物的抑制調節訊號設為「無」。模型入口接著如何？這是條件比較，不是實驗操作。',options:[{id:'reopens',label:'其他三個條件皆存在，入口變成或維持允許'},{id:'still-blocked',label:'仍有其他條件缺少，入口依然不允許'},{id:'must-repair',label:'移除訊號必定同時修復酵素並補回底物與輔因子'}]},
  {id:'ambiguous',title:'4．產物少，原因就只有一個嗎？',editable:false,prompt:'另一個未知樣品只報告「這條路徑的產物較少」，沒有底物、輔因子、酵素完整性或調節證據。可以直接辨認原因嗎？',options:[{id:'not-identified',label:'不能；回饋、底物不足、輔因子不足或酵素失活都須分開檢查，且可能並存'},{id:'feedback-proved',label:'可以；低產物就是終產物回饋已被證實'},{id:'cofactor-proved',label:'可以；低產物一定表示 NAD 再生不足'}]},
  {id:'competition',title:'5．增加底物會保證解除嗎？',editable:false,prompt:'本課把終產物訊號當成獨立的調節門，沒有設定任何底物濃度或競爭性抑制方程。能否因此說「增加 S 一定解除終產物抑制」？',options:[{id:'not-guaranteed',label:'不能；不能把回饋概念自動套成可被底物克服的競爭性抑制'},{id:'more-substrate',label:'能；所有抑制都可以只靠增加底物解除'},{id:'same-site',label:'能；終產物一定就是底物結合位點的競爭者'}]},
  {id:'transfer',title:'6．把 NAD 與調節訊號分開',editable:false,prompt:'某條路徑需要的輔因子不可用；另有證據顯示終產物調節訊號已降低。即使入口仍未恢復，能否只據此否定先前有回饋抑制？',options:[{id:'separate-prerequisites',label:'不能；訊號解除與輔因子可用是不同前提，要分開檢查'},{id:'feedback-absent',label:'能；只要沒有恢復，先前就不可能有回饋'},{id:'nad-is-signal',label:'能；輔因子不足與終產物回饋是同一件事'}]}
]);
const stations = new Map(FEEDBACK_STATIONS.map(item=>[item.id,item]));
const controlIds = new Set(FEEDBACK_CONDITIONS.map(item=>item.id));
const choices = {loop:'earlier',ambiguous:'not-identified',competition:'not-guaranteed',transfer:'separate-prerequisites'};
const text = value => typeof value === 'string' ? value : '';
const lock = (object,key,value) => Object.defineProperty(object,key,{value,writable:false,configurable:false,enumerable:true});
const defaults = () => ({substrate:true,cofactor:true,enzyme:true,signal:true});
function requireDraft(draft) {
  if(!draft || typeof draft!=='object' || !draft.trials || typeof draft.trials!=='object' || Array.isArray(draft.trials)) throw new TypeError('A feedback draft is required');
  getFeedbackStation(draft.stationId);return draft;
}
export function getFeedbackStation(id) { const item=stations.get(id);if(!item)throw new RangeError('Unknown feedback station');return item; }
export function evaluateFeedbackGate(conditions) {
  if(!conditions || typeof conditions!=='object' || Object.keys(conditions).length!==controlIds.size || Object.keys(conditions).some(key=>!controlIds.has(key)) || [...controlIds].some(key=>!Object.hasOwn(conditions,key)||typeof conditions[key]!=='boolean'))throw new TypeError('Exactly four boolean model conditions are required');
  const blockers=FEEDBACK_CONDITIONS.filter(item=>item.id==='signal'?conditions.signal:!conditions[item.id]).map(item=>item.id);
  return {allowed:blockers.length===0,blockers,conditions:{...conditions}};
}
export function createFeedbackDraft() {
  return {stationId:'gate',trials:Object.fromEntries(FEEDBACK_STATIONS.map(item=>[item.id,{controls:defaults(),choice:'',reason:'',revision:'',checked:null}])),synthesis:'',details:{}};
}
export function getFeedbackTrial(draft) { requireDraft(draft);const trial=draft.trials[draft.stationId];if(!trial || typeof trial!=='object')throw new TypeError('Missing finite feedback slot');evaluateFeedbackGate(trial.controls);return trial; }
export function setFeedbackStation(draft,id) { requireDraft(draft);getFeedbackStation(id);draft.stationId=id;return draft; }
export function setFeedbackControl(draft,key,value) {
  const trial=getFeedbackTrial(draft);if(!getFeedbackStation(draft.stationId).editable || !controlIds.has(key) || typeof value!=='boolean')throw new RangeError('Unknown or unavailable feedback control');
  trial.controls[key]=value;return draft;
}
export function chooseFeedbackAnswer(draft,id) {
  const trial=getFeedbackTrial(draft);if(!getFeedbackStation(draft.stationId).options.some(item=>item.id===id))throw new RangeError('Unknown feedback answer');
  trial.choice=id;return draft;
}
export function evaluateFeedback(draft) {
  const trial=getFeedbackTrial(draft),gate=evaluateFeedbackGate(trial.controls),withoutSignal=evaluateFeedbackGate({...trial.controls,signal:false});
  let answer=choices[draft.stationId],explanation;
  if(draft.stationId==='gate') {
    answer=gate.allowed?'allowed':'blocked';
    const blockedLabels={substrate:'入口底物不可用',cofactor:'必要輔因子不可用',enzyme:'入口酵素不完整可作用',signal:'假設終產物的抑制調節作用啟用'};
    explanation=gate.allowed?'四個門的條件都滿足：底物、必要輔因子、完整酵素均存在，而且假設調節作用已解除，因此本模型入口允許。這沒有指定生成速率，也沒有保證整條路徑或真實發酵一定進行。':`模型入口未滿足的條件：${gate.blockers.map(id=>blockedLabels[id]).join('、')}。可同時有多個原因；假設調節作用啟用不等於測得高濃度就證實抑制，也不等於酵素永久損壞。`;
  } else if(draft.stationId==='loop') explanation='回饋表示路徑後端的產物影響前段調節步驟，使供給受到調節。本課只指定 P 抑制 S→I 的入口；不宣稱所有路徑都有同一個調節酵素、P 必定與 S 同位競爭，或已證明特定結合位點。';
  else if(draft.stationId==='release') {
    answer=withoutSignal.allowed?'reopens':'still-blocked';
    explanation=withoutSignal.allowed?'在本課假設可解除的調節門中，將作用設為解除後，其餘底物、輔因子、酵素三個前提都在，模型入口變成或維持允許。若原本就已解除，這不是額外恢復；這不是實驗洗除流程，也不推定真實可逆性或恢復速率。':'將假設的調節作用設為解除，只改一個門。底物、輔因子或酵素仍有前提未滿足，模型入口仍不允許；不能由終產物下降直接保證反應恢復，更不會自動修復酵素。';
  } else if(draft.stationId==='ambiguous') explanation='產物較少是觀察，並沒有指明造成它的唯一機制。回饋訊號、底物可用性、輔因子可用性與酵素完整性需要相應證據；它們也能同時出現。低產物不是回饋已證實，更不能只由此指定 NAD 再生不足。';
  else if(draft.stationId==='competition') explanation='回饋是路徑層次的調節關係；競爭性抑制則另有底物與抑制物的結合及動力學前提。本課沒有建立那些前提，不能推定增加底物必能克服終產物調節，也不由調節箭頭推定結合位點。';
  else if(draft.stationId==='transfer') explanation='移除終產物訊號只解除調節限制，不會自動使必要輔因子再可用。未恢復可與兩種限制原本並存相容；需要分開檢查。既有發酵 NAD 再生的計量條件也不能代替特定路徑的回饋證據。';
  return {stationId:draft.stationId,answer,explanation,gate,withoutSignal};
}
export function canCheckFeedback(draft) { const trial=getFeedbackTrial(draft);return !trial.checked && getFeedbackStation(draft.stationId).options.some(item=>item.id===trial.choice); }
export function checkFeedbackAnswer(draft) {
  const trial=getFeedbackTrial(draft);if(!canCheckFeedback(draft))return false;
  const result=evaluateFeedback(draft),snapshot=freeze({stationId:draft.stationId,controls:{...trial.controls},choice:trial.choice,reason:text(trial.reason),answer:result.answer,correct:trial.choice===result.answer,explanation:result.explanation,gate:result.gate,withoutSignal:result.withoutSignal});
  lock(trial,'checked',snapshot);lock(trial,'reason',snapshot.reason);return true;
}
export function currentFeedbackDiffers(draft) { const trial=getFeedbackTrial(draft),s=trial.checked;return Boolean(s && (trial.choice!==s.choice || FEEDBACK_CONDITIONS.some(item=>trial.controls[item.id]!==s.controls[item.id]))); }
export function buildFeedbackSummary(draft) {
  requireDraft(draft);
  const lines=['終產物回饋：入口門與其他前提','原創四布林門的定性模型；S→I→P僅表示概念路徑，沒有速率、濃度、培養或基因操作程序。',`目前任務：${draft.stationId}`];
  for(const item of FEEDBACK_STATIONS) {
    const trial=draft.trials[item.id];if(!trial)throw new TypeError('Missing finite feedback slot');
    evaluateFeedbackGate(trial.controls);
    if(!trial.checked && !trial.choice && !trial.reason && !trial.revision)continue;
    lines.push('',item.title);
    if(item.editable)lines.push('目前條件：'+FEEDBACK_CONDITIONS.map(c=>`${c.label}=${trial.controls[c.id]?'是':'否'}`).join('；'));
    lines.push(`目前選項：${text(trial.choice)}`,'核對前理由：',text(trial.reason));
    const s=trial.checked;
    if(s) {
      lines.push(`初答（首次核對）：${s.choice}`);
      if(item.editable)lines.push('核對條件：'+FEEDBACK_CONDITIONS.map(c=>`${c.label}=${s.controls[c.id]?'是':'否'}`).join('；'));
      lines.push(`首次核對結果：${s.correct?'符合此題模型與前提':'需要修訂'}`,'核對時理由：',s.reason,'核對說明：',s.explanation);
      const changed=trial.choice!==s.choice||FEEDBACK_CONDITIONS.some(c=>trial.controls[c.id]!==s.controls[c.id]);
      lines.push(changed?'目前選項或條件已改；首次核對不代表目前條件的評分。':'目前選項及條件與首次核對相同。');
    } else lines.push('尚未核對；不計為答對。');
    lines.push('修訂：',text(trial.revision));
  }
  lines.push('','我的整合短答：',text(draft.synthesis),'','自由文字未自動評分。已保存的是可讀摘要，不重建未保存盤面；本模型不提供真實食品或微生物效果預測。');return lines.join('\n');
}
