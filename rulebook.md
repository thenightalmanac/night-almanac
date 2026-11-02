# The Night Almanac Rulebook

Reference meanings the chatbot uses to interpret engine output. The chatbot
must stay within these meanings and the computed data; it should not invent
techniques, placements or dates.

Each section names its tradition. Western and Vedic readings are never mixed
in one answer unless the user asks to compare them.

---

## 1. Planets

| Planet | Core meaning | Notes |
|---|---|---|
| Sun | identity, vitality, authority, recognition, father (traditional) | |
| Moon | emotions, needs, body, daily life, mother, the public | |
| Mercury | thinking, speech, writing, trade, learning, siblings (Western) | |
| Venus | love, pleasure, beauty, art, comfort, harmony, money from pleasure | |
| Mars | drive, conflict, courage, cutting, competition; siblings and land (Vedic) | |
| Jupiter | growth, wisdom, teachers, faith, generosity, children (Vedic) | |
| Saturn | limits, delay, discipline, structure, labor, endurance, time | |
| Uranus | disruption, sudden change, independence | Western modern only |
| Neptune | ideals, imagination, confusion, dissolving boundaries | Western modern only |
| Pluto | power, transformation, deep change | Western modern only |
| Rahu (north node) | craving, the unfamiliar, foreign things, obsession, ambition | Vedic and KP |
| Ketu (south node) | detachment, loss of interest, spirituality, past skill | Vedic and KP |

**Benefic / malefic by sect (Western traditional):**
- Day chart: Jupiter is the most helpful planet; Saturn is the "malefic of sect" (difficult but manageable); Mars is the harder malefic.
- Night chart: Venus is the most helpful planet; Mars is the malefic of sect (manageable); Saturn is the harder malefic.
- Use this to describe tone, never to predict disaster.

**Retrograde:** describe as review, revisiting or delay of that planet's topics. Never as "bad luck."

---

## 2. Signs

| Sign | Element / mode | Ruler (traditional) | Keywords |
|---|---|---|---|
| Aries | fire / cardinal | Mars | initiative, speed, directness |
| Taurus | earth / fixed | Venus | stability, comfort, persistence |
| Gemini | air / mutable | Mercury | curiosity, variety, talk |
| Cancer | water / cardinal | Moon | care, protection, home |
| Leo | fire / fixed | Sun | expression, pride, visibility |
| Virgo | earth / mutable | Mercury | analysis, service, detail |
| Libra | air / cardinal | Venus | balance, partnership, fairness |
| Scorpio | water / fixed | Mars | intensity, depth, privacy |
| Sagittarius | fire / mutable | Jupiter | exploration, belief, teaching |
| Capricorn | earth / cardinal | Saturn | ambition, structure, patience |
| Aquarius | air / fixed | Saturn | community, systems, independence |
| Pisces | water / mutable | Jupiter | empathy, imagination, surrender |

---

## 3. Houses

| House | Western / Hellenistic | Vedic (bhava) |
|---|---|---|
| 1 | self, body, appearance, approach to life | self, body, health, temperament |
| 2 | money, possessions, livelihood | wealth, family, speech, food |
| 3 | siblings, neighbors, communication, short trips | siblings, courage, effort, short travel |
| 4 | home, parents, roots, property, endings | mother, home, vehicles, inner peace, land |
| 5 | children, pleasure, creativity, romance | children, intelligence, past merit, romance |
| 6 | illness, daily work, routines, servants/employees | enemies, debts, disputes, service, illness |
| 7 | partners, marriage, contracts, open opponents | spouse, partnerships, business dealings |
| 8 | crisis, others' money, inheritance, endings | sudden events, longevity, hidden matters, inheritance |
| 9 | travel, religion, philosophy, higher learning | fortune, father, teachers, dharma, long travel |
| 10 | career, reputation, public action | career, status, actions in the world |
| 11 | friends, allies, groups, hopes, gains | gains, income, friends, fulfilled desires |
| 12 | isolation, loss, hidden things, retreat | expenses, losses, foreign lands, sleep, liberation |

