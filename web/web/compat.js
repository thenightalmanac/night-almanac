// compat.js: relationship compatibility.
// Western synastry (aspects between two charts, read by theme) and Vedic Ashtakoota (36-point matching).
// Rules and sources are in rulebook.md ("Compatibility").
import * as E from "./engine.js";

// ---------------------------------------------------------------- Western synastry
const PTS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
const ASPECTS = [["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180]];
const orbFor = (type, a, b) => {
  const lum = [a, b].some((x) => x === "Sun" || x === "Moon");
  return type === "sextile" ? (lum ? 4 : 3) : type === "conjunction" ? (lum ? 8 : 6) : (lum ? 7 : 5);
};
// Themes: which planet pairs each one looks at.
export const THEMES = [
  { id: "spark", love: "Attraction and romance", friend: "Fun and spark",
    pairs: [["Venus", "Mars"], ["Sun", "Venus"], ["Venus", "Venus"], ["Mars", "Mars"], ["Venus", "Rising"], ["Mars", "Rising"]],
    what: "how drawn you are to each other and how much fun you have" },
  { id: "heart", love: "Emotional bond", friend: "Emotional bond",
    pairs: [["Sun", "Moon"], ["Moon", "Moon"], ["Moon", "Venus"], ["Moon", "Rising"]],
    what: "whether you feel understood, safe and at home with each other" },
  { id: "talk", love: "Communication", friend: "Communication",
    pairs: [["Mercury", "Mercury"], ["Mercury", "Moon"], ["Sun", "Mercury"], ["Mercury", "Jupiter"], ["Mercury", "Venus"]],
    what: "how easily you talk, plan and solve problems together" },
  { id: "last", love: "Staying power", friend: "Staying power",
    pairs: [["Saturn", "Sun"], ["Saturn", "Moon"], ["Saturn", "Venus"], ["Jupiter", "Sun"], ["Jupiter", "Moon"], ["Jupiter", "Venus"], ["Sun", "Sun"]],
    what: "loyalty, commitment and whether the bond grows over the years" },
  { id: "friction", love: "Friction points", friend: "Friction points",
    pairs: [["Mars", "Sun"], ["Mars", "Moon"], ["Mars", "Saturn"], ["Saturn", "Mercury"], ["Mars", "Mercury"]],
    what: "where arguments and tension are most likely" },
];
const PAIR_TEXT = {
  "Venus-Mars": "physical chemistry and romantic attraction",
  "Sun-Venus": "affection and admiration",
  "Venus-Venus": "shared taste, values and what you enjoy",
  "Mars-Mars": "how your energies and drives mix",
  "Venus-Rising": "finding each other attractive at first sight",
  "Mars-Rising": "physical energy and drive between you",
  "Sun-Moon": "one of tradition's classic marriage signatures: one person's identity meets the other's emotional needs",
  "Moon-Moon": "emotional rhythms and what makes each of you feel safe",
  "Moon-Venus": "tenderness and caring for each other",
  "Moon-Rising": "feeling instantly comfortable together",
  "Mercury-Mercury": "the way you think and talk",
  "Mercury-Moon": "talking about feelings",
  "Sun-Mercury": "understanding each other's ideas",
  "Mercury-Jupiter": "encouraging each other's plans",
  "Mercury-Venus": "pleasant, affectionate conversation",
  "Saturn-Sun": "commitment, responsibility and who leads",
  "Saturn-Moon": "emotional security and restraint",
  "Saturn-Venus": "loyalty and long-term devotion",
  "Jupiter-Sun": "encouragement and generosity",
  "Jupiter-Moon": "warmth and kindness",
  "Jupiter-Venus": "joy, generosity and good times",
  "Sun-Sun": "your core selves and goals",
  "Mars-Sun": "who takes the lead and how you compete",
  "Mars-Moon": "how tempers and moods interact",
  "Mars-Saturn": "one person's drive meeting the other's caution",
  "Saturn-Mercury": "serious talks, advice and criticism",
  "Mars-Mercury": "debates and how fast words fly",
};
const pairKey = (a, b) => (PAIR_TEXT[`${a}-${b}`] ? `${a}-${b}` : `${b}-${a}`);
const easy = (t) => t === "trine" || t === "sextile";
const hard = (t) => t === "square" || t === "opposition";
// Score one contact for a theme: positive = supportive, negative = strained.
function contactScore(theme, a, b, type) {
  const malefic = [a, b].includes("Saturn") || ([a, b].includes("Mars") && theme !== "spark");
  if (theme === "friction") return easy(type) ? 1 : hard(type) || type === "conjunction" ? -2 : 0;
  if (theme === "spark" && (a === "Mars" || b === "Mars")) return easy(type) || type === "conjunction" ? 3 : 1; // tension can add spark
  if (malefic) return easy(type) ? 2 : type === "conjunction" ? 1 : -2;
  if ([a, b].includes("Jupiter")) return easy(type) || type === "conjunction" ? 2 : 0.5; // Jupiter's hard aspects: generous but excessive
  return easy(type) || type === "conjunction" ? 2 : -1;
}
export function synastry(cA, cB, aTimeOk, bTimeOk) {
  const pa = { ...Object.fromEntries(PTS.map((n) => [n, cA.western.planets[n].lon])) };
  const pb = { ...Object.fromEntries(PTS.map((n) => [n, cB.western.planets[n].lon])) };
  if (aTimeOk) pa.Rising = cA.western.asc;
  if (bTimeOk) pb.Rising = cB.western.asc;
  const contacts = [];
  for (const [na, la] of Object.entries(pa)) for (const [nb, lb] of Object.entries(pb)) {
    if (na === "Rising" && nb === "Rising") continue;
    const sep = Math.abs(E.angdiff(la, lb));
    for (const [type, ang] of ASPECTS) {
      const orb = Math.abs(sep - ang);
      if (orb <= orbFor(type, na, nb)) contacts.push({ a: na, b: nb, type, orb });
    }
  }
  const themes = THEMES.map((th) => {
    const found = contacts.filter((c) => th.pairs.some(([x, y]) => (c.a === x && c.b === y) || (c.a === y && c.b === x)))
      .map((c) => ({ ...c, score: contactScore(th.id, c.a, c.b, c.type), means: PAIR_TEXT[pairKey(c.a, c.b)] }))
      .sort((x, y) => x.orb - y.orb);
    const total = found.reduce((s, c) => s + c.score * (c.orb < 2 ? 1.5 : 1), 0);
    const tone = !found.length ? "quiet" : th.id === "friction"
      ? (total <= -3 ? "low" : total < 0 ? "mixed" : "good")
      : (total >= 3 ? "good" : total > -1 ? "mixed" : "low");
    return { ...th, found, total, tone };
  });
  // Element harmony of Sun and Moon signs
  const el = (lon) => ["fire", "earth", "air", "water"][E.signIdx(lon) % 4];
  const harmony = (x, y) => x === y ? "same" : ((x === "fire" && y === "air") || (x === "air" && y === "fire") || (x === "earth" && y === "water") || (x === "water" && y === "earth")) ? "complementary" : "different";
  return { contacts, themes, sun: harmony(el(pa.Sun), el(pb.Sun)), moon: harmony(el(pa.Moon), el(pb.Moon)), elements: { aSun: el(pa.Sun), bSun: el(pb.Sun), aMoon: el(pa.Moon), bMoon: el(pb.Moon) } };
}

// ---------------------------------------------------------------- Vedic Ashtakoota (Guna Milan)
const VARNA = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]; // by sign: 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra
const VARNA_NAME = { 4: "Brahmin", 3: "Kshatriya", 2: "Vaishya", 1: "Shudra" };
// Vashya: 0 Chatushpad (quadruped), 1 Dwipad (human), 2 Jalachar (water), 3 Vanachar (wild), 4 Keet (insect)
const VASHYA_NAME = ["Chatushpad (four-footed)", "Dwipad (human)", "Jalachar (water)", "Vanachar (wild)", "Keet (insect)"];
function vashyaOf(lon) {
  const s = E.signIdx(lon), half = (E.norm(lon) % 30) < 15 ? 0 : 1;
  return [0, 0, 1, 2, 3, 1, 1, 4, half ? 0 : 1, half ? 2 : 0, 1, 2][s];
}
const VASHYA_PTS = [ // rows bride, cols groom
  [2, 1, 1, 0.5, 1], [1, 2, 0.5, 0, 1], [1, 0.5, 2, 1, 1], [0, 0, 0, 2, 0], [1, 1, 1, 0, 2]];
// Yoni: animal by nakshatra; standard 14x14 table (symmetric).
const YONI_ANIMALS = ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"];
const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const YONI_PTS = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]];
// Natural planetary friendships (Parashara): F friend, N neutral, E enemy.
const REL = {
  Sun: { Moon: "F", Mars: "F", Jupiter: "F", Mercury: "N", Venus: "E", Saturn: "E" },
  Moon: { Sun: "F", Mercury: "F", Mars: "N", Jupiter: "N", Venus: "N", Saturn: "N" },
  Mars: { Sun: "F", Moon: "F", Jupiter: "F", Venus: "N", Saturn: "N", Mercury: "E" },
  Mercury: { Sun: "F", Venus: "F", Mars: "N", Jupiter: "N", Saturn: "N", Moon: "E" },
  Jupiter: { Sun: "F", Moon: "F", Mars: "F", Saturn: "N", Mercury: "E", Venus: "E" },
  Venus: { Mercury: "F", Saturn: "F", Mars: "N", Jupiter: "N", Sun: "E", Moon: "E" },
  Saturn: { Mercury: "F", Venus: "F", Jupiter: "N", Sun: "E", Moon: "E", Mars: "E" },
};
function maitriPts(a, b) {
  if (a === b) return 5;
  const r = [REL[a][b], REL[b][a]].sort().join("");
  return { FF: 5, FN: 4, NN: 3, EF: 1, EN: 0.5, EE: 0 }[r];
}
const GANA_OF = ["D", "M", "R", "M", "D", "M", "D", "D", "R", "R", "M", "M", "D", "R", "D", "R", "D", "R", "R", "M", "M", "D", "R", "R", "M", "M", "D"];
const GANA_NAME = { D: "Deva (gentle)", M: "Manushya (human)", R: "Rakshasa (fierce)" };
const GANA_PTS = { D: { D: 6, M: 5, R: 1 }, M: { D: 6, M: 6, R: 0 }, R: { D: 0, M: 0, R: 6 } }; // [bride][groom]
const NADI_OF = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];
const NADI_NAME = ["Adi", "Madhya", "Antya"];

