import { ArrowRight, BarChart3, Eye, EyeOff, GraduationCap, Landmark, LockKeyhole, Mail, ShieldCheck, UsersRound } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { fieldStyle } from '../components/ui/EvaluationUi'
import { Modal } from '../components/ui/Modal'
import { demoPassword } from '../data/demoAccounts'
import { evaluators } from '../data/evaluators'
import { useSelection } from '../state/SelectionContext'
import type { EvaluatorId } from '../types'

const roleCards = [
  { title: 'Kemahasiswaan', description: 'Verifikasi & prestasi', icon: GraduationCap },
  { title: 'Dosen Wali', description: 'Rekomendasi akademik', icon: UsersRound },
  { title: 'Pengelola Beasiswa', description: 'Kelayakan & berkas', icon: ShieldCheck },
]

export function LoginPage({ onLogin }: {
  onLogin: (id: EvaluatorId, remember: boolean) => void
}) {
  const { profiles, authenticate, resetPassword } = useSelection()
  const [email, setEmail] = useState('')
  const [demoRole, setDemoRole] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryError, setRecoveryError] = useState('')

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try { onLogin(await authenticate(email, password), remember) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Login demo gagal.') }
    finally { setBusy(false) }
  }

  function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      resetPassword(recoveryEmail)
      setEmail(recoveryEmail.trim())
      setDemoRole('')
      setPassword('')
      setNotice('Kata sandi demo bawaan telah dipulihkan.')
      setRecoveryOpen(false)
    } catch (cause) {
      setRecoveryError(cause instanceof Error ? cause.message : 'Pemulihan gagal.')
    }
  }

  return (
    <main id="konten-utama" className="grid min-h-dvh items-center px-4 py-8 sm:p-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <section className="flex flex-col justify-between gap-8 bg-navy-950 p-6 text-white sm:p-9 lg:p-12" aria-label="Tentang ScholarDecision">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-teal-100 text-teal-900"><Landmark size={25} aria-hidden="true" /></span>
              <div><p className="text-xs font-semibold tracking-widest text-teal-200">GDSS PLATFORM</p><p className="text-2xl font-semibold tracking-tight">ScholarDecision</p></div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-200">Sistem pendukung keputusan kelompok untuk seleksi beasiswa dengan TOPSIS dan Borda.</p>
          </div>
          <div className="grid gap-4 rounded-xl border border-slate-600 bg-[#071a31] p-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <div aria-hidden="true" className="flex h-16 items-end justify-center gap-1.5 self-center">
              {[24, 36, 49, 63].map((height, index) => <span key={height} className={'w-3 rounded-t ' + (index === 3 ? 'bg-teal-200' : 'bg-teal-600')} style={{ height }} />)}
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold"><BarChart3 size={18} className="text-teal-200" aria-hidden="true" /> Analisis Konsensus Kelompok</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">Gabungkan peringkat individual menjadi rekomendasi kelompok yang dapat diperiksa.</p>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Tiga Peran Penilai</h2>
            <ul className="grid gap-2 sm:grid-cols-3">
              {roleCards.map(({ title, description, icon: Icon }) => (
                <li key={title} className="rounded-lg bg-navy-900 p-3">
                  <Icon size={18} className="text-teal-200" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-slate-200">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="p-6 sm:p-9 lg:p-12">
          <Badge tone="active">Portal Akademik · Simulasi</Badge>
          <h1 id="page-title" tabIndex={-1} className="mt-3 text-3xl font-semibold tracking-tight text-navy-950">Masuk ke Akun Anda</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">Gunakan akun demo untuk membuka ruang kerja evaluasi.</p>
          <form className="mt-5 space-y-4" onSubmit={login}>
            <label className="block text-sm font-medium">Email Institusi
              <span className="relative mt-1 block">
                <Mail aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3.5 text-slate-600" />
                <input type="email" required autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setDemoRole('') }} className={fieldStyle + ' pl-10'} placeholder="nama@unc.example" />
              </span>
            </label>
            <div>
              <label htmlFor="portal-password" className="text-sm font-medium">Kata Sandi</label>
              <div className="relative mt-1">
                <LockKeyhole aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3.5 text-slate-600" />
                <input id="portal-password" type={visible ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setDemoRole('') }} className={fieldStyle + ' pl-10 pr-12'} />
                <Button variant="ghost" className="absolute inset-y-0 right-0 w-11 px-0" aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setVisible(!visible)}>
                  {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="flex min-h-11 items-center gap-2 text-sm"><input className="size-4 accent-teal-700" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Ingat saya</label>
              <Button variant="ghost" className="px-2 text-teal-900" onClick={() => { setRecoveryEmail(email); setRecoveryError(''); setRecoveryOpen(true) }} aria-haspopup="dialog">Lupa password?</Button>
            </div>
            {error && <p role="alert" className="text-sm text-orange-900">{error}</p>}
            {notice && <p role="status" className="text-sm text-teal-900">{notice}</p>}
            <Button type="submit" disabled={busy} className="w-full bg-navy-950 hover:bg-navy-900">
              {busy ? 'Memeriksa...' : 'Masuk'} <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </form>
          <label className="mt-4 grid gap-1 text-sm font-medium">Isi Akun Demo
            <select className={fieldStyle} value={demoRole} onChange={(event) => {
              setDemoRole(event.target.value)
              const role = evaluators.find(({ id }) => id === event.target.value)
              if (role) { setEmail(profiles[role.id].email); setPassword(demoPassword); setError(''); setNotice('') }
            }}>
              <option value="">Pilih peran penilai demo</option>
              {evaluators.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
        </section>
      </div>

      <Modal open={recoveryOpen} title="Pemulihan Kata Sandi Demo" onClose={() => setRecoveryOpen(false)}>
        <p className="mb-3 text-sm text-slate-700">Pulihkan kata sandi bawaan akun simulasi di tab ini.</p>
        <form className="space-y-3" onSubmit={recover}>
          <label className="grid gap-1 text-sm font-medium">Email akun demo<input className={fieldStyle} type="email" required value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} /></label>
          {recoveryError && <p role="alert" className="text-sm text-orange-900">{recoveryError}</p>}
          <Button type="submit">Pulihkan Kata Sandi</Button>
        </form>
      </Modal>
    </main>
  )
}
