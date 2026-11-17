import {escapeHTML as esc} from './storage.js';

export const OBSERVATION_LABELS = Object.freeze({
  'nucleic-acid':'核酸訊號', 'cell-surface':'細胞表面', 'host-interior':'細胞內',
  'host-chromosome':'染色體關聯', inheritance:'子代細胞', particle:'粒子形態',
  infectivity:'感染性測定', 'input-control':'原始輸入對照',
});

/** Show only which objects the current authored cards report observations about. */
export function phageEvidenceSvg(item, level, selected, prefix = 'phage') {
  const visible = level.cardIds.map(id => item.cards.find(card => card.id === id));
  const scopes = Object.keys(OBSERVATION_LABELS);
  const cells = scopes.map((scope, index) => {
    const provided = visible.some(card => card.observationScope === scope), active = scope === selected;
    const x = 16 + (index % 4) * 174, y = 20 + Math.floor(index / 4) * 119;
    return `<g role="button" tabindex="0" data-phage-scope="${scope}" data-phage-provided="${provided}" aria-pressed="${active}" aria-label="${OBSERVATION_LABELS[scope]}：${provided ? '目前已提供觀察' : '目前未提供'}"><rect x="${x}" y="${y}" width="160" height="102" rx="12" fill="${provided ? '#e3f0e8' : '#f1f3f2'}" stroke="${active ? '#2b6359' : '#b8c9c0'}" stroke-width="${active ? 4 : 2}"/><text x="${x + 80}" y="${y + 39}" text-anchor="middle" font-size="24" fill="#244a47" pointer-events="none">${OBSERVATION_LABELS[scope]}</text><text x="${x + 80}" y="${y + 77}" text-anchor="middle" font-size="23" fill="#566e69" pointer-events="none">${provided ? '有觀察資料' : '本組未提供'}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 714 263" role="group" aria-labelledby="${prefix}-evidence-title ${prefix}-evidence-desc"><title id="${prefix}-evidence-title">目前證據觀察了什麼？</title><desc id="${prefix}-evidence-desc">只標示當前證據卡提供了哪些對象的觀察。沒有箭頭或必然因果關係；有觀察資料不代表該項陽性，未提供也不代表陰性。用鍵盤選取節點可查看題設提供的觀察。</desc>${cells}</svg>`;
}

// These are selected-part teaching diagrams, not molecular or microscopy coordinates.
export function phageStructureSvg(example, selected, prefix = 'phage') {
  const t4 = example.id === 't4';
  const head = t4 ? 'M270 35 300 65 300 151 270 179 240 151 240 65Z' : 'M270 37 327 71 327 136 270 170 213 136 213 71Z';
  const shapes = {
    capsid:`<path d="${head}" fill="#e3e9e5"/>`,
    genome:'<path d="M253 83C298 53 247 125 288 105S240 162 282 141M253 108C291 87 252 140 286 127" fill="none" stroke-linecap="round"/>',
    'tail-tube':t4 ? '<rect x="263" y="177" width="14" height="103" rx="5" fill="#d1dbe1"/>' : '<path d="M270 170C311 218 220 256 271 318" fill="none" stroke-linecap="round"/>',
    'tail-sheath':'<path d="M246 183H261V258H246ZM279 183H294V258H279Z" fill="#bccbbd"/><path d="M246 197H261M246 214H261M246 231H261M279 197H294M279 214H294M279 231H294" fill="none"/>',
    baseplate:'<path d="M239 268 252 258H288L301 268 289 281H251Z" fill="#cfc8dc"/>',
    'long-tail-fibers':'<path d="M243 268 183 217 206 134M297 268 355 217 336 139M245 275 187 298 158 337M295 275 353 299 380 337" fill="none" stroke-linejoin="round" stroke-linecap="round"/>',
    'short-tail-fibers':'<path d="M250 278 246 308M263 281 260 314M278 281 282 314M289 278 295 308" fill="none" stroke-linecap="round"/>',
    'tail-tip':'<path d="M270 307C251 314 261 335 280 331L291 316" fill="#cec8db"/><path d="M275 330 263 344M282 327 295 340" fill="none" stroke-linecap="round"/>',
  };
  const parts = example.structures.map(part => {
    const active = part.id === selected, wide = ['genome', 'tail-tube', 'long-tail-fibers', 'short-tail-fibers'].includes(part.id);
    const width = part.id === 'tail-tube' && !t4 ? 13 : active ? 7 : wide ? 5 : 2.5;
    return `<g role="button" tabindex="0" data-phage-part="${esc(part.id)}" aria-label="${esc(example.shortLabel)}：${esc(part.label)}" aria-pressed="${active}" stroke="${active ? '#285d59' : '#7b8e8a'}" stroke-width="${width}" class="phage-part"><title>${esc(part.label)}</title>${shapes[part.id] || ''}</g>`;
  }).join('');
  const part = example.structures.find(p => p.id === selected);
  return `<svg viewBox="0 0 540 410" role="group" aria-labelledby="${prefix}-structure-title ${prefix}-structure-desc" data-phage-example="${esc(example.id)}"><title id="${prefix}-structure-title">${esc(example.label)}選定構造</title><desc id="${prefix}-structure-desc">非比例概念圖。${t4 ? '尾管與尾鞘採分開顯示的剖示，長尾纖維只畫部分示意分枝，不表示每條都伸展或代表實際數目。' : '此例只畫衣殼、基因體、非收縮性尾管與尾端，不表示所有 lambda 株都沒有側纖維。'}可按 Tab、Enter 或空白鍵選取構造。</desc><rect x="1" y="1" width="538" height="408" rx="12" fill="#fafcfb"/>${parts}<text x="270" y="390" text-anchor="middle" font-size="27" fill="#244d49">${esc(part?.shortLabel || part?.label || '選一個構造')}</text></svg>`;
}

function virion(x, y, {kind = 't4', genome = false, scale = 1, rotate = 0} = {}) {
  const tail = kind === 't4' ? '<path d="M0 17V49M-6 22V40M6 22V40M-11 49H11M-9 49-22 67M9 49 22 67" fill="none"/>' : '<path d="M0 17C19 34-17 41 0 61" fill="none"/>';
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" stroke="#758a86" stroke-width="2.5"><path d="M0-19 17-10 17 10 0 19-17 10-17-10Z" fill="#e5ece7"/>${tail}${genome ? '<path d="M-9-5C13-15-12 14 10 4" fill="none" stroke="#267568" stroke-width="3.5"/>' : ''}</g>`;
}
const freeDna = (x, y, scale = 1) => `<path d="M0 0C38-45 69 42 106 0S153 44 166 0" transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#267568" stroke-width="6" stroke-linecap="round"/>`;
function chromosome(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0C0-70 164-70 164 0S0 70 0 0Z" fill="none" stroke="#a8b1b2" stroke-width="7"/><path d="M133-36C153-31 164-15 164 0C164 12 157 24 147 31" fill="none" stroke="#267568" stroke-width="9"/></g>`;
}

export function phageCycleSvg(example, stage, {revealed = false, prefix = 'phage'} = {}) {
  if (!revealed) return `<svg viewBox="0 0 700 330" role="img" aria-labelledby="${prefix}-cycle-title" data-phage-cycle="hidden"><title id="${prefix}-cycle-title">本步圖示尚未核對</title><rect x="100" y="42" width="500" height="220" rx="28" fill="#f0f3f2" stroke="#c2ceca" stroke-width="2"/><text x="350" y="149" font-size="52" text-anchor="middle" fill="#718780">?</text><text x="350" y="210" font-size="27" text-anchor="middle" fill="#4e6861">留下判讀，或直接看參考</text></svg>`;
  const genome = stage.answers.genome, progeny = stage.answers.progeny, host = stage.diagramState.host;
  let scene = '';
  if (host === 'dividing') {
    scene += '<rect x="205" y="65" width="190" height="176" rx="80" fill="#f1f5ef" stroke="#91a58f" stroke-width="4"/><rect x="423" y="65" width="190" height="176" rx="80" fill="#f1f5ef" stroke="#91a58f" stroke-width="4"/>';
    scene += chromosome(246, 150, .64) + chromosome(461, 150, .64);
    scene += '<text x="406" y="287" text-anchor="middle" font-size="27" fill="#456443">隨宿主染色體傳遞</text>';
  } else {
    scene += host === 'lysed' ? '<path d="M240 84C151 111 164 243 248 249M285 65H404M448 70C558 55 607 153 562 222M517 250H432M383 254H295" fill="#f7f9f5" stroke="#91a58f" stroke-width="4" stroke-linecap="round"/>' : '<rect x="190" y="65" width="410" height="190" rx="90" fill="#f1f5ef" stroke="#91a58f" stroke-width="4"/>';
    if (genome === 'parent-capsid') {
      scene += virion(99, 156, {kind:example.id, genome:true, rotate:-90, scale:1.25});
      scene += '<path d="M177 156H190" stroke="#869b94" stroke-width="3" stroke-dasharray="4 4"/><text x="95" y="252" text-anchor="middle" font-size="26" fill="#4e6861">入侵粒子</text>';
    } else if (genome === 'host-interior') {
      if (stage.id === 'biosynthesis') {
        scene += freeDna(258, 116, .75) + freeDna(272, 161, .75);
        scene += '<g fill="#b7c7bd" stroke="#80988a" stroke-width="2"><path d="M458 108 470 99 482 108 482 122 470 130 458 122Z"/><path d="M495 159 507 150 519 159 519 173 507 181 495 173Z"/><path d="M455 187V211M462 187V211" fill="none"/></g>';
      } else scene += freeDna(280, 159, .98);
      if (stage.id === 'entry') scene += '<path d="M103 150H232" fill="none" stroke="#6a9990" stroke-width="3" stroke-dasharray="7 6"/><path d="M220 142 233 150 220 158" fill="none" stroke="#6a9990" stroke-width="3"/>';
      scene += `<text x="395" y="${stage.id === 'biosynthesis' ? 291 : 222}" text-anchor="middle" font-size="26" fill="#286456">${stage.id === 'biosynthesis' ? '基因體與部件分開製造' : '未整合、未包裝的病毒 DNA'}</text>`;
    } else if (genome === 'prophage') {
      scene += chromosome(308, 156, 1);
      scene += '<text x="395" y="228" text-anchor="middle" font-size="26" fill="#286456">綠段：整合的噬菌體 DNA</text>';
    }
    if (progeny === 'inside') {
      scene += virion(290, 120, {kind:example.id, genome:true, scale:.8}) + virion(390, 168, {kind:example.id, genome:true, scale:.8}) + virion(493, 114, {kind:example.id, genome:true, scale:.8});
      scene += '<text x="395" y="291" text-anchor="middle" font-size="27" fill="#286456">新粒子仍在宿主內</text>';
    } else if (progeny === 'released') {
      scene += virion(93, 110, {kind:example.id, genome:true, scale:.85}) + virion(639, 130, {kind:example.id, genome:true, scale:.85}) + virion(392, 272, {kind:example.id, genome:true, scale:.65, rotate:-90});
    }
  }
  const status = host === 'dividing' ? '宿主分裂的概念階段' : host === 'lysed' ? '裂解與釋放的概念階段' : '宿主細胞（只畫概念邊界）';
  return `<svg viewBox="0 0 700 330" role="img" aria-labelledby="${prefix}-cycle-title ${prefix}-cycle-desc" data-phage-cycle="${esc(stage.id)}" data-phage-genome="${esc(genome)}" data-phage-progeny="${esc(progeny)}" data-phage-host="${esc(host)}"><title id="${prefix}-cycle-title">${esc(example.shortLabel)}：${esc(stage.label)}</title><desc id="${prefix}-cycle-desc">依來源選定的一個概念階段，不表示全部基因體狀態同步。細胞邊界不是實際膜層；箭頭不是尾管穿膜構造。粒子圖示的個數沒有數量意義，成熟外形不等於已測感染性。</desc><text x="395" y="35" text-anchor="middle" font-size="26" fill="#526d60">${status}</text>${scene}</svg>`;
}
