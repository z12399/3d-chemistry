import {escapeHTML as esc} from './storage.js';
import {HFCS_PROCESS_ID,HFCS_PROCESS_STAGES,HFCS_MEANING_OPTIONS,HFCS_PROCESS_PROVENANCE,hfcsProcessDraft,evaluateHfcsProcess,hfcsProcessLedger,hfcsProcessSummary} from './hfcs-process-model.js';
import {mountGlcFruEquilibriumLab} from './glc-fru-equilibrium-lab.js';

// Operation memory is owned by the existing progress object, not a new store.
const drafts=new WeakMap();
function memory(owner){
  const fresh=()=>({current:'cut',isomerizeView:'ledger',equilibriumVisited:false,sourcesViewed:false,sourcesOpen:false,save:null,opened:{g5:false,gi:false},entries:Object.fromEntries(HFCS_PROCESS_STAGES.map(stage=>[stage.id,{draft:hfcsProcessDraft(),visited:stage.id==='cut',result:null,revealed:false,referenceOpen:false}]))});
  if(owner&&typeof owner==='object'){if(!drafts.has(owner))drafts.set(owner,fresh());return drafts.get(owner);}return fresh();
}
const options=values=>'<option value="">先選一項</option>'+values.map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('');
const composition=pool=>pool.map(item=>item.mol+' mol '+item.id).join(' ＋ ');
export function mountHfcsProcessLab(host,id=HFCS_PROCESS_ID,{draftOwner,onSaveSummary,onOpenActivity,sources=[]}={}){
  if(id!==HFCS_PROCESS_ID)throw new RangeError('Unknown HFCS process activity');
  const state=memory(draftOwner);let alive=true,equilibrium=null;
  const evidence=HFCS_PROCESS_PROVENANCE.map(item=>{
    const source=sources.find(source=>source.id===item.sourceId),url=item.url||source?.url,label=item.label||source?.title;
    return `<li data-hfcs-provenance="${esc(item.id)}"><p>${esc(item.claim)}</p><p class="learning-small">${esc(item.level)}${url&&/^https:\/\//.test(url)?` <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:''}</p></li>`;
  }).join('');
  host.innerHTML=`<section class="food-experiment lactose-site-lab" aria-labelledby="hfcs-process-title">
    <header><p class="learning-kicker">原 HFCS 課 · 結構與收支</p><h2 id="hfcs-process-title">一條 G5，走過三個製程位置。</h2><p>固定 1 mol 線性 G5（C30H52O26，828 g），四個 α(1→4) 鍵，沒有 α(1→6)。先選一次內切，再理想完全糖化；最後<strong>給定淨 2 mol Glc 轉為 Fru</strong>。</p><p class="food-exp-assumptions">理想純糖教學帳，C=12、H=1、O=16；H₂O=18、Glc/Fru=180 g/mol。不是 HFCS-42／55、產率、平衡或 DE 預測；不算去枝、溶劑過量水、蒸發、分離、酵素或鹽。</p></header>
    <fieldset class="lactose-site-tasks"><legend>在本頁看一個製程位置</legend>${HFCS_PROCESS_STAGES.map(stage=>`<button type="button" data-hfcs-position="${stage.id}" aria-pressed="${state.current===stage.id}">${esc(stage.label)}</button>`).join('')}</fieldset>
    <h3 id="hfcs-position-title" class="learning-level-heading"></h3><p id="hfcs-position-prompt" class="lactose-site-prompt"></p>
    <fieldset id="hfcs-view-switch" class="hfcs-view-switch" hidden><legend>第三位置，先選要回答的問題</legend><button type="button" data-hfcs-view="ledger" aria-pressed="true">本題收支</button><button type="button" data-hfcs-view="equilibrium" aria-pressed="false">同條件平衡</button></fieldset>
    <div id="hfcs-ledger-view">
    <div class="lactose-site-fields"><label for="hfcs-structure">自己的結構判斷<select id="hfcs-structure"></select></label><label for="hfcs-pool">自己的產物 mol 池<select id="hfcs-pool"></select></label><label for="hfcs-water">本段新增耗水（mol）<input id="hfcs-water" type="number" min="0" step="any" inputmode="decimal" style="min-height:44px;min-width:0;width:100%;box-sizing:border-box;font:inherit;border:1px solid #b7c1b0;border-radius:5px;padding:10px 11px;background:#fffefb;color:var(--ink)"></label><label for="hfcs-cumulative">累計耗水（mol）<input id="hfcs-cumulative" type="number" min="0" step="any" inputmode="decimal" style="min-height:44px;min-width:0;width:100%;box-sizing:border-box;font:inherit;border:1px solid #b7c1b0;border-radius:5px;padding:10px 11px;background:#fffefb;color:var(--ink)"></label><label for="hfcs-mass">此段終點糖乾物（g）<input id="hfcs-mass" type="number" min="0" step="any" inputmode="decimal" style="min-height:44px;min-width:0;width:100%;box-sizing:border-box;font:inherit;border:1px solid #b7c1b0;border-radius:5px;padding:10px 11px;background:#fffefb;color:var(--ink)"></label><label id="hfcs-meaning-field" for="hfcs-meaning" hidden>2 mol 是什麼依據？<select id="hfcs-meaning">${options(HFCS_MEANING_OPTIONS)}</select></label></div>
    <p class="learning-small">先填自己的預測；空白不等於 0。數值使用有限非負數，單位各在欄位標籤。</p><div class="lactose-site-check-row"><button id="hfcs-check" type="button" class="button-primary">核對目前預測</button><span id="hfcs-check-status" role="status"></span></div>
    <article id="hfcs-feedback" class="lactose-site-feedback" hidden><h3 id="hfcs-feedback-title"></h3><ul id="hfcs-feedback-reasons"></ul></article>
    <details id="hfcs-reference" class="lactose-site-reference"><summary>比對這一段的參考帳（不代填）</summary><p id="hfcs-reference-equation" class="food-exp-equation"></p><p id="hfcs-reference-water"></p><p id="hfcs-reference-mass"></p><p id="hfcs-reference-elements"></p><p id="hfcs-reference-structure"></p><p>整個純糖帳：828 g G5＋72 g 被耗水＝900 g 糖。水解將水的元素納入糖，糖乾物增加；反應物與產物的總質量仍守恆。不能套濃縮時「糖固形物不變」來算這段水解。</p></details>
    </div><div id="hfcs-equilibrium-view" hidden></div>
    <p id="hfcs-model-boundary" class="lactose-site-boundary"></p><button id="hfcs-open-3d" type="button"></button><span id="hfcs-3d-status" role="status"></span>
    <details id="hfcs-note" class="lactose-site-note"><summary>留下自己的理由與本次操作</summary><label for="hfcs-reason">這個製程位置的理由（選填）</label><textarea id="hfcs-reason" rows="3" maxlength="2000">\n${esc(state.entries[state.current].draft.reason)}</textarea><p class="lactose-site-draft-note">各位置的草稿只在本頁暫留，返回同課可續做。重新載入或關閉前，請附加摘要到本課筆記或自行複製。摘要不會把看過參考當成自己已答對。</p><label for="hfcs-summary">本次摘要（包含未完成位置，可選取複製）</label><textarea id="hfcs-summary" rows="8" readonly></textarea><button id="hfcs-save" type="button">附加到本課筆記</button><span id="hfcs-save-status" role="status"></span></details>
    <details id="hfcs-sources" class="lactose-site-reference" ${state.sourcesOpen?'open':''}><summary>來源與這個模型能說到哪裡</summary><ol>${evidence}</ol></details>
  </section>`;
  const $=selector=>host.querySelector(selector),buttons=[...host.querySelectorAll('[data-hfcs-position]')],viewButtons=[...host.querySelectorAll('[data-hfcs-view]')];
  const fields=Object.fromEntries(['structure','pool','water','cumulative','mass','meaning'].map(field=>[field,$('#hfcs-'+field)]));
  const reason=$('#hfcs-reason'),reference=$('#hfcs-reference'),summary=$('#hfcs-summary'),save=$('#hfcs-save'),saveStatus=$('#hfcs-save-status'),checkStatus=$('#hfcs-check-status'),sourceDetails=$('#hfcs-sources'),open3d=$('#hfcs-open-3d');
  const entry=()=>state.entries[state.current],stage=()=>HFCS_PROCESS_STAGES.find(stage=>stage.id===state.current);
  function refreshSummary(){
    summary.value=hfcsProcessSummary(state)+(state.equilibriumVisited&&equilibrium?'\n\n'+equilibrium.summary():'');
    if(!state.save){saveStatus.textContent='';return;}
    if(state.save.summary===summary.value){saveStatus.textContent=state.save.message;return;}
    saveStatus.textContent=state.save.saved?'操作已改變；目前摘要尚未附加到本課筆記。':'尚未保存；目前摘要已改變，原失敗稿與本次輸入保留。請先複製或重試；未保存草稿不包含在學習紀錄匯出。';
  }
  function invalidate(){entry().result=null;$('#hfcs-feedback').hidden=true;checkStatus.textContent='目前輸入已改變，請重新核對。';saveStatus.textContent='';refreshSummary();}
  function showFeedback(){
    const result=entry().result,feedback=$('#hfcs-feedback');feedback.hidden=!result;
    if(!result){checkStatus.textContent='目前輸入尚未核對。';return;}
    feedback.className='lactose-site-feedback'+(result.correct?' is-correct':'');
    $('#hfcs-feedback-title').textContent=result.correct?'這段結構與收支相符。':result.complete?'已核對，還有項目需要修正。':'欄位還沒完成。';
    $('#hfcs-feedback-reasons').innerHTML=result.feedback.map(text=>`<li>${esc(text)}</li>`).join('');
    checkStatus.textContent=result.correct?(entry().revealed?'與參考相符；已看參考，不是未提示測驗。':'目前輸入核對相符。'):result.complete?'目前輸入已核對，仍需修正。':'空白或無效欄位未完成；不算核對相符。';
  }
  function showPosition(){
    const current=stage(),ledger=hfcsProcessLedger(current.id);entry().visited=true;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hfcsPosition===state.current)));
    $('#hfcs-position-title').textContent=current.label;$('#hfcs-position-prompt').textContent=current.prompt;
    fields.structure.innerHTML=options(current.structure);fields.pool.innerHTML=options(current.pool);
    for(const [field,node] of Object.entries(fields))node.value=entry().draft[field];
    $('#hfcs-meaning-field').hidden=current.id!=='isomerize';fields.meaning.disabled=current.id!=='isomerize';reason.value=entry().draft.reason;
    reference.open=entry().referenceOpen;
    $('#hfcs-reference-equation').textContent=composition(ledger.before)+(ledger.waterMol?' ＋ '+ledger.waterMol+' mol H₂O':'')+' → '+composition(ledger.after);
    $('#hfcs-reference-water').textContent='本段新增耗水 '+ledger.waterMol+' mol；累計 '+ledger.cumulativeWaterMol+' mol（'+ledger.cumulativeWaterMassG+' g）。';
    $('#hfcs-reference-mass').textContent='終點糖乾物：'+ledger.after.map(item=>item.id+' '+item.massG+' g').join(' ＋ ')+'＝'+ledger.sugarMassG+' g。';
    $('#hfcs-reference-elements').textContent='此段 C／H／O 原子 mol 帳（含本段耗水）：左 '+ledger.left.C+'／'+ledger.left.H+'／'+ledger.left.O+'；右 '+ledger.right.C+'／'+ledger.right.H+'／'+ledger.right.O+'。';
    $('#hfcs-reference-structure').textContent=current.explanation;
    $('#hfcs-model-boundary').textContent=current.id==='cut'?'原 G5 卡的 G2、G3 視圖是同一次切鍵的共同產物，不是先後轉換；各模型原子 ID 不是跨分子映射。':current.id==='saccharify'?'這裡只記總中性 D-Glc 池。新釋出的 β-Glc、原還原端與變旋須分開；原 GI 卡選 α 起點，不能把本池直接接成已驗證的即時入酵素軌跡。不預測 α／β 比例或變旋時間。':'Glc 醛 C1 與 Fru 酮 C2 的開鏈代表式同為 C6H12O6。原 GI 第三概念步：GI 可比較 Glc／Fru 的自由開鏈端點，兩者是獨立端點結構；不是氫移位中間體，金屬位與 H 路徑未建模，也沒有 Mg／蛋白／顯式水微態；淨水 0 不等於沒有水或質子參與，不能當成實測連續軌跡。';
    open3d.textContent=current.id==='isomerize'?'看原 GI 的醛／酮 3D 卡 ↗':current.id==='cut'?'看原 G5 單切與共同產物 3D ↗':'回看原 G5 的兩個共同產物 ↗';open3d.disabled=typeof onOpenActivity!=='function';
    $('#hfcs-3d-status').textContent=current.id==='saccharify'?'這個連結是共同產物參考；沒有新建完全糖化 3D 微步。':'';
    save.disabled=typeof onSaveSummary!=='function';saveStatus.textContent='';showFeedback();showView();refreshSummary();
  }
  function showView(){
    const selected=state.current==='isomerize'&&state.isomerizeView==='equilibrium';
    $('#hfcs-view-switch').hidden=state.current!=='isomerize';$('#hfcs-ledger-view').hidden=selected;$('#hfcs-equilibrium-view').hidden=!selected;
    $('#hfcs-model-boundary').hidden=selected;
    viewButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.hfcsView===state.isomerizeView)));
  }
  for(const button of viewButtons)button.onclick=()=>{if(!alive||state.current!=='isomerize'||button.dataset.hfcsView===state.isomerizeView)return;state.isomerizeView=button.dataset.hfcsView;if(state.isomerizeView==='equilibrium')state.equilibriumVisited=true;showView();refreshSummary();if(state.isomerizeView==='equilibrium')equilibrium?.focus();};
  for(const button of buttons)button.onclick=()=>{if(!alive||button.dataset.hfcsPosition===state.current)return;state.current=button.dataset.hfcsPosition;showPosition();};
  for(const [field,node] of Object.entries(fields)){const change=()=>{if(!alive||node.disabled)return;entry().draft=hfcsProcessDraft({...entry().draft,[field]:node.value});invalidate();};if(['water','cumulative','mass'].includes(field))node.oninput=change;else node.onchange=change;}
  reason.oninput=()=>{if(!alive)return;entry().draft=hfcsProcessDraft({...entry().draft,reason:reason.value});invalidate();};
  $('#hfcs-check').onclick=()=>{if(!alive)return;entry().result=evaluateHfcsProcess(state.current,entry().draft);showFeedback();saveStatus.textContent='';refreshSummary();};
  reference.ontoggle=()=>{if(!alive)return;entry().referenceOpen=reference.open;if(reference.open)entry().revealed=true;showFeedback();refreshSummary();};
  sourceDetails.ontoggle=()=>{if(!alive)return;state.sourcesOpen=sourceDetails.open;if(sourceDetails.open)state.sourcesViewed=true;refreshSummary();};
  open3d.onclick=()=>{
    if(!alive||typeof onOpenActivity!=='function')return;
    const key=state.current==='isomerize'?'gi':'g5',activity={type:'reaction',id:key==='gi'?'glucose-isomerase-metal-hydride-transfer':'starch-alpha-amylase-g5-single-cut'};
    try{if(onOpenActivity(activity)===true){state.opened[key]=true;refreshSummary();}else $('#hfcs-3d-status').textContent='尚未開啟原卡；本頁操作草稿保留。';}
    catch(error){$('#hfcs-3d-status').textContent='尚未開啟原卡：'+(error?.message||'無法開啟。')+' 本頁操作草稿保留。';}
  };
  save.onclick=()=>{
    if(!alive||typeof onSaveSummary!=='function')return;refreshSummary();const text=summary.value;
    try{const saved=onSaveSummary(text);state.save={summary:text,saved:saved===true,message:saved===true?'已附加本次摘要到本課筆記。':'尚未保存；摘要與輸入保留，可先複製或重試。未保存草稿不包含在學習紀錄匯出。'};}
    catch(error){state.save={summary:text,saved:false,message:'尚未保存：'+(error?.message||'儲存失敗。')+' 摘要與輸入保留；請先複製。未保存草稿不包含在學習紀錄匯出。'};}
    refreshSummary();
  };
  equilibrium=mountGlcFruEquilibriumLab($('#hfcs-equilibrium-view'),{draftOwner,onChange:()=>{if(!alive)return;state.equilibriumVisited=true;refreshSummary();}});
  showPosition();
  return ()=>{alive=false;equilibrium?.();for(const button of [...buttons,...viewButtons])button.onclick=null;for(const node of Object.values(fields)){node.oninput=null;node.onchange=null;}reason.oninput=null;reference.ontoggle=null;sourceDetails.ontoggle=null;$('#hfcs-check').onclick=null;save.onclick=null;open3d.onclick=null;};
}
