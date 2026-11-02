// engine.js — The Night Almanac calculation engine (browser/Node), mirrors astro_engine.py
// Swiss Ephemeris via sweph-wasm (AGPL-3.0). Moshier built-in ephemeris, no files.

export const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra",
  "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
export const RULERS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus",
  "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const PIDS = { Sun: 0, Moon: 1, Mercury: 2, Venus: 3, Mars: 4, Jupiter: 5, Saturn: 6,
  Uranus: 7, Neptune: 8, Pluto: 9, Rahu: 10 };
export const CLASSICAL = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
export const VEDIC_GRAHAS = [...CLASSICAL, "Rahu", "Ketu"];
export const ZR_YEARS = [15, 8, 20, 25, 19, 20, 8, 15, 12, 27, 30, 12];
export const DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
export const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18,
  Jupiter: 16, Saturn: 19, Mercury: 17 };
export const NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"];
const NAK = 360 / 27;
const DAY = 86400000;
const ZR_YEAR = 360 * DAY, ZR_MONTH = 30 * DAY, DASHA_YEAR = 365.25 * DAY;
const MOSEPH = 4, SPEED = 256, SIDEREAL = 65536;
const SIDM_LAHIRI = 1, SIDM_KP = 5;

let swe = null;
export function setSwe(instance) { swe = instance; }

// ---------- helpers ----------
export const norm = (x) => ((x % 360) + 360) % 360;
export const signIdx = (lon) => Math.floor(norm(lon) / 30);
export const angdiff = (a, b) => { let d = norm(a - b); return d > 180 ? d - 360 : d; };
export function fmtDeg(lon) {
  lon = norm(lon); const s = lon % 30; let d = Math.floor(s), m = Math.round((s - d) * 60);
  if (m === 60) { d += 1; m = 0; }
  return `${d}°${String(m).padStart(2, "0")}' ${SIGNS[signIdx(lon)]}`;
}
export const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);
export const ordinal = (n) => n + ((n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));

// ---------- time ----------
function tzOffsetMs(ms, tz) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUTC - Math.floor(ms / 1000) * 1000;
}
export function localToUTCms(y, m, d, h, mi, tz) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let utc = guess - tzOffsetMs(guess, tz);
  utc = guess - tzOffsetMs(utc, tz);
  return utc;
}
export function jdFromMs(ms) {
  const t = new Date(ms);
  const h = t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600 + t.getUTCMilliseconds() / 3.6e6;
  return swe.swe_julday(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), h, 1);
}

// ---------- core ----------
function positions(jd, sidMode = null) {
  let flags = MOSEPH | SPEED;
  if (sidMode !== null) { swe.swe_set_sid_mode(sidMode, 0, 0); flags |= SIDEREAL; }
  const out = {};
  for (const [name, id] of Object.entries(PIDS)) {
    const r = swe.swe_calc_ut(jd, id, flags);
    out[name] = { lon: r[0], lat: r[1], dist: r[2], speed: r[3], retro: r[3] < 0 };
  }
  out.Ketu = { ...out.Rahu, lon: norm(out.Rahu.lon + 180), lat: -out.Rahu.lat };
  return out;
}
function cusps(jd, lat, lon, sidMode = null) {
  let flags = MOSEPH;
  if (sidMode !== null) { swe.swe_set_sid_mode(sidMode, 0, 0); flags |= SIDEREAL; }
  const h = swe.swe_houses_ex(jd, flags, lat, lon, "P");
  return { cusps: h.cusps.slice(1, 13), asc: h.ascmc[0], mc: h.ascmc[1] };
}
function ayanamsa(jd, mode) { swe.swe_set_sid_mode(mode, 0, 0); return swe.swe_get_ayanamsa_ut(jd); }
function isDay(jd, lat, lon) {
  const s = swe.swe_calc_ut(jd, 0, MOSEPH);
  return swe.swe_azalt(jd, 0, [lon, lat, 0], 0, 0, [s[0], s[1], s[2]])[1] > 0;
}
export function placidusHouse(lon, cs) {
  for (let i = 0; i < 12; i++) {
    const a = cs[i], b = cs[(i + 1) % 12];
    if (norm(lon - a) < norm(b - a)) return i + 1;
  }
  return 12;
}
export const wsHouse = (lon, asc) => ((signIdx(lon) - signIdx(asc)) % 12 + 12) % 12 + 1;

