import {MoleculeViewer} from './viewer.js';
import {escapeHTML as esc} from './storage.js';
import {bondChanges,chargeChanges,validateMechanismMove,stateInventory,bondElectronOptions,oxidationStateComparison} from './mechanisms.js';
import {stepStory,focusTeachingModel} from './mechanism-story.js';

const charge=n=>n===0?'0':n>0?`+${n}`:String(n);
const order=n=>n===0?'無鍵':n===1?'單鍵':'雙鍵';
const arrowAtoms=move=>[...new Set((move?.arrows||[]).flat().flatMap(point=>point.split('-')))];
const beatNames={locate:'找位點',electron:'看電子',result:'看結果'};
const MAX_APPROACH_SHIFT=1.5;
const bondId=b=>`${[b.a,b.b].sort().join('–')}:${b.order}`;

function isSafeApproach(from,to){
  if(from.atoms.length!==to.atoms.length||from.bonds.length!==to.bonds.length)return false;
  const byId=new Map(from.atoms.map(a=>[a.id,a]));
  const bonds=new Set(from.bonds.map(bondId));
  if(to.bonds.some(b=>!bonds.has(bondId(b))))return false;
  const shifts=to.atoms.map(a=>byId.has(a.id)?Math.hypot(...a.position.map((p,i)=>p-byId.get(a.id).position[i])):Infinity);
  const largest=Math.max(...shifts);
  return largest>.1&&largest<=MAX_APPROACH_SHIFT;
}

export class MechanismPlayer {
  constructor(root,{mechanism,step=0,onState=()=>{},onSave=()=>{}}){
    this.root=root;this.mechanism=mechanism;
    this.step=Math.max(0,Math.min(mechanism.steps.length,step));
    this.visited=this.step;this.onState=onState;this.onSave=onSave;
    this.source='';this.target='';this.hint=false;this.busy=false;this.disposed=false;
    this.timer=null;this.playing=false;this.showFull=false;this.beat=this.step>0?'result':'locate';
    this.milestone=this.isMilestone();
    this.render();
  }
  get model(){return this.mechanism.states[this.step];}
  get move(){return this.mechanism.steps[this.step];}
  get isTransitioning(){return this.busy;}
  isMilestone(){return this.step>0&&this.step<this.mechanism.steps.length&&stepStory(this.mechanism,this.step-1).phase===5&&this.beat==='result';}
  stop(){clearTimeout(this.timer);this.timer=null;this.playing=false;const b=this.root.querySelector('#mechanism-play');if(b)b.textContent='▷ 播放';}
  dispose(){this.disposed=true;this.stop();this.viewer?.dispose();}

