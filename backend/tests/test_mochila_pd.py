"""Mochila 0/1 por PD: tabela, reconstrução e passos conferidos com a seção 6 do roteiro."""

import pytest

from app.algoritmos.forca_bruta import forca_bruta
from app.algoritmos.mochila_pd import construir_tabela, mochila_pd, passos_reconstrucao, reconstruir
from tests.auxiliares import instancias_aleatorias, validar_solucao


@pytest.fixture
def instancia(requisicao_contraexemplo):
    atividades = requisicao_contraexemplo["atividades"]
    return (
        [a["duracao"] for a in atividades],
        [a["prioridade"] for a in atividades],
        requisicao_contraexemplo["tempo_disponivel"],
    )


def test_tabela_do_contraexemplo(instancia, resposta_tabela_contraexemplo):
    assert construir_tabela(*instancia) == resposta_tabela_contraexemplo["tabela"]


def test_tabela_tem_dimensoes_n_mais_1_por_t_mais_1(instancia):
    duracoes, prioridades, capacidade = instancia
    tabela = construir_tabela(duracoes, prioridades, capacidade)
    assert len(tabela) == len(duracoes) + 1
    assert all(len(linha) == capacidade + 1 for linha in tabela)


def test_passos_do_contraexemplo(instancia, resposta_tabela_contraexemplo):
    duracoes, prioridades, capacidade = instancia
    tabela = construir_tabela(duracoes, prioridades, capacidade)
    obtidos = [
        {"i": p.i, "t": p.t, "valor_sem": p.valor_sem, "valor_com": p.valor_com, "incluir": p.incluir}
        for p in passos_reconstrucao(tabela, duracoes, prioridades, capacidade)
    ]
    esperados = [
        {
            "i": p["i"],
            "t": p["t"],
            "valor_sem": p["valor_sem"],
            "valor_com": p["valor_com"],
            "incluir": p["decisao"] == "incluir",
        }
        for p in resposta_tabela_contraexemplo["passos"]
    ]
    assert obtidos == esperados


def test_passos_e_reconstrucao_concordam(instancia):
    duracoes, prioridades, capacidade = instancia
    tabela = construir_tabela(duracoes, prioridades, capacidade)
    passos = passos_reconstrucao(tabela, duracoes, prioridades, capacidade)
    incluidos = sorted(p.i - 1 for p in passos if p.incluir)
    assert incluidos == reconstruir(tabela, duracoes, capacidade)


def test_solucao_do_contraexemplo(instancia, requisicao_contraexemplo):
    duracoes, prioridades, capacidade = instancia
    ids = [a["id"] for a in requisicao_contraexemplo["atividades"]]
    solucao = mochila_pd(*instancia)
    assert solucao == mochila_pd(*instancia)  # determinismo
    validar_solucao(solucao.indices, duracoes, prioridades, capacidade, 10, ids)
    assert [ids[k] for k in solucao.indices] == ["a2", "a3"]
    assert solucao.prioridade_total == 10
    assert solucao.tempo_usado == 10


def test_contraexemplo_minimo_de_tres_atividades():
    solucao = mochila_pd([6, 5, 5], [7, 5, 5], 10)
    assert solucao == mochila_pd([6, 5, 5], [7, 5, 5], 10)  # determinismo
    validar_solucao(solucao.indices, [6, 5, 5], [7, 5, 5], 10, 10)
    assert (solucao.indices, solucao.prioridade_total, solucao.tempo_usado) == ([1, 2], 10, 10)


@pytest.mark.parametrize(
    ("duracoes", "prioridades", "capacidade", "indices", "total"),
    [
        pytest.param([], [], 10, [], 0, id="lista-vazia"),
        pytest.param([3, 1, 2], [5, 2, 9], 0, [], 0, id="capacidade-zero"),
        pytest.param([5, 6, 7], [3, 4, 5], 4, [], 0, id="todas-acima-da-capacidade"),
        pytest.param([5, 5], [5, 5], 10, [0, 1], 10, id="encaixe-exato"),
        pytest.param([4, 2, 2], [4, 2, 2], 4, [0], 4, id="empate-fica-a-primeira"),
        pytest.param([5, 5], [5, 5], 5, [0], 5, id="atividades-identicas"),
    ],
)
def test_casos_basicos(duracoes, prioridades, capacidade, indices, total):
    primeira = mochila_pd(duracoes, prioridades, capacidade)
    assert primeira == mochila_pd(duracoes, prioridades, capacidade)  # determinismo
    validar_solucao(primeira.indices, duracoes, prioridades, capacidade, total)
    assert primeira.indices == indices
    assert primeira.prioridade_total == total
    assert primeira.tempo_usado == sum(duracoes[k] for k in indices)


@pytest.mark.parametrize(
    ("ids", "esperado"),
    [pytest.param(["x", "y"], "x", id="x-antes"), pytest.param(["y", "x"], "y", id="y-antes")],
)
def test_atividades_identicas_com_ids_distintos_fica_a_primeira(ids, esperado):
    solucao = mochila_pd([5, 5], [5, 5], 5)
    assert solucao == mochila_pd([5, 5], [5, 5], 5)  # determinismo
    validar_solucao(solucao.indices, [5, 5], [5, 5], 5, 5, ids)
    assert [ids[k] for k in solucao.indices] == [esperado]


def test_lista_vazia_gera_so_a_linha_base():
    assert construir_tabela([], [], 3) == [[0, 0, 0, 0]]
    assert passos_reconstrucao([[0, 0, 0, 0]], [], [], 3) == []


def test_nao_reutiliza_atividade():
    # Na mochila ilimitada, 3 cópias da atividade de 3 min dariam 6 pontos.
    solucao = mochila_pd([3], [2], 9)
    validar_solucao(solucao.indices, [3], [2], 9, 2)
    assert (solucao.indices, solucao.prioridade_total) == ([0], 2)


def test_aleatorias_iguais_a_forca_bruta():
    """Caso 9: 500 instâncias com semente fixa; o valor da PD bate com o da força bruta."""
    for numero, (duracoes, prioridades, capacidade) in enumerate(instancias_aleatorias()):
        contexto = f"instância {numero}: d={duracoes} p={prioridades} T={capacidade}"
        otimo = forca_bruta(duracoes, prioridades, capacidade).prioridade_total
        tabela = construir_tabela(duracoes, prioridades, capacidade)
        solucao = mochila_pd(duracoes, prioridades, capacidade)
        assert tabela[len(duracoes)][capacidade] == otimo, contexto
        assert solucao.prioridade_total == otimo, contexto
        assert solucao.tempo_usado == sum(duracoes[k] for k in solucao.indices), contexto
        validar_solucao(solucao.indices, duracoes, prioridades, capacidade, otimo)
