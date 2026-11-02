// Builds one self-contained night-almanac.html: template + inlined wasm + bundled JS.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

const res = await build({ entryPoints: ["app.js"], bundle: true, format: "esm", minify: true,
  write: false, target: "es2020", logLevel: "warning" });
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const wasm = readFileSync("node_modules/sweph-wasm/dist/wasm/swisseph.wasm").toString("base64");
// Fonts are embedded (no Google Fonts request: keeps visitors' IP addresses private; SIL Open Font License).
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const face = (fam, dir, w, st) => ["latin", "latin-ext"].map((sub) => `@font-face{font-family:"${fam}";font-style:${st};font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/${dir}/files/${dir}-${sub}-${w}-${st}.woff2`).toString("base64")}) format("woff2");unicode-range:${sub === "latin" ? LATIN : LATIN_EXT}}`).join("");
const fonts = [[500, "normal"], [600, "normal"], [700, "normal"], [500, "italic"], [600, "italic"]].map(([w, s]) => face("Cormorant Garamond", "cormorant-garamond", w, s)).join("")
  + [400, 500, 600].map((w) => face("Jost", "jost", w, "normal")).join("");
const html = readFileSync("template.html", "utf8").replace("/*__FONTS__*/", fonts) +
  `\n<script>window.__SWE_WASM_B64="${wasm}";window.__WORLD_PATH=${JSON.stringify(readFileSync("worldpath.txt","utf8"))};window.__CITIES_B64="${readFileSync("cities.b64","utf8")}";</script>\n<script type="module">${js}</script>\n`;
writeFileSync("app-body.html", html); // fragment, wrapped by build-site.mjs for the website
// Standalone file (desktop app and download): a complete document, so it renders in standards mode.
writeFileSync("night-almanac.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${html}
</body>
</html>
`);
console.log(`night-almanac.html: ${(html.length / 1024).toFixed(0)} KB`);
