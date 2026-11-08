import {escapeHTML as esc} from './storage.js';

export const SOLVENT_COMPONENTS = Object.freeze({alpha_helix:'α-螺旋',beta_sheet:'β-摺板',beta_turns:'β-轉角',random_coil:'無規捲曲'});
export const SOLVENT_SOURCE_LABELS = Object.freeze({
  'pace-2004':'Pace 等（2004）：蛋白結構、穩定度與溶解度',
  'feng-2022':'Feng 等（2022）：乙醇處理乳清蛋白',
  'ntu115-239':'臺大115學年度食品化學原卷',
  'ntu114-257':'臺大114學年度食品化學原卷',
});
const LOCATIONS = Object.freeze({
  'pace-table5':'印刷p1227／PDF第3頁，Table 5下半段：水組第4列、20% ethanol第5列；溶解度欄及作者構形標記。腳註：pH 3.5–4.0、接近pI。',
  'pace-sec4':'印刷p1227–1228／PDF第3–4頁，§4〈原生與變性狀態的溶解度〉：RNase Sa在水與20% ethanol的比較。',
  'pace-stability-definition':'印刷p1225／PDF第1頁，Eq.1.1–1.2：N⇌D與ΔG＝GD−GN＝−RT ln([D]/[N])。',
  'pace-preliminary':'印刷p1235／PDF第11頁，Discussion：作者把Table 5稱為初步結果。',
  'pace-nonmatching-figure1':'印刷p1226／PDF第2頁，Figure 1為pH7水中的另一示例，不能填入Table 5這對條件的ΔG／Tm。',
  'feng-materials':'§2.1，JATS sec2.1：Hilmar 9410商用WPI混合物。',
  'feng-preparation':'§2.2，JATS sec2.2：第1段為配樣、乙醇處理、移除與凍乾；第2段為磷酸緩衝液再分散與assay稀釋。',
  'feng-cd-method':'§2.3，JATS sec2.3：far-UV CD，0.5mg/mL、25°C、190–260nm、1mm光徑、三次掃描，CDPro估計組成。',
  'feng-turbidity-method':'§2.5，JATS sec2.5：20mg/mL、25°C，600nm吸光讀值。',
  'feng-soluble-method':'§2.6，JATS sec2.6：20mg/mL、10000g離心15min、25°C；Biuret量C上清與C全樣，再算100×C上清／C全樣。',
  'feng-statistics':'§2.13，JATS sec2.13：三批樣品、每批三次量測；Table 1腳註寫均值±SD，不標成n=9獨立樣本或CI。',
  'feng-table1':'Table 1，JATS tbl1：Native WPI與E-WPI-80列，α-helix／β-sheet／β-turns／Random coil四欄；±為原表SD。',
  'feng-cd-narrative-conflict':'§3.1，JATS sec3.1：內文概括α增加，與Table 1的80%組低於對照不符，保留衝突。',
  'feng-turbidity-results':'§3.3第1段，JATS sec3.3：正文直接刊載對照至80%處理的兩個端點；Figure 1C只作交叉核讀。',
  'feng-soluble-results':'§3.4第1段，JATS sec3.4：正文直接刊載對照至80%處理的兩個端點；Figure 1D只作交叉核讀。',
  'feng-figure1':'Figure 1B為外觀、1C為混濁、1D為操作定義的溶解比例；本活動沒有圖形數位化或誤差棒估讀值。',
  'ntu115-q10':'115-239原卷PDF第1頁Q10，5分；原題未指定兩種蛋白或兩種溶劑，官方答案與配分細則未知。',
  'ntu114-q11':'114-257原卷PDF第2頁Q11(2)：a=fX1+0.4fX2+0.2fX3；分母及係數單位未明。',
});
export const solventNumber = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '未提供';
export function solventLocation(id) {return LOCATIONS[id] || '此定位尚未提供中文說明，請核對來源。';}
export function solventObservationText(o) {
  if (o.origin === 'reported_categorical') return '作者標為 folded（摺疊）';
  const digits = o.observableId === 'wpi-turbidity' ? 3 : 2;
  const spread = Number.isFinite(o.uncertainty?.value) ? ` ± ${solventNumber(o.uncertainty.value,digits)}${o.uncertainty.kind === 'SD' ? ' SD' : '（種類未明）'}` : '';
  const unit = o.observableId === 'rnase-solubility' ? 'mg/mL' : o.observableId === 'wpi-turbidity' ? 'A600' : '%';
  return `${solventNumber(o.value,digits)}${spread} ${unit}`;
}
export function solventContext(result) {
  if (!result || result.status !== 'REPORTED_EVIDENCE') return '';
  if (result.input.study === 'rnase') return 'RNase Sa · 刊載溶解度 · 25°C · 原表pH 3.5–4.0 · 20% ethanol的百分比基準未明';
  const o = result.observable;
  if (result.input.wpiObservable === 'cd') return `處理後CD · ${solventNumber(o.proteinMgPerMl,1)} mg/mL · ${o.temperatureC}°C · 二級結構組成 %（非原生分子比例）`;
  if (result.input.wpiObservable === 'turbidity') return `處理後混濁 · ${o.proteinMgPerMl} mg/mL · ${o.temperatureC}°C · A600（無因次光學讀值）`;
  return `處理後上清蛋白 · ${o.proteinMgPerMl} mg/mL · ${o.temperatureC}°C · 100×C上清／C全樣（%）`;
}
export function solventPairDiagram(result) {
  if (!result || result.status !== 'REPORTED_EVIDENCE') return '';
  const rnase=result.input.study==='rnase',cd=!rnase&&result.input.wpiObservable==='cd';
  const max=rnase?2.5:result.input.wpiObservable==='turbidity'?.8:100;
  const unit=rnase?'mg/mL':result.input.wpiObservable==='turbidity'?'A600':'%';
  const axis=`0 → ${max} ${unit}`;
  return `<div class="ps-pair" data-ps-pair>${result.rows.map(row=>`<article class="ps-condition-card" data-ps-condition-id="${esc(row.condition.id)}"><h3>${esc(row.condition.label)}</h3>${cd?`<div class="ps-stack" aria-hidden="true">${row.measurements.map(o=>`<span class="ps-component ps-${esc(o.component)}" style="width:${o.value}%" data-ps-bar="${esc(o.id)}" data-ps-value="${o.value}"></span>`).join('')}</div><div class="ps-axis">${axis}</div><dl class="ps-composition">${row.measurements.map(o=>`<div><dt><span class="ps-key ps-${esc(o.component)}" aria-hidden="true"></span>${SOLVENT_COMPONENTS[o.component]}</dt><dd data-ps-value-id="${esc(o.id)}">${esc(solventObservationText(o))}</dd></div>`).join('')}</dl>`:`<p class="ps-main-value" data-ps-value-id="${esc(row.measurements[0].id)}">${esc(solventObservationText(row.measurements[0]))}</p><div class="ps-track" aria-hidden="true"><span style="width:${100*row.measurements[0].value/max}%" data-ps-bar="${esc(row.measurements[0].id)}" data-ps-value="${row.measurements[0].value}" data-ps-scale-max="${max}"></span></div><div class="ps-axis">${axis}</div>`}${rnase?`<p class="ps-conformation" data-ps-conformation="${esc(row.condition.id)}">${row.conformation?'作者構形標記：<strong>folded（摺疊）</strong>':'作者構形標記：尚未揭示'}</p>`:''}</article>`).join('')}</div>`;
}
export function solventValueTable(result) {
  if (!result || result.status !== 'REPORTED_EVIDENCE') return '';
  const entries=result.rows.flatMap(row=>[...row.measurements,...(row.conformation?[row.conformation]:[])].map(observation=>({condition:row.condition,observation})));
  const locatorIds=[...new Set(entries.flatMap(entry=>entry.observation.locatorRefs))];
  const locatorKeys=new Map(locatorIds.map((id,index)=>[id,index+1]));
  return `<div class="ps-table-scroll" tabindex="0" role="region" aria-label="目前兩組的來源數值；窄版可局部捲動"><table><caption>定位編號對應下方「本表定位對照」。</caption><thead><tr><th scope="col">條件</th><th scope="col">觀察量</th><th scope="col">原值與誤差</th><th scope="col">定位編號</th></tr></thead><tbody>${entries.map(({condition,observation:o})=>`<tr data-ps-observation-row="${esc(o.id)}"><th scope="row">${esc(condition.label)}</th><td>${esc(SOLVENT_COMPONENTS[o.component]|| (o.observableId==='rnase-conformation'?'作者構形標記':result.observable.label))}</td><td>${esc(solventObservationText(o))}</td><td>${o.locatorRefs.map(id=>`<span data-ps-locator-ref="${esc(id)}" data-ps-locator-key="${locatorKeys.get(id)}">定位 ${locatorKeys.get(id)}</span>`).join('、')}</td></tr>`).join('')}</tbody></table></div><section aria-label="本表定位對照" data-ps-table-locators><h3>本表定位對照</h3><ol class="ps-sources">${locatorIds.map(id=>`<li value="${locatorKeys.get(id)}" data-ps-locator-id="${esc(id)}" data-ps-locator-key="${locatorKeys.get(id)}">${esc(solventLocation(id))}</li>`).join('')}</ol></section>`;
}
export function solventMethods(result) {
  if (!result || result.status !== 'REPORTED_EVIDENCE') return '';
  if(result.input.study==='rnase')return '<p>比較Pace Table 5下半段的兩個固定條件：同一RNase Sa、刊載25°C及接近pI的pH 3.5–4.0範圍。沒有逐組精確pH、20%的百分比基準、±種類或n，也沒有完整平衡／分離／定量與構形判定程序。</p><p>構形欄是作者的分類。請將它與刊載溶解度分開核對；即使出現folded標記，也不等於全部原子構形、活性或ΔG完全相同。此對照不能替所有蛋白決定機制。</p>';
  return '<p>樣品是Hilmar 9410商用WPI混合物。原液15% w/v、500rpm水合4h，調pH7後8000g離心20min；處理時蛋白固定3% w/v，以0%與80% v/v乙醇兩端點比較，500rpm攪拌4h。每個混合溶劑組的pH相同並未確立。</p><p>在25°C以氮氣吹表面2–3h移除乙醇，再凍乾成粉。量測前用pH7、10mM磷酸鈉配25mg/mL溶液，4°C過夜，再按assay稀釋。殘留乙醇沒有在本資料中定量驗證。</p><p>CD：0.5mg/mL、25°C、190–260nm、1mm光徑；CDPro估計四種二級結構組成。混濁：20mg/mL、25°C的A600。上清比例：20mg/mL、10000g離心15min、25°C，用Biuret量C上清與C全樣，計算100×C上清／C全樣。</p><p>兩組可在同一assay內比較；CD與其餘assay濃度不同，不能合成「穩定性百分比」。名義20mg/mL不能反算未報告的C上清。CD百分比不是完整原生分子比例，也不是ΔG。</p>';
}
export function solventSources(data) {
  if(!data)return '';
  return `<ol class="ps-sources">${data.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-ps-source="${esc(s.id)}">${esc(SOLVENT_SOURCE_LABELS[s.id]||s.title)} ↗</a>${s.doi?`<p>DOI：${esc(s.doi)}</p>`:''}<ul>${data.locators.filter(l=>l.sourceId===s.id).map(l=>`<li>${esc(solventLocation(l.id))}</li>`).join('')}</ul></li>`).join('')}</ol><h3>未提供與未解資料</h3><p>RNase這對條件的ΔG／Tm、20%基準、±種類、n、逐組pH與完整方法均未明。WPI在80%乙醇中的平衡溶解度、殘留乙醇及各組處理pH未確立。A600及上清比例的誤差棒沒有數值轉錄，不補SD／CI。</p><p>Feng Table 1的40%組四項合計91%，本活動排除而不正規化；§3.1概括α增加，與80%列低於對照相反，保留表文衝突。只用0與80端點，不產生濃度曲線；不採胺基酸改變或抗氧化功效主張。</p><p>Pace Table 5是作者初步結果；水列重複印出不當成兩個獨立樣本。Figure 1的pH7水中ΔG／Tm不能搬到這張表。Feng資料為完整JATS轉錄；本活動沒有圖估讀。</p><p>114原題的f分母、係數單位與a基準仍未解。不假定Σf=1，不當作殘基質量／莫耳分率，也不等同Tompa水合量h。115原題沒有指定兩蛋白／兩溶劑，這是部分能力練習，並非官方答案。</p>`;
}
