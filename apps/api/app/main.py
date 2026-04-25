import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import eve
from .schemas import HealthResponse
from .system_catalog import refresh_catalog_periodically


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    catalog_refresh_task: asyncio.Task[None] | None = None
    if settings.system_catalog_refresh_enabled:
        catalog_refresh_task = asyncio.create_task(refresh_catalog_periodically())

    try:
        yield
    finally:
        if catalog_refresh_task:
            catalog_refresh_task.cancel()
            try:
                await catalog_refresh_task
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="Solane Run API",
    version="0.1.0",
    description="Public ESI integration layer for the Solane Run freight calculator.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(eve.router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="solane-run-api")
