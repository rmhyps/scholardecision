import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatWIB, shortHash } from './auditTrail'
import { downloadFile } from './csv'
import { formatIPK, formatWeight } from './gdssFormat'
import { concordanceLabel, institution, reportNotice, reportStatusLabels, reportTitle } from './reportData'
import type { ReportRows } from './reportData'
import type { FinalDecision } from './selectionWorkflow'
import { criterionIds } from '../types'

type TableDocument = jsPDF & { lastAutoTable: { finalY: number } }

export function exportReportPdf(decision: FinalDecision, rows: ReportRows) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as TableDocument
  const { payload, hash, signatures } = decision
  let y = 20
  doc.setProperties({ title: reportTitle, subject: reportNotice, creator: 'ScholarDecision' })

  function paragraph(value: string, space = 3) {
    const lines: string[] = doc.splitTextToSize(value, 178)
    doc.text(lines, 16, y)
    y += lines.length * 4 + space
  }

  doc.setFont('times', 'bold')
  doc.setFontSize(10)
  doc.text(institution[0], 105, y, { align: 'center' })
  y += 6
  doc.setFontSize(15)
  doc.text(institution[1], 105, y, { align: 'center' })
  y += 5
  doc.setFontSize(11)
  doc.text(institution[2], 105, y, { align: 'center' })
  y += 4
  doc.setLineWidth(0.65)
  doc.line(16, y, 194, y)
  y += 7
  doc.setFontSize(10)
  doc.setTextColor(13, 108, 86)
  doc.text(reportNotice, 105, y, { align: 'center' })
  doc.setTextColor(15, 23, 42)
  y += 7
  paragraph(reportTitle)
  doc.setFont('times', 'normal')
  paragraph('Nomor: ' + payload.number + ' | Periode: ' + payload.periodName)
  paragraph('Rapat konsensus: ' + formatWIB(payload.ranAt) + '. Pengesahan: ' + formatWIB(payload.approvedAt) + '.')
  paragraph('Ketiga evaluator mengunci peringkat TOPSIS. Borda menggabungkan peringkat tersebut untuk merekomendasikan ' + payload.borda.selected.length + ' penerima pada kuota ' + payload.borda.quota + ' mahasiswa.')
  paragraph('Kendall W: ' + concordanceLabel(payload.concordance) + ' | Cakupan penilaian: 100% (3/3 penilai)')

  autoTable(doc, {
    startY: y,
    margin: { top: 16, bottom: 16, left: 16, right: 16 },
    head: [['Rank', 'Kode', 'Nama', 'NIM / Prodi', 'IPK', 'Poin', 'Rekomendasi']],
    body: rows.map((row) => [row.rank, row.code, row.name, row.nim + '\n' + row.program, formatIPK(row.ipk), row.points, reportStatusLabels[row.status]]),
    rowPageBreak: 'avoid',
    styles: { fontSize: 8.5, cellPadding: 1.6, overflow: 'linebreak' },
    headStyles: { fillColor: [16, 40, 71] },
    columnStyles: { 0: { cellWidth: 11 }, 1: { cellWidth: 12 }, 4: { cellWidth: 13 }, 5: { cellWidth: 13 } },
    didParseCell: ({ row, cell, section }) => {
      if (section === 'body' && rows[row.index]?.status === 'lolos') cell.styles.fillColor = [227, 250, 242]
    },
  })

  y = doc.lastAutoTable.finalY + 9
  if (y + 45 > 281) { doc.addPage(); y = 20 }
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  paragraph('Ringkasan Bobot Penilai')
  autoTable(doc, {
    startY: y,
    margin: { top: 16, bottom: 16, left: 16, right: 16 },
    head: [['Penilai', ...criterionIds]],
    body: payload.signers.map(({ role, weights }) => [role, ...criterionIds.map((id) => formatWeight(weights[id]))]),
    styles: { fontSize: 8.5, cellPadding: 1.6 },
    headStyles: { fillColor: [16, 40, 71] },
  })

  y = doc.lastAutoTable.finalY + 9
  if (y + 55 > 281) { doc.addPage(); y = 20 }
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  paragraph('Lembar Pengesahan Digital')
  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  for (const signer of payload.signers) {
    const signature = signatures.find(({ evaluatorId }) => evaluatorId === signer.id)
    paragraph(signer.role + ': ' + signer.name + ' | ECDSA P-256: ' + (signature ? shortHash(signature.signature) : '-'), 1)
  }
  paragraph('Stempel rektorat simulasi | SHA-256 data keputusan:', 1)
  paragraph(hash, 1)
  paragraph('Payload dan kunci publik tersedia pada unduhan bukti digital ScholarDecision.', 0)

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(64, 80, 98)
    doc.text(reportNotice, 16, 289)
    doc.text(page + ' / ' + pageCount, 194, 289, { align: 'right' })
  }

  downloadFile(doc.output('blob'), 'Berita-Acara-Simulasi-' + payload.periodCode + '.pdf')
}
