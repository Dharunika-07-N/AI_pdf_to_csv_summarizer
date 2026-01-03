# PDF to CSV Summarizer

AI-powered PDF to CSV converter using Langflow RAG workflow.

## Features

- 🤖 AI-powered PDF extraction
- 📊 Intelligent table and form recognition
- 🎯 Structured CSV output
- 🚀 Fast processing with Langflow
- 💾 Download results instantly

## Project Structure

```
langflow_pr_01/
├── backend/              # FastAPI backend
│   ├── main.py          # API endpoints
│   ├── requirements.txt # Python dependencies
│   ├── uploads/         # Uploaded PDFs
│   └── outputs/         # Generated CSVs
├── frontend/            # React frontend
│   └── src/
│       ├── App.jsx      # Main UI component
│       └── index.css    # Tailwind styles
└── pdf_to_csv_summarizer.json  # Langflow workflow
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Using the batch script (Windows)
```bash
.\start_app.bat
```

### Option 2: Manual start

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

## Langflow Integration

The `pdf_to_csv_summarizer.json` file contains a RAG-based workflow that:
1. Extracts text from PDFs
2. Processes content with AI
3. Generates structured CSV output

To use the full Langflow workflow, ensure you have:
- `lfx` installed (`pip install lfx`)
- Compatible langchain versions
- Google API key configured

## API Endpoints

- `POST /upload` - Upload and process PDF
- `GET /download/{file_id}` - Download generated CSV
- `GET /` - Health check

## Technologies

- **Backend**: FastAPI, Python
- **Frontend**: React, Vite, Tailwind CSS 4
- **AI**: Langflow, Google Generative AI
- **Icons**: Lucide React

## Notes

The current implementation uses mock CSV generation. To enable full AI processing:
1. Install compatible langchain versions
2. Configure Google API key
3. Update the `process_with_langflow` function in `backend/main.py`
