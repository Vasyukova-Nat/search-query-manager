import random
from sqlalchemy import select, func, case, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import ColumnElement
from app.models import SearchQuery
from app.schemas import SearchQueryCreate, SearchQueryUpdate

SORTABLE_FIELDS = {
    "id": SearchQuery.id,
    "name": SearchQuery.name,
    "created_at": SearchQuery.created_at,
    "updated_at": SearchQuery.updated_at,
    "is_active": SearchQuery.is_active,
    "owner": SearchQuery.owner,
    "deadline": SearchQuery.deadline,
    "found_objects_count": SearchQuery.found_objects_count,
}

def _build_query(sort_by: str | None, sort_order: str | None):
    is_expired_case: ColumnElement[bool] = case(
        (SearchQuery.deadline < func.now(), True),
        else_=False,
    ).label("is_expired")

    query = select(
        SearchQuery.id,
        SearchQuery.name,
        SearchQuery.created_at,
        SearchQuery.updated_at,
        SearchQuery.is_active,
        SearchQuery.owner,
        SearchQuery.deadline,
        SearchQuery.found_objects_count,
        is_expired_case,
    )

    if sort_by and sort_by in SORTABLE_FIELDS:
        col = SORTABLE_FIELDS[sort_by]
        if sort_order == "descend":
            col = col.desc()
        query = query.order_by(col)
    else:
        query = query.order_by(SearchQuery.id.desc())

    return query

async def get_queries(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    sort_by: str | None = None,
    sort_order: str | None = None,
    search: str | None = None,
):
    query = _build_query(sort_by, sort_order)
    count_query = select(func.count(SearchQuery.id))

    if search:
        query = query.where(SearchQuery.name.contains(search))
        count_query = count_query.where(SearchQuery.name.contains(search))

    total = (await db.execute(count_query)).scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    items = [dict(row._mapping) for row in result.all()]

    return items, total

async def get_query_by_id(db: AsyncSession, query_id: int):
    query = await db.get(SearchQuery, query_id)
    return query

async def create_query(db: AsyncSession, data: SearchQueryCreate):
    new_query = SearchQuery(
        name=data.name,
        is_active=data.is_active,
        deadline=data.deadline,
        owner=f"user_{random.randint(1, 1000)}",
        found_objects_count=0,
    )
    db.add(new_query)
    await db.commit()
    await db.refresh(new_query)
    return new_query

async def update_query(db: AsyncSession, query_id: int, data: SearchQueryUpdate):
    query = await db.get(SearchQuery, query_id)
    if not query:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(query, key, value)
    await db.commit()
    await db.refresh(query)
    return query

async def delete_query(db: AsyncSession, query_id: int):
    query = await db.get(SearchQuery, query_id)
    if not query:
        return False
    await db.delete(query)
    await db.commit()
    return True

async def delete_queries_batch(db: AsyncSession, ids: list[int]):
    stmt = delete(SearchQuery).where(SearchQuery.id.in_(ids))
    await db.execute(stmt)
    await db.commit()