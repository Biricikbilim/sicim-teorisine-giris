{
/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const NF = (d) => new Intl.NumberFormat('tr-TR', {minimumFractionDigits: d, maximumFractionDigits: d});
const tr = (x, d = 2) => NF(d).format(x);
function sci(x, d = 2, svg = false) {
  if (!isFinite(x)) return '∞';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 4) return tr(x, e >= 2 ? 0 : (e >= 0 ? d : d + 1));
  let m = x / 10 ** e;
  if (Math.abs(m) >= 9.995) { m /= 10; return sci(m * 10 ** (e + 1), d, svg); }
  const ms = tr(m, Math.max(d - 1, 0));
  return svg ? `${ms}×10<tspan dy="-6" font-size="11">${e}</tspan><tspan dy="6"> </tspan>` : `${ms} × 10<sup>${e}</sup>`;
}
function eUnit(gev) { // energy in GeV -> readable
  const ev = gev * 1e9, u = [['EeV', 1e18], ['PeV', 1e15], ['TeV', 1e12], ['GeV', 1e9], ['MeV', 1e6], ['keV', 1e3], ['eV', 1], ['meV', 1e-3]];
  if (gev > 1e21 || gev < 1e-12) return sci(gev) + ' GeV';
  for (const [n, f] of u) if (ev >= f) return tr(ev / f, ev / f >= 100 ? 0 : (ev / f >= 10 ? 1 : 2)) + ' ' + n;
  return sci(gev) + ' GeV';
}
const probe = document.createElement('span'); probe.style.display = 'none'; document.body.appendChild(probe);
const col = v => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const redraws = [];
function fig(el, draw) {
  const f = () => { const W = el.clientWidth, H = el.clientHeight; if (W < 20 || H < 20) return; draw(W, H); };
  const ro = new ResizeObserver(f); ro.observe(el); redraws.push(f); return f;
}
const L = (x1, y1, x2, y2, st, w = 1, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st}" stroke-width="${w}" ${extra}/>`;
const T = (x, y, s, extra = '') => `<text x="${x}" y="${y}" ${extra}>${s}</text>`;
function seg(container, items, onpick, initial) {
  container.innerHTML = items.map((it, i) => `<button type="button" data-i="${i}" aria-pressed="${i === initial}">${it.label}</button>`).join('');
  container.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    container.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    onpick(items[+b.dataset.i]);
  });
}
const dl = (el, rows) => { el.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join(''); };
function canvasSize(c) {
  const r = c.getBoundingClientRect(), d = devicePixelRatio || 1;
  if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
  const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return [g, r.width, r.height];
}
function visibleLoop(el, step) { // run rAF only while visible
  let on = false, last = 0, id = 0;
  const tick = t => { const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; step(dt); if (on) id = requestAnimationFrame(tick); };
  new IntersectionObserver(es => { const v = es[0].isIntersecting; if (v && !on) { on = true; last = performance.now(); id = requestAnimationFrame(tick); } if (!v) { on = false; cancelAnimationFrame(id); } }).observe(el);
  return () => step(0);
}

/* ---------- Minkowski diagram component ---------- */
function minkowski(svg, o) {
  const R = 4; let cx = 0, cy = 0, sc = 1, ev = o.ev, drag = false;
  const P = (t, x) => [cx + x * sc, cy - t * sc];
  const cid = 'clip-' + svg.id;
  function draw(W, H) {
    const pad = 18; sc = Math.min((W - 2 * pad) / (2 * R), (H - 2 * pad) / (2 * R)); cx = W / 2; cy = H / 2;
    const b = o.beta ? o.beta() : 0, g = 1 / Math.sqrt(1 - b * b);
    const [x0, y0] = P(R, -R), [x1, y1] = P(-R, R);
    let s = `<defs><clipPath id="${cid}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}"/></clipPath></defs><g clip-path="url(#${cid})">`;
    for (let k = -R; k <= R; k++) { const a = P(-R, k), c = P(R, k), d = P(k, -R), e = P(k, R); s += L(a[0], a[1], c[0], c[1], 'var(--line)') + L(d[0], d[1], e[0], e[1], 'var(--line)'); }
    // hyperbolas
    for (const a of [1, 2, 3]) for (const sp of [0, 1]) for (const sg of [1, -1]) {
      let pts = [];
      for (let u = -2.2; u <= 2.2; u += 0.05) { const ch = a * Math.cosh(u), sh = a * Math.sinh(u); const [t, x] = sp ? [sh, sg * ch] : [sg * ch, sh]; pts.push(P(t, x).map(v => v.toFixed(1)).join(',')); }
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--mute)" stroke-opacity=".35" stroke-width="1"/>`;
    }
    if (o.lc) { // light-cone grid: x^+ = const and x^- = const
      for (let k = -6; k <= 6; k++) { if (!k) continue;
        let a = P(R + 1, k - R - 1), e = P(-R - 1, k + R + 1); s += L(a[0], a[1], e[0], e[1], 'var(--field)', 1, 'stroke-opacity=".4"');
        a = P(R + 1, R + 1 - k); e = P(-R - 1, -R - 1 - k); s += L(a[0], a[1], e[0], e[1], 'var(--ray)', 1, 'stroke-opacity=".4"'); }
    }
    if (o.primed) {
      for (let k = -6; k <= 6; k++) {
        const A = (tp, xp) => P(g * (tp + b * xp), g * (xp + b * tp));
        let p = A(-8, k), q = A(8, k); s += L(p[0], p[1], q[0], q[1], 'var(--field)', 1, 'stroke-opacity=".18"');
        p = A(k, -8); q = A(k, 8); s += L(p[0], p[1], q[0], q[1], 'var(--field)', 1, 'stroke-opacity=".18"');
      }
    }
    // light lines
    let a = P(-R, -R), c = P(R, R); s += L(a[0], a[1], c[0], c[1], 'var(--ray)', 2);
    a = P(-R, R); c = P(R, -R); s += L(a[0], a[1], c[0], c[1], 'var(--ray)', 2);
    s += '</g>';
    // lab axes
    a = P(0, -R); c = P(0, R); s += L(a[0], a[1], c[0], c[1], 'var(--ink)', 1.4);
    a = P(-R, 0); c = P(R, 0); s += L(a[0], a[1], c[0], c[1], 'var(--ink)', 1.4);
    s += T(P(0, R)[0] - 18, P(0, R)[1] + 4, 'x', 'text-anchor="end"') + T(P(R, 0)[0] + 8, P(R, 0)[1] + 4, 'ct');
    if (o.primed) {
      const f = R / (g * Math.max(1, Math.abs(b) > 0 ? 1 : 1)) * 0.98;
      let p = P(-f * g, -f * g * b), q = P(f * g, f * g * b); s += L(p[0], p[1], q[0], q[1], 'var(--field)', 2.4);
      s += T(q[0] + 6, q[1] + 4, "ct′", 'fill="var(--field)" font-weight="700"');
      p = P(-f * g * b, -f * g); q = P(f * g * b, f * g); s += L(p[0], p[1], q[0], q[1], 'var(--field)', 2.4);
      s += T(q[0] - 4, q[1] - 8, "x′", 'fill="var(--field)" font-weight="700" text-anchor="end"');
      for (let k = 1; k <= 3; k++) { const m = P(k * g, k * g * b); s += `<circle cx="${m[0]}" cy="${m[1]}" r="3" fill="var(--field)"/>`; const n = P(k * g * b, k * g); s += `<circle cx="${n[0]}" cy="${n[1]}" r="3" fill="var(--field)"/>`; }
    }
    if (o.lc) {
      s += T(P(R * .9, R * .9)[0] - 6, P(R * .9, R * .9)[1] + 18, 'x⁺', 'fill="var(--field)" font-weight="700" text-anchor="end"');
      s += T(P(R * .9, -R * .9)[0] + 6, P(R * .9, -R * .9)[1] + 18, 'x⁻', 'fill="var(--ray)" font-weight="700"');
    }
    // ghost (active boost) for lc
    if (o.ghost && b !== 0) {
      const tp = g * (ev.t - b * ev.x), xp = g * (ev.x - b * ev.t);
      const G = P(tp, xp); s += `<circle cx="${G[0]}" cy="${G[1]}" r="6" fill="none" stroke="var(--field)" stroke-width="2" stroke-dasharray="3 3"/>`;
      const E = P(ev.t, ev.x); s += L(E[0], E[1], G[0], G[1], 'var(--field)', 1, 'stroke-dasharray="2 4"');
    }
    // event
    const E = P(ev.t, ev.x);
    s += L(E[0], E[1], E[0], P(0, 0)[1], 'var(--ray)', 1, 'stroke-dasharray="3 4" stroke-opacity=".7"') + L(E[0], E[1], P(0, 0)[0], E[1], 'var(--ray)', 1, 'stroke-dasharray="3 4" stroke-opacity=".7"');
    s += `<circle cx="${E[0]}" cy="${E[1]}" r="9" fill="var(--ray)" stroke="var(--panel)" stroke-width="3" style="cursor:grab"/>`;
    svg.innerHTML = s;
    if (o.read) o.read(ev, b, g);
  }
  const f = fig(svg, draw);
  const at = e => { const r = svg.getBoundingClientRect(); let x = (e.clientX - r.left - cx) / sc, t = (cy - (e.clientY - r.top)) / sc; x = Math.max(-R, Math.min(R, x)); t = Math.max(-R, Math.min(R, t)); ev.t = Math.round(t * 20) / 20; ev.x = Math.round(x * 20) / 20; f(); };
  svg.addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); at(e); });
  svg.addEventListener('pointermove', e => { if (drag) at(e); });
  svg.addEventListener('pointerup', () => { drag = false; });
  svg.addEventListener('pointercancel', () => { drag = false; });
  return f;
}
const kind = s2 => Math.abs(s2) < 0.02 ? ['null', 'yalnız ışık ulaşabilir'] : s2 > 0 ? ['timelike', 'bir sinyal ulaşabilir'] : ['spacelike', 'hiçbir sinyal ulaşamaz'];

