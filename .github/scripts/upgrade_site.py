#!/usr/bin/env python3
"""Move embedded image data URLs into local assets and attach the visual enhancement layer."""
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
    replacements = 0

    def extract(match: re.Match[str]) -> str:
        nonlocal replacements
        payload = base64.b64decode(match.group(1), validate=True)
        digest = hashlib.sha256(payload).hexdigest()
        if digest not in files_by_hash:
            number = len(files_by_hash) + 1
            name = f"kenangan-{number:02d}-{digest[:8]}.jpg"
            (ASSET_DIR / name).write_bytes(payload)
            files_by_hash[digest] = f"./assets/{name}"
        replacements += 1
        return files_by_hash[digest]

    html = DATA_URL.sub(extract, html)

    # Rebuild img tags from recognized attributes. This also repairs older malformed tags.
    img_tag = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
    def normalize_image(match: re.Match[str]) -> str:
        raw = match.group(0)
        attrs: list[str] = []
        for name in ("src", "alt", "id", "class", "width", "height", "loading", "decoding", "fetchpriority", "aria-label"):
            value = re.search(r'\b' + re.escape(name) + r'="([^"]*)"', raw, re.IGNORECASE)
            if value:
                attrs.append(f'{name}="{value.group(1)}"')
        # Older output may have merged several attributes into the loading value.
        loading = re.search(r'\bloading="(eager|lazy)', raw, re.IGNORECASE)
        decoding = re.search(r'\bdecoding="(async|sync|auto)', raw, re.IGNORECASE)
        priority = re.search(r'\bfetchpriority="(high|low|auto)', raw, re.IGNORECASE)
        attrs = [a for a in attrs if not a.startswith(("loading=", "decoding=", "fetchpriority="))]
        if loading:
            attrs.append(f'loading="{loading.group(1).lower()}"')
        if decoding:
            attrs.append(f'decoding="{decoding.group(1).lower()}"')
        if priority:
            attrs.append(f'fetchpriority="{priority.group(1).lower()}"')
        return "<img " + " ".join(attrs) + ">"

    html = img_tag.sub(normalize_image, html)

    # Add browser-friendly loading hints without altering image sources.
    first_image = True
    def tune_image(match: re.Match[str]) -> str:
        nonlocal first_image
        tag = match.group(0)
        if not re.search(r'\sloading\s*=', tag, flags=re.IGNORECASE):
            tag = tag[:-1] + (' loading="eager">' if first_image else ' loading="lazy">')
        if not re.search(r'\sdecoding\s*=', tag, flags=re.IGNORECASE):
            tag = tag[:-1] + ' decoding="async">'
        if first_image and not re.search(r'\sfetchpriority\s*=', tag, flags=re.IGNORECASE):
            tag = tag[:-1] + ' fetchpriority="high">'
        first_image = False
        return tag
    html = img_tag.sub(tune_image, html)

    if "./upgrade.css" not in html:
        html = html.replace("</head>", '  <link rel="stylesheet" href="./upgrade.css" />\n</head>', 1)
    if "./upgrade.js" not in html:
        html = html.replace("</body>", '  <script src="./upgrade.js" defer></script>\n</body>', 1)
    HTML_PATH.write_text(html, encoding="utf-8")
    external_bytes = sum(path.stat().st_size for path in ASSET_DIR.glob("*.jpg"))
    print(f"Replaced {replacements} embedded data URLs; normalized image tags.")
    print(f"Final HTML size: {HTML_PATH.stat().st_size:,} bytes.")
    print(f"External photo payload: {external_bytes:,} bytes.")

if __name__ == "__main__":
    main()
