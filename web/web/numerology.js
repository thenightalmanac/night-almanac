// numerology.js: Pythagorean numerology (the system most used in the US and Europe).
export const MASTER = [11, 22, 33];
const digitSum = (n) => String(n).split("").reduce((s, d) => s + +d, 0);
export function reduce(n, keepMaster = true) {
  const steps = [n];
  while (n > 9 && !(keepMaster && MASTER.includes(n))) { n = digitSum(n); steps.push(n); }
  return { value: n, steps };
}
export const letterValue = (ch) => { const c = ch.toLowerCase().charCodeAt(0) - 97; return c >= 0 && c < 26 ? (c % 9) + 1 : 0; };
const plain = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "");
const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export function lifePath(y, m, d) {
  const rm = reduce(m), rd = reduce(d), ry = reduce(y);
  const total = rm.value + rd.value + ry.value, r = reduce(total);
  return { value: r.value, work: [`Month ${rm.steps.join(" → ")}`, `Day ${rd.steps.join(" → ")}`, `Year ${ry.steps.join(" → ")}`,
    `${rm.value} + ${rd.value} + ${ry.value} = ${r.steps.join(" → ")}`] };
}
function nameNumber(name, filter) {
  const letters = plain(name).split("").filter(filter);
  if (!letters.length) return null;
  const vals = letters.map(letterValue), sum = vals.reduce((a, b) => a + b, 0), r = reduce(sum);
  return { value: r.value, work: [`${letters.map((l, i) => `${l.toUpperCase()}=${vals[i]}`).join(" ")}`, `Total ${r.steps.join(" → ")}`] };
}
export const expression = (name) => nameNumber(name, () => true);
export const soulUrge = (name) => nameNumber(name, (l) => VOWELS.has(l.toLowerCase()));
export const personality = (name) => nameNumber(name, (l) => !VOWELS.has(l.toLowerCase()));
export function birthday(d) { const r = reduce(d); return { value: r.value, raw: d, work: [`Day of birth ${r.steps.join(" → ")}`] }; }
export function personalYear(m, d, year) {
  const rm = reduce(m, false).value, rd = reduce(d, false).value, ry = reduce(year, false).value, r = reduce(rm + rd + ry, false);
  return { value: r.value, work: [`Birth month ${rm} + birth day ${rd} + ${year} (${ry}) = ${r.steps.join(" → ")}`] };
}
export const personalMonth = (py, month) => reduce(py + month, false).value;
export const personalDay = (pm, day) => reduce(pm + reduce(day, false).value, false).value;