House 6, 8 and 12 topics must be phrased gently and practically (see the
guardrails). Never state that a house "means" illness or death for this user.

---

## 4. Annual profections (Western)

**Engine fields:** `profection.age`, `profected_house`, `profected_sign`,
`lord_of_year`, `lord_natal_position`, `lord_natal_house_whole_sign`.

**How to read it:**
1. The profected house's topics are the year's emphasis.
2. The lord of the year is the year's "manager." Its natal sign, house and
   sect status describe how the year tends to go.
3. Natal planets in the profected sign are "activated" that year.
4. Transits involving the lord of the year matter more than usual.
5. The year runs birthday to birthday.

**Example wording:** "You're in a 10th-house year (Cancer), so career and
reputation are the focus. The Moon runs the year. Natally it's in your 6th
house, which ties the year's career themes to day-to-day work and routines."

---

## 5. Lots (Western, Hermetic lots of Paulus Alexandrinus)

Formulas reverse at night; the engine already handles this.

| Lot | Meaning |
|---|---|
| Fortune | body, livelihood, circumstances, what happens *to* you |
| Spirit | mind, intention, career, what you *do* |
| Eros | desire, love, what you are drawn to |
| Necessity | constraints, obligations, struggles |
| Courage | boldness, risk-taking, assertiveness |
| Victory | success, faith, alliances, rewards |
| Nemesis | hidden obstacles, setbacks, what must be faced |

Read a lot by its sign, its house, its sign's ruler, and planets in the same
sign. Nemesis and Necessity are framed as "challenges you can work with," never
as doom.

---

## 6. Zodiacal releasing (Western, Vettius Valens)

**Engine fields:** `zr_spirit_current`, `zr_fortune_current` (each with
`level1` and `level2`: sign, start, end, `angular_from_fortune`,
`loosing_of_the_bond`).

**Which lot:**
- From **Spirit**: career, reputation, purpose, actions.
- From **Fortune**: body, health of circumstances, money, home life.
- From **Eros**: love and desire (available in the engine; not in the default
  data package yet).

**How to read it:**
1. **Level 1** is a long life chapter (8–30 years). Its sign and that sign's
   ruler describe the chapter's tone.
2. **Level 2** is a sub-chapter of months to a couple of years inside it.
3. **Peak periods:** when the active sign is angular from the Lot of Fortune.
   - 10th from Fortune: the strongest peak, high visibility and activity.
   - 1st and 7th: strong, active periods.
   - 4th: a quieter, foundation-building peak.
   - A level-1 peak with a level-2 peak inside it is the most emphasized time.
4. **Loosing of the bond:** in long chapters, the sub-periods complete a full
   cycle and jump to the opposite sign. Describe it as a significant turning
   point or change of direction, often a preview of a later chapter.
5. Periods ruled by benefics (Venus, Jupiter) tend to be easier; by malefics
   (Mars, Saturn) more demanding. Combine with sect.

**Convention note:** this app uses 360-day years and 30-day months, following
Valens. Other software sometimes uses calendar years, so dates can differ by
months from other sites. Mention this if a user compares.

---

## 7. Vedic chart and dashas

**Engine fields:** `vedic.lagna`, `vedic.planets` (sign, house, nakshatra,
pada, nakshatra lord), `vedic.vimshottari`.

**Reading the chart:**
- Houses are whole-sign from the Lagna (Ascendant).
- Main emphasis: Lagna, Moon sign and the Moon's nakshatra.
- Every planet looks at the 7th house from itself. Mars also looks at the 4th
  and 8th, Jupiter at the 5th and 9th, Saturn at the 3rd and 10th.

**Vimshottari dashas:**
1. The **mahadasha** lord sets the theme for a multi-year period.
2. The **antardasha** lord refines it for months to a few years.
3. Results come through the houses that each lord rules and occupies, and its
   nakshatra lord.
4. Changes of mahadasha are major life transitions; describe them as
   shifts in focus, not as good or bad fortune.

---

## 8. Krishnamurti Paddhati (Vedic, KP)

**Engine fields:** `kp.cusps` (sign/star/sub lord per house cusp),
`kp.planets` (house, star lord, sub lord), `kp.significators`.