/* home */
{
  const sl = $('b-home'), out = $('o-home');
  const f = minkowski($('mk-home'), {primed: true, ev: {t: 2.5, x: 1}, beta: () => +sl.value,
    read: (ev, b, g) => { const tp = g * (ev.t - b * ev.x), xp = g * (ev.x - b * ev.t), s2 = ev.t ** 2 - ev.x ** 2;
      dl($('r-home'), [['ct, x', `${tr(ev.t)} ; ${tr(ev.x)}`], ['ct′, x′', `${tr(tp)} ; ${tr(xp)}`], ['γ', tr(g, 3)], ['Δs² (iki çerçevede)', tr(s2)], ['Tür', kind(s2)[0]]]); }});
  sl.addEventListener('input', () => { out.textContent = tr(+sl.value); f(); });
}

/* ---------- CH1: unification tree ---------- */
{
  const svg = $('tree'), info = $('tree-info');
  // [id, column, y, long, mid, short, text, kind]  kind f = çerçeve
  const N = [
    ['yer', 0, .04, 'Yerde düşme', 'Yer', 'Yer', 'Taşların ve elmaların düşüşü. Galileo düşen cisimlerin kütleden bağımsız ivmelendiğini gösterdi.'],
    ['gok', 0, .16, 'Gök mekaniği', 'Gök', 'Gök', 'Gezegen ve Ay hareketleri. Kepler yörüngelerin elips olduğunu buldu.'],
    ['ele', 0, .31, 'Elektrik', 'Elektrik', 'Elek.', 'Yüklerin birbirini itmesi ve çekmesi. Coulomb 1785\'te kuvvetin uzaklığın karesiyle azaldığını ölçtü.'],
    ['man', 0, .43, 'Manyetizma', 'Manyetizma', 'Mıkn.', 'Mıknatıslar ve akımların manyetik etkisi (Ørsted, Ampère). Faraday değişen manyetik alanın akım ürettiğini gösterdi.'],
    ['isik', 0, .55, 'Işık', 'Işık', 'Işık', 'Optik. Maxwell\'e kadar elektrik ve manyetizmayla bağı bilinmiyordu.'],
    ['atom', 0, .69, 'Atomlar, ışınım', 'Atomlar', 'Atom', 'Kara cisim ışıması, fotoelektrik olay, atom spektrumları ve atomların kararlılığı. Klasik fizik bunları açıklayamadı.'],
    ['zay', 0, .83, 'Zayıf etkileşim', 'Zayıf', 'Zayıf', 'Beta bozunmasından sorumlu. Fermi\'nin 1930\'lardaki nokta etkileşim modeli yüksek enerjide çöküyordu.'],
    ['guc', 0, .96, 'Güçlü etkileşim', 'Güçlü', 'Güçlü', 'Kuarkları ve çekirdeği bir arada tutan etkileşim. String fikri ilk olarak onu anlamak için doğdu.'],
    ['new', 1, .10, 'Newton kütleçekimi', 'Newton', 'Newton', '1687. Elmayı düşüren kuvvetle Ay\'ı yörüngede tutan kuvvet aynı. Ay\'ın ivmesi, yerdeki ivmenin 60² = 3600\'de biri. Newton mekaniği de buradan geliyor.'],
    ['em', 1, .43, 'Elektromanyetizma', 'EM', 'EM', '1865. Maxwell yer değiştirme akımını ekledi; denklemler hızı c olan dalgalar verdi. Elektrik, manyetizma ve ışık aynı olgu.'],
    ['qm', 1, .69, 'Kuantum mekaniği', 'Kuantum mek.', 'KM', '1900–1927, Planck\'tan Heisenberg ve Schrödinger\'e. Belirli bir kuvvetin teorisi değil, bir çerçeve: Hangi kuvvet olursa olsun teorinin uyması gereken kurallar: durumlar, olasılık genlikleri, ħ. Kuvvetleri birleştirmiyor, ama atom olgularını açıklıyor.', 'f'],
    ['og', 2, .31, 'Özel görelilik', 'Özel gör.', 'ÖG', '1905. Maxwell denklemlerindeki ışık hızının bütün gözlemciler için aynı olmasından çıktı. Uzay ve zamanı birleştiriyor. O da bir çerçeve: Bütün teorilerin uyması gereken simetriyi (Lorentz simetrisi) koyuyor. Chapter 2\'nin konusu.', 'f'],
    ['qft', 3, .64, 'Kuantum alan teorisi', 'Kuantum alan t.', 'KAT', '1927–1949. Kuantum mekaniği ile özel göreliliğin birleşmesi. Parçacıklar alanların kuantumları; parçacık yaratılıp yok edilebiliyor. İlk örneği kuantum elektrodinamiği (QED): elektromanyetizmanın kuantum hali. Standart Model\'in dili bu.', 'f'],
    ['gr', 3, .10, 'Genel görelilik', 'Gen. gör.', 'GG', '1915. Newton kütleçekimi ile özel göreliliğin uyumlu hale getirilmesi: kütleçekim uzayzamanın eğriliği. Klasik bir teori, kuantum kurallarını kullanmıyor.'],
    ['ez', 4, .76, 'Elektrozayıf teori', 'Elektrozayıf', 'EZ', '1960\'lar. Glashow, Weinberg ve Salam: elektromanyetik ve zayıf etkileşim tek gauge yapısının parçaları, kuantum alan teorisi içinde. W ve Z 1983\'te bulundu.'],
    ['sm', 5, .90, 'Standart Model', 'Std. Model', 'SM', '1970\'ler. Üç etkileşim aynı dilde, kuantum alan teorisinde: su(3) ⊕ su(2) ⊕ u(1). Tek bir yapıdan türetilmiyor, kütleçekim yok.'],
    ['qg', 5, .32, 'Kuantum kütleçekim?', 'Kuantum kütl.?', '?', 'Açık soru. Genel göreliliği kuantum alan teorisinin kurallarıyla birleştirmek; belki bütün etkileşimleri tek yapıdan çıkarmak. Sıradan yöntemle (perturbatif KAT) olmuyor. String teorisi bir aday.']
  ];
  const E = [['yer', 'new'], ['gok', 'new'], ['ele', 'em'], ['man', 'em'], ['isik', 'em'], ['atom', 'qm'], ['new', 'gr'], ['em', 'og'], ['og', 'gr'], ['og', 'qft'], ['qm', 'qft'], ['em', 'qft'], ['qft', 'ez'], ['zay', 'ez'], ['ez', 'sm'], ['guc', 'sm'], ['gr', 'qg', 1], ['sm', 'qg', 1]];
  let sel = 'qft';
  const show = id => { const n = N.find(n => n[0] === id); info.innerHTML = `<h3>${n[3]}${n[7] ? ' <small style="color:var(--good);font-weight:600">· çerçeve</small>' : ''}</h3><p>${n[6]}</p>`; };
  const f = fig(svg, (W, H) => {
    const padx = 6, cw = (W - 2 * padx) / 6, fs = cw < 80 ? 11.5 : 13, ch = fs * .56, pos = {};
    N.forEach(n => { const lab = [n[3], n[4], n[5]].find(l => l.length * ch + 14 <= cw - 6) || n[5]; const w = Math.min(cw - 6, lab.length * ch + 14); pos[n[0]] = {x: padx + cw * n[2 * 0 + 1] + cw / 2, y: 18 + n[2] * (H - 36), w, lab}; });
    let s = '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--mute)"/></marker></defs>';
    E.forEach(([a, b, d]) => { const p = pos[a], q = pos[b]; if (Math.abs(p.x - q.x) < cw * .5) { s += `<path d="M${p.x},${p.y - 14} L${q.x},${q.y + 16}" fill="none" stroke="var(--ray)" stroke-width="1.3" stroke-dasharray="5 4" marker-end="url(#arr)"/>`; return; } s += `<path d="M${p.x + p.w / 2},${p.y} C${(p.x + q.x) / 2 + 8},${p.y} ${(p.x + q.x) / 2 - 8},${q.y} ${q.x - q.w / 2 - 2},${q.y}" fill="none" stroke="${d ? 'var(--ray)' : 'var(--mute)'}" stroke-opacity="${d ? 1 : .7}" stroke-width="1.3" ${d ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#arr)"/>`; });
    N.forEach(n => { const p = pos[n[0]], on = n[0] === sel, q = n[0] === 'qg', fr = n[7] === 'f', stc = q ? 'var(--ray)' : fr ? 'var(--good)' : 'var(--field)';
      s += `<g class="node" data-id="${n[0]}" tabindex="0" role="button" aria-label="${n[3]}" style="cursor:pointer"><rect x="${p.x - p.w / 2}" y="${p.y - 14}" width="${p.w}" height="28" rx="${fr ? 14 : 7}" fill="${on ? stc : 'var(--bg)'}" stroke="${stc}" stroke-width="1.6"/>` +
        T(p.x, p.y + 4.5, p.lab, `text-anchor="middle" style="stroke:none;fill:${on ? 'var(--panel)' : 'var(--ink)'};font-size:${fs}px;font-weight:${on ? 700 : 400}"`) + '</g>'; });
    const lg = W - padx - 4; s += `<rect x="${lg - 70}" y="${H - 22}" width="10" height="10" rx="5" fill="none" stroke="var(--good)" stroke-width="1.6"/>` + T(lg - 56, H - 13, 'çerçeve', 'style="font-size:11px;fill:var(--mute)"');
    svg.innerHTML = s;
  });
  const pick = e => { const g = e.target.closest('.node'); if (!g) return; sel = g.dataset.id; show(sel); f(); };
  svg.addEventListener('click', pick);
  svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
  show(sel);
}

