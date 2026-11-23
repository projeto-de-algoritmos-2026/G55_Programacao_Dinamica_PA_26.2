"""Força bruta sobre todos os 2^n subconjuntos. Usada só para validar a PD nos testes."""

from app.algoritmos.tipos import Solucao
from app.limites import N_FORCA_BRUTA


class InstanciaGrandeDemais(ValueError):
    """A instância tem mais atividades do que a força bruta aceita."""


def forca_bruta(duracoes: list[int], prioridades: list[int], capacidade: int) -> Solucao:
    """Devolve uma seleção de prioridade máxima. O(2^n · n).

    Levanta InstanciaGrandeDemais se houver mais de N_FORCA_BRUTA atividades.
    """
    raise NotImplementedError(f"Fase 3 (limite: {N_FORCA_BRUTA} atividades)")