  render(){
    const ids=new Set(this.model.atoms.map(a=>a.id));
    const solvent=ids.has('Osol')?'Osol':ids.has('Ocat')?'Ocat':'';
    const legend=this.mechanism.atomLegend||(solvent?solvent+'：酸／鹼與水的氧。':'')+(ids.has('Om')?'Om、Cm：甲醇氧與碳。':'')+(ids.has('Ng')?'Ng：甘胺酸胺氮；Cg：其 CH₂；Cc：其羧基碳。':'')+(ids.has('O1b')?'O1b：羧酸端另一個氧，可隨水離去或加入。':'')+(ids.has('Ob1')?'Cai/Oai/Cmi：第 i 位乙醯基的羰基碳、氧與甲基碳；Obi/Hbi：對應羥離子的氧與氫。':'')+'H 的標籤在這條機構內固定，用來追蹤去向。';
    this.root.innerHTML=`
      <div class="mechanism-intro"><span class="method-badge">電子流 · 逐步看</span><h3>${esc(this.mechanism.title)}</h3><p>先找反應位點，再看電子移動和結果。</p><details class="mechanism-help"><summary>怎麼操作？</summary><p>按卡片上的按鈕依序觀看；在「看電子」可看到整組箭頭。想自己選來源與目的地，可展開下方「手動選電子」。</p></details></div>
      <div class="atlas-stage-grid">
        <div>
          <section class="atlas-viewer-card">
            <div class="atlas-model-heading"><span id="mechanism-model-name"></span><span id="mechanism-inventory" class="method-badge"></span></div>
            <div id="mechanism-model-status" class="model-status"></div>
            <div id="mechanism-viewer" class="atlas-viewer" role="img" aria-label="反應位點的三維教學示意"></div>
            <div class="viewer-tools">
              <div class="segmented" aria-label="機構顯示範圍"><button id="mechanism-local" type="button" aria-pressed="true">局部位點</button><button id="mechanism-full" type="button" aria-pressed="false">完整系統</button></div>
              <label class="check"><input id="mechanism-h" type="checkbox" aria-label="顯示所有氫原子">氫</label>
              <label class="check"><input id="mechanism-labels" type="checkbox" checked aria-label="顯示原子標籤">標籤</label>
              <label class="check"><input id="mechanism-active-labels" type="checkbox" ${this.model.atoms.length>45?'checked':''} aria-label="只顯示反應位點標籤">重點</label>
              <button id="mechanism-focus" aria-label="放大反應位點">◎ 位點</button><button id="mechanism-fit" aria-label="重設分子視角">↺ 視角</button>
            </div>
            <details class="atlas-model-note"><summary>原子標籤與完整狀態</summary><p>${esc(legend)}</p><p id="mechanism-full-inventory"></p></details>
          </section>
          <div class="atlas-progress"><div class="section-heading"><span id="mechanism-progress-text"></span><button id="mechanism-play">▷ 播放</button></div>
            <input id="mechanism-timeline" type="range" min="0" step="1" aria-label="回看已完成的機構狀態" title="僅回看已完成狀態">
            <div class="history-controls"><button id="mechanism-back">← 上一步</button><button id="mechanism-reset">↺ 重來</button><button id="mechanism-save" aria-label="將這一步存入實驗筆記">＋ 筆記</button></div>
          </div>
          <details id="mechanism-bond-changes" class="mechanism-changes"></details>
        </div>
        <aside class="atlas-equations mechanism-coach"><div id="mechanism-instruction"></div><section id="mechanism-story" class="mechanism-story" aria-live="polite"></section><div id="mechanism-controls"></div><p id="mechanism-feedback" class="feedback" role="status"></p><div id="mechanism-explanation"></div></aside>
      </div>
      <details class="mechanism-limits"><summary>模型與來源</summary><p>${esc(this.mechanism.limits)}</p><ul>${this.mechanism.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></details>`;
    this.viewer=new MoleculeViewer(this.root.querySelector('#mechanism-viewer'),{onAtom:a=>this.selectPoint(a.id),onBond:b=>this.selectPoint(b.a+'-'+b.b)});
    this.viewer.showH=false;this.viewer.labelsOnlySelected=this.model.atoms.length>45;
    this.root.querySelector('#mechanism-local').onclick=()=>this.setScope(false);
    this.root.querySelector('#mechanism-full').onclick=()=>this.setScope(true);
    this.root.querySelector('#mechanism-h').onchange=e=>{this.viewer.showH=e.target.checked;this.syncSelection();};
    this.root.querySelector('#mechanism-labels').onchange=e=>this.viewer.showLabels=e.target.checked;
    this.root.querySelector('#mechanism-active-labels').onchange=e=>{this.viewer.labelsOnlySelected=e.target.checked;this.syncSelection();};
    this.root.querySelector('#mechanism-focus').onclick=()=>this.viewer.fit(this.focused?.activeIds);
    this.root.querySelector('#mechanism-fit').onclick=()=>this.viewer.fit();
    this.root.querySelector('#mechanism-back').onclick=()=>{this.stop();this.go(this.step-1);};
    this.root.querySelector('#mechanism-reset').onclick=()=>{this.stop();this.go(0);};
    this.root.querySelector('#mechanism-timeline').oninput=e=>{this.stop();this.go(Number(e.target.value));};
    this.root.querySelector('#mechanism-save').onclick=()=>{if(!this.busy)this.onSave();};
    this.root.querySelector('#mechanism-play').onclick=()=>this.togglePlay();
    this.draw(true);
    requestAnimationFrame(()=>{if(!this.disposed&&this.root.isConnected)this.root.querySelector('.atlas-stage-grid')?.scrollIntoView({block:'start',behavior:'auto'});});
  }

