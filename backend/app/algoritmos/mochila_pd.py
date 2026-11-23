"""Mochila 0/1 por programação dinâmica com tabela 2D.

OPT[i][t] = maior soma de prioridades usando só as atividades 1..i em até t minutos.

    OPT[0][t] = 0
    OPT[i][t] = OPT[i-1][t]                                  se d[i] > t
    OPT[i][t] = max(OPT[i-1][t], p[i] + OPT[i-1][t - d[i]])  se d[i] <= t

Regra de empate, aplicada na reconstrução: se OPT[i][t] == OPT[i-1][t], a
atividade i é descartada. Com mais de uma solução ótima, ficam as que aparecem
antes na lista.
"""

from app.algoritmos.tipos import Passo, Solucao, Tabela


def construir_tabela(duracoes: list[int], prioridades: list[int], capacidade: int) -> Tabela:
    """Preenche a tabela (n+1) × (capacidade+1), linha por linha. Θ(n·T)."""
    raise NotImplementedError


def reconstruir(tabela: Tabela, duracoes: list[int], capacidade: int) -> list[int]:
    """Devolve as posições escolhidas (base 0), em ordem crescente. O(n)."""
    raise NotImplementedError


def passos_reconstrucao(
    tabela: Tabela, duracoes: list[int], prioridades: list[int], capacidade: int
) -> list[Passo]:
    """Devolve os passos da reconstrução, de i = n até i = 1, para a tela didática."""
    raise NotImplementedError


def mochila_pd(duracoes: list[int], prioridades: list[int], capacidade: int) -> Solucao:
    """Constrói a tabela, reconstrói a seleção e devolve a solução ótima."""
    raise NotImplementedError
