/**
 * The finale director: the Eclipse Crown (S09), the machine nerve halo at the heart of the Crown. Local 60 Hz
 * frames start straight after Act VIII's aftermath (ACT-STRUCTURE: one authored safe transition directly
 * into S09). A09.OPEN carries the Crown's voice and Lilt's answer (COMMS bible: "You were made to keep them
 * safe." / "Yes. Not to keep them still."), a short halo transit leads to B09 Eclipse Crown, and once its
 * heart is spent the crew makes the final choice (A09.TURN) by where it flies: high to restore the Crown's
 * first rule, through the middle to evacuate everyone, low to sever its control. Then the escape through the
 * prism corridors, and the composed ending (A09.AFTER): the world's consequence from the choice and the six
 * rescue flags, Lilt's resolution, the crew's own epilogue, and credits that name the rescued. No pilot has
 * to die for the ending to matter, and every choice is a full ending.
 */
export type FinaleChoice = 'restore' | 'evacuate' | 'sever'
export type FinaleSceneId = 'A09.OPEN' | 'A09.TURN' | 'A09.ESCAPE' | 'A09.AFTER'
export type FinaleDialogue = { speaker: string; text: string }
/** The six persistent rescue flags (world bible) and Act VIII's armada count, carried into the ending. */
export type FinaleFlags = {
  rescuedNemi: boolean
  securedSalvage: boolean
  rescuedCourier: boolean
  freedDepot: boolean
  stoppedRelay: boolean
  rescuedNavigator: boolean
  captivesFreed: number
}

export const FINALE = {
  openingEnds: 300,
  bossStarts: 600,
  lineFrames: 96,
  /** The ending's lines stay up longer: nothing is shooting. */
  endingLineFrames: 150,
  /** The final choice: the crew flies to a lane for this long, then the lane under the crew is chosen. */
  choiceFrames: 600,
  /** The lanes: above `restoreBelow` restores, below `severAbove` severs, between them evacuates. */
  restoreBelow: 108,
  severAbove: 162,
  creditFrames: 2400,
  /** THE END waits this long for A before the run closes by itself. */
  endHoldFrames: 900,
  endMinFrames: 120,
  completeScore: 10000,
} as const

export const FINALE_SECTIONS = [
  { name: 'Nerve halo', from: 300, to: 600 },
] as const

/** Lane centres for the three choices, top to bottom. */
export const FINALE_LANES: Record<FinaleChoice, number> = {
  restore: 70,
  evacuate: 135,
  sever: 200,
}

/** The choice under the living crew: most pilots win, and a tie goes to the lead (first living) pilot. */
export function finaleChoiceFor(ys: readonly number[]): FinaleChoice {
  const lane = (y: number): FinaleChoice =>
    y < FINALE.restoreBelow
      ? 'restore'
      : y > FINALE.severAbove
        ? 'sever'
        : 'evacuate'
  const counts: Record<FinaleChoice, number> = {
    restore: 0,
    evacuate: 0,
    sever: 0,
  }
  for (const y of ys) counts[lane(y)]++
  const best = Math.max(...Object.values(counts))
  const tied = (Object.keys(counts) as FinaleChoice[]).filter(
    (choice) => counts[choice] === best,
  )
  if (tied.length === 1) return tied[0]!
  const lead = ys[0] === undefined ? 'evacuate' : lane(ys[0])
  return tied.includes(lead) ? lead : tied[0]!
}

/** How many of the six rescue flags the crew carried home. */
export function finaleRescues(flags: FinaleFlags): number {
  return [
    flags.rescuedNemi,
    flags.securedSalvage,
    flags.rescuedCourier,
    flags.freedDepot,
    flags.stoppedRelay,
    flags.rescuedNavigator,
  ].filter(Boolean).length
}

const PILOTS = ['Maribel', 'Azure', 'Solenne', 'Vivi'] as const
const NONE: FinaleFlags = {
  rescuedNemi: false,
  securedSalvage: false,
  rescuedCourier: false,
  freedDepot: false,
  stoppedRelay: false,
  rescuedNavigator: false,
  captivesFreed: 0,
}

const WORLD: Record<FinaleChoice, string> = {
  restore:
    'The Crown remembers its first rule: protect, and ask first. The wildlife fleet swims free under its watch.',
  evacuate:
    'Every pilot and every pod is out. The Crown sleeps behind us, and the fleet chooses its own home.',
  sever:
    "The Crown's control is cut. Some prism shards went dark with it, but no one is held any more.",
}

/** The crew's own epilogue: the selected pilots, never seat numbers (COMMS bible party masks 1, 3, 7, 15). */
const EPILOGUE: Record<number, FinaleDialogue> = {
  1: {
    speaker: 'Maribel',
    text: 'I flew in alone and I am flying out with a whole fleet. That was never just my rescue.',
  },
  2: {
    speaker: 'Azure',
    text: 'Maribel found the signal, I found the route. Next time we chart it together from the start.',
  },
  3: {
    speaker: 'Solenne',
    text: 'All escort sectors report in. Every cadet, every pod, accounted for. We go home as a squadron.',
  },
  4: {
    speaker: 'Vivi',
    text: 'Maribel asked who was out there, Azure mapped it, Solenne flew the escort. I am broadcasting every name.',
  },
}

