import {builtinMechanisms} from './builtin-mechanisms.js';
import {evaluateElectronArrows} from './electron-workbench-model.js';

// Deliberate teaching allowlist, not automatic admission of every graph which
// passes the ledger. In particular, the pyridine/Kekule acetylation branch is
// outside this workbench's aromatic representation boundary.
const relayTasks={
 "electron-practice-aldose-ketose": [
  "移去羰基旁的質子，形成可重排的陰離子。",
  "把質子補到氧，得到中性烯二醇。",
  "讓另一端羥基失去質子，準備重建羰基。",
  "重建酮基，完成果糖骨架。"
 ],
 "electron-practice-glucose-epimerization": [
  "移去羰基旁的質子，形成可再反應的平面中心。",
  "恢復醛基，完成所選甘露糖端點。"
 ],
 "electron-practice-amadori": [
  "先活化亞胺氮，準備後續碳鏈重排。",
  "保留糖與氮的連接，轉成烯胺醇中間態。",
  "保留氮的位置，重建酮基。",
  "讓羰基氧回到中性，完成酮胺產物。"
 ],
 "electron-practice-heyns": [
  "讓胺加成到果糖羰基，形成第一個加成物。",
  "把加成物的氧負電轉為羥基。",
  "移除氮上多的質子，得到中性胺醇。",
  "把羥基活化成可離去的水。",
  "讓水離去，建立亞胺鎓中間態。",
  "讓亞胺回到中性，完成縮合階段。",
  "重新活化亞胺氮，切入重排支路。",
  "保留糖與氮的連接，形成烯胺醇。",
  "重建醛基，讓相鄰的碳接受質子。",
  "讓醛氧回到中性，完成胺基醛糖。"
 ],
 "electron-practice-strecker": [
  "用加成與水接力，得到胺醇主態。",
  "合併脫水與閉環，得到五員環主態。",
  "讓五員環釋出 CO₂，留下含氮片段。",
  "用三份水接力，讓兩個帶電位點回中性。",
  "在新的亞胺碳加水，轉到下一個胺醇主態。",
  "讓胺醇解離，分出醛與含氮共產物。"
 ]
};

