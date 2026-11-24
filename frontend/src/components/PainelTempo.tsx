import { T_MAX } from '../limites'

interface Props {
  valor: string
  erro: string | null
  onMudar: (valor: string) => void
}

const ATALHOS = [
  { minutos: 10, rotulo: '10 min' },
  { minutos: 30, rotulo: '30 min' },
  { minutos: 60, rotulo: '1 h' },
  { minutos: 120, rotulo: '2 h' },
  { minutos: 180, rotulo: '3 h' },
]

export function PainelTempo({ valor, erro, onMudar }: Props) {
  return (
    <section aria-labelledby="titulo-tempo" className="space-y-3">
      <h2 id="titulo-tempo" className="font-display text-2xl font-extrabold">
        Quanto tempo você tem?
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-baseline gap-2 rounded-2xl border-2 border-lousa-linha bg-superficie px-4 py-1.5 focus-within:outline-3 focus-within:outline-girassol">
          <span className="sr-only">Tempo disponível em minutos</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={T_MAX}
            step={1}
            value={valor}
            onChange={(e) => onMudar(e.target.value)}
            placeholder="0"
            className="w-24 bg-transparent font-display text-4xl font-extrabold tabular-nums outline-none [font-stretch:85%]"
          />
          <span className="font-bold text-tinta-suave">min</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ATALHOS.map(({ minutos, rotulo }) => (
            <button
              key={minutos}
              type="button"
              onClick={() => onMudar(String(minutos))}
              className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${
                valor === String(minutos)
                  ? 'border-girassol bg-girassol text-breu'
                  : 'border-papel-funda bg-superficie text-tinta-suave hover:border-lavanda'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>
      {erro && <p className="text-sm font-bold text-tomate">{erro}</p>}
    </section>
  )
}
