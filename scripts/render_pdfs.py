from pathlib import Path
import fitz
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1]
out = root / 'output/pdf-review'
out.mkdir(parents=True, exist_ok=True)
thumbnails = []
for name, expected in [('iris-birthday-printables', 9), ('iris-birthday-organizer', 2)]:
    pdf = fitz.open(root / 'print' / (name + '.pdf'))
    assert len(pdf) == expected, (name, len(pdf))
    for index, page in enumerate(pdf):
        pix = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25))
        path = out / f'{name}-{index+1}.png'
        pix.save(path)
        image = Image.open(path).convert('RGB')
        image.thumbnail((330, 470))
        card = Image.new('RGB', (350, 510), '#d2c8b5')
        card.paste(image, ((350-image.width)//2, 20))
        ImageDraw.Draw(card).text((10, 485), f'{name} / {index+1}', fill='#49392c')
        thumbnails.append(card)
    print(name, len(pdf), 'pages rendered')
grid = Image.new('RGB', (350*4, 510*3), '#34302b')
for index, thumb in enumerate(thumbnails):
    grid.paste(thumb, ((index%4)*350,(index//4)*510))
grid.save(out / 'contact-sheet.jpg', quality=90)
