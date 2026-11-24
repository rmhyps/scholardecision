import type { EvaluatorId } from '../types'

export interface DemoProfile {
  id: EvaluatorId
  name: string
  title: string
  email: string
  telephone: string
  employeeId: string
  unit: string
  photo: string | null
}

export const demoPassword = 'ScholarDemo2026'
export const demoProfiles: Readonly<Record<EvaluatorId, DemoProfile>> = {
  kemahasiswaan: {
    id: 'kemahasiswaan', name: 'Dr. Siti Rahmawati', title: 'M.Pd.',
    email: 'kemahasiswaan@unc.example', telephone: '', employeeId: 'SIM-001',
    unit: 'Biro Kemahasiswaan', photo: null,
  },
  'dosen-wali': {
    id: 'dosen-wali', name: 'Dr. Ahmad Hidayat', title: 'M.Kom.',
    email: 'dosen-wali@unc.example', telephone: '', employeeId: 'SIM-002',
    unit: 'Pembimbing Akademik', photo: null,
  },
  'pengelola-beasiswa': {
    id: 'pengelola-beasiswa', name: 'Dewi Lestari', title: 'S.E.',
    email: 'pengelola-beasiswa@unc.example', telephone: '', employeeId: 'SIM-003',
    unit: 'Pengelolaan Beasiswa', photo: null,
  },
}

export function displayName(profile: DemoProfile) {
  return [profile.name, profile.title].filter(Boolean).join(', ')
}
