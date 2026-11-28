import type { SceneScript } from './sceneGraph'

export const FURNACE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'furnace-origin-opening',
      title: 'The Furnace Lift',
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
          text: 'A melt crane hangs over the exit while the apprentices wait underneath. The emergency switch has been disconnected.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Weld the support bridge without overheating it. Stand beside column 5, row 3 with one action free.',
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
          text: 'The gauntlet is for cutting people free, not impressing the patent office.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The owners wanted my patent. They can watch me decide who gets the bridge.',
          next: null,
        },
      ],
    },
    {
      id: 'furnace-origin-choice',
      title: 'Save the apprentices?',
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
          text: 'We need to decide before the next patrol arrives: save the apprentices or preserve the machine logs. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Save the apprentices',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'furnace-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Preserve the machine logs',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'furnace-choice-b',
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
          text: 'The crane operator hands the squad a first-aid kit while the apprentices prepare to cross.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The machine's tampered log is copied and the factory patrol loses its orders.",
          next: null,
        },
      ],
    },
    {
      id: 'furnace-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'furnace-choice-a',
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
          text: 'The apprentices reach safety. A repair is worth more than a patent in a locked filing cabinet.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The original logs survive the rescue. The whistleblower can decide who sees them.',
          next: null,
        },
      ],
    },
    {
      id: 'furnace-origin-defeat',
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
          text: "The support failed before the apprentices reached it. I won't certify an unfinished weld.",
          next: null,
        },
      ],
    },
  ],
}

export const SKYWAY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'skyway-origin-opening',
      title: 'The Last Skyway',
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
          text: 'A hacked traffic beacon keeps a rescue helicopter circling a tram station. The dispatcher cannot cancel its landing order.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Rewrite the drone flight plan to establish a safe air corridor. Get within 4 tiles of column 6, row 2 with clear sight with one action free.',
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
          text: 'Eleven minutes in the air is enough if the ground crew has a safe route.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The contractor thinks it owns the sky. I can prove otherwise before my battery runs out.',
          next: null,
        },
      ],
    },
    {
      id: 'skyway-origin-choice',
      title: 'Restore public traffic control?',
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
          text: 'We need to decide before the next patrol arrives: restore public traffic control or use the emergency flight loophole. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Restore public traffic control',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'skyway-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Use the emergency flight loophole',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'skyway-choice-b',
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
          text: 'The dispatcher restores the public channel and sends medical assistance.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The loophole diverts the patrol drone, leaving the rescue approach clear.',
          next: null,
        },
      ],
    },
    {
      id: 'skyway-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'skyway-choice-a',
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
          text: 'The station has its public channel back. Ground crews should control their own clearances.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The pilot is safe. The loophole belongs in an open safety review, not an exclusive flight permit.',
          next: null,
        },
      ],
    },
    {
      id: 'skyway-origin-defeat',
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
          text: 'My flight timer ran out while the pilot was still waiting. A speed record cannot make that a rescue.',
          next: null,
        },
      ],
    },
  ],
}

export const FOUNDATION_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'foundation-origin-opening',
      title: 'Foundation Day',
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
          text: 'A demolition rig starts while the tenants are carrying boxes down the only usable stairway. Rain is washing the survey marks away.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Deploy portable braces at the building's remaining exit. Stand on column 5, row 4 with one action free.",
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
          text: 'I lost two classmates to a missing brace. Nobody else should have to wait under that floor.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The builder signed off on this. I want the original order, but not another name on the casualty report.',
          next: null,
        },
      ],
    },
    {
      id: 'foundation-origin-choice',
      title: 'Prioritize the remaining tenants?',
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
          text: 'We need to decide before the next patrol arrives: prioritize the remaining tenants or secure the demolition order. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Prioritize the remaining tenants',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'foundation-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Secure the demolition order',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'foundation-choice-b',
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
          text: 'The volunteer brings treatment supplies and clears the stair landing.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The demolition order is copied and the rig crew hesitates.',
          next: null,
        },
      ],
    },
    {
      id: 'foundation-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'foundation-choice-a',
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
          text: 'The tenants have crossed. They deserve their own building inspector.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The order survives the rain. The tenants can take it to the inquiry themselves.',
          next: null,
        },
      ],
    },
    {
      id: 'foundation-origin-defeat',
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
          text: 'The brace network did not hold long enough. A signed drawing cannot change that.',
          next: null,
        },
      ],
    },
  ],
}

