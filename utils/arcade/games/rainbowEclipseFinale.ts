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
import { CROWN_PLEA } from './rainbowEclipseCrown'
import {
  RAINBOW_ALLEGIANCE_LABEL,
  type RainbowAllegiance,
} from './rainbowAllegiance'
import {
  rainbowRouteCredits,
  rainbowRouteStinger,
  withRainbowRouteBeat,
  type RainbowRouteFlags,
} from './rainbowRouteBeats'
import { rainbowPartyTrack } from './rainbowPartyComms'

export type FinaleChoice = 'restore' | 'evacuate' | 'sever'
export type FinaleSceneId =
  'A09.OPEN' | 'A09.PLEA' | 'A09.TURN' | 'A09.ESCAPE' | 'A09.AFTER'
export type FinaleDialogue = {
  speaker: string
  text: string
  partyAuthored?: true
}
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

/**
 * Lilt's resolution for each road and choice (independent story critic S3, S10). On the rebel road Lilt spent the
 * memory of writing the rescue rule to open the flagship's clamps; on the loyal road Lilt closed Command's channel.
 */
const LILT_RESOLUTION: Record<FinaleRoad, Record<FinaleChoice, string>> = {
  rebel: {
    restore:
      'I do not remember writing the first rule any more. I watched you fly it. That is better.',
    evacuate:
      'I gave up a memory to open those clamps. Watching every pod fly free, I would give it again.',
    sever:
      'No Crown, no clamps, no orders. I gave a memory for that, and I would give it again.',
  },
  loyal: {
    restore:
      'Command has its Crown. I closed their channel once tonight, and they will know it was me.',
    evacuate:
      'Command will call the Ocean empty. I logged every pod by name, where they cannot erase it.',
    sever:
      'You broke the order and I broke the channel. We will answer for it together.',
  },
  unsworn: {
    restore:
      'The rule I wrote is whole again. I let you lead, and I would choose that again.',
    evacuate:
      'Everyone is out. I let you lead, and I would choose that again, every time.',
    sever:
      'It is cut, and it cost the Ocean some light. I let you lead. I would still choose that.',
  },
}

/** The escape out of the collapsing heart reads as what the choice did (story critic S3). */
const ESCAPE_CUE: Record<FinaleChoice, string> = {
  restore:
    'The heart is waking. The Crown is lighting the corridors for us. Follow its light out.',
  evacuate:
    'Escape pods are pouring out of the walls. Fly with them and keep the lanes open.',
  sever:
    'The corridors are going dark one section at a time. Fly on my light, and fly fast.',
}

/** The crew's verdict on its own flight: how many of the six rescues came home, and the palace captives. */
function rescueVerdict(
  rescues: number,
  captives: number,
  road: FinaleRoad,
  solo: boolean,
): string {
  const palace =
    captives > 0
      ? `, with ${captives} palace ${captives === 1 ? 'captive' : 'captives'} beside them`
      : ''
  if (rescues === 6)
    return road === 'loyal'
      ? `Every rescue ${solo ? 'I' : 'we'} chose made it home. Command will file them as cleared; I will file them by name.`
      : solo
        ? 'Every rescue I chose made it home with me. Every single one.'
        : 'Every rescue we chose made it home with us. Every single one.'
  if (rescues >= 3)
    return `${rescues} of our six rescues are flying home${palace}.`
  if (rescues > 0)
    return `${rescues} rescue${rescues === 1 ? '' : 's'} home${palace}. Not enough. We go back for the rest.`
  return 'We could not save everyone on the way. We will keep looking, and we will keep asking first.'
}

/**
 * The send-off, the ending's last line: a rebel crew flies free, a loyal crew flies home, and a crew that broke its
 * orders says so. A lone pilot hears it from Lilt-7, so she is never told to form up.
 */
