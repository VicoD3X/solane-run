from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from .config import settings
from .esi import EsiClient


POCHVEN_REGION_ID = 10000070
THERA_SYSTEM_ID = 31000005
ZARZAKH_SYSTEM_ID = 30100000

SERVICE_COLORS = {
    "Pochven": "#6E1A37",
    "Thera": "#56B6C6",
    "HighSec": "#6FCF97",
    "LowSec": "#F45B26",
    "Zarzakh": "#839705",
}

SEED_PATH = Path(__file__).resolve().parent / "data" / "system_catalog_seed.json"
CACHE_PATH = Path(settings.system_catalog_cache_path)


class SystemCatalog:
    def __init__(self, systems: list[dict[str, Any]]) -> None:
        self._lock = asyncio.Lock()
        self._systems = _sorted_systems(systems)
        self._by_id = {int(system["id"]): system for system in self._systems}

    @classmethod
    def load(cls) -> "SystemCatalog":
        source = CACHE_PATH if CACHE_PATH.exists() else SEED_PATH
        return cls(_read_systems(source))

    def search(self, query: str, limit: int) -> list[dict[str, Any]]:
        normalized = query.strip().lower()
        if not normalized:
            return []

        starts_with: list[dict[str, Any]] = []
        contains: list[dict[str, Any]] = []

        for system in self._systems:
            name = str(system["name"]).lower()
            if name.startswith(normalized):
                starts_with.append(system)
            elif normalized in name:
                contains.append(system)

            if len(starts_with) >= limit:
                break

        results = starts_with + contains
        return results[:limit]

    def get(self, system_id: int) -> dict[str, Any] | None:
        return self._by_id.get(system_id)

    async def refresh_from_esi(self, esi: EsiClient) -> bool:
        try:
            system_ids = await esi.systems()
            details = await _fetch_system_details(esi, system_ids)
            constellations = await _fetch_constellations(esi, details)
            regions = await _fetch_regions(esi, constellations)
            refreshed = [
                entry
                for detail in details
                if (entry := _entry_from_esi(detail, constellations, regions)) is not None
            ]
        except Exception:
            return False

        if not refreshed:
            return False

        refreshed = _sorted_systems(refreshed)
        await self.replace(refreshed)
        _write_systems(CACHE_PATH, refreshed)
        return True

    async def replace(self, systems: list[dict[str, Any]]) -> None:
        async with self._lock:
            self._systems = systems
            self._by_id = {int(system["id"]): system for system in systems}


async def refresh_catalog_periodically() -> None:
    if not settings.system_catalog_refresh_enabled:
        return

    while True:
        await asyncio.sleep(settings.system_catalog_refresh_seconds)
        async with EsiClient() as esi:
            await system_catalog.refresh_from_esi(esi)


def choose_route_flag(origin_id: int, destination_id: int) -> str:
    origin = system_catalog.get(origin_id)
    destination = system_catalog.get(destination_id)

    if origin and destination:
        origin_service = origin["serviceType"]
        destination_service = destination["serviceType"]
        if origin_service == destination_service and origin_service in {"LowSec", "Pochven"}:
            return "shortest"

    return "secure"


def classify_system(system_id: int, region_id: int | None, security_display: float) -> str | None:
    if system_id == ZARZAKH_SYSTEM_ID:
        return "Zarzakh"
    if system_id == THERA_SYSTEM_ID:
        return "Thera"
    if region_id == POCHVEN_REGION_ID:
        return "Pochven"
    if security_display >= 0.5:
        return "HighSec"
    if security_display >= 0.1:
        return "LowSec"
    return None


async def _fetch_system_details(esi: EsiClient, system_ids: list[int]) -> list[dict[str, Any]]:
    semaphore = asyncio.Semaphore(24)

    async def fetch(system_id: int) -> dict[str, Any] | None:
        async with semaphore:
            try:
                return await esi.system(system_id)
            except Exception:
                return None

    results = await asyncio.gather(*(fetch(system_id) for system_id in system_ids))
    return [result for result in results if result is not None]


async def _fetch_constellations(
    esi: EsiClient,
    systems: list[dict[str, Any]],
) -> dict[int, dict[str, Any]]:
    constellation_ids = {
        int(system["constellation_id"])
        for system in systems
        if "constellation_id" in system
    }
    constellations: dict[int, dict[str, Any]] = {}
    semaphore = asyncio.Semaphore(24)

    async def fetch(constellation_id: int) -> None:
        async with semaphore:
            try:
                constellations[constellation_id] = await esi.constellation(constellation_id)
            except Exception:
                return

    await asyncio.gather(*(fetch(constellation_id) for constellation_id in constellation_ids))
    return constellations


async def _fetch_regions(
    esi: EsiClient,
    constellations: dict[int, dict[str, Any]],
) -> dict[int, dict[str, Any]]:
    region_ids = {
        int(constellation["region_id"])
        for constellation in constellations.values()
        if "region_id" in constellation
    }
    regions: dict[int, dict[str, Any]] = {}
    semaphore = asyncio.Semaphore(12)

    async def fetch(region_id: int) -> None:
        async with semaphore:
            try:
                regions[region_id] = await esi.region(region_id)
            except Exception:
                return

    await asyncio.gather(*(fetch(region_id) for region_id in region_ids))
    return regions


def _entry_from_esi(
    system: dict[str, Any],
    constellations: dict[int, dict[str, Any]],
    regions: dict[int, dict[str, Any]],
) -> dict[str, Any] | None:
    system_id = int(system["system_id"])
    constellation_id = int(system["constellation_id"])
    constellation = constellations.get(constellation_id)
    if not constellation:
        return None

    region_id = int(constellation["region_id"])
    region = regions.get(region_id)
    if not region:
        return None

    security_status = float(system.get("security_status", -1.0))
    security_display = round(security_status, 1)
    service_type = classify_system(system_id, region_id, security_display)
    if service_type is None:
        return None

    return {
        "id": system_id,
        "name": system["name"],
        "securityStatus": security_status,
        "securityDisplay": f"{security_display:.1f}",
        "regionId": region_id,
        "regionName": region["name"],
        "constellationId": constellation_id,
        "serviceType": service_type,
        "color": SERVICE_COLORS[service_type],
    }


def _read_systems(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_systems(path: Path, systems: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(systems, indent=2) + "\n", encoding="utf-8")


def _sorted_systems(systems: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(systems, key=lambda system: (str(system["name"]).lower(), int(system["id"])))


system_catalog = SystemCatalog.load()
