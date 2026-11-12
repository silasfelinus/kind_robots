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
 *
 * Conductor rainbow t-012 (PLOT-MOTHERLAND.md, "allegiance-aware endings"): the road the crew chose at Act V's
 * memorial colours the whole finale. Each road and choice is a named ending (six, plus the three shipped
 * ones for a flight saved before the memorial existed), how many rescues came home sets the crew's verdict,
 * and A moves the ending on a line at a time.
 */
import {
  RAINBOW_ALLEGIANCE_LABEL,
  type RainbowAllegiance,
} from './rainbowAllegiance'

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
  /** The ending's lines stay up longer: nothing is shooting, and A moves on sooner (FINALE_SKIP_GRACE). */
  endingLineFrames: 180,
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

/** The road the crew chose at Act V's memorial; 'unsworn' for a flight saved before the memorial existed. */
export type FinaleRoad = RainbowAllegiance | 'unsworn'
const roadOf = (allegiance: RainbowAllegiance | null): FinaleRoad =>
  allegiance ?? 'unsworn'

/** Every named ending: the road and the final choice. */
export const FINALE_ENDINGS: Record<
  FinaleRoad,
  Record<FinaleChoice, { title: string; world: string }>
> = {
  rebel: {
    restore: {
      title: 'ASK FIRST',
      world:
        'The Crown wakes asking first, and its first ask sends the Motherland fleet home.',
    },
    evacuate: {
      title: 'OPEN WATER',
      world:
        "Every captive is out. The empire's leash snapped with them. The Ocean is its own.",
    },
    sever: {
      title: 'NO MORE LEASHES',
      world:
        'The Crown is cut loose. Some shards went dark, but nobody holds this Ocean now.',
    },
  },
  loyal: {
    restore: {
      title: 'PEACE BY ORDER',
      world:
        'The Crown wakes under a Motherland flag. Command calls it peace. The reef goes quiet.',
    },
    evacuate: {
      title: 'AN EMPTY OCEAN',
      world:
        'Every pod is out. Command claims an empty Ocean and calls it a victory.',
    },
    sever: {
      title: 'ORDERS BROKEN',
      world:
        'You cut the Crown loose against orders. Nobody holds the Ocean now, not even us.',
    },
  },
  unsworn: {
    restore: {
      title: 'THE CROWN REMEMBERS',
      world:
        'The Crown remembers its first rule: protect, and ask first. The wildlife fleet swims free under its watch.',
    },
    evacuate: {
      title: 'EVERYONE OUT',
      world:
        'Every pilot and every pod is out. The Crown sleeps behind us, and the fleet chooses its own home.',
    },
    sever: {
      title: 'CUT LOOSE',
      world:
        "The Crown's control is cut. Some prism shards went dark with it, but no one is held any more.",
    },
  },
}

/** The ending's name, for THE END and the credits. */
export function finaleEndingTitle(
  choice: FinaleChoice,
  allegiance: RainbowAllegiance | null = null,
): string {
  return FINALE_ENDINGS[roadOf(allegiance)][choice].title
}

/** The caption under the ending plate: the road the crew flew, then the ending's name. */
export function finaleEndingCaption(
  choice: FinaleChoice,
  allegiance: RainbowAllegiance | null = null,
): string {
  const title = finaleEndingTitle(choice, allegiance)
  return allegiance
    ? `${RAINBOW_ALLEGIANCE_LABEL[allegiance]} · ${title}`
    : title
}

/** Lilt's resolution: their arc is letting the crew choose, and each road shows what that cost or won. */
const LILT_RESOLUTION: Record<FinaleRoad, string> = {
  rebel:
    'I let you lead, and you led us out of an empire. I would choose that again.',
  loyal: 'You kept your orders. I kept asking. Neither of us is finished.',
  unsworn: 'I let you lead. I would choose that again, every time.',
}

/** The crew's verdict on its own flight: how many of the six rescues came home, and the palace captives. */
function rescueVerdict(rescues: number, captives: number): string {
  const palace = captives > 0 ? `, and ${captives} palace captives` : ''
  if (rescues === 6)
    return 'Every rescue we chose made it home with us. Every single one.'
  if (rescues >= 3)
    return `${rescues} of our six rescues are flying home${palace}.`
  if (rescues > 0)
    return `${rescues} rescue${rescues === 1 ? '' : 's'} home${palace}. Not enough. We go back for the rest.`
  return 'We could not save everyone on the way. We will keep looking, and we will keep asking first.'
}

/** The send-off: a rebel crew flies free, a loyal crew flies home, and a crew that broke its orders says so. */
function sendOff(road: FinaleRoad, choice: FinaleChoice): string {
  if (road === 'rebel')
    return 'C.A.T.S., the sea is free and so are we. Let us fly.'
  if (road === 'loyal')
    return choice === 'sever'
      ? 'C.A.T.S., form up. We go home and tell them we said no.'
      : 'C.A.T.S., form up. The Motherland expects us home.'
  return 'Princesses, the sky is open. Let us go home.'
}

