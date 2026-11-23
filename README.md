# DesignOps AI — Enterprise Knowledge & Business Automation Copilot

DesignOps AI is an enterprise-grade AI platform combining document-based RAG knowledge management, automated invoice extraction, LangGraph multi-agent orchestration with human-in-the-loop approvals, and visual product search.

Built for high-reliability deployment on **Render.com**.

---

## Key Features

1. **Enterprise RAG Knowledge Copilot**: Vector retrieval and synthesis backed by Groq Hosted LLMs (`llama-3.3-70b-versatile`) with granular document citations.
2. **Document Processing Vault**: Multi-format ingestion supporting PDF, DOCX, TXT, and CSV files.
3. **AI Invoice Intelligence**: Fast structured extraction for invoice numbers, vendor names, dates, confidence scores, and line items.
4. **LangGraph Agentic Automation**: Deterministic state-machine business workflows with safety checks and human approval gates for transactions over $1,000.
5. **Visual Product Search**: Perceptual visual feature extraction and cosine vector similarity matching for catalog items.
6. **Executive Business Dashboard**: Real-time KPI cards, volume area charts, and knowledge distribution charts using Recharts.
7. **Production Security**: Argon2/bcrypt password hashing, JWT authentication, organization-level isolation, and safe CORS allowlists.

---

## Architecture & Directory Structure

```text
designops-ai/
│
├── frontend/                     # React 18, TypeScript, Vite, Tailwind CSS, Recharts
│   ├── src/
│   │   ├── api/                  # Dynamic API client with token injection
│   │   ├── components/           # Layout, Sidebar, navigation
│   │   ├── context/              # Authentication context & session persistence
│   │   └── pages/                # Dashboard, Knowledge, Documents, Invoices, Agents, VisualSearch
│   ├── public/_redirects         # SPA routing fallback for Render
│   └── package.json
│
├── backend/                      # Python FastAPI, SQLAlchemy 2.0, Uvicorn
│   ├── app/
│   │   ├── models/               # 17 Relational database entities
│   │   ├── routers/              # Modular API endpoints
│   │   ├── services/             # Groq LLM, Storage, RAG, Invoices, Agents
│   │   ├── main.py               # Application entry point with /health
│   │   └── seed.py               # Database initial seeder
│   ├── Dockerfile                # Production container specification
│   └── requirements.txt
│
├── docs/
│   ├── architecture.md           # System and database architecture
│   └── deployment.md             # Step-by-step Render guide
│
├── render.yaml                   # Infrastructure-as-Code Blueprint
├── DEPLOYMENT_REPORT.md          # Deployment readiness report
└── README.md
```

---

## Quick Start (Local Development)

### 1. Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Default admin login:
- **Email**: `admin@designops.ai`
- **Password**: `DesignOps2026!`

---

## Production Deployment to Render

See [docs/deployment.md](docs/deployment.md) for full instructions using the `render.yaml` Blueprint.
