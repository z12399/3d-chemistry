import {THERMAL_EVIDENCE_REMEDIATION,THERMAL_EVIDENCE_STAGES} from './thermal-evidence-model.js';
import {pathContext} from './learning-paths-model.js';
const pendingByOwner=new WeakMap();
const sourcePath='#paths/thermal-evidence-chain',sourceLesson='#micro/micro-cases/micro-process-validation/check';
const definitions={
 fourier:{subject:'processing',target:'explanation',index:1,expectedQuote:'Fo 是已經過時間相對於熱擴散時間尺度的無因次比'},
 d:{subject:'microbiology',target:'explanation',index:0,expectedQuote:'固定溫度且存活曲線可用對數直線近似'},
 z:{subject:'microbiology',target:'equation',index:null,expectedQuote:'log₁₀[D(T)/Dref] = −(T−Tref)/z'},
 history:{subject:'processing',target:'equation',index:null,expectedQuote:'Fref = ∫ 10^[(T(t) − Tref)/z] dt'},
 position:{subject:'processing',target:'equation',index:null,expectedQuote:'食品溫度 T(x,t)'},
 sampling:{subject:'microbiology',target:'explanation',index:0,expectedQuote:'若各單位獨立、污染機率皆為給定的 p'}
};
export const THERMAL_RETURN_REMEDIES=Object.freeze(THERMAL_EVIDENCE_REMEDIATION.map(r=>Object.freeze({...r,...definitions[r.id]})));
const byId=new Map(THERMAL_RETURN_REMEDIES.map(r=>[r.id,r]));
const object=x=>x!==null&&['object','function'].includes(typeof x);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function entry(courses,subject,href){
 const root=subject==='microbiology'?'micro':subject==='processing'?'process':null,course=courses?.[subject];
 if(!root||course?.routeRoot!==root||!Array.isArray(course.topics))return null;
 const parts=href.match(/^#(micro|process)\/([a-z0-9-]+)\/([a-z0-9-]+)\/(understand|check)$/);if(!parts||parts[1]!==root)return null;
 const matches=course.topics.flatMap(t=>Array.isArray(t?.lessons)?t.lessons.filter(l=>l?.id===parts[3]).map(lesson=>({topic:t,lesson})):[]);
 return matches.length===1&&matches[0].topic.id===parts[2]?matches[0]:null;
}
function sourceAvailable(href,courses){
 if(!entry(courses,'microbiology',sourceLesson))return false;
 if(href===sourcePath||href===sourceLesson)return true;
 if(typeof href!=='string'||!href.startsWith(sourceLesson+'?'))return false;
 const c=pathContext(href,courses);return !!c&&href===c.decorated&&c.canonical===sourceLesson;
}
function targetAvailable(remedy,courses){
 const e=entry(courses,remedy.subject,remedy.href),text=remedy.target==='equation'?e?.lesson.equation?.text:e?.lesson.explanation?.[remedy.index];
 return typeof text==='string'&&text.includes(remedy.expectedQuote);
}
function valid(ticket,courses){try{return ticket.isCurrentContext()===true&&sourceAvailable(ticket.sourceHref,courses)&&targetAvailable(ticket.remedy,courses);}catch{return false;}}
/** A same-window return capability, issued only by a live thermal anchor click.
 * It never stores answers, restores a draft, writes notes or changes a route query. */
export function beginThermalRemedyReturn(owner,{sourceHref,remedyId,isCurrentContext,stageId,caseId,courses}={}){
 if(!object(owner)||typeof isCurrentContext!=='function'||!sourceAvailable(sourceHref,courses))return null;
 const remedy=byId.get(remedyId),stage=THERMAL_EVIDENCE_STAGES.find(s=>s.id===stageId);if(!remedy||!stage||!targetAvailable(remedy,courses))return null;
 const ticket={sourceHref,remedy,isCurrentContext,state:'reading',context:null};
 if(!valid(ticket,courses))return null;
 ticket.context=Object.freeze({...remedy,kind:'thermal-return',returnHref:sourceHref,stageId,stageTitle:stage.title,caseId:typeof caseId==='string'?caseId:null});
 pendingByOwner.set(owner,ticket);return remedy.href;
}
/** Rendering any unrelated route expires the old return capability. Returning
 * visits only the existing source and focuses its current, unchanged session. */
export function thermalRemedyRouteContext(owner,hash,courses){
 const ticket=object(owner)?pendingByOwner.get(owner):null;if(!ticket)return {remedy:null,focus:false};
 if(!valid(ticket,courses)){pendingByOwner.delete(owner);return {remedy:null,focus:false};}
 if(ticket.state==='returning'&&hash===ticket.sourceHref){pendingByOwner.delete(owner);return {remedy:null,focus:true};}
 if(ticket.state==='reading'&&hash===ticket.remedy.href)return {remedy:ticket.context,focus:false};
 pendingByOwner.delete(owner);return {remedy:null,focus:false};
}
// A nonlearning surface disposes its old Studio without rendering another one.
// Revoke only this displayed reading ticket; an explicit return is already returning.
export function disposeThermalRemedyReturn(owner,context){const ticket=object(owner)?pendingByOwner.get(owner):null;if(ticket?.state==='reading'&&ticket.context===context)pendingByOwner.delete(owner);}
export function followThermalRemedyReturn(owner,context,courses){
 const ticket=object(owner)?pendingByOwner.get(owner):null;
 if(!ticket||ticket.context!==context||ticket.state!=='reading'||!valid(ticket,courses))return null;
 ticket.state='returning';return ticket.sourceHref;
}
export function renderThermalRemedyReturnLink(context){
 return context?.kind==='thermal-return'?'<a data-thermal-remedy-return href="'+esc(context.returnHref)+'">讀完這一段，回原熱處理任務 →</a>':'';
}
export function renderThermalRemedyReturnPrompt(context){
 if(context?.kind!=='thermal-return'||!byId.has(context.id))return '';
 const part=context.target==='equation'?'關鍵公式與條件':'原理說明第'+(context.index+1)+'段';
 return '<aside class="study-remedy thermal-remedy-return" aria-label="熱處理錯因補救與同輪返回"><p><strong>這次補'+esc(part)+'：</strong>'+esc(context.why)+'</p><p>對照「'+esc(context.expectedQuote)+'」。來源段落：'+esc(context.stageTitle)+'。返回會接續原活動的目前草稿，沒有重設題設或首次作答；讀過不代表掌握。</p><p>'+renderThermalRemedyReturnLink(context)+'</p><p>此返回只限同一頁面工作階段；重新整理前請保存或複製原活動摘要。</p><p data-thermal-return-status role="status"></p></aside>';
}
