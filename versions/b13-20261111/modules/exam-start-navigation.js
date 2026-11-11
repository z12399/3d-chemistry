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
 {id:'heat-quality',when:'要把蛋白品質、食品熱史與微生物結果分開看'},
 {id:'juice-concentration',when:'要分開濃縮收支、營養總量、褐變及微生物觀察'},
 {id:'yogurt-sugar-to-gel',when:'要追糖去向、乳品成膠品質與菌種資料'},
 {id:'protein-evidence-chain',when:'要檢查蛋白含量、營養品質、加工功能與混配推理',focusButton:'data-protein-path-focus'},
 {id:'drying-evidence-chain',when:'要檢查乾濕基、同溫平衡、速率與保存資料',focusButton:'data-drying-path-focus'},
 {id:'fermentation-evidence-chain',when:'要分清製程用語、碳／還原帳與時間序列觀察',focusButton:'data-fermentation-path-focus'},
 {id:'thermal-evidence-chain',when:'要分清熱模型、測點、累積與資料用途',focusButton:'data-thermal-evidence-path-focus'},
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
function reviewLinks(reviews){return reviews.map(review=>link(review,review.title+'筆記與複習')).join(' · ');}
export function renderExamStartNavigation({courses={},variant='full'}={}){
 if(!['home','full'].includes(variant))return '';
 const model=examStartNavigationModel({courses});
 if(variant==='home')return '<section class="study-roadmap exam-start-navigation exam-start-home" aria-labelledby="exam-start-home-title" data-exam-start="home"><h2 id="exam-start-home-title">怎麼用</h2><p>1. 看<a href="./past-exams.html">歷屆考題</a>，知道每科重點放哪；2. 到<a href="#learn/map">課程</a>讀對應主題；3. <a href="./exam.html#exam/written">寫考題</a>，對照參考要點，回去補沒寫到的。</p></section>';
 return '<section class="study-roadmap exam-start-navigation" aria-labelledby="exam-start-full-title" data-exam-start="full"><h2 id="exam-start-full-title">從哪裡開始</h2><ol class="exam-start-choices">'+
 '<li data-exam-start-scenario="fast"><a href="./exam.html#exam/written">已經有基礎：直接去寫考題 →</a></li>'+
 '<li data-exam-start-scenario="remedy"><a href="#learn/map">某一題卡住：到那一課，先做課內的小測，只補需要的段落 →</a></li>'+
 '<li data-exam-start-scenario="cross">想把三科串起來：選下面的專題。</li></ol>'+
 '<details class="study-topic-directory" data-exam-path-choices><summary>九個專題各回答什麼問題</summary><p>先試著回答中間那一欄。答得出理由和條件，可以跳著讀；答不完整，就照專題的順序讀。後五個專題的頁面另有整合練習。</p><table><thead><tr><th scope="col">想處理的問題</th><th scope="col">先試著回答</th><th scope="col">專題</th></tr></thead><tbody>'+model.paths.map(choice=>'<tr data-exam-path="'+esc(choice.id)+'"><th scope="row">'+esc(choice.when)+'</th><td>'+esc(choice.outcome)+'</td><td>'+link(choice,choice.title)+(choice.focusButton?'<br><small>專題頁有整合練習</small>':'')+'</td></tr>').join('')+'</tbody></table></details>'+
 '<details class="study-topic-directory" data-exam-review-next><summary>寫完考題後，下一步怎麼決定</summary><p>先自己說出結論、依據、適用條件和還缺的資料，再對照參考要點。只缺一個定義或分母：回那一課補那一段。換了資料就接不起來：選一個相關的專題，照順序讀。已經能完整說明：換一題條件不同的題目。</p><p>'+reviewLinks(model.reviews)+'</p><p>筆記與自測是你留下的紀錄，不代表已經學會。課內變化題可以改寫；想保留這次全文再寫一次，用「保留這次，重新作答」（最多20次）。保存失敗時先複製全文。</p></details></section>';
}
