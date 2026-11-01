import type { StudentId } from './rules'

export type SocialActionId =
  | 'listen'
  | 'help'
  | 'partner'
  | 'sidekick'
  | 'invite'
  | 'date'
  | 'release'
  | 'visit'
export type Connection = {
  trust: number
  helped: boolean
  courtingDay?: number
  romance: boolean
}
export type TriadArcId = 'listening-accord' | 'night-shift'
export type TriadStatus =
  'negotiating' | 'paused' | 'committed' | 'declined' | 'ended'
/** One negotiated three-person relationship. `opener` is the partner the
 * player was already dating; every later step replays from `choices`. */
export type TriadState = {
  opener: StudentId
  step: number
  status: TriadStatus
  choices: string[]
  days: number[]
}
export type SocialState = {
  connections: Partial<Record<StudentId, Connection>>
  partner?: StudentId
  sidekick?: StudentId
  romance?: StudentId
  days: number[]
  triads?: Partial<Record<TriadArcId, TriadState>>
}

/** What the person across from you can see about you today. */
export type SocialContext = {
  unavailable?: boolean
  injured?: boolean
  onRoster?: boolean
  form?: string
  danger?: number
  vow?: string
  power?: string
}

export type Chemistry = 'kindred' | 'curious' | 'wary' | 'closed'
/** A person's own read on the player. `closed` is a boundary they hold, `wary`
 * asks for one more honest conversation before a date, and `kindred` only
 * changes what they say. None of it can be bought with mission rewards. */
export type CompatibilityRule = {
  effect: Exclude<Chemistry, 'curious'>
  form?: string
  vow?: string
  power?: string
  dangerAbove?: number
  reason: string
}

export type SocialProfile = {
  id: StudentId
  kind: 'classmate' | 'city'
  pronouns: string
  voice: string
  dilemma: string
  help: string
  duty: string
  privateMoment: string
  boundary: string
  bedside: string
  romanceable: boolean
  sidekickEligible: boolean
  compatibility: CompatibilityRule[]
}

