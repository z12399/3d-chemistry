import {escapeHTML as esc} from './storage.js';
import {mountLactaseMolecularLab} from './lactase-molecular-lab.js';
import {mountLactaseCatalyticLab} from './lactase-catalytic-lab.js';

const drafts=new WeakMap();
const PANELS=[['structure','蛋白質立體結構'],['mechanism','分子作用方式'],['production','從基因到酵素'],['regulation','表現如何調控']];
const ACTIVITY='human-lactase-evidence';
const DATA_URL='./data/lactase-evidence.json';
const SUMMARY_LIMIT=10000;
let sequence=0;
const fresh=()=>({panel:new URLSearchParams(globalThis.location?.search||'').get('lphview')==='reaction'?'mechanism':'structure',structureObservationSource:'molecular',reactionProgress:null,formId:'dimer',chainId:'A',domainId:'IV',mechanismId:'binding',productionId:'',regulationId:'',prediction:'',revision:'',observations:[],savedSummaries:new Set()});
const textString=value=>typeof value==='string'&&value.trim().length>0;
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,90}$/.test(value);
const options=items=>items.map(item=>`<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');
const sourceText=value=>Array.isArray(value)?value.filter(x=>typeof x==='string').join('；'):typeof value==='string'?value:'';

function safeUrl(value){
  try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
  return null;
}
function link(url,label){const href=safeUrl(url);return href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:esc(label);}
function chainLabels(form){return Array.isArray(form.chains)?form.chains: Array.from({length:form.chains},(_,i)=>String.fromCharCode(65+i));}

/** Reject inconsistent source references before showing any scientific readout. */
export function validateLactaseDataset(data){
  const fail=()=>{throw new TypeError('乳糖酶來源資料格式不完整或互相矛盾。');};
  if(!data||data.schema!=='lactase-evidence/v1'||!textString(data.title)||!textString(data.overview))fail();
  const list=(items,min=1,max=50)=>{if(!Array.isArray(items)||items.length<min||items.length>max)fail();return items;};
  const unique=items=>{const seen=new Set();for(const item of items){if(!item||!validId(item.id)||seen.has(item.id))fail();seen.add(item.id);}return seen;};
  const sources=list(data.sources,1,100),sourceIds=unique(sources);
  for(const source of sources)if(!textString(source.title)||!safeUrl(source.url)||!textString(sourceText(source.evidence)))fail();
  const refs=item=>{const values=list(item.sourceIds,1,100);if(new Set(values).size!==values.length||values.some(id=>!sourceIds.has(id)))fail();};
  for(const item of list(data.comparison,2,12)){
    for(const key of ['organism','protein','family','assembly','scope'])if(!textString(item[key]))fail();
    if(item.sourceIds!==undefined)refs(item);
  }
  const structure=data.structure;
  if(!structure)fail();
  for(const key of ['title','intro','limit'])if(!textString(structure[key]))fail();
  const domains=list(structure.domains,1,20),domainIds=unique(domains);
  for(const domain of domains){if(!textString(domain.label)||!textString(domain.role))fail();refs(domain);}
  const forms=list(structure.forms,1,10);unique(forms);
  for(const form of forms){
    if(!textString(form.label)||!textString(form.text))fail();
    if(Array.isArray(form.chains)){
      if(form.chains.length<1||form.chains.length>6||new Set(form.chains).size!==form.chains.length||form.chains.some(x=>!validId(x)))fail();
    }else if(!Number.isInteger(form.chains)||form.chains<1||form.chains>6)fail();
    const values=list(form.domains,1,20);
    if(new Set(values).size!==values.length||values.some(id=>!domainIds.has(id)))fail();refs(form);
  }
  for(const [key,collection] of [['mechanism','steps'],['production','steps'],['regulation','cases']]){
    const section=data[key];if(!section||!textString(section.title)||!textString(section.scope))fail();
    const items=list(section[collection],1,30);unique(items);
    for(const item of items){for(const property of ['label','diagram','detail'])if(!textString(item[property]))fail();refs(item);}
  }
  if(!textString(data.mechanism.equation))fail();
  for(const item of list(data.limits,1,30))if(!textString(item))fail();
  return data;
}

/** Returns immediately; route disposal owns fetch and save lifetime. */
export function mountLactaseLab(root,{draftOwner,onSaveSummary,fetcher=globalThis.fetch,molecularMounter=mountLactaseMolecularLab,catalyticMounter=mountLactaseCatalyticLab}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  const owned=draftOwner!==null&&(typeof draftOwner==='object'||typeof draftOwner==='function');
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const draft=owned?drafts.get(draftOwner):fresh(),prefix=`lactase-${++sequence}`;
  const $=selector=>root.querySelector(selector),$$=selector=>Array.from(root.querySelectorAll(selector));
  const field=name=>$(`[data-lactase-${name}]`),action=name=>$(`[data-lactase-action="${name}"]`);
  let disposed=false,data=null,loading=true,loadEpoch=0,saveEpoch=0,aborter=null,saving=false;
  let molecularDispose=null,catalyticDispose=null,molecularObservation=null,reactionObservation=null,childrenMounted=false;
  let dataStatus='正在讀取並核對人類乳糖酶的來源資料…',feedback='',saveStatus='',drawnForm='';

  root.innerHTML=`<section class="lactase-lab" data-lactase-lab="${ACTIVITY}" aria-labelledby="${prefix}-title">
    <header class="lactase-heading lactase-sr-only"><p class="lactase-kicker">人類消化酵素 · 結構、反應與基因</p><h2 id="${prefix}-title">乳糖酶：從一段 DNA 到小腸表面的反應</h2></header>
    <p class="lactase-load-status" role="status" data-lactase-data-status></p><button type="button" data-lactase-action="retry" hidden>重試讀取來源資料</button>
    <div class="lactase-tabs" role="tablist" aria-label="乳糖酶的四個證據層次">${PANELS.map(([id,label],i)=>`<button type="button" role="tab" id="${prefix}-tab-${id}" aria-controls="${prefix}-panel-${id}" aria-selected="${draft.panel===id}" tabindex="${draft.panel===id?0:-1}" data-lactase-tab="${id}"><small>0${i+1}</small>${label}</button>`).join('')}</div>
    <div data-lactase-workspace hidden>
      <section class="lactase-panel" id="${prefix}-panel-structure" role="tabpanel" aria-labelledby="${prefix}-tab-structure" data-lactase-panel="structure">
        <div data-lactase-molecular-host></div>
        <details class="lactase-auxiliary"><summary>同源區與二聚組裝的文獻示意</summary>
        <h3 data-lactase-structure-title>聚合與結構域</h3><p data-lactase-structure-intro></p>
        <div class="lactase-two-column"><div class="lactase-visual">
          <label class="lactase-field" for="${prefix}-form">選擇要比較的形式<select id="${prefix}-form" data-lactase-form disabled></select></label>
          <div class="lactase-structure-figure" data-lactase-structure-figure role="group" aria-label="可選取肽鏈與結構域的序列示意"></div>
          <p class="lactase-counts" data-lactase-structure-counts></p>
          <p class="lactase-scope" data-lactase-structure-limit></p>
          <p class="lactase-small">方塊排列只表示同一條鏈的區段順序。二聚體圖是概念示意，沒有原子座標或接觸界面；分開顯示兩條鏈也不表示正在解離。</p>
        </div><aside class="lactase-evidence" aria-label="結構選取的來源解釋">
          <p class="lactase-eyebrow">目前選取</p><h4 data-lactase-structure-selected></h4><p data-lactase-form-detail></p><p data-lactase-domain-detail></p><div class="lactase-source-links" data-lactase-structure-sources></div>
        </aside></div>
        </details>
        <details class="lactase-comparison"><summary>人類酵素與常見的細菌參考，是同一種結構嗎？</summary><div data-lactase-comparison></div></details>
      </section>
      <section class="lactase-panel" id="${prefix}-panel-mechanism" role="tabpanel" aria-labelledby="${prefix}-tab-mechanism" data-lactase-panel="mechanism" hidden>
        <h3 data-lactase-mechanism-title>乳糖的水解</h3><p class="lactase-equation" data-lactase-equation></p>
        <div data-lactase-catalytic-host></div>
        <details class="lactase-auxiliary"><summary>逐步反應符號與文獻說明</summary>
        <div class="lactase-two-column"><div class="lactase-visual">
          <label class="lactase-field" for="${prefix}-mechanism">選取反應狀態<select id="${prefix}-mechanism" data-lactase-mechanism disabled></select></label>
          <div class="lactase-mechanism-board" data-lactase-mechanism-figure role="img" aria-label="乳糖酶水解反應的符號示意"></div>
          <p class="lactase-stage-diagram" data-lactase-mechanism-diagram></p>
          <div class="lactase-actions"><button type="button" data-lactase-action="mechanism-prev" disabled>上一個狀態</button><span data-lactase-mechanism-count></span><button type="button" data-lactase-action="mechanism-next" disabled>下一個狀態</button></div>
          <p class="lactase-scope" data-lactase-mechanism-scope></p><p class="lactase-small">符號表示鍵與催化步驟，不是原子幾何。按下一個狀態是在選讀機構，沒有模擬反應時間、速率或粒子運動。</p>
        </div><aside class="lactase-evidence" aria-label="目前反應狀態的來源解釋"><p class="lactase-eyebrow">目前選取</p><h4 data-lactase-mechanism-selected></h4><p data-lactase-mechanism-detail></p><div class="lactase-source-links" data-lactase-mechanism-sources></div></aside></div></details>
      </section>
      <section class="lactase-panel" id="${prefix}-panel-production" role="tabpanel" aria-labelledby="${prefix}-tab-production" data-lactase-panel="production" hidden>
        <h3 class="lactase-sr-only" data-lactase-production-title>從編碼到成熟蛋白</h3><p class="lactase-panel-identity">生合成路徑 · 文獻示意</p>
        <div class="lactase-stage-buttons" role="group" aria-label="選取乳糖酶生合成階段" data-lactase-production-buttons></div>
        <div class="lactase-two-column lactase-current-evidence"><div class="lactase-visual"><div class="lactase-production-board"><strong data-lactase-production-board-title></strong><p class="lactase-stage-diagram" data-lactase-production-diagram></p></div></div><aside class="lactase-evidence" aria-label="目前生合成階段的來源解釋"><h4 class="lactase-sr-only" data-lactase-production-selected></h4><p data-lactase-production-detail></p></aside></div>
        <details class="lactase-panel-evidence"><summary>此階段的來源與流程界線</summary><div class="lactase-source-links" data-lactase-production-sources></div><p class="lactase-scope" data-lactase-production-scope></p><p class="lactase-small">選一站，查看 DNA、RNA、蛋白質與細胞位置之間發生了什麼。每站附上它所依據的來源。</p><div class="lactase-process-key" aria-label="編碼與加工的不同層次"><span>DNA 編碼</span><span aria-hidden="true">→</span><span>RNA 轉錄本</span><span aria-hidden="true">→</span><span>蛋白質與加工</span></div><p class="lactase-small">這是來源整理的製造路徑，不是細胞內的時間動畫。各項加工的部位與次序，以所選階段的描述為準。</p></details>
      </section>
      <section class="lactase-panel" id="${prefix}-panel-regulation" role="tabpanel" aria-labelledby="${prefix}-tab-regulation" data-lactase-panel="regulation" hidden>
        <h3 class="lactase-sr-only" data-lactase-regulation-title>表現如何調控</h3><p class="lactase-panel-identity">定性調控 · 不推算個人酵素量或耐受量</p>
        <label class="lactase-field" for="${prefix}-regulation">調控情境<select id="${prefix}-regulation" data-lactase-regulation disabled></select></label>
        <div class="lactase-two-column lactase-current-evidence"><div class="lactase-visual"><div class="lactase-regulation-board"><strong data-lactase-regulation-board-title></strong><p class="lactase-stage-diagram" data-lactase-regulation-diagram></p></div></div><aside class="lactase-evidence" aria-label="目前調控情境的來源解釋"><h4 class="lactase-sr-only" data-lactase-regulation-selected></h4><p data-lactase-regulation-detail></p></aside></div>
        <details class="lactase-panel-evidence"><summary>此情境的來源與推論界線</summary><div class="lactase-source-links" data-lactase-regulation-sources></div><p class="lactase-scope" data-lactase-regulation-scope></p><p class="lactase-small">比較不同調控情境，辨認「編碼酵素」與「影響何時、何處、多少轉錄」的證據。</p><div class="lactase-regulation-layers"><span>DNA 調控區與細胞狀態</span><span aria-hidden="true">↓</span><span>轉錄與酵素表現</span><span aria-hidden="true">↓</span><span>小腸表面的乳糖水解能力</span></div><p class="lactase-small">本課不計算個人酵素量，也不由單一基因型預測症狀、耐受量或診斷結果。</p></details>
      </section>
    </div>
    <details class="lactase-prediction-details"><summary>課程說明與操作前預測</summary><p data-lactase-overview>先分清人類乳糖酶與細菌 β-半乳糖苷酶，再追蹤結構、催化與表現的不同證據。</p><div class="lactase-prediction"><div><h3>先留下你的預測</h3><p>四個結構域就代表四條鏈嗎？基因序列相同，就一定會有相同的酵素量嗎？先寫下理由，操作後再修訂。</p></div><label class="lactase-field" for="${prefix}-prediction">操作前的預測<textarea id="${prefix}-prediction" rows="3" maxlength="1800" data-lactase-prediction placeholder="可以先選一個問題，寫出目前的判斷與理由。"></textarea></label></div></details>
    <div data-lactase-record-workspace hidden><div class="lactase-record-controls"><div><span class="lactase-eyebrow">把所選狀態留作證據</span><p data-lactase-current></p></div><button type="button" class="lactase-primary" data-lactase-action="record" disabled>記錄目前觀察</button></div><p class="lactase-feedback" role="status" data-lactase-feedback></p></div>
    <section class="lactase-reflection" aria-labelledby="${prefix}-reflection"><h3 id="${prefix}-reflection">保留觀察，再修訂你的解釋</h3><div class="lactase-original"><strong>操作前的預測</strong><p data-lactase-original></p></div><label class="lactase-field" for="${prefix}-revision">操作後的解釋與修訂<textarea id="${prefix}-revision" rows="4" maxlength="2600" data-lactase-revision placeholder="選一項觀察支持你的解釋，再說明來源不能支持哪一項推論。"></textarea></label>
      <details class="lactase-records"><summary>已記錄的觀察 <span data-lactase-record-count></span></summary><div data-lactase-records></div><button type="button" data-lactase-action="clear" disabled>清空觀察紀錄</button><p class="lactase-small">只清空所選觀察；預測與修訂文字仍保留。</p></details>
      <details class="lactase-summary"><summary>查看並保存本次摘要</summary><label class="lactase-field" for="${prefix}-summary">自己的文字、所選狀態與來源<textarea id="${prefix}-summary" rows="10" readonly data-lactase-summary></textarea></label><p class="lactase-small" data-lactase-summary-count></p><p class="lactase-summary-warning" role="status" data-lactase-summary-warning></p><div class="lactase-actions"><button type="button" data-lactase-action="select-summary">選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" class="lactase-primary" data-lactase-action="save" disabled>附加到本課筆記</button>':''}</div><p role="status" data-lactase-save-status></p><p class="lactase-small">操作與未保存文字只在本頁暫留；重新整理前請保存或複製。查看資料與保存摘要不代表已掌握，也不替自己的短答評分。</p></details>
    </section>
    <details class="lactase-source-catalog"><summary>文獻、資料庫與證據界線</summary><div data-lactase-source-catalog><p>來源資料載入後，會列出可核對的連結。</p></div></details>
  </section>`;
  field('prediction').value=draft.prediction;field('revision').value=draft.revision;

  const find=(items,id)=>items.find(item=>item.id===id)||items[0];
  const selectedForm=()=>data?find(data.structure.forms,draft.formId):null;
  const selectedDomain=()=>data?find(data.structure.domains.filter(item=>selectedForm().domains.includes(item.id)),draft.domainId):null;
  const selectedStep=panel=>data?find(data[panel][panel==='regulation'?'cases':'steps'],draft[`${panel}Id`]):null;
  function sourceMarkup(ids){return [...new Set(ids)].map(id=>{const source=data.sources.find(item=>item.id===id);return source?`<li>${link(source.url,source.title)}${source.year?` <span>（${esc(source.year)}）</span>`:''}</li>`:'';}).join('');}
  function setSources(panel,ids){field(`${panel}-sources`).innerHTML=`<p class="lactase-small">此處依據</p><ul>${sourceMarkup(ids)}</ul>`;}
  function normalizeSelections(){
    if(!PANELS.some(([id])=>id===draft.panel))draft.panel='structure';
    if(!['molecular','assembly'].includes(draft.structureObservationSource))draft.structureObservationSource='molecular';
    draft.formId=selectedForm().id;
    const labels=chainLabels(selectedForm());if(!labels.includes(draft.chainId))draft.chainId=labels[0];
    if(!selectedForm().domains.includes(draft.domainId))draft.domainId=selectedForm().domains.includes('IV')?'IV':selectedForm().domains[0];
    for(const panel of ['mechanism','production','regulation'])draft[`${panel}Id`]=selectedStep(panel).id;
  }
  function currentObservation(){
    if(!data)return null;
    const panelLabel=PANELS.find(([id])=>id===draft.panel)[1];
    if(draft.panel==='structure'){
      if(draft.structureObservationSource==='molecular'&&molecularObservation)return {panel:'structure',panelLabel,...molecularObservation,sourceIds:[...molecularObservation.sourceIds]};
      const form=selectedForm(),domain=selectedDomain(),chainCount=chainLabels(form).length;
      return {panel:'structure',panelLabel,stateId:`${form.id}:${draft.chainId}:${domain.id}`,label:`${form.label} · ${draft.chainId} 鏈 · ${domain.label}`,detail:`${chainCount} 條鏈。${form.text}\n選取區段：${domain.role}`,sourceIds:[...new Set([...form.sourceIds,...domain.sourceIds])]};
    }
    const item=selectedStep(draft.panel);
    if(draft.panel==='mechanism'&&reactionObservation)return {panel:'mechanism',panelLabel,stateId:`${item.id}:${reactionObservation.progress.toFixed(4)}`,label:`${reactionObservation.label} · ${(reactionObservation.progress*100).toFixed(1)}%`,detail:`${reactionObservation.detail}\n${item.detail}`,sourceIds:[...new Set([...item.sourceIds,...reactionObservation.sourceIds])]};
    return {panel:draft.panel,panelLabel,stateId:item.id,label:item.label,detail:`${item.diagram}\n${item.detail}`,sourceIds:[...item.sourceIds]};
  }
  function summary(){
    const current=currentObservation();
    const sourceIds=[...new Set([...(current?.sourceIds||[]),...draft.observations.flatMap(item=>item.sourceIds)])];
    return [data?.title||'人類乳糖酶：結構、作用機制與基因表現',
      '活動：human-lactase-evidence；蛋白 3D 使用人體 LPH AlphaFold v6 單鏈預測座標。連續反應 3D 是獨立建構、可回看的局部化學教材與人工插值；二聚組裝另為文獻示意，未提供實驗結合姿勢、反應速率或個人症狀預測。',
      `操作前預測：\n${draft.prediction||'（未填）'}`,
      current?`目前選取（尚未自動加入觀察）：\n${current.panelLabel}｜${current.label}\n${current.detail}\n來源 ID：${current.sourceIds.join('、')}`:'來源資料尚未讀取或未通過核對，沒有可確認的所選狀態。',
      `已記錄的觀察：\n${draft.observations.length?draft.observations.map((item,i)=>`${i+1}. ${item.panelLabel}｜${item.label}\n${item.detail}\n來源 ID：${item.sourceIds.join('、')}`).join('\n\n'):'（尚未記錄）'}`,
      `操作後的解釋與修訂：\n${draft.revision||'（未填）'}`,
      data&&sourceIds.length?`本次選取與觀察的來源：\n${sourceIds.map(id=>{const source=data.sources.find(item=>item.id===id);return source?`[${id}] ${source.title}\n${safeUrl(source.url)}`:`[${id}] 目前資料未列出；保留原紀錄待核對。`;}).join('\n')}`:'',
      '結構域數不等於肽鏈數；人類 LPH 的概念二聚體不能拿 E. coli LacZ 的四聚體結構替代。來源描述與自己的解釋分開保存，短答未自動評分。'].filter(Boolean).join('\n\n');
  }
  function drawSummary(){
    if(disposed)return;
    const value=summary();field('summary').value=value;field('original').textContent=draft.prediction||'（尚未填寫；可展開「課程說明與操作前預測」留下預測。）';
    field('summary-count').textContent=`本次摘要 ${value.length.toLocaleString()} / 10,000 字元；本課既有筆記也計入保存上限。`;
    field('summary-warning').textContent=value.length>SUMMARY_LIMIT?'本次摘要超過筆記上限。請先選取並複製全文，再移除不需要的觀察或縮短自己的文字；整理後可保存。':'';
    field('save-status').textContent=saveStatus;
    const button=action('save');if(button){button.disabled=!data||saving||value.length>SUMMARY_LIMIT||draft.savedSummaries.has(value);button.textContent=saving?'正在保存…':'附加到本課筆記';}
  }
  function drawRecords(){
    if(disposed)return;
    field('record-count').textContent=`（${draft.observations.length} / 16）`;
    field('records').innerHTML=draft.observations.length?`<ol>${draft.observations.map((item,i)=>`<li><span class="lactase-eyebrow">${esc(item.panelLabel)}</span><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p>${data?`<ul class="lactase-record-source-list">${sourceMarkup(item.sourceIds)}</ul>`:`<p class="lactase-small">原紀錄來源 ID：${esc(item.sourceIds.join('、'))}；待來源資料讀取後核對。</p>`}<button type="button" data-lactase-remove="${i}" aria-label="移除觀察：${esc(item.label)}">移除此項觀察</button></li>`).join('')}</ol>`:'<p class="lactase-small">尚未記錄。選取一個狀態，再按「記錄目前觀察」。</p>';
    action('clear').disabled=draft.observations.length===0;
  }
  function domainToken(domain){return {signal:'訊號',membrane:'膜錨'}[domain.id]||(/^(I|II|III|IV)$/.test(domain.id)?domain.id:domain.label);}
  function drawStructure(){
    if(!data||disposed)return;
    const form=selectedForm(),domain=selectedDomain(),labels=chainLabels(form);
    field('form').value=form.id;
    if(drawnForm!==form.id){
      field('structure-figure').innerHTML=`<p class="lactase-small">由 N 端到 C 端的區段順序；點選區段查來源</p>${labels.map(chain=>`<div class="lactase-chain" data-lactase-chain-row="${esc(chain)}"><button type="button" class="lactase-chain-button" aria-pressed="${chain===draft.chainId}" data-lactase-chain="${esc(chain)}">${esc(chain)} 鏈</button><div class="lactase-domain-row">${form.domains.map(id=>{const item=data.structure.domains.find(domain=>domain.id===id);return `<button type="button" class="lactase-domain lactase-domain-${['I','II','III','IV','signal','membrane'].includes(id)?id:'other'}" data-lactase-domain="${esc(id)}" data-lactase-domain-chain="${esc(chain)}" aria-label="${esc(chain)} 鏈：${esc(item.label)}" aria-pressed="false"><span>${esc(domainToken(item))}</span><small>${id==='signal'?'N 端序列':id==='membrane'?'C 端區段':'結構域'}</small></button>`;}).join('')}</div></div>`).join('')}<div class="lactase-brush-border"><span>${form.id==='precursor'?'分泌路徑的腔側':'小腸腸腔'}</span><span class="lactase-membrane-line" aria-hidden="true"></span><span>${form.id==='precursor'?'分泌路徑膜系統（示意）':'刷狀緣膜（示意）'}</span></div>`;
      drawnForm=form.id;
    }
    for(const button of $$('[data-lactase-chain]'))button.setAttribute('aria-pressed',String(button.dataset.lactaseChain===draft.chainId));
    for(const row of $$('[data-lactase-chain-row]'))row.classList.toggle('is-selected',row.dataset.lactaseChainRow===draft.chainId);
    for(const button of $$('[data-lactase-domain]'))button.setAttribute('aria-pressed',String(button.dataset.lactaseDomain===domain.id&&button.dataset.lactaseDomainChain===draft.chainId));
    const count=form.domains.filter(id=>!['signal','membrane'].includes(id)).length;
    field('structure-counts').textContent=`${labels.length} 條肽鏈 · 每鏈 ${count} 個結構域${form.domains.includes('signal')?'，另標示訊號序列':''}${form.domains.includes('membrane')?'與膜錨區段':''}。結構域數 ≠ 鏈數。`;
    field('structure-selected').textContent=`${draft.chainId} 鏈 · ${domain.label}`;
    field('form-detail').textContent=form.text;field('domain-detail').textContent=domain.role;
    setSources('structure',[...form.sourceIds,...domain.sourceIds]);
  }
  function mechanismSymbols(id){
    if(id==='binding')return '<div class="lactase-sugar-pair"><span class="lactase-sugar">Gal</span><span class="lactase-bond">β(1→4)<br>— O —</span><span class="lactase-sugar glucose">Glc</span></div><div class="lactase-enzyme-pocket">人類 LPH · 結構域 IV<br><small>選取：底物辨識與結合</small></div>';
    if(id==='glycosylation')return '<div class="lactase-covalent"><span class="lactase-residue">E1749</span><span class="lactase-bond">— O —</span><span class="lactase-sugar">α-Gal</span></div><div class="lactase-released"><span>Glc 釋出</span></div><div class="lactase-enzyme-pocket">酵素－半乳糖共價中間體<br><small>第一次立體反轉</small></div>';
    if(id==='deglycosylation')return '<div class="lactase-water">H₂O →</div><div class="lactase-covalent"><span class="lactase-residue">E1749</span><span class="lactase-bond">— O —</span><span class="lactase-sugar">α-Gal</span></div><div class="lactase-enzyme-pocket">水參與中間體水解<br><small>第二次立體反轉</small></div>';
    if(id==='products')return '<div class="lactase-sugar-pair"><span class="lactase-sugar">β-Gal</span><span class="lactase-bond">＋</span><span class="lactase-sugar glucose">Glc</span></div><div class="lactase-enzyme-pocket">酵素回復可再催化的狀態<br><small>初生 Gal 保留 β 構型；之後可變旋</small></div>';
    return '<div class="lactase-enzyme-pocket">人類 LPH · 反應狀態<br><small>以此狀態的來源文字為準</small></div>';
  }
  function drawMechanism(){
    if(!data||disposed)return;
    const step=selectedStep('mechanism'),index=data.mechanism.steps.findIndex(item=>item.id===step.id);
    catalyticDispose?.setStage?.(step.id,{silent:true});
    field('mechanism').value=step.id;field('mechanism-figure').innerHTML=mechanismSymbols(step.id);
    field('mechanism-figure').setAttribute('aria-label',`${step.label}：${step.diagram}`);
    field('mechanism-diagram').textContent=step.diagram;field('mechanism-selected').textContent=step.label;
    field('mechanism-detail').textContent=step.detail;field('mechanism-count').textContent=`${index+1} / ${data.mechanism.steps.length}`;
    action('mechanism-prev').disabled=index===0;action('mechanism-next').disabled=index===data.mechanism.steps.length-1;
    setSources('mechanism',step.sourceIds);
  }
  function drawProduction(){
    if(!data||disposed)return;
    const step=selectedStep('production');
    for(const button of $$('[data-lactase-production-step]'))button.setAttribute('aria-pressed',String(button.dataset.lactaseProductionStep===step.id));
    field('production-board-title').textContent=step.label;field('production-diagram').textContent=step.diagram;
    field('production-selected').textContent=step.label;field('production-detail').textContent=step.detail;
    setSources('production',step.sourceIds);
  }
  function drawRegulation(){
    if(!data||disposed)return;
    const item=selectedStep('regulation');field('regulation').value=item.id;
    field('regulation-board-title').textContent=item.label;field('regulation-diagram').textContent=item.diagram;
    field('regulation-selected').textContent=item.label;field('regulation-detail').textContent=item.detail;
    setSources('regulation',item.sourceIds);
  }
  function drawCurrent(){
    if(disposed)return;const current=currentObservation();
    field('current').textContent=current?`${current.panelLabel}｜${current.label}`:'來源資料尚未讀取。';
    action('record').disabled=!data||draft.observations.length>=16;
    field('feedback').textContent=feedback;drawSummary();
  }
  function drawTabs(){
    if(disposed)return;
    for(const button of $$('[data-lactase-tab]')){const active=button.dataset.lactaseTab===draft.panel;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
    for(const panel of $$('[data-lactase-panel]'))panel.hidden=panel.dataset.lactasePanel!==draft.panel;
    drawCurrent();
  }
  function fillDataset(){
    field('overview').textContent=data.overview;
    field('structure-title').textContent=data.structure.title;field('structure-intro').textContent=data.structure.intro;
    field('structure-limit').textContent=data.structure.limit;field('form').innerHTML=options(data.structure.forms);field('form').disabled=false;
    field('comparison').innerHTML=`<table><caption>先確認物種與酵素家族，再判讀組裝；同樣水解乳糖不代表同一種蛋白。</caption><thead><tr><th scope="col">來源物種與蛋白</th><th scope="col">家族與組裝</th><th scope="col">可以支持的範圍</th></tr></thead><tbody>${data.comparison.map(item=>`<tr><th scope="row">${esc(item.organism)}<br><span>${esc(item.protein)}</span></th><td>${esc(item.family)}<br>${esc(item.assembly)}</td><td>${esc(item.scope)}${item.sourceIds?`<ul class="lactase-record-source-list">${sourceMarkup(item.sourceIds)}</ul>`:''}</td></tr>`).join('')}</tbody></table>`;
    for(const panel of ['mechanism','production','regulation']){field(`${panel}-title`).textContent=data[panel].title;field(`${panel}-scope`).textContent=data[panel].scope;}
    field('equation').textContent=data.mechanism.equation;field('mechanism').innerHTML=options(data.mechanism.steps);field('mechanism').disabled=false;
    field('production-buttons').innerHTML=data.production.steps.map(item=>`<button type="button" data-lactase-production-step="${esc(item.id)}" aria-pressed="false"><span>${esc(item.label)}</span></button>`).join('');
    field('regulation').innerHTML=options(data.regulation.cases);field('regulation').disabled=false;
    field('source-catalog').innerHTML=`<p class="lactase-load-status">來源資料已核對 · ${data.sources.length} 筆</p><p class="lactase-small">圖旁列出當前選取依據。文獻與資料庫各自回答的問題，以這裡的「證據用途」為準。</p><ol>${data.sources.map(source=>`<li>${link(source.url,source.title)}${source.year?`（${esc(source.year)}）`:''}<p>證據用途：${esc(sourceText(source.evidence))}</p><span class="lactase-source-id">來源 ID：${esc(source.id)}</span></li>`).join('')}</ol><h4>本課沒有建立的結論</h4><ul>${data.limits.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
    drawnForm='';drawStructure();drawMechanism();drawProduction();drawRegulation();drawRecords();drawTabs();
    if(!childrenMounted){
      childrenMounted=true;
      molecularDispose=molecularMounter(field('molecular-host'),{draftOwner,fetcher,onState:(item,metadata)=>{if(disposed)return;molecularObservation=item;if(metadata?.reason==='interaction')draft.structureObservationSource='molecular';changed();drawCurrent();}});
      catalyticDispose=catalyticMounter(field('catalytic-host'),{fetcher,initialStage:draft.mechanismId,initialProgress:draft.reactionProgress,onStage:item=>{if(disposed||!data||!data.mechanism.steps.some(step=>step.id===item.id))return;const moved=draft.mechanismId!==item.id;draft.mechanismId=item.id;if(item.animation){reactionObservation=item.animation;draft.reactionProgress=item.animation.progress;}if(moved)drawMechanism();changed();drawCurrent();}});
    }
  }
  function drawLoading(){
    if(disposed)return;
    field('data-status').textContent=dataStatus;field('data-status').hidden=!!data;action('retry').hidden=loading||!!data;
    field('workspace').hidden=!data;field('record-workspace').hidden=!data;drawCurrent();drawSummary();
  }
  async function load(){
    if(disposed)return;
    const epoch=++loadEpoch;aborter?.abort();aborter=typeof AbortController==='function'?new AbortController():null;
    loading=true;data=null;dataStatus='正在讀取並核對人類乳糖酶的來源資料…';drawLoading();
    try{
      if(typeof fetcher!=='function')throw new TypeError('No data fetcher');
      const response=await fetcher(DATA_URL,aborter?{signal:aborter.signal}:{});
      if(!response||response.ok===false||typeof response.json!=='function')throw new Error('Source data unavailable');
      const result=validateLactaseDataset(await response.json());
      if(disposed||epoch!==loadEpoch)return;
      data=result;normalizeSelections();loading=false;dataStatus=`來源資料已核對 · ${data.sources.length} 筆`;
      fillDataset();drawLoading();
    }catch(error){
      if(disposed||epoch!==loadEpoch)return;
      loading=false;data=null;dataStatus='來源資料暫時無法讀取或未通過核對。預測與修訂仍保留；可重試，或先複製文字。';drawLoading();
    }
  }
  function changed(){feedback='';if(!saving)saveStatus='';}
  function setPanel(id,{focus=false}={}){
    if(!PANELS.some(([panel])=>panel===id))return;
    draft.panel=id;changed();drawTabs();
    if(focus)$(`[data-lactase-tab="${id}"]`).focus();
  }
  async function save(){
    if(disposed||!data||saving||typeof onSaveSummary!=='function')return;
    const value=summary();if(value.length>SUMMARY_LIMIT||draft.savedSummaries.has(value))return;
    const epoch=++saveEpoch,metadata={activity:ACTIVITY,prediction:draft.prediction,revision:draft.revision,observations:draft.observations.map(item=>({...item,sourceIds:[...item.sourceIds]}))};
    saving=true;saveStatus='正在保存本次摘要…';drawSummary();
    try{
      const result=await onSaveSummary(value,metadata);
      if(disposed||epoch!==saveEpoch)return;
      if(result===true||result?.ok===true){draft.savedSummaries.add(value);saveStatus=summary()===value?'已附加到本課筆記。':'已保存按下按鈕當時的摘要；之後的修改仍可再次保存。';}
      else saveStatus='尚未保存；你的文字與觀察仍保留，可以重試或選取摘要複製。';
    }catch(error){
      if(disposed||epoch!==saveEpoch)return;
      saveStatus=/10,?000/.test(String(error?.message||''))?'尚未保存；本課既有筆記加上摘要超過 10,000 字元。請先複製摘要並整理本課筆記，再重試。':'尚未保存；筆記暫時無法寫入。文字與觀察仍保留，可以重試或複製。';
    }
    finally{if(!disposed&&epoch===saveEpoch){saving=false;drawSummary();}}
  }
  function onInput(event){
    if(disposed||!root.contains(event.target))return;
    if(event.target.matches?.('[data-lactase-prediction]'))draft.prediction=event.target.value;
    else if(event.target.matches?.('[data-lactase-revision]'))draft.revision=event.target.value;
    else return;
    changed();drawSummary();
  }
  function onChange(event){
    if(disposed||!data||!root.contains(event.target))return;
    const target=event.target,value=target.value;
    if(target.matches?.('[data-lactase-form]')&&data.structure.forms.some(item=>item.id===value)){
      draft.formId=value;draft.structureObservationSource='assembly';normalizeSelections();drawStructure();
    }else if(target.matches?.('[data-lactase-mechanism]')&&data.mechanism.steps.some(item=>item.id===value)){
      draft.mechanismId=value;drawMechanism();
    }else if(target.matches?.('[data-lactase-regulation]')&&data.regulation.cases.some(item=>item.id===value)){
      draft.regulationId=value;drawRegulation();
    }else return;
    changed();drawCurrent();
  }
  function onClick(event){
    if(disposed)return;
    const target=event.target?.closest?.('button');if(!target||!root.contains(target)||target.disabled)return;
    const tab=target.dataset.lactaseTab;if(tab){setPanel(tab);return;}
    const name=target.dataset.lactaseAction;
    if(name==='retry'){load();return;}
    if(name==='select-summary'){field('summary').focus();field('summary').select();return;}
    if(name==='save'){if(draft.panel==='mechanism')catalyticDispose?.pause?.();save();return;}
    if(name==='clear'){draft.observations=[];changed();feedback='已清空觀察紀錄；預測與修訂仍保留。';drawRecords();drawCurrent();return;}
    if(target.dataset.lactaseRemove!==undefined){
      const index=Number(target.dataset.lactaseRemove);if(!Number.isInteger(index)||index<0||index>=draft.observations.length)return;
      const [removed]=draft.observations.splice(index,1);changed();feedback=`已移除「${removed.label}」；其他紀錄與自己的文字仍保留。`;
      drawRecords();drawCurrent();(action('record').disabled?field('revision'):action('record')).focus();return;
    }
    if(!data)return;
    if(target.dataset.lactaseDomain&&selectedForm().domains.includes(target.dataset.lactaseDomain)&&chainLabels(selectedForm()).includes(target.dataset.lactaseDomainChain)){
      draft.domainId=target.dataset.lactaseDomain;draft.chainId=target.dataset.lactaseDomainChain;draft.structureObservationSource='assembly';drawStructure();
    }else if(target.dataset.lactaseChain&&chainLabels(selectedForm()).includes(target.dataset.lactaseChain)){
      draft.chainId=target.dataset.lactaseChain;draft.structureObservationSource='assembly';drawStructure();
    }else if(target.dataset.lactaseProductionStep&&data.production.steps.some(item=>item.id===target.dataset.lactaseProductionStep)){
      draft.productionId=target.dataset.lactaseProductionStep;drawProduction();
    }else if(name==='mechanism-prev'||name==='mechanism-next'){
      const index=data.mechanism.steps.findIndex(item=>item.id===draft.mechanismId)+(name==='mechanism-next'?1:-1);
      if(!data.mechanism.steps[index])return;draft.mechanismId=data.mechanism.steps[index].id;drawMechanism();
    }else if(name==='record'){
      if(draft.panel==='mechanism')catalyticDispose?.pause?.();
      const item=currentObservation();if(!item||draft.observations.length>=16)return;
      const key=JSON.stringify(item);
      if(draft.observations.some(record=>JSON.stringify(record)===key)){feedback='這個所選狀態已記錄；可切換到另一項比較。';drawCurrent();return;}
      draft.observations.push({...item,sourceIds:[...item.sourceIds]});changed();feedback=`已保留「${item.label}」及當時的來源與解釋。`;
      drawRecords();drawCurrent();return;
    }else return;
    changed();drawCurrent();
  }
  function onKeydown(event){
    if(disposed)return;
    const target=event.target;if(!target.matches?.('[data-lactase-tab]')||!root.contains(target))return;
    const keys=['ArrowRight','ArrowLeft','Home','End'];if(!keys.includes(event.key))return;
    event.preventDefault();const index=PANELS.findIndex(([id])=>id===target.dataset.lactaseTab);
    const next=event.key==='Home'?0:event.key==='End'?PANELS.length-1:(index+(event.key==='ArrowRight'?1:-1)+PANELS.length)%PANELS.length;
    setPanel(PANELS[next][0],{focus:true});
  }
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('keydown',onKeydown);
  drawRecords();drawTabs();drawLoading();load();
  return ()=>{
    if(disposed)return;disposed=true;loadEpoch++;saveEpoch++;aborter?.abort();molecularDispose?.();catalyticDispose?.();
    root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('keydown',onKeydown);
  };
}
