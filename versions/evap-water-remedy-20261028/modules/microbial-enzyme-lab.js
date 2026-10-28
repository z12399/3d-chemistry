import {escapeHTML as esc} from './storage.js';
import {MICRO_ENZYME_LAB_ID, MICRO_ENZYME_GROUPS, MICRO_ENZYME_SUGARS, MICRO_ENZYME_ORGANISMS, MICRO_ENZYME_SUGAR_DEFAULT_INPUT, MICRO_ENZYME_CELL_DEFAULT_INPUT, getSugarComparison, getCellComparison} from './microbial-enzyme-model.js';
import {MICRO_ENZYME_SOURCES, MICRO_ENZYME_STUDY, MICRO_ENZYME_REACTION, MICRO_ENZYME_PROCESS_STEPS, MICRO_ENZYME_LIMITS} from '../data/microbial-enzyme-evidence.js';
export {MICRO_ENZYME_LAB_ID} from './microbial-enzyme-model.js';

const owners=new WeakMap(),mounted=new WeakMap();
const modes={flow:'酵素與流程',sugar:'發酵前後糖量',cells:'兩種菌的紀錄'};
const detailLabels={methods:'研究方法',hypotheses:'可能影響發酵菌的機理',raw:'原表紀錄',limits:'資料限制',sources:'來源',writing:'解釋與修訂',records:'保留的觀察',notes:'筆記預覽',sugarRaw:'所選糖量原值',cellRaw:'所選菌數原值'};
const safeHref=value=>typeof value==='string'&&/^#(?:learn|process|micro)\/review$/.test(value)?value:'#micro/review';
const clone=value=>structuredClone(value),fmt=value=>Number(value.toPrecision(4)).toString();
const groupName=value=>`${value}% 組`;
const shortSource=source=>source.id.includes('ntu')?'官方題目':source.id.includes('supplement')?'補充表':source.id.includes('godo')?'製造者':source.id.includes('efsa')?'EFSA':'研究原文';
const sourceLinks=ids=>MICRO_ENZYME_SOURCES.filter(source=>ids.includes(source.id)).map(source=>`<a href="${esc(source.url)}" data-me-source="${esc(source.id)}" target="_blank" rel="noopener noreferrer">${shortSource(source)} ↗</a>`).join(' · ');
let sequence=0;
function fresh(){return{mode:'flow',step:MICRO_ENZYME_PROCESS_STEPS[0].id,sugar:{...MICRO_ENZYME_SUGAR_DEFAULT_INPUT},cells:{...MICRO_ENZYME_CELL_DEFAULT_INPUT},details:{},seen:{modes:[],details:[],sources:[]},writing:{draft:'',original:null,revision:'',firstContext:null,lastContext:null,retainedContext:null,revisionContext:null,retainedCondition:null},records:[],selectedRecord:'',saved:{},savedVersions:[],selectedSaved:'',pending:null,status:'',active:null};}
function draftFor(owner,key){if(owner===null||!['object','function'].includes(typeof owner))return fresh();let drafts=owners.get(owner);if(!drafts)owners.set(owner,drafts=new Map());if(!drafts.has(key))drafts.set(key,fresh());return drafts.get(key);}

