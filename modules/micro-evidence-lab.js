import {escapeHTML as esc} from './storage.js';
import {MICRO_EVIDENCE_ID, MICRO_EVIDENCE_SOURCES, COUNT_CASES, PCR_CONTROLS, PCR_CASES, PCR_DECISIONS, CONCLUSION_CASES, representedMass, analyzeCount, assessPcr, inspectEvidence} from './micro-evidence-model.js';
export {MICRO_EVIDENCE_ID} from './micro-evidence-model.js';

const STEPS = ['count', 'controls', 'conclusion'];
const TITLES = {count:'哪些計數可以一起回算？', controls:'還需要查看哪個對照？', conclusion:'這項證據讓你改變什麼結論？'};
const fmt = value => Number.isFinite(value) ? value === 0 ? '0' : Math.abs(value) < .001 || Math.abs(value) >= 1e7 ? value.toExponential(4) : String(Number(value.toPrecision(6))) : '—';
const numeric = text => /^[+]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(String(text).trim()) && Number.isFinite(Number(text)) ? Number(text) : null;
const signal = value => value === 'present' ? '有目標訊號' : '未見目標訊號';
const controlSignal = (id,value) => id === 'internal' ? value === 'present' ? '有控制訊號' : '未見控制訊號' : signal(value);
const options = items => items.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');
let instance = 0;
const sessions = new WeakMap();
function freshSession(startStep,startConclusionCase) {
  return {step:startStep,countId:COUNT_CASES[0].id,pcrId:PCR_CASES[0].id,conclusionId:startConclusionCase,
    visited:new Set([startStep]),cases:new Set(),events:[],savedVersions:[],cursor:{started:false,eventCount:0,states:new Map()},saveMessage:'',
    countStates:new Map(COUNT_CASES.map(item=>[item.id,{selected:[],answer:'',choice:'',checked:false,checkedEver:false,reference:false,seen:false}])),
    pcrStates:new Map(PCR_CASES.map(item=>[item.id,{revealed:[],choice:'',checked:false,checkedEver:false,reference:false,seen:false,current:null}])),
    conclusionStates:new Map(CONCLUSION_CASES.map(item=>[item.id,{draft:'',initial:'',retained:false,revision:'',revealed:[],current:null,reference:false,seen:false,notice:''}]))};
}
function sessionFor(owner,key,startStep,startConclusionCase) {
  if(!owner || !['object','function'].includes(typeof owner))return freshSession(startStep,startConclusionCase);
  let boards=sessions.get(owner);if(!boards){boards=new Map();sessions.set(owner,boards);}
  if(!boards.has(key))boards.set(key,freshSession(startStep,startConclusionCase));
  return boards.get(key);
}

