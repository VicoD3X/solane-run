from __future__ import annotations

import json
import urllib.request
import zipfile
from pathlib import Path


SDE_JSONL_URL = "https://developers.eveonline.com/static-data/eve-online-static-data-latest-jsonl.zip"
ROOT = Path(__file__).resolve().parents[3]
DOWNLOAD_PATH = ROOT / "dev.logs" / "sde-jsonl.zip"
OUT_PATH = ROOT / "apps" / "api" / "app" / "data" / "system_catalog_seed.json"

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


def main() -> None:
    DOWNLOAD_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    if not DOWNLOAD_PATH.exists():
        urllib.request.urlretrieve(SDE_JSONL_URL, DOWNLOAD_PATH)

    regions: dict[int, str] = {}
    systems: list[dict[str, object]] = []

    with zipfile.ZipFile(DOWNLOAD_PATH) as archive:
        for line in archive.open("mapRegions.jsonl"):
            row = json.loads(line)
            regions[row["_key"]] = row["name"]["en"]

        for line in archive.open("mapSolarSystems.jsonl"):
            row = json.loads(line)
            system_id = row["_key"]
            region_id = row.get("regionID")
            security_status = float(row.get("securityStatus", -1.0))
            security_display = round(security_status, 1)
            service_type = classify_system(system_id, region_id, security_display)

            if service_type is None:
                continue

            systems.append(
                {
                    "id": system_id,
                    "name": row["name"]["en"],
                    "securityStatus": security_status,
                    "securityDisplay": f"{security_display:.1f}",
                    "regionId": region_id,
                    "regionName": regions.get(region_id, "Unknown"),
                    "constellationId": row.get("constellationID"),
                    "serviceType": service_type,
                    "color": SERVICE_COLORS[service_type],
                }
            )

    systems.sort(key=lambda item: (str(item["name"]).lower(), int(item["id"])))
    OUT_PATH.write_text(json.dumps(systems, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(systems)} systems to {OUT_PATH}")


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


if __name__ == "__main__":
    main()
