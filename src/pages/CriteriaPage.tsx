import { TrendingDown, TrendingUp } from 'lucide-react'
import { WeightDonut } from '../components/charts/EvaluationCharts'
import { Badge } from '../components/ui/Badge'
import { CriterionBadge, EvaluationHeading, EvaluationPanel } from '../components/ui/EvaluationUi'
import { Table } from '../components/ui/Table'
import { formatWeight } from '../lib/gdssFormat'
import { useGDSS } from '../state/GDSSContext'
import type { Evaluator } from '../types'

export function CriteriaPage({ evaluator }: { evaluator: Evaluator }) {
  const { dataset: { criteria }, sessions, weightValidation } = useGDSS()
  const { weights } = sessions[evaluator.id]
  const { total, valid } = weightValidation[evaluator.id]

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Data Kriteria Seleksi" description="Lima kriteria menentukan arah solusi ideal pada perhitungan TOPSIS.">
        <Badge tone="info">Penilai: {evaluator.name}</Badge>
      </EvaluationHeading>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(15rem,1fr)] xl:items-start">
        <EvaluationPanel title="Daftar Kriteria & Bobot Penilai" action={<Badge tone={valid ? 'active' : 'warning'}>Total Bobot: {formatWeight(total)}</Badge>}>
          <Table caption="Kriteria seleksi dan bobot penilai aktif" className="min-w-[35rem]">
            <thead>
              <tr>
                <th scope="col">Kode</th>
                <th scope="col">Kriteria</th>
                <th scope="col">Atribut</th>
                <th scope="col">Deskripsi Penilaian</th>
                <th scope="col" className="text-right">Bobot</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map(({ id, name, direction, description }) => (
                <tr key={id} className="even:bg-slate-50">
                  <th scope="row"><Badge tone="info">{id}</Badge></th>
                  <td className="min-w-24 font-medium">{name}</td>
                  <td><CriterionBadge direction={direction} /></td>
                  <td className="min-w-40 leading-relaxed text-slate-700">{description}</td>
                  <td className="min-w-20 text-right font-semibold tabular-nums">
                    {formatWeight(weights[id])}
                    <div aria-hidden="true" className="mt-1.5 h-1 rounded-full bg-blue-100">
                      <div className="h-full rounded-full bg-navy-950" style={{ width: formatWeight(weights[id]).replace(',', '.') }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </EvaluationPanel>
        <EvaluationPanel title="Proporsi Bobot">
          <WeightDonut criteria={criteria} weights={weights} />
        </EvaluationPanel>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <EvaluationPanel title="Atribut Benefit" className="bg-blue-50">
          <p className="flex gap-2 text-sm leading-relaxed text-slate-700">
            <TrendingUp size={18} className="shrink-0 text-teal-800" aria-hidden="true" />
            Nilai lebih tinggi diprioritaskan. Ini berlaku untuk IPK, tanggungan, prestasi, dan semester pada simulasi.
          </p>
        </EvaluationPanel>
        <EvaluationPanel title="Atribut Cost" className="bg-blue-50">
          <p className="flex gap-2 text-sm leading-relaxed text-slate-700">
            <TrendingDown size={18} className="shrink-0 text-orange-800" aria-hidden="true" />
            Nilai lebih rendah diprioritaskan. Ini berlaku untuk penghasilan orang tua atau wali per bulan.
          </p>
        </EvaluationPanel>
      </div>
    </div>
  )
}
