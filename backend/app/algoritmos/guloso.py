"""Heurística gulosa por razão prioridade/duração, sem garantia de otimalidade.

1. Ordena pela razão p/d decrescente, comparando por multiplicação cruzada
   (p[i]·d[j] contra p[j]·d[i]), sem ponto flutuante.
2. Desempates, em ordem: maior prioridade, menor duração, posição na lista.
3. Percorre a ordem e inclui cada atividade que ainda couber. A que não cabe é
   pulada, e a varredura continua.
"""

from app.algoritmos.tipos import SolucaoGulosa


def guloso(duracoes: list[int], prioridades: list[int], capacidade: int) -> SolucaoGulosa:
    """Devolve a seleção gulosa e a ordem em que as atividades foram examinadas. O(n log n)."""
    raise NotImplementedError
