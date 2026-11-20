import type { SceneScript } from './sceneGraph'

/** Chorus's original origin: the choice is what happens to the city's radios
 * after the sponsored loop is broken, not a menu-selected moral alignment. */
export const CHORUS_RADIO_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'radio-opening',
      title: 'The Song That Stopped',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The community radio tower blinks back on during a citywide blackout. A sponsor jingle loops through every emergency receiver, and two crowds move in perfect step toward the sparking transmitter. The firefighters cannot reach their own volunteers.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Chorus. My voice is already inside that tune. Get me onto the raised studio booth at column four, row three. I can sing something the sponsor has not learned to own.',
          next: null,
          branch: {
            when: { kind: 'perspective', perspective: 'villain' },
            then: 'ov',
            else: 'oh',
          },
        },
        {
          id: 'oh',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'Then sing for the people trapped below, not for the microphone. We only get one clean interruption before the backup battery dies.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'over-shoulder',
          text: 'Someone paid to make this crowd obey. We can take their amplifier, but we still need those people alive to tell us who signed the contract.',
          next: null,
        },
      ],
    },
    {
      id: 'radio-choice',
      title: 'One Frequency Left',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The counter-melody will give us a few seconds. Once the crowd is free, do we silence the tower completely, or leave an emergency frequency open for the next neighborhood?',
          next: null,
          choices: [
            {
              label: 'Keep the emergency channel open for the next block',
              next: 'ce',
              effects: [
                { kind: 'flag', flag: 'radio-emergency-frequency' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Cut the broadcast so no sponsor can seize it again',
              next: 'cs',
              effects: [
                { kind: 'flag', flag: 'radio-tower-silenced' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'ce',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The neighbors will have a voice after we leave. They will also have to guard it from whoever bought the jingle.',
          next: null,
        },
        {
          id: 'cs',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'Quiet is safer tonight. Tomorrow the next block will need messengers, not a transmitter.',
          next: null,
        },
      ],
    },
    {
      id: 'radio-first-rescue',
      title: 'The Crowd Breaks Rank',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The first group slips clear of the chanting line, holding hands to keep from falling back into step. The volunteers at the transmitter remain trapped in the press.',
          next: null,
        },
      ],
    },
    {
      id: 'radio-victory',
      title: 'A Voice That Belongs to Nobody',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Both groups reach the street alive. The sponsor jingle ends halfway through its chorus, and the tower lights flicker as the city waits for an honest voice.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'radio-tower-silenced' },
            then: 'vs',
            else: 've',
          },
        },
        {
          id: 'vs',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'You killed the signal. No one can hijack the tower tonight, but the next neighborhood must find its own way through the blackout.',
          next: null,
        },
        {
          id: 've',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'An emergency voice returns to the air. Someone at the next block answers. Chorus smiles when they realize the song belongs to the listeners now.',
          next: null,
        },
      ],
    },
    {
      id: 'radio-defeat',
      title: 'The Loop Finds a New Verse',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The emergency lights fail before both groups can escape. The sponsored melody spreads to the next receiver. Chorus remembers the last verse they did not get to sing.',
          next: null,
        },
      ],
    },
  ],
}