// What each number means, in practical terms
export const NUM = {
  1: { word: "The Leader", core: "independent, driven and original. You like to start things and do them your own way",
    strong: "initiative, courage, self-reliance", watch: "stubbornness, impatience, going it alone too much",
    love: "You need a partner who respects your independence and doesn't try to run the show.", work: "Best where you can lead, start things or work for yourself." },
  2: { word: "The Peacemaker", core: "sensitive, cooperative and diplomatic. You notice what others feel and bring people together",
    strong: "empathy, teamwork, patience, tact", watch: "people-pleasing, avoiding conflict, self-doubt",
    love: "Partnership matters deeply to you; you thrive with someone gentle and loyal.", work: "Best in supportive, team or one-on-one roles: counseling, HR, mediation, partnerships." },
  3: { word: "The Communicator", core: "expressive, social and creative. You light up a room and need an outlet for ideas",
    strong: "creativity, humor, charm, optimism", watch: "scattered energy, avoiding hard feelings, overspending",
    love: "You need fun, conversation and appreciation; boredom is the enemy.", work: "Best in creative or people-facing work: writing, design, performing, sales, social media." },
  4: { word: "The Builder", core: "practical, steady and hardworking. You make plans real and people rely on you",
    strong: "discipline, reliability, organization, loyalty", watch: "rigidity, overwork, resisting change",
    love: "You show love through commitment and actions, and want something stable.", work: "Best with clear structure: management, finance, building, operations, trades." },
  5: { word: "The Adventurer", core: "curious, restless and freedom-loving. You learn by trying new things",
    strong: "adaptability, energy, persuasion, courage to change", watch: "impulsiveness, restlessness, overindulgence",
    love: "You need excitement and space; a partner who travels and grows with you.", work: "Best in varied, fast-moving work: travel, sales, media, entrepreneurship." },
  6: { word: "The Nurturer", core: "caring, responsible and family-minded. You look after people and make places feel like home",
    strong: "devotion, generosity, sense of duty, eye for beauty", watch: "over-giving, worry, trying to fix everyone",
    love: "Loyal and devoted; you want a true home with someone, but need care in return.", work: "Best in caring or creative work: health, teaching, design, hospitality, family business." },
  7: { word: "The Seeker", core: "thoughtful, private and analytical. You look beneath the surface for deeper truths",
    strong: "insight, intuition, research, depth", watch: "isolation, overthinking, distrust",
    love: "You open up slowly and need a partner who respects your need for quiet time.", work: "Best in research, analysis, science, tech, writing or spiritual work." },
  8: { word: "The Achiever", core: "ambitious, capable and business-minded. You want results, success and security",
    strong: "leadership, money sense, determination, resilience", watch: "workaholism, control, measuring worth by success",
    love: "You want a strong, capable partner; remember to make time for the relationship.", work: "Best where you can build or run something: business, finance, law, management." },
  9: { word: "The Humanitarian", core: "compassionate, wise and big-hearted. You care about the wider world",
    strong: "generosity, idealism, creativity, broad understanding", watch: "martyrdom, trouble letting go, scattered focus",
    love: "Deeply loving, sometimes idealistic; learning to let go of the past is part of your path.", work: "Best in work that helps people or the world: nonprofits, healing, arts, teaching." },
  11: { word: "The Intuitive (master number)", core: "a heightened 2: highly sensitive, intuitive and inspiring, with big ideals",
    strong: "intuition, inspiration, spiritual insight", watch: "nervous tension, self-doubt, feeling overwhelmed",
    love: "You need a deep, soulful connection and a calm, steady partner.", work: "Best where you can inspire or guide: teaching, counseling, the arts, healing." },
  22: { word: "The Master Builder (master number)", core: "a heightened 4: practical vision on a big scale, able to build something lasting",
    strong: "vision plus practicality, leadership, discipline", watch: "pressure on yourself, rigidity, fear of falling short",
    love: "You want a partner who supports your big plans and shares your values.", work: "Best leading large projects or organizations that leave a legacy." },
  33: { word: "The Master Teacher (master number)", core: "a heightened 6: deeply caring and devoted to helping and teaching others",
    strong: "compassion, wisdom, selfless service", watch: "self-sacrifice, taking on too much",
    love: "Devoted and nurturing; make sure care flows both ways.", work: "Best in teaching, healing, counseling or caring roles." },
};
export const YEAR = {
  1: ["New beginnings", "A fresh 9-year cycle starts. A time to start new projects, take initiative and plant seeds."],
  2: ["Patience and partnership", "A slower year of cooperation and relationships. Let things grow; don't force them."],
  3: ["Expression and joy", "A social, creative year. Say yes to people, fun and creative projects."],
  4: ["Hard work and foundations", "A year to build, organize and put in steady effort. Results come from discipline."],
  5: ["Change and freedom", "A lively year of change, travel and new experiences. Expect the unexpected."],
  6: ["Home and responsibility", "A year focused on home, family, love and commitments."],
  7: ["Reflection and inner growth", "A quieter year for learning, rest and looking inward. Don't rush big moves."],
  8: ["Achievement and money", "A year of ambition, career and financial focus. Effort can pay off."],
  9: ["Completion and release", "The end of a cycle. A time to finish, let go and clear space for what comes next."],
};
