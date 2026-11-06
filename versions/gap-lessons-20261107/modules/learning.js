import {searchLessons,matchingTopicLessons} from './learning-search.js';
import {LESSON_PRINCIPLES,principleFor} from './lesson-principles.js';
import {LESSON_FIGURES} from './lesson-figures.js';
import {renderStudyGuide,renderHomeWorkbenches} from './study-guide.js';
import {renderExamStartNavigation} from './exam-start-navigation.js';
import {renderTopicStart,renderTopicFollowup} from './topic-start-navigation.js';
import {mountLactaseLab} from './lactase-lab.js';
import {mountSugarChairLab} from './sugar-chair-lab.js';
import {mountProteinStructureLab} from './protein-structure-lab.js';
import {mountRheologyLab} from './rheology-lab.js';
import {mountCocoaStructureEvidence,COCOA_STRUCTURE_LAB_ID} from './cocoa-structure-lab.js';
import {mountBioticsEvidence,BIOTICS_LAB_ID} from './biotics-evidence-lab.js';
import {mountMaillardStorageLab,MAILLARD_STORAGE_LAB_ID} from './maillard-storage-lab.js';
import {mountSoyFermentationLab,SOY_FERMENTATION_LAB_ID} from './soy-fermentation-lab.js';
import {mountFermentationRedoxLab,FERMENTATION_REDOX_LAB_ID} from './fermentation-redox-lab.js';
import {mountGrowthEstimationLab} from './growth-estimation-lab.js';
import {mountMicroRiskLab,MICRO_RISK_LAB_ID} from './micro-risk-lab.js';
import {mountFlavonoidStructureLab,FLAVONOID_LAB_ID,readFlavonoidExposure,noteFlavonoidReferenceExposure} from './flavonoid-structure-lab.js';
import {mountFlavonoidRetrievalLab} from './flavonoid-retrieval-lab.js';
const flavonoidRetrievalDetailsByOwner=new WeakMap();
import {mountMicroCellLab,MICRO_CELL_LAB_ID} from './micro-cell-lab.js';
import {mountPhageLab,PHAGE_LAB_ID} from './phage-lab.js';
import {mountThermalSizeLab,THERMAL_SIZE_LAB_ID} from './thermal-size-lab.js';
import {mountEvaporationBalanceLab,EVAPORATION_BALANCE_ID} from './evaporation-balance-lab.js';
import {mountPackageTransportLab} from './package-transport-lab.js';
import {mountProteinQualityLab,PROTEIN_QUALITY_LAB_ID} from './protein-quality-lab.js';
import {mountProteinHydrationLab} from './protein-hydration-lab.js';
import {mountProteinSolventLab} from './protein-solvent-lab.js';
import {mountLyoprotectantStorageLab} from './lyoprotectant-storage-lab.js';
import {mountOsmoticDrivingLab} from './osmotic-driving-lab.js';
import {mountRosDefenseLab} from './ros-defense-lab.js';
import {mountDnaRepairLab} from './dna-repair-lab.js';
import {mountGarlicReactionLab} from './garlic-reaction-lab.js';
import {mountFermentationComparisonLab} from './fermentation-comparison-lab.js';
import {mountLipidCleavageLab} from './lipid-cleavage-lab.js';
import {mountNattoAmmoniaLab} from './natto-ammonia-lab.js';
import {mountInjuredCellLab} from './injured-cell-lab.js';
import {mountHeterocycleOriginLab} from './heterocycle-origin-lab.js';
import {mountRadicalLedgerLab} from './radical-ledger-lab.js';
import {mountProteinChargeLab} from './protein-charge-lab.js';
import {mountSporeSurvivalLab} from './spore-survival-lab.js';
import {mountMoistureBasisLab} from './moisture-basis-lab.js';
import {mountDryerAirLab} from './dryer-air-lab.js';
import {mountHurdleTableLab} from './hurdle-table-lab.js';
import {mountIllnessMechanismLab} from './illness-mechanism-lab.js';
import {mountThermalResistanceLab} from './thermal-resistance-lab.js';
import {mountGlycosideAbsorptionLab} from './glycoside-absorption-lab.js';
import {appendWorkbenchSummary} from './workbench-session.js';
import {mountProteinPathLab} from './protein-path-lab.js';
import {proteinPathNoteSaver,dryingPathNoteSaver,fermentationPathNoteSaver,thermalEvidenceNoteSaver,enzymeEvidenceNoteSaver} from './study-path-host.js';
import {mountFermentationPathLab} from './fermentation-path-lab.js';
import {mountThermalEvidenceLab} from './thermal-evidence-lab.js';
import {beginThermalRemedyReturn,thermalRemedyRouteContext,disposeThermalRemedyReturn,followThermalRemedyReturn,renderThermalRemedyReturnPrompt,renderThermalRemedyReturnLink} from './thermal-remedy-return.js';
import {mountEnzymeEvidenceLab} from './enzyme-evidence-lab.js';
import {mountAromaEvidenceLab} from './aroma-evidence-lab.js';
import {renderAromaLearningFlow} from './aroma-learning-flow.js';
import {mountPigmentComparisonLab} from './pigment-comparison-lab.js';
import {renderPigmentLearningFlow} from './pigment-learning-flow.js';
import {mountHfcsFoundationLab} from './hfcs-foundation-lab.js';
import {mountUnsaponifiableFoundationLab} from './unsaponifiable-foundation-lab.js';
import {foundationRemedyContext,renderFoundationRemedyPrompt,renderFoundationLearningFlow} from './foundation-learning-flow.js';
import {mountProteinFunctionLab} from './protein-function-lab.js';
import {proteinFunctionRemedyContext,renderProteinFunctionRemedyPrompt,renderProteinFunctionFlow} from './protein-function-flow.js';
import {mountProcessPrerequisiteLab} from './process-prerequisite-lab.js';
import {processPrerequisiteRemedyContext,renderProcessPrerequisiteRemedyPrompt,renderProcessPrerequisiteFlow} from './process-prerequisite-flow.js';
import {mountMicroFoundationLab} from './micro-foundation-lab.js';
import {microFoundationRemedyContext,renderMicroFoundationRemedyPrompt,renderMicroFoundationFlow} from './micro-foundation-flow.js';
import {mountLightTemperatureLab} from './light-temperature-lab.js';
import {lightTemperatureRemedyContext,renderLightTemperatureRemedyPrompt,renderLightTemperatureFlow} from './light-temperature-flow.js';
import {mountRetentionSizeLab} from './retention-size-lab.js';
import {retentionSizeRemedyContext,renderRetentionSizeRemedyPrompt,renderRetentionSizeFlow} from './retention-size-flow.js';
const retentionSizeDetailsByOwner=new WeakMap();
const lightTemperatureDetailsByOwner=new WeakMap();
const microFoundationDetailsByOwner=new WeakMap();
const processPrerequisiteDetailsByOwner=new WeakMap();
const proteinFunctionDetailsByOwner=new WeakMap();
const foundationDetailsByOwner=new WeakMap();
const pigmentComparisonDetailsByOwner=new WeakMap();
const aromaLegacyDetailsByOwner=new WeakMap();
const enzymeProgressDetailsByOwner=new WeakMap();
import {mountDryingPathLab} from './drying-path-lab.js';
import {mountBrowningComparisonLab} from './browning-comparison-lab.js';
import {mountUnsaponifiableLab} from './unsaponifiable-lab.js';
import {mountPoultryContaminationLab} from './poultry-contamination-lab.js';
import {mountNutrientRetentionLab} from './nutrient-retention-lab.js';
import {mountResveratrolEvidenceLab} from './resveratrol-evidence-lab.js';
import {mountAminoStereoLab} from './amino-stereo-lab.js';
import {mountHydrolysisIdentifiabilityLab} from './hydrolysis-identifiability-lab.js';
import {mountProteinQualityAxesLab} from './protein-quality-axes-lab.js';
import {mountPrecisionFermentationLab} from './precision-fermentation-lab.js';
import {mountFeedbackInhibitionLab} from './feedback-inhibition-lab.js';
import {mountCompetitiveExclusionLab} from './competitive-exclusion-lab.js';
import {mountCheeseProcessLab} from './cheese-process-lab.js';
import {mountMaltingBeerLab} from './malting-beer-lab.js';
import {mountSeafoodHazardLab} from './seafood-hazard-lab.js';
import {mountMisoSaltLab} from './miso-salt-lab.js';
import {mountEthanolPartitionLab} from './ethanol-partition-lab.js';
import {mountPigmentJointLab} from './pigment-joint-lab.js';
import {mountMnDefenseLab} from './mn-defense-lab.js';
import {mountColdRegionLab} from './cold-region-lab.js';
import {mountPackageFunctionsLab} from './package-functions-lab.js';
import {mountDryingChainLab} from './drying-chain-lab.js';
import {mountFermentationStateLab} from './fermentation-state-lab.js';
import {GROWTH_ESTIMATION_LAB_ID} from './growth-estimation-model.js';
import {mountResidenceTimeLab,RESIDENCE_TIME_LAB_ID} from './residence-time-lab.js';
import {mountThermalProcessComparisonLab,THERMAL_PROCESS_COMPARISON_LAB_ID} from './thermal-process-comparison-lab.js';
import {mountBlanchingEvidenceLab,BLANCHING_EVIDENCE_LAB_ID} from './blanching-evidence-lab.js';
import {mountMembraneBalanceLab,MEMBRANE_BALANCE_LAB_ID} from './membrane-balance-lab.js';
import {mountSupercriticalCo2Lab,SUPERCRITICAL_CO2_LAB_ID} from './supercritical-co2-lab.js';
import {mountMeatMapLab,MEAT_MAP_LAB_ID} from './meat-map-lab.js';
import {mountOutbreakEvidenceLab,OUTBREAK_LAB_ID} from './outbreak-evidence-lab.js';
import {mountFreezeCollapseLab,FREEZE_COLLAPSE_LAB_ID} from './freeze-collapse-lab.js';
import {mountNitrosationLab,NITROSATION_LAB_ID} from './nitrosation-lab.js';
import {mountOleateOxidationLab,OLEATE_OXIDATION_LAB_ID} from './oleate-oxidation-lab.js';
import {mountRiceMillingLab,RICE_MILLING_LAB_ID} from './rice-milling-lab.js';
import {mountQpcrLab,QPCR_LAB_ID} from './qpcr-lab.js';
import {mountXylanXylitolLab,XYLAN_LAB_ID} from './xylan-xylitol-lab.js';
import {mountCanningHeadspaceLab,CANNING_HEADSPACE_LAB_ID} from './canning-headspace-lab.js';
import {mountExtrusionLab,EXTRUSION_LAB_ID} from './extrusion-lab.js';
import {mountMicrobialEnzymeLab,MICRO_ENZYME_LAB_ID} from './microbial-enzyme-lab.js';
import {mountSakeFermentationLab,SAKE_LAB_ID} from './sake-fermentation-lab.js';
import {mountTagHydrolysisLab} from './tag-hydrolysis-lab.js';
import {VITAMIN_C_LAB_ID} from './vitamin-c-model.js';
import {mountVitaminCLab} from './vitamin-c-lab.js';
import {PIGMENT_LAB_ID} from './pigment-model.js';
import {mountPigmentLab} from './pigment-lab.js';
import {EMULSION_LAB_ID} from './emulsion-model.js';
import {mountEmulsionLab} from './emulsion-lab.js';
import {YOGURT_LAB_ID} from './yogurt-model.js';
import {mountYogurtLab} from './yogurt-lab.js';
import {mountMicroEvidenceLab} from './micro-evidence-lab.js';
import {MICRO_EVIDENCE_ID} from './micro-evidence-model.js';
import {mountHeatPenetrationLab} from './heat-penetration-lab.js';
import {HEAT_PENETRATION_ID} from './heat-penetration-model.js';
import {mountCalibrationLab} from './calibration-lab.js';
import {CALIBRATION_LAB_ID} from './calibration-model.js';
import {mountSensoryLab} from './sensory-lab.js';
import {SENSORY_EXPERIMENT_IDS} from './sensory-threshold-model.js';
import {mountFoodAnalysisLab} from './food-analysis-lab.js';
import {FOOD_ANALYSIS_ID} from './food-analysis-model.js';
import {mountStarchStructureLab,STARCH_STRUCTURE_LAB_ID} from './starch-structure-lab.js';
import {mountStarchDataLab,STARCH_DATA_LAB_ID} from './starch-data-lab.js';
import {pathContext,resolvePathView,resolvePathStations,decoratePath} from './learning-paths-model.js';
import {learningPathEntry,renderPathDirectory,renderPathOverview,renderPathBanner} from './learning-paths.js';
import {mountFryingDataLab,FRYING_LAB_ID} from './frying-data-lab.js';
import {escapeHTML as esc, downloadText} from './storage.js';
import {MoleculeViewer} from './viewer.js';
import {mountExperiment} from './food-experiments.js';
import {mountDepthExperiment,DEPTH_EXPERIMENT_IDS} from './food-depth-experiments.js';
import {mountLipidSites} from './lipid-sites.js';
import {mountLipidProducts} from './lipid-products.js';
import {mountWaterPhaseExperiment,WATER_PHASE_IDS} from './water-phase-experiments.js';
import {mountSorptionDataLab,SORPTION_LAB_ID} from './sorption-data-lab.js';
import {mountColloidExperiment,COLLOID_EXPERIMENT_IDS} from './colloid-experiments.js';
import {mountProcessingExperiment,PROCESSING_EXPERIMENT_IDS} from './processing-experiments.js';
import {mountMicrobiologyExperiment,MICROBIOLOGY_EXPERIMENT_IDS} from './microbiology-experiments.js';
import {mountThermalHistoryExperiment,THERMAL_HISTORY_EXPERIMENT_IDS} from './thermal-history-experiment.js';
import {mountRefrigerationExperiment,REFRIGERATION_EXPERIMENT_IDS} from './refrigeration-experiment.js';
import {mountPsychrometricExperiment,PSYCHROMETRIC_EXPERIMENT_IDS} from './psychrometric-experiment.js';
import {mountDryingRateExperiment,DRYING_RATE_EXPERIMENT_IDS} from './drying-rate-experiment.js';
import {mountOilRefiningExperiment,OIL_REFINING_EXPERIMENT_IDS} from './oil-refining-experiments.js';
import {mountAminoAcidExperiment,AMINO_ACID_EXPERIMENT_IDS} from './amino-acid-experiment.js';
import {mountPeptideExperiment,PEPTIDE_EXPERIMENT_IDS} from './peptide-experiment.js';
import {mountEnzymeKinetics,ENZYME_KINETICS_IDS} from './enzyme-kinetics-experiment.js';
import {mountElectronWorkbench,ELECTRON_WORKBENCH_IDS,hasUnsavedElectronDrafts} from './electron-workbench.js';
import {mountElectronLibrary,ELECTRON_LIBRARY_IDS,hasUnsavedElectronLibraryDrafts} from './electron-library.js';
import {hasUnsavedElectronSandboxDrafts} from './electron-sandbox.js';
import {LACTOSE_SITE_LESSON_ID} from './lactose-site-model.js';
import {mountLactoseSiteLab} from './lactose-site-lab.js';
import {mountHfcsProcessLab} from './hfcs-process-lab.js';
import {subjectForCourse,subjectNavigation,LEARNING_SUBJECTS,SUBJECT_CONNECTIONS} from './learning-subjects.js';
import {processingOverview} from './processing-overview.js';
import {microbiologyOverview} from './microbiology-overview.js';
import {renderPractice,bindPractice,practiceReviewEntries} from './learning-practice.js';
import {allLessons, lessonPath as makeLessonPath, resolveLearningRoute, learningSummary, quizRecordState, WATER_QUIZ_V2_KEY, LESSON_STEPS, MAX_LEARNING_IMPORT_BYTES} from './learning-model.js';
import {learningNoteDraft,learningNoteDraftEntries,learningNoteMessage,learningNoteStatus,saveLearningNote,appendLearningNoteSummary} from './learning-note-model.js';

