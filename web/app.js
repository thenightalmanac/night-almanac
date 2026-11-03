import SwissEPH from "sweph-wasm";
import * as E from "./engine.js";
import * as F from "./forecast.js";
import * as A from "./areas.js";
import * as N from "./numerology.js";
import * as L from "./lore.js";
import * as C from "./compat.js";
import { HOUSE_W, HOUSE_V, HOUSE_SHORT, PLANET, SIGN, LOT, PEAK, sectNote, cap, ELEMENT_OF, MODE_OF, ELEMENT, MODE,
  ASPECT, BIG3, GLOSS, WQ, EXALT, ZR_SIGN, PERIOD_PLANET, HOUSE_SHOWS, PLANET_RUNS, PLANET_ROLE, SIGN_STYLE, PLANET_ELEMENT, RISING_ELEMENT, ELEMENT_LIFE, MISSING_EL, MODE_LIFE, ASP_PRACT, SIGN_PARTNER, SIGN_CAREER, SIGN_MONEY, SIGN_HOME } from "./meanings.js";

// ---------------------------------------------------------------- setup
const WASM_B64 = window.__SWE_WASM_B64;
// Public link to this app's source code (required by the AGPL).
const SOURCE_URL = "https://github.com/thenightalmanac/night-almanac";
const realFetch = window.fetch.bind(window);
window.fetch = (u, o) => {
  if (String(u).endsWith("swisseph.wasm")) {
    const bin = Uint8Array.from(atob(WASM_B64), (c) => c.charCodeAt(0));
    return Promise.resolve(new Response(bin, { headers: { "content-type": "application/wasm" } }));
  }
  return realFetch(u, o);
};

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtD = (ms) => new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
const fmtMY = (ms) => new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
const fmtY = (ms) => new Date(ms).getUTCFullYear();
const DAY = 86400000, YEAR = 365.25 * DAY;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
// glossary term: dotted-underlined button that opens a definition
const g = (key, text) => `<span class="gl" role="button" tabindex="0" data-g="${key}">${text}</span>`;
const WORLD_PATH = window.__WORLD_PATH || "";
const sysTag = (sys) => `<span class="systag systag-${sys.toLowerCase()}">${sys}</span>`;

const CITIES = [
  ["New York, NY", 40.7128, -74.006, "America/New_York"], ["Los Angeles, CA", 34.0522, -118.2437, "America/Los_Angeles"],
  ["Chicago, IL", 41.8781, -87.6298, "America/Chicago"], ["Houston, TX", 29.7604, -95.3698, "America/Chicago"],
  ["San Francisco, CA", 37.7749, -122.4194, "America/Los_Angeles"], ["Seattle, WA", 47.6062, -122.3321, "America/Los_Angeles"],
  ["Denver, CO", 39.7392, -104.9903, "America/Denver"], ["Phoenix, AZ", 33.4484, -112.074, "America/Phoenix"],
  ["Atlanta, GA", 33.749, -84.388, "America/New_York"], ["Miami, FL", 25.7617, -80.1918, "America/New_York"],
  ["Washington, DC", 38.9072, -77.0369, "America/New_York"], ["Boston, MA", 42.3601, -71.0589, "America/New_York"],
  ["New Orleans, LA", 29.9511, -90.0715, "America/Chicago"], ["Mexico City", 19.4326, -99.1332, "America/Mexico_City"],
  ["Monterrey", 25.6866, -100.3161, "America/Monterrey"], ["Toronto", 43.6532, -79.3832, "America/Toronto"],
  ["London", 51.5074, -0.1278, "Europe/London"], ["Paris", 48.8566, 2.3522, "Europe/Paris"],
  ["Berlin", 52.52, 13.405, "Europe/Berlin"], ["Madrid", 40.4168, -3.7038, "Europe/Madrid"],
  ["Rome", 41.9028, 12.4964, "Europe/Rome"], ["Lagos", 6.5244, 3.3792, "Africa/Lagos"],
  ["Cairo", 30.0444, 31.2357, "Africa/Cairo"], ["Delhi", 28.6139, 77.209, "Asia/Kolkata"],
  ["Mumbai", 19.076, 72.8777, "Asia/Kolkata"], ["Chennai", 13.0827, 80.2707, "Asia/Kolkata"],
  ["Manila", 14.5995, 120.9842, "Asia/Manila"], ["Tokyo", 35.6762, 139.6503, "Asia/Tokyo"],
  ["Seoul", 37.5665, 126.978, "Asia/Seoul"], ["Beijing", 39.9042, 116.4074, "Asia/Shanghai"],
  ["Sydney", -33.8688, 151.2093, "Australia/Sydney"], ["São Paulo", -23.5505, -46.6333, "America/Sao_Paulo"],
];

const SAMPLE = { y: 1990, m: 6, d: 15, h: 14, mi: 30, lat: 40.7128, lon: -74.006, tz: "America/New_York",
  place: "New York, NY", reliability: "certificate", name: "Example person" };
const SAMPLE_EVENTS = [
  { id: "s1", date: "2012-05-20", label: "Example: first full-time job", area: "career" },
  { id: "s2", date: "2016-09-03", label: "Example: moved to a new city", area: "home" },
  { id: "s3", date: "2019-10-12", label: "Example: got married", area: "relationship" },
  { id: "s4", date: "2021-02-08", label: "Example: knee surgery", area: "health" },
];

const S = { birth: null, isExample: true, chart: null, zrS: null, zrF: null, zrE: null, dasha: null, events: [],
  tab: "today", dayOff: 0, fc: null, tlZoom: "life", tlSel: null, tlBoth: false, ask: null, askMode: "natal", chartSel: "Sun",
  sys: store.get("nightalmanac.sys", "western") };
const isV = () => S.sys === "vedic";
const SYS = () => (isV() ? "Vedic" : "Western");

// ---------------------------------------------------------------- compute
function load(birth, isExample) {
  S.birth = birth; S.isExample = isExample;
  S.chart = E.computeChart(birth);
  S.zrS = E.zodiacalReleasing(S.chart, "Spirit", 95);
  S.zrF = E.zodiacalReleasing(S.chart, "Fortune", 95);
  S.zrE = E.zodiacalReleasing(S.chart, "Eros", 95);
  S.dasha = E.vimshottari(S.chart);
  S.prof = E.profectionYears(S.chart, 95);
  S.events = isExample ? SAMPLE_EVENTS.slice() : store.get("nightalmanac.events", []);
  S.ask = null; S.tlSel = null; S.fc = null; S.sade = null; S.acg = null; S.eclAll = null; S.lore = null; S.sr = null; S.mapPt = null; S.mCache = {};
}
const reliabilityText = { certificate: "from a birth certificate or hospital record", family: "from family memory", unknown: "unknown or a rough guess" };
function timeWarning(kind) {
  const r = S.birth.reliability;
  if (r === "certificate") return "";
  const what = {
    houses: "Results that depend on houses can shift if the birth time is off by about an hour or more.",
    kp: "KP answers can change with just a few minutes of error, so treat this as uncertain. The horary option doesn't need a birth time.",
  }[kind];
  return `<p class="warn"><strong>Birth time is ${esc(reliabilityText[r])}.</strong> ${what}</p>`;
}
const houseRuler = (h) => E.RULERS[(E.signIdx(S.chart.western.asc) + h - 1) % 12];

// ---------------------------------------------------------------- shell
function sysSwitch(extraClass = "") {
  return `<div class="sysswitch ${extraClass}" role="group" aria-label="Astrology system">
    <button type="button" class="js-sys${!isV() ? " on" : ""}" data-sys="western" aria-pressed="${!isV()}">Western</button>
    <button type="button" class="js-sys${isV() ? " on" : ""}" data-sys="vedic" aria-pressed="${isV()}">Vedic</button>
  </div>`;
}
function chartBar() {
  const b = S.birth;
  const t = new Date(Date.UTC(2000, 0, 1, b.h, b.mi)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  const dt = new Date(Date.UTC(b.y, b.m - 1, b.d)).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  $("#chartbar").innerHTML = `
    <div class="cb-who">
      ${S.isExample ? '<span class="pill pill-example">Example chart</span>' : ""}
      <span class="cb-name">${esc(b.name || "Your chart")}</span>
      <span class="cb-meta">${esc(dt)} · ${esc(t)} · ${esc(b.place || `${b.lat.toFixed(3)}, ${b.lon.toFixed(3)}`)}</span>
    </div>
    <div class="cb-actions">${sysSwitch()}<button class="btn" id="editBirth" type="button">${S.isExample ? "Enter your birth details" : "Edit birth details"}</button></div>`;
  $("#editBirth").onclick = () => openForm();
}
const TABS = [["today", "Today"], ["month", "Your month"], ["year", "Your year"], ["chart", "Your chart"], ["compat", "Compatibility"], ["ask", "Ask a question"], ["timeline", "Life timeline"], ["map", "World map"], ["lore", "Star lore"], ["numerology", "Numerology"], ["events", "Check past events"]];
function nav() {
  $("#tabs").innerHTML = TABS.map(([id, label]) =>
    `<a href="#${id}" class="tab${S.tab === id ? " on" : ""}" ${S.tab === id ? 'aria-current="page"' : ""}>${label}</a>`).join("");
}
function render() {
  chartBar(); nav();
  $("#signs").innerHTML = signsStrip();
  $("#view").innerHTML = ({ today: viewToday, month: viewMonth, year: viewYear, ask: viewAsk, timeline: viewTimeline, events: viewEvents, chart: viewChart, map: viewMap, about: viewAbout, numerology: viewNumerology, lore: viewLore, compat: viewCompat }[S.tab])();
  ({ today: bindToday, month: bindMonth, ask: bindAsk, timeline: bindTimeline, events: bindEvents, chart: bindChart, year: bindYear, map: bindMap, about: bindAbout, numerology: bindNumerology, lore: bindLore, compat: bindCompat }[S.tab] || (() => {}))();
}
function route() {
  const h = location.hash.replace("#", "");
  S.tab = TABS.some(([id]) => id === h) || h === "about" ? h : "today";
  render();
}
function tabHead(title, text) {
  return `<section class="intro">
    <div class="intro-top"><p class="eyebrow">${SYS()} astrology</p>${sysSwitch("small")}</div>
    <h2>${title}</h2><p>${text}</p></section>`;
}

// ---------------------------------------------------------------- Signs strip
function signsStrip() {
  const w = S.chart.western, v = S.chart.vedic;
  const item = (k, sign, extra = "") => `<div class="sg"><dt>${k}</dt><dd>${sign}${extra ? `<span class="sg-x">${extra}</span>` : ""}</dd></div>`;
  const west = `<div class="signs-sys${!isV() ? " active" : ""}"><p class="trad">Western signs</p><dl>
      ${item("Sun", w.planets.Sun.sign)}${item("Moon", w.planets.Moon.sign)}${item("Rising", E.SIGNS[E.signIdx(w.asc)])}</dl></div>`;
  const ved = `<div class="signs-sys${isV() ? " active" : ""}"><p class="trad">Vedic signs</p><dl>
      ${item("Sun", v.planets.Sun.sign)}${item("Moon", v.planets.Moon.sign, v.planets.Moon.nakshatra)}${item("Rising", E.SIGNS[E.signIdx(v.lagna)])}</dl></div>`;
  return `
  <div class="signs-row">${isV() ? ved + west : west + ved}</div>
  <p class="fine signs-note">Your Sun is ${BIG3.Sun}. Your Moon is ${BIG3.Moon}. Your ${g("rising", "rising sign")} is ${BIG3.Rising}. Western and Vedic astrology ${g("sidereal", "measure the zodiac differently")}, so your signs can differ.</p>`;
}

// ---------------------------------------------------------------- Your year
function startHere() {
  if (store.get("nightalmanac.introDone", false)) return "";
  return `<article class="card start" id="startCard">
    <header class="card-h"><h3>New to astrology? Start here</h3><button class="link" type="button" id="startClose">Got it, hide this</button></header>
    <ol class="steps">
      <li><strong>Your chart is a snapshot of the sky when you were born.</strong> The app works out where the Sun, Moon and planets were from your birth date, time and place.</li>
      <li><strong>Pick a system with the Western / Vedic switch at the top.</strong> Western is the astrology most common in the US and Europe. Vedic comes from India. They measure the zodiac differently, so each gives different signs and readings.</li>
      <li><strong>Read what's going on now.</strong> This page is your daily horoscope, split into love, career, money, home, health and friends. <a href="#month">Your month</a> goes week by week, and <a href="#year">Your year</a> covers the next 12 months. <a href="#ask">Ask a question</a> answers a specific topic like work or marriage, <a href="#timeline">Life timeline</a> shows the bigger picture. <a href="#compat">Compatibility</a> compares your chart with someone else's, and <a href="#lore">Star lore</a> has the older techniques: planetary hours, decans and tarot, fixed stars and the Hindu almanac.</li>
      <li><strong>Tap any word with a dotted underline</strong>, like ${g("house", "house")}, to see what it means.</li>
    </ol>
    <p class="fine">Readings describe what each tradition says. Astrology hasn't been shown to predict events, so use this for reflection, not instructions.</p>
  </article>`;
}
function bindYear() {
  const c = $("#startClose");
  if (c) c.onclick = () => { store.set("nightalmanac.introDone", true); $("#startCard").remove(); };
}
function viewYear() { return (isV() ? viewYearVedic() : viewYearWestern()) + yearAreasHTML() + forecastHTML(); }
// Tone of a zodiacal-releasing period: set by the sign's ruling planet and any planets in that sign
function zrTone(si) {
  const w = S.chart.western, sign = E.SIGNS[si], ruler = E.RULERS[si], rp = w.planets[ruler], day = w.sect === "day", R = [];
  let sc = 0;
  if (ruler === "Jupiter" || ruler === "Venus") { const sect = (day && ruler === "Jupiter") || (!day && ruler === "Venus"); sc += sect ? 3 : 2; R.push(`${sign} is ruled by ${ruler}, a traditionally helpful planet${sect ? " (the most helpful one for your chart)" : ""}`); }
  else if (ruler === "Mars" || ruler === "Saturn") { const contrary = (day && ruler === "Mars") || (!day && ruler === "Saturn"); sc -= contrary ? 2 : 1; R.push(`${sign} is ruled by ${ruler}, a traditionally challenging planet${contrary ? "" : " (the more manageable one for your chart)"}`); }
  else R.push(`${sign} is ruled by ${ruler}, a neutral planet`);
  const hp = GOOD_HOUSE[rp.house]; sc += hp;
  R.push(`in your chart ${ruler} sits in your ${E.ordinal(rp.house)} house (${HOUSE_W[rp.house].split(",")[0]}), ${hp >= 2 ? "a strong place" : hp === 1 ? "a helpful place" : hp === 0 ? "a neutral place" : "a weaker place"}`);
  const [dp, dt] = dignity(ruler, rp.sign); if (dt) { sc += dp; R.push(`${ruler} is ${dt}`); }
  for (const [n, p] of Object.entries(w.planets)) {
    if (!E.CLASSICAL.includes(n) || p.sign !== sign) continue;
    if (n === "Jupiter" || n === "Venus") { sc += 1.5; R.push(`your natal ${n} (helpful) sits in ${sign}`); }
    else if (n === "Mars" || n === "Saturn") { sc -= 1.5; R.push(`your natal ${n} (challenging) sits in ${sign}`); }
  }
  return { tone: sc >= 3 ? "good" : sc <= -1 ? "low" : "mixed", reasons: R, ruler };
}
const ZR_TONE_MEANS = {
  good: { Spirit: "things in your work life are more likely to go your way, with help from others and fewer obstacles", Fortune: "your day-to-day circumstances are more likely to feel supported and comfortable" },
  mixed: { Spirit: "expect a mix of progress and effort at work: some things fall into place, others take more push", Fortune: "expect a mix of ease and effort in daily life" },
  low: { Spirit: "work may bring more pressure, obstacles or slow progress than usual, so steady effort and patience matter", Fortune: "daily life may feel more demanding, with more to manage and less slack, so pace yourself" },
};
function zrBlock(zr, lotName, now) {
  const z = E.zrAt(zr, now);
  if (!z) return "";
  const l1 = z.l1, l2 = z.l2, t1 = zrTone(l1.si), t2 = zrTone(l2.si);
  const title = lotName === "Spirit" ? "Career & purpose" : "Life circumstances";
  const ctx = lotName === "Spirit" ? "work" : "daily life";
  const intensity = l2.peak ? `It's also a ${g("peak", peakPlain(l2.peak))}, so expect more to happen and more visibility than usual, for better or worse.`
    : "It isn't a peak, so changes tend to build quietly rather than arrive all at once.";
  return `
  <article class="card">
    <header class="card-h"><h3>${title}</h3>${sysTag("Western")}</header>
    <p class="inshort"><strong>In short:</strong> until ${fmtMY(l2.end)}, ${ZR_SIGN[lotName][l2.sign]}. Tradition rates this stretch ${TONE_WORD[t2.tone].toLowerCase()}.</p>
    <p><strong>What it looks like.</strong> Right now (${fmtMY(l2.start)} – ${fmtMY(l2.end)}) you're in a <strong>${l2.sign}</strong> sub-period, which means ${ZR_SIGN[lotName][l2.sign]}. ${intensity}${l2.loosing ? ` It began with a ${g("loosing", "turning point")}: a change of direction for your ${ctx}.` : ""}</p>
    <div class="toneblock"><p><strong>Good news or bad news?</strong> ${tonePill(t2)} Tradition reads this as <strong>${TONE_WORD[t2.tone].toLowerCase()}</strong>: ${ZR_TONE_MEANS[t2.tone][lotName]}. Why: ${t2.reasons.join("; ")}.</p>
      <p class="fine">${TONE_ADVICE[t2.tone]}</p></div>
    <p class="fine"><strong>The bigger chapter:</strong> it sits inside a longer ${l1.sign} chapter (${fmtY(l1.start)}–${fmtY(l1.end)}), where ${ZR_SIGN[lotName][l1.sign]}. Tradition rates that chapter ${TONE_WORD[t1.tone].toLowerCase()} overall. (Technique: ${g("zr", "zodiacal releasing")} from the Lot of ${lotName}.)</p>
  </article>`;
}

// ---- "good news or bad news?" — what the tradition says about a year or period
const TONE_WORD = { good: "Supportive", mixed: "Mixed", low: "Challenging", quiet: "Quiet" };
const TONE_ADVICE = {
  good: "Tradition reads this as a favorable stretch. It's a good time to act on plans in this area, though results still depend on what you do with it.",
  mixed: "Tradition reads this as a mix of help and effort. Things can go well, but they're less likely to fall into place on their own.",
  low: "Tradition reads this as a more demanding stretch: possible delays, friction or extra responsibility. It isn't fixed. Astrologers usually advise patience, planning ahead and steady effort, and how you respond matters more than the rating.",
};
function westYearTone(sign, lord, focusHouse) {
  const w = S.chart.western, lp = w.planets[lord], day = w.sect === "day", R = [];
  let sc = 0;
  if (lord === "Jupiter" || lord === "Venus") { const sect = (day && lord === "Jupiter") || (!day && lord === "Venus"); sc += sect ? 3 : 2; R.push(`${lord}, a traditionally helpful planet, runs the year${sect ? " (the most helpful one for your chart)" : ""}`); }
  else if (lord === "Mars" || lord === "Saturn") { const contrary = (day && lord === "Mars") || (!day && lord === "Saturn"); sc -= contrary ? 2 : 1; R.push(`${lord}, a traditionally challenging planet, runs the year${contrary ? "" : " (the more manageable one for your chart)"}`); }
  else R.push(`${lord}, a neutral planet, runs the year`);
  const hp = GOOD_HOUSE[lp.house]; sc += hp;
  R.push(`${lord} sits in your ${E.ordinal(lp.house)} house, ${hp >= 2 ? "a strong place" : hp === 1 ? "a helpful place" : hp === 0 ? "a neutral place" : "a weaker place"}`);
  const [dp, dt] = dignity(lord, lp.sign); if (dt) { sc += dp; R.push(`${lord} is ${dt}`); }
  if (lp.retro) { sc -= 1; R.push(`${lord} was retrograde, read as delays or do-overs`); }
  for (const [n, p] of Object.entries(w.planets)) {
    if (!E.CLASSICAL.includes(n) || n === lord || p.sign !== sign) continue;
    if (n === "Jupiter" || n === "Venus") { sc += 1; R.push(`${n} (helpful) is also activated`); }
    if (n === "Mars" || n === "Saturn") { sc -= 1; R.push(`${n} (challenging) is also activated`); }
  }
  const tone = sc >= 3 ? "good" : sc <= -1 ? "low" : "mixed";
  return { tone, reasons: R };
}
const V_GOOD = { 1: 2, 4: 2, 5: 2, 7: 2, 9: 2, 10: 2, 11: 1, 2: 0, 3: 0, 6: -2, 8: -2, 12: -2 };
// Vedic functional nature: whether a planet is good or bad for THIS rising sign, from the houses it rules
// (Parashari rules: trine lords good, 6/8/12 lords difficult, a planet ruling both a kendra and a trine is a yogakaraka)
const HOUSE_NAME_V = { 1: "self", 2: "money and family", 3: "effort", 4: "home", 5: "children and creativity", 6: "conflict and debt",
  7: "partnership", 8: "sudden change", 9: "luck", 10: "career", 11: "gains", 12: "loss and expense" };
function functionalNature(p) {
  if (p === "Rahu" || p === "Ketu") {
    const sl = E.RULERS[E.signIdx(S.chart.vedic.planets[p].lon)];
    if (sl === p) return { sc: 0, text: `${p} rules no house` };
    const f = functionalNature(sl);
    return { sc: f.sc / 2, kind: f.kind, text: `${p} rules no house, so it acts like ${sl}, the ruler of the sign it occupies (${f.kind || "neutral"} for you)` };
  }
  const lag = E.signIdx(S.chart.vedic.lagna);
  const owns = []; for (let h = 1; h <= 12; h++) if (E.RULERS[(lag + h - 1) % 12] === p) owns.push(h);
  const tri = owns.filter((h) => h === 5 || h === 9), ken = owns.filter((h) => [4, 7, 10].includes(h)), lagna = owns.includes(1);
  let sc = 0, kind;
  if (lagna) sc += 2;
  sc += 2 * tri.length;
  const yk = (tri.length || lagna) && ken.length && !lagna ? true : (tri.length && ken.length);
  if (yk) sc += 2;
  if (ken.length && !tri.length && !lagna) sc += ["Jupiter", "Venus", "Mercury", "Moon"].includes(p) ? -1 : 1;
  for (const h of owns) {
    if (h === 6) sc -= 2;
    if (h === 12) sc -= owns.length > 1 ? 0 : 1;
    if (h === 8 && !lagna && !["Sun", "Moon"].includes(p)) sc -= 2;
    if (h === 3 || h === 11) sc -= 1;
  }
  kind = yk ? "an especially lucky planet (yogakaraka)" : sc >= 2 ? "a helpful planet" : sc <= -1 ? "a difficult planet" : "a neutral planet";
  const list = owns.map((h) => `${E.ordinal(h)} (${HOUSE_NAME_V[h]})`).join(" and ");
  return { sc, kind, text: `for your ${E.SIGNS[lag]} rising sign, ${p} rules your ${list} house${owns.length > 1 ? "s" : ""}, which makes it ${kind} for you` };
}
function vedicPeriodTone(lord) {
  const p = S.chart.vedic.planets[lord], R = [];
  let sc = 0;
  const fn = functionalNature(lord);
  sc += fn.sc; R.push(fn.text);
  if (["Jupiter", "Venus"].includes(lord)) sc += 0.5; else if (["Saturn", "Mars", "Rahu", "Ketu", "Sun"].includes(lord)) sc -= 0.5;
  const hp = V_GOOD[p.house]; sc += hp;
  R.push(`it sits in your ${E.ordinal(p.house)} house, ${hp >= 2 ? "one of the strongest places" : hp === 1 ? "a helpful place" : hp === 0 ? "a neutral place" : "one of the harder places"}`);
  const [dp, dt] = dignity(lord, p.sign); if (dt) { sc += dp; R.push(`it's ${dt}`); }
  const tone = sc >= 3 ? "good" : sc <= -1 ? "low" : "mixed";
  return { tone, reasons: R };
}
function tonePill(t) { return `<span class="tone tone-${t.tone}">${TONE_WORD[t.tone]}</span>`; }
function toneBlock(t, what) {
  return `<div class="toneblock"><p><strong>Good news or bad news?</strong> ${tonePill(t)} Tradition reads ${what} as <strong>${TONE_WORD[t.tone].toLowerCase()}</strong>, because ${t.reasons.join("; ")}.</p>
    <p class="fine">${TONE_ADVICE[t.tone]}</p></div>`;
}
function viewYearWestern() {
  const now = Date.now(), c = S.chart;
  const pr = E.profection(c, now), lordP = pr.lordNatal;
  const changes = westernChanges(now).slice(0, 5);
  const yt = westYearTone(pr.sign, pr.lord, pr.house);
  return `
  ${timeWarning("houses")}
  <section class="year-hero">
    <div class="yh-main">
      <p class="eyebrow">${sysTag("Western")} Your year · age ${pr.age}</p>
      <h2>A ${HOUSE_SHORT[pr.house]} year</h2>
      <p class="yh-topic">Focus on ${esc(HOUSE_W[pr.house])}</p>
    </div>
    <dl class="yh-facts">
      <div><dt>Area of life</dt><dd>${E.ordinal(pr.house)} ${g("house", "house")}</dd></div>
      <div><dt>Year's sign</dt><dd>${pr.sign}</dd></div>
      <div><dt>${g("lordyear", "Year's planet")}</dt><dd>${pr.lord}</dd></div>
      <div><dt>Tradition says</dt><dd>${tonePill(yt)}</dd></div>
    </dl>
  </section>
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>What this year is about</h3>${sysTag("Western")}</header>
      <p class="inshort"><strong>In short:</strong> this year leans toward ${HOUSE_W[pr.house]}, with ${pr.lord} setting the tone. Tradition rates it ${TONE_WORD[yt.tone].toLowerCase()}.</p>
      <p>Western astrology's ${g("profection", "annual profections")} move your focus to a new area of life each birthday. This year it's your ${E.ordinal(pr.house)} house. The planet in charge is <strong>${pr.lord}</strong>, which stands for ${PLANET[pr.lord]}. In your chart ${pr.lord} sits in the ${E.ordinal(lordP.house)} house, so this year's ${HOUSE_SHORT[pr.house]} themes connect to ${esc(HOUSE_W[lordP.house])}.${lordP.retro ? ` ${pr.lord} was ${g("retro", "retrograde")} at birth, read as revisiting or reviewing.` : ""} ${sectNote(pr.lord, c.western.sect)}</p>
      <p>${pr.activated.length ? `Your natal ${pr.activated.join(" and ")} ${pr.activated.length > 1 ? "are" : "is"} in ${pr.sign}, so ${pr.activated.length > 1 ? "they're" : "it's"} switched on this year too.` : `None of your planets are in ${pr.sign}, so ${pr.lord} does most of the work.`}</p>
      ${toneBlock(yt, "this year")}
      <details class="basis-d"><summary>How this was worked out</summary><ul class="basis"><li>Rising sign ${E.fmtDeg(c.western.asc)} → count ${pr.age} signs forward → ${pr.sign}</li><li>Traditional ruler of ${pr.sign}: ${pr.lord}</li></ul></details>
    </article>
    ${zrBlock(S.zrS, "Spirit", now)}
    ${zrBlock(S.zrF, "Fortune", now)}
  </div>
  <article class="card">
    <header class="card-h"><h3>Coming changes</h3>${sysTag("Western")}</header>
    <ol class="changes">${changes.map((x) => `<li><span class="mono">${fmtD(x.when)}</span><span>${x.tone ? tonePill(x.tone) + " " : ""}${esc(x.what)}</span></li>`).join("")}</ol>
    <p class="fine">Ratings show what the tradition says. They describe tendencies, not fixed outcomes; your own choices still shape how a year goes.</p>
  </article>
  ${yearAhead()}`;
}
function yearAhead() {
  const now = Date.now(), ys = S.prof.filter((y) => y.end > now).slice(0, 4);
  return `<article class="card">
    <header class="card-h"><h3>Your next few years</h3>${sysTag("Western")}</header>
    <ol class="years">${ys.map((y) => { const t = westYearTone(y.sign, y.lord, y.house);
      return `<li><div class="yr-h"><span class="mono">${fmtMY(y.start)} – ${fmtMY(y.end)}</span>${tonePill(t)}</div>
        <p><strong>${cap(HOUSE_W[y.house])}</strong> (${E.ordinal(y.house)} house), run by ${y.lord}.</p>
        <p class="fine">Why: ${esc(t.reasons.join("; "))}.</p></li>`; }).join("")}</ol>
    <p class="fine">Each year runs birthday to birthday. A "challenging" year is read as one that asks more of you, not one where things must go wrong.</p>
  </article>`;
}
function westernChanges(now) {
  const items = [];
  const p = S.prof.find((y) => y.start <= now && now < y.end);
  const nxt = p && S.prof.find((y) => y.start >= p.end - DAY);
  if (nxt) { const t = westYearTone(nxt.sign, nxt.lord, nxt.house);
    items.push({ when: nxt.start, what: `Your birthday: for the next 12 months, focus shifts to ${HOUSE_W[nxt.house]} (${E.ordinal(nxt.house)} house). ${nxt.lord} runs that year, which tradition rates ${TONE_WORD[t.tone].toLowerCase()}.`, tone: t }); }
  for (const [zr, name, lot] of [[S.zrS, "Career & purpose", "Spirit"], [S.zrF, "Life circumstances", "Fortune"]]) {
    const z = E.zrAt(zr, now);
    if (!z) continue;
    const i = z.l1.level2.indexOf(z.l2), nx = z.l1.level2[i + 1] || null;
    const nxs = nx || { sign: E.SIGNS[(z.l1.si + 1) % 12], si: (z.l1.si + 1) % 12, start: z.l1.end };
    const t = zrTone(nxs.si);
    items.push({ when: nxs.start, tone: t, what: `${name}: ${nx ? "" : "a new long chapter begins. "}${cap(ZR_SIGN[lot][nxs.sign])}.${nx && nx.peak ? " It's a high point, so expect more to happen." : ""}${nx && nx.loosing ? " It starts with a turning point." : ""} Tradition rates it ${TONE_WORD[t.tone].toLowerCase()}.` });
  }
  return items.sort((a, b) => a.when - b.when);
}
function viewYearVedic() {
  const now = Date.now(), c = S.chart, v = c.vedic.planets;
  const d = E.dashaAt(S.dasha, now);
  if (!d) return "<p>No Vedic period data for this date.</p>";
  const i = d.md.antardashas.indexOf(d.ad);
  const next = d.md.antardashas.slice(i + 1, i + 5);
  const nextMd = S.dasha.mahadashas[S.dasha.mahadashas.indexOf(d.md) + 1];
  const mt = vedicPeriodTone(d.md.lord), at = vedicPeriodTone(d.ad.lord);
  return `
  ${timeWarning("houses")}
  <section class="year-hero">
    <div class="yh-main">
      <p class="eyebrow">${sysTag("Vedic")} Your current period</p>
      <h2>A ${d.md.lord}–${d.ad.lord} period</h2>
      <p class="yh-topic">Right now, mainly about ${HOUSE_SHOWS[v[d.ad.lord].house]}</p>
    </div>
    <dl class="yh-facts">
      <div><dt>Main period</dt><dd>${d.md.lord}</dd></div>
      <div><dt>Sub-period</dt><dd>${d.ad.lord}</dd></div>
      <div><dt>Until</dt><dd>${fmtMY(d.ad.end)}</dd></div>
      <div><dt>Tradition says</dt><dd>${tonePill(at)}</dd></div>
    </dl>
  </section>
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>The long period: ${d.md.lord}</h3>${sysTag("Vedic")}</header>
      <p class="inshort"><strong>In short:</strong> from ${fmtY(d.md.start)} to ${fmtY(d.md.end)}, life is expected to center on ${HOUSE_SHOWS[v[d.md.lord].house]}. Tradition rates this period ${TONE_WORD[mt.tone].toLowerCase()}.</p>
      <p><strong>What it looks like.</strong> Vedic astrology divides life into ${g("dasha", "dashas")}, long periods each run by one planet. A ${d.md.lord} period ${PERIOD_PLANET[d.md.lord]}. In your chart ${d.md.lord} sits in your ${E.ordinal(v[d.md.lord].house)} ${g("house", "house")}, so for you it shows up mainly through ${HOUSE_SHOWS[v[d.md.lord].house]}.</p>
      ${toneBlock(mt, "this long period")}
    </article>
    <article class="card">
      <header class="card-h"><h3>The current sub-period: ${d.ad.lord}</h3>${sysTag("Vedic")}</header>
      <p class="inshort"><strong>In short:</strong> until ${fmtMY(d.ad.end)}, the focus narrows to ${HOUSE_SHOWS[v[d.ad.lord].house]}. Tradition rates it ${TONE_WORD[at.tone].toLowerCase()}.</p>
      <p><strong>What it looks like.</strong> Inside each long period are shorter sub-periods that steer it. This one is run by <strong>${d.ad.lord}</strong>, which ${PERIOD_PLANET[d.ad.lord]}. ${d.ad.lord} sits in your ${E.ordinal(v[d.ad.lord].house)} house, so expect this to play out through ${HOUSE_SHOWS[v[d.ad.lord].house]}, within the bigger ${d.md.lord} chapter.</p>
      ${toneBlock(at, "this sub-period")}
    </article>
    <article class="card">
      <header class="card-h"><h3>Your Moon's star</h3>${sysTag("Vedic")}</header>
      <p>Your Moon is in ${v.Moon.sign}, in the ${g("nakshatra", "nakshatra")} <strong>${v.Moon.nakshatra}</strong>. Vedic astrology treats the Moon's nakshatra as central to your chart. It's also what sets the order of your dasha periods: you were born in a ${v.Moon.nakLord} period.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>Coming changes</h3>${sysTag("Vedic")}</header>
      <ol class="changes">${next.map((a) => `<li><span class="mono">${fmtD(a.start)}</span><span>${tonePill(vedicPeriodTone(a.lord))} ${d.md.lord}–${a.lord} sub-period: focus moves to ${HOUSE_SHOWS[v[a.lord].house]}</span></li>`).join("")}
      ${nextMd ? `<li><span class="mono">${fmtD(nextMd.start)}</span><span>${tonePill(vedicPeriodTone(nextMd.lord))} New long period of ${nextMd.lord}, centered on ${HOUSE_SHOWS[v[nextMd.lord].house]}</span></li>` : ""}</ol>
    </article>
  </div>`;
}

// ---------------------------------------------------------------- Today (daily horoscope)
function dayMs() { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), 12) + S.dayOff * DAY; }
const dayLabel = (ms) => new Date(ms).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
function dayNav(ms) {
  const iso = new Date(ms).toISOString().slice(0, 10);
  return `<div class="daynav">
    <button class="btn" id="dPrev" type="button" aria-label="Previous day">← Previous day</button>
    <input type="date" id="dPick" value="${iso}" aria-label="Pick a date">
    <button class="btn" id="dNext" type="button" aria-label="Next day">Next day →</button>
    ${S.dayOff ? '<button class="link" id="dToday" type="button">Back to today</button>' : ""}
  </div>`;
}

