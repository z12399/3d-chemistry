import {escapeHTML as esc} from './storage.js';

export const NATTO_ENDPOINT_LABELS=Object.freeze({'headspace-ammonia-release':'氣相釋氨','food-urea-stock':'食品內尿素'});
export function nattoLocatorText(locator){return `${locator.figure} · p${locator.printedPage}／PDF ${locator.pdfPage} · ${locator.section}`;}

/** This diagram depicts intervention labels and measurement objects, not kinetics. */
export function renderNattoMap(comparison){
 return `<figure class="na-map" aria-label="${esc(comparison.label)}：研究組別與兩種量測物件"><figcaption>介入與量測</figcaption><div class="na-members">${comparison.members.map(member=>`<section class="na-member"><p class="na-role">${esc(member.role)}</p><h3>${esc(member.label)}</h3><p>${esc(member.inactivationDescription)}</p></section>`).join('')}</div><div class="na-sampling"><span aria-hidden="true">↓</span><p>各組樣品分別對照已刊量測</p></div><div class="na-objects"><section class="na-object"><div class="na-vessel" aria-hidden="true"><div class="na-gas">上方氣相</div><div class="na-food">食品樣品</div></div><h3>取樣後釋出的氨</h3><p>在指定容器條件下量氣相釋氨</p></section><section class="na-object"><div class="na-urea-object" aria-hidden="true"><span>食品內</span><strong>尿素庫存</strong></div><h3>食品內的尿素</h3><p>量樣品中的底物庫存</p></section></div><p class="na-map-note">介入在主發酵前已存在。連線只表示取樣關係，沒有等量、速率或完整氮收支含義。</p></figure>`;
}

export function renderNattoEvidence(evidence,{revealed=false,disabled=false,historical=false}={}){
 const endpoint=evidence.endpointKind,ammonia=endpoint==='headspace-ammonia-release',available=evidence.availability==='reported';
 const title=NATTO_ENDPOINT_LABELS[endpoint];
 let body;
 if(!available)body='<p class="na-unavailable">本比較未刊載尿素證據。這不是零值，也不以其他組別補上。</p>';
 else if(!revealed)body='<p class="na-unrevealed">已刊結果尚未揭示。</p>';
 else body=`<div class="na-evidence-items">${evidence.records.map(record=>`<article data-na-evidence="${esc(record.id)}"><h4>${record.statementKind==='source-approximate-text'?'作者文字近似描述':'原圖質性觀察'}</h4><p>${esc(record.statement)}</p><p class="na-locator">${esc(nattoLocatorText(record.locator))}</p></article>`).join('')}</div><p class="na-boundary">${ammonia?'殘餘釋氨尚未辨認其來源，不能直接判定第三條途徑。':'起點庫存已不同；末端組間差不是這段時間的生成或消耗量。'}</p>`;
 return `<section class="na-endpoint" data-na-result="${esc(endpoint)}" data-na-revealed="${revealed&&available}"><div class="na-endpoint-head"><h3>${title}</h3><button type="button" data-na-action="reveal" data-na-endpoint="${esc(endpoint)}"${disabled||!available||revealed||historical?' disabled':''}>${ammonia?'看氨證據':'看尿素證據'}</button></div><p class="na-target">${ammonia?'各次取樣後的氣相測定':'9 h 相對 Fig. 4 的 r22；不是同株前後變化'}</p>${body}</section>`;
}

export function renderNattoMethods(catalogue,comparison){
 return `<h3>兩類反應的角色</h3><p>GlutDH 反應可由麩胺酸產生 α-酮戊二酸與銨；尿素酶分解尿素並釋出銨。這是反應角色背景，不把反應生成的銨等同取樣後量到的氣相氨。來源 p1870／PDF 2。</p><h3>本比較的研究條件</h3><ul>${comparison.conditions.map(value=>`<li>${esc(value)}</li>`).join('')}</ul><h3>量測物件</h3>${catalogue.studyContext.measurements.map(measurement=>`<section><h4>${esc(measurement.label)}</h4><p>${esc(measurement.description)}</p><p>刊載單位：${esc(measurement.publishedUnit)}。</p><ul>${measurement.notReported.map(value=>`<li>${esc(value)}</li>`).join('')}</ul></section>`).join('')}<h3>能判讀到哪裡</h3><ul>${[...comparison.limits,...catalogue.studyContext.reportingLimits].map(value=>`<li>${esc(value)}</li>`).join('')}</ul><p>以上是對既有研究的閱讀背景，不是新的實驗或食品製造操作指引。</p>`;
}

export function renderNattoSources(catalogue){
 return `${catalogue.sources.map(source=>`<section><h3>${esc(source.title)}</h3><p>${esc(source.citation)}</p><p>DOI ${esc(source.doi)}</p><div class="na-source-links"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" data-na-source="${esc(source.id)}" data-na-link="article">論文頁面 ↗</a><a href="${esc(source.pdfUrl)}" target="_blank" rel="noopener noreferrer" data-na-source="${esc(source.id)}" data-na-link="pdf">刊載版 PDF ↗</a></div><ul>${source.limitations.map(value=>`<li>${esc(value)}</li>`).join('')}</ul></section>`).join('')}<p>來源啟動或連結選單只是操作紀錄，不表示已閱讀或理解；課文也可能已顯示結果，本課不宣稱盲測。</p>`;
}
