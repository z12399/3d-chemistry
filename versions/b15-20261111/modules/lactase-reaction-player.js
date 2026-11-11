import {escapeHTML as esc} from './storage.js';
import {createLactaseReactionTimeline,sampleLactaseReaction,LACTASE_REACTION_BOOKMARKS} from './lactase-reaction-timeline.js';
import {LactaseReactionViewer} from './lactase-reaction-viewer.js';
import {LactaseReactionPlayback} from './lactase-reaction-playback.js';

let sequence=0;
const segmentExplanations={approach:'乳糖與兩個羧基端基類比聚近，先找到半乳糖 Gal C1、原糖苷橋氧，以及 E1749 的親核氧。',activation:'E1538 作酸，準備協助橋氧接受質子；E1749 的羧酸根氧將參與第一次取代。','first-substitution':'E1538 提供質子，Gal C1–橋氧連接解除；E1749 的氧與 Gal C1 共價相連。圖中以質子移動與鍵淡入淡出表示這次取代。','glucose-release':'葡萄糖離開，α 半乳糖–E1749 的共價中間體保留；第一次取代已反轉 Gal C1 的配置。','water-approach':'水靠近 Gal C1。E1538 改作鹼，準備接受水的質子，協助水作親核進攻者。','second-substitution':'水氧 Ow 接到 Gal C1，E1749 的共價連接解除。第二次取代再反轉配置，新釋出的半乳糖回到 β。','product-release':'半乳糖與葡萄糖釋出；水氧留在 Gal C1 的羥基，原橋氧留在葡萄糖 C4。催化端基可再次使用；產物之後可各自變旋。'};
const stageNames={binding:'乳糖靠近',glycosylation:'共價中間體',deglycosylation:'水參與',products:'單糖釋出'};
const bondKey=(a,b)=>[a,b].sort().join('|');
const bondNames=[['AC1','BO4','乳糖的糖苷鍵'],['AC1','E1749Oreact','Gal–酵素端基共價鍵'],['AC1','Ow','Gal–水氧的新羥基鍵']];
const bookmarks=()=>Array.isArray(LACTASE_REACTION_BOOKMARKS)?Object.fromEntries(LACTASE_REACTION_BOOKMARKS.map(item=>[item.stageId||item.id,item.progress])):LACTASE_REACTION_BOOKMARKS;
const progressOf=id=>{const entry=bookmarks()[id];return typeof entry==='number'?entry:entry?.progress??0;};

