import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { demoPassword, demoProfiles } from '../data/demoAccounts'
import type { DemoProfile } from '../data/demoAccounts'
import { evaluators } from '../data/evaluators'
import { createAuditRecord, verifyAuditChain } from '../lib/auditTrail'
import type { AuditEvent, AuditRecord } from '../lib/auditTrail'
import { makePasswordRecord, passwordMatches } from '../lib/demoCrypto'
import type { PasswordRecord } from '../lib/demoCrypto'
import { activePeriodCode, coordinator, createFinalDecision, periodExamples, reportSigners } from '../lib/selectionWorkflow'
import type { ConsensusRecord, FinalDecision, PeriodDraft, Phase } from '../lib/selectionWorkflow'
import { criterionIds, evaluatorIds } from '../types'
import type { EvaluatorId } from '../types'
import { useGDSS } from './GDSSContext'

type ProfileUpdates = Pick<DemoProfile, 'name' | 'email' | 'telephone' | 'photo'>
type AccountActivity = Partial<Record<EvaluatorId, string>>
type Integrity = 'Memeriksa' | 'Terverifikasi' | 'Gagal'

interface SelectionContextValue {
  profiles: Readonly<Record<EvaluatorId, DemoProfile>>
  lastLogin: Readonly<AccountActivity>
  drafts: readonly PeriodDraft[]
  finalDecision: FinalDecision | null
  consensus: ConsensusRecord | null
  phase: Phase
  busy: boolean
  audit: readonly AuditRecord[]
  integrity: Integrity
  auditError: string
  track: (event: AuditEvent) => Promise<boolean>
  authenticate: (email: string, password: string) => Promise<EvaluatorId>
  resetPassword: (email: string) => void
  updateProfile: (id: EvaluatorId, updates: ProfileUpdates) => void
  updatePassword: (id: EvaluatorId, current: string, next: string) => Promise<void>
  addDraft: (actor: EvaluatorId, draft: PeriodDraft) => void
  changeQuota: (actor: EvaluatorId, quota: number) => void
  runConsensus: (actor: EvaluatorId) => Promise<void>
  finalize: (actor: EvaluatorId) => Promise<void>
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export function SelectionProvider({ children }: { children: ReactNode }) {
  const { dataset, sessions, topsis, borda, quota, allLocked, setQuota, freezeQuota } = useGDSS()
  const [profiles, setProfiles] = useState(demoProfiles)
  const [lastLogin, setLastLogin] = useState<AccountActivity>({})
  const credentials = useRef<Partial<Record<EvaluatorId, PasswordRecord>>>({})
  const lockedAt = useRef<AccountActivity>({})
  const [drafts, setDrafts] = useState<readonly PeriodDraft[]>([])
  const [consensus, setConsensus] = useState<ConsensusRecord | null>(null)
  const [finalDecision, setFinalDecision] = useState<FinalDecision | null>(null)
  const [busy, setBusy] = useState(false)
  const inTransaction = useRef(false)
  const [audit, setAudit] = useState<readonly AuditRecord[]>([])
  const auditRef = useRef<readonly AuditRecord[]>([])
  const auditQueue = useRef(Promise.resolve())
  const [auditError, setAuditError] = useState('')
  const [integrity, setIntegrity] = useState<Integrity>('Memeriksa')
  const previousSessions = useRef(sessions)
  const initialized = useRef(false)

  const track = useCallback((event: AuditEvent) => {
    const recordedAt = new Date().toISOString()
    const job = auditQueue.current.then(async () => {
      const record = await createAuditRecord(event, recordedAt, auditRef.current.at(-1))
      const chain = [...auditRef.current, record]
      auditRef.current = chain
      setAudit(chain)
      setAuditError('')
      return true
    }).catch(() => {
      setAuditError('Transaksi terakhir gagal dicatat. Periksa dukungan Web Crypto melalui localhost atau HTTPS.')
      return false
    })
    auditQueue.current = job.then(() => undefined)
    return job
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void track({
      actor: 'sistem', category: 'akses', action: 'Inisialisasi periode simulasi',
      detail: activePeriodCode + ' memuat tiga sesi evaluasi.', status: 'Tervalidasi',
    })
  }, [track])

  useEffect(() => {
    const previous = previousSessions.current
    previousSessions.current = sessions
    for (const { id, name } of evaluators) {
      const before = previous[id]
      const current = sessions[id]
      if (before === current) continue
      if (criterionIds.some((criterion) => current.weights[criterion] !== before.weights[criterion])) {
        const label = criterionIds.map((criterion) => criterion + ' ' + Math.round(current.weights[criterion] * 10000) / 100 + '%')
        void track({
          actor: id, category: 'bobot', action: 'Menyimpan bobot kriteria',
          detail: label.join(', '), status: 'Tervalidasi',
        })
      }
      if (before.status !== current.status && current.status === 'terkunci') {
        lockedAt.current[id] = new Date().toISOString()
        void track({
          actor: id, category: 'penilaian', action: 'Finalisasi TOPSIS',
          detail: name + ' mengunci nilai dan bobot untuk ' + dataset.alternatives.length + ' kandidat.', status: 'Terkunci',
        })
      }
    }
  }, [sessions, dataset, track])

  useEffect(() => {
    let current = true
    void verifyAuditChain(audit).then((valid) => {
      if (current) setIntegrity(valid ? 'Terverifikasi' : 'Gagal')
    }).catch(() => {
      if (current) setIntegrity('Gagal')
    })
    return () => { current = false }
  }, [audit])

  const latestConsensus = consensus?.borda === borda ? consensus : null
  const phase: Phase = finalDecision ? 3 : latestConsensus ? 2 : allLocked ? 1 : 0

  function findAccount(email: string) {
    const normalized = email.trim().toLowerCase()
    return evaluatorIds.find((id) => profiles[id].email.toLowerCase() === normalized)
  }

  function checkPassword(id: EvaluatorId, password: string) {
    const saved = credentials.current[id]
    return saved ? passwordMatches(password, saved) : Promise.resolve(password === demoPassword)
  }

  async function authenticate(email: string, password: string) {
    const id = findAccount(email)
    if (!id || !await checkPassword(id, password)) throw new Error('Email atau kata sandi demo tidak cocok.')
    setLastLogin((previous) => ({ ...previous, [id]: new Date().toISOString() }))
    void track({ actor: id, category: 'akses', action: 'Masuk portal akademik', detail: 'Sesi demo berhasil dibuka.', status: 'Tervalidasi' })
    return id
  }

  function resetPassword(email: string) {
    const id = findAccount(email)
    if (!id) throw new Error('Gunakan email akun demo yang terdaftar.')
    delete credentials.current[id]
    void track({ actor: id, category: 'akses', action: 'Pemulihan kata sandi demo', detail: 'Kredensial bawaan simulasi dipulihkan di tab ini.', status: 'Tervalidasi' })
  }

  function updateProfile(id: EvaluatorId, updates: ProfileUpdates) {
    const name = updates.name.trim()
    const email = updates.email.trim().toLowerCase()
    const telephone = updates.telephone.trim()
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Isi nama dan alamat email yang valid.')
    if (telephone && !/^\+?[\d ()-]{7,22}$/.test(telephone)) throw new Error('Masukkan nomor telepon demo yang valid.')
    if (evaluatorIds.some((other) => other !== id && profiles[other].email === email)) throw new Error('Email tersebut sudah digunakan penilai lain.')
    setProfiles((previous) => ({ ...previous, [id]: { ...previous[id], ...updates, name, email, telephone } }))
    void track({ actor: id, category: 'profil', action: 'Memperbarui profil', detail: 'Informasi identitas demo penilai diperbarui.', status: 'Tervalidasi' })
  }

  async function updatePassword(id: EvaluatorId, current: string, next: string) {
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) throw new Error('Kata sandi baru perlu minimal 8 karakter, termasuk huruf dan angka.')
    if (!await checkPassword(id, current)) throw new Error('Kata sandi saat ini tidak cocok.')
    credentials.current[id] = await makePasswordRecord(next)
    void track({ actor: id, category: 'profil', action: 'Memperbarui kata sandi demo', detail: 'Kredensial demo diganti di tab ini.', status: 'Tervalidasi' })
  }

