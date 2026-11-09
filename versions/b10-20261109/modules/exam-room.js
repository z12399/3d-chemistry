import {escapeHTML} from './storage.js';
import {summarizeExam, questionStatus, nextQuestion,EXAM_MAX_IMPORT_BYTES} from './exam-engine.js';
import {examRemedyHref} from './exam-learning-bridge.js';
import {renderPreparationHome} from './exam-progress.js';
import {renderExamTabs} from './exam-navigation.js';
export {renderExamTabs} from './exam-navigation.js';

const esc = value => escapeHTML(String(value ?? ''));
const SUBJECTS = {chemistry:'食品化學', processing:'食品加工學', microbiology:'食品微生物學'};
const STATUS = {untested:'還沒做', 'needs-work':'需要補強', 'awaiting-variant':'再換一題確認', verified:'換題也答對'};
const percent = (value, total) => total ? Math.max(0, Math.min(100, Math.round(value / total * 100))) : 0;
const sourceLabel = question => question.sourceKind === 'official-adapted' ? '改編自歷屆考題' : '自編練習題';
const dateLabel = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('zh-TW', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '';
const sourceLink = (url, title) => /^https:\/\//.test(String(url || '')) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a>` : esc(title);
const questionHref = (id,attemptId) => '#exam?question=' + encodeURIComponent(id)+(attemptId?'&attempt='+encodeURIComponent(attemptId):'');
const badge = (label, kind='') => `<span class="exam-badge${kind ? ' exam-badge-'+kind : ''}">${esc(label)}</span>`;
const questionById = (bank, id) => bank.questions.find(question => question.id === id);
const compatibleAttempts = (state, question) => (state.attempts || []).filter(attempt => attempt.questionId === question.id && attempt.questionVersion === question.version);
const latestAttempt = (state, question) => questionStatus({questions:[question]},state,question.id).latest;
const responseLabel = (question, response) => question.type === 'choice' ? question.options.find(option => option.id === response)?.text || response || '尚未選擇' : response ? `${response}${question.answer.unit ? ' '+question.answer.unit : ''}` : '尚未填寫';
const referenceLabel = question => question.examRef ? `臺大 ${question.examRef.year} · ${question.examRef.question}` : '';
const scopeLabel = value => value === 'partial-skill' ? '只考原題的一部分。' : value || '';
const submittedResponses = attempt => {
  const entries=[{at:attempt.submittedAt,response:attempt.response},...(attempt.conflictingResponses||[])];
  return entries.filter((entry,index)=>entry.at&&entries.findIndex(other=>other.at===entry.at&&other.response===entry.response)===index);
};
const scratchByStore=new WeakMap(),unloadOwners=new WeakSet();
function scratchFor(store){if(!scratchByStore.has(store))scratchByStore.set(store,{responses:new Map(),recoveryTargets:new Map()});return scratchByStore.get(store);}
function prepareRoomLeave(store){
  const scratch=scratchFor(store);let flushed=true,result,error='';
  try{flushed=scratch.flush?.()!==false;}catch(cause){flushed=false;error=cause.message||'這份草稿尚未保存。';}
  try{result=store.retryPersistence();}catch(cause){result={ok:false,persisted:false};error=cause.message||'這份紀錄尚未保存。';}
  for(const [questionId,pending] of scratch.responses){if(pending.dirty)return {ok:false,href:questionHref(questionId,pending.attemptId),error:'這題仍有未保存的答案。請重試保存；若原作答已在其他分頁交出，可將未存答案另存複習草稿。'};}
  if(!flushed||result?.ok===false||store.volatile?.size){
    const event=[...(store.volatile?.values?.()||[])][0],attempt=store.state.attempts.find(item=>item.id===event?.attemptId);
    const written=attempt&&store.bank?.questions?.some(item=>item.id===attempt.questionId&&item.type==='text');
    return {ok:false,href:attempt?written?'#exam/written?question='+encodeURIComponent(attempt.questionId)+'&attempt='+encodeURIComponent(attempt.id):questionHref(attempt.questionId,attempt.id):'#exam',error:error||result?.error||store.error||'作答仍只保留在本頁，請先重試保存或下載備份。'};
  }
  return true;
}
function guardUnsavedRoomWork(store){
  if(typeof window==='undefined'||unloadOwners.has(store))return;
  window.addEventListener('beforeunload',event=>{
    const scratch=scratchFor(store);scratch.flush?.();
    if([...scratch.responses.values()].some(value=>value.dirty)||store.volatile?.size){event.preventDefault();event.returnValue='';}
  });unloadOwners.add(store);
}

export function renderExamHomeSummary(bank, state, {writtenBank,papers=[],warnings=[]}={}) {
  if (!bank?.questions?.length || !bank?.domains?.length) return '';
  if(writtenBank?.questions?.length)return renderPreparationHome(bank,writtenBank,state,{papers,warnings});
  const summary = summarizeExam(bank, state);
  return `<section class="exam-home-summary" aria-labelledby="exam-home-title">
    <p class="exam-eyebrow">EXAM READINESS</p><h2 id="exam-home-title">我的進度</h2>
    <p class="exam-muted">${summary.tested ? '用作答結果找下一個要補的主題。' : '先試幾道題，看看哪些已經會、哪些值得先補。'}</p>
    <div class="exam-home-stats"><div><strong>${summary.tested} / ${summary.total}</strong><span>做過的主題</span></div><div><strong>${summary.independentCorrect} / ${summary.total}</strong><span>第一次就答對</span></div><div><strong>${summary.verified} / ${summary.total}</strong><span>換題也答對</span></div></div>
    <div class="exam-actions"><a class="exam-button exam-button-primary" href="#exam">${summary.tested ? '查看進度與下一題' : '開始快速測驗'} →</a><a class="exam-button" href="#exam/written">寫一題考題 →</a></div>
    <p class="exam-muted" style="font-size:.8125rem;margin:12px 0 0">共 ${bank.questions.length} 題、${summary.total} 個主題；沒測到的範圍不算。</p>
  </section>`;
}

/** The app owns routing. This room owns only its rendered DOM and event handlers. */
export function mountExamRoom(container, {bank, store, onNavigate, initialQuestionId,initialAttemptId} = {}) {
  if (!container || !bank?.questions || !bank?.domains || !store) throw new TypeError('備考頁需要題庫與作答紀錄。');
  let disposed = false, subject = 'all', message = '', messageError = false, activeQuestionId = null, activeAttemptId = null, transientResponse = null;
  let importEpoch = 0;
  let draftTimer = null, pendingNumericDraft = false,renderedDraft=false;
  const originalClass = container.className;
  const scratch=scratchFor(store);
  const current = () => !disposed && container.isConnected !== false;
  const $ = selector => container.querySelector(selector);
  const $$ = selector => [...container.querySelectorAll(selector)];
  const state = () => store.state;
  const activeQuestion = () => questionById(bank, activeQuestionId);
  const activeAttempt = () => state().attempts.find(attempt => attempt.id === activeAttemptId) || null;
  const pendingResponse=()=>scratch.responses.get(activeQuestionId);
  function selectAttempt(id){
    const question=activeQuestion(),local=pendingResponse(),matches=item=>item.questionId===question?.id&&item.questionVersion===question?.version;
    const retained=local?.dirty&&state().attempts.find(item=>item.id===local.attemptId&&matches(item)),selected=id&&state().attempts.find(item=>item.id===id&&matches(item));
    if(id&&!selected){message='找不到這份作答，或它不屬於目前題目版本；已開啟最近的作答。';messageError=true;}
    if(local?.dirty&&!local.attemptId)return null;
    return retained?.id||selected?.id||(question?latestAttempt(state(),question)?.id:null)||null;
  }
  const focusedHeading = () => {const heading = $('h1'); if (heading) {heading.tabIndex = -1; heading.focus({preventScroll:true});}};
  const setMessage = (text, error=false) => {
    message = text || ''; messageError = error;
    const target = $('[data-exam-status]');
    if (target) {target.textContent = message || store.error || ''; target.dataset.error = String(error || !!store.error);}
  };
  const resultOK = (result, success) => {
    if (result?.ok === false || result === false) {setMessage(result?.error || store.error || '這次變更尚未保存。請先保留作答或匯出紀錄。', true); return false;}
    if (result?.persisted === false) {setMessage(result.error || store.error || '作答暫存在本頁，尚未寫入瀏覽器。請匯出作答紀錄保留。', true);return true;}
    if (success) setMessage(success);
    return true;
  };
  const run = (action, success) => {
    if(!current())return null;
    try {const result = action(); return resultOK(result, success) ? result ?? {ok:true} : null;}
    catch (error) {setMessage(error.message || '這次操作未完成。', true); return null;}
  };
  const preserveCurrentDraft = () => {
    if (!activeQuestionId || !$('[data-exam-form]')) return true;
    if(activeAttempt()?.submittedAt){
      captureClosedResponse();
      if(pendingResponse()?.dirty){setMessage('原作答已在其他分頁交出；本頁未存答案仍保留，可另存複習草稿。',true);if(renderedDraft)render();return false;}
      return true;
    }
    if (!readResponse().trim() && !activeAttempt()) return true;
    return saveResponse();
  };
  function updateAttemptRoute(id){
    if(typeof window==='undefined'||!/^#exam(?:\?|$)/.test(window.location.hash||''))return;
    const query=new URLSearchParams(window.location.hash.split('?')[1]||'');query.set('question',activeQuestionId);query.set('attempt',id);
    try{window.history?.replaceState(window.history.state,'','#exam?'+query.toString());}catch{}
  }
  const navigate = href => {if (!current()) return;if (!preserveCurrentDraft()) return; if (onNavigate) onNavigate(href); else if (href === '#exam') {activeQuestionId = null;activeAttemptId = null;transientResponse = null;render();} else {const id = new URLSearchParams(href.split('?')[1] || '').get('question');openQuestion(id, false);}};
  const begin = question => {
    const result = run(() => store.start(question.id));
    if (!result) return null;
    const attempt = result.attempt || latestAttempt(state(), question);
    activeAttemptId = attempt?.id || null;
    if(activeAttemptId)updateAttemptRoute(activeAttemptId);
    transientResponse = null;
    return attempt;
  };
  const openQuestion = (id, routed=true) => {
    const question = questionById(bank, id);
    if (!question) {setMessage('這道題目前不在題庫中；請由下方選題。', true); return;}
    if (!preserveCurrentDraft()) return;
    if (routed && onNavigate) {onNavigate(questionHref(id));return;}
    activeQuestionId = id;
    activeAttemptId = selectAttempt(null);
    transientResponse = null;
    message = '';messageError = false;
    render();
  };
  const ensureAttempt = () => activeAttempt() || begin(activeQuestion());
  const readResponse = () => {
    const question = activeQuestion();
    if (question?.type === 'choice') return $('input[name="exam-response"]:checked')?.value || '';
    return $('[data-exam-response]')?.value ?? pendingResponse()?.value ?? transientResponse ?? activeAttempt()?.draft ?? '';
  };
  function captureClosedResponse(){
    const attempt=activeAttempt();if(!renderedDraft||!attempt?.submittedAt||(!pendingNumericDraft&&!pendingResponse()?.dirty))return;
    const value=readResponse();
    if(value!==attempt.response)scratch.responses.set(activeQuestionId,{value,attemptId:attempt.id,dirty:true});
    else{scratch.responses.delete(activeQuestionId);pendingNumericDraft=false;}
  }
  const saveResponse = () => {
    if (!current()) return false;
    if (draftTimer !== null) {clearTimeout(draftTimer);draftTimer=null;}
    if(activeAttempt()?.submittedAt){captureClosedResponse();if(pendingResponse()?.dirty){setMessage('原作答已在其他分頁交出；本頁未存答案仍保留，可另存複習草稿。',true);if(renderedDraft)render();return false;}return true;}
    const response = readResponse(); transientResponse = response;
    const local={value:response,attemptId:activeAttempt()?.id||pendingResponse()?.attemptId||null,dirty:true};scratch.responses.set(activeQuestionId,local);
    const attempt = ensureAttempt();
    if(attempt)local.attemptId=attempt.id;
    const saved = !!attempt && !!run(() => store.saveDraft(attempt.id, response), '草稿已保存；還沒有計入答題結果。');
    if (saved){pendingNumericDraft=false;local.dirty=false;}
    return saved;
  };
  const queueNumericDraft = () => {
    if (!current()) return;
    transientResponse=readResponse();pendingNumericDraft=true;
    scratch.responses.set(activeQuestionId,{value:transientResponse,attemptId:activeAttempt()?.id||pendingResponse()?.attemptId||null,dirty:true});
    if(draftTimer!==null)clearTimeout(draftTimer);
    setMessage(store.error || '正在保存草稿…',!!store.error);
    draftTimer=setTimeout(()=>{draftTimer=null;if(current())saveResponse();},600);
  };
  function forkPending(){
    if(!current())return;captureClosedResponse();
    const local=pendingResponse(),source=local?.dirty&&state().attempts.find(item=>item.id===local.attemptId&&item.questionId===activeQuestionId&&item.questionVersion===activeQuestion()?.version);
    if(!source?.submittedAt){setMessage('目前沒有需要從交出作答另存的答案。',true);return;}
    const previous=scratch.recoveryTargets.get(source.id);
    let target=previous&&state().attempts.find(item=>item.id===previous&&item.questionId===activeQuestionId&&item.questionVersion===activeQuestion().version&&!item.submittedAt);
    if(!target){const result=run(()=>store.start(activeQuestionId));if(!result?.attempt)return;target=result.attempt;scratch.recoveryTargets.set(source.id,target.id);}
    if(!run(()=>store.noteSupport(target.id,'prior-familiarity')))return;
    if(draftTimer!==null){clearTimeout(draftTimer);draftTimer=null;}
    local.attemptId=target.id;activeAttemptId=target.id;transientResponse=local.value;pendingNumericDraft=true;scratch.recoveryTargets.delete(source.id);
    updateAttemptRoute(target.id);
    const result=run(()=>store.saveDraft(target.id,local.value));
    if(result){local.dirty=false;pendingNumericDraft=false;setMessage(store.error||'未存答案已另存複習草稿；原交出作答保留不變。',!!store.error);}
    render();$('input[name="exam-response"], [data-exam-response]')?.focus({preventScroll:true});
  }
  function recoveryPanel(question,attempt){
    const local=pendingResponse();if(!local?.dirty||!attempt?.submittedAt||local.attemptId!==attempt.id)return '';
    return `<section class="exam-alert" data-exam-pending-recovery aria-label="保留未存答案"><h2>這份作答已在其他分頁交出</h2><p>本頁未存的答案仍保留：<strong data-exam-pending-value>${esc(responseLabel(question,local.value))}</strong></p><p>另存會建立一份複習草稿；原交出答案與結果保留不變，不算第一次作答。</p><button class="exam-button" type="button" data-exam-fork-pending ${store.locked?'disabled':''}>保留交出作答，將未存答案另存複習草稿</button><p class="exam-small">也可以先匯出作答紀錄，救援檔會保留這份尚未保存的答案。</p></section>`;
  }
  const summaryOptions = () => subject === 'all' ? {} : {subject};
  const questionForNext = excludeIds => nextQuestion(bank, state(), {...summaryOptions(), ...(excludeIds ? {excludeIds} : {})});
  const storageWarning = () => store.error || store.locked ? `<div class="exam-alert" role="alert">${esc(store.error || '此瀏覽器的紀錄暫時無法寫入。請先匯出紀錄保留作答。')}</div>` : '';
  const statusRegion = () => `<p class="exam-status" data-exam-status data-error="${messageError || !!store.error}" role="status" aria-live="polite">${esc(message || store.error || '')}</p>`;
  const backup = () => `<section class="exam-backup" aria-labelledby="exam-backup-title"><h2 id="exam-backup-title">保留我的作答</h2><p>紀錄保存在目前的瀏覽器。換裝置前可匯出，再於另一台裝置匯入；課程筆記仍在各科的「筆記與複習」。</p><div class="exam-actions"><button class="exam-button" type="button" data-exam-export>匯出作答紀錄</button><button class="exam-button" type="button" data-exam-import>匯入作答紀錄</button><input data-exam-import-file type="file" accept=".json,application/json" hidden></div></section>`;
  const counts = summary => `<dl class="exam-metrics">
    <div class="exam-metric"><dt>做過的主題</dt><dd>${summary.tested}<small> / ${summary.total}</small></dd><p>這個主題至少自己做過一題。</p></div>
    <div class="exam-metric"><dt>第一次就答對</dt><dd>${summary.independentCorrect}<small> / ${summary.total}</small></dd><p>第一次作答，未先看這題解析。</p></div>
    <div class="exam-metric"><dt>換題也答對</dt><dd>${summary.verified}<small> / ${summary.total}</small></dd><p>同一主題，兩道不同題都自己答對；之後答錯會重新算。</p></div></dl>`;
  const domainCard = domain => {
    const totalQuestions = bank.questions.filter(question => question.domainId === domain.id).length;
    const status = domain.status || 'untested';
    const nextId = domain.nextQuestionId || nextQuestion(bank, state(), {domainId:domain.id})?.id || domain.lastAttempt?.questionId;
    const testedCount = domain.testedCount ?? new Set(state().attempts.filter(attempt=>attempt.available && attempt.submittedAt && attempt.independent && bank.questions.some(question=>question.id===attempt.questionId&&question.domainId===domain.id)).map(attempt=>attempt.questionId)).size;
    const reviewOnly = !domain.tested && domain.reviewCount > 0;
    return `<article class="exam-skill" data-exam-domain="${esc(domain.id)}"><div class="exam-skill-header"><h3>${esc(domain.title)}</h3>${badge(reviewOnly ? '已複習，還沒自己做一題' : STATUS[status] || STATUS.untested, status === 'verified' ? 'positive' : status === 'needs-work' ? 'review' : '')}</div><p>${esc(SUBJECTS[domain.subject] || domain.subject)} · 自己做過 ${testedCount} / ${totalQuestions} 題</p><div class="exam-progress-track" aria-hidden="true"><span style="width:${percent(testedCount, totalQuestions)}%"></span></div><p>${status === 'verified' ? (domain.lastIndependentErrorAt?'最近一次答錯之後，兩道不同題都自己答對了。':'兩道不同題都自己答對了。') : status === 'awaiting-variant' ? '這次答對了；換一題條件不同的再試。' : status === 'needs-work' ? '先補答錯的地方，再換一題確認。' : reviewOnly ? '已經做過複習；接著選一道沒看過的題，自己做一次。' : '先自己做一題。'}</p>${nextId ? `<button class="exam-button" style="margin-top:12px" type="button" data-exam-question="${esc(nextId)}">${status === 'untested' && domain.nextQuestionId ? '做這個主題' : domain.nextQuestionId ? '繼續這個主題' : '回看最近作答'} →</button>` : ''}</article>`;
  };
  const questionRow = question => {
    const status = questionStatus(bank, state(), question.id);
    const latest = status.latest;
    const label = latest?.conflicted ? '有並行提交，請換一題' : latest?.submittedAt ? latest.correct ? latest.independent ? '第一次就答對' : '複習答對' : '需要補強' : status.priorVersionSeen ? '曾練過舊版，這次列為複習' : latest?.revealedAt ? '已看解析' : status.hasDraft ? '有作答草稿' : '尚未作答';
    return `<li class="exam-question-row"><div><div class="exam-question-meta"><span>${esc(sourceLabel(question))}</span><span>${esc(SUBJECTS[question.subject] || '')}</span>${badge(label, latest?.submittedAt && latest.correct ? 'positive' : latest?.submittedAt ? 'review' : '')}</div><h3>${esc(question.title)}</h3><p class="exam-small">${esc(referenceLabel(question))}</p></div><button class="exam-button" type="button" data-exam-question="${esc(question.id)}">${latest?.submittedAt || latest?.revealedAt ? '看作答與回饋' : status.hasDraft ? '繼續作答' : '開始作答'} →</button></li>`;
  };
  const coverage = () => {
    const rows = (bank.topicCoverage || []).filter(row => subject === 'all' || row.subject === subject);
    if (!rows.length) return '';
    const covered = rows.filter(row => row.domainIds?.length).length;
    return `<details class="exam-details"><summary>這些題涵蓋什麼？${covered} / ${rows.length} 個課程主題有題</summary><p class="exam-small">上方進度以目前的 ${summarizeExam(bank,state(),summaryOptions()).total} 個主題為分母。未納入的主題仍需準備，不能由已完成的題目推定。</p><ul>${rows.map(row => `<li>${esc(SUBJECTS[row.subject] || row.subject)} · ${esc(row.title)} — ${row.domainIds?.length ? '有部分題目' : '這批還沒有題'}</li>`).join('')}</ul><p class="exam-small">${esc(bank.scope?.statement || '')}${bank.scope?.notCovered ? ' '+esc(Array.isArray(bank.scope.notCovered) ? bank.scope.notCovered.join('；') : bank.scope.notCovered) : ''}</p></details>`;
  };
  function dashboard() {
    const summary = summarizeExam(bank, state(), summaryOptions());
    const candidate = questionForNext();
    const candidateDomain = candidate ? summary.domains.find(domain => domain.id === candidate.domainId) : null;
    const questions = bank.questions.filter(question => subject === 'all' || question.subject === subject);
    const nextTitle = !summary.tested ? '先做一題' : candidateDomain?.status === 'needs-work' ? '補完後，換一題確認' : candidateDomain?.status === 'awaiting-variant' ? '再做一題同主題的' : candidate ? '試還沒做過的主題' : '都做過了，回頭看答錯的';
    return `<header class="exam-header"><div><p class="exam-eyebrow">EXAM READINESS</p><h1>快速測驗</h1><p>48 題選擇與計算題，三科各 16 題，幾分鐘看出哪裡還不熟。</p></div><a class="exam-button" href="#learn/map">回課程</a></header>${storageWarning()}
      <fieldset class="exam-subjects"><legend>查看範圍</legend>${[{id:'all',title:'三科'},...Object.entries(SUBJECTS).map(([id,title])=>({id,title}))].map(item=>`<button class="exam-button" type="button" data-exam-subject="${item.id}" aria-pressed="${subject === item.id}">${item.title}</button>`).join('')}</fieldset>
      ${counts(summary)}<p class="exam-small">共 ${questions.length} 題、${summary.total} 個主題；沒測到的範圍不算。</p>
      <section class="exam-next" aria-labelledby="exam-next-title" style="margin-top:18px"><div><p class="exam-eyebrow">NEXT STEP</p><h2 id="exam-next-title">${nextTitle}</h2><p>${candidate ? esc(candidate.title)+' · 約 2–4 分鐘' : '從下方作答紀錄找出錯因，回到對應課程再練。'}</p></div>${candidate ? `<button class="exam-button exam-button-primary" type="button" data-exam-question="${esc(candidate.id)}">${summary.tested ? '繼續下一題' : '開始第一題'} →</button>` : ''}</section>
      <section class="exam-section" aria-labelledby="exam-domain-title"><div class="exam-section-heading"><h2 id="exam-domain-title">${summary.total} 個主題</h2><p class="exam-small">做一題 → 補課 → 再做一題確認</p></div><div class="exam-skill-grid">${summary.domains.map(domainCard).join('')}</div></section>
      ${coverage()}<section class="exam-section" aria-labelledby="exam-bank-title"><div class="exam-section-heading"><h2 id="exam-bank-title">直接選題練習</h2><p class="exam-small">${questions.length} 題 · 標明是改編自考題還是自編</p></div><ul class="exam-question-list">${questions.map(questionRow).join('')}</ul></section>
      ${statusRegion()}${backup()}`;
  }
  function answerForm(question, attempt) {
    const submitted = !!attempt?.submittedAt;
    renderedDraft=!submitted;
    const priorVersionSeen = questionStatus(bank,state(),question.id).priorVersionSeen;
    const local=pendingResponse(),response = submitted?attempt.response:local?.dirty&&(!local.attemptId||local.attemptId===attempt?.id)?local.value:attempt?.draft??'';
    const inputs = question.type === 'choice'
      ? `<fieldset class="exam-options" ${submitted || store.locked ? 'disabled' : ''}><legend>選出最合適的答案</legend>${question.options.map((option,index)=>`<label class="exam-option"><input type="radio" name="exam-response" value="${esc(option.id)}" ${response===option.id ? 'checked' : ''}><span><strong>${String.fromCharCode(65+index)}.</strong> ${esc(option.text)}</span></label>`).join('')}</fieldset>`
      : `<label class="exam-answer-label" for="exam-response">你的答案${question.answer.unit ? '（'+esc(question.answer.unit)+'）' : ''}</label><input class="exam-input" id="exam-response" data-exam-response inputmode="decimal" type="text" maxlength="120" autocomplete="off" value="${esc(response)}" ${submitted || store.locked ? 'readonly' : ''} aria-describedby="exam-numeric-hint"><p id="exam-numeric-hint" class="exam-small">填入數值${question.answer.unit ? '，單位為 '+esc(question.answer.unit) : ''}；可用小數或科學記號。</p>`;
    return `<form data-exam-form>${inputs}${!submitted ? `<div class="exam-actions" style="margin-top:20px"><button class="exam-button exam-button-primary" type="submit">送出，對答案</button><button class="exam-button" type="button" data-exam-save>保存草稿</button>${!attempt?.revealedAt ? '<button class="exam-button" type="button" data-exam-reveal>還不會，先看解析</button>' : ''}</div><p class="exam-small" style="margin-top:10px">${priorVersionSeen ? '曾練過舊版，這次列為複習。換一題沒做過的，才算第一次作答。' : attempt?.revealedAt ? '這題已看過解析；後續作答列為複習，換另一題再試。' : compatibleAttempts(state(),question).some(item=>item.submittedAt) ? '這題已經作答過，重練會保留這次結果，另計為複習。' : '提交前可修改答案；解析會在提交後顯示。'}</p>` : ''}</form>`;
  }
  function feedback(question, attempt) {
    if (!attempt?.submittedAt && !attempt?.revealedAt) return '';
    const answered = !!attempt.submittedAt;
    const positive = answered && !attempt.conflicted && attempt.correct;
    const next = nextQuestion(bank,state(),{domainId:question.domainId,excludeIds:[question.id]}) || nextQuestion(bank,state(),{subject:question.subject,excludeIds:[question.id]});
    const summary = summarizeExam(bank,state());
    const domain = summary.domains.find(item => item.id === question.domainId);
    const title = attempt.conflicted ? '這次作答有並行提交' : !answered ? '先把這一題的推理弄懂' : positive ? attempt.independent ? '這題第一次就答對了' : '這次複習答對了' : '這一題需要再補強';
    const detail = attempt.conflicted ? '多個分頁對同一次作答提交了不同答案，內容全部保留。這次不算第一次作答；請核對紀錄，再用其他新題確認。' : !answered ? '這次沒有提交答案，不會記成答錯。讀完後，可以回課程補一段，再換題檢查。' : positive ? attempt.independent ? domain?.status === 'verified' ? '這個主題兩道不同題都自己答對了，可以往下一個主題。' : '第一次就答對了。接著換一題，確認條件改變時也能用同一原理。' : '重練結果已保留。下一次換一題沒做過的，才算第一次作答。' : '先核對解題依據，再從下面的課程補上缺口；之後用另一道題確認。';
    const answer = question.type === 'choice' ? question.options.find(option => option.id === question.answer.optionId)?.text || '' : `${question.answer.value}${question.answer.unit ? ' '+question.answer.unit : ''}`;
    return `<section class="exam-feedback" data-result="${positive ? 'correct' : 'review'}" aria-labelledby="exam-feedback-title"><h2 id="exam-feedback-title" tabindex="-1">${title}</h2><p>${detail}</p>${attempt.conflicted ? `<details class="exam-details" open><summary>保留的提交內容</summary><ul>${submittedResponses(attempt).map(item=>`<li>${esc(dateLabel(item.at))}：${esc(responseLabel(question,item.response))}</li>`).join('')}</ul></details>` : answered ? `<p class="exam-small">你的答案：${esc(responseLabel(question,attempt.response))} · ${esc(dateLabel(attempt.submittedAt))}</p>` : ''}
      ${attempt.revealedAt ? `<div class="exam-reference"><h3>參考答案：${esc(answer)}</h3><p>${esc(question.explanation)}</p></div>${question.commonErrors?.length ? `<details class="exam-details"><summary>容易混淆的地方</summary><ul>${question.commonErrors.map(item=>`<li><strong>${esc(item.label)}</strong>：${esc(item.feedback)}</li>`).join('')}</ul></details>` : ''}` : '<button class="exam-button" style="margin-top:14px" type="button" data-exam-reveal>展開解析</button>'}
      ${question.remediation?.length ? `<div class="exam-remedies"><h3>只補這一段</h3>${question.remediation.filter(item=>/^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/(?:understand|observe|check)(?:\?|$)/.test(item.href)).map(item=>`<a href="${esc(examRemedyHref(item.href,question.id,attempt.id))}" data-exam-remedy>${esc(item.title)} →</a>`).join('')}<p class="exam-small">回看課程後，按課程頁的「回到這次作答」，接著換題檢查。</p></div>` : ''}
      <div class="exam-actions">${next ? `<button class="exam-button exam-button-primary" type="button" data-exam-question="${esc(next.id)}">換一題 →</button>` : ''}${answered ? '<button class="exam-button" type="button" data-exam-retry>再練這一題</button>' : ''}<button class="exam-button" type="button" data-exam-home>回快速測驗</button></div></section>`;
  }
  function history(question, attempt) {
    const attempts = compatibleAttempts(state(),question).filter(item=>item.id !== attempt?.id && (item.submittedAt || item.revealedAt));
    if (!attempts.length) return '';
    return `<details class="exam-details"><summary>之前的作答 · ${attempts.length} 次</summary><ol class="exam-history-list">${[...attempts].reverse().map(item=>`<li><p>${esc(dateLabel(item.submittedAt || item.revealedAt))} · ${item.conflicted ? '有並行提交，不計入' : item.submittedAt ? item.correct ? item.independent ? '第一次就答對' : '複習答對' : '需要補強' : '看解析，未提交'}</p>${item.conflicted ? `<ul>${submittedResponses(item).map(response=>`<li>${esc(responseLabel(question,response.response))}</li>`).join('')}</ul>` : `<p class="exam-small">${esc(responseLabel(question,item.response || item.draft))}</p>`}</li>`).join('')}</ol></details>`;
  }
  function questionPage(question) {
    const attempt = activeAttempt();
    const domain = bank.domains.find(item => item.id === question.domainId);
    return `<header class="exam-header"><div><p class="exam-eyebrow">${esc(SUBJECTS[question.subject] || '')} · ${esc(domain?.title || '')}</p><h1>${esc(question.title)}</h1></div><button class="exam-button" type="button" data-exam-home>← 快速測驗</button></header>${storageWarning()}
      <article class="exam-question-sheet"><div class="exam-question-meta">${badge(sourceLabel(question))}<span>${esc(referenceLabel(question))}</span><span>${question.type === 'choice' ? '單選題' : '數值題'}</span></div><p class="exam-question-prompt">${esc(question.prompt)}</p>${answerForm(question,attempt)}${recoveryPanel(question,attempt)}${statusRegion()}</article>
      ${feedback(question,attempt)}${history(question,attempt)}
      <details class="exam-details"><summary>題目來源與對應範圍</summary><p>${esc(question.examRef?.promptSummary || '')}</p><p>${question.examRef ? sourceLink(question.examRef.url,referenceLabel(question)+' · 官方題本') : ''}</p><p class="exam-small">${esc(scopeLabel(question.examRef?.scope))}</p>${attempt?.revealedAt && question.answerSources?.length ? `<h3>解題依據</h3><ul>${question.answerSources.map(item=>`<li>${sourceLink(item.url,item.title)}</li>`).join('')}</ul>` : '<p class="exam-small">解題依據會在核對解析後顯示。</p>'}${question.limitations ? `<p class="exam-small">${esc(Array.isArray(question.limitations) ? question.limitations.join('；') : question.limitations)}</p>` : ''}</details>${backup()}`;
  }
  function bind() {
    $$('[data-exam-question]').forEach(button=>button.addEventListener('click',()=>openQuestion(button.dataset.examQuestion)));
    $$('[data-exam-home]').forEach(button=>button.addEventListener('click',()=>navigate('#exam')));
    $$('[data-exam-remedy]').forEach(link=>link.addEventListener('click',event=>{if (!preserveCurrentDraft()) event.preventDefault();}));
    $$('[data-exam-subject]').forEach(button=>button.addEventListener('click',()=>{subject=button.dataset.examSubject;render();$(`[data-exam-subject="${subject}"]`)?.focus({preventScroll:true});}));
    const form = $('[data-exam-form]');
    if (form) {
      form.addEventListener('submit', event=>{
        event.preventDefault();
        if (!current()) return;
        if (draftTimer!==null) {clearTimeout(draftTimer);draftTimer=null;}
        const response = readResponse();transientResponse = response;
        if (!response.trim()) {setMessage('先填入你的答案，再提交核對。',true);$('input[name="exam-response"], [data-exam-response]')?.focus();return;}
        const attempt = ensureAttempt();
        if (!attempt || !run(()=>store.submit(attempt.id,response))) return;
        pendingNumericDraft=false;scratch.responses.delete(activeQuestionId);
        run(()=>store.reveal(attempt.id));
        transientResponse=null;render();$('#exam-feedback-title')?.focus({preventScroll:true});$('#exam-feedback-title')?.scrollIntoView({block:'nearest'});
      });
      $$('input[name="exam-response"]').forEach(input=>input.addEventListener('change',()=>{scratch.responses.set(activeQuestionId,{value:readResponse(),attemptId:activeAttempt()?.id||pendingResponse()?.attemptId||null,dirty:true});saveResponse();}));
      $('[data-exam-response]')?.addEventListener('input',queueNumericDraft);
      $('[data-exam-response]')?.addEventListener('blur',()=>{if(pendingNumericDraft)saveResponse();});
    }
    $('[data-exam-save]')?.addEventListener('click',saveResponse);
    $('[data-exam-reveal]')?.addEventListener('click',()=>{
      if (!current()) return;
      const existing = activeAttempt();
      if (!existing?.submittedAt) saveResponse();
      const attempt = ensureAttempt();
      if (!attempt || !run(()=>store.reveal(attempt.id),'解析已開啟；這題的後續作答列為複習。')) return;
      render();$('#exam-feedback-title')?.focus({preventScroll:true});$('#exam-feedback-title')?.scrollIntoView({block:'nearest'});
    });
    $('[data-exam-retry]')?.addEventListener('click',()=>{if(!preserveCurrentDraft())return;if (begin(activeQuestion())) {scratch.responses.delete(activeQuestionId);setMessage('已開始新一次複習；之前的作答仍保留。');render();$('input[name="exam-response"], [data-exam-response]')?.focus();}});
    $('[data-exam-fork-pending]')?.addEventListener('click',forkPending);
    $('[data-exam-export]')?.addEventListener('click',()=>{
      if (!current()) return;
      preserveCurrentDraft();
      try {
        const exported=store.export(),content=typeof exported==='string'?JSON.parse(exported):exported;
        const pending=[...scratch.responses].filter(([,value])=>value.dirty).map(([questionId,value])=>({questionId,...value}));
        if(pending.length)content.recovery={...(content.recovery?{storedRecovery:content.recovery}:{}),diagnosticResponses:pending,note:'含尚未加入正式紀錄的答案。救援檔不會直接匯入覆寫；請保留原檔並回到作答頁重試，若原作答已交出可將未存答案另存複習草稿。'};
        const blob = new Blob([JSON.stringify(content,null,2)],{type:'application/json;charset=utf-8'});
        const url = URL.createObjectURL(blob), anchor = document.createElement('a');
        anchor.href=url;anchor.download='food-exam-'+(pending.length?'recovery-':'progress-')+new Date().toISOString().slice(0,10)+'.json';anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        setMessage(pending.length?'已準備救援檔下載，內含尚未保存的答案；此檔不會直接匯入，請保留原檔並重試保存。':'已準備作答紀錄下載。請確認檔案已保存。',pending.length>0);
      } catch (error) {setMessage(error.message || '匯出未完成。',true);}
    });
    $('[data-exam-import]')?.addEventListener('click',()=>{if(preserveCurrentDraft())$('[data-exam-import-file]')?.click();});
    $('[data-exam-import-file]')?.addEventListener('change',async event=>{
      const input=event.currentTarget,file=input.files?.[0],epoch=++importEpoch;
      if (!file) return;
      if (file.size > EXAM_MAX_IMPORT_BYTES) {setMessage('作答紀錄檔超過 32 MB；尚未匯入，請保留原檔。',true);input.value='';return;}
      try {
        const content=await file.text();
        if (!current() || epoch!==importEpoch || input!==$('[data-exam-import-file]')) return;
        if (!preserveCurrentDraft()) return;
        const result=run(()=>store.import(content));
        if (!result) return;
        transientResponse=null;activeAttemptId=activeQuestionId?selectAttempt(activeAttemptId||(activeQuestionId===routeId?(initialAttemptId||routeQuery.get('attempt')):null)):null;if (result.persisted !== false) setMessage('已合併作答紀錄；既有作答仍保留。');render();
      } catch (error) {if (current() && epoch===importEpoch) setMessage(error.message || '無法讀取這份作答紀錄。',true);}
      finally {if (current() && input.isConnected) input.value='';}
    });
  }
  function render() {
    if (!current()) return;
    const question=activeQuestion();renderedDraft=false;
    container.className='learning-studio exam-room';container.setAttribute('data-view','exam');
    container.innerHTML=renderExamTabs('diagnostic')+(question ? questionPage(question) : dashboard());
    bind();focusedHeading();
  }
  try {store.refresh?.();} catch (error) {message=error.message;messageError=true;}
  const routeQuery=new URLSearchParams(typeof window!=='undefined'?window.location.hash.split('?')[1]||'':''),routeId=initialQuestionId||routeQuery.get('question');
  if (routeId && questionById(bank,routeId)) {activeQuestionId=routeId;activeAttemptId=selectAttempt(initialAttemptId||routeQuery.get('attempt'));}
  else if (routeId) {message='這道題目前無法開啟，請由題庫重新選擇。';messageError=true;}
  const flush=()=>current()?preserveCurrentDraft():true;scratch.flush=flush;guardUnsavedRoomWork(store);render();
  const handleStorage = event => {if (!current() || (event?.key && !event.key.startsWith('food-exam-evidence-v1:'))) return;try {store.refresh?.();} catch {}captureClosedResponse();if(!activeQuestionId||activeAttempt()?.submittedAt)render();};
  if (typeof window!=='undefined')window.addEventListener('storage',handleStorage);
  const dispose = () => {if(disposed)return;flush();if(scratch.flush===flush)delete scratch.flush;if(draftTimer!==null)clearTimeout(draftTimer);disposed=true;importEpoch++;if(typeof window!=='undefined')window.removeEventListener('storage',handleStorage);container.className=originalClass;};
  dispose.prepareLeave=()=>{
    const result=prepareRoomLeave(store);
    if(result!==true&&current()){setMessage(result.error,true);if(renderedDraft&&activeAttempt()?.submittedAt&&pendingResponse()?.dirty)render();}
    return result;
  };
  return dispose;
}
