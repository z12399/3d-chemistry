import {escapeHTML as esc} from './storage.js';
import {textareaValue} from './workbench-session.js';
import {emptyPractice,archivePractice,hasPracticeWork} from './practice-model.js';

const textArea=(id,label,value,placeholder,readOnly=false)=>`<label class="practice-field" for="${id}">${label}</label><textarea id="${id}" data-practice-field="${id.replace('practice-','')}" rows="4" maxlength="5000" ${readOnly?'readonly':''} placeholder="${esc(placeholder)}">${textareaValue(value)}</textarea>`;
const dateLabel=value=>new Date(value).toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});

export function renderPractice(practice, value) {
  const record=value || emptyPractice();
  const checked=record.checked.filter(i=>i<practice.rubric.length).length;
  return `<section class="learning-practice" aria-labelledby="practice-title">
    <header><p class="learning-kicker">REASON IT THROUGH · 原創練習</p><h2 id="practice-title">把推理寫出來</h2><p>${esc(practice.prompt)}</p></header>
    <div class="practice-response">${textArea('practice-response','你的第一個解釋',record.response,'先寫判斷，再寫原因；也可以列出還缺什麼條件。',record.revealed)}</div>
    <details class="practice-hints"><summary>需要一點提示</summary><ul>${practice.scaffold.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></details>
    <button id="practice-reveal" class="button-secondary" aria-expanded="${record.revealed}" aria-controls="practice-comparison" ${record.revealed?'hidden':''}>對照推理要點 →</button>
    <div id="practice-comparison" ${record.revealed?'':'hidden'}>
      <p id="practice-comparison-title" class="practice-selfcheck-note" tabindex="-1">逐項對照自己的文字。這是自評，不會自動判分。</p>
      <fieldset class="practice-rubric"><legend>我的解釋有說清楚……</legend>${practice.rubric.map((point,i)=>`<label><input type="checkbox" data-practice-check="${i}" ${record.checked.includes(i)?'checked':''}><span>${esc(point)}</span></label>`).join('')}</fieldset>
      <p id="practice-check-count" class="learning-small">已對照 ${checked} / ${practice.rubric.length} 個要點</p>
      <details class="practice-sample"><summary>看一種完整的推理方式</summary><p>${esc(practice.sampleAnswer)}</p></details>
      ${textArea('practice-revision','對照後，我會怎麼修改？',record.revision,'補上原本漏掉的因果、單位或適用條件。原作答會保留在上面。')}
      <button id="practice-open-transfer" class="button-secondary" aria-expanded="${record.transferStarted}" aria-controls="practice-transfer-section" ${record.transferStarted?'hidden':''}>換個條件，再試一次 →</button>
      <section id="practice-transfer-section" class="practice-transfer" ${record.transferStarted?'':'hidden'}><p class="learning-kicker">換一個條件，再想一次</p><h3 id="practice-transfer-title" tabindex="-1">${esc(practice.transfer.prompt)}</h3>${textArea('practice-transfer','你的變化題作答',record.transfer,'把剛才的原理用在新的情境。')}
      <details id="practice-transfer-answer" ${record.transferRevealed?'open':''}><summary>對照變化題的推理</summary><p>${esc(practice.transfer.answer)}</p></details></section>
    </div>
    <div class="practice-save-row"><span id="practice-save-status" role="status">${esc(value?'作答隨輸入保存；可從我的複習匯出。':'可先寫想法，也可以先看提示。')}</span><button id="practice-again" class="learning-retry">保留這次，重新作答</button></div>
    ${record.history.length?`<details class="practice-history"><summary>之前的作答與修訂 · ${record.history.length} 次</summary>${[...record.history].reverse().map((attempt,i)=>`<article><h3>第 ${record.history.length-i} 次 <time datetime="${esc(attempt.savedAt)}">${esc(dateLabel(attempt.savedAt))}</time></h3>${[['第一個解釋',attempt.response],['修訂',attempt.revision],['變化題',attempt.transfer]].filter(([,text])=>text).map(([label,text])=>`<h4>${label}</h4><p>${esc(text)}</p>`).join('')}<small>當時自行勾選 ${attempt.checked.filter(n=>n<practice.rubric.length).length} / ${practice.rubric.length} 個要點；不是評分。</small></article>`).join('')}</details>`:''}
  </section>`;
}