function sendOff(
  road: FinaleRoad,
  choice: FinaleChoice,
  solo: boolean,
): string {
  if (road === 'rebel')
    return choice === 'restore'
      ? 'C.A.T.S., the Crown asks first now, and so do we. Let us fly.'
      : choice === 'sever'
        ? 'C.A.T.S., no leash on the sea and none on us. Let us fly.'
        : 'C.A.T.S., the sea is free and so are we. Let us fly.'
  if (road === 'loyal')
    return solo
      ? choice === 'sever'
        ? 'C.A.T.S., set course for home. We tell them together that we said no.'
        : 'C.A.T.S., set course for home. The Motherland expects us.'
      : choice === 'sever'
        ? 'C.A.T.S., form up. We go home and tell them we said no.'
        : 'C.A.T.S., form up. The Motherland expects us home.'
  return solo
    ? 'Princess, the sky is open. Let us go home.'
    : 'Princesses, the sky is open. Let us go home.'
}

type FinalePilot = (typeof PILOTS)[number]

/**
 * Who speaks the crew's closing lines (independent story critic round 2, R2-2 and R2-5: the road epilogue went to
 * the highest pilot index, so Vivi closed every crew she flew in, and on the rebel road one pilot often spoke the
 * party epilogue and the road epilogue back to back). The voices go round the crew from the party epilogue's
 * speaker: the next pilot takes the road epilogue and the one after gives the send-off, so no pilot speaks twice
 * in a row and every pilot closes some crews. A lone pilot speaks her epilogue and Lilt-7 sends her off.
 */
function closingVoices(partyMask: number): {
  party: FinalePilot
  road: FinalePilot
  close: FinalePilot | 'Lilt-7'
} {
  const crew = PILOTS.filter((_, pilot) => partyMask & (1 << pilot))
  const party = rainbowPartyTrack(partyMask).epilogue.speaker
  const at = crew.indexOf(party)
  return {
    party,
    road: crew[(at + 1) % crew.length]!,
    close: crew.length === 1 ? 'Lilt-7' : crew[(at + 2) % crew.length]!,
  }
}

/**
 * Each pilot's own epilogue on each road (independent story critic S7, 2026-11-23 PT: seat renaming handed one
 * pilot's role to another, e.g. "Maribel heard the call, I drew the route" read with Solenne as the cartographer).
 * The line belongs to a pilot, not a seat, and names no one else: Maribel's radio, Azure's map, Solenne's squadron,
 * Vivi's broadcast. A rebel crew names what it became, a loyal one what it will carry home.
 */
const ROAD_EPILOGUE: Record<RainbowAllegiance, Record<FinalePilot, string>> = {
  rebel: {
    Maribel:
      'I flew in to pacify an ocean. I am flying out as one of its rescuers.',
    Azure:
      "I drew routes for an empire. Our charts use the Ocean's own names now.",
    Solenne:
      'C.A.T.S. answers to the Ocean now. I will hold the rear all the way home.',
    Vivi: 'No ranks on this broadcast. Just names: every pilot, every creature, every carer.',
  },
  loyal: {
    Maribel:
      'Command will call this a victory. My radio will tell them what I heard.',
    Azure:
      'The official map will say pacified. Mine will say who lived here, and I signed it.',
    Solenne:
      'Orders kept, squadron whole. I will carry what it cost. Not alone, this time.',
    Vivi: 'They will hand out medals. I will read the names they leave off, every one.',
  },
}

/** The epilogue for a flight saved before the memorial existed (the shipped one), per pilot as well. */
const EPILOGUE: Record<FinalePilot, string> = {
  Maribel:
    'I flew in alone and I am flying out with a whole fleet. That was never just my rescue.',
  Azure:
    'I found the route, but someone else found the signal. Next time we chart it together from the start.',
  Solenne:
    'All escort sectors report in. Every pod accounted for. We go home as a squadron.',
  Vivi: 'Everyone out there asked, mapped and flew escort. I am broadcasting every name.',
}

