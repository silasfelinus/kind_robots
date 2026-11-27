import type { SceneScript } from './sceneGraph'

export const CLOCKTOWER_COLLAPSE_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'clocktower-collapse-opening',
      title: 'The Clocktower Collapse',
      trigger: {
        kind: 'opening',
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Graduation banners sway beneath the clocktower. Its hands stop, then a maintenance platform drops. Someone is feeding false timing signals into the gears.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Get me beside the escapement at column five, row four. On an even round the gears align; I can catch the lift before the next chime.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain',
            },
            then: 'ov',
            else: 'oh',
          },
        },
        {
          id: 'oh',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: "The technician comes first. We'll keep the sabotage recording if we can.",
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'close',
          text: 'A broken clock is leverage. Get the technician out before the saboteur can buy their silence.',
          next: null,
        },
      ],
    },
    {
      id: 'clocktower-collapse-choice',
      title: 'A choice under pressure',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: "The technician's emergency belt and the sabotage recorder share a power cable. Divert it to stabilize our injured crew or keep the recorder live to disrupt the patrol's timing.",
          next: null,
          choices: [
            {
              label: 'Divert to emergency support',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'clock-support',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Preserve the timing record',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'clock-evidence',
                },
                {
                  kind: 'suppress',
                },
              ],
            },
          ],
        },
        {
          id: 'a0',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: "The technician's emergency equipment is charged. We will need testimony to reconstruct the sabotage.",
          next: null,
        },
        {
          id: 'a1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The patrol loses synchronization. The recorder stays intact for the investigation.',
          next: null,
        },
      ],
    },
    {
      id: 'clocktower-collapse-victory',
      title: 'What the rescue leaves behind',
      trigger: {
        kind: 'closing',
        outcome: 'victory',
      },
      start: 'v',
      nodes: [
        {
          id: 'v',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The last witness reaches safety. The incident record remains open.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'clock-support',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The technician is safe. I will ask for their account instead of pretending the lost recording never mattered.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The technician is safe and the timing record survived. The city can finally see the seconds someone stole.',
          next: null,
        },
      ],
    },
    {
      id: 'clocktower-collapse-defeat',
      title: 'Unfinished rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat',
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The clock strikes without the technician reaching safety. I can still hear the missing beat.',
          next: null,
        },
      ],
    },
  ],
}

export const EQUATION_ESCAPED_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'equation-that-escaped-opening',
      title: 'The Equation That Escaped',
      trigger: {
        kind: 'opening',
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "A whiteboard proof unfolds into paper drones. The science fair's exits lock as the machines begin treating people as arithmetic errors.",
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The faulty drone is at column six, row three. Get me within four tiles with a clear line of sight. I can rewrite its proof into an emergency shield.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain',
            },
            then: 'ov',
            else: 'oh',
          },
        },
        {
          id: 'oh',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'We need the students out, then an explanation the public can understand.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'close',
          text: 'Everyone will want the solution. Keep the witnesses safe while we decide who gets the proof.',
          next: null,
        },
      ],
    },
    {
      id: 'equation-that-escaped-choice',
      title: 'A choice under pressure',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The corrected proof exposes the original error. Publish it to disrupt the hostile drones, or privately patch the system and use the spare capacity to help our wounded.',
          next: null,
          choices: [
            {
              label: 'Patch the system privately',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'equation-private',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Publish the failed proof',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'equation-public',
                },
                {
                  kind: 'suppress',
                },
              ],
            },
          ],
        },
        {
          id: 'a0',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'The emergency patch frees resources for the crew. The original error is still ours to explain.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The hostile drones lose their instructions. Everyone can inspect the mistake.',
          next: null,
        },
      ],
    },
    {
      id: 'equation-that-escaped-victory',
      title: 'What the rescue leaves behind',
      trigger: {
        kind: 'closing',
        outcome: 'victory',
      },
      start: 'v',
      nodes: [
        {
          id: 'v',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The last witness reaches safety. The incident record remains open.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'equation-private',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Both witnesses are safe. I fixed the machine, but I still owe them an explanation of the error.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'Both witnesses are safe. My name belongs on the failed proof as well as the corrected one.',
          next: null,
        },
      ],
    },
    {
      id: 'equation-that-escaped-defeat',
      title: 'Unfinished rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat',
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The fair is evacuated only in the simulation. No calculation makes the people we missed disappear.',
          next: null,
        },
      ],
    },
  ],
}
