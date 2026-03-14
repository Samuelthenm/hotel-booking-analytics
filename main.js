let currentFilter = 'all';

// all numbers pulled from hotel_bookings_cleaned.csv
const DATA = {
  months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

  // confirmed revenue per month (sum across all years, grouped by arrival month)
  cityRevenue:   [527933, 768887, 1096602, 1369898, 1569624, 1467869, 1686278, 1978102, 1359321, 1241013, 687443, 641441],
  resortRevenue: [248744, 378655,  555560,  729960,  825590, 1115422, 2414119, 2939057,  984942,  615804, 348110, 445952],

  // avg daily rate per month, confirmed stays only
  cityADR:   [84.37, 88.35,  92.05, 113.53, 123.16, 119.65, 117.93, 120.91, 115.51, 104.62,  89.25, 92.25],
  resortADR: [50.24, 55.40,  58.33,  77.60,  78.55, 109.92, 152.80, 183.69,  97.58,  63.58,  50.15, 71.48],

  // revenue by market segment — split by hotel, with cancel rates
  segments: [
    { name: 'Online TA',     city: 8762544, resort: 4951858, cityCancel: 37.5, resortCancel: 35.6 },
    { name: 'Offline TA/TO', city: 2554041, resort: 3105513, cityCancel: 43.3, resortCancel: 15.3 },
    { name: 'Direct',        city: 1657750, resort: 2441868, cityCancel: 17.5, resortCancel: 13.4 },
    { name: 'Groups',        city:  980788, resort:  888368, cityCancel: 69.5, resortCancel: 43.0 },
    { name: 'Corporate',     city:  365675, resort:  212237, cityCancel: 21.6, resortCancel: 15.5 },
    { name: 'Aviation',      city:   70868, resort:       0, cityCancel: 22.1, resortCancel:  0.0 },
    { name: 'Complementary', city:    2743, resort:    2070, cityCancel:  8.8, resortCancel:  6.9 },
  ],

  // how cancellation rate climbs the further out someone books
  leadBuckets: [
    { label: '0–7 days',    cityCancel: 13.7, resortCancel:  7.5 },
    { label: '8–30 days',   cityCancel: 31.2, resortCancel: 22.1 },
    { label: '31–90 days',  cityCancel: 40.1, resortCancel: 32.7 },
    { label: '91–180 days', cityCancel: 48.1, resortCancel: 37.6 },
    { label: '180+ days',   cityCancel: 64.2, resortCancel: 41.7 },
  ],

  // top 8 source countries by total booking volume
  countries: [
    { code: 'PRT', name: 'Portugal',       city: 29964, resort: 17075 },
    { code: 'GBR', name: 'United Kingdom', city:  5297, resort:  6758 },
    { code: 'FRA', name: 'France',         city:  8763, resort:  1597 },
    { code: 'ESP', name: 'Spain',          city:  4581, resort:  3908 },
    { code: 'DEU', name: 'Germany',        city:  6054, resort:  1192 },
    { code: 'ITA', name: 'Italy',          city:  3293, resort:   456 },
    { code: 'IRL', name: 'Ireland',        city:     0, resort:  2161 },
    { code: 'NLD', name: 'Netherlands',    city:  1588, resort:   512 },
  ],

  // booking volume and cancel rate per customer type
  customerTypes: [
    { type: 'Transient',       city: 58503, resort: 29659, cityCancel: 46.1, resortCancel: 31.6 },
    { type: 'Transient-Party', city: 17045, resort:  7626, cityCancel: 28.4, resortCancel: 19.8 },
    { type: 'Contract',        city:  2288, resort:  1764, cityCancel: 48.3, resortCancel:  8.9 },
    { type: 'Group',           city:   285, resort:   259, cityCancel: 10.2, resortCancel:  5.0 },
  ],

  // top-line KPIs per hotel filter
  totals: {
    all:    { bookings: 117429, revenue: 25996324, cancelRate: 37.5, adr: 102.37, avgNights: 3.5, confirmed: 73419, canceled: 44010 },
    city:   { bookings:  78121, revenue: 14394410, cancelRate: 42.2, adr: 108.27, avgNights: 3.0, confirmed: 45149, canceled: 32972 },
    resort: { bookings:  39308, revenue: 11601914, cancelRate: 28.1, adr:  92.93, avgNights: 4.4, confirmed: 28270, canceled: 11038 },
  }
};

window.addEventListener('DOMContentLoaded', () => applyFilter('all'));

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

// format as $1.2M / $120K / $99
function fmt(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n;
}

// format as 12.3k or just the number
function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

// slight delay so the bar width transition actually fires
function animateBars(container) {
  setTimeout(() => {
    container.querySelectorAll('[data-w]').forEach(el => el.style.width = el.dataset.w + '%');
  }, 60);
}

