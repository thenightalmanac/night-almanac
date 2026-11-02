"""Runs the engine on a sample (made-up) birth and prints a readable summary.
Usage: python3 sample_report.py  -> writes sample_report.txt and sample_data.json
"""
import json
from datetime import datetime, timezone

import astro_engine as ae


def ordinal(n):
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"

SAMPLE = ae.BirthData(1990, 6, 15, 14, 30, lat=40.7128, lon=-74.006,
                      time_reliability="certificate")   # made-up person, New York, NY
ON = datetime(2026, 10, 28, tzinfo=timezone.utc)

d = ae.full_reading_data(SAMPLE, ON)
w, v, kp = d["western"], d["vedic"], d["kp"]
L = []
add = L.append

add("SAMPLE CHART — made-up birth: 15 Jun 1990, 2:30 PM, New York, NY")
add(f"UTC {d['birth']['utc']} · birth time reliability: {d['birth']['time_reliability']}")
add(f"Engine: {d['engine']['ephemeris']} ephemeris, Swiss Ephemeris {d['engine']['swisseph_version']}")
add("")
add("=== WESTERN (tropical) ===")
add(f"Ascendant {w['ascendant']} · Midheaven {w['midheaven']} · {w['sect']} chart")
for n, p in w["planets"].items():
    if n == "Ketu":
        continue
    add(f"  {n:8} {p['position']:20} house {p['house_whole_sign']:>2} (whole sign)"
        f"{'  Rx' if p['retrograde'] else ''}")
add("Tightest aspects: " + "; ".join(
    f"{a['between'][0]} {a['aspect']} {a['between'][1]} ({a['orb']}°)"
    for a in w["aspects"][:5]))
add("")
pr = d["profection"]
add(f"=== PROFECTION (as of {ON.date()}) ===")
add(f"Age {pr['age']} → {ordinal(pr['profected_house'])} house year, {pr['profected_sign']}. "
    f"Lord of the year: {pr['lord_of_year']} (natally {pr['lord_natal_position']}, "
    f"house {pr['lord_natal_house_whole_sign']})")
add("")
add("=== LOTS (Hermetic, Paulus) ===")
for n, lt in d["lots"].items():
    add(f"  {n:10} {lt['position']:20} house {lt['house_whole_sign']}")
add("")
for key, label in (("zr_spirit_current", "Spirit (career/action)"),
                   ("zr_fortune_current", "Fortune (body/circumstances)")):
    z = d[key]
    add(f"=== ZODIACAL RELEASING from {label} — current ===")
    l1, l2 = z["level1"], z["level2"]
    add(f"  L1: {l1['sign']} {l1['start']} → {l1['end']}"
        f"{'  [angular from Fortune: ' + l1['angular_from_fortune'] + ']' if l1['angular_from_fortune'] else ''}")
    add(f"  L2: {l2['sign']} {l2['start']} → {l2['end']}"
        f"{'  [PEAK: ' + l2['angular_from_fortune'] + ' from Fortune]' if l2['angular_from_fortune'] else ''}"
        f"{'  [LOOSING OF THE BOND]' if l2['loosing_of_the_bond'] else ''}")
add("")
add(f"=== {v['system'].upper()} ===")
add(f"Ayanamsa {v['ayanamsa']}° · Lagna {v['lagna']} ({v['lagna_nakshatra']['nakshatra']})")
for n, p in v["planets"].items():
    add(f"  {n:8} {p['position']:20} house {p['house']:>2}  "
        f"{p['nakshatra']} pada {p['pada']}{'  Rx' if p['retrograde'] else ''}")
cur = v["vimshottari"]["current"]
ad = next(a for a in cur["antardashas"] if a["current"])
add(f"Current dasha: {cur['mahadasha']} mahadasha ({cur['start']} → {cur['end']}), "
    f"{ad['antardasha']} antardasha ({ad['start']} → {ad['end']})")
add("")
add(f"=== KP ({kp['system']}, ayanamsa {kp['ayanamsa']}°) ===")
add("  Cusp  Position             Sign   Star     Sub")
for c in kp["cusps"]:
    add(f"  {c['house']:>4}  {c['position']:20} {c['sign_lord']:7} {c['star_lord']:8} {c['sub_lord']}")
add("  Planet   Position             House Star     Sub")
for n, p in kp["planets"].items():
    add(f"  {n:8} {p['position']:20} {p['house']:>5} {p['star_lord']:8} {p['sub_lord']}")
s7 = kp["significators"][7]
add(f"7th cusp sub lord: {kp['cusps'][6]['sub_lord']} · 7th house significators: "
    f"A {s7['A_in_star_of_occupants']}, B {s7['B_occupants']}, "
    f"C {s7['C_in_star_of_owner']}, D {s7['D_owner']}")
add("")
h = ae.kp_horary(108, 40.7128, -74.006, ON)
add(f"=== KP HORARY example: number 108, judged {h['judged_at_utc']} in New York ===")
add(f"Ascendant from number: {h['ascendant_from_number']} · "
    f"Asc star lord {h['cusps'][0]['star_lord']}, sub lord {h['cusps'][0]['sub_lord']}")

text = "\n".join(L)
print(text)
open("sample_report.txt", "w").write(text + "\n")
json.dump(d, open("sample_data.json", "w"), indent=1, default=str)
