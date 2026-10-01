from pathlib import Path
from fontTools.ttLib import TTFont

folder=Path(__file__).resolve().parents[1]/'docs/assets/fonts'
for name in ['cormorant','pinyon']:
    font=TTFont(folder/(name+'.ttf'))
    font.flavor='woff2'
    target=folder/(name+'.woff2')
    font.save(target)
    print(f'{target.name}: {target.stat().st_size} bytes')
