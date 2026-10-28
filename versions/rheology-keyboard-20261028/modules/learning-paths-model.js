import {LEARNING_PATHS} from './learning-paths-data.js';
import {LEARNING_SUBJECTS} from './learning-subjects.js';
import {quizRecordState} from './learning-model.js';

export {LEARNING_PATHS};
export const PATH_POSITIONS_KEY='food-science-path-positions-v1';
export const PATH_POSITIONS_SCHEMA='food-science-path-positions/v1';

const safeId=value=>typeof value==='string'&&value.length<=100&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const canonicalPattern=/^#(learn|process|micro)\/([a-z0-9-]{1,100})\/([a-z0-9-]{1,100})\/(understand|observe|check)$/;
const pathById=id=>safeId(id)?LEARNING_PATHS.find(path=>path.id===id):undefined;
const subjectMeta=id=>Object.hasOwn(LEARNING_SUBJECTS,id)?LEARNING_SUBJECTS[id]:null;

function canonicalParts(value){
  if(typeof value!=='string')return null;
  const match=value.match(canonicalPattern);
  if(!match||!safeId(match[2])||!safeId(match[3]))return null;
  const subject=Object.values(LEARNING_SUBJECTS).find(entry=>entry.root===match[1]);
  return {subject:subject.id,topicId:match[2],lessonId:match[3],step:match[4]};
}

function lessonEntry(subject,id,courses){
  const meta=subjectMeta(subject),course=courses?.[subject];
  if(!meta||!safeId(id)||!Array.isArray(course?.topics)||(course.routeRoot!==undefined&&course.routeRoot!==meta.root))return null;
  const matches=course.topics.flatMap(topic=>safeId(topic?.id)&&Array.isArray(topic.lessons)?topic.lessons.filter(lesson=>lesson?.id===id).map(lesson=>({topic,lesson})):[]);
  // A missing or ambiguous identity never resolves to an arbitrary lesson.
  return matches.length===1?matches[0]:null;
}

/** Preserve manifest order and unavailable stations; topic/lesson are the
 * original curriculum objects rather than copies or substituted lessons. */
export function resolvePathStations(path,courses={}){
  if(!Array.isArray(path?.stations))return [];
  return path.stations.map(station=>{
    const entry=lessonEntry(station?.subject,station?.lessonId,courses);
    return {...station,subject:station?.subject,subjectMeta:subjectMeta(station?.subject),
      topic:entry?.topic??null,lesson:entry?.lesson??null,available:entry!==null};
  });
}

function membership(canonical,pathId,courses){
  const parts=canonicalParts(canonical),path=pathById(pathId);
  if(!parts||!path)return null;
  const matches=resolvePathStations(path,courses).map((station,index)=>({station,index})).filter(({station})=>station.available&&station.subject===parts.subject&&station.topic.id===parts.topicId&&station.lesson.id===parts.lessonId);
  // A repeated lesson in one path would make the URL's station ambiguous.
  return matches.length===1?{path,...matches[0],canonical,decorated:`${canonical}?path=${encodeURIComponent(path.id)}`}:null;
}

/** Route query is context, never part of the subject's canonical resume URL.
 * Only one well-formed path parameter is accepted. Unknown query fields and
 * duplicate/encoded duplicate keys cannot smuggle a second interpretation. */
export function pathContext(hash,courses={}){
  if(typeof hash!=='string'||hash.length>2048)return null;
  const delimiter=hash.indexOf('?');
  if(delimiter<0||hash.indexOf('?',delimiter+1)!==-1)return null;
  const canonical=hash.slice(0,delimiter),query=hash.slice(delimiter+1);
  if(/%(?![0-9a-f]{2})/i.test(query))return null;
  const params=new URLSearchParams(query),keys=[...params.keys()];
  if(keys.length!==1||keys[0]!=='path')return null;
  return membership(canonical,params.get('path'),courses);
}

export function decoratePath(canonical,pathId,courses={}){
  return membership(canonical,pathId,courses)?.decorated??canonical;
}

