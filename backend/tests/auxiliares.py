"""Funções compartilhadas pelos testes de algoritmos (seção 12 do roteiro)."""

import random
from collections.abc import Iterator

SEMENTE = 2026
QUANTIDADE_ALEATORIAS = 500

Instancia = tuple[list[int], list[int], int]


def validar_solucao(
    indices: list[int],
    duracoes: list[int],
    prioridades: list[int],
    capacidade: int,
    valor: int,
    ids: list[str] | None = None,
) -> None:
    """Confere que `indices` é uma seleção viável cuja soma de prioridades é `valor`.

    - todos os índices existem na entrada;
    - não há índices (nem ids) repetidos;
    - a soma das durações escolhidas é <= capacidade;
    - a soma das prioridades escolhidas é igual a `valor` (o OPT[n][T] esperado).
    """
    n = len(duracoes)
    assert all(0 <= k < n for k in indices), f"índice fora da entrada: {indices} (n = {n})"
    assert len(set(indices)) == len(indices), f"índice repetido: {indices}"
    if ids is not None:
        escolhidos = [ids[k] for k in indices]
        assert len(set(escolhidos)) == len(escolhidos), f"id repetido: {escolhidos}"
    tempo = sum(duracoes[k] for k in indices)
    assert tempo <= capacidade, f"passou do tempo: {tempo} > {capacidade}"
    total = sum(prioridades[k] for k in indices)
    assert total == valor, f"prioridade da seleção ({total}) diferente do esperado ({valor})"


def instancias_aleatorias() -> Iterator[Instancia]:
    """As 500 instâncias do caso 9, sempre as mesmas: n de 0 a 12, d e p de 1 a 10, T de 0 a 30."""
    gerador = random.Random(SEMENTE)
    for _ in range(QUANTIDADE_ALEATORIAS):
        n = gerador.randint(0, 12)
        duracoes = [gerador.randint(1, 10) for _ in range(n)]
        prioridades = [gerador.randint(1, 10) for _ in range(n)]
        yield duracoes, prioridades, gerador.randint(0, 30)
