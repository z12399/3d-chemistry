import {LEARNING_SUBJECTS} from './learning-subjects.js';

const normalize = value => String(value ?? '').toLowerCase().replace(/\s+/gu, ' ').trim();
const tokensFor = query => [...new Set(normalize(query).split(' ').filter(Boolean))];
const list = value => Array.isArray(value) ? value : [];

function searchableText(topic, lesson, subject) {
  return normalize([
    subject?.title, subject?.english,
    topic?.title, topic?.en, topic?.question, topic?.summary,
    lesson?.title, lesson?.question, lesson?.takeaway,
    ...list(lesson?.explanation),
    lesson?.equation?.label, lesson?.equation?.text, lesson?.equation?.note,
  ].filter(value => value != null).join(' '));
}

function matches(topic, lesson, tokens, subject) {
  const text = searchableText(topic, lesson, subject);
  return tokens.every(token => text.includes(token));
}

// Return the existing curriculum objects, without touching routes or progress.
// The known subject order and original lesson order break equal-score ties.
export function searchLessons(courses, query, subjectId = 'all') {
  const tokens = tokensFor(query);
  if (!tokens.length) return [];
  const results = [];
  for (const subject of Object.values(LEARNING_SUBJECTS)) {
    if (subjectId !== 'all' && subject.id !== subjectId) continue;
    for (const topic of list(courses?.[subject.id]?.topics)) {
      for (const lesson of list(topic?.lessons)) {
        if (!lesson || !matches(topic, lesson, tokens, subject)) continue;
        const title = normalize(lesson.title), question = normalize(lesson.question);
        results.push({
          subject, topic, lesson,
          titleHits: tokens.filter(token => title.includes(token)).length,
          questionHits: tokens.filter(token => question.includes(token)).length,
          order: results.length,
        });
      }
    }
  }
  results.sort((a, b) => b.titleHits - a.titleHits || b.questionHits - a.questionHits || a.order - b.order);
  return results.map(({subject, topic, lesson}) => ({subject, topic, lesson}));
}

// Chapter filtering preserves teaching order. Clearing the field restores all.
export function matchingTopicLessons(topic, query) {
  const tokens = tokensFor(query);
  return list(topic?.lessons).filter(lesson => lesson && (!tokens.length || matches(null, lesson, tokens)));
}
