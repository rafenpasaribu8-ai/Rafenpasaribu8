#!/usr/bin/env python3
"""Move embedded JPEG data URLs into local assets and wire in the v6 enhancement layer."""
from __future__ import annotations
import base64
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HTML_PATH = ROOT / "index.html"
ASSET_DIR = ROOT / "assets"
DATA_URL = re.compile(r"data:image/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)")

def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    files_by_hash: dict[str, str] = {}
    files_written = 0
    replacements = 0
    def extract(match: re.Match[str]) -> str:
        nonlocal files_written, replacements
        payload = base64.b64decode(match.group(1), validate=True)
        digest = hashlib.sha256(payload).hexdigest()
        if digest not in files_by_hash:
            number = len(files_by_hash) + 1
            name = f"kenangan-{number:02d}-{digest[:8]}.jpg"
            (ASSET_DIR / name).write_bytes(payload)
            files_by_hash[digest] = f"./assets/{name}"
            files_written += 1
        replacements += 1
        return files_by_hash[digest]
    html = DATA_URL.sub(extract, html)

    first_image = True
    img_tag = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
    def tune_image(match: re.Match[str]) -> str:
        nonlocal first_image
        tag = match.group(0)
        if " loading=" not in tag.lower():
            tag = tag[:-1] + (' loading="eager"' if first_image else ' loading="lazy"')
        if " decoding=" not in tag.lower():
            tag = tag[:-1] + ' decoding="async"'
        if first_image and " fetchpriority=" not in tag.lower():
            tag = tag[:-1] + ' fetchpriority="high"'
        first_image = False
        return tag
    html = img_tag.sub(tune_image, html)

    if "./upgrade.css" not in html:
        html = html.replace("</head>", '  <link rel="stylesheet" href="./upgrade.css" />\n</head>', 1)
    if "./upgrade.js" not in html:
        html = html.replace("</body>", '  <script src="./upgrade.js" defer></script>\n</body>', 1)
    HTML_PATH.write_text(html, encoding="utf-8")
    external_bytes = sum(path.stat().st_size for path in ASSET_DIR.glob("*.jpg"))
    print(f"Extracted {files_written} unique photos; replaced {replacements} embedded data URLs.")
    print(f"Final HTML size: {HTML_PATH.stat().st_size:,} bytes.")
    print(f"External photo payload: {external_bytes:,} bytes.")

if __name__ == "__main__":
    main()
