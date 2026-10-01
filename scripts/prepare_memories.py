from pathlib import Path
from PIL import Image, ImageOps
import json
import argparse

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Prepare the eleven supplied memory photos without retaining metadata.')
parser.add_argument('source', type=Path, help='Local folder containing the supplied JPG files')
SOURCE = parser.parse_args().source
NAMES = ['dff58e17c6cc1f9da9932a3e0e9ed5ad', '9cc77ae4d267bfcb23ecaae9103b5110', '129df12ed3a1705823c071aacb3f54d1', 'af95464340b453cbdbb111a699c480a8', 'd292c41492046c2d074e545e9229ab4e', '19598f961365e0f378888a49a582f05a', 'acad0097dbb52d0de8194ed51f7b7999', '48a90b01e7ea6f23d8feb3e74a3b6891', '85fdca2771c2e136197e7bf0e6aea52b', '6620f1bd324f7429622812a9e270e6c0', '541402b4e5505ec483c1b1c0bec5e90e']
OUT = ROOT / 'docs/assets/memories'
OUT.mkdir(parents=True, exist_ok=True)
report = []
for i, name in enumerate(NAMES, 1):
    with Image.open(SOURCE / (name + '.jpg')) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
        target = OUT / f'memory-{i:02}.webp'
        image.save(target, 'WEBP', quality=86, method=6)
        report.append({'file': target.name, 'size': image.size, 'bytes': target.stat().st_size})
print(json.dumps(report))
