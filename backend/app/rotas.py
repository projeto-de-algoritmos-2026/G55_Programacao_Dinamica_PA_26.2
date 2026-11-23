"""Rotas da API: só recebem, validam e respondem."""

from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/saude", tags=["infra"])
def saude() -> dict[str, str]:
    """Verificação de disponibilidade."""
    return {"status": "ok"}