/** Three independent hypothetical evidence exercises. Session drafts are scoped to the host owner and lesson; explicit notes use the host save callback. */
export function mountMicroEvidenceLab(container, id = MICRO_EVIDENCE_ID, {startStep = 'count', startConclusionCase = CONCLUSION_CASES[0].id, draftOwner, draftKey = startStep, onSaveSummary, reviewHref = '#micro/review'} = {}) {
  if (!container?.querySelector || !container?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== MICRO_EVIDENCE_ID) throw new RangeError('Unknown microbiology activity');
  if (!STEPS.includes(startStep)) throw new RangeError('Unknown microbiology step');
  if (!CONCLUSION_CASES.some(item=>item.id===startConclusionCase)) throw new RangeError('Unknown microbiology conclusion case');
  const prefix = `micro-evidence-${++instance}`;
  const review = typeof reviewHref === 'string' && /^#[a-z][a-z0-9/-]*$/i.test(reviewHref) ? reviewHref : '#micro/review';
  const draft=sessionFor(draftOwner,typeof draftKey==='string'&&draftKey?draftKey:startStep,startStep,startConclusionCase);
  let {step,countId,pcrId,conclusionId,saveMessage}=draft, disposed=false;
  const {visited,countStates,pcrStates,conclusionStates}=draft;
  const caseKey=()=>`${step}/${step==='count'?countId:step==='controls'?pcrId:conclusionId}`;
  const sync=()=>Object.assign(draft,{step,countId,pcrId,conclusionId,saveMessage});
  draft.cases.add(caseKey());
  container.innerHTML = `<section class="micro-evidence-lab" aria-labelledby="${prefix}-title">
    <header class="me-header"><p class="me-kicker">原創假想紀錄 · 三步為獨立情境</p><h2 class="me-sr-only" id="${prefix}-title">方法證據工作台</h2></header>
    <nav class="me-steps" aria-label="工作台步驟">${STEPS.map((item,i) => `<button type="button" data-me-step="${item}" aria-pressed="false">${i+1} · ${['回算計數','查看對照','修訂結論'][i]}</button>`).join('')}</nav>
    <h3 class="me-heading" tabindex="-1" data-me-heading></h3>
    <section data-me-panel="count">
      <div class="me-case-bar"><label class="me-field" for="${prefix}-count-case">計數紀錄<select id="${prefix}-count-case" data-me-control="count-case">${options(COUNT_CASES)}</select></label>
      <p class="me-muted" data-me-count-description></p></div><div class="me-work-grid">
      <fieldset class="me-plates"><legend>選擇要合併的平板</legend>${COUNT_CASES.map(item => `<div data-me-plate-group="${item.id}">${item.plates.map(plate => `<label class="me-plate"><input type="checkbox" data-me-plate="${plate.id}" data-me-case="${item.id}"><span><strong>${esc(plate.label)}</strong> · ${plate.count} 個菌落${plate.eligible ? '' : ' · 增菌後紀錄'}</span><span class="me-muted">${fmt(representedMass(plate))} g 原樣等效量</span></label>`).join('')}</div>`).join('')}</fieldset>
      <div class="me-judgment"><div class="me-equation"><p>CFU/g = 菌落總數 ÷ 原樣等效量總和</p><p data-me-count-totals></p></div>
      <p class="me-feedback" data-me-count-problem role="status"></p>
      <div data-me-count-number><label class="me-field" for="${prefix}-estimate">你的回算值 · CFU/g<input id="${prefix}-estimate" type="text" inputmode="decimal" autocomplete="off" data-me-control="count-answer" aria-describedby="${prefix}-count-feedback"></label></div>
      <div data-me-count-zero><p>這些等分都未見菌落，你會怎麼報告？</p><div class="me-choices"><button type="button" data-me-zero="limited" aria-pressed="false">只表示這些等分未見菌落</button><button type="button" data-me-zero="absent" aria-pressed="false">證明整批濃度為零</button></div></div>
      <div class="me-actions"><button class="me-primary" type="button" data-me-action="count-check">核對我的判斷</button><button type="button" data-me-action="count-reference">看計算與界線</button></div>
      <p id="${prefix}-count-feedback" class="me-feedback" data-me-count-feedback role="status"></p>
      <div class="me-result" data-me-count-result hidden></div></div></div>
      <details><summary>原樣等效量、假設與適用範圍</summary><p>每片原樣等效量 = 均質液原樣濃度 × 後續稀釋比例 × 所取體積。</p><p data-me-count-scope></p><div class="me-table-wrap"><table><caption>題設的換算資料</caption><thead><tr><th>平板</th><th>均質液 g/mL</th><th>後續稀釋比例</th><th>體積 mL</th></tr></thead><tbody data-me-count-table></tbody></table></div><p>一菌落換算尺度為 1 / Σm，並非方法的 LOD。零菌落時，Poisson 單側 95% 上界 = −ln(0.05) / Σm；只在獨立等分、完整回收、無聚集與方法失敗的題設下成立，不判定食品安全。</p></details>
    </section>
    <section data-me-panel="controls" hidden>
      <div class="me-case-bar"><label class="me-field" for="${prefix}-pcr-case">PCR 紀錄<select id="${prefix}-pcr-case" data-me-control="pcr-case">${PCR_CASES.map(item => `<option value="${item.id}">案例 ${item.id}</option>`).join('')}</select></label>
      <div><p class="me-equation" data-me-pcr-target></p><p class="me-muted" data-me-pcr-progress></p></div></div><p class="me-muted" data-me-pcr-premise>此處「目標訊號」按題設已符合該方法的特異性判準；本次對照及方法專屬判讀規則仍須另核。</p><div class="me-work-grid">
      <div class="me-controls">${PCR_CONTROLS.map(item => `<button type="button" data-me-control-reveal="${item.id}" aria-pressed="false"><span>${esc(item.label)}</span><strong data-me-control-result="${item.id}">尚未查看</strong></button>`).join('')}</div>
      <div class="me-judgment">
      <label class="me-field" for="${prefix}-pcr-choice">你目前會怎麼解讀？<select id="${prefix}-pcr-choice" data-me-control="pcr-choice"><option value="">先選一個判斷</option>${options(PCR_DECISIONS)}</select></label>
      <div class="me-actions"><button class="me-primary" type="button" data-me-action="pcr-check">核對我的判斷</button><button type="button" data-me-action="pcr-reference">對照判讀範圍</button></div>
      <p class="me-feedback" data-me-pcr-feedback role="status"></p><p class="me-muted">已見對照問題即可暫停報告；接受樣品判讀前需查看完整對照。未查看不等於沒有訊號。</p></div></div>
      <details><summary>每個對照查得到什麼？</summary>${PCR_CONTROLS.map(item => `<p><strong>${esc(item.label)}</strong><br>${esc(item.purpose)}</p>`).join('')}<p>本輪只讀核酸訊號，不提供培養、擴增或取樣排程。</p></details>

    </section>
    <section data-me-panel="conclusion" hidden>
      <div class="me-case-bar"><label class="me-field" for="${prefix}-conclusion-case">證據事件<select id="${prefix}-conclusion-case" data-me-control="conclusion-case">${options(CONCLUSION_CASES)}</select></label>
      <p class="me-equation" data-me-initial-evidence></p></div>
      <div class="me-work-grid"><div>
      <h4 class="me-subheading" tabindex="-1" data-me-evidence-heading>下一項，你想查看什麼？</h4>
      <div class="me-evidence-options">${CONCLUSION_CASES.map(item => `<div data-me-evidence-group="${item.id}">${item.evidence.map(e => `<button type="button" data-me-evidence="${e.id}" data-me-case="${item.id}" aria-pressed="false"><span>${esc(e.label)}</span><span class="me-muted" data-me-evidence-status="${item.id}-${e.id}"></span></button>`).join('')}</div>`).join('')}</div>
      </div><div class="me-judgment">
      <div data-me-initial-editor><label class="me-field" for="${prefix}-draft">先留下你的初步結論<textarea id="${prefix}-draft" rows="3" data-me-control="draft" placeholder="目前支持什麼？還不能確定什麼？"></textarea></label><button type="button" data-me-action="retain">保留初稿</button></div>
      <details data-me-initial-archive hidden><summary>查看已保留的初稿</summary><p class="me-own-text" data-me-original></p></details>
      <p class="me-finding" data-me-finding hidden></p><details data-me-evidence-history hidden><summary data-me-history-title></summary><ol data-me-history></ol></details>
      <label class="me-field" for="${prefix}-revision">你的修訂<textarea id="${prefix}-revision" rows="3" data-me-control="revision" placeholder="新證據改變了哪一部分？哪些未知仍保留？"></textarea></label>
      <button type="button" data-me-action="conclusion-reference">對照可支持範圍</button><p class="me-feedback" data-me-conclusion-notice role="status"></p>
      <div class="me-result" data-me-conclusion-result hidden><p data-me-supported></p><p class="me-muted" data-me-not-established></p><p class="me-muted">這是證據範圍的參考，不替你的短答自動評分。</p></div></div></div>
    </section>
    <nav class="me-bottom-nav" aria-label="切換練習"><button type="button" data-me-action="previous">上一步</button><button type="button" data-me-action="next">下一步</button></nav>
    <details class="me-summary"><summary>操作紀錄與筆記</summary>
      <p class="me-muted">返回本課會保留這次開頁的草稿。重新整理或關閉前，請存入本課筆記；操作草稿不會隨筆記匯出。</p>
      <p data-me-pending-status role="status"></p>
      <label class="me-field" for="${prefix}-append">這次會追加的內容<textarea id="${prefix}-append" rows="7" readonly data-me-append></textarea></label>
      <div class="me-actions"><button type="button" data-me-action="select-append">選取待存文字</button>${typeof onSaveSummary === 'function' ? '<button class="me-primary" type="button" data-me-action="save">存到本課筆記</button>' : ''}</div><p class="me-feedback" data-me-save-status role="status"></p>
      <details><summary>全部案例、作答時序與已存版本</summary><label class="me-field" for="${prefix}-summary">本次開頁的完整紀錄<textarea id="${prefix}-summary" rows="10" readonly data-me-summary></textarea></label><button type="button" data-me-action="select-summary">選取摘要文字</button></details>
      <a href="${esc(review)}">到我的複習查看筆記</a>
    </details>
    <details><summary>方法來源與本活動界線</summary><p>數字與事件均為原創假想紀錄。來源支持方法概念，不是這些紀錄的實測來源；活動不提供真實菌株培養條件或食品安全放行判斷。</p><ul>${MICRO_EVIDENCE_SOURCES.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul></details>
  </section>`;
  const $ = selector => container.querySelector(selector), $$ = selector => container.querySelectorAll(selector);
  const control = name => $(`[data-me-control="${name}"]`), action = name => $(`[data-me-action="${name}"]`);
  const setText = (selector,value) => { $(selector).textContent = value; };
  const resetJudgment = state => { state.checked = false; state.reference = false; };
  const changed = () => { saveMessage = ''; };
  const ownCountCorrect = (state,result) => {
    const answer = numeric(state.answer), expected = result.estimateCFUg;
    return answer !== null && Math.abs(answer-expected) <= Math.max(Math.abs(expected)*.001,Number.EPSILON*Math.abs(expected)*8);
  };
  const countSummary = (id=countId) => {
    if (!visited.has('count')) return '計數：尚未操作。';
    const state = countStates.get(id), item = COUNT_CASES.find(x=>x.id===id), view = analyzeCount(id,state.selected), result = view.result;
    return [`計數｜${item.label}；選盤：${state.selected.join('、') || '尚未選擇'}`, `題設範圍：${item.scope}`,
      ...state.selected.map(key=>{const p=item.plates.find(x=>x.id===key);return `${p.label}：${p.count} 個菌落；${fmt(representedMass(p))} g 原樣等效量${p.eligible?'':'；增菌後紀錄，不可合併'}。`;}),
      result ? `菌落總數 ${result.totalCount}；原樣等效量 ${fmt(result.totalMassG)} g。` : view.problems.join(' ') || '尚無回算資料。',
      view.status === 'zero' ? `自己的判斷：${state.choice === 'limited' ? '只表示這些等分未見菌落' : state.choice === 'absent' ? '證明整批濃度為零' : '未作答'}；${state.checked ? '已核對' : '未核對'}。` : `自己填入：${state.answer || '未作答'}${state.answer ? ' CFU/g' : ''}；${state.checked ? '已核對' : '未核對'}。`,
      state.checked || state.reference ? view.status === 'counted' ? `題設回算參考：${fmt(result.estimateCFUg)} CFU/g。` : view.status === 'zero' ? `已查看：未見菌落；一菌落換算尺度 ${fmt(result.oneColonyEquivalentCFUg)} CFU/g；Poisson 單側 95% 上界 ${fmt(result.zeroUpper95CFUg)} CFU/g（理想計數假設，非 LOD 或安全界線）。` : '' : '',
      `參考狀態：${state.reference ? '目前已展開' : '目前未展開'}；${state.seen ? '曾看參考（主動展開）' : '未主動展開參考'}；${state.checkedEver ? '曾核對並獲提示' : '未曾核對'}。`].filter(Boolean).join('\n');
  };
  const pcrSummary = (id=pcrId) => {
    if (!visited.has('controls')) return 'PCR：尚未操作。';
    const state = pcrStates.get(id), item = PCR_CASES.find(x=>x.id===id), view = assessPcr(id,state.revealed);
    return [`PCR｜案例 ${id}；樣品${signal(item.target)}。`,
      `已查對照（查看順序）：${state.revealed.map(key => {const c=view.visible.find(x=>x.id===key);return `${c.label}：${controlSignal(c.id,c.result)}`;}).join('；') || '尚未查看'}。`,
      `未查：${view.missing.map(key=>PCR_CONTROLS.find(x=>x.id===key).label).join('、') || '無'}。`,
      `自己的判斷：${PCR_DECISIONS.find(x=>x.id===state.choice)?.label || '未作答'}；${state.checked ? '已核對' : '未核對'}。`,
      state.checked || state.reference ? `已查看判讀參考：${view.reason}` : '',
      `參考狀態：${state.reference ? '目前已展開' : '目前未展開'}；${state.seen ? '曾看參考（主動展開）' : '未主動展開參考'}；${state.checkedEver ? '曾核對並獲提示' : '未曾核對'}。`].filter(Boolean).join('\n');
  };
  const conclusionSummary = (id=conclusionId) => {
    if (!visited.has('conclusion')) return '結論：尚未操作。';
    const state = conclusionStates.get(id), item = CONCLUSION_CASES.find(x=>x.id===id), view = inspectEvidence(id,state.revealed);
    return [`結論｜${item.label}`,`起始紀錄：${item.initial}`,`自己的初稿（${state.retained ? '已保留' : '尚未按保留'}）：${state.retained ? state.initial : state.draft || '未作答'}`,
      `追加證據（查看順序）：${state.revealed.map((key,i)=>`${i+1}. ${item.evidence.find(x=>x.id===key).finding}`).join('\n') || '尚未追加'}`,
      `自己的修訂：${state.revision || '未作答'}`,state.reference ? `目前參考：${view.supported}\n${view.notEstablished}` : '',
      `參考狀態：${state.reference ? '目前已展開' : '目前未展開'}；${state.seen ? '曾看參考（主動展開）' : '未主動展開參考'}；${state.checkedEver ? '曾核對並獲提示' : '未曾核對'}。短答未自動評分。`].filter(Boolean).join('\n');
  };
  const intro='微生物方法證據｜原創假想紀錄\n三步是獨立情境，不是同一份樣品。\nPCR 部分題設：此處「目標訊號」按題設已符合該方法的特異性判準；本次對照及方法專屬判讀規則仍須另核。';
  const boundary='操作、核對與查看參考不代表已掌握；沒有建立整批安全或真實檢驗結論。';
  const sources=`概念來源（不是假想紀錄的實測來源）：\n${MICRO_EVIDENCE_SOURCES.map(x=>`${x.title}：${x.url}`).join('\n')}`;
  function caseText(key) {
    const [kind,id]=key.split('/');return kind==='count'?countSummary(id):kind==='controls'?pcrSummary(id):conclusionSummary(id);
  }
  function ownBefore() {
    if(step==='count') {const s=countStates.get(countId);return `選盤：${s.selected.join('、')||'未選'}；自己填入：${s.answer||'未作答'}；零菌落判斷：${s.choice==='limited'?'只表示這些等分未見菌落':s.choice==='absent'?'證明整批濃度為零':'未作答'}；${s.checkedEver?'曾核對並獲提示':'未曾核對'}；${s.seen?'曾主動展開參考':'未主動展開參考'}`;}
    if(step==='controls') {const s=pcrStates.get(pcrId);return `自己的判斷：${PCR_DECISIONS.find(x=>x.id===s.choice)?.label||'未作答'}；已查對照：${s.revealed.join('、')||'無'}；${s.checkedEver?'曾核對並獲提示':'未曾核對'}；${s.seen?'曾主動展開參考':'未主動展開參考'}`;}
    const s=conclusionStates.get(conclusionId);return `自己的初稿（${s.retained?'已保留':'尚未按保留'}）：${s.retained?s.initial:s.draft||'未作答'}\n自己的修訂：${s.revision||'未作答'}；已查證據：${s.revealed.join('、')||'無'}；${s.seen?'曾主動展開參考':'未主動展開參考'}`;
  }
  function recordEvent(kind,result='') {
    const text=`${caseKey()}｜${kind}\n操作前作答與已見範圍：${ownBefore()}${result?'\n本次揭露：'+result:''}`;
    // A repeated save attempt or reread must not manufacture another revision.
    const prior=draft.events.filter(e=>e.key===caseKey()).at(-1);
    if(prior?.text===text)return;
    draft.events.push({key:caseKey(),text});
  }
  const eventText=(events,offset=0)=>events.map((e,i)=>`事件 ${offset+i+1}｜${e.text}`).join('\n\n');
  function appendPlan() {
    const entries=[...draft.cases].map(key=>[key,caseText(key)]).filter(([key,text])=>draft.cursor.states.get(key)!==text);
    const events=draft.events.slice(draft.cursor.eventCount);
    if(!entries.length&&!events.length)return {text:'',entries,eventCount:draft.events.length};
    const text=[draft.cursor.started?'微生物方法證據｜追加紀錄':intro,
      events.length?'作答與證據時序\n'+eventText(events,draft.cursor.eventCount):'',
      entries.length?'本次新增或變更的案例\n'+entries.map(([,text])=>text).join('\n\n'):'',
      ...draft.cursor.started?[]:[boundary,sources]].filter(Boolean).join('\n\n');
    return {text,entries,eventCount:draft.events.length};
  }
  function summary() {
    const current=[...draft.cases].map(caseText);
    for(const kind of STEPS)if(!visited.has(kind))current.push(kind==='count'?'計數：尚未操作。':kind==='controls'?'PCR：尚未操作。':'結論：尚未操作。');
    return [intro,'所有已開啟案例的目前紀錄',...current,
      draft.events.length?'作答與證據時序\n'+eventText(draft.events):'',
      draft.savedVersions.length?'已存筆記的案例版本（後續清空不會覆寫舊版）\n'+draft.savedVersions.map((v,i)=>`保存 ${i+1}\n${v.text}`).join('\n\n'):'',
      boundary,sources].filter(Boolean).join('\n\n');
  }
  function renderCount() {
    const state=countStates.get(countId), item=COUNT_CASES.find(x=>x.id===countId), view=analyzeCount(countId,state.selected), r=view.result, shown=Boolean(r&&(state.checked||state.reference));
    control('count-case').value=countId;control('count-answer').value=state.answer;
    for(const group of $$('[data-me-plate-group]')) group.hidden=group.dataset.mePlateGroup!==countId;
    for(const node of $$('[data-me-plate]')) node.checked=node.dataset.meCase===countId&&state.selected.includes(node.dataset.mePlate);
    setText('[data-me-count-description]',item.description);setText('[data-me-count-scope]',item.scope);
    setText('[data-me-count-totals]',r?`${r.totalCount} 個菌落 ÷ ${fmt(r.totalMassG)} g 原樣等效量`:view.status==='choose'?'先選擇平板。':'目前選盤不可合併。');
    setText('[data-me-count-problem]',view.problems.join(' '));
    $('[data-me-count-number]').hidden=view.status==='zero';control('count-answer').disabled=view.status!=='counted';
    control('count-answer').setAttribute('aria-invalid',String(Boolean(state.answer)&&numeric(state.answer)===null));
    $('[data-me-count-zero]').hidden=view.status!=='zero';
    for(const node of $$('[data-me-zero]')) node.setAttribute('aria-pressed',String(node.dataset.meZero===state.choice));
    action('count-check').disabled=!r||(view.status==='zero'?!state.choice:numeric(state.answer)===null);action('count-reference').disabled=!r;
    let feedback=state.answer&&numeric(state.answer)===null&&view.status==='counted'?'請輸入有限的非負十進位或科學記號數字，例如 12000。':'';
    if(state.checked) {const correct=view.status==='zero'?state.choice==='limited':ownCountCorrect(state,r);feedback=`${correct?'與這份記錄相符。':'需要調整。'} ${view.status==='zero'?'未見菌落只描述受檢等分；不能把整批濃度報為零。':'將可合併的菌落相加，再除以合計原樣等效量；不要直接平均各盤 CFU/g。'}`;}
    else if(state.reference) feedback='參考已展開；不代表你已自行完成判讀。';
    setText('[data-me-count-feedback]',feedback);$('[data-me-count-result]').hidden=!shown;
    $('[data-me-count-result]').innerHTML=!shown?'':view.status==='zero'?`<strong>受檢等分未見菌落</strong><p>一菌落換算尺度：${fmt(r.oneColonyEquivalentCFUg)} CFU/g</p><details><summary>理想 Poisson 計數的上界</summary><p>單側 95% 上界：${fmt(r.zeroUpper95CFUg)} CFU/g。</p><p>−ln(0.05) ÷ ${fmt(r.totalMassG)} g；只適用本題的獨立等分、完整回收假設。不是 LOD 或安全判定。</p></details>`:`<strong>${fmt(r.estimateCFUg)} CFU/g</strong><p>${r.totalCount} ÷ ${fmt(r.totalMassG)}；僅代表題設方法可回收、形成菌落的單位。</p>`;
    $('[data-me-count-table]').innerHTML=item.plates.map(p=>`<tr><th>${esc(p.label)}</th><td>${fmt(p.homogenateEquivalentGmL)}</td><td>${fmt(p.furtherDilution)}</td><td>${fmt(p.volumeML)}</td></tr>`).join('');
  }
  function renderPcr() {
    const state=pcrStates.get(pcrId), item=PCR_CASES.find(x=>x.id===pcrId), view=assessPcr(pcrId,state.revealed);
    control('pcr-case').value=pcrId;control('pcr-choice').value=state.choice;
    setText('[data-me-pcr-target]',`樣品紀錄：${signal(item.target)}`);setText('[data-me-pcr-progress]',`已查看 ${state.revealed.length} / 4 項對照`);
    for(const node of $$('[data-me-control-reveal]')) node.setAttribute('aria-pressed',String(state.revealed.includes(node.dataset.meControlReveal)));
    for(const node of $$('[data-me-control-result]')) {const e=view.visible.find(x=>x.id===node.dataset.meControlResult);node.textContent=e?controlSignal(e.id,e.result):'尚未查看';}
    action('pcr-check').disabled=view.status!=='ready'||!state.choice;action('pcr-reference').disabled=view.status!=='ready';
    const text=state.checked?`${state.choice===view.decision?'與這組證據相符。':'需要調整。'} ${view.reason}`:state.reference?`判讀參考：${view.reason}`:'';
    setText('[data-me-pcr-feedback]',text);
  }
  function renderConclusion() {
    const state=conclusionStates.get(conclusionId), item=CONCLUSION_CASES.find(x=>x.id===conclusionId), view=inspectEvidence(conclusionId,state.revealed);
    control('conclusion-case').value=conclusionId;control('draft').value=state.draft;control('revision').value=state.revision;control('draft').readOnly=state.retained;
    setText('[data-me-initial-evidence]',item.initial);$('[data-me-initial-editor]').hidden=state.retained;$('[data-me-initial-archive]').hidden=!state.retained;setText('[data-me-original]',state.initial);
    action('retain').disabled=!state.draft.trim();
    for(const group of $$('[data-me-evidence-group]')) group.hidden=group.dataset.meEvidenceGroup!==conclusionId;
    for(const node of $$('[data-me-evidence]')) {
      const current=node.dataset.meCase===conclusionId, e=current?view.available.find(x=>x.id===node.dataset.meEvidence):null;
      node.disabled=!e||e.locked;node.setAttribute('aria-pressed',String(Boolean(e?.revealed)));
      $(`[data-me-evidence-status="${node.dataset.meCase}-${node.dataset.meEvidence}"]`).textContent=e?.locked?'先查看前項紀錄':e?.revealed?'已查看，可重讀':'';
    }
    const finding=view.visible.find(x=>x.id===state.current);$('[data-me-finding]').hidden=!finding;setText('[data-me-finding]',finding?.finding||'');
    $('[data-me-evidence-history]').hidden=!state.revealed.length;setText('[data-me-history-title]',`已查過的證據（${state.revealed.length}）`);
    $('[data-me-history]').innerHTML=state.revealed.map(key=>`<li>${esc(item.evidence.find(x=>x.id===key).finding)}</li>`).join('');
    setText('[data-me-conclusion-notice]',state.notice);$('[data-me-conclusion-result]').hidden=!state.reference;
    // Unrevealed findings and reference interpretations are never inserted into hidden DOM.
    setText('[data-me-supported]',state.reference?view.supported:'');setText('[data-me-not-established]',state.reference?view.notEstablished:'');
  }
  function render() {
    sync();if(disposed)return;
    setText('[data-me-heading]',TITLES[step]);
    for(const node of $$('[data-me-step]'))node.setAttribute('aria-pressed',String(node.dataset.meStep===step));
    for(const node of $$('[data-me-panel]'))node.hidden=node.dataset.mePanel!==step;
    renderCount();renderPcr();renderConclusion();
    action('previous').disabled=step===STEPS[0];action('next').disabled=step===STEPS.at(-1);
    $('[data-me-summary]').value=summary();setText('[data-me-save-status]',saveMessage);
    const pending=appendPlan();$('[data-me-append]').value=pending.text;
    setText('[data-me-pending-status]',pending.text?'有新紀錄可存入筆記。':'目前紀錄已存入筆記。');
    if(action('save'))action('save').disabled=!pending.text;
  }
  function move(next) {
    if(!STEPS.includes(next)||next===step)return;
    step=next;visited.add(step);draft.cases.add(caseKey());changed();render();$('[data-me-heading]').focus({preventScroll:true});$('[data-me-heading]').scrollIntoView?.({block:'nearest',behavior:'instant'});
  }
  function onChange(event) {
    if(disposed)return;
    const target=event.target;
    if(!container.contains(target))return;
    if(target.matches?.('[data-me-plate]')) {
      if(step!=='count'||target.dataset.meCase!==countId)return;
      const state=countStates.get(countId), plateId=target.dataset.mePlate, item=COUNT_CASES.find(x=>x.id===countId);
      if(!item.plates.some(x=>x.id===plateId))return;
      state.selected=target.checked?[...new Set([...state.selected,plateId])]:state.selected.filter(x=>x!==plateId);resetJudgment(state);changed();render();return;
    }
    const key=target.dataset?.meControl, value=target.value;
    if(key==='count-case'&&step==='count'&&countStates.has(value))countId=value;
    else if(key==='pcr-case'&&step==='controls'&&pcrStates.has(value))pcrId=value;
    else if(key==='conclusion-case'&&step==='conclusion'&&conclusionStates.has(value))conclusionId=value;
    else if(key==='pcr-choice'&&step==='controls'&&(!value||PCR_DECISIONS.some(x=>x.id===value))) {const state=pcrStates.get(pcrId);state.choice=value;resetJudgment(state);}
    else return;
    draft.cases.add(caseKey());changed();render();
  }
  function onInput(event) {
    if(disposed||!container.contains(event.target))return;
    const key=event.target.dataset?.meControl, value=event.target.value;
    if(key==='count-answer'&&step==='count'&&analyzeCount(countId,countStates.get(countId).selected).status==='counted') {const state=countStates.get(countId);state.answer=value;resetJudgment(state);}
    else if((key==='draft'||key==='revision')&&step==='conclusion') {
      const state=conclusionStates.get(conclusionId);if(key==='draft'&&state.retained)return;
      state[key]=value;state.reference=false;state.notice='';
    } else return;
    changed();render();
  }
  function onClick(event) {
    if(disposed)return;
    const target=event.target?.closest?.('button');if(!target||!container.contains(target)||target.disabled)return;
    if(target.dataset.meStep){move(target.dataset.meStep);return;}
    if(target.dataset.meZero&&step==='count') {const state=countStates.get(countId);if(analyzeCount(countId,state.selected).status!=='zero')return;state.choice=target.dataset.meZero;resetJudgment(state);}
    else if(target.dataset.meControlReveal&&step==='controls') {const key=target.dataset.meControlReveal;if(!PCR_CONTROLS.some(x=>x.id===key))return;const state=pcrStates.get(pcrId);if(!state.revealed.includes(key)){const shown=assessPcr(pcrId,[...state.revealed,key]).visible.find(x=>x.id===key);recordEvent('查看對照',`${shown.label}：${controlSignal(shown.id,shown.result)}`);state.revealed.push(key);resetJudgment(state);}state.current=key;}
    else if(target.dataset.meEvidence&&step==='conclusion') {
      if(target.dataset.meCase!==conclusionId)return;const state=conclusionStates.get(conclusionId), key=target.dataset.meEvidence, e=inspectEvidence(conclusionId,state.revealed).available.find(x=>x.id===key);
      if(!e||e.locked)return;
      if(!state.revealed.includes(key)){const finding=inspectEvidence(conclusionId,[...state.revealed,key]).visible.find(x=>x.id===key).finding;recordEvent('追加證據',finding);state.revealed.push(key);state.reference=false;state.notice='新證據已加入；請重新檢視你的修訂。';}state.current=key;
    } else {
      const name=target.dataset.meAction;
      if(name==='previous'||name==='next'){move(STEPS[STEPS.indexOf(step)+(name==='next'?1:-1)]);return;}
      if(name==='select-append'){$('[data-me-append]').focus();$('[data-me-append]').select();return;}
      if(name==='select-summary'){$('[data-me-summary]').focus();$('[data-me-summary]').select();return;}
      if(name==='save'&&typeof onSaveSummary==='function') {
        const plan=appendPlan();if(!plan.text)return;
        try {if(onSaveSummary(plan.text)===true){
          draft.cursor.started=true;draft.cursor.eventCount=plan.eventCount;
          for(const [key,text] of plan.entries){draft.cursor.states.set(key,text);draft.savedVersions.push({key,text});}
          saveMessage='已追加到本課筆記，可到我的複習查看。';
        }else saveMessage='尚未保存；你仍可選取並複製摘要文字。';}
        catch {saveMessage='尚未保存；筆記目前無法寫入，你仍可選取並複製摘要文字。';}
        render();return;
      }
      if((name==='count-check'||name==='count-reference')&&step==='count') {
        const state=countStates.get(countId),view=analyzeCount(countId,state.selected);if(!view.result)return;
        if(name==='count-check'&&(view.status==='counted'&&numeric(state.answer)===null||view.status==='zero'&&!state.choice))return;
        if(name==='count-check'?state.checked:state.reference)return;
        const r=view.result, result=view.status==='counted'?`題設回算參考：${fmt(r.estimateCFUg)} CFU/g。`:`受檢等分未見菌落；一菌落換算尺度 ${fmt(r.oneColonyEquivalentCFUg)} CFU/g；Poisson 單側 95% 上界 ${fmt(r.zeroUpper95CFUg)} CFU/g（理想計數假設，非 LOD 或安全界線）。`;
        recordEvent(name==='count-check'?'核對並獲提示':'主動展開參考',result);
        if(name==='count-check'){state.checked=true;state.checkedEver=true;}else{state.reference=true;state.seen=true;}
      }
      else if((name==='pcr-check'||name==='pcr-reference')&&step==='controls') {
        const state=pcrStates.get(pcrId),view=assessPcr(pcrId,state.revealed);if(view.status!=='ready'||name==='pcr-check'&&!state.choice)return;
        if(name==='pcr-check'?state.checked:state.reference)return;
        recordEvent(name==='pcr-check'?'核對並獲提示':'主動展開參考',view.reason);
        if(name==='pcr-check'){state.checked=true;state.checkedEver=true;}else{state.reference=true;state.seen=true;}
      }
      else if(name==='retain'&&step==='conclusion') {const state=conclusionStates.get(conclusionId);if(state.retained||!state.draft.trim())return;recordEvent('保留初稿');state.initial=state.draft;state.retained=true;state.notice='初稿已保留；可以追加證據並寫下修訂。';changed();render();$('[data-me-evidence-heading]').focus({preventScroll:true});$('[data-me-evidence-heading]').scrollIntoView?.({block:'nearest',behavior:'instant'});return;}
      else if(name==='conclusion-reference'&&step==='conclusion') {const state=conclusionStates.get(conclusionId);if(state.reference)return;const view=inspectEvidence(conclusionId,state.revealed);recordEvent('主動展開參考',`${view.supported} ${view.notEstablished}`);state.reference=true;state.seen=true;state.notice='已展開目前證據的參考；請自行對照你的文字。';}
      else return;
    }
    changed();render();
  }
  container.addEventListener('change',onChange);container.addEventListener('input',onInput);container.addEventListener('click',onClick);render();
  return () => {if(disposed)return;sync();disposed=true;container.removeEventListener('change',onChange);container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);};
}
