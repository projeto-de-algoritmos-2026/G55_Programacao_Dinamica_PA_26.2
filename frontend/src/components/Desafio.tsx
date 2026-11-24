import type { Atividade, Exemplo } from '../types'
import { ReguaDeMinutos } from './ReguaDeMinutos'

export interface Recusa {
  /** Muda a cada recusa, para reiniciar a animação. */
  n: number
  mensagem: string
}

interface Props {
  capacidade: number | null
  escolhidas: Atividade[]
  semAtividades: boolean
  exemplos: Exemplo[]
  recusa: Recusa | null
  aviso: string | null
  erro: string | null
  carregando: boolean
  onTirar: (id: string) => void
  onRevelar: () => void
  onCarregarExemplo: (exemplo: Exemplo) => void
}

/** A Lousa antes da revelação: a régua do jogador, o placar ao vivo e o botão de revelar. */
export function Desafio(props: Props) {
  const { capacidade, escolhidas, semAtividades, recusa, aviso, erro, carregando } = props
  const pontos = escolhidas.reduce((s, a) => s + a.prioridade, 0)
  const usado = escolhidas.reduce((s, a) => s + a.duracao, 0)

  if (semAtividades) {
    return (
      <div className="space-y-5">
        <h2 className="font-display text-3xl leading-tight font-extrabold text-giz [font-stretch:90%]">
          Sua tarde não cabe tudo. Escolha o que entra.
        </h2>
        <p className="max-w-prose text-giz/80">
          Cada atividade tem uma duração e uma prioridade que você define. O objetivo é somar o máximo de
          prioridade sem passar do tempo. Monte sua tentativa e depois compare com o plano ótimo.
        </p>
        {props.exemplos.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold text-giz">Comece por um desafio pronto:</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {props.exemplos.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => props.onCarregarExemplo(e)}
                  className="rounded-2xl border-2 border-lousa-linha bg-lousa-clara p-3 text-left text-giz transition hover:-translate-y-0.5 hover:border-girassol"
                >
                  <span className="block font-display text-lg font-bold">{e.nome}</span>
                  <span className="mt-1 block text-xs text-giz/70">
                    {e.atividades.length} atividades em {e.tempo_disponivel} min
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-giz/60">Ou crie suas próprias atividades na mesa.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-giz [font-stretch:90%]">Sua tentativa</h2>
          <p className="text-sm text-giz/70">
            Toque nas atividades da mesa para colocá-las na régua. Toque na régua para tirar.
          </p>
        </div>
        <div className="flex gap-5 text-giz">
          <Contador valor={pontos} rotulo="pontos" destaque />
          <Contador valor={usado} rotulo={capacidade !== null ? `de ${capacidade} min` : 'min'} />
        </div>
      </div>

      {aviso && (
        <p className="rounded-xl bg-girassol/15 px-3 py-2 text-sm font-bold text-girassol">{aviso}</p>
      )}

      {capacidade === null ? (
        <div className="flex h-16 items-center rounded-2xl border-2 border-dashed border-lousa-linha px-4 text-giz/70">
          Informe quanto tempo você tem para montar a régua.
        </div>
      ) : (
        <ReguaDeMinutos
          capacidade={capacidade}
          blocos={escolhidas}
          rotulo="Sua tentativa"
          tremor={recusa?.n}
          onTirar={props.onTirar}
        />
      )}

      <p className="min-h-6 text-sm font-bold text-tomate" role="status" aria-live="polite">
        {recusa?.mensagem}
      </p>

      {erro && (
        <p className="rounded-xl bg-tomate px-3 py-2 font-bold text-giz" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={props.onRevelar}
        disabled={carregando}
        className="w-full rounded-2xl bg-girassol px-6 py-4 font-display text-xl font-extrabold text-breu shadow-[0_5px_0_var(--color-girassol-funda)] transition active:translate-y-[5px] active:shadow-none disabled:opacity-60 sm:w-auto"
      >
        {carregando ? 'Calculando…' : escolhidas.length === 0 ? 'Ver o plano ótimo' : 'Comparar com o plano ótimo'}
      </button>
    </div>
  )
}

function Contador({ valor, rotulo, destaque }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <p className="text-right leading-none">
      <span
        key={valor}
        className={`inline-block font-display text-5xl font-extrabold tabular-nums [font-stretch:80%] ${
          destaque ? 'animate-pulso text-girassol' : ''
        }`}
      >
        {valor}
      </span>
      <span className="mt-1 block text-xs text-giz/70">{rotulo}</span>
    </p>
  )
}
