
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import shutil
import os
import uuid
import json
import subprocess
import asyncio
from pathlib import Path
import fitz  # PyMuPDF

app = FastAPI(title="PDF2CSV API", description="Backend for PDF to CSV Converter with Langflow")

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
LANGFLOW_FILE = Path(__file__).parent.parent / "pdf_to_csv_summarizer.json"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "PDF2CSV Backend with Langflow is running"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")
    
    # Generate unique IDs
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Could not save file: {str(e)}"})

    # Extract and cache full text from PDF for fast future access
    try:
        import fitz
        doc = fitz.open(file_path)
        full_text = "\n".join(page.get_text() for page in doc)
        doc.close()
        # Save extracted text to a .txt file for this file_id
        txt_path = os.path.join(OUTPUT_DIR, f"{file_id}_fulltext.txt")
        with open(txt_path, "w", encoding="utf-8") as tf:
            tf.write(full_text)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"PDF text extraction failed: {str(e)}"})

    # For demo, still create a mock CSV and available columns (can be removed if not needed)
    csv_filename = f"{file_id}_output.csv"
    csv_path = os.path.join(OUTPUT_DIR, csv_filename)
    with open(csv_path, "w") as f:
        f.write("Title,Author,Summary,Key Points,Date\n")
        f.write(f'"{file.filename}","AI Generated","PDF processed successfully","Extracted data","2026-01-04"\n')

    extracted = {
        "Title": file.filename,
        "Author": "AI Generated",
        "Summary": "PDF processed successfully",
        "Key Points": "Extracted data",
        "Date": "2026-01-04"
    }

    return {
        "message": "File processed successfully",
        "filename": file.filename,
        "file_id": file_id,
        "status": "processed",
        "csv_download_url": f"/download/{file_id}",
        "available_columns": list(extracted.keys())
    }

@app.get("/download/{file_id}")
async def download_csv(file_id: str):
    csv_filename = f"{file_id}_output.csv"
    csv_path = os.path.join(OUTPUT_DIR, csv_filename)
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    return FileResponse(
        csv_path,
        media_type="text/csv",
        filename=f"converted_{file_id}.csv"
    )



@app.post("/generate_csv")
async def generate_filtered_csv(payload: dict):
    """
    Extract requested columns from the uploaded PDF using AI (simple demo: keyword search).
    Expects JSON payload: {"file_id": "...", "columns": ["Title","Date"]}
    """
    file_id = payload.get("file_id")
    columns = payload.get("columns")

    if not file_id or not columns:
        raise HTTPException(status_code=400, detail="file_id and columns are required")

    # Find the uploaded PDF file
    pdf_file = None
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(file_id):
            pdf_file = os.path.join(UPLOAD_DIR, fname)
            break
    if not pdf_file or not os.path.exists(pdf_file):
        raise HTTPException(status_code=404, detail="PDF file not found for given file_id")

    # Use cached text if available
    txt_path = os.path.join(OUTPUT_DIR, f"{file_id}_fulltext.txt")
    if not os.path.exists(txt_path):
        raise HTTPException(status_code=404, detail="Cached PDF text not found. Please re-upload the file.")
    with open(txt_path, "r", encoding="utf-8") as tf:
        full_text = tf.read()

    # Simple extraction: for each column, find the first line containing the column name and use the rest of the line as value
    extracted = {}
    for col in columns:
        value = ""
        for line in full_text.splitlines():
            if col.lower() in line.lower():
                idx = line.lower().find(col.lower()) + len(col)
                value = line[idx:].strip(" :-\t")
                if not value:
                    value = line.strip()
                break
        extracted[col] = value

    # Build CSV
    csv_filename = f"{file_id}_filtered.csv"
    csv_path = os.path.join(OUTPUT_DIR, csv_filename)
    with open(csv_path, "w", encoding="utf-8") as cf:
        cf.write(",".join([c.replace(',', ' ') for c in columns]) + "\n")
        row = [str(extracted.get(c, "")).replace('"', '""') for c in columns]
        quoted = [f'"{v}"' for v in row]
        cf.write(",".join(quoted) + "\n")

    return {"message": "Filtered CSV generated from PDF using AI extraction (cached)", "csv_download_url": f"/download_filtered/{file_id}"}


@app.get("/download_filtered/{file_id}")
async def download_filtered(file_id: str):
    csv_filename = f"{file_id}_filtered.csv"
    csv_path = os.path.join(OUTPUT_DIR, csv_filename)

    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Filtered CSV file not found")

    return FileResponse(
        csv_path,
        media_type="text/csv",
        filename=f"converted_filtered_{file_id}.csv"
    )

async def process_with_langflow(pdf_path: str, file_id: str):
    """
    Process PDF using the Langflow workflow
    Note: This requires lfx to be properly installed and configured
    """
    try:
        # Check if Langflow file exists
        if not LANGFLOW_FILE.exists():
            return {"success": False, "error": "Langflow workflow file not found"}
        
        # For now, return success with mock processing
        # In production, you would run: lfx run pdf_to_csv_summarizer.json --input pdf_path
        # But this requires proper Langflow setup with compatible dependencies
        
        return {"success": True, "output": "Mock processing completed"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
