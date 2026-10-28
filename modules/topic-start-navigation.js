import {escapeHTML as esc} from './storage.js';
import {STUDY_ROADMAP} from './study-roadmap-data.js';
import {roadmapLesson} from './study-roadmap.js';
import {LEARNING_SUBJECTS} from './learning-subjects.js';

const safeId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

// Recommendations resolve against current, unique identities; no routing or answer state is changed.
export function renderTopicStart({subject, topic, courses={}, rows=STUDY_ROADMAP}={}) {
  const identity = subject && Object.hasOwn(LEARNING_SUBJECTS, subject.id) ? LEARNING_SUBJECTS[subject.id] : null;
  const course = identity && courses?.[identity.id];
  if (!identity || !safeId(topic?.id) || !Array.isArray(course?.topics) || !Array.isArray(rows) ||
      (course.routeRoot !== undefined && course.routeRoot !== identity.root)) return '';
  const topics = course.topics.filter(item => item?.id === topic.id);
  const matches = rows.filter(row => row?.subject === identity.id && row?.topicId === topic.id);
  if (topics.length !== 1 || matches.length !== 1) return '';
  const row = matches[0];
  if (!safeId(row.startLessonId)) return '';
  const start = roadmapLesson({subject:identity.id, lessonId:row.startLessonId}, courses);
  if (!start || start.topic.id !== topic.id || !safeId(start.topic.id)) return '';
  const prerequisites = Array.isArray(row.prerequisites) ? row.prerequisites : [];
  const remedy = prerequisites.map(ref => {
    if (!safeId(ref?.lessonId) || !Object.hasOwn(LEARNING_SUBJECTS, ref?.subject ?? '')) return `<li>回補內容暫未載入：${esc(ref?.why ?? '')}</li>`;
    const found = roadmapLesson(ref,courses);
    const refCourse = courses?.[ref.subject];
    if (!found || !safeId(found.topic.id) || refCourse.topics.filter(t=>t?.id===found.topic.id).length!==1) return `<li>回補內容暫未載入：${esc(ref.why ?? '')}</li>`;
    return `<li><a href="${esc(found.href)}">${esc(found.lesson.title)}</a>：${esc(ref.why ?? '')}</li>`;
  }).join('');
  return `<section class="study-roadmap topic-start" aria-label="本主題建議起點"><h2>第一次讀，可從這裡開始</h2><p><a href="${esc(start.href)}">${esc(start.lesson.title)} →</a></p><p>${esc(row.why ?? '')}</p>${remedy?`<details><summary>需要時回補先備</summary><ul>${remedy}</ul></details>`:''}<p>可以依問題自由跳讀；下方編號是目錄位置，不是硬性先備順序。</p></section>`;
}
