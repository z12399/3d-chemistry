import {
  UNSAPONIFIABLE_ID, UNSAPONIFIABLE_LESSON_ID, UNSAPONIFIABLE_SOURCES, MOLECULES,
  CLASS_CHOICES, RESIDUE_CHOICES, MASS_PRESETS, getMolecule, createUnsaponifiableDraft,
  chooseClassification, cutEster, separateMolecule, resetMolecule, moleculeProducts,
  residueMassBalance, applyMassPreset, recordMassSnapshot, chooseResidueAnswer,
  checkResidueAnswer, buildUnsaponifiableSummary
} from './unsaponifiable-model.js';
import {
  createWorkbenchSessionStore, subscribeWorkbench, markWorkbenchChanged,
  refreshWorkbenchFeedback, saveWorkbenchSummary, escapeHtml as esc, textareaValue
} from './workbench-session.js';

const sessions=createWorkbenchSessionStore({createDraft:createUnsaponifiableDraft,buildSummary:buildUnsaponifiableSummary});
let instance=0;
const fmt=value=>Number(value).toFixed(2);
const labelOf=(options,id)=>options.find(option=>option.id===id)?.label||'尚未選擇';
const itemList=items=>items.length?`<ul>${items.map(item=>`<li><strong>${item.count} 份${esc(item.label)}</strong><small>${esc(item.origin)}</small></li>`).join('')}</ul>`:'<p>此分子沒有分到這裡的產物。</p>';