export const SOCIAL_CAST: SocialProfile[] = [
  {
    id: 'mina',
    kind: 'classmate',
    pronouns: 'she/her',
    voice:
      'Plain and practical; counts the exits out loud and apologizes to furniture she bumps into.',
    dilemma:
      'Mina is rebuilding a broken crossing ramp for the neighborhood clinic while the academy grades only combat scores.',
    help: 'You spend the afternoon carrying steel brackets to the clinic. Mina gets an accessible route open before the ambulances arrive.',
    duty: 'Mina will work beside you only if both of you can refuse an unsafe order.',
    privateMoment:
      'Mina asks whether a hero would still notice the single person left outside the evacuation lines.',
    boundary:
      'Mina will not date someone who has publicly taken a coercive villain mantle.',
    bedside:
      'Mina has rigged her infirmary bed with a pulley so she can reach her own water. She talks you through the design until she falls asleep mid-sentence.',
    romanceable: true,
    sidekickEligible: true,
    compatibility: [
      {
        effect: 'closed',
        form: 'villain',
        reason:
          'Mina will not date someone who has publicly taken a coercive villain mantle.',
      },
      {
        effect: 'kindred',
        vow: 'shelter',
        reason:
          'Mina trusts people who stay with whoever is nearest the danger.',
      },
      {
        effect: 'wary',
        vow: 'claim',
        reason:
          'Mina flinches at anyone who wants command before the evacuation is finished, and wants to talk about it first.',
      },
    ],
  },
  {
    id: 'sol',
    kind: 'classmate',
    pronouns: 'he/him',
    voice:
      'Quick and dry; speaks in confident estimates and corrects himself the moment he is wrong.',
    dilemma:
      'Sol discovers a transit algorithm quietly ranking wealthy residents ahead of everyone else.',
    help: 'Together you document the rigged algorithm before handing the evidence to the civic oversight board.',
    duty: 'Sol wants a field partner who will never use the rescue roster as a surveillance list.',
    privateMoment:
      'Sol shares a private notebook of inventions intended for people the city forgot.',
    boundary:
      'Sol prefers platonic collaboration while sorting out responsibilities outside the academy.',
    bedside:
      'Sol has reprogrammed the infirmary monitor to show the live transit board. You sit with him while he grumbles that the 4:10 is late again.',
    romanceable: false,
    sidekickEligible: false,
    compatibility: [],
  },
  {
    id: 'imani',
    kind: 'classmate',
    pronouns: 'she/her',
    voice:
      'Warm and deliberate; repeats your words back to check that she heard them right.',
    dilemma:
      'Imani has been mediating a dispute between dorm residents and an emergency shelter that the school wants to close.',
    help: 'You accompany Imani to a public listening session and leave the shelter residents in charge of their own demands.',
    duty: 'Imani will support a partner who is willing to hear a refusal and change course.',
    privateMoment:
      'Imani says she needs room for both her own ambitions and the people she loves.',
    boundary:
      'Imani will not pursue romance amid a citywide emergency danger level above twelve.',
    bedside:
      'Imani asks you to read her the shelter meeting minutes so she does not miss a vote. You read every line; she corrects how you pronounce two names.',
    romanceable: true,
    sidekickEligible: false,
    compatibility: [
      {
        effect: 'closed',
        dangerAbove: 12,
        reason:
          'Imani will not pursue romance amid a citywide emergency danger level above twelve.',
      },
      {
        effect: 'kindred',
        power: 'empathy',
        reason:
          'Imani recognizes someone else who hears what people refuse to say.',
      },
      {
        effect: 'wary',
        form: 'villain',
        reason:
          'Imani will listen to a villain, but she wants to hear the reasons twice.',
      },
    ],
  },
  {
    id: 'ash',
    kind: 'classmate',
    pronouns: 'they/them',
    voice:
      'Soft-spoken, talks in weather, and remembers the name of every maintenance worker on campus.',
    dilemma:
      'Ash has secretly been keeping the municipal weather sensors running with borrowed academy parts.',
    help: 'You return the borrowed instruments properly and help Ash give the maintenance crew the credit they earned.',
    duty: 'Ash asks for a partner who will not take public credit for another person’s work.',
    privateMoment:
      'Ash shows you a map of safe places where maintenance workers took shelter during the last storm.',
    boundary:
      'Ash wants friendship and field loyalty, not a dating route during the term.',
    bedside:
      'Ash has opened the infirmary window an inch to hear the wind. They name the incoming front like an old friend and ask you to thank the night janitor for them.',
    romanceable: false,
    sidekickEligible: true,
    compatibility: [],
  },
  {
    id: 'nix',
    kind: 'classmate',
    pronouns: 'they/them',
    voice:
      'Jumpy jokes, changes the subject at the speed of a portal, then circles back to say the true thing.',
    dilemma:
      'Nix has avoided answering a letter from a parent who disappeared into the dimensional transit network.',
    help: 'You help Nix confirm the letter’s origin instead of reading its private contents.',
    duty: 'Nix agrees to join you in the field only if every portal exit has an agreed rescue signal.',
    privateMoment:
      'Nix invites you to sit with them at the dimensional gate, where there is finally time for an honest answer.',
    boundary:
      'Nix needs a separate conversation, on another day, before committing to a romance.',
    bedside:
      'Nix keeps opening pocket-sized portals to nowhere from the infirmary bed. You stay until they let the last one close and admit they hate not being able to leave.',
    romanceable: true,
    sidekickEligible: true,
    compatibility: [
      {
        effect: 'kindred',
        power: 'spatial',
        reason:
          'Nix relaxes around someone else who always knows where the exits are.',
      },
      {
        effect: 'wary',
        vow: 'unmask',
        reason:
          'Nix worries that someone who unmasks secrets for a living might one day read their father’s letter aloud.',
      },
    ],
  },
  {
    id: 'kit',
    kind: 'classmate',
    pronouns: 'she/her',
    voice: 'Gentle bossiness; delivers medical facts like gardening advice.',
    dilemma:
      'Kit’s wildflower seed bank has been requisitioned to manufacture expensive proprietary medical supplies.',
    help: 'You help Kit negotiate a public seed-sharing agreement that keeps the clinic’s research and the gardens open.',
    duty: 'Kit insists that field medicine should not become a reward for obeying the strongest hero.',
    privateMoment:
      'Kit explains why every uniform has a packet of seeds hidden in its lining.',
    boundary:
      'Kit prefers a close platonic working partnership in this first month.',
    bedside:
      'Kit is a terrible patient. She tries to triage the bed next to hers until you promise to water the clinic seedlings for her.',
    romanceable: false,
    sidekickEligible: false,
    compatibility: [],
  },
  {
    id: 'mara',
    kind: 'city',
    pronouns: 'she/her',
    voice:
      'Short sentences in a union-hall cadence; says "we" when she means the crew and "I" only when she is apologizing.',
    dilemma:
      'Mara’s crew has been ordered to run the prom shuttle loop on brakes they flagged as unsafe three weeks ago.',
    help: 'You ride the loop with Mara’s inspector and log every brake fault on camera. The depot pulls the cars before prom instead of after it.',
    duty: 'Mara will patrol with you if every route you plan has a stop where anyone can get off.',
    privateMoment:
      'Mara walks you along the empty tracks after the last train and admits she has never once taken a day off for herself.',
    boundary:
      'Mara will not date anyone sworn to seize command of the city before the people who live in it are asked.',
    bedside:
      'Mara grumbles that the infirmary bed is softer than her bunk at the depot, then makes you promise to tell the night crew she is fine, word for word.',
    romanceable: true,
    sidekickEligible: false,
    compatibility: [
      {
        effect: 'closed',
        vow: 'claim',
        reason:
          'Mara will not date anyone sworn to seize command of the city before the people who live in it are asked.',
      },
      {
        effect: 'wary',
        form: 'hero',
        reason:
          'Mara trusts shift workers more than academy legends; a famous hero has to show her the logbook first.',
      },
      {
        effect: 'kindred',
        power: 'kinetic',
        reason:
          'Mara has a soft spot for anyone who can physically stop a runaway car and then help push it back to the depot.',
      },
    ],
  },
  {
    id: 'drift',
    kind: 'city',
    pronouns: 'they/them',
    voice:
      'Precise and literal; asks what a word means before using it, then uses it perfectly.',
    dilemma:
      'DRIFT-9 has found a lab that still lists three fellow escapees as "property under recovery".',
    help: 'You help DRIFT-9 file the escapees’ names with the civic registry as people, with addresses and witnesses. The recovery order is void by morning.',
    duty: 'DRIFT-9 will take the field with you if nobody, ever, calls a person a specimen over the radio.',
    privateMoment:
      'DRIFT-9 shows you the first thing they ever chose for themselves: a cheap paper kite, still unflown.',
    boundary:
      'DRIFT-9 needs every step of a relationship said out loud in plain words; hints do not count as asking.',
    bedside:
      'DRIFT-9 studies the chart of their own vitals and asks which numbers mean "worry" and which mean "normal". Then they correct the nurse’s spelling of their name.',
    romanceable: true,
    sidekickEligible: true,
    compatibility: [
      {
        effect: 'kindred',
        power: 'biotech',
        reason:
          'DRIFT-9 feels safer with someone whose own body has changed in ways nobody asked permission for.',
      },
      {
        effect: 'wary',
        form: 'villain',
        reason:
          'DRIFT-9 remembers who ran the lab. A villain’s mantle makes them check the exits twice before a date.',
      },
    ],
  },
  {
    id: 'tessel',
    kind: 'city',
    pronouns: 'he/him',
    voice:
      'Formal, slightly old-fashioned speech; translates weather idioms from a world you will never see.',
    dilemma:
      'Tessel has a chance to go home through a portal that opens once on night twenty-nine, and has told nobody.',
    help: 'You help Tessel chart the portal’s schedule with the observatory so the choice to stay or go is his, made with real information.',
    duty: 'Tessel will join a patrol if he can always listen to the weather on the other side first.',
    privateMoment:
      'On the skyport roof Tessel describes the rain of his home world, which falls upward at dusk.',
    boundary:
      'Tessel will not begin a romance with someone who expects him to stay; he must remain free to go home.',
    bedside:
      'Tessel asks for the curtains open so he can watch the clouds. He names their shapes in his own language and translates only the kind ones.',
    romanceable: true,
    sidekickEligible: false,
    compatibility: [
      {
        effect: 'kindred',
        power: 'elemental',
        reason: 'Tessel hears the same storms you do, from the other side.',
      },
      {
        effect: 'wary',
        dangerAbove: 8,
        reason:
          'When the city’s danger climbs, Tessel’s homesickness gets louder and he wants a slower conversation.',
      },
    ],
  },
  {
    id: 'jo',
    kind: 'city',
    pronouns: 'they/them',
    voice:
      'Fast, warm radio patter that drops to a whisper for the true parts.',
    dilemma:
      'Jo has proof the academy staged a "spontaneous" rescue for the cameras, and the student it would humiliate never knew.',
    help: 'You help Jo cut the broadcast so it names the officials who staged the rescue and protects the student who was used.',
    duty: 'Jo will go on patrol with you if they can broadcast what happened, with every face blurred unless that person agrees.',
    privateMoment:
      'At three in the morning Jo lets you sit in the booth while they play the one song they have never put on air.',
    boundary:
      'Jo will not date someone who asks them to bury a story about who holds power.',
    bedside:
      'Jo records a whispered segment from the infirmary bed called "Live From Bed Four" and books you as the only guest.',
    romanceable: true,
    sidekickEligible: true,
    compatibility: [
      {
        effect: 'kindred',
        vow: 'unmask',
        reason: 'Jo lights up for anyone who drags a cover-up into daylight.',
      },
      {
        effect: 'wary',
        vow: 'shelter',
        reason:
          'Jo worries that someone sworn to Shelter will one day ask them to sit on a story to protect somebody.',
      },
    ],
  },
  {
    id: 'lark',
    kind: 'city',
    pronouns: 'he/him',
    voice:
      'Unhurried bedside calm, gallows humor, and a habit of asking whether you have eaten.',
    dilemma:
      'Lark’s hospital has been told to turn away anyone wearing villain colors, even the ones who are bleeding.',
    help: 'You help Lark set up a no-questions triage tent behind the hospital and staff it with him until dawn.',
    duty: 'Lark will work a night patrol with you if every injured person, villain or not, gets carried out.',
    privateMoment:
      'Lark falls asleep for ten minutes on your shoulder in the ambulance bay, then pretends he did not.',
    boundary:
      'Lark will not start a relationship during a citywide crisis above danger eighteen; his shifts swallow everything.',
    bedside:
      'A patient for once, Lark reads his own chart upside down and gives the attending notes. He asks whether you have eaten, then shares his pudding.',
    romanceable: true,
    sidekickEligible: false,
    compatibility: [
      {
        effect: 'closed',
        dangerAbove: 18,
        reason:
          'Lark will not start a relationship during a citywide crisis above danger eighteen; his shifts swallow everything.',
      },
      {
        effect: 'wary',
        form: 'hero',
        reason:
          'Lark has patched up too many people that famous heroes stepped over; he wants to see how you treat the ones nobody films.',
      },
      {
        effect: 'kindred',
        form: 'villain',
        reason:
          'Lark does not flinch at villain colors. He has treated worse, and liked some of them.',
      },
    ],
  },
]