function moonHero(ms) {
  const T = E.planetsAt(ms), a = E.norm(T.Moon.lon - T.Sun.lon), k = (1 - Math.cos((a * Math.PI) / 180)) / 2;
  const cx = 43, cy = 43, r = 36, rx = Math.abs(Math.cos((a * Math.PI) / 180)) * r, wax = a < 180;
  const outer = wax ? `A ${r} ${r} 0 0 1 ${cx} ${cy + r}` : `A ${r} ${r} 0 0 0 ${cx} ${cy + r}`;
  const crescent = a < 90 || a > 270;
  const sweep = wax ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  const lit = `M ${cx} ${cy - r} ${outer} A ${rx.toFixed(2)} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`;
  const name = a < 10 || a > 350 ? "New moon" : a < 80 ? "Waxing crescent" : a < 100 ? "First quarter" : a < 170 ? "Waxing gibbous"
    : a < 190 ? "Full moon" : a < 260 ? "Waning gibbous" : a < 280 ? "Last quarter" : "Waning crescent";
  const mean = name === "New moon" ? "Tradition sees the new moon as a time to set intentions and plant seeds."
    : name === "Full moon" ? "Tradition sees the full moon as a time when things come to a head and feelings run high."
      : wax ? "While the Moon grows, tradition favors starting, building and saying yes."
        : "While the Moon shrinks, tradition favors finishing, clearing out and letting go.";
  const sign = isV() ? E.SIGNS[E.signIdx(E.planetsAt(ms, "lahiri").Moon.lon)] : E.SIGNS[E.signIdx(T.Moon.lon)];
  return `<section class="card moonhero" aria-label="Moon phase">
    <svg viewBox="0 0 86 86" role="img" aria-label="${name}, ${Math.round(k * 100)} percent lit"><circle class="mh-dark" cx="${cx}" cy="${cy}" r="${r}"/>${k > 0.01 ? `<path class="mh-lit" d="${lit}"/>` : ""}<circle class="mh-ring" cx="${cx}" cy="${cy}" r="${r + 4}"/></svg>
    <div class="mh-txt"><p class="eyebrow">The Moon ${S.dayOff ? "on this day" : "tonight"}</p>
      <p class="mh-name">${name}, in ${sign}</p>
      <p class="fine">${Math.round(k * 100)}% lit. ${mean}</p></div>
  </section>`;
}
function viewToday() {
  const ms = dayMs();
  const label = S.dayOff === 0 ? "Today" : S.dayOff === 1 ? "Tomorrow" : S.dayOff === -1 ? "Yesterday" : "Your day";
  return startHere() + moonHero(ms) + (isV() ? todayVedic(ms, label) : todayWestern(ms, label));
}
// One headline for the day, taken from the same area summary shown below it, so the two never disagree.
const DAY_HEAD = { good: ["Smooth day", "Things should flow more easily than usual. A good day to ask for something or make plans."],
  mixed: ["Steady day", "A normal day, with a mix of easy and harder moments."],
  low: ["Bumpy day", "Expect a little more friction than usual. Keep plans flexible and avoid picking fights."] };
function dayHead(ms, label, tone) {
  const d0 = ms - DAY / 2, o = A.summarize(areaEvents(d0, d0 + DAY - 1, "day"), "day").overall;
  const text = tone && tone[1] === o ? tone[2] : DAY_HEAD[o][1];
  return tabHead(`${label}: ${tone && tone[1] === o ? tone[0] : DAY_HEAD[o][0]}`, `${dayLabel(ms)}. ${text}`);
}
function todayWestern(ms, label) {
  const d = F.westernDay(S.chart, ms);
  const y = S.prof.find((p) => p.start <= ms && ms < p.end);
  const k = y ? Math.floor((ms - y.start) / ((y.end - y.start) / 12)) : 0, mh = y ? ((y.house - 1 + k) % 12) + 1 : null;
  return `
  ${dayHead(ms, label, d.tone)}
  ${dayNav(ms)}
  ${dayAreasHTML(ms)}
  ${skyChartHTML(ms)}
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>Today's theme</h3>${sysTag("Western")}</header>
      <p class="inshort"><strong>In short:</strong> today leans toward ${F.HOUSE_DO[d.moonHouse]}.</p>
      <p>The Moon sets the mood of each day and changes sign every two or three days. Today it's in <strong>${d.moonSign}</strong>, passing through your ${E.ordinal(d.moonHouse)} ${g("house", "house")}, so attention drifts toward ${F.HOUSE_DO[d.moonHouse]}.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>What's touching your chart</h3>${sysTag("Western")}</header>
      ${d.hits.length ? `<ul class="daylist">${d.hits.map((h) => `<li class="${{ 1: "t-up", "-1": "t-down", 0: "t-flat" }[aspectToneClass(h)]}">${esc(h.text)}</li>`).join("")}</ul>`
        : "<p>No close contacts between today's planets and your birth chart. A quiet day astrologically.</p>"}
      <p class="fine">These are today's ${g("transit", "transits")}: where the planets are now compared with your birth chart.</p>
    </article>
    ${d.retro.length ? `<article class="card"><header class="card-h"><h3>Retrogrades</h3>${sysTag("Western")}</header><ul class="daylist">${d.retro.map((r) => `<li>${esc(r.text)}</li>`).join("")}</ul></article>` : ""}
    <article class="card">
      <header class="card-h"><h3>The bigger picture</h3>${sysTag("Western")}</header>
      ${y ? `<p>This year's theme is ${HOUSE_W[y.house]}. This month's ${g("monthprof", "focus")} is ${F.HOUSE_DO[mh]}.</p>` : ""}
      <p><a href="#month">See your month, week by week</a></p>
    </article>
    ${nowCard(false)}
  </div>`;
}
function nowCard(vedic) {
  if (S.dayOff !== 0) return "";
  const lo = loreNow(), tz = lo.loc.tz, h = L.HOUR[lo.cur.planet];
  const extra = vedic
    ? (lo.now < lo.rahu.end ? `<li>Rahu Kaal ${lo.now >= lo.rahu.start ? "<strong>now</strong>" : "today"}: ${fmtT(lo.rahu.start, tz)} to ${fmtT(lo.rahu.end, tz)} ${tonePillL("low", "Avoid new starts")}</li>` : "<li>Today's Rahu Kaal has passed.</li>")
    : (lo.voc ? (lo.voc.isVoid ? `<li>The Moon is <strong>void of course</strong> until ${fmtWhen(lo.voc.exit, tz, lo.now)} ${tonePillL("low", "Wait if you can")}</li>`
        : `<li>Moon not void. Next void period: ${fmtWhen(lo.voc.voidFrom, tz, lo.now)} to ${fmtWhen(lo.voc.exit, tz, lo.now)}</li>`) : "");
  return `<article class="card">
      <header class="card-h"><h3>Right now</h3>${sysTag(vedic ? "Vedic" : "Western")}</header>
      <ul class="plain daylist"><li>${vedic ? "Hora" : "Planetary hour"} of <strong>${lo.cur.planet}</strong> until ${fmtT(lo.cur.end, tz)} ${tonePillL(h.tone)}: good for ${esc(h.good.split(",").slice(0, 2).join(","))}.</li>${extra}</ul>
      <p><a href="#lore">More in Star lore</a></p>
    </article>`;
}
function aspectToneClass(h) {
  const easy = h.type === "trine" || h.type === "sextile", hard = h.type === "square" || h.type === "opposition";
  return easy ? 1 : hard ? -1 : (["Venus", "Jupiter"].includes(h.tp) ? 1 : ["Mars", "Saturn"].includes(h.tp) ? -1 : 0);
}
function todayVedic(ms, label) {
  const d = F.vedicDay(S.chart, S.dasha, ms), v = S.chart.vedic.planets;
  if (!S.sade) S.sade = F.sadeSati(S.chart, Date.now());
  const ss = S.sade;
  const waxing = d.tithi.startsWith("Shukla") || d.tithi.startsWith("Purnima");
  return `
  ${dayHead(ms, label, d.tone)}
  ${dayNav(ms)}
  ${dayAreasHTML(ms)}
  ${skyChartHTML(ms)}
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>Moon from your birth Moon</h3>${sysTag("Vedic")}</header>
      <p class="inshort"><strong>In short:</strong> ${d.mfm[1]}.</p>
      <p>Vedic daily forecasts count from your birth Moon sign (${v.Moon.sign}). Today the Moon is in <strong>${d.moonSign}</strong>, the ${E.ordinal(d.moonFromMoon)} sign from it${d.moonFromMoon === 8 ? `, a ${g("chandrashtama", "Chandrashtama")} day` : ""}.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>Star of the day</h3>${sysTag("Vedic")}</header>
      <p class="inshort"><strong>In short:</strong> a ${d.tara[0]} day. ${d.tara[2]}</p>
      <p>Today's Moon is in the nakshatra <strong>${d.nakshatra}</strong>. Counted from your birth nakshatra (${v.Moon.nakshatra}), that gives today's ${g("tara", "tara")}: ${d.tara[0]}.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>Lunar day</h3>${sysTag("Vedic")}</header>
      <p>The ${g("tithi", "tithi")} is <strong>${d.tithi}</strong>. ${waxing ? "The Moon is growing, which tradition favors for starting things." : "The Moon is shrinking, which tradition favors for finishing and clearing out."}${d.tithi.includes("Ekadashi") ? " Ekadashi is a traditional fasting and prayer day." : ""}</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>Your current period</h3>${sysTag("Vedic")}</header>
      ${d.d ? `<p>${d.d.md.lord} long period › ${d.d.ad.lord} sub-period${d.pd ? ` › short <strong>${d.pd.lord}</strong> phase until ${fmtD(d.pd.end)}` : ""}.</p>
      ${d.pd ? `<p>For these few weeks, the ${d.pd.lord} phase ${PERIOD_PLANET[d.pd.lord].split(":")[0]}, mainly through ${HOUSE_SHOWS[v[d.pd.lord].house]}. Tradition rates ${d.pd.lord} ${TONE_WORD[vedicPeriodTone(d.pd.lord).tone].toLowerCase()} for you.</p>` : ""}` : ""}
    </article>
    <article class="card">
      <header class="card-h"><h3>Sade Sati</h3>${sysTag("Vedic")}</header>
      ${ss.active ? `<p class="inshort"><strong>In short:</strong> you're in ${g("sadesati", "Sade Sati")} until about ${fmtMY(ss.end)}.</p><p>Saturn is passing around your birth Moon sign (${fmtMY(ss.start)} – ${fmtMY(ss.end)}). Tradition sees this as a demanding, character-building stretch. The usual advice is steady effort, patience and not taking big unnecessary risks.</p>`
        : `<p>You're not in ${g("sadesati", "Sade Sati")} now.${ss.next ? ` The next one starts around ${fmtMY(ss.next)}.` : ""}</p>`}
    </article>
    ${nowCard(true)}
  </div>`;
}
function bindToday() {
  bindYear();
  $("#dPrev").onclick = () => { S.dayOff--; render(); };
  $("#dNext").onclick = () => { S.dayOff++; render(); };
  const t = $("#dToday"); if (t) t.onclick = () => { S.dayOff = 0; render(); };
  $("#dPick").onchange = (e) => {
    const v = e.target.value; if (!v) return;
    const n = new Date(); const today = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
    S.dayOff = Math.round((Date.parse(v + "T00:00:00Z") - today) / DAY); render();
  };
}

// ---------------------------------------------------------------- 12-month forecast
function forecastHTML() {
  if (!S.fc) {
    const now = Date.now();
    S.fc = isV() ? F.vedicMonths(S.chart, S.dasha, now) : F.westernMonths(S.chart, S.prof, S.zrS, S.zrF, now);
  }
  const mname = (ms) => new Date(ms).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const day = (ms) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  let pj = null, ps = null;
  const slow = (m) => { const out = []; if (m.jupiter.house !== pj) out.push(m.jupiter); if (m.saturn.house !== ps) out.push(m.saturn); pj = m.jupiter.house; ps = m.saturn.house; return out; };
  const cards = S.fc.map((m) => { const sl = slow(m); return isV() ? `
    <article class="card month">
      <header class="card-h"><h3>${mname(m.a)}</h3>${m.saturn.sadeSati ? '<span class="pill pill-soft">Sade Sati</span>' : ""}</header>
      ${m.d ? `<p class="inshort"><strong>Focus:</strong> ${F.PLANET_DO[m.d.ad.lord]} (${m.d.md.lord}–${m.d.ad.lord} period).</p>` : ""}
      ${m.events.length ? `<ul class="mevents">${m.events.map((e) => `<li><span class="mono">${day(e.ms)}</span><span>${esc(e.text)}</span></li>`).join("")}</ul>` : ""}
      ${sl.length ? `<p class="fine">${sl.map((x) => `<span class="${x.good ? "t-up" : "t-flat"}">${esc(x.text)}</span>`).join(" ")}</p>` : ""}
    </article>` : `
    <article class="card month">
      <header class="card-h"><h3>${mname(m.a)}</h3></header>
      ${m.focus ? `<p class="inshort"><strong>Focus:</strong> ${m.focus}.</p>` : ""}
      ${m.events.length ? `<ul class="mevents">${m.events.map((e) => `<li><span class="mono">${day(e.ms)}</span><span>${esc(e.text)}</span></li>`).join("")}</ul>` : "<p class=\"fine\">No major dates this month. A steadier stretch.</p>"}
      ${sl.length ? `<p class="fine">${sl.map((x) => esc(x.text)).join(" ")}</p>` : ""}
    </article>`; }).join("");
  return `
  <section class="intro fc-intro">
    <h2>Next 12 months</h2>
    <p>${isV() ? "Built from your Vedic periods, including short phases of a few weeks, and from where Jupiter and Saturn move relative to your birth Moon." : `Built from your monthly ${g("monthprof", "focus")} and from the dates when Jupiter, Saturn and Mars make exact contact with key points in your chart.`} Dates are when each influence is strongest. Effects are usually felt for a few days to a few weeks around them.</p>
  </section>
  <div class="months">${cards}</div>`;
}

// ---------------------------------------------------------------- World map (astrocartography)
const MAP_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const PLACE = {
  Sun: ["confidence, visibility and recognition", 1], Moon: ["feeling at home, emotional ties and family", 1],
  Mercury: ["learning, writing, networking and deals", 1], Venus: ["love, friendship, beauty and enjoyment", 2],
  Mars: ["energy and ambition, but also conflict and stress", -1], Jupiter: ["luck, growth and opportunities", 2],
  Saturn: ["hard work and responsibility; it can feel heavy or lonely", -2], Uranus: ["change, freedom and surprises", 0],
  Neptune: ["inspiration and spirituality, but also confusion", -1], Pluto: ["intensity and big transformations", -1],
};
const ANGLE = {
  asc: ["rising line", "you feel it personally: your energy, health and how people see you"],
  mc: ["career line", "it shows up in your career and public reputation"],
  dsc: ["relationship line", "it comes through partners and close relationships"],
  ic: ["home line", "it shows up in home life, family and feeling rooted"],
};
const MAP_CITIES = CITIES.concat([
  ["Vancouver", 49.2827, -123.1207], ["Honolulu", 21.3069, -157.8583], ["Anchorage", 61.2181, -149.9003], ["Lima", -12.0464, -77.0428],
  ["Bogotá", 4.711, -74.0721], ["Buenos Aires", -34.6037, -58.3816], ["Rio de Janeiro", -22.9068, -43.1729], ["Santiago", -33.4489, -70.6693],
  ["Havana", 23.1136, -82.3666], ["Dublin", 53.3498, -6.2603], ["Lisbon", 38.7223, -9.1393], ["Amsterdam", 52.3676, 4.9041],
  ["Stockholm", 59.3293, 18.0686], ["Athens", 37.9838, 23.7275], ["Istanbul", 41.0082, 28.9784], ["Moscow", 55.7558, 37.6173],
  ["Dubai", 25.2048, 55.2708], ["Nairobi", -1.2921, 36.8219], ["Johannesburg", -26.2041, 28.0473], ["Cape Town", -33.9249, 18.4241],
  ["Bangkok", 13.7563, 100.5018], ["Singapore", 1.3521, 103.8198], ["Hong Kong", 22.3193, 114.1694], ["Jakarta", -6.2088, 106.8456],
  ["Auckland", -36.8485, 174.7633], ["Reykjavík", 64.1466, -21.9426], ["Marrakesh", 31.6295, -7.9811], ["Nashville, TN", 36.1627, -86.7816],
  ["Las Vegas, NV", 36.1699, -115.1398], ["Portland, OR", 45.5152, -122.6784], ["Minneapolis, MN", 44.9778, -93.265], ["San Diego, CA", 32.7157, -117.1611],
]);
const GOALS = {
  love: { label: "Love and relationships", lines: { Venus: { dsc: 3, asc: 2, ic: 1 }, Jupiter: { dsc: 2, asc: 1 }, Moon: { dsc: 1 } } },
  career: { label: "Career and recognition", lines: { Sun: { mc: 3, asc: 1 }, Jupiter: { mc: 3 }, Venus: { mc: 1 }, Mercury: { mc: 1 } } },
  home: { label: "Feeling at home", lines: { Moon: { ic: 3, asc: 1 }, Venus: { ic: 2 }, Jupiter: { ic: 2 } } },
  luck: { label: "Luck and growth", lines: { Jupiter: { asc: 3, mc: 3, dsc: 2, ic: 2 }, Venus: { asc: 1 } } },
};
const RADIUS = 700; // km within which a line is felt strongly
function linesNear(lat, lon, maxKm = RADIUS) {
  const out = [];
  for (const p of MAP_PLANETS) for (const k of ["asc", "mc", "dsc", "ic"]) {
    const d = E.distToLine(lat, lon, S.acg[p], k);
    if (d <= maxKm) out.push({ p, k, d });
  }
  return out.sort((a, b) => a.d - b.d);
}
function bestPlaces(goal) {
  const spec = GOALS[goal].lines;
  return MAP_CITIES.map(([name, lat, lon]) => {
    let score = 0; const why = [];
    for (const [p, ks] of Object.entries(spec)) for (const [k, w] of Object.entries(ks)) {
      const d = E.distToLine(lat, lon, S.acg[p], k);
      if (d < RADIUS) { score += w * (1 - d / RADIUS); why.push(`${p} ${ANGLE[k][0]}`); }
    }
    for (const p of ["Saturn", "Mars", "Pluto"]) for (const k of ["asc", "mc", "dsc", "ic"])
      if (E.distToLine(lat, lon, S.acg[p], k) < 400) score -= 0.8;
    return { name, lat, lon, score, why };
  }).filter((c) => c.score > 0.3).sort((a, b) => b.score - a.score).slice(0, 5);
}
function mapSVG() {
  const X = (lon) => (lon + 180) * 2, Y = (lat) => (90 - lat) * 2;
  const shown = S.mapPlanets;
  let s = `<svg class="worldmap" id="worldMap" viewBox="0 0 720 360" role="img" aria-label="World map with your planet lines">`;
  s += `<rect class="wm-sea" x="0" y="0" width="720" height="360"/>`;
  for (let lon = -150; lon <= 150; lon += 30) s += `<line class="wm-grid" x1="${X(lon)}" y1="0" x2="${X(lon)}" y2="360"/>`;
  for (let lat = -60; lat <= 60; lat += 30) s += `<line class="wm-grid" x1="0" y1="${Y(lat)}" x2="720" y2="${Y(lat)}"/>`;
  s += `<path class="wm-land" d="${WORLD_PATH}"/>`;
  const poly = (pts) => {
    const segs = []; let cur = [];
    for (let i = 0; i < pts.length; i++) {
      if (i && Math.abs(pts[i][0] - pts[i - 1][0]) > 90) { segs.push(cur); cur = []; }
      cur.push(`${X(pts[i][0]).toFixed(1)},${Y(pts[i][1]).toFixed(1)}`);
    }
    segs.push(cur);
    return segs.filter((g) => g.length > 1);
  };
  for (const p of MAP_PLANETS) {
    if (!shown.includes(p)) continue;
    const L = S.acg[p], cls = `pl-${p.toLowerCase()}`;
    s += `<line class="wm-line ${cls} k-mc" x1="${X(L.mc)}" y1="${Y(72)}" x2="${X(L.mc)}" y2="${Y(-72)}"/>`;
    s += `<line class="wm-line ${cls} k-ic" x1="${X(L.ic)}" y1="${Y(72)}" x2="${X(L.ic)}" y2="${Y(-72)}"/>`;
    for (const seg of poly(L.asc)) s += `<polyline class="wm-line ${cls} k-asc" points="${seg.join(" ")}"/>`;
    for (const seg of poly(L.dsc)) s += `<polyline class="wm-line ${cls} k-dsc" points="${seg.join(" ")}"/>`;
    s += `<text class="wm-lab ${cls}" x="${X(L.mc) + 2}" y="${Y(70)}">${ABBR[p]}</text>`;
  }
  const b = S.birth;
  s += `<circle class="wm-birth" cx="${X(b.lon)}" cy="${Y(b.lat)}" r="3.5"><title>Birthplace</title></circle>`;
  if (S.mapPt) s += `<circle class="wm-pin" cx="${X(S.mapPt.lon)}" cy="${Y(S.mapPt.lat)}" r="5"/>`;
  return s + "</svg>";
}
function placeReading(pt) {
  const near = linesNear(pt.lat, pt.lon);
  const name = pt.name || `${Math.abs(pt.lat).toFixed(1)}°${pt.lat >= 0 ? "N" : "S"}, ${Math.abs(pt.lon).toFixed(1)}°${pt.lon >= 0 ? "E" : "W"}`;
  if (!near.length) return `<h3>${esc(name)}</h3><p class="inshort"><strong>In short:</strong> no planet lines pass close to here. Astrocartography reads that as a neutral place: life there would feel much like it does anywhere else.</p>`;
  const tone = near.reduce((t, n) => t + PLACE[n.p][1] * (1 - n.d / RADIUS), 0);
  const summary = tone >= 1 ? "a mostly supportive place for you" : tone <= -0.5 ? "a more demanding place for you" : "a mixed place for you";
  return `<h3>${esc(name)}</h3>
    <p class="inshort"><strong>In short:</strong> astrocartography reads this as ${summary}.</p>
    <ul class="placelist">${near.slice(0, 5).map((n) => `<li class="${PLACE[n.p][1] > 0 ? "t-up" : PLACE[n.p][1] < 0 ? "t-down" : "t-flat"}">
      <strong>${n.p} ${ANGLE[n.k][0]}</strong> <span class="fine mono">~${Math.round(n.d / 10) * 10} km away</span><br>
      ${cap(PLACE[n.p][0])}, and ${ANGLE[n.k][1]}.</li>`).join("")}</ul>
    <p class="fine">Lines are felt most within a few hundred kilometers, and fade with distance.</p>`;
}
function viewMap() {
  if (!S.acg) S.acg = E.acgLines(S.chart);
  if (!S.mapPlanets) S.mapPlanets = ["Sun", "Moon", "Venus", "Mars", "Jupiter", "Saturn"];
  if (!S.mapPt) S.mapPt = { lat: S.birth.lat, lon: S.birth.lon, name: S.birth.place ? `${S.birth.place} (birthplace)` : "Your birthplace" };
  const goal = S.mapGoal || "love";
  const best = bestPlaces(goal);
  return `
  <section class="intro">
    <div class="intro-top"><p class="eyebrow">${sysTag("Western")} Astrocartography</p></div>
    <h2>Your world map</h2>
    <p>Astrocartography shows where on Earth each planet was rising, setting, overhead or underfoot at the moment you were born. Astrologers believe living near a planet's line brings out that planet's themes. Tap anywhere on the map, or pick a city, to see what it means for you.</p>
    ${isV() ? `<p class="fine">This is a Western technique. It uses the planets' actual positions in the sky, so the lines are the same in either system.</p>` : ""}
  </section>
  <div class="chips" role="group" aria-label="Planets shown">${MAP_PLANETS.map((p) => `<button type="button" class="chip pl-${p.toLowerCase()}${S.mapPlanets.includes(p) ? " on" : ""}" data-pl="${p}"><i></i>${p}</button>`).join("")}</div>
  <div class="map-wrap">${mapSVG()}</div>
  <p class="fine map-legend"><span><i class="lk lk-asc"></i>rising line (you personally)</span><span><i class="lk lk-mc"></i>career line</span><span><i class="lk lk-dsc"></i>relationship line</span><span><i class="lk lk-ic"></i>home line</span><span><i class="lk lk-birth"></i>birthplace</span></p>
  <div class="grid2">
    <article class="card" id="placeCard">
      <div class="row"><label for="mapCity">Pick a city</label>
        <select id="mapCity"><option value="">Tap the map or choose a city…</option>${MAP_CITIES.map((c, i) => `<option value="${i}">${esc(c[0])}</option>`).join("")}</select></div>
      <div id="placeReading">${placeReading(S.mapPt)}</div>
    </article>
    <article class="card">
      <header class="card-h"><h3>Best places for…</h3></header>
      <div class="ask-modes">${Object.entries(GOALS).map(([k, gl]) => `<button type="button" class="seg${k === goal ? " on" : ""}" data-goal="${k}">${gl.label}</button>`).join("")}</div>
      ${best.length ? `<ol class="best">${best.map((c) => `<li><button type="button" class="link" data-city="${esc(c.name)}">${esc(c.name)}</button><span class="fine">${esc([...new Set(c.why)].slice(0, 2).join(", "))}</span></li>`).join("")}</ol>`
        : "<p>None of the cities in the app's list sit close to your lines for this. Tap the map to explore other places.</p>"}
      <p class="fine">Chosen from about 70 major cities. Tap the map to check anywhere else.</p>
    </article>
  </div>`;
}
function bindMap() {
  const setPt = (pt) => { S.mapPt = pt; $(".map-wrap").innerHTML = mapSVG(); $("#placeReading").innerHTML = placeReading(pt); bindSvg(); };
  const bindSvg = () => {
    const svg = $("#worldMap");
    svg.onclick = (e) => {
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(svg.getScreenCTM().inverse());
      setPt({ lat: Math.max(-72, Math.min(72, 90 - q.y / 2)), lon: q.x / 2 - 180 });
      $("#mapCity").value = "";
    };
  };
  bindSvg();
  document.querySelectorAll(".chip[data-pl]").forEach((b) => (b.onclick = () => {
    const p = b.dataset.pl;
    S.mapPlanets = S.mapPlanets.includes(p) ? S.mapPlanets.filter((x) => x !== p) : S.mapPlanets.concat(p);
    render();
  }));
  $("#mapCity").onchange = (e) => { const c = MAP_CITIES[+e.target.value]; if (c) setPt({ lat: c[1], lon: c[2], name: c[0] }); };
  document.querySelectorAll("[data-goal]").forEach((b) => (b.onclick = () => { S.mapGoal = b.dataset.goal; render(); }));
  document.querySelectorAll("[data-city]").forEach((b) => (b.onclick = () => {
    const c = MAP_CITIES.find((x) => x[0] === b.dataset.city); if (c) { setPt({ lat: c[1], lon: c[2], name: c[0] }); $("#placeCard").scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  }));
}

// ---------------------------------------------------------------- Life areas (shared)
const AREA_ICON = { love: "♥", career: "▲", money: "$", home: "⌂", health: "✚", friends: "☺" };
const OVERALL = {
  good: (s) => `A mostly supportive ${s}`, mixed: (s) => `A mixed ${s}, with good moments and harder ones`, low: (s) => `A more demanding ${s}`,
};
const shortDay = (ms) => new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
function areaEvents(from, to, kind) {
  const key = `${S.sys}|${kind}|${from}|${to}`;
  S.mCache = S.mCache || {};
  if (S.mCache[key]) return S.mCache[key];
  let ev;
  if (kind === "day") {
    ev = isV() ? A.vedicEvents(S.chart, S.dasha, from, to, { background: false, daily: false }).concat(A.vedicMoonDay(S.chart, from + DAY / 2))
      : A.westernEvents(S.chart, from, to, { background: false, aspects: false }).concat(A.westernMoonDay(S.chart, from + DAY / 2));
  } else if (kind === "year") {
    ev = isV() ? A.vedicEvents(S.chart, S.dasha, from, to, { movers: ["Jupiter", "Saturn"], daily: false }).filter((e) => !(e.kind === "phase" && e.title.startsWith("A short")))
      : A.westernEvents(S.chart, from, to, { movers: ["Jupiter", "Saturn"], lunations: false, step: 3 * DAY });
    if (!isV()) {
      const y = S.prof.find((p) => p.start <= from + DAY && from + DAY < p.end);
      if (y) {
        const t = westYearTone(y.sign, y.lord, y.house), areas = Object.keys(AREA_TEXT_KEYS).filter((a) => AREA_TEXT_KEYS[a].includes(y.house));
        if (areas.length) ev.push({ ms: from, sys: "Western", areas, score: { good: 2, mixed: 0.5, low: -1.5 }[t.tone], kind: "focus", fixedText: true,
          title: `This year's main focus is ${HOUSE_W[y.house]}, run by ${y.lord} (tradition rates it ${TONE_WORD[t.tone].toLowerCase()})` });
      }
      for (const [zr, areas, nm] of [[S.zrS, ["career"], "career"], [S.zrF, ["money", "home", "health"], "life-circumstances"]])
        for (const a of zr.level1) for (const b of a.level2) if (b.peak && b.start >= from && b.start < to)
          ev.push({ ms: b.start, sys: "Western", areas, score: b.peak === "10th" ? 2 : 1, kind: "peak", fixedText: true,
            title: `A ${peakPlain(b.peak)} begins in your ${nm} timeline (until ${fmtMY(b.end)}), an eventful, visible stretch` });
    } else {
      const d = E.dashaAt(S.dasha, from);
      if (d) for (const [p, w, lab] of [[d.md.lord, 1, "long period"], [d.ad.lord, 1.2, "sub-period"]]) {
        const ar = A.areaLinks(S.chart, p);
        if (ar.length) ev.push({ ms: from, sys: "Vedic", areas: ar, score: w * ({ good: 1.5, mixed: 0.6, low: -0.8 }[vedicPeriodTone(p).tone]), kind: "background", fixedText: true,
          title: `Your ${p} ${lab} is linked to this area in your chart (tradition rates ${p} ${TONE_WORD[vedicPeriodTone(p).tone].toLowerCase()} for you)` });
      }
    }
    ev.sort((a, b) => a.ms - b.ms);
  } else {
    ev = isV() ? A.vedicEvents(S.chart, S.dasha, from, to) : A.westernEvents(S.chart, from, to);
  }
  S.mCache[key] = ev;
  return ev;
}
const AREA_TEXT_KEYS = { love: [5, 7], career: [10, 6], money: [2, 8, 11], home: [4], health: [1, 6], friends: [11, 3] };
function areaCard(a, span, opts = {}) {
  const good = a.items.filter((i) => i.kind === "goodday"), rest = a.items.filter((i) => i.kind !== "goodday");
  const maxN = opts.max ?? 3, fmt = opts.fmt || shortDay;
  return `<article class="card area">
    <header class="card-h"><h3><span class="aicon" aria-hidden="true">${AREA_ICON[a.key]}</span>${a.label}</h3>${tonePill(a)}</header>
    <p>${a.text}</p>
    ${a.key === "health" ? '<p class="fine">This is about energy and stress as astrology describes it, not medical advice. See a doctor for any health concern.</p>' : ""}
    ${good.length ? `<p class="fine"><strong>Best days:</strong> ${good.slice(0, 6).map((i) => shortDay(i.ms)).join(", ")}</p>` : ""}
    ${rest.length ? `<p class="sub">What to watch for</p><ul class="adays">${rest.slice(0, maxN).map((i) => `<li><span class="mono">${fmt(i.ms)}</span><span>${esc(i.text)}</span></li>`).join("")}</ul>
      ${rest.length > maxN ? `<details class="basis-d"><summary>${rest.length - maxN} more</summary><ul class="adays">${rest.slice(maxN).map((i) => `<li><span class="mono">${fmt(i.ms)}</span><span>${esc(i.text)}</span></li>`).join("")}</ul></details>` : ""}` : ""}
    ${a.bg.length ? `<p class="fine"><strong>In the background:</strong> ${esc(a.bg.map((b) => b.text).join(" "))}</p>` : ""}
  </article>`;
}
function areaRows(sum, span) {
  return `<ul class="arows">${A.AREAS6.map(([k]) => { const a = sum.areas[k];
    return `<li><span class="ar-l"><span class="aicon" aria-hidden="true">${AREA_ICON[k]}</span>${a.label}</span>${tonePill(a)}<span class="ar-t">${esc(a.text)}</span></li>`; }).join("")}</ul>`;
}
function inShortAreas(sum, span) {
  const parts = [`${OVERALL[sum.overall](span)}.`];
  if (sum.best) parts.push(`Best for ${sum.best.label.toLowerCase()}.`);
  if (sum.worst) parts.push(`Go easy on ${sum.worst.label.toLowerCase()}.`);
  return parts.join(" ");
}

