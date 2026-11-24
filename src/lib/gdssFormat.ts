import type { CriterionId } from '../types'

export const criterionLabels: Record<CriterionId, string> = {
  C1: 'IPK',
  C2: 'Penghasilan',
  C3: 'Tanggungan',
  C4: 'Prestasi',
  C5: 'Semester',
}

const twoDecimals = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const precision = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const percentage = new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export const formatIPK = (value: number) => twoDecimals.format(value)
export const formatPrecision = (value: number) => precision.format(value)
export const formatIDR = (value: number) => amount.format(value)
export const formatWeight = (value: number) => percentage.format(value)
export const formatScore = (value: number) => compact.format(value)
