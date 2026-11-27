import type { SceneScript } from './sceneGraph'

export const HYDRANT_BLUE_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'hydrant-opening',
      title: 'Hydrant Blue',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The fire station is full of smoke, but the pressure gauges read zero. An illegal diversion has drained the hydrants. Two crews are trapped behind the engine bay.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'I can hear water in the broken main. Get me beside the blue service valve at column five, row three. I can redirect the current without a pump.',
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
          camera: 'close',
          text: 'Get those crews out. We can leave the stolen water contract for the investigators.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'close',
          text: 'The people who sold our water are watching. Save their witnesses before they can close the station.',
          next: null,
        },
      ],
    },
    {
      id: 'hydrant-allocation',
      title: 'One Main, Two Streets',
      trigger: { kind: 'turn', round: 2 },
      start: 'a1',
      nodes: [
        {
          id: 'a1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'Once the main flows, we have a choice. Flood the engine bay and give our injured crew immediate relief, or ration pressure so the next block can still fight its fire.',
          next: null,
          choices: [
            {
              label: 'Flood the engine bay',
              next: 'af',
              effects: [
                { kind: 'flag', flag: 'hydrant-bay-flooded' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Ration water for the next block',
              next: 'ar',
              effects: [
                { kind: 'flag', flag: 'hydrant-pressure-rationed' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'af',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'Our crew gets relief now. The next engine will need a new source before it reaches the neighborhood.',
          next: null,
        },
        {
          id: 'ar',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The diversion crew loses pressure. We keep enough in the line for the street beyond the station.',
          next: null,
        },
      ],
    },
    {
      id: 'hydrant-first-rescue',
      title: 'The First Engine Crew',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A firefighter reaches the pavement carrying a soaked helmet. The second crew is still waiting by the dispatch room.',
          next: null,
        },
      ],
    },
    {
      id: 'hydrant-victory',
      title: 'Water Is Not a Privilege',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Both crews reach the street. A hydrant finally opens, and the firefighters ask whose name should appear on the incident report.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'hydrant-bay-flooded' },
            then: 'vf',
            else: 'vr',
          },
        },
        {
          id: 'vf',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We saved this bay. Tomorrow I owe the next block a working water main.',
          next: null,
        },
        {
          id: 'vr',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'Both crews made it, and there is still water in the line. Let the neighborhood decide what happens to its supply.',
          next: null,
        },
      ],
    },
    {
      id: 'hydrant-defeat',
      title: 'The Empty Gauge',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The pressure gauge falls to zero again. The station doors close with the rescue unfinished. Tidewarden knows exactly which main must be restored next time.',
          next: null,
        },
      ],
    },
  ],
}
