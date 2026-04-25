from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from ..dependencies import get_esi_client
from ..esi import EsiClient, EsiError
from ..schemas import (
    EsiName,
    EsiResolvedNamesResponse,
    NamesRequest,
    ResolveNamesRequest,
    RouteFlag,
    RouteResponse,
)

router = APIRouter(prefix="/api/eve", tags=["eve"])


@router.post("/resolve-names", response_model=EsiResolvedNamesResponse)
async def resolve_names(
    payload: ResolveNamesRequest,
    esi: Annotated[EsiClient, Depends(get_esi_client)],
) -> EsiResolvedNamesResponse:
    names = [name.strip() for name in payload.names if name.strip()]
    if not names:
        raise HTTPException(status_code=422, detail="At least one non-empty name is required.")

    try:
        return EsiResolvedNamesResponse.model_validate(await esi.resolve_names(names))
    except EsiError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc


@router.post("/names", response_model=list[EsiName])
async def names(
    payload: NamesRequest,
    esi: Annotated[EsiClient, Depends(get_esi_client)],
) -> list[EsiName]:
    try:
        return [EsiName.model_validate(item) for item in await esi.names(payload.ids)]
    except EsiError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc


@router.get("/route", response_model=RouteResponse)
async def route(
    origin_id: Annotated[int, Query(alias="originId", gt=0)],
    destination_id: Annotated[int, Query(alias="destinationId", gt=0)],
    flag: RouteFlag = "shortest",
    esi: EsiClient = Depends(get_esi_client),
) -> RouteResponse:
    try:
        systems = await esi.route(origin_id, destination_id, flag)
    except EsiError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc

    return RouteResponse(
        origin_id=origin_id,
        destination_id=destination_id,
        flag=flag,
        systems=systems,
        jumps=max(len(systems) - 1, 0),
    )
