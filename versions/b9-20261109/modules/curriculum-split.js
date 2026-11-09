// 課程目錄＋分主題檔：首頁與目錄頁只抓每科一個目錄檔（主題與課名），
// 各主題的完整課文、練習、來源在進入主題或課程時才抓。
// 整包檔 data/*-curriculum.json 仍是唯一內容來源；scripts/build-curriculum-split.mjs 由它產生：
//   data/<name>-curriculum.index.json      目錄：原檔去掉課文；每課只留 INDEX_LESSON_FIELDS（版本核對的題目另保留 quiz）
//   data/lessons/<dir>/<topicId>.json      主題：該主題全部課文＋這些課引用的來源
// assembleCurriculum(目錄, 主題檔) 必須與整包檔 deepEqual（tests/curriculum-split.test.mjs）。
import {REVISED_QUIZ_LESSONS} from './learning-model.js';

export const INDEX_FORMAT='curriculum-index/v1';
export const TOPIC_FORMAT='curriculum-topic/v1';
/** 目錄裡每課保留的欄位：路由與標題（id、title）、歷屆對應（examRefs）、工作台入口（activity）。 */
export const INDEX_LESSON_FIELDS=Object.freeze(['id','title','examRefs','activity']);
/** 目錄頁「內容範圍與課綱依據」直接列出的來源（learning.js map()）；這些留在目錄檔。 */
export const INDEX_SOURCE_PATTERN=/syll|course|curricul|ntou|tamu|ljubl|課綱/i;

const safeId=value=>typeof value==='string'&&/^[a-z0-9-]{1,100}$/.test(value);
const LOADED=Symbol.for('curriculum-split/loaded');

export function indexFileName(file){
  if(typeof file!=='string'||!/^[a-z0-9-]+-curriculum\.json$/.test(file))throw new RangeError('Unknown curriculum file');
  return file.replace(/\.json$/,'.index.json');
}
export function lessonsDirName(file){
  if(typeof file!=='string'||!/^[a-z0-9-]+-curriculum\.json$/.test(file))throw new RangeError('Unknown curriculum file');
  return file.replace(/-curriculum\.json$/,'');
}
export function topicFileName(file,topicId){
  if(!safeId(topicId))throw new RangeError('Unknown topic id');
  return `lessons/${lessonsDirName(file)}/${topicId}.json`;
}

/** 哪些課的 quiz 要留在目錄：learning-model 以題目簽章核對版本的課（答題紀錄要在首頁／路徑頁正確計入）。 */
export function indexQuizLessons(subjectId){
  return REVISED_QUIZ_LESSONS.filter(item=>item.subject===subjectId).map(item=>item.lesson);
}

function indexLesson(lesson,keepQuiz){
  const stub={};
  for(const key of INDEX_LESSON_FIELDS)if(Object.hasOwn(lesson,key))stub[key]=lesson[key];
  if(keepQuiz&&Object.hasOwn(lesson,'quiz'))stub.quiz=lesson.quiz;
  return stub;
}

