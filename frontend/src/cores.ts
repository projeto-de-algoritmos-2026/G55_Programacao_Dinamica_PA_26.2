// Cor estável por disciplina: o mesmo nome sempre cai na mesma cor da paleta.

const PALETA = [
  'bg-sky-100 text-sky-900 border-sky-300',
  'bg-amber-100 text-amber-900 border-amber-300',
  'bg-emerald-100 text-emerald-900 border-emerald-300',
  'bg-violet-100 text-violet-900 border-violet-300',
  'bg-rose-100 text-rose-900 border-rose-300',
  'bg-teal-100 text-teal-900 border-teal-300',
  'bg-orange-100 text-orange-900 border-orange-300',
  'bg-indigo-100 text-indigo-900 border-indigo-300',
]

export const SEM_DISCIPLINA = 'Sem disciplina'

export function nomeDisciplina(disciplina: string): string {
  return disciplina.trim() === '' ? SEM_DISCIPLINA : disciplina
}

export function corDisciplina(disciplina: string): string {
  const nome = nomeDisciplina(disciplina)
  let hash = 0
  for (const letra of nome) hash = (hash * 31 + letra.charCodeAt(0)) >>> 0
  return PALETA[hash % PALETA.length]
}
