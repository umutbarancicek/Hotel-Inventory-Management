import fitz
from rapidocr_onnxruntime import RapidOCR
import os
import json
from concurrent.futures import ThreadPoolExecutor

pdf_path = r"C:\Users\Baran\Desktop\mallar.pdf"
out_json = r"C:\Users\Baran\Documents\GitHub\Hotel-Inventory-Management\scratch\mallar_ocr_parsed.json"

doc = fitz.open(pdf_path)
total_pages = len(doc)
print(f"Total pages to OCR: {total_pages}", flush=True)

ocr_instances = {}

def get_ocr():
    pid = os.getpid()
    tid = ThreadPoolExecutor
    return RapidOCR()

ocr_engine = RapidOCR()

def process_page(page_idx):
    try:
        doc_thread = fitz.open(pdf_path)
        page = doc_thread[page_idx]
        pix = page.get_pixmap(dpi=120)
        img_bytes = pix.tobytes("png")
        result, _ = ocr_engine(img_bytes)
        doc_thread.close()
        
        if not result:
            return []
        
        boxes = []
        for item in result:
            box, text, score = item[0], item[1], item[2]
            y_center = (box[0][1] + box[2][1]) / 2.0
            x_center = (box[0][0] + box[1][0]) / 2.0
            boxes.append({
                'text': text.strip(),
                'y': y_center,
                'x': x_center
            })
        
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

        parsed_rows = []
        for r in rows:
            row_str = " | ".join([cell['text'] for cell in r])
            parsed_rows.append({
                'page': page_idx + 1,
                'text': row_str,
                'cells': [cell['text'] for cell in r]
            })
        return parsed_rows
    except Exception as e:
        print(f"Error on page {page_idx+1}: {e}", flush=True)
        return []

all_extracted_rows = []
with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(process_page, range(total_pages)))
    for r_list in results:
        all_extracted_rows.extend(r_list)

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(all_extracted_rows, f, ensure_ascii=False, indent=2)

print(f"✅ Fast OCR complete! Saved {len(all_extracted_rows)} total rows to {out_json}", flush=True)