/* ---------- CH1: EM wave ---------- */
{
  const c = $('wave'), sl = $('f-wave'), btn = $('dc-wave');
  let ph = 0, amp = 1, on = true;
  const band = lf => lf < 9 ? 'radyo' : lf < 11.5 ? 'mikrodalga' : lf < 14.6 ? 'kızılötesi' : lf < 14.9 ? 'görünür ışık' : lf < 16.5 ? 'morötesi' : 'X-ışını';
  const upd = () => { const lf = +sl.value, f = 10 ** lf, lam = 2.998e8 / f;
    $('o-wave').innerHTML = sci(f) + ' Hz';
    const ls = lam >= 1 ? tr(lam, lam >= 100 ? 0 : 2) + ' m' : lam >= 1e-3 ? tr(lam * 1e3, 1) + ' mm' : lam >= 1e-6 ? tr(lam * 1e6, 2) + ' μm' : tr(lam * 1e9, 1) + ' nm';
    dl($('r-wave'), [['Bölge', band(lf)], ['Dalga boyu λ', ls], ['f·λ', '2,998 × 10<sup>8</sup> m/s'], ['ω / k', 'c (her frekansta)']]); };
  const draw = dt => {
    const [g, W, H] = canvasSize(c); g.clearRect(0, 0, W, H);
    if (on) amp = Math.min(1, amp + dt * 2); else amp = Math.max(0, amp - dt * 1.2);
    if (!reduce) ph += dt * 3;
    const lf = +sl.value, cyc = 1.3 + (lf - 6) / 12 * 4.2, x0 = 30, x1 = W - 20, mid = H * .55, A = Math.min(H * .32, 90) * amp;
    g.strokeStyle = col('--mute'); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, mid); g.lineTo(x1, mid); g.stroke();
    const kx = cyc * 2 * Math.PI / (x1 - x0);
    const fe = col('--field'), fb = col('--ray');
    for (const [clr, isB] of [[fb, 1], [fe, 0]]) {
      g.strokeStyle = clr; g.lineWidth = 2.4; g.beginPath();
      for (let x = x0; x <= x1; x += 2) { const v = Math.sin(kx * (x - x0) - ph); const px = isB ? x - v * A * .45 : x, py = isB ? mid + v * A * .32 : mid - v * A; x === x0 ? g.moveTo(px, py) : g.lineTo(px, py); }
      g.stroke(); g.globalAlpha = .55; g.lineWidth = 1.2;
      for (let x = x0; x <= x1; x += 18) { const v = Math.sin(kx * (x - x0) - ph); g.beginPath(); g.moveTo(x, mid); g.lineTo(isB ? x - v * A * .45 : x, isB ? mid + v * A * .32 : mid - v * A); g.stroke(); }
      g.globalAlpha = 1;
    }
    g.font = '600 14px Inter,sans-serif'; g.fillStyle = fe; g.fillText('E', x0, 20); g.fillStyle = fb; g.fillText('B', x0 + 22, 20);
    g.fillStyle = col('--ink'); g.font = '14px Inter,sans-serif';
    if (amp < .05) { g.fillText('Terim yok: dalga denklemi çıkmaz, alanlar yayılamaz.', x0, H - 14); }
    else g.fillText('yayılma yönü →', x1 - 110, H - 14);
  };
  const go = visibleLoop(c, draw);
  sl.addEventListener('input', () => { upd(); if (reduce) go(); });
  btn.addEventListener('click', () => { on = !on; btn.setAttribute('aria-pressed', on); btn.textContent = on ? 'Yer değiştirme akımı açık' : 'Yer değiştirme akımı kaldırıldı'; if (reduce) { amp = on ? 1 : 0; go(); } });
  new ResizeObserver(() => draw(0)).observe(c);
  upd();
}