/**
 * The crew's own epilogue by crew size, the selected pilots rather than seat numbers (COMMS bible party masks 1,
 * 3, 7, 15; the pilot select renames them to whoever flew). Each road gets its own: a rebel crew names what it
 * became, a loyal one what it will carry home.
 */
const ROAD_EPILOGUE: Record<
  RainbowAllegiance,
  Record<number, FinaleDialogue>
> = {
  rebel: {
    1: {
      speaker: 'Maribel',
      text: 'I flew in to pacify an ocean. I am flying out as one of its rescuers.',
    },
    2: {
      speaker: 'Azure',
      text: "Maribel heard the call, I drew the route. Our charts use the Ocean's own names now.",
    },
    3: {
      speaker: 'Solenne',
      text: 'C.A.T.S. answers to the Ocean now. Maribel, you lead us out. I have the rear.',
    },
    4: {
      speaker: 'Vivi',
      text: 'No ranks on this broadcast. Just names: every pilot, every creature, every carer.',
    },
  },
  loyal: {
    1: {
      speaker: 'Maribel',
      text: 'Command will call this a victory. My radio will tell them what I heard.',
    },
    2: {
      speaker: 'Azure',
      text: 'The official map will say pacified. Mine will say who lived here, and I signed it.',
    },
    3: {
      speaker: 'Solenne',
      text: 'Orders kept, squadron whole. I will carry what it cost. Not alone, this time.',
    },
    4: {
      speaker: 'Vivi',
      text: 'They will hand out medals. I will read the names they leave off, every one.',
    },
  },
}

/** The epilogue for a flight saved before the memorial existed (the shipped one). */
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
  allegiance: RainbowAllegiance | null = null,
): FinaleDialogue | null {
  const crew = PILOTS.slice(0, Math.max(1, Math.min(4, players)))
  const lead = crew[0]!
  const wing = crew[crew.length - 1]!
  const rescues = finaleRescues(flags)
  const road = roadOf(allegiance)
  const ending = choice ?? 'evacuate'
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
        text:
          road === 'rebel'
            ? 'No Motherland order reaches this far. We free the heart, our way.'
            : road === 'loyal'
              ? 'Command wants this heart taken. We take it, and free who it holds.'
              : 'Then we free the heart, and everyone it is holding. Together.',
      },
    ],
    'A09.TURN': [
      {
        speaker: 'Lilt-7',
        text:
          road === 'loyal'
            ? 'Command orders a restore under its flag. I still will not choose for you.'
            : 'The heart is open. I will not make this choice for you again.',
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
      { speaker: 'Lilt-7', text: FINALE_ENDINGS[road][ending].world },
      { speaker: lead, text: rescueVerdict(rescues, flags.captivesFreed) },
      { speaker: 'Lilt-7', text: LILT_RESOLUTION[road] },
      road === 'unsworn'
        ? EPILOGUE[crew.length]!
        : ROAD_EPILOGUE[road][crew.length]!,
      { speaker: lead, text: sendOff(road, ending) },
    ],
  }
  const frames =
    id === 'A09.AFTER' ? FINALE.endingLineFrames : FINALE.lineFrames
  return lines[id][Math.floor(elapsed / frames)] ?? null
}

/** The ending's length in frames: every AFTER line, read in full. */
export const FINALE_ENDING_FRAMES = 5 * FINALE.endingLineFrames

/** Frames an ending line shows before A moves on to the next one. */
export const FINALE_SKIP_GRACE = 30

/**
 * Where A moves the ending to from this ending frame: the next line (the credits after the last), once the
 * current line has shown for FINALE_SKIP_GRACE frames; null when A does nothing here.
 */
export function finaleEndingSkip(endingFrame: number): number | null {
  if (endingFrame < 0 || endingFrame >= FINALE_ENDING_FRAMES) return null
  const into = endingFrame % FINALE.endingLineFrames
  if (into < FINALE_SKIP_GRACE) return null
  return endingFrame - into + FINALE.endingLineFrames
}

/**
 * The credits: the crew, Lilt, the rescued by name (and the anonymous rescuers, whom Vivi insists are
 * named too), the freed bosses and the route the crew chose.
 */
export function finaleCredits(
  flags: FinaleFlags,
  players: number,
  choice: FinaleChoice,
  allegiance: RainbowAllegiance | null = null,
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
    ...(allegiance
      ? [`THE ROAD: ${RAINBOW_ALLEGIANCE_LABEL[allegiance]}`]
      : []),
    `THE CHOICE: ${choice.toUpperCase()}`,
    `ENDING: ${finaleEndingTitle(choice, allegiance)}`,
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
