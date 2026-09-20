// utils/rulerHooked/advisor.ts
//
// The standing advisor (ruler-hooked/t-028, Silas 2026-09-11: "where is our
// advisor? We should have an introduction."). A pure, deterministic function
// of (bundle, save, context) -> one line + mood -- no Vue, no randomness
// beyond the save's own seeded RNG, same discipline as the rest of the
// engine (loop.ts, applyEffects.ts). This is the narrator seat t-030's
// kingdom decisions should eventually speak through, and the natural home
// for tutorial guidance instead of the explainer cards t-023 removed.
//
// Framework-free except for the type-only ContentBundle/RunSave/CatchResult
// imports, so it stays testable the same way engine.selftest.ts tests the
// rest of utils/rulerHooked/*.

import { AXIS_KEYS } from '~/types/ruler-hooked'
import type {
  AxisKey,
  CatchResult,
  ContentBundle,
  RunSave,
} from '~/types/ruler-hooked'
import { makeRng } from '~/utils/rulerHooked/seed'
import type { CharacterExpressionKey } from '~/utils/rulerHooked/characterArt'

/** The advisor's own Character slug -- seeded into content.ts's characters
 *  bundle and (later) into the DB via seed_ruler_hooked_characters.ts. */
export const ADVISOR_CHARACTER_SLUG = 'steward-quill'

/** Advisor moods reuse the same four keys as the general character-art
 *  contract, so the advisor doesn't need its own portrait convention. */
export type AdvisorMood = CharacterExpressionKey

export interface AdvisorLine {
  mood: AdvisorMood
  text: string
}

/** Transient play state the advisor reacts to -- everything here already
 *  lives in rulerHookedStore.ts's refs; nothing new is persisted. */
export interface AdvisorContext {
  lastCatch?: CatchResult | null
  lastEscape?: { fishName: string; cue: string } | null
  pendingEnding?: string | null
}

const AXIS_LABEL: Record<AxisKey, string> = {
  nature: 'the wild country',
  prosperity: 'the markets',
  treasury: 'the coffers',
  joy: "the people's mood",
  order: 'the peace',
}

const AXIS_LOW = 25
const AXIS_HIGH = 80

const IDLE_LINES: AdvisorLine[] = [
  {
    mood: 'neutral',
    text: 'The lake keeps its own counsel today. So do the ledgers, for once.',
  },
  {
    mood: 'neutral',
    text: 'Nothing urgent on my desk. Suspiciously nothing, in fact.',
  },
  {
    mood: 'pleased',
    text: 'A quiet turn. I recommend enjoying exactly one of these before the next crisis.',
  },
  {
    mood: 'neutral',
    text: 'Cast when ready -- I will keep pretending to read this report.',
  },
  {
    mood: 'concerned',
    text: 'The village asked about you again. I told them you were "busy fishing." They understood immediately.',
  },
]

function firstAxisPast(
  health: RunSave['kingdomHealth'],
  threshold: number,
  below: boolean,
): AxisKey | null {
  for (const key of AXIS_KEYS) {
    const value = health[key] ?? 50
    if (below ? value <= threshold : value >= threshold) return key
  }
  return null
}

/**
 * The single line the advisor is currently saying. Priority order: a
 * pending ending (the biggest thing in the room), a fresh catch, a fresh
 * escape, an extreme kingdom-health axis, a first-turn welcome, then a
 * deterministic idle line keyed off the save's own seed + turn so it stays
 * stable across re-renders without ever repeating on consecutive turns.
 */
export function currentAdvisorLine(
  bundle: ContentBundle,
  save: RunSave,
  ctx: AdvisorContext = {},
): AdvisorLine {
  if (ctx.pendingEnding) {
    const ending = bundle.endings.find(
      (e) => e.outcomeKey === ctx.pendingEnding,
    )
    if (ending?.victoryType === 'VICTORY') {
      return {
        mood: 'pleased',
        text: `This could be the ending, ${rulerLabel(save)}. A good one, even. Your call.`,
      }
    }
    if (ending?.victoryType === 'FAILURE') {
      return {
        mood: 'alarmed',
        text: 'This is a bad place to stop the story. I have to say that. You may still choose it.',
      }
    }
    return {
      mood: 'concerned',
      text: 'An ending is within reach. Mixed feelings, mixed reign -- fitting, honestly.',
    }
  }

  if (ctx.lastCatch) {
    const c = ctx.lastCatch
    if (c.newDiscovery) {
      return {
        mood: 'pleased',
        text: `A ${c.name}, never logged before. The Fishopedia will want a word.`,
      }
    }
    if (
      c.rarity === 'LEGENDARY' ||
      c.rarity === 'MYTHIC' ||
      c.quality === 'TROPHY'
    ) {
      return {
        mood: 'pleased',
        text: `A ${c.name} like that doesn't happen twice a reign. Well hooked.`,
      }
    }
    return {
      mood: 'neutral',
      text: `A ${c.name}. Turn ${save.turnCount}'s catch, logged.`,
    }
  }

  if (ctx.lastEscape) {
    return {
      mood: 'concerned',
      text: `The ${ctx.lastEscape.fishName} got away. It happens to every ruler eventually.`,
    }
  }

  const lowAxis = firstAxisPast(save.kingdomHealth, AXIS_LOW, true)
  if (lowAxis) {
    return {
      mood: 'alarmed',
      text: `${capitalize(AXIS_LABEL[lowAxis])} is in a bad way. Someone should do something about that. You, ideally.`,
    }
  }
  const highAxis = firstAxisPast(save.kingdomHealth, AXIS_HIGH, false)
  if (highAxis) {
    return {
      mood: 'pleased',
      text: `${capitalize(AXIS_LABEL[highAxis])} hasn't looked this good in a long reign. Whatever you're doing, keep doing it.`,
    }
  }

  if (save.turnCount === 0 && save.choiceLog.length === 0) {
    return {
      mood: 'neutral',
      text: `Welcome to the reign, ${rulerLabel(save)}. I'm Quill -- I'll be the one telling you when something's wrong.`,
    }
  }

  const idleIndex = makeRng(`${save.seed}:advisor:${save.turnCount}`).int(
    IDLE_LINES.length,
  )
  return IDLE_LINES[idleIndex] ?? IDLE_LINES[0]!
}

function rulerLabel(save: RunSave): string {
  return (
    [save.ruler.honorific, save.ruler.name].filter(Boolean).join(' ') || 'Ruler'
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