export function finaleDialogue(
  id: FinaleSceneId,
  elapsed: number,
  players: number,
  flags: FinaleFlags = NONE,
  choice: FinaleChoice | null = null,
): FinaleDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const rescues = finaleRescues(flags)
  const lines: Record<FinaleSceneId, FinaleDialogue[]> = {
    'A09.OPEN': [
      {
        speaker: 'Crown Voice',
        text: 'You were made to keep them safe.',
      },
      {
        speaker: 'Lilt-7',
        text: 'Yes. Not to keep them still.',
      },
      {
        speaker: lead,
        text: 'Then we free the heart, and everyone it is holding. Together.',
      },
    ],
    'A09.TURN': [
      {
        speaker: 'Lilt-7',
        text: 'The heart is open. I will not make this choice for you again.',
      },
      {
        speaker: 'Lilt-7',
        text: 'Fly high to restore its first rule, through the middle to evacuate, low to sever its control.',
      },
      {
        speaker: wing,
        text:
          crew.length === 4
            ? 'Who is still out there? Azure maps it, Solenne holds the sectors, I call the names. Now choose.'
            : 'Whatever we choose, we choose it together, and we live with it together.',
      },
    ],
    'A09.ESCAPE': [
      {
        speaker: 'Lilt-7',
        text: 'The heart is collapsing. The prism corridors are closing; follow the light out.',
      },
      {
        speaker: wing === lead ? 'Lilt-7' : wing,
        text: 'Stay together. Nobody gets left behind, not now.',
      },
    ],
    'A09.AFTER': [
      { speaker: 'Lilt-7', text: WORLD[choice ?? 'evacuate'] },
      {
        speaker: lead,
        text:
          rescues === 6
            ? 'Every rescue we chose made it home with us. Every single one.'
            : rescues >= 3
              ? `${rescues} of our six rescues are flying home with us, and ${flags.captivesFreed} captives from the palace.`
              : 'We could not save everyone on the way. We will keep looking, and we will keep asking first.',
      },
      {
        speaker: 'Lilt-7',
        text: 'I let you lead. I would choose that again, every time.',
      },
      EPILOGUE[crew.length]!,
      {
        speaker: lead,
        text: 'Princesses, the sky is open. Let us go home.',
      },
    ],
  }
  const frames =
    id === 'A09.AFTER' ? FINALE.endingLineFrames : FINALE.lineFrames
  return lines[id][Math.floor(elapsed / frames)] ?? null
}

/** The ending's length in frames: every AFTER line, read in full. */
export const FINALE_ENDING_FRAMES = 5 * FINALE.endingLineFrames

/**
 * The credits: the crew, Lilt, the rescued by name (and the anonymous rescuers, whom Vivi insists are
 * named too), the freed bosses and the route the crew chose.
 */
export function finaleCredits(
  flags: FinaleFlags,
  players: number,
  choice: FinaleChoice,
): string[] {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  return [
    'RAINBOW BULLET HELL SPACE PRINCESS',
    '',
    'THE CREW',
    ...crew.map((pilot) => pilot.toUpperCase()),
    'LILT-7 · LIAISON, AURORA MERCY',
    '',
    'THE RESCUED',
    ...[
      flags.rescuedNemi && 'Nemi and the moonjelly colony',
      flags.securedSalvage && 'The Clawburst pilot and the salvage dock',
      flags.rescuedCourier && 'The Rosefin courier',
      flags.freedDepot && 'The depot survivors',
      flags.stoppedRelay && 'The reef nursery, safe from the relay',
      flags.rescuedNavigator && 'The Lost Navigator',
    ].filter((line): line is string => Boolean(line)),
    `${flags.captivesFreed} captives of the Eclipse Palace`,
    'The whale fleet',
    'Every rescuer who was never named',
    '',
    'FREED, NOT DEFEATED',
    'B01 Pearl Seahorse · B02 Aurelia Array',
    'B03 Clawburst · B04 Delphion',
    'B05 Sawtooth Regent · B06 Lantern Ray',
    'B07 Glass Eel · B08 Prism Leviathan',
    'B09 Eclipse Crown',
    '',
    `THE CHOICE: ${choice.toUpperCase()}`,
    '',
    'A KIND ROBOTS ARCADE PREVIEW',
  ]
}

export function finaleScene(
  frame: number,
  choiceFrame: number | null,
  escapeFrame: number | null,
  endingFrame: number | null,
): { id: FinaleSceneId; elapsed: number } | null {
  if (endingFrame !== null)
    return endingFrame < FINALE_ENDING_FRAMES
      ? { id: 'A09.AFTER', elapsed: endingFrame }
      : null
  if (escapeFrame !== null)
    return escapeFrame < 2 * FINALE.lineFrames
      ? { id: 'A09.ESCAPE', elapsed: escapeFrame }
      : null
  if (choiceFrame !== null)
    return choiceFrame < 3 * FINALE.lineFrames
      ? { id: 'A09.TURN', elapsed: choiceFrame }
      : null
  if (frame < FINALE.openingEnds) return { id: 'A09.OPEN', elapsed: frame }
  return null
}

export type FinaleStage =
  | 'opening'
  | 'halo'
  | 'boss'
  | 'choice'
  | 'escape'
  | 'ending'
  | 'credits'
  | 'end'

/** Where the finale stands: the Crown fight, then the choice, the escape, the ending, credits and THE END. */
export function finaleStage(
  frame: number,
  choiceFrame: number | null,
  escapeFrame: number | null,
  endingFrame: number | null,
): FinaleStage {
  if (endingFrame !== null)
    return endingFrame < FINALE_ENDING_FRAMES
      ? 'ending'
      : endingFrame < FINALE_ENDING_FRAMES + FINALE.creditFrames
        ? 'credits'
        : 'end'
  if (escapeFrame !== null) return 'escape'
  if (choiceFrame !== null) return 'choice'
  if (frame < FINALE.openingEnds) return 'opening'
  if (frame < FINALE.bossStarts) return 'halo'
  return 'boss'
}
