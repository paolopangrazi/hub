#!/usr/bin/env python3
"""Add a 'selfies' string (derived from the stored SMILES) to each desc/*.json."""

import json
from pathlib import Path
import selfies as sf

DESC = Path(__file__).parent / "desc"
done = failed = 0
for p in sorted(DESC.glob("*.json")):
    d = json.loads(p.read_text())
    smi = d.get("smiles")
    if not smi:
        continue
    try:
        d["selfies"] = sf.encoder(smi)
        done += 1
    except Exception:
        d["selfies"] = None          # some SMILES aren't SELFIES-encodable
        failed += 1
    p.write_text(json.dumps(d))

print(f"selfies added: {done} ok, {failed} unencodable")