export const SOCIAL_DAYS = [
  2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14, 18, 19, 21, 22, 25, 27, 28,
] as const

export function newSocialState(): SocialState {
  return { connections: {}, days: [] }
}

export function socialProfile(id: StudentId): SocialProfile | undefined {
  return SOCIAL_CAST.find((p) => p.id === id)
}

function ruleMatches(rule: CompatibilityRule, ctx: SocialContext): boolean {
  return (
    (rule.form === undefined || rule.form === ctx.form) &&
    (rule.vow === undefined || rule.vow === ctx.vow) &&
    (rule.power === undefined || rule.power === ctx.power) &&
    (rule.dangerAbove === undefined || (ctx.danger ?? 0) > rule.dangerAbove)
  )
}

/** Mutual compatibility as the other person sees it today. A boundary always
 * wins, then a reservation, then a spark; otherwise they are simply curious. */
export function compatibilityFor(
  id: StudentId,
  ctx: SocialContext = {},
): { chemistry: Chemistry; reason: string } {
  const profile = socialProfile(id)
  if (!profile?.romanceable)
    return { chemistry: 'closed', reason: profile?.boundary ?? '' }
  const matched = profile.compatibility.filter((rule) => ruleMatches(rule, ctx))
  const pick = (effect: CompatibilityRule['effect']) =>
    matched.find((rule) => rule.effect === effect)
  const found = pick('closed') ?? pick('wary') ?? pick('kindred')
  return found
    ? { chemistry: found.effect, reason: found.reason }
    : {
        chemistry: 'curious',
        reason:
          'Nothing in your record draws or worries them yet. What happens next is up to both of you.',
      }
}

export type SocialChoice = {
  id: SocialActionId
  label: string
  text: string
}

function inActiveTriad(state: SocialState, id: StudentId): boolean {
  return TRIAD_ARCS.some((arc) => {
    const triad = state.triads?.[arc.id]
    return (
      triad !== undefined &&
      ['negotiating', 'paused', 'committed'].includes(triad.status) &&
      arc.pair.includes(id)
    )
  })
}

