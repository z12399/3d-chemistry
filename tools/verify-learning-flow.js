// End-to-end check of the exam → lesson → exam learning flow for one site version.
// Usage (from the repository root):
//   python3 -m http.server 8765 --bind 127.0.0.1
//   VER=learning-flow-20261104 node tools/verify-learning-flow.js
// Needs the `playwright` package and a Chromium it can launch. Exit code 1 on any failed check.
// SITE_ORIGIN overrides the server origin; SHOT_DIR sets where screenshots go (default: OS temp dir).
const {chromium}=require('playwright');
const VER=process.env.VER||'learning-flow-20261104';
const base=`${process.env.SITE_ORIGIN||'http://127.0.0.1:8765'}/versions/${VER}/`;
const out=require('path').join(process.env.SHOT_DIR||require('os').tmpdir(),VER+'-');
const results=[];
const check=(name,cond,detail='')=>{results.push({name,ok:!!cond});console.log((cond?'PASS ':'FAIL ')+name+(detail?' — '+detail:''));};
const settle=page=>page.waitForTimeout(900);
const hashOf=page=>page.evaluate(()=>location.hash);
const textOf=(page,sel)=>page.evaluate(s=>document.querySelector(s)?.innerText||'',sel);
const has=(page,sel)=>page.evaluate(s=>!!document.querySelector(s),sel);
async function waitFor(page,sel,timeout=8000){try{await page.waitForSelector(sel,{timeout});return true;}catch{return false;}}

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 page.on('dialog',d=>d.accept());

 // A. Write and self-assess the 115 food chemistry Q1.
 await page.goto(base+'exam.html#exam/written?question=ntu-115-239-q1',{waitUntil:'networkidle'});
 await page.fill('[data-written-response]','梅納反應：還原糖的羰基與胺基酸的胺基加成，脫水形成席夫鹼，之後Amadori重排。RVP 影響：水太少反應物不易移動。');
 await page.click('button[type=submit]:has-text("封存原稿")');
 await waitFor(page,'[data-written-rating]');
 const ids=await page.$$eval('[data-written-rating]',els=>[...new Set(els.map(e=>e.dataset.writtenRating))]);
 for(const [i,id] of ids.entries()){
  const level=i===0?'met':i===1?'partial':'missing';
  await page.check(`[data-written-rating="${id}"][value="${level}"]`);
  if(level!=='missing')await page.fill(`[data-written-evidence="${id}"]`,'還原糖的羰基與胺基酸的胺基加成');
 }
 await page.click('button[type=submit]:has-text("保存這次自評")');
 await waitFor(page,'[data-written-gap] [data-written-remedy]');
 const firstRemedy=await page.$eval('[data-written-gap] [data-written-remedy]',a=>a.getAttribute('href'));
 const attemptId=new URLSearchParams(firstRemedy.split('?')[1]).get('examAttempt');
 check('A self-assessment produces gap remedy links with the attempt',!!attemptId,firstRemedy);
 check('A exam page explains the lesson queue',(await textOf(page,'#exam-content')).includes('讀完可接著補清單上的下一課'));

 // B. Open the first gap lesson.
 await page.click('[data-written-gap] [data-written-remedy]');
 await page.waitForLoadState('networkidle');
 check('B focus banner appears on the understand step',await waitFor(page,'.exam-lesson-focus'));
 const focusB=await textOf(page,'.exam-lesson-focus');
 check('B banner names the self-assessed gap and level',focusB.includes('連起早期加成、脫水與重排')&&focusB.includes('部分寫到'),focusB.replace(/\n+/g,' | ').slice(0,200));
 check('B banner shows queue position 1 of 5',focusB.includes('補課清單第 1／5 課'));
 const backB=await page.$eval('.exam-lesson-focus .exam-focus-actions a',a=>a.getAttribute('href'));
 check('B return link targets the same attempt',backB===`#exam/written?question=ntu-115-239-q1&attempt=${encodeURIComponent(attemptId)}`,backB);
 check('B no apply box before the check step',!(await has(page,'.exam-lesson-bridge')));
 await page.screenshot({path:out+'B-understand.png'});

 // C. Footer button to the observe step keeps the context.
 await page.click('.learning-lesson-footer a:has-text("觀察變化")');await settle(page);
 let hash=await hashOf(page);
 check('C observe step keeps examReturn and examAttempt',hash.includes('/observe?')&&hash.includes('examReturn=ntu-115-239-q1')&&hash.includes('examAttempt='+attemptId),hash);
 check('C focus banner still present on observe',await waitFor(page,'.exam-lesson-focus'));

 // D. Check step: queue, next lesson, demoted course-order next.
 await page.click('.learning-lesson-footer a:has-text("檢查理解")');await settle(page);
 hash=await hashOf(page);
 check('D check step keeps the context',hash.includes('/check?')&&hash.includes('examAttempt='+attemptId),hash);
 check('D apply box appears after the lesson',await waitFor(page,'.exam-lesson-bridge.exam-lesson-next'));
 const queue=await page.$$eval('.exam-remedy-queue li',lis=>lis.map(li=>({current:li.getAttribute('aria-current'),text:li.innerText.replace(/\n+/g,' | ')})));
 check('D queue lists the 5 gap lessons',queue.length===5,JSON.stringify(queue.map(q=>q.text.slice(0,24))));
 check('D current lesson is marked in the queue',queue[0]?.current==='step'&&queue[0].text.includes('梅納反應從哪裡開始'));
 const nextD=await page.$eval('.exam-next-actions .exam-next-primary',a=>({text:a.textContent,href:a.getAttribute('href')})).catch(()=>null);
 check('D primary action is the next gap lesson with context',nextD&&nextD.text.includes('下一課：Amadori 與 Heyns')&&nextD.href.startsWith('#learn/browning/browning-rearrangement/understand?')&&nextD.href.includes('examAttempt='+attemptId),JSON.stringify(nextD));
 check('D unmapped gap is called out',(await textOf(page,'.exam-lesson-next')).includes('「用競爭效應解釋速率及適用界線」沒有對應課程'));
 const order=await page.evaluate(()=>{const f=document.querySelector('.learning-lesson-footer'),b=document.querySelector('.exam-lesson-next');return !!(f&&b&&(f.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING));});
 check('D apply box sits after the lesson footer',order);
 await page.click('[data-quiz-answer="0"]');await settle(page);
 const fb=await page.$eval('#learning-answer a',a=>({cls:a.className,text:a.textContent})).catch(()=>null);
 check('D quiz success keeps course-order next as a secondary link',fb&&fb.cls.includes('learning-back')&&!fb.cls.includes('button-primary'),JSON.stringify(fb));
 await page.evaluate(()=>document.querySelector('.exam-lesson-next')?.scrollIntoView({block:'start'}));
 await page.screenshot({path:out+'D-check-apply.png'});

 // E. Next gap lesson carries the context and position.
 await page.click('.exam-next-actions .exam-next-primary');await settle(page);
 check('E next lesson shows focus banner',await waitFor(page,'.exam-lesson-focus'));
 const focusE=await textOf(page,'.exam-lesson-focus');
 check('E banner shows position 2 of 5',focusE.includes('補課清單第 2／5 課'),focusE.replace(/\n+/g,' | ').slice(0,160));
 // Step nav link (not footer) also keeps context.
 await page.click('.learning-steps a:has-text("檢查理解")');await settle(page);
 hash=await hashOf(page);
 check('E step nav keeps the context',hash.startsWith('#learn/browning/browning-rearrangement/check?')&&hash.includes('examAttempt='+attemptId),hash);

 // F. Reload keeps the context (URL-based).
 await page.reload({waitUntil:'networkidle'});
 check('F reload keeps focus banner',await waitFor(page,'.exam-lesson-focus'));
 check('F reload keeps apply box',await waitFor(page,'.exam-lesson-next'));

 // G. Return to the attempt to rewrite.
 const back=await page.$('.exam-next-actions a:has-text("回到這次作答")');
 check('G return-to-rewrite action exists',!!back);
 await back.click();await page.waitForLoadState('networkidle');await settle(page);
 const examText=await page.evaluate(()=>document.body.innerText);
 check('G exam page opens the attempt with its self-assessment',examText.includes('這次封存的原稿')&&examText.includes('保留原稿，再寫一次'),page.url());

 // H. Plain lesson visit: no focus, apply box only on check.
 await page.goto(base+'index.html#learn/browning/browning-maillard/understand',{waitUntil:'networkidle'});await settle(page);
 check('H plain lesson has no focus banner',!(await has(page,'.exam-lesson-focus')));
 check('H plain understand step has no apply box',!(await has(page,'.exam-lesson-bridge')));
 await page.click('.learning-lesson-footer a:has-text("觀察變化")');await settle(page);
 check('H plain step links stay canonical',(await hashOf(page))==='#learn/browning/browning-maillard/observe');
 await page.goto(base+'index.html#learn/browning/browning-maillard/check',{waitUntil:'networkidle'});
 check('H plain check step shows the apply-on-exam box',await waitFor(page,'.exam-lesson-bridge'));
 check('H plain box keeps its original heading',(await textOf(page,'.exam-lesson-bridge')).includes('這一課，我真的會用了嗎？'));
 await page.click('[data-quiz-answer="1"]');await page.click('[data-quiz-answer="0"]');await settle(page);
 const fbH=await page.$eval('#learning-answer a',a=>a.className).catch(()=>'');
 check('H plain quiz success keeps the primary next button',fbH.includes('button-primary'),fbH);

 // I. Learning path context still works and never mixes with exam params.
 await page.goto(base+'index.html#paths',{waitUntil:'networkidle'});await settle(page);
 const pathHref=await page.$eval('a[href^="#paths/"]',a=>a.getAttribute('href'));
 await page.goto(base+'index.html'+pathHref,{waitUntil:'networkidle'});await settle(page);
 const station=await page.$eval('#alternate-content a[href*="?path="]',a=>a.getAttribute('href')).catch(()=>null);
 check('I path overview offers a station link',!!station,station||'');
 if(station){
  await page.goto(base+'index.html'+station,{waitUntil:'networkidle'});await settle(page);
  check('I path lesson has no exam focus',!(await has(page,'.exam-lesson-focus')));
  const steps=await page.$$eval('.learning-steps a',as=>as.map(a=>a.getAttribute('href')));
  check('I path step links keep only ?path=',steps.length===3&&steps.every(h=>/\?path=[^&]+$/.test(h)),JSON.stringify(steps));
  check('I no invalid-path warning',!(await has(page,'.path-storage-warning')));
 }

 // J. Diagnostic (choice) remedy flow.
 await page.goto(base+'exam.html#exam?question=chem-maillard-water-a',{waitUntil:'networkidle'});await settle(page);
 const optionInput=await page.$('input[name="exam-response"][value="a"]');
 check('J diagnostic options render',!!optionInput);
 if(optionInput){
  await optionInput.check();await page.click('button[type=submit]:has-text("提交答案並核對")');await settle(page);
  const remedyLink=await page.$('[data-exam-remedy]');
  check('J wrong answer offers a remedy lesson',!!remedyLink);
  if(remedyLink){
   await remedyLink.click();await page.waitForLoadState('networkidle');
   check('J diagnostic lesson shows focus banner',await waitFor(page,'.exam-lesson-focus'));
   check('J banner says 基礎診斷',(await textOf(page,'.exam-lesson-focus')).includes('基礎診斷'));
   await page.click('.learning-lesson-footer a:has-text("觀察變化")');await settle(page);
   await page.click('.learning-lesson-footer a:has-text("檢查理解")');await settle(page);
   check('J diagnostic check step offers a fresh question',(await waitFor(page,'.exam-lesson-next'))&&(await textOf(page,'.exam-lesson-next')).includes('換一道未看過的題檢查'));
  }
 }

 // K. In-page practice re-render keeps both bridge parts.
 await page.goto(base+`index.html#learn/browning/browning-maillard-storage/check?examReturn=ntu-115-239-q1&examAttempt=${encodeURIComponent(attemptId)}`,{waitUntil:'networkidle'});
 check('K practice lesson shows apply box',await waitFor(page,'.exam-lesson-next'));
 const again=await page.$('#practice-again');
 if(again){
  const field=await page.$('#practice-response');if(field)await field.fill('乾燥奶粉中的離胺酸與乳糖反應。');
  await page.waitForTimeout(400);
  await waitFor(page,'.exam-lesson-focus');
  await page.evaluate(()=>{document.querySelector('.learning-heading h1').dataset.stale='1';document.querySelector('.exam-lesson-focus').dataset.stale='1';});
  await page.evaluate(()=>document.querySelector('#practice-again').click());await settle(page);
  check('K practice-again really re-rendered the lesson',!(await has(page,'.learning-heading h1[data-stale]')));
  check('K after practice re-render the focus banner returns',await waitFor(page,'.exam-lesson-focus:not([data-stale])'));
  check('K after practice re-render the apply box returns',await waitFor(page,'.exam-lesson-next'));
  check('K only one focus banner after re-render',(await page.$$('.exam-lesson-focus')).length===1);
 } else check('K practice-again control present (skipped re-render)',false);

 // M. 3D activity round trip keeps the exam context; plain visits stay canonical.
 await page.goto(base+`index.html#learn/browning/browning-maillard/observe?examReturn=ntu-115-239-q1&examAttempt=${encodeURIComponent(attemptId)}`,{waitUntil:'networkidle'});
 await waitFor(page,'.exam-lesson-focus');
 const openBtn=await page.$('#learning-open-activity');
 check('M observe step offers the 3D activity',!!openBtn);
 if(openBtn){
  await openBtn.click();await page.waitForTimeout(1500);
  const labHash=await hashOf(page);
  if(labHash.startsWith('#lab/')){
   check('M lab URL carries the exam return in from=',decodeURIComponent(labHash).includes('examReturn=ntu-115-239-q1'),labHash.slice(0,160));
   const backLink=await page.$eval('#learning-context a',a=>a.getAttribute('href')).catch(()=>null);
   check('M lab back link keeps exam params',!!backLink&&backLink.includes('examAttempt='+attemptId),backLink||'');
   await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(1500);
   const backAfterReload=await page.$eval('#learning-context a',a=>a.getAttribute('href')).catch(()=>null);
   check('M lab reload keeps exam params in back link',!!backAfterReload&&backAfterReload.includes('examAttempt='+attemptId),backAfterReload||'');
   await page.click('#learning-context a');await settle(page);
   check('M returning from 3D restores the focus banner',await waitFor(page,'.exam-lesson-focus'));
   check('M returned hash keeps exam context',(await hashOf(page)).includes('examAttempt='+attemptId));
   await page.goto(base+'index.html#learn/browning/browning-maillard/observe',{waitUntil:'networkidle'});await settle(page);
   await page.click('#learning-open-activity');await page.waitForTimeout(1500);
   const plainLab=await hashOf(page),plainBack=await page.$eval('#learning-context a',a=>a.getAttribute('href')).catch(()=>null);
   check('M plain 3D round trip stays canonical',!plainLab.includes('examReturn')&&plainBack==='#learn/browning/browning-maillard/observe',plainLab+' / '+plainBack);
  }else console.log('NOTE: 3D unavailable here; lab round trip not exercised ('+labHash+')');
 }

 // L. Phone width screenshots.
 const phone=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,storageState:await ctx.storageState()});
 const mp=await phone.newPage();mp.on('pageerror',e=>errors.push('phone pageerror: '+e.message));
 await mp.goto(base+`index.html#learn/browning/browning-maillard/check?examReturn=ntu-115-239-q1&examAttempt=${encodeURIComponent(attemptId)}`,{waitUntil:'networkidle'});
 await waitFor(mp,'.exam-lesson-next');
 const overflow=await mp.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
 check('L phone width has no horizontal overflow',!overflow);
 await mp.evaluate(()=>document.querySelector('.exam-lesson-focus')?.scrollIntoView({block:'start'}));await mp.screenshot({path:out+'L-phone-focus.png'});
 await mp.evaluate(()=>document.querySelector('.exam-lesson-next')?.scrollIntoView({block:'start'}));await mp.screenshot({path:out+'L-phone-apply.png'});

 check('no page or console errors',errors.length===0,errors.join(' || ').slice(0,600));
 const failed=results.filter(r=>!r.ok).length;
 console.log(`\n${results.length-failed}/${results.length} checks passed`);
 await browser.close();
 process.exit(failed?1:0);
})();
