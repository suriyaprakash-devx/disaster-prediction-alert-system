import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_and_login_flow():
    unique_suffix = str(uuid.uuid4())[:8]
    test_email = f"dev_{unique_suffix}@designops.ai"
    test_password = "SecurePassword123!"

    # 1. Register
    reg_response = client.post(
        "/api/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "Test DevOps Lead",
            "organization_name": "CloudOps Inc"
        }
    )
    assert reg_response.status_code == 201
    user_data = reg_response.json()
    assert user_data["email"] == test_email
    assert user_data["role"] == "admin"

    # 2. Login
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 3. Test Me Endpoint
    token = token_data["access_token"]
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == test_email
