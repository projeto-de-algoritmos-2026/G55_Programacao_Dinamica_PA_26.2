import { useEffect, useMemo, useRef, useState } from 'react'

import { ComparacaoGuloso } from './components/ComparacaoGuloso'
import { Desafio, type Recusa } from './components/Desafio'
import { FolhaAtividade } from './components/FolhaAtividade'
import { ListaAtividades } from './components/ListaAtividades'
import { PainelTempo } from './components/PainelTempo'
import { Revelacao } from './components/Revelacao'
import { MENSAGEM_FORA_DO_LIMITE, TabelaPD } from './components/TabelaPD'
import { CoresContext, mapaDeCores, nomeDisciplina } from './cores'
import { N_MAX } from './limites'
import { api, ErroDaApi } from './services/api'
import type { Atividade, Exemplo, RequisicaoPlano, RespostaResolver, RespostaTabela } from './types'
import { novoId, validarTempo } from './validacao'

type EstadoApi = 'verificando' | 'ok' | 'erro'
type Aba = 'guloso' | 'tabela'

/** Resultado de uma revelação, junto com a entrada e a tentativa que o geraram. */
interface Plano {
  assinatura: string
  atividades: Map<string, Atividade>
  tentativa: Atividade[]
  resposta: RespostaResolver
  tabela: RespostaTabela | null
  erroTabela: string | null
}

const assinar = (requisicao: RequisicaoPlano) => JSON.stringify(requisicao)

function mensagem(erro: unknown): string {
  return erro instanceof ErroDaApi ? erro.message : 'Ocorreu um erro inesperado. Tente de novo.'
}

/** Mantém as escolhas na ordem em que foram feitas, descartando as que sumiram ou não cabem mais. */
function escolhasValidas(ids: string[], atividades: Atividade[], capacidade: number | null): Atividade[] {
  const porId = new Map(atividades.map((a) => [a.id, a]))
  const validas: Atividade[] = []
  let usado = 0
  for (const id of ids) {
    const a = porId.get(id)
    if (!a) continue
    if (capacidade !== null && usado + a.duracao > capacidade) continue
    validas.push(a)
    usado += a.duracao
  }
  return validas
}

