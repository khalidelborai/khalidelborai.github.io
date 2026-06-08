#!/usr/bin/env python3
"""Generate /feed.json (JSON Feed 1.1) and /llms.txt from the posts in content/.

Run after `zola build`, against the output dir (default: public). Reads post
front matter directly so it needs no HTML parsing.
"""
import glob
import json
import os
import re
import sys
import tomllib

BASE = "https://blog.borai.dev"
out = sys.argv[1] if len(sys.argv) > 1 else "public"


def parse_front_matter(path):
    text = open(path, encoding="utf-8").read()
    m = re.match(r"^\+\+\+\s*\n(.*?)\n\+\+\+", text, re.S)
    if not m:
        return None
    try:
        return tomllib.loads(m.group(1))
    except tomllib.TOMLDecodeError:
        return None


posts = []
for path in glob.glob("content/*.md"):
    if os.path.basename(path) == "_index.md":
        continue
    fm = parse_front_matter(path)
    if not fm or not fm.get("title"):
        continue
    slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", os.path.basename(path)[:-3])
    posts.append({
        "title": fm["title"],
        "url": f"{BASE}/{slug}/",
        "date": str(fm.get("date", "")),
        "description": fm.get("description", "") or "",
        "tags": (fm.get("taxonomies") or {}).get("tags", []),
    })

posts.sort(key=lambda p: p["date"], reverse=True)

# --- JSON Feed 1.1 (https://jsonfeed.org) ---
feed = {
    "version": "https://jsonfeed.org/version/1.1",
    "title": "Khalid Elborai",
    "description": "Rust, security, and the tooling around them.",
    "home_page_url": f"{BASE}/",
    "feed_url": f"{BASE}/feed.json",
    "authors": [{"name": "Khalid Elborai", "url": f"{BASE}/about/"}],
    "language": "en",
    "items": [{
        "id": p["url"],
        "url": p["url"],
        "title": p["title"],
        "summary": p["description"],
        "date_published": (p["date"] + "T00:00:00Z") if p["date"] else None,
        "tags": p["tags"],
    } for p in posts],
}
with open(f"{out}/feed.json", "w", encoding="utf-8") as f:
    json.dump(feed, f, ensure_ascii=False, indent=2)

# --- llms.txt (https://llmstxt.org) ---
lines = [
    "# Khalid Elborai",
    "",
    "> CTO at Buguard, software engineer, and open-source contributor. "
    "Writes about Rust, security, and the fast tooling around them.",
    "",
    "## Posts",
    "",
]
for p in posts:
    suffix = f": {p['description']}" if p["description"] else ""
    lines.append(f"- [{p['title']}]({p['url']}){suffix}")
lines += [
    "",
    "## Pages",
    "",
    f"- [About]({BASE}/about/): who I am and how to reach me",
    f"- [Uses]({BASE}/uses/): the tools I work with",
    f"- [Now]({BASE}/now/): what I'm focused on",
    f"- [Projects]({BASE}/projects/): selected open-source work",
    "",
    "## Optional",
    "",
    f"- [JSON Feed]({BASE}/feed.json)",
    f"- [Atom feed]({BASE}/atom.xml)",
    "",
]
with open(f"{out}/llms.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"gen-extra: wrote feed.json ({len(posts)} items) + llms.txt")
