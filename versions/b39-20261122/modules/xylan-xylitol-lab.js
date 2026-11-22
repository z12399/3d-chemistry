import {escapeHTML as esc} from './storage.js';
import {MoleculeViewer} from './viewer.js';
import {validateXylanDataset,describeXylanState,describeXylanTransformation,xylanComponent,xylanBondChanges,xylanAtomRole} from './xylan-xylitol-model.js';
import {XYLAN_SOURCES,XYLAN_SWEETNESS} from './xylan-xylitol-data.js';

export const XYLAN_LAB_ID='xylan-xylitol-evidence';
const modes={hydrolysis:'1 水解', 'ring-opening':'2 開環',reduction:'3 還原',dissolution:'4 溶解與甜味'};
const clone=x=>structuredClone(x),signature=x=>JSON.stringify(x),drafts=new WeakMap();
// Restoring a THREE camera can normalize its up vector by a few ulps. Keep the
// original snapshot for the same view so this numerical noise is not a revision.
const sameCamera=(a,b)=>{
 const near=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=64*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(y));
 return !!a&&!!b&&['position','up','target'].every(key=>Array.isArray(a[key])&&Array.isArray(b[key])&&a[key].length===3&&b[key].length===3&&a[key].every((x,i)=>near(x,b[key][i])))&&['maxDistance','aspect'].every(key=>near(a[key],b[key]));
};
const detailKeys=['account','atom-role','hydrogen-bonds','model','writing','history','sweetness','sources','preview'];
const fresh=()=>({mode:'hydrolysis',side:'before',components:{},display:'3d',showH:true,selected:['B_C1'],bond:null,cameras:{},phase:'crystal',sweetness:'10',writing:{reason:'',revision:''},first:null,records:[],details:{},seenModes:[],seenSources:[],savedVersions:[],saving:false,status:'',views:new Set(),cursor:{started:false,first:false,records:0,state:null}});
const order=n=>n===0?'無鍵':n===1?'單鍵':n===2?'雙鍵':`${n} 階鍵`;
const safeHref=x=>/^#(?:learn|process|micro)\/review$/.test(x)?x:'#learn/review';
let sequence=0;
function draftFor(owner,key){if(!owner||!['object','function'].includes(typeof owner))return fresh();let byKey=drafts.get(owner);if(!byKey){byKey=new Map();drafts.set(owner,byKey);}if(!byKey.has(key))byKey.set(key,fresh());return byKey.get(key);}
function stateOf(d){return clone({mode:d.mode,side:d.side,components:d.components,display:d.display,showH:d.showH,selected:d.selected,bond:d.bond,cameras:d.cameras,phase:d.phase,sweetness:d.sweetness,writing:d.writing,details:Object.fromEntries(Object.entries(d.details).filter(([,v])=>v).sort(([a],[b])=>a.localeCompare(b))),seenModes:d.seenModes,seenSources:d.seenSources});}
function stateText(s,data){
 const t=s.mode==='dissolution'?null:describeXylanTransformation(data,s.mode),id=t?t[s.side]:'xylitol-product',v=describeXylanState(data,id),component=s.mode==='dissolution'?'unit-B':s.components[id]||(t?(s.side==='before'?t.defaultBeforeComponent:t.defaultAfterComponent):'unit-B'),m=xylanComponent(data,id,component);
 const lines=[`畫面：${modes[s.mode]}；${t?(s.side==='before'?'反應前端點':'反應後端點'):s.phase==='crystal'?'晶體加入水':'預先溶於水'}`,`目前結構：${m.name} ${m.formula}；${s.display==='3d'?'3D 球棍':'同圖 2D 結構式'}；${s.display==='3d'?(s.showH?'顯示 H':'隱藏 H'):'常規 H 省略；身份不變'}`, `系統：${v.totalFormula}；${v.atomCount} 原子，總電荷 ${v.totalCharge}；A、B、C 為模型單元編號`, `選取：${s.selected.join('、')||'無'}${s.bond?`；鍵 ${s.bond.a}–${s.bond.b}`:''}`];
 if(t)lines.push(t.equation,t.scope);else lines.push(s.phase==='crystal'?'題幹指定木糖醇晶體溶解為淨吸熱；與周圍交換熱可引起冷感。沒有量熱或感官模擬。':'已溶解樣本不再經歷相同的晶體溶解過程；不能只因仍有五個 OH 就預測同等溶解冷感。');
 const i=XYLAN_SWEETNESS.referenceSucrosePercentWv.indexOf(Number(s.sweetness));if(s.mode==='dissolution')lines.push(`文獻曲線估計：蔗糖 ${s.sweetness}% w/v 等甜木糖醇 ${XYLAN_SWEETNESS.xylitolEquisweetPercentWv[i]}% w/v；原表甜度比 ${XYLAN_SWEETNESS.authorReportedPotency[i]}；% w/v 為每100mL溶液克數，不是實時模擬。`);
 lines.push(`目前理由：${s.writing.reason||'未填'}`,`後續修訂：${s.writing.revision||'未填'}`,`曾顯示：${s.seenModes.map(x=>modes[x]).join('、')}`,`曾開啟來源：${s.seenSources.join('、')||'無'}（開啟不表示讀懂）`,`展開區：${Object.keys(s.details).join('、')||'無'}`,`已保存視角：${JSON.stringify(s.cameras)}`);
 return lines.join('\n');
}
const preamble=()=>`【木聚糖 → 木糖 → 木糖醇】v1\n未取代木聚糖三糖片段與選定小分子端點；原子身分和鍵拓撲依來源，3D 是計算構形，2D 是同一原子鍵圖的結構式。不是實驗座標、真實軌跡、催化劑表面或收率模型。形式氫氧配對不是同位素追蹤。只有中間 B 展開與還原；A、C 在後兩步為旁觀分子。3D/讀值已顯示後才保留，不是盲測。\n${XYLAN_SOURCES.map(s=>s.title+'\n'+s.url).join('\n')}`;
function incremental(d,s,data){
 const parts=[];if(!d.cursor.started)parts.push(preamble());if(d.first&&!d.cursor.first)parts.push('首次保留\n'+stateText(d.first,data));
 for(let i=d.cursor.records;i<d.records.length;i++)parts.push(`觀察 ${i+1}\n`+stateText(d.records[i],data));
 if(signature(s)!==d.cursor.state)parts.push('目前狀態與修訂\n'+stateText(s,data));return parts.join('\n\n');
}

