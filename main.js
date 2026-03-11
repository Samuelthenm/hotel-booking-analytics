// ── STATE ─────────────────────────────────────────────────────
let currentFilter = 'all';

// ── DEMO DATA ─────────────────────────────────────────────────
// Based on actual patterns from the Kaggle hotel booking demand dataset
const DEMO = {
  months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

  // Monthly revenue by hotel (2016 full year — most complete in dataset)
  cityRevenue:   [180000,195000,310000,340000,380000,420000,390000,410000,450000,360000,280000,220000],
  resortRevenue: [95000, 110000,180000,210000,260000,380000,520000,490000,320000,195000,130000,105000],

  // Monthly ADR by hotel
  cityADR:   [95,98,108,115,118,122,118,120,128,112,100,96],
  resortADR: [82,85,95,105,112,135,158,152,118,95,85,80],

  // Segment data
  segments: [
    { name: 'Online TA',   city: 420500, resort: 285000, cityCancel: 38.2, resortCancel: 27.4 },
    { name: 'Offline TA',  city: 195000, resort: 142000, cityCancel: 18.5, resortCancel: 15.2 },
    { name: 'Direct',      city: 165000, resort: 118000, cityCancel: 14.8, resortCancel: 11.3 },
    { name: 'Corporate',   city: 142000, resort:  48000, cityCancel: 12.2, resortCancel:  8.4 },
    { name: 'Groups',      city:  58000, resort:  72000, cityCancel: 22.0, resortCancel: 19.8 },
    { name: 'Complementary',city:  8000, resort:   5000, cityCancel:  5.0, resortCancel:  3.2 },
  ],

  // Lead time cancellation buckets
  leadBuckets: [
    { label: '0–7 days',    cityCancel: 12.4, resortCancel: 8.2  },
    { label: '8–30 days',   cityCancel: 22.8, resortCancel: 16.5 },
    { label: '31–90 days',  cityCancel: 34.2, resortCancel: 26.8 },
    { label: '91–180 days', cityCancel: 48.6, resortCancel: 38.4 },
    { label: '180+ days',   cityCancel: 62.3, resortCancel: 52.1 },
  ],

  // Top countries
  countries: [
    { code:'PRT', name:'Portugal',        city:21071, resort:27758 },
    { code:'GBR', name:'United Kingdom',  city:9673,  resort:2148  },
    { code:'FRA', name:'France',          city:8481,  resort:1777  },
    { code:'ESP', name:'Spain',           city:6391,  resort:1591  },
    { code:'DEU', name:'Germany',         city:6069,  resort:1545  },
    { code:'ITA', name:'Italy',           city:3766,  resort:897   },
    { code:'IRL', name:'Ireland',         city:3375,  resort:422   },
    { code:'BEL', name:'Belgium',         city:2342,  resort:528   },
  ],

  // Customer types
  customerTypes: [
    { type: 'Transient',        city: 46456, resort: 21672, cityCancel: 42.8, resortCancel: 27.6 },
    { type: 'Transient-Party',  city: 12820, resort:  5840, cityCancel: 25.4, resortCancel: 18.2 },
    { type: 'Contract',         city:  3828, resort:   886, cityCancel:  3.9, resortCancel:  2.8 },
    { type: 'Group',            city:   322, resort:   577, cityCancel: 17.2, resortCancel: 14.8 },
  ],

  // Overall totals
  totals: {
    all:    { bookings: 119390, revenue: 9847200, cancelRate: 37.0, adr: 101.8, avgNights: 3.4, confirmed: 75166, canceled: 44224 },
    city:   { bookings: 79330,  revenue: 6820400, cancelRate: 41.7, adr: 105.3, avgNights: 2.9, confirmed: 46228, canceled: 33102 },
    resort: { bookings: 40060,  revenue: 3026800, cancelRate: 27.8, adr:  94.9, avgNights: 4.3, confirmed: 28938, canceled: 11122 },
  }
};

// ── INIT ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => applyFilter('all'));

// ── FILTER ────────────────────────────────────────────────────
function applyFilter(hotel) {
  currentFilter = hotel;
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.remove('active');
    if (p.dataset.filter === hotel) p.classList.add('active');
  });
  renderKPIs(hotel);
  renderRevenueTrend(hotel);
  renderSegmentBars(hotel);
  renderLeadBars(hotel);
  renderCountryBars(hotel);
  renderDonut(hotel);
  renderADRChart(hotel);
  renderCustomerBars(hotel);
}

// ── HELPERS ───────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '$' + (n/1000).toFixed(0) + 'K';
  return '$' + n;
}
function fmtNum(n) {
  return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n);
}
function animateBars(container) {
  setTimeout(() => container.querySelectorAll('[data-w]').forEach(el => el.style.width = el.dataset.w + '%'), 60);
}

// ── KPIs ──────────────────────────────────────────────────────
function renderKPIs(hotel) {
  const d = hotel === 'all' ? DEMO.totals.all : hotel === 'City Hotel' ? DEMO.totals.city : DEMO.totals.resort;
  document.getElementById('kpi-bookings').textContent = fmtNum(d.bookings);
  document.getElementById('kpi-revenue').textContent  = fmt(d.revenue);
  document.getElementById('kpi-cancel').textContent   = d.cancelRate + '%';
  document.getElementById('kpi-adr').textContent      = '$' + d.adr;
  document.getElementById('kpi-nights').textContent   = d.avgNights + ' nights';
}

// ── REVENUE TREND ─────────────────────────────────────────────
function renderRevenueTrend(hotel) {
  const svg = document.getElementById('revenueSvg');
  svg.innerHTML = '';
  const W = 400, H = 125, padT = 10, padB = 20, padL = 10, padR = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const cityRev   = DEMO.cityRevenue;
  const resortRev = DEMO.resortRevenue;
  const combined  = cityRev.map((v,i) => v + resortRev[i]);

  const series = hotel === 'all' ? [
    { data: cityRev,   color: '#3b82f6', width: 2 },
    { data: resortRev, color: '#06b6d4', width: 2 },
  ] : hotel === 'City Hotel' ? [
    { data: cityRev,   color: '#3b82f6', width: 2.5 },
  ] : [
    { data: resortRev, color: '#06b6d4', width: 2.5 },
  ];

  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals);
  const step = plotW / (DEMO.months.length - 1);

  // Grid lines
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const y = padT + (1-f) * plotH;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', String(padL)); line.setAttribute('x2', String(W-padR));
    line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
    line.setAttribute('stroke','rgba(255,255,255,0.04)'); line.setAttribute('stroke-width','1');
    svg.appendChild(line);
  });

  // Area fills
  series.forEach(s => {
    const pts = s.data.map((v,i) => `${padL + i*step},${padT + (1-v/maxVal)*plotH}`);
    const areaD = `M${pts[0]} ${pts.slice(1).map(p=>'L'+p).join(' ')} L${padL+(s.data.length-1)*step},${padT+plotH} L${padL},${padT+plotH} Z`;
    const area = document.createElementNS('http://www.w3.org/2000/svg','path');
    area.setAttribute('d', areaD);
    area.setAttribute('fill', s.color);
    area.setAttribute('opacity', '0.06');
    svg.appendChild(area);

    const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill','none'); poly.setAttribute('stroke', s.color);
    poly.setAttribute('stroke-width', String(s.width));
    poly.setAttribute('stroke-linecap','round'); poly.setAttribute('stroke-linejoin','round');
    svg.appendChild(poly);
  });

  // X labels
  DEMO.months.forEach((m,i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', String(padL + i * step));
    t.setAttribute('y', String(H-3));
    t.setAttribute('fill','rgba(226,232,240,0.3)'); t.setAttribute('font-size','7.5');
    t.setAttribute('font-family','DM Sans'); t.setAttribute('text-anchor','middle');
    t.textContent = m;
    svg.appendChild(t);
  });

  // Insight
  const peakIdx = (hotel === 'Resort Hotel' ? resortRev : cityRev).indexOf(Math.max(...(hotel === 'Resort Hotel' ? resortRev : cityRev)));
  document.getElementById('trendInsight').textContent =
    `Peak revenue occurs in ${DEMO.months[peakIdx]}. ${hotel === 'Resort Hotel' ? 'Resort revenue spikes sharply in summer — highly seasonal.' : hotel === 'City Hotel' ? 'City Hotel shows steadier demand with a fall peak.' : 'Resort Hotel is highly seasonal; City Hotel shows steadier year-round demand.'}`;
  document.getElementById('trendTag').textContent = hotel === 'all' ? 'All Hotels' : hotel;
}

// ── SEGMENT BARS ──────────────────────────────────────────────
function renderSegmentBars(hotel) {
  const container = document.getElementById('segmentBars');
  container.innerHTML = '';

  const data = DEMO.segments.map(s => ({
    name: s.name,
    revenue: hotel === 'all' ? s.city + s.resort : hotel === 'City Hotel' ? s.city : s.resort,
    cancelRate: hotel === 'all' ? ((s.cityCancel + s.resortCancel)/2).toFixed(1) : hotel === 'City Hotel' ? s.cityCancel : s.resortCancel,
  })).sort((a,b) => b.revenue - a.revenue);

  const max = data[0].revenue;
  data.forEach(d => {
    const pct = Math.round((d.revenue/max)*100);
    const div = document.createElement('div');
    div.className = 'hbar-item';
    div.innerHTML = `
      <div class="hbar-name" title="${d.name}">${d.name}</div>
      <div class="hbar-track"><div class="hbar-fill" data-w="${pct}" style="width:0%;background:linear-gradient(90deg,rgba(59,130,246,0.7),rgba(59,130,246,0.3))">${fmt(d.revenue)}</div></div>
      <div class="hbar-num">${fmt(d.revenue)}</div>`;
    container.appendChild(div);
  });
  animateBars(container);

  document.getElementById('segmentInsight').textContent =
    `Online Travel Agents drive the most revenue but also carry the highest cancellation rate (${data.find(d=>d.name==='Online TA')?.cancelRate}%). Direct bookings cancel ${data.find(d=>d.name==='Direct')?.cancelRate}% of the time — a much safer revenue source.`;
}

