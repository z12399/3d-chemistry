// Specific, optional remedies for the existing protein-hydrolysis lesson.
// These links do not create a path, assessment result, progress flag or note key.
export const PROTEIN_FUNCTION_REMEDIES=Object.freeze([
  {token:'protein-cut-count',diagnostic:'protein-cut-count',subject:'chemistry',lessonId:'protein-hydrolysis-balance',route:'#learn/proteins/protein-hydrolysis-balance/understand',canonicalRoute:'#learn/proteins/protein-hydrolysis-balance/understand',phase:'understand',field:'explanation',target:'explanation',index:1,paragraphIndex:1,quote:'切 k 個不同肽鍵，得到 k＋1 段',expectedQuote:'切 k 個不同肽鍵，得到 k＋1 段',why:'先在題設未交聯直鏈上數切點、耗水與片段；這是指定切割的結構帳，不是實驗水解度量測，也不給完整序列或功能表現。',reason:'The existing specified-chain counting paragraph separates bonds, residues and fragments.',returnHref:'#learn/proteins/protein-hydrolysis/observe'},
  {token:'protein-charge',diagnostic:'protein-charge',subject:'chemistry',lessonId:'protein-peptide-termini',route:'#learn/proteins/protein-peptide-termini/understand',canonicalRoute:'#learn/proteins/protein-peptide-termini/understand',phase:'understand',field:'explanation',target:'explanation',index:1,paragraphIndex:1,quote:'末端與側鏈的 pKa 會受鄰近基團和構形影響，不能照搬游離胺基酸的表值',expectedQuote:'末端與側鏈的 pKa 會受鄰近基團和構形影響，不能照搬游離胺基酸的表值',why:'新末端的實際電荷取決於題設pH與可解離位點；不要把多一個末端直接寫成所有條件都多一個固定整數電荷。',reason:'The original independent-site peptide example explicitly qualifies environmental pKa dependence.',returnHref:'#learn/proteins/protein-hydrolysis/observe'},
  {token:'protein-solubility',diagnostic:'protein-solubility',subject:'chemistry',lessonId:'protein-salt-ph',route:'#learn/proteins/protein-salt-ph/understand',canonicalRoute:'#learn/proteins/protein-salt-ph/understand',phase:'understand',field:'explanation',target:'explanation',index:0,paragraphIndex:0,quote:'偏離等電點可增加排斥，但實際溶解性還受構形與處理歷史影響',expectedQuote:'偏離等電點可增加排斥，但實際溶解性還受構形與處理歷史影響',why:'比較可溶比例先核對蛋白來源、pH、鹽與處理歷史。本課肉蛋白例只補條件與量測區分，不能直接借作另一水解物的功能數據。',reason:'The original salt/pH lesson separates charge, solubility and water holding under stated conditions.',returnHref:'#learn/proteins/protein-hydrolysis/observe'},
  {token:'protein-network',diagnostic:'protein-network',subject:'chemistry',lessonId:'protein-networks',route:'#learn/proteins/protein-networks/understand',canonicalRoute:'#learn/proteins/protein-networks/understand',phase:'understand',field:'explanation',target:'explanation',index:0,paragraphIndex:0,quote:'疏水作用、氫鍵、靜電作用及某些共價連接，皆可參與蛋白食品的結構',expectedQuote:'疏水作用、氫鍵、靜電作用及某些共價連接，皆可參與蛋白食品的結構',why:'凝膠或界面膜還涉及分子間作用與連續結構；可溶比例或鏈變短，不能單獨證明網路更強，也不等於只有二硫鍵在作用。',reason:'The existing mechanism paragraph lists multiple possible interactions without predicting a universal gel curve.',returnHref:'#learn/proteins/protein-hydrolysis/observe'},
  {token:'protein-nutrition',diagnostic:'protein-nutrition',subject:'chemistry',lessonId:'protein-alternative-quality',route:'#learn/proteins/protein-alternative-quality/understand',canonicalRoute:'#learn/proteins/protein-alternative-quality/understand',phase:'understand',field:'explanation',target:'explanation',index:1,paragraphIndex:1,quote:'體外 INFOGEST 或試劑套組的消化端點，與各必需胺基酸在體內迴腸的消化率不同',expectedQuote:'體外 INFOGEST 或試劑套組的消化端點，與各必需胺基酸在體內迴腸的消化率不同',why:'把加工功能與營養品質分開。即使另有體外消化結果，也須核對方法、胺基酸與分母，不能直接當人體利用或健康效果。',reason:'The original quality lesson qualifies composition ratios and the specific in-vitro versus ileal evidence boundary.',returnHref:'#learn/proteins/protein-hydrolysis/observe'}
  ,{token:'protein-dh',diagnostic:'protein-dh',subject:'chemistry',lessonId:'protein-hydrolysis',route:'#learn/proteins/protein-hydrolysis/understand',canonicalRoute:'#learn/proteins/protein-hydrolysis/understand',phase:'understand',field:'explanation',target:'explanation',index:2,paragraphIndex:2,quote:'水解度 DH 是已水解肽鍵數相對原肽鍵總數的百分比',expectedQuote:'水解度 DH 是已水解肽鍵數相對原肽鍵總數的百分比',why:'DH的分母是原肽鍵總數，不是產物段數、殘基數或可溶比例；量測推得DH時還須交代方法與原料基準。相同DH不能唯一還原切點及肽譜。',reason:'The approved current body defines the bond-based denominator and method boundary; counting fragments alone does not supply that definition.',returnHref:'#learn/proteins/protein-hydrolysis/observe'}
].map(item=>Object.freeze(item)));

