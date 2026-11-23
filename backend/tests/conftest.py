import json
from pathlib import Path
from typing import Any

import pytest

PASTA_DADOS = Path(__file__).parent / "dados"


def ler_json(nome: str) -> Any:
    return json.loads((PASTA_DADOS / nome).read_text(encoding="utf-8"))


@pytest.fixture
def requisicao_contraexemplo() -> dict[str, Any]:
    """Instância de 4 atividades com T = 10 em que o guloso (8) perde para a PD (10)."""
    return ler_json("requisicao_contraexemplo.json")


@pytest.fixture
def resposta_resolver_contraexemplo() -> dict[str, Any]:
    return ler_json("resposta_resolver_contraexemplo.json")


@pytest.fixture
def resposta_tabela_contraexemplo() -> dict[str, Any]:
    return ler_json("resposta_tabela_contraexemplo.json")