export const PLATFORM_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'platform-origin-opening',
      title: 'The Flooded Platform',
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
          text: 'Water fills the subway channel while the emergency pumps sit idle. A commuter and technician wait in the stranded car.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Tow the train car toward the evacuation ledge with the pressure suit. Get within 3 tiles of column 6, row 4 with clear sight with one action free.',
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
          text: 'The rescue budget is not their problem. Get the tow line ready.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The captain cut the pump budget. I can take control of the emergency circuit, but the passengers come first.',
          next: null,
        },
      ],
    },
    {
      id: 'platform-origin-choice',
      title: 'Evacuate the commuters immediately?',
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
          text: 'We need to decide before the next patrol arrives: evacuate the commuters immediately or restart the emergency pumps. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Evacuate the commuters immediately',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'platform-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Restart the emergency pumps',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'platform-choice-b',
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
          text: 'The technician brings medical supplies to the evacuation ledge.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The pump circuit comes back online and disrupts the patrol's coordination.",
          next: null,
        },
      ],
    },
    {
      id: 'platform-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'platform-choice-a',
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
          text: 'The commuters have reached the stairs. The city must repair the pumps before the next storm.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The pumps are running again. Their maintenance records must remain accessible to the volunteer crews.',
          next: null,
        },
      ],
    },
    {
      id: 'platform-origin-defeat',
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
          text: 'The water has reached the ledge. I cannot call an unanswered distress signal a successful tow.',
          next: null,
        },
      ],
    },
  ],
}

export const PARADE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'parade-origin-opening',
      title: "The Parade That Couldn't Stop",
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
          text: "A timed implant failure drives the drill team toward the crowd. The marshal's stop signal no longer works.",
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Synchronize a nonviolent formation break beside the signal relay. Stand beside column 5, row 3 with one action free.',
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
          text: 'They are veterans, not targets. Give me an opening to change the rhythm.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "Someone bought a demonstration of control. I'll make their parade stop on my terms.",
          next: null,
        },
      ],
    },
    {
      id: 'parade-origin-choice',
      title: 'Treat the wounded veteran?',
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
          text: 'We need to decide before the next patrol arrives: treat the wounded veteran or trace the implant sabotage. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Treat the wounded veteran',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'parade-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Trace the implant sabotage',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'parade-choice-b',
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
          text: 'The marshal brings medical supplies without demanding another demonstration.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The sabotage signal is recorded, interrupting the formation's orders.",
          next: null,
        },
      ],
    },
    {
      id: 'parade-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'parade-choice-a',
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
          text: 'The veteran can choose the next step of recovery. No performance is owed.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The implant records are preserved. The veterans should decide how the inquiry uses them.',
          next: null,
        },
      ],
    },
    {
      id: 'parade-origin-defeat',
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
          text: 'The formation continued into the crowd. I cannot count speed alone as a victory.',
          next: null,
        },
      ],
    },
  ],
}

