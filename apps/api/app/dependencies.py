from collections.abc import AsyncIterator

from .esi import EsiClient
from .system_catalog import SystemCatalog, system_catalog


async def get_esi_client() -> AsyncIterator[EsiClient]:
    async with EsiClient() as client:
        yield client


def get_system_catalog() -> SystemCatalog:
    return system_catalog
