from collections.abc import AsyncIterator

from .esi import EsiClient


async def get_esi_client() -> AsyncIterator[EsiClient]:
    async with EsiClient() as client:
        yield client