// ── LEAD TIME BARS ────────────────────────────────────────────
function renderLeadBars(hotel) {
  const container = document.getElementById('leadBars');
  container.innerHTML = '';

  const data = DEMO.leadBuckets.map(b => ({
    label: b.label,
    rate: hotel === 'Resort Hotel' ? b.resortCancel : hotel === 'City Hotel' ? b.cityCancel : ((b.cityCancel + b.resortCancel)/2).toFixed(1),
  }));

  const max = Math.max(...data.map(d => parseFloat(d.rate)));
  data.forEach(d => {
    const pct = Math.round((parseFloat(d.rate)/max)*100);
    const color = parseFloat(d.rate) > 40
      ? 'linear-gradient(90deg,rgba(239,68,68,0.7),rgba(239,68,68,0.3))'
      : parseFloat(d.rate) > 25
      ? 'linear-gradient(90deg,rgba(245,158,11,0.7),rgba(245,158,11,0.3))'
      : 'linear-gradient(90deg,rgba(16,185,129,0.7),rgba(16,185,129,0.3))';
    const div = document.createElement('div');
    div.className = 'hbar-item';
    div.innerHTML = `
      <div class="hbar-name">${d.label}</div>
      <div class="hbar-track"><div class="hbar-fill" data-w="${pct}" style="width:0%;background:${color}">${d.rate}%</div></div>
      <div class="hbar-num" style="color:${parseFloat(d.rate)>40?'var(--red)':parseFloat(d.rate)>25?'var(--gold)':'var(--green)'}">${d.rate}%</div>`;
    container.appendChild(div);
  });
  animateBars(container);

  document.getElementById('leadInsight').textContent =
    `Bookings made 180+ days in advance cancel at ${data[4].rate}% — over 5× the rate of last-minute bookings. Shorter booking windows strongly predict confirmed stays.`;
}

// ── COUNTRY BARS ──────────────────────────────────────────────
function renderCountryBars(hotel) {
  const container = document.getElementById('countryBars');
  container.innerHTML = '';

  const data = DEMO.countries.map(c => ({
    name: c.name,
    bookings: hotel === 'all' ? c.city + c.resort : hotel === 'City Hotel' ? c.city : c.resort,
  })).sort((a,b) => b.bookings - a.bookings).slice(0,8);

  const max = data[0].bookings;
  data.forEach((d,i) => {
    const pct = Math.round((d.bookings/max)*100);
    const colors = [
      'rgba(59,130,246,0.7)','rgba(59,130,246,0.6)','rgba(59,130,246,0.5)',
      'rgba(6,182,212,0.6)','rgba(6,182,212,0.5)','rgba(6,182,212,0.4)',
      'rgba(99,102,241,0.5)','rgba(99,102,241,0.4)',
    ];
    const div = document.createElement('div');
    div.className = 'hbar-item';
    div.innerHTML = `
      <div class="hbar-name">${d.name}</div>
      <div class="hbar-track"><div class="hbar-fill" data-w="${pct}" style="width:0%;background:linear-gradient(90deg,${colors[i]},${colors[i].replace('0.','0.2')})">${fmtNum(d.bookings)}</div></div>
      <div class="hbar-num">${fmtNum(d.bookings)}</div>`;
    container.appendChild(div);
  });
  animateBars(container);
  document.getElementById('countryTag').textContent = hotel === 'all' ? 'All Hotels' : hotel;
}