// ---------- chart ----------
// birth: {y,m,d,h,mi,lat,lon,tz,reliability}
export function computeChart(birth) {
  const utc = localToUTCms(birth.y, birth.m, birth.d, birth.h, birth.mi, birth.tz);
  const jd = jdFromMs(utc);

  // Western
  const wp = positions(jd);
  const wh = cusps(jd, birth.lat, birth.lon);
  const day = isDay(jd, birth.lat, birth.lon);
  const western = { asc: wh.asc, mc: wh.mc, cusps: wh.cusps, sect: day ? "day" : "night", planets: {} };
  for (const [n, p] of Object.entries(wp)) {
    western.planets[n] = { lon: p.lon, retro: p.retro, sign: SIGNS[signIdx(p.lon)],
      house: wsHouse(p.lon, wh.asc), housePlacidus: placidusHouse(p.lon, wh.cusps) };
  }

  // Lots (Paulus), reversed at night
  const P = Object.fromEntries(Object.entries(wp).map(([k, v]) => [k, v.lon]));
  const lot = (x, y) => (day ? norm(wh.asc + x - y) : norm(wh.asc + y - x));
  const fortune = lot(P.Moon, P.Sun), spirit = lot(P.Sun, P.Moon);
  const lotLons = { Fortune: fortune, Spirit: spirit, Eros: lot(P.Venus, spirit),
    Necessity: lot(fortune, P.Mercury), Courage: lot(fortune, P.Mars),
    Victory: lot(P.Jupiter, spirit), Nemesis: lot(fortune, P.Saturn) };
  const lots = {};
  for (const [n, v] of Object.entries(lotLons)) lots[n] = { lon: v, sign: SIGNS[signIdx(v)], house: wsHouse(v, wh.asc) };

  // Vedic (Lahiri, whole sign)
  const vp = positions(jd, SIDM_LAHIRI);
  const vh = cusps(jd, birth.lat, birth.lon, SIDM_LAHIRI);
  const vedic = { ayanamsa: ayanamsa(jd, SIDM_LAHIRI), lagna: vh.asc, planets: {} };
  for (const n of VEDIC_GRAHAS) {
    const p = vp[n];
    vedic.planets[n] = { lon: p.lon, retro: p.retro, sign: SIGNS[signIdx(p.lon)],
      house: wsHouse(p.lon, vh.asc), ...nakshatraOf(p.lon) };
  }

  // KP (KP ayanamsa, Placidus)
  const kpp = positions(jd, SIDM_KP);
  const kph = cusps(jd, birth.lat, birth.lon, SIDM_KP);
  const kp = { ayanamsa: ayanamsa(jd, SIDM_KP), ...kpFrom(kpp, kph.cusps) };

  return { birth, utc, jd, western, lots, vedic, kp, moonSidLahiri: vp.Moon.lon };
}

export function nakshatraOf(lon) {
  lon = norm(lon); const n = Math.floor(lon / NAK);
  return { nakshatra: NAKSHATRAS[n], pada: Math.floor((lon - n * NAK) / (NAK / 4)) + 1, nakLord: DASHA_ORDER[n % 9] };
}

