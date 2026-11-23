# DesignOps AI — Architecture Specification

## 1. System Overview

DesignOps AI is an enterprise-grade AI knowledge and multi-agent business automation copilot designed for cloud-native deployment on Render.com.

### Technology Matrix

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide, Recharts | Single-Page Application (SPA) with real-time responsive analytics, knowledge chat, and human-in-the-loop approval console |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 | High-throughput asynchronous REST API with structured logging and OpenAPI specifications |
| **ORM & Data** | SQLAlchemy 2.0, Alembic, PostgreSQL 16+ | Connection-pooled relational persistence with 17 normalized tables and organization tenancy |
| **AI / LLM** | Groq API (`llama-3.3-70b-versatile`) | Hosted ultra-low-latency generative inference for RAG synthesis and structured invoice parsing |
| **Agentic Framework** | LangGraph State Machines | Deterministic business automation graph with risk scoring and approval gates |
| **Vector Engine** | Semantic Vector Projection + Cosine Similarity | Cross-database vector matching for document chunks and product images |
| **Storage** | S3-Compatible Object Store (AWS / Cloudflare R2 / MinIO) | Persistent document and invoice storage with strict validation |

---

## 2. Relational Schema Architecture

The database model provides multi-tenant data isolation partitioned by `organization_id`:

1. `organizations`: Root enterprise account entity.
2. `users`: Enterprise users with Argon2/bcrypt password hashing and JWT authentication.
3. `documents`: Metadata for uploaded PDFs, Word DOCXs, TXTs, and CSVs.
4. `document_chunks`: Semantic chunks with token counts and embedding vectors.
5. `conversations`: Threaded chat sessions.
6. `messages`: User and AI responses with grounded document citations.
7. `invoices`: AI-extracted financial documents.
8. `invoice_items`: Normalized line items for invoice reconciliation.
9. `products`: Catalog items for visual search.
10. `product_embeddings`: Multi-dimensional visual feature vectors.
11. `customers`: Customer CRM entity.
12. `orders`: Business procurement orders.
13. `agent_runs`: History of LangGraph workflow executions.
14. `agent_steps`: Granular state machine execution node traces.
15. `approvals`: Human-in-the-loop decision checkpoints.
16. `tasks`: System automation background tasks.
17. `audit_logs`: Immutable compliance audit trail.

---

## 3. Human-in-the-Loop Governance Flow

```
[Agent Trigger]
      │
      ▼
[Node 1: Policy Validator]
      │
      ▼
[Node 2: Risk Evaluator]
      │
   Amount ≥ $1,000?
   ├─── YES ───► [Node 3: Human Approval Gate] ───► (Workflow Paused)
   │                       │
   │                Operator Approves?
   │                ├─── YES ───► [Node 4: Execute Transaction] ──► [Completed]
   │                └─── NO  ───► [Node 4: Reject Transaction]  ──► [Failed]
   │
   └─── NO  ───► [Node 3: Automated Executor] ───► [Completed]
```
