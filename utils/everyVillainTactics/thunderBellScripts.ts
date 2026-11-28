import type { SceneScript } from './sceneGraph'

export const THUNDER_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'thunder-origin-opening',
      title: 'Overdue Thunder',
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
          text: 'A stolen book opens in the floating reading room. Thunder tears bookmarks from the shelves. An injured reader is stranded across the annex.',
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The storm is centered on column six, row three. Give me a clear view within four tiles and both actions. I can fold the cloud without destroying its pages.',
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
          text: 'The forbidden book can wait. Keep the readers alive, and let them decide whether to ask for its help.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The archive could give me the city's weather. First bring the witnesses out of the annex alive.",
          next: null
        }
      ]
    },
    {
      id: 'thunder-origin-choice',
      title: 'An Overdue Cure',
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
          text: 'The librarian wants the book locked away. Its margins contain a cure the injured reader could choose to try. We can secure the shelf or let the reader study the passage.',
          next: null,
          choices: [
            {
              label: 'Return the book to its sealed shelf',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'thunder-sealed'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Let the injured reader study the cure',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'thunder-cure'
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
          text: 'The shelf is sealed, and the librarian hands the squad ordinary first-aid supplies.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: "The reader copies the cure and the storm's last gust disrupts the patrol. No one is forced to use it.",
          next: null
        }
      ]
    },
    {
      id: 'thunder-origin-victory',
      title: 'The Last Bookmark',
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
          text: "Both readers reach the grounded stairway. The book's final page is dry; the library must decide what it will allow people to read.",
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'thunder-sealed'
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
          text: 'I will leave the shelf closed for now, but the reader deserves an explanation of what was withheld.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The reader has the cure in their own handwriting. The storm is no longer a reason to keep every page secret.',
          next: null
        }
      ]
    },
    {
      id: 'thunder-origin-defeat',
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
          text: 'The annex is still cut off. A folded storm means nothing if the readers cannot get out.',
          next: null
        }
      ]
    }
  ]
}

export const BELL_ORIGIN_SCRIPT: SceneScript = {
  version: 1,
  scenes: [
    {
      id: 'bell-origin-opening',
      title: 'The Bell and the Door',
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
          text: "The discipline hall's bell rings without a hand on the rope. A sanctuary student has been ordered outside the warded safe room, and the attendant cannot release the lock.",
          next: 'o2'
        },
        {
          id: 'o2',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'The ward is on column five, row four. Stand beside it with both actions free. My precise gesture can release the obedience spell without harming the student.',
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
          text: 'A sanctuary that excludes a frightened student is not a sanctuary. Hold the passage while I break the spell.',
          next: null
        },
        {
          id: 'ov',
          speaker: 'backdraft',
          emotion: 'sly',
          camera: 'close',
          text: "The teacher's bell has controlled this hall long enough. I could take its authority, but first get both people out.",
          next: null
        }
      ]
    },
    {
      id: 'bell-origin-choice',
      title: 'A Rule Worth Breaking',
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
          text: 'The teacher orders us to keep the ward stable until the inspection. We can obey that instruction while opening the ordinary exit, or publicly defy it and force the patrol to hesitate. Either way, the threshold needs my gesture.',
          next: null,
          choices: [
            {
              label: 'Keep the ward stable and tend the wounded',
              next: 'a0',
              effects: [
                {
                  kind: 'flag',
                  flag: 'bell-obey'
                },
                {
                  kind: 'heal'
                }
              ]
            },
            {
              label: 'Defy the exclusion order',
              next: 'a1',
              effects: [
                {
                  kind: 'flag',
                  flag: 'bell-defy'
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
          text: 'The attendant gives us supplies while the ward remains stable. We still need to free the doorway.',
          next: null
        },
        {
          id: 'a1',
          speaker: 'narrator',
          emotion: 'neutral',
          camera: 'wide',
          text: 'The student hears the order challenged. The patrol loses its coordinated stance; the ward itself still needs breaking.',
          next: null
        }
      ]
    },
    {
      id: 'bell-origin-victory',
      title: 'A Sanctuary Without Permission',
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
          text: "Both people reach the hall beyond the bell. The teacher's order is still written on the wall; the students are waiting to see what it means now.",
          next: null,
          branch: {
            when: {
              kind: 'flag',
              flag: 'bell-obey'
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
          text: 'The door is open, but the old rule still stands. I will ask the sanctuary students to write the next one.',
          next: null
        },
        {
          id: 'vb',
          speaker: 'backdraft',
          emotion: 'determined',
          camera: 'close',
          text: 'We broke the exclusion order and opened the door. No one should need a vow of obedience to receive shelter.',
          next: null
        }
      ]
    },
    {
      id: 'bell-origin-defeat',
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
          text: 'The bell keeps ringing behind the locked door. I cannot pretend the rule protected the people we left inside.',
          next: null
        }
      ]
    }
  ]
}

