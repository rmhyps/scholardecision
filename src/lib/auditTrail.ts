import { sha256 } from './demoCrypto'
import type { EvaluatorId } from '../types'

export const auditCategories = {
  akses: 'Akses',
  profil: 'Profil',
  bobot: 'Pembobotan',
  penilaian: 'Penilaian',
  periode: 'Periode',
  konsensus: 'Konsensus',
  pengesahan: 'Pengesahan',
} as const

export type AuditStatus = 'Draf' | 'Terkunci' | 'Tervalidasi' | 'Perlu Tindakan'

export interface AuditEvent {
  actor: EvaluatorId | 'sistem'
  category: keyof typeof auditCategories
  action: string
  detail: string
  status: AuditStatus
}

type AuditPayload = AuditEvent & {
  sequence: number
  recordedAt: string
  previousHash: string | null
}

export type AuditRecord = Readonly<AuditPayload & { hash: string }>

export async function createAuditRecord(event: AuditEvent, recordedAt: string, previous: AuditRecord | undefined) {
  const payload: AuditPayload = {
    sequence: (previous?.sequence ?? 0) + 1,
    recordedAt,
    ...event,
    previousHash: previous?.hash ?? null,
  }
  return { ...payload, hash: await sha256(JSON.stringify(payload)) }
}

export async function verifyAuditChain(records: readonly AuditRecord[]) {
  let previousHash: string | null = null
  for (const [index, record] of records.entries()) {
    const { hash, ...payload } = record
    if (payload.sequence !== index + 1 || payload.previousHash !== previousHash || hash !== await sha256(JSON.stringify(payload))) {
      return false
    }
    previousHash = hash
  }
  return true
}

const wibClock = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium',
})
const wibDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function formatWIB(iso: string) {
  return wibClock.format(new Date(iso)) + ' WIB'
}

export function dayWIB(iso: string) {
  const parts = wibDate.formatToParts(new Date(iso))
  return ['year', 'month', 'day'].map((kind) => parts.find((part) => part.type === kind)?.value).join('-')
}

export function shortHash(hash: string) {
  return hash.slice(0, 8) + '...' + hash.slice(-4)
}