const entries=[
 {id:'electron-cyclization',file:'molecules.json',reactionId:'glucose-hemiacetal',title:'葡萄糖半縮醛成環',group:'環鏈互變',shortLabel:'葡萄糖成環'},
 {id:'electron-condensation',file:'maillard-mechanism-models.json',reactionId:'maillard-schiff-base',title:'糖與胺形成 Schiff 鹼',group:'羰基與胺',shortLabel:'Schiff 鹼形成'},
 {id:'electron-hydrolysis',file:'disaccharide-mechanism-models.json',reactionId:'maltose-hydrolysis',title:'麥芽糖的酸催化水解',group:'糖苷鍵',shortLabel:'麥芽糖酸水解'},
 {id:'electron-glucose-opening',file:'molecules.json',reactionId:'glucose-hemiacetal',reverse:true,title:'葡萄糖半縮醛開環',group:'環鏈互變',shortLabel:'葡萄糖開環'},
 {id:'electron-practice-fructose-beta-furanose',file:'mechanism-models.json',reactionId:'fructose-hemiketal',title:'果糖形成 β-D-呋喃果糖',group:'環鏈互變',shortLabel:'果糖 β 五員環'},
 {id:'electron-practice-fructose-alpha-furanose',file:'fructose-form-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'alpha-furanose',title:'果糖形成 α-D-呋喃果糖',group:'環鏈互變',shortLabel:'果糖 α 五員環'},
 {id:'electron-practice-fructose-alpha-pyranose',file:'fructose-form-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'alpha-pyranose',title:'果糖形成 α-D-吡喃果糖',group:'環鏈互變',shortLabel:'果糖 α 六員環'},
 {id:'electron-practice-fructose-beta-pyranose',file:'fructose-form-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'beta-pyranose',title:'果糖形成 β-D-吡喃果糖',group:'環鏈互變',shortLabel:'果糖 β 六員環'},
 {id:'electron-practice-fructose-beta-furanose-opening',file:'fructose-ring-opening-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'beta-furanose-ring-opening',title:'β-D-呋喃果糖開環',group:'環鏈互變',shortLabel:'果糖 β 五員開環'},
 {id:'electron-practice-fructose-alpha-furanose-opening',file:'fructose-ring-opening-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'alpha-furanose-ring-opening',title:'α-D-呋喃果糖開環',group:'環鏈互變',shortLabel:'果糖 α 五員開環'},
 {id:'electron-practice-fructose-alpha-pyranose-opening',file:'fructose-ring-opening-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'alpha-pyranose-ring-opening',title:'α-D-吡喃果糖開環',group:'環鏈互變',shortLabel:'果糖 α 六員開環'},
 {id:'electron-practice-fructose-beta-pyranose-opening',file:'fructose-ring-opening-mechanism-models.json',reactionId:'fructose-hemiketal',variantId:'beta-pyranose-ring-opening',title:'β-D-吡喃果糖開環',group:'環鏈互變',shortLabel:'果糖 β 六員開環'},
 {id:'electron-imine-hydrolysis',file:'maillard-mechanism-models.json',reactionId:'maillard-schiff-base',reverse:true,title:'Schiff 鹼的酸催化水解',group:'羰基與胺',shortLabel:'Schiff 鹼水解'},
 {id:'electron-practice-lactose-acid-hydrolysis',file:'disaccharide-mechanism-models.json',reactionId:'lactose-hydrolysis',title:'乳糖的酸催化水解',group:'糖苷鍵',shortLabel:'乳糖酸水解'},
 {id:'electron-practice-sucrose-acid-hydrolysis',file:'disaccharide-mechanism-models.json',reactionId:'sucrose-inversion',title:'蔗糖的酸催化水解',group:'糖苷鍵',shortLabel:'蔗糖酸水解'},
 {id:'electron-practice-methyl-glucoside-formation',file:'mechanism-models.json',reactionId:'methyl-glucoside-formation',title:'甲基葡萄糖苷形成',group:'糖苷鍵',shortLabel:'甲基糖苷形成'},
 {id:'electron-practice-methyl-glucoside-hydrolysis',file:'mechanism-models.json',reactionId:'methyl-glucoside-hydrolysis',title:'甲基葡萄糖苷水解',group:'糖苷鍵',shortLabel:'甲基糖苷水解'},
 {id:'electron-practice-methylated-anomeric-hydrolysis',file:'ether-mechanism-models.json',reactionId:'glucose-etherification',variantId:'anomeric-hydrolysis',title:'全甲基化糖苷的異頭水解',group:'糖苷鍵',shortLabel:'甲基化糖苷水解'},
 {id:'electron-practice-maltose-glucoamylase',file:'glucoamylase-inverting-mechanism-models.json',reactionId:'maltose-hydrolysis',variantId:'glucoamylase-inverting-hydrolysis',title:'Glucoamylase 反轉型水解',group:'酵素機構',shortLabel:'麥芽糖反轉型'},
 {id:'electron-practice-lactose-lacz',file:'lacz-retaining-mechanism-models.json',reactionId:'lactose-hydrolysis',variantId:'lacz-retaining-hydrolysis',title:'LacZ 保留型水解',group:'酵素機構',shortLabel:'乳糖保留型'},
 {id:'electron-practice-gluconic-lactonization',file:'ester-mechanism-models.json',reactionId:'gluconic-acid-lactonization',variantId:'lactonization',title:'葡萄糖酸形成 δ-內酯',group:'羧酸與酯',shortLabel:'葡萄糖酸內酯化'},
 {id:'electron-practice-gluconolactone-hydrolysis',file:'ester-mechanism-models.json',reactionId:'gluconic-acid-lactonization',variantId:'hydrolysis',title:'葡萄糖酸 δ-內酯水解',group:'羧酸與酯',shortLabel:'δ-內酯水解'},
 {id:'electron-practice-gluconic-dissociation',file:'ester-mechanism-models.json',reactionId:'gluconic-acid-lactonization',variantId:'acid-dissociation',title:'葡萄糖酸解離',group:'羧酸與酯',shortLabel:'羧酸解離'},
 {id:'electron-practice-ester-hydrolysis',file:'ester-mechanism-models.json',reactionId:'ester-hydrolysis',title:'五個乙酸酯位點的鹼性水解',group:'羧酸與酯',shortLabel:'乙酸酯鹼水解'},
 {id:'electron-practice-aldose-ketose',file:'mechanism-models.json',reactionId:'glucose-fructose-isomerization',workbenchVersion:2,title:'烯二醇路徑：葡萄糖轉成果糖',group:'烯二醇與重排',shortLabel:'葡萄糖 → 果糖'},
 {id:'electron-practice-glucose-epimerization',file:'mechanism-models.json',reactionId:'glucose-mannose-epimerization',workbenchVersion:2,title:'葡萄糖 C2 差向異構化',group:'烯二醇與重排',shortLabel:'葡萄糖 → 甘露糖'},
 {id:'electron-practice-amadori',file:'maillard-mechanism-models.json',reactionId:'maillard-amadori',workbenchVersion:2,title:'Amadori 重排：羰基移到 C2',group:'羰基與胺',shortLabel:'Amadori 重排'},
 {id:'electron-practice-heyns',file:'heyns-mechanism-models.json',reactionId:'maillard-heyns',workbenchVersion:2,title:'Heyns 路徑：羰基回到 C1',group:'羰基與胺',shortLabel:'Heyns 路徑'},
 {id:'electron-practice-strecker',file:'strecker-mechanism-models.json',reactionId:'maillard-strecker',variantId:'oxazolidinone-path-a',workbenchVersion:2,title:'Strecker：碳與氮各去哪裡？',group:'羰基與胺',shortLabel:'Strecker 文獻支路'},
];
export const ELECTRON_CATALOG_ENTRIES=Object.freeze(entries.map(entry=>Object.freeze(entry)));
const byId=new Map(ELECTRON_CATALOG_ENTRIES.map(entry=>[entry.id,entry]));

/** IDs are activity/storage identities, including direction. The original
 * three IDs still denote precisely the original forward mechanisms. */
export function resolveElectronEntry(id){
 const entry=byId.get(id);
 if(!entry)throw new RangeError('找不到這個電子工作台活動。');
 return entry;
}

const reverseText={
 'electron-glucose-opening':{
  overallEquation:'β-D-吡喃葡萄糖 ⇌ 開鏈 D-葡萄糖（酸催化；沒有淨加水）',
  source:{title:'OpenStax 19.10 · Reversible hemiacetal formation',url:'https://openstax.org/books/organic-chemistry/pages/19-10-nucleophilic-addition-of-alcohols-acetal-formation'},
  steps:[
   ['環氧接受質子','β-D-吡喃葡萄糖 + H₃O⁺ ⇌ 環氧質子化葡萄糖⁺ + H₂O','將環氧轉為可接受斷鍵電子對的質子化形態。'],
   ['開環並重建羰基','環氧質子化葡萄糖⁺ ⇌ 羰基氧質子化的開鏈葡萄糖⁺','羥基氧提供電子對重建羰基，同一批把環上碳氧鍵電子交回環氧。'],
   ['去質子化並再生酸','羰基氧質子化的開鏈葡萄糖⁺ + H₂O ⇌ 開鏈 D-葡萄糖 + H₃O⁺','水接走羰基氧的質子，恢復中性醛基並再生明示酸載體。'],
  ],
 },
 'electron-imine-hydrolysis':{
  overallEquation:'開鏈 Schiff 鹼 + H₂O ⇌ 開鏈葡萄糖 + 甘胺酸（所選酸催化微觀態）',
  source:{title:'OpenStax 19.8 · Reversible imine formation and acid-catalyzed hydrolysis',url:'https://openstax.org/books/organic-chemistry/pages/19-8-nucleophilic-addition-of-amines-imine-and-enamine-formation'},
  additionalSources:[{title:'Craig Jasperse · Chem 342, pp. 7 and 10: acid-catalyzed imine hydrolysis',url:'https://web.mnstate.edu/jasperse/Chem342/342Classbook/Classbook%20Chem342%202011-Test%203.pdf'}],
  steps:[
   ['亞胺氮接受質子','Schiff 鹼 + H₃O⁺ ⇌ 亞胺鎓離子 + H₂O','亞胺氮接受質子，形成所選亞胺鎓起始形態。'],
   ['水加成到亞胺鎓','亞胺鎓離子 + H₂O ⇌ 羥基質子化的胺醇','水提供孤對電子，同時把碳氮雙鍵的一對電子交回氮。'],
   ['新羥基去質子化','羥基質子化的胺醇 + H₂O ⇌ 中性胺醇 + H₃O⁺','水接走新羥基的一個質子；這是指定的質子接力記帳。'],
   ['胺氮接受質子','中性胺醇 + H₃O⁺ ⇌ 氮質子化的胺醇 + H₂O','胺氮接受質子，使後續碳氮鍵異裂可釋出中性胺。'],
   ['重建羰基並釋出胺','氮質子化的胺醇 ⇌ 羰基氧質子化的開鏈葡萄糖⁺ + 甘胺酸','羥基氧提供電子對建立羰基，同批將碳氮鍵電子交回氮；先生成質子化羰基與此模型所選的游離胺微觀態。'],
   ['羰基氧去質子化並再生酸','羰基氧質子化的開鏈葡萄糖⁺ + H₂O ⇌ 開鏈葡萄糖 + H₃O⁺','水接走羰基氧上的質子，恢復中性醛基並再生明示酸載體。'],
  ],
 },
};
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=message=>{throw new TypeError(message);};

function checkMechanism(mechanism){
 if(!isObject(mechanism)||!Array.isArray(mechanism.steps)||!mechanism.steps.length||!Array.isArray(mechanism.states)||mechanism.states.length!==mechanism.steps.length+1)fail('反應資料缺少完整步驟或結構。');
 if(!Array.isArray(mechanism.sources)||!mechanism.sources.length||mechanism.sources.some(source=>!isObject(source)||typeof source.title!=='string'||!source.title.trim()||typeof source.url!=='string'||!/^https?:\/\//.test(source.url)))fail('反應資料缺少可閱讀的來源。');
 if(typeof mechanism.limits!=='string'||!mechanism.limits.trim())fail('反應資料缺少模型界線。');
 for(const [index,state] of mechanism.states.entries()){
  if(!Array.isArray(state?.atoms)||state.atoms.some(atom=>!Array.isArray(atom.position)||atom.position.length!==3||!atom.position.every(Number.isFinite)))fail(`第 ${index+1} 個結構缺少完整的有限三維座標。`);
 }
 for(const [index,step] of mechanism.steps.entries()){
  if(!isObject(step)||typeof step.title!=='string'||!step.title.trim()||typeof step.equation!=='string'||!step.equation.trim())fail(`第 ${index+1} 步缺少標題或反應式。`);
  const result=evaluateElectronArrows(mechanism.states[index],step.arrows,{referenceAfter:mechanism.states[index+1]});
  if(!result.ok||!result.matchesReference){
   const reason=result.issues.map(issue=>issue.code).join(', ')||'reference-graph-mismatch';
   fail(`第 ${index+1} 步的電子收支或參考鍵圖未通過核對：${reason}。`);
  }
 }
}

function invertArrows(arrows){
 return arrows.map(([source,target])=>{
  const endpoints=source.split('-');
  if(endpoints.length===1)return [source+'-'+target,source];
  if(endpoints.length===2&&endpoints.includes(target))return [target,endpoints.find(id=>id!==target)];
  fail('這支箭頭不能用目前兩種電子對操作反轉。');
 });
}

// Acidic imine hydrolysis need not visit the charge-separated alkoxide of the
// selected forward amine-addition depiction. Build its protonated carbonyl
// independently from the N-protonated carbinolamine, not by using the evaluator
// to fabricate its own reference. Positions are only an unoptimized schematic.
function imineHydrolysisCarbonyl(carbinolamine,id){
 const atoms=carbinolamine.atoms.map(atom=>{
  const formalCharge=atom.id==='O1'?1:atom.id==='Ng'?0:atom.formalCharge??atom.charge;
  return {id:atom.id,element:atom.element,position:[...atom.position],formalCharge,charge:formalCharge};
 });
 const key=bond=>[bond.a,bond.b].sort().join('-');
 const bonds=carbinolamine.bonds.filter(bond=>key(bond)!=='C1-Ng').map(bond=>({a:bond.a,b:bond.b,order:key(bond)==='C1-O1'?2:bond.order}));
 return {id:id+'-state-5',name:'羰基氧質子化的開鏈葡萄糖與游離胺',formula:carbinolamine.formula,atoms,bonds,metadata:{
  isTrajectory:false,isFreeEnergyMinimum:false,isObservedIntermediateClaim:false,
  geometry:'unoptimized schematic coordinates reused from the N-protonated carbinolamine; no new geometry calculation',
  derivedFromForwardStateId:carbinolamine.id,
  chemicalIdentity:'independently specified protonated carbonyl graph; old SMILES, InChI and CIP labels discarded',
 }};
}

/** Pure adapter. Supply parsed JSON from entry.file (molecules for the builtin,
 * mechanisms for all other files). A missing variant matches only undefined,
 * never the first similarly named branch. Input graphs and metadata remain
 * unchanged; outputs are independently mutable copies.
 *
 * Only the two allowlisted reverse lessons are constructed here. Algebraic
 * reversibility does not grant a new reaction, rate or equilibrium prediction.
 */
export function prepareElectronMechanism(entry,data){
 if(!isObject(entry))fail('需要有效的活動設定。');
 const canonical=resolveElectronEntry(entry.id);
 for(const field of ['file','reactionId','variantId','reverse','workbenchVersion'])if(entry[field]!==canonical[field])fail('活動設定與已核准的反應分支不一致。');
 if(!isObject(data))fail('缺少已載入的反應資料。');
 let mechanisms;
 if(canonical.file==='molecules.json'){
  if(!Array.isArray(data.molecules))fail('葡萄糖模型缺少 molecules 資料。');
  mechanisms=builtinMechanisms(structuredClone(data.molecules));
 }else{
  if(!Array.isArray(data.mechanisms))fail('反應檔案缺少 mechanisms 陣列。');
  mechanisms=data.mechanisms;
 }
 const matches=mechanisms.filter(m=>isObject(m)&&m.reactionId===canonical.reactionId&&m.variantId===canonical.variantId);
 if(matches.length!==1)fail(matches.length?'同一反應分支出現重複資料，無法選擇。':'資料中找不到指定的反應與分支。');
 let mechanism=structuredClone(matches[0]);
 // Four legacy drawings point a pi-bond at H without naming which carbon
 // retains the pair. Curated, explicit target bonds replace that shorthand;
 // never infer the endpoint from atom labels, valence or the reference graph.
 const relay={
  'electron-practice-amadori':[2,'C1-C2','HC2','C1-HC2'],
  'electron-practice-heyns':[8,'C1-C2','HC1a','C2-HC1a'],
  'electron-practice-aldose-ketose':[3,'C1-C2','HO2','C1-HO2'],
  'electron-practice-glucose-epimerization':[1,'C1-C2','HC2','C2-HC2'],
 }[canonical.id];
 if(relay){
  const [index,from,to,bond]=relay,step=mechanism.steps[index];
  if(!step||step.arrows.filter(a=>a[0]===from&&a[1]===to).length!==1)fail('原簡寫箭頭已改變，不能套用既定的目的鍵說明。');
  step.arrows=step.arrows.map(a=>a[0]===from&&a[1]===to?[from,bond]:a);
  step.explicitTargetBond={source:from,legacyTarget:to,targetBond:bond};
  mechanism.limits+=' 此工作台把所選碳氫成鍵明列為兩端原子的目的鍵；不由引擎猜成鍵端，也不從連接記帳判定立體選擇。';
 }
 checkMechanism(mechanism);
 if(canonical.reverse){
  const notes=reverseText[canonical.id];
  if(!notes||notes.steps.length!==mechanism.steps.length)fail('缺少已核准的逆向教學說明。');
  const original=mechanism;
  const states=original.states.slice().reverse().map((state,index)=>({...state,id:canonical.id+'-state-'+index,name:index===0?'逆向路徑起點：'+state.name:index===original.steps.length?'逆向路徑終點：'+state.name:'逆向教學端點：'+state.name,metadata:{...state.metadata,reverseOfForwardStateId:state.id,isTrajectory:false}}));
  const steps=original.steps.slice().reverse().map((step,index)=>{
   const arrows=invertArrows(step.arrows),[title,equation,explanation]=notes.steps[index];
   return {title,equation,explanation,instruction:'由目前端點組出所選逆向步驟的電子對移動。',source:arrows[0][0],target:arrows[0][1],arrows,reverseOfForwardStep:original.steps.length-1-index};
  });
  const imine=canonical.id==='electron-imine-hydrolysis';
  if(imine){
   states[5]=imineHydrolysisCarbonyl(original.states[2],canonical.id);
   for(const [index,arrows] of [[4,[['O1','C1'],['C1-Ng','Ng']]],[5,[['Osol','Hcat'],['O1-Hcat','O1']]]]){
    steps[index]={...steps[index],arrows,source:arrows[0][0],target:arrows[0][1],adaptation:'acid-hydrolysis'};delete steps[index].reverseOfForwardStep;
   }
  }
  mechanism={...original,title:canonical.title,states,steps,overallEquation:notes.overallEquation,sources:[...original.sources,structuredClone(notes.source),...structuredClone(notes.additionalSources||[])],reverseOf:{reactionId:canonical.reactionId,variantId:canonical.variantId??null},isTrajectory:false,limits:original.limits+(imine?' 本活動為酸催化水解適配：釋出胺時先形成質子化羰基，再去質子化；該羰基端點沿用胺醇座標作未最佳化示意，不沿用其化學身分標籤。其餘端點重用既有正向結構。':' 本活動反序重用所選正向端點與明示質子。')+' 僅作逆向電子記帳教學；不聲稱各形式態均可觀察，也不預測逆反應速率、平衡比例或食品加工條件。'};
  checkMechanism(mechanism);
 }
 const tasks=relayTasks[canonical.id];
 if(tasks&&tasks.length!==mechanism.steps.length)fail('步驟目標與已核准的反應不一致。');
 return {mechanism,tasks:tasks?[...tasks]:mechanism.steps.map(()=> '從目前結構出發，組出這一步的電子對移動。')};
}