export function socialChoices(
  state: SocialState,
  id: StudentId,
  day: number,
  opts: SocialContext = {},
): SocialChoice[] {
  if (
    !SOCIAL_DAYS.includes(day as (typeof SOCIAL_DAYS)[number]) ||
    state.days.includes(day) ||
    opts.unavailable
  )
    return []
  const profile = socialProfile(id)
  if (!profile) return []
  if (opts.injured)
    return [
      {
        id: 'visit',
        label: 'Sit with them in the infirmary',
        text: profile.bedside,
      },
    ]
  const current = state.connections[id] ?? {
    trust: 0,
    helped: false,
    romance: false,
  }
  const fieldReady = profile.kind === 'classmate' || Boolean(opts.onRoster)
  const choices: SocialChoice[] = [
    {
      id: 'listen',
      label: 'Listen without demanding answers',
      text:
        profile.dilemma +
        ' You stay until they have finished explaining. The conversation matters more than winning their approval.',
    },
  ]
  if (current.trust >= 1 && !current.helped)
    choices.push({
      id: 'help',
      label: 'Help with their personal project',
      text: profile.help,
    })
  if (current.trust >= 2 && current.helped && fieldReady && !state.partner)
    choices.push({
      id: 'partner',
      label: 'Ask to become field partners',
      text:
        profile.duty + ' They agree to a field partnership they can later end.',
    })
  if (
    current.trust >= 3 &&
    current.helped &&
    profile.sidekickEligible &&
    fieldReady &&
    !state.sidekick
  )
    choices.push({
      id: 'sidekick',
      label: 'Negotiate a sidekick arrangement',
      text:
        profile.duty +
        ' Neither person gives up the right to refuse a dangerous mission.',
    })
  const chemistry = compatibilityFor(id, opts)
  const boundaryOkay = chemistry.chemistry !== 'closed'
  if (
    profile.romanceable &&
    boundaryOkay &&
    current.helped &&
    current.trust >= 2 &&
    !current.courtingDay &&
    !state.romance &&
    !inActiveTriad(state, id)
  )
    choices.push({
      id: 'invite',
      label: 'Ask about dating, without pressure',
      text:
        profile.privateMoment +
        (chemistry.chemistry === 'kindred' ? ` ${chemistry.reason}` : '') +
        ' They agree to explore the idea, but neither person promises a relationship yet.',
    })
  if (
    profile.romanceable &&
    boundaryOkay &&
    current.courtingDay !== undefined &&
    current.courtingDay < day &&
    !current.romance &&
    current.trust >= (chemistry.chemistry === 'wary' ? 4 : 3) &&
    !state.romance
  )
    choices.push({
      id: 'date',
      label: 'Go on a date and ask for mutual commitment',
      text:
        profile.privateMoment +
        ' After a second conversation on a different day, you both freely agree to begin a relationship.',
    })
  if (
    state.partner === id ||
    state.sidekick === id ||
    state.romance === id ||
    current.courtingDay !== undefined ||
    inActiveTriad(state, id)
  )
    choices.push({
      id: 'release',
      label: 'Respectfully step away from a commitment',
      text: 'You talk honestly about ending or changing the arrangement. Neither person is punished for withdrawing consent; they retain their own independent life.',
    })
  return choices
}

/** Withdrawing from either person ends the three-way arrangement without
 * penalty; any remaining two-person romance continues on its own terms. */
function endTriadsWith(state: SocialState, id: StudentId): void {
  if (!state.triads) return
  const triads = { ...state.triads }
  for (const arc of TRIAD_ARCS) {
    const triad = triads[arc.id]
    if (
      !triad ||
      !['negotiating', 'paused', 'committed'].includes(triad.status) ||
      !arc.pair.includes(id)
    )
      continue
    triads[arc.id] = { ...triad, status: 'ended' }
    for (const member of arc.pair) {
      const link = state.connections[member]
      if (link?.romance && member !== state.romance)
        state.connections[member] = { ...link, romance: false }
    }
  }
  state.triads = triads
}

export function applySocialChoice(
  state: SocialState,
  id: StudentId,
  day: number,
  action: SocialActionId,
  opts: SocialContext = {},
): SocialState | null {
  if (!socialChoices(state, id, day, opts).some((c) => c.id === action))
    return null
  const current: Connection = {
    trust: 0,
    helped: false,
    romance: false,
    ...state.connections[id],
  }
  const next: SocialState = {
    ...state,
    connections: { ...state.connections },
    days: [...state.days, day],
  }
  if (action === 'listen' || action === 'visit')
    current.trust = Math.min(5, current.trust + 1)
  if (action === 'help') {
    current.trust = Math.min(5, current.trust + 2)
    current.helped = true
  }
  if (action === 'partner') next.partner = id
  if (action === 'sidekick') next.sidekick = id
  if (action === 'invite') current.courtingDay = day
  if (action === 'date') {
    current.romance = true
    next.romance = id
  }
  if (action === 'release') {
    if (next.partner === id) delete next.partner
    if (next.sidekick === id) delete next.sidekick
    if (next.romance === id) delete next.romance
    current.romance = false
    delete current.courtingDay
  }
  next.connections[id] = current
  if (action === 'release') endTriadsWith(next, id)
  return next
}

export type TriadOption = {
  id: string
  label: string
  text: string
  outcome?: 'paused' | 'declined'
  term?: string
  trust?: number
  city?: number
  academy?: number
}
export type TriadBeat = {
  id: string
  title: string
  scene: string
  needsTrust: number
  options: TriadOption[]
}
export type TriadArc = {
  id: TriadArcId
  title: string
  pair: readonly [StudentId, StudentId]
  premise: string
  beats: TriadBeat[]
  resume: TriadOption
  epilogue: string
  terms: Record<string, string>
}

/** Fully negotiated three-person routes. `{A}` is the partner the player is
 * already dating and `{B}` the third person; either member can be `{A}`.
 * There is never an option to pursue `{B}` behind `{A}`'s back. */
