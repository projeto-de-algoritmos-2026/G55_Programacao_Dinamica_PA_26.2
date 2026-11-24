import type { ReactNode } from 'react'

import type { Atividade, RespostaResolver } from '../types'
import { ReguaDeMinutos } from './ReguaDeMinutos'

interface Props {
  resposta: RespostaResolver
  atividades: Map<string, Atividade>
  /** A tentativa do jogador no momento da revelação (pode ser vazia). */
  tentativa: Atividade[]
  onJogarDeNovo: () => void
}

export const AVISO_PRIORIDADE =
  'A prioridade é definida por você. A soma não prevê aprendizado, e a lista não indica a ordem de estudo.'

function estrelas(voce: number, otimo: number): number {
  if (otimo === 0 || voce >= otimo) return 3
  const razao = voce / otimo
  if (razao >= 0.8) return 2
  if (razao >= 0.5) return 1
  return 0
}

/** A cena de revelação: estrelas, pódio Você × Guloso × PD e as três réguas. */
export function Revelacao({ resposta, atividades, tentativa, onJogarDeNovo }: Props) {
  const { pd, guloso, tempo_disponivel: capacidade } = resposta
  const jogou = tentativa.length > 0
  const voce = tentativa.reduce((s, a) => s + a.prioridade, 0)
  const otimo = pd.prioridade_total
  const nEstrelas = estrelas(voce, otimo)
  const lista = (ids: string[]) => ids.map((id) => atividades.get(id)).filter((a): a is Atividade => !!a)
  const primeiraDoGuloso = atividades.get(guloso.ordem_considerada[0] ?? '')

  let titulo: string
  if (!jogou) titulo = otimo === 0 ? 'Nenhuma atividade cabe nesse tempo.' : `O melhor plano soma ${otimo} pontos.`
  else if (voce >= otimo) titulo = 'Você achou o melhor plano possível.'
  else titulo = `Faltaram ${otimo - voce} ${otimo - voce === 1 ? 'ponto' : 'pontos'} para o ótimo.`

  const placar = [
    ...(jogou ? [{ nome: 'Você', valor: voce, cor: 'bg-girassol', texto: 'text-girassol' }] : []),
    { nome: 'Guloso', valor: guloso.prioridade_total, cor: 'bg-tomate', texto: 'text-tomate' },
    { nome: 'Plano ótimo', valor: otimo, cor: 'bg-menta', texto: 'text-menta' },
  ]
  const maior = Math.max(...placar.map((p) => p.valor), 1)

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {jogou && (
          <div className="flex gap-1" role="img" aria-label={`${nEstrelas} de 3 estrelas`}>
            {[0, 1, 2].map((k) => (
              <Estrela key={k} cheia={k < nEstrelas} atraso={200 + k * 160} />
            ))}
          </div>
        )}
        <h2 className="animate-surgir font-display text-3xl leading-tight font-extrabold text-giz [font-stretch:90%]">
          {titulo}
        </h2>
      </div>

      <div className="flex items-end justify-center gap-[4%] border-b-2 border-lousa-linha sm:gap-8" aria-label="Placar">
        {placar.map((p, k) => (
          <div key={p.nome} className="flex w-[30%] max-w-28 flex-col items-center gap-2">
            <span
              className={`animate-surgir font-display text-4xl font-extrabold tabular-nums ${p.texto}`}
              style={{ animationDelay: `${300 + k * 140}ms` }}
            >
              {p.valor}
            </span>
            <div
              className={`w-full origin-bottom animate-crescer rounded-t-xl ${p.cor}`}
              style={{ height: `${1.9 + (p.valor / maior) * 4}rem`, animationDelay: `${150 + k * 140}ms` }}
            >
              <span className="block pt-1.5 text-center text-xs font-bold text-breu">{p.nome}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {jogou && (
          <Linha titulo="Sua tentativa" detalhe={`${voce} pontos`}>
            <ReguaDeMinutos capacidade={capacidade} blocos={tentativa} rotulo="Sua tentativa" altura="baixa" atrasoEntrada={500} />
          </Linha>
        )}
        <Linha titulo="Guloso" detalhe={`${guloso.prioridade_total} pontos, sem garantia de ser o melhor`}>
          <ReguaDeMinutos
            capacidade={capacidade}
            blocos={lista(guloso.selecionadas)}
            rotulo="Plano do guloso"
            altura="baixa"
            destacarSobra
            atrasoEntrada={700}
          />
        </Linha>
        <Linha titulo="Plano ótimo (programação dinâmica)" detalhe={`${otimo} pontos, garantido`}>
          <ReguaDeMinutos
            capacidade={capacidade}
            blocos={lista(pd.selecionadas)}
            rotulo="Plano ótimo"
            atrasoEntrada={900}
          />
        </Linha>
      </div>

      {primeiraDoGuloso && guloso.prioridade_total < otimo && (
        <p className="max-w-prose text-giz/85">
          O guloso começou por <strong className="text-giz">{primeiraDoGuloso.nome}</strong>, a de melhor
          prioridade por minuto, e terminou com {guloso.tempo_restante} min sem uso. A programação dinâmica testa
          as combinações pela tabela e encontra uma que soma mais.
        </p>
      )}
      {guloso.prioridade_total === otimo && pd.selecionadas.length > 0 && (
        <p className="max-w-prose text-giz/85">
          Desta vez o guloso também chegou ao ótimo. Isso não vale sempre: troque o tempo ou as atividades e
          veja.
        </p>
      )}

      {lista(pd.descartadas).length > 0 && (
        <p className="text-sm text-giz/70">
          Ficaram de fora do plano ótimo: {lista(pd.descartadas).map((a) => a.nome).join(', ')}.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-lousa-linha pt-5">
        <p className="max-w-md text-xs text-giz/60">{AVISO_PRIORIDADE}</p>
        <button
          type="button"
          onClick={onJogarDeNovo}
          className="rounded-2xl border-2 border-giz px-5 py-2.5 font-bold text-giz hover:bg-giz hover:text-lousa"
        >
          Jogar de novo
        </button>
      </div>
    </div>
  )
}

function Linha({ titulo, detalhe, children }: { titulo: string; detalhe: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-giz">
        <span className="font-bold">{titulo}</span>
        <span className="text-sm text-giz/65">{detalhe}</span>
      </p>
      {children}
    </div>
  )
}

function Estrela({ cheia, atraso }: { cheia: boolean; atraso: number }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cheia ? 'animate-estrela' : ''}
      style={{ animationDelay: `${atraso}ms` }}
    >
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
        fill={cheia ? 'var(--color-girassol)' : 'transparent'}
        stroke={cheia ? 'var(--color-girassol-funda)' : 'rgb(255 255 255 / 0.3)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
