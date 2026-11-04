import {escapeHTML as esc} from './storage.js';
import {LIPID_PRODUCT_DATA} from './lipid-product-data.js';

export const LIPID_PRODUCTS=LIPID_PRODUCT_DATA.products;
let instance=0;
const bondLabel=b=>`C${b.start}=C${b.end} (${b.geometry})`;
const geometryLabel=p=>p.doubleBonds.every(b=>b.geometry==='E')?'兩個 E':'一個 E、一個 Z';
const title=p=>`${p.hydroperoxyCarbon}-HPODE · ${geometryLabel(p)}`;
const blank=()=>({bonds:[{start:0,geometry:''},{start:0,geometry:''}],checked:false,revealed:false,writing:'',seen:{feedback:false,reference:false}});
const productDrafts=new WeakMap();
function productDraft(owner,key){
  const create=()=>({id:LIPID_PRODUCTS[0].id,full:false,attempts:new Map(),records:[],review:0,cursor:0,saved:new Map(),savedVersions:[],views:new Set(),savedView:`${LIPID_PRODUCTS[0].id}|false`,saving:false,status:''});
  if(!owner||(typeof owner!=='object'&&typeof owner!=='function'))return create();
  let entries=productDrafts.get(owner);if(!entries){entries=new Map();productDrafts.set(owner,entries);}
  if(!entries.has(key))entries.set(key,create());return entries.get(key);
}
const productSeenText=seen=>[seen.feedback?'檢查回饋':'',seen.reference?'參考結構':''].filter(Boolean).join('、')||'尚未開啟本工作台回饋／參考結構';
const productSnapshotText=snapshot=>`${title(LIPID_PRODUCTS.find(p=>p.id===snapshot.id))}｜${snapshot.id}\n選擇：${snapshot.bonds.map(b=>b.start?`C${b.start}=C${b.start+1} (${b.geometry||'未選 E/Z'})`:'未選').join('、')}\n我的判斷：${snapshot.writing||'未填寫'}\n操作前已看過：${productSeenText(snapshot.seen)}`;

export function evaluateLipidProduct(id,bonds) {
  const product=LIPID_PRODUCTS.find(p=>p.id===id);
  if(!product)throw new RangeError('Unknown linoleate product');
  if(!Array.isArray(bonds)||bonds.length!==2)throw new TypeError('Choose two carbon-carbon bonds');
  const chosen=bonds.map(b=>{
    if(!b||!Number.isInteger(b.start)||b.start<0||b.start>17||!['','E','Z'].includes(b.geometry))throw new RangeError('Invalid double bond selection');
    return {start:b.start,geometry:b.geometry};
  });
  const incomplete=chosen.some(b=>b.start===0||!b.geometry);
  const duplicate=chosen[0].start!==0&&chosen[0].start===chosen[1].start;
  const expected=product.doubleBonds;
  const positionsCorrect=!incomplete&&!duplicate&&expected.every(e=>chosen.some(b=>b.start===e.start));
  const geometryCorrect=positionsCorrect&&expected.every(e=>chosen.some(b=>b.start===e.start&&b.geometry===e.geometry));
  return {incomplete,duplicate,positionsCorrect,geometryCorrect,complete:geometryCorrect};
}

export function lipidProductFeedback(id,bonds) {
  const result=evaluateLipidProduct(id,bonds);
  if(result.incomplete)return '先選兩條不同的碳碳雙鍵，並選擇各自的 E 或 Z。';
  if(result.duplicate)return '兩欄選到同一條鍵了；請指出兩條不同的碳碳雙鍵。';
  if(!result.positionsCorrect)return '雙鍵位置還需要調整。—OOH 的碳位與雙鍵起點不同；試著追蹤反應區的雙鍵移位。';
  if(!result.geometryCorrect)return '兩條雙鍵的位置都對了。再比較 E/Z：這裡要組出的是題目指定的代表異構物。';
  return '位置與 E/Z 都符合本題所選代表型。下方可對照參考結構，也可切換完整 18 碳圖；這不代表所有條件只生成這一種產物。';
}

