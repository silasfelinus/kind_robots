import type { SceneScript } from './sceneGraph'

/** Backdraft's authored power-origin battle. Vent the diner hood with the
 * signature flare before rescuing the cook from the locked delivery hatch. */
export const LAST_ORDER_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'diner-opening',
      title: 'The Last Order',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Neon Row, 2:13 a.m. The grill flares. Mara the cook is locked behind a delivery hatch, and three insurance enforcers occupy the booths.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'That kitchen hood is choking on hot air. I can vent it with one Backdraft Flare. Column five, row three. Then somebody can reach Mara.',
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
          emotion: 'afraid',
          camera: 'over-shoulder',
          text: 'The insurance files can wait. A person is trapped back there. Cool the air first, or nobody gets through.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'low-angle',
          text: 'A rescued witness is harder to buy than a burnt ledger. Make your own call, boss, but vent the kitchen first.',
          next: null,
        },
      ],
    },
    {
      id: 'diner-choice',
      title: 'A Receipt for Everything',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'Someone disconnected the alarm. We can help the servers clear the smoke, or salvage the forged insurance ledger. Which matters first?',
          next: null,
          choices: [
            {
              label: 'Help the servers escape',
              next: 'cs',
              effects: [
                { kind: 'flag', flag: 'diner-staff-first' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Copy the insurance ledger',
              next: 'ce',
              effects: [
                { kind: 'flag', flag: 'diner-ledger' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'cs',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The servers are safe outside, and they remember who helped. Mara is still behind that hatch.',
          next: null,
        },
        {
          id: 'ce',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'The policy was signed before the fire started. I copied the proof, and cut the enforcers radio. Mara still needs us.',
          next: null,
        },
      ],
    },
    {
      id: 'diner-rescue',
      title: 'One Cook, One Kitchen',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Cool air reaches the hatch. Mara crawls out beneath the cleared hood, clutching a skillet and enough fury to reopen the diner.',
          next: 'r2',
        },
        {
          id: 'r2',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'Next time I order coffee here, I am leaving a fire-extinguisher-sized tip.',
          next: null,
        },
      ],
    },
    {
      id: 'diner-victory',
      title: 'The Tab Comes Due',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The staff survives. You opened the hood, reached Mara and earned a witness. The choice you made before the rescue has a future.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'diner-ledger' },
            then: 'vl',
            else: 'vs',
          },
        },
        {
          id: 'vl',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The insurer has a forged claim to answer for. Mara calls it proof. The servers call it a very long night.',
          next: null,
        },
        {
          id: 'vs',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'Everyone outside knows who carried them through the smoke. The insurer can try explaining that at the hearing.',
          next: null,
        },
      ],
    },
    {
      id: 'diner-defeat',
      title: 'Kitchen Closed',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The hood keeps choking. The hatch stays shut when the sirens arrive. You will have to answer for the rescue that never happened.',
          next: null,
        },
      ],
    },
  ],
}
