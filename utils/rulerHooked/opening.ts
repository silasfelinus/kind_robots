// utils/rulerHooked/opening.ts
//
// The once-per-reign opening (ruler-hooked/t-028): "short, skippable,
// image-led ... not a wall of text; the premise, the realm, and the first
// thing that needs doing." Three beats, each short enough to read at a
// glance, hosted in the same centered setup window ruler-hooked/t-024
// introduced (see ruler-hooked-opening.vue). The last beat is voiced by the
// standing advisor, so the opening and "someone to meet" are the same beat
// rather than two separate features bolted together.

import { ADVISOR_CHARACTER_SLUG } from '~/utils/rulerHooked/advisor'

export interface OpeningBeat {
  heading: string
  text: string
  /** Region key whose current scene state doubles as this beat's art. `null`
   *  beats are spoken by the advisor and use their own portrait instead. */
  sceneRegion?: 'castle_grounds' | 'far_shore' | null
}

export interface OpeningContent {
  /** Character slug who speaks the closing beat -- the game's advisor. */
  narratorSlug: string
  beats: OpeningBeat[]
}

export const RULER_HOOKED_OPENING: OpeningContent = {
  narratorSlug: ADVISOR_CHARACTER_SLUG,
  beats: [
    {
      heading: 'A quiet coronation',
      text: 'The crown fit before the ink on the treaty dried. No parade, no war — just a lake kingdom, a half-empty treasury, and your name on the ledgers now.',
      sceneRegion: 'castle_grounds',
    },
    {
      heading: 'The realm',
      text: 'Wildwood to the north, a village that watches the castle more than the water, and a lake that has outlasted every ruler who fished it. What happens on its bank tends to become policy by morning.',
      sceneRegion: 'far_shore',
    },
    {
      heading: 'Quill, the Steward',
      text: '"I keep the ledgers, the gossip, and you — in that order. Cast a line, and let the kingdom find out what kind of ruler you are, one decision at a time."',
      sceneRegion: null,
    },
  ],
}
