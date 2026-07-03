// The clickable-atom element info popup along the bottom of the viewer.
import { ELEM_DATA, CPK_FALLBACK } from './data/elements.js';

// Colour the panel's element symbol with the SAME colour 3Dmol paints that
// element's atoms (its CPK/Jmol scheme), so the popup and the model agree.
function elementColor(sym) {
  const scheme = ($3Dmol.elementColors &&
    ($3Dmol.elementColors.defaultColors || $3Dmol.elementColors.Jmol)) || {};
  const c = scheme[sym];
  if (typeof c === "number") return "#" + (c & 0xffffff).toString(16).padStart(6, "0");
  return CPK_FALLBACK[sym] || "var(--fg)";
}

const elemPanel = document.getElementById("elem-panel");

export function showElement(sym) {
  const d = ELEM_DATA[sym];
  if (!d) return;
  const [name, z, mass, period, group, cat, en, radius, mp, bp, cfg] = d;
  document.getElementById("ep-z").textContent = z;
  document.getElementById("ep-sym").style.color = elementColor(sym);
  document.getElementById("ep-sym").textContent = sym;
  document.getElementById("ep-name").textContent = name;
  document.getElementById("ep-cat").textContent = cat;
  document.getElementById("ep-table").innerHTML = [
    ["Mass",    mass + " u"],
    ["Per/Grp", group != null ? `${period}/${group}` : `${period}/—`],
    ["E.neg",   en != null ? en.toFixed(2) : "—"],
    ["Radius",  radius + " pm"],
    ["M.p.",    mp + " °C"],
    ["B.p.",    bp + " °C"],
    ["Config",  cfg],
  ].map(([l, v]) => `<div class="ep-item"><span class="ep-lbl">${l}</span><span class="ep-val">${v}</span></div>`).join("");
  elemPanel.style.display = "flex";
}

export function hideElementPanel() {
  elemPanel.style.display = "none";
}

document.getElementById("ep-close").addEventListener("click", hideElementPanel);
