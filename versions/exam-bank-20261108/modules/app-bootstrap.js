// Route initial exam visits before importing any 3D course modules.
const hash=location.hash;
if(!hash||hash==='#'||/^#exam(?:[/?]|$)/.test(hash)) {
  location.replace(new URL('./exam.html'+(hash&&hash!=='#'?hash:'#exam/progress'),location.href));
} else {
  import('./app.js').catch(error=>{
    const message=document.getElementById('app-loading-message');
    if(message)message.textContent='課程暫時無法載入，請重新整理。備考紀錄仍保留。';
    console.error(error);
  });
}
