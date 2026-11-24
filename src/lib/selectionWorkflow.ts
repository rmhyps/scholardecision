import { displayName } from '../data/demoAccounts'
import type { DemoProfile } from '../data/demoAccounts'
import { activePeriod, evaluators } from '../data/evaluators'
import { sha256, signDemoPayload } from './demoCrypto'
import type { BordaResult, CriterionVector, EvaluatorId, TOPSISResult } from '../types'

export const activePeriodCode = 'PRD-2025-1'
export const coordinator: EvaluatorId = 'kemahasiswaan'

export const approvalSteps = [
  'Menunggu Penilaian', 'Penilaian Selesai', 'Konsensus Selesai', 'Disahkan',
] as const

export type Phase = 0 | 1 | 2 | 3
export type TopsisByEvaluator = Readonly<Record<EvaluatorId, TOPSISResult | null>>

export interface PeriodDraft {
  code: string
  name: string
  startsOn: string
  endsOn: string
  quota: number
}

export const periodExamples: readonly (PeriodDraft & { status: 'Selesai' | 'Mendatang' })[] = [
  { code: 'PRD-2024-2', name: 'Beasiswa Bantuan UKT 2024/2025', startsOn: '2025-02-15', endsOn: '2025-03-30', quota: 5, status: 'Selesai' },
  { code: 'PRD-2026-1', name: 'Beasiswa Riset Inovasi 2026', startsOn: '2026-02-01', endsOn: '2026-03-15', quota: 2, status: 'Mendatang' },
]

export function kendallW(topsis: TopsisByEvaluator) {
  const inputs = Object.values(topsis).flatMap((result) => result ? [result.rankings] : [])
  if (inputs.length !== evaluators.length) return null
  const count = inputs[0].length
  const evaluatorsCount = inputs.length
  if (count < 2 || inputs.some((rows) => rows.length !== count)) return null

  const sums = new Map<string, number>()
  let tieCorrection = 0
  for (const rows of inputs) {
    const ties = new Map<number, number>()
    for (const { alternativeId, rank } of rows) {
      sums.set(alternativeId, (sums.get(alternativeId) ?? 0) + rank)
      ties.set(rank, (ties.get(rank) ?? 0) + 1)
    }
    for (const group of ties.values()) tieCorrection += group ** 3 - group
  }

  const expected = evaluatorsCount * (count + 1) / 2
  const sumSquares = [...sums.values()].reduce((sum, rankSum) => sum + (rankSum - expected) ** 2, 0)
  const denominator = evaluatorsCount ** 2 * (count ** 3 - count) - evaluatorsCount * tieCorrection
  return denominator > 0 ? 12 * sumSquares / denominator : null
}

export interface ConsensusRecord {
  readonly borda: BordaResult
  readonly ranAt: string
}

export interface ReportSigner {
  readonly id: EvaluatorId
  readonly role: string
  readonly name: string
  readonly weights: CriterionVector
  readonly lockedAt: string | null
}

export interface ApprovalPayload {
  readonly number: string
  readonly periodCode: string
  readonly periodName: string
  readonly ranAt: string
  readonly approvedAt: string
  readonly approvedBy: EvaluatorId
  readonly concordance: number | null
  readonly borda: BordaResult
  readonly signers: readonly ReportSigner[]
}

export interface FinalDecision {
  readonly payload: ApprovalPayload
  readonly hash: string
  readonly signatures: readonly { evaluatorId: EvaluatorId; signature: string; publicKey: JsonWebKey }[]
}

export const documentNumber = 'UNC/BA-GDSS/PRD-2025-1/001'

export function reportSigners(
  profiles: Readonly<Record<EvaluatorId, DemoProfile>>,
  sessions: Readonly<Record<EvaluatorId, { weights: CriterionVector }>>,
  lockedAt: Readonly<Partial<Record<EvaluatorId, string>>>,
) {
  return evaluators.map(({ id, name }): ReportSigner => ({
    id, role: name, name: displayName(profiles[id]), weights: { ...sessions[id].weights }, lockedAt: lockedAt[id] ?? null,
  }))
}

export async function createFinalDecision(record: ConsensusRecord, signers: readonly ReportSigner[], topsis: TopsisByEvaluator) {
  if (signers.some(({ lockedAt }) => !lockedAt) || record.borda.pendingTie.length) {
    throw new Error('Semua sesi harus terkunci dan seri batas kuota harus selesai.')
  }
  const payload: ApprovalPayload = {
    number: documentNumber,
    periodCode: activePeriodCode,
    periodName: activePeriod,
    ranAt: record.ranAt,
    approvedAt: new Date().toISOString(),
    approvedBy: coordinator,
    concordance: kendallW(topsis),
    borda: record.borda,
    signers,
  }
  const encoded = JSON.stringify(payload)
  const [hash, signatures] = await Promise.all([
    sha256(encoded),
    Promise.all(signers.map(async ({ id }) => ({
      evaluatorId: id, ...await signDemoPayload(encoded),
    }))),
  ])
  return { payload, hash, signatures }
}
