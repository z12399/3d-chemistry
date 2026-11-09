import {escapeHTML as esc} from './storage.js';
import {PROTEIN_SOLVENT_ID,PROTEIN_SOLVENT_DEFAULTS,normalizeProteinSolventInput,evaluateProteinSolvent,validateProteinSolventDataset} from './protein-solvent-model.js';
import {SOLVENT_COMPONENTS,SOLVENT_SOURCE_LABELS,solventObservationText,solventContext,solventPairDiagram,solventValueTable,solventMethods,solventSources,solventLocation} from './protein-solvent-diagrams.js';
export {PROTEIN_SOLVENT_ID} from './protein-solvent-model.js';

const owners=new WeakMap(),mounts=new WeakMap(),copy=value=>structuredClone(value),signature=value=>JSON.stringify(value);
const INITIAL={'necessary-unfolding':'溶解度較低就必然展開','insufficient-to-infer':'單看溶解度不足以判定','not-yet-decided':'暫不判定，先找證據'};
const CHOICES={supported:'在此範圍獲支持',contrary:'與資料／方法不符',insufficient:'證據不足'};
const COMPARISON_CHOICES={'within-assay-with-limits':'同一assay內可比，仍有條件限制','complementary-not-interchangeable':'不同結果可互補，不能互換','no-shared-numerical-axis':'跨研究沒有共同的數值尺度'};
const COMPARISONS={
  'rnase-within-study':{label:'RNase水與20% ethanol',answer:'within-assay-with-limits',need:['rnase-water-solubility','rnase-ethanol20-solubility'],text:'同一來源表、同蛋白與刊載25°C，可比較mg/mL；逐組pH、濃度基準與完整方法仍未明，不能宣稱只改了一個分子變因。'},
  'wpi-within-observable':{label:'WPI同一assay的兩組',answer:'within-assay-with-limits',need:['wpi-control-supernatant','wpi-ethanol80-supernatant'],text:'兩組處理後樣品在同一個上清蛋白assay內可比；80%是先前處理，殘留乙醇與處理時pH仍有界線。'},
  'wpi-between-observables':{label:'WPI的CD與上清蛋白比例',answer:'complementary-not-interchangeable',need:['wpi-control-supernatant','wpi-ethanol80-supernatant','wpi-control-cd-alpha_helix','wpi-ethanol80-cd-alpha_helix'],text:'CD用0.5mg/mL、上清比例用20mg/mL；二級結構與離心後比例是互補結果，不能合成穩定性百分比。'},
  'between-studies':{label:'RNase與WPI的數字',answer:'no-shared-numerical-axis',need:['rnase-water-solubility','rnase-ethanol20-solubility','wpi-control-supernatant','wpi-ethanol80-supernatant'],text:'蛋白、介質、處理階段、量測方法及單位不同。可以轉移判讀方法，不能共用數值排名。'},
};
const PANELS={writing:'初判理由、修訂與轉移',judgements:'核對主張與可比性',methods:'方法與目前完整數據',sources:'來源與未解資料',records:'保留紀錄與輪次',summary:'待存內容與完整摘要'};
const WRITING={reason:'原判斷的理由',falsifier:'什麼觀察會讓我改變看法？',observation:'我觀察到什麼？',revision:'我如何修訂原判斷？',transfer:'我的轉移題回答'};
const DISCLOSURES=['judgements','methods','sources'];
const fresh=()=>({rounds:[],currentId:null,details:[],seen:{evidence:[],disclosures:[],sources:[],references:[]},cursor:{header:false,rounds:{}},savedVersions:[]});
const remember=(items,value)=>{if(!items.includes(value))items.push(value);};
const writingText=w=>Object.entries(WRITING).map(([key,label])=>`${label}：${w[key]||'未填'}`).join('\n');
const exposureText=seen=>`本頁工作台曾顯示：${seen.evidence.join('、')||'無'}\n曾展開：${seen.disclosures.join('、')||'無'}；曾開來源：${seen.sources.join('、')||'無'}；曾看參考：${seen.references.join('、')||'無'}。顯示或開啟不表示已讀；課文、前次或其他頁面可能已見資料，不宣稱盲測。`;
const preamble='【溶得少，就代表蛋白展開了嗎？】\n固定文獻對照；構形分類、溶解讀值與未提供的匹配ΔG／Tm分開。WPI是乙醇處理後再分散量測，非現場濃度實驗；無自動掌握或全文評分。';
let serial=0;
async function defaultLoad(signal){const response=await fetch(new URL('../data/protein-solvent-evidence.json',import.meta.url),{signal});if(!response.ok)throw new Error('Protein solvent sources unavailable');return response.json();}

