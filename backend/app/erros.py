"""Tradução para português das mensagens de validação do Pydantic."""

from typing import Any


def traduzir_erro(erro: dict[str, Any]) -> str:
    """Recebe um item de `ValidationError.errors()` e devolve a mensagem em português.

    Tipos sem tradução conhecida mantêm a mensagem original.
    """
    ctx = erro.get("ctx") or {}
    tipo = erro["type"]

    if tipo == "string_too_short":
        if ctx.get("min_length") == 1:
            return "Não pode ficar vazio."
        return f"Deve ter pelo menos {ctx.get('min_length')} caracteres."

    traducoes = {
        "missing": "Campo obrigatório.",
        "int_type": "Deve ser um número inteiro.",
        "int_parsing": "Deve ser um número inteiro.",
        "bool_type": "Deve ser verdadeiro ou falso.",
        "string_type": "Deve ser um texto.",
        "list_type": "Deve ser uma lista.",
        "model_type": "Deve ser um objeto.",
        "model_attributes_type": "Deve ser um objeto.",
        "dict_type": "Deve ser um objeto.",
        "json_invalid": "JSON inválido.",
        "greater_than_equal": f"Deve ser maior ou igual a {ctx.get('ge')}.",
        "less_than_equal": f"Deve ser menor ou igual a {ctx.get('le')}.",
        "string_too_long": f"Deve ter no máximo {ctx.get('max_length')} caracteres.",
        "too_long": f"Deve ter no máximo {ctx.get('max_length')} itens.",
        "literal_error": f"Valor inválido; use {ctx.get('expected')}.",
    }
    return traducoes.get(tipo, erro["msg"])
