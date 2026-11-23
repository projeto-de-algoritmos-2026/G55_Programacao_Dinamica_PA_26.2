"""Limites de entrada e de execução, definidos num único lugar.

São valores iniciais, a ajustar depois de medir o tempo real da PD.
"""

# Cálculo normal (POST /api/resolver): tabela de até (N_MAX + 1) × (T_MAX + 1) células.
N_MAX = 100
T_MAX = 3000

# Faixas de cada atividade.
DURACAO_MIN = 1
DURACAO_MAX = 3000
PRIORIDADE_MIN = 1
PRIORIDADE_MAX = 10
NOME_MAX = 80
DISCIPLINA_MAX = 40

# Tabela didática (POST /api/tabela): até 9 × 31 = 279 células.
N_TABELA = 8
T_TABELA = 30

# Força bruta, usada só nos testes: até 2^15 = 32.768 subconjuntos.
N_FORCA_BRUTA = 15
