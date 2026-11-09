// 由 scripts/build-activity-registry.mjs 依 scripts/activity-registry.json 產生，請勿手改。
// 課程（learning.js）用到的活動模組只在真正掛載時載入，首頁與課程頁不必先下載所有實驗室與 3D 引擎。
// 常數是原模組的複本，tests/activity-registry.test.mjs 核對兩邊一致。

/** 匯出名稱 → 模組路徑（相對於本檔）。 */
export const ACTIVITY_MODULES = Object.freeze({
 "mountLactaseLab": "./lactase-lab.js",
 "mountSugarChairLab": "./sugar-chair-lab.js",
 "mountProteinStructureLab": "./protein-structure-lab.js",
 "mountRheologyLab": "./rheology-lab.js",
 "mountCocoaStructureEvidence": "./cocoa-structure-lab.js",
 "mountBioticsEvidence": "./biotics-evidence-lab.js",
 "mountMaillardStorageLab": "./maillard-storage-lab.js",
 "mountSoyFermentationLab": "./soy-fermentation-lab.js",
 "mountFermentationRedoxLab": "./fermentation-redox-lab.js",
 "mountGrowthEstimationLab": "./growth-estimation-lab.js",
 "mountMicroRiskLab": "./micro-risk-lab.js",
 "mountFlavonoidStructureLab": "./flavonoid-structure-lab.js",
 "readFlavonoidExposure": "./flavonoid-structure-lab.js",
 "noteFlavonoidReferenceExposure": "./flavonoid-structure-lab.js",
 "mountFlavonoidRetrievalLab": "./flavonoid-retrieval-lab.js",
 "mountMicroCellLab": "./micro-cell-lab.js",
 "mountPhageLab": "./phage-lab.js",
 "mountThermalSizeLab": "./thermal-size-lab.js",
 "mountEvaporationBalanceLab": "./evaporation-balance-lab.js",
 "mountPackageTransportLab": "./package-transport-lab.js",
 "mountProteinQualityLab": "./protein-quality-lab.js",
 "mountProteinHydrationLab": "./protein-hydration-lab.js",
 "mountProteinSolventLab": "./protein-solvent-lab.js",
 "mountLyoprotectantStorageLab": "./lyoprotectant-storage-lab.js",
 "mountOsmoticDrivingLab": "./osmotic-driving-lab.js",
 "mountRosDefenseLab": "./ros-defense-lab.js",
 "mountDnaRepairLab": "./dna-repair-lab.js",
 "mountGarlicReactionLab": "./garlic-reaction-lab.js",
 "mountFermentationComparisonLab": "./fermentation-comparison-lab.js",
 "mountLipidCleavageLab": "./lipid-cleavage-lab.js",
 "mountNattoAmmoniaLab": "./natto-ammonia-lab.js",
 "mountInjuredCellLab": "./injured-cell-lab.js",
 "mountHeterocycleOriginLab": "./heterocycle-origin-lab.js",
 "mountRadicalLedgerLab": "./radical-ledger-lab.js",
 "mountProteinChargeLab": "./protein-charge-lab.js",
 "mountSporeSurvivalLab": "./spore-survival-lab.js",
 "mountMoistureBasisLab": "./moisture-basis-lab.js",
 "mountDryerAirLab": "./dryer-air-lab.js",
 "mountHurdleTableLab": "./hurdle-table-lab.js",
 "mountIllnessMechanismLab": "./illness-mechanism-lab.js",
 "mountThermalResistanceLab": "./thermal-resistance-lab.js",
 "mountGlycosideAbsorptionLab": "./glycoside-absorption-lab.js",
 "mountProteinPathLab": "./protein-path-lab.js",
 "mountFermentationPathLab": "./fermentation-path-lab.js",
 "mountThermalEvidenceLab": "./thermal-evidence-lab.js",
 "mountEnzymeEvidenceLab": "./enzyme-evidence-lab.js",
 "mountAromaEvidenceLab": "./aroma-evidence-lab.js",
 "mountPigmentComparisonLab": "./pigment-comparison-lab.js",
 "mountHfcsFoundationLab": "./hfcs-foundation-lab.js",
 "mountUnsaponifiableFoundationLab": "./unsaponifiable-foundation-lab.js",
 "mountProteinFunctionLab": "./protein-function-lab.js",
 "mountProcessPrerequisiteLab": "./process-prerequisite-lab.js",
 "mountMicroFoundationLab": "./micro-foundation-lab.js",
 "mountLightTemperatureLab": "./light-temperature-lab.js",
 "mountRetentionSizeLab": "./retention-size-lab.js",
 "mountDryingPathLab": "./drying-path-lab.js",
 "mountBrowningComparisonLab": "./browning-comparison-lab.js",
 "mountUnsaponifiableLab": "./unsaponifiable-lab.js",
 "mountPoultryContaminationLab": "./poultry-contamination-lab.js",
 "mountNutrientRetentionLab": "./nutrient-retention-lab.js",
 "mountResveratrolEvidenceLab": "./resveratrol-evidence-lab.js",
 "mountAminoStereoLab": "./amino-stereo-lab.js",
 "mountHydrolysisIdentifiabilityLab": "./hydrolysis-identifiability-lab.js",
 "mountProteinQualityAxesLab": "./protein-quality-axes-lab.js",
 "mountPrecisionFermentationLab": "./precision-fermentation-lab.js",
 "mountFeedbackInhibitionLab": "./feedback-inhibition-lab.js",
 "mountCompetitiveExclusionLab": "./competitive-exclusion-lab.js",
 "mountCheeseProcessLab": "./cheese-process-lab.js",
 "mountMaltingBeerLab": "./malting-beer-lab.js",
 "mountSeafoodHazardLab": "./seafood-hazard-lab.js",
 "mountMisoSaltLab": "./miso-salt-lab.js",
 "mountEthanolPartitionLab": "./ethanol-partition-lab.js",
 "mountPigmentJointLab": "./pigment-joint-lab.js",
 "mountMnDefenseLab": "./mn-defense-lab.js",
 "mountColdRegionLab": "./cold-region-lab.js",
 "mountPackageFunctionsLab": "./package-functions-lab.js",
 "mountDryingChainLab": "./drying-chain-lab.js",
 "mountFermentationStateLab": "./fermentation-state-lab.js",
 "mountResidenceTimeLab": "./residence-time-lab.js",
 "mountThermalProcessComparisonLab": "./thermal-process-comparison-lab.js",
 "mountBlanchingEvidenceLab": "./blanching-evidence-lab.js",
 "mountMembraneBalanceLab": "./membrane-balance-lab.js",
 "mountSupercriticalCo2Lab": "./supercritical-co2-lab.js",
 "mountMeatMapLab": "./meat-map-lab.js",
 "mountOutbreakEvidenceLab": "./outbreak-evidence-lab.js",
 "mountFreezeCollapseLab": "./freeze-collapse-lab.js",
 "mountNitrosationLab": "./nitrosation-lab.js",
 "mountOleateOxidationLab": "./oleate-oxidation-lab.js",
 "mountRiceMillingLab": "./rice-milling-lab.js",
 "mountQpcrLab": "./qpcr-lab.js",
 "mountXylanXylitolLab": "./xylan-xylitol-lab.js",
 "mountCanningHeadspaceLab": "./canning-headspace-lab.js",
 "mountExtrusionLab": "./extrusion-lab.js",
 "mountMicrobialEnzymeLab": "./microbial-enzyme-lab.js",
 "mountSakeFermentationLab": "./sake-fermentation-lab.js",
 "mountTagHydrolysisLab": "./tag-hydrolysis-lab.js",
 "mountVitaminCLab": "./vitamin-c-lab.js",
 "mountPigmentLab": "./pigment-lab.js",
 "mountEmulsionLab": "./emulsion-lab.js",
 "mountYogurtLab": "./yogurt-lab.js",
 "mountMicroEvidenceLab": "./micro-evidence-lab.js",
 "mountHeatPenetrationLab": "./heat-penetration-lab.js",
 "mountCalibrationLab": "./calibration-lab.js",
 "mountSensoryLab": "./sensory-lab.js",
 "mountFoodAnalysisLab": "./food-analysis-lab.js",
 "mountStarchStructureLab": "./starch-structure-lab.js",
 "mountStarchDataLab": "./starch-data-lab.js",
 "mountFryingDataLab": "./frying-data-lab.js",
 "MoleculeViewer": "./viewer.js",
 "mountExperiment": "./food-experiments.js",
 "mountDepthExperiment": "./food-depth-experiments.js",
 "mountLipidSites": "./lipid-sites.js",
 "mountLipidProducts": "./lipid-products.js",
 "mountWaterPhaseExperiment": "./water-phase-experiments.js",
 "mountSorptionDataLab": "./sorption-data-lab.js",
 "mountColloidExperiment": "./colloid-experiments.js",
 "mountProcessingExperiment": "./processing-experiments.js",
 "mountMicrobiologyExperiment": "./microbiology-experiments.js",
 "mountThermalHistoryExperiment": "./thermal-history-experiment.js",
 "mountRefrigerationExperiment": "./refrigeration-experiment.js",
 "mountPsychrometricExperiment": "./psychrometric-experiment.js",
 "mountDryingRateExperiment": "./drying-rate-experiment.js",
 "mountOilRefiningExperiment": "./oil-refining-experiments.js",
 "mountAminoAcidExperiment": "./amino-acid-experiment.js",
 "mountPeptideExperiment": "./peptide-experiment.js",
 "mountEnzymeKinetics": "./enzyme-kinetics-experiment.js",
 "mountElectronWorkbench": "./electron-workbench.js",
 "hasUnsavedElectronDrafts": "./electron-workbench.js",
 "mountElectronLibrary": "./electron-library.js",
 "hasUnsavedElectronLibraryDrafts": "./electron-library.js",
 "hasUnsavedElectronSandboxDrafts": "./electron-sandbox.js",
 "mountLactoseSiteLab": "./lactose-site-lab.js",
 "mountHfcsProcessLab": "./hfcs-process-lab.js"
});

