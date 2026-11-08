// Actual CSS border boxes, owned by one viewer and one set of label DOM nodes.
// The observer updates numbers only; camera motion never reads layout again.
export class AtomLabelMetrics {
  constructor({Observer=globalThis.ResizeObserver}={}){
    this.sizes=new WeakMap();this.targets=new Set();this.disposed=false;
    this.observer=typeof Observer==='function'?new Observer(entries=>{
      if(this.disposed)return;
      const active=entries.filter(entry=>this.targets.has(entry.target));
      const sizes=active.map(entry=>{
        const box=entry.borderBoxSize?.[0]??entry.borderBoxSize;
        return {element:entry.target,width:box?.inlineSize??entry.target.offsetWidth,height:box?.blockSize??entry.target.offsetHeight};
      });
      // display:none/removal reports zero. Keeping the last positive box avoids
      // a show/measure/hide loop for intentionally suppressed ordinary labels.
      for(const size of sizes)this.store(size.element,size.width,size.height);
    }):null;
  }
  store(element,width,height){
    if(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0)this.sizes.set(element,{width,height});
  }
  track(element){
    if(this.disposed||this.targets.has(element))return;
    this.targets.add(element);this.observer?.observe(element,{box:'border-box'});
  }
  measure(elements){
    if(this.disposed)return;
    elements.forEach(element=>this.track(element));
    const unknown=elements.filter(element=>!this.sizes.has(element));
    for(const element of unknown)element.style.display='block';
    const sizes=unknown.map(element=>({element,width:element.offsetWidth,height:element.offsetHeight}));
    for(const size of sizes)this.store(size.element,size.width,size.height);
  }
  get(element){return this.sizes.get(element);}
  clear(){this.observer?.disconnect();this.targets.clear();this.sizes=new WeakMap();}
  dispose(){this.disposed=true;this.clear();}
}
