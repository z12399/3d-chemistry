import {escapeHTML as esc} from './storage.js';
import {MICRO_RISK_LAB_ID,MICRO_RISK_VERSION,MICRO_RISK_CONFIG,createDefaultRiskInput,createToyResponse,evaluateMicroRisk,compareMicroRisk,averageServingRisk} from './micro-risk-model.js';
import {MICRO_RISK_SOURCES as SOURCES,MICRO_RISK_FRAMEWORK as FRAMEWORK,MICRO_RISK_LESSON_SCOPE as SCOPE,MICRO_RISK_CLAIMS as CLAIMS} from './micro-risk-data.js';
export {MICRO_RISK_LAB_ID} from './micro-risk-model.js';

const drafts=new WeakMap(),mounted=new WeakMap();
const clone=value=>structuredClone(value),sig=value=>JSON.stringify(value);
const fmt=(value,digits=4)=>Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits});
const names={KNOWN:'可計算',UNKNOWN:'未知',INVALID:'輸入無效',OUT_OF_DOMAIN:'超出題設範圍',UNSUPPORTED:'模型不適用'};
const choices={response:'劑量反應',serving:'每份重量',growth:'菌量曲線'};
const writing=()=>({prediction:'',observation:'',revision:''});
const newRound=id=>({id,choice:'',writing:writing(),first:null});
const fresh=()=>({input:createDefaultRiskInput(),activity:'chain',spread:'variation',average:false,rounds:[newRound(1)],snapshots:[],journal:[],sources:[],details:[],compare:{left:'',right:'',text:''},savedWritings:[],cursor:{started:false,journal:0,rounds:{}}});
let sequence=0;
const valueText=(node,probability=false)=>node.status==='KNOWN'?`${fmt(node.value*(probability?100:1),probability?4:5)}${probability?'%':''}`:names[node.status];
const pointsText=node=>node.status==='KNOWN'?`${fmt(node.value*100,5)} 百分點`:names[node.status];
const inputText=i=>`情境 ${i.scenario}；保存 ${i.timeHours} h；每份 ${i.servingGrams} g；${i.response?`r=${i.response.r}，分布=${i.response.doseDistribution}，宿主=${i.response.host}`:'缺劑量反應'}`;
const resultText=r=>`C=${valueText(r.C)} 虛構細胞/g；d=${valueText(r.d)} 虛構細胞/份（平均）；P=${valueText(r.P,true)}（指定情境每份感染機率）\n發病、嚴重度及全市場風險：未知`;
const writingText=w=>`原預測：${w.prediction||'未填'}\n觀察：${w.observation||'未填'}\n修訂：${w.revision||'未填'}`;
const firstText=f=>`第 ${f.round} 輪首次揭示／記錄前｜${f.trigger}\n${inputText(f.input)}\n${resultText(f.result)}\n判斷：${choices[f.choice]||'未選'}\n${writingText(f.writing)}\n此前開啟來源：${f.sources.join('、')||'無'}（開啟不等於已讀）；此前已揭示感染結果：${f.previousExposure?'是':'否'}。本紀錄不主張盲測。`;
const preamble=()=>`【菌量之後，還缺哪一步？】${MICRO_RISK_VERSION}\n原創虛構 H*／F*／G*；參數非實測或擬合。C₀=0.1，g_A=4 h，g_B=2 h；C=C₀×2^(t/g)，d=C×m。N~Poisson(d) 且各細胞獨立、r 固定時，P=1−exp(−rd)。包含 N=0；不另乘污染機率。不代表食品安全或保存期限。\n${SOURCES.map(s=>`${s.title}\n${s.url}`).join('\n')}`;

