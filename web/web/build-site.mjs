// Builds the public website into ../docs (for GitHub Pages: Settings > Pages > branch main, folder /docs).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
const app = readFileSync("app-body.html", "utf8");
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Plain-language astrology readings from your real birth chart: daily, weekly and yearly forecasts for love, career and more, in Western and Vedic astrology. Private: your data never leaves your device.">
<meta name="theme-color" content="#2d1d33">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Night Almanac">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
const tail = `
<script>if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>
</body>
</html>
`;
mkdirSync("../docs", { recursive: true });
writeFileSync("../docs/index.html", head + app + tail);
const version = new Date().toISOString().slice(0, 16);
writeFileSync("../docs/sw.js", `// Offline support: keeps a copy of the app so it opens without a connection.
const CACHE = "nightalmanac-${version}";
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (new URL(e.request.url).origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
`);
writeFileSync("../docs/manifest.webmanifest", JSON.stringify({
  name: "The Night Almanac", short_name: "Night Almanac", description: "Your stars, read clearly and honestly.",
  start_url: "./", scope: "./", display: "standalone", background_color: "#160f1c", theme_color: "#2d1d33",
  icons: [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
}, null, 2));
copyFileSync("../LICENSE", "../docs/LICENSE.txt");
writeFileSync("../docs/FONTS-LICENSE.txt", ["cormorant-garamond", "jost"].map((f) => readFileSync(`node_modules/@fontsource/${f}/LICENSE`, "utf8")).join("\n\n----------------------------------------\n\n"));
console.log("docs/ built", (readFileSync("../docs/index.html").length / 1024).toFixed(0), "KB");
