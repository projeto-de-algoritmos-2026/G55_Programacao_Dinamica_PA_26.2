"""Heurística gulosa por razão prioridade/duração: ordem, desempates e o contraexemplo."""

import pytest

from app.algoritmos.guloso import guloso
from app.algoritmos.mochila_pd import mochila_pd


@pytest.fixture
def contraexemplo(requisicao_contraexemplo):
    atividades = requisicao_contraexemplo["atividades"]
    ids = [a["id"] for a in atividades]
    duracoes = [a["duracao"] for a in atividades]
    prioridades = [a["prioridade"] for a in atividades]
    return ids, duracoes, prioridades, requisicao_contraexemplo["tempo_disponivel"]


def test_contraexemplo_igual_a_resposta_de_referencia(contraexemplo, resposta_resolver_contraexemplo):
    ids, duracoes, prioridades, capacidade = contraexemplo
    esperado = resposta_resolver_contraexemplo["guloso"]
    solucao = guloso(duracoes, prioridades, capacidade)

    assert [ids[k] for k in solucao.indices] == esperado["selecionadas"]  # a1 e a4
    assert [ids[k] for k in solucao.ordem_considerada] == esperado["ordem_considerada"]
    assert solucao.prioridade_total == esperado["prioridade_total"] == 8
    assert solucao.tempo_usado == esperado["tempo_usado"] == 8


def test_contraexemplo_perde_para_a_pd(contraexemplo):
    _, duracoes, prioridades, capacidade = contraexemplo
    assert guloso(duracoes, prioridades, capacidade).prioridade_total == 8
    assert mochila_pd(duracoes, prioridades, capacidade).prioridade_total == 10


def test_contraexemplo_minimo_de_tres_atividades():
    solucao = guloso([6, 5, 5], [7, 5, 5], 10)
    assert (solucao.indices, solucao.prioridade_total, solucao.tempo_usado) == ([0], 7, 6)
    assert mochila_pd([6, 5, 5], [7, 5, 5], 10).prioridade_total == 10


def test_pula_a_que_nao_cabe_e_continua():
    # Ordem por razão: 0 (10/2), 1 (9/8), 2 (1/3). A posição 1 não cabe depois da 0, mas a 2 cabe.
    solucao = guloso([2, 8, 3], [10, 9, 1], 6)
    assert solucao.ordem_considerada == [0, 1, 2]
    assert solucao.indices == [0, 2]
    assert (solucao.prioridade_total, solucao.tempo_usado) == (11, 5)


def test_razao_igual_desempata_pela_maior_prioridade():
    # (2, 2) e (4, 4) têm razão 1; a de prioridade 4 vem antes.
    assert guloso([2, 4], [2, 4], 10).ordem_considerada == [1, 0]


def test_atividades_identicas_ficam_na_ordem_da_lista():
    assert guloso([5, 5, 5], [5, 5, 5], 5).ordem_considerada == [0, 1, 2]
    assert guloso([5, 5, 5], [5, 5, 5], 5).indices == [0]


def test_razoes_proximas_por_multiplicacao_cruzada():
    # 1/3 = 0,333… > 33/100 = 0,33; também 2/7 = 0,2857… < 1/3.
    assert guloso([100, 3, 7], [33, 1, 2], 0).ordem_considerada == [1, 0, 2]


@pytest.mark.parametrize(
    ("duracoes", "prioridades", "capacidade"),
    [
        pytest.param([], [], 10, id="lista-vazia"),
        pytest.param([3, 1, 2], [5, 2, 9], 0, id="capacidade-zero"),
        pytest.param([5, 6, 7], [3, 4, 5], 4, id="todas-acima-da-capacidade"),
    ],
)
def test_nada_selecionado(duracoes, prioridades, capacidade):
    solucao = guloso(duracoes, prioridades, capacidade)
    assert (solucao.indices, solucao.prioridade_total, solucao.tempo_usado) == ([], 0, 0)
    assert sorted(solucao.ordem_considerada) == list(range(len(duracoes)))


def test_determinismo(contraexemplo):
    _, duracoes, prioridades, capacidade = contraexemplo
    assert guloso(duracoes, prioridades, capacidade) == guloso(duracoes, prioridades, capacidade)
