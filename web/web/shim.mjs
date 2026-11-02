import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  const s = String(u);
  if (s.startsWith("file:")) {
    const buf = await readFile(fileURLToPath(s));
    return new Response(buf, { headers: { "content-type": "application/wasm" } });
  }
  return realFetch(u, o);
};
