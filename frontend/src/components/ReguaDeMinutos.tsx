import { useCor } from '../cores'
import type { Atividade } from '../types'

interface Props {
  capacidade: number
  blocos: Atividade[]
  /** Nome acessível da régua, por exemplo "Seu plano". */
  rotulo: string
  /** Hachura a sobra em Tomate (tempo que ficou sem uso). */
  destacarSobra?: boolean
  /** Atraso em ms para animar os blocos entrando um a um (revelação). */
  atrasoEntrada?: number
  /** Chave que muda a cada tentativa recusada, para reiniciar o tremor. */
  tremor?: number
  altura?: 'alta' | 'baixa'
  onTirar?: (id: string) => void
}

function marcas(capacidade: number): number[] {
  if (capacidade <= 0) return [0]
  const passos = capacidade <= 12 ? capacidade : 4
  const lista = Array.from({ length: passos + 1 }, (_, k) => Math.round((capacidade * k) / passos))
  return [...new Set(lista)]
}

/** O tempo disponível como uma régua; cada atividade ocupa a largura da sua duração. */
export function ReguaDeMinutos({
  capacidade,
  blocos,
  rotulo,
  destacarSobra,
  atrasoEntrada,
  tremor,
  altura = 'alta',
  onTirar,
}: Props) {
  const cor = useCor()
  const usado = blocos.reduce((soma, b) => soma + b.duracao, 0)
  const sobra = Math.max(capacidade - usado, 0)
  const alto = altura === 'alta' ? 'h-16' : 'h-11'

  if (capacidade <= 0) {
    return (
      <div className={`${alto} flex items-center rounded-2xl bg-lousa-clara px-4 text-sm text-giz/70`}>
        Com 0 minutos nenhuma atividade cabe.
      </div>
    )
  }

  return (
    <figure aria-label={`${rotulo}: ${usado} de ${capacidade} minutos ocupados`} className="m-0">
      <div
        key={tremor}
        className={`${alto} flex overflow-hidden rounded-2xl bg-lousa-clara ring-2 ring-lousa-linha ${
          tremor ? 'animate-tremor' : ''
        }`}
      >
        {blocos.map((b, k) => {
          const c = cor(b.disciplina)
          const largura = (b.duracao / capacidade) * 100
          const conteudo = (
            <>
              <span className="truncate text-[13px] leading-tight font-bold">{b.nome}</span>
              <span className="text-xs leading-tight tabular-nums opacity-80">
                {b.duracao} min, +{b.prioridade}
              </span>
            </>
          )
          const estilo = {
            width: `${largura}%`,
            background: c.fundo,
            color: c.texto,
            borderBottomColor: c.borda,
            animationDelay: atrasoEntrada !== undefined ? `${atrasoEntrada + k * 180}ms` : undefined,
          }
          const classe = `peca flex min-w-0 flex-col justify-center border-r-2 border-r-lousa px-2 text-left ${
            atrasoEntrada !== undefined ? 'animate-surgir' : 'animate-encaixe'
          }`
          return onTirar ? (
            <button
              key={b.id}
              type="button"
              onClick={() => onTirar(b.id)}
              title={`Tirar ${b.nome} da régua`}
              className={`${classe} cursor-pointer hover:brightness-95`}
              style={estilo}
            >
              {largura > 9 ? conteudo : <span className="text-xs font-bold">+{b.prioridade}</span>}
            </button>
          ) : (
            <div key={b.id} className={classe} style={estilo} title={`${b.nome}: ${b.duracao} min`}>
              {largura > 9 ? conteudo : <span className="text-xs font-bold">+{b.prioridade}</span>}
            </div>
          )
        })}
        {sobra > 0 && (
          <div
            className={`flex flex-1 items-center justify-center text-xs ${
              destacarSobra ? 'sobra-hachurada font-bold text-giz' : 'text-giz/45'
            }`}
          >
            {(sobra / capacidade) * 100 > 12 && (
              <span className="rounded bg-lousa/70 px-1.5 py-0.5">{sobra} min livres</span>
            )}
          </div>
        )}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-giz/60 tabular-nums" aria-hidden="true">
        {marcas(capacidade).map((m) => (
          <span
            key={m}
            className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
            style={{ left: `${(m / capacidade) * 100}%` }}
          >
            {m}
          </span>
        ))}
      </div>
    </figure>
  )
}
