import type { SceneScript } from './sceneGraph'

export const NIGHTMARE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'nightmare-origin-opening',
      title: 'The Match Under the Bed',
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
          text: "Cold fire rings a student's bed. The dormitory monitor cannot reach them while the nightmare repeats.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Draw the nightmare's cold flame into a harmless signal flare. Get within 3 tiles of column 6, row 3 with clear sight with one action free.",
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
          text: 'You do not have to tell me what you dreamed. Follow the little light, not the fire.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'Someone has been feeding this panic. I want them to answer for it, but first I need the student out.',
          next: null
        }
      ]
    },
    {
      id: 'nightmare-origin-choice',
      title: 'Comfort the frightened student?',
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
          text: 'We have two options: comfort the frightened student or confront the panic exploiter. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Comfort the frightened student',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'nightmare-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Confront the panic exploiter',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'nightmare-choice-b'
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
          text: 'The monitor distributes first aid and clears a quiet space.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The exploiter's broadcast is interrupted and the patrol loses its orders.",
          next: null
        }
      ]
    },
    {
      id: 'nightmare-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'nightmare-choice-a'
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
          text: 'The student can sleep somewhere safe tonight. Their nightmare is not a public performance.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The panic broadcast is documented. The student's account remains theirs to share.",
          next: null
        }
      ]
    },
    {
      id: 'nightmare-origin-defeat',
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
          text: 'The cold fire still surrounds the bed. I have not given the student a way out.',
          next: null
        }
      ]
    }
  ]
}

export const LIFT_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'lift-origin-opening',
      title: 'The Elevator That Floated',
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
          text: "The hospital's gravity brakes fail. A supply elevator rises past its landing with a patient and an orderly aboard.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Lower the drifting elevator to a stable landing with controlled telekinesis. Get within 3 tiles of column 6, row 2 with clear sight with one action free.',
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
          text: 'Keep your hands inside the rail. I can hold the car steady while you step off.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The hospital contractor thinks gravity is somebody else's problem. I will take control of the lift, not its passengers.",
          next: null
        }
      ]
    },
    {
      id: 'lift-origin-choice',
      title: 'Land immediately for the patient?',
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
          text: 'We have two options: land immediately for the patient or retrieve the trapped oxygen supplies. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Land immediately for the patient',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'lift-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Retrieve the trapped oxygen supplies',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'lift-choice-b'
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
          text: 'The orderly opens the treatment kit on the landing.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The recovered supply controller interrupts the security patrol's orders.",
          next: null
        }
      ]
    },
    {
      id: 'lift-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'lift-choice-a'
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
          text: 'The patient reaches treatment. The next lift needs brakes that work without me.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The oxygen supplies reach the ward. The patient still gets priority on the landing.',
          next: null
        }
      ]
    },
    {
      id: 'lift-origin-defeat',
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
          text: 'The elevator has not reached a safe floor. I cannot keep it suspended forever.',
          next: null
        }
      ]
    }
  ]
}

export const TESTIMONY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'testimony-origin-opening',
      title: 'The Stone That Testified',
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
          text: 'A courthouse paving stone whispers contradictory memories. A witness and clerk are trapped behind a cordon.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Touch the speaking paving stone and separate remembered evidence from suggestion. Stand on column 5, row 4 with one action free.',
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
          text: 'I can hear what the stone remembers. That does not mean every voice coming through it is telling the truth.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The people who own the deed want me to choose their memory. I can expose the alteration without inventing another.',
          next: null
        }
      ]
    },
    {
      id: 'testimony-origin-choice',
      title: 'Protect the witnesses until a fair hearing?',
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
          text: 'We have two options: protect the witnesses until a fair hearing or broadcast the verified evidence. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Protect the witnesses until a fair hearing',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'testimony-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Broadcast the verified evidence',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'testimony-choice-b'
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
          text: 'The clerk arranges treatment and a protected waiting area.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The verified record interrupts the cordon's orders.",
          next: null
        }
      ]
    },
    {
      id: 'testimony-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'testimony-choice-a'
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
          text: 'The witness can testify without being dragged into a public spectacle.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The verified record is public. The witness's unrelated memories are not.",
          next: null
        }
      ]
    },
    {
      id: 'testimony-origin-defeat',
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
          text: "The cordon still holds. I cannot call a stone's accusation a completed hearing.",
          next: null
        }
      ]
    }
  ]
}

