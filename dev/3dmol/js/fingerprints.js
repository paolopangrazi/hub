// MACCS fingerprints + Tanimoto similarity search.
// maccsKeys: {bit: {smarts, help}} legend; fpWords: name -> Uint32Array(6) of the
// 166-bit vector (LSB-first, bit i-1). Both loaded once via initFingerprints;
// fpWords powers the grid and the similarity search. Per-molecule bit→atom maps
// are lazy-fetched from db/fp/<name>.json.
import { OVERLAYS, repaintOverlays } from './overlays.js';
import { getMol } from './graph.js';
import { state } from './state.js';

let maccsKeys = null;
const fpWords = new Map();
let fpAtomsCache = { name: null, atoms: {} };
let activeBit = null;

function hexToWords(hex) {
  const v = BigInt("0x" + hex), words = new Uint32Array(6), MASK = 0xffffffffn;
  for (let w = 0; w < 6; w++) words[w] = Number((v >> BigInt(32 * w)) & MASK) >>> 0;
  return words;
}
function popcount(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
function bitOn(words, bit) { return (words[(bit - 1) >>> 5] >>> ((bit - 1) & 31)) & 1; }

function tanimoto(a, b) {
  let inter = 0, uni = 0;
  for (let w = 0; w < 6; w++) { inter += popcount(a[w] & b[w]); uni += popcount(a[w] | b[w]); }
  return uni ? inter / uni : 0;
}

// Load the MACCS legend and every molecule's fingerprint word-vector once at startup.
export function initFingerprints(keys, fpIndex) {
  maccsKeys = keys;
  for (const [n, hex] of Object.entries(fpIndex)) fpWords.set(n, hexToWords(hex));
}

export function renderFingerprint(name) {
  activeBit = null;
  OVERLAYS.fpbit.on = false; OVERLAYS.fpbit.serials = null;
  const grid = document.getElementById("fp-grid");
  const words = fpWords.get(name);
  if (!words || !maccsKeys) {
    document.getElementById("fp-meta").textContent = "unavailable";
    grid.innerHTML = ""; return;
  }
  let on = 0, html = "";
  for (let bit = 1; bit <= 166; bit++) {
    const set = bitOn(words, bit);
    if (set) on++;
    const k = maccsKeys[bit] || { help: "", smarts: "" };
    const lines = [`#${bit}  ${k.help || ""}`.trim()];     // bit + plain-English
    lines.push(k.smarts || "(count-based key — no formula)"); // SMARTS formula
    const tip = lines.join("\n").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    html += `<div class="fpcell${set ? " on" : ""}" data-bit="${bit}" `
          + `data-tip="${tip}"></div>`;
  }
  grid.innerHTML = html;
  document.getElementById("fp-meta").textContent =
    `${on} / 166 · ${(100 * on / 166).toFixed(0)}%`;
}

// Click a set bit → highlight the atoms of every substructure match for that key.
document.getElementById("fp-grid").addEventListener("click", async e => {
  const cell = e.target.closest(".fpcell.on");
  if (!cell) return;
  const bit = cell.dataset.bit;
  const name = state.currentName;

  if (activeBit === bit) {                       // toggle off
    activeBit = null;
    OVERLAYS.fpbit.on = false; OVERLAYS.fpbit.serials = null;
    cell.classList.remove("active");
    repaintOverlays();
    return;
  }

  if (fpAtomsCache.name !== name) {
    try { fpAtomsCache = { name, atoms: (await (await fetch(`db/fp/${name}.json`)).json()).atoms }; }
    catch { fpAtomsCache = { name, atoms: {} }; }
  }
  const matches = fpAtomsCache.atoms[bit];
  if (!matches) return;                          // key has no atom mapping

  const byIndex = getMol().byIndex;
  const serials = new Set();
  for (const match of matches)
    for (const idx of match) { const a = byIndex.get(idx); if (a) serials.add(a.serial); }

  document.querySelectorAll("#fp-grid .fpcell.active").forEach(c => c.classList.remove("active"));
  cell.classList.add("active");
  activeBit = bit;
  OVERLAYS.fpbit.serials = [...serials];
  OVERLAYS.fpbit.on = true;
  repaintOverlays();
});

export function renderSimilar(name) {
  const list = document.getElementById("sim-list");
  const self = fpWords.get(name);
  if (!self) { list.innerHTML = ""; return; }
  const scored = [];
  for (const [other, w] of fpWords) {
    if (other === name) continue;
    scored.push([other, tanimoto(self, w)]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  list.innerHTML = scored.slice(0, 10).map(([n, s]) => {
    const label = n.replace(/_/g, " ");
    return `<div class="sim-row" data-file="${n}.sdf" data-name="${label}">`
         + `<div class="sim-main"><div class="sim-name">${label}</div>`
         + `<div class="sim-track"><div class="sim-bar" style="width:${(s * 100).toFixed(1)}%"></div></div></div>`
         + `<span class="sim-score">${s.toFixed(2)}</span></div>`;
  }).join("");
}
