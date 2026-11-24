import { ArrowRight, ClipboardCheck, ListChecks, UsersRound } from 'lucide-react'
import { activePeriod, evaluators } from '../data/evaluators'
import { useGDSS } from '../state/GDSSContext'
import type { Evaluator } from '../types'
import { Badge } from '../components/ui/Badge'
import { MetricCard } from '../components/ui/MetricCard'
import { pages } from './index'
import type { PageId } from './index'

interface DashboardPageProps {
  evaluator: Evaluator
  onNavigate: (page: PageId) => void
}

const shortcuts = ['data-mahasiswa', 'bobot', 'penilaian'] as const

export function DashboardPage({ evaluator, onNavigate }: DashboardPageProps) {
  const { dataset: { alternatives, criteria } } = useGDSS()

  return (
    <div className="space-y-6">
      <section aria-labelledby="page-title" className="rounded-xl bg-navy-950 px-5 py-6 text-white sm:p-8">
        <Badge tone="active">Periode aktif</Badge>
        <h1 id="page-title" tabIndex={-1} className="mt-3 text-2xl font-semibold tracking-tight focus-visible:outline-teal-300 sm:text-3xl">
          Seleksi Beasiswa
        </h1>
        <p className="mt-2 text-sm text-slate-200 sm:text-base">{activePeriod}</p>
        <p className="mt-5 text-sm text-slate-200">Penilai simulasi: <strong className="font-semibold text-white">{evaluator.name}</strong></p>
      </section>

      <section aria-labelledby="ringkasan-data">
        <h2 id="ringkasan-data" className="mb-3 text-lg font-semibold">Ringkasan data simulasi</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Kandidat" value={alternatives.length} icon={UsersRound} />
          <MetricCard label="Kriteria" value={criteria.length} icon={ListChecks} />
          <MetricCard label="Penilai" value={evaluators.length} icon={ClipboardCheck} />
        </dl>
      </section>

      <section aria-labelledby="alur-penilaian">
        <h2 id="alur-penilaian" className="mb-3 text-lg font-semibold">Alur Penilaian</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {shortcuts.map((id) => {
            const { title, icon: Icon } = pages[id]
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  className="flex min-h-14 w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition-colors hover:border-teal-700 hover:bg-teal-50 motion-reduce:transition-none"
                >
                  <Icon size={17} aria-hidden="true" className="shrink-0 text-teal-800" />
                  <span className="flex-1">{title}</span>
                  <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-teal-800" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
