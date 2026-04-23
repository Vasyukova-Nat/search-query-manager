from datetime import datetime, timezone
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import SearchQueryCreate, SearchQueryUpdate, PaginatedResponse, SearchQueryOut
from app import crud
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/queries", response_model=PaginatedResponse, summary="Список запросов")
async def list_queries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str | None = Query(None),
    sort_order: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    items, total = await crud.get_queries(db, page, page_size, sort_by, sort_order)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)

@app.post("/api/queries", response_model=SearchQueryOut, summary="Создать запрос")
async def create_query(data: SearchQueryCreate, db: AsyncSession = Depends(get_db)):
    query = await crud.create_query(db, data)
    deadline = query.deadline.replace(tzinfo=timezone.utc) if query.deadline.tzinfo is None else query.deadline
    is_expired = deadline < datetime.now(timezone.utc)
    return SearchQueryOut(
        id=query.id,
        name=query.name,
        created_at=query.created_at,
        updated_at=query.updated_at,
        is_active=query.is_active,
        owner=query.owner,
        deadline=query.deadline,
        found_objects_count=query.found_objects_count,
        is_expired=is_expired,
    )

@app.put("/api/queries/{query_id}", response_model=SearchQueryOut, summary="Изменить запрос")
async def update_query(query_id: int, data: SearchQueryUpdate, db: AsyncSession = Depends(get_db)):
    query = await crud.update_query(db, query_id, data)
    if not query:
        raise HTTPException(404, "Search query not found")
    deadline = query.deadline.replace(tzinfo=timezone.utc) if query.deadline.tzinfo is None else query.deadline
    is_expired = deadline < datetime.now(timezone.utc)
    return SearchQueryOut(
        id=query.id,
        name=query.name,
        created_at=query.created_at,
        updated_at=query.updated_at,
        is_active=query.is_active,
        owner=query.owner,
        deadline=query.deadline,
        found_objects_count=query.found_objects_count,
        is_expired=is_expired,
    )

@app.delete("/api/queries/{query_id}", summary="Удалить запрос")
async def delete_query(query_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await crud.delete_query(db, query_id)
    if not deleted:
        raise HTTPException(404, "Search query not found")
    return {"ok": True}

@app.post("/api/queries/batch-delete", summary="Массовое удаление")
async def batch_delete(ids: list[int], db: AsyncSession = Depends(get_db)):
    await crud.delete_queries_batch(db, ids)
    return {"ok": True, "deleted": len(ids)}

static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
    