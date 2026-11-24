"""Heurística gulosa por razão prioridade/duração, sem garantia de otimalidade.

1. Ordena pela razão p/d decrescente, comparando por multiplicação cruzada
   (p[i]·d[j] contra p[j]·d[i]), sem ponto flutuante.
2. Desempates, em ordem: maior prioridade, menor duração, posição na lista.
   (Com razão e prioridade iguais a duração também é igual, então na prática
   quem desempata é a posição; o critério da duração fica por fidelidade ao
   contrato.)
3. Percorre a ordem e inclui cada atividade que ainda couber. A que não cabe é
   pulada, e a varredura continua.
"""

from functools import cmp_to_key

from app.algoritmos.tipos import SolucaoGulosa


def guloso(duracoes: list[int], prioridades: list[int], capacidade: int) -> SolucaoGulosa:
    """Devolve a seleção gulosa e a ordem em que as atividades foram examinadas. O(n log n)."""

    def comparar(a: int, b: int) -> int:
        """Negativo se a vem antes de b."""
        razao = prioridades[b] * duracoes[a] - prioridades[a] * duracoes[b]
        if razao != 0:
            return razao  # p[a]/d[a] > p[b]/d[b]  ⇔  p[a]·d[b] > p[b]·d[a]
        if prioridades[a] != prioridades[b]:
            return prioridades[b] - prioridades[a]
        if duracoes[a] != duracoes[b]:
            return duracoes[a] - duracoes[b]
        return a - b

    ordem = sorted(range(len(duracoes)), key=cmp_to_key(comparar))

    escolhidas: list[int] = []
    restante = capacidade
    for k in ordem:
        if duracoes[k] <= restante:  # não cabe: pula e continua a varredura
            escolhidas.append(k)
            restante -= duracoes[k]

    escolhidas.sort()
    return SolucaoGulosa(
        indices=escolhidas,
        prioridade_total=sum(prioridades[k] for k in escolhidas),
        tempo_usado=capacidade - restante,
        ordem_considerada=ordem,
    )
