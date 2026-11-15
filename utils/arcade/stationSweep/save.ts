// /utils/arcade/stationSweep/save.ts
//
// Station Sweep's saved progress (conductor kr-arcade/t-142): a resume point at the start of each
// station, kept through utils/arcade/saves.ts. What comes back from the device is untrusted, so it
// is checked field by field; anything odd and there is simply nothing to continue.

import { FAMILY_NAMES, type Family } from './critters'
import { emptyKit, type Kit } from './locker'

export type StationSave = {
  v: 1
  /** The station to start again at. */
  station: number
  score: number
  spares: number
  credits: number
  kit: Kit
  swept: Record<Family, number>
  /** The run ended: continuing starts the score and the spares afresh. */
  continued?: boolean
}

const int = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null

/** A save handed back by the cabinet, if it is one this game wrote. */
export function readStationSave(raw: unknown): StationSave | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (s.v !== 1) return null
  const station = int(s.station, 1, 99)
  const score = int(s.score, 0, 10_000_000)
  const spares = int(s.spares, 0, 9)
  const credits = int(s.credits, 0, 9999)
  if (station === null || score === null || spares === null || credits === null)
    return null
  const k = (s.kit ?? {}) as Record<string, unknown>
  const kit = emptyKit()
  for (const key of Object.keys(kit) as Array<keyof Kit>) {
    const v = int(k[key], 0, 2)
    if (v === null) return null
    kit[key] = v
  }
  const w = (s.swept ?? {}) as Record<string, unknown>
  const swept = {} as Record<Family, number>
  for (const f of FAMILY_NAMES) swept[f] = int(w[f], 0, 99_999) ?? 0
  return {
    v: 1,
    station,
    score,
    spares,
    credits,
    kit,
    swept,
    ...(s.continued === true ? { continued: true } : {}),
  }
}
