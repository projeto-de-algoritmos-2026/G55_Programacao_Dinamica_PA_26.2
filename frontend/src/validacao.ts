// Validação local com as mesmas regras da API (backend/app/modelos.py).

import {
  DISCIPLINA_MAX,
  DURACAO_MAX,
  DURACAO_MIN,
  NOME_MAX,
  PRIORIDADE_MAX,
  PRIORIDADE_MIN,
  T_MAX,
} from './limites'
import type { Atividade } from './types'

/** Valores do formulário, como texto digitado. */
export interface FormAtividade {
  nome: string
  disciplina: string
  duracao: string
  prioridade: string
}

export type ErrosAtividade = Partial<Record<keyof FormAtividade, string>>

export const FORM_VAZIO: FormAtividade = { nome: '', disciplina: '', duracao: '', prioridade: '' }

/** Inteiro em [min, max] a partir de texto, sem aceitar decimal; devolve o erro ou o número. */
function inteiroNaFaixa(texto: string, min: number, max: number): string | number {
  const limpo = texto.trim()
  if (limpo === '') return 'Campo obrigatório.'
  if (!/^-?\d+$/.test(limpo)) return 'Deve ser um número inteiro.'
  const valor = Number(limpo)
  if (valor < min) return `Deve ser maior ou igual a ${min}.`
  if (valor > max) return `Deve ser menor ou igual a ${max}.`
  return valor
}

export function validarAtividade(
  form: FormAtividade,
): { erros: ErrosAtividade; dados?: Omit<Atividade, 'id'> } {
  const erros: ErrosAtividade = {}
  const nome = form.nome.trim()
  const disciplina = form.disciplina.trim()

  if (nome === '') erros.nome = 'Não pode ficar vazio.'
  else if (nome.length > NOME_MAX) erros.nome = `Deve ter no máximo ${NOME_MAX} caracteres.`
  if (disciplina.length > DISCIPLINA_MAX) {
    erros.disciplina = `Deve ter no máximo ${DISCIPLINA_MAX} caracteres.`
  }
  const duracao = inteiroNaFaixa(form.duracao, DURACAO_MIN, DURACAO_MAX)
  if (typeof duracao === 'string') erros.duracao = duracao
  const prioridade = inteiroNaFaixa(form.prioridade, PRIORIDADE_MIN, PRIORIDADE_MAX)
  if (typeof prioridade === 'string') erros.prioridade = prioridade

  if (Object.keys(erros).length > 0) return { erros }
  return {
    erros,
    dados: { nome, disciplina, duracao: duracao as number, prioridade: prioridade as number },
  }
}

export function validarTempo(texto: string): string | number {
  return inteiroNaFaixa(texto, 0, T_MAX)
}

let contador = 0

export function novoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  contador += 1
  return `atv-${Date.now().toString(36)}-${contador}`
}
