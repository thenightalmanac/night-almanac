// lore.js: "Star lore" (esoteric techniques). Calculations + plain-language text.
// Sources are noted in rulebook.md ("Star lore" section).
import * as E from "./engine.js";

const DAY = 86400000;
const norm = E.norm;

// ---------------------------------------------------------------- Planetary hours (Western) / Horas (Vedic)
export const CHALDEAN = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
export const WEEKDAY_LORD = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // Sunday = 0
export const WEEKDAY_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Weekday of a local calendar date (independent of the device's time zone).
export const weekdayOf = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

// 24 unequal hours: 12 from sunrise to sunset, 12 from sunset to next sunrise.
export function planetaryHours(frame, weekday) {
  const out = [], dayLen = (frame.set - frame.rise) / 12, nightLen = (frame.next - frame.set) / 12;
  let i = CHALDEAN.indexOf(WEEKDAY_LORD[weekday]);
  for (let h = 0; h < 24; h++) {
    const isDay = h < 12, start = isDay ? frame.rise + h * dayLen : frame.set + (h - 12) * nightLen;
    out.push({ n: h + 1, planet: CHALDEAN[i % 7], start, end: start + (isDay ? dayLen : nightLen), isDay });
    i++;
  }
  return out;
}
// What each planet's hour is traditionally used for. tone: good / mixed / low (tradition's rating).
export const HOUR = {
  Sun: { tone: "mixed", good: "asking for favors from bosses or officials, being seen, leadership, starting things you want to shine", avoid: "arguing with authority; tradition calls it too proud for humble requests",
    why: "The Sun is a mixed planet in tradition: it brings visibility and honor, but its heat can burn." },
  Moon: { tone: "mixed", good: "home, family, food, short trips, anything involving the public or women, routine errands", avoid: "commitments you need to last; the Moon changes fast",
    why: "The Moon is gentle but changeable, so her hour suits everyday and emotional matters." },
  Mercury: { tone: "mixed", good: "writing, studying, emails, contracts, buying and selling, learning something new", avoid: "matters where you need to be blunt; Mercury takes on the color of whatever it's near",
    why: "Mercury is neutral in tradition: clever and quick, good or bad depending on use." },
  Venus: { tone: "good", good: "love, dates, friendship, art, beauty, shopping, making peace, parties", avoid: "hard negotiations and confrontations",
    why: "Venus is the 'lesser benefic': tradition says her hour sweetens whatever you begin in it." },
  Mars: { tone: "low", good: "exercise, physical work, courage, cutting things off, competition", avoid: "starting partnerships, signing agreements, and arguments; tempers run high",
    why: "Mars is the 'lesser malefic': energetic but sharp, so tradition saves his hour for effort, not diplomacy." },
  Jupiter: { tone: "good", good: "money matters, asking for help, legal and religious matters, learning, generosity, big plans", avoid: "very little; tradition rates this the best hour of the day",
    why: "Jupiter is the 'greater benefic': tradition says his hour favors growth, fairness and good fortune." },
  Saturn: { tone: "low", good: "long-term planning, discipline, cleaning, finishing old business, property and building", avoid: "starting anything new or joyful, travel, asking favors",
    why: "Saturn is the 'greater malefic': slow and heavy, so tradition uses his hour for endings and hard work." },
};

// ---------------------------------------------------------------- Vedic day: Rahu Kaal, Abhijit
// Daytime (sunrise to sunset) is split into 8 parts. Rahu Kaal is one part, fixed by weekday.
const RAHU_PART = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat
export function rahuKaal(frame, weekday) {
  const part = (frame.set - frame.rise) / 8, k = RAHU_PART[weekday] - 1;
  return { start: frame.rise + k * part, end: frame.rise + (k + 1) * part };
}
// Abhijit muhurta: the 8th of 15 daytime muhurtas (around local noon). Tradition skips it on Wednesdays.
export function abhijit(frame, weekday) {
  const m = (frame.set - frame.rise) / 15;
  return { start: frame.rise + 7 * m, end: frame.rise + 8 * m, wednesday: weekday === 3 };
}

// ---------------------------------------------------------------- Panchanga (five limbs of the day)
export const TITHI_NAMES = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami",
  "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"];
// Tithi groups (Nanda, Bhadra, Jaya, Rikta, Purna) and their traditional use.
const TITHI_GROUP = [
  ["Nanda (joyful)", "good", "celebrations, the arts, starting pleasant things"],
  ["Bhadra (auspicious)", "good", "steady work, buying things, starting projects"],
  ["Jaya (victorious)", "good", "competition, legal matters, getting things done"],
  ["Rikta (empty)", "low", "clearing out, ending things, cleaning; tradition avoids new starts"],
  ["Purna (full)", "good", "completing things, important beginnings, ceremonies"],
];
export function tithiAt(ms) {
  const el = norm(E.lonAt(ms, "Moon") - E.lonAt(ms, "Sun")); // same in either zodiac
  const i = Math.floor(el / 12); // 0..29
  const paksha = i < 15 ? "Shukla (waxing)" : "Krishna (waning)";
  const name = i === 14 ? "Purnima (full moon)" : i === 29 ? "Amavasya (new moon)" : TITHI_NAMES[i % 15];
  const grp = TITHI_GROUP[i % 5];
  let tone = grp[1], note = grp[2];
  if (i === 29) { tone = "low"; note = "rest, remembering ancestors and quiet reflection; tradition avoids new starts at the dark moon"; }
  let group = grp[0];
  if (i === 29) group = "Amavasya";
  if (i % 15 === 7 || i % 15 === 13) { tone = "low"; group = i % 15 === 7 ? "Ashtami (the 8th)" : "Chaturdashi (the 14th)";
    note = "spiritual practice, fasting and finishing things; tradition treats the 8th and 14th lunar days as sensitive and avoids new starts"; }
  return { i, name, paksha, group, tone, note };
}
export const YOGA_NAMES = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda",
  "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
  "Shukla", "Brahma", "Indra", "Vaidhriti"];