export function finaleDialogue(
  id: FinaleSceneId,
  elapsed: number,
  players: number,
  flags: FinaleFlags = NONE,
  choice: FinaleChoice | null = null,
  allegiance: RainbowAllegiance | null = null,
  partyMask: number | null = null,
  route?: RainbowRouteFlags,
  /** A loyal crew that flew high through the Crown's plea and turned at the last (story critic S4). */
  stoodDown = false,
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
            ? 'That is the Motherland flagship, and it has the Crown in its clamps. We take it down.'
            : road === 'loyal'
              ? 'Command wants this heart taken. We take it, and free who it holds.'
              : 'Then we free the heart, and everyone it is holding. Together.',
      },
    ],
    // The loyal road's late course-correction is a scene, not a countdown (independent story critic S4): the
    // Crown asks, Lilt names the turn, the lead answers, while the crew decides with its wings.
    'A09.PLEA': [
      {
        speaker: 'Crown Voice',
        text: 'You were sent to take me. I am asking instead. Let the Ocean keep its heart, and I will let you go.',
      },
      {
        speaker: 'Lilt-7',
        text: 'This is the late turn the rescue rule allows. Fly high and we stand down. Stay low and we finish it.',
      },
      {
        speaker: lead,
        text:
          crew.length === 1
            ? 'I hear you. Give me a breath, and watch which way I fly.'
            : 'We hear you. Wings decide, pilots: high if you would rather ask than take.',
      },
    ],
    'A09.TURN': [
      {
        speaker: 'Lilt-7',
        text: stoodDown
          ? 'You turned at the last breath, and the Crown lowered its guard for you. Now choose what it becomes.'
          : road === 'loyal'
            ? 'Command orders a restore under its flag. I closed their channel. This choice is yours.'
            : road === 'rebel'
              ? 'I spent my last old memory to open the clamps. I will not recall writing the rule. Choose well.'
              : 'The heart is open. I wrote its first rule, and I am handing you the pen.',
      },
      {
        speaker: 'Lilt-7',
        text: 'Fly high to restore its first rule, through the middle to evacuate, low to sever its control.',
      },
      crew.length === 4
        ? {
            // All four fly: each pilot keeps her own role (blind story critic S7), so no seat renaming.
            speaker: 'Vivi',
            text: 'Who is still out there? Azure maps it, Solenne holds the sectors, I call the names. Now choose.',
            partyAuthored: true,
          }
        : {
            speaker: wing,
            text:
              crew.length === 1
                ? 'Whatever I choose, I carry it home with me.'
                : 'Whatever we choose, we choose it together, and we live with it together.',
          },
    ],
    'A09.ESCAPE': [
      {
        speaker: 'Lilt-7',
        text: choice
          ? ESCAPE_CUE[choice]
          : 'The heart is collapsing. The prism corridors are closing; follow the light out.',
      },
      wing === lead
        ? {
            speaker: 'Lilt-7',
            text: 'Stay on my light. Nobody gets left behind, not now.',
          }
        : {
            speaker: wing,
            text: 'Stay together. Nobody gets left behind, not now.',
          },
    ],
    'A09.AFTER': [
      { speaker: 'Lilt-7', text: FINALE_ENDINGS[road][ending].world },
      {
        speaker: lead,
        text: rescueVerdict(
          rescues,
          flags.captivesFreed,
          road,
          crew.length === 1,
        ),
      },
      {
        speaker: 'Lilt-7',
        text: stoodDown
          ? 'You were ordered to take it and you chose to ask. That is the rule I helped write, flown at last.'
          : LILT_RESOLUTION[road][ending],
      },
      ...crewClose(road, ending, partyMask, crew),
    ],
  }
  const frames =
    id === 'A09.AFTER'
      ? FINALE.endingLineFrames
      : id === 'A09.PLEA'
        ? PLEA_LINE_FRAMES
        : FINALE.lineFrames
  return (
    withRainbowRouteBeat(lines[id], id, route, crew)[
      Math.floor(elapsed / frames)
    ] ?? null
  )
}

