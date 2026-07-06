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

// Wire one collapsible pane. Its arrow button toggles a body class (CSS collapses
// the pane to a thin rail) and the rail — visible only when collapsed — toggles it
// back, so clicking the rail label expands the pane too. The arrow flips between the
// collapsed/expanded glyphs and its tooltip between the show/hide titles.
function wirePane({ btn, rail, cls, collapsed, expanded, show, hide }) {
  const button = document.getElementById(btn);
  const toggle = () => {
    const hidden = document.body.classList.toggle(cls);
    button.textContent = hidden ? collapsed : expanded;
    button.title = hidden ? show : hide;
    viewer.resize();   // let 3Dmol pick up the resized container
    viewer.render();
  };
  button.addEventListener("click", toggle);
  document.getElementById(rail).addEventListener("click", toggle);
}

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

  // Collapsible panes: hide a pane to give the viewer more room. Collapsed, each
  // shrinks to a thin rail holding its handle; clicking either the arrow or the
  // rail toggles it back. (Left/right arrows point toward the collapse direction.)
  wirePane({ btn: "pane-toggle",      rail: "right-rail-icon", cls: "hide-desc",
             collapsed: "◂", expanded: "▸", show: "Show descriptors",  hide: "Hide descriptors" });
  wirePane({ btn: "pane-toggle-left", rail: "left-rail-icon",  cls: "hide-left",
             collapsed: "▸", expanded: "◂", show: "Show fingerprints", hide: "Hide fingerprints" });
  wirePane({ btn: "notation-toggle",  rail: "notation-rail",   cls: "hide-notation",
             collapsed: "▴", expanded: "▾", show: "Show notations",    hide: "Hide notations" });

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

  // Help modal: open from the toolbar, close via the ×, the backdrop, or Escape.
  const helpOverlay = document.getElementById("help-overlay");
  const showHelp = () => { helpOverlay.hidden = false; };
  const hideHelp = () => { helpOverlay.hidden = true; };
  document.getElementById("helpBtn").addEventListener("click", showHelp);
  document.getElementById("help-close").addEventListener("click", hideHelp);
  helpOverlay.addEventListener("click", e => { if (e.target === helpOverlay) hideHelp(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !helpOverlay.hidden) hideHelp(); });
  showHelp();   // greet first-time visitors with the guide; any close gesture dismisses it

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