export const TRIAD_ARCS: TriadArc[] = [
  {
    id: 'listening-accord',
    title: 'The Listening Accord',
    pair: ['imani', 'nix'],
    premise:
      'You are dating {A}. Over the weeks you have also grown close to {B}, and the feeling is not only friendship.',
    beats: [
      {
        id: 'tell',
        title: 'What you owe the person you are with',
        scene:
          'Before you say anything to {B}, you name the feeling to yourself. Nobody is keeping score, but {A} deserves to hear it from you first rather than discover it.',
        needsTrust: 1,
        options: [
          {
            id: 'la-tell',
            label: 'Tell {A} honestly, before saying anything to {B}',
            text: 'You tell {A} on the walk back from class. {A} does not answer right away, then asks for a day to think and for you to say nothing romantic to {B} until then. You agree. Nothing has been promised to anyone.',
          },
          {
            id: 'la-friends',
            label: 'Keep {B} as a dear friend and say nothing romantic',
            outcome: 'declined',
            text: 'You decide the feeling can stay a quiet one. {B} stays your friend, {A} stays your partner, and nobody is asked to carry a secret or pay a price.',
          },
        ],
      },
      {
        id: 'answer',
        title: '{A} answers',
        scene:
          '{A} has thought about it. "I am not saying yes to anything yet. I am saying I want to talk to {B} myself, just the two of us, before the three of us talk."',
        needsTrust: 1,
        options: [
          {
            id: 'la-trust',
            label: 'Agree, and do not ask what they will say to each other',
            term: 'trust',
            trust: 1,
            text: '{A} and {B} spend an evening at the transit gate without you. You do not ask. The next morning {B} finds you and says, simply, "We talked. I would like to talk with you too. All three of us."',
          },
          {
            id: 'la-wait',
            label: 'Ask to pause and keep things as they are for now',
            outcome: 'paused',
            text: '{A} nods, relieved more than hurt. The question will keep. You both go back to an ordinary week, which turns out to be a gift.',
          },
          {
            id: 'la-stop',
            label: 'Say you would rather stay a couple',
            outcome: 'declined',
            text: '{A} thanks you for saying it out loud. {B} is never told anything they would have to carry. All three friendships stay intact.',
          },
        ],
      },
      {
        id: 'accord',
        title: 'Writing the accord',
        scene:
          'Imani runs the conversation the way she runs a listening session: everyone speaks, nobody interrupts, and anyone can end it. Nix sits on the windowsill beside an open portal exit in case they need air. {B} says it plainly: "Yes. I want to try this, with both of you." {A} says yes too. Then the three of you write the terms down.',
        needsTrust: 2,
        options: [
          {
            id: 'la-checkin',
            label: 'Agree to a weekly check-in where anyone can renegotiate',
            term: 'checkin',
            text: 'Sunday evenings, the commons, one pot of tea. Anyone can change the terms, and nobody needs a reason to ask.',
          },
          {
            id: 'la-pairs',
            label: 'Agree that each pair also keeps time of its own',
            term: 'pairs',
            text: 'You, {A} and {B} each keep an evening with each of the others. Nobody counts hours. Nobody has to.',
          },
          {
            id: 'la-no',
            label: 'Realize, out loud, that you want this to stay a friendship',
            outcome: 'declined',
            text: 'The words surprise you, and the other two take them seriously. Imani writes "friends, by agreement" at the top of the page instead.',
          },
        ],
      },
      {
        id: 'public',
        title: 'Who gets to know',
        scene:
          'A gossip feed posts a blurry photo of the three of you at the night bazaar, captioned like a scandal. Classmates want a statement, and a faculty adviser asks whether this is "a distraction". It is nobody else’s business, but the three of you decide together what to say.',
        needsTrust: 2,
        options: [
          {
            id: 'la-public',
            label: 'Stand together in public, because all three of you agreed',
            term: 'public',
            city: 1,
            academy: -1,
            text: 'You post one sentence together: "We are together, all three of us, and we are fine." The feed moves on in a day. Some faculty go cold; half the night bazaar sends dumplings.',
          },
          {
            id: 'la-private',
            label: 'Decline to comment, because all three of you agreed',
            term: 'private',
            text: '"No comment," the three of you say in near unison, and mean it. Privacy is a choice you made together, not a secret kept from anyone involved.',
          },
          {
            id: 'la-pause',
            label: 'Ask for a pause until the noise dies down',
            outcome: 'paused',
            text: 'Nobody is hurt by the pause. Nix opens a portal to the quietest rooftop they know, and the three of you watch the feed scroll past without you.',
          },
        ],
      },
      {
        id: 'yes',
        title: 'Three yeses',
        scene:
          'On the academy roof, at the hour nobody patrols, the three of you finally say it to each other’s faces instead of about each other.',
        needsTrust: 2,
        options: [
          {
            id: 'la-commit',
            label: 'Each of you says yes, out loud, to both of the others',
            text: '{A} says yes. {B} says yes. You say yes. Imani laughs at how formal it sounded; Nix says it was the least frightening portal they have ever stepped through.',
          },
          {
            id: 'la-close-friends',
            label:
              'Agree together that it is better as a very close friendship',
            outcome: 'declined',
            text: 'It is not a failure. The three of you shake on it like conspirators and stay the people who know each other best.',
          },
        ],
      },
    ],
    resume: {
      id: 'la-resume',
      label: 'Ask whether everyone is ready to pick the conversation back up',
      text: 'Nobody rushes. {A} and {B} both say they are ready, separately and then together, and the conversation starts again where it left off.',
    },
    epilogue:
      '{A}, {B} and you leave the wreckage together, as three people who said yes to each other out loud.',
    terms: {
      trust:
        '{A} and {B} still have conversations you are not part of, and you have never needed to ask.',
      checkin:
        'The Sunday check-in survives prom night; all three of you renegotiate what the changed city means for you.',
      pairs: 'Each pair keeps its own evenings after graduation.',
      public: 'The night bazaar still sends dumplings.',
      private: 'What you are to each other stays yours to tell.',
    },
  },
  {
    id: 'night-shift',
    title: 'The Night Shift',
    pair: ['lark', 'jo'],
    premise:
      'You are dating {A}. {A} and {B} have been friends for years: one patches up the people the other’s broadcasts send in.',
    beats: [
      {
        id: 'says-it-first',
        title: '{A} says it first',
        scene:
          'At the end of a long night, {A} asks you to sit down. "Before anything happens, before I even tell {B}: I have feelings for {B} too. I am telling you because you are who I am with. What do you want?"',
        needsTrust: 1,
        options: [
          {
            id: 'ns-open',
            label:
              'Say you are open to the three of you talking, with no promises',
            text: '{A} lets out a breath they did not know they were holding. Nothing has been decided, and nobody is being asked to hide anything.',
          },
          {
            id: 'ns-think',
            label: 'Ask for a few days to think',
            outcome: 'paused',
            text: '"Take them," {A} says, and means it. You go back to an ordinary week with nothing hanging over it.',
          },
          {
            id: 'ns-two',
            label: 'Say you would rather stay two, and ask what {A} needs',
            outcome: 'declined',
            text: '{A} nods. "Then {B} stays my friend, out loud, with nothing hidden." Nobody is punished for the answer.',
          },
        ],
      },
      {
        id: 'booth',
        title: 'The four a.m. booth',
        scene:
          'Jo’s pirate radio booth sits on the civic hospital roof, two floors above Lark’s ward. With the ON AIR light dark, {A} tells {B} the truth while you sit beside them. {B} goes quiet, then laughs. "I have been hoping one of you would say it, and terrified both of you would."',
        needsTrust: 1,
        options: [
          {
            id: 'ns-ask',
            label: 'Ask {B} what they want, and wait for the whole answer',
            trust: 1,
            text: '{B} wants this, says so, and also says they need to be allowed to be scared about it. You and {A} both say that is allowed.',
          },
          {
            id: 'ns-sleep',
            label: 'Suggest you all sleep on it',
            outcome: 'paused',
            text: 'Lark makes everyone tea that tastes of hospital vending machine. Jo signs off with no broadcast at all. Nobody is in a hurry.',
          },
          {
            id: 'ns-friends',
            label: 'Decide, all together, that friendship is the right shape',
            outcome: 'declined',
            text: 'It is said kindly and agreed by everyone. Jo plays one song for the three of you and nobody else.',
          },
        ],
      },
      {
        id: 'schedule',
        title: 'Three night schedules',
        scene:
          'Lark works nights, Jo broadcasts at night, and you patrol at night. The three of you lay out a week on the back of a hospital intake form, and {B} says out loud: "Yes. I am in, if we can make the hours work."',
        needsTrust: 2,
        options: [
          {
            id: 'ns-dawn',
            label: 'Keep one dawn breakfast a week for all three of you',
            term: 'dawn',
            text: 'Thursday, six a.m., the diner by the ambulance bay. Lark orders for everyone; Jo narrates the menu like a news bulletin.',
          },
          {
            id: 'ns-signal',
            label: 'Agree a radio signal any of you can send for "I need you"',
            term: 'signal',
            text: 'Three clicks on Jo’s frequency. Anyone can send it, anyone can answer, and nobody has to explain.',
          },
          {
            id: 'ns-wrong-time',
            label: 'Admit the schedule makes this the wrong month',
            outcome: 'paused',
            text: 'It is a fair thing to say. The intake form goes into Lark’s locker, folded, for later.',
          },
        ],
      },
      {
        id: 'broadcast',
        title: 'The broadcast that hurts',
        scene:
          'Jo’s broadcast describes a patient Lark treated. The name is blurred, but the ward is recognizable. Lark is furious, Jo is defensive, and both of them look at you.',
        needsTrust: 2,
        options: [
          {
            id: 'ns-mediate',
            label: 'Sit with both of them and let each finish speaking',
            trust: 1,
            text: 'It takes until sunrise. Jo pulls the segment and apologizes to the patient in person; Lark admits the hospital’s silence protected the wrong people too.',
          },
          {
            id: 'ns-space',
            label: 'Give them a day apart, then check in with each alone',
            term: 'space',
            text: 'You see Lark at shift change and Jo at sign-off. By evening they are talking to each other again without you in the room, which is the point.',
          },
          {
            id: 'ns-side',
            label: 'Tell one of them they are simply wrong',
            outcome: 'paused',
            trust: -1,
            text: 'The words land badly. Both of them ask for a pause, and they are right to. You can come back to it after an apology.',
          },
        ],
      },
      {
        id: 'shift-change',
        title: 'Three yeses at shift change',
        scene:
          'Dawn on the hospital roof, the ON AIR light off, the night crews heading home below. Each of you says what you want, to both of the others.',
        needsTrust: 2,
        options: [
          {
            id: 'ns-commit',
            label: 'All three of you say yes, plainly, to each other',
            text: '{A} says yes. {B} says yes. You say yes. Lark asks whether everyone has eaten; Jo says that was the best thing ever not broadcast.',
          },
          {
            id: 'ns-close-friends',
            label: 'Agree together that you are better as close friends',
            outcome: 'declined',
            text: 'Nobody leaves the roof hurt. The three-click signal stays, as friends.',
          },
        ],
      },
    ],
    resume: {
      id: 'ns-resume',
      label: 'Apologize where it is owed, and ask whether everyone is ready',
      text: '{A} and {B} each answer for themselves, and only then together. When all three of you are ready, the night shift picks up where it stopped.',
    },
    epilogue:
      '{A}, {B} and you walk out of the ballroom at shift change, three people who chose each other in plain words.',
    terms: {
      dawn: 'Thursday dawn breakfasts survive the end of the world, give or take one chandelier.',
      signal:
        'Three clicks on Jo’s frequency still mean "I need you", and they are never ignored.',
      space:
        'When the three of you fight, you still take a day apart and come back.',
    },
  },
]

