/*
 * Saturation coefficients and ideal-gas relations adapted from PsychroLib 2.5.0.
 * Copyright (c) 2018-2020 The PsychroLib Contributors.
 * Copyright (c) 2017 ASHRAE Handbook — Fundamentals for equations/coefficients.
 *
 * The MIT License (MIT)
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

export const PSYCHROMETRIC_PRESSURE_KPA=101.325;
export const PSYCHROMETRIC_DEFAULTS=Object.freeze({inletTC:25,inletRH:.6,heatingDeltaC:25,progress:.5,dryAirFlowKgH:200});
export const PSYCHROMETRIC_LIMITS=Object.freeze({tDbC:Object.freeze([0,70]),saturationTC:Object.freeze([-100,70]),inletTC:Object.freeze([20,35]),inletRH:Object.freeze([.4,.8]),heatingDeltaC:Object.freeze([0,35]),progress:Object.freeze([0,1])});
export const PSYCHROMETRIC_CONSTANTS=Object.freeze({molarMassRatio:.621945,cpDryAirKJkgK:1.006,cpVaporKJkgK:1.86,vaporEnthalpyAtZeroKJkg:2501,cpLiquidWaterKJkgK:4.186,triplePointC:.01,rootToleranceC:1e-9,maxRootIterations:100});
export const PSYCHROMETRIC_SOURCES=Object.freeze([
  Object.freeze({title:'PsychroLib 2.5.0 · ASHRAE 2017 公式與 MIT 授權',url:'https://github.com/psychrometrics/psychrolib/tree/2.5.0'}),
  Object.freeze({title:'ASHRAE 2021 SI 第 1 章 · 濕空氣、濕球與水的能量收支',url:'https://handbook.ashrae.org/Handbooks/F21/SI/F21_Ch01/F21_Ch01_si.aspx'}),
  Object.freeze({title:'CoolProp · Humid Air Properties（交叉核對）',url:'https://coolprop.org/fluid_properties/HumidAir.html'}),
]);
export const PSYCHROMETRIC_ASSUMPTIONS=Object.freeze([
  '總壓固定 101.325 kPa；乾空氣與水蒸氣採理想混合近似，不含 CoolProp 的非理想作用及飽和增強因子。',
  'Y 為 kg 水蒸氣/kg 乾空氣；h 為 kJ/kg 乾空氣。焓基準以 0°C 乾空氣及液水為零，定熱容量近似。',
  'A→B 只加熱、不加水也不除水，所以 Y 不變；B→C 是指定的定焓數學路徑。',
  '定焓近似略去補入液水顯焓、食品顯熱及其他能量交換；一般絕熱加濕仍有 Δh=ΔY·h水，不能普遍等同定焓。',
  '熱力學濕球保留飽和溫度下的液水焓項；不是把定焓飽和端點當濕球，也不是對任何濕紗布量測的精確預測。',
  '進程只表示已走過 B 至定焓飽和端點之含濕比差的比例，不是時間、乾燥效率或可實現的設備性能。',
  '乾空氣收支假設穩態、無漏氣、無凝結/積水/累積；沒有食品傳熱傳質、結冰、保存期或安全排程。',
]);

const C=PSYCHROMETRIC_CONSTANTS,P=PSYCHROMETRIC_PRESSURE_KPA;
function finite(n,name){if(typeof n!=='number'||!Number.isFinite(n))throw new TypeError(`${name} must be a finite number`);return n;}
function within(n,lo,hi,name){finite(n,name);if(n<lo||n>hi)throw new RangeError(`${name} must be in [${lo}, ${hi}]`);return n;}
function nonnegative(n,name){finite(n,name);if(n<0)throw new RangeError(`${name} cannot be negative`);return n;}
const checkT=t=>within(t,0,70,'Dry-bulb temperature (degC)');
const rawH=(t,y)=>C.cpDryAirKJkgK*t+y*(C.vaporEnthalpyAtZeroKJkg+C.cpVaporKJkgK*t);

/** Increasing, bracketed scalar root. No unbracketed extrapolation or clamp. */
function solveIncreasing(fn,lo,hi,target){
  finite(target,'Root target');let a=finite(fn(lo),'Lower root value'),b=finite(fn(hi),'Upper root value');
  if(target<a||target>b)throw new RangeError('No root in the declared temperature interval');
  if(target===a)return lo;if(target===b)return hi;
  for(let i=0;i<C.maxRootIterations;i++){
    if(hi-lo<=C.rootToleranceC)return (lo+hi)/2;
    const mid=lo+(hi-lo)/2,value=finite(fn(mid),'Root value');
    if(value<target)lo=mid;else hi=mid;
  }
  throw new RangeError('Temperature root did not converge');
}

