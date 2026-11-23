"""Regras de arquitetura: os algoritmos são funções puras, sem API nem bibliotecas de otimização."""

import ast
import inspect
from pathlib import Path

import pytest

from app.algoritmos import forca_bruta, guloso, mochila_pd

PASTA_ALGORITMOS = Path(__file__).resolve().parents[1] / "app" / "algoritmos"
PROIBIDOS = {"fastapi", "pydantic", "pydantic_core", "starlette", "numpy", "scipy", "ortools", "pulp"}


def _modulos_importados(arquivo: Path) -> set[str]:
    arvore = ast.parse(arquivo.read_text(encoding="utf-8"))
    modulos = set()
    for no in ast.walk(arvore):
        if isinstance(no, ast.Import):
            modulos.update(alias.name.split(".")[0] for alias in no.names)
        elif isinstance(no, ast.ImportFrom) and no.module:
            modulos.add(no.module.split(".")[0])
    return modulos


@pytest.mark.parametrize("arquivo", sorted(PASTA_ALGORITMOS.glob("*.py")), ids=lambda p: p.name)
def test_algoritmos_nao_importam_api_nem_otimizadores(arquivo: Path):
    assert _modulos_importados(arquivo).isdisjoint(PROIBIDOS)


@pytest.mark.parametrize(
    "funcao", [mochila_pd.construir_tabela, mochila_pd.mochila_pd, guloso.guloso, forca_bruta.forca_bruta]
)
def test_assinatura_comum(funcao):
    assert list(inspect.signature(funcao).parameters) == ["duracoes", "prioridades", "capacidade"]
