import type { Candidate } from '../types'

const programs = ['Teknik Informatika', 'Sistem Informasi', 'Matematika', 'Manajemen', 'Akuntansi'] as const

export function candidateDemoProfile(candidate: Candidate) {
  return {
    nim: `SIM-${candidate.id}`,
    program: programs[(candidate.sourceId - 1) % programs.length],
    verified: candidate.sourceId % 5 !== 0,
  }
}