function renderKPIs(hotel) {
  const d = hotel === 'all' ? DATA.totals.all : hotel === 'City Hotel' ? DATA.totals.city : DATA.totals.resort;
  document.getElementById('kpi-bookings').textContent = fmtNum(d.bookings);
  document.getElementById('kpi-revenue').textContent  = fmt(d.revenue);
  document.getElementById('kpi-cancel').textContent   = d.cancelRate + '%';
  document.getElementById('kpi-adr').textContent      = '$' + d.adr;
  document.getElementById('kpi-nights').textContent   = d.avgNights + ' nights';
}

function renderRevenueTrend(hotel) {
  const svg = document.getElementById('revenueSvg');
  svg.innerHTML = '';

  const W = 400, H = 125, padT = 10, padB = 20, padL = 10, padR = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const cityRev   = DATA.cityRevenue;
  const resortRev = DATA.resortRevenue;

  const series = hotel === 'all' ? [
    { data: cityRev,   color: '#3b82f6', width: 2   },
    { data: resortRev, color: '#06b6d4', width: 2   },
  ] : hotel === 'City Hotel' ? [
    { data: cityRev,   color: '#3b82f6', width: 2.5 },
  ] : [
    { data: resortRev, color: '#06b6d4', width: 2.5 },
  ];

  const maxVal = Math.max(...series.flatMap(s => s.data));
  const step   = plotW / (DATA.months.length - 1);

  // subtle horizontal grid lines
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const y    = padT + (1 - f) * plotH;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(padL));   line.setAttribute('x2', String(W - padR));
    line.setAttribute('y1', String(y));      line.setAttribute('y2', String(y));
    line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  });

  series.forEach(s => {
    const pts   = s.data.map((v, i) => `${padL + i * step},${padT + (1 - v / maxVal) * plotH}`);
    const areaD = `M${pts[0]} ${pts.slice(1).map(p => 'L' + p).join(' ')} L${padL + (s.data.length - 1) * step},${padT + plotH} L${padL},${padT + plotH} Z`;

    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaD);
    area.setAttribute('fill', s.color);
    area.setAttribute('opacity', '0.06');
    svg.appendChild(area);

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', s.color);
    poly.setAttribute('stroke-width', String(s.width));
    poly.setAttribute('stroke-linecap', 'round');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(poly);
  });

  // month labels along the bottom
  DATA.months.forEach((m, i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(padL + i * step));
    t.setAttribute('y', String(H - 3));
    t.setAttribute('fill', 'rgba(226,232,240,0.3)');
    t.setAttribute('font-size', '7.5');
    t.setAttribute('font-family', 'DM Sans');
    t.setAttribute('text-anchor', 'middle');
    t.textContent = m;
    svg.appendChild(t);
  });

  const activeSeries = hotel === 'Resort Hotel' ? resortRev : cityRev;
  const peakIdx      = activeSeries.indexOf(Math.max(...activeSeries));

  document.getElementById('trendInsight').textContent =
    hotel === 'Resort Hotel'
      ? `Resort revenue peaks sharply in ${DATA.months[peakIdx]} ($${(DATA.resortRevenue[peakIdx] / 1000000).toFixed(1)}M) — highly seasonal, dropping over 85% in winter.`
      : hotel === 'City Hotel'
      ? `City Hotel peaks in ${DATA.months[peakIdx]} but shows much steadier year-round demand than the resort.`
      : `Resort Hotel is highly seasonal, peaking in Aug at $2.9M. City Hotel holds steadier demand throughout the year.`;

  document.getElementById('trendTag').textContent = hotel === 'all' ? 'All Hotels' : hotel;
}

