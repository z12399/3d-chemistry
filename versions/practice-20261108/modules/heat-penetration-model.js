/** Constant-property, symmetric plane wall under an ideal step boundary.
 * This is a teaching solution of a PDE, not an identified food/process model.
 * x/L spans -1..1; L is HALF the entered full thickness. Time is minutes.
 */
export const HEAT_PENETRATION_ID = 'processing-heat-penetration';
export const DEFAULT_HEAT_PARAMETERS = Object.freeze({thicknessMm:20,conductivityWmK:.5,volumetricHeatCapacity:3500000,hWm2K:100,initialC:20,mediumC:90,boundary:'convective',durationMinutes:60});
export const HEAT_PENETRATION_SOURCES = Object.freeze([
  Object.freeze({title:'UCSB HeatLib · Plane Wall Convection',url:'https://sites.me.ucsb.edu/~bennett/heatlib/ex/cond/2_TranSlabEx.html'}),
  Object.freeze({title:'University of Washington · Transient conduction',url:'https://faculty.washington.edu/baneyx/340/Transient_conduction.pdf'}),
]);
export const HEAT_EFFECT_PARAMETERS = Object.freeze({referenceC:90,zC:10,qualityZC:30,qualityDMinutes:20});
const SERIES_TOLERANCE = 1e-12;
const MAX_MODES = 16384;
const GAUSS_NODES = [.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363];
const GAUSS_WEIGHTS = [.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763];

