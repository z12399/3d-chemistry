import {MoleculeViewer} from './viewer.js';
import {escapeHTML as esc} from './storage.js';
import {mountLactaseReactionPlayer} from './lactase-reaction-player.js';

let sequence=0;
const BRIDGE=['AC1','BO4','BC4'];
const CATALYTIC_SOURCE='https://pmc.ncbi.nlm.nih.gov/articles/PMC4271221/';

export const LACTASE_CATALYTIC_STAGES=Object.freeze([
  {
    id:'binding',title:'1 · 辨認乳糖的糖苷鍵',focus:'bridge',
    equation:'Gal–C1–O–C4–Glc → 乳糖進入乳糖酶的活性部位',
    explanation:'乳糖的半乳糖（Gal）以 C1 接到葡萄糖（Glc）的 O4，形成 β(1→4) 糖苷鍵。要水解的是 Gal C1–橋氧這條鍵；兩個糖環不會被劈開。',
    acid:'E1538：準備以酸的角色協助橋氧離去。',
    nucleophile:'E1749：羧酸根氧是進攻 Gal C1 的親核部位。',
    geometry:'左圖：反應前乳糖、水與兩個 Glu 羧基端基類比片段，分開排列。這是獨立建構的有限化學模型，沒有把乳糖放進預測蛋白質；它不代表人類酵素的結合姿勢。',
    modelIndex:0,selected:['AC1','BO4','BC4','E1749Oreact','E1538Oreact'],productSelected:[],bond:['AC1','BO4']
  },
  {
    id:'glycosylation',title:'2 · 形成酵素–半乳糖中間體',focus:'nucleophile',
    equation:'E1749–O⁻ + Gal–C1–O–Glc → E1749–O–C1–Gal + Glc–OH',
    explanation:'E1538 提供質子，協助葡萄糖端的橋氧離去；E1749 的羧酸根氧攻擊 Gal C1。葡萄糖釋出，半乳糖暫時與 E1749 共價相連。第一次取代使 Gal C1 由 β 變成 α 糖基–酵素中間體。',
    acid:'E1538：酸，協助離去基團接受質子。',
    nucleophile:'E1749：形成短暫的 Gal C1–O–Glu 共價鍵。',
    geometry:'左圖已換成共價中間體：Gal C1–E1749 羧基氧有實際模型鍵，原本 Gal C1–BO4 已消失，Glc 已分開。Gal C1 為 α。有限片段座標經化學立體檢查；不是人體原位中間體結構。',
    modelIndex:1,selected:['AC1','E1749Oreact','BO4','E1538Oreact'],productSelected:['B-C4','B-O4'],bond:['AC1','E1749Oreact']
  },
  {
    id:'deglycosylation',title:'3 · 水解除共價中間體',focus:'water',
    equation:'H₂O + E1749–O–C1–Gal → Gal–C1–OH + E1749–O⁻',
    explanation:'E1538 改作鹼，協助水成為親核進攻者。水的氧攻擊 Gal C1，解除 Gal 與 E1749 的連接。第二次取代再反轉一次，因此立即生成的半乳糖回到 β 配置。',
    acid:'E1538：鹼，協助水的親核進攻。',
    nucleophile:'E1749：解除糖基連接，恢復可參與下一輪的狀態。',
    geometry:'左圖仍是進攻前的 α 共價中間體，這次標出水氧 Ow、水氫 Hwa 及 E1538 的羧基氧，對照水解反應。水仍為中性 H₂O；沒有把它偽裝成已生成的 OH⁻ 或過渡態。下一步可核對斷開的共價鍵與新形成的 Gal C1–Ow。',
    modelIndex:1,selected:['AC1','E1749Oreact','Ow','Hwa','E1538Oreact'],productSelected:['G-C1','G-O1'],bond:['AC1','E1749Oreact']
  },
  {
    id:'products',title:'4 · 兩個單糖釋出，酵素再用',focus:'products',
    equation:'乳糖 + H₂O → D-半乳糖 + D-葡萄糖；乳糖酶再生',
    explanation:'右側現在標出兩個產物的羥基：半乳糖 Gal C1–OH，以及保留橋氧的葡萄糖 Glc C4–OH。Gal C1 經兩次反轉而淨保留 β；所選的 Glc β 還原端沒有參與斷鍵。釋出後，兩個單糖可各自變旋。',
    acid:'E1538：可再次參與酸／鹼催化。',
    nucleophile:'E1749：可再次攻擊下一個乳糖分子。',
    geometry:'左圖已換成反應後的有限模型：Gal C1–E1749 解除，水氧 Ow 成為 Gal C1 的羥基氧；兩個 Glu 端基類比恢復酸／鹼催化的形式。右圖提供兩個獨立單糖端點參考。左圖保留原子帳，右圖的標籤不作跨圖同位素追蹤。',
    modelIndex:2,selected:['AC1','Ow','BO4','BC4','E1749Oreact'],productSelected:['G-C1','G-O1','B-C4','B-O4'],bond:['AC1','Ow']
  }
]);