/** 由整包課程產生目錄與每主題檔。純函式，不改動輸入。 */
export function splitCurriculum(course,{quizLessons=[]}={}){
  if(!course||!Array.isArray(course.topics)||!Array.isArray(course.sources))throw new TypeError('Curriculum must have topics and sources arrays');
  const sourceById=new Map();
  for(const source of course.sources){
    if(!source||typeof source.id!=='string')throw new TypeError('Every source needs a string id');
    if(sourceById.has(source.id))throw new TypeError(`Duplicate source id ${source.id}`);
    sourceById.set(source.id,source);
  }
  const referenced=new Set();
  const topics=course.topics.map(topic=>{
    if(!safeId(topic?.id)||!Array.isArray(topic.lessons))throw new TypeError('Every topic needs a safe id and lessons');
    const ids=new Set();
    for(const lesson of topic.lessons){
      if(!safeId(lesson?.id))throw new TypeError(`Topic ${topic.id} has a lesson without a safe id`);
      for(const id of lesson.sourceIds||[]){
        if(!sourceById.has(id))throw new TypeError(`${lesson.id}: unknown source ${id}`);
        ids.add(id);referenced.add(id);
      }
    }
    const sources=course.sources.filter(source=>ids.has(source.id));
    return {id:topic.id,file:{format:TOPIC_FORMAT,topic:topic.id,lessons:topic.lessons,sources}};
  });
  const index={};
  for(const [key,value] of Object.entries(course)){
    if(key==='topics')index.topics=course.topics.map(topic=>({...topic,lessons:topic.lessons.map(lesson=>indexLesson(lesson,quizLessons.includes(lesson.id)))}));
    else if(key==='sources')index.sources=course.sources.filter(source=>INDEX_SOURCE_PATTERN.test(String(source.id)+String(source.title??''))||!referenced.has(source.id));
    else index[key]=value;
  }
  index.format=INDEX_FORMAT;
  index.sourceIds=course.sources.map(source=>source.id);
  return {index,topics};
}

/** 把目錄與主題檔組回整包課程（純函式）；測試用它核對與原檔 deepEqual。 */
export function assembleCurriculum(index,topicFiles){
  const files=new Map();
  for(const entry of topicFiles instanceof Map?topicFiles.values():Array.isArray(topicFiles)?topicFiles:Object.values(topicFiles||{})){
    const file=entry&&entry.file&&entry.file.lessons?entry.file:entry;
    if(!file||typeof file.topic!=='string'||!Array.isArray(file.lessons))throw new TypeError('Invalid topic file');
    files.set(file.topic,file);
  }
  const sources=new Map((index.sources||[]).map(source=>[source.id,source]));
  const course={};
  for(const [key,value] of Object.entries(index)){
    if(key==='format'||key==='sourceIds')continue;
    if(key==='topics')course.topics=value.map(topic=>{
      const file=files.get(topic.id);
      if(!file)throw new TypeError(`Missing topic file ${topic.id}`);
      for(const source of file.sources||[])sources.set(source.id,source);
      return {...topic,lessons:file.lessons};
    });
    else if(key==='sources')course.sources=null;
    else course[key]=value;
  }
  course.sources=(index.sourceIds||[]).map(id=>{
    if(!sources.has(id))throw new TypeError(`Missing source ${id}`);
    return sources.get(id);
  });
  return course;
}

/** 目錄檔變成應用程式用的課程物件：主題先標記為未載入（不可列舉，JSON 與 deepEqual 都看不到）。 */
export function courseFromIndex(index){
  if(!index||index.format!==INDEX_FORMAT||!Array.isArray(index.topics)||!Array.isArray(index.sources)||!Array.isArray(index.sourceIds))throw new TypeError('課程目錄格式無效');
  const course={};
  for(const [key,value] of Object.entries(index))if(key!=='format'&&key!=='sourceIds')course[key]=value;
  for(const topic of course.topics)Object.defineProperty(topic,LOADED,{value:false,writable:true,enumerable:false,configurable:true});
  return course;
}
/** 整包課程（測試、舊資料）沒有標記，視為已載入。 */
export function topicLoaded(topic){return !topic||topic[LOADED]!==false;}
export function courseLoaded(course){return (course?.topics||[]).every(topicLoaded);}
export function unloadedTopicIds(course,topicIds=null){
  return (course?.topics||[]).filter(topic=>!topicLoaded(topic)&&(topicIds===null||topicIds.includes(topic.id))).map(topic=>topic.id);
}

