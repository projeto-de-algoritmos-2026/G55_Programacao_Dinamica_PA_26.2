// Cores das disciplinas. Cada disciplina recebe uma cor pela ordem em que
// aparece na lista, para que disciplinas diferentes nunca dividam a mesma cor
// (até 8 disciplinas; depois disso a paleta recomeça).

import { createContext, useContext } from 'react'

export interface CorPeca {
  fundo: string
  borda: string
  texto: string
}

const PALETA: CorPeca[] = [
  { fundo: '#bde8ff', borda: '#3f9fd3', texto: '#0b3a57' }, // céu
  { fundo: '#ffd9a8', borda: '#e3913a', texto: '#5a3300' }, // laranja
  { fundo: '#c9f2d9', borda: '#3aae74', texto: '#0e4a2c' }, // folha
  { fundo: '#e3d7ff', borda: '#8a6ce3', texto: '#2e1a6b' }, // uva
  { fundo: '#ffc9d6', borda: '#e0628a', texto: '#5c1026' }, // chiclete
  { fundo: '#fff0a8', borda: '#d2aa00', texto: '#4d3f00' }, // limão
  { fundo: '#b8f0ec', borda: '#27a89f', texto: '#0a3f3b' }, // água
  { fundo: '#ffd0c2', borda: '#e3734f', texto: '#5a1e0d' }, // pêssego
]

export const SEM_DISCIPLINA = 'Sem disciplina'

export function nomeDisciplina(disciplina: string): string {
  return disciplina.trim() === '' ? SEM_DISCIPLINA : disciplina
}

export function mapaDeCores(disciplinas: string[]): Map<string, CorPeca> {
  const mapa = new Map<string, CorPeca>()
  for (const d of disciplinas) {
    const nome = nomeDisciplina(d)
    if (!mapa.has(nome)) mapa.set(nome, PALETA[mapa.size % PALETA.length])
  }
  return mapa
}

export const CoresContext = createContext<Map<string, CorPeca>>(new Map())

export function useCor(): (disciplina: string) => CorPeca {
  const mapa = useContext(CoresContext)
  return (disciplina) => mapa.get(nomeDisciplina(disciplina)) ?? PALETA[0]
}
