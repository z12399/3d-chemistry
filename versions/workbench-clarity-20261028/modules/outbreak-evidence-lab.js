import {escapeHTML as esc} from './storage.js';
import {OUTBREAK_DATA as DATA} from './outbreak-evidence-data.js';
import {evaluateOutbreakEvidence} from './outbreak-evidence-model.js';

export const OUTBREAK_LAB_ID='outbreak-evidence';
export const OUTBREAK_SOURCES=DATA.sources;
const drafts=new WeakMap();let sequence=0;
const copy=value=>structuredClone(value);
const CHOICES={support:'目前有支持',reserve:'仍需保留',against:'有相衝突的證據'};
const STATUS={support:'已納入支持',limited:'已納入，有限制','not-established':'尚未納入支持'};
const HEADER='巧克力事件證據觀察｜逐版本保存；未納入不等於反證。證據線不是親緣樹或傳播方向，不推算共同來源機率；最初污染入口仍有限制。首次文字不作盲測。';
const fresh=()=>({bundleId:DATA.bundles[0].id,cases:{},observations:[],sources:[],seenEvidence:[],seenContext:[],seenAnalysis:[],seenMethods:[],detailsOpened:false,methodsOpened:false,methodId:DATA.methods[0].id,cursor:{started:false,first:[],results:{},writing:{},observations:0,sources:[],seenEvidence:[],seenContext:[],seenAnalysis:[],seenMethods:[],details:false,methods:false}});
const bundle=id=>DATA.bundles.find(b=>b.id===id);
const current=d=>d.cases[d.bundleId]??={bundleId:d.bundleId,includedEvidenceIds:[],focusedId:null,choice:'',prediction:'',revision:'',next:'',first:null};
const parameters=c=>({bundleId:c.bundleId,includedEvidenceIds:[...c.includedEvidenceIds]});
const writing=c=>({choice:c.choice,prediction:c.prediction,revision:c.revision,next:c.next});
const writingText=w=>`判斷：${CHOICES[w.choice]||'未選'}\n理由：${w.prediction||'未填'}\n修訂：${w.revision||'未填'}\n下一項證據：${w.next||'未填'}`;
const scopeText=b=>`${b.label}｜出版 ${b.publicationDate}\n資料範圍：${b.asOf}\n${b.scope}`;
const resultFor=c=>evaluateOutbreakEvidence(DATA,parameters(c));
function resultText(p,r){const b=bundle(p.bundleId);return `${scopeText(b)}\n已納入：${p.includedEvidenceIds.map(id=>b.evidence.find(e=>e.id===id).label).join('、')||'無'}\n${r.headline}\n${r.selectedCards.map(e=>`${e.label}：${e.summary}`).join('\n')}\n${(r.contextCards||[]).map(e=>`固定來源背景（非選卡）：${e.label}｜${e.summary}`).join('\n')}\n${(r.analysisContext||[]).map(e=>`獨立分析範圍（非選卡）：${e.summary}`).join('\n')}\n支持：${r.support.join('；')||'尚無已納入的支持'}\n缺口與限制：${r.missing.join('；')}\n來源未解差異：${r.inconsistency.join('；')||'本版本未在此列出資料差異；不表示已排除所有反證'}`;}
const sourceText=()=>DATA.sources.map(s=>`${s.id}｜${s.title}\n${s.url}`).join('\n');
function evidenceGraph(r,prefix){
  const positions=[[10,18,185,62,195,51,236,99],[425,18,185,62,425,51,384,99],[10,161,185,62,195,192,236,144],[425,161,185,62,425,192,384,144]];
  return `<svg viewBox="0 0 620 243" role="img" aria-labelledby="${prefix}-graph-title"><title id="${prefix}-graph-title">四類證據對共同工廠相關主張的支持；線不是傳播路徑</title>${r.lanes.map((lane,i)=>{const [x,y,w,h,x1,y1,x2,y2]=positions[i],context=(r.contextCards||[]).some(e=>e.kind===lane.id);return `<g class="outbreak-lane outbreak-${esc(lane.status)}"><path d="M${x1},${y1}L${x2},${y2}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text x="${x+w/2}" y="${y+25}" text-anchor="middle">${esc(lane.label)}</text><text class="outbreak-lane-status" x="${x+w/2}" y="${y+48}" text-anchor="middle">${esc(context?'來源背景，有限制':STATUS[lane.status])}</text></g>`;}).join('')}<rect class="outbreak-claim" x="236" y="87" width="148" height="70" rx="9"/><text x="310" y="115" text-anchor="middle" class="outbreak-claim-text">共同工廠</text><text x="310" y="140" text-anchor="middle" class="outbreak-claim-text">相關？</text></svg>`;
}

