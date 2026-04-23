# Генерация случайных записей

import asyncio
import random
from faker import Faker
from sqlalchemy import text
from app.database import async_session, engine
from app.models import Base, SearchQuery

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM search_queries"))
        count = result.scalar()
        if count >= 10000:
            print(f"DB already has {count} records, skipping seed.")
            return

        fake = Faker()
        batch_size = 1000
        total = 10000

        for i in range(0, total, batch_size):
            items = []
            for j in range(batch_size):
                created = fake.date_time_between(start_date="-2y", end_date="now")
                deadline = fake.date_time_between(start_date="-1y", end_date="+30d")
                items.append(
                    SearchQuery(
                        name=fake.sentence(nb_words=random.randint(2, 6))[:-1],
                        created_at=created,
                        updated_at=fake.date_time_between(start_date=created, end_date="now"),
                        is_active=random.choice([True, False]),
                        owner=fake.email(),
                        deadline=deadline,
                        found_objects_count=random.randint(0, 100000),
                    )
                )
            session.add_all(items)
            await session.commit()
            print(f"Seeded {min(i + batch_size, total)}/{total}")

    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed())