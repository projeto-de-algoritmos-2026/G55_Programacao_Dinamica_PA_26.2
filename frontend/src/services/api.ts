// Chamadas à API do EstudaPlan. Em desenvolvimento, /api passa pelo proxy do Vite.

import type {
  Exemplo,
  RequisicaoPlano,
  RespostaErro,
  RespostaResolver,
  RespostaTabela,
} from '../types'

/** Erro com mensagem pronta para mostrar na tela. */
export class ErroDaApi extends Error {}

const SEM_CONEXAO = 'Não foi possível conectar à API. Verifique se o backend está rodando.'

const NOMES_DE_CAMPO: Record<string, string> = {
  tempo_disponivel: 'Tempo disponível',
  atividades: 'Atividades',
  nome: 'Nome',
  disciplina: 'Disciplina',
  duracao: 'Duração',
  prioridade: 'Prioridade',
  id: 'Id',
}

function mensagemDoErro(corpo: unknown, status: number): string {
  const detail = (corpo as Partial<RespostaErro> | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const { loc, msg } = detail[0]
    const campo = [...loc].reverse().find((parte) => typeof parte === 'string' && parte in NOMES_DE_CAMPO)
    const indice = loc.find((parte) => typeof parte === 'number')
    const prefixo = campo ? NOMES_DE_CAMPO[campo as string] : ''
    const onde = typeof indice === 'number' ? ` (atividade ${indice + 1})` : ''
    return prefixo ? `${prefixo}${onde}: ${msg}` : msg
  }
  return `A API respondeu com erro (HTTP ${status}).`
}

async function pedir<T>(caminho: string, corpo?: unknown): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(caminho, {
      method: corpo === undefined ? 'GET' : 'POST',
      headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroDaApi(SEM_CONEXAO)
  }

  const dados: unknown = await resposta.json().catch(() => null)
  // O proxy do Vite responde 502 sem corpo JSON quando o backend está fora do ar.
  if (dados === null && [502, 503, 504].includes(resposta.status)) throw new ErroDaApi(SEM_CONEXAO)
  if (!resposta.ok) throw new ErroDaApi(mensagemDoErro(dados, resposta.status))
  if (dados === null) throw new ErroDaApi('A API devolveu uma resposta vazia ou inválida.')
  return dados as T
}

export const api = {
  saude: () => pedir<{ status: string }>('/api/saude'),
  listarExemplos: () => pedir<Exemplo[]>('/api/exemplos'),
  resolver: (requisicao: RequisicaoPlano) => pedir<RespostaResolver>('/api/resolver', requisicao),
  tabela: (requisicao: RequisicaoPlano) => pedir<RespostaTabela>('/api/tabela', requisicao),
}
