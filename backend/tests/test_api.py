import pytest
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_list_queries(client):
    response = await client.get("/api/queries")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 10


@pytest.mark.asyncio
async def test_pagination(client):
    response = await client.get("/api/queries?page=1&page_size=3")
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 10
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_sorting(client):
    response = await client.get("/api/queries?sort_by=id&sort_order=descend")
    data = response.json()
    ids = [item["id"] for item in data["items"]]
    assert ids == sorted(ids, reverse=True)


@pytest.mark.asyncio
async def test_search(client):
    response = await client.get("/api/queries?search=query_5")
    data = response.json()
    assert data["total"] >= 1
    assert any("query_5" in item["name"] for item in data["items"])


@pytest.mark.asyncio
async def test_create_query(client):
    deadline = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    response = await client.post("/api/queries", json={
        "name": "new_query",
        "is_active": True,
        "deadline": deadline,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "new_query"
    assert data["found_objects_count"] == 0


@pytest.mark.asyncio
async def test_update_query(client):
    response = await client.put("/api/queries/1", json={
        "name": "updated_query",
        "is_active": False,
        "deadline": "2026-12-31T00:00:00+00:00",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "updated_query"
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_delete_query(client):
    response = await client.delete("/api/queries/1")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    response = await client.get("/api/queries")
    assert response.json()["total"] == 9


@pytest.mark.asyncio
async def test_batch_delete(client):
    response = await client.post("/api/queries/batch-delete", json=[1, 2, 3])
    assert response.status_code == 200
    assert response.json()["deleted"] == 3

    response = await client.get("/api/queries")
    assert response.json()["total"] == 7


@pytest.mark.asyncio
async def test_expired_indicator(client):
    deadline = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    response = await client.post("/api/queries", json={
        "name": "expired_query",
        "is_active": True,
        "deadline": deadline,
    })
    data = response.json()
    assert data["is_expired"] is True