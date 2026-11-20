import type { SceneScript } from './sceneGraph'

/**
 * Crossfire chapter six. A three-phase siege of the academy ballroom:
 * the opening rivals, burrowing enforcers on round three and Licensed
 * Legends on round five. The finale must last six rounds to be earned.
 */
export const PROM_NIGHT_FINALE_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'prom-final-opening',
      title: 'Everybody Is Somebody Else’s Villain',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The grand ballroom is still dressed for prom. The spotlight swings across an empty dance floor as the first rival squad blocks the doors. Copper-colored sparks fall from the chandelier.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'wide',
          text: 'Six rounds until the emergency gates release. The first faction already owns the stage, but there are two more forces coming through the service entrances. The dance ends when we can get everybody out.',
          next: null,
          branch: {
            when: { kind: 'perspective', perspective: 'villain' },
            then: 'ov',
            else: 'oh',
          },
        },
        {
          id: 'oh',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'afraid',
          camera: 'close',
          text: 'Half these rivals think we came to ruin their prom. Keep the guests out of the crossfire. We can tell them our side of the story afterward.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'sly',
          camera: 'low-angle',
          text: 'You wanted the whole city looking at us. Now you have it. Hold the room without making the people here wish they had chosen the other side.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-choice',
      title: 'Who Gets the Last Dance?',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The fire exits are rigged to open from the stage booth. I can spend our reserve power to get the injured ushers clear, or cut the rival communication grid to stop their coordinated push.',
          next: 'c2',
        },
        {
          id: 'c2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The whole room will see what we choose. Which order do we give?',
          next: null,
          choices: [
            {
              label: 'Open the exits and carry the ushers out',
              next: 'cs',
              effects: [
                { kind: 'flag', flag: 'prom-shelter' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Cut the command grid and hold the ballroom',
              next: 'cc',
              effects: [
                { kind: 'flag', flag: 'prom-command' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'cs',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'joyful',
          camera: 'over-shoulder',
          text: 'The ushers are safe. They will remember whose hands held the doors when the first wave came through.',
          next: null,
        },
        {
          id: 'cc',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'Their orders are jammed. We own the next few seconds, but the ushers are still looking for a way out.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-shelter',
      title: 'The Door They Left Open',
      trigger: { kind: 'flag', flag: 'prom-shelter' },
      start: 's1',
      nodes: [
        {
          id: 's1',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'Word is spreading through the crowd. Nobody is handing us a trophy, but the first families have reached the courtyard.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-command',
      title: 'A Room Without Orders',
      trigger: { kind: 'flag', flag: 'prom-command' },
      start: 'j1',
      nodes: [
        {
          id: 'j1',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'close',
          text: 'Their formation has broken. Every second they spend fighting their own radios is a second we can use to hold the line.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-phase-two',
      title: 'A Second Invitation',
      trigger: { kind: 'turn', round: 3 },
      start: 't1',
      nodes: [
        {
          id: 't1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The service hatch bursts open. Warren Wreckers rise through the floorboards beneath the buffet; their dust rings mark where the next strike will land.',
          next: 't2',
        },
        {
          id: 't2',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'Second phase. Watch the burrow warnings, block a molehill or intercept its rider. The cracked center panel will not survive another round.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-floor',
      title: 'Glass on the Dance Floor',
      trigger: { kind: 'turn', round: 4 },
      start: 'f1',
      nodes: [
        {
          id: 'f1',
          speaker: 'hattie',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The center of the dance floor is giving way. Everyone clear column five, row four before it collapses. Go around the bandstand, not through the crack.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-phase-three',
      title: 'Licensed to Ruin the Party',
      trigger: { kind: 'turn', round: 5 },
      start: 'p1',
      nodes: [
        {
          id: 'p1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The third faction arrives through the grand entrance: Licensed Legends with wind-up keys and trademark stamps. They surge toward the wounded, sealing signature powers when they get close.',
          next: 'p2',
        },
        {
          id: 'p2',
          speaker: 'vee',
          emotion: 'determined',
          camera: 'close',
          text: 'One final phase. Keep moving, keep a clear route to the exit and do not let those toys pin our powered fighters.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-last-round',
      title: 'The Last Song',
      trigger: { kind: 'turn', round: 6 },
      start: 'l1',
      nodes: [
        {
          id: 'l1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'wide',
          text: 'This is the sixth and final round. Hold until the emergency shutters unlock, even if the stage has already gone quiet. Clearing a wave early will not open the gates.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-secret',
      title: 'The Empty Seat',
      trigger: { kind: 'secret' },
      start: 'x1',
      nodes: [
        {
          id: 'x1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'close',
          text: 'There is a place card for someone who never attended. The sponsor who funded the three rival squads paid for a seat at the head table, then disappeared before the doors locked.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-victory',
      title: 'Everybody Gets a Story',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The emergency gates finally rise. Three factions came to claim the ballroom and none could write its ending alone. The city will tell this story for years.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'prom-shelter' },
            then: 'vs',
            else: 'vc',
          },
        },
        {
          id: 'vs',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'joyful',
          camera: 'over-shoulder',
          text: 'The ushers found their families. Someone hands us a wilted corsage in thanks. Maybe that is better than a victory speech.',
          next: null,
        },
        {
          id: 'vc',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'The rival command net is ours. People kept their distance while we fought, and now they are asking what we intend to do with that power.',
          next: null,
        },
      ],
    },
    {
      id: 'prom-final-defeat',
      title: 'When the Music Stopped',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The ballroom falls before the gates release. The guests scatter through the smoke and broken chairs. Nobody agrees on who started the fight, but everybody remembers how it ended.',
          next: null,
        },
      ],
    },
  ],
}
