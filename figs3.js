{
const {$, tr, sci, fig, L, T, seg, dl} = window.H;
const sup = (v) => `10<tspan dy="-6" font-size="11">${v}</tspan>`;
const poly = (pts, st, w, extra = '') => `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${st}" stroke-width="${w}" ${extra}/>`;
const dot = (x, y, r, f, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`;
const subs = (str, html) => String(str).replace(/_(\{[^}]*\}|[A-Za-z0-9]+)/g, (m, g) => { g = g.replace(/^\{|\}$/g, ''); return html ? `<sub>${g}</sub>` : `<tspan baseline-shift="sub" font-size="75%">${g}</tspan>`; });
const dl3 = (el, rows) => dl(el, rows.map(r => r.map(x => subs(x, true))));
const lab = (x, y, s, a = 'start', c = 'var(--mute)', fs = 12, w = 400) => T(x, y, subs(s), `text-anchor="${a}" style="font-size:${fs}px;fill:${c};font-weight:${w}"`);
const gammaHalf = d => { // Gamma(d/2) for integer d >= 1
  if (d % 2 === 0) { let g = 1; for (let k = 1; k < d / 2; k++) g *= k; return g; }
  let g = Math.sqrt(Math.PI); for (let s = 0.5; s < d / 2 - 1e-9; s += 1) g *= s; return g;
};
const Om = d => 2 * Math.PI ** (d / 2) / gammaHalf(d); // Omega_{d-1}
function axes(W, H, o) { // generic plot frame
  const pl = o.pl || 52, pb = 38, pr = o.pr || 14, pt = o.pt || 14;
  const X = v => pl + (v - o.x0) / (o.x1 - o.x0) * (W - pl - pr), Y = v => pt + (1 - (v - o.y0) / (o.y1 - o.y0)) * (H - pt - pb);
  let s = L(pl, Y(o.y0), W - pr, Y(o.y0), 'var(--ink)') + L(pl, Y(o.y0), pl, pt, 'var(--ink)');
  (o.xt || []).forEach(([v, t]) => { s += L(X(v), Y(o.y0), X(v), Y(o.y0) + 4, 'var(--ink)') + T(X(v), Y(o.y0) + 18, t, 'text-anchor="middle" style="font-size:12px"'); });
  (o.yt || []).forEach(([v, t]) => { s += L(pl - 4, Y(v), pl, Y(v), 'var(--ink)') + T(pl - 7, Y(v) + 4, t, 'text-anchor="end" style="font-size:12px"'); if (o.grid) s += L(pl, Y(v), W - pr, Y(v), 'var(--line)'); });
  s += lab(W - pr, H - 4, o.xl, 'end') + lab(pl + 6, pt + 10, o.yl);
  return {s, X, Y, pl, pr, pt, pb};
}

/* ===== CH3 field tensor components ===== */
{
  const svg = $('f3-mat'), sl = $('d3-D');
  const f = fig(svg, (W, H) => {
    const D = +sl.value, sz = Math.min((W - 60) / D, (H - 80) / D, 46), x0 = Math.max(40, (W - sz * D) / 2), y0 = 40;
    let s = '';
    for (let i = 0; i < D; i++) for (let j = 0; j < D; j++) {
      const up = j > i, el = i === 0 || j === 0, c = i === j ? 'var(--line)' : el ? 'var(--ray)' : 'var(--field)', op = i === j ? 1 : up ? .85 : .18;
      s += `<rect x="${x0 + j * sz + 1}" y="${y0 + i * sz + 1}" width="${sz - 2}" height="${sz - 2}" fill="${c}" fill-opacity="${op}" rx="3"/>`;
      if (D <= 5 && i !== j && up) { const t = i === 0 ? `−E${'xyzw'[j - 1]}` : `F${i}${j}`; s += T(x0 + j * sz + sz / 2, y0 + i * sz + sz / 2 + 4, t, `text-anchor="middle" style="font-size:${sz > 40 ? 12 : 10}px;fill:var(--fieldink);font-weight:600"`); }
    }
    for (let k = 0; k < D; k++) s += lab(x0 + k * sz + sz / 2, y0 - 7, k, 'middle') + lab(x0 - 7, y0 + k * sz + sz / 2 + 4, k, 'end');
    s += lab(x0 + sz * D / 2, y0 - 22, 'ν', 'middle', 'var(--mute)', 13) + lab(x0 - 24, y0 + sz * D / 2, 'μ', 'middle', 'var(--mute)', 13);
    const yl = y0 + sz * D + 14;
    s += `<rect x="${x0}" y="${yl}" width="10" height="10" fill="var(--ray)"/>` + lab(x0 + 14, yl + 9, 'elektrik (0 = zaman)', 'start', 'var(--ink)', 11) + `<rect x="${x0 + 140}" y="${yl}" width="10" height="10" fill="var(--field)"/>` + lab(x0 + 154, yl + 9, 'manyetik', 'start', 'var(--ink)', 11);
    s += lab(x0, yl + 26, 'soluk kareler: alt üçgen, üst üçgenin eksisi', 'start', 'var(--mute)', 11);
    svg.innerHTML = s;
  });
  const upd = () => { const D = +sl.value, d = D - 1, mag = d * (d - 1) / 2; $('o3-D').textContent = D;
    $('r3-D').innerHTML = [['toplam', D * (D - 1) / 2], ['elektrik', d], ['manyetik', mag]].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
    const v = $('v3-D'); v.className = 'verdict' + (mag === d ? ' good' : '');
    v.textContent = mag === d ? `D = 4: manyetik bileşen sayısı uzay boyutuna eşit (${d}); manyetik alan bir vektör gibi yazılabiliyor.` : mag === 1 ? 'Manyetik alan tek bir sayı; düzleme dik bir ok değil, çünkü “dik” doğrultu yok.' : `Manyetik kısım ${mag} bileşenli, uzay ${d} boyutlu: bir vektör olamaz.`;
    f(); };
  sl.addEventListener('input', upd); upd();
}

/* ===== CH3 gauge family ===== */
{
  const svg = $('f3-gauge'), sl = $('g3-l');
  const f = fig(svg, (W, H) => {
    const lam = +sl.value, gap = 20, w = (W - gap) / 2;
    const panel = (ox, fn, xl, yl, col) => {
      const a = axes(w, H, {x0: 0, x1: 2, y0: -2.2, y1: 2.2, xt: [[0, '0'], [1, '1'], [2, '2']], yt: [[-2, '−2'], [0, '0'], [2, '2']], xl, yl, pl: 40});
      const pts = []; for (let v = 0; v <= 2.0001; v += .02) pts.push([a.X(v), a.Y(fn(v))]);
      return `<g transform="translate(${ox},0)">${a.s}${L(a.pl, a.Y(0), w - a.pr, a.Y(0), 'var(--line)')}${poly(pts, col, 3)}</g>`;
    };
    svg.innerHTML = panel(0, x => lam * x, 'x', 'Φ(x), t = 1', 'var(--ray)') + panel(w + gap, t => (1 - lam) * t, 't', 'Aₓ(t)', 'var(--field)');
  });
  const upd = () => { const lam = +sl.value; $('o3-l').textContent = tr(lam, 2);
    dl3($('r3-l'), [['Φ', lam ? `${tr(lam, 2)}·x` : '0'], ['Aₓ', lam < 1 ? `${tr(1 - lam, 2)}·t` : '0'], ['Eₓ = −∂ₓΦ − ∂ₜAₓ', `${tr(-lam, 2)} ${lam < 1 ? '− ' + tr(1 - lam, 2) : ''} = −1`], ['B', '0']]); f(); };
  sl.addEventListener('input', upd); upd();
}

/* ===== CH3 boost of E and B ===== */
{
  const svg = $('f3-boost'), sl = $('b3-b'); let init = [1, 0];
  const cur = () => { const b = +sl.value, g = 1 / Math.sqrt(1 - b * b), [E, B] = init; return [E, B, g * (E - b * B), g * (B - b * E), b, g]; };
  const f = fig(svg, (W, H) => {
    const [E, B, Ep, Bp] = cur(), lim = 4, pl = 92, pr = 16, rows = [['E_y', E, 'var(--ray)', .35], ['B_z', B, 'var(--field)', .35], ["E′_y", Ep, 'var(--ray)', 1], ["B′_z", Bp, 'var(--field)', 1]];
    const X = v => pl + (v + lim) / (2 * lim) * (W - pl - pr), bh = Math.min(26, (H - 50) / 5), top = 10;
    let s = '';
    rows.forEach(([n, v, c, op], i) => { const y = top + i * (bh + 10), x0 = X(0), x1 = X(Math.max(-lim, Math.min(lim, v)));
      s += `<rect x="${Math.min(x0, x1)}" y="${y}" width="${Math.abs(x1 - x0)}" height="${bh}" fill="${c}" fill-opacity="${op}" rx="3"/>` + lab(pl - 8, y + bh / 2 + 4, i < 2 ? n + ' (S)' : n + ' (S′)', 'end', 'var(--ink)', 13, 600); });
    const yb = top + 4 * (bh + 10);
    s += L(pl, yb, W - pr, yb, 'var(--ink)') + L(X(0), top - 4, X(0), yb, 'var(--mute)', 1, 'stroke-dasharray="3 3"');
    for (let v = -lim; v <= lim; v += 2) s += L(X(v), yb, X(v), yb + 4, 'var(--ink)') + T(X(v), yb + 18, v === 0 ? '0' : (v < 0 ? '−' : '') + Math.abs(v), 'text-anchor="middle" style="font-size:12px"');
    s += lab(W - pr, yb + 34, 'alan bileşeni (başlangıç alanı birimiyle)', 'end');
    svg.innerHTML = s;
  });
  seg($('s3-b'), [{label: 'Durgun yük: saf E', v: [1, 0]}, {label: 'Saf B', v: [0, 1]}, {label: 'Işık: E = B', v: [1, 1]}], it => { init = it.v; upd(); }, 0);
  const upd = () => { const [E, B, Ep, Bp, b, g] = cur(); $('o3-b').textContent = tr(b, 2);
    dl3($('r3-b'), [['γ', tr(g, 3)], ["E′_y", tr(Ep, 3)], ["B′_z", tr(Bp, 3)], ['E² − B² (S)', tr(E * E - B * B, 3)], ["E′² − B′² (S′)", tr(Ep * Ep - Bp * Bp, 3)]]); f(); };
  sl.addEventListener('input', upd); upd();
}

/* ===== CH3 sphere measure and ball volume ===== */
{
  const svg = $('f3-om'), sl = $('k3-d');
  const f = fig(svg, (W, H) => {
    const dm = 16, sel = +sl.value, a = axes(W, H, {x0: 0.3, x1: dm + 0.7, y0: 0, y1: 36, xt: [1, 4, 8, 12, 16].map(v => [v, v]), yt: [0, 10, 20, 30].map(v => [v, v]), grid: 1, xl: 'uzay boyutu d', yl: 'birim küre ve top'});
    let s = a.s; const bw = (a.X(2) - a.X(1)) * .36;
    for (let d = 1; d <= dm; d++) { const o = Om(d), v = o / d, on = d === sel;
      s += `<rect x="${a.X(d) - bw}" y="${a.Y(o)}" width="${bw}" height="${a.Y(0) - a.Y(o)}" fill="var(--field)" fill-opacity="${on ? 1 : .45}"/>` + `<rect x="${a.X(d)}" y="${a.Y(v)}" width="${bw}" height="${a.Y(0) - a.Y(v)}" fill="var(--ray)" fill-opacity="${on ? 1 : .45}"/>`; }
    s += `<rect x="${a.pl + 12}" y="${a.pt + 22}" width="10" height="10" fill="var(--field)"/>` + lab(a.pl + 26, a.pt + 31, 'Ω_{d−1}: birim kürenin ölçüsü', 'start', 'var(--ink)', 11) + `<rect x="${a.pl + 12}" y="${a.pt + 40}" width="10" height="10" fill="var(--ray)"/>` + lab(a.pl + 26, a.pt + 49, 'birim topun hacmi', 'start', 'var(--ink)', 11);
    svg.innerHTML = s;
  });
  const upd = () => { const d = +sl.value, o = Om(d); $('o3-d').textContent = d;
    const exact = {1: '2', 2: '2π', 3: '4π', 4: '2π²', 5: '8π²/3', 6: 'π³', 7: '16π³/15', 8: 'π⁴/3'}[d];
    dl3($('r3-d'), [['küre', `S${String(d - 1).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')}`], ['Ω_{d−1}', (exact ? exact + ' ≈ ' : '') + tr(o, 3)], ['Γ(d/2)', tr(gammaHalf(d), 3)], ['top hacmi Ω/d', tr(o / d, 3)]]); f(); };
  sl.addEventListener('input', upd); upd();
}

/* ===== CH3 fall-off and work ===== */
{
  const svg = $('f3-fall'), sd = $('n3-d'), sk = $('n3-k');
  const f = fig(svg, (W, H) => {
    const ds = +sd.value, k = +sk.value, a = axes(W, H, {x0: 0, x1: 1, y0: -3, y1: 0.2, xt: [[0, '1'], [Math.log10(2), '2'], [Math.log10(5), '5'], [1, '10']], yt: [[0, '1'], [-1, sup(-1)], [-2, sup(-2)], [-3, sup(-3)]], xl: 'uzaklık r / r₀ (log)', yl: 'E(r)/E(r₀) (log)'});
    let s = a.s;
    for (let d = 2; d <= 6; d++) { const on = d === ds, pts = []; for (let v = 0; v <= 1.0001; v += .02) { const y = -(d - 1) * v; if (y >= -3) pts.push([a.X(v), a.Y(y)]); }
      s += poly(pts, on ? 'var(--field)' : 'var(--mute)', on ? 3.5 : 1.2, on ? '' : 'stroke-opacity=".5"');
      const xe = Math.min(0.97, 2.2 / (d - 1)); s += lab(a.X(xe) + 6, a.Y(-(d - 1) * xe) - 4, `d=${d}`, 'start', on ? 'var(--field)' : 'var(--mute)', 11, on ? 700 : 400); }
    const lk = Math.log10(k); s += L(a.X(lk), a.Y(-3), a.X(lk), a.Y(0.2), 'var(--ray)', 1.5, 'stroke-dasharray="5 4"') + lab(a.X(lk) + 4, a.Y(-2.8), `son konum k = ${tr(k, 1)}`, 'start', 'var(--ray)', 11, 600);
    svg.innerHTML = s;
  });
  const upd = () => { const d = +sd.value, k = +sk.value; $('o3-nd').textContent = d; $('o3-nk').textContent = tr(k, 1);
    const o = Om(d), rows = [['Ω_{d−1}', tr(o, 3)], ['alan', `E ∝ 1/r${d - 1 > 1 ? '⁰¹²³⁴⁵⁶'[d - 1] : ''}`]];
    if (d > 2) { const fr = 1 - k ** (-(d - 2)); rows.push(['potansiyel', `Φ ∝ 1/r${d - 2 > 1 ? '⁰¹²³⁴⁵⁶'[d - 2] : ''}`], ['son enerji U(kr)/U(r)', tr(k ** (-(d - 2)), 3)], ['yapılan iş W/U(r)', tr(fr, 3)]); }
    else rows.push(['potansiyel', 'Φ ∝ −ln r'], ['yapılan iş', `(qq_t/2π)·ln k = ${tr(Math.log(k), 3)}·qq_t/2π`]);
    dl3($('r3-n'), rows); f(); };
  [sd, sk].forEach(x => x.addEventListener('input', upd)); upd();
}

/* ===== CH3 F_g / F_e ===== */
{
  const svg = $('f3-fg'), sl = $('p3-m'), mP = 2.176e-8, al = 1 / 137.036, lmP = Math.log10(mP), cross = Math.log10(Math.sqrt(al) * mP);
  const ratio = lm => 2 * (lm - lmP) - Math.log10(al);
  const f = fig(svg, (W, H) => {
    const lm = +sl.value, a = axes(W, H, {x0: -31, x1: -6, y0: -46, y1: 6, xt: [-30, -25, -20, -15, -10].map(v => [v, sup(v)]), yt: [-40, -30, -20, -10, 0].map(v => [v, sup(v)]), grid: 1, xl: 'kütle M (kg, log)', yl: 'F_g / F_e (log)', pl: 56});
    let s = a.s + L(a.pl, a.Y(0), W - a.pr, a.Y(0), 'var(--ray)', 1.5, 'stroke-dasharray="6 4"') + lab(a.pl + 8, a.Y(0) - 6, 'F_g = F_e', 'start', 'var(--ray)', 11, 600);
    s += poly([[a.X(-31), a.Y(ratio(-31))], [a.X(-6), a.Y(ratio(-6))]], 'var(--field)', 3);
    [[Math.log10(9.109e-31), 'elektron'], [Math.log10(1.6726e-27), 'proton'], [cross, '√α m_P']].forEach(([x, n], i) => { s += dot(a.X(x), a.Y(ratio(x)), 5, i === 2 ? 'var(--ray)' : 'var(--ink)') + lab(a.X(x) + (i === 2 ? -10 : 8), a.Y(ratio(x)) + 16, n, i === 2 ? 'end' : 'start', 'var(--ink)', 11, 600); });
    s += dot(a.X(lm), a.Y(ratio(lm)), 8, 'var(--field)', 'stroke="var(--panel)" stroke-width="2"');
    svg.innerHTML = s;
  });
  const upd = () => { const lm = +sl.value, M = 10 ** lm, r = 10 ** ratio(lm); $('o3-m').textContent = tr(lm, 2);
    dl3($('r3-m'), [['M', sci(M) + ' kg'], ['M / m_P', sci(M / mP)], ['F_g / F_e', sci(r)], ['eşitlik için', sci(Math.sqrt(al) * mP) + ' kg']]); f(); };
  sl.addEventListener('input', upd); upd();
}

/* ===== CH3 image sum on a circle ===== */
{
  const svg = $('f3-img'), sl = $('c3-r');
  const ratio = x => { // x = r/R ; |g| r^2 / (G4 M) = sum_k 4 x^3 / (x^2 + (2 pi k)^2)^2  (R = 1)
    let s = 4 / x; const K = 400; for (let k = 1; k <= K; k++) { const q = x * x + (2 * Math.PI * k) ** 2; s += 8 * x ** 3 / (q * q); }
    s += 8 * x ** 3 / ((2 * Math.PI) ** 4 * 3 * (K + .5) ** 3); // tail, 2πk ≫ x
    return s; };
  const pts = []; for (let v = -2; v <= 2.0001; v += .02) pts.push([v, Math.log10(ratio(10 ** v))]);
  const f = fig(svg, (W, H) => {
    const lv = +sl.value, a = axes(W, H, {x0: -2, x1: 2, y0: -0.3, y1: 2.8, xt: [-2, -1, 0, 1, 2].map(v => [v, sup(v)]), yt: [[0, '1'], [1, '10'], [2, '100']], grid: 1, xl: 'r / R (log)', yl: '|g| r² / G⁽⁴⁾M (log)'});
    let s = a.s;
    const sh = []; for (let v = -2; v <= 0.6; v += .02) sh.push([a.X(v), a.Y(Math.log10(4) - v)]);
    s += poly(sh, 'var(--ray)', 1.5, 'stroke-dasharray="6 4"') + lab(a.X(-1.3) + 10, a.Y(Math.log10(4) + 1.3) + 4, 'kısa: 4R/r (beş boyutlu 1/r³)', 'start', 'var(--ray)', 11, 600);
    s += L(a.X(-0.4), a.Y(0), a.X(2), a.Y(0), 'var(--mute)', 1.5, 'stroke-dasharray="6 4"') + lab(a.X(2) - 2, a.Y(0) - 6, 'uzun: Newton, G⁽⁴⁾ = G⁽⁵⁾/2πR', 'end', 'var(--mute)', 11, 600);
    s += poly(pts.map(([x, y]) => [a.X(x), a.Y(y)]), 'var(--field)', 3);
    s += dot(a.X(lv), a.Y(Math.log10(ratio(10 ** lv))), 7, 'var(--field)', 'stroke="var(--panel)" stroke-width="2"');
    svg.innerHTML = s;
  });
  const upd = () => { const lv = +sl.value, x = 10 ** lv, r = ratio(x); $('o3-r').textContent = tr(lv, 2);
    dl3($('r3-r'), [['r / R', sci(x)], ['tam toplam', tr(r, 3)], ['kısa mesafe 4R/r', tr(4 / x, 3)], ['bölge', x < .3 ? 'beş boyutlu' : x > 6 ? 'dört boyutlu' : 'geçiş']]); f(); };
  sl.addEventListener('input', upd); upd();
}

/* ===== CH3 large extra dimensions ===== */
{
  const svg = $('f3-lc'), sn = $('l3-n'), sl = $('l3-l'), l4 = 1.616e-35, hc = 1.97327e-16; // GeV m
  const calc = () => { const n = +sn.value, lD = 10 ** +sl.value; return [n, lD, lD * (lD / l4) ** (2 / n)]; };
  const f = fig(svg, (W, H) => {
    const [n, lD, lC] = calc(), x0 = -36, x1 = 14, pl = 16, pr = 16, X = v => pl + (v - x0) / (x1 - x0) * (W - pl - pr), y = H * .52;
    let s = L(pl, y, W - pr, y, 'var(--ink)', 2);
    for (let v = -35; v <= 10; v += (W < 520 ? 10 : 5)) s += L(X(v), y, X(v), y + 5, 'var(--ink)') + T(X(v), y + 20, sup(v), 'text-anchor="middle" style="font-size:11px"');
    s += lab(W - pr, y + 38, 'uzunluk (metre, log)', 'end');
    const ref = W < 520 ? [[-15, 'proton'], [-3, 'mm'], [11.2, 'Güneş']] : [[-15, 'proton'], [-6, 'μm'], [-3, 'mm'], [11.2, 'Dünya–Güneş']];
    ref.forEach(([v, t]) => { s += L(X(v), y - 6, X(v), y, 'var(--mute)', 2) + lab(X(v), y - 10, t, 'middle', 'var(--mute)', 11); });
    const mk = (v, t, c, up) => { const xx = X(Math.max(x0, Math.min(x1, v))); s += L(xx, y - up, xx, y, c, 2) + dot(xx, y, 5, c) + lab(xx, y - up - 5, t, 'middle', c, 12, 700); };
    mk(Math.log10(l4), 'ℓ_P⁽⁴⁾', 'var(--ink)', 52); mk(Math.log10(lD), 'ℓ_P⁽ᴰ⁾', 'var(--ray)', 32); mk(Math.log10(lC), 'ℓ_C', 'var(--field)', 52);
    svg.innerHTML = s;
  });
  const upd = () => { const [n, lD, lC] = calc(); $('o3-n').textContent = n; $('o3-ll').textContent = tr(+sl.value, 1);
    const E = hc / lD; dl3($('r3-lc'), [['D', n + 4], ['ℓ_C', sci(lC) + ' m'], ['yarıçap R', sci(lC / (2 * Math.PI)) + ' m'], ['temel enerji ölçeği', sci(E) + ' GeV'], ['oran E_P⁽⁴⁾ / E_P⁽ᴰ⁾', sci(lD / l4)]]); f(); };
  [sn, sl].forEach(x => x.addEventListener('input', upd)); upd();
}

/* ===== CH3 polarizations ===== */
{
  const svg = $('f3-pol'), sl = $('q3-D'); let mode = 'g';
  const f = fig(svg, (W, H) => {
    const D = +sl.value, n = D - 2, sz = Math.min((W - 40) / Math.max(n, 1), (H - 90) / Math.max(n, 1), 44), x0 = Math.max(12, (W - sz * n) / 2), y0 = 24;
    let s = '';
    if (mode === 'g') { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const up = j > i, diag = i === j, last = diag && i === n - 1, c = last ? 'var(--line)' : diag ? 'var(--ray)' : 'var(--field)', op = last ? 1 : (up || diag) ? .85 : .16;
        s += `<rect x="${x0 + j * sz + .5}" y="${y0 + i * sz + .5}" width="${Math.max(1, sz - 1)}" height="${Math.max(1, sz - 1)}" fill="${c}" fill-opacity="${op}" rx="${sz > 10 ? 2 : 0}"/>`; }
      const yl = y0 + sz * n + 12; s += `<rect x="${x0}" y="${yl}" width="10" height="10" fill="var(--ray)"/>` + lab(x0 + 14, yl + 9, 'köşegen', 'start', 'var(--ink)', 11) + `<rect x="${x0 + 80}" y="${yl}" width="10" height="10" fill="var(--field)"/>` + lab(x0 + 94, yl + 9, 'üst üçgen', 'start', 'var(--ink)', 11) + `<rect x="${x0}" y="${yl + 18}" width="10" height="10" fill="var(--line)"/>` + lab(x0 + 14, yl + 27, 'iz koşuluyla belirlenen', 'start', 'var(--ink)', 11);
      s += lab(W / 2, y0 - 8, `simetrik ${n}×${n}, izsiz: e_ij (i, j transverse)`, 'middle', 'var(--mute)', 12); }
    else { for (let i = 0; i < n; i++) s += `<rect x="${x0 + i * sz + .5}" y="${y0 + .5}" width="${Math.max(1, sz - 1)}" height="${Math.min(sz, 44) - 1}" fill="var(--field)" fill-opacity=".85" rx="2"/>`;
      s += lab(W / 2, y0 + Math.min(sz, 44) + 22, `ε_i, i = 1…${n}: hareket doğrultusuna dik doğrultular`, 'middle', 'var(--mute)', 12) + lab(W / 2, y0 - 8, `D = ${D} bileşenden k² = 0, k·ε = 0 ve ε ∼ ε + βk sonrası kalanlar`, 'middle', 'var(--mute)', 12); }
    svg.innerHTML = s;
  });
  seg($('s3-q'), [{label: 'Graviton', v: 'g'}, {label: 'Foton', v: 'p'}], it => { mode = it.v; f(); }, 0);
  const upd = () => { const D = +sl.value; $('o3-q').textContent = D;
    $('r3-q').innerHTML = [['transverse D−2', D - 2], ['foton', D - 2], ['graviton', D * (D - 3) / 2]].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join(''); f(); };
  sl.addEventListener('input', upd); upd();
}
}
