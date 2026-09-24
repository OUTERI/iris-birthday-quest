from pathlib import Path
import qrcode
from qrcode.image.svg import SvgPathImage

URL = "https://outeri.github.io/iris-birthday-quest/"
OUTPUT = Path(__file__).with_name("qr.svg")

qr = qrcode.QRCode(
    error_correction=qrcode.constants.ERROR_CORRECT_Q,
    box_size=10,
    border=4,
)
qr.add_data(URL)
qr.make(fit=True)
qr.make_image(image_factory=SvgPathImage).save(OUTPUT)
print(f"{OUTPUT}: {URL}")
