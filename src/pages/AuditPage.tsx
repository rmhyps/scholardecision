import { Activity, ClipboardList, Eye, RotateCcw, ShieldCheck, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading, EvaluationPanel, fieldStyle } from '../components/ui/EvaluationUi'
import { MetricCard } from '../components/ui/MetricCard'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { evaluators } from '../data/evaluators'
import { auditCategories, dayWIB, formatWIB, shortHash } from '../lib/auditTrail'
import type { AuditRecord } from '../lib/auditTrail'
import { approvalSteps } from '../lib/selectionWorkflow'
import { useGDSS } from '../state/GDSSContext'
import { useSelection } from '../state/SelectionContext'

const quickFilters = [
  { label: 'Semua', id: 'semua' }, { label: 'Finalisasi TOPSIS', id: 'topsis' },
  { label: 'Perubahan Bobot', id: 'bobot' }, { label: 'Perlu Tindakan', id: 'tindakan' },
] as const

const emptyFilters = { role: '', category: '', start: '', end: '' }

function actorName(actor: AuditRecord['actor']) {
  return evaluators.find(({ id }) => id === actor)?.name ?? 'Sistem GDSS'
}

export function AuditPage() {
  const { sessions } = useGDSS()
  const { audit, integrity, phase, auditError } = useSelection()
  const [filters, setFilters] = useState(emptyFilters)
  const [quick, setQuick] = useState<(typeof quickFilters)[number]['id']>('semua')
  const [selected, setSelected] = useState<AuditRecord | null>(null)
  const today = dayWIB(new Date().toISOString())
  const invalidRange = Boolean(filters.start && filters.end && filters.start > filters.end)
  const filtered = audit.filter((item) => {
    if (invalidRange || (filters.role && item.actor !== filters.role) || (filters.category && item.category !== filters.category)) return false
    const date = dayWIB(item.recordedAt)
    if ((filters.start && date < filters.start) || (filters.end && date > filters.end)) return false
    if (quick === 'topsis') return item.category === 'penilaian' && item.status === 'Terkunci'
    if (quick === 'bobot') return item.category === 'bobot'
    if (quick === 'tindakan') return item.status === 'Perlu Tindakan'
    return true
  }).reverse()
  const sessionCount = Object.keys(sessions).length
  const validChain = integrity === 'Terverifikasi' && audit.length > 0 && !auditError

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Riwayat Aktivitas & Log Sistem" description="Tinjau perubahan evaluasi, kuota, periode, profil, dan keputusan pada sesi simulasi ini.">
        <Badge tone={validChain ? 'active' : 'info'}>{validChain ? 'Rantai SHA-256 terverifikasi' : 'Audit simulasi'}</Badge>
      </EvaluationHeading>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Log Hari Ini" value={audit.filter(({ recordedAt }) => dayWIB(recordedAt) === today).length} icon={ClipboardList} />
        <MetricCard label="Status Sesi Penilai" value={Math.round(sessionCount / evaluators.length * 100) + '% Aktif'} detail={sessionCount + ' sesi simulasi tersedia'} icon={UsersRound} />
        <MetricCard label="Integritas Audit Log" value={validChain ? '100%' : integrity} detail={validChain ? 'SHA-256 seluruh entri valid' : 'Pemeriksaan rantai catatan'} icon={ShieldCheck} />
        <MetricCard label="Fase Saat Ini" value={approvalSteps[phase]} icon={Activity} tone="navy" />
      </dl>
      {auditError && <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">{auditError}</p>}

      <EvaluationPanel title="Filter Aktivitas">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium">Role Penilai
            <select className={fieldStyle} value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
              <option value="">Semua role</option>
              {evaluators.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              <option value="sistem">Sistem GDSS</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">Kategori
            <select className={fieldStyle} value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
              <option value="">Semua kategori</option>
              {Object.entries(auditCategories).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-1 text-sm font-medium">Tanggal Awal<input type="date" className={fieldStyle} value={filters.start} onChange={(event) => setFilters({ ...filters, start: event.target.value })} /></label>
          <label className="grid min-w-0 gap-1 text-sm font-medium">Tanggal Akhir<input type="date" className={fieldStyle} value={filters.end} onChange={(event) => setFilters({ ...filters, end: event.target.value })} /></label>
        </div>
        {invalidRange && <p role="alert" className="mt-2 text-sm text-orange-900">Tanggal akhir perlu sama dengan atau sesudah tanggal awal.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filter cepat">
          {quickFilters.map(({ id, label }) => (
            <Button key={id} variant={quick === id ? 'primary' : 'secondary'} aria-pressed={quick === id} onClick={() => setQuick(id)}>{label}</Button>
          ))}
          <Button variant="ghost" onClick={() => { setFilters(emptyFilters); setQuick('semua') }}><RotateCcw size={16} aria-hidden="true" /> Reset Filter</Button>
        </div>
      </EvaluationPanel>

      <EvaluationPanel title="Daftar Kronologi Audit GDSS" description="Setiap hash terkait dengan hash entri sebelumnya dalam rantai sesi browser.">
        <Table caption="Kronologi audit GDSS" className="min-w-[46rem]">
          <thead><tr>{['Waktu (WIB)', 'Pengguna / Peran', 'Aksi & Detail Transaksi', 'Status', 'Detail'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.hash} className="even:bg-slate-50">
                <td className="min-w-32 align-top tabular-nums">{formatWIB(item.recordedAt)}</td>
                <td className="align-top font-medium">{actorName(item.actor)}</td>
                <td className="min-w-56 align-top">
                  <p className="font-semibold">{item.action}</p>
                  <p className="mt-1 break-words text-slate-700">{item.detail}</p>
                  <p className="mt-1 font-mono text-xs text-slate-700">HASH: {shortHash(item.hash)}</p>
                </td>
                <td className="align-top"><Badge tone={item.status === 'Perlu Tindakan' || item.status === 'Draf' ? 'warning' : 'active'}>{item.status}</Badge></td>
                <td className="align-top">
                  <Button variant="ghost" aria-label={'Detail catatan ' + item.sequence} aria-haspopup="dialog" onClick={() => setSelected(item)}><Eye size={16} aria-hidden="true" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p role="status" className="mt-3 text-sm text-slate-700">{filtered.length ? filtered.length + ' entri ditampilkan.' : 'Tidak ada catatan yang cocok dengan filter.'}</p>
      </EvaluationPanel>

      <Modal open={selected !== null} title={selected?.action ?? 'Detail Audit'} onClose={() => setSelected(null)}>
        {selected && (
          <dl className="space-y-3 text-sm">
            <div><dt className="font-semibold">Waktu</dt><dd>{formatWIB(selected.recordedAt)}</dd></div>
            <div><dt className="font-semibold">Peran dan kategori</dt><dd>{actorName(selected.actor)} · {auditCategories[selected.category]}</dd></div>
            <div><dt className="font-semibold">Status</dt><dd>{selected.status}</dd></div>
            <div><dt className="font-semibold">Detail transaksi</dt><dd className="break-words">{selected.detail}</dd></div>
            <div><dt className="font-semibold">SHA-256</dt><dd className="break-all font-mono">{selected.hash}</dd></div>
            <div><dt className="font-semibold">Hash sebelumnya</dt><dd className="break-all font-mono">{selected.previousHash ?? 'Entri pertama'}</dd></div>
          </dl>
        )}
      </Modal>
    </div>
  )
}
