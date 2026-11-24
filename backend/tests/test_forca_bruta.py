"""Força bruta: referência de valor ótimo para validar a PD em instâncias pequenas."""

import pytest

from app.algoritmos.forca_bruta import InstanciaGrandeDemais, forca_bruta
from app.algoritmos.mochila_pd import mochila_pd
from app.limites import N_FORCA_BRUTA

CASOS = [
    pytest.param([], [], 10, 0, id="lista-vazia"),
    pytest.param([3, 1, 2], [5, 2, 9], 0, 0, id="capacidade-zero"),
    pytest.param([5, 6, 7], [3, 4, 5], 4, 0, id="todas-acima-da-capacidade"),
    pytest.param([6, 5, 5, 2], [7, 5, 5, 1], 10, 10, id="contraexemplo"),
    pytest.param([6, 5, 5], [7, 5, 5], 10, 10, id="contraexemplo-minimo"),
    pytest.param([4, 2, 2], [4, 2, 2], 4, 4, id="empate"),
    pytest.param([3], [2], 9, 2, id="sem-reutilizar"),
]


@pytest.mark.parametrize(("duracoes", "prioridades", "capacidade", "valor"), CASOS)
def test_valor_otimo_igual_ao_da_pd(duracoes, prioridades, capacidade, valor):
    solucao = forca_bruta(duracoes, prioridades, capacidade)
    assert solucao.prioridade_total == valor == mochila_pd(duracoes, prioridades, capacidade).prioridade_total
    assert solucao.indices == sorted(set(solucao.indices))
    assert solucao.tempo_usado == sum(duracoes[k] for k in solucao.indices) <= capacidade
    assert solucao.prioridade_total == sum(prioridades[k] for k in solucao.indices)


def test_contraexemplo_seleciona_a2_e_a3():
    assert forca_bruta([6, 5, 5, 2], [7, 5, 5, 1], 10).indices == [1, 2]


def test_aceita_o_limite():
    n = N_FORCA_BRUTA
    solucao = forca_bruta([1] * n, [1] * n, n)
    assert solucao.prioridade_total == n
    assert solucao.indices == list(range(n))


def test_recusa_acima_do_limite():
    n = N_FORCA_BRUTA + 1
    with pytest.raises(InstanciaGrandeDemais, match="no máximo 15 atividades"):
        forca_bruta([1] * n, [1] * n, n)


def test_erro_e_value_error():
    assert issubclass(InstanciaGrandeDemais, ValueError)