const YOGA_MEANS = ["obstacle", "affection", "long life", "good fortune", "splendor", "great danger", "good deeds", "steadiness", "spear (pain)",
  "knot (trouble)", "growth", "fixed and stable", "striking (setbacks)", "delight", "thunderbolt", "success", "calamity", "comfort", "iron bar (blockage)",
  "auspicious", "accomplished", "achievable", "auspicious", "bright", "wisdom", "power", "division"];
const BAD_YOGAS = new Set([0, 5, 8, 9, 12, 14, 16, 18, 26]);
export function yogaAt(ms) {
  const i = Math.floor(norm(E.lonAt(ms, "Sun", true) + E.lonAt(ms, "Moon", true)) / (360 / 27));
  return { i, name: YOGA_NAMES[i], means: YOGA_MEANS[i], tone: BAD_YOGAS.has(i) ? "low" : "good" };
}
const MOVABLE_KARANA = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)"];
export function karanaAt(ms) {
  const k = Math.floor(norm(E.lonAt(ms, "Moon") - E.lonAt(ms, "Sun")) / 6); // 0..59
  const name = k === 0 ? "Kimstughna" : k === 57 ? "Shakuni" : k === 58 ? "Chatushpada" : k === 59 ? "Naga" : MOVABLE_KARANA[(k - 1) % 7];
  const vishti = k > 0 && k < 57 && (k - 1) % 7 === 6;
  return { k, name, tone: vishti ? "low" : k >= 57 ? "mixed" : "good",
    note: vishti ? "Vishti (Bhadra) is the one half-day tradition avoids for new starts" : k >= 57 || k === 0 ? "a fixed karana near the new moon; tradition treats it as mixed" : "an ordinary, usable half-day" };
}
export function nakshatraAt(ms) { const i = Math.floor(E.lonAt(ms, "Moon", true) / (360 / 27)); return i; }

// Nakshatra "nature" (Muhurta tradition): what kind of activity each star suits.
export const NAK_NATURE = {
  fixed: ["Fixed (Dhruva)", "good", "lasting things: moving into a home, planting, foundations, long-term commitments"],
  movable: ["Movable (Chara)", "good", "travel, buying a vehicle, changes, anything meant to move"],
  fierce: ["Fierce (Ugra)", "low", "bold or harsh actions, confronting problems; tradition avoids gentle beginnings"],
  mixed: ["Mixed (Mishra)", "mixed", "routine daily work and practical tasks"],
  light: ["Light and swift (Kshipra)", "good", "quick tasks, trade, healing, learning, short trips"],
  soft: ["Soft (Mridu)", "good", "friendship, love, art, music, new clothes, celebrations"],
  sharp: ["Sharp (Tikshna)", "low", "ending things, separation, intense or difficult tasks; tradition avoids new starts"],
};

