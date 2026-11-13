import type { SceneScript } from './sceneGraph'

/**
 * Crosswalk Crisis: an evacuation story, not a disguised elimination match.
 * Authored branches use real stage flags and gameplay effects; the third
 * evacuee, the timer and enemy reinforcements are engine-owned in studio.ts.
 */
export const CROSSWALK_CRISIS_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'crosswalk-opening',
      title: 'Four Green Lights',
      trigger: { kind: 'opening' },
      start: 'a1',
      nodes: [
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Harborline and Third. Four signals turn green at once. A delivery van lies sideways across the stripes. Three people are still stranded in the crossing.',
          next: 'a2',
        },
        {
          id: 'a2',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'over-shoulder',
          text: 'Two rescue pockets, opposite ends of the street. If we all chase the patrol, those people stay in traffic.',
          next: null,
          branch: {
            when: { kind: 'perspective', perspective: 'villain' },
            then: 'av',
            else: 'ah',
          },
        },
        {
          id: 'ah',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'The cameras can watch us fight later. Right now, bring everybody across. All three. We have eight rounds.',
          next: 'a3',
        },
        {
          id: 'av',
          speaker: 'vee',
          emotion: 'angry',
          camera: 'close',
          text: 'They called us villains before we got here. Fine. Let the capes pose for the cameras while we get the actual people out.',
          next: 'a3',
        },
        {
          id: 'a3',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'low-angle',
          text: 'Move between the van and the planters. One action point to escort somebody clear. The crossing closes when the last person is safe, not when the last rival falls.',
          next: null,
        },
      ],
    },
    {
      id: 'crosswalk-switch',
      title: 'The Controller Has Two Wires',
      trigger: { kind: 'turn', round: 2 },
      start: 's1',
      nodes: [
        {
          id: 's1',
          speaker: 'pip',
          emotion: 'sly',
          camera: 'over-shoulder',
          text: 'I found the signal controller. One wire calls the first-aid crew. The other jams the patrol radios. I only have time to cut one.',
          next: 's2',
        },
        {
          id: 's2',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'We can protect the people doing the lifting, or buy one clear move against the shooters. Choose.',
          next: null,
          choices: [
            {
              label: 'Call in the crossing medics',
              next: 'sm',
              effects: [
                { kind: 'flag', flag: 'crosswalk-medics' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Jam the patrol frequency',
              next: 'sj',
              effects: [
                { kind: 'flag', flag: 'crosswalk-jammed' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'sm',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'Medics inbound. They have bandages and very strong opinions about our parking.',
          next: null,
        },
        {
          id: 'sj',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'low-angle',
          text: 'There goes their coordination. Make the silence count.',
          next: null,
        },
      ],
    },
    {
      id: 'crosswalk-first-rescue',
      title: 'One Pair of Feet on Dry Ground',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'priya',
          emotion: 'joyful',
          camera: 'wide',
          text: 'First civilian safe. Two to go, and the far corner is still under fire.',
          next: 'r2',
        },
        {
          id: 'r2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'No victory pose. We go back for the next person.',
          next: null,
        },
      ],
    },
    {
      id: 'crosswalk-toys',
      title: 'The Mascots Hit the Pavement',
      trigger: { kind: 'turn', round: 4 },
      start: 't1',
      nodes: [
        {
          id: 't1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A pair of advertising mascots climb from the halted tram. Their painted grins never change. Their boots click in perfect time with the crossing signal.',
          next: 't2',
        },
        {
          id: 't2',
          speaker: 'remy',
          emotion: 'angry',
          camera: 'close',
          text: 'Wind-up security. Somebody rented an entire publicity stunt to keep three strangers in the road.',
          next: null,
        },
      ],
    },
    {
      id: 'crosswalk-proof',
      title: 'Who Changed the Lights?',
      trigger: { kind: 'secret' },
      start: 'p1',
      nodes: [
        {
          id: 'p1',
          speaker: 'vee',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'Found the override. It is signed by an Academy contractor, not the transit office. This was staged.',
          next: null,
        },
      ],
    },
    {
      id: 'crosswalk-win',
      title: 'Everybody Gets a Sidewalk',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'w1',
      nodes: [
        {
          id: 'w1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The third civilian steps onto the sidewalk. The crossing signal switches to a dull red, and a crowd that had been holding its breath starts cheering.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'crosswalk-jammed' },
            then: 'wj',
            else: 'wm',
          },
        },
        {
          id: 'wj',
          speaker: 'vee',
          emotion: 'joyful',
          camera: 'close',
          text: 'Their radios are still dead. Plenty of time for the evacuees to tell reporters what actually happened.',
          next: 'w2',
        },
        {
          id: 'wm',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The medics have everybody checked out. Apparently our worst injury is one extremely bruised ego.',
          next: 'w2',
        },
        {
          id: 'w2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Heroes, villains, whatever. The people on that pavement get to decide what we were.',
          next: null,
        },
      ],
    },
    {
      id: 'crosswalk-loss',
      title: 'A Signal Nobody Heard',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'l1',
      nodes: [
        {
          id: 'l1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The signals blink out. Emergency shutters cut off the last crossing route. Not everyone made it across.',
          next: 'l2',
        },
        {
          id: 'l2',
          speaker: 'priya',
          emotion: 'angry',
          camera: 'close',
          text: 'They will call this a battle we lost. I will remember it as the rescue we did not finish.',
          next: null,
        },
      ],
    },
  ],
}
