import {escapeHTML as esc} from './storage.js';
import {LEARNING_SUBJECTS} from './learning-subjects.js';
import {helpHTML} from './content.js';

// Curated descriptions point to lessons only when the loaded course contains them.
// Counts and topic names always come from the same data used by the course pages.
const WORKBENCHES=Object.freeze({
  chemistry:[
    {id:'protein-structure-hierarchy',title:'蛋白質 3D：6FXB',text:'旋轉球棍、選殘基，比較肽鍵、二硫鍵與兩鏈接觸。'},
    {id:'carb-chair-foundations',title:'糖的立體結構',text:'自己放置 OH，對照 D／L、異頭物與椅式。'},
    {id:'carb-electron-hydrolysis',title:'糖苷水解的電子流',text:'選反應部位、推進箭頭，追蹤橋氧與水氧。'},
    {id:'protein-salt-ph',title:'蛋白水合量',text:'選文獻樣本，核對水合量、量測條件與質量分母。'},
    {id:'enzyme-kinetic-fitting',title:'酵素動力學擬合',text:'用歷史資料比較擬合曲線與殘差。'},
    {id:'carb-starch-state-evidence',title:'澱粉狀態的證據',text:'比較熱分析資料，區分變稠、成膠與回凝的主張。'},
  ],
  processing:[
    {id:'proc-osmotic-driving',title:'RO 推力與膜面濃度',text:'改壓差與濃度，觀察水流方向及膜面濃度。'},
    {id:'proc-evaporation-balance',title:'單效與雙效蒸發',text:'追蹤外供與再用蒸氣，分開檢查收支和傳熱面積。'},
    {id:'proc-heat-penetration-profile',title:'熱如何到達食品中心',text:'改變傳熱條件，比較介質、表面與中心溫度。'},
    {id:'proc-psychrometric-chart',title:'濕空氣圖',text:'定位空氣狀態，追蹤加熱與吸水的變化。'},
    {id:'proc-refrigeration-cycle',title:'製冷循環',text:'沿四個設備追蹤冷媒狀態與能量去向。'},
    {id:'proc-membrane-driving',title:'膜分離的兩個出口',text:'核對透過液、截留液與成分收支。'},
  ],
  microbiology:[
    {id:'micro-growth-estimation',title:'生長估算',text:'選資料時間窗，檢查直線能延伸到哪裡。'},
    {id:'micro-count-represented-sample',title:'菌落代表多少原樣品',text:'沿稀釋與取樣步驟，算回原樣品的菌數。'},
    {id:'micro-pcr-control-evidence',title:'PCR 陰性與對照',text:'先核對照是否成立，再判讀陰性訊號。'},
    {id:'micro-fermentation-redox',title:'發酵的碳與 NAD 帳本',text:'逐份推進反應，查看糖、NAD 與 ATP 的收支。'},
    {id:'micro-phage-evidence',title:'噬菌體的結構與週期',text:'看構造、走生命週期，再核對宿主證據。'},
    {id:'micro-outbreak-evidence',title:'群聚事件的來源證據',text:'選入菌株與流行病學證據，檢查共同來源主張。'},
  ],
});

const HOME_CHOICES=[
  ['chemistry','protein-structure-hierarchy'],
  ['processing','proc-osmotic-driving'],
  ['microbiology','micro-growth-estimation'],
];
const routeId=value=>typeof value==='string'&&/^[a-z0-9-]+$/.test(value);
const topicsOf=course=>Array.isArray(course?.topics)?course.topics:[];
const lessonsOf=topic=>Array.isArray(topic?.lessons)?topic.lessons:[];

function findWorkbench(courses,subjectId,id){
  const subject=LEARNING_SUBJECTS[subjectId];
  if(!subject)return null;
  for(const topic of topicsOf(courses?.[subjectId])){
    const lesson=lessonsOf(topic).find(item=>item?.id===id);
    if(lesson?.activity?.type==='experiment'&&routeId(topic.id)&&routeId(lesson.id)){
      return {subject,topic,lesson,path:`#${subject.root}/${topic.id}/${lesson.id}/observe`};
    }
  }
  return null;
}

