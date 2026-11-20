import type { SceneScript } from './sceneGraph'

/**
 * Crossfire chapter four's rooftop transmitter: the signal engineer can be
 * protected or exposed. Both choices change the battle and the outcome.
 * The antenna pad must be held through live enemy pressure to win.
 */
export const ROOFTOP_BROADCAST_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'roof-opening',
      title: 'The City Is Listening',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The broadcast terrace hangs over Comet City. A transmitter is sending every police frequency to an unknown listener. Two elevated pads flank its live antenna.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'low-angle',
          text: 'Hold the two antenna tiles for two rounds. Watch the roof height, and check your firing lanes before anybody crosses the catwalk.',
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
          text: 'There is still an engineer inside the transmitter booth. This is not a rescue if we turn her into our next hostage.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'sly',
          camera: 'over-shoulder',
          text: 'The engineer sells secrets for survival. Give her a better offer before our sponsors decide she is expendable.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-choice',
      title: 'The Open Frequency',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The engineer can switch the broadcast to an emergency channel, but she will be exposed. Or I can jam the rival patrol and conceal her identity. We cannot do both.',
          next: 'c2',
        },
        {
          id: 'c2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Whose story gets heard when we take the antenna?',
          next: null,
          choices: [
            {
              label: 'Broadcast the evacuation warning',
              next: 'cw',
              effects: [
                { kind: 'flag', flag: 'roof-warning' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Jam the patrol and shield the engineer',
              next: 'cj',
              effects: [
                { kind: 'flag', flag: 'roof-jammed' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'cw',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'joyful',
          camera: 'over-shoulder',
          text: 'The city heard the alarm. The engineer is on an open frequency now, and so are we.',
          next: null,
        },
        {
          id: 'cj',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'Patrol comms are dark. The engineer stays anonymous, but the evacuation warning is still trapped in this room.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-warning-on-air',
      title: 'An Open Channel',
      trigger: { kind: 'flag', flag: 'roof-warning' },
      start: 'w1',
      nodes: [
        {
          id: 'w1',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'The broadcast is reaching rooftops beyond the harbor. People are getting out before the sirens arrive.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-jammer-live',
      title: 'A Quiet Betrayal',
      trigger: { kind: 'flag', flag: 'roof-jammed' },
      start: 'j1',
      nodes: [
        {
          id: 'j1',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'low-angle',
          text: 'Their radios are silent. The engineer will remember that we kept our promise, even if nobody outside knows why.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-catwalk',
      title: 'Steel Beneath the Rain',
      trigger: { kind: 'turn', round: 3 },
      start: 't1',
      nodes: [
        {
          id: 't1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The west catwalk is sagging. It drops after the next round. Keep your squad clear and take the high ground before the Licensed Legends arrive.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-antenna-held',
      title: 'The First Clear Signal',
      trigger: { kind: 'objective', progress: 1 },
      start: 'h1',
      nodes: [
        {
          id: 'h1',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'low-angle',
          text: 'One round on the transmitter. One more to own the frequency. Keep the rivals off the antenna pad.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-secret',
      title: 'The Other Subscriber',
      trigger: { kind: 'secret' },
      start: 's1',
      nodes: [
        {
          id: 's1',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'close',
          text: 'A second receiver. Someone paid to hear the city from the other side of the crisis. Now we know which account to follow.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-victory',
      title: 'Everybody Heard Something',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The antenna belongs to your squad. Two uninterrupted rounds put the transmitter in your hands. The city will remember how you used it.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'roof-warning' },
            then: 'vw',
            else: 'vj',
          },
        },
        {
          id: 'vw',
          speaker: 'hattie',
          role: 'sidekick',
          emotion: 'joyful',
          camera: 'over-shoulder',
          text: 'The evacuation sounded over every emergency band. The engineer helped, but everybody knows her name now.',
          next: null,
        },
        {
          id: 'vj',
          speaker: 'vee',
          role: 'henchman',
          emotion: 'determined',
          camera: 'close',
          text: 'The engineer walked away unseen. The patrol has no record of us, but the neighborhood never heard a warning.',
          next: null,
        },
      ],
    },
    {
      id: 'roof-defeat',
      title: 'Dead Air',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The transmitter stays in rival hands. Your squad retreats under broken antenna lights as the city hears somebody else narrate the night.',
          next: null,
        },
      ],
    },
  ],
}
