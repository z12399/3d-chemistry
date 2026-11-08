import {
  HYDROLYSIS_IDENTIFIABILITY_ID,HYDROLYSIS_SOURCES,HYDROLYSIS_STATIONS,
  createHydrolysisDraft,getHydrolysisStation,getHydrolysisTrial,setHydrolysisStation,
  setHydrolysisInput,chooseHydrolysisAnswer,checkHydrolysisAnswer,evaluateHydrolysis,
  currentHydrolysisDiffers,buildHydrolysisSummary
} from './hydrolysis-identifiability-model.js';
import {
  createWorkbenchSessionStore,subscribeWorkbench,markWorkbenchChanged,refreshWorkbenchFeedback,
  saveWorkbenchSummary,escapeHtml as esc,textareaValue
} from './workbench-session.js';
export {HYDROLYSIS_IDENTIFIABILITY_ID} from './hydrolysis-identifiability-model.js';
const sessions=createWorkbenchSessionStore({createDraft:createHydrolysisDraft,buildSummary:buildHydrolysisSummary});
let instance=0;
const inputLabels={aAsn:'候選 A：Asn',aAsp:'候選 A：Asp',bAsn:'候選 B：Asn',bAsp:'候選 B：Asp',recovery:'已知回收 r（0<r≤1）',independentAsn:'另份已驗證的獨立原 Asn 報告（μmol）',reportedAsx:'另給的 Asx 報告（μmol）'};
const number=value=>Number(value.toPrecision(7)).toString();
const answerLabel=(station,id)=>station.options.find(o=>o.id===id)?.label||'尚未選擇';
export function mountHydrolysisIdentifiabilityLab(container,id=HYDROLYSIS_IDENTIFIABILITY_ID,options={}){
  if(id!==HYDROLYSIS_IDENTIFIABILITY_ID)throw new RangeError('Unsupported hydrolysis activity: '+String(id));
  if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const {draftOwner,draftKey=id,onSaveSummary}=options;
  const owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
  const record=sessions.get(owner,draftKey),draft=record.draft,prefix='hi-study-'+(++instance);
  refreshWorkbenchFeedback(record);let disposed=false;
  container.innerHTML=`<section class="hydrolysis-identifiability-lab" data-hi-lab="${esc(id)}" aria-labelledby="${prefix}-title">
    <header><p class="hi-kicker">方法 → 觀察 → 可回推的資訊</p><h3 id="${prefix}-title">合報之後，還能知道原來有多少？</h3><p>先比較兩種原組成可能產生的報告，再檢查多一項資訊能解開什麼。</p></header>
    <nav class="hi-navigation" aria-label="分析推理順序"><button type="button" data-hi-previous>← 上一題</button><p data-hi-position role="status"></p><button type="button" data-hi-next>下一題 →</button></nav>
    <div data-hi-stage></div>
    <details class="hi-detail" data-hi-detail="synthesis"><summary>整理自己的完整判讀</summary><label for="${prefix}-synthesis">哪些量可識別？還缺哪些獨立資訊？<textarea id="${prefix}-synthesis" data-hi-synthesis rows="4" maxlength="1200">${textareaValue(draft.synthesis)}</textarea></label></details>
    <div class="hi-save"><button type="button" data-hi-save>將比較、原答與修訂附加到本課筆記</button><p data-hi-save-status role="status"></p></div>
    <details class="hi-detail" data-hi-summary-detail><summary>查看或複製完整摘要</summary><label for="${prefix}-summary">完整文字摘要<textarea id="${prefix}-summary" data-hi-summary rows="8" readonly></textarea></label></details>
    <details class="hi-detail" data-hi-detail="sources"><summary>來源與模型界線</summary>${HYDROLYSIS_SOURCES.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></p><p>${esc(s.scope)}</p>`).join('')}<p>數字、回收係數和獨立 Asn 報告皆是原創理想題設。這不是實驗配方，也沒有預測特定食品的真實回收。</p></details>
    <p class="hi-small">切題或切課返回可接續同一頁面工作階段的草稿；確認附加成功後的文字才隨本課筆記保存與匯出。未存盤面不保證重新載入還原。</p>
  </section>`;
  const root=container.querySelector('[data-hi-lab]'),$=selector=>root.querySelector(selector);
  const changed=()=>markWorkbenchChanged(record);
  function rememberDetails(){root.querySelectorAll('[data-hi-detail]').forEach(node=>{draft.details[node.dataset.hiDetail]=node.open;});}
  function restoreDetails(){root.querySelectorAll('[data-hi-detail]').forEach(node=>{node.open=Boolean(draft.details[node.dataset.hiDetail]);});}
  function flushText(){
    const trial=getHydrolysisTrial(draft),reason=$('[data-hi-reason]'),revision=$('[data-hi-revision]');
    if(reason&&!trial.checked)trial.reason=reason.value;
    if(revision&&trial.checked)trial.revision=revision.value;
    if($('[data-hi-synthesis]'))draft.synthesis=$('[data-hi-synthesis]').value;
  }
  function inputHTML(name,raw){return `<label for="${prefix}-${name}">${esc(inputLabels[name])}<input id="${prefix}-${name}" type="text" inputmode="decimal" autocomplete="off" data-hi-input="${name}" value="${esc(raw)}" aria-describedby="${prefix}-input-note ${prefix}-error"></label>`;}
  function numericHTML(trial){
    const entries=Object.entries(trial.inputs),parts=entries.filter(([name])=>name!=='recovery'&&name!=='independentAsn'&&name!=='reportedAsx');
    return `<p id="${prefix}-input-note" class="hi-small">原創候選量，單位 μmol；候選不是已知真相。改數字看預期報告，再假設分析者只能讀報告。無效輸入會保留原字面文字。</p>
      <div class="hi-candidates">${parts.map(([name,raw])=>inputHTML(name,raw)).join('')}</div>
      <div class="hi-method-controls">${entries.filter(([name])=>!parts.some(([p])=>p===name)).map(([name,raw])=>inputHTML(name,raw)).join('')}</div>
      ${draft.stationId==='paired'?'<p class="hi-small">獨立 Asn 是額外、已驗證的專一資訊；可與 A／B 候選不符。此處以 A 的預期 Asx 當作指定報告作回推，不把合報峰自行拆成 Asn。</p>':''}
      ${draft.stationId==='unknown'?'<p class="hi-small">本題 Asx 報告另外指定，r 未知且沒有正下限（0≤r≤1）。沒有隱藏的「真 r」供反推。候選相容不代表已識別；兩候選都不相容也不排除其他原量。</p>':''}
      <p id="${prefix}-error" data-hi-error class="hi-error" role="alert"></p><div data-hi-observation class="hi-observation" aria-live="polite"></div>`;
  }
  function updateCalculation(){
    const station=getHydrolysisStation(draft.stationId),trial=getHydrolysisTrial(draft),result=evaluateHydrolysis(draft);
    if(station.kind==='numeric'){
      $('[data-hi-error]').textContent=result.valid?'':result.errors.join(' ');
      if(!result.valid)$('[data-hi-observation]').innerHTML='<p>輸入尚未形成有效比較；沒有以 0 代填，也未計算負的原量。</p>';
      else if(draft.stationId==='unknown'){
        $('[data-hi-observation]').innerHTML=`<h4>目前指定報告與候選</h4><p>Asx＝${number(result.reportedAsx)} μmol；r 未知。</p><div class="hi-table-wrap"><table><caption>只比較這兩個候選能否與報告共存</caption><thead><tr><th scope="col">候選</th><th scope="col">Asn＋Asp（μmol）</th><th scope="col">與報告相容？</th></tr></thead><tbody>${result.candidates.map(row=>`<tr><th scope="row">${row.name}</th><td>${number(row.total)}</td><td>${row.compatible?'存在相容的 r':'此候選不相容'}</td></tr>`).join('')}</tbody></table></div><p class="hi-small">相容只表示存在一個允許的 r；不是量得 r，也沒有證明連續所有原組成只剩這兩組。</p>`;
      }else{
        const a=result.candidates[0];
        $('[data-hi-observation]').innerHTML=`<h4>目前預期報告</h4><div class="hi-table-wrap"><table><caption>同一已知回收 r＝${number(result.recovery)}</caption><thead><tr><th scope="col">候選</th><th scope="col">Asn＋Asp（μmol）</th><th scope="col">Asx（μmol）</th></tr></thead><tbody>${result.candidates.map(row=>`<tr><th scope="row">${row.name}</th><td>${number(row.total)}</td><td>${number(row.asx)}</td></tr>`).join('')}</tbody></table></div><p>${result.sameAsx?'這兩個候選產生相同 Asx 報告。':'這兩個候選的 Asx 報告不同。'}</p>${result.inverse?`<p><strong>題設回推器：</strong>Asx＝${number(a.asx)} μmol＋獨立 Asn＝${number(result.independentAsn)} μmol → Asn＝${number(result.inverse.asn)}、Asp＝${number(result.inverse.asp)} μmol。</p><p class="hi-small">回推是否符合候選：A ${result.matchesA?'相符':'不符'}；B ${result.matchesB?'相符':'不符'}。不符時保留差異，不能強配其中一組。</p>`:''}`;
      }
    }
    $('[data-hi-check]').disabled=Boolean(trial.checked)||!trial.current||!result.valid;
    if(trial.checked){
      $('[data-hi-preview-status]').textContent=currentHydrolysisDiffers(draft)?'目前控制已不同於核對快照；下方回饋仍針對保留的那次核對。新比較請寫入修訂。':'目前控制與保留的核對快照相同。';
    }
  }
  function checkedHTML(station,trial){
    if(!trial.checked)return '';
    const checked=trial.checked;
    const raw=Object.entries(checked.inputs).map(([name,value])=>`<li>${esc(inputLabels[name])}：${esc(value)}</li>`).join('');
    return `<h4 data-hi-feedback-heading tabindex="-1">${checked.selection===checked.answer?'核對時的選項符合題設。':'核對時的選項需要修訂。'}</h4><p>${esc(checked.explanation)}</p><p data-hi-preview-status class="hi-preview-status"></p><p data-hi-current-label>目前選擇：${esc(answerLabel(station,trial.current))}（沒有重新核對）</p><label for="${prefix}-revision">對照後，我會保留、撤回或補上什麼？<textarea id="${prefix}-revision" data-hi-revision rows="3" maxlength="800">${textareaValue(trial.revision)}</textarea></label><details class="hi-detail" data-hi-detail="history"><summary>查看保留的初答與核對</summary><p>首次：${esc(answerLabel(station,trial.first?.selection))}</p><p>核對時：${esc(answerLabel(station,checked.selection))}</p><p class="hi-literal">核對時理由：${esc(checked.reason||'未填')}</p>${raw?`<ul>${raw}</ul>`:''}<p class="hi-small">初答的原始控制與理由也保留在完整摘要；後續控制變更不覆寫上述快照。</p></details>`;
  }
  function renderStation({focus=false}={}){
    const station=getHydrolysisStation(draft.stationId),trial=getHydrolysisTrial(draft),index=HYDROLYSIS_STATIONS.findIndex(s=>s.id===station.id);
    $('[data-hi-position]').textContent=`第 ${index+1} / ${HYDROLYSIS_STATIONS.length} 題`;
    $('[data-hi-previous]').disabled=index===0;$('[data-hi-next]').disabled=index===HYDROLYSIS_STATIONS.length-1;
    $('[data-hi-stage]').innerHTML=`<p class="hi-station-label">${esc(station.label)}</p><h4 id="${prefix}-question" data-hi-question tabindex="-1">${esc(station.prompt)}</h4>${station.kind==='numeric'?numericHTML(trial):'<p class="hi-small">原創遷移情境；不是新的實驗結果。</p>'}
      <fieldset class="hi-options" aria-labelledby="${prefix}-question"><legend>我的判斷</legend>${station.options.map(option=>`<label><input type="radio" name="${prefix}-${station.id}" value="${option.id}" data-hi-choice${trial.current===option.id?' checked':''}><span>${esc(option.label)}</span></label>`).join('')}</fieldset>
      <label for="${prefix}-reason">核對前，我的理由（選填）<textarea id="${prefix}-reason" data-hi-reason rows="3" maxlength="800"${trial.checked?' readonly':''}>${textareaValue(trial.reason)}</textarea></label>
      <button type="button" data-hi-check${trial.checked||!trial.current?' disabled':''}>${trial.checked?'已保留這次核對':'保留判斷並核對'}</button>
      <section data-hi-feedback class="hi-feedback" aria-live="polite"${trial.checked?'':' hidden'}>${checkedHTML(station,trial)}</section>
      <details class="hi-detail" data-hi-detail="assumptions"><summary>本題方程、假設與未知</summary><p>${esc(evaluateHydrolysis(draft).assumptions)}</p><p>正向：Asx＝r×(Asn＋Asp)。已知正 r：總量＝Asx/r。另有經驗證的原 Asn 量，才可再算 Asp＝總量−Asn。未知 r 或游離背景新增未知量，不能自動套用同一個唯一解。</p><p>這裡只追 Asn／Asp 的原量資訊，沒有重建序列、全部胺基酸或真實食品回收。自由文字用來自行修訂，不做語意評分。</p></details>`;
    updateCalculation();restoreDetails();if(focus)$('[data-hi-question]')?.focus?.({preventScroll:true});
  }
  function updateSaveStatus(){if(disposed)return;$('[data-hi-save-status]').textContent=record.message;$('[data-hi-save]').disabled=Boolean(record.pending);$('[data-hi-summary]').value=buildHydrolysisSummary(draft);if(record.status==='failed')$('[data-hi-summary-detail]').open=true;}
  const onInput=event=>{
    if(disposed)return;const target=event.target,trial=getHydrolysisTrial(draft);
    if(target.matches('[data-hi-input]')){setHydrolysisInput(draft,target.dataset.hiInput,target.value);updateCalculation();}
    else if(target.matches('[data-hi-reason]')&&!trial.checked)trial.reason=target.value;
    else if(target.matches('[data-hi-revision]')&&trial.checked)trial.revision=target.value;
    else if(target.matches('[data-hi-synthesis]'))draft.synthesis=target.value;
    else return;changed();
  };
  const onChange=event=>{if(disposed||!event.target.matches('[data-hi-choice]'))return;flushText();chooseHydrolysisAnswer(draft,event.target.value);updateCalculation();const trial=getHydrolysisTrial(draft);if(trial.checked)$('[data-hi-current-label]').textContent='目前選擇：'+answerLabel(getHydrolysisStation(draft.stationId),trial.current)+'（沒有重新核對）';changed();};
  const onClick=event=>{
    if(disposed)return;const button=event.target.closest('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.matches('[data-hi-previous]')||button.matches('[data-hi-next]')){const index=HYDROLYSIS_STATIONS.findIndex(s=>s.id===draft.stationId),next=HYDROLYSIS_STATIONS[index+(button.matches('[data-hi-next]')?1:-1)];if(!next)return;flushText();rememberDetails();setHydrolysisStation(draft,next.id);renderStation({focus:true});changed();}
    else if(button.matches('[data-hi-check]')){flushText();rememberDetails();if(checkHydrolysisAnswer(draft)){renderStation();changed();$('[data-hi-feedback-heading]')?.focus?.({preventScroll:true});}}
    else if(button.matches('[data-hi-save]')){flushText();changed();saveWorkbenchSummary(record,onSaveSummary);}
  };
  const onToggle=event=>{if(!disposed&&event.target.matches('[data-hi-detail]'))draft.details[event.target.dataset.hiDetail]=event.target.open;};
  renderStation();updateSaveStatus();const unsubscribe=subscribeWorkbench(record,updateSaveStatus);
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('toggle',onToggle,true);
  return()=>{if(disposed)return;flushText();rememberDetails();disposed=true;unsubscribe();changed();root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);};
}
