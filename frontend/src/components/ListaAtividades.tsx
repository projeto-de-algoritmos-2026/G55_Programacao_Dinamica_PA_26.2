import { corDisciplina, nomeDisciplina } from '../cores'
import { N_MAX } from '../limites'
import type { Atividade } from '../types'

interface Props {
  atividades: Atividade[]
  editandoId: string | null
  onEditar: (id: string) => void
  onRemover: (id: string) => void
}

export function ListaAtividades({ atividades, editandoId, onEditar, onRemover }: Props) {
  const total = atividades.reduce((soma, a) => soma + a.duracao, 0)

  return (
    <section aria-label="Atividades cadastradas">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-700">Atividades</h3>
        <span className="text-xs text-slate-500">
          {atividades.length}/{N_MAX} · {total} min no total
        </span>
      </div>
      {atividades.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
          Nenhuma atividade. Adicione uma abaixo ou carregue um exemplo.
        </p>
      ) : (
        <ol className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {atividades.map((a, k) => (
            <li
              key={a.id}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${editandoId === a.id ? 'bg-sky-50' : ''}`}
            >
              <span className="w-5 shrink-0 text-right text-xs text-slate-400">{k + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800" title={a.nome}>
                  {a.nome}
                </p>
                <span
                  className={`mt-0.5 inline-block max-w-full truncate rounded border px-1.5 align-bottom text-xs ${corDisciplina(a.disciplina)}`}
                >
                  {nomeDisciplina(a.disciplina)}
                </span>
              </div>
              <span className="shrink-0 text-xs text-slate-600 tabular-nums">
                {a.duracao} min · p {a.prioridade}
              </span>
              <button
                type="button"
                onClick={() => onEditar(a.id)}
                className="rounded px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onRemover(a.id)}
                className="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-100"
              >
                Remover
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
