{
const {$, tr, sci, eUnit, col, reduce, fig, L, T, seg, dl, canvasSize, visibleLoop, minkowski, NF} = window.H;
const sup = (v) => `10<tspan dy="-6" font-size="11">${v}</tspan>`;
const poly = (pts, st, w, extra = '') => `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${st}" stroke-width="${w}" ${extra}/>`;
const dot = (x, y, r, f, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`;

/* ===== CH1 timeline ===== */
{
  const svg = $('tl'), info = $('tl-info');
  const EV = [[1687, 'Newton', 'Evrensel kütleçekim: gök ile yer aynı yasaya uyuyor.'], [1785, 'Coulomb', 'Yükler arası kuvvet uzaklığın karesiyle azalıyor.'], [1831, 'Faraday', 'Değişen manyetik alan akım üretiyor.'], [1865, 'Maxwell', 'Elektrik, manyetizma ve ışık tek denklem takımında.'], [1905, 'Özel görelilik', 'Uzay ve zaman tek bir uzayzaman.'], [1915, 'Genel görelilik', 'Kütleçekim uzayzamanın eğriliği.'], [1926, 'Kaluza–Klein', 'Beşinci bir boyut ve neden görünmediği.'], [1967, 'Elektrozayıf', 'Elektromanyetik ve zayıf etkileşim tek gauge yapısında.'], [1968, 'Veneziano', 'Hadron saçılma formülü; string fikrinin başlangıcı.'], [1974, 'Graviton', 'Scherk, Schwarz ve Yoneya: kütlesiz spin-2 durum graviton olabilir.'], [1983, 'W ve Z', 'Elektrozayıf teorinin öngördüğü bozonlar bulundu.'], [1984, 'Anomali iptali', 'Green ve Schwarz: birinci superstring devrimi.'], [1995, 'Duality', 'Beş teori birbirine bağlı; M-theory ve D-brane\'ler.'], [1996, 'Kara delik', 'Strominger ve Vafa: mikrodurum sayımı.'], [1997, 'AdS/CFT', 'Maldacena: holografik duality.'], [2012, 'Higgs', 'Higgs bozonu bulundu; Standart Model tamamlandı.'], [2015, 'Kütleçekim dalgaları', 'LIGO iki kara deliğin birleşmesini ölçtü.']];
  let sel = 3;
  const show = i => { info.innerHTML = `<h3>${EV[i][0]} · ${EV[i][1]}</h3><p>${EV[i][2]}</p>`; };
  const f = fig(svg, (W, H) => {
    const gaps = EV.map((e, i) => i ? 1 + 0.7 * Math.log10(e[0] - EV[i - 1][0]) : 0), tot = gaps.reduce((p, q) => p + q, 0);
    const top = 14, step = (H - 28) / tot, ax = 70; let y = top, s = '';
    const ys = EV.map((e, i) => (y += gaps[i] * step));
    s += L(ax, top - 6, ax, H - 8, 'var(--line)', 3);
    EV.forEach((e, i) => { const on = i === sel, yy = ys[i];
      s += `<g class="ev" data-i="${i}" tabindex="0" role="button" aria-label="${e[0]} ${e[1]}" style="cursor:pointer"><rect x="0" y="${yy - 10}" width="${W}" height="20" fill="${on ? 'var(--ray)' : 'transparent'}" fill-opacity=".1" rx="6"/>` + T(ax - 14, yy + 4, e[0], `text-anchor="end" style="font-size:13px;font-weight:${on ? 700 : 600};fill:${on ? 'var(--ray)' : 'var(--mute)'}"`) + dot(ax, yy, on ? 7 : 5, on ? 'var(--ray)' : 'var(--field)', 'stroke="var(--panel)" stroke-width="2"') + T(ax + 16, yy + 4, e[1], `style="font-size:13px;font-weight:${on ? 700 : 400}"`) + '</g>'; });
    const i50 = EV.findIndex(e => e[0] > 1950); s += T(W - 6, ys[i50] - 14, 'son 70 yıl', 'text-anchor="end" style="font-size:11px;fill:var(--mute)"') + L(W - 4, ys[i50] - 8, W - 4, H - 8, 'var(--ray)', 2, 'stroke-opacity=".4"');
    svg.innerHTML = s;
  });
  const pick = e => { const g = e.target.closest('.ev'); if (!g) return; sel = +g.dataset.i; show(sel); f(); };
  svg.addEventListener('click', pick); svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
  show(sel);
}

/* ===== CH1 capacitor ===== */
{
  const svg = $('cap'); let surf = 1, maxw = false;
  $('cap-s').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; surf = +b.dataset.s; $('cap-s').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); upd(); });
  $('cap-m').addEventListener('click', () => { maxw = !maxw; $('cap-m').setAttribute('aria-pressed', maxw); $('cap-m').textContent = maxw ? 'Maxwell terimi eklendi' : 'Maxwell terimini ekle'; upd(); });
  const sl = $('cap-i');
  const f = fig(svg, (W, H) => {
    const I = +sl.value, cy = H * .5, px = W * .58, gap = 26, ph = Math.min(H * .32, 90), lx = W * .26;
    let s = L(14, cy, px - gap / 2, cy, 'var(--ink)', 3) + L(px + gap / 2, cy, W - 14, cy, 'var(--ink)', 3);
    s += `<rect x="${px - gap / 2 - 5}" y="${cy - ph}" width="6" height="${ph * 2}" fill="var(--ink)"/><rect x="${px + gap / 2 - 1}" y="${cy - ph}" width="6" height="${ph * 2}" fill="var(--ink)"/>`;
    s += T(px - gap / 2 - 10, cy - ph - 8, '+Q', 'text-anchor="end" style="font-size:13px"') + T(px + gap / 2 + 10, cy - ph - 8, '−Q', 'style="font-size:13px"');
    for (let k = -2; k <= 2; k++) { const y = cy + k * ph / 2.6; s += L(px - gap / 2 + 3, y, px + gap / 2 - 3, y, 'var(--field)', 1.5, `stroke-opacity="${.3 + .3 * I}"`); }
    s += T(px, cy + ph + 22, 'E(t) büyüyor', 'text-anchor="middle" style="font-size:13px;fill:var(--field)"');
    for (const x of [W * .12, W * .82]) s += `<path d="M${x - 14},${cy - 10} l14,0 l-5,-5 m5,5 l-5,5" fill="none" stroke="var(--ray)" stroke-width="${1 + I}"/>`;
    s += T(W * .12, cy - 18, 'I', 'text-anchor="middle" style="fill:var(--ray);font-weight:700"');
    // Amperian loop (ellipse around wire at lx)
    const rx = 12, ry = ph * .55;
    s += `<ellipse cx="${lx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="var(--ink)" stroke-width="2"/>` + T(lx, cy - ry - 8, 'halka', 'text-anchor="middle" style="font-size:12px"');
    if (surf === 1) s += `<ellipse cx="${lx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--ray)" fill-opacity=".25" stroke="none"/>` + T(lx - 20, cy + ry + 20, 'düz disk: tel deliyor', 'style="font-size:12px"');
    else s += `<path d="M${lx},${cy - ry} C${px + 40},${cy - ry * 1.6} ${px + 40},${cy + ry * 1.6} ${lx},${cy + ry}" fill="var(--field)" fill-opacity=".14" stroke="var(--field)" stroke-dasharray="5 4" stroke-width="1.6"/>` + T(lx - 20, cy + ry + 20, 'torba: levhaların arasından', 'style="font-size:12px"');
    // B arrows around loop
    const Bon = surf === 1 || maxw;
    s += T(lx + rx + 8, cy - 12, Bon ? 'B ≠ 0' : 'B = 0 ?', `style="font-size:13px;font-weight:700;fill:${Bon ? 'var(--good)' : 'var(--warn)'}"`);
    svg.innerHTML = s;
  });
  function upd() { const I = +sl.value; $('cap-io').textContent = tr(I) + ' A';
    const v = $('cap-v');
    if (surf === 1) { v.className = 'verdict good'; v.innerHTML = `Düz diski tel deliyor: yüzeyden geçen akım I. Ampère yasası ∮B·dl = μ₀I veriyor.`; }
    else if (!maxw) { v.className = 'verdict bad'; v.innerHTML = `Torbadan hiç akım geçmiyor: eski yasa ∮B·dl = 0 diyor. Aynı halka, iki farklı cevap. Bir terim eksik.`; }
    else { v.className = 'verdict good'; v.innerHTML = `Torbadan akım geçmiyor ama elektrik akısı değişiyor: ε₀ dΦ<sub>E</sub>/dt = I. İki yüzey aynı cevabı veriyor.`; }
    f(); }
  sl.addEventListener('input', upd); upd();
}

