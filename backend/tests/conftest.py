import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models import SearchQuery

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        now = datetime.now(timezone.utc)
        queries = [
            SearchQuery(
                name=f"query_{i}",
                is_active=i % 2 == 0,
                deadline=now + timedelta(days=i % 5),
                owner=f"user_{i}@test.com",
                found_objects_count=i * 100,
                created_at=now - timedelta(days=10 - i),
                updated_at=now,
            )
            for i in range(1, 11)
        ]
        session.add_all(queries)
        await session.commit()

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac