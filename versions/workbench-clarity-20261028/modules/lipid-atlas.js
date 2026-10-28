import {escapeHTML as esc} from './storage.js';
import {LIPID_CARDS,LIPID_REACTIONS,LIPID_ATLAS_SOURCES} from './lipid-atlas-data.js';

const drafts=new WeakMap();
const views=[['classes','脂質家族'],['fatty-acids','常見脂肪酸'],['flavor','味道從哪裡來'],['reactions','常見反應']];
let sequence=0;
const byId=(items,id)=>items.find(item=>item.id===id);
const safeURL=url=>/^https:\/\//.test(url||'')?url:'';
const pairFor=group=>{const items=group?LIPID_CARDS.filter(card=>card.group===group):LIPID_CARDS;return [items[0]?.id,items[1]?.id||items[0]?.id];};
function draft(owner,key,startView){
  const fresh=()=>({view:views.some(([key])=>key===startView)?startView:'classes',pairs:{classes:pairFor('classes'),'fatty-acids':pairFor('fatty-acids'),flavor:pairFor()},reaction:LIPID_REACTIONS[0]?.id,observation:'',saved:new Set(),save:null,noteOpen:false,sourcesOpen:false});
  if(owner&&(typeof owner==='object'||typeof owner==='function')){if(!drafts.has(owner))drafts.set(owner,new Map());const entries=drafts.get(owner);if(!entries.has(key))entries.set(key,fresh());return entries.get(key);}
  return fresh();
}