export type TriadOffer = {
  arc: TriadArc
  title: string
  premise: string
  beat: { title: string; scene: string }
  options: SocialChoiceLike[]
  waiting: string | null
}
type SocialChoiceLike = { id: string; label: string; text: string }

function fill(
  text: string,
  a: StudentId,
  b: StudentId,
  names: Partial<Record<StudentId, string>>,
): string {
  return text
    .split('{A}')
    .join(names[a] ?? a)
    .split('{B}')
    .join(names[b] ?? b)
}

/** The next beat of every three-person route open to the player today. A
 * route only appears once the player is already dating one of its members. */
export function triadOffers(
  state: SocialState,
  day: number,
  ctxFor: (id: StudentId) => SocialContext,
  names: Partial<Record<StudentId, string>>,
): TriadOffer[] {
  if (
    !SOCIAL_DAYS.includes(day as (typeof SOCIAL_DAYS)[number]) ||
    state.days.includes(day) ||
    !state.romance
  )
    return []
  const romance = state.romance
  const offers: TriadOffer[] = []
  for (const arc of TRIAD_ARCS) {
    if (!arc.pair.includes(romance)) continue
    const triad = state.triads?.[arc.id]
    if (
      triad &&
      (triad.opener !== romance ||
        !['negotiating', 'paused'].includes(triad.status))
    )
      continue
    const other = arc.pair.find((id) => id !== romance)!
    const beat = arc.beats[triad?.step ?? 0]!
    const blocked = [romance, other]
      .map((id) => {
        const ctx = ctxFor(id)
        if (ctx.unavailable || ctx.injured)
          return `${names[id] ?? id} cannot join this conversation today.`
        const chemistry = compatibilityFor(id, ctx)
        return chemistry.chemistry === 'closed' ? chemistry.reason : null
      })
      .find(Boolean)
    const trust = state.connections[other]?.trust ?? 0
    const waiting =
      blocked ??
      (trust < beat.needsTrust
        ? `${names[other] ?? other} wants to know you better one-on-one before this conversation (trust ${beat.needsTrust} needed, now ${trust}).`
        : null)
    const options = triad?.status === 'paused' ? [arc.resume] : beat.options
    offers.push({
      arc,
      title: arc.title,
      premise: fill(arc.premise, romance, other, names),
      beat: {
        title: fill(beat.title, romance, other, names),
        scene: fill(beat.scene, romance, other, names),
      },
      options: waiting
        ? []
        : options.map((option) => ({
            id: option.id,
            label: fill(option.label, romance, other, names),
            text: fill(option.text, romance, other, names),
          })),
      waiting,
    })
  }
  return offers
}

