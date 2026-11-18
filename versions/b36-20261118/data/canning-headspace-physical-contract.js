/** Exact reviewed source contract projection; no process settings. */
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const HEADSPACE_PHYSICAL_CONTRACT_SHA256='c35b59348163d2f723550c721eb83e233161af6972ff7d6a4191fb30f1a76254';
export const HEADSPACE_PHYSICAL_CONTRACT=freeze({
  "schema": "canning-headspace-physical-contract/v1",
  "createdUtc": "2026-10-12T19:03:50.276503+00:00",
  "status": "CONFIRMED_FOR_ORIGINAL_HYPOTHETICAL_MODEL",
  "lessonId": "proc-canning-headspace",
  "activityId": "proc-canning-headspace",
  "source": {
    "id": "canning-source-iapws1992",
    "url": "https://iapws.org/technical-guidance/release/Supp-sat",
    "downloadUrl": "https://iapws.org/technical-guidance/release/Supp-sat.download",
    "path": "sources/iapws-saturation-release-1992.pdf",
    "sha256": "a10d38d73339b0713c86cfac88f9adcba137202167ccdfa1cd58238c438361d7",
    "locator": "p.3 Eq.(1), p.6 validity Eq.(10), p.7 Table 1",
    "allSevenPagesActuallyViewed": true
  },
  "saturation": {
    "criticalTemperatureK": 647.096,
    "criticalPressureKPa": 22064,
    "coefficients": [
      -7.85951783,
      1.84408259,
      -11.7866497,
      22.6807411,
      -15.9618719,
      1.80122502
    ],
    "powers": [
      1,
      1.5,
      3,
      3.5,
      4,
      7.5
    ],
    "definition": "tau=1-T/Tc; p_sat(T)=Pc*exp((Tc/T)*sum_i(a_i*tau^power_i))",
    "temperatureSourceRangeK": [
      273.16,
      647.096
    ],
    "pressureSourceUnit": "MPa; convert Pc 22.064 MPa to 22064 kPa",
    "verificationAnchors": [
      {
        "temperatureK": 273.16,
        "printedPressurePa": 611.657,
        "absoluteTolerancePa": 0.001,
        "calculatedPressurePa": 611.6570697405119
      },
      {
        "temperatureK": 373.1243,
        "printedPressurePa": 101325,
        "absoluteTolerancePa": 0.5,
        "calculatedPressurePa": 101325.0151696129
      },
      {
        "temperatureK": 647.096,
        "printedPressurePa": 22064000,
        "absoluteTolerancePa": 0.01,
        "calculatedPressurePa": 22064000.0
      }
    ]
  },
  "mainInputs": [
    "sealTemperatureC",
    "sealPressureKPaAbs",
    "viewTemperatureC",
    "outsidePressureKPaAbs"
  ],
  "originalTeachingRange": {
    "temperatureC": [
      20,
      95
    ],
    "meaning": "Original narrowed interface domain, not a canning process recommendation. Observation temperature may exceed sealing temperature."
  },
  "equations": [
    "T_K=T_C+273.15",
    "p_nc_seal=P_seal_abs-p_sat(T_seal)",
    "p_nc_view=p_nc_seal*T_view_K/T_seal_K",
    "p_v_view=p_sat(T_view)",
    "P_inside_abs=p_nc_view+p_v_view",
    "deltaP=P_inside_abs-P_outside_abs"
  ],
  "equationProvenance": "Original algebra from ideal gas law at fixed n_nc and V, with ideal-mixture pressure sum and IAPWS water saturation pressure. Not a fitted canning dataset. Runtime pressure ratios do not require numerical R.",
  "invalidConditions": [
    "nonfinite input",
    "temperature outside chosen interface domain",
    "nonpositive absolute pressure",
    "P_seal_abs<p_sat(T_seal) gives impossible negative noncondensable amount under the specified equilibrium assumptions; reject, do not clamp"
  ],
  "validBoundary": "P_seal_abs=p_sat(T_seal) is the zero-noncondensable limiting case, not an invalid negative amount.",
  "assumptions": [
    "sealed rigid container with fixed headspace volume",
    "no leakage, no gas dissolution/release/reaction; constant noncondensable gas amount after sealing",
    "uniform specified temperature and phase equilibrium at every observed state; not a time or heat-transfer trajectory",
    "sufficient pure liquid water throughout; water vapor at saturation",
    "noncondensable gas ideal; vapor/liquid pressure corrections and mixture nonideality ignored",
    "external absolute pressure is independently specified and changes mechanical pressure difference, not instantaneous sealed internal pressure under fixed T,V,n",
    "no product expansion/contraction or container deformation"
  ],
  "requiredBoundaries": [
    "negative deltaP means sub-external pressure, never negative absolute pressure",
    "low oxygen and low total pressure are different claims; nitrogen flush is not steam condensation",
    "steam condensation changes vapor amount; do not conserve total gas-phase moles as if all gas were noncondensable",
    "pressure result is not leak-proofness, seam validity, container stress tolerance, microbial lethality, commercial sterility or safety",
    "no real product schedule, method efficiency, exhausting time or heat transfer coefficient is inferred",
    "headspace V cancels from pressure ratio when seal P/T are fixed; do not invent independent V effect without fixing gas amount instead"
  ],
  "sourceStatusNotes": [
    "Official ideal-gas primary text read through NASA web tool; raw download timed out and preserved. NASA alternative equation-of-state page has incorrect Celsius offset 273.16, not adopted. Final runtime source projection will use a verified authoritative ideal-gas/temperature definition.",
    "FDA exhausting and retort external pressure sources fetched successfully; qualitative method contract to follow."
  ]
});