export function bindPractice(root,{lesson,progress,onRerender,onStatus=()=>{}}) {
  if(!lesson.practice || !root.querySelector('#practice-response'))return;
  const $=s=>root.querySelector(s);
  const current=()=>progress.data.records[lesson.id]?.practice || emptyPractice();
  const focus=selector=>{const element=$(selector);element?.focus?.({preventScroll:true});element?.scrollIntoView?.({block:'nearest',behavior:'instant'});};
  const save=change=>{
    try {
      const practiceFields=['response','revision','transfer'].filter(key=>Object.hasOwn(change,key));
      const saved=progress.record(lesson.id,{practice:{...current(),...change}},{retainOnFailure:practiceFields.length>0,practiceFields});
      $('#practice-save-status').textContent=saved?'已保存這次作答。':'尚未保存至瀏覽器；可在我的複習匯出。';
      onStatus();return saved;
    }catch(error){$('#practice-save-status').textContent=error.message+' 此欄最新輸入尚未保存。';onStatus();return false;}
  };
  root.querySelectorAll('[data-practice-field]').forEach(field=>field.oninput=()=>{
    const key=field.dataset.practiceField;
    if(key==='response' && current().revealed)return;
    if(key==='revision' && current().revision!==field.value){
      if(!save({revision:field.value,checked:[]}))return;
      root.querySelectorAll('[data-practice-check]').forEach(box=>box.checked=false);
      $('#practice-check-count').textContent=`修訂已更新，請重新對照 ${lesson.practice.rubric.length} 個要點。`;
    }else if(key==='transfer'){
      if(save({transfer:field.value,transferRevealed:false}))$('#practice-transfer-answer').open=false;
    }else save({[key]:field.value});
  });
  $('#practice-reveal').onclick=()=>{
    if(!current().response.trim()){$('#practice-save-status').textContent='先寫一個想法，再對照推理要點。';$('#practice-response').focus?.();return;}
    if(!save({revealed:true}))return;
    $('#practice-response').readOnly=true;$('#practice-comparison').hidden=false;$('#practice-reveal').hidden=true;$('#practice-reveal').setAttribute('aria-expanded','true');focus('#practice-comparison-title');
  };
  $('#practice-open-transfer').onclick=()=>{
    if(!save({transferStarted:true}))return;
    $('#practice-transfer-section').hidden=false;$('#practice-open-transfer').hidden=true;$('#practice-open-transfer').setAttribute('aria-expanded','true');focus('#practice-transfer-title');
  };
  root.querySelectorAll('[data-practice-check]').forEach(box=>box.onchange=()=>{
    const checked=[...root.querySelectorAll('[data-practice-check]')].filter(el=>el.checked).map(el=>Number(el.dataset.practiceCheck));
    if(!save({checked})){
      root.querySelectorAll('[data-practice-check]').forEach(el=>el.checked=current().checked.includes(Number(el.dataset.practiceCheck)));
      return;
    }
    $('#practice-check-count').textContent=`已對照 ${checked.length} / ${lesson.practice.rubric.length} 個要點`;
  });
  $('#practice-transfer-answer').ontoggle=e=>{
    if(current().transferRevealed !== e.currentTarget.open&&!save({transferRevealed:e.currentTarget.open}))e.currentTarget.open=current().transferRevealed;
  };
  $('#practice-again').onclick=()=>{
    try {
      const archived=archivePractice(current());
      const saved=progress.record(lesson.id,{practice:archived},{retainOnFailure:false});
      if(!saved){$('#practice-save-status').textContent='尚未保存至瀏覽器；這次作答仍保留，可在我的複習匯出。';onStatus();return;}
      onRerender();
    } catch(error){$('#practice-save-status').textContent=error.message;onStatus();}
  };
}

export function practiceReviewEntries(course,progress) {
  return course.topics.flatMap(topic=>topic.lessons.filter(lesson=>lesson.practice && hasPracticeWork(progress.records[lesson.id]?.practice)).map(lesson=>({topic,lesson,practice:progress.records[lesson.id].practice})));
}