export function applyTriadChoice(
  state: SocialState,
  arcId: TriadArcId,
  day: number,
  optionId: string,
  ctxFor: (id: StudentId) => SocialContext,
  names: Partial<Record<StudentId, string>>,
): {
  state: SocialState
  option: TriadOption
  label: string
  text: string
} | null {
  const offer = triadOffers(state, day, ctxFor, names).find(
    (entry) => entry.arc.id === arcId,
  )
  const shown = offer?.options.find((option) => option.id === optionId)
  if (!offer || !shown) return null
  const arc = offer.arc
  const prior = state.triads?.[arcId]
  const option =
    prior?.status === 'paused'
      ? arc.resume
      : arc.beats[prior?.step ?? 0]!.options.find((o) => o.id === optionId)!
  const romance = state.romance!
  const other = arc.pair.find((id) => id !== romance)!
  const triad: TriadState = {
    opener: prior?.opener ?? romance,
    step: prior?.step ?? 0,
    status: 'negotiating',
    choices: [...(prior?.choices ?? []), optionId],
    days: [...(prior?.days ?? []), day],
  }
  if (option.outcome) triad.status = option.outcome
  else if (prior?.status !== 'paused') {
    triad.step += 1
    if (triad.step === arc.beats.length) triad.status = 'committed'
  }
  const connections = { ...state.connections }
  for (const id of [romance, other]) {
    const link = connections[id] ?? { trust: 0, helped: false, romance: false }
    connections[id] = {
      ...link,
      trust: Math.max(0, Math.min(5, link.trust + (option.trust ?? 0))),
      ...(triad.status === 'committed' ? { romance: true } : {}),
    }
  }
  return {
    state: {
      ...state,
      connections,
      days: [...state.days, day],
      triads: { ...state.triads, [arcId]: triad },
    },
    option,
    label: shown.label,
    text: shown.text,
  }
}

/** Rebuilds a saved route from its choices so a save cannot skip a beat. */
function replayTriad(
  arc: TriadArc,
  choices: readonly string[],
): { step: number; status: TriadStatus } | null {
  let step = 0
  let status: TriadStatus = 'negotiating'
  for (const choice of choices) {
    if (status === 'declined' || status === 'committed') return null
    if (status === 'paused') {
      if (choice !== arc.resume.id) return null
      status = 'negotiating'
      continue
    }
    const option = arc.beats[step]?.options.find((o) => o.id === choice)
    if (!option) return null
    if (option.outcome) status = option.outcome
    else {
      step += 1
      if (step === arc.beats.length) status = 'committed'
    }
  }
  return { step, status }
}

function committedThird(state: Partial<SocialState>, id: string): boolean {
  return TRIAD_ARCS.some((arc) => {
    const triad = state.triads?.[arc.id]
    return (
      triad?.status === 'committed' &&
      arc.pair.includes(id as StudentId) &&
      triad.opener !== id &&
      state.romance === triad.opener
    )
  })
}

