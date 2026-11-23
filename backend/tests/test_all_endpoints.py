import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": "e2e_tester@designops.ai",
            "password": "Password123!",
            "full_name": "E2E Integration Tester",
            "organization_name": "E2E Enterprise"
        }
    )
    if reg_res.status_code == 400:
        # Already exists, login
        login_res = client.post(
            "/api/auth/login",
            json={"email": "e2e_tester@designops.ai", "password": "Password123!"}
        )
        token = login_res.json()["access_token"]
    else:
        login_res = client.post(
            "/api/auth/login",
            json={"email": "e2e_tester@designops.ai", "password": "Password123!"}
        )
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]

def test_analytics_overview(auth_headers):
    res = client.get("/api/analytics/overview", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_documents" in data
    assert "accuracy_rate" in data

def test_documents_upload_and_list(auth_headers):
    file_content = b"DesignOps AI provides automated procurement policy guidelines and vector search."
    files = {"file": ("enterprise_policy.txt", io.BytesIO(file_content), "text/plain")}
    upload_res = client.post("/api/documents/upload", headers=auth_headers, files=files)
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    assert doc_data["filename"] == "enterprise_policy.txt"
    assert doc_data["status"] == "processed"

    list_res = client.get("/api/documents", headers=auth_headers)
    assert list_res.status_code == 200
    docs = list_res.json()
    assert len(docs) >= 1

def test_knowledge_rag_chat(auth_headers):
    res = client.post(
        "/api/knowledge/chat",
        headers=auth_headers,
        json={"message": "What is the policy for procurement?"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "conversation_id" in data
    assert "answer" in data
    assert isinstance(data["citations"], list)

def test_invoice_extraction(auth_headers):
    raw_text = """
    INVOICE #INV-49210
    From: Global Cloud Systems LLC
    Date: 2026-11-20
    Amount Due: $3,450.00
    Description: Annual High-Availability AI Server Hosting
    """
    res = client.post(
        "/api/invoices/extract",
        headers=auth_headers,
        data={"raw_text": raw_text}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["invoice_number"] == "49210" or "INV" in data["invoice_number"]
    assert data["total_amount"] > 0
    assert data["confidence_score"] >= 0.8

def test_agents_and_approvals(auth_headers):
    # Run agent requiring human approval (> $1000)
    run_res = client.post(
        "/api/agents/run",
        headers=auth_headers,
        json={
            "workflow_name": "vendor_disbursement",
            "input_data": {"amount": 2500.0, "recipient": "Cloud Vendor Inc"}
        }
    )
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "paused_for_approval"
    assert run_data["requires_approval"] is True
    approval_id = run_data["approval_id"]
    assert approval_id is not None

    # Check approvals list
    appr_res = client.get("/api/approvals", headers=auth_headers)
    assert appr_res.status_code == 200
    approvals = appr_res.json()
    assert any(a["id"] == approval_id for a in approvals)

    # Approve action
    action_res = client.post(
        f"/api/approvals/{approval_id}/action",
        headers=auth_headers,
        json={"action": "approve", "reason": "Verified purchase order"}
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "approved"

def test_visual_search(auth_headers):
    # 1x1 png image
    dummy_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    files = {"file": ("sample_product.png", io.BytesIO(dummy_png), "image/png")}
    res = client.post("/api/products/visual-search", headers=auth_headers, files=files)
    assert res.status_code == 200
    data = res.json()
    assert "matches" in data
    assert isinstance(data["matches"], list)
