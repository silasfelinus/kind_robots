import type { SceneScript } from './sceneGraph'

/**
 * Science Wing Lockdown is an actual authored tactical one-shot, not a caption
 * on a generic map. Both playable allegiances see different opening testimony,
 * the turn-two decision changes combat, and its result is acknowledged at the
 * end. The lab's desks, hazards, timer and LOS live in studio.ts/stageRules.
 */
export const SCIENCE_WING_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'science-entry',
      title: 'The Lab Is Not Empty',
      trigger: { kind: 'opening' },
      start: 's1',
      nodes: [
        {
          id: 's1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The science wing security shutters are descending. Someone has painted EVACUATED on a door that is still being kicked from inside.',
          next: 's2',
        },
        {
          id: 's2',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'over-shoulder',
          text: 'Two aisles. Desks bolted down as barricades. That is not fire safety. Somebody built a trap.',
          next: null,
          branch: {
            when: { kind: 'perspective', perspective: 'villain' },
            then: 'sv',
            else: 'sh',
          },
        },
        {
          id: 'sv',
          speaker: 'vee',
          emotion: 'sly',
          camera: 'close',
          text: 'Our contract says guard the research. It does not say leave the researchers in a freezer. Find the switch before our employers change the locks.',
          next: 's3',
        },
        {
          id: 'sh',
          speaker: 'hattie',
          emotion: 'angry',
          camera: 'close',
          text: 'The Academy told us everyone was out. I can hear three heartbeats behind the isolation glass. We are not leaving them.',
          next: 's3',
        },
        {
          id: 's3',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'low-angle',
          text: 'We have eight rounds before the shutters seal. Break the benches for a firing lane, but keep the live water off your boots.',
          next: null,
        },
      ],
    },
    {
      id: 'science-decision',
      title: 'The Wrong Emergency',
      trigger: { kind: 'turn', round: 2 },
      start: 'd1',
      nodes: [
        {
          id: 'd1',
          speaker: 'priya',
          emotion: 'afraid',
          camera: 'wide',
          text: 'The ventilation system just started pumping coolant. I can open the isolation chamber, or pull the security recordings. Not both.',
          next: 'd2',
        },
        {
          id: 'd2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Make the call. If we win the fight but lose the people or the proof, somebody will call it a clean operation.',
          next: null,
          choices: [
            {
              label: 'Get the researchers out',
              next: 'dr',
              effects: [{ kind: 'flag', flag: 'lab-rescued' }, { kind: 'heal' }],
            },
            {
              label: 'Copy the security recordings',
              next: 'de',
              effects: [{ kind: 'flag', flag: 'lab-evidence' }, { kind: 'suppress' }],
            },
          ],
        },
        {
          id: 'dr',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'over-shoulder',
          text: 'Door is off its hinges. Three very annoyed scientists are walking out under their own power.',
          next: null,
        },
        {
          id: 'de',
          speaker: 'priya',
          emotion: 'sly',
          camera: 'over-shoulder',
          text: 'Got the recording. It names the people who ordered the shutters closed. I also just knocked their radio network offline.',
          next: null,
        },
      ],
    },
    {
      id: 'science-first-down',
      title: 'Broken Glass',
      trigger: { kind: 'kill', team: 'rival', count: 1 },
      start: 'k1',
      nodes: [
        {
          id: 'k1',
          speaker: 'remy',
          emotion: 'afraid',
          camera: 'low-angle',
          text: 'Stop shooting the workstations! Those are the only copies of the experiment. Oh, and someone has stepped on my coat.',
          next: 'k2',
        },
        {
          id: 'k2',
          speaker: 'hattie',
          emotion: 'determined',
          camera: 'close',
          text: 'Then get out from behind one. We can do this without turning anybody into a specimen.',
          next: null,
        },
      ],
    },
    {
      id: 'science-recording',
      title: 'The Unedited Tape',
      trigger: { kind: 'flag', flag: 'lab-evidence' },
      start: 'e1',
      nodes: [
        {
          id: 'e1',
          speaker: 'priya',
          emotion: 'determined',
          camera: 'close',
          text: 'The file is signed by three administrators. Somebody ordered a lockdown to hide a failed test, not to stop one.',
          next: null,
        },
      ],
    },
    {
      id: 'science-rescue',
      title: 'A Very Bad Consent Form',
      trigger: { kind: 'flag', flag: 'lab-rescued' },
      start: 'r1',
      nodes: [
        {
          id: 'r1',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'One scientist wants a lawyer. One wants a blanket. The third wants to know where to send a complaint about the lab.',
          next: null,
        },
      ],
    },
    {
      id: 'science-victory',
      title: 'Science Has Witnesses',
      trigger: { kind: 'closing', outcome: 'victory' },
      start: 'v1',
      nodes: [
        {
          id: 'v1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The shutters stop twelve inches from the floor. The patrol withdraws. The lab is secure, though no one agrees on what that means.',
          next: null,
          branch: {
            when: { kind: 'flag', flag: 'lab-evidence' },
            then: 've',
            else: 'vr',
          },
        },
        {
          id: 've',
          speaker: 'priya',
          emotion: 'joyful',
          camera: 'close',
          text: 'The report will say we damaged school property. The unedited footage says why. They can try to explain that at the hearing.',
          next: 'v2',
        },
        {
          id: 'vr',
          speaker: 'hattie',
          emotion: 'joyful',
          camera: 'close',
          text: 'Three researchers got home tonight. The Academy can explain its property damage to them in person.',
          next: 'v2',
        },
        {
          id: 'v2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Seal the doors. Do not seal the story.',
          next: null,
        },
      ],
    },
    {
      id: 'science-defeat',
      title: 'The Shutters Win',
      trigger: { kind: 'closing', outcome: 'defeat' },
      start: 'f1',
      nodes: [
        {
          id: 'f1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The shutters meet the floor. The security cameras turn toward the empty corridor as if nothing happened.',
          next: 'f2',
        },
        {
          id: 'f2',
          speaker: 'vee',
          emotion: 'angry',
          camera: 'close',
          text: 'Someone is going to call this a successful containment. We know exactly who paid for that word.',
          next: null,
        },
      ],
    },
  ],
}
