"""Rotas da API: só recebem, validam e respondem."""

from fastapi import APIRouter, HTTPException, status

from app import servicos
from app.modelos import Exemplo, RequisicaoPlano, RespostaResolver, RespostaTabela

router = APIRouter(prefix="/api")


@router.get("/saude", tags=["infra"])
def saude() -> dict[str, str]:
    """Verificação de disponibilidade."""
    return {"status": "ok"}


@router.get("/exemplos", tags=["exemplos"])
def exemplos() -> list[Exemplo]:
    """Instâncias prontas para carregar na interface."""
    return servicos.listar_exemplos()


@router.post("/resolver", tags=["calculo"])
def resolver(requisicao: RequisicaoPlano) -> RespostaResolver:
    """Seleção ótima pela PD, seleção gulosa e comparação entre as duas."""
    return servicos.resolver(requisicao)


@router.post(
    "/tabela",
    tags=["calculo"],
    responses={422: {"description": "Entrada inválida ou acima dos limites da tabela didática."}},
)
def tabela(requisicao: RequisicaoPlano) -> RespostaTabela:
    """Tabela OPT[i][t] e passos da reconstrução, só para instâncias pequenas."""
    try:
        return servicos.montar_tabela(requisicao)
    except servicos.TabelaGrandeDemais as erro:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(erro)) from erro
