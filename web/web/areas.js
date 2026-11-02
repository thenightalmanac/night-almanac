// areas.js — turns planetary movements into plain answers for six life areas.
// Every event is computed from real planet positions; ratings follow traditional rules.
import * as E from "./engine.js";

const DAY = 86400000;
export const AREAS6 = [
  ["love", "Love & relationships"], ["career", "Career & work"], ["money", "Money"],
  ["home", "Home & family"], ["health", "Health & energy"], ["friends", "Friends & social life"],
];
const AREA_HOUSES = { love: [5, 7], career: [10, 6], money: [2, 8, 11], home: [4], health: [1, 6], friends: [11, 3] };
const PRIMARY_HOUSE = { love: 7, career: 10, money: 2, home: 4, health: 1, friends: 11 };
const areasOfHouse = (h) => Object.keys(AREA_HOUSES).filter((a) => AREA_HOUSES[a].includes(h));
const ord = (n) => E.ordinal(n);
const HOUSE_PLAIN = {
  1: "you personally", 2: "your money", 3: "communication and short trips", 4: "home and family", 5: "romance, fun and creativity",
  6: "daily work and health habits", 7: "relationships and partners", 8: "shared money and big changes", 9: "travel and learning",
  10: "career and reputation", 11: "friends and goals", 12: "rest and reflection",
};
const STAY = { Sun: "about a month", Mercury: "about three weeks", Venus: "about four weeks", Mars: "about six weeks", Jupiter: "about a year", Saturn: "about two and a half years" };

// What an event means for each area, by direction
const GOOD = {
  love: "a good moment to reach out, go on a date or plan something with your partner",
  career: "a good moment to pitch an idea, apply, ask for something or be visible at work",
  money: "a good moment to negotiate, make a planned purchase or sort out finances",
  home: "a good moment for family time, hosting or home projects",
  health: "good energy for exercise, a new routine or getting things done",
  friends: "a good moment to reach out, network or make plans",
};
const HARD = {
  love: "possible tension or misunderstandings; avoid big relationship decisions in the heat of the moment",
  career: "possible pressure, pushback or delays at work; double-check details and keep your cool",
  money: "be careful with spending, lending and big financial commitments",
  home: "possible friction at home; give people space and avoid old arguments",
  health: "energy may dip or stress may rise; rest and don't overdo it",
  friends: "possible crossed wires with friends; clarify plans and skip the drama",
};
const SPOT = {
  love: "love and attraction are on your mind; a good time to be honest about what you want",
  career: "work takes more of your attention and energy",
  money: "money is on your mind; a good time to review your budget",
  home: "home and family need some attention",
  health: "your body and energy are in focus; listen to them",
  friends: "a busier social stretch, with more messages, plans and conversations",
};
const meaning = (area, sc) => (sc >= 0.9 ? GOOD : sc <= -0.9 ? HARD : SPOT)[area];