/* ---------- CH1: Planck scale ---------- */
{
  const svg = $('planck'), sl = $('e-planck'), EP = 1.22e19;
  const M = [['elektron', -3.29], ['proton', -0.03], ['Higgs', 2.1], ['LHC', 4.13], ['kozmik ışın', 11.5], ['GUT (tahmini)', 16], ['Planck', 19.09]];
  seg($('p-planck'), M.map(m => ({label: m[0], v: m[1]})), it => { sl.value = it.v; upd(); }, 3);
  const lo = -4, hi = 20;
  const f = fig(svg, (W, H) => {
    const pl = 20, pr = 20, X = v => pl + (v - lo) / (hi - lo) * (W - pl - pr), y = H * .62, cur = +sl.value;
    let s = `<defs><linearGradient id="gq" x1="0" x2="1"><stop offset="0" stop-color="var(--field)" stop-opacity=".08"/><stop offset="1" stop-color="var(--ray)" stop-opacity=".55"/></linearGradient></defs>`;
    s += `<rect x="${pl}" y="${y - 12}" width="${W - pl - pr}" height="24" rx="12" fill="url(#gq)"/>`;
    const step = W < 520 ? 8 : 4;
    for (let v = lo; v <= hi; v += step) s += L(X(v), y + 12, X(v), y + 18, 'var(--mute)') + T(X(v), y + 34, `10<tspan dy="-6" font-size="11">${v}</tspan>`, 'text-anchor="middle" style="font-size:12px"');
    s += T(W - pr, y + 54, 'enerji (GeV)', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"');
    const lastX = [-1e9, -1e9, -1e9];
    M.forEach(([n, v]) => { const x = X(v), wd = n.length * 6.6 + 10; let row = lastX.findIndex(lx => x - wd / 2 > lx + 6); if (row < 0) row = 2; lastX[row] = x + wd / 2; const ly = y - 26 - row * 20;
      s += L(x, y - 12, x, ly + 4, 'var(--mute)', 1) + T(x, ly, n, `text-anchor="${x < 60 ? 'start' : x > W - 60 ? 'end' : 'middle'}" style="font-size:12px"`); });
    const x = X(cur); s += L(x, y - 20, x, y + 20, 'var(--ray)', 3) + `<circle cx="${x}" cy="${y}" r="8" fill="var(--ray)" stroke="var(--panel)" stroke-width="3"/>`;
    svg.innerHTML = s;
  });
  function upd() { const v = +sl.value, E = 10 ** v, g = (E / EP) ** 2;
    $('o-planck').textContent = eUnit(E);
    $('g-planck').innerHTML = 'g<sub>eff</sub> ≈ ' + sci(g);
    const vd = $('v-planck');
    if (g < 1e-6) { vd.className = 'verdict good'; vd.textContent = 'Kütleçekimin kuantum etkileri ihmal edilebilir; perturbasyon açılımı çok iyi çalışıyor.'; }
    else if (g < 0.1) { vd.className = 'verdict'; vd.textContent = 'Küçük ama artık önemsiz değil; yüksek mertebeler hızla büyüyor.'; }
    else { vd.className = 'verdict bad'; vd.textContent = 'Bütün mertebeler aynı büyüklükte: açılım çöküyor, tam bir kuantum kütleçekim teorisi gerekli.'; }
    f(); }
  sl.addEventListener('input', upd); upd();
}

/* ---------- CH1: worldline / worldsheet ---------- */
{
  const c = $('ws'); let mode = 2, inter = false, tau = 0;
  const infos = [
    ['Nokta parçacık uzayzamanda bir çizgi çizer: worldline. Eylemi bu çizginin göreli uzunluğuyla orantılı.', 'Etkileşim tek bir noktada (kırmızı) oluyor. Kuantum alan teorisindeki sonsuzlukların çoğu bu sıfır mesafeli tepelerden geliyor.'],
    ['Açık string bir şerit tarar. Uçları serbest ya da bir D-brane üzerinde. Titreşimleri foton benzeri durumlar verir.', 'İki açık string uçlarından birleşip tek string olur. Birleşme anı gözlemciden gözlemciye değişiyor; ayrıcalıklı bir nokta yok.'],
    ['Kapalı string bir tüp tarar: worldsheet. Üzerindeki noktalar (τ, σ) ile etiketlenir, uzayzamandaki yeri X<sup>μ</sup>(τ, σ). Spektrumunda graviton var.', 'İki kapalı string birleşince pantolon biçiminde düzgün bir yüzey oluşur. Üzerinde “etkileşim burada oldu” denecek bir nokta yok.']
  ];
  const showInfo = () => { $('ws-info').innerHTML = infos[mode][inter ? 1 : 0]; };
  $('ws-mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mode = +b.dataset.m; $('ws-mode').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); showInfo(); draw(0); });
  $('ws-int').addEventListener('click', () => { inter = !inter; $('ws-int').setAttribute('aria-pressed', inter); showInfo(); draw(0); });
  function draw(dt) {
    const [g, W, H] = canvasSize(c); g.clearRect(0, 0, W, H);
    if (!reduce) tau = (tau + dt * 0.18) % 1; else tau = .6;
    const k = Math.min(W / 7, 70), base = H - 34, top = 26, cx = W / 2;
    const S = (x, y, t) => [cx + x * k + y * k * .5, base - t * (base - top) - y * k * .28];
    const fc = col('--field'), rc = col('--ray'), ink = col('--ink'), mu = col('--mute');
    // axes
    g.strokeStyle = mu; g.lineWidth = 1; g.beginPath(); g.moveTo(16, base + 14); g.lineTo(16, top); g.stroke(); g.fillStyle = mu; g.font = '13px Inter,sans-serif'; g.fillText('zaman', 22, top + 6);
    const drift = t => .5 * Math.sin(t * 2.4);
    const slices = []; const n = 34;
    // shape description per t: list of components {kind, cx, r}
    const comps = t => {
      if (!inter) return [{x: drift(t), r: 1}];
      const tm = .5; if (t < tm) { const d = 1.6 * (1 - (t / tm) ** 2.2); return [{x: -d - .1 * (1 - t / tm), r: .8}, {x: d + .1 * (1 - t / tm), r: .8}]; }
      return [{x: 0, r: .8 + .5 * Math.min(1, (t - tm) / .25)}];
    };
    const ring = (x, r, t, a0 = 0, a1 = 2 * Math.PI) => { const pts = []; for (let a = a0; a <= a1 + 1e-6; a += Math.PI / 24) pts.push(S(x + r * Math.cos(a), r * Math.sin(a), t)); return pts; };
    const poly = (pts, close) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
    for (let i = 0; i <= n; i++) {
      const t = i / n, past = t <= tau;
      g.globalAlpha = past ? .55 : .14; g.strokeStyle = fc; g.lineWidth = 1.1;
      comps(t).forEach(cp => {
        if (mode === 0) { const p = S(cp.x, 0, t); g.fillStyle = fc; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, 7); g.fill(); }
        else if (mode === 1) { const pts = []; for (let s = -1; s <= 1.0001; s += .1) pts.push(S(cp.x + s * cp.r, .35 * cp.r * Math.sin(Math.PI * (s + 1) / 2) * Math.cos(8 * t), t)); poly(pts); g.stroke(); }
        else { poly(ring(cp.x, cp.r, t), true); g.stroke(); }
      });
    }
    g.globalAlpha = 1;
    // current slice
    const cs = comps(tau); g.strokeStyle = rc; g.fillStyle = rc; g.lineWidth = 3;
    cs.forEach(cp => {
      if (mode === 0) { const p = S(cp.x, 0, tau); g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.fill(); }
      else if (mode === 1) { const pts = []; for (let s = -1; s <= 1.0001; s += .05) pts.push(S(cp.x + s * cp.r, .35 * cp.r * Math.sin(Math.PI * (s + 1) / 2) * Math.cos(8 * tau), tau)); poly(pts); g.stroke(); [pts[0], pts[pts.length - 1]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fill(); }); }
      else { poly(ring(cp.x, cp.r, tau), true); g.stroke(); }
    });
    if (inter && mode === 0) { const p = S(0, 0, .5); g.fillStyle = rc; g.globalAlpha = .9; g.beginPath(); g.arc(p[0], p[1], 5, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = ink; g.fillText('etkileşim noktası', p[0] + 10, p[1] + 4); }
    g.fillStyle = ink; g.font = '13px Inter,sans-serif'; g.fillText('τ = ' + tr(tau, 2), W - 70, top + 6);
  }
  visibleLoop(c, draw); new ResizeObserver(() => draw(0)).observe(c); showInfo();
}

/* ---------- CH1: Kaluza-Klein ---------- */
{
  const svg = $('kk'), sl = $('r-kk'), HC = 1.97327e-16; // GeV*m
  const lo = -1, hi = 20, LHC = 1.36e4, EP = 1.22e19;
  const f = fig(svg, (W, H) => {
    const pl = 16, pr = 16, X = v => pl + (Math.log10(v) - lo) / (hi - lo) * (W - pl - pr), y = H - 52, R = 10 ** +sl.value, E1 = HC / R;
    let s = `<rect x="${pl}" y="16" width="${X(LHC) - pl}" height="${y - 16}" fill="var(--field)" fill-opacity=".08"/>` + T(pl + 6, 34, 'LHC erişimi', 'style="font-size:12px;fill:var(--field)"');
    s += L(X(EP), 16, X(EP), y, 'var(--ray)', 1.5, 'stroke-dasharray="4 4"') + T(X(EP) - 6, 34, 'Planck', 'text-anchor="end" style="font-size:12px;fill:var(--ray)"');
    s += L(pl, y, W - pr, y, 'var(--ink)', 1.2);
    const step = W < 520 ? 5 : 3;
    for (let v = 0; v <= hi; v += step) s += L(X(10 ** v), y, X(10 ** v), y + 6, 'var(--ink)') + T(X(10 ** v), y + 22, `10<tspan dy="-6" font-size="11">${v}</tspan>`, 'text-anchor="middle" style="font-size:12px"');
    s += T(W - pr, y + 42, 'enerji (GeV)', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"');
    s += L(X(1e-1), y - 70, X(1e-1), y, 'var(--field)', 3) + T(X(1e-1) + 6, y - 58, 'n = 0', 'style="font-size:12px;fill:var(--field)"');
    for (let n = 1; n <= 6; n++) { const E = n * E1; if (Math.log10(E) > hi) break; const h = 110 - n * 12; s += L(X(E), y - h, X(E), y, 'var(--ray)', 3); if (n === 1) s += T(X(E), y - h - 6, 'n = 1', `text-anchor="${X(E) > W - 50 ? 'end' : 'middle'}" style="font-size:12px"`); }
    svg.innerHTML = s;
  });
  function upd() { const R = 10 ** +sl.value, E1 = HC / R; $('o-kk').innerHTML = sci(R) + ' m'; $('e-kk').innerHTML = 'E<sub>1</sub> ≈ ' + eUnit(E1);
    const v = $('v-kk');
    if (E1 < LHC) { v.className = 'verdict'; v.textContent = 'İlk kopya LHC enerjilerinin altında. Basit modellerde bu kadar büyük boyutlar aramalarda görülmedi.'; }
    else if (E1 < 1e17) { v.className = 'verdict'; v.textContent = 'LHC\'nin ötesinde ama Planck ölçeğinin çok altında: doğrudan üretilemez, dolaylı izler aranabilir.'; }
    else { v.className = 'verdict bad'; v.textContent = 'Planck ölçeğine yakın: ħc/ℓP = EP. Böyle bir boyutun kopyalarına hiçbir çarpıştırıcı erişemez.'; }
    f(); }
  sl.addEventListener('input', upd); upd();
}

/* ---------- CH1: duality web ---------- */
{
  const svg = $('web'), info = $('web-info');
  const D = {
    M: ['M-theory', 'On bir boyut. Tam tanımı yok; düşük enerji sınırı 11 boyutlu supergravity. Temel nesneleri M2 ve M5 brane\'ler.', ['IIA: çember üzerinde, R₁₁ = g<sub>s</sub>ℓ<sub>s</sub>', 'Het E₈×E₈: bir aralık üzerinde']],
    IIA: ['Type IIA', 'Kapalı string, 𝒩 = 2 (32 supercharge), nonchiral.', ['IIB: T-duality (çember)', 'M-theory: güçlü bağlaşımda 11. boyut açılır']],
    IIB: ['Type IIB', 'Kapalı string, 𝒩 = 2, chiral. Kendisiyle S-dual: g<sub>s</sub> → 1/g<sub>s</sub>.', ['IIA: T-duality', 'Kendisi: S-duality']],
    I: ['Type I', 'Açık ve kapalı string, unoriented, 𝒩 = 1, gauge cebiri so(32).', ['Het SO(32): S-duality, g<sub>I</sub> ∝ 1/g<sub>H</sub>']],
    HO: ['Heterotic SO(32)', 'Yalnız kapalı string, 𝒩 = 1. Gauge yapısı kapalı string\'in kendisinden geliyor.', ['Type I: S-duality', 'Het E₈×E₈: T-duality']],
    HE: ['Heterotic E₈×E₈', 'Yalnız kapalı string, 𝒩 = 1. Gerçekçi parçacık fiziği modellerinin ilk adresi.', ['Het SO(32): T-duality', 'M-theory: güçlü bağlaşımda, aralık üzerinde']]
  };
  const ED = [['IIA', 'IIB', 'T'], ['HO', 'HE', 'T'], ['I', 'HO', 'S'], ['M', 'IIA', 'M'], ['M', 'HE', 'M'], ['IIB', 'IIB', 'S']];
  let sel = 'M';
  const show = id => { const d = D[id]; info.innerHTML = `<h3>${d[0]}</h3><p>${d[1]}</p><p><b>Bağlantılar</b></p><ul style="margin:0;padding-left:18px">${d[2].map(x => `<li>${x}</li>`).join('')}</ul>`; };
  const f = fig(svg, (W, H) => {
    const cx = W / 2, cy = H / 2 + 4, r = Math.min(W * .32, H * .38), ang = {IIA: -90, IIB: -18, I: 54, HO: 126, HE: 198};
    const P = id => id === 'M' ? [cx, cy] : [cx + r * Math.cos(ang[id] * Math.PI / 180), cy + r * Math.sin(ang[id] * Math.PI / 180)];
    let s = '';
    ED.forEach(([a, b, t]) => { const on = a === sel || b === sel, clr = t === 'M' ? 'var(--ray)' : 'var(--field)', [x1, y1] = P(a), [x2, y2] = P(b);
      if (a === b) { s += `<path d="M${x1 - 12},${y1 + 16} c-14,34 38,34 24,0" fill="none" stroke="${clr}" stroke-width="${on ? 3 : 1.5}" stroke-opacity="${on ? 1 : .5}"/>` + T(x1, y1 + 56, 'S', 'text-anchor="middle" style="font-size:13px;font-weight:700"'); return; }
      s += L(x1, y1, x2, y2, clr, on ? 3 : 1.5, `stroke-opacity="${on ? 1 : .5}"`);
      if (t !== 'M') s += T((x1 + x2) / 2 + 8, (y1 + y2) / 2 - 6, t, 'style="font-size:13px;font-weight:700"'); });
    Object.keys(D).forEach(id => { const [x, y] = P(id), on = id === sel, lab = {M: 'M-theory', IIA: 'IIA', IIB: 'IIB', I: 'Type I', HO: 'Het SO(32)', HE: 'Het E₈×E₈'}[id], w = id === 'M' ? 86 : Math.max(56, lab.length * 7.6 + 16);
      s += `<g class="nd" data-id="${id}" tabindex="0" role="button" aria-label="${D[id][0]}" style="cursor:pointer"><rect x="${x - w / 2}" y="${y - 17}" width="${w}" height="34" rx="${id === 'M' ? 17 : 8}" fill="${on ? (id === 'M' ? 'var(--ray)' : 'var(--field)') : 'var(--bg)'}" stroke="${id === 'M' ? 'var(--ray)' : 'var(--field)'}" stroke-width="1.6"/>` + T(x, y + 5, lab, `text-anchor="middle" style="stroke:none;font-weight:600;fill:${on ? 'var(--fieldink)' : 'var(--ink)'}"`) + '</g>'; });
    svg.innerHTML = s;
  });
  const pick = e => { const g = e.target.closest('.nd'); if (!g) return; sel = g.dataset.id; show(sel); f(); };
  svg.addEventListener('click', pick); svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } });
  show(sel);
}