/** One sourced protocol and four published treatment groups; no fitted time course. */
export function mountMicrobialEnzymeLab(root,id=MICRO_ENZYME_LAB_ID,{draftOwner,draftKey=MICRO_ENZYME_LAB_ID,onSaveSummary,reviewHref='#micro/review'}={}){
  if(id!==MICRO_ENZYME_LAB_ID)throw new RangeError('Unknown microbial enzyme activity');
  if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
  const d=draftFor(draftOwner,draftKey);mounted.get(root)?.dispose();d.active?.dispose();
  const prefix=`micro-enzyme-${++sequence}`,$=selector=>root.querySelector(selector),$$=selector=>root.querySelectorAll(selector);
  let disposed=false,sugarResult,cellResult,recordCount=-1,savedCount=-1;
  const remember=(list,value)=>{if(!list.includes(value))list.push(value);};
  const step=()=>MICRO_ENZYME_PROCESS_STEPS.find(item=>item.id===d.step);
  const select=(key,label,options)=>`<label for="${prefix}-${key}">${label}<select id="${prefix}-${key}" data-me-control="${key}">${options.map(([value,text])=>`<option value="${esc(String(value))}">${esc(text)}</option>`).join('')}</select></label>`;
  const groupOptions=MICRO_ENZYME_GROUPS.map(value=>[value,groupName(value)]);
  const allSugar=MICRO_ENZYME_SUGARS.map(sugar=>getSugarComparison({sugar:sugar.id,group:0}));
  const allCells=MICRO_ENZYME_ORGANISMS.map(organism=>getCellComparison({organism:organism.id,a:0,b:100}));
  root.innerHTML=`<section class="microbial-enzyme-lab" aria-labelledby="${prefix}-title">
    <header class="me-header"><h2 id="${prefix}-title">微生物酵素：乳糖與發酵</h2><p>一份研究 · 四個處理組</p></header>
    <nav class="me-tabs" aria-label="微生物酵素工作台畫面">${Object.entries(modes).map(([key,label])=>`<button type="button" data-me-mode="${key}" aria-pressed="false">${label}</button>`).join('')}</nav>
    <section data-me-panel="flow">
      <div class="me-reaction" role="img" aria-label="概念反應：乳糖加水，經β-galactosidase催化，生成葡萄糖和半乳糖">
        <div class="me-reaction-side"><strong>乳糖</strong><span>＋ 水</span></div><div class="me-reaction-arrow"><span>β-galactosidase</span><b>→</b></div><div class="me-reaction-side"><strong>葡萄糖</strong><span>＋</span><strong>半乳糖</strong></div>
      </div>
      <p class="me-producer">水解乳糖的 β(1→4) 鍵，改變可用糖。<i>K. lactis</i> 是酵素來源；接種發酵的是另外兩種優格菌。</p>
      <div class="me-flow-scroll" tabindex="0" role="region" aria-label="研究流程，選步驟查看"><div class="me-flow" role="group" aria-label="研究步驟">${MICRO_ENZYME_PROCESS_STEPS.map((item,index)=>`<button type="button" data-me-step="${esc(item.id)}" aria-pressed="false"><span>${index+1}</span>${esc(item.label)}</button>`).join('')}</div></div>
      <div class="me-step-reading"><h3 data-me-step-title></h3><p data-me-mechanism></p><p class="me-caption" data-me-step-boundary></p><div data-me-step-sources></div></div>
      <details data-me-detail="hypotheses"><summary>為何可能不同？看糖利用與產酸</summary><div class="me-detail-body" data-me-hypotheses></div></details>
      <p class="me-caption">這是反應與工序示意；沒有模擬原子、反應速度或發酵時間曲線。</p>
    </section>
    <section data-me-panel="sugar" hidden>
      <div class="me-controls">${select('sugar','比較哪種糖',MICRO_ENZYME_SUGARS.map(item=>[item.id,item.label]))}${select('group','查看處理組',groupOptions)}</div>
      <div class="me-comparison-grid"><div class="me-plot-column"><h3 data-me-sugar-title></h3><div class="me-chart-scroll" tabindex="0" role="region" aria-label="發酵前後糖量離散點圖，窄螢幕可橫向捲動"><svg data-me-sugar-chart viewBox="0 0 500 300" role="img" aria-labelledby="${prefix}-sugar-chart-title"></svg></div><div class="me-legend"><span>發酵前</span><span>發酵後</span></div><p class="me-caption" data-me-sugar-chart-note></p></div>
      <aside class="me-pair"><h3 data-me-sugar-selection></h3><div class="me-values"><div><span>發酵前</span><strong data-me-sugar-before></strong></div><div><span>發酵後</span><strong data-me-sugar-after></strong></div></div><p class="me-unit" data-me-sugar-unit></p><div class="me-delta"><span>後 − 前</span><strong data-me-sugar-difference></strong></div><p class="me-caption" data-me-sugar-reason></p><details data-me-detail="sugarRaw"><summary>這組糖量的原值與界線</summary><pre class="me-raw" data-me-sugar-raw></pre></details></aside></div>
      <p class="me-boundary">橫軸是名義水解處理組，並非時間；「前／後」指發酵前後，不是酵素水解前後。</p>
    </section>
    <section data-me-panel="cells" hidden>
      <div class="me-controls me-cell-controls">${select('organism','菌種／菌株',MICRO_ENZYME_ORGANISMS.map(item=>[item.id,item.shortLabel || item.label]))}${select('a','A 組',groupOptions)}${select('b','B 組',groupOptions)}</div>
      <div class="me-comparison-grid"><div class="me-plot-column"><h3 data-me-cell-title></h3><div class="me-chart-scroll" tabindex="0" role="region" aria-label="四處理組的菌數平均值，窄螢幕可橫向捲動"><svg data-me-cell-chart viewBox="0 0 500 300" role="img" aria-labelledby="${prefix}-cell-chart-title"></svg></div><p class="me-caption">每點是原表平均值；CFU 採樣時點未明。點選可設為 B。</p></div>
      <aside class="me-pair"><h3>比較 A 與 B</h3><div class="me-values"><div><span data-me-cell-a-label></span><strong data-me-cell-a></strong></div><div><span data-me-cell-b-label></span><strong data-me-cell-b></strong></div></div><p class="me-unit" data-me-cell-unit></p><div class="me-delta"><span>B − A（平均值）</span><strong data-me-cell-difference></strong></div><p class="me-caption" data-me-cell-author></p><details data-me-detail="cellRaw"><summary>原表 ±、字母分組與界線</summary><pre class="me-raw" data-me-cell-raw></pre></details></aside></div>
      <p class="me-boundary">± 的種類未交代，因此不畫誤差棒。平均值之差不等於新的顯著性檢定、菌株普遍反應或等效證明。</p>
    </section>
    <details data-me-detail="methods"><summary>酵素、研究方法與不同採樣端點</summary><div class="me-detail-body"><p data-me-reaction-details></p><div data-me-study-methods></div><p>兩個發酵菌株：${MICRO_ENZYME_ORGANISMS.map(item=>esc(item.label)).join('；')}。</p><p>糖量以前／後發酵端點呈現；菌數依原表記錄，CFU 採樣時間未交代，不能拼成同一條反應或生長曲線。</p><div data-me-cross-links></div></div></details>
    <details data-me-detail="raw"><summary>四組原表紀錄</summary><div class="me-table-scroll" tabindex="0" role="region" aria-label="原表糖量與菌數，窄螢幕可橫向捲動"><table><caption>保留來源小數、&lt; 符號、± 字串和字母分組；糖量單位 %（原表），菌數單位 ×10⁸ CFU/g。方法僅明示乳糖 w/w；葡萄糖基準未另明。</caption><thead><tr><th>名義處理組</th><th>乳糖<br>發酵前／後</th><th>葡萄糖<br>發酵前／後</th><th>L. bulgaricus 2038</th><th>S. thermophilus 1131</th></tr></thead><tbody>${MICRO_ENZYME_GROUPS.map((group,index)=>`<tr><th scope="row">${groupName(group)}</th>${allSugar.map(value=>`<td>${esc(value.points[index].before.displayValue)} ／ ${esc(value.points[index].after.displayValue)}</td>`).join('')}${allCells.map(value=>`<td>${esc(value.points[index].sourceText)}${value.points[index].letter?`（${esc(value.points[index].letter)}）`:''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
    <details data-me-detail="limits"><summary>資料限制與原文疑點（${MICRO_ENZYME_LIMITS.length} 項）</summary><div class="me-detail-body">${MICRO_ENZYME_LIMITS.map(item=>`<article><h3>${esc(item.label)}</h3><p>${esc(item.treatment)}</p><p class="me-caption">${esc(item.locator)}</p><details><summary>原文觀察</summary><p>${esc(item.observed)}</p></details></article>`).join('')}</div></details>
    <details data-me-detail="sources"><summary>完整來源與題目連結</summary><div class="me-detail-body">${MICRO_ENZYME_SOURCES.map(item=>`<article><a href="${esc(item.url)}" data-me-source="${esc(item.id)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} ↗</a><p>${esc(item.locator || '')}</p><p class="me-caption">${esc(item.note || '')}</p></article>`).join('')}<p>這份研究只提供特定乳基、酵素及菌株的紀錄；不能從四組資料推出通用最佳條件、食品安全或無乳糖法規達標。</p></div></details>
    <div class="me-record-bar"><button type="button" data-me-action="record">保留這次觀察</button><span data-me-record-count></span></div>
    <details data-me-detail="writing"><summary>寫下解釋與修訂（選填）</summary><p>原文保留後固定不變，後續文字寫在修訂。首次保留只代表第一次按下保留；資料已可查看，這裡沒有盲答設計，也不自動評分。</p><label for="${prefix}-draft">我的首次解釋<textarea id="${prefix}-draft" data-me-write="draft" rows="4"></textarea></label><button type="button" data-me-action="retain">保留這份原文</button><p class="me-caption" data-me-writing-context></p><details data-me-detail="original"><summary>已保留的原文與當時條件</summary><pre class="me-raw" data-me-original></pre></details><label for="${prefix}-revision">後續修訂<textarea id="${prefix}-revision" data-me-write="revision" rows="4" disabled></textarea></label><p class="me-caption" data-me-writing-stale></p></details>
    <details data-me-detail="records"><summary>回看保留的觀察</summary>${select('record','觀察紀錄',[])}<pre class="me-raw" data-me-record-text></pre><p>回看只顯示當時內容，不覆蓋目前條件或文字。</p></details>
    <details data-me-detail="notes"><summary>本次將附加的內容</summary><label for="${prefix}-preview">新增內容預覽<textarea id="${prefix}-preview" data-me-preview readonly rows="6"></textarea></label><div class="me-buttons"><button type="button" data-me-action="copy-pending">選取待存內容</button><button type="button" data-me-action="copy-full">選取完整摘要</button></div><label for="${prefix}-full">目前完整摘要<textarea id="${prefix}-full" data-me-full readonly rows="6"></textarea></label>${select('saved','已成功附加的版本',[])}<pre class="me-raw" data-me-saved-text></pre></details>
    <div class="me-save"><button type="button" class="me-primary" data-me-action="save"${typeof onSaveSummary==='function'?'':' disabled'}>附加到本課筆記</button><p data-me-save-status role="status"></p><a href="${esc(safeHref(reviewHref))}">我的複習 →</a></div><p class="me-caption">同頁離開再回來可接續；重新整理前請保存筆記。</p>
  </section>`;
  for(const detail of $$('[data-me-detail]'))detail.open=Boolean(d.details[detail.dataset.meDetail]);
  function captureDetails(){for(const detail of $$('[data-me-detail]')){d.details[detail.dataset.meDetail]=detail.open;if(detail.open)remember(d.seen.details,detail.dataset.meDetail);}}
  function currentContext(){
    if(d.mode==='flow')return `酵素與研究流程：${step().label}。`;
    if(d.mode==='sugar'){const value=getSugarComparison(d.sugar);return `${value.sugar.label}；名義${groupName(d.sugar.group)}；發酵前後。`;}
    const value=getCellComparison(d.cells);return `${value.organism.label}；A ${groupName(d.cells.a)}，B ${groupName(d.cells.b)}；CFU 採樣時點未明。`;
  }
  function exposure(){return `當時顯示${d.mode==='flow'?'酵素反應與研究流程示意':d.mode==='sugar'?'發酵前後糖量離散點':'菌數平均值離散點'}；本頁曾查看畫面：${d.seen.modes.map(key=>modes[key]).join('、') || '尚未記錄'}；曾展開：${d.seen.details.map(key=>detailLabels[key] || key).join('、') || '無'}；曾開啟來源連結 ${d.seen.sources.length} 個。首次保留不是盲答。`;}
  const writingContext=()=>`${currentContext()} ${exposure()}`;
  function readingText(){
    if(d.mode==='flow')return `${MICRO_ENZYME_REACTION.equation}\n${step().mechanism}\n界線：${step().boundary}\n酵素來源 K. lactis 與兩個發酵菌株不同。`;
    if(d.mode==='sugar'){const value=getSugarComparison(d.sugar),point=value.selected;return [`發酵前：${point.before.displayValue} ${value.unit}`,`發酵後：${point.after.displayValue} ${value.unit}`,`後 − 前：${value.difference.deltaText}${value.difference.available?` ${value.difference.unit}`:''}`,value.difference.reason,`界線：${value.boundary}`].join('\n');}
    const value=getCellComparison(d.cells);return [`A ${groupName(value.left.group)}：${value.left.sourceText}；字母 ${value.left.letter || '未列'}`,`B ${groupName(value.right.group)}：${value.right.sourceText}；字母 ${value.right.letter || '未列'}`,`B − A 平均值 = ${value.deltaText} ${value.unit}`,`作者比較：${value.authorComparison.text}`,`界線：${value.boundary}`].join('\n');
  }
  function snapshotRecord(){captureDetails();return clone({mode:d.mode,step:d.step,sugar:d.sugar,cells:d.cells,context:currentContext(),reading:readingText(),exposure:exposure(),writing:d.writing});}
  const recordText=record=>[record.context,record.reading,record.exposure,`當時原文（原樣）：\n${record.writing.original ?? record.writing.draft}`,`首次編寫條件：${record.writing.firstContext || '尚未編寫'}`,record.writing.retainedContext?`保留原文時條件：${record.writing.retainedContext}`:'當時尚未保留原文。',`當時修訂（原樣）：\n${record.writing.revision}`,record.writing.revisionContext?`修訂時條件：${record.writing.revisionContext}`:'當時尚未修訂。'].join('\n');
  function parts(){
    captureDetails();const w=d.writing,body={intro:'微生物酵素觀察 · 一份乳糖預水解與優格發酵研究；四個處理組，不擬合時間曲線。'};
    const key=d.mode==='flow'?`flow:${d.step}`:d.mode==='sugar'?`sugar:${d.sugar.sugar}:${d.sugar.group}`:`cells:${d.cells.organism}:${d.cells.a}:${d.cells.b}`;
    body[key]=`${currentContext()}\n${readingText()}`;body['seen:mode:'+d.mode]=`已顯示：${modes[d.mode]}；本活動沒有盲答設計。`;
    for(const name of d.seen.details.filter(key=>['methods','hypotheses','raw','limits','sources','sugarRaw','cellRaw'].includes(key)))body['seen:detail:'+name]=`曾展開：${detailLabels[name]}。`;
    for(const id of d.seen.sources){const source=MICRO_ENZYME_SOURCES.find(item=>item.id===id);if(source)body['seen:source:'+id]=`曾開啟來源連結：${source.title}；${source.url}`;}
    body.source=`研究來源：${MICRO_ENZYME_SOURCES.filter(item=>!item.id.includes('ntu')).map(item=>`${item.title}；${item.url}`).join('\n')}。原表與方法詳見本課來源。`;
    body.writingStatus=w.original===null?'原文狀態：尚未保留。':'原文狀態：已保留，不能覆寫。';
    body.writingText=w.original!==null||w.draft?`我的原文（原樣）：\n${w.original ?? w.draft}`:'未保留草稿：未填或已清空。';
    if(w.firstContext)body.firstContext=`首次編寫條件：${w.firstContext}`;if(w.lastContext)body.lastContext=`最近編寫條件：${w.lastContext}`;if(w.retainedContext)body.retainedContext=`保留原文時條件：${w.retainedContext}`;
    body.revision=w.revision?`我的修訂（原樣）：\n${w.revision}`:'修訂：未填或已清空。';if(w.revisionContext)body.revisionContext=`修訂時條件：${w.revisionContext}`;
    for(const [index,record]of d.records.entries())body[`record:${index}`]=`保留觀察 ${index+1}（固定快照）：\n${recordText(record)}`;
    return body;
  }
  function pending(){const all=parts(),changed=Object.entries(all).filter(([key,value])=>d.saved[key]!==value),full=Object.values(all).join('\n\n');return{parts:all,full,text:changed.length?Object.keys(d.saved).length?[`微生物酵素 · 本次新增／修改`,currentContext(),...changed.map(([,value])=>value)].join('\n\n'):full:''};}
  function axes(requiredMax,title,chartId){
    // Round only the axis interval upward; every mark still uses its source value.
    const roughStep=requiredMax/4,scale=10**Math.floor(Math.log10(roughStep));
    const step=[1,2,2.5,3,5,10].find(value=>value>=roughStep/scale)*scale,max=4*step;
    const left=64,top=25,width=404,height=205,y=value=>top+height-value/max*height;
    return{y,x:group=>left+width*(MICRO_ENZYME_GROUPS.indexOf(group)+.5)/MICRO_ENZYME_GROUPS.length,html:`<title id="${prefix}-${chartId}-chart-title">${esc(title)}</title><desc>四個名義處理組的離散紀錄，沒有插值、連線或時間軸。</desc>${[0,1,2,3,4].map(index=>`<line x1="${left}" y1="${y(step*index)}" x2="${left+width}" y2="${y(step*index)}" class="me-gridline"/><text x="${left-10}" y="${y(step*index)+5}" text-anchor="end">${fmt(step*index)}</text>`).join('')}<line x1="${left}" y1="${top+height}" x2="${left+width}" y2="${top+height}" class="me-axis"/>${MICRO_ENZYME_GROUPS.map(group=>`<text x="${left+width*(MICRO_ENZYME_GROUPS.indexOf(group)+.5)/4}" y="259" text-anchor="middle">${group}%</text>`).join('')}<text x="266" y="290" text-anchor="middle">名義水解處理組</text>`};
  }
  function renderSugar(){
    const value=sugarResult=getSugarComparison(d.sugar),selected=value.selected;
    $('[data-me-control="sugar"]').value=d.sugar.sugar;$('[data-me-control="group"]').value=String(d.sugar.group);
    $('[data-me-sugar-title]').textContent=`${value.sugar.label} · ${value.unit}`;$('[data-me-sugar-selection]').textContent=`查看 ${groupName(d.sugar.group)}`;
    $('[data-me-sugar-before]').textContent=selected.before.displayValue;$('[data-me-sugar-after]').textContent=selected.after.displayValue;$('[data-me-sugar-unit]').textContent=value.unit;
    $('[data-me-sugar-difference]').textContent=value.difference.available?`${value.difference.deltaText} ${value.difference.unit}`:value.difference.deltaText;
    $('[data-me-sugar-reason]').textContent=value.difference.available?'表列後 − 前；不是相對百分比變化。':value.difference.reason;
    $('[data-me-sugar-raw]').textContent=`${value.sugar.label}，${groupName(d.sugar.group)}\n發酵前：${selected.before.displayValue} ${value.unit}\n發酵後：${selected.after.displayValue} ${value.unit}\n${value.boundary}`;
    const max=Math.max(...value.points.flatMap(point=>[point.before,point.after]).map(item=>item.censored?item.bound:item.value))*1.15;
    const {x,y,html}=axes(max,`${value.sugar.label}發酵前後，單位 ${value.unit}`,'sugar');
    $('[data-me-sugar-chart]').innerHTML=html+value.points.map(point=>`<g data-me-point="sugar:${point.group}" tabindex="0" role="button" aria-label="查看${groupName(point.group)}：發酵前 ${esc(point.before.displayValue)}，發酵後 ${esc(point.after.displayValue)} ${esc(value.unit)}"><title>${groupName(point.group)}：發酵前 ${esc(point.before.displayValue)}；發酵後 ${esc(point.after.displayValue)}</title>${[point.before,point.after].map((end,index)=>{const px=x(point.group)+(index?11:-11),py=y(end.censored?end.bound:end.value),color=index?'me-after':'me-before';return `${point.group===d.sugar.group?`<circle cx="${px}" cy="${py}" r="11" class="me-ring"/>`:''}${end.censored?`<polygon data-me-threshold="${point.group}:${index?'after':'before'}" points="${px-6},${py-5} ${px+6},${py-5} ${px},${py+6}" class="me-threshold ${color}"><title>&lt;0.03；門檻標記，不是精確值</title></polygon>`:`<circle data-me-observation="${point.group}:${index?'after':'before'}" cx="${px}" cy="${py}" r="5" class="${color}"/>`}`;}).join('')}</g>`).join('');
    $('[data-me-sugar-chart-note]').textContent=value.points.some(point=>point.before.censored||point.after.censored)?'▽ 置於 0.03 門檻：原值 <0.03，並非測得 0。前後點左右錯開；點選查看該組。':'前後點左右錯開以便比較；沒有誤差棒或連線。點選查看該組。';
  }
  function renderCells(){
    const value=cellResult=getCellComparison(d.cells);for(const key of ['organism','a','b'])$('[data-me-control="'+key+'"]').value=String(d.cells[key]);
    $('[data-me-cell-title]').textContent=`${value.organism.shortLabel || value.organism.label} · ${value.unit}`;
    $('[data-me-cell-a-label]').textContent=`A · ${groupName(value.left.group)}`;$('[data-me-cell-b-label]').textContent=`B · ${groupName(value.right.group)}`;
    $('[data-me-cell-a]').textContent=value.left.displayValue;$('[data-me-cell-b]').textContent=value.right.displayValue;$('[data-me-cell-unit]').textContent=value.unit;$('[data-me-cell-difference]').textContent=value.deltaText;
    $('[data-me-cell-author]').textContent=({'same-record':'A 與 B 是同一組；差為零不構成組間比較。','author-reported-no-change':'作者未觀察到菌數變化；這不證明等效。','published-shared-letter':'原表共用 b 字母；作者未區分兩組為顯著不同，這不證明等效。','published-different-letters':'作者：100% 組較高；四組平均值並非單調增加。'})[value.authorComparison.code];
    $('[data-me-cell-raw]').textContent=`${value.organism.label}\nA ${groupName(value.left.group)}：${value.left.sourceText}；字母 ${value.left.letter || '未列'}\nB ${groupName(value.right.group)}：${value.right.sourceText}；字母 ${value.right.letter || '未列'}\n單位 ${value.unit}；± 種類未交代。\n${value.authorComparison.text}\n${value.boundary}`;
    const {x,y,html}=axes(Math.max(...value.points.map(point=>point.value))*1.2,`${value.organism.label}，單位 ${value.unit}`,'cell');
    $('[data-me-cell-chart]').innerHTML=html+value.points.map(point=>{const a=point.group===d.cells.a,b=point.group===d.cells.b;return`<g data-me-point="cells:${point.group}" tabindex="0" role="button" aria-label="設為 B：${groupName(point.group)}，平均值 ${esc(point.displayValue)} ${esc(value.unit)}"><title>${groupName(point.group)}：${esc(point.sourceText)}；字母 ${esc(point.letter || '未列')}</title>${a||b?`<circle cx="${x(point.group)}" cy="${y(point.value)}" r="11" class="me-ring"/><text x="${x(point.group)}" y="${y(point.value)-18}" text-anchor="middle" class="me-point-label">${a&&b?'A/B':a?'A':'B'}</text>`:''}<circle data-me-observation="cells:${point.group}" cx="${x(point.group)}" cy="${y(point.value)}" r="5" class="${b?'me-after':a?'me-before':'me-dot'}"/></g>`;}).join('');
  }
  function renderJournal(){
    const w=d.writing,draft=$('[data-me-write="draft"]'),revision=$('[data-me-write="revision"]');if(draft.value!==w.draft)draft.value=w.draft;if(revision.value!==w.revision)revision.value=w.revision;
    draft.readOnly=w.original!==null;revision.disabled=w.original===null;$('[data-me-action="retain"]').disabled=w.original!==null||!w.draft.trim();
    $('[data-me-writing-context]').textContent=w.firstContext?`首次編寫：${w.firstContext}`:'尚未編寫；開始時會記錄當時畫面與已查看的資料。';
    $('[data-me-original]').textContent=w.original===null?'尚未保留原文。':`${w.original}\n\n首次編寫：${w.firstContext}\n保留時：${w.retainedContext}`;
    $('[data-me-writing-stale]').textContent=w.original!==null&&w.retainedCondition!==currentContext()?'目前條件已改變，保留原文仍屬於當時條件；可在修訂中補充。':'';
    $('[data-me-record-count]').textContent=d.records.length?`已保留 ${d.records.length} 次`:'尚未保留觀察';
    if(recordCount!==d.records.length){recordCount=d.records.length;$('[data-me-control="record"]').innerHTML='<option value="">選擇觀察</option>'+d.records.map((item,index)=>`<option value="${index}">第 ${index+1} 次 · ${esc(modes[item.mode])}</option>`).join('');}
    $('[data-me-control="record"]').value=d.selectedRecord;const record=/^(?:0|[1-9]\d*)$/.test(d.selectedRecord)?d.records[Number(d.selectedRecord)]:null;$('[data-me-record-text]').textContent=record?recordText(record):'保留後可在這裡回看。';
    if(savedCount!==d.savedVersions.length){savedCount=d.savedVersions.length;$('[data-me-control="saved"]').innerHTML='<option value="">選擇已存版本</option>'+d.savedVersions.map((item,index)=>`<option value="${index}">第 ${index+1} 次附加</option>`).join('');}
    $('[data-me-control="saved"]').value=d.selectedSaved;const version=/^(?:0|[1-9]\d*)$/.test(d.selectedSaved)?d.savedVersions[Number(d.selectedSaved)]:null;$('[data-me-saved-text]').textContent=version?`當次新增：\n${version.text}\n\n當時完整摘要：\n${version.full}`:'';
    const next=pending(),over=next.text.length>10000;$('[data-me-preview]').value=next.text;$('[data-me-full]').value=next.full;$('[data-me-action="save"]').disabled=typeof onSaveSummary!=='function'||Boolean(d.pending)||!next.text||over;
    $('[data-me-save-status]').textContent=d.pending?'正在附加；仍可繼續操作。':over?'待存內容超過 10,000 字元，尚未送出；全文保留，可選取複製。':!next.text?'目前內容已附加至筆記。':d.status || (typeof onSaveSummary==='function'?'':'目前可選取摘要複製。');
  }
  function render(){
    if(disposed)return;captureDetails();remember(d.seen.modes,d.mode);
    for(const key of Object.keys(modes)){$('[data-me-panel="'+key+'"]').hidden=d.mode!==key;$('[data-me-mode="'+key+'"]').setAttribute('aria-pressed',String(d.mode===key));}
    for(const button of $$('[data-me-step]'))button.setAttribute('aria-pressed',String(button.dataset.meStep===d.step));
    $('[data-me-step-title]').textContent=step().label;$('[data-me-mechanism]').textContent=step().mechanism;$('[data-me-step-boundary]').textContent=step().boundary;$('[data-me-step-sources]').innerHTML=sourceLinks(step().sourceIds);
    renderSugar();renderCells();renderJournal();
  }
  function save(){
    if(disposed||d.pending||typeof onSaveSummary!=='function')return;const captured=pending();if(!captured.text||captured.text.length>10000){renderJournal();return;}d.pending=captured;d.status='';renderJournal();
    const finish=ack=>{if(d.pending!==captured)return;d.pending=null;if(ack===true){Object.assign(d.saved,captured.parts);d.savedVersions.push({text:captured.text,full:captured.full});d.status='';}else d.status='尚未保存；新增內容仍可重試或選取複製。';d.active?.render();};
    try{const answer=onSaveSummary(captured.text);if(answer!==null&&['object','function'].includes(typeof answer)&&typeof answer.then==='function')Promise.resolve(answer).then(finish,()=>finish(false));else finish(answer);}catch{finish(false);}
  }
  function onClick(event){
    if(disposed)return;captureDetails();const target=event.target?.closest?.('[data-me-source],button,[data-me-point]');if(!target||!root.contains(target)||target.disabled)return;const a=target.dataset;
    if(a.meSource){remember(d.seen.sources,a.meSource);renderJournal();return;}
    if(Object.hasOwn(modes,a.meMode)){d.mode=a.meMode;render();return;}
    if(MICRO_ENZYME_PROCESS_STEPS.some(item=>item.id===a.meStep)){d.step=a.meStep;render();return;}
    if(a.mePoint){const match=a.mePoint.match(/^(sugar|cells):(0|50|75|100)$/);if(match){if(match[1]==='sugar')d.sugar.group=Number(match[2]);else d.cells.b=Number(match[2]);d.status='';render();$('[data-me-point="'+a.mePoint+'"]')?.focus?.({preventScroll:true});}return;}
    if(a.meAction==='record'){d.records.push(snapshotRecord());d.selectedRecord=String(d.records.length-1);d.status='';renderJournal();return;}
    if(a.meAction==='retain'){const w=d.writing;if(w.original===null&&w.draft.trim()){w.original=w.draft;w.retainedContext=writingContext();w.retainedCondition=currentContext();d.status='';renderJournal();}return;}
    if(a.meAction==='save'){save();return;}
    if(['copy-pending','copy-full'].includes(a.meAction)){const field=$(a.meAction==='copy-pending'?'[data-me-preview]':'[data-me-full]');field.focus();field.select?.();}
  }
  function onChange(event){
    if(disposed)return;captureDetails();const target=event.target?.closest?.('[data-me-control]');if(!target||!root.contains(target))return;const key=target.dataset.meControl,value=target.value;
    if(['sugar','group'].includes(key)){const candidate={...d.sugar,[key]:key==='group'&&/^(0|50|75|100)$/.test(value)?Number(value):value};try{getSugarComparison(candidate);}catch{target.value=String(d.sugar[key]);return;}d.sugar=candidate;}
    else if(['organism','a','b'].includes(key)){const candidate={...d.cells,[key]:key!=='organism'&&/^(0|50|75|100)$/.test(value)?Number(value):value};try{getCellComparison(candidate);}catch{target.value=String(d.cells[key]);return;}d.cells=candidate;}
    else if(key==='record'){d.selectedRecord=value;renderJournal();return;}else if(key==='saved'){d.selectedSaved=value;renderJournal();return;}else{render();return;}d.status='';render();
  }
  function onInput(event){
    if(disposed)return;const target=event.target?.closest?.('[data-me-write]');if(!target||!root.contains(target))return;captureDetails();const key=target.dataset.meWrite,w=d.writing;
    if(!['draft','revision'].includes(key))return;if((key==='draft'&&w.original!==null)||(key==='revision'&&w.original===null)){renderJournal();return;}if(target.value===w[key])return;w[key]=target.value;
    if(key==='draft'){w.firstContext??=writingContext();w.lastContext=writingContext();}else w.revisionContext=writingContext();d.status='';renderJournal();
  }
  function onToggle(event){if(disposed||!root.contains(event.target)||!event.target?.dataset?.meDetail)return;captureDetails();renderJournal();}
  function onKey(event){if(disposed||!['Enter',' '].includes(event.key))return;const target=event.target?.closest?.('[data-me-point]');if(!target||!root.contains(target))return;event.preventDefault?.();onClick({target});}
  function dispose(){if(disposed)return;captureDetails();disposed=true;for(const [type,handler]of listeners)root.removeEventListener(type,handler,type==='toggle');if(d.active===view)d.active=null;if(mounted.get(root)===view)mounted.delete(root);}
  const view={dispose,render},listeners=[['click',onClick],['change',onChange],['input',onInput],['toggle',onToggle],['keydown',onKey]];
  d.active=view;mounted.set(root,view);for(const [type,handler]of listeners)root.addEventListener(type,handler,type==='toggle');
  $('[data-me-reaction-details]').textContent=`${MICRO_ENZYME_REACTION.equation}。${MICRO_ENZYME_REACTION.purpose} ${MICRO_ENZYME_REACTION.boundary}`;
  const study=MICRO_ENZYME_STUDY;
  const interpretation=study.authorInterpretations[0];
  $('[data-me-hypotheses]').innerHTML=`<h3>${esc(interpretation.label)}</h3><p>作者解釋／可能機理：${esc(interpretation.statement)}</p><p class="me-caption">${esc(interpretation.boundary)}</p>${sourceLinks(interpretation.sourceIds)}`;
  $('[data-me-study-methods]').innerHTML=`<p>乳基：${esc(study.substrate.label)}。使用 ${esc(study.enzyme.label)}；生產來源 ${esc(study.enzyme.producerSpecies)}。${esc(study.enzyme.boundary)}</p><p>先製備未水解與近完全水解兩份乳基，兩份都經 ${study.preparation.heatTreatment.temperatureC} °C、${study.preparation.heatTreatment.durationMin} 分鐘加熱、冷卻，再混配成四組；接種前乳糖酵素處理與 starter 發酵分開。主文水解溫度為 ${study.preparation.hydrolysisTemperatureConflict.mainMethodsC} °C，補充 S1 為 ${study.preparation.hydrolysisTemperatureConflict.supplementS1C} °C，未釐清。</p><p>研究接種 ${study.fermentation.inoculumPercentWw}%（w/w）LB81，${study.fermentation.temperatureC} °C 發酵至 pH ${study.fermentation.endpointPH}，氮氣降溶氧至 &lt;2 ppm；發酵後冷藏 ${study.fermentation.storageTemperatureC} °C。糖以 HPLC／折射率偵測，方法把糖分析列於製作後冷藏約 24 小時的評估；菌數未另明採樣時點。</p><p>平板法：含溴甲酚紫的計數培養基、倒盤、37 °C 厭氧 48 小時，再依粗糙／平滑菌落區分兩菌。原文的三重測定不等於已知三個獨立發酵批次；± 未定義為 SD 或 SE。</p><p>${esc(study.sugarMeasurement.boundary)} ${esc(study.cellMeasurement.boundary)}</p>${study.authorInterpretations.slice(1).map(item=>`<article><h3>作者提出的可能影響：${esc(item.label)}</h3><p>${esc(item.statement)}</p><p class="me-caption">${esc(item.boundary)}</p>${sourceLinks(item.sourceIds)}</article>`).join('')}`;
  $('[data-me-cross-links]').innerHTML=study.crossLessonLinks.map(item=>`<p><a href="${esc(item.href)}" data-me-cross-link>${esc(item.label)} →</a><br><span class="me-caption">${esc(item.boundary)}</span></p>`).join('');
  render();return dispose;
}
