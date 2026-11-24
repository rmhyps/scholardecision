import { gdssDataset } from '../data/gdssDataset.ts'
import { calculateBorda } from '../lib/borda.ts'
import { calculateTOPSIS, checkWeights } from '../lib/topsis.ts'
import { evaluatorIds } from '../types/index.ts'
import type {
  CompleteMatrix, CriterionId, CriterionVector, EvaluatorId, TOPSISResult,
} from '../types/index.ts'

export type AssessmentStatus = 'draf' | 'terkunci'

interface AssessmentSession {
  readonly status: AssessmentStatus
  readonly weights: CriterionVector
  readonly scores: CompleteMatrix
}

export interface GDSSState {
  readonly sessions: Readonly<Record<EvaluatorId, AssessmentSession>>
  readonly quota: number
  readonly quotaLocked: boolean
}

export type GDSSAction =
  | { type: 'set-weights'; evaluatorId: EvaluatorId; changes: Partial<CriterionVector> }
  | { type: 'set-score'; evaluatorId: EvaluatorId; alternativeId: string; criterionId: CriterionId; score: number }
  | { type: 'lock-evaluation'; evaluatorId: EvaluatorId }
  | { type: 'set-quota'; quota: number }
  | { type: 'freeze-quota' }

function mapEvaluators<T>(value: (id: EvaluatorId) => T): Record<EvaluatorId, T> {
  return {
    kemahasiswaan: value('kemahasiswaan'),
    'dosen-wali': value('dosen-wali'),
    'pengelola-beasiswa': value('pengelola-beasiswa'),
  }
}

export function createGDSSState(): GDSSState {
  return {
    quota: gdssDataset.defaultQuota,
    quotaLocked: false,
    sessions: mapEvaluators((id) => ({
      status: 'draf',
      weights: gdssDataset.weights[id],
      scores: gdssDataset.scores[id],
    })),
  }
}

const criteriaById = new Map(gdssDataset.criteria.map((criterion) => [criterion.id, criterion]))

export function gdssReducer(state: GDSSState, action: GDSSAction): GDSSState {
  if (action.type === 'freeze-quota') return state.quotaLocked ? state : { ...state, quotaLocked: true }
  if (action.type === 'set-quota') {
    if (state.quotaLocked) return state
    const { quota } = action
    if (!Number.isInteger(quota) || quota < 1 || quota > gdssDataset.alternatives.length || quota === state.quota) {
      return state
    }
    return { ...state, quota }
  }

  const { evaluatorId } = action
  const session = state.sessions[evaluatorId]
  if (session.status === 'terkunci') return state

  let nextSession: AssessmentSession
  switch (action.type) {
    case 'set-weights': {
      const weights = { ...session.weights, ...action.changes }
      if (!checkWeights(weights).inRange) return state
      nextSession = { ...session, weights }
      break
    }
    case 'set-score': {
      const { alternativeId, criterionId, score } = action
      const criterion = criteriaById.get(criterionId)
      if (
        !Object.hasOwn(session.scores, alternativeId)
        || !criterion
        || !Number.isFinite(score)
        || score < criterion.min
        || score > criterion.max
      ) {
        return state
      }
      nextSession = {
        ...session,
        scores: {
          ...session.scores,
          [alternativeId]: { ...session.scores[alternativeId], [criterionId]: score },
        },
      }
      break
    }
    case 'lock-evaluation': {
      if (!checkWeights(session.weights).valid) return state
      nextSession = { ...session, status: 'terkunci' }
      break
    }
  }

  return {
    ...state,
    sessions: { ...state.sessions, [evaluatorId]: nextSession },
  }
}

export function deriveGDSS(state: GDSSState) {
  const weightValidation = mapEvaluators((id) => checkWeights(state.sessions[id].weights))
  const topsis = mapEvaluators((evaluatorId) => {
    if (!weightValidation[evaluatorId].valid) return null

    const { weights, scores } = state.sessions[evaluatorId]
    return calculateTOPSIS({
      evaluatorId,
      alternatives: gdssDataset.alternatives,
      criteria: gdssDataset.criteria,
      weights,
      scores,
    })
  })
  const validResults = (results: Record<EvaluatorId, TOPSISResult | null>): results is Record<EvaluatorId, TOPSISResult> =>
    evaluatorIds.every((id) => results[id] !== null)

  return {
    weightValidation,
    topsis,
    borda: validResults(topsis) ? calculateBorda(topsis, state.quota) : null,
    allLocked: evaluatorIds.every((id) => state.sessions[id].status === 'terkunci'),
  }
}
