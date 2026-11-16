export const PRACTICE_HISTORY_LIMIT = 20;
export const PRACTICE_TEXT_LIMIT = 5000;

export function emptyPractice() {
  return {response:'',revision:'',transfer:'',checked:[],revealed:false,transferStarted:false,transferRevealed:false,history:[]};
}

function validateAttempt(value, archived = false) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('推理練習格式無效。');
  const result = {};
  for (const key of ['response','revision','transfer']) {
    const text = value[key] ?? '';
    if (typeof text !== 'string' || text.length > PRACTICE_TEXT_LIMIT) throw new Error('每段推理作答最多 5,000 字。');
    result[key] = text;
  }
  for (const key of ['revealed','transferStarted','transferRevealed']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error('推理練習展開狀態無效。');
    result[key] = value[key] === true;
  }
  if (value.checked !== undefined && (!Array.isArray(value.checked) || value.checked.length > 32 || value.checked.some(n => !Number.isInteger(n) || n < 0 || n > 31))) throw new Error('自評要點格式無效。');
  result.checked = [...new Set(value.checked || [])].sort((a,b) => a-b);
  if (archived) {
    if (typeof value.savedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.savedAt) || !Number.isFinite(Date.parse(value.savedAt))) throw new Error('作答日期格式無效。');
    result.savedAt = value.savedAt;
  }
  return result;
}

export function validatePractice(value) {
  const result = validateAttempt(value);
  if(!result.response.trim())result.revealed=false;
  if (value.history !== undefined && (!Array.isArray(value.history) || value.history.length > PRACTICE_HISTORY_LIMIT)) throw new Error('每題最多保留 20 次作答；原紀錄未刪除。');
  result.history = (value.history || []).map(attempt => validateAttempt(attempt,true));
  return result;
}

export function archivePractice(value, now = new Date().toISOString()) {
  const current = validatePractice(value);
  if (![current.response,current.revision,current.transfer].some(text => text.trim())) throw new Error('先留下一段作答，再保留這次練習。');
  if (current.history.length >= PRACTICE_HISTORY_LIMIT) throw new Error('已保留 20 次作答。請先匯出紀錄；仍可編輯目前作答。');
  const {history,...attempt} = current;
  return validatePractice({...emptyPractice(),history:[...history,{...attempt,savedAt:now}]});
}

export const hasPracticeWork = value => !!value && (!!value.response?.trim() || !!value.revision?.trim() || !!value.transfer?.trim() || !!value.history?.length);
