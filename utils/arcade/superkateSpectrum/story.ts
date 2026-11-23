/** Three permanent player decisions connect the neighborhoods to the finale. */
export type StoryChoice = 0 | 1 | null
export type StoryChoices = [StoryChoice, StoryChoice, StoryChoice]
export type StoryEnding = 'wild-colors' | 'open-city' | 'prism-partners'
export const freshStoryChoices = (): StoryChoices => [null, null, null]

export const STORY_DECISIONS = [
  {
    stage: 5,
    title: 'THE SALON OPENS',
    speaker: 'PIP: THE OTHER SHOPS NEED OUR HELP.',
    question: 'WHO GETS THE FIRST RAINBOW?',
    options: [
      {
        label: 'INVITE THE NEIGHBORS',
        response: 'KATE: EVERYONE GETS A SEAT.',
        reward: '+1 HEART',
      },
      {
        label: 'BUILD A COLOR LANTERN',
        response: 'KATE: LET ART LIGHT THE WAY.',
        reward: 'START WITH PRISM',
      },
    ],
    power: 'prism',
  },
  {
    stage: 15,
    title: 'THE FESTIVAL BLACKOUT',
    speaker: 'LUMA: THE SORTER CUT THE LIGHTS.',
    question: 'HOW DO WE SAVE THE PARADE?',
    options: [
      {
        label: 'BRING EVERYONE TOGETHER',
        response: 'KATE: WE WILL SHINE AS A TEAM.',
        reward: '+1 HEART',
      },
      {
        label: 'IGNITE THE COLOR ENGINE',
        response: 'KATE: WATCH THIS BURST OF JOY.',
        reward: 'START WITH BURST',
      },
    ],
    power: 'burst',
  },
  {
    stage: 25,
    title: 'THE SORTER ASKS WHY',
    speaker: 'SORTER: WHY CHOOSE IMPERFECTION?',
    question: 'WHAT DOES SUPERKATE TEACH IT?',
    options: [
      {
        label: 'COME CREATE WITH US',
        response: 'KATE: YOUR COLORS COUNT TOO.',
        reward: '+1 HEART',
      },
      {
        label: 'LET EVERY COLOR RUN FREE',
        response: 'KATE: NO RULE CAN HOLD ART.',
        reward: 'START WITH RIBBON',
      },
    ],
    power: 'ribbon',
  },
] as const

export const STORY_ENDINGS: Record<
  StoryEnding,
  { title: string; lines: readonly [string, string] }
> = {
  'wild-colors': {
    title: 'THE WILD COLOR PARADE',
    lines: [
      'KATE: THE CITY CAN PAINT ITSELF.',
      'THE STREETS BECOME LIVING ART.',
    ],
  },
  'open-city': {
    title: 'THE OPEN STUDIO',
    lines: [
      'KATE: EVERYONE HAS A BRUSH.',
      'THE NEIGHBORHOODS BUILD TOGETHER.',
    ],
  },
  'prism-partners': {
    title: 'THE PRISM PARTNERSHIP',
    lines: [
      'SORTER: MAY I LEARN YOUR COLORS?',
      'KATE: THERE IS ALWAYS ROOM.',
    ],
  },
}

export const CHAPTER_VOICES = [
  'PIP: MY CUSTOMERS ONLY SEE GREY.',
  'MOSS: THE ROBOTS FORGOT SPRING.',
  'LUMA: OUR FESTIVAL HAS GONE DARK.',
  'INK: WHO ERASED OUR MEMORIES?',
  'SORTER: EVERY SHADE MUST MATCH.',
  'PALETTE: CAN DIFFERENCE SURVIVE?',
] as const

export function pendingStoryDecision(
  stage: number,
  choices: readonly StoryChoice[],
): number | null {
  const index = STORY_DECISIONS.findIndex((scene) => scene.stage + 1 === stage)
  return index >= 0 && choices[index] === null ? index : null
}

export function endingForStory(choices: readonly StoryChoice[]): StoryEnding {
  const invitations = choices.filter((choice) => choice === 0).length
  return invitations === 3
    ? 'prism-partners'
    : invitations === 2
      ? 'open-city'
      : 'wild-colors'
}