// ---------------------------------------------------------------- Your month
function monthRange(off) {
  const n = new Date(), a = Date.UTC(n.getFullYear(), n.getMonth() + off, 1), b = Date.UTC(n.getFullYear(), n.getMonth() + off + 1, 1);
  return [a, b];
}
function weeksOf(a, b) {
  const first = new Date(a), dow = (first.getUTCDay() + 6) % 7;
  const out = [];
  for (let s = a - dow * DAY; s < b; s += 7 * DAY) out.push([s, s + 7 * DAY]);
  return out;
}
function viewMonth() {
  const off = S.monthOff || 0, [a, b] = monthRange(off);
  const ev = areaEvents(a, b - 1, "month");
  const inMonth = ev;
  const sum = A.summarize(inMonth, "month");
  const weeks = weeksOf(a, b), now = Date.now();
  if (S.weekSel == null || S.weekSel >= weeks.length) S.weekSel = Math.max(0, weeks.findIndex(([s, e]) => s <= now && now < e));
  const wsum = weeks.map(([s, e]) => A.summarize(areaEvents(s, e - 1, "week"), "week", 0.4));
  const label = new Date(a).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const wl = ([s, e]) => `${new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – ${new Date(e - DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  const [ws, we] = weeks[S.weekSel], W = wsum[S.weekSel];
  const keyDays = [];
  const seen = new Set();
  for (const k of Object.keys(W.areas)) for (const i of W.areas[k].items) {
    const id = i.ms + i.title; if (seen.has(id)) continue; seen.add(id);
    keyDays.push({ ...i, areaLabels: i.areas.map((x) => A.AREAS6.find((y) => y[0] === x)[1].split(" ")[0]) });
  }
  keyDays.sort((x, y) => x.ms - y.ms);
  const goodFor = Object.values(W.areas).filter((x) => x.tone === "good").map((x) => A.GOOD_FOR[x.key]);
  const easyOn = Object.values(W.areas).filter((x) => x.tone === "low").map((x) => A.EASY_ON[x.key]);
  return `
  ${tabHead(`Your month: ${label}`, `${inShortAreas(sum, "month")} Below: what the month means for each part of your life, then a week-by-week breakdown.`)}
  <div class="daynav">
    <button class="btn" id="mPrev" type="button">← ${new Date(monthRange(off - 1)[0]).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })}</button>
    <button class="btn" id="mNext" type="button">${new Date(monthRange(off + 1)[0]).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })} →</button>
    ${off ? '<button class="link" id="mNow" type="button">Back to this month</button>' : ""}
  </div>
  <div class="areagrid">${A.AREAS6.map(([k]) => areaCard(sum.areas[k], "month")).join("")}</div>
  <section class="intro"><h2>Week by week</h2><p>Pick a week to see what it holds.</p></section>
  <div class="weeks" role="tablist">${weeks.map((w, i) => `<button type="button" role="tab" class="wk${i === S.weekSel ? " on" : ""}" data-wk="${i}" aria-selected="${i === S.weekSel}">
    <span>${wl(w)}</span><span class="tone tone-${wsum[i].overall}">${TONE_WORD[wsum[i].overall]}</span></button>`).join("")}</div>
  <article class="card weekcard">
    <header class="card-h"><h3>Week of ${wl([ws, we])}</h3>${sysTag(SYS())}</header>
    <p class="inshort"><strong>In short:</strong> ${inShortAreas(W, "week")}</p>
    ${goodFor.length || easyOn.length ? `<div class="gfe">
      ${goodFor.length ? `<div><p class="sub">Good for</p><ul>${goodFor.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : ""}
      ${easyOn.length ? `<div><p class="sub">Go easy on</p><ul>${easyOn.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : ""}</div>` : ""}
    <p class="sub">Each part of your life this week</p>
    ${areaRows(W, "week")}
    <p class="sub">Key days</p>
    ${keyDays.length ? `<ul class="adays">${keyDays.map((i) => `<li><span class="mono">${shortDay(i.ms)}</span><span>${esc(i.text)} <span class="fine">(${[...new Set(i.areaLabels)].join(", ")})</span></span></li>`).join("")}</ul>` : "<p>No specific dates stand out this week.</p>"}
    <p class="fine">Influences build up a day or two before each date and fade a day or two after. Tradition describes tendencies, not fixed outcomes; your choices still shape the week.</p>
  </article>`;
}
function bindMonth() {
  $("#mPrev").onclick = () => { S.monthOff = (S.monthOff || 0) - 1; S.weekSel = null; render(); };
  $("#mNext").onclick = () => { S.monthOff = (S.monthOff || 0) + 1; S.weekSel = null; render(); };
  const n = $("#mNow"); if (n) n.onclick = () => { S.monthOff = 0; S.weekSel = null; render(); };
  document.querySelectorAll("[data-wk]").forEach((b) => (b.onclick = () => { S.weekSel = +b.dataset.wk; render(); $(".weekcard").scrollIntoView({ behavior: "smooth", block: "nearest" }); }));
}

// ---------------------------------------------------------------- areas for a day / the year ahead
function dayAreasHTML(ms) {
  const d0 = ms - DAY / 2;
  const sum = A.summarize(areaEvents(d0, d0 + DAY - 1, "day"), "day");
  return `<article class="card">
    <header class="card-h"><h3>Your day by area</h3>${sysTag(SYS())}</header>
    <p class="inshort"><strong>In short:</strong> ${inShortAreas(sum, "day")}</p>
    ${areaRows(sum, "day")}
  </article>`;
}
function yearAreasHTML() {
  const now = Date.now(), a = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const sum = A.summarize(areaEvents(a, a + 365 * DAY, "year"), "year");
  return `<section class="intro fc-intro"><h2>Your next 12 months by area</h2>
    <p>${inShortAreas(sum, "year")} Built from the slow-moving planets (Jupiter and Saturn) and your ${isV() ? "Vedic periods" : "yearly focus and high points"}, which set the tone for months at a time.</p></section>
  <div class="areagrid">${A.AREAS6.map(([k]) => areaCard(sum.areas[k], "year", { max: 3, fmt: (m) => new Date(m).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) })).join("")}</div>`;
}

// ---------------------------------------------------------------- Day chart (transit bi-wheel + sky aspects)
const SKY_THEME = { Sun: "confidence and leadership", Moon: "moods and feelings", Mercury: "communication and plans", Venus: "love, pleasure and money",
  Mars: "energy and tempers", Jupiter: "optimism and growth", Saturn: "rules, limits and responsibility", Uranus: "surprises and change",
  Neptune: "dreams, ideals and confusion", Pluto: "power and intensity" };
const NATAL_THEME = { Sun: "your confidence and direction", Moon: "your mood and home life", Mercury: "your thinking and communication",
  Venus: "your love life and money", Mars: "your energy and drive", Jupiter: "your luck and growth", Saturn: "your responsibilities",
  Uranus: "your need for freedom", Neptune: "your imagination", Pluto: "your sense of control", Rising: "your health and how you come across" };
const SKY_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const SKY_ASP = [["conjunction", 0, "☌"], ["sextile", 60, "⚹"], ["square", 90, "□"], ["trine", 120, "△"], ["opposition", 180, "☍"]];
const aspKind = (t) => (t === "trine" || t === "sextile" ? "easy" : t === "conjunction" ? "blend" : "hard");
function skyData(ms) {
  const v = isV(), T = E.planetsAt(ms, v ? "lahiri" : null);
  const natal = v ? S.chart.vedic.planets : S.chart.western.planets, asc = v ? S.chart.vedic.lagna : S.chart.western.asc;
  const sky = [];
  for (let i = 0; i < SKY_PLANETS.length; i++) for (let j = i + 1; j < SKY_PLANETS.length; j++) {
    const a = SKY_PLANETS[i], b = SKY_PLANETS[j];
    if (["Uranus", "Neptune", "Pluto"].includes(a) && ["Uranus", "Neptune", "Pluto"].includes(b)) continue;
    const sep = Math.abs(E.angdiff(T[a].lon, T[b].lon)), maxOrb = a === "Moon" || b === "Moon" ? 5 : 3;
    for (const [type, ang, sym] of SKY_ASP) { const orb = Math.abs(sep - ang); if (orb <= maxOrb) sky.push({ a, b, type, sym, orb }); }
  }
  const personal = [];
  const natalPts = Object.entries(natal).filter(([n]) => SKY_PLANETS.includes(n)).map(([n, p]) => [n, p.lon]).concat([["Rising", asc]]);
  for (const tp of SKY_PLANETS) for (const [np, nl] of natalPts) {
    const sep = Math.abs(E.angdiff(T[tp].lon, nl)), maxOrb = tp === "Moon" ? 5 : ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(tp) ? 2 : 2.5;
    for (const [type, ang, sym] of SKY_ASP) { const orb = Math.abs(sep - ang); if (orb <= maxOrb) personal.push({ tp, np, type, sym, orb, nl }); }
  }
  sky.sort((x, y) => x.orb - y.orb); personal.sort((x, y) => x.orb - y.orb);
  return { T, natal, asc, sky, personal };
}
function skyLine(x) {
  const k = aspKind(x.type), A = SKY_THEME[x.a], B = SKY_THEME[x.b];
  const txt = k === "easy" ? `${cap(A)} and ${B} work together easily. A good day to use both.`
    : k === "blend" ? `${cap(A)} and ${B} merge, so the two are hard to separate today.`
      : `${cap(A)} and ${B} pull against each other. People may feel some tension around these.`;
  return `<li class="sk-${k}"><span class="asp-name">${x.a} ${x.sym} ${x.b}</span><span>${txt}${x.orb < 1 ? " <em>Exact today, so it's felt strongly.</em>" : ""}</span></li>`;
}
function personalLine(x) {
  const k = aspKind(x.type), who = SKY_THEME[x.tp].split(" and ")[0], target = NATAL_THEME[x.np] || `your ${x.np}`;
  const malefic = ["Mars", "Saturn", "Pluto"].includes(x.tp), benefic = ["Venus", "Jupiter"].includes(x.tp);
  const txt = k === "easy" ? `easy support for ${target}, through ${who}.`
    : k === "hard" ? `friction around ${target}, through ${who}. Go slow and don't force it.`
      : benefic ? `a boost for ${target}, through ${who}.` : malefic ? `pressure on ${target}, through ${who}. Handle it with patience.` : `a spotlight on ${target}, through ${who}.`;
  const lasts = x.tp === "Moon" ? "a few hours" : ["Sun", "Mercury", "Venus"].includes(x.tp) ? "a day or two" : x.tp === "Mars" ? "a few days" : "weeks";
  return `<li class="sk-${k}"><span class="asp-name">${x.tp} ${x.sym} your ${x.np === "Rising" ? "rising sign" : x.np}</span><span>Today's ${x.tp} ${x.type === "conjunction" ? "meets" : x.type === "opposition" ? "opposes" : x.type === "square" ? "clashes with" : x.type === "trine" ? "flows with" : "supports"} your birth ${x.np === "Rising" ? "rising sign" : x.np}: ${txt} <span class="fine">Lasts ${lasts}.</span></span></li>`;
}
function biwheelSVG(d) {
  const cx = 210, cy = 210, R0 = 205, R1 = 178, Rt = 160, R2 = 140, Rn = 110, RA = 80;
  const ang = (lon) => ((180 + (lon - d.asc)) * Math.PI) / 180;
  const pt = (lon, r) => [cx + r * Math.cos(ang(lon)), cy - r * Math.sin(ang(lon))];
  let s = `<svg class="wheel biwheel" viewBox="0 0 420 420" role="img" aria-label="Transit chart: your birth chart inside, today's planets outside">`;
  s += `<circle class="w-ring" cx="${cx}" cy="${cy}" r="${R0}"/><circle class="w-ring" cx="${cx}" cy="${cy}" r="${R1}"/><circle class="w-ring bw-mid" cx="${cx}" cy="${cy}" r="${R2}"/><circle class="w-inner" cx="${cx}" cy="${cy}" r="${RA}"/>`;
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = pt(i * 30, R0), [x1, y1] = pt(i * 30, RA);
    s += `<line class="w-div" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
    const [tx, ty] = pt(i * 30 + 15, (R0 + R1) / 2);
    s += `<text class="w-sign" x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central">${SIGN_ABBR[i]}</text>`;
  }
  const [ax0, ay0] = pt(d.asc, R0 + 2), [ax1, ay1] = pt(d.asc, RA);
  s += `<line class="w-asc" x1="${ax0}" y1="${ay0}" x2="${ax1}" y2="${ay1}"/>`;
  // aspect lines between today's planets and birth planets
  for (const x of d.personal.slice(0, 10)) {
    const tl = d.T[x.tp].lon, [x0, y0] = pt(tl, R2 - 2), [x1, y1] = pt(x.nl, RA);
    s += `<line class="bw-asp bw-${aspKind(x.type)}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"><title>${x.tp} ${x.type} your ${x.np}</title></line>`;
  }
  const place = (entries, r, cls) => {
    let out = "", prevLon = -999, prevR = r;
    for (const [n, lon] of entries.sort((a, b) => a[1] - b[1])) {
      const rr = Math.abs(E.angdiff(lon, prevLon)) < 8 ? (prevR === r ? r - 17 : r) : r;
      prevLon = lon; prevR = rr;
      const [x, y] = pt(lon, rr);
      out += `<g class="${cls}"><circle cx="${x}" cy="${y}" r="10.5"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${ABBR[n]}</text><title>${n}${cls === "bw-t" ? " today" : " at birth"}: ${E.fmtDeg(lon)}</title></g>`;
    }
    return out;
  };
  s += place(SKY_PLANETS.map((n) => [n, d.T[n].lon]), Rt, "bw-t");
  s += place(Object.entries(d.natal).filter(([n]) => SKY_PLANETS.includes(n)).map(([n, p]) => [n, p.lon]), Rn, "bw-n");
  return s + "</svg>";
}
function skyChartHTML(ms) {
  const d = skyData(ms);
  return `<article class="card skychart">
    <header class="card-h"><h3>Today's chart</h3>${sysTag(SYS())}</header>
    <p>This is a <strong>transit chart</strong>, a real tool astrologers use for daily readings. The <strong>inner ring</strong> is your birth chart. The <strong>outer ring</strong> is where the planets are ${S.dayOff ? "on this day" : "right now"}. The lines show today's ${g("aspect", "aspects")} to your chart: <span class="k k-easy">easy</span> <span class="k k-hard">tense</span> <span class="k k-blend">blending</span>.</p>
    <div class="sky-grid">
      <div class="wheel-box">${biwheelSVG(d)}<p class="fine legend-asp"><span class="dot dot-t"></span>today's planets <span class="dot dot-n"></span>your birth planets</p></div>
      <div class="sky-lists">
        <h4>Aspects to your chart</h4>
        <p class="fine">These are personal: they depend on your birth chart.</p>
        ${d.personal.length ? `<ul class="asplist">${d.personal.slice(0, 8).map(personalLine).join("")}</ul>` : "<p>No close contacts to your chart today.</p>"}
        <h4>The sky today</h4>
        <p class="fine">Aspects between the planets themselves. These apply to everyone, like the day's weather.</p>
        ${d.sky.length ? `<ul class="asplist">${d.sky.slice(0, 8).map(skyLine).join("")}</ul>` : "<p>The planets make no close aspects to each other today.</p>"}
      </div>
    </div>
  </article>`;
}

