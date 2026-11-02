export const escapeLipidHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const esc=escapeLipidHtml,number=id=>Number(id.slice(1)),key=(a,b)=>[a,b].sort().join('|');
const radicalChoices=new Set(['C8','C9','C10','O9']);
function safeGraph(graph){return graph&&Array.isArray(graph.atoms)&&graph.atoms.length<=60&&graph.atoms.every(a=>a&&typeof a.id==='string'&&['C','H','O'].includes(a.element))&&Array.isArray(graph.bonds)&&graph.bonds.length<=70&&graph.bonds.every(b=>b&&typeof b.a==='string'&&typeof b.b==='string'&&[1,2,3].includes(b.order))&&Array.isArray(graph.components)&&graph.components.length<=3&&graph.components.every(c=>c&&Array.isArray(c.atomIds)&&c.atomIds.every(id=>typeof id==='string'));}
function bondLines(a,b,order){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;return (order===3?[-6,0,6]:order===2?[-4,4]:[0]).map(o=>`<line x1="${a.x+nx*o}" y1="${a.y+ny*o}" x2="${b.x+nx*o}" y2="${b.y+ny*o}"></line>`).join('');}
function carbonBondLines(a,b,order,width){
 if(a.x!==b.x||Math.abs(a.y-b.y)<220||![70,width-70].includes(a.x))return bondLines(a,b,order);
 // Route the same chemical bond around the row-end cards and their product labels.
 const upper=a.y<=b.y?a:b,lower=a.y<=b.y?b:a,side=upper.x<width/2?-1:1,outerX=upper.x+side*50;
 return (order===3?[-6,0,6]:order===2?[-4,4]:[0]).map(offset=>{
  const topY=upper.y+offset*side,bottomY=lower.y-offset*side,routeX=outerX-offset;
  return `<line x1="${upper.x}" y1="${topY}" x2="${routeX}" y2="${topY}"></line><line x1="${routeX}" y1="${topY}" x2="${routeX}" y2="${bottomY}"></line><line x1="${routeX}" y1="${bottomY}" x2="${lower.x}" y2="${bottomY}"></line>`;
 }).join('');
}
function figure(graph,component,{editable=false,pending=true,reference=false}={}){
 const ids=new Set(component.atomIds),atoms=graph.atoms.filter(a=>ids.has(a.id)),carbons=atoms.filter(a=>a.element==='C').sort((a,b)=>number(a.id)-number(b.id));
 if(!carbons.length)return '<p>此片段缺少可顯示的碳鏈；原稿仍在下方。</p>';
 const columns=Math.min(component.role==='chain'?9:5,carbons.length),rows=Math.ceil(carbons.length/columns),positions=new Map();
 carbons.forEach((a,i)=>{const row=Math.floor(i/columns),column=row%2?columns-1-i%columns:i%columns;positions.set(a.id,{x:70+column*96,y:128+row*220+(column%2?14:0)});});
 for(const oxygen of atoms.filter(a=>a.element==='O')){const bond=graph.bonds.find(b=>(b.a===oxygen.id&&positions.has(b.b))||(b.b===oxygen.id&&positions.has(b.a)));if(bond){const parent=positions.get(bond.a===oxygen.id?bond.b:bond.a);positions.set(oxygen.id,{x:parent.x,y:parent.y-85});}}
 const width=columns*96+44,height=rows*220+28,byId=new Map(atoms.map(a=>[a.id,a]));
 const bonds=graph.bonds.filter(b=>positions.has(b.a)&&positions.has(b.b)).map(b=>`<g data-lc-bond="${esc(key(b.a,b.b))}" data-lc-bond-order="${esc(b.order)}">${byId.get(b.a).element==='C'&&byId.get(b.b).element==='C'?carbonBondLines(positions.get(b.a),positions.get(b.b),b.order,width):bondLines(positions.get(b.a),positions.get(b.b),b.order)}</g>`).join('');
 const numbers=new Map((graph.numberingFrame==='source-chain'?[]:graph.originToProductCarbon||[]).map(item=>[item.originAtomId,item.displayCarbonNumber]));
 const markers=Array.isArray(graph.virtualMarkers)?graph.virtualMarkers.filter(m=>m&&ids.has(m.atomId)):[],markerById=new Map(markers.map(m=>[m.atomId,m]));
 const nodes=[...positions].map(([atomId,p])=>{
  const atom=byId.get(atomId),hydrogens=atoms.filter(h=>h.element==='H'&&h.parentCarbonId===atomId).length,radical=atom.radicalElectrons>0,product=numbers.get(atomId),selectable=editable&&radicalChoices.has(atomId);
  const marker=markerById.get(atomId),markerColor={red:'#9f3535',blue:'#2d62a2',green:'#236c4f',yellow:'#8b6b00',rose:'#a23d68',gold:'#8b6b00'}[marker?.color]??'#465660';
  return `<g class="lc-atom${radical?' is-radical':''}" data-lc-atom-id="${esc(atomId)}"${selectable?` data-lc-atom="${esc(atomId)}" role="button" tabindex="0" aria-label="將自由基放在原 ${esc(atomId)}"`:''} transform="translate(${p.x} ${p.y})"><rect x="-34" y="-27" width="68" height="68" rx="8"></rect><text class="lc-origin-id" x="0" y="-4" text-anchor="middle">${esc(atomId)}${radical?' •':''}</text><text class="lc-h-count" x="0" y="18" text-anchor="middle">${atom.element==='C'?`H × ${hydrogens}`:'O'}</text>${atom.element==='C'?`<text class="lc-product-number" x="0" y="61" text-anchor="middle">${product===undefined?'產物號未填':`產物 ${product}`}</text>`:''}${marker?`<g data-lc-marker-atom="${esc(atomId)}" data-lc-marker-color="${esc(marker.color)}"><circle cx="-28" cy="-32" r="13" fill="${markerColor}"></circle><text class="lc-marker-glyph" x="-28" y="-26" text-anchor="middle">標</text></g>`:''}</g>`;
 }).join('');
 const label=component.role==='head'?'連 PC 的片段':component.role==='tail'?'另一片段':'起始鏈';
 const hasBoundary=(graph.boundaryBonds||[]).some(b=>ids.has(b.localAtomId));
 const keep=graph.choices?.keepFragments,inclusion=keep==='UNSELECTED'?'unselected':keep==='both'||keep===`${component.role}-only`?'included':'omitted';
 const inclusionText=component.role==='chain'||reference||keep===undefined?'':`<p class="lc-inclusion" data-lc-inclusion="${inclusion}">${inclusion==='unselected'?'尚未選擇是否納入':inclusion==='included'?'已納入我的方案':'未納入我的方案'}</p>`;
 const markerNotes=markers.length?`<ul class="lc-marker-notes">${markers.map(m=>`<li data-lc-marker-note="${esc(m.atomId)}">色標 ${esc(m.atomId)} · 我的預測：${esc(m.displayPrediction??(m.predictedFragment==='head'?'連 PC 側':m.predictedFragment==='tail'?'另一側':'去向未填'))}</li>`).join('')}</ul>`:'';
 const geometryNotes=[['C10','C11','C10_C11'],['C12','C13','C12_C13']].filter(([a,b])=>ids.has(a)&&ids.has(b)).map(([a,b,field])=>{const declared=graph.geometry?.[field]??graph.stereochemistry?.alkenes?.find(item=>Array.isArray(item.originBond)&&item.originBond.includes(a)&&item.originBond.includes(b))?.value??'UNSELECTED',geometry={UNSELECTED:'未填',E:'E',Z:'Z',UNSPECIFIED:'題設未指定',NOT_ASSESSED:'自由基中心未評定'}[declared]??declared,location=numbers.has(a)&&numbers.has(b)?`產物 ${numbers.get(a)}=${numbers.get(b)}`:'產物號未填';return `<p data-lc-geometry-bond="${a}-${b}">原 ${a}=${b} → ${esc(location)} · 幾何 ${esc(geometry)}</p>`;}).join('');
 return `<article class="lc-fragment" data-lc-fragment="${esc(component.role)}"><h3>${label}${reference?' · 參考':''}</h3>${inclusionText}${hasBoundary?'<p class="lc-boundary" data-lc-boundary>固定 PC — O_PC_fixed — 原 C1 · 單鍵</p>':'<p class="lc-boundary">原子身分不變；產物號另列</p>'}<div class="lc-diagram-scroll" data-lc-scroll="${esc(component.role)}" tabindex="0" role="region" aria-label="${label}完整重原子鏈；可在圖內左右捲動"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label}：原 ID、氫數、當前鍵級與自由基；產物編號獨立"><title>${label}；固定二維連接圖</title><g class="lc-bonds">${bonds}</g>${nodes}</svg></div>${geometryNotes}${markerNotes}${pending?'<p class="lc-quiet">這是目前草稿的圖；尚未核對。</p>':''}</article>`;
}
export function renderLipidBoard(graph,options={}){
 if(!safeGraph(graph))return '<p data-lc-unrenderable>目前原稿無法畫成圖；可在「原稿與歷史」查看及修訂。</p>';
 // Only safe model output reaches this renderer. Never derive an expected product.
 return `<div class="lc-fragments" data-lc-pair>${graph.components.map(c=>figure(graph,c,options)).join('')}</div><p class="lc-quiet">固定二維連接圖；線條不表示立體構型。</p>`;
}
export function renderLipidLedger(graph){
 if(!safeGraph(graph))return '<p>此稿尚無可顯示的原子帳。</p>';
 return `<p data-lc-atom-inspection role="status">選一個原 ID，查看它的局部原子帳。</p><div class="lc-ledger-scroll" tabindex="0" role="region" aria-label="完整原子帳"><table><caption>局部原子與 H 連接；固定 PC 外部群組不在此表</caption><thead><tr><th>原 ID</th><th>元素／母碳</th><th>形式電荷</th><th>非鍵電子</th><th>未成對</th></tr></thead><tbody>${graph.atoms.map(a=>`<tr data-lc-ledger-atom="${esc(a.id)}"><th scope="row"><button type="button" data-lc-ledger-select="${esc(a.id)}" aria-label="查看原 ${esc(a.id)} 的原子帳">${esc(a.id)}</button></th><td>${esc(a.element)}${a.element==='H'?` → ${esc(a.parentCarbonId)}`:''}</td><td>${esc(a.formalCharge)}</td><td>${esc(a.nonbondingElectrons)}</td><td>${esc(a.radicalElectrons)}</td></tr>`).join('')}</tbody></table></div><p>完整 PC 分子式、質量與 m/z 未建立；局部帳不能代替整個分子。</p>`;
}
function issueText(issue){
 const all=[issue.code,issue.path,issue.message].join(' '),atoms=[...new Set(all.match(/\b(?:C(?:1[0-8]|[1-9])|O[19]|H(?:1[0-8]|[1-9])_\d+)\b/g)||[])].slice(0,4).join('、'),at=atoms?`原 ${atoms}：`:'';
 if(issue.code==='INITIAL_STATE_SERIES_MISMATCH')return '這份原稿的起始題設與目前系列不同；請另開對應題設系列再核對，原文已保留。';
 if(/equal|probabil|50:50/i.test(all))return '來源沒有提供兩分支等機率的證據。';
 if(/yield|major.food|merge.*1976|kinetic|rate/i.test(all))return '這份來源不能支持分支收率、主要食品途徑或速率的主張。';
 if(/unique|precursor|only.9|dienal.proves/i.test(all))return '僅看到相同醛，不能唯一反推起始過氧位置。';
 if(/proves.*EE|exact.*geometry|isomer.*source/i.test(all))return 'EE／EZ 是題設；目前來源沒有驗證這個特定異構物的完整路徑。';
 if(/UNSELECTED|incomplete|not.applied|unselected|select.*first/i.test(all))return `${at}仍有選項未填或編號尚未套用，請保留自己的選擇後再核對。`;
 if(/hydrogen|parentCarbon|H_PARENT|H_ATTACHMENT/i.test(all))return `${at}氫的 ID 或母碳不符；每個 H 都應保留原來的連接。`;
 if(/fragment|component|keepFragments/i.test(all))return `${at}請核對兩個完整片段；連 PC 的一側也必須納入。`;
 if(/number|locant|originAt1|displayCarbon|mapping/i.test(all))return `${at}產物編號或雙鍵位置不符；原 ID 不改名，兩側各有自己的編號。`;
 if(/stereo|geometry|C10_C11|C12_C13|NOT_ASSESSED/i.test(all))return `${at}雙鍵幾何或未評定狀態不符；請分別核對原 C10=C11 與 C12=C13。`;
 if(/radical|unpaired/i.test(all))return `${at}未成對電子的位置或數量不符；請核對自由基放在哪顆原子。`;
 if(/formalCharge|charge/i.test(all))return `${at}局部電荷不符；不能以一正一負替代本題的中性原子。`;
 if(/nonbond|electron|valence/i.test(all))return `${at}鍵級與電子帳不一致；請核對旁邊的鍵與未成對電子。`;
 if(/C9O9|bond.order|bondOrder/i.test(all))return `${at}請核對 C9–O9 的鍵級與相關鍵帳。`;
 if(/cut|cleav|delet|remove.bond/i.test(all))return `${at}斷鍵與方案不符；本題只比較 C8–C9 或 C9–C10。`;
 if(/boundary|PC|anchor/i.test(all))return '固定 PC 邊界不符；C1–O_PC_fixed 單鍵必須保留。';
 if(/atom|inventory|identity/i.test(all))return `${at}原子身分或完整清單不符；原 ID 不能重複、遺失或改名。`;
 return '這部分原稿尚未符合本課格式或有限圖規則；原文已保留，可在詳細說明定位。';
}
export function renderLipidIssues(issues=[]){
 if(!Array.isArray(issues)||!issues.length)return '';const safe=issues.filter(item=>item&&typeof item==='object');
 const main=[...new Set(safe.map(issueText))].slice(0,6);
 return `<ul class="lc-issues">${main.map(message=>`<li>${esc(message)}</li>`).join('')}</ul><details class="lc-issue-details"><summary>查看完整核對說明（${safe.length} 項）</summary><ul>${safe.map(issue=>`<li><code>${esc(issue.code)}</code> · ${esc(issue.path)}<p>${esc(issue.message)}</p></li>`).join('')}</ul></details>`;
}
export function renderLipidAssessment(result){
 if(!result)return '<p class="lc-quiet">保留方案後，再核對圖與原子帳。</p>';
 if(result.submissionStatus==='given-start-not-submitted')return '<section data-lc-assessment="given-start" class="lc-assessment"><h3>給定起態，尚未提出斷鏈產物</h3><p>可以查看起態原子帳；完成作答仍需提出斷點與兩側產物。</p></section>';
 const formal=result.formal?.status,good=formal==='pass';
 const evidence=result.evidence,unsupported=evidence?.status==='unsupported-claim';
 const sourceLayer=good&&evidence?`<section class="lc-evidence ${unsupported?'is-reject':''}" data-lc-evidence="${esc(evidence.status)}"><h4>${unsupported?'來源不支持這些主張':'文獻支持仍有限'}</h4>${renderLipidIssues(evidence.issues)}<p>${unsupported?'圖式守恆不會讓收率、機率或唯一前驅物的主張自動成立。':'A 是作者提出的小程度支路；B 的烯基自由基形成被認為不利。形式通過不等於實際可行。'}</p></section>`:'';
 return `<section data-lc-assessment="${esc(formal||result.status||'not-assessed')}" class="lc-assessment ${good?'is-pass':'is-reject'}"><h3>${good?'圖式與原子帳通過':'這份方案還需修改'}</h3>${renderLipidIssues(result.formal?.issues||result.issues||[])}<p>${good?'形式帳通過；文獻是否支持這條路徑，要另外比較。':'原稿已保留；可直接改目前草稿，或回到歷史看這一版。'}</p>${sourceLayer}</section>`;
}