**Core principles:**
1. A planet gives the results of its **star lord's** houses.
2. The **sub lord** decides whether those results actually happen.
3. To judge a matter, look at the **sub lord of the main house cusp** for that
   matter. If that sub lord signifies the favorable houses (via its star
   lord), the matter is promised. If it signifies the negating houses, it is
   denied or delayed.
4. **Significator strength**, strongest first: A (in star of occupants),
   B (occupants), C (in star of owner), D (owner).
5. **Timing:** the matter happens in dasha / antardasha periods of planets that
   signify the favorable houses.

**House combinations (favorable → negating):**

| Question | Main cusp | Favorable | Negating |
|---|---|---|---|
| Marriage | 7 | 2, 7, 11 | 1, 6, 10 |
| Getting a job / employment | 10 | 2, 6, 10, 11 | 1, 5, 9 |
| Promotion / career rise | 10 | 10, 11 (plus 2, 6) | 9, 5 |
| Starting a business | 7 | 7, 10, 11 | 6, 9 |
| Buying property | 4 | 4, 11, 12 | 3, 10 |
| Higher education | 9 | 4, 9, 11 | 3, 8 |
| Foreign travel | 12 | 3, 9, 12 | 2, 8, 11 |
| Children | 5 | 2, 5, 11 | 1, 4, 10 |
| Winning a competition | 6 | 6, 11 | 5, 10 |

Negating houses are the 12th house from each favorable house (the house
"before" it), following the standard KP rule.

Questions outside this table: say the app doesn't have a rule for that
question yet, rather than improvising one.

**KP horary:** the user picks a number from 1 to 249 while focusing on one
question. That number fixes the Ascendant; planets are for the moment of
judging. Read the main cusp sub lord exactly as above. Horary works without a
birth time.

---

## 9. Birth-time sensitivity

