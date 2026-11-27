import type { SceneScript } from './sceneGraph'

export const ORCHARD_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'orchard-origin-opening',
      title: 'The Orchard Under Asphalt',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A demolition truck rattles at the curb. Roots push through asphalt and trap two gardeners behind a buckled fence.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Stand directly on the exposed root at column five, row three. Both actions, no shortcuts. My needles can stitch the roots into a shelter arch.',
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
          text: 'The garden belongs to its neighbors. Give them a way out before the demolition crew comes back.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'close',
          text: 'If the city wants this land back, it can negotiate with me. Get those witnesses out before the pavement folds.',
          next: null,
        },
      ],
    },
    {
      id: 'orchard-origin-choice',
      title: 'A Root Worth Keeping',
      trigger: { kind: 'turn', round: 2 },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The old tree has a cursed heart. We can preserve the tree and brace its roots, or expose and remove the heart. Neither choice substitutes for the shelter arch.',
          next: null,
          choices: [
            {
              label: 'Preserve the ancient tree',
              next: 'a0',
              effects: [
                { kind: 'flag', flag: 'orchard-preserve' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Remove the cursed heart',
              next: 'a1',
              effects: [
                { kind: 'flag', flag: 'orchard-remove' },
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
          text: 'The old tree stays. The seedlings and our wounded have a little more shelter.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'The heart is marked for removal. The roots jolt the demolition patrol off balance.',
          next: null,
        },
      ],
    },
    {
      id: 'orchard-origin-victory',
      title: 'Room to Grow',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v',
      nodes: [
        {
          id: 'v',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Both gardeners reach the pavement beyond the fence. The neighborhood waits for the decision about its tree.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'orchard-preserve' },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The tree still stands. I will ask the gardeners to decide how it is tended, even if they vote against me.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The cursed heart comes out under the gardeners' supervision. Next season the empty patch can grow something that asks for no obedience.",
          next: null,
        },
      ],
    },
    {
      id: 'orchard-origin-defeat',
      title: 'An Unfinished Bargain',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The fence has fallen inward. I cannot call this protection if the gardeners never got out.',
          next: null,
        },
      ],
    },
  ],
}

export const GLASS_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'glass-origin-opening',
      title: 'The Future in the Glass',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The greenhouse panes reflect an empty hospital bed. A patient refuses to move, certain the water has shown their death. A rival patrol closes the rooftop stairs.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The silver bowl is at column six, row four. Give me a clear view within three tiles and both actions; I can change the reflected angle without changing anyone's mind.",
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
          text: 'Show them that the reflection is not a sentence. The patient decides what to do next.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'sly',
          camera: 'close',
          text: 'The bowl could give us leverage over every doctor in the building. Keep the patient and nurse alive; witnesses are worth more than predictions.',
          next: null,
        },
      ],
    },
    {
      id: 'glass-origin-choice',
      title: 'A Future of Their Own',
      trigger: { kind: 'turn', round: 2 },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The bowl offers a frightening image and a gentler possibility. We can explain that a choice remains without showing the vision, or reveal what I saw and let the patient question it.',
          next: null,
          choices: [
            {
              label: 'Offer choices without prophecy',
              next: 'a0',
              effects: [
                { kind: 'flag', flag: 'glass-withhold' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Reveal the frightening vision',
              next: 'a1',
              effects: [
                { kind: 'flag', flag: 'glass-reveal' },
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
          text: 'We keep the vision private. The nurse steadies our injured allies while the patient considers their options.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'The patient hears the warning and asks for evidence. The patrol hesitates as the reflection fractures across the panes.',
          next: null,
        },
      ],
    },
    {
      id: 'glass-origin-victory',
      title: 'After the Reflection',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v',
      nodes: [
        {
          id: 'v',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The patient and nurse reach the stairwell. Outside, the city has not yet become the image in the bowl.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'glass-withhold' },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: "I will not sell a future they never consented to see. The patient's next decision belongs to them.",
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The frightening reflection is on record, but it is still only a possibility. I will not make the patient live inside my warning.',
          next: null,
        },
      ],
    },
    {
      id: 'glass-origin-defeat',
      title: 'An Unfinished Bargain',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The patient never made it past the stairs. A reflection was not enough to change what happened tonight.',
          next: null,
        },
      ],
    },
  ],
}