// ---------- profections ----------
export function ageOn(birth, onMs) {
  const t = new Date(onMs);
  const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate();
  return y - birth.y - ((m < birth.m || (m === birth.m && d < birth.d)) ? 1 : 0);
}
export function profection(chart, onMs) {
  const age = ageOn(chart.birth, onMs);
  const sign = (signIdx(chart.western.asc) + age) % 12;
  const lord = RULERS[sign];
  const activated = Object.entries(chart.western.planets)
    .filter(([n, p]) => CLASSICAL.includes(n) && signIdx(p.lon) === sign).map(([n]) => n);
  return { age, house: (age % 12) + 1, sign: SIGNS[sign], lord, lordNatal: chart.western.planets[lord], activated };
}
export function profectionYears(chart, years = 90) {
  const out = [];
  for (let age = 0; age < years; age++) {
    const start = Date.UTC(chart.birth.y + age, chart.birth.m - 1, chart.birth.d);
    const end = Date.UTC(chart.birth.y + age + 1, chart.birth.m - 1, chart.birth.d);
    const sign = (signIdx(chart.western.asc) + age) % 12;
    out.push({ age, start, end, house: (age % 12) + 1, sign: SIGNS[sign], lord: RULERS[sign] });
  }
  return out;
}

// ---------- zodiacal releasing ----------
const ANG = { 1: "1st", 4: "4th", 7: "7th", 10: "10th" };
export function angularFrom(sign, ref) { return ANG[((sign - ref) % 12 + 12) % 12 + 1] || null; }
export function zodiacalReleasing(chart, fromLot = "Spirit", years = 90) {
  const start = signIdx(chart.lots[fromLot].lon), fs = signIdx(chart.lots.Fortune.lon);
  const limit = chart.utc + years * 365.25 * DAY;
  const level1 = [];
  let t = chart.utc, s = start;
  while (t < limit) {
    const l1End = t + ZR_YEARS[s] * ZR_YEAR;
    const subs = []; let st = t, ss = s, jumped = false;
    while (st < l1End) {
      const subEnd = Math.min(st + ZR_YEARS[ss] * ZR_MONTH, l1End);
      subs.push({ sign: SIGNS[ss], si: ss, start: st, end: subEnd, peak: angularFrom(ss, fs), loosing: jumped });
      st = subEnd; jumped = false;
      let nxt = (ss + 1) % 12;
      if (nxt === s) { nxt = (s + 6) % 12; jumped = true; }
      ss = nxt;
    }
    level1.push({ sign: SIGNS[s], si: s, start: t, end: l1End, years: ZR_YEARS[s], peak: angularFrom(s, fs), level2: subs });
    t = l1End; s = (s + 1) % 12;
  }
  return { fromLot, lotSign: SIGNS[start], fortuneSign: SIGNS[fs], level1 };
}
export function zrAt(zr, ms) {
  for (const a of zr.level1) if (a.start <= ms && ms < a.end)
    for (const b of a.level2) if (b.start <= ms && ms < b.end) return { l1: a, l2: b };
  return null;
}

// ---------- Vimshottari ----------
export function vimshottari(chart) {
  const lon = norm(chart.moonSidLahiri), n = Math.floor(lon / NAK), first = n % 9;
  const frac = (lon - n * NAK) / NAK;
  let t = chart.utc - DASHA_YEAR * DASHA_YEARS[DASHA_ORDER[first]] * frac;
  const mds = [];
  for (let cycle = 0; cycle < 2; cycle++) for (let k = 0; k < 9; k++) {
    const lord = DASHA_ORDER[(first + k) % 9];
    const end = t + DASHA_YEAR * DASHA_YEARS[lord];
    const ads = []; let st = t;
    for (let j = 0; j < 9; j++) {
      const al = DASHA_ORDER[(first + k + j) % 9];
      const aEnd = st + DASHA_YEAR * DASHA_YEARS[lord] * DASHA_YEARS[al] / 120;
      ads.push({ lord: al, start: st, end: aEnd }); st = aEnd;
    }
    mds.push({ lord, start: t, end, antardashas: ads }); t = end;
  }
  return { balanceYears: DASHA_YEARS[DASHA_ORDER[first]] * (1 - frac), mahadashas: mds };
}
export function dashaAt(v, ms) {
  for (const md of v.mahadashas) if (md.start <= ms && ms < md.end)
    for (const ad of md.antardashas) if (ad.start <= ms && ms < ad.end) return { md, ad };
  return null;
}

