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
    n = len(duracoes)
    tabela: Tabela = [[0] * (capacidade + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        d, p = duracoes[i - 1], prioridades[i - 1]
        anterior, atual = tabela[i - 1], tabela[i]
        for t in range(capacidade + 1):
            melhor = anterior[t]
            # O ramo "incluir" lê a linha i-1: cada atividade entra no máximo uma vez.
            if d <= t and p + anterior[t - d] > melhor:
                melhor = p + anterior[t - d]
            atual[t] = melhor
    return tabela


def reconstruir(tabela: Tabela, duracoes: list[int], capacidade: int) -> list[int]:
    """Devolve as posições escolhidas (base 0), em ordem crescente. O(n)."""
    escolhidas: list[int] = []
    t = capacidade
    for i in range(len(duracoes), 0, -1):
        if _inclui(tabela, i, t):
            escolhidas.append(i - 1)
            t -= duracoes[i - 1]
    escolhidas.reverse()
    return escolhidas


def passos_reconstrucao(
    tabela: Tabela, duracoes: list[int], prioridades: list[int], capacidade: int
) -> list[Passo]:
    """Devolve os passos da reconstrução, de i = n até i = 1, para a tela didática."""
    passos: list[Passo] = []
    t = capacidade
    for i in range(len(duracoes), 0, -1):
        d, p = duracoes[i - 1], prioridades[i - 1]
        incluir = _inclui(tabela, i, t)
        passos.append(
            Passo(
                i=i,
                t=t,
                valor_sem=tabela[i - 1][t],
                valor_com=None if d > t else p + tabela[i - 1][t - d],
                incluir=incluir,
            )
        )
        if incluir:
            t -= d
    return passos


def mochila_pd(duracoes: list[int], prioridades: list[int], capacidade: int) -> Solucao:
    """Constrói a tabela, reconstrói a seleção e devolve a solução ótima."""
    tabela = construir_tabela(duracoes, prioridades, capacidade)
    indices = reconstruir(tabela, duracoes, capacidade)
    return Solucao(
        indices=indices,
        prioridade_total=tabela[len(duracoes)][capacidade],
        tempo_usado=sum(duracoes[k] for k in indices),
    )


def _inclui(tabela: Tabela, i: int, t: int) -> bool:
    """Regra de empate: a atividade i só entra se o valor não vier da linha de cima."""
    return tabela[i][t] != tabela[i - 1][t]
