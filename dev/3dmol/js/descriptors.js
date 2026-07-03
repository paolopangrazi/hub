// Right-panel descriptor table plus the bottom line-notation bar (SMILES/SELFIES).
// Clickable descriptor rows toggle the matching highlight overlay on the model.
import { ACTION_OVERLAY, toggleOverlay } from './overlays.js';

function badge(val, green, red) {
  const cls = val ? "badge-green" : "badge-red";
  const txt = val ? green : red;
  return `<span class="badge ${cls}">${txt}</span>`;
}

function ro5Badge(n) {
  if (n === null || n === undefined) return "—";
  if (n === 0) return `<span class="badge badge-green">Pass (0)</span>`;
  return `<span class="badge badge-red ro5-badge">${n} violation${n === 1 ? "" : "s"}</span>`;
}

function fmt(v, digits = 2) {
  return v !== null && v !== undefined ? Number(v).toFixed(digits) : "—";
}
function fmtI(v) {
  return v !== null && v !== undefined ? v : "—";
}

const TIPS = {
  "Formula":            "Molecular formula showing the count of each element type.",
  "Mol. weight":        "Total molecular mass in Daltons (g/mol). Lipinski Ro5: ≤500 Da for oral drugs.",
  "Heavy atoms":        "Count of non-hydrogen atoms. A rough proxy for molecular size and complexity.",
  "LogP (AlogP)":       "Calculated octanol/water partition coefficient. Higher = more lipophilic. Ro5: ≤5. Affects membrane permeability and solubility.",
  "Polar surface area": "Topological polar surface area (TPSA): summed contributions of polar atoms (mainly N, O and their attached H). <140 Ų favors oral absorption; <60 Ų favors blood–brain-barrier / CNS penetration.",
  "H-bond donors":      "Number of hydrogen-bond donor atoms (N–H and O–H). Lipinski Ro5: ≤5.",
  "H-bond acceptors":   "Number of hydrogen-bond acceptor atoms (mainly N and O). Lipinski Ro5: ≤10.",
  "Rotatable bonds":    "Non-ring, non-terminal single bonds. More = more flexible. ≤10 is preferred for good oral bioavailability.",
  "Aromatic rings":     "Number of aromatic (π-conjugated) ring systems in the molecule.",
  "Ro5 violations":     "Violations of Lipinski's Rule of Five (MW≤500, LogP≤5, HBD≤5, HBA≤10). 0–1 violations predicts likely oral bioavailability.",
  "QED score":          "Quantitative Estimate of Drug-likeness (0–1). Combines MW, LogP, HBD, HBA, PSA, rotatable bonds, aromatic rings and structural alerts. Higher = more drug-like.",
  "NP-likeness":        "Natural Product likeness score (typically −5 to +5). Higher values indicate stronger structural resemblance to known natural products.",
  "Max phase":          "Highest clinical development phase reached. Phase 1=safety, 2=efficacy, 3=pivotal trials, 4=approved and marketed.",
  "First approval":     "Year the drug was first approved by a regulatory agency (e.g. FDA, EMA).",
  "Oral":               "Whether the drug has an approved oral administration route.",
  "Black box warning":  "FDA black box warning — the strongest safety warning, indicating serious or life-threatening risks identified during clinical use.",
  "SMILES":             "Simplified Molecular Input Line Entry System — a compact text notation encoding the molecular structure.",
  "SELFIES":            "Self-Referencing Embedded Strings — a molecular string notation where every string is a valid molecule (unlike SMILES); popular for generative machine-learning models.",
};

function tip(label) {
  const t = TIPS[label];
  return t ? `<i class="tip" data-tip="${t.replace(/"/g, '&quot;')}">*</i>` : "";
}

