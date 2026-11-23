"""Schemas Pydantic dos contratos da API.

Inteiros usam modo estrito: "5", 5.5, 5.0 e true são rejeitados em vez de
convertidos. As listas `selecionadas` e `descartadas` das respostas seguem a
ordem original da entrada.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator
from pydantic_core import PydanticCustomError

from app.limites import (
    DISCIPLINA_MAX,
    DURACAO_MAX,
    DURACAO_MIN,
    N_MAX,
    NOME_MAX,
    PRIORIDADE_MAX,
    PRIORIDADE_MIN,
    T_MAX,
)

TextoObrigatorio = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Duracao = Annotated[int, Field(strict=True, ge=DURACAO_MIN, le=DURACAO_MAX)]
Prioridade = Annotated[int, Field(strict=True, ge=PRIORIDADE_MIN, le=PRIORIDADE_MAX)]
TempoDisponivel = Annotated[int, Field(strict=True, ge=0, le=T_MAX)]


# --- Entrada ---------------------------------------------------------------


class Atividade(BaseModel):
    id: TextoObrigatorio
    nome: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=NOME_MAX)]
    disciplina: Annotated[str, StringConstraints(strip_whitespace=True, max_length=DISCIPLINA_MAX)] = ""
    duracao: Duracao
    prioridade: Prioridade


class RequisicaoPlano(BaseModel):
    """Corpo de POST /api/resolver e POST /api/tabela."""

    tempo_disponivel: TempoDisponivel
    atividades: Annotated[list[Atividade], Field(max_length=N_MAX)]

    @field_validator("atividades")
    @classmethod
    def _ids_distintos(cls, atividades: list[Atividade]) -> list[Atividade]:
        ids = [a.id for a in atividades]
        if len(set(ids)) != len(ids):
            raise PydanticCustomError("ids_repetidos", "Os ids das atividades devem ser distintos.")
        return atividades


class Exemplo(RequisicaoPlano):
    """Instância pronta servida por GET /api/exemplos."""

    id: TextoObrigatorio
    nome: TextoObrigatorio
    descricao: TextoObrigatorio


# --- Saída -----------------------------------------------------------------


class ResultadoSelecao(BaseModel):
    estrategia: Literal["programacao_dinamica", "guloso_prioridade_por_duracao"]
    otimo_garantido: bool
    selecionadas: list[str]
    descartadas: list[str]
    prioridade_total: int
    tempo_usado: int
    tempo_restante: int


class ResultadoGuloso(ResultadoSelecao):
    estrategia: Literal["guloso_prioridade_por_duracao"] = "guloso_prioridade_por_duracao"
    otimo_garantido: Literal[False] = False
    ordem_considerada: list[str]


class Comparacao(BaseModel):
    diferenca_prioridade: int  # PD menos guloso; nunca negativa
    guloso_atingiu_otimo: bool


class RespostaResolver(BaseModel):
    tempo_disponivel: int
    pd: ResultadoSelecao
    guloso: ResultadoGuloso
    comparacao: Comparacao
    tabela_disponivel: bool  # n <= N_TABELA e T <= T_TABELA


class PassoReconstrucao(BaseModel):
    i: int  # linha da tabela (1..n)
    atividade_id: str
    t: int
    valor_sem: int
    valor_com: int | None  # None quando a atividade não cabe em t
    decisao: Literal["incluir", "descartar"]


class RespostaTabela(BaseModel):
    capacidade: int
    ordem_atividades: list[str]
    tabela: list[list[int]]
    passos: list[PassoReconstrucao]
    selecionadas: list[str]
    prioridade_total: int
