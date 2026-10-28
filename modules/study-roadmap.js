import {escapeHTML as esc} from './storage.js';
import {LEARNING_SUBJECTS} from './learning-subjects.js';
import {lessonPath} from './learning-model.js';
import {STUDY_ROADMAP,CORE_STARTS} from './study-roadmap-data.js';

// Look up live identities. Missing or ambiguous material stays explicit.
export function roadmapLesson(ref,courses={}){
 const subject=Object.hasOwn(LEARNING_SUBJECTS,ref?.subject??'')?LEARNING_SUBJECTS[ref.subject]:null;
 const course=subject&&courses?.[subject.id];
 if(!course||!Array.isArray(course.topics)||(course.routeRoot!==undefined&&course.routeRoot!==subject.root))return null;
 const found=course.topics.flatMap(topic=>(Array.isArray(topic.lessons)?topic.lessons:[]).filter(lesson=>lesson.id===ref.lessonId).map(lesson=>({subject,topic,lesson})));
 return found.length===1?{...found[0],href:lessonPath(found[0].topic,found[0].lesson,'understand',subject.root)}:null;
}
function remedial(ref,courses){
 const found=roadmapLesson(ref,courses);
 return found?`<a href="${esc(found.href)}">${esc(found.lesson.title)}</a>：${esc(ref.why)}`:`<span>補救內容暫未載入：${esc(ref.why)}</span>`;
}
export function renderStudyRoadmap(courses={}){
 return `<section class="study-roadmap" aria-labelledby="study-roadmap-title"><h2 id="study-roadmap-title">從哪裡開始？先用自己的話判斷</h2><p>已有農化背景，可先回答下面的診斷問題。能分清概念並說出條件者可直接進入遷移；不確定時，補指定單元。這裡不按點擊、看過範例或已有作答判定學會。</p><div class="study-starts">${CORE_STARTS.map(start=>{
  const found=start.href?null:roadmapLesson(start,courses),href=start.href||found?.href;
  return `<article class="study-start"><p class="study-start-status">${esc(start.status)}</p><h3>${esc(start.title)}</h3><p>${esc(start.diagnostic)}</p><p>${esc(start.why)}</p>${href?`<a class="study-start-link" href="${esc(href)}">${esc(start.label)} →</a>`:'<p role="status">起點內容暫時無法載入。</p>'}${start.remedies?`<details><summary>需要補基礎時</summary><ul>${start.remedies.map(r=>`<li>${remedial(r,courses)}</li>`).join('')}</ul></details>`:''}</article>`;
 }).join('')}</div><details class="study-topic-directory"><summary>三科全部主題：入口、理由與具體補救</summary><p>這是可跳讀的編排建議，不是每人必修的線性順序。相關連結不當作硬性先備；每課原有觀察、來源、練習及筆記保持。考試年度與組別尚未確認，不由歷屆題或課數推命題比重。</p>${Object.values(LEARNING_SUBJECTS).map(subject=>`<section><h3>${esc(subject.title)}</h3><table><thead><tr><th scope="col">主題與起點</th><th scope="col">為何從這裡進入</th><th scope="col">不熟時回補</th></tr></thead><tbody>${STUDY_ROADMAP.filter(row=>row.subject===subject.id).map(row=>{
  const topics=courses?.[subject.id]?.topics?.filter(t=>t.id===row.topicId)??[],topic=topics.length===1?topics[0]:null;
  const found=roadmapLesson({subject:row.subject,lessonId:row.startLessonId},courses),valid=found&&found.topic.id===row.topicId;
  return `<tr data-study-topic="${esc(subject.id+':'+row.topicId)}"><th scope="row">${topic?`<a href="#${subject.root}/${esc(topic.id)}">${esc(topic.title)}</a>`:'主題暫未載入'}<br>${valid?`<a href="${esc(found.href)}">${esc(found.lesson.title)} →</a>`:'起點暫未載入'}</th><td>${esc(row.why)}</td><td>${row.prerequisites.length?`<ul>${row.prerequisites.map(r=>`<li>${remedial(r,courses)}</li>`).join('')}</ul>`:'可直接進入，遇到陌生概念再回補。'}</td></tr>`;
 }).join('')}</tbody></table></section>`).join('')}</details></section>`;
}
export function renderProteinPathIntroduction(path,courses={}){
 if(path?.id!=='protein-evidence-chain')return '';
 return `<section class="study-core-intro" aria-labelledby="protein-chain-title"><h2 id="protein-chain-title">先判斷，再決定從哪一站補起</h2><p>先回答：「蛋白含量較高、凝膠較強、胺基酸供給較符合需求，能互相推出嗎？」若能各指出量測、理由與限制，可直接到<button type="button" data-protein-path-focus>整合推理與混配遷移</button>；否則沿下列六站補缺。</p><ol><li><strong>定義：</strong>題目評的是含量、營養品質，還是加工功能？</li><li><strong>條件與機制：</strong>分子結構、分析方法、蛋白分母和參考對象是否對齊？</li><li><strong>觀察與推論：</strong>組成比、消化資料與功能量測各支持到哪裡？</li><li><strong>作答：</strong>寫出判斷 → 題設與計算／理由 → 適用條件 → 尚缺的資料。</li></ol><p>下方先看一個示範，再用可選提示作答，最後進入沒有提示按鈕的新題。核對只是對照題設和自評準則，不把自由文字或3D觀看當掌握證據。</p></section>`;
}
export function renderStationReasoning(station,courses={}){
 if(!station?.why)return '';
 return `<div class="study-station-reasoning"><p><strong>銜接理由：</strong>${esc(station.why)}</p><p><strong>可跳過／前進的依據：</strong>${esc(station.ready)}</p>${station.remedies?.length?`<details><summary>卡住時補哪裡？</summary><ul>${station.remedies.map(r=>`<li>${remedial(r,courses)}</li>`).join('')}</ul></details>`:''}</div>`;
}

