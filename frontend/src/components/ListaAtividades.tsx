import { N_MAX } from '../limites'
import type { Atividade } from '../types'
import { BlocoAtividade } from './BlocoAtividade'

interface Props {
  atividades: Atividade[]
  naRegua: Set<string>
  recusa: { id: string; n: number } | null
  onAlternar: (id: string) => void
  onEditar: (id: string) => void
  onRemover: (id: string) => void
  onNova: () => void
}

/** A mesa: as atividades como peças, maiores quanto mais tempo levam. */
export function ListaAtividades({ atividades, naRegua, recusa, onAlternar, onEditar, onRemover, onNova }: Props) {
  const total = atividades.reduce((soma, a) => soma + a.duracao, 0)
  const maior = Math.max(...atividades.map((a) => a.duracao), 1)
  const cheia = atividades.length >= N_MAX

  return (
    <section aria-labelledby="titulo-mesa" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-mesa" className="font-display text-2xl font-extrabold">
          Sua mesa
        </h2>
        <p className="text-sm text-tinta-suave">
          {atividades.length === 0
            ? 'Nenhuma atividade ainda'
            : `${atividades.length} ${atividades.length === 1 ? 'atividade' : 'atividades'}, ${total} min no total`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {atividades.map((a) => (
          <BlocoAtividade
            key={a.id}
            atividade={a}
            maiorDuracao={maior}
            naRegua={naRegua.has(a.id)}
            tremor={recusa?.id === a.id ? recusa.n : undefined}
            onAlternar={() => onAlternar(a.id)}
            onEditar={() => onEditar(a.id)}
            onRemover={() => onRemover(a.id)}
          />
        ))}
        <button
          type="button"
          onClick={onNova}
          disabled={cheia}
          className="flex min-h-[7.5rem] min-w-[8.5rem] flex-[0_0_8.5rem] flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-tinta-suave/40 text-tinta-suave transition hover:border-lavanda hover:text-lavanda disabled:opacity-40"
        >
          <span className="font-display text-3xl leading-none font-extrabold">+</span>
          <span className="text-sm font-bold">{cheia ? `Limite de ${N_MAX}` : 'Nova atividade'}</span>
        </button>
      </div>
    </section>
  )
}
