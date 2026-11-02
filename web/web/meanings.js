// Short meanings drawn from rulebook.md, used to fill in templated readings.

export const HOUSE_W = {
  1: "self, body and how you approach life",
  2: "money, possessions and livelihood",
  3: "siblings, communication, learning and short trips",
  4: "home, family, roots and property",
  5: "creativity, pleasure, romance and children",
  6: "daily work, routines, habits and service",
  7: "partners, marriage, contracts and open rivals",
  8: "shared money, debts, inheritance and big transitions",
  9: "travel, beliefs, higher learning and publishing",
  10: "career, reputation and your public role",
  11: "friends, groups, allies, hopes and gains",
  12: "solitude, retreat, hidden matters and letting go",
};

export const HOUSE_V = {
  1: "self, body and temperament",
  2: "wealth, family and speech",
  3: "siblings, courage and effort",
  4: "mother, home, vehicles and inner peace",
  5: "children, intelligence and romance",
  6: "disputes, debts, service and daily work",
  7: "spouse, partnerships and business dealings",
  8: "sudden events, hidden matters and inheritance",
  9: "fortune, father, teachers and long travel",
  10: "career, status and actions in the world",
  11: "gains, income, friends and fulfilled wishes",
  12: "expenses, foreign lands, sleep and release",
};

export const PLANET = {
  Sun: "identity, vitality, authority and recognition",
  Moon: "emotions, needs, the body and daily life",
  Mercury: "thinking, speech, writing, trade and learning",
  Venus: "love, pleasure, beauty, art and comfort",
  Mars: "drive, conflict, courage and competition",
  Jupiter: "growth, wisdom, teachers, faith and generosity",
  Saturn: "limits, discipline, structure, labor and endurance",
  Uranus: "disruption, sudden change and independence",
  Neptune: "ideals, imagination and dissolving boundaries",
  Pluto: "power, transformation and deep change",
  Rahu: "craving, the unfamiliar, foreign things and ambition",
  Ketu: "detachment, spirituality and past skill",
};

export const SIGN = {
  Aries: "initiative, speed and directness",
  Taurus: "stability, comfort and persistence",
  Gemini: "curiosity, variety and conversation",
  Cancer: "care, protection and home",
  Leo: "expression, pride and visibility",
  Virgo: "analysis, service and detail",
  Libra: "balance, partnership and fairness",
  Scorpio: "intensity, depth and privacy",
  Sagittarius: "exploration, belief and teaching",
  Capricorn: "ambition, structure and patience",
  Aquarius: "community, systems and independence",
  Pisces: "empathy, imagination and surrender",
};

export const LOT = {
  Fortune: "body, livelihood and circumstances: what happens to you",
  Spirit: "mind, intention and career: what you do",
  Eros: "desire, love and what you're drawn to",
  Necessity: "constraints, obligations and struggles you can work through",
  Courage: "boldness, risk-taking and assertiveness",
  Victory: "success, faith, alliances and rewards",
  Nemesis: "hidden obstacles and what has to be faced",
};

export const PEAK = {
  "10th": "the strongest peak period, associated with high visibility and activity",
  "1st": "an active, prominent period",
  "7th": "an active, prominent period, often involving other people",
  "4th": "a quieter peak, associated with building foundations",
};

export function sectNote(planet, sect) {
  if (sect === "day") {
    if (planet === "Jupiter") return "Jupiter is the most helpful planet in a day chart.";
    if (planet === "Saturn") return "In a day chart Saturn is the more manageable of the two difficult planets.";
    if (planet === "Mars") return "In a day chart Mars is the more demanding of the two difficult planets.";
  } else {
    if (planet === "Venus") return "Venus is the most helpful planet in a night chart.";
    if (planet === "Mars") return "In a night chart Mars is the more manageable of the two difficult planets.";
    if (planet === "Saturn") return "In a night chart Saturn is the more demanding of the two difficult planets.";
  }
  return "";
}

export const HOUSE_SHORT = { 1: "personal", 2: "money", 3: "communication", 4: "home and family", 5: "creative and romantic",
  6: "work and routine", 7: "partnership", 8: "shared-resource", 9: "travel and learning", 10: "career",
  11: "friendship and community", 12: "inner-life" };
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const ELEMENT_OF = { Aries: "fire", Leo: "fire", Sagittarius: "fire", Taurus: "earth", Virgo: "earth", Capricorn: "earth",
  Gemini: "air", Libra: "air", Aquarius: "air", Cancer: "water", Scorpio: "water", Pisces: "water" };
