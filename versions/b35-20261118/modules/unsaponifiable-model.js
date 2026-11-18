export const UNSAPONIFIABLE_ID = 'unsaponifiable-fraction';
export const UNSAPONIFIABLE_LESSON_ID = 'lipid-unsaponifiable-fraction';

export const UNSAPONIFIABLE_SOURCES = Object.freeze([
  {id:'unsapon-fssai-method',title:'FSSAI 02.008:2021：不皂化物分析法，pp.18–20',url:'https://fssai.gov.in/upload/uploadfiles/files/Manual_Revised_Oil_Fats_22_06_2021.pdf'},
  {id:'lipid-atlas-phytosterols',title:'AOCS：甾醇酯皂化與分相',url:'https://www.aocs.org/resource/gas-chromatographic-analysis-of-plant-sterols/'},
  {id:'unsapon-wax-schots',title:'Schots et al. 2023：蠟酯水解與脂肪醇分離',url:'https://doi.org/10.1371/journal.pone.0285751'},
  {id:'unsapon-tocol-analysis',title:'AOCS：生育酚分析與鹼處理損失',url:'https://www.aocs.org/resource/analysis-of-tocopherols-and-tocotrienols-by-hplc/'},
  {id:'unsapon-oil-quality',title:'Oklahoma State University：食用油品質與色素',url:'https://extension.okstate.edu/fact-sheets/edible-oil-quality'},
  {id:'unsapon-tocol-dose',title:'Evans et al. 2002：生育酚濃度與大豆油氧化',url:'https://doi.org/10.1007/s11746-002-0433-6'}
]);

export const MOLECULES = Object.freeze([
  {id:'tag',label:'三酸甘油酯 TAG',short:'甘油骨架',bonds:['酯位 1','酯位 2','酯位 3'],alcohol:'甘油',alcoholPhase:'aqueous',note:'三個酯位全水解後，甘油進含水醇相；三份脂肪酸以鹽的形式留在皂液。'},
  {id:'sterol-ester',label:'甾醇酯',short:'甾醇骨架',bonds:['甾醇的酯位'],alcohol:'游離甾醇',alcoholPhase:'organic',note:'原來的甾醇酯有可水解酯鍵；釋出的甾醇可進不皂化分段，並非整個原分子沒反應。'},
  {id:'wax-ester',label:'蠟酯',short:'長鏈醇骨架',bonds:['長鏈醇的酯位'],alcohol:'長鏈醇',alcoholPhase:'organic',note:'蠟酯的脂肪酸部分成鹽；釋出的長鏈醇偏疏水，可進不皂化分段。這裡的蠟酯是具名結構類別，不代表所有天然蠟的成分。'},
  {id:'free-sterol',label:'游離甾醇（膽固醇）',short:'甾醇—OH',bonds:[],alcohol:'游離甾醇',alcoholPhase:'organic',note:'游離甾醇沒有脂肪酸酯鍵；在本課條件示意下進有機萃取相。不能與甾醇酯混用。'},
  {id:'squalene',label:'角鯊烯',short:'角鯊烯（烴）',bonds:[],alcohol:'角鯊烯',alcoholPhase:'organic',note:'角鯊烯是烴，沒有可皂化的脂肪酸酯鍵；雙鍵並不是酯鍵。'}
]);

export const CLASS_CHOICES = Object.freeze([{id:'ester',label:'有脂肪酸酯鍵'},{id:'no-ester',label:'沒有脂肪酸酯鍵'}]);
export const RESIDUE_CHOICES = Object.freeze([
  {id:'proof',label:'扣空白後等於 1.00%，就證明分析準確'},
  {id:'offset',label:'回收損失與殘油可能抵銷，仍須分別查核'},
  {id:'vitamin',label:'殘渣就是維生素 E，可直接換算含量'}
]);
export const MASS_ASSUMPTIONS = Object.freeze({sampleMg:5000,targetMg:50});
export const MASS_LIMITS = Object.freeze({recovery:[0,100],blankMg:[0,20],oilMg:[0,50]});
export const MASS_PRESETS = Object.freeze([
  {id:'ideal',label:'理想回收',recovery:100,blankMg:0,oilMg:0},
  {id:'loss',label:'只有回收損失',recovery:60,blankMg:0,oilMg:0},
  {id:'offset',label:'損失與殘油抵銷',recovery:60,blankMg:10,oilMg:20}
]);

