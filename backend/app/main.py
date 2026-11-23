"""Aplicação FastAPI do EstudaPlan."""

from fastapi import FastAPI

from app.rotas import router

app = FastAPI(
    title="EstudaPlan API",
    description="Seleção ótima de atividades de estudo por Mochila 0/1 com programação dinâmica.",
    version="0.1.0",
)

app.include_router(router)
