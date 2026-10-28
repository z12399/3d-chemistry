import {MoleculeViewer} from './viewer.js';
import {escapeHTML as esc} from './storage.js';
import {createTagState,cutTagSite,undoTag,resetTag,describeTagState,tagSummary,validatedDataset,TAG_SOURCES} from './tag-hydrolysis-model.js';

const drafts = new WeakMap();
let sequence = 0;
const formulaHTML = value => esc(String(value)).replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>');
const sameBond = (bond, site) => bond && ((bond.a === site.carbonylCarbon && bond.b === site.glycerolO) || (bond.b === site.carbonylCarbon && bond.a === site.glycerolO));
const freshDraft = () => ({chemistry:createTagState(),siteId:'g1',componentId:'glyceride',view:'full',showH:false,prediction:'',reason:'',savedSummary:'',views:new Map()});

/** Returns an immediate disposer; asynchronous asset loading never owns the route. */
export function mountTagHydrolysisLab(root, {onSaveSummary,draftOwner} = {}) {
  if (!root || typeof root.querySelector !== 'function') throw new TypeError('A DOM container is required');
  const owned = draftOwner && typeof draftOwner === 'object';
  if (owned && !drafts.has(draftOwner)) drafts.set(draftOwner,freshDraft());
  const draft = owned ? drafts.get(draftOwner) : freshDraft();
  draft.prediction ??= '';
  const prefix = `tag-hydrolysis-${++sequence}`;
  const $ = selector => root.querySelector(selector);
  let disposed = false, epoch = 0, aborter = null, dataset = null, viewer = null;
  let loading = true, feedback = '', saveStatus = '', viewerStatus = '正在載入代表分子…';
  let renderedKey = '';

  root.innerHTML = `<section class="tag-hydrolysis-lab" aria-labelledby="${prefix}-title">
    <header class="tag-header"><div class="tag-sr-only"><p class="tag-kicker">三油酸甘油酯 · 逐鍵水解</p><h2 id="${prefix}-title">三條酯鍵，自己決定先拆哪一條</h2></div><p class="tag-source-scope">中性形式水解端點 · 計算代表構象</p></header>
    <div class="tag-workspace">
      <section class="tag-molecule-panel" aria-label="目前選定的一個分子">
        <label class="tag-field tag-component-field" for="${prefix}-component"><span>目前看哪個分子</span><select id="${prefix}-component" data-tag-component disabled><option>等待結構資料</option></select></label>
        <div class="tag-identity tag-sr-only"><strong data-tag-molecule-name>三油酸甘油酯</strong><span data-tag-molecule-formula></span></div>
        <div class="tag-viewer" data-tag-viewer></div>
        <p class="tag-viewer-status" role="status" data-tag-viewer-status>正在載入代表分子…</p>
        <div class="tag-view-actions" role="group" aria-label="分子觀察範圍"><button type="button" data-tag-action="full" aria-pressed="true" disabled>看完整分子</button><button type="button" data-tag-action="focus" aria-pressed="false" disabled>靠近這個部位</button><button type="button" data-tag-action="refit" disabled>重設本態視角</button></div>
        <p class="tag-focus-reading" data-tag-focus-reading></p>
        <details class="tag-camera-details"><summary>旋轉、縮放與氫原子</summary><div class="tag-camera" role="group" aria-label="分子視角">${[['left','向左旋轉'],['right','向右旋轉'],['up','向上旋轉'],['down','向下旋轉'],['in','放大'],['out','縮小']].map(([action,label])=>`<button type="button" data-tag-camera="${action}" disabled>${label}</button>`).join('')}</div><label class="tag-toggle"><input type="checkbox" data-tag-hydrogen ${draft.showH?'checked':''} disabled>顯示氫原子</label></details>
        <p class="tag-model-note" data-tag-model-note>每次只顯示一個分子。換態直接更換代表構象，不播放原子運動軌跡。</p>
        <button type="button" data-tag-action="retry" hidden>重試載入 3D</button>
      </section>
      <section class="tag-account-panel" aria-label="累計水解與下一步">
        <div class="tag-stage"><span>甘油骨架目前是</span><strong data-tag-stage>TAG</strong><span data-tag-glyceride-formula></span></div>
        <div class="tag-counters"><div><span>累計消耗水</span><strong data-tag-water>0</strong></div><div><span>游離脂肪酸</span><strong data-tag-acids>0</strong></div><div><span>全系統 C=C</span><strong data-tag-double-bonds>3</strong></div></div>
        <div class="tag-next-step"><p class="tag-question" data-tag-question>再水解一條酯鍵，水與游離脂肪酸各增加多少？</p><label class="tag-field tag-site-field" for="${prefix}-site"><span>下一次要水解的酯鍵</span><select id="${prefix}-site" data-tag-site disabled><option value="g1">g1</option><option value="g2">g2</option><option value="g3">g3</option></select></label><p class="tag-selected-bond" data-tag-selected-bond></p><div class="tag-cut-actions"><button type="button" class="tag-primary" data-tag-action="cut" disabled>水解選定酯鍵</button><button type="button" data-tag-action="undo" disabled>撤回一步</button><button type="button" data-tag-action="reset" disabled>重新開始</button></div><p class="tag-feedback" role="status" aria-live="polite" data-tag-feedback></p></div>
        <p class="tag-double-bond-account" data-tag-double-bond-account></p>
        <div class="tag-equation-block"><h3>從一個 TAG 累計到現在</h3><p class="tag-equation" data-tag-equation></p><p class="tag-step-equation" data-tag-step-equation></p></div>
        <details class="tag-balance-details"><summary>核對原子收支與操作順序</summary><div class="tag-table-scroll"><table><caption>原 TAG ＋ 已消耗的水，對照目前所有分子</caption><thead><tr><th scope="col">元素</th><th scope="col">原料＋水</th><th scope="col">產物合計</th></tr></thead><tbody data-tag-balance></tbody></table></div><p data-tag-history></p><p class="tag-small">撤回與重新開始只編輯本次操作，不代表逆反應。此處沒有反應時間或速率。</p></details>
      </section>
    </div>
    <section class="tag-notes" aria-label="自己的預測、修訂與筆記"><details><summary>留下預測與修訂</summary><div class="tag-reflections"><label class="tag-field" for="${prefix}-prediction">操作前的預測<textarea id="${prefix}-prediction" rows="4" maxlength="1600" data-tag-prediction placeholder="先記下自己的預測，操作後保留這份文字作比較。">${esc(draft.prediction)}</textarea></label><label class="tag-field" for="${prefix}-reason">操作後的解釋與修訂：酯鍵變少時，碳碳雙鍵去哪裡了？<textarea id="${prefix}-reason" rows="4" maxlength="1600" data-tag-reason placeholder="記下觀察到的變化與修訂理由。兩欄可編輯，這裡不自動評分。">${esc(draft.reason)}</textarea></label></div></details><details><summary>查看並保存本次操作摘要</summary><label class="tag-field" for="${prefix}-summary">目前操作、原先預測與自己的解釋<textarea id="${prefix}-summary" rows="8" readonly data-tag-summary></textarea></label><div class="tag-note-actions"><button type="button" data-tag-action="copy" disabled>選取摘要文字</button>${typeof onSaveSummary==='function'?'<button type="button" data-tag-action="save" disabled>附加到本課筆記</button>':''}</div><p class="tag-feedback" role="status" aria-live="polite" data-tag-save-status></p><p class="tag-small">操作與未保存文字只在本頁暫留；重新整理前請保存或複製。本課筆記的保存結果會在這裡回報。</p></details></section>
    <details class="tag-limits"><summary>模型能說明什麼？來源與界線</summary><div class="tag-introduction"><p>觀察甘油骨架保留幾條脂肪酸鏈，再核對新增的水與游離油酸。</p><p class="tag-boundary">中性形式水解端點；g1／g2／g3 只是本模型的位點 ID，不是 sn 命名。</p></div><div data-tag-limits><p>水解後以中性的甘油酯／甘油與油酸記帳。沒有加入催化劑、條件、反應中間體或酵素選擇性，也不以水解位點順序預測真實反應。</p><p>酯基的 C=O 與油酸鏈的 C=C 是不同的雙鍵。水解酯鍵不等於氫化，不能由本例推定油脂熔點、氧化速率或食品品質。</p></div><ul class="tag-sources">${(TAG_SOURCES||[]).filter(source=>/^https:\/\//.test(source.url)).map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p>${esc(source.note||'')}</p></li>`).join('')}</ul><div data-tag-identity-sources></div></details>
  </section>`;
  $('[data-tag-prediction]').value=draft.prediction;
  $('[data-tag-reason]').value=draft.reason;

  function description() { return describeTagState(draft.chemistry); }
  function currentState() { return dataset?.states.find(state=>state.mask===description().mask); }
  function component() { return currentState()?.components.find(item=>item.id===draft.componentId); }
  function focusSite() {
    const componentId = draft.componentId;
    const id = componentId.startsWith('acid-') ? componentId.slice(5) : draft.siteId;
    return dataset?.sites.find(site=>site.id===id);
  }
  function selectedIds() {
    const model=component(),site=focusSite();
    return model&&site ? site.focusIds.filter(id=>model.atoms.some(atom=>atom.id===id)) : [];
  }
  function cameraKey() { return `${description().mask}/${draft.componentId}/${focusSite()?.id||''}/${draft.view}`; }
  function rememberCamera() { if(viewer&&renderedKey)draft.views.set(renderedKey,viewer.cameraState()); }
  function fitCurrent() { if(viewer){const ids=selectedIds();viewer.fit(draft.view==='focus'&&ids.length?ids:null);} }
  function summary() { return tagSummary(draft.chemistry)+'\n\n操作前預測：\n'+(draft.prediction.trim()?draft.prediction:'（未填）')+'\n\n操作後解釋與修訂：\n'+(draft.reason.trim()?draft.reason:'（未填）'); }
  function drawSummary() {
    const value=summary();$('[data-tag-summary]').value=value;
    const save=$('[data-tag-action="save"]');if(save)save.disabled=!dataset||value===draft.savedSummary;
    $('[data-tag-action="copy"]').disabled=!dataset;
    $('[data-tag-save-status]').textContent=saveStatus||(value===draft.savedSummary?'這份摘要先前已成功附加；可到本課筆記核對。':'');
  }
  function normalizeSelection() {
    if(!dataset)return;
    const info=description(),available=info.remainingSiteIds;
    if(!dataset.sites.some(site=>site.id===draft.siteId))draft.siteId=available[0]||dataset.sites[0].id;
    const parts=currentState().components;
    if(!parts.some(part=>part.id===draft.componentId))draft.componentId=parts[0].id;
  }
  function render() {
    if(disposed)return;
    const info=description();normalizeSelection();
    $('[data-tag-stage]').textContent=info.classLabel;
    $('[data-tag-glyceride-formula]').innerHTML=formulaHTML(info.glycerideFormula||'');
    $('[data-tag-water]').textContent=String(info.waterCount);
    $('[data-tag-acids]').textContent=String(info.freeAcids);
    $('[data-tag-double-bonds]').textContent=String(info.totalDoubleBonds);
    $('[data-tag-double-bond-account]').textContent=`仍接在甘油上的脂肪酸鏈有 ${info.glycerideDoubleBonds} 個 ＋ 游離油酸有 ${info.freeAcids} 個 ＝ 全系統 ${info.totalDoubleBonds} 個 C=C。`;
    $('[data-tag-equation]').innerHTML=formulaHTML(info.equation);
    $('[data-tag-step-equation]').innerHTML=info.stepEquation?'剛才這一步：'+formulaHTML(info.stepEquation):'尚未水解；先在分子中找到一條酯鍵。';
    $('[data-tag-balance]').innerHTML=info.balance?['C','H','O'].map(element=>`<tr><th scope="row">${element}</th><td>${info.balance.reactants[element]}</td><td>${info.balance.products[element]}</td></tr>`).join(''):'';
    $('[data-tag-history]').textContent=draft.chemistry.cutIds.length?'本次位點順序：'+draft.chemistry.cutIds.join(' → '):'本次尚未切開酯鍵。';
    $('[data-tag-question]').textContent=info.remainingSiteIds.length?'再水解一條酯鍵，水與游離脂肪酸各增加多少？':'三條酯鍵已逐次水解。比較甘油與三個游離油酸，C=C 總數改變了嗎？';
    if(dataset){
      const parts=currentState().components;
      $('[data-tag-component]').innerHTML=parts.map(part=>`<option value="${esc(part.id)}">${esc(part.name)} · ${esc(part.formula)}</option>`).join('');
      $('[data-tag-component]').value=draft.componentId;
      $('[data-tag-site]').innerHTML=dataset.sites.map(site=>`<option value="${esc(site.id)}" ${info.remainingSiteIds.includes(site.id)?'':'disabled'}>${esc(site.id+' · '+site.carbonylCarbon+'–'+site.glycerolO+(info.remainingSiteIds.includes(site.id)?'':' · 已水解'))}</option>`).join('');
      $('[data-tag-site]').value=draft.siteId;
      const selected=dataset.sites.find(site=>site.id===draft.siteId);
      $('[data-tag-selected-bond]').textContent=info.remainingSiteIds.includes(draft.siteId)?`${selected.id}：酰基碳 ${selected.carbonylCarbon} — 甘油氧 ${selected.glycerolO}。這不是碳碳雙鍵。`:'沒有剩餘酯鍵；可撤回一步，再比較另一個水解順序。';
      const part=component(),site=focusSite(),ids=selectedIds();
      $('[data-tag-molecule-name]').textContent=part.name;
      $('[data-tag-molecule-formula]').innerHTML=formulaHTML(part.formula);
      $('[data-tag-focus-reading]').textContent=part.id==='glyceride'?(info.remainingSiteIds.includes(draft.siteId)?`本畫面標出 ${site.id} 的酯基附近：${ids.join('、')}。`:`本畫面為甘油；已沒有酯鍵，${site.id} 只追蹤原來的甘油部位。`):`本畫面為 ${site.id} 釋出的中性油酸；高亮羧基附近 ${ids.join('、')}，不是尚待水解的酯鍵。`;
      $('[data-tag-model-note]').textContent=(part.identityNote||'本機生成的代表構象。')+' 每次只顯示此分子；分開的構象不表示碰撞、距離或反應軌跡。';
    }
    $('[data-tag-site]').disabled=!dataset||loading||!info.remainingSiteIds.length;
    $('[data-tag-component]').disabled=!dataset||loading;
    $('[data-tag-action="cut"]').disabled=!dataset||loading||!info.remainingSiteIds.includes(draft.siteId);
    $('[data-tag-action="undo"]').disabled=!dataset||loading||!draft.chemistry.cutIds.length;
    $('[data-tag-action="reset"]').disabled=!dataset||loading||!draft.chemistry.cutIds.length;
    for(const action of ['full','focus','refit'])$(`[data-tag-action="${action}"]`).disabled=!viewer||loading;
    for(const control of root.querySelectorAll('[data-tag-camera]'))control.disabled=!viewer||loading;
    $('[data-tag-hydrogen]').disabled=!viewer||loading;
    $('[data-tag-hydrogen]').checked=draft.showH;
    for(const mode of ['full','focus'])$(`[data-tag-action="${mode}"]`).setAttribute('aria-pressed',String(draft.view===mode));
    $('[data-tag-viewer-status]').textContent=viewerStatus;
    $('[data-tag-viewer-status]').hidden=!viewerStatus;
    $('[data-tag-feedback]').textContent=feedback;
    drawSummary();
  }
  function drawMolecule({restore=true}={}) {
    if(disposed||!viewer||!dataset)return;
    const molecule=component(),site=focusSite(),selected=selectedIds();
    const bond=molecule.bonds.find(edge=>sameBond(edge,site))||null;
    viewer.showH=draft.showH;viewer.showLabels=true;viewer.labelsOnlySelected=true;
    viewer.setMolecule(molecule,{fit:false,selected,bond,arrows:[],changes:[]});
    viewer.resize();renderedKey=cameraKey();
    const saved=restore?draft.views.get(renderedKey):null;
    if(!saved||!viewer.restoreCameraState(saved))fitCurrent();
    viewer.renderer.domElement.setAttribute('aria-label',`${molecule.name}，${molecule.formula}。可拖曳轉動，亦可使用旋轉與縮放按鈕。`);
  }
  function selectSite(siteId) {
    if(disposed||loading||!dataset||!description().remainingSiteIds.includes(siteId))return;
    rememberCamera();draft.siteId=siteId;draft.componentId='glyceride';feedback=`已選 ${siteId}；選擇部位不會自行水解。`;
    render();drawMolecule();
  }
  function changeChemistry(next) {
    rememberCamera();draft.chemistry=next;draft.componentId='glyceride';
    const available=description().remainingSiteIds;
    if(!available.includes(draft.siteId)&&available.length)draft.siteId=available[0];
    saveStatus='';render();drawMolecule();
  }
  async function load() {
    if(disposed)return;
    const run=++epoch;aborter?.abort();aborter=new AbortController();
    loading=true;viewerStatus='正在載入並核對代表分子…';$('[data-tag-action="retry"]').hidden=true;render();
    try {
      const response=await fetch(new URL('../data/tag-hydrolysis.json',import.meta.url),{signal:aborter.signal});
      if(disposed||run!==epoch)return;
      if(!response.ok)throw new Error('結構資料載入失敗');
      const data=await response.json();if(disposed||run!==epoch)return;
      dataset=validatedDataset(data);normalizeSelection();
      $('[data-tag-limits]').innerHTML='<p>g1／g2／g3 是追蹤三個酯基的模型 ID，不是 sn 命名；使用者選擇的次序不表示酵素選擇性。</p>'+(dataset.limits||[]).map(limit=>`<p>${esc(limit)}</p>`).join('')+'<p>酯基 C=O 與油酸鏈 C=C 是不同的雙鍵。此形式水解不等於氫化；不由本例推定熔點、氧化速率或食品品質。</p><p>酯交換是既有脂肪醯基的連接重分配；不等於本例逐位淨耗水、釋出游離油酸。純三油酸甘油酯也不因重分配相同油醯基就生成新的脂肪酸種類。</p>';
      const identities=[['三油酸甘油酯',dataset.source?.parent],['油酸',dataset.source?.products?.oleicAcid],['甘油',dataset.source?.products?.glycerol]];
      $('[data-tag-identity-sources]').innerHTML='<h3>化學身分來源</h3><ul class="tag-sources">'+identities.filter(([,identity])=>/^https:\/\//.test(identity?.url||'')).map(([label,identity])=>`<li><a href="${esc(identity.url)}" target="_blank" rel="noopener noreferrer">${esc(label)} · PubChem CID ${esc(String(identity.cid))} ↗</a><p>${formulaHTML(identity.formula||'')}；用於核對化學身分，不把計算代表構象稱為實測形狀。</p></li>`).join('')+'</ul>';
      try {
        if(!viewer){viewer=new MoleculeViewer($('[data-tag-viewer]'),{onBond:bond=>{const site=dataset?.sites.find(item=>sameBond(bond,item));if(site)selectSite(site.id);}});viewer.labelLayer.id=prefix+'-labels';viewer.labelLayer.classList.add('tag-labels');viewer.controls.staticMoving=true;}
        loading=false;viewerStatus='';render();drawMolecule();
      } catch {
        viewer?.dispose();viewer=null;renderedKey='';$('[data-tag-viewer]').replaceChildren();
        loading=false;viewerStatus='3D 暫時無法顯示；仍可逐鍵操作並核對反應式。可重試 3D。';$('[data-tag-action="retry"]').hidden=false;render();
      }
    } catch(error) {
      if(disposed||run!==epoch)return;
      loading=false;viewerStatus='結構資料尚未載入或未通過核對，操作暫停。請重試；自己的文字仍保留。';$('[data-tag-action="retry"]').hidden=false;
      dataset=null;render();
    }
  }
  function onChange(event) {
    if(disposed||!root.contains(event.target))return;
    const target=event.target;
    if(target.matches('[data-tag-site]')){selectSite(target.value);target.value=draft.siteId;}
    else if(target.matches('[data-tag-component]')&&!loading&&currentState()?.components.some(part=>part.id===target.value)){rememberCamera();draft.componentId=target.value;render();drawMolecule();}
    else if(target.matches('[data-tag-hydrogen]')&&viewer&&!loading){rememberCamera();draft.showH=target.checked;drawMolecule();}
  }
  function onInput(event) {
    if(disposed||!root.contains(event.target))return;
    const field=event.target.matches('[data-tag-prediction]')?'prediction':event.target.matches('[data-tag-reason]')?'reason':null;
    if(!field)return;
    draft[field]=event.target.value.slice(0,1600);saveStatus='';drawSummary();
  }
  function onClick(event) {
    if(disposed)return;
    const target=event.target?.closest?.('[data-tag-action],[data-tag-camera]');
    if(!target||!root.contains(target)||target.disabled)return;
    const action=target.dataset.tagAction,camera=target.dataset.tagCamera;
    if(action==='retry'){load();return;}
    if(action==='copy'){const field=$('[data-tag-summary]');field.focus();field.select();return;}
    if(action==='save'&&dataset&&typeof onSaveSummary==='function'){
      const value=summary();if(value===draft.savedSummary)return;
      try {if(onSaveSummary(value)===true){draft.savedSummary=value;saveStatus='已附加到本課筆記；自己的操作與解釋仍保留。';}else saveStatus='尚未保存；請選取摘要複製，或重試保存。';}
      catch {saveStatus='尚未保存；原有筆記未變，摘要仍可選取複製。';}
      if(!disposed)drawSummary();return;
    }
    if(!dataset||loading)return;
    if(action==='cut'){
      const site=draft.siteId;if(!description().remainingSiteIds.includes(site))return;
      feedback=`已水解 ${site} 的一條酯鍵；本次新增消耗 1 個 H₂O、釋出 1 個中性油酸。`;
      changeChemistry(cutTagSite(draft.chemistry,site));return;
    }
    if(action==='undo'&&draft.chemistry.cutIds.length){const site=draft.chemistry.cutIds.at(-1);draft.siteId=site;feedback=`已撤回 ${site} 的操作；這是編輯紀錄，不是逆反應。`;changeChemistry(undoTag(draft.chemistry));return;}
    if(action==='reset'){feedback='已回到三油酸甘油酯起點；自己的文字保留。';draft.siteId='g1';changeChemistry(resetTag());return;}
    if(!viewer)return;
    if(action==='full'||action==='focus'){rememberCamera();draft.view=action;drawMolecule({restore:false});render();return;}
    if(action==='refit'){fitCurrent();draft.views.delete(renderedKey);return;}
    if(camera){if(camera==='in'||camera==='out')viewer.zoomView(camera==='in'?.8:1.25);else viewer.orbitView(camera==='left'?-.22:camera==='right'?.22:0,camera==='up'?.22:camera==='down'?-.22:0);}
  }

  root.addEventListener('click',onClick);root.addEventListener('change',onChange);root.addEventListener('input',onInput);
  render();load();
  return () => {
    if(disposed)return;
    rememberCamera();disposed=true;epoch++;aborter?.abort();
    root.removeEventListener('click',onClick);root.removeEventListener('change',onChange);root.removeEventListener('input',onInput);
    viewer?.dispose();viewer=null;
  };
}
