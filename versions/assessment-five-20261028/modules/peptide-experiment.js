import {escapeHTML as esc} from './storage.js';
import {MoleculeViewer} from './viewer.js';
import {peptideHydrolysis,PEPTIDE_PRESETS,PEPTIDE_AMINO_ACIDS,PEPTIDE_SOURCES,classifyPeptideBond} from './peptide-model.js';
export const PEPTIDE_EXPERIMENT_IDS=Object.freeze(['peptide-hydrolysis']);
const structureKey=cuts=>cuts.join('-')||'intact';
const sub=text=>String(text).replace(/[0-9]/g,c=>'₀₁₂₃₄₅₆₇₈₉'[Number(c)]);
const sequenceLabel=seq=>[...seq].map(a=>PEPTIDE_AMINO_ACIDS[a].threeLetter).join('–');
export function evaluatePeptideWater(placement){
  return placement==='carbon-oh'?{valid:true,message:'羰基碳補上 OH，醯胺氮補上 H；得到新的羧端與胺端。'}:{valid:false,message:placement==='nitrogen-oh'?'再看羰基：形式水解後，碳端成為 –COOH，氮端成為 –NH₂。把 OH 接到氮上不是本題的肽水解產物。':'先決定水的 OH 與 H 分別補到哪一端。'};
}
const owners=new WeakMap(),mounted=new WeakMap();
const INITIAL_FEEDBACK='先在鏈上或 3D 選一條尚未斷開的鍵。';
function newDraft(){return {state:{peptideId:'gas',cuts:[],history:[],pending:null,placement:'',fragment:'all',water:true,showH:false,showLabels:true,bondChoice:'',feedback:INITIAL_FEEDBACK},details:{},camera:null,active:null};}
function draftFor(owner,key){
  if(owner===null||!['object','function'].includes(typeof owner))return newDraft();
  let drafts=owners.get(owner);if(!drafts)owners.set(owner,drafts=new Map());
  if(!drafts.has(key))drafts.set(key,newDraft());return drafts.get(key);
}
let serial=0;
export function mountPeptideExperiment(container,id,{draftOwner,draftKey=id}={}){
  if(!PEPTIDE_EXPERIMENT_IDS.includes(id))throw new RangeError('Unknown peptide activity');
  const d=draftFor(draftOwner,draftKey);mounted.get(container)?.();d.active?.();
  const prefix=`peptide-${++serial}`,$=s=>container.querySelector(s);
  const state=d.state;
  let assets=null,viewer=null,disposed=false,shown='',fitNext=true;
  container.innerHTML=`<section class="food-experiment peptide-experiment" aria-labelledby="${prefix}-title"><header class="food-exp-heading"><h3 id="${prefix}-title">切肽鍵，追蹤水的去向</h3></header><div class="peptide-toolbar"><label for="${prefix}-sequence">要觀察的短肽<select id="${prefix}-sequence" data-peptide-preset>${Object.values(PEPTIDE_PRESETS).map(p=>`<option value="${p.id}">${esc(sequenceLabel(p.sequence))}</option>`).join('')}</select></label><span>形式中性結構 · 不代表水溶液的 pH 形態</span></div><div class="peptide-layout"><div class="peptide-visual"><div class="peptide-scene-head"><span data-peptide-scene-title></span><span data-peptide-formula></span></div><div class="peptide-ledger" aria-live="polite"></div><div class="peptide-viewer" aria-label="可旋轉的短肽與水解片段；可點選鍵"><p class="peptide-loading">準備 3D 結構…</p></div><div class="peptide-camera"><span>拖曳旋轉 · 點鍵選取</span><button type="button" data-peptide-fit>重設視角</button></div><div class="peptide-fragments" role="group" aria-label="查看產物片段"></div><div class="peptide-result"><p class="peptide-net-equation" data-peptide-equation></p></div><details class="peptide-display" data-peptide-detail="display"><summary>原子與顯示選項</summary><label><input data-peptide-water type="checkbox" checked>標出水帶入的原子</label><label><input data-peptide-h type="checkbox">顯示全部氫</label><label><input data-peptide-labels type="checkbox" checked>重點原子標籤</label><p>選中的鍵端與水來源原子會標亮；W 開頭的編號來自水。片段間距只為排版，沒有模擬擴散或質子／氧交換。</p></details></div><div class="peptide-actions"><div class="peptide-step-caption"><span>01</span><h4>選一個斷點</h4></div><div class="peptide-chain" role="group" aria-label="依 N 到 C 端選擇肽鍵"></div><p class="peptide-direction">序列由 N 端 → C 端；原殘基編號保留。</p><details class="peptide-bond-picker" data-peptide-detail="backbone"><summary>從完整骨架選鍵</summary><label for="${prefix}-bond">選一條骨架鍵</label><select id="${prefix}-bond" data-peptide-bond></select><p>可比較 C–N、N–Cα、Cα–C 與 C=O；元素相同不代表連接角色相同。</p></details><div class="peptide-step-caption"><span>02</span><h4>把水補到兩端</h4></div><p class="peptide-selected" data-peptide-selected></p><fieldset class="peptide-water-choices"><legend class="peptide-sr">形式水解後水的去向</legend><label><input type="radio" name="${prefix}-water" value="carbon-oh" data-peptide-placement>羰基碳補 OH · 氮補 H</label><label><input type="radio" name="${prefix}-water" value="nitrogen-oh" data-peptide-placement>羰基碳補 H · 氮補 OH</label></fieldset><button type="button" class="peptide-apply" data-peptide-apply>完成這一次水解 →</button><p class="peptide-feedback" aria-live="polite" data-peptide-feedback>先在鏈上或 3D 選一條尚未斷開的鍵。</p><div class="peptide-history"><button type="button" data-peptide-undo>撤回上一刀</button><button type="button" data-peptide-reset>從完整短肽重來</button></div></div></div><details class="food-exp-details" data-peptide-detail="balance"><summary>分子式與完整原子收支</summary><div class="food-exp-details-body"><p class="peptide-note" data-peptide-local-equation></p><p class="peptide-net-equation" data-peptide-formula-equation></p><table class="peptide-atom-table"><caption>反應物與產物的元素總數</caption><thead><tr><th>元素</th><th>反應物</th><th>產物</th></tr></thead><tbody></tbody></table><p class="peptide-note">每斷一條本題的直鏈 α 肽鍵，形式上消耗一分子水，多一個 N 端、一個 C 端，片段數加一。側鏈的胺與羧酸不算自由主鏈末端。</p></div></details><details class="food-exp-details" data-peptide-detail="scope"><summary>模型條件與科學來源</summary><div class="food-exp-details-body"><p class="peptide-note">你指定切口；本模型核對正常 α 肽鍵、片段序列與形式中性產物的原子收支。切斷不需要等待，不能推論反應快慢、特定蛋白酶專一性或實際水解條件。</p><p class="peptide-note">3D 是 RDKit 建立的孤立展示構象。水的 O、H 編號是一種形式映射；沒有催化劑、溶劑接力、同位素追蹤或酸鹼形態計算。各端點直接切換，不插值成反應軌跡。</p><p class="peptide-note">肽鍵具有醯胺共振與受限旋轉；這裡可以旋轉整個視角，沒有把肽 C–N 當自由旋轉單鍵。題設短肽也沒有二硫鍵、環肽或異肽鍵。</p><ul class="food-exp-sources">${PEPTIDE_SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></div></details></section>`;
  const current=()=>assets?.peptides[state.peptideId]?.states[structureKey(state.cuts)];
  const sceneKey=()=>`${state.peptideId}/${structureKey(state.cuts)}/${state.fragment}`;
  const requestFit=()=>{fitNext=true;d.camera=null;};
  function feedback(text){state.feedback=text;$('[data-peptide-feedback]').textContent=text;}
  function selectBond(a,b){
    if(disposed)return;
    const cut=classifyPeptideBond({peptideId:state.peptideId,a,b});
    if(cut===null){state.pending=null;feedback('這不是連接相鄰殘基的醯胺 C–N。找前一殘基的羰基碳，與下一殘基的主鏈氮。');}
    else if(state.cuts.includes(cut)){state.pending=null;feedback('這條肽鍵已斷開；可以選另一個斷點，或撤回上一刀。');}
    else {
      state.pending=cut;state.placement='';
      container.querySelectorAll('[data-peptide-placement]').forEach(x=>x.checked=false);
      state.bondChoice=`${cut}:C:Nnext`;$('[data-peptide-bond]').value=state.bondChoice;
      const fragment=peptideHydrolysis({peptideId:state.peptideId,cuts:state.cuts}).fragments[Number(state.fragment)];
      if(state.fragment!=='all'&&(!fragment||fragment.from>cut||fragment.to<cut+1)){state.fragment='all';requestFit();}
      feedback(`已選第 ${cut} 與 ${cut+1} 個殘基之間的肽鍵。接著決定水的去向。`);
    }
    draw();
  }
  function setupChain(){
    const seq=PEPTIDE_PRESETS[state.peptideId].sequence;
    $('.peptide-chain').innerHTML=[...seq].map((a,i)=>`<span class="peptide-residue"><b>${PEPTIDE_AMINO_ACIDS[a].threeLetter}</b><small>${i+1}</small></span>${i<seq.length-1?`<button type="button" data-peptide-cut="${i+1}" aria-label="選擇第 ${i+1} 與 ${i+2} 個殘基之間的 C–N 肽鍵">C–N</button>`:''}`).join('');
    $('[data-peptide-bond]').innerHTML='<option value="">選擇一條鍵…</option>'+[...seq].map((a,i)=>{const r=i+1;return `<optgroup label="${r} · ${PEPTIDE_AMINO_ACIDS[a].threeLetter}"><option value="${r}:N:CA">N${r}–Cα${r}</option><option value="${r}:CA:C">Cα${r}–C${r}</option><option value="${r}:C:O">C${r}=O${r}</option>${r<seq.length?`<option value="${r}:C:Nnext">C${r}–N${r+1}</option>`:''}</optgroup>`;}).join('');
  }
  function drawSelection(){
    container.querySelectorAll('[data-peptide-cut]').forEach(b=>{const n=Number(b.dataset.peptideCut),cut=state.cuts.includes(n);b.setAttribute('aria-pressed',String(n===state.pending));b.disabled=cut;b.textContent=cut?'⋮':'C–N';b.setAttribute('aria-label',`第 ${n} 與 ${n+1} 個殘基之間的 C–N 肽鍵${cut?'：已水解':'：選擇斷開'}`);});
    $('[data-peptide-selected]').textContent=state.pending?`C${state.pending}(=O)–N${state.pending+1} → 新的羧端＋胺端`:'尚未選擇可水解的肽鍵。';
    $('[data-peptide-apply]').disabled=state.pending===null;
    $('[data-peptide-undo]').disabled=state.history.length===0;
  }
  function sceneMolecule(){const full=current();if(!full)return null;if(state.fragment==='all')return full;return full.fragments[Number(state.fragment)]||full;}
  function drawScene(){
    if(disposed)return;
    const m=sceneMolecule();if(!m)return;
    const k=`${state.peptideId}/${structureKey(state.cuts)}/${state.fragment}/${state.pending}/${state.water}/${$('[data-peptide-h]').checked}/${$('[data-peptide-labels]').checked}`;
    if(!viewer||k===shown)return;
    viewer.showH=$('[data-peptide-h]').checked;viewer.showLabels=$('[data-peptide-labels]').checked;viewer.labelsOnlySelected=true;
    const selected=m.atoms.filter(a=>(state.water&&a.id.startsWith('W'))||(state.pending!==null&&(a.id===`R${state.pending}.C`||a.id===`R${state.pending+1}.N`))).map(a=>a.id);
    const visibleIds=new Set(m.atoms.map(a=>a.id));
    const bond=state.pending&&visibleIds.has(`R${state.pending}.C`)&&visibleIds.has(`R${state.pending+1}.N`)?{a:`R${state.pending}.C`,b:`R${state.pending+1}.N`}:null;
    viewer.setMolecule(m,{fit:fitNext,selected,bond});fitNext=false;shown=k;
    if(d.camera?.scene===sceneKey()){viewer.restoreCameraState?.(d.camera.view);d.camera=null;}
  }
  function draw(){
    const r=peptideHydrolysis({peptideId:state.peptideId,cuts:state.cuts}),seq=PEPTIDE_PRESETS[state.peptideId].sequence;
    $('[data-peptide-scene-title]').textContent=state.fragment==='all'?`${r.fragments.length} 個片段`:`片段 ${Number(state.fragment)+1} · ${sequenceLabel(r.fragments[Number(state.fragment)].sequence)}`;
    $('[data-peptide-formula]').textContent=state.fragment==='all'?(r.fragments.length===1?sub(r.initialFormula):'N → C 編號保留'):sub(r.fragments[Number(state.fragment)].formula);
    $('.peptide-fragments').innerHTML=`<button type="button" data-peptide-fragment="all" aria-pressed="${state.fragment==='all'}">全體</button>`+r.fragments.map((f,i)=>`<button type="button" data-peptide-fragment="${i}" aria-pressed="${state.fragment===String(i)}">${esc(sequenceLabel(f.sequence))}<small>${f.from}–${f.to}</small></button>`).join('');
    const water=r.consumedWater.count;
    $('[data-peptide-equation]').textContent=water?`${sequenceLabel(seq)} + ${water===1?'':water}H₂O → ${r.fragments.map(f=>sequenceLabel(f.sequence)).join(' + ')}`:`${sequenceLabel(seq)} · 尚未水解`;
    $('.peptide-ledger').innerHTML=[['已用水',water,'分子'],['剩餘肽鍵',r.remainingPeptideBonds,'條'],['N 端',r.nTerminusCount,'個'],['C 端',r.cTerminusCount,'個']].map(([l,v,u])=>`<div><span>${l}</span><strong>${v}<small>${u}</small></strong></div>`).join('');
    $('[data-peptide-local-equation]').textContent='局部形式式：–C(=O)–NH– + H₂O → –C(=O)OH + H₂N–';
    $('[data-peptide-formula-equation]').textContent=water?`${sub(r.initialFormula)} + ${water===1?'':water}H₂O → ${r.fragments.map(f=>sub(f.formula)).join(' + ')}`:sub(r.initialFormula);
    $('.peptide-atom-table tbody').innerHTML=['C','H','N','O'].map(e=>`<tr><th>${e}</th><td>${r.balance.reactantAtoms[e]}</td><td>${r.balance.productAtoms[e]}</td></tr>`).join('');
    drawSelection();drawScene();
  }
  function reset(){state.cuts=[];state.history=[];state.pending=null;state.placement='';state.bondChoice='';state.fragment='all';requestFit();container.querySelectorAll('[data-peptide-placement]').forEach(x=>x.checked=false);setupChain();feedback('先在鏈上或 3D 選一條尚未斷開的鍵。');draw();}
  const click=e=>{if(disposed)return;const b=e.target.closest?.('button');if(!b||!container.contains(b))return;
    if(b.dataset.peptideCut){const n=Number(b.dataset.peptideCut);selectBond({residueIndex:n,role:'backbone-carbonyl-C'},{residueIndex:n+1,role:'backbone-N'});}
    else if(b.hasAttribute('data-peptide-apply')){if(state.pending===null)return;const answer=evaluatePeptideWater(state.placement);feedback(answer.message);if(!answer.valid)return;state.history.push(state.pending);state.cuts=[...state.history].sort((a,b)=>a-b);state.pending=null;state.placement='';state.fragment='all';requestFit();container.querySelectorAll('[data-peptide-placement]').forEach(x=>x.checked=false);state.bondChoice='';$('[data-peptide-bond]').value='';draw();}
    else if(b.dataset.peptideFragment!==undefined){
      state.fragment=b.dataset.peptideFragment;requestFit();
      const fragment=peptideHydrolysis({peptideId:state.peptideId,cuts:state.cuts}).fragments[Number(state.fragment)];
      if(state.pending!==null&&state.fragment!=='all'&&(!fragment||fragment.from>state.pending||fragment.to<state.pending+1)){
        state.pending=null;state.placement='';container.querySelectorAll('[data-peptide-placement]').forEach(x=>x.checked=false);state.bondChoice='';$('[data-peptide-bond]').value='';
        feedback('已切換到另一個片段。請重新選擇要觀察的肽鍵。');
      }
      draw();$(`[data-peptide-fragment="${state.fragment}"]`)?.focus();
    }
    else if(b.hasAttribute('data-peptide-undo')){state.history.pop();state.cuts=[...state.history].sort((a,b)=>a-b);state.pending=null;state.placement='';state.fragment='all';requestFit();container.querySelectorAll('[data-peptide-placement]').forEach(x=>x.checked=false);state.bondChoice='';$('[data-peptide-bond]').value='';feedback('已回到前一次結構。');draw();}
    else if(b.hasAttribute('data-peptide-reset'))reset();else if(b.hasAttribute('data-peptide-fit')){d.camera=null;viewer?.fit();}
  };
  const change=e=>{if(disposed)return;const t=e.target;
    if(t.hasAttribute?.('data-peptide-preset')){state.peptideId=t.value;reset();}
    else if(t.hasAttribute?.('data-peptide-placement'))state.placement=t.value;
    else if(t.hasAttribute?.('data-peptide-bond')&&t.value){state.bondChoice=t.value;const [number,a,b]=t.value.split(':'),r=Number(number);const role=name=>name==='C'?'backbone-carbonyl-C':name==='N'||name==='Nnext'?'backbone-N':'other';selectBond({residueIndex:r,role:role(a)},{residueIndex:b==='Nnext'?r+1:r,role:role(b)});}
    else if(t.hasAttribute?.('data-peptide-water')){state.water=t.checked;drawScene();}
    else if(t.hasAttribute?.('data-peptide-h')){state.showH=t.checked;drawScene();}
    else if(t.hasAttribute?.('data-peptide-labels')){state.showLabels=t.checked;drawScene();}
  };
  const toggle=e=>{if(disposed)return;const key=e.target.dataset?.peptideDetail;if(key)d.details[key]=e.target.open;};
  function dispose(){
    if(disposed)return;
    if(viewer&&!fitNext){const view=viewer.cameraState?.();if(view)d.camera={scene:sceneKey(),view};}
    container.querySelectorAll('[data-peptide-detail]').forEach(node=>d.details[node.dataset.peptideDetail]=node.open);
    disposed=true;viewer?.dispose();container.removeEventListener('click',click);container.removeEventListener('change',change);container.removeEventListener('toggle',toggle,true);
    if(d.active===dispose)d.active=null;if(mounted.get(container)===dispose)mounted.delete(container);
  }
  container.addEventListener('click',click);container.addEventListener('change',change);container.addEventListener('toggle',toggle,true);
  mounted.set(container,dispose);d.active=dispose;
  $('[data-peptide-preset]').value=state.peptideId;$('[data-peptide-water]').checked=state.water;
  $('[data-peptide-h]').checked=state.showH;$('[data-peptide-labels]').checked=state.showLabels;
  container.querySelectorAll('[data-peptide-placement]').forEach(node=>node.checked=node.value===state.placement);
  container.querySelectorAll('[data-peptide-detail]').forEach(node=>node.open=!!d.details[node.dataset.peptideDetail]);
  setupChain();$('[data-peptide-bond]').value=state.bondChoice;feedback(state.feedback);draw();
  fetch(new URL('../data/peptide-structures.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('Structure unavailable');return r.json();}).then(data=>{if(disposed)return;assets=data;
    try {viewer=new MoleculeViewer($('.peptide-viewer'),{onBond:b=>{if(disposed)return;const m=sceneMolecule();selectBond(m.atoms.find(a=>a.id===b.a),m.atoms.find(a=>a.id===b.b));}});$('.peptide-loading')?.remove();drawScene();}
    catch {viewer?.dispose();viewer=null;$('.peptide-viewer').innerHTML='<p class="peptide-loading">3D 無法顯示，仍可用右側／下方的鏈與骨架選單操作。</p>';}
  }).catch(()=>{if(!disposed)$('.peptide-viewer').innerHTML='<p class="peptide-loading">結構未載入，請重新整理；序列與原子收支仍可操作。</p>';});
  return dispose;
}
