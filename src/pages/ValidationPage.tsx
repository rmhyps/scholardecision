import { ArrowRight, ClipboardCheck, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading, EvaluationPanel } from '../components/ui/EvaluationUi'
import { Modal } from '../components/ui/Modal'
import { WorkflowStepper } from '../components/ui/WorkflowStepper'
import { candidateDemoProfile } from '../data/candidateDemoProfiles'
import { evaluators } from '../data/evaluators'
import { formatWIB } from '../lib/auditTrail'
import { formatIPK, formatScore } from '../lib/gdssFormat'
import { approvalSteps, coordinator } from '../lib/selectionWorkflow'
import { useGDSS } from '../state/GDSSContext'
import { useSelection } from '../state/SelectionContext'
import type { Evaluator } from '../types'

export function ValidationPage({ evaluator, onReports }: { evaluator: Evaluator; onReports: () => void }) {
  const { dataset, sessions, borda, allLocked, quota } = useGDSS()
  const { phase, consensus, finalDecision, busy, runConsensus, finalize } = useSelection()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const canManage = evaluator.id === coordinator
  const current = finalDecision?.payload.borda ?? consensus?.borda ?? borda
  const eligible = canManage && allLocked && current && !current.pendingTie.length && !busy && !finalDecision
  const complete = evaluators.filter(({ id }) => sessions[id].status === 'terkunci').length
  const names = new Map(dataset.alternatives.map((candidate) => [candidate.id, candidate]))

  async function execute(action: 'consensus' | 'final') {
    setError('')
    try {
      if (action === 'consensus') await runConsensus(evaluator.id)
      else {
        await finalize(evaluator.id)
        setConfirm(false)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Proses gagal. Coba kembali.')
    }
  }

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Pengesahan Hasil Seleksi" description="Tinjau evaluasi ketiga penilai, jalankan konsensus Borda, lalu sahkan rekomendasi.">
        <Badge tone={finalDecision ? 'active' : 'info'}>{finalDecision ? 'Disahkan / Terkunci' : 'Akses pengesahan: Kemahasiswaan'}</Badge>
      </EvaluationHeading>
      <WorkflowStepper labels={approvalSteps} current={phase} complete={phase === 3} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)] xl:items-start">
        <EvaluationPanel title="Status Penyelesaian Ketiga Penilai" action={<Badge tone={allLocked ? 'active' : 'warning'}>{complete} / 3 selesai</Badge>}>
          <ul className="space-y-2">
            {evaluators.map(({ id, name }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 p-3">
                <span className="flex items-center gap-2 font-medium"><ClipboardCheck size={17} className="text-teal-800" aria-hidden="true" />{name}</span>
                <Badge tone={sessions[id].status === 'terkunci' ? 'active' : 'warning'}>{sessions[id].status === 'terkunci' ? 'Selesai' : 'Draf'}</Badge>
              </li>
            ))}
          </ul>
        </EvaluationPanel>

        <EvaluationPanel title="Hasil Konsensus Borda" description={finalDecision ? 'Rekomendasi final periode aktif.' : consensus ? 'Konsensus telah dijalankan. Penilai berwenang dapat mengesahkan hasil.' : 'Pratinjau rekomendasi dari perhitungan Borda.'} action={<Badge tone="info">Kuota {quota}</Badge>}>
          {!current && <p className="text-sm text-slate-700">Rekomendasi tersedia setelah bobot semua penilai valid.</p>}
          {current && current.pendingTie.length > 0 && (
            <p role="status" className="mb-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-900">
              {current.pendingTie.join(', ')} seri pada batas kuota. Selesaikan seri sebelum memfinalisasi hasil.
            </p>
          )}
          {current && current.selected.length === 0 && <p className="text-sm text-slate-700">Belum ada kandidat yang masuk kuota.</p>}
          <ul className="space-y-2">
            {current?.rankings.filter(({ status }) => status === 'lolos').map((ranking) => {
              const candidate = names.get(ranking.alternativeId)
              if (!candidate) return null
              const profile = candidateDemoProfile(candidate)
              return (
                <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                  <div>
                    <p className="font-semibold"><span className="mr-1 text-teal-800">{formatScore(ranking.rank)}.</span> {candidate.name}</p>
                    <p className="mt-1 text-xs text-slate-700">{candidate.id} · {profile.nim} · {profile.program} · IPK {formatIPK(candidate.referenceScores.C1)}</p>
                  </div>
                  <Badge tone="active">{formatScore(ranking.totalPoints)} poin</Badge>
                </li>
              )
            })}
          </ul>
        </EvaluationPanel>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        {finalDecision ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-teal-900"><LockKeyhole size={18} aria-hidden="true" /> Disahkan / Terkunci · {formatWIB(finalDecision.payload.approvedAt)}</p>
            <Button onClick={onReports}>Buka Berita Acara <ArrowRight size={16} aria-hidden="true" /></Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              {!canManage ? 'Peran Kemahasiswaan menjalankan konsensus dan pengesahan.' :
                !allLocked ? 'Ketiga penilai harus mengunci sesi sebelum konsensus.' :
                consensus ? 'Konsensus siap disahkan.' : 'Jalankan konsensus sebelum mengesahkan hasil.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void execute('consensus')} disabled={!eligible || !!consensus}>Jalankan Konsensus Borda</Button>
              <Button onClick={() => { setError(''); setConfirm(true) }} disabled={!eligible || !consensus} aria-haspopup="dialog">
                <ShieldCheck size={17} aria-hidden="true" /> Sahkan Hasil Akhir
              </Button>
            </div>
          </div>
        )}
        {busy && <p role="status" className="text-sm text-slate-700">Memproses hasil dan audit...</p>}
        {error && !confirm && <p role="alert" className="text-sm font-medium text-orange-900">{error}</p>}
      </div>

      <Modal open={confirm && !finalDecision} title="Konfirmasi Pengesahan Hasil Akhir" onClose={() => { if (!busy) setConfirm(false) }}>
        <p className="text-sm leading-relaxed text-slate-700">Apakah Anda yakin ingin mengesahkan hasil seleksi beasiswa? Tindakan ini bersifat final.</p>
        <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm font-semibold">{current?.selected.length ?? 0} kandidat masuk kuota.</p>
        {busy && <p role="status" className="mt-2 text-sm">Membentuk bukti digital simulasi...</p>}
        {error && <p role="alert" className="mt-2 text-sm text-orange-900">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Batal</Button>
          <Button disabled={busy} onClick={() => void execute('final')}>Ya, Sahkan</Button>
        </div>
      </Modal>
    </div>
  )
}