export function getMolecule(id) {
  const item=MOLECULES.find(item=>item.id===id);
  if(!item) throw new RangeError('Unknown molecule');
  return item;
}
const decision=()=>({first:null,current:null,checked:null});
export function createUnsaponifiableDraft() {
  return {view:'molecules',selected:'sterol-ester',details:{},molecules:Object.fromEntries(MOLECULES.map(item=>[item.id,{choice:decision(),cut:[],separated:false}])),mass:{recovery:100,blankMg:0,oilMg:0},snapshots:[],residueAnswer:decision(),observation:''};
}
export function chooseClassification(draft,id,value) {
  getMolecule(id);
  if(!CLASS_CHOICES.some(choice=>choice.id===value))throw new RangeError('Unknown classification');
  const answer=draft.molecules[id].choice;
  if(answer.first===null)answer.first=value;
  answer.current=value;
  return answer;
}
export function cutEster(draft,id,index) {
  const molecule=getMolecule(id),state=draft.molecules[id];
  if(!Number.isInteger(index)||index<0||index>=molecule.bonds.length)throw new RangeError('Unknown ester site');
  if(state.choice.current===null)return false;
  if(!state.cut.includes(index))state.cut.push(index);
  state.separated=false;
  if(state.choice.checked===null)state.choice.checked=state.choice.current;
  return true;
}
export function separateMolecule(draft,id) {
  const molecule=getMolecule(id),state=draft.molecules[id];
  if(state.choice.current===null||state.cut.length!==molecule.bonds.length)return false;
  state.separated=true;
  if(state.choice.checked===null)state.choice.checked=state.choice.current;
  return true;
}
export function resetMolecule(draft,id) {
  getMolecule(id);draft.molecules[id].cut=[];draft.molecules[id].separated=false;
}
export function moleculeProducts(draft,id) {
  const molecule=getMolecule(id),state=draft.molecules[id],released=state.cut.length,complete=released===molecule.bonds.length;
  const aqueous=[],organic=[];
  if(complete){
    if(released)aqueous.push({label:'脂肪酸鹽',count:released,origin:'原酯的脂肪酸部分'});
    (molecule.alcoholPhase==='organic'?organic:aqueous).push({label:molecule.alcohol,count:1,origin:molecule.bonds.length?'原酯的醇部分':'原來的非酯成分'});
  }
  return {released,remaining:molecule.bonds.length-released,complete,aqueous,organic,classification:molecule.bonds.length?'ester':'no-ester'};
}