function requireMolecule(data,id,expected){
  const molecule=data?.molecules?.find(item=>item.id===id);
  const fail=()=>{throw new TypeError('乳糖水解的分子座標或原子連接不完整。');};
  if(!molecule||!Array.isArray(molecule.atoms)||!Array.isArray(molecule.bonds))fail();
  const atomIds=new Set(),counts={};
  for(const atom of molecule.atoms){
    if(typeof atom.id!=='string'||atomIds.has(atom.id)||!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(Number.isFinite))fail();
    atomIds.add(atom.id);counts[atom.element]=(counts[atom.element]||0)+1;
  }
  if(Object.keys(counts).length!==Object.keys(expected).length||Object.entries(expected).some(([element,count])=>counts[element]!==count))fail();
  const bondIds=new Set();
  for(const bond of molecule.bonds){
    const key=[bond.a,bond.b].sort().join('|');
    if(bond.a===bond.b||!atomIds.has(bond.a)||!atomIds.has(bond.b)||![1,2,3].includes(bond.order)||bondIds.has(key))fail();
    bondIds.add(key);
  }
  return molecule;
}

/** The mapped lactose source preserves Gal-C1 / Glc-O4 / Glc-C4 identities. */
export function validateLactaseChemistry(lactoseData,reactionData,sugarData){
  const lactose=requireMolecule(lactoseData,'lactose-reducing-closed',{C:12,H:22,O:11});
  const galactose=requireMolecule(reactionData,'galactose-beta',{C:6,H:12,O:6});
  const glucose=requireMolecule(sugarData,'glucose-beta',{C:6,H:12,O:6});
  const hasBond=(m,a,b)=>m.bonds.some(bond=>bond.order===1&&((bond.a===a&&bond.b===b)||(bond.a===b&&bond.b===a)));
  const byId=new Map(lactose.atoms.map(atom=>[atom.id,atom]));
  if(byId.get('AC1')?.element!=='C'||byId.get('BO4')?.element!=='O'||byId.get('BC4')?.element!=='C'||!hasBond(lactose,'AC1','BO4')||!hasBond(lactose,'BO4','BC4'))throw new TypeError('乳糖的 β(1→4) 原子對照不一致。');
  if(!hasBond(galactose,'C1','O1')||!hasBond(glucose,'C4','O4'))throw new TypeError('單糖產物的羥基原子對照不一致。');
  return {lactose,galactose,glucose};
}

/** Separate endpoint references; no invented protein docking or reaction interpolation. */
export function createLactaseProductsReference(galactose,glucose){
  const parts=[[galactose,'G',-4.6],[glucose,'B',4.6]],atoms=[],bonds=[];
  for(const [molecule,prefix,offset] of parts){
    const center=[0,1,2].map(axis=>{
      const positions=molecule.atoms.map(atom=>atom.position[axis]);
      return (Math.min(...positions)+Math.max(...positions))/2;
    });
    atoms.push(...molecule.atoms.map(atom=>({...atom,id:`${prefix}-${atom.id}`,position:atom.position.map((value,axis)=>value-center[axis]+(axis===0?offset:0))})));
    bonds.push(...molecule.bonds.map(bond=>({...bond,a:`${prefix}-${bond.a}`,b:`${prefix}-${bond.b}`})));
  }
  return {id:'human-lactase-independent-product-references',name:'β-D-半乳糖與所選 β-D-葡萄糖的獨立端點',formula:'C12H24O12',atoms,bonds};
}