/* ===== CH1 Maxwell stepper ===== */
document.querySelectorAll('.stepper').forEach(st => {
  const steps = [...st.querySelectorAll('.stp')], dots = st.querySelector('.dots'); let i = 0;
  dots.innerHTML = steps.map(() => '<i></i>').join('');
  const show = () => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= i)); st.querySelector('[data-d="-1"]').disabled = i === 0; st.querySelector('[data-d="1"]').disabled = i === steps.length - 1; };
  st.querySelector('.nav').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; i = Math.max(0, Math.min(steps.length - 1, i + +b.dataset.d)); show(); });
  show();
});

/* ===== CH1 dimension game ===== */
{
  const a = $('da'), b = $('db'), d = $('dd');
  function upd() { const A = +a.value, B = +b.value, D = +d.value;
    $('dao').textContent = tr(A, 1); $('dbo').textContent = tr(B, 1); $('ddo').textContent = tr(D, 1);
    const dims = [['M', -A + D, 1], ['L', 3 * A + B + 2 * D, 2], ['T', -2 * A - B - D, -2]];
    const pos = v => (v + 6) / 12 * 100;
    $('dim-m').innerHTML = '<p class="note" style="margin:0">Turuncu: şu anki üs. Mavi çizgi: enerji için hedef.</p>' + dims.map(([n, v, t]) => `<div class="meter"><span>${n}</span><span class="trk"><s style="left:${pos(t)}%"></s><b style="left:calc(${Math.max(0, Math.min(100, pos(v)))}% - 2px)"></b></span><span class="num">${tr(v, 1)}</span></div>`).join('');
    const ok = dims.every(([, v, t]) => Math.abs(v - t) < 1e-9), vd = $('dim-v');
    if (ok) { vd.className = 'verdict good'; vd.innerHTML = 'Buldunuz: E<sub>P</sub> = √(ħc⁵/G<sub>N</sub>). Üç denklem, üç bilinmeyen, tek çözüm.'; }
    else { vd.className = 'verdict'; const e = v => '<sup>' + tr(v, Number.isInteger(v) ? 0 : 1) + '</sup>'; vd.innerHTML = 'Şu anki boyut: M' + e(dims[0][1]) + ' L' + e(dims[1][1]) + ' T' + e(dims[2][1]) + '. Hedef: M<sup>1</sup> L<sup>2</sup> T<sup>−2</sup>.'; } }
  [a, b, d].forEach(x => x.addEventListener('input', upd));
  $('dim-show').addEventListener('click', () => { a.value = -0.5; b.value = 2.5; d.value = 0.5; upd(); });
  upd();
}

/* ===== CH1 perturbation series ===== */
{
  const sl = $('e-planck');
  function upd() { const g = (10 ** +sl.value / 1.22e19) ** 2;
    const rows = [0, 1, 2, 3, 4, 5].map(n => { const t = g ** n, w = n === 0 ? 100 : Math.max(0.6, (Math.log10(Math.max(t, 1e-300)) + 80) / 80 * 100); return `<div class="bar"><span>${n === 0 ? 'ilk terim' : n + '. düzeltme'}</span><span><i class="${g > 0.1 ? 'ray' : ''}" style="width:${Math.min(100, w)}%"></i></span><span>${n === 0 ? '1' : '~' + sci(t)}</span></div>`; });
    $('series').innerHTML = '<p class="note" style="margin:0 0 6px">Perturbasyon serisinin terimleri, ilk terime göre (g<sub>eff</sub><sup>n</sup>, logaritmik ölçek)</p>' + rows.join(''); }
  sl.addEventListener('input', upd); upd();
}