/**
 * The crew's own lines that close the ending (blind story critic S2, 2026-11-23 PT; round 2, R2-2 and R2-5). The
 * fifteen party epilogues are written for a crew that freed the Ocean, so they play on the rebel and unsworn
 * roads; a loyal crew says what it will carry home instead. On the rebel road a second pilot then says what the
 * crew became, and the choice's own send-off always plays last, from a voice that did not speak the line before.
 */
function crewClose(
  road: FinaleRoad,
  ending: FinaleChoice,
  partyMask: number | null,
  crew: readonly FinalePilot[],
): FinaleDialogue[] {
  if (partyMask === null || partyMask <= 0) {
    const solo = crew.length === 1
    const wing = crew[crew.length - 1]!
    const lines = road === 'unsworn' ? EPILOGUE : ROAD_EPILOGUE[road]
    return [
      { speaker: wing, text: lines[wing] },
      {
        speaker: solo ? 'Lilt-7' : crew[0]!,
        text: sendOff(road, ending, solo),
      },
    ]
  }
  const voices = closingVoices(partyMask)
  const alone = voices.close === 'Lilt-7'
  const said = (
    speaker: FinalePilot | 'Lilt-7',
    text: string,
  ): FinaleDialogue => ({ speaker, text, partyAuthored: true })
  const partyLine = said(
    voices.party,
    rainbowPartyTrack(partyMask).epilogue.text,
  )
  if (road === 'loyal')
    return [
      said(voices.road, ROAD_EPILOGUE.loyal[voices.road]),
      said(voices.close, sendOff(road, ending, alone)),
    ]
  if (road === 'unsworn')
    return [
      partyLine,
      said(alone ? 'Lilt-7' : voices.road, sendOff(road, ending, alone)),
    ]
  return [
    partyLine,
    ...(alone ? [] : [said(voices.road, ROAD_EPILOGUE.rebel[voices.road])]),
    said(voices.close, sendOff(road, ending, alone)),
  ]
}

/** The plea's three lines share the Crown's plea window evenly. */
const PLEA_LINE_FRAMES = Math.floor(CROWN_PLEA.frames / 3)

/** The ending's usual length in frames: five AFTER lines, read in full. */
export const FINALE_ENDING_FRAMES = 5 * FINALE.endingLineFrames

/**
 * This crew's ending length in frames: every AFTER line, read in full. A rebel crew of two or more pilots hears a
 * sixth line, a second pilot's road epilogue before the send-off.
 */
export function finaleEndingFrames(
  allegiance: RainbowAllegiance | null,
  partyMask: number | null,
): number {
  const pilots =
    partyMask === null || partyMask <= 0
      ? 0
      : PILOTS.filter((_, pilot) => partyMask & (1 << pilot)).length
  return (
    (allegiance === 'rebel' && pilots > 1 ? 6 : 5) * FINALE.endingLineFrames
  )
}

/** How many lines A09.TURN holds: a flown route's beat is a fourth line, after the crew's (story critic R2-9). */
export function finaleTurnLines(route?: RainbowRouteFlags): number {
  const turn: FinaleDialogue[] = [0, 1, 2].map(() => ({
    speaker: '',
    text: '',
  }))
  return withRainbowRouteBeat(turn, 'A09.TURN', route, PILOTS).length
}

/** Frames an ending line shows before A moves on to the next one. */
export const FINALE_SKIP_GRACE = 30

/**
 * Where A moves the ending to from this ending frame: the next line (the credits after the last), once the
 * current line has shown for FINALE_SKIP_GRACE frames; null when A does nothing here.
 */