/** ASHRAE 2017 eqs 5/6, SI. Below/equal 0.01 C: equilibrium over ice. */
export function saturationPressureKPa(tC){
  within(tC,-100,70,'Saturation temperature (degC)');const t=tC+273.15;
  const lnP=tC<=.01
    ? -5674.5359/t+6.3925247-.009677843*t+6.2215701e-7*t*t+2.0747825e-9*t**3-9.484024e-13*t**4+4.1635019*Math.log(t)
    : -5800.2206/t+1.3914993-.048640239*t+4.1764768e-5*t*t-1.4452093e-8*t**3+6.5459673*Math.log(t);
  return Math.exp(lnP)/1000;
}
export function saturationHumidityRatio(tC){const p=saturationPressureKPa(tC);return C.molarMassRatio*p/(P-p);}
export function humidityRatioFromRH(tDbC,rh){
  checkT(tDbC);within(rh,0,1,'Relative humidity (fraction)');
  const vapor=rh*saturationPressureKPa(tDbC),y=C.molarMassRatio*vapor/(P-vapor);
  if(rh>0&&y===0)throw new RangeError('Humidity ratio is below floating-point range');
  return y;
}
export function relativeHumidityFromRatio(tDbC,humidityRatio){
  checkT(tDbC);nonnegative(humidityRatio,'Humidity ratio');const sat=saturationHumidityRatio(tDbC);
  if(humidityRatio>sat)throw new RangeError('Supersaturated/fog states are outside this model');
  // Ratio form gives exactly 1 for an exactly saturated input, without clipping.
  return (humidityRatio/sat)*((C.molarMassRatio+sat)/(C.molarMassRatio+humidityRatio));
}
/** Algebraic enthalpy relation; state constructors additionally reject fog. */
export function moistAirEnthalpy(tDbC,humidityRatio){
  checkT(tDbC);nonnegative(humidityRatio,'Humidity ratio');return finite(rawH(tDbC,humidityRatio),'Enthalpy');
}

function condensationPoint(pVaporKPa,tDbC){
  if(pVaporKPa===0)return {tDewC:null,dewPointPhase:null,dewPointReason:'dry-air'};
  if(pVaporKPa<saturationPressureKPa(-100))return {tDewC:null,dewPointPhase:null,dewPointReason:'below-minus-100-c'};
  const tDewC=solveIncreasing(saturationPressureKPa,-100,tDbC,pVaporKPa);
  return {tDewC,dewPointPhase:tDewC<=.01?'ice':'liquid',dewPointReason:null};
}
// ASHRAE 2017 eq.33: liquid-water thermodynamic wet-bulb balance. This raw
// function may be negative during bracketing; it is never clipped to MIN_W.
function ratioAtWetBulb(tDbC,tWetC){
  const sat=saturationHumidityRatio(tWetC);
  if(tDbC===tWetC)return sat;
  return ((2501-2.326*tWetC)*sat-1.006*(tDbC-tWetC))/(2501+1.86*tDbC-4.186*tWetC);
}
export function humidityRatioFromWetBulb(tDbC,tWetC){
  checkT(tDbC);within(tWetC,.01,tDbC,'Liquid-water wet-bulb temperature');
  const y=ratioAtWetBulb(tDbC,tWetC);nonnegative(y,'Wet-bulb implied humidity ratio');return y;
}
function liquidWetBulb(tDbC,y){
  if(tDbC<.01||y<ratioAtWetBulb(tDbC,.01))return {tWetC:null,wetBulbPhase:null,wetBulbReason:'outside-liquid-water-branch'};
  const sat=saturationHumidityRatio(tDbC);
  const tWetC=y===sat?tDbC:solveIncreasing(t=>ratioAtWetBulb(tDbC,t),.01,tDbC,y);
  return {tWetC,wetBulbPhase:'liquid',wetBulbReason:null};
}
export function stateFromTY(tDbC,humidityRatio){
  const rh=relativeHumidityFromRatio(tDbC,humidityRatio),pVaporKPa=P*humidityRatio/(C.molarMassRatio+humidityRatio);
  // At exact saturation avoid inversion roundoff making p_v infinitesimally
  // above its own bracket. This is an identity, not a user-input clamp.
  const dew=rh===1?{tDewC:tDbC,dewPointPhase:tDbC<=.01?'ice':'liquid',dewPointReason:null}:condensationPoint(pVaporKPa,tDbC);
  return {tDbC,rh,humidityRatio,hKJkgDa:moistAirEnthalpy(tDbC,humidityRatio),pKPa:P,pVaporKPa,...dew,...liquidWetBulb(tDbC,humidityRatio)};
}
export function stateFromTRH(tDbC,rh){return stateFromTY(tDbC,humidityRatioFromRH(tDbC,rh));}
export function stateFromHY(hKJkgDa,humidityRatio){
  finite(hKJkgDa,'Enthalpy');nonnegative(humidityRatio,'Humidity ratio');
  within(hKJkgDa,rawH(0,humidityRatio),rawH(70,humidityRatio),'Enthalpy for the temperature range');
  if(hKJkgDa===rawH(0,humidityRatio))return stateFromTY(0,humidityRatio);
  if(hKJkgDa===rawH(70,humidityRatio))return stateFromTY(70,humidityRatio);
  const tDbC=(hKJkgDa-2501*humidityRatio)/(1.006+1.86*humidityRatio);
  // Inverting an exactly saturated floating-point state can lower T by a few
  // ulps. A narrowly bounded computed-result correction is explicitly reported;
  // direct T/Y inputs still reject every supersaturated value without clipping.
  if(tDbC>=0&&tDbC<=70&&humidityRatio>saturationHumidityRatio(tDbC)){
    const corrected=tDbC+32*Number.EPSILON*Math.max(1,Math.abs(tDbC));
    if(corrected<=70&&humidityRatio<=saturationHumidityRatio(corrected)&&Math.abs(rawH(corrected,humidityRatio)-hKJkgDa)<=64*Number.EPSILON*Math.max(1,Math.abs(hKJkgDa)))
      return {...stateFromTY(corrected,humidityRatio),numericAdjustment:'enthalpy-inversion-roundoff'};
  }
  return stateFromTY(tDbC,humidityRatio);
}