export function mountXylanXylitolLab(root,id=XYLAN_LAB_ID,{draftOwner,draftKey=XYLAN_LAB_ID,onSaveSummary,reviewHref='#learn/review',onOpenStructure,fetcher=globalThis.fetch,viewerFactory=(host,options)=>new MoleculeViewer(host,options)}={}){
 if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');if(id!==XYLAN_LAB_ID)throw new RangeError('Unknown xylan activity');
 const d=draftFor(draftOwner,draftKey),prefix=`xx-${++sequence}`,$=s=>root.querySelector(s),$$=s=>root.querySelectorAll(s),f=s=>$(`[data-xx-${s}]`),action=s=>$(`[data-xx-action="${s}"]`);
 let disposed=false,data=null,viewer=null,viewKey=null,loadedKey=null;
 root.innerHTML='<p role="status">正在讀取木聚糖與木糖醇的原子模型…</p>';
 const transformation=()=>d.mode==='dissolution'?null:describeXylanTransformation(data,d.mode);
 function current(){const t=transformation(),stateId=t?t[d.side]:'xylitol-product',state=describeXylanState(data,stateId),componentId=d.mode==='dissolution'?'unit-B':d.components[stateId]||(t?(d.side==='before'?t.defaultBeforeComponent:t.defaultAfterComponent):'unit-B');return {t,stateId,state,componentId,molecule:xylanComponent(data,stateId,componentId)};}
 function capture(){if(viewer&&viewKey&&d.display==='3d'){viewer.settleCamera?.();const next=clone(viewer.cameraState());if(!sameCamera(d.cameras[viewKey],next))d.cameras[viewKey]=next;}}
 function dirty(){if(!d.saving)d.status='';}
 function summary(){if(disposed||!data)return;capture();const s=stateOf(d),text=incremental(d,s,data);f('preview').value=text;action('save').disabled=d.saving||typeof onSaveSummary!=='function'||!text;f('status').textContent=d.status;}
 function selection(atomIds,bond=null){if(disposed)return;d.selected=atomIds;d.bond=bond?{a:bond.a,b:bond.b}:null;dirty();renderModel(false);summary();}
 function renderModel(force=false){
  const c=current(),key=c.stateId+'/'+c.componentId;if(viewKey!==key){capture();viewKey=key;force=true;}
  const selected=d.selected.filter(id=>c.molecule.atoms.some(a=>a.id===id));
  f('selection').textContent=selected.length?selected.map(id=>id+' · '+c.molecule.atoms.find(a=>a.id===id).element).join('；'):'所選原子不在目前分子；可換分子或重新選取。';f('atom-role').textContent=d.selected.map(id=>id+'：'+xylanAtomRole(id)).join('\n');
  if(d.bond){const b=c.molecule.bonds.find(b=>[b.a,b.b].sort().join('–')===[d.bond.a,d.bond.b].sort().join('–'));f('selection').textContent+=`；${d.bond.a}–${d.bond.b}：${order(b?.order||0)}`;}
  $('[data-xx-workspace]').dataset.view=d.display;f('canvas').hidden=d.display!=='3d';f('diagram').hidden=d.display!=='2d';f('camera-controls').hidden=d.display!=='3d';
  if(d.display==='3d'){
   if(!viewer){try{viewer=viewerFactory(f('canvas'),{onAtom:a=>selection([a.id]),onBond:b=>selection([b.a,b.b],b)});if(viewer.labelLayer){viewer.labelLayer.removeAttribute('id');viewer.labelLayer.classList.add('xx-atom-labels');}viewer.labelsOnlySelected=true;}catch(error){f('canvas').textContent='3D 無法啟動：'+error.message+'。仍可切換 2D 結構式。';}}
   if(viewer){viewer.showH=d.showH;viewer.resize();viewer.setMolecule(c.molecule,{fit:force||loadedKey!==key,selected,bond:d.bond,changes:c.t?xylanBondChanges(data,d.mode):[]});if(force||loadedKey!==key){const saved=d.cameras[key];if(saved&&!viewer.restoreCameraState(saved))viewer.fit();}loadedKey=key;}
  }else{
   const diagram=c.molecule.diagram;f('diagram').innerHTML=diagram?`<img src="${esc(new URL('../data/'+diagram.file,import.meta.url).href)}" width="${diagram.width}" height="${diagram.height}" alt="${esc(c.molecule.name)}的同圖二維結構式；立體配置依資料來源。"><p>同一原子鍵圖的 2D 投影；標記依 A／B／C 單元。三糖式可在此區橫向捲動。</p>`:`<p class="xx-small-structure">${esc(c.molecule.formula)} · ${esc(c.molecule.name)}</p>`;
  }
  $$('[data-xx-display]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.xxDisplay===d.display)));f('hydrogen').checked=d.showH;
  f('view-caption').textContent=d.display==='3d'?'計算構形 · 離散端點，非實驗座標或反應軌跡':'同一原子鍵圖的結構式 · 常規 H 省略，保留立體配置';
  f('molecule-name').textContent=`${c.molecule.atoms.length} 個原子 · ${c.molecule.bonds.length} 條共價鍵`;
  f('component').innerHTML=c.state.components.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} · ${esc(x.formula)}</option>`).join('');f('component').value=c.componentId;f('component').disabled=d.mode==='dissolution';
  f('atom').innerHTML='<option value="">選一個原子…</option>'+c.molecule.atoms.map(a=>`<option value="${esc(a.id)}">${esc(a.id)} · ${esc(a.element)}</option>`).join('');f('atom').value=selected.length===1?selected[0]:'';
 }
 function paint(){
  if(disposed||!data)return;if(!d.seenModes.includes(d.mode))d.seenModes.push(d.mode);const c=current(),isD=d.mode==='dissolution';
  $$('[data-xx-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.xxMode===d.mode)));$$('[data-xx-side]').forEach(el=>{el.hidden=isD;el.setAttribute('aria-pressed',String(el.dataset.xxSide===d.side));});
  f('title').textContent=isD?'分子相同，晶體溶解這一步還在嗎？':c.t.title;f('equation').textContent=isD?'木糖醇晶體 + 水 → 木糖醇水溶液':c.t.equation;
  f('selection-panel').hidden=isD;f('reaction-panel').hidden=isD;f('property-panel').hidden=!isD;f('scope').textContent=isD?'3D 只顯示一個木糖醇分子；沒有畫出晶格或水合殼，也不模擬溫度與甜度。':c.t.scope;
  const changes=isD?[]:xylanBondChanges(data,d.mode),isHydrogen=b=>d.mode==='hydrolysis'&&[b.a,b.b].some(id=>id.split('_')[1].startsWith('H')),changeButton=(b,i)=>`<button type="button" data-xx-change="${i}"><span>${esc(b.a)}–${esc(b.b)}</span><strong>${order(b.before)} → ${order(b.after)}</strong></button>`;
  f('changes').innerHTML=changes.map((b,i)=>isHydrogen(b)?'':changeButton(b,i)).join('');f('hydrogen-changes').innerHTML=changes.map((b,i)=>isHydrogen(b)?changeButton(b,i):'').join('');$('[data-xx-detail="hydrogen-bonds"]').hidden=!changes.some(isHydrogen);
  f('description').textContent=isD?'':c.t.description;
  f('account').textContent=(isD?'前一還原步驟的模型收支；未建立整份溶液物料帳。\n':'')+c.state.components.map(x=>`${x.name}：${x.formula}（${x.atomCount} 原子）`).join('\n')+`\n總計 ${c.state.totalFormula}；${c.state.atomCount} 原子；總電荷 ${c.state.totalCharge}。`;
  $$('[data-xx-phase]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.xxPhase===d.phase)));
  f('property-result').textContent=d.phase==='crystal'?'晶體正在溶解：題幹指定這是淨吸熱過程。周圍供熱，可能產生冷感。':'已在水中溶解：沒有再次拆開相同晶格的溶解步驟；不能直接期待相同的溶解冷感。後續混合或稀釋仍可能有熱效應，需條件與量測。';
  f('energy').innerHTML=d.phase==='crystal'?'<span>周圍</span><b aria-hidden="true">熱 →</b><span>晶體溶解</span>':'<span>水溶液</span><b aria-hidden="true">·</b><span>沒有新一輪晶體溶解</span>';
  const sweetIndex=XYLAN_SWEETNESS.referenceSucrosePercentWv.indexOf(Number(d.sweetness));f('sweetness').value=d.sweetness;f('sweetness-result').textContent=`${XYLAN_SWEETNESS.xylitolEquisweetPercentWv[sweetIndex]}% w/v 木糖醇等甜；原表甜度比 ${XYLAN_SWEETNESS.authorReportedPotency[sweetIndex]}`;
  action('record').disabled=d.records.length>=12;f('record-count').textContent=`${d.records.length} / 12 次`;
  f('first').textContent=d.first?stateText(d.first,data):'尚未保留。結構與結果已顯示，首次保留不代表盲測。';
  f('records').innerHTML=d.records.map((s,i)=>`<details><summary>觀察 ${i+1} · ${esc(modes[s.mode])}</summary><pre>${esc(stateText(s,data))}</pre><button type="button" data-xx-replay="${i}">回放這次結構與視角</button></details>`).join('');
  f('saved').innerHTML=d.savedVersions.map((s,i)=>`<details><summary>已附加版本 ${i+1}</summary><pre>${esc(s)}</pre></details>`).join('');renderModel();summary();
 }
 function build(){
  root.innerHTML=`<section class="xylan-lab" aria-labelledby="${prefix}-title"><nav class="xx-tabs" aria-label="木糖醇步驟">${Object.entries(modes).map(([id,label])=>`<button type="button" data-xx-mode="${id}">${label}</button>`).join('')}</nav><p class="xx-equation" data-xx-equation></p><div class="xx-workspace" data-xx-workspace><div class="xx-visual"><div class="xx-view-controls"><div class="xx-buttons"><button type="button" data-xx-side="before">反應前</button><button type="button" data-xx-side="after">反應後</button></div><div class="xx-buttons"><button type="button" data-xx-display="3d">3D 球棍</button><button type="button" data-xx-display="2d">2D 結構式</button></div></div><label>目前查看的分子<select data-xx-component></select></label><div class="xx-canvas" data-xx-canvas tabindex="0" aria-label="三維原子球棍模型：拖曳旋轉，滾輪縮放；下方另有按鈕"></div><div class="xx-diagram" data-xx-diagram hidden tabindex="0" role="region" aria-label="可橫向捲動的二維結構式"></div><div class="xx-camera-controls" data-xx-camera-controls><button type="button" data-xx-action="rotate-left" aria-label="向左旋轉模型">↶ 左轉</button><button type="button" data-xx-action="rotate-up" aria-label="向上旋轉模型">↑ 上轉</button><button type="button" data-xx-action="zoom-in">放大</button><button type="button" data-xx-action="zoom-out">縮小</button><button type="button" data-xx-action="fit">重置視角</button><label><input type="checkbox" data-xx-hydrogen>顯示 H</label></div><p class="xx-molecule-name" data-xx-molecule-name></p><p class="xx-caption" data-xx-view-caption></p></div><aside class="xx-readout"><h2 id="${prefix}-title" data-xx-title></h2><div data-xx-selection-panel><label>選取原子（3D 高亮）<select data-xx-atom></select></label><p class="xx-selection" data-xx-selection aria-live="polite"></p></div><section data-xx-reaction-panel><h3>這一步改了哪些鍵？</h3><div class="xx-changes" data-xx-changes></div><details data-xx-detail="hydrogen-bonds"><summary>水解的形式 H 配對</summary><div class="xx-changes" data-xx-hydrogen-changes></div><p>補齊氫原子的淨配對；不是溶液中的實際質子去向。</p></details><p data-xx-description></p></section><section data-xx-property-panel hidden><h3>改變樣本狀態</h3><div class="xx-buttons"><button type="button" data-xx-phase="crystal">晶體加入水</button><button type="button" data-xx-phase="dissolved">已溶於水</button></div><div class="xx-energy" data-xx-energy></div><p class="xx-result" data-xx-property-result></p><p>拆開晶格及重整溶劑的吸熱，與水合放熱共同決定淨溶解熱；不能只數 OH。</p><h3>甜味要靠感官證據</h3><label>蔗糖參照濃度<select data-xx-sweetness><option value="5">5% w/v</option><option value="10">10% w/v</option><option value="15">15% w/v</option></select></label><p class="xx-result" data-xx-sweetness-result></p><p>同一研究、不同蔗糖參照濃度的曲線估計。% w/v 是每 100 mL 溶液的克數；甜度比不是固定分子常數。</p></section></aside></div><p class="xx-scope" data-xx-scope></p><div class="xx-record-bar"><button type="button" data-xx-action="record">保留這次觀察</button><span data-xx-record-count></span>${typeof onOpenStructure==='function'?'<button type="button" data-xx-action="structure">對照木糖脫水分支</button>':''}</div><details data-xx-detail="atom-role"><summary>所選原子的角色與形式配對</summary><pre data-xx-atom-role></pre></details><details data-xx-detail="account"><summary>所有分子與元素帳</summary><pre data-xx-account></pre><p>全三糖若都完全還原：C₁₅H₂₆O₁₃ + 2 H₂O + 3 H₂ → 3 C₅H₁₂O₅。畫面只還原 B，所以畫面是兩個木糖加一個木糖醇，不能誤讀成三個木糖醇。</p></details><details data-xx-detail="model"><summary>模型、立體配置與使用界線</summary><p>用不帶側鏈的三糖代表 β-(1→4) 木聚糖主鏈；半纖維素不是單一純物質。天然木聚糖的側鏈與纖維素接觸不在此小模型內。糖苷鍵的 β 配置不表示游離還原端永遠是 β；三個 β 木糖是選定端點，水中可變旋。</p><p>只展開和還原 B。C1 的醛基變成 CH₂OH；不增碳、不移走氧。C2、C3、C4 的映射鄰接立體關係保留，但兩端等價後 CIP 名稱與優先序可能改變；不可只按 R/S 字母是否相同判定翻轉。</p><p>3D 由 ETKDG 與 MMFF94 產生候選構形；2D 來自同一原子鍵圖。沒有把端點插值當真實途徑，也沒有催化表面、質子交換、溶液比例、反應速率、收率、結晶晶格或感官預測。H/O 配對只為形式記帳。</p></details><details data-xx-detail="writing"><summary>寫下解釋與修訂</summary><label>目前理由<textarea rows="3" data-xx-writing="reason"></textarea></label><label>後續修訂<textarea rows="3" data-xx-writing="revision"></textarea></label><p>自由文字不自動評分；回放觀察不覆蓋目前文字。同頁離開再回來可接續，重載前請附加筆記並匯出。</p></details><details data-xx-detail="history"><summary>回看與回放保留內容</summary><h3>首次保留</h3><pre data-xx-first></pre><h3>觀察記錄</h3><div data-xx-records></div><h3>已附加版本</h3><div data-xx-saved></div></details><details data-xx-detail="sweetness"><summary>甜度原表與感官方法</summary><div class="xx-table-wrap" tabindex="0" role="region" aria-label="甜度來源資料表"><table><caption>文獻 Table 4：曲線估計，非個別受試者的原始讀值</caption><thead><tr><th>蔗糖參照（% w/v）</th><th>等甜木糖醇（% w/v）</th><th>原表相對甜度</th></tr></thead><tbody>${XYLAN_SWEETNESS.referenceSucrosePercentWv.map((n,i)=>`<tr><td>${n}</td><td>${XYLAN_SWEETNESS.xylitolEquisweetPercentWv[i]}</td><td>${XYLAN_SWEETNESS.authorReportedPotency[i]}</td></tr>`).join('')}</tbody></table></div><p>40 位成人，過濾水溶液，經個別尺度使用標準化的 gLMS 感官評分。相對甜度為等甜時的蔗糖濃度／甜味劑濃度。各欄分別四捨五入，所以保留原表數字，不從已四捨五入濃度重新計算。</p><p>供試溫度原文未明確報告；不能補成已知。此表不代表所有食品基質或每個人的感受，也不是受體結合或 OH 數目的實驗。</p></details><details data-xx-detail="sources"><summary>來源與官方題目</summary>${XYLAN_SOURCES.map(s=>`<article><a href="${esc(s.url)}" target="_blank" rel="noopener" data-xx-source="${esc(s.id)}">${esc(s.title)}</a><p>${esc(s.locator)}。${esc(s.note)}</p></article>`).join('')}<p>115 年食品化學第 2 題要求用結構說明半纖維素來源的五碳甜味糖醇。本課是原創教學延伸；不表示官方完整解答或考試覆蓋率。</p></details><details data-xx-detail="preview"><summary>本次將附加的新增內容</summary><textarea data-xx-preview readonly rows="8" aria-label="本次新增摘要"></textarea></details><div class="xx-save"><button type="button" data-xx-action="save">附加至本課筆記</button><span data-xx-status role="status"></span><a href="${esc(safeHref(reviewHref))}">我的複習 →</a></div></section>`;
  detailKeys.forEach(key=>{const el=$(`[data-xx-detail="${key}"]`);el.open=!!d.details[key];el.ontoggle=()=>{if(disposed)return;d.details[key]=el.open;dirty();summary();};});
  $$('[data-xx-writing]').forEach(el=>{el.value=d.writing[el.dataset.xxWriting];el.oninput=()=>{if(disposed)return;d.writing[el.dataset.xxWriting]=el.value;dirty();summary();};});
  root.addEventListener('click',onClick);f('component').onchange=()=>{if(disposed)return;capture();d.components[current().stateId]=f('component').value;dirty();paint();};f('atom').onchange=()=>{if(!disposed&&f('atom').value)selection([f('atom').value]);};f('hydrogen').onchange=()=>{if(disposed)return;capture();d.showH=f('hydrogen').checked;dirty();renderModel();summary();};
  f('sweetness').onchange=()=>{if(disposed)return;d.sweetness=f('sweetness').value;dirty();paint();};
  d.views.add(paint);paint();
 }
 async function save(){
  if(disposed||d.saving||typeof onSaveSummary!=='function')return;capture();const s=stateOf(d),payload=incremental(d,s,data);if(!payload)return;if(payload.length>10000){d.status='新增內容超過筆記單次上限；全文可選取複製，尚未保存。';summary();return;}
  const ack={started:true,first:!!d.first,records:d.records.length,state:signature(s)};d.saving=true;d.status='正在保存…';for(const view of d.views)view();
  try{if(await onSaveSummary(payload)===true){d.cursor=ack;d.savedVersions.push(payload);d.status='已附加至本課筆記。';}else d.status='尚未保存；新增內容仍可重試或複製。';}catch(error){d.status='保存未完成：'+(error?.message||String(error));}finally{d.saving=false;for(const view of d.views)view();}
 }
 function onClick(event){
  if(disposed||!data)return;const el=event.target.closest('button,a[data-xx-source]');if(!el||!root.contains(el))return;const a=el.dataset;capture();
  if(a.xxMode){d.mode=a.xxMode;d.side='before';d.bond=null;dirty();paint();return;}
  if(a.xxSide){d.side=a.xxSide;dirty();paint();return;}
  if(a.xxDisplay){d.display=a.xxDisplay;dirty();renderModel(true);summary();return;}
  if(a.xxPhase){d.phase=a.xxPhase;dirty();paint();return;}
  if(a.xxChange!==undefined){const b=xylanBondChanges(data,d.mode)[Number(a.xxChange)];selection([b.a,b.b],b);return;}
  if(a.xxSource){if(!d.seenSources.includes(a.xxSource))d.seenSources.push(a.xxSource);dirty();summary();return;}
  if(a.xxReplay!==undefined){const s=d.records[Number(a.xxReplay)];if(!s)return;for(const key of ['mode','side','components','display','showH','selected','bond','cameras','phase','sweetness'])d[key]=clone(s[key]);viewKey=null;loadedKey=null;d.status='已回放結構與視角；目前文字、首次保留與記錄不變。';paint();return;}
  switch(a.xxAction){
   case 'record':if(d.records.length<12){const s=stateOf(d);if(!d.first)d.first=clone(s);d.records.push(s);d.status='已保留這次觀察；尚未附加至筆記。';paint();}break;
   case 'save':void save();break;
   case 'structure':if(typeof onOpenStructure==='function'){try{const ok=onOpenStructure();if(ok===false){d.status='結構頁未開啟；目前草稿仍保留。';summary();}}catch(error){d.status='結構頁未開啟：'+error.message;summary();}}break;
   case 'rotate-left':viewer?.orbitView(-.25,0);capture();dirty();summary();break;
   case 'rotate-up':viewer?.orbitView(0,.25);capture();dirty();summary();break;
   case 'zoom-in':viewer?.zoomView(.85);capture();dirty();summary();break;
   case 'zoom-out':viewer?.zoomView(1.18);capture();dirty();summary();break;
   case 'fit':viewer?.fit();capture();dirty();summary();break;
  }
 }
 function dispose(){if(disposed)return;capture();disposed=true;d.views.delete(paint);viewer?.dispose();root.removeEventListener('click',onClick);$$('[data-xx-writing],[data-xx-detail],[data-xx-component],[data-xx-atom],[data-xx-hydrogen],[data-xx-sweetness]').forEach(el=>{el.oninput=null;el.ontoggle=null;el.onchange=null;});}
 dispose.ready=(async()=>{try{const response=await fetcher(new URL('../data/xylan-xylitol-models.json',import.meta.url));if(!response.ok)throw new Error('結構資料讀取失敗（'+response.status+'）');const candidate=validateXylanDataset(await response.json());if(disposed)return false;data=candidate;build();return true;}catch(error){if(!disposed)root.innerHTML=`<p role="alert">木糖醇工作台無法載入：${esc(error?.message||String(error))}。可離開後重試。</p>`;return false;}})();
 return dispose;
}
