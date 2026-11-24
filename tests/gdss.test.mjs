import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { gdssDataset } from '../src/data/gdssDataset.ts'
import { calculateBorda } from '../src/lib/borda.ts'
import { calculateTOPSIS } from '../src/lib/topsis.ts'
import { createGDSSState, deriveGDSS, gdssReducer } from '../src/state/gdssState.ts'
import { evaluatorIds } from '../src/types/index.ts'

const baseline = JSON.parse(readFileSync(new URL('../../data/baseline_verifikasi_gdss.json', import.meta.url), 'utf8'))
const baselineSheets = {
  kemahasiswaan: 'TOPSIS_KEMAHASISWAAN',
  'dosen-wali': 'TOPSIS_DOSEN_WALI',
  'pengelola-beasiswa': 'TOPSIS_PENGELOLA',
}
const tolerance = 1e-10
const { alternatives, criteria, weights, scores } = gdssDataset

function closeTo(actual, expected, label) {
  const error = Math.abs(actual - expected)
  assert.ok(error < tolerance, `${label}: ${actual} vs ${expected} (selisih ${error})`)
  return error
}

function calculateAll() {
  return Object.fromEntries(evaluatorIds.map((evaluatorId) => [
    evaluatorId,
    calculateTOPSIS({
      evaluatorId, alternatives, criteria, scores: scores[evaluatorId], weights: weights[evaluatorId],
    }),
  ]))
}

test('dataset memuat 20 profil, 300 penilaian, dan tiga vektor bobot', () => {
  assert.deepEqual(
    alternatives.map(({ sourceId, periodId, id, name }) => [sourceId, periodId, id, name]),
    baseline.alternatives,
  )
  assert.deepEqual(criteria.map(({ id, direction }) => [id, direction]), [
    ['C1', 'benefit'], ['C2', 'cost'], ['C3', 'benefit'], ['C4', 'benefit'], ['C5', 'benefit'],
  ])
  assert.equal(gdssDataset.defaultQuota, 2)
  const ids = criteria.map(({ id }) => id)
  for (const candidate of alternatives) {
    assert.deepEqual(Object.keys(candidate.referenceScores), ids)
  }
  for (const evaluatorId of evaluatorIds) {
    const matrix = scores[evaluatorId]
    assert.deepEqual(Object.keys(matrix), alternatives.map(({ id }) => id))
    assert.deepEqual(Object.keys(weights[evaluatorId]), ids)
    closeTo(Object.values(weights[evaluatorId]).reduce((sum, weight) => sum + weight, 0), 1, evaluatorId)
    for (const row of Object.values(matrix)) {
      assert.deepEqual(Object.keys(row), ids)
      for (const { id, min, max } of criteria) {
        assert.ok(Number.isFinite(row[id]) && row[id] >= min && row[id] <= max)
      }
    }
  }
})

test('60 nilai preferensi dan 60 peringkat TOPSIS cocok dengan baseline', (t) => {
  const results = calculateAll()
  let maxError = 0
  for (const evaluatorId of evaluatorIds) {
    const expectedRows = baseline.topsis[baselineSheets[evaluatorId]]
    const result = results[evaluatorId]
    const actualById = new Map(result.rankings.map((row) => [row.alternativeId, row]))
    assert.equal(actualById.size, expectedRows.length)
    for (const { code, v, rank } of expectedRows) {
      const label = `${evaluatorId}/${code}`
      const actual = actualById.get(code)
      assert.ok(actual, label)
      maxError = Math.max(maxError, closeTo(actual.preference, v, label))
      assert.equal(actual.rank, rank, label)
    }
  }
  t.diagnostic(`Selisih maksimum Vi: ${maxError}`)
})

test('60 poin individual, 20 total dan peringkat Borda, serta kuota 2 dan 3 cocok', () => {
  const results = calculateAll()
  const two = calculateBorda(results, 2)
  const three = calculateBorda(results, 3)
  const baselineRows = Object.values(baseline.borda)

  assert.equal(two.rankings.length, baselineRows.length)
  for (const row of two.rankings) {
    const expected = baseline.borda[row.alternativeId]
    assert.deepEqual(evaluatorIds.map((id) => row.pointsByEvaluator[id]), expected.points, row.alternativeId)
    assert.equal(row.totalPoints, expected.total, row.alternativeId)
    assert.equal(row.rank, 1 + baselineRows.filter(({ total }) => total > expected.total).length, row.alternativeId)
  }
  assert.deepEqual(two.rankings.slice(0, 3).map(({ alternativeId, totalPoints, rank }) => ({
    alternativeId, totalPoints, rank,
  })), [
    { alternativeId: 'A04', totalPoints: 50, rank: 1 },
    { alternativeId: 'A19', totalPoints: 50, rank: 1 },
    { alternativeId: 'A08', totalPoints: 47, rank: 3 },
  ])
  assert.equal(two.rankings.reduce((sum, row) => sum + row.totalPoints, 0), 570)
  assert.deepEqual(two.selected, ['A04', 'A19'])
  assert.equal(two.reserves.length, 18)
  assert.deepEqual(three.selected, ['A04', 'A19', 'A08'])
  assert.equal(three.reserves.length, 17)
  assert.deepEqual(two.pendingTie, [])
  assert.deepEqual(three.pendingTie, [])
})

