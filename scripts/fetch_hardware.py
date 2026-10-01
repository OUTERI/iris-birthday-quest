from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request
import time
import json

ROOT = Path(__file__).resolve().parents[1] / 'docs'
VERSION = '0.10.22-rc.20250304'
BASE = f'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@{VERSION}'
FILES = [
    ('vendor/three.module.js', 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js'),
    ('licenses/three-MIT.txt', 'https://cdn.jsdelivr.net/npm/three@0.160.1/LICENSE'),
    ('vendor/mediapipe/vision_bundle.mjs', BASE+'/vision_bundle.mjs'),
    ('licenses/mediapipe-Apache-2.0.txt', 'https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE'),
    ('vendor/mediapipe/hand_landmarker.task', 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'),
] + [(f'vendor/mediapipe/wasm/{name}', BASE+'/wasm/'+name) for name in ['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm']]

def fetch(pair):
    relative, url = pair
    dest = ROOT / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        for attempt in range(4):
            try:
                with urllib.request.urlopen(url, timeout=90) as response:
                    data = response.read()
                dest.write_bytes(data)
                break
            except Exception:
                if attempt==3:
                    raise
                time.sleep(2*(attempt+1))
    return {'file':relative, 'source':url, 'bytes':dest.stat().st_size, 'license':'MIT' if 'three' in relative else 'Apache-2.0'}

with ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(fetch, FILES))
manifest=ROOT / 'assets/sources.json'
existing=json.loads(manifest.read_text(encoding='utf-8'))
existing=[item for item in existing if item.get('file') not in {r['file'] for r in results}]
existing.extend(results)
existing.extend([
    {'name':'Relationship memory photographs','files':'assets/memories/memory-01.webp … memory-11.webp','source':'User-provided photographs, 2026-10-01','license':'Used with user authorization for this birthday website','changes':'EXIF removed, orientation corrected, resized to maximum 1400 px and converted to WebP'},
    {'name':'Original magical audio and artwork','files':'immersion.js, hardware.js, assets/parchment-grain.svg, assets/wand-cursor.svg','source':'Created for Iris birthday quest','license':'Project original artwork and procedural audio'}
])
manifest.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(results))