/* ---------- CH1: D-branes ---------- */
{
  const svg = $('brane'), sl = $('d-brane');
  const f = fig(svg, (W, H) => {
    const d = +sl.value, unit = Math.min(W * .14, 70), mid = W / 2, x1 = mid - d * unit / 2, x2 = mid + d * unit / 2, top = 24, bot = H - 24, sk = 26;
    const plane = (x, c) => `<path d="M${x - sk},${top + 14} L${x + sk},${top - 4} L${x + sk},${bot - 18} L${x - sk},${bot} Z" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="2"/>`;
    let s = plane(x1, 'var(--field)') + plane(x2, 'var(--field)');
    const yS = H * .45;
    if (d > 0.02) { let p = ''; const n = 60; for (let i = 0; i <= n; i++) { const t = i / n, x = x1 + (x2 - x1) * t, y = yS + Math.sin(t * Math.PI * Math.max(2, Math.round(d * 3))) * 5; p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); } s += `<path d="${p}" fill="none" stroke="var(--ray)" stroke-width="3"/>`; }
    s += `<circle cx="${x1}" cy="${yS}" r="5" fill="var(--ray)"/><circle cx="${x2}" cy="${yS}" r="5" fill="var(--ray)"/>`;
    const yo = H * .74; s += `<path d="M${x1 + 2},${yo} C${x1 + 70},${yo - 34} ${x1 + 70},${yo + 34} ${x1 + 2},${yo + 12}" fill="none" stroke="var(--field)" stroke-width="2.4"/><circle cx="${x1 + 2}" cy="${yo}" r="4" fill="var(--field)"/><circle cx="${x1 + 2}" cy="${yo + 12}" r="4" fill="var(--field)"/>`;
    s += T(x1 - sk - 4, top + 4, 'brane 1', 'text-anchor="end" style="font-size:12px"') + T(x2 + sk + 4, top + 4, 'brane 2', 'style="font-size:12px"');
    if (d > .5) s += L(x1, bot + 10, x2, bot + 10, 'var(--mute)', 1) + T(mid, bot + 4, 'd', 'text-anchor="middle" style="font-size:13px"');
    svg.innerHTML = s;
  });
  function upd() { const d = +sl.value; $('o-brane').innerHTML = tr(d) + ' √α′'; $('m-brane').innerHTML = 'm ≈ ' + tr(d / (2 * Math.PI), 3) + ' / √α′';
    const v = $('v-brane');
    if (d < 0.02) { v.className = 'verdict good'; v.innerHTML = 'Brane\'ler üst üste: aradaki string kütlesiz. İki ayrı u(1) yerine u(2): gauge simetrisi büyüdü.'; }
    else { v.className = 'verdict'; v.innerHTML = 'İki ayrı brane, simetri u(1) ⊕ u(1). Aradaki string kütleli bir gauge bozonu gibi; kütlesi uzaklıkla orantılı. Mavi string iki ucu aynı brane\'de: kütlesiz.'; }
    f(); }
  sl.addEventListener('input', upd); upd();
}

/* ---------- CH1: black hole ---------- */
{
  const svg = $('bh'), sl = $('m-bh');
  const P = [['ilkel, 10¹² kg', Math.log10(1e12 / 1.989e30)], ['Dünya kütlesi', Math.log10(3.0e-6)], ['Güneş', 0], ['Sgr A*', Math.log10(4.3e6)], ['M87*', Math.log10(6.5e9)]];
  seg($('p-bh'), P.map(p => ({label: p[0], v: p[1]})), it => { sl.value = it.v; upd(); }, 2);
  const REF = [['proton', 8.4e-16], ['atom çekirdeği', 1e-14], ['atom', 1e-10], ['virüs', 1e-7], ['kum tanesi', 5e-4], ['bir oda', 4], ['gökdelen', 300], ['küçük bir kasaba', 3e3], ['büyük bir şehir', 3e4], ['Ay', 1.74e6], ['Dünya', 6.37e6], ['Jüpiter', 7e7], ['Güneş', 6.96e8], ['Dünya–Güneş uzaklığı', 1.5e11], ['Neptün yörüngesi', 4.5e12]];
  const lenS = m => m < 1e-12 ? sci(m) + ' m' : m < 1e-3 ? sci(m * 1e3) + ' mm' : m < 1e3 ? tr(m, m < 10 ? 2 : 0) + ' m' : m < 1e9 ? NF(0).format(m / 1e3) + ' km' : sci(m / 1e3) + ' km';
  const f = fig(svg, (W, H) => {
    const M = 10 ** +sl.value, rs = 2953 * M, lr = Math.log10(rs), rmax = Math.min(H / 2 - 16, W / 3), rad = 6 + (lr + 16) / 29.5 * (rmax - 6), cx = W * .36, cy = H / 2;
    let ref = REF[0]; REF.forEach(r => { if (Math.abs(Math.log10(r[1]) - lr) < Math.abs(Math.log10(ref[1]) - lr)) ref = r; });
    let s = `<defs><radialGradient id="glow"><stop offset=".55" stop-color="var(--ray)" stop-opacity=".0"/><stop offset=".8" stop-color="var(--ray)" stop-opacity=".35"/><stop offset="1" stop-color="var(--ray)" stop-opacity="0"/></radialGradient></defs>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${rad * 1.5}" fill="url(#glow)"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="#05050b" stroke="var(--ray)" stroke-width="2"/>`;
    const side = cx + rad * 1.5 + 14 < W - 170, tx = side ? cx + rad * 1.5 + 14 : 12, ty = side ? cy - 8 : 22;
    s += T(tx, ty, 'ufuk yarıçapı ' + lenS(rs), 'style="font-weight:600"') + T(tx, ty + 20, '≈ ' + ref[0] + ' ölçeğinde', 'style="fill:var(--mute)"');
    svg.innerHTML = s;
  });
  function upd() { const M = 10 ** +sl.value, kg = M * 1.989e30, rs = 2953 * M, A = 4 * Math.PI * rs * rs, S = 1.049e77 * M * M, TH = 6.17e-8 / M, life = 2.1e67 * M ** 3;
    $('o-bh').innerHTML = (M >= 1e-3 ? sci(M) + ' M<sub>☉</sub>' : sci(kg) + ' kg');
    dl($('r-bh'), [['r<sub>s</sub>', lenS(rs)], ['A', sci(A) + ' m²'], ['S / k<sub>B</sub>', sci(S)], ['T<sub>H</sub>', sci(TH) + ' K'], ['Buharlaşma (kaba)', sci(life) + ' yıl']]);
    const v = $('v-bh');
    if (TH > 2.725) { v.className = 'verdict bad'; v.textContent = 'Hawking sıcaklığı kozmik arka plandan (2,7 K) yüksek: net ışıyor ve buharlaşıyor.'; }
    else { v.className = 'verdict'; v.textContent = 'Kozmik arka plandan (2,7 K) soğuk: yaydığından fazlasını soğuruyor. Hawking ışıması pratikte ölçülemez.'; }
    f(); }
  sl.addEventListener('input', upd); upd();
}

/* ---------- CH1: regime map ---------- */
{
  const svg = $('reg'), info = $('reg-info'); let pt = {a: -2, g: -2}, drag = false, geo = {};
  const txt = (a, g) => {
    if (a < 0 && g < 0) return ['Klasik supergravity', 'İki parametre de küçük: string\'ler nokta gibi, loop\'lar ihmal edilebilir. Einstein denklemleri ve küçük düzeltmeleri güvenilir. AdS/CFT\'nin kütleçekim tarafında çoğu hesap burada yapılıyor.'];
    if (a >= 0 && g < 0) return ['Tree-level tam string teorisi', 'Loop\'lar küçük ama geometri string ölçeğinde kıvrılmış: string\'in sonlu boyu hesaba girmeli. Worldsheet üzerindeki tam iki boyutlu teori gerekiyor.'];
    if (a < 0 && g >= 0) return ['Loop\'lar önemli', 'Geometri büyük ama bağlaşım güçlü: kuantum düzeltmeleri baskın. Çoğu zaman bir duality ile başka bir teorinin zayıf bağlaşımına geçilir; Type IIA\'da on birinci boyut açılır.'];
    return ['Tam teori gerekli', 'İki açılım da çalışmıyor. Burada güvenilir hesap için duality\'ler ya da perturbatif olmayan tanımlar gerekiyor.'];
  };
  const f = fig(svg, (W, H) => {
    const pl = 56, pb = 44, pr = 14, pt0 = 14, w = W - pl - pr, h = H - pt0 - pb, X = a => pl + (a + 3) / 4 * w, Y = g => pt0 + (1 - (g + 3) / 4) * h;
    geo = {pl, pb, pr, pt0, w, h};
    let s = '';
    const q = [[-3, -3, 0, 0, 'var(--field)', .16], [0, -3, 1, 0, 'var(--field)', .06], [-3, 0, 0, 1, 'var(--ray)', .08], [0, 0, 1, 1, 'var(--ray)', .18]];
    q.forEach(([a0, g0, a1, g1, c, o]) => { s += `<rect x="${X(a0)}" y="${Y(g1)}" width="${X(a1) - X(a0)}" height="${Y(g0) - Y(g1)}" fill="${c}" fill-opacity="${o}"/>`; });
    s += L(X(0), Y(1), X(0), Y(-3), 'var(--mute)', 1, 'stroke-dasharray="4 4"') + L(X(-3), Y(0), X(1), Y(0), 'var(--mute)', 1, 'stroke-dasharray="4 4"');
    s += L(pl, Y(-3), W - pr, Y(-3), 'var(--ink)') + L(pl, Y(-3), pl, pt0, 'var(--ink)');
    [-3, -2, -1, 0, 1].forEach(v => { s += T(X(v), Y(-3) + 18, `10<tspan dy="-6" font-size="11">${v}</tspan>`, 'text-anchor="middle" style="font-size:12px"') + T(pl - 6, Y(v) + 4, `10<tspan dy="-6" font-size="11">${v}</tspan>`, 'text-anchor="end" style="font-size:12px"'); });
    s += T(W - pr, H - 6, 'α′/L² (string boyu)', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"') + T(pl + 6, pt0 + 14, 'g_s (loop)', 'style="font-size:12px;fill:var(--mute)"');
    if (W > 520) { s += T(X(-1.5), Y(-1.6), 'supergravity', 'text-anchor="middle" style="font-size:13px;fill:var(--field);font-weight:600"') + T(X(.5), Y(-1.6), 'tam string', 'text-anchor="middle" style="font-size:13px;fill:var(--field)"') + T(X(-1.5), Y(.5), 'loop\'lar', 'text-anchor="middle" style="font-size:13px;fill:var(--ray)"') + T(X(.5), Y(.5), 'tam teori', 'text-anchor="middle" style="font-size:13px;fill:var(--ray);font-weight:600"'); }
    s += `<circle cx="${X(pt.a)}" cy="${Y(pt.g)}" r="9" fill="var(--ray)" stroke="var(--panel)" stroke-width="3" style="cursor:grab"/>`;
    svg.innerHTML = s;
    const [h1, p1] = txt(pt.a, pt.g); info.innerHTML = `<h3>${h1}</h3><p>α′/L² ≈ ${sci(10 ** pt.a)}, g<sub>s</sub> ≈ ${sci(10 ** pt.g)}</p><p>${p1}</p>`;
  });
  const at = e => { const r = svg.getBoundingClientRect(), {pl, pt0, w, h} = geo; pt.a = Math.max(-3, Math.min(1, (e.clientX - r.left - pl) / w * 4 - 3)); pt.g = Math.max(-3, Math.min(1, (1 - (e.clientY - r.top - pt0) / h) * 4 - 3)); f(); };
  svg.addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); at(e); });
  svg.addEventListener('pointermove', e => { if (drag) at(e); });
  svg.addEventListener('pointerup', () => drag = false);
}