export const LETTER_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'letter-origin-opening',
      title: 'The Letter No One Sent',
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
          text: "The river rises with the mourners' unspoken grief. Two people are stranded on the memorial bridge.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "Redirect the psychic flood at the memorial rail without taking away anyone's grief. Get within 3 tiles of column 6, row 4 with clear sight with one action free.",
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
          text: 'You can keep the feeling. I only need to help you find somewhere safe to carry it.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'Everyone wants the river to stop remembering. I can quiet the current without erasing what happened.',
          next: null
        }
      ]
    },
    {
      id: 'letter-origin-choice',
      title: "Respect the recipient's refusal?",
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
          text: "We have two options: respect the recipient's refusal or deliver the apology with consent. Either way, we still need to open the escape route.",
          next: null,
          choices: [
            {
              label: "Respect the recipient's refusal",
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'letter-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Deliver the apology with consent',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'letter-choice-b'
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
          text: 'The volunteer brings blankets and medical supplies without opening the letter.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The agreed delivery interrupts the confrontation and the patrol loses its coordination.',
          next: null
        }
      ]
    },
    {
      id: 'letter-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'letter-choice-a'
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
          text: 'The unopened letter stays with its owner. Nobody owes forgiveness to the river.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The apology was heard on the recipient's terms. It does not demand an answer.",
          next: null
        }
      ]
    },
    {
      id: 'letter-origin-defeat',
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
          text: 'The flood still separates the mourners from the shore. I have not made the crossing safe.',
          next: null
        }
      ]
    }
  ]
}

export const ARCHIVE_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'archive-origin-opening',
      title: 'The Book That Walked Away',
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
          text: 'A rare book passes through a locked display. The security gate traps the student claimant and the attendant.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Step through the security blind spot and catch the displaced book at the gate. Stand beside column 5, row 3 with one action free.',
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
          text: 'The book is not going anywhere until I know whose it is. Clear the gate without hurting the witnesses.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'Someone has confused possession with ownership. I can catch the book before they lock away the evidence.',
          next: null
        }
      ]
    },
    {
      id: 'archive-origin-choice',
      title: 'Return the book to the archive?',
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
          text: "We have two options: return the book to the archive or investigate the student's theft claim. Either way, we still need to open the escape route.",
          next: null,
          choices: [
            {
              label: 'Return the book to the archive',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'archive-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: "Investigate the student's theft claim",
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'archive-choice-b'
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
          text: 'The attendant brings first aid and secures a temporary holding shelf.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The claimant's record interrupts the security patrol's orders.",
          next: null
        }
      ]
    },
    {
      id: 'archive-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'archive-choice-a'
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
          text: 'The book returns under a documented receipt. The ownership dispute can still be heard.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The original claim is preserved. Nobody gets to erase it by moving the book again.',
          next: null
        }
      ]
    },
    {
      id: 'archive-origin-defeat',
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
          text: 'The book is still beyond the gate and the witnesses cannot leave. This case is not closed.',
          next: null
        }
      ]
    }
  ]
}