function growthChart(input,result){
  const x=t=>58+t*52,y=c=>207-c/1.6*161;
  const path=Array.from({length:65},(_,i)=>{const t=i/8,c=evaluateMicroRisk({...input,timeHours:t}).C.value;return `${i?'L':'M'}${x(t)},${y(c)}`;}).join(' ');
  return `<svg viewBox="0 0 500 260" role="img" aria-label="題設情境 ${input.scenario} 的平均濃度；目前 ${input.timeHours} 小時，${valueText(result.C)} 虛構細胞每克"><text x="58" y="24">C（虛構細胞/g）</text>${[0,.4,.8,1.2,1.6].map(v=>`<path class="mr-grid" d="M58,${y(v)}H474"/><text x="48" y="${y(v)+6}" text-anchor="end">${v}</text>`).join('')}<path class="mr-axis" d="M58,46V207H474"/>${[0,2,4,6,8].map(t=>`<text x="${x(t)}" y="232" text-anchor="middle">${t}</text>`).join('')}<text x="474" y="255" text-anchor="end">保存時間（h）</text><path class="mr-growth" d="${path}"/><path class="mr-current" d="M${x(input.timeHours)},207V${y(result.C.value)}"/><circle class="mr-dot" cx="${x(input.timeHours)}" cy="${y(result.C.value)}" r="6"/></svg>`;
}

