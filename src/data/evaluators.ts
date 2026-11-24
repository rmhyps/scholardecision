import type { Evaluator } from '../types'

export const evaluators = [
  { id: 'kemahasiswaan', name: 'Kemahasiswaan' },
  { id: 'dosen-wali', name: 'Dosen Wali' },
  { id: 'pengelola-beasiswa', name: 'Pengelola Beasiswa' },
] as const satisfies readonly Evaluator[]

export const activePeriod = '2025/2026 - Ganjil'