// ---------- KP ----------
export const KP_TABLE = (() => {
  const rows = [];
  for (let n = 0; n < 27; n++) {
    let start = n * NAK; const first = n % 9;
    for (let k = 0; k < 9; k++) {
      const sub = DASHA_ORDER[(first + k) % 9];
      const end = start + NAK * DASHA_YEARS[sub] / 120;
      const boundary = (Math.floor(start / 30 + 1e-9) + 1) * 30;
      const pieces = (start < boundary - 1e-9 && end > boundary + 1e-9) ? [[start, boundary], [boundary, end]] : [[start, end]];
      for (const [a, z] of pieces) {
        const si = signIdx(a + 1e-9);
        rows.push({ start: a, end: z, sign: SIGNS[si], signLord: RULERS[si], starLord: DASHA_ORDER[first], subLord: sub });
      }
      start = end;
    }
  }
  rows.forEach((r, i) => (r.number = i + 1));
  return rows;
})();
export function kpLords(lon) {
  lon = norm(lon) + 1e-12;
  let lo = 0, hi = KP_TABLE.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (KP_TABLE[mid].start <= lon) lo = mid; else hi = mid - 1; }
  const r = KP_TABLE[lo];
  return { signLord: r.signLord, starLord: r.starLord, subLord: r.subLord, number: r.number };
}
function kpFrom(pos, cs) {
  const planets = {};
  for (const n of VEDIC_GRAHAS) planets[n] = { lon: pos[n].lon, retro: pos[n].retro, house: placidusHouse(pos[n].lon, cs), ...kpLords(pos[n].lon) };
  const cuspRows = cs.map((c, i) => ({ house: i + 1, lon: c, ...kpLords(c) }));
  const significators = {};
  for (let h = 1; h <= 12; h++) {
    const occ = Object.keys(planets).filter((n) => planets[n].house === h);
    const owner = cuspRows[h - 1].signLord;
    significators[h] = {
      A: Object.keys(planets).filter((n) => occ.includes(planets[n].starLord)),
      B: occ,
      C: Object.keys(planets).filter((n) => planets[n].starLord === owner),
      D: owner,
    };
  }
  return { planets, cusps: cuspRows, significators };
}
// houses a planet signifies: its star lord's occupation + ownership (primary),
// then its own occupation + ownership. Nodes also act for their sign lord.
export function kpSignifies(kp, planet) {
  const own = (p) => {
    const hs = kp.cusps.filter((c) => c.signLord === p).map((c) => c.house);
    if (p === "Rahu" || p === "Ketu") {
      const sl = RULERS[signIdx(kp.planets[p].lon)];
      hs.push(kp.planets[sl].house, ...kp.cusps.filter((c) => c.signLord === sl).map((c) => c.house));
    }
    return hs;
  };
  const star = kp.planets[planet].starLord;
  const primary = new Set([kp.planets[star].house, ...own(star)]);
  const secondary = new Set([kp.planets[planet].house, ...own(planet)]);
  return { starLord: star, primary: [...primary].sort((a, b) => a - b), secondary: [...secondary].sort((a, b) => a - b),
    all: [...new Set([...primary, ...secondary])].sort((a, b) => a - b) };
}
export function kpHorary(number, lat, lon, ms) {
  const jd = jdFromMs(ms);
  const aya = ayanamsa(jd, SIDM_KP);
  const target = norm(KP_TABLE[number - 1].start + aya + 1e-7);
  const eps = swe.swe_calc_ut(jd, -1, MOSEPH)[0];
  const ascOf = (armc) => swe.swe_houses_armc(armc, lat, eps, "P").ascmc[0];
  let prev = angdiff(ascOf(0), target), lo = null, hi = null;
  for (let s = 1; s <= 360; s++) {
    const cur = angdiff(ascOf(s), target);
    if (prev < 0 && cur >= 0 && cur - prev < 180) { lo = s - 1; hi = s; break; }
    prev = cur;
  }
  if (lo === null) throw new Error("Could not solve the Ascendant for this latitude.");
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (angdiff(ascOf(mid), target) < 0) lo = mid; else hi = mid; }
  const cs = swe.swe_houses_armc((lo + hi) / 2, lat, eps, "P").cusps.slice(1, 13).map((c) => norm(c - aya));
  swe.swe_set_sid_mode(SIDM_KP, 0, 0);
  return { number, ms, ...kpFrom(positions(jd, SIDM_KP), cs) };
}

