import type { SceneScript } from './sceneGraph'

export const UNLICENSED_RESCUE_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'library-opening',
      title: 'The Unlicensed Rescue',
      trigger: { kind: 'opening' },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A Comet City library benefit concert goes dark. Two groups are trapped behind a private security field while a hired patrol demands a superhero franchise license before anyone can help.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Captain Valcourt. The family cape can protect a volunteer on the west side of the security gate. Shield one of our allies there before we cross to evacuate the families.',
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
          emotion: 'afraid',
          camera: 'over-shoulder',
          text: 'The sponsor bought the evacuation rights before it hired an electrician. I will stand at the gate if you can keep us safe.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'Their sponsor owns a badge, not the people behind that field. Shield a teammate and we can recover the contracts, too.',
          next: null,
        },
      ],
    },
    {
      id: 'library-choice',
      title: 'The Price of a Hero License',
      trigger: { kind: 'turn', round: 2 },
      start: 'c1',
      nodes: [
        {
          id: 'c1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'wide',
          text: 'The franchise offers emergency clearance if Valcourt endorses its sponsorship. Or we can protect the volunteers anonymously and keep the evidence.',
          next: null,
          choices: [
            {
              label: 'Protect the volunteers and keep their names private',
              next: 'ca',
              effects: [
                { kind: 'flag', flag: 'library-volunteers-protected' },
                { kind: 'heal' },
              ],
            },
            {
              label: 'Accept a sponsorship in exchange for clearance',
              next: 'cs',
              effects: [
                { kind: 'flag', flag: 'library-sponsor-contract' },
                { kind: 'suppress' },
              ],
            },
          ],
        },
        {
          id: 'ca',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'The volunteers retain their anonymity. Rescue belongs to the people doing the work, not a marketing department.',
          next: null,
        },
        {
          id: 'cs',
          speaker: 'priya',
          emotion: 'sly',
          camera: 'close',
          text: 'You got the clearance, but the contract is already playing your face on its screens. Keep a copy of the fine print.',
          next: null,
        },
      ],
    },
    {
      id: 'library-first-rescue',
      title: 'One Evacuation Left',
      trigger: { kind: 'rescue', count: 1 },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The first group reaches the street under the ancestral cape. A second group is still trapped inside. The rescue is not finished.',
          next: null,
        },
      ],
    },
    {
      id: 'library-victory',
      title: 'Who Owns a Rescue?',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Both groups leave the library alive. The private security field fades, but the city has a new argument about who gets to call themselves a hero.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'library-sponsor-contract' },
            then: 'vs',
            else: 'va',
          },
        },
        {
          id: 'vs',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The families are free. Your license is now a public advertisement, and the sponsor expects to collect on its new investment.',
          next: null,
        },
        {
          id: 'va',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'Nobody owns those rescued people. The volunteers fold the cape and refuse the cameras. The crowd cheers for their courage.',
          next: null,
        },
      ],
    },
    {
      id: 'library-defeat',
      title: 'The Library Goes Dark',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'narrator',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The hired patrol closes the security field before everyone gets out. The concert ends in silence. Captain Valcourt will remember how easily a rescue becomes a bill.',
          next: null,
        },
      ],
    },
  ],
}
