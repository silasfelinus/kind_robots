import { endingOf } from './endings'
import { epilogueFor } from './epilogue'
import type { EndingId } from './endings'
import type { FortressRun } from './types'

export const SCRAPBOOK_KEY = 'kr-emperor-of-dust-scrapbook-v1'
export type ReignEpilogue = {
  subjectId: string
  name: string
  text: string
}

export type ReignMemory = {
  key: string
  ending: EndingId
  completedAt: string
  brass: number
  followers: number
  memorials: { followerId: string; questId: string; day: number }[]
  peace: string[]
  bellRung: boolean
  cryptSealed: boolean
  epilogues: ReignEpilogue[]
}
export const emptyScrapbook = (): ReignMemory[] => []

const ENDING_IDS = new Set<EndingId>([
  'bell-restored',
  'open-roads',
  'iron-peace',
  'crows-bargain',
  'witchwater-throne',
  'tunnels-and-councils',
  'long-night',
  'hundred-candles',
])

export function decodeScrapbook(
  raw: string | null | undefined,
): ReignMemory[] | null {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length > 100) return null
    if (
      !value.every(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          typeof entry.key === 'string' &&
          entry.key.length <= 100 &&
          ENDING_IDS.has(entry.ending) &&
          typeof entry.completedAt === 'string' &&
          !Number.isNaN(Date.parse(entry.completedAt)) &&
          Number.isSafeInteger(entry.brass) &&
          Number.isSafeInteger(entry.followers) &&
          entry.followers >= 0 &&
          Array.isArray(entry.memorials) &&
          entry.memorials.length <= 100 &&
          entry.memorials.every(
            (m: unknown) =>
              m &&
              typeof m === 'object' &&
              typeof (m as ReignMemory['memorials'][number]).followerId ===
                'string' &&
              typeof (m as ReignMemory['memorials'][number]).questId ===
                'string' &&
              Number.isSafeInteger((m as ReignMemory['memorials'][number]).day),
          ) &&
          Array.isArray(entry.peace) &&
          entry.peace.length <= 20 &&
          entry.peace.every(
            (f: unknown) => typeof f === 'string' && f.length <= 100,
          ) &&
          typeof entry.bellRung === 'boolean' &&
          typeof entry.cryptSealed === 'boolean' &&
          (entry.epilogues === undefined ||
            (Array.isArray(entry.epilogues) &&
              entry.epilogues.length <= 100 &&
              entry.epilogues.every(
                (epilogue: unknown) =>
                  epilogue !== null &&
                  typeof epilogue === 'object' &&
                  typeof (epilogue as ReignEpilogue).subjectId === 'string' &&
                  (epilogue as ReignEpilogue).subjectId.length <= 100 &&
                  typeof (epilogue as ReignEpilogue).name === 'string' &&
                  (epilogue as ReignEpilogue).name.length <= 160 &&
                  typeof (epilogue as ReignEpilogue).text === 'string' &&
                  (epilogue as ReignEpilogue).text.length <= 1600,
              ))),
      )
    )
      return null
    return (value as ReignMemory[]).map((entry) => ({
      ...entry,
      epilogues: entry.epilogues ?? [],
    }))
  } catch {
    return null
  }
}

export function rememberReign(
  previous: ReignMemory[],
  run: FortressRun,
  completedAt: string,
): ReignMemory[] {
  if (run.day <= 50) return previous
  const key = `${run.seed}:${run.branch}:${run.day}:${endingOf(run).id}`
  if (previous.some((entry) => entry.key === key)) return previous
  return [
    {
      key,
      ending: endingOf(run).id,
      completedAt,
      brass: run.brass,
      followers: run.roster.length,
      memorials: run.memorials.map((m) => ({ ...m })),
      peace: run.flags.filter((flag) => flag.startsWith('peace-')),
      bellRung: run.flags.includes('bell-rung'),
      cryptSealed: run.flags.includes('horror-sealed'),
      epilogues: epilogueFor(run, endingOf(run).id).map(
        ({ subject, variant }) => ({
          subjectId: subject.id,
          name: subject.name,
          text: variant.text,
        }),
      ),
    },
    ...previous,
  ].slice(0, 100)
}
