import { useEffect, useState } from 'react'

type EstadoApi =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; status: string }
  | { tipo: 'erro'; mensagem: string }

function App() {
  const [api, setApi] = useState<EstadoApi>({ tipo: 'carregando' })

  useEffect(() => {
    fetch('/api/saude')
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const corpo: { status: string } = await resposta.json()
        setApi({ tipo: 'ok', status: corpo.status })
      })
      .catch((erro: unknown) => {
        const mensagem = erro instanceof Error ? erro.message : String(erro)
        setApi({ tipo: 'erro', mensagem })
      })
  }, [])

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans text-slate-800">
      <h1 className="text-3xl font-bold">EstudaPlan</h1>
      <p className="mt-2 text-slate-600">
        Seleção ótima de atividades de estudo por Mochila 0/1 com programação dinâmica.
      </p>

      <p className="mt-6 text-sm" data-testid="status-api">
        {api.tipo === 'carregando' && 'Verificando a API…'}
        {api.tipo === 'ok' && (
          <span className="text-emerald-700">API disponível: {api.status}</span>
        )}
        {api.tipo === 'erro' && (
          <span className="text-red-700">API indisponível ({api.mensagem})</span>
        )}
      </p>
    </main>
  )
}

export default App
