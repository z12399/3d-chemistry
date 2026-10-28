import {validatePractice,emptyPractice} from './practice-model.js';
import {learningSubject,subjectForCourse,LEARNING_SUBJECTS} from './learning-subjects.js';
export const LEARNING_KEY = 'food-chemistry-learning-v1';
export const LEARNING_SCHEMA = 'food-chemistry-learning/v1';
export const MAX_LEARNING_IMPORT_BYTES = 32 * 1024 * 1024;
export const LESSON_STEPS = ['understand', 'observe', 'check'];
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
  const passed = lessons.filter(({lesson}) => progress.records[lesson.id]?.answer === lesson.quiz.answer);
  const retry = lessons.filter(({lesson}) => progress.records[lesson.id]?.answer !== undefined && progress.records[lesson.id].answer !== lesson.quiz.answer);
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
    } catch(error) {if(!retainOnFailure){this.data=previous;this.pendingIntents=previousIntents;}throw error;}
  }
  merge(value) {
    const incoming = validateLearningProgress(value,this.subject.id);
    if(this.locked)throw new Error('原始學習紀錄讀取失敗，已停止寫入；請先匯出原始資料。');
    const latest=this.readLatest();if(latest===null)throw new Error(this.error);
    let current;
    try {this.checkIntents(latest);current=reconcileProgress(this.base,this.data,latest,this.subject.id);}
    catch(error){this.error=error.message;throw error;}
    const records={...incoming.records,...current.records};
    // Existing prose and answers win; a newly introduced practice can still be imported.
    for(const [id,local] of Object.entries(current.records)) {
      if(local.practice === undefined && incoming.records[id]?.practice !== undefined) records[id]={...local,practice:incoming.records[id].practice};
    }
    const next = validateLearningProgress({...current, lastPath:current.lastPath || incoming.lastPath, records},this.subject.id);
    this.storage.setItem(this.subject.key, JSON.stringify(next)); this.data = next;this.base=copy(next);this.pendingIntents.clear(); this.error = '';
  }
}
