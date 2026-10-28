import {escapeHTML as esc} from './storage.js';
import {QPCR_LAB_ID,QPCR_VERSION,QPCR_DEFAULTS,QPCR_MAX_CYCLE,QPCR_SIGNAL_CEILING,compareSignals,signalAt,standardCurve} from './qpcr-model.js';
import {QPCR_SOURCES} from './qpcr-data.js';
export {QPCR_LAB_ID} from './qpcr-model.js';
export {QPCR_SOURCES} from './qpcr-data.js';

const drafts=new WeakMap(),clone=value=>structuredClone(value),signature=value=>JSON.stringify(value);
const modes={signal:'循環與訊號',standard:'標準曲線',report:'判讀報告'};
const choices={screen:'增菌後目標 DNA 篩檢有訊號',quantity:'原食品每克有相同數目的目標拷貝',live:'原食品活菌數可直接由 Cq 得到',strain:'已證明與病人是同一來源菌株'};
const fmt=(v,n=3)=>Number.isFinite(v)?Number(v.toFixed(n)).toLocaleString('en-US',{maximumFractionDigits:n}):'無可用值';
const fresh=()=>({mode:'signal',raw:{...QPCR_DEFAULTS},writing:{reason:'',revision:''},choice:'',checked:null,first:null,records:[],seenModes:[],seenSources:[],details:{},savedVersions:[],saving:false,saveStatus:'',views:new Set(),cursor:{started:false,first:false,records:0,state:null}});
let sequence=0;
const cqText=c=>c.value!==null?fmt(c.value):c.status==='already-above-at-zero'?'第 0 循環已達閾值':'40 循環內未達閾值';
function checkedResult(mode,raw){if(mode==='report')return {ok:true,value:null};try{return {ok:true,value:mode==='standard'?standardCurve(raw):compareSignals(raw)};}catch(error){return {ok:false,error:error.message};}}
function currentState(d){return clone({mode:d.mode,raw:d.raw,writing:d.writing,choice:d.choice,checked:d.checked,seenModes:d.seenModes,seenSources:d.seenSources,details:Object.fromEntries(Object.entries(d.details).filter(([,open])=>open).sort(([a],[b])=>a.localeCompare(b))),result:checkedResult(d.mode,d.raw)});}
function stateText(s){
 const lines=[`畫面：${modes[s.mode]}`,`原始輸入：${Object.entries(s.raw).map(([k,v])=>`${k}=${v===''?'（空白）':v}`).join('；')}`];
 if(s.mode==='report')lines.push('原創報告個案：增菌液目標訊號 Cq=22；適用的陰性、陽性及抑制對照均通過方法準則，目標特異性與該法判讀條件也已成立；無培養確認或菌株比對。Cq=22不是通用陽性切點。');
 else if(s.result.ok){const v=s.result.value;if(s.mode==='standard')lines.push(`另一組獨立指定校準示例，不能套用到循環訊號頁。指定斜率 ${fmt(v.slope,8)} 循環/log₁₀；E=${fmt(v.efficiency*100)}%；Cq=${fmt(v.queryCq)} 反算 ${fmt(v.copies)} copies/reaction；${v.inRange?'指定標準範圍內':'外插'}${v.abovePhysicalEfficiency?'；表觀 E>100%，不可按此直接接受定量':''}${v.calibrationWithinCycleWindow?'':'；標準點超出指定 0–40 循環窗'}`);
  else lines.push(`指定模板 A=${fmt(v.copiesA)}、B=${fmt(v.copiesB)} copies/reaction；共同 E=${fmt(v.parameters.efficiency*100)}%；閾值=${fmt(v.parameters.threshold)} a.u.；Cq A=${cqText(v.cqA)}，B=${cqText(v.cqB)}；ΔCq(B−A)=${v.deltaCqBminusA===null?'不可計':fmt(v.deltaCqBminusA)}；由 ΔCq 算 A/B=${v.ratioAoverB===null?'不可計':fmt(v.ratioAoverB)}；所選循環=${fmt(v.parameters.cycle)}。`);
 }else lines.push(`輸入未通過：${s.result.error}；沒有把前一個有效結果當成目前結果。`);
 lines.push(`目前理由：${s.writing.reason||'未填'}`,`後續修訂：${s.writing.revision||'未填'}`,`報告選擇：${choices[s.choice]||'未選'}`,`已檢查：${s.checked?choices[s.checked.choice]+'；'+(s.checked.correct?'合宜':'需要修訂'):'尚未檢查'}`,`已顯示畫面：${s.seenModes.map(x=>modes[x]).join('、')||'無'}`,`曾開啟來源：${s.seenSources.join('、')||'無'}（開啟不等於讀懂）`,`目前展開：${Object.keys(s.details).filter(k=>s.details[k]).join('、')||'無'}`);
 return lines.join('\n');
}
const preamble=()=>`【qPCR：訊號、模板與判讀】${QPCR_VERSION}\n全部數字與曲線為原創指定參數示例，沒有實測資料、通用陽性界值或經驗證 LOD/LOQ。訊號 F(c)=10⁻⁶ N₀(1+E)^c a.u.；固定比例、基線已校正且 E 恆定。模板量為連續拷貝當量近似，未模擬低拷貝取樣隨機性。只表示理想指數關係，未模擬雜訊、抑制、背景與平台期；4 a.u. 是繪圖上界，不是實驗指數期界線。\nCq 的連續解不是單一儀器演算法。模板比需相同閾值、相同效率及相同比例常數；標準曲線量為每反應目標拷貝，不能自動換成原食品 CFU/g。圖與讀值進入畫面即顯示，首次保留不是盲測。\n${QPCR_SOURCES.map(s=>s.title+'\n'+s.url).join('\n')}`;
function incremental(d,snapshot){
 const parts=[];if(!d.cursor.started)parts.push(preamble());
 if(d.first&&!d.cursor.first)parts.push('首次保留（'+d.first.trigger+'）\n'+stateText(d.first.state));
 for(let i=d.cursor.records;i<d.records.length;i++)parts.push(`保留 ${i+1}（${d.records[i].trigger}）\n${stateText(d.records[i].state)}`);
 if(signature(snapshot)!==d.cursor.state)parts.push('目前狀態與修訂\n'+stateText(snapshot));
 return parts.join('\n\n');
}
function signalDiagram(v,prefix){
 const left=62,right=584,top=60,bottom=260,x=c=>left+(right-left)*c/QPCR_MAX_CYCLE,y=f=>bottom-(bottom-top)*f/QPCR_SIGNAL_CEILING;
 const curve=(n,klass)=>{const end=Math.min(QPCR_MAX_CYCLE,Math.log(QPCR_SIGNAL_CEILING/(n*1e-6))/Math.log1p(v.parameters.efficiency));if(end<0)return '';const points=Array.from({length:201},(_,i)=>{const c=end*i/200;return `${i?'L':'M'}${x(c)},${y(signalAt(n,v.parameters.efficiency,c))}`;});return `<path d="${points.join(' ')}" class="${klass}"/>`;};
 const marks=[['A',v.cqA,'qa'],['B',v.cqB,'qb']].filter(([,c])=>c.value!==null).map(([name,c,klass])=>`<circle cx="${x(c.value)}" cy="${y(v.parameters.threshold)}" r="5" class="${klass}-point"/>`).join('');
 return `<svg viewBox="0 0 610 354" role="img" aria-label="原創理想訊號對循環曲線，A ${cqText(v.cqA)}，B ${cqText(v.cqB)}。超出4 a.u.的曲線不顯示；不是平台期。"><defs><clipPath id="${prefix}"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs>${[0,1,2,3,4].map(f=>`<path class="qp-grid" d="M${left},${y(f)}H${right}"/><text x="${left-9}" y="${y(f)+5}" text-anchor="end">${f}</text>`).join('')}<text x="${left}" y="42">訊號（a.u.）</text><path class="qp-axis" d="M${left},${top}V${bottom}H${right}"/>${[0,10,20,30,40].map(c=>`<text x="${x(c)}" y="${bottom+25}" text-anchor="middle">${c}</text>`).join('')}<text x="${right}" y="338" text-anchor="end">循環</text><g clip-path="url(#${prefix})">${curve(v.copiesA,'qa')}${curve(v.copiesB,'qb')}<path class="qp-threshold" d="M${left},${y(v.parameters.threshold)}H${right}"/><path class="qp-cursor" d="M${x(v.parameters.cycle)},${top}V${bottom}"/></g>${marks}</svg>`;
}
function standardDiagram(v,prefix){
 const left=62,right=584,top=60,bottom=260,x=q=>left+(right-left)*q/6,y=c=>bottom-(bottom-top)*c/50;
 const points=v.standards.map(p=>`<circle cx="${x(p.logCopies)}" cy="${y(p.cq)}" r="5" class="qa-point"/>`).join('');
 const query=v.logCopies>=0&&v.logCopies<=6?`<circle cx="${x(v.logCopies)}" cy="${y(v.queryCq)}" r="7" class="qb-point"/>`:'';
 // Restrict the illustrative line to the five specified standard levels.
 return `<svg viewBox="0 0 610 354" role="img" aria-label="指定標準曲線，五個原創計算點，沒有實測變異；待反算Cq ${fmt(v.queryCq)}，${v.inRange?'範圍內':'外插'}。"><text x="${left}" y="42">Cq（循環）</text>${[0,10,20,30,40,50].map(c=>`<path class="qp-grid" d="M${left},${y(c)}H${right}"/><text x="${left-9}" y="${y(c)+5}" text-anchor="end">${c}</text>`).join('')}<path class="qp-axis" d="M${left},${top}V${bottom}H${right}"/>${[0,1,2,3,4,5,6].map(q=>`<text x="${x(q)}" y="${bottom+25}" text-anchor="middle">${q}</text>`).join('')}<defs><clipPath id="${prefix}-standard"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs><g clip-path="url(#${prefix}-standard)"><path class="qa" d="M${x(1)},${y(v.standards[0].cq)}L${x(5)},${y(v.standards[4].cq)}"/>${points}${query}</g><text x="${right}" y="338" text-anchor="end">log₁₀ [N₀ / (1 copy/reaction)]</text></svg>`;
}

