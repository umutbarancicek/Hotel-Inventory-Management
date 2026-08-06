import fitz
import os

pdf_path = r"C:\Users\Baran\Desktop\mallar.pdf"
out_dir = r"C:\Users\Baran\Documents\GitHub\Hotel-Inventory-Management\scratch\pdf_pages"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total Pages: {len(doc)}")

# Render first 5 pages to check images
for i in range(min(5, len(doc))):
    page = doc[i]
    pix = page.get_pixmap(dpi=150)
    out_path = os.path.join(out_dir, f"page_{i+1}.png")
    pix.save(out_path)
    print(f"Saved {out_path} ({pix.width}x{pix.height})")

