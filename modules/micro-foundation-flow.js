// Optional local prerequisite bridges. These do not create a path or mastery flag.
const dReturn='#micro/micro-identity/micro-spores/observe';
const cfuReturn='#micro/micro-growth/micro-growth-cycle/observe';
const dRoute='#micro/micro-control/micro-decimal-reduction/understand';
const cfuRoute='#micro/micro-measurement/micro-plate-count/understand';
const cfuBasisRoute='#micro/micro-measurement/micro-count-represented-sample/understand';
const descriptor=(token,branch,route,topicId,lessonId,index,expectedQuote,why)=>Object.freeze({token,diagnostic:token,subject:'microbiology',branch,route,canonicalRoute:route,topicId,lessonId,phase:'understand',field:'explanation',target:'explanation',index,paragraphIndex:index,quote:expectedQuote,expectedQuote,why,returnHref:branch==='d-value'?dReturn:cfuReturn});
export const MICRO_FOUNDATION_REMEDIES=Object.freeze([
 descriptor('d-log-scale','d-value',dRoute,'micro-control','micro-decimal-reduction',2,'等間隔的時間在 log₁₀ 縱軸','先確定縱軸是數量或log₁₀數量。每D按當時剩餘量再留十分之一；線性數量圖的下降量不會因此每段相同。'),
 descriptor('d-conditions','d-value',dRoute,'micro-control','micro-decimal-reduction',0,'固定溫度且存活曲線可用對數直線近似','D屬於指定微生物、基質、狀態和方法。跨研究或條件改變時，先查參數是否適用，不能只靠菌名或舊D比較同一製程中的存活。'),
 descriptor('d-expectation','d-value',dRoute,'micro-control','micro-decimal-reduction',3,'小於 1 的模型量不是','把模型族群量與單一個體、實際某份樣品的整數結果分開；先核起始量和基準，再解釋分數型期望量的意思。'),
 descriptor('d-nondetection','d-value',dRoute,'micro-control','micro-decimal-reduction',3,'未檢出也不等於實際為零','模型預測與實際測量是兩份證據。未檢出需帶受測份量、回收與檢出能力，不能拿它把小數期望量直接改成實際零或安全保證。'),
 descriptor('cfu-unit','cfu',cfuRoute,'micro-measurement','micro-plate-count',0,'一個可見菌落可能來自一個細胞','先定義培養可計數的菌落形成單位；細胞聚集可使一個CFU對應多個細胞，不能把報表數字直接改稱cell。'),
 descriptor('cfu-original-basis','cfu',cfuBasisRoute,'micro-measurement','micro-count-represented-sample',0,'以均質液的原樣等效濃度乘後續稀釋比例與記錄體積','只對題設已給定且有效的記錄換算。先把稀釋分率、受測體積與原樣品基準接起來，分清CFU/g、CFU/mL或題設相對單位；缺分母不能硬算。'),
 descriptor('cfu-recovery','cfu',cfuRoute,'micro-measurement','micro-plate-count',0,'某些仍有活性的細胞在選定方法下不形成菌落','可存活或仍有活性，與在指定方法下形成可見菌落不同。聚集、受傷、回收條件與不可培養狀態限制推論；不能只由CFU差異唯一判定死亡或增殖。'),
 descriptor('cfu-nondetection','cfu',cfuBasisRoute,'micro-measurement','micro-count-represented-sample',1,'1/M 是一個 CFU 的換算刻度','零觀察與真實濃度為零不同。一個菌落對應的報告刻度、經驗證檢出能力與統計上限是不同量，須依題設明定的報告規則作答。')
]);
const byToken=new Map(MICRO_FOUNDATION_REMEDIES.map(item=>[item.token,item]));
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link=(token,label)=>{const item=byToken.get(token);return item?'<a href="'+esc(item.route+'?microprep='+item.token)+'">'+esc(label)+'</a>':'';};
const optional=items=>'<details><summary>卡在哪個前提，只補對應段落</summary><ul>'+items.map(text=>'<li>'+text+'</li>').join('')+'</ul></details>';
export function microFoundationRemedyContext(hash,subject,lessonId,step){
 if(typeof hash!=='string'||hash.length>2048||subject!=='microbiology'||step!=='understand')return null;
 const mark=hash.indexOf('?');if(mark<0||hash.indexOf('?',mark+1)!==-1)return null;
 const canonical=hash.slice(0,mark),query=hash.slice(mark+1);if(/%(?![0-9a-f]{2})/i.test(query))return null;
 const params=new URLSearchParams(query),keys=[...params.keys()];if(keys.length!==1||keys[0]!=='microprep')return null;
 const item=byToken.get(params.get('microprep'));
 return item&&item.route===canonical&&item.lessonId===lessonId&&query==='microprep='+item.token?item:null;
}
export function renderMicroFoundationRemedyPrompt(context){
 if(!MICRO_FOUNDATION_REMEDIES.includes(context))return '';
 const branch=context.branch==='d-value'?'芽孢原題':'生長曲線原題';
 return '<aside class="study-remedy micro-foundation-remedy" aria-label="微生物前置概念的具體補救" data-micro-foundation-remedy="'+esc(context.token)+'"><p><strong>這次只補原理說明第'+(context.index+1)+'段：</strong>'+esc(context.why)+'</p><p>對照「'+esc(context.expectedQuote)+'」。讀後自行說明條件，再<a href="'+esc(context.returnHref)+'">回'+branch+'判斷</a>；開過段落不代表已完成遷移。</p></aside>';
}
const dRemedies=()=>optional([
 link('d-log-scale','數量圖與log下降')+'、'+link('d-conditions','D可用的條件')+'：先決定每個量的基準與模型適用性，再解釋曲線。',
 link('d-expectation','模型族群量與個別結果')+'、'+link('d-nondetection','未檢出需要的量測證據')+'：小於一、觀察到零與絕對不存在不能互換。'
]);
const cfuRemedies=()=>optional([
 link('cfu-unit','CFU與單細胞數')+'、'+link('cfu-recovery','在指定條件下的回收')+'：先說明量到什麼，再談族群或細胞行為。',
 link('cfu-original-basis','稀釋、受測體積與原樣品基準')+'、'+link('cfu-nondetection','零菌落及報告刻度')+'：先核分母與方法限定，再換算數字。'
]);
const flows={
 'micro-spores':{
  understand:()=>'<p>本題先分清內生孢子形成／萌發與後續細胞分裂；這個型態目標保留。若要讀下方D值比較，還需分'+link('d-log-scale','線性數量與log下降')+'。已能說出條件者，可直接<a href="'+dReturn+'">進原題觀察與可選判讀</a>。</p>'+dRemedies(),
  observe:()=>'<p>原芽孢活動仍在下方。可先用兩份不同條件的記錄練習：哪些數量能算、哪個D可借用、什麼仍需補證據；不要先由菌名或設備名稱決定結果。已掌握前提者可略過診斷，繼續原活動。</p>'+dRemedies(),
  check:()=>'<p>原單選確認典型形成與萌發沒有增加後代，不能據此判為已懂D值或已確效。要練不同條件，<a href="'+dReturn+'">回原題的可選判讀</a>；涉及實際設計、監測與查核的證據，可銜接<a href="#paths/thermal-evidence-chain">既有熱製程證據路徑</a>，不從模型量推出食品安全結論。</p>'+dRemedies()
 },
 'micro-growth-cycle':{
  understand:()=>'<p>先標縱軸量的是CFU、濁度或產物，再談族群趨勢。若CFU的單位與分母已熟悉，可直接<a href="'+cfuReturn+'">進原題觀察與新條件判讀</a>；卡住時只補下面對應段落，不必重讀整個微生物章。</p>'+cfuRemedies(),
  observe:()=>'<p>原來「CFU平臺但酸度改變」的短案例保留在下方。新任務先核有效記錄的原樣品基準，再看回收／零觀察能支持什麼。它是原創報表判讀，不是培養步驟；資料不足時說明缺哪一項，仍要寫出已知量。</p>'+cfuRemedies(),
  check:()=>'<p>原短答保留CFU趨勢、酸度與單細胞行為的區別。想驗不同量測條件，可<a href="'+cfuReturn+'">回原題的可選判讀</a>；先保留初答，再核對與修訂。若已看過示範，後續作答應如實視為支援後練習。</p>'+cfuRemedies()
 }
};
export function renderMicroFoundationFlow(lessonId,step){
 if(!Object.hasOwn(flows,lessonId)||!Object.hasOwn(flows[lessonId],step))return '';
 return '<aside class="study-remedy micro-foundation-flow" aria-label="微生物問題的可跳補救與返回" data-micro-foundation-flow="'+esc(lessonId+':'+step)+'">'+flows[lessonId][step]()+'</aside>';
}
