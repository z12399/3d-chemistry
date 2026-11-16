import {add,sub,unit,scale,dot,cross,norm} from './math.js';

export const REACTION_STEPS=[
 {title:'α-D-葡萄糖',short:'α 環形',instruction:'先讓環氧 O5 接受酸的質子，準備開環。',source:'O5',target:'Hcat',sourceLabel:'O5 的孤對電子',targetLabel:'酸的質子 H★',arrows:[['O5','Hcat'],['Ocat-Hcat','Ocat']],explanation:'O5 的孤對電子形成 O5—H★；原來 O水—H★ 的電子回到水氧。環氧得到正電荷。',equation:'O5: → H★；O水—H★ → O水',highlight:['O5','Hcat','Ocat'],note:'酸催化路徑。H★ 是追蹤用的質子標記。'},
 {title:'環氧已質子化',short:'活化環氧',instruction:'從 O1 提供電子給 C1，同時鬆開 C1—O5。',source:'O1',target:'C1',sourceLabel:'O1 的孤對電子',targetLabel:'異頭碳 C1',arrows:[['O1','C1'],['C1-O5','O5']],explanation:'兩組電子同步移動：O1 形成 C1=O1，C1—O5 的電子回到 O5。C1 始終四價。',equation:'O1: → C1；C1—O5 → O5',highlight:['O1','C1','O5'],note:'O1 留在 C1，成為羰基氧；O5 留在 C5。'},
 {title:'質子化的開鏈糖',short:'打開糖環',instruction:'讓水帶走 O1 上的質子，得到中性的開鏈醛。',source:'Ocat',target:'HO1',sourceLabel:'水氧的孤對電子',targetLabel:'O1 上的質子 H1',arrows:[['Ocat','HO1'],['O1-HO1','O1']],explanation:'水接受 H1，O1—H1 的電子留給 O1。C1 變成平面的羰基碳，不再是立體中心。',equation:'O水: → H1；O1—H1 → O1',highlight:['Ocat','HO1','O1'],note:'中性開鏈糖是少量、持續存在的平衡成員。'},
 {title:'開鏈 D-葡萄糖',short:'開鏈醛',instruction:'成環前，讓 O1 再接一個質子，活化羰基。',source:'O1',target:'HO1',sourceLabel:'羰基氧 O1 的孤對電子',targetLabel:'酸的質子 H1',arrows:[['O1','HO1'],['Ocat-HO1','Ocat']],explanation:'這是前一步質子轉移的逆向。活化的羰基能接受 C5 羥基氧的電子。',equation:'O1: → H1；O水—H1 → O水',highlight:['O1','HO1','Ocat'],note:'可以由平面的 C1 兩面接近，因此再成環可能得到 α 或 β。'},
 {title:'準備重新成環',short:'活化羰基',instruction:'讓 C5 上的 O5 進攻 C1，同時移開 C=O 的 π 電子。',source:'O5',target:'C1',sourceLabel:'O5 的孤對電子',targetLabel:'羰基碳 C1',arrows:[['O5','C1'],['C1-O1','O1']],explanation:'形成新的 C1—O5 鍵時，C1=O1 的 π 電子回到 O1，避免 C1 五價。成環方向決定 α 或 β。',equation:'O5: → C1；C1=O1 的 π → O1',highlight:['O5','C1','O1'],note:'選擇成環面是引導練習；不代表單次碰撞必然形成指定異頭物。'},
 {title:'質子化的糖環',short:'重新成環',instruction:'用水移走環氧 O5 上的質子，回到中性糖。',source:'Ocat',target:'Hcat',sourceLabel:'水氧的孤對電子',targetLabel:'O5 上的質子 H★',arrows:[['Ocat','Hcat'],['O5-Hcat','O5']],explanation:'O5—H★ 的電子留給 O5，水變回 H₃O⁺。酸催化劑再生，糖沒有淨失去一分子水。',equation:'O水: → H★；O5—H★ → O5',highlight:['Ocat','Hcat','O5'],note:'催化提供路徑；不能單憑加酸改變同條件下的平衡常數。'},
 {title:'完成變旋路徑',short:'中性糖環',instruction:'觀察 C1 的新配置，將這條路徑存進筆記。',source:null,target:null,arrows:[],explanation:'α 與 β 經開鏈形互相轉換。平衡時雙向反應仍在發生，較多的 β 並不表示所有分子都永久停在 β。',equation:'α ⇌ 開鏈 ⇌ β',highlight:['C1','O1','C5','C6'],note:'全程原子數與總電荷守恆；3D 移動為機構示意，不是計算反應軌跡。'}
];
export function reactionEquation(stage,product='glucose-beta'){
 const ring=product==='glucose-beta'?'β-D-葡萄糖':'α-D-葡萄糖';
 return [
  'α-D-葡萄糖 + H₃O⁺ ⇌ O5-質子化 α-D-葡萄糖 + H₂O',
  'O5-質子化 α-D-葡萄糖 ⇌ O1-質子化開鏈 D-葡萄糖',
  'O1-質子化開鏈 D-葡萄糖 + H₂O ⇌ 開鏈 D-葡萄糖 + H₃O⁺',
  '開鏈 D-葡萄糖 + H₃O⁺ ⇌ O1-質子化開鏈 D-葡萄糖 + H₂O',
  `O1-質子化開鏈 D-葡萄糖 ⇌ O5-質子化 ${ring}`,
  `O5-質子化 ${ring} + H₂O ⇌ ${ring} + H₃O⁺`,
  `α-D-葡萄糖 ⇌ 開鏈 D-葡萄糖 ⇌ ${ring}`
 ][stage];
}
const clone=m=>({...m,atoms:m.atoms.map(a=>({...a,position:[...a.position],charge:0})),bonds:m.bonds.map(b=>({...b})),rotatableBonds:[]});
const hydrogen=(id,position)=>({id,element:'H',position,charge:0});
function neighborH(model,oxygen){
 const o=model.atoms.find(a=>a.id===oxygen),neighbors=model.bonds.filter(b=>b.a===oxygen||b.b===oxygen).map(b=>model.atoms.find(a=>a.id===(b.a===oxygen?b.b:b.a))),vectors=neighbors.map(n=>unit(sub(n.position,o.position)));
 let candidates;
 if(vectors.length===1){const u=vectors[0],carbon=neighbors[0],adjacent=model.bonds.find(b=>(b.a===carbon.id&&b.b!==oxygen)||(b.b===carbon.id&&b.a!==oxygen));const other=model.atoms.find(a=>a.id===(adjacent?.a===carbon.id?adjacent.b:adjacent?.a));let v=other?sub(other.position,carbon.position):[0,0,1];v=sub(v,scale(u,dot(v,u)));if(norm(v)<.01)v=cross(u,[0,1,0]);v=unit(v);candidates=[add(scale(u,-.5),scale(v,Math.sqrt(3)/2)),add(scale(u,-.5),scale(v,-Math.sqrt(3)/2))];}
 else {const [u,v]=vectors,b=unit(add(u,v)),n=unit(cross(u,v));const k=Math.max(-.95,Math.min(.95,(-1/3)/(dot(b,u)||1))),h=Math.sqrt(1-k*k);candidates=[add(scale(b,k),scale(n,h)),add(scale(b,k),scale(n,-h))];}
 const score=d=>Math.min(...model.atoms.filter(a=>a.id!==oxygen).map(a=>norm(sub(add(o.position,scale(d,.97)),a.position))));const direction=candidates.sort((a,b)=>score(b)-score(a))[0];return add(o.position,scale(unit(direction),.97));
}
export function reactionState(catalog,stage,product='glucose-beta'){
 if(!Number.isInteger(stage)||stage<0||stage>6)throw new Error('Reaction stage must be 0..6');
 if(!['glucose-alpha','glucose-beta'].includes(product))throw new Error('Invalid reaction product');
 const base=stage<2?'glucose-alpha':stage<5?'glucose-open':product;
 const model=clone(catalog.find(m=>m.id===base));model.id=`reaction-${stage}`;model.name=REACTION_STEPS[stage].title;
 if(stage>=2&&stage<=4){model.atoms.find(a=>a.id==='HO5').id='Hcat';for(const b of model.bonds){if(b.a==='HO5')b.a='Hcat';if(b.b==='HO5')b.b='Hcat';}}
 const catalystPosition=[5.2,-.5,.5];model.atoms.push({id:'Ocat',element:'O',position:catalystPosition,charge:0},hydrogen('Hwa',[5.85,.18,.65]),hydrogen('Hwb',[5.73,-1.2,.14]));model.bonds.push({a:'Ocat',b:'Hwa',order:1},{a:'Ocat',b:'Hwb',order:1});
 const extra=(id,to)=>{model.atoms.push(hydrogen(id,neighborH(model,to)));model.bonds.push({a:to,b:id,order:1});};
 if(stage===0||stage===6){extra('Hcat','Ocat');model.atoms.find(a=>a.id==='Ocat').charge=1;}
 if(stage===1){extra('Hcat','O5');model.atoms.find(a=>a.id==='O5').charge=1;}
 if(stage===2||stage===4){extra('HO1','O1');model.atoms.find(a=>a.id==='O1').charge=1;}
 if(stage===3){extra('HO1','Ocat');model.atoms.find(a=>a.id==='Ocat').charge=1;}
 if(stage===5){extra('Hcat','O5');model.atoms.find(a=>a.id==='O5').charge=1;}
 model.formula='C6H15O7+';model.metadata={method:'酸催化機構教學模型；中間體幾何及座標過渡未作量子最佳化',isTrajectory:false};return model;
}
export function validateReactionMove(stage,source,target){const step=REACTION_STEPS[stage];if(!step?.source)return {ok:false,message:'這條機構已完成，可以回看或重新開始。'};if(source===step.source&&target===step.target)return {ok:true,message:step.explanation};if(source?.startsWith('C'))return {ok:false,message:'電子箭尾應從提供電子的位置出發。這一步請找氧的孤對電子。'};if(source===target)return {ok:false,message:'請選不同的電子來源與目的地。'};if(target==='O1'&&stage===1)return {ok:false,message:'開環時，O1 需要把孤對電子提供給 C1；斷開的是 C1—O5。'};return {ok:false,message:`這一步需要「${step.sourceLabel}」移向「${step.targetLabel}」。成套的另一支箭頭會一起執行，保持價數正確。`};}
export function validateValence(model){const sums=Object.fromEntries(model.atoms.map(a=>[a.id,0]));for(const b of model.bonds){if(!(b.a in sums)||!(b.b in sums))return false;sums[b.a]+=b.order;sums[b.b]+=b.order;}return model.atoms.every(a=>sums[a.id]===({C:4,H:1,O:a.charge===1?3:2}[a.element]));}