// ── DONUT ─────────────────────────────────────────────────────
function renderDonut(hotel) {
  const d = hotel === 'all' ? DEMO.totals.all : hotel === 'City Hotel' ? DEMO.totals.city : DEMO.totals.resort;
  const total = d.bookings;
  const confirmed = d.confirmed;
  const canceled = d.canceled;

  document.getElementById('donutTotal').textContent = fmtNum(total);

  const data = [
    { label:'Confirmed', value: confirmed, color:'#10b981' },
    { label:'Canceled',  value: canceled,  color:'#ef4444' },
  ];

  const C = 2 * Math.PI * 55;
  let offset = 0;
  const svg = document.getElementById('donutSvg');
  svg.innerHTML = '';

  data.forEach(d => {
    const arc = (d.value/total)*C;
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx','75'); circle.setAttribute('cy','75'); circle.setAttribute('r','55');
    circle.setAttribute('fill','none'); circle.setAttribute('stroke',d.color);
    circle.setAttribute('stroke-width','22');
    circle.setAttribute('stroke-dasharray',`${arc} ${C-arc}`);
    circle.setAttribute('stroke-dashoffset',String(-offset));
    circle.setAttribute('opacity','0.85');
    svg.appendChild(circle);
    offset += arc;
  });

  const legend = document.getElementById('donutLegend');
  legend.innerHTML = '';
  data.forEach(d => {
    const pct = Math.round((d.value/total)*100);
    legend.innerHTML += `<div class="dl-item">
      <div class="dl-dot" style="background:${d.color}"></div>
      <span class="dl-name">${d.label}</span>
      <span class="dl-val">${pct}% · ${fmtNum(d.value)}</span></div>`;
  });
}

// ── ADR CHART ─────────────────────────────────────────────────
function renderADRChart(hotel) {
  const svg = document.getElementById('adrSvg');
  svg.innerHTML = '';
  const W=340, H=110, padT=8, padB=18, padL=8, padR=8;
  const plotW = W-padL-padR, plotH = H-padT-padB;

  const series = hotel === 'all' ? [
    { data: DEMO.cityADR,   color:'#3b82f6', width:2 },
    { data: DEMO.resortADR, color:'#06b6d4', width:2 },
  ] : hotel === 'City Hotel' ? [
    { data: DEMO.cityADR,   color:'#3b82f6', width:2.5 },
  ] : [
    { data: DEMO.resortADR, color:'#06b6d4', width:2.5 },
  ];

  const allVals = series.flatMap(s=>s.data);
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal || 1;
  const step = plotW / (DEMO.months.length-1);

  [0.33,0.66,1].forEach(f => {
    const y = padT+(1-f)*plotH;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',String(padL)); line.setAttribute('x2',String(W-padR));
    line.setAttribute('y1',String(y)); line.setAttribute('y2',String(y));
    line.setAttribute('stroke','rgba(255,255,255,0.04)'); line.setAttribute('stroke-width','1');
    svg.appendChild(line);
  });

  series.forEach(s => {
    const pts = s.data.map((v,i) => `${padL+i*step},${padT+(1-(v-minVal)/range)*plotH}`);
    const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    poly.setAttribute('points',pts.join(' '));
    poly.setAttribute('fill','none'); poly.setAttribute('stroke',s.color);
    poly.setAttribute('stroke-width',String(s.width));
    poly.setAttribute('stroke-linecap','round'); poly.setAttribute('stroke-linejoin','round');
    svg.appendChild(poly);
  });

  DEMO.months.forEach((m,i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',String(padL+i*step)); t.setAttribute('y',String(H-3));
    t.setAttribute('fill','rgba(226,232,240,0.3)'); t.setAttribute('font-size','7');
    t.setAttribute('font-family','DM Sans'); t.setAttribute('text-anchor','middle');
    t.textContent = m;
    svg.appendChild(t);
  });
}

// ── CUSTOMER TYPE BARS ────────────────────────────────────────
function renderCustomerBars(hotel) {
  const container = document.getElementById('custBars');
  container.innerHTML = '';

  const data = DEMO.customerTypes.map(c => ({
    type: c.type,
    bookings: hotel === 'all' ? c.city + c.resort : hotel === 'City Hotel' ? c.city : c.resort,
    cancelRate: hotel === 'Resort Hotel' ? c.resortCancel : hotel === 'City Hotel' ? c.cityCancel : ((c.cityCancel+c.resortCancel)/2).toFixed(1),
  })).sort((a,b) => b.bookings - a.bookings);

  const max = data[0].bookings;
  data.forEach(d => {
    const pct = Math.round((d.bookings/max)*100);
    const div = document.createElement('div');
    div.className = 'prog-item';
    div.innerHTML = `
      <div class="prog-header">
        <span class="prog-label">${d.type}</span>
        <span class="prog-val">${fmtNum(d.bookings)} · ${d.cancelRate}% cancel</span>
      </div>
      <div class="prog-track"><div class="prog-fill" data-w="${pct}" style="width:0%;background:linear-gradient(90deg,#3b82f6,#06b6d4)"></div></div>`;
    container.appendChild(div);
  });
  animateBars(container);

  document.getElementById('custTag').textContent = hotel === 'all' ? 'All Hotels' : hotel;
  document.getElementById('custInsight').textContent =
    `Transient guests make up the majority of bookings but cancel at the highest rate. Contract customers cancel at under 4% — the most reliable booking type.`;
}
