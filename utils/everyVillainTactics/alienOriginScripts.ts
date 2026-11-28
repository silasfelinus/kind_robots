import type { SceneScript } from './sceneGraph'

export const ORBIT_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'orbit-origin-opening',
      title: 'A Refuge in Orbit',
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
          text: "The shuttle's solar sail tears during reentry. The navigator cannot reach the refugee compartment while its panels glow red.",
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Shape a solar shield around the failing sail without burning the hull. Get within 2 tiles of column 6, row 3 with clear sight with one action free.',
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'No papers, no landing clearance. I know exactly how long those families have been waiting.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The border authority wants me to trade their lives for a permit. I want its records, not its permission.',
          next: null,
        },
      ],
    },
    {
      id: 'orbit-origin-choice',
      title: 'Divert energy to the rescue?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: divert energy to the rescue or transmit evidence of deportations. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Divert energy to the rescue',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'orbit-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Transmit evidence of deportations',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'orbit-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The navigator diverts reserve power to the infirmary and hands the squad medical supplies.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The distress transmission carries the deportation records; security loses its coordinated orders.',
          next: null,
        },
      ],
    },
    {
      id: 'orbit-origin-victory',
      title: 'After the Rescue',
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
          text: 'Shuttle navigator and Refugee family: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'orbit-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The shuttle has landed. The passengers deserve a hearing without another emergency hanging over them.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The records reached an independent receiver. My own missing papers are not a reason to let theirs disappear.',
          next: null,
        },
      ],
    },
    {
      id: 'orbit-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The sail is failing and the compartment is still sealed. There is no permit worth that cost.',
          next: null,
        },
      ],
    },
  ],
}

export const TREATY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'treaty-origin-opening',
      title: 'The Treaty in the Clouds',
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
          text: 'The visiting delegation presents a treaty in pressure waves. Students are being asked to surrender airspace rights without a translation.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Translate the pressure-wave treaty at the floating relay. Get within 4 tiles of column 6, row 2 with clear sight with one action free.',
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'A signature cannot be informed if nobody can read the terms. Give me a quiet channel.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'Their delegation thinks a diplomatic title makes a trap legal. I can change the terms before they get a vote.',
          next: null,
        },
      ],
    },
    {
      id: 'treaty-origin-choice',
      title: 'Negotiate safe passage?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: negotiate safe passage or reject the hidden conditions publicly. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Negotiate safe passage',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'treaty-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Reject the hidden conditions publicly',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'treaty-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The interpreter secures temporary passage and provides medical assistance.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The hidden clause is broadcast; the delegation's patrol loses its instructions.",
          next: null,
        },
      ],
    },
    {
      id: 'treaty-origin-victory',
      title: 'After the Rescue',
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
          text: 'Stranded traveler and Student interpreter: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'treaty-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The travelers have passage. The next treaty needs actual representatives from the ground crews.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The hidden conditions are public. I will not sign a replacement that nobody else understands.',
          next: null,
        },
      ],
    },
    {
      id: 'treaty-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The visitor center remains sealed. A diplomatic victory on paper is not an evacuation.',
          next: null,
        },
      ],
    },
  ],
}

export const FOSSIL_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'fossil-origin-opening',
      title: 'The Museum That Moved',
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
          text: 'A sentient exhibit refuses to enter its crate. The packing team locks the gallery and labels the fossil damaged property.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Read the mineral memories and raise an escape passage at the plinth. Stand on column 5, row 4 with one action free.',
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'I remember the inside of a display case. Put the camera away and clear the passage.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The curator has a receipt for a person. I can take the gallery without becoming its next collector.',
          next: null,
        },
      ],
    },
    {
      id: 'fossil-origin-choice',
      title: 'Protect the exhibit from publicity?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: protect the exhibit from publicity or preserve the evidence of theft. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Protect the exhibit from publicity',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'fossil-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Preserve the evidence of theft',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'fossil-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The caretaker covers the cameras and brings treatment supplies.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The accession record is secured; the packing patrol hesitates.',
          next: null,
        },
      ],
    },
    {
      id: 'fossil-origin-victory',
      title: 'After the Rescue',
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
          text: 'Sentient fossil and Exhibition caretaker: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'fossil-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The exhibit chooses where to go. The museum does not get a replacement photograph.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The shipping records survive. Their witnesses need not go back inside the crates to prove them.',
          next: null,
        },
      ],
    },
    {
      id: 'fossil-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The gallery is still locked. I cannot leave a living person behind glass again.',
          next: null,
        },
      ],
    },
  ],
}

