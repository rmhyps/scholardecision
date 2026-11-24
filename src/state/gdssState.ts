import { candidateDemoProfile } from '../data/candidateDemoProfiles.ts'
import { gdssDataset } from '../data/gdssDataset.ts'
import { calculateBorda } from '../lib/borda.ts'
import { calculateTOPSIS, checkWeights } from '../lib/topsis.ts'
import { evaluatorIds } from '../types/index.ts'
import type {
  Candidate, CompleteMatrix, CriterionId, CriterionVector, EvaluatorId, TOPSISResult,
} from '../types/index.ts'

export type AssessmentStatus = 'draf' | 'terkunci'

interface AssessmentSession {
  readonly status: AssessmentStatus
  readonly weights: CriterionVector
  readonly scores: CompleteMatrix
}

export type CandidateInput = { name: string; nim: string; program: string; referenceScores: CriterionVector }

export interface GDSSState {
  readonly alternatives: readonly Candidate[]
  readonly nextCandidateId: number
  readonly sessions: Readonly<Record<EvaluatorId, AssessmentSession>>
  readonly quota: number
  readonly quotaLocked: boolean
}

export type GDSSAction =
  | { type: 'add-candidate'; input: CandidateInput }
  | { type: 'delete-candidate'; id: string }
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
    alternatives: gdssDataset.alternatives,
    nextCandidateId: Math.max(...gdssDataset.alternatives.map(({ sourceId }) => sourceId)) + 1,
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

function matchesScorePrecision(id: CriterionId, score: number) {
  return id === 'C1'
    ? Math.abs(score * 100 - Math.round(score * 100)) < 1e-7
    : Number.isInteger(score)
}

export function candidateInputError(alternatives: readonly Candidate[], input: CandidateInput) {
  const nim = input.nim.trim().toUpperCase()
  if (!input.name.trim() || !nim || !input.program.trim()) return 'Isi nama, NIM, dan program studi.'
  if (alternatives.some((candidate) => candidateDemoProfile(candidate).nim.toUpperCase() === nim)) {
    return 'NIM tersebut sudah terdaftar.'
  }
  for (const { id, name, min, max } of gdssDataset.criteria) {
    const score = input.referenceScores[id]
    if (!Number.isFinite(score) || score < min || score > max || !matchesScorePrecision(id, score)) {
      return `${name} harus mengikuti rentang ${min} sampai ${max} dan ketelitian yang ditentukan.`
    }
  }
  return ''
}

export function gdssReducer(state: GDSSState, action: GDSSAction): GDSSState {
  if (action.type === 'add-candidate') {
    const { input } = action
    if (state.quotaLocked || candidateInputError(state.alternatives, input)) return state
    const sourceId = state.nextCandidateId
    const candidate: Candidate = {
      id: `A${String(sourceId).padStart(2, '0')}`,
      sourceId,
      periodId: gdssDataset.alternatives[0].periodId,
      name: input.name.trim(),
      nim: input.nim.trim(),
      program: input.program.trim(),
      referenceScores: { ...input.referenceScores },
    }
    return {
      ...state,
      alternatives: [...state.alternatives, candidate],
      nextCandidateId: sourceId + 1,
      quota: Math.max(1, state.quota),
      sessions: mapEvaluators((id) => ({
        ...state.sessions[id], status: 'draf',
        scores: { ...state.sessions[id].scores, [candidate.id]: candidate.referenceScores },
      })),
    }
  }
  if (action.type === 'delete-candidate') {
    if (state.quotaLocked || !state.alternatives.some(({ id }) => id === action.id)) return state
    const alternatives = state.alternatives.filter(({ id }) => id !== action.id)
    return {
      ...state,
      alternatives,
      quota: Math.min(state.quota, alternatives.length),
      sessions: mapEvaluators((id) => {
        const scores = { ...state.sessions[id].scores }
        delete scores[action.id]
        return { ...state.sessions[id], scores, status: 'draf' }
      }),
    }
  }

  if (action.type === 'freeze-quota') return state.quotaLocked ? state : { ...state, quotaLocked: true }
  if (action.type === 'set-quota') {
    if (state.quotaLocked) return state
    const { quota } = action
    if (!Number.isInteger(quota) || quota < 1 || quota > state.alternatives.length || quota === state.quota) {
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
      if (!state.alternatives.length || !checkWeights(session.weights).valid) return state
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
    if (!state.alternatives.length || !weightValidation[evaluatorId].valid) return null

    const { weights, scores } = state.sessions[evaluatorId]
    return calculateTOPSIS({
      evaluatorId,
      alternatives: state.alternatives,
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