export const MODE_OF = { Aries: "cardinal", Cancer: "cardinal", Libra: "cardinal", Capricorn: "cardinal",
  Taurus: "fixed", Leo: "fixed", Scorpio: "fixed", Aquarius: "fixed",
  Gemini: "mutable", Virgo: "mutable", Sagittarius: "mutable", Pisces: "mutable" };
export const ELEMENT = { fire: "action, enthusiasm and confidence", earth: "practicality, patience and the physical world",
  air: "ideas, conversation and connecting with people", water: "feeling, intuition and emotional bonds" };
export const MODE = { cardinal: "starting things and taking the lead", fixed: "sustaining, persisting and holding steady",
  mutable: "adapting, adjusting and seeing many sides" };
export const ASPECT = {
  conjunction: "blend together, so they act as one combined force",
  sextile: "support each other with easy opportunities you have to act on",
  square: "create friction that pushes you to act and grow",
  trine: "flow together naturally, a built-in talent",
  opposition: "pull in opposite directions, asking you to find a balance",
};
export const BIG3 = {
  Sun: "your core identity and what gives you energy",
  Moon: "your emotional needs and what makes you feel safe",
  Rising: "how you meet the world and come across at first",
};

// Tap-to-define glossary
export const GLOSS = {
  house: ["House", "One of 12 areas of life, such as money, home, partners or career. Which house a planet lands in depends on your birth time and place."],
  sign: ["Sign", "One of the 12 zodiac signs. A planet's sign describes the style it works in."],
  rising: ["Rising sign", "The zodiac sign rising on the eastern horizon when you were born. It sets up your houses and describes how you come across. Also called the Ascendant (or Lagna in Vedic)."],
  profection: ["Annual profection", "A Western timing method: each birthday, your focus moves to the next house, in a 12-year cycle."],
  lordyear: ["Lord of the year", "The planet that rules your profection sign this year. The tradition treats it as the year's manager."],
  zr: ["Zodiacal releasing", "An ancient Western timing method that divides life into long chapters and shorter sub-periods, counted from a calculated point called a lot."],
  peak: ["Peak period", "In zodiacal releasing, a period when the active sign is in a key position from the Lot of Fortune. These are expected to be eventful, visible times."],
  loosing: ["Loosing of the bond", "A turning point in zodiacal releasing, when the sequence jumps to the opposite sign. Read as a change of direction."],
  lot: ["Lot", "A calculated point in the chart. The Lot of Fortune relates to your body and circumstances, the Lot of Spirit to your mind and career."],
  dasha: ["Dasha", "Vedic timing: life is divided into long periods, each run by one planet, with shorter sub-periods inside them."],
  sublord: ["Sub lord", "In KP, each small slice of the zodiac has a 'sub lord' planet. The sub lord of a house decides questions about that house."],
  kp: ["KP", "Krishnamurti Paddhati, a 20th-century Vedic method designed for precise yes/no answers and timing."],
  nakshatra: ["Nakshatra", "One of 27 lunar mansions used in Vedic astrology. Your Moon's nakshatra is a key part of your Vedic chart."],
  sidereal: ["Western vs Vedic zodiac", "Vedic astrology lines the zodiac up with the actual stars. Western astrology lines it up with the seasons. They're about 24° apart, so your signs often differ."],
  horary: ["Horary", "A chart cast for the moment a question is asked, instead of for your birth. In KP horary, the number you pick sets up the chart."],
  aspect: ["Aspect", "An angle between two planets. Trines and sextiles are read as easy; squares and oppositions as tense."],
  retro: ["Retrograde", "When a planet appears to move backward as seen from Earth. Read as turning that planet's energy inward or revisiting it."],
  ruler: ["Ruler", "Each sign is ruled by a planet. The ruler of a house is the planet that rules the sign on that house."],
  dignity: ["Dignity", "How comfortable a planet is in its sign. 'At home' or 'exalted' is strong; 'detriment' or 'fall' is weakened."],
  benefic: ["Benefics and malefics", "Venus and Jupiter are the traditional helpful planets (benefics). Mars and Saturn are the challenging ones (malefics)."],
  sect: ["Day or night chart", "Whether the Sun was above the horizon at birth. It changes which planets are treated as most helpful or difficult."],
};