/** A single seekable chemical storyboard. Play controls display time only. */
export function mountLactaseReactionPlayer(root,{model,initialStage='binding',initialProgress=null,onObservation=()=>{},onError=()=>{},viewerFactory=(host,options)=>new LactaseReactionViewer(host,options)}={}){
  const prefix='lph-reaction-'+(++sequence),timeline=createLactaseReactionTimeline(model);
  let disposed=false,viewer=null,clock=null,current=null,lastBucket=-1,lastBondSummary='',lastSegment='',observer=null,failed=false;
  const $=name=>root.querySelector(`[data-lph-reaction-${name}]`);
  root.innerHTML=`<section class="lph-reaction-player" aria-labelledby="${prefix}-title">
    <header><h4 class="lph-reaction-sr-only" id="${prefix}-title">看一次完整的乳糖水解</h4><p class="lph-reaction-identity">局部機構示意 · 人工插值</p></header>
    <div class="lph-reaction-transport"><div class="lph-reaction-controls"><button type="button" class="lph-reaction-primary" data-lph-reaction-play aria-pressed="false">▶ 播放完整過程</button><button type="button" data-lph-reaction-restart>↺ 從頭看</button><label for="${prefix}-speed">觀看速度<select id="${prefix}-speed" data-lph-reaction-speed><option value="0.5">慢速 · 0.5×</option><option value="1" selected>一般 · 1×</option><option value="2">快速 · 2×</option></select></label></div>
      <div class="lph-reaction-progress-control"><label class="lph-reaction-seek-label" for="${prefix}-seek"><span>拖曳觀看進度</span><output data-lph-reaction-progress>0%</output></label><input id="${prefix}-seek" type="range" min="0" max="1000" step="1" value="0" data-lph-reaction-seek aria-label="乳糖水解連續可視化進度"></div>
    </div>
    <div class="lph-reaction-viewport" data-lph-reaction-viewport></div>
    <div class="lph-reaction-readout"><h5 data-lph-reaction-label></h5><p data-lph-reaction-explanation></p><div class="lph-reaction-bonds" data-lph-reaction-bonds></div></div>
    <div class="lph-reaction-view-controls"><button type="button" data-lph-reaction-fit>◎ 看完整過程範圍</button><button type="button" data-lph-reaction-focus>放大 Gal C1</button><button type="button" data-lph-reaction-camera="left" aria-label="向左旋轉連續反應">←</button><button type="button" data-lph-reaction-camera="right" aria-label="向右旋轉連續反應">→</button><button type="button" data-lph-reaction-camera="in" aria-label="放大連續反應">＋</button><button type="button" data-lph-reaction-camera="out" aria-label="縮小連續反應">−</button><label><input type="checkbox" data-lph-reaction-h> 顯示全部氫</label></div>
    <div class="lph-reaction-bookmarks" role="group" aria-label="跳到反應的一個部位">${Object.entries(stageNames).map(([id,label])=>`<button type="button" data-lph-reaction-bookmark="${id}">${esc(label)}</button>`).join('')}</div>
    <p class="lph-reaction-selection" role="status" data-lph-reaction-selection>可點選分子中的原子或化學鍵，讀它的角色。</p><p role="status" class="lph-reaction-play-status" data-lph-reaction-status>已暫停；播放由你開始。</p>
    <details class="lph-reaction-scope-details"><summary>播放方式與模型界線</summary><p>按播放，或拖曳進度來回看：乳糖靠近 → 共價中間體 → 水參與 → 兩個單糖釋出。播放時仍能旋轉和縮放。</p><p class="lph-reaction-scope">這是連續的分子機構教學示意。糖環保持連貫，端基位置與移動路徑由教材安排；成鍵、斷鍵與質子接力以插值呈現。進度與觀看速度不是實測時間、速率或鍵級，途中畫面不是已驗證的過渡態，也沒有把底物對接到人體蛋白座標。</p></details>
  </section>`;
  const visible=()=>root.isConnected&&!root.closest('[hidden]')&&!document.hidden;
  function observation(frame){return {progress:frame.progress,stageId:frame.stageId,label:frame.label,segmentId:frame.segmentId,detail:`連續 3D 教學進度 ${(frame.progress*100).toFixed(1)}%：${frame.label}。${frame.explanation||segmentExplanations[frame.segmentId]||''}此為固定糖環的分子機構示意與插值，非實測結合姿勢、反應時間或過渡態。`,sourceIds:['lph-catalysis-2014','lph-iubmb']};}
  function render(progress,{forceNotify=false}={}){
    if(disposed||failed)return;
    try{
      current=sampleLactaseReaction(timeline,progress);viewer.setFrame(current);
      root.dataset.lphReactionProgress=String(progress);root.dataset.lphReactionSegment=current.segmentId||'';
      $('seek').value=String(Math.round(progress*1000));$('progress').textContent=`${Math.round(progress*100)}%`;
      $('seek').setAttribute('aria-valuetext',`${(progress*100).toFixed(1)}%，${current.label}`);
      if(lastSegment!==current.segmentId){lastSegment=current.segmentId;$('label').textContent=current.label;$('explanation').textContent=current.explanation||segmentExplanations[current.segmentId]||'追蹤 Gal C1 的連接與兩次配置反轉，糖環保留原子身份。';}
      for(const button of root.querySelectorAll('[data-lph-reaction-bookmark]'))button.setAttribute('aria-pressed',String(button.dataset.lphReactionBookmark===current.stageId));
      const strengths=new Map(current.bonds.map(bond=>[bondKey(bond.a,bond.b),bond.strength??bond.opacity??1]));
      const bondSummary=bondNames.map(([a,b,label])=>{const value=strengths.get(bondKey(a,b))||0;return `<div><span>${esc(label)}</span><strong>${value>.99?'有':value<.01?'無':'交接中 · 教學插值'}</strong></div>`;}).join('');if(bondSummary!==lastBondSummary){lastBondSummary=bondSummary;$('bonds').innerHTML=bondSummary;}
      const bucket=Math.floor(progress*100);if(forceNotify||bucket!==lastBucket){lastBucket=bucket;onObservation(observation(current));}
    }catch(error){failed=true;clock?.pause();$('status').textContent='連續 3D 顯示暫時中斷；可以用下方按鈕重新載入。';root.querySelectorAll('button,input,select').forEach(control=>control.disabled=true);onError(error);}
  }
  function status(playing){
    if(disposed)return;root.dataset.lphReactionPlaying=String(playing);$('play').textContent=playing?'Ⅱ 暫停':clock?.progress>=1?'▶ 再播放一次':'▶ 播放完整過程';$('play').setAttribute('aria-pressed',String(playing));
    $('status').textContent=playing?'正在播放；拖曳進度會暫停，可以倒回任意位置。':clock?.progress>=1?'已播完；可從頭重播或拖曳回看。':'已暫停；可以旋轉、放大或拖曳回看。';
    if(!playing&&current)onObservation(observation(current));
  }
  try{
    viewer=viewerFactory($('viewport'),{onAtom:atom=>{const role={AC1:'半乳糖 Gal 的異頭碳',BO4:'葡萄糖端的原糖苷橋氧',E1749Oreact:'親核羧基氧的端基類比',E1538Oreact:'酸／鹼羧基氧的端基類比',Ow:'水氧，反應後成為 Gal 羥基氧',E1538Hacid:'酸提供的追蹤氫',Hwa:'水提供的追蹤氫'}[atom.id];$('selection').textContent=`${atom.id} · ${role||atom.label||atom.element}；目前位置是教學示意座標。`;},onBond:bond=>$('selection').textContent=`${bond.a}–${bond.b}：${(bond.strength??1)>.99?'此狀態的模型化學鍵':'成鍵／斷鍵的教學插值'}。`,onError:error=>{if(!disposed){failed=true;clock?.pause();root.querySelectorAll('button,input,select').forEach(control=>control.disabled=true);$('status').textContent='連續 3D 顯示中斷，請重試載入分子。';onError(error);}}});
    viewer.showH=false;
    // Fit the actual swept atom positions, avoiding empty corners of a large
    // bounding box while retaining a single camera through the full process.
    const sweptPoints=Array.from({length:101},(_,index)=>sampleLactaseReaction(timeline,index/100).atoms.map(atom=>atom.position)).flat();
    viewer.setTimelineBounds?.(sweptPoints);
    clock=new LactaseReactionPlayback({onProgress:progress=>render(progress),onPlayback:status,isVisible:visible});
    clock.seek(Number.isFinite(initialProgress)?initialProgress:progressOf(initialStage));if(failed)throw new Error('Initial continuous display unavailable');viewer.fit();
  }catch(error){clock?.dispose();viewer?.dispose();throw error;}
  function pause(){if(disposed)return;clock.pause();if(current)onObservation(observation(current));}
  $('play').onclick=()=>{if(clock.playing)pause();else clock.play();};$('restart').onclick=()=>clock.seek(0);
  $('seek').oninput=event=>clock.seek(Number(event.target.value)/1000);$('speed').onchange=event=>clock.setSpeed(Number(event.target.value));
  for(const button of root.querySelectorAll('[data-lph-reaction-bookmark]'))button.onclick=()=>clock.seek(progressOf(button.dataset.lphReactionBookmark));
  $('fit').onclick=()=>viewer.fit();$('focus').onclick=()=>viewer.fit(['AC1','AO5','AC2','BO4','E1749Oreact','Ow']);
  for(const button of root.querySelectorAll('[data-lph-reaction-camera]'))button.onclick=()=>{const action=button.dataset.lphReactionCamera;['in','out'].includes(action)?viewer.zoomView(action==='in'?.8:1.25):viewer.orbitView(action==='left'?.22:-.22,0);};
  $('h').onchange=event=>{viewer.showH=event.target.checked;if(current)viewer.setFrame(current);};
  const visibility=()=>{if(clock.playing&&!visible())pause();};document.addEventListener('visibilitychange',visibility);
  const panel=root.closest('[data-lactase-panel]');if(panel){observer=new MutationObserver(visibility);observer.observe(panel,{attributes:true,attributeFilter:['hidden']});}
  const dispose=()=>{if(disposed)return;disposed=true;clock.dispose();viewer.dispose();observer?.disconnect();document.removeEventListener('visibilitychange',visibility);root.querySelectorAll('button,input,select').forEach(control=>{control.onclick=null;control.oninput=null;control.onchange=null;});};
  dispose.seek=(progress,options={})=>{if(disposed)return;clock.seek(progress);if(options.notify===true&&current)onObservation(observation(current));};
  dispose.pause=pause;dispose.getObservation=()=>current?observation(current):null;dispose.setStage=id=>clock.seek(progressOf(id));
  return dispose;
}
