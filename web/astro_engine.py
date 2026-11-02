"""
astro_engine.py — calculation engine for the astrology reading app.

Computes (no interpretation — that is the chatbot's job):
  * Western chart  : tropical zodiac, Placidus + whole-sign houses, sect
  * Vedic chart    : sidereal (Lahiri), whole-sign houses, nakshatras
  * Annual profections (Western) + lord of the year
  * Hermetic lots  : Fortune, Spirit, Eros, Necessity, Courage, Victory, Nemesis
  * Zodiacal releasing (levels 1 and 2) from Spirit or Fortune, with
    peak periods and loosing of the bond
  * Krishnamurti Paddhati (KP): star/sub lords for planets and cusps,
    house significators, and KP horary from a number 1-249
  * Vimshottari dashas (mahadasha + antardasha)

Engine: Swiss Ephemeris via pyswisseph. Licensed AGPL for open-source use;
a closed-source release needs Astrodienst's professional license.

Conventions (each is a setting someone could reasonably choose differently;
they are documented here so results are checkable):
  * Ephemeris: built-in Moshier mode (~0.1" planets, ~3" Moon) unless
    ephemeris files are placed in ./ephe
  * Lunar nodes: mean node
  * Lot formulas: Paulus Alexandrinus (Hermetic lots), reversed at night
  * ZR time units: 360-day years (L1) and 30-day months (L2), per Valens
  * Vimshottari year: 365.25 days
"""

from __future__ import annotations

import bisect
import math
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import swisseph as swe
from timezonefinder import TimezoneFinder

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra",
         "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

# Traditional (pre-modern) sign rulers, used by profections, lots, ZR and KP
RULERS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus",
          "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"]

PLANETS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY,
    "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN, "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO, "Rahu": swe.MEAN_NODE,
}
CLASSICAL = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]
VEDIC_GRAHAS = CLASSICAL + ["Rahu", "Ketu"]

# Zodiacal releasing period lengths per sign (Valens)
ZR_YEARS = [15, 8, 20, 25, 19, 20, 8, 15, 12, 27, 30, 12]

# Vimshottari dasha order and years
DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
               "Jupiter", "Saturn", "Mercury"]
DASHA_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
               "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}

NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
              "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
              "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra",
              "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
              "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
              "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
              "Revati"]
NAK_SPAN = 360.0 / 27.0  # 13°20'

ZR_YEAR_DAYS = 360.0
ZR_MONTH_DAYS = 30.0
DASHA_YEAR_DAYS = 365.25

_EPHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ephe")
if os.path.isdir(_EPHE_DIR):
    swe.set_ephe_path(_EPHE_DIR)
    EPH_FLAG = swe.FLG_SWIEPH
else:
    EPH_FLAG = swe.FLG_MOSEPH

_tf = TimezoneFinder()


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def norm(x: float) -> float:
    return x % 360.0


