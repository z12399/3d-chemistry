/** Finite neutral TAG hydrolysis bookkeeping. Site IDs are model labels, never sn positions. */
export const TAG_HYDROLYSIS_ID = 'tag-hydrolysis';
export const TAG_SITE_IDS = Object.freeze(['g1', 'g2', 'g3']);
export const TAG_SOURCES = Object.freeze([
  {id:'tag-esters',title:'OpenStax 21.6 · 酯的水解',url:'https://openstax.org/books/organic-chemistry/pages/21-6-chemistry-of-esters',note:'酯水解與酸／鹼產物形式的區別；本活動只列中性淨反應。'},
  {id:'tag-fats',title:'OpenStax 27.1 · 脂肪與油',url:'https://openstax.org/books/organic-chemistry/pages/27-1-waxes-fats-and-oils',note:'甘油三酯、脂肪酸與真實油脂的混合物性質。'},
  {id:'tag-soap',title:'OpenStax 27.2 · 皂化',url:'https://openstax.org/books/organic-chemistry/pages/27-2-soap',note:'強鹼皂化的脂肪酸鹽不等於本活動的中性油酸。'},
  {id:'tag-interesterification',title:'AOCS · 油脂酯交換',url:'https://www.aocs.org/resource/chemical-interesterification/',note:'已有脂肪醯基的連接重分配，與本例逐鍵水解的淨耗水不同。'},
]);
const GLYCERIDE_FORMULAS = Object.freeze([
  {C:57,H:104,O:6}, {C:39,H:72,O:5}, {C:21,H:40,O:4}, {C:3,H:8,O:3},
]);
const LABELS = ['TAG · 三油酸甘油酯', 'DAG · 二油酸甘油酯', 'MAG · 單油酸甘油酯', '甘油'];
const formulaText = counts => ['C','H','O'].map(e=>e+(counts[e]===1?'':counts[e])).join('');
function checked(state) {
  if (!state || !Array.isArray(state.cutIds)) throw new TypeError('A TAG state with cutIds is required');
  if (state.cutIds.length>3 || new Set(state.cutIds).size!==state.cutIds.length || state.cutIds.some(id=>!TAG_SITE_IDS.includes(id))) throw new RangeError('Each model ester site may be cut once');
  return state.cutIds;
}
export const createTagState = () => ({cutIds:[]});
export const resetTag = () => createTagState();
export function cutTagSite(state, siteId) {
  const next = {cutIds:[...checked(state),siteId]}; checked(next); return next;
}
export function undoTag(state) { return {cutIds:checked(state).slice(0,-1)}; }
export function describeTagState(state) {
  const cutIds=[...checked(state)], n=cutIds.length;
  const glycerideFormula=formulaText(GLYCERIDE_FORMULAS[n]);
  const components=[{id:'glyceride',label:LABELS[n],formula:glycerideFormula},
    ...TAG_SITE_IDS.filter(id=>cutIds.includes(id)).map(id=>({id:'acid-'+id,label:`油酸 · 來自 ${id}`,formula:'C18H34O2'}))];
  const reactants={C:57,H:104+2*n,O:6+n};
  const products={C:GLYCERIDE_FORMULAS[n].C+18*n,H:GLYCERIDE_FORMULAS[n].H+34*n,O:GLYCERIDE_FORMULAS[n].O+2*n};
  return {mask:cutIds.reduce((mask,id)=>mask|(1<<TAG_SITE_IDS.indexOf(id)),0),cutIds,
    remainingSiteIds:TAG_SITE_IDS.filter(id=>!cutIds.includes(id)),waterCount:n,freeAcids:n,
    classLabel:LABELS[n],stageLabel:['未水解','已水解一鍵','已水解兩鍵','三鍵均已水解'][n],
    glycerideFormula,components,totalDoubleBonds:3,glycerideDoubleBonds:3-n,
    equation:n?`C57H104O6 + ${n===1?'':n+' '}H2O → ${glycerideFormula} + ${n===1?'':n+' '}C18H34O2`:'C57H104O6（尚未加入水解用水）',
    stepEquation:n?`${formulaText(GLYCERIDE_FORMULAS[n-1])} + H2O → ${glycerideFormula} + C18H34O2`:'',
    balance:{reactants,products,balanced:['C','H','O'].every(e=>reactants[e]===products[e])}};
}
export function tagSummary(state) {
  const d=describeTagState(state);
  return `三油酸甘油酯水解：${d.cutIds.length?d.cutIds.join(' → '):'尚未切鍵'}。${d.classLabel}；累計耗水 ${d.waterCount} mol／起始 TAG 1 mol，產生油酸 ${d.freeAcids} mol。${d.equation}。全套分子仍有 3 個 C=C；水解不等於氫化或氧化。這是中性淨反應與代表構象，不是實際選擇性、速率或反應軌跡；g1/g2/g3 不是 sn 編號。`;
}

