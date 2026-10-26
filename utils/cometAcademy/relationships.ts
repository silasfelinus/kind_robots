import type { StudentId } from './rules'

export type SocialActionId =
  'listen' | 'help' | 'partner' | 'sidekick' | 'invite' | 'date' | 'release'
export type Connection = {
  trust: number
  helped: boolean
  courtingDay?: number
  romance: boolean
}
export type SocialState = {
  connections: Partial<Record<StudentId, Connection>>
  partner?: StudentId
  sidekick?: StudentId
  romance?: StudentId
  days: number[]
}

export const SOCIAL_CAST: {
  id: StudentId
  dilemma: string
  help: string
  duty: string
  privateMoment: string
  boundary: string
  romanceable: boolean
  sidekickEligible: boolean
}[] = [
  {
    id: 'mina',
    dilemma:
      'Mina is rebuilding a broken crossing ramp for the neighborhood clinic while the academy grades only combat scores.',
    help: 'You spend the afternoon carrying steel brackets to the clinic. Mina gets an accessible route open before the ambulances arrive.',
    duty: 'Mina will work beside you only if both of you can refuse an unsafe order.',
    privateMoment:
      'Mina asks whether a hero would still notice the single person left outside the evacuation lines.',
    boundary:
      'Mina will not date someone who has publicly taken a coercive villain mantle.',
    romanceable: true,
    sidekickEligible: true,
  },
  {
    id: 'sol',
    dilemma:
      'Sol discovers a transit algorithm quietly ranking wealthy residents ahead of everyone else.',
    help: 'Together you document the rigged algorithm before handing the evidence to the civic oversight board.',
    duty: 'Sol wants a field partner who will never use the rescue roster as a surveillance list.',
    privateMoment:
      'Sol shares a private notebook of inventions intended for people the city forgot.',
    boundary:
      'Sol prefers platonic collaboration while sorting out responsibilities outside the academy.',
    romanceable: false,
    sidekickEligible: false,
  },
  {
    id: 'imani',
    dilemma:
      'Imani has been mediating a dispute between dorm residents and an emergency shelter that the school wants to close.',
    help: 'You accompany Imani to a public listening session and leave the shelter residents in charge of their own demands.',
    duty: 'Imani will support a partner who is willing to hear a refusal and change course.',
    privateMoment:
      'Imani says she needs room for both her own ambitions and the people she loves.',
    boundary:
      'Imani will not pursue romance amid a citywide emergency danger level above twelve.',
    romanceable: true,
    sidekickEligible: false,
  },
  {
    id: 'ash',
    dilemma:
      'Ash has secretly been keeping the municipal weather sensors running with borrowed academy parts.',
    help: 'You return the borrowed instruments properly and help Ash give the maintenance crew the credit they earned.',
    duty: 'Ash asks for a partner who will not take public credit for another person’s work.',
    privateMoment:
      'Ash shows you a map of safe places where maintenance workers took shelter during the last storm.',
    boundary:
      'Ash wants friendship and field loyalty, not a dating route during the term.',
    romanceable: false,
    sidekickEligible: true,
  },
  {
    id: 'nix',
    dilemma:
      'Nix has avoided answering a letter from a parent who disappeared into the dimensional transit network.',
    help: 'You help Nix confirm the letter’s origin instead of reading its private contents.',
    duty: 'Nix agrees to join you in the field only if every portal exit has an agreed rescue signal.',
    privateMoment:
      'Nix invites you to sit with them at the dimensional gate, where there is finally time for an honest answer.',
    boundary:
      'Nix needs a separate conversation, on another day, before committing to a romance.',
    romanceable: true,
    sidekickEligible: true,
  },
  {
    id: 'kit',
    dilemma:
      'Kit’s wildflower seed bank has been requisitioned to manufacture expensive proprietary medical supplies.',
    help: 'You help Kit negotiate a public seed-sharing agreement that keeps the clinic’s research and the gardens open.',
    duty: 'Kit insists that field medicine should not become a reward for obeying the strongest hero.',
    privateMoment:
      'Kit explains why every uniform has a packet of seeds hidden in its lining.',
    boundary:
      'Kit prefers a close platonic working partnership in this first month.',
    romanceable: false,
    sidekickEligible: false,
  },
]

export const SOCIAL_DAYS = [
  2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14, 18, 19, 21, 22, 25, 27, 28,
] as const

export function newSocialState(): SocialState {
  return { connections: {}, days: [] }
}

export type SocialChoice = {
  id: SocialActionId
  label: string
  text: string
}

export function socialChoices(
  state: SocialState,
  id: StudentId,
  day: number,
  opts: { unavailable?: boolean; form?: string; danger?: number } = {},
): SocialChoice[] {
  if (
    !SOCIAL_DAYS.includes(day as (typeof SOCIAL_DAYS)[number]) ||
    state.days.includes(day) ||
    opts.unavailable
  )
    return []
  const profile = SOCIAL_CAST.find((p) => p.id === id)
  if (!profile) return []
  const current = state.connections[id] ?? {
    trust: 0,
    helped: false,
    romance: false,
  }
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
  if (current.trust >= 2 && current.helped && !state.partner)
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
    !state.sidekick
  )
    choices.push({
      id: 'sidekick',
      label: 'Negotiate a sidekick arrangement',
      text:
        profile.duty +
        ' Neither person gives up the right to refuse a dangerous mission.',
    })
  const boundaryOkay =
    !(id === 'mina' && opts.form === 'villain') &&
    !(id === 'imani' && (opts.danger ?? 0) > 12)
  if (
    profile.romanceable &&
    boundaryOkay &&
    current.helped &&
    current.trust >= 2 &&
    !current.courtingDay &&
    !state.romance
  )
    choices.push({
      id: 'invite',
      label: 'Ask about dating, without pressure',
      text:
        profile.privateMoment +
        ' They agree to explore the idea, but neither person promises a relationship yet.',
    })
  if (
    profile.romanceable &&
    boundaryOkay &&
    current.courtingDay !== undefined &&
    current.courtingDay < day &&
    !current.romance &&
    current.trust >= 3 &&
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
    current.courtingDay !== undefined
  )
    choices.push({
      id: 'release',
      label: 'Respectfully step away from a commitment',
      text: 'You talk honestly about ending or changing the arrangement. Neither person is punished for withdrawing consent; they retain their own independent life.',
    })
  return choices
}

export function applySocialChoice(
  state: SocialState,
  id: StudentId,
  day: number,
  action: SocialActionId,
  opts: { unavailable?: boolean; form?: string; danger?: number } = {},
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
  if (action === 'listen') current.trust = Math.min(5, current.trust + 1)
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
  return next
}

export function socialMissionBonus(
  state: SocialState | undefined,
  team: readonly StudentId[],
): number {
  if (!state) return 0
  return (
    (state.partner && team.includes(state.partner) ? 1 : 0) +
    (state.sidekick && team.includes(state.sidekick) ? 1 : 0)
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
  if (state.romance)
    messages.push(
      `${names[state.romance]} meets you after the alarms, and you both decide what the relationship should become next.`,
    )
  return messages.join(' ')
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
  if (
    Object.entries(connections).some(
      ([id, v]) =>
        v.romance &&
        (!v.helped ||
          v.trust < 3 ||
          v.courtingDay === undefined ||
          v.courtingDay >= currentDay ||
          !SOCIAL_CAST.find((p) => p.id === id)?.romanceable),
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
      ([id, v]) => v.romance && id !== state.romance,
    )
  )
    return false
  return true
}
