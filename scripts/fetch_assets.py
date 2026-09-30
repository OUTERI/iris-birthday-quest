"""Fetch explicitly licensed assets and prepare local, mobile-sized resources."""
from pathlib import Path
import json
import re
import urllib.request
import zipfile
import io
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs/assets'
LICENSES = ROOT / 'docs/licenses'
ASSETS.mkdir(exist_ok=True)
LICENSES.mkdir(exist_ok=True)
manifest = []

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'IrisBirthdayQuest/3.0 (private birthday webpage)'})
    return urllib.request.urlopen(req, timeout=45).read()

def download(url, target, name, license_name):
    path = ROOT / 'docs' / target
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(fetch(url))
    manifest.append({'name': name, 'file': target, 'source': url, 'license': license_name})
    print('Downloaded', target, flush=True)

download('https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/PinyonScript-Regular.ttf', 'assets/fonts/pinyon.ttf', 'Pinyon Script', 'SIL OFL 1.1')
download('https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/OFL.txt', 'licenses/pinyon-OFL.txt', 'Pinyon Script license', 'SIL OFL 1.1')
download('https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf', 'assets/fonts/cormorant.ttf', 'Cormorant Garamond', 'SIL OFL 1.1')
download('https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt', 'licenses/cormorant-OFL.txt', 'Cormorant license', 'SIL OFL 1.1')
download('https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js', 'vendor/anime.min.js', 'Anime.js 3.2.2', 'MIT')
download('https://raw.githubusercontent.com/juliangarnier/anime/v3.2.2/LICENSE.md', 'licenses/anime-MIT.txt', 'Anime.js license', 'MIT')
download('https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js', 'vendor/Sortable.min.js', 'SortableJS 1.15.6', 'MIT')
download('https://raw.githubusercontent.com/SortableJS/Sortable/1.15.6/LICENSE', 'licenses/sortable-MIT.txt', 'SortableJS license', 'MIT')

castle_url = 'https://upload.wikimedia.org/wikipedia/commons/8/87/Alnwick_Castle_Exterior.JPG'
try:
    data = fetch(castle_url)
    image = Image.open(io.BytesIO(data)).convert('RGB')
    image.thumbnail((1600, 1200))
    image.save(ASSETS / 'alnwick-castle.webp', quality=83)
    manifest.append({'name':'Alnwick Castle Exterior — EoRdE6', 'file':'assets/alnwick-castle.webp', 'source':'https://commons.wikimedia.org/wiki/File:Alnwick_Castle_Exterior.JPG', 'license':'CC BY-SA 4.0', 'license_url':'https://creativecommons.org/licenses/by-sa/4.0/', 'changes':'resized and converted to WebP'})
except Exception as exc:
    print('Castle download unavailable:', exc, flush=True)

try:
    html = fetch('https://kenney.nl/assets/interface-sounds').decode()
    urls = re.findall(r'href=[\"\']([^\"\']+\.zip[^\"\']*)', html)
    if not urls:
        raise RuntimeError('No direct ZIP link on asset page')
    from urllib.parse import urljoin
    archive = zipfile.ZipFile(io.BytesIO(fetch(urljoin('https://kenney.nl/assets/interface-sounds', urls[0]))))
    names = [n for n in archive.namelist() if n.lower().endswith('.ogg') and 'click' in n.lower()]
    if not names:
        names = [n for n in archive.namelist() if n.lower().endswith('.wav') and 'click' in n.lower()]
    sound = names[0]
    target = ASSETS / ('interface-click' + Path(sound).suffix)
    target.write_bytes(archive.read(sound))
    manifest.append({'name':'Kenney Interface Sounds', 'file':'assets/'+target.name, 'source':'https://kenney.nl/assets/interface-sounds', 'license':'CC0 1.0'})
    (LICENSES / 'kenney-CC0.txt').write_text('Kenney Interface Sounds — https://kenney.nl/assets/interface-sounds\nCreative Commons CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/\n', encoding='utf-8')
    print('Downloaded', target.name, flush=True)
except Exception as exc:
    print('Sound pack unavailable:', exc, flush=True)

for path in ASSETS.glob('*.png'):
    image = Image.open(path)
    image.thumbnail((1440, 1440))
    target = path.with_suffix('.webp')
    image.save(target, quality=83, method=6)
    print('Optimized', target.name, target.stat().st_size, flush=True)

(ASSETS / 'sources.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')
print('Asset manifest saved')