const byToken=new Map(PROTEIN_FUNCTION_REMEDIES.map(item=>[item.token,item]));
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const remedyLink=(token,label)=>{const descriptor=byToken.get(token);return descriptor?'<a href="'+escapeHtml(descriptor.route+'?prep='+descriptor.token)+'">'+escapeHtml(label)+'</a>':'';};
const task='<a href="#learn/proteins/protein-hydrolysis/observe">回本題的功能推論任務</a>';
const optional=()=>'<details><summary>先試作答，卡在哪裡再補哪一段</summary><ul><li>'+remedyLink('protein-dh','DH的原肽鍵分母與量測前提')+'；要另數切點、耗水與片段，補'+remedyLink('protein-cut-count','指定直鏈的計數')+'。要辨認骨架切鍵，可另進<a href="#learn/proteins/protein-peptide-backbone/observe">原肽骨架活動</a>，再回本題。</li><li>'+remedyLink('protein-charge','末端電荷的條件')+'與'+remedyLink('protein-solubility','可溶比例的比較條件')+'，不是同一種量。</li><li>'+remedyLink('protein-network','網路可能靠哪些分子作用')+'；若把功能改善當營養改善，補'+remedyLink('protein-nutrition','營養證據的不同端點')+'。</li></ul></details>';

export function proteinFunctionRemedyContext(hash,subject,lessonId,step){
  if(typeof hash!=='string'||hash.length>2048||subject!=='chemistry'||step!=='understand')return null;
  const delimiter=hash.indexOf('?');
  if(delimiter<0||hash.indexOf('?',delimiter+1)!==-1)return null;
  const canonical=hash.slice(0,delimiter),query=hash.slice(delimiter+1);
  if(/%(?![0-9a-f]{2})/i.test(query))return null;
  const params=new URLSearchParams(query),keys=[...params.keys()];
  if(keys.length!==1||keys[0]!=='prep')return null;
  const descriptor=byToken.get(params.get('prep'));
  return descriptor&&descriptor.route===canonical&&descriptor.lessonId===lessonId?descriptor:null;
}

export function renderProteinFunctionRemedyPrompt(context){
  if(!PROTEIN_FUNCTION_REMEDIES.includes(context))return '';
  return '<aside class="study-remedy protein-function-remedy" aria-label="蛋白功能的具體補救" data-protein-function-remedy="'+escapeHtml(context.token)+'"><p><strong>這次只補原理說明第'+(context.index+1)+'段：</strong>'+escapeHtml(context.why)+'</p><p>對照「'+escapeHtml(context.expectedQuote)+'」。讀完能說明適用條件，再<a href="'+escapeHtml(context.returnHref)+'">回原題判斷</a>；讀過引文不等於已通過新的功能比較。</p></aside>';
}

const flow={
  understand:()=>'<p>先定這道題要改善哪個功能，再分切鍵比例、切割位置、片段與末端；最後才用指定條件下的功能量測判斷取捨。溶解、界面／網路、苦味與營養各有自己的證據。已有基礎可直接'+task+'，不用重讀整個蛋白章。</p>'+optional(),
  observe:()=>'<p>本頁可選任務用來檢查功能推論；熟悉者可直接作答，卡住再補具名段落。原短案例與「想好原因了，看解釋」仍供基本對照；閱讀示範後的回答不當作無提示表現。若要追實際切鍵，<a href="#learn/proteins/protein-peptide-backbone/observe">原肽骨架活動</a>另有結構題；若要分方法與可辨識資訊，<a href="#learn/proteins/protein-hydrolysis-conditions/observe">原水解分析活動</a>處理的是另一個問題。</p>'+optional(),
  check:()=>'<p>原單選只核對切肽鍵會改變鏈長與末端；答對這一題還不足以判定能比較不同加工目標的功能取捨。要檢查後一層，可'+task+'，先保留自己的判斷、條件及仍缺的證據，再核對與修訂。</p><p>不要由可溶比例直接推出網路更強，也不要由加工功能推出營養更好；分別需要時補'+remedyLink('protein-network','網路的作用機制')+'或'+remedyLink('protein-nutrition','營養證據界線')+'。</p>'
};
export function renderProteinFunctionFlow(lessonId,step){
  if(lessonId!=='protein-hydrolysis'||!Object.hasOwn(flow,step))return '';
  return '<aside class="study-remedy protein-function-flow" aria-label="蛋白水解的可跳補救與返回" data-protein-function-flow="'+escapeHtml(lessonId+':'+step)+'">'+flow[step]()+'</aside>';
}
