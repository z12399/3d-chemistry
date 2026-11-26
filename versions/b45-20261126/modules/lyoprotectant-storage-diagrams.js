import {escapeHTML as esc} from './storage.js';

export const storageNumber = value => {
  const [mantissa, exponent] = value.toExponential().split('e');
  return `${mantissa} × 10^${Number(exponent)}`;
};
export const storageReading = row => `${storageNumber(row.mean)} ± ${storageNumber(row.sd)} SD ${row.unit}；n=${row.n}`;
export const storageFormula = (data, id) => data.displayMetadata.formulas.find(value => value.id === id);
export const storageMonth = (data, value) => data.displayMetadata.months.find(month => month.value === value);
export const storageRowLabel = (data, row) => `${storageFormula(data,row.formulaId).label}｜${storageMonth(data,row.storageMonths).label}`;
export function storageSelection(data,input) {
  const a=`A：${storageFormula(data,input.formulaA).label}，${storageMonth(data,input.monthA).label}`;
  const b=`B：${storageFormula(data,input.mode==='formulas'?input.formulaB:input.formulaA).label}，${storageMonth(data,input.mode==='formulas'?input.monthA:input.monthB).label}`;
  return `${input.mode==='formulas'?'同時間比配方':'同配方比時間'}；${a}；${b}`;
}
export function storagePairDiagram(data,result) {
  if(result?.status!=='REPORTED_EVIDENCE')return '';
  const points=result.rows.map((row,i)=>{
    const position=(11-Math.log10(row.mean))/5*100;
    return `<div class="ls-lane"><span class="ls-point" style="top:${position}%" data-ls-point="${esc(row.id)}" data-ls-mean="${row.mean}" data-ls-log-position="${position}" data-ls-axis-min="1000000" data-ls-axis-max="100000000000" aria-hidden="true">${i?'B':'A'}</span></div>`;
  }).join('');
  return `<figure class="ls-figure" aria-label="兩個刊載菌濃度均值，共用CFU/mL對數軸；完整數值列在圖下"><figcaption>菌濃度 CFU/mL · 對數軸</figcaption><div class="ls-plot"><div class="ls-ticks" aria-hidden="true">${[11,10,9,8,7,6].map(power=>`<span style="top:${(11-power)/5*100}%">10^${power}</span>`).join('')}</div><div class="ls-lanes">${points}</div></div><div class="ls-pair-labels" aria-hidden="true"><span>A</span><span>B</span></div></figure><div class="ls-readings">${result.rows.map((row,i)=>`<section data-ls-result-row="${esc(row.id)}"><h3>${i?'B':'A'} · ${esc(storageRowLabel(data,row))}</h3><p class="ls-value" data-ls-value="${esc(row.id)}">${esc(storageReading(row))}</p>${result.comparison.kind==='formulas'?`<p data-ls-letter="${esc(row.id)}">原表字母：${esc(row.tukeyLetters)}（限同時間配方比較）</p>`:''}</section>`).join('')}</div>`;
}
export function storageTable(data) {
  return `<p>原表均值±SD，獨立n=3。字母僅比較同時間的配方；有交集不代表等效。SD不是信賴區間或觀測範圍。</p><div class="ls-table-scroll" role="region" tabindex="0" aria-label="20筆完整報值，可橫向捲動"><table><caption>Bodzen 等（2021），Table 1／PDF第5頁／XML Tab1。0.5月在方法記為15天。定位的tr標示該時間的均值列、SD列；data columns標示配方欄。</caption><thead><tr><th scope="col">配方</th><th scope="col">時間</th><th scope="col">均值 ± SD（CFU/mL）</th><th scope="col">n</th><th scope="col">同時間字母</th><th scope="col">逐筆定位</th></tr></thead><tbody>${data.rows.map(row=>`<tr data-ls-table-row="${esc(row.id)}"><th scope="row">${esc(storageFormula(data,row.formulaId).fullLabel)}</th><td>${esc(storageMonth(data,row.storageMonths).label)}</td><td data-ls-table-value="${esc(row.id)}">${esc(storageNumber(row.mean))} ± ${esc(storageNumber(row.sd))}</td><td>${row.n}</td><td>${esc(row.tukeyLetters)}</td><td data-ls-locator="${esc(row.id)}">${esc(row.locator)}</td></tr>`).join('')}</tbody></table></div>`;
}
export function storageMethods(data) {
  return `<h3>研究條件</h3><dl>${data.displayMetadata.conditionsZh.map(row=>`<dt>${esc(row.label)}</dt><dd>${esc(row.value)}</dd>`).join('')}</dl><h3>完整配方</h3><ul>${data.displayMetadata.formulas.map(formula=>`<li>${esc(formula.compositionZh)}</li>`).join('')}</ul><h3>可說與不能推算的界線</h3><ul>${data.limits.map(limit=>`<li>${esc(limit)}</li>`).join('')}</ul><p>水活性：作者的獨立三重複敘述排除aw；5瓶合併量一次，1月未測。文中的aw機制討論不能當作可調參數的因果模型。</p><p>方法定位：PDF第7–8頁；XML Par35–Par39。原始個別重複、配對與乾粉質量分母未取得。</p>`;
}
export function storageSources(data) {
  const source=data.source,url=/^https:\/\//.test(source.publisherUrl)?source.publisherUrl:null;
  return `<p>${esc(data.displayMetadata.sourceLabel)}；DOI ${esc(source.doi)}。</p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ls-source="${esc(source.id)}">開啟研究原文</a>`:''}<p>報值定位：${esc(source.dataLocator)}。方法定位：${esc(source.methodsLocators.join('；'))}。</p><p>來源PDF SHA-256：<code>${esc(source.pdf.sha256)}</code><br>來源XML SHA-256：<code>${esc(source.xml.sha256)}</code></p><p>來源宣告CC BY 4.0。來源開啟只記錄操作，不代表已閱讀；本工作台不宣稱初判為盲測。</p>`;
}
