// These are overview display roles, not chemical validation results. Indices
// refer to reaction-curriculum.json; a loaded mapped state takes precedence.
const reference=(label='位置參照 · 本概覽未顯示中間態',description='')=>({kind:'reference',label,description});
const representative=(label,description='')=>({kind:'representative',label,description});
const coproduct=(label,description)=>({kind:'coproduct',label,description});
const parallel=(label,description)=>({kind:'parallel',label,description});
const fragment=(label,description)=>({kind:'fragment',label,description});

const stageRoles={
  'glucose-mutarotation':{0:reference(),1:reference(),3:reference()},
  'glucose-hemiacetal':{1:reference()},
  'fructose-hemiketal':{
    1:reference('位置參照 · 仍為開鏈果糖'),
    2:representative('所選環形 · β-D-呋喃果糖','這是四個環形端點之一，不表示其他環形不存在，也不表示其平衡比例。')
  },
  'methyl-glucoside-formation':{0:reference(),1:reference()},
  'methyl-glucoside-hydrolysis':{1:reference()},
  'glucose-bromine-oxidation':{1:reference()},
  'glucose-tollens-test':{
    1:reference(),
    2:reference('糖的參照結構 · 銀鏡與產物未建模')
  },
  'glucose-copper-test':{
    1:reference(),
    2:reference('糖的參照結構 · 銅配合物與沉澱未建模')
  },
  'glucose-c6-oxidation':{
    1:reference(),
    2:representative('官能基對照 · 游離中性酸','這個游離酸只用來比較官能基，不等於 UDP 酵素路徑的直接產物。')
  },
  'glucose-double-oxidation':{1:reference()},
  'glucose-fructose-isomerization':{
    1:representative('中性烯二醇示意 · 非完整離子機構')
  },
  'glucose-mannose-epimerization':{
    1:representative('中性烯二醇示意 · 非完整離子機構')
  },
  'glucose-phosphorylation':{
    1:reference('位置參照 · 磷醯基轉移未呈現'),
    2:representative('磷酸糖骨架 · 留意質子化態','模型採資料所選的質子化態；反應式的離子形式需另行對照。')
  },
  'hexose-hmf-dehydration':{1:reference('位置參照 · 脫水中間體未建模')},
  'pentose-furfural-dehydration':{1:reference('位置參照 · 脫水中間體未建模')},
  'hmf-rehydration':{
    1:reference('位置參照 · 水合中間體未建模'),
    2:coproduct('共產物之一 · 乙醯丙酸','乙醯丙酸與下一畫面的甲酸屬於同一條淨反應，並非前後轉換。'),
    3:coproduct('同一反應的共產物 · 甲酸','甲酸與上一畫面的乙醯丙酸共同生成；畫面切換不表示乙醯丙酸轉成甲酸。')
  },
  'maillard-late-network':{
    0:representative('網路入口 · Amadori 代表結構'),
    1:representative('網路代表節點 · 非唯一產物'),
    2:reference('網路參照 · 後期產物未完整建模')
  },
  'caramelization-network':{
    1:representative('網路代表節點 · HMF 非唯一產物'),
    2:reference('原料參照 · 縮合混合物未建模')
  },
  'starch-hydrolysis':{
    0:fragment('有限片段 · 非完整澱粉','麥芽三糖只代表一段 α(1→4) 連接。'),
    1:fragment('獨立鍵型對照 · 非完整分枝點','異麥芽糖用來對照 α(1→6) 鍵，不是上一片段的下一個水解產物。'),
    2:fragment('較短寡糖代表 · 非唯一切割結果','麥芽糖是較短鏈的一個代表，不能據此推斷所有酵素切點與產物。')
  },
  'cellulose-hydrolysis':{
    0:fragment('有限片段 · 非完整纖維素','纖維二糖用來辨認 β(1→4) 連接；未顯示完整鏈或晶體。'),
    1:fragment('寡糖片段代表 · 未顯示逐步斷鏈','沿用纖維二糖作短鏈參照，沒有呈現長鏈逐次切割。')
  },
  'osazone-formation':{
    0:reference('起始糖參照 · 糖苯腙未建模'),
    1:reference('位置參照 · 本階段中間體未建模'),
    2:reference('起始糖參照 · 糖脎與共產物未建模')
  },
  'enzymatic-transglycosylation':{
    0:representative('單一蔗糖代表 · 供體與受體未同場'),
    1:reference('位置參照 · 糖基酵素中間體未建模'),
    2:coproduct('所選產物 · 共產物未同場','只顯示 1-kestose；葡萄糖共產物未在同一場景呈現。')
  },
  'wohl-glucose-arabinose':{
    3:{kind:'formal',label:'形式骨架 · 非已分離中間體',description:'此未保護氰醇腈是形式記帳端點，不是此程序已分離到的中間體。'}
  },
  'starch-alpha-amylase-g5-single-cut':{
    1:coproduct('同一次切割 · G2 產物','與下一畫面的 G3 是同次水解的兩個片段；釋出先後不表示 G2 再變成 G3。'),
    2:coproduct('同一次切割 · G3 共產物','這是上一畫面那次 G5 切割的另一個片段，不是再切一個糖苷鍵。')
  },
  'starch-beta-amylase-g5-single-cut':{
    1:coproduct('同一次切割 · 初生 β-G2','與下一畫面的 G3 是同次 G5 水解的兩個片段。'),
    2:coproduct('同一次切割 · 剩餘 G3','此 G3 保留所選底物的還原端；不是 β-G2 再轉成 G3。')
  },
  'koenigs-knorr-neighboring-group-participation':{
    1:representative('獨立受體 · 甲醇','甲醇是另一反應物；前一畫面的供體沒有轉變成甲醇。'),
    2:reference('供體位置參照 · 橋式中間體未建模')
  },
  'udp-glucose-6-dehydrogenase':{
    1:reference('位置參照 · 酵素束縛醛未建模'),
    2:reference('位置參照 · 共價中間體未建模')
  },
  'udp-galactose-4-epimerase':{
    1:reference('位置參照 · 4-酮中間體未建模'),
    2:reference('位置參照 · 定向與還原未呈現')
  },
  'glucose-isomerase-metal-hydride-transfer':{
    2:reference('位置參照 · 氫移位與金屬位未建模')
  },
  'hmf-acid-humin-parallel-network':{
    1:coproduct('液相支路 · 乙醯丙酸共產物','乙醯丙酸與下一畫面的甲酸共同生成；固體 humin 是另一條競爭支路。'),
    2:coproduct('同一液相支路 · 甲酸共產物','不是乙醯丙酸轉成甲酸，也不是 humin 形成前的必經階段。'),
    3:reference('另一路位置參照 · DHH 未建模','此處改看候選固體支路，不表示前面的液相產物接著轉成 DHH。'),
    4:reference('原料參照 · humin 固體網路未建模')
  },
  'sucrose-synthase-udp-glucose-transfer':{
    1:representative('獨立受體 · 果糖','果糖是與 UDP-糖反應的另一底物，不是上一畫面供體的轉化產物。'),
    2:reference('供體位置參照 · 活性位轉移未建模'),
    3:coproduct('所選產物 · 蔗糖','蔗糖與下一畫面的 UDP 屬同一淨反應；H+ 在反應式記帳。'),
    4:coproduct('同一反應的共產物 · UDP','UDP 是糖基轉移的共產物，不是蔗糖再轉化而來；H+ 未顯示 3D。')
  },
  'maillard-amadori-deoxyosone-network':{
    1:parallel('平行支路 A · 3-DG','與下一畫面的 1-DG 是不同支路端點，非前後轉化；不表示固定比例。'),
    2:parallel('平行支路 B · 1-DG','1-DG 與前一畫面的 3-DG 為並列支路，不是 3-DG 的下一步。'),
    3:coproduct('兩支路的共同釋放物 · 甘胺酸','甘胺酸是支路的共同釋放產物，不是 1-DG 單獨轉化而來。')
  },
  'alkaline-glucose-lactate-network':{
    2:reference('位置參照 · 裂解產物與金屬位未建模'),
    3:parallel('可能端點 R · 非實測構型','R、S 是可能端點的並列展示；原研究未定其構型或比例。'),
    4:parallel('可能端點 S · 非 R→S 反應','不是前一畫面的 R 端點轉成 S，也不表示各占一半。')
  }
};

