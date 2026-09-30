from pathlib import Path
import json
import fitz
import cv2
import numpy as np

root = Path(__file__).resolve().parents[1]
pdf = fitz.open(root / 'print/iris-birthday-printables.pdf')
image = pdf[0].get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False)
pixels = np.frombuffer(image.samples, dtype=np.uint8).reshape(image.height, image.width, 3)
url, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(pixels, cv2.COLOR_RGB2BGR))
assert url == 'https://outeri.github.io/iris-birthday-quest/', repr(url)
assert len(pdf) == 9
assert len(fitz.open(root / 'print/iris-birthday-organizer.pdf')) == 2
manifest = json.loads((root / 'docs/assets/sources.json').read_text(encoding='utf-8'))
for item in manifest:
    assert (root / 'docs' / item['file']).exists(), item
print('PASS: printed PDF QR decodes to the live URL; 9+2 pages and licensed resources are present.')