/* ===== CH1 pants slicing ===== */
{
  const svg = $('pants'), sl = $('pb');
  const f = fig(svg, (W, H) => {
    const b = +sl.value, cx = W / 2, top = 22, bot = H - 36, k = (bot - top) * .55 / ((W * .22) ** 2), y0 = top + (bot - top) * .45, half = W * .38;
    // crotch: y = y0 + k x^2 (screen y down), legs below
    const crotch = []; for (let x = -half * .62; x <= half * .62; x += 3) crotch.push([cx + x, y0 + k * x * x]);
    let s = `<path d="M${cx - half},${bot} L${cx - half},${top} L${cx + half},${top} L${cx + half},${bot} L${crotch[crotch.length - 1][0]},${bot} ${crotch.slice().reverse().map(p => 'L' + p[0].toFixed(1) + ',' + Math.min(bot, p[1]).toFixed(1)).join(' ')} L${crotch[0][0]},${bot} Z" fill="var(--field)" fill-opacity=".16" stroke="var(--field)" stroke-width="2"/>`;
    s += T(cx - half * .8, bot - 8, 'string 1', 'text-anchor="middle" style="font-size:12px"') + T(cx + half * .8, bot - 8, 'string 2', 'text-anchor="middle" style="font-size:12px"') + T(cx, top + 18, 'birleşmiş string', 'text-anchor="middle" style="font-size:12px"');
    // slicing lines: screen slope = -b (time up), y = c - b*(x-cx)... in screen coords y decreases upward: line y = c + b*(x - cx)?
    // time t = -(y); slice t = t0 + b x  -> y = -t0 - b (x-cx)*(scale) ; use screen slope m = -b
    const m = -b; // dy/dx in screen
    // tangency with y = y0 + k x^2 : slope 2 k x = m -> x* = m/(2k)
    const xs = m / (2 * k), ys = y0 + k * xs * xs, c0 = ys - m * xs;
    for (let j = -4; j <= 4; j++) { const c = c0 + j * 22; s += L(cx - half - 10, c + m * (-half - 10), cx + half + 10, c + m * (half + 10), j === 0 ? 'var(--ray)' : 'var(--mute)', j === 0 ? 2.5 : 1, j === 0 ? '' : 'stroke-opacity=".45"'); }
    s += L(cx - half - 4, bot + 14, cx - half - 4, top, 'var(--mute)', 1.2, 'marker-end="url(#pa)"') + T(cx - half + 4, top - 8, 'ct', 'style="font-size:11px;fill:var(--mute)"') + L(cx - half - 4, bot + 14, cx + half, bot + 14, 'var(--mute)', 1.2, 'marker-end="url(#pa)"') + T(cx + half, bot + 26, 'x', 'text-anchor="end" style="font-size:11px;fill:var(--mute)"');
    s += dot(cx + xs, ys, 8, 'var(--ray)', 'stroke="var(--panel)" stroke-width="3"');
    s += dot(cx, y0, 4, 'var(--ink)') + (Math.abs(b) > .05 ? T(cx, y0 + 22, 'duran gözlemcinin noktası', 'text-anchor="middle" style="font-size:12px;fill:var(--mute)"') : '');
    svg.innerHTML = `<defs><marker id="pa" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--mute)"/></marker><clipPath id="pc"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#pc)">${s}</g>`;
    const v = $('pv'); v.className = 'verdict'; v.innerHTML = Math.abs(b) < 0.02 ? 'Duran gözlemci: string\'ler kemerin tepesinde birleşiyor.' : `Bu gözlemci için birleşme kemerin ${b > 0 ? 'sol' : 'sağ'} yanında, tepeden uzakta. Turuncu nokta kayıyor: herkesin üzerinde anlaştığı bir etkileşim noktası yok.`;
  });
  sl.addEventListener('input', () => { $('pbo').textContent = tr(+sl.value); f(); }); $('pbo').textContent = tr(+sl.value);
}

/* ===== CH1 harmonics + ladder ===== */
{
  const c = $('harm'), sl = $('harm-n'), lad = $('ladder'); let typ = 0, t = 0;
  $('harm-t').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; typ = +b.dataset.t; $('harm-t').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); fl(); draw(0); });
  function draw(dt) {
    const [g, W, H] = canvasSize(c); g.clearRect(0, 0, W, H); if (!reduce) t += dt * 2.5; const n = +sl.value, fc = col('--field'), rc = col('--ray');
    g.lineWidth = 3;
    if (typ === 0) { const x0 = 30, x1 = W - 30, cy = H / 2, A = H * .3;
      g.strokeStyle = col('--line'); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, cy); g.lineTo(x1, cy); g.stroke(); g.lineWidth = 3; g.strokeStyle = fc; g.beginPath();
      for (let x = x0; x <= x1; x += 2) { const s = (x - x0) / (x1 - x0), y = cy - A * Math.sin(n * Math.PI * s) * Math.cos(n * t * .6); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = rc; [x0, x1].forEach(x => { g.beginPath(); g.arc(x, cy - A * Math.sin(0) * 0, 5, 0, 7); g.fill(); });
      g.fillStyle = col('--mute'); g.font = '13px Inter,sans-serif'; g.fillText('uçları iki D-brane\'e bağlı açık string (Dirichlet koşulu)', x0, H - 10); }
    else { const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .3, A = R * .18; g.strokeStyle = fc; g.beginPath();
      for (let a = 0; a <= 2 * Math.PI + .01; a += .02) { const r = R + A * Math.cos(n * a - n * t * .6) * .6 + A * Math.cos(n * a + n * t * .6) * .4, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.closePath(); g.stroke();
      g.fillStyle = col('--mute'); g.font = '13px Inter,sans-serif'; g.fillText('sağa ve sola dolaşan iki dalga', 14, H - 10); }
  }
  const fl = fig(lad, (W, H) => {
    const n = +sl.value, lv = typ === 0 ? [[0, -1, 'takyon (bosonic)'], [1, 0, 'kütlesiz: foton'], [2, 1, ''], [3, 2, ''], [4, 3, ''], [5, 4, ''], [6, 5, '']] : [[0, -4, 'takyon (bosonic)'], [1, 0, 'kütlesiz: graviton'], [2, 4, ''], [3, 8, '']];
    const lo = typ === 0 ? -1 : -4, hi = typ === 0 ? 5 : 8, Y = v => H - 14 - (v - lo) / (hi - lo) * (H - 44);
    let s = L(46, Y(0), 54, Y(0), 'var(--mute)', 1) + L(46, 18, 46, H - 6, 'var(--mute)', 1) + T(40, 12, 'm²', 'style="font-size:11px;fill:var(--mute)"') + T(42, Y(0) + 4, 'm²=0', 'text-anchor="end" style="font-size:11px"');
    lv.forEach(([N, m2, lab]) => { const on = typ === 0 ? N === n : N === Math.min(n, 3); s += L(56, Y(m2), W * .42, Y(m2), on ? 'var(--ray)' : 'var(--field)', on ? 4 : 2) + T(W * .42 + 6, Y(m2) + 4, (typ === 0 ? 'N=' + N : 'N=Ñ=' + N) + (lab ? ' ' + lab : ''), 'style="font-size:11px"'); });
    s += T(W - 4, 12, typ === 0 ? 'α′m² = N − 1' : 'α′m²/4 = N − 1', 'text-anchor="end" style="font-size:11px;fill:var(--mute)"');
    lad.innerHTML = s;
  });
  sl.addEventListener('input', () => { $('harm-no').textContent = sl.value; fl(); if (reduce) draw(0); }); $('harm-no').textContent = sl.value;
  visibleLoop(c, draw); new ResizeObserver(() => draw(0)).observe(c);
}