  function addDraft(actor: EvaluatorId, draft: PeriodDraft) {
    const code = draft.code.trim().toUpperCase()
    const name = draft.name.trim()
    const knownCodes = [activePeriodCode, ...periodExamples.map((period) => period.code), ...drafts.map((period) => period.code)]
    if (!/^[A-Z0-9-]{3,24}$/.test(code) || !name || knownCodes.includes(code)) {
      throw new Error('Gunakan kode unik (3-24 huruf, angka, atau tanda hubung) dan isi nama periode.')
    }
    if (!draft.startsOn || !draft.endsOn || draft.startsOn > draft.endsOn) throw new Error('Tanggal mulai harus sama dengan atau mendahului tanggal selesai.')
    if (!Number.isInteger(draft.quota) || draft.quota < 1 || draft.quota > dataset.alternatives.length) {
      throw new Error('Kuota harus di antara 1 dan ' + dataset.alternatives.length + '.')
    }
    setDrafts((previous) => [...previous, { ...draft, code, name }])
    void track({ actor, category: 'periode', action: 'Membuat draf periode', detail: code + ' - ' + name + ' (kuota ' + draft.quota + ').', status: 'Draf' })
  }

  function changeQuota(actor: EvaluatorId, next: number) {
    if (inTransaction.current || finalDecision || !Number.isInteger(next) || next === quota || next < 1 || next > dataset.alternatives.length) return
    const boundary = borda?.rankings[next - 1]
    const tied = boundary && borda.rankings.filter(({ rank }) => rank === boundary.rank)
    const pending = tied && boundary.rank + tied.length - 1 > next ? tied : []
    setQuota(next)
    setConsensus(null)
    void track({
      actor, category: 'periode', action: 'Memperbarui kuota penerima',
      detail: 'Kuota berubah dari ' + quota + ' menjadi ' + next + (pending.length ? '. Seri batas kuota: ' + pending.map(({ alternativeId }) => alternativeId).join(', ') + '.' : '.'),
      status: pending.length ? 'Perlu Tindakan' : 'Tervalidasi',
    })
  }

