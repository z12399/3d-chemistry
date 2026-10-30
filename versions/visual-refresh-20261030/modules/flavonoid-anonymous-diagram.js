/** Anonymous copies of eight pinned teaching depictions; never changes source data.
 * Removes teaching annotations/identity only. Chemical drawing paths stay byte exact.
 * This is presentation anonymity, not an arbitrary-SVG sanitizer or visual validator.
 */
const SOURCES = Object.freeze({"naringenin-chalcone":{"sha256":"526891c605d65ffbd243bf764f97d6f6a32219d2e083d3c1a53333efbe0fa8d5","notePaths":9,"ringLabels":2},"apigenin":{"sha256":"5b5806516c79067958a1a0ecf4ea828c32da356e926332d6589aa3b8ae79b627","notePaths":3,"ringLabels":3},"s-naringenin":{"sha256":"deed7af9e56c483524f6e7c2c6547de6469436c9f552f00aa8d70e13bb99e5ef","notePaths":3,"ringLabels":3},"quercetin":{"sha256":"8cf8ee11561ccac571d83c10fc92298f50ead5d667c6490bee34a9899bb2ef98","notePaths":3,"ringLabels":3},"taxifolin":{"sha256":"22cd48689c13ae79e0d2948600cdd29c6e075e074923b1a7c429003d1c9f52c2","notePaths":3,"ringLabels":3},"genistein":{"sha256":"33d2b6e3b44e2759d742f7b302c4365dd3c3242e9c786769d0a4bcb72bdcfbc6","notePaths":3,"ringLabels":3},"catechin":{"sha256":"4f9784e34cc8f8e93e605bbd97476114f71591b305dc40d96cf0bef46d3cfa74","notePaths":3,"ringLabels":3},"cyanidin":{"sha256":"ad17746eda33fc896e7f4398e51d4af84a47754532a01d3c6ec981360a88458a","notePaths":3,"ringLabels":3}});
const fail = () => { throw new TypeError('Unsupported anonymous structure diagram'); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function field(value, key) {
  if (!plain(value)) return fail();
  const d = Object.getOwnPropertyDescriptor(value, key);
  if (!d?.enumerable || !Object.hasOwn(d, 'value')) return fail();
  return d.value;
}
// Same standalone synchronous SHA-256 algorithm already used by the graph model.
// Independent node:crypto checks in the new tests bind the actual input bytes.
function sha256(text){
 const bytes=new TextEncoder().encode(text),size=Math.ceil((bytes.length+9)/64)*64,block=new Uint8Array(size);block.set(bytes);block[bytes.length]=128;
 const view=new DataView(block.buffer);view.setUint32(size-8,Math.floor(bytes.length/0x20000000));view.setUint32(size-4,(bytes.length*8)>>>0);
 const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),rot=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<size;offset+=64){
  for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
  for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(rot(x,7)^rot(x,18)^(x>>>3))+w[i-7]+(rot(y,17)^rot(y,19)^(y>>>10)))>>>0;}
  let [a,b,c,d,e,f,g,z]=h;
  for(let i=0;i<64;i++){const t1=(z+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0,t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))>>>0;z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
  [a,b,c,d,e,f,g,z].forEach((v,i)=>{h[i]=(h[i]+v)>>>0;});
 }
 return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}

const chemicalPaths = svg => [...svg.matchAll(/<path\b[^>]*\bclass="(?:bond|atom)-[^"]*"[^>]*\/>/g)].map(m => m[0]);

/** c must be one of the eight source-identified representative records.
 * Returns an SVG string only; no case, graph, feature, source or answer payload.
 * alias is a generic task label: 結構題 or 結構題 1 through 結構題 8.
 */
export function anonymousFlavonoidDiagram(c, alias = '結構題') {
  if (typeof alias !== 'string' || !/^結構題(?: [1-8])?$/u.test(alias)) return fail();
  const id = field(c, 'id');
  if (typeof id !== 'string' || !Object.hasOwn(SOURCES, id) || field(c, 'isTransfer') !== false) return fail();
  const ref = SOURCES[id], diagram = field(c, 'diagram'), svg = field(diagram, 'svg');
  if (typeof svg !== 'string' || field(diagram, 'sha256') !== ref.sha256 || sha256(svg) !== ref.sha256
      || field(diagram, 'kind') !== 'computed-2d-depiction' || field(diagram, 'coordinateUnit') !== 'svg-pixel'
      || field(diagram, 'isExperimentalGeometry') !== false || field(diagram, 'width') !== 640 || field(diagram, 'height') !== 440) return fail();
  const labels = [...svg.matchAll(/\baria-label="[^"]*"/g)];
  const layers = [...svg.matchAll(/<g class="flavonoid-highlight-layer" aria-hidden="true">[\s\S]*?<\/g>/g)];
  const notes = [...svg.matchAll(/<path class="note"[^>]*\/>/g)];
  const rings = [...svg.matchAll(/<text\b[^>]*\bclass="flavonoid-ring-label"[^>]*>[\s\S]*?<\/text>/g)];
  if (labels.length !== 1 || layers.length !== 1 || notes.length !== ref.notePaths || rings.length !== ref.ringLabels
      || /<title\b|<desc\b|<metadata\b/i.test(svg) || (layers[0][0].match(/<g\b/g) || []).length !== 1) return fail();
  let result = svg.replace(labels[0][0], `aria-label="${alias}；計算二維結構示意"`)
    .replace(layers[0][0], '').replace(/<path class="note"[^>]*\/>/g, '')
    .replace(/<text\b[^>]*\bclass="flavonoid-ring-label"[^>]*>[\s\S]*?<\/text>/g, '');
  const originalPaint = chemicalPaths(svg), retainedPaint = chemicalPaths(result);
  if (!originalPaint.length || originalPaint.length !== retainedPaint.length || originalPaint.some((p, i) => p !== retainedPaint[i])
      || /data-atom-id|data-bond-id|data-highlight|flavonoid-highlight-layer|flavonoid-ring-label|class="note"|<text\b|<title\b|<desc\b|<metadata\b/i.test(result)) return fail();
  return result;
}
