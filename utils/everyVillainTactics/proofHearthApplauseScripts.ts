import type { SceneScript } from './sceneGraph'

export const PROOF_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'proof-origin-opening',
      title: 'When Two Plus Two Screamed',
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
          text: 'A chalk proof has opened a gap in the symposium floor. Two students cling to a floating staircase that never quite reaches its landing.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The missing vertex is at column seven, row three. With both actions and a clear sightline within five tiles, I can finish the bridge.',
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
          text: 'A proof that leaves people falling is incomplete. Keep their landing clear.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The professor wants my proof to belong to her. Let her see who can finish it. Get those students out.',
          next: null
        }
      ]
    },
    {
      id: 'proof-origin-choice',
      title: 'The Unfinished Equation',
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
          text: 'A sentient shape calls from beyond the breach. We can seal it permanently and tend our wounded, or save the shape and disrupt the patrol. The bridge still needs a proof.',
          next: null,
          choices: [
            {
              label: 'Seal the breach after the bridge is built',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'proof-close'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Rescue the sentient shape',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'proof-shape'
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
          text: 'The closure plan is agreed. Symposium staff distribute first aid.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The shape marks a stable vertex; the patrol hesitates at its changing geometry.',
          next: null
        }
      ]
    },
    {
      id: 'proof-origin-victory',
      title: 'A Proof With Exceptions',
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
          text: 'The students reach solid ground. The chalk lines stop moving, but the question of the sentient shape remains.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'proof-close'
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
          text: 'The breach is sealed. I will record the cost of that conclusion beside the proof.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The shape has crossed. A living exception belongs in the theorem, not in its margins.',
          next: null
        }
      ]
    },
    {
      id: 'proof-origin-defeat',
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
          text: 'The stairs still lead nowhere. A beautiful proof has failed the only test that mattered.',
          next: null
        }
      ]
    }
  ]
}

export const HEARTH_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'hearth-origin-opening',
      title: 'The Heir Who Said No',
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
          text: 'The greenhouse doors seal as an ancestor reads the household pact aloud. A gardener and a witness are trapped among the glass and vines.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The contract lies at column five, row five. Within two tiles, with a clear view and both actions, I can speak its loophole and raise a hearth.',
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
          text: "My mother's grimoire may know the way out. The people here owe our family nothing.",
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'My ancestors want a ruler. I want the terms in my own hands. Get the witnesses clear.',
          next: null
        }
      ]
    },
    {
      id: 'hearth-origin-choice',
      title: 'A Name Is Not a Debt',
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
          text: "The ancestor offers the title if I keep the family's authority intact. I can accept its leverage or renounce it before the witnesses. Neither choice releases the contract by itself.",
          next: null,
          choices: [
            {
              label: 'Accept the family title',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'hearth-title'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Renounce the title',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'hearth-renounce'
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
          text: 'The household stores open to the wounded. The title still carries obligations.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The witnesses hear the refusal. The ancestor's patrol loses its coordinated command.",
          next: null
        }
      ]
    },
    {
      id: 'hearth-origin-victory',
      title: 'An Open Hearth',
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
          text: 'Both witnesses step into the garden. The ancestral voice falls silent long enough for the living to speak.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'hearth-title'
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
          text: 'I accepted the title. I will use its resources to keep the hearth open without demanding loyalty.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The title stays in the grimoire. I can look for my mother without inheriting her obligations.',
          next: null
        }
      ]
    },
    {
      id: 'hearth-origin-defeat',
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
          text: 'The glass is falling and the witnesses are still inside. No title can make that a rescue.',
          next: null
        }
      ]
    }
  ]
}

export const APPLAUSE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'applause-origin-opening',
      title: 'The Empty Applause',
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
          text: "The theater's closing monologue becomes a contract. The lead performer cannot leave the stage, and the stagehand is bound to the next cue.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Stand me on the stage mark at column five, row three with both actions free. I can rewrite the monologue so the performers owe nothing.',
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
          text: 'Nobody has to finish a show to deserve a way out. Hold the wings.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The broker wants a captive audience. I can take the stage from him without keeping his contracts.',
          next: null
        }
      ]
    },
    {
      id: 'applause-origin-choice',
      title: 'No Encore Owed',
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
          text: "Cancel the production and let the cast recover, or finish the scene to reveal the binder's identity. The performers must be free to leave either way.",
          next: null,
          choices: [
            {
              label: 'Cancel the production',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'applause-cancel'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Expose the binder during the finale',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'applause-expose'
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
          text: 'The house lights rise and the stage manager brings first aid.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The final cue names the binder. The patrol falters as its contract is challenged.',
          next: null
        }
      ]
    },
    {
      id: 'applause-origin-victory',
      title: 'The Unbound Curtain',
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
          text: 'The two performers leave through the wings. The audience waits for a curtain call that is no longer compulsory.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'applause-cancel'
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
          text: "The production is canceled. No audience deserves another person's coerced performance.",
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The binder has been named. The performers can decide whether there will ever be an encore.',
          next: null
        }
      ]
    },
    {
      id: 'applause-origin-defeat',
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
          text: 'The stage lights go out with the cast still bound. Applause cannot turn that into a victory.',
          next: null
        }
      ]
    }
  ]
}