export const BAKERY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'bakery-origin-opening',
      title: "Grandma's Password",
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
          text: 'An automated oven locks the bakery while a school group waits inside. Its recipe memory still recognizes a familiar voice.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Override the door controller with the recipe-memory sequence without wiping the kitchen AI. Get within 4 tiles of column 6, row 3 with clear sight with one action free.',
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
          text: "A kitchen assistant is not a disposable experiment. Let's find the override that preserves its memory.",
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The surveillance buyer wants the logs erased. I can take the controller without deleting its witnesses.',
          next: null,
        },
      ],
    },
    {
      id: 'bakery-origin-choice',
      title: 'Free the students first?',
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
          text: 'We need to decide before the next patrol arrives: free the students first or preserve the baking logs. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Free the students first',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'bakery-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Preserve the baking logs',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'bakery-choice-b',
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
          text: 'The assistant distributes first aid while the class waits near the door.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The surveillance entries are copied and the patrol's access commands fail.",
          next: null,
        },
      ],
    },
    {
      id: 'bakery-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'bakery-choice-a',
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
          text: 'The class is out. The kitchen AI can keep the recipes it learned from Grandma.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The baking logs survive, with customer details protected. No serum or leap stunt was necessary.',
          next: null,
        },
      ],
    },
    {
      id: 'bakery-origin-defeat',
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
          text: "The oven's doors are still sealed. My clever override is not an excuse for leaving the class inside.",
          next: null,
        },
      ],
    },
  ],
}

export const MUSEUM_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'museum-origin-opening',
      title: 'The Museum of Tomorrow',
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
          text: 'The warranty officer has ordered a prototype repossessed while students are in its elevator. The guide cannot release the cable.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Brace the scholarship elevator with prototype armor. Get within 2 tiles of column 5, row 4 with clear sight with one action free.',
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
          text: 'The suit is only useful if those students get out of it alive.',
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "My board thinks ownership gives it a veto over safety. I'll take that veto away.",
          next: null,
        },
      ],
    },
    {
      id: 'museum-origin-choice',
      title: 'Evacuate the scholarship students?',
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
          text: 'We need to decide before the next patrol arrives: evacuate the scholarship students or preserve the free-school patents. The signature intervention is still necessary.',
          next: null,
          choices: [
            {
              label: 'Evacuate the scholarship students',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'museum-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Preserve the free-school patents',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'museum-choice-b',
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
          text: 'The guide brings treatment supplies and opens the receiving area.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The patent transfer is stopped and the repossession crew loses its orders.',
          next: null,
        },
      ],
    },
    {
      id: 'museum-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'museum-choice-a',
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
          text: 'The students reach the lobby. They need an elevator that works without a Sterling on call.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The patents survive. The scholarship board should hold them independently of my family.',
          next: null,
        },
      ],
    },
    {
      id: 'museum-origin-defeat',
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
          text: "The elevator is still hanging above the lobby. The museum's publicity cannot rescue its passengers.",
          next: null,
        },
      ],
    },
  ],
}

export const EDIT_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'edit-origin-opening',
      title: 'The Edited Rescue',
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
          text: 'An edited rescue clip accuses the rescuer of starting the disaster. Security traps the student interviewee and camera operator behind the studio doors.',
          next: 'o2',
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Trace the missing camera angle from the public livestream console. Stand on column 5, row 3 with one action free.',
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
          text: "A million followers do not entitle me to the witness's name. Find the missing angle.",
          next: null,
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The producer owns the cut. I can take back the feed without selling the student's privacy.",
          next: null,
        },
      ],
    },
    {
      id: 'edit-origin-choice',
      title: "Keep the witness's source private?",
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
          text: "We need to decide before the next patrol arrives: keep the witness's source private or expose the manipulated footage. The signature intervention is still necessary.",
          next: null,
          choices: [
            {
              label: "Keep the witness's source private",
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'edit-choice-a',
                },
                {
                  kind: 'heal',
                },
              ],
            },
            {
              label: 'Expose the manipulated footage',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'edit-choice-b',
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
          text: 'The operator arranges private support and treatment for the student.',
          next: null,
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The original angle is preserved and the security feed loses its orders.',
          next: null,
        },
      ],
    },
    {
      id: 'edit-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, but our choice has consequences.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'edit-choice-a',
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
          text: 'The witness chooses whether to appear. The footage can wait.',
          next: null,
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The manipulation is documented without revealing unrelated private details.',
          next: null,
        },
      ],
    },
    {
      id: 'edit-origin-defeat',
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
          text: 'The feed is still running while the witnesses are trapped. A viral clip is not a rescue.',
          next: null,
        },
      ],
    },
  ],
}
