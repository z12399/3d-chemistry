export const NUTRIENT_RETENTION_ID='nutrient-retention';
export const RETENTION_FIELDS=Object.freeze([
  {key:'rawWeight',label:'生食總重',unit:'g',initial:'300'},
  {key:'rawConcentration',label:'生食濃度',unit:'mg / 100 g',initial:'20'},
  {key:'solidWeight',label:'熟食固形物總重',unit:'g',initial:'180'},
  {key:'solidConcentration',label:'熟食固形物濃度',unit:'mg / 100 g',initial:'25'},
  {key:'brothWeight',label:'原湯汁總重',unit:'g',initial:'150'},
  {key:'brothConcentration',label:'原湯汁濃度',unit:'mg / 100 g',initial:'4'}
]);
export const RETENTION_QUESTIONS=Object.freeze([
  {id:'concentration',prompt:'熟食固形物每 100 g 的濃度高於生食，就能證明營養素總量增加嗎？',options:[['yes','可以，濃度增加就是總量增加'],['mass','不能，還要乘上對應食物重量']],correct:'mass',reason:'濃度要乘上食物總重，才得到這一份的營養素量。預設固形物濃度增加 25%，總量卻由 60 mg 變為 45 mg。'},
  {id:'dilution',prompt:'在營養素不流失、完全混合的假設下，向湯裡加清水，再喝掉相同比例的湯，吃進的營養素量會變嗎？',options:[['less','會，濃度下降就一定吃得更少'],['same','不會，同一比例仍分到同一比例的營養素'],['more','會，喝到更重的湯所以更多']],correct:'same',reason:'這裡固定的是喝掉的比例，不是固定喝幾克；加水讓湯更重、濃度更低，整鍋的營養素量維持不變。'}
]);
export function createRetentionDraft(){return {values:Object.fromEntries(RETENTION_FIELDS.map(f=>[f.key,f.initial])),brothPercent:100,addedWater:0,answers:{},observation:'',details:{}};}
export function calculateRetention(draft){
  const v={},errors=[];
  for(const f of RETENTION_FIELDS){const raw=draft.values?.[f.key],n=Number(raw);if(raw==null||String(raw).trim()===''||!Number.isFinite(n)||n<0)errors.push(f.label+'須為非負且有限的數值。');else v[f.key]=n;}
  for(const [key,min,max,label] of [['brothPercent',0,100,'喝湯比例'],['addedWater',0,300,'加水量']]){const n=Number(draft[key]);if(draft[key]==null||String(draft[key]).trim()===''||!Number.isFinite(n)||n<min||n>max)errors.push(label+'超出教學控制範圍。');else v[key]=n;}
  if(errors.length)return {ok:false,errors};
  if(v.rawWeight<=0||v.rawConcentration<=0)return {ok:false,errors:['生食重量與生食濃度須大於零，才能計算留存率。']};
  if(v.solidWeight===0&&v.solidConcentration>0)return {ok:false,errors:['固形物為 0 g 時無法指定其濃度；請提供有重量的固形物，或把固形物濃度也設為 0。']};
  if(v.brothWeight===0&&v.brothConcentration>0)return {ok:false,errors:['原湯汁為 0 g 時無法指定其濃度；請提供有重量的湯汁，或把原湯汁濃度也設為 0。']};
  const raw=v.rawWeight*v.rawConcentration/100,solid=v.solidWeight*v.solidConcentration/100,broth=v.brothWeight*v.brothConcentration/100;
  const dilutedWeight=v.brothWeight+v.addedWater,consumedBroth=broth*v.brothPercent/100,consumed=solid+consumedBroth;
  const result={ok:true,values:v,raw,solid,broth,consumedBroth,consumed,retention:consumed/raw*100,solidRetention:solid/raw*100,allRetention:(solid+broth)/raw*100,concentrationRatio:v.solidWeight?v.solidConcentration/v.rawConcentration*100:null,gap:raw-solid-broth,dilutedWeight,dilutedConcentration:dilutedWeight?broth/dilutedWeight*100:null,consumedBrothWeight:dilutedWeight*v.brothPercent/100};
  if(Object.entries(result).some(([k,n])=>typeof n==='number'&&!Number.isFinite(n)))return {ok:false,errors:['數值過大，計算結果超出可表示範圍。請核對輸入與單位。']};
  return result;
}
export function checkRetentionAnswer(draft,id){
  const question=RETENTION_QUESTIONS.find(q=>q.id===id),answer=draft.answers[id];
  if(!question||!answer||!question.options.some(([value])=>value===answer.current))return false;
  if(!answer.first)answer.first=answer.current;
  if(!answer.firstChecked)answer.firstChecked=answer.current;
  answer.checked=answer.current;return true;
}
export function chooseRetentionAnswer(draft,id,value){
  const question=RETENTION_QUESTIONS.find(q=>q.id===id);
  if(!question||!question.options.some(([v])=>v===value))throw new RangeError('Unknown retention answer');
  const answer=draft.answers[id]??(draft.answers[id]={});
  if(!answer.first)answer.first=value;
  answer.current=value;return answer;
}
const fmt=n=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(n);
export function buildRetentionSummary(d){
  const r=calculateRetention(d),lines=['【營養素留存：一餐的質量帳】','教學數值；輸入是觀測量，不是烹煮參數。'];
  for(const f of RETENTION_FIELDS)lines.push(f.label+'：'+String(d.values?.[f.key]??'')+' '+f.unit);
  lines.push('喝湯比例：'+d.brothPercent+'%；另外加入不含此營養素的水：'+d.addedWater+' g。');
  if(r.ok)lines.push('生食 '+fmt(r.raw)+' mg；固形物 '+fmt(r.solid)+' mg；整鍋湯 '+fmt(r.broth)+' mg；實際吃進 '+fmt(r.consumed)+' mg；相對生食留存 '+fmt(r.retention)+'%。','固形物濃度比 '+(r.concentrationRatio===null?'未定義':fmt(r.concentrationRatio)+'%')+'；收支差 '+fmt(r.gap)+' mg。收支差不能直接等同熱破壞量。');
  else lines.push('尚不能計算：'+r.errors.join(' '));
  for(const q of RETENTION_QUESTIONS){const a=d.answers[q.id]||{},label=value=>q.options.find(([v])=>v===value)?.[1]||'未作答';lines.push(q.prompt,'首次選擇：'+label(a.first)+'；首次核對：'+label(a.firstChecked)+'；目前選擇：'+label(a.current)+'；最近核對：'+label(a.checked));}
  if(d.observation.trim())lines.push('我的觀察：\n'+d.observation);
  return lines.join('\n');
}
export {fmt as formatRetentionNumber};
