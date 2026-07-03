// UI chrome: theme toggle, pane/notation collapse handles, clipboard copy,
// tooltip, collapsible sections and the toolbar controls (spin/labels/reset/style).
// initUI() wires all of these once at startup.
import { viewer, toggleLabels } from './viewer.js';
import { applyStyle } from './overlays.js';

const THEME = {
  dark:  { bg: "#0d1117", cls: "" },
  light: { bg: "#f6f8fa", cls: "light" },
};
let theme = "light";
let spinning = false;

// Copy SMILES / SELFIES to the clipboard from the per-row copy buttons.
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch {}
    ta.remove(); return ok;
  }
}

export function initUI() {
  const themeBtn = document.getElementById("themeBtn");
  themeBtn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    const t = THEME[theme];
    document.documentElement.className = t.cls;
    viewer.setBackgroundColor(t.bg);
    viewer.render();
    themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
  });

  // Hide/show the descriptors pane (toggle lives on the pane itself) to give the
  // viewer more room. Collapsed, the pane shrinks to a thin rail holding the handle.
  // Each pane toggles from its arrow button and — when collapsed — from the whole
  // rail (label + icon), so clicking the vertical/horizontal label expands it too.
  const paneToggle = document.getElementById("pane-toggle");
  const toggleDesc = () => {
    const hidden = document.body.classList.toggle("hide-desc");
    paneToggle.textContent = hidden ? "◂" : "▸";
    paneToggle.title = hidden ? "Show descriptors" : "Hide descriptors";
    viewer.resize();   // let 3Dmol pick up the widened/narrowed container
    viewer.render();
  };
  paneToggle.addEventListener("click", toggleDesc);
  document.getElementById("right-rail-icon").addEventListener("click", toggleDesc);

  const paneToggleLeft = document.getElementById("pane-toggle-left");
  const toggleLeft = () => {
    const hidden = document.body.classList.toggle("hide-left");
    paneToggleLeft.textContent = hidden ? "▸" : "◂";
    paneToggleLeft.title = hidden ? "Show fingerprints" : "Hide fingerprints";
    viewer.resize();
    viewer.render();
  };
  paneToggleLeft.addEventListener("click", toggleLeft);
  document.getElementById("left-rail-icon").addEventListener("click", toggleLeft);

  const notationToggle = document.getElementById("notation-toggle");
  const toggleNotation = () => {
    const hidden = document.body.classList.toggle("hide-notation");
    notationToggle.textContent = hidden ? "▴" : "▾";
    notationToggle.title = hidden ? "Show notations" : "Hide notations";
    viewer.resize();
    viewer.render();
  };
  notationToggle.addEventListener("click", toggleNotation);
  document.getElementById("notation-rail").addEventListener("click", toggleNotation);

  document.getElementById("notation-content").addEventListener("click", async ev => {
    const btn = ev.target.closest(".nb-copy");
    if (!btn) return;
    const val = btn.closest(".nb-item").querySelector(".nb-val").textContent;
    if (await copyText(val)) {
      btn.classList.add("copied");
      const prev = btn.title; btn.title = "Copied!";
      setTimeout(() => { btn.classList.remove("copied"); btn.title = prev; }, 1200);
    }
  });

  document.querySelectorAll("#toolbar button[data-style]").forEach(btn =>
    btn.addEventListener("click", () => applyStyle(btn.dataset.style)));

  const spinBtn = document.getElementById("spinBtn");
  spinBtn.addEventListener("click", () => {
    spinning = !spinning;
    viewer.spin(spinning ? "y" : false);
    spinBtn.textContent = spinning ? "⏸ Stop" : "▶ Spin";
    spinBtn.classList.toggle("active", spinning);
  });

  document.getElementById("labelBtn").addEventListener("click", toggleLabels);
  document.getElementById("resetBtn").addEventListener("click", () => {
    viewer.zoomTo(); viewer.render();
  });

  // Tooltip (descriptor "*" markers and MACCS fingerprint cells)
  const tooltipEl = document.getElementById("tooltip");
  document.addEventListener("mouseover", e => {
    const t = e.target.closest(".tip, .fpcell");
    if (!t || !t.dataset.tip) return;
    tooltipEl.textContent = t.dataset.tip;
    tooltipEl.style.display = "block";
  });
  document.addEventListener("mousemove", e => {
    if (!tooltipEl.style.display || tooltipEl.style.display === "none") return;
    const x = e.clientX, y = e.clientY;
    const tw = tooltipEl.offsetWidth, th = tooltipEl.offsetHeight;
    tooltipEl.style.left = Math.min(x + 12, window.innerWidth  - tw - 8) + "px";
    tooltipEl.style.top  = Math.max(y - th - 10, 8) + "px";
  });
  document.addEventListener("mouseout", e => {
    if (e.target.closest(".tip, .fpcell")) tooltipEl.style.display = "none";
  });

  // Collapsible sidebar sections
  document.querySelectorAll(".section-head").forEach(h =>
    h.addEventListener("click", () => h.parentElement.classList.toggle("collapsed")));
}
