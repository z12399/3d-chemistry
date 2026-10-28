import {escapeHTML as esc} from './storage.js';
import {PROTEIN_LAB_ID,PROTEIN_SOURCE_URL,PROTEIN_TASKS,validateProteinDataset,proteinFeature,proteinResidue,proteinReadout,proteinSummary} from './protein-structure-model.js';
import {ProteinStructureViewer,PROTEIN_VIEW_COLORS,PROTEIN_ATOM_COLORS} from './protein-structure-viewer.js';
import {PROTEIN_CCD_SOURCE} from './protein-structure-ccd.js';

const drafts=new WeakMap();
let sequence=0;
const fresh=()=>({step:0,featureId:'sequence-neighbors',residueId:'A:54',chainMode:'A',colorMode:'element',viewScope:'all',prediction:'',revision:'',claims:{},observations:[],savedSummary:'',savedSummaries:new Set(),camera:null});
const number=value=>typeof value==='number'&&Number.isFinite(value)?Number(value.toFixed(3)).toString():null;
const secondaryName={alpha:'α 螺旋','310':'3₁₀ 螺旋',sheet:'β 片層註記',other:'其他／未列上述註記'};
const atomName={C:'C 碳',N:'N 氮',O:'O 氧',S:'S 硫'};
const colorName={element:'原子元素',secondary:'二級結構註記',chain:'不同肽鏈'};
const scopeName=scope=>scope==='selection'?'僅選定殘基':'完整分子（目前顯示鏈）';
const observationKey=item=>[item.featureId??'free',item.residueId,item.chainMode,item.colorMode,item.viewScope??'all'].join('|');
const previousRenderingLimit='Cα 路徑是主鏈走向的簡化顯示；相鄰 Cα 間的線不是實際 Cα–Cα 化學鍵。所有資料座標保留來源 Å，顯示鏡頭的平移旋轉不修改原資料。';
const renderingLimit='重原子球棍使用來源 Å 座標；球表示原子，棍表示 CCD 殘基鍵、連續肽鍵與來源 SSBOND，虛線表示來源註記的非共價配對。原檔未提供氫，未另行添加；鏡頭平移旋轉不修改原座標。';
const evidenceKind={peptide:'肽骨架連接 · SEQRES／ATOM',secondary:'二級結構 · HELIX','backbone-hbond':'主鏈配對 · SHEET',disulfide:'二硫鍵 · SSBOND','unpaired-cysteine':'殘基與二硫鍵端點 · ATOM／SSBOND','interchain-contact':'鏈間配對 · SHEET'};
const option=(value,label)=>`<option value="${esc(value)}">${esc(label)}</option>`;
function safeLink(url,label){
  try{const link=new URL(url);if(link.protocol==='https:'&&!link.username&&!link.password)return `<a href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;}catch{}
  return esc(label);
}
const readable=value=>Array.isArray(value)?value.map(item=>typeof item==='string'?item:'').filter(Boolean).join('；'):typeof value==='string'?value:'';

/** Immediate disposer: source fetch and the 3D viewer never own the route. */
export function mountProteinStructureLab(root,{draftOwner,onSaveSummary,fetcher=globalThis.fetch}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  const owned=draftOwner&&typeof draftOwner==='object';
  if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const draft=owned?drafts.get(draftOwner):fresh(),prefix=`protein-structure-${++sequence}`;
  draft.viewScope??='all';
  const $=selector=>root.querySelector(selector),field=name=>$(`[data-protein-${name}]`);
  let dataset=null,viewer=null,disposed=false,loading=true,loadEpoch=0,viewEpoch=0,aborter=null,residueOptionsFor='';
  let feedback='',saveStatus='',viewerStatus='正在讀取來源座標…';
  const visibleChain=id=>draft.chainMode==='AB'||id===draft.chainMode;

  root.innerHTML=`<section class="protein-structure-lab" data-protein-lab="${PROTEIN_LAB_ID}" aria-labelledby="${prefix}-title">
    <h2 id="${prefix}-title" class="protein-sr-only">食品蛋白結構探究</h2>
    <div class="protein-steps" role="tablist" aria-label="蛋白結構探究步驟">${['選部位','看組裝','修訂保存'].map((title,i)=>`<button type="button" role="tab" id="${prefix}-tab-${i}" aria-controls="${prefix}-panel-${i}" aria-selected="${draft.step===i}" tabindex="${draft.step===i?0:-1}" data-protein-step="${i}"><span>0${i+1}</span>${title}</button>`).join('')}</div>
    <section role="tabpanel" id="${prefix}-panel-0" aria-labelledby="${prefix}-tab-0" data-protein-panel="0" class="protein-step-panel protein-locate-panel">
      <p class="protein-step-hint">選一個部位，比較序列位置與空間距離。</p>
      <details class="protein-prediction-details" data-protein-prediction-details><summary>先寫下預測</summary><p>序列上相鄰，和空間上靠近，是同一件事嗎？</p><label class="protein-field" for="${prefix}-prediction">操作前的預測<textarea id="${prefix}-prediction" rows="3" maxlength="1800" data-protein-prediction placeholder="記下預測與理由，操作後仍會保留這份文字。"></textarea></label></details>
    </section>
    <section role="tabpanel" id="${prefix}-panel-1" aria-labelledby="${prefix}-tab-1" data-protein-panel="1" class="protein-step-panel" hidden>
      <p>顯示兩條鏈，找出它們接觸的部位。</p><div class="protein-comparison-actions"><button type="button" data-protein-action="assembly" disabled>顯示 A＋B、按鏈著色</button><button type="button" data-protein-action="interface" disabled>查看鏈間接觸</button></div>
    </section>
    <p class="protein-data-status" role="status" data-protein-data-status>正在載入並核對 6FXB 組裝資料…</p><button type="button" data-protein-action="retry-data" hidden>重試讀取結構資料</button>
    <div class="protein-workspace" data-protein-workspace>
      <section class="protein-visual-panel" aria-label="來源結構與觀察控制">
        <p class="protein-source-identity" data-protein-source-identity>牛 βLG · 6FXB · 固定晶體座標</p>
        <div class="protein-viewer" data-protein-viewer></div>
        <div class="protein-view-fields"><label class="protein-field" for="${prefix}-chains">目前顯示<select id="${prefix}-chains" data-protein-chain disabled>${option('A','只顯示 A 鏈')}${option('B','只顯示 B 鏈')}${option('AB','A＋B：生物組裝 1')}</select></label><label class="protein-field" for="${prefix}-color">顏色代表<select id="${prefix}-color" data-protein-color disabled>${option('element','原子元素')}${option('secondary','二級結構註記')}${option('chain','不同肽鏈')}</select></label></div>
        <p class="protein-viewer-status" role="status" data-protein-viewer-status></p>
        <div class="protein-legend" data-protein-legend></div>
        <div class="protein-view-actions"><button type="button" data-protein-action="fit" disabled>看完整顯示範圍</button><button type="button" data-protein-action="focus" disabled>靠近選取部位</button><button type="button" data-protein-action="local" aria-pressed="false" disabled>只看選定部位</button><button type="button" data-protein-action="retry-viewer" hidden>重試顯示 3D</button></div>
        <details class="protein-camera-details"><summary>旋轉與縮放</summary><div class="protein-camera" role="group" aria-label="觀察視角">${[['left','向左旋轉'],['right','向右旋轉'],['up','向上旋轉'],['down','向下旋轉'],['in','放大'],['out','縮小']].map(([action,label])=>`<button type="button" data-protein-camera="${action}" disabled>${label}</button>`).join('')}</div></details>
        <p class="protein-rendering-note">球＝來源原子，棍＝化學鍵；原檔未提供氫原子。虛線＝非共價配對。</p>
      </section>
      <section class="protein-evidence-panel" aria-label="目前選取的來源證據">
        <label class="protein-field" for="${prefix}-feature">觀察部位<select id="${prefix}-feature" data-protein-feature disabled>${option('','等待結構資料')}</select></label>
        <label class="protein-field" for="${prefix}-residue">或自由選取殘基<select id="${prefix}-residue" data-protein-residue disabled>${option('','等待結構資料')}</select></label>
        <div class="protein-selected"><span>目前選取</span><strong data-protein-selected>等待資料</strong><p data-protein-secondary></p></div>
        <p class="protein-level" data-protein-level></p><p class="protein-evidence-text" data-protein-evidence></p>
        <dl class="protein-readings"><div><dt>原子對</dt><dd data-protein-pair>尚未讀取</dd></div><div><dt>座標距離</dt><dd data-protein-distance>未指定</dd></div><div><dt>同鏈序列編號差</dt><dd data-protein-separation>未指定</dd></div><div><dt>目前顯示</dt><dd data-protein-counts>尚未讀取</dd></div></dl>
        <details class="protein-source-details" data-protein-source-details hidden><summary>查看來源依據</summary><p class="protein-small" data-protein-source-kind></p><p data-protein-annotation></p><p class="protein-small">配對依來源註記；距離不能單獨判定成鍵，也不是鍵能。</p></details>
        <div class="protein-record-actions"><button type="button" class="protein-primary" data-protein-action="record" disabled>記錄目前觀察</button><span data-protein-record-count></span></div><p class="protein-feedback" role="status" data-protein-feedback></p>
      </section>
    </div>
    <section role="tabpanel" id="${prefix}-panel-2" aria-labelledby="${prefix}-tab-2" data-protein-panel="2" class="protein-step-panel protein-reflection" hidden>
      <h3>先保留觀察，再修訂原來的判斷</h3><div class="protein-original"><strong>操作前的預測</strong><p data-protein-original></p></div><label class="protein-field" for="${prefix}-revision">操作後的解釋與修訂<textarea id="${prefix}-revision" rows="4" maxlength="2600" data-protein-revision placeholder="引用一個已記錄部位，分開說明序列、座標與來源註記能支持到哪裡。"></textarea></label>
      <div class="protein-tasks"><h3>把觀察用在另一個判斷</h3><p class="protein-small">選擇後可核對理由，不會代填你的文字，也不自動評定掌握。</p>${PROTEIN_TASKS.map(task=>`<div class="protein-task"><label for="${prefix}-task-${task.id}">${esc(task.prompt)}</label><select id="${prefix}-task-${task.id}" data-protein-task="${esc(task.id)}">${option('','先作自己的判斷')}${task.options.map(choice=>option(choice.value,choice.label)).join('')}</select><p role="status" data-protein-task-feedback="${esc(task.id)}"></p></div>`).join('')}</div>
      <details class="protein-summary-details"><summary>檢查並保存本次探究摘要</summary><label class="protein-field" for="${prefix}-summary">來源、選定觀察與自己的文字<textarea readonly id="${prefix}-summary" rows="10" data-protein-summary></textarea></label><div class="protein-record-actions"><button type="button" data-protein-action="copy">選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" class="protein-primary" data-protein-action="save" disabled>附加到本課筆記</button>':''}</div><p role="status" data-protein-save-status></p><p class="protein-small">操作與未保存文字只在本頁暫留；重新整理前請保存或複製。保存結果會在這裡回報。</p></details>
    </section>
    <details class="protein-records"><summary>已選觀察 <span data-protein-record-total></span></summary><div class="protein-table-scroll" data-protein-records></div><button type="button" data-protein-action="clear" disabled>清空觀察紀錄</button><p class="protein-small">只清空紀錄，保留原先預測、修訂與判斷選擇。</p></details>
    <details class="protein-sequences"><summary>讀取來源序列與殘基編號</summary><p class="protein-small">顯示成熟蛋白的來源編號；選取殘基也會以名稱與單字母代碼呈現在圖旁。點選殘基不會切斷肽鏈。</p><div data-protein-sequences></div></details>
    <details class="protein-metadata"><summary>實驗來源與模型說明</summary><p class="protein-assembly-scope" data-protein-assembly-scope>本課採 assembly 1 的 A／B 二聚體組裝；晶體不對稱單位則有 A／B／C／D 四鏈。單鏈顯示只隱藏另一鏈，並非解離。</p><div data-protein-metadata><p>${safeLink(PROTEIN_SOURCE_URL,'RCSB PDB · 6FXB')}；來源資料尚在核對。</p></div></details>
  </section>`;
  field('prediction').value=draft.prediction;field('revision').value=draft.revision;
  for(const select of root.querySelectorAll('[data-protein-task]'))select.value=draft.claims[select.dataset.proteinTask]??'';

  function rememberCamera(){if(viewer)try{draft.camera=viewer.cameraState();}catch{/* A lost rendering context must not discard the textual draft. */}}
  function currentReadout(){return dataset?proteinReadout(dataset,draft):null;}
  function summary(){return dataset?proteinSummary(dataset,draft):`食品蛋白結構與證據\n6FXB 資料尚未讀取或未通過核對，暫無可確認的結構讀值。\n\n操作前預測：\n${draft.prediction||'（未填）'}\n\n操作後解釋與修訂：\n${draft.revision||'（未填）'}`;}
  function drawSummary(){
    if(disposed)return;const value=summary();field('summary').value=value;field('original').textContent=draft.prediction||'（尚未填寫；可回第一步補上自己的預測。）';field('save-status').textContent=saveStatus;
    const save=$('[data-protein-action="save"]');if(save)save.disabled=!dataset||draft.savedSummaries.has(value);
  }
  function drawTasks(){
    for(const task of PROTEIN_TASKS){const chosen=draft.claims[task.id];$(`[data-protein-task-feedback="${task.id}"]`).textContent=chosen?`${chosen===task.answer?'與目前證據相符。':'請再核對來源與推論的界線。'}${task.feedback}`:'';}
  }
  function drawRecords(){
    if(disposed)return;field('record-count').textContent=`${draft.observations.length} / 12 個觀察`;field('record-total').textContent=`（${draft.observations.length} / 12）`;
    field('records').innerHTML=draft.observations.length?`<table><caption>保留記錄當時的選取與讀值；旋轉鏡頭不會產生新的分子狀態。</caption><thead><tr><th scope="col">部位／殘基</th><th scope="col">顯示範圍</th><th scope="col">原子對與距離</th><th scope="col">|Δi|</th></tr></thead><tbody>${draft.observations.map(item=>`<tr><td>${esc(item.featureTitle)}<br>${esc(item.readout.selectedResidueLabel)}</td><td>${scopeName(item.viewScope)}<br>鏈範圍 ${esc(item.chainMode)} · ${colorName[item.colorMode]??'未記錄著色'}</td><td>${esc(item.readout.pairLabel)}<br>${number(item.readout.distanceAngstrom)===null?'未指定原子對':number(item.readout.distanceAngstrom)+' Å'}</td><td>${number(item.readout.sequenceSeparation)??'不適用'}</td></tr>`).join('')}</tbody></table>`:'<p class="protein-small">尚未記錄。選一個部位，再按「記錄目前觀察」。</p>';
    $('[data-protein-action="clear"]').disabled=draft.observations.length===0;
  }
  function drawViewerStatus(){
    if(disposed)return;const local=draft.viewScope==='selection';field('viewer-status').textContent=viewer&&local?'局部顯示；其餘原子只隱藏，沒有斷鍵。':viewerStatus;
    for(const action of ['fit','focus','local'])$(`[data-protein-action="${action}"]`).disabled=!viewer;
    const toggle=$('[data-protein-action="local"]');toggle.textContent=local?'回到完整分子':'只看選定部位';toggle.setAttribute('aria-pressed',String(local));
    for(const button of root.querySelectorAll('[data-protein-camera]'))button.disabled=!viewer;
    $('[data-protein-action="retry-viewer"]').hidden=!dataset||!!viewer;
  }
  function drawLegend(){
    const items=draft.colorMode==='element'?Object.entries(atomName):draft.colorMode==='chain'?[['A','A 鏈'],['B','B 鏈']]:Object.entries(secondaryName);
    const colors=draft.colorMode==='element'?PROTEIN_ATOM_COLORS:PROTEIN_VIEW_COLORS;
    field('legend').innerHTML=items.map(([key,label])=>`<span><i aria-hidden="true" style="background:${esc(colors[key])}"></i>${esc(label)}</span>`).join('');
  }
  function drawSequences(){
    if(!dataset)return;
    field('sequences').innerHTML=dataset.chains.filter(chain=>visibleChain(chain.id)).map(chain=>`<section class="protein-sequence"><h4>${esc(chain.id)} 鏈 · ${chain.sequence.length} 個殘基</h4><div>${Array.from({length:Math.ceil(chain.sequence.length/10)},(_,i)=>{const start=i*10;return `<span><small>${start+1}</small><code>${chain.sequence.slice(start,start+10).split('').map((letter,j)=>draft.residueId===`${chain.id}:${start+j+1}`?`<mark>${esc(letter)}</mark>`:esc(letter)).join('')}</code></span>`;}).join('')}</div></section>`).join('');
  }
  function drawState(){
    if(disposed)return;field('workspace').hidden=draft.step===2;drawViewerStatus();drawLegend();drawRecords();
    for(const name of ['chain','color','feature','residue'])field(name).disabled=!dataset;
    for(const action of ['record','assembly','interface'])$(`[data-protein-action="${action}"]`).disabled=!dataset;
    if(dataset){
      const readout=currentReadout();field('chain').value=draft.chainMode;field('color').value=draft.colorMode;field('feature').value=draft.featureId??'';
      if(residueOptionsFor!==draft.chainMode){field('residue').innerHTML=dataset.chains.filter(chain=>visibleChain(chain.id)).map(chain=>`<optgroup label="${esc(chain.id)} 鏈">${chain.residues.map(residue=>option(residue.id,`${chain.id} · ${residue.number} · ${residue.name} (${residue.code})`)).join('')}</optgroup>`).join('');residueOptionsFor=draft.chainMode;}
      field('residue').value=draft.residueId;field('selected').textContent=readout.selectedResidueLabel;field('secondary').textContent=`來源註記：${secondaryName[readout.selectedResidue.secondary]}`;
      field('level').textContent=readout.levelLabel;field('evidence').textContent=readout.feature?.takeaway??'已選取一個來源殘基；可再選觀察部位，查看配對與距離。';field('pair').textContent=readout.pairLabel;
      field('source-details').hidden=!readout.feature;field('source-kind').textContent=readout.feature?evidenceKind[readout.feature.kind]??'來源註記':'';field('annotation').textContent=readout.feature?.annotation??'';
      field('distance').textContent=number(readout.distanceAngstrom)===null?'此觀察未指定原子對':number(readout.distanceAngstrom)+' Å';
      field('separation').textContent=number(readout.sequenceSeparation)===null?(readout.feature?.atomPair?'不同鏈，不計同鏈編號差':'此觀察未指定配對'):number(readout.sequenceSeparation);
      field('counts').textContent=`${readout.chainCount} 條鏈 · ${readout.residueCount} 個來源殘基`;
      field('source-identity').textContent=`牛 βLG · ${dataset.source.entry} · 組裝 ${dataset.source.assemblyId} · 固定晶體座標`;
      field('assembly-scope').textContent=`來源 assembly ${dataset.source.assemblyId}：${dataset.source.assemblyChains.join('／')}，共 ${dataset.source.assemblyChains.length} 條鏈。晶體不對稱單位：${dataset.source.asymmetricUnitChains.join('／')}，共 ${dataset.source.asymmetricUnitChains.length} 條鏈；不代表食品中是四聚體。單鏈顯示只隱藏另一鏈，並非解離。`;
      drawSequences();
    }
    field('feedback').textContent=feedback;drawTasks();drawSummary();
  }
  function drawStep(){
    if(disposed)return;for(const button of root.querySelectorAll('[data-protein-step]')){const active=Number(button.dataset.proteinStep)===draft.step;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
    for(const panel of root.querySelectorAll('[data-protein-panel]'))panel.hidden=Number(panel.dataset.proteinPanel)!==draft.step;
    drawState();
  }
  function metadata(){
    const source=dataset.source;
    return `<p>${safeLink(source.url,source.title)}${source.doi?` · DOI ${esc(source.doi)}`:''}</p><p>方法：${esc(source.method)}；解析度 ${number(source.resolutionAngstrom)} Å；Rwork ${number(source.rWork)}、Rfree ${number(source.rFree)}。</p><p>${esc(source.conditionNote)}</p><p>${esc(source.numberingNote)}</p><p>${esc(source.qualityNote)}</p>${readable(source.assemblyEvidence)?`<p>組裝依據：${esc(readable(source.assemblyEvidence))}</p>`:''}<ul>${dataset.limits.map(note=>`<li>${esc(note===previousRenderingLimit?renderingLimit:note)}</li>`).join('')}</ul><p>化學鍵模板：${safeLink(PROTEIN_CCD_SOURCE.descriptionUrl,'wwPDB Chemical Component Dictionary (CCD)')}。CCD 鍵級是繪圖慣例，不是本結構實測的質子化狀態或局域電子分布。</p><details><summary>可追溯的原始來源檔</summary><ul>${source.files.map(file=>`<li>${safeLink(file.url,file.name)}<br><span class="protein-file-hash">SHA-256 ${esc(file.sha256)}</span></li>`).join('')}</ul><details><summary>化學鍵模板原始檔（${PROTEIN_CCD_SOURCE.files.length} 份）</summary><ul>${PROTEIN_CCD_SOURCE.files.map(file=>`<li>${safeLink(file.url,file.name)}<br><span class="protein-file-hash">SHA-256 ${esc(file.sha256)}</span></li>`).join('')}</ul></details></details>`;
  }
  function viewerFailure(){
    if(disposed)return;viewEpoch++;const old=viewer;viewer=null;try{old?.dispose();}catch{}field('viewer').replaceChildren();viewerStatus='3D 暫時無法顯示；文字、序列與來源座標讀值仍可使用。可以重試。';drawViewerStatus();
  }
  function updateViewer({focus=false}={}){
    if(disposed||!viewer||!dataset)return;
    try{viewer.setView({chainMode:draft.chainMode,colorMode:draft.colorMode,viewScope:draft.viewScope,featureId:draft.featureId,residueId:draft.residueId,focus});rememberCamera();}catch{viewerFailure();}
  }
  function setViewScope(viewScope){
    if(disposed||!dataset||!['all','selection'].includes(viewScope))return;
    draft.viewScope=viewScope;feedback='';saveStatus='';updateViewer({focus:viewScope==='selection'});
    if(viewScope==='all'&&viewer)try{viewer.fit();rememberCamera();}catch{viewerFailure();}drawState();
  }
  function selectResidue(id){
    if(disposed||!dataset)return;const residue=proteinResidue(dataset,id);if(!residue||!visibleChain(residue.chain))return;
    draft.residueId=id;draft.featureId=null;feedback='';saveStatus='';updateViewer({focus:draft.viewScope==='selection'});drawState();
  }
  function createViewer(){
    if(disposed||!dataset)return;viewEpoch++;const current=viewEpoch,old=viewer;viewer=null;try{old?.dispose();}catch{}field('viewer').replaceChildren();
    try{
      const created=new ProteinStructureViewer(field('viewer'),{onResidue:id=>{if(!disposed&&current===viewEpoch)selectResidue(id);},onError:()=>{if(!disposed&&current===viewEpoch)viewerFailure();}});
      if(disposed||current!==viewEpoch){created.dispose();return;}viewer=created;viewer.setDataset(dataset);
      viewer.setView({chainMode:draft.chainMode,colorMode:draft.colorMode,viewScope:draft.viewScope,featureId:draft.featureId,residueId:draft.residueId,focus:false});
      if(!draft.camera||viewer.restoreCamera(draft.camera)!==true)viewer.fit();rememberCamera();
      if(disposed||current!==viewEpoch)return;viewerStatus='拖曳旋轉 · 滾輪縮放 · 點選殘基';drawViewerStatus();
    }catch{viewerFailure();}
  }
  function selectFeature(id){
    if(disposed||!dataset)return;
    if(id===''){draft.featureId=null;feedback='已切換為自由選取殘基。';saveStatus='';updateViewer({focus:draft.viewScope==='selection'});drawState();return;}
    const feature=proteinFeature(dataset,id);if(!feature)return;
    draft.featureId=id;draft.chainMode=id==='assembly-interface'?'AB':'A';draft.residueId=feature.residueIds[0];feedback='';saveStatus='';updateViewer({focus:true});drawState();
  }
  function setChain(mode,{fit=false}={}){
    if(disposed||!dataset||!['A','B','AB'].includes(mode))return;const changed=mode!==draft.chainMode;draft.chainMode=mode;
    const feature=proteinFeature(dataset,draft.featureId);if(feature&&feature.residueIds.some(id=>!visibleChain(id.split(':')[0])))draft.featureId=null;
    const residue=proteinResidue(dataset,draft.residueId);if(!visibleChain(residue.chain))draft.residueId=`${mode}:${residue.number}`;
    feedback='';saveStatus='';updateViewer();if((changed||fit)&&viewer)try{viewer.fit();rememberCamera();}catch{viewerFailure();}drawState();
  }
  function record(){
    if(!dataset||disposed)return;rememberCamera();const readout=currentReadout(),key=observationKey(draft);
    if(draft.observations.some(item=>observationKey(item)===key))feedback='這個部位、殘基與顯示條件已記錄；旋轉鏡頭不重複增加紀錄。';
    else if(draft.observations.length>=12)feedback='已達 12 個觀察。請先保存或複製摘要，再清空紀錄開始下一組。';
    else{draft.observations.push({key,featureId:draft.featureId,residueId:draft.residueId,chainMode:draft.chainMode,colorMode:draft.colorMode,viewScope:draft.viewScope,featureTitle:readout.feature?.title??'自由選取殘基',readout:{selectedResidueLabel:readout.selectedResidueLabel,pairLabel:readout.pairLabel,distanceAngstrom:readout.distanceAngstrom,sequenceSeparation:readout.sequenceSeparation,levelLabel:readout.levelLabel,evidenceText:readout.evidenceText,chainCount:readout.chainCount,residueCount:readout.residueCount}});feedback='已保留選取、來源註記與座標讀值。';saveStatus='';}
    drawState();
  }
  async function loadDataset(){
    if(disposed)return;const current=++loadEpoch;aborter?.abort();aborter=new AbortController();loading=true;
    field('data-status').textContent='正在載入並核對 6FXB 組裝資料…';$('[data-protein-action="retry-data"]').hidden=true;
    try{
      if(typeof fetcher!=='function')throw new Error('Fetch unavailable');
      const response=await fetcher(new URL('../data/protein-structure-6fxb.json',import.meta.url),{signal:aborter.signal});if(disposed||current!==loadEpoch)return;
      if(!response?.ok)throw new Error('Dataset unavailable');const raw=await response.json();if(disposed||current!==loadEpoch)return;
      dataset=validateProteinDataset(raw);loading=false;
      if(!proteinResidue(dataset,draft.residueId))draft.residueId='A:54';
      if(draft.featureId!==null&&!proteinFeature(dataset,draft.featureId))draft.featureId=null;
      const feature=proteinFeature(dataset,draft.featureId);if(feature&&feature.residueIds.some(id=>!visibleChain(id.split(':')[0])))draft.featureId=null;
      const residue=proteinResidue(dataset,draft.residueId);if(!visibleChain(residue.chain))draft.residueId=`${draft.chainMode}:${residue.number}`;
      residueOptionsFor='';field('feature').innerHTML=option('','自由選取殘基')+dataset.features.map(item=>option(item.id,item.title)).join('');field('metadata').innerHTML=metadata();
      field('data-status').textContent='';drawState();createViewer();
    }catch{
      if(disposed||current!==loadEpoch)return;loading=false;dataset=null;field('data-status').textContent='結構資料無法讀取或未通過核對，暫不顯示結構讀值。你的文字仍保留，可複製或重試。';$('[data-protein-action="retry-data"]').hidden=false;viewerStatus='尚無已核對的結構可顯示。';drawState();
    }
  }
  const onInput=event=>{
    if(disposed||!root.contains(event.target))return;const target=event.target;
    if(target.matches('[data-protein-prediction]')){draft.prediction=target.value;saveStatus='';drawSummary();}
    else if(target.matches('[data-protein-revision]')){draft.revision=target.value;saveStatus='';drawSummary();}
  };
  const onChange=event=>{
    if(disposed||!root.contains(event.target))return;const target=event.target;
    if(target.matches('[data-protein-feature]'))selectFeature(target.value);
    else if(target.matches('[data-protein-residue]'))selectResidue(target.value);
    else if(target.matches('[data-protein-chain]'))setChain(target.value);
    else if(target.matches('[data-protein-color]')&&['element','secondary','chain'].includes(target.value)){draft.colorMode=target.value;saveStatus='';updateViewer();drawState();}
    else if(target.matches('[data-protein-task]')){const task=PROTEIN_TASKS.find(item=>item.id===target.dataset.proteinTask);if(!task||target.value!==''&&!task.options.some(choice=>choice.value===target.value))return;draft.claims[task.id]=target.value;saveStatus='';drawTasks();drawSummary();}
  };
  const onClick=event=>{
    if(disposed||!root.contains(event.target))return;const step=event.target.closest('[data-protein-step]');
    if(step){const value=Number(step.dataset.proteinStep);if([0,1,2].includes(value)){draft.step=value;drawStep();}return;}
    const camera=event.target.closest('[data-protein-camera]');if(camera){if(!viewer||camera.disabled)return;try{const action=camera.dataset.proteinCamera;if(['in','out'].includes(action))viewer.zoom(action);else if(['left','right','up','down'].includes(action))viewer.rotate(action);rememberCamera();}catch{viewerFailure();}return;}
    const button=event.target.closest('[data-protein-action]');if(!button||button.disabled)return;const action=button.dataset.proteinAction;
    if(action==='retry-data'){if(!loading)loadDataset();return;}
    if(action==='retry-viewer'){createViewer();return;}
    if(action==='fit'){setViewScope('all');return;}
    if(action==='focus'){updateViewer({focus:true});return;}
    if(action==='local'){setViewScope(draft.viewScope==='selection'?'all':'selection');return;}
    if(action==='assembly'){draft.colorMode='chain';draft.viewScope='all';setChain('AB',{fit:true});return;}
    if(action==='interface'){selectFeature('assembly-interface');return;}
    if(action==='record'){record();return;}
    if(action==='clear'){draft.observations=[];feedback='已清空觀察紀錄；原先預測、修訂與判斷選擇仍保留。';saveStatus='';drawState();return;}
    if(action==='copy'){field('summary').focus();field('summary').select();return;}
    if(action==='save'&&dataset&&typeof onSaveSummary==='function'){
      const value=summary();if(draft.savedSummaries.has(value))return;let success=false;try{success=onSaveSummary(value)===true;}catch{}
      if(disposed)return;if(success){draft.savedSummary=value;draft.savedSummaries.add(value);saveStatus='已附加到本課筆記；自己的觀察與草稿仍保留。';}else saveStatus='尚未保存；請選取摘要複製，或重試保存。';drawSummary();
    }
  };
  const onKeydown=event=>{
    if(disposed||!root.contains(event.target)||!event.target.matches('[data-protein-step]'))return;let next=draft.step;
    if(event.key==='ArrowRight')next=(next+1)%3;else if(event.key==='ArrowLeft')next=(next+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;
    event.preventDefault();draft.step=next;drawStep();$(`[data-protein-step="${next}"]`).focus();
  };
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);root.addEventListener('keydown',onKeydown);
  drawStep();loadDataset();
  return ()=>{if(disposed)return;rememberCamera();disposed=true;loadEpoch++;viewEpoch++;aborter?.abort();const old=viewer;viewer=null;try{old?.dispose();}catch{}root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);root.removeEventListener('keydown',onKeydown);};
}
