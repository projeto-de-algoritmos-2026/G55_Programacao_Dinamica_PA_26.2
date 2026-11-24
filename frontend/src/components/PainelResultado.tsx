import { corDisciplina, nomeDisciplina } from '../cores'
import type { Atividade, ResultadoSelecao } from '../types'

interface Props {
  resultado: ResultadoSelecao
  tempoDisponivel: number
  atividades: Map<string, Atividade>
}

export const AVISO_PRIORIDADE =
  'A prioridade é definida por você. A soma não prevê aprendizado, e a lista não indica a ordem de estudo.'

export function PainelResultado({ resultado, tempoDisponivel, atividades }: Props) {
  const ocupacao = tempoDisponivel === 0 ? 0 : (resultado.tempo_usado / tempoDisponivel) * 100

  return (
    <section aria-label="Resultado da programação dinâmica" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Plano ótimo</h2>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          Ótimo garantido (programação dinâmica)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Indicador rotulo="Prioridade total" valor={String(resultado.prioridade_total)} destaque />
        <Indicador rotulo="Tempo usado" valor={`${resultado.tempo_usado} min`} />
        <Indicador rotulo="Tempo restante" valor={`${resultado.tempo_restante} min`} />
      </div>

      <div>
        <div
          className="h-3 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Ocupação do tempo disponível"
          aria-valuemin={0}
          aria-valuemax={tempoDisponivel}
          aria-valuenow={resultado.tempo_usado}
        >
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${ocupacao}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {resultado.tempo_usado} de {tempoDisponivel} min ocupados ({Math.round(ocupacao)}%)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ListaIds
          titulo={`Selecionadas (${resultado.selecionadas.length})`}
          ids={resultado.selecionadas}
          atividades={atividades}
          vazio="Nenhuma atividade cabe no tempo disponível."
        />
        <ListaIds
          titulo={`Descartadas (${resultado.descartadas.length})`}
          ids={resultado.descartadas}
          atividades={atividades}
          vazio="Nenhuma: todas couberam."
          cinza
        />
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        {AVISO_PRIORIDADE}
      </p>
    </section>
  )
}

function Indicador({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{rotulo}</p>
      <p className={`tabular-nums ${destaque ? 'text-2xl font-bold text-emerald-700' : 'text-xl font-semibold'}`}>
        {valor}
      </p>
    </div>
  )
}

export function ListaIds({
  titulo,
  ids,
  atividades,
  vazio,
  cinza,
}: {
  titulo: string
  ids: string[]
  atividades: Map<string, Atividade>
  vazio: string
  cinza?: boolean
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-700">{titulo}</h3>
      {ids.length === 0 ? (
        <p className="text-xs text-slate-500">{vazio}</p>
      ) : (
        <ul className="space-y-1.5">
          {ids.map((id) => {
            const a = atividades.get(id)
            if (!a) return null
            const cor = cinza ? 'bg-slate-100 text-slate-500 border-slate-200' : corDisciplina(a.disciplina)
            return (
              <li key={id} className={`rounded-md border px-2.5 py-1.5 text-sm ${cor}`}>
                <p className={`font-medium ${cinza ? 'line-through decoration-slate-300' : ''}`}>{a.nome}</p>
                <p className="text-xs opacity-80">
                  {nomeDisciplina(a.disciplina)} · {a.duracao} min · prioridade {a.prioridade}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