export function renderSidebar(e) {
  const rows = [
    ["Formula",           e.formula ?? "—"],
    ["Mol. weight",       e.mw     != null ? fmt(e.mw, 2) + " Da" : "—"],
    ["Heavy atoms",       fmtI(e.heavy_atoms)],
    ["LogP (AlogP)",      e.logP   != null ? fmt(e.logP, 2) : "—"],
    ["Polar surface area",e.psa    != null ? fmt(e.psa, 1) + " Ų" : "—"],
    ["H-bond donors",     fmtI(e.hbd), e.hbd ? "row-clickable" : ""],
    ["H-bond acceptors",  fmtI(e.hba), e.hba ? "row-clickable" : ""],
    ["Rotatable bonds",   fmtI(e.rtb), e.rtb ? "row-clickable" : ""],
    ["Aromatic rings",    fmtI(e.rings), e.rings ? "row-clickable" : ""],
    ["Ro5 violations",    ro5Badge(e.ro5)],
    ["QED score",         e.qed    != null ? fmt(e.qed, 3) : "—"],
    ["NP-likeness",       e.np_score != null ? fmt(e.np_score, 2) : "—"],
    ["Max phase",         e.max_phase != null ? "Phase " + e.max_phase : "—"],
    ["First approval",    e.first_approval ?? "—"],
    ["Oral",              e.oral != null ? badge(e.oral, "Yes", "No") : "—"],
    ["Black box warning", e.black_box != null ? badge(e.black_box, "Yes", "No").replace("badge-green","badge-red").replace("badge-red","badge-green") : "—"],
  ];

  // Which Lipinski Ro5 limits the displayed values break (for the hover highlight)
  const ro5Viol = new Set();
  if (e.mw   != null && e.mw   > 500) ro5Viol.add("Mol. weight");
  if (e.logP != null && e.logP > 5)   ro5Viol.add("LogP (AlogP)");
  if (e.hbd  != null && e.hbd  > 5)   ro5Viol.add("H-bond donors");
  if (e.hba  != null && e.hba  > 10)  ro5Viol.add("H-bond acceptors");

  const table = document.getElementById("desc-table");
  table.innerHTML = rows.map(([label, val, cls = ""]) => {
    const classAttr  = cls ? ` class="${cls}"` : "";
    const actionAttr = cls.includes("clickable") ? ` data-action="${label}"` : "";
    return `<tr${classAttr}${actionAttr} data-row="${label}"><td>${label}${tip(label)}</td><td>${val}</td></tr>`;
  }).join("");

  // Line-notation strings shown full-width in the bottom bar of the main view
  document.getElementById("notation-content").innerHTML = [
    ["SMILES",  e.smiles],
    ["SELFIES", e.selfies],
  ].map(([label, val]) => val
    ? `<div class="nb-item"><span class="nb-label">${label}${tip(label)}</span>`
      + `<span class="nb-val">${val}</span>`
      + `<button class="nb-copy" title="Copy ${label}" aria-label="Copy ${label}">`
      + `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">`
      + `<rect x="9" y="9" width="11" height="11" rx="2"/>`
      + `<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`
      + `</svg></button></div>`
    : "").join("");

  table.onclick = ev => {
    const row = ev.target.closest("tr[data-action]");
    const kind = row && ACTION_OVERLAY[row.dataset.action];
    if (kind) toggleOverlay(kind, row);
  };

  // Hovering the Ro5 badge flags, in red, the exact rows breaking a rule.
  const hotRo5 = on => table.querySelectorAll("tr[data-row]").forEach(r => {
    if (ro5Viol.has(r.dataset.row)) r.classList.toggle("ro5-hot", on);
  });
  table.onmouseover = ev => { if (ev.target.closest(".ro5-badge")) hotRo5(true); };
  table.onmouseout  = ev => { if (ev.target.closest(".ro5-badge")) hotRo5(false); };

  const link = document.getElementById("chembl-link");
  if (e.chembl_id) {
    link.href = `https://www.ebi.ac.uk/chembl/compound_report_card/${e.chembl_id}/`;
    link.textContent = `View ${e.chembl_id} on ChEMBL ↗`;
    link.style.display = "block";
  } else {
    link.style.display = "none";
  }
}
