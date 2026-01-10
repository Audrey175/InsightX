# InsightX

## Local Development

### Backend (FastAPI)
- Install dependencies: `pip install -r backend/requirements.txt`
- Start API: `uvicorn app:app --reload`
- Seed data: `python seed_data.py`
- Database: SQLite defaults to `insightx.db` (override with `DATABASE_URL`).

### Frontend (Vite/React)
- `cd insightx-frontend`
- Install: `npm install`
- Run: `npm run dev`
- Build: `npm run build`
- Env: copy `insightx-frontend/.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Vercel Frontend Deployment
- Root Directory: `insightx-frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL=https://<backend-host>`
  - `VITE_USE_MOCK=false`

## Backend Hosting (Render/Railway/Fly)
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Ensure `DATABASE_URL` is set if you are not using SQLite.
