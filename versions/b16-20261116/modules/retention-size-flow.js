// Optional local transfer support. No new path, persistence or mastery flag.
const returns={retention:'#learn/vitamins/vitamin-true-retention/observe',size:'#learn/colloids/colloid-size-distribution/observe'};
const descriptor=(token,branch,route,topicId,lessonId,target,index,expectedQuote,why)=>Object.freeze({token,diagnostic:token,subject:'chemistry',branch,route,canonicalRoute:route,topicId,lessonId,phase:'understand',field:target,target,index,paragraphIndex:index,quote:expectedQuote,expectedQuote,why,returnHref:returns[branch]});
export const RETENTION_SIZE_REMEDIES=Object.freeze([
 descriptor('retention-total','retention','#learn/vitamins/vitamin-true-retention/understand','vitamins','vitamin-true-retention','equation',null,'指定食用範圍的真保留率','先以相同單位將各部分濃度乘份量得到總量，再依題設食用範圍形成分子；濃度比與同批總量比回答不同問題。'),
 descriptor('retention-analyte','retention','#learn/vitamins/vitamin-c-assay-identity/understand','vitamins','vitamin-c-assay-identity','explanation',0,'只測 AA 與先把 DHA 定量還原成 AA 再測','先確認測的是AA、含DHA的總C或其他定義，並核共同報告基準；分析物不同的前後數字不能直接放進同一保留率。'),
 descriptor('retention-boundary','retention','#learn/vitamins/vitamin-true-retention/understand','vitamins','vitamin-true-retention','explanation',2,'先區分這一餐的總量與原料來源的留存','同一餐的食用總量可以包含加入的配料；原料來源的留存則需要來源歸屬資料。先決定題目問哪一個帳，再選可用記錄。'),
 descriptor('retention-recovery','retention','#learn/processing/analysis-recovery-matrix/understand','processing','analysis-recovery-matrix','explanation',1,'外加葡萄糖不一定像原生葡萄糖一樣容易釋出','加標回收回答外加成分在指定設計中的表現，不能自動變成原生分析物的通用校正係數；先查配對、回收對象與適用範圍。'),
 descriptor('size-basis','size','#learn/colloids/colloid-size-distribution/understand','colloids','colloid-size-distribution','explanation',0,'不代表各有一半顆數','先說分率的分母是滴數、油滴體積或其他訊號；分母改變時需重新換算，不能保留另一基準下的平均值與面積。'),
 descriptor('size-metric','size','#learn/colloids/colloid-size-distribution/understand','colloids','colloid-size-distribution','explanation',2,'先核對尺寸的量測身分','分清幾何直徑、矩平均與由擴散資料得到的水動力半徑；量測對象和方法不同，數字不能只因單位相同就互換。'),
 descriptor('size-assumptions','size','#learn/colloids/colloid-size-distribution/understand','colloids','colloid-size-distribution','explanation',2,'同一母體的球滴幾何分布','要用球滴公式求界面，需有同一母體、相容的幾何尺寸與分布基準，並核油相體積；不能只拿任一平均尺寸代入。'),
 descriptor('size-interface','size','#learn/colloids/colloid-interface-area/understand','colloids','colloid-interface-area','explanation',1,'只是可用預算','指定Γ可把面積換成需求，可供分配的質量另列預算。帳面足夠與實際吸附、覆蓋及穩定性需要不同證據。')
]);
const byToken=new Map(RETENTION_SIZE_REMEDIES.map(item=>[item.token,item]));
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link=(token,label)=>{const item=byToken.get(token);return item?'<a href="'+esc(item.route+'?rsprep='+item.token)+'">'+esc(label)+'</a>':'';};
const optional=items=>'<details><summary>需要時只補這項判讀用到的前提</summary><ul>'+items.map(text=>'<li>'+text+'</li>').join('')+'</ul></details>';
export function retentionSizeRemedyContext(hash,subject,lessonId,step){
 if(typeof hash!=='string'||hash.length>2048||subject!=='chemistry'||step!=='understand')return null;
 const mark=hash.indexOf('?');if(mark<0||hash.indexOf('?',mark+1)!==-1)return null;
 const canonical=hash.slice(0,mark),query=hash.slice(mark+1);if(/%(?![0-9a-f]{2})/i.test(query))return null;
 const params=new URLSearchParams(query),keys=[...params.keys()];if(keys.length!==1||keys[0]!=='rsprep')return null;
 const item=byToken.get(params.get('rsprep'));return item&&item.route===canonical&&item.lessonId===lessonId&&query==='rsprep='+item.token?item:null;
}
export function renderRetentionSizeRemedyPrompt(context){
 if(!RETENTION_SIZE_REMEDIES.includes(context))return '';
 const part=context.target==='equation'?'關鍵公式與條件':'原理說明第'+(context.index+1)+'段',branch=context.branch==='retention'?'營養留存原題':'粒徑原題';
 return '<aside class="study-remedy retention-size-remedy" aria-label="留存與粒徑判讀的具體補救" data-retention-size-remedy="'+esc(context.token)+'"><p><strong>這次只補'+esc(part)+'：</strong>'+esc(context.why)+'</p><p>對照「'+esc(context.expectedQuote)+'」。核對這份記錄能回答哪個問題，再<a href="'+esc(context.returnHref)+'">回'+branch+'判斷</a>；讀過段落不等於已完成新情境。</p></aside>';
}
const retentionRemedies=()=>optional([
 link('retention-total','指定食用範圍的總量比')+'、'+link('retention-analyte','AA與總C的分析物身分')+'：先核相同對象及單位。',
 link('retention-boundary','這一餐與原料來源的帳')+'、'+link('retention-recovery','加標回收能檢查的範圍')+'：選好能支持本題的記錄，再做計算。'
]);
const sizeRemedies=()=>optional([
 link('size-basis','分率的分母')+'、'+link('size-metric','量測尺寸的身分')+'：先分清數字代表什麼。',
 link('size-assumptions','同一母體及球滴幾何前提')+'、'+link('size-interface','指定需求與實際吸附')+'：核對哪些量足以支持界面預算。'
]);
const flows={
 'vitamin-true-retention':{
  understand:()=>'<p>原課已把濃度、固體／湯汁與食用總量分開。新判讀再問：這份測量定義與來源範圍，能不能放進目前要算的帳？已熟悉前提者可直接<a href="'+returns.retention+'">進原題的可選取證任務</a>。</p>'+retentionRemedies(),
  observe:()=>'<p>原固體與湯汁工具保留在下方。可選任務使用另一組記錄，先選可用證據、保留自由初答，再核對分析物、回收或來源歸屬。原300g／180g示例仍有自己的示範與用途。</p>'+retentionRemedies(),
  check:()=>'<p>原題與短答已提供固體／湯汁的示範；讀過解析後，後續同例作答應視為支援後練習。要練不同分析物或來源範圍，可<a href="'+returns.retention+'">回可選取證任務</a>，分開未提示初答、檢查與修訂。</p>'+retentionRemedies()
 },
 'colloid-size-distribution':{
  understand:()=>'<p>原課已區分顆數／體積分率及d₃₂／d₄₃。要換一份量測記錄，還需確認尺寸身分、同一母體與幾何前提。已會者可直接<a href="'+returns.size+'">進原題的可選取證任務</a>。</p>'+sizeRemedies(),
  observe:()=>'<p>原工具仍由分布步驟開始，保留1／10µm的幾何示範。新任務改變已知記錄與方法條件，先決定何者可用，再說哪些界面量能得到；不把水動力尺寸直接當作油滴幾何直徑。</p>'+sizeRemedies(),
  check:()=>'<p>原單選與短答示範的是指定1／10µm分布；看過答案不等於完成另一種量測基準的遷移。可<a href="'+returns.size+'">回新記錄取證任務</a>，先寫獨立判斷，再選支援並保留修訂。</p>'+sizeRemedies()
 }
};
export function renderRetentionSizeFlow(lessonId,step){if(!Object.hasOwn(flows,lessonId)||!Object.hasOwn(flows[lessonId],step))return '';return '<aside class="study-remedy retention-size-flow" aria-label="留存與粒徑的可跳補救與返回" data-retention-size-flow="'+esc(lessonId+':'+step)+'">'+flows[lessonId][step]()+'</aside>';}