  setScope(full){
    if(this.busy||this.disposed)return;
    this.stop();this.showFull=full;this.draw(true);
  }

  draw(fit=false){
    const m=this.model,inventory=stateInventory(m),length=this.mechanism.steps.length;
    const result=this.beat==='result'&&this.step>0;
    const storyIndex=result?this.step-1:Math.min(this.step,length-1);
    const s=this.mechanism.steps[storyIndex];
    const story=stepStory(this.mechanism,storyIndex);
    const focused=focusTeachingModel(this.mechanism,storyIndex,{distance:this.beat==='locate'?4.4:3.4,after:result});
    this.story=story;this.storyIndex=storyIndex;this.focused=focused;
    this.root.querySelector('#mechanism-model-name').textContent=m.name;
    this.root.querySelector('#mechanism-inventory').textContent=this.showFull?`${inventory.atoms} 原子 · 電荷 ${charge(inventory.charge)}`:`局部 ${focused.model.atoms.length} / 完整 ${inventory.atoms} 原子`;
    const composite=/composite|bookkeeping|grouped/i.test(this.mechanism.kind||'');
    this.root.querySelector('#mechanism-model-status').textContent=`${this.showFull?'完整系統 · 保留全部原子與共產物':'局部位點 · 僅顯示本步相關片段'}${composite?' · 合併淨步示意':' · 教學機構'}`;
    for(const [id,active] of [['mechanism-local',!this.showFull],['mechanism-full',this.showFull]]){const b=this.root.querySelector('#'+id);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
    this.root.querySelector('#mechanism-full-inventory').textContent=`完整狀態：${inventory.atoms} 原子 · 總電荷 ${charge(inventory.charge)}${Object.entries(m.metadata?.iodineCoordination||{}).map(([id,c])=>` · ${id} 配位 ${c.coordinationNumber}`).join('')}`;
    this.root.querySelector('#mechanism-progress-text').textContent=`狀態 ${this.step} / ${length} · ${beatNames[this.beat]}`;
    const range=this.root.querySelector('#mechanism-timeline');range.max=this.visited;range.value=this.step;range.disabled=this.busy;
    this.root.querySelector('#mechanism-back').disabled=this.step===0||this.busy;
    this.root.querySelector('#mechanism-reset').disabled=this.busy;
    this.root.querySelector('#mechanism-save').disabled=this.busy;
    const currentBeat=this.beat,beats=['locate','electron','result'];
    const nextSite=this.step<length?stepStory(this.mechanism,this.step).siteLabel:'';
    const nextLabel=currentBeat==='locate'?'看電子怎麼走 →':currentBeat==='electron'?'看這一步結果 →':this.step===length?'已完成':this.milestone?`繼續 ${nextSite} →`:'接著看下一步 →';
    const beatDetail=currentBeat==='locate'?'先在模型裡找到高亮的電子來源與目的地。':currentBeat==='electron'?story.secondaryText:'對照新鍵、斷鍵與產物，再決定何時往下走。';
    const milestone=this.milestone?`<p class="mechanism-milestone">${esc(story.siteLabel)}已完成一輪乙醯轉移。先看清這個結果，再進到下一個位置。</p>`:'';
    this.root.querySelector('#mechanism-story').innerHTML=`
      <div class="mechanism-story-kicker"><span>${esc(story.siteLabel)}</span><span>第 ${storyIndex+1} / ${length} 步</span><button id="mechanism-to-overview" class="mechanism-overview-link">← 反應概覽</button></div>
      <h3 class="mechanism-story-title">${esc(s.title)}</h3>
      <div class="mechanism-path" aria-label="電子來源與目的地"><span class="mechanism-path-node"><small>來源</small><strong>${esc(story.sourceLabel)}</strong></span><span class="mechanism-path-arrow" aria-hidden="true">→</span><span class="mechanism-path-node"><small>目的地</small><strong>${esc(story.targetLabel)}</strong></span></div>
      <p class="mechanism-story-primary">${esc(story.primaryText)}</p>
      <p class="mechanism-change-callout"><span>${result?'已發生':'將發生'}</span> ${esc(story.changeText||'電子重新分配，鍵結保持不變')}</p>
      <div class="mechanism-beat-track" aria-label="本步三個觀看節拍">${beats.map((beat,i)=>`<span data-beat="${beat}" class="${beat===currentBeat?'active':beats.indexOf(currentBeat)>i?'done':''}">${i+1} ${beatNames[beat]}</span>`).join('')}</div>
      <p class="mechanism-beat-detail">${esc(beatDetail)}</p>${milestone}
      <button id="mechanism-beat-next" class="button-primary" ${this.step===length&&result?'disabled':''}>${esc(nextLabel)}</button>
      <p class="mechanism-schematic-note">${esc(story.schematicNote)}</p>`;
    this.root.querySelector('#mechanism-beat-next').onclick=()=>{this.stop();this.advanceBeat();};
    this.root.querySelector('#mechanism-to-overview').onclick=()=>this.root.closest('#atlas-detail')?.querySelector('#atlas-overview')?.click();
    this.root.querySelector('#mechanism-instruction').innerHTML=`<section class="mechanism-step-equation" aria-label="當步反應式"><span>${result?'剛完成的反應式':'這一步的反應式'} · ${storyIndex+1} / ${length}${composite?' · 合併記帳':''}</span><p>${esc(s.equation)}</p></section><details class="mechanism-deep"><summary>為什麼會這樣？</summary><p>${esc(s.instruction)}</p></details>`;
    const controls=this.root.querySelector('#mechanism-controls');
    if(this.step<length&&currentBeat!=='result'){
      const atoms=m.atoms.map(a=>[a.id,`${a.id} · ${a.element}${a.formalCharge?' '+charge(a.formalCharge):''}`]);
      const bonds=bondElectronOptions(m,s.source),targets=[...atoms,...bondElectronOptions(m,s.target,{source:false})];
      controls.innerHTML=`<details class="mechanism-advanced"><summary>手動選電子（進階）</summary><label for="mechanism-source">來源</label><select id="mechanism-source"><option value="">選擇來源</option>${[...atoms,...bonds].map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select><label for="mechanism-target">目的地</label><select id="mechanism-target"><option value="">選擇目的地</option>${targets.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('')}</select><button id="mechanism-push" class="button-primary wide mt">驗證並推進 →</button><button id="mechanism-hint" class="wide mt">${this.hint?'隱藏':'顯示'}提示</button></details>`;
      controls.querySelector('#mechanism-source').onchange=e=>{this.source=e.target.value;this.syncSelection();};
      controls.querySelector('#mechanism-target').onchange=e=>{this.target=e.target.value;this.syncSelection();};
      controls.querySelector('#mechanism-push').onclick=()=>{this.stop();this.push();};
      controls.querySelector('#mechanism-hint').onclick=()=>{this.hint=!this.hint;controls.querySelector('#mechanism-hint').textContent=(this.hint?'隱藏':'顯示')+'提示';this.syncSelection();};
    }else controls.replaceChildren();
    this.root.querySelector('#mechanism-feedback').textContent='';
    this.root.querySelector('#mechanism-explanation').innerHTML=this.step?`<details class="mechanism-explanation"><summary>上一步的詳細說明</summary><p>${esc(this.mechanism.steps[this.step-1].explanation)}</p></details>`:'';
    const before=this.mechanism.states[storyIndex],after=this.mechanism.states[storyIndex+1];
    const changes=bondChanges(before,after),charges=chargeChanges(before,after),oxidation=oxidationStateComparison(before,after);
    this.root.querySelector('#mechanism-bond-changes').innerHTML=`<summary>鍵與電荷明細</summary><p class="tiny">綠色虛線：將成鍵 · 珊瑚色：將斷鍵 · 金色：鍵級改變</p><ul>${changes.map(c=>`<li class="change-${c.kind}"><strong>${esc(c.pair)}</strong><span>${order(c.from)} → ${order(c.to)}</span></li>`).join('')}</ul><p class="tiny">形式電荷：${charges.map(c=>`${esc(c.id)} ${charge(c.from)} → ${charge(c.to)}`).join('；')||'各原子的形式電荷保持不變'}</p>${oxidation.length?`<p class="tiny" data-oxidation-states>氧化態（與形式電荷不同）：${oxidation.map(c=>`${esc(c.id)} ${charge(c.from)} → ${charge(c.to)}`).join('；')}</p>`:''}`;
    this.syncSelection(fit);
  }

  syncSelection(fit=false){
    this.root.querySelector('#mechanism-feedback').textContent='';
    const source=this.root.querySelector('#mechanism-source'),target=this.root.querySelector('#mechanism-target');
    if(source)source.value=this.source;if(target)target.value=this.target;
    const ids=[...new Set([...this.focused.activeIds,this.source,this.target,...(this.hint?arrowAtoms(this.move):[])].filter(Boolean).flatMap(x=>x.split('-')))];
    const arrows=(this.beat==='electron'||this.hint)&&this.beat!=='result'?this.story.arrows:[];
    const changes=this.beat==='locate'?[]:bondChanges(this.mechanism.states[this.storyIndex],this.mechanism.states[this.storyIndex+1]);
    this.viewer.setMolecule(this.showFull?this.model:this.focused.model,{selected:ids,arrows,changes,fit});
  }

  selectPoint(id){
    if(this.busy||!this.move||this.root?.querySelector&&!this.root.querySelector('.mechanism-advanced')?.open)return;
    const source=!this.source||!!this.target,field=source?'source':'target',pair=id.split('-').sort().join('-');
    const point=id.includes('-')?bondElectronOptions(this.model,this.move[field],{source}).find(([value])=>value.split('-').sort().join('-')===pair)?.[0]||id:id;
    this[field]=point;if(source)this.target='';this.syncSelection();
  }

  async push(guided=false){
    if(this.busy||!this.move)return false;
    const s=this.move,checked=validateMechanismMove(this.mechanism,this.step,guided?s.source:this.source,guided?s.target:this.target);
    this.root.querySelector('#mechanism-feedback').textContent=checked.message;
    if(!checked.ok)return false;
    this.busy=true;
    this.step++;this.visited=Math.max(this.visited,this.step);
    this.source='';this.target='';this.hint=false;this.beat='result';this.milestone=this.isMilestone();
    this.busy=false;this.draw(true);
    this.onState(this.step,`${this.mechanism.title} · ${this.model.name}`);
    return true;
  }

  async advanceBeat(){
    if(this.busy||this.disposed)return false;
    if(this.beat==='result'){
      if(!this.move)return false;
      this.beat='locate';this.milestone=false;this.draw(true);return true;
    }
    if(this.beat==='locate'){
      if(!this.showFull&&this.story?.kind==='encounter'&&this.viewer?.transitionTo){
        const near=focusTeachingModel(this.mechanism,this.step,{distance:3.4});
        if(isSafeApproach(this.focused.model,near.model)){
          this.busy=true;
          let completed;
          try{completed=await this.viewer.transitionTo(near.model,{duration:750,selected:near.activeIds});}
          finally{this.busy=false;}
          if(!completed||this.disposed)return false;
          this.beat='electron';this.draw(false);return true;
        }
      }
      this.beat='electron';this.draw(true);return true;
    }
    return this.push(true);
  }

  go(step){
    if(this.busy||step<0||step>this.visited)return;
    this.step=step;this.source='';this.target='';this.hint=false;
    this.beat=step>0?'result':'locate';this.milestone=this.isMilestone();
    this.draw(true);this.onState(this.step,`回看機構：${this.model.name}`);
  }

  async togglePlay(){
    if(this.playing){this.stop();return;}
    if(this.busy)return;
    if(!this.move&&this.beat==='result')this.go(0);
    this.playing=true;this.root.querySelector('#mechanism-play').textContent='Ⅱ 暫停播放';
    const tick=async()=>{
      if(!this.playing||this.disposed)return;
      const advanced=await this.advanceBeat();
      if(!advanced||!this.playing||this.disposed||this.milestone&&this.beat==='result'||this.step===this.mechanism.steps.length&&this.beat==='result'){this.stop();return;}
      this.timer=setTimeout(tick,this.beat==='result'?2200:this.beat==='electron'?1800:1500);
    };
    this.timer=setTimeout(tick,this.beat==='result'?2200:1500);
  }
}
