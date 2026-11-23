# DesignOps AI — Render.com Deployment Guide

This guide walks through deploying the complete DesignOps AI platform to Render.com using the Infrastructure-as-Code Blueprint (`render.yaml`).

---

## 1. Prerequisites

1. A [Render.com](https://render.com) account.
2. A GitHub account with a repository containing this code.
3. A [Groq Cloud](https://console.groq.com) API key.
4. Optional: An S3-compatible bucket (AWS S3, Cloudflare R2, or Backblaze B2) for production file uploads.

---

## 2. Deployment via Render Blueprint (Recommended)

1. **Repository Link**:
   - Repository: `https://github.com/suriyaprakash-devx/disaster-prediction-alert-system`
   - Branch: `designops-ai`

2. **Navigate to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** > **Blueprint**.
   - Connect your `disaster-prediction-alert-system` repository.
   - When prompted for **Branch**, select or specify **`designops-ai`**.
   - Render will parse `render.yaml` from the `designops-ai` branch and discover three services:
     - `designops-ai-backend` (Python Web Service)
     - `designops-ai-frontend` (Static Site)
     - `designops-db` (PostgreSQL Database)

3. **Configure Secrets**:
   Render will prompt you for variables marked with `sync: false`:
   - `GROQ_API_KEY`: Enter your Groq API key (starts with `gsk_...`).
   - `STORAGE_PROVIDER`: Leave as `local` or switch to `s3` with your credentials.

4. **Click "Apply"**:
   - Render creates the PostgreSQL database.
   - Render builds the backend, runs the initial migration/seed (`python -m app.seed`), and binds to `0.0.0.0:$PORT`.
   - Render builds the frontend with `npm run build` and serves it on the static CDN.

---

## 3. Manual Deployment Alternative

If deploying services individually without Blueprint:

### Step A: Create Render PostgreSQL
- Name: `designops-db`
- Plan: Free or Starter
- Save the **Internal Database URL**.

### Step B: Create Backend Web Service
- Root Directory: `backend`
- Runtime: Python 3
- Build Command: `pip install --upgrade pip && pip install -r requirements.txt && python -m app.seed`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `DATABASE_URL`: Your Render PostgreSQL Internal URL
  - `APP_ENV`: `production`
  - `SECRET_KEY`: (generate random 32 bytes)
  - `JWT_SECRET_KEY`: (generate random 32 bytes)
  - `GROQ_API_KEY`: Your Groq API Key
  - `GROQ_MODEL`: `llama-3.3-70b-versatile`
  - `FRONTEND_URL`: URL of your frontend once deployed

### Step C: Create Frontend Static Site
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`
- Redirects/Rewrites:
  - Source: `/*` -> Destination: `/index.html` -> Status: `Rewrite`

---

## 4. Verification Checklist

1. Open `https://<backend-url>.onrender.com/health` in your browser. Verify `"status": "healthy"`.
2. Open `https://<backend-url>.onrender.com/docs` to test Swagger OpenAPI documentation.
3. Open `https://<frontend-url>.onrender.com`.
4. Sign in with the seeded administrator credentials:
   - **Email**: `admin@designops.ai`
   - **Password**: `DesignOps2026!`
5. Navigate through all modules (Knowledge Base, Documents, Invoices, Agents, Visual Search).
