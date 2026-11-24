import { BadgeCheck, Camera, KeyRound, LogOut, Save, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading, EvaluationPanel, fieldStyle } from '../components/ui/EvaluationUi'
import { displayName } from '../data/demoAccounts'
import { formatWIB } from '../lib/auditTrail'
import { useSelection } from '../state/SelectionContext'
import type { Evaluator } from '../types'

const emptyPasswords = { current: '', next: '', confirmation: '' }

export function ProfilePage({ evaluator, onLogout }: { evaluator: Evaluator; onLogout: () => void }) {
  const { profiles, lastLogin, updateProfile, updatePassword } = useSelection()
  const profile = profiles[evaluator.id]
  const [draft, setDraft] = useState({
    name: profile.name, email: profile.email, telephone: profile.telephone, photo: profile.photo,
  })
  const [passwords, setPasswords] = useState(emptyPasswords)
  const [profileNote, setProfileNote] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordNote, setPasswordNote] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [busy, setBusy] = useState(false)
  const [readingPhoto, setReadingPhoto] = useState(false)

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileNote('')
    setProfileError('')
    try {
      updateProfile(evaluator.id, draft)
      setProfileNote('Perubahan profil telah disimpan.')
    } catch (cause) {
      setProfileError(cause instanceof Error ? cause.message : 'Profil gagal disimpan.')
    }
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0]
    if (!image) return
    setProfileNote('')
    setProfileError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size > 2 * 1024 * 1024) {
      setProfileError('Pilih foto JPEG, PNG, atau WebP hingga 2 MB.')
      return
    }
    setReadingPhoto(true)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const photo = reader.result
        setDraft((previous) => ({ ...previous, photo }))
      }
    }
    reader.onerror = () => setProfileError('Foto gagal dibaca.')
    reader.onloadend = () => setReadingPhoto(false)
    reader.readAsDataURL(image)
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setPasswordNote('')
    setPasswordError('')
    if (passwords.next !== passwords.confirmation) {
      setPasswordError('Konfirmasi kata sandi belum cocok.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(evaluator.id, passwords.current, passwords.next)
      setPasswords(emptyPasswords)
      setPasswordNote('Kata sandi demo telah diperbarui.')
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : 'Kata sandi gagal diperbarui.')
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Profil & Pengaturan Akun" description="Kelola identitas, kontak, dan kata sandi akun demo penilai aktif.">
        <Badge tone="active"><BadgeCheck size={15} aria-hidden="true" /> Akun Demo Terverifikasi</Badge>
      </EvaluationHeading>
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)] xl:items-start">
        <section aria-label="Identitas penilai" className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="h-20 bg-navy-950" />
          <div className="relative px-4 pb-5 text-center">
            <span className="relative mx-auto -mt-10 grid size-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-teal-100 text-teal-900">
              {draft.photo ? <img src={draft.photo} alt={'Foto profil ' + profile.name} className="size-full object-cover" /> : <UserRound size={36} aria-hidden="true" />}
            </span>
            <h2 className="mt-3 font-semibold text-navy-950">{displayName(profile)}</h2>
            <p className="mt-1 break-all text-sm text-slate-600">{profile.email}</p>
            <div className="mt-2"><Badge tone="info">{evaluator.name}</Badge></div>
            <dl className="mt-4 space-y-2 text-left text-sm">
              <div className="rounded-lg bg-blue-50 p-3"><dt className="text-slate-700">NIP / ID Pegawai</dt><dd className="font-semibold">{profile.employeeId}</dd></div>
              <div className="rounded-lg bg-blue-50 p-3"><dt className="text-slate-700">Unit Kerja</dt><dd className="font-semibold">{profile.unit}</dd></div>
              <div className="rounded-lg bg-blue-50 p-3"><dt className="text-slate-700">Login Terakhir</dt><dd className="font-semibold">{lastLogin[evaluator.id] ? formatWIB(lastLogin[evaluator.id]!) : 'Belum masuk dengan akun ini'}</dd></div>
            </dl>
            <Button variant="secondary" className="mt-4 w-full" onClick={onLogout}><LogOut size={16} aria-hidden="true" /> Keluar</Button>
          </div>
        </section>

        <div className="space-y-4">
          <EvaluationPanel title="Pengaturan Profil" description="Gunakan informasi simulasi. Foto disimpan pada sesi browser ini.">
            <form className="space-y-3" onSubmit={saveProfile}>
              <label className="grid gap-1 text-sm font-medium">Nama Lengkap<input className={fieldStyle} required maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium">Email Institusi<input className={fieldStyle} type="email" required maxLength={100} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
                <label className="grid gap-1 text-sm font-medium">Nomor Telepon<input className={fieldStyle} type="tel" maxLength={22} value={draft.telephone} onChange={(event) => setDraft({ ...draft, telephone: event.target.value })} /></label>
              </div>
              <label className="grid gap-1 text-sm font-medium">
                <span className="flex items-center gap-2"><Camera size={16} aria-hidden="true" /> Foto Profil</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className={fieldStyle} onChange={selectPhoto} />
              </label>
              {profileError && <p role="alert" className="text-sm text-orange-900">{profileError}</p>}
              {profileNote && <p role="status" className="text-sm text-teal-900">{profileNote}</p>}
              <div className="flex justify-end"><Button type="submit" disabled={readingPhoto}><Save size={16} aria-hidden="true" /> Simpan Perubahan</Button></div>
            </form>
          </EvaluationPanel>

          <EvaluationPanel title="Ganti Password" description="Kata sandi baru harus memuat minimal delapan karakter, huruf, dan angka.">
            <form className="space-y-3" onSubmit={changePassword}>
              <label className="grid gap-1 text-sm font-medium">Password Saat Ini<input className={fieldStyle} type="password" autoComplete="current-password" required maxLength={256} value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium">Password Baru<input className={fieldStyle} type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></label>
                <label className="grid gap-1 text-sm font-medium">Konfirmasi Password Baru<input className={fieldStyle} type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={passwords.confirmation} onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })} /></label>
              </div>
              {passwordError && <p role="alert" className="text-sm text-orange-900">{passwordError}</p>}
              {passwordNote && <p role="status" className="text-sm text-teal-900">{passwordNote}</p>}
              <div className="flex justify-end"><Button type="submit" disabled={busy}><KeyRound size={16} aria-hidden="true" /> {busy ? 'Memperbarui...' : 'Perbarui Password'}</Button></div>
            </form>
          </EvaluationPanel>
        </div>
      </div>
    </div>
  )
}
