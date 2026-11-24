import {
  CalendarDays, ChartColumnIncreasing, ClipboardCheck, FileClock, FileText, LayoutDashboard,
  ListChecks, LogIn, Settings2, ShieldCheck, Table2, UserRound, UsersRound,
} from 'lucide-react'

export const pages = {
  login: { title: 'Login', icon: LogIn },
  dashboard: { title: 'Dashboard', icon: LayoutDashboard },
  'data-mahasiswa': { title: 'Data Calon Mahasiswa', icon: UsersRound },
  kriteria: { title: 'Data Kriteria', icon: ListChecks },
  bobot: { title: 'Pengaturan Bobot', icon: Settings2 },
  penilaian: { title: 'Form Penilaian', icon: Table2 },
  topsis: { title: 'Hasil TOPSIS', icon: ChartColumnIncreasing },
  borda: { title: 'Konsensus Borda', icon: ClipboardCheck },
  pengesahan: { title: 'Pengesahan Hasil', icon: ShieldCheck },
  profil: { title: 'Profil & Pengaturan Akun', icon: UserRound },
  periode: { title: 'Periode Seleksi', icon: CalendarDays },
  laporan: { title: 'Laporan Berita Acara', icon: FileText },
  audit: { title: 'Riwayat Audit Trail', icon: FileClock },
} as const

export type PageId = keyof typeof pages

export const navigationGroups = [
  { label: 'Utama', pageIds: ['dashboard', 'data-mahasiswa', 'kriteria', 'periode'] },
  { label: 'Penilaian', pageIds: ['bobot', 'penilaian', 'topsis', 'borda', 'pengesahan'] },
  { label: 'Administrasi', pageIds: ['laporan', 'audit', 'profil', 'login'] },
] as const satisfies readonly { label: string; pageIds: readonly PageId[] }[]
