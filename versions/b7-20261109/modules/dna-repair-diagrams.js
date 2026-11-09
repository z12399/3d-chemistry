import {escapeHTML as esc} from './storage.js';

export const repairSubstrate=(data,id)=>data.substrates.find(value=>value.id===id);
export const repairStrain=(data,id)=>data.strains.find(value=>value.id===id);
export const repairReading=row=>`${row.reportedValue} SD；${row.metric}；獨立n=${row.nIndependentCultures}`;
export const repairColumnLabel=row=>`${row.columnId==='vector'?'對照載體':'MutM 過量表現'} · ${row.columnLabel}`;
export const repairSelection=(data,input)=>input.mode==='mechanism'?`選切除位置｜${repairSubstrate(data,input.substrate).label}`:`看細胞證據｜${repairStrain(data,input.strain).label}`;
export function repairChoices(data,input){
  if(input.mode==='genetic')return {lower:'MutM 過量表現欄的均值較低',higher:'MutM 過量表現欄的均值較高',similar:'兩欄均值可能接近',undecided:'暫不判定，先看證據'};
  const substrate=repairSubstrate(data,input.substrate);
  return {'partner-base':`配對股的 ${substrate.targetBase}`,'opposite-base':`另一股的 ${substrate.oppositeBase}`,backbone:'糖磷酸骨架',none:'不切除',undecided:'暫不判定，先看證據'};
}

function backbone(which,site,{canSelect,selected}){
  const attrs=`data-dr-backbone="${which}" data-dr-continuous="true"`;
  const content=`<span class="dr-backbone-label">糖磷酸骨架</span><span class="dr-backbone-line" aria-hidden="true"></span><span class="dr-sugar dr-sugar-left" aria-hidden="true">糖</span><span class="dr-phosphate dr-phosphate-left" aria-hidden="true">P</span><span class="dr-sugar dr-sugar-center${site.apSite?' dr-sugar-ap':''}" data-dr-sugar="${which}" data-dr-sugar-present="${site.sugarPresent}" data-dr-phosphate-present="${site.phosphatePresent}"${site.apSite?' data-dr-ap-site="partner"':''}>糖${site.apSite?'<span class="dr-ap-badge">AP</span>':''}</span><span class="dr-phosphate dr-phosphate-right" aria-hidden="true">P</span><span class="dr-sugar dr-sugar-right" aria-hidden="true">糖</span>`;
  return which==='partner'?`<button type="button" class="dr-backbone-object" ${attrs} data-dr-object="backbone" aria-label="選擇糖磷酸骨架作為初判；糖與磷酸相連" aria-pressed="${selected==='backbone'}"${canSelect?'':' disabled'}>${content}</button>`:`<div class="dr-backbone-object dr-backbone-static" ${attrs} aria-label="另一股糖磷酸骨架保持連續">${content}</div>`;
}
function base(which,site,{canSelect,selected}){
  const object=which==='partner'?'partner-base':'opposite-base';
  if(!site.basePresent)return `<div class="dr-base-gap" data-dr-base="${which}" data-dr-base-present="false" data-dr-base-damaged="false" aria-label="此位點缺少鹼基；糖與骨架仍在">缺鹼基</div>`;
  return `<button type="button" class="dr-base-object${site.baseDamaged?' dr-base-damaged':''}" data-dr-object="${object}" data-dr-base="${which}" data-dr-base-present="true" data-dr-base-damaged="${site.baseDamaged}" aria-label="選擇${which==='partner'?'配對股':'另一股'}的${esc(site.base)}鹼基${site.baseDamaged?'，受損':''}" aria-pressed="${selected===object}"${canSelect?'':' disabled'}><span>${esc(site.base)}</span>${site.baseDamaged?'<span class="dr-damage-label">受損</span>':''}</button>`;
}
function bond(which,site){const intact=site.glycosidicBond==='present';return `<span class="dr-glycosidic-bond${intact?'':' dr-bond-absent'}" data-dr-glycosidic-bond="${which}" data-dr-bond-intact="${intact}" aria-label="${which==='partner'?'配對股':'另一股'}的鹼基與糖之間${intact?'仍有連結':'已無連結'}"></span>`;}

/** Only source-validated model objects are rendered; phase does not execute a guess. */
export function repairMechanismDiagram(data,result,{phase='before',prediction='',canSelect=false}={}){
  if(result?.status!=='SOURCE_BOUND_EVIDENCE'||!result.mechanism||!['before','after'].includes(phase))return '';
  const mechanism=result.mechanism,state=mechanism[phase];
  if(!state?.target||!state?.opposite||state.backboneContinuous!==true)return '';
  const settings={canSelect:canSelect&&phase==='before',selected:prediction};
  const released=phase==='after'?mechanism.releasedBase:null;
  return `<figure class="dr-mechanism" data-dr-mechanism data-dr-stage="${phase}" aria-label="${esc(mechanism.label)}的${phase==='before'?'作用前':'來源支持作用後'}位置示意；糖、鹼基與骨架為不同物件"><figcaption>${phase==='before'?'作用前 · 選你認為會被移除的位置':mechanism.removedBase?'來源結果 · 只到鹼基切除這一步':'來源結果 · 未見本項切除'}</figcaption><div class="dr-duplex"><div class="dr-strand dr-strand-top">${backbone('partner',state.target,settings)}${bond('partner',state.target)}${base('partner',state.target,settings)}</div><div class="dr-pairing" data-dr-pairing-present="${state.target.basePresent&&state.opposite.basePresent}" aria-hidden="true">${state.target.basePresent&&state.opposite.basePresent?'配對位置':'此處已無鹼基配對'}</div><div class="dr-strand dr-strand-bottom">${base('opposite',state.opposite,settings)}${bond('opposite',state.opposite)}${backbone('opposite',state.opposite,settings)}</div></div>${released?`<div class="dr-release" data-dr-released-base="${esc(released.base)}" data-dr-attached-to-sugar="${released.attachedToSugar}" data-dr-part-of-backbone="${released.partOfDnaBackbone}"><span>釋出的鹼基</span><strong class="dr-released-pill">${esc(released.base)}</strong><span>已離開糖</span></div>`:''}<p class="dr-diagram-key">糖＝去氧核糖；P＝磷酸。位置示意，非原子座標。</p></figure>`;
}

