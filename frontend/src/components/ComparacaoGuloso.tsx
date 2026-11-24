import type { ReactNode } from 'react'

import type { Atividade, RespostaResolver } from '../types'
import { ListaIds } from './PainelResultado'

interface Props {
  resposta: RespostaResolver
  atividades: Map<string, Atividade>
}

export function ComparacaoGuloso({ resposta, atividades }: Props) {
  const { pd, guloso, comparacao } = resposta
  const nome = (id: string) => atividades.get(id)?.nome ?? id

  return (
    <section aria-label="Comparação com o guloso" className="space-y-4">
      {comparacao.guloso_atingiu_otimo ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          Nesta instância o guloso chegou ao ótimo ({guloso.prioridade_total} pontos), mas isso não
          vale em geral: ele não tem garantia de otimalidade.
        </p>
      ) : (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          O guloso ficou <strong>{comparacao.diferenca_prioridade}</strong>{' '}
          {comparacao.diferenca_prioridade === 1 ? 'ponto' : 'pontos'} de prioridade abaixo do ótimo
          ({guloso.prioridade_total} contra {pd.prioridade_total}).
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Coluna
          titulo="Programação dinâmica"
          selo="Ótimo garantido"
          corSelo="bg-emerald-100 text-emerald-800"
          prioridade={pd.prioridade_total}
          tempoUsado={pd.tempo_usado}
          tempoRestante={pd.tempo_restante}
        >
          <ListaIds titulo="Selecionadas" ids={pd.selecionadas} atividades={atividades} vazio="Nenhuma." />
        </Coluna>
        <Coluna
          titulo="Guloso por prioridade/duração"
          selo="Heurística sem garantia de otimalidade"
          corSelo="bg-amber-100 text-amber-800"
          prioridade={guloso.prioridade_total}
          tempoUsado={guloso.tempo_usado}
          tempoRestante={guloso.tempo_restante}
        >
          <ListaIds titulo="Selecionadas" ids={guloso.selecionadas} atividades={atividades} vazio="Nenhuma." />
        </Coluna>
      </div>

      {guloso.ordem_considerada.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-semibold text-slate-700">
            Ordem em que o guloso examinou (maior prioridade/duração primeiro)
          </h3>
          <ol className="space-y-1 text-sm">
            {guloso.ordem_considerada.map((id, k) => {
              const a = atividades.get(id)
              const entrou = guloso.selecionadas.includes(id)
              return (
                <li key={id} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-slate-400">{k + 1}.</span>
                  <span className={entrou ? 'text-slate-800' : 'text-slate-400 line-through'}>{nome(id)}</span>
                  {a && (
                    <span className="text-xs text-slate-500 tabular-nums">
                      {a.prioridade}/{a.duracao} = {(a.prioridade / a.duracao).toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className={`text-xs ${entrou ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {entrou ? 'incluída' : 'não coube, pulada'}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="mt-2 text-xs text-slate-500">
            A razão serve só para ordenar; a comparação real é feita com inteiros. Escolher sempre a
            melhor razão pode deixar uma sobra de tempo em que nada mais cabe.
          </p>
        </div>
      )}
    </section>
  )
}

function Coluna(props: {
  titulo: string
  selo: string
  corSelo: string
  prioridade: number
  tempoUsado: number
  tempoRestante: number
  children: ReactNode
}) {
  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
      <div>
        <h3 className="font-semibold text-slate-800">{props.titulo}</h3>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${props.corSelo}`}>
          {props.selo}
        </span>
      </div>
      <p className="text-sm text-slate-600 tabular-nums">
        <strong className="text-2xl text-slate-900">{props.prioridade}</strong> pontos · {props.tempoUsado} min
        usados · {props.tempoRestante} min sobrando
      </p>
      {props.children}
    </div>
  )
}