/** 把主題檔內容寫進既有課程：陣列原地替換，保留 topic 與 topic.lessons 的物件身分；來源依 id 補進 course.sources。 */
export function applyTopicFile(course,topicId,file){
  const topic=(course?.topics||[]).find(item=>item.id===topicId);
  if(!topic)throw new TypeError(`Unknown topic ${topicId}`);
  if(!file||file.format!==TOPIC_FORMAT||file.topic!==topicId||!Array.isArray(file.lessons)||!file.lessons.length||!Array.isArray(file.sources))throw new TypeError('主題課文格式無效');
  const stubIds=topic.lessons.map(lesson=>lesson.id).join('\n'),fullIds=file.lessons.map(lesson=>lesson?.id).join('\n');
  if(stubIds!==fullIds)throw new TypeError('主題課文與目錄不一致');
  if(topicLoaded(topic))return topic;
  topic.lessons.splice(0,topic.lessons.length,...file.lessons);
  const known=new Set(course.sources.map(source=>source.id));
  for(const source of file.sources)if(!known.has(source.id)){course.sources.push(source);known.add(source.id);}
  topic[LOADED]=true;
  return topic;
}

/** 依路由找出需要先載入的主題：課程與主題頁要該主題；複習頁要整科；有關鍵字的目錄頁要搜尋範圍內的全部學科。 */
export function requiredTopics(hash,subject,courses,{scopeFor=()=>'all'}={}){
  const [path,query='']=String(hash||'').replace(/^#/,'').split('?'),parts=path.split('/');
  const course=courses?.[subject?.id];
  if(!course||parts[0]!==subject.root||!parts[1])return [];
  if(parts[1]==='review')return [{subjectId:subject.id,topicIds:course.topics.map(topic=>topic.id)}];
  if(parts[1]==='map'){
    const params=new URLSearchParams(query),q=(params.get('q')||'').slice(0,120);
    if(!q.trim())return [];
    const scope=scopeFor(params.get('scope'));
    return Object.entries(courses).filter(([id,value])=>value&&(scope==='all'||id===scope)).map(([id,value])=>({subjectId:id,topicIds:value.topics.map(topic=>topic.id)}));
  }
  const topic=course.topics.find(item=>item.id===parts[1]);
  return topic?[{subjectId:subject.id,topicIds:[topic.id]}]:[];
}

/** 抓主題檔並寫進課程；同一主題同時只抓一次，失敗後可重試。 */
export class CurriculumLoader {
  constructor({fetch:fetchImpl=globalThis.fetch?.bind(globalThis),base='./data/',files={}}={}){
    this.fetch=fetchImpl;this.base=base;this.files=files;this.pending=new Map();
  }
  fileFor(subjectId){const file=this.files[subjectId];if(!file)throw new RangeError(`Unknown subject ${subjectId}`);return file;}
  /** @returns {Promise<void>} 解析後 topicIds 全部已載入 */
  ensureTopics(course,subjectId,topicIds){
    const missing=unloadedTopicIds(course,topicIds);
    if(!missing.length)return Promise.resolve();
    return Promise.all(missing.map(topicId=>this.loadTopic(course,subjectId,topicId))).then(()=>{});
  }
  ensureCourse(course,subjectId){return this.ensureTopics(course,subjectId,course.topics.map(topic=>topic.id));}
  /** requiredTopics() 的結果一次載完。 */
  ensure(requirements,courses){
    return Promise.all(requirements.map(({subjectId,topicIds})=>courses[subjectId]?this.ensureTopics(courses[subjectId],subjectId,topicIds):Promise.resolve())).then(()=>{});
  }
  loadTopic(course,subjectId,topicId){
    const key=subjectId+'/'+topicId;
    if(this.pending.has(key))return this.pending.get(key);
    const url=this.base+topicFileName(this.fileFor(subjectId),topicId);
    // fetch 同步發出：請求順序可觀察（驗收腳本依請求順序判斷），同步丟出的錯誤也走 reject。
    let response;try{response=Promise.resolve(this.fetch(url));}catch(error){response=Promise.reject(error);}
    const promise=response.then(result=>{if(!result.ok)throw new Error('課程內容暫時無法載入');return result.json();}).then(file=>{applyTopicFile(course,topicId,file);}).finally(()=>{this.pending.delete(key);});
    this.pending.set(key,promise);
    return promise;
  }
}
