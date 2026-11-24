import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

import { DISCIPLINA_MAX, DURACAO_MAX, NOME_MAX, PRIORIDADE_MAX } from '../limites'
import type { Atividade } from '../types'
import { FORM_VAZIO, validarAtividade, type ErrosAtividade, type FormAtividade } from '../validacao'

interface Props {
  aberta: boolean
  /** Atividade em edição; ausente para criar uma nova. */
  editando?: Atividade
  disciplinasConhecidas: string[]
  onSalvar: (dados: Omit<Atividade, 'id'>) => void
  onFechar: () => void
}

const DURACOES_RAPIDAS = [5, 15, 30, 45, 60, 90]

function paraForm(atividade?: Atividade): FormAtividade {
  if (!atividade) return FORM_VAZIO
  return {
    nome: atividade.nome,
    disciplina: atividade.disciplina,
    duracao: String(atividade.duracao),
    prioridade: String(atividade.prioridade),
  }
}

/** Folha (dialog nativo) para criar ou editar uma atividade. O pai troca a `key` a cada abertura. */
export function FolhaAtividade({ aberta, editando, disciplinasConhecidas, onSalvar, onFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState<FormAtividade>(() => paraForm(editando))
  const [erros, setErros] = useState<ErrosAtividade>({})

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  function mudar(campo: keyof FormAtividade, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => ({ ...atuais, [campo]: undefined }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const { erros: novos, dados } = validarAtividade(form)
    setErros(novos)
    if (dados) onSalvar(dados)
  }

  const prioridade = Number(form.prioridade)

  return (
    <dialog
      ref={dialogo}
      onClose={onFechar}
      onClick={(e) => e.target === dialogo.current && onFechar()}
      aria-labelledby="titulo-folha"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl border-2 border-lousa-linha bg-superficie p-0 text-tinta shadow-[0_8px_0_#0a0b26] open:animate-surgir"
    >
      <form onSubmit={enviar} noValidate className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-folha" className="font-display text-2xl font-extrabold">
            {editando ? 'Editar atividade' : 'Nova atividade'}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full text-xl text-tinta-suave hover:bg-papel"
          >
            ×
          </button>
        </div>

        <Campo rotulo="O que você vai estudar?" erro={erros.nome}>
          <input
            autoFocus
            value={form.nome}
            maxLength={NOME_MAX + 20}
            onChange={(e) => mudar('nome', e.target.value)}
            placeholder="Resolver a lista 3 de Grafos"
            className={entrada(erros.nome)}
          />
        </Campo>

        <Campo rotulo="Disciplina (opcional)" erro={erros.disciplina}>
          <input
            value={form.disciplina}
            maxLength={DISCIPLINA_MAX + 20}
            list="disciplinas-conhecidas"
            onChange={(e) => mudar('disciplina', e.target.value)}
            placeholder="Projeto de Algoritmos"
            className={entrada(erros.disciplina)}
          />
          <datalist id="disciplinas-conhecidas">
            {disciplinasConhecidas.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Campo>

        <Campo rotulo="Quanto tempo leva? (minutos)" erro={erros.duracao}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={DURACAO_MAX}
              step={1}
              value={form.duracao}
              onChange={(e) => mudar('duracao', e.target.value)}
              className={`${entrada(erros.duracao)} w-24`}
            />
            {DURACOES_RAPIDAS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => mudar('duracao', String(m))}
                className={`rounded-full border-2 px-3 py-1 text-sm font-bold tabular-nums ${
                  form.duracao === String(m)
                    ? 'border-girassol bg-girassol text-breu'
                    : 'border-papel-funda text-tinta-suave hover:border-lavanda'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Campo>

        <fieldset>
          <legend className="mb-1.5 font-bold">Quanto isso importa para você agora?</legend>
          <div className="flex gap-1" role="radiogroup" aria-label="Prioridade de 1 a 10">
            {Array.from({ length: PRIORIDADE_MAX }, (_, k) => k + 1).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={prioridade === p}
                aria-label={`Prioridade ${p}`}
                onClick={() => mudar('prioridade', String(p))}
                className={`flex-1 rounded-lg text-sm font-bold tabular-nums transition ${
                  p <= prioridade ? 'bg-girassol text-breu' : 'bg-papel text-tinta-suave hover:bg-papel-funda'
                }`}
                style={{ height: `${1.6 + p * 0.12}rem`, alignSelf: 'flex-end' }}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-tinta-suave">
            1 é "dá para deixar para depois"; 10 é "preciso fazer hoje". A nota é sua e não mede aprendizado.
          </p>
          {erros.prioridade && <p className="mt-1 text-sm text-tomate">{erros.prioridade}</p>}
        </fieldset>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="submit"
            className="rounded-xl bg-girassol px-5 py-2.5 font-bold text-breu shadow-[0_4px_0_var(--color-girassol-funda)] active:translate-y-1 active:shadow-none"
          >
            {editando ? 'Salvar alterações' : 'Adicionar à mesa'}
          </button>
          <button type="button" onClick={onFechar} className="rounded-xl px-4 py-2.5 font-bold text-tinta-suave hover:bg-papel">
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  )
}

function entrada(erro?: string): string {
  const borda = erro ? 'border-tomate' : 'border-papel-funda focus:border-lavanda'
  return `w-full rounded-[10px] border-2 bg-papel px-3 py-2 outline-none ${borda}`
}

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-bold">{rotulo}</span>
      {children}
      {erro && <span className="mt-1 block text-sm text-tomate">{erro}</span>}
    </label>
  )
}