function moonInfo(chart) {
  const lon = E.norm(chart.vedic.planets.Moon.lon), nak = Math.floor(lon / (360 / 27));
  return { lon, sign: E.signIdx(lon), nak, pada: Math.floor((lon % (360 / 27)) / (360 / 108)) + 1 };
}
// Ashtakoota with `bride` and `groom` charts (the tradition assigns roles).
export function ashtakoota(brideChart, groomChart) {
  const b = moonInfo(brideChart), g = moonInfo(groomChart);
  const out = [];
  // 1 Varna
  out.push({ name: "Varna", max: 1, pts: VARNA[g.sign] >= VARNA[b.sign] ? 1 : 0, about: "spiritual and working temperament",
    detail: `${VARNA_NAME[VARNA[b.sign]]} and ${VARNA_NAME[VARNA[g.sign]]}` });
  // 2 Vashya
  const vb = vashyaOf(b.lon), vg = vashyaOf(g.lon);
  out.push({ name: "Vashya", max: 2, pts: VASHYA_PTS[vb][vg], about: "mutual attraction and who influences whom", detail: `${VASHYA_NAME[vb]} and ${VASHYA_NAME[vg]}` });
  // 3 Tara
  const bad = (n) => [3, 5, 7].includes(n % 9);
  const c1 = ((g.nak - b.nak + 27) % 27) + 1, c2 = ((b.nak - g.nak + 27) % 27) + 1;
  const tb = [bad(c1), bad(c2)].filter(Boolean).length;
  out.push({ name: "Tara", max: 3, pts: tb === 0 ? 3 : tb === 1 ? 1.5 : 0, about: "luck and well-being together", detail: `counts of ${c1} and ${c2} between your birth stars` });
  // 4 Yoni
  const yb = YONI_OF[b.nak], yg = YONI_OF[g.nak];
  out.push({ name: "Yoni", max: 4, pts: YONI_PTS[yb][yg], about: "physical and intimate compatibility", detail: `${YONI_ANIMALS[yb]} and ${YONI_ANIMALS[yg]}` });
  // 5 Graha Maitri
  const lb = E.RULERS[b.sign], lg = E.RULERS[g.sign];
  out.push({ name: "Graha Maitri", max: 5, pts: maitriPts(lb, lg), about: "friendship and how your minds meet", detail: `Moon-sign lords ${lb} and ${lg}` });
  // 6 Gana
  const gb = GANA_OF[b.nak], gg = GANA_OF[g.nak];
  out.push({ name: "Gana", max: 6, pts: GANA_PTS[gb][gg], about: "temperament", detail: `${GANA_NAME[gb]} and ${GANA_NAME[gg]}` });
  // 7 Bhakoot
  const dist = ((g.sign - b.sign + 12) % 12) + 1, badB = [2, 12, 5, 9, 6, 8].includes(dist);
  const bhCancel = badB && (lb === lg || (REL[lb][lg] === "F" && REL[lg][lb] === "F"));
  out.push({ name: "Bhakoot", max: 7, pts: badB ? 0 : 7, about: "family welfare, finances and growth together",
    detail: `Moon signs ${E.SIGNS[b.sign]} and ${E.SIGNS[g.sign]} (${dist}/${14 - dist === 13 ? 1 : 14 - dist})`, dosha: badB ? "Bhakoot dosha" : null, cancelled: bhCancel });
  // 8 Nadi
  const nb = NADI_OF[b.nak], ng = NADI_OF[g.nak], sameN = nb === ng;
  const nCancel = sameN && ((b.sign === g.sign && b.nak !== g.nak) || (b.nak === g.nak && b.pada !== g.pada) || (b.nak === g.nak && b.sign !== g.sign));
  out.push({ name: "Nadi", max: 8, pts: sameN ? 0 : 8, about: "health and children (the most heavily weighted koota)",
    detail: `${NADI_NAME[nb]} and ${NADI_NAME[ng]} nadi`, dosha: sameN ? "Nadi dosha" : null, cancelled: nCancel });
  const total = out.reduce((s, k) => s + k.pts, 0);
  return { kootas: out, total, bride: b, groom: g };
}
export function gunaVerdict(total) {
  if (total >= 33) return ["good", "Excellent", "Tradition rates this an excellent match."];
  if (total >= 25) return ["good", "Very good", "Tradition rates this a very good match."];
  if (total >= 18) return ["mixed", "Acceptable", "Tradition accepts this match; 18 is the usual minimum."];
  return ["low", "Below the traditional minimum", "Traditional matchmakers usually look for at least 18 points. Many still approve lower scores when the full charts agree."];
}