const arrow = '<span aria-hidden="true">↗</span>';
const steps = ['理解原理','觀察變化','檢查理解'];
const CARB_FOCUS_ID = 'carb-ring-chain';
// The application creates a studio on each route change. Keep only this lesson's
// unsaved note with its existing progress object, including an intentional blank.
const carbNoteDrafts = new WeakMap();
const electronUnloadOwners = new WeakSet();
const lactoseLibraryDetailsByOwner = new WeakMap();
function protectUnsavedElectronDrafts(owner) {
  if (!owner || (typeof owner!=='object' && typeof owner!=='function') || electronUnloadOwners.has(owner) || typeof window==='undefined' || !window.addEventListener) return;
  // The listener belongs to this document's progress owner, so failed drafts
  // remain protected even after navigating away from the workbench.
  window.addEventListener('beforeunload',event=>{
    if (!hasUnsavedElectronDrafts(owner) && !hasUnsavedElectronSandboxDrafts(owner) && !hasUnsavedElectronLibraryDrafts(owner)) return;
    event.preventDefault(); event.returnValue='';
  });
  electronUnloadOwners.add(owner);
}
export class LearningStudio {
  constructor(root, {course, progress, courses={}, progresses={}, pathPositions=null, onSearch=()=>{}, molecules = [], onNavigate, onActivity, onToast = () => {}, onExport = downloadText}) {
    Object.assign(this, {root, course, progress, molecules, onNavigate, onActivity, onToast, onExport});
    this.disposals = []; this.query = ''; this.searchScope='all'; this.renderEpoch = 0;
    this.subject=subjectForCourse(course); this.base='#'+this.subject.root; this.courses={...courses,[this.subject.id]:course}; this.progresses={...progresses,[this.subject.id]:progress}; this.pathPositions=pathPositions; this.positions=pathPositions; this.onSearch=onSearch; this.pathContext=null;
    if(!carbNoteDrafts.has(progress))carbNoteDrafts.set(progress,new Map());
    this.carbNoteDrafts=carbNoteDrafts.get(progress);
    protectUnsavedElectronDrafts(progress);
  }
  lessonPath(topic,lesson,step='understand'){
    const canonical=makeLessonPath(topic,lesson,step,this.subject.root);
    return this.pathContext?decoratePath(canonical,this.pathContext.path.id,this.courses):canonical;
  }
  nextAction(lesson){
    if(this.pathContext){
      const {path,index}=this.pathContext,next=resolvePathStations(path,this.courses)[index+1];
      return next?.available?{href:decoratePath(makeLessonPath(next.topic,next.lesson,'understand',LEARNING_SUBJECTS[next.subject].root),path.id,this.courses),label:'下一站：'+next.label}:{href:'#paths/'+path.id,label:next?'回到路徑查看下一站':'返回問題路徑'};
    }
    const {topic}=this.route,next=topic.lessons[topic.lessons.indexOf(lesson)+1];
    return {href:next?this.lessonPath(topic,next):this.base+'/'+topic.id,label:next?'下一題：'+next.title:'回到本章目錄'};
  }
  connections(lesson){
    const targets=SUBJECT_CONNECTIONS.flatMap(pair=>{const index=pair.findIndex(([subject,id])=>subject===this.subject.id&&id===lesson.id);return index<0?[]:[pair[1-index]];});
    const links=targets.map(([id,lessonId])=>{const entry=allLessons(this.courses[id]).find(({lesson:l})=>l.id===lessonId);return entry?{...entry,subject:LEARNING_SUBJECTS[id]}:null;}).filter(Boolean);
    return links.length?`<details class="learning-connections"><summary>串起其他學科</summary><nav aria-label="跨科延伸">${links.map(({topic:t,lesson:l,subject})=>{const canonical=makeLessonPath(t,l,'understand',subject.root),href=this.pathContext?decoratePath(canonical,this.pathContext.path.id,this.courses):canonical,station=href!==canonical?pathContext(href,this.courses):null;const scope=station?` · 此路徑第 ${station.index+1} 站（可選跳站）`:this.pathContext?' · 一般課程（離開此路徑）':'';return `<a href="${esc(href)}"><small>${esc(subject.title)}${esc(scope)}</small>${esc(l.title)} ↗</a>`;}).join('')}</nav></details>`:'';
  }
  dispose() { disposeThermalRemedyReturn(this.progresses?.microbiology,this.foundationRemedy); this.renderEpoch++; this.disposals.splice(0).forEach(fn => fn()); this.root.removeAttribute?.('data-learning-lesson'); this.root.removeAttribute?.('data-learning-step'); }
  navigate(path) { this.onNavigate(path); }
  render(hash) {
    this.dispose();
    // Read other same-origin windows before computing home/resume or lesson UI.
    // refresh preserves this window's unsaved/conflicting drafts.
    this.progress.refresh?.();
    this.route = hash === '#guide' ? {view:'guide'} : resolvePathView(hash) || (/^#paths(?:[/?]|$)/.test(hash)?{view:'path',id:''}:resolveLearningRoute(hash, this.course));
    this.pathContext=pathContext(hash,this.courses);
    this.thermalSourceHash=hash;
    const thermalReturn=thermalRemedyRouteContext(this.progresses.microbiology,hash,this.courses);this.thermalReturnFocus=thermalReturn.focus;
    this.foundationRemedy=this.route.view==='lesson'?(foundationRemedyContext(hash,this.subject.id,this.route.lesson.id,this.route.step)||proteinFunctionRemedyContext(hash,this.subject.id,this.route.lesson.id,this.route.step)||processPrerequisiteRemedyContext(hash,this.subject.id,this.route.lesson.id,this.route.step)||microFoundationRemedyContext(hash,this.subject.id,this.route.lesson.id,this.route.step)||lightTemperatureRemedyContext(hash,this.subject.id,this.route.lesson.id,this.route.step)||retentionSizeRemedyContext(hash,this.subject.id,this.route.lesson.id,this.route.step)||thermalReturn.remedy):null;
    const query=new URLSearchParams(String(hash).split('?')[1]||'');
    this.invalidPathContext=query.has('path')&&!this.pathContext;
    this.query=this.route.view==='map'?(query.get('q')||'').slice(0,120):'';
    this.searchScope=Object.hasOwn(LEARNING_SUBJECTS,query.get('scope'))?query.get('scope'):'all';
    this.root.setAttribute?.('data-view',this.route.view);
    if (this.route.view === 'lesson') {
      const canonical=makeLessonPath(this.route.topic,this.route.lesson,this.route.step,this.subject.root);
      this.progress.visit(canonical);
      if(this.pathContext)this.pathPositions?.visit(this.pathContext.path.id,canonical,this.courses);
    }
    if(['paths','path','map'].includes(this.route.view))Object.values(this.progresses).forEach(p=>p?.refresh?.());
    this.root.className = 'learning-studio learning-'+this.subject.id;
    if(this.isFocusedCarb()){
      this.root.setAttribute('data-learning-lesson',CARB_FOCUS_ID);
      this.root.setAttribute('data-learning-step',this.route.step);
    }else{
      this.root.removeAttribute?.('data-learning-lesson');
      this.root.removeAttribute?.('data-learning-step');
    }
    this.root.innerHTML = this.route.view === 'guide' ? renderStudyGuide(this.courses) : this.route.view === 'paths' ? renderPathDirectory(this) : this.route.view === 'path' ? renderPathOverview(this.route.id,this) : this.route.view === 'home' ? this.home() : this.route.view === 'map' ? this.map() : this.route.view === 'topic' ? this.topic() : this.route.view === 'lesson' ? this.lesson() : this.route.view === 'review' ? this.review() : this.missing();
    this.root.querySelectorAll('[data-learn-go]').forEach(el => el.onclick = () => this.navigate(el.dataset.learnGo));
    this.bind();
    const heading=this.root.querySelector('h1');
    if(heading){heading.tabIndex=-1;heading.focus?.({preventScroll:true});}
    if(this.foundationRemedy){
      const r=this.foundationRemedy,target=this.root.querySelector(r.target==='equation'?'[data-foundation-equation]':'[data-foundation-paragraph="'+r.index+'"]'),status=this.root.querySelector('[data-foundation-remedy-status]');
      if(target&&typeof target.textContent==='string'&&target.textContent.includes(r.expectedQuote)){target.setAttribute?.('data-foundation-focused','true');target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'center',behavior:'auto'});if(['juice-mass-basis','fermentation-cfu'].includes(r.token)){const epoch=this.renderEpoch;requestAnimationFrame(()=>{if(this.renderEpoch!==epoch||window.location.hash!==hash||!this.root.isConnected||!target.isConnected||!this.root.contains(target)||!target.textContent.includes(r.expectedQuote)||document.activeElement!==target)return;target.scrollIntoView?.({block:'center',behavior:'auto'});});}}
      else if(status)status.textContent='這次未能自動定位指定文字，請依上方段落與引文核對；沒有改選別段。';
    }
    if(this.thermalReturnFocus){const target=this.root.querySelector(this.route.view==='path'?'#thermal-evidence-path-lab':'#thermal-evidence-lesson-lab');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'center',behavior:'auto'});}}
    if(hash==='#paths/fermentation-evidence-chain?focus=integration'){const epoch=this.renderEpoch;requestAnimationFrame(()=>{if(this.renderEpoch!==epoch||window.location.hash!==hash||!this.root.isConnected||document.activeElement!==heading)return;const target=this.root.querySelector('#fermentation-path-practice');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start',behavior:'auto'});}});}
  }
  topbar(label = '') {
    const topic=this.route?.topic,lesson=this.route?.lesson,isLesson=this.route?.view==='lesson';
    const record=isLesson?this.progress.data.records[lesson.id]||{}:{};
    const meta=isLesson?`<div class="learning-lesson-meta${this.isFocusedCarb()?' learning-carb-context':''}">${this.pathContext?'':`<span>單元 ${topic.lessons.indexOf(lesson)+1} / ${topic.lessons.length}</span>`}<button id="learning-star" aria-pressed="${!!record.starred}" title="加入待複習">${record.starred?'★ 已收藏':'☆ 收藏'}</button></div>`:'';
    return `<div class="study-location-line"><nav class="study-breadcrumb" aria-label="目前位置"><a href="${this.base}">首頁</a><span aria-hidden="true">/</span><a href="${this.base}/map">${esc(this.subject.title)}</a>${label?`<span aria-hidden="true">/</span>${isLesson&&topic?`<a href="${this.base}/${topic.id}">${esc(label)}</a>`:`<span aria-current="page">${esc(label)}</span>`}`:''}</nav>${meta}</div>`;
  }
  tools() { return '<details class="learning-tools-links"><summary>自由探索 3D 工具</summary><a href="#lab/library">糖類反應目錄 ↗</a><a href="#lab/explore">構象與能量 ↗</a><a href="#lab/compare">結構比較 ↗</a><a href="#lab/reaction">葡萄糖變旋 ↗</a><a href="#lab/notebook">3D 實驗筆記 ↗</a></details>'; }
  home() {
    const last = resolveLearningRoute(this.progress.data.lastPath, this.course);
    const icon=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    const icons={chemistry:icon('<path d="M9.5 3h5M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3M7.4 14.5h9.2"/>'),processing:icon('<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9"/>'),microbiology:icon('<rect x="4" y="8" width="16" height="8" rx="4"/><path d="M9 12h.01M13 11.5h.01M15.5 13h.01M7 8V5.5M12 8V5M17 8V5.5M7 16v2.5M12 16v3M17 16v2.5"/>')};
    return `<div class="study-home"><header class="study-welcome"><div><h1>開始學習</h1><p>依主題選入口，或直接從問題開始觀察。</p></div><a class="study-guide-link" href="#guide">使用說明 <span aria-hidden="true">→</span></a></header>
      <form class="study-search" id="study-search-form" role="search"><label class="sr-only" for="study-search">搜尋全部學科的課程</label><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="study-search" type="search" placeholder="搜尋課程" autocomplete="off" maxlength="120" required><button class="button-primary" type="submit">搜尋</button></form>
      ${renderExamStartNavigation({courses:this.courses,variant:'home'})}
      ${last.view==='lesson'?`<section class="study-resume" aria-label="最近學習"><div><small>最近學習 · ${esc(this.subject.title)}</small><h2>${esc(last.lesson.title)}</h2></div><a class="learning-primary" href="${this.lessonPath(last.topic,last.lesson,last.step)}">繼續學習 <span aria-hidden="true">→</span></a></section>`:''}
      <div class="study-subject-grid">${Object.values(LEARNING_SUBJECTS).map(subject=>{
        const course=this.courses[subject.id];
        const topics=subject.starts.map(id=>course?.topics.find(t=>t.id===id)).filter(Boolean);
        const lessonCount=(course?.topics||[]).reduce((count,topic)=>count+topic.lessons.length,0);
        return `<article class="study-subject-card"><header><span class="study-subject-icon" aria-hidden="true">${icons[subject.id]}</span><h2>${subject.title}</h2></header><p class="study-subject-count">${lessonCount} 個單元</p><div class="study-topic-shortcuts">${topics.map(t=>`<a href="#${subject.root}/${t.id}">${esc(t.title)} <span aria-hidden="true">→</span></a>`).join('')}</div><a class="study-subject-open" href="#${subject.root}/map" aria-label="${subject.title}：全部主題">全部主題 <span aria-hidden="true">→</span></a></article>`;
      }).join('')}</div>
      ${renderHomeWorkbenches(this.courses)}
      </div>`;
  }
  map() {
    return `<header class="learning-heading"><h1>課程目錄</h1></header><form class="study-search" id="learning-search-form" role="search"><label class="sr-only" for="learning-search">搜尋課程</label><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="learning-search" type="search" placeholder="搜尋課程" autocomplete="off" maxlength="120" value="${esc(this.query)}"><button type="submit" class="button-primary">搜尋</button></form>
      <fieldset class="study-search-scope" ${this.query.trim()?'':'hidden'}><legend class="sr-only">搜尋範圍</legend>${[{id:'all',title:'全部學科'},...Object.values(LEARNING_SUBJECTS)].map(subject=>`<label><input type="radio" name="search-scope" value="${subject.id}" ${this.searchScope===subject.id?'checked':''}>${subject.title}</label>`).join('')}</fieldset>
      <nav class="study-catalog-tabs" aria-label="瀏覽學科" ${this.query.trim()?'hidden':''}>${Object.values(LEARNING_SUBJECTS).map(s=>`<a href="#${s.root}/map" ${s.id===this.subject.id?'aria-current="page"':''}>${s.title}</a>`).join('')}</nav>
      <div id="learning-topic-results">${this.topicResults(this.query)}</div><details class="learning-sources"><summary>內容範圍與課綱依據</summary><p>${esc(this.subject.scope)}</p>${this.sourceList(this.course.sources.filter(s => /syll|course|curricul|ntou|tamu|ljubl|課綱/i.test(s.id + s.title)).map(s => s.id))}</details>`;
  }
  topicResults(query) {
    if(query.trim()){
      const matches=searchLessons(this.courses,query,this.searchScope||'all');
      return `<p class="learning-results-count" role="status">${matches.length} 個相關單元${this.searchScope==='all'?' · 全部學科':''}</p>${matches.length?`<div class="learning-unit-list">${matches.map(({subject,topic,lesson})=>this.unitRow(topic,lesson,undefined,subject)).join('')}</div>`:'<div class="learning-empty"><h2>無符合單元</h2><p>調整關鍵字或搜尋範圍。</p><button type="button" id="study-clear-search">清除搜尋</button></div>'}`;
    }
    return this.subject.groups.map(group=>`<section class="study-topic-group"><h2>${esc(group.title)}</h2><div class="study-topic-tree">${group.ids.map(id=>this.course.topics.find(t=>t.id===id)).filter(Boolean).map(topic=>`<details class="study-topic-branch"><summary><span class="study-topic-name">${esc(topic.title)}</span><span class="study-topic-count">${topic.lessons.length} 個單元</span></summary><div class="study-topic-lessons"><ol>${topic.lessons.map(lesson=>`<li><a href="${this.lessonPath(topic,lesson)}"><span>${esc(lesson.title)}</span>${this.progress.data.records[lesson.id]?.starred?'<small>已收藏</small>':'<span aria-hidden="true">→</span>'}</a></li>`).join('')}</ol><a class="study-topic-overview" href="${this.base}/${topic.id}">主題概覽 →</a></div></details>`).join('')}</div></section>`).join('');
  }
  unitRow(topic, lesson, i, subject=this.subject, showQuestion=i===undefined) {
    const record=this.progresses[subject.id]?.data.records[lesson.id];
    const quiz=quizRecordState(subject.id,lesson,this.progresses[subject.id]?.data.records);
    const passed=!quiz.blocked && quiz.record.answer!==undefined && quiz.record.answer===lesson.quiz?.answer;
    const href=subject.id===this.subject.id?this.lessonPath(topic,lesson):makeLessonPath(topic,lesson,'understand',subject.root);
    return `<a class="learning-unit" href="${href}"><span class="learning-index ${passed?'is-passed':''}" ${passed?'aria-label="自測通過"':'aria-hidden="true"'}>${passed?'✓':i!==undefined?String(i+1).padStart(2,'0'):'→'}</span><div>${i===undefined?`<span class="study-result-location">${esc(subject.title)} / ${esc(topic.title)}</span>`:''}<h3>${esc(lesson.title)}${record?.starred?'<small class="study-unit-saved">已收藏</small>':''}</h3>${showQuestion?`<p>${esc(lesson.question)}</p>`:''}</div>${arrow}</a>`;
  }
  topic() {
    const {topic}=this.route;
    const passed=topic.lessons.filter(l=>{const q=quizRecordState(this.subject.id,l,this.progress.data.records);return !q.blocked && q.record.answer!==undefined && q.record.answer===l.quiz?.answer;}).length;
    return `${this.topbar(topic.title)}<header class="learning-heading"><h1>${esc(topic.title)}</h1><p>${esc(topic.summary)}</p></header>${renderTopicStart({subject:this.subject,topic,courses:this.courses})}<div class="learning-topic-progress"><span>${passed} / ${topic.lessons.length} 個單元自測通過</span><div><i style="width:${passed/topic.lessons.length*100}%"></i></div></div><div class="study-view-tabs" role="tablist" aria-label="主題瀏覽方式"><button type="button" role="tab" id="study-tab-principles" aria-controls="study-topic-principles" aria-selected="true" data-topic-view="principles">原理總覽</button><button type="button" role="tab" id="study-tab-units" aria-controls="study-topic-unitview" aria-selected="false" data-topic-view="units" tabindex="-1">單元列表</button></div><section id="study-topic-principles" role="tabpanel" aria-labelledby="study-tab-principles" class="study-principles"><p class="study-principles-hint">每個細項的核心原理一次看完；點「說明」看要點、公式與常見誤解。</p><ol>${topic.lessons.map((lesson,i)=>`<li class="study-principle"><span class="study-principle-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><p class="study-principle-text">${esc(principleFor(lesson))}</p><p class="study-principle-source">${esc(lesson.title)}</p>${lesson.equation?`<p class="study-principle-formula">${esc(lesson.equation.text)}</p>`:''}</div><a class="study-principle-open" href="${this.lessonPath(topic,lesson,'understand')}" aria-label="${esc(lesson.title)}：原理說明">說明 <span aria-hidden="true">→</span></a></li>`).join('')}</ol></section><section id="study-topic-unitview" role="tabpanel" aria-labelledby="study-tab-units" hidden><label class="study-topic-search" for="study-topic-search"><span>單元搜尋</span><input id="study-topic-search" type="search" placeholder="輸入課名或關鍵字" maxlength="120"></label><div id="study-topic-units" class="learning-unit-list">${topic.lessons.map((lesson,i)=>this.unitRow(topic,lesson,i)).join('')}</div></section><a class="learning-back" href="${this.base}/map">← 返回知識目錄</a>`;
  }
  retentionSizeEntry(lesson) {
    if(this.subject.id!=='chemistry')return '';
    const branch=lesson.id==='vitamin-true-retention'?'retention':lesson.id==='colloid-size-distribution'?'size':null;if(!branch)return '';
    const label=branch==='retention'?'先選可比資料，再判總量、分母與來源':'先選量測基準，再推界面與可比範圍';
    return '<details id="retention-size-'+branch+'-details" class="learning-example-more foundation-entry"><summary>'+label+'</summary><p>先依問題選資料並寫下獨立推導，再自行開啟提示核對。診斷、示範、提示暴露與作答修訂分開保留；原觀察、模型與自測也可接續使用。儲存的是推理紀錄，不代表已精熟。</p><div id="retention-size-'+branch+'-lab"></div></details>';
  }
  lightTemperatureEntry(lesson) {
    if(this.subject.id!=='chemistry')return '';
    const branch=lesson.id==='vitamin-light'?'light':lesson.id==='processing-temperature'?'temperature':null;if(!branch)return '';
    const label=branch==='light'?'從光量與反應對象，寫出有條件的結論':'從速率常數到完整熱史，再判斷能推出什麼';
    return '<details id="light-temperature-'+branch+'-details" class="learning-example-more foundation-entry"><summary>'+label+'</summary><p>基礎已熟可跳診斷。先用給定記錄作正面計算與比較，再獨立寫條件改變後的短答；示範、提示與結構核對的曝光分開記錄。原觀察、模型與基本自測保留，有限欄位不代替短申論。</p><div id="light-temperature-'+branch+'-lab"></div></details>';
  }
  microFoundationEntry(lesson) {
    if(this.subject.id!=='microbiology')return '';
    const branch=lesson.id==='micro-spores'?'d-value':lesson.id==='micro-growth-cycle'?'cfu':null;if(!branch)return '';
    const label=branch==='d-value'?'先分存活模型的log尺度與適用條件':'先核CFU單位、原樣品分母與未檢出';
    return '<details id="micro-foundation-'+branch+'-details" class="learning-example-more foundation-entry"><summary>'+label+'</summary><p>已有基礎可跳診斷，直接做條件不同的資料判讀。必要時只補具名段落；示範、首次判斷、檢核與修訂分開。有限選項不代替短申論；原觀察與自測保留。</p><div id="micro-foundation-'+branch+'-lab"></div></details>';
  }
  processPrerequisiteEntry(lesson) {
    if(this.subject.id!=='processing')return '';
    const branch=lesson.id==='proc-vacuum-evaporation'?'evaporation':lesson.id==='proc-freeze-drying'?'freeze-drying':null;if(!branch)return '';
    const label=branch==='evaporation'?'先分液體、壓力與汽化所需的熱':'先分冰、殘留水與水蒸氣移除';
    return '<details id="process-prerequisite-'+branch+'-details" class="learning-example-more foundation-entry"><summary>'+label+'</summary><p>已懂可跳診斷，直接用不同條件的記錄作推論。補救只到具名原課段落，原答與修訂分開；示範另列，有限選項不代替短申論自評。原觀察例與自測保留。</p><div id="process-prerequisite-'+branch+'-lab"></div></details>';
  }
  proteinFunctionEntry(lesson) {
    if(this.subject.id!=='chemistry'||lesson.id!=='protein-hydrolysis')return '';
    return '<details id="protein-function-details" class="learning-example-more foundation-entry"><summary>先辨切割，再依條件權衡功能</summary><p>基礎已熟可跳過診斷。由示範短答走到條件不同的遷移；有限選項與自由文推理分開核對。初答、當時回饋與修訂保留，摘要附加本課筆記。下方原例與結構自測保留。</p><div id="protein-function-lab"></div></details>';
  }
  foundationReturn(target,index=null) {
    const r=this.foundationRemedy;if(!r||r.target!==target||(target==='explanation'&&r.index!==index))return '';
    if(r.kind==='thermal-return')return '<p class="foundation-remedy-return">'+renderThermalRemedyReturnLink(r)+'</p>';
    const destination=r.token==='juice-mass-basis'?'回果汁濃縮路徑':r.token==='fermentation-cfu'?'回發酵路徑整合練習':'回原題診斷';
    return `<p class="foundation-remedy-return"><a href="${esc(r.returnHref)}">讀完這一段，${destination} →</a></p>`;
  }
  foundationEntry(lesson) {
    if(this.subject.id!=='chemistry')return '';
    const kind=lesson.id==='carb-hfcs-process'?'hfcs':lesson.id==='lipid-unsaponifiable-fraction'?'unsapon':null;
    if(!kind)return '';
    const label=kind==='hfcs'?'先備診斷：從鍵、還原端到異構酶入口':'先備診斷：從酯兩端到操作分段';
    return `<details id="foundation-${kind}-details" class="learning-example-more foundation-entry"><summary>${label}</summary><p>已有基礎可直接跳到原工作台；要檢查理解，先答局部診斷，再做條件不同的遷移。錯答可補讀指定段落後回來，首次回答與修訂分開保留。</p><div id="foundation-${kind}-lab"></div></details>`;
  }
  principle(lesson) {
    const m=lesson.misconception;
    return `<article class="learning-understand principle-page"><section class="principle-core" aria-labelledby="principle-core-title"><h2 id="principle-core-title" class="principle-label">核心原理</h2><p class="learning-takeaway">${esc(principleFor(lesson))}</p>${LESSON_PRINCIPLES[lesson.id]?`<p class="principle-conclusion"><span class="principle-conclusion-label">本課結論</span>${esc(lesson.takeaway)}</p>`:''}</section>`
         +(LESSON_FIGURES[lesson.id]?(f=>`<figure class="principle-figure"><div class="principle-figure-frame" tabindex="0" role="group" aria-label="示意圖（窄螢幕可左右捲動）"><img src="figures/${f.file}" width="${f.width}" height="${f.height}" alt="${esc(f.alt)}" loading="lazy" decoding="async"></div><p class="principle-figure-hint" aria-hidden="true">← 左右滑動看完整圖 →</p><figcaption>${esc(f.caption)}</figcaption></figure>`)(LESSON_FIGURES[lesson.id]):'')
      +`<section class="principle-points" aria-labelledby="principle-points-title"><h2 id="principle-points-title" class="principle-label">原理說明</h2><ol class="learning-prose principle-list">${lesson.explanation.map((p,i) => `<li data-foundation-paragraph="${i}">${esc(p)}${this.foundationReturn('explanation',i)}</li>`).join('')}</ol></section>`
      +(lesson.equation?`<section class="principle-formula" aria-labelledby="principle-formula-title"><h2 id="principle-formula-title" class="principle-label">關鍵公式</h2>${this.equation(lesson)}</section>`:'')
      +(m?`<section class="principle-pitfall" aria-labelledby="principle-pitfall-title"><h2 id="principle-pitfall-title" class="principle-label">常見誤解</h2><p class="pitfall-claim"><span aria-hidden="true">✗</span>${esc(m.claim)}</p><p class="pitfall-fix"><span aria-hidden="true">✓</span>${esc(m.correction)}</p></section>`:'')
      +`</article>`;
  }
  equation(lesson) {
    return `<figure class="learning-equation" data-foundation-equation><figcaption>${esc(lesson.equation.label)}</figcaption><p>${esc(lesson.equation.text)}</p><small>${esc(lesson.equation.note)}</small>${this.foundationReturn('equation')}</figure>`;
  }
  lesson() {
    const {topic, lesson, step} = this.route;
    const index = topic.lessons.indexOf(lesson);
    const current = LESSON_STEPS.indexOf(step);
    const record = this.progress.data.records[lesson.id] || {};
    if(this.isFocusedCarb(lesson))return this.carbLesson(topic,lesson,step,record);
    const noteDraft=learningNoteDraft(this.progress,lesson.id,{check:true});
    this.noteBase=noteDraft?.baseNote??record.note??'';
    return `${this.topbar(topic.title)}${this.pathContext?renderPathBanner(this.pathContext,this.pathPositions?.error):''}${this.invalidPathContext?'<p class="path-storage-warning">這個單元不在指定路徑中，已開啟一般課程。<a href="#paths">查看食品問題路徑 →</a></p>':''}
    <header class="learning-heading learning-question"><h1>${esc(lesson.title)}</h1><p class="study-lesson-question"><span class="study-question-label">本課要回答</span>${esc(lesson.question)}</p></header>
    <nav class="learning-steps" aria-label="本題學習步驟">${LESSON_STEPS.map((s,i) => `<a href="${this.lessonPath(topic,lesson,s)}" ${s === step?'aria-current="step"':''}><span>${i+1}</span>${steps[i]}</a>`).join('')}</nav>
    <div id="${this.notePendingId(lesson)}" class="learning-storage-status" ${noteDraft?'':'hidden'}>${this.notePending(topic,lesson)}</div>
    <div class="learning-lesson-content">${current === 0 ? (renderThermalRemedyReturnPrompt(this.foundationRemedy)||renderFoundationRemedyPrompt(this.foundationRemedy)||renderProteinFunctionRemedyPrompt(this.foundationRemedy)||renderProcessPrerequisiteRemedyPrompt(this.foundationRemedy)||renderMicroFoundationRemedyPrompt(this.foundationRemedy)||renderLightTemperatureRemedyPrompt(this.foundationRemedy)||renderRetentionSizeRemedyPrompt(this.foundationRemedy))+(this.foundationRemedy?'<p class="learning-small" role="status" data-foundation-remedy-status></p>':'')+this.principle(lesson)+renderAromaLearningFlow(lesson.id,'understand')+renderPigmentLearningFlow(lesson.id,'understand')+renderFoundationLearningFlow(lesson.id,'understand')+renderProteinFunctionFlow(lesson.id,'understand')+renderProcessPrerequisiteFlow(lesson.id,'understand')+renderMicroFoundationFlow(lesson.id,'understand')+renderLightTemperatureFlow(lesson.id,'understand')+renderRetentionSizeFlow(lesson.id,'understand') : current === 1 ? renderAromaLearningFlow(lesson.id,'observe')+renderPigmentLearningFlow(lesson.id,'observe')+renderFoundationLearningFlow(lesson.id,'observe')+renderProteinFunctionFlow(lesson.id,'observe')+renderProcessPrerequisiteFlow(lesson.id,'observe')+renderMicroFoundationFlow(lesson.id,'observe')+renderLightTemperatureFlow(lesson.id,'observe')+renderRetentionSizeFlow(lesson.id,'observe')+this.retentionSizeEntry(lesson)+this.lightTemperatureEntry(lesson)+this.microFoundationEntry(lesson)+this.observation(lesson) : renderAromaLearningFlow(lesson.id,'check')+renderPigmentLearningFlow(lesson.id,'check')+renderFoundationLearningFlow(lesson.id,'check')+renderProteinFunctionFlow(lesson.id,'check')+renderProcessPrerequisiteFlow(lesson.id,'check')+renderMicroFoundationFlow(lesson.id,'check')+renderLightTemperatureFlow(lesson.id,'check')+renderRetentionSizeFlow(lesson.id,'check')+this.check(lesson,record)}</div>
    <div class="learning-lesson-footer"><span id="learning-storage-status" role="status">${esc(noteDraft?'本課筆記尚未保存；未保存筆記不包含在匯出，重新整理或關頁前請先複製。':this.noteExportMessage()||this.progress.error || '進度保存在此瀏覽器')}</span>${current === 0 ? `<a class="button-primary learning-primary" href="${this.lessonPath(topic,lesson,'observe')}">觀察變化 →</a>` : current === 1 ? `<a class="button-primary learning-primary" href="${this.lessonPath(topic,lesson,'check')}">檢查理解 →</a>` : ''}</div>
    ${this.connections(lesson)}<details class="learning-sources"><summary>來源與延伸閱讀</summary>${this.sourceList(lesson.sourceIds)}${this.examReferences(lesson)}${lesson.related?.length ? `<div class="learning-related">${lesson.related.map(id => allLessons(this.course).find(x => x.lesson.id === id)).filter(Boolean).map(({topic:t,lesson:l}) => `<a href="${this.lessonPath(t,l)}">${esc(l.title)} ↗</a>`).join('')}</div>` : ''}</details>`;
  }
  isFocusedCarb(lesson=this.route?.lesson) {
    return this.subject.id==='chemistry'&&this.route?.view==='lesson'&&this.route.lesson?.id===CARB_FOCUS_ID&&lesson?.id===CARB_FOCUS_ID;
  }
  isLactoseNote(lesson=this.route?.lesson) {
    return this.subject.id==='chemistry'&&this.route?.view==='lesson'&&this.route.lesson?.id===LACTOSE_SITE_LESSON_ID&&lesson?.id===LACTOSE_SITE_LESSON_ID;
  }
  notePendingId(lesson){return lesson.id===LACTOSE_SITE_LESSON_ID&&this.subject.id==='chemistry'?'learning-lactose-note-pending':'learning-note-pending';}
  noteReturnId(lesson){return lesson.id===LACTOSE_SITE_LESSON_ID&&this.subject.id==='chemistry'?'learning-lactose-note-return':'learning-note-return';}
  notePending(topic,lesson){
    const draft=learningNoteDraft(this.progress,lesson.id);
    return draft?`<p>${esc(learningNoteMessage(draft,this.progress))} <a id="${this.noteReturnId(lesson)}" href="${esc(this.lessonPath(topic,lesson,'check'))}" data-note-return="${esc(lesson.id)}">回到筆記，複製或重試 →</a></p>`:'';
  }
  lessonNote(lesson,record){
    const draft=learningNoteDraft(this.progress,lesson.id,{check:true}),note=draft?draft.note:record.note||'';
    this.noteBase=draft?.baseNote??record.note??'';
    const status=learningNoteStatus(this.progress,lesson.id,note),lactose=this.isLactoseNote(lesson);
    return `<details class="learning-fieldnote${lactose?' learning-lactose-note':''}" id="${lactose?'learning-lactose-note':'learning-lesson-note'}" ${draft||record.note?'open':''}><summary>學習筆記</summary><label${lactose?'':' class="sr-only"'} for="learning-note">本題學習筆記</label><textarea id="learning-note" maxlength="10000" rows="${lactose?4:3}" aria-describedby="learning-note-status" placeholder="筆記內容">\n${esc(note)}</textarea><div class="learning-carb-note-status"><span id="learning-note-status" role="status" aria-live="off">${esc(status)}</span><button id="learning-note-retry" type="button" style="min-height:44px" ${draft?'':'hidden'} ${draft?.conflict?'disabled':''}>重試保存筆記</button></div><div id="learning-note-conflict" ${draft?.conflict?'':'hidden'}><p>兩份筆記不同，已停止本頁重試；請先分別複製，重新載入後再比較。</p><label for="learning-note-remote">偵測衝突時，另一頁已保存的筆記</label><textarea id="learning-note-remote" rows="3" readonly>\n${esc(draft?.remoteNote||'')}</textarea></div></details>`;
  }
  updateLessonNoteStatus(saved,id=this.route?.lesson?.id,{explicit=false}={}){
    const draft=learningNoteDraft(this.progress,id),$=s=>this.root.querySelector(s);
    // The subject can have drafts in other lessons; repaint only this lesson.
    if(this.route?.view==='lesson'&&this.route.lesson?.id===id&&!this.isFocusedCarb()){
      const status=$('#learning-note-status'),message=saved===true?'已保存在此瀏覽器':learningNoteMessage(draft,this.progress);
      if(status){status.setAttribute?.('aria-live',explicit?'polite':'off');if(status.textContent!==message)status.textContent=message;}
      const field=$('#learning-note'),note=draft?draft.note:this.progress.data.records[id]?.note||'';
      if(field&&field.value!==note)field.value=note;
      const retry=$('#learning-note-retry');if(retry){retry.hidden=!draft;retry.disabled=!!draft?.conflict;}
      const conflict=$('#learning-note-conflict');if(conflict)conflict.hidden=!draft?.conflict;
      const remote=$('#learning-note-remote');if(remote)remote.value=draft?.remoteNote||'';
      const pending=$('#'+this.notePendingId(this.route.lesson));if(pending){pending.hidden=!draft;pending.innerHTML=this.notePending(this.route.topic,this.route.lesson);this.bindNoteReturn();}
      if(saved===true)this.noteBase=note;
    }
    this.storageStatus();return saved;
  }
  bindNoteReturn(){
    const links=[...this.root.querySelectorAll('[data-note-return]')],epoch=this.renderEpoch;
    // A pending fragment can be replaced after saving without a full render.
    const current=this.route?.lesson&&this.root.querySelector('#'+this.noteReturnId(this.route.lesson));
    if(current&&!links.includes(current))links.push(current);
    links.forEach(link=>link.onclick=e=>{
      if(this.renderEpoch!==epoch){e.preventDefault();return;}
      if(this.route?.view!=='lesson'||this.route.step!=='check'||link.dataset.noteReturn!==this.route.lesson.id)return;
      e.preventDefault();const field=this.root.querySelector('#learning-note');
      for(let parent=field?.parentElement;parent&&parent!==this.root;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
      field?.focus?.({preventScroll:true});field?.scrollIntoView?.({block:'center',behavior:'instant'});
    });
  }
  noteExportMessage(){
    return learningNoteDraftEntries(this.progress).length?'本學科有筆記尚未保存；尚未保存筆記不包含在匯出。返回各課複製或重試，重新整理或關頁前請先複製。':'';
  }
  noteExportWarning(){
    const entries=learningNoteDraftEntries(this.progress).map(([id])=>allLessons(this.course).find(({lesson})=>lesson.id===id)).filter(Boolean);
    if(!entries.length)return '';
    const lactoseOnly=entries.length===1&&entries[0].lesson.id===LACTOSE_SITE_LESSON_ID&&this.subject.id==='chemistry';
    return `<div id="${lactoseOnly?'learning-lactose-note-pending':'learning-note-pending'}" class="learning-storage-status"><p>${esc(this.noteExportMessage())}</p>${entries.map(({topic,lesson})=>`<p><a id="${this.noteReturnId(lesson)}${entries.length>1?'-'+esc(lesson.id):''}" data-note-return="${esc(lesson.id)}" href="${esc(this.lessonPath(topic,lesson,'check'))}">返回${esc(lesson.title)}，複製或重試 →</a></p>`).join('')}</div>`;
  }
  lactosePractice(lesson,record){
    const html=renderPractice(lesson.practice,record.practice),latest=this.progress.readLatest();
    const persisted=latest?.records[lesson.id]?.practice,current=record.practice;
    const message=latest===null?'目前無法確認作答保存狀態；請先複製文字，並保留原始資料。':JSON.stringify(current)!==JSON.stringify(persisted)?'本頁作答尚未保存至瀏覽器；草稿仍保留，可先複製或從筆記與複習匯出。':current?'目前這份作答已保存在此瀏覽器。':'可先寫想法，也可以先看提示。';
    return html.replace(/(<span id="practice-save-status" role="status">)[\s\S]*?(<\/span>)/,(_match,start,end)=>start+esc(message)+end);
  }
  carbLesson(topic,lesson,step,record) {
    const current=LESSON_STEPS.indexOf(step),draft=this.carbNoteDrafts.get(lesson.id);
    const purposes=['辨別配置與構象','追蹤開環與閉環','作答並留下筆記'];
    return `${this.topbar(topic.title)}${this.pathContext?renderPathBanner(this.pathContext,this.pathPositions?.error):''}${this.invalidPathContext?'<p class="path-storage-warning">這個單元不在指定路徑中，已開啟一般課程。<a href="#paths">查看食品問題路徑 →</a></p>':''}
    
    <header class="learning-heading learning-question"><h1>${esc(lesson.title)}</h1><p class="study-lesson-question"><span class="study-question-label">本課要回答</span>${esc(lesson.question)}</p></header>
    <nav class="learning-steps" aria-label="本題學習步驟">${LESSON_STEPS.map((s,i)=>`<a href="${this.lessonPath(topic,lesson,s)}" ${s===step?'aria-current="step"':''}><span aria-hidden="true">${i+1}</span><div><strong>${steps[i]}</strong><small>${purposes[i]}</small></div></a>`).join('')}</nav>
    ${draft&&current!==2?`<p class="learning-carb-draft-warning" role="status">本題筆記尚未保存，文字仍保留於本次頁面。<a href="${this.lessonPath(topic,lesson,'check')}">回到筆記重試 →</a> 關頁或重新整理前請先複製。</p>`:''}
    <div class="learning-lesson-content">${current===0?`<article class="learning-understand"><p class="learning-takeaway">${esc(lesson.takeaway)}</p><div class="learning-prose">${lesson.explanation.map(p=>`<p>${esc(p)}</p>`).join('')}</div>${this.equation(lesson)}</article>`:current===1?this.carbObservation(lesson):this.check(lesson,record)}</div>
    <div class="learning-lesson-footer"><span id="learning-storage-status" role="status">${esc(draft?'本題筆記尚未保存；關頁前請先複製。':this.progress.error||'學習紀錄保存在此瀏覽器')}</span>${current===0?`<a class="button-primary learning-primary" href="${this.lessonPath(topic,lesson,'observe')}">觀察 C1 變化 →</a>`:current===1?`<a class="button-primary learning-primary" href="${this.lessonPath(topic,lesson,'check')}">檢查理解 →</a>`:''}</div>
    ${this.connections(lesson)}<details class="learning-sources"><summary>來源與延伸閱讀</summary>${this.sourceList(lesson.sourceIds)}${this.examReferences(lesson)}${lesson.related?.length?`<div class="learning-related">${lesson.related.map(id=>allLessons(this.course).find(x=>x.lesson.id===id)).filter(Boolean).map(({topic:t,lesson:l})=>`<a href="${this.lessonPath(t,l)}">${esc(l.title)} ↗</a>`).join('')}</div>`:''}</details>`;
  }
  carbObservation(lesson) {
    return `<article class="learning-carb-observe"><section class="learning-carb-guide" aria-labelledby="learning-carb-observe-title"><p class="learning-kicker">在 3D 中追蹤同一個 C1</p><h2 id="learning-carb-observe-title">觀察 C1 的開環與閉環</h2><p>看 C1 如何由環狀的四面體中心，回到開鏈的平面羰基，再從不同面閉環。</p><button class="button-primary learning-primary" id="learning-open-activity" type="button">${esc(lesson.activity.label)} · 開啟 3D ↗</button><p id="learning-carb-return" class="learning-carb-return">操作後，用工具上方「回到這一題」返回；再到「檢查理解」作答。</p><p class="learning-carb-model-note">酸催化變旋機構的教學示意。原子與電子流用來對照結構；動畫不是實際反應軌跡。</p></section><section class="learning-carb-food" aria-labelledby="learning-carb-food-title"><p class="learning-kicker">${esc(lesson.example.food)}</p><h2 id="learning-carb-food-title">${esc(lesson.example.observation)}</h2><p>${esc(lesson.takeaway)}</p><div id="learning-case-explanation"><p>${esc(lesson.example.reason)}</p>${this.equation(lesson)}</div></section></article>`;
  }
  carbNote(record) {
    const draft=this.carbNoteDrafts.get(CARB_FOCUS_ID),note=draft?draft.note:record.note||'';
    const status=draft?this.carbNoteMessage(draft):this.progress.error?'目前保存狀態有問題；請保留文字，並確認下方狀態。':record.note?'已保存在此瀏覽器':'輸入後自動保存在此瀏覽器。';
    // HTML ignores one LF immediately after a textarea start tag. Supply that
    // parser-only LF so any LF at the beginning of the learner's text survives.
    return `<section class="learning-fieldnote learning-carb-note" aria-labelledby="learning-note-label"><div class="learning-carb-note-heading"><label id="learning-note-label" for="learning-note">學習筆記</label><span>自動保存在此瀏覽器</span></div><p>用自己的話說明：為什麼轉動視角或一般單鍵，不能把 α 換成 β？也可以留下還不懂的地方。</p><textarea id="learning-note" maxlength="10000" rows="4" aria-describedby="learning-note-status" placeholder="寫下你對 C1 開環、平面羰基與重新閉環的理解。">\n${esc(note)}</textarea><div class="learning-carb-note-status"><span id="learning-note-status" role="status" aria-live="off">${esc(status)}</span><button id="learning-note-retry" type="button" ${draft?'':'hidden'} ${draft?.conflict?'disabled':''}>重試保存筆記</button></div><div id="learning-note-conflict" ${draft?.conflict?'':'hidden'}><p>兩個視窗的筆記不同，已停止本頁重試。先分別複製兩份文字，再重新載入比較；不會自動覆寫另一頁。</p><label for="learning-note-remote">偵測衝突時，另一頁已保存的筆記</label><textarea id="learning-note-remote" rows="3" readonly>\n${esc(draft?.remoteNote||'')}</textarea></div></section>`;
  }
  carbNoteMessage(draft) {
    if(draft.conflict)return `尚未保存。${draft.error} 已停止本頁重試；請分別複製兩份筆記，再重新載入比較。`;
    return `尚未保存。${draft.error||'此瀏覽器目前無法寫入。'} 文字仍保留；可重試，關頁或重新整理前請先複製。`;
  }
  saveCarbNote(note,{explicit=false}={}) {
    const previous=this.carbNoteDrafts.get(CARB_FOCUS_ID);
    const draft=previous?.conflict?{...previous,note}:{note,error:''};this.carbNoteDrafts.set(CARB_FOCUS_ID,draft);
    let saved;
    if(draft.conflict)saved=null;
    else try{saved=this.progress.record(CARB_FOCUS_ID,{note});}catch(error){this.progress.error=error.message;saved=null;}
    if(saved===true)this.carbNoteDrafts.delete(CARB_FOCUS_ID);
    else{
      draft.error=draft.error||this.progress.error||'此瀏覽器目前無法寫入。';
      if(!draft.conflict&&/另一個視窗/.test(draft.error)){
        draft.conflict=true;
        const remote=this.progress.readLatest?.();
        draft.remoteNote=remote?.records[CARB_FOCUS_ID]?.note||'';
      }
    }
    const status=this.root.querySelector('#learning-note-status');
    if(status){status.setAttribute?.('aria-live',explicit?'polite':'off');const message=saved===true?'已保存在此瀏覽器':this.carbNoteMessage(draft);if(status.textContent!==message)status.textContent=message;}
    const retry=this.root.querySelector('#learning-note-retry');if(retry){retry.hidden=saved===true;retry.disabled=!!draft.conflict;}
    const conflict=this.root.querySelector('#learning-note-conflict');if(conflict)conflict.hidden=!draft.conflict;
    const remote=this.root.querySelector('#learning-note-remote');if(remote)remote.value=draft.remoteNote||'';
    this.storageStatus();return saved;
  }
  examReferences(lesson) {
    const refs=(lesson.examRefs || []).filter(r=>/^https:\/\//.test(r.url));
    return refs.length ? `<div class="learning-exam-refs"><h3>與歷屆題的連結</h3><p>以下是能力對應；本頁練習為原創，參考推理不是官方解答。</p><ul>${refs.map(ref=>`<li><a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">臺大 ${esc(ref.year)} · ${esc(ref.question)} ↗</a><span>${esc(ref.note)}</span></li>`).join('')}</ul></div>` : '';
  }
  observation(lesson) {
    const activity = lesson.activity;
    // This activity balances specified flows; pressure response belongs to the following ideal model.
    const membraneTarget = this.subject.id==='processing' && lesson.id==='proc-membrane-driving' && activity?.id===MEMBRANE_BALANCE_LAB_ID
      ? allLessons(this.course).find(({lesson:target})=>target.id==='proc-osmotic-driving') : null;
    const membraneBridge = membraneTarget ? `<p id="membrane-osmotic-bridge" class="learning-activity-scope">此處依指定透過比例做收支；比較壓差與水流的理想模型，見<a href="${esc(this.lessonPath(membraneTarget.topic,membraneTarget.lesson))}">${esc(membraneTarget.lesson.title)} →</a>。</p>` : '';
    if(lesson.id==='flavor-maillard-aroma'&&this.subject.id==='chemistry'&&activity?.id==='heterocycle-origin')return `<section id="aroma-evidence-practice" aria-label="吡嗪生成與香氣證據判讀"><h2>先分生成、存留、取樣與感知</h2><p>用指定條件的兩案檢查每一層可報告什麼；端點存量不自動等於累積生成量。可先作判斷，再看示範與證據；摘要附加本課筆記，原練習與答案保持。</p><div id="aroma-evidence-observe-lab"></div></section><details id="aroma-heterocycle-extension" class="learning-example-more"><summary>延伸：原五元雜環的雜原子來源與加工題材</summary><p>此台保留原前驅物、加工情境、首次回答與修訂。呋喃、吡咯與噻吩是五元環；本課主問題的吡嗪是含兩個N的六元環，不能用元素必要條件表代替其生成機制或定量證據。</p><p class="learning-activity-scope">${esc(activity.note||'')}</p><div id="learning-experiment"></div></details><details class="learning-example-more"><summary>連到食品：${esc(lesson.example.food)}</summary><p>${esc(lesson.example.observation)}</p><p>${esc(lesson.example.reason)}</p></details>`;
    if(lesson.id==='enzyme-initial-rate'&&this.subject.id==='chemistry'&&activity?.id==='enzyme-initial-rate')return `<section id="enzyme-evidence-practice" aria-label="由訊號到初速的量測取證"><h2>先問這個讀值代表什麼</h2><p>先寫初判，再按問題開啟證據。已掌握基本換算，可直接處理第二個未見案件；示範與提示另行記錄。完整摘要存入本課筆記，與酵素路徑共用草稿。</p><div id="enzyme-evidence-observe-lab"></div></section><details id="enzyme-mm-extension" class="learning-example-more"><summary>已有MM基礎後再看：指定模型的耗損與量測視窗</summary><p>下方沿用既有MM耗損模型，已給定Km與Vmax，沒有空白或訊號校正。它從準穩態之後的模型t=0起算，供比較視窗平均斜率與模型導數。可先補<a href="#learn/enzymes/enzyme-saturation/understand">初速飽和模型</a>與<a href="#learn/enzymes/enzyme-steady-state/understand">準穩態的生成／消失通量</a>再回來。</p><p class="learning-activity-scope">${esc(activity.note||'')}</p><div id="learning-experiment"></div></details><details class="learning-example-more"><summary>連到食品：${esc(lesson.example.food)}</summary><p>${esc(lesson.example.observation)}</p><p>${esc(lesson.example.reason)}</p></details>`;
    if (activity?.type==='experiment' && lesson.id===LACTOSE_SITE_LESSON_ID && ELECTRON_LIBRARY_IDS.includes(activity.id)) return `<div id="learning-lactose-site"></div><p class="learning-activity-scope lactose-site-original-scope">${esc(activity.note || '')} 本課提供中性 3D 端點與一般半縮醛教材推導的有限三步酸示意；沒有將計算示意當作乳糖實測路徑或完整自由箭推評分。下方工作台保留原糖苷水解路徑。</p><details id="lactose-site-workbench-details" class="lactose-site-original"><summary id="lactose-existing-workbench" tabindex="-1">再看已建的糖苷水解電子工作台</summary><div id="learning-experiment"></div></details><details class="learning-example-more"><summary>連到食品：${esc(lesson.example.food)}</summary><p>${esc(lesson.example.observation)}</p><p>${esc(lesson.example.reason)}</p></details>`;
    if (activity?.type === 'experiment') return `${activity.note && activity.id!=='lipid-atlas' && activity.id!=='human-lactase-evidence' && activity.id!=='sugar-chair-foundations' && activity.id!=='protein-structure-evidence' && activity.id!=='rheology-flow-evidence' && activity.id!==COCOA_STRUCTURE_LAB_ID && activity.id!==BIOTICS_LAB_ID && activity.id!==MAILLARD_STORAGE_LAB_ID && activity.id!==SOY_FERMENTATION_LAB_ID && activity.id!==FERMENTATION_REDOX_LAB_ID && activity.id!==GROWTH_ESTIMATION_LAB_ID && activity.id!==MICRO_RISK_LAB_ID && activity.id!==FLAVONOID_LAB_ID && activity.id!==MICRO_CELL_LAB_ID && activity.id!==PHAGE_LAB_ID && activity.id!==THERMAL_SIZE_LAB_ID && activity.id!==EVAPORATION_BALANCE_ID && activity.id!=='processing-package-transport' && activity.id!=='protein-hydration-evidence' && activity.id!=='processing-osmotic-driving' && activity.id!=='micro-ros-defense' && activity.id!=='dna-repair-evidence' && activity.id!=='garlic-reaction-ledger' && activity.id!=='fermentation-comparison-design' && activity.id!=='lipid-cleavage-ledger' && activity.id!=='natto-ammonia-evidence' && activity.id!=='injured-cell-evidence' && activity.id!=='heterocycle-origin' && activity.id!=='radical-ledger' && activity.id!=='protein-charge-curve' && activity.id!=='spore-survival' && activity.id!=='moisture-basis-ledger' && activity.id!=='dryer-air-ledger' && activity.id!=='hurdle-interaction-table' && activity.id!=='illness-mechanism-sort' && activity.id!=='thermal-resistance-chain' && activity.id!=='glycoside-absorption' && activity.id!=='browning-comparison' && activity.id!=='unsaponifiable-fraction' && activity.id!=='poultry-contamination' && activity.id!=='nutrient-retention' && activity.id!=='resveratrol-evidence' && activity.id!=='amino-stereo-practice' && activity.id!=='hydrolysis-identifiability' && activity.id!=='protein-quality-axes' && activity.id!=='precision-fermentation-reasoning' && activity.id!=='feedback-inhibition-reasoning' && activity.id!=='competitive-exclusion-reasoning' && activity.id!=='cheese-process-reasoning' && activity.id!=='malting-beer-reasoning' && activity.id!=='seafood-hazard-reasoning' && activity.id!=='miso-salt-reasoning' && activity.id!=='ethanol-partition-reasoning' && activity.id!=='pigment-joint-evidence' && activity.id!=='mn-defense-evidence' && activity.id!=='canned-food-cold-region-evidence' && activity.id!=='package-functions-reasoning' && activity.id!=='drying-integrated-reasoning' && activity.id!=='fermentation-physical-state-reasoning' && activity.id!=='protein-solvent-evidence' && activity.id!=='lyoprotectant-storage-evidence' && activity.id!==PROTEIN_QUALITY_LAB_ID && activity.id!==RESIDENCE_TIME_LAB_ID && activity.id!==THERMAL_PROCESS_COMPARISON_LAB_ID && activity.id!==BLANCHING_EVIDENCE_LAB_ID && activity.id!==MEMBRANE_BALANCE_LAB_ID && activity.id!==SUPERCRITICAL_CO2_LAB_ID && activity.id!==MEAT_MAP_LAB_ID && activity.id!==OUTBREAK_LAB_ID && activity.id!==FREEZE_COLLAPSE_LAB_ID && activity.id!==NITROSATION_LAB_ID && activity.id!==OLEATE_OXIDATION_LAB_ID && activity.id!==RICE_MILLING_LAB_ID && activity.id!==QPCR_LAB_ID && activity.id!==SAKE_LAB_ID && activity.id!==MICRO_ENZYME_LAB_ID && activity.id!==EXTRUSION_LAB_ID && activity.id!==CANNING_HEADSPACE_LAB_ID && activity.id!==XYLAN_LAB_ID && activity.id!=='tag-hydrolysis' && activity.id!==PIGMENT_LAB_ID && activity.id!==VITAMIN_C_LAB_ID && !DEPTH_EXPERIMENT_IDS.includes(activity.id) && !WATER_PHASE_IDS.includes(activity.id) && !COLLOID_EXPERIMENT_IDS.includes(activity.id) && !PROCESSING_EXPERIMENT_IDS.includes(activity.id) && !MICROBIOLOGY_EXPERIMENT_IDS.includes(activity.id) && !REFRIGERATION_EXPERIMENT_IDS.includes(activity.id) && !PSYCHROMETRIC_EXPERIMENT_IDS.includes(activity.id) && !DRYING_RATE_EXPERIMENT_IDS.includes(activity.id) && !ELECTRON_LIBRARY_IDS.includes(activity.id) && !ELECTRON_WORKBENCH_IDS.includes(activity.id) && !ENZYME_KINETICS_IDS.includes(activity.id) && !PEPTIDE_EXPERIMENT_IDS.includes(activity.id) && !AMINO_ACID_EXPERIMENT_IDS.includes(activity.id) && !OIL_REFINING_EXPERIMENT_IDS.includes(activity.id) && !THERMAL_HISTORY_EXPERIMENT_IDS.includes(activity.id) && activity.id!==YOGURT_LAB_ID && !SENSORY_EXPERIMENT_IDS.includes(activity.id) && activity.id!==EMULSION_LAB_ID && activity.id!==FOOD_ANALYSIS_ID && activity.id!==STARCH_STRUCTURE_LAB_ID && activity.id!==STARCH_DATA_LAB_ID && activity.id!==FRYING_LAB_ID && activity.id!==SORPTION_LAB_ID && activity.id!==MICRO_EVIDENCE_ID && activity.id!==HEAT_PENETRATION_ID && activity.id!=='lipid-sites' && activity.id!==CALIBRATION_LAB_ID ? `<p class="learning-activity-scope">${esc(activity.note)}</p>` : ''}${this.foundationEntry(lesson)}${membraneBridge}<div id="learning-experiment"></div>${lesson.id==='pigment-anthocyanin-assay'&&this.subject.id==='chemistry'?'<details id="pigment-comparison-bridge" class="learning-example-more"><summary>已會四讀值？再用光程與介質不同的新紀錄做比較</summary><p>這是另一組明示原創的匹配紀錄，先判斷可支持什麼，再選示範或新分析資料。變更紀錄不自動產生新實驗；兩個原量測示例仍彼此獨立。已懂基礎可直接進第二案。摘要附加這一課筆記。</p><div id="pigment-comparison-lab"></div></details>':''}${activity.id==='lipid-sites'?'<details class="learning-structure-extension"><summary>再往下一步：組出產物的雙鍵與 E/Z →</summary><div id="learning-lipid-products"></div></details>':''}<details class="learning-example-more"><summary>連到食品：${esc(lesson.example.food)}</summary><p>${esc(lesson.example.observation)}</p><p>${esc(lesson.example.reason)}</p></details>`;
    return `${this.proteinFunctionEntry(lesson)}${this.processPrerequisiteEntry(lesson)}<article class="learning-observation" ${lesson.id==='protein-hydrolysis'&&this.subject.id==='chemistry'?'id="protein-original-observation"':''}><div class="learning-case-number" aria-hidden="true">觀察</div><div><span class="learning-kicker">${esc(lesson.example.food)}</span><h2>${esc(lesson.example.observation)}</h2>${activity ? `<p>${esc(lesson.takeaway)}</p><button class="button-primary learning-primary" id="learning-open-activity">${esc(activity.label)} ↗</button><p class="learning-small">進入後可用上方「回到這一題」接續自測。</p>` : `<button class="button-secondary" id="learning-reveal">想好原因了，看解釋 →</button>`}<div id="learning-case-explanation" ${activity?'':'hidden'}><p>${esc(lesson.example.reason)}</p>${this.equation(lesson)}</div></div></article>`;
  }
  check(lesson, record) {
    const enzymeEvidenceEntry=lesson.id==='enzyme-evidence-limits'&&this.subject.id==='chemistry'?'<aside class="study-remedy"><p>原題練習的同曲線替代解釋保留。要換成由有限文件自主取證的新案件，可<a href="#learn/enzymes/enzyme-initial-rate/observe">回到量測取證活動</a>，或用<a href="#paths/enzyme-evidence-chain">酵素推理路徑</a>補回初速、參數與模型條件。取證摘要存入初速課筆記。</p></aside>':'';
    const thermalValidationHref=this.pathContext?decoratePath('#micro/micro-cases/micro-process-validation/check',this.pathContext.path.id,this.courses):'#micro/micro-cases/micro-process-validation/check';
    const thermalRoleEntry=lesson.id==='micro-process-validation'&&this.subject.id==='microbiology'?'<section id="thermal-evidence-practice" aria-label="確效、監測與查核的證據判讀"><h2>這份證據回答哪個問題？</h2><p>先做診斷；已掌握基礎可跳到本段無提示遷移。這與下方抽樣計算檢查不同能力。伴讀草稿與熱製程路徑共用，摘要存入本課筆記。</p><div id="thermal-evidence-lesson-lab"></div></section>':lesson.id==='proc-thermal-validation'&&this.subject.id==='processing'?`<aside class="study-remedy"><p>本課的測量與製程範圍需要連到證據用途判讀。<a href="${esc(thermalValidationHref)}">進入確效／監測／查核判讀與撤提示遷移</a>；伴讀摘要存入該微生物課筆記。也可由<a href="#paths/thermal-evidence-chain">熱製程證據路徑</a>回補先備。</p></aside>`:'';
    if(lesson.practice) {
      const next=this.nextAction(lesson);
      const nextLink=`<a class="${this.pathContext?'button-primary learning-primary path-next':'learning-back'}" href="${esc(next.href)}">${esc(next.label)} →</a>`;
      const original=`${enzymeEvidenceEntry}${thermalRoleEntry}${lesson.id==='micro-process-validation'?'<p class="learning-kicker">有限抽樣分支：以下僅檢查漏檢模型，不代表已掌握證據三角色。</p>':''}${this.isLactoseNote(lesson)?this.lactosePractice(lesson,record):renderPractice(lesson.practice,record.practice)}<details class="learning-quickcheck"><summary>再做一題概念辨析</summary>${this.quickCheck(lesson,record)}</details>`;
      if(lesson.id==='pigment-flavonoid-structure'&&this.subject.id==='chemistry')return "<details id=\"flavonoid-retrieval-details\" class=\"learning-example-more foundation-entry\"><summary>收起名稱與提示，獨立判讀八張結構圖</summary><p>重用本課固定代表圖，先以自己的話命名與說明結構依據，再自行核對。不是未見分子盲測；已看過與未知曝光會分別保留。原導讀與兩例遷移仍可選用。</p><div id=\"flavonoid-retrieval-lab\"></div></details>"+'<details id="flavonoid-original-practice" class="learning-example-more"><summary>原有短答與兩例近遷移（開啟會記錄參考曝光）</summary>'+original+'</details>'+nextLink;
      return original+renderTopicFollowup({subject:this.subject,topic:this.route?.topic,lesson,courses:this.courses,pathContext:this.pathContext})+nextLink;
    }
    const next=this.pathContext?this.nextAction(lesson):null;
    return this.quickCheck(lesson,record)+(next?`<a class="button-primary learning-primary path-next" href="${esc(next.href)}">${esc(next.label)} →</a>`:'');
  }
  quickCheck(lesson, record) {
    const quiz=quizRecordState(this.subject.id,lesson,this.progress.data.records);
    if(quiz.versionMismatch)return `<div class="learning-check"><p class="learning-kicker">用一題確認關鍵差別</p><p role="status">題目資料版本不一致，請重新整理後再作答。</p>${this.isFocusedCarb(lesson)?this.carbNote(record):this.lessonNote(lesson,record)}</div>`;
    const updateNotice=quiz.blocked?'題目記錄位置已被既有資料使用；未讀取或覆寫，請先匯出紀錄。':quiz.special&&(record.answer!==undefined||(this.subject.id==='chemistry'&&lesson.id==='water-activity'&&Object.hasOwn(this.progress.data.records,WATER_QUIZ_V2_KEY)))&&quiz.record.answer===undefined?'請重新作答；先前的作答記錄保留。':'';
    return `<div class="learning-check"><p class="learning-kicker">用一題確認關鍵差別</p><h2>${esc(lesson.quiz.question)}</h2>${updateNotice?`<p role="status">${esc(updateNotice)}</p>`:''}<div class="learning-options">${lesson.quiz.options.map((option,i) => `<button data-quiz-answer="${i}" aria-pressed="${quiz.record.answer === i}" ${quiz.blocked?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${esc(option)}</button>`).join('')}</div><div id="learning-answer" aria-live="polite">${this.answerFeedback(lesson,quiz.record)}</div>
    <details class="learning-misconception"><summary>容易混淆的地方</summary><p><strong>${esc(lesson.misconception.claim)}</strong></p><p>${esc(lesson.misconception.correction)}</p></details>${this.isFocusedCarb(lesson)?this.carbNote(record):this.lessonNote(lesson,record)}</div>`;
  }
  answerFeedback(lesson,record) {
    if (record.answer === undefined) return '';
    const correct = record.answer === lesson.quiz.answer;
    const {topic} = this.route;
    const next = this.nextAction(lesson);
    return `<div class="learning-feedback ${correct?'is-correct':''}"><strong>${correct?'✓ 這題答對了。':'再想一下。'}</strong><p>${esc(lesson.quiz.explanation)}</p>${correct ? (this.pathContext||lesson.practice?'':`<a class="button-primary learning-primary" href="${esc(next.href)}">${esc(next.label)} →</a>`) : `<a href="${this.lessonPath(topic,lesson)}">回看原理 ↗</a>`}<button class="learning-retry" data-reset-answer>重新練習</button></div>`;
  }
  sourceList(ids = []) {
    return `<ul>${ids.map(id => this.course.sources.find(s => s.id === id)).filter(s => s && /^https:\/\//.test(s.url)).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><span>${esc(s.publisher || '')}</span></li>`).join('')}</ul>`;
  }
  review() {
    const summary = learningSummary(this.course,this.progress.data);
    const saved = allLessons(this.course).filter(({lesson}) => {const r=this.progress.data.records[lesson.id];return r?.starred || r?.note;});
    const practices=practiceReviewEntries(this.course,this.progress.data);
    const noteMessage=this.noteExportMessage(),noteWarning=this.noteExportWarning();
    return `${this.topbar('筆記與複習')}<header class="learning-heading"><h1>筆記與複習</h1><p>${summary.passed.length} / ${summary.total} 個單元自測通過</p></header>${noteWarning}<div class="learning-review-toolbar"><span class="learning-review-subject">${esc(this.subject.title)}紀錄</span><button id="learning-export">匯出學習紀錄</button><button id="learning-import">匯入紀錄</button><input id="learning-import-file" type="file" accept=".json,application/json" hidden><a href="#lab/notebook">3D 實驗筆記 ↗</a></div><p id="learning-storage-status" class="learning-storage-status" role="status">${esc(noteMessage || this.progress.error || '單元筆記、自測與收藏保存在此瀏覽器。')}</p>${this.progress.locked?'<button id="learning-export-raw">匯出未修改的原始資料</button>':''}
    <section class="learning-review-section"><h2>待複習 <span>${summary.retry.length}</span></h2>${summary.retry.length ? `<div class="learning-unit-list">${summary.retry.map(({topic,lesson}) => this.unitRow(topic,lesson)).join('')}</div>` : '<p class="learning-empty-line">無待複習單元</p>'}</section>
    ${practices.length?`<section class="learning-review-section"><h2>作答與修訂 <span>${practices.length}</span></h2>${practices.map(({topic,lesson,practice:p})=>`<article class="learning-saved-note"><a href="${this.lessonPath(topic,lesson,'check')}">${esc(lesson.title)} ↗</a><p class="practice-review-excerpt">${esc(p.revision||p.response||p.transfer||'已保留之前的作答。')}</p><small>${p.revision?'已有修訂':p.response?'已有原稿':'已有練習'}${p.history.length?` · 保留 ${p.history.length} 次作答`:''} · 自評練習，未自動評分</small></article>`).join('')}</section>`:''}
    <section class="learning-review-section"><h2>收藏與筆記 <span>${saved.length}</span></h2>${saved.length ? saved.map(({topic,lesson}) => `<article class="learning-saved-note"><a href="${this.lessonPath(topic,lesson,'check')}">${esc(lesson.title)} ↗</a><p>${esc(this.progress.data.records[lesson.id].note || '已收藏')}</p></article>`).join('') : '<p class="learning-empty-line">尚無收藏或筆記</p>'}</section>`;
  }
  missing() { return `${this.topbar()}<div class="learning-empty"><h1>單元未收錄</h1><a href="${this.base}/map">回到知識目錄 →</a></div>`; }
  thermalRemedyOpener(isCurrent){
    return (remedy,context)=>{if(isCurrent()!==true)return false;const href=beginThermalRemedyReturn(this.progresses.microbiology,{...context,sourceHref:this.thermalSourceHash,remedyId:remedy.id,courses:this.courses});if(!href)return false;this.navigate(href);return true;};
  }
  bind() {
    const $ = s => this.root.querySelector(s);
    const thermalEpoch=this.renderEpoch,thermalContext=this.foundationRemedy;
    this.root.querySelectorAll('[data-thermal-remedy-return]').forEach(link=>link.onclick=e=>{e.preventDefault();if(this.renderEpoch!==thermalEpoch)return false;const href=followThermalRemedyReturn(this.progresses.microbiology,thermalContext,this.courses);if(!href){const status=$('[data-thermal-return-status]');if(status)status.textContent='原活動或題設已變，這個返回已失效；請由原熱處理入口繼續。原稿沒有被重設。';return false;}this.navigate(href);return true;});
    this.root.querySelectorAll('[data-protein-path-focus]').forEach(button=>button.onclick=()=>{const target=$('#protein-path-practice');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start',behavior:'instant'});}});
    this.root.querySelectorAll('[data-drying-path-focus]').forEach(button=>button.onclick=()=>{const target=$('#drying-path-practice');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start',behavior:'instant'});}});
    this.root.querySelectorAll('[data-fermentation-path-focus]').forEach(button=>button.onclick=()=>{const target=$('#fermentation-path-practice');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start',behavior:'instant'});}});
    this.root.querySelectorAll('[data-thermal-evidence-path-focus]').forEach(button=>button.onclick=()=>{const target=$('#thermal-evidence-path-practice');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start',behavior:'instant'});}});
    this.root.querySelectorAll('[data-enzyme-evidence-path-focus]').forEach(button=>button.onclick=()=>{const target=$('#enzyme-evidence-path-practice');if(target){target.tabIndex=-1;target.focus?.({preventScroll:true});target.scrollIntoView?.({block:'start',behavior:'instant'});}});
    const enzymePathLab=$('#enzyme-evidence-path-lab');
    if(enzymePathLab&&this.route.view==='path'&&this.route.id==='enzyme-evidence-chain'){
      const epoch=this.renderEpoch,owner=this.progresses.chemistry;
      const onSaveSummary=enzymeEvidenceNoteSaver({courses:this.courses,progresses:this.progresses,isCurrent:()=>this.renderEpoch===epoch&&this.route.view==='path'&&this.route.id==='enzyme-evidence-chain'});
      if(onSaveSummary)this.disposals.push(mountEnzymeEvidenceLab(enzymePathLab,{draftOwner:owner,draftKey:'enzyme-evidence-chain',onSaveSummary}));
      else enzymePathLab.textContent='酵素取證伴讀或化學學習紀錄暫時無法載入；請稍後重試。';
    }
    const thermalPathLab=$('#thermal-evidence-path-lab');
    if(thermalPathLab&&this.route.view==='path'&&this.route.id==='thermal-evidence-chain'){
      const epoch=this.renderEpoch,owner=this.progresses.microbiology;
      const onSaveSummary=thermalEvidenceNoteSaver({courses:this.courses,progresses:this.progresses,isCurrent:()=>this.renderEpoch===epoch&&this.route.view==='path'&&this.route.id==='thermal-evidence-chain'});
      if(onSaveSummary)this.disposals.push(mountThermalEvidenceLab(thermalPathLab,{draftOwner:owner,draftKey:'thermal-evidence-chain',onSaveSummary,onOpenRemedy:this.thermalRemedyOpener(()=>this.renderEpoch===epoch&&this.route.view==='path'&&this.route.id==='thermal-evidence-chain')}));
      else thermalPathLab.textContent='熱製程伴讀或微生物學習紀錄暫時無法載入；請稍後重試。';
    }
    const fermentationPathLab=$('#fermentation-path-lab');
    if(fermentationPathLab&&this.route.view==='path'&&this.route.id==='fermentation-evidence-chain'){
      const epoch=this.renderEpoch,owner=this.progresses.microbiology;
      const onSaveSummary=fermentationPathNoteSaver({courses:this.courses,progresses:this.progresses,isCurrent:()=>this.renderEpoch===epoch&&this.route.view==='path'&&this.route.id==='fermentation-evidence-chain'});
      if(onSaveSummary)this.disposals.push(mountFermentationPathLab(fermentationPathLab,{draftOwner:owner,draftKey:'fermentation-evidence-chain',onSaveSummary}));
      else fermentationPathLab.textContent='發酵伴讀內容或微生物學習紀錄暫時無法載入；原有課程與筆記保持，請稍後重試。';
    }
    const dryingPathLab=$('#drying-path-lab');
    if(dryingPathLab&&this.route.view==='path'&&this.route.id==='drying-evidence-chain'){
      const epoch=this.renderEpoch,owner=this.progresses.processing;
      const onSaveSummary=dryingPathNoteSaver({courses:this.courses,progresses:this.progresses,isCurrent:()=>this.renderEpoch===epoch&&this.route.view==='path'&&this.route.id==='drying-evidence-chain'});
      if(onSaveSummary)this.disposals.push(mountDryingPathLab(dryingPathLab,{draftOwner:owner,draftKey:'drying-evidence-chain',onSaveSummary}));
      else dryingPathLab.textContent='乾燥伴讀內容或加工學習紀錄暫時無法載入；原有課程與筆記保持，請稍後重試。';
    }
    const pathLab=$('#protein-path-lab');
    if(pathLab&&this.route.view==='path'&&this.route.id==='protein-evidence-chain'){
      const epoch=this.renderEpoch,owner=this.progresses.chemistry;
      const onSaveSummary=proteinPathNoteSaver({courses:this.courses,progresses:this.progresses,isCurrent:()=>this.renderEpoch===epoch&&this.route.view==='path'&&this.route.id==='protein-evidence-chain'});
      if(onSaveSummary)this.disposals.push(mountProteinPathLab(pathLab,{draftOwner:owner,draftKey:'protein-evidence-chain',onSaveSummary}));
      else pathLab.textContent='蛋白伴讀內容或學習紀錄暫時無法載入；原有課程與筆記保持，請稍後重試。';
    }
    const viewTabs=[...this.root.querySelectorAll('[data-topic-view]')];
    if(viewTabs.length){const show=(view,focus)=>{viewTabs.forEach(t=>{const on=t.dataset.topicView===view;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus();});$('#study-topic-principles').hidden=view!=='principles';$('#study-topic-unitview').hidden=view!=='units';};viewTabs.forEach((t,i)=>{t.onclick=()=>show(t.dataset.topicView);t.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(viewTabs[(i+1)%viewTabs.length].dataset.topicView,true);}};});}
    if ($('#learning-molecule')) {
      const molecule = this.molecules.find(m => m.id === 'glucose-beta');
      if (molecule) try {
        const viewer = new MoleculeViewer($('#learning-molecule')); viewer.showH = false; viewer.showLabels = false;
        viewer.setMolecule(molecule,{fit:true}); this.disposals.push(() => viewer.dispose());
      } catch { $('#learning-molecule').innerHTML='<p class="learning-preview-fallback">3D 預覽不可用，仍可閱讀課程與操作計算。</p>'; }
    }
    if($('#study-search-form')) $('#study-search-form').onsubmit=e=>{e.preventDefault();const q=$('#study-search').value.trim().slice(0,120);if(q)this.navigate(this.base+'/map?q='+encodeURIComponent(q));};
    const updateSearch=()=>{
      Object.values(this.progresses).forEach(p=>p?.refresh?.());
      this.query=$('#learning-search').value.slice(0,120);
      $('#learning-topic-results').innerHTML=this.topicResults(this.query);
      const tabs=$('.study-catalog-tabs');if(tabs)tabs.hidden=!!this.query.trim();
      const scope=$('.study-search-scope');if(scope)scope.hidden=!this.query.trim();
      const params=new URLSearchParams();if(this.query)params.set('q',this.query);if(this.searchScope!=='all')params.set('scope',this.searchScope);
      this.onSearch(this.base+'/map'+(params.size?'?'+params:''));
      const clear=$('#study-clear-search');if(clear)clear.onclick=()=>{$('#learning-search').value='';updateSearch();$('#learning-search').focus();};
    };
    if($('#learning-search')){
      $('#learning-search').oninput=updateSearch;
      $('#learning-search-form').onsubmit=e=>{e.preventDefault();updateSearch();};
      this.root.querySelectorAll('[name="search-scope"]').forEach(input=>input.onchange=()=>{this.searchScope=input.value;updateSearch();});
      const clear=$('#study-clear-search');if(clear)clear.onclick=()=>{$('#learning-search').value='';updateSearch();$('#learning-search').focus();};
    }
    if($('#study-topic-search')) $('#study-topic-search').oninput=e=>{
      const {topic}=this.route,matches=matchingTopicLessons(topic,e.target.value.slice(0,120));
      $('#study-topic-units').innerHTML=(e.target.value.trim()?`<p class="learning-results-count" role="status">${matches.length} 個相關單元</p>`:'')+matches.map(lesson=>this.unitRow(topic,lesson,topic.lessons.indexOf(lesson),this.subject,!!e.target.value.trim())).join('')+(!matches.length?'<p class="learning-empty-line">沒有符合的單元，試試其他關鍵字。</p>':'');
    };
    const {lesson,topic,step} = this.route;
    this.bindNoteReturn();
    if (lesson) {
      const focusedCarb=this.isFocusedCarb(lesson),epoch=this.renderEpoch;
      const liveCarb=()=>this.renderEpoch===epoch&&this.isFocusedCarb(lesson);
      const liveLesson=()=>this.renderEpoch===epoch&&this.route?.view==='lesson'&&this.route.lesson?.id===lesson.id;
      const saveSummary=summary=>liveLesson()?this.appendActivityNote(lesson.id,summary,{baseNote:this.noteBase}):false;
      const saveWorkbench=summary=>liveLesson()?appendWorkbenchSummary(this.progress,lesson.id,summary,{baseNote:this.noteBase,onStatus:saved=>this.updateLessonNoteStatus(saved,lesson.id,{explicit:true})}):false;
      if(step==='check'&&this.subject.id==='chemistry'&&lesson.id==='pigment-flavonoid-structure'){
        const details=$('#flavonoid-retrieval-details'),target=$('#flavonoid-retrieval-lab'),legacy=$('#flavonoid-original-practice'),sources=this.root.querySelector('.learning-sources'),owner=this.progress,key=lesson.id;
        const exposure=()=>{if(legacy?.open||sources?.open)noteFlavonoidReferenceExposure(owner,key);return readFlavonoidExposure(owner,key);};
        for(const fold of [legacy,sources])if(fold){const old=fold.ontoggle,track=e=>{if(liveLesson()&&fold.open)noteFlavonoidReferenceExposure(owner,key);old?.call(fold,e);};fold.ontoggle=track;this.disposals.push(()=>{if(fold.ontoggle===track)fold.ontoggle=old??null;});}
        let stop=null,generation=0;
        const sync=()=>{if(!liveLesson()||!details||!target)return;if(details.open&&!stop){const own=++generation,isCurrent=()=>liveLesson()&&details.open&&generation===own&&typeof stop==='function';const dispose=mountFlavonoidRetrievalLab(target,{draftOwner:owner,draftKey:key,readExposure:exposure,onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false});stop=()=>{generation++;dispose();};}else if(!details.open&&stop){stop();stop=null;}if(details)flavonoidRetrievalDetailsByOwner.set(owner,details.open);};
        if(details){details.ontoggle=sync;if(flavonoidRetrievalDetailsByOwner.get(owner)){details.open=true;sync();}this.disposals.push(()=>{flavonoidRetrievalDetailsByOwner.set(owner,details.open);details.ontoggle=null;if(stop){stop();stop=null;}});}
      }
      if(step==='observe'&&this.subject.id==='chemistry'){
        for(const [lightBranch,lightLesson,continueTarget]of [['light','vitamin-light','#learning-reveal'],['temperature','processing-temperature','#learning-experiment']]){
          if(lesson.id!==lightLesson)continue;
          const lightDetails=$('#light-temperature-'+lightBranch+'-details'),lightTarget=$('#light-temperature-'+lightBranch+'-lab');if(!lightDetails||!lightTarget)continue;
          const owner=this.progress,key='light-temperature:'+lightBranch;let byKey=lightTemperatureDetailsByOwner.get(owner);if(!byKey){byKey=new Map();lightTemperatureDetailsByOwner.set(owner,byKey);}
          let stopLight=null,lightGeneration=0;
          const syncLight=()=>{
            if(!liveLesson())return;
            if(lightDetails.open&&!stopLight){
              const ownGeneration=++lightGeneration,isCurrent=()=>liveLesson()&&lightDetails.open&&lightGeneration===ownGeneration&&typeof stopLight==='function';
              const dispose=mountLightTemperatureLab(lightTarget,{branch:lightBranch,draftOwner:owner,draftKey:key,onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false,onContinueToLesson:()=>{
                if(!isCurrent())return false;lightDetails.open=false;syncLight();const original=$(continueTarget);if(!original)return false;if(continueTarget==='#learning-experiment')original.setAttribute?.('tabindex','-1');original.focus?.({preventScroll:true});original.scrollIntoView?.({block:'center',behavior:'auto'});return true;
              }});
              stopLight=()=>{lightGeneration++;dispose();};
            }else if(!lightDetails.open&&stopLight){stopLight();stopLight=null;}
            byKey.set(key,lightDetails.open);
          };
          lightDetails.ontoggle=syncLight;if(byKey.get(key)){lightDetails.open=true;syncLight();}
          this.disposals.push(()=>{byKey.set(key,lightDetails.open);lightDetails.ontoggle=null;if(stopLight){stopLight();stopLight=null;}});
        }
      }
      if(step==='observe'&&this.subject.id==='chemistry'){
        for(const [rsBranch,rsLesson]of [['retention','vitamin-true-retention'],['size','colloid-size-distribution']]){
          if(lesson.id!==rsLesson)continue;
          const rsDetails=$('#retention-size-'+rsBranch+'-details'),rsTarget=$('#retention-size-'+rsBranch+'-lab');if(!rsDetails||!rsTarget)continue;
          const owner=this.progress,key='retention-size:'+rsBranch;let byKey=retentionSizeDetailsByOwner.get(owner);if(!byKey){byKey=new Map();retentionSizeDetailsByOwner.set(owner,byKey);}
          let stopRs=null,rsGeneration=0;
          const syncRs=()=>{
            if(!liveLesson())return;
            if(rsDetails.open&&!stopRs){
              const ownGeneration=++rsGeneration,isCurrent=()=>liveLesson()&&rsDetails.open&&rsGeneration===ownGeneration&&typeof stopRs==='function';
              const dispose=mountRetentionSizeLab(rsTarget,{branch:rsBranch,draftOwner:owner,draftKey:key,onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false,onContinueToLesson:()=>{
                if(!isCurrent())return false;rsDetails.open=false;syncRs();const original=$('#learning-experiment');if(!original)return false;original.setAttribute?.('tabindex','-1');original.focus?.({preventScroll:true});original.scrollIntoView?.({block:'center',behavior:'auto'});return true;
              }});
              stopRs=()=>{rsGeneration++;dispose();};
            }else if(!rsDetails.open&&stopRs){stopRs();stopRs=null;}
            byKey.set(key,rsDetails.open);
          };
          rsDetails.ontoggle=syncRs;if(byKey.get(key)){rsDetails.open=true;syncRs();}
          this.disposals.push(()=>{byKey.set(key,rsDetails.open);rsDetails.ontoggle=null;if(stopRs){stopRs();stopRs=null;}});
        }
      }
      if(step==='observe'&&this.subject.id==='microbiology'){
        for(const [microBranch,microLesson,continueTarget]of [['d-value','micro-spores','#learning-experiment'],['cfu','micro-growth-cycle','#learning-reveal']]){
          if(lesson.id!==microLesson)continue;
          const microDetails=$('#micro-foundation-'+microBranch+'-details'),microTarget=$('#micro-foundation-'+microBranch+'-lab');if(!microDetails||!microTarget)continue;
          const owner=this.progress,key='micro-foundation:'+microBranch;let byKey=microFoundationDetailsByOwner.get(owner);if(!byKey){byKey=new Map();microFoundationDetailsByOwner.set(owner,byKey);}
          let stopMicro=null,microGeneration=0;
          const syncMicro=()=>{
            if(!liveLesson())return;
            if(microDetails.open&&!stopMicro){
              const ownGeneration=++microGeneration,isCurrent=()=>liveLesson()&&microDetails.open&&microGeneration===ownGeneration&&typeof stopMicro==='function';
              const dispose=mountMicroFoundationLab(microTarget,{branch:microBranch,draftOwner:owner,draftKey:key,onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false,onContinueToLesson:()=>{
                if(!isCurrent())return false;microDetails.open=false;syncMicro();const original=$(continueTarget);if(!original)return false;if(continueTarget==='#learning-experiment')original.setAttribute?.('tabindex','-1');original.focus?.({preventScroll:true});original.scrollIntoView?.({block:'center',behavior:'auto'});return true;
              }});
              stopMicro=()=>{microGeneration++;dispose();};
            }else if(!microDetails.open&&stopMicro){stopMicro();stopMicro=null;}
            byKey.set(key,microDetails.open);
          };
          microDetails.ontoggle=syncMicro;if(byKey.get(key)){microDetails.open=true;syncMicro();}
          this.disposals.push(()=>{byKey.set(key,microDetails.open);microDetails.ontoggle=null;if(stopMicro){stopMicro();stopMicro=null;}});
        }
      }
      if(step==='observe'&&this.subject.id==='processing'){
        for(const [processBranch,processLesson]of [['evaporation','proc-vacuum-evaporation'],['freeze-drying','proc-freeze-drying']]){
          if(lesson.id!==processLesson)continue;
          const processDetails=$('#process-prerequisite-'+processBranch+'-details'),processTarget=$('#process-prerequisite-'+processBranch+'-lab');if(!processDetails||!processTarget)continue;
          const owner=this.progress,key='process-prerequisite:'+processBranch;let byKey=processPrerequisiteDetailsByOwner.get(owner);if(!byKey){byKey=new Map();processPrerequisiteDetailsByOwner.set(owner,byKey);}
          let stopProcess=null,processGeneration=0;
          const syncProcess=()=>{
            if(!liveLesson())return;
            if(processDetails.open&&!stopProcess){
              const ownGeneration=++processGeneration,isCurrent=()=>liveLesson()&&processDetails.open&&processGeneration===ownGeneration&&typeof stopProcess==='function';
              const dispose=mountProcessPrerequisiteLab(processTarget,{branch:processBranch,draftOwner:owner,draftKey:key,onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false,onContinueToLesson:()=>{
                if(!isCurrent())return false;processDetails.open=false;syncProcess();const original=$('#learning-reveal');if(!original)return false;original.focus?.({preventScroll:true});original.scrollIntoView?.({block:'center',behavior:'auto'});return true;
              }});
              stopProcess=()=>{processGeneration++;dispose();};
            }else if(!processDetails.open&&stopProcess){stopProcess();stopProcess=null;}
            byKey.set(key,processDetails.open);
          };
          processDetails.ontoggle=syncProcess;if(byKey.get(key)){processDetails.open=true;syncProcess();}
          this.disposals.push(()=>{byKey.set(key,processDetails.open);processDetails.ontoggle=null;if(stopProcess){stopProcess();stopProcess=null;}});
        }
      }
      const proteinDetails=$('#protein-function-details'),proteinTarget=$('#protein-function-lab');
      if(proteinDetails&&proteinTarget&&step==='observe'&&this.subject.id==='chemistry'&&lesson.id==='protein-hydrolysis'){
        const owner=this.progress;let stopProtein=null,proteinGeneration=0;
        const syncProtein=()=>{
          if(!liveLesson())return;
          if(proteinDetails.open&&!stopProtein){
            const ownGeneration=++proteinGeneration,isCurrent=()=>liveLesson()&&proteinDetails.open&&proteinGeneration===ownGeneration&&typeof stopProtein==='function';
            const dispose=mountProteinFunctionLab(proteinTarget,{draftOwner:owner,draftKey:'protein-function',onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false,onContinueToLesson:()=>{
              if(!isCurrent())return false;proteinDetails.open=false;syncProtein();const original=$('#learning-reveal');if(!original)return false;original.focus?.({preventScroll:true});original.scrollIntoView?.({block:'center',behavior:'auto'});return true;
            }});
            stopProtein=()=>{proteinGeneration++;dispose();};
          }else if(!proteinDetails.open&&stopProtein){stopProtein();stopProtein=null;}
          proteinFunctionDetailsByOwner.set(owner,proteinDetails.open);
        };
        proteinDetails.ontoggle=syncProtein;if(proteinFunctionDetailsByOwner.get(owner)){proteinDetails.open=true;syncProtein();}
        this.disposals.push(()=>{proteinFunctionDetailsByOwner.set(owner,proteinDetails.open);proteinDetails.ontoggle=null;if(stopProtein){stopProtein();stopProtein=null;}});
      }
      const bindFoundation=(kind,mount,key,continueKey)=>{
        const bridge=$('#foundation-'+kind+'-details'),target=$('#foundation-'+kind+'-lab');if(!bridge||!target)return;
        const owner=this.progress;let byKey=foundationDetailsByOwner.get(owner);if(!byKey){byKey=new Map();foundationDetailsByOwner.set(owner,byKey);}
        let stop=null,generation=0;
        const sync=()=>{
          if(!liveLesson())return;
          if(bridge.open&&!stop){
            const ownGeneration=++generation,isCurrent=()=>liveLesson()&&bridge.open&&generation===ownGeneration&&typeof stop==='function';
            const options={draftOwner:owner,draftKey:key,onSaveSummary:summary=>isCurrent()?saveWorkbench(summary):false};
            options[continueKey]=()=>{if(!isCurrent())return false;bridge.open=false;sync();const original=$('#learning-experiment');if(original){original.tabIndex=-1;original.focus?.({preventScroll:true});original.scrollIntoView?.({block:'start',behavior:'auto'});}return true;};
            const dispose=mount(target,options);stop=()=>{generation++;dispose();};
          }else if(!bridge.open&&stop){stop();stop=null;}
          byKey.set(key,bridge.open);
        };
        bridge.ontoggle=sync;if(byKey.get(key)){bridge.open=true;sync();}
        this.disposals.push(()=>{byKey.set(key,bridge.open);bridge.ontoggle=null;if(stop){stop();stop=null;}});
      };
      if(step==='observe'&&this.subject.id==='chemistry'){
        if(lesson.id==='carb-hfcs-process')bindFoundation('hfcs',mountHfcsFoundationLab,'hfcs-foundation','onContinueToLedger');
        if(lesson.id==='lipid-unsaponifiable-fraction')bindFoundation('unsapon',mountUnsaponifiableFoundationLab,'unsaponifiable-foundation','onContinueToWorkbench');
      }
      const pigmentBridge=$('#pigment-comparison-bridge'),pigmentComparisonTarget=$('#pigment-comparison-lab');
      if(pigmentBridge&&pigmentComparisonTarget&&step==='observe'&&this.subject.id==='chemistry'&&lesson.id==='pigment-anthocyanin-assay'){
        const owner=this.progress;let stopComparison=null,comparisonGeneration=0;
        const syncComparison=()=>{
          if(!liveLesson())return;
          if(pigmentBridge.open){
            if(!stopComparison){const mountedGeneration=++comparisonGeneration;const disposeComparison=mountPigmentComparisonLab(pigmentComparisonTarget,{draftOwner:owner,draftKey:'pigment-comparison',onSaveSummary:summary=>liveLesson()&&pigmentBridge.open&&comparisonGeneration===mountedGeneration&&typeof stopComparison==='function'?saveWorkbench(summary):false});stopComparison=()=>{comparisonGeneration++;disposeComparison();};}
          }else if(stopComparison){stopComparison();stopComparison=null;}
          pigmentComparisonDetailsByOwner.set(owner,pigmentBridge.open);
        };
        pigmentBridge.ontoggle=syncComparison;
        if(pigmentComparisonDetailsByOwner.get(owner)){pigmentBridge.open=true;syncComparison();}
        this.disposals.push(()=>{pigmentComparisonDetailsByOwner.set(owner,pigmentBridge.open);pigmentBridge.ontoggle=null;if(stopComparison){stopComparison();stopComparison=null;}});
      }
      const aromaObserveLab=$('#aroma-evidence-observe-lab');
      if(aromaObserveLab&&step==='observe'&&this.subject.id==='chemistry'&&lesson.id==='flavor-maillard-aroma'){
        this.disposals.push(mountAromaEvidenceLab(aromaObserveLab,{draftOwner:this.progress,draftKey:'aroma-evidence-chain',onSaveSummary:saveWorkbench}));
        const extension=$('#aroma-heterocycle-extension'),owner=this.progress;
        if(extension){if(aromaLegacyDetailsByOwner.has(owner))extension.open=aromaLegacyDetailsByOwner.get(owner);extension.ontoggle=()=>{if(liveLesson())aromaLegacyDetailsByOwner.set(owner,extension.open);};this.disposals.push(()=>{aromaLegacyDetailsByOwner.set(owner,extension.open);extension.ontoggle=null;});}
      }
      const enzymeObserveLab=$('#enzyme-evidence-observe-lab');
      if(enzymeObserveLab&&step==='observe'&&this.subject.id==='chemistry'&&lesson.id==='enzyme-initial-rate'){
        this.disposals.push(mountEnzymeEvidenceLab(enzymeObserveLab,{draftOwner:this.progress,draftKey:'enzyme-evidence-chain',onSaveSummary:saveWorkbench}));
        const extension=$('#enzyme-mm-extension'),owner=this.progress;
        if(extension){if(enzymeProgressDetailsByOwner.has(owner))extension.open=enzymeProgressDetailsByOwner.get(owner);extension.ontoggle=()=>{if(liveLesson())enzymeProgressDetailsByOwner.set(owner,extension.open);};this.disposals.push(()=>{enzymeProgressDetailsByOwner.set(owner,extension.open);extension.ontoggle=null;});}
      }
      const thermalLessonLab=$('#thermal-evidence-lesson-lab');
      if(thermalLessonLab&&step==='check'&&this.subject.id==='microbiology'&&lesson.id==='micro-process-validation')this.disposals.push(mountThermalEvidenceLab(thermalLessonLab,{draftOwner:this.progress,draftKey:'thermal-evidence-chain',onSaveSummary:saveWorkbench,onOpenRemedy:this.thermalRemedyOpener(liveLesson)}));
      bindPractice(this.root,{lesson,progress:this.progress,onStatus:()=>this.storageStatus(),onRerender:()=>{this.render(this.lessonPath(topic,lesson,step));const field=this.root.querySelector('#practice-response');field?.focus?.({preventScroll:true});field?.scrollIntoView?.({block:'center',behavior:'instant'});}});
      $('#learning-star').onclick = e => {
        if(focusedCarb&&!liveCarb())return;
        if(!liveLesson())return;
        const starred = !this.progress.data.records[lesson.id]?.starred;
        if(this.recordLesson(lesson.id,{starred})===null)return; e.currentTarget.setAttribute('aria-pressed',String(starred)); e.currentTarget.textContent=starred?'★ 已收藏':'☆ 收藏'; this.storageStatus();
      };
      if ($('#learning-lactose-site')) {
        const details=$('#lactose-site-workbench-details');let disposed=false,disposeLibrary=null;
        if(!lactoseLibraryDetailsByOwner.has(this.progress))lactoseLibraryDetailsByOwner.set(this.progress,new Map());
        const detailDrafts=lactoseLibraryDetailsByOwner.get(this.progress);
        if(detailDrafts.has(lesson.id))details.open=detailDrafts.get(lesson.id);
        const openLibrary=()=>{if(!disposed&&this.renderEpoch===epoch&&details.open&&!disposeLibrary)disposeLibrary=mountElectronLibrary($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id});};
        details.ontoggle=()=>{if(disposed||this.renderEpoch!==epoch)return;detailDrafts.set(lesson.id,details.open);openLibrary();};
        openLibrary();
        const disposeSite=mountLactoseSiteLab($('#learning-lactose-site'),{draftOwner:this.progress,onSaveSummary:summary=>disposed?false:saveSummary(summary),onJumpWorkbench:()=>{
          if(disposed||this.renderEpoch!==epoch)return;
          details.open=true;openLibrary();const target=$('#lactose-existing-workbench');target?.focus?.({preventScroll:true});target?.scrollIntoView?.({block:'start',behavior:'instant'});
        }});
        this.disposals.push(()=>{detailDrafts.set(lesson.id,details.open);disposed=true;details.ontoggle=null;disposeSite();disposeLibrary?.();});
      }
      if ($('#learning-experiment') && lesson.activity?.id==='lipid-atlas') {
        const container=$('#learning-experiment');
        container.innerHTML='<p role="status">正在載入脂質教材…</p>';
        import('./lipid-atlas.js').then(({mountLipidAtlas})=>{
          if(!liveLesson())return;
          const dispose=mountLipidAtlas(container,'lipid-atlas',{draftOwner:this.progress,stateKey:lesson.id,currentLessonId:lesson.id,startView:lesson.activity.startView,onSaveSummary:saveSummary});
          if(typeof dispose==='function')this.disposals.push(dispose);
        }).catch(()=>{
          if(liveLesson())container.innerHTML='<p role="status">脂質教材暫時無法載入，請稍後重新整理。仍可閱讀原理、作答與保存筆記。</p>';
        });
      }
      if ($('#learning-experiment') && lesson.activity?.id==='human-lactase-evidence') {
        this.disposals.push(mountLactaseLab($('#learning-experiment'),{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='sugar-chair-foundations') {
        this.disposals.push(mountSugarChairLab($('#learning-experiment'),{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='protein-structure-evidence') {
        this.disposals.push(mountProteinStructureLab($('#learning-experiment'),{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='rheology-flow-evidence') {
        this.disposals.push(mountRheologyLab($('#learning-experiment'),{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===COCOA_STRUCTURE_LAB_ID) {
        this.disposals.push(mountCocoaStructureEvidence($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,startView:lesson.activity.startView,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===BIOTICS_LAB_ID) {
        this.disposals.push(mountBioticsEvidence($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,startCase:'live-culture',onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===MAILLARD_STORAGE_LAB_ID) {
        this.disposals.push(mountMaillardStorageLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===SOY_FERMENTATION_LAB_ID) {
        this.disposals.push(mountSoyFermentationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===FERMENTATION_REDOX_LAB_ID) {
        this.disposals.push(mountFermentationRedoxLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='processing-package-transport') {
        this.disposals.push(mountPackageTransportLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===EVAPORATION_BALANCE_ID) {
        this.disposals.push(mountEvaporationBalanceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===THERMAL_SIZE_LAB_ID) {
        this.disposals.push(mountThermalSizeLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===PROTEIN_QUALITY_LAB_ID) {
        this.disposals.push(mountProteinQualityLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='micro-ros-defense') {
        this.disposals.push(mountRosDefenseLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='processing-osmotic-driving') {
        this.disposals.push(mountOsmoticDrivingLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='natto-ammonia-evidence') {
        this.disposals.push(mountNattoAmmoniaLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='injured-cell-evidence') {
        this.disposals.push(mountInjuredCellLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='heterocycle-origin') {
        this.disposals.push(mountHeterocycleOriginLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='radical-ledger') {
        this.disposals.push(mountRadicalLedgerLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='protein-charge-curve') {
        this.disposals.push(mountProteinChargeLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='spore-survival') {
        this.disposals.push(mountSporeSurvivalLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='moisture-basis-ledger') {
        this.disposals.push(mountMoistureBasisLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='dryer-air-ledger') {
        this.disposals.push(mountDryerAirLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='hurdle-interaction-table') {
        this.disposals.push(mountHurdleTableLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='illness-mechanism-sort') {
        this.disposals.push(mountIllnessMechanismLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='thermal-resistance-chain') {
        this.disposals.push(mountThermalResistanceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='browning-comparison') {
        this.disposals.push(mountBrowningComparisonLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='unsaponifiable-fraction') {
        this.disposals.push(mountUnsaponifiableLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='poultry-contamination') {
        this.disposals.push(mountPoultryContaminationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='fermentation-physical-state-reasoning') {
        this.disposals.push(mountFermentationStateLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='drying-integrated-reasoning') {
        this.disposals.push(mountDryingChainLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='package-functions-reasoning') {
        this.disposals.push(mountPackageFunctionsLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='mn-defense-evidence') {
        this.disposals.push(mountMnDefenseLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='canned-food-cold-region-evidence') {
        this.disposals.push(mountColdRegionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='ethanol-partition-reasoning') {
        this.disposals.push(mountEthanolPartitionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='pigment-joint-evidence') {
        this.disposals.push(mountPigmentJointLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='seafood-hazard-reasoning') {
        this.disposals.push(mountSeafoodHazardLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='miso-salt-reasoning') {
        this.disposals.push(mountMisoSaltLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='cheese-process-reasoning') {
        this.disposals.push(mountCheeseProcessLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='malting-beer-reasoning') {
        this.disposals.push(mountMaltingBeerLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='precision-fermentation-reasoning') {
        this.disposals.push(mountPrecisionFermentationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='feedback-inhibition-reasoning') {
        this.disposals.push(mountFeedbackInhibitionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='competitive-exclusion-reasoning') {
        this.disposals.push(mountCompetitiveExclusionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='amino-stereo-practice') {
        this.disposals.push(mountAminoStereoLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='hydrolysis-identifiability') {
        this.disposals.push(mountHydrolysisIdentifiabilityLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='protein-quality-axes') {
        this.disposals.push(mountProteinQualityAxesLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='resveratrol-evidence') {
        this.disposals.push(mountResveratrolEvidenceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='nutrient-retention') {
        this.disposals.push(mountNutrientRetentionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveWorkbench}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='glycoside-absorption') {
        const saveGlycoside=summary=>{
          if(!liveLesson())return false;
          const existing=learningNoteDraft(this.progress,lesson.id)?.note??this.noteBase??'';
          if(!existing.includes(summary))return saveSummary(summary);
          // Verify the current persisted note even for a duplicate; an old session's
          // success must not hide a deletion, a storage failure, or a remote edit.
          const saved=saveLearningNote(this.progress,lesson.id,existing,{baseNote:this.noteBase});
          this.updateLessonNoteStatus(saved,lesson.id,{explicit:true});return saved;
        };
        this.disposals.push(mountGlycosideAbsorptionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveGlycoside}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='lipid-cleavage-ledger') {
        this.disposals.push(mountLipidCleavageLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='fermentation-comparison-design') {
        this.disposals.push(mountFermentationComparisonLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='garlic-reaction-ledger') {
        this.disposals.push(mountGarlicReactionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='dna-repair-evidence') {
        this.disposals.push(mountDnaRepairLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='lyoprotectant-storage-evidence') {
        this.disposals.push(mountLyoprotectantStorageLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='protein-solvent-evidence') {
        this.disposals.push(mountProteinSolventLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='protein-hydration-evidence') {
        this.disposals.push(mountProteinHydrationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===PHAGE_LAB_ID) {
        this.disposals.push(mountPhageLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===MICRO_CELL_LAB_ID) {
        this.disposals.push(mountMicroCellLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===FLAVONOID_LAB_ID) {
        this.disposals.push(mountFlavonoidStructureLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===MICRO_RISK_LAB_ID) {
        this.disposals.push(mountMicroRiskLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===GROWTH_ESTIMATION_LAB_ID) {
        this.disposals.push(mountGrowthEstimationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===RESIDENCE_TIME_LAB_ID) {
        this.disposals.push(mountResidenceTimeLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===THERMAL_PROCESS_COMPARISON_LAB_ID) {
        this.disposals.push(mountThermalProcessComparisonLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===BLANCHING_EVIDENCE_LAB_ID) {
        this.disposals.push(mountBlanchingEvidenceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===NITROSATION_LAB_ID) {
        this.disposals.push(mountNitrosationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===SAKE_LAB_ID) {
        this.disposals.push(mountSakeFermentationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===MICRO_ENZYME_LAB_ID) {
        this.disposals.push(mountMicrobialEnzymeLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===EXTRUSION_LAB_ID) {
        this.disposals.push(mountExtrusionLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===CANNING_HEADSPACE_LAB_ID) {
        this.disposals.push(mountCanningHeadspaceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===XYLAN_LAB_ID) {
        this.disposals.push(mountXylanXylitolLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary,reviewHref:this.base+'/review',onOpenStructure:()=>{if(!liveLesson())return false;this.onActivity({type:'reaction',id:'pentose-furfural-dehydration'},this.lessonPath(topic,lesson,step));return true;}}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===QPCR_LAB_ID) {
        this.disposals.push(mountQpcrLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===RICE_MILLING_LAB_ID) {
        this.disposals.push(mountRiceMillingLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===OLEATE_OXIDATION_LAB_ID) {
        this.disposals.push(mountOleateOxidationLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===FREEZE_COLLAPSE_LAB_ID) {
        this.disposals.push(mountFreezeCollapseLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===OUTBREAK_LAB_ID) {
        this.disposals.push(mountOutbreakEvidenceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===MEAT_MAP_LAB_ID) {
        this.disposals.push(mountMeatMapLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===SUPERCRITICAL_CO2_LAB_ID) {
        this.disposals.push(mountSupercriticalCo2Lab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id===MEMBRANE_BALANCE_LAB_ID) {
        this.disposals.push(mountMembraneBalanceLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='tag-hydrolysis') {
        this.disposals.push(mountTagHydrolysisLab($('#learning-experiment'),{draftOwner:this.progress,onSaveSummary:saveSummary}));
      }
      if ($('#learning-experiment') && lesson.activity?.id==='hfcs-process-ledger') {
        this.disposals.push(mountHfcsProcessLab($('#learning-experiment'),lesson.activity.id,{draftOwner:this.progress,onSaveSummary:saveSummary,sources:this.course.sources,onOpenActivity:activity=>{
          if(!liveLesson())return false;
          this.onActivity(activity,this.lessonPath(topic,lesson,step));return true;
        }}));
      }
      if ($('#learning-experiment') && lesson.activity?.id!=='lipid-atlas' && !$('#learning-lactose-site') && lesson.activity?.id!=='human-lactase-evidence' && lesson.activity?.id!=='sugar-chair-foundations' && lesson.activity?.id!=='hfcs-process-ledger' && lesson.activity?.id!=='tag-hydrolysis' && lesson.activity?.id!=='rheology-flow-evidence' && lesson.activity?.id!==COCOA_STRUCTURE_LAB_ID && lesson.activity?.id!==BIOTICS_LAB_ID && lesson.activity?.id!==MAILLARD_STORAGE_LAB_ID && lesson.activity?.id!==SOY_FERMENTATION_LAB_ID && lesson.activity?.id!==FERMENTATION_REDOX_LAB_ID && lesson.activity?.id!==GROWTH_ESTIMATION_LAB_ID && lesson.activity?.id!==MICRO_RISK_LAB_ID && lesson.activity?.id!==FLAVONOID_LAB_ID && lesson.activity?.id!==MICRO_CELL_LAB_ID && lesson.activity?.id!==PHAGE_LAB_ID && lesson.activity?.id!==THERMAL_SIZE_LAB_ID && lesson.activity?.id!==EVAPORATION_BALANCE_ID && lesson.activity?.id!=='processing-package-transport' && lesson.activity?.id!=='protein-hydration-evidence' && lesson.activity?.id!=='processing-osmotic-driving' && lesson.activity?.id!=='micro-ros-defense' && lesson.activity?.id!=='dna-repair-evidence' && lesson.activity?.id!=='garlic-reaction-ledger' && lesson.activity?.id!=='fermentation-comparison-design' && lesson.activity?.id!=='lipid-cleavage-ledger' && lesson.activity?.id!=='natto-ammonia-evidence' && lesson.activity?.id!=='injured-cell-evidence' && lesson.activity?.id!=='heterocycle-origin' && lesson.activity?.id!=='radical-ledger' && lesson.activity?.id!=='protein-charge-curve' && lesson.activity?.id!=='spore-survival' && lesson.activity?.id!=='moisture-basis-ledger' && lesson.activity?.id!=='dryer-air-ledger' && lesson.activity?.id!=='hurdle-interaction-table' && lesson.activity?.id!=='illness-mechanism-sort' && lesson.activity?.id!=='thermal-resistance-chain' && lesson.activity?.id!=='glycoside-absorption' && lesson.activity?.id!=='browning-comparison' && lesson.activity?.id!=='unsaponifiable-fraction' && lesson.activity?.id!=='poultry-contamination' && lesson.activity?.id!=='nutrient-retention' && lesson.activity?.id!=='resveratrol-evidence' && lesson.activity?.id!=='amino-stereo-practice' && lesson.activity?.id!=='hydrolysis-identifiability' && lesson.activity?.id!=='protein-quality-axes' && lesson.activity?.id!=='precision-fermentation-reasoning' && lesson.activity?.id!=='feedback-inhibition-reasoning' && lesson.activity?.id!=='competitive-exclusion-reasoning' && lesson.activity?.id!=='cheese-process-reasoning' && lesson.activity?.id!=='malting-beer-reasoning' && lesson.activity?.id!=='seafood-hazard-reasoning' && lesson.activity?.id!=='miso-salt-reasoning' && lesson.activity?.id!=='ethanol-partition-reasoning' && lesson.activity?.id!=='pigment-joint-evidence' && lesson.activity?.id!=='mn-defense-evidence' && lesson.activity?.id!=='canned-food-cold-region-evidence' && lesson.activity?.id!=='package-functions-reasoning' && lesson.activity?.id!=='drying-integrated-reasoning' && lesson.activity?.id!=='fermentation-physical-state-reasoning' && lesson.activity?.id!=='protein-solvent-evidence' && lesson.activity?.id!=='lyoprotectant-storage-evidence' && lesson.activity?.id!==PROTEIN_QUALITY_LAB_ID && lesson.activity?.id!==RESIDENCE_TIME_LAB_ID && lesson.activity?.id!==THERMAL_PROCESS_COMPARISON_LAB_ID && lesson.activity?.id!==BLANCHING_EVIDENCE_LAB_ID && lesson.activity?.id!==MEMBRANE_BALANCE_LAB_ID && lesson.activity?.id!==SUPERCRITICAL_CO2_LAB_ID && lesson.activity?.id!==MEAT_MAP_LAB_ID && lesson.activity?.id!==OUTBREAK_LAB_ID && lesson.activity?.id!==FREEZE_COLLAPSE_LAB_ID && lesson.activity?.id!==NITROSATION_LAB_ID && lesson.activity?.id!==OLEATE_OXIDATION_LAB_ID && lesson.activity?.id!==RICE_MILLING_LAB_ID && lesson.activity?.id!==SAKE_LAB_ID && lesson.activity?.id!==MICRO_ENZYME_LAB_ID && lesson.activity?.id!==EXTRUSION_LAB_ID && lesson.activity?.id!==CANNING_HEADSPACE_LAB_ID && lesson.activity?.id!==XYLAN_LAB_ID && lesson.activity?.id!==QPCR_LAB_ID && lesson.activity?.id!=='protein-structure-evidence') { const mount=lesson.activity.id===YOGURT_LAB_ID?mountYogurtLab:SENSORY_EXPERIMENT_IDS.includes(lesson.activity.id)?mountSensoryLab:lesson.activity.id===EMULSION_LAB_ID?mountEmulsionLab:lesson.activity.id===FOOD_ANALYSIS_ID?mountFoodAnalysisLab:lesson.activity.id===STARCH_STRUCTURE_LAB_ID?mountStarchStructureLab:lesson.activity.id===STARCH_DATA_LAB_ID?mountStarchDataLab:lesson.activity.id===FRYING_LAB_ID?mountFryingDataLab:ELECTRON_LIBRARY_IDS.includes(lesson.activity.id)?mountElectronLibrary:ELECTRON_WORKBENCH_IDS.includes(lesson.activity.id)?mountElectronWorkbench:ENZYME_KINETICS_IDS.includes(lesson.activity.id)?mountEnzymeKinetics:PEPTIDE_EXPERIMENT_IDS.includes(lesson.activity.id)?mountPeptideExperiment:AMINO_ACID_EXPERIMENT_IDS.includes(lesson.activity.id)?mountAminoAcidExperiment:OIL_REFINING_EXPERIMENT_IDS.includes(lesson.activity.id)?mountOilRefiningExperiment:PSYCHROMETRIC_EXPERIMENT_IDS.includes(lesson.activity.id)?mountPsychrometricExperiment:DRYING_RATE_EXPERIMENT_IDS.includes(lesson.activity.id)?mountDryingRateExperiment:REFRIGERATION_EXPERIMENT_IDS.includes(lesson.activity.id)?mountRefrigerationExperiment:lesson.activity.id===HEAT_PENETRATION_ID?mountHeatPenetrationLab:THERMAL_HISTORY_EXPERIMENT_IDS.includes(lesson.activity.id)?mountThermalHistoryExperiment:MICROBIOLOGY_EXPERIMENT_IDS.includes(lesson.activity.id)?mountMicrobiologyExperiment:PROCESSING_EXPERIMENT_IDS.includes(lesson.activity.id)?mountProcessingExperiment:lesson.activity.id===SORPTION_LAB_ID?mountSorptionDataLab:COLLOID_EXPERIMENT_IDS.includes(lesson.activity.id)?mountColloidExperiment:lesson.activity.id==='lipid-sites'?mountLipidSites:WATER_PHASE_IDS.includes(lesson.activity.id)?mountWaterPhaseExperiment:DEPTH_EXPERIMENT_IDS.includes(lesson.activity.id)?mountDepthExperiment:lesson.activity.id===MICRO_EVIDENCE_ID?mountMicroEvidenceLab:lesson.activity.id===CALIBRATION_LAB_ID?mountCalibrationLab:lesson.activity.id===PIGMENT_LAB_ID?mountPigmentLab:lesson.activity.id===VITAMIN_C_LAB_ID?mountVitaminCLab:mountExperiment;const dispose = mount($('#learning-experiment'),lesson.activity.id,PEPTIDE_EXPERIMENT_IDS.includes(lesson.activity.id)||ELECTRON_WORKBENCH_IDS.includes(lesson.activity.id)||ELECTRON_LIBRARY_IDS.includes(lesson.activity.id)||ENZYME_KINETICS_IDS.includes(lesson.activity.id)||lesson.activity.id===SORPTION_LAB_ID||lesson.activity.id===STARCH_DATA_LAB_ID||THERMAL_HISTORY_EXPERIMENT_IDS.includes(lesson.activity.id)||PSYCHROMETRIC_EXPERIMENT_IDS.includes(lesson.activity.id)||DRYING_RATE_EXPERIMENT_IDS.includes(lesson.activity.id)||REFRIGERATION_EXPERIMENT_IDS.includes(lesson.activity.id)||MICROBIOLOGY_EXPERIMENT_IDS.includes(lesson.activity.id)?{draftOwner:this.progress,draftKey:lesson.id}:lesson.activity.id===FRYING_LAB_ID?{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}:lesson.activity.id==='lipid-sites'?{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}:lesson.activity.id===YOGURT_LAB_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.id==='protein-yogurt-acid-gel'?'evidence':lesson.id==='micro-fermented-milk-evidence'?'explain':'cause',onSaveSummary:saveSummary,reviewHref:this.base+'/review',onOpenStructure:()=>this.onActivity({type:'reaction',id:'lactose-hydrolysis'},this.lessonPath(topic,lesson,step))}:SENSORY_EXPERIMENT_IDS.includes(lesson.activity.id)?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.id==='flavor-taste-evidence'?'threshold':lesson.id==='flavor-odor-activity'?'compare':'basis',onSaveSummary:saveSummary,reviewHref:this.base+'/review'}:lesson.activity.id===EMULSION_LAB_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.activity.startStep,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}:lesson.activity.id===FOOD_ANALYSIS_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.id==='analysis-recovery-matrix'?4:lesson.id==='analysis-calibration-chain'?1:0,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}:lesson.activity.id===HEAT_PENETRATION_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.id==='proc-heat-penetration-scale'?'scale':lesson.id==='proc-heat-penetration-effects'?'effect':'profile',onSaveSummary:saveSummary,reviewHref:'#process/review'}:lesson.activity.id===STARCH_STRUCTURE_LAB_ID?{draftOwner:this.progress,onSaveSummary:saveSummary,onOpenLinear3D:()=>this.onActivity({type:'reaction',id:'starch-alpha-amylase-g5-single-cut'},this.lessonPath(topic,lesson,step))}:lesson.activity.id===MICRO_EVIDENCE_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.id==='micro-pcr-control-evidence'?'controls':lesson.id==='micro-isolate-confirmation'?'conclusion':'count',startConclusionCase:lesson.id==='micro-isolate-confirmation'?'isolate':undefined,onSaveSummary:saveSummary,reviewHref:'#micro/review'}:lesson.activity.id===CALIBRATION_LAB_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.id==='analysis-validation-prediction'?'validate':lesson.id==='analysis-calibration-uncertainty'?'uncertainty':'fit',onSaveSummary:saveSummary,reviewHref:this.base+'/review'}:lesson.activity.id===PIGMENT_LAB_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.activity.startStep,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}:lesson.activity.id===VITAMIN_C_LAB_ID?{draftOwner:this.progress,draftKey:lesson.id,startStep:lesson.activity.startStep,onSaveSummary:saveSummary,reviewHref:this.base+'/review'}:undefined); if (typeof dispose === 'function') this.disposals.push(dispose); }
      if ($('#learning-lipid-products')) this.disposals.push(mountLipidProducts($('#learning-lipid-products'),{draftOwner:this.progress,draftKey:lesson.id,onSaveSummary:saveSummary}));
      if ($('#learning-open-activity')) $('#learning-open-activity').onclick = () => {if(focusedCarb&&!liveCarb())return;this.onActivity(lesson.activity, this.lessonPath(topic,lesson,step));};
      if ($('#learning-reveal')) $('#learning-reveal').onclick = e => { $('#learning-case-explanation').hidden=false; e.currentTarget.hidden=true; };
      this.root.querySelectorAll('[data-quiz-answer]').forEach(el => el.onclick = () => {
        if(focusedCarb&&!liveCarb())return;
        if(!liveLesson())return;
        let quiz=quizRecordState(this.subject.id,lesson,this.progress.data.records);
        if(quiz.special){
          if(!this.progress.refresh()&&!this.progress.locked){this.storageStatus();return;}
          quiz=quizRecordState(this.subject.id,lesson,this.progress.data.records);
          if(quiz.blocked){this.onToast(quiz.versionMismatch?'題目資料版本不一致，請重新整理後再作答。':'題目記錄位置已被既有資料使用；未覆寫。');return;}
        }
        if(this.recordLesson(quiz.key,quiz.special?{answer:Number(el.dataset.quizAnswer),note:quiz.marker}:{answer:Number(el.dataset.quizAnswer)})===null)return;
        this.root.querySelectorAll('[data-quiz-answer]').forEach(b => b.setAttribute('aria-pressed',String(b===el)));
        $('#learning-answer').innerHTML=this.answerFeedback(lesson,quizRecordState(this.subject.id,lesson,this.progress.data.records).record); this.storageStatus();
      });
      if ($('#learning-answer')) $('#learning-answer').onclick = e => {
        if(focusedCarb&&!liveCarb())return;
        if(!liveLesson())return;
        if (!e.target.closest('[data-reset-answer]')) return;
        let quiz=quizRecordState(this.subject.id,lesson,this.progress.data.records);
        if(quiz.special){
          if(!this.progress.refresh()&&!this.progress.locked){this.storageStatus();return;}
          quiz=quizRecordState(this.subject.id,lesson,this.progress.data.records);
          if(quiz.blocked){this.onToast(quiz.versionMismatch?'題目資料版本不一致，請重新整理後再作答。':'題目記錄位置已被既有資料使用；未覆寫。');return;}
        }
        if(this.recordLesson(quiz.key,{answer:undefined})===null)return;
        this.root.querySelectorAll('[data-quiz-answer]').forEach(b=>b.setAttribute('aria-pressed','false'));
        $('#learning-answer').innerHTML='';this.storageStatus();
        this.root.querySelector('[data-quiz-answer]')?.focus();
      };
      if ($('#learning-note')) $('#learning-note').oninput = e => {
        if(focusedCarb){if(liveCarb())this.saveCarbNote(e.target.value);return;}
        if(liveLesson())this.updateLessonNoteStatus(saveLearningNote(this.progress,lesson.id,e.target.value,{baseNote:this.noteBase}),lesson.id);
      };
      if($('#learning-note-retry'))$('#learning-note-retry').onclick=()=>{if(focusedCarb){if(liveCarb())this.saveCarbNote($('#learning-note').value,{explicit:true});}else if(liveLesson())this.updateLessonNoteStatus(saveLearningNote(this.progress,lesson.id,$('#learning-note').value,{baseNote:this.noteBase}),lesson.id,{explicit:true});};
    }
    if ($('#learning-export')) $('#learning-export').onclick = () => {this.progress.refresh?.();this.storageStatus();this.onExport(this.subject.filename+'.json',JSON.stringify(this.progress.data,null,2),'application/json');};
    if ($('#learning-export-raw')) $('#learning-export-raw').onclick = () => this.onExport(this.subject.filename+'-original.txt',this.progress.raw ?? '');
    if ($('#learning-import')) {
      const epoch=this.renderEpoch;
      $('#learning-import').onclick=()=>$('#learning-import-file').click();
      $('#learning-import-file').onchange=async e=>{
        const file=e.target.files[0]; if(!file)return;
        try {
          if(file.size>MAX_LEARNING_IMPORT_BYTES)throw new Error('學習紀錄檔案超過 32 MB。');
          this.progress.merge(JSON.parse(await file.text()));
          // The original subject owns the import, but only its current view may repaint.
          if(epoch===this.renderEpoch){this.render(this.base+'/review');this.onToast('已合併學習紀錄；既有作答優先，尚未建立的推理練習可補入。');}
        }
        catch(error){if(epoch===this.renderEpoch)this.onToast('無法匯入：'+error.message);} finally {if(e.target)e.target.value='';}
      };
    }
  }
  appendActivityNote(id,summary,{baseNote}={}) {
    if(!allLessons(this.course).some(entry=>entry.lesson.id===id)||typeof summary!=='string'||!summary.trim())throw new Error('計算摘要或課題無效，尚未保存。');
    try{
      const saved=appendLearningNoteSummary(this.progress,id,summary,{baseNote});
      if(this.updateLessonNoteStatus)this.updateLessonNoteStatus(saved,id,{explicit:true});else this.storageStatus();
      return saved;
    }catch(error){if(this.updateLessonNoteStatus)this.updateLessonNoteStatus(null,id,{explicit:true});else this.storageStatus();throw error;}
  }
  recordLesson(id,change) {try{return this.progress.record(id,change);}catch(error){this.progress.error=error.message;this.onToast(error.message);this.storageStatus();return null;}}
  storageStatus() { const el=this.root.querySelector('#learning-storage-status'); if(el)el.textContent=this.noteExportMessage()|| (this.isFocusedCarb()&&this.carbNoteDrafts.has(CARB_FOCUS_ID)?'本題筆記尚未保存；關頁前請先複製。':this.progress.error || '進度已保存於此瀏覽器'); }
}