export function mountUnsaponifiableLab(container,id=UNSAPONIFIABLE_ID,{draftOwner,draftKey=UNSAPONIFIABLE_LESSON_ID,onSaveSummary}={}){
  if(id!==UNSAPONIFIABLE_ID)throw new RangeError(`Unsupported unsaponifiable lab: ${id}`);
  if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const owner=draftOwner&&['object','function'].includes(typeof draftOwner)?draftOwner:container;
  const record=sessions.get(owner,draftKey),draft=record.draft,prefix=`uf-${++instance}`;
  refreshWorkbenchFeedback(record);
  let disposed=false;
  container.innerHTML=`<section class="unsaponifiable-lab" data-uf-lab aria-labelledby="${prefix}-title">
    <header><p class="uf-kicker">動手分解與核帳</p><h3 id="${prefix}-title">不皂化部分從哪裡來？</h3><p>先追蹤酯鍵兩端，再看秤得的殘渣。</p></header>
    <div class="uf-tabs" role="group" aria-label="工作台模式"><button type="button" data-uf-view="molecules" aria-controls="${prefix}-molecules">1　酯鍵與分相</button><button type="button" data-uf-view="mass" aria-controls="${prefix}-mass">2　殘渣質量帳</button></div>
    <section id="${prefix}-molecules" data-uf-panel="molecules">
      <label class="uf-control" for="${prefix}-molecule">選一個分子<select id="${prefix}-molecule" data-uf-molecule>${MOLECULES.map(m=>`<option value="${m.id}">${esc(m.label)}</option>`).join('')}</select></label>
      <fieldset class="uf-classification"><legend>先分類；首次選擇會保留</legend>${CLASS_CHOICES.map(option=>`<label class="uf-choice"><input type="radio" name="${prefix}-class" value="${option.id}" data-uf-class><span>${esc(option.label)}</span></label>`).join('')}</fieldset>
      <div class="uf-reaction" data-uf-reaction></div>
      <div class="uf-actions" role="group" aria-label="逐個酯位水解">${[0,1,2].map(index=>`<button type="button" data-uf-cut="${index}"></button>`).join('')}</div>
      <div class="uf-actions"><button type="button" class="uf-primary" data-uf-separate>完成皂化後分相</button><button type="button" data-uf-reset>重看起始分子</button></div>
      <p class="uf-hint" data-uf-progress aria-live="polite"></p>
      <div data-uf-phases></div><p class="uf-feedback" data-uf-class-feedback></p>
      <p class="uf-boundary">示意條件：酯位完全水解、未酸化、完成洗滌分相；不模擬分配係數或實際回收率。</p>
    </section>
    <section id="${prefix}-mass" data-uf-panel="mass" hidden>
      <p class="uf-assumption"><strong>教學假設，非實驗數據</strong><br>樣品 5.000 g；應回收的不皂化部分共 50 mg（1.00%）。</p>
      <div class="uf-presets" role="group" aria-label="教學誤差情境">${MASS_PRESETS.map(preset=>`<button type="button" data-uf-preset="${preset.id}">${esc(preset.label)}</button>`).join('')}</div>
      <div class="uf-controls">
        <label class="uf-slider" for="${prefix}-recovery"><span>不皂化部分回收率 <output data-uf-output="recovery" for="${prefix}-recovery"></output></span><input id="${prefix}-recovery" type="range" min="0" max="100" step="1" data-uf-mass="recovery"></label>
        <label class="uf-slider" for="${prefix}-blank"><span>試劑／容器空白殘渣 <output data-uf-output="blankMg" for="${prefix}-blank"></output></span><input id="${prefix}-blank" type="range" min="0" max="20" step="1" data-uf-mass="blankMg"></label>
        <label class="uf-slider" for="${prefix}-oil"><span>夾帶未皂化殘油 <output data-uf-output="oilMg" for="${prefix}-oil"></output></span><input id="${prefix}-oil" type="range" min="0" max="50" step="1" data-uf-mass="oilMg"></label>
      </div>
      <div data-uf-mass-result aria-live="polite"></div>
      <div class="uf-actions"><button type="button" data-uf-record>記下一組對照</button><span class="uf-hint" data-uf-record-count></span></div>
      <ol class="uf-snapshots" data-uf-snapshots></ol>
      <details class="uf-detail" data-uf-detail="algorithm"><summary>質量帳如何算？與正式方法差在哪裡？</summary><p>教學殘渣 = 50 × 回收率 ÷ 100 + 空白 + 殘油（mg）。扣教學空白後百分率 =（殘渣 − 空白）÷ 5000 × 100。回收率套用於已定義的不皂化部分；殘油來自樣品中另有的可皂化成分，不再計入那 50 mg。</p><p>為單獨觀察這三項誤差，假設共萃取脂肪酸已另行排除，所有揮發溶劑已除去。扣空白不會校正回收損失或殘油，數值相等也可能只是正負誤差抵銷。</p><p>FSSAI 02.008:2021 另用滴定估共萃取游離脂肪酸，再以 100 ×（殘渣 − 游離脂肪酸）÷ 樣品質量計算。本工作台的「空白」不是該式的游離脂肪酸項，也未完整實作標準方法。</p></details>
    </section>
    <details class="uf-detail" data-uf-detail="mechanism"><summary>為什麼可皂化的酯，仍能留下不皂化部分？</summary><p class="uf-equation">R–C(=O)–O–R′ + OH⁻ → R–COO⁻ + R′–OH</p><p>未酸化端點是脂肪酸鹽；醇的去向取決於其結構。甘油偏親水，甾醇與長鏈醇偏疏水。因此「不皂化物」是指定前處理與萃取後得到的分析分段，並不等於原樣未反應分子的集合。</p><p>圖中的 R 是脂肪鏈，R′ 是醇端骨架；只追蹤酯位與片段，非完整分子構型，也不指定真實水解順序。未完全皂化、乳化、洗滌與溶劑選擇會影響實際回收。</p><p>Schots 等的蠟酯實驗在水解後另行酸化、再用固相萃取分離脂肪酸與脂肪醇；它支持產物身分，不能直接充作本圖未酸化分相的回收數據。</p></details>
    <details class="uf-detail" data-uf-detail="quality"><summary>殘渣與油脂品質有什麼關係？</summary><p>生育酚可攔截脂質過氧自由基，影響氧化安定性；效果還取決於種類、濃度與油的條件，不能說越多必然越好。類胡蘿蔔素等色素會影響油色與食品外觀。</p><p>要回答某種生育酚、甾醇或色素有多少，還須適當分離與定量。鹼處理也可能使易氧化成分損失；「不形成皂」不保證完全不變。總殘渣不能代替維生素 E、膽固醇或品質評分。</p></details>
    <details class="uf-detail" data-uf-detail="practice"><summary>檢查判讀：數字一樣就代表準確嗎？</summary><p>比較「理想回收」與「損失與殘油抵銷」，再留下你的判斷。</p><fieldset><legend>哪項解讀成立？</legend>${RESIDUE_CHOICES.map(option=>`<label class="uf-choice"><input type="radio" name="${prefix}-residue" data-uf-answer value="${option.id}"><span>${esc(option.label)}</span></label>`).join('')}</fieldset><button type="button" data-uf-check>核對判讀</button><div class="uf-feedback" data-uf-answer-feedback aria-live="polite"></div></details>
    <details class="uf-detail" data-uf-detail="notes"><summary>我的觀察與本課筆記（選填）</summary><label class="uf-control" for="${prefix}-observation">記下你的修訂<textarea id="${prefix}-observation" data-uf-observation rows="4" maxlength="2000">${textareaValue(draft.observation)}</textarea></label><div class="uf-actions"><button type="button" class="uf-primary" data-uf-save>把操作摘要附加到本課筆記</button></div><p data-uf-save-status role="status"></p></details>
    <details class="uf-detail" data-uf-detail="sources"><summary>來源與模型範圍</summary><ul>${UNSAPONIFIABLE_SOURCES.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><p>化學片段與相別依上述來源作教學整理；質量帳全部數字是明示假設，不是特定油樣、標準容許值或來源實驗結果。</p></details>
  </section>`;
  const root=container.querySelector('[data-uf-lab]');

  function updateMolecule(){
    const molecule=getMolecule(draft.selected),state=draft.molecules[draft.selected],products=moleculeProducts(draft,draft.selected);
    root.querySelector('[data-uf-molecule]').value=draft.selected;
    root.querySelectorAll('[data-uf-class]').forEach(input=>{input.checked=input.value===state.choice.current;});
    const rows=molecule.bonds.length?molecule.bonds.map((bond,index)=>`<div class="uf-bond-row"><span>${esc(bond)}</span><strong>${state.cut.includes(index)?'醇端 –OH ＋ R–COO⁻':'醇端 –O–C(=O)–R'}</strong></div>`).join(''):`<p class="uf-no-bond">${esc(molecule.short)}<br>沒有脂肪酸酯連接可切。</p>`;
    root.querySelector('[data-uf-reaction]').innerHTML=`<h4>${esc(molecule.label)}：連接示意</h4>${rows}`;
    root.querySelectorAll('[data-uf-cut]').forEach(button=>{const index=Number(button.dataset.ufCut);button.hidden=index>=molecule.bonds.length;button.disabled=state.choice.current===null||state.cut.includes(index);button.textContent=`${state.cut.includes(index)?'已水解':'水解'}${molecule.bonds[index]||''}`;});
    const separate=root.querySelector('[data-uf-separate]');separate.disabled=state.choice.current===null||!products.complete||state.separated;
    root.querySelector('[data-uf-reset]').disabled=state.cut.length===0&&!state.separated;
    root.querySelector('[data-uf-progress]').textContent=state.choice.current===null?'先留下分類，再操作酯位。':!products.complete?`已水解 ${products.released}/${molecule.bonds.length} 個酯位；全部完成後再看分析分相。`:state.separated?'已顯示這個分子各部分的去向。':'可查看未酸化、洗滌後的分相。';
    root.querySelector('[data-uf-phases]').innerHTML=state.separated?`<div class="uf-phases"><div><h4>含水醇皂液</h4>${itemList(products.aqueous)}</div><div><h4>有機萃取相</h4>${itemList(products.organic)}<p class="uf-hint">理想條件下的不皂化分段</p></div></div><p>${esc(molecule.note)}</p>`:'';
    root.querySelector('[data-uf-class-feedback]').textContent=state.choice.checked===null?'':`結構判讀：${labelOf(CLASS_CHOICES,products.classification)}。首次「${labelOf(CLASS_CHOICES,state.choice.first)}」；首次揭示時「${labelOf(CLASS_CHOICES,state.choice.checked)}」；目前「${labelOf(CLASS_CHOICES,state.choice.current)}」。`;
  }
  function updateMass(){
    const result=residueMassBalance(draft.mass);
    root.querySelectorAll('[data-uf-mass]').forEach(input=>{input.value=draft.mass[input.dataset.ufMass];});
    root.querySelectorAll('[data-uf-output]').forEach(output=>{const key=output.dataset.ufOutput;output.textContent=`${draft.mass[key]} ${key==='recovery'?'%':'mg'}`;});
    root.querySelectorAll('[data-uf-preset]').forEach(button=>{const preset=MASS_PRESETS.find(item=>item.id===button.dataset.ufPreset);button.setAttribute('aria-pressed',String(['recovery','blankMg','oilMg'].every(key=>preset[key]===draft.mass[key])));});
    const massRoot=root.querySelector('[data-uf-mass-result]');
    massRoot.innerHTML=!result.valid?`<p>${esc(result.message)}</p>`:`<div class="uf-mass-bar" aria-hidden="true"><span class="uf-recovered" style="width:${result.recoveredMg/1.2}%"></span><span class="uf-blank" style="width:${result.blankMg/1.2}%"></span><span class="uf-oil" style="width:${result.oilMg/1.2}%"></span></div><p class="uf-hint">同一尺度 0–120 mg：<span class="uf-key uf-recovered">已回收 ${fmt(result.recoveredMg)}</span> + <span class="uf-key uf-blank">空白 ${fmt(result.blankMg)}</span> + <span class="uf-key uf-oil">殘油 ${fmt(result.oilMg)}</span></p><dl class="uf-mass-values"><div><dt>秤得總殘渣</dt><dd>${fmt(result.residueMg)} <small>mg</small></dd></div><div><dt>扣教學空白後</dt><dd>${fmt(result.correctedPercent)} <small>%</small></dd></div><div><dt>未回收的不皂化部分</dt><dd>${fmt(result.lostMg)} <small>mg</small></dd></div></dl><p class="uf-boundary">${result.oilMg>0||result.lostMg>0?Math.abs(result.biasMg)<1e-9?'剛好仍是 1.00%，但損失與殘油互相抵銷；這不是準確的證據。':`相對假設目標 50 mg，扣空白後${result.biasMg>0?'多':'少'} ${fmt(Math.abs(result.biasMg))} mg。`:'此設定的目標部分全數回收、無殘油；仍不能把這一總量叫作維生素 E 含量。'}</p>`;
    root.querySelector('[data-uf-record]').disabled=!result.valid||draft.snapshots.length>=6;
    root.querySelector('[data-uf-record-count]').textContent=`已記 ${draft.snapshots.length}/6 組`;
    root.querySelector('[data-uf-snapshots]').innerHTML=draft.snapshots.map((settings,index)=>{const row=residueMassBalance(settings);return `<li><strong>對照 ${index+1}：扣空白後 ${fmt(row.correctedPercent)}%</strong><span>回收 ${row.recovery}%／空白 ${row.blankMg} mg／殘油 ${row.oilMg} mg</span><span>秤得 ${fmt(row.residueMg)} mg；未回收 ${fmt(row.lostMg)} mg</span></li>`;}).join('');
  }
  function updateAnswer(){
    const answer=draft.residueAnswer;
    root.querySelectorAll('[data-uf-answer]').forEach(input=>{input.checked=input.value===answer.current;});
    root.querySelector('[data-uf-check]').disabled=answer.current===null;
    root.querySelector('[data-uf-answer-feedback]').innerHTML=answer.checked===null?'':`<p><strong>${answer.current==='offset'?'目前判讀成立。':'目前判讀仍需修訂。'}</strong>量值相等可由回收損失與殘油抵銷；總殘渣不辨認單一營養素。</p><p class="uf-hint">首次：${esc(labelOf(RESIDUE_CHOICES,answer.first))}<br>首次核對：${esc(labelOf(RESIDUE_CHOICES,answer.checked))}<br>目前：${esc(labelOf(RESIDUE_CHOICES,answer.current))}</p>`;
  }
  function updateView(){
    root.querySelectorAll('[data-uf-panel]').forEach(panel=>{panel.hidden=panel.dataset.ufPanel!==draft.view;});
    root.querySelectorAll('[data-uf-view]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.ufView===draft.view));});
  }
  function updateSave(){if(disposed)return;root.querySelector('[data-uf-save]').disabled=!!record.pending;root.querySelector('[data-uf-save-status]').textContent=record.message;}
  function onChange(event){
    const target=event.target;if(!target?.matches)return;
    if(target.matches('[data-uf-molecule]')){draft.selected=target.value;updateMolecule();}
    else if(target.matches('[data-uf-class]')){chooseClassification(draft,draft.selected,target.value);updateMolecule();}
    else if(target.matches('[data-uf-answer]')){chooseResidueAnswer(draft,target.value);updateAnswer();}
    else return;
    markWorkbenchChanged(record);
  }
  function onInput(event){
    const target=event.target;if(!target?.matches)return;
    if(target.matches('[data-uf-mass]')){draft.mass[target.dataset.ufMass]=Number(target.value);updateMass();}
    else if(target.matches('[data-uf-observation]'))draft.observation=target.value;
    else return;
    markWorkbenchChanged(record);
  }
  function onClick(event){
    const button=event.target?.closest?.('button');if(!button||!root.contains(button)||button.disabled)return;
    if(button.matches('[data-uf-view]')){draft.view=button.dataset.ufView;updateView();}
    else if(button.matches('[data-uf-cut]')){cutEster(draft,draft.selected,Number(button.dataset.ufCut));updateMolecule();}
    else if(button.matches('[data-uf-separate]')){separateMolecule(draft,draft.selected);updateMolecule();}
    else if(button.matches('[data-uf-reset]')){resetMolecule(draft,draft.selected);updateMolecule();}
    else if(button.matches('[data-uf-preset]')){applyMassPreset(draft,button.dataset.ufPreset);updateMass();}
    else if(button.matches('[data-uf-record]')){recordMassSnapshot(draft);updateMass();}
    else if(button.matches('[data-uf-check]')){checkResidueAnswer(draft);updateAnswer();}
    else if(button.matches('[data-uf-save]')){void saveWorkbenchSummary(record,onSaveSummary);return;}
    else return;
    markWorkbenchChanged(record);
  }
  function captureDetails(){root.querySelectorAll('[data-uf-detail]').forEach(detail=>{draft.details[detail.dataset.ufDetail]=detail.open;});}
  function onToggle(event){if(event.target?.matches?.('[data-uf-detail]'))captureDetails();}
  root.addEventListener('change',onChange);root.addEventListener('input',onInput);root.addEventListener('click',onClick);
  root.querySelectorAll('[data-uf-detail]').forEach(detail=>{detail.open=!!draft.details[detail.dataset.ufDetail];});
  root.addEventListener('toggle',onToggle,true);
  const unsubscribe=subscribeWorkbench(record,updateSave);
  updateMolecule();updateMass();updateAnswer();updateView();updateSave();
  return ()=>{if(disposed)return;captureDetails();draft.observation=root.querySelector('[data-uf-observation]').value;disposed=true;root.removeEventListener('change',onChange);root.removeEventListener('input',onInput);root.removeEventListener('click',onClick);root.removeEventListener('toggle',onToggle,true);unsubscribe();markWorkbenchChanged(record);};
}
