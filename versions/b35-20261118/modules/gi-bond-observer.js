// This observer describes the displayed graph. It never simulates a reaction.
export class GiBondObserver {
 constructor(host,onSelect){
  this.host=host;this.onSelect=onSelect;
  host.innerHTML='<div class="gi-bond-controls" role="group" aria-label="核對目前模型的 C–O 鍵"><span class="gi-bond-caption">核對鍵級</span><button type="button" data-gi-bond="C1-O1" aria-pressed="false"></button><button type="button" data-gi-bond="C2-O2" aria-pressed="false"></button></div><p class="gi-bond-readout" role="status" aria-live="polite" aria-atomic="true"></p><p class="gi-bond-caveat"></p>';
  this.click=e=>{const button=e.target.closest('[data-gi-bond]');if(button&&host.contains(button)&&!button.disabled)this.onSelect?.(button.dataset.giBond);};
  host.addEventListener('click',this.click);
 }
 update(observation,selectedId,{concept=false,endpointComparison=false}={}){
  for(const button of this.host.querySelectorAll('[data-gi-bond]')){
   const pair=observation.pairs.find(p=>p.id===button.dataset.giBond);
   button.textContent=pair.symbol+' · '+pair.description;
   button.disabled=!pair.available;
   button.setAttribute('aria-pressed',String(pair.available&&pair.id===selectedId));
   button.setAttribute('aria-label',pair.available?`聚焦 ${pair.symbol}，${pair.description}，${pair.order===2?'雙':'單'}鍵`:`${pair.symbol}，未能核對`);
  }
  const selected=observation.pairs.find(p=>p.available&&p.id===selectedId);
  this.host.querySelector('.gi-bond-readout').textContent=selected?`已聚焦 ${selected.symbol}，${selected.description}（${selected.order===2?'雙':'單'}鍵）。`:observation.pairs.every(p=>p.available)?'選鍵聚焦；也可點 3D 的 C1/O1、C2/O2。':observation.summary;
  const caveat=this.host.querySelector('.gi-bond-caveat');caveat.textContent=concept?(observation.pairs.every(p=>p.available)?endpointComparison?'獨立自由糖端點比較；不是氫移位中間體，金屬位與 H 路徑未建模。':'第 3 步仍是未反應 Glc 參照，不是氫移位中間體；金屬位未建模。':'本步模型未通過核對；不能把參考畫面當成氫移位中間體。'):'';caveat.title=observation.caveat;caveat.hidden=!concept;
 }
 dispose(){this.host.removeEventListener('click',this.click);this.onSelect=null;}
}
