# British Academy Rafiganj ERP & Official Website

Production-style foundation for the official school website and school ERP for British Academy, Rafiganj, Aurangabad.

## Stack

- Frontend: React + Vite + CSS + JavaScript
- Backend: FastAPI with role-based demo authentication
- Database: PostgreSQL-ready schema in `database/schema.sql`
- Assets: School photos and admission poster in `frontend/public/assets`

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Run Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: `http://127.0.0.1:8000/docs`

## Demo ERP Logins

- Student: `BA2026001` / `student123`
- Teacher: `TCH001` / `teacher123`
- Admin: `admin` / `admin123`

## Included

- Multi-page school website
- Admission poster popup on first open
- Auto-rotating hero image slider
- Top notice ticker
- Admission inquiry form with backend reference number
- Fee structure table
- Gallery with events, sports, awards, learning and press categories
- Student, teacher and admin dashboard MVP
- Backend auth, admission inquiry and ERP dashboard endpoints
