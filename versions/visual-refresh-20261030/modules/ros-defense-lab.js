import {escapeHTML as esc} from './storage.js';
import {
  ROS_DEFENSE_ID, ROS_DEFENSE_VERSION, ROS_DEFENSE_DEFAULTS, ROS_DEFENSE_REACTIONS,
  createRosState, rosAvailability, applyRosReaction, rosReadings,
} from './ros-defense-model.js';
import {ROS_DEFENSE_DATA_SHA256, validateRosDefenseDataset} from './ros-defense-source.js';
import {rosNumber as num, rosReactionNetwork, rosOutcome} from './ros-defense-diagrams.js';
export {ROS_DEFENSE_ID} from './ros-defense-model.js';

const owners = new WeakMap(), mounts = new WeakMap();
const clone = value => structuredClone(value), signature = value => JSON.stringify(value);
const REACTIONS = ['sod', 'catalase', 'nadh-peroxidase'];
const FIELDS = ['superoxideUmol', 'peroxideUmol', 'nadhUmol'];
const WRITING = ['prediction', 'observation', 'revision'];
const LABELS = {superoxideUmol:'超氧 O₂•−', peroxideUmol:'H₂O₂', nadhUmol:'NADH'};
const PANELS = {writing:'我的初判、觀察與修訂', mechanism:'反應式與計量界線', evidence:'研究中的清除與存活', sources:'完整來源', records:'保留紀錄', summary:'保存與完整摘要'};
const CAPS = {runs:64, history:96, records:64, sourceEvents:128, note:10000};
const configKey = c => FIELDS.map(k => c[k]).join('/');
const emptyWriting = () => ({prediction:'', observation:'', revision:''});
const fresh = () => ({config:{...ROS_DEFENSE_DEFAULTS}, runs:[], active:{}, currentRunId:null, records:[], sourceEvents:[], details:[], seen:{actions:[], disclosures:[], sources:[]}, savedWritings:[], cursor:{started:false, runs:{}, records:0, sources:0}});
const words = value => Array.isArray(value) ? value.map(words).join('；') : value && typeof value === 'object' ? Object.entries(value).map(([k,v])=>`${k}：${words(v)}`).join('；') : String(value ?? '');
const remember = (array, value) => {if (!array.includes(value)) array.push(value);};
const configText = c => `起始超氧 ${num(c.superoxideUmol)}、H₂O₂ ${num(c.peroxideUmol)}、NADH ${num(c.nadhUmol)} µmol（原創教學初值）`;
const stateText = s => `超氧 ${num(s.superoxideUmol)}；H₂O₂ ${num(s.peroxideUmol)}；累計生成 O₂ ${num(s.oxygenUmol)}、H₂O ${num(s.waterUmol)}；NADH ${num(s.nadhUmol)}、NAD⁺ ${num(s.nadOxUmol)}；外部 H⁺ 累計使用 ${num(s.protonsConsumedUmol)}（均為 µmol）。`;
const writingText = w => `初判：${w.prediction || '未填'}\n觀察：${w.observation || '未填'}\n修訂：${w.revision || '未填'}`;
const preamble = `【ROS 酵素反應工作台】${ROS_DEFENSE_VERSION}\n手動計量、µmol 原創初值；不是時間、速率或菌體實測。H₂O₂ 是非自由基 ROS，O₂ 只列為本式產物；不推細胞存活或食品安全。O₂/H₂O 欄位是累計生成量，初值 0 不表示無溶氧或無水。H⁺ 由外部緩衝庫提供，未計 pH；未點步驟不代表真實溶液無自發歧化。三酵素聯網是教學組合，非同一菌株三酵素實測。`;
let serial = 0;
async function defaultLoad(signal) {
  const response = await fetch(new URL('../data/ros-defense-evidence.json', import.meta.url), {signal});
  if (!response.ok) throw new Error('ROS sources unavailable');
  return response.json();
}