export const AREA_TEXT = {
  love: {
    good: "A warm, easy {span} for love. If you're single, say yes to plans and put yourself out there. If you're with someone, it's a good time for quality time or a conversation you've been meaning to have.",
    mixed: "Love has ups and downs this {span}: some sweet moments, some friction. Talk things through instead of assuming, and don't make big decisions in a bad moment.",
    low: "Relationships may feel tense, distant or slow this {span}. It's a time for patience, not ultimatums. Small kindnesses go further than big gestures.",
    quiet: "A quiet {span} for love astrologically. Nothing in particular stirs things up, so things carry on as they are.",
  },
  career: {
    good: "A strong {span} for work. Good for pitching ideas, job applications, asking for a raise or taking on visible projects.",
    mixed: "Work is busy but uneven this {span}. Some doors open and others stick. Stay organized and pick your battles.",
    low: "Work may bring pressure, delays or difficult people this {span}. Double-check details, keep your cool and aim for steady progress over big moves.",
    quiet: "A steady {span} at work with no big astrological triggers. Good for routine tasks and catching up.",
  },
  money: {
    good: "A favorable {span} for money. Good for negotiating, planned purchases and sorting out finances.",
    mixed: "Money is a mixed picture this {span}: some gains, some unexpected costs. Stick to your budget.",
    low: "Be careful with money this {span}. Avoid impulse buys, risky deals and lending money. Payment delays are possible.",
    quiet: "Nothing major in the stars for money this {span}. A good time to keep things simple.",
  },
  home: {
    good: "A pleasant {span} at home. Good for family time, hosting or home projects.",
    mixed: "Home life mixes warmth and friction this {span}. Give people a little space.",
    low: "Home or family may feel tense or demanding this {span}. Be patient and avoid reopening old arguments.",
    quiet: "A calm {span} at home astrologically.",
  },
  health: {
    good: "Good energy this {span}. A good time to start a routine, exercise or tackle a to-do list.",
    mixed: "Energy comes and goes this {span}. Pace yourself and protect your sleep.",
    low: "Energy may run low or stress may run high this {span}. Rest, don't overcommit and take care when rushing.",
    quiet: "No big astrological triggers for your energy this {span}. Keep up your usual routine.",
  },
  friends: {
    good: "A sociable {span}. Good for reaching out, networking, events and making plans.",
    mixed: "Social life is busy but bumpy this {span}. Confirm plans and don't take mixed messages personally.",
    low: "Possible crossed wires with friends or groups this {span}. Keep things simple and avoid drama.",
    quiet: "A quiet social {span}. Better for one-on-one time than big plans.",
  },
};
export const GOOD_FOR = { love: "dates and heart-to-hearts", career: "pitching, applying and asking for things at work", money: "negotiating and planned purchases",
  home: "family time and home projects", health: "exercise and new routines", friends: "socializing and networking" };
export const EASY_ON = { love: "big relationship decisions", career: "confrontations and risky moves at work", money: "impulse spending and big commitments",
  home: "touchy family topics", health: "overdoing it; get rest", friends: "group drama and over-committing" };

