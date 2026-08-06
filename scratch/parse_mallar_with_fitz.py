import fitz
import sys

pdf_path = r"C:\Users\Baran\Desktop\mallar.pdf"
doc = fitz.open(pdf_path)

print(f"Total Pages in PDF: {len(doc)}")

all_text = []
for page_num in range(len(doc)):
    page = doc[page_num]
    text = page.get_text()
    if text and text.strip():
        all_text.append(f"--- PAGE {page_num + 1} --- \n" + text)

full_extracted = "\n".join(all_text)
print(f"Total Extracted Text Length: {len(full_extracted)} chars")

with open(r"C:\Users\Baran\Documents\GitHub\Hotel-Inventory-Management\scratch\mallar_pdf_text.txt", "w", encoding="utf-8") as f:
    f.write(full_extracted)

print("Sample first 1000 chars of extracted text:")
print(full_extracted[:1000])
