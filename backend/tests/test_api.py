"""API: respostas da seção 8 para o exemplo, erros 422 em português e limites da tabela."""

import copy
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.limites import N_MAX, N_TABELA, T_MAX, T_TABELA
from app.main import app

cliente = TestClient(app)

MENSAGEM_TABELA = "A tabela didática aceita no máximo 8 atividades e 30 minutos."


def _atividade(**campos: Any) -> dict[str, Any]:
    base = {"id": "a1", "nome": "Revisar", "disciplina": "PA", "duracao": 5, "prioridade": 5}
    return base | campos


def _requisicao(n: int, tempo: int) -> dict[str, Any]:
    return {"tempo_disponivel": tempo, "atividades": [_atividade(id=f"a{k}") for k in range(n)]}


def _mensagens(resposta) -> list[str]:
    assert resposta.status_code == 422, resposta.text
    detail = resposta.json()["detail"]
    assert isinstance(detail, list)
    assert all(set(item) == {"loc", "msg", "type"} for item in detail)
    return [item["msg"] for item in detail]


# --- Saúde e exemplos ------------------------------------------------------


def test_saude():
    resposta = cliente.get("/api/saude")
    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_exemplos(requisicao_contraexemplo):
    resposta = cliente.get("/api/exemplos")
    assert resposta.status_code == 200
    exemplos = resposta.json()
    assert [e["id"] for e in exemplos] == ["contraexemplo-guloso", "empate", "tarde-de-estudos"]
    primeiro = exemplos[0]
    assert {"tempo_disponivel": primeiro["tempo_disponivel"], "atividades": primeiro["atividades"]} == (
        requisicao_contraexemplo
    )


def test_todos_os_exemplos_resolvem():
    for exemplo in cliente.get("/api/exemplos").json():
        corpo = {"tempo_disponivel": exemplo["tempo_disponivel"], "atividades": exemplo["atividades"]}
        resposta = cliente.post("/api/resolver", json=corpo)
        assert resposta.status_code == 200, exemplo["id"]
        if resposta.json()["tabela_disponivel"]:
            assert cliente.post("/api/tabela", json=corpo).status_code == 200, exemplo["id"]


# --- POST /api/resolver ----------------------------------------------------


def test_resolver_contraexemplo_igual_a_secao_8(requisicao_contraexemplo, resposta_resolver_contraexemplo):
    resposta = cliente.post("/api/resolver", json=requisicao_contraexemplo)
    assert resposta.status_code == 200
    assert resposta.json() == resposta_resolver_contraexemplo


def test_resolver_e_deterministico(requisicao_contraexemplo):
    primeira = cliente.post("/api/resolver", json=requisicao_contraexemplo).json()
    assert cliente.post("/api/resolver", json=requisicao_contraexemplo).json() == primeira


def test_resolver_contraexemplo_minimo(requisicao_contraexemplo):
    """Caso 8, versão de 3 atividades: PD = 10, guloso = 7."""
    corpo = copy.deepcopy(requisicao_contraexemplo)
    corpo["atividades"] = corpo["atividades"][:3]
    dados = cliente.post("/api/resolver", json=corpo).json()
    assert (dados["pd"]["selecionadas"], dados["pd"]["prioridade_total"]) == (["a2", "a3"], 10)
    assert (dados["guloso"]["selecionadas"], dados["guloso"]["prioridade_total"]) == (["a1"], 7)
    assert dados["guloso"]["otimo_garantido"] is False
    assert dados["comparacao"] == {"diferenca_prioridade": 3, "guloso_atingiu_otimo": False}


def test_resolver_lista_vazia():
    dados = cliente.post("/api/resolver", json={"tempo_disponivel": 10, "atividades": []}).json()
    for estrategia in ("pd", "guloso"):
        resultado = dados[estrategia]
        assert resultado["selecionadas"] == resultado["descartadas"] == []
        assert (resultado["prioridade_total"], resultado["tempo_usado"], resultado["tempo_restante"]) == (0, 0, 10)
    assert dados["guloso"]["ordem_considerada"] == []
    assert dados["comparacao"] == {"diferenca_prioridade": 0, "guloso_atingiu_otimo": True}
    assert dados["tabela_disponivel"] is True


def test_resolver_listas_na_ordem_da_entrada():
    # O guloso examina c (razão 3) antes de a e b, mas as listas saem na ordem da entrada.
    corpo = {
        "tempo_disponivel": 4,
        "atividades": [
            _atividade(id="a", duracao=2, prioridade=2),
            _atividade(id="b", duracao=3, prioridade=3),
            _atividade(id="c", duracao=1, prioridade=3),
        ],
    }
    dados = cliente.post("/api/resolver", json=corpo).json()
    assert dados["guloso"]["ordem_considerada"] == ["c", "b", "a"]
    assert dados["guloso"]["selecionadas"] == ["b", "c"]
    assert dados["guloso"]["descartadas"] == ["a"]
    assert dados["pd"]["selecionadas"] == ["b", "c"]
    assert dados["comparacao"]["guloso_atingiu_otimo"] is True


