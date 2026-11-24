import { useEffect, useMemo, useState } from 'react'

import { ComparacaoGuloso } from './components/ComparacaoGuloso'
import { FormularioAtividade } from './components/FormularioAtividade'
import { ListaAtividades } from './components/ListaAtividades'
import { PainelResultado } from './components/PainelResultado'
import { MENSAGEM_FORA_DO_LIMITE, TabelaPD } from './components/TabelaPD'
import { N_MAX, T_MAX } from './limites'
import { api, ErroDaApi } from './services/api'
import type { Atividade, Exemplo, RequisicaoPlano, RespostaResolver, RespostaTabela } from './types'
import { novoId, validarTempo } from './validacao'

type EstadoApi = { tipo: 'carregando' } | { tipo: 'ok' } | { tipo: 'erro' }

type Aba = 'guloso' | 'tabela'

/** Resultado de um "Planejar", junto com a entrada que o gerou. */
interface Plano {
  requisicao: RequisicaoPlano
  assinatura: string
  atividades: Map<string, Atividade>
  resposta: RespostaResolver
  tabela: RespostaTabela | null
  erroTabela: string | null
}

const assinar = (requisicao: RequisicaoPlano) => JSON.stringify(requisicao)

function mensagem(erro: unknown): string {
  return erro instanceof ErroDaApi ? erro.message : 'Ocorreu um erro inesperado.'
}