const bondBetween=(state,a,b)=>state.bonds.find(bond=>bond.a===a&&bond.b===b||bond.a===b&&bond.b===a)?.order||0;
function tetrahedralParity(state,substituent){
  const atoms=new Map(state.atoms.map(atom=>[atom.id,atom.position]));
  const base=atoms.get(substituent),vectors=['AC2','AO5','AHC1'].map(id=>atoms.get(id).map((value,index)=>value-base[index]));
  const [a,b,c]=vectors;
  return a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]);
}

/** Reject wrong atom maps, false protein provenance, or lost Gal-C1 inversions. */
export function validateHumanLphLocalMechanism(data){
  const model=data?.mechanisms?.[0];
  const fail=()=>{throw new TypeError('乳糖酶的有限化學模型未通過原子、鍵或立體配置核對。');};
  if(data?.schemaVersion!==1||data.mechanisms.length!==1||model?.variantId!=='human-lph-local-retaining-teaching'||model.kind!=='generic retaining-glycosidase finite chemical teaching model'||model.isTrajectory!==false||model.proteinGeometry!==false||!Array.isArray(model.states)||model.states.length!==3)fail();
  if(model.residueRoleEvidence?.generalAcidBase!=='human LPH E1538'||model.residueRoleEvidence?.nucleophile!=='human LPH E1749'||typeof model.softwareOrigin!=='string'||!Array.isArray(model.sources)||model.sources.some(source=>source.url.includes('rcsb.org/structure')))fail();
  let atomIdentity=null;
  for(const state of model.states){
    const checked=requireMolecule({molecules:[state]},state.id,{C:18,H:35,O:16});
    const map=new Map(checked.atoms.map(atom=>[atom.id,atom]));
    const identity=checked.atoms.map(atom=>`${atom.id}:${atom.element}`).sort().join('|');
    if(atomIdentity!==null&&identity!==atomIdentity)fail();atomIdentity=identity;
    if(state.formula!=='C18H35O16-'||state.atoms.reduce((sum,atom)=>sum+(atom.formalCharge??0),0)!==-1||bondBetween(state,'BO4','BC4')!==1)fail();
    if(state.metadata?.isTrajectory!==false||state.metadata?.softwareOrigin!==model.softwareOrigin||state.metadata?.geometry!=='independently generated capped chemical fragments arranged in separated slots; no human protein coordinates, binding pose, or trajectory'||!Number.isFinite(state.metadata?.minimumInterfragmentDistanceAngstrom)||state.metadata.minimumInterfragmentDistanceAngstrom<=2.5)fail();
    for(const id of ['AC1','AC2','AO5','AHC1','BO4','BC4','Ow','Hwa','Hwb','E1749Oreact','E1538Oreact','E1538Hacid'])if(!map.has(id))fail();
  }
  const expectBond=(a,b,orders)=>{if(model.states.some((state,index)=>bondBetween(state,a,b)!==orders[index]))fail();};
  expectBond('AC1','BO4',[1,0,0]);expectBond('AC1','E1749Oreact',[0,1,0]);expectBond('AC1','Ow',[0,0,1]);
  expectBond('E1538Oreact','E1538Hacid',[1,0,0]);expectBond('BO4','E1538Hacid',[0,1,1]);
  expectBond('Ow','Hwa',[1,1,0]);expectBond('E1538Oreact','Hwa',[0,0,1]);expectBond('Ow','Hwb',[1,1,1]);
  for(const [id,charges] of [['E1749Oreact',[-1,0,-1]],['E1538Oreact',[0,-1,0]]])if(model.states.some((state,index)=>state.atoms.find(atom=>atom.id===id).formalCharge!==charges[index]))fail();
  const parities=model.states.map((state,index)=>tetrahedralParity(state,['BO4','E1749Oreact','Ow'][index]));
  if(parities.some(value=>!Number.isFinite(value)||Math.abs(value)<.1)||Math.sign(parities[0])===Math.sign(parities[1])||Math.sign(parities[0])!==Math.sign(parities[2]))fail();
  return model;
}

