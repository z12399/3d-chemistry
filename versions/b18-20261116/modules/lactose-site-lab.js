import {escapeHTML as esc} from './storage.js';
import {LACTOSE_SITE_TASKS,LACTOSE_SITE_OPTIONS,lactoseSiteDraft,evaluateLactoseSite,lactoseSiteSummary} from './lactose-site-model.js';
import {mountLactoseEndpoints} from './lactose-endpoints.js';

// Same-page drafts belong to the existing progress object, never to new storage.
const drafts=new WeakMap();
function memory(owner) {
  if(owner&&typeof owner==='object'){
    if(!drafts.has(owner))drafts.set(owner,{task:'opening',opening:lactoseSiteDraft(),hydrolysis:lactoseSiteDraft()});
    return drafts.get(owner);
  }
  return {task:'opening',opening:lactoseSiteDraft(),hydrolysis:lactoseSiteDraft()};
}
const options=field=>'<option value="">先選一項</option>'+LACTOSE_SITE_OPTIONS[field].map(option=>`<option value="${esc(option.value)}">${esc(option.label)}</option>`).join('');
export function mountLactoseSiteLab(host,{draftOwner,onSaveSummary,onJumpWorkbench=()=>{}}={}) {
  const state=memory(draftOwner);let alive=true,result=null;
  host.innerHTML=`<section class="lactose-site-lab" aria-labelledby="lactose-site-title">
    <header><p class="learning-kicker">乳糖 · 先分清部位</p><h2 id="lactose-site-title">同一座橋，兩種不同變化。</h2><p>A 是 Gal（半乳糖），B 是 Glc（葡萄糖）。先核對連接與水收支，再到原電子庫推糖苷鍵水解。</p></header>
    <figure class="lactose-site-map"><figcaption>連接參考 · 只表示鍵的連通，不表示立體構象</figcaption><div><span>兩個單糖之間的橋</span><code>AC1 — BO4 — BC4</code><small>Gal C1 → 橋氧 → Glc C4</small></div><div><span>B 的還原端</span><code>BC1 — BO5</code><small>B 的環內鍵；BC1 還連著 BO1（端部 OH 氧）</small></div></figure>
    <fieldset class="lactose-site-tasks"><legend>選一個操作任務</legend>${Object.entries(LACTOSE_SITE_TASKS).map(([id,task])=>`<button type="button" data-lactose-task="${id}" aria-pressed="${state.task===id}">${esc(task.label)}</button>`).join('')}</fieldset>
    <p id="lactose-site-prompt" class="lactose-site-prompt"></p>
    <div class="lactose-site-fields"><label for="lactose-site-bond"><span>1 · 哪條鍵斷開？</span><select id="lactose-site-bond">${options('bond')}</select></label><label for="lactose-site-bridge"><span>2 · 橋上哪兩段保留？</span><select id="lactose-site-bridge">${options('bridge')}</select></label><label for="lactose-site-water"><span>3 · 淨耗水多少？</span><select id="lactose-site-water">${options('water')}</select></label></div>
    <div class="lactose-site-check-row"><button type="button" class="button-primary" id="lactose-site-check">核對這三項</button><span id="lactose-site-check-status" role="status"></span></div>
    <article id="lactose-site-feedback" class="lactose-site-feedback" hidden><h3 id="lactose-site-result-title"></h3><ul id="lactose-site-result-reasons"></ul><p id="lactose-site-outcome"></p></article>
    <details id="lactose-endpoint-details" class="lactose-endpoint-details"><summary>看乳糖 3D：端點與三步教材酸示意</summary><div id="lactose-endpoint-host"></div><p class="lactose-site-draft-note">端點、標示部位與視角只在本頁暫留；返回同課可續接。不同視窗比例會重新適配視角。</p></details>
    <details class="lactose-site-note"><summary>留下自己的理由與本次核對</summary><label for="lactose-site-reason">我的理由（選填）</label><textarea id="lactose-site-reason" rows="3" maxlength="2000" placeholder="例如：這條環內鍵和橋鍵為什麼不同？">\n${esc(state[state.task].reason)}</textarea><p class="lactose-site-draft-note">操作草稿只在本頁暫留。關閉頁面前，請附加到本課筆記或自行複製。</p><div id="lactose-site-summary-group" hidden><label for="lactose-site-summary">核對摘要（可選取複製）</label><textarea id="lactose-site-summary" rows="7" readonly></textarea></div><button type="button" id="lactose-site-save" disabled>附加到本課筆記</button><span id="lactose-site-save-status" role="status"></span></details>
    <details class="lactose-site-reference"><summary>開環時，電子與質子如何記帳？</summary><p>以下將一般半縮醛的酸催化機構套用到 B 的還原端，是教材層級的機構推論；3D 區已提供有限三步電子帳與計算代表構象；沒有建立乳糖實測路徑或完整自由箭推評分。</p><ol><li>先質子化 B 的環氧 BO5。</li><li>BO1 的孤對電子形成 BC1=BO1；BC1–BO5 的鍵電子回到 BO5，打開 B 環。BO5 仍接 BC5，成為該端的 OH；新羰基的氧是 BO1。</li><li>溶劑水接走羰基氧 BO1 上的質子，恢復中性羰基並再生酸。淨用水為 0，不等於水沒有參與質子接力。</li></ol><p>這些記帳步驟不代表可分離的實測中間體，也沒有指定唯一的溶劑接力、速率或條件。水溶液中的酸同樣可能催化糖苷鍵水解，不能把「甲保留橋」當成酸條件下必然選擇性。</p><p class="lactose-site-sources">教材依據：<a href="https://openstax.org/books/organic-chemistry/pages/25-8-disaccharides" target="_blank" rel="noopener noreferrer">OpenStax 25.8 · 乳糖的連接與還原端 ↗</a><a href="https://openstax.org/books/organic-chemistry/pages/19-10-nucleophilic-addition-of-alcohols-acetal-formation" target="_blank" rel="noopener noreferrer">OpenStax 19.10 · 可逆的半縮醛／縮醛機構 ↗</a></p></details>
    <p class="lactose-site-boundary">甲只比較完整乳糖的還原端開環；乙只比較原庫指定的糖苷鍵水解。甲的有限三步教材示意在上方 3D 區；下方原電子庫仍預設開啟乙，不是甲的開環機構。</p><button type="button" id="lactose-site-workbench">接著看原電子庫的水解分支 ↓</button>
  </section>`;
  const $=selector=>host.querySelector(selector);
  const taskButtons=[...host.querySelectorAll('[data-lactose-task]')];
  const fields=Object.fromEntries(['bond','bridge','water'].map(field=>[field,$('#lactose-site-'+field)]));
  const reason=$('#lactose-site-reason'),feedback=$('#lactose-site-feedback'),summary=$('#lactose-site-summary'),summaryGroup=$('#lactose-site-summary-group'),save=$('#lactose-site-save');
  const checkStatus=$('#lactose-site-check-status'),saveStatus=$('#lactose-site-save-status');
  const endpointDetails=$('#lactose-endpoint-details');let disposeEndpoints=null;
  endpointDetails.ontoggle=()=>{if(alive&&endpointDetails.open&&!disposeEndpoints)disposeEndpoints=mountLactoseEndpoints($('#lactose-endpoint-host'),{draftOwner});};
  function invalidate(message='預測已改變，請重新核對。') {
    result=null;feedback.hidden=true;summaryGroup.hidden=true;summary.value='';save.disabled=true;saveStatus.textContent='';checkStatus.textContent=message;
  }
  function showTask() {
    $('#lactose-site-prompt').textContent=LACTOSE_SITE_TASKS[state.task].prompt;
    for(const field of ['bond','bridge','water'])fields[field].value=state[state.task][field];
    reason.value=state[state.task].reason;
    taskButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lactoseTask===state.task)));
  }
  for(const button of taskButtons)button.onclick=()=>{if(!alive||button.dataset.lactoseTask===state.task)return;state.task=button.dataset.lactoseTask;invalidate('任務已切換，請核對這一組預測。');showTask();};
  for(const field of ['bond','bridge','water'])fields[field].onchange=()=>{if(!alive)return;state[state.task]=lactoseSiteDraft({...state[state.task],[field]:fields[field].value});invalidate();};
  reason.oninput=()=>{if(!alive)return;state[state.task]=lactoseSiteDraft({...state[state.task],reason:reason.value});invalidate();};
  $('#lactose-site-check').onclick=()=>{
    if(!alive)return;
    const next=evaluateLactoseSite(state.task,state[state.task]);
    if(!next.complete){invalidate('請完成鍵、橋與淨耗水三項；空白不能當作 0。');return;}
    result=next;feedback.hidden=false;feedback.className='lactose-site-feedback'+(result.correct?' is-correct':'');
    $('#lactose-site-result-title').textContent=result.correct?'三項相符，抓到部位差別了。':'先看看切鍵會改變哪個連通。';
    $('#lactose-site-result-reasons').innerHTML=result.feedback.map(text=>`<li>${esc(text)}</li>`).join('');
    $('#lactose-site-outcome').textContent=result.outcome;
    summary.value=lactoseSiteSummary(state.task,result);summaryGroup.hidden=false;save.disabled=typeof onSaveSummary!=='function';saveStatus.textContent='';checkStatus.textContent=result.correct?'三項核對相符。':'已核對；仍有項目需要修正。';
  };
  save.onclick=()=>{
    if(!alive||!result?.complete||typeof onSaveSummary!=='function')return;
    try {
      const saved=onSaveSummary(summary.value);
      saveStatus.textContent=saved===true?'已附加到本課筆記。':'尚未保存；輸入與摘要保留，可複製或重試。';
    } catch(error) {saveStatus.textContent='尚未保存：'+(error?.message||'儲存失敗。')+' 輸入與摘要保留，可複製或重試。';}
  };
  $('#lactose-site-workbench').onclick=()=>{if(alive)onJumpWorkbench();};
  showTask();
  return ()=>{alive=false;endpointDetails.ontoggle=null;disposeEndpoints?.();for(const button of taskButtons)button.onclick=null;for(const field of Object.values(fields))field.onchange=null;reason.oninput=null;$('#lactose-site-check').onclick=null;save.onclick=null;$('#lactose-site-workbench').onclick=null;};
}
