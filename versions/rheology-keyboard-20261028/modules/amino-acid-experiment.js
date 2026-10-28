import {escapeHTML as esc} from './storage.js';
import {MoleculeViewer} from './viewer.js';
import {aminoAcidSpeciation,AMINO_ACID_PRESETS,AMINO_ACID_SOURCES,findIsoelectricPoint} from './amino-acid-model.js';

export const AMINO_ACID_EXPERIMENT_IDS=Object.freeze(['amino-acid-speciation']);
const colors=['#b98954','#739887','#758eaf','#9b87a8'];
const chargeText=q=>q>0?`+${q}`:q<0?`−${Math.abs(q)}`:'0';
export function aminoFractionText(fraction){
  if(typeof fraction!=='number'||!Number.isFinite(fraction)||fraction<0||fraction>1)throw new RangeError('Fraction must be in [0,1]');
  if(fraction>0&&fraction<.0005)return '<0.1%';
  if(fraction<1&&fraction>=.9995)return '>99.9%';
  return `${(fraction*100).toFixed(1)}%`;
}
const meanText=q=>Math.abs(q)<.0005?'≈ 0':`${q>0?'+':'−'}${Math.abs(q).toFixed(3)}`;
let serial=0;
export function mountAminoAcidExperiment(container,id){
  if(!AMINO_ACID_EXPERIMENT_IDS.includes(id))throw new RangeError('Unknown amino-acid experiment');
  const prefix=`amino-${++serial}`,$=s=>container.querySelector(s);
  const state={aminoAcidId:'alanine',pH:6.01,index:1,follow:true,group:null};
  let disposed=false,structures=null,viewer=null,shownStructure='',curveId='';
  container.innerHTML=`<section class="food-experiment amino-experiment" aria-labelledby="${prefix}-title">
    <header class="food-exp-heading"><p class="food-exp-kicker">從一個分子，看見一群分子</p><h3 id="${prefix}-title">pH 變了，電荷去哪裡？</h3><p class="food-exp-hint">移動 pH，再選一種電荷形態，旋轉看看它的官能基。</p></header>
    <div class="amino-toolbar"><div class="amino-choice" role="group" aria-label="選擇游離胺基酸">${Object.values(AMINO_ACID_PRESETS).map(a=>`<button type="button" data-amino-acid="${a.id}">${esc(a.label)}</button>`).join('')}</div><span class="amino-kind">游離 L-胺基酸 · 平衡教學模型</span></div>
    <div class="amino-layout"><div class="amino-molecule-panel"><div class="amino-scene-head"><span data-amino-name></span><span class="amino-integer">這個分子 <b data-amino-charge></b></span></div><div class="amino-viewer" aria-label="可用滑鼠或觸控旋轉的胺基酸代表結構"><p class="amino-loading">準備 3D 結構…</p></div><div class="amino-scene-tools"><span>拖曳旋轉 · 滾輪縮放</span><button type="button" data-amino-fit>重設視角</button></div><div class="amino-groups" role="group" aria-label="聚焦官能基"></div><p class="amino-group-reading" data-amino-group-reading>點選官能基，看看電荷標在哪裡。</p><details class="amino-display"><summary>顯示選項</summary><label><input type="checkbox" data-amino-h checked>顯示氫</label><label><input type="checkbox" data-amino-labels checked>原子標籤</label></details></div>
    <div class="amino-equilibrium"><div class="amino-ph-row"><label for="${prefix}-ph">溶液 pH</label><output data-amino-ph></output></div><input id="${prefix}-ph" data-amino-input type="range" min="0" max="14" step="0.005" value="6.01"><div class="amino-range-labels"><span>0 · 較酸</span><span>較鹼 · 14</span></div><div class="amino-shortcuts"><button type="button" data-amino-pi>移到等電點</button><span data-amino-pi-label></span></div><div class="amino-mean"><span>一群分子的平均淨電荷</span><output data-amino-mean></output><small>基本電荷 e／分子</small></div><div class="amino-fraction-heading"><span>各電荷形態的比例</span><button type="button" data-amino-follow>跟隨主要形態</button></div><div class="amino-fractions" role="group" aria-label="選擇要看的電荷形態"></div><p class="amino-follow-note" data-amino-follow-note></p><p class="amino-live sr-only" aria-live="polite" aria-atomic="true"></p></div></div>
    <div class="amino-equation-panel"><div class="amino-equation-top"><span>相鄰形態的酸鹼式</span><button type="button" data-amino-next>看下一次去質子化 →</button></div><div class="amino-equation" data-amino-equation></div><p class="amino-note" data-amino-equation-note></p></div>
    <details class="food-exp-details"><summary>沿著 pH 看平均電荷與 pKa</summary><div class="food-exp-details-body"><div class="amino-curve"></div><div class="amino-pka-shortcuts" role="group" aria-label="移到一個 pKa"></div><p class="amino-note" data-amino-ratio></p><p class="amino-note">在某個 pKa，相鄰兩形態濃度相等；其他形態仍可能存在，因此不一定各占總量 50%。</p><p class="amino-equation amino-math">αᵢ / αᵢ₋₁ = 10^(pH − pKaᵢ)<br>平均電荷 = Σ αᵢ qᵢ</p><p class="amino-note" data-amino-loss></p><p class="amino-note">平均失去質子數以全質子化形態為基準。這裡指定 pH，沒有起始溶液、濃度、加液或水解離衡算，所以不能換算成 NaOH 劑量。</p></div></details>
    <details class="food-exp-details"><summary>3D 結構、模型邊界與來源</summary><div class="food-exp-details-body"><p class="amino-note">比例依固定 pKa 計算，按總電荷分成宏觀形態。每一類用一種常見質子配置代表；它不是該類唯一的微觀形態，比例也不是特定 3D 構象的機率。</p><p class="amino-note">3D 為 RDKit 建立的孤立分子展示構象，未重建水溶液、溶劑接力或自由能。切換的是端點，不是反應軌跡。羧酸鹽畫出的是一個共振貢獻式；真實電荷與鍵並不只局限於畫出的那一側。</p><p class="amino-note">pKa 採固定教材值，未校正溫度、介質或離子強度。此模型適用於這三種游離胺基酸的教學，不能直接推算蛋白質 pI、聚集、溶解度或真實滴定曲線。</p><ul class="food-exp-sources">${AMINO_ACID_SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></div></details>
  </section>`;
  function setupChoices(){
    const preset=AMINO_ACID_PRESETS[state.aminoAcidId];
    $('.amino-fractions').innerHTML=Array.from({length:preset.pKas.length+1},(_,i)=>`<button type="button" data-amino-state="${i}" style="--amino-state:${colors[i]}"><span class="amino-state-charge">${chargeText(preset.fullyProtonatedCharge-i)}</span><span class="amino-fraction-track"><span></span></span><span class="amino-fraction-value"></span><span class="amino-selected-marker" aria-hidden="true">←</span></button>`).join('');
    $('.amino-pka-shortcuts').innerHTML=preset.pKas.map((p,i)=>`<button type="button" data-amino-pka="${i}">pKa${i+1} · ${p.toFixed(2)}</button>`).join('');
    setupGroups();
  }
  function setupGroups(){ $('.amino-groups').innerHTML=(structures?.aminoAcids[state.aminoAcidId].groups||[]).map(g=>`<button type="button" data-amino-group="${g.id}">${esc(g.label)}</button>`).join(''); }
  function structure(){return structures?.aminoAcids[state.aminoAcidId]?.states[state.index];}
  function showMolecule(force=false){
    const m=structure();if(!m)return;
    const group=structures.aminoAcids[state.aminoAcidId].groups.find(g=>g.id===state.group);
    if(viewer&&(force||shownStructure!==m.id)){viewer.setMolecule(m,{fit:!shownStructure,selected:group?.atoms||[]});shownStructure=m.id;}
    container.querySelectorAll('[data-amino-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.aminoGroup===state.group)));
    $('[data-amino-group-reading]').textContent=group?`${group.label} · 這個畫法的形式電荷合計 ${chargeText(m.atoms.filter(a=>group.atoms.includes(a.id)).reduce((s,a)=>s+(a.charge||0),0))}。`:'點選官能基，看看電荷標在哪裡。';
  }
  function drawCurve(r){
    if(curveId!==state.aminoAcidId){
      const x=p=>42+p/14*536,y=q=>22+(2-q)/4*136;
      const points=Array.from({length:281},(_,i)=>{const p=i*.05;return `${x(p).toFixed(2)},${y(aminoAcidSpeciation({aminoAcidId:state.aminoAcidId,pH:p}).meanCharge).toFixed(2)}`;}).join(' ');
      $('.amino-curve').innerHTML=`<svg viewBox="0 0 620 205" role="img" aria-label="平均電荷隨 pH 升高而降低，在等電點通過零。橫軸 pH 0 到 14；縱軸平均電荷正二到負二。"><path d="M42 22V158H578 M42 90H578" class="amino-axis"/>${[-2,0,2].map(q=>`<text x="31" y="${y(q)+4}" text-anchor="end">${chargeText(q)}</text>`).join('')}${[0,2,4,6,8,10,12,14].map(p=>`<text x="${x(p)}" y="181" text-anchor="middle">${p}</text>`).join('')}<text x="605" y="181" text-anchor="end">pH</text><polyline points="${points}" class="amino-charge-curve"/><line class="amino-pi-line" x1="${x(r.pI)}" x2="${x(r.pI)}" y1="22" y2="158"/><circle data-amino-curve-point r="5"/></svg>`;
      curveId=state.aminoAcidId;
    }
    const point=$('[data-amino-curve-point]');point.setAttribute('cx',String(42+r.pH/14*536));point.setAttribute('cy',String(22+(2-r.meanCharge)/4*136));
  }
  function draw(){
    const preset=AMINO_ACID_PRESETS[state.aminoAcidId],r=aminoAcidSpeciation(state);
    if(state.follow)state.index=r.dominantStateIndices[0];
    container.querySelectorAll('[data-amino-acid]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.aminoAcid===state.aminoAcidId)));
    $('[data-amino-name]').textContent=`L-${preset.label}`;
    $('[data-amino-charge]').textContent=chargeText(r.states[state.index].charge);
    $('[data-amino-ph]').textContent=state.pH.toFixed(3);
    $('[data-amino-input]').value=String(state.pH);
    $('[data-amino-input]').setAttribute('aria-valuetext',`pH ${state.pH.toFixed(3)}`);
    $('[data-amino-pi-label]').textContent=`模型 pI ≈ ${r.pI.toFixed(3)}`;
    $('[data-amino-mean]').textContent=meanText(r.meanCharge);
    $('[data-amino-follow]').setAttribute('aria-pressed',String(state.follow));
    for(const s of r.states){const b=$(`[data-amino-state="${s.index}"]`);b.setAttribute('aria-pressed',String(s.index===state.index));b.setAttribute('aria-label',`電荷 ${chargeText(s.charge)}，占 ${aminoFractionText(s.fraction)}，查看代表結構`);b.querySelector('.amino-fraction-track span').style.width=`${s.fraction*100}%`;b.querySelector('.amino-fraction-value').textContent=aminoFractionText(s.fraction);}
    $('[data-amino-follow-note]').textContent=state.follow?(r.dominantStateIndices.length>1?'相鄰兩形態並列最多；目前顯示其中一種。':'3D 正跟隨比例最多的形態；也可以點選其他列。'):'3D 已固定在你選的形態；pH 仍會改變整體比例。';
    const all=structures?.aminoAcids[state.aminoAcidId].states;
    const from=Math.min(state.index,r.states.length-2),to=from+1;
    $('[data-amino-equation]').innerHTML=all?`<span>${esc(all[from].condensed)}</span><span class="amino-equilibrium-arrow">⇌</span><span>${esc(all[to].condensed)} + H⁺</span>`:`${preset.macroStateLabels[from]} ⇌ ${preset.macroStateLabels[to]} + H⁺`;
    $('[data-amino-equation-note]').textContent=`pKa${to} = ${preset.pKas[from].toFixed(2)} · ${state.index===r.states.length-1?'目前在最去質子化端；上式顯示最後一次解離。':'每往右一步，少一個 H⁺，分子總電荷少 1。'} 這是平衡式，不是隨時間播放。`;
    $('[data-amino-next]').disabled=state.index===r.states.length-1;
    $('[data-amino-ratio]').textContent=`上式右／左形態的濃度比 = 10^(${state.pH.toFixed(3)} − ${preset.pKas[from].toFixed(2)})。全形態一起歸一化後，得到上方比例。`;
    $('[data-amino-loss]').textContent=`相對全質子化形態：平均失去 ${r.meanProtonsLost.toFixed(3)} 個質子／分子；每升高一個 pH 的局部變化率為 ${r.dMeanProtonsLostDpH.toFixed(3)}。這個斜率未乘上濃度，也未含水的貢獻，不是完整緩衝容量。`;
    $('.amino-live').textContent=`${preset.label}，pH ${state.pH.toFixed(3)}，平均電荷 ${meanText(r.meanCharge)}；所選代表分子電荷 ${chargeText(r.states[state.index].charge)}，此宏觀形態占 ${aminoFractionText(r.states[state.index].fraction)}。`;
    showMolecule();drawCurve(r);
  }
  const click=e=>{
    const b=e.target.closest?.('button');if(!b||!container.contains(b))return;
    if(b.dataset.aminoAcid){state.aminoAcidId=b.dataset.aminoAcid;state.follow=true;state.group=null;shownStructure='';setupChoices();draw();}
    else if(b.dataset.aminoState!==undefined){state.index=Number(b.dataset.aminoState);state.follow=false;draw();}
    else if(b.hasAttribute('data-amino-pi')){state.pH=findIsoelectricPoint(state.aminoAcidId);draw();}
    else if(b.dataset.aminoPka!==undefined){state.pH=AMINO_ACID_PRESETS[state.aminoAcidId].pKas[Number(b.dataset.aminoPka)];draw();}
    else if(b.hasAttribute('data-amino-follow')){state.follow=true;draw();}
    else if(b.hasAttribute('data-amino-next')){state.index=Math.min(state.index+1,AMINO_ACID_PRESETS[state.aminoAcidId].pKas.length);state.follow=false;draw();}
    else if(b.dataset.aminoGroup){state.group=state.group===b.dataset.aminoGroup?null:b.dataset.aminoGroup;showMolecule(true);}
    else if(b.hasAttribute('data-amino-fit'))viewer?.fit();
  };
  const input=e=>{if(disposed)return;if(e.target.hasAttribute?.('data-amino-input')){state.pH=Number(e.target.value);draw();}};
  const change=e=>{if(!viewer)return;if(e.target.hasAttribute?.('data-amino-h')){viewer.showH=e.target.checked;showMolecule(true);}if(e.target.hasAttribute?.('data-amino-labels')){viewer.showLabels=e.target.checked;showMolecule(true);}};
  container.addEventListener('click',click);container.addEventListener('input',input);container.addEventListener('change',change);
  setupChoices();draw();
  fetch(new URL('../data/amino-acid-structures.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Structure data unavailable');return r.json();}).then(data=>{
    if(disposed)return;structures=data;setupGroups();
    try {viewer=new MoleculeViewer($('.amino-viewer'),{onAtom:atom=>{const g=structures.aminoAcids[state.aminoAcidId].groups.find(group=>group.atoms.includes(atom.id));if(g){state.group=g.id;showMolecule(true);}}});viewer.showH=$('[data-amino-h]').checked;viewer.showLabels=$('[data-amino-labels]').checked;$('.amino-loading')?.remove();draw();}
    catch {viewer?.dispose();viewer=null;$('.amino-viewer').innerHTML='<p class="amino-loading">此裝置無法顯示 3D；下方結構式與比例仍可操作。</p>';draw();}
  }).catch(()=>{if(!disposed)$('.amino-viewer').innerHTML='<p class="amino-loading">3D 結構尚未載入，請重新整理。電荷比例仍可操作。</p>';});
  return ()=>{disposed=true;viewer?.dispose();container.removeEventListener('click',click);container.removeEventListener('input',input);container.removeEventListener('change',change);};
}