/** Validate before rendering: reject incomplete / chemically inconsistent endpoint assets. */
export function validatedDataset(data) {
  if(data?.version!==1 || data.id!==TAG_HYDROLYSIS_ID || !Array.isArray(data.sites) || data.sites.length!==3 || !Array.isArray(data.states) || data.states.length!==8) throw new TypeError('Incomplete TAG structure dataset');
  if(new Set(data.sites.map(s=>s.id)).size!==3 || data.sites.some(s=>!TAG_SITE_IDS.includes(s.id))) throw new TypeError('Invalid TAG sites');
  const masks=new Set();
  for(const state of data.states) {
    if(!Number.isInteger(state.mask)||state.mask<0||state.mask>7||masks.has(state.mask)) throw new TypeError('Invalid TAG mask');
    masks.add(state.mask);
    const ids=TAG_SITE_IDS.filter((id,i)=>state.mask&(1<<i)), d=describeTagState({cutIds:ids});
    if(state.waterConsumed!==ids.length || !Array.isArray(state.cleaved) || state.cleaved.length!==ids.length || new Set(state.cleaved).size!==ids.length || state.cleaved.some(id=>!ids.includes(id))) throw new TypeError('Incorrect water or site ledger');
    if(!Array.isArray(state.components)||state.components.length!==ids.length+1) throw new TypeError('Incorrect component ledger');
    const allIds=new Set(), compIds=new Set(), totals={C:0,H:0,O:0}; let carbonDoubleBonds=0;
    for(const c of state.components) {
      const expected=d.components.find(x=>x.id===c.id);
      if(!expected||compIds.has(c.id)||c.formula!==expected.formula||!Array.isArray(c.atoms)||!Array.isArray(c.bonds)) throw new TypeError('Incorrect TAG component');
      compIds.add(c.id);
      const atoms=new Map(), valence=new Map(), counts={C:0,H:0,O:0};
      for(const a of c.atoms) {
        if(typeof a.id!=='string'||allIds.has(a.id)||!Object.hasOwn(counts,a.element)||(a.charge??a.formalCharge)!==0||!Array.isArray(a.position)||a.position.length!==3||!a.position.every(Number.isFinite)) throw new TypeError('Invalid neutral TAG atom');
        allIds.add(a.id);atoms.set(a.id,a);valence.set(a.id,0);counts[a.element]++;totals[a.element]++;
      }
      const edges=new Set();
      for(const b of c.bonds) {
        const key=[b.a,b.b].sort().join('|');
        if(!atoms.has(b.a)||!atoms.has(b.b)||b.a===b.b||![1,2].includes(b.order)||edges.has(key)) throw new TypeError('Invalid TAG bond');
        edges.add(key);valence.set(b.a,valence.get(b.a)+b.order);valence.set(b.b,valence.get(b.b)+b.order);
        if(b.order===2&&atoms.get(b.a).element==='C'&&atoms.get(b.b).element==='C')carbonDoubleBonds++;
      }
      if([...atoms].some(([id,a])=>valence.get(id)!=={C:4,H:1,O:2}[a.element]) || formulaText(counts)!==expected.formula) throw new TypeError('Invalid TAG valence or formula');
    }
    if(carbonDoubleBonds!==3||['C','H','O'].some(e=>totals[e]!==d.balance.products[e]||state.formulaTotals?.[e]!==totals[e]))throw new TypeError('Unbalanced TAG structure');
    const glyceride=state.components.find(c=>c.id==='glyceride');
    const contains=(component,id)=>component?.atoms.some(a=>a.id===id);
    const hasBond=(component,a,b,order)=>component?.bonds.some(edge=>edge.order===order&&((edge.a===a&&edge.b===b)||(edge.a===b&&edge.b===a)));
    for(const site of data.sites){
      const cut=ids.includes(site.id),acyl=cut?state.components.find(c=>c.id==='acid-'+site.id):glyceride;
      if(!contains(glyceride,site.glycerolO)||!contains(glyceride,site.glycerolCarbon)||!hasBond(glyceride,site.glycerolCarbon,site.glycerolO,1)||!contains(acyl,site.carbonylCarbon)||!contains(acyl,site.carbonylO)||!hasBond(acyl,site.carbonylCarbon,site.carbonylO,2)) throw new TypeError('Incorrect TAG fragment identity');
      if(hasBond(glyceride,site.carbonylCarbon,site.glycerolO,1)!==!cut) throw new TypeError('Cut sites do not match the TAG graph');
    }
  }
  const parent=data.states.find(s=>s.mask===0).components[0], pAtoms=new Set(parent.atoms.map(a=>a.id));
  for(const site of data.sites) {
    if(![site.carbonylCarbon,site.glycerolO,site.glycerolCarbon,site.carbonylO].every(id=>pAtoms.has(id))||!Array.isArray(site.focusIds)||!site.focusIds.length||site.focusIds.some(id=>!pAtoms.has(id))) throw new TypeError('Invalid TAG site mapping');
    if(!parent.bonds.some(b=>b.order===1&&((b.a===site.carbonylCarbon&&b.b===site.glycerolO)||(b.b===site.carbonylCarbon&&b.a===site.glycerolO)))) throw new TypeError('Missing ester bond');
  }
  return data;
}
