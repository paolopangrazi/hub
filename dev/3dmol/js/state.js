// Shared, cross-module mutable pointers.
// ES modules can't reassign a binding imported from another module, so the few
// values that are written in one module and read in another live here as fields
// of a single object that every module mutates in place.
//   currentName — the loaded molecule's file stem; set in main.js (loadMolecule),
//                 read in fingerprints.js (bit-click handler).
//   molCache    — cached bond-graph analysis; written in graph.js (getMol),
//                 cleared in overlays.js (resetOverlays).
export const state = { currentName: null, molCache: null };
