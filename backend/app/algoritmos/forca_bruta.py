"""Força bruta sobre todos os 2^n subconjuntos. Usada só para validar a PD nos testes."""

from app.algoritmos.tipos import Solucao
from app.limites import N_FORCA_BRUTA


class InstanciaGrandeDemais(ValueError):
    """A instância tem mais atividades do que a força bruta aceita."""


def forca_bruta(duracoes: list[int], prioridades: list[int], capacidade: int) -> Solucao:
    """Devolve uma seleção de prioridade máxima. O(2^n · n).

    Levanta InstanciaGrandeDemais se houver mais de N_FORCA_BRUTA atividades.

    Percorre as máscaras de 0 a 2^n - 1 e só troca a melhor quando a soma é
    estritamente maior, então o resultado é determinístico. Com mais de uma
    solução ótima, o conjunto pode diferir do da PD; só o valor deve coincidir.
    """
    n = len(duracoes)
    if n > N_FORCA_BRUTA:
        raise InstanciaGrandeDemais(f"A força bruta aceita no máximo {N_FORCA_BRUTA} atividades.")

    melhor_mascara, melhor_valor, melhor_tempo = 0, 0, 0
    for mascara in range(1 << n):
        tempo = valor = 0
        for k in range(n):
            if mascara >> k & 1:
                tempo += duracoes[k]
                valor += prioridades[k]
        if tempo <= capacidade and valor > melhor_valor:
            melhor_mascara, melhor_valor, melhor_tempo = mascara, valor, tempo

    return Solucao(
        indices=[k for k in range(n) if melhor_mascara >> k & 1],
        prioridade_total=melhor_valor,
        tempo_usado=melhor_tempo,
    )
