const today = new Date('2026-09-20T00:00:00');
const date = document.querySelector('#date');
date.value = '2026-09-27'; date.min = '2026-09-21';

const sourceMeta = {IndiGo:['6E','#203a82'], 'Air India':['AI','#c6252c'], 'Air India Express':['IX','#e35e24'], 'Akasa Air':['QP','#703a92'], SpiceJet:['SG','#d51936'], MakeMyTrip:['M','#e74b2d'], EaseMyTrip:['E','#16a56f'], Cleartrip:['C','#1887d1']};
const flightTemplates = [
  ['IndiGo','6E 2134','06:10 — 08:25','Saver',5189,1022],
  ['Air India','AI 865','07:00 — 09:20','Economy',5520,1048],
  ['Air India Express','IX 1423','08:40 — 10:55','Value',4875,1017],
  ['Akasa Air','QP 1121','11:05 — 13:20','Saver',5030,1005],
  ['SpiceJet','SG 8182','15:25 — 17:40','SpiceSaver',4699,1018],
  ['MakeMyTrip','6E 2134','06:10 — 08:25','OTA quote',5189,1374],
  ['EaseMyTrip','AI 865','07:00 — 09:20','OTA quote',5520,1282],
  ['Cleartrip','QP 1121','11:05 — 13:20','OTA quote',5030,1336]
];
const r = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
function quoteRows(origin='DEL',destination='BOM',window=7){
  const multiplier = 1 + (7-window)*.013;
  return flightTemplates.map((x,i)=>{ const base=Math.round(x[4]*multiplier+(origin.charCodeAt(0)+destination.charCodeAt(1))*2); const tax=x[5]; const [initial,color]=sourceMeta[x[0]]; return `<tr><td><span class="source-logo" style="background:${color}">${initial}</span><strong>${x[0]}</strong></td><td>${x[1]}</td><td>${x[2]}</td><td><span class="tag">${x[3]}</span></td><td>${r(base)}</td><td>${r(tax)}</td><td class="fare">${r(base+tax)}</td><td>11:${String(42-i*3).padStart(2,'0')} IST</td></tr>`; }).join('');
}
function renderQuotes(){
  const o=document.querySelector('#origin').value,d=document.querySelector('#destination').value,w=+document.querySelector('#window').value;
  if(o===d){ alert('Choose two different airports.'); return; }
  document.querySelector('#quotes').innerHTML=quoteRows(o,d,w);
  document.querySelector('#results-title').textContent=`Live fare comparison · ${o} → ${d}`;
  document.querySelector('#results-subtitle').textContent=`Departure ${new Date(date.value).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · T+${w} window · 8 normalized quotes`;
  const values=flightTemplates.map(x=>(x[4]*(1+(7-w)*.013)+x[5]));
  document.querySelector('#median').textContent=r(values.sort((a,b)=>a-b)[4]);
}
document.querySelector('#search').addEventListener('click',renderQuotes);
document.querySelector('#swap').addEventListener('click',()=>{const a=document.querySelector('#origin'),b=document.querySelector('#destination'); const v=a.value;a.value=b.value;b.value=v;renderQuotes()});

function makeChart(){
  const points=[106,108,107,110,109,112,114,113,116,115,117,119,118,121,120,123,122,125,124,126,125,127,126,128,127,129,128,130,129,128.4];
  const w=700,h=220,min=102,max=133; const coords=points.map((p,i)=>`${(i/(points.length-1)*w).toFixed(1)},${(h-(p-min)/(max-min)*h).toFixed(1)}`).join(' ');
  document.querySelector('#chart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#2e65de" stop-opacity=".25"/><stop offset="1" stop-color="#2e65de" stop-opacity="0"/></linearGradient></defs><path d="M ${coords} L ${w},${h} L 0,${h} Z" fill="url(#fill)"/><polyline points="${coords}" fill="none" stroke="#2861dc" stroke-width="3" stroke-linejoin="round"/><circle cx="700" cy="32.6" r="5" fill="#fff" stroke="#2861dc" stroke-width="3"/></svg>`;
}
const heat=[['DEL–BOM','+8.2%',4],['DEL–BLR','+5.4%',3],['BOM–BLR','+3.9%',2],['DEL–CCU','+7.1%',4],['BLR–HYD','−1.8%',1],['MAA–DEL','+4.6%',3],['BOM–GOI','+2.1%',2],['HYD–DEL','+6.3%',4]];
document.querySelector('#heatmap').innerHTML=heat.map(x=>`<div class="heat-cell" style="background:${['#e6f3ea','#faedc8','#f8d49a','#f1b475','#ed8c6d'][x[2]]}"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
const sources=[['IndiGo','Approved adapter · last response 2m ago','Healthy'],['Air India','Approved adapter · last response 4m ago','Healthy'],['Akasa Air','Scheduled run · rate limit observed','Throttled'],['OTAs (5)','Consent/API adapters · 98.6% freshness','Healthy']];
document.querySelector('#sources-list').innerHTML=sources.map((x,i)=>`<div class="source-row"><div><div class="source-name">${x[0]}</div><div class="source-detail">${x[1]}</div></div><span class="status" style="color:${x[2]==='Throttled'?'#b87908':''}">${x[2]}</span></div>`).join('');
document.querySelector('#download').addEventListener('click',()=>{const rows=[['source','flight','fare_class','base_fare_inr','taxes_fees_inr','total_fare_inr','capture_timestamp']].concat(flightTemplates.map(x=>[x[0],x[1],x[3],x[4],x[5],x[4]+x[5],'2026-09-20T11:42:00+05:30'])); const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});const link=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'apix-normalized-quotes.csv'});link.click();URL.revokeObjectURL(link.href)});
makeChart();renderQuotes();
