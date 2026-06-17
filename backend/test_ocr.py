import pytesseract
from PIL import Image

# Tesseract path

pytesseract.pytesseract.tesseract_cmd = (
r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# Your screenshot path

img_path = r"C:\Users\NEKILESH\Pictures\Screenshots\Screenshot 2026-06-16 124400.png"

# OCR

text = pytesseract.image_to_string(
Image.open(img_path),
lang="eng+tam",
config="--oem 3 --psm 6"
)

print(text)