export function socialMissionBonus(
  state: SocialState | undefined,
  team: readonly StudentId[],
): number {
  if (!state) return 0
  const triadBond = TRIAD_ARCS.some(
    (arc) =>
      state.triads?.[arc.id]?.status === 'committed' &&
      arc.pair.every((id) => team.includes(id)),
  )
  return (
    (state.partner && team.includes(state.partner) ? 1 : 0) +
    (state.sidekick && team.includes(state.sidekick) ? 1 : 0) +
    (triadBond ? 1 : 0)
  )
}

export function socialFinaleText(
  state: SocialState | undefined,
  names: Record<StudentId, string>,
): string {
  if (!state) return ''
  const messages = []
  if (state.partner)
    messages.push(
      `${names[state.partner]} coordinates the rescue line as your chosen field partner.`,
    )
  if (state.sidekick)
    messages.push(
      `${names[state.sidekick]} carries the agreed signal as your sidekick, choosing their own route through the disaster.`,
    )
  const triad = TRIAD_ARCS.map((arc) => ({
    arc,
    triad: state.triads?.[arc.id],
  })).find(({ triad }) => triad?.status === 'committed')
  if (triad && state.romance) {
    const other = triad.arc.pair.find((id) => id !== state.romance)!
    messages.push(
      fill(triad.arc.epilogue, state.romance, other, names),
      ...triad.triad!.choices.flatMap((choice) => {
        const term = triad.arc.beats
          .flatMap((beat) => beat.options)
          .find((option) => option.id === choice)?.term
        return term && triad.arc.terms[term]
          ? [fill(triad.arc.terms[term]!, state.romance!, other, names)]
          : []
      }),
    )
  } else if (state.romance)
    messages.push(
      `${names[state.romance]} meets you after the alarms, and you both decide what the relationship should become next.`,
    )
  return messages.join(' ')
}

function validTriads(
  state: Partial<SocialState>,
  connections: Record<string, Connection>,
): boolean {
  const triads = state.triads
  if (triads === undefined) return true
  if (!triads || typeof triads !== 'object' || Array.isArray(triads))
    return false
  for (const [arcId, triad] of Object.entries(triads)) {
    const arc = TRIAD_ARCS.find((entry) => entry.id === arcId)
    if (
      !arc ||
      !triad ||
      typeof triad !== 'object' ||
      !arc.pair.includes(triad.opener) ||
      !Array.isArray(triad.choices) ||
      !Array.isArray(triad.days) ||
      triad.choices.length === 0 ||
      triad.choices.length !== triad.days.length ||
      triad.days.some(
        (d, i) =>
          !Number.isInteger(d) ||
          !state.days!.includes(d) ||
          (i > 0 && d <= triad.days[i - 1]!),
      )
    )
      return false
    const replay = replayTriad(arc, triad.choices)
    if (!replay || replay.step !== triad.step) return false
    if (
      triad.status === 'ended'
        ? !['negotiating', 'paused', 'committed'].includes(replay.status)
        : triad.status !== replay.status
    )
      return false
    if (
      ['negotiating', 'paused', 'committed'].includes(triad.status) &&
      state.romance !== triad.opener
    )
      return false
    const other = arc.pair.find((id) => id !== triad.opener)!
    if (triad.status === 'committed' && !connections[other]?.romance)
      return false
  }
  return true
}

export function validSocialState(
  raw: unknown,
  currentDay: number,
): raw is SocialState {
  if (!raw || typeof raw !== 'object') return false
  const state = raw as Partial<SocialState>
  if (
    !state.connections ||
    typeof state.connections !== 'object' ||
    Array.isArray(state.connections) ||
    !Array.isArray(state.days) ||
    state.days.some(
      (d) =>
        !Number.isInteger(d) ||
        d > currentDay ||
        !SOCIAL_DAYS.some((day) => day === d),
    ) ||
    new Set(state.days).size !== state.days.length
  )
    return false
  const ids = new Set(SOCIAL_CAST.map((p) => p.id))
  const connections = state.connections as Record<string, Connection>
  for (const [id, v] of Object.entries(connections)) {
    if (
      !ids.has(id as StudentId) ||
      !v ||
      !Number.isInteger(v.trust) ||
      v.trust < 0 ||
      v.trust > 5 ||
      typeof v.helped !== 'boolean' ||
      typeof v.romance !== 'boolean' ||
      (v.courtingDay !== undefined &&
        (!state.days.includes(v.courtingDay) || v.courtingDay > currentDay))
    )
      return false
  }
  if (
    [state.partner, state.sidekick, state.romance].some(
      (id) => id !== undefined && !ids.has(id),
    )
  )
    return false
  if (
    state.partner &&
    (!connections[state.partner]?.helped ||
      (connections[state.partner]?.trust ?? -1) < 2)
  )
    return false
  if (
    state.sidekick &&
    (!SOCIAL_CAST.find((p) => p.id === state.sidekick)?.sidekickEligible ||
      !connections[state.sidekick]?.helped ||
      (connections[state.sidekick]?.trust ?? -1) < 3)
  )
    return false
  if (!validTriads(state, connections)) return false
  if (
    Object.entries(connections).some(([id, v]) =>
      v.romance && committedThird(state, id)
        ? v.trust < 2 || !socialProfile(id as StudentId)?.romanceable
        : v.romance &&
          (!v.helped ||
            v.trust < 3 ||
            v.courtingDay === undefined ||
            v.courtingDay >= currentDay ||
            !socialProfile(id as StudentId)?.romanceable),
    )
  )
    return false
  if (
    state.romance &&
    (!SOCIAL_CAST.find((p) => p.id === state.romance)?.romanceable ||
      !connections[state.romance]?.romance ||
      (connections[state.romance]?.trust ?? -1) < 3 ||
      connections[state.romance]?.courtingDay === undefined)
  )
    return false
  if (
    Object.entries(connections).some(
      ([id, v]) =>
        v.romance && id !== state.romance && !committedThird(state, id),
    )
  )
    return false
  return true
}
