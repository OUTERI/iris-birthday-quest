from pathlib import Path
import shutil
import hashlib
import fitz

root=Path(__file__).resolve().parents[1]
target=root/'docs/print'
target.mkdir(exist_ok=True)
for name,count in [('iris-birthday-printables-immersive.pdf',15),('iris-birthday-organizer-immersive.pdf',8)]:
    source=root/'print'/name
    with fitz.open(source) as pdf:
        assert len(pdf)==count, name
    shutil.copyfile(source,target/name)
    assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256((target/name).read_bytes()).digest()
shutil.copyfile(root/'print/现场布置与提示.md',target/'guide.md')
print('Verified PDFs and setup guide copied to the GitHub Pages print hub.')