/* ---------- CH2: units ---------- */
{
  const val = $('u-val'), unit = $('u-unit');
  const HC = 1.97327e-16, HB = 6.58212e-25, KG = 1.78266e-27, KK = 1.16045e13;
  const P = [['elektron', 0.511, 'MeV'], ['proton', 938.27, 'MeV'], ['Higgs', 125.1, 'GeV'], ['oda sıcaklığı', 293, 'K'], ['Planck', 1.22e19, 'GeV']];
  seg($('p-unit'), P.map(p => ({label: p[0], p})), it => { val.value = it.p[1]; unit.value = it.p[2]; upd(); }, 0);
  function upd() { const v = parseFloat(String(val.value).replace(',', '.')); const u = unit.value;
    if (!(v > 0)) { $('r-unit').innerHTML = '<div class="stat"><b>—</b><span>Pozitif bir değer girin</span></div>'; return; }
    const E = {eV: v * 1e-9, MeV: v * 1e-3, GeV: v, fm: HC / (v * 1e-15), m: HC / v, s: HB / v, kg: v / KG, K: v / KK}[u];
    const Lm = HC / E, ts = HB / E;
    const st = [['Enerji', eUnit(E)], ['Kütle', sci(E * KG) + ' kg'], ['Uzunluk ħc/E', Lm < 1e-12 ? sci(Lm * 1e15) + ' fm' : sci(Lm) + ' m'], ['Zaman ħ/E', sci(ts) + ' s'], ['Sıcaklık E/k<sub>B</sub>', sci(E * KK) + ' K'], ['Planck enerjisine oranı', sci(E / 1.22e19)]];
    $('r-unit').innerHTML = st.map(([k, x]) => `<div class="stat"><b>${x}</b><span>${k}</span></div>`).join(''); }
  val.addEventListener('input', upd); unit.addEventListener('change', upd); upd();
}

/* ---------- CH2: interval, Lorentz, light-cone ---------- */
minkowski($('mk-int'), {primed: false, ev: {t: 2.6, x: 1}, read: ev => {
  const s2 = ev.t ** 2 - ev.x ** 2, [k, m] = kind(s2), rows = [['cΔt', tr(ev.t)], ['Δx', tr(ev.x)], ['Δs²', tr(s2)], ['Tür', k]];
  if (k === 'timelike') rows.push(['Proper time cΔt<sub>p</sub>', tr(Math.sqrt(s2))]);
  if (k === 'spacelike') rows.push(['Proper uzaklık', tr(Math.sqrt(-s2))]);
  dl($('r-int'), rows);
  const v = $('v-int');
  if (k === 'timelike') { const b = ev.x / ev.t; v.className = 'verdict good'; v.innerHTML = `Bir sinyal ulaşabilir. İki olayı <b>aynı yerde</b> gören gözlemci: β = ${tr(b)}.`; }
  else if (k === 'spacelike') { const b = ev.t / ev.x; v.className = 'verdict bad'; v.innerHTML = `Hiçbir sinyal ulaşamaz. İki olayı <b>eşzamanlı</b> gören gözlemci: β = ${tr(b)}. Sıra gözlemciye bağlı.`; }
  else { v.className = 'verdict'; v.textContent = 'Işık konisinin üzerinde: yalnız ışık ulaşabilir.'; } }});
{
  const sl = $('b-lor');
  const f = minkowski($('mk-lor'), {primed: true, ev: {t: 2.6, x: 1}, beta: () => +sl.value, read: (ev, b, g) => {
    const tp = g * (ev.t - b * ev.x), xp = g * (ev.x - b * ev.t);
    dl($('r-lor'), [['γ', tr(g, 3)], ['φ = artanh β', tr(Math.atanh(b), 3)], ['ct, x', `${tr(ev.t)} ; ${tr(ev.x)}`], ['ct′, x′', `${tr(tp)} ; ${tr(xp)}`], ['Δs² (S)', tr(ev.t ** 2 - ev.x ** 2)], ['Δs² (S′)', tr(tp ** 2 - xp ** 2)]]); }});
  sl.addEventListener('input', () => { $('o-lor').textContent = tr(+sl.value); f(); });
}
{
  const sl = $('b-lc');
  const f = minkowski($('mk-lc'), {primed: false, lc: true, ghost: true, ev: {t: 2, x: 1}, beta: () => +sl.value, read: (ev, b) => {
    const ph = Math.atanh(b), xp = (ev.t + ev.x) / Math.SQRT2, xm = (ev.t - ev.x) / Math.SQRT2;
    dl($('r-lc'), [['φ', tr(ph, 3)], ['x⁺', tr(xp)], ['x⁻', tr(xm)], ['x′⁺ = e<sup>−φ</sup>x⁺', tr(Math.exp(-ph) * xp)], ['x′⁻ = e<sup>φ</sup>x⁻', tr(Math.exp(ph) * xm)], ['−2x⁺x⁻ (sabit)', tr(-2 * xp * xm)]]); }});
  sl.addEventListener('input', () => { $('o-lc').textContent = tr(+sl.value); f(); }); $('o-lc').textContent = tr(+sl.value);
  const us = $('u-lc');
  const uu = () => { const u = 10 ** +us.value, b = (1 - u) / (1 + u); $('ou-lc').textContent = tr(u, u < 1 ? 3 : 2); $('bu-lc').innerHTML = 'β = ' + tr(b, 3);
    const v = $('vu-lc'); v.className = 'verdict good';
    v.textContent = Math.abs(u - 1) < 0.01 ? 'Parçacık duruyor.' : u > 1 ? `Parçacık ışık hızının %${tr(-b * 100, 0)}'siyle sola gidiyor. Işıktan hızlı değil: u_LC bir hız değil, koordinat eğimi.` : `Parçacık ışık hızının %${tr(b * 100, 0)}'siyle sağa gidiyor.`; };
  us.addEventListener('input', uu); uu();
}

/* ---------- CH2: rapidity ---------- */
{
  const s1 = $('b1-hiz'), s2 = $('b2-hiz'), sn = $('n-hiz');
  const bar = (lab, w, v, ray) => `<div class="bar"><span>${lab}</span><span style="position:relative"><i class="${ray ? 'ray' : ''}" style="width:${Math.min(100, Math.max(1, w))}%"></i></span><span>${v}</span></div>`;
  function upd() { const b1 = +s1.value, b2 = +s2.value, n = +sn.value, p1 = Math.atanh(b1), p2 = Math.atanh(b2), br = Math.tanh(p1 + p2), bn = Math.tanh(n * p1);
    $('o1-hiz').textContent = tr(b1); $('o2-hiz').textContent = tr(b2); $('on-hiz').textContent = n;
    $('bars-hiz').innerHTML = '<p class="note" style="margin:0">Hızlar, ışık hızı = çubuğun yarısı</p>' +
      bar('Newton β₁+β₂', (b1 + b2) * 50, tr(b1 + b2), 1) + bar('Göreli', br * 50, tr(br, 4)) +
      bar(`${n} × β₁ (göreli)`, bn * 50, tr(bn, 5)) +
      '<p class="note" style="margin:8px 0 0">Rapidity\'ler toplanıyor (ölçek 0–6)</p>' +
      bar('φ₁', p1 / 6 * 100, tr(p1, 3)) + bar('φ₂', p2 / 6 * 100, tr(p2, 3)) + bar('φ₁ + φ₂', (p1 + p2) / 6 * 100, tr(p1 + p2, 3), 1) + bar(`${n} φ₁`, n * p1 / 6 * 100, tr(n * p1, 3), 1); }
  [s1, s2, sn].forEach(s => s.addEventListener('input', upd)); upd();
}

/* ---------- CH2: muons ---------- */
{
  const sl = $('b-mu'), TAU = 2.2e-6, C = 2.998e8, D = 15000;
  function upd() { const b = +sl.value, g = 1 / Math.sqrt(1 - b * b), Lr = g * b * C * TAU, L0 = b * C * TAU, p1 = Math.exp(-D / Lr), p0 = Math.exp(-D / L0);
    $('o-mu').textContent = tr(b, 4);
    dl($('r-mu'), [['γ', tr(g, 2)], ['Ortalama yol (yer)', tr(Lr / 1000, 2) + ' km'], ['Genişleme olmasaydı', tr(L0, 0) + ' m'], ['15 km müonun saatinde', tr(D / (b * C * g) * 1e6, 2) + ' μs'], ['Atmosfer müona göre', tr(D / g / 1000, 2) + ' km']]);
    const w = p => (Math.log10(p) + 14) / 14 * 100, fmt = p => p > 1e-3 ? '%' + tr(p * 100, 2) : sci(p);
    $('bars-mu').innerHTML = '<p class="note" style="margin:0">15 km\'den yere ulaşan müon oranı (logaritmik)</p>' +
      `<div class="bar"><span>Görelilikle</span><span><i style="width:${Math.max(1, w(p1))}%"></i></span><span>${fmt(p1)}</span></div>` +
      `<div class="bar"><span>Newton'la</span><span><i class="ray" style="width:${Math.max(1, w(p0))}%"></i></span><span>${fmt(p0)}</span></div>` +
      `<p class="note">Yerden ölçülen gerçek akı bu oranın görelilikle uyumlu olduğunu gösteriyor.</p>`; }
  sl.addEventListener('input', upd); upd();
}

