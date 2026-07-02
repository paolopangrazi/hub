#!/usr/bin/env python3
"""Download all ph_company approved small-molecule SDF files into ./db."""

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
PUBCHEM_3D = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/{key}/SDF?record_type=3d"

OUT = Path(__file__).parent


def get(url, retries=3, delay=1.5):
    for attempt in range(retries):
        try:
            req = Request(url, headers={"Accept": "application/json, text/plain"})
            with urlopen(req, timeout=20) as r:
                return r.read()
        except HTTPError as e:
            if e.code == 404:
                return None
            if e.code == 429 or e.code >= 500:
                time.sleep(delay * (attempt + 1))
            else:
                return None
        except URLError:
            time.sleep(delay * (attempt + 1))
    return None


def safe_name(pref, chembl_id):
    if pref:
        name = re.sub(r'[^\w\-]', '_', pref.strip().lower())
        return name[:60]
    return chembl_id.lower()


# Paginate through all ChEMBL results
offset = 0
total = None
saved = skipped = 0

while True:
    raw = get(CHEMBL_BASE.format(offset=offset))
    if not raw:
        print(f"Failed to fetch page at offset {offset}, stopping.")
        break
    data = json.loads(raw)
    if total is None:
        total = data["page_meta"]["total_count"]
        print(f"Total molecules: {total}")

    molecules = data["molecules"]
    if not molecules:
        break

    for mol in molecules:
        cid      = mol["molecule_chembl_id"]
        pref     = mol.get("pref_name") or ""
        structs  = mol.get("molecule_structures") or {}
        inchikey = structs.get("standard_inchi_key")
        molfile  = structs.get("molfile")

        if not molfile:
            skipped += 1
            continue

        name     = safe_name(pref, cid)
        out_path = OUT / f"{name}.sdf"

        if out_path.exists():
            saved += 1
            continue

        sdf = None
        if inchikey:
            r3d = get(PUBCHEM_3D.format(key=inchikey))
            if r3d and len(r3d) > 100:
                sdf = r3d.decode()

        if not sdf:
            sdf = molfile if molfile.strip().endswith("M  END") else molfile + "\nM  END\n"
            src = "2D"
        else:
            src = "3D"

        out_path.write_text(sdf)
        saved += 1
        print(f"  [{saved:4d}/{total}] {name}.sdf  ({src})")
        time.sleep(0.12)   # ~8 req/s, under PubChem's limit

    offset += len(molecules)
    if offset >= total:
        break

print(f"\nDone: {saved} saved, {skipped} skipped (no structure).")