export function mountQpcrLab(root,id=QPCR_LAB_ID,{draftOwner,draftKey=id,onSaveSummary}={}){
 if(!root||typeof root.querySelector!=='function')throw new TypeError('A DOM container is required');if(id!==QPCR_LAB_ID)throw new RangeError('Unknown qPCR activity');
 const owned=draftOwner&&(typeof draftOwner==='object'||typeof draftOwner==='function');if(owned&&!drafts.has(draftOwner))drafts.set(draftOwner,new Map());
 const bag=owned?drafts.get(draftOwner):null;if(bag&&!bag.has(draftKey))bag.set(draftKey,fresh());const d=bag?bag.get(draftKey):fresh();
 const prefix='qpcr-'+(++sequence),field=name=>root.querySelector(`[data-qp-${name}]`),action=name=>root.querySelector(`[data-qp-action="${name}"]`);
 let disposed=false,status=d.saveStatus;
 const input=(name,label,min,max,step)=>`<label>${label}<input data-qp-input="${name}" type="text" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${esc(d.raw[name])}"></label>`;
 root.innerHTML=`<section class="qpcr-lab"><header class="qp-head"><p class="qp-eyebrow">PCR 的定量訊號</p><h3>同一個 Cq，能回答什麼？</h3><p>調整模板與效率，觀察跨過閾值的時點。</p></header><nav class="qp-tabs" aria-label="qPCR 觀察步驟">${Object.entries(modes).map(([key,label])=>`<button type="button" data-qp-mode="${key}" aria-pressed="false">${label}</button>`).join('')}</nav>
 <section data-qp-panel="signal"><div class="qp-chart" data-qp-signal-chart></div><div class="qp-legend"><span class="qa-label">A 模板</span><span class="qb-label">B 模板</span><span>虛線：閾值</span></div><dl class="qp-results" data-qp-signal-results></dl><div class="qp-controls">${input('logA','A 模板量（log₁₀ copies / 反應）',0,6,.1)}${input('logB','B 模板量（log₁₀ copies / 反應）',0,6,.1)}${input('efficiency','共同效率（% / 循環）',20,100,5)}${input('threshold','共同閾值（a.u.）',.2,2,.1)}</div><label class="qp-cycle">觀察循環 <output data-qp-cycle-label></output><input data-qp-input="cycle" type="range" aria-label="觀察循環" min="0" max="40" step="0.1" value="${esc(d.raw.cycle)}"></label><p data-qp-selected></p><p class="qp-bound">原創指定參數；理想指數關係。超出 4 a.u. 停止畫線，不表示平台期。</p></section>
 <section data-qp-panel="standard" hidden><div class="qp-chart" data-qp-standard-chart></div><dl class="qp-results" data-qp-standard-results></dl><div class="qp-controls">${input('slope','指定斜率 b（循環 / log₁₀）',-10,-1,'any')}${input('intercept','指定截距 a（循環）',20,50,.5)}${input('queryCq','待反算 Cq（循環）',0,50,.1)}</div><p data-qp-standard-note></p><p class="qp-bound">另一組獨立指定校準示例，不能把這條線套回前頁訊號。五點由直線計算，沒有實測變異。</p></section>
 <section data-qp-panel="report" hidden><div class="qp-report-flow" aria-label="食品、增菌、核酸萃取、qPCR、再確認"><span>食品</span><b>→</b><span>增菌液</span><b>→</b><span>DNA</span><b>→</b><span>qPCR</span></div><h4>這份報告支持哪個主張？</h4><p>原創假設個案：增菌液目標訊號 Cq＝22，適用的陰性、陽性及抑制對照均通過該方法的驗證準則，目標特異性與該法判讀條件也已成立；尚無培養確認或菌株比對。</p><fieldset class="qp-choices"><legend>選擇目前可支持的結論</legend>${Object.entries(choices).map(([key,label])=>`<label><input type="radio" name="${prefix}-report" value="${key}" data-qp-choice>${label}</label>`).join('')}</fieldset><button type="button" data-qp-action="check">檢查這個主張</button><p data-qp-feedback role="status"></p><details data-qp-detail="report-bound"><summary>為什麼仍需分層判讀？</summary><p>此例 Cq＝22 不是通用陽性切點。合格方法的目標訊號支持增菌後核酸篩檢；增菌、萃取體積、回收率與基質效應會破壞從反應直接回推原食品的捷徑。活菌培養、菌株關聯及污染來源各需不同證據。</p><p><a href="#micro/micro-measurement/micro-pcr-control-evidence/observe">查看 PCR 對照</a> · <a href="#micro/micro-measurement/micro-outbreak-evidence/observe">查看菌株與來源證據</a></p></details></section>
 <p data-qp-error role="status"></p><div class="qp-actions"><button type="button" data-qp-action="record">保留此刻</button><span data-qp-record-count></span></div>
 <details data-qp-detail="writing"><summary>寫下理由與後續修訂</summary><label>目前理由（可留空）<textarea data-qp-writing="reason" rows="3"></textarea></label><label>後續修訂（可留空）<textarea data-qp-writing="revision" rows="3"></textarea></label><p>返課可繼續目前草稿；重新載入前，請將要保留的內容附加至本課筆記。</p></details>
 <details data-qp-detail="history"><summary>回看保留內容</summary><h4>首次保留</h4><pre data-qp-first></pre><div data-qp-records></div><h4>已附加版本</h4><div data-qp-saved></div></details>
 <details data-qp-detail="model"><summary>公式與模型邊界</summary><p>F(c)＝k N₀(1＋E)ᶜ，k＝10⁻⁶ a.u./copy。E＝1 表示每循環增加 100%，即乘以 2。Cq＝ln[F閾值/(k N₀)] / ln(1＋E)。本課的連續解方便比較，不代表儀器的全部訊號演算法。</p><p>ΔCq 定義為 B−A；同閾值、同 E、同 k 時，N₀,A/N₀,B＝(1＋E)^ΔCq。改變共同閾值會移動兩個 Cq；只要假設保持，模板比不變。</p><p>標準曲線 Cq＝a＋b log₁₀[N₀/(1 copy/reaction)]，E＝10^(−1/b)−1。E＞100% 的表觀值提示需查核方法、抑制、稀釋或計算，不能解釋成每個模板真的多於倍增。沒有重複試驗、基質與範圍驗證，不能報方法不確定度、LOD 或 LOQ。</p><p>起始模板量採連續拷貝當量近似；不模擬低拷貝取樣的隨機性，1 copy 當量不表示每管必含一個分子。基線已校正、訊號與產物比例固定、效率恆定都是指定假設。此處未模擬真實 S 型曲線、雜訊、抑制、平台期、檢出機率與融解曲線。第 0 循環已高於閾值與 40 循環內未達閾值，均不強行給有效 Cq。</p></details>
 <details data-qp-detail="sources"><summary>來源與官方題目連結</summary>${QPCR_SOURCES.map(s=>`<article><a data-qp-source="${esc(s.id)}" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><p>${esc(s.locator)}。${esc(s.note)}</p></article>`).join('')}<p>MIQE 2.0 效率段落的斜率方向文字與公式有疑義；本課直接按公式核算，保留來源歧義，不把該句當成判準。</p></details>
 <details data-qp-detail="preview"><summary>本次將附加的新增內容</summary><textarea data-qp-preview readonly rows="8" aria-label="本次新增摘要"></textarea></details><div class="qp-save"><button type="button" data-qp-action="save">附加至本課筆記</button><span data-qp-status role="status"></span></div></section>`;
 function rememberMode(){if(!d.seenModes.includes(d.mode))d.seenModes.push(d.mode);}
 function snapshot(trigger){const item={trigger,state:currentState(d)};if(!d.first)d.first=clone(item);return clone(item);}
 function repaintSummary(){const s=currentState(d);field('preview').value=incremental(d,s);action('save').disabled=d.saving||typeof onSaveSummary!=='function'||!field('preview').value;field('status').textContent=status;}
 function repaint(){
  if(disposed)return;rememberMode();
  root.querySelectorAll('[data-qp-panel]').forEach(el=>el.hidden=el.dataset.qpPanel!==d.mode);root.querySelectorAll('[data-qp-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.qpMode===d.mode)));
  const r=checkedResult(d.mode,d.raw);field('error').textContent=d.mode==='report'?'':r.ok?'':r.error;action('record').disabled=d.records.length>=24;
  if(d.mode==='signal'){
   if(r.ok){const v=r.value;field('signal-chart').innerHTML=signalDiagram(v,prefix);field('signal-results').innerHTML=[['Cq A',cqText(v.cqA)],['Cq B',cqText(v.cqB)],['模板比 A/B',v.ratioAoverB===null?'不可由 Cq 比較':fmt(v.ratioAoverB)+' 倍']].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');field('cycle-label').textContent=fmt(v.parameters.cycle,1);field('selected').textContent=`循環 ${fmt(v.parameters.cycle,1)}：A ${fmt(v.signalA,4)}、B ${fmt(v.signalB,4)} a.u.${Math.max(v.signalA,v.signalB)>QPCR_SIGNAL_CEILING?'（超出圖界；這是理想式讀值，不是實測訊號）':''}。`;
   }else{field('signal-chart').innerHTML='';field('signal-results').innerHTML='';field('selected').textContent='請修正輸入；目前沒有可用的曲線或結果。';field('cycle-label').textContent=d.raw.cycle;}
  }
  if(d.mode==='standard'){
   if(r.ok){const v=r.value;field('standard-chart').innerHTML=standardDiagram(v,prefix);field('standard-results').innerHTML=[['表觀效率',fmt(v.efficiency*100)+'%'],['模型反算',fmt(v.copies)+' copies/reaction'],['指定範圍',v.inRange?'10–100,000 內':'範圍外：外插']].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');field('standard-note').textContent=v.abovePhysicalEfficiency?'表觀效率超過 100%；數值可供檢查，但不能據此接受定量。':!v.calibrationWithinCycleWindow?'有指定標準點落在 0–40 循環窗外；需重新檢查設定。':v.inRange?'內插仍需合格對照、相同方法與樣本適用性；此處只有指定模型。':'可以算出外插值，但不代表該區間已驗證，不能作為可接受定量。';
   }else{field('standard-chart').innerHTML='';field('standard-results').innerHTML='';field('standard-note').textContent='請修正輸入；目前沒有可用的反算結果。';}
  }
  field('feedback').textContent=d.checked?(d.checked.correct?'這個層次合宜：可報增菌液目標 DNA 篩檢訊號；仍需依方法確認。':'主張跨得太遠：目前只支持增菌後目標 DNA 篩檢訊號。CFU、原食品拷貝量與來源各缺不同證據。'):'';action('check').disabled=!d.choice;
  field('record-count').textContent=`${d.records.length} / 24 次`;field('first').textContent=d.first?stateText(d.first.state):'尚未保留；圖與讀值已顯示，不把此階段當作盲測。';field('records').innerHTML=d.records.map((r,i)=>`<details><summary>保留 ${i+1} · ${esc(r.trigger)}</summary><pre>${esc(stateText(r.state))}</pre></details>`).join('');field('saved').innerHTML=d.savedVersions.map((v,i)=>`<details><summary>已附加版本 ${i+1}</summary><pre>${esc(v)}</pre></details>`).join('');repaintSummary();
 }
 root.querySelectorAll('[data-qp-input]').forEach(el=>{el.value=d.raw[el.dataset.qpInput];el.oninput=()=>{if(disposed)return;d.raw[el.dataset.qpInput]=el.value;status='';repaint();};});
 root.querySelectorAll('[data-qp-mode]').forEach(el=>el.onclick=()=>{if(disposed)return;d.mode=el.dataset.qpMode;status='';repaint();});
 root.querySelectorAll('[data-qp-writing]').forEach(el=>{el.value=d.writing[el.dataset.qpWriting];el.oninput=()=>{if(disposed)return;d.writing[el.dataset.qpWriting]=el.value;status='';repaintSummary();};});
 root.querySelectorAll('[data-qp-choice]').forEach(el=>{el.checked=el.value===d.choice;el.onchange=()=>{if(disposed)return;d.choice=el.value;d.checked=null;status='';repaint();};});
 root.querySelectorAll('[data-qp-detail]').forEach(el=>{const key=el.dataset.qpDetail;el.open=!!d.details[key];el.ontoggle=()=>{if(disposed)return;d.details[key]=el.open;repaintSummary();};});
 root.querySelectorAll('[data-qp-source]').forEach(el=>el.onclick=()=>{if(disposed)return;const id=el.dataset.qpSource;if(!d.seenSources.includes(id))d.seenSources.push(id);repaintSummary();});
 action('record').onclick=()=>{if(disposed||d.records.length>=24)return;d.records.push(snapshot('主動保留'));status='已保留此刻；尚未附加至筆記。';repaint();};
 action('check').onclick=()=>{if(disposed||!d.choice)return;if(d.records.length>=24){status='已保留 24 次；仍可複製新增摘要。重新載入會清空未保存的工作台草稿。';repaintSummary();return;}const item=snapshot('檢查前的報告判斷');d.records.push(item);d.checked={choice:d.choice,correct:d.choice==='screen'};status='';repaint();};
 action('save').onclick=async()=>{
  if(disposed||d.saving||typeof onSaveSummary!=='function')return;const current=currentState(d),payload=incremental(d,current);if(!payload)return;if(payload.length>10000){status='本次新增內容超過 10,000 字；全文仍可選取複製，尚未保存。';repaintSummary();return;}
  const ack={started:true,first:!!d.first,records:d.records.length,state:signature(current)};d.saving=true;d.saveStatus=status='正在保存…';for(const view of d.views)view();
  try{const result=await onSaveSummary(payload);if(result===true){d.cursor=ack;d.savedVersions.push(payload);status='已附加至本課筆記。';}else status='尚未保存；新增內容仍可重試或複製。';}catch(error){status='保存未完成：'+(error?.message||String(error));}
  finally{d.saving=false;d.saveStatus=status;for(const view of d.views)view();}
 };
 const sharedView=()=>{status=d.saveStatus;repaint();};d.views.add(sharedView);repaint();return ()=>{if(disposed)return;disposed=true;d.views.delete(sharedView);root.querySelectorAll('[data-qp-input],[data-qp-writing],[data-qp-mode],[data-qp-choice],[data-qp-detail],[data-qp-source],[data-qp-action]').forEach(el=>{el.oninput=null;el.onclick=null;el.onchange=null;el.ontoggle=null;});};
}