function renderSegmentBars(hotel) {
  const container = document.getElementById('segmentBars');
  container.innerHTML = '';

  const data = DATA.segments.map(s => ({
    name: s.name,
    revenue: hotel === 'all' ? s.city + s.resort : hotel === 'City Hotel' ? s.city : s.resort,
    cancelRate: hotel === 'all'
      ? ((s.cityCancel + s.resortCancel) / 2).toFixed(1)
      : hotel === 'City Hotel' ? s.cityCancel : s.resortCancel,
  })).filter(d => d.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  const max = data[0].revenue;

  data.forEach(d => {
    const pct = Math.round((d.revenue / max) * 100);
    const div = document.createElement('div');
    div.className = 'hbar-item';
    div.innerHTML = `
      <div class="hbar-name" title="${d.name}">${d.name}</div>
      <div class="hbar-track">
        <div class="hbar-fill" data-w="${pct}" style="width:0%;background:linear-gradient(90deg,rgba(59,130,246,0.7),rgba(59,130,246,0.3))">${fmt(d.revenue)}</div>
      </div>
      <div class="hbar-num">${fmt(d.revenue)}</div>`;
    container.appendChild(div);
  });

  animateBars(container);

  const onlineTA = data.find(d => d.name === 'Online TA');
  const direct   = data.find(d => d.name === 'Direct');
  document.getElementById('segmentInsight').textContent =
    `Online TA drives the most revenue but cancels at ${onlineTA?.cancelRate}%. Direct bookings cancel at only ${direct?.cancelRate}% — far more reliable as a revenue source.`;
}

function renderLeadBars(hotel) {
  const container = document.getElementById('leadBars');
  container.innerHTML = '';

  const data = DATA.leadBuckets.map(b => ({
    label: b.label,
    rate: hotel === 'Resort Hotel'
      ? b.resortCancel
      : hotel === 'City Hotel'
      ? b.cityCancel
      : +((b.cityCancel + b.resortCancel) / 2).toFixed(1),
  }));

  const max = Math.max(...data.map(d => parseFloat(d.rate)));

  data.forEach(d => {
    const pct       = Math.round((parseFloat(d.rate) / max) * 100);
    const rate      = parseFloat(d.rate);
    const color     = rate > 40
      ? 'linear-gradient(90deg,rgba(239,68,68,0.7),rgba(239,68,68,0.3))'
      : rate > 25
      ? 'linear-gradient(90deg,rgba(245,158,11,0.7),rgba(245,158,11,0.3))'
      : 'linear-gradient(90deg,rgba(16,185,129,0.7),rgba(16,185,129,0.3))';
    const textColor = rate > 40 ? 'var(--red)' : rate > 25 ? 'var(--gold)' : 'var(--green)';

    const div = document.createElement('div');
    div.className = 'hbar-item';
    div.innerHTML = `
      <div class="hbar-name">${d.label}</div>
      <div class="hbar-track">
        <div class="hbar-fill" data-w="${pct}" style="width:0%;background:${color}">${d.rate}%</div>
      </div>
      <div class="hbar-num" style="color:${textColor}">${d.rate}%</div>`;
    container.appendChild(div);
  });

  animateBars(container);

  const multiplier = Math.round(data[4].rate / data[0].rate);
  document.getElementById('leadInsight').textContent =
    `Bookings made 180+ days ahead cancel at ${data[4].rate}% — over ${multiplier}× the rate of last-minute bookings. Shorter booking windows strongly predict confirmed stays.`;
}

function renderCountryBars(hotel) {
  const container = document.getElementById('countryBars');
  container.innerHTML = '';

  const data = DATA.countries.map(c => ({
    name: c.name,
    bookings: hotel === 'all' ? c.city + c.resort : hotel === 'City Hotel' ? c.city : c.resort,
  })).sort((a, b) => b.bookings - a.bookings).slice(0, 8);

  const max    = data[0].bookings;
  const colors = [
    'rgba(59,130,246,0.7)',  'rgba(59,130,246,0.6)',  'rgba(59,130,246,0.5)',
    'rgba(6,182,212,0.6)',   'rgba(6,182,212,0.5)',   'rgba(6,182,212,0.4)',
    'rgba(99,102,241,0.5)',  'rgba(99,102,241,0.4)',
  ];

  data.forEach((d, i) => {
    const pct = Math.round((d.bookings / max) * 100);
    const div = document.createElement('div');
    div.className = 'hbar-item';
    div.innerHTML = `
      <div class="hbar-name">${d.name}</div>
      <div class="hbar-track">
        <div class="hbar-fill" data-w="${pct}" style="width:0%;background:linear-gradient(90deg,${colors[i]},${colors[i].replace('0.', '0.2')})">${fmtNum(d.bookings)}</div>
      </div>
      <div class="hbar-num">${fmtNum(d.bookings)}</div>`;
    container.appendChild(div);
  });

  animateBars(container);
  document.getElementById('countryTag').textContent = hotel === 'all' ? 'All Hotels' : hotel;
}

function renderDonut(hotel) {
  const d         = hotel === 'all' ? DATA.totals.all : hotel === 'City Hotel' ? DATA.totals.city : DATA.totals.resort;
  const total     = d.bookings;
  const confirmed = d.confirmed;
  const canceled  = d.canceled;

  document.getElementById('donutTotal').textContent = fmtNum(total);

  const slices = [
    { label: 'Confirmed', value: confirmed, color: '#10b981' },
    { label: 'Canceled',  value: canceled,  color: '#ef4444' },
  ];

  const circumference = 2 * Math.PI * 55;
  let offset = 0;

  const svg = document.getElementById('donutSvg');
  svg.innerHTML = '';

  slices.forEach(s => {
    const arc    = (s.value / total) * circumference;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '75');
    circle.setAttribute('cy', '75');
    circle.setAttribute('r', '55');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', s.color);
    circle.setAttribute('stroke-width', '22');
    circle.setAttribute('stroke-dasharray', `${arc} ${circumference - arc}`);
    circle.setAttribute('stroke-dashoffset', String(-offset));
    circle.setAttribute('opacity', '0.85');
    svg.appendChild(circle);
    offset += arc;
  });

  const legend = document.getElementById('donutLegend');
  legend.innerHTML = '';
  slices.forEach(s => {
    const pct = Math.round((s.value / total) * 100);
    legend.innerHTML += `
      <div class="dl-item">
        <div class="dl-dot" style="background:${s.color}"></div>
        <span class="dl-name">${s.label}</span>
        <span class="dl-val">${pct}% · ${fmtNum(s.value)}</span>
      </div>`;
  });
}

