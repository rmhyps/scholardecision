interface ScoredAlternative {
  alternativeId: string
}

export function rankByScore<T extends ScoredAlternative>(
  rows: readonly T[],
  score: (row: T) => number,
) {
  const sorted = [...rows].sort(
    (a, b) => score(b) - score(a) || a.alternativeId.localeCompare(b.alternativeId),
  )
  const ranked: { row: T; firstRank: number; lastRank: number }[] = []
  for (let start = 0; start < sorted.length;) {
    let end = start + 1
    while (end < sorted.length && score(sorted[end]) === score(sorted[start])) {
      end++
    }
    for (const row of sorted.slice(start, end)) {
      ranked.push({ row, firstRank: start + 1, lastRank: end })
    }
    start = end
  }
  return ranked
}
