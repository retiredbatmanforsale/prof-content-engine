#!/usr/bin/env python3
"""
fetch_vimeo_embeds.py

Fetches all videos from the authenticated Vimeo account and generates
ready-to-paste MDX embed blocks for each video.

Usage:
    VIMEO_TOKEN=your_token python3 scripts/fetch_vimeo_embeds.py

Output:
    scripts/vimeo_embed_blocks.md  — human-readable reference with embed blocks
    scripts/vimeo_embed_map.json   — machine-readable map: {video_id: {...}}
"""

import os
import sys
import re
import json
import urllib.request
import urllib.error
from textwrap import dedent
from typing import Optional

API_BASE = "https://api.vimeo.com"
PER_PAGE = 100  # max allowed by Vimeo API


def get_token() -> str:
    token = os.environ.get("VIMEO_TOKEN", "").strip()
    if not token:
        print("ERROR: Set VIMEO_TOKEN environment variable before running.")
        print("  export VIMEO_TOKEN=your_personal_access_token")
        sys.exit(1)
    return token


def api_get(path: str, token: str) -> dict:
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.vimeo.*+json;version=3.4",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code} on {url}: {body}")
        sys.exit(1)


def extract_h_hash(embed_html: str) -> Optional[str]:
    """Pull the h= hash from the embed src URL inside the raw HTML string."""
    match = re.search(r'[?&]h=([a-f0-9]+)', embed_html or "")
    return match.group(1) if match else None


def extract_video_id(embed_html: str) -> Optional[str]:
    match = re.search(r'player\.vimeo\.com/video/(\d+)', embed_html or "")
    return match.group(1) if match else None


def build_mdx_embed(video_id: str, h_hash: Optional[str], title: str) -> str:
    src_params = f"badge=0&autopause=0&player_id=0&app_id=58479"
    if h_hash:
        src_params = f"h={h_hash}&{src_params}"
    src = f"https://player.vimeo.com/video/{video_id}?{src_params}"

    # JSX-safe title (escape double quotes)
    safe_title = title.replace('"', '&quot;')

    return dedent(f"""\
        <div className="not-prose my-6" style={{{{padding:'54.37% 0 0 0',position:'relative'}}}}>
          <iframe
            src="{src}"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{{{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}}}
            title="{safe_title}"
          />
        </div>""")


def fetch_all_videos(token: str) -> list[dict]:
    videos = []
    page = 1
    while True:
        data = api_get(
            f"/me/videos?page={page}&per_page={PER_PAGE}&fields=uri,name,embed,link,duration,created_time",
            token,
        )
        batch = data.get("data", [])
        videos.extend(batch)
        print(f"  Fetched page {page}: {len(batch)} videos (total so far: {len(videos)})")
        if len(videos) >= data.get("total", 0) or not data.get("paging", {}).get("next"):
            break
        page += 1
    return videos


def main():
    token = get_token()
    print("Fetching videos from Vimeo...")
    videos = fetch_all_videos(token)
    print(f"\nTotal videos fetched: {len(videos)}\n")

    embed_map = {}     # video_id -> metadata + embed
    md_lines = [
        "# Vimeo Embed Blocks",
        f"\nGenerated {len(videos)} videos. Paste any block directly into an MDX file.\n",
        "---\n",
    ]

    for v in sorted(videos, key=lambda x: x.get("created_time", "")):
        title = v.get("name", "Untitled")
        embed_html = (v.get("embed") or {}).get("html", "")
        link = v.get("link", "")

        video_id = extract_video_id(embed_html) or re.search(r'/(\d+)$', link or "")
        if hasattr(video_id, "group"):
            video_id = video_id.group(1)

        h_hash = extract_h_hash(embed_html)

        if not video_id:
            print(f"  WARNING: Could not extract video ID for '{title}' — skipping")
            continue

        mdx_block = build_mdx_embed(video_id, h_hash, title)

        embed_map[video_id] = {
            "title": title,
            "video_id": video_id,
            "h_hash": h_hash,
            "vimeo_link": link,
            "created_time": v.get("created_time"),
            "duration_seconds": v.get("duration"),
            "mdx_embed": mdx_block,
        }

        md_lines.append(f"## {title}")
        md_lines.append(f"\n**Video ID:** `{video_id}`  ")
        if h_hash:
            md_lines.append(f"**h hash:** `{h_hash}`  ")
        md_lines.append(f"**Vimeo link:** {link}  ")
        md_lines.append(f"**Duration:** {v.get('duration', '?')}s\n")
        md_lines.append("```jsx")
        md_lines.append(mdx_block)
        md_lines.append("```\n")
        md_lines.append("---\n")

    # Write markdown reference
    md_path = "scripts/vimeo_embed_blocks.md"
    with open(md_path, "w") as f:
        f.write("\n".join(md_lines))
    print(f"Written: {md_path}")

    # Write JSON map
    json_path = "scripts/vimeo_embed_map.json"
    with open(json_path, "w") as f:
        json.dump(embed_map, f, indent=2, ensure_ascii=False)
    print(f"Written: {json_path}")

    print(f"\nDone. {len(embed_map)} embed blocks generated.")
    print(f"Open {md_path} to copy-paste blocks into your MDX lessons.")


if __name__ == "__main__":
    main()
