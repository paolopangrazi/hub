#!/usr/bin/env python3
"""Rebuild index.json with ChEMBL descriptors for every molecule that has an SDF file."""

import json, time, re
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

CHEMBL_BASE = (
    "https://www.ebi.ac.uk/chembl/api/data/molecule"
    "?research_companies__company__icontains=ph_company"
    "&max_phase=4"
    "&molecule_type=Small+molecule"
    "&format=json"
    "&limit=100"
    "&offset={offset}"
)

OUT   = Path(__file__).parent
SDF_FILES = {p.stem for p in OUT.glob("*.sdf")}


def get(url, retries=3, delay=2):
    for attempt in range(retries):
        try:
            req = Request(url, headers={"Accept": "application/json"})
            with urlopen(req, timeout=20) as r:
                return r.read()
        except HTTPError as e:
            if e.code == 429 or e.code >= 500:
                time.sleep(delay * (attempt + 1))
            else:
                return None
        except URLError:
            time.sleep(delay * (attempt + 1))
    return None


def safe_name(pref, chembl_id):
    if pref:
        return re.sub(r'[^\w\-]', '_', pref.strip().lower())[:60]
    return chembl_id.lower()


def props(mol):
    p = mol.get("molecule_properties") or {}
    def f(k):   return float(p[k])  if p.get(k) not in (None, "") else None
    def i(k):   return int(p[k])    if p.get(k) not in (None, "") else None
    def s(k, m): v = m.get(k); return v if v not in (None, "") else None

    structs = mol.get("molecule_structures") or {}
    return {
        "formula":      s("full_molformula", p),
        "mw":           f("full_mwt"),
        "logP":         f("alogp"),
        "psa":          f("psa"),
        "hba":          i("hba"),
        "hbd":          i("hbd"),
        "rtb":          i("rtb"),
        "rings":        i("aromatic_rings"),
        "heavy_atoms":  i("heavy_atoms"),
        "ro5":          i("num_ro5_violations"),
        "qed":          round(f("qed_weighted"), 3) if f("qed_weighted") is not None else None,
        "np_score":     round(f("np_likeness_score"), 2) if f("np_likeness_score") is not None else None,
        "smiles":       s("canonical_smiles", structs),
        "inchikey":     s("standard_inchi_key", structs),
        "max_phase":    s("max_phase", mol),
        "first_approval": s("first_approval", mol),
        "oral":         mol.get("oral"),
        "black_box":    bool(mol.get("black_box_warning")),
        "chembl_id":    mol.get("molecule_chembl_id"),
    }


entries = []
offset  = 0
total   = None
page    = 0

while True:
    raw = get(CHEMBL_BASE.format(offset=offset))
    if not raw:
        print(f"Failed at offset {offset}")
        break
    data  = json.loads(raw)
    if total is None:
        total = data["page_meta"]["total_count"]
        print(f"Total: {total}")

    molecules = data["molecules"]
    if not molecules:
        break

    for mol in molecules:
        cid  = mol["molecule_chembl_id"]
        pref = mol.get("pref_name") or ""
        name = safe_name(pref, cid)
        if name not in SDF_FILES:
            continue
        entries.append({"file": f"{name}.sdf", "name": name.replace("_", " "), **props(mol)})

    offset += len(molecules)
    page   += 1
    print(f"  page {page:3d}  offset {offset:5d}/{total}  matched {len(entries)}")
    if offset >= total:
        break
    time.sleep(0.1)

entries.sort(key=lambda e: e["name"])
(OUT / "index.json").write_text(json.dumps(entries))
print(f"\nWrote {len(entries)} entries to index.json")
