// Local optional prerequisite links; no formal path, persistence or mastery flag.
const routes={light:'#learn/vitamins/vitamin-light/observe',temperature:'#learn/processing/processing-temperature/observe'};
const baseLight='#learn/vitamins/vitamin-light/understand',lightOxidation='#learn/vitamins/vitamin-light-oxidation/understand',baseTemperature='#learn/processing/processing-temperature/understand';
const descriptor=(token,branch,route,topicId,lessonId,target,index,expectedQuote,why)=>Object.freeze({token,diagnostic:token,subject:'chemistry',branch,route,canonicalRoute:route,topicId,lessonId,phase:'understand',field:target,target,index,paragraphIndex:index,quote:expectedQuote,expectedQuote,why,returnHref:routes[branch]});
export const LIGHT_TEMPERATURE_REMEDIES=Object.freeze([
 descriptor('light-exposure','light',baseLight,'vitamins','vitamin-light','explanation',2,'先定義受光條件','先核光源光譜、包材透光、照射強度與時間；同樣照度或包裝顏色不會自動給出相同的分子受光條件。'),
 descriptor('light-object','light',baseLight,'vitamins','vitamin-light','explanation',3,'先說量到哪一個物件','指定量到的是B₂、氧、下游產物或感官訊號，再用可比的起始量與方法作結論；不能把一個指標改稱整體品質或機制證明。'),
 descriptor('light-oxygen','light',lightOxidation,'vitamins','vitamin-light-oxidation','explanation',1,'阻氧影響後續氧氣進入','遮光與阻氧改變不同條件；阻隔後續進氧不等於去除起始溶氧。以題設對照分開判讀光進入與氧供應。'),
 descriptor('light-endpoint','light',lightOxidation,'vitamins','vitamin-light-oxidation','explanation',0,'其剩餘量不等於所有氧化反應的累積量','B₂既能參與光反應，也可能自身降解。先對應所測物件與反應支路，不能只用其剩餘量替代下游氧化或感知證據。'),
 descriptor('temperature-model','temperature',baseTemperature,'processing','processing-temperature','equation',null,'k = A exp(−E_a / RT)','先核絕對溫度、能量單位，以及A、Eₐ近似固定的適用區間；同一反應的相對k比較與不同反應的絕對快慢是不同問題。'),
 descriptor('temperature-parameter','temperature',baseTemperature,'processing','processing-temperature','explanation',2,'k 是指定速率式中的速率常數','先指出所擬合反應與速率式；k、Eₐ或相對k各自回答不同問題，不能只憑活化能或模型名稱排名所有反應。'),
 descriptor('temperature-endpoint','temperature',baseTemperature,'processing','processing-temperature','explanation',3,'同一溫度不等於同一熱歷程','溫度值不是時間歷程。要從瞬時速率常數走到指定終點，還需時間、起始狀態、反應級數及過程中條件。'),
 descriptor('temperature-transfer','temperature',baseTemperature,'processing','processing-temperature','explanation',3,'相對 k 的倍率也不是','先保留適用條件內可得的相對k結論，再分清反應量、保留率或產品指標需要的資料；條件改變時重新檢查原模型範圍。')
]);
const byToken=new Map(LIGHT_TEMPERATURE_REMEDIES.map(item=>[item.token,item]));
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link=(token,label)=>{const item=byToken.get(token);return item?'<a href="'+esc(item.route+'?ltprep='+item.token)+'">'+esc(label)+'</a>':'';};
const optional=items=>'<details><summary>需要時，只補這個判斷用到的前提</summary><ul>'+items.map(text=>'<li>'+text+'</li>').join('')+'</ul></details>';
export function lightTemperatureRemedyContext(hash,subject,lessonId,step){
 if(typeof hash!=='string'||hash.length>2048||subject!=='chemistry'||step!=='understand')return null;
 const mark=hash.indexOf('?');if(mark<0||hash.indexOf('?',mark+1)!==-1)return null;
 const canonical=hash.slice(0,mark),query=hash.slice(mark+1);if(/%(?![0-9a-f]{2})/i.test(query))return null;
 const params=new URLSearchParams(query),keys=[...params.keys()];if(keys.length!==1||keys[0]!=='ltprep')return null;
 const item=byToken.get(params.get('ltprep'));return item&&item.route===canonical&&item.lessonId===lessonId&&query==='ltprep='+item.token?item:null;
}
export function renderLightTemperatureRemedyPrompt(context){
 if(!LIGHT_TEMPERATURE_REMEDIES.includes(context))return '';
 const part=context.target==='equation'?'關鍵公式與條件':'原理說明第'+(context.index+1)+'段',branch=context.branch==='light'?'光照原題':'溫度原題';
 return '<aside class="study-remedy light-temperature-remedy" aria-label="光照與溫度判讀的具體補救" data-light-temperature-remedy="'+esc(context.token)+'"><p><strong>這次只補'+esc(part)+'：</strong>'+esc(context.why)+'</p><p>對照「'+esc(context.expectedQuote)+'」。說出條件與可支持的結論，再<a href="'+esc(context.returnHref)+'">回'+branch+'判斷</a>；讀過段落不表示已會新情境。</p></aside>';
}
const lightRemedies=()=>optional([
 link('light-exposure','受光條件與比較基準')+'、'+link('light-object','所測物件與終點')+'：先確定數據回答哪個問題。',
 link('light-oxygen','起始氧與後續進氧')+'、'+link('light-endpoint','B₂剩餘與下游變化')+'：用不同證據各自支持對應結論。'
]);
const temperatureRemedies=()=>optional([
 link('temperature-model','Arrhenius公式與單位')+'、'+link('temperature-parameter','參數及指定速率式')+'：先核對同一反應與模型區間。',
 link('temperature-endpoint','溫度與完整熱歷程')+'、'+link('temperature-transfer','相對k與反應終點')+'：再決定目前能算或能比較的量。'
]);
const flows={
 'vitamin-light':{
  understand:()=>'<p>先把光照、氧與溫度各自的角色說清楚，再用指定量測形成條件式結論。已熟悉前提者可直接<a href="'+routes.light+'">進原題的可選紀錄判讀</a>；需要時只補對應段落。</p>'+lightRemedies(),
  observe:()=>'<p>原乳品短案例保留在下方。可選任務先保留你的理由，再選示範或補充資料；比較受光條件與所測物件，不靠包裝名稱作答。要追查B₂、氧與下游指標，可另進<a href="#learn/vitamins/vitamin-light-oxidation/observe">既有光氧化證據活動</a>，沿用它自己的來源與條件。</p>'+lightRemedies(),
  check:()=>'<p>原單選確認遮光能力與這項問題相關；要組織光譜、氧、基質與量測證據的短答，可<a href="'+routes.light+'">回原題的新條件判讀</a>，分開初答、支援後修訂與獨立遷移。</p>'+lightRemedies()
 },
 'processing-temperature':{
  understand:()=>'<p>先決定是哪一個反應、速率式與溫度區間，再讀相對k或終點。已熟悉公式前提者可直接<a href="'+routes.temperature+'">進原題的可選條件判讀</a>，不用重做整章基礎。</p>'+temperatureRemedies(),
  observe:()=>'<p>原相對速率工具仍在下方，繼續按它的固定參數與參考條件使用。可選任務另練：哪些資料可支持相對k、跨反應比較或終點判斷；新紀錄不替原工具產生另一條實測曲線。</p>'+temperatureRemedies(),
  check:()=>'<p>原題確認25°C應用298.15K；這個單位換算與從模型走到產品條件的短答是不同練習。要判讀新資料，<a href="'+routes.temperature+'">回原題的可選任務</a>，先寫可支持結論，再指出仍缺的資料。</p>'+temperatureRemedies()
 }
};
export function renderLightTemperatureFlow(lessonId,step){if(!Object.hasOwn(flows,lessonId)||!Object.hasOwn(flows[lessonId],step))return '';return '<aside class="study-remedy light-temperature-flow" aria-label="光照與溫度問題的可跳補救與返回" data-light-temperature-flow="'+esc(lessonId+':'+step)+'">'+flows[lessonId][step]()+'</aside>';}
