"""Ponte entre a API e os algoritmos.

Converte as atividades em listas de inteiros, chama os algoritmos (que devolvem
posições na lista) e traduz essas posições de volta para `id`s. Todas as listas
de `id`s saem na ordem original da entrada, exceto `ordem_considerada`, que
segue a ordem em que o guloso examinou as atividades.
"""

from functools import cache
from pathlib import Path

from pydantic import TypeAdapter

from app.algoritmos.guloso import guloso
from app.algoritmos.mochila_pd import construir_tabela, mochila_pd, passos_reconstrucao, reconstruir
from app.limites import N_TABELA, T_TABELA
from app.modelos import (
    Comparacao,
    Exemplo,
    PassoReconstrucao,
    RequisicaoPlano,
    RespostaResolver,
    RespostaTabela,
    ResultadoGuloso,
    ResultadoSelecao,
)

ARQUIVO_EXEMPLOS = Path(__file__).parent / "dados" / "exemplos.json"

MENSAGEM_TABELA_GRANDE = (
    f"A tabela didática aceita no máximo {N_TABELA} atividades e {T_TABELA} minutos."
)


class TabelaGrandeDemais(ValueError):
    """A instância passa dos limites da tabela didática."""


@cache
def listar_exemplos() -> list[Exemplo]:
    """Lê e valida `exemplos.json` uma única vez."""
    return TypeAdapter(list[Exemplo]).validate_json(ARQUIVO_EXEMPLOS.read_text(encoding="utf-8"))


def cabe_na_tabela(requisicao: RequisicaoPlano) -> bool:
    return len(requisicao.atividades) <= N_TABELA and requisicao.tempo_disponivel <= T_TABELA


def resolver(requisicao: RequisicaoPlano) -> RespostaResolver:
    """Resolve pela PD e pelo guloso e compara os dois."""
    ids, duracoes, prioridades, capacidade = _listas(requisicao)

    pd = mochila_pd(duracoes, prioridades, capacidade)
    gulosa = guloso(duracoes, prioridades, capacidade)

    return RespostaResolver(
        tempo_disponivel=capacidade,
        pd=ResultadoSelecao(
            estrategia="programacao_dinamica",
            otimo_garantido=True,
            **_selecao(ids, pd.indices, pd.prioridade_total, pd.tempo_usado, capacidade),
        ),
        guloso=ResultadoGuloso(
            **_selecao(ids, gulosa.indices, gulosa.prioridade_total, gulosa.tempo_usado, capacidade),
            ordem_considerada=[ids[k] for k in gulosa.ordem_considerada],
        ),
        comparacao=Comparacao(
            diferenca_prioridade=pd.prioridade_total - gulosa.prioridade_total,
            guloso_atingiu_otimo=gulosa.prioridade_total == pd.prioridade_total,
        ),
        tabela_disponivel=cabe_na_tabela(requisicao),
    )


def montar_tabela(requisicao: RequisicaoPlano) -> RespostaTabela:
    """Devolve a tabela OPT completa e os passos da reconstrução.

    Levanta TabelaGrandeDemais acima de N_TABELA atividades ou T_TABELA minutos.
    """
    if not cabe_na_tabela(requisicao):
        raise TabelaGrandeDemais(MENSAGEM_TABELA_GRANDE)

    ids, duracoes, prioridades, capacidade = _listas(requisicao)
    tabela = construir_tabela(duracoes, prioridades, capacidade)
    passos = passos_reconstrucao(tabela, duracoes, prioridades, capacidade)

    return RespostaTabela(
        capacidade=capacidade,
        ordem_atividades=ids,
        tabela=tabela,
        passos=[
            PassoReconstrucao(
                i=p.i,
                atividade_id=ids[p.i - 1],
                t=p.t,
                valor_sem=p.valor_sem,
                valor_com=p.valor_com,
                decisao="incluir" if p.incluir else "descartar",
            )
            for p in passos
        ],
        selecionadas=[ids[k] for k in reconstruir(tabela, duracoes, capacidade)],
        prioridade_total=tabela[len(ids)][capacidade],
    )


def _listas(requisicao: RequisicaoPlano) -> tuple[list[str], list[int], list[int], int]:
    atividades = requisicao.atividades
    return (
        [a.id for a in atividades],
        [a.duracao for a in atividades],
        [a.prioridade for a in atividades],
        requisicao.tempo_disponivel,
    )


def _selecao(ids: list[str], indices: list[int], prioridade_total: int, tempo_usado: int, capacidade: int) -> dict:
    """Campos comuns de ResultadoSelecao, com `id`s na ordem da entrada."""
    escolhidas = set(indices)
    return {
        "selecionadas": [ids[k] for k in sorted(escolhidas)],
        "descartadas": [ids[k] for k in range(len(ids)) if k not in escolhidas],
        "prioridade_total": prioridade_total,
        "tempo_usado": tempo_usado,
        "tempo_restante": capacidade - tempo_usado,
    }
