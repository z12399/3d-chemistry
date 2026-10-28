import {escapeHTML as esc} from './storage.js';
import {LEARNING_SUBJECTS} from './learning-subjects.js';
import {LEARNING_PATHS,resolvePathStations} from './learning-paths-model.js';

// Navigation only: live identities, no answer, exposure, progress or storage writes.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const EXAM_START_ENTRIES=freeze([
 {id:'retention',subject:'chemistry',lessonId:'vitamin-true-retention',label:'營養留存與分析記錄',detailId:'retention-size-retention-details',detailLabel:'先選可比資料，再判總量、分母與來源',viewId:'faded',viewLabel:'獨立選資料與短答，再選自核',diagnosticId:'diagnostic',diagnosticLabel:'可跳過的先備診斷'},
 {id:'temperature',subject:'chemistry',lessonId:'processing-temperature',label:'溫度與完整歷程',detailId:'light-temperature-temperature-details',detailLabel:'從速率常數到完整熱史，再判斷能推出什麼',viewId:'faded',viewLabel:'先獨立短答，再選擇結構化自核',diagnosticId:'diagnostic',diagnosticLabel:'可跳過的先備診斷'}
]);
export const EXAM_START_PATH_CHOICES=freeze([
 {id:'powder-moisture',when:'要分清水分狀態、粉末變黏與包裝／微生物主張'},
 {id:'heat-quality',when:'要把蛋白品質、食品熱史與微生物證據分層'},
 {id:'juice-concentration',when:'要分開濃縮收支、營養總量、褐變及微生物觀察'},
 {id:'yogurt-sugar-to-gel',when:'要追糖去向、乳品成膠品質與菌種證據'},
 {id:'protein-evidence-chain',when:'要檢查蛋白含量、營養品質、加工功能與混配推理',focusButton:'data-protein-path-focus'},
 {id:'drying-evidence-chain',when:'要檢查乾濕基、同溫平衡、速率與保存證據',focusButton:'data-drying-path-focus'},
 {id:'fermentation-evidence-chain',when:'要分清製程用語、碳／還原帳與時間序列觀察',focusButton:'data-fermentation-path-focus'},
 {id:'thermal-evidence-chain',when:'要分清熱模型、測點、累積與證據用途',focusButton:'data-thermal-evidence-path-focus'},
 {id:'enzyme-evidence-chain',when:'要由量測初速走到模型、參數及未知機制判讀',focusButton:'data-enzyme-evidence-path-focus'}
]);
const safeId=value=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
function liveLesson(ref,courses){
 const subject=LEARNING_SUBJECTS[ref.subject],course=courses?.[ref.subject];
 if(!subject||!Array.isArray(course?.topics)||(course.routeRoot!==undefined&&course.routeRoot!==subject.root))return null;
 const matches=course.topics.flatMap(topic=>safeId(topic?.id)&&Array.isArray(topic.lessons)?topic.lessons.filter(lesson=>lesson?.id===ref.lessonId).map(lesson=>({topic,lesson})):[]);
 return matches.length===1?{...matches[0],href:'#'+subject.root+'/'+matches[0].topic.id+'/'+ref.lessonId+'/observe'}:null;
}
export function examStartNavigationModel({courses={}}={}){
 const entries=EXAM_START_ENTRIES.map(ref=>{const live=liveLesson(ref,courses);return {...ref,href:live?.href??null,lessonTitle:live?.lesson.title??null};});
 const paths=EXAM_START_PATH_CHOICES.map(choice=>{
  const matches=LEARNING_PATHS.filter(path=>path.id===choice.id),path=matches.length===1?matches[0]:null,stations=path?resolvePathStations(path,courses):[],available=stations.length>0&&stations.every(s=>s.available);
  return {...choice,title:path?.title??choice.id,outcome:path?.outcome??'',boundary:path?.boundary??'',href:available?'#paths/'+choice.id:null,available,stations};
 });
 const reviews=Object.values(LEARNING_SUBJECTS).map(subject=>({subject:subject.id,title:subject.title,href:Array.isArray(courses?.[subject.id]?.topics)&&(courses[subject.id].routeRoot===undefined||courses[subject.id].routeRoot===subject.root)?'#'+subject.root+'/review':null}));
 return {entries,paths,reviews};
}
const link=(entry,label=entry?.label)=>entry?.href?'<a href="'+esc(entry.href)+'">'+esc(label)+'</a>':'<span>'+esc(label)+'（內容暫未載入）</span>';
function fastEntry(entry){return '<li>'+link(entry)+'：在觀察頁展開「'+esc(entry.detailLabel)+'」，於任務選單自行選「'+esc(entry.viewLabel)+'」。</li>';}
function reviewLinks(reviews){return reviews.map(review=>link(review,review.title+'筆記與複習')).join(' · ');}
export function renderExamStartNavigation({courses={},variant='full'}={}){
 if(!['home','full'].includes(variant))return '';
 const model=examStartNavigationModel({courses}),retention=model.entries.find(x=>x.id==='retention'),heat=model.paths.find(x=>x.id==='heat-quality');
 if(variant==='home')return '<section class="study-roadmap exam-start-navigation" aria-labelledby="exam-start-home-title" data-exam-start="home"><h2 id="exam-start-home-title">這次從哪裡開始？</h2><ol><li>基礎已熟：從'+link(retention,'留存取證與獨立短答')+'或'+link(model.entries.find(x=>x.id==='temperature'),'溫度條件判讀')+'試自己的推理。</li><li>只有一處卡住：先在'+link(retention,'原活動的先備診斷')+'確認錯因，再沿回補連結返回。</li><li>想串三科：到下方備考學習路徑，選「'+esc(heat.title)+'」，逐層比較。</li></ol><p>入口保留現有任務與作答，不會自動判定掌握。<a class="study-path-link" href="#paths">備考學習路徑：選問題、看任務開法與回顧下一步 →</a></p></section>';
 return '<section class="study-roadmap exam-start-navigation" aria-labelledby="exam-start-full-title" data-exam-start="full"><h2 id="exam-start-full-title">依這次的卡點，選一個入口</h2><p>農化基礎已熟，可直接檢查推理；遇到陌生概念再補最短一段。以下是三種選法，不是必須走完的順序。</p><ol class="exam-start-choices">'+
 '<li data-exam-start-scenario="fast"><strong>基礎已熟：自行選獨立作答任務</strong><ul>'+model.entries.map(fastEntry).join('')+'</ul><p>先依題目選資料、寫自己的判斷，再決定是否開啟結構化自核。頁面會保留既有任務、初答及曝光；如果曾看過這題或解析，就當修訂複習，不當新題或盲測。這裡的連結先到觀察頁，沒有替你切換任務或重設答案。</p></li>'+
 '<li data-exam-start-scenario="remedy"><strong>卡在一個錯因：診斷 → 只補需要的段落 → 回原題修訂</strong><p>先到'+link(retention,'營養留存原活動')+'，展開「'+esc(retention.detailLabel)+'」，在任務選單選「'+esc(retention.diagnosticLabel)+'」。先寫理由並核對；若分析對象、分母或來源判錯，使用該欄回饋中的「只補這段」連結，再按段落旁的返回連結回原活動。導航頁不替你判定錯因，也不必重讀整章。</p><p>這類活動的原答、核對與修訂分開；草稿限目前頁面工作階段，確認「附加完整摘要到本課筆記」成功後才納入筆記保存。重整前先保存或複製，不能把補救頁開過當成已學會。</p></li>'+
 '<li data-exam-start-scenario="cross"><strong>要串三科：先問各層證據回答什麼</strong><p>選'+link(heat,'「同樣加熱，效果為什麼不同？」')+'：先在蛋白站說清評價目的，再到加工站區分食品熱史、指定累積與品質端點，最後到微生物站判讀證據用途。對每一層寫出支持的結論、依據、適用條件及仍缺的資料；不要只列流程名稱。</p><p>'+esc(heat.boundary)+'</p><p>末站沿用既有熱證據活動與具領域欄位的遷移；沒有另設一套題庫，也不把這種有題設的作答稱為盲測。</p></li></ol>'+
 '<details class="study-topic-directory" data-exam-path-choices><summary>依想回答的問題，選現有九條路徑</summary><p>下面用各路徑既有綜合問題自問。能提出理由與條件者可選站跳讀；答不完整就補該路徑列出的內容，不按開頁數或已作答數決定。後五條核心路徑在總覽頁另有既有的診斷／整合按鈕，先進總覽再按；前四條以各站課題及練習為主。</p><table><thead><tr><th scope="col">這次想處理</th><th scope="col">先試著回答</th><th scope="col">入口</th></tr></thead><tbody>'+model.paths.map(choice=>'<tr data-exam-path="'+esc(choice.id)+'"><th scope="row">'+esc(choice.when)+'</th><td>'+esc(choice.outcome)+'</td><td>'+link(choice,choice.title)+(choice.focusButton?'<br><small>總覽頁有既有診斷／整合按鈕</small>':'')+'</td></tr>').join('')+'</tbody></table></details>'+
 '<details class="study-topic-directory" data-exam-review-next><summary>作答後：怎樣判斷下一步？</summary><p>先自己說出結論、題設依據、適用條件與仍缺的資料，再對照解析。若只缺一個定義或分母，回原活動診斷後補對應段落；若換資料就接不起推理，選同一問題路徑補銜接；若已能完整說明，再換一個證據層或不同條件的問題。</p><p>'+reviewLinks(model.reviews)+'</p><p>複習頁的自測、筆記與修訂是留下的紀錄，不是掌握證明。一般課內變化題目前可編輯；若要保留這次全文再試，用既有「保留這次，重新作答」（最多20次），先確認保存；保存失敗先複製全文。不同活動各有自己的首答及修訂規則。</p></details></section>';
}
