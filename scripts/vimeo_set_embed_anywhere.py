#!/usr/bin/env python3
"""
vimeo_set_embed_anywhere.py

Sets embed privacy to "public" (anywhere) for every video in your Vimeo account.
Uses the video IDs already fetched in vimeo_embed_map.json.

Usage:
    VIMEO_TOKEN=your_token python3 scripts/vimeo_set_embed_anywhere.py

Requires: edit scope on the token (already present on your token).
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error

API_BASE = "https://api.vimeo.com"
MAP_FILE = os.path.join(os.path.dirname(__file__), "vimeo_embed_map.json")


def get_token():
    token = os.environ.get("VIMEO_TOKEN", "").strip()
    if not token:
        print("ERROR: Set VIMEO_TOKEN environment variable.")
        sys.exit(1)
    return token


def patch_video(video_id, token):
    url = f"{API_BASE}/videos/{video_id}"
    payload = json.dumps({"privacy": {"embed": "public"}}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/vnd.vimeo.*+json;version=3.4",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    token = get_token()

    if not os.path.exists(MAP_FILE):
        print(f"ERROR: {MAP_FILE} not found. Run fetch_vimeo_embeds.py first.")
        sys.exit(1)

    with open(MAP_FILE) as f:
        embed_map = json.load(f)

    video_ids = list(embed_map.keys())
    print(f"Setting embed=anywhere for {len(video_ids)} videos...\n")

    ok = []
    failed = []

    for video_id in video_ids:
        title = embed_map[video_id].get("title", video_id)
        status, err = patch_video(video_id, token)

        if status in (200, 204):
            print(f"  ✓  {video_id}  {title[:60]}")
            ok.append(video_id)
        else:
            print(f"  ✗  {video_id}  {title[:60]}  →  HTTP {status}: {err[:120] if err else ''}")
            failed.append(video_id)

        # Vimeo rate limit: 100 req/min — stay well under it
        time.sleep(0.7)

    print(f"\nDone.  {len(ok)} updated  |  {len(failed)} failed")
    if failed:
        print("Failed IDs:", failed)


if __name__ == "__main__":
    main()
