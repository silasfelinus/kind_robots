import type { SceneScript } from './sceneGraph'

export const FERRIS_WHEEL_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'wheel-opening',
      title: 'Ferris Wheel Without Air',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Comet City pier, 9:42 p.m. The Ferris wheel is turning against a dead wind. Two passengers are fading in separate gondolas. A private security crew has padlocked the operator booth.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'I am Skyline. Priya points to the vacant wind gauge at column five, row three. Leap onto it with Updraft Catch to open a corridor between the cars. Nobody can climb out until then.',
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
          text: 'The lower car is dropping and a child is shouting from above. We can save both, but we need that corridor before either hatch will open.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'The company locked its own emergency controls. Save the passengers or take their evidence, your call. But get air into those cars first.',
          next: null,
        },
      ],
    },
    {
      id: 'wheel-choice',
      title: 'Who Gets the First Breath?',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The lower car is sinking while the child above is struggling for air. Oxygen packs will steady our team. Jamming the guards will buy a faster approach to the upper gondola.',
          next: null,
          choices: [
            {
              label: 'Send oxygen packs to the lower gondola',
              next: 'cl',
              effects: [
                { kind: 'flag', flag: 'wheel-low-first' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Jam security and climb for the child',
              next: 'cc',
              effects: [
                { kind: 'flag', flag: 'wheel-child-first' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'cl',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The lower passengers get a clean breath and our crew gets back on its feet. The child still waits above, and the air corridor is our only way in.',
          next: null,
        },
        {
          id: 'cc',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The security radios go silent. We have a clear climb toward the child, but the lower gondola is still sinking. Neither rescue is free.',
          next: null,
        },
      ],
    },
    {
      id: 'wheel-first-rescue',
      title: 'An Open Hatch',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'One passenger reaches the pier under Skyline’s air corridor. The other gondola swings through the dark. Saving one is not enough.',
          next: null,
        },
      ],
    },
    {
      id: 'wheel-victory',
      title: 'Both Feet on the Pier',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Both passengers are breathing on the pier. Skyline held an impossible corridor of air while the rescue team crossed it. What happened first will shape their testimony.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'wheel-child-first' },
            then: 'vc',
            else: 'vl',
          },
        },
        {
          id: 'vc',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The child remembers you climbing through the storm. Security claims the radios failed by accident; the families know someone made a dangerous choice.',
          next: null,
        },
        {
          id: 'vl',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The lower gondola remembers the oxygen packs. Both families demand an inquiry into the locked booth, and neither wants a publicity photo.',
          next: null,
        },
      ],
    },
    {
      id: 'wheel-defeat',
      title: 'The Wheel Keeps Turning',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The wheel turns past its last safe angle. Emergency crews find an incomplete rescue and a security company already drafting its excuse. The choices still follow Skyline home.',
          next: null,
        },
      ],
    },
  ],
}
