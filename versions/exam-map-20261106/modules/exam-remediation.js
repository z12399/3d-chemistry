/** Explicit criterion mapping; a topic-level link is never a fallback remedy. */
export const safeRemediationHref=href=>/^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/(?:understand|observe|check)(?:\?|$)/.test(String(href||''));
export function criterionRemedies(question,criterion){
  if(!Array.isArray(criterion?.remediationLessonIds))return [];
  return [...new Set(criterion.remediationLessonIds)].map(id=>(question.remediation||[]).find(item=>item.lessonId===id))
    .filter(item=>item&&safeRemediationHref(item.href))
    .map(item=>({...item,...(criterion.remediationScopeNotes?.[item.lessonId]?{scopeNote:criterion.remediationScopeNotes[item.lessonId]}:{})}));
}
