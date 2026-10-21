import type { FortressRun } from './types'

// The eight ending families (conductor SYSTEMS-V03.md, final list set in Act V
// scripting). Day 50's last dispatch decides whether the horror sleeps; Day
// 49's "Whose Peace?" decides whose kingdom the survivors come home to. Heavy
// losses override the peace. No ending names who later destroys Hollow Bell.

export type EndingId =
  | 'bell-restored'
  | 'open-roads'
  | 'iron-peace'
  | 'crows-bargain'
  | 'witchwater-throne'
  | 'tunnels-and-councils'
  | 'long-night'
  | 'hundred-candles'

export type EndingDef = { id: EndingId; title: string; text: string }

export const ENDINGS: Record<EndingId, EndingDef> = {
  'bell-restored': {
    id: 'bell-restored',
    title: 'The Bell Restored',
    text: 'Hollow Bell rings again, with a clapper fished out of the Mirefen, and the kingdom gathers around the sound. The crown sits lighter than it did, in a town that has decided to love it for as long as the Bell stands.',
  },
  'open-roads': {
    id: 'open-roads',
    title: 'Open Roads',
    text: 'The crown comes home smaller. Councils run the Freeholds, the Saltroad writes its own charters, and the tower is mostly a place where people come to argue. The roads are open. That turns out to be enough.',
  },
  'iron-peace': {
    id: 'iron-peace',
    title: 'Iron Peace',
    text: 'The Gate Watch stands on every road, and nobody raids anybody. Nobody sings much, either. It is a peace, and it is held very tightly, by hands that remember how close it came.',
  },
  'crows-bargain': {
    id: 'crows-bargain',
    title: 'The Crow’s Bargain',
    text: 'The rain comes when it is supposed to, every season, exactly. The Storm Crows name the price each spring, and the kingdom pays it without asking what happens to what it pays.',
  },
  'witchwater-throne': {
    id: 'witchwater-throne',
    title: 'The Witchwater Throne',
    text: 'The Mire Mothers sit at the emperor’s left hand now, and the green lanterns burn on the tower at night. The fen is kinder than it was. People are careful what they promise near the water.',
  },
  'tunnels-and-councils': {
    id: 'tunnels-and-councils',
    title: 'Tunnels and Councils',
    text: 'The Moles come up out of the badlands and hold their assemblies in daylight, in every village, about everything. Decisions take three times as long. Almost nobody is left out of them.',
  },
  'long-night': {
    id: 'long-night',
    title: 'The Long Night',
    text: 'The door under the Abbey stayed open. The singing spread along the roads, and the factions scattered ahead of it into the hills and the fen and the deep tunnels. Somewhere, the court is still alive. Somewhere, people still tell stories about the emperor who tried.',
  },
  'hundred-candles': {
    id: 'hundred-candles',
    title: 'A Hundred Candles',
    text: 'The horror sleeps, and the kingdom stands, and it cost too much. On the first night of every year the court lights a candle for every name it lost, and reads the names aloud, all of them, slowly.',
  },
}

/** Day 49's choices, most specific first; Open Roads is the default peace. */
const PEACES: [flag: string, ending: EndingId][] = [
  ['peace-bell', 'bell-restored'],
  ['peace-tunnels', 'tunnels-and-councils'],
  ['peace-witchwater', 'witchwater-throne'],
  ['peace-crows', 'crows-bargain'],
  ['peace-iron', 'iron-peace'],
  ['peace-roads', 'open-roads'],
]

/** Followers lost this run that make the peace "A Hundred Candles". */
export const HEAVY_LOSSES = 2

/**
 * The ending a finished run earns. Any party that sealed the crypt counts.
 * The Bell's peace needs the bell to have rung (t-040); a Bell peace whose
 * bell never sounded comes home as Open Roads.
 */
export const endingOf = (run: FortressRun): EndingDef => {
  if (!run.flags.includes('horror-sealed')) return ENDINGS['long-night']
  if (run.memorials.length >= HEAVY_LOSSES) return ENDINGS['hundred-candles']
  const peace = PEACES.find(([flag]) => run.flags.includes(flag))
  if (peace?.[1] === 'bell-restored' && !run.flags.includes('bell-rung'))
    return ENDINGS['open-roads']
  return ENDINGS[peace?.[1] ?? 'open-roads']
}

/** From this day the court is told the Hundred Candles rule (t-040). */
export const CANDLES_WARNING_DAY = 45

const COUNT_WORDS = ['No names', 'One name', 'Two names', 'Three names']

/**
 * The warning before A Hundred Candles can override the Day 49 peace: the
 * rule, and how many names the memorial row holds today.
 */
export const candlesLine = (
  run: Pick<FortressRun, 'day' | 'memorials'>,
): { source: string; text: string } | undefined => {
  if (run.day < CANDLES_WARNING_DAY || run.day > 50) return undefined
  const lost = run.memorials.length
  const count = COUNT_WORDS[lost] ?? `${lost} names`
  const rule = `${HEAVY_LOSSES === 2 ? 'Two' : HEAVY_LOSSES} names on the memorial row and no peace holds. The kingdom keeps A Hundred Candles instead.`
  return {
    source: 'The memorial row',
    text:
      lost >= HEAVY_LOSSES
        ? `${count} already. ${rule} Whatever is signed at the last fire, the candles are what the kingdom will remember.`
        : `${rule} ${count} so far.`,
  }
}
