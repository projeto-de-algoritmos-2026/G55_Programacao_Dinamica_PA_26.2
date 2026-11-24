import { useState, type FormEvent, type ReactNode } from 'react'

import { DISCIPLINA_MAX, DURACAO_MAX, NOME_MAX, PRIORIDADE_MAX, PRIORIDADE_MIN } from '../limites'
import type { Atividade } from '../types'
import { FORM_VAZIO, validarAtividade, type ErrosAtividade, type FormAtividade } from '../validacao'

interface Props {
  /** Atividade em edição; ausente no modo "adicionar". */
  editando?: Atividade
  desabilitado?: boolean
  onSalvar: (dados: Omit<Atividade, 'id'>) => void
  onCancelar: () => void
}

function paraForm(atividade?: Atividade): FormAtividade {
  if (!atividade) return FORM_VAZIO
  return {
    nome: atividade.nome,
    disciplina: atividade.disciplina,
    duracao: String(atividade.duracao),
    prioridade: String(atividade.prioridade),
  }
}

/** Formulário de adicionar/editar. O componente pai troca a `key` ao mudar de modo. */
export function FormularioAtividade({ editando, desabilitado, onSalvar, onCancelar }: Props) {
  const [form, setForm] = useState<FormAtividade>(() => paraForm(editando))
  const [erros, setErros] = useState<ErrosAtividade>({})

  function mudar(campo: keyof FormAtividade, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => ({ ...atuais, [campo]: undefined }))
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const { erros: novos, dados } = validarAtividade(form)
    setErros(novos)
    if (!dados) return
    onSalvar(dados)
    if (!editando) setForm(FORM_VAZIO)
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-3" aria-label="Formulário de atividade">
      <h3 className="font-semibold text-slate-700">
        {editando ? 'Editar atividade' : 'Adicionar atividade'}
      </h3>
      <Campo rotulo="Nome" erro={erros.nome}>
        <input
          value={form.nome}
          maxLength={NOME_MAX + 20}
          onChange={(e) => mudar('nome', e.target.value)}
          placeholder="Ex.: Resolver lista de PD"
          className={entrada(erros.nome)}
        />
      </Campo>
      <Campo rotulo="Disciplina (opcional)" erro={erros.disciplina}>
        <input
          value={form.disciplina}
          maxLength={DISCIPLINA_MAX + 20}
          onChange={(e) => mudar('disciplina', e.target.value)}
          placeholder="Ex.: Projeto de Algoritmos"
          className={entrada(erros.disciplina)}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Duração (min)" erro={erros.duracao}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={DURACAO_MAX}
            step={1}
            value={form.duracao}
            onChange={(e) => mudar('duracao', e.target.value)}
            className={entrada(erros.duracao)}
          />
        </Campo>
        <Campo rotulo={`Prioridade (${PRIORIDADE_MIN} a ${PRIORIDADE_MAX})`} erro={erros.prioridade}>
          <input
            type="number"
            inputMode="numeric"
            min={PRIORIDADE_MIN}
            max={PRIORIDADE_MAX}
            step={1}
            value={form.prioridade}
            onChange={(e) => mudar('prioridade', e.target.value)}
            className={entrada(erros.prioridade)}
          />
        </Campo>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={desabilitado}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {editando ? 'Salvar alterações' : 'Adicionar'}
        </button>
        {editando && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Cancelar
          </button>
        )}
      </div>
      {desabilitado && !editando && (
        <p className="text-xs text-amber-700">A lista já tem o máximo de atividades.</p>
      )}
    </form>
  )
}

function entrada(erro?: string): string {
  const borda = erro ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-sky-300'
  return `w-full rounded-md border bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 ${borda}`
}

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{rotulo}</span>
      {children}
      {erro && <span className="mt-1 block text-xs text-red-600">{erro}</span>}
    </label>
  )
}
