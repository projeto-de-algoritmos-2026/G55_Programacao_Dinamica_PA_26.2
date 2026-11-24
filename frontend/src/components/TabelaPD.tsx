import { useEffect, useState } from 'react'

import { N_TABELA, T_TABELA } from '../limites'
import type { Atividade, PassoReconstrucao, RespostaTabela } from '../types'

interface Props {
  dados: RespostaTabela
  atividades: Map<string, Atividade>
}

export const MENSAGEM_FORA_DO_LIMITE = `A tabela didática só é exibida para até ${N_TABELA} atividades e ${T_TABELA} minutos.`

const chave = (i: number, t: number) => `${i},${t}`

/** Células (i, t) visitadas pela reconstrução, incluindo a parada na linha 0. */
function caminho(passos: PassoReconstrucao[], duracoes: number[], capacidade: number): Set<string> {
  const celulas = new Set<string>()
  let t = capacidade
  for (const passo of passos) {
    celulas.add(chave(passo.i, passo.t))
    if (passo.decisao === 'incluir') t = passo.t - duracoes[passo.i - 1]
  }
  celulas.add(chave(0, t))
  return celulas
}

export function TabelaPD({ dados, atividades }: Props) {
  const { tabela, passos, capacidade, ordem_atividades } = dados
  const [atual, setAtual] = useState(0)

  // ← e → percorrem os passos, exceto quando o foco está num campo de texto.
  useEffect(() => {
    function tecla(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement
      if (alvo.closest('input, textarea, select, dialog[open]')) return
      if (evento.key === 'ArrowRight') setAtual((k) => Math.min(k + 1, passos.length - 1))
      if (evento.key === 'ArrowLeft') setAtual((k) => Math.max(k - 1, 0))
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [passos.length])

  const linhas = ordem_atividades.map((id) => atividades.get(id))
  const duracoes = linhas.map((a) => a?.duracao ?? 0)
  const prioridades = linhas.map((a) => a?.prioridade ?? 0)
  const noCaminho = caminho(passos, duracoes, capacidade)

  const passo = passos[atual] as PassoReconstrucao | undefined
  const d = passo ? duracoes[passo.i - 1] : 0
  const celulaAtual = passo ? chave(passo.i, passo.t) : ''
  const celulaSem = passo ? chave(passo.i - 1, passo.t) : ''
  const celulaCom = passo && passo.valor_com !== null ? chave(passo.i - 1, passo.t - d) : ''

  function classe(i: number, t: number): string {
    const k = chave(i, t)
    if (k === celulaAtual) return 'animate-pulso bg-girassol font-extrabold text-breu rounded-md'
    if (k === celulaSem) return 'bg-lavanda/30 font-bold text-giz rounded-md ring-2 ring-inset ring-lavanda'
    if (k === celulaCom) return 'bg-menta/30 font-bold text-giz rounded-md ring-2 ring-inset ring-menta'
    if (noCaminho.has(k)) return 'bg-giz/15 font-bold text-giz rounded-md'
    return tabela[i][t] === 0 ? 'text-giz/25' : 'text-giz/80'
  }

  const colunas = Array.from({ length: capacidade + 1 }, (_, t) => t)

  return (
    <section aria-label="Tabela da programação dinâmica" className="space-y-5">
      <div className="max-w-prose space-y-2">
        <h3 className="font-display text-2xl font-extrabold">Como a programação dinâmica decidiu</h3>
        <p className="text-tinta-suave">
          Cada célula <strong>OPT[i][t]</strong> guarda a maior soma de prioridades usando só as atividades 1 a i
          em até t minutos. A tabela é preenchida linha por linha; a resposta fica no canto,{' '}
          <strong>
            OPT[{ordem_atividades.length}][{capacidade}] = {dados.prioridade_total}
          </strong>
          . Depois, a reconstrução sobe da última linha até a primeira para descobrir quais atividades entraram.
        </p>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-lousa p-3 sm:p-4">
        <table className="border-separate border-spacing-0.5 text-sm tabular-nums">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-lousa px-2 py-1 text-left text-xs font-normal text-giz/60">
                atividade \ minutos
              </th>
              {colunas.map((t) => (
                <th key={t} className="min-w-8 px-1 py-1 text-center text-xs font-normal text-giz/60">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.map((linha, i) => {
              const a = i === 0 ? undefined : linhas[i - 1]
              const ativa = passo?.i === i
              return (
                <tr key={i}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 max-w-56 bg-lousa px-2 py-1.5 text-left font-normal whitespace-nowrap ${
                      ativa ? 'text-girassol' : 'text-giz/85'
                    }`}
                  >
                    <span className="mr-1.5 font-display font-extrabold">{i}</span>
                    {i === 0 ? (
                      <span className="text-giz/50">nenhuma</span>
                    ) : (
                      <span title={a?.nome}>
                        <span className="inline-block max-w-36 truncate align-bottom">{a?.nome}</span>{' '}
                        <span className="text-xs text-giz/55">
                          {duracoes[i - 1]} min, p {prioridades[i - 1]}
                        </span>
                      </span>
                    )}
                  </th>
                  {linha.map((valor, t) => (
                    <td key={t} className={`px-1 py-1.5 text-center ${classe(i, t)}`}>
                      {valor}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-tinta-suave">
        <Legenda cor="bg-girassol" texto="posição atual da reconstrução" />
        <Legenda cor="bg-lavanda" texto="sem a atividade: OPT[i-1][t]" />
        <Legenda cor="bg-menta" texto="com a atividade: OPT[i-1][t-d]" />
        <Legenda cor="bg-giz/30" texto="caminho percorrido" />
      </ul>

      {passo ? (
        <div className="space-y-4 rounded-3xl border-2 border-lousa-linha bg-superficie p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-xl font-extrabold">
              Passo {atual + 1} de {passos.length}
            </p>
            <div className="flex gap-2">
              <BotaoPasso onClick={() => setAtual((k) => k - 1)} disabled={atual === 0}>
                Anterior
              </BotaoPasso>
              <BotaoPasso onClick={() => setAtual((k) => k + 1)} disabled={atual === passos.length - 1}>
                Próximo
              </BotaoPasso>
            </div>
          </div>

          <ol className="flex gap-1.5" aria-label="Passos da reconstrução">
            {passos.map((p, k) => (
              <li key={p.i} className="flex-1">
                <button
                  type="button"
                  onClick={() => setAtual(k)}
                  aria-current={k === atual ? 'step' : undefined}
                  aria-label={`Passo ${k + 1}: ${p.decisao === 'incluir' ? 'inclui' : 'descarta'} a atividade ${p.i}`}
                  className={`h-2.5 w-full rounded-full ${
                    k === atual
                      ? 'bg-girassol'
                      : k < atual
                        ? p.decisao === 'incluir'
                          ? 'bg-menta'
                          : 'bg-tinta-suave/40'
                        : 'bg-papel-funda'
                  }`}
                />
              </li>
            ))}
          </ol>

          <DescricaoPasso
            passo={passo}
            nome={linhas[passo.i - 1]?.nome ?? passo.atividade_id}
            d={d}
            p={prioridades[passo.i - 1]}
            valorAtual={tabela[passo.i][passo.t]}
          />
          <p className="text-xs text-tinta-suave">Dica: use as setas ← e → do teclado.</p>
        </div>
      ) : (
        <p className="text-tinta-suave">Sem atividades, não há passos de reconstrução.</p>
      )}
    </section>
  )
}

function DescricaoPasso({
  passo,
  nome,
  d,
  p,
  valorAtual,
}: {
  passo: PassoReconstrucao
  nome: string
  d: number
  p: number
  valorAtual: number
}) {
  const { i, t, valor_sem, valor_com, decisao } = passo
  const incluir = decisao === 'incluir'

  return (
    <div className="space-y-3">
      <p>
        Na linha {i}, com {t} min: <strong>{nome}</strong> ({d} min, prioridade {p}).
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-lavanda bg-lavanda/15 px-3 py-2">
          <p className="text-sm text-tinta-suave">Sem ela</p>
          <p className="font-bold tabular-nums">
            OPT[{i - 1}][{t}] = {valor_sem}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-menta bg-menta/15 px-3 py-2">
          <p className="text-sm text-tinta-suave">Com ela</p>
          <p className="font-bold tabular-nums">
            {valor_com === null ? (
              <>
                não cabe ({d} min &gt; {t} min)
              </>
            ) : (
              <>
                {p} + OPT[{i - 1}][{t - d}] = {valor_com}
              </>
            )}
          </p>
        </div>
      </div>
      <p
        key={`${i}-${t}`}
        className={`animate-surgir rounded-2xl px-4 py-3 font-bold ${
          incluir ? 'bg-menta text-giz' : 'bg-papel text-tinta'
        }`}
      >
        {incluir && (
          <>
            OPT[{i}][{t}] = {valorAtual} é diferente de OPT[{i - 1}][{t}] = {valor_sem}, então {nome} entra. Sobram{' '}
            {t - d} min.
          </>
        )}
        {!incluir && valor_com === null && (
          <>
            {nome} não cabe em {t} min, então fica de fora. Continuam {t} min.
          </>
        )}
        {!incluir && valor_com !== null && (
          <>
            OPT[{i}][{t}] = {valorAtual} é igual a OPT[{i - 1}][{t}], então {nome} fica de fora. Continuam {t} min.
            {valor_com === valor_sem && ' Houve empate; a regra fica com as atividades que aparecem antes na lista.'}
          </>
        )}
      </p>
    </div>
  )
}

function BotaoPasso({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-lousa-clara px-4 py-2 font-bold text-giz shadow-[0_4px_0_#0a0b26] active:translate-y-1 active:shadow-none disabled:bg-papel-funda disabled:text-tinta-suave disabled:shadow-none"
    >
      {children}
    </button>
  )
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`inline-block h-3.5 w-3.5 rounded ${cor}`} />
      {texto}
    </li>
  )
}
