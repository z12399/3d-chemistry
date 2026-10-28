import {validatePractice,emptyPractice} from './practice-model.js';
import {learningSubject,subjectForCourse,LEARNING_SUBJECTS} from './learning-subjects.js';
export const LEARNING_KEY = 'food-chemistry-learning-v1';
export const LEARNING_SCHEMA = 'food-chemistry-learning/v1';
export const MAX_LEARNING_IMPORT_BYTES = 32 * 1024 * 1024;
export const LESSON_STEPS = ['understand', 'observe', 'check'];
// These reviewed questions use separate answer identities; old lesson data stays intact.
// V2 remains reserved: prior water answers cannot establish which question was shown.
export const WATER_QUIZ_V2_KEY = 'water-activity-quiz-v2-20261028';
export const WATER_QUIZ_V2_MARKER = '__internal_water_activity_quiz_v2_20261028__';
export const WATER_QUIZ_V3_KEY = 'water-activity-quiz-v3-20261028';
export const WATER_QUIZ_V3_MARKER = '__internal_water_activity_quiz_v3_20261028__';
const REVISED_QUIZZES = Object.freeze([
  {subject:'chemistry',lesson:'water-activity',key:WATER_QUIZ_V3_KEY,marker:WATER_QUIZ_V3_MARKER},
  {subject:'chemistry',lesson:'water-buffer',key:'water-buffer-quiz-v2-20261028',marker:'__internal_water_buffer_quiz_v2_20261028__'},
  {subject:'chemistry',lesson:'processing-temperature',key:'processing-temperature-quiz-v2-20261028',marker:'__internal_processing_temperature_quiz_v2_20261028__'},
  {subject:'processing',lesson:'proc-sensible-latent',key:'proc-sensible-latent-quiz-v2-20261028',marker:'__internal_proc_sensible_latent_quiz_v2_20261028__'},
  {subject:'processing',lesson:'proc-freeze-drying',key:'proc-freeze-drying-quiz-v2-20261028',marker:'__internal_proc_freeze_drying_quiz_v2_20261028__'},
  {subject:'microbiology',lesson:'micro-infection-intoxication',key:'micro-infection-intoxication-quiz-v2-20261028',marker:'__internal_micro_infection_intoxication_quiz_v2_20261028__'}
].map(Object.freeze));
const RESERVED_QUIZZES = Object.freeze([{subject:'chemistry',key:WATER_QUIZ_V2_KEY,marker:WATER_QUIZ_V2_MARKER},...REVISED_QUIZZES].map(Object.freeze));
// Fixed, reviewed quiz identities; lesson IDs alone do not identify question versions.
const REVIEWED_QUIZ_SIGNATURES = [{"subject":"chemistry","lesson":"water-activity","signature":"[\"兩份食品在同一溫度下的含水量都是 20%，但糖、鹽組成不同。能否只據此判定兩者水活性相同？\",[\"不能；需要比較兩者同溫的水活性或平衡相對濕度。\",\"能；含水量相同，水活性必定相同。\",\"不能；糖、鹽組成不同，水活性必定不同。\"],0]"},{"subject":"chemistry","lesson":"water-buffer","signature":"[\"兩杯飲料 pH 相同，但弱酸與共軛鹼的總量不同。加入相同少量酸後，能只憑相同 pH 判定兩杯的 pH 變化相同嗎？\",[\"不能；還要比較可反應物的量及其他條件。\",\"可以；只需比較起始 pH，不必管可反應物的量。\",\"可以；只需比較加入的酸量，不必管配方與其他條件。\"],0]"},{"subject":"chemistry","lesson":"processing-temperature","signature":"[\"在 Arrhenius 模型的指定適用範圍，且各反應的 E_a > 0、A 與 E_a 近似固定時，升溫 10°C 是否使所有反應的 k 都剛好加倍？\",[\"不一定；倍率取決於各反應的 E_a 與起訖絕對溫度。\",\"一定；每個反應的 k 都會剛好加倍。\",\"不一定；E_a > 0 時升溫不會改變 k。\"],0]"},{"subject":"processing","lesson":"proc-sensible-latent","signature":"[\"固定壓力下，純水持續沸騰汽化而溫度近似不變。能否只憑溫度不變判定水沒有吸收能量？\",[\"不能；持續汽化仍需要能量。\",\"可以；溫度不變就表示水沒有吸收能量。\",\"不能；因為所有食品混合物相變時溫度都必定不變。\"],0]"},{"subject":"processing","lesson":"proc-freeze-drying","signature":"[\"一次乾燥時，已凍結的冰正在昇華。對供熱與水蒸氣去向，哪個敘述較合適？\",[\"仍需供熱；水蒸氣須通過乾燥層並由系統移除。\",\"不需供熱；真空會提供全部昇華能量。\",\"只需供熱；水蒸氣不必離開產品。\"],0]"},{"subject":"microbiology","lesson":"micro-infection-intoxication","signature":"[\"某食品中已形成毒素，處理後可培養菌數下降。僅憑菌數結果，能判定毒素活性如何改變嗎？\",[\"不能；需要另外取得相符的毒素及活性證據。\",\"可以；菌數下降比例就是毒素活性下降比例。\",\"可以；可培養菌數與毒素活性是同一項測量。\"],0]"}];
function revisedRecordState(identity, records) {
  const map = records && typeof records === 'object' && !Array.isArray(records) ? records : {};
  const key = identity.key, present = Object.hasOwn(map,key), candidate = map[key];
  const owned = present && candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    && candidate.note === identity.marker && candidate.starred === false && candidate.practice === undefined;
  return {special:true, key, marker:identity.marker, blocked:present && !owned, record:owned ? candidate : {}};
}
export function quizRecordState(subjectId, lesson, records = {}) {
  const identity = REVISED_QUIZZES.find(item => item.subject === subjectId && item.lesson === lesson?.id);
  const key = identity?.key ?? lesson?.id;
  const map = records && typeof records === 'object' && !Array.isArray(records) ? records : {};
  if (!identity) return {special:false, key, blocked:false, record:map[key] || {}};
  const expected = REVIEWED_QUIZ_SIGNATURES.find(item => item.subject === subjectId && item.lesson === lesson.id);
  const q = lesson.quiz;
  if (!expected || !q || JSON.stringify([q.question,q.options,q.answer]) !== expected.signature)
    return {special:true, key, marker:identity.marker, blocked:true, versionMismatch:true, record:{}};
  return revisedRecordState(identity,map);
}
const safeId = value => typeof value === 'string' && /^[a-z0-9-]{1,100}$/.test(value);
export const allLessons = course => (course?.topics || []).flatMap(topic => topic.lessons.map(lesson => ({topic, lesson})));
export const lessonPath = (topic, lesson, step = 'understand', root = 'learn') => {
  if(!Object.values(LEARNING_SUBJECTS).some(s=>s.root===root))throw new RangeError('Unknown course root');
  return `#${root}/${topic.id}/${lesson.id}/${step}`;
};
export function resolveLearningRoute(hash, course) {
  const parts = String(hash || '').replace(/^#/, '').split('?')[0].split('/');
  if (parts[0] !== subjectForCourse(course).root || !parts[1]) return {view:'home'};
  if (['map', 'review'].includes(parts[1])) return {view:parts[1]};
  const topic = course?.topics.find(t => t.id === parts[1]);
  if (!topic) return {view:'missing'};
  if (!parts[2]) return {view:'topic', topic};
  const lesson = topic.lessons.find(l => l.id === parts[2]);
  if (!lesson) return {view:'missing'};
  const step = LESSON_STEPS.includes(parts[3]) ? parts[3] : 'understand';
  return {view:'lesson', topic, lesson, step};
}
export function validateLearningProgress(value, subjectId='chemistry') {
  const subject=learningSubject(subjectId);
  if (!value || value.schema !== subject.schema || !value.records || typeof value.records !== 'object' || Array.isArray(value.records)) throw new Error(`這不是有效的${subject.title}學習紀錄；請切到對應學科再匯入。`);
  const records = {}, entries = Object.entries(value.records);
  if (entries.length > 1000) throw new Error('學習紀錄超過 1,000 個單元。');
  for (const [id, record] of entries) {
    if (!safeId(id) || !record || typeof record !== 'object' || Array.isArray(record)) throw new Error('學習紀錄格式無效。');
    if (record.answer !== undefined && (!Number.isInteger(record.answer) || record.answer < 0 || record.answer > 9)) throw new Error('自測答案格式無效。');
    if (record.note !== undefined && (typeof record.note !== 'string' || record.note.length > 10000)) throw new Error('單元筆記超過長度限制。');
    records[id] = {...(record.answer !== undefined ? {answer:record.answer} : {}), note:record.note || '', starred:record.starred === true, ...(record.practice !== undefined ? {practice:validatePractice(record.practice)} : {})};
  }
  const validPath=new RegExp(`^#${subject.root}/[a-z0-9-]+/[a-z0-9-]+/(understand|observe|check)$`);
  const lastPath = typeof value.lastPath === 'string' && validPath.test(value.lastPath) ? value.lastPath : '';
  const result={schema:subject.schema,lastPath,records};
  if(new TextEncoder().encode(JSON.stringify(result,null,2)).byteLength>MAX_LEARNING_IMPORT_BYTES)throw new Error('學習紀錄超過 32 MB；本次變更尚未寫入。');
  return result;
}
export function learningSummary(course, progress) {
  const lessons = allLessons(course);
  const subjectId=subjectForCourse(course).id;
  const state=lesson=>quizRecordState(subjectId,lesson,progress.records);
  const passed = lessons.filter(({lesson}) => {const q=state(lesson); return !q.blocked && q.record.answer !== undefined && q.record.answer === lesson.quiz?.answer;});
  const retry = lessons.filter(({lesson}) => {const q=state(lesson); return !q.blocked && q.record.answer !== undefined && q.record.answer !== lesson.quiz?.answer;});
  return {total:lessons.length, passed, retry};
}

const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const copy = value => JSON.parse(JSON.stringify(value));
const conflict = label => { throw new Error(`另一個視窗已修改${label}；本頁草稿仍保留，但尚未保存。請先複製或匯出本頁草稿，再重新載入比較。`); };
function reconcileField(base,local,latest,label) {
  if(same(local,base))return latest;
  if(same(latest,base)||same(local,latest))return local;
  return conflict(label);
}
function reconcilePractice(base,local,latest) {
  if(same(local,base))return latest;
  if(same(latest,base)||same(local,latest))return local;
  if(local===undefined||latest===undefined)return conflict('這題推理練習');
  const previous=base??emptyPractice();
  // Archiving starts a new attempt. Never blend an older attempt's fields into it.
  if(!same(local.history,previous.history)||!same(latest.history,previous.history))return conflict('這題的作答或重練紀錄');
  const result={};
  const labels={response:'原稿',revision:'修訂',transfer:'變化題',checked:'自評勾選',revealed:'對照狀態',transferStarted:'變化題展開狀態',transferRevealed:'變化題對照狀態',history:'重練紀錄'};
  for(const key of Object.keys(previous)){
    // Assessment/reveal metadata belongs to the prose it was made against.
    // Different prose snapshots must not inherit the other snapshot's checks.
    if(key==='checked'&&local.revision!==latest.revision)result[key]=[];
    else if(key==='revealed'&&local.response!==latest.response)result[key]=false;
    else if(key==='transferRevealed'&&local.transfer!==latest.transfer)result[key]=false;
    else result[key]=reconcileField(previous[key],local[key],latest[key],`這題的${labels[key]}`);
  }
  return result;
}
function reconcileRecord(base,local,latest) {
  if(same(local,base))return latest;
  if(same(latest,base)||same(local,latest))return local;
  if(local===undefined||latest===undefined)return conflict('這個單元的紀錄');
  const previous=base??{note:'',starred:false},result={};
  for(const key of ['note','starred','answer']){
    const value=reconcileField(previous[key],local[key],latest[key],{note:'單元筆記',starred:'收藏',answer:'自測答案'}[key]);
    if(value!==undefined)result[key]=value;
  }
  const practice=reconcilePractice(previous.practice,local.practice,latest.practice);
  if(practice!==undefined)result.practice=practice;
  return result;
}
function reconcileProgress(base,local,latest,subjectId) {
  const records={};
  for(const id of new Set([...Object.keys(base.records),...Object.keys(local.records),...Object.keys(latest.records)])){
    const record=reconcileRecord(base.records[id],local.records[id],latest.records[id]);
    if(record!==undefined)records[id]=record;
  }
  // Resume position is navigation metadata; an explicit local navigation wins.
  const lastPath=local.lastPath===base.lastPath?latest.lastPath:local.lastPath;
  return validateLearningProgress({...local,lastPath,records},subjectId);
}

export class LearningProgress {
  // Refresh + three-way merge protects against stale snapshots. localStorage
  // still has no atomic cross-process read/modify/write transaction; strict
  // simultaneous-writer protection needs a future asynchronous lock/queue API.
  constructor(storage,subjectId='chemistry') {
    this.subject=learningSubject(subjectId);
    this.storage = storage; this.error = ''; this.locked = false; this.raw = null;
    this.data = {schema:this.subject.schema, lastPath:'', records:{}};
    try {
      this.storage ??= globalThis.localStorage;
      this.raw = this.storage.getItem(this.subject.key);
      if (this.raw !== null) this.data = validateLearningProgress(JSON.parse(this.raw),this.subject.id);
    } catch (error) { this.error = '學習紀錄讀取失敗，原始資料已保留；本次操作暫存於記憶體。'; this.locked = true; }
    this.base=copy(this.data);this.pendingIntents=new Map();
  }
  readLatest() {
    if(this.locked)return null;
    try {
      const raw=this.storage.getItem(this.subject.key);
      // Keep the unreadable bytes available for the existing raw export action.
      this.raw=raw;
      return raw===null?{schema:this.subject.schema,lastPath:'',records:{}}:validateLearningProgress(JSON.parse(raw),this.subject.id);
    } catch {
      this.locked=true;this.error='學習紀錄讀取失敗，已停止寫入；本頁草稿仍保留。請先匯出草稿與原始資料，再重新載入。';return null;
    }
  }
  refresh() {
    const latest=this.readLatest();if(latest===null)return false;
    try {
      this.checkIntents(latest);
      const next=reconcileProgress(this.base,this.data,latest,this.subject.id);
      this.base=copy(latest);this.data=next;if(same(next,latest)){this.error='';this.pendingIntents.clear();}return true;
    } catch(error) {this.error=error.message;return false;}
  }
  checkIntents(latest) {
    // Explicit deletions remain edits even when the value returns to its base.
    // Keep that intent through failed saves, navigation, imports and exports.
    for(const {id,key,practice} of this.pendingIntents.values()){
      const record=value=>value.records[id]??{note:'',starred:false};
      const field=value=>practice?(record(value).practice??emptyPractice())[key]:record(value)[key];
      if(!same(field(this.base),field(latest))&&!same(field(this.data),field(latest))){
        const label=practice?`這題的${{response:'原稿',revision:'修訂',transfer:'變化題'}[key]}`:{note:'單元筆記',starred:'收藏',answer:'自測答案'}[key];
        conflict(label);
      }
    }
  }
  save() {
    if (this.locked) return false;
    const latest=this.readLatest();if(latest===null)return false;
    let next;
    try {
      // The new question's key is reserved only after this instance creates it.
      // Check the same latest snapshot that the merge will use; an unknown key
      // inserted after UI refresh must not be absorbed as our marker record.
      for(const identity of RESERVED_QUIZZES.filter(item=>item.subject===this.subject.id)) {
        const key=identity.key;
        if((this.pendingIntents.has(`${key}:answer`) || this.pendingIntents.has(`${key}:note`)) && Object.hasOwn(latest.records,key)) {
          const state=revisedRecordState(identity,latest.records);
          if(!Object.hasOwn(this.base.records,key) || state.blocked) {
            const error=new Error('題目記錄位置已被既有資料使用；未覆寫，請先匯出紀錄。');
            error.code='WATER_QUIZ_OCCUPIED';throw error;
          }
        }
      }
      this.checkIntents(latest);
      next=reconcileProgress(this.base,this.data,latest,this.subject.id);
    }
    catch(error){this.error=error.message;throw error;}
    // Keep the editing snapshot aligned with the still-visible DOM. Remote
    // fields are committed, but only become this window's baseline at refresh.
    // Otherwise typing in an old field after saving a different field could
    // silently overwrite a remote value the user has never seen.
    try { this.storage.setItem(this.subject.key, JSON.stringify(next)); this.base=copy(this.data);this.pendingIntents.clear();this.error = ''; return true; }
    catch { this.error = '瀏覽器無法保存；請匯出學習紀錄。'; return false; }
  }
  visit(path) {
    if(typeof path!=='string'||!new RegExp(`^#${this.subject.root}/[a-z0-9-]+/[a-z0-9-]+/(understand|observe|check)$`).test(path))throw new Error('學習位置不屬於目前學科。');
    this.refresh();this.data.lastPath = path;
    try {return this.save();}catch{return false;}
  }
  record(id, change, {retainOnFailure=true,practiceFields=[]}={}) {
    const previous=this.data,previousIntents=new Map(this.pendingIntents);
    const next = validateLearningProgress({...this.data, records:{...this.data.records, [id]:{...this.data.records[id], ...change}}},this.subject.id);
    for(const key of Object.keys(change).filter(key=>['note','starred','answer'].includes(key)))this.pendingIntents.set(`${id}:${key}`,{id,key,practice:false});
    for(const key of practiceFields.filter(key=>['response','revision','transfer'].includes(key)&&Object.hasOwn(change.practice??{},key)))this.pendingIntents.set(`${id}:practice.${key}`,{id,key,practice:true});
    this.data = next;
    try {
      const saved=this.save();
      if(!saved&&!retainOnFailure){this.data=previous;this.pendingIntents=previousIntents;}
      return saved;
    } catch(error) {if(!retainOnFailure||error.code==='WATER_QUIZ_OCCUPIED'){this.data=previous;this.pendingIntents=previousIntents;}throw error;}
  }
  merge(value) {
    const incoming = validateLearningProgress(value,this.subject.id);
    if(this.locked)throw new Error('原始學習紀錄讀取失敗，已停止寫入；請先匯出原始資料。');
    const latest=this.readLatest();if(latest===null)throw new Error(this.error);
    let current;
    try {this.checkIntents(latest);current=reconcileProgress(this.base,this.data,latest,this.subject.id);}
    catch(error){this.error=error.message;throw error;}
    // Import cannot represent two unrelated records under this one reserved
    // question key. Reject before writing instead of silently mixing the data.
    for(const identity of RESERVED_QUIZZES.filter(item=>item.subject===this.subject.id)) {
      const key=identity.key;
      if(Object.hasOwn(current.records,key) && Object.hasOwn(incoming.records,key)) {
        const currentQuiz=revisedRecordState(identity,current.records);
        const incomingQuiz=revisedRecordState(identity,incoming.records);
        if(currentQuiz.blocked || incomingQuiz.blocked) {
          this.error='匯入檔與現有資料佔用相同的題目記錄位置；本次未合併，現有紀錄與匯入檔均保留。';
          throw new Error(this.error);
        }
      }
    }
    const records={...incoming.records,...current.records};
    // Existing prose and answers win; a newly introduced practice can still be imported.
    for(const [id,local] of Object.entries(current.records)) {
      if(local.practice === undefined && incoming.records[id]?.practice !== undefined) records[id]={...local,practice:incoming.records[id].practice};
    }
    const next = validateLearningProgress({...current, lastPath:current.lastPath || incoming.lastPath, records},this.subject.id);
    this.storage.setItem(this.subject.key, JSON.stringify(next)); this.data = next;this.base=copy(next);this.pendingIntents.clear(); this.error = '';
  }
}