// ---------------------------------------------------------------- About, privacy & help
function viewAbout() {
  return `
  <section class="intro"><h2>About The Night Almanac</h2><p>Plain-language astrology readings built from your real birth chart, with the reasoning shown so you can check it.</p></section>
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>Your privacy</h3></header>
      <p class="inshort"><strong>In short:</strong> your birth details never leave your device.</p>
      <ul class="plain">
        <li>There are no accounts. Every chart is calculated right here in your browser, and the app has no server that receives your details.</li>
        <li>Your birth details, settings and past events are saved only in this browser, so you don't have to re-enter them.</li>
        <li>The birthplace search runs on your device too. What you type isn't sent anywhere.</li>
        <li>The Night Almanac doesn't use ads, trackers or analytics, and loads nothing from other companies' servers (not even fonts).</li>
        <li>Like any website, the service that hosts this site may keep basic visit logs (such as IP addresses). Those never include your birth details.</li>
      </ul>
      <p>You can erase everything The Night Almanac has saved in this browser at any time.</p>
      <div class="btns"><button class="btn" type="button" id="wipeAsk">Delete my data from this browser</button></div>
      <div id="wipeConfirm" hidden class="confirm"><p><strong>Delete your birth details, events and settings from this browser?</strong> This can't be undone.</p>
        <div class="btns"><button class="btn btn-primary" type="button" id="wipeYes">Yes, delete</button><button class="btn" type="button" id="wipeNo">Cancel</button></div></div>
      <p class="fine" id="wipeDone" hidden>Deleted. You're back to the example chart.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>What these readings are</h3></header>
      <p>The Night Almanac uses real astronomical positions and traditional techniques from Western (Hellenistic) and Vedic (Indian) astrology. Every reading describes what those traditions say, and shows its reasoning.</p>
      <p><strong>Astrology is a cultural and historical tradition.</strong> Scientific studies haven't found that it predicts events or personality. Use readings for reflection and fun, not as instructions. Your choices are always yours.</p>
      <p>The Night Almanac never tells you what to do about your health, money, legal matters or safety, and it never sells "remedies." For those, please talk to a qualified professional.</p>
      <p>The Night Almanac is for adults 18 and over.</p>
    </article>
    <article class="card help">
      <header class="card-h"><h3>If you're going through a hard time</h3></header>
      <p>If you're thinking about suicide or self-harm, or you're in crisis, please reach out to a person now.</p>
      <ul class="plain">
        <li><strong>US:</strong> call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline).</li>
        <li><strong>Outside the US:</strong> find a local helpline at <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>.</li>
        <li><strong>In immediate danger:</strong> call your local emergency number.</li>
      </ul>
      <p class="fine">If a reading ever leaves you feeling frightened or pressured into a big decision, step back and talk it over with someone you trust. No chart is a reason to panic.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>Credits &amp; open source</h3></header>
      <p>Astronomical calculations by the <strong>Swiss Ephemeris</strong> (© Astrodienst AG), used under the GNU Affero General Public License v3. The Night Almanac is released under the same license, which means its source code is available to anyone who uses it${SOURCE_URL ? `: <a href="${SOURCE_URL}" target="_blank" rel="noopener">get the source code</a>` : ""}.</p>
      <p>Place data from <strong>GeoNames</strong> (CC BY 4.0). Map outline from <strong>Natural Earth</strong> (public domain). Fonts: Cormorant Garamond (© The Cormorant Project Authors) and Jost (© The Jost Project Authors), SIL Open Font License 1.1.</p>
    </article>
  </div>`;
}
function bindAbout() {
  $("#wipeAsk").onclick = () => { $("#wipeConfirm").hidden = false; $("#wipeYes").focus(); };
  $("#wipeNo").onclick = () => { $("#wipeConfirm").hidden = true; };
  $("#wipeYes").onclick = () => {
    try { for (const k of Object.keys(localStorage)) if (k.startsWith("nightalmanac.")) localStorage.removeItem(k); } catch { /* storage unavailable */ }
    load(SAMPLE, true); S.sys = "western";
    $("#wipeConfirm").hidden = true; render(); const d = $("#wipeDone"); if (d) d.hidden = false;
  };
}

// ---------------------------------------------------------------- Star lore (esoteric techniques)
function hereLoc() {
  const h = store.get("nightalmanac.here", null);
  return h || { place: S.birth.place || "your birthplace", lat: S.birth.lat, lon: S.birth.lon, tz: S.birth.tz, birth: true };
}
function localYMD(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" })
    .formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return [+p.year, +p.month, +p.day];
}
const fmtT = (ms, tz) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
function fmtWhen(ms, tz, nowMs) {
  const same = localYMD(ms, tz).join() === localYMD(nowMs, tz).join();
  return same ? fmtT(ms, tz) : new Date(ms).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: tz });
}
// The astrological day runs from sunrise to sunrise.
function astroDay(ms, loc) {
  let [y, m, d] = localYMD(ms, loc.tz);
  let frame = E.sunFrame(y, m, d, loc.lat, loc.lon, loc.tz);
  if (ms < frame.rise) { const prev = new Date(Date.UTC(y, m - 1, d) - DAY); [y, m, d] = [prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate()];
    frame = E.sunFrame(y, m, d, loc.lat, loc.lon, loc.tz); }
  return { frame, weekday: L.weekdayOf(y, m, d) };
}
function loreNow() {
  const now = Date.now(), key = Math.floor(now / 300000) + "|" + S.sys + "|" + JSON.stringify(hereLoc());
  if (S.lore && S.lore.key === key) return S.lore;
  const loc = hereLoc(), { frame, weekday } = astroDay(now, loc);
  const hours = L.planetaryHours(frame, weekday), cur = hours.find((h) => now >= h.start && now < h.end) || hours[0];
  const tithiF = (t) => L.tithiAt(t).i, nakF = (t) => L.nakshatraAt(t), yogaF = (t) => L.yogaAt(t).i, karF = (t) => L.karanaAt(t).k;
  S.lore = { key, now, loc, frame, weekday, hours, cur,
    voc: isV() ? null : L.voidOfCourse(now),
    tithi: L.tithiAt(now), tithiEnd: E.nextChange(tithiF, now),
    nak: L.nakshatraAt(now), nakEnd: E.nextChange(nakF, now),
    yoga: L.yogaAt(now), yogaEnd: E.nextChange(yogaF, now),
    karana: L.karanaAt(now), karanaEnd: E.nextChange(karF, now, 20 * 60000),
    rahu: L.rahuKaal(frame, weekday), abhijit: L.abhijit(frame, weekday) };
  return S.lore;
}
const tonePillL = (tone, word) => `<span class="tone tone-${tone}">${word || TONE_WORD[tone]}</span>`;
function locLine(lo) {
  return `<div class="loreloc"><p class="fine">Times are for <strong>${esc(lo.loc.place)}</strong>${lo.loc.birth ? " (your birthplace)" : ""}. Sunrise ${fmtT(lo.frame.rise, lo.loc.tz)}, sunset ${fmtT(lo.frame.set, lo.loc.tz)}${lo.frame.approx ? " (approximate: the Sun doesn't rise or set normally here today)" : ""}.
    <button type="button" class="linkbtn" id="hereChange">Change place</button></p>
    <div id="hereBox" hidden class="herebox"><label for="hereInp">Where are you now?</label>
      <input id="hereInp" type="text" autocomplete="off" placeholder="City, e.g. Chicago, IL">
      <ul id="hereRes" class="cityres" role="listbox"></ul>
      ${lo.loc.birth ? "" : '<button type="button" class="linkbtn" id="hereReset">Use my birthplace</button>'}</div></div>`;
}
function hoursTable(lo) {
  const tz = lo.loc.tz;
  return `<div class="tbl"><table class="hourtab"><thead><tr><th>Hour</th><th>Starts</th><th>Planet</th><th>Tradition says</th></tr></thead><tbody>
    ${lo.hours.map((h) => `<tr class="${h === lo.cur ? "on" : ""}${lo.now > h.end ? " past" : ""}"><td>${h.isDay ? "Day" : "Night"} ${h.isDay ? h.n : h.n - 12}</td>
      <td>${fmtWhen(h.start, tz, lo.now)}</td><td>${PLANET_GLYPH[h.planet] || ""} ${h.planet}</td><td>${tonePillL(L.HOUR[h.planet].tone)}</td></tr>`).join("")}
    </tbody></table></div>`;
}
const PLANET_GLYPH = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋" };
const ORD_WORD = ["first", "second", "third"];

function loreWestern(lo) {
  const tz = lo.loc.tz, c = S.chart, h = L.HOUR[lo.cur.planet], dayLord = L.WEEKDAY_LORD[lo.weekday], v = lo.voc;
  const vocText = !v ? "" : v.isVoid
    ? `<p><strong>The Moon is void of course</strong> until ${fmtWhen(v.exit, tz, lo.now)}, when it enters ${E.SIGNS[(E.SIGNS.indexOf(v.sign) + 1) % 12]}. ${tonePillL("low", "Wait if you can")}</p>
       <p>It made its last aspect (a ${L.ASPECT_NAME[v.lastAspect ? v.lastAspect.aspect : 0]}${v.lastAspect ? ` to ${v.lastAspect.planet}` : ""}) and won't meet another planet before changing signs. Tradition says things started now "come to nothing" or turn out differently than planned. It's fine for rest, routine and finishing things.</p>`
    : `<p><strong>The Moon is not void of course right now.</strong> ${tonePillL("good", "Fine to start things")}</p>
       <p>Its next void period starts ${fmtWhen(v.voidFrom, tz, lo.now)} and lasts until ${fmtWhen(v.exit, tz, lo.now)}${v.lastAspect ? `, after its ${L.ASPECT_NAME[v.lastAspect.aspect]} with ${v.lastAspect.planet}` : ""}. Tradition says to avoid starting important things in that window.</p>`;

  // Decans of Sun, Moon, Rising
  const pts = [["Sun", c.western.planets.Sun.lon], ["Moon", c.western.planets.Moon.lon], ["Rising", c.western.asc]];
  const decans = pts.map(([who, lon]) => { const d = L.decanOf(lon);
    return `<article class="card decan"><p class="eyebrow">Your ${who === "Rising" ? "rising sign" : who}</p>
      <h3>${d.sign}, ${ORD_WORD[d.decan - 1]} decan</h3>
      <p class="fine">${d.from}° to ${d.to}° ${d.sign} · ruled by ${d.ruler}</p>
      <div class="tarot"><span class="tarot-c">${esc(d.card)}</span><span class="tarot-t">"${esc(d.title)}"</span></div>
      <p>${esc(d.read)}</p></article>`; }).join("");

  // Fixed stars on natal planets and angles
  const natalPts = Object.entries(c.western.planets).filter(([n]) => !["Rahu", "Ketu"].includes(n)).map(([n, p]) => [n, p.lon])
    .concat([["Rising", c.western.asc], ["Midheaven", c.western.mc]]);
  const contacts = L.starContacts(natalPts, c.utc, 1);
  const starsHTML = contacts.length ? contacts.map((x) => `<li class="starrow"><div class="star-h"><strong>${esc(x.star.name)}</strong> on your ${x.who}
      ${tonePillL(x.star.tone)} ${x.star.royal ? '<span class="pill pill-peak">Royal star</span>' : ""}</div>
      <p>${esc(x.star.read)}</p>
      <p class="fine">Within ${x.orb.toFixed(1)}° · Ptolemy describes its nature as ${esc(x.star.nature)}.${["Rising", "Midheaven"].includes(x.who) && S.birth.reliability !== "certificate" ? " Depends on an exact birth time." : ""}</p></li>`).join("")
    : `<li><p>None of the major stars sits within 1° of your planets or angles. That's common: about a third of charts have none, and most of the rest have one or two.</p></li>`;

  // More lots
  const ml = L.moreLots(c);
  const lotRows = Object.entries(ml).filter(([k]) => !k.startsWith("_")).map(([k, x]) => { const hard = L.HARD_PLACES.includes(x.house);
    return `<tr><td><strong>${esc(k)}</strong><br><span class="fine">${esc(L.MORE_LOT_TEXT[k])}</span></td><td>${x.sign}<br><span class="fine">${E.ordinal(x.house)} house</span></td>
      <td>${tonePillL(hard ? "mixed" : "good", hard ? "Harder place" : "Good place")}</td>
      <td>This topic is tied to your ${E.ordinal(x.house)} house: ${esc(HOUSE_W[x.house])}. ${hard ? "Tradition calls the 6th, 8th and 12th the 'hidden' houses, so this area may take more effort or play out privately." : "Tradition counts this house as a good, active place, so this area tends to work in your favor."} Look to ${x.lord} (its ruler) for how it unfolds.</td></tr>`; }).join("");

  return `
  <article class="card lorenow">
    <header class="card-h"><h3>Right now: the ${g("planhour", "hour")} of ${lo.cur.planet}</h3>${tonePillL(h.tone)}</header>
    <p class="inshort"><strong>In short:</strong> good for ${esc(h.good)}. Until ${fmtT(lo.cur.end, tz)}.</p>
    <p><strong>Avoid:</strong> ${esc(h.avoid)}.</p>
    <p class="fine"><strong>Why:</strong> ${esc(h.why)} Today is ${L.WEEKDAY_NAME[lo.weekday]}, the day of ${dayLord}: its first hour began at sunrise.</p>
    ${locLine(lo)}
    <details class="basis-d"><summary>All 24 planetary hours today</summary>
      <p class="fine">Planetary hours divide daylight into 12 equal parts and night into 12 more, so they're longer than clock hours in summer days and shorter in winter. Each goes to the next planet in the old "Chaldean" order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.</p>
      ${hoursTable(lo)}</details>
  </article>
  <article class="card"><header class="card-h"><h3>Is the Moon "${g("voc", "void of course")}"?</h3>${sysTag("Western")}</header>
    ${vocText}
    <p class="fine">A "void" Moon has made its last major aspect (using the seven traditional planets) before leaving its sign. Some astrologers also count Uranus, Neptune and Pluto, which can shorten the void period.</p></article>
  ${mansionCard(lo)}

  <section class="intro"><h3 class="sechead">Your ${g("decan", "decans")} and tarot cards</h3>
    <p>Each sign is split into three 10° slices called <em>decans</em>, an idea from ancient Egypt. Each has a planetary ruler and, since the 1890s, a tarot card. Your Sun, Moon and rising sign each fall in one.</p></section>
  <div class="grid3">${decans}</div>
  ${returnCard(false)}
  ${birthHourCard(false)}
  ${eclipseCard(false)}

  <article class="card"><header class="card-h"><h3>${g("fixedstar", "Fixed stars")} in your chart</h3>${sysTag("Western")}</header>
    <p>Astrologers have watched the brightest stars for thousands of years. A star sitting right on one of your planets is said to lend it its character. This uses the 15 "Behenian" stars of medieval magic plus the four Royal Stars, with a 1° orb.</p>
    <ul class="plain starlist">${starsHTML}</ul></article>

  <article class="card"><header class="card-h"><h3>More ${g("lot", "lots")}: family, marriage and your peak</h3>${sysTag("Western")}</header>
    <p>Lots are calculated points (like the Lot of Fortune) that ancient astrologers used to look at one topic at a time. The house a lot falls in shows the area of life where that topic plays out for you.</p>
    <div class="tbl"><table class="lottab"><thead><tr><th>Lot</th><th>Where</th><th>Tradition says</th><th>What it means</th></tr></thead><tbody>${lotRows}</tbody></table></div>
    ${ml._saturnBeams ? '<p class="fine">Your Saturn is close to the Sun, so the Lot of Father uses the traditional backup formula (Mars and Jupiter).</p>' : ""}
    <details class="basis-d"><summary>How these are calculated</summary><ul class="basis">
      <li>Father: Ascendant + Saturn − Sun (reversed for night births). Mother: Ascendant + Moon − Venus (reversed at night).</li>
      <li>Siblings: Ascendant + Jupiter − Saturn (reversed at night). Children: Ascendant + Saturn − Jupiter.</li>
      <li>Marriage (Dorotheus): women Ascendant + Saturn − Venus; men Ascendant + Venus − Saturn. Many astrologers now look at both.</li>
      <li>Exaltation: Ascendant + 19° Aries − Sun by day, Ascendant + 3° Taurus − Moon by night.</li>
      <li>You were born ${c.western.sect === "day" ? "by day" : "at night"}. ${timeWarning("houses") ? "These depend on the rising sign, so an uncertain birth time can move them." : ""}</li></ul></details></article>`;
}

function loreVedic(lo) {
  const tz = lo.loc.tz, c = S.chart, vp = c.vedic.planets, nk = L.NAK[lo.nak], nat = L.NAK_NATURE[nk.nature];
  const dayLord = L.WEEKDAY_LORD[lo.weekday], hora = lo.cur.planet, H = L.HOUR[hora];
  const until = (ms) => (ms ? `until ${fmtWhen(ms, tz, lo.now)}` : "");
  const rahuNow = lo.now >= lo.rahu.start && lo.now < lo.rahu.end, abhNow = lo.now >= lo.abhijit.start && lo.now < lo.abhijit.end;
  const limbs = [
    ["Day (vara)", `${L.WEEKDAY_NAME[lo.weekday]}, ruled by ${dayLord}`, "", `The day's ruler colors the whole day. ${dayLord === "Jupiter" || dayLord === "Venus" || dayLord === "Moon" || dayLord === "Mercury" ? "Tradition counts it among the gentler days." : dayLord === "Saturn" || dayLord === "Mars" ? "Tradition saves this day for effort and hard tasks more than celebrations." : "A day for confidence and dealing with authority."}`],
    ["Lunar day (tithi)", `${lo.tithi.paksha} ${lo.tithi.name}`, until(lo.tithiEnd), `${lo.tithi.group}: suited to ${lo.tithi.note}.`, lo.tithi.tone],
    ["Moon's star (nakshatra)", `${E.NAKSHATRAS[lo.nak]}`, until(lo.nakEnd), `${nat[0]}: suited to ${nat[2]}.`, nat[1]],
    ["Yoga", `${lo.yoga.name} ("${lo.yoga.means}")`, until(lo.yogaEnd), lo.yoga.tone === "low" ? "One of the nine yogas tradition avoids for new starts." : "A usable yoga for most activities.", lo.yoga.tone],
    ["Half-day (karana)", lo.karana.name, until(lo.karanaEnd), cap(lo.karana.note) + ".", lo.karana.tone],
  ];
  const lows = limbs.filter((x) => x[4] === "low").length;
  const verdict = lows === 0 ? ["good", "A clean day by the almanac: no limb of the panchanga is against new starts right now."]
    : lows === 1 ? ["mixed", "Mostly fine. One limb of the panchanga advises caution, so check the row marked Challenging before starting something important."]
    : ["low", "Several limbs advise caution right now. Tradition would wait for a better window for important beginnings."];

  const natNak = (who, lon) => { const i = Math.floor(E.norm(lon) / (360 / 27)), n = L.NAK[i];
    return { i, n, name: E.NAKSHATRAS[i], pada: Math.floor((E.norm(lon) % (360 / 27)) / (360 / 108)) + 1, who }; };
  const moonN = natNak("Moon", vp.Moon.lon), lagN = natNak("Lagna", c.vedic.lagna), sunN = natNak("Sun", vp.Sun.lon);
  const drk = [["Sun", vp.Sun.lon], ["Moon", vp.Moon.lon], ["Lagna (rising)", c.vedic.lagna]].map(([w, lon]) => { const d = L.drekkanaOf(lon);
    return `<tr><td>${w}</td><td>${d.sign}, ${ORD_WORD[d.decan - 1]} third</td><td>${d.dSign} (${d.lord})</td><td>Adds a ${d.dSign} streak: acting ${esc(SIGN_STYLE[d.dSign].split(":")[0])}.</td></tr>`; }).join("");

  return `
  <article class="card lorenow">
    <header class="card-h"><h3>Today's ${g("panchanga", "panchanga")}</h3>${tonePillL(verdict[0])}</header>
    <p class="inshort"><strong>In short:</strong> ${verdict[1]}</p>
    <p class="fine">The panchanga ("five limbs") is the Hindu almanac used to pick good times. Each limb is rated on its own.</p>
    <div class="tbl"><table class="panch"><tbody>${limbs.map(([k, val, end, note, tone]) => `<tr><th scope="row">${k}</th>
      <td><strong>${esc(val)}</strong>${end ? `<br><span class="fine">${end}</span>` : ""}</td><td>${tone ? tonePillL(tone) : ""}</td><td>${esc(note)}</td></tr>`).join("")}</tbody></table></div>
    ${locLine(lo)}
  </article>
  <div class="grid2">
    <article class="card"><header class="card-h"><h3>${g("rahukaal", "Rahu Kaal")}</h3>${tonePillL("low", rahuNow ? "Happening now" : "Avoid")}</header>
      <p class="inshort"><strong>Today:</strong> ${fmtT(lo.rahu.start, tz)} to ${fmtT(lo.rahu.end, tz)}.</p>
      <p>About an eighth of the daylight, ruled by Rahu. Tradition says not to begin anything important in it: new projects, purchases, travel or ceremonies. Ongoing work is fine.</p></article>
    <article class="card"><header class="card-h"><h3>Abhijit muhurta</h3>${tonePillL(lo.abhijit.wednesday ? "mixed" : "good", abhNow ? "Happening now" : lo.abhijit.wednesday ? "Skipped on Wednesdays" : "Good")}</header>
      <p class="inshort"><strong>Today:</strong> ${fmtT(lo.abhijit.start, tz)} to ${fmtT(lo.abhijit.end, tz)}.</p>
      <p>The "victorious" window around local noon. Tradition says it can rescue an otherwise ordinary day for starting something${lo.abhijit.wednesday ? ", though many almanacs skip it on Wednesdays" : ""}.</p></article>
  </div>
  <article class="card"><header class="card-h"><h3>Current hora: ${hora}</h3>${tonePillL(H.tone)}</header>
    <p class="inshort"><strong>Until ${fmtT(lo.cur.end, tz)}:</strong> good for ${esc(H.good)}.</p>
    <p class="fine">Horas are the Vedic name for planetary hours: each hour of the day goes to a planet, starting at sunrise with the day's ruler. Some Indian almanacs use equal 60-minute horas; this app uses the older unequal hours (daylight split into 12).</p>
    <details class="basis-d"><summary>All 24 horas today</summary>${hoursTable(lo)}</details></article>

  <section class="intro"><h3 class="sechead">Your birth star: ${moonN.name}</h3>
    <p>Your Moon's nakshatra (lunar mansion) is the most personal point in Vedic astrology. It sets your dasha timeline and is used to match partners. Each one has a ruling deity, a symbol and a special power.</p></section>
  <article class="card naklore">
    <div class="nak-grid">
      <dl class="numdl"><div><dt>Deity</dt><dd>${esc(cap(moonN.n.deity))}</dd></div><div><dt>Symbol</dt><dd>${esc(cap(moonN.n.symbol))}</dd></div>
        <div><dt>Power (shakti)</dt><dd>${esc(cap(moonN.n.shakti))}</dd></div><div><dt>Temperament</dt><dd>${esc(L.GANA_TEXT[moonN.n.gana])}</dd></div></dl>
      <div><p class="inshort"><strong>Your Moon in ${moonN.name} (pada ${moonN.pada}):</strong> ${esc(moonN.n.read)}</p>
        <p>Its ruling planet is ${E.DASHA_ORDER[moonN.i % 9]}, which is why your dashas began with ${E.DASHA_ORDER[moonN.i % 9]}.</p></div>
    </div></article>
  <div class="grid2">
    ${[lagN, sunN].map((x) => `<article class="card"><p class="eyebrow">Your ${x.who === "Lagna" ? "rising (lagna)" : "Sun"} nakshatra</p><h3>${x.name}</h3>
      <p class="fine">${esc(cap(x.n.deity))} · symbol: ${esc(x.n.symbol)}</p><p>${esc(x.n.read)}</p>
      ${x.who === "Lagna" && S.birth.reliability !== "certificate" ? '<p class="fine">Depends on an exact birth time.</p>' : ""}</article>`).join("")}
  </div>
  ${yogasCard()}
  ${returnCard(true)}
  ${birthHourCard(true)}
  ${eclipseCard(true)}
  <article class="card"><header class="card-h"><h3>Your ${g("drekkana", "drekkanas")} (thirds of a sign)</h3>${sysTag("Vedic")}</header>
    <p>Vedic astrology also splits each sign into thirds. In Parashara's system the first third belongs to the sign itself, the second to the sign 5th from it, and the third to the sign 9th from it. The drekkana adds a second flavor to a planet, and tradition uses it for siblings, courage and character.</p>
    <div class="tbl"><table><thead><tr><th>Point</th><th>Position</th><th>Drekkana (lord)</th><th>What it adds</th></tr></thead><tbody>${drk}</tbody></table></div></article>`;
}


// Birth hour + eclipses + yogas (shared helpers for Star lore)
const POINT_RUNS = () => ({ ...PLANET_RUNS, Rising: "your body, health, appearance and the direction of your life", Midheaven: "your career, reputation and public life",
  Lagna: "your body, health, appearance and the direction of your life" });