export const TIDE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'tide-origin-opening',
      title: 'A Song for the Drowned',
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
          text: 'A polluted tide carries an unfamiliar chorus. Two cleanup volunteers are being drawn toward deep water.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Redirect the tide using controlled harmony at the pontoon's acoustic beacon. Get within 3 tiles of column 6, row 4 with clear sight with one action free.",
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'That song sounds like home, but it is pulling the divers the wrong way. Listen to my counterpoint.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The festival wants a spectacle. I can change the tide without putting its singer on display.',
          next: null,
        },
      ],
    },
    {
      id: 'tide-origin-choice',
      title: 'Work silently to protect the singer?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: work silently to protect the singer or sing openly to summon help. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Work silently to protect the singer',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'tide-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Sing openly to summon help',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'tide-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The diver's crew brings first aid without identifying the singer.",
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The public counter-song interrupts the harbor patrol's commands.",
          next: null,
        },
      ],
    },
    {
      id: 'tide-origin-victory',
      title: 'After the Rescue',
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
          text: 'Cleanup diver and Vulnerable singer: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'tide-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The singer can leave the pontoon without becoming a festival exhibit.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The crowd heard our warning. The singer still decides whether to share a name.',
          next: null,
        },
      ],
    },
    {
      id: 'tide-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The current has not released the divers. A beautiful song is not enough.',
          next: null,
        },
      ],
    },
  ],
}

export const WARRANT_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'warrant-origin-opening',
      title: 'Orders From Home',
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
          text: "A crashed capsule transmits an extradimensional arrest warrant. The cadet's rescuer is trapped under a capture net.",
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Sever the command relay's capture net without touching the captives. Stand beside column 5, row 3 with one action free.",
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The guild can send another warrant. I will cut the net, not the person inside.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'Someone at home thinks the oath makes me their weapon. They can come collect the paperwork.',
          next: null,
        },
      ],
    },
    {
      id: 'warrant-origin-choice',
      title: 'Defy the arrest order?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: defy the arrest order or use the chain of command against the patrol. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Defy the arrest order',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'warrant-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Use the chain of command against the patrol',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'warrant-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The rescuer brings emergency supplies once the warrant is refused.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The counter-order breaks the soldiers' coordinated formation.",
          next: null,
        },
      ],
    },
    {
      id: 'warrant-origin-victory',
      title: 'After the Rescue',
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
          text: 'Capsule survivor and Civilian rescuer: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'warrant-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The warrant is still unsigned. The person who carried me out owes the guild nothing.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The soldiers stood down. I will not use the chain of command to take their place.',
          next: null,
        },
      ],
    },
    {
      id: 'warrant-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The net still holds the rescuer. I have not kept the only promise that matters here.',
          next: null,
        },
      ],
    },
  ],
}