// ---------- KP questions ----------
export const KP_QUESTIONS = [
  { id: "marriage", label: "Is marriage indicated?", cusp: 7, fav: [2, 7, 11], neg: [1, 6, 10] },
  { id: "job", label: "Will I get a job / new employment?", cusp: 10, fav: [2, 6, 10, 11], neg: [1, 5, 9] },
  { id: "promotion", label: "Is a promotion or career rise indicated?", cusp: 10, fav: [2, 6, 10, 11], neg: [5, 9] },
  { id: "business", label: "Is starting a business favorable?", cusp: 7, fav: [7, 10, 11], neg: [6, 9] },
  { id: "property", label: "Will I buy property?", cusp: 4, fav: [4, 11, 12], neg: [3, 10] },
  { id: "education", label: "Is higher education indicated?", cusp: 9, fav: [4, 9, 11], neg: [3, 8] },
  { id: "travel", label: "Is foreign travel indicated?", cusp: 12, fav: [3, 9, 12], neg: [2, 8, 11] },
  { id: "children", label: "Are children indicated?", cusp: 5, fav: [2, 5, 11], neg: [1, 4, 10] },
  { id: "competition", label: "Will I win a competition or contest?", cusp: 6, fav: [6, 11], neg: [5, 10] },
];
export function kpAnswer(kp, q, dashas, fromMs, horizonYears = 15) {
  const sub = kp.cusps[q.cusp - 1].subLord;
  const sig = kpSignifies(kp, sub);
  const favHits = q.fav.filter((h) => sig.all.includes(h));
  const negHits = q.neg.filter((h) => sig.all.includes(h));
  let verdict, tone;
  if (favHits.includes(q.cusp) && favHits.length >= negHits.length) { verdict = "Indicated"; tone = "good"; }
  else if (favHits.length && negHits.length) { verdict = "Mixed: indicated, with obstacles or delays"; tone = "mixed"; }
  else if (favHits.length) { verdict = "Partly indicated"; tone = "mixed"; }
  else { verdict = "Not strongly indicated"; tone = "low"; }

  // Rank every planet by how strongly it connects to this question.
  // Significator level per favorable house: A=4, B=3, C=2, D=1.
  const planets = {};
  for (const p of VEDIC_GRAHAS) {
    let level = 0;
    for (const h of q.fav) {
      const s = kp.significators[h];
      level += s.A.includes(p) ? 4 : s.B.includes(p) ? 3 : s.C.includes(p) ? 2 : s.D === p ? 1 : 0;
    }
    const ps = kpSignifies(kp, p);
    const fav = q.fav.filter((h) => ps.all.includes(h)), neg = q.neg.filter((h) => ps.all.includes(h));
    const score = level + 2 * fav.length - 3 * neg.length;
    let label;
    if (!fav.length && !level) label = "Not connected";
    else if (neg.length > fav.length) label = "Opposing";
    else if (score >= 8) label = "Strong";
    else if (score >= 4) label = "Supportive";
    else label = "Weak";
    planets[p] = { score, label, fav, neg, level };
  }
  const usable = (l) => l === "Strong" || l === "Supportive";
  const windows = [];
  const until = fromMs + horizonYears * 365.25 * DAY;
  if (dashas) for (const md of dashas.mahadashas) for (const ad of md.antardashas) {
    if (ad.end < fromMs || ad.start > until) continue;
    const M = planets[md.lord], A = planets[ad.lord];
    if (!usable(A.label) || M.label === "Opposing" || M.label === "Not connected") continue;
    windows.push({ md: md.lord, ad: ad.lord, start: Math.max(ad.start, fromMs), end: ad.end,
      score: 2 * A.score + M.score, both: usable(M.label) });
  }
  const ranked = windows.slice().sort((a, b) => b.score - a.score || a.start - b.start).slice(0, 3);
  const earliest = windows.slice().sort((a, b) => a.start - b.start).slice(0, 3);
  return { question: q, subLord: sub, signifies: sig, favHits, negHits, verdict, tone, planets, windows: ranked, earliest };
}