// Western question settings: topic house, natural significator, lot used for timing
export const WQ = {
  marriage: { house: 7, sig: "Venus", lot: "Eros", topic: "partnership and marriage" },
  job: { house: 10, sig: null, lot: "Spirit", topic: "work and employment" },
  promotion: { house: 10, sig: "Sun", lot: "Spirit", topic: "career rise and recognition" },
  business: { house: 10, sig: "Mercury", lot: "Spirit", topic: "business and trade" },
  property: { house: 4, sig: "Saturn", lot: "Fortune", topic: "home and property" },
  education: { house: 9, sig: "Jupiter", lot: "Spirit", topic: "higher learning" },
  travel: { house: 9, sig: null, lot: "Fortune", topic: "long-distance travel" },
  children: { house: 5, sig: "Jupiter", lot: "Fortune", topic: "children" },
  competition: { house: 10, sig: "Mars", lot: "Spirit", topic: "competition and winning" },
};
export const EXALT = { Sun: "Aries", Moon: "Taurus", Mercury: "Virgo", Venus: "Pisces", Mars: "Capricorn", Jupiter: "Cancer", Saturn: "Libra" };
Object.assign(GLOSS, {
  transit: ["Transit", "Where a planet is in the sky right now, compared with where it was when you were born. Daily and monthly forecasts are built from transits."],
  tara: ["Tara (star of the day)", "A Vedic daily rating: count from your birth Moon's nakshatra to today's Moon nakshatra. The count falls into one of nine types, from very supportive to cautious."],
  tithi: ["Tithi (lunar day)", "The Vedic lunar day, set by the angle between the Sun and Moon. There are 30 in a lunar month, split into the waxing and waning halves."],
  sadesati: ["Sade Sati", "A roughly 7½-year stretch when Saturn passes through the sign before, on and after your birth Moon sign. Vedic tradition sees it as demanding and character-building."],
  chandrashtama: ["Chandrashtama", "About two days a month when the Moon passes the 8th sign from your birth Moon. Vedic tradition advises postponing big decisions."],
  monthprof: ["Monthly focus", "A Western method: within each birthday year, your focus also steps to a new area of life roughly every month."],
});

// What a zodiacal-releasing sign looks like in real life, by context.
// Spirit = career and purpose; Fortune = body, money and day-to-day circumstances.
export const ZR_SIGN = {
  Spirit: {
    Aries: "work calls for initiative: starting something new, taking charge, competing, or working on your own terms. Expect a faster pace and pressure to prove yourself",
    Taurus: "work is about building something solid: steady income, practical skills and results you can see. Progress is slower but tends to last",
    Gemini: "work involves lots of communication and juggling: writing, selling, teaching, networking, or several projects at once",
    Cancer: "work becomes more personal: looking after people or a team, roles tied to home, family, food or property, or working closer to home. Security and belonging matter more than status",
    Leo: "work puts you more in the spotlight: leading, presenting, creative work, or being recognized for what you do",
    Virgo: "work focuses on skill and detail: improving systems, solving problems, service roles, or a heavier day-to-day workload",
    Libra: "work runs through other people: partnerships, clients, negotiation and teamwork, or roles in design, law or relations",
    Scorpio: "work goes deeper: high-stakes projects, research, managing other people's money, turnarounds, or behind-the-scenes influence",
    Sagittarius: "work expands outward: travel, teaching, publishing, further study, or bigger-picture goals",
    Capricorn: "work becomes about responsibility and long-term ambition: management, structure, building a reputation, and more pressure to deliver",
    Aquarius: "work connects to groups and networks: organizations, technology, causes, community roles, or doing things differently from the norm",
    Pisces: "work leans toward meaning over status: creative, helping or spiritual work, behind-the-scenes roles, or a less clearly defined path",
  },
  Fortune: {
    Aries: "life moves faster: new starts, more independence and physical energy, with a risk of rushing or acting on impulse",
    Taurus: "life centers on stability and resources: earning, saving, comfort, property, and enjoying the physical world",
    Gemini: "day-to-day life gets busier: more errands, short trips, paperwork, learning, and contact with siblings or neighbors",
    Cancer: "home and family take center stage: moving, renovating, family needs, caring for relatives or being cared for by them, and putting down roots",
    Leo: "life revolves around self-expression and enjoyment: hobbies, romance, children, and being more visible",
    Virgo: "daily routines, health habits and working conditions come into focus: fixing what isn't working and getting organized",
    Libra: "life revolves around partners and agreements: shared plans, contracts, and balancing your needs with someone else's",
    Scorpio: "shared resources and big changes come up: debts, inheritances, joint finances, and endings that clear the way for something new",
    Sagittarius: "life opens up: travel, moving far away, education, and broader horizons",
    Capricorn: "life becomes more serious and structured: responsibilities, long-term commitments, and building security through effort",
    Aquarius: "life involves friends, groups and the unconventional: community, networks, technology, and more independence",
    Pisces: "life becomes less defined: rest, retreat, spirituality and creativity, and situations where you go with the flow or have to let something go",
  },
};