function birthHourCard(vedic) {
  const bh = L.birthHour(S.chart);
  return `<article class="card"><header class="card-h"><h3>Born on a ${L.WEEKDAY_NAME[bh.weekday]}, in the ${vedic ? "hora" : "hour"} of ${bh.hour}</h3>${sysTag(vedic ? "Vedic" : "Western")}</header>
    <p class="inshort"><strong>In short:</strong> tradition says the planet of your birth hour adds ${esc(L.BORN_HOUR[bh.hour])}; the day's ruler, ${bh.dayLord}, adds ${esc(L.BORN_HOUR[bh.dayLord])}.</p>
    <p class="fine">You were born in the ${E.ordinal(bh.n)} ${bh.isDay ? "daytime" : "nighttime"} hour, counted from ${bh.isDay ? "sunrise" : "sunset"} at your birthplace. ${vedic ? "In Vedic astrology the weekday of birth (vara) is counted from sunrise, so a birth before dawn belongs to the previous day." : "The astrological day starts at sunrise, so a birth before dawn belongs to the previous day."}
    ${S.birth.reliability !== "certificate" ? " This depends on your birth time being right to within an hour or so." : ""}${bh.approx ? " The Sun didn't rise or set normally at your birthplace that day, so the hours use 6 AM and 6 PM instead and are approximate." : ""}</p></article>`;
}
function eclipseCard(vedic) {
  if (!S.eclAll) S.eclAll = E.eclipsesBetween(Date.now() - 30 * DAY, Date.now() + 2 * 365.25 * DAY);
  const c = S.chart, pts = vedic
    ? ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"].map((n) => [n, c.vedic.planets[n].lon]).concat([["Lagna", c.vedic.lagna]])
    : ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"].map((n) => [n, c.western.planets[n].lon]).concat([["Rising", c.western.asc], ["Midheaven", c.western.mc]]);
  const asc = vedic ? c.vedic.lagna : c.western.asc, runs = POINT_RUNS();
  const list = L.eclipseContacts(S.eclAll.map((e) => ({ ...e, useLon: vedic ? e.sidLon : e.lon })), pts, 3).filter((e) => e.ms > Date.now() - 20 * DAY).slice(0, 6);
  const rows = list.map((e) => { const s = E.signIdx(e.useLon), house = E.wsHouse(e.useLon, asc);
    const date = new Date(e.ms).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const hit = e.hits[0];
    return `<li class="starrow"><div class="star-h"><strong>${date}: ${e.kind} ${e.solar ? "solar" : "lunar"} eclipse</strong> in ${E.SIGNS[s]} ${Math.floor(e.useLon % 30)}°
        ${hit ? tonePillL("mixed", "Touches your chart") : tonePillL("quiet", "Background")}</div>
      <p>${hit ? `It falls ${hit.how === "on" ? "right on" : "opposite"} your ${hit.who} (within ${hit.orb.toFixed(1)}°). Tradition says an eclipse on a planet marks a turning point in what it rules: ${esc(runs[hit.who])}. Expect change in that area over the following months, often the end of one chapter and the start of another.`
        : `It lands in your ${E.ordinal(house)} house (${esc(HOUSE_W[house])}) without touching a planet, so tradition reads it as a background theme rather than a turning point.`}
      ${e.solar ? "" : ""}</p></li>`; }).join("");
  return `<article class="card"><header class="card-h"><h3>${g("eclipse", "Eclipses")} ahead and your chart</h3>${sysTag(vedic ? "Vedic" : "Western")}</header>
    <p>Eclipses were the most closely watched sky events in ancient astrology. ${vedic ? "In Vedic astrology they happen when the Sun and Moon meet Rahu and Ketu." : "They happen near the Moon's nodes, about every six months."} What matters most is whether one lands on (or opposite) a planet or angle in your chart, within about 3°.</p>
    <ul class="plain starlist">${rows || "<li>No eclipses found in the next two years.</li>"}</ul>
    <p class="fine">${vedic ? "Positions use the sidereal (Lahiri) zodiac." : "Positions use the tropical zodiac."} Solar eclipses are traditionally weighed more for outer events, lunar eclipses for emotional and private ones.</p></article>`;
}
function yogasCard() {
  const ys = L.vedicYogas(S.chart);
  const rows = ys.map((y) => `<li class="starrow"><div class="star-h"><strong>${esc(y.name)}</strong> ${tonePillL(y.tone)}</div>
    <p>${esc(y.what)}</p><p class="fine"><strong>Why:</strong> ${esc(y.why)}${y.common ? ` ${esc(y.common)}` : ""}</p></li>`).join("");
  return `<article class="card"><header class="card-h"><h3>${g("vyoga", "Yogas")} in your birth chart</h3>${sysTag("Vedic")}</header>
    <p>A <em>yoga</em> is a planetary combination with a traditional promise attached. Classic texts list hundreds; these are the best-known ones. Many are common, so none of them alone makes or breaks a life. Tradition says they show their results most during the dashas of the planets involved.</p>
    <ul class="plain starlist">${rows || "<li>None of the best-known yogas form in your chart. That's not a bad sign; most of a chart's story is told by the planets themselves.</li>"}</ul>
    ${S.birth.reliability !== "certificate" ? '<p class="fine">Yogas that use houses or the rising sign depend on your birth time.</p>' : ""}</article>`;
}
function mansionCard(lo) {
  const tz = lo.loc.tz, mi = L.mansionOf(E.lonAt(lo.now, "Moon")), m = L.MANSIONS[mi];
  const end = E.nextChange((t) => L.mansionOf(E.lonAt(t, "Moon")), lo.now);
  const nm = L.mansionOf(S.chart.western.planets.Moon.lon), n = L.MANSIONS[nm];
  return `<article class="card"><header class="card-h"><h3>The Moon's mansion: ${esc(m[0])}</h3>${tonePillL(m[2])}</header>
    <p class="inshort"><strong>Until ${fmtWhen(end, tz, lo.now)}:</strong> good for ${esc(m[3])}.${m[4] ? ` Avoid ${esc(m[4])}.` : ""}</p>
    <p>Medieval astrologers split the Moon's monthly path into 28 "mansions", one for each night, and used them to time actions. Today's is mansion ${mi + 1}, ${esc(m[0])} ("${esc(m[1])}"). The uses come from Agrippa's <em>Three Books of Occult Philosophy</em> (1533).</p>
    <p class="fine">Your birth Moon was in mansion ${nm + 1}, ${esc(n[0])} ("${esc(n[1])}"), a mansion Agrippa links with ${esc(n[3])}. These are the Arabic mansions, measured from 0° Aries in the tropical zodiac; Vedic astrology's nakshatras are a related but separate system.</p></article>`;
}
function returnCard(vedic) {
  const c = S.chart, b = S.birth, now = Date.now();
  const key = (vedic ? "v" : "w") + new Date(now).toISOString().slice(0, 10);
  if (!S.sr || S.sr.key !== key) {
    const t = L.solarReturnTime(c, now, vedic);
    S.sr = { key, t, rc: t ? L.returnChart(c, t, b.lat, b.lon) : null };
  }
  const { t, rc } = S.sr;
  if (!rc) return "";
  const when = new Date(t).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: b.tz });
  const age = new Date(t).getUTCFullYear() - b.y;
  const ben = ["Venus", "Jupiter"], mal = ["Mars", "Saturn"];
  if (!vedic) {
    const ra = rc.western.asc, natAsc = c.western.asc, inNatal = E.wsHouse(ra, natAsc);
    const sunH = E.wsHouse(rc.western.planets.Sun.lon, ra), moonH = E.wsHouse(rc.western.planets.Moon.lon, ra);
    const ang = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"].filter((n) => [1, 4, 7, 10].includes(E.wsHouse(rc.western.planets[n].lon, ra)));
    const angTxt = ang.length ? ang.map((n) => `${n} (${E.ordinal(E.wsHouse(rc.western.planets[n].lon, ra))} house)${ben.includes(n) ? " " + tonePillL("good") : mal.includes(n) ? " " + tonePillL("low") : ""}`).join(", ") : "none";
    return `<article class="card"><header class="card-h"><h3>Your birthday chart (solar return)</h3>${sysTag("Western")}</header>
      <p class="inshort"><strong>In short:</strong> this birthday year (age ${age}) leans toward ${esc(HOUSE_W[sunH])}, with your feelings tied up in ${esc(HOUSE_W[moonH])}.</p>
      <p>A solar return is a chart for the exact moment the Sun comes back to where it was when you were born. Astrologers read it as a snapshot of the year from that birthday to the next. Yours was ${esc(when)}.</p>
      <ul class="plain daylist">
        <li><strong>Year's rising sign: ${E.SIGNS[E.signIdx(ra)]}</strong>, which falls in your birth chart's ${E.ordinal(inNatal)} house: ${esc(HOUSE_W[inNatal])} sets the tone for the year.</li>
        <li><strong>The Sun lands in the ${E.ordinal(sunH)} house</strong> of the return chart: where the year's main focus and effort go.</li>
        <li><strong>The Moon lands in the ${E.ordinal(moonH)} house:</strong> what you'll need emotionally this year.</li>
        <li><strong>Planets on the angles:</strong> ${angTxt}. Tradition says planets on the angles of a return chart dominate the year; Venus and Jupiter there help, Mars and Saturn there bring tests.</li></ul>
      <p class="fine">Cast for your birthplace. Some astrologers cast it for where you spend your birthday instead, which can change the houses. Depends on your birth time being accurate.</p></article>`;
  }
  const vl = rc.vedic.lagna, natLag = c.vedic.lagna, inNatal = E.wsHouse(vl, natLag);
  const munthaSign = (E.signIdx(natLag) + age) % 12, munthaH = ((munthaSign - E.signIdx(vl)) % 12 + 12) % 12 + 1;
  const mTone = L.MUNTHA_GOOD.includes(munthaH) ? "good" : L.MUNTHA_OK.includes(munthaH) ? "mixed" : "low";
  const sunH = E.wsHouse(rc.vedic.planets.Sun.lon, vl);
  return `<article class="card"><header class="card-h"><h3>Your year chart (Varshaphal)</h3>${sysTag("Vedic")}</header>
    <p class="inshort"><strong>In short:</strong> the Muntha, the year's key point, falls in the ${E.ordinal(munthaH)} house of your year chart. ${mTone === "good" ? "Tradition counts this among the best placements: a year of progress and gains." : mTone === "mixed" ? "Tradition counts this as a fair placement: steady, with effort rewarded." : "Tradition counts this as a harder placement: a year to be careful, especially with " + esc(HOUSE_SHOWS[munthaH]) + "."} ${tonePillL(mTone)}</p>
    <p>The Varshaphal (Tajika) year chart is cast for the moment the Sun returns to its sidereal birth position: ${esc(when)} (age ${age}).</p>
    <ul class="plain daylist">
      <li><strong>Year lagna: ${E.SIGNS[E.signIdx(vl)]}</strong>, your birth chart's ${E.ordinal(inNatal)} house, so ${esc(HOUSE_SHOWS[inNatal])} come to the front this year.</li>
      <li><strong>Muntha in ${E.SIGNS[munthaSign]}:</strong> it starts in your birth lagna sign and moves one sign each year. In the year chart it sits in the ${E.ordinal(munthaH)} house (${esc(HOUSE_SHOWS[munthaH])}). Tajika texts rate the 9th, 10th and 11th best and the 4th, 6th, 7th, 8th and 12th hardest.</li>
      <li><strong>The Sun in the year chart's ${E.ordinal(sunH)} house:</strong> where much of the year's effort goes.</li></ul>
    <p class="fine">Cast for your birthplace with Lahiri ayanamsa. Full Tajika analysis also picks a "lord of the year" from five candidates; that isn't included here. Depends on your birth time being accurate.</p></article>`;
}
function viewLore() {
  const lo = loreNow();
  return `
  <section class="intro"><p class="eyebrow">Star lore · ${SYS()}</p><h2>The older, deeper techniques</h2>
    <p>These are the traditional and more mystical tools astrologers have used for centuries: ${isV() ? "the Hindu almanac (panchanga), auspicious and inauspicious windows, the lore of the nakshatras, and the classic yogas in your chart" : "planetary hours, the void-of-course Moon, the 28 lunar mansions, decans and their tarot cards, fixed stars, lots and eclipses"}. ${isV() ? "Switch to Western for planetary hours, decans and fixed stars." : "Switch to Vedic for the panchanga, Rahu Kaal and nakshatra lore."}</p>
    <p class="fine">Like everything here, these describe what tradition says. They're for reflection and planning, not rules you have to follow.</p></section>
  ${isV() ? loreVedic(lo) : loreWestern(lo)}`;
}
function bindLore() {
  const ch = $("#hereChange"), box = $("#hereBox");
  if (ch) ch.onclick = async () => { box.hidden = !box.hidden; if (!box.hidden) { $("#hereInp").focus(); await loadCities(); } };
  const reset = $("#hereReset"); if (reset) reset.onclick = () => { try { localStorage.removeItem("nightalmanac.here"); } catch { /* ignore */ } S.lore = null; render(); };
  const inp = $("#hereInp"), res = $("#hereRes");
  if (inp) inp.oninput = async () => {
    await loadCities();
    const list = searchCities(inp.value);
    res.innerHTML = list.map((c, i) => `<li><button type="button" data-i="${i}">${esc(placeLabel(c))}</button></li>`).join("");
    res.querySelectorAll("button").forEach((b) => { b.onclick = () => { const c = list[+b.dataset.i];
      store.set("nightalmanac.here", { place: placeLabel(c), lat: c.lat, lon: c.lon, tz: c.tz }); S.lore = null; render(); }; });
  };
}

