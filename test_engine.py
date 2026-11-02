"""Checks the engine against independently known values."""
from datetime import datetime, timezone

import swisseph as swe
import astro_engine as ae


def check(label, ok, detail=""):
    print(f"[{'PASS' if ok else 'FAIL'}] {label} {detail}")
    return ok


results = []

# 1. March equinox 2000-03-20 07:35 UT -> Sun at 0° Aries
jd = ae.jd_from_utc(datetime(2000, 3, 20, 7, 35, tzinfo=timezone.utc))
sun = ae.planet_positions(jd)["Sun"]["lon"]
results.append(check("Equinox 2000: Sun ~0° Aries",
                     abs(ae.angdiff(sun, 0)) < 0.01, f"({sun:.4f}°)"))

# 2. December solstice 2020-12-21 10:02 UT -> Sun at 0° Capricorn (270°)
jd = ae.jd_from_utc(datetime(2020, 12, 21, 10, 2, tzinfo=timezone.utc))
sun = ae.planet_positions(jd)["Sun"]["lon"]
results.append(check("Solstice 2020: Sun ~0° Capricorn",
                     abs(ae.angdiff(sun, 270)) < 0.01, f"({sun:.4f}°)"))

# 3. Great conjunction 2020-12-21 ~18:20 UT, at ~0°29' Aquarius
jd = ae.jd_from_utc(datetime(2020, 12, 21, 18, 20, tzinfo=timezone.utc))
p = ae.planet_positions(jd)
sep = abs(ae.angdiff(p["Jupiter"]["lon"], p["Saturn"]["lon"]))
results.append(check("Great conjunction 2020: Jupiter = Saturn ~0°29' Aqu",
                     sep < 0.02 and abs(p["Jupiter"]["lon"] - 300.48) < 0.1,
                     f"(Jup {ae.fmt_deg(p['Jupiter']['lon'])}, sep {sep:.4f}°)"))

# 4. Lahiri ayanamsa at J2000 ~23°51' (23.85°)
aya = ae.ayanamsa(2451545.0, swe.SIDM_LAHIRI)
results.append(check("Lahiri ayanamsa at J2000 ~23.85°",
                     abs(aya - 23.85) < 0.02, f"({aya:.4f}°)"))

# 5. KP table: 249 subs, contiguous, covering 0-360
t = ae.KP_TABLE
contig = all(abs(t[i]["end"] - t[i + 1]["start"]) < 1e-9 for i in range(len(t) - 1))
results.append(check("KP table has 249 subs, contiguous 0-360",
                     len(t) == 249 and contig and abs(t[-1]["end"] - 360) < 1e-9,
                     f"({len(t)} rows)"))
results.append(check("KP #1 = Aries 0°, Ketu star, Ketu sub",
                     t[0]["star_lord"] == "Ketu" and t[0]["sub_lord"] == "Ketu"))

# 6. ZR level-2 full cycle = 211 months; dashas = 120 years
results.append(check("ZR sign periods sum to 211", sum(ae.ZR_YEARS) == 211))
results.append(check("Vimshottari sums to 120",
                     sum(ae.DASHA_YEARS.values()) == 120))

# 7. KP horary: Ascendant lands on the chosen number's sub
h = ae.kp_horary(108, 30.2672, -97.7431,
                 datetime(2026, 10, 28, 23, 0, tzinfo=timezone.utc))
results.append(check("KP horary #108 puts Ascendant in sub #108",
                     h["cusps"][0]["kp_number"] == 108,
                     f"(Asc {h['ascendant_from_number']})"))

# 8. Loosing of the bond appears in a long L1 period (Cancer 25 yrs > 211 mo)
b = ae.BirthData(1990, 6, 15, 14, 30, 30.2672, -97.7431)
zr = ae.zodiacal_releasing(b, "Spirit", 120)
loosed = [(p1["sign"], p2["sign"], p2["start"]) for p1 in zr["level1"]
          if p1["years"] * 12 > 211
          for p2 in p1["level2"] if p2["loosing_of_the_bond"]]
long_periods = [p1["sign"] for p1 in zr["level1"] if p1["years"] * 12 > 211]
ok = all(any(l[0] == s for l in loosed) for s in long_periods)
ok = ok and all(ae.SIGNS.index(l[1]) == (ae.SIGNS.index(l[0]) + 6) % 12 for l in loosed)
results.append(check("Loosing of the bond jumps to opposite sign in long periods",
                     ok, f"({len(loosed)} found)"))

print(f"\n{sum(results)}/{len(results)} checks passed")
