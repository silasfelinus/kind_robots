// /utils/matureTerms.ts
//
// Term matching for auto-flagging adult Resources (LoRAs, checkpoints).
//
// WHY IT LIVES HERE AND NOT IN THE SCRIPT
// ---------------------------------------
// The script that writes to the database should not be the only place these
// rules exist. Kept separate, the matcher is unit-testable without a database,
// reviewable on its own, and reusable if intake ever wants to flag on import
// rather than in a sweep afterwards.
//
// THE BIAS IS DELIBERATE AND ONE-DIRECTIONAL
// ------------------------------------------
// Silas, 2026-08-07: "It's much better to have false positives for things
// wrongly tagged mature than those that are tagged safe, and there are clearly
// resources with nsfw phrases not tagged."
//
// So this errs toward flagging. A safe Resource wrongly marked mature is a
// minor annoyance that a human clears in one click; a mature Resource left
// unmarked is served to a signed-out guest. Those costs are not symmetric, and
// the matcher is tuned to the expensive side.
//
// WORD BOUNDARIES ARE NOT OPTIONAL
// --------------------------------
// A naive substring pass makes the list useless rather than merely noisy:
// "ass" matches class, glass, grass, passage, assassin, Cassandra; "anal"
// matches analog, analysis, canal; "cum" matches cumulus, document,
// circumstance; "tit" matches title, competitive, constitution. That is not an
// acceptable false-positive rate, it is every row in the catalog. Every term is
// matched with boundaries, and SEPARATORS are treated as boundaries too because
// these strings are filenames and tag lists: `nsfw_lora`, `big-boobs`,
// `style.nude.v2` must all match.

/**
 * How confident the match is. Both tiers flag by default -- the split exists so
 * a reviewer can sort the obvious from the merely suggestive, and so
 * `--tier explicit` is available if the soft list ever proves too eager.
 */
export type MatureTier = 'explicit' | 'suggestive'

export type MatureMatch = {
  term: string
  tier: MatureTier
}

/**
 * Unambiguous adult terms. A hit here is treated as decisive: these words do
 * not appear in a safe model's name or description by accident.
 */
const EXPLICIT_TERMS = [
  'nsfw',
  'xxx',
  'porn',
  'porno',
  'pornographic',
  'hentai',
  'ecchi',
  'rule34',
  'r34',
  'explicit',
  'uncensored',
  'nude',
  'nudes',
  'nudity',
  'naked',
  'topless',
  'bottomless',
  'genitalia',
  'genitals',
  'penis',
  'vagina',
  'vulva',
  'anus',
  'anal',
  'orgasm',
  'masturbation',
  'masturbating',
  'intercourse',
  'blowjob',
  'handjob',
  'creampie',
  'cumshot',
  'cum',
  'bukkake',
  'futa',
  'futanari',
  'yaoi',
  'yuri',
  'ahegao',
  'bdsm',
  'bondage',
  'fetish',
  'erotic',
  'erotica',
  'nipple',
  'nipples',
  'areola',
  'areolae',
  'boob',
  'boobs',
  'breasts',
  'titty',
  'titties',
  'lewd',
  'smut',
  'onlyfans',
  'stripper',
  'striptease',
  'camgirl',
  'sexy',
  'sex',
]

/**
 * Suggestive rather than decisive. These legitimately appear on safe models --
 * a swimwear or fashion LoRA is not adult content -- but in this catalog they
 * co-occur with adult material often enough that Silas's stated preference
 * says flag and let a human clear them.
 */
const SUGGESTIVE_TERMS = [
  'lingerie',
  'bikini',
  'swimsuit',
  'microbikini',
  'micro-bikini',
  'underwear',
  'panties',
  'bra',
  'thong',
  'cleavage',
  'busty',
  'curvy',
  'thicc',
  'seductive',
  'sensual',
  'provocative',
  'pinup',
  'pin-up',
  'boudoir',
  'fanservice',
  'skimpy',
  'revealing',
  'suggestive',
  'milf',
  'waifu',
]

/*
 * Separators count as boundaries. \b alone does not help with `nsfw_lora`
 * (underscore is a word character, so \bnsfw\b does NOT match it) -- which is
 * precisely the shape these names arrive in.
 */
const EDGE = '(?:^|[^a-z0-9])'
const TRAIL = '(?:$|[^a-z0-9])'

const compile = (term: string, tier: MatureTier) => ({
  tier,
  term,
  pattern: new RegExp(
    `${EDGE}${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${TRAIL}`,
    'i',
  ),
})

const COMPILED = [
  ...EXPLICIT_TERMS.map((term) => compile(term, 'explicit' as const)),
  ...SUGGESTIVE_TERMS.map((term) => compile(term, 'suggestive' as const)),
]

/**
 * Every term the text hits, with its tier. Returns all matches rather than the
 * first: a reviewer deciding whether a flag is right wants to see WHY, and one
 * matched word is much weaker evidence than five.
 */
export function matchMatureTerms(text: string): MatureMatch[] {
  if (!text) return []

  const matches: MatureMatch[] = []
  for (const entry of COMPILED) {
    if (entry.pattern.test(text)) {
      matches.push({ term: entry.term, tier: entry.tier })
    }
  }
  return matches
}

/** The fields worth scanning on a Resource, joined for a single pass. */
export function matureScanText(resource: {
  name?: string | null
  customLabel?: string | null
  description?: string | null
  triggerWords?: string | null
  defaultTrigger?: string | null
  artPrompt?: string | null
  localPath?: string | null
}): string {
  return [
    resource.name,
    resource.customLabel,
    resource.description,
    resource.triggerWords,
    resource.defaultTrigger,
    resource.artPrompt,
    resource.localPath,
  ]
    .filter(Boolean)
    .join(' \n ')
}