// ---------------------------------------------------------------- Compatibility
const PEOPLE_KEY = "nightalmanac.people";
const people = () => store.get(PEOPLE_KEY, []);
const ASP_WORD = { conjunction: "are joined", trine: "flow together", sextile: "support each other", square: "clash", opposition: "pull in opposite directions" };
const PT_LABEL = (who, p) => `${who} ${p === "Rising" ? "rising sign" : p}`;
function personChart(p) {
  if (!S.pCache) S.pCache = {};
  if (!S.pCache[p.id]) S.pCache[p.id] = E.computeChart({ y: p.y, m: p.m, d: p.d, h: p.timeKnown ? p.h : 12, mi: p.timeKnown ? p.mi : 0, lat: p.lat, lon: p.lon, tz: p.tz });
  return S.pCache[p.id];
}
function compatForm() {
  return `<form class="card compatform" id="pForm" hidden>
    <header class="card-h"><h3>Add someone</h3></header>
    <div class="formgrid">
      <div class="row"><label for="pName">Their name or nickname</label><input id="pName" type="text" maxlength="40" required></div>
      <div class="row"><label for="pRel">Relationship</label><select id="pRel"><option value="love">Partner or love interest</option><option value="friend">Friend or family</option></select></div>
      <div class="row"><label for="pDate">Birth date</label><input id="pDate" type="date" required min="1900-01-01" max="2100-12-31"></div>
      <div class="row"><label for="pTime">Birth time</label><input id="pTime" type="time" value="12:00">
        <label class="checkline"><input type="checkbox" id="pNoTime"> I don't know their birth time</label></div>
      <div class="row placewrap"><label for="pPlace">Birthplace</label><input id="pPlace" type="text" autocomplete="off" placeholder="Start typing a city" required>
        <ul id="pPlaceRes" class="cityres"></ul><p class="fine" id="pPlacePicked"></p></div>
    </div>
    <p class="err" id="pErr" hidden></p>
    <div class="btns"><button type="submit" class="btn btn-primary">Save and compare</button><button type="button" class="btn" id="pCancel">Cancel</button></div>
    <p class="fine">Their details are saved only on this device, like yours. Please only add people who'd be comfortable with it.</p>
  </form>`;
}
function synastryHTML(p, rel) {
  const s = C.synastry(S.chart, personChart(p), S.birth.reliability === "certificate", p.timeKnown), nm = esc(p.name);
  const FR_WORD = { good: "Low friction", mixed: "Some friction", low: "High friction", quiet: "Quiet" };
  const themeCards = s.themes.map((t) => {
    const items = t.found.slice(0, 4).map((c) => {
      const tone = c.score > 0 ? "t-up" : c.score < 0 ? "t-down" : "t-flat";
      return `<li class="${tone}"><strong>${PT_LABEL("Your", c.a)} and ${PT_LABEL(`${nm}'s`, c.b)} ${ASP_WORD[c.type]}</strong> (a ${c.type}, within ${c.orb.toFixed(1)}°): ${esc(c.means)}.</li>`; }).join("");
    const word = t.id === "friction" ? FR_WORD[t.tone] : TONE_WORD[t.tone];
    return `<article class="card"><header class="card-h"><h3>${rel === "love" ? t.love : t.friend}</h3>${tonePillL(t.tone, word)}</header>
      <p class="fine">About ${t.what}.</p>
      ${items ? `<ul class="daylist">${items}</ul>` : `<p>No close contacts here, so this area isn't strongly marked either way. It depends more on the two of you than on the stars.</p>`}</article>`;
  }).join("");
  const best = s.themes.filter((t) => t.id !== "friction" && t.tone === "good").map((t) => (rel === "love" ? t.love : t.friend).toLowerCase());
  const fr = s.themes.find((t) => t.id === "friction");
  const elLine = (k, a, b) => ({ same: `both ${a}`, complementary: `${a} and ${b}, a naturally complementary pair`, different: `${a} and ${b}, which work differently` })[k];
  return `<article class="card lorenow"><header class="card-h"><h3>You and ${nm}</h3>${sysTag("Western")}</header>
      <p class="inshort"><strong>In short:</strong> ${best.length ? `your strongest links are ${best.join(" and ")}` : "no single area stands out strongly"}${fr.tone === "low" ? ", and there's real friction to manage" : fr.tone === "mixed" ? ", with some friction to work through" : ""}.</p>
      <p>Your Suns are ${elLine(s.sun, s.elements.aSun, s.elements.bSun)}; your Moons are ${elLine(s.moon, s.elements.aMoon, s.elements.bMoon)}. This is <em>synastry</em>: comparing where the planets were in each birth chart and reading the angles between them.</p>
      ${!p.timeKnown || S.birth.reliability !== "certificate" ? `<p class="fine">${!p.timeKnown ? `${nm}'s birth time is unknown, so their rising sign is left out and their Moon position is approximate (it moves about 13° a day).` : ""} ${S.birth.reliability !== "certificate" ? "Your birth time isn't certain, so your rising sign is left out." : ""}</p>` : ""}
      <p class="fine">Compatibility astrology describes tendencies tradition associates with two charts. It can't tell you whether a relationship will work; that's up to the two of you.</p></article>
    <div class="grid2">${themeCards}</div>`;
}
function ashtakootaHTML(p) {
  const me = S.chart, them = personChart(p), role = p.role || "me";
  const r = role === "me" ? C.ashtakoota(me, them) : C.ashtakoota(them, me);
  const other = role === "me" ? C.ashtakoota(them, me) : C.ashtakoota(me, them);
  const [tone, word, text] = C.gunaVerdict(r.total), nm = esc(p.name);
  const rows = r.kootas.map((k) => `<tr><th scope="row">${k.name}<br><span class="fine">${esc(k.about)}</span></th><td><strong>${k.pts} / ${k.max}</strong></td>
    <td>${esc(k.detail)}${k.dosha ? `<br><span class="fine">${k.dosha}${k.cancelled ? ": cancelled by a classical exception, so many astrologers don't count it against the match." : ": traditional matchmakers look at the full charts before deciding."}</span>` : ""}</td></tr>`).join("");
  return `<article class="card lorenow"><header class="card-h"><h3>Ashtakoota: ${r.total} out of 36</h3>${tonePillL(tone, word)}</header>
      <p class="inshort"><strong>In short:</strong> ${text}</p>
      <p>Ashtakoota ("eight factors"), also called Guna Milan, is the traditional Vedic way of matching two people for marriage. It compares your birth Moons: their signs and nakshatras (${E.NAKSHATRAS[r.bride.nak]} and ${E.NAKSHATRAS[r.groom.nak]}).</p>
      <div class="btns roleswitch" role="group" aria-label="Traditional roles"><span class="fine">The traditional tables assign a "bride" and a "groom" role:</span>
        <button type="button" class="btn${role === "me" ? " btn-primary" : ""}" data-role="me">You as bride</button>
        <button type="button" class="btn${role === "them" ? " btn-primary" : ""}" data-role="them">${nm} as bride</button></div>
      ${other.total !== r.total ? `<p class="fine">With the roles swapped the score is ${other.total}, because a few factors are one-directional.</p>` : `<p class="fine">The score is the same either way round.</p>`}
      <div class="tbl"><table class="panch"><tbody>${rows}</tbody></table></div>
      ${!p.timeKnown ? `<p class="warn">${nm}'s birth time is unknown, so their Moon's nakshatra may be off by one, which can change several factors. Treat this score as approximate.</p>` : ""}
      <p class="fine">Traditional families also check Manglik (Mars) placement and the full charts. A score is a starting point, not a verdict on a relationship.</p></article>`;
}
function viewCompat() {
  const ps = people(), sel = ps.find((x) => x.id === S.pSel) || ps[0];
  if (sel) S.pSel = sel.id;
  const chips = ps.map((x) => `<button type="button" class="pchip${sel && x.id === sel.id ? " on" : ""}" data-pid="${x.id}" aria-pressed="${!!(sel && x.id === sel.id)}">${esc(x.name)}</button>`).join("");
  return `
  <section class="intro"><p class="eyebrow">Compatibility · ${SYS()}</p><h2>You and someone else</h2>
    <p>Compare your chart with a partner's, a friend's or a family member's. ${isV() ? "Vedic mode uses Ashtakoota, the traditional 36-point marriage matching." : "Western mode reads the links between your two charts (synastry), theme by theme."} ${isV() ? "Switch to Western for a theme-by-theme reading." : "Switch to Vedic for the traditional 36-point score."}</p></section>
  <div class="chips">${chips}<button type="button" class="btn" id="pAdd">+ Add someone</button></div>
  ${compatForm()}
  ${sel ? `${isV() ? ashtakootaHTML(sel) : synastryHTML(sel, sel.rel)}
    <p class="fine">${esc(sel.name)}: born ${new Date(Date.UTC(sel.y, sel.m - 1, sel.d)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}${sel.timeKnown ? ` at ${String(sel.h).padStart(2, "0")}:${String(sel.mi).padStart(2, "0")}` : " (time unknown)"} in ${esc(sel.place)}.
      <button type="button" class="linkbtn" id="pDel">Remove ${esc(sel.name)}</button></p>
    <div id="pDelConfirm" hidden class="confirm"><p>Remove ${esc(sel.name)} from this device?</p><div class="btns"><button type="button" class="btn btn-primary" id="pDelYes">Remove</button><button type="button" class="btn" id="pDelNo">Cancel</button></div></div>`
    : `<article class="card"><p>Add someone to see how your charts fit together. You'll need their birth date and birthplace; the birth time helps but isn't required.</p></article>`}
  ${S.isExample ? '<p class="warn">You\'re looking at the example chart. Enter your own birth details (top right) for a real comparison.</p>' : ""}`;
}
function bindCompat() {
  const f = $("#pForm");
  $("#pAdd").onclick = () => { f.hidden = false; $("#pName").focus(); };
  $("#pCancel").onclick = () => { f.hidden = true; };
  document.querySelectorAll("[data-pid]").forEach((b) => { b.onclick = () => { S.pSel = b.dataset.pid; render(); }; });
  document.querySelectorAll("[data-role]").forEach((b) => { b.onclick = () => {
    const ps = people(), x = ps.find((q) => q.id === S.pSel); if (x) { x.role = b.dataset.role; store.set(PEOPLE_KEY, ps); render(); } }; });
  $("#pNoTime").onchange = (e) => { $("#pTime").disabled = e.target.checked; };
  let chosen = null;
  const inp = $("#pPlace"), res = $("#pPlaceRes");
  inp.oninput = async () => {
    chosen = null; $("#pPlacePicked").textContent = "";
    await loadCities();
    const list = searchCities(inp.value);
    res.innerHTML = list.map((c, i) => `<li><button type="button" data-i="${i}">${esc(placeLabel(c))}</button></li>`).join("");
    res.querySelectorAll("button").forEach((b) => { b.onclick = () => { chosen = list[+b.dataset.i]; inp.value = placeLabel(chosen); res.innerHTML = "";
      $("#pPlacePicked").textContent = `Using ${placeLabel(chosen)} (${chosen.lat.toFixed(2)}, ${chosen.lon.toFixed(2)}).`; }; });
  };
  f.onsubmit = (e) => {
    e.preventDefault();
    const err = (m) => { const el = $("#pErr"); el.textContent = m; el.hidden = false; };
    const name = $("#pName").value.trim(), dv = $("#pDate").value, noTime = $("#pNoTime").checked, tv = $("#pTime").value || "12:00";
    if (!name) return err("Please enter a name.");
    if (!dv) return err("Please enter their birth date.");
    if (!chosen) return err("Please pick their birthplace from the suggestions.");
    const [y, m, d] = dv.split("-").map(Number), [h, mi] = tv.split(":").map(Number);
    const ps = people(), id = "p" + Date.now().toString(36);
    ps.push({ id, name, rel: $("#pRel").value, y, m, d, h, mi, timeKnown: !noTime, lat: chosen.lat, lon: chosen.lon, tz: chosen.tz, place: placeLabel(chosen), role: "me" });
    store.set(PEOPLE_KEY, ps); S.pSel = id; render();
  };
  const del = $("#pDel");
  if (del) {
    del.onclick = () => { $("#pDelConfirm").hidden = false; };
    $("#pDelNo").onclick = () => { $("#pDelConfirm").hidden = true; };
    $("#pDelYes").onclick = () => { store.set(PEOPLE_KEY, people().filter((x) => x.id !== S.pSel)); if (S.pCache) delete S.pCache[S.pSel]; S.pSel = null; render(); };
  }
}

// ---------------------------------------------------------------- Numerology
const EX_NAME = "Jordan Avery Lane";
function numName() { return store.get("nightalmanac.fullname", "") || (S.isExample ? EX_NAME : (S.birth.name || "")); }
function numCard(title, what, r, big) {
  if (!r) return "";
  const n = N.NUM[r.value];
  return `<article class="card numcard${big ? " numbig" : ""}">
    <div class="num-h"><span class="numglyph" aria-hidden="true">${r.value}</span>
      <div><p class="eyebrow">${title}</p><h3>${n.word}</h3><p class="fine">${what}</p></div></div>
    <p>You're ${n.core}.</p>
    ${big ? `<dl class="numdl"><div><dt>Strengths</dt><dd>${n.strong}</dd></div><div><dt>Watch out for</dt><dd>${n.watch}</dd></div>
      <div><dt>In love</dt><dd>${n.love}</dd></div><div><dt>At work</dt><dd>${n.work}</dd></div></dl>` : ""}
    <details class="basis-d"><summary>How it's calculated</summary><ul class="basis">${r.work.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></details>
  </article>`;
}
function viewNumerology() {
  const b = S.birth, name = numName(), now = new Date();
  const lp = N.lifePath(b.y, b.m, b.d), bd = N.birthday(b.d);
  const ex = N.expression(name), su = N.soulUrge(name), pe = N.personality(name);
  const py = N.personalYear(b.m, b.d, now.getFullYear()), pm = N.personalMonth(py.value, now.getMonth() + 1), pd = N.personalDay(pm, now.getDate());
  const nameLetters = new Set(String(name).normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().split(""));
  const letterChart = `<div class="tbl"><table class="lettertab"><thead><tr>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<th>${n}</th>`).join("")}</tr></thead><tbody>
    ${[0, 1, 2].map((row) => `<tr>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => { const code = 64 + row * 9 + n, ch = code <= 90 ? String.fromCharCode(code) : "";
      return `<td class="${ch && nameLetters.has(ch) ? "hit" : ""}">${ch}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  const startY = now.getFullYear() - (py.value - 1);
  const cycle = `<ol class="cycle">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<li class="${n === py.value ? "on" : n < py.value ? "past" : ""}">
    <span class="cy-n">${n}</span><span class="cy-y">${startY + n - 1}</span><span class="cy-w">${N.YEAR[n][0]}</span></li>`).join("")}</ol>`;
  const ref = `<div class="tbl"><table class="numref"><thead><tr><th>Number</th><th>Theme</th><th>Strengths</th><th>Watch out for</th></tr></thead><tbody>
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].map((k) => `<tr><td class="nr-n">${k}</td><td><strong>${N.NUM[k].word.replace(" (master number)", "")}</strong>${N.MASTER.includes(k) ? '<br><span class="fine">master number</span>' : ""}</td><td>${N.NUM[k].strong}</td><td>${N.NUM[k].watch}</td></tr>`).join("")}</tbody></table></div>`;
  return `
  <section class="intro">
    <p class="eyebrow">Numerology</p>
    <h2>Your numbers</h2>
    <p>Numerology turns your birth date and name into a few key numbers, each with its own meaning. This page uses the Pythagorean system, the most common one in the US and Europe. Like astrology, it's a tradition for reflection, not a science.</p>
  </section>
  <form class="card numname" id="numForm">
    <div class="row"><label for="numName">Your full name at birth</label>
      <input id="numName" type="text" maxlength="80" value="${esc(name)}" placeholder="First, middle and last name, as on your birth certificate"></div>
    <p class="fine">${S.isExample && !store.get("nightalmanac.fullname", "") ? "Showing an example name. " : ""}Numerology uses the full name you were given at birth. Your name stays on this device.</p>
    <button class="btn btn-primary" type="submit">Update my numbers</button>
  </form>
  <div class="numgrid">
    ${numCard("Life Path", "Your main life theme, from your full birth date. The most important number.", lp, true)}
    ${numCard("Expression", "Your natural talents, from every letter of your birth name.", ex)}
    ${numCard("Soul Urge", "What you want deep down, from the vowels in your name.", su)}
    ${numCard("Personality", "How others see you at first, from the consonants in your name.", pe)}
    ${numCard("Birthday", `A special gift, from the day you were born (the ${E.ordinal(b.d)}).`, bd)}
  </div>
  <article class="card">
    <header class="card-h"><h3>Your 9-year cycle</h3></header>
    <p class="inshort"><strong>In short:</strong> ${now.getFullYear()} is a <strong>${py.value} year</strong> for you: ${N.YEAR[py.value][0].toLowerCase()}. ${N.YEAR[py.value][1]}</p>
    ${cycle}
    <p>This month is a <strong>${pm}</strong> month (${N.YEAR[pm][0].toLowerCase()}), and today is a <strong>${pd}</strong> day (${N.YEAR[pd][0].toLowerCase()}).</p>
    <details class="basis-d"><summary>How it's calculated</summary><ul class="basis">${py.work.map((w) => `<li>${esc(w)}</li>`).join("")}
      <li>Personal month: year ${py.value} + month ${now.getMonth() + 1} → ${pm}. Personal day: month ${pm} + day ${now.getDate()} → ${pd}.</li>
      <li>This app counts personal years from January 1. Some numerologists start them on your birthday instead.</li></ul></details>
  </article>
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>Letter chart</h3></header>
      <p>Each letter has a number from 1 to 9. The letters in your name are highlighted.</p>
      ${letterChart}
      <p class="fine">Vowels (A, E, I, O, U) make your Soul Urge; consonants make your Personality. This app counts Y as a consonant, as many numerologists do.</p>
    </article>
    <article class="card">
      <header class="card-h"><h3>What each number means</h3></header>
      <p>Master numbers (11, 22, 33) aren't reduced further. They're read as a stronger, more intense version of 2, 4 and 6.</p>
      ${ref}
    </article>
  </div>`;
}
function bindNumerology() {
  $("#numForm").onsubmit = (e) => { e.preventDefault(); store.set("nightalmanac.fullname", $("#numName").value.trim()); render(); };
}

// ---------------------------------------------------------------- Ask
const VERDICT_MEANING = {
  good: "KP reads this as promised in your chart. How and when it plays out still depends on your circumstances and choices.",
  mixed: "Your chart shows support for this, but also opposing factors. KP reads that as possible, with delays or obstacles along the way.",
  low: "KP doesn't find strong support for this in your chart. That isn't a prediction that it can't happen.",
};
const W_VERDICT = {
  good: ["Well supported", "Western astrology sees this area as well supported in your chart."],
  mixed: ["Mixed", "Your chart shows both helpful and difficult factors here, read as possible with some effort or delays."],
  low: ["Challenging", "Your chart shows more difficult than helpful factors here. That's read as an area that takes more work, not as a 'no'."],
};
const LABEL_CLASS = { Strong: "lv-strong", Supportive: "lv-support", Weak: "lv-weak", Opposing: "lv-oppose", "Not connected": "lv-none" };
function viewAsk() {
  const qs = E.KP_QUESTIONS;
  const v = isV();
  return `
  ${tabHead("Ask a specific question", v
    ? `Answers use ${g("kp", "KP")}, a Vedic method built for yes/no questions. Each answer starts with a plain summary, then shows the reasoning so you can check it.`
    : "Answers use traditional Western astrology: how strong the relevant part of your chart is, and which years activate it. Each answer starts with a plain summary, then shows the reasoning.")}
  ${v ? `<div class="ask-modes" role="tablist">
    <button class="seg ${S.askMode !== "horary" ? "on" : ""}" id="modeNatal" type="button">From your birth chart</button>
    <button class="seg ${S.askMode === "horary" ? "on" : ""}" id="modeHorary" type="button">${g("horary", "Horary")} (no birth time needed)</button>
  </div>` : ""}
  ${v && S.askMode === "horary" ? `
    <form class="card horary" id="horaryForm">
      <p>Hold one question in mind, then pick any number from 1 to 249 without overthinking it. In KP horary the number sets up the chart, and the planets are taken for this moment at your birthplace.</p>
      <div class="row"><label for="hq">Question</label>
        <select id="hq">${qs.map((q) => `<option value="${q.id}">${esc(q.label)}</option>`).join("")}</select></div>
      <div class="row"><label for="hn">Your number</label>
        <input id="hn" type="number" min="1" max="249" required inputmode="numeric" placeholder="1–249"></div>
      <button class="btn btn-primary" type="submit">Get answer</button>
    </form>` : `
    ${timeWarning(v ? "kp" : "houses")}
    <div class="qgrid">${qs.map((q) => `<button class="qbtn${S.ask && S.ask.question.id === q.id && !S.ask.horary ? " on" : ""}" data-q="${q.id}" type="button">${esc(q.label)}</button>`).join("")}</div>`}
  <div id="answer">${S.ask ? (S.ask.sys === "western" ? westernAnswerHTML(S.ask) : answerHTML(S.ask)) : ""}</div>
  <p class="fine">Missing people, health, death, legal cases and money decisions aren't on this list on purpose. Astrology can't answer them, and those situations need real help from police, doctors, lawyers or advisors.</p>`;
}
function kpInShort(a) {
  const base = { good: "KP reads this as likely in your chart", mixed: "KP reads this as possible, with some delays or obstacles", low: "KP doesn't find strong support for this in your chart" }[a.tone];
  const sb = (a.soon || []).find((w) => w.best);
  if (sb) return `${base}. The most promising time in the next two years is ${fmtRange(sb.start, sb.end)}.`;
  if (a.horary || !a.windows.length) return base + ".";
  const w = a.windows[0];
  return `${base}. The ${a.far ? "nearest well-matched" : "best-matching"} time is ${fmtMY(w.start)} – ${fmtMY(w.end)}.`;
}
function answerHTML(a) {
  const q = a.question, sig = a.signifies;
  const toneClass = { good: "v-good", mixed: "v-mixed", low: "v-low" }[a.tone];
  const order = ["Strong", "Supportive", "Weak", "Opposing", "Not connected"];
  const ranked = Object.entries(a.planets).sort((x, y) => order.indexOf(x[1].label) - order.indexOf(y[1].label) || y[1].score - x[1].score);
  const rankWord = a.far ? ["Nearest match", "Next", "After that"] : ["Best match", "Second best", "Third best"];
  const timing = a.horary ? '<p class="fine">Timing for horary questions uses KP "ruling planets" and isn\'t included yet.</p>' : `
    ${soonHTML(a.soon || [], "Vedic")}
    <h4>Further out</h4>
    ${a.windows.length ? `
      <p class="sub">${a.far ? "Nearest longer periods that match, in date order" : "Best-matching longer periods in the next 15 years"}</p>
      <ol class="wins">${a.windows.map((w, i) => `<li>
        <span class="win-rank">${rankWord[i]}</span>
        <span class="mono">${fmtMY(w.start)} – ${fmtMY(w.end)}</span>
        <span>${w.md} long period, ${w.ad} sub-period${w.both ? "" : ` (the ${w.md} period is only weakly connected)`}</span></li>`).join("")}</ol>
      <p class="note">These are alternatives, not separate events: KP would expect this in one of them. ${a.far ? "Traditionally the earliest well-matched period is the most likely." : "The top-ranked window is the most likely."}</p>`
      : "<p>No upcoming period is run by planets that connect strongly to this question.</p>"}
    ${a.past ? `<p class="note"><strong>Looking back:</strong> the best-matching past window was ${fmtMY(a.past.start)} – ${fmtMY(a.past.end)}. If this already happened in your life, check whether it fell in that window. That's a fair test of the method.</p>` : ""}
    <details class="basis-d"><summary>How the timing works</summary>
      <p>KP times events with the ${g("dasha", "dasha")} periods. Each period is run by two planets: a long period and a shorter sub-period inside it. An event is expected when both planets connect strongly to houses ${q.fav.join(", ")}. Here's how each planet in your chart relates to this question:</p>
      <ul class="lvls">${ranked.map(([p, v]) => `<li><span class="lv ${LABEL_CLASS[v.label]}">${v.label}</span><strong>${p}</strong><span class="fine">${v.fav.length ? `connects to ${v.fav.join(", ")}` : "no supporting houses"}${v.neg.length ? ` · opposing ${v.neg.join(", ")}` : ""}</span></li>`).join("")}</ul>
    </details>`;
  return `
  <article class="card answer">
    <p class="eyebrow">${sysTag("Vedic")} ${a.horary ? `KP horary · number ${a.horary.number} · ${fmtD(a.horary.ms)}` : "KP · from your birth chart"}</p>
    <h3>${esc(q.label)}</h3>
    <p class="verdict ${toneClass}">${esc(a.verdict)}</p>
    <p class="inshort"><strong>In short:</strong> ${kpInShort(a)}</p>
    <p>${VERDICT_MEANING[a.tone]}</p>
    ${timing}
    <details class="basis-d"><summary>Why KP says this</summary>
      <p>In KP, one point decides each question: the ${g("sublord", "sub lord")} of the house for that topic. Here that's the ${E.ordinal(q.cusp)} ${g("house", "house")}, and its sub lord is <strong>${a.subLord}</strong>, which connects to houses ${sig.all.join(", ")}. KP counts houses ${q.fav.join(", ")} as supporting this question and ${q.neg.join(", ")} as opposing it. ${a.favHits.length ? `${a.subLord} connects to the supporting houses ${a.favHits.join(", ")}` : `${a.subLord} doesn't connect to any supporting house`}${a.negHits.length ? ` and to the opposing houses ${a.negHits.join(", ")}` : ""}.</p>
      <ul class="basis">
        <li>${E.ordinal(q.cusp)} cusp sub lord: ${a.subLord}; star lord ${sig.starLord} signifies ${sig.primary.join(", ")}; ${a.subLord} itself ${sig.secondary.join(", ")}</li>
        <li>Supporting ${q.fav.join(", ")} · opposing ${q.neg.join(", ")}</li>
        <li>Planet score: significator level (A=4, B=3, C=2, D=1) + 2 per supporting house − 3 per opposing house. Window score: 2 × sub-period + long period.</li>
      </ul></details>
    <p class="fine">This uses a simplified KP rule. It describes what the tradition says, not a certainty, and your own choices still decide what you do.</p>
  </article>`;
}
// Western answer: strength of the topic house, then the years that activate it
const GOOD_HOUSE = { 1: 2, 10: 2, 7: 2, 4: 2, 11: 1, 5: 1, 9: 1, 2: 1, 3: 0, 6: -2, 8: -2, 12: -2 };
function dignity(p, sign) {
  if (!E.CLASSICAL.includes(p)) return [0, ""];
  const si = E.SIGNS.indexOf(sign);
  if (E.RULERS[si] === p) return [2, "at home in its own sign"];
  if (EXALT[p] === sign) return [2, "exalted (at its strongest)"];
  if (E.RULERS[(si + 6) % 12] === p) return [-2, "in detriment (uncomfortable)"];
  if (EXALT[p] && E.SIGNS[(E.SIGNS.indexOf(EXALT[p]) + 6) % 12] === sign) return [-2, "in fall (weakened)"];
  return [0, ""];
}
function placeText(pts) { return pts >= 2 ? "a strong position" : pts === 1 ? "a helpful position" : pts === 0 ? "a neutral position" : "a difficult position"; }
function westernAnswer(q) {
  const cfg = WQ[q.id], c = S.chart, w = c.western, day = w.sect === "day";
  const h = cfg.house, ruler = houseRuler(h), rp = w.planets[ruler];
  const F = [];
  const hp = GOOD_HOUSE[rp.house], [dp, dt] = dignity(ruler, rp.sign);
  F.push({ pts: hp, text: `${ruler} rules your ${E.ordinal(h)} house (${cfg.topic}). It sits in your ${E.ordinal(rp.house)} house, ${placeText(hp)}.` });
  if (dt) F.push({ pts: dp, text: `${ruler} is ${dt} in ${rp.sign}.` });
  if (rp.retro) F.push({ pts: -1, text: `${ruler} was retrograde, read as delays or second attempts.` });
  for (const [n, p] of Object.entries(w.planets)) {
    if (!E.CLASSICAL.includes(n) || p.house !== h) continue;
    if (n === "Jupiter" || n === "Venus") { const sect = (day && n === "Jupiter") || (!day && n === "Venus"); F.push({ pts: sect ? 3 : 2, text: `${n}, a helpful planet, is in your ${E.ordinal(h)} house${sect ? ", and it's the most helpful one for your chart type" : ""}.` }); }
    else if (n === "Mars" || n === "Saturn") { const contrary = (day && n === "Mars") || (!day && n === "Saturn"); F.push({ pts: contrary ? -2 : -1, text: `${n}, a challenging planet, is in your ${E.ordinal(h)} house${contrary ? ", and it's the harder one for your chart type" : ", though it's the more manageable one for your chart type"}.` }); }
    else F.push({ pts: 1, text: `${n} is in your ${E.ordinal(h)} house, putting extra attention on this area.` });
  }
  if (cfg.sig && cfg.sig !== ruler) {
    const sp = w.planets[cfg.sig], shp = GOOD_HOUSE[sp.house], [sdp, sdt] = dignity(cfg.sig, sp.sign);
    const pts = Math.round((shp + sdp) / 2);
    F.push({ pts, text: `${cfg.sig}, the planet traditionally linked to ${cfg.topic}, is in your ${E.ordinal(sp.house)} house${sdt ? ` and ${sdt}` : ""}${sdt && Math.sign(shp) !== Math.sign(sdp) ? `, which balances out to ${placeText(pts)}` : `, ${placeText(pts)}`}.` });
  }
  const total = F.reduce((s, f) => s + f.pts, 0);
  const tone = total >= 3 ? "good" : total >= 0 ? "mixed" : "low";
  // Timing: score each profection year
  const zr = cfg.lot === "Spirit" ? S.zrS : cfg.lot === "Eros" ? S.zrE : S.zrF;
  const yearScore = (y) => {
    let s = 0; const why = [];
    if (y.house === h) { s += 3; why.push(`your yearly focus is the ${E.ordinal(h)} house`); }
    if (y.lord === ruler) { s += 2; why.push(`the year's planet is ${ruler}, ruler of this area`); }
    else if (cfg.sig && y.lord === cfg.sig) { s += 1; why.push(`the year's planet is ${cfg.sig}`); }
    let best = 0, bestP = null;
    for (const a of zr.level1) for (const b of a.level2) if (b.peak && b.end > y.start && b.start < y.end) {
      const v = b.peak === "10th" ? 2 : 1; if (v > best) { best = v; bestP = b; }
    }
    if (best) { s += best; why.push(`a ${peakPlain(bestP.peak)} in ${g("zr", "zodiacal releasing")} from the Lot of ${cfg.lot}`); }
    return { ...y, score: s, why };
  };
  const now = Date.now();
  const future = (yrs) => S.prof.filter((y) => y.end > now && y.start < now + yrs * YEAR).map(yearScore).filter((y) => y.score >= 3);
  let windows = future(15).sort((a, b) => b.score - a.score || a.start - b.start).slice(0, 3), far = false;
  if (!windows.length) { windows = future(45).sort((a, b) => a.start - b.start).slice(0, 3); far = windows.length > 0; }
  const past = S.prof.filter((y) => y.age >= 18 && y.end <= now).map(yearScore).filter((y) => y.score >= 3).sort((a, b) => b.score - a.score || b.start - a.start)[0] || null;
  return { sys: "western", question: q, cfg, ruler, factors: F, total, tone, windows, far, past };
}
function westernAnswerHTML(a) {
  const q = a.question, [vword, vmean] = W_VERDICT[a.tone];
  const toneClass = { good: "v-good", mixed: "v-mixed", low: "v-low" }[a.tone];
  const rankWord = a.far ? ["Nearest match", "Next", "After that"] : ["Best match", "Second best", "Third best"];
  const yrs = a.windows.map((w) => `${fmtY(w.start)}–${fmtY(w.end)}`);
  const inShort = `${vmean.replace("Western astrology sees this area as well supported in your chart.", `Western astrology sees ${a.cfg.topic} as well supported in your chart.`)}${(a.soon || []).find((w) => w.best) ? ` The most promising month in the next two years is ${new Date(a.soon.find((w) => w.best).start).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}.` : a.windows.length ? ` The ${a.far ? "nearest standout" : "standout"} year is ${yrs[0]}.` : ""}`;
  return `
  <article class="card answer">
    <p class="eyebrow">${sysTag("Western")} Traditional Western · profections and zodiacal releasing</p>
    <h3>${esc(q.label)}</h3>
    <p class="verdict ${toneClass}">${vword}</p>
    <p class="inshort"><strong>In short:</strong> ${inShort}</p>
    <h4>What your chart shows</h4>
    <ul class="factors">${a.factors.map((f) => `<li class="${f.pts > 0 ? "f-up" : f.pts < 0 ? "f-down" : "f-flat"}"><span class="fmark" aria-hidden="true">${f.pts > 0 ? "+" : f.pts < 0 ? "−" : "·"}</span><span>${f.text}</span></li>`).join("")}</ul>
    ${soonHTML(a.soon || [], "Western")}
    <h4>Further out</h4>
    ${a.windows.length ? `
      <p class="sub">${a.far ? "Nearest standout years after that, in date order" : "Standout birthday-to-birthday years in the next 15"}</p>
      <ol class="wins">${a.windows.map((w, i) => `<li>
        <span class="win-rank">${rankWord[i]}</span>
        <span class="mono">${fmtMY(w.start)} – ${fmtMY(w.end)}</span>
        <span>Age ${w.age}: ${w.why.join("; ")}</span></li>`).join("")}</ol>
      <p class="note">These are alternatives, not separate events. Western astrology would expect this area to be most active in one of these years. Years run from birthday to birthday.</p>`
      : "<p>No year in the coming decades strongly activates this part of your chart.</p>"}
    ${a.past ? `<p class="note"><strong>Looking back:</strong> the strongest past year was age ${a.past.age} (${fmtMY(a.past.start)} – ${fmtMY(a.past.end)}). If this already happened in your life, check whether it fell in that year.</p>` : ""}
    <details class="basis-d"><summary>How this was worked out</summary><ul class="basis">
      <li>Topic house: ${E.ordinal(a.cfg.house)} (whole-sign) · ${g("ruler", "ruler")}: ${a.ruler}${a.cfg.sig ? ` · natural significator: ${a.cfg.sig}` : ""}</li>
      <li>Score ${a.total}: house position (angular +2, succedent +1, 6/8/12 −2), ${g("dignity", "dignity")} ±2, retrograde −1, ${g("benefic", "benefics")} in house +2/+3, malefics −1/−2, others +1</li>
      <li>Year score: profected to the house +3, year's planet is the ruler +2 (significator +1), ${g("peak", "peak")} from the Lot of ${a.cfg.lot} +1/+2</li></ul></details>
    <p class="fine">This uses a simplified traditional rule. It describes what the tradition says, not a certainty, and your own choices still decide what you do.</p>
  </article>`;
}