  function requireCoordinator(actor: EvaluatorId) {
    if (actor !== coordinator) throw new Error('Aksi ini tersedia untuk peran Kemahasiswaan.')
    if (inTransaction.current || finalDecision) throw new Error('Hasil sedang diproses atau sudah disahkan.')
    if (!allLocked || !borda) throw new Error('Ketiga sesi penilai perlu terkunci terlebih dahulu.')
    if (borda.pendingTie.length) throw new Error('Selesaikan seri batas kuota sebelum melanjutkan.')
    return borda
  }

  async function runConsensus(actor: EvaluatorId) {
    const current = requireCoordinator(actor)
    inTransaction.current = true
    setBusy(true)
    try {
      const ranAt = new Date().toISOString()
      if (!await track({
        actor, category: 'konsensus', action: 'Menjalankan konsensus Borda',
        detail: 'Kuota ' + quota + ': ' + current.selected.join(', ') + '.', status: 'Tervalidasi',
      })) throw new Error('Pencatatan konsensus gagal. Coba kembali.')
      setConsensus({ borda: current, ranAt })
    } finally {
      inTransaction.current = false
      setBusy(false)
    }
  }

  async function finalize(actor: EvaluatorId) {
    requireCoordinator(actor)
    if (!latestConsensus) throw new Error('Jalankan konsensus untuk kuota saat ini terlebih dahulu.')
    inTransaction.current = true
    setBusy(true)
    try {
      const result = await createFinalDecision(latestConsensus, reportSigners(profiles, sessions, lockedAt.current), topsis)
      if (!await track({
        actor, category: 'pengesahan', action: 'Mengesahkan hasil akhir',
        detail: result.payload.number + '. SHA-256 berita acara: ' + result.hash, status: 'Terkunci',
      })) throw new Error('Pencatatan pengesahan gagal. Coba kembali.')
      freezeQuota()
      setFinalDecision(result)
    } finally {
      inTransaction.current = false
      setBusy(false)
    }
  }

  return (
    <SelectionContext.Provider value={{
      profiles, lastLogin, drafts, finalDecision, consensus: latestConsensus,
      phase, busy, audit, integrity, auditError, track,
      authenticate, resetPassword, updateProfile, updatePassword, addDraft,
      changeQuota, runConsensus, finalize,
    }}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  const value = useContext(SelectionContext)
  if (!value) throw new Error('SelectionProvider belum terpasang.')
  return value
}
