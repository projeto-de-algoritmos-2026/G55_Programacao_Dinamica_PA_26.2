// Tipos que espelham os schemas Pydantic de backend/app/modelos.py.
// Mantenha os dois arquivos sincronizados ao mudar um contrato.

// --- Entrada ---------------------------------------------------------------

export interface Atividade {
  id: string
  nome: string // 1 a 80 caracteres
  disciplina: string // 0 a 40 caracteres; vazio vira "Sem disciplina" na tela
  duracao: number // inteiro, 1 a 3000 minutos
  prioridade: number // inteiro, 1 a 10
}

/** Corpo de POST /api/resolver e POST /api/tabela. */
export interface RequisicaoPlano {
  tempo_disponivel: number // inteiro, 0 a 3000 minutos
  atividades: Atividade[] // até 100, ids distintos
}

/** Instância pronta servida por GET /api/exemplos. */
export interface Exemplo extends RequisicaoPlano {
  id: string
  nome: string
  descricao: string
}

// --- Saída -----------------------------------------------------------------

export type Estrategia = 'programacao_dinamica' | 'guloso_prioridade_por_duracao'

export interface ResultadoSelecao {
  estrategia: Estrategia
  otimo_garantido: boolean
  selecionadas: string[] // ids, na ordem original da entrada
  descartadas: string[]
  prioridade_total: number
  tempo_usado: number
  tempo_restante: number
}

export interface ResultadoGuloso extends ResultadoSelecao {
  estrategia: 'guloso_prioridade_por_duracao'
  otimo_garantido: false
  ordem_considerada: string[]
}

export interface Comparacao {
  diferenca_prioridade: number // PD menos guloso; nunca negativa
  guloso_atingiu_otimo: boolean
}

export interface RespostaResolver {
  tempo_disponivel: number
  pd: ResultadoSelecao
  guloso: ResultadoGuloso
  comparacao: Comparacao
  tabela_disponivel: boolean // n <= 8 e T <= 30
}

export interface PassoReconstrucao {
  i: number // linha da tabela (1..n)
  atividade_id: string
  t: number
  valor_sem: number
  valor_com: number | null // null quando a atividade não cabe em t
  decisao: 'incluir' | 'descartar'
}

export interface RespostaTabela {
  capacidade: number
  ordem_atividades: string[]
  tabela: number[][]
  passos: PassoReconstrucao[]
  selecionadas: string[]
  prioridade_total: number
}

/** Erro 422: `detail` é texto (limites da tabela) ou a lista padrão do FastAPI. */
export interface ErroApi {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[]
}