/* ===== CH1 hose ===== */
{
  const svg = $('hose'), sl = $('hz');
  const f = fig(svg, (W, H) => {
    const z = +sl.value, r = 1 + z * Math.min(H * .32, 70), cy = H / 2, x0 = 20, x1 = W - 20;
    let s = `<rect x="${x0}" y="${cy - r}" width="${x1 - x0}" height="${2 * r}" fill="var(--field)" fill-opacity="${.08 + .1 * z}"/>` + L(x0, cy - r, x1, cy - r, 'var(--field)', 2) + L(x0, cy + r, x1, cy + r, 'var(--field)', 2);
    if (r > 6) { for (let k = 0; k <= 6; k++) { const x = x0 + (x1 - x0) * k / 6; s += `<path d="M${x},${cy - r} a${r * .28},${r} 0 0 1 0,${2 * r}" fill="none" stroke="var(--field)" stroke-width="1.2" stroke-opacity=".6"/><path d="M${x},${cy - r} a${r * .28},${r} 0 0 0 0,${2 * r}" fill="none" stroke="var(--field)" stroke-width="1" stroke-dasharray="3 4" stroke-opacity=".4"/>`; }
      const ax = W * .5, ay = cy + r * .3; s += `<ellipse cx="${ax}" cy="${ay}" rx="${6 + 4 * z}" ry="${3 + 2 * z}" fill="var(--ray)"/><circle cx="${ax + 8 + 4 * z}" cy="${ay - 1}" r="${2.5 + 1.5 * z}" fill="var(--ray)"/>` + T(ax, ay + 24 + r * .2, 'karınca iki yöne de gidebilir', 'text-anchor="middle" style="font-size:12px"'); }
    s += T(x0, 18, z < .1 ? 'uzaktan: bir çizgi (1 boyut)' : z < .6 ? 'yaklaştıkça kalınlık görünüyor' : 'yakından: çizgi × çember (2 boyut)', 'style="font-size:13px;font-weight:600"');
    svg.innerHTML = s;
  });
  sl.addEventListener('input', () => { $('hzo').textContent = tr(+sl.value * 100, 0) + '%'; f(); }); $('hzo').textContent = tr(+sl.value * 100, 0) + '%';
}