// ---------- transits ----------
// Positions of the planets at any moment. mode: null (tropical) or "lahiri".
export function planetsAt(ms, mode = null) {
  return positions(jdFromMs(ms), mode === "lahiri" ? SIDM_LAHIRI : null);
}
// Vimshottari sub-sub periods (pratyantardasha) inside an antardasha
export function pratyantar(md, ad) {
  const out = []; let t = ad.start; const len = ad.end - ad.start;
  const i0 = DASHA_ORDER.indexOf(ad.lord);
  for (let j = 0; j < 9; j++) {
    const l = DASHA_ORDER[(i0 + j) % 9];
    const e = t + len * DASHA_YEARS[l] / 120;
    out.push({ lord: l, start: t, end: e }); t = e;
  }
  return out;
}

// ---------- astrocartography ----------
// For each planet: the longitude where it was on the Midheaven / Imum Coeli at birth,
// and curves where it was rising (ASC) or setting (DSC). Longitudes east-positive.
const norm180 = (x) => ((x + 540) % 360) - 180;
export function acgLines(chart) {
  const jd = chart.jd, gst = swe.swe_sidtime(jd) * 15;
  const out = {};
  for (const [name, id] of Object.entries(PIDS)) {
    if (name === "Rahu") continue;
    const r = swe.swe_calc_ut(jd, id, MOSEPH | 2048);
    const ra = r[0], dec = r[1];
    const mc = norm180(ra - gst), ic = norm180(mc + 180);
    const asc = [], dsc = [];
    for (let lat = -72; lat <= 72; lat += 1) {
      const x = -Math.tan((lat * Math.PI) / 180) * Math.tan((dec * Math.PI) / 180);
      if (Math.abs(x) > 1) continue;
      const H = (Math.acos(x) * 180) / Math.PI;
      asc.push([norm180(ra - gst - H), lat]);
      dsc.push([norm180(ra - gst + H), lat]);
    }
    out[name] = { mc, ic, asc, dsc, ra, dec };
  }
  return out;
}
// Great-circle distance in km
export function kmBetween(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
export function distToLine(lat, lon, line, kind) {
  if (kind === "mc" || kind === "ic") return kmBetween(lat, lon, lat, line[kind]);
  let best = Infinity;
  for (const [lo, la] of line[kind]) best = Math.min(best, kmBetween(lat, lon, la, lo));
  return best;
}

// ---------- sunrise / sunset (Swiss Ephemeris; upper limb with standard refraction) ----------
const jdToMs = (jd) => (jd - 2440587.5) * DAY;
export { jdToMs };
// Returns sunrise, sunset and next sunrise (UTC ms) for the local calendar date y-m-d at lat/lon.
export function sunFrame(y, m, d, lat, lon, tz) {
  const startJd = jdFromMs(localToUTCms(y, m, d, 0, 0, tz));
  const geo = [lon, lat, 0];
  const rt = (jd, kind) => { try { const r = swe.swe_rise_trans(jd, 0, null, MOSEPH, kind, geo, 1013.25, 15); return typeof r === "number" && r > jd ? r : null; } catch { return null; } };
  const rise = rt(startJd, 1), set = rise && rt(rise, 2), next = set && rt(set, 1);
  if (!rise || !set || !next || next - rise > 1.5) {
    // Polar day/night: fall back to 6:00 and 18:00 local so the app still works.
    const r = localToUTCms(y, m, d, 6, 0, tz);
    return { rise: r, set: r + DAY / 2, next: r + DAY, approx: true };
  }
  return { rise: jdToMs(rise), set: jdToMs(set), next: jdToMs(next), approx: false };
}
// Find when f(ms) (an integer-valued function) changes, searching forward from ms; returns change time.
export function nextChange(f, ms, stepMs = 30 * 60000, maxMs = 3 * DAY) {
  const v0 = f(ms); let a = ms, b = ms + stepMs;
  while (b - ms <= maxMs && f(b) === v0) { a = b; b += stepMs; }
  if (b - ms > maxMs) return null;
  for (let i = 0; i < 20; i++) { const mid = (a + b) / 2; if (f(mid) === v0) a = mid; else b = mid; }
  return b;
}
export function prevChange(f, ms, stepMs = 30 * 60000, maxMs = 3 * DAY) {
  const v0 = f(ms); let b = ms, a = ms - stepMs;
  while (ms - a <= maxMs && f(a) === v0) { b = a; a -= stepMs; }
  if (ms - a > maxMs) return null;
  for (let i = 0; i < 20; i++) { const mid = (a + b) / 2; if (f(mid) === v0) b = mid; else a = mid; }
  return b;
}
// Fast longitude of one body (for searches). sid=true gives Lahiri sidereal.
export function lonAt(ms, body, sid = false) {
  let flags = MOSEPH;
  if (sid) { swe.swe_set_sid_mode(SIDM_LAHIRI, 0, 0); flags |= SIDEREAL; }
  return swe.swe_calc_ut(jdFromMs(ms), PIDS[body], flags)[0];
}
export function ayanamsaAt(ms) { return ayanamsa(jdFromMs(ms), SIDM_LAHIRI); }
// ---------- eclipses ----------
// sweph-wasm returns the phase-time array directly. Lunar type comes from which phases exist;
// solar type from the Moon's apparent size compared with the Sun's at maximum (central eclipses only).
export function eclipsesBetween(fromMs, toMs) {
  const out = [], jdEnd = jdFromMs(toMs);
  for (const solar of [true, false]) {
    let jd = jdFromMs(fromMs);
    for (let i = 0; i < 12; i++) {
      const r = solar ? swe.swe_sol_eclipse_when_glob(jd, MOSEPH, 0, false) : swe.swe_lun_eclipse_when(jd, MOSEPH, 0, false);
      const d = Array.isArray(r) ? r : r && r.data;
      const t = d ? d[0] : 0;
      if (!t || t > jdEnd) break;
      const ms = jdToMs(t);
      let kind;
      if (solar) {
        if (!d[6]) kind = "partial";
        else { const sun = swe.swe_calc_ut(t, 0, MOSEPH), moon = swe.swe_calc_ut(t, 1, MOSEPH);
          kind = (1737.4 / moon[2]) / (696000 / sun[2]) >= 1 ? "total" : "annular"; }
      } else kind = d[4] ? "total" : d[2] ? "partial" : "penumbral";
      out.push({ ms, solar, kind, lon: lonAt(ms, solar ? "Sun" : "Moon"), sidLon: lonAt(ms, solar ? "Sun" : "Moon", true) });
      jd = t + 10;
    }
  }
  return out.sort((a, b) => a.ms - b.ms);
}
