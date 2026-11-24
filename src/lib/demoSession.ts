import { evaluatorIds } from '../types'
import type { EvaluatorId } from '../types'

const storageKey = 'scholardecision.demo-role'

export function rememberedRole(): EvaluatorId | null {
  try {
    const saved = localStorage.getItem(storageKey)
    return evaluatorIds.find((id) => id === saved) ?? null
  } catch { return null }
}

export function rememberRole(id: EvaluatorId | null) {
  try {
    if (id) localStorage.setItem(storageKey, id)
    else localStorage.removeItem(storageKey)
  } catch {
    // Portal tetap dapat digunakan ketika penyimpanan browser diblokir.
  }
}