# --- POST /api/tabela ------------------------------------------------------


def test_tabela_contraexemplo_igual_a_secao_8(requisicao_contraexemplo, resposta_tabela_contraexemplo):
    resposta = cliente.post("/api/tabela", json=requisicao_contraexemplo)
    assert resposta.status_code == 200
    assert resposta.json() == resposta_tabela_contraexemplo


def test_tabela_aceita_o_limite():
    resposta = cliente.post("/api/tabela", json=_requisicao(N_TABELA, T_TABELA))
    assert resposta.status_code == 200
    dados = resposta.json()
    assert len(dados["tabela"]) == N_TABELA + 1
    assert all(len(linha) == T_TABELA + 1 for linha in dados["tabela"])


@pytest.mark.parametrize(
    ("n", "tempo"),
    [pytest.param(N_TABELA + 1, 10, id="n-acima"), pytest.param(4, T_TABELA + 1, id="t-acima")],
)
def test_tabela_acima_do_limite(n, tempo):
    """Caso 12: /api/tabela recusa, /api/resolver continua respondendo."""
    corpo = _requisicao(n, tempo)

    resposta = cliente.post("/api/tabela", json=corpo)
    assert resposta.status_code == 422
    assert resposta.json() == {"detail": MENSAGEM_TABELA}

    resolver = cliente.post("/api/resolver", json=corpo)
    assert resolver.status_code == 200
    assert resolver.json()["tabela_disponivel"] is False


# --- Erros de validação (caso 7) -------------------------------------------


@pytest.mark.parametrize(
    ("campos", "mensagem"),
    [
        pytest.param({"duracao": 0}, "Deve ser maior ou igual a 1.", id="duracao-zero"),
        pytest.param({"duracao": -5}, "Deve ser maior ou igual a 1.", id="duracao-negativa"),
        pytest.param({"duracao": 5.5}, "Deve ser um número inteiro.", id="duracao-decimal"),
        pytest.param({"duracao": "5"}, "Deve ser um número inteiro.", id="duracao-texto"),
        pytest.param({"duracao": True}, "Deve ser um número inteiro.", id="duracao-booleana"),
        pytest.param({"prioridade": 0}, "Deve ser maior ou igual a 1.", id="prioridade-zero"),
        pytest.param({"prioridade": 11}, "Deve ser menor ou igual a 10.", id="prioridade-onze"),
        pytest.param({"nome": ""}, "Não pode ficar vazio.", id="nome-vazio"),
        pytest.param({"nome": "   "}, "Não pode ficar vazio.", id="nome-so-espacos"),
    ],
)
@pytest.mark.parametrize("rota", ["/api/resolver", "/api/tabela"])
def test_atividade_invalida(rota, campos, mensagem):
    corpo = {"tempo_disponivel": 10, "atividades": [_atividade(**campos)]}
    assert _mensagens(cliente.post(rota, json=corpo)) == [mensagem]


@pytest.mark.parametrize(
    ("tempo", "mensagem"),
    [
        pytest.param(-1, "Deve ser maior ou igual a 0.", id="negativo"),
        pytest.param(T_MAX + 1, "Deve ser menor ou igual a 3000.", id="acima"),
        pytest.param("10", "Deve ser um número inteiro.", id="texto"),
    ],
)
def test_tempo_disponivel_invalido(tempo, mensagem):
    corpo = {"tempo_disponivel": tempo, "atividades": []}
    assert _mensagens(cliente.post("/api/resolver", json=corpo)) == [mensagem]


def test_mais_atividades_que_o_limite():
    corpo = _requisicao(N_MAX + 1, 10)
    assert _mensagens(cliente.post("/api/resolver", json=corpo)) == ["Deve ter no máximo 100 itens."]


def test_ids_repetidos(requisicao_contraexemplo):
    corpo = copy.deepcopy(requisicao_contraexemplo)
    corpo["atividades"][1]["id"] = "a1"
    assert _mensagens(cliente.post("/api/resolver", json=corpo)) == ["Os ids das atividades devem ser distintos."]


def test_campo_obrigatorio_ausente():
    resposta = cliente.post("/api/resolver", json={"atividades": []})
    assert _mensagens(resposta) == ["Campo obrigatório."]
    assert resposta.json()["detail"][0]["loc"] == ["body", "tempo_disponivel"]


def test_json_invalido():
    resposta = cliente.post("/api/resolver", content="{", headers={"Content-Type": "application/json"})
    assert _mensagens(resposta) == ["JSON inválido."]


def test_erro_nao_ecoa_o_valor_recebido():
    corpo = {"tempo_disponivel": 10, "atividades": [_atividade(nome="x" * 81)]}
    resposta = cliente.post("/api/resolver", json=corpo)
    assert _mensagens(resposta) == ["Deve ter no máximo 80 caracteres."]
    assert "x" * 81 not in resposta.text