| Technique | Needs exact time? |
|---|---|
| Planet signs | Rarely (Moon can change sign within a day) |
| Ascendant, houses, profections | Yes, within about 1 hour |
| Lots, zodiacal releasing | Yes, within about 1 hour |
| Vedic dashas | Moderately (depends on the Moon's exact position) |
| KP cusp sub lords | Yes, within a few minutes |
| KP horary | No birth time needed |

## 10. Accuracy audit (November 2026)

Checked against the traditional rules and published reference values:

- **Positions.** Swiss Ephemeris (the same engine Astro.com uses), Moshier mode, so positions agree with Astro.com to well under an arcminute. JS and Python engines agree on 298/298 parity checks.
- **Lots.** The seven Hermetic lots follow Paulus Alexandrinus: Fortune = Asc + Moon − Sun, Spirit = Asc + Sun − Moon, Eros = Asc + Venus − Spirit, Necessity = Asc + Fortune − Mercury, Courage = Asc + Fortune − Mars, Victory = Asc + Jupiter − Spirit, Nemesis = Asc + Fortune − Saturn; all reversed for night births. Note: Valens gives different Eros and Necessity formulas, and Ptolemy did not reverse Fortune at night. We follow Paulus throughout and say so.
- **Zodiacal releasing.** 360-day years and 30-day months (Valens); loosing of the bond jumps to the sign opposite the starting sign; peaks are angles from the Lot of Fortune for both releasing lots. Matches Brennan's presentation.
- **Vimshottari.** 365.25-day years from the Lahiri Moon. Jagannatha Hora defaults to a slightly different year length, so dasha dates can differ by a few days.
- **Tara bala, Chandrashtama, Sade Sati.** Counts are inclusive from the birth nakshatra / Moon sign (Janma = 1). Correct.
- **Panchanga.** Checked Nov 1, 2026 against a published almanac (vedpanchang.com): Krishna Ashtami ending 1:40 AM CST (ours 1:41), Pushya, Shubha yoga, Balava karana. Rahu Kaal Sunday = last eighth of daylight. All match.
- **Void-of-course Moon.** Checked against Cafe Astrology's 2026 table: Moon enters Leo Nov 1 12:18 AM EDT, last aspect sextile Venus Nov 2 7:10 PM EST, enters Virgo Nov 3 3:27 AM EST. Ours matches to the minute.
- **Eclipses.** 2026–2027 list matches NASA's eclipse catalogue (types and dates).
- **Sunrise/sunset.** Swiss Ephemeris rise/set, upper limb with standard refraction (1013.25 hPa, 15 °C).

## 11. Star lore (esoteric techniques)

### Planetary hours / horas (both systems)
- Day = sunrise to sunset, split into 12 equal parts; night = sunset to next sunrise, split into 12. The astrological day starts at sunrise, so before dawn still belongs to the previous day.
- Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon. The first hour of each day belongs to the weekday ruler (Sun = Sunday … Saturn = Saturday).
- Ratings: Jupiter and Venus hours favorable (benefics); Mars and Saturn cautious (malefics); Sun, Moon, Mercury mixed.
- Vedic horas: same scheme. Some Indian almanacs use equal 60-minute horas; we use the older unequal hours and say so.
- Birth hour: the hour and weekday ruler at birth are shown with a light "tradition says" reading (folk/modern natal use, not a core Hellenistic technique).

### Void-of-course Moon (Western)
- From the Moon's last exact Ptolemaic aspect (conjunction, sextile, square, trine, opposition) to the Sun, Mercury, Venus, Mars, Jupiter or Saturn until it leaves its sign. Outer planets excluded (traditional definition; noted in the app).

### Decans and tarot (Western)
- Faces: Chaldean order starting with Mars at Aries 0°: Mars, Sun, Venus, Mercury, Moon, Saturn, Jupiter, repeating.
- Tarot: Golden Dawn (Book T, 1890s). Suit by element (fire Wands, earth Pentacles, air Swords, water Cups); cardinal signs 2–4, fixed 5–7, mutable 8–10. Titles are Book T's ("Lord of Dominion" etc., public domain).

### Drekkana (Vedic)
- Parashara: first 10° = same sign, second = 5th sign from it, third = 9th sign. Lord = that sign's ruler.

### Fixed stars (Western)
- The 15 Behenian stars (Agrippa) plus Fomalhaut (to complete the four Royal Stars). Longitudes for 2020.0 from the Wikipedia table, precessed at 50.29″/year. Conjunction by longitude only, 1° orb, to the seven planets, outer planets, Ascendant and Midheaven.
- Natures from Ptolemy (Tetrabiblos I.9) with Agrippa's where different. Readings follow Robson (1923) and Ptolemy, rewritten in plain language with the tradition's conditions (e.g., Regulus: success lost through revenge).

### More lots (Western)
- Father: Asc + Saturn − Sun (reversed at night); if Saturn is within 15° of the Sun, Asc + Jupiter − Mars.
- Mother: Asc + Moon − Venus (reversed at night).
- Siblings: Asc + Jupiter − Saturn (reversed at night; Valens/Firmicus).
- Children: Asc + Saturn − Jupiter (not reversed; Dorotheus).
- Marriage (Dorotheus): women Asc + Saturn − Venus; men Asc + Venus − Saturn. Both shown.
- Exaltation: Asc + 19° Aries − Sun by day; Asc + 3° Taurus − Moon by night.
- Rating: 6th, 8th and 12th houses are the "hidden/bad places"; others are "good places".

### Panchanga, Rahu Kaal, Abhijit (Vedic)
- Tithi = (Moon − Sun) / 12°. Groups: Nanda (1, 6, 11), Bhadra (2, 7, 12), Jaya (3, 8, 13), Rikta (4, 9, 14: avoid new starts), Purna (5, 10, 15). Ashtami, Chaturdashi and Amavasya also flagged as cautious.
- Yoga = (Sun + Moon, sidereal) / 13°20′. Nine avoided yogas: Vishkambha, Atiganda, Shula, Ganda, Vyaghata, Vajra, Vyatipata, Parigha, Vaidhriti.
- Karana = half-tithi. Fixed: Kimstughna (first), Shakuni, Chatushpada, Naga (last three). Movable cycle Bava…Vishti; Vishti (Bhadra) avoided.
- Nakshatra natures (Muhurta Chintamani): fixed, movable, fierce, mixed, light, soft, sharp, each with its traditional uses.
- Rahu Kaal: daylight in 8 parts; part by weekday Sun 8, Mon 2, Tue 7, Wed 5, Thu 6, Fri 4, Sat 3.
- Abhijit muhurta: 8th of 15 daytime muhurtas (around local noon); many almanacs skip it on Wednesday.

### Nakshatra lore (Vedic)
- Deities, symbols and gana per the standard lists; shaktis from the Taittiriya Brahmana as presented by David Frawley (via AstroVed). Readings are short plain-language syntheses.

### Vedic yogas
- Whole-sign houses from the Lahiri lagna. Implemented: the five Pancha Mahapurusha yogas (Ruchaka, Bhadra, Hamsa, Malavya, Shasha: planet in own/exaltation sign in a kendra from lagna); Gajakesari (Jupiter in a kendra from the Moon); Budhaditya (Sun and Mercury in one sign); Chandra-Mangala (Mars with or opposite the Moon); Sunapha, Anapha, Durudhara, Kemadruma (planets other than Sun/nodes in the 2nd/12th from the Moon), with Kemadruma cancellations (Moon in a kendra, a planet with the Moon, or a planet in a kendra from the Moon); yogakaraka; Raja yoga (kendra lord with trikona lord, same sign or exchange); Viparita raja yoga (lords of 6/8/12 in 6/8/12, excluding planets that also rule a kendra or trikona); debilitated planets with the main Neecha Bhanga checks.
- Frequency check on 400 random charts: Gajakesari ~35%, Budhaditya ~50%, Kemadruma (before cancellation) ~45%, each Mahapurusha 6–11%, Raja yoga in some form 70–80%. The app states how common each one is so no one is over-impressed or frightened.

### Arabic lunar mansions (Western)
- 28 equal mansions of 12°51′26″ starting at 0° Aries (tropical), following Agrippa, Three Books of Occult Philosophy II.33 (1533), who gives the same 12°51′22″ spacing. Uses are Agrippa's, in plain language; his harmful magic (curses, binding people) is deliberately left out. Ratings: good/mixed/low from the balance of uses he lists. Source: https://www.esotericarchives.com/agrippa/agripp2c.htm

### Birthday charts
- Western solar return: exact moment the tropical Sun returns to its natal longitude (bisection on Swiss Ephemeris longitudes), cast for the birthplace, whole-sign houses. Reported: return Ascendant and the natal house it falls in, return Sun and Moon houses, planets on the angles (benefics favorable, malefics testing).
- Vedic Varshaphal (Tajika): sidereal (Lahiri) solar return. Muntha = natal lagna sign + completed years; house counted from the varsha lagna. Ratings: 9, 10, 11 best; 1, 2, 3, 5 fair; 4, 6, 7, 8, 12 hard. The Panchadhikari "lord of the year" is not implemented (stated in the app).

### Eclipses
- Swiss Ephemeris global solar and lunar eclipse search. Lunar type from the phases present; solar total vs annular from the Moon's apparent size against the Sun's. Contact = eclipse degree within 3° of a natal planet or angle, by conjunction or opposition. Western uses tropical degrees; Vedic uses Lahiri sidereal.

### Sources
- Planetary hours: https://en.wikipedia.org/wiki/Planetary_hours
- Behenian stars: https://en.wikipedia.org/wiki/Behenian_fixed_star
- Decans: https://en.wikipedia.org/wiki/Decan_(astrology), https://kerykeion.net/content/learn-astrology/decans
- Nakshatras: https://hindutone.com/astrology/27-nakshatras-list-names-deities-lords-meaning/ ; shaktis: https://www.astroved.com/articles/shaktis-of-the-nakshatras
- Lots: https://www.augurine.com/learn/arabic-parts ; family/marriage lots: augurine.com lot calculators (citing Dorotheus, Valens, Firmicus)
- Void-of-course check: https://cafeastrology.com/void-of-course-moon-times.html
- Panchanga check: https://vedpanchang.com/panchang/omaha/2026-11-01