// ------------------------------------------------------------ Western
const ASPECTS = [["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180]];
const ASP_WORD = { conjunction: "meets", sextile: "supports", trine: "flows with", square: "clashes with", opposition: "opposes" };
function westTargets(chart) {
  const w = chart.western, P = w.planets;
  const T = [
    { key: "Sun", lon: P.Sun.lon, label: "Sun", areas: ["career", "health"] },
    { key: "Moon", lon: P.Moon.lon, label: "Moon", areas: ["home", "health"] },
    { key: "Mercury", lon: P.Mercury.lon, label: "Mercury", areas: ["friends", "career"] },
    { key: "Venus", lon: P.Venus.lon, label: "Venus", areas: ["love", "money"] },
    { key: "Mars", lon: P.Mars.lon, label: "Mars", areas: ["health"] },
    { key: "Jupiter", lon: P.Jupiter.lon, label: "Jupiter", areas: ["money"] },
    { key: "Saturn", lon: P.Saturn.lon, label: "Saturn", areas: ["career"] },
    { key: "Rising", lon: w.asc, label: "rising sign", areas: ["health"] },
    { key: "MC", lon: w.mc, label: "career point", areas: ["career"] },
    { key: "DSC", lon: E.norm(w.asc + 180), label: "relationship point", areas: ["love"] },
    { key: "IC", lon: E.norm(w.mc + 180), label: "home point", areas: ["home"] },
  ];
  for (const [area, h] of Object.entries(PRIMARY_HOUSE)) {
    const r = E.RULERS[(E.signIdx(w.asc) + h - 1) % 12], t = T.find((x) => x.key === r);
    if (t && !t.areas.includes(area)) t.areas.push(area);
  }
  return T;
}
function aspScore(tp, type) {
  const easy = type === "trine" || type === "sextile";
  let s;
  if (tp === "Venus" || tp === "Jupiter") s = easy || type === "conjunction" ? 2 : 0.5;
  else if (tp === "Saturn") s = easy ? 1 : type === "conjunction" ? -1.5 : -2;
  else if (tp === "Mars") s = easy ? 1 : type === "conjunction" ? -0.5 : -1.5;
  else s = easy ? 0.6 : type === "conjunction" ? 0.3 : -0.6;
  return tp === "Jupiter" || tp === "Saturn" ? s * 1.5 : s;
}
const INGRESS = { Sun: 1, Mercury: 0.5, Venus: 1.5, Mars: -0.5, Jupiter: 2, Saturn: -1.5 };
const STATION = { Mercury: [["friends", "career"], -1, "tradition says to double-check plans, messages and travel, and expect delays with tech and paperwork"],
  Venus: [["love", "money"], -1.5, "tradition says to revisit relationships and spending rather than start new ones"],
  Mars: [["health"], -1, "energy tends to run lower; a time to review rather than push"] };

export function westernEvents(chart, from, to, opt = {}) {
  const movers = opt.movers || ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const targets = westTargets(chart), asc = chart.western.asc, ev = [];
  const step = opt.step || DAY;
  let prev = null;
  for (let t = from - step; t <= to; t += step) {
    const T = E.planetsAt(t), cur = { asp: {}, house: {}, retro: {}, lun: E.angdiff(T.Moon.lon, T.Sun.lon) };
    for (const p of movers) {
      cur.house[p] = E.wsHouse(T[p].lon, asc); cur.retro[p] = T[p].retro;
      if (opt.aspects !== false) for (const tg of targets) for (const [type, ang] of ASPECTS) for (const sg of ang === 0 || ang === 180 ? [1] : [1, -1]) {
        const k = `${p}|${tg.key}|${type}|${sg}`;
        cur.asp[k] = E.angdiff(T[p].lon - tg.lon, sg * ang);
        if (prev && t >= from && Math.sign(prev.asp[k]) !== Math.sign(cur.asp[k]) && Math.abs(prev.asp[k]) < 8) {
          const sc = aspScore(p, type);
          ev.push({ ms: t, sys: "Western", areas: tg.areas, score: sc, title: `${p} ${ASP_WORD[type]} your ${tg.label}`,
            kind: "aspect", slow: p === "Jupiter" || p === "Saturn" });
        }
      }
      if (prev && t >= from && prev.house[p] !== cur.house[p] && !(cur.retro[p] && prev.retro[p] && Math.abs(cur.house[p] - prev.house[p]) === 1 && cur.house[p] < prev.house[p])) {
        const h = cur.house[p], areas = areasOfHouse(h);
        if (areas.length) ev.push({ ms: t, sys: "Western", areas, score: INGRESS[p], title: `${p} enters your ${ord(h)} house (${HOUSE_PLAIN[h]}) for ${STAY[p]}`, kind: "ingress" });
      }
      if (prev && t >= from && prev.retro[p] !== cur.retro[p] && STATION[p]) {
        const [areas, sc, txt] = STATION[p];
        ev.push({ ms: t, sys: "Western", areas, score: cur.retro[p] ? sc : -sc / 2,
          title: cur.retro[p] ? `${p} turns retrograde: ${txt}` : `${p} goes direct again, and things in this area start moving forward`, kind: "station", fixedText: true });
      }
    }
    if (opt.lunations !== false && prev && t >= from) {
      for (const [ang, name] of [[0, "New moon"], [180, "Full moon"]]) {
        const a = E.angdiff(prev.lun, ang), b = E.angdiff(cur.lun, ang);
        if (Math.sign(a) !== Math.sign(b) && Math.abs(a) < 30) {
          const h = E.wsHouse(T.Moon.lon, asc), areas = areasOfHouse(h);
          if (areas.length) ev.push({ ms: t, sys: "Western", areas, score: ang === 0 ? 1 : 0.3, kind: "lunation",
            title: ang === 0 ? `${name} in your ${ord(h)} house: a natural time to start something new around ${HOUSE_PLAIN[h]}` : `${name} in your ${ord(h)} house: things around ${HOUSE_PLAIN[h]} come to a head, and emotions may run high`, fixedText: true });
        }
      }
    }
    prev = cur;
  }
  if (opt.background !== false) {
    const T = E.planetsAt(from);
    for (const p of ["Venus", "Mars", "Jupiter", "Saturn"]) {
      if (!movers.includes(p)) continue;
      const h = E.wsHouse(T[p].lon, asc), areas = areasOfHouse(h);
      if (areas.length) ev.push({ ms: from, sys: "Western", areas, score: INGRESS[p] / 2, kind: "background", title: `${p} is passing through your ${ord(h)} house (${HOUSE_PLAIN[h]})` });
    }
  }
  return ev.sort((a, b) => a.ms - b.ms);
}
// Moon contacts for a single day (the Moon moves too fast for exact dates to matter)
export function westernMoonDay(chart, ms) {
  const T = E.planetsAt(ms), targets = westTargets(chart), ev = [];
  for (const [p, maxOrb, w] of [["Moon", 4, 0.6], ["Sun", 1.2, 1], ["Mercury", 1.2, 1], ["Venus", 1.2, 1], ["Mars", 1.2, 1], ["Jupiter", 1, 1], ["Saturn", 1, 1]])
    for (const tg of targets) for (const [type, ang] of ASPECTS) {
      const orb = Math.abs(Math.abs(E.angdiff(T[p].lon, tg.lon)) - ang);
      if (orb <= maxOrb) ev.push({ ms, sys: "Western", areas: tg.areas, score: aspScore(p, type) * w, title: `${p === "Moon" ? "The Moon" : p === "Sun" ? "The Sun" : p} ${ASP_WORD[type]} your ${tg.label}`, kind: p === "Moon" ? "moon" : "aspect" });
    }
  const h = E.wsHouse(T.Moon.lon, chart.western.asc);
  for (const a of areasOfHouse(h)) ev.push({ ms, sys: "Western", areas: [a], score: 0.3, title: `The Moon is in your ${ord(h)} house, turning attention to ${HOUSE_PLAIN[h]}`, kind: "moon", fixedText: true });
  return ev;
}

// ------------------------------------------------------------ Vedic
const GOOD_FROM_MOON = { Sun: [3, 6, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [3, 6, 11], Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12], Saturn: [3, 6, 11] };
const KARAKA = { Sun: ["career", "health"], Mars: ["health", "home"], Mercury: ["friends", "career"], Jupiter: ["money", "love"],
  Venus: ["love", "money"], Saturn: ["career", "health"], Moon: ["home", "health"], Rahu: ["career"], Ketu: ["health"] };
const GOOD_TARA = ["Sampat", "Kshema", "Sadhana", "Mitra", "Param Mitra"];
const TARA_NAMES = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyak", "Sadhana", "Naidhana", "Mitra", "Param Mitra"];
function kpSigSet(kp, houses) {
  const s = new Set();
  for (const h of houses) { const g = kp.significators[h]; [...g.A, ...g.B, ...g.C, g.D].forEach((p) => s.add(p)); }
  return s;
}
export function areaLinks(chart, planet) {
  return Object.keys(AREA_HOUSES).filter((a) => kpSigSet(chart.kp, AREA_HOUSES[a]).has(planet));
}
export function vedicEvents(chart, dasha, from, to, opt = {}) {
  const movers = opt.movers || ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const v = chart.vedic, m0 = E.signIdx(v.planets.Moon.lon), lag = v.lagna, nak0 = Math.floor(E.norm(v.planets.Moon.lon) / (360 / 27));
  const fromMoon = (lon) => ((E.signIdx(lon) - m0) % 12 + 12) % 12 + 1;
  const ev = [];
  let prev = null;
  for (let t = from - DAY; t <= to; t += DAY) {
    const T = E.planetsAt(t, "lahiri"), cur = { sign: {}, retro: {} };
    for (const p of movers) {
      cur.sign[p] = E.signIdx(T[p].lon); cur.retro[p] = T[p].retro;
      if (prev && t >= from && prev.sign[p] !== cur.sign[p]) {
        const hm = fromMoon(T[p].lon), hl = E.wsHouse(T[p].lon, lag), good = GOOD_FROM_MOON[p].includes(hm);
        const w = p === "Jupiter" || p === "Saturn" ? 2 : 1;
        const areas = [...new Set([...KARAKA[p], ...areasOfHouse(hl)])];
        ev.push({ ms: t, sys: "Vedic", areas, score: good ? w : -w, kind: "ingress",
          title: `${p} moves into ${E.SIGNS[cur.sign[p]]}: the ${ord(hm)} sign from your Moon (${good ? "a supportive position" : "a harder position"}) and your ${ord(hl)} house (${HOUSE_PLAIN[hl]})` });
      }
      if (prev && t >= from && prev.retro[p] !== cur.retro[p] && STATION[p]) {
        const [areas, sc, txt] = STATION[p];
        ev.push({ ms: t, sys: "Vedic", areas, score: cur.retro[p] ? sc : -sc / 2, kind: "station", fixedText: true,
          title: cur.retro[p] ? `${p} turns retrograde: ${txt}` : `${p} goes direct again, and things in this area start moving forward` });
      }
    }
    if (t >= from && opt.daily !== false) {
      const hm = fromMoon(T.Moon.lon), tara = TARA_NAMES[((Math.floor(E.norm(T.Moon.lon) / (360 / 27)) - nak0 + 27) % 27) % 9];
      if (hm === 8 && (!prev || prev.moonH !== 8))
        ev.push({ ms: t, sys: "Vedic", areas: ["health", "career", "money", "love"], score: -0.8, kind: "careful", fixedText: true,
          title: "Careful days begin (the Moon passes the 8th sign from your birth Moon, about two days). Tradition advises postponing big decisions" });
      if (GOOD_FROM_MOON.Moon.includes(hm) && GOOD_TARA.includes(tara)) {
        const hl = E.wsHouse(T.Moon.lon, lag), areas = areasOfHouse(hl);
        ev.push({ ms: t, sys: "Vedic", areas: areas.length ? areas : ["friends"], score: 0.6, kind: "goodday", fixedText: true,
          title: `A favorable day (Moon in a good position from your birth Moon, ${tara} star), with the Moon in your ${ord(hl)} house: good for ${HOUSE_PLAIN[hl]}` });
      }
      cur.moonH = hm;
    }
    prev = cur;
  }
  // short dasha phases starting in range, and the current phase as background
  for (const md of dasha.mahadashas) for (const ad of md.antardashas) {
    if (ad.end < from || ad.start > to) continue;
    if (ad.start >= from && ad.start <= to) {
      const areas = areaLinks(chart, ad.lord);
      ev.push({ ms: ad.start, sys: "Vedic", areas: areas.length ? areas : KARAKA[ad.lord], score: areas.length ? 1.2 : -0.5, kind: "phase",
        title: `New ${md.lord}–${ad.lord} sub-period (until ${new Date(ad.end).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })})` });
    }
    for (const pd of E.pratyantar(md, ad)) {
      if (pd.start >= from && pd.start <= to) {
        const areas = areaLinks(chart, pd.lord);
        ev.push({ ms: pd.start, sys: "Vedic", areas: areas.length ? areas : KARAKA[pd.lord], score: areas.length ? 0.8 : -0.4, kind: "phase",
          title: `A short ${pd.lord} phase begins (about ${Math.max(1, Math.round((pd.end - pd.start) / DAY))} days)` });
      } else if (opt.background !== false && pd.start < from && pd.end > from) {
        const areas = areaLinks(chart, pd.lord);
        if (areas.length) ev.push({ ms: from, sys: "Vedic", areas, score: 0.4, kind: "background", title: `You're in a short ${pd.lord} phase, which your chart links to this area` });
      }
    }
  }
  if (opt.background !== false) {
    const T = E.planetsAt(from, "lahiri");
    for (const p of ["Jupiter", "Saturn"]) {
      if (!movers.includes(p)) continue;
      const hm = fromMoon(T[p].lon), good = GOOD_FROM_MOON[p].includes(hm), hl = E.wsHouse(T[p].lon, lag);
      ev.push({ ms: from, sys: "Vedic", areas: [...new Set([...KARAKA[p], ...areasOfHouse(hl)])], score: good ? 0.7 : -0.7, kind: "background",
        title: `${p} is in the ${ord(hm)} sign from your Moon, ${good ? "a supportive" : "a harder"} position` });
    }
  }
  return ev.sort((a, b) => a.ms - b.ms);
}
export function vedicMoonDay(chart, ms) {
  const v = chart.vedic, T = E.planetsAt(ms, "lahiri"), m0 = E.signIdx(v.planets.Moon.lon);
  const hm = ((E.signIdx(T.Moon.lon) - m0) % 12 + 12) % 12 + 1, hl = E.wsHouse(T.Moon.lon, v.lagna);
  const nak0 = Math.floor(E.norm(v.planets.Moon.lon) / (360 / 27));
  const tara = TARA_NAMES[((Math.floor(E.norm(T.Moon.lon) / (360 / 27)) - nak0 + 27) % 27) % 9];
  const ev = [], good = GOOD_FROM_MOON.Moon.includes(hm), tg = GOOD_TARA.includes(tara);
  const areas = areasOfHouse(hl);
  ev.push({ ms, sys: "Vedic", areas: areas.length ? areas : ["home"], score: (good ? 0.6 : -0.6) + (tg ? 0.4 : -0.4), kind: "moon", fixedText: true,
    title: `The Moon is in your ${ord(hl)} house (${HOUSE_PLAIN[hl]}) and the ${ord(hm)} sign from your birth Moon${good ? ", a good position" : ", a weaker position"}; today's star is ${tara}` });
  if (hm === 8) ev.push({ ms, sys: "Vedic", areas: ["health", "career", "money", "love"], score: -1, kind: "careful", fixedText: true, title: "A careful day: tradition advises postponing big decisions" });
  return ev;
}

// ------------------------------------------------------------ summarize
export function summarize(events, span, bgWeight = 1) {
  const out = {};
  events = events.map((e) => (e.kind === "background" && bgWeight !== 1 ? { ...e, score: e.score * bgWeight } : e));
  for (const [k, label] of AREAS6) {
    const list = events.filter((e) => e.areas.includes(k));
    const sum = list.reduce((s, e) => s + e.score, 0);
    const active = list.filter((e) => e.kind !== "background");
    const pos = list.reduce((s, e) => s + Math.max(0, e.score), 0), neg = -list.reduce((s, e) => s + Math.min(0, e.score), 0);
    const tone = !active.length && Math.abs(sum) < 1 ? "quiet"
      : sum >= 1.5 && pos >= 2.2 * neg ? "good" : sum <= -1 && neg >= 1.4 * pos ? "low" : "mixed";
    const items = list.filter((e) => e.kind !== "background" && e.kind !== "moon").map((e) => ({ ...e, text: e.fixedText ? `${e.title}.` : `${e.title}: ${meaning(k, e.score)}.` }));
    const bg = list.filter((e) => e.kind === "background" || e.kind === "moon").map((e) => ({ ...e, text: e.fixedText ? `${e.title}.` : `${e.title}: ${meaning(k, e.score)}.` }));
    out[k] = { key: k, label, tone, sum, items, bg, text: AREA_TEXT[k][tone].replaceAll("{span}", span).replaceAll("this day", "today") };
  }
  const total = Object.values(out).reduce((s, a) => s + a.sum, 0);
  const ranked = Object.values(out).filter((a) => a.tone !== "quiet").sort((a, b) => b.sum - a.sum);
  const vals = Object.values(out), g = vals.filter((a) => a.tone === "good").length, l = vals.filter((a) => a.tone === "low").length;
  const overall = g >= l + 3 && total > 2 ? "good" : l >= g + 2 ? "low" : "mixed";
  return { areas: out, overall, best: ranked[0] && ranked[0].sum > 0.5 ? ranked[0] : null, worst: ranked.length && ranked[ranked.length - 1].sum < -0.5 ? ranked[ranked.length - 1] : null };
}