// ---- near-term timing (next 2 years)
const fmtRange = (a, b) => {
  const o = { month: "short", day: "numeric", timeZone: "UTC" }, y = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" };
  return `${new Date(a).toLocaleDateString("en-US", new Date(a).getUTCFullYear() === new Date(b).getUTCFullYear() ? o : y)} – ${new Date(b).toLocaleDateString("en-US", y)}`;
};
function kpSoon(a) {
  const now = Date.now(), until = now + 2 * YEAR, P = a.planets, usable = (l) => l === "Strong" || l === "Supportive";
  const out = [];
  for (const md of S.dasha.mahadashas) for (const ad of md.antardashas) {
    if (ad.end < now || ad.start > until) continue;
    for (const pd of E.pratyantar(md, ad)) {
      if (pd.end < now || pd.start > until) continue;
      if (!usable(P[pd.lord].label) || ["Opposing", "Not connected"].includes(P[ad.lord].label)) continue;
      out.push({ start: Math.max(pd.start, now), end: pd.end, md: md.lord, ad: ad.lord, pd: pd.lord, score: 2 * P[pd.lord].score + 1.5 * P[ad.lord].score + P[md.lord].score });
    }
  }
  const top = out.sort((x, y) => y.score - x.score).slice(0, 3);
  const best = top[0];
  return top.sort((x, y) => x.start - y.start).map((w) => ({ ...w, best: w === best,
    text: `A short ${w.pd} phase inside your ${w.md}–${w.ad} period. ${w.pd} connects strongly to this question in your chart.` }));
}
function westSoon(q, cfg, ruler) {
  const now = Date.now(), d0 = new Date(now), out = [];
  const zr = cfg.lot === "Spirit" ? S.zrS : cfg.lot === "Eros" ? S.zrE : S.zrF, h = cfg.house, rlon = S.chart.western.planets[ruler].lon;
  for (let i = 0; i < 24; i++) {
    const a = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i, 1), b = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i + 1, 1), mid = (a + b) / 2;
    const y = S.prof.find((p) => p.start <= mid && mid < p.end); if (!y) continue;
    const k = Math.floor((mid - y.start) / ((y.end - y.start) / 12)), mh = ((y.house - 1 + k) % 12) + 1;
    const T = E.planetsAt(mid), jh = E.wsHouse(T.Jupiter.lon, S.chart.western.asc), sh = E.wsHouse(T.Saturn.lon, S.chart.western.asc);
    let sc = 0; const why = [];
    if (mh === h) { sc += 2; why.push(`your monthly focus is ${F.HOUSE_DO[h]}`); }
    if (y.house === h) { sc += 2; why.push("it's in your year for this area"); }
    if (y.lord === ruler) { sc += 1; why.push(`${ruler}, which rules this area, runs the year`); }
    if (jh === h) { sc += 2; why.push(`Jupiter (luck and growth) is passing through this area of your chart`); }
    if (Math.abs(E.angdiff(T.Jupiter.lon, rlon)) < 6) { sc += 1; why.push(`Jupiter is touching ${ruler}, the ruler of this area`); }
    if (sh === h) { sc -= 1; why.push("Saturn is also here, which can mean delays or extra effort"); }
    for (const l1 of zr.level1) for (const l2 of l1.level2) if (l2.peak && l2.end > a && l2.start < b) { sc += l2.peak === "10th" ? 2 : 1; why.push(`it's a high point in your ${cfg.lot === "Spirit" ? "career" : cfg.lot === "Eros" ? "love" : "life-circumstances"} timeline`); break; }
    if (sc >= 2) out.push({ start: a, end: b, score: sc, why: [...new Set(why)] });
  }
  const top = out.sort((x, y) => y.score - x.score).slice(0, 3), best = top[0];
  return top.sort((x, y) => x.start - y.start).map((w) => ({ ...w, best: w === best }));
}
function soonHTML(list, sys) {
  if (!list.length) return `<h4>Coming up soon</h4><p>No especially strong ${sys === "Vedic" ? "phases" : "months"} for this in the next two years. The long-range view below shows the nearest ones.</p>`;
  const mlabel = (w) => sys === "Vedic" ? fmtRange(w.start, w.end) : new Date(w.start).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return `<h4>Coming up soon: next 2 years</h4>
    <ol class="wins soon">${list.map((w) => `<li class="${w.best ? "is-best" : ""}">
      <span class="win-rank">${w.best ? "Best chance" : "Also good"}</span>
      <span class="mono">${mlabel(w)}</span>
      <span>${sys === "Vedic" ? esc(w.text) : `Why: ${esc(w.why.join("; "))}.`}</span></li>`).join("")}</ol>
    <p class="note">These are the ${sys === "Vedic" ? "phases" : "months"} the tradition sees as most likely, listed in date order. Only one would be "the" time. If you're making a choice, these are the windows astrology would favor.</p>`;
}
function bindAsk() {
  const mn = $("#modeNatal"), mh = $("#modeHorary");
  if (mn) mn.onclick = () => { S.askMode = "natal"; S.ask = null; render(); };
  if (mh) mh.onclick = () => { S.askMode = "horary"; S.ask = null; render(); };
  document.querySelectorAll(".qbtn").forEach((b) => (b.onclick = () => {
    const q = E.KP_QUESTIONS.find((x) => x.id === b.dataset.q);
    if (!isV()) { S.ask = westernAnswer(q); S.ask.soon = westSoon(q, S.ask.cfg, S.ask.ruler); }
    else {
      const now = Date.now();
      const a = E.kpAnswer(S.chart.kp, q, S.dasha, now, 15);
      if (!a.windows.length) { a.windows = E.kpAnswer(S.chart.kp, q, S.dasha, now, 45).earliest; a.far = a.windows.length > 0; }
      const adult = S.chart.utc + 18 * YEAR;
      if (adult < now - YEAR) a.past = E.kpAnswer(S.chart.kp, q, S.dasha, adult, (now - adult) / YEAR).windows.find((w) => w.end <= now) || null;
      a.sys = "vedic"; a.soon = kpSoon(a); S.ask = a;
    }
    render(); $("#answer").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  const f = $("#horaryForm");
  if (f) f.onsubmit = (ev) => {
    ev.preventDefault();
    const n = parseInt($("#hn").value, 10);
    if (!(n >= 1 && n <= 249)) { $("#hn").setCustomValidity("Pick a whole number from 1 to 249."); $("#hn").reportValidity(); return; }
    const q = E.KP_QUESTIONS.find((x) => x.id === $("#hq").value);
    const ms = Date.now();
    const h = E.kpHorary(n, S.birth.lat, S.birth.lon, ms);
    S.ask = { ...E.kpAnswer(h, q, null, ms), horary: { number: n, ms }, sys: "vedic" };
    render();
  };
}

// ---------------------------------------------------------------- Timeline
const TRACK = {
  spirit: { name: "Career & purpose", sys: "Western", how: "Your working life and sense of direction, in long chapters with shorter sub-periods inside. Gold blocks are peak periods, when the tradition expects career events and visibility to stand out." },
  fortune: { name: "Life circumstances", sys: "Western", how: "Your body, money, home and day-to-day circumstances, divided the same way. Gold blocks are peaks for these areas." },
  prof: { name: "Yearly focus", sys: "Western", how: "Each birthday moves your focus to the next area of life, in a 12-year cycle." },
  dasha: { name: "Life periods", sys: "Vedic", how: "Vedic astrology divides life into long periods, each run by one planet. The period takes on that planet's themes and the area of life it sits in." },
  antar: { name: "Sub-periods", sys: "Vedic", how: "Shorter periods inside each long period, run by a second planet that adds its own themes." },
};
const peakPlain = (p) => p === "10th" ? "strongest peak period" : p === "4th" ? "quiet peak period" : "peak period";
function zrInfo(x, lot, level) {
  const t = zrTone(x.si), name = lot === "Spirit" ? "Career & purpose" : "Life circumstances";
  let s = `Western · ${name} ${level === 1 ? "chapter" : "sub-period"}: ${x.sign}, ${fmtD(x.start)} – ${fmtD(x.end)}. What it looks like: ${ZR_SIGN[lot][x.sign]}. `;
  s += x.peak ? `It's a ${peakPlain(x.peak)}, so expect more to happen and more visibility. ` : "Not a peak, so changes tend to build quietly. ";
  if (x.loosing) s += "It starts with a turning point: a change of direction, often previewing a later chapter. ";
  s += `Good news or bad news? Tradition rates it ${TONE_WORD[t.tone].toLowerCase()}: ${ZR_TONE_MEANS[t.tone][lot]}. Why: ${t.reasons.join("; ")}. Your choices still shape how it plays out.`;
  return s;
}
function dashaInfo(lord, sub, start, end) {
  const v = S.chart.vedic.planets, p = sub || lord, t = vedicPeriodTone(p);
  const head = sub ? `Vedic · ${lord}–${sub} sub-period, ${fmtD(start)} – ${fmtD(end)}.` : `Vedic · Long period of ${lord}, ${fmtMY(start)} – ${fmtMY(end)}.`;
  return `${head} What it looks like: a ${p} ${sub ? "sub-period" : "period"} ${PERIOD_PLANET[p]}. For you it shows up mainly through ${HOUSE_SHOWS[v[p].house]}${sub ? `, within the bigger ${lord} chapter` : ""}. Good news or bad news? Tradition rates it ${TONE_WORD[t.tone].toLowerCase()}: ${t.reasons.join("; ")}. Your choices still shape how it plays out.`;
}
function tracks(from, to, zoom) {
  const T = [], showW = S.tlBoth || !isV(), showV = S.tlBoth || isV();
  const seg = (arr, key, fn) => T.push({ key, label: `${TRACK[key].sys} · ${TRACK[key].name}`, sys: TRACK[key].sys, segs: arr.filter((x) => x.end > from && x.start < to).map(fn) });
  const l2 = (zr) => zr.level1.flatMap((a) => a.level2);
  if (showW) {
    seg(zoom === "life" ? S.zrS.level1 : l2(S.zrS), "spirit", (x) => ({ ...x, text: x.sign, kind: x.peak ? "peak" : "spirit", info: zrInfo(x, "Spirit", zoom === "life" ? 1 : 2) }));
    seg(zoom === "life" ? S.zrF.level1 : l2(S.zrF), "fortune", (x) => ({ ...x, text: x.sign, kind: x.peak ? "peak" : "fortune", info: zrInfo(x, "Fortune", zoom === "life" ? 1 : 2) }));
    if (zoom !== "life") seg(S.prof, "prof", (x) => ({ ...x, text: E.ordinal(x.house), kind: "prof",
      info: `Western · Yearly focus at age ${x.age}: ${HOUSE_W[x.house]} (${E.ordinal(x.house)} house). The year's planet is ${x.lord} (${PLANET[x.lord]}). Tradition rates the year ${TONE_WORD[westYearTone(x.sign, x.lord, x.house).tone].toLowerCase()}: ${westYearTone(x.sign, x.lord, x.house).reasons.join("; ")}. Your choices still shape how it plays out. (Technique: annual profections.)` }));
  }
  if (showV) {
    seg(S.dasha.mahadashas, "dasha", (x) => ({ ...x, text: x.lord, kind: "dasha", info: dashaInfo(x.lord, null, x.start, x.end) }));
    if (zoom !== "life" || !showW) seg(S.dasha.mahadashas.flatMap((m) => m.antardashas.map((a) => ({ ...a, md: m.lord }))), "antar",
      (x) => ({ ...x, text: zoom === "life" ? x.lord.slice(0, 2) : `${x.md}–${x.lord}`, kind: "antar", info: dashaInfo(x.md, x.lord, x.start, x.end) }));
  }
  return T;
}
const PEAK_DO = {
  Spirit: "promotions, new roles, recognition or a big push at work are most likely. A good time to go after opportunities",
  Fortune: "bigger changes in money, where you live or your daily routine tend to happen. A good time to make changes you've been planning",
};
const TURN_DO = {
  Spirit: "your work or direction may change course. A good time to reassess where you're headed",
  Fortune: "your circumstances may shift. A good time to take stock of money, home and health habits",
};
function highlights(now) {
  const H = [], until = now + 25 * YEAR, showW = S.tlBoth || !isV(), showV = S.tlBoth || isV();
  if (showW) for (const [zr, lot, area] of [[S.zrS, "Spirit", "Career"], [S.zrF, "Fortune", "Money, home & daily life"]]) {
    for (const a of zr.level1) {
      if (a.start > now && a.start < until) H.push({ ms: a.start, sys: "Western", title: `${area}: new ${a.years}-year chapter`,
        text: `What it looks like: ${ZR_SIGN[lot][a.sign]}.${a.peak ? " The whole chapter counts as a high point." : ""} Tradition rates it ${TONE_WORD[zrTone(a.si).tone].toLowerCase()} (${zrTone(a.si).reasons[0]}).` });
      for (const b of a.level2) {
        if (b.start <= now || b.start > until) continue;
        if (b.peak === "10th") H.push({ ms: b.start, end: b.end, sys: "Western", title: `${area}: high point until ${fmtMY(b.end)}`,
          text: `Practically, ${PEAK_DO[lot]}.${a.peak ? " It falls inside a high-point chapter, so it's one of the strongest stretches in your life." : ""}` });
        if (b.loosing) H.push({ ms: b.start, sys: "Western", title: `${area}: turning point`, text: `Practically, ${TURN_DO[lot]}.` });
      }
    }
  }
  if (showV) for (const md of S.dasha.mahadashas) if (md.start > now && md.start < until) {
    const hv = S.chart.vedic.planets[md.lord].house;
    H.push({ ms: md.start, sys: "Vedic", title: `New ${Math.round((md.end - md.start) / YEAR)}-year period: ${md.lord}`,
      text: `Life tends to center on ${F.PLANET_DO[md.lord]}, especially ${HOUSE_V[hv].split(",").slice(0, 2).join(" and ")}.` });
  }
  return H.sort((a, b) => a.ms - b.ms).slice(0, 10);
}
function nowSummary(now) {
  const zs = E.zrAt(S.zrS, now), zf = E.zrAt(S.zrF, now), d = E.dashaAt(S.dasha, now), p = S.prof.find((y) => y.start <= now && now < y.end);
  const showW = S.tlBoth || !isV(), showV = S.tlBoth || isV();
  const line = (z, area) => z ? `<li>${sysTag("Western")} <strong>${area}:</strong> ${z.l1.sign} chapter, ${z.l2.peak ? peakPlain(z.l2.peak) : "background stretch"} until ${fmtMY(z.l2.end)}.</li>` : "";
  return `<ul class="nowlist">
    ${showW ? line(zs, "Career & purpose") + line(zf, "Life circumstances") + (p ? `<li>${sysTag("Western")} <strong>Yearly focus:</strong> ${HOUSE_W[p.house]}.</li>` : "") : ""}
    ${showV && d ? `<li>${sysTag("Vedic")} <strong>Life period:</strong> ${d.md.lord} long period, ${d.ad.lord} sub-period until ${fmtMY(d.ad.end)}.</li>` : ""}
  </ul>`;
}
function viewTimeline() {
  const now = Date.now(), born = S.chart.utc;
  const life = S.tlZoom === "life";
  const from = life ? born : Date.UTC(new Date(now).getUTCFullYear() - 2, 0, 1);
  const to = life ? born + 90 * YEAR : Date.UTC(new Date(now).getUTCFullYear() + 9, 0, 1);
  const pxPerYear = life ? 12 : 130;
  const W = Math.round(((to - from) / YEAR) * pxPerYear);
  const x = (ms) => ((ms - from) / (to - from)) * W;
  const T = tracks(from, to, S.tlZoom);
  const rowH = 46, top = 28, H = top + T.length * rowH + 10;
  const ticks = [];
  if (life) for (let a = 0; a <= 90; a += 10) ticks.push({ ms: born + a * YEAR, t: `age ${a}` });
  else for (let y = new Date(from).getUTCFullYear(); y <= new Date(to).getUTCFullYear(); y++) ticks.push({ ms: Date.UTC(y, 0, 1), t: String(y) });
  let id = 0; S.tlIndex = [];
  const svg = `<svg class="tl" width="${W + 2}" height="${H}" viewBox="0 0 ${W + 2} ${H}" role="img" aria-label="Life timeline">
    ${ticks.map((t) => `<g><line class="tick" x1="${x(t.ms)}" x2="${x(t.ms)}" y1="${top - 6}" y2="${H - 6}"/><text class="tick-t" x="${x(t.ms) + 3}" y="14">${t.t}</text></g>`).join("")}
    ${T.map((tr, i) => {
      const y = top + i * rowH;
      // repeat the track label every ~600px so the system stays visible while scrolling
      const labels = []; for (let lx = 4; lx < W - 80; lx += 600) labels.push(`<text class="track-t track-${tr.sys.toLowerCase()}" x="${lx}" y="${y + 11}">${tr.label}</text>`);
      return labels.join("") + tr.segs.map((s) => {
        const x0 = Math.max(x(s.start), 0), x1 = Math.min(x(s.end), W), w = Math.max(x1 - x0 - 1.5, 1);
        S.tlIndex.push(s.info);
        const txt = w > s.text.length * 6.6 + 6 ? `<text class="seg-t" x="${x0 + 4}" y="${y + 33}">${s.text}</text>` : "";
        return `<g class="segg" data-i="${id++}" tabindex="0"><rect class="seg seg-${s.kind}${S.tlSel === id - 1 ? " sel" : ""}${s.loosing ? " loose" : ""}" x="${x0}" y="${y + 17}" width="${w}" height="24" rx="3"/>${txt}</g>`;
      }).join("");
    }).join("")}
    ${now > from && now < to ? `<line class="now" x1="${x(now)}" x2="${x(now)}" y1="${top - 8}" y2="${H - 4}"/><text class="now-t" x="${x(now) + 4}" y="${top - 2}">now</text>` : ""}
  </svg>`;
  const hl = highlights(now);
  const keys = [...new Set(T.map((t) => t.key))];
  return `
  ${tabHead("Life timeline", S.tlBoth ? "Both systems at once, each labeled. Each one divides your life into periods with their own themes. Tap any block to read what it means."
    : isV() ? "Vedic astrology divides your life into long periods run by one planet each, with shorter sub-periods inside. Tap any block to read what it means."
      : "Western astrology's timing methods divide your life into chapters and yearly themes. Gold blocks are peak periods. Tap any block to read what it means.")}
  ${timeWarning("houses")}
  <article class="card"><header class="card-h"><h3>Right now</h3></header>${nowSummary(now)}</article>
  <div class="tl-controls">
    <div class="ask-modes">
      <button class="seg ${life ? "on" : ""}" id="zLife" type="button">Whole life</button>
      <button class="seg ${!life ? "on" : ""}" id="zNear" type="button">Next 10 years, in detail</button>
    </div>
    <label class="chk"><input type="checkbox" id="tlBoth"${S.tlBoth ? " checked" : ""}> Show both systems</label>
  </div>
  <div class="tl-wrap" id="tlWrap">${svg}</div>
  <div class="card tl-detail" id="tlDetail" aria-live="polite">${S.tlSel !== null && S.tlIndex[S.tlSel] ? esc(S.tlIndex[S.tlSel]) : "Tap a block to see what that period means."}</div>
  <div class="grid2">
    <article class="card">
      <header class="card-h"><h3>Coming highlights</h3></header>
      ${hl.length ? `<ol class="changes">${hl.map((h) => `<li><span class="mono">${fmtMY(h.ms)}</span><span>${sysTag(h.sys)} <strong>${esc(h.title)}</strong><br>${esc(h.text)}</span></li>`).join("")}</ol>` : "<p>No major changes in the next 25 years.</p>"}
    </article>
    <article class="card">
      <header class="card-h"><h3>How to read this</h3></header>
      <dl class="howto">
        ${keys.map((k) => `<div><dt><i class="sw sw-${k}"></i>${TRACK[k].name} ${sysTag(TRACK[k].sys)}</dt><dd>${TRACK[k].how}</dd></div>`).join("")}
        ${keys.includes("spirit") ? `<div><dt><i class="sw sw-peak"></i>${g("peak", "Peak period")} ${sysTag("Western")}</dt><dd>Gold blocks. These are expected to be eventful, visible times for that area of life.</dd></div>` : ""}
      </dl>
    </article>
  </div>`;
}
function bindTimeline() {
  $("#zLife").onclick = () => { S.tlZoom = "life"; S.tlSel = null; render(); };
  $("#zNear").onclick = () => { S.tlZoom = "near"; S.tlSel = null; render(); };
  $("#tlBoth").onchange = (e) => { S.tlBoth = e.target.checked; S.tlSel = null; render(); };
  const pick = (gEl) => {
    S.tlSel = +gEl.dataset.i;
    document.querySelectorAll(".seg.sel").forEach((r) => r.classList.remove("sel"));
    gEl.querySelector("rect").classList.add("sel");
    $("#tlDetail").textContent = S.tlIndex[S.tlSel];
  };
  document.querySelectorAll(".segg").forEach((gEl) => {
    gEl.addEventListener("click", () => pick(gEl));
    gEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(gEl); } });
  });
  const wrap = $("#tlWrap"), nowL = document.querySelector(".now");
  if (wrap && nowL) wrap.scrollLeft = Math.max(0, +nowL.getAttribute("x1") - wrap.clientWidth / 3);
}

// ---------------------------------------------------------------- Past events
const AREAS = {
  career: { label: "Career or work", houses: [10, 6, 2], lot: "Spirit", kp: [2, 6, 10, 11] },
  relationship: { label: "Relationship or marriage", houses: [7, 5], lot: "Fortune", kp: [2, 7, 11] },
  home: { label: "Home or a move", houses: [4], lot: "Fortune", kp: [3, 4, 12] },
  money: { label: "Money gained", houses: [2, 11], lot: "Fortune", kp: [2, 11] },
  education: { label: "Education", houses: [9], lot: "Spirit", kp: [4, 9, 11] },
  travel: { label: "Long-distance travel", houses: [9, 12], lot: "Spirit", kp: [3, 9, 12] },
  health: { label: "Health event (illness, injury, surgery)", houses: [6, 1, 12], lot: "Fortune", kp: [6, 8, 12] },
};
function kpSigs(houses) {
  const set = new Set();
  for (const h of houses) { const s = S.chart.kp.significators[h]; [...s.A, ...s.B, ...s.C, s.D].forEach((p) => set.add(p)); }
  return set;
}
const THEME = { career: "work", relationship: "relationships", home: "home", money: "money", education: "learning",
  travel: "travel", health: "health" };
function checksAt(ms, areaKey) {
  const a = AREAS[areaKey], th = THEME[areaKey];
  if (isV()) {
    const d = E.dashaAt(S.dasha, ms), sigs = kpSigs(a.kp), v = S.chart.vedic.planets;
    return [
      { name: `The long period's planet is linked to ${th} in your chart`, ok: !!d && sigs.has(d.md.lord), got: d ? `${d.md.lord} ${sigs.has(d.md.lord) ? "is" : "isn't"} linked to ${th}` : "—" },
      { name: `The sub-period's planet is linked to ${th} in your chart`, ok: !!d && sigs.has(d.ad.lord), got: d ? `${d.ad.lord} ${sigs.has(d.ad.lord) ? "is" : "isn't"} linked to ${th}` : "—" },
      { name: `The sub-period's planet sits in a ${th} area of your chart`, ok: !!d && a.kp.includes(v[d.ad.lord].house), got: d ? `${d.ad.lord} is in your ${E.ordinal(v[d.ad.lord].house)} house (${HOUSE_V[v[d.ad.lord].house].split(",").slice(0, 2).join(",")})` : "—" },
    ];
  }
  const prof = S.prof.find((y) => y.start <= ms && ms < y.end);
  const zr = E.zrAt(a.lot === "Spirit" ? S.zrS : S.zrF, ms);
  const rules = prof ? a.houses.filter((h) => houseRuler(h) === prof.lord) : [];
  const lotArea = a.lot === "Spirit" ? "work and direction" : "money, home, health and daily life";
  return [
    { name: `That year's theme was ${th}`, ok: !!prof && a.houses.includes(prof.house), got: prof ? `The theme was ${F.HOUSE_DO[prof.house]}` : "—" },
    { name: `The planet running that year is linked to ${th} in your chart`, ok: rules.length > 0, got: prof ? `${prof.lord}${rules.length ? `, which rules your ${th} area` : `, not linked to ${th}`}` : "—" },
    { name: `It fell in a high point for ${lotArea}`, ok: !!zr && !!zr.l2.peak, got: zr ? (zr.l2.peak ? `It was a ${peakPlain(zr.l2.peak)}` : "It was a quieter stretch") : "—" },
  ];
}
function baseline(areaKey, n = 400) {
  const lo = S.chart.utc + 15 * YEAR, hi = Math.max(lo + 365 * DAY, Date.now());
  let hits = 0, total = 0, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) checksAt(lo + rnd() * (hi - lo), areaKey).forEach((c) => { total++; if (c.ok) hits++; });
  return hits / total;
}
function viewEvents() {
  const ev = S.events.slice().sort((a, b) => a.date.localeCompare(b.date));
  let hits = 0, total = 0, base = 0;
  const cards = ev.map((e) => {
    const ms = Date.parse(e.date + "T12:00:00Z");
    if (!(ms > S.chart.utc) || !AREAS[e.area]) return "";
    const checks = checksAt(ms, e.area), b = baseline(e.area);
    checks.forEach((c) => { total++; if (c.ok) hits++; }); base += b * checks.length;
    const n = checks.filter((c) => c.ok).length, exp = b * 3, th = THEME[e.area];
    const head = n >= exp + 0.8 ? ["Yes, astrology's timing pointed to this", "v-good"]
      : n <= exp - 0.8 ? ["No, astrology's timing missed this", "v-low"] : ["Unclear: no better than chance", "v-mixed"];
    const verdict = n >= exp + 0.8 ? "That's better than chance, a point in favor of the method for you."
      : n <= exp - 0.8 ? "That's worse than chance, a point against the method for you."
        : "That's about what chance alone would give, so this event doesn't tell us much either way.";
    return `<article class="card ev">
      <header class="card-h"><h3>${esc(e.label)}</h3><button class="link" data-del="${esc(e.id)}" type="button">Remove</button></header>
      <p class="mono ev-meta">${fmtD(ms)} · ${esc(AREAS[e.area].label)}</p>
      <p class="eyebrow">${sysTag(SYS())} Did astrology see this coming?</p>
      <p class="verdict ${head[1]}">${head[0]}</p>
      <p>${SYS()} astrology says ${th} events should happen at times your chart links to ${th}. The app checked three signs of that. When this happened, <strong>${n} of 3</strong> were present. On a random day in your life, about ${exp.toFixed(1)} of 3 would be. ${verdict}</p>
      <p class="fine">This isn't saying the event was good or bad${e.area === "health" ? ", and it says nothing about your health now" : ""}. It only tests whether the timing method would have pointed to this date.</p>
      <details class="basis-d"><summary>What the app checked</summary>
        <ul class="checks2">${checks.map((c) => `<li><span class="yn ${c.ok ? "yn-y" : "yn-n"}">${c.ok ? "Yes" : "No"}</span><span><strong>${esc(c.name)}</strong><br><span class="fine">${esc(c.got)}</span></span></li>`).join("")}</ul>
      </details>
    </article>`;
  }).join("");
  const rate = total ? hits / total : 0, baseRate = total ? base / total : 0;
  return `
  ${tabHead("Check past events", "Add things that actually happened in your life. For each one, the app checks whether this system's timing pointed to that area of life at the time, then compares your hit rate with what random dates would score. Switch systems to compare Western and Vedic.")}
  ${timeWarning("houses")}
  ${total ? `<section class="score card">
    <h3 class="score-h">Does ${SYS()} timing work for you?</h3>
    <div><p class="big mono">${Math.round(rate * 100)}%</p><p>of signs were present at your real events</p></div>
    <div><p class="big mono">${Math.round(baseRate * 100)}%</p><p>would be present on random days</p></div>
    <p class="score-note"><strong>In short:</strong> ${rate > baseRate + 0.15 ? `your real events line up with ${SYS()} timing more often than random dates would. That's a point in its favor for you.` : rate < baseRate - 0.15 ? `your real events line up with ${SYS()} timing less often than random dates would. For you, it doesn't seem to be picking up the right times.` : `your real events line up with ${SYS()} timing about as often as random dates would. So far it isn't doing better than chance.`}</p>
    <p class="score-how">How to read this: for each event, the app checks three signals that ${SYS()} astrology says should be "on" when that kind of thing happens. Some signals are on fairly often by coincidence, so the right comparison is random dates. If the timing really works for you, your events should clearly beat the random number. A handful of events isn't enough to tell; aim for 10 or more.</p>
  </section>` : ""}
  ${S.isExample ? '<p class="warn">These are example events for the example chart. Enter your own birth details to add your own.</p>' : ""}
  <form class="card evform" id="evForm">
    <h3>Add an event</h3>
    <div class="row3">
      <div class="row"><label for="evDate">Date</label><input id="evDate" type="date" required></div>
      <div class="row"><label for="evArea">Area of life</label><select id="evArea">${Object.entries(AREAS).map(([k, a]) => `<option value="${k}">${a.label}</option>`).join("")}</select></div>
      <div class="row"><label for="evLabel">What happened</label><input id="evLabel" type="text" maxlength="80" required placeholder="Started at a new company"></div>
    </div>
    <p class="fine" id="healthNote" hidden>Health events are for looking back only. The app checks past dates against the chart; it can't predict, diagnose or explain health problems. For anything current, talk to a doctor.</p>
    <button class="btn btn-primary" type="submit">Add event</button>
  </form>
  ${cards || `<div class="empty card"><p><strong>No events yet.</strong> Add a job change, a move, a relationship, an illness or another real milestone with its date.</p></div>`}`;
}
function bindEvents() {
  const area = $("#evArea"), note = $("#healthNote");
  area.onchange = () => { note.hidden = area.value !== "health"; };
  $("#evForm").onsubmit = (e) => {
    e.preventDefault();
    const date = $("#evDate").value;
    if (Date.parse(date) < Date.UTC(S.birth.y, S.birth.m - 1, S.birth.d)) { $("#evDate").setCustomValidity("The event date must be after the birth date."); $("#evDate").reportValidity(); return; }
    if (Date.parse(date) > Date.now()) { $("#evDate").setCustomValidity("Past events only. Pick a date that has already happened."); $("#evDate").reportValidity(); return; }
    S.events.push({ id: String(Date.now()), date, area: area.value, label: $("#evLabel").value.trim() });
    if (!S.isExample) store.set("nightalmanac.events", S.events);
    render();
  };
  $("#evDate").oninput = () => $("#evDate").setCustomValidity("");
  document.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
    S.events = S.events.filter((x) => x.id !== b.dataset.del);
    if (!S.isExample) store.set("nightalmanac.events", S.events);
    render();
  }));
}

// ---------------------------------------------------------------- Chart wheel
const ABBR = { Sun: "Su", Moon: "Mo", Mercury: "Me", Venus: "Ve", Mars: "Ma", Jupiter: "Ju", Saturn: "Sa",
  Uranus: "Ur", Neptune: "Ne", Pluto: "Pl", Rahu: "Ra", Ketu: "Ke" };