// The 27 nakshatras: deity, symbol, power (shakti), temperament (gana), nature, plain-language reading.
export const NAK = [
  { deity: "the Ashvins, twin horsemen and healers of the gods", symbol: "a horse's head", shakti: "the power to reach things quickly", gana: "Deva", nature: "light",
    read: "Quick, eager and pioneering, with a gift for helping and healing. You like to get things moving, sometimes before you've thought them through." },
  { deity: "Yama, lord of death and of moral law", symbol: "the womb", shakti: "the power to carry things away", gana: "Manushya", nature: "fierce",
    read: "Intense and capable of carrying heavy loads. Life brings big transformations, and you're meant to handle beginnings and endings with honesty." },
  { deity: "Agni, the god of fire", symbol: "a razor or a flame", shakti: "the power to burn and purify", gana: "Rakshasa", nature: "mixed",
    read: "Sharp, direct and protective. You cut through nonsense and can be a fierce defender, but your words can burn when you're upset." },
  { deity: "Brahma (Prajapati), the creator", symbol: "an ox cart", shakti: "the power to make things grow", gana: "Manushya", nature: "fixed",
    read: "Warm, attractive and fond of beauty and comfort. Things grow around you, though tradition warns about wanting more than enough." },
  { deity: "Soma, the Moon god", symbol: "a deer's head", shakti: "the power to give fulfillment", gana: "Deva", nature: "soft",
    read: "Curious, gentle and searching. You're always looking for the next good thing, which makes you a lifelong learner and sometimes restless." },
  { deity: "Rudra, the storm god", symbol: "a teardrop", shakti: "the power of effort", gana: "Manushya", nature: "sharp",
    read: "Emotional depth and a sharp mind. Storms come through your life, but they clear the air and leave you wiser." },
  { deity: "Aditi, mother of the gods", symbol: "a quiver of arrows", shakti: "the power to regain what was lost", gana: "Deva", nature: "movable",
    read: "Hopeful and resilient. Whatever falls apart for you tends to come back better; your theme is returning and renewal." },
  { deity: "Brihaspati, teacher of the gods", symbol: "a cow's udder or a flower", shakti: "the power to create spiritual energy", gana: "Deva", nature: "light",
    read: "Nourishing, protective and principled. Tradition counts this among the best nakshatras: you feed and support the people around you." },
  { deity: "the Nagas, serpent spirits", symbol: "a coiled serpent", shakti: "the power to inflict poison", gana: "Rakshasa", nature: "sharp",
    read: "Perceptive, persuasive and private. You read people well; tradition warns against using that insight to control others." },
  { deity: "the Pitris, the ancestors", symbol: "a royal throne", shakti: "the power to leave the body", gana: "Rakshasa", nature: "fierce",
    read: "Dignified, proud and loyal to family and tradition. You carry a sense of legacy and want respect for where you come from." },
  { deity: "Bhaga, god of good fortune and pleasure", symbol: "the front legs of a bed", shakti: "the power of procreation", gana: "Manushya", nature: "fierce",
    read: "Charming, creative and fond of rest and pleasure. Love, art and enjoyment matter to you; tradition advises against overindulging." },
  { deity: "Aryaman, god of contracts and friendship", symbol: "the back legs of a bed", shakti: "the power of prosperity through union", gana: "Manushya", nature: "fixed",
    read: "Reliable, generous and loyal in partnership. You do well in lasting commitments and are a good friend to have." },
  { deity: "Savitar, the Sun as giver of life", symbol: "an open hand", shakti: "the power to put what you seek in your hands", gana: "Deva", nature: "light",
    read: "Skillful, clever and good with your hands. You make things happen in practical ways and have a light, witty touch." },
  { deity: "Tvashtar, the divine craftsman", symbol: "a bright jewel", shakti: "the power to accumulate merit", gana: "Rakshasa", nature: "soft",
    read: "Stylish, artistic and drawn to beautiful design. You like to create things that shine, including your own image." },
  { deity: "Vayu, the wind god", symbol: "a young shoot blowing in the wind", shakti: "the power to scatter like the wind", gana: "Deva", nature: "movable",
    read: "Independent, flexible and fond of freedom. You bend without breaking and do well in trade, travel and anything self-made." },
  { deity: "Indra and Agni, gods of power and fire", symbol: "a triumphal arch", shakti: "the power to achieve many fruits", gana: "Rakshasa", nature: "mixed",
    read: "Goal-driven and determined. You go after what you want with focus; patience is the lesson, because results come in time." },
  { deity: "Mitra, god of friendship", symbol: "a lotus", shakti: "the power of devotion", gana: "Deva", nature: "soft",
    read: "Devoted, warm and good at friendship and teamwork. You can make a home anywhere and keep people together." },
  { deity: "Indra, king of the gods", symbol: "a round amulet or earring", shakti: "the power to rise and conquer", gana: "Rakshasa", nature: "sharp",
    read: "Protective, responsible and often the eldest in spirit. You take charge, though you may feel you have to prove yourself." },
  { deity: "Nirriti, goddess of dissolution", symbol: "a bunch of roots", shakti: "the power to break things apart", gana: "Rakshasa", nature: "sharp",
    read: "Searching for the root of things. Life may uproot you more than once, which makes you a deep thinker and a fearless investigator." },
  { deity: "Apas, the waters", symbol: "a winnowing fan", shakti: "the power to invigorate", gana: "Manushya", nature: "fierce",
    read: "Confident, persuasive and hard to defeat. You hold to your beliefs and can inspire others; tradition warns about stubbornness." },
  { deity: "the Vishvadevas, the universal gods", symbol: "an elephant's tusk", shakti: "the power of unchallengeable victory", gana: "Manushya", nature: "fixed",
    read: "Ethical, steady and built for lasting success. Wins come later but stay won; your word is your strength." },
  { deity: "Vishnu, the preserver", symbol: "an ear (or three footprints)", shakti: "the power of connection", gana: "Deva", nature: "movable",
    read: "A good listener and a lifelong learner. You gain through study, teaching and paying attention to what others miss." },
  { deity: "the eight Vasus, gods of abundance", symbol: "a drum", shakti: "the power to give abundance and fame", gana: "Rakshasa", nature: "movable",
    read: "Musical, generous and good at bringing people together. Wealth and recognition are part of your story." },
  { deity: "Varuna, god of the cosmic waters", symbol: "an empty circle", shakti: "the power of healing", gana: "Rakshasa", nature: "movable",
    read: "Independent, private and drawn to healing, science or hidden knowledge. You may need solitude to recharge." },
  { deity: "Aja Ekapada, the one-footed goat (a fiery form of Rudra)", symbol: "the front legs of a funeral cot", shakti: "the power to raise a person up spiritually", gana: "Manushya", nature: "fierce",
    read: "Idealistic and intense, with two sides: worldly and spiritual. You can transform yourself and others through passion and conviction." },
  { deity: "Ahir Budhnya, the serpent of the deep", symbol: "the back legs of a funeral cot", shakti: "the power to bring rain", gana: "Manushya", nature: "fixed",
    read: "Wise, calm and self-controlled. You work quietly in the background and are known for depth and good judgment." },
  { deity: "Pushan, the nourisher and protector of travelers", symbol: "a fish", shakti: "the power of nourishment", gana: "Deva", nature: "soft",
    read: "Kind, gentle and protective, especially of the vulnerable. Tradition sees you as a guide who helps others find their way." },
];
export const GANA_TEXT = {
  Deva: "Deva (divine): gentle, idealistic and kind by temperament.",
  Manushya: "Manushya (human): practical and balanced, with a mix of ambition and kindness.",
  Rakshasa: "Rakshasa (fierce): strong-willed and intense; protective and hard to push around.",
};

// ---------------------------------------------------------------- Void-of-course Moon (Western, traditional planets)
const VOC_PLANETS = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
const VOC_ASPECTS = [0, 60, 90, 120, 180];
// Returns { inSign, entry, exit, lastAspect: {planet, aspect, ms}|null, voidFrom, isVoid }
export function voidOfCourse(ms) {
  const sign = (t) => Math.floor(E.lonAt(t, "Moon") / 30);
  const exit = E.nextChange(sign, ms, 2 * 3600000, 4 * DAY);
  const entry = E.prevChange(sign, ms, 2 * 3600000, 4 * DAY);
  if (!exit || !entry) return null;
  // Scan the Moon's whole stay in this sign for exact aspects; keep the last one.
  let last = null;
  const step = 3600000;
  for (const p of VOC_PLANETS) {
    const lonP = (t) => E.lonAt(t, p);
    for (const a of VOC_ASPECTS) for (const side of a === 0 || a === 180 ? [1] : [1, -1]) {
      const f = (t) => E.angdiff(E.lonAt(t, "Moon") - lonP(t), side * a);
      let t0 = entry, f0 = f(t0);
      for (let t = entry + step; t <= exit + 1; t += step) {
        const t1 = Math.min(t, exit), f1 = f(t1);
        if (f0 <= 0 && f1 > 0 && f1 - f0 < 30) {
          let lo = t0, hi = t1;
          for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (f(mid) <= 0) lo = mid; else hi = mid; }
          if (!last || hi > last.ms) last = { planet: p, aspect: a, ms: hi };
        }
        t0 = t1; f0 = f1;
      }
    }
  }
  const voidFrom = last ? last.ms : entry;
  return { sign: E.SIGNS[sign(ms)], entry, exit, lastAspect: last, voidFrom, isVoid: ms >= voidFrom && ms < exit };
}
export const ASPECT_NAME = { 0: "conjunction", 60: "sextile", 90: "square", 120: "trine", 180: "opposition" };

