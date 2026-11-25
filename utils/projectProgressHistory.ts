export interface ProjectProgressPoint {
  done: number
  total: number
}

export interface ProjectProgressHistory {
  sourceCommitSha: string
  dates: string[]
  series: Record<string, (ProjectProgressPoint | null)[]>
}

export function isProjectProgressHistory(
  value: unknown,
): value is ProjectProgressHistory {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProjectProgressHistory>
  if (
    typeof candidate.sourceCommitSha !== 'string' ||
    !/^[a-f0-9]{7,64}$/i.test(candidate.sourceCommitSha) ||
    !Array.isArray(candidate.dates) ||
    candidate.dates.length < 1 ||
    candidate.dates.length > 91 ||
    !candidate.dates.every(
      (date, i, dates) =>
        typeof date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        (i === 0 || date > (dates[i - 1] ?? '')),
    ) ||
    !candidate.series ||
    typeof candidate.series !== 'object' ||
    Array.isArray(candidate.series)
  ) {
    return false
  }
  const length = candidate.dates.length
  return Object.values(candidate.series).every(
    (points) =>
      Array.isArray(points) &&
      points.length === length &&
      points.every(
        (point) =>
          point === null ||
          (!!point &&
            Number.isSafeInteger(point.done) &&
            Number.isSafeInteger(point.total) &&
            point.done >= 0 &&
            point.total >= point.done),
      ),
  )
}

export function progressPercent(
  point: ProjectProgressPoint | null,
): number | null {
  return point && point.total > 0
    ? Math.round((100 * point.done) / point.total)
    : null
}

export function completedDelta(
  points: (ProjectProgressPoint | null)[],
): number | null {
  const first = points[0]
  const last = points[points.length - 1]
  return first && last ? last.done - first.done : null
}
