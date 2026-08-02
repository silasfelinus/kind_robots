// /utils/narrativeTurns.ts
//
// One adapter from a product's beats to the shared chat window's turns.
//
// Storybook and Taskmaster both persist a session as a list of BEATS — one
// record holding the narration and, once the reader answers, their reply.
// kr-chat-window speaks TURNS: one message per speaker, because that is the
// shape every other conversational surface (bot chat, Dreams dock, the interact
// pages) already has. Converting in both pages independently would be the same
// duplication this phase exists to remove, so it converts here.
//
// The turn id encodes which beat it came from, which is what lets a caller
// render per-beat chrome (the illustration, a retry button) in the window's
// #after-turn slot without kr-chat-window ever learning what a beat is. Keeping
// the shared component free of domain types is the whole reason it can drop
// into a scenario editor and a slide-out dock alike.

import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'

export type NarrativeBeatLike = {
  id: string
  narrative: string
  answer?: { text: string } | null
}

const NARRATION_TURN_PREFIX = 'narration:'
const ANSWER_TURN_PREFIX = 'answer:'

export type NarrativeTurnOptions = {
  /** Shown above the narration, e.g. the narrator's name. */
  speaker?: string
  portrait?: string | null
}

/**
 * Flatten beats into narrator/user turns, in order.
 *
 * A beat with an answer becomes two turns; a beat still awaiting one becomes a
 * single narrator turn. An empty answer string is treated as absent rather than
 * rendered as an empty bubble — `answer: { text: '' }` is a beat mid-write, not
 * a reader who said nothing.
 */
export function narrativeBeatsToTurns(
  beats: NarrativeBeatLike[],
  options: NarrativeTurnOptions = {},
): NarrativeTurn[] {
  const turns: NarrativeTurn[] = []

  for (const beat of beats) {
    turns.push({
      id: `${NARRATION_TURN_PREFIX}${beat.id}`,
      text: beat.narrative,
      from: 'narrator',
      speaker: options.speaker,
      portrait: options.portrait ?? null,
    })

    const answer = beat.answer?.text?.trim()
    if (answer) {
      turns.push({
        id: `${ANSWER_TURN_PREFIX}${beat.id}`,
        text: beat.answer?.text ?? '',
        from: 'user',
      })
    }
  }

  return turns
}

/**
 * The beat a NARRATION turn came from, or null for anything else.
 *
 * Deliberately null for answer turns: per-beat chrome (illustration, retry)
 * belongs to the narration, and returning the beat for both turns would render
 * every illustration twice.
 */
export function beatIdFromTurnId(turnId: string): string | null {
  return turnId.startsWith(NARRATION_TURN_PREFIX)
    ? turnId.slice(NARRATION_TURN_PREFIX.length)
    : null
}