/** Returns immediately; abort and WebGL disposal belong to the host route. */
export function mountLactaseCatalyticLab(root,{fetcher=globalThis.fetch,onStage=()=>{},initialStage='binding',initialProgress=null}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  const prefix=`lph-chemistry-${++sequence}`;
  let disposed=false,epoch=0,aborter=null,chemistry=null,localModel=null,products=null,viewers=[],stageIndex=0,showH=false,renderMode='ball',continuousDispose=null;
  stageIndex=Math.max(0,LACTASE_CATALYTIC_STAGES.findIndex(stage=>stage.id===initialStage));
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  root.innerHTML=`<section class="lph-catalytic-lab" aria-labelledby="${prefix}-title">
    <header class="lph-catalytic-heading lph-catalytic-sr-only"><p class="lph-molecular-eyebrow">把蛋白質活性部位，接回你熟悉的糖分子</p><h3 id="${prefix}-title">乳糖酶如何切開乳糖？</h3></header>
    <div data-lph-continuous-host></div>
    <p class="lph-catalytic-status" data-lph-catalytic-status role="status">正在讀取既有糖分子的座標與原子對照…</p><button type="button" data-lph-catalytic-retry hidden>重試載入分子</button>
    <details class="lph-static-details"><summary>核對四個化學狀態、單糖端點與催化來源</summary>
    <div class="lph-catalytic-stages" role="group" aria-label="人類乳糖酶催化的四個步驟">${LACTASE_CATALYTIC_STAGES.map((stage,index)=>`<button type="button" data-lph-catalytic-stage="${stage.id}" aria-pressed="${index===0}">${esc(stage.title)}</button>`).join('')}</div>
    <div class="lph-catalytic-current" aria-live="polite"><h4 data-lph-catalytic-title></h4><p class="lph-catalytic-equation" data-lph-catalytic-equation></p><p data-lph-catalytic-explanation></p><div class="lph-catalytic-residues"><p data-lph-catalytic-acid></p><p data-lph-catalytic-nucleophile></p></div></div>
    <div class="lph-catalytic-navigation"><button type="button" data-lph-catalytic-prev>← 上一步</button><span data-lph-catalytic-count></span><button type="button" data-lph-catalytic-next>下一步 →</button></div>
    <p class="lph-catalytic-geometry" data-lph-catalytic-geometry></p><p class="lph-catalytic-bond-ledger" data-lph-catalytic-bond-ledger></p>
    <div class="lph-catalytic-toolbar" role="group" aria-label="兩組糖分子的顯示設定"><button type="button" data-lph-catalytic-fit disabled>重置兩圖視角</button><button type="button" data-lph-catalytic-mode="ball" aria-pressed="true" disabled>球棒</button><button type="button" data-lph-catalytic-mode="space" aria-pressed="false" disabled>空間填充</button><label><input type="checkbox" data-lph-catalytic-hydrogens disabled> 顯示氫原子</label></div>
    <div class="lph-catalytic-endpoints">
      <figure class="lph-catalytic-endpoint lph-catalytic-working-model"><figcaption><strong data-lph-catalytic-model-title>當前化學狀態 · 有限片段模型</strong><span data-lph-catalytic-model-subtitle>不是完整蛋白質的活性部位幾何</span></figcaption><div class="lph-catalytic-canvas" data-lph-catalytic-substrate role="img" aria-label="可旋轉的有限化學模型：糖、水與人類乳糖酶催化角色的羧基端基類比"></div><p class="lph-catalytic-atom-key">AC1＝Gal C1　BO4＝Glc 橋氧　E1749Oreact＝親核氧　E1538Oreact＝酸／鹼氧　Ow＝水氧</p><div class="lph-catalytic-camera" role="group" aria-label="當前化學狀態的相機控制"><button type="button" data-lph-catalytic-camera="substrate:left" aria-label="向左旋轉化學模型" disabled>←</button><button type="button" data-lph-catalytic-camera="substrate:right" aria-label="向右旋轉化學模型" disabled>→</button><button type="button" data-lph-catalytic-camera="substrate:in" aria-label="放大化學模型" disabled>＋</button><button type="button" data-lph-catalytic-camera="substrate:out" aria-label="縮小化學模型" disabled>−</button><button type="button" data-lph-catalytic-focus disabled>看 Gal C1 的鍵</button></div></figure>
      <figure class="lph-catalytic-endpoint"><figcaption><strong>最終單糖 · 分開的端點參考</strong><span>左：β-D-半乳糖　右：β-D-葡萄糖</span></figcaption><div class="lph-catalytic-canvas" data-lph-catalytic-products role="img" aria-label="可旋轉的半乳糖與葡萄糖球棒結構，分開顯示兩個單糖"></div><p class="lph-catalytic-atom-key">G-C1／G-O1＝Gal C1–OH　B-C4／B-O4＝Glc C4–OH</p><div class="lph-catalytic-camera" role="group" aria-label="單糖端點的相機控制"><button type="button" data-lph-catalytic-camera="products:left" aria-label="向左旋轉單糖端點" disabled>←</button><button type="button" data-lph-catalytic-camera="products:right" aria-label="向右旋轉單糖端點" disabled>→</button><button type="button" data-lph-catalytic-camera="products:in" aria-label="放大單糖端點" disabled>＋</button><button type="button" data-lph-catalytic-camera="products:out" aria-label="縮小單糖端點" disabled>−</button></div></figure>
    </div>
    <p class="lph-catalytic-help">拖曳旋轉，滾輪縮放。碳＝藍灰、氧＝橘紅、氫＝白；青綠標出目前對照的原子。點擊球或鍵可讀取它的身份。</p><p class="lph-catalytic-selection" data-lph-catalytic-selection role="status"></p>
    <details class="lph-catalytic-boundary"><summary>分子模型與催化來源</summary><p>連續播放或拖曳回看 Gal C1 的鍵如何交接。糖、水與兩個 Glu 的羧基端基類比會保持同一組原子；E1538／E1749 的角色採人類 LPH 文獻與全長編號。</p><p>左圖有三個獨立計算的化學狀態；每態 69 個原子，C₁₈H₃₅O₁₆⁻，總形式電荷 −1。Gal C1 的 β→α→β、精確斷鍵／成鍵與單糖身份已由原子帳及 3D 立體檢查核對。第 3 步是第 2 步共價中間體的進攻前觀察，改標出中性水；沒有增加虛構的 OH⁻ 態。這裡的左右圖保留三個離散狀態；上方連續教材沿用已核對的原子與鍵對照，先保持糖環，再安排端基移動與局部配置反轉。進度不是實測時間，沒有動力學或速率模擬。</p><p>兩個 Glu 以 CH₃–CH₂–COO(H) 封端類比表示；它們省略主鏈與其餘蛋白質，不是完整胺基酸。圖形與構象的軟體邏輯沿用既有 LacZ 教材生成器；人類殘基角色採獨立文獻，沒有使用 LacZ 的 PDB／殘基指派作人體證據。片段經獨立計算後分開排列，沒有人體乳糖結合姿勢或實測中間體座標。</p><p>右圖沿用本網站既有的獨立單糖構象，各 24 個原子。左圖水氧 Ow 入 Gal C1 是機構原子帳的推論；質子可交換，不代表已實測每個氫的接力路徑。</p><p>E1538 酸／鹼、E1749 親核的指派依據：<a href="${CATALYTIC_SOURCE}" target="_blank" rel="noopener noreferrer">Kallemeijn 等，2014，人類 β-glycosidase 的機制探針、突變與化學救援</a>；保留型水解可核對 <a href="https://iubmb.qmul.ac.uk/enzyme/EC3/2/1/108.html" target="_blank" rel="noopener noreferrer">IUBMB EC 3.2.1.108</a>；完整序列可核對 <a href="https://www.uniprot.org/uniprotkb/P09848/entry" target="_blank" rel="noopener noreferrer">UniProt P09848</a>。</p></details></details>
  </section>`;

  function announceStage(silent=false){
    if(disposed)return;
    const stage=LACTASE_CATALYTIC_STAGES[stageIndex];
    $$('[data-lph-catalytic-stage]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lphCatalyticStage===stage.id)));
    for(const [name,key] of [['title','title'],['equation','equation'],['explanation','explanation'],['acid','acid'],['nucleophile','nucleophile'],['geometry','geometry']])$(`[data-lph-catalytic-${name}]`).textContent=stage[key];
    $('[data-lph-catalytic-count]').textContent=`${stageIndex+1} / ${LACTASE_CATALYTIC_STAGES.length}`;
    $('[data-lph-catalytic-prev]').disabled=stageIndex===0;$('[data-lph-catalytic-next]').disabled=stageIndex===LACTASE_CATALYTIC_STAGES.length-1;
    $('[data-lph-catalytic-selection]').textContent='';
    const stateNames=['反應前 · β-乳糖與羧基端基類比','共價中間體 · α-Gal–E1749 端基類比','進攻前 · α 共價中間體與中性水','反應後 · β-Gal、Glc 與再生端基類比'];
    $('[data-lph-catalytic-model-title]').textContent=stateNames[stageIndex];
    $('[data-lph-catalytic-model-subtitle]').textContent='有限化學模型 · 69 原子 · 總形式電荷 −1';
    $('[data-lph-catalytic-bond-ledger]').textContent=[
      'Gal C1–BO4：有　｜　Gal C1–E1749：無　｜　Gal C1–Ow：無',
      'Gal C1–BO4：已切　｜　Gal C1–E1749：新共價鍵　｜　Gal C1–Ow：無',
      'Gal C1–E1749：仍有　｜　水 Ow：進攻前的中性 H₂O',
      'Gal C1–E1749：已解除　｜　Gal C1–Ow：新羥基　｜　BO4–Glc C4：保留'
    ][stageIndex];
    $('[data-lph-catalytic-substrate]').setAttribute('aria-label',stateNames[stageIndex]+'，可旋轉的有限化學球棒模型');
    draw(true);
    if(!silent)onStage({id:stage.id,index:stageIndex,title:stage.title,residues:[1538,1749],focus:stage.focus,sourceIds:['lph-catalysis-2014']});
  }
  function draw(fit=false){
    if(!chemistry||!localModel||viewers.length!==2)return;
    const stage=LACTASE_CATALYTIC_STAGES[stageIndex];
    const settings=[{selected:stage.selected,bond:stage.bond?{a:stage.bond[0],b:stage.bond[1]}:null},{selected:stage.productSelected,bond:null}];
    viewers.forEach((viewer,index)=>{viewer.showH=showH;viewer.showLabels=true;viewer.labelsOnlySelected=true;viewer.renderMode=renderMode;viewer.setMolecule(index===0?localModel.states[stage.modelIndex]:products,{fit,...settings[index]});});
  }
  function describeAtom(atom){
    const known={AC1:'半乳糖 Gal 的 C1：糖苷鍵的異頭碳',BO4:'Glc C4 的橋氧／產物羥基氧',BC4:'葡萄糖 Glc 的 C4','G-C1':'半乳糖參考端點的 C1','G-O1':'半乳糖參考端點 C1 上的羥基氧','B-C4':'葡萄糖參考端點的 C4','B-O4':'葡萄糖參考端點 C4 上的羥基氧',E1749Oreact:'E1749 親核羧基氧的端基類比',E1538Oreact:'E1538 酸／鹼羧基氧的端基類比',E1538Hacid:'初始酸上的追蹤氫；本步接點依有限原子帳',Ow:'反應水氧；產物態接 Gal C1',Hwa:'水上可交給酸／鹼端基的追蹤氫'};
    const part=atom.id.startsWith('E1749')?'E1749 封端類比':atom.id.startsWith('E1538')?'E1538 封端類比':atom.id.startsWith('G-')?'半乳糖參考端點':atom.id.startsWith('B-')?'葡萄糖參考端點':atom.id.startsWith('A')?'半乳糖部分':'葡萄糖部分';
    const charge=atom.formalCharge??atom.charge??0;
    $('[data-lph-catalytic-selection]').textContent=`${atom.id} · ${known[atom.id]||`${part}的${{C:'碳',O:'氧',H:'氫'}[atom.element]||atom.element}原子`}；形式電荷 ${charge>0?'+':''}${charge}。`;
  }
  function describeBond(bond,index){
    const same=(a,b)=>bond.a===a&&bond.b===b||bond.a===b&&bond.b===a;
    const description=index===0&&same('AC1','BO4')?'Gal C1–橋氧：乳糖酶水解時要切的糖苷鍵。':index===0&&same('BO4','BC4')?'橋氧–Glc C4：水解時保留，成為葡萄糖的 C4–OH。':index===0&&same('AC1','E1749Oreact')?'Gal C1–E1749 氧：中間體的共價鍵；有限端基類比沒有完整蛋白質主鏈。':index===0&&same('AC1','Ow')?'Gal C1–水氧 Ow：水解後形成的 Gal 羥基鍵。':`${bond.a}–${bond.b}：${bond.order===1?'單鍵':bond.order===2?'雙鍵':'三鍵'}，目前顯示${index===0?'當前有限化學狀態':'獨立單糖端點'}。`;
    $('[data-lph-catalytic-selection]').textContent=description;
  }
  function releaseViewers(){continuousDispose?.();continuousDispose=null;$('[data-lph-continuous-host]')?.replaceChildren();viewers.forEach(viewer=>viewer.dispose());viewers=[];$$('.lph-catalytic-canvas').forEach(host=>host.replaceChildren());}
  function enableDisplay(enabled){$$('[data-lph-catalytic-camera],[data-lph-catalytic-fit],[data-lph-catalytic-mode],[data-lph-catalytic-hydrogens],[data-lph-catalytic-focus]').forEach(control=>control.disabled=!enabled);}
  async function load(){
    const previous=continuousDispose?.getObservation?.();if(previous)initialProgress=previous.progress;
    const run=++epoch;aborter?.abort();aborter=new AbortController();
    $('[data-lph-catalytic-retry]').hidden=true;enableDisplay(false);releaseViewers();
    $('[data-lph-catalytic-status]').textContent='正在讀取既有糖分子的座標與原子對照…';
    try{
      const urls=['lactose-reducing-end-molecules.json','reaction-molecules.json','molecules.json','human-lph-local-mechanism.json'];
      const datasets=await Promise.all(urls.map(async name=>{const response=await fetcher(new URL(`../data/${name}`,import.meta.url),{signal:aborter.signal});if(!response.ok)throw new Error('分子資料未載入');return response.json();}));
      if(disposed||run!==epoch)return;
      chemistry=validateLactaseChemistry(...datasets);localModel=validateHumanLphLocalMechanism(datasets[3]);products=createLactaseProductsReference(chemistry.galactose,chemistry.glucose);
      const hosts=[$('[data-lph-catalytic-substrate]'),$('[data-lph-catalytic-products]')];
      for(let index=0;index<hosts.length;index++){
        const viewer=new MoleculeViewer(hosts[index],{onAtom:describeAtom,onBond:bond=>describeBond(bond,index)});
        viewer.labelLayer.id=`${prefix}-${index}-atom-labels`;viewer.labelLayer.classList.add('lph-catalytic-labels');viewers.push(viewer);
      }
      draw(true);enableDisplay(true);
      continuousDispose=mountLactaseReactionPlayer($('[data-lph-continuous-host]'),{model:localModel,initialStage:LACTASE_CATALYTIC_STAGES[stageIndex].id,initialProgress,onObservation:animation=>{if(disposed)return;const index=LACTASE_CATALYTIC_STAGES.findIndex(stage=>stage.id===animation.stageId);if(index>=0&&index!==stageIndex){stageIndex=index;announceStage(true);}const stage=LACTASE_CATALYTIC_STAGES[stageIndex];onStage({id:stage.id,index:stageIndex,title:stage.title,residues:[1538,1749],focus:stage.focus,sourceIds:['lph-catalysis-2014','lph-iubmb'],animation});},onError:()=>{if(!disposed){$('[data-lph-catalytic-retry]').hidden=false;$('[data-lph-catalytic-status]').textContent='連續 3D 顯示暫時中斷，可重試；離散反應狀態與來源仍保留。';}}});
      $('[data-lph-catalytic-status]').textContent='分子與鍵對照已核對。';
    }catch(error){
      if(disposed||run!==epoch)return;releaseViewers();enableDisplay(false);
      $('[data-lph-catalytic-status]').textContent=chemistry&&localModel?'3D 顯示未完成，可重試。上方仍可選讀四個催化步驟。':'分子資料尚未載入或未通過核對，可重試。上方仍可選讀四個催化步驟。';
      $('[data-lph-catalytic-retry]').hidden=false;
    }
  }
  function selectStage(index,{silent=false}={}){if(disposed||!Number.isInteger(index)||index<0||index>=LACTASE_CATALYTIC_STAGES.length||index===stageIndex)return;stageIndex=index;announceStage(silent);continuousDispose?.setStage(LACTASE_CATALYTIC_STAGES[index].id);}
  $$('[data-lph-catalytic-stage]').forEach(button=>button.onclick=()=>selectStage(LACTASE_CATALYTIC_STAGES.findIndex(stage=>stage.id===button.dataset.lphCatalyticStage)));
  $('[data-lph-catalytic-prev]').onclick=()=>selectStage(stageIndex-1);$('[data-lph-catalytic-next]').onclick=()=>selectStage(stageIndex+1);
  $('[data-lph-catalytic-fit]').onclick=()=>{if(!disposed)viewers.forEach(viewer=>{viewer.resize();viewer.fit();});};
  $('[data-lph-catalytic-focus]').onclick=()=>{if(disposed||!viewers[0])return;const stage=LACTASE_CATALYTIC_STAGES[stageIndex],substituent=stage.modelIndex===0?'BO4':stage.modelIndex===1?'E1749Oreact':'Ow';viewers[0].fit(['AC1','AC2','AO5','AHC1',substituent]);};
  $$('[data-lph-catalytic-mode]').forEach(button=>button.onclick=()=>{if(disposed||button.disabled)return;renderMode=button.dataset.lphCatalyticMode;$$('[data-lph-catalytic-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.lphCatalyticMode===renderMode)));draw();});
  $('[data-lph-catalytic-hydrogens]').onchange=event=>{if(disposed)return;showH=event.target.checked;draw();};
  $$('[data-lph-catalytic-camera]').forEach(button=>button.onclick=()=>{if(disposed||button.disabled)return;const [id,action]=button.dataset.lphCatalyticCamera.split(':');const viewer=viewers[id==='substrate'?0:1];if(!viewer)return;if(action==='in'||action==='out')viewer.zoomView(action==='in'?.8:1.25);else viewer.orbitView(action==='left'?.22:-.22,0);});
  $('[data-lph-catalytic-retry]').onclick=load;
  announceStage();load();
  const dispose=()=>{if(disposed)return;disposed=true;epoch++;aborter?.abort();releaseViewers();$$('button,input').forEach(control=>{control.onclick=null;control.onchange=null;});};
  dispose.pause=()=>continuousDispose?.pause();dispose.getObservation=()=>continuousDispose?.getObservation();
  dispose.setStage=(id,options={})=>selectStage(LACTASE_CATALYTIC_STAGES.findIndex(stage=>stage.id===id),options);
  return dispose;
}
