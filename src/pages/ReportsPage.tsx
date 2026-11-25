import { Download, FileSpreadsheet, Landmark, Printer, ShieldCheck, Stamp } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading } from '../components/ui/EvaluationUi'
import { activePeriod, evaluators } from '../data/evaluators'
import { formatWIB, shortHash } from '../lib/auditTrail'
import { formatIPK, formatScore, formatWeight } from '../lib/gdssFormat'
import { concordanceLabel, institution, reportCsv, reportNotice, reportStatusLabels, reportTitle, toReportRows } from '../lib/reportData'
import { downloadCsv, downloadFile } from '../lib/csv'
import { activePeriodCode, documentNumber, kendallW, reportSigners } from '../lib/selectionWorkflow'
import { useGDSS } from '../state/GDSSContext'
import { useSelection } from '../state/SelectionContext'
import { criterionIds } from '../types'

export function ReportsPage() {
  const { dataset, sessions, topsis, borda, quota } = useGDSS()
  const { profiles, consensus, finalDecision } = useSelection()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const payload = finalDecision?.payload
  const number = payload?.number ?? documentNumber
  const periodCode = payload?.periodCode ?? activePeriodCode
  const result = payload?.borda ?? consensus?.borda ?? borda
  const rows = toReportRows(dataset.alternatives, result)
  const signers = payload?.signers ?? reportSigners(profiles, sessions, {})
  const completed = payload ? evaluators.length : evaluators.filter(({ id }) => sessions[id].status === 'terkunci').length
  const agreement = payload ? payload.concordance : kendallW(topsis)
  const meeting = payload?.ranAt ?? consensus?.ranAt

  async function pdf() {
    if (!finalDecision || exporting) return
    setExporting(true)
    setError('')
    try {
      const { exportReportPdf } = await import('../lib/reportPdf')
      exportReportPdf(finalDecision, rows)
    } catch {
      setError('Ekspor PDF gagal. Coba kembali atau gunakan Cetak Laporan.')
    } finally { setExporting(false) }
  }

  function csv() {
    downloadCsv(reportCsv(rows, number, !!payload, topsis), 'Rekap-Simulasi-' + periodCode + '.csv')
  }

  function proof() {
    if (finalDecision) {
      downloadFile(new Blob([JSON.stringify(finalDecision, null, 2)], { type: 'application/json' }), 'Bukti-Digital-Simulasi-' + periodCode + '.json')
    }
  }

  return (
    <div className="report-page space-y-5">
      <div className="report-toolbar space-y-3">
        <EvaluationHeading title="Laporan & Berita Acara Seleksi Beasiswa" description="Cetak naskah keputusan simulasi atau unduh rekap peringkat dan bukti digital.">
          <Badge tone={payload ? 'active' : 'warning'}>{payload ? 'Disahkan / Terkunci' : 'Draf berita acara'}</Badge>
        </EvaluationHeading>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Cetak Laporan</Button>
          <Button variant="secondary" onClick={csv} disabled={!rows.length}><FileSpreadsheet size={17} aria-hidden="true" /> Ekspor Excel/CSV</Button>
          <Button onClick={() => void pdf()} disabled={!payload || exporting}><Download size={17} aria-hidden="true" />{exporting ? 'Membuat PDF...' : 'Ekspor PDF Resmi'}</Button>
          {finalDecision && <Button variant="ghost" onClick={proof}><ShieldCheck size={17} aria-hidden="true" /> Unduh Bukti Digital</Button>}
        </div>
        {!payload && <p className="text-sm text-slate-700">PDF final dan bukti digital tersedia setelah hasil disahkan.</p>}
        {error && <p role="alert" className="text-sm text-orange-900">{error}</p>}
      </div>

      <article className="report-document mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-4 sm:p-8" aria-label="Dokumen Berita Acara">
        <header className="report-letterhead border-b-4 border-navy-950 pb-4 text-center text-navy-950">
          <Landmark size={30} className="mx-auto mb-2 text-teal-800" aria-hidden="true" />
          <p className="text-xs font-semibold tracking-wide">{institution[0]}</p>
          <p className="mt-1 text-xl font-bold">{institution[1]}</p>
          <p className="mt-1 text-sm">{institution[2]}</p>
        </header>

        <div className="report-intro my-5 text-center">
          <p className="text-xs font-bold tracking-wide text-teal-900">{reportNotice}</p>
          <h2 className="mt-2 text-lg font-bold text-navy-950">{reportTitle}</h2>
          <p className="mt-1 text-sm">Nomor {number} · {payload?.periodName ?? activePeriod}</p>
          <p className="mt-1 text-sm font-semibold">{payload ? 'Disahkan / Terkunci' : 'Draf'}</p>
        </div>

        <dl className="report-summary grid gap-2 rounded-lg bg-blue-50 p-3 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-700">Rapat konsensus GDSS</dt><dd className="font-semibold">{meeting ? formatWIB(meeting) : 'Belum dijalankan'}</dd></div>
          <div><dt className="text-slate-700">Kuota penerima</dt><dd className="font-semibold">{payload?.borda.quota ?? quota} mahasiswa</dd></div>
          <div><dt className="text-slate-700">Pengesahan</dt><dd className="font-semibold">{payload ? formatWIB(payload.approvedAt) : 'Menunggu pengesahan'}</dd></div>
        </dl>
        <p className="my-4 text-sm leading-relaxed">
          {payload
            ? 'Tiga penilai telah mengunci peringkat individual TOPSIS. Konsensus Borda menetapkan ' + payload.borda.selected.length + ' rekomendasi penerima beasiswa pada periode simulasi ini.'
            : 'Rekap ini memuat hasil sementara pemeringkatan individual TOPSIS dan agregasi poin Borda.'}
          {' '}Poin per penilai dihitung dari jumlah kandidat dikurangi peringkat individual.
        </p>

        <div className="report-table-wrapper overflow-x-auto" role="region" aria-label="Tabel rekomendasi berita acara" tabIndex={0}>
          <table className="report-table w-full min-w-[39rem] border-collapse text-left text-sm">
            <caption className="sr-only">Rekapitulasi rekomendasi penerima beasiswa</caption>
            <thead><tr className="bg-navy-950 text-white">{['Rank', 'Kode', 'Nama', 'NIM & Prodi', 'IPK', 'Poin Borda', 'Rekomendasi'].map((name) => <th key={name} scope="col" className="p-2">{name}</th>)}</tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className={row.status === 'lolos' ? 'bg-teal-50' : 'even:bg-slate-50'}>
                  <td className="border-b border-slate-200 p-2 tabular-nums">{formatScore(row.rank)}</td>
                  <th scope="row" className="border-b border-slate-200 p-2">{row.code}</th>
                  <td className="border-b border-slate-200 p-2">{row.name}</td>
                  <td className="border-b border-slate-200 p-2">{row.nim}<br /><span className="text-xs">{row.program}</span></td>
                  <td className="border-b border-slate-200 p-2 tabular-nums">{formatIPK(row.ipk)}</td>
                  <td className="border-b border-slate-200 p-2 font-semibold">{formatScore(row.points)}</td>
                  <td className="border-b border-slate-200 p-2">{reportStatusLabels[row.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="mt-2 text-sm text-slate-700">Rekomendasi tersedia setelah bobot seluruh evaluator valid.</p>}

        <section className="report-block mt-5" aria-labelledby="report-weights">
          <h3 id="report-weights" className="font-semibold text-navy-950">Ringkasan Bobot dan Validitas Konsensus</h3>
          <p className="mt-2 text-sm">Kendall W <strong>{concordanceLabel(agreement)}</strong> · Cakupan penilaian <strong>{formatWeight(completed / evaluators.length)}</strong> ({completed} / {evaluators.length} sesi terkunci).</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {signers.map(({ id, role, weights }) => (
              <div key={id} className="rounded-lg border border-slate-200 p-3 text-xs">
                <p className="mb-2 font-semibold">{role}</p>
                <dl className="grid grid-cols-[repeat(auto-fit,minmax(2.75rem,1fr))] gap-x-1 gap-y-2">
                  {criterionIds.map((criterion) => <div key={criterion}><dt>{criterion}</dt><dd className="font-semibold">{formatWeight(weights[criterion])}</dd></div>)}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="report-block mt-5 space-y-3" aria-labelledby="report-signatures">
          <h3 id="report-signatures" className="text-sm font-bold text-navy-950">Lembar Pengesahan Digital Terintegrasi</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {signers.map((signer) => {
              const signature = finalDecision?.signatures.find(({ evaluatorId }) => evaluatorId === signer.id)
              return (
                <div key={signer.id} className="rounded-lg border border-slate-200 bg-blue-50 p-3 text-xs">
                  <p className="font-semibold">{signer.role}</p><p className="mt-1 break-words">{signer.name}</p>
                  <p className="mt-2 font-mono">{signature ? 'ECDSA: ' + shortHash(signature.signature) : 'Menunggu pengesahan'}</p>
                </div>
              )
            })}
            <div className="flex flex-col justify-center rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-950">
              <Stamp size={20} aria-hidden="true" /><p className="mt-1 font-bold">Stempel Rektorat Simulasi</p>
              <p>{payload ? 'Disahkan dalam demo' : 'Menunggu pengesahan'}</p>
            </div>
          </div>
          <p className="rounded-lg border border-slate-200 p-3 text-xs">
            <strong className="mr-1">SHA-256 data keputusan</strong>
            <code className="break-all">{finalDecision?.hash ?? 'Tersedia setelah pengesahan'}</code>
          </p>
        </section>
      </article>
    </div>
  )
}