const figure=(model,id,caption)=>`<figure class="lipid-product-figure"><figcaption>${caption}</figcaption><div class="lipid-diagram-scroll" tabindex="0" role="region" aria-label="${esc(caption)}結構圖，可橫向捲動"><img data-lipid-diagram="${id}" src="${esc(model.detailImage)}" alt="${esc(caption)}；${model.doubleBonds.map(bondLabel).join('、')}；${model.hydroperoxyCarbon?'OOH 接 C'+model.hydroperoxyCarbon:'C1 為羧基碳'}" width="780" height="360"></div><p class="lipid-diagram-hint" aria-hidden="true">← 左右捲動，看完整結構 →</p><p data-diagram-error="${id}" class="lipid-diagram-error" hidden>結構圖載入失敗；可先讀下方的鍵位置文字。</p></figure>`;

export function mountLipidProducts(container,{draftOwner,draftKey='lipid-products',onSaveSummary}={}) {
  if(!container||typeof container.querySelector!=='function')throw new TypeError('A DOM container is required');
  const prefix='lipid-product-'+(++instance),state=productDraft(draftOwner,draftKey);
  let disposed=false;
  const $=s=>container.querySelector(s);
  const current=()=>{if(!state.attempts.has(state.id))state.attempts.set(state.id,blank());return state.attempts.get(state.id);};
  const selected=()=>LIPID_PRODUCTS.find(p=>p.id===state.id);
  const options=Array.from({length:17},(_,i)=>`<option value="${i+1}">C${i+1}=C${i+2}</option>`).join('');
  container.innerHTML=`<section class="lipid-products" aria-labelledby="${prefix}-title"><p class="learning-kicker">從碳位走向結構</p><h3 id="${prefix}-title">氧接上去以後，雙鍵還在原位嗎？</h3><p class="lipid-product-intro">先選一個文獻中的代表異構物，再決定它的兩條碳碳雙鍵。碳編號沿用原料，C1 是羧基碳。</p>
    <label class="lipid-product-target" for="${prefix}-target">要組出的產物<select id="${prefix}-target" data-product-target>${LIPID_PRODUCTS.map(p=>`<option value="${esc(p.id)}">${esc(title(p))} · OOH 接 C${p.hydroperoxyCarbon}</option>`).join('')}</select></label>
    <p class="lipid-product-scope">本題指定一個 E/Z 代表型；—OOH 碳位的 R/S 未指定，圖不代表反應軌跡或產物比例。</p>
    <label class="lipid-diagram-toggle"><input type="checkbox" data-product-full>看完整 18 碳結構</label>
    ${figure(LIPID_PRODUCT_DATA.reference,'reference','原料 · 亞油酸 18:2 (9Z,12Z)')}
    <p class="lipid-product-reference">原料雙鍵：C9=C10 (Z)、C12=C13 (Z)。局部圖兩端用碳鏈群組縮寫，沒有重新編號。</p>
    <fieldset class="lipid-bond-builder"><legend>產物中，我認為兩條碳碳雙鍵是……</legend>${[0,1].map(i=>`<div class="lipid-bond-row"><span aria-hidden="true">0${i+1}</span><label for="${prefix}-bond-${i}">第 ${i+1} 條雙鍵<select id="${prefix}-bond-${i}" data-product-bond="${i}"><option value="0">選雙鍵位置</option>${options}</select></label><label for="${prefix}-geometry-${i}">幾何<select id="${prefix}-geometry-${i}" aria-label="第 ${i+1} 條雙鍵的幾何" data-product-geometry="${i}"><option value="">選 E/Z</option><option value="E">E</option><option value="Z">Z</option></select></label></div>`).join('')}</fieldset>
    <div class="lipid-product-actions"><button type="button" class="button-primary" data-product-action="check">檢查結構 →</button><button type="button" class="button-secondary" data-product-action="reference">看參考結構</button><button type="button" class="lipid-product-reset" data-product-action="reset">重新組一次</button></div><p class="lipid-product-feedback" data-product-feedback role="status"></p>
    <section class="lipid-product-answer" data-product-answer hidden><h4 data-product-name></h4><p class="lipid-product-bond-summary" data-product-bond-summary></p><div data-product-drawing></div><p class="lipid-product-net">組成總式：C₁₈H₃₂O₂ + O₂ → C₁₈H₃₂O₄</p><p class="lipid-product-scope">總式只核對組成，不把自由基鏈反應或單重態氧反應合併成同一個基本步驟。</p><p data-product-pathways></p></section>
    <details class="lipid-product-more"><summary>我的判斷、修訂與保存</summary><label for="${prefix}-writing">目前產物的判斷／修訂</label><textarea id="${prefix}-writing" data-product-writing rows="3" placeholder="記下雙鍵位置與 E/Z 的理由，再檢查。"></textarea><button type="button" class="button-secondary" data-product-action="record">留下這次判斷</button><label for="${prefix}-history">回看已記錄的判斷</label><select id="${prefix}-history" data-product-history></select><pre data-product-review aria-live="polite"></pre><label for="${prefix}-summary">本次將附加的摘要</label><textarea id="${prefix}-summary" data-product-summary rows="7" readonly></textarea>${typeof onSaveSummary==='function'?'<button type="button" class="button-secondary" data-product-action="save">附加到本課筆記</button>':''}<p data-product-save-status role="status"></p><small>檢查／揭示前保留一份判斷；回看舊紀錄不會覆寫目前文字。同一頁內離開再回來可接續，重新載入前請附加到筆記並匯出。紀錄只表示本工作台內的答案暴露，不能證明未從別處看過答案。</small></details>
    <details class="lipid-product-more"><summary>怎麼讀 E/Z 與這張結構圖？</summary><p>E/Z 描述雙鍵兩端優先序較高的取代基：同側是 Z、異側是 E。本題雙鍵兩端均比較碳鏈與氫，碳鏈優先。單鍵在紙面的角度是排版，不是實測構象。</p><p>紅色氧原子連出 —O—OH，不能省成 —OH。局部圖中的 C1–C6 與 C15–C18 是連續碳鏈群組，並非新原子或獨立分子；完整圖保留羧基及所有 18 個碳。C 上的氫依正常價數省略。</p><p>這六型用於比較常見位置／幾何組合，不涵蓋所有氧化條件。局部與完整圖由同一個已核鍵圖生成；草稿在同一頁內接續，附加到筆記後才會納入原有筆記匯出。</p><ul>${LIPID_PRODUCT_DATA.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></details></section>`;
  const snapshot=(id=state.id)=>{const attempt=state.attempts.get(id)||blank();return {id,bonds:attempt.bonds.map(b=>({...b})),writing:attempt.writing,seen:{...attempt.seen},checked:attempt.checked,revealed:attempt.revealed};};
  function record(action){const revision=state.records.filter(r=>r.id===state.id).length+1;state.records.push({...snapshot(),sequence:state.records.length+1,revision,action});state.review=state.records.length;state.status='';}
  function pending(){
    const cursor=state.records.length,signatures=new Map(),parts=[];
    for(const item of state.records.slice(state.cursor))parts.push(`紀錄 ${item.sequence}｜${item.revision===1?'首次記錄':'修訂 '+(item.revision-1)}｜${item.action}\n${productSnapshotText(item)}`);
    for(const [key] of state.attempts){const item=snapshot(key),signature=JSON.stringify(item);if((item.bonds.some(b=>b.start||b.geometry)||item.writing||Object.values(item.seen).some(Boolean)||state.saved.has(key))&&state.saved.get(key)!==signature){signatures.set(key,signature);parts.push(`目前草稿｜${productSnapshotText(item)}\n目前已檢查：${item.checked?'是':'否'}；目前參考結構：${item.revealed?'顯示':'收起'}`);}}
    const view=`${state.id}|${state.full}`;if(view!==state.savedView)parts.push(`目前畫面：${state.id}；${state.full?'完整 18 碳':'局部碳鏈摘要'}`);
    const text=parts.length?['【亞油酸產物工作台｜新增紀錄】',...parts,...(!state.savedVersions.length?['來源：'+LIPID_PRODUCT_DATA.sources.map(s=>s.url).join('；'),'範圍：六個 E/Z 代表型；OOH 碳位 R/S 未指定，不代表產物比例。']:[])].join('\n\n'):'';
    return {text,cursor,signatures,view};
  }
  function drawJournal(){
    if($('[data-product-writing]').value!==current().writing)$('[data-product-writing]').value=current().writing;
    $('[data-product-history]').innerHTML='<option value="0">選擇一筆紀錄</option>'+state.records.map(r=>`<option value="${r.sequence}">${r.sequence} · ${esc(title(LIPID_PRODUCTS.find(p=>p.id===r.id)))} · ${r.revision===1?'首次記錄':'修訂 '+(r.revision-1)} · ${esc(r.action)}</option>`).join('')+state.savedVersions.map((r,i)=>`<option value="${r.id}">已附加摘要 ${i+1}</option>`).join('');
    $('[data-product-history]').value=String(state.review);
    const item=state.records.find(r=>r.sequence===state.review),saved=state.savedVersions.find(r=>r.id===state.review);$('[data-product-review]').textContent=item?productSnapshotText(item):saved?saved.text:'尚未選取紀錄；目前草稿持續保留。';
    const next=pending();$('[data-product-summary]').value=next.text;
    $('[data-product-save-status]').textContent=state.status||(!next.text?'沒有尚未附加的新紀錄。':next.text.length>10000?'摘要超過 10,000 字，尚未保存；完整草稿保留，可自行複製。':'附加時只新增尚未保存的紀錄與變更。');
    const button=$('[data-product-action="save"]');if(button)button.disabled=state.saving||!next.text;
  }
  async function save(){
    if(state.saving||typeof onSaveSummary!=='function')return;const next=pending();
    if(!next.text){state.status='沒有尚未附加的新紀錄。';drawJournal();return;}
    if(next.text.length>10000){state.status='摘要超過 10,000 字，未送出、未截斷；完整草稿保留，可自行複製。';drawJournal();return;}
    state.saving=true;state.status='正在附加…';drawJournal();let success=false;
    try{success=await onSaveSummary(next.text)===true;}catch{}
    state.saving=false;
    if(success){state.cursor=next.cursor;for(const [key,value] of next.signatures)state.saved.set(key,value);state.savedView=next.view;state.savedVersions.push({id:`saved-${state.savedVersions.length+1}`,text:next.text});state.status='已附加這批新增紀錄；其他新修改仍保留。';}
    else state.status='附加未成功；全部紀錄與草稿仍保留，可重試。';
    for(const update of state.views)update();
  }
  function setImage(image,model){
    const url=state.full?model.fullImage:model.detailImage;
    if(image.getAttribute?.('src')!==url)image.src=url;
    image.width=state.full?1100:780;
    image.alt=`${model.productName}；${model.doubleBonds.map(bondLabel).join('、')}；${model.hydroperoxyCarbon?'OOH 接 C'+model.hydroperoxyCarbon:'C1 為羧基碳'}；${state.full?'完整18碳':'局部碳鏈摘要'}`;
  }
  function draw(){
    const attempt=current(),product=selected();
    $('[data-product-target]').value=state.id;
    $('[data-product-full]').checked=state.full;
    for(let i=0;i<2;i++){$(`[data-product-bond="${i}"]`).value=String(attempt.bonds[i].start);$(`[data-product-geometry="${i}"]`).value=attempt.bonds[i].geometry;}
    $('[data-product-feedback]').textContent=attempt.checked?lipidProductFeedback(state.id,attempt.bonds):'';
    $('[data-product-feedback]').dataset.correct=String(attempt.checked&&evaluateLipidProduct(state.id,attempt.bonds).complete);
    $('[data-product-answer]').hidden=!attempt.revealed;
    setImage($('[data-lipid-diagram="reference"]'),LIPID_PRODUCT_DATA.reference);
    if(attempt.revealed){
      $('[data-product-name]').textContent=product.productName;
      $('[data-product-bond-summary]').textContent=`—OOH 接 C${product.hydroperoxyCarbon}；${product.doubleBonds.map(bondLabel).join('、')}`;
      $('[data-product-drawing]').innerHTML=figure(product,'product','所選產物 · '+title(product));
      setImage($('[data-lipid-diagram="product"]'),product);
      $('[data-product-pathways]').textContent=product.pathways.includes('type2')&&product.pathways.includes('autoxidation')?'此型可見於自氧化與 II 型光敏氧化；單看這個產物不能唯一判定來源。':product.pathways.includes('type2')?'本題比較中，此型列在 II 型單重態氧途徑；判讀真實樣品仍須考慮條件、混合途徑與後續反應。':'本題將此 E,E 型列為自由基自氧化的典型產物；真實樣品仍須結合條件與完整異構物分布。';
    }
    drawJournal();
  }
  function onChange(event){
    if(disposed)return;
    const target=event.target;
    if(target.matches?.('[data-product-target]')){
      if(!LIPID_PRODUCTS.some(p=>p.id===target.value))return;
      state.id=target.value;
    }else if(target.matches?.('[data-product-full]'))state.full=target.checked;
    else if(target.matches?.('[data-product-history]')){const value=Number(target.value);if(value===0||state.records.some(r=>r.sequence===value)||state.savedVersions.some(r=>r.id===target.value)){state.review=state.savedVersions.some(r=>r.id===target.value)?target.value:value;drawJournal();}return;}
    else {
      const index=target.dataset?.productBond??target.dataset?.productGeometry;
      if(!['0','1'].includes(index))return;
      const attempt=current(),bond=attempt.bonds[Number(index)];
      if(target.dataset.productBond!==undefined){const value=Number(target.value);if(!Number.isInteger(value)||value<0||value>17)return;bond.start=value;}
      else {if(!['','E','Z'].includes(target.value))return;bond.geometry=target.value;}
      attempt.checked=false;attempt.revealed=false;
    }
    draw();
  }
  function onClick(event){
    if(disposed)return;
    const action=event.target.closest?.('[data-product-action]')?.dataset.productAction;
    if(action==='reset'){record('重新組合前');const previous=current();state.attempts.set(state.id,{...blank(),writing:previous.writing,seen:{...previous.seen}});}
    else if(action==='reference'){record('參考結構揭示前');current().revealed=true;current().seen.reference=true;}
    else if(action==='check'){record('檢查前');const attempt=current();attempt.checked=true;attempt.seen.feedback=true;if(evaluateLipidProduct(state.id,attempt.bonds).complete){attempt.revealed=true;attempt.seen.reference=true;}}
    else if(action==='record')record('自行記錄');
    else if(action==='save'){void save();return;}
    else return;
    draw();
  }
  function onInput(event){if(disposed||!event.target.matches?.('[data-product-writing]'))return;current().writing=event.target.value;state.status='';drawJournal();}
  function onError(event){if(disposed)return;const key=event.target?.dataset?.lipidDiagram;if(key)$(`[data-diagram-error="${key}"]`)?.removeAttribute('hidden');}
  state.views.add(drawJournal);container.addEventListener('change',onChange);container.addEventListener('click',onClick);container.addEventListener('input',onInput);container.addEventListener('error',onError,true);draw();
  return ()=>{if(disposed)return;disposed=true;state.views.delete(drawJournal);container.removeEventListener('change',onChange);container.removeEventListener('click',onClick);container.removeEventListener('input',onInput);container.removeEventListener('error',onError,true);};
}