// ---------------------------------------------------------------- Decans (faces) and tarot
const FACE_SEQ = ["Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter"]; // Chaldean order starting from Aries I
const SUIT = { fire: "Wands", earth: "Pentacles", air: "Swords", water: "Cups" };
const EL = ["fire", "earth", "air", "water"];
// Golden Dawn titles (Book T, 1890s) and a plain reading.
const CARD = {
  "2 of Wands": ["Dominion", "Ambition and the first taste of control. You plan big and want the world in your hands."],
  "3 of Wands": ["Established Strength", "Early success and confidence. Your efforts set sail and start to bring results."],
  "4 of Wands": ["Perfected Work", "Celebration and a stable home base. Things you've built feel complete and joyful."],
  "5 of Pentacles": ["Material Trouble", "Worry about security. The lesson is to ask for help and not go it alone."],
  "6 of Pentacles": ["Material Success", "Generosity and fair exchange. What you give comes back to you."],
  "7 of Pentacles": ["Success Unfulfilled", "Patience while things grow. Results come slower than you'd like; keep tending them."],
  "8 of Swords": ["Shortened Force", "Feeling boxed in by your own thoughts. The way out is usually simpler than it looks."],
  "9 of Swords": ["Despair and Cruelty", "Worry that keeps you up at night. Tradition's lesson: fears shrink when spoken aloud."],
  "10 of Swords": ["Ruin", "An ending that clears the way. When something is truly over, a fresh start follows."],
  "2 of Cups": ["Love", "Partnership, attraction and mutual respect. Bonds of the heart are central for you."],
  "3 of Cups": ["Abundance", "Friendship, celebration and shared joy. You thrive in good company."],
  "4 of Cups": ["Blended Pleasure", "Restlessness even when things are fine. Notice the good that's already offered."],
  "5 of Wands": ["Strife", "Competition and friction. Healthy rivalry sharpens you; pointless fights drain you."],
  "6 of Wands": ["Victory", "Recognition and public success. You're meant to be seen winning."],
  "7 of Wands": ["Valour", "Standing your ground against the odds. Courage under pressure is your strength."],
  "8 of Pentacles": ["Prudence", "Craft, practice and skill. Mastery comes from patient, careful work."],
  "9 of Pentacles": ["Material Gain", "Independence, comfort and earned luxury. You enjoy what you've built yourself."],
  "10 of Pentacles": ["Wealth", "Family, legacy and lasting security. You think in terms of generations."],
  "2 of Swords": ["Peace Restored", "Balance after conflict. You weigh things carefully; the risk is putting off a decision."],
  "3 of Swords": ["Sorrow", "Heartache that teaches. Tradition sees this as grief that leads to clarity."],
  "4 of Swords": ["Rest from Strife", "Recovery and retreat. Rest is not weakness; it's how you regain your strength."],
  "5 of Cups": ["Loss in Pleasure", "Focusing on what was lost. Turning around shows what's still standing."],
  "6 of Cups": ["Pleasure", "Nostalgia, sweetness and innocence. Old bonds and memories nourish you."],
  "7 of Cups": ["Illusory Success", "Many tempting options. Choose with clear eyes; not every dream is real."],
  "8 of Wands": ["Swiftness", "Speed, news and momentum. Things move fast once they start."],
  "9 of Wands": ["Great Strength", "Resilience and endurance. You've been tested and you're still standing."],
  "10 of Wands": ["Oppression", "Carrying too much. Success comes when you set down what isn't yours."],
  "2 of Pentacles": ["Harmonious Change", "Juggling and adapting. You stay steady by staying flexible."],
  "3 of Pentacles": ["Material Works", "Teamwork and craft. You build best alongside skilled people."],
  "4 of Pentacles": ["Earthly Power", "Security and control. Holding on keeps you safe; holding too tight keeps you stuck."],
  "5 of Swords": ["Defeat", "Conflict where winning costs too much. Choose which battles are worth it."],
  "6 of Swords": ["Earned Success", "Moving toward calmer waters. Progress comes through clear thinking."],
  "7 of Swords": ["Unstable Effort", "Strategy, cunning and going your own way. Be wary of half-measures and shortcuts."],
  "8 of Cups": ["Abandoned Success", "Walking away from what no longer fulfills you to look for something deeper."],
  "9 of Cups": ["Material Happiness", "Contentment and wishes fulfilled. Tradition calls this the 'wish card'."],
  "10 of Cups": ["Perfected Success", "Lasting happiness, family and emotional fulfillment."],
};
export function decanOf(lon) {
  lon = norm(lon);
  const s = Math.floor(lon / 30), dec = Math.floor((lon % 30) / 10), idx = s * 3 + dec;
  const element = EL[s % 4], mode = s % 3; // 0 cardinal, 1 fixed, 2 mutable
  const card = `${2 + mode * 3 + dec} of ${SUIT[element]}`;
  const [title, read] = CARD[card];
  return { sign: E.SIGNS[s], decan: dec + 1, from: dec * 10, to: dec * 10 + 10, ruler: FACE_SEQ[idx % 7], card, title, read };
}
// Vedic drekkana (Parashara): 1st third = same sign, 2nd = 5th sign from it, 3rd = 9th.
export function drekkanaOf(lon) {
  lon = norm(lon);
  const s = Math.floor(lon / 30), dec = Math.floor((lon % 30) / 10), d = (s + dec * 4) % 12;
  return { sign: E.SIGNS[s], decan: dec + 1, dSign: E.SIGNS[d], lord: E.RULERS[d] };
}

