from datetime import datetime
from pydantic import BaseModel, Field

class SearchQueryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    is_active: bool = True
    deadline: datetime

class SearchQueryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    is_active: bool | None = None
    deadline: datetime | None = None

class SearchQueryOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    owner: str
    deadline: datetime
    found_objects_count: int
    is_expired: bool
    model_config = {"from_attributes": True}

class PaginatedResponse(BaseModel):
    items: list[SearchQueryOut]
    total: int
    page: int
    page_size: int