test('TOPSIS mengekspos norm, R, Y, solusi ideal, dan dua jarak sesuai arah kriteria', () => {
  const result = calculateTOPSIS({
    evaluatorId: 'kemahasiswaan',
    alternatives: [{ id: 'A01', name: 'A01' }, { id: 'A02', name: 'A02' }],
    criteria,
    scores: {
      A01: { C1: 3, C2: 1, C3: 0, C4: 0, C5: 0 },
      A02: { C1: 4, C2: 2, C3: 0, C4: 0, C5: 0 },
    },
    weights: { C1: 0.5, C2: 0.5, C3: 0, C4: 0, C5: 0 },
  })
  closeTo(result.norms.C1, 5, 'norm IPK')
  closeTo(result.norms.C2, Math.sqrt(5), 'norm penghasilan')
  assert.equal(result.norms.C3, 0)
  assert.equal(result.normalized.A01.C3, 0)
  closeTo(result.normalized.A01.C1, 0.6, 'R IPK A01')
  closeTo(result.weighted.A01.C1, 0.3, 'Y IPK A01')
  closeTo(result.idealPositive.C1, 0.4, 'A+ benefit')
  closeTo(result.idealNegative.C1, 0.3, 'A- benefit')
  closeTo(result.idealPositive.C2, 0.5 / Math.sqrt(5), 'A+ cost')
  closeTo(result.idealNegative.C2, 1 / Math.sqrt(5), 'A- cost')

  const first = result.rankings.find(({ alternativeId }) => alternativeId === 'A01')
  const expectedDistanceToNegative = 0.5 / Math.sqrt(5)
  closeTo(first.distancePositive, 0.1, 'D+ A01')
  closeTo(first.distanceNegative, expectedDistanceToNegative, 'D- A01')
  closeTo(first.preference, expectedDistanceToNegative / (0.1 + expectedDistanceToNegative), 'Vi A01')
})

test('seri TOPSIS memakai rata-rata posisi dan poin Borda bisa pecahan', () => {
  const candidates = ['A01', 'A02', 'A03'].map((id) => ({ id, name: id }))
  const high = { C1: 4, C2: 0, C3: 0, C4: 0, C5: 0 }
  const low = { ...high, C1: 2 }
  const results = Object.fromEntries(evaluatorIds.map((evaluatorId) => [
    evaluatorId,
    calculateTOPSIS({
      evaluatorId,
      alternatives: candidates,
      criteria,
      scores: { A01: high, A02: high, A03: low },
      weights: { C1: 1, C2: 0, C3: 0, C4: 0, C5: 0 },
    }),
  ]))
  assert.deepEqual(results.kemahasiswaan.rankings.map(({ rank }) => rank), [1.5, 1.5, 3])
  const borda = calculateBorda(results, 2)
  assert.deepEqual(borda.rankings.map(({ rank, totalPoints }) => [rank, totalPoints]), [[1, 4.5], [1, 4.5], [3, 0]])
  assert.deepEqual(borda.selected, ['A01', 'A02'])
})

test('solusi ideal berimpit menghasilkan preferensi netral dan peringkat bersama', () => {
  const row = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0 }
  const result = calculateTOPSIS({
    evaluatorId: 'kemahasiswaan',
    alternatives: alternatives.slice(0, 2),
    criteria,
    weights: weights.kemahasiswaan,
    scores: { A01: row, A02: row },
  })
  assert.deepEqual(result.rankings.map(({ rank, preference }) => [rank, preference]), [[1.5, 0.5], [1.5, 0.5]])
})

test('seri yang melintasi kuota ditandai, tanpa memilih berdasarkan urutan kandidat', () => {
  const results = calculateAll()
  const cutFirst = calculateBorda(results, 1)
  assert.deepEqual(cutFirst.selected, [])
  assert.deepEqual(cutFirst.pendingTie, ['A04', 'A19'])
  assert.equal(cutFirst.reserves.length, 18)

  const cutLater = calculateBorda(results, 5)
  assert.deepEqual(cutLater.selected, ['A04', 'A19', 'A08', 'A06'])
  assert.deepEqual(cutLater.pendingTie, ['A11', 'A16'])
  assert.ok(cutLater.rankings.filter(({ rank }) => rank === 5).every(({ status }) => status === 'perlu-penyelesaian-seri'))
})

test('mesin menolak nilai hilang, total bobot salah, daftar ganda, dan kuota invalid', () => {
  const input = {
    evaluatorId: 'kemahasiswaan', alternatives, criteria,
    scores: scores.kemahasiswaan, weights: weights.kemahasiswaan,
  }
  assert.throws(() => calculateTOPSIS({ ...input, scores: {} }), /A01[/]C1/)
  assert.throws(() => calculateTOPSIS({ ...input, weights: { ...input.weights, C1: 0.6 } }), /totalnya 1/)
  assert.throws(() => calculateTOPSIS({ ...input, alternatives: [alternatives[0], alternatives[0]] }), /unik/)
  const results = calculateAll()
  for (const quota of [0, 21, 2.5]) {
    assert.throws(() => calculateBorda(results, quota), /Kuota/)
  }
  const missingRow = { ...results.kemahasiswaan, rankings: results.kemahasiswaan.rankings.slice(1) }
  assert.throws(() => calculateBorda({ ...results, kemahasiswaan: missingRow }, 2), /daftar kandidat/)
})

test('perubahan draf menghitung ulang hasil dan kunci menjaga nilai serta bobot', () => {
  const evaluatorId = 'kemahasiswaan'
  const base = createGDSSState()
  const initial = deriveGDSS(base)
  assert.equal(base.sessions[evaluatorId].status, 'draf')
  assert.ok(initial.borda)
  assert.equal(initial.allLocked, false)
  const unbalanced = gdssReducer(base, { type: 'set-weights', evaluatorId, changes: { C1: 0.35 } })
  assert.equal(unbalanced.sessions['dosen-wali'], base.sessions['dosen-wali'])
  assert.equal(base.sessions[evaluatorId].weights.C1, 0.25)
  const invalid = deriveGDSS(unbalanced)
  assert.equal(invalid.weightValidation[evaluatorId].valid, false)
  assert.equal(invalid.topsis[evaluatorId], null)
  assert.equal(invalid.borda, null)
  assert.ok(invalid.topsis['dosen-wali'])
  assert.equal(gdssReducer(unbalanced, { type: 'lock-evaluation', evaluatorId }), unbalanced)

  const corrected = gdssReducer(unbalanced, { type: 'set-weights', evaluatorId, changes: { C2: 0.25 } })
  const revised = deriveGDSS(corrected)
  assert.ok(revised.weightValidation[evaluatorId].valid)
  assert.notDeepEqual(revised.topsis[evaluatorId].rankings, initial.topsis[evaluatorId].rankings)
  assert.notDeepEqual(revised.borda.rankings, initial.borda.rankings)
  assert.deepEqual(revised.topsis['dosen-wali'], initial.topsis['dosen-wali'])

  const editScore = { type: 'set-score', evaluatorId, alternativeId: 'A01', criterionId: 'C1' }
  assert.equal(gdssReducer(corrected, { ...editScore, score: 5 }), corrected)
  const rescored = gdssReducer(corrected, { ...editScore, score: 1 })
  assert.equal(rescored.sessions[evaluatorId].scores.A01.C1, 1)
  assert.notDeepEqual(deriveGDSS(rescored).topsis[evaluatorId].rankings, revised.topsis[evaluatorId].rankings)
  const locked = gdssReducer(rescored, { type: 'lock-evaluation', evaluatorId })
  assert.equal(locked.sessions[evaluatorId].status, 'terkunci')
  assert.equal(gdssReducer(locked, { ...editScore, score: 4 }), locked)
  assert.equal(gdssReducer(locked, { type: 'set-weights', evaluatorId, changes: { C1: 0.25 } }), locked)
  const lockedAll = evaluatorIds.reduce((state, id) => gdssReducer(state, { type: 'lock-evaluation', evaluatorId: id }), locked)
  assert.equal(deriveGDSS(lockedAll).allLocked, true)
  const quotaChange = gdssReducer(base, { type: 'set-quota', quota: 3 })
  assert.deepEqual(deriveGDSS(quotaChange).borda.selected, ['A04', 'A19', 'A08'])
})