export function mountLipidAtlas(container,id='lipid-atlas',{startView='classes',onSaveSummary,draftOwner,stateKey=id,currentLessonId=null}={}){
  const state=draft(draftOwner,stateKey,startView),prefix=`lipid-atlas-${++sequence}`;
  // A learner can edit the saved lesson note while this view is unmounted.
  // Retain the comparison draft, but never treat an earlier save as readback.
  state.saved=new Set();state.save=null;
  let alive=true,saving=false;
  const selectedCards=()=>state.view==='reactions'?[]:state.pairs[state.view].map(key=>byId(LIPID_CARDS,key)).filter(Boolean);
  const reaction=()=>byId(LIPID_REACTIONS,state.reaction);
  const sources=()=>{
    const ids=new Set(state.view==='reactions'?reaction()?.sourceIds:selectedCards().flatMap(card=>card.sourceIds));
    return LIPID_ATLAS_SOURCES.filter(source=>ids.has(source.id));
  };
  const sourceMarkup=()=>sources().map(source=>`<li>${safeURL(source.url)?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`:esc(source.title)}</li>`).join('');
  container.innerHTML=`<section class="lipid-atlas" data-la-id="${esc(id)}" aria-labelledby="${prefix}-title">
    <header class="la-header"><p class="la-kicker">LIPID ATLAS · 脂質觀察冊</p><h2 id="${prefix}-title">從結構，找到性質與味道。</h2><p class="la-intro">選兩種脂質並排看，再追到反應會改變哪裡。</p></header>
    <div class="la-views" role="group" aria-label="脂質觀察主題">${views.map(([key,label])=>`<button type="button" data-la-view="${key}" aria-pressed="${state.view===key}">${label}</button>`).join('')}</div>
    <div data-la-content></div>
    <details class="la-notes" data-la-notes ${state.noteOpen?'open':''}><summary>留下自己的比較與觀察</summary>
      <label class="la-field" for="${prefix}-observation">我的觀察 <span class="la-muted">（選填）</span><textarea id="${prefix}-observation" data-la-observation rows="3" maxlength="2000" placeholder="例如：同樣是 18 個碳，雙鍵的位置與數量，會改變哪些性質？"></textarea></label>
      <label class="la-field" for="${prefix}-summary">目前比較摘要<textarea id="${prefix}-summary" data-la-summary rows="7" readonly></textarea></label>
      <div class="la-actions"><button type="button" data-la-action="select">選取摘要</button>${typeof onSaveSummary==='function'?'<button type="button" class="la-primary" data-la-action="save">附加到本課筆記</button>':''}</div>
      <p class="la-status" data-la-status role="status"></p><p class="la-muted">選擇與草稿在本次頁面開啟期間保留；重新整理前請保存或複製。參考資料與自己的觀察分開記錄。</p>
    </details>
    <details class="la-sources" data-la-sources ${state.sourcesOpen?'open':''}><summary>目前資料的來源與適用範圍</summary><ul data-la-source-list></ul><p class="la-muted">本頁是結構與食品性質的比較；實際食品還受混合比例、溫度、晶型、製程與儲存條件影響。相關反應只列代表例；未列出不表示此脂質不會反應。反應式不代表速率或實際產率。</p></details>
  </section>`;
  const $=selector=>container.querySelector(selector),content=$('[data-la-content]'),summary=$('[data-la-summary]'),status=$('[data-la-status]'),save=$('[data-la-action="save"]');
  const observation=$('[data-la-observation]');observation.value=state.observation;

  function summaryText(){
    const rows=[`脂質觀察冊｜${views.find(([key])=>key===state.view)?.[1]}`,`活動：${id}`,'','【所選參考資料】'];
    if(state.view==='reactions'){
      const item=reaction();if(item)rows.push(item.name,`條件：${item.trigger}`,`作用位置：${item.bond}`,`反應式：${item.equation}`,`產物與改變：${item.result}`,`感官影響：${item.flavor}`,`判讀範圍：${item.boundary}`);
    }else{
      selectedCards().forEach((card,index)=>rows.push(`${index===0?'A':'B'}｜${card.name} ${card.en}`,`標記：${card.notation}`,`結構：${card.structure}`,`性質：${card.property}`,`風味：${card.flavor}`,`食品例子：${card.foods}`,''));
      if(state.view==='flavor')rows.push('感官區分：味覺、揮發性香氣與口感分開看；TAG 本身與反應產生的揮發物不能視為同一個氣味來源。');
    }
    rows.push('','【我的觀察】',state.observation.trim()||'（尚未填寫）','','【來源】',...sources().map(source=>`${source.title} ${source.url}`));
    return rows.join('\n');
  }
  function refreshSummary(){
    summary.value=summaryText();
    if(save)save.disabled=saving||state.saved.has(summary.value);
    status.textContent=saving?'正在保存…':state.saved.has(summary.value)?'這份摘要已附加到本課筆記。':state.save?.text===summary.value?state.save.message:state.save?'目前內容已改變；這份摘要尚未保存。':'';
  }
  function cardMarkup(card,index){
    const links=card.reactionIds.map(key=>byId(LIPID_REACTIONS,key)).filter(Boolean);
    return `<article class="la-card" data-la-card="${esc(card.id)}"><header><span class="la-letter" aria-hidden="true">${index===0?'A':'B'}</span><div><h3>${esc(card.name)}</h3><p class="la-english">${esc(card.en)}</p></div></header>
      <figure class="la-structure"><figcaption>結構線索</figcaption><strong>${esc(card.notation||card.name)}</strong><p>${esc(card.structure)}</p></figure>
      <dl><dt>性質</dt><dd>${esc(card.property)}</dd><dt>${state.view==='flavor'?'味覺、氣味與口感':'風味線索'}</dt><dd>${esc(card.flavor)}</dd></dl>
      <details><summary>食品例子與相關反應</summary><p>${esc(card.foods)}</p><div class="la-reaction-links">${links.map(item=>`<button type="button" data-la-reaction="${esc(item.id)}">${esc(item.name)} →</button>`).join('')}</div></details>
    </article>`;
  }
  function renderComparison(){
    const group=state.view==='flavor'?null:state.view,items=group?LIPID_CARDS.filter(card=>card.group===group):LIPID_CARDS;
    const pair=selectedCards();
    const flavor=state.view==='flavor'?`<div class="la-senses" aria-label="三種感官線索"><div><strong>味覺</strong><span>入口後的味質</span></div><div><strong>香氣</strong><span>揮發物到達鼻腔</span></div><div><strong>口感</strong><span>潤滑、稠度與融化</span></div></div><p class="la-flavor-note">油脂的香，不全是脂質分子本身的味道。TAG 的低揮發性、游離脂肪酸的性質，以及氧化後的揮發物，要分開追。</p>`:'';
    content.innerHTML=`${flavor}<div class="la-selectors">${[0,1].map(index=>`<label class="la-field" for="${prefix}-card-${index}"><span>比較 ${index===0?'A':'B'}</span><select id="${prefix}-card-${index}" data-la-select="${index}">${items.map(card=>`<option value="${esc(card.id)}" ${card.id===state.pairs[state.view][index]?'selected':''}>${esc(card.name)}${card.notation?' · '+esc(card.notation):''}</option>`).join('')}</select></label>`).join('')}</div><div class="la-comparison">${pair.map(cardMarkup).join('')}</div>`;
  }
  function renderReaction(){
    const item=reaction();if(!item){content.textContent='目前沒有可顯示的反應。';return;}
    content.innerHTML=`<label class="la-field la-reaction-select" for="${prefix}-reaction">選一種變化<select id="${prefix}-reaction" data-la-select-reaction>${LIPID_REACTIONS.map(entry=>`<option value="${esc(entry.id)}" ${entry.id===item.id?'selected':''}>${esc(entry.name)}</option>`).join('')}</select></label>
      <article class="la-reaction"><h3>${esc(item.name)}</h3><ol class="la-reaction-flow"><li><span>01 · 發生條件</span><p>${esc(item.trigger)}</p></li><li><span>02 · 作用位置</span><p>${esc(item.bond)}</p></li><li><span>03 · 產物與改變</span><p>${esc(item.result)}</p></li></ol>
      <figure class="la-equation"><figcaption>${item.id==='physical-crystallization'?'相態變化示意（非化學反應）':'代表反應式'}</figcaption><p>${esc(item.equation)}</p></figure><div class="la-sensory-effect"><h4>食品的感官變化</h4><p>${esc(item.flavor)}</p></div><details><summary>判讀時還要注意</summary><p>${esc(item.boundary)}</p>${item.lessonId?(item.lessonId===currentLessonId?'<p>這項變化目前就在本課觀察中。</p>':`<p><a href="#learn/lipids/${encodeURIComponent(item.lessonId)}/observe">到相關課程繼續觀察 →</a></p>`):''}</details></article>`;
  }
  function render(){
    container.querySelectorAll('[data-la-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.laView===state.view)));
    if(state.view==='reactions')renderReaction();else renderComparison();
    $('[data-la-source-list]').innerHTML=sourceMarkup();refreshSummary();
  }
  function onChange(event){
    if(!alive)return;
    if(event.target.matches('[data-la-select]')){
      const index=Number(event.target.dataset.laSelect),value=event.target.value;
      if(!byId(LIPID_CARDS,value))return;
      state.pairs[state.view][index]=value;render();
      $(`[data-la-select="${index}"]`)?.focus();
    }else if(event.target.matches('[data-la-select-reaction]')){
      state.reaction=event.target.value;render();$('[data-la-select-reaction]')?.focus();
    }
  }
  async function onClick(event){
    if(!alive)return;const button=event.target.closest('button');if(!button||!container.contains(button))return;
    if(button.dataset.laView){state.view=button.dataset.laView;render();return;}
    if(button.dataset.laReaction){state.reaction=button.dataset.laReaction;state.view='reactions';render();$('[data-la-select-reaction]')?.focus();return;}
    if(button.dataset.laAction==='select'){summary.focus();summary.select();return;}
    if(button.dataset.laAction!=='save'||saving||typeof onSaveSummary!=='function')return;
    const text=summaryText();if(state.saved.has(text))return;saving=true;refreshSummary();
    let success=false;try{success=await onSaveSummary(text)===true;}catch{}
    if(!alive)return;
    if(success)state.saved.add(text);
    state.save={text,message:success?'已附加到本課筆記。':'尚未保存；輸入與摘要保留，可選取複製或重試。'};
    saving=false;if(alive)refreshSummary();
  }
  const onInput=()=>{if(!alive)return;state.observation=observation.value;refreshSummary();};
  const onNotesToggle=()=>{if(alive)state.noteOpen=$('[data-la-notes]').open;};
  const onSourcesToggle=()=>{if(alive)state.sourcesOpen=$('[data-la-sources]').open;};
  container.addEventListener('change',onChange);container.addEventListener('click',onClick);observation.addEventListener('input',onInput);
  $('[data-la-notes]').addEventListener('toggle',onNotesToggle);$('[data-la-sources]').addEventListener('toggle',onSourcesToggle);
  render();
  return ()=>{alive=false;container.removeEventListener('change',onChange);container.removeEventListener('click',onClick);observation.removeEventListener('input',onInput);$('[data-la-notes]')?.removeEventListener('toggle',onNotesToggle);$('[data-la-sources]')?.removeEventListener('toggle',onSourcesToggle);};
}
