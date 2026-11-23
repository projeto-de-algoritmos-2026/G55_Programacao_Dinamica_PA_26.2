"""Tipos de retorno compartilhados pelos algoritmos.

Convenção de índices: `indices` e `ordem_considerada` são posições na lista de
entrada, começando em 0. Já `Passo.i` é a linha da tabela de PD, começando em 1
(a linha 0 é o caso base "nenhuma atividade"), e corresponde à atividade na
posição `i - 1`.
"""

from dataclasses import dataclass

Tabela = list[list[int]]


@dataclass(frozen=True)
class Solucao:
    indices: list[int]  # posições escolhidas, em ordem crescente
    prioridade_total: int
    tempo_usado: int


@dataclass(frozen=True)
class SolucaoGulosa(Solucao):
    ordem_considerada: list[int]  # todas as posições, na ordem em que o guloso as examinou


@dataclass(frozen=True)
class Passo:
    """Um passo da reconstrução, da linha n até a linha 1."""

    i: int  # linha da tabela (1..n)
    t: int  # minutos disponíveis neste passo
    valor_sem: int  # OPT[i-1][t]
    valor_com: int | None  # p[i] + OPT[i-1][t - d[i]], ou None se a atividade não cabe em t
    incluir: bool
