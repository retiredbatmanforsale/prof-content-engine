#!/usr/bin/env python3
"""Replace raw Vimeo div+iframe blocks with <LessonVideo> component."""
import re, sys
from pathlib import Path

DOCS = Path(__file__).parent.parent / "docs"

# Pattern: <div className="not-prose my-6" style={{padding:'XX% 0 0 0',position:'relative'}}>
#            <iframe src="...vimeo..." ... title="..." />
#          </div>
PATTERN = re.compile(
    r'<div className="not-prose my-6" style=\{\{padding:\'(\d+\.?\d*)% 0 0 0\',position:\'relative\'\}\}>\n'
    r'  <iframe\n'
    r'    src="(https://player\.vimeo\.com/[^"]+)"\n'
    r'    frameBorder="0"\n'
    r'    allow="[^"]+"\n'
    r'    referrerPolicy="[^"]+"\n'
    r'    style=\{\{[^}]+\}\}\n'
    r'    title="([^"]*)"\n'
    r'  />\n'
    r'</div>',
    re.MULTILINE,
)

def replacement(m):
    padding = float(m.group(1))
    src = m.group(2)
    title = m.group(3)
    # Only include aspectRatio when it differs from the default (56.25)
    if abs(padding - 56.25) < 0.01:
        return f'<LessonVideo\n  src="{src}"\n  title="{title}"\n/>'
    else:
        return f'<LessonVideo\n  src="{src}"\n  title="{title}"\n  aspectRatio={{{padding}}}\n/>'

changed = []
for mdx in sorted(DOCS.rglob("*.mdx")):
    text = mdx.read_text()
    new_text, n = PATTERN.subn(replacement, text)
    if n:
        mdx.write_text(new_text)
        changed.append((mdx.relative_to(DOCS), n))

if changed:
    for path, n in changed:
        print(f"  {path}  ({n} replacement{'s' if n>1 else ''})")
    print(f"\nTotal: {len(changed)} files updated")
else:
    print("No files matched — pattern may need adjustment")