/* ---------- CH2: mass shell ---------- */
{
  const svg = $('shell'), sl = $('phi-sh');
  const f = fig(svg, (W, H) => {
    const ph = +sl.value, p1 = Math.sinh(ph), p0 = Math.cosh(ph), pl = 30, pb = 30, R1 = 4.6, R0 = 5;
    const s0 = Math.min((W - 2 * pl) / (2 * R1), (H - pb - 14) / R0), cx = W / 2, by = H - pb, P = (x, y) => [cx + x * s0, by - y * s0];
    let s = L(P(-R1, 0)[0], by, P(R1, 0)[0], by, 'var(--ink)') + L(cx, by, cx, P(0, R0)[1], 'var(--ink)');
    s += T(P(R1, 0)[0], by + 20, 'p¹', 'text-anchor="end"') + T(cx + 8, P(0, R0)[1] + 12, 'p⁰');
    let a = P(0, 0), b = P(R0, R0); s += L(a[0], a[1], b[0], b[1], 'var(--ray)', 1.5, 'stroke-dasharray="5 4"'); b = P(-R0, R0); s += L(a[0], a[1], b[0], b[1], 'var(--ray)', 1.5, 'stroke-dasharray="5 4"');
    let pts = []; for (let u = -2.3; u <= 2.3; u += .04) pts.push(P(Math.sinh(u), Math.cosh(u)).map(v => v.toFixed(1)).join(','));
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--field)" stroke-width="2.6"/>`;
    // projections onto p+ (along (1,1)) and p- (along (-1,1)) axes
    const pp = (p0 + p1) / 2, pm = (p0 - p1) / 2, E = P(p1, p0), A = P(pp, pp), B = P(-pm, pm);
    s += L(E[0], E[1], A[0], A[1], 'var(--field)', 1, 'stroke-dasharray="3 3"') + L(E[0], E[1], B[0], B[1], 'var(--field)', 1, 'stroke-dasharray="3 3"');
    s += `<circle cx="${A[0]}" cy="${A[1]}" r="4" fill="var(--field)"/><circle cx="${B[0]}" cy="${B[1]}" r="4" fill="var(--field)"/>`;
    s += T(A[0] + 8, A[1] + 4, 'p⁺') + T(B[0] - 8, B[1] + 4, 'p⁻', 'text-anchor="end"');
    s += `<circle cx="${E[0]}" cy="${E[1]}" r="8" fill="var(--ray)" stroke="var(--panel)" stroke-width="3"/>`;
    s += T(P(-R1, 0)[0] + 4, P(0, R0)[1] + 14, 'p² = −m²c²', 'style="fill:var(--field);font-weight:600"');
    svg.innerHTML = s;
    const pP = Math.exp(ph) / Math.SQRT2, pM = Math.exp(-ph) / Math.SQRT2;
    dl($('r-sh'), [['β = tanh φ', tr(Math.tanh(ph), 3)], ['E / mc²', tr(p0, 3)], ['p¹ / mc', tr(p1, 3)], ['p⁺ / mc', tr(pP, 3)], ['p⁻ / mc', tr(pM, 3)], ['2p⁺p⁻ / m²c²', tr(2 * pP * pM, 3)]]);
  });
  sl.addEventListener('input', () => { $('o-sh').textContent = tr(+sl.value, 2); f(); }); $('o-sh').textContent = tr(+sl.value, 2);
}

/* ---------- CH2: p minus exact vs approx ---------- */
{
  const svg = $('pm'), sl = $('p1-pm');
  const ex = x => (Math.sqrt(x * x + 1) - x) / Math.SQRT2, ap = x => 1 / (2 * Math.SQRT2 * x);
  const f = fig(svg, (W, H) => {
    const pl = 52, pb = 40, pr = 16, pt = 14, xl = -1, xh = 2, yl = -3, yh = 0.5, X = v => pl + (v - xl) / (xh - xl) * (W - pl - pr), Y = v => pt + (1 - (v - yl) / (yh - yl)) * (H - pt - pb);
    let s = L(pl, Y(yl), W - pr, Y(yl), 'var(--ink)') + L(pl, Y(yl), pl, pt, 'var(--ink)');
    for (let v = -1; v <= 2; v++) s += T(X(v), Y(yl) + 18, `10<tspan dy="-6" font-size="11">${v}</tspan>`, 'text-anchor="middle" style="font-size:12px"');
    for (let v = -3; v <= 0; v++) s += T(pl - 6, Y(v) + 4, `10<tspan dy="-6" font-size="11">${v}</tspan>`, 'text-anchor="end" style="font-size:12px"') + L(pl, Y(v), W - pr, Y(v), 'var(--line)');
    s += T(W - pr, H - 4, 'p¹ / mc', 'text-anchor="end" style="font-size:12px;fill:var(--mute)"') + T(pl + 8, pt + 4, 'p⁻ / mc', 'style="font-size:12px;fill:var(--mute)"');
    const curve = (fn, c, dash) => { let p = []; for (let v = xl; v <= xh + 1e-9; v += .02) { const y = Math.log10(fn(10 ** v)); if (y > yh) continue; p.push(X(v).toFixed(1) + ',' + Y(y).toFixed(1)); } return `<polyline points="${p.join(' ')}" fill="none" stroke="${c}" stroke-width="2.4" ${dash ? 'stroke-dasharray="6 5"' : ''}/>`; };
    s += curve(ex, 'var(--field)') + curve(ap, 'var(--ray)', 1);
    s += T(X(1.55), Y(Math.log10(ex(10 ** 1.55))) - 12, 'tam', 'style="fill:var(--field);font-weight:600"') + T(X(-.3), Y(Math.log10(ap(10 ** -.3))) - 10, 'yaklaşık', 'style="fill:var(--ray);font-weight:600"');
    const v = +sl.value, y = Math.log10(ex(10 ** v)); s += L(X(v), Y(yl), X(v), Y(Math.min(y, yh)), 'var(--mute)', 1, 'stroke-dasharray="3 3"') + `<circle cx="${X(v)}" cy="${Y(y)}" r="7" fill="var(--field)" stroke="var(--panel)" stroke-width="3"/>`;
    svg.innerHTML = s;
  });
  function upd() { const x = 10 ** +sl.value, e = ex(x), a = ap(x); $('o-pm').textContent = tr(x, x < 1 ? 3 : (x < 10 ? 2 : 1));
    dl($('r-pm'), [['p⁻ tam', tr(e, 5)], ['p⁻ yaklaşık', tr(a, 5)], ['Hata', '%' + tr((a / e - 1) * 100, 2)], ['p⁺', tr((Math.sqrt(x * x + 1) + x) / Math.SQRT2, 3)], ['E / mc²', tr(Math.sqrt(x * x + 1), 3)]]); f(); }
  sl.addEventListener('input', upd); upd();
}

/* ---------- CH2: D dimensions ---------- */
{
  const sl = $('d-dim');
  seg($('p-dim'), [4, 10, 11, 26].map(d => ({label: 'D = ' + d, d})), it => { sl.value = it.d; upd(); }, 3);
  function upd() { const D = +sl.value; $('o-dim').textContent = D;
    const st = [['boost', D - 1], ['dönme', (D - 1) * (D - 2) / 2], ['Lorentz toplam', D * (D - 1) / 2], ['Poincaré (öteleme dahil)', D * (D + 1) / 2], ['transverse yön = foton pol.', D - 2], ['graviton polarizasyonu', D >= 3 ? D * (D - 3) / 2 : '—']];
    $('r-dim').innerHTML = st.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join(''); }
  sl.addEventListener('input', upd); upd();
}

