import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoEquirectangular, geoPath } from "d3-geo";
const topo = JSON.parse(readFileSync("node_modules/world-atlas/land-110m.json"));
const land = feature(topo, topo.objects.land);
const proj = geoEquirectangular().scale(720 / (2 * Math.PI)).translate([360, 180]);
const d = geoPath(proj).digits(1)(land);
writeFileSync("worldpath.txt", d);
console.log("path bytes", d.length);
