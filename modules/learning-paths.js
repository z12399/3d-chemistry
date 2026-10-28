import {escapeHTML as esc} from './storage.js';
import {renderExamStartNavigation} from './exam-start-navigation.js';
import {withReviewedPathTransition} from './reviewed-path-transitions.js';
import {renderStudyRoadmap,renderProteinPathIntroduction,renderDryingPathIntroduction,renderFermentationPathIntroduction,renderThermalEvidencePathIntroduction,renderEnzymeEvidencePathIntroduction,renderPathBranches,renderStationReasoning} from './study-roadmap.js';
import {LEARNING_SUBJECTS,subjectNavigation} from './learning-subjects.js';
import {lessonPath} from './learning-model.js';
import {LEARNING_PATHS,resolvePathStations,decoratePath,pathAnswerStatus} from './learning-paths-model.js';

const number = i => String(i+1).padStart(2,'0');
const plannedSubjects = stations => [...new Set(stations.map(station=>station.subjectMeta?.title||'未識別科目'))].map(esc).join('／')||'未識別科目';
const symbol = id => {
  const drawings={
    'powder-moisture':'<path d="M27 26h42v53H27z M24 20h48v6H24z M28 66q10-10 20-2t20-4 M33 73h2m8 2h2m10-5h2"/><path d="M78 30q-10 13 0 13t0-13Z"/>',
    'heat-quality':'<path d="M24 48h49v27q-24 15-49 0Z M19 48h59 M36 38c-8-9 8-12 0-21 M50 38c-8-9 8-12 0-21 M64 38c-8-9 8-12 0-21 M29 63h39"/>',
    'juice-concentration':'<path d="M27 35h44l-6 46H33Z M30 56h38 M22 20c14-13 29-13 42 0-13 14-28 14-42 0Z M22 20h42 M43 11v18 M37 51l11 7 13-12"/>'
  };
  return `<svg class="path-drawing" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[id]||''}</svg>`;
};
const chrome = title => `${subjectNavigation(null)}<div class="learning-topline"><a href="#paths">食品問題路徑</a>${title?`<span aria-hidden="true">/</span><span>${esc(title)}</span>`:''}</div>`;
const canonical = station => lessonPath(station.topic,station.lesson,'understand',LEARNING_SUBJECTS[station.subject].root);
function pathFacts(path,courses,progresses,positions){
  const stations=resolvePathStations(path,courses);
  const saved=positions?.get(path.id,courses);
  const first=stations[0];
  return {stations,saved,href:saved?decoratePath(saved,path.id,courses):first?.available?decoratePath(canonical(first),path.id,courses):null,
    answered:stations.filter(s=>s.available&&pathAnswerStatus(s,progresses)).length};
}
export function learningPathEntry({courses={},progresses={},positions}={}){
  return `<section class="path-entry"><div class="learning-section-heading"><div><h2>問題路徑</h2></div><a href="#paths">三科學習路徑 →</a></div><div class="path-entry-list">${LEARNING_PATHS.map((path,i)=>{
    const facts=pathFacts(path,courses,progresses,positions);
    return `<div><span class="path-entry-number">${number(i)}</span><a href="#paths/${path.id}">${esc(path.title)}</a>${facts.saved?`<a class="path-entry-resume" href="${esc(facts.href)}" aria-label="接續路徑：${esc(path.title)}">接續路徑 →</a>`:`<span class="path-entry-count">${path.stations.length} 站</span>`}</div>`;
  }).join('')}</div></section>`;
}
export function renderPathDirectory({courses,progresses,positions}){
  return `${chrome()}<header class="path-heading"><h1>備考學習路徑</h1><p>先診斷缺口，再選需要的概念與證據；已有基礎可直接跳站。</p></header>${renderExamStartNavigation({courses,variant:'full'})}${renderStudyRoadmap(courses)}<h2>跨課整合路徑</h2><div class="path-directory">${LEARNING_PATHS.map((path,i)=>{
    const facts=pathFacts(path,courses,progresses,positions);
    return `<article class="path-directory-row"><span class="path-number" aria-hidden="true">${number(i)}</span>${symbol(path.id)}<div class="path-directory-copy"><p class="path-meta">${path.stations.length} 站 · 規劃涵蓋：${plannedSubjects(facts.stations)}${facts.answered?` · ${facts.answered} 站已有作答`:''}</p><h2><a href="#paths/${path.id}">${esc(path.title)} <span aria-hidden="true">↗</span></a></h2><p>${esc(path.description)}</p></div><a class="path-open" href="#paths/${path.id}" aria-label="查看路徑：${esc(path.title)}">查看路徑 <span aria-hidden="true">→</span></a></article>`;
  }).join('')}</div><p class="path-footnote">作答與筆記可在各科「筆記與複習」匯出。</p>`;
}
export function renderPathOverview(id,{courses,progresses,positions}){
  const path=LEARNING_PATHS.find(p=>p.id===id);
  if(!path)return `${chrome()}<div class="learning-empty"><h1>找不到這條路徑。</h1><p>原有課程與筆記仍可繼續使用。</p><a href="#paths">回到食品問題路徑 →</a></div>`;
  const facts=pathFacts(path,courses,progresses,positions);
  return `${chrome(path.title)}<header class="path-heading path-overview-heading"><div><p class="learning-kicker">${path.stations.length} 站 · 問題路徑</p><h1>${esc(path.title)}</h1><p>${esc(path.description)}</p></div>${symbol(path.id)}</header><div class="path-start-row">${facts.href?`<a class="button-primary learning-primary" href="${esc(facts.href)}">${facts.saved?'繼續學習':'開始學習'} <span aria-hidden="true">→</span></a>`:'<p role="status">第一站內容暫時無法載入，請重新整理。</p>'}<span>${facts.answered?`${facts.answered} / ${facts.stations.length} 站已有作答`:'每站：理解 → 觀察 → 練習'}</span></div>${positions?.error?`<p class="path-storage-warning" role="status">${esc(positions.error)}</p>`:''}${renderProteinPathIntroduction(path,courses)}${renderDryingPathIntroduction(path,courses)}${renderFermentationPathIntroduction(path,courses)}${renderThermalEvidencePathIntroduction(path,courses)}${renderEnzymeEvidencePathIntroduction(path,courses)}<ol class="path-stations">${facts.stations.map((station,i)=>{
    const answered=station.available&&pathAnswerStatus(station,progresses);
    return `<li><span class="path-station-number" aria-hidden="true">${number(i)}</span><div class="path-station-copy"><p class="path-meta">${esc(LEARNING_SUBJECTS[station.subject]?.title||'課程')} · ${esc(station.label)}${answered?'<span class="path-answer-status">已有作答</span>':''}</p><h2>${station.available?`<a href="${esc(decoratePath(canonical(station),path.id,courses))}">${esc(station.prompt)} <span aria-hidden="true">→</span></a>`:esc(station.prompt)}</h2><p class="path-lesson-title">${station.available?esc(station.lesson.title):'本課暫時無法載入，請重新整理。'}</p>${renderStationReasoning(withReviewedPathTransition(path,station,courses),courses,path.id)}</div>${answered&&station.available?`<a class="path-answer-link" href="${esc(decoratePath(lessonPath(station.topic,station.lesson,'check',LEARNING_SUBJECTS[station.subject].root),path.id,courses))}">回看作答</a>`:''}</li>`;
  }).join('')}</ol>${renderPathBranches(path,courses)}${path.id==='protein-evidence-chain'?'<section id="protein-path-practice" aria-label="蛋白整合推理與遷移"><div id="protein-path-lab"></div></section>':path.id==='drying-evidence-chain'?'<section id="drying-path-practice" aria-label="乾燥整合推理與遷移"><div id="drying-path-lab"></div></section>':path.id==='fermentation-evidence-chain'?'<section id="fermentation-path-practice" aria-label="發酵分層推理與遷移"><div id="fermentation-path-lab"></div></section>':path.id==='thermal-evidence-chain'?'<section id="thermal-evidence-path-practice" aria-label="熱證據角色與遷移"><div id="thermal-evidence-path-lab"></div></section>':path.id==='enzyme-evidence-chain'?'<section id="enzyme-evidence-path-practice" aria-label="酵素量測取證與新條件判斷"><div id="enzyme-evidence-path-lab"></div></section>':''}<section class="path-reflection"><p class="learning-kicker">綜合問題</p><h2>${esc(path.outcome)}</h2><p>試著用自己的話回答；需要時，回到上方各站補寫或修訂。</p></section><details class="path-boundary"><summary>資料範圍</summary><p>${esc(path.boundary)}</p><p>「已有作答」只表示留下過答案，包含自測選項；不代表答對或已掌握。各站的來源與條件仍在原課內。</p></details><a class="learning-back" href="#paths">← 返回問題路徑</a>`;
}
export function renderPathBanner(context,error=''){
  if(!context)return '';
  return `<aside class="path-context" aria-label="目前學習路徑"><div><a href="#paths/${context.path.id}">← ${esc(context.path.title)}</a><span>第 ${context.index+1} / ${context.path.stations.length} 站</span></div><p>${esc(context.station.prompt)}</p>${error?`<small role="status">${esc(error)}</small>`:''}</aside>`;
}
