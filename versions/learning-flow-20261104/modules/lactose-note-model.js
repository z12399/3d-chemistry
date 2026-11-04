// Compatibility facade: the lactose lesson shares ordinary-course drafts while
// keeping the P3d API and its exact lesson identity.
import {learningNoteDraft,learningNoteMessage,saveLearningNote,appendLearningNoteSummary} from './learning-note-model.js';
export const LACTOSE_NOTE_LESSON_ID='carb-disaccharide-site-transfer';
export const lactoseNoteDraft=(progress,options)=>learningNoteDraft(progress,LACTOSE_NOTE_LESSON_ID,options);
export const lactoseNoteMessage=learningNoteMessage;
export const saveLactoseNote=(progress,note,options)=>saveLearningNote(progress,LACTOSE_NOTE_LESSON_ID,note,options);
export const appendLactoseNoteSummary=(progress,summary,options)=>appendLearningNoteSummary(progress,LACTOSE_NOTE_LESSON_ID,summary,options);
