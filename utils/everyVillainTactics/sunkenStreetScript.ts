import type { SceneScript } from './sceneGraph'

export const SUNKEN_STREET_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'street-opening',
      title: 'The Street That Sank',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The Academy bus stop tilts into a fresh sinkhole. A driver and student are trapped on opposite sides of the cabin. Under the street a broken water main churns through the foundation.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Cornerstone here. That cracked high point at column five, row three is our anchor. I need to stand on it and surge earth under the chassis. Nobody crosses safely until I brace that ramp.',
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
          text: 'If the bus falls, we lose both people. If we break the main, the whole neighborhood loses water. Get the street stable first.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'The contractor hid the survey. Save the people or keep evidence of the cover-up, boss, but first stop that bus from slipping.',
          next: null,
        },
      ],
    },
    {
      id: 'street-choice',
      title: 'A City Built on Borrowed Time',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The ruptured pipe is pushing the bus sideways. Reinforce the evacuation crew now, or jam the contractor patrol while we copy the buried inspection logs.',
          next: null,
          choices: [
            {
              label: 'Support the rescuers and protect the water main',
              next: 'cr',
              effects: [
                { kind: 'flag', flag: 'street-water-protected' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Suppress the patrol and secure the inspection records',
              next: 'ce',
              effects: [
                { kind: 'flag', flag: 'street-inspection-proof' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'cr',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The waterworks crew takes over the valves. The passengers still need a path out, but the next block will have drinking water.',
          next: null,
        },
        {
          id: 'ce',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'Survey logs copied. The contractor knew this street was hollow and sent the bus anyway. The evidence may save more people later.',
          next: null,
        },
      ],
    },
    {
      id: 'street-first-rescue',
      title: 'One Person on Solid Ground',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A passenger crosses the earthen ramp. The bus tilts again. A single rescue is not a victory while the second person remains inside.',
          next: null,
        },
      ],
    },
    {
      id: 'street-victory',
      title: 'Ground to Stand On',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Both passengers step onto firm ground. Cornerstone held a road together against its own collapse, and the city will remember the choice made before the rescue.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'street-inspection-proof' },
            then: 've',
            else: 'vw',
          },
        },
        {
          id: 've',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The survey copies prove deliberate negligence. The waterworks crew still has a brutal night of repairs, and now someone can be held accountable.',
          next: null,
        },
        {
          id: 'vw',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'Every tap on the next block still runs. The bus passengers ask about you, not the cameras. The contractor will have to face them without a diversion.',
          next: null,
        },
      ],
    },
    {
      id: 'street-defeat',
      title: 'The Road Gives Way',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The asphalt fails before both passengers escape. The damaged main floods the block and the contractor starts rehearsing a denial. Cornerstone has a failure to carry forward.',
          next: null,
        },
      ],
    },
  ],
}