export function finaleEndingSkip(
  endingFrame: number,
  endingFrames: number = FINALE_ENDING_FRAMES,
): number | null {
  if (endingFrame < 0 || endingFrame >= endingFrames) return null
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
  /** Who flew each seat (pilot indexes) and the crew's call sign; by default seats fly in pilot order. */
  flown: {
    pilots?: readonly number[]
    callSign?: string
    /** The detours flown and their flags (ROUTE-MAP section 6): a THE ROUTE section and its stinger. */
    route?: RainbowRouteFlags
    /** A loyal crew that turned at the Crown's plea (story critic S4). */
    stoodDown?: boolean
  } = {},
): string[] {
  const seats = Math.max(1, Math.min(4, players))
  const crew = Array.from(
    { length: seats },
    (_, seat) => PILOTS[flown.pilots?.[seat] ?? seat] ?? PILOTS[seat]!,
  )
  return [
    'RAINBOW BULLET HELL SPACE PRINCESS',
    '',
    'THE CREW',
    ...(flown.callSign ? [`Call sign ${flown.callSign}`] : []),
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
    ...(flags.captivesFreed > 0
      ? [
          `${flags.captivesFreed} ${flags.captivesFreed === 1 ? 'captive' : 'captives'} of the Eclipse Palace`,
        ]
      : []),
    'The whale fleet',
    'Every rescuer who was never named',
    '',
    'FREED, NOT DEFEATED',
    'B01 Pearl Seahorse · B02 Aurelia Array',
    'B03 Clawburst · B04 Delphion',
    'B05 Sawtooth Regent · B06 Lantern Ray',
    'B07 Glass Eel · B08 Prism Leviathan',
    flown.stoodDown
      ? 'SPARED · B09 Eclipse Crown'
      : allegiance === 'loyal' && choice === 'restore'
        ? 'B09 Eclipse Crown · under the Motherland flag'
        : 'B09 Eclipse Crown',
    // A crew that stood down met only the pleading Crown; the flagship never came (story critic R2-1).
    ...(allegiance === 'rebel' && !flown.stoodDown
      ? ['', 'DEFEATED', 'B09 Motherland Flagship']
      : []),
    '',
    ...(flown.stoodDown
      ? ['THE ROAD: TURNED AT THE CROWN']
      : allegiance
        ? [`THE ROAD: ${RAINBOW_ALLEGIANCE_LABEL[allegiance]}`]
        : []),
    `THE CHOICE: ${choice.toUpperCase()}`,
    `ENDING: ${finaleEndingTitle(choice, allegiance)}`,
    '',
    ...(flown.route
      ? rainbowRouteCredits(
          flown.route,
          rainbowRouteStinger(choice, flown.route, {
            all: finaleRescues(flags) === 6,
            stoppedRelay: flags.stoppedRelay,
          }),
        )
      : []),
    'A KIND ROBOTS ARCADE PREVIEW',
  ]
}

export function finaleScene(
  frame: number,
  choiceFrame: number | null,
  escapeFrame: number | null,
  endingFrame: number | null,
  /** Frames into the Crown's plea, while it pleads. */
  plea: number | null = null,
  /** This crew's ending length (finaleEndingFrames) and A09.TURN's line count (finaleTurnLines). */
  lengths: { endingFrames?: number; turnLines?: number } = {},
): { id: FinaleSceneId; elapsed: number } | null {
  if (plea !== null) return { id: 'A09.PLEA', elapsed: plea }
  if (endingFrame !== null)
    return endingFrame < (lengths.endingFrames ?? FINALE_ENDING_FRAMES)
      ? { id: 'A09.AFTER', elapsed: endingFrame }
      : null
  if (escapeFrame !== null)
    return escapeFrame < 2 * FINALE.lineFrames
      ? { id: 'A09.ESCAPE', elapsed: escapeFrame }
      : null
  if (choiceFrame !== null)
    return choiceFrame < (lengths.turnLines ?? 3) * FINALE.lineFrames
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
  endingFrames: number = FINALE_ENDING_FRAMES,
): FinaleStage {
  if (endingFrame !== null)
    return endingFrame < endingFrames
      ? 'ending'
      : endingFrame < endingFrames + FINALE.creditFrames
        ? 'credits'
        : 'end'
  if (escapeFrame !== null) return 'escape'
  if (choiceFrame !== null) return 'choice'
  if (frame < FINALE.openingEnds) return 'opening'
  if (frame < FINALE.bossStarts) return 'halo'
  return 'boss'
}