export const COCOA_STRUCTURE_LAB_ID = "cocoa-structure-evidence";
export const BIOTICS_LAB_ID = "biotics-evidence";
export const MAILLARD_STORAGE_LAB_ID = "maillard-storage-evidence";
export const SOY_FERMENTATION_LAB_ID = "soy-fermentation-evidence";
export const FERMENTATION_REDOX_LAB_ID = "fermentation-redox-lab";
export const MICRO_RISK_LAB_ID = "micro-risk-integration-lab";
export const FLAVONOID_LAB_ID = "flavonoid-structure";
export const MICRO_CELL_LAB_ID = "micro-cell-evidence";
export const PHAGE_LAB_ID = "phage-evidence";
export const THERMAL_SIZE_LAB_ID = "processing-thermal-size";
export const EVAPORATION_BALANCE_ID = "processing-evaporation-balance";
export const PROTEIN_QUALITY_LAB_ID = "protein-quality-evidence";
export const RESIDENCE_TIME_LAB_ID = "processing-residence-time";
export const THERMAL_PROCESS_COMPARISON_LAB_ID = "processing-thermal-process-comparison";
export const BLANCHING_EVIDENCE_LAB_ID = "processing-blanching-evidence";
export const MEMBRANE_BALANCE_LAB_ID = "membrane-balance-evidence";
export const SUPERCRITICAL_CO2_LAB_ID = "supercritical-co2-evidence";
export const MEAT_MAP_LAB_ID = "meat-map-evidence";
export const OUTBREAK_LAB_ID = "outbreak-evidence";
export const FREEZE_COLLAPSE_LAB_ID = "freeze-drying-collapse";
export const NITROSATION_LAB_ID = "nitrosation-pathways";
export const OLEATE_OXIDATION_LAB_ID = "oleate-oxidation";
export const RICE_MILLING_LAB_ID = "rice-milling-evidence";
export const QPCR_LAB_ID = "qpcr-evidence";
export const XYLAN_LAB_ID = "xylan-xylitol-evidence";
export const CANNING_HEADSPACE_LAB_ID = "proc-canning-headspace";
export const EXTRUSION_LAB_ID = "proc-extrusion-evidence";
export const MICRO_ENZYME_LAB_ID = "micro-enzyme-evidence";
export const SAKE_LAB_ID = "sake-fermentation-evidence";
export const STARCH_STRUCTURE_LAB_ID = "starch-structure-lab";
export const STARCH_DATA_LAB_ID = "starch-data-lab";
export const FRYING_LAB_ID = "frying-data-lab";
export const DEPTH_EXPERIMENT_IDS = ["oxidation-sequence","starch-de"];
export const WATER_PHASE_IDS = ["water-gab","glass-transition"];
export const SORPTION_LAB_ID = "sorption-data";
export const COLLOID_EXPERIMENT_IDS = ["emulsion-creaming"];
export const PROCESSING_EXPERIMENT_IDS = ["processing-concentration","processing-energy"];
export const MICROBIOLOGY_EXPERIMENT_IDS = ["microbiology-growth","microbiology-thermal"];
export const THERMAL_HISTORY_EXPERIMENT_IDS = ["processing-thermal-history"];
export const REFRIGERATION_EXPERIMENT_IDS = ["processing-refrigeration-cycle"];
export const PSYCHROMETRIC_EXPERIMENT_IDS = ["processing-psychrometric-chart"];
export const DRYING_RATE_EXPERIMENT_IDS = ["processing-drying-rate-curve"];
export const OIL_REFINING_EXPERIMENT_IDS = ["processing-oil-refining-flow","processing-oil-neutralization"];
export const AMINO_ACID_EXPERIMENT_IDS = ["amino-acid-speciation"];
export const PEPTIDE_EXPERIMENT_IDS = ["peptide-hydrolysis"];
export const ENZYME_KINETICS_IDS = ["enzyme-initial-rate","enzyme-inhibition-map","enzyme-kinetic-fit"];
export const ELECTRON_WORKBENCH_IDS = ["electron-cyclization","electron-condensation","electron-hydrolysis"];
export const ELECTRON_LIBRARY_IDS = ["electron-ring-opening-library","electron-fructose-library","electron-reducing-library","electron-imine-library","electron-enediol-library","electron-amadori-library","electron-heyns-library","electron-strecker-library"];

