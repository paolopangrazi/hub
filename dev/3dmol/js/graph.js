// Molecular graph analysis. The bond graph, ring perception and bridge set are
// derived once per molecule and cached in state.molCache (cleared by
// resetOverlays in overlays.js on every molecule load).
import { viewer } from './viewer.js';
import { state } from './state.js';

export const edgeKey = (a, b) => (a < b ? a + "-" + b : b + "-" + a);

export function getMol() {
  if (state.molCache) return state.molCache;
  const atoms = viewer.getModel().selectedAtoms({});
  const byIndex = new Map(atoms.map(a => [a.index, a]));

  // Heavy-atom adjacency: atomIndex -> [{ index, order }]  (H atoms excluded)
  const adj = new Map();
  for (const a of atoms) {
    if (a.elem === "H") continue;
    const nbrs = [];
    a.bonds.forEach((ni, k) => {
      const nb = byIndex.get(ni);
      if (nb && nb.elem !== "H") nbrs.push({ index: ni, order: a.bondOrder[k] ?? 1 });
    });
    adj.set(a.index, nbrs);
  }

  const mol = { byIndex, adj };
  mol.bridges = findBridges(adj);   // acyclic bonds (an edge in no ring)
  mol.rings   = perceiveRings(mol); // smallest ring through each ring bond
  mol.ringAtoms = new Set();        // every atom that lies in some ring
  mol.rings.forEach(r => r.forEach(i => mol.ringAtoms.add(i)));
  return (state.molCache = mol);
}

// Tarjan's bridge-finding: one DFS, O(V+E). An edge is a bridge iff it lies
// in no cycle, so a bond is a ring bond exactly when it is NOT a bridge.
function findBridges(adj) {
  const disc = new Map(), low = new Map(), bridges = new Set();
  let t = 0;
  const walk = (u, parent) => {
    disc.set(u, t); low.set(u, t); t++;
    for (const { index: v } of adj.get(u)) {
      if (v === parent) { parent = -2; continue; } // ignore the edge back once
      if (!disc.has(v)) {
        walk(v, u);
        low.set(u, Math.min(low.get(u), low.get(v)));
        if (low.get(v) > disc.get(u)) bridges.add(edgeKey(u, v));
      } else {
        low.set(u, Math.min(low.get(u), disc.get(v)));
      }
    }
  };
  for (const u of adj.keys()) if (!disc.has(u)) walk(u, -1);
  return bridges;
}

// For each ring bond, the shortest cycle through it (BFS back to the start
// without using that bond). Deduped by atom set — an SSSR-like ring list.
function perceiveRings(mol) {
  const { adj, bridges } = mol;
  const rings = [], seen = new Set();
  for (const u of adj.keys()) {
    for (const { index: v } of adj.get(u)) {
      if (u >= v || bridges.has(edgeKey(u, v))) continue;
      const ring = shortestCycle(adj, u, v);
      if (!ring) continue;
      const key = [...ring].sort((a, b) => a - b).join(",");
      if (!seen.has(key)) { seen.add(key); rings.push(ring); }
    }
  }
  return rings;
}

function shortestCycle(adj, u, v) {
  const prev = new Map([[v, -1]]);
  const queue = [v];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === u) break;
    for (const { index: nb } of adj.get(cur)) {
      if ((cur === v && nb === u) || (cur === u && nb === v)) continue; // ban u–v
      if (!prev.has(nb)) { prev.set(nb, cur); queue.push(nb); }
    }
  }
  if (!prev.has(u)) return null;
  const path = [];
  for (let c = u; c !== -1; c = prev.get(c)) path.push(c);
  return path;
}
