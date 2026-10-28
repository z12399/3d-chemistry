import {validateEvaporationDataset,EVAPORATION_BALANCE_DEFAULTS,
  EVAPORATION_BALANCE_DOMAINS,EVAPORATION_BALANCE_CONFIGURATION} from './evaporation-balance-source.js';

/** Steady forward-feed evaporation of a hypothetical binary liquid.
 * Flows are kg/s, specific enthalpies kJ/kg, duties kW and U kW/(m² K).
 * Both configurations share F, xf, xp, Tf, live steam and final temperature.
 * Signed algebraic diagnostics are never clamped into a feasible process.
 */
export const EVAPORATION_BALANCE_ID = 'processing-evaporation-balance';
export {EVAPORATION_BALANCE_DEFAULTS};
export const EVAPORATION_BALANCE_LIMITS = Object.freeze({
  ...EVAPORATION_BALANCE_DOMAINS,
  intermediateTemperatureC:EVAPORATION_BALANCE_CONFIGURATION.intermediateTemperatureChoicesC,
});

function freeze(value) {
  if (value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);}
  return value;
}

export function normalizeEvaporationInput(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || ![Object.prototype,null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError('Evaporation input must be a plain object');
  }
  const result = {...EVAPORATION_BALANCE_DEFAULTS};
  for (const key of Reflect.ownKeys(input)) {
    if (typeof key !== 'string' || !Object.hasOwn(EVAPORATION_BALANCE_LIMITS,key)) {
      throw new TypeError('Unknown evaporation input field');
    }
    const descriptor = Object.getOwnPropertyDescriptor(input,key);
    if (!Object.hasOwn(descriptor,'value')) throw new TypeError('Input accessors are not supported');
    const value = descriptor.value, allowed = EVAPORATION_BALANCE_LIMITS[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`);
    if (key === 'intermediateTemperatureC' ? !allowed.includes(value) : value < allowed[0] || value > allowed[1]) {
      throw new RangeError(`${key} is outside the reviewed teaching controls`);
    }
    result[key] = value === 0 ? 0 : value;
  }
  return Object.freeze(result);
}

function unknownSystem(effectCount) {
  return {effectCount,balanceStatus:'UNKNOWN_PROPERTIES',balanceReasons:['UNKNOWN_PROPERTIES'],
    raw:null,summary:{steamFlowKgS:null,evaporatedFlowKgS:null,steamEconomy:null},
    effects:[],overall:null,flash:null,equipmentStatus:'NOT_EVALUATED',equipment:[]};
}

function comparison(single,double) {
  const balanceEligible = single.balanceStatus === 'BALANCE_OK' && double.balanceStatus === 'BALANCE_OK';
  const finiteAreaEligible = balanceEligible && ![single,double].some(s => s.equipmentStatus === 'NONPOSITIVE_DRIVING_TEMPERATURE');
  const assignedEquipmentSufficient = finiteAreaEligible && [single,double].every(s => s.equipmentStatus === 'EQUIPMENT_SUFFICIENT');
  return {balanceEligible,finiteAreaEligible,assignedEquipmentSufficient,
    singleSteamFlowKgS:balanceEligible ? single.summary.steamFlowKgS : null,
    doubleSteamFlowKgS:balanceEligible ? double.summary.steamFlowKgS : null,
    // This is a theoretical comparison only, never a recommendation at a zero ΔT.
    steamReductionFraction:balanceEligible ? (single.summary.steamFlowKgS-double.summary.steamFlowKgS)/single.summary.steamFlowKgS : null,
    scope:!balanceEligible ? 'BALANCE_UNAVAILABLE' : !finiteAreaEligible ? 'IMPOSSIBLE_FINITE_AREA'
      : !assignedEquipmentSufficient ? 'THEORETICAL_REQUIREMENTS_ONLY' : 'ASSIGNED_EQUIPMENT_SUFFICIENT_IN_MODEL'};
}

function numericalCheck(streams,massResidual,soluteResidual,energyResidual,F) {
  const energyScaleKw = Math.max(1,streams.reduce((sum,s) => sum + Math.abs(s.enthalpyFlowKw),0));
  const massToleranceKgS = 1e-9*Math.max(F,1), energyToleranceKw = 1e-9*energyScaleKw;
  return {massToleranceKgS,energyScaleKw,energyToleranceKw,
    residualPass:[massResidual,soluteResidual,energyResidual,energyScaleKw].every(Number.isFinite)
      && Math.abs(massResidual) <= massToleranceKgS && Math.abs(soluteResidual) <= massToleranceKgS
      && Math.abs(energyResidual) <= energyToleranceKw};
}

/** Dataset validation is strict and fail-closed; no network or fallback data. */
export function evaluateEvaporationBalance(input = {}, sourceDataset) {
  const p = normalizeEvaporationInput(input);
  const F = p.feedFlowKgS, C = F*p.feedSolidFraction;
  // Ratio-first preserves the exact equality target P=F when xp=xf.
  const P = F*(p.feedSolidFraction/p.productSolidFraction), E = F-P;
  const massFacts = {soluteFlowKgS:C,productFlowKgS:P,totalEvaporationKgS:E};
  let data;
  try {data = validateEvaporationDataset(sourceDataset);} catch {
    const single=unknownSystem(1),double=unknownSystem(2);
    return freeze({input:p,model:null,common:{...massFacts,water:null,feedEnthalpyKjKg:null,
      productEnthalpyKjKg:null,feedEnthalpyFlowKw:null,productEnthalpyFlowKw:null},
      single,double,comparison:comparison(single,double)});
  }
  const config = data.configuration, rows = data.properties.rows;
  const exact = temperatureC => {
    const row = rows.find(item => item.temperatureC === temperatureC);
    if (!row) throw new RangeError('Missing reviewed saturation row');
    return {...row,latentKjKg:row.hVaporKjKg-row.hLiquidKjKg,lookup:'exact-saturation-row'};
  };
  const liquidFeed = temperatureC => {
    const row = rows.find(item => item.temperatureC === temperatureC);
    if (row) return {temperatureC,hLiquidKjKg:row.hLiquidKjKg,lookup:'exact-liquid-row',bracketC:[temperatureC,temperatureC]};
    const lower = [...rows].reverse().find(item => item.temperatureC < temperatureC);
    const upper = rows.find(item => item.temperatureC > temperatureC);
    if (!lower || !upper || temperatureC < 20 || temperatureC > 80) throw new RangeError('Unsupported liquid interpolation');
    const weight = (temperatureC-lower.temperatureC)/(upper.temperatureC-lower.temperatureC);
    return {temperatureC,hLiquidKjKg:lower.hLiquidKjKg+weight*(upper.hLiquidKjKg-lower.hLiquidKjKg),
      lookup:'piecewise-linear-liquid-only',bracketC:[lower.temperatureC,upper.temperatureC]};
  };
  const water = {feed:liquidFeed(p.feedTemperatureC),steam:exact(config.steamTemperatureC),
    first:exact(p.intermediateTemperatureC),final:exact(config.finalTemperatureC)};
  const z = temperatureC => config.soluteReferenceEnthalpyKjKg
    + config.soluteCpKjKgK*(temperatureC-config.soluteReferenceTemperatureC);
  const H = (mass,properties) => (mass-C)*properties.hLiquidKjKg + C*z(properties.temperatureC);
  const feedH = H(F,water.feed), productH = H(P,water.final);
  const common = {...massFacts,feedEnthalpyKjKg:feedH/F,productEnthalpyKjKg:productH/P,
    feedEnthalpyFlowKw:feedH,productEnthalpyFlowKw:productH,water};
  const massTolerance = 1e-10*Math.max(F,1), heatTolerance = 1e-10*Math.max(F*water.final.latentKjKg,1);
  function solution(id,mass,properties,solidFraction = mass === 0 ? null : C/mass) {
    // Reconstruct the original stream ledger from m and x, independently of the
    // conserved-solute enthalpy-flow expression used to solve the equations.
    const specificEnthalpyKjKg = solidFraction === null ? null
      : (1-solidFraction)*properties.hLiquidKjKg+solidFraction*z(properties.temperatureC);
    return {id,phase:'liquid-solution',massFlowKgS:mass,
      soluteFlowKgS:solidFraction === null ? C : mass*solidFraction,
      solidFraction,temperatureC:properties.temperatureC,specificEnthalpyKjKg,
      enthalpyFlowKw:specificEnthalpyKjKg === null ? H(mass,properties) : mass*specificEnthalpyKjKg};
  }
  function pure(id,mass,properties,phase) {
    const specificEnthalpyKjKg = phase === 'vapor' ? properties.hVaporKjKg : properties.hLiquidKjKg;
    return {id,phase,massFlowKgS:mass,soluteFlowKgS:0,solidFraction:0,
      temperatureC:properties.temperatureC,specificEnthalpyKjKg,enthalpyFlowKw:mass*specificEnthalpyKjKg};
  }
  const feed = solution('feed',F,water.feed,p.feedSolidFraction), product = solution('product',P,water.final,p.productSolidFraction);
  function effect(index,inlet,liquid,vapor,heatingVapor,heatingCondensate,boiling,heating) {
    const massResidualKgS = inlet.massFlowKgS-liquid.massFlowKgS-vapor.massFlowKgS;
    const soluteResidualKgS = inlet.soluteFlowKgS-liquid.soluteFlowKgS-vapor.soluteFlowKgS;
    const energyResidualKw = inlet.enthalpyFlowKw+heatingVapor.enthalpyFlowKw
      -liquid.enthalpyFlowKw-vapor.enthalpyFlowKw-heatingCondensate.enthalpyFlowKw;
    const streams=[inlet,heatingVapor,liquid,vapor,heatingCondensate];
    return {index,temperatureC:boiling.temperatureC,pressureMPa:boiling.pressureMPa,
      heatingTemperatureC:heating.temperatureC,heatingPressureMPa:heating.pressureMPa,
      inlet,liquid,vapor,heatingVapor,heatingCondensate,
      heatDutyKw:heatingVapor.massFlowKgS*heating.latentKjKg,
      processDutyKw:liquid.enthalpyFlowKw+vapor.enthalpyFlowKw-inlet.enthalpyFlowKw,
      massResidualKgS,soluteResidualKgS,energyResidualKw,
      ...numericalCheck(streams,massResidualKgS,soluteResidualKgS,energyResidualKw,F)};
  }
  function overall(steam,steamCondensate,finalVapor,reusedCondensate=null) {
    const incoming=[feed,steam],outgoing=[product,finalVapor,steamCondensate,...(reusedCondensate ? [reusedCondensate] : [])];
    const residual = key => incoming.reduce((sum,s)=>sum+s[key],0)-outgoing.reduce((sum,s)=>sum+s[key],0);
    const massResidualKgS=residual('massFlowKgS'),soluteResidualKgS=residual('soluteFlowKgS'),energyResidualKw=residual('enthalpyFlowKw');
    return {incoming,outgoing,massResidualKgS,soluteResidualKgS,energyResidualKw,
      ...numericalCheck([...incoming,...outgoing],massResidualKgS,soluteResidualKgS,energyResidualKw,F)};
  }
  function classify(effectCount,raw,effects,outer) {
    const reasons=[];
    if (p.productSolidFraction < p.feedSolidFraction) reasons.push('INVALID_CONCENTRATION_ORDER');
    else if (p.productSolidFraction === p.feedSolidFraction) reasons.push('NO_EVAPORATION_TARGET');
    if (effectCount===2) {
      const v1=raw.vapor1FlowKgS,v2=raw.vapor2FlowKgS,x1=raw.intermediateSolidFraction;
      if (v1 < -massTolerance || v2 < -massTolerance || raw.intermediateLiquidFlowKgS <= 0
          || x1 === null || x1 <= 0 || x1 >= 1) reasons.push('INFEASIBLE_EVAPORATION_SPLIT');
      else if (Math.abs(v1) <= massTolerance || Math.abs(v2) <= massTolerance) reasons.push('DEGENERATE_EVAPORATION_SPLIT');
      else if (!(p.feedSolidFraction < x1 && x1 < p.productSolidFraction)) reasons.push('INFEASIBLE_EVAPORATION_SPLIT');
    } else {
      if (E < -massTolerance) reasons.push('INFEASIBLE_EVAPORATION_SPLIT');
      else if (Math.abs(E) <= massTolerance) reasons.push('DEGENERATE_EVAPORATION_SPLIT');
    }
    if (raw.externalDutyKw < -heatTolerance) reasons.push('INFEASIBLE_EXTERNAL_HEAT');
    else if (Math.abs(raw.externalDutyKw) <= heatTolerance) reasons.push('DEGENERATE_EXTERNAL_HEAT');
    if (!effects.every(e=>e.residualPass) || !outer.residualPass
        || !Object.values(raw).every(value=>value===null || Number.isFinite(value))) reasons.unshift('NUMERICAL_FAILURE');
    return {balanceStatus:reasons[0] || 'BALANCE_OK',balanceReasons:reasons,
      tolerances:{massKgS:massTolerance,heatKw:heatTolerance}};
  }
  function equipmentFor(effects,balanceStatus) {
    const equipment=effects.map(e=>{
      const first=e.index===1,uKwM2K=first?p.uFirstKwM2K:p.uSecondKwM2K,
        availableAreaM2=first?p.availableFirstAreaM2:p.availableSecondAreaM2,
        deltaTemperatureK=e.heatingTemperatureC-e.temperatureC;
      const base={index:e.index,deltaTemperatureK,uKwM2K,availableAreaM2,
        availableDutyKw:uKwM2K*availableAreaM2*deltaTemperatureK};
      if (balanceStatus!=='BALANCE_OK') return {...base,requiredAreaM2:null,areaShortfallM2:null,areaMarginM2:null,status:'NOT_EVALUATED'};
      if (deltaTemperatureK <= 0) return {...base,requiredAreaM2:null,areaShortfallM2:null,areaMarginM2:null,status:'NONPOSITIVE_DRIVING_TEMPERATURE'};
      const requiredAreaM2=e.heatDutyKw/(uKwM2K*deltaTemperatureK),areaMarginM2=availableAreaM2-requiredAreaM2;
      return {...base,requiredAreaM2,areaMarginM2,areaShortfallM2:areaMarginM2<0?-areaMarginM2:0,
        status:areaMarginM2<0?'AREA_INSUFFICIENT':'EQUIPMENT_SUFFICIENT'};
    });
    const equipmentStatus=equipment.some(e=>e.status==='NOT_EVALUATED')?'NOT_EVALUATED'
      :equipment.some(e=>e.status==='NONPOSITIVE_DRIVING_TEMPERATURE')?'NONPOSITIVE_DRIVING_TEMPERATURE'
      :equipment.some(e=>e.status==='AREA_INSUFFICIENT')?'AREA_INSUFFICIENT':'EQUIPMENT_SUFFICIENT';
    return {equipment,equipmentStatus};
  }
  function finish(effectCount,raw,effects,outer,flash) {
    const status=classify(effectCount,raw,effects,outer),ok=status.balanceStatus==='BALANCE_OK';
    return {effectCount,...status,raw,
      summary:{steamFlowKgS:ok?raw.steamFlowKgS:null,evaporatedFlowKgS:ok?E:null,steamEconomy:ok?E/raw.steamFlowKgS:null},
      effects,overall:outer,flash,...equipmentFor(effects,status.balanceStatus)};
  }

  // Single effect uses the same 50 C final boiling state as the double.
  const singleDuty=E*water.final.latentKjKg+H(F,water.final)-feedH;
  const singleSteam=singleDuty/water.steam.latentKjKg;
  const sv=pure('external-live-steam',singleSteam,water.steam,'vapor'),sc=pure('live-steam-condensate',singleSteam,water.steam,'liquid');
  const singleVapor=pure('new-water-vapor',E,water.final,'vapor');
  const singleEffects=[effect(1,feed,product,singleVapor,sv,sc,water.final,water.steam)];
  const single=finish(1,{steamFlowKgS:singleSteam,vapor1FlowKgS:E,vapor2FlowKgS:null,
    intermediateLiquidFlowKgS:null,intermediateSolidFraction:null,externalDutyKw:singleDuty,reusedDutyKw:0},
    singleEffects,overall(sv,sc,singleVapor),null);

  // Eliminate V2 and S from the original second-effect enthalpy balance.
  const deltaWater=water.first.hLiquidKjKg-water.final.hLiquidKjKg;
  const coolingFeedScale=(F-C)*deltaWater+C*(z(water.first.temperatureC)-z(water.final.temperatureC));
  const denominator=water.first.latentKjKg+water.final.latentKjKg-deltaWater;
  const V1=(E*water.final.latentKjKg-coolingFeedScale)/denominator,V2=E-V1,L1=F-V1;
  const Q2=V1*water.first.latentKjKg,Q1=H(F,water.first)-feedH+Q2,S=Q1/water.steam.latentKjKg;
  const dv=pure('external-live-steam',S,water.steam,'vapor'),dc=pure('live-steam-condensate',S,water.steam,'liquid');
  const intermediate=solution('intermediate-liquid',L1,water.first);
  const v1=pure('new-water-vapor-1-reused',V1,water.first,'vapor'),c1=pure('reused-vapor-condensate',V1,water.first,'liquid');
  const v2=pure('new-water-vapor-2',V2,water.final,'vapor');
  const doubleEffects=[effect(1,feed,intermediate,v1,dv,dc,water.first,water.steam),
    effect(2,intermediate,product,v2,v1,c1,water.final,water.first)];
  const sensibleCoolingKw=H(L1,water.first)-H(L1,water.final),sensibleEquivalentVaporKgS=sensibleCoolingKw/water.final.latentKjKg,
    heatingEquivalentVaporKgS=Q2/water.final.latentKjKg,totalEquivalentVaporKgS=sensibleEquivalentVaporKgS+heatingEquivalentVaporKgS;
  const double=finish(2,{steamFlowKgS:S,vapor1FlowKgS:V1,vapor2FlowKgS:V2,
    intermediateLiquidFlowKgS:L1,intermediateSolidFraction:L1===0?null:C/L1,externalDutyKw:Q1,reusedDutyKw:Q2},
    doubleEffects,overall(dv,dc,v2,c1),{sensibleCoolingKw,sensibleEquivalentVaporKgS,heatingEquivalentVaporKgS,
      totalEquivalentVaporKgS,residualKgS:V2-totalEquivalentVaporKgS,interpretation:'ENTHALPY_DECOMPOSITION_NOT_EXTRA_STREAMS'});
  return freeze({input:p,model:{modelId:data.modelId,sourceVersion:data.version,steamTemperatureC:config.steamTemperatureC,
    finalTemperatureC:config.finalTemperatureC,soluteCpKjKgK:config.soluteCpKjKgK,
    soluteReferenceTemperatureC:config.soluteReferenceTemperatureC,soluteReferenceEnthalpyKjKg:config.soluteReferenceEnthalpyKjKg},
    common,single,double,comparison:comparison(single,double)});
}
