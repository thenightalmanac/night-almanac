// forecast.js — daily horoscope and 12-month forecast, built from real transits.
import * as E from "./engine.js";
import { PLANET } from "./meanings.js";

const DAY = 86400000;

// What people actually do in each area of life
export const HOUSE_DO = {
  1: "your health, appearance and personal goals", 2: "earning, spending and saving",
  3: "messages, paperwork, short trips and siblings", 4: "home, family and property",
  5: "dating, fun, creative projects and kids", 6: "work routines, health habits and chores",
  7: "relationships, partnerships and contracts", 8: "debts, taxes, shared money and deep changes",
  9: "travel, study and big-picture plans", 10: "career moves, reputation and goals",
  11: "friends, networking, groups and wishes", 12: "rest, reflection and finishing things",
};
const TARGET = { Sun: "your confidence and direction", Moon: "your mood and home life", Venus: "your relationships and money",
  Mercury: "your thinking and communication", Mars: "your energy and drive", Jupiter: "your growth and opportunities",
  Saturn: "your responsibilities", Rising: "your health and personal plans", MC: "your career and public image" };
const SHORT = (p) => PLANET[p].split(",")[0];

// ------------------------------------------------------------ Western daily
const DAILY_ASPECTS = [["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180]];
function aspectHits(tpos, natal, movers, orbFor) {
  const hits = [];
  for (const tp of movers) for (const [np, nlon] of Object.entries(natal)) {
    const sep = Math.abs(E.angdiff(tpos[tp].lon, nlon));
    for (const [type, ang] of DAILY_ASPECTS) {
      const orb = Math.abs(sep - ang);
      if (orb <= orbFor(tp)) hits.push({ tp, np, type, orb });
    }
  }
  return hits.sort((a, b) => a.orb - b.orb);
}
function aspectTone(h) {
  const easy = h.type === "trine" || h.type === "sextile";
  const hard = h.type === "square" || h.type === "opposition";
  const benefic = ["Venus", "Jupiter"].includes(h.tp), malefic = ["Mars", "Saturn"].includes(h.tp);
  if (easy) return 1;
  if (hard) return -1;
  return benefic ? 1 : malefic ? -1 : 0;
}
const VIA = { Moon: "your feelings", Sun: "your energy", Mercury: "conversations and plans", Venus: "people and pleasures", Mars: "action and effort" };
function aspectSentence(h) {
  const t = aspectTone(h), target = TARGET[h.np] || `your ${h.np}`;
  const who = h.tp === "Moon" ? "The Moon" : h.tp === "Sun" ? "The Sun" : h.tp;
  const word = { conjunction: "meets", sextile: "supports", trine: "flows with", square: "clashes with", opposition: "opposes" }[h.type];
  const where = h.np === "MC" ? "career point" : h.np === "Rising" ? "rising sign" : h.np;
  const tail = t > 0 ? `Easy energy for ${target}, helped along by ${VIA[h.tp]}.` : t < 0 ? `Some friction around ${target}, likely through ${VIA[h.tp]}. Go slow and don't force it.` : `A spotlight on ${target}, through ${VIA[h.tp]}.`;
  return `${who} ${word} your ${where}. ${tail}`;
}
function retroNotes(ms) {
  const out = [];
  for (const p of ["Mercury", "Venus", "Mars"]) {
    const now = E.planetsAt(ms)[p];
    if (now.retro) {
      let d = ms; while (d < ms + 300 * DAY && E.planetsAt(d)[p].retro) d += DAY;
      out.push({ p, text: `${p} is retrograde until about ${new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}. ${RETRO[p]}` });
    } else {
      let d = ms + DAY; const lim = ms + 14 * DAY;
      while (d < lim && !E.planetsAt(d)[p].retro) d += DAY;
      if (d < lim) out.push({ p, text: `${p} turns retrograde around ${new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}. ${RETRO[p]}` });
    }
  }
  return out;
}
const RETRO = {
  Mercury: "Tradition says to double-check plans, messages and travel details, and to expect some delays with tech and paperwork.",
  Venus: "Tradition says it's better to revisit relationships and spending than to start new ones.",
  Mars: "Tradition says energy runs lower and it's a time to review rather than push.",
};
export function westernDay(chart, ms) {
  const T = E.planetsAt(ms), w = chart.western;
  const moonHouse = E.wsHouse(T.Moon.lon, w.asc);
  const natal = { Sun: w.planets.Sun.lon, Moon: w.planets.Moon.lon, Mercury: w.planets.Mercury.lon, Venus: w.planets.Venus.lon,
    Mars: w.planets.Mars.lon, Jupiter: w.planets.Jupiter.lon, Saturn: w.planets.Saturn.lon, Rising: w.asc, MC: w.mc };
  const hits = aspectHits(T, natal, ["Moon", "Sun", "Mercury", "Venus", "Mars"], (p) => (p === "Moon" ? 4 : 1.5)).slice(0, 4);
  const score = hits.reduce((s, h) => s + aspectTone(h), 0);
  const tone = score >= 2 ? ["Smooth day", "good", "Things should flow more easily than usual. A good day to ask for something or make plans."]
    : score <= -2 ? ["Bumpy day", "low", "Expect a little more friction than usual. Keep plans flexible and avoid picking fights."]
      : ["Steady day", "mixed", "A normal day, with a mix of easy and harder moments."];
  return { moonSign: E.SIGNS[E.signIdx(T.Moon.lon)], moonHouse, hits: hits.map((h) => ({ ...h, text: aspectSentence(h) })), tone, retro: retroNotes(ms) };
}

// ------------------------------------------------------------ Vedic daily
export const TARA = [
  ["Janma", "mixed", "Your birth star repeats today. A sensitive day; take care of yourself."],
  ["Sampat", "good", "A day associated with gains and good results."],
  ["Vipat", "low", "Tradition advises caution today. Avoid starting important things."],
  ["Kshema", "good", "A day of well-being and safety."],
  ["Pratyak", "low", "Obstacles are more likely. Better for routine work than new starts."],
  ["Sadhana", "good", "A day for achievement. Good for starting things."],
  ["Naidhana", "low", "The most cautious day of the cycle. Keep it simple."],
  ["Mitra", "good", "A friendly, supportive day."],
  ["Param Mitra", "good", "A very supportive day. Good for important tasks."],
];
const TITHI = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami",
  "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"];
const MOON_FROM_MOON = {
  1: ["good", "focus on yourself and your plans"], 2: ["mixed", "money and family matters"], 3: ["good", "effort pays off; good for initiative"],
  4: ["low", "you may feel unsettled; stay close to home"], 5: ["mixed", "creative thinking, but avoid speculation"],
  6: ["good", "good for tackling problems and competition"], 7: ["good", "good for meetings and partners"],
  8: ["low", "the tradition's most cautious day of the month (Chandrashtama); postpone big decisions"],
  9: ["mixed", "good for learning and faith"], 10: ["good", "good for work and getting things done"],
  11: ["good", "good for gains and meeting friends"], 12: ["low", "low energy; good for rest, not new starts"],
};
export function sadeSati(chart, ms) {
  const moonSign = E.signIdx(chart.vedic.planets.Moon.lon);
  const inSS = (t) => { const h = ((E.signIdx(E.planetsAt(t, "lahiri").Saturn.lon) - moonSign) % 12 + 12) % 12 + 1; return h === 12 || h === 1 || h === 2; };
  const step = 15 * DAY;
  if (inSS(ms)) {
    let a = ms; while (a > ms - 10 * 365 * DAY && inSS(a - step)) a -= step;
    let b = ms; while (b < ms + 10 * 365 * DAY && inSS(b + step)) b += step;
    return { active: true, start: a, end: b };
  }
  let n = ms; while (n < ms + 32 * 365 * DAY && !inSS(n)) n += step;
  return { active: false, next: n < ms + 32 * 365 * DAY ? n : null };
}
export function vedicDay(chart, dasha, ms) {
  const T = E.planetsAt(ms, "lahiri"), v = chart.vedic.planets;
  const h = ((E.signIdx(T.Moon.lon) - E.signIdx(v.Moon.lon)) % 12 + 12) % 12 + 1;
  const tNak = Math.floor(E.norm(T.Moon.lon) / (360 / 27)), bNak = Math.floor(E.norm(v.Moon.lon) / (360 / 27));
  const tara = TARA[((tNak - bNak + 27) % 27) % 9];
  const diff = E.norm(T.Moon.lon - T.Sun.lon), ti = Math.floor(diff / 12);
  const tithi = ti === 14 ? "Purnima (full moon)" : ti === 29 ? "Amavasya (new moon)" : `${ti < 15 ? "Shukla" : "Krishna"} ${TITHI[ti % 15]}`;
  const d = E.dashaAt(dasha, ms);
  const pd = d ? E.pratyantar(d.md, d.ad).find((x) => x.start <= ms && ms < x.end) : null;
  const score = (MOON_FROM_MOON[h][0] === "good" ? 1 : MOON_FROM_MOON[h][0] === "low" ? -1 : 0) + (tara[1] === "good" ? 1 : tara[1] === "low" ? -1 : 0);
  const tone = h === 8 ? ["Careful day", "low", "The Moon is in the 8th sign from your birth Moon. Tradition advises postponing big decisions."]
    : score >= 2 ? ["Favorable day", "good", "Both of the main daily factors are positive. A good day for important tasks."]
      : score <= -1 ? ["Careful day", "low", "The daily factors lean difficult. Stick to routine where you can."]
        : ["Mixed day", "mixed", "The daily factors are mixed. Fine for most things."];
  return { moonSign: E.SIGNS[E.signIdx(T.Moon.lon)], moonFromMoon: h, mfm: MOON_FROM_MOON[h], nakshatra: E.NAKSHATRAS[tNak], tara, tithi, pd, d, tone };
}

// ------------------------------------------------------------ 12-month forecast
const MOVERS = [["Jupiter", 1], ["Saturn", -1], ["Mars", 0]];
function exactDates(chart, from, to) {
  const w = chart.western;
  const targets = { Sun: w.planets.Sun.lon, Moon: w.planets.Moon.lon, Venus: w.planets.Venus.lon, Rising: w.asc, MC: w.mc };
  const out = [];
  let prev = null;
  for (let t = from; t <= to; t += DAY) {
    const T = E.planetsAt(t), cur = {};
    for (const [p] of MOVERS) for (const [tn, tl] of Object.entries(targets)) for (const [type, ang] of [["conjunction", 0], ["square", 90], ["opposition", 180], ["trine", 120]]) {
      for (const sgn of ang === 0 || ang === 180 ? [1] : [1, -1]) {
        const k = `${p}|${tn}|${type}|${sgn}`;
        cur[k] = E.angdiff(T[p].lon - tl, sgn * ang);
        if (prev && prev[k] !== undefined && Math.sign(prev[k]) !== Math.sign(cur[k]) && Math.abs(prev[k]) < 5) out.push({ ms: t, p, tn, type });
      }
    }
    prev = cur;
  }
  return out;
}
function transitLine(x) {
  const target = TARGET[x.tn];
  const easy = x.type === "trine" || (x.type === "conjunction" && x.p === "Jupiter");
  const word = { conjunction: "crosses", square: "squares", opposition: "opposes", trine: "trines" }[x.type];
  const where = x.tn === "MC" ? "career point" : x.tn === "Rising" ? "rising sign" : x.tn;
  let meaning;
  if (x.p === "Jupiter") meaning = easy || x.type !== "square" ? `a lift for ${target}. A good time to go for opportunities.` : `growth for ${target}, with a risk of overdoing it.`;
  else if (x.p === "Saturn") meaning = x.type === "trine" ? `steady progress for ${target}. Effort now builds something lasting.` : `a test or extra pressure on ${target}. Slow down and do things properly.`;
  else meaning = x.type === "trine" ? `a burst of energy for ${target}.` : `extra drive, and possible friction or impatience around ${target}.`;
  return `${x.p} ${word} your ${where}: ${meaning}`;
}
export function westernMonths(chart, prof, zrS, zrF, startMs, n = 12) {
  const months = [], d0 = new Date(startMs);
  const exact = exactDates(chart, Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), 1), Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + n, 1));
  for (let i = 0; i < n; i++) {
    const a = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i, 1), b = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i + 1, 1), mid = (a + b) / 2;
    const y = prof.find((p) => p.start <= mid && mid < p.end);
    const k = y ? Math.floor((mid - y.start) / ((y.end - y.start) / 12)) : 0;
    const mHouse = y ? ((y.house - 1 + k) % 12) + 1 : null;
    const T = E.planetsAt(mid);
    const jh = E.wsHouse(T.Jupiter.lon, chart.western.asc), sh = E.wsHouse(T.Saturn.lon, chart.western.asc);
    const events = [];
    if (y && y.start >= a && y.start < b) events.push({ ms: y.start, text: `Birthday: your yearly focus moves to ${HOUSE_DO[y.house]}.` });
    for (const [zr, area] of [[zrS, "career"], [zrF, "money, home and daily life"]])
      for (const l1 of zr.level1) for (const l2 of l1.level2) if (l2.start >= a && l2.start < b && (l2.peak || l2.loosing))
        events.push({ ms: l2.start, text: l2.loosing ? `A turning point begins for ${area}. Plans may change direction.` : `A ${l2.peak === "10th" ? "major" : l2.peak === "4th" ? "quieter" : ""} high point begins for ${area}${l2.peak === "10th" ? ": one of the most eventful stretches in your timeline." : "."}`.replace("A  high", "A high") });
    for (const x of exact) if (x.ms >= a && x.ms < b) events.push({ ms: x.ms, text: transitLine(x) });
    events.sort((p, q) => p.ms - q.ms);
    months.push({ a, focusHouse: mHouse, focus: mHouse ? HOUSE_DO[mHouse] : "", jupiter: { house: jh, text: `Jupiter in your ${E.ordinal(jh)} house: growth and luck around ${HOUSE_DO[jh]}.` },
      saturn: { house: sh, text: `Saturn in your ${E.ordinal(sh)} house: hard work and responsibility around ${HOUSE_DO[sh]}, with slow but lasting results.` }, events: events.slice(0, 5) });
  }
  return months;
}
const GOCHAR = {
  Jupiter: { good: [2, 5, 7, 9, 11], text: (h, good) => good ? `Jupiter is in the ${E.ordinal(h)} sign from your Moon, a supportive position: growth and help from others.` : `Jupiter is in the ${E.ordinal(h)} sign from your Moon, a less supportive position: progress takes more effort.` },
  Saturn: { good: [3, 6, 11], text: (h, good) => good ? `Saturn is in the ${E.ordinal(h)} sign from your Moon, one of its best positions: hard work pays off.` : `Saturn is in the ${E.ordinal(h)} sign from your Moon: a slower, more demanding stretch.` },
};
export function vedicMonths(chart, dasha, startMs, n = 12) {
  const months = [], d0 = new Date(startMs), ms0 = E.signIdx(chart.vedic.planets.Moon.lon);
  for (let i = 0; i < n; i++) {
    const a = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i, 1), b = Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + i + 1, 1), mid = (a + b) / 2;
    const T = E.planetsAt(mid, "lahiri");
    const from = (lon) => ((E.signIdx(lon) - ms0) % 12 + 12) % 12 + 1;
    const jh = from(T.Jupiter.lon), sh = from(T.Saturn.lon);
    const d = E.dashaAt(dasha, mid);
    const events = [];
    for (const md of dasha.mahadashas) for (const ad of md.antardashas) {
      if (ad.start >= a && ad.start < b) events.push({ ms: ad.start, text: `New ${md.lord}–${ad.lord} sub-period: ${PLANET_DO[ad.lord]} take more of your attention.` });
      if (ad.end > a && ad.start < b) for (const pd of E.pratyantar(md, ad)) if (pd.start >= a && pd.start < b)
        events.push({ ms: pd.start, text: `Short ${pd.lord} phase (about ${Math.max(1, Math.round((pd.end - pd.start) / DAY))} days): a few weeks where ${PLANET_DO[pd.lord]} get more of your attention.` });
    }
    events.sort((p, q) => p.ms - q.ms);
    months.push({ a, d, jupiter: { house: jh, good: GOCHAR.Jupiter.good.includes(jh), text: GOCHAR.Jupiter.text(jh, GOCHAR.Jupiter.good.includes(jh)) },
      saturn: { house: sh, good: GOCHAR.Saturn.good.includes(sh), sadeSati: [12, 1, 2].includes(sh), text: GOCHAR.Saturn.text(sh, GOCHAR.Saturn.good.includes(sh)) }, events: events.slice(0, 5) });
  }
  return months;
}

// What a long Vedic period tends to bring, in everyday terms
export const PLANET_DO = {
  Sun: "recognition, leadership and dealing with authority", Moon: "home, family, feelings and changes of residence",
  Mercury: "study, writing, business deals and communication", Venus: "relationships, comfort, creativity and spending",
  Mars: "energy, competition, property and bold moves", Jupiter: "growth, teaching, children and new opportunities",
  Saturn: "hard work, responsibility and building for the long term", Rahu: "ambition, foreign connections and unusual paths",
  Ketu: "letting go, spiritual interests and endings that clear space",
};
