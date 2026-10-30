import { CAMPAIGN_VILLAINS, campaignVillain } from './campaign'
import { identityFor } from './identityArcs'
import { PATROL_SECRETS, PATROL_ZONES, patrolSceneFor } from './nightPatrols'
import { patrolStoryById } from './patrolStories'
import { OCTOBER_CAST } from './octoberCast'
import { TRIAD_ARCS, compatibilityFor, socialProfile } from './relationships'
import {
  COMPLETE_NIGHT_DECK,
  POWERS,
  STUDENTS,
  knownContacts,
  restoreAcademy,
  socialContextFor,
  type AcademyRun,
  type StudentId,
} from './rules'
import { POWER_VOWS, STATS, signatureById } from './specialPowers'
import {
  PROM_ENDINGS,
  PROM_ENDING_ROUTES,
  districtArtKey,
  endingArtKey,
  identityArtKey,
  incidentArtKey,
  studentArtKey,
  villainArtKey,
} from './artSlots'
import { CITY_SITES } from './cityMap'
import {
  ACCUSATION_WINDOW,
  INTERFERENCE_DAYS,
  OMEN_DAYS,
  villainSignsFor,
} from './villainSigns'

/** The console's sub-screens. `play` is the day/night game itself. */
export type ConsoleScreen =
  'play' | 'hero' | 'followers' | 'casefile' | 'scrapbook' | 'settings'
export const CONSOLE_SCREENS: readonly {
  id: ConsoleScreen
  label: string
  glyph: string
}[] = [
  { id: 'play', label: 'Play', glyph: '✦' },
  { id: 'hero', label: 'Hero', glyph: '◈' },
  { id: 'followers', label: 'Crew', glyph: '♡' },
  { id: 'casefile', label: 'Case File', glyph: '⌕' },
  { id: 'scrapbook', label: 'Scrapbook', glyph: '❏' },
  { id: 'settings', label: 'Settings', glyph: '⚙' },
]

// ---------------------------------------------------------------- settings

export type TextSpeed = 'instant' | 'brisk' | 'leisurely'
export type CardBackId = 'comet' | 'tassel' | 'doom' | 'blueprint'
export type PromSettings = {
  textSpeed: TextSpeed
  /** Off shows the drawn academy and portrait initials instead of paintings. */
  art: boolean
  cardBack: CardBackId
}
export const SETTINGS_KEY = 'comet-city-academy-settings-v1'
export const DEFAULT_SETTINGS: PromSettings = {
  textSpeed: 'instant',
  art: true,
  cardBack: 'comet',
}
export const TEXT_SPEEDS: readonly { id: TextSpeed; label: string }[] = [
  { id: 'instant', label: 'Instant' },
  { id: 'brisk', label: 'Brisk' },
  { id: 'leisurely', label: 'Leisurely' },
]
/** Face-down cards in the Scrapbook, Crew and Case File use the chosen back. */
export const CARD_BACKS: readonly {
  id: CardBackId
  name: string
  motto: string
}[] = [
  { id: 'comet', name: 'Comet Trail', motto: 'Every story starts falling.' },
  { id: 'tassel', name: 'Gold Tassel', motto: 'Thirty days to the stage.' },
  { id: 'doom', name: 'Prom of Doom', motto: 'Formal wear. Optional armor.' },
  { id: 'blueprint', name: 'Shield Blueprint', motto: 'Load-bearing hope.' },
]

/** Milliseconds per character for the scene typewriter. */
export function textRevealDelay(speed: TextSpeed): number {
  return speed === 'leisurely' ? 28 : speed === 'brisk' ? 10 : 0
}