const loaded = new Map(), pending = new Map();

/** 同步取得已載入模組的匯出；尚未載入時回傳 undefined。 */
export function activityExport(name) {
  const file = ACTIVITY_MODULES[name];
  if (!file) throw new Error('未登錄的活動模組匯出：' + name);
  return loaded.get(file)?.[name];
}

/** 載入模組並回傳該匯出（Promise）。同一模組只 import 一次。 */
export function loadActivityExport(name) {
  const file = ACTIVITY_MODULES[name];
  if (!file) return Promise.reject(new Error('未登錄的活動模組匯出：' + name));
  if (loaded.has(file)) return Promise.resolve(loaded.get(file)[name]);
  if (!pending.has(file)) {
    pending.set(file, import(file).then((ns) => { loaded.set(file, ns); return ns; }).finally(() => pending.delete(file)));
  }
  return pending.get(file).then((ns) => ns[name]);
}

/** 預先載入（全部或指定名稱）；測試與預熱用。 */
export function preloadActivityModules(names = Object.keys(ACTIVITY_MODULES)) {
  return Promise.all([...new Set(names.map((n) => ACTIVITY_MODULES[n]).filter(Boolean))].map((file) => loadActivityExport(Object.keys(ACTIVITY_MODULES).find((n) => ACTIVITY_MODULES[n] === file))));
}

