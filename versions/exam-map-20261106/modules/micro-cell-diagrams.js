import {escapeHTML as esc} from './storage.js';

// Conceptual sections of selected structures, not measured geometry or microscopy.
export function cellStructureSvg(state,selected,prefix='micro-cell'){
  const palette=state.diagramKind==='spore'?['#e9d9b3','#ece5c6','#cad9cf','#89b5ac','#eef3ef']:state.diagramKind==='gram-negative'?['#bacdce','#edf0df','#9dbfb8','#eef5f1']:['#d2c5de','#90b6ad','#eef5f1'];
  const layers=state.layers.map((layer,index)=>{
    const inset=index*19,x=70+inset,y=64+inset,w=520-2*inset,h=255-2*inset,active=layer.id===selected;
    const extra=layer.id==='periplasm-peptidoglycan'?`<rect x="${x+9}" y="${y+9}" width="${w-18}" height="${h-18}" rx="${Math.max(18,h/2-9)}" fill="none" stroke="#929974" stroke-width="5" stroke-dasharray="7 5" pointer-events="none"/>`:'';
    return `<g role="button" tabindex="0" aria-label="${esc(state.shortLabel)}：${esc(layer.label)}" aria-pressed="${active}" data-cell-layer="${esc(layer.id)}"><title>${esc(layer.label)}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.max(20,h/2)}" fill="${palette[index%palette.length]}" stroke="${active?'#245f56':'#71898a'}" stroke-width="${active?7:2}"/>${extra}</g>`;
  }).join('');
  const selectedLayer=state.layers.find(layer=>layer.id===selected),inside=state.layers.at(-1);
  return `<svg viewBox="0 0 660 400" role="group" aria-labelledby="${prefix}-diagram-title ${prefix}-diagram-desc"><title id="${prefix}-diagram-title">${esc(state.label)}的選定構造示意</title><desc id="${prefix}-diagram-desc">非比例、非顯微影像。選定構造由外到內：${esc(state.layers.map(layer=>layer.label).join('、'))}。可用 Tab 選取各層。</desc><text x="38" y="34" font-size="27" fill="#52686d">外側</text>${layers}<text x="330" y="198" text-anchor="middle" font-size="27" fill="#1d4248" pointer-events="none">${esc(inside.shortLabel||inside.label)}</text><text x="330" y="365" text-anchor="middle" font-size="27" fill="#245f56">${esc(selectedLayer?.shortLabel||selectedLayer?.label||'選一個構造')}</text></svg>`;
}

export function gramSignalSvg(state,result,prefix='micro-gram'){
  const signal=result?.signalId||'hidden',colors={purple:'#76558f','pink-red':'#c85c7d','no-visible-color':'#fbfbfb',uninterpreted:'#f0f1f2','not-inferred':'#f0f1f2',hidden:'#eef1f2'};
  const label=result?.label||'尚未核對',fill=colors[signal]||colors.hidden;
  return `<svg viewBox="0 0 520 245" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-cell-signal="${esc(signal)}"><title id="${prefix}-title">${esc(state.shortLabel)}：${esc(label)}</title><desc id="${prefix}-desc">染色外觀概念示意，非顯微影像；顏色是這個階段的參考訊號，不代表存活或完整細胞包膜。</desc><rect x="74" y="46" width="372" height="135" rx="67" fill="${fill}" stroke="#71898a" stroke-width="3"/>${signal==='hidden'?'<text x="260" y="133" text-anchor="middle" font-size="58" fill="#71898a">?</text>':''}<text x="260" y="223" text-anchor="middle" font-size="28" fill="#1d4248">${esc(label)}</text></svg>`;
}
