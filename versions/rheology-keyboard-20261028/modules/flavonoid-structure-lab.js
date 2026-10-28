import {escapeHTML as esc} from './storage.js';
import {FLAVONOID_LAB_ID,FLAVONOID_CASE_IDS,FLAVONOID_FEATURE_IDS,validateFlavonoidDataset,getCase,featureHighlights,compareCases} from './flavonoid-structure-model.js';
import {FLAVONOID_CLASS_INFO as CLASSES,FLAVONOID_LESSON_SOURCES as SOURCES,FLAVONOID_FOOD_CASES as FOODS,FLAVONOID_HEALTH_CASES as HEALTH,FLAVONOID_CLAIMS as CLAIMS} from './flavonoid-content.js';
export {FLAVONOID_LAB_ID} from './flavonoid-structure-model.js';

const drafts=new WeakMap(),mounts=new WeakMap(),copy=value=>structuredClone(value),signature=value=>JSON.stringify(value);
const MODES=['compare','browse','judge'],FEATURES=['ringClosure','c2c3','c4Carbonyl','c3Substitution','bAttachment','charge','glycoside','methoxy'];
const FEATURE_NAMES={ringClosure:'C 環開閉',c2c3:'2／3 位之間',c4Carbonyl:'4 位羰基',c3Substitution:'3 位取代',bAttachment:'B 環接在哪裡',charge:'形式電荷',glycoside:'糖苷部分',methoxy:'甲氧基'};
const CASES=FLAVONOID_CASE_IDS,TRANSFER=['isoquercetin','isorhamnetin'];
const writing=()=>({prediction:'',observation:'',revision:''});
const freshAttempt=(id,caseId)=>({id,caseId,choice:'',writing:writing(),first:null});
const fresh=()=>({mode:'compare',left:'apigenin',right:'s-naringenin',single:'naringenin-chalcone',feature:'c2c3',selection:null,attempts:[freshAttempt(1,TRANSFER[0])],attemptId:1,annotations:{},records:[],journal:[],sourcesOpened:[],referenceOpened:false,seenCases:[],details:[],cursor:{started:false,journal:0,attempts:{},annotations:{}},savedWritings:[]});
function exposureSlot(owner,key,create=false){
  if(!owner||typeof owner!=='object'||typeof key!=='string'||!key.trim())return null;
  let byLesson=drafts.get(owner);if(!byLesson&&create){byLesson=new Map();drafts.set(owner,byLesson);}
  let slot=byLesson?.get(key);if(!slot&&create){slot={data:fresh()};byLesson.set(key,slot);}
  return slot||null;
}
// A session snapshot, not a claim that any displayed material was read or learned.
export function readFlavonoidExposure(owner,key){
  const d=exposureSlot(owner,key)?.data;
  return d?{status:'known',seenCaseIds:d.seenCases.slice(),referenceOpened:d.referenceOpened===true,sourceIds:d.sourcesOpened.slice()}
    :{status:'unknown',seenCaseIds:null,referenceOpened:null,sourceIds:null};
}
export function noteFlavonoidReferenceExposure(owner,key){
  const slot=exposureSlot(owner,key,true);if(!slot)return false;
  slot.data.referenceOpened=true;return true;
}
const safeUrl=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
const sourceLink=s=>safeUrl(s?.url)?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-fl-source="${esc(s.id)}">${esc(s.title)} ↗</a>`:esc(s?.title||'來源未提供');
const listText=value=>Array.isArray(value)?value.map(listText).join('；'):value&&typeof value==='object'?Object.entries(value).map(([k,v])=>`${k}：${listText(v)}`).join('；'):String(value??'');
const bodyText=w=>`原判讀：${w.prediction||'未填'}\n觀察：${w.observation||'未填'}\n修訂：${w.revision||'未填'}`;
const firstText=f=>`第 ${f.attemptId} 輪｜${f.caseName}｜${f.trigger}\n首次選擇：${f.choiceLabel||'未選'}\n${bodyText(f.writing)}\n此前已顯示本例分類：${f.seenCase?'是':'否'}；曾展開參考區：${f.referenceOpened?'是':'否'}；開啟來源：${f.sourcesOpened.join('、')||'無'}（開啟不等於已讀；不主張盲測）。\n參考分類：${f.answerLabel}\n${f.evidence}`;
const preamble=()=>`【類黃酮骨架辨識】flavonoid-structure-v1\n十個固定教材例的二維結構比較；不是任意分子的分類器、實驗構象或反應路徑。C6–C3–C6指苷元骨架；糖及甲基另記。健康研究結論受其成分、暴露、系統與終點限制。`;
let serial=0;

async function defaultLoad(signal){const response=await fetch(new URL('../data/flavonoid-structures.json',import.meta.url),{signal});if(!response.ok)throw new Error('Structure data unavailable');return response.json();}

export function mountFlavonoidStructureLab(root,id=FLAVONOID_LAB_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=defaultLoad,startCaseId,startMode}={}){
  if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
  if(id!==FLAVONOID_LAB_ID)throw new RangeError('Unknown flavonoid activity');
  if(startCaseId!==undefined&&!CASES.includes(startCaseId))throw new RangeError('Unknown flavonoid start case');
  if(startMode!==undefined&&startMode!=='browse')throw new RangeError('Only browse is supported for a guided start');
  if(startMode!==undefined&&startCaseId===undefined)throw new RangeError('A guided start requires a case');
  mounts.get(root)?.();let slot;
  if(draftOwner&&typeof draftOwner==='object'){
    if(!drafts.has(draftOwner))drafts.set(draftOwner,new Map());const byLesson=drafts.get(draftOwner),key=String(draftKey);
    if(!byLesson.has(key))byLesson.set(key,{data:fresh()});slot=byLesson.get(key);slot.dispose?.();
  }else slot={data:fresh()};
  const d=slot.data,prefix=`flavonoid-${++serial}`,field=name=>root.querySelector(`[data-fl-${name}]`),action=name=>root.querySelector(`[data-fl-action="${name}"]`);
  if(startCaseId!==undefined){d.mode='browse';d.single=startCaseId;d.selection=null;}
  let disposed=false,dataset=null,epoch=0,abort=null,loading=false,feedback='',rendered={};slot.saveStatus??='';
  const attempt=()=>d.attempts.find(a=>a.id===d.attemptId);
  const className=id=>CLASSES.find(c=>c.id===id)?.labelZh||id;
  const sourceRefs=ids=>ids.map(id=>SOURCES.find(s=>s.id===id)||dataset?.sources.find(s=>s.id===id)).filter(Boolean).map(s=>`${s.title}\n${s.url}`).join('\n');
  const caseText=(c,hideClass=false)=>`${c.name}（${c.englishName}）｜${hideClass?'分類尚未揭示':c.className}\nPubChem CID ${c.identity.cid}；${c.identity.formula}；總形式電荷 ${c.identity.formalCharge}\n${hideClass?'依目前骨架自行判讀。':c.scopeNote}\nhttps://pubchem.ncbi.nlm.nih.gov/compound/${c.identity.cid}`;
  const annotationKey=()=>d.mode==='compare'?`compare:${d.left}|${d.right}`:`browse:${d.single}`;
  const annotationContext=()=>d.mode==='compare'?`比較 ${d.left} 與 ${d.right}`:`觀察 ${d.single}`;
  const featureText=(c,key,hideExplanation=false)=>{const f=featureHighlights(dataset,c.id,key);return `${f.label}：${f.display}${f.note&&!hideExplanation?'；'+f.note:''}`;};
  const evidence=c=>[featureText(c,'ringClosure'),featureText(c,'c2c3'),featureText(c,'c4Carbonyl'),featureText(c,'c3Substitution'),featureText(c,'bAttachment'),featureText(c,'charge'),featureText(c,'glycoside'),featureText(c,'methoxy'),`來源：https://pubchem.ncbi.nlm.nih.gov/compound/${c.identity.cid}`].join('\n');
  function room(){if(d.journal.length<128)return true;feedback='已保留 128 項紀錄，不覆寫。請先保存或複製摘要。';return false;}
  function record(label,text){d.journal.push({index:d.journal.length+1,label,text});}
  function freezeFirst(trigger){
    const a=attempt();if(a.first)return;
    const c=getCase(dataset,a.caseId);a.first=copy({attemptId:a.id,caseId:c.id,caseName:c.name,trigger,choice:a.choice,choiceLabel:a.choice?className(a.choice):'',writing:a.writing,seenCase:d.seenCases.includes(c.id),referenceOpened:d.referenceOpened,sourcesOpened:d.sourcesOpened,answerLabel:c.className,evidence:evidence(c)});
  }
  function appendPlan(){
    const next=copy(d.cursor),parts=[],versions=[];
    for(const a of d.attempts){const prior=next.attempts[a.id]||{first:false,writing:''},s=signature(a.writing),has=Object.values(a.writing).some(Boolean);
      if(a.first&&!prior.first)parts.push(firstText(a.first));
      if(s!==prior.writing&&(has||prior.writing)){const text=`第 ${a.id} 輪 ${a.caseId} 文字版本\n${bodyText(a.writing)}`;parts.push(text);versions.push({attemptId:a.id,text});}
      if(a.first||has||prior.writing)next.attempts[a.id]={first:!!a.first,writing:s};
    }
    for(const[key,value]of Object.entries(d.annotations)){const prior=next.annotations[key];if(value.text!==prior&&(value.text||prior)){const text=`結構觀察文字｜${value.context}\n${value.text||'目前已清空文字'}\n${value.sources}`;parts.push(text);versions.push({annotationKey:key,text});next.annotations[key]=value.text;}}
    parts.push(...d.journal.slice(next.journal).map(e=>`紀錄 ${e.index}｜${e.label}\n${e.text}`));next.journal=d.journal.length;
    if(parts.length&&!next.started){parts.unshift(preamble());next.started=true;}return{text:parts.join('\n\n'),next,versions};
  }
  function fullText(){
    if(!d.journal.length&&!d.savedWritings.length&&!Object.values(d.annotations).some(a=>a.text)&&!d.attempts.some(a=>a.first||Object.values(a.writing).some(Boolean)))return '';
    return[preamble(),...d.attempts.flatMap(a=>[a.first?firstText(a.first):`第 ${a.id} 輪 ${a.caseId} 尚未核對`,...d.savedWritings.filter(v=>v.attemptId===a.id).map(v=>v.text),`第 ${a.id} 輪目前文字\n${bodyText(a.writing)}`]),...d.savedWritings.filter(v=>v.annotationKey).map(v=>v.text),...Object.values(d.annotations).map(a=>`目前結構觀察文字｜${a.context}\n${a.text||'目前已清空文字'}\n${a.sources}`),...d.journal.map(e=>`紀錄 ${e.index}｜${e.label}\n${e.text}`)].join('\n\n');
  }
  function sourceList(ids){return ids.map(id=>SOURCES.find(s=>s.id===id)).filter(Boolean).map(s=>`<li>${sourceLink(s)}<p>${esc(s.locator||'')}</p></li>`).join('');}
  const panel=(name,label)=>`<figure class="fl-molecule" data-fl-panel="${name}"><figcaption><span>${label}</span><strong data-fl-name="${name}"></strong></figcaption><div class="fl-diagram" tabindex="0" role="region" aria-label="${label}的結構圖，可橫向捲動" data-fl-diagram="${name}"></div><p class="fl-identity" data-fl-identity="${name}"></p></figure>`;
  root.innerHTML=`<section class="flavonoid-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title">看哪個部位，就能分辨？</h2><p class="fl-scope">比較具名分子的二維骨架；切換不是化學反應。</p>
  <nav class="fl-modes" aria-label="類黃酮練習">${[['compare','比較骨架'],['browse','逐類觀察'],['judge','自己判讀']].map(([v,t])=>`<button type="button" data-fl-mode="${v}">${t}</button>`).join('')}</nav>
  <p role="status" data-fl-load-status>正在載入並核對結構…</p><button type="button" data-fl-action="retry" hidden>重試載入結構</button>
  <div data-fl-mode-panel="compare"><div class="fl-selects"><label for="${prefix}-left">左邊的分子<select id="${prefix}-left" data-fl-left disabled></select></label><label for="${prefix}-right">右邊的分子<select id="${prefix}-right" data-fl-right disabled></select></label></div><div class="fl-pair">${panel('left','左邊')}${panel('right','右邊')}</div></div>
  <div data-fl-mode-panel="browse" hidden><label class="fl-single-select" for="${prefix}-single">觀察哪個分子<select id="${prefix}-single" data-fl-single disabled></select></label>${panel('single','目前分子')}</div>
  <div data-fl-mode-panel="judge" hidden><label class="fl-single-select" for="${prefix}-task">換一個分子<select id="${prefix}-task" data-fl-task disabled></select></label><p class="fl-scope">先看骨架，再判斷；糖或甲氧基不等於換了骨架家族。</p>${panel('task','待判讀分子')}</div>
  <div class="fl-focus-control"><label for="${prefix}-feature">觀察部位<select id="${prefix}-feature" data-fl-feature disabled>${FEATURES.map(k=>`<option value="${k}">${FEATURE_NAMES[k]}</option>`).join('')}</select></label><p class="fl-legend">綠色：所查部位；虛圈：檢查位置。點選原子可看連接。</p></div>
  <section class="fl-reading" aria-live="polite" aria-atomic="true"><h3 data-fl-result-title></h3><div data-fl-result></div><p class="fl-atom-reading" data-fl-atom-reading></p></section>
  <div class="fl-judge" data-fl-judge hidden><label for="${prefix}-choice">我的分類<select id="${prefix}-choice" data-fl-choice><option value="">先選一個家族</option>${CLASSES.map(c=>`<option value="${esc(c.id)}">${esc(c.labelZh)} · ${esc(c.labelEn)}</option>`).join('')}</select></label><div class="fl-inline-actions"><button type="button" data-fl-action="check">核對我的判讀</button><button type="button" data-fl-action="reveal">先看參考解釋</button></div><p role="status" data-fl-answer></p></div>
  <div class="fl-actions"><button type="button" data-fl-action="record">保留觀察</button><span data-fl-count></span><button type="button" class="fl-primary" data-fl-action="save">保存到本課筆記</button><button type="button" data-fl-action="new">新一輪判讀</button></div><p role="status" data-fl-feedback></p><p role="status" data-fl-save-status></p>
  <details data-fl-details="writing"><summary>寫下判讀、觀察與修訂</summary><p class="fl-scope" data-fl-writing-scope></p>${[['prediction','原判讀與理由'],['observation','我看到的部位'],['revision','核對後修訂']].map(([k,t])=>`<label for="${prefix}-${k}" data-fl-writing-field="${k}">${t}<textarea id="${prefix}-${k}" data-fl-${k} rows="3" maxlength="1000"></textarea></label>`).join('')}<p data-fl-first></p></details>
  <details data-fl-details="classes"><summary>八類骨架與命名界線</summary><p>以下是本課代表例的判讀線索。黃酮醇等在命名上有衍生與隸屬關係，八個練習標籤不是互不重疊的普遍分類器。</p><div class="fl-table" tabindex="0" role="region" aria-label="八類骨架參考表，可橫向捲動"><table><thead><tr><th>類別</th><th>本課判讀線索</th></tr></thead><tbody>${CLASSES.map(c=>`<tr><th>${esc(c.labelZh)}<span>${esc(c.labelEn)}</span></th><td>${esc(c.ruleSummary)}</td></tr>`).join('')}</tbody></table></div><p>楔線與虛楔線保留所選分子的立體配置。二維座標僅用來繪圖，不是分子的實驗構象、原子距離或反應軌跡。cyanidin 採來源的正離子形式；一種 Kekulé 鍵畫法不等於唯一局域電子結構。</p></details>
  <details data-fl-details="foods"><summary>哪些食物含這一類？</summary><p>苷元代表圖、食品中的糖苷型態及資料庫換算值分開看；含量受樣品與方法影響。</p><label for="${prefix}-food">選一類查看食品證據<select id="${prefix}-food" data-fl-food>${CLASSES.map(c=>`<option value="${esc(c.id)}">${esc(c.labelZh)}</option>`).join('')}</select></label><div data-fl-food-reading></div></details>
  <details data-fl-details="health"><summary>健康影響：研究支持到哪裡？</summary><p>化學／體外結果、觀察關聯與人體介入的結論不同，不能替整個家族宣稱療效。</p><label for="${prefix}-health">選一個研究<select id="${prefix}-health" data-fl-health>${HEALTH.map(c=>`<option value="${esc(c.id)}">${esc(c.stage==='rct'?'人體介入':c.stage==='observational'?'觀察研究':'體外／機制')} · ${esc(listText(c.compound))}</option>`).join('')}</select></label><div data-fl-health-reading></div><button type="button" data-fl-action="record-evidence">保留這個證據界線</button></details>
  <details data-fl-details="sources"><summary>完整來源與逐項依據</summary><ol>${SOURCES.map(s=>`<li>${sourceLink(s)}<p>${esc(s.locator||'')}</p><p>${esc(s.claimScope||'')}</p><p>${esc(listText(s.limitations))}</p></li>`).join('')}</ol>${CLAIMS.map(c=>`<details><summary>${esc(c.title||c.id||c.claim)}</summary><p>${esc(c.boundedText||c.claim||c.statement||c.text||'')}</p>${!c.boundedText&&c.boundary?`<p>界線：${esc(listText(c.boundary))}</p>`:''}<p>${esc(listText(c.evidenceRefs||c.locator))}</p><ul>${sourceList(c.sourceIds||[])}</ul></details>`).join('')}</details>
  <details data-fl-details="records"><summary>已保留的觀察與判讀</summary><div data-fl-records></div></details>
  <details data-fl-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">本次附加內容<textarea id="${prefix}-append" data-fl-append readonly rows="5"></textarea></label><label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" data-fl-summary readonly rows="8"></textarea></label><button type="button" data-fl-action="copy">選取完整摘要</button><p>操作與未保存文字只在同頁暫留；重新整理前請保存。失敗會保留待存文字，可重試或複製。</p></details></section>`;

  function drawSummary(){if(disposed)return;const plan=appendPlan();field('append').value=plan.text;field('summary').value=fullText();action('save').disabled=!plan.text||!!slot.pending;field('save-status').textContent=slot.saveStatus;}
  function drawWriting(){
    const a=attempt(),judge=d.mode==='judge';for(const k of ['prediction','observation','revision']){field(k).value=judge?a.writing[k]:(k==='observation'?d.annotations[annotationKey()]?.text||'':'');root.querySelector(`[data-fl-writing-field="${k}"]`).hidden=!judge&&k!=='observation';}
    field('prediction').readOnly=!!a.first;field('choice').value=a.choice;field('choice').disabled=!!a.first;field('first').hidden=!judge;field('first').textContent=a.first?firstText(a.first):`第 ${a.id} 輪尚未核對。原判讀可修改。`;
    field('writing-scope').textContent=judge?'這裡記錄目前判讀題；核對前原文會保留，不自動評定掌握。':'這段文字屬於目前所選分子。改選後，各組觀察文字會分開保留。';
  }
  function currentCase(panelName){return getCase(dataset,panelName==='task'?attempt().caseId:d[panelName]);}
  function atomPosition(c,atomId){
    const labels={O1:'O1',C2:'C2',C3:'C3',C4:'C4',C4a:'C4a',C8a:'C8a',C5:'C5',C6:'C6',C7:'C7',C8:'C8',B1:'B 環 1′',B2:'B 環 2′',B3:'B 環 3′',B4:'B 環 4′',B5:'B 環 5′',B6:'B 環 6′',carbonylO:'羰基氧',alphaC:'開鏈 α 碳',betaC:'開鏈 β 碳',glycosidicO:'糖苷連接氧',sugarAnomericC:'糖的異頭碳',methoxyO:'甲氧基氧',methoxyC:'甲氧基碳'};
    return Object.entries(labels).filter(([k])=>c.roles[k]===atomId).map(([,label])=>label).join('／')||(c.roles.sugarAtoms.includes(atomId)?'糖的部分':'');
  }
  function renderPanel(name){
    const c=currentCase(name),box=root.querySelector(`[data-fl-diagram="${name}"]`),identity=root.querySelector(`[data-fl-identity="${name}"]`),hiddenClass=name==='task'&&!attempt().first;
    root.querySelector(`[data-fl-name="${name}"]`).textContent=`${c.name} · ${c.englishName}`;
    identity.textContent=hiddenClass?'請依骨架判讀；分類尚未揭示。':`${c.className} · ${c.identity.formula} · ${c.identity.formalCharge===0?'中性分子':'總形式電荷 '+c.identity.formalCharge}`;
    if(!hiddenClass&&!d.seenCases.includes(c.id))d.seenCases.push(c.id);
    if(rendered[name]!==c.id){box.innerHTML=c.diagram.svg;rendered[name]=c.id;box.querySelector('[role="img"]')?.setAttribute('role','group');box.querySelector('[aria-hidden="true"]')?.setAttribute('aria-hidden','false');for(const n of box.querySelectorAll('[data-atom-id]')){const a=c.atoms.find(a=>a.id===n.dataset.atomId),position=atomPosition(c,a.id);n.setAttribute('role','button');n.setAttribute('tabindex','0');n.setAttribute('aria-label',`${c.name}中的${a.element}原子 ${a.index+1}${position?'，'+position:''}`);}}
    const f=featureHighlights(dataset,c.id,d.feature),atoms=new Set(f.atomIds),anchors=new Set(f.anchorAtomIds),bonds=new Set(f.bondIds);
    for(const node of box.querySelectorAll('[data-atom-id]')){node.setAttribute('data-highlight',String(atoms.has(node.dataset.atomId)));node.setAttribute('data-anchor',String(anchors.has(node.dataset.atomId)&&!atoms.has(node.dataset.atomId)));node.setAttribute('data-selected',String(d.selection?.panel===name&&d.selection.atomId===node.dataset.atomId));}
    for(const node of box.querySelectorAll('[data-bond-id]'))node.setAttribute('data-highlight',String(bonds.has(node.dataset.bondId)));
  }
  function atomReading(){
    if(!d.selection||!dataset)return '點選圖上的原子，可核對它連到哪些部位。';
    const c=currentCase(d.selection.panel),a=c.atoms.find(a=>a.id===d.selection.atomId);if(!a)return '目前沒有選取原子。';
    const position=atomPosition(c,a.id);
    const neighbors=c.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>{const other=c.atoms.find(n=>n.id===(b.a===a.id?b.b:b.a)),site=atomPosition(c,other.id);return`${other.element}（${site?site+'；':''}${b.aromatic?'芳香連接':b.order===2?'雙鍵':b.order===3?'三鍵':'單鍵'}）`;});
    return `${c.name}：${position?position+' · ':''}${a.element}原子 ${a.index+1}；${neighbors.length} 個直接相鄰的重原子：${neighbors.join('、')}。${a.cip?'來源所選配置：'+a.cip+'。':''}圖中距離不用來判斷實際鍵長。`;
  }
  function measurementText(m){if(!m)return '';const rows=[];if(m.value!==null&&m.value!==undefined)rows.push(`來源列值：${m.value} ${m.unit||''}`);if(m.basis)rows.push(`基準：${listText(m.basis)}`);if(m.n!==null&&m.n!==undefined)rows.push(`原表 n = ${m.n}`);if(m.min!==null&&m.min!==undefined&&m.max!==null&&m.max!==undefined)rows.push(`資料範圍：${m.min}–${m.max} ${m.unit||''}`);if(m.uncertainty!==null&&m.uncertainty!==undefined)rows.push(`${['SD','SEM'].includes(m.uncertaintyType)?m.uncertaintyType:'原表 ± 列值'}：${m.uncertainty} ${m.unit||''}`);if(m.uncertaintyType&&!['SD','SEM'].includes(m.uncertaintyType))rows.push('原表未明示此 ± 統計量是 SD 或 SEM');return rows.join('；');}
  function drawFood(){const rows=FOODS.filter(r=>r.classId===field('food').value);field('food-reading').innerHTML=rows.map(r=>`<article class="fl-evidence"><h3>${esc(r.foodZh)}</h3><p>${esc(listText(r.compound))} · ${esc(r.form||'')}</p><p>${esc(r.statement||'')}</p>${r.measurement?`<p>${esc(measurementText(r.measurement))}</p>`:''}<p>${esc(r.caveat||'')}</p><p>${esc(listText(r.locator))}</p><ul>${sourceList(r.sourceIds||[])}</ul></article>`).join('')||'<p>本課沒有這一類的食品定量資料。</p>';}
  function drawHealth(){const r=HEALTH.find(r=>r.id===field('health').value);field('health-reading').innerHTML=r?`<article class="fl-evidence"><h3>${esc(listText(r.compound))}</h3><dl><dt>暴露／劑量</dt><dd>${esc(listText(r.exposure))}</dd><dt>研究對象</dt><dd>${esc(listText(r.systemOrPopulation))}</dd><dt>終點與結果</dt><dd>${esc(listText(r.endpoint))}<br>${esc(listText(r.result))}</dd><dt>結論界線</dt><dd>${esc(listText(r.limits))}</dd></dl><ul>${sourceList(r.sourceIds||[])}</ul></article>`:'<p>尚未提供這個研究。</p>';}
  function draw(){
    if(disposed)return;
    for(const n of root.querySelectorAll('[data-fl-mode]'))n.setAttribute('aria-pressed',String(n.dataset.flMode===d.mode));
    for(const n of root.querySelectorAll('[data-fl-mode-panel]'))n.hidden=n.dataset.flModePanel!==d.mode;
    field('judge').hidden=d.mode!=='judge';field('feature').value=d.feature;field('count').textContent=`${d.records.length} / 24 組`;
    for(const name of ['left','right','single'])field(name).value=d[name];field('task').value=attempt().caseId;
    for(const name of ['left','right','single','task','feature'])field(name).disabled=!dataset;
    action('record').disabled=!dataset;action('new').disabled=!dataset;action('check').disabled=!dataset||!attempt().choice||!!attempt().first;action('reveal').disabled=!dataset||!!attempt().first;
    drawWriting();
    if(dataset){
      const panels=d.mode==='compare'?['left','right']:[d.mode==='browse'?'single':'task'];for(const name of panels)renderPanel(name);
      field('result-title').textContent=FEATURE_NAMES[d.feature];
      if(d.mode==='compare'){const comparison=compareCases(dataset,d.left,d.right),row=comparison.rows.find(r=>r.featureId===d.feature);field('result').innerHTML=`<div class="fl-result-pair"><p><strong>左</strong>${esc(row.left.display)}</p><p><strong>右</strong>${esc(row.right.display)}</p></div><p class="fl-conclusion">這一項${row.same?'相同':'不同'}；分類仍要一起看其他骨架位置。</p><details><summary>這項判讀的界線</summary><p>${esc(row.left.note)}</p><p>${esc(row.right.note)}</p></details>`;}
      else{const f=featureHighlights(dataset,currentCase(panels[0]).id,d.feature),hideExplanation=d.mode==='judge'&&!attempt().first;field('result').innerHTML=`<p class="fl-single-result">${esc(f.display)}</p>${hideExplanation?'':`<p>${esc(f.note)}</p>`}`;}
      field('atom-reading').textContent=atomReading();const a=attempt();field('answer').textContent=a.first?`${a.first.choice?(a.first.choice===getCase(dataset,a.caseId).classId?'與本例參考分類一致。':'與本例參考分類不同。'):'已查看參考。'} ${a.first.answerLabel}。原判讀已保留；請在修訂中指出骨架依據。`:'';
    }else{for(const name of ['left','right','single','task']){root.querySelector(`[data-fl-diagram="${name}"]`).innerHTML='';root.querySelector(`[data-fl-name="${name}"]`).textContent='等待結構資料';root.querySelector(`[data-fl-identity="${name}"]`).textContent='核對完成前暫不顯示。';}field('result-title').textContent='等待核對';field('result').textContent='';field('atom-reading').textContent='';field('answer').textContent='';}
    field('feedback').textContent=feedback;field('records').innerHTML=d.records.map((r,i)=>`<article><h3>觀察 ${i+1}</h3><p class="fl-record-text">${esc(r.text)}</p></article>`).join('')+d.attempts.filter(a=>a.first).map(a=>`<details><summary>第 ${a.id} 輪 · ${esc(a.first.caseName)}</summary><p class="fl-record-text">${esc(firstText(a.first))}</p></details>`).join('');
    drawSummary();
  }
  function beginAttempt(caseId){
    if(d.attempts.length>=24){feedback='已保留 24 輪，不覆寫舊答案。請先保存或複製。';return false;}
    const a=freshAttempt(d.attempts.length+1,caseId);d.attempts.push(a);d.attemptId=a.id;d.selection=null;feedback='已開始新一輪；原來的答案與文字仍保留。';return true;
  }
  function onInput(event){
    if(disposed||!root.contains(event.target))return;
    const key=['prediction','observation','revision'].find(k=>event.target===field(k));if(!key)return;
    if(d.mode!=='judge'){if(key!=='observation')return;const ids=d.mode==='compare'?[d.left,d.right]:[d.single];d.annotations[annotationKey()]={context:annotationContext(),text:String(event.target.value),sources:dataset?ids.map(id=>`https://pubchem.ncbi.nlm.nih.gov/compound/${getCase(dataset,id).identity.cid}`).join('\n'):''};if(!slot.pending)slot.saveStatus='';return drawSummary();}
    if(key==='prediction'&&attempt().first){event.target.value=attempt().writing[key];return;}
    attempt().writing[key]=String(event.target.value);if(!slot.pending)slot.saveStatus='';drawSummary();
  }
  function onChange(event){
    if(disposed||!root.contains(event.target))return;
    if(event.target===field('food')){d.foodClass=event.target.value;drawFood();return;}if(event.target===field('health')){d.healthId=event.target.value;drawHealth();return;}
    if(event.target===field('choice')){if(!attempt().first&&CLASSES.some(c=>c.id===event.target.value))attempt().choice=event.target.value;else if(!attempt().first&&event.target.value==='')attempt().choice='';return draw();}
    if(!dataset)return;
    for(const key of ['left','right','single'])if(event.target===field(key)){if(!CASES.includes(event.target.value))return;d[key]=event.target.value;d.selection=null;feedback='';return draw();}
    if(event.target===field('feature')){if(!FEATURES.includes(event.target.value))return;d.feature=event.target.value;feedback='';return draw();}
    if(event.target===field('task')){if(!TRANSFER.includes(event.target.value))return;const existing=d.attempts.findLast(a=>a.caseId===event.target.value);if(existing){d.attemptId=existing.id;d.selection=null;}else beginAttempt(event.target.value);draw();}
  }
  function onClick(event){
    if(disposed||!root.contains(event.target))return;
    const source=event.target.closest('[data-fl-source]');if(source){const sid=source.dataset.flSource;if(!d.sourcesOpened.includes(sid)){if(!room()){event.preventDefault();return draw();}d.sourcesOpened.push(sid);record('開啟來源（不代表已讀）',sid);}drawSummary();return;}
    const mode=event.target.closest('[data-fl-mode]');if(mode){if(MODES.includes(mode.dataset.flMode)){d.mode=mode.dataset.flMode;d.selection=null;feedback='';draw();}return;}
    const atom=event.target.closest('[data-atom-id]');if(atom&&dataset){const box=atom.closest('[data-fl-diagram]');if(!box)return;const name=box.dataset.flDiagram;if(!['left','right','single','task'].includes(name))return;const c=currentCase(name);if(!c.atoms.some(a=>a.id===atom.dataset.atomId))return;d.selection={panel:name,atomId:atom.dataset.atomId};draw();return;}
    const button=event.target.closest('[data-fl-action]');if(!button||button.disabled)return;const name=button.dataset.flAction;
    if(name==='retry'){load();return;}
    if(name==='copy'){field('summary').focus();field('summary').select();return;}
    if(name==='save'){
      const plan=appendPlan();if(!plan.text||slot.pending||typeof onSaveSummary!=='function')return;
      if(plan.text.length>10000){slot.saveStatus='尚未保存：本次超過 10,000 字元，完整內容保留，可選取摘要複製。';return drawSummary();}
      const token={};slot.pending=token;slot.saveStatus='正在保存；本次內容已固定，仍可繼續修訂。';drawSummary();
      const finish=(ok,error)=>{if(slot.pending!==token)return;slot.pending=null;if(ok===true){d.cursor=plan.next;d.savedWritings.push(...plan.versions);slot.saveStatus='已附加本次內容；重複按下不會重複加入。';}else slot.saveStatus=error?`尚未保存：${error?.message||'儲存失敗'}。待存內容完整保留。`:'尚未保存：請檢查筆記容量與儲存狀態。待存內容完整保留。';slot.refresh?.();};
      try{const value=onSaveSummary(plan.text);if(value&&typeof value.then==='function')Promise.resolve(value).then(finish,error=>finish(false,error));else finish(value);}catch(error){finish(false,error);}return;
    }
    if(name==='record-evidence'){
      const c=HEALTH.find(r=>r.id===field('health').value);if(!c||!room())return draw();const text=`${listText(c.compound)}\n研究：${c.stage}\n暴露：${listText(c.exposure)}\n對象：${listText(c.systemOrPopulation)}\n終點：${listText(c.endpoint)}\n結果：${listText(c.result)}\n界線：${listText(c.limits)}\n${sourceRefs(c.sourceIds||[])}`;
      if(!d.journal.some(e=>e.label==='研究證據界線'&&e.text===text))record('研究證據界線',text);feedback='已保留這個研究的條件與結論界線。';return draw();
    }
    if(!dataset)return;
    if(name==='record'){
      if(d.records.length>=24){feedback='已保留 24 組，不覆寫旧觀察。請先保存或複製。';return draw();}if(!room())return draw();
      const ids=d.mode==='compare'?[d.left,d.right]:[d.mode==='browse'?d.single:attempt().caseId];
      const text=ids.map(cid=>{const c=getCase(dataset,cid),hideExplanation=d.mode==='judge'&&!attempt().first;return`${caseText(c,hideExplanation)}\n${featureText(c,d.feature,hideExplanation)}`;}).join('\n\n')+`\n${d.selection?atomReading():''}`;
      if(!d.records.some(r=>r.text===text)){d.records.push(copy({ids,feature:d.feature,selection:d.selection,text}));record('骨架觀察',text);}feedback='已保留；之後改選分子不會改寫這組觀察。';
    }else if(name==='check'||name==='reveal'){
      if(d.mode!=='judge'||attempt().first||name==='check'&&!attempt().choice)return;if(!room())return draw();freezeFirst(name==='check'?'核對我的判讀':'先看參考');record('核對固定教材例',firstText(attempt().first));feedback='原判讀已保留，修訂欄仍可修改。';
    }else if(name==='new'){beginAttempt(attempt().caseId);d.mode='judge';}
    draw();
  }
  function onKey(event){if(disposed||!['Enter',' '].includes(event.key)||!event.target.closest('[data-atom-id]'))return;event.preventDefault();onClick(event);}
  function onToggle(event){if(disposed||!root.contains(event.target)||!event.target.dataset.flDetails)return;const name=event.target.dataset.flDetails;d.details=d.details.filter(v=>v!==name);if(event.target.open){d.details.push(name);if(['classes','foods','health','sources'].includes(name))d.referenceOpened=true;}drawSummary();}
  async function load(){
    const token=++epoch;abort?.abort();abort=new AbortController();loading=true;dataset=null;rendered={};field('load-status').textContent='正在載入並核對結構…';action('retry').hidden=true;draw();
    try{const next=await loadData(abort.signal);if(disposed||token!==epoch)return;validateFlavonoidDataset(next);dataset=next;loading=false;
      const options=next.cases.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} · ${esc(c.englishName)}</option>`).join('');for(const key of ['left','right','single'])field(key).innerHTML=options;
      field('task').innerHTML=next.cases.filter(c=>TRANSFER.includes(c.id)).map(c=>`<option value="${esc(c.id)}">${esc(c.name)} · ${esc(c.englishName)}</option>`).join('');field('load-status').textContent='來源身分、原子與鍵已核對；圖為計算二維描繪。';draw();
    }catch(error){if(disposed||token!==epoch)return;dataset=null;loading=false;field('load-status').textContent='結構資料未能讀取或通過核對。你的文字與已存觀察仍保留。';action('retry').hidden=false;draw();}
  }
  for(const node of root.querySelectorAll('[data-fl-details]'))node.open=d.details.includes(node.dataset.flDetails);
  field('food').value=d.foodClass||CLASSES[0]?.id||'';field('health').value=d.healthId||HEALTH[0]?.id||'';drawFood();drawHealth();action('save').hidden=typeof onSaveSummary!=='function';
  root.addEventListener('click',onClick);root.addEventListener('change',onChange);root.addEventListener('input',onInput);root.addEventListener('keydown',onKey);root.addEventListener('toggle',onToggle,true);
  const dispose=()=>{if(disposed)return;disposed=true;epoch++;abort?.abort();for(const[event,fn]of[['click',onClick],['change',onChange],['input',onInput],['keydown',onKey]])root.removeEventListener(event,fn);root.removeEventListener('toggle',onToggle,true);if(slot.dispose===dispose){slot.dispose=null;slot.refresh=null;}if(mounts.get(root)===dispose)mounts.delete(root);};
  slot.dispose=dispose;slot.refresh=drawSummary;mounts.set(root,dispose);draw();load();return dispose;
}
