"""Aplicação FastAPI do EstudaPlan."""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.erros import traduzir_erro
from app.rotas import router

app = FastAPI(
    title="EstudaPlan API",
    description="Seleção ótima de atividades de estudo por Mochila 0/1 com programação dinâmica.",
    version="0.1.0",
)


@app.exception_handler(RequestValidationError)
async def erro_de_validacao(_: Request, erro: RequestValidationError) -> JSONResponse:
    """422 no formato padrão do FastAPI (`detail` como lista), com mensagens em português.

    Só `loc`, `msg` e `type` são devolvidos; o valor recebido (`input`) não é ecoado.
    """
    detalhes = [{"loc": list(e["loc"]), "msg": traduzir_erro(e), "type": e["type"]} for e in erro.errors()]
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content={"detail": detalhes})


app.include_router(router)
