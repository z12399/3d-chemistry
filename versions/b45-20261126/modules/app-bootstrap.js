// Route initial visits before importing any 3D course modules:
// no hash → the static start page; #exam… → the exam page; anything else → the course app.
const hash=location.hash;
if(!hash||hash==='#') {
  location.replace(new URL('./start.html',location.href));
} else if(/^#exam(?:[/?]|$)/.test(hash)) {
  location.replace(new URL('./exam.html'+hash,location.href));
} else {
  import('./app.js').catch(error=>{
    const message=document.getElementById('app-loading-message');
    if(message)message.textContent='課程暫時無法載入，請重新整理。作答紀錄仍保留。';
    console.error(error);
  });
}
