import type { Candidate } from '../types/index.ts'

const programs = ['Teknik Informatika', 'Sistem Informasi', 'Matematika', 'Manajemen', 'Akuntansi'] as const

export function candidateDemoProfile(candidate: Candidate) {
  return {
    nim: candidate.nim ?? `SIM-${candidate.id}`,
    program: candidate.program ?? programs[(candidate.sourceId - 1) % programs.length],
    verified: !candidate.nim && candidate.sourceId % 5 !== 0,
  }
}
