import { nomeDisciplina, useCor } from '../cores'
import type { Atividade, RespostaResolver } from '../types'

interface Props {
  resposta: RespostaResolver
  atividades: Map<string, Atividade>
}

/** Cada atividade na ordem do guloso, com o tempo que restava quando ele a examinou. */
function filaDoGuloso(resposta: RespostaResolver, atividades: Map<string, Atividade>) {
  const fila: { a: Atividade; antes: number; entrou: boolean }[] = []
  let restante = resposta.tempo_disponivel
  for (const id of resposta.guloso.ordem_considerada) {
    const a = atividades.get(id)
    if (!a) continue
    const entrou = resposta.guloso.selecionadas.includes(id)
    fila.push({ a, antes: restante, entrou })
    if (entrou) restante -= a.duracao
  }
  return fila
}

/** A fila de decisões do guloso: em que ordem olhou as atividades e por que cada uma entrou ou ficou de fora. */
export function ComparacaoGuloso({ resposta, atividades }: Props) {
  const cor = useCor()
  const { guloso, pd, comparacao } = resposta

  const fila = filaDoGuloso(resposta, atividades)

  return (
    <section aria-label="Comparação com o guloso" className="space-y-5">
      <div className="max-w-prose space-y-2">
        <h3 className="font-display text-2xl font-extrabold">A estratégia do guloso</h3>
        <p className="text-tinta-suave">
          Ordena as atividades por prioridade por minuto e vai colocando na régua cada uma que ainda cabe. É rápido
          e parece sensato, mas é uma heurística sem garantia de otimalidade.
        </p>
        <p className="font-bold">
          {comparacao.guloso_atingiu_otimo
            ? `Aqui ele empatou com a programação dinâmica: ${guloso.prioridade_total} pontos. Em outras instâncias pode perder.`
            : `Resultado: ${guloso.prioridade_total} pontos, contra ${pd.prioridade_total} do plano ótimo. Ficou ${comparacao.diferenca_prioridade} ${comparacao.diferenca_prioridade === 1 ? 'ponto' : 'pontos'} atrás.`}
        </p>
      </div>

      {fila.length === 0 ? (
        <p className="text-tinta-suave">Não há atividades para comparar.</p>
      ) : (
        <ol className="space-y-2">
          {fila.map(({ a, antes, entrou }, k) => {
            const c = cor(a.disciplina)
            return (
              <li
                key={a.id}
                className="flex animate-surgir items-center gap-3"
                style={{ animationDelay: `${k * 90}ms` }}
              >
                <span className="w-7 shrink-0 text-right font-display text-lg font-extrabold text-tinta-suave">
                  {k + 1}
                </span>
                <div
                  className={`peca flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] border-2 px-3 py-2 ${
                    entrou ? '' : 'opacity-50 saturate-50'
                  }`}
                  style={{ background: c.fundo, color: c.texto, borderColor: c.borda }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{a.nome}</span>
                    <span className="text-xs opacity-80">{nomeDisciplina(a.disciplina)}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    {a.prioridade} {a.prioridade === 1 ? 'ponto' : 'pontos'} em {a.duracao} min, {(a.prioridade / a.duracao).toFixed(2).replace('.', ',')} por min
                  </span>
                </div>
                <span
                  className={`w-36 shrink-0 text-sm font-bold ${entrou ? 'text-menta' : 'text-tomate'}`}
                >
                  {entrou ? `Entrou (havia ${antes} min)` : `Pulada: só havia ${antes} min`}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <p className="max-w-prose text-sm text-tinta-suave">
        A razão aparece aqui só para explicar a ordem; o algoritmo compara com inteiros. Escolher sempre a melhor
        razão pode deixar uma sobra em que nada mais cabe, e é aí que a programação dinâmica ganha.
      </p>
    </section>
  )
}
