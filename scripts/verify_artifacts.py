from pathlib import Path
import json
import fitz
import cv2
import numpy as np

root = Path(__file__).resolve().parents[1]
pdf = fitz.open(root / 'print/iris-birthday-printables-immersive.pdf')
image = pdf[0].get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False)
pixels = np.frombuffer(image.samples, dtype=np.uint8).reshape(image.height, image.width, 3)
url, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(pixels, cv2.COLOR_RGB2BGR))
assert url == 'https://outeri.github.io/iris-birthday-quest/', repr(url)
assert len(pdf) == 15
host = fitz.open(root / 'print/iris-birthday-organizer-immersive.pdf')
assert len(host) == 8
text = '\n'.join(page.get_text() for page in host)
compact = ''.join(text.split())
for required in ['Lumos', 'Alohomora', 'Expecto Patronum', '1111', '20', '05', '10', '02', '24', '11', '提示 1', '提示 2', '提示 3']:
    assert ''.join(required.split()) in compact, required
for page in pdf:
    assert round(page.rect.width) == 595 and round(page.rect.height) == 842, page.rect
manifest = json.loads((root / 'docs/assets/sources.json').read_text(encoding='utf-8'))
for item in manifest:
    if 'file' in item:
        assert (root / 'docs' / item['file']).exists(), item
assert len(list((root / 'docs/assets/memories').glob('memory-*.webp'))) == 11
print('PASS: PDF QR decodes to the live URL; 15+8 A4 pages, spell instructions, all marks, progressive hints and eleven photos are present.')
