import {ExamPracticeStore} from './exam-backup.js';
import {mountExamRoom} from './exam-room.js';
import {mountExamWritten} from './exam-written.js';
import {mountExamProgress} from './exam-progress.js';
import {mountExamPaper} from './exam-paper.js';
import {escapeHTML} from './storage.js';

const root=document.getElementById('exam-content'),status=document.querySelector('[data-exam-route-status]');
const isExam=hash=>!hash||hash==='#'||/^#exam(?:[/?]|$)/.test(hash);
let bank,writtenBank,store,paperStore,dispose=null,writtenGuard=null,roomGuard=null,paperGuard=null,acceptedHash=location.hash||'#exam/progress',loading=null;
const notify=text=>{status.textContent=text||'';status.hidden=!text;};
const navigate=hash=>{location.hash=hash;};
function prepareLeave(){
  for(const guard of new Set([dispose?.prepareLeave,writtenGuard,roomGuard,paperGuard].filter(Boolean))){
    const result=guard();
    if(result===false||result?.ok===false){
      notify(result.error||'這裡還有未保存的作答或對答案結果，請先保存或匯出。');
      if(result.href&&location.hash!==result.href)location.hash=result.href;
      return false;
    }
  }
  if(store){const result=store.retryPersistence();if(!result.ok||!result.persisted){notify(result.error);return false;}}
  if(paperStore){const result=paperStore.retryPersist();if(!result.ok||!result.persisted){notify(result.error);return false;}}
  return true;
}
function leave(url,{replace=false}={}){if(!prepareLeave())return false;location[replace?'replace':'assign'](url);return true;}
// 頂欄五項導覽：#exam/progress 標「我的進度」，其餘練習頁標「練習」。
function markSiteNav(path){
  const current=path==='#exam/progress'||path==='#'?'./exam.html#exam/progress':'./exam.html#exam/written';
  (document.querySelectorAll?.('.site-nav a')||[]).forEach(link=>{if(link.getAttribute('href')===current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
}
function route(){
  const hash=location.hash||'#exam/progress';
  if(!isExam(hash)){
    if(!leave(new URL('./index.html'+hash,location.href),{replace:true})&&!isExam(location.hash))history.replaceState(null,'',acceptedHash);
    return;
  }
  if(!store)return;
  dispose?.();dispose=null;store.refresh();acceptedHash=hash;
  const path=hash.split('?')[0],query=new URLSearchParams(hash.split('?')[1]||'');
  const options={bank,store,onNavigate:navigate,initialQuestionId:query.get('question'),initialAttemptId:query.get('attempt')};
  if(path==='#exam/progress'||path==='#')dispose=mountExamProgress(root,{bank,writtenBank,store});
  else if(path==='#exam/written'){
    const parent=paperStore.getRun(query.get('paperReturn'));
    const questionId=query.get('paperQuestion')||query.get('question');
    const returnToPaper=parent?.questions.some(q=>q.id===questionId)?'#exam/paper?run='+encodeURIComponent(parent.id)+'&question='+encodeURIComponent(questionId):undefined;
    dispose=mountExamWritten(root,{...options,bank:writtenBank,returnToPaper});writtenGuard=dispose.prepareLeave;
  }else if(path==='#exam'){
    dispose=mountExamRoom(root,options);roomGuard=dispose.prepareLeave;
  }else if(path==='#exam/paper'){
    dispose=mountExamPaper(root,{bank:writtenBank,store:paperStore,examStore:store,onNavigate:navigate,initialRunId:query.get('run'),initialQuestionId:query.get('question')});paperGuard=dispose.prepareLeave;
  }
  else root.innerHTML='<h1>找不到這個練習頁面</h1><p><a href="#exam/progress">回我的進度 →</a></p>';
  markSiteNav(path);
  const heading=root.querySelector('h1');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  window.scrollTo(0,0);
}
async function loadBank(path){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(path,{signal:controller.signal});if(!response.ok)throw Error('題庫讀取失敗（'+response.status+'）');return await response.json();}finally{clearTimeout(timeout);}
}
function start(){
  if(loading)return loading;
  loading=Promise.all([loadBank('./data/exam-bank.json'),loadBank('./data/exam-written-bank.json')]).then(([diagnostic,written])=>{
    if(diagnostic.schemaVersion!==1||!Array.isArray(diagnostic.questions)||!Array.isArray(diagnostic.domains)||written.schemaVersion!==1||!Array.isArray(written.questions))throw Error('題庫格式無效。');
    bank=diagnostic;writtenBank=written;store=new ExamPracticeStore({...bank,questions:[...bank.questions,...written.questions]},{writtenBank});paperStore=store.paperStore;route();
  }).catch(error=>{
    root.innerHTML='<section class="exam-entry-loading"><h1>題庫暫時無法載入</h1><p>'+escapeHTML(error.name==='AbortError'?'連線逾時，請檢查網路後重試。':error.message)+'</p><p>原有作答紀錄仍保留在這個瀏覽器。</p><button type="button" data-retry-bank>重新載入題庫</button> <a href="./index.html#learn/map">前往課程</a></section>';
    root.querySelector('[data-retry-bank]').onclick=()=>{loading=null;start();};
  });return loading;
}
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');if(!link)return;
  const url=new URL(link.href,location.href);
  if(link.getAttribute('href')==='#exam-content'){event.preventDefault();root.focus();return;}
  if(url.origin!==location.origin||link.target==='_blank'||link.hasAttribute('download'))return;
  const sameDocument=url.pathname===location.pathname&&url.search===location.search;
  if(sameDocument&&isExam(url.hash))return;
  event.preventDefault();
  // A modified click opens a separate document and cannot discard this page.
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey){window.open(url.href,'_blank','noopener');return;}
  leave(sameDocument?new URL('./index.html'+url.hash,location.href):url);
},true);
window.addEventListener('hashchange',route);
window.addEventListener('beforeunload',event=>{if(store?.volatile.size){event.preventDefault();event.returnValue='';}});
if(isExam(location.hash))start();else location.replace(new URL('./index.html'+location.hash,location.href));