export function renderDryingPathIntroduction(path,courses={}){
 if(path?.id!=='drying-evidence-chain')return '';
 return `<section class="study-core-intro" aria-labelledby="drying-chain-title"><h2 id="drying-chain-title">先看自己混淆的是哪一層</h2><p>先用自己的話區分：濕基／乾基的分母、aw的同溫平衡條件，以及含水終點與乾燥速率。已有基礎可用<button type="button" data-drying-path-focus>診斷與撤提示遷移</button>直接檢查；不確定就依下列站點補缺，全部單元仍可直接點入。</p><ol><li><strong>量與邊界：</strong>同一批水與非水分如何記帳？非水流失或吸濕後，哪些假設失效？</li><li><strong>狀態與過程：</strong>同溫平衡aw、指定材料的等溫線、乾燥速率與食品溫度各回答什麼？</li><li><strong>觀察與推論：</strong>終點質量、RH、顏色與復水性各支持到哪裡？尚缺什麼資料？</li><li><strong>作答：</strong>先給條件式結論與理由，再列適用前提和資訊不足；不從低aw單獨保證安全。</li></ol><p>本批補修兩課說明與既有基準活動的示範標示；新伴讀依序提供可跳診斷、示範、可選部分提示和沒有提示按鈕的新邊界題。無提示是本段的呈現方式，不是盲測或掌握標章。</p></section>`;
}

export function renderFermentationPathIntroduction(path,courses={}){
 if(path?.id!=='fermentation-evidence-chain')return '';
 return `<section class="study-core-intro" aria-labelledby="fermentation-chain-title"><h2 id="fermentation-chain-title">先分問題層級，再選需要的路</h2><p>先回答：食品製程的發酵、所選碳／還原帳、固態／液態、pH／菌數觀察，各自回答什麼？能說出條件及界線，可用<button type="button" data-fermentation-path-focus>診斷與新資料遷移</button>直接檢查；不確定再走四站補缺。</p><ol><li><strong>用語與目的：</strong>製程分類、代謝途徑與食品品質目標不要互相代替。</li><li><strong>條件與機制：</strong>碳去向、NAD周轉、淨ATP各立自己的帳；固／液物理模式與氧條件是不同軸。</li><li><strong>觀察與推論：</strong>先寫量測對象、方法、時間與分母，再判斷能否支持菌種、路徑或因果。</li><li><strong>遷移：</strong>保留可支持的觀察，指出不能支持的結論及還缺的證據；不是一律回答未知。</li></ol><p>主線從用語走到一份豆奶時間序列，再明確換到另一份優格端點研究；沒有拼成同批資料。七個分支按題選讀，不必全走。下方示範、部分提示與本段無提示題分開，原答、核對與修訂保留；無提示不是盲測或掌握證明。</p></section>`;
}
export function renderPathBranches(path,courses={}){
 if(!Array.isArray(path?.branches)||!path.branches.length)return '';
 return `<details class="study-topic-directory study-path-branches"><summary>依你的問題選分支，不必逐一完成</summary><p>主線提供共用判讀能力；以下每支處理不同問題及來源情境，不能互補成同一批食品的資料。</p><table><thead><tr><th scope="col">要回答的問題</th><th scope="col">為何選這支／具體課</th><th scope="col">仍須保留的界線</th></tr></thead><tbody>${path.branches.map(branch=>`<tr data-study-branch="${esc(branch.id)}"><th scope="row">${esc(branch.title)}<br>${esc(branch.question)}</th><td><p>${esc(branch.why)}</p><ul>${(branch.lessonRefs??[]).map(ref=>`<li>${remedial(ref,courses)}</li>`).join('')}</ul></td><td>${esc(branch.boundary)}</td></tr>`).join('')}</tbody></table></details>`;
}

