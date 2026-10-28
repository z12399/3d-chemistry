/* Finite reviewed shape descriptors; never accepted from student input. */
const GRAPH_SCHEMA = {"type":"object","additionalProperties":false,"properties":{"schemaVersion":{"enum":["lipid-cleavage-finite-graph/v1"]},"state":{"enum":["start","A","B"]},"geometryVariant":{"enum":["EE","EZ","unknown"]},"evidenceContextId":{"enum":["P2016-PC-alkoxyl-12"]},"atoms":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"originAtomId":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"element":{"enum":["C","H","O"]},"parentCarbonId":{"type":"string","pattern":"^(C[1-9][0-9]*|NOT_APPLICABLE)$"},"formalCharge":{"type":"integer","minimum":-3,"maximum":3},"nonbondingElectrons":{"type":"integer","minimum":0,"maximum":8},"radicalElectrons":{"type":"integer","minimum":0,"maximum":2},"implicitHydrogens":{"enum":[0]}},"required":["id","originAtomId","element","parentCarbonId","formalCharge","nonbondingElectrons","radicalElectrons","implicitHydrogens"]},"minItems":1,"maxItems":60},"bonds":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"a":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"b":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"order":{"enum":[1,2,3]}},"required":["a","b","order"]},"minItems":0,"maxItems":70},"boundaryBonds":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"id":{"enum":["sn2-ester-anchor"]},"localAtomId":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"externalAnchorId":{"enum":["O_PC_fixed"]},"order":{"enum":[1]},"fixedBlockId":{"enum":["PC_REMAINDER_FIXED"]}},"required":["id","localAtomId","externalAnchorId","order","fixedBlockId"]},"minItems":0,"maxItems":2},"components":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","minLength":1,"maxLength":40},"role":{"enum":["chain","head","tail"]},"atomIds":{"type":"array","items":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"minItems":1,"maxItems":60},"localAtomCounts":{"type":"object","additionalProperties":false,"properties":{"C":{"type":"integer","minimum":0,"maximum":100},"H":{"type":"integer","minimum":0,"maximum":100},"O":{"type":"integer","minimum":0,"maximum":100}},"required":["C","H","O"]},"boundaryAttachmentIds":{"type":"array","items":{"enum":["sn2-ester-anchor"]},"minItems":0,"maxItems":1},"radicalKind":{"enum":["alkoxyl","alkyl-not-acyl","vinylic","none"]}},"required":["id","role","atomIds","localAtomCounts","boundaryAttachmentIds","radicalKind"]},"minItems":1,"maxItems":3},"localAtomCounts":{"type":"object","additionalProperties":false,"properties":{"C":{"type":"integer","minimum":0,"maximum":100},"H":{"type":"integer","minimum":0,"maximum":100},"O":{"type":"integer","minimum":0,"maximum":100}},"required":["C","H","O"]},"localFormalCharge":{"type":"integer","minimum":-6,"maximum":6},"unpairedElectronCount":{"type":"integer","minimum":0,"maximum":4},"wholeSystemAccounting":{"type":"object","additionalProperties":false,"properties":{"molecularFormula":{"enum":["UNKNOWN"]},"molarMass":{"enum":["UNKNOWN"]},"monoisotopicMass":{"enum":["UNKNOWN"]},"mz":{"enum":["UNKNOWN"]},"totalElectronCount":{"enum":["UNKNOWN"]},"reason":{"enum":["outside-local-atom-graph"]}},"required":["molecularFormula","molarMass","monoisotopicMass","mz","totalElectronCount","reason"]},"stereochemistry":{"type":"object","additionalProperties":false,"properties":{"alkenes":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"originBond":{"type":"array","items":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"minItems":2,"maxItems":2},"originalTeachingGeometry":{"enum":["E","Z","UNSPECIFIED"]},"value":{"enum":["E","Z","UNSPECIFIED","NOT_ASSESSED"]},"status":{"enum":["specified-by-exercise","unspecified-by-exercise","radical-center-not-assessed"]},"displayLocants":{"type":"array","items":{"type":"integer","minimum":1,"maximum":18},"minItems":2,"maxItems":2}},"required":["originBond","originalTeachingGeometry","value","status","displayLocants"]},"minItems":2,"maxItems":2},"C9":{"type":"object","additionalProperties":false,"properties":{"value":{"enum":["UNSPECIFIED","NOT_APPLICABLE"]},"status":{"enum":["unspecified-by-exercise","center-absent-after-carbonyl"]}},"required":["value","status"]}},"required":["alkenes","C9"]},"numberingFrame":{"enum":["source-chain","product-display-not-full-IUPAC-name"]},"originToProductCarbon":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"originAtomId":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"componentId":{"type":"string","minLength":1,"maxLength":40},"displayCarbonNumber":{"type":"integer","minimum":1,"maximum":18}},"required":["originAtomId","componentId","displayCarbonNumber"]},"minItems":1,"maxItems":18},"isTrajectory":{"enum":[false]},"hasComputedCoordinates":{"enum":[false]}},"required":["schemaVersion","state","geometryVariant","evidenceContextId","atoms","bonds","boundaryBonds","components","localAtomCounts","localFormalCharge","unpairedElectronCount","wholeSystemAccounting","stereochemistry","numberingFrame","originToProductCarbon","isTrajectory","hasComputedCoordinates"]};
const FIXTURE_SCHEMA = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"urn:lipid-cleavage:attempt:v1","type":"object","additionalProperties":false,"properties":{"schemaVersion":{"enum":["lipid-cleavage-attempt/v1"]},"attemptId":{"type":"string","minLength":1,"maxLength":80},"parentAttemptId":{"type":"string","minLength":1,"maxLength":80},"revision":{"type":"integer","minimum":1,"maximum":100000},"stage":{"enum":["draft","submitted"]},"initialStateRef":{"type":"object","additionalProperties":false,"properties":{"geometryVariant":{"enum":["EE","EZ","unknown"]},"stateId":{"enum":["start-EE","start-EZ","start-unknown"]},"graphSha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},"sourceManifestSha256":{"enum":["c9a5d608af87489c771280a09198f2aab08bd39f9780edd1e9151fc3e4710ee8"]}},"required":["geometryVariant","stateId","graphSha256","sourceManifestSha256"]},"choices":{"type":"object","additionalProperties":false,"properties":{"cutBond":{"enum":["UNSELECTED","C8-C9","C9-C10"]},"C9O9BondOrder":{"oneOf":[{"enum":["UNSELECTED"]},{"enum":[1,2,3]}]},"radicalAtomId":{"oneOf":[{"enum":["UNSELECTED"]},{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24}]}},"required":["cutBond","C9O9BondOrder","radicalAtomId"]},"candidateGraph":{"$ref":"#/$defs/graph"},"explanation":{"type":"string","maxLength":10000},"evidenceClaims":{"type":"array","items":{"enum":["A-source-proposed-small-branch","B-source-disfavored","accounting-does-not-prove-feasibility","1976-GC-does-not-uniquely-identify-9-OOH","equal-branch-probabilities","A-major-food-pathway","2016-proves-this-EE-isomer","merge-1976-with-PC-yields","dienal-proves-only-9-OOH"]},"minItems":0,"maxItems":20},"virtualMarkers":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"atomId":{"enum":["C8","C9","C10","O9"]},"colorTag":{"enum":["blue","rose","gold","green"]},"predictedComponentId":{"type":"string","minLength":1,"maxLength":40}},"required":["atomId","colorTag","predictedComponentId"]},"minItems":0,"maxItems":4},"sourceExposure":{"type":"object","additionalProperties":false,"properties":{"P2016":{"type":"boolean"},"P1976":{"type":"boolean"}},"required":["P2016","P1976"]}},"required":["schemaVersion","attemptId","parentAttemptId","revision","stage","initialStateRef","choices","candidateGraph","explanation","evidenceClaims","virtualMarkers","sourceExposure"],"$defs":{"graph":{"type":"object","additionalProperties":false,"properties":{"schemaVersion":{"enum":["lipid-cleavage-finite-graph/v1"]},"state":{"enum":["start","A","B"]},"geometryVariant":{"enum":["EE","EZ","unknown"]},"evidenceContextId":{"enum":["P2016-PC-alkoxyl-12"]},"atoms":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"originAtomId":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"element":{"enum":["C","H","O"]},"parentCarbonId":{"type":"string","pattern":"^(C[1-9][0-9]*|NOT_APPLICABLE)$"},"formalCharge":{"type":"integer","minimum":-3,"maximum":3},"nonbondingElectrons":{"type":"integer","minimum":0,"maximum":8},"radicalElectrons":{"type":"integer","minimum":0,"maximum":2},"implicitHydrogens":{"enum":[0]}},"required":["id","originAtomId","element","parentCarbonId","formalCharge","nonbondingElectrons","radicalElectrons","implicitHydrogens"]},"minItems":1,"maxItems":60},"bonds":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"a":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"b":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"order":{"enum":[1,2,3]}},"required":["a","b","order"]},"minItems":0,"maxItems":70},"boundaryBonds":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"id":{"enum":["sn2-ester-anchor"]},"localAtomId":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"externalAnchorId":{"enum":["O_PC_fixed"]},"order":{"enum":[1]},"fixedBlockId":{"enum":["PC_REMAINDER_FIXED"]}},"required":["id","localAtomId","externalAnchorId","order","fixedBlockId"]},"minItems":0,"maxItems":2},"components":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"id":{"type":"string","minLength":1,"maxLength":40},"role":{"enum":["chain","head","tail"]},"atomIds":{"type":"array","items":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"minItems":1,"maxItems":60},"localAtomCounts":{"type":"object","additionalProperties":false,"properties":{"C":{"type":"integer","minimum":0,"maximum":100},"H":{"type":"integer","minimum":0,"maximum":100},"O":{"type":"integer","minimum":0,"maximum":100}},"required":["C","H","O"]},"boundaryAttachmentIds":{"type":"array","items":{"enum":["sn2-ester-anchor"]},"minItems":0,"maxItems":1},"radicalKind":{"enum":["alkoxyl","alkyl-not-acyl","vinylic","none"]}},"required":["id","role","atomIds","localAtomCounts","boundaryAttachmentIds","radicalKind"]},"minItems":1,"maxItems":3},"localAtomCounts":{"type":"object","additionalProperties":false,"properties":{"C":{"type":"integer","minimum":0,"maximum":100},"H":{"type":"integer","minimum":0,"maximum":100},"O":{"type":"integer","minimum":0,"maximum":100}},"required":["C","H","O"]},"localFormalCharge":{"type":"integer","minimum":-6,"maximum":6},"unpairedElectronCount":{"type":"integer","minimum":0,"maximum":4},"wholeSystemAccounting":{"type":"object","additionalProperties":false,"properties":{"molecularFormula":{"enum":["UNKNOWN"]},"molarMass":{"enum":["UNKNOWN"]},"monoisotopicMass":{"enum":["UNKNOWN"]},"mz":{"enum":["UNKNOWN"]},"totalElectronCount":{"enum":["UNKNOWN"]},"reason":{"enum":["outside-local-atom-graph"]}},"required":["molecularFormula","molarMass","monoisotopicMass","mz","totalElectronCount","reason"]},"stereochemistry":{"type":"object","additionalProperties":false,"properties":{"alkenes":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"originBond":{"type":"array","items":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"minItems":2,"maxItems":2},"originalTeachingGeometry":{"enum":["E","Z","UNSPECIFIED"]},"value":{"enum":["E","Z","UNSPECIFIED","NOT_ASSESSED"]},"status":{"enum":["specified-by-exercise","unspecified-by-exercise","radical-center-not-assessed"]},"displayLocants":{"type":"array","items":{"type":"integer","minimum":1,"maximum":18},"minItems":2,"maxItems":2}},"required":["originBond","originalTeachingGeometry","value","status","displayLocants"]},"minItems":2,"maxItems":2},"C9":{"type":"object","additionalProperties":false,"properties":{"value":{"enum":["UNSPECIFIED","NOT_APPLICABLE"]},"status":{"enum":["unspecified-by-exercise","center-absent-after-carbonyl"]}},"required":["value","status"]}},"required":["alkenes","C9"]},"numberingFrame":{"enum":["source-chain","product-display-not-full-IUPAC-name"]},"originToProductCarbon":{"type":"array","items":{"type":"object","additionalProperties":false,"properties":{"originAtomId":{"type":"string","pattern":"^(C[1-9][0-9]*|O[1-9][0-9]*|H[1-9][0-9]*_[1-9][0-9]*)$","maxLength":24},"componentId":{"type":"string","minLength":1,"maxLength":40},"displayCarbonNumber":{"type":"integer","minimum":1,"maximum":18}},"required":["originAtomId","componentId","displayCarbonNumber"]},"minItems":1,"maxItems":18},"isTrajectory":{"enum":[false]},"hasComputedCoordinates":{"enum":[false]}},"required":["schemaVersion","state","geometryVariant","evidenceContextId","atoms","bonds","boundaryBonds","components","localAtomCounts","localFormalCharge","unpairedElectronCount","wholeSystemAccounting","stereochemistry","numberingFrame","originToProductCarbon","isTrajectory","hasComputedCoordinates"]}},"$comment":"Drafts may be chemically incorrect. Validate without normalization; archive the original payload even when schema or chemistry fails. This schema does not authorize replacing a draft with an expected graph."};
GRAPH_SCHEMA.properties.components.items.properties.radicalKind.enum.push('unclassified');
export const issue = (code, path, message) => ({ code, path, message });
export function parseBoundedJSON(raw, maxBytes = 262144) {
  if (typeof raw !== 'string') return { ok: false, issues: [issue('text-required', '$', 'Input must be primitive JSON text.')] };
  if (raw.length > maxBytes || new TextEncoder().encode(raw).length > maxBytes) return { ok: false, issues: [issue('input-too-large', '$', 'JSON text exceeds the byte limit.')] };
  let i = 0, nodes = 0;
  const fail = (code) => { throw Object.assign(new Error(code), { code }); };
  const ws = () => { while (/\s/.test(raw[i] || '') && i < raw.length) { if (!' \t\r\n'.includes(raw[i])) fail('invalid-json'); i++; } };
  function string() {
    const start = i++;
    while (i < raw.length) {
      if (raw[i] === '\\') { i += 2; continue; }
      if (raw[i++] === '"') {
        const value = JSON.parse(raw.slice(start, i));
        if (value.length > 10000) fail('string-too-long');
        return value;
      }
    }
    fail('invalid-json');
  }
  function value(depth) {
    if (depth > 24) fail('input-too-deep');
    if (++nodes > 24000) fail('too-many-values');
    ws();
    if (raw[i] === '"') return string();
    if (raw[i] === '{') {
      i++; ws(); const out = {}; const keys = new Set();
      if (raw[i] === '}') { i++; return out; }
      while (i < raw.length) {
        ws(); if (raw[i] !== '"') fail('invalid-json');
        const k = string();
        if (keys.has(k)) fail('duplicate-key');
        if (['__proto__', 'constructor', 'prototype'].includes(k)) fail('unsafe-key');
        if (keys.size >= 100) fail('too-many-keys');
        keys.add(k); ws(); if (raw[i++] !== ':') fail('invalid-json'); out[k] = value(depth + 1); ws();
        if (raw[i] === '}') { i++; return out; }
        if (raw[i++] !== ',') fail('invalid-json');
      }
      fail('invalid-json');
    }
    if (raw[i] === '[') {
      i++; ws(); const out = []; if (raw[i] === ']') { i++; return out; }
      while (i < raw.length) {
        if (out.length >= 256) fail('array-too-long'); out.push(value(depth + 1)); ws();
        if (raw[i] === ']') { i++; return out; } if (raw[i++] !== ',') fail('invalid-json');
      }
      fail('invalid-json');
    }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]]) {
      if (raw.slice(i, i + token.length) === token) { i += token.length; return result; }
    }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(raw.slice(i));
    if (!match) fail('invalid-json'); i += match[0].length;
    const number = Number(match[0]); if (!Number.isFinite(number)) fail('nonfinite-number'); return number;
  }
  try { const parsed = value(0); ws(); if (i !== raw.length) fail('invalid-json'); return { ok: true, value: parsed, issues: [] }; }
  catch (error) { return { ok: false, issues: [issue(error.code || 'invalid-json', '$', 'JSON text could not be accepted safely.')] }; }
}
const en = (...values) => ({ enum: values });
const obj = (properties) => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) });
const arr = (items, maxItems) => ({ type: 'array', items, minItems: 0, maxItems });
const variants = en('EE', 'EZ', 'unknown');
const carbon = en('UNSELECTED', ...Array.from({ length: 18 }, (_, i) => `C${i + 1}`));
const geometry = en('UNSELECTED', 'E', 'Z', 'UNSPECIFIED', 'NOT_ASSESSED');
const choices = obj({ cutBond: en('UNSELECTED', 'C8-C9', 'C9-C10'), C9O9BondOrder: en('UNSELECTED', 1, 2, 3), radicalAtomId: en('UNSELECTED', 'O9', 'C8', 'C9', 'C10'), keepFragments: en('UNSELECTED', 'both', 'head-only', 'tail-only') });
const markers = arr(obj({ atomId: en('C8', 'C9', 'C10', 'O9'), color: en('red', 'blue', 'green', 'yellow'), predictedFragment: en('UNSELECTED', 'head', 'tail') }), 4);
const claims = arr({ type: 'string', minLength: 1, maxLength: 200 }, 20);
const explanation = { type: 'string', maxLength: 10000 };
const initialRef = FIXTURE_SCHEMA.properties.initialStateRef;
const DRAFT_SCHEMA = obj({ schemaVersion: en('lipid-cleavage-draft/v1'), initialStateRef: initialRef, choices, numbering: obj({ headOriginAt1: carbon, tailOriginAt1: carbon, applied: { type: 'boolean' } }), geometry: obj({ C10_C11: geometry, C12_C13: geometry }), virtualMarkers: markers, explanation, evidenceClaims: claims });
const SUBMISSION_SCHEMA = obj({ schemaVersion: en('lipid-cleavage-submission/v1'), initialStateRef: initialRef, choices, candidateGraph: GRAPH_SCHEMA, virtualMarkers: markers, explanation, evidenceClaims: claims });
// This implements only the closed set of descriptor keywords above; descriptors are bundled constants.
function validate(value, schema, path, issues, defs = FIXTURE_SCHEMA.$defs) {
  if (issues.length >= 100) return;
  if (schema.$ref) return validate(value, defs.graph, path, issues, defs);
  if (schema.oneOf) {
    const matches = schema.oneOf.filter(s => { const failures = []; validate(value, s, path, failures, defs); return !failures.length; });
    if (matches.length !== 1) issues.push(issue('shape-choice', path, 'Value does not match one allowed shape.')); return;
  }
  if (schema.enum && !schema.enum.some(x => x === value)) { issues.push(issue('shape-enum', path, 'Value is outside the declared choices.')); return; }
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) { issues.push(issue('shape-object', path, 'Expected an object.')); return; }
    for (const key of Object.keys(value)) if (!Object.hasOwn(schema.properties, key)) issues.push(issue('unknown-field', `${path}.${key}`, 'Unknown field.'));
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) issues.push(issue('missing-field', `${path}.${key}`, 'Required field is absent.'));
    for (const [key, sub] of Object.entries(schema.properties)) if (Object.hasOwn(value, key)) validate(value[key], sub, `${path}.${key}`, issues, defs);
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) { issues.push(issue('shape-array', path, 'Expected an array.')); return; }
    if (value.length < (schema.minItems || 0) || value.length > schema.maxItems) issues.push(issue('shape-length', path, 'Array length is outside its bound.'));
    value.forEach((v, i) => validate(v, schema.items, `${path}[${i}]`, issues, defs));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') { issues.push(issue('shape-string', path, 'Expected text.')); return; }
    if (value.length < (schema.minLength || 0) || value.length > (schema.maxLength || 10000) || (schema.pattern && !(new RegExp(schema.pattern)).test(value))) issues.push(issue('shape-string-value', path, 'Text is outside the declared format.'));
  } else if (schema.type === 'integer') {
    if (!Number.isInteger(value) || value < schema.minimum || value > schema.maximum) issues.push(issue('shape-integer', path, 'Expected a bounded integer.'));
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') issues.push(issue('shape-boolean', path, 'Expected a boolean.'));
}
export function validateGraphShape(value) { const issues = []; validate(value, GRAPH_SCHEMA, '$', issues); return issues; }
export function inspectLipidCleavageInput(raw, kind = 'draft') {
  const parsed = parseBoundedJSON(raw);
  if (!parsed.ok) return { ...parsed, stage: 'shape', status: 'rejected', value: null };
  const value = parsed.value;
  let schema;
  if (kind === 'draft') schema = DRAFT_SCHEMA;
  if (kind === 'graph') schema = GRAPH_SCHEMA;
  if (kind === 'attempt') schema = value?.schemaVersion === 'lipid-cleavage-attempt/v1' ? FIXTURE_SCHEMA : SUBMISSION_SCHEMA;
  const issues = [];
  if (!schema) issues.push(issue('input-kind', '$', 'Unknown input kind.')); else validate(value, schema, '$', issues);
  return { ok: !issues.length, stage: 'shape', status: issues.length ? 'rejected' : 'valid', issues, value: issues.length ? null : value };
}