// What a Vedic planetary period looks like in real life
export const PERIOD_PLANET = {
  Sun: "puts you and your ambitions up front: dealing with bosses and authority, wanting recognition, taking the lead, and matters involving your father. Confidence tends to rise, but so can clashes with people in charge",
  Moon: "brings home, family and feelings forward: moves, changes in routine, closer ties with your mother or family, and being more sensitive to your surroundings",
  Mars: "brings energy and push: competition, bold moves, property or vehicles, physical activity, and more arguments if you're not careful",
  Mercury: "brings learning, communication and business forward: study, writing, deals, work travel, and lots of busy, detail-heavy activity",
  Jupiter: "brings growth: opportunities, mentors and teachers, education, children, faith, and more support from other people",
  Venus: "brings relationships, comfort and enjoyment forward: new or deepening relationships, a fuller social life, creative projects, and spending on home, style or pleasure",
  Saturn: "is about hard work and responsibility: long-term commitments, slower progress, discipline, and results that come through persistence",
  Rahu: "brings strong ambition and unusual paths: foreign connections, technology, new worlds and big desires, often with restlessness or sudden changes",
  Ketu: "brings detachment and an inward turn: letting go of what no longer fits, spiritual interests, and endings that clear space",
};
// Where a Vedic period shows up, from the house its planet occupies
export const HOUSE_SHOWS = {
  1: "you personally: your health, appearance and confidence", 2: "money, family and the way you speak",
  3: "your own efforts, siblings, short trips and communication", 4: "home, your mother, property and peace of mind",
  5: "children, romance, creativity and studies", 6: "work routines, health habits, competition and debts",
  7: "your partner, marriage and business deals", 8: "sudden changes, shared money and private matters",
  9: "luck, mentors, long trips and beliefs", 10: "your career and public reputation",
  11: "income, gains, friends and goals", 12: "expenses, time abroad, rest and letting go",
};