/** Syntactically valid unknown IDs stay explicit so the UI can show missing. */
export function resolvePathView(hash){
  if(hash==='#paths')return {view:'paths'};
  if(hash==='#paths/fermentation-evidence-chain?focus=integration')return {view:'path',id:'fermentation-evidence-chain'};
  if(typeof hash!=='string')return null;
  const match=hash.match(/^#paths\/([^/?#]+)$/);
  return match&&safeId(match[1])?{view:'path',id:match[1]}:null;
}

const ownProse=attempt=>object(attempt)&&['response','revision','transfer'].some(key=>typeof attempt[key]==='string'&&attempt[key].trim().length>0);
/** "Has answered" is evidence of an answer, never correctness or mastery.
 * Archived attempts count, but revealing a sample or checking a rubric does not. */
export function pathAnswerStatus(station,progresses={}){
  if(!station?.available||!station.lesson||!subjectMeta(station.subject))return false;
  const progress=progresses?.[station.subject],records=progress?.data?.records??progress?.records;
  if(!object(records))return false;
  const quiz=quizRecordState(station.subject,station.lesson,records);
  const record=records[station.lesson.id];
  if(quiz.special)return Number.isInteger(quiz.record.answer)||ownProse(record?.practice)||(Array.isArray(record?.practice?.history)&&record.practice.history.some(ownProse));
  if(!object(record))return false;
  return Number.isInteger(quiz.record.answer)||ownProse(record.practice)||(Array.isArray(record.practice?.history)&&record.practice.history.some(ownProse));
}

function positionData(value){
  if(!object(value)||Object.keys(value).length!==2||value.schema!==PATH_POSITIONS_SCHEMA||!Object.hasOwn(value,'positions')||!object(value.positions))throw new TypeError('Invalid path positions');
  const entries=Object.entries(value.positions);
  if(entries.length>50||entries.some(([id,canonical])=>!safeId(id)||!canonicalParts(canonical)))throw new TypeError('Invalid path position');
  // Unknown but well-formed future path IDs survive unrelated writes. Actual
  // course availability and membership are checked when a position is used.
  return {schema:PATH_POSITIONS_SCHEMA,positions:Object.fromEntries(entries)};
}

/** Navigation positions only: no answers, notes, stars or subject schemas.
 * A failed save remains in memory; the next valid write merges fresh storage.
 * Unreadable JSON/schema is kept byte-for-byte and locks this instance's writes. */
export class PathPositions {
  constructor(storage){
    this.storage=storage;this.data={schema:PATH_POSITIONS_SCHEMA,positions:{}};
    this.pending=new Map();this.error='';this.raw=null;this.locked=false;
    if(this.storage===undefined){try{this.storage=globalThis.localStorage;}catch{this.error='路線位置無法讀取；暫存於本頁。';}}
    const latest=this.readLatest();if(latest)this.data=latest;
  }
  readLatest(){
    if(this.locked)return null;
    let raw;
    try{raw=this.storage.getItem(PATH_POSITIONS_KEY);}
    catch{this.error='路線位置無法讀取；暫存於本頁。';return null;}
    this.raw=raw;
    try{
      if(raw!==null&&(typeof raw!=='string'||raw.length>32768))throw new TypeError('Oversized path positions');
      return raw===null?{schema:PATH_POSITIONS_SCHEMA,positions:{}}:positionData(JSON.parse(raw));
    }catch{this.locked=true;this.error='路線位置格式無法讀取；原始資料已保留。';return null;}
  }
  get(pathId,courses={}){
    if(!pathById(pathId))return null;
    const latest=this.readLatest();
    if(latest){this.data={...latest,positions:{...latest.positions,...Object.fromEntries(this.pending)}};if(!this.pending.size)this.error='';}
    const canonical=Object.hasOwn(this.data.positions,pathId)?this.data.positions[pathId]:null;
    return membership(canonical,pathId,courses)?.canonical??null;
  }
  visit(pathId,canonical,courses={}){
    if(!membership(canonical,pathId,courses)){this.error='這個位置不屬於指定路線。';return false;}
    const latest=this.readLatest();
    this.pending.set(pathId,canonical);
    this.data={schema:PATH_POSITIONS_SCHEMA,positions:{...(latest?.positions??this.data.positions),...Object.fromEntries(this.pending)}};
    if(!latest)return false;
    let raw;
    try{
      const next=positionData(this.data);raw=JSON.stringify(next);
      if(raw.length>32768)throw new TypeError('Oversized path positions');
      this.storage.setItem(PATH_POSITIONS_KEY,raw);
      this.data=next;this.raw=raw;this.pending.clear();this.error='';return true;
    }catch{this.error='路線位置尚未保存；暫存於本頁。';return false;}
  }
}