/* ===== CH1 circle wave ===== */
{
  const svg = $('circ'), sl = $('cn');
  const f = fig(svg, (W, H) => {
    const n = +sl.value, cx = W / 2, cy = H / 2 + 4, R = Math.min(W, H) * .3, A = R * .22, int = Math.abs(n - Math.round(n)) < 0.02;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="2"/>`;
    const pts = []; for (let a = 0; a <= 2 * Math.PI + 1e-6; a += .02) { const r = R + A * Math.cos(n * a); pts.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]); }
    s += poly(pts, int ? 'var(--field)' : 'var(--ray)', 3);
    const p0 = pts[0], p1 = pts[pts.length - 1];
    s += dot(p0[0], p0[1], 5, 'var(--ink)') + T(p0[0] + 10, p0[1] + 4, 'başlangıç', 'style="font-size:12px"');
    if (!int) s += L(p0[0], p0[1], p1[0], p1[1], 'var(--warn)', 3) + dot(p1[0], p1[1], 5, 'var(--warn)') + T(p1[0] + 10, p1[1] + 18, 'uyuşmuyor', 'style="font-size:12px;fill:var(--warn)"');
    svg.innerHTML = s;
    const v = $('cv'); if (int) { v.className = 'verdict good'; v.innerHTML = `n = ${Math.round(n)}: dalga bir turda kendine dönüyor. Momentum p = ${Math.round(n)}ħ/R.`; } else { v.className = 'verdict bad'; v.textContent = 'Dalga başladığı yere uymuyor: dalga fonksiyonu tek değerli değil. Yalnız tam sayılar izinli.'; }
  });
  sl.addEventListener('input', () => { $('cno').textContent = tr(+sl.value, 2); f(); }); $('cno').textContent = tr(+sl.value, 2);
}

/* ===== CH1 T-duality ===== */
{
  const svg = $('tdual'), sl = $('tR');
  const ST = [[1, 0], [0, 1], [2, 0], [0, 2], [1, 1]], lab = ([n, w]) => `(n=${n}, w=${w})`, E = (R, [n, w]) => Math.hypot(n / R, w * R);
  const f = fig(svg, (W, H) => {
    const pl = 46, pb = 36, pr = 90, pt = 14, xl = -0.7, xh = 0.7, yh = 6, X = v => pl + (v - xl) / (xh - xl) * (W - pl - pr), Y = v => pt + (1 - v / yh) * (H - pt - pb);
    let s = L(pl, Y(0), W - pr, Y(0), 'var(--ink)') + L(pl, Y(0), pl, pt, 'var(--ink)');
    [0.2, 0.5, 1, 2, 5].forEach(r => { const v = Math.log10(r); if (v >= xl && v <= xh) s += T(X(v), Y(0) + 18, tr(r, r < 1 ? 1 : 0), 'text-anchor="middle" style="font-size:12px"'); });
    for (let e = 0; e <= yh; e += 2) s += T(pl - 6, Y(e) + 4, e, 'text-anchor="end" style="font-size:12px"');
    s += T(W - pr, H - 4, 'R / √α′', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"') + T(pl + 4, pt + 10, 'enerji', 'style="font-size:12px;fill:var(--mute)"');
    s += L(X(0), Y(0), X(0), pt, 'var(--mute)', 1, 'stroke-dasharray="4 4"') + T(X(0), pt + 10, 'R = √α′', 'text-anchor="middle" style="font-size:11px;fill:var(--mute)"');
    const used = [];
    ST.forEach((st, i) => { const pts = []; for (let v = xl; v <= xh + 1e-9; v += .01) { const e = E(10 ** v, st); if (e <= yh) pts.push([X(v), Y(e)]); } const c = st[1] === 0 ? 'var(--field)' : st[0] === 0 ? 'var(--ray)' : 'var(--good)'; s += poly(pts, c, 2, st[0] && st[1] ? 'stroke-dasharray="6 4"' : '');
      const last = pts[pts.length - 1]; let ly = last ? Math.max(pt + 10, last[1]) : 0; while (last && used.some(u => Math.abs(u - ly) < 13)) ly += 13; if (last) used.push(ly); if (last) s += T(Math.min(last[0] + 4, W - pr + 4), ly, lab(st), `style="font-size:11px;fill:${c}"`); });
    const v = +sl.value; s += L(X(v), Y(0), X(v), pt, 'var(--ink)', 2) + L(X(-v), Y(0), X(-v), pt, 'var(--ink)', 1.5, 'stroke-dasharray="5 4"');
    s += T(X(v), Y(0) - 6, 'R', 'text-anchor="middle" style="font-weight:700"') + T(X(-v), Y(0) - 6, 'α′/R', 'text-anchor="middle" style="font-weight:700"');
    svg.innerHTML = s;
    const R = 10 ** v, a = ST.map(st => E(R, st)).map(e => tr(e, 2)), bb = ST.map(([n, w]) => E(1 / R, [w, n])).map(e => tr(e, 2));
    dl($('tr-r'), [['R', tr(R, 2)], ['α′/R', tr(1 / R, 2)], ...ST.map((st, i) => [lab(st) + ' ↔ ' + lab([st[1], st[0]]), a[i] + ' = ' + bb[i]])]);
  });
  sl.addEventListener('input', () => { $('tRo').textContent = tr(10 ** +sl.value, 2); f(); }); $('tRo').textContent = tr(10 ** +sl.value, 2);
}

/* ===== CH1 eleventh dimension ===== */
{
  const svg = $('m11'), sl = $('gs');
  const f = fig(svg, (W, H) => {
    const g = 10 ** +sl.value, r = Math.max(1, Math.min(H * .38, 6 + Math.log10(g * 100) / 3 * (H * .38 - 6))), cy = H / 2, x0 = 30, x1 = W - 30;
    let s = `<rect x="${x0}" y="${cy - r}" width="${x1 - x0}" height="${2 * r}" fill="var(--ray)" fill-opacity=".12"/>` + L(x0, cy - r, x1, cy - r, 'var(--ray)', 2) + L(x0, cy + r, x1, cy + r, 'var(--ray)', 2);
    if (r > 5) s += `<ellipse cx="${x1}" cy="${cy}" rx="${r * .3}" ry="${r}" fill="none" stroke="var(--ray)" stroke-width="2"/>` + L(x1 + r * .3 + 8, cy - r, x1 + r * .3 + 8, cy + r, 'var(--ink)', 1) + T(x1 - r * .3 - 6, cy + 4, 'R₁₁', 'text-anchor="end" style="font-weight:700"');
    s += T(x0, 18, 'on boyutlu uzayzaman × çember', 'style="font-size:13px"');
    svg.innerHTML = s;
  });
  function upd() { const g = 10 ** +sl.value; $('gso').textContent = tr(g, g < 1 ? 2 : 1); const v = $('gsv');
    if (g < 0.3) { v.className = 'verdict'; v.innerHTML = `R₁₁ = ${tr(g, 2)} ℓ<sub>s</sub>: çember string ölçeğinden küçük, görünmüyor. Teori on boyutlu Type IIA gibi.`; }
    else if (g < 3) { v.className = 'verdict'; v.innerHTML = `R₁₁ ≈ ${tr(g, 2)} ℓ<sub>s</sub>: ara bölge. Perturbatif tarif artık güvenilir değil.`; }
    else { v.className = 'verdict good'; v.innerHTML = `R₁₁ = ${tr(g, 1)} ℓ<sub>s</sub>: on birinci boyut açıldı. Doğru tarif on bir boyutlu M-theory.`; }
    f(); }
  sl.addEventListener('input', upd); upd();
}

/* ===== CH1 Gauss law in extra dimensions ===== */
{
  const svg = $('gauss'), sl = $('gn');
  const f = fig(svg, (W, H) => {
    const n = +sl.value, pl = 50, pb = 36, pr = 14, pt = 14, xl = -2, xh = 2, yl = -6, yh = 8, X = v => pl + (v - xl) / (xh - xl) * (W - pl - pr), Y = v => pt + (1 - (v - yl) / (yh - yl)) * (H - pt - pb);
    let s = L(pl, Y(yl), W - pr, Y(yl), 'var(--ink)') + L(pl, Y(yl), pl, pt, 'var(--ink)');
    for (let v = -2; v <= 2; v++) s += T(X(v), Y(yl) + 18, sup(v), 'text-anchor="middle" style="font-size:12px"');
    s += T(W - pr, H - 4, 'uzaklık r / R', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"') + T(pl + 4, pt + 10, 'kuvvet (keyfi birim, log)', 'style="font-size:12px;fill:var(--mute)"');
    s += L(X(0), Y(yl), X(0), pt, 'var(--mute)', 1, 'stroke-dasharray="4 4"') + T(X(0) + 4, Y(yl) - 8, 'r = R', 'style="font-size:11px;fill:var(--mute)"');
    const ref = [], ext = [];
    for (let v = xl; v <= xh + 1e-9; v += .02) { ref.push([X(v), Y(-2 * v)]); const y = v >= 0 ? -2 * v : -(2 + n) * v; ext.push([X(v), Y(y - (n ? 0 : 0))]); }
    // compare at same large-distance strength: true theory weaker at long range -> shift down by n units of log for display
    const shift = n * 0.8;
    s += poly(ref.map(p => p), 'var(--mute)', 1.5, 'stroke-dasharray="6 4"') + poly(ext.map(([x, y]) => [x, y + (Y(0) - Y(shift))]), 'var(--field)', 3);
    s += T(X(-1.9), Y(4) - 4, '1/r² (ekstra boyut yok)', 'style="font-size:12px;fill:var(--mute)"') + T(X(.3), Y(-2 * .3 - shift) + 22, n ? `r < R: 1/r^${2 + n}, r > R: 1/r²` : 'aynı', 'style="font-size:12px;fill:var(--field);font-weight:600"');
    svg.innerHTML = s;
  });
  sl.addEventListener('input', () => { $('gno').textContent = sl.value; f(); }); $('gno').textContent = sl.value;
}

/* ===== CH1 S vs M ===== */
{
  const svg = $('sm'), sl = $('m-bh');
  const f = fig(svg, (W, H) => {
    const pl = 56, pb = 34, pr = 16, pt = 12, xl = -8, xh = 10, yl = 40, yh = 100, X = v => pl + (v - xl) / (xh - xl) * (W - pl - pr), Y = v => pt + (1 - (v - yl) / (yh - yl)) * (H - pt - pb);
    let s = L(pl, Y(yl), W - pr, Y(yl), 'var(--ink)') + L(pl, Y(yl), pl, pt, 'var(--ink)');
    for (let v = -8; v <= 10; v += W < 520 ? 6 : 3) s += T(X(v), Y(yl) + 18, sup(v), 'text-anchor="middle" style="font-size:12px"');
    for (let v = 40; v <= 100; v += 20) s += T(pl - 6, Y(v) + 4, sup(v), 'text-anchor="end" style="font-size:12px"');
    s += T(W - pr, H - 2, 'kütle / M☉', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"') + T(pl + 6, pt + 10, 'S / k_B', 'style="font-size:12px;fill:var(--mute)"');
    const star = [[X(xl), Y(57 + xl)], [X(xh), Y(57 + xh)]], bh = [[X(xl), Y(77 + 2 * xl)], [X(xh), Y(Math.min(yh, 77 + 2 * xh))]];
    const bhx = Math.min(xh, (yh - 77) / 2); bh[1] = [X(bhx), Y(77 + 2 * bhx)];
    s += poly(star, 'var(--field)', 2.5) + poly(bh, 'var(--ray)', 3);
    s += T(X(4), Y(57 + 4) + 18, 'sıradan madde ∝ M', 'style="font-size:12px;fill:var(--field);font-weight:600"') + T(X(-7), Y(77 - 14) - 12, 'kara delik ∝ M²', 'style="font-size:12px;fill:var(--ray);font-weight:600"');
    const m = +sl.value; if (m >= xl && m <= xh) { const y = 77 + 2 * m; if (y <= yh && y >= yl) s += dot(X(m), Y(y), 7, 'var(--ray)', 'stroke="var(--panel)" stroke-width="3"'); if (57 + m >= yl) s += dot(X(m), Y(57 + m), 6, 'var(--field)', 'stroke="var(--panel)" stroke-width="3"'); }
    svg.innerHTML = s;
  });
  sl.addEventListener('input', f);
}

/* ===== CH1 holography cylinder ===== */
{
  const svg = $('holo');
  fig(svg, (W, H) => {
    const cx = W / 2, rx = Math.min(W * .3, 120), ry = rx * .28, top = 30, bot = H - 30;
    let s = `<rect x="${cx - rx}" y="${top}" width="${2 * rx}" height="${bot - top}" fill="var(--field)" fill-opacity=".1"/>` + L(cx - rx, top, cx - rx, bot, 'var(--field)', 2) + L(cx + rx, top, cx + rx, bot, 'var(--field)', 2);
    s += `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="var(--bg)" stroke="var(--field)" stroke-width="2"/><path d="M${cx - rx},${bot} a${rx},${ry} 0 0 0 ${2 * rx},0" fill="none" stroke="var(--field)" stroke-width="2"/><path d="M${cx - rx},${bot} a${rx},${ry} 0 0 1 ${2 * rx},0" fill="none" stroke="var(--field)" stroke-width="1.2" stroke-dasharray="4 4"/>`;
    s += `<path d="M${cx - rx * .3},${bot - 10} C${cx + rx * .4},${(top + bot) * .6} ${cx - rx * .5},${(top + bot) * .4} ${cx + rx * .2},${top + 20}" fill="none" stroke="var(--ray)" stroke-width="3"/>`;
    s += T(cx - rx * .05, (top + bot) / 2, 'içeride: kütleçekim', 'text-anchor="middle" style="font-size:13px;font-weight:600"');
    const lx = Math.min(cx + rx + 12, W - 140); s += T(lx, top + 30, 'sınırda:', 'style="font-size:12px;fill:var(--field)"') + T(lx, top + 46, 'gauge teorisi', 'style="font-size:12px;fill:var(--field)"');
    s += L(cx - rx - 16, bot, cx - rx - 16, top + 8, 'var(--mute)', 1, 'marker-end="url(#a2)"') + T(cx - rx - 22, (top + bot) / 2, 'zaman', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"');
    svg.innerHTML = '<defs><marker id="a2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--mute)"/></marker></defs>' + s;
  });
}

/* ===== CH2 3D light cone ===== */
{
  const svg = $('cone3'), sl = $('c3');
  const f = fig(svg, (W, H) => {
    const th = +sl.value, cx = W / 2, cy = H / 2, sc = Math.min(W, H) * .2, el = .35;
    const P = (x, y, t) => { const xr = x * Math.cos(th) - y * Math.sin(th), yr = x * Math.sin(th) + y * Math.cos(th); return [cx + xr * sc, cy - t * sc - yr * sc * el]; };
    let s = '';
    for (const sg of [-1, 1]) { const ring = []; for (let a = 0; a <= 2 * Math.PI + .01; a += .05) ring.push(P(1.8 * Math.cos(a), 1.8 * Math.sin(a), sg * 1.8)); s += `<path d="M${ring.map(p => p.join(',')).join(' L')} Z" fill="var(--ray)" fill-opacity=".12" stroke="var(--ray)" stroke-width="2"/>`;
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, p = P(1.8 * Math.cos(a), 1.8 * Math.sin(a), sg * 1.8), o = P(0, 0, 0); s += L(o[0], o[1], p[0], p[1], 'var(--ray)', 1, 'stroke-opacity=".45"'); } }
    const ax = (a, b, lab) => { const p = P(...a), q = P(...b); s += L(p[0], p[1], q[0], q[1], 'var(--ink)', 1.3) + T(q[0] + 4, q[1] - 4, lab, 'style="font-size:13px"'); };
    ax([0, 0, -2.3], [0, 0, 2.3], 'ct'); ax([-2.3, 0, 0], [2.3, 0, 0], 'x'); ax([0, -2.3, 0], [0, 2.3, 0], 'y');
    const e1 = P(.5, .3, 1.3), e2 = P(1.9, .6, .6); s += dot(e1[0], e1[1], 7, 'var(--field)') + T(e1[0] + 10, e1[1] + 4, 'içeride: timelike', 'style="font-size:12px"') + dot(e2[0], e2[1], 7, 'var(--mute)') + T(e2[0] + 10, e2[1] + 4, 'dışarıda: spacelike', 'style="font-size:12px"');
    T && (s += T(P(0, 0, 1.9)[0] - 6, P(0, 0, 1.9)[1] - 10, 'gelecek', 'text-anchor="end" style="font-size:12px;fill:var(--ray)"') + T(P(0, 0, -1.9)[0] - 6, P(0, 0, -1.9)[1] + 18, 'geçmiş', 'text-anchor="end" style="font-size:12px;fill:var(--ray)"'));
    svg.innerHTML = s;
  });
  sl.addEventListener('input', () => { $('c3o').textContent = tr(+sl.value * 57.3, 0) + '°'; f(); }); $('c3o').textContent = tr(+sl.value * 57.3, 0) + '°';
}

/* ===== CH2 light clock ===== */
{
  const c = $('lclock'), sl = $('lcb'); let t = 0, tick0 = 0, tick1 = 0;
  function draw(dt) {
    const [g, W, H] = canvasSize(c); g.clearRect(0, 0, W, H); const b = +sl.value, gam = 1 / Math.sqrt(1 - b * b);
    if (!reduce) t += dt; const half = W / 2, top = 40, bot = H - 40, h = bot - top, per = 1.6; // seconds per one-way at rest
    const fc = col('--field'), rc = col('--ray'), ink = col('--ink'), mu = col('--mute');
    g.font = '600 14px Inter,sans-serif'; g.fillStyle = ink; g.fillText('Saatle birlikte', 16, 22); g.fillText('Yerden bakan', half + 16, 22);
    // rest clock
    const T1x = 0, ph0 = (t / per) % 2, y0 = ph0 < 1 ? bot - ph0 * h : top + (ph0 - 1) * h, x0 = half / 2;
    g.strokeStyle = fc; g.lineWidth = 4; [[top], [bot]].forEach(([y]) => { g.beginPath(); g.moveTo(x0 - 30, y); g.lineTo(x0 + 30, y); g.stroke(); });
    g.fillStyle = rc; g.beginPath(); g.arc(x0, y0, 6, 0, 7); g.fill();
    // moving clock: one-way time per*gamma; mirrors drift at speed b*c, with c = h/per (screen units)
    const T1 = per * gam, cpx = h / per, vx = b * cpx, xl = half + 34, xr = W - 34, span = xr - xl;
    const lap = vx > 0 ? span / vx : 1e9, tt = vx > 0 ? t % lap : t, xs = xl + vx * tt;
    const yAt = s => { const p = (s / T1) % 2; return p < 1 ? bot - p * h : top + (p - 1) * h; };
    g.strokeStyle = rc; g.lineWidth = 1.5; g.globalAlpha = .55; g.beginPath();
    let s0 = t - tt; g.moveTo(xl, yAt(s0)); for (let k = Math.ceil(s0 / T1) * T1; k < t; k += T1) g.lineTo(xl + vx * (k - s0), yAt(k + 1e-6)); g.lineTo(xs, yAt(t)); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = fc; g.lineWidth = 4; g.beginPath(); g.moveTo(xs - 30, top); g.lineTo(xs + 30, top); g.moveTo(xs - 30, bot); g.lineTo(xs + 30, bot); g.stroke();
    g.fillStyle = rc; g.beginPath(); g.arc(xs, yAt(t), 6, 0, 7); g.fill();
    g.fillStyle = mu; g.font = '12px Inter,sans-serif'; if (b > 0) g.fillText('saat → v', xs - 22, bot + 18);
    g.fillStyle = mu; g.font = '13px Inter,sans-serif';
    g.fillText('tik: ' + Math.floor(t / (2 * per)), 16, H - 14); g.fillText('tik: ' + Math.floor(t / (2 * T1)), half + 16, H - 14);
    g.strokeStyle = col('--line'); g.lineWidth = 1; g.beginPath(); g.moveTo(half, 10); g.lineTo(half, H - 10); g.stroke();
  }
  function upd() { const b = +sl.value, gam = 1 / Math.sqrt(1 - b * b); $('lcbo').textContent = tr(b); dl($('lcr'), [['γ', tr(gam, 3)], ['Duran saatin 1 tiki', '1 birim'], ['Hareket edenin 1 tiki (yerden)', tr(gam, 3) + ' birim'], ['Fotonun çapraz yolu', tr(gam, 3) + ' × dikey yol']]); t = 0; }
  sl.addEventListener('input', () => { upd(); if (reduce) draw(0); }); upd(); visibleLoop(c, draw); new ResizeObserver(() => draw(0)).observe(c);
}

/* ===== CH2 relativity of simultaneity ===== */
{
  const svg = $('simul'), sl = $('sb'); const A = {t: 0, x: -1.6}, B = {t: 0.8, x: 1.6};
  const f = fig(svg, (W, H) => {
    const b = +sl.value, g = 1 / Math.sqrt(1 - b * b), R = 3, sc = Math.min((W - 30) / (2 * R), (H - 30) / (2 * R)), cx = W / 2, cy = H / 2, P = (t, x) => [cx + x * sc, cy - t * sc];
    let s = '';
    let a = P(-R, -R), c = P(R, R); s += L(a[0], a[1], c[0], c[1], 'var(--ray)', 1.2, 'stroke-opacity=".5"'); a = P(-R, R); c = P(R, -R); s += L(a[0], a[1], c[0], c[1], 'var(--ray)', 1.2, 'stroke-opacity=".5"');
    a = P(0, -R); c = P(0, R); s += L(a[0], a[1], c[0], c[1], 'var(--ink)', 1) + T(c[0] - 4, c[1] + 18, 'x', 'text-anchor="end"'); a = P(-R, 0); c = P(R, 0); s += L(a[0], a[1], c[0], c[1], 'var(--ink)', 1) + T(c[0] + 6, c[1] + 12, 'ct');
    // moving frame simultaneity line through A: t - A.t = b (x - A.x)
    const tl = x => A.t + b * (x - A.x); a = P(tl(-R), -R); c = P(tl(R), R); s += L(a[0], a[1], c[0], c[1], 'var(--field)', 2.5) + T(c[0] - 4, c[1] - 8, 'S′ için “şimdi”', 'text-anchor="end" style="font-size:12px;fill:var(--field);font-weight:600"');
    const pa = P(A.t, A.x), pb = P(B.t, B.x); s += dot(pa[0], pa[1], 8, 'var(--ray)') + T(pa[0] - 10, pa[1] + 22, 'A', 'style="font-weight:700"') + dot(pb[0], pb[1], 8, 'var(--ray)') + T(pb[0] + 10, pb[1] - 10, 'B', 'style="font-weight:700"');
    svg.innerHTML = s;
    const dtp = g * ((B.t - A.t) - b * (B.x - A.x)), v = $('sv');
    if (Math.abs(dtp) < 0.04) { v.className = 'verdict'; v.innerHTML = `Bu gözlemci için A ile B <b>eşzamanlı</b> (β = ${tr(b)}).`; }
    else if (dtp > 0) { v.className = 'verdict good'; v.innerHTML = `Önce A, sonra B. cΔt′ = ${tr(dtp)}.`; }
    else { v.className = 'verdict bad'; v.innerHTML = `Önce B, sonra A! cΔt′ = ${tr(dtp)}. Olaylar spacelike ayrılmış olduğu için bu bir çelişki değil.`; }
  });
  sl.addEventListener('input', () => { $('sbo').textContent = tr(+sl.value); f(); }); $('sbo').textContent = tr(+sl.value);
}

/* ===== CH2 tanh plot ===== */
{
  const svg = $('tanh'), s1 = $('b1-hiz'), s2 = $('b2-hiz'), sn = $('n-hiz');
  const f = fig(svg, (W, H) => {
    const p1 = Math.atanh(+s1.value), p2 = Math.atanh(+s2.value), n = +sn.value, pl = 44, pb = 36, pr = 16, pt = 16, xh = 6, X = v => pl + v / xh * (W - pl - pr), Y = v => pt + (1 - v / 1.15) * (H - pt - pb);
    let s = L(pl, Y(0), W - pr, Y(0), 'var(--ink)') + L(pl, Y(0), pl, pt, 'var(--ink)') + L(pl, Y(1), W - pr, Y(1), 'var(--ray)', 1.5, 'stroke-dasharray="6 4"') + T(W - pr, Y(1) - 6, 'β = 1 (ışık)', 'text-anchor="end" style="font-size:12px;fill:var(--ray)"');
    for (let v = 0; v <= xh; v++) s += T(X(v), Y(0) + 18, v, 'text-anchor="middle" style="font-size:12px"');
    [0, .5, 1].forEach(v => { s += T(pl - 6, Y(v) + 4, tr(v, 1), 'text-anchor="end" style="font-size:12px"'); });
    s += T(W - pr, H - 4, 'rapidity φ', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"');
    const pts = []; for (let v = 0; v <= xh; v += .03) pts.push([X(v), Y(Math.tanh(v))]); s += poly(pts, 'var(--field)', 3);
    const mark = (v, c, lab, up) => { if (v > xh) return; s += L(X(v), Y(0), X(v), Y(Math.tanh(v)), c, 1.2, 'stroke-dasharray="3 3"') + dot(X(v), Y(Math.tanh(v)), 6, c) + T(X(v), Y(0) - 8 - (up || 0), lab, `text-anchor="middle" style="font-size:12px;fill:${c};font-weight:600"`); };
    mark(p1, 'var(--mute)', 'φ₁', 0); mark(p1 + p2, 'var(--ray)', 'φ₁+φ₂', 16); mark(n * p1, 'var(--field)', n + 'φ₁', 32);
    svg.innerHTML = s;
  });
  [s1, s2, sn].forEach(x => x.addEventListener('input', f));
}

/* ===== CH2 twin paradox ===== */
{
  const svg = $('twin'), sl = $('tw'), TT = 10;
  const f = fig(svg, (W, H) => {
    const b = +sl.value, g = 1 / Math.sqrt(1 - b * b), xm = b * TT / 2, sc = Math.min((H - 52) / TT, (W - 80) / Math.max(xm * 2, 4)), x0 = 60, y0 = H - 26, P = (t, x) => [x0 + x * sc, y0 - t * sc];
    let s = L(x0, y0, x0, P(TT, 0)[1] - 6, 'var(--field)', 3) + T(x0 + 8, P(TT, 0)[1] + 4, 'Dünya', 'text-anchor="start" style="font-size:12px;fill:var(--field)"');
    const turn = P(TT / 2, xm); s += poly([P(0, 0), turn, P(TT, 0)], 'var(--ray)', 3) + T(turn[0] + 8, turn[1] + 4, 'dönüş', 'style="font-size:12px;fill:var(--ray)"');
    for (let k = 1; k < TT; k++) { const p = P(k, 0); s += dot(p[0], p[1], 3.5, 'var(--field)'); }
    const tau = TT / g; for (let k = 1; k < tau; k++) { const tt = k * g; const x = tt <= TT / 2 ? b * tt : b * (TT - tt); const p = P(tt, x); s += dot(p[0], p[1], 3.5, 'var(--ray)'); }
    s += L(x0, y0, W - 10, y0, 'var(--ink)') + T(W - 14, y0 + 16, 'x (ışık yılı)', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"');
    for (let k = 0; k <= TT; k += 2) { const p = P(k, 0); s += L(x0 - 4, p[1], x0, p[1], 'var(--ink)') + T(x0 - 8, p[1] + 4, k, 'text-anchor="end" style="font-size:11px;fill:var(--mute)"'); }
    for (let k = 1; k <= Math.floor(xm); k++) { const p = P(0, k); s += L(p[0], y0, p[0], y0 + 4, 'var(--ink)') + T(p[0], y0 + 16, k, 'text-anchor="middle" style="font-size:11px;fill:var(--mute)"'); }
    s += T(x0 - 30, 14, 'ct (yıl)', 'style="font-size:12px;fill:var(--mute)"');
    svg.innerHTML = s;
    dl($('twr'), [['γ', tr(g, 3)], ['Dünya\'daki ikiz', tr(TT, 1) + ' yıl'], ['Gezgin ikiz', tr(tau, 2) + ' yıl'], ['Fark', tr(TT - tau, 2) + ' yıl'], ['En uzak nokta', tr(xm, 2) + ' ışık yılı']]);
  });
  sl.addEventListener('input', () => { $('two').textContent = tr(+sl.value); f(); }); $('two').textContent = tr(+sl.value);
}

/* ===== CH2 kinetic energy ===== */
{
  const svg = $('ke'), sl = $('keb');
  const f = fig(svg, (W, H) => {
    const b = +sl.value, pl = 44, pb = 36, pr = 16, pt = 14, yh = 4, X = v => pl + v * (W - pl - pr), Y = v => pt + (1 - v / yh) * (H - pt - pb);
    let s = L(pl, Y(0), W - pr, Y(0), 'var(--ink)') + L(pl, Y(0), pl, pt, 'var(--ink)') + L(X(1), Y(0), X(1), pt, 'var(--ray)', 1.5, 'stroke-dasharray="6 4"');
    [0, .25, .5, .75, 1].forEach(v => { s += T(X(v), Y(0) + 18, tr(v, 2), 'text-anchor="middle" style="font-size:12px"'); }); for (let v = 0; v <= yh; v++) s += T(pl - 6, Y(v) + 4, v, 'text-anchor="end" style="font-size:12px"');
    s += T(W - pr, H - 4, 'β', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"') + T(pl + 6, pt + 10, 'kinetik enerji / mc²', 'style="font-size:12px;fill:var(--mute)"');
    const nw = [], rl = []; for (let v = 0; v <= .995; v += .005) { nw.push([X(v), Y(.5 * v * v)]); const k = 1 / Math.sqrt(1 - v * v) - 1; if (k <= yh) rl.push([X(v), Y(k)]); }
    s += poly(nw, 'var(--mute)', 2, 'stroke-dasharray="6 4"') + poly(rl, 'var(--field)', 3) + T(X(.55), Y(.5 * .3) + 4, 'Newton: ½mv²', 'style="font-size:12px;fill:var(--mute)"') + T(X(.62), Y(2.6), '(γ−1)mc²', 'style="font-size:12px;fill:var(--field);font-weight:600"');
    const k = 1 / Math.sqrt(1 - b * b) - 1; if (k <= yh) s += dot(X(b), Y(k), 7, 'var(--ray)', 'stroke="var(--panel)" stroke-width="3"');
    svg.innerHTML = s;
    dl($('ker'), [['γ', tr(1 / Math.sqrt(1 - b * b), 3)], ['(γ−1)', tr(k, 3)], ['½β²', tr(.5 * b * b, 3)], ['Oran', tr(k / Math.max(.5 * b * b, 1e-9), 2)]]);
  });
  sl.addEventListener('input', () => { $('kebo').textContent = tr(+sl.value); f(); }); $('kebo').textContent = tr(+sl.value);
}

/* ===== CH2 antisymmetric matrix ===== */
{
  const svg = $('matrix'), sl = $('d-dim');
  const f = fig(svg, (W, H) => {
    const D = +sl.value, sz = Math.min((W - 50) / D, (H - 70) / D), x0 = Math.max(34, (W - sz * D) / 2), y0 = 34;
    let s = '';
    for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) {
      const up = j > i, boost = i === 0 && j > 0, c = i === j ? 'var(--line)' : up ? (boost ? 'var(--ray)' : 'var(--field)') : (j === 0 && i > 0 ? 'var(--ray)' : 'var(--field)'), op = i === j ? 1 : up ? .85 : .18;
      s += `<rect x="${x0 + j * sz + .5}" y="${y0 + i * sz + .5}" width="${Math.max(1, sz - 1)}" height="${Math.max(1, sz - 1)}" fill="${c}" fill-opacity="${op}" rx="${sz > 12 ? 2 : 0}"/>`;
    }
    const every = sz > 16 ? 1 : sz > 8 ? 5 : 10;
    for (let k = 0; k < D; k++) if (k % every === 0) { s += T(x0 + k * sz + sz / 2, y0 - 6, k, 'text-anchor="middle" style="font-size:10px;fill:var(--mute)"') + T(x0 - 6, y0 + k * sz + sz / 2 + 4, k, 'text-anchor="end" style="font-size:10px;fill:var(--mute)"'); }
    s += T(x0 + sz * D / 2, y0 - 20, 'ν (sütun)', 'text-anchor="middle" style="font-size:11px;fill:var(--mute)"') + T(x0 - 22, y0 + sz * D / 2, 'μ', 'text-anchor="middle" style="font-size:11px;fill:var(--mute)"');
    s += `<rect x="${x0}" y="${y0 + sz * D + 8}" width="10" height="10" fill="var(--ray)"/>` + T(x0 + 14, y0 + sz * D + 17, 'boost (0 = zaman)', 'style="font-size:11px"') + `<rect x="${x0 + 130}" y="${y0 + sz * D + 8}" width="10" height="10" fill="var(--field)"/>` + T(x0 + 144, y0 + sz * D + 17, 'dönme', 'style="font-size:11px"') + T(x0 + 200, y0 + sz * D + 17, 'soluk: alt üçgen, bağımsız değil', 'style="font-size:11px;fill:var(--mute)"');
    svg.innerHTML = s;
  });
  sl.addEventListener('input', f);
}
}