function App() {
  const [statusApi, setStatusApi] = useState<EstadoApi>('verificando')
  const [exemplos, setExemplos] = useState<Exemplo[]>([])
  const [menuExemplos, setMenuExemplos] = useState(false)
  const [exemploPendente, setExemploPendente] = useState<Exemplo | null>(null)

  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [tempoTexto, setTempoTexto] = useState('')
  const [erroTempo, setErroTempo] = useState<string | null>(null)
  const [folha, setFolha] = useState<{ aberta: boolean; editandoId: string | null; chave: number }>({
    aberta: false,
    editandoId: null,
    chave: 0,
  })

  const [escolhas, setEscolhas] = useState<string[]>([])
  const [recusa, setRecusa] = useState<(Recusa & { id: string | null }) | null>(null)

  const [plano, setPlano] = useState<Plano | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<Aba>('guloso')
  const lousa = useRef<HTMLElement>(null)

  useEffect(() => {
    api
      .saude()
      .then(() => setStatusApi('ok'))
      .catch(() => setStatusApi('erro'))
    api
      .listarExemplos()
      .then(setExemplos)
      .catch(() => setExemplos([]))
  }, [])

  const tempo = validarTempo(tempoTexto)
  const capacidade = typeof tempo === 'number' ? tempo : null
  const escolhidas = escolhasValidas(escolhas, atividades, capacidade)
  const usado = escolhidas.reduce((s, a) => s + a.duracao, 0)
  const assinaturaAtual =
    capacidade !== null ? assinar({ tempo_disponivel: capacidade, atividades }) : null
  const revelado = plano !== null && plano.assinatura === assinaturaAtual

  const cores = useMemo(
    () => mapaDeCores([...atividades, ...(plano?.atividades.values() ?? [])].map((a) => a.disciplina)),
    [atividades, plano],
  )
  const disciplinas = [...new Set(atividades.map((a) => a.disciplina).filter((d) => d.trim() !== ''))]

  // --- Mesa ----------------------------------------------------------------

  function alternar(id: string) {
    const atividade = atividades.find((a) => a.id === id)
    if (!atividade) return
    if (revelado) setPlano(null)
    const atuais = revelado ? [] : escolhidas
    if (atuais.some((a) => a.id === id)) {
      setEscolhas(atuais.filter((a) => a.id !== id).map((a) => a.id))
      setRecusa(null)
      return
    }
    if (capacidade === null) {
      setErroTempo(typeof tempo === 'string' ? tempo : null)
      setRecusa((r) => ({ id, n: (r?.n ?? 0) + 1, mensagem: 'Primeiro diga quanto tempo você tem.' }))
      return
    }
    const restante = capacidade - atuais.reduce((s, a) => s + a.duracao, 0)
    if (atividade.duracao > restante) {
      setRecusa((r) => ({
        id,
        n: (r?.n ?? 0) + 1,
        mensagem: `${atividade.nome} leva ${atividade.duracao} min e só restam ${restante}. Faltam ${atividade.duracao - restante} min.`,
      }))
      return
    }
    setEscolhas([...atuais.map((a) => a.id), id])
    setRecusa(null)
  }

  function salvar(dados: Omit<Atividade, 'id'>) {
    if (folha.editandoId) {
      const id = folha.editandoId
      setAtividades((lista) => lista.map((a) => (a.id === id ? { ...a, ...dados } : a)))
    } else {
      setAtividades((lista) => [...lista, { id: novoId(), ...dados }])
    }
    setFolha((f) => ({ ...f, aberta: false }))
  }

  function remover(id: string) {
    setAtividades((lista) => lista.filter((a) => a.id !== id))
    setEscolhas((lista) => lista.filter((e) => e !== id))
  }

  function abrirFolha(editandoId: string | null) {
    setFolha((f) => ({ aberta: true, editandoId, chave: f.chave + 1 }))
  }

  function pedirExemplo(exemplo: Exemplo) {
    if (atividades.length === 0) carregarExemplo(exemplo)
    else setExemploPendente(exemplo)
  }

  function carregarExemplo(exemplo: Exemplo) {
    setAtividades(exemplo.atividades.map((a) => ({ ...a })))
    setTempoTexto(String(exemplo.tempo_disponivel))
    setErroTempo(null)
    setEscolhas([])
    setRecusa(null)
    setPlano(null)
    setErro(null)
    setExemploPendente(null)
    setMenuExemplos(false)
  }

  // --- Revelar ---------------------------------------------------------------

  async function revelar() {
    if (typeof tempo === 'string') {
      setErroTempo(tempo)
      return
    }
    if (atividades.length > N_MAX) {
      setErro(`A mesa aceita no máximo ${N_MAX} atividades.`)
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
        assinatura: assinar(requisicao),
        atividades: new Map(atividades.map((a) => [a.id, a])),
        tentativa: escolhidas,
        resposta,
        tabela,
        erroTabela,
      })
      setRecusa(null)
      setAba('guloso')
      lousa.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e) {
      setErro(mensagem(e))
    } finally {
      setCarregando(false)
    }
  }

  function jogarDeNovo() {
    setPlano(null)
    setEscolhas([])
    setRecusa(null)
  }

  // --- Tela ----------------------------------------------------------------

  const editando = atividades.find((a) => a.id === folha.editandoId)
  const mostrarBarraMovel = !revelado && atividades.length > 0 && capacidade !== null

  return (
    <CoresContext.Provider value={cores}>
      <div className={`min-h-screen ${mostrarBarraMovel ? 'pb-24 lg:pb-0' : ''}`}>
        <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <Marca />
            <div>
              <h1 className="font-display text-2xl leading-none font-extrabold">EstudaPlan</h1>
              <p className="text-sm text-tinta-suave">Cabe na sua tarde?</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm text-tinta-suave" data-testid="status-api">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  statusApi === 'ok' ? 'bg-menta' : statusApi === 'erro' ? 'bg-tomate' : 'bg-papel-funda'
                }`}
              />
              {statusApi === 'ok' ? 'Conectado' : statusApi === 'erro' ? 'Sem conexão com a API' : 'Conectando…'}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMenuExemplos((v) => !v)
                  setExemploPendente(null)
                }}
                disabled={exemplos.length === 0}
                aria-expanded={menuExemplos}
                className="rounded-xl border-2 border-lousa-linha bg-superficie px-4 py-2 font-bold text-tinta shadow-[0_3px_0_var(--color-lousa-linha)] active:translate-y-[3px] active:shadow-none disabled:opacity-40"
              >
                Desafios prontos
              </button>
              {menuExemplos && (
                <div className="absolute right-0 z-30 mt-2 w-80 animate-surgir rounded-2xl border-2 border-lousa-linha bg-superficie p-2 shadow-[6px_6px_0_#0a0b26]">
                  {exemploPendente ? (
                    <div className="space-y-3 p-2">
                      <p className="font-bold">
                        Trocar suas {atividades.length} atividades por “{exemploPendente.nome}”?
                      </p>
                      <p className="text-sm text-tinta-suave">{exemploPendente.descricao}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => carregarExemplo(exemploPendente)}
                          className="rounded-xl bg-girassol px-4 py-2 text-sm font-bold text-breu"
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          onClick={() => setExemploPendente(null)}
                          className="rounded-xl px-4 py-2 text-sm font-bold text-tinta-suave hover:bg-papel"
                        >
                          Manter as minhas
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ul>
                      {exemplos.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => pedirExemplo(e)}
                            className="w-full rounded-xl p-3 text-left hover:bg-papel"
                          >
                            <span className="block font-bold">{e.nome}</span>
                            <span className="block text-sm text-tinta-suave">{e.descricao}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr]">
          <div className="lg:col-start-1 lg:row-start-1">
            <PainelTempo
              valor={tempoTexto}
              erro={erroTempo}
              onMudar={(v) => {
                setTempoTexto(v)
                setErroTempo(null)
              }}
            />
          </div>

          <section
            ref={lousa}
            aria-label="Lousa"
            className="scroll-mt-4 self-start rounded-[28px] bg-lousa p-5 shadow-[0_10px_0_#090a24] ring-1 ring-lousa-linha sm:p-7 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            {revelado && plano ? (
              <Revelacao
                resposta={plano.resposta}
                atividades={plano.atividades}
                tentativa={plano.tentativa}
                onJogarDeNovo={jogarDeNovo}
              />
            ) : (
              <Desafio
                capacidade={capacidade}
                escolhidas={escolhidas}
                semAtividades={atividades.length === 0}
                exemplos={exemplos}
                recusa={recusa}
                aviso={plano ? 'A mesa ou o tempo mudou desde a última revelação. Jogue de novo para recalcular.' : null}
                erro={erro}
                carregando={carregando}
                onTirar={alternar}
                onRevelar={revelar}
                onCarregarExemplo={carregarExemplo}
              />
            )}
          </section>

          <div className="self-start lg:col-start-1 lg:row-start-2">
            <ListaAtividades
              atividades={atividades}
              naRegua={new Set(revelado ? [] : escolhidas.map((a) => a.id))}
              recusa={recusa?.id ? { id: recusa.id, n: recusa.n } : null}
              onAlternar={alternar}
              onEditar={(id) => abrirFolha(id)}
              onRemover={remover}
              onNova={() => abrirFolha(null)}
            />
          </div>
        </main>

        {revelado && plano && (
          <section aria-label="Entenda a jogada" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
            <div role="tablist" className="mb-6 inline-flex rounded-2xl bg-papel-funda p-1.5">
              <BotaoAba ativa={aba === 'guloso'} onClick={() => setAba('guloso')}>
                Comparar com o guloso
              </BotaoAba>
              <BotaoAba ativa={aba === 'tabela'} onClick={() => setAba('tabela')}>
                Como a PD decidiu
              </BotaoAba>
            </div>
            <div role="tabpanel">
              {aba === 'guloso' && <ComparacaoGuloso resposta={plano.resposta} atividades={plano.atividades} />}
              {aba === 'tabela' &&
                (!plano.resposta.tabela_disponivel ? (
                  <div className="max-w-prose space-y-2">
                    <h3 className="font-display text-2xl font-extrabold">Como a programação dinâmica decidiu</h3>
                    <p className="text-tinta-suave">
                      {MENSAGEM_FORA_DO_LIMITE} Carregue o desafio “Contraexemplo do guloso” para ver a tabela
                      passo a passo.
                    </p>
                  </div>
                ) : plano.tabela ? (
                  <TabelaPD key={plano.assinatura} dados={plano.tabela} atividades={plano.atividades} />
                ) : (
                  <p className="font-bold text-tomate">
                    Não foi possível carregar a tabela{plano.erroTabela ? `: ${plano.erroTabela}` : '.'}
                  </p>
                ))}
            </div>
          </section>
        )}

        {mostrarBarraMovel && (
          <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-lousa-linha bg-lousa px-4 py-3 text-giz lg:hidden">
            <p className="leading-tight">
              <span className="font-display text-2xl font-extrabold text-girassol tabular-nums">
                {escolhidas.reduce((s, a) => s + a.prioridade, 0)}
              </span>{' '}
              pontos
              <span className="block text-xs text-giz/70">
                {usado} de {capacidade} min
              </span>
            </p>
            <button
              type="button"
              onClick={revelar}
              disabled={carregando}
              className="rounded-xl bg-girassol px-4 py-2.5 font-display font-extrabold text-breu shadow-[0_4px_0_var(--color-girassol-funda)] active:translate-y-1 active:shadow-none"
            >
              {carregando ? 'Calculando…' : 'Revelar'}
            </button>
          </div>
        )}

        <FolhaAtividade
          key={folha.chave}
          aberta={folha.aberta}
          editando={editando}
          disciplinasConhecidas={disciplinas.map(nomeDisciplina)}
          onSalvar={salvar}
          onFechar={() => setFolha((f) => ({ ...f, aberta: false }))}
        />
      </div>
    </CoresContext.Provider>
  )
}

/** Marca: três peças de larguras diferentes encaixadas numa régua. */
function Marca() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <rect width="44" height="44" rx="12" fill="var(--color-lousa-clara)" />
      <rect x="7" y="17" width="14" height="12" rx="3" fill="var(--color-menta)" />
      <rect x="22" y="17" width="9" height="12" rx="3" fill="var(--color-girassol)" />
      <rect x="32" y="17" width="5" height="12" rx="2" fill="var(--color-lavanda)" />
      <rect x="7" y="32" width="30" height="2" rx="1" fill="rgb(255 255 255 / 0.5)" />
    </svg>
  )
}

function BotaoAba({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativa}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 font-bold transition ${
        ativa ? 'bg-lousa-clara text-giz shadow-[0_3px_0_#0a0b26]' : 'text-tinta-suave hover:text-tinta'
      }`}
    >
      {children}
    </button>
  )
}

export default App