export const FUTURE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'future-origin-opening',
      title: 'A Small Future',
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
          text: "An alien evaluator seizes a free-energy prototype while the lab's safety shutters close on its inventors.",
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Recalibrate the confiscation device from the diagnostic terminal. Get within 4 tiles of column 6, row 3 with clear sight with one action free.',
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'I used to call human science adorable. This is their device, and they know its limits better than I do.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The evaluator thinks expertise grants ownership. I can demonstrate the opposite without stealing the invention.',
          next: null,
        },
      ],
    },
    {
      id: 'future-origin-choice',
      title: 'Accept temporary technical oversight?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "We have two options: accept temporary technical oversight or trust the inventor's independent solution. Either way, we still need to open the escape route.",
          next: null,
          choices: [
            {
              label: 'Accept temporary technical oversight',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'future-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: "Trust the inventor's independent solution",
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'future-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The evaluator releases medical equipment for the trapped technicians.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The inventor's solution breaks the evaluator's access code and interrupts the patrol.",
          next: null,
        },
      ],
    },
    {
      id: 'future-origin-victory',
      title: 'After the Rescue',
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
          text: 'Human inventor and Lab technician: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'future-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The lab is open. Oversight ends when the local researchers can operate safely on their own.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The inventors retain the device and its instructions. I will ask before making the next improvement.',
          next: null,
        },
      ],
    },
    {
      id: 'future-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The laboratory is still sealed. Being cleverer than the evaluator did not get the technicians out.',
          next: null,
        },
      ],
    },
  ],
}

export const CROWN_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'crown-origin-opening',
      title: 'The Missing Coronation',
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
          text: 'A heritage ceremony transports students into a mirrored courtyard. The royal claimant demands an oath before the exit can open.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Open the royal gateway without binding anyone to the crown. Get within 2 tiles of column 5, row 4 with clear sight with one action free.',
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'I grew up without a crown. These students do not need one to go home.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'My court wants a ruler. I can take command of the gateway without asking anyone to kneel.',
          next: null,
        },
      ],
    },
    {
      id: 'crown-origin-choice',
      title: 'Let the council choose its representative?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: let the council choose its representative or claim emergency command. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Let the council choose its representative',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'crown-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Claim emergency command',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'crown-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The elected representative organizes medical assistance and a safe queue.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The emergency command overrides the court patrol's formation.",
          next: null,
        },
      ],
    },
    {
      id: 'crown-origin-victory',
      title: 'After the Rescue',
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
          text: 'Transported student and Council representative: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'crown-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The students chose their own representative. I can leave the crown in its case.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The emergency is over. The command I claimed must end with it.',
          next: null,
        },
      ],
    },
    {
      id: 'crown-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The gateway is still closed. A coronation would only add another prisoner.',
          next: null,
        },
      ],
    },
  ],
}

export const HIVE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'hive-origin-opening',
      title: 'Everyone Inside',
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
          text: 'A frightened exchange student receives a hive invitation during a missing-person search. The lounge doors close when they hesitate.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Offer a reversible empathic link at the counseling table, with an explicit opt-out. Stand on column 5, row 3 with one action free.',
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
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Silence scares me too. You can refuse this link and I will still help.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'A whole network would obey me tonight. I want the friend found, not another captive mind.',
          next: null,
        },
      ],
    },
    {
      id: 'hive-origin-choice',
      title: 'Follow independent clues?',
      trigger: {
        kind: 'turn',
        round: 2,
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have two options: follow independent clues or use a consensual temporary hive link. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Follow independent clues',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'hive-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Use a consensual temporary hive link',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'hive-choice-b',
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
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The counselor gives the searchers first aid and keeps the private records sealed.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The volunteers share a temporary search map and the patrol loses its coordination.',
          next: null,
        },
      ],
    },
    {
      id: 'hive-origin-victory',
      title: 'After the Rescue',
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
          text: 'Exchange student and Missing friend: both reach safety. The crisis has ended, but the decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'hive-choice-a',
            },
            then: 'va',
            else: 'vb',
          },
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The friend is safe. We can sit together without sharing a single thought.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The temporary link is closed. Everyone gets to leave with their own mind.',
          next: null,
        },
      ],
    },
    {
      id: 'hive-origin-defeat',
      title: 'An Unfinished Rescue',
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
          text: 'The friend is still missing. Joining more minds would not make that choice mine to take.',
          next: null,
        },
      ],
    },
  ],
}
