import {appendWorkbenchSummary} from './workbench-session.js';
export const PROTEIN_PATH_NOTE_ID='protein-alternative-quality';

// A cross-course path still saves only to its stated chemistry lesson. The
// route owner supplies a live epoch guard; disposed or missing contexts cannot write.
export function proteinPathNoteSaver({courses={},progresses={},isCurrent=()=>false}={}){
 const owner=progresses.chemistry,course=courses.chemistry;
 const matches=course?.topics?.flatMap(t=>t.lessons?.filter(l=>l.id===PROTEIN_PATH_NOTE_ID)??[])??[];
 if(!owner||matches.length!==1||(course.routeRoot!==undefined&&course.routeRoot!=='learn'))return null;
 return summary=>isCurrent()===true?appendWorkbenchSummary(owner,PROTEIN_PATH_NOTE_ID,summary):false;
}

export const DRYING_PATH_NOTE_ID='proc-drying-quality';
export function dryingPathNoteSaver({courses={},progresses={},isCurrent=()=>false}={}){
 const owner=progresses.processing,course=courses.processing;
 const matches=course?.topics?.flatMap(t=>t.lessons?.filter(l=>l.id===DRYING_PATH_NOTE_ID)??[])??[];
 if(!owner||matches.length!==1||(course.routeRoot!==undefined&&course.routeRoot!=='process'))return null;
 return summary=>isCurrent()===true?appendWorkbenchSummary(owner,DRYING_PATH_NOTE_ID,summary):false;
}

export const FERMENTATION_PATH_NOTE_ID='micro-starter-cultures';
export function fermentationPathNoteSaver({courses={},progresses={},isCurrent=()=>false}={}){
 const owner=progresses.microbiology,course=courses.microbiology;
 const matches=course?.topics?.flatMap(t=>t.lessons?.filter(l=>l.id===FERMENTATION_PATH_NOTE_ID)??[])??[];
 if(!owner||matches.length!==1||(course.routeRoot!==undefined&&course.routeRoot!=='micro'))return null;
 return summary=>isCurrent()===true?appendWorkbenchSummary(owner,FERMENTATION_PATH_NOTE_ID,summary):false;
}

export const THERMAL_EVIDENCE_NOTE_ID='micro-process-validation';
export function thermalEvidenceNoteSaver({courses={},progresses={},isCurrent=()=>false}={}){
 const owner=progresses.microbiology,course=courses.microbiology;
 const matches=course?.topics?.flatMap(t=>t.lessons?.filter(l=>l.id===THERMAL_EVIDENCE_NOTE_ID)??[])??[];
 if(!owner||matches.length!==1||(course.routeRoot!==undefined&&course.routeRoot!=='micro'))return null;
 return summary=>isCurrent()===true?appendWorkbenchSummary(owner,THERMAL_EVIDENCE_NOTE_ID,summary):false;
}

export const ENZYME_EVIDENCE_NOTE_ID='enzyme-initial-rate';
export function enzymeEvidenceNoteSaver({courses={},progresses={},isCurrent=()=>false}={}){
 const owner=progresses.chemistry,course=courses.chemistry;
 const matches=course?.topics?.flatMap(t=>t.lessons?.filter(l=>l.id===ENZYME_EVIDENCE_NOTE_ID)??[])??[];
 if(!owner||matches.length!==1||(course.routeRoot!==undefined&&course.routeRoot!=='learn'))return null;
 return summary=>isCurrent()===true?appendWorkbenchSummary(owner,ENZYME_EVIDENCE_NOTE_ID,summary):false;
}
