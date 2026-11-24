import { criterionIds } from '../types/index.ts'
import type {
  Alternative, Criterion, CriterionId, CriterionVector, EvaluatorId, Matrix, TOPSISResult,
} from '../types/index.ts'
import { rankByScore } from './rankByScore.ts'

interface TOPSISInput {
  evaluatorId: EvaluatorId
  alternatives: readonly Alternative[]
  criteria: readonly Criterion[]
  scores: Matrix
  weights: CriterionVector
}

function mapCriteria(getValue: (id: CriterionId) => number): CriterionVector {
  return {
    C1: getValue('C1'),
    C2: getValue('C2'),
    C3: getValue('C3'),
    C4: getValue('C4'),
    C5: getValue('C5'),
  }
}

export function checkWeights(weights: CriterionVector) {
  const values = criterionIds.map((id) => weights[id])
  const total = values.reduce((sum, weight) => sum + weight, 0)
  const inRange = values.every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 1)
  return { total, inRange, valid: inRange && Math.abs(total - 1) < 1e-10 }
}

export function calculateTOPSIS({ evaluatorId, alternatives, criteria, scores, weights }: TOPSISInput): TOPSISResult {
  if (!alternatives.length || new Set(alternatives.map(({ id }) => id)).size !== alternatives.length) {
    throw new RangeError('Daftar alternatif harus terisi dan kodenya unik.')
  }
  const directions = new Map(criteria.map(({ id, direction }) => [id, direction]))
  if (criteria.length !== criterionIds.length || criterionIds.some((id) => !directions.has(id))) {
    throw new RangeError('TOPSIS membutuhkan satu definisi untuk setiap kriteria C1-C5.')
  }
  if (!checkWeights(weights).valid) {
    throw new RangeError('Setiap bobot harus berada di rentang 0-1 dan totalnya 1.')
  }

  const rows = alternatives.map(({ id }) => ({
    id,
    values: mapCriteria((criterionId) => {
      const score = scores[id]?.[criterionId]
      if (score === undefined || !Number.isFinite(score) || score < 0) {
        throw new RangeError(`Nilai ${id}/${criterionId} harus berupa angka nonnegatif.`)
      }
      return score
    }),
  }))

  const norms = mapCriteria((criterionId) => {
    const norm = Math.hypot(...rows.map(({ values }) => values[criterionId]))
    if (!Number.isFinite(norm)) {
      throw new RangeError(`Norma ${criterionId} melebihi rentang angka yang didukung.`)
    }
    return norm
  })
  const normalizedRows = rows.map(({ id, values }) => ({
    id,
    values: mapCriteria((criterionId) => norms[criterionId] === 0 ? 0 : values[criterionId] / norms[criterionId]),
  }))
  const weightedRows = normalizedRows.map(({ id, values }) => ({
    id,
    values: mapCriteria((criterionId) => values[criterionId] * weights[criterionId]),
  }))

  const idealPositive = mapCriteria((criterionId) => {
    const values = weightedRows.map((row) => row.values[criterionId])
    return directions.get(criterionId) === 'cost' ? Math.min(...values) : Math.max(...values)
  })
  const idealNegative = mapCriteria((criterionId) => {
    const values = weightedRows.map((row) => row.values[criterionId])
    return directions.get(criterionId) === 'cost' ? Math.max(...values) : Math.min(...values)
  })

  const distances = weightedRows.map(({ id, values }) => {
    const distancePositive = Math.hypot(...criterionIds.map((key) => values[key] - idealPositive[key]))
    const distanceNegative = Math.hypot(...criterionIds.map((key) => values[key] - idealNegative[key]))
    const distanceSum = distancePositive + distanceNegative
    return {
      alternativeId: id,
      distancePositive,
      distanceNegative,
      // Jika kedua solusi ideal berimpit, semua kandidat mendapat preferensi netral.
      preference: distanceSum === 0 ? 0.5 : distanceNegative / distanceSum,
    }
  })

  return {
    evaluatorId,
    norms,
    normalized: Object.fromEntries(normalizedRows.map(({ id, values }) => [id, values])),
    weighted: Object.fromEntries(weightedRows.map(({ id, values }) => [id, values])),
    idealPositive,
    idealNegative,
    rankings: rankByScore(distances, (row) => row.preference).map(({ row, firstRank, lastRank }) => ({
      ...row,
      rank: (firstRank + lastRank) / 2,
    })),
  }
}
