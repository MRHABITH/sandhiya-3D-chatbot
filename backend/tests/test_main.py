from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Autonomous Support Bot API is running"}

def test_chat_endpoint():
    response = client.post("/chat", json={
        "session_id": "test-session",
        "user_id": "test-user",
        "message": "Hello"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "echo" in data["reply"].lower()