export function normalizeSettings(raw: unknown): PromSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return { ...DEFAULT_SETTINGS }
  const value = raw as Partial<Record<keyof PromSettings, unknown>>
  return {
    textSpeed: TEXT_SPEEDS.some((speed) => speed.id === value.textSpeed)
      ? (value.textSpeed as TextSpeed)
      : DEFAULT_SETTINGS.textSpeed,
    art: typeof value.art === 'boolean' ? value.art : DEFAULT_SETTINGS.art,
    cardBack: CARD_BACKS.some((back) => back.id === value.cardBack)
      ? (value.cardBack as CardBackId)
      : DEFAULT_SETTINGS.cardBack,
  }
}

// ------------------------------------------------------------- save codes

const SAVE_CODE_PREFIX = 'PROM1:'

/** A copyable save code: the same JSON the browser autosave stores. */
export function encodeSaveCode(run: AcademyRun): string {
  const json = JSON.stringify(run)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return SAVE_CODE_PREFIX + btoa(binary)
}

/** Reads a save code, or a raw JSON save, through the normal save validator. */
export function decodeSaveCode(code: string): AcademyRun | null {
  const text = code.trim()
  try {
    if (text.startsWith('{')) return restoreAcademy(JSON.parse(text))
    if (!text.startsWith(SAVE_CODE_PREFIX)) return null
    const binary = atob(text.slice(SAVE_CODE_PREFIX.length).replace(/\s/g, ''))
    const bytes = Uint8Array.from(binary, (letter) => letter.charCodeAt(0))
    return restoreAcademy(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

/** Version facts shown beside the save controls. */
export function saveSummary(run: AcademyRun) {
  return {
    mode:
      run.flowVersion === 3
        ? 'Thirty-day term'
        : run.flowVersion === 2
          ? 'First-week simulation'
          : 'Original slice',
    day: run.day,
    days: run.flowVersion === 3 ? 30 : 7,
    format: `save v${run.version} · flow ${run.flowVersion ?? 1} · deck ${run.incidentDeckVersion ?? 1}`,
    seed: run.seed,
  }
}

// -------------------------------------------------------------------- hero

export type FormId = 'student' | 'hero' | 'villain'

function personName(id: StudentId | undefined): string | null {
  return id ? (STUDENTS.find((person) => person.id === id)?.name ?? null) : null
}

/** Who the player is right now, and what their term has made of them. */
export function heroDossier(
  run: AcademyRun,
  earnedForms: readonly string[] = [],
) {
  const identity = run.signature ? identityFor(run.signature) : null
  const form: FormId = run.playerEvolution?.form ?? 'student'
  const persona = identity?.[form] ?? null
  const special = run.signature ? signatureById(run.signature) : undefined
  const field = POWERS.find((power) => power.id === run.power)!
  const vow = POWER_VOWS.find((entry) => entry.id === run.vow)
  const reached = new Set<string>([
    'student',
    form,
    run.initialForm ?? 'student',
    ...(run.playerEvolution?.milestones.map((event) => event.form) ?? []),
    ...earnedForms,
  ])
  const relations = run.relationships
  const fights = run.tacticalHistory ?? []
  return {
    name: identity?.realName ?? 'Unregistered student',
    pronouns: identity?.pronouns ?? '',
    alias: persona?.alias ?? 'Rookie',
    focus: persona?.focus ?? field.ability,
    form,
    backstory: identity?.backstory ?? '',
    portraitKeys: run.signature
      ? [
          identityArtKey(run.signature, form),
          identityArtKey(run.signature, 'student'),
        ]
      : [],
    forms: (['student', 'hero', 'villain'] as const).map((id) => ({
      id,
      alias: identity?.[id].alias ?? id,
      unlocked: reached.has(id),
      current: id === form,
    })),
    power: {
      field: field.name,
      crest: field.crest,
      ability: field.ability,
      drawback: field.drawback,
      signature: special?.name ?? null,
      action: special?.action ?? null,
      cost: special?.cost ?? null,
    },
    vow: vow ? { name: vow.name, promise: vow.promise } : null,
    stats: persona
      ? STATS.map((stat) => ({
          id: stat.id,
          name: stat.name,
          value: persona.stats[stat.id],
        }))
      : [],
    standings: [
      { label: 'Academy standing', value: run.academyStanding ?? 0 },
      { label: 'City standing', value: run.cityStanding ?? 0 },
      { label: 'Influence', value: run.influence },
      { label: 'Threat', value: run.danger },
      { label: 'Protect choices', value: run.playerEvolution?.protect ?? 0 },
      { label: 'Exploit choices', value: run.playerEvolution?.exploit ?? 0 },
    ],
    bonds: [
      { label: 'Partner', value: personName(relations?.partner) },
      { label: 'Sidekick', value: personName(relations?.sidekick) },
      { label: 'Romance', value: personName(relations?.romance) },
    ],
    record: [
      {
        label: 'Days survived',
        value: run.day - (run.phase === 'ending' ? 0 : 1),
      },
      { label: 'District patrols', value: run.patrolHistory?.length ?? 0 },
      {
        label: 'Rival fights won',
        value: `${fights.filter((fight) => fight.grade !== 'failed').length} / ${fights.length}`,
      },
      { label: 'Case secrets found', value: run.missionClues?.length ?? 0 },
      { label: 'Infirmary visits', value: run.infirmaryDays?.length ?? 0 },
    ],
  }
}

// --------------------------------------------------------------- followers

export type FollowerMood = 'positive' | 'neutral' | 'negative'
export type FollowerCard = {
  id: StudentId
  name: string
  title: string
  power: string
  note: string
  met: boolean
  pronouns: string
  voice: string
  trust: number
  mood: FollowerMood
  portraitKeys: string[]
  status: string[]
  chemistry: string | null
  injuredUntil: number | null
}

/** Every person the term can introduce, with their current feelings. People
 * the player has not met yet stay face-down. */
export function followerRoster(run: AcademyRun): FollowerCard[] {
  const roster = knownContacts(run)
  const relations = run.relationships
  return STUDENTS.map((person) => {
    const connection = relations?.connections[person.id]
    const profile = socialProfile(person.id)
    const met =
      run.flowVersion !== 3 || roster.includes(person.id) || Boolean(connection)
    const injuredUntil =
      (run.injuries?.[person.id] ?? 0) > run.day
        ? run.injuries![person.id]!
        : null
    const betrayed =
      run.betrayal?.person === person.id && run.day >= 20
        ? run.betrayal.status
        : null
    const romance = relations?.romance === person.id
    const trust = connection?.trust ?? 0
    const mood: FollowerMood =
      injuredUntil || betrayed === 'active' || betrayed === 'isolated'
        ? 'negative'
        : romance || trust >= 3
          ? 'positive'
          : 'neutral'
    const status: string[] = []
    if (roster.includes(person.id) && run.flowVersion === 3)
      status.push('On your night roster')
    if (injuredUntil) status.push(`Injured · benched until day ${injuredUntil}`)
    if (romance) status.push('Dating you')
    if (relations?.partner === person.id) status.push('Field partner')
    if (relations?.sidekick === person.id) status.push('Your sidekick')
    if (connection?.courtingDay && !romance)
      status.push(`Asked out on day ${connection.courtingDay}`)
    for (const arc of TRIAD_ARCS) {
      const triad = relations?.triads?.[arc.id]
      if (triad && arc.pair.includes(person.id))
        status.push(`${arc.title} · ${triad.status}`)
    }
    if (betrayed === 'active') status.push('Betrayed the team on day 20')
    if (betrayed === 'reconciled') status.push('Returned under supervision')
    if (betrayed === 'isolated') status.push('Separated from the roster')
    const chemistry =
      profile?.romanceable && met
        ? compatibilityFor(person.id, socialContextFor(run, person.id))
            .chemistry
        : null
    return {
      id: person.id,
      name: person.name,
      title: person.title,
      power: POWERS.find((power) => power.id === person.skill)!.name,
      note: person.note,
      met,
      pronouns: profile?.pronouns ?? '',
      voice: profile?.voice ?? '',
      trust,
      mood,
      portraitKeys: [
        `${studentArtKey(person.id)}-${mood}`,
        `${studentArtKey(person.id)}-neutral`,
        studentArtKey(person.id),
      ],
      status,
      chemistry,
      injuredUntil,
    }
  })
}

// --------------------------------------------------------------- case file

export type AccompliceStatus = 'unknown' | 'met' | 'exposed'
const ACCOMPLICE_DAYS = [11, 17, 26] as const

/** The seeded mastermind as the player has actually uncovered them. Nothing
 * beyond the day's evidence is shown, so two seeds read differently. */
export function villainCaseFile(run: AcademyRun) {
  if (run.flowVersion !== 3) return null
  const villain = campaignVillain(run.seed, run.mastermind)
  const signs = villainSignsFor(villain.id)
  const correct = run.suspect?.id === villain.id
  const revealed = run.day >= 15 || correct || run.phase === 'ending'
  const omens = [
    { day: 1, text: villain.clue },
    ...OMEN_DAYS.filter((day) => day <= run.day).map((day) => ({
      day,
      text: signs?.omens[day] ?? '',
    })),
  ].filter((entry) => entry.text)
  const interferenceActive =
    run.patrolOpening === 1 &&
    INTERFERENCE_DAYS.some((day) => day === run.day) &&
    !correct
  const accomplices = (villain.accomplices ?? []).map((accomplice, index) => {
    const day = ACCOMPLICE_DAYS[index] ?? 30
    const status: AccompliceStatus = run.plotEvidence?.includes(accomplice.id)
      ? 'exposed'
      : run.day > day || (run.day === day && run.phase !== 'map')
        ? 'met'
        : 'unknown'
    return {
      day,
      status,
      name: status === 'unknown' ? null : accomplice.name,
      motive: status === 'unknown' ? null : accomplice.motive,
      sabotage: status === 'unknown' ? null : accomplice.sabotage,
    }
  })
  const opponent =
    run.opponentSignature && run.day >= 15
      ? identityFor(run.opponentSignature)
      : null
  const exposed = accomplices.filter((entry) => entry.status === 'exposed')
  return {
    revealed,
    name: revealed ? villain.name : 'Unknown mastermind',
    portraitKey: revealed ? villainArtKey(villain.name) : null,
    method: revealed ? villain.method : null,
    countermeasure:
      correct || exposed.length >= 2 ? (villain.countermeasure ?? null) : null,
    omens,
    interference: signs
      ? {
          active: interferenceActive,
          jams: POWERS.find((power) => power.id === signs.interference.jams)!
            .name,
          text: correct ? signs.interference.broken : signs.interference.text,
          seen: run.day >= INTERFERENCE_DAYS[0] && run.patrolOpening === 1,
        }
      : null,
    accomplices,
    antagonist: opponent
      ? {
          name: opponent.realName,
          alias: opponent.villain.alias,
          method: opponent.villain.method,
          portraitKey: identityArtKey(run.opponentSignature!, 'villain'),
        }
      : null,
    suspect: run.suspect
      ? {
          name:
            CAMPAIGN_VILLAINS.find((entry) => entry.id === run.suspect!.id)
              ?.name ?? run.suspect.id,
          day: run.suspect.day,
          correct,
        }
      : null,
    canAccuse:
      run.phase === 'map' &&
      !run.suspect &&
      run.day >= ACCUSATION_WINDOW.first &&
      run.day <= ACCUSATION_WINDOW.last,
    accuseOpensOn: ACCUSATION_WINDOW.first,
    accuseClosesAfter: ACCUSATION_WINDOW.last,
    lineup: CAMPAIGN_VILLAINS.map((entry) => ({
      id: entry.id,
      name: entry.name,
      portraitKey: villainArtKey(entry.name),
    })),
  }
}

// --------------------------------------------------------------- scrapbook

export type ScrapbookMoment = {
  day: number
  kind:
    'patrol' | 'district' | 'fight' | 'romance' | 'plot' | 'case' | 'chapter'
  title: string
  text: string
  artKeys: string[]
}

/** Earned memories only: nothing appears here until it happened in this run. */
export function scrapbookMoments(run: AcademyRun): ScrapbookMoment[] {
  const moments: ScrapbookMoment[] = []
  for (const [siteId, day] of Object.entries(run.visitedDays ?? {})) {
    const site = CITY_SITES.find((entry) => entry.id === siteId)
    if (site && day)
      moments.push({
        day,
        kind: 'district',
        title: site.name,
        text: `You spent the day at ${site.name}.`,
        artKeys: [districtArtKey(site.id)],
      })
  }
  for (const memory of run.patrolHistory ?? []) {
    const zone = PATROL_ZONES.find((entry) => entry.id === memory.zone)
    const story = patrolStoryById(memory.encounterId)
    const storyOutcome =
      story && memory.outcome
        ? story.choices.find((entry) => entry.id === memory.choiceId)?.outcomes[
            memory.outcome
          ]
        : undefined
    if (story) {
      moments.push({
        day: memory.day,
        kind: 'patrol',
        title: `${zone?.title ?? 'Patrol'} · ${story.title}`,
        text:
          storyOutcome?.text.split('{betrayer}').join('your old teammate') ??
          story.scene,
        artKeys: zone ? [districtArtKey(zone.siteId)] : [],
      })
      continue
    }
    const scene = patrolSceneFor(run.seed, memory.day, memory.zone)
    const option =
      scene.choices.find((entry) => entry.id === memory.choiceId) ??
      (PATROL_SECRETS[memory.zone].choice.id === memory.choiceId
        ? PATROL_SECRETS[memory.zone].choice
        : undefined)
    moments.push({
      day: memory.day,
      kind: 'patrol',
      title: `${zone?.title ?? 'Patrol'} · ${scene.title}`,
      text: option ? `${option.label}. ${option.result}` : scene.scene,
      artKeys: zone ? [districtArtKey(zone.siteId)] : [],
    })
  }
  for (const fight of run.tacticalHistory ?? []) {
    const rival = identityFor(fight.opponent)
    moments.push({
      day: fight.day,
      kind: 'fight',
      title: `Rival fight · ${rival.hero.alias}`,
      text: `${fight.grade === 'failed' ? 'Lost the ground' : fight.grade === 'honors' ? 'A clean, honors-grade win' : 'Held the line'} in ${fight.turns} turns${fight.discovered ? ', and found their secret' : ''}.`,
      artKeys: [
        identityArtKey(
          fight.opponent,
          fight.role === 'hero' ? 'villain' : 'hero',
        ),
      ],
    })
  }
  for (const caseId of run.missionClues ?? []) {
    const incident = COMPLETE_NIGHT_DECK.find((entry) => entry.id === caseId)
    if (incident)
      moments.push({
        day: 0,
        kind: 'case',
        title: `Case secret · ${incident.title}`,
        text: `You uncovered the hidden truth at ${incident.site}.`,
        artKeys: [incidentArtKey(incident.id)],
      })
  }
  const relations = run.relationships
  if (relations?.romance) {
    const person = STUDENTS.find((entry) => entry.id === relations.romance)
    const day = relations.connections[relations.romance]?.courtingDay ?? 0
    if (person)
      moments.push({
        day,
        kind: 'romance',
        title: `Dating ${person.name}`,
        text: 'You asked, they said yes, and you both agreed what it means.',
        artKeys: [`${studentArtKey(person.id)}-positive`],
      })
  }
  for (const arc of TRIAD_ARCS) {
    const triad = relations?.triads?.[arc.id]
    if (triad?.status === 'committed')
      moments.push({
        day: triad.days.at(-1) ?? 0,
        kind: 'romance',
        title: arc.title,
        text: 'Three people, one negotiated promise, said out loud.',
        artKeys: arc.pair.map((id) => `${studentArtKey(id)}-positive`),
      })
  }
  if (run.betrayal) {
    const person = STUDENTS.find((entry) => entry.id === run.betrayal!.person)
    moments.push({
      day: run.betrayal.day,
      kind: 'plot',
      title: `The gate betrayal · ${person?.name ?? ''}`,
      text:
        run.betrayal.status === 'reconciled'
          ? 'They came back with a confession and the relay codes.'
          : run.betrayal.status === 'isolated'
            ? 'They testified, and you protected the city without them.'
            : 'They turned the rescue team into a dead end.',
      artKeys: person ? [`${studentArtKey(person.id)}-negative`] : [],
    })
  }
  if (run.suspect) {
    const correct =
      run.suspect.id === campaignVillain(run.seed, run.mastermind).id
    moments.push({
      day: run.suspect.day,
      kind: 'plot',
      title: 'The case board',
      text: correct
        ? 'You named the mastermind before the city knew there was one.'
        : 'You named the wrong mastermind, and learned how good the real one is at hiding.',
      artKeys: correct
        ? [villainArtKey(campaignVillain(run.seed, run.mastermind).name)]
        : [],
    })
  }
  for (const chapter of run.identityHistory ?? [])
    moments.push({
      day: chapter.day,
      kind: 'chapter',
      title: `Personal chapter · day ${chapter.day}`,
      text: `You chose to ${chapter.choice}.`,
      artKeys: run.signature ? [identityArtKey(run.signature, 'student')] : [],
    })
  return moments.sort((a, b) => a.day - b.day)
}

/** The Oct 29 cast the player has met on patrol, with the stance they took. */
export function notableCards(run: AcademyRun) {
  return OCTOBER_CAST.map((member) => {
    const memory = run.patrolHistory?.find(
      (entry) => entry.encounterId === member.storyId,
    )
    const choice = memory
      ? patrolStoryById(member.storyId)?.choices.find(
          (option) => option.id === memory.choiceId,
        )
      : undefined
    return {
      key: member.key,
      met: Boolean(memory),
      day: memory?.day ?? null,
      name: memory ? member.name : 'Unmet notable',
      role: memory ? member.role : null,
      line: memory ? member.lines[0] : null,
      species: memory ? member.species : null,
      stance: memory
        ? choice?.kind === 'secret'
          ? 'secret'
          : choice?.kind === 'refuse'
            ? 'walked away'
            : (choice?.stance ?? null)
        : null,
      artKeys: [member.artKeys.portrait, member.artKeys.splash],
    }
  })
}

/** The twelve endings as yearbook plates: discovered ones show their art. */
export function endingPlates(discovered: readonly string[]) {
  const found = new Set(discovered)
  return PROM_ENDINGS.map((ending) => ({
    ending,
    found: found.has(ending),
    route: found.has(ending) ? PROM_ENDING_ROUTES[ending] : null,
    artKey: endingArtKey(ending),
  }))
}

/** Mastermind dossiers across every saved term, spoiler-safe until met. */
export function villainDossiers(met: readonly string[]) {
  return CAMPAIGN_VILLAINS.map((villain) => ({
    id: villain.id,
    met: met.includes(villain.id),
    name: met.includes(villain.id) ? villain.name : 'Unknown mastermind',
    method: met.includes(villain.id) ? villain.method : null,
    portraitKey: villainArtKey(villain.name),
  }))
}

/** True once this run has shown the player who the mastermind is. */
export function mastermindMet(run: AcademyRun): boolean {
  return (
    run.flowVersion === 3 &&
    (run.day >= 15 ||
      run.phase === 'ending' ||
      run.suspect?.id === campaignVillain(run.seed, run.mastermind).id)
  )
}