// ---------------------------------------------------------------- Fixed stars
// Tropical longitude for 2020.0; precession of 50.29" a year is added for other dates.
// Natures from Ptolemy (Tetrabiblos I.9) with Agrippa's in brackets where different.
export const STARS = [
  { name: "Algol", lon: 56.433, nature: "Saturn and Jupiter", tone: "low", behenian: true,
    read: "Tradition's most feared star, linked with intense, all-or-nothing situations and losing one's head. Modern readers also see fierce, protective feminine power. The advice is to channel strong emotions instead of letting them run you." },
  { name: "Alcyone (the Pleiades)", lon: 60.267, nature: "Moon and Mars", tone: "mixed", behenian: true,
    read: "The Seven Sisters: sensitivity, vision and a mystical streak. Tradition ties it to tears as well as insight, so it often shows a life where feelings run deep." },
  { name: "Aldebaran", lon: 70.067, nature: "Mars", tone: "good", royal: true, behenian: true,
    read: "One of the four Royal Stars, the 'Watcher of the East'. It promises honor, courage and success, on one condition from tradition: keep your integrity, or the gains don't last." },
  { name: "Capella", lon: 82.133, nature: "Mars and Mercury [Jupiter and Saturn]", tone: "good", behenian: true,
    read: "Curiosity, love of learning and respect from others. Tradition links it with honor and civic or public positions." },
  { name: "Sirius", lon: 104.35, nature: "Jupiter and Mars [Venus]", tone: "good", behenian: true,
    read: "The brightest star in the sky: fame, devotion and passion. It can bring great honor and a burning, sometimes exhausting intensity." },
  { name: "Procyon", lon: 116.05, nature: "Mercury and Mars", tone: "mixed", behenian: true,
    read: "Quick wit and sudden opportunity. Tradition's warning is 'quick rise, quick fall', so build steadily on lucky breaks." },
  { name: "Regulus", lon: 150.1, nature: "Mars and Jupiter", tone: "good", royal: true, behenian: true,
    read: "The 'Heart of the Lion' and a Royal Star: leadership, success and recognition. Tradition's condition: success is lost through revenge, so let grudges go." },
  { name: "Alkaid (Benetnash)", lon: 177.2, nature: "Mars [Venus and Moon]", tone: "mixed", behenian: true,
    read: "The tip of the Great Bear's tail. Tradition links it with mourning, but also with leadership and taking care of others in hard times." },
  { name: "Algorab", lon: 193.717, nature: "Mars and Saturn", tone: "low", behenian: true,
    read: "The Crow. Tradition warns of scheming and rash, destructive moves. The lesson is to stay honest and not get pulled into others' games." },
  { name: "Spica", lon: 204.1, nature: "Venus and Mars [Venus and Mercury]", tone: "good", behenian: true,
    read: "The ear of wheat held by the Virgin: one of the most fortunate stars. It brings talent, gifts, protection and success, often in the arts or sciences." },
  { name: "Arcturus", lon: 204.5, nature: "Mars and Jupiter", tone: "good", behenian: true,
    read: "The 'Guardian of the Bear': prosperity through your own effort and a gift for finding new paths. Success often comes from going your own way." },
  { name: "Alphecca", lon: 222.567, nature: "Venus and Mercury", tone: "good", behenian: true,
    read: "The jewel in the Northern Crown: honor, artistic talent and love. Tradition sees grace and dignity, sometimes after early hardship." },
  { name: "Antares", lon: 250.017, nature: "Mars and Jupiter", tone: "mixed", royal: true, behenian: true,
    read: "The 'Heart of the Scorpion' and a Royal Star: courage, intensity and the drive to win. Tradition's condition: avoid rashness and obsession." },
  { name: "Vega", lon: 285.567, nature: "Venus and Mercury", tone: "good", behenian: true,
    read: "The bright star of the Lyre: charisma, music, art and a hopeful spirit. Tradition adds that fortune it brings can be fleeting, so enjoy it wisely." },
  { name: "Deneb Algedi", lon: 323.8, nature: "Saturn and Jupiter", tone: "mixed", behenian: true,
    read: "The tail of the Sea-Goat: justice, law and responsibility. Tradition says it brings both sorrow and gain, depending on how fairly you act." },
  { name: "Fomalhaut", lon: 334.133, nature: "Venus and Mercury", tone: "mixed", royal: true,
    read: "The fourth Royal Star: idealism, imagination and fame through a vision. Tradition's condition: stay true to your ideals, or success slips away." },
];
export const starLon = (st, ms) => norm(st.lon + ((ms / (365.2425 * DAY) + 1970 - 2020) * 50.29) / 3600);
// Stars within `orb` degrees (by longitude) of the given points.
export function starContacts(points, ms, orb = 1) {
  const out = [];
  for (const st of STARS) {
    const sl = starLon(st, ms);
    for (const [who, lon] of points) {
      const d = Math.abs(E.angdiff(lon, sl));
      if (d <= orb) out.push({ star: st, who, orb: d, starLon: sl });
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}

// ---------------------------------------------------------------- More lots
// Computed on the Western (tropical) chart, whole-sign houses. Formulas in rulebook.md.
export function moreLots(chart) {
  const P = Object.fromEntries(Object.entries(chart.western.planets).map(([k, v]) => [k, v.lon]));
  const asc = chart.western.asc, day = chart.western.sect === "day";
  const L = (x, y, rev = true) => norm(day || !rev ? asc + x - y : asc + y - x);
  const saturnBeams = Math.abs(E.angdiff(P.Saturn, P.Sun)) < 15;
  const lots = {
    Father: saturnBeams ? L(P.Jupiter, P.Mars) : L(P.Saturn, P.Sun),
    Mother: L(P.Moon, P.Venus),
    Siblings: L(P.Jupiter, P.Saturn),
    Children: L(P.Saturn, P.Jupiter, false),
    "Marriage (women's version)": L(P.Saturn, P.Venus, false),
    "Marriage (men's version)": L(P.Venus, P.Saturn, false),
    Exaltation: day ? norm(asc + 19 - P.Sun) : norm(asc + 33 - P.Moon),
  };
  const out = {};
  for (const [k, v] of Object.entries(lots)) out[k] = { lon: v, sign: E.SIGNS[E.signIdx(v)], house: E.wsHouse(v, asc), lord: E.RULERS[E.signIdx(v)] };
  out._saturnBeams = saturnBeams;
  return out;
}
// Places tradition calls "hidden" or difficult (Hellenistic "bad places").
export const HARD_PLACES = [6, 8, 12];
export const MORE_LOT_TEXT = {
  Father: "your father, or the father figure in your life, and what you inherit from him",
  Mother: "your mother, or the mother figure in your life, and how you were nurtured",
  Siblings: "brothers, sisters and close peers",
  Children: "children: having them, raising them, and creative 'offspring'",
  "Marriage (women's version)": "marriage and committed partnership",
  "Marriage (men's version)": "marriage and committed partnership",
  Exaltation: "where you can rise highest in life: honors, status and your peak",
};

// ---------------------------------------------------------------- Hour and day of birth
export function birthHour(chart) {
  const b = chart.birth;
  let [y, m, d] = [b.y, b.m, b.d];
  let frame = E.sunFrame(y, m, d, b.lat, b.lon, b.tz);
  if (chart.utc < frame.rise) { const p = new Date(Date.UTC(y, m - 1, d) - DAY); [y, m, d] = [p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate()];
    frame = E.sunFrame(y, m, d, b.lat, b.lon, b.tz); }
  const wd = weekdayOf(y, m, d), hrs = planetaryHours(frame, wd);
  const h = hrs.find((x) => chart.utc >= x.start && chart.utc < x.end) || hrs[0];
  return { weekday: wd, dayLord: WEEKDAY_LORD[wd], hour: h.planet, n: h.isDay ? h.n : h.n - 12, isDay: h.isDay, approx: frame.approx };
}
export const BORN_HOUR = {
  Sun: "a natural sense of dignity and a wish to be seen and respected",
  Moon: "sensitivity, intuition and a strong bond with home and family",
  Mercury: "a quick mind, curiosity and a way with words",
  Venus: "charm, an eye for beauty and a gift for getting along with people",
  Mars: "drive, courage and a fighting spirit",
  Jupiter: "optimism, generosity and a knack for landing on your feet",
  Saturn: "seriousness, patience and the ability to endure what others can't",
};

// ---------------------------------------------------------------- Eclipses touching the chart
// Tradition (Ptolemy onward) watches eclipses that fall on, or opposite, natal planets and angles.
export function eclipseContacts(eclipses, points, orb = 3) {
  return eclipses.map((e) => {
    const hits = [];
    for (const [who, lon] of points) {
      const d = Math.abs(E.angdiff(e.useLon, lon));
      if (d <= orb) hits.push({ who, orb: d, how: "on" });
      else if (Math.abs(180 - d) <= orb) hits.push({ who, orb: Math.abs(180 - d), how: "opposite" });
    }
    return { ...e, hits: hits.sort((a, b) => a.orb - b.orb) };
  });
}

// ---------------------------------------------------------------- Vedic yogas (combinations) in the birth chart
// Whole-sign houses from the Lahiri lagna. Rules from Brihat Parashara Hora Shastra and Phaladeepika.
const OWN = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
const EXALT_I = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBIL_I = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const KENDRA = [1, 4, 7, 10], TRIKONA = [1, 5, 9], DUSTHANA = [6, 8, 12];
const MAHAPURUSHA = { Mars: ["Ruchaka", "courage, physical strength, leadership and success in competitive or protective work"],
  Mercury: ["Bhadra", "intelligence, eloquence, business sense and a long, learned life"],
  Jupiter: ["Hamsa", "wisdom, good character, respect from others and a righteous nature"],
  Venus: ["Malavya", "beauty, comfort, artistic taste, a happy marriage and the good things in life"],
  Saturn: ["Shasha", "authority over people, organizational power and endurance"] };
export function vedicYogas(chart) {
  const vp = chart.vedic.planets, lag = E.signIdx(chart.vedic.lagna);
  const si = (p) => E.signIdx(vp[p].lon), hFrom = (s, ref) => ((s - ref) % 12 + 12) % 12 + 1, h = (p) => hFrom(si(p), lag);
  const lordOf = (house) => E.RULERS[(lag + house - 1) % 12];
  const dignified = (p) => OWN[p].includes(si(p)) || EXALT_I[p] === si(p);
  const out = [];
  const add = (name, tone, what, why, common) => out.push({ name, tone, what, why, common });

  for (const p of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) if (dignified(p) && KENDRA.includes(h(p))) {
    const [nm, gift] = MAHAPURUSHA[p];
    add(`${nm} yoga`, "good", `One of the five "great person" yogas. Tradition says it brings ${gift}.`,
      `${p} is ${EXALT_I[p] === si(p) ? "exalted" : "in its own sign"} (${E.SIGNS[si(p)]}) and in your ${E.ordinal(h(p))} house, a kendra (angle).`, "About 1 chart in 3 has at least one of the five great-person yogas; each one on its own appears in fewer than 1 in 10.");
  }
  const jFromMoon = hFrom(si("Jupiter"), si("Moon"));
  if (KENDRA.includes(jFromMoon)) add("Gajakesari yoga", "good", "The \"elephant and lion\" yoga: tradition promises a good reputation, intelligence and the ability to overcome rivals.",
    `Jupiter is in the ${E.ordinal(jFromMoon)} sign from your Moon.`, "Common: about a third of all charts have it, so its strength depends on how strong Jupiter and the Moon are.");
  if (si("Sun") === si("Mercury")) add("Budhaditya yoga", "good", "Sun and Mercury together: tradition links it with intelligence, skill and a sharp, practical mind.",
    `Your Sun and Mercury are both in ${E.SIGNS[si("Sun")]}.`, "Very common, because Mercury always stays close to the Sun. It's stronger when Mercury isn't too near the Sun.");
  const mm = hFrom(si("Mars"), si("Moon"));
  if (mm === 1 || mm === 7) add("Chandra-Mangala yoga", "mixed", "Moon and Mars combined: tradition links it with earning power and drive, especially in business, along with a quick temper.",
    `Mars is ${mm === 1 ? "in the same sign as" : "opposite"} your Moon.`, "Fairly common.");
  const around = (off) => ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"].filter((p) => hFrom(si(p), si("Moon")) === off);
  const s2 = around(2), s12 = around(12);
  if (s2.length && s12.length) add("Durudhara yoga", "good", "Planets on both sides of the Moon: tradition says it brings comfort, wealth, generosity and support from others.",
    `${s12.join(" and ")} ${s12.length > 1 ? "are" : "is"} in the sign before your Moon, and ${s2.join(" and ")} in the sign after.`, "Fairly common.");
  else if (s2.length) add("Sunapha yoga", "good", "A planet in the sign after the Moon: tradition says self-earned wealth, intelligence and a good name.",
    `${s2.join(" and ")} ${s2.length > 1 ? "are" : "is"} in the sign after your Moon.`, "Common.");
  else if (s12.length) add("Anapha yoga", "good", "A planet in the sign before the Moon: tradition says good health, a pleasant personality and comfort.",
    `${s12.join(" and ")} ${s12.length > 1 ? "are" : "is"} in the sign before your Moon.`, "Common.");
  else {
    const withMoon = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"].some((p) => si(p) === si("Moon"));
    const kendraFromMoon = withMoon || ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"].some((p) => [4, 7, 10].includes(hFrom(si(p), si("Moon"))));
    const moonInKendra = KENDRA.includes(h("Moon"));
    add("Kemadruma yoga", kendraFromMoon || moonInKendra ? "mixed" : "low", "An \"unsupported\" Moon: no planets in the signs on either side of it. Tradition links it with feeling alone or having to make your own way.",
      `No planets (other than the Sun and nodes) sit next to your Moon. ${kendraFromMoon || moonInKendra ? "But it's cancelled: " + (moonInKendra ? "your Moon is in an angle from the rising sign" : withMoon ? "a planet sits with your Moon" : "a planet sits in an angle from your Moon") + ", which classic texts say removes most of its effect." : "Classic texts list several cancellations; none apply here, so tradition reads it at face value. It describes independence more than bad luck."}`,
      "Common before cancellations (over a third of charts), and most of those are cancelled.");
  }
  // Raja yoga: a kendra lord and a trikona lord together (same sign) or exchanging signs.
  const done = new Set();
  for (const k of [4, 7, 10]) for (const t of [5, 9]) {
    const a = lordOf(k), b = lordOf(t);
    if (a === b) { const key = "YK" + a; if (!done.has(key)) { done.add(key);
      add(`Yogakaraka (${a})`, "good", `${a} rules both an angle and a trine from your rising sign, which makes it a "yogakaraka", a planet tradition expects to bring success and status on its own.`,
        `${a} rules your ${E.ordinal(k)} and ${E.ordinal(t)} houses.`, "Only Taurus, Libra, Cancer, Leo, Capricorn and Aquarius risings have one."); } continue; }
    const together = si(a) === si(b), exchange = OWN[a] && OWN[b] && OWN[a].includes(si(b)) && OWN[b].includes(si(a));
    const key = [a, b].sort().join("-");
    if ((together || exchange) && !done.has(key)) { done.add(key);
      add(`Raja yoga (${a} and ${b})`, "good", "A \"royal\" combination: the lord of an angle (action) joins the lord of a trine (fortune). Tradition says it raises your status, especially during these planets' dashas.",
        `${a} (lord of your ${E.ordinal(k)}) and ${b} (lord of your ${E.ordinal(t)}) ${together ? `are together in ${E.SIGNS[si(a)]}` : "exchange signs"}.`, "Common in some form; strongest when the planets are well placed.");
    }
  }
  // Viparita raja yoga: lords of 6, 8, 12 placed in 6, 8, 12.
  const vip = [...new Set([6, 8, 12].map(lordOf))].filter((p) => DUSTHANA.includes(h(p)) && ![1, 5, 9, 4, 7, 10].some((x) => lordOf(x) === p));
  if (vip.length) add("Viparita raja yoga", "good", "\"Success through reversal\": the lords of the difficult houses sit in difficult houses, so tradition says troubles cancel each other and setbacks turn into gains.",
    `${vip.join(" and ")} ${vip.length > 1 ? "rule" : "rules"} a difficult house (6th, 8th or 12th) and ${vip.length > 1 ? "sit" : "sits"} in one.`, "Fairly uncommon.");
  // Neecha (debilitated) planets: show with the main cancellation check.
  for (const p of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) if (DEBIL_I[p] === si(p)) {
    const dl = E.RULERS[si(p)], exl = E.RULERS[EXALT_I[p]];
    const cancel = KENDRA.includes(h(dl)) || KENDRA.includes(hFrom(si(dl), si("Moon"))) || KENDRA.includes(h(exl));
    add(`${p} in its fall${cancel ? " (cancelled: Neecha Bhanga)" : ""}`, cancel ? "good" : "mixed",
      cancel ? `${p} is in its weakest sign, but the fall is cancelled. Tradition calls this Neecha Bhanga raja yoga: an early struggle in ${p}'s areas turns into a later strength.`
        : `${p} is in its weakest sign (${E.SIGNS[si(p)]}). Tradition says its themes take more effort, though other factors in the chart can help.`,
      cancel ? `The cancelling planet (${KENDRA.includes(h(dl)) || KENDRA.includes(hFrom(si(dl), si("Moon"))) ? dl + ", lord of that sign" : exl + ", which is exalted there"}) is in an angle.` : `${p} is debilitated in ${E.SIGNS[si(p)]}.`, "");
  }
  return out;
}

// ---------------------------------------------------------------- Arabic lunar mansions (Western; Agrippa, Three Books II.33)
// 28 equal mansions of 12°51′26″ from 0° Aries (tropical). Uses rewritten in plain language; Agrippa's
// harmful magic (curses, binding people) is left out on purpose.
export const MANSIONS = [
  ["Al-Sharatain", "the two signs", "mixed", "setting out on journeys", "arguments; Agrippa says this mansion stirs up quarrels"],
  ["Al-Butain", "the little belly", "good", "finding lost things and holding on to what you have", ""],
  ["Al-Thurayya", "the Pleiades", "good", "ventures, travel by water, experiments and any kind of hunt or search", ""],
  ["Al-Dabaran", "the follower", "low", "clearing out pests and things you want gone", "building, starting projects and anything you want to last; it breeds discord"],
  ["Al-Haq'a", "the white spot", "good", "coming home from a trip, studying and teaching, building, health and goodwill", ""],
  ["Al-Han'a", "the mark", "mixed", "pursuit and going after what you want", "planting and medical treatment"],
  ["Al-Dhira", "the forearm", "good", "earning, friendship and love", ""],
  ["Al-Nathra", "the gap", "good", "love, friendship and travel with companions", ""],
  ["Al-Tarf", "the glance", "low", "very little", "harvests, travel and group harmony; Agrippa says it sows discord"],
  ["Al-Jabha", "the forehead", "good", "building things to last, love, goodwill and getting help against rivals", ""],
  ["Al-Zubra", "the mane", "good", "travel, profit from trade and freeing yourself from obligations", ""],
  ["Al-Sarfa", "the changer", "good", "planting, harvests and improving relations with people who work with you", "travel by sea"],
  ["Al-Awwa", "the barker", "good", "goodwill, gain, travel, harvests and gaining freedom", ""],
  ["Al-Simak", "the unarmed one (Spica)", "mixed", "healing and travel by water", "long trips over land"],
  ["Al-Ghafr", "the covering", "low", "digging, searching for hidden things and ending what must end", "travel, partnerships and starting a home"],
  ["Al-Zubana", "the claws", "low", "getting out of obligations", "journeys, weddings, planting and business deals"],
  ["Al-Iklil", "the crown", "good", "turning bad luck around, making love last and building things that endure", ""],
  ["Al-Qalb", "the heart", "low", "breaking free and repairing buildings", "teamwork and dealing with authority; Agrippa ties it to conflict and revolt"],
  ["Al-Shaula", "the sting", "low", "pressing hard on a goal", "travel by water and anything delicate"],
  ["Al-Na'aim", "the ostriches", "mixed", "taming animals, securing things and calling someone to you", "shared finances"],
  ["Al-Balda", "the city", "mixed", "harvests, gain, building and travel", "relationships; Agrippa links it to separation"],
  ["Sa'd al-Dhabih", "the luck of the slaughterer", "mixed", "healing and escaping a bad situation", ""],
  ["Sa'd Bula", "the luck of the swallower", "mixed", "regaining freedom and recovering from illness", "relationships; Agrippa links it to separation"],
  ["Sa'd al-Su'ud", "the luckiest of the lucky", "good", "married love, goodwill and winning a contest", "dealing with government and officials"],
  ["Sa'd al-Akhbiya", "the luck of the tents", "low", "sending messages quickly and securing things", "relationships; Agrippa ties it to revenge and separation"],
  ["Al-Fargh al-Muqaddam", "the first spout", "good", "union, love and health", "building"],
  ["Al-Fargh al-Mu'akhkhar", "the second spout", "mixed", "growth of income and harvests, healing", "building and sea travel"],
  ["Batn al-Hut", "the belly of the fish", "good", "harvests, trade, safe travel and happiness in marriage", "keeping valuables safe; Agrippa warns of losses"],
];
export const mansionOf = (tropLon) => Math.floor(norm(tropLon) / (360 / 28));

// ---------------------------------------------------------------- Birthday chart: solar return (Western) / Varshaphal (Vedic)
// Exact moment the Sun returns to its birth longitude, near the most recent birthday.
export function solarReturnTime(chart, nowMs, sid = false) {
  const natal = sid ? E.lonAt(chart.utc, "Sun", true) : chart.western.planets.Sun.lon;
  const b = chart.birth, yNow = new Date(nowMs).getUTCFullYear();
  const find = (year) => {
    const guess = Date.UTC(year, b.m - 1, b.d, 12);
    const f = (t) => E.angdiff(E.lonAt(t, "Sun", sid), natal);
    let lo = guess - 3 * DAY, hi = guess + 3 * DAY;
    if (!(f(lo) < 0 && f(hi) > 0)) return null;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; }
    return hi;
  };
  let t = find(yNow);
  if (!t || t > nowMs) t = find(yNow - 1);
  return t;
}
export function returnChart(chart, ms, lat, lon) {
  const d = new Date(ms);
  return E.computeChart({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() + d.getUTCSeconds() / 60, lat, lon, tz: "UTC" });
}
// Tajika: Muntha starts in the natal lagna sign and moves one sign per completed year.
export const MUNTHA_GOOD = [9, 10, 11], MUNTHA_OK = [1, 2, 3, 5], MUNTHA_HARD = [4, 6, 7, 8, 12];
