from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

# ----------------- Auth Schemas -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    organization_name: Optional[str] = "Acme Corp"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    organization_id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Document Schemas -----------------
class DocumentResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    filename: str
    file_type: str
    file_size: int
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Knowledge / RAG Schemas -----------------
class Citation(BaseModel):
    document_id: str
    title: str
    chunk_index: int
    snippet: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    citations: List[Citation] = []

# ----------------- Invoice Schemas -----------------
class InvoiceItemResponse(BaseModel):
    id: str
    description: str
    quantity: float
    unit_price: float
    total_price: float

    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    vendor_name: str
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    currency: str
    status: str
    confidence_score: float
    items: List[InvoiceItemResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Agent Schemas -----------------
class AgentRunRequest(BaseModel):
    workflow_name: str = "invoice_processing_with_approval"
    input_data: Dict[str, Any]

class AgentStepResponse(BaseModel):
    id: str
    step_number: int
    node_name: str
    status: str
    details: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class AgentRunResponse(BaseModel):
    id: str
    workflow_name: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    steps: List[AgentStepResponse] = []
    requires_approval: bool = False
    approval_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- Approval Schemas -----------------
class ApprovalResponse(BaseModel):
    id: str
    run_id: Optional[str] = None
    title: str
    action_type: str
    payload: Dict[str, Any]
    status: str
    decision_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApprovalActionRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    reason: Optional[str] = None

# ----------------- Visual Product Search Schemas -----------------
class ProductResponse(BaseModel):
    id: str
    sku: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    similarity_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class VisualSearchResult(BaseModel):
    query_description: str
    matches: List[ProductResponse] = []

# ----------------- Analytics Schemas -----------------
class AnalyticsOverviewResponse(BaseModel):
    total_documents: int
    total_invoices_processed: int
    total_agent_runs: int
    pending_approvals: int
    accuracy_rate: float
    monthly_trends: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
