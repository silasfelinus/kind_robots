import type { LairChapter } from './types'

/**
 * A self-contained vertical slice. These scenes have authored on-screen animation,
 * not video assets: keep them separate from Dry Gulch's unrendered film manifest.
 */
export const BAT_CORRIDOR: LairChapter = {
  id: 'bat-corridor-poc',
  title: 'The Bat Corridor',
  assistExtra: 0.8,
  lives: 3,
  nodes: [
    { id: 'bat-opening', kind: 'opening', seconds: 3, next: 'bat-horde' },
    {
      id: 'bat-horde',
      kind: 'moment',
      seconds: 4,
      window: [1.2, 2.2],
      expect: 'down',
      success: 'bat-duck',
      death: 'bat-attack',
    },
    { id: 'bat-duck', kind: 'success', seconds: 3.6, next: 'bat-escape' },
    { id: 'bat-attack', kind: 'death', seconds: 3.2, retry: 'bat-horde' },
    { id: 'bat-escape', kind: 'closing', seconds: 3.2 },
  ],
}