function App() {
  const [statusApi, setStatusApi] = useState<EstadoApi>({ tipo: 'carregando' })
  const [exemplos, setExemplos] = useState<Exemplo[]>([])
  const [erroExemplos, setErroExemplos] = useState<string | null>(null)
  const [exemploPendente, setExemploPendente] = useState<Exemplo | null>(null)

  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [tempoTexto, setTempoTexto] = useState('')
  const [erroTempo, setErroTempo] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const [plano, setPlano] = useState<Plano | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<Aba>('guloso')

  useEffect(() => {
    api
      .saude()
      .then(() => setStatusApi({ tipo: 'ok' }))
      .catch(() => setStatusApi({ tipo: 'erro' }))
    api
      .listarExemplos()
      .then(setExemplos)
      .catch((e: unknown) => setErroExemplos(mensagem(e)))
  }, [])

  const editando = atividades.find((a) => a.id === editandoId)
  const tempoAtual = validarTempo(tempoTexto)
  const assinaturaAtual = useMemo(
    () => (typeof tempoAtual === 'number' ? assinar({ tempo_disponivel: tempoAtual, atividades }) : null),
    [tempoAtual, atividades],
  )
  const desatualizado = plano !== null && plano.assinatura !== assinaturaAtual

  // --- Atividades ---------------------------------------------------------

  function salvar(dados: Omit<Atividade, 'id'>) {
    if (editando) {
      setAtividades((lista) => lista.map((a) => (a.id === editando.id ? { ...a, ...dados } : a)))
      setEditandoId(null)
    } else {
      setAtividades((lista) => [...lista, { id: novoId(), ...dados }])
    }
  }

  function remover(id: string) {
    setAtividades((lista) => lista.filter((a) => a.id !== id))
    if (editandoId === id) setEditandoId(null)
  }

  function pedirExemplo(id: string) {
    const exemplo = exemplos.find((e) => e.id === id)
    if (!exemplo) return
    if (atividades.length === 0) carregarExemplo(exemplo)
    else setExemploPendente(exemplo)
  }

  function carregarExemplo(exemplo: Exemplo) {
    setAtividades(exemplo.atividades.map((a) => ({ ...a })))
    setTempoTexto(String(exemplo.tempo_disponivel))
    setErroTempo(null)
    setEditandoId(null)
    setExemploPendente(null)
    setPlano(null)
    setErro(null)
  }

  // --- Planejar -----------------------------------------------------------

  async function planejar() {
    const tempo = validarTempo(tempoTexto)
    if (typeof tempo === 'string') {
      setErroTempo(tempo)
      return
    }
    setErroTempo(null)
    if (atividades.length > N_MAX) {
      setErro(`A lista aceita no máximo ${N_MAX} atividades.`)
      return
    }

    const requisicao: RequisicaoPlano = { tempo_disponivel: tempo, atividades }
    setCarregando(true)
    setErro(null)
    try {
      const resposta = await api.resolver(requisicao)
      let tabela: RespostaTabela | null = null
      let erroTabela: string | null = null
      if (resposta.tabela_disponivel) {
        try {
          tabela = await api.tabela(requisicao)
        } catch (e) {
          erroTabela = mensagem(e)
        }
      }
      setPlano({
        requisicao,
        assinatura: assinar(requisicao),
        atividades: new Map(atividades.map((a) => [a.id, a])),
        resposta,
        tabela,
        erroTabela,
      })
    } catch (e) {
      setErro(mensagem(e))
    } finally {
      setCarregando(false)
    }
  }

  // --- Tela ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <h1 className="text-2xl font-bold">EstudaPlan</h1>
            <p className="text-sm text-slate-500">
              Escolha das atividades de estudo que cabem no seu tempo, por Mochila 0/1 com programação dinâmica.
            </p>
          </div>
          <StatusApi estado={statusApi} />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
        {/* 1. Entrada */}
        <section aria-label="Entrada" className="space-y-5">
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Carregar exemplo</span>
              <select
                value=""
                onChange={(e) => pedirExemplo(e.target.value)}
                disabled={exemplos.length === 0}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="" disabled>
                  {exemplos.length === 0 ? 'Nenhum exemplo disponível' : 'Escolha um exemplo…'}
                </option>
                {exemplos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </label>
            {erroExemplos && <p className="text-xs text-red-600">{erroExemplos}</p>}
            {exemploPendente && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm" role="alert">
                <p>
                  Substituir a lista atual pelo exemplo <strong>{exemploPendente.nome}</strong>?
                </p>
                <p className="mt-1 text-xs text-slate-600">{exemploPendente.descricao}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => carregarExemplo(exemploPendente)}
                    className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Sim, substituir
                  </button>
                  <button
                    type="button"
                    onClick={() => setExemploPendente(null)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100"
                  >
                    Não
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Tempo disponível (min)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={T_MAX}
                step={1}
                value={tempoTexto}
                onChange={(e) => {
                  setTempoTexto(e.target.value)
                  setErroTempo(null)
                }}
                placeholder="Ex.: 180"
                className={`w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 ${
                  erroTempo ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-sky-300'
                }`}
              />
              {erroTempo && <span className="mt-1 block text-xs text-red-600">{erroTempo}</span>}
            </label>

            <ListaAtividades
              atividades={atividades}
              editandoId={editandoId}
              onEditar={setEditandoId}
              onRemover={remover}
            />

            <div className="border-t border-slate-200 pt-4">
              <FormularioAtividade
                key={editandoId ?? 'nova'}
                editando={editando}
                desabilitado={!editando && atividades.length >= N_MAX}
                onSalvar={salvar}
                onCancelar={() => setEditandoId(null)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={planejar}
            disabled={carregando}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {carregando ? 'Planejando…' : 'Planejar'}
          </button>
        </section>

        {/* 2. Resultado e 3. Abas */}
        <section aria-label="Resultado" className="min-w-0 space-y-5">
          {erro && (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {erro}
            </p>
          )}

          {!plano && !erro && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              {carregando
                ? 'Calculando o plano…'
                : 'Cadastre atividades (ou carregue um exemplo), informe o tempo disponível e clique em Planejar.'}
            </div>
          )}

          {plano && (
            <>
              {desatualizado && (
                <p className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                  A lista ou o tempo mudou; clique em <strong>Planejar</strong> para recalcular. O resultado abaixo
                  é do cálculo anterior.
                </p>
              )}
              <div className={`rounded-lg border border-slate-200 bg-white p-4 ${desatualizado ? 'opacity-60' : ''}`}>
                <PainelResultado
                  resultado={plano.resposta.pd}
                  tempoDisponivel={plano.resposta.tempo_disponivel}
                  atividades={plano.atividades}
                />
              </div>

              <div className={`rounded-lg border border-slate-200 bg-white ${desatualizado ? 'opacity-60' : ''}`}>
                <div role="tablist" className="flex border-b border-slate-200">
                  <BotaoAba ativa={aba === 'guloso'} onClick={() => setAba('guloso')}>
                    Comparar com o guloso
                  </BotaoAba>
                  <BotaoAba ativa={aba === 'tabela'} onClick={() => setAba('tabela')}>
                    Como a PD decidiu
                  </BotaoAba>
                </div>
                <div className="p-4" role="tabpanel">
                  {aba === 'guloso' && <ComparacaoGuloso resposta={plano.resposta} atividades={plano.atividades} />}
                  {aba === 'tabela' &&
                    (!plano.resposta.tabela_disponivel ? (
                      <p className="text-sm text-slate-600">{MENSAGEM_FORA_DO_LIMITE}</p>
                    ) : plano.tabela ? (
                      <TabelaPD key={plano.assinatura} dados={plano.tabela} atividades={plano.atividades} />
                    ) : (
                      <p className="text-sm text-red-700">
                        Não foi possível carregar a tabela{plano.erroTabela ? `: ${plano.erroTabela}` : '.'}
                      </p>
                    ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function StatusApi({ estado }: { estado: EstadoApi }) {
  const estilos = {
    carregando: ['bg-slate-300', 'Verificando a API…'],
    ok: ['bg-emerald-500', 'API disponível'],
    erro: ['bg-red-500', 'API indisponível'],
  } as const
  const [cor, texto] = estilos[estado.tipo]
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-600" data-testid="status-api">
      <span className={`h-2 w-2 rounded-full ${cor}`} />
      {texto}
    </span>
  )
}

function BotaoAba({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativa}
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
        ativa ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

export default App
