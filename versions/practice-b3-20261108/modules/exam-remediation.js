/** Explicit criterion mapping; a topic-level link is never a fallback remedy. */
export const safeRemediationHref=href=>/^#(?:learn|process|micro)\/[a-z0-9-]+\/[a-z0-9-]+\/(?:understand|observe|check)(?:\?|$)/.test(String(href||''));
export function criterionRemedies(question,criterion){
  if(!Array.isArray(criterion?.remediationLessonIds))return [];
  return [...new Set(criterion.remediationLessonIds)].map(id=>(question.remediation||[]).find(item=>item.lessonId===id))
    .filter(item=>item&&safeRemediationHref(item.href))
    .map(item=>({...item,...(criterion.remediationScopeNotes?.[item.lessonId]?{scopeNote:criterion.remediationScopeNotes[item.lessonId]}:{})}));
}

/** Group one original's gaps by the lesson they actually map to. Different
 * originals/attempts keep different return targets; unmapped criteria stay so. */
export function groupRemediationGaps(gaps=[]){
  const groups=[],byKey=new Map();
  for(const gap of gaps){
    const remedies=(gap.remediation||[]).filter(item=>item&&safeRemediationHref(item.href));
    if(!remedies.length){groups.push({kind:'unmapped',...gap,criteria:[gap.criterion],scopeNotes:[]});continue;}
    for(const remedy of remedies){
      const key=JSON.stringify([gap.questionId,gap.attemptId||'',remedy.lessonId||'',remedy.href]);
      let group=byKey.get(key);
      if(!group){group={kind:'lesson',questionId:gap.questionId,questionTitle:gap.questionTitle,subject:gap.subject,attemptId:gap.attemptId,href:gap.href,
        remedy:{lessonId:remedy.lessonId,title:remedy.title,href:remedy.href},criteria:[],scopeNotes:[]};byKey.set(key,group);groups.push(group);}
      if(!group.criteria.some(item=>item.id===gap.criterion.id))group.criteria.push(gap.criterion);
      if(remedy.scopeNote&&!group.scopeNotes.includes(remedy.scopeNote))group.scopeNotes.push(remedy.scopeNote);
    }
  }
  return groups;
}