export function repairGeneticDiagram(data,result){
  if(result?.status!=='SOURCE_BOUND_EVIDENCE'||result.mechanism!==null||result.rows?.length!==2)return '';
  const maximum=120;
  return `<figure class="dr-cell-figure" aria-label="同一研究組別的兩個刊載均值點，共用從0到120的線性軸；完整數值在圖下"><figcaption>每10⁸細胞的 Rif 抗性菌落數<br><span class="dr-caption">原表突變指標 · 線性軸</span></figcaption><div class="dr-plot"><div class="dr-ticks" aria-hidden="true">${[120,90,60,30,0].map(value=>`<span style="top:${(1-value/maximum)*100}%">${value}</span>`).join('')}</div><div class="dr-lanes">${result.rows.map((row,index)=>`<div class="dr-lane"><span class="dr-point" data-dr-point="${esc(row.id)}" data-dr-mean="${row.mean}" data-dr-axis-min="0" data-dr-axis-max="120" data-dr-position="${(1-row.mean/maximum)*100}" style="top:${(1-row.mean/maximum)*100}%" aria-hidden="true">${index?'B':'A'}</span></div>`).join('')}</div></div><div class="dr-pair-labels" aria-hidden="true"><span>A</span><span>B</span></div></figure><div class="dr-readings">${result.rows.map((row,index)=>`<section data-dr-result-row="${esc(row.id)}"><h3>${index?'B':'A'} · ${esc(repairColumnLabel(row))}</h3><p class="dr-value" data-dr-value="${esc(row.id)}">${esc(repairReading(row))}</p></section>`).join('')}</div>`;
}

export function repairTable(data){
  return `<p>原報均值±SD，8個獨立培養。兩欄是載體條件，不是同一培養物的前後時間。</p><div class="dr-table-scroll" role="region" tabindex="0" aria-label="8筆完整報值，可橫向捲動"><table><caption>Michaels 等（1992），p7024 Table 1；指標為 Rifʳ colonies per 10⁸ cells。本表無新增顯著性或等效性判定。</caption><thead><tr><th scope="col">研究組別</th><th scope="col">載體條件</th><th scope="col">均值 ± SD</th><th scope="col">獨立n</th><th scope="col">逐筆定位</th></tr></thead><tbody>${data.rows.map(row=>`<tr data-dr-table-row="${esc(row.id)}"><th scope="row">${esc(row.strainLabel)}</th><td>${esc(repairColumnLabel(row))}</td><td data-dr-table-value="${esc(row.id)}">${esc(row.reportedValue)}</td><td>${row.nIndependentCultures}</td><td data-dr-locator="${esc(row.id)}">${esc(row.locator)}</td></tr>`).join('')}</tbody></table></div>`;
}
export function repairMethods(data){
  return `<h3>兩層證據分開讀</h3><dl><dt>體外底物</dt><dd>純化 MutY 與三個固定底物；只呈現來源支持的鹼基切除結果。</dd><dt>細胞指標</dt><dd>E. coli 的四個研究組別與兩個載體欄，Table 1；均值±SD，8個獨立培養。</dd><dt>量測名稱</dt><dd>Rifʳ 是 rifampicin 抗性菌落；每10⁸細胞的刊載端點，不是每代突變率或所有突變量。</dd><dt>AP 位點</dt><dd>缺少鹼基，但糖與糖磷酸骨架仍在；後續處理、補入與封口不在本工作台內。</dd><dt>圖形證據</dt><dd>Fig.1 反應後另有鹼／熱處理，個別 lane 的處理仍未完全釐清；不重建膠圖或量化條帶。Fig.3 是作者概念模型。</dd></dl><h3>固定底物及來源定位</h3><ul>${data.substrates.map(value=>`<li>${esc(value.label)}：${esc(value.sourceStatement)}<br>${esc(value.locator)}</li>`).join('')}</ul><h3>可說與不能外推的界線</h3><ul>${data.limits.map(value=>`<li>${esc(value)}</li>`).join('')}</ul>`;
}
export function repairSourceLinks(data){
  return [{id:`${data.source.id}:archive`,label:'開啟原文與原始頁圖',url:data.source.archiveUrl},{id:`${data.source.id}:publisher`,label:'開啟出版社原文',url:data.source.publisherUrl},...data.source.pages.map(page=>({id:`${data.source.id}:page:${page.page}`,label:`原始第 ${page.page} 頁`,url:page.url}))].filter(link=>/^https:\/\//.test(link.url));
}
export function repairSources(data){
  const source=data.source;
  return `<p>${esc(source.citation)}；DOI ${esc(source.doi)}。</p><ul class="dr-source-links">${repairSourceLinks(data).map(link=>`<li><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" data-dr-source="${esc(link.id)}">${esc(link.label)}</a></li>`).join('')}</ul><p>機制：${esc(source.mechanismLocators.join('；'))}。細胞資料：${esc(source.tableLocator)}。</p><details><summary>原始頁圖識別</summary>${source.pages.map(page=>`<p>p${page.page} SHA-256：<code>${esc(page.sha256)}</code></p>`).join('')}</details><p>${esc(data.displayMetadata.exposureBoundary)}</p>`;
}
