
@echo off
echo Starting Backend...
start "PDF2CSV Backend" cmd /k "cd backend && uvicorn main:app --reload --port 8000"

echo Starting Frontend...
start "PDF2CSV Frontend" cmd /k "cd frontend && npm run dev"

echo Application launching...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
