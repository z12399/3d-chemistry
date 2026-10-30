import {escapeHTML as esc} from './storage.js';
import {validateLactaseMolecular,lphRangeResidues,lphResidueReadout} from './lactase-molecular-model.js';
import {LactaseMolecularViewer} from './lactase-molecular-viewer.js';
const drafts=new WeakMap();let sequence=0;
const fresh=()=>({range:'mature',representation:'atoms',color:'domain',residueNumber:1749,atomName:null,camera:null});
const sourceLink=(url,label)=>{try{const parsed=new URL(url);if(parsed.protocol==='https:')return `<a href="${esc(parsed.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;}catch{}return esc(label);};
export function mountLactaseMolecularLab(root,{draftOwner,fetcher=globalThis.fetch,onState=()=>{},viewerFactory=(host,options)=>new LactaseMolecularViewer(host,options)}={}){
  const owner=draftOwner&&typeof draftOwner==='object';if(owner&&!drafts.has(draftOwner))drafts.set(draftOwner,fresh());
  const state=owner?drafts.get(draftOwner):fresh(),prefix='lph-molecule-'+(++sequence);
  let disposed=false,data=null,viewer=null,epoch=0,aborter=null,error='',residueOptions='';
  const field=name=>root.querySelector(`[data-lph-${name}]`);
  root.innerHTML=`<section class="lph-molecular-lab" aria-labelledby="${prefix}-title">
    <h3 class="lph-molecular-sr-only" id="${prefix}-title">人體乳糖酶 · 蛋白質 3D</h3>
    <p class="lph-molecular-source"><a href="https://alphafold.ebi.ac.uk/entry/P09848" target="_blank" rel="noopener noreferrer">人體 P09848 · AlphaFold v6 單鏈預測</a> · 固定來源座標</p>
    <div class="lph-molecular-workspace"><div><div class="lph-protein-viewport" data-lph-viewport></div><p role="status" data-lph-viewer-status>正在載入蛋白分子座標…</p>
      <div class="lph-molecular-controls">
      <label for="${prefix}-range">顯示哪一段<select id="${prefix}-range" data-lph-range disabled><option value="mature">成熟鏈 · 869–1927</option><option value="full">前驅物 · 1–1927</option><option value="IV">同源區 IV · 1373–1846</option></select></label>
      <label for="${prefix}-representation">分子畫法<select id="${prefix}-representation" data-lph-representation disabled><option value="trace">主鏈走向（參考）</option><option value="atoms">全部重原子球棍</option><option value="site">催化部位附近球棍</option><option value="residue">只看選定殘基</option></select></label>
      <label for="${prefix}-color">主鏈／原子顏色<select id="${prefix}-color" data-lph-color disabled><option value="domain">原子元素／主鏈同源區</option><option value="confidence">pLDDT 可信度</option></select></label>
      </div>
      <div class="lph-molecular-actions"><button type="button" data-lph-action="fit" disabled>重置目前視角</button><button type="button" data-lph-action="site" disabled>放大催化部位</button><button type="button" data-lph-action="residue" disabled>只看所選殘基</button></div>
      <details><summary>旋轉與縮放按鈕</summary><div class="lph-molecular-actions">${[['left','向左旋轉'],['right','向右旋轉'],['up','向上旋轉'],['down','向下旋轉'],['in','放大'],['out','縮小']].map(([action,label])=>`<button type="button" data-lph-camera="${action}" disabled>${label}</button>`).join('')}</div></details>
      <div class="lph-molecular-legend" data-lph-legend></div><p class="lph-molecular-small" data-lph-model-count></p>
    </div><aside class="lph-molecular-readout"><h4>選取部位</h4>
      <div class="lph-molecular-actions"><button type="button" data-lph-action="acid" disabled>E1538 · 酸／鹼</button><button type="button" data-lph-action="nucleophile" disabled>E1749 · 親核</button></div>
      <label for="${prefix}-residue">選取殘基<select id="${prefix}-residue" data-lph-residue disabled></select></label>
      <h4 data-lph-selection>等待來源資料</h4><p data-lph-role></p><p data-lph-confidence></p><p data-lph-atom></p>
    </aside></div>
    <details class="lph-molecular-source-details"><summary>模型來源、化學鍵與適用範圍</summary>
      <p>座標由 AlphaFold 預測；完整來源為 1,927 個殘基、15,481 個重原子。模型只有單鏈，未提供已驗證二聚界面、乳糖結合姿勢、水、醣鏈或質子。成熟範圍只隱藏前段，沒有重新預測成熟後的摺疊。</p>
      <p>pLDDT 表示局部預測可信度；高分不驗證兩鏈界面、域間相對位置或結合姿勢。C、N、O、S 表示原子；主鏈帶只追 Cα 走向，帶子不是 Cα–Cα 化學鍵。</p>
      <p>「只看選定殘基」與「催化部位附近球棍」只隱藏範圍外的原子；它們沒有從蛋白切斷化學鍵，也未替所選殘基補上端基或氫。</p>
      <p>「作用方式」分頁的乳糖與催化側鏈片段是獨立機構示意，與此蛋白來源座標分開。<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4271221/" target="_blank" rel="noopener noreferrer">E1538／E1749 的人類突變與機制探針證據</a>。</p>
      <div data-lph-topology-source></div>
    </details>
    <button type="button" data-lph-action="retry" hidden>重試載入蛋白 3D</button>
  </section>`;
  function draw(reason='load'){
    if(disposed||!data)return;
    const residues=lphRangeResidues(data,state.range);
    if(!residues.some(r=>r.number===state.residueNumber)){state.residueNumber=1749;state.atomName=null;}
    if(residueOptions!==state.range){field('residue').innerHTML=residues.map(r=>`<option value="${r.number}">${r.code}${r.number} · ${r.name}</option>`).join('');residueOptions=state.range;}
    for(const key of ['range','representation','color'])field(key).value=state[key];field('residue').value=String(state.residueNumber);
    const readout=lphResidueReadout(data,state.residueNumber,state.atomName);
    field('selection').textContent=`${readout.name} ${readout.number} · ${readout.chineseName}`;
    field('role').textContent=readout.role;
    field('confidence').textContent=`pLDDT（局部可信度）：${readout.pLDDT.toFixed(2)} / 100`;
    field('atom').textContent=readout.atom?`原子 ${readout.atom.name}（${readout.atom.element}） · ${readout.atom.position.map(v=>v.toFixed(3)).join(', ')} Å；本殘基 ${readout.atomCount} 個重原子。`:`本殘基 ${readout.atomCount} 個重原子；點原子看座標。`;
    field('legend').textContent=state.color==='confidence'?'pLDDT：深藍 ≥90、淺藍 70–<90、黃 50–<70、橘 <50；數值是預測可信度。':`${state.representation==='trace'?'主鏈：III 藍綠、IV 棕橘、前段同源區／連接區各色；':''}球棍：C 灰、N 藍、O 紅、S 黃。`;
    const count=residues.reduce((n,r)=>n+r.atomIndices.length,0);
    field('model-count').textContent=state.representation==='residue'?`畫面只顯示 ${readout.name}${readout.number}：1 個殘基 · ${readout.atomCount} 個重原子。其他原子僅隱藏，未斷鍵。`:`目前範圍 ${residues.length} 個殘基 · ${count.toLocaleString()} 個重原子。${state.representation==='site'?'畫面只顯示催化側鏈約 8 Å 內的鄰近殘基；其他原子僅隱藏，未斷鍵。':''}`;
    onState({label:`人體 LPH 3D · ${readout.name}${readout.number}`,detail:`AlphaFold v6 單鏈預測；範圍 ${state.range}；畫法 ${state.representation}；著色 ${state.color}。選 ${readout.name}${readout.number}（${readout.chineseName}），pLDDT ${readout.pLDDT}；${readout.role}。${readout.atom?`原子 ${readout.atom.name}：${readout.atom.position.join(', ')} Å。`:''}座標不是人體實驗結構，不含乳糖結合姿勢。`,stateId:`${state.range}:${state.representation}:${state.color}:${readout.number}:${readout.atom?.name||''}`,sourceIds:['lph-alphafold','lph-uniprot','lph-catalysis-2014']},{reason});
  }
  function normalizeResidue(){if(data&&!lphRangeResidues(data,state.range).some(residue=>residue.number===state.residueNumber)){state.residueNumber=1749;state.atomName=null;}}
  function drawTopologySource(){
    const ccd=data?.topologySource?.ccd;
    field('topology-source').innerHTML=ccd?`<p>化學鍵模板：${sourceLink(ccd.descriptionUrl,'wwPDB Chemical Component Dictionary（CCD）')}。CCD 鍵級是繪圖慣例，不代表這份 AlphaFold 座標已驗證的局部質子化狀態或局域電子分布。</p><details><summary>化學鍵模板原始檔（${ccd.files.length} 份）</summary><ul>${ccd.files.map(file=>`<li>${sourceLink(file.url,file.name)}<br><span class="lph-molecular-file-hash">SHA-256 ${esc(file.sha256)}</span></li>`).join('')}</ul></details>`:'';
  }
  function update({fit=false,site=false,residue=false}={}){
    if(!data||disposed)return;
    normalizeResidue();
    try{viewer?.setView(state);if(site)viewer?.focusSite();else if(residue){viewer?.focusResidue(state.residueNumber);if(viewer?.view?.representation)state.representation=viewer.view.representation;}else if(fit)viewer?.fit();}catch(caught){error=caught.message;field('viewer-status').textContent='3D 顯示暫時中斷；來源殘基資料仍可閱讀。';root.querySelector('[data-lph-action="retry"]').hidden=false;}
    draw('interaction');
  }
  async function load(){
    const token=++epoch;aborter?.abort();aborter=new AbortController();field('viewer-status').textContent='正在載入並核對人體蛋白原子座標…';root.querySelector('[data-lph-action="retry"]').hidden=true;
    try{
      const response=await fetcher('./data/lactase-molecular.json',{signal:aborter.signal});if(!response.ok)throw new Error('data unavailable');
      const received=validateLactaseMolecular(await response.json());if(disposed||token!==epoch)return;data=received;normalizeResidue();drawTopologySource();
      viewer?.dispose();viewer=viewerFactory(field('viewport'),{onSelect:selection=>{if(disposed)return;state.residueNumber=selection.residueNumber;state.atomName=selection.atomName||null;update();},onError:()=>{if(!disposed){field('viewer-status').textContent='3D 顯示暫時中斷；文字資料保留，可重試。';root.querySelector('[data-lph-action="retry"]').hidden=false;}}});
      viewer.setDataset(data);viewer.setView(state);if(!state.camera||!viewer.restoreCamera(state.camera))viewer.fit();
      root.querySelectorAll('select,button').forEach(el=>el.disabled=false);field('viewer-status').textContent='座標已核對 · 拖曳旋轉、滾輪縮放、點選原子。';draw();
    }catch(caught){if(disposed||token!==epoch)return;error=caught.message;if(data){root.querySelectorAll('select').forEach(el=>el.disabled=false);draw();}field('viewer-status').textContent=data?'3D 顯示暫時無法啟動；來源殘基資料仍可閱讀，可重試。':'蛋白 3D 暫時無法載入或核對，請重試。';root.querySelector('[data-lph-action="retry"]').hidden=false;}
  }
  function change(event){const target=event.target;if(disposed||!data)return;
    for(const key of ['range','representation','color'])if(target===field(key)){state[key]=target.value;state.atomName=null;update({fit:key==='range',site:key==='representation'&&state.representation==='site',residue:key==='representation'&&state.representation==='residue'});return;}
    if(target===field('residue')){state.residueNumber=Number(target.value);state.atomName=null;update({residue:true});}
  }
  function click(event){const button=event.target.closest?.('button');if(!button||!root.contains(button)||disposed||button.disabled)return;
    const action=button.dataset.lphAction;if(action==='retry'){load();return;}if(!viewer)return;
    if(action==='fit'){viewer.fit();draw('interaction');}else if(action==='site'){state.representation='site';update({site:true});}else if(action==='residue')update({residue:true});else if(action==='acid'||action==='nucleophile'){state.residueNumber=action==='acid'?1538:1749;state.atomName=null;state.representation='site';update({site:true});}
    else if(button.dataset.lphCamera){const dir=button.dataset.lphCamera;['in','out'].includes(dir)?viewer.zoom(dir):viewer.rotate(dir);draw('interaction');}
  }
  function canvasInteraction(event){if(event.target!==viewer?.canvas||disposed||!data)return;if(event.type==='pointerup'||event.type==='wheel'||event.type==='keydown'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))draw('interaction');}
  root.addEventListener('change',change);root.addEventListener('click',click);root.addEventListener('pointerup',canvasInteraction);root.addEventListener('keydown',canvasInteraction);root.addEventListener('wheel',canvasInteraction,{passive:true});load();
  return ()=>{if(disposed)return;disposed=true;epoch++;aborter?.abort();if(viewer)state.camera=viewer.cameraState();viewer?.dispose();root.removeEventListener('change',change);root.removeEventListener('click',click);root.removeEventListener('pointerup',canvasInteraction);root.removeEventListener('keydown',canvasInteraction);root.removeEventListener('wheel',canvasInteraction);};
}
