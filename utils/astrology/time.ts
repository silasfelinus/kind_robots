// /utils/astrology/time.ts
//
// Birth times are entered as local wall-clock time in an IANA zone. The
// browser's Intl database knows each zone's historical offsets, so no
// timezone library is needed.

export type BirthMoment = {
  date: string
  time: string | null
  timeZone: string
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

/** Minutes the zone is ahead of UTC at the given instant. */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant)
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour') % 24,
    value('minute'),
    value('second'),
  )
  return Math.round((asUtc - instant.getTime()) / 60000)
}

export function parseBirthDate(date: string) {
  const match = DATE_PATTERN.exec(date.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  )
    return null
  return { year, month, day }
}

export function parseBirthTime(time: string | null) {
  if (!time) return null
  const match = TIME_PATTERN.exec(time.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return { hour, minute }
}

/** The UTC instant for a local wall-clock moment; noon when time is unknown. */
export function birthMomentToUtc(moment: BirthMoment): Date | null {
  const date = parseBirthDate(moment.date)
  if (!date || !isValidTimeZone(moment.timeZone)) return null
  const time = parseBirthTime(moment.time) ?? { hour: 12, minute: 0 }
  const wall = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
  )
  const first =
    wall - zoneOffsetMinutes(new Date(wall), moment.timeZone) * 60000
  const second =
    wall - zoneOffsetMinutes(new Date(first), moment.timeZone) * 60000
  return new Date(second)
}

/** YYYY-MM-DD for an instant as seen in a zone. */
export function localDateKey(instant: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '00'
  return `${value('year')}-${value('month')}-${value('day')}`
}