function range(value,min,max,name) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${name} must be finite and in [${min}, ${max}]`);
  return value;
}
function minute(value,duration) {
  range(value,0,duration,'minutes');
  if(value>0&&value<.1)throw new RangeError('The teaching cursor is 0 or at least 0.1 min');
}
function normalizedPosition(value) {return range(value,-1,1,'positionRatio');}

/** Returns a cached eigenbasis and independent fresh result records.
 * The convergent series has a conservative absolute tail bound; no one-term
 * shortcut is used for early heating. Tiny roundoff alone is clipped to [0,1].
 */
export function createHeatExperiment(options={}) {
  if(options===null||typeof options!=='object'||Array.isArray(options))throw new TypeError('Options must be an object');
  const p={...DEFAULT_HEAT_PARAMETERS,...options};
  range(p.thicknessMm,10,80,'full thickness (mm)');
  range(p.conductivityWmK,.2,.8,'conductivity (W/m/K)');
  range(p.volumetricHeatCapacity,2000000,4000000,'volumetric heat capacity (J/m3/K)');
  range(p.hWm2K,5,500,'h (W/m2/K)');
  range(p.initialC,0,40,'initial temperature (C)');
  range(p.mediumC,60,100,'medium temperature (C)');
  range(p.durationMinutes,.1,120,'duration (min)');
  if(!['convective','fixed-surface'].includes(p.boundary))throw new RangeError('Unknown boundary');
  const parameters=Object.freeze({...p});
  const halfThicknessM=p.thicknessMm/2000,alphaM2s=p.conductivityWmK/p.volumetricHeatCapacity;
  const biot=p.boundary==='convective'?p.hWm2K*halfThicknessM/p.conductivityWmK:null;
  const scaleMinutes=halfThicknessM**2/alphaM2s/60;
  const derived=Object.freeze({halfThicknessM,alphaM2s,biot,diffusionTimeMinutes:scaleMinutes});
  const basis=[];

  function ensureModes(count) {
    if(count>MAX_MODES)throw new RangeError('This time is below the supported series resolution');
    for(let n=basis.length;n<count;n++) {
      let lambda,coefficient,surfaceCos;
      if(biot===null) {
        lambda=(n+.5)*Math.PI;coefficient=2*(n%2?-1:1)/lambda;surfaceCos=0;
      } else {
        // Solve in the local interval delta in (0, pi/2), not tan(n*pi+delta).
        let lo=0,hi=Math.PI/2;
        for(let j=0;j<58;j++) {const mid=(lo+hi)/2;if((n*Math.PI+mid)*Math.tan(mid)>biot)hi=mid;else lo=mid;}
        const delta=(lo+hi)/2,sign=n%2?-1:1;
        lambda=n*Math.PI+delta;
        coefficient=4*sign*Math.sin(delta)/(2*lambda+Math.sin(2*delta));
        surfaceCos=sign*Math.cos(delta);
      }
      basis.push({lambda,coefficient,surfaceCos});
    }
  }
  function modeCount(fo) {
    const c=Math.PI**2*fo;
    // For all omitted n>=N>=1, lambda_n>=n*pi and |A_n|<=4/(n*pi).
    let count=Math.max(4,Math.ceil(Math.sqrt(-Math.log(SERIES_TOLERANCE)/c)));
    const tail=n=>4/(Math.PI*n)*Math.exp(-c*n*n)/(-Math.expm1(-c*(2*n+1)));
    while(tail(count)>SERIES_TOLERANCE)count++;
    ensureModes(count);
    return count;
  }
  function theta(fo,positionRatio) {
    const x=Math.abs(positionRatio);
    if(biot===null&&x===1)return 0; // fixed surface uses the t=0+ convention
    if(fo===0)return 1;
    const count=modeCount(fo);
    let sum=0,correction=0;
    for(let n=0;n<count;n++) {
      const {lambda,coefficient,surfaceCos}=basis[n];
      const term=coefficient*Math.exp(-lambda*lambda*fo)*(x===1?surfaceCos:Math.cos(lambda*x));
      const y=term-correction,t=sum+y;correction=(t-sum)-y;sum=t;
    }
    if(!Number.isFinite(sum)||sum< -1e-10||sum>1+1e-10)throw new RangeError('Series failed its normalized-temperature bounds');
    return Math.max(0,Math.min(1,sum));
  }
  function temp(fo,x) {return p.mediumC+(p.initialC-p.mediumC)*theta(fo,x);}
  function temperatures(minutes) {
    const fourier=minutes/scaleMinutes;
    return {minutes,fourier,centerC:temp(fourier,0),surfaceC:temp(fourier,1),mediumC:p.mediumC};
  }

  /** Composite 8-point Gauss-Legendre integration after t=u^2.
   * The transform resolves the early surface response, not a polygon on a plot.
   * Numerical approximation; independent spatial/temporal convergence is audited.
   */
  function effects(minutes) {
    const total={center:{fMinutes:0,qualityFMinutes:0},surface:{fMinutes:0,qualityFMinutes:0}};
    if(minutes>0) {
      const end=Math.sqrt(minutes),panels=Math.max(1,Math.ceil(Math.sqrt(minutes/scaleMinutes)/.05));
      const du=end/panels;
      for(let panel=0;panel<panels;panel++) {
        const middle=(panel+.5)*du,half=du/2;
        for(let j=0;j<GAUSS_NODES.length;j++)for(const sign of [-1,1]) {
          const u=middle+sign*half*GAUSS_NODES[j],t=u*u,factor=2*u*half*GAUSS_WEIGHTS[j];
          const value=temperatures(t);
          for(const location of ['center','surface']) {
            const tC=value[`${location}C`];
            total[location].fMinutes+=factor*10**((tC-90)/10);
            total[location].qualityFMinutes+=factor*10**((tC-90)/30);
          }
        }
      }
    }
    for(const value of Object.values(total))value.qualityRetention=10**(-value.qualityFMinutes/20);
    return total;
  }
  function at(minutes,positions=[0,.5,1]) {
    minute(minutes,p.durationMinutes);
    if(!Array.isArray(positions)||positions.length<1||positions.length>401)throw new RangeError('Supply 1–401 profile positions');
    positions.forEach(normalizedPosition);
    const result=temperatures(minutes);
    return {...result,profile:positions.map(positionRatio=>({positionRatio,temperatureC:temp(result.fourier,positionRatio)})),effects:effects(minutes)};
  }
  function history(count=81) {
    if(!Number.isInteger(count)||count<2||count>401)throw new RangeError('History count must be an integer in [2,401]');
    return Array.from({length:count},(_,i)=>temperatures(p.durationMinutes*i/(count-1)));
  }
  function timeToCenterFraction(fraction=.8) {
    range(fraction,.05,.95,'fraction of initial-to-medium temperature change');
    const target=1-fraction;
    let lo=0,hi=1;
    while(theta(hi,0)>target)hi*=2;
    for(let i=0;i<55;i++) {const mid=(lo+hi)/2;if(theta(mid,0)>target)lo=mid;else hi=mid;}
    const fourier=(lo+hi)/2,minutes=fourier*scaleMinutes;
    return {minutes,fourier,withinWindow:minutes<=p.durationMinutes};
  }
  return Object.freeze({parameters,derived,at,history,timeToCenterFraction});
}
