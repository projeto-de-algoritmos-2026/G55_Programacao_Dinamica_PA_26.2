import { useState } from 'react'

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
    if (k === celulaAtual) return 'bg-yellow-200 font-bold ring-2 ring-yellow-500 ring-inset'
    if (k === celulaSem) return 'bg-sky-200 font-semibold ring-2 ring-sky-500 ring-inset'
    if (k === celulaCom) return 'bg-emerald-200 font-semibold ring-2 ring-emerald-500 ring-inset'
    if (noCaminho.has(k)) return 'bg-violet-100 font-semibold text-violet-900'
    return tabela[i][t] === 0 ? 'text-slate-300' : 'text-slate-700'
  }

  const colunas = Array.from({ length: capacidade + 1 }, (_, t) => t)

  return (
    <section aria-label="Tabela da programação dinâmica" className="space-y-4">
      <p className="text-sm text-slate-600">
        <code className="rounded bg-slate-100 px-1">OPT[i][t]</code> é a maior soma de prioridades usando só as
        atividades 1..i em até t minutos. Resposta:{' '}
        <code className="rounded bg-slate-100 px-1">
          OPT[{ordem_atividades.length}][{capacidade}] = {dados.prioridade_total}
        </code>
        .
      </p>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="border-collapse text-xs tabular-nums">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-2 py-1 text-left font-medium text-slate-500">
                i \ t
              </th>
              {colunas.map((t) => (
                <th key={t} className="min-w-7 px-1 py-1 text-center font-medium text-slate-500">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.map((linha, i) => {
              const a = i === 0 ? undefined : linhas[i - 1]
              return (
                <tr key={i} className="border-t border-slate-100">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-56 bg-white px-2 py-1 text-left font-normal whitespace-nowrap"
                  >
                    <span className="mr-1 font-semibold text-slate-700">{i}</span>
                    {i === 0 ? (
                      <span className="text-slate-400">nenhuma</span>
                    ) : (
                      <span className="text-slate-600" title={a?.nome}>
                        <span className="inline-block max-w-36 truncate align-bottom">{a?.nome}</span>{' '}
                        <span className="text-slate-400">
                          (d={duracoes[i - 1]}, p={prioridades[i - 1]})
                        </span>
                      </span>
                    )}
                  </th>
                  {linha.map((valor, t) => (
                    <td key={t} className={`px-1 py-1 text-center ${classe(i, t)}`}>
                      {valor}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Legenda />

      {passo ? (
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-800">
              Reconstrução · passo {atual + 1} de {passos.length}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAtual((k) => k - 1)}
                disabled={atual === 0}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setAtual((k) => k + 1)}
                disabled={atual === passos.length - 1}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          </div>
          <DescricaoPasso
            passo={passo}
            nome={linhas[passo.i - 1]?.nome ?? passo.atividade_id}
            d={d}
            p={prioridades[passo.i - 1]}
            valorAtual={tabela[passo.i][passo.t]}
          />
          <ol className="flex flex-wrap gap-1.5 text-xs">
            {passos.map((p, k) => (
              <li key={p.i}>
                <button
                  type="button"
                  onClick={() => setAtual(k)}
                  className={`rounded border px-2 py-0.5 ${
                    k === atual ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  i={p.i}: {p.decisao === 'incluir' ? 'inclui' : 'descarta'}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sem atividades, não há passos de reconstrução.</p>
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
    <div className="space-y-1.5 text-sm">
      <p>
        Posição <code className="rounded bg-yellow-100 px-1">({i}, {t})</code>: atividade {i},{' '}
        <strong>{nome}</strong> (d = {d}, p = {p}), com {t} min disponíveis.
      </p>
      <ul className="space-y-0.5 pl-4 text-slate-700">
        <li>
          <span className="rounded bg-sky-100 px-1">Sem</span> a atividade:{' '}
          <code>OPT[{i - 1}][{t}] = {valor_sem}</code>
        </li>
        <li>
          <span className="rounded bg-emerald-100 px-1">Com</span> a atividade:{' '}
          {valor_com === null ? (
            <span>
              não cabe ({d} &gt; {t})
            </span>
          ) : (
            <code>
              {p} + OPT[{i - 1}][{t - d}] = {valor_com}
            </code>
          )}
        </li>
      </ul>
      <p
        className={`rounded-md px-3 py-2 font-medium ${
          incluir ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {incluir && (
          <>
            OPT[{i}][{t}] = {valorAtual} ≠ OPT[{i - 1}][{t}] = {valor_sem} → <strong>inclui</strong> {nome}; t passa a{' '}
            {t - d}.
          </>
        )}
        {!incluir && valor_com === null && (
          <>
            Não cabe ({d} &gt; {t}) → <strong>descarta</strong> {nome}; t continua {t}.
          </>
        )}
        {!incluir && valor_com !== null && (
          <>
            OPT[{i}][{t}] = {valorAtual} = OPT[{i - 1}][{t}] → <strong>descarta</strong> {nome}; t continua {t}.
            {valor_com === valor_sem && ' (Empate: a regra fica com as atividades que aparecem antes na lista.)'}
          </>
        )}
      </p>
    </div>
  )
}

function Legenda() {
  const itens = [
    ['bg-yellow-200 ring-2 ring-yellow-500', 'célula do passo atual'],
    ['bg-sky-200 ring-2 ring-sky-500', 'sem a atividade: OPT[i-1][t]'],
    ['bg-emerald-200 ring-2 ring-emerald-500', 'com a atividade: OPT[i-1][t-d]'],
    ['bg-violet-100', 'caminho da reconstrução'],
  ]
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {itens.map(([cor, texto]) => (
        <li key={texto} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm ring-inset ${cor}`} />
          {texto}
        </li>
      ))}
    </ul>
  )
}