export function mountRosDefenseLab(root, id = ROS_DEFENSE_ID, {draftOwner, draftKey = id, onSaveSummary, loadData = defaultLoad} = {}) {
  if (!root?.querySelector || !root?.addEventListener) throw new TypeError('A DOM container is required');
  if (id !== ROS_DEFENSE_ID) throw new RangeError('Unknown ROS activity');
  mounts.get(root)?.();
  let slot;
  if (draftOwner && typeof draftOwner === 'object') {
    if (!owners.has(draftOwner)) owners.set(draftOwner, new Map());
    const entries = owners.get(draftOwner), key = String(draftKey);
    if (!entries.has(key)) entries.set(key, {data:fresh()});
    slot = entries.get(key); slot.dispose?.();
  } else slot = {data:fresh()};
  const d = slot.data, prefix = `ros-defense-${++serial}`;
  const field = name => root.querySelector(`[data-ros-${name}]`);
  const attr = (name,value) => root.querySelector(`[data-ros-${name}="${value}"]`);
  const action = name => attr('action',name);
  let data = null, identity = '', disposed = false, epoch = 0, abort = null, feedback = '', loadStatus = 'loading';
  slot.saveStatus ??= '';
  const current = () => d.runs.find(r => r.id === d.currentRunId) || null;
  const activeKey = (c = d.config) => `${identity}|${configKey(c)}`;
  const canOperate = () => !!data && current()?.source.identity === identity;
  function sourceSnapshot() {
    return {identity, version:data.version, sha256:ROS_DEFENSE_DATA_SHA256, title:data.title, sources:clone(data.sources)};
  }
  function createRun(force = false) {
    const previous = d.runs.find(r => r.id === d.active[activeKey()]);
    if (!force && previous) {d.currentRunId = previous.id; return previous;}
    if (d.runs.length >= CAPS.runs) {feedback = `已保留 ${CAPS.runs} 輪；請保存或複製，舊輪不會覆寫。`; return null;}
    const state = createRosState(d.config);
    const run = {id:d.runs.length + 1, config:clone(d.config), initial:state, state, readings:rosReadings(state), source:sourceSnapshot(), writing:emptyWriting(), first:null, history:[]};
    d.runs.push(run); d.active[activeKey()] = run.id; d.currentRunId = run.id; return run;
  }
  function freezeFirst(trigger) {
    const r = current();
    if (!r.first) r.first = clone({runId:r.id, trigger, config:r.config, initial:r.initial, writing:r.writing, source:r.source, seen:d.seen});
  }
  const sourceText = s => `來源版本 ${s.version}；SHA-256 ${s.sha256}\n${s.sources.map(v=>`${v.title}｜${v.url}｜${words(v.locator)}`).join('\n')}`;
  const firstText = f => `第 ${f.runId} 輪首次紀錄前（${f.trigger}）\n${configText(f.config)}\n${stateText(f.initial)}\n${writingText(f.writing)}\n來源版本 ${f.source.version}；SHA-256 ${f.source.sha256}\n此前已操作：${f.seen.actions.join('、') || '無'}；曾展開：${f.seen.disclosures.join('、') || '無'}；開啟來源：${f.seen.sources.join('、') || '無'}。圖與反應式已可見；開啟不表示已讀，不宣稱盲測。`;
  const eventText = e => `操作 ${e.sequence}｜${e.reactionId}｜${e.status === 'applied' ? '已執行' : '未執行'}｜反應程度 ${num(e.extentUmol)} µmol\n${e.message}\n之前：${stateText(e.before)}\n之後：${stateText(e.after)}`;
  const recordText = (r,i) => `觀察 ${i + 1}｜第 ${r.runId} 輪，操作至 ${r.actionIndex}\n${stateText(r.state)}\n${writingText(r.writing)}\n來源版本 ${r.source.version}；SHA-256 ${r.source.sha256}`;
  const sourceEventText = e => `開啟來源（不表示已讀）：${e.title}\n${e.url}\n來源版本 ${e.version}；第 ${e.runId} 輪`;
  const hasWriting = r => Object.values(r.writing).some(Boolean);
  const used = r => !!r.first || !!r.history.length || hasWriting(r) || !!d.cursor.runs[r.id];
  function appendPlan() {
    const next = clone(d.cursor), parts = [], snapshots = [];
    for (const r of d.runs) {
      if (!used(r)) continue;
      const old = next.runs[r.id] || {history:0, first:false, writing:''};
      if (!next.runs[r.id]) parts.push(`第 ${r.id} 輪｜${configText(r.config)}\n${sourceText(r.source)}`);
      if (r.first && !old.first) parts.push(firstText(r.first));
      parts.push(...r.history.slice(old.history).map(eventText));
      const version = signature(r.writing);
      if (version !== old.writing && (hasWriting(r) || old.writing)) {
        parts.push(`第 ${r.id} 輪文字版本（${r.history.length} 次操作後）\n${writingText(r.writing)}`);
        snapshots.push({runId:r.id, actionIndex:r.history.length, writing:clone(r.writing)});
      }
      next.runs[r.id] = {history:r.history.length, first:!!r.first, writing:version};
    }
    parts.push(...d.records.slice(next.records).map((r,i)=>recordText(r,next.records+i)));
    parts.push(...d.sourceEvents.slice(next.sources).map(sourceEventText));
    next.records = d.records.length; next.sources = d.sourceEvents.length;
    if (parts.length && !next.started) {parts.unshift(preamble); next.started = true;}
    return {text:parts.join('\n\n'), next, snapshots};
  }
  function fullText() {
    const runs = d.runs.filter(used);
    if (!runs.length && !d.records.length && !d.sourceEvents.length) return '';
    return [preamble, ...runs.flatMap(r=>[
      `第 ${r.id} 輪｜${configText(r.config)}\n${sourceText(r.source)}`,
      r.first ? firstText(r.first) : '尚未反應或記錄；目前文字是草稿。',
      ...r.history.map(eventText),
      ...d.savedWritings.filter(v=>v.runId===r.id).map(v=>`已保存文字（${v.actionIndex} 次操作後）\n${writingText(v.writing)}`),
      `目前状态：${stateText(r.state)}\n${writingText(r.writing)}`,
    ]), ...d.records.map(recordText), ...d.sourceEvents.map(sourceEventText)].join('\n\n');
  }
  function sourceList(sources) {
    return `<ol class="ros-source-list">${sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" data-ros-source="${esc(s.id)}">${esc(s.title)} ↗</a><p>${esc(words(s.locator))}</p><p class="ros-caption">${esc(s.publisher)} · ${esc(s.note)}</p></li>`).join('')}</ol>`;
  }
  function empiricalMarkup(e) {
    const c = e.conditions;
    return `<h3>${esc(e.title)}</h3><p>${esc(words(c.strains))}；${esc(words(c.peroxideConcentrationsMmolL))} mmol/L H₂O₂；${esc(words(c.durationHours))} 小時，${esc(words(c.temperatureC))}°C；葡萄糖 ${esc(words(c.glucoseMmolL))} mmol/L。</p><p>重複：${esc(words(c.replicateCount))}；${esc(words(c.spread))}；${esc(words(c.independence))}</p>
      ${e.measures.map(m=>`<p><strong>${esc(m.label)}</strong>：${esc(m.unit)}；${esc(m.denominator)}</p>`).join('')}
      ${e.observations.map(o=>`<article><h3>${esc(words(o.strains))}</h3><p>H₂O₂ 清除：${esc(o.scavenging)}</p><p>活菌數：${esc(o.viableCount)}</p><p>${esc(o.interpretation)}</p></article>`).join('')}
      ${e.enzymeObservations.map(o=>`<p><strong>${esc(o.enzyme)}</strong>：${esc(o.observation)} ${esc(o.limit)}</p>`).join('')}
      <ul>${e.cautions.map(v=>`<li>${esc(v)}</li>`).join('')}</ul><p class="ros-caption">定位：${esc(words(e.locator))}。沒有重建圖中數值或菌體存活曲線。</p>`;
  }
  root.innerHTML = `<section class="ros-defense-lab" aria-labelledby="${prefix}-title" data-ros-ready="loading">
    <h2 id="${prefix}-title" class="ros-sr-only">清掉超氧，活性氧就消失了嗎？</h2>
    <p class="ros-caption">沿反應圖試一次，留意 H₂O₂ 與 NADH。</p><p role="status" data-ros-load-status>正在核對來源…</p><button type="button" data-ros-action="retry" hidden>重試載入</button>
    <div class="ros-controls">${FIELDS.map(k=>`<label for="${prefix}-${k}">起始 ${LABELS[k]} <span class="ros-caption">µmol</span><select id="${prefix}-${k}" data-ros-field="${k}" disabled>${Array.from({length:25},(_,n)=>`<option value="${n}">${n}</option>`).join('')}</select></label>`).join('')}</div>
    <div class="ros-context"><p>目前量 <strong>µmol</strong> · 手動計量</p><label class="ros-run-label" for="${prefix}-run">本輪<select id="${prefix}-run" data-ros-run disabled></select></label></div>
    <div data-ros-diagram></div><p class="ros-result" data-ros-result></p><p class="ros-boundary">清除量不能判定存活；H⁺ 由外部緩衝庫供應。</p>
    <div class="ros-actions"><button type="button" class="ros-primary" data-ros-action="record" disabled>記下這次觀察</button><button type="button" data-ros-action="new" disabled>新一輪</button><span data-ros-count></span></div><p role="status" data-ros-feedback></p>
    <details data-ros-details="writing"><summary>我的初判、觀察與修訂</summary><p class="ros-caption" data-ros-writing-context></p><label for="${prefix}-prediction">先預測：SOD 做完後，還剩什麼？<textarea id="${prefix}-prediction" data-ros-prediction rows="2" disabled></textarea></label><label for="${prefix}-observation">觀察<textarea id="${prefix}-observation" data-ros-observation rows="2" disabled></textarea></label><label for="${prefix}-revision">我如何修訂解釋？<textarea id="${prefix}-revision" data-ros-revision rows="2" disabled></textarea></label><pre class="ros-preserved" data-ros-first></pre></details>
    <details data-ros-details="mechanism"><summary>反應式與計量界線</summary><div data-ros-equations></div><dl class="ros-checks" data-ros-checks></dl><div data-ros-limits></div></details>
    <details data-ros-details="evidence"><summary>研究中的清除與存活</summary><div data-ros-evidence></div></details>
    <details data-ros-details="sources"><summary>完整來源</summary><div data-ros-sources></div></details>
    <details data-ros-details="records"><summary>保留紀錄（<span data-ros-total>0</span>）</summary><p>各組初值有自己的輪次；新一輪保留舊輪。最多 ${CAPS.runs} 輪、每輪 ${CAPS.history} 次操作及 ${CAPS.records} 份觀察，滿額不覆寫。</p><div data-ros-records></div><div data-ros-history></div></details>
    <details data-ros-details="summary"><summary>保存到筆記／完整摘要</summary><p>只附加新操作、觀察與文字版本；保存失敗不截斷。</p><label for="${prefix}-append">本次要附加<textarea id="${prefix}-append" rows="6" readonly data-ros-append></textarea></label><button type="button" data-ros-action="save">附加到本課筆記</button><p role="status" data-ros-save-status></p><label for="${prefix}-summary">完整摘要<textarea id="${prefix}-summary" rows="8" readonly data-ros-summary></textarea></label><button type="button" data-ros-action="copy">選取完整摘要</button></details>
  </section>`;
  action('save').hidden = typeof onSaveSummary !== 'function';
  for (const node of root.querySelectorAll('[data-ros-details]')) node.open = d.details.includes(node.dataset.rosDetails);
  function drawSummary() {
    if (disposed) return;
    const plan = appendPlan(); field('append').value = plan.text; field('summary').value = fullText();
    action('save').disabled = !plan.text;
    field('save-status').textContent = slot.saveStatus || (plan.text ? '有新內容待保存。' : '目前沒有新的操作或文字可附加。');
  }
  function draw() {
    if (disposed) return;
    const r = current(), operable = canOperate();
    field('ready').setAttribute('data-ros-ready', loadStatus);
    for (const k of FIELDS) {attr('field',k).value = String(d.config[k]); attr('field',k).disabled = !data;}
    field('run').innerHTML = d.runs.map(v=>`<option value="${v.id}">第 ${v.id} 輪 · ${v.config.superoxideUmol}/${v.config.peroxideUmol}/${v.config.nadhUmol}${v.source.identity === identity ? '' : ' · 舊來源'}</option>`).join('');
    field('run').value = String(r?.id || ''); field('run').disabled = !d.runs.length;
    if (data && r) {
      const notes = Object.fromEntries(REACTIONS.map(k=>{
        if (!operable) return [k,'舊來源版本，僅供回看'];
        if (r.history.length >= CAPS.history) return [k,`本輪 ${CAPS.history} 次操作已滿；請保存或複製，再開新一輪`];
        const a = rosAvailability(r.state,k);
        return [k,a.available ? `本步反應程度 ${num(a.stepExtentUmol)} µmol` : `缺 ${a.missing.map(v=>v.label).join('、')}；可點選記下嘗試`];
      }));
      field('diagram').innerHTML = rosReactionNetwork({pools:r.state, stepNotes:notes, prefix, locked:!operable || r.history.length >= CAPS.history, lastReactionId:r.history.at(-1)?.reactionId});
      field('result').textContent = rosOutcome(r.state.superoxideUmol,r.state.peroxideUmol);
      const v = r.readings;
      field('checks').innerHTML = [
        ['累計生成 O₂',`${num(r.state.oxygenUmol)} µmol`],['累計生成 H₂O',`${num(r.state.waterUmol)} µmol`],
        ['所選小分子氧原子量',`${num(v.oxygenAtomUmol)} / 起始 ${num(v.initialOxygenAtomUmol)} µmol`],
        ['NADH + NAD⁺',`${num(v.nadPoolUmol)} / 起始 ${num(v.initialNadPoolUmol)} µmol`],
        ['NADH 已提供電子當量',`${num(v.electronDonatedUmol)} µmol`],['外部 H⁺ 累計使用',`${num(v.protonsConsumedUmol)} µmol`],
      ].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
    } else {field('diagram').innerHTML = ''; field('result').textContent = ''; field('checks').innerHTML = '';}
    action('record').disabled = !operable || d.records.length >= CAPS.records;
    action('new').disabled = !data || d.runs.length >= CAPS.runs;
    field('count').textContent = `已保留 ${d.records.length} 份觀察${d.records.length >= CAPS.records ? '（已滿；完整摘要仍可保存或複製）' : ''}${d.runs.length >= CAPS.runs ? `；${CAPS.runs} 輪已滿，舊輪仍可回看與複製` : ''}`;
    field('total').textContent = String(d.records.length);
    field('feedback').textContent = feedback;
    field('writing-context').textContent = r ? `第 ${r.id} 輪｜${configText(r.config)}${r.first ? '；初判已固定。' : '；首次反應或記錄前仍可修改初判。'}` : '來源核對完成後即可記錄。';
    for (const k of WRITING) {field(k).value = r?.writing[k] || ''; field(k).disabled = !r; field(k).readOnly = k === 'prediction' && !!r?.first;}
    field('first').textContent = r?.first ? firstText(r.first) : '尚未反應或記錄；图與反應方向已可見，不宣稱盲測。';
    field('records').innerHTML = d.records.length ? d.records.map((v,i)=>`<pre class="ros-preserved">${esc(recordText(v,i))}</pre>`).join('') : '<p>尚未記錄觀察。</p>';
    field('history').innerHTML = d.runs.filter(v=>v.history.length).map(v=>`<details><summary>第 ${v.id} 輪（${v.history.length} 次操作）</summary><pre class="ros-preserved">${esc(v.history.map(eventText).join('\n\n'))}</pre></details>`).join('');
    drawSummary();
  }
  function react(reactionId) {
    if (!canOperate() || !REACTIONS.includes(reactionId)) return;
    const r = current();
    if (r.history.length >= CAPS.history) {feedback = `已保留 ${CAPS.history} 次操作；請保存或另開新一輪。`; draw(); return;}
    const result = applyRosReaction(r.state,reactionId), last = r.history.at(-1);
    if (result.status === 'blocked' && last?.status === 'blocked' && last.reactionId === reactionId && signature(last.after) === signature(r.state)) {
      feedback = '這個缺項嘗試已保留，數量不變。'; draw(); attr('reaction',reactionId)?.focus(); return;
    }
    freezeFirst('第一次反應操作前');
    r.history.push(clone({sequence:r.history.length+1,reactionId,mode:result.mode,status:result.status,extentUmol:result.extentUmol,before:result.before,after:result.state,delta:result.delta,message:result.message}));
    r.state = result.state; r.readings = rosReadings(result.state); remember(d.seen.actions,reactionId);
    feedback = result.message; slot.saveStatus = ''; draw(); attr('reaction',reactionId)?.focus();
  }
  function record() {
    if (!canOperate() || d.records.length >= CAPS.records) return;
    const r = current(); freezeFirst('第一次記錄前');
    const value = clone({runId:r.id,actionIndex:r.history.length,state:r.state,writing:r.writing,source:r.source});
    if (d.records.some(v=>signature(v)===signature(value))) feedback = '這份狀態與文字已記錄。';
    else {d.records.push(value); feedback = `已保留第 ${d.records.length} 份觀察。`; slot.saveStatus = '';}
    draw();
  }
  function save() {
    if (typeof onSaveSummary !== 'function') return;
    const plan = appendPlan();
    if (!plan.text) {slot.saveStatus = '目前沒有新的操作或文字可附加。'; drawSummary(); return;}
    if (plan.text.length > CAPS.note) {slot.saveStatus = '本次內容超過 10,000 字元，尚未保存；完整摘要仍保留，可選取複製。'; drawSummary(); return;}
    try {
      const result = onSaveSummary(plan.text);
      if (result === true) {
        d.cursor = plan.next; d.savedWritings.push(...plan.snapshots); slot.saveStatus = '已附加本次新內容。';
      } else {
        if (result && typeof result.then === 'function') Promise.resolve(result).catch(()=>{});
        slot.saveStatus = '尚未保存：筆記介面須同步明確回傳 true；內容與待保存位置均保留。';
      }
    } catch (error) {slot.saveStatus = `尚未保存：${error instanceof Error ? error.message : '筆記介面失敗'}。全文與待保存位置均保留。`;}
    slot.refresh?.();
  }
  function onClick(event) {
    if (disposed) return;
    if (event.type === 'auxclick' && event.button !== 1) return;
    const source = event.target.closest?.('[data-ros-source]');
    if (source && root.contains(source) && data) {
      const s = data.sources.find(v=>v.id === source.dataset.rosSource); if (!s) return;
      if (!d.sourceEvents.some(v=>v.id === s.id && v.identity === identity)) {
        if (d.sourceEvents.length >= CAPS.sourceEvents) {event.preventDefault?.(); feedback = '來源開啟紀錄已滿，請先保存或複製。'; draw(); return;}
        d.sourceEvents.push({id:s.id,identity,title:s.title,url:s.url,version:data.version,runId:current()?.id || null});
        remember(d.seen.sources,`${data.version} / ${s.id}`); slot.saveStatus = ''; drawSummary();
      }
      return;
    }
    if (event.type === 'auxclick') return;
    const button = event.target.closest?.('button');
    if (!button || !root.contains(button) || button.disabled) return;
    if (button.dataset.rosReaction) {react(button.dataset.rosReaction); return;}
    switch (button.dataset.rosAction) {
      case 'record': record(); break;
      case 'new': if (data) {createRun(true); feedback = '已另開新一輪，舊輪仍可回看。'; slot.saveStatus = ''; draw();} break;
      case 'retry': load(); break;
      case 'save': save(); break;
      case 'copy': field('summary').focus(); field('summary').select(); break;
    }
  }
  function onChange(event) {
    if (disposed || !root.contains(event.target)) return;
    const node = event.target;
    if (node === field('run')) {
      const r = d.runs.find(v=>String(v.id)===node.value); if (!r) {draw(); return;}
      d.currentRunId = r.id; d.config = clone(r.config); if (r.source.identity === identity) d.active[activeKey()] = r.id;
      feedback = r.source.identity === identity ? '' : '這是舊來源版本；原始輪次與出處保留，僅供回看。'; draw(); return;
    }
    const name = node.dataset.rosField;
    if (!data || !FIELDS.includes(name)) return;
    try {
      if (!/^(?:0|[1-9]\d?)$/.test(node.value)) throw new Error('Invalid pool');
      const config = {...d.config,[name]:Number(node.value)}; createRosState(config);
      if (!d.active[activeKey(config)] && d.runs.length >= CAPS.runs) throw new Error('Round limit');
      d.config = config; createRun(); feedback = ''; slot.saveStatus = ''; draw();
    } catch {feedback = '保留上一組有效初值；每項需為 0–24 的整數，且輪次不可超過上限。'; draw();}
  }
  function onInput(event) {
    if (disposed || !root.contains(event.target) || !current()) return;
    const k = WRITING.find(name=>event.target === field(name)); if (!k) return;
    const r = current();
    if (k === 'prediction' && r.first) {field(k).value = r.writing[k]; return;}
    r.writing[k] = event.target.value; slot.saveStatus = ''; drawSummary();
  }
  function onToggle(event) {
    if (disposed || !root.contains(event.target)) return;
    const name = event.target.dataset.rosDetails; if (!Object.hasOwn(PANELS,name)) return;
    d.details = event.target.open ? [...new Set([...d.details,name])] : d.details.filter(v=>v!==name);
    if (event.target.open && data) remember(d.seen.disclosures,PANELS[name]);
  }
  async function load() {
    const token = ++epoch; abort?.abort(); abort = new AbortController(); data = null; loadStatus = 'loading';
    action('retry').hidden = true; field('load-status').textContent = '正在核對來源…'; draw();
    try {
      const raw = await loadData(abort.signal);
      if (disposed || token !== epoch) return;
      const checked = validateRosDefenseDataset(raw);
      data = checked; identity = `${checked.version}:${ROS_DEFENSE_DATA_SHA256}`; loadStatus = 'ready';
      const previous = current();
      if (!previous || previous.source.identity !== identity) {
        createRun();
        if (previous) feedback = '來源版本已更新；舊輪及原始出處保留，可從本輪選單回看。';
      }
      field('sources').innerHTML = sourceList(data.sources);
      field('equations').innerHTML = data.reactions.map(r=>`<article><h3>${esc(r.label)}</h3><p>${esc(r.equation)}</p><p>${esc(r.mechanism)}</p><p class="ros-caption">${esc(r.limit)}</p></article>`).join('');
      field('limits').innerHTML = `<p>O₂／H₂O 是累計生成量，初值 0 不表示沒有溶氧或溶劑水；氧原子帳只含選定小分子，不是整份溶液。</p><ul>${data.limits.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`;
      field('evidence').innerHTML = empiricalMarkup(data.empiricalEvidence);
      for (const name of d.details) remember(d.seen.disclosures,PANELS[name]);
      field('load-status').textContent = ''; draw();
    } catch {
      if (disposed || token !== epoch) return;
      data = null; loadStatus = 'error';
      field('load-status').textContent = '來源未能讀取或通過核對；既有文字與紀錄仍保留，可重試。';
      action('retry').hidden = false; draw();
    }
  }
  root.addEventListener('click',onClick); root.addEventListener('auxclick',onClick); root.addEventListener('change',onChange); root.addEventListener('input',onInput); root.addEventListener('toggle',onToggle,true);
  const dispose = () => {
    if (disposed) return; disposed = true; epoch++; abort?.abort();
    root.removeEventListener('click',onClick); root.removeEventListener('auxclick',onClick); root.removeEventListener('change',onChange); root.removeEventListener('input',onInput); root.removeEventListener('toggle',onToggle,true);
    if (slot.dispose === dispose) {slot.dispose = null; slot.refresh = null;}
    if (mounts.get(root) === dispose) mounts.delete(root);
  };
  slot.dispose = dispose; slot.refresh = drawSummary; mounts.set(root,dispose); draw(); load(); return dispose;
}