function renderADRChart(hotel) {
  const svg = document.getElementById('adrSvg');
  svg.innerHTML = '';

  const W = 340, H = 110, padT = 8, padB = 18, padL = 8, padR = 8;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const series = hotel === 'all' ? [
    { data: DATA.cityADR,   color: '#3b82f6', width: 2   },
    { data: DATA.resortADR, color: '#06b6d4', width: 2   },
  ] : hotel === 'City Hotel' ? [
    { data: DATA.cityADR,   color: '#3b82f6', width: 2.5 },
  ] : [
    { data: DATA.resortADR, color: '#06b6d4', width: 2.5 },
  ];

  const allVals = series.flatMap(s => s.data);
  const maxVal  = Math.max(...allVals);
  const minVal  = Math.min(...allVals);
  const range   = maxVal - minVal || 1;
  const step    = plotW / (DATA.months.length - 1);

  [0.33, 0.66, 1].forEach(f => {
    const y    = padT + (1 - f) * plotH;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(padL));   line.setAttribute('x2', String(W - padR));
    line.setAttribute('y1', String(y));      line.setAttribute('y2', String(y));
    line.setAttribute('stroke', 'rgba(255,255,255,0.04)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  });

  series.forEach(s => {
    const pts  = s.data.map((v, i) => `${padL + i * step},${padT + (1 - (v - minVal) / range) * plotH}`);
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', s.color);
    poly.setAttribute('stroke-width', String(s.width));
    poly.setAttribute('stroke-linecap', 'round');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(poly);
  });

  DATA.months.forEach((m, i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(padL + i * step));
    t.setAttribute('y', String(H - 3));
    t.setAttribute('fill', 'rgba(226,232,240,0.3)');
    t.setAttribute('font-size', '7');
    t.setAttribute('font-family', 'DM Sans');
    t.setAttribute('text-anchor', 'middle');
    t.textContent = m;
    svg.appendChild(t);
  });
}

function renderCustomerBars(hotel) {
  const container = document.getElementById('custBars');
  container.innerHTML = '';

  const data = DATA.customerTypes.map(c => ({
    type: c.type,
    bookings: hotel === 'all' ? c.city + c.resort : hotel === 'City Hotel' ? c.city : c.resort,
    cancelRate: hotel === 'Resort Hotel'
      ? c.resortCancel
      : hotel === 'City Hotel'
      ? c.cityCancel
      : +((c.cityCancel + c.resortCancel) / 2).toFixed(1),
  })).sort((a, b) => b.bookings - a.bookings);

  const max = data[0].bookings;

  data.forEach(d => {
    const pct = Math.round((d.bookings / max) * 100);
    const div = document.createElement('div');
    div.className = 'prog-item';
    div.innerHTML = `
      <div class="prog-header">
        <span class="prog-label">${d.type}</span>
        <span class="prog-val">${fmtNum(d.bookings)} · ${d.cancelRate}% cancel</span>
      </div>
      <div class="prog-track">
        <div class="prog-fill" data-w="${pct}" style="width:0%;background:linear-gradient(90deg,#3b82f6,#06b6d4)"></div>
      </div>`;
    container.appendChild(div);
  });

  animateBars(container);

  document.getElementById('custTag').textContent = hotel === 'all' ? 'All Hotels' : hotel;

  const transient          = DATA.customerTypes.find(c => c.type === 'Transient');
  const contract           = DATA.customerTypes.find(c => c.type === 'Contract');
  const avgTransientCancel = +((transient.cityCancel + transient.resortCancel) / 2).toFixed(1);

  document.getElementById('custInsight').textContent =
    `Transient guests dominate at ${fmtNum(transient.city + transient.resort)} bookings but cancel at ${avgTransientCancel}%. Contract customers are the most reliable — resort contracts cancel at only ${contract.resortCancel}%.`;
}