const SIGN_ABBR = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];
const ASPECTS = [["conjunction", 0, 8], ["sextile", 60, 4], ["square", 90, 7], ["trine", 120, 7], ["opposition", 180, 8]];
function aspectsOf(planets) {
  const names = Object.keys(planets).filter((n) => n !== "Rahu" && n !== "Ketu");
  const out = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const sep = Math.abs(E.angdiff(planets[names[i]].lon, planets[names[j]].lon));
    for (const [nm, ang, orb] of ASPECTS) if (Math.abs(sep - ang) <= orb) out.push({ a: names[i], b: names[j], type: nm, orb: Math.abs(sep - ang) });
  }
  return out.sort((x, y) => x.orb - y.orb);
}
function chartModel() {
  const c = S.chart;
  if (isV()) {
    const pl = {};
    for (const [n, p] of Object.entries(c.vedic.planets)) pl[n] = { lon: p.lon, sign: p.sign, house: p.house, retro: p.retro, nak: p.nakshatra };
    return { vedic: true, asc: c.vedic.lagna, planets: pl, houseMeaning: HOUSE_V, aspects: [] };
  }
  const pl = {};
  for (const [n, p] of Object.entries(c.western.planets)) if (n !== "Ketu") pl[n] = { lon: p.lon, sign: p.sign, house: p.house, retro: p.retro };
  return { vedic: false, asc: c.western.asc, mc: c.western.mc, planets: pl, houseMeaning: HOUSE_W, aspects: aspectsOf(pl) };
}
function wheelSVG(m) {
  const cx = 200, cy = 200, R0 = 192, R1 = 162, RH = 150, RP = 128, RA = 92;
  const ang = (lon) => ((180 + (lon - m.asc)) * Math.PI) / 180;
  const pt = (lon, r) => [cx + r * Math.cos(ang(lon)), cy - r * Math.sin(ang(lon))];
  let s = `<svg class="wheel" viewBox="0 0 400 400" role="img" aria-label="${m.vedic ? "Vedic" : "Western"} birth chart wheel">`;
  s += `<circle class="w-ring" cx="${cx}" cy="${cy}" r="${R0}"/><circle class="w-ring" cx="${cx}" cy="${cy}" r="${R1}"/><circle class="w-inner" cx="${cx}" cy="${cy}" r="${RA + 4}"/>`;
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = pt(i * 30, R0), [x1, y1] = pt(i * 30, RA + 4);
    s += `<line class="w-div" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
    const [tx, ty] = pt(i * 30 + 15, (R0 + R1) / 2);
    s += `<text class="w-sign" x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central">${SIGN_ABBR[i]}</text>`;
    const house = ((i - E.signIdx(m.asc)) % 12 + 12) % 12 + 1;
    const [hx, hy] = pt(i * 30 + 15, RH - 4);
    s += `<text class="w-house" x="${hx}" y="${hy}" text-anchor="middle" dominant-baseline="central">${house}</text>`;
  }
  const [ax0, ay0] = pt(m.asc, R0 + 2), [ax1, ay1] = pt(m.asc, RA + 4);
  s += `<line class="w-asc" x1="${ax0}" y1="${ay0}" x2="${ax1}" y2="${ay1}"/>`;
  const [alx, aly] = pt(m.asc, R0 - 46);
  s += `<text class="w-angle" x="${alx - 2}" y="${aly - 8}" text-anchor="middle">RISING</text>`;
  if (m.mc != null) {
    const [mx0, my0] = pt(m.mc, R0 + 2), [mx1, my1] = pt(m.mc, RA + 4);
    s += `<line class="w-mc" x1="${mx0}" y1="${my0}" x2="${mx1}" y2="${my1}"/>`;
  }
  for (const a of m.aspects) {
    if (a.type === "conjunction") continue;
    const [x0, y0] = pt(m.planets[a.a].lon, RA), [x1, y1] = pt(m.planets[a.b].lon, RA);
    s += `<line class="w-asp asp-${a.type}${S.chartSel && (a.a === S.chartSel || a.b === S.chartSel) ? " hl" : ""}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
  }
  const order = Object.entries(m.planets).sort((a, b) => a[1].lon - b[1].lon);
  let prevLon = -999, prevR = RP;
  for (const [n, p] of order) {
    const r = Math.abs(E.angdiff(p.lon, prevLon)) < 9 ? (prevR === RP ? RP - 20 : RP) : RP;
    prevLon = p.lon; prevR = r;
    const [x, y] = pt(p.lon, r), [tx, ty] = pt(p.lon, RA + 4);
    s += `<g class="w-pl${S.chartSel === n ? " on" : ""}" data-p="${n}" tabindex="0" role="button" aria-label="${n} in ${p.sign}">
      <line class="w-tick" x1="${tx}" y1="${ty}" x2="${pt(p.lon, r - 11)[0]}" y2="${pt(p.lon, r - 11)[1]}"/>
      <circle cx="${x}" cy="${y}" r="12.5"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${ABBR[n]}</text></g>`;
  }
  return s + "</svg>";
}
// How well a planet works in the chart: helpful or challenging nature, its house, its sign
function planetTone(m, n) {
  const p = m.planets[n], R = [];
  let sc = 0;
  const day = S.chart.western.sect === "day";
  if (m.vedic && !["Uranus", "Neptune", "Pluto"].includes(n)) {
    const fn = functionalNature(n); sc += fn.sc * 0.75; R.push(fn.text);
    if (["Jupiter", "Venus"].includes(n)) sc += 0.5; else if (["Saturn", "Mars", "Rahu", "Ketu"].includes(n)) sc -= 0.5;
  } else if (n === "Jupiter" || n === "Venus") { sc += 1.5; R.push(`${n} is a traditionally helpful planet`); }
  else if (n === "Mars" || n === "Saturn") {
    const ok = m.vedic ? false : (day && n === "Saturn") || (!day && n === "Mars");
    sc -= ok ? 0.5 : 1.5; R.push(`${n} is a traditionally challenging planet${ok ? ", though the more manageable one for your chart" : ""}`);
  } else if (n === "Rahu" || n === "Ketu") { sc -= 0.5; R.push(`${n} is read as unsettling`); }
  const table = m.vedic ? { 1: 2, 4: 2, 5: 2, 7: 2, 9: 2, 10: 2, 11: 1, 2: 0, 3: 0, 6: -2, 8: -2, 12: -2 } : GOOD_HOUSE;
  const hp = table[p.house]; sc += hp;
  R.push(`it sits in your ${E.ordinal(p.house)} house, ${hp >= 2 ? "one of the strongest places" : hp === 1 ? "a helpful place" : hp === 0 ? "a neutral place" : "one of the harder places"}`);
  const [dp, dt] = dignity(n, p.sign); if (dt) { sc += dp; R.push(`it's ${dt}`); }
  if (p.retro && !["Rahu", "Ketu"].includes(n)) { sc -= 0.5; R.push("it was retrograde"); }
  const tone = sc >= 2 ? "good" : sc <= -1.5 ? "low" : "mixed";
  return { tone, reasons: R };
}
const STRENGTH = {
  good: ["A strength", "This part of your life tends to come more easily, and it's something you can lean on."],
  mixed: ["Mixed", "This part of your life has real strengths and some friction. It works best when you're aware of both."],
  low: ["Takes work", "This part of your life tends to take more effort or come with tests. It isn't fixed: it's often where people grow the most."],
};
const STR_WORD = { good: "a strength", mixed: "mixed", low: "challenged" };
function strengthPill(t) { return `<span class="tone tone-${t.tone}">${STRENGTH[t.tone][0]}</span>`; }
function planetReading(m, n) {
  const p = m.planets[n], el = ELEMENT_OF[p.sign], t = planetTone(m, n);
  const how = PLANET_ELEMENT[n] ? PLANET_ELEMENT[n][el] : `It works ${SIGN_STYLE[p.sign]}.`;
  let h = `<p class="eyebrow">${sysTag(m.vedic ? "Vedic" : "Western")} ${n}</p><h3>${n} in ${p.sign}, ${E.ordinal(p.house)} house</h3>`;
  h += `<p class="inshort"><strong>In short:</strong> ${how.split(". ")[0].replace(/\.$/, "")}. For you this plays out mainly through ${HOUSE_SHOWS[p.house]}.</p>`;
  h += `<p><strong>What it runs.</strong> ${n} describes ${PLANET_RUNS[n]}.</p>`;
  h += `<p><strong>How it shows up.</strong> ${how} In ${p.sign} specifically, it works ${SIGN_STYLE[p.sign]}.</p>`;
  h += `<p><strong>Where.</strong> It sits in your ${E.ordinal(p.house)} ${g("house", "house")}, so it shows up most through ${HOUSE_SHOWS[p.house]}.</p>`;
  if (p.retro && !["Rahu", "Ketu"].includes(n)) h += `<p>It was ${g("retro", "retrograde")} at birth, which tradition reads as this energy turning inward: you may develop it later in life or express it in a less obvious way.</p>`;
  if (p.nak) h += `<p>Its ${g("nakshatra", "nakshatra")} is ${p.nak}.</p>`;
  h += `<div class="toneblock"><p><strong>Strength or challenge?</strong> ${strengthPill(t)} ${STRENGTH[t.tone][1]} Why: ${t.reasons.join("; ")}.</p></div>`;
  const asp = m.aspects.filter((a) => a.a === n || a.b === n).slice(0, 4);
  if (asp.length) h += `<p class="sub">How it connects to the rest of your chart</p><ul class="plain">${asp.map((a) => { const o = a.a === n ? a.b : a.a;
    return `<li><strong>${n} ${a.type} ${o}:</strong> ${PLANET_ROLE[n] || n} and ${PLANET_ROLE[o] || o} ${ASP_PRACT[a.type]}.</li>`; }).join("")}</ul>`;
  h += `<p class="mono fine">${E.fmtDeg(p.lon)}</p>`;
  return h;
}
// Tone of a house in the chart, from the planet that rules its sign and planets inside it
function houseTone(m, h) {
  const si = (E.signIdx(m.asc) + h - 1) % 12, sign = E.SIGNS[si], ruler = E.RULERS[si], R = [];
  const rt = planetTone(m, ruler);
  let sc = { good: 2, mixed: 0, low: -2 }[rt.tone];
  R.push(`${sign} is ruled by ${ruler}, which is ${STR_WORD[rt.tone]} in your chart (${rt.reasons.slice(0, 2).join("; ")})`);
  for (const [n, p] of Object.entries(m.planets)) {
    if (p.house !== h || !E.CLASSICAL.includes(n)) continue;
    if (n === "Jupiter" || n === "Venus") { sc += 1.5; R.push(`${n} (helpful) sits in this house`); }
    else if (n === "Mars" || n === "Saturn") { sc -= 1.5; R.push(`${n} (challenging) sits in this house`); }
    else R.push(`${n} sits in this house, putting extra focus here`);
  }
  return { tone: sc >= 1.5 ? "good" : sc <= -1.5 ? "low" : "mixed", reasons: R, sign, ruler };
}
function lifeAreaCards(m) {
  const pl = m.planets;
  const card = (title, h, text, extra) => {
    const t = houseTone(m, h);
    return `<article class="card story">
      <header class="card-h"><h3>${title}</h3>${strengthPill(t)}</header>
      <p>${text(t.sign)}</p>${extra ? `<p>${extra}</p>` : ""}
      <p class="fine"><strong>Why ${STR_WORD[t.tone]}:</strong> your ${E.ordinal(h)} house is in ${t.sign}. ${t.reasons.join("; ")}. ${STRENGTH[t.tone][1]}</p>
    </article>`;
  };
  return `<section class="intro fc-intro"><h2>What your chart says about…</h2><p>Each area is read from the house that rules it and the planet in charge of that house.</p></section>
  <div class="grid2">
    ${card("Love & relationships", 7, (sg) => SIGN_PARTNER[sg], PLANET_ELEMENT.Venus[ELEMENT_OF[pl.Venus.sign]])}
    ${card("Career & work", 10, (sg) => SIGN_CAREER[sg], `Your Sun's drive points the same way: ${PLANET_ELEMENT.Sun[ELEMENT_OF[pl.Sun.sign]].split(". ")[0].toLowerCase()}.`)}
    ${card("Money", 2, (sg) => SIGN_MONEY[sg], `Your best luck with money: ${PLANET_ELEMENT.Jupiter[ELEMENT_OF[pl.Jupiter.sign]].replace("Luck tends to come", "it tends to come")}`)}
    ${card("Home & family", 4, (sg) => SIGN_HOME[sg], PLANET_ELEMENT.Moon[ELEMENT_OF[pl.Moon.sign]])}
  </div>`;
}
function chartStory(m) {
  const pl = m.planets, ascSign = E.SIGNS[E.signIdx(m.asc)], ruler = E.RULERS[E.signIdx(m.asc)], rp = pl[ruler];
  const cls = E.CLASSICAL;
  const el = { fire: 0, earth: 0, air: 0, water: 0 }, md = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const n of cls) { el[ELEMENT_OF[pl[n].sign]]++; md[MODE_OF[pl[n].sign]]++; }
  el[ELEMENT_OF[ascSign]]++; md[MODE_OF[ascSign]]++;
  const topEl = Object.entries(el).sort((a, b) => b[1] - a[1]), topMd = Object.entries(md).sort((a, b) => b[1] - a[1]);
  const lowEl = topEl.filter(([, v]) => v === 0).map(([k]) => k);
  const busy = {};
  for (const [n, p] of Object.entries(pl)) if (cls.includes(n)) (busy[p.house] = busy[p.house] || []).push(n);
  const busyH = Object.entries(busy).filter(([, v]) => v.length >= 2).sort((a, b) => b[1].length - a[1].length);
  const bar = (obj, total) => Object.entries(obj).map(([k, v]) => `<div class="bal"><span>${cap(k)}</span><span class="bal-bar"><i style="width:${(v / total) * 100}%"></i></span><span class="mono">${v}</span></div>`).join("");
  const tag = sysTag(m.vedic ? "Vedic" : "Western");
  const rt = planetTone(m, ruler);
  return `
  <article class="card story">
    <header class="card-h"><h3>Your big three</h3>${tag}</header>
    <p class="inshort"><strong>In short:</strong> ${pl.Sun.sign} Sun, ${pl.Moon.sign} Moon, ${ascSign} rising.</p>
    <p><strong>Sun in ${pl.Sun.sign}: who you are at your core.</strong> ${PLANET_ELEMENT.Sun[ELEMENT_OF[pl.Sun.sign]]} It shows up most through ${HOUSE_SHOWS[pl.Sun.house]}.</p>
    <p><strong>Moon in ${pl.Moon.sign}: what you need to feel okay.</strong> ${PLANET_ELEMENT.Moon[ELEMENT_OF[pl.Moon.sign]]}${m.vedic ? ` Vedic astrology gives the Moon special weight; its ${g("nakshatra", "nakshatra")} is <strong>${pl.Moon.nak}</strong>.` : ""}</p>
    <p><strong>${ascSign} rising: how others see you.</strong> ${RISING_ELEMENT[ELEMENT_OF[ascSign]]} You approach new situations ${SIGN_STYLE[ascSign]}.</p>
  </article>
  ${lifeAreaCards(m)}
  <article class="card story">
    <header class="card-h"><h3>Your chart ruler: ${ruler}</h3>${strengthPill(rt)}</header>
    <p>The planet that rules your rising sign acts as the "captain" of your chart. For ${ascSign} rising that's <strong>${ruler}</strong>, which runs ${PLANET_RUNS[ruler]}. It sits in your ${E.ordinal(rp.house)} house, so ${HOUSE_SHOWS[rp.house]} is a theme you'll keep coming back to throughout life.</p>
    <p class="fine">${STRENGTH[rt.tone][1]} Why: ${rt.reasons.join("; ")}.</p>
  </article>
  <div class="grid2">
    <article class="card story">
      <header class="card-h"><h3>Your temperament</h3>${tag}</header>
      <div class="bals">${bar(el, 8)}</div>
      <p>Most of your planets are in <strong>${topEl[0][0]}</strong> signs, which means ${ELEMENT_LIFE[topEl[0][0]]}.</p>
      ${lowEl.map((e) => `<p><strong>No ${e}:</strong> ${MISSING_EL[e]}</p>`).join("")}
      <div class="bals">${bar(md, 8)}</div>
      <p>Mostly <strong>${topMd[0][0]}</strong>: ${MODE_LIFE[topMd[0][0]]}.</p>
    </article>
    <article class="card story">
      <header class="card-h"><h3>Where your energy goes</h3>${tag}</header>
      ${busyH.length ? busyH.map(([h, ns]) => `<p><strong>${E.ordinal(+h)} house (${ns.join(", ")}):</strong> with several planets here, ${HOUSE_SHOWS[h]} take up a big share of your life and attention.</p>`).join("")
        : "<p>Your planets are spread out, with no house holding more than one. That usually means wide-ranging interests rather than one area dominating your life.</p>"}
    </article>
  </div>
  ${m.aspects.length ? `<article class="card story">
    <header class="card-h"><h3>Your built-in strengths and tensions</h3>${tag}</header>
    <ul class="plain">${m.aspects.slice(0, 6).map((a) => `<li><strong>${a.a} ${a.type} ${a.b}:</strong> ${PLANET_ROLE[a.a] || a.a} and ${PLANET_ROLE[a.b] || a.b} ${ASP_PRACT[a.type]}.</li>`).join("")}</ul>
  </article>` : `<article class="card story"><p class="fine">Vedic astrology uses a different system for connections between planets (each planet "looks at" certain houses), so lines aren't drawn in Vedic mode.</p></article>`}`;
}
function viewChart() {
  const m = chartModel();
  if (!S.chartSel || !m.planets[S.chartSel]) S.chartSel = "Sun";
  const c = S.chart, w = c.western;
  const row = (cells) => `<tr>${cells.map((x) => `<td>${x}</td>`).join("")}</tr>`;
  const table = (head, rows) => `<div class="tbl"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  return `
  ${tabHead("Your chart", `A map of the sky at the moment you were born. The outer ring is the zodiac, the numbers are your ${g("house", "houses")} (areas of life), and each circle is a planet. Tap a planet to read what it means for you.`)}
  ${timeWarning("houses")}
  <div class="wheel-grid">
    <div class="wheel-box">${wheelSVG(m)}
      ${m.vedic ? '<p class="fine">Vedic charts are traditionally drawn as squares. The circle is used here so the two systems are easy to compare.</p>' : '<p class="fine legend-asp"><i class="la la-tri"></i>easy connection <i class="la la-sq"></i>tense connection</p>'}</div>
    <article class="card reading" id="plReading" aria-live="polite">${planetReading(m, S.chartSel)}</article>
  </div>
  ${chartStory(m)}
  <details class="card"><summary><strong>All the numbers</strong> <span class="fine">for checking against Astro.com or Astro-Seek</span></summary>
    <p class="mono">Western Ascendant ${E.fmtDeg(w.asc)} · Midheaven ${E.fmtDeg(w.mc)} · ${w.sect} chart</p>
    ${table(["Planet", "Western", "House", "Vedic", "House", "Nakshatra"], E.VEDIC_GRAHAS.concat(["Uranus", "Neptune", "Pluto"]).map((n) => {
      const wp = w.planets[n], vp = c.vedic.planets[n];
      return row([n, `<span class="mono">${E.fmtDeg(wp.lon)}${wp.retro && n !== "Rahu" && n !== "Ketu" ? " Rx" : ""}</span>`, wp.house,
        vp ? `<span class="mono">${E.fmtDeg(vp.lon)}</span>` : "—", vp ? vp.house : "—", vp ? `${vp.nakshatra} ${vp.pada}` : "—"]);
    }))}
    ${table(["Lot", "Position", "House", "Meaning"], Object.entries(c.lots).map(([n, l]) => row([n, `<span class="mono">${E.fmtDeg(l.lon)}</span>`, l.house, LOT[n]])))}
    ${table(["KP cusp", "Position", "Sign lord", "Star lord", "Sub lord"], c.kp.cusps.map((x) => row([x.house, `<span class="mono">${E.fmtDeg(x.lon)}</span>`, x.signLord, x.starLord, x.subLord])))}
    <p class="fine">Vedic: Lahiri ayanamsa ${c.vedic.ayanamsa.toFixed(2)}°, whole-sign houses. KP: KP ayanamsa ${c.kp.ayanamsa.toFixed(2)}°, Placidus.</p>
  </details>`;
}
function bindChart() {
  const pick = (n) => {
    S.chartSel = n;
    const m = chartModel();
    $("#plReading").innerHTML = planetReading(m, n);
    document.querySelector(".wheel-box svg").outerHTML = wheelSVG(m);
    bindWheel();
  };
  const bindWheel = () => document.querySelectorAll(".w-pl").forEach((gEl) => {
    gEl.onclick = () => pick(gEl.dataset.p);
    gEl.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(gEl.dataset.p); } };
  });
  bindWheel();
}

// ---------------------------------------------------------------- Birthplace search (offline)
const US_STATES = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico" };
const fold = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
let CITYDB = null, regionNames = null;
try { regionNames = new Intl.DisplayNames(["en"], { type: "region" }); } catch { regionNames = null; }
const countryName = (cc) => { try { return (regionNames && regionNames.of(cc)) || cc; } catch { return cc; } };
const placeLabel = (c) => c.cc === "US" ? `${c.n}, ${c.adm}` : `${c.n}, ${countryName(c.cc)}`;
async function loadCities() {
  if (CITYDB) return CITYDB;
  const bin = Uint8Array.from(atob(window.__CITIES_B64 || ""), (ch) => ch.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  const txt = await new Response(stream).text();
  const [tzPart, rowPart] = txt.split("\n#\n"), tzs = tzPart.split("\n");
  CITYDB = rowPart.split("\n").map((r) => { const [n, cc, adm, la, lo, ti, pop] = r.split("\t");
    return { n, k: fold(n), cc, adm, lat: +la, lon: +lo, tz: tzs[+ti], pop: +pop }; });
  return CITYDB;
}
function searchCities(q) {
  if (!CITYDB) return [];
  const parts = q.split(",").map(fold).filter(Boolean);
  if (!parts.length || parts[0].length < 2) return [];
  const [name, ...rest] = parts, where = rest.join(" ");
  const out = [];
  for (const c of CITYDB) {
    let score;
    if (c.k === name) score = 3; else if (c.k.startsWith(name)) score = 2; else if (name.length >= 4 && c.k.includes(name)) score = 1; else continue;
    if (where) {
      const hay = fold(`${c.adm} ${US_STATES[c.adm] || ""} ${c.cc} ${countryName(c.cc)}`);
      if (!where.split(" ").every((w) => hay.includes(w))) continue;
    }
    out.push({ c, score });
    if (out.length > 400) break;
  }
  const res = out.sort((a, b) => b.score - a.score || b.c.pop - a.c.pop).slice(0, 8).map((x) => x.c);
  if (!res.length && !q.includes(",") && q.trim().includes(" ")) { const i = q.trim().lastIndexOf(" "); return searchCities(`${q.trim().slice(0, i)}, ${q.trim().slice(i + 1)}`); }
  return res;
}

// ---------------------------------------------------------------- Birth form
function openForm() {
  const b = S.isExample ? { ...SAMPLE, name: "", place: "New York, NY" } : S.birth;
  const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [b.tz]);
  const d = $("#formDlg");
  d.innerHTML = `
  <form id="birthForm" class="bform" autocomplete="off">
    <header class="card-h"><h2>Birth details</h2><button class="link" type="button" id="closeForm">Close</button></header>
    <div class="row"><label for="fName">Name (optional)</label><input id="fName" type="text" maxlength="40" value="${esc(S.isExample ? "" : b.name || "")}"></div>
    <div class="row3">
      <div class="row"><label for="fDate">Birth date</label><input id="fDate" type="date" required value="${b.y}-${String(b.m).padStart(2, "0")}-${String(b.d).padStart(2, "0")}"></div>
      <div class="row"><label for="fTime">Birth time</label><input id="fTime" type="time" required value="${String(b.h).padStart(2, "0")}:${String(b.mi).padStart(2, "0")}"></div>
      <div class="row"><label for="fRel">How sure is the time?</label><select id="fRel">
        <option value="certificate"${b.reliability === "certificate" ? " selected" : ""}>Birth certificate / hospital record</option>
        <option value="family"${b.reliability === "family" ? " selected" : ""}>Family memory</option>
        <option value="unknown"${b.reliability === "unknown" ? " selected" : ""}>Unknown / rough guess</option></select></div>
    </div>
    <div class="row place-row"><label for="fPlace">Birthplace</label>
      <input id="fPlace" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="placeList" placeholder="Start typing a town or city, e.g. Chicago, IL" value="${esc(b.place || "")}">
      <ul id="placeList" class="placelist2" role="listbox" hidden></ul>
      <p class="fine" id="placePicked">${b.place ? `Using ${esc(b.place)} · ${esc(b.tz)}` : ""}</p>
    </div>
    <details class="manual"><summary>Can't find it? Enter the location by hand</summary>
      <div class="row3">
        <div class="row"><label for="fLat">Latitude</label><input id="fLat" type="number" step="0.0001" min="-66" max="66" required value="${b.lat}"></div>
        <div class="row"><label for="fLon">Longitude</label><input id="fLon" type="number" step="0.0001" min="-180" max="180" required value="${b.lon}"></div>
        <div class="row"><label for="fTz">Time zone</label><select id="fTz">${zones.map((z) => `<option${z === b.tz ? " selected" : ""}>${esc(z)}</option>`).join("")}</select></div>
      </div>
      <p class="fine">Pick the nearest town above if you can. Otherwise, in a map app, long-press the place to copy its coordinates. West longitudes and south latitudes are negative.</p>
    </details>
    <p class="fine">Your birth details are stored only in this browser. They're never sent anywhere. The place search runs on your device too.</p>
    <p class="err" id="fErr" hidden></p>
    <div class="btns"><button class="btn btn-primary" type="submit">Show my chart</button>${S.isExample ? "" : '<button class="btn" type="button" id="useExample">Back to example chart</button>'}</div>
  </form>`;
  d.hidden = false;
  $("#fName").focus();
  $("#closeForm").onclick = () => (d.hidden = true);
  let chosen = b.place ? { label: b.place } : null, active = -1, results = [];
  const list = $("#placeList"), inp = $("#fPlace");
  const pick = (c) => {
    chosen = { label: placeLabel(c) };
    inp.value = chosen.label; $("#fLat").value = c.lat; $("#fLon").value = c.lon; $("#fTz").value = c.tz;
    $("#placePicked").textContent = `Using ${chosen.label} · ${c.tz}`;
    list.hidden = true; inp.setAttribute("aria-expanded", "false");
  };
  const show = () => {
    list.innerHTML = results.map((c, i) => `<li role="option" id="pl${i}" class="${i === active ? "on" : ""}" data-i="${i}"><strong>${esc(c.n)}</strong> <span class="fine">${esc(c.cc === "US" ? `${US_STATES[c.adm] || c.adm}, United States` : countryName(c.cc))}</span></li>`).join("")
      || '<li class="none">No match. Try a nearby larger town, or enter the location by hand below.</li>';
    list.hidden = false; inp.setAttribute("aria-expanded", "true");
    if (active >= 0) inp.setAttribute("aria-activedescendant", `pl${active}`);
  };
  loadCities().catch(() => { $("#placePicked").textContent = "Place search isn't available in this browser. Enter the location by hand below."; });
  inp.oninput = async () => {
    chosen = null; $("#placePicked").textContent = "";
    await loadCities().catch(() => null);
    results = searchCities(inp.value); active = -1;
    if (inp.value.trim().length >= 2) show(); else list.hidden = true;
  };
  inp.onkeydown = (e) => {
    if (list.hidden || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(results.length - 1, active + 1); show(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); show(); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[Math.max(0, active)]); }
    else if (e.key === "Escape") { e.stopPropagation(); list.hidden = true; }
  };
  list.onmousedown = (e) => { const li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); pick(results[+li.dataset.i]); } };
  ["fLat", "fLon"].forEach((id) => ($("#" + id).oninput = () => { chosen = null; $("#placePicked").textContent = "Using the coordinates entered by hand."; }));
  const ue = $("#useExample");
  if (ue) ue.onclick = () => { store.set("nightalmanac.birth", null); load(SAMPLE, true); d.hidden = true; render(); };
  $("#birthForm").onsubmit = (e) => {
    e.preventDefault();
    if (inp.value.trim() && !chosen && $("#placePicked").textContent.indexOf("by hand") < 0) { showErr("Pick your birthplace from the suggestions, or enter the location by hand."); inp.focus(); return; }
    const [y, m, dd] = $("#fDate").value.split("-").map(Number);
    const [h, mi] = $("#fTime").value.split(":").map(Number);
    const nb = { y, m, d: dd, h, mi, lat: +$("#fLat").value, lon: +$("#fLon").value, tz: $("#fTz").value,
      reliability: $("#fRel").value, name: $("#fName").value.trim(), place: chosen ? chosen.label : "" };
    if (y < 1800 || y > 2100) { showErr("Enter a birth year between 1800 and 2100."); return; }
    try { load(nb, false); } catch (err) { showErr("Couldn't calculate this chart. Check the date, time and place."); return; }
    store.set("nightalmanac.birth", nb);
    d.hidden = true; render();
  };
  function showErr(t) { const p = $("#fErr"); p.textContent = t; p.hidden = false; }
}

// ---------------------------------------------------------------- glossary + system switch (delegated)
function openGloss(key) {
  const [term, def] = GLOSS[key] || [];
  if (!term) return;
  const p = $("#gloss");
  p.innerHTML = `<div class="gloss-in"><div><strong>${term}</strong><p>${def}</p></div><button type="button" class="link" id="glossClose">Close</button></div>`;
  p.hidden = false;
  $("#glossClose").onclick = () => (p.hidden = true);
  $("#glossClose").focus();
}
document.addEventListener("keydown", (e) => { const gl = e.target.closest && e.target.closest(".gl"); if (gl && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openGloss(gl.dataset.g); } });
document.addEventListener("click", (e) => {
  const gl = e.target.closest(".gl");
  if (gl) { e.preventDefault(); openGloss(gl.dataset.g); return; }
  const sw = e.target.closest(".js-sys");
  if (sw && sw.dataset.sys !== S.sys) {
    S.sys = sw.dataset.sys; store.set("nightalmanac.sys", S.sys);
    S.ask = null; S.tlSel = null; S.askMode = "natal"; S.fc = null; S.mCache = {};
    render();
  }
});

// ---------------------------------------------------------------- First-open notice
const GATE_KEY = "nightalmanac.agreed.v1";
function showGate() {
  if (store.get(GATE_KEY, false)) return;
  const g = $("#gate");
  g.innerHTML = `<div class="gate-box">
    <p class="eyebrow">Before you begin</p>
    <h2 id="gateTitle">Welcome to The Night Almanac</h2>
    <p>Please read this once before you start.</p>
    <ul>
      <li><strong>For adults 18 and over.</strong></li>
      <li><strong>For entertainment and reflection.</strong> Astrology is a cultural tradition, not a science. Studies haven't found that it predicts events or personality. Readings describe what the Western and Vedic traditions say.</li>
      <li><strong>Not professional advice.</strong> Nothing here is medical, mental health, legal or financial advice. Don't use it to make decisions about your health, safety, money or legal matters; talk to a qualified professional.</li>
      <li><strong>Your choices are your own.</strong> When tradition calls a time "challenging" or "supportive", that's not a prediction of what will happen. Outcomes depend on you.</li>
      <li><strong>Private by design.</strong> Your birth details are saved only on this device and never sent to us.</li>
      <li><strong>If you're struggling,</strong> please reach out to a person. In the US, call or text 988. Elsewhere: <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>.</li>
    </ul>
    <label class="gate-check"><input type="checkbox" id="gateOk"> I'm 18 or older, and I understand The Night Almanac is for entertainment and reflection, not advice.</label>
    <div class="btns"><button type="button" class="btn btn-primary" id="gateGo" disabled>Enter</button></div>
    <p class="fine">You can read this again any time under "About, privacy &amp; help" at the bottom of the page.</p>
  </div>`;
  const others = [...document.body.children].filter((el) => el !== g && el.tagName !== "SCRIPT");
  others.forEach((el) => el.setAttribute("inert", ""));
  g.hidden = false;
  const ok = $("#gateOk"), go = $("#gateGo");
  ok.onchange = () => { go.disabled = !ok.checked; };
  const close = () => { store.set(GATE_KEY, true); g.hidden = true; g.innerHTML = ""; others.forEach((el) => el.removeAttribute("inert")); };
  go.onclick = () => { if (ok.checked) close(); };
  g.scrollTop = 0; ok.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- boot
(async () => {
  try {
    E.setSwe(await SwissEPH.init("swisseph.wasm"));
    const saved = store.get("nightalmanac.birth", null);
    try { saved ? load(saved, false) : load(SAMPLE, true); } catch { load(SAMPLE, true); }
    $("#loading").hidden = true;
    window.addEventListener("hashchange", route);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("#formDlg").hidden = true; $("#gloss").hidden = true; } });
    route();
    showGate();
  } catch (err) {
    $("#loading").textContent = "The calculation engine couldn't start in this browser. Try reloading, or open the page in a current version of Chrome, Safari or Firefox.";
    console.error(err);
  }
})();
