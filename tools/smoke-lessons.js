// Render every lesson step, and open every exam remedy link with its exam context,
// in one site version. Reports steps that never rendered, remedy links without the
// exam focus banner, and page/console errors.
// Usage (from the repository root, with the same local server as verify-learning-flow.js):
//   VER=gap-lessons-20261105 node tools/smoke-lessons.js
const {chromium}=require('playwright');
const fs=require('fs');
const VER=process.env.VER||'gap-lessons-20261105';
const root=require('path').join(__dirname,'..','versions',VER)+'/';
const base=`${process.env.SITE_ORIGIN||'http://127.0.0.1:8765'}/versions/${VER}/`;
const curricula=[['learn','food-curriculum.json'],['process','processing-curriculum.json'],['micro','microbiology-curriculum.json']];
const lessons=[];
for(const [r,f] of curricula)for(const t of JSON.parse(fs.readFileSync(root+'data/'+f,'utf8')).topics)for(const l of t.lessons)lessons.push({hash:`#${r}/${t.id}/${l.id}`,title:l.title,id:l.id});
const remedies=[];const unmappedCriteria=[];
for(const q of JSON.parse(fs.readFileSync(root+'data/exam-written-bank.json','utf8')).questions)for(const c of q.rubric)if(!(c.remediationLessonIds||[]).length)unmappedCriteria.push(c.id);
for(const f of ['exam-bank.json','exam-written-bank.json'])for(const q of JSON.parse(fs.readFileSync(root+'data/'+f,'utf8')).questions)for(const r of q.remediation||[])remedies.push({q:q.id,href:r.href});
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 let current='';const errors=[];
 page.on('pageerror',e=>errors.push(current+' :: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(current+' :: console '+m.text());});
 page.on('dialog',d=>d.accept());
 await page.goto(base+'index.html#learn',{waitUntil:'networkidle'});
 const go=async(hash,ready)=>{current=hash;await page.evaluate(h=>{location.hash=h;},hash);try{await page.waitForFunction(ready.fn,ready.arg,{timeout:5000});return true;}catch{return false;}};
 const missing=[];
 for(const lesson of lessons)for(const step of ['understand','observe','check']){
  const ok=await go(`${lesson.hash}/${step}`,{fn:([t,s])=>document.querySelector('#alternate-content h1')?.textContent.trim()===t&&location.hash.includes('/'+s),arg:[lesson.title,step]});
  if(!ok)missing.push(`${lesson.hash}/${step}`);
 }
 const noFocus=[];
 for(const r of remedies){
  const hash=r.href+(r.href.includes('?')?'&':'?')+'examReturn='+r.q;
  const ok=await go(hash,{fn:()=>!!document.querySelector('.exam-lesson-focus'),arg:null});
  if(!ok)noFocus.push(hash);
 }
 console.log(JSON.stringify({version:VER,lessonSteps:lessons.length*3,unrendered:missing.length,unrenderedSample:missing.slice(0,8),remedyLinks:remedies.length,rubricPointsWithoutLesson:unmappedCriteria.length,remedyWithoutFocus:noFocus.length,remedySample:noFocus.slice(0,5),errors:errors.length,errorSample:[...new Set(errors)].slice(0,12)},null,1));
 await browser.close();
 process.exit(missing.length||noFocus.length||errors.length||unmappedCriteria.length?1:0);
})();
