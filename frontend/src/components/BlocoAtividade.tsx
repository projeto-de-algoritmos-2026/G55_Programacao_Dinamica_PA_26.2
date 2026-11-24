import { useEffect, useRef, useState } from 'react'

import { nomeDisciplina, useCor } from '../cores'
import { PRIORIDADE_MAX } from '../limites'
import type { Atividade } from '../types'

interface Props {
  atividade: Atividade
  /** Maior duração da lista, para dar a largura proporcional. */
  maiorDuracao: number
  naRegua: boolean
  /** Muda a cada tentativa recusada desta peça, para reiniciar o tremor. */
  tremor?: number
  onAlternar: () => void
  onEditar: () => void
  onRemover: () => void
}

/** Medidor de 10 segmentos para a prioridade. */
export function Medidor({ valor, claro }: { valor: number; claro?: boolean }) {
  return (
    <span className="flex gap-[3px]" role="img" aria-label={`prioridade ${valor} de ${PRIORIDADE_MAX}`}>
      {Array.from({ length: PRIORIDADE_MAX }, (_, k) => (
        <span
          key={k}
          className={`h-2.5 w-1.5 rounded-sm ${
            k < valor ? (claro ? 'bg-giz' : 'bg-current') : claro ? 'bg-giz/25' : 'bg-current opacity-20'
          }`}
        />
      ))}
    </span>
  )
}

/** Uma atividade como peça: a largura cresce com a duração; tocar coloca ou tira da régua. */
export function BlocoAtividade({
  atividade,
  maiorDuracao,
  naRegua,
  tremor,
  onAlternar,
  onEditar,
  onRemover,
}: Props) {
  const c = useCor()(atividade.disciplina)
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuAberto) return
    function fechar(evento: MouseEvent | KeyboardEvent) {
      if (evento instanceof KeyboardEvent ? evento.key === 'Escape' : !menuRef.current?.contains(evento.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    document.addEventListener('keydown', fechar)
    return () => {
      document.removeEventListener('mousedown', fechar)
      document.removeEventListener('keydown', fechar)
    }
  }, [menuAberto])

  const fracao = maiorDuracao > 0 ? atividade.duracao / maiorDuracao : 1

  return (
    <div
      key={tremor}
      className={`relative min-w-[8.5rem] grow-0 ${tremor ? 'animate-tremor' : ''}`}
      style={{ flexBasis: `${8.5 + 8 * fracao}rem` }}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-pressed={naRegua}
        className={`peca flex h-full w-full flex-col gap-1.5 rounded-[14px] border-2 p-3 pr-9 text-left transition ${
          naRegua
            ? 'translate-y-[3px] border-b-2 outline-4 outline-offset-2 outline-menta'
            : 'hover:-translate-y-0.5'
        }`}
        style={{ background: c.fundo, color: c.texto, borderColor: c.borda }}
      >
        <span className="line-clamp-2 leading-snug font-bold">{atividade.nome}</span>
        <span className="text-xs opacity-80">{nomeDisciplina(atividade.disciplina)}</span>
        <span className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="font-display text-lg leading-none font-extrabold tabular-nums">
            {atividade.duracao}
            <span className="ml-0.5 text-xs font-bold">min</span>
          </span>
          <Medidor valor={atividade.prioridade} />
        </span>
        {naRegua && (
          <span className="absolute -top-2 -left-2 rounded-full bg-menta px-2 py-0.5 text-xs font-bold text-giz shadow">
            na régua
          </span>
        )}
      </button>

      <div ref={menuRef} className="absolute top-1.5 right-1.5">
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label={`Opções de ${atividade.nome}`}
          className="grid h-7 w-7 place-items-center rounded-lg hover:bg-black/10"
          style={{ color: c.texto }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="3" cy="8" r="1.6" fill="currentColor" />
            <circle cx="8" cy="8" r="1.6" fill="currentColor" />
            <circle cx="13" cy="8" r="1.6" fill="currentColor" />
          </svg>
        </button>
        {menuAberto && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-xl border-2 border-lousa-linha bg-superficie py-1 text-sm text-tinta shadow-[4px_4px_0_#0a0b26]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuAberto(false)
                onEditar()
              }}
              className="block w-full px-3 py-1.5 text-left hover:bg-papel"
            >
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuAberto(false)
                onRemover()
              }}
              className="block w-full px-3 py-1.5 text-left text-tomate hover:bg-papel"
            >
              Remover
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