/** Temporary state is scoped to the host owner. Durable notes stay with the host. */
export function mountOutbreakEvidenceLab(root,id=OUTBREAK_LAB_ID,{draftOwner,draftKey='micro-outbreak-evidence',onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==OUTBREAK_LAB_ID)throw new RangeError('Unknown outbreak activity');
  const owned=draftOwner&&typeof draftOwner==='object';if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
  const board=owned?drafts.get(draftOwner):new Map();if(!board.has(draftKey))board.set(draftKey,fresh());
  const d=board.get(draftKey),prefix=`outbreak-${++sequence}`,field=name=>root.querySelector(`[data-ob-${name}]`),action=name=>root.querySelector(`[data-ob-action="${name}"]`);
  let disposed=false,feedback='',error='',saveStatus='';current(d);
  root.innerHTML=`<section class="outbreak-evidence-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title" class="outbreak-sr-only">菌株相似，能判定共同來源嗎？</h2>
    <div class="outbreak-toolbar"><label for="${prefix}-bundle">證據版本<select id="${prefix}-bundle" data-ob-bundle>${DATA.bundles.map(b=>`<option value="${esc(b.id)}">${esc(b.label)}</option>`).join('')}</select></label><button type="button" data-ob-action="record">記下觀察</button></div>
    <p class="outbreak-scope" data-ob-scope></p><div class="outbreak-evidence" role="group" aria-label="納入推論的證據" data-ob-evidence></div>
    <div class="outbreak-display"><div class="outbreak-graph" data-ob-graph></div><div class="outbreak-result" aria-live="polite" data-ob-result></div></div>
    <p class="outbreak-caption">線表示證據對主張的支持，不是傳播路徑或親緣樹。取消納入不等於反證。</p><div class="outbreak-context" data-ob-context></div>
    <div class="outbreak-focus" data-ob-focus aria-live="polite"></div><p class="outbreak-feedback" role="status" data-ob-feedback></p><p class="outbreak-error" role="status" data-ob-error></p>
    <details><summary>我的判斷、修訂與下一項證據</summary><p>這家工廠的相關產品與病例群聚有何關聯？指出支持的環節，也指出不能確定的部分。</p><div class="outbreak-choices" role="group" aria-label="目前判斷">${Object.entries(CHOICES).map(([v,l])=>`<button type="button" data-ob-choice="${v}">${l}</button>`).join('')}</div><label for="${prefix}-prediction">目前的理由<textarea id="${prefix}-prediction" rows="2" data-ob-prediction></textarea></label><p class="outbreak-context" data-ob-first></p><label for="${prefix}-revision">加入證據後的修訂<textarea id="${prefix}-revision" rows="2" data-ob-revision></textarea></label><label for="${prefix}-next">下一項需要的證據<textarea id="${prefix}-next" rows="2" data-ob-next></textarea></label><button type="button" data-ob-action="record-writing">記錄這次文字</button></details>
    <details data-ob-records-details><summary>已記錄的觀察 <span data-ob-count></span></summary><div data-ob-records></div></details>
    <details data-ob-summary-details><summary>檢查並保存摘要</summary><label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" readonly rows="7" data-ob-summary></textarea></label><button type="button" data-ob-action="copy">選取完整摘要</button><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" readonly rows="5" data-ob-append></textarea></label><button type="button" data-ob-action="save" ${typeof onSaveSummary!=='function'?'hidden':''}>附加到本課筆記</button><p role="status" data-ob-save-status></p><p class="outbreak-context">課內返回可接續草稿；重新整理前請保存或複製。保存成功才推進，不截斷內容。</p></details>
    <details data-ob-methods><summary>培養、PCR 與定序各回答什麼？</summary><label for="${prefix}-method">方法<select id="${prefix}-method" data-ob-method>${DATA.methods.map(m=>`<option value="${esc(m.id)}">${esc(m.label)}</option>`).join('')}</select></label><div data-ob-method-result></div><p class="outbreak-context">方法能回答的問題與共同來源判斷不同；單一檢測不能取代流調和產品追溯。</p></details>
    <details data-ob-details><summary>逐筆證據、分析範圍與來源</summary><p>報告出版日期、事件時間與分析資料截止日分別記錄。不同版本的菌株集合與分析不能合併，62 AD 與 56 AD 不代表菌株差異隨時間縮小。圖中只整理作者報告的關係，沒有重建基因體、成對距離矩陣或親緣樹。</p><div data-ob-source-table></div><p>首次保留只記錄當時文字與本工作台已開啟的資料；課文或先前頁面也可能透露結果，不作盲測。來源開啟不證明讀完或理解。</p><ul>${DATA.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-ob-source="${esc(s.id)}">${esc(s.title)}</a></li>`).join('')}</ul></details></section>`;
  function captureFirst(trigger){const c=current(d);if(!c.first)c.first={trigger,parameters:parameters(c),writing:copy(writing(c)),exposure:{seenEvidence:[...d.seenEvidence],seenContext:[...d.seenContext],seenAnalysis:[...d.seenAnalysis],seenMethods:[...d.seenMethods],sources:[...d.sources],detailsOpened:d.detailsOpened,methodsOpened:d.methodsOpened}};}
  function firstText(c){if(!c.first)return '首次納入、記錄或開啟證據／來源時保留當時文字；不作盲測。';const f=c.first,e=f.exposure;return `首次保留（${f.trigger}）\n${writingText(f.writing)}\n當時已納入：${f.parameters.includedEvidenceIds.join('、')||'無'}；先前顯示過的可選卡：${e.seenEvidence.join('、')||'無'}；已顯示固定背景：${e.seenContext.join('、')||'無'}；已顯示獨立分析：${e.seenAnalysis.join('、')||'無'}；已顯示方法：${e.seenMethods.join('、')||'無'}；證據詳情已開=${e.detailsOpened?'是':'否'}；方法已開=${e.methodsOpened?'是':'否'}；來源=${e.sources.join('、')||'無'}。後續改寫不覆蓋此快照。`;}
  function observationText(o,i){return `觀察 ${i+1}\n${resultText(o.parameters,o.result)}\n${writingText(o.writing)}`;}
  function archive(){return [HEADER,...Object.values(d.cases).map(c=>`${resultText(parameters(c),resultFor(c))}\n${firstText(c)}\n${writingText(writing(c))}`),...d.observations.map(observationText),`證據詳情已開=${d.detailsOpened?'是':'否'}；方法已開=${d.methodsOpened?'是':'否'}；曾顯示證據=${d.seenEvidence.join('、')||'無'}；固定背景=${d.seenContext.join('、')||'無'}；獨立分析=${d.seenAnalysis.join('、')||'無'}；方法=${d.seenMethods.join('、')||'無'}；來源=${d.sources.join('、')||'無'}。開啟不證明理解。`,sourceText()].join('\n\n');}
  function appendPlan(){const next=copy(d.cursor),blocks=[],currentBlocks=[],newObservations=d.observations.slice(next.observations);for(const [key,c] of Object.entries(d.cases)){
    if(c.first&&!next.first.includes(key)){blocks.push(`${bundle(key).label}\n${firstText(c)}`);next.first.push(key);}
    const signature=JSON.stringify(parameters(c)),w=writing(c),latest=newObservations.filter(o=>o.parameters.bundleId===key).at(-1);
    // Only the final new snapshot in this version can stand for its current state.
    // If the learner returns to an earlier selection/writing, state that explicitly
    // after the history rather than silently treating an earlier match as current.
    if(latest){
      if(JSON.stringify(latest.parameters)!==signature||JSON.stringify(latest.writing)!==JSON.stringify(w))currentBlocks.push(`保存時目前狀態（歷史觀察另列）\n${resultText(parameters(c),resultFor(c))}\n${writingText(w)}`);
      next.results[key]=signature;next.writing[key]=copy(w);
    }else{
      if(c.first&&next.results[key]!==signature){currentBlocks.push(`保存時目前證據\n${resultText(parameters(c),resultFor(c))}`);next.results[key]=signature;}
      const old=next.writing[key];if(JSON.stringify(w)!==JSON.stringify(old)){if(Object.values(w).some(Boolean)||old)currentBlocks.push(`${bundle(key).label}｜保存時目前文字\n${writingText(w)}`);next.writing[key]=copy(w);}
    }
  }for(let i=next.observations;i<d.observations.length;i++)blocks.push(observationText(d.observations[i],i));next.observations=d.observations.length;blocks.push(...currentBlocks);
    for(const [flag,label] of [['details','逐筆證據'],['methods','方法界線']])if(d[`${flag}Opened`]&&!next[flag]){blocks.push(`已開${label}；不等於完整閱讀或理解。`);next[flag]=true;}
    for(const [key,label] of [['seenEvidence','可選證據'],['seenContext','固定來源背景'],['seenAnalysis','獨立分析範圍'],['seenMethods','方法']]){const added=d[key].filter(id=>!next[key].includes(id));if(added.length)blocks.push(`新增顯示${label}：${added.join('、')}；顯示不等於理解。`);next[key]=[...d[key]];}
    const added=d.sources.filter(s=>!next.sources.includes(s));if(added.length)blocks.push('新增來源開啟：'+added.join('、')+'（不證明閱讀範圍）');next.sources=[...d.sources];
    if(blocks.length&&!next.started){blocks.unshift(HEADER);blocks.push(sourceText());next.started=true;}return {text:blocks.join('\n\n'),next};
  }
  function drawSummary(){field('summary').value=archive();const plan=appendPlan();field('append').value=plan.text;action('save').disabled=!plan.text;field('save-status').textContent=saveStatus;}
  function refsText(refs){return refs.map(ref=>`${ref.sourceId}｜${ref.locator}`).join('；');}
  function draw(){if(disposed)return;const c=current(d),b=bundle(d.bundleId),r=resultFor(c);
    for(const e of r.contextCards||[])if(!d.seenContext.includes(e.id))d.seenContext.push(e.id);
    trackAnalysisExposure();
    if(field('methods').open&&!d.seenMethods.includes(d.methodId))d.seenMethods.push(d.methodId);
    field('bundle').value=d.bundleId;field('scope').textContent=`出版 ${b.publicationDate} · ${b.asOf} · 版本固定，互不合併`;
    // Keep buttons mounted during selection so keyboard focus survives an evidence toggle.
    const existing=Array.from(field('evidence').querySelectorAll('[data-ob-card]'));if(existing.length!==b.evidence.length||existing.some(button=>!b.evidence.some(e=>e.id===button.dataset.obCard)))field('evidence').innerHTML=b.evidence.map(e=>`<button type="button" data-ob-card="${esc(e.id)}" aria-pressed="false">${esc(e.label)}</button>`).join('');
    field('evidence').querySelectorAll('[data-ob-card]').forEach(button=>button.setAttribute('aria-pressed',String(c.includedEvidenceIds.includes(button.dataset.obCard))));
    field('graph').innerHTML=evidenceGraph(r,prefix);field('result').innerHTML=`<span class="outbreak-kicker">目前這組證據</span><strong>${esc(r.headline)}</strong><p>${esc(r.missing[0]||'仍依原調查範圍判讀。')}</p>`;
    field('context').innerHTML=(r.contextCards||[]).map(e=>`<p><strong>固定背景 · ${esc(e.label)}</strong>　${esc(e.summary)}</p>`).join('');
    const focused=b.evidence.find(e=>e.id===c.focusedId);field('focus').innerHTML=focused?`<span class="outbreak-kicker">${c.includedEvidenceIds.includes(focused.id)?'已納入':'已取消納入'} · ${esc(focused.label)}</span><p>${esc(focused.summary)}</p><p class="outbreak-context">${esc(focused.limits[0]||'請依原始資料範圍判讀。')}</p>`:'<p>按上方證據按鈕加入推論；也可先展開「我的判斷」記下理由。</p>';
    root.querySelectorAll('[data-ob-choice]').forEach(button=>button.setAttribute('aria-pressed',String(c.choice===button.dataset.obChoice)));for(const name of ['prediction','revision','next'])field(name).value=c[name];field('first').textContent=firstText(c);field('count').textContent=`${d.observations.length} / 24`;
    field('records').innerHTML=d.observations.length?d.observations.map((o,i)=>`<article><p>${esc(observationText(o,i))}</p><button type="button" data-ob-replay="${i}">回到觀察 ${i+1} 的證據組合</button></article>`).join(''):'<p>尚未記錄。</p>';
    field('source-table').innerHTML=`<p>${esc(scopeText(b))}</p>${[...b.evidence,...(r.contextCards||[])].map(e=>`<article><strong>${e.selectable===false?'固定來源背景 · ':''}${esc(e.label)}</strong><p>${esc(e.summary)}</p><p>能支持：${esc(e.supports.join('；'))}<br>界線：${esc(e.limits.join('；'))}</p><p class="outbreak-context">${esc(refsText(e.sourceRefs))}</p></article>`).join('')}${(r.analysisContext||[]).map(e=>`<article><strong>非選卡 · ${esc(e.label)}</strong><p>${esc(e.summary)}</p><p>${esc(e.limits.join('；'))}</p><p class="outbreak-context">${esc(refsText(e.sourceRefs))}</p></article>`).join('')}<p>目前缺口與限制：${esc(r.missing.join('；'))}</p>${r.inconsistency.length?`<p>來源未解差異（不自動反證共同來源）：${esc(r.inconsistency.join('\n'))}</p>`:''}`;
    field('method').value=d.methodId;const m=DATA.methods.find(m=>m.id===d.methodId);field('method-result').innerHTML=`<p><strong>能回答</strong><br>${esc(m.can)}</p><p><strong>不能單獨回答</strong><br>${esc(m.cannot)}</p><p class="outbreak-context">${esc(m.sourceRefs.join('、'))}</p>`;
    field('error').textContent=error;field('feedback').textContent=feedback;drawSummary();
  }
  function markAllVisible(){for(const e of bundle(d.bundleId).evidence)if(!d.seenEvidence.includes(e.id))d.seenEvidence.push(e.id);}
  function trackAnalysisExposure(){const ids=new Set();if(field('details').open)ids.add(d.bundleId);if(field('summary-details').open)Object.keys(d.cases).forEach(id=>ids.add(id));if(field('records-details').open)d.observations.forEach(o=>ids.add(o.parameters.bundleId));for(const id of ids)for(const e of bundle(id).analysisContext||[])if(!d.seenAnalysis.includes(e.id))d.seenAnalysis.push(e.id);}
  function switchBundle(id){if(!bundle(id))throw new RangeError('請選擇已核對的分析版本。');d.bundleId=id;current(d);if(field('details').open){captureFirst('開啟中的證據表更新前');d.detailsOpened=true;markAllVisible();}feedback='';saveStatus='';error='';draw();}
  function record(){captureFirst('記下證據與文字');const c=current(d),o={parameters:parameters(c),result:copy(resultFor(c)),writing:copy(writing(c))};if(d.observations.some(old=>JSON.stringify(old)===JSON.stringify(o)))feedback='這份證據組合與文字已記錄。';else if(d.observations.length>=24)feedback='已保留 24 份快照，不覆寫原紀錄；請先保存或複製。';else{d.observations.push(o);feedback=`已保留第 ${d.observations.length} 份觀察。`;saveStatus='';}draw();}
  function click(event){if(disposed)return;const source=event.target.closest?.('[data-ob-source]');if(source&&root.contains(source)){captureFirst('開啟來源前');if(!d.sources.includes(source.dataset.obSource))d.sources.push(source.dataset.obSource);draw();return;}
    const button=event.target.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.dataset.obCard){const c=current(d),id=button.dataset.obCard;if(!bundle(d.bundleId).evidence.some(e=>e.id===id))return;captureFirst('改變納入證據前');const ids=c.includedEvidenceIds.includes(id)?c.includedEvidenceIds.filter(v=>v!==id):[...c.includedEvidenceIds,id];evaluateOutbreakEvidence(DATA,{bundleId:d.bundleId,includedEvidenceIds:ids});c.includedEvidenceIds=bundle(d.bundleId).evidence.filter(e=>ids.includes(e.id)).map(e=>e.id);c.focusedId=id;if(!d.seenEvidence.includes(id))d.seenEvidence.push(id);feedback='';saveStatus='';draw();return;}
    if(button.dataset.obChoice&&CHOICES[button.dataset.obChoice]){current(d).choice=button.dataset.obChoice;saveStatus='';draw();return;}
    if(button.dataset.obReplay!==undefined){const o=d.observations[Number(button.dataset.obReplay)];if(!o)return;switchBundle(o.parameters.bundleId);current(d).includedEvidenceIds=[...o.parameters.includedEvidenceIds];current(d).focusedId=o.parameters.includedEvidenceIds.at(-1)||null;feedback='已回到原證據組合；目前修訂與歷史文字分別保留。';draw();return;}
    const name=button.dataset.obAction;if(['record','record-writing'].includes(name))record();else if(name==='copy'){field('summary').focus();field('summary').select();saveStatus='已選取完整摘要，按 Ctrl+C 複製。';drawSummary();}else if(name==='save'&&typeof onSaveSummary==='function'){const plan=appendPlan();if(!plan.text)return;let saved=false,reason='';if(plan.text.length>10000)reason='本次附加內容超過筆記 10,000 字上限。';else try{saved=onSaveSummary(plan.text)===true;}catch(e){reason=e?.message||String(e);}if(saved)d.cursor=plan.next;if(disposed)return;saveStatus=saved?'已附加到本課筆記；下次只附加新觀察與修訂。':`尚未保存。${reason||'儲存端未確認成功。'} 全文和保存位置保留，請先複製備存。`;draw();}
  }
  function input(event){if(disposed)return;for(const name of ['prediction','revision','next'])if(event.target===field(name)){current(d)[name]=event.target.value;saveStatus='';drawSummary();return;}}
  function change(event){if(disposed)return;try{if(event.target===field('bundle'))switchBundle(event.target.value);else if(event.target===field('method')){if(!DATA.methods.some(m=>m.id===event.target.value))throw new RangeError('未知方法。');d.methodId=event.target.value;draw();}}catch(e){error=e.message;draw();}}
  function toggle(event){if(disposed||!event.target.open)return;if(event.target===field('details')){captureFirst('開啟逐筆證據前');d.detailsOpened=true;markAllVisible();}else if(event.target===field('methods')){captureFirst('開啟方法界線前');d.methodsOpened=true;}else if(event.target===field('summary-details'))captureFirst('開啟完整摘要前');else if(event.target===field('records-details'))captureFirst('開啟歷史觀察前');else return;draw();}
  root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('toggle',toggle,true);draw();
  return ()=>{if(disposed)return;disposed=true;root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('toggle',toggle,true);};
}
