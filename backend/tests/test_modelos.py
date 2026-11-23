"""Contratos: os JSONs de referência validam e as entradas inválidas são recusadas em português."""

import copy
import json
from typing import Any

import pytest
from pydantic import ValidationError

from app.erros import traduzir_erro
from app.limites import N_MAX
from app.modelos import Atividade, RequisicaoPlano, RespostaResolver, RespostaTabela


def _atividade(**campos: Any) -> dict[str, Any]:
    base = {"id": "a1", "nome": "Revisar", "disciplina": "PA", "duracao": 5, "prioridade": 5}
    return base | campos


def _mensagens(erro: ValidationError) -> list[str]:
    return [traduzir_erro(e) for e in erro.errors()]


# --- JSONs de referência ---------------------------------------------------


def test_requisicao_de_referencia_valida(requisicao_contraexemplo):
    req = RequisicaoPlano.model_validate(requisicao_contraexemplo)
    assert req.tempo_disponivel == 10
    assert [a.id for a in req.atividades] == ["a1", "a2", "a3", "a4"]


def test_resposta_resolver_de_referencia_valida(resposta_resolver_contraexemplo):
    resp = RespostaResolver.model_validate(resposta_resolver_contraexemplo)
    assert resp.model_dump(mode="json") == resposta_resolver_contraexemplo


def test_resposta_tabela_de_referencia_valida(resposta_tabela_contraexemplo):
    resp = RespostaTabela.model_validate(resposta_tabela_contraexemplo)
    assert resp.model_dump(mode="json") == resposta_tabela_contraexemplo


def test_requisicao_aceita_json_bruto(requisicao_contraexemplo):
    RequisicaoPlano.model_validate_json(json.dumps(requisicao_contraexemplo))


# --- Regras da Atividade ---------------------------------------------------


def test_disciplina_e_opcional_e_espacos_sao_removidos():
    dados = _atividade(nome="  Revisar  ")
    del dados["disciplina"]
    atividade = Atividade.model_validate(dados)
    assert atividade.disciplina == ""
    assert atividade.nome == "Revisar"


@pytest.mark.parametrize(
    ("campos", "mensagem"),
    [
        ({"duracao": 0}, "Deve ser maior ou igual a 1."),
        ({"duracao": -5}, "Deve ser maior ou igual a 1."),
        ({"duracao": 3001}, "Deve ser menor ou igual a 3000."),
        ({"duracao": 5.5}, "Deve ser um número inteiro."),
        ({"duracao": 5.0}, "Deve ser um número inteiro."),
        ({"duracao": "5"}, "Deve ser um número inteiro."),
        ({"duracao": True}, "Deve ser um número inteiro."),
        ({"prioridade": 0}, "Deve ser maior ou igual a 1."),
        ({"prioridade": 11}, "Deve ser menor ou igual a 10."),
        ({"nome": ""}, "Não pode ficar vazio."),
        ({"nome": "   "}, "Não pode ficar vazio."),
        ({"nome": "x" * 81}, "Deve ter no máximo 80 caracteres."),
        ({"disciplina": "x" * 41}, "Deve ter no máximo 40 caracteres."),
        ({"id": ""}, "Não pode ficar vazio."),
    ],
)
def test_atividade_invalida(campos, mensagem):
    with pytest.raises(ValidationError) as erro:
        Atividade.model_validate(_atividade(**campos))
    assert _mensagens(erro.value) == [mensagem]


def test_campo_obrigatorio_ausente():
    dados = _atividade()
    del dados["duracao"]
    with pytest.raises(ValidationError) as erro:
        Atividade.model_validate(dados)
    assert _mensagens(erro.value) == ["Campo obrigatório."]


# --- Regras da requisição --------------------------------------------------


@pytest.mark.parametrize(
    ("tempo", "mensagem"),
    [(-1, "Deve ser maior ou igual a 0."), (3001, "Deve ser menor ou igual a 3000."), ("10", "Deve ser um número inteiro.")],
)
def test_tempo_disponivel_invalido(tempo, mensagem):
    with pytest.raises(ValidationError) as erro:
        RequisicaoPlano.model_validate({"tempo_disponivel": tempo, "atividades": []})
    assert _mensagens(erro.value) == [mensagem]


def test_limites_inclusivos_sao_aceitos():
    atividades = [_atividade(id=f"a{i}", duracao=3000, prioridade=10) for i in range(N_MAX)]
    req = RequisicaoPlano.model_validate({"tempo_disponivel": 3000, "atividades": atividades})
    assert len(req.atividades) == N_MAX
    assert RequisicaoPlano.model_validate({"tempo_disponivel": 0, "atividades": []}).atividades == []


def test_mais_atividades_que_o_limite():
    atividades = [_atividade(id=f"a{i}") for i in range(N_MAX + 1)]
    with pytest.raises(ValidationError) as erro:
        RequisicaoPlano.model_validate({"tempo_disponivel": 10, "atividades": atividades})
    assert _mensagens(erro.value) == ["Deve ter no máximo 100 itens."]


def test_ids_repetidos(requisicao_contraexemplo):
    dados = copy.deepcopy(requisicao_contraexemplo)
    dados["atividades"][1]["id"] = "a1"
    with pytest.raises(ValidationError) as erro:
        RequisicaoPlano.model_validate(dados)
    assert _mensagens(erro.value) == ["Os ids das atividades devem ser distintos."]


def test_ids_que_so_diferem_por_espaco_sao_repetidos():
    atividades = [_atividade(id="a1"), _atividade(id=" a1 ")]
    with pytest.raises(ValidationError) as erro:
        RequisicaoPlano.model_validate({"tempo_disponivel": 10, "atividades": atividades})
    assert _mensagens(erro.value) == ["Os ids das atividades devem ser distintos."]
