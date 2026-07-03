// Highlight overlays and base-style application. Any number of overlays can be
// active at once; repaint lays the current base style down first, then recolors
// each active overlay's atoms on top of it.
import { viewer, STYLES } from './viewer.js';
import { getMol, edgeKey } from './graph.js';
import { state } from './state.js';

let currentStyle = "stick";

// Lay down the base style (optionally switching to `name`) and reapply overlays.
// Called with no argument to re-render the current style for a freshly loaded molecule.
export function applyStyle(name = currentStyle) {
  currentStyle = name;
  repaintOverlays(); // lays down the base style and reapplies any active overlays
  document.querySelectorAll("#toolbar button[data-style]").forEach(b =>
    b.classList.toggle("active", b.dataset.style === name));
}

// ── Overlay atom-set computations ─────────────────────────────────────────────

// Aromatic ring atoms in a 5–6 membered ring of C/N/O/S. A double bond to *any*
// ring atom counts toward the π system, so fused rings whose formal doubles point
// into the neighbouring ring (e.g. the imidazole of a purine) are still detected.
// A ring qualifies when either:
//   (a) every atom bears a π-system double bond or is a lone-pair donor, with ≥2
//       such doubles — benzene, pyridine, pyrrole, furan, thiophene, imidazole… ; or
//   (b) it is a 6-ring of all-sp2 atoms with ≥2 heteroatom donors and ≥1 ring double
//       — xanthine / pyridinone rings that carry exocyclic C=O (e.g. caffeine).
// Saturated rings, cyclohexene and quinones are rejected.
function computeAromatic() {
  const mol = getMol();
  const AROM = new Set(["C", "N", "O", "S"]);
  const isDonor = e => e === "N" || e === "O" || e === "S";
  const result = new Set();
  for (const ring of mol.rings) {
    if (ring.length < 5 || ring.length > 6) continue;
    if (!ring.every(i => AROM.has(mol.byIndex.get(i).elem))) continue;

    let sysDoubles = 0, donors = 0, everyConjugated = true, everySp2 = true;
    for (const i of ring) {
      const nbrs = mol.adj.get(i), elem = mol.byIndex.get(i).elem;
      const ringDouble = nbrs.some(n => n.order === 2 && mol.ringAtoms.has(n.index));
      const anyDouble  = nbrs.some(n => n.order === 2);
      const donor      = isDonor(elem);
      if (ringDouble) sysDoubles++;
      if (donor && !ringDouble) donors++;
      if (!(ringDouble || donor)) everyConjugated = false;
      if (!(anyDouble  || donor)) everySp2 = false;
    }
    const conjugated     = everyConjugated && sysDoubles >= 2;
    const heteroAromatic = ring.length === 6 && everySp2 && donors >= 2 && sysDoubles >= 1;
    if (conjugated || heteroAromatic) ring.forEach(i => result.add(mol.byIndex.get(i).serial));
  }
  return [...result];
}

// Rotatable bond atoms: a single bond that is acyclic (a bridge), joins two
// non-terminal heavy atoms, and touches no triple bond (excludes nitrile/alkyne).
function computeRotatable() {
  const mol = getMol();
  const result = new Set();
  const hasTriple = i => mol.adj.get(i).some(n => n.order === 3);
  for (const u of mol.adj.keys()) {
    for (const { index: v, order } of mol.adj.get(u)) {
      if (u >= v || order !== 1) continue;              // each bond once, single only
      if (!mol.bridges.has(edgeKey(u, v))) continue;    // acyclic (not in a ring)
      if (mol.adj.get(u).length < 2 || mol.adj.get(v).length < 2) continue; // non-terminal
      if (hasTriple(u) || hasTriple(v)) continue;       // skip alkyne / nitrile
      result.add(mol.byIndex.get(u).serial);
      result.add(mol.byIndex.get(v).serial);
    }
  }
  return [...result];
}

// H-bond donor atoms: N or O bearing at least one hydrogen (N–H / O–H).
function computeDonors() {
  const mol = getMol();
  const result = new Set();
  for (const atom of mol.byIndex.values()) {
    if (atom.elem !== "N" && atom.elem !== "O") continue;
    if (atom.bonds.some(ni => mol.byIndex.get(ni)?.elem === "H")) result.add(atom.serial);
  }
  return [...result];
}

// H-bond acceptor atoms: every N and O (the Lipinski Ro5 acceptor definition).
function computeAcceptors() {
  const mol = getMol();
  const result = new Set();
  for (const atom of mol.byIndex.values())
    if (atom.elem === "N" || atom.elem === "O") result.add(atom.serial);
  return [...result];
}

// ── Highlight overlays ────────────────────────────────────────────────────
export const OVERLAYS = {
  aromatic:  { color: "#f59e0b", compute: computeAromatic,  on: false, serials: null },
  rotatable: { color: "#22d3ee", compute: computeRotatable, on: false, serials: null },
  // acceptors before donors: donors ⊂ acceptors, so painting donors last keeps
  // them green while acceptor-only atoms stay violet when both overlays are on.
  acceptors: { color: "#ec4899", compute: computeAcceptors, on: false, serials: null },
  donors:    { color: "#4ade80", compute: computeDonors,    on: false, serials: null },
  // fpbit is transient (set directly by a MACCS bit click, no compute fn) and
  // painted last so the clicked substructure sits on top of any other overlay.
  fpbit:     { color: "#7c3aed", compute: () => [],         on: false, serials: null },
};
export const ACTION_OVERLAY = {
  "Aromatic rings":    "aromatic",
  "Rotatable bonds":   "rotatable",
  "H-bond donors":     "donors",
  "H-bond acceptors":  "acceptors",
};

export function repaintOverlays() {
  viewer.setStyle({}, STYLES[currentStyle]);
  for (const o of Object.values(OVERLAYS)) {
    if (!o.on || !o.serials || !o.serials.length) continue;
    const base = STYLES[currentStyle], hl = {};
    if (base.stick)  hl.stick  = { ...base.stick,  color: o.color };
    if (base.sphere) hl.sphere = { ...base.sphere, color: o.color };
    if (base.line)   hl.line   = { color: o.color };
    if (!hl.stick && !hl.sphere && !hl.line) hl.stick = { color: o.color, radius: 0.04 };
    viewer.setStyle({ serial: o.serials }, hl);
  }
  viewer.render();
}

export function toggleOverlay(kind, row) {
  const o = OVERLAYS[kind];
  if (o.serials === null) o.serials = o.compute(); // computed lazily, then cached
  o.on = !o.on;
  row.classList.toggle("row-active", o.on);
  repaintOverlays();
}

export function resetOverlays() {
  state.molCache = null;
  for (const o of Object.values(OVERLAYS)) { o.on = false; o.serials = null; }
}
