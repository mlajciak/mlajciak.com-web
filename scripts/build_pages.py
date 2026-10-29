#!/usr/bin/env python3
"""Write content/manifest.json from the titles of content/*.html."""

import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "content"
TITLE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def page_title(path):
    match = TITLE.search(path.read_text(encoding="utf-8"))
    if not match:
        return path.stem.replace("-", " ")
    return re.sub(r"\s+", " ", match.group(1)).strip()


def main():
    pages = [
        {"title": page_title(path), "href": "/" if path.stem == "about" else f"/{path.stem}/"}
        for path in PAGES.glob("*.html")
    ]
    pages.sort(key=lambda page: page["title"].casefold())
    (PAGES / "manifest.json").write_text(json.dumps(pages, indent=2) + "\n", encoding="utf-8")
    shell = ROOT / "index.html"
    if shell.exists():
        shutil.copyfile(shell, ROOT / "404.html")
    reserved = {"content", "public", "pages", "js", "blog", "img", "scripts"}
    for folder in ROOT.iterdir():
        if not folder.is_dir() or folder.name.startswith(".") or folder.name in reserved:
            continue
        index = folder / "index.html"
        if not index.is_file():
            continue
        if any(path.name != "index.html" for path in folder.iterdir()):
            continue
        index.unlink()
        folder.rmdir()


if __name__ == "__main__":
    main()