export function mountMicroRiskLab(root,id=MICRO_RISK_LAB_ID,{draftOwner,draftKey=id,onSaveSummary}={}){
  if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');
  if(id!==MICRO_RISK_LAB_ID)throw new RangeError('Unknown risk activity');
  mounted.get(root)?.();
  let slot;
  if(draftOwner&&typeof draftOwner==='object'){
    if(!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
    const map=drafts.get(draftOwner),key=String(draftKey);
    if(!map.has(key))map.set(key,{data:fresh(),dispose:null});
    slot=map.get(key);slot.dispose?.();
  }else slot={data:fresh(),dispose:null};
  const d=slot.data,prefix=`micro-risk-${++sequence}`;
  const field=name=>root.querySelector(`[data-mr-${name}]`),action=name=>root.querySelector(`[data-mr-action="${name}"]`);
  const round=()=>d.rounds.at(-1);
  let disposed=false,feedback='';slot.saveStatus??='';
  const knownExposure=()=>d.rounds.some(r=>r.first?.previousExposure)||d.journal.some(e=>e.exposesProbability);
  function freezeFirst(trigger){
    const r=round();if(!r.first)r.first=clone({round:r.id,trigger,input:d.input,result:evaluateMicroRisk(d.input),choice:r.choice,writing:r.writing,sources:d.sources,previousExposure:knownExposure()||!!d.input.response});
  }
  function room(){if(d.journal.length<128)return true;feedback='已保留 128 項操作；不覆寫舊紀錄。請先複製摘要。';return false;}
  function record(label,text,exposesProbability=false){d.journal.push({index:d.journal.length+1,round:round().id,label,text,exposesProbability});}
  const eventText=e=>`操作 ${e.index}｜第 ${e.round} 輪｜${e.label}\n${e.text}`;
  function spreadRows(){
    const inputs=d.spread==='variation'?MICRO_RISK_CONFIG.servingGrams.map(m=>({...clone(d.input),servingGrams:m})):MICRO_RISK_CONFIG.responseCandidates.map(r=>({...clone(d.input),response:d.input.response?{...d.input.response,r}:null}));
    return inputs.map(input=>({input,result:evaluateMicroRisk(input)}));
  }
  function spreadText(){
    const rows=spreadRows();let text=`${d.spread==='variation'?'份量變異情境（非實測分布）':'r 候選值敏感度（非信賴區間）'}\n${rows.map((row,i)=>`${d.spread==='variation'?row.input.servingGrams+' g':'候選 r='+MICRO_RISK_CONFIG.responseCandidates[i]}：d=${valueText(row.result.d)}；P=${valueText(row.result.P,true)}`).join('\n')}`;
    if(d.spread==='variation'&&d.average){const a=averageServingRisk(rows.map(r=>r.input),[.25,.25,.25,.25]);text+=`\n明示假設四份量各占 1/4：平均 P=${valueText(a.P,true)}；先平均 d 再代入=${valueText(a.PAtMeanDose,true)}；後者−前者=${pointsText(a.probabilityGap)}`;}
    return text;
  }
  function appendPlan(){
    const next=clone(d.cursor),parts=[],versions=[];
    for(const r of d.rounds){
      const prior=next.rounds[r.id]||{first:false,writing:''};
      if(r.first&&!prior.first)parts.push(firstText(r.first));
      const s=sig(r.writing),has=Object.values(r.writing).some(Boolean);
      if(s!==prior.writing&&(has||prior.writing)){
        const text=`第 ${r.id} 輪文字版本\n${writingText(r.writing)}`;
        parts.push(text);versions.push({round:r.id,text});
      }
      if(r.first||has||prior.writing)next.rounds[r.id]={first:!!r.first,writing:s};
    }
    parts.push(...d.journal.slice(next.journal).map(eventText));next.journal=d.journal.length;
    if(parts.length&&!next.started){parts.unshift(preamble());next.started=true;}
    return {text:parts.join('\n\n'),next,versions};
  }
  function fullText(){
    if(!d.journal.length&&!d.rounds.some(r=>r.first||Object.values(r.writing).some(Boolean)))return '';
    return [preamble(),...d.rounds.flatMap(r=>[r.first?firstText(r.first):`第 ${r.id} 輪尚未揭示／記錄`,...d.savedWritings.filter(v=>v.round===r.id).map(v=>v.text),`第 ${r.id} 輪目前文字\n${writingText(r.writing)}`]),...d.journal.map(eventText)].join('\n\n');
  }
  const labels={scenario:'保存情境',time:'保存時間',serving:'每份重量',response:'劑量反應'};
  root.innerHTML=`<section class="micro-risk-lab" aria-labelledby="${prefix}-title"><h2 id="${prefix}-title">算出菌量，還缺哪一步？</h2><p class="mr-scope">虛構情境 H*／F*／G* · 只練習推論，不判定食品安全</p>
  <nav class="mr-activities" aria-label="風險評估練習">${[['chain','接完風險鏈'],['compare','只改一件事'],['spread','分清兩種差異']].map(([v,t])=>`<button type="button" data-mr-activity="${v}">${t}</button>`).join('')}</nav>
  <div class="mr-workspace"><div class="mr-visual"><div class="mr-context"><strong>危害辨識</strong><span>H* 危害 · F* 食品 · G* 宿主</span></div><section class="mr-exposure"><h3>暴露評估 <span>保存 → 菌量 → 攝入量</span></h3><div class="mr-chart" tabindex="0" role="region" aria-label="菌量曲線，可左右捲動" data-mr-chart></div><div class="mr-quantities"><div><span>平均濃度 C</span><strong data-mr-C></strong><span>虛構細胞/g</span></div><span class="mr-times">× 份量 →</span><div><span>平均劑量 d</span><strong data-mr-d></strong><span>虛構細胞/份</span></div></div></section><div class="mr-response-branch"><strong>危害特性描述</strong><span data-mr-branch></span><span class="mr-join">與暴露量一起 → 風險結果</span></div></div>
  <div class="mr-controls"><div class="mr-control-grid"><label for="${prefix}-scenario">${labels.scenario}<select id="${prefix}-scenario" data-mr-scenario><option value="A">A · 題設 g = 4 h</option><option value="B">B · 題設 g = 2 h</option></select></label><label for="${prefix}-time">${labels.time} <output data-mr-time-label></output><input type="range" id="${prefix}-time" data-mr-time min="0" max="8" step="0.25"></label><label for="${prefix}-serving">${labels.serving}<select id="${prefix}-serving" data-mr-serving>${MICRO_RISK_CONFIG.servingGrams.map(m=>`<option value="${m}">${m} g</option>`).join('')}</select></label><label for="${prefix}-response">${labels.response}<select id="${prefix}-response" data-mr-response><option value="missing">尚未提供</option><option value="toy">套用題設感染模型</option></select></label></div><section class="mr-risk"><h3>風險特性描述</h3><span>本情境每份感染機率</span><strong data-mr-P></strong><p data-mr-status></p><span class="mr-unresolved">發病、嚴重度、全市場風險：未知</span></section></div></div>
  <section class="mr-task" data-mr-panel="chain"><p>先想一想：已有菌量與份量，目前還缺哪一段？</p><div class="mr-choice" role="group" aria-label="缺少的資料">${Object.entries(choices).map(([v,t])=>`<button type="button" data-mr-choice="${v}">${t}</button>`).join('')}</div><p data-mr-choice-note></p></section>
  <section class="mr-task" data-mr-panel="compare"><p>保留兩組條件，再看菌量、劑量與機率是否以相同比例改變。</p><div class="mr-compare-controls"><label for="${prefix}-left">左側紀錄<select id="${prefix}-left" data-mr-left></select></label><label for="${prefix}-right">右側紀錄<select id="${prefix}-right" data-mr-right></select></label><button type="button" data-mr-action="compare">比較兩組</button></div><div class="mr-comparison" data-mr-comparison></div></section>
  <section class="mr-task" data-mr-panel="spread"><div class="mr-choice" role="group" aria-label="差異的來源"><button type="button" data-mr-spread="variation">份量不同</button><button type="button" data-mr-spread="uncertainty">r 尚不確定</button></div><p data-mr-spread-note></p><div class="mr-table-wrap" role="region" aria-label="敏感度比較表，可左右捲動" tabindex="0" data-mr-table></div><button type="button" data-mr-action="average">假設四份量各占 1/4，比較平均</button><p data-mr-average></p></section>
  <div class="mr-actions"><button type="button" data-mr-action="record">保留這組</button><span data-mr-count></span><button type="button" data-mr-action="save">保存到本課筆記</button><button type="button" data-mr-action="new">新一輪</button></div><p class="mr-feedback" role="status" data-mr-feedback></p><p role="status" data-mr-save-status></p>
  <details data-mr-details="writing"><summary>寫下預測、觀察與修訂</summary><p>首次揭示或記錄時保留原預測；後續想法寫在修訂欄。新一輪保留舊紀錄。</p>${[['prediction','原預測'],['observation','觀察'],['revision','修訂']].map(([n,t])=>`<label for="${prefix}-${n}">${t}<textarea id="${prefix}-${n}" rows="2" maxlength="800" data-mr-${n}></textarea></label>`).join('')}<pre data-mr-first></pre></details>
  <details data-mr-details="model"><summary>公式、模型假設與適用性</summary><p>C=0.1×2^(t/g)，d=C×m；N~Poisson(d)。每顆細胞獨立、感染機率 r 固定時，P=1−exp(−rd)。d 是平均值，N 是實際整數細胞數，容許 N=0。</p><div class="mr-model-controls"><label for="${prefix}-r">題設 r<select id="${prefix}-r" data-mr-r>${MICRO_RISK_CONFIG.responseCandidates.map(r=>`<option value="${r}">${r}</option>`).join('')}</select></label><label for="${prefix}-assumption">改動適用假設<select id="${prefix}-assumption" data-mr-assumption><option value="supported">Poisson／G*／獨立細胞</option><option value="clustered">改成群聚劑量</option><option value="different-host">換成另一宿主群</option></select></label></div><ul>${SCOPE.modelAssumptions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><p>${esc(SCOPE.denominatorNote)}</p><p>未知 ≠ 0；感染機率 ≠ 發病或嚴重度。圖中四個部分是評估架構，不是四個依次發生的物理步驟。</p></details>
  <details data-mr-details="framework"><summary>四個部分，各回答什麼問題？</summary>${FRAMEWORK.map(s=>`<h3>${esc(s.title)}</h3><p>${esc(s.question)} ${esc(s.detail)}</p>`).join('')}</details>
  <details data-mr-details="sources"><summary>完整來源與逐項依據</summary><p>${esc(SCOPE.sourceAuthorityNote)}</p><ol>${SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-mr-source="${s.id}">${esc(s.title)}</a><p>${esc(s.locator)}</p><p>${esc(s.note)}</p></li>`).join('')}</ol>${CLAIMS.map(c=>`<details><summary>${esc(c.id)} · ${esc(c.claim)}</summary>${c.evidence.map(e=>`<p><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" data-mr-source="${esc(SOURCES.find(s=>s.url===e.url)?.id||e.url)}">${esc(e.title)}</a> · ${e.pdfPage?'PDF 第 '+e.pdfPage+' 頁／印刷 '+e.printedPage+' 頁 · ':''}${esc(e.section)} · ${esc(e.paragraphLocator)}</p>`).join('')}</details>`).join('')}</details>
  <details data-mr-details="history"><summary>已保留條件與操作紀錄</summary><p>本頁工作階段保留 24 組、16 輪及 128 項操作；滿額不覆寫。重新載入前請保存到筆記或複製摘要。</p><div data-mr-records></div><div data-mr-history></div></details>
  <details data-mr-details="summary"><summary>待保存內容與完整摘要</summary><label for="${prefix}-append">本次附加<textarea readonly id="${prefix}-append" rows="5" data-mr-append></textarea></label><label for="${prefix}-summary">完整摘要<textarea readonly id="${prefix}-summary" rows="7" data-mr-summary></textarea></label><button type="button" data-mr-action="copy">選取完整摘要</button></details></section>`;

  function drawSummary(){if(disposed)return;const p=appendPlan();field('append').value=p.text;field('summary').value=fullText();action('save').disabled=!p.text||!!slot.pending;field('save-status').textContent=slot.saveStatus;}
  function draw(){
    if(disposed)return;const r=evaluateMicroRisk(d.input),current=round();
    for(const [name,value] of Object.entries({scenario:d.input.scenario,time:d.input.timeHours,serving:d.input.servingGrams,response:d.input.response?'toy':'missing',r:d.input.response?.r??.002,assumption:!d.input.response||d.input.response.host==='G*'&&d.input.response.doseDistribution==='poisson'?'supported':d.input.response.host!=='G*'?'different-host':'clustered'}))field(name).value=String(value);
    field('r').disabled=field('assumption').disabled=!d.input.response;field('time-label').textContent=`${d.input.timeHours} h`;field('time').setAttribute('aria-valuetext',`${d.input.timeHours} 小時`);
    field('C').textContent=valueText(r.C);field('d').textContent=valueText(r.d);field('P').textContent=valueText(r.P,true);field('P').setAttribute('data-status',r.P.status);field('chart').innerHTML=growthChart(d.input,r);
    field('branch').textContent=d.input.response?`感染模型 · r = ${d.input.response.r}`:'感染模型：尚未提供';
    field('status').textContent=r.P.status==='KNOWN'?'暴露量與題設反應已接上；結果僅適用 H*／F*／G*。':r.P.status==='UNKNOWN'?'缺少適用的劑量反應，保留未知。':'改動超出這個模型的假設，無法沿用感染機率。';
    root.querySelectorAll('[data-mr-activity]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.mrActivity===d.activity)));
    root.querySelectorAll('[data-mr-panel]').forEach(n=>n.hidden=n.dataset.mrPanel!==d.activity);
    root.querySelectorAll('[data-mr-choice]').forEach(n=>{n.setAttribute('aria-pressed',String(n.dataset.mrChoice===current.choice));n.disabled=!!current.first;});
    root.querySelectorAll('[data-mr-spread]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.mrSpread===d.spread)));
    field('choice-note').textContent=current.first?'原判斷已保留，可在下方寫修訂或開始新一輪。':'也可以先在下方寫理由，再套用題設模型。';
    const options=d.snapshots.map(s=>`<option value="${s.id}">#${s.id} · ${s.input.scenario}／${s.input.timeHours} h／${s.input.servingGrams} g／${s.input.response?'r='+s.input.response.r:'反應未知'}</option>`).join('');
    for(const side of ['left','right']){field(side).innerHTML=options||'<option value="">先保留條件</option>';field(side).value=d.compare[side];}
    action('compare').disabled=d.snapshots.length<2||d.compare.left===d.compare.right;
    field('comparison').textContent=d.compare.text||'比較只使用已保留條件；調整目前控制不會改寫舊紀錄。';
    const rows=spreadRows();field('spread-note').textContent=d.spread==='variation'?SCOPE.variabilityNote:SCOPE.uncertaintyNote;
    field('table').innerHTML=`<table><thead><tr><th>${d.spread==='variation'?'每份重量':'候選 r'}</th><th>平均劑量 d</th><th>感染機率</th></tr></thead><tbody>${rows.map((v,i)=>`<tr><th>${d.spread==='variation'?v.input.servingGrams+' g':MICRO_RISK_CONFIG.responseCandidates[i]}</th><td>${valueText(v.result.d)}</td><td>${valueText(v.result.P,true)}</td></tr>`).join('')}</tbody></table>`;
    action('average').hidden=d.spread!=='variation';action('average').disabled=d.average;
    field('average').textContent=d.spread==='variation'&&d.average?spreadText().split('\n').at(-1):'未指定權重時，不報群體平均。';
    field('count').textContent=`${d.snapshots.length} / 24 組`;
    for(const name of ['prediction','observation','revision'])field(name).value=current.writing[name];field('prediction').readOnly=!!current.first;
    field('first').textContent=current.first?firstText(current.first):'尚未揭示或記錄。';
    field('records').innerHTML=d.snapshots.map(s=>`<pre>${esc(s.text)}</pre>`).join('');field('history').innerHTML=d.journal.map(e=>`<pre>${esc(eventText(e))}</pre>`).join('');
    field('feedback').textContent=feedback;drawSummary();
  }
  function handleControl(target){
    const key=Object.keys(labels).find(k=>target===field(k));
    if(!key&&target!==field('r')&&target!==field('assumption'))return;
    const next=clone(d.input),value=target.value;
    if(key==='scenario'){if(!['A','B'].includes(value))return draw();next.scenario=value;}
    if(key==='time'){const v=Number(value);if(value.trim()===''||!Number.isFinite(v)||v<0||v>8||Math.abs(v*4-Math.round(v*4))>1e-9)return draw();next.timeHours=v;}
    if(key==='serving'){const v=Number(value);if(!MICRO_RISK_CONFIG.servingGrams.includes(v))return draw();next.servingGrams=v;}
    if(key==='response'){
      if(!['missing','toy'].includes(value))return draw();
      if(value==='toy'&&!d.input.response){if(!room())return draw();freezeFirst('套用題設感染模型');next.response=createToyResponse();record('套用題設感染模型',`${inputText(next)}\n${resultText(evaluateMicroRisk(next))}`,true);}
      if(value==='missing')next.response=null;
    }
    if(target===field('r')){const v=Number(value);if(!next.response||!MICRO_RISK_CONFIG.responseCandidates.includes(v))return draw();next.response.r=v;}
    if(target===field('assumption')){if(!next.response||!['supported','clustered','different-host'].includes(value))return draw();next.response.doseDistribution=value==='clustered'?'clustered':'poisson';next.response.host=value==='different-host'?'G-other':'G*';}
    d.input=next;feedback='';if(!slot.pending)slot.saveStatus='';draw();
  }
  function onInput(event){
    if(disposed||!root.contains(event.target))return;
    const n=['prediction','observation','revision'].find(name=>event.target===field(name));
    if(n){if(n==='prediction'&&round().first){event.target.value=round().writing[n];return;}round().writing[n]=String(event.target.value).slice(0,800);if(!slot.pending)slot.saveStatus='';drawSummary();return;}
    if(event.target===field('time'))handleControl(event.target);
  }
  function onChange(event){
    if(disposed||!root.contains(event.target))return;
    for(const side of ['left','right'])if(event.target===field(side)){if(d.snapshots.some(s=>String(s.id)===event.target.value))d.compare[side]=event.target.value;d.compare.text='';return draw();}
    handleControl(event.target);
  }
  function onClick(event){
    if(disposed||!root.contains(event.target))return;const target=event.target.closest('button,a');if(!target||target.disabled)return;
    const data=target.dataset;
    if(data.mrActivity){d.activity=data.mrActivity;return draw();}
    if(data.mrSpread){d.spread=data.mrSpread;return draw();}
    if(data.mrChoice){if(!round().first)round().choice=data.mrChoice;return draw();}
    if(data.mrSource){if(!d.sources.includes(data.mrSource)){if(!room()){event.preventDefault?.();return draw();}freezeFirst('開啟來源');d.sources.push(data.mrSource);record('開啟來源',`${data.mrSource}（開啟不等於已讀）`);}return draw();}
    const name=data.mrAction;if(!name)return;
    feedback='';
    if(name==='record'){
      const snapshot={round:round().id,input:clone(d.input),result:evaluateMicroRisk(d.input),activity:d.activity,spread:d.spread,average:d.average,writing:clone(round().writing)};
      const key=sig(snapshot);
      if(d.snapshots.some(s=>s.key===key)){feedback='這組條件與文字已保留。';return draw();}
      if(d.snapshots.length>=24){feedback='已保留 24 組，不覆寫舊紀錄；後續文字仍可保存或複製。';return draw();}
      if(!room())return draw();freezeFirst('保留條件');const id=d.snapshots.length+1,text=`條件 #${id}\n${inputText(snapshot.input)}\n${resultText(snapshot.result)}${d.activity==='spread'?'\n'+spreadText():''}\n${writingText(snapshot.writing)}`;
      d.snapshots.push({...clone(snapshot),id,key,text});record('保留條件',text,snapshot.result.P.status==='KNOWN');
      if(!d.compare.left)d.compare.left=String(id);d.compare.right=String(id);feedback=`已保留條件 #${id}。`;
    }else if(name==='compare'){
      const left=d.snapshots.find(s=>String(s.id)===d.compare.left),right=d.snapshots.find(s=>String(s.id)===d.compare.right);if(!left||!right||left===right)return;
      if(!room())return draw();freezeFirst('比較兩組');const comparison=compareMicroRisk(left.input,right.input);
      const text=`#${left.id}：${inputText(left.input)}\n#${right.id}：${inputText(right.input)}\n${['C','d','P'].map(k=>`${k} 差值（右−左）：${k==='P'?pointsText(comparison[k].delta):valueText(comparison[k].delta)}；倍率（右÷左）：${valueText(comparison[k].ratio)}`).join('\n')}\n機率倍率未必等於菌量或劑量倍率。`;
      d.compare.text=text;if(!d.journal.some(e=>e.label==='比較兩組'&&e.text===text))record('比較兩組',text,comparison.P.delta.status==='KNOWN');
    }else if(name==='average'){
      if(d.spread!=='variation'||d.average)return;if(!room())return draw();freezeFirst('套用明示份量權重');d.average=true;record('四份量各占 1/4',spreadText(),!!d.input.response);
    }else if(name==='new'){
      if(d.rounds.length>=16){feedback='已保留 16 輪，不覆寫舊輪。';return draw();}if(!room())return draw();record('結束本輪',`${inputText(d.input)}\n${writingText(round().writing)}`);d.rounds.push(newRound(d.rounds.length+1));d.input.response=null;feedback='已開始新一輪，舊預測與紀錄仍保留。';
    }else if(name==='save'){
      const p=appendPlan();if(!p.text||typeof onSaveSummary!=='function'||slot.pending)return;
      if(p.text.length>10000){slot.saveStatus='尚未保存：本次超過 10,000 字元，內容完整保留，可複製摘要。';return drawSummary();}
      const token={};slot.pending=token;slot.saveStatus='正在保存；本次內容已固定，仍可繼續修訂。';drawSummary();
      const finish=(ok,error)=>{
        if(slot.pending!==token)return;
        slot.pending=null;
        if(ok===true){d.cursor=p.next;d.savedWritings.push(...p.versions);slot.saveStatus='已附加本次內容；重複按下不會重複加入。';}
        else slot.saveStatus=error?`尚未保存：${error?.message||'儲存失敗'}。待保存內容完整保留。`:'尚未保存：筆記容量上限為 10,000 字元；也請檢查儲存狀態。待保存內容完整保留。';
        slot.refresh?.();
      };
      try{const ok=onSaveSummary(p.text);if(ok&&typeof ok.then==='function')Promise.resolve(ok).then(value=>finish(value),error=>finish(false,error));else finish(ok);}catch(error){finish(false,error);}
      return;
    }else if(name==='copy'){field('summary').focus();field('summary').select();return;}
    draw();
  }
  function onToggle(event){
    if(disposed||!root.contains(event.target)||!event.target.dataset.mrDetails)return;
    const name=event.target.dataset.mrDetails;
    d.details=d.details.filter(v=>v!==name);if(event.target.open){d.details.push(name);if(name==='model'||name==='sources')freezeFirst('展開'+(name==='model'?'模型假設':'來源依據'));}
    drawSummary();field('first').textContent=round().first?firstText(round().first):'尚未揭示或記錄。';field('prediction').readOnly=!!round().first;root.querySelectorAll('[data-mr-choice]').forEach(n=>n.disabled=!!round().first);
  }
  root.querySelectorAll('[data-mr-details]').forEach(n=>n.open=d.details.includes(n.dataset.mrDetails));
  action('save').hidden=typeof onSaveSummary!=='function';
  root.addEventListener('click',onClick);root.addEventListener('input',onInput);root.addEventListener('change',onChange);root.addEventListener('toggle',onToggle,true);
  const dispose=()=>{if(disposed)return;disposed=true;root.removeEventListener('click',onClick);root.removeEventListener('input',onInput);root.removeEventListener('change',onChange);root.removeEventListener('toggle',onToggle,true);if(slot.dispose===dispose){slot.dispose=null;slot.refresh=null;}if(mounted.get(root)===dispose)mounted.delete(root);};
  slot.dispose=dispose;slot.refresh=drawSummary;mounted.set(root,dispose);draw();return dispose;
}
