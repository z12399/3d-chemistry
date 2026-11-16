import {escapeHTML as esc} from './storage.js';
import {FLAVONOID_CASE_IDS,FLAVONOID_LAB_ID,validateFlavonoidDataset,getCase} from './flavonoid-structure-model.js';
import {FLAVONOID_CLASS_INFO,FLAVONOID_LESSON_SOURCES} from './flavonoid-content.js';
import {anonymousFlavonoidDiagram} from './flavonoid-anonymous-diagram.js';
import {mountFlavonoidStructureLab,readFlavonoidExposure} from './flavonoid-structure-lab.js';

const owners=new WeakMap(),mounts=new WeakMap(),copy=value=>structuredClone(value);
const IDS=FLAVONOID_CASE_IDS.slice(0,8),LESSON='pigment-flavonoid-structure';
const priorLabels={unknown:'不確定／未記錄',seen:'自述曾看過', 'not-seen':'自述未看過（未經驗證）'};
const triggers={check:'對照參考',hint:'使用提示',reveal:'先看參考',guided:'回導讀補救'};
const item=()=>({draft:{classification:'',reason:''},priorExposure:'unknown',first:null,revision:{classification:'',reason:''},hint:false,reference:false,guidedVisits:0,checks:[],recorded:false});
const round=id=>({id,items:IDS.map(item)});
const fresh=()=>({rounds:[round(1)],roundId:1,itemIndex:0,view:'anonymous',events:[],cursor:{started:false,items:{},events:0},savedVersions:[]});
const alias=index=>'結構題 '+(index+1);
const textValue=value=>String(value??'');
const rubric=['用圖上的連接或鍵結支持判斷，不只寫名稱或數OH。','定位符合開鏈／閉環情況，不靠螢幕方位。','區分母體、取代及所選形式；說清較具體標籤的依據。','沒有由固定圖推成反應、食品含量或人體效果。'];
let serial=0;

