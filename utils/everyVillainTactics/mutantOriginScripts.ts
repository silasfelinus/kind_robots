import type { SceneScript } from './sceneGraph'

export const ASH_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'ash-origin-opening',
      title: 'Ashes of the Ledger',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The officials have barred the clinic's exit. The archivist and patient advocate are trapped beside their records.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Cut a safe escape hole through the reinforced door without igniting the charts. Stand beside column 5, row 3 with one action free.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "I may forget their faces. I won't let the charts become a second injury.",
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The registry could give me leverage, but first get its patients out.',
          next: null
        }
      ]
    },
    {
      id: 'ash-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Expose the illegal registry',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'ash-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Protect patient privacy',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'ash-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The archivist supplies copies with unrelated names redacted.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The advocate secures the private charts and the patrol loses its orders.',
          next: null
        }
      ]
    },
    {
      id: 'ash-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'ash-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: "The registry is preserved for an inquiry. I'll write down what I did before I forget it.",
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The private records remain under patient control. That is a rescue worth remembering.',
          next: null
        }
      ]
    },
    {
      id: 'ash-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const BALCONY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'balcony-origin-opening',
      title: 'The Balcony Witness',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A messenger bird lands with blackmail evidence. A shot scatters the flock above the assembly balcony.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Redirect the flock through the high windows to shield the witness. Get within 4 tiles of column 6, row 2 with clear sight with one action free.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Keep the witness out of view. No one has to fly alone.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The blackmailers want my wings in their cameras. Let's give them a different story.",
          next: null
        }
      ]
    },
    {
      id: 'balcony-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Protect the informant',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'balcony-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Reveal the blackmailers',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'balcony-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The witness takes the sheltered route and the gardener provides aid.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The flock carries a copy of the evidence; the patrol loses its coordination.',
          next: null
        }
      ]
    },
    {
      id: 'balcony-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'balcony-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The informant can tell the story when ready, not when a camera demands it.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The blackmailers have been named. The witness still owns the decision to speak.',
          next: null
        }
      ]
    },
    {
      id: 'balcony-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const BRIDGE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'bridge-origin-opening',
      title: 'Bridge of Last Chances',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'Demolition begins while a family is still crossing the condemned footbridge. The span shakes beneath their feet.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Reinforce the failing span with living stone at the bridge's center. Stand on column 5, row 4 with one action free.",
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'I can hear their heartbeats through the stone. Keep the crossing clear.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The foreman wants the bridge gone before the paperwork can be seen. I want his evidence, but not at their expense.',
          next: null
        }
      ]
    },
    {
      id: 'bridge-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Stay with the last family',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'bridge-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Preserve the demolition evidence',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'bridge-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The volunteer brings supplies to the waiting family.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The foreman's records are secured and his patrol hesitates.",
          next: null
        }
      ]
    },
    {
      id: 'bridge-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'bridge-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The family is across. The photograph can wait until they choose to take it.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The demolition order survives. The residents should be able to inspect it.',
          next: null
        }
      ]
    },
    {
      id: 'bridge-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const FERRY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'ferry-origin-opening',
      title: 'A Ship With No Port',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A damaged ferry is denied docking while a storm tears at its engines. The engineer and displaced passengers cannot reach the pier.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Shape a temporary seawall beside the ferry channel. Get within 3 tiles of column 6, row 4 with clear sight with one action free.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'A rescue line is for everyone, not just the people on the port register.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The harbor office wants a price for landing. I could take its keys; first keep the ferry afloat.',
          next: null
        }
      ]
    },
    {
      id: 'ferry-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Save the engines',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'ferry-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Demand docking rights',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'ferry-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The engineer stabilizes the engines and the deck crew brings first aid.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The port authority's orders are challenged, interrupting the patrol.",
          next: null
        }
      ]
    },
    {
      id: 'ferry-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'ferry-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The ferry is afloat and the families have reached shore. The port still owes them an answer.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The docking agreement must survive longer than tonight's emergency.",
          next: null
        }
      ]
    },
    {
      id: 'ferry-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const RIG_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'rig-origin-opening',
      title: 'Four Hands and a Promise',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The novice hangs above a failing aerial rig. The competition judges demand that the rehearsal continue.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Stabilize the rig's ropes beside the failed anchor with four hands. Stand beside column 5, row 3 with one action free.",
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'A dancer is not a weapon. Get my partner close enough to help.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The judges want a performance. They can watch me refuse their rules.',
          next: null
        }
      ]
    },
    {
      id: 'rig-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: "Protect the novice's career",
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'rig-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Reveal the rig sabotage',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'rig-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The novice receives treatment without a compulsory interview.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The sabotage is recorded; the judges' patrol loses its timing.",
          next: null
        }
      ]
    },
    {
      id: 'rig-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'rig-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The novice can decide when to return to the floor. No encore is owed.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The equipment report will follow the championship, not disappear with it.',
          next: null
        }
      ]
    },
    {
      id: 'rig-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const FORECAST_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'forecast-origin-opening',
      title: 'A Probability of Panic',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'A broken spotlight threatens to trigger three failures in succession. The performers have been told the forecast says the show is safe.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Identify the keystone fault from a clear sightline and interrupt the chain reaction. Get within 4 tiles of column 6, row 3 with clear sight with one action free.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The forecast is not a verdict. We can change the next event.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'Someone sold a guaranteed ending. I can make their calculation fail.',
          next: null
        }
      ]
    },
    {
      id: 'forecast-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Prioritize the performers',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'forecast-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Preserve the forecast evidence',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'forecast-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The technician brings supplies and clears the rehearsal space.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The original forecast is copied and the patrol loses its coordinated push.',
          next: null
        }
      ]
    },
    {
      id: 'forecast-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'forecast-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The people on the stage get to choose what happens next, not the forecast.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The forecast remains intact as evidence. Keep its errors in the report.',
          next: null
        }
      ]
    },
    {
      id: 'forecast-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const KEYS_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'keys-origin-opening',
      title: 'Keys to the Shelter',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The heritage shelter has empty beds and locked doors. A family waits in the cold while an attendant argues with the trustees.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Raise the ancestral shelter ward at the sealed doorway. Get within 2 tiles of column 5, row 4 with clear sight with one action free.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The ward belongs to the people who need shelter, not the crest on the door.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The trustees think the family title gives them power. Let's see what they do when I use mine.",
          next: null
        }
      ]
    },
    {
      id: 'keys-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Open quietly and protect the family',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'keys-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Challenge the inherited rules publicly',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'keys-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The attendant brings blankets and first aid without demanding a pledge.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The exclusion rule is challenged; the trustees' patrol loses its orders.",
          next: null
        }
      ]
    },
    {
      id: 'keys-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'keys-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The family is warm tonight. Tomorrow they deserve an entrance that does not need me.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The trustees have been challenged. I won't let my name become another admission requirement.",
          next: null
        }
      ]
    },
    {
      id: 'keys-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

export const SLATE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'slate-origin-opening',
      title: 'The Friend Nobody Remembers',
      trigger: {
        kind: 'opening'
      },
      start: 'o1',
      nodes: [
        {
          id: 'o1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The representative cannot remember agreeing to the slate. A frightened volunteer is trapped behind the council's security cordon.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Retrace the trustworthy relationship at the council table without removing the blocking patch. Stand on column 5, row 3 with one action free.',
          next: null,
          branch: {
            when: {
              kind: 'perspective',
              perspective: 'villain'
            },
            then: 'ov',
            else: 'oh'
          }
        },
        {
          id: 'oh',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "I'll keep the patch on. They deserve a choice that is actually theirs.",
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The slate could give me the council. I won't need a borrowed agreement to take it.",
          next: null
        }
      ]
    },
    {
      id: 'slate-origin-choice',
      title: 'The Next Decision',
      trigger: {
        kind: 'turn',
        round: 2
      },
      start: 'a',
      nodes: [
        {
          id: 'a',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We have a decision to make before the next wave. The signature intervention is still necessary to get both civilians out.',
          next: null,
          choices: [
            {
              label: 'Rescue the friend confidentially',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'slate-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Expose the coercion',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'slate-choice-b'
                },
                {
                  kind: 'suppress'
                }
              ]
            }
          ]
        },
        {
          id: 'a0',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The representative arranges confidential support and first aid.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The false agreement is exposed without unrelated secrets; the patrol hesitates.',
          next: null
        }
      ]
    },
    {
      id: 'slate-origin-victory',
      title: 'After the Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'victory'
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
              flag: 'slate-choice-a'
            },
            then: 'va',
            else: 'vb'
          }
        },
        {
          id: 'va',
          speaker: 'backdraft',
          emotion: 'joyful',
          camera: 'close',
          text: 'The volunteer can speak when ready. Friendship is not a witness fee.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The slate is challenged. The representative can choose a new vote without my influence.',
          next: null
        }
      ]
    },
    {
      id: 'slate-origin-defeat',
      title: 'An Unfinished Rescue',
      trigger: {
        kind: 'closing',
        outcome: 'defeat'
      },
      start: 'd',
      nodes: [
        {
          id: 'd',
          speaker: 'backdraft',
          emotion: 'afraid',
          camera: 'close',
          text: 'The civilians are still trapped. I have not finished the rescue.',
          next: null
        }
      ]
    }
  ]
}

