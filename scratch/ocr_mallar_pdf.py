import fitz
from rapidocr_onnxruntime import RapidOCR
import os
import json

pdf_path = r"C:\Users\Baran\Desktop\mallar.pdf"
out_json = r"C:\Users\Baran\Documents\GitHub\Hotel-Inventory-Management\scratch\mallar_ocr_parsed.json"

ocr = RapidOCR()
doc = fitz.open(pdf_path)

print(f"Starting OCR extraction on {len(doc)} pages of mallar.pdf...")

all_rows = []

for page_idx in range(len(doc)):
    page = doc[page_idx]
    pix = page.get_pixmap(dpi=150)
    img_bytes = pix.tobytes("png")
    
    result, _ = ocr(img_bytes)
    if not result:
        continue
    
    # Sort detected text lines vertically (y position) then horizontally (x position)
    boxes = []
    for item in result:
        box, text, score = item[0], item[1], item[2]
        # box: [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
        y_center = (box[0][1] + box[2][1]) / 2.0
        x_center = (box[0][0] + box[1][0]) / 2.0
        boxes.append({
            'text': text.strip(),
            'y': y_center,
            'x': x_center,
            'score': score
        })
    
    # Group boxes into table rows by Y coordinate threshold (~15px)
    boxes.sort(key=lambda b: b['y'])
    rows = []
    curr_row = []
    curr_y = None

    for b in boxes:
        if curr_y is None or abs(b['y'] - curr_y) <= 15:
            curr_row.append(b)
            if curr_y is None:
                curr_y = b['y']
            else:
                curr_y = (curr_y * len(curr_row) + b['y']) / (len(curr_row) + 1)
        else:
            curr_row.sort(key=lambda item: item['x'])
            rows.append(curr_row)
            curr_row = [b]
            curr_y = b['y']
    if curr_row:
        curr_row.sort(key=lambda item: item['x'])
        rows.append(curr_row)

    for r in rows:
        row_str = " | ".join([cell['text'] for cell in r])
        all_rows.append({
            'page': page_idx + 1,
            'text': row_str,
            'cells': [cell['text'] for cell in r]
        })

    if (page_idx + 1) % 10 == 0 or (page_idx + 1) == len(doc):
        print(f"Processed {page_idx + 1}/{len(doc)} pages ({len(all_rows)} total rows extracted)...")

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(all_rows, f, ensure_ascii=False, indent=2)

print(f"\n✅ OCR Extraction complete! Saved {len(all_rows)} total rows to {out_json}")