export function mountFlavonoidRetrievalLab(root,{draftOwner,draftKey=LESSON,onSaveSummary,fetchDataset,fetchImpl,readExposure}={}){
  if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
  mounts.get(root)?.();
  let slot;
  if(draftOwner&&typeof draftOwner==='object'){
    if(!owners.has(draftOwner))owners.set(draftOwner,new Map());
    const map=owners.get(draftOwner),key=String(draftKey);
    if(!map.has(key))map.set(key,{data:fresh()});
    slot=map.get(key);slot.dispose?.();
  }else slot={data:fresh()};
  const d=slot.data,prefix='flav-retrieval-'+(++serial),lessonKey=String(draftKey);
  let disposed=false,dataset=null,epoch=0,abort=null,guideDispose=null,guidedIdentity=null;
  slot.status??='';
  const field=name=>root.querySelector('[data-fr-'+name+']'),action=name=>root.querySelector('[data-fr-action="'+name+'"]');
  const currentRound=()=>d.rounds.find(r=>r.id===d.roundId),current=()=>currentRound().items[d.itemIndex];
  const idFor=(r,i)=>'輪'+r.id+'／'+alias(i);
  const now=()=>new Date().toISOString();
  const hasDraft=a=>!!(a.draft.classification||a.draft.reason||a.priorExposure!=='unknown');
  const legacyRead=()=>{
    try{return copy(typeof readExposure==='function'?readExposure():readFlavonoidExposure(draftOwner,lessonKey));}
    catch{return{status:'unknown',seenCaseIds:null,referenceOpened:null,sourceIds:null};}
  };
  function exposureText(snapshot){
    const value=snapshot&&typeof snapshot==='object'?snapshot:{status:'unknown'};
    const seen=Array.isArray(value.seenCaseIds)?value.seenCaseIds:null;
    const known=seen?seen.map(id=>{const n=FLAVONOID_CASE_IDS.indexOf(id);return n>=0?(n<8?alias(n):'原導讀遷移例 '+(n-7)):'未辨識項';}).join('、'):'未知';
    const sources=Array.isArray(value.sourceIds)?value.sourceIds.map(id=>{const n=FLAVONOID_LESSON_SOURCES.findIndex(s=>s.id===id);return n<0?'未辨識來源':'來源項 '+(n+1);}).join('、'):'未知';
    return '原導讀紀錄：'+(value.status==='known'?'有可讀紀錄':'未知')+'；已顯示分類的圖：'+(known||'未有紀錄（不代表未看）')+'；曾展開參考：'+(value.referenceOpened===true?'是':'未確認')+'；已開來源：'+(sources||'未有紀錄（不代表未讀）');
  }
  function freezeFirst(trigger){
    const a=current();if(a.first)return;
    a.first=copy({roundId:d.roundId,itemIndex:d.itemIndex,classification:a.draft.classification,reason:a.draft.reason,priorExposure:a.priorExposure,trigger,at:now(),complete:!!a.draft.classification.trim()&&!!a.draft.reason.trim(),legacyExposure:legacyRead(),supportBeforeFirst:d.events.filter(e=>e.itemIndex===d.itemIndex)});
    a.recorded=true;
  }
  function support(type){
    d.events.push({roundId:d.roundId,itemIndex:d.itemIndex,type,at:now()});
  }
  function exposureFlag(a){return a.first?'自述曝光：'+priorLabels[a.first.priorExposure]+'；'+exposureText(a.first.legacyExposure)+'；本圖先前支持：'+(a.first.supportBeforeFirst.length?a.first.supportBeforeFirst.map(e=>'輪'+e.roundId+' '+(triggers[e.type]||e.type)).join('、'):'未有紀錄（不代表未見）'):'尚未固定初答；未有紀錄不表示未看過。';}
  function recordText(r,i,a){
    const first=a.first,lines=[idFor(r,i)];
    if(first)lines.push('初答固定於：'+(triggers[first.trigger]||first.trigger)+'；'+first.at+'；'+(first.complete?'兩欄均有文字（不是理由評分）':'有空欄／初答不完整'),'初分類：'+first.classification,'初理由：'+first.reason,exposureFlag(a));
    else lines.push('明確保存的可編草稿；尚未固定初答','草稿分類：'+a.draft.classification,'草稿理由：'+a.draft.reason,'自述曝光：'+priorLabels[a.priorExposure]);
    if(first)lines.push('修訂分類：'+a.revision.classification,'修訂理由：'+a.revision.reason,'支持：提示'+(a.hint?'已開':'未開')+'／參考'+(a.reference?'已開':'未開')+'／導讀'+a.guidedVisits+'次','人工對照項：'+(a.checks.length?a.checks.map(n=>n+1).join(','):'尚未勾選')+'（不是評分）');
    return lines.join('\n');
  }
  function itemSignature(a){return JSON.stringify({draft:a.draft,priorExposure:a.priorExposure,first:a.first,revision:a.revision,hint:a.hint,reference:a.reference,guidedVisits:a.guidedVisits,checks:a.checks});}
  function appendPlan(){
    const next=copy(d.cursor),parts=[],versions=[];
    for(const r of d.rounds)for(let i=0;i<r.items.length;i++){
      const a=r.items[i];if(!a.recorded&&!a.first)continue;
      const key=r.id+':'+i,signature=itemSignature(a);
      if(next.items[key]!==signature){const text=recordText(r,i,a);parts.push(text);versions.push({key,signature,text});next.items[key]=signature;}
    }
    const events=d.events.slice(next.events);
    if(events.length)parts.push('支持／曝光事件\n'+events.map(e=>'輪'+e.roundId+'／'+alias(e.itemIndex)+'：'+(triggers[e.type]||e.type)+' @ '+e.at).join('\n'));
    next.events=d.events.length;
    if(parts.length&&!next.started){parts.unshift('【匿名類黃酮結構檢索】既有八圖的固定範圍練習；分類與理由人工對照，不主張盲測、未知分子遷移或掌握。');next.started=true;}
    return{text:parts.join('\n\n'),next,versions};
  }
  function fullSummary(){
    const parts=d.savedVersions.map(v=>v.text);
    for(const r of d.rounds)for(let i=0;i<r.items.length;i++){
      const a=r.items[i];if(!a.recorded&&!a.first)continue;
      const key=r.id+':'+i,last=d.savedVersions.findLast(v=>v.key===key);
      if(!last||last.signature!==itemSignature(a))parts.push(recordText(r,i,a));
    }
    if(d.events.length)parts.push('完整支持／曝光事件\n'+d.events.map(e=>'輪'+e.roundId+'／'+alias(e.itemIndex)+'：'+(triggers[e.type]||e.type)+' @ '+e.at).join('\n'));
    return parts.length?'【匿名結構檢索完整紀錄】同頁暫留；成功附加筆記與重新整理還原是不同功能。\n\n'+parts.join('\n\n'):'';
  }
  root.innerHTML=`<section class="flavonoid-lab" aria-labelledby="${prefix}-title" data-fr-root>
  <h2 id="${prefix}-title">收起線索，再判讀一張骨架</h2>
  <p>可選練習：重用原導讀的八個固定結構。可能已看過，不是未知分子或盲測。先用自己的話分類並寫理由，再人工對照參考；這裡不自動判分或評定掌握。</p>
  <p role="status" data-fr-load-status>正在核對既有結構資料…</p><button type="button" data-fr-action="retry" hidden>重試載入</button>
  <div data-fr-anonymous><label>目前輪次<select data-fr-round></select></label>
  <label>選一張圖<select data-fr-item>${IDS.map((_,i)=>`<option value="${i}">${alias(i)}</option>`).join('')}</select></label>
  <figure><figcaption data-fr-caption></figcaption><div class="fl-diagram" data-fr-diagram></div></figure>
  <p>只依圖寫出本課較具體的參考分類及連接／鍵結依據。圖上的元素、鍵、形式電荷與立體線條是題設；圖中距離不是實際鍵長。</p>
  <label>你是否曾看過這張結構或其答案？<select data-fr-prior-exposure><option value="unknown">不確定／未記錄</option><option value="seen">我記得看過</option><option value="not-seen">我記得未看過（自述）</option></select></label>
  <label>我的原分類<textarea data-fr-classification rows="2" maxlength="1000"></textarea></label>
  <label>我的原理由<textarea data-fr-reason rows="4" maxlength="5000"></textarea></label>
  <div class="fl-inline-actions"><button type="button" data-fr-action="check">保留初答，對照參考</button><button type="button" data-fr-action="hint">保留初答，使用提示</button><button type="button" data-fr-action="reveal">先看參考（也保留空白初答）</button><button type="button" data-fr-action="guided">回同一圖的導讀</button></div>
  <p data-fr-first></p><div data-fr-hint></div><div data-fr-reference></div>
  <section data-fr-revision hidden><h3>核對後修訂（與初答分開）</h3><label>修訂分類<textarea data-fr-revision-classification rows="2" maxlength="1000"></textarea></label><label>修訂理由<textarea data-fr-revision-reason rows="4" maxlength="5000"></textarea></label><div data-fr-rubric></div><p>勾選只是自己對照，沒有語意或關鍵字評分。</p></section>
  <button type="button" data-fr-action="new-round">保留這輪，開始新一輪</button></div>
  <section data-fr-guided-panel hidden><p>此處會顯示原導讀的名稱、分類與線索，已記為曝光。返回時保留原題、輪次及初答。</p><button type="button" data-fr-action="return">返回原匿名題及初答</button><div data-fr-guide></div></section>
  <p role="status" data-fr-status></p><p role="status" data-fr-save-status></p>
  <button type="button" data-fr-action="save">保存目前草稿與已記錄內容到本課筆記</button>
  <details><summary>已記錄內容與完整複製出口</summary><p>未核對草稿可在上方繼續改；按保存才明確記錄目前草稿。操作只在同頁暫留，重新整理前請保存或複製。失敗不截斷文字。</p><label>本次附加內容<textarea data-fr-append readonly rows="5"></textarea></label><label>完整已記錄摘要<textarea data-fr-summary readonly rows="8"></textarea></label><button type="button" data-fr-action="copy">選取完整已記錄摘要</button></details></section>`;
  function drawSummary(){
    if(disposed)return;
    const plan=appendPlan();field('append').value=plan.text;field('summary').value=fullSummary();
    action('save').hidden=typeof onSaveSummary!=='function';
    action('save').disabled=!!slot.pending||(!plan.text&&!hasDraft(current()));
    field('save-status').textContent=slot.status;
  }
  function referenceHtml(c){
    const family=FLAVONOID_CLASS_INFO.find(x=>x.id===c.classId);
    return `<h3>參考與人工對照</h3><p>${esc(c.name)}：本課參考標籤為 ${esc(c.className)}。</p><p>${esc(family?.ruleSummary||'')}</p><p>${esc(c.scopeNote)}</p><p>參考標籤可能有母體與衍生隸屬關係；不同於本課較具體標籤，不自動等於化學理由全錯。請自己比對原答與圖中依據。</p>`;
  }
  function closeGuide(){guideDispose?.();guideDispose=null;guidedIdentity=null;field('guide').innerHTML='';}
  function draw(){
    if(disposed)return;
    const a=current(),guided=d.view==='guided',identity=d.roundId+':'+d.itemIndex;
    field('anonymous').hidden=guided;field('guided-panel').hidden=!guided;
    field('round').innerHTML=d.rounds.map(r=>`<option value="${r.id}">第 ${r.id} 輪</option>`).join('');
    field('round').value=String(d.roundId);field('item').value=String(d.itemIndex);
    field('item').disabled=!dataset;field('round').disabled=!dataset;
    for(const name of ['check','hint','reveal','guided','new-round'])action(name).disabled=!dataset;
    const c=dataset?getCase(dataset,IDS[d.itemIndex]):null;
    field('caption').textContent=alias(d.itemIndex)+'：計算二維結構圖，不是實驗構形。';
    field('diagram').innerHTML=c?anonymousFlavonoidDiagram(c,alias(d.itemIndex)):'';
    field('classification').value=a.draft.classification;field('reason').value=a.draft.reason;
    field('classification').readOnly=!!a.first;field('reason').readOnly=!!a.first;
    field('prior-exposure').value=a.priorExposure;field('prior-exposure').disabled=!!a.first;
    field('first').textContent=a.first?'初答已固定；'+(a.first.complete?'分類與理由均有文字，但尚未替理由評分。':'有空欄，已按原樣保留為不完整初答。')+' '+exposureFlag(a):'尚未固定初答；可修改。核對、提示、揭答或導讀都會先保留目前原文。';
    field('hint').innerHTML=a.hint?'<p>提示：先按元素和鍵追蹤中段連接，判斷是否適用閉環位置；不要只數OH或依螢幕左右猜分類。</p>':'';
    field('reference').innerHTML=a.reference&&c?referenceHtml(c):'';
    field('revision').hidden=!a.first;field('revision-classification').value=a.revision.classification;field('revision-reason').value=a.revision.reason;
    field('rubric').innerHTML=a.first?rubric.map((text,i)=>`<label><input type="checkbox" data-fr-check="${i}" ${a.checks.includes(i)?'checked':''}>${esc(text)}</label>`).join(''):'';
    if(guided&&dataset&&guidedIdentity!==identity){
      closeGuide();guidedIdentity=identity;
      try{guideDispose=mountFlavonoidStructureLab(field('guide'),FLAVONOID_LAB_ID,{draftOwner,draftKey:lessonKey,onSaveSummary,loadData:async()=>dataset,startCaseId:IDS[d.itemIndex],startMode:'browse'});}
      catch{guidedIdentity=null;field('guide').innerHTML='<p>導讀目前未能開啟；原初答與修訂仍保留，請返回原題。</p>';}
    }else if(!guided&&guideDispose)closeGuide();
    drawSummary();
  }
  function insideGuide(target){return field('guide').contains(target);}
  function onInput(event){
    if(disposed||!root.contains(event.target)||insideGuide(event.target))return;
    const a=current(),target=event.target;
    if(target===field('classification')||target===field('reason')){
      const key=target===field('classification')?'classification':'reason';
      if(a.first){target.value=a.draft[key];return;}a.draft[key]=textValue(target.value);
    }else if(target===field('revision-classification')||target===field('revision-reason')){
      if(!a.first)return;const key=target===field('revision-classification')?'classification':'reason';a.revision[key]=textValue(target.value);a.checks=[];
      for(const box of root.querySelectorAll('[data-fr-check]'))box.checked=false;
    }else return;
    if(!slot.pending)slot.status='';drawSummary();
  }
  function onChange(event){
    if(disposed||!root.contains(event.target)||insideGuide(event.target))return;
    if(event.target===field('item')){const raw=event.target.value;if(dataset&&/^[0-7]$/.test(raw)){d.itemIndex=Number(raw);d.view='anonymous';field('status').textContent='';draw();}else event.target.value=String(d.itemIndex);return;}
    if(event.target===field('round')){const raw=event.target.value,n=Number(raw);if(dataset&&/^[1-8]$/.test(raw)&&d.rounds.some(r=>r.id===n)){d.roundId=n;d.view='anonymous';field('status').textContent='';draw();}else event.target.value=String(d.roundId);return;}
    if(event.target===field('prior-exposure')){if(!current().first&&Object.hasOwn(priorLabels,event.target.value))current().priorExposure=event.target.value;else event.target.value=current().priorExposure;drawSummary();return;}
    const box=event.target.closest('[data-fr-check]');if(box&&current().first){current().checks=[...root.querySelectorAll('[data-fr-check]')].filter(x=>x.checked).map(x=>Number(x.dataset.frCheck));drawSummary();}
  }
  function save(){
    if(slot.pending||typeof onSaveSummary!=='function')return;
    if(hasDraft(current()))current().recorded=true;
    const plan=appendPlan();if(!plan.text)return drawSummary();
    if(plan.text.length>10000){slot.status='尚未保存：本次超過10,000字元，完整紀錄保留。請先選取完整摘要複製；沒有截斷。';drawSummary();return;}
    const token={};slot.pending=token;slot.status='正在保存固定的本次內容；可繼續寫修訂。';drawSummary();
    const finish=(ok,error)=>{
      if(slot.pending!==token)return;slot.pending=null;
      if(ok===true){d.cursor=plan.next;d.savedVersions.push(...plan.versions);slot.status='已附加本次紀錄；之後的編輯仍可另外保存。';}
      else slot.status='尚未保存；完整待存內容仍保留，可重試或複製。'+(error?' 儲存未成功。':'');
      slot.refresh?.();
    };
    try{const value=onSaveSummary(plan.text);if(value&&typeof value.then==='function')Promise.resolve(value).then(value=>finish(value),error=>finish(false,error));else finish(value);}catch(error){finish(false,error);}
  }
  function onClick(event){
    if(disposed||!root.contains(event.target)||insideGuide(event.target))return;
    const button=event.target.closest('[data-fr-action]');if(!button||button.disabled)return;
    const name=button.dataset.frAction;
    if(name==='copy'){field('summary').focus();field('summary').select();return;}
    if(name==='save'){save();return;}
    if(name==='retry'){load();return;}
    if(name==='return'){d.view='anonymous';draw();field('status').textContent='已返回原題與同一輪初答；導讀曝光保留，請在修訂欄補理由。';return;}
    if(!dataset)return;
    if(name==='new-round'){
      if(d.rounds.length>=8){field('status').textContent='已保留8輪，沒有覆寫。請先保存或複製完整紀錄。';return;}
      for(const a of currentRound().items)if(hasDraft(a))a.recorded=true;
      const next=round(d.rounds.at(-1).id+1);d.rounds.push(next);d.roundId=next.id;d.view='anonymous';draw();field('status').textContent='新一輪保留前輪紀錄；已見導讀或參考不因此變成未曝光。';return;
    }
    if(['check','hint','reveal','guided'].includes(name)){
      freezeFirst(name);support(name);
      const a=current();
      if(name==='hint')a.hint=true;
      if(name==='check'||name==='reveal')a.reference=true;
      if(name==='guided'){a.guidedVisits++;d.view='guided';}
      draw();field('status').textContent='初答按原樣保留。'+(a.first.complete?'':'本次初答有空欄。')+'分類與理由由你對照，沒有自動語意評分。';
    }
  }
  async function load(){
    const token=++epoch;abort?.abort();abort=new AbortController();dataset=null;field('load-status').textContent='正在核對既有結構資料…';action('retry').hidden=true;draw();
    try{
      let next;
      if(typeof fetchDataset==='function')next=await fetchDataset(abort.signal);
      else{const f=fetchImpl||globalThis.fetch;if(typeof f!=='function')throw new TypeError('No dataset loader');const response=await f(new URL('../data/flavonoid-structures.json',import.meta.url),{signal:abort.signal});if(!response.ok)throw new Error('Dataset unavailable');next=await response.json();}
      if(disposed||token!==epoch)return;
      validateFlavonoidDataset(next);for(let i=0;i<IDS.length;i++)anonymousFlavonoidDiagram(getCase(next,IDS[i]),alias(i));
      dataset=next;field('load-status').textContent='固定結構資料已核對；這不代表已檢驗你的理解。';draw();
    }catch{
      if(disposed||token!==epoch)return;dataset=null;field('load-status').textContent='結構資料未能載入或通過核對；原文字與紀錄仍保留。';action('retry').hidden=false;draw();
    }
  }
  root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('click',onClick);
  const dispose=()=>{
    if(disposed)return;disposed=true;epoch++;abort?.abort();guideDispose?.();guideDispose=null;
    root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);
    if(slot.dispose===dispose){slot.dispose=null;slot.refresh=null;}if(mounts.get(root)===dispose)mounts.delete(root);
  };
  slot.dispose=dispose;slot.refresh=drawSummary;mounts.set(root,dispose);draw();load();return dispose;
}