function availableWorkbenches(courses,subjectId){
  return (WORKBENCHES[subjectId]||[]).flatMap(entry=>{
    const found=findWorkbench(courses,subjectId,entry.id);
    return found?[{...entry,...found}]:[];
  });
}

function subjectGuide(courses,subject){
  const topics=topicsOf(courses?.[subject.id]);
  if(!topics.length)return '';
  const count=topics.reduce((sum,topic)=>sum+lessonsOf(topic).length,0);
  const workbenches=availableWorkbenches(courses,subject.id);
  const topicsText=topics.map(topic=>String(topic.title||'未命名主題')).join('、');
  return `<details class="study-guide-subject"><summary>${esc(subject.title)} · ${esc(count)} 個單元</summary>
    <p class="study-guide-topics">${esc(topics.length)} 個主題：${esc(topicsText)}</p>
    <p><a href="${esc(`#${subject.root}/map`)}">查看${esc(subject.title)}全部課程 →</a></p>
    ${workbenches.length?`<ul class="study-guide-links">${workbenches.map(entry=>`<li class="study-guide-workbench"><a href="${esc(entry.path)}">${esc(entry.title)}</a><p>${esc(entry.text)}</p></li>`).join('')}</ul>`:''}
  </details>`;
}

export function renderHomeWorkbenches(courses={}){
  const cards=HOME_CHOICES.flatMap(([subjectId,id])=>availableWorkbenches(courses,subjectId).filter(entry=>entry.id===id));
  if(!cards.length)return '';
  return `<section class="study-home-workbenches" aria-labelledby="study-workbenches-title"><h2 id="study-workbenches-title">從操作開始</h2>
    <div class="study-workbench-grid">${cards.map(entry=>`<article class="study-workbench-card"><h3>${esc(entry.title)}</h3><p>${esc(entry.text)}</p><a class="study-workbench-link" href="${esc(entry.path)}" aria-label="${esc(`開始操作：${entry.title}`)}">開始操作 →</a></article>`).join('')}</div>
  </section>`;
}

export function renderStudyGuide(courses={}){
  const subjects=Object.values(LEARNING_SUBJECTS);
  const rosCourse=courses?.microbiology,rosMatches=topicsOf(rosCourse).flatMap(t=>lessonsOf(t).filter(l=>l?.id==='micro-ros-defense'));
  const ros=rosMatches.length===1&&rosMatches[0].activity?.id==='micro-ros-defense'&&(rosCourse.routeRoot===undefined||rosCourse.routeRoot===LEARNING_SUBJECTS.microbiology.root)?findWorkbench(courses,'microbiology','micro-ros-defense'):null;
  const count=subjects.reduce((sum,subject)=>sum+topicsOf(courses?.[subject.id]).reduce((subtotal,topic)=>subtotal+lessonsOf(topic).length,0),0);
  return `<section class="study-guide" aria-labelledby="study-guide-title">
    <header class="learning-heading"><h1 id="study-guide-title">使用說明</h1><p>選一題，動手觀察，再留下自己的解釋。</p></header>
    <ol class="study-guide-steps">
      <li><strong>理解原理</strong><p>從首頁選學科與單元，先讀這一題要解決的問題。</p></li>
      <li><strong>觀察變化</strong><p>操作模型或圖表，記錄一組條件與結果；完整算式和來源可再展開。</p></li>
      <li><strong>檢查理解</strong><p>先作答，再對照理由；把觀察與修訂保存到本課筆記。</p></li>
    </ol>
    <p><a href="#paths">從備考問題選路 →</a> · <a href="#learn/map">自行選一個單元 →</a></p>
    <details class="study-guide-section"><summary>目前能學什麼、有哪些操作</summary>
      <p>三科都有原理、觀察與自測。以下是目前課程中的代表工作台；每個入口保留自己的模型條件與來源。</p>
      ${subjects.map(subject=>subjectGuide(courses,subject)).join('')}
      <p class="study-guide-note">想沿同一個食品問題串起三科，可用<a href="#paths">問題路徑</a>；想找特定內容，可用首頁或課程目錄的搜尋。</p>
    </details>
    <details class="study-guide-section"><summary>蛋白質 3D：怎麼旋轉、選取與保存</summary>
      <ol><li>在「選部位」用選單挑來源部位或殘基；直接點模型也會選中所屬殘基。</li><li>拖曳旋轉、滾輪縮放。也能展開「旋轉與縮放」用按鈕；模型聚焦時可用方向鍵與 +／-。</li><li>按「記錄目前觀察」保留選取與距離；切到「看組裝」比較 A＋B 與鏈間接觸。</li><li>到「修訂保存」寫下解釋，展開摘要，按「附加到本課筆記」，確認已保存訊息。</li></ol>
      <p class="study-guide-note">6FXB 使用固定實驗重原子座標；旋轉、聚焦與隱藏只改顯示，不模擬變性或解離。筆記保存探究摘要，不會由備份重建 6FXB 的完整視角與控制狀態。</p>
    </details>
    <details class="study-guide-section"><summary>筆記怎麼保存、匯出與匯入</summary>
      <p>課內「檢查理解」的學習筆記會嘗試自動保存。工作台中的「保留觀察」通常只是暫存，還要按「保存／附加到本課筆記」，並確認成功訊息。</p>
      <ol><li>先切到要備份的學科，開「筆記與複習」。</li><li>按「匯出學習紀錄」後，還要在預覽按「下載 JSON 檔案」。三科各匯出一份。</li><li>還原時先切回同一學科，再按「匯入紀錄」選 JSON。匯入會合併，相同單元已有的筆記與作答優先保留。</li></ol>
      <p>${subjects.map(subject=>`<a href="${esc(`#${subject.root}/review`)}">${esc(subject.title)}筆記</a>`).join(' · ')}</p>
      <p>紀錄留在目前瀏覽器與網站位址。換瀏覽器、連接埠或清除網站資料後，需使用備份。工作台暫存與部分未保存筆記不包含在一般匯出；遇到保存失敗，先複製文字，再檢查匯出預覽是否包含最新作答。</p>
      <p>若顯示保存失敗或筆記衝突，先複製保留的文字，再依畫面重試。「選取摘要文字」只選取內容，仍需自己複製。</p>
      <p class="study-guide-note">「3D 實驗筆記」另有自己的 JSON 匯出與匯入，用於糖類工具的狀態與操作紀錄。Markdown 可閱讀，還原請用 JSON；它不會還原課內蛋白工作台的相機。</p>
    </details>
    <details class="study-guide-section"><summary>目前完成到哪裡、還有哪些限制</summary>
      <p>目前課程資料登錄 ${esc(count)} 個單元，已有三科導覽、來源閱讀、自測、筆記與分科備份，以及上方列出的操作入口。單元數不代表完整考綱或歷屆能力覆蓋率。</p>
      <p>三科內容、歷屆題型與計算反應缺口仍有待補齊。部分練習使用假設參數或指定條件，不能直接外推真實食品；各課會說明來源與適用範圍。${ros?`ROS 防禦工作台可由<a href="${esc(ros.path)}">本課觀察入口</a>接續。`:'ROS 防禦課內內容目前未載入，請由微生物目錄確認可用單元。'}</p>
      <p class="study-guide-note">自測結果不代表考試準備程度；整體考綱與題型仍待補齊。</p>
    </details>
    <details class="study-guide-section"><summary>自由探索 3D 工具</summary>
      <p>展開左側「糖類 3D 工具」選入口。從課程進入後，可用「← 回到這一題」接續學習。</p>
      <p><a href="#lab/explore">構象與能量</a> · <a href="#lab/library">糖類反應目錄</a> · <a href="#lab/reaction">葡萄糖變旋</a> · <a href="#lab/compare">結構比較</a> · <a href="#lab/notebook">3D 實驗筆記</a></p>
      ${helpHTML}
    </details>
  </section>`;
}
