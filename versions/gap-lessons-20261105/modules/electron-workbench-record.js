import {inspectElectronState,ELECTRON_WORKBENCH_LIMITS} from './electron-workbench-model.js';

export const ELECTRON_RECORD_MAX_BYTES=256*1024;
export const ELECTRON_RECORD_MAX_ATTEMPTS=100;
export const ELECTRON_RECORD_FORMAT='electron-workbench/v1';
export const ELECTRON_RECORD_FORMAT_V2='electron-workbench/v2';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=message=>{throw new Error(message);};
function activity(value){if(typeof value!=='string'||!/^[a-z][a-z0-9-]{0,99}$/.test(value))fail('活動識別碼無效。');return value;}
function recordVersion(options){
  if(!isObject(options))fail('紀錄版本選項必須是物件。');
  const version=options.version===undefined?1:options.version;
  if(version!==1&&version!==2)fail('只支援電子工作台紀錄版本 1 或 2。');
  return version;
}
const recordFormat=version=>version===1?ELECTRON_RECORD_FORMAT:ELECTRON_RECORD_FORMAT_V2;

/** In-memory draft only; this module never reads or writes browser storage. */
export function emptyElectronRecord(activityId,options={}){
  return {format:recordFormat(recordVersion(options)),activityId:activity(activityId),step:0,arrows:[],assisted:false,attempts:[],drafts:[]};
}

// Complete ISO date-time, with an explicit zone and at most millisecond
// precision. Reject impossible dates rather than Date.parse's normalization.
function validTime(value){
  if(typeof value!=='string')return false;
  const m=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/);
  if(!m)return false;
  const [year,month,day,hour,minute,second]=m.slice(1,7).map(Number),leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)return false;
  if(m[8]!=='Z'&&(Number(m[8].slice(1,3))>23||Number(m[8].slice(4))>59))return false;
  return Number.isFinite(Date.parse(value));
}

/** Strict whitelist for a single activity. Wrong answers are valid records:
 * endpoint existence is checked, not electron budgets, duplicates or success.
 * The current step/arrows/assisted are authoritative; an older draft for that
 * same step is preserved as data and never substituted for the current fields.
 * Calculated candidates, coordinates and caller-supplied correctness flags
 * are discarded. Recalculate outcomes using the current model after loading.
 * The default v1 contract stays atom-target-only with six arrows. Opt-in v2
 * also accepts explicit target bonds between two existing distinct atoms,
 * including a bond not present yet, and up to eight arrows. A v1 input is
 * validated under v1 limits BEFORE migrating its format to requested v2.
 * Migration never guesses or rewrites a saved (possibly wrong) arrow.
 */
export function validateElectronRecord(value,activityId,mechanism,options={}){
  activity(activityId);
  const version=recordVersion(options);
  let raw;
  try{raw=JSON.stringify(value);}catch{fail('紀錄必須能序列化成 JSON；不接受循環或不支援的值。');}
  if(typeof raw!=='string')fail('紀錄不是有效的 JSON 物件。');
  if(new TextEncoder().encode(raw).length>ELECTRON_RECORD_MAX_BYTES)fail('紀錄超過 256 KiB，未截斷或還原。');
  if(!isObject(value)||value.format!==ELECTRON_RECORD_FORMAT&&(version!==2||value.format!==ELECTRON_RECORD_FORMAT_V2))fail(`這不是有效的電子工作台 v${version} 紀錄。`);
  const inputVersion=value.format===ELECTRON_RECORD_FORMAT?1:2,maxArrows=inputVersion===1?6:ELECTRON_WORKBENCH_LIMITS.maxArrows;
  if(value.activityId!==activityId)fail('紀錄屬於另一個活動，不能套用到目前的反應。');
  if(!isObject(mechanism)||!Array.isArray(mechanism.steps)||mechanism.steps.length<1||!Array.isArray(mechanism.states)||mechanism.states.length!==mechanism.steps.length+1)fail('目前反應缺少完整步驟與結構，無法核對紀錄。');
  const length=mechanism.steps.length,cache=new Map();
  function graph(step){
    if(!Number.isInteger(step)||step<0||step>=length)fail('紀錄的步驟超出目前反應範圍。');
    if(!cache.has(step)){
      const state=mechanism.states[step];
      if(!inspectElectronState(state).ok)fail('目前步驟的原子或電子圖無法驗證，不能還原紀錄。');
      cache.set(step,{atoms:new Set(state.atoms.map(a=>a.id)),bonds:new Set(state.bonds.map(b=>[b.a,b.b].sort().join('-')))});
    }
    return cache.get(step);
  }
  function selection(entry){
    if(!isObject(entry))fail('作答或草稿必須是物件。');
    const g=graph(entry.step);
    if(typeof entry.assisted!=='boolean')fail('「看過參考」必須是布林值。');
    if(!Array.isArray(entry.arrows)||entry.arrows.length>maxArrows)fail(`每份草稿只能包含 0 至 ${maxArrows} 支箭頭。`);
    const arrows=Array.from(entry.arrows,a=>{
      if(!Array.isArray(a)||a.length!==2||typeof a[0]!=='string'||typeof a[1]!=='string')fail('紀錄中每支箭頭必須是兩個位點字串。');
      const parts=a[0].split('-');
      const sourceExists=g.atoms.has(a[0])||parts.length===2&&parts[0]!==parts[1]&&g.bonds.has(parts.sort().join('-'));
      const targetParts=a[1].split('-');
      const targetExists=g.atoms.has(a[1])||inputVersion===2&&targetParts.length===2&&targetParts[0]!==targetParts[1]&&targetParts.every(id=>g.atoms.has(id));
      if(!sourceExists||!targetExists)fail(inputVersion===1?'紀錄的箭頭不屬於該步初始結構中的來源原子／鍵及目的原子。':'紀錄的箭頭不屬於該步初始結構中的來源原子／鍵及有效目的原子／明示鍵。');
      return [a[0],a[1]];
    });
    return {step:entry.step,arrows,assisted:entry.assisted};
  }
  const current=selection(value);
  if(!Array.isArray(value.attempts)||value.attempts.length>ELECTRON_RECORD_MAX_ATTEMPTS)fail('檢查歷史必須是最多 100 筆的陣列，不能截斷還原。');
  const attempts=Array.from(value.attempts,entry=>{
    const selected=selection(entry);
    if(!validTime(entry.at))fail('檢查時間必須是有效的 ISO 日期時間，含明確時區。');
    return {...selected,at:entry.at};
  });
  const draftsValue=value.drafts===undefined?[]:value.drafts;
  if(!Array.isArray(draftsValue)||draftsValue.length>length)fail('逐步草稿數量不能超過反應步數。');
  const seen=new Set(),drafts=Array.from(draftsValue,entry=>{
    const selected=selection(entry);
    if(seen.has(selected.step))fail('同一步只能保存一份逐步草稿。');seen.add(selected.step);return selected;
  });
  return {format:recordFormat(version),activityId,...current,attempts,drafts};
}
