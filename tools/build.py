#!/usr/bin/env python3
"""Build the game page and the verify-run Edge Function from src/.

    python3 tools/build.py [--artifact OUT.html]

- index.html                               GitHub Pages page (full HTML document)
- supabase/functions/verify-run/index.ts   Edge Function with the shared simulation inlined
- --artifact OUT.html                      body-only copy for a Claude artifact (optional)

src/sim.js is inlined into both the page and the Edge Function, so the server replays runs
with exactly the same code the game runs.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

sim = (SRC / 'sim.js').read_text()
game = (SRC / 'game.js').read_text()
page = (SRC / 'game.html').read_text().replace('/*__SIM__*/', sim).replace('/*__GAME__*/', game)

head, body = page.split('<!-- BODY -->\n')
doc_head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
(ROOT / 'index.html').write_text(f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#080f27">
<meta name="apple-mobile-web-app-capable" content="yes">
{doc_head}<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);background:#080f27}}</style>
</head>
<body>
{body}</body>
</html>
''')

fn_dir = ROOT / 'supabase' / 'functions' / 'verify-run'
fn_dir.mkdir(parents=True, exist_ok=True)
(fn_dir / 'index.ts').write_text((SRC / 'verify-run.ts').read_text().replace('/*__SIM__*/', sim))

if '--artifact' in sys.argv:
    out = pathlib.Path(sys.argv[sys.argv.index('--artifact') + 1])
    out.write_text(page)

print('built index.html and supabase/functions/verify-run/index.ts')
