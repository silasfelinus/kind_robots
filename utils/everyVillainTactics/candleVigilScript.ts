import type { SceneScript } from './sceneGraph'

export const CANDLE_VIGIL_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'candle-vigil-opening',
      title: 'The Candle That Would Not Die',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Rain beats against the chapel windows. Every memorial candle lights at once, and two mourners slump beside the altar.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The salamander knows this flame. Stand beside the bronze lantern at column five, row four. I need both actions for the binding charm, and my familiar will grant it only once.',
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
          text: 'We can carry them out once the candle is bound. Nobody gets traded to the flame.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'close',
          text: 'A flame that remembers the dead could buy a great many favors. First keep its witnesses alive.',
          next: null,
        },
      ],
    },
    {
      id: 'candle-vigil-choice',
      title: 'What the Wick Remembers',
      trigger: { kind: 'turn', round: 2 },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The candle carries the mourners’ memories. I can promise to preserve them in the bronze lantern, or ask the salamander to extinguish the wick forever. Either way we still need to bind it first.',
          next: null,
          choices: [
            {
              label: 'Preserve the memories',
              next: 'a0',
              effects: [
                { kind: 'flag', flag: 'vigil-memories' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Extinguish the possessed wick',
              next: 'a1',
              effects: [
                { kind: 'flag', flag: 'vigil-extinguish' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'a0',
          speaker: 'priya',
          emotion: 'joyful',
          camera: 'close',
          text: 'The familiar lends us a little warmth. We will keep the lantern until the mourners can decide what becomes of their memories.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'The salamander agrees. Its warning roar distracts the patrol. Once we bind the wick, it will go dark for good.',
          next: null,
        },
      ],
    },
    {
      id: 'candle-vigil-victory',
      title: 'The Last Light',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v',
      nodes: [
        {
          id: 'v',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The two mourners step into the rain. The bronze lantern rests on the chapel steps.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'vigil-memories' },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The memories belong to the people who made them. Let the mourners decide whether the lantern ever opens again.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The wick goes dark. I cannot give them back every memory, but nobody else will be held inside that flame.',
          next: null,
        },
      ],
    },
    {
      id: 'candle-vigil-defeat',
      title: 'An Unfinished Bargain',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The rain is not enough to free the mourners. My promise to the salamander is the least of my debts now.',
          next: null,
        },
      ],
    },
  ],
}
