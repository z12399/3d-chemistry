import {reactionState,REACTION_STEPS,reactionEquation} from './reactions.js';

export function builtinMechanisms(catalog){
 const names=['開鏈葡萄糖與酸','O1 質子化的開鏈葡萄糖','O5 進攻後的環狀氧鎓離子','β-D-吡喃葡萄糖與再生的酸'];
 const states=[3,4,5,6].map(stage=>{const model=reactionState(catalog,stage);return {...model,id:'glucose-hemiacetal-state-'+(stage-3),name:names[stage-3],atoms:model.atoms.map(a=>({...a,formalCharge:a.charge||0}))};});
 return [{reactionId:'glucose-hemiacetal',title:'葡萄糖半縮醛成環：羥基進攻醛基',kind:'atom-mapped teaching mechanism',isTrajectory:false,states,
 steps:[3,4,5].map(stage=>{const s=REACTION_STEPS[stage];return {...s,title:['活化醛羰基','O5 進攻 C1，形成六員環','移走環氧質子，再生酸'][stage-3],...(stage===3?{instruction:'讓羰基氧 O1 接受酸上的 HO1。',explanation:'羰基氧質子化後，提高 C1 的親電子性；C5 羥基氧可以進行分子內加成。'}:{}),equation:reactionEquation(stage)};}),
 limits:'沿用已驗證的酸催化成環三步，保留糖與酸／水的28個原子及總電荷+1。此處選β六員環分支；不是全部異頭物或環大小。座標補間為教學示意，未計算自由能面或速率。',
 sources:[{title:'OpenStax: cyclic structures of monosaccharides','url':'https://openstax.org/books/organic-chemistry/pages/25-5-cyclic-structures-of-monosaccharides-anomers'},{title:'OpenStax: alcohol addition and hemiacetals','url':'https://openstax.org/books/organic-chemistry/pages/19-10-nucleophilic-addition-of-alcohols-acetal-formation'}]}];
}
