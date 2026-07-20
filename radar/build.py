#!/usr/bin/env python3
"""Regenerate the post regions of radar/index.html from the live Substack archive.

The page is the source of truth for design; this script only rewrites the four
marked POSTS: regions plus the status-bar date and count. Run it after publishing
a new dispatch:

    python3 radar/build.py            # rewrite index.html
    python3 radar/build.py --dry-run  # show what would change, write nothing

Editorial bits that Substack has no field for -- the topic tags and the "Threads"
counts in the sidebar -- stay hand-maintained. New posts simply get no tag until
you add one to TAGS below.
"""

import argparse
import html
import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ARCHIVE = "https://onrallabandiradar.substack.com/api/v1/archive?sort=new&limit=50"
PAGE = Path(__file__).resolve().parent / "index.html"

# slug -> replacement title/dek, for when the Substack subtitle doesn't work as
# landing-page copy (a bare URL, say). Anything not listed uses Substack verbatim.
OVERRIDES = {
    "jataayu-content-layer-for-ai-agents": {
        "title": "Jataayu: Content layer for AI agents — and the privacy they don't understand",
        "dek": "What an agent-facing content layer has to get right, and where today's "
               "agents quietly get privacy wrong. A write-up on the Jataayu project.",
    },
}

# slug -> tags, purely editorial. Unknown slugs render with no tags.
TAGS = {
    "jataayu-content-layer-for-ai-agents": ["AI agents", "Privacy"],
    "the-geometry-of-information-parallels": ["Physics", "Models"],
    "what-venice-can-teach-us-about-power": ["Power", "Humanoids"],
    "india-2032-progress-that-stopped": ["Power", "Automation"],
    "chinas-humanoid-boot-camp-robots": ["Humanoids", "China"],
    "asia-embraces-cute-robots": ["Humanoids", "Culture"],
    "trust-as-the-new-currency-in-the": ["Humanoids", "Trust"],
}


def fetch():
    # Substack 403s the default urllib User-Agent
    req = urllib.request.Request(ARCHIVE, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = json.load(r)
    posts = []
    for i, p in enumerate(raw):
        url = p.get("canonical_url") or ""
        d = datetime.strptime(p["post_date"][:10], "%Y-%m-%d")
        slug = url.rstrip("/").rsplit("/", 1)[-1]
        over = OVERRIDES.get(slug, {})
        posts.append({
            "title": over.get("title") or (p.get("title") or "").strip(),
            "dek": over.get("dek") or (p.get("subtitle") or "").strip(),
            "url": url,
            "slug": slug,
            "long": d.strftime("%d %b %Y"),
            "short": d.strftime("%d.%m.%y"),
            "seed": i + 1,        # drives the generated cover art; stable per position
        })
    if not posts:
        sys.exit("archive returned no posts -- refusing to blank the page")
    return posts


def e(s):
    return html.escape(s, quote=True)


def tags(p, sep=""):
    return sep.join(f'<span class="tag">{e(t)}</span>' for t in TAGS.get(p["slug"], []))


def featured(p):
    return f'''
      <a class="story lead" href="{e(p['url'])}">
        <canvas class="art" data-seed="{p['seed']}" data-dense="1" width="1200" height="620"></canvas>
        <div class="txt">
          <h2>{e(p['title'])}</h2>
          <p class="dek">{e(p['dek'])}</p>
          <div class="meta"><span class="label num">{p['long']}</span>{tags(p)}</div>
        </div>
      </a>'''


def secondary(posts):
    return "".join(f'''
      <a class="story" href="{e(p['url'])}">
        <canvas class="art" data-seed="{p['seed']}" width="520" height="300"></canvas>
        <h3>{e(p['title'])}</h3>
        <p class="dek">{e(p['dek'])}</p>
        <div class="meta"><span class="label num">{p['long']}</span>{tags(p)}</div>
      </a>''' for p in posts)


def rail(posts):
    return "".join(f'''
      <a class="story" href="{e(p['url'])}">
        <div>
          <h3>{e(p['title'])}</h3>
          <div class="meta"><span class="label num">{p['long']}</span></div>
        </div>
        <canvas class="art" data-seed="{p['seed']}" width="220" height="150"></canvas>
      </a>''' for p in posts)


def log(posts):
    out = []
    for i, p in enumerate(posts):
        mark = '<span class="label mark">◆ Latest</span>' if i == 0 else ""
        out.append(f'''
      <a class="story" data-blip="{i}" href="{e(p['url'])}">
        <div class="bearing">{mark}<span class="label num">{p['short']}</span></div>
        <div>
          <h3>{e(p['title'])}</h3>
          <p class="dek">{e(p['dek'])}</p>
        </div>
        <canvas class="art" data-seed="{p['seed']}" width="300" height="190"></canvas>
      </a>''')
    return "".join(out)


def splice(page, name, body):
    pat = re.compile(f"(<!-- POSTS:{name} -->).*?(<!-- /POSTS:{name} -->)", re.S)
    page, n = pat.subn(lambda m: m.group(1) + body + "\n      " + m.group(2), page)
    if n != 1:
        sys.exit(f"marker POSTS:{name} not found exactly once (found {n})")
    return page


def between(page, tag, body):
    pat = re.compile(f"(<!--{tag}-->).*?(<!--/{tag}-->)", re.S)
    page, n = pat.subn(lambda m: m.group(1) + body + m.group(2), page)
    if n != 1:
        sys.exit(f"marker {tag} not found exactly once (found {n})")
    return page


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    posts = fetch()
    page = original = PAGE.read_text(encoding="utf-8")

    # front block mirrors the reference layout: 1 featured, 2 secondary, next 4 in the rail
    page = splice(page, "FEATURED", featured(posts[0]))
    page = splice(page, "SECONDARY", secondary(posts[1:3]))
    page = splice(page, "RAIL", rail(posts[3:7]))
    page = splice(page, "LOG", log(posts))
    page = between(page, "LAST", posts[0]["long"])
    page = between(page, "COUNT", str(len(posts)))

    untagged = [p["slug"] for p in posts if p["slug"] not in TAGS]
    if untagged:
        print("no tags yet for:", ", ".join(untagged))

    if args.dry_run:
        print(f"{len(posts)} posts; index.html would "
              f"{'change' if page != original else 'be unchanged'}")
        return

    PAGE.write_text(page, encoding="utf-8")
    print(f"wrote {PAGE.relative_to(Path.cwd()) if PAGE.is_relative_to(Path.cwd()) else PAGE}"
          f" -- {len(posts)} posts, latest {posts[0]['long']}")


if __name__ == "__main__":
    main()