def sign_index(lon: float) -> int:
    return int(norm(lon) // 30)


def fmt_deg(lon: float) -> str:
    """234.5 -> '24°30' Scorpio'"""
    lon = norm(lon)
    d_in_sign = lon % 30
    deg = int(d_in_sign)
    minutes = int(round((d_in_sign - deg) * 60))
    if minutes == 60:
        deg, minutes = deg + 1, 0
    return f"{deg}°{minutes:02d}' {SIGNS[sign_index(lon)]}"


def angdiff(a: float, b: float) -> float:
    """signed shortest difference a-b in (-180, 180]"""
    d = (a - b) % 360.0
    return d - 360.0 if d > 180 else d


# --------------------------------------------------------------------------
# Birth data / time handling
# --------------------------------------------------------------------------

@dataclass
class BirthData:
    year: int
    month: int
    day: int
    hour: int
    minute: int
    lat: float
    lon: float
    tz: str | None = None              # IANA name; looked up from lat/lon if None
    time_reliability: str = "unknown"  # "certificate", "family memory", "unknown"

    def tzname(self) -> str:
        return self.tz or _tf.timezone_at(lat=self.lat, lng=self.lon) or "UTC"

    def utc(self) -> datetime:
        local = datetime(self.year, self.month, self.day, self.hour,
                         self.minute, tzinfo=ZoneInfo(self.tzname()))
        return local.astimezone(timezone.utc)


def jd_from_utc(dt: datetime) -> float:
    dt = dt.astimezone(timezone.utc)
    h = dt.hour + dt.minute / 60 + dt.second / 3600 + dt.microsecond / 3.6e9
    return swe.julday(dt.year, dt.month, dt.day, h)


def utc_from_jd(jd: float) -> datetime:
    y, m, d, h = swe.revjul(jd)
    return datetime(y, m, d, tzinfo=timezone.utc) + timedelta(hours=h)


# --------------------------------------------------------------------------
# Core positions
# --------------------------------------------------------------------------

def planet_positions(jd: float, sidereal_mode: int | None = None) -> dict:
    flags = EPH_FLAG | swe.FLG_SPEED
    if sidereal_mode is not None:
        swe.set_sid_mode(sidereal_mode)
        flags |= swe.FLG_SIDEREAL
    out = {}
    for name, pid in PLANETS.items():
        (lon, lat, dist, speed, *_), _ = swe.calc_ut(jd, pid, flags)
        out[name] = {"lon": lon, "lat": lat, "dist": dist, "speed": speed,
                     "retrograde": speed < 0}
    rahu = out["Rahu"]
    out["Ketu"] = {"lon": norm(rahu["lon"] + 180), "lat": -rahu["lat"],
                   "dist": rahu["dist"], "speed": rahu["speed"],
                   "retrograde": rahu["retrograde"]}
    return out


def house_cusps(jd: float, lat: float, lon: float,
                sidereal_mode: int | None = None, hsys: bytes = b"P"):
    flags = EPH_FLAG
    if sidereal_mode is not None:
        swe.set_sid_mode(sidereal_mode)
        flags |= swe.FLG_SIDEREAL
    cusps, ascmc = swe.houses_ex(jd, lat, lon, hsys, flags)
    return list(cusps[:12]), {"asc": ascmc[0], "mc": ascmc[1]}


def is_day_chart(jd: float, lat: float, lon: float) -> bool:
    (slon, slat, sdist, *_), _ = swe.calc_ut(jd, swe.SUN, EPH_FLAG)
    _, alt_true, _ = swe.azalt(jd, swe.ECL2HOR, (lon, lat, 0), 0, 0,
                               (slon, slat, sdist))
    return alt_true > 0


def placidus_house_of(lon: float, cusps: list[float]) -> int:
    for i in range(12):
        a, b = cusps[i], cusps[(i + 1) % 12]
        if (norm(lon - a) < norm(b - a)):
            return i + 1
    return 12


def whole_sign_house_of(lon: float, asc: float) -> int:
    return (sign_index(lon) - sign_index(asc)) % 12 + 1


def ayanamsa(jd: float, mode: int) -> float:
    swe.set_sid_mode(mode)
    return swe.get_ayanamsa_ut(jd)


# --------------------------------------------------------------------------
# Western chart
# --------------------------------------------------------------------------

def western_chart(b: BirthData) -> dict:
    jd = jd_from_utc(b.utc())
    pos = planet_positions(jd)
    cusps, ang = house_cusps(jd, b.lat, b.lon)
    day = is_day_chart(jd, b.lat, b.lon)
    planets = {}
    for name, p in pos.items():
        planets[name] = {
            "position": fmt_deg(p["lon"]), "lon": round(p["lon"], 4),
            "sign": SIGNS[sign_index(p["lon"])],
            "house_placidus": placidus_house_of(p["lon"], cusps),
            "house_whole_sign": whole_sign_house_of(p["lon"], ang["asc"]),
            "retrograde": p["retrograde"],
        }
    return {
        "system": "Western (tropical)",
        "jd_ut": jd,
        "sect": "day" if day else "night",
        "ascendant": fmt_deg(ang["asc"]), "asc_lon": ang["asc"],
        "midheaven": fmt_deg(ang["mc"]), "mc_lon": ang["mc"],
        "placidus_cusps": [fmt_deg(c) for c in cusps],
        "planets": planets,
        "aspects": aspects(pos),
    }


ASPECTS = {"conjunction": (0, 8), "sextile": (60, 4), "square": (90, 7),
           "trine": (120, 7), "opposition": (180, 8)}


def aspects(pos: dict) -> list[dict]:
    names = [n for n in pos if n not in ("Rahu", "Ketu")]
    found = []
    for i, a in enumerate(names):
        for bname in names[i + 1:]:
            sep = abs(angdiff(pos[a]["lon"], pos[bname]["lon"]))
            for asp, (angle, orb) in ASPECTS.items():
                if abs(sep - angle) <= orb:
                    found.append({"between": [a, bname], "aspect": asp,
                                  "orb": round(abs(sep - angle), 2)})
    return sorted(found, key=lambda x: x["orb"])


# --------------------------------------------------------------------------
# Profections
# --------------------------------------------------------------------------

def profection(b: BirthData, on: datetime | None = None) -> dict:
    on = on or datetime.now(timezone.utc)
    born = b.utc()
    age = on.year - born.year - ((on.month, on.day) < (born.month, born.day))
    chart = western_chart(b)
    asc_sign = sign_index(chart["asc_lon"])
    house = age % 12 + 1
    sign = (asc_sign + age) % 12
    lord = RULERS[sign]
    lord_info = chart["planets"][lord]
    return {
        "age": age, "profected_house": house, "profected_sign": SIGNS[sign],
        "lord_of_year": lord,
        "lord_natal_position": lord_info["position"],
        "lord_natal_house_whole_sign": lord_info["house_whole_sign"],
        "note": "Whole-sign houses from the Ascendant; advances one sign "
                "per birthday.",
    }


# --------------------------------------------------------------------------
# Lots (Hermetic lots of Paulus Alexandrinus)
# --------------------------------------------------------------------------

def lots(b: BirthData) -> dict:
    c = western_chart(b)
    p = {k: v["lon"] for k, v in c["planets"].items()}
    asc, day = c["asc_lon"], c["sect"] == "day"

    def lot(x, y):  # Asc + x - y by day, reversed by night
        return norm(asc + x - y) if day else norm(asc + y - x)

    fortune = lot(p["Moon"], p["Sun"])
    spirit = lot(p["Sun"], p["Moon"])
    raw = {
        "Fortune": fortune,
        "Spirit": spirit,
        "Eros": lot(p["Venus"], spirit),
        "Necessity": lot(fortune, p["Mercury"]),
        "Courage": lot(fortune, p["Mars"]),
        "Victory": lot(p["Jupiter"], spirit),
        "Nemesis": lot(fortune, p["Saturn"]),
    }
    return {name: {"position": fmt_deg(v), "lon": round(v, 4),
                   "sign": SIGNS[sign_index(v)],
                   "house_whole_sign": whole_sign_house_of(v, asc)}
            for name, v in raw.items()}


# --------------------------------------------------------------------------
# Zodiacal releasing
# --------------------------------------------------------------------------

def _angular_from(sign: int, ref_sign: int) -> str | None:
    pos = (sign - ref_sign) % 12 + 1
    return {1: "1st", 4: "4th", 7: "7th", 10: "10th (strongest)"}.get(pos)


def zodiacal_releasing(b: BirthData, from_lot: str = "Spirit",
                       years: int = 90) -> dict:
    lt = lots(b)
    start_sign = sign_index(lt[from_lot]["lon"])
    fortune_sign = sign_index(lt["Fortune"]["lon"])
    born = b.utc()
    end_limit = born + timedelta(days=years * 365.25)

    level1 = []
    t, s = born, start_sign
    while t < end_limit:
        length = timedelta(days=ZR_YEARS[s] * ZR_YEAR_DAYS)
        l1_end = t + length
        subs, st, ss, jumped = [], t, s, False
        while st < l1_end:
            sub_len = timedelta(days=ZR_YEARS[ss] * ZR_MONTH_DAYS)
            sub_end = min(st + sub_len, l1_end)
            subs.append({"sign": SIGNS[ss], "start": st.date().isoformat(),
                         "end": sub_end.date().isoformat(),
                         "angular_from_fortune": _angular_from(ss, fortune_sign),
                         "loosing_of_the_bond": jumped})
            st, jumped = sub_end, False
            nxt = (ss + 1) % 12
            if nxt == s:            # cycle completed: jump to opposite sign
                nxt, jumped = (s + 6) % 12, True
            ss = nxt
        level1.append({"sign": SIGNS[s], "start": t.date().isoformat(),
                       "end": l1_end.date().isoformat(),
                       "years": ZR_YEARS[s],
                       "angular_from_fortune": _angular_from(s, fortune_sign),
                       "level2": subs})
        t, s = l1_end, (s + 1) % 12
    return {"from_lot": from_lot, "lot_sign": SIGNS[start_sign],
            "fortune_sign": SIGNS[fortune_sign],
            "units": "L1 = sign years x 360 days; L2 = sign years x 30 days",
            "level1": level1}


def zr_current(zr: dict, on: datetime | None = None) -> dict:
    d = (on or datetime.now(timezone.utc)).date().isoformat()
    for p1 in zr["level1"]:
        if p1["start"] <= d < p1["end"]:
            for p2 in p1["level2"]:
                if p2["start"] <= d < p2["end"]:
                    return {"level1": {k: p1[k] for k in p1 if k != "level2"},
                            "level2": p2}
    return {}


# --------------------------------------------------------------------------
# Vedic chart
# --------------------------------------------------------------------------

def nakshatra_of(lon: float) -> dict:
    lon = norm(lon)
    n = int(lon // NAK_SPAN)
    pada = int((lon - n * NAK_SPAN) // (NAK_SPAN / 4)) + 1
    return {"nakshatra": NAKSHATRAS[n], "pada": pada,
            "lord": DASHA_ORDER[n % 9]}


def vedic_chart(b: BirthData, mode: int = swe.SIDM_LAHIRI) -> dict:
    jd = jd_from_utc(b.utc())
    pos = planet_positions(jd, mode)
    _, ang = house_cusps(jd, b.lat, b.lon, mode)
    asc = ang["asc"]
    planets = {}
    for name in VEDIC_GRAHAS:
        p = pos[name]
        planets[name] = {"position": fmt_deg(p["lon"]),
                         "lon": round(p["lon"], 4),
                         "sign": SIGNS[sign_index(p["lon"])],
                         "house": whole_sign_house_of(p["lon"], asc),
                         "retrograde": p["retrograde"],
                         **nakshatra_of(p["lon"])}
    return {"system": "Vedic (sidereal, Lahiri ayanamsa, whole-sign houses)",
            "ayanamsa": round(ayanamsa(jd, mode), 4),
            "lagna": fmt_deg(asc), "lagna_lon": asc,
            "lagna_nakshatra": nakshatra_of(asc),
            "planets": planets,
            "vimshottari": vimshottari(b, pos["Moon"]["lon"])}


def vimshottari(b: BirthData, moon_sid_lon: float,
                on: datetime | None = None) -> dict:
    on = on or datetime.now(timezone.utc)
    n = int(norm(moon_sid_lon) // NAK_SPAN)
    first = n % 9
    frac = (norm(moon_sid_lon) - n * NAK_SPAN) / NAK_SPAN
    yr = timedelta(days=DASHA_YEAR_DAYS)
    born = b.utc()
    t = born - yr * (DASHA_YEARS[DASHA_ORDER[first]] * frac)
    periods, current = [], None
    for k in range(9):
        lord = DASHA_ORDER[(first + k) % 9]
        end = t + yr * DASHA_YEARS[lord]
        md = {"mahadasha": lord, "start": t.date().isoformat(),
              "end": end.date().isoformat()}
        periods.append(md)
        if t <= on < end:
            sub_t, ads = t, []
            for j in range(9):
                al = DASHA_ORDER[(first + k + j) % 9]
                a_end = sub_t + yr * (DASHA_YEARS[lord] * DASHA_YEARS[al] / 120)
                ads.append({"antardasha": al, "start": sub_t.date().isoformat(),
                            "end": a_end.date().isoformat(),
                            "current": sub_t <= on < a_end})
                sub_t = a_end
            current = {**md, "antardashas": ads}
        t = end
    return {"balance_at_birth_years": round(
                DASHA_YEARS[DASHA_ORDER[first]] * (1 - frac), 3),
            "mahadashas": periods, "current": current}


# --------------------------------------------------------------------------
# Krishnamurti Paddhati (KP)
# --------------------------------------------------------------------------

def _build_kp_table() -> list[dict]:
    rows = []
    for n in range(27):
        start = n * NAK_SPAN
        first = n % 9
        for k in range(9):
            sub = DASHA_ORDER[(first + k) % 9]
            span = NAK_SPAN * DASHA_YEARS[sub] / 120.0
            end = start + span
            # split a sub that crosses a sign boundary
            boundary = (math.floor(start / 30 + 1e-9) + 1) * 30
            pieces = [(start, boundary), (boundary, end)] \
                if start < boundary - 1e-9 and end > boundary + 1e-9 \
                else [(start, end)]
            for a, z in pieces:
                rows.append({"start": a, "end": z,
                             "sign": SIGNS[sign_index(a + 1e-9)],
                             "sign_lord": RULERS[sign_index(a + 1e-9)],
                             "star_lord": DASHA_ORDER[first],
                             "sub_lord": sub})
            start = end
    for i, r in enumerate(rows, 1):
        r["number"] = i
    return rows


KP_TABLE = _build_kp_table()
_KP_STARTS = [r["start"] for r in KP_TABLE]


def kp_lords(lon: float) -> dict:
    r = KP_TABLE[bisect.bisect_right(_KP_STARTS, norm(lon) + 1e-12) - 1]
    return {"sign_lord": r["sign_lord"], "star_lord": r["star_lord"],
            "sub_lord": r["sub_lord"], "kp_number": r["number"]}


def _kp_from_positions(pos: dict, cusps: list[float]) -> dict:
    planets = {}
    for name in VEDIC_GRAHAS:
        lon = pos[name]["lon"]
        planets[name] = {"position": fmt_deg(lon), "lon": round(lon, 4),
                         "house": placidus_house_of(lon, cusps),
                         "retrograde": pos[name]["retrograde"],
                         **kp_lords(lon)}
    cusp_rows = [{"house": i + 1, "position": fmt_deg(c), "lon": round(c, 4),
                  **kp_lords(c)} for i, c in enumerate(cusps)]

    # Significators, strongest first: A star of occupant, B occupant,
    # C star of owner, D owner
    sig = {}
    for h in range(1, 13):
        occupants = [n for n, p in planets.items() if p["house"] == h]
        owner = cusp_rows[h - 1]["sign_lord"]
        a = [n for n, p in planets.items() if p["star_lord"] in occupants]
        c = [n for n, p in planets.items() if p["star_lord"] == owner]
        sig[h] = {"A_in_star_of_occupants": a, "B_occupants": occupants,
                  "C_in_star_of_owner": c, "D_owner": owner}
    return {"planets": planets, "cusps": cusp_rows, "significators": sig}


def kp_chart(b: BirthData) -> dict:
    jd = jd_from_utc(b.utc())
    mode = swe.SIDM_KRISHNAMURTI
    pos = planet_positions(jd, mode)
    cusps, _ = house_cusps(jd, b.lat, b.lon, mode, b"P")
    out = _kp_from_positions(pos, cusps)
    out.update({"system": "KP (sidereal, KP ayanamsa, Placidus)",
                "ayanamsa": round(ayanamsa(jd, mode), 4)})
    return out


def kp_horary(number: int, lat: float, lon: float,
              when: datetime | None = None) -> dict:
    """KP horary: the querent's number (1-249) fixes the Ascendant;
    planets are taken for the moment and place of judgment."""
    if not 1 <= number <= 249:
        raise ValueError("KP horary number must be 1-249")
    when = when or datetime.now(timezone.utc)
    jd = jd_from_utc(when)
    mode = swe.SIDM_KRISHNAMURTI
    aya = ayanamsa(jd, mode)
    target_trop = norm(KP_TABLE[number - 1]["start"] + aya + 1e-7)
    eps = swe.calc_ut(jd, swe.ECL_NUT, EPH_FLAG)[0][0]

    def asc_of(armc):
        return swe.houses_armc(armc, lat, eps, b"P")[1][0]

    # find ARMC giving the target Ascendant: scan then bisect
    prev = angdiff(asc_of(0.0), target_trop)
    lo = hi = None
    for step in range(1, 361):
        cur = angdiff(asc_of(float(step)), target_trop)
        if prev < 0 <= cur and cur - prev < 180:
            lo, hi = float(step - 1), float(step)
            break
        prev = cur
    if lo is None:
        raise RuntimeError("Could not solve Ascendant (polar latitude?)")
    for _ in range(60):
        mid = (lo + hi) / 2
        if angdiff(asc_of(mid), target_trop) < 0:
            lo = mid
        else:
            hi = mid
    cusps_trop = swe.houses_armc((lo + hi) / 2, lat, eps, b"P")[0][:12]
    cusps = [norm(c - aya) for c in cusps_trop]
    pos = planet_positions(jd, mode)
    out = _kp_from_positions(pos, cusps)
    out.update({"system": "KP horary", "number": number,
                "judged_at_utc": when.isoformat(timespec="minutes"),
                "ascendant_from_number": fmt_deg(cusps[0])})
    return out


# --------------------------------------------------------------------------
# One call for everything
# --------------------------------------------------------------------------

def full_reading_data(b: BirthData, on: datetime | None = None) -> dict:
    """Everything the chatbot needs, as plain data."""
    zr_spirit = zodiacal_releasing(b, "Spirit")
    zr_fortune = zodiacal_releasing(b, "Fortune")
    return {
        "birth": {"local": f"{b.year:04d}-{b.month:02d}-{b.day:02d} "
                           f"{b.hour:02d}:{b.minute:02d} ({b.tzname()})",
                  "utc": b.utc().isoformat(timespec="minutes"),
                  "lat": b.lat, "lon": b.lon,
                  "time_reliability": b.time_reliability},
        "western": western_chart(b),
        "profection": profection(b, on),
        "lots": lots(b),
        "zr_spirit_current": zr_current(zr_spirit, on),
        "zr_fortune_current": zr_current(zr_fortune, on),
        "vedic": vedic_chart(b),
        "kp": kp_chart(b),
        "engine": {"ephemeris": "Swiss Ephemeris files" if EPH_FLAG ==
                   swe.FLG_SWIEPH else "Moshier (built-in)",
                   "swisseph_version": swe.version},
    }