/**
 * 回傳與原 mount 同簽名的函式 (host, ...rest)。
 * 模組已載入（或 hostExport 給了實作）時同步掛載並回傳原本的 dispose；
 * 否則在 host 顯示載入中，載入後若 host 仍在文件中才掛載，回傳的 dispose 會取消或釋放。
 * hostExport：呼叫端提供的同步查詢（例如測試宿主以同名全域函式注入假 mount）。
 */
export function lazyActivity(name, hostExport) {
  if (!ACTIVITY_MODULES[name]) throw new Error('未登錄的活動模組匯出：' + name);
  return function mountLater(host, ...rest) {
    const direct = hostExport?.(name) || activityExport(name);
    if (direct) return direct(host, ...rest);
    let disposed = false, dispose = null;
    const status = typeof document !== 'undefined' && host && typeof host.appendChild === 'function' ? document.createElement('p') : null;
    if (status) { status.className = 'learning-activity-loading'; status.setAttribute('role', 'status'); status.textContent = '活動載入中…'; host.appendChild(status); }
    loadActivityExport(name).then((fn) => {
      status?.remove();
      if (disposed || host?.isConnected === false) return;
      dispose = fn(host, ...rest);
    }).catch((error) => {
      status?.remove();
      if (disposed) return;
      console.error(error);
      if (host && 'innerHTML' in host) host.innerHTML = '<p class="learning-activity-error" role="alert">活動暫時無法載入，請重新整理後再試。</p>';
    });
    return () => { disposed = true; if (typeof dispose === 'function') dispose(); };
  };
}

/** 同步查詢型匯出（例如「有沒有未保存草稿」）：模組還沒載入就代表沒有狀態，回傳 fallback；hostExport 同 lazyActivity。 */
export function syncActivity(name, fallback, hostExport) {
  if (!ACTIVITY_MODULES[name]) throw new Error('未登錄的活動模組匯出：' + name);
  return (...args) => {
    const fn = hostExport?.(name) || activityExport(name);
    if (fn) return fn(...args);
    return typeof fallback === 'function' ? fallback(...args) : fallback;
  };
}