/** Signed water gain, using dry-air mass flow, not moist-air mass flow. */
export function dryAirWaterBalance(inletY,outletY,dryAirFlowKgH){
  for(const [name,n] of Object.entries({inletY,outletY,dryAirFlowKgH}))nonnegative(n,name);
  const waterPickupKgKgDa=outletY-inletY,waterPickupKgH=dryAirFlowKgH*waterPickupKgKgDa;
  finite(waterPickupKgH,'Water transfer rate');return {dryAirFlowKgH,waterPickupKgKgDa,waterPickupKgH};
}
export function dryAirFlowFromMoistAir(moistAirFlowKgH,humidityRatio){
  nonnegative(moistAirFlowKgH,'Moist-air flow');nonnegative(humidityRatio,'Humidity ratio');return moistAirFlowKgH/(1+humidityRatio);
}

export function dryingAirPath(options={}){
  if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Path options must be an object');
  const values={...PSYCHROMETRIC_DEFAULTS,...options};
  for(const key of Object.keys(options))if(!Object.hasOwn(PSYCHROMETRIC_DEFAULTS,key))throw new TypeError(`Unknown path option: ${key}`);
  const {inletTC,inletRH,heatingDeltaC,progress,dryAirFlowKgH}=values;
  for(const key of ['inletTC','inletRH','heatingDeltaC','progress'])within(values[key],...PSYCHROMETRIC_LIMITS[key],key);
  nonnegative(dryAirFlowKgH,'Dry-air flow');
  const A=stateFromTRH(inletTC,inletRH),B=stateFromTY(inletTC+heatingDeltaC,A.humidityRatio);
  const endT=solveIncreasing(t=>rawH(t,saturationHumidityRatio(t)),0,B.tDbC,B.hKJkgDa);
  const saturationEnd=stateFromTRH(endT,1);
  const y=B.humidityRatio+progress*(saturationEnd.humidityRatio-B.humidityRatio);
  // Endpoints are computed directly; an exact saturation endpoint is not a
  // slightly supersaturated state caused by an additional inverse conversion.
  const endpoint=progress===0?B:progress===1?saturationEnd:stateFromHY(B.hKJkgDa,y);
  const heatingKJkgDa=B.hKJkgDa-A.hKJkgDa,heatingKW=finite(dryAirFlowKgH/3600*heatingKJkgDa,'Heating power');
  return {A,B,C:endpoint,saturationEnd,heatingKJkgDa,heatingKW,progress,
    ...dryAirWaterBalance(B.humidityRatio,endpoint.humidityRatio,dryAirFlowKgH)};
}
