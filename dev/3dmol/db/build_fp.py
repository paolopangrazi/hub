#!/usr/bin/env python3
"""Compute MACCS (166-key) fingerprints for every molecule in ./ and emit:

  maccs_keys.json          {bit: {smarts, desc}}          (static legend, 1..166)
  fp_index.json            {name: hex166}                 (all molecules; similarity)
  fp/<name>.json           {atoms: {bit: [[idx,...],...]}} (on-bit -> SDF-order atoms)

Atom indices are 0-based in SDF order, so the frontend maps idx -> serial = idx+1.
The atom map is only emitted when the molecule parses from its mol block (which
preserves SDF atom order); SMILES fallbacks still get a fingerprint but no map.
"""

import json, re, sys
from pathlib import Path
from rdkit import Chem, RDLogger
from rdkit.Chem import MACCSkeys
from rdkit.Chem.MACCSkeys import smartsPatts

RDLogger.DisableLog("rdApp.*")
OUT = Path(__file__).parent
FP_DIR = OUT / "fp"
FP_DIR.mkdir(exist_ok=True)

# --- 1. legend: SMARTS from smartsPatts, description from source comments -----
src = Path(MACCSkeys.__file__).read_text().splitlines()
desc = {}
for line in src:
    m = re.match(r"\s*(\d+):", line)
    c = re.search(r"\),\s*#\s*(.*)$", line)
    if m and c:
        desc[int(m.group(1))] = c.group(1).strip()

keys = {}
for bit in range(1, 167):
    smarts, count = smartsPatts[bit]
    keys[str(bit)] = {"smarts": "" if smarts == "?" else smarts,
                      "desc": desc.get(bit, f"key {bit}")}
(OUT / "maccs_keys.json").write_text(json.dumps(keys))
print(f"maccs_keys.json: {len(keys)} keys")

# Precompile the SMARTS patterns once (skip the 3 count-based '?' keys).
patts = {}
for bit in range(1, 167):
    s = keys[str(bit)]["smarts"]
    if s:
        p = Chem.MolFromSmarts(s)
        if p is not None:
            patts[bit] = p


def hex166(fp):
    v = 0
    for i in range(1, 167):
        if fp.GetBit(i):
            v |= 1 << (i - 1)
    return format(v, "042x")


# --- 2. per-molecule fingerprints -------------------------------------------
fp_index = {}
files = sorted(OUT.glob("*.sdf"))
done = skipped = 0
for path in files:
    name = path.stem
    block = path.read_text()
    mol = Chem.MolFromMolBlock(block, removeHs=False, sanitize=True)
    from_sdf = mol is not None
    if mol is None:  # fall back to SMILES for the bit vector only
        try:
            desc_j = json.loads((OUT / "desc" / f"{name}.json").read_text())
            mol = Chem.MolFromSmiles(desc_j.get("smiles") or "")
        except Exception:
            mol = None
    if mol is None:
        skipped += 1
        continue

    fp = MACCSkeys.GenMACCSKeys(mol)
    fp_index[name] = hex166(fp)

    if from_sdf:
        atoms = {}
        for bit, patt in patts.items():
            if fp.GetBit(bit):
                matches = mol.GetSubstructMatches(patt)
                if matches:
                    atoms[str(bit)] = [list(t) for t in matches]
        (FP_DIR / f"{name}.json").write_text(json.dumps({"atoms": atoms}))

    done += 1
    if done % 500 == 0:
        print(f"  {done}/{len(files)}")

(OUT / "fp_index.json").write_text(json.dumps(fp_index))
print(f"fp_index.json: {len(fp_index)} molecules; {done} done, {skipped} skipped")
