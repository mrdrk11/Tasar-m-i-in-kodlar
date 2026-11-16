#!/usr/bin/env python3
"""Attach photographs to menu items.
   python3 tools/menu-ekle.py <image file>="<item name>" [...]
Saves each image as public/menu/<slug>.webp and sets the item's foto in src/menu-veri.js."""
import re, subprocess, sys
TR = str.maketrans('çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU')
def slug(ad):
    return re.sub(r'[^a-z0-9]+', '-', ad.translate(TR).lower()).strip('-')
pairs = [a.split('=', 1) for a in sys.argv[1:]]
p = 'src/menu-veri.js'
s = open(p, encoding='utf-8').read()
args = []
for src, ad in pairs:
    key = "{ ad: '" + ad + "',"
    assert s.count(key) == 1, 'item not found exactly once: ' + ad
    a = s.index(key)
    m = re.compile(r"foto: (null|'[^']*')").search(s, a)
    assert m and m.start() - a < 400, ad
    s = s[:m.start()] + "foto: '" + slug(ad) + ".webp'" + s[m.end():]
    args.append(src + '=' + slug(ad))
subprocess.run(['node', 'tools/menu-foto.mjs', *args], check=True)
open(p, 'w', encoding='utf-8').write(s)
print('with photo:', len(re.findall(r"foto: '", s)), 'of', len(re.findall(r'foto: ', s)) - 0)