export const THOUGHT_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'thought-origin-opening',
      title: "The Thought That Wasn't Yours",
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
          text: "The same argument appears in every student's inner voice. The moderator locks the doors when the transmitter begins to panic.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Separate implanted suggestions from authentic thoughts at the debate relay. Get within 4 tiles of column 6, row 3 with clear sight with one action free.',
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
          text: 'I know how easy it is to mistake a borrowed answer for your own. Tell me what you actually want.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The election was rigged before anyone cast a vote. I can break the signal without stealing another mind.',
          next: null
        }
      ]
    },
    {
      id: 'thought-origin-choice',
      title: 'Protect the unwitting transmitter?',
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
          text: 'We have two options: protect the unwitting transmitter or expose the manipulation publicly. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Protect the unwitting transmitter',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'thought-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Expose the manipulation publicly',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'thought-choice-b'
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
          text: 'The moderator arranges private care and a quiet exit.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The forged argument's source is recorded and the patrol loses its commands.",
          next: null
        }
      ]
    },
    {
      id: 'thought-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'thought-choice-a'
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
          text: "The transmitter leaves without being blamed for someone else's suggestion.",
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The manipulation is documented without publishing the transmitter's private thoughts.",
          next: null
        }
      ]
    },
    {
      id: 'thought-origin-defeat',
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
          text: 'The relay is still broadcasting. I cannot call these votes freely cast.',
          next: null
        }
      ]
    }
  ]
}

export const PROPHECY_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'prophecy-origin-opening',
      title: 'The Prophecy Auction',
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
          text: 'A fortune seller predicts disaster unless families bid for protection. The planetarium doors close as the bidding rises.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Read several possible futures at the projection dais and mark a safe exit. Get within 2 tiles of column 5, row 4 with clear sight with one action free.',
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
          text: 'I have seen disasters that never happened because someone listened. A future is not a sentence.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The auctioneer sells certainty. I can take away that certainty without selling my own.',
          next: null
        }
      ]
    },
    {
      id: 'prophecy-origin-choice',
      title: 'Protect families while evidence is gathered?',
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
          text: 'We have two options: protect families while evidence is gathered or explain the uncertain futures now. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Protect families while evidence is gathered',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'prophecy-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Explain the uncertain futures now',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'prophecy-choice-b'
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
          text: 'The usher opens a quiet treatment area away from the auction.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The competing projections undermine the auctioneer's commands.",
          next: null
        }
      ]
    },
    {
      id: 'prophecy-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'prophecy-choice-a'
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
          text: 'The families leave without buying a promise. The evidence can speak for itself.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'They heard several possible outcomes, not a guarantee. The auction has lost its leverage.',
          next: null
        }
      ]
    },
    {
      id: 'prophecy-origin-defeat',
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
          text: 'The doors are still closed. Knowing a possible escape is not the same as making one.',
          next: null
        }
      ]
    }
  ]
}

export const RUMOR_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'rumor-origin-opening',
      title: 'The Rumor After Midnight',
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
          text: 'An anonymous story spreads while the prom ballots are counted. The student it targets and a ballot volunteer are trapped in the newspaper room.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'Trace the forged rumor to its first harmed person at the editorial desk. Stand on column 5, row 3 with one action free.',
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
          text: 'I have broken a confidence before. This time the person who was hurt gets to decide what we print.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: 'The editor wants a headline that will control the vote. I can stop the rumor without giving them a better weapon.',
          next: null
        }
      ]
    },
    {
      id: 'rumor-origin-choice',
      title: 'Warn the people at risk privately?',
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
          text: 'We have two options: warn the people at risk privately or publish a verified correction. Either way, we still need to open the escape route.',
          next: null,
          choices: [
            {
              label: 'Warn the people at risk privately',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'rumor-choice-a'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Publish a verified correction',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'rumor-choice-b'
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
          text: 'The volunteer brings private support and treatment supplies.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The correction interrupts the forged story's distribution and the patrol loses its orders.",
          next: null
        }
      ]
    },
    {
      id: 'rumor-origin-victory',
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
          text: 'Both civilians reach safety. The immediate crisis is over, and our decision remains on record.',
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'rumor-choice-a'
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
          text: "The student reaches safety without their private account becoming tomorrow's headline.",
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: "The false claim is corrected. The student's unrelated secrets stay out of print.",
          next: null
        }
      ]
    },
    {
      id: 'rumor-origin-defeat',
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
          text: 'The rumor is still circulating while its target is trapped. I cannot edit that into a victory.',
          next: null
        }
      ]
    }
  ]
}