export function mountProteinSolventLab(root,id=PROTEIN_SOLVENT_ID,{draftOwner,draftKey=id,onSaveSummary,loadData=defaultLoad}={}){
  if(!root?.querySelector||!root?.addEventListener)throw new TypeError('A DOM container is required');
  if(id!==PROTEIN_SOLVENT_ID)throw new RangeError('Unknown protein solvent activity');
  mounts.get(root)?.();let slot;
  if(draftOwner&&typeof draftOwner==='object'){if(!owners.has(draftOwner))owners.set(draftOwner,new Map());const map=owners.get(draftOwner),key=String(draftKey);if(!map.has(key))map.set(key,{data:fresh()});slot=map.get(key);slot.dispose?.();}else slot={data:fresh()};
  const d=slot.data,prefix=`protein-solvent-${++serial}`,$=name=>root.querySelector(`[data-ps-${name}]`),attr=(name,value)=>root.querySelector(`[data-ps-${name}="${value}"]`),action=name=>attr('action',name);
  let data=null,result=null,disposed=false,epoch=0,abort=null,feedback='',loadStatus='loading';slot.saveStatus??='';
  const current=()=>d.rounds.find(r=>r.id===d.currentId)||null;
  const valid=()=>!!data&&!!result&&result.status==='REPORTED_EVIDENCE';
  const used=r=>r.touched||!!r.first;
  function makeRound(){const r={id:d.rounds.length+1,input:{...PROTEIN_SOLVENT_DEFAULTS},prediction:'',writing:Object.fromEntries(Object.keys(WRITING).map(k=>[k,''])),first:null,claims:{},comparisons:{},claimId:'low-means-unfolded',comparisonId:'rnase-within-study',events:[],exposures:[],observations:[],transferReference:false,lastView:'',touched:false,source:{version:data.version,identity:slot.datasetIdentity,sources:copy(data.sources)}};d.rounds.push(r);d.currentId=r.id;return r;}
  function freezeInitial(trigger){const r=current();if(!r||r.first)return;r.first=copy({id:r.id,choice:r.prediction,reason:r.writing.reason,falsifier:r.writing.falsifier,trigger,seen:d.seen,answered:!!r.prediction||!!r.writing.reason.trim()});r.touched=true;}
  function log(type,text){const r=current();if(r)r.events.push({type,text});}
  const exposureRef=(r,index)=>`第 ${r.id} 輪${index?`曝光 ${index}`:'固定初判曝光'}`;
  function checkpoint(r,seen){
    const key=signature(seen);if(key===signature(r.first.seen))return 0;
    const found=r.exposures.findIndex(value=>signature(value.seen)===key);if(found>=0)return found+1;
    const base=r.exposures.at(-1)?.seen||r.first.seen,delta={};
    for(const name of ['evidence','disclosures','sources','references'])delta[name]=seen[name].filter(value=>!base[name].includes(value));
    r.exposures.push({seen:copy(seen),delta});return r.exposures.length;
  }
  function checkpointText(r,index){const value=r.exposures[index-1],labels={evidence:'新增證據',disclosures:'新增展開',sources:'新增來源',references:'新增參考'};return `${exposureRef(r,index)}：承接${exposureRef(r,index-1)}\n${Object.entries(labels).filter(([key])=>value.delta[key].length).map(([key,label])=>`${label}：${value.delta[key].join('、')}`).join('\n')}`;}
  function viewText(value){return `${solventContext(value)}\n${value.rows.map(row=>`${row.condition.label}：${row.measurements.map(o=>`${SOLVENT_COMPONENTS[o.component]||value.observable.label} ${solventObservationText(o)} [${o.id}]`).join('；')}${row.conformation?`；${solventObservationText(row.conformation)} [${row.conformation.id}]`:''}`).join('\n')}\n定位：${[...new Set(value.rows.flatMap(row=>row.measurements.flatMap(o=>o.locatorRefs)))].map(solventLocation).join('；')}`;}
  function updateView(){
    const r=current();result=data&&r?evaluateProteinSolvent(r.input,data):null;if(!valid())return;
    const key=signature(r.input);for(const evidence of result.visibleEvidenceIds)remember(d.seen.evidence,evidence);
    if(r.input.study==='wpi')remember(d.seen.disclosures,'wpi-treatment-versus-measurement');
    if(r.lastView!==key){r.lastView=key;log('view',`顯示文獻對照\n${viewText(result)}`);}
  }
  const firstText=f=>`第 ${f.id} 輪固定初判（${f.trigger}）\n${f.answered?'已留下判斷／理由':'未作答先看證據，不計首次作答結果'}\n初判：${INITIAL[f.choice]||'未選'}\n原判斷的理由：${f.reason||'未填'}\n會改變看法的觀察：${f.falsifier||'未填'}\n${exposureText(f.seen)}`;
  const sourceText=s=>`來源版本：${s.version}\n來源識別：${s.identity}\n${s.sources.map(v=>`${SOLVENT_SOURCE_LABELS[v.id]||v.title}｜${v.url}\nSHA-256：${v.sha256}`).join('\n')}`;
  function decisions(r){return {claims:r.claims,comparisons:r.comparisons,transferReference:r.transferReference};}
  function decisionText(r){return [...Object.entries(r.claims).filter(([,v])=>v.choice||v.first).map(([key,v])=>`主張 ${key}｜${CHOICES[v.choice]||'未選'}${v.first?`\n首次判讀：${CHOICES[v.first.choice]||'未選'}；${v.review?.assessed?(v.review.correct?'符合此來源判讀':'保留原判讀，請修訂'):'先看參考，未計首次核對'}\n${v.review?.feedback||''}\n作答前曝光：引用${exposureRef(r,v.first.exposure)}`:''}`),...Object.entries(r.comparisons).filter(([,v])=>v.choice||v.first).map(([key,v])=>`可比性：${COMPARISONS[key].label}｜${COMPARISON_CHOICES[v.choice]||'未選'}${v.first?`\n首次判讀：${COMPARISON_CHOICES[v.first.choice]||'未選'}；${v.review?.assessed?(v.review.correct?'符合此比較界線':'保留原判讀，請修訂'):'先看參考，未計首次核對'}\n${v.review?.feedback||''}\n作答前曝光：引用${exposureRef(r,v.first.exposure)}`:''}`),...(r.transferReference?['轉移題推理要點已展開；文字自評，不自動評分。']:[])].join('\n\n');}
  function appendPlan(){
    const next=copy(d.cursor),parts=[],versions=[];
    for(const r of d.rounds.filter(used)){
      const old=next.rounds[r.id]||{first:false,events:0,exposures:0,observations:0,writing:'',decisions:''};
      if(!next.rounds[r.id])parts.push(`第 ${r.id} 輪\n${sourceText(r.source)}`);
      if(r.first&&!old.first)parts.push(firstText(r.first));
      parts.push(...r.events.slice(old.events).map((e,i)=>`第 ${r.id} 輪取證 ${old.events+i+1}\n${e.text}`));
      parts.push(...r.exposures.slice(old.exposures).map((e,i)=>checkpointText(r,old.exposures+i+1)));
      parts.push(...r.observations.slice(old.observations).map((o,i)=>`第 ${r.id} 輪觀察 ${old.observations+i+1}\n${o.text}`));
      const writing=signature({prediction:r.prediction,writing:r.writing}),decision=signature(decisions(r));
      if(writing!==old.writing){const text=`第 ${r.id} 輪文字版本\n初判選擇：${INITIAL[r.prediction]||'未選'}\n${writingText(r.writing)}`;parts.push(text);versions.push({roundId:r.id,text});}
      if(decision!==old.decisions&&decisionText(r))parts.push(`第 ${r.id} 輪核對紀錄\n${decisionText(r)}`);
      next.rounds[r.id]={first:!!r.first,events:r.events.length,exposures:r.exposures.length,observations:r.observations.length,writing,decisions:decision};
    }
    if(parts.length&&!next.header){parts.unshift(preamble);next.header=true;}
    return {text:parts.join('\n\n'),next,versions};
  }
  function fullText(){const rounds=d.rounds.filter(used);if(!rounds.length)return '';return [preamble,...rounds.flatMap(r=>[`第 ${r.id} 輪\n${sourceText(r.source)}`,r.first?firstText(r.first):'初判尚未固定；目前為草稿。',...r.events.map((e,i)=>`第 ${r.id} 輪取證 ${i+1}\n${e.text}`),...r.exposures.map((e,i)=>checkpointText(r,i+1)),...r.observations.map((o,i)=>`第 ${r.id} 輪觀察 ${i+1}\n${o.text}`),...d.savedVersions.filter(v=>v.roundId===r.id).map(v=>v.text),`目前文字\n初判選擇：${INITIAL[r.prediction]||'未選'}\n${writingText(r.writing)}`,decisionText(r)])].filter(Boolean).join('\n\n');}
  const optionList=object=>Object.entries(object).map(([value,label])=>`<option value="${esc(value)}">${esc(label)}</option>`).join('');
  root.innerHTML=`<section class="protein-solvent-evidence" aria-labelledby="${prefix}-title" data-ps-ready="loading"><h2 class="ps-sr-only" id="${prefix}-title">溶得少，就代表蛋白展開了嗎？</h2>
    <p role="status" data-ps-load-status>正在核對文獻資料…</p><button type="button" data-ps-action="retry" hidden>重試載入</button>
    <div class="ps-controls"><label for="${prefix}-study">研究對照<select id="${prefix}-study" data-ps-study disabled><option value="rnase">RNase Sa</option><option value="wpi">WPI處理後</option></select></label><label for="${prefix}-observable" data-ps-wpi-controls hidden>要看哪種證據？<select id="${prefix}-observable" data-ps-observable disabled><option value="supernatant">上清蛋白比例</option><option value="cd">CD二級結構組成</option><option value="turbidity">混濁 A600</option></select></label></div>
    <p class="ps-ribbon" data-ps-ribbon hidden></p><p class="ps-caption" data-ps-condition></p><div data-ps-diagram></div><p class="ps-unknown" data-ps-unknown></p>
    <div class="ps-initial"><label for="${prefix}-prediction">你的初判：溶得少，就必然展開嗎？<select id="${prefix}-prediction" data-ps-prediction disabled><option value="">先選一個判斷</option>${optionList(INITIAL)}</select></label><button type="button" data-ps-action="reveal" disabled>揭示作者構形標記</button></div><p class="ps-caption" data-ps-initial-status></p>
    <div class="ps-actions"><button type="button" data-ps-action="record" disabled>保留這組觀察</button><button type="button" class="ps-primary" data-ps-action="save">附加到本課筆記</button><span data-ps-count></span></div><p role="status" data-ps-feedback></p><p role="status" data-ps-save-status></p>
    <details data-ps-details="writing"><summary>初判理由、修訂與轉移</summary><p class="ps-caption">原文固定後可另寫修訂。這裡只記本頁工作台的顯示；課文或前次可能已見資料，不宣稱盲測。</p>${Object.entries(WRITING).map(([name,label])=>`${name==='transfer'?'<p>換個條件：另一蛋白經另一有機溶劑處理後，上清比例下降，far-UV CD幾乎不變。能說原生結構穩定度沒變嗎？下一步需要什麼證據？</p>':''}<label for="${prefix}-${name}">${label}<textarea id="${prefix}-${name}" rows="3" data-ps-writing="${name}" disabled></textarea></label>`).join('')}<button type="button" data-ps-action="reference-transfer" disabled>對照轉移題推理要點</button><p data-ps-transfer-feedback></p></details>
    <details data-ps-details="judgements"><summary data-ps-disclosure="judgements">核對主張與可比性</summary><div class="ps-judgements"><section><h3>主張需要哪種證據？</h3><label for="${prefix}-claim">選主張<select id="${prefix}-claim" data-ps-claim disabled></select></label><label for="${prefix}-claim-choice">我的判讀<select id="${prefix}-claim-choice" data-ps-claim-choice disabled><option value="">先選判讀</option>${optionList(CHOICES)}</select></label><div class="ps-actions"><button type="button" data-ps-action="check-claim" disabled>核對主張</button><button type="button" data-ps-action="reference-claim" disabled>先看參考</button></div><p role="status" data-ps-claim-feedback></p></section><section><h3>這兩份證據能怎樣比較？</h3><label for="${prefix}-comparison">選比較<select id="${prefix}-comparison" data-ps-comparison disabled>${optionList(Object.fromEntries(Object.entries(COMPARISONS).map(([k,v])=>[k,v.label])))}</select></label><label for="${prefix}-comparison-choice">我的可比性判讀<select id="${prefix}-comparison-choice" data-ps-comparison-choice disabled><option value="">先選判讀</option>${optionList(COMPARISON_CHOICES)}</select></label><div class="ps-actions"><button type="button" data-ps-action="check-comparison" disabled>核對可比性</button><button type="button" data-ps-action="reference-comparison" disabled>先看參考</button></div><p role="status" data-ps-comparison-feedback></p></section></div></details>
    <details data-ps-details="methods"><summary data-ps-disclosure="methods">方法與目前完整數據</summary><div data-ps-methods></div><div data-ps-numbers></div></details>
    <details data-ps-details="sources"><summary data-ps-disclosure="sources">來源與未解資料</summary><div data-ps-sources></div></details>
    <details data-ps-details="records"><summary>保留紀錄與輪次</summary><div class="ps-controls"><label for="${prefix}-run">回到一輪<select id="${prefix}-run" data-ps-run></select></label><button type="button" data-ps-action="new" disabled>新一輪判讀</button></div><pre class="ps-preserved" data-ps-first></pre><div data-ps-records></div></details>
    <details data-ps-details="summary"><summary>待存內容與完整摘要</summary><label for="${prefix}-append">本次會附加的內容<textarea id="${prefix}-append" rows="5" readonly data-ps-append></textarea></label><label for="${prefix}-summary">完整摘要（包括已保存文字版本）<textarea id="${prefix}-summary" rows="7" readonly data-ps-summary></textarea></label><button type="button" data-ps-action="copy">選取完整摘要</button><p class="ps-caption">同頁返課可接續；重載前請保存或複製。只有已附加摘要進入食品化學JSON匯出；還原是可讀文字，不重建未保存盤面。三科仍各自匯出還原。</p></details>
  </section>`;
  function drawSummary(){if(disposed)return;const plan=appendPlan();$('append').value=plan.text;$('summary').value=fullText();action('save').disabled=!!slot.pending||!plan.text||typeof onSaveSummary!=='function';$('save-status').textContent=slot.saveStatus;}
  function drawRecords(){if(disposed)return;const r=current();$('run').innerHTML=d.rounds.map(round=>`<option value="${round.id}">第 ${round.id} 輪</option>`).join('');$('run').value=String(r?.id||'');$('first').textContent=r?.first?firstText(r.first):'尚未固定初判。';$('records').innerHTML=r?[...r.events.map((e,i)=>`<article class="ps-record"><h3>第 ${r.id} 輪取證 ${i+1}</h3><p class="ps-preserved">${esc(e.text)}</p></article>`),...r.exposures.map((e,i)=>`<p class="ps-preserved">${esc(checkpointText(r,i+1))}</p>`),...r.observations.map((o,i)=>`<article class="ps-record"><h3>第 ${r.id} 輪觀察 ${i+1}</h3><p class="ps-preserved">${esc(o.text)}</p></article>`),`<p class="ps-preserved">${esc(decisionText(r))}</p>`].join(''):'';$('count').textContent=r?`第 ${r.id} 輪 · 已保留 ${r.observations.length} 組`:'';}
  const evidenceReady=ids=>ids.every(id=>d.seen.evidence.includes(id));
  function claimReady(claim){return !!claim&&evidenceReady(claim.requiresEvidenceIds)&&(!claim.requiredDisclosure||d.seen.disclosures.includes(claim.requiredDisclosure));}
  function drawJudgements(){
    const r=current(),claim=data?.claimChecks.find(c=>c.id===r?.claimId),c=r?.claims[r.claimId],comparison=COMPARISONS[r?.comparisonId],v=r?.comparisons[r?.comparisonId];
    $('claim').disabled=!valid();$('claim').value=r?.claimId||'';$('claim-choice').disabled=!valid()||!!c?.first;$('claim-choice').value=c?.choice||'';
    action('check-claim').disabled=!valid()||!c?.choice||!!c?.first||!claimReady(claim);action('reference-claim').disabled=!valid()||!!c?.first;
    $('claim-feedback').textContent=c?.review?`${c.review.assessed?(c.review.correct?'符合此來源的判讀界線。':'原判讀已保留，請用證據修訂。'):'已看參考，未計首次核對。'} ${c.review.feedback}`:valid()&&!claimReady(claim)?'先顯示所需證據再核對；也可以明選先看參考。':'';
    $('comparison').disabled=!valid();$('comparison').value=r?.comparisonId||'';$('comparison-choice').disabled=!valid()||!!v?.first;$('comparison-choice').value=v?.choice||'';
    action('check-comparison').disabled=!valid()||!v?.choice||!!v?.first||!comparison||!evidenceReady(comparison.need);action('reference-comparison').disabled=!valid()||!!v?.first;
    $('comparison-feedback').textContent=v?.review?`${v.review.assessed?(v.review.correct?'符合這組比較的界線。':'原判讀已保留，請補上方法差別。'):'已看參考，未計首次核對。'} ${v.review.feedback}`:valid()&&comparison&&!evidenceReady(comparison.need)?'先顯示這個比較所需的兩份證據，或先看參考。':'';
  }
  function drawWriting(){const r=current();$('prediction').value=r?.prediction||'';$('prediction').disabled=!valid()||!!r?.first;for(const name of Object.keys(WRITING)){const node=attr('writing',name);node.value=r?.writing[name]||'';node.disabled=!r;node.readOnly=!!r?.first&&['reason','falsifier'].includes(name);}action('reference-transfer').disabled=!valid()||!!r?.transferReference;$('transfer-feedback').textContent=r?.transferReference?'上清比例、CD二級結構與摺疊自由能不同。CD幾乎不變不能保證三級構形或ΔG不變；需在對應介質、濃度、溫度、pH及可逆性／平衡界線下補相應結構或穩定度證據。這是自評，不自動判分。':'';$('initial-status').textContent=r?.first?(r.first.answered?'初判與當時工作台曝光已保留；新理解請寫在修訂。':'本輪未作答先看證據，未計首次作答結果；可繼續寫觀察與修訂。'):'可先留判斷，也可直接看證據；理由在下方展開。';}
  function draw(){
    if(disposed)return;updateView();const r=current();$('ready').setAttribute('data-ps-ready',loadStatus);$('study').disabled=!valid();$('observable').disabled=!valid();$('study').value=r?.input.study||'rnase';$('observable').value=r?.input.wpiObservable||'supernatant';$('wpi-controls').hidden=!valid()||r.input.study!=='wpi';$('ribbon').hidden=!valid()||r.input.study!=='wpi';$('ribbon').textContent=valid()&&r.input.study==='wpi'?'乙醇處理 → 移除／凍乾 → 再分散 → 量測':'';
    $('condition').textContent=solventContext(result);$('diagram').innerHTML=solventPairDiagram(result);$('unknown').textContent=valid()?(r.input.study==='rnase'?'此對照ΔG／Tm：未提供。folded標記不能代填穩定度。':'0%與80%是先前處理條件；數值是在移除／凍乾／再分散後量測。'):'';
    action('reveal').hidden=!!r&&r.input.study!=='rnase';action('reveal').disabled=!valid()||!!r.input.revealConformation;action('reveal').textContent=r?.input.revealConformation?'作者標記已揭示':'揭示作者構形標記';action('record').disabled=!valid();action('new').disabled=!valid();$('methods').innerHTML=solventMethods(result);$('numbers').innerHTML=solventValueTable(result);$('feedback').textContent=feedback;drawWriting();drawJudgements();drawRecords();drawSummary();
  }
  function save(){
    if(disposed||slot.pending||typeof onSaveSummary!=='function')return;const plan=appendPlan();if(!plan.text)return;
    if(plan.text.length>10000){slot.saveStatus='尚未保存：本次內容超過10,000字元；全文未截斷，可選取複製。';drawSummary();return;}
    const token={};slot.pending=token;slot.saveStatus='正在附加固定的這次內容；仍可繼續修訂。';drawSummary();
    const finish=(ok,error)=>{if(slot.pending!==token)return;slot.pending=null;if(ok===true){d.cursor=plan.next;d.savedVersions.push(...plan.versions);slot.saveStatus='已附加本次內容；後續只加入新取證與文字版本。';}else slot.saveStatus=`尚未保存。${error?.message||'儲存端未確認成功，請核對筆記容量與衝突。'} 全文與保存位置保留。`;slot.refresh?.();};
    try{const answer=onSaveSummary(plan.text);if(answer&&typeof answer.then==='function')Promise.resolve(answer).then(value=>finish(value),error=>finish(false,error));else finish(answer);}catch(error){finish(false,error);}
  }
  function review(kind,reference){
    const r=current(),isClaim=kind==='claim',key=isClaim?r.claimId:r.comparisonId,definition=isClaim?data.claimChecks.find(c=>c.id===key):COMPARISONS[key],map=isClaim?r.claims:r.comparisons,entry=map[key]??={choice:'',first:null,review:null};if(entry.first)return;
    const enough=isClaim?claimReady(definition):evidenceReady(definition.need);if(!reference&&(!entry.choice||!enough))return;
    freezeInitial(reference?'先看判讀參考':'核對判讀');entry.first=copy({choice:entry.choice,seen:d.seen,exposure:checkpoint(r,d.seen)});
    const expected=isClaim?(definition.expected==='supported-within-scope'?'supported':definition.expected==='insufficient-evidence'?'insufficient':'contrary'):definition.answer;
    entry.review={assessed:!reference&&!!entry.choice&&enough,correct:!reference&&entry.choice===expected,expected:isClaim?definition.expected:expected,feedback:isClaim?definition.feedback:definition.text};remember(d.seen.references,`${kind}:${key}`);r.touched=true;log('reference',`${isClaim?'主張':'可比性'}參考已顯示：${key}；${entry.review.assessed?'已核對選項':'未計首次核對'}`);draw();
  }
  function onInput(event){if(disposed||!root.contains(event.target))return;const name=event.target.dataset.psWriting,r=current();if(!r||!Object.hasOwn(WRITING,name))return;if(r.first&&['reason','falsifier'].includes(name)){event.target.value=r.writing[name];return;}r.writing[name]=String(event.target.value);r.touched=true;drawSummary();}
  function onChange(event){
    if(disposed||!root.contains(event.target))return;const node=event.target,r=current();if(!r)return;
    if(node===$('run')){const chosen=d.rounds.find(v=>String(v.id)===node.value);if(!chosen){node.value=String(r.id);return;}if(chosen.id!==r.id)freezeInitial('切換輪次前保留初判');d.currentId=chosen.id;feedback='已回到這一輪；其他輪次與本頁曝光仍保留。';draw();return;}
    if(!valid())return;
    if(node===$('study')||node===$('observable')){try{const next=normalizeProteinSolventInput({...r.input,[node===$('study')?'study':'wpiObservable']:node.value});if(signature(next)===signature(r.input))return;freezeInitial('切換取證路徑');r.input={...next};feedback='已切換既有文獻對照；原判斷仍保留。';}catch{feedback='無效選項；保留上一組文獻對照。';}draw();return;}
    if(node===$('prediction')){if(!r.first&&Object.hasOwn(INITIAL,node.value)){r.prediction=node.value;r.touched=true;}else if(!r.first&&node.value==='')r.prediction='';drawWriting();drawSummary();return;}
    if(node===$('claim')){if(data.claimChecks.some(c=>c.id===node.value))r.claimId=node.value;drawJudgements();return;}
    if(node===$('comparison')){if(Object.hasOwn(COMPARISONS,node.value))r.comparisonId=node.value;drawJudgements();return;}
    for(const [name,key,map,choices]of [['claim-choice',r.claimId,r.claims,CHOICES],['comparison-choice',r.comparisonId,r.comparisons,COMPARISON_CHOICES]])if(node===$(name)){const entry=map[key]??={choice:'',first:null,review:null};if(!entry.first&&(node.value===''||Object.hasOwn(choices,node.value))){entry.choice=node.value;r.touched=true;}drawJudgements();drawSummary();return;}
  }
  function onSource(event,type){if(disposed||!root.contains(event.target)||!valid())return false;const anchor=event.target.closest('[data-ps-source]');if(!anchor)return false;if(type==='auxclick'&&event.button!==1||type==='click'&&event.button>0)return true;const source=data.sources.find(s=>s.id===anchor.dataset.psSource);if(!source)return true;freezeInitial('開啟來源');const r=current();if(!r.events.some(e=>e.type==='source'&&e.sourceId===source.id)){r.events.push({type:'source',sourceId:source.id,text:`開啟來源（不表示已讀）：${SOLVENT_SOURCE_LABELS[source.id]||source.title}\n${source.url}\n來源SHA-256：${source.sha256}`});}remember(d.seen.sources,source.id);drawWriting();drawRecords();drawSummary();return true;}
  function onClick(event){
    if(disposed||!root.contains(event.target))return;if(onSource(event,'click'))return;if(event.button>0)return;
    const disclosure=event.target.closest('[data-ps-disclosure]');if(disclosure&&valid()&&!attr('details',disclosure.dataset.psDisclosure).open){freezeInitial('展開依據前');drawWriting();drawSummary();return;}
    const button=event.target.closest('[data-ps-action]');if(!button||button.disabled)return;const name=button.dataset.psAction;if(name==='copy'){$('summary').focus();$('summary').select();feedback='已選取完整摘要，按Ctrl+C複製。';$('feedback').textContent=feedback;return;}if(name==='save')return save();if(name==='retry')return load();if(!valid())return;const r=current();
    if(name==='reveal'){freezeInitial('揭示作者構形標記');r.input.revealConformation=true;feedback='兩個作者構形標記已顯示；原判斷與當時曝光已保留。';}
    else if(name==='record'){freezeInitial('保留觀察');const eventIndex=r.events.findLastIndex(e=>e.type==='view')+1,exposure=checkpoint(r,d.seen),text=`數值、方法與定位：引用第 ${r.id} 輪取證 ${eventIndex}\n保留時曝光：引用${exposureRef(r,exposure)}\n${writingText(r.writing)}`;if(!r.observations.some(o=>o.text===text))r.observations.push({text,eventIndex,exposure,result:copy(result),writing:copy(r.writing),seen:copy(d.seen)});feedback='已保留在本頁；附加筆記後才納入食品化學JSON匯出。';}
    else if(name==='new'){freezeInitial('開始新一輪');makeRound();feedback='已開始新一輪；舊紀錄與本頁曾看證據仍保留。';}
    else if(name==='reference-transfer'){freezeInitial('先看轉移題要點');r.transferReference=true;r.touched=true;remember(d.seen.references,'transfer');log('reference','轉移題推理要點已顯示；不是自動評分。');}
    else if(name==='check-claim'||name==='reference-claim')return review('claim',name==='reference-claim');
    else if(name==='check-comparison'||name==='reference-comparison')return review('comparison',name==='reference-comparison');
    draw();
  }
  function onToggle(event){
    if(disposed||!root.contains(event.target)||!event.target.dataset.psDetails)return;const name=event.target.dataset.psDetails,open=event.target.open,was=d.details.includes(name);d.details=d.details.filter(v=>v!==name);if(open)d.details.push(name);
    if(open&&!was&&valid()&&DISCLOSURES.includes(name)){freezeInitial('展開依據');remember(d.seen.disclosures,PANELS[name]);log('disclosure',`展開：${PANELS[name]}（不表示已讀）`);drawWriting();drawRecords();drawSummary();}
  }
  async function load(){
    const token=++epoch;abort?.abort();abort=new AbortController();data=null;result=null;loadStatus='loading';action('retry').hidden=true;$('load-status').textContent='正在核對文獻資料…';$('sources').innerHTML='';draw();
    try{const checked=validateProteinSolventDataset(await loadData(abort.signal));if(disposed||token!==epoch)return;const evaluated=evaluateProteinSolvent(PROTEIN_SOLVENT_DEFAULTS,checked);if(evaluated.status!=='REPORTED_EVIDENCE'||slot.datasetIdentity&&slot.datasetIdentity!==evaluated.datasetIdentity)throw new Error('Dataset identity changed');slot.datasetIdentity=evaluated.datasetIdentity;data=checked;if(!current())makeRound();$('claim').innerHTML=data.claimChecks.map(c=>`<option value="${esc(c.id)}">${esc(c.text)}</option>`).join('');$('sources').innerHTML=solventSources(data);loadStatus='ready';$('load-status').textContent='';updateView();for(const name of d.details.filter(v=>DISCLOSURES.includes(v))){freezeInitial('載入時依據已展開');remember(d.seen.disclosures,PANELS[name]);}draw();}
    catch{if(disposed||token!==epoch)return;data=null;result=null;loadStatus='error';$('load-status').textContent='來源未能載入或通過核對；目前不顯示讀值。既有文字與觀察仍保留，可重試。';action('retry').hidden=false;draw();}
  }
  for(const node of root.querySelectorAll('[data-ps-details]'))node.open=d.details.includes(node.dataset.psDetails);
  action('save').hidden=typeof onSaveSummary!=='function';
  const auxclick=event=>onSource(event,'auxclick');
  for(const [name,handler]of [['click',onClick],['input',onInput],['change',onChange],['auxclick',auxclick]])root.addEventListener(name,handler);
  root.addEventListener('toggle',onToggle,true);
  const dispose=()=>{if(disposed)return;disposed=true;epoch++;abort?.abort();for(const [name,handler]of [['click',onClick],['input',onInput],['change',onChange],['auxclick',auxclick]])root.removeEventListener(name,handler);root.removeEventListener('toggle',onToggle,true);if(slot.dispose===dispose){slot.dispose=null;slot.refresh=null;}if(mounts.get(root)===dispose)mounts.delete(root);};
  slot.dispose=dispose;slot.refresh=()=>{if(!disposed){drawRecords();drawSummary();}};mounts.set(root,dispose);draw();load();return dispose;
}
