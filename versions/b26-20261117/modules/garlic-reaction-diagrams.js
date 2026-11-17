import {escapeHTML as esc} from './storage.js';

export const GARLIC_LABELS=Object.freeze({alliin:'蒜胺酸','allyl-sulfenic-acid':'烯丙基次磺酸','aminoacrylic-acid':'2-胺基丙烯酸','pyruvic-acid':'丙酮酸',ammonia:'氨',allicin:'蒜素',water:'水',mix:'讓兩者接觸','disable-catalyst':'使酵素失活','cleave-alliin':'催化裂解一次','hydrolyze-aminoacrylate':'含氮中間體水解一次','condense-sulfenic':'含硫中間體縮合一次'});
const chemistry=['cleave-alliin','hydrolyze-aminoacrylate','condense-sulfenic'];
const valid=r=>r?.status==='SOURCE_BOUND_REPLAY'&&typeof r.sourceIdentity==='string'&&r.species?.length===7;
const text=value=>typeof value==='string'?value:JSON.stringify(value??'');
const chemicalLabel=a=>a.element+(a.hydrogens?`H${a.hydrogens>1?String(a.hydrogens).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]):''}`:'');
const key=(a,b)=>[a,b].sort().join('|');
export function garlicConditions(c){return `接觸：${c.contact?'已接觸':'未接觸'} · 酵素：${c.enzymeActive?'可用':'失活'} · PLP：${c.plpAvailable?'可用':'不可用'}`;}
export function garlicStateText(s){return `${Object.entries(s.inventory).map(([k,v])=>`${GARLIC_LABELS[k]||k} ${v}`).join('、')}（示意份數）；${garlicConditions(s.conditions)}`;}

