import "./shim.mjs";
import SwissEPH from "sweph-wasm";
import { readFileSync } from "node:fs";
import * as E from "./engine.js";
E.setSwe(await SwissEPH.init());
const ref = JSON.parse(readFileSync("/tmp/claude-0/ref.json"));
const on = Date.UTC(2026, 9, 28);
let fails = 0, checks = 0;
const ok = (c, label) => { checks++; if (!c) { fails++; console.log("FAIL", label); } };
const near = (a, b, tol = 0.001) => Math.abs(E.angdiff(a, b)) < tol;
for (const r of ref) {
  const [y,m,d,h,mi,lat,lon,tz] = r.case;
  const c = E.computeChart({ y,m,d,h,mi,lat,lon,tz });
  const tag = `${y}-${m}-${d} ${tz}`;
  ok(near(c.western.asc, r.asc), tag+" asc"); ok(near(c.western.mc, r.mc), tag+" mc");
  ok(c.western.sect === r.sect, tag+" sect");
  for (const [k,v] of Object.entries(r.planets)) ok(near(c.western.planets[k].lon, v), tag+" "+k);
  for (const [k,v] of Object.entries(r.lots)) ok(near(c.lots[k].lon, v), tag+" lot "+k);
  for (const [k,v] of Object.entries(r.vedic)) ok(near(c.vedic.planets[k].lon, v), tag+" vedic "+k);
  ok(near(c.vedic.lagna, r.lagna), tag+" lagna");
  r.kp_cusps.forEach((x,i)=>{ const cc=c.kp.cusps[i]; ok(cc.signLord===x[0]&&cc.starLord===x[1]&&cc.subLord===x[2], tag+" kp cusp "+(i+1)); });
  for (const [k,x] of Object.entries(r.kp_planets)) { const p=c.kp.planets[k]; ok(p.house===x[0]&&p.starLord===x[1]&&p.subLord===x[2], tag+" kp "+k+` js:${p.house},${p.starLord},${p.subLord} py:${x}`); }
  const pr = E.profection(c, on); ok(pr.age===r.prof[0]&&pr.house===r.prof[1]&&pr.lord===r.prof[2], tag+" profection");
  for (const [lotName, key] of [["Spirit","zrs"],["Fortune","zrf"]]) {
    const z = E.zrAt(E.zodiacalReleasing(c, lotName), on);
    ok(z.l1.sign===r[key][0]&&z.l2.sign===r[key][1]&&E.isoDate(z.l2.start)===r[key][2], tag+" zr "+lotName+` js:${z.l1.sign},${z.l2.sign},${E.isoDate(z.l2.start)} py:${r[key]}`);
  }
  const da = E.dashaAt(E.vimshottari(c), on);
  ok(da.md.lord===r.dasha[0]&&da.ad.lord===r.dasha[1]&&E.isoDate(da.ad.start)===r.dasha[2], tag+` dasha js:${da.md.lord},${da.ad.lord},${E.isoDate(da.ad.start)} py:${r.dasha}`);
}
const hor = JSON.parse(readFileSync("/tmp/claude-0/hor.json"));
const H = E.kpHorary(108, 30.2672, -97.7431, Date.UTC(2026,9,28,23,0));
hor.forEach((x,i)=>{ const cc=H.cusps[i]; ok(cc.signLord===x[0]&&cc.starLord===x[1]&&cc.subLord===x[2], "horary cusp "+(i+1)); });
ok(E.KP_TABLE.length===249, "kp table");
console.log(`${checks-fails}/${checks} parity checks passed`);