export function residueMassBalance(settings) {
  const values={};
  for(const [key,[min,max]] of Object.entries(MASS_LIMITS)){
    const raw=settings?.[key],value=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()!==''?Number(raw):NaN;
    if(!Number.isFinite(value)||value<min||value>max)return {valid:false,message:'數值尚未完整，請使用範圍內的教學設定。'};
    values[key]=value;
  }
  const recoveredMg=MASS_ASSUMPTIONS.targetMg*values.recovery/100;
  const lostMg=MASS_ASSUMPTIONS.targetMg-recoveredMg;
  const residueMg=recoveredMg+values.blankMg+values.oilMg;
  const blankCorrectedMg=residueMg-values.blankMg;
  return {valid:true,...values,...MASS_ASSUMPTIONS,recoveredMg,lostMg,residueMg,blankCorrectedMg,rawPercent:100*residueMg/MASS_ASSUMPTIONS.sampleMg,correctedPercent:100*blankCorrectedMg/MASS_ASSUMPTIONS.sampleMg,biasMg:values.oilMg-lostMg};
}
export function applyMassPreset(draft,id){
  const preset=MASS_PRESETS.find(item=>item.id===id);if(!preset)throw new RangeError('Unknown mass preset');
  draft.mass={recovery:preset.recovery,blankMg:preset.blankMg,oilMg:preset.oilMg};
}
export function recordMassSnapshot(draft){
  const result=residueMassBalance(draft.mass);if(!result.valid||draft.snapshots.length>=6)return false;
  draft.snapshots.push({recovery:result.recovery,blankMg:result.blankMg,oilMg:result.oilMg});return true;
}
export function chooseResidueAnswer(draft,id){
  if(!RESIDUE_CHOICES.some(option=>option.id===id))throw new RangeError('Unknown answer');
  if(draft.residueAnswer.first===null)draft.residueAnswer.first=id;
  draft.residueAnswer.current=id;
}
export function checkResidueAnswer(draft){
  if(draft.residueAnswer.current===null)return false;
  if(draft.residueAnswer.checked===null)draft.residueAnswer.checked=draft.residueAnswer.current;
  return true;
}
const choiceLabel=(choices,id)=>choices.find(option=>option.id===id)?.label||'尚未選擇';
const number=value=>Number(value).toFixed(2);
function massLine(settings){
  const mass=residueMassBalance(settings);
  return !mass.valid?'質量帳：尚未完整。':`回收 ${mass.recovery}%；空白 ${mass.blankMg} mg；殘油 ${mass.oilMg} mg；秤得 ${number(mass.residueMg)} mg；扣教學空白後 ${number(mass.blankCorrectedMg)} mg = ${number(mass.correctedPercent)}%；未回收 ${number(mass.lostMg)} mg。`;
}
export function buildUnsaponifiableSummary(draft){
  const lines=['【不皂化物：酯鍵、分相與殘渣判讀】','化學示意條件：酯位完全水解、未酸化、完成洗滌分相；不是分配係數或回收率模擬。'];
  for(const molecule of MOLECULES){
    const state=draft.molecules[molecule.id],answer=state.choice,products=moleculeProducts(draft,molecule.id);
    if(answer.first===null&&state.cut.length===0&&!state.separated)continue;
    lines.push(`${molecule.label}：首次「${choiceLabel(CLASS_CHOICES,answer.first)}」；首次揭示時「${choiceLabel(CLASS_CHOICES,answer.checked)}」；目前「${choiceLabel(CLASS_CHOICES,answer.current)}」。已水解 ${products.released}/${molecule.bonds.length} 個酯位；${state.separated?'已查看分相':'尚未查看分相'}。`);
    if(state.separated)lines.push(`含水醇皂液：${products.aqueous.map(item=>`${item.count} 份${item.label}`).join('、')||'本分子無此產物'}；有機萃取相：${products.organic.map(item=>`${item.count} 份${item.label}`).join('、')||'本分子無此產物'}。`);
  }
  lines.push('以下皆為教學假設，非實驗數據：樣品質量 5000 mg、應回收不皂化部分 50 mg；其他共萃取酸與揮發物已排除。',massLine(draft.mass));
  draft.snapshots.forEach((settings,index)=>lines.push(`對照 ${index+1}：${massLine(settings)}`));
  const answer=draft.residueAnswer;
  lines.push(`殘渣判讀首次「${choiceLabel(RESIDUE_CHOICES,answer.first)}」；首次核對「${choiceLabel(RESIDUE_CHOICES,answer.checked)}」；目前「${choiceLabel(RESIDUE_CHOICES,answer.current)}」。`);
  lines.push('扣空白不會修復回收損失或殘油；相同總量可能由誤差抵銷。殘渣不是單一營養素含量，也不保證各成分在鹼處理下完整保留。FSSAI 正式方法另有共萃取游離脂肪酸修正；本模型不是該方法完整實作。');
  if(draft.observation.trim())lines.push(`我的觀察：${draft.observation}`);
  lines.push(`來源：${UNSAPONIFIABLE_SOURCES.slice(0,4).map(source=>source.url).join('；')}`);
  return lines.join('\n');
}