function lines(a,b,order){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  return (order===2?[-3,3]:[0]).map(offset=>`<line x1="${a.x+nx*offset}" y1="${a.y+ny*offset}" x2="${b.x+nx*offset}" y2="${b.y+ny*offset}"></line>`).join('');
}
function moleculeFigure(replay,molecule,stage,focus){
  const species=replay.species.find(s=>s.id===molecule.speciesId),structure=species?.structure;
  if(!structure)throw new Error('Missing verified structure');
  const nodes=[...structure.trackedAtoms,...structure.untrackedAtoms],byLocal=new Map(nodes.map(a=>[a.localId,a])),byId=new Map(molecule.trackedAtoms.map(a=>[a.id,byLocal.get(a.localId)]));
  const xs=nodes.map(a=>a.x),ys=nodes.map(a=>a.y),left=Math.min(...xs)-48,top=Math.min(...ys)-30,width=Math.max(...xs)-left+48,height=Math.max(...ys)-top+34;
  const tracked=molecule.trackedAtoms.map(a=>{
    const n=byLocal.get(a.localId);if(!n||n.element!==a.element)throw new Error('Tracked structure mismatch');
    return `<g data-gr-atom="${esc(a.id)}" data-gr-element="${a.element}" data-gr-highlighted="${a.element===focus}" data-gr-molecule-id="${esc(molecule.id)}" data-gr-stage="${stage}" transform="translate(${n.x} ${n.y})"><rect x="-30" y="-23" width="60" height="46" rx="7"></rect><text class="gr-chemical-label" text-anchor="middle" x="0" y="-3">${esc(chemicalLabel(n))}</text><text class="gr-atom-id" text-anchor="middle" x="0" y="17">${esc(a.id)}</text></g>`;
  }).join('');
  const local=structure.untrackedAtoms.map(n=>`<g data-gr-local-group="${esc(n.localId)}" data-gr-tracked="false" data-gr-molecule-id="${esc(molecule.id)}" data-gr-stage="${stage}" transform="translate(${n.x} ${n.y})"><rect x="-30" y="-23" width="60" height="46" rx="5"></rect><text class="gr-chemical-label" text-anchor="middle" x="0" y="-3">${esc(chemicalLabel(n))}</text><text class="gr-local-label" text-anchor="middle" x="0" y="17">局部 O</text></g>`).join('');
  const bonds=molecule.bonds.map(b=>{
    const a=byId.get(b.from),z=byId.get(b.to);if(!a||!z)throw new Error('Unknown tracked bond endpoint');
    return `<g data-gr-bond="${esc(key(b.from,b.to))}" data-gr-from="${esc(b.from)}" data-gr-to="${esc(b.to)}" data-gr-order="${b.order}" data-gr-stage="${stage}" data-gr-molecule-id="${esc(molecule.id)}">${lines(a,z,b.order)}</g>`;
  }).join('');
  const locals=structure.untrackedBonds.map(b=>`<g data-gr-local-bond="${esc(key(b.from,b.to))}" data-gr-order="${b.order}" data-gr-tracked="false" data-gr-stage="${stage}" data-gr-molecule-id="${esc(molecule.id)}">${lines(byLocal.get(b.from),byLocal.get(b.to),b.order)}</g>`).join('');
  return `<figure class="gr-molecule" data-gr-molecule="${esc(molecule.id)}" data-gr-species="${esc(molecule.speciesId)}" data-gr-stage="${stage}"><figcaption><strong>${esc(species.label)}</strong> · ${esc(molecule.unitIds.join('/'))}<span>${esc(species.formula)}</span></figcaption><div class="gr-structure-scroll" tabindex="0" role="region" aria-label="${esc(species.label)} ${esc(molecule.unitIds.join('/'))} 結構；窄視窗可在此圖橫向捲動"><svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(species.label)} ${esc(molecule.unitIds.join('/'))}，${stage==='before'?'步驟前':stage==='after'?'步驟後':'目前'}結構。C/N/S使用同一標號；O/H為局部記號。" width="${width}" height="${height}" viewBox="${left} ${top} ${width} ${height}" style="--gr-svg-width:${width}px;--gr-svg-height:${height}px"><title>${esc(species.label)}，固定二維結構對應</title><g class="gr-bonds">${bonds}${locals}</g>${tracked}${local}</svg></div><p class="gr-molecule-note">${esc(structure.caption)}</p></figure>`;
}
function stage(replay,state,name,label,focus,ids){
  const selected=ids?state.molecules.filter(m=>ids.includes(m.id)):state.molecules;
  return `<section class="gr-structure-stage" data-gr-structure-stage="${name}"><h3>${esc(label)}</h3><div class="gr-molecules">${selected.map(m=>moleculeFigure(replay,m,name,focus)).join('')}</div></section>`;
}
export function garlicBoard(replay,state,step,focus='C'){
  if(!valid(replay)||!state||!['C','N','S'].includes(focus))return {html:'',tracking:'',note:''};
  const isReaction=step?.status==='applied'&&chemistry.includes(step.operationId);
  const html=isReaction?`<div class="gr-before-after">${stage(replay,step.before,'before','這一步之前',focus,step.affectedMoleculeIds.before)}${stage(replay,step.after,'after','這一步之後',focus,step.affectedMoleculeIds.after)}</div><p class="gr-caption">只展開本步涉及的分子；其他物質仍保留在下方總庫存。水只在總帳顯示。</p>`:stage(replay,state,'current',step?'目前結構 · 物質仍在':'起始結構 · 兩份蒜胺酸',focus);
  const relevant=isReaction?new Set(step.affectedMoleculeIds.after):null;
  const grouped=state.molecules.filter(m=>!relevant||relevant.has(m.id)).map(m=>({m,atoms:m.trackedAtoms.filter(a=>a.element===focus).map(a=>a.id)})).filter(v=>v.atoms.length);
  const tracking=`追蹤 ${focus}：${grouped.length?grouped.map(({m,atoms})=>`${atoms.join('、')} → ${GARLIC_LABELS[m.speciesId]} ${m.unitIds.join('/')}`).join('；'):'本步顯示的分子沒有此元素；完整帳本仍保留所有16個身分。'}`;
  const hasAllicin=state.molecules.some(m=>m.speciesId==='allicin');
  return {html,tracking,note:`這一步前後的結構對應，不是完整機理或實驗座標。C/N/S標號是骨架記帳，非同位素證據；H/O只作局部表示與總收支。${hasAllicin?'把A.S畫成S=O是圖示慣例，交換A/B不改未標記物種。':''}`};
}
export function garlicInventory(replay,state,step){
  if(!valid(replay)||!state)return '';
  return `<table class="gr-inventory"><caption>完整盤面庫存（示意份數）</caption><thead><tr><th scope="col">物質</th><th scope="col">現有</th><th scope="col">本步</th></tr></thead><tbody>${replay.species.map(s=>{const delta=step?.inventoryDelta[s.id]||0;return `<tr data-gr-inventory-row="${esc(s.id)}"><th scope="row">${esc(s.label)}</th><td data-gr-inventory="${esc(s.id)}">${state.inventory[s.id]}</td><td data-gr-delta="${esc(s.id)}">${delta>0?'+':''}${delta||'—'}</td></tr>`;}).join('')}</tbody></table>`;
}
export function garlicSourceLinks(replay){return valid(replay)?replay.sources.filter(s=>typeof s.url==='string'&&/^https:\/\//.test(s.url)).map(s=>({...s})):[];}
export function garlicSources(replay){
  if(!valid(replay))return '';
  return `<p>來源識別 <code>${esc(replay.sourceIdentity)}</code></p><ul>${garlicSourceLinks(replay).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-gr-source="${esc(s.id)}">${esc(s.title)}</a><p>${esc(text(s.locator))}</p><p>${esc(text(s.readScope))}</p></li>`).join('')}</ul><p>開啟不表示已讀懂；原題定位不等於官方解答。</p>`;
}
export function garlicSourceText(replay){
  if(!valid(replay))return '';
  return `來源識別：${replay.sourceIdentity}\n${garlicSourceLinks(replay).map(s=>`${s.id}：${s.url}`).join('\n')}\n反應依據與定位列於各步；完整讀取範圍在來源展開區。`;
}
export function garlicLedger(replay,state){
  if(!valid(replay)||!state)return '';
  const totals=Object.entries(state.elementTotals).map(([k,v])=>`${k} ${v}`).join(' · ');
  return `<p>三步都是有限的總括反應；中性記帳不預測 pH 下的主要形態。固定起始水為2份，讓兩次水解可先做完；不是溶劑總量。</p><ol><li>蒜胺酸 → 烯丙基次磺酸 + 2-胺基丙烯酸。須接觸、催化與PLP可用，不扣水。</li><li>2-胺基丙烯酸 + 水 → 丙酮酸 + 氨。已有中間體與水即可進行本步。</li><li>2 烯丙基次磺酸 → 蒜素 + 水。已有兩份中間體即可進行本步。</li></ol><p>全帳元素：${esc(totals)}。H/O納入總收支，但局部標記不指定唯一來源。</p><p>失活只讓後續催化不可用，不等於完整加熱；不能推出所有熱或酸處理都不影響下游。短命中間體停留是教學查看，不是真實可暫停／分離。</p><table class="gr-atom-table"><caption>目前完整16個C/N/S身分</caption><thead><tr><th>標號</th><th>目前物種</th></tr></thead><tbody>${Object.entries(state.atomLocations).map(([id,location])=>`<tr><td>${esc(id)}</td><td>${esc(GARLIC_LABELS[location.speciesId])} · ${esc(location.moleculeId)}</td></tr>`).join('')}</tbody></table><p>C1–C3保留在含氮中間體及丙酮酸骨架；N轉到氨；兩份C4–C6與S進入蒜素。這是骨架結構對應，不是已讀同位素實驗。A/B為等價單位固定記帳，不是立體選擇性。</p><ul>${replay.limits.map(v=>`<li>${esc(text(v))}</li>`).join('')}</ul><p>轉移問題：真正比較切碎與加熱順序時，還需分別量哪些物質與酵素條件？本盤面不產生色譜、氣味或食品收率讀值。</p>`;
}
