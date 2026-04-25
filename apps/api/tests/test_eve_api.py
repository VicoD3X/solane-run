import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_esi_client
from app.main import app


class FakeEsiClient:
    async def resolve_names(self, names: list[str]) -> dict:
        assert names == ["Jita", "Amarr"]
        return {
            "systems": [
                {"id": 30000142, "name": "Jita"},
                {"id": 30002187, "name": "Amarr"},
            ]
        }

    async def names(self, ids: list[int]) -> list[dict]:
        assert ids == [30000142]
        return [{"category": "solar_system", "id": 30000142, "name": "Jita"}]

    async def route(self, origin_id: int, destination_id: int, flag: str) -> list[int]:
        assert origin_id == 30000142
        assert destination_id == 30002187
        assert flag == "secure"
        return [30000142, 30000144, 30002187]


async def override_esi_client():
    yield FakeEsiClient()


@pytest.fixture(autouse=True)
def client_override():
    app.dependency_overrides[get_esi_client] = override_esi_client
    yield
    app.dependency_overrides.clear()


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "solane-run-api"}


def test_resolve_names() -> None:
    with TestClient(app) as client:
        response = client.post("/api/eve/resolve-names", json={"names": ["Jita", "Amarr"]})

    assert response.status_code == 200
    assert response.json()["systems"][0]["name"] == "Jita"


def test_names() -> None:
    with TestClient(app) as client:
        response = client.post("/api/eve/names", json={"ids": [30000142]})

    assert response.status_code == 200
    assert response.json()[0] == {"category": "solar_system", "id": 30000142, "name": "Jita"}


def test_route() -> None:
    with TestClient(app) as client:
        response = client.get(
            "/api/eve/route",
            params={"originId": 30000142, "destinationId": 30002187, "flag": "secure"},
        )

    assert response.status_code == 200
    assert response.json()["jumps"] == 2


def test_route_rejects_invalid_flag() -> None:
    with TestClient(app) as client:
        response = client.get(
            "/api/eve/route",
            params={"originId": 30000142, "destinationId": 30002187, "flag": "reckless"},
        )

    assert response.status_code == 422
