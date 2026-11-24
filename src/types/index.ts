export interface Alternative {
  id: string
  name: string
}

export const criterionIds = ['C1', 'C2', 'C3', 'C4', 'C5'] as const
export type CriterionId = (typeof criterionIds)[number]
export type CriterionVector = Readonly<Record<CriterionId, number>>

export interface Criterion {
  id: CriterionId
  name: string
  direction: 'benefit' | 'cost'
}

export interface CriterionDefinition extends Criterion {
  unit: string
  min: number
  max: number
  description: string
}

export interface Candidate extends Alternative {
  nim?: string
  program?: string
  sourceId: number
  periodId: number
  referenceScores: CriterionVector
}

export const evaluatorIds = ['kemahasiswaan', 'dosen-wali', 'pengelola-beasiswa'] as const
export type EvaluatorId = (typeof evaluatorIds)[number]

export interface Evaluator {
  id: EvaluatorId
  name: string
}

export type Matrix = Readonly<
  Partial<Record<Alternative['id'], Readonly<Partial<CriterionVector>>>>
>

export type CompleteMatrix = Readonly<Record<Alternative['id'], CriterionVector>>

export interface GDSSDataset {
  readonly alternatives: readonly Candidate[]
  readonly criteria: readonly CriterionDefinition[]
  readonly weights: Readonly<Record<EvaluatorId, CriterionVector>>
  readonly scores: Readonly<Record<EvaluatorId, CompleteMatrix>>
  readonly defaultQuota: number
}

export interface TOPSISRanking {
  readonly alternativeId: Alternative['id']
  readonly distancePositive: number
  readonly distanceNegative: number
  readonly preference: number
  readonly rank: number
}

export interface TOPSISResult {
  readonly evaluatorId: EvaluatorId
  readonly norms: CriterionVector
  readonly normalized: CompleteMatrix
  readonly weighted: CompleteMatrix
  readonly idealPositive: CriterionVector
  readonly idealNegative: CriterionVector
  readonly rankings: readonly TOPSISRanking[]
}

export type BordaStatus = 'lolos' | 'cadangan' | 'perlu-penyelesaian-seri'

export interface BordaRanking {
  readonly alternativeId: Alternative['id']
  readonly pointsByEvaluator: Readonly<Record<EvaluatorId, number>>
  readonly totalPoints: number
  readonly rank: number
  readonly status: BordaStatus
}

export interface BordaResult {
  readonly quota: number
  readonly rankings: readonly BordaRanking[]
  readonly selected: readonly Alternative['id'][]
  readonly reserves: readonly Alternative['id'][]
  readonly pendingTie: readonly Alternative['id'][]
}