export function renderThermalEvidencePathIntroduction(path,courses={}){
 if(path?.id!=='thermal-evidence-chain')return '';
 return `<section class="study-core-intro" aria-labelledby="thermal-evidence-chain-title"><h2 id="thermal-evidence-chain-title">先診斷，是模型、測點還是證據用途混在一起？</h2><p>先分D的時間、z的溫差與Tref參考溫度；Fourier Fo＝αt/L²是無因次傳熱時間尺度，Fref則是指定Tref與z下的加權時間。能說清條件、量測範圍與結論界線者，可用<button type="button" data-thermal-evidence-path-focus>直接做證據角色與新情境判讀</button>；不熟的概念可由各站的具體補救回看，不必重讀所有基礎。</p><ol><li><strong>條件與機制：</strong>先分介質、表面、中心及模型邊界，預測熱如何傳入。</li><li><strong>觀察與範圍：</strong>有限測點、瞬間最低與完整歷程是不同證據；既有冷區活動的原創指標不是溫度或Fref。</li><li><strong>計算與用途：</strong>對應位置的T(t)及適用參數才支持條件式累積；軟體按公式運作不等於產品與製程已具充分依據。</li><li><strong>作答：</strong>逐項說明證據是用來建立程序依據、追蹤本次受控，還是檢視系統依設計運作；同份資料可能隨目的有不同用途，仍須說理由、條件及缺口。</li></ol><p>本路徑沿用既有熱穿透與冷區內容；舊抽樣式只回答有限取樣問題，不代替角色判讀。下方可先診斷，再看示範、沿部分提示作答，最後換新情境；原答與修訂分開，無提示不等於盲測或掌握證明。這些教學資料不提供真實食品的處理排程、安全或保存期判定。</p></section>`;
}

export function renderEnzymeEvidencePathIntroduction(path,courses={}){
 if(path?.id!=='enzyme-evidence-chain')return '';
 return `<section class="study-core-intro" aria-labelledby="enzyme-evidence-chain-title"><h2 id="enzyme-evidence-chain-title">先問速率從哪裡來，再問曲線支持什麼</h2><p>先用自己的話說明：同樣AU/時間為何未必是同樣產物速率？ES近穩定為何仍有產物流？Vmax、Km與有效催化位濃度各有什麼基準？若已能說出量、條件及尚缺證據，可用<button type="button" data-enzyme-evidence-path-focus>量測取證與新條件判斷</button>直接檢查；不確定就從對應站點補起，全部內容都可跳讀。</p><p>主線先走量測窗口、準穩態機構，再定義飽和參數，之後才比較擬合和抑制。Vmax=kcat×有效催化位濃度；若還不能分清酵素mg、分子數與可用位點，先由第3站的周轉補救入口回補，不把填過數字當掌握。</p><p>第一站觀察先用新的量測取證活動辨認配對空白、校正與窗口的用途。原有MM受質耗損模型仍在同課的「已有MM基礎後再看」延伸中，保留作模型假設的對照；它不是空白或校正的模擬。末站原有對照練習與作答繼續保留，需要時回第一站活動檢查新條件。</p><p>五條分支按問題選：每位點周轉、一般混合抑制、糖鏈切鍵、人體LPH及量測控制。3D只在需要辨認鍵位與空間條件時輔助；反應快慢不代表平衡改變，擬合相容也不證明唯一機制。作答時寫出判斷、理由、適用條件與能區分替代解釋的下一項證據；診斷、看過範例或完成活動都不自動表示學會。</p></section>`;
}
