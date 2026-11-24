import { evaluatorIds } from '../types/index.ts'
import type { BordaRanking, BordaResult, EvaluatorId, TOPSISResult } from '../types/index.ts'
import { rankByScore } from './rankByScore.ts'

type TOPSISResults = Readonly<Record<EvaluatorId, TOPSISResult>>
type RanksByEvaluator = Record<EvaluatorId, Map<string, number>>

export function calculateBorda(results: TOPSISResults, quota: number): BordaResult {
  const firstResult = results[evaluatorIds[0]]
  const alternativeIds = firstResult?.rankings.map(({ alternativeId }) => alternativeId) ?? []
  const count = alternativeIds.length
  if (!Number.isInteger(quota) || quota < 1 || quota > count) {
    throw new RangeError('Kuota harus berupa bilangan bulat dari 1 sampai jumlah kandidat.')
  }

  const ranksByEvaluator = Object.fromEntries(evaluatorIds.map((evaluatorId) => {
    const result = results[evaluatorId]
    const ranks = new Map(result?.rankings.map(({ alternativeId, rank }) => [alternativeId, rank]))
    if (
      result?.evaluatorId !== evaluatorId
      || result.rankings.length !== count
      || ranks.size !== count
      || alternativeIds.some((id) => {
        const rank = ranks.get(id)
        return rank === undefined || rank < 1 || rank > count || !Number.isInteger(rank * 2)
      })
    ) {
      throw new RangeError(`Peringkat ${evaluatorId} harus mencakup daftar kandidat yang sama tanpa duplikasi.`)
    }
    return [evaluatorId, ranks]
  })) as RanksByEvaluator

  const totals = alternativeIds.map((alternativeId) => {
    const pointsByEvaluator = Object.fromEntries(evaluatorIds.map((evaluatorId) => [
      evaluatorId, count - ranksByEvaluator[evaluatorId].get(alternativeId)!,
    ])) as Record<EvaluatorId, number>
    const totalPoints = evaluatorIds.reduce((sum, id) => sum + pointsByEvaluator[id], 0)
    return { alternativeId, pointsByEvaluator, totalPoints }
  })
  const rankings = rankByScore(totals, (row) => row.totalPoints).map<BordaRanking>(({ row, firstRank, lastRank }) => {
    let status: BordaRanking['status'] = 'cadangan'
    if (lastRank <= quota) status = 'lolos'
    else if (firstRank <= quota) status = 'perlu-penyelesaian-seri'
    return { ...row, rank: firstRank, status }
  })

  return {
    quota,
    rankings,
    selected: rankings.filter((row) => row.status === 'lolos').map((row) => row.alternativeId),
    reserves: rankings.filter((row) => row.status === 'cadangan').map((row) => row.alternativeId),
    pendingTie: rankings.filter((row) => row.status === 'perlu-penyelesaian-seri').map((row) => row.alternativeId),
  }
}
