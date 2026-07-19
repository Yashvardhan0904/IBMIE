# IBMIE

IBMIE is an AI-assisted health document companion. It lets a user upload lab reports or prescriptions, sends the documents through a FastAPI backend for parsing, stores the structured output in PostgreSQL/Supabase, and displays the extracted health data in a Next.js dashboard.

The current product focus is medical-document intake:

- Upload PDF lab reports and prescriptions.
- Extract structured biomarkers from lab reports.
- Extract normalized medication details from prescriptions.
- Show uploaded documents in the frontend dashboard and reports table.
- Open a document detail page backed by the backend API.

## Project Structure

```text
IBMIE/
  backend/
    app/
      api/              FastAPI route modules
      core/             config, logging, exceptions, upload validation
      database/         SQLAlchemy models and database setup
      schemas/          Pydantic request/response schemas
      services/         parsing, report, prescription, OCR, storage logic
      utils/            shared backend helpers
  frontend/
    app/                Next.js App Router pages
    components/         UI, dashboard, upload, report-detail components
    lib/                frontend types, API adapter, mock/lifestyle data
  parser.py             standalone parser experiment/helper
  requirements.txt      Python backend dependencies
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, lucide-react icons.
- Backend: FastAPI, Uvicorn, Pydantic, SQLAlchemy async, asyncpg.
- AI parsing: Groq chat completions API.
- PDF parsing: pypdf, pdf2image, pytesseract.
- Database/storage config: Supabase/Postgres environment variables.

## Environment

Create a root `.env` file with these values:

```env
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_DATABASE_URI=
SUPABASE_STORAGE_BUCKET=
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=25
REQUEST_TIMEOUT_SECONDS=120
```

Do not commit real secrets.

## Run Locally

Install backend dependencies:

```powershell
cd W:\IBMIE
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start the backend:

```powershell
cd W:\IBMIE\backend
W:\IBMIE\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the frontend:

```powershell
cd W:\IBMIE\frontend
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

- Frontend: http://127.0.0.1:3000
- Backend health: http://127.0.0.1:8000/health

## Backend API

Current endpoints:

```text
GET    /health
POST   /api/v1/reports/upload
GET    /api/v1/reports
GET    /api/v1/reports/{report_id}
DELETE /api/v1/reports/{report_id}

POST   /api/v1/prescriptions/upload
GET    /api/v1/prescriptions
GET    /api/v1/prescriptions/{prescription_id}
DELETE /api/v1/prescriptions/{prescription_id}
```

Uploads expect multipart form data with a `file` field. The frontend currently supports PDF uploads because the backend validation is PDF-focused.

## Current Progress

Completed:

- Backend starts successfully with the populated `.env`.
- Frontend starts successfully on port `3000`.
- Backend starts successfully on port `8000`.
- Backend `/health` returns `{"status":"ok"}`.
- Report and prescription list endpoints return `200`.
- Frontend dashboard and reports pages now read from the backend instead of only mock data.
- Frontend upload flow now sends real multipart PDF uploads to the backend.
- Added `frontend/lib/api.ts` as a single frontend adapter for backend calls and response mapping.
- Normalized prescription routes under `/api/v1/prescriptions`.
- Fixed a backend import issue in the prescription API route.
- Added missing OCR dependencies to `requirements.txt`.
- `npx tsc --noEmit` passes.
- `npm run build` passes.

Known gaps:

- `npm run lint` still fails because of existing lint issues in unrelated frontend files, mostly unescaped text and `any` types.
- Report list responses are lightweight; detailed extracted metrics are fetched only on the detail page.
- The frontend still contains mock lifestyle, reminders, weekly summary, and habit data.
- The frontend maps backend report data into the existing UI model with placeholder patient/reference-range fields where the backend does not yet provide those values.
- OCR fallback requires local Tesseract and Poppler binaries to be installed on the machine, not just the Python packages.
- The root `.env.example` has been removed in the current working tree and should be restored before sharing the project.

## Useless or Stale Frontend Items

The previous `frontend/README.md` is still the default create-next-app README. It does not describe this project and mentions template content such as Geist, Learn More, and Vercel deployment.

Likely removable frontend template assets:

```text
frontend/public/next.svg
frontend/public/vercel.svg
frontend/public/globe.svg
frontend/public/file.svg
frontend/public/window.svg
```

These assets are not referenced by the current frontend app.
Still workin