// ---------------- Practical chart readings ----------------
export const PLANET_RUNS = {
  Sun: "your identity, confidence and what you want to be known for",
  Moon: "your emotional needs, moods and what makes you feel at home",
  Mercury: "how you think, learn, talk and make decisions",
  Venus: "how you love, what you find attractive, and how you handle money and pleasure",
  Mars: "how you go after what you want, handle conflict and use your energy",
  Jupiter: "where you find luck, growth and opportunity, and what you believe in",
  Saturn: "where you face your biggest tests, responsibilities and long-term lessons",
  Uranus: "where you rebel, crave freedom and do things differently",
  Neptune: "where you dream and idealize, and where you can get inspired or confused",
  Pluto: "where you experience intensity, power struggles and deep change",
  Rahu: "what you crave and chase in this life, often something new or unfamiliar",
  Ketu: "what comes naturally to you from the past, and what you're learning to let go of",
};
export const PLANET_ROLE = {
  Sun: "your sense of self", Moon: "your emotions", Mercury: "your thinking and communication", Venus: "your love life and tastes",
  Mars: "your drive and temper", Jupiter: "your optimism and luck", Saturn: "your sense of duty and limits", Uranus: "your need for freedom",
  Neptune: "your imagination", Pluto: "your intensity",
};
export const SIGN_STYLE = {
  Aries: "boldly and quickly: you'd rather act first and figure it out later", Taurus: "steadily and patiently: you want security and dislike being rushed",
  Gemini: "curiously and flexibly: you want variety and get bored by routine", Cancer: "protectively and emotionally: you need to feel safe first",
  Leo: "warmly and proudly: you want to be appreciated for what you give", Virgo: "carefully and helpfully: you want things done right",
  Libra: "diplomatically and charmingly: you want harmony and fairness", Scorpio: "intensely and privately: it's all or nothing",
  Sagittarius: "optimistically and freely: you want adventure and meaning", Capricorn: "seriously and ambitiously: you play the long game",
  Aquarius: "independently and unconventionally: you do it your own way", Pisces: "gently and imaginatively: you go with the flow",
};
export const PLANET_ELEMENT = {
  Sun: {
    fire: "You come alive when you're taking action, leading or being seen. You're confident and direct, and you need excitement and a sense of purpose; boredom drains you.",
    earth: "You feel most like yourself when you're building something real: a career, savings, skills. You're practical and reliable, and you respect results over talk.",
    air: "You feel most like yourself when you're thinking, talking and connecting. You need ideas, variety and people around you.",
    water: "You feel most like yourself when you're emotionally connected. You're sensitive, intuitive and loyal, and you need to feel safe before you open up.",
  },
  Moon: {
    fire: "Emotionally, you need excitement, independence and to be appreciated. You feel things fast, get over them fast, and cope by doing something.",
    earth: "Emotionally, you need stability, routine and physical comfort: good food, a calm home, people you can count on. Sudden changes unsettle you.",
    air: "Emotionally, you need to talk things through and have some space. You process feelings by thinking about them.",
    water: "Emotionally, you feel things deeply and pick up on other people's moods. You need closeness and reassurance, and time alone to recharge.",
  },
  Mercury: {
    fire: "You think fast and speak your mind. You decide quickly and you're persuasive, though you can be impatient with details.",
    earth: "You think practically and carefully. You like facts, plans and step-by-step thinking, though you can be slow to change your mind.",
    air: "You think in ideas and connections. You're quick, curious and good at explaining things, though you can overthink or scatter.",
    water: "You think with your feelings and intuition. You read between the lines and remember how things felt, though you can take words personally.",
  },
  Venus: {
    fire: "In love you're direct and enthusiastic: you like the chase, quick sparks and a partner who keeps things exciting. With money, you tend to spend on experiences and act on impulse.",
    earth: "In love you're loyal and physical: you show care through actions, gifts and time, and you want something stable. With money, you like quality and security and are usually careful.",
    air: "In love you need conversation and friendship first: a partner who's fun to talk to and gives you space. With money, you spend on social life and things you can share.",
    water: "In love you're devoted and emotional: you want a deep bond and to feel truly understood. With money, you tend to spend on comfort and the people you care about.",
  },
  Mars: {
    fire: "You go after what you want head-on and fast. You're brave and competitive, your temper flares and fades quickly, and you need physical activity.",
    earth: "You work steadily and patiently toward goals. You have stamina, you get angry slowly, and you dig in when pushed.",
    air: "You fight with words and ideas rather than force. You argue well, and you can spread your energy over too many things.",
    water: "You act on feelings and instinct. Your drive is strongest when you care deeply, you may hold anger in, and you protect your people fiercely.",
  },
  Jupiter: {
    fire: "Luck tends to come when you take bold chances, start things, travel or lead. Confidence opens doors for you.",
    earth: "Luck tends to come through steady work, practical skills and patient investment. You grow by building.",
    air: "Luck tends to come through people, ideas, learning and networking. Who you know matters.",
    water: "Luck tends to come through caring, intuition and close relationships. Helping others tends to come back to you.",
  },
  Saturn: {
    fire: "Your big lessons involve confidence and leadership: acting without waiting for permission, and handling setbacks to your pride.",
    earth: "Your big lessons involve work, money and security: building the slow, solid way, and not letting fear of lack run your life.",
    air: "Your big lessons involve communication and relationships: speaking up, committing, and trusting your own ideas.",
    water: "Your big lessons involve feelings and closeness: letting people in, setting healthy boundaries, and feeling secure inside yourself.",
  },
};
export const RISING_ELEMENT = {
  fire: "People tend to see you as energetic, confident and direct. You make a strong first impression and jump into things.",
  earth: "People tend to see you as calm, capable and dependable. You come across as grounded, even when you don't feel it.",
  air: "People tend to see you as friendly, chatty and easy to approach. You come across as curious and light.",
  water: "People tend to see you as gentle, perceptive and a little private. You come across as caring, and people open up to you.",
};
export const ELEMENT_LIFE = {
  fire: "you're driven by action and enthusiasm, and you need goals and excitement to feel alive",
  earth: "you're practical and grounded, and you need security and real, tangible results",
  air: "you process life by talking and thinking it through, and you need people and ideas around you",
  water: "you're led by feelings and intuition, and you need closeness and emotional safety",
};
export const MISSING_EL = {
  fire: "Motivation and self-belief may not come automatically. You build them by setting goals and acting before you feel ready.",
  earth: "Practical matters like budgets, routines and follow-through may not come naturally. Simple systems help you a lot.",
  air: "Stepping back to see things objectively, or talking feelings through, may be harder. A journal or a good sounding board helps.",
  water: "Naming and sharing feelings may not come easily. You may need to make room for emotions on purpose.",
};
export const MODE_LIFE = {
  cardinal: "you're a starter: great at launching things, less patient with the long middle",
  fixed: "you're a finisher: steady and determined, but slow to change course",
  mutable: "you're adaptable: good at adjusting and juggling, but sticking with one thing can be hard",
};
export const ASP_PRACT = {
  conjunction: "are fused together, so one rarely shows up without the other",
  sextile: "help each other when you make the effort, a strength you can build on",
  trine: "work together easily, a natural strength you may take for granted",
  square: "pull against each other, a source of tension you learn to manage and grow from",
  opposition: "swing between two sides, so balancing them is a lifelong theme",
};
export const SIGN_PARTNER = {
  Aries: "You're drawn to bold, independent, take-charge partners. Relationships tend to be lively, with sparks and some arguments, and you need an equal.",
  Taurus: "You're drawn to steady, loyal, affectionate partners. You want a relationship that feels secure and comfortable, built over time.",
  Gemini: "You're drawn to witty, curious, talkative partners. Good conversation is essential, and you need variety to stay interested.",
  Cancer: "You're drawn to caring, family-minded partners. You want a relationship that feels like home and emotional safety.",
  Leo: "You're drawn to warm, confident, generous partners who make you feel special. You want romance, loyalty and fun.",
  Virgo: "You're drawn to thoughtful, reliable partners who show love by helping. You can be picky, and you value someone who has their life in order.",
  Libra: "You're drawn to charming, fair, good-looking partners. Partnership matters a lot to you, and you want balance and harmony.",
  Scorpio: "You're drawn to intense, deep, loyal partners. Relationships are all or nothing, with strong chemistry and real questions of trust.",
  Sagittarius: "You're drawn to adventurous, funny, open-minded partners. You need freedom and shared adventures, and you can be wary of feeling tied down.",
  Capricorn: "You're drawn to mature, ambitious, dependable partners, sometimes older. You take commitment seriously, and relationships may start slowly.",
  Aquarius: "You're drawn to independent, unusual, friendly partners. You need a relationship that's also a friendship, with room for both of you.",
  Pisces: "You're drawn to gentle, romantic, creative partners. You want a soulful connection, and you need to watch out for idealizing people.",
};
export const SIGN_CAREER = {
  Aries: "You do best in work where you can lead, compete or start things: running your own thing, sports, emergency services or fast-paced roles.",
  Taurus: "You do best in steady work with tangible results: finance, food, building, design, beauty, or anything you can grow over time.",
  Gemini: "You do best in work full of communication and variety: writing, media, sales, teaching, tech, or anything with lots of contact.",
  Cancer: "You do best in caring or protective work: healthcare, hospitality, real estate, a family business, or roles where you look after people.",
  Leo: "You do best where you can be visible and creative: leadership, entertainment, management, teaching, or anything that earns recognition.",
  Virgo: "You do best in skilled, detail-oriented work: health, analysis, editing, operations, or any job where you improve how things run.",
  Libra: "You do best in work built on people and fairness: law, HR, design, diplomacy, sales or partnership-based work.",
  Scorpio: "You do best in deep, high-stakes work: research, finance, psychology, investigation, medicine, or handling crises.",
  Sagittarius: "You do best in work with freedom and big ideas: travel, education, publishing, law, or anything international.",
  Capricorn: "You do best in structured careers with a ladder to climb: management, government, business, engineering. Success builds over time.",
  Aquarius: "You do best in innovative or group-based work: technology, science, nonprofits, activism, or anything that changes how things are done.",
  Pisces: "You do best in creative, helping or behind-the-scenes work: the arts, healing, counseling, charity, film or music.",
};
export const SIGN_MONEY = {
  Aries: "You earn best through initiative and drive, and you can spend as fast as you earn. Watch impulse buys.",
  Taurus: "You're naturally good at building money slowly and enjoying it. Comfort and quality matter to you.",
  Gemini: "Money often comes from more than one source, often through communication or trade. It can come and go quickly.",
  Cancer: "You save to feel secure and may spend on home and family. Property and family resources can play a role.",
  Leo: "You like to spend generously and enjoy nice things. Income often ties to creativity or being in charge.",
  Virgo: "You're careful and practical with money and earn through skill and service. Budgeting comes naturally.",
  Libra: "Money often flows through partnerships and other people. You spend on beauty and social life.",
  Scorpio: "Money can involve shared resources, investments or big swings. You're private about finances.",
  Sagittarius: "You're optimistic with money, sometimes too much. Income can come through teaching, travel or big opportunities.",
  Capricorn: "You build money through patience and discipline. Financial security tends to grow with age.",
  Aquarius: "Your approach to money is unconventional, and income may come through tech, groups or unusual work.",
  Pisces: "Money can feel hard to pin down, with income from creative or helping work. Clear limits around lending help.",
};
export const SIGN_HOME = {
  Aries: "You want a home where you have independence and room to be active. Home life can be lively.",
  Taurus: "You want a comfortable, stable, good-looking home, and you tend to put down roots.",
  Gemini: "Home is busy and social, and you may move more often than most people.",
  Cancer: "Family and home are central to you. You want a true nest.",
  Leo: "You like a home you're proud of, and you enjoy hosting.",
  Virgo: "You like an orderly, practical home, and you may feel responsible for family duties.",
  Libra: "You want a peaceful, attractive home and dislike conflict there.",
  Scorpio: "Home is private. Family ties run deep and can be intense.",
  Sagittarius: "You may live far from where you grew up, or keep an open, busy household.",
  Capricorn: "You may have taken on family responsibility early. Home is about security and structure.",
  Aquarius: "Your home life is unconventional, and friends can feel like family.",
  Pisces: "You want home to be a calm retreat. Family boundaries can blur.",
};
Object.assign(GLOSS, {
  planhour: ["Planetary hour", "Daylight and night are each split into 12 equal parts, and each part is ruled by a planet in a fixed order. Tradition times actions by the planet of the hour: Venus hours for love, Jupiter hours for money, and so on. In Vedic astrology these are called horas."],
  voc: ["Void-of-course Moon", "The stretch after the Moon makes its last major aspect to a planet and before it changes sign. Tradition says things begun then tend to fizzle or turn out differently than planned."],
  decan: ["Decan", "One of 36 ten-degree slices of the zodiac (three per sign). The idea comes from ancient Egyptian star-clocks. Each decan has a planetary ruler and, in the Golden Dawn system, a tarot card."],
  fixedstar: ["Fixed star", "A star (as opposed to a planet) whose position barely changes over a lifetime. Tradition says a bright star right on one of your planets lends it the star's character."],
  lot: ["Lot", "A calculated point in the chart, made from the distance between two planets measured from the rising sign. Each lot focuses on one topic, such as fortune, marriage or your father."],
  panchanga: ["Panchanga", "The Hindu almanac: five measures of each day (weekday, lunar day, Moon's star, yoga and half-day) used to choose good times."],
  rahukaal: ["Rahu Kaal", "About an eighth of each day's daylight, ruled by the shadow planet Rahu. Tradition avoids starting anything important in it."],
  vyoga: ["Yoga (combination)", "In a birth chart, a yoga is a specific planetary combination that classic Vedic texts link with a particular result, like wealth or fame. (In the daily almanac, 'yoga' also means one of 27 parts of the day.)"],
  drekkana: ["Drekkana", "The Vedic version of the decan: each sign split into three 10° parts, each linked to a sign of the same element."],
  eclipse: ["Eclipse", "When the Sun, Moon and Earth line up near the Moon's nodes. Ancient astrologers treated eclipses as the most important sky events and watched where they fell in a person's chart."],
});
