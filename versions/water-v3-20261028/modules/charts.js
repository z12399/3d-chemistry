import {clamp,interpolateEnergy,boltzmann} from './math.js';

// SVG colors stay explicit so charts remain readable outside the page stylesheet.
const chartColor={
  energy:'#087568',
  energyFill:'#65bea6',
  weight:'#245b9a',
  histogram:'#83a6c0',
  histogramEdge:'#537a9f',
  grid:'#aebfb9',
  text:'#3c5751',
  marker:'#bf4939',
  warning:'#a8342f',
};

export function energyChart(points,angle,temperature,histogram=[]){
  if(!points?.length)return '<div class="chart-empty">這條羥基旋轉軸尚未建立位能曲線。<br>仍可觀察方向，能量顯示暫不提供。</div>';
  const chart=typeof document==='undefined'?null:document.getElementById('energy-chart');
  const W=chart?.clientWidth||700,H=chart?.clientHeight||190;
  const compact=W<480,L=compact?38:45,R=W-(compact?10:20),T=18,B=H-(compact?43:46);
  const labelSize=compact?11:12,plotHeight=B-T;
  const maxRaw=Math.max(...points.map(p=>p.energy));
  const max=Math.min(100,Math.max(5,Math.ceil(maxRaw/5)*5));
  const x=a=>L+a/360*(R-L),y=e=>B-clamp(e/max,0,1)*(B-T);
  const path=points.map(p=>`${x(p.angle).toFixed(2)},${y(p.energy).toFixed(2)}`).join(' L');
  const probabilities=boltzmann(points.slice(0,-1),temperature),pmax=Math.max(...probabilities);
  const curve=probabilities.map((p,i)=>`${x(points[i].angle).toFixed(2)},${(B-p/pmax*Math.min(55,plotHeight*.55)).toFixed(2)}`).join(' L');
  const value=interpolateEnergy(points,angle);
  let bars='';
  if(histogram.length&&histogram.some(Boolean)){
    const n=Math.max(...histogram);
    const barHeight=Math.min(45,plotHeight*.45);
    bars=histogram.map((c,i)=>`<rect x="${x(i*10)}" y="${B-c/n*barHeight}" width="${(R-L)/36-1}" height="${c/n*barHeight}" fill="${chartColor.histogram}" stroke="${chartColor.histogramEdge}" stroke-width=".5"/>`).join('');
  }
  const ticks=compact?[0,90,180,270,360]:[0,60,120,180,240,300,360];
  const energyLegend=compact?'— ΔE 位能':'— MMFF94 相對位能';
  const weightLegend=compact?'┄ Boltzmann':'┄ 相對 Boltzmann 權重（獨立縮放）';
  const warning=compact?'&gt;100 kJ/mol 截頂':'超過 100 kJ/mol 的曲線截頂；數值照實顯示';
  return `<svg viewBox="0 0 ${W} ${H}" data-plot-left="${L}" data-plot-right="${R}" data-view-width="${W}" role="img" aria-label="目前二面角 ${angle.toFixed(0)} 度，位能 ${value.toFixed(2)} kJ/mol"><defs><linearGradient id="energy-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${chartColor.energyFill}" stop-opacity=".28"/><stop offset="1" stop-color="${chartColor.energyFill}" stop-opacity="0"/></linearGradient></defs>${[0,.5,1].map(k=>`<path d="M${L},${y(max*k)}H${R}" stroke="${chartColor.grid}" stroke-dasharray="3 5"/><text x="${L-9}" y="${y(max*k)+4}" text-anchor="end" fill="${chartColor.text}" font-size="${labelSize}">${Math.round(max*k)}</text>`).join('')}<path d="M${L},${B} L${path} L${R},${B}Z" fill="url(#energy-fill)"/>${bars}<path d="M${curve}" fill="none" stroke="${chartColor.weight}" stroke-width="2.1" stroke-dasharray="6 5"/><path d="M${path}" fill="none" stroke="${chartColor.energy}" stroke-width="3"/><path d="M${x(angle)},${T}V${B}" stroke="${chartColor.marker}" stroke-width="1.8" stroke-dasharray="3 4"/><circle cx="${x(angle)}" cy="${y(value)}" r="5" fill="${chartColor.marker}" stroke="#ffffff" stroke-width="2"/>${ticks.map(a=>`<text x="${x(a)}" y="${B+19}" text-anchor="middle" fill="${chartColor.text}" font-size="${labelSize}">${a}°</text>`).join('')}<text x="${L}" y="${H-5}" fill="${chartColor.energy}" font-size="${labelSize}">${energyLegend}</text><text x="${compact?L+104:220}" y="${H-5}" fill="${chartColor.weight}" font-size="${labelSize}">${weightLegend}</text>${maxRaw>100?`<text x="${R}" y="12" text-anchor="end" fill="${chartColor.warning}" font-size="${compact?10:11}">${warning}</text>`:''}</svg>`;
}

export function newmanSVG(model,bond){
  const by=Object.fromEntries(model.atoms.map(a=>[a.id,a]));
  if(!bond)return '';
  const pos=id=>by[id].position;
  const p=pos(bond.a),q=pos(bond.b);
  let u=q.map((v,i)=>v-p[i]);
  const len=Math.hypot(...u);
  u=u.map(v=>v/len);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  let e=cross(u,[0,0,1]);
  if(Math.hypot(...e)<.1)e=cross(u,[0,1,0]);
  const n=Math.hypot(...e);
  e=e.map(v=>v/n);
  const f=cross(u,e);
  let html='<circle cx="95" cy="87" r="25" fill="#eaf3ef" stroke="#56746c" stroke-width="2"/>';
  for(const [center,other,back]of[[bond.b,bond.a,true],[bond.a,bond.b,false]]){
    for(const b of model.bonds.filter(b=>b.a===center||b.b===center)){
      const id=b.a===center?b.b:b.a;
      if(id===other)continue;
      const v=pos(id).map((x,i)=>x-pos(center)[i]);
      const theta=Math.atan2(dot(v,f),dot(v,e)),x=Math.cos(theta),y=Math.sin(theta),r=back?25:0;
      html+=`<line x1="${95+x*r}" y1="${87-y*r}" x2="${95+x*53}" y2="${87-y*53}" stroke="${back?'#536c77':chartColor.energy}" stroke-width="2.5"/><text x="${95+x*68}" y="${91-y*68}" text-anchor="middle" fill="${by[id].element==='O'?chartColor.warning:'#253e47'}" font-size="12">${id.startsWith('HC')?'H':id}</text>`;
    }
  }
  return `<svg viewBox="0 0 190 170" role="img" aria-label="沿 ${bond.a} 到 ${bond.b} 的 Newman 投影">${html}<circle cx="95" cy="87" r="4" fill="${chartColor.energy}"/></svg>`;
}
