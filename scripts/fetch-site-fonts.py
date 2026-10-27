"""Self-host the exact Latin variable fonts served by Google Fonts, with OFL."""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/fonts"
OUT.mkdir(parents=True, exist_ok=True)
API = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&family=Space+Grotesk:wght@400..700&display=swap"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

def get(url):
    with urlopen(Request(url, headers={"User-Agent": UA}), timeout=30) as response:
        return response.read()

stylesheet = get(API).decode("utf-8")
blocks = re.findall(r"/\* latin \*/\s*(@font-face\s*\{[^}]+\})", stylesheet)
if len(blocks) != 2:
    raise RuntimeError(f"Expected two Latin font blocks, found {len(blocks)}")

provenance = {"stylesheet": API, "fonts": []}
local_css = ["/* Latin variable fonts from Google Fonts; SIL OFL 1.1 licenses in src/assets/fonts/. */"]
for block in blocks:
    family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    remote = re.search(r"url\(([^)]+)\)", block).group(1)
    if "format('woff2')" not in block:
        raise RuntimeError("Google Fonts did not return WOFF2")
    stem = family.lower().replace(" ", "-")
    data = get(remote)
    if data[:4] != b"wOF2":
        raise RuntimeError("Invalid WOFF2 signature")
    name = f"{stem}-latin-variable.woff2"
    (OUT / name).write_bytes(data)
    local_css.append(block.replace(remote, f"../assets/fonts/{name}"))
    license_url = "https://raw.githubusercontent.com/google/fonts/main/ofl/" + family.lower().replace(" ", "") + "/OFL.txt"
    license_data = get(license_url)
    (OUT / f"{stem}-OFL.txt").write_bytes(license_data)
    provenance["fonts"].append({"family": family, "file": name, "bytes": len(data), "source": remote, "license": license_url, "sha256": hashlib.sha256(data).hexdigest()})

(ROOT / "src/styles/fonts.css").write_text("\n\n".join(local_css) + "\n", encoding="utf-8")
(OUT / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
print(json.dumps(provenance, indent=2))
