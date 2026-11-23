from fastapi.testclient import TestClient

from app.main import app

cliente = TestClient(app)


def test_saude():
    resposta = cliente.get("/api/saude")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}