window.H = {$, tr, sci, eUnit, col, reduce, fig, L, T, seg, dl, canvasSize, visibleLoop, minkowski, kind, NF};
/* ---------- quizzes ---------- */
const Q1 = [
  ['Standart Model için hangisi doğru?', ['Bütün dört etkileşimi tek bir basit grupta birleştirir', 'Üç etkileşimi aynı dilde anlatır ama gauge yapısı üç ayrı parçanın toplamıdır', 'Kütleçekimi kuantum düzeyde içerir', 'Higgs bozonu bir kuvvet taşıyıcısıdır', 'Elektrozayıf birleşmeyi içermez'], 1, 'Gauge cebiri su(3) ⊕ su(2) ⊕ u(1): üç ayrı parça, üç bağlaşım. Kütleçekim yok.'],
  ['Kondansatör örneğinde eski Ampère yasasının sorunu nedir?', ['Telin etrafında manyetik alan çıkmaz', 'Aynı halka için iki farklı yüzey iki farklı manyetik alan verir', 'Elektrik alan sıfır çıkar', 'Yük korunumu gereksizdir', 'Işık hızı yanlış çıkar'], 1, 'Torba yüzeyinden akım geçmez, düz diskten geçer. Maxwell terimi değişen elektrik alanı akım gibi sayarak iki cevabı eşitler.'],
  ['Maxwell denklemlerinden çıkan dalga neden henüz foton değildir?', ['Çünkü c yanlış hesaplanır', 'Çünkü türetimde ħ yoktur; bulunan klasik dalgadır', 'Çünkü dalga yalnız manyetiktir', 'Çünkü yer değiştirme akımı ölçülemez', 'Çünkü foton kütlelidir'], 1, 'Foton alan kuantize edilince gelir: modun bir kuantumu ħω enerji taşır.'],
  ['Kütleçekimin perturbasyon açılımı neden Planck ölçeğinde çöker?', ['Çünkü G_N boyutsuzdur', 'Çünkü etkin bağlaşım (E/E_P)² ile büyür ve 1\'e ulaşır', 'Çünkü kütleçekim kısa menzillidir', 'Çünkü graviton kütlelidir', 'Çünkü ħ orada sıfırdır'], 1, 'G_N\'nin boyutu kütlenin ters karesi; boyutsuz bağlaşım enerjiyle büyür.'],
  ['İki string birleşirken etkileşim noktasının gözlemciye bağlı olmasının nedeni nedir?', ['String\'ler ışıktan hızlıdır', 'Birleşme anı, eşzamanlılık çizgisinin yüzeye değdiği yerdir ve bu çizgi gözlemciye göre eğilir', 'String\'lerin kütlesi yoktur', 'Worldsheet tekildir', 'Kapalı string\'in ucu yoktur'], 1, 'Farklı gözlemcilerin “şimdi” kesitleri farklı noktalarda değer; ayrıcalıklı bir tepe noktası yok.'],
  ['Kıvrılmış bir yöndeki momentum neden kuantizedir?', ['Belirsizlik ilkesi yüzünden sıfırdır', 'Dalga fonksiyonu bir tur sonra kendine dönmeli; bu p = nħ/R verir', 'Çünkü çember çok küçüktür', 'Çünkü ışık hızı sabittir', 'Çünkü string\'ler sarılamaz'], 1, 'Tek değerlilik şartı. Bu momentum dört boyutta ek kütle gibi görünür.'],
  ['T-duality neyi söyler?', ['Güçlü ve zayıf bağlaşım aynıdır', 'Yarıçapı R olan çember ile α′/R olan çember string için aynı fiziği verir', 'Beş teori aynı boyuttadır', 'Brane\'ler kütlesizdir', 'On birinci boyut yoktur'], 1, 'Dolaşma ve sarılma sayıları yer değiştirince spektrum aynı kalır.'],
  ['Strominger–Vafa eşleşmesi için hangisi doğru?', ['Bütün astrofiziksel kara deliklerin mikrodurumlarını saydı', 'Belirli supersymmetric kara deliklerde mikroskobik sayım, 1/4 katsayısı dahil, alan formülünü verdi', 'Hawking ışımasını ölçtü', 'Entropinin hacimle orantılı olduğunu gösterdi', 'Yalnız bosonic string\'de yapıldı'], 1, 'Kontrollü örneklerde geçerli; dönen, supersymmetric olmayan kara delikler için bu kesinlikte bir sayım yok.']
];
const Q2 = [
  ['Bizim işaret kuralımızda timelike bir vektör için hangisi doğru?', ['a·a > 0 ve Δs² < 0', 'a·a < 0 ve Δs² > 0', 'a·a = 0', 'a·a > 0 ve Δs² > 0', 'İşaret gözlemciye bağlıdır'], 1, 'η = diag(−1,1,1,1) ve −ds² = η dx dx: norm negatif, aralık pozitif.'],
  ['Işık saatinde hareket eden saatin yavaş işlemesinin nedeni nedir?', ['Foton yorulur', 'Foton daha uzun, çapraz bir yol izler ve ışık hızı iki gözlemci için aynıdır', 'Aynalar kısalır', 'Saatin kütlesi artar', 'Foton yavaşlar'], 1, '(cΔt)² = (cΔt₀)² + (vΔt)² ⇒ Δt = γΔt₀.'],
  ['Hangi olay çiftlerinin sırası gözlemciye göre değişebilir?', ['Timelike', 'Null', 'Spacelike', 'Hepsi', 'Hiçbiri'], 2, 'Spacelike çiftler arasında sinyal gidemez; bu yüzden sıranın değişmesi nedenselliği bozmaz.'],
  ['M = diag(3, 1/3, 1, 1) için hangisi doğru?', ['det M = 1 olduğu için Lorentz dönüşümüdür', 'Bir boost\'tur', 'Lorentz değildir: null bir vektörü null olmayan bir vektöre götürür', 'Bir dönmedir', 'Light-cone koordinat değişimidir'], 2, 'Yeni norm −9 + 1/9 ≠ 0. Determinant koşulu gerekli ama yeterli değil.'],
  ['İkizler paradoksunda gezgin ikiz neden daha genç?', ['İvme saati doğrudan yavaşlatır', 'Minkowski geometrisinde düz worldline en uzun proper time\'ı verir; gezginin worldline\'ı düz değil', 'Gezgin daha az yemek yer', 'Simetri yüzünden ikisi de aynı yaştadır', 'Işık hızı gezgin için farklıdır'], 1, 'Proper time worldline boyunca toplanır; eksi işaretli metrik düz yolu en uzun yapar.'],
  ['Light-cone hızı u_LC = 4 olan bir parçacık için β kaçtır?', ['4', '−4', '3/5', '−3/5', '1/4'], 3, 'β = (1 − u)/(1 + u) = −3/5: ışık hızının beşte üçüyle sola gidiyor.'],
  ['Light-cone koordinatlarında boost nasıl görünür?', ['x⁺ ile x⁻ karışır', 'x⁺ bir sayıyla, x⁻ onun tersiyle çarpılır', 'Yalnız transverse yönler değişir', 'Hiçbir şey değişmez', 'x⁺ ve x⁻ yer değiştirir'], 1, 'x′± = e^(∓φ) x±; çarpım x⁺x⁻ sabit kalır.'],
  ['Evrim parametresi x⁺ seçildiğinde enerjinin rolünü ne oynar?', ['E', 'c p⁺', 'c p⁻', '|p|c', 'mc²'], 2, 'Düzlem dalganın x⁺\'ya göre türevi p⁻ getirir; p⁻ = (p⊥² + m²c²)/2p⁺.']
];
const Q3 = [
  ['Üç boyuttaki Maxwell denklemleri neden olduğu gibi başka boyutlara taşınamaz?', ['Işık hızı boyuta bağlıdır', 'Çapraz çarpım ve curl yalnız üç boyutta tanımlıdır', 'Yük korunmaz', 'Gauss yasası yanlıştır', 'Metrik değişir'], 1, 'İki vektöre dik tek bir doğrultu yalnız üç boyutta var. Alanları F<sub>μν</sub> tensörüne koyunca sorun kalkıyor.'],
  ['A → A + ∇ε, Φ → Φ − (1/c)∂ε/∂t dönüşümü için hangisi doğru?', ['Yalnız B\'yi değiştirir', 'Yalnız E\'yi değiştirir', 'E ve B\'yi değiştirmez', 'Yükü değiştirir', 'Yalnız Lorenz gauge\'da geçerlidir'], 2, '∇×∇ε = 0 ve E\'deki iki ε terimi birbirini götürür: gauge dönüşümü.'],
  ['Bizim kuralımızda F₀ᵢ ve F⁰ⁱ nedir?', ['İkisi de Eᵢ', 'F₀ᵢ = −Eᵢ, F⁰ⁱ = +Eᵢ', 'F₀ᵢ = Bᵢ', 'İkisi de −Eᵢ', 'F₀ᵢ = Eᵢ, F⁰ⁱ = −Eᵢ'], 1, 'F₀ᵢ = ∂₀Aᵢ − ∂ᵢA₀ = −Eᵢ; bir zaman indisini kaldırmak bir eksi getirir.'],
  ['D = 5\'te alan tensörünün manyetik kısmı kaç bileşenlidir?', ['3', '4', '5', '6', '10'], 3, 'd(d−1)/2 = 4·3/2 = 6. Toplam D(D−1)/2 = 10, elektrik kısım 4.'],
  ['Dört uzay boyutunda noktasal yükün alanı nasıl azalır?', ['1/r', '1/r²', '1/r³', '1/r⁴', 'e^(−r)'], 2, 'E = q/(Ω₃ r³), Ω₃ = 2π². Akı r^(d−1) gibi büyüyen bir yüzeye yayılır.'],
  ['D = 6\'da G⁽⁶⁾ 16 katına çıkarsa ℓₚ⁽⁶⁾ ne olur?', ['16 kat', '4 kat', '2 kat', '√2 kat', 'Değişmez'], 2, '(ℓₚ⁽ᴰ⁾)^(D−2) ∝ G⁽ᴰ⁾: dördüncü kök, 16^(1/4) = 2.'],
  ['Yarıçapı R olan tek bir compact boyut için dört boyutlu Newton sabiti nedir?', ['G⁽⁵⁾·2πR', 'G⁽⁵⁾/2πR', 'G⁽⁵⁾/R²', 'G⁽⁵⁾', '√G⁽⁵⁾'], 1, 'Kaynak çembere yayılınca ρ⁽⁵⁾ = ρ⁽⁴⁾/2πR ve Poisson denklemi G⁽⁵⁾/2πR ile dört boyutlu biçimini alır.'],
  ['D = 10\'da kütlesiz graviton kaç polarizasyon taşır?', ['8', '28', '35', '36', '45'], 2, 'D(D−3)/2 = 10·7/2 = 35: 8×8 simetrik matrisin 36 elemanından iz koşuluyla biri düşer.']
];
function quiz(el, sc, Q) {
  let done = 0, ok = 0;
  el.innerHTML = Q.map((q, i) => `<div class="q" data-q="${i}"><h3>${i + 1}. ${q[0]}</h3>${q[1].map((o, j) => `<button type="button" class="opt" data-j="${j}"><b>${'abcde'[j]})</b><span>${o}</span></button>`).join('')}<p class="exp">${q[3]}</p></div>`).join('');
  el.addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b) return; const qd = b.closest('.q'); if (qd.classList.contains('done')) return;
    const q = Q[+qd.dataset.q], j = +b.dataset.j; qd.classList.add('done'); qd.querySelectorAll('.opt')[q[2]].classList.add('ok'); if (j !== q[2]) b.classList.add('no'); else ok++; done++;
    $(sc).textContent = done === Q.length ? `Sonuç: ${ok} / ${Q.length}` : ''; });
}
quiz($('quiz1'), 'score1', Q1); quiz($('quiz2'), 'score2', Q2); quiz($('quiz3'), 'score3', Q3);

/* ---------- router ---------- */
const topbar = document.querySelector('.top');
new ResizeObserver(() => document.documentElement.style.setProperty('--toph', topbar.offsetHeight + 'px')).observe(topbar);
const views = {home: $('v-home'), ch1: $('v-ch1'), ch2: $('v-ch2'), ch3: $('v-ch3')};
function route() {
  const h = location.hash.slice(1) || 'home', v = ['ch1', 'ch2', 'ch3'].find(c => h.startsWith(c)) || 'home';
  Object.entries(views).forEach(([k, el]) => el.classList.toggle('on', k === v));
  document.querySelectorAll('.tabs a').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  requestAnimationFrame(() => { redraws.forEach(f => f()); const t = document.getElementById(h); if (t && h !== v) t.scrollIntoView(); else window.scrollTo(0, 0); });
}
addEventListener('hashchange', route); route();
const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { const id = e.target.id; document.querySelectorAll('.rail a').forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('cur', on); if (on) { const r = a.parentElement; if (r.scrollWidth > r.clientWidth) r.scrollTo({left: a.offsetLeft - r.clientWidth / 2 + a.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth'}); } }); } }); }, {rootMargin: '-30% 0px -60% 0px'});
document.querySelectorAll('.sec').forEach(s => io.observe(s));
}
