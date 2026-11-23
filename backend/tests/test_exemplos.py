"""Os exemplos locais validam contra o schema e têm o formato combinado."""

from pathlib import Path

import pytest
from pydantic import TypeAdapter

from app.limites import N_TABELA, T_TABELA
from app.modelos import Exemplo

ARQUIVO = Path(__file__).resolve().parents[1] / "app" / "dados" / "exemplos.json"


@pytest.fixture(scope="module")
def exemplos() -> dict[str, Exemplo]:
    lista = TypeAdapter(list[Exemplo]).validate_json(ARQUIVO.read_text(encoding="utf-8"))
    return {e.id: e for e in lista}


def test_ids_dos_exemplos(exemplos):
    assert list(exemplos) == ["contraexemplo-guloso", "empate", "tarde-de-estudos"]


def test_contraexemplo_igual_a_requisicao_de_referencia(exemplos, requisicao_contraexemplo):
    exemplo = exemplos["contraexemplo-guloso"]
    dados = exemplo.model_dump(include={"tempo_disponivel", "atividades"})
    assert dados == requisicao_contraexemplo


def test_empate_tem_duas_atividades_identicas_e_tempo_para_uma(exemplos):
    exemplo = exemplos["empate"]
    a, b = exemplo.atividades
    assert (a.duracao, a.prioridade) == (b.duracao, b.prioridade) == (5, 5)
    assert exemplo.tempo_disponivel == 5


def test_tarde_de_estudos(exemplos):
    exemplo = exemplos["tarde-de-estudos"]
    assert exemplo.tempo_disponivel == 180
    assert len(exemplo.atividades) == 8
    assert all(15 <= a.duracao <= 60 for a in exemplo.atividades)
    assert sum(a.duracao for a in exemplo.atividades) > exemplo.tempo_disponivel


@pytest.mark.parametrize(
    ("exemplo_id", "cabe_na_tabela"),
    [("contraexemplo-guloso", True), ("empate", True), ("tarde-de-estudos", False)],
)
def test_limites_da_tabela_didatica(exemplos, exemplo_id, cabe_na_tabela):
    exemplo = exemplos[exemplo_id]
    cabe = len(exemplo.atividades) <= N_TABELA and exemplo.tempo_disponivel <= T_TABELA
    assert cabe == cabe_na_tabela
