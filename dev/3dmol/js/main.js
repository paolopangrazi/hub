// Entry point: loads a molecule (structure + descriptors + fingerprint) and wires
// the molecule picker, the similar-molecules list and the one-time startup fetch.
import { viewer, resetLabels } from './viewer.js';
import { applyStyle, resetOverlays } from './overlays.js';
import { renderSidebar } from './descriptors.js';
import { renderFingerprint, renderSimilar, initFingerprints } from './fingerprints.js';
import { showElement, hideElementPanel } from './elements-panel.js';
import { initUI } from './ui.js';
import { state } from './state.js';

function loadMolecule(entry) {
  const stem = entry.file.replace(/\.sdf$/, '');
  state.currentName = stem;
  Promise.all([
    fetch(`db/${entry.file}`).then(r => r.text()),
    fetch(`db/desc/${stem}.json`).then(r => r.json()),
  ]).then(([sdf, desc]) => {
    viewer.removeAllModels();
    resetLabels();
    hideElementPanel();
    resetOverlays();
    viewer.addModel(sdf.trim(), "sdf");
    viewer.setClickable({}, true, atom => showElement(atom.elem));
    applyStyle();      // lays down the current base style + overlays for the new model
    viewer.zoomTo();
    viewer.render();
    document.title = entry.name + " — 3D viewer";
    renderSidebar(desc);
    renderFingerprint(stem);
    renderSimilar(stem);
    viewer.resize();   // the bottom notation bar changed the viewer height
    viewer.render();
  });
}

const molSelect = document.getElementById("molSelect");
molSelect.addEventListener("change", () => {
  const opt = molSelect.selectedOptions[0];
  loadMolecule({ file: opt.value, name: opt.textContent });
});

document.getElementById("sim-list").addEventListener("click", e => {
  const row = e.target.closest(".sim-row");
  if (!row) return;
  molSelect.value = row.dataset.file;
  loadMolecule({ file: row.dataset.file, name: row.dataset.name });
});

initUI();

Promise.all([
  fetch("db/index.json").then(r => r.json()),
  fetch("db/maccs_keys.json").then(r => r.json()).catch(() => null),
  fetch("db/fp_index.json").then(r => r.json()).catch(() => ({})),
]).then(([entries, keys, fpIndex]) => {
  initFingerprints(keys, fpIndex);
  molSelect.innerHTML = "";
  const start = entries.find(e => e.file === "abacavir.sdf") || entries[0];
  entries.forEach((entry) => {
    const opt = document.createElement("option");
    opt.textContent = entry.name;
    opt.value = entry.file;
    if (entry === start) opt.selected = true;
    molSelect.appendChild(opt);
  });
  loadMolecule(start);
});
