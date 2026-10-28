// Finite Fischer-notation practice for Ala and Gly; no conformer or reaction model.
export const AMINO_STEREO_ID = 'amino-stereo-practice';
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const AMINO_STEREO_SOURCES = freeze([
  {id:'protein-batch-iupac-amino',label:'IUPAC：胺基酸構型與旋光記號（§§3、5）',url:'https://iupac.qmul.ac.uk/AminoAcid/AA3t5.html',scope:'原始命名建議：D/L 與參照構型的關係、旋光正負的獨立記號；不是旋光實測資料。'},
  {id:'protein-batch-iupac-fischer',label:'IUPAC：Fischer 投影約定',url:'https://iupac.qmul.ac.uk/stereo/FM.html',scope:'垂直鍵朝後、水平鍵朝前。此活動重寫的是投影位置，不是分子的實際空間旋轉。'},
  {id:'amino-source-pka-table',label:'OpenStax §26.1：胺基酸結構與構型例',url:'https://openstax.org/books/organic-chemistry/pages/26-1-structures-of-amino-acids',scope:'Ala、Gly 的基團與 L-Ala(S)、L-Cys(R) 對照；本活動不計任意分子的 CIP 順序或所有側鏈。'},
  {id:'protein-batch-os-fischer',label:'OpenStax §25.2：Fischer 圖式的 180°／90°規則',url:'https://openstax.org/books/organic-chemistry/pages/25-2-representing-carbohydrate-stereochemistry-fischer-projections',scope:'按同一投影約定重新讀重排圖式；180°保留配置，90°一般不保留。未提供構象、速率或反應動畫。'}
]);
export const AMINO_STEREO_MODES = freeze([
  {id:'projection',label:'看四個取代基，判讀 Fischer'},
  {id:'optical',label:'D/L 能否推出旋光正負？'},
  {id:'cip',label:'L 是否一律等於 S？'}
]);
export const AMINO_STEREO_OPERATIONS = freeze([
  {id:'quarter',label:'圖式重寫 90°'}, {id:'half',label:'圖式重寫 180°'},
  {id:'mirror',label:'交換左／右'}, {id:'swap',label:'交換上／右'}, {id:'reset',label:'回參照圖式'}
]);
const species = freeze({alanine:{name:'丙胺酸 Ala',groups:['COOH','H','CH₃','NH₂']},glycine:{name:'甘胺酸 Gly',groups:['COOH','H','H','NH₂']}});
const orderOf = order => {if (!Array.isArray(order) || order.length !== 4 || order.some(x=>!Number.isInteger(x)||x<0||x>3) || new Set(order).size !== 4) throw new RangeError('Invalid Fischer position order'); return order;};
function valid(draft) {
  if (!draft || typeof draft!=='object' || !Object.hasOwn(species,draft.species) || !AMINO_STEREO_MODES.some(m=>m.id===draft.mode) || !draft.trials || typeof draft.trials!=='object' || Array.isArray(draft.trials)) throw new TypeError('A valid amino stereo draft is required');
  orderOf(draft.order); return draft;
}
const labelFor = (item,id) => item.options.find(o=>o.id===id)?.label ?? '尚未選擇';
const lock = (object,key,value) => Object.defineProperty(object,key,{value,enumerable:true,writable:false,configurable:false});
export function createAminoStereoDraft() { return {species:'alanine',order:[0,1,2,3],mode:'projection',trials:{},synthesis:'',details:{}}; }
export function aminoStereoProjection(draft) {
  valid(draft); const groups=draft.order.map(i=>species[draft.species].groups[i]);
  // Duplicate visible groups are checked before parity: Gly never gets D/L.
  let inversions=0; for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) if(draft.order[i]>draft.order[j]) inversions++;
  return {species:draft.species,name:species[draft.species].name,groups,top:groups[0],right:groups[1],bottom:groups[2],left:groups[3],answer:new Set(groups).size<4?'none':inversions%2?'D':'L',parity:new Set(groups).size<4?null:inversions%2};
}
export function aminoStereoCase(draft) {
  valid(draft); const projection=aminoStereoProjection(draft);
  if (draft.mode==='optical') return {key:'optical',title:'構型與旋光是不同資訊',question:'只有某胺基酸的 L 構型身分，沒有指定條件的旋光測量，能推出什麼？',answer:'unknown',options:[
    {id:'minus',label:'L 就是旋光負號（−）',feedback:'L 描述參照構型，不是左旋的測量符號。不能由字母直接指定負號。'},
    {id:'unknown',label:'不能由 L 單獨推出 +／−',feedback:'旋光正負是實測性質；報告還須有波長、溫度、溶劑及濃度等條件。'},
    {id:'plus',label:'有 NH₂ 在左就代表旋光正號（+）',feedback:'投影中的左右位置不是偏振光的旋轉方向。'}],explanation:'D/L 是構型記號，+/− 是旋光測量記號，兩者沒有這種通用對應。本題未提供任何旋光實測，不指定 Ala 或其他胺基酸的旋光正負。',sourceIds:['protein-batch-iupac-amino']};
  if (draft.mode==='cip') return {key:'cip',title:'構型系統也要分開',question:'能把所有 L-胺基酸的構型記號直接改寫成 S 嗎？',answer:'priority',options:[
    {id:'always',label:'可以，L 與 S 完全同義',feedback:'L-Ala 的例子不能變成全部胺基酸的規則；L-Cys 是常見反例。'},
    {id:'rotation',label:'先測正旋或負旋，就知道 R／S',feedback:'旋光正負不指定 CIP 優先序或 R/S。'},
    {id:'priority',label:'不可以；R/S 要按 CIP 優先序判定',feedback:'OpenStax 的 L-Ala(S) 與 L-Cys(R) 同為 L，卻有不同 R/S。'}],explanation:'L-Ala 可標為 S，L-Cys 可標為 R；側鏈的原子會影響 CIP 優先序。此活動只用這個已核例子分清記號，沒有提供任意分子的 CIP 判定器。',sourceIds:['amino-source-pka-table','protein-batch-iupac-amino']};
  return {key:'projection:'+draft.species+':'+projection.groups.join('|'),title:'四個取代基與投影約定',question:'按目前圖式與固定 Fischer 約定，這個 α-C 的 D/L 應如何標示？',answer:projection.answer,projection,options:[
    {id:'L',label:'L',feedback:projection.answer==='none'?'Gly 的 α-C 有兩個相同 H，不能從左右位置硬指定 L。':projection.answer==='L'?'此圖式與指定 L-Ala 參照的排列為偶置換，配置相同。':'此圖式與 L-Ala 參照的排列為奇置換；不要只看 NH₂ 是否在左。'},
    {id:'D',label:'D',feedback:projection.answer==='none'?'Gly 的兩個 H 相同，沒有可分的 D/Gly 與 L/Gly。':projection.answer==='D'?'此圖式在固定投影約定下與 L-Ala 參照相反。':'此圖式在固定投影約定下仍與 L-Ala 參照相同；180°重寫不會使它變成 D。'},
    {id:'none',label:'不適用：α-C 無手性',feedback:projection.answer==='none'?'兩個取代基都是 H，不構成四種不同基團的手性中心；不加 D/L。':'Ala 的 α-C 接 COOH、NH₂、CH₃ 與 H，四者不同，不能當成 Gly 的情況。'}],explanation:projection.answer==='none'?'Gly 的 α-C 有兩個相同 H；交換這兩個位置不產生另一種對映異構物，這裡不給 D/L。':'固定 Fischer 水平朝前、垂直朝後，先與標準 L-Ala 參照比較。偶數置換保留配置，奇數置換反轉；180°是兩次交換，90°重寫後再按同一約定讀則是奇置換。這不是說真實分子在空間轉動會變成另一個對映體。',sourceIds:['protein-batch-iupac-amino','protein-batch-iupac-fischer','amino-source-pka-table','protein-batch-os-fischer']};
}
export function aminoStereoTrial(draft) {
  const item=aminoStereoCase(draft);
  if(!Object.hasOwn(draft.trials,item.key)) draft.trials[item.key]={snapshot:freeze({species:draft.species,order:[...draft.order],mode:draft.mode}),first:null,current:null,reason:'',checked:false,checkedSelection:null,checkedReason:'',revision:''};
  return draft.trials[item.key];
}
export function setAminoStereoSpecies(draft,id) {valid(draft);if(!Object.hasOwn(species,id))throw new RangeError('Unknown amino acid');draft.species=id;return draft;}
export function setAminoStereoMode(draft,id) {valid(draft);if(!AMINO_STEREO_MODES.some(m=>m.id===id))throw new RangeError('Unknown stereo task');draft.mode=id;return draft;}
export function transformAminoStereo(draft,id) {
  valid(draft); const p=draft.order, orders={quarter:[p[3],p[0],p[1],p[2]],half:[p[2],p[3],p[0],p[1]],mirror:[p[0],p[3],p[2],p[1]],swap:[p[1],p[0],p[2],p[3]],reset:[0,1,2,3]};
  if(!Object.hasOwn(orders,id))throw new RangeError('Unknown Fischer operation');draft.order=orders[id];return draft;
}
export function chooseAminoStereo(draft,id) {const item=aminoStereoCase(draft);if(!item.options.some(o=>o.id===id))throw new RangeError('Unknown stereo answer');const trial=aminoStereoTrial(draft);if(trial.first===null)lock(trial,'first',id);trial.current=id;return trial;}
export function checkAminoStereo(draft) {const trial=aminoStereoTrial(draft),item=aminoStereoCase(draft);if(!item.options.some(o=>o.id===trial.current))return false;if(trial.checked)return true;const reason=typeof trial.reason==='string'?trial.reason:'';lock(trial,'checkedSelection',trial.current);lock(trial,'checkedReason',reason);lock(trial,'reason',reason);lock(trial,'checked',true);return true;}
export function buildAminoStereoSummary(draft) {
  valid(draft);const current=aminoStereoCase(draft),lines=['胺基酸立體判讀：Ala／Gly 的有限 Fischer 圖式','可查閱約定的提取練習；選項核對不是盲測、文字語意評分或學習成效。',`目前任務：${current.title}`];
  if(current.projection){const p=current.projection;lines.push(`目前圖式：${p.name}；上 ${p.top}／右 ${p.right}／下 ${p.bottom}／左 ${p.left}`);}
  for(const [,trial]of Object.entries(draft.trials).sort(([a],[b])=>a<b?-1:a>b?1:0)){
    const snapshot={...trial.snapshot,trials:{}},item=aminoStereoCase(snapshot);
    if(!trial.current&&!trial.reason&&!trial.revision)continue;
    lines.push('',item.title);
    if(item.projection){const p=item.projection;lines.push(`${p.name}；上 ${p.top}／右 ${p.right}／下 ${p.bottom}／左 ${p.left}`);}
    lines.push(`初次選擇：${labelFor(item,trial.first)}`,`核對時選擇：${trial.checked?labelFor(item,trial.checkedSelection):'尚未核對'}`,`核對結果：${trial.checked?(trial.checkedSelection===item.answer?'核對時符合':'核對時需修正'):'尚未核對，不計為正確'}`,`目前選擇：${labelFor(item,trial.current)}`,'核對前理由：',trial.reason,'核對時理由：',trial.checked?trial.checkedReason:'尚未核對','修訂：',trial.revision);
    if(trial.checked)lines.push('核對說明：',item.explanation);
  }
  lines.push('','整合短答：',typeof draft.synthesis==='string'?draft.synthesis:'','','範圍：COOH／NH₂ 為固定結構表示，不指定溶液 pH 的主要形態。圖式重寫不是 3D 旋轉、構象或化學反應；僅限 Ala／Gly，不計任意分子的 R/S 或旋光值。');
  return lines.join('\n');
}