/**
 * Classify what an overview actually displays. `mapped` is a caller assertion
 * that the selected mechanism state loaded; a viewModel/mechanismState field
 * alone cannot establish that. Missing data always overrides every other role.
 * Returned strings are plain text; the renderer must escape them as usual.
 */
export function modelSemantics(reaction,stepIndex,{missing=false,mapped=false,endpointComparison=null}={}){
  if(missing)return {kind:'missing',label:'模型載入失敗 · 不是本步結構',description:'畫面中的替代結構僅作載入失敗提示，不代表本階段的反應物、中間體或產物。'};
  const step=Number.isInteger(stepIndex)&&stepIndex>=0?reaction?.steps?.[stepIndex]:undefined;
  const note=typeof step?.modelNote==='string'?step.modelNote.trim():'';
  if(reaction?.routeKind==='comparison')return {kind:'comparison',label:'結構比較 · 不是反應步驟',description:['各畫面是獨立結構的對照，不表示先後反應或跨分子原子映射。',note].filter(Boolean).join(' ')};
  if(mapped)return {kind:'mapped',label:'機構教學態 · 非反應軌跡',description:'目前顯示已載入的所選機構狀態；原子映射與電子記帳供逐步學習，不表示每態可分離、為能量極小值或是實測反應軌跡。'};
  if(reaction?.id==='glucose-isomerase-metal-hydride-transfer'&&stepIndex===2&&endpointComparison?.verified===true&&endpointComparison.glucoseId==='glucose-open'&&endpointComparison.fructoseId==='fructose-open')return {kind:'comparison',label:'Glc／Fru 端點比較 · 非中間體',description:'比較兩個自由開鏈糖的獨立代表構象與 C1／C2 鍵級。碳骨架編號及 C3–C5 構型已核對；H 未跨模型映射，沒有座標補間、酵素結合幾何或反應軌跡。'};
  const routeRoles=Object.hasOwn(stageRoles,reaction?.id)?stageRoles[reaction.id]:null;
  const role=step&&routeRoles&&Object.hasOwn(routeRoles,stepIndex)?routeRoles[stepIndex]:null;
  if(role)return {...role,description:[role.description,note].filter(Boolean).join(' ')||'此結構僅作本階段的位置或概念參照，不代表完整反應系統。'};
  return {kind:'representative',label:'代表結構 · 非反應軌跡',description:note||'此畫面顯示一個代表結構；沒有據此宣稱已建立本階段全部中間體、試劑、共產物或逐原子反應。'};
}
