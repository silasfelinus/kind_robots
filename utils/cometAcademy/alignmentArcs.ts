import type { AcademyRun, Incident, StudentId } from './rules'
import { campaignBetrayer, campaignVillain, type VillainPlan } from './campaign'
import { TRIAD_ARCS, socialProfile } from './relationships'

// t-016: a visible hero <-> villain track for the protagonist and every
// classmate on the roster, moved only by what happens at night (the calls the
// player leads, the districts they walk, and the jobs they hand to others),
// plus two classmate arcs that read that track instead of a die:
//
// - The Other Side of the Radio (betrayal): a classmate whose track has been
//   pushed the opposite way from yours, three clear steps, starts listening
//   to someone else. Three authored beats; the third is a real heel turn
//   unless the player has kept a promise or changed the work.
// - Partners in Crime (accomplice): a villain- or rogue-leaning player and a
//   classmate who leans the same way plan a job against the mastermind's
//   network. Whether that classmate later sells the player out follows from
//   the deal the player offered and what they did with the haul.
//
// Both arcs are saved, validated on load and paid off on later nights and at
// the prom. The seeded day-20 betrayal in campaign.ts is untouched and its
// person is never cast in these arcs.

export type Lean = 'hero' | 'villain' | 'rogue'
export const LEANS: readonly Lean[] = ['hero', 'villain', 'rogue']
export type AlignmentActor = 'you' | StudentId
/** One night's movement: at most one step per person, keyed by who moved. */
export type AlignmentNight = {
  day: number
  marks: Partial<Record<AlignmentActor, Lean>>
}
export type AlignmentTally = Record<Lean, number>
export type AlignmentLabel =
  | 'hero'
  | 'hero-leaning'
  | 'undecided'
  | 'villain-leaning'
  | 'villain'
  | 'rogue'

export const ALIGNMENT_LABELS: Record<AlignmentLabel, string> = {
  hero: 'HERO',
  'hero-leaning': 'LEANS HERO',
  undecided: 'UNDECIDED',
  'villain-leaning': 'LEANS VILLAIN',
  villain: 'VILLAIN',
  rogue: 'ROGUE',
}

export function alignmentTally(
  log: readonly AlignmentNight[] | undefined,
  actor: AlignmentActor,
  throughDay = Number.POSITIVE_INFINITY,
): AlignmentTally {
  const tally: AlignmentTally = { hero: 0, villain: 0, rogue: 0 }
  for (const night of log ?? []) {
    if (night.day > throughDay) continue
    const lean = night.marks[actor]
    if (lean) tally[lean] += 1
  }
  return tally
}

/** Hero steps minus villain steps; rogue steps are counted separately. */
export function alignmentScore(tally: AlignmentTally): number {
  return tally.hero - tally.villain
}

function rogueLed(tally: AlignmentTally): boolean {
  return (
    tally.rogue >= 2 && tally.rogue > tally.hero && tally.rogue > tally.villain
  )
}

export function alignmentLabel(tally: AlignmentTally): AlignmentLabel {
  if (rogueLed(tally)) return 'rogue'
  const score = alignmentScore(tally)
  return score >= 3
    ? 'hero'
    : score >= 1
      ? 'hero-leaning'
      : score <= -3
        ? 'villain'
        : score <= -1
          ? 'villain-leaning'
          : 'undecided'
}

/** The side someone has committed to: two clear steps, or a rogue streak. */
export function alignmentSide(tally: AlignmentTally): Lean | null {
  if (rogueLed(tally)) return 'rogue'
  const score = alignmentScore(tally)
  return score >= 2 ? 'hero' : score <= -2 ? 'villain' : null
}

export const TRACK_LIMIT = 6
export type AlignmentTrack = {
  actor: AlignmentActor
  name: string
  tally: AlignmentTally
  score: number
  /** 0 is all the way villain, 100 all the way hero. */
  position: number
  label: AlignmentLabel
  text: string
}

export function alignmentTrack(
  log: readonly AlignmentNight[] | undefined,
  actor: AlignmentActor,
  name: string,
): AlignmentTrack {
  const tally = alignmentTally(log, actor)
  const score = alignmentScore(tally)
  const clamped = Math.max(-TRACK_LIMIT, Math.min(TRACK_LIMIT, score))
  const label = alignmentLabel(tally)
  return {
    actor,
    name,
    tally,
    score,
    position: Math.round(((clamped + TRACK_LIMIT) / (TRACK_LIMIT * 2)) * 100),
    label,
    text: `${ALIGNMENT_LABELS[label]} · ${tally.hero} hero / ${tally.villain} villain / ${tally.rogue} rogue night${tally.hero + tally.villain + tally.rogue === 1 ? '' : 's'}`,
  }
}

// ------------------------------------------------------------ night marks

/** Commissioned patrol-story choices that carry no explicit stance. Refusals
 * and choices that only obey the faculty move nobody. */
export const STORY_CHOICE_LEANS: Readonly<Record<string, Lean>> = {
  'clocktower-rescue': 'hero',
  'clocktower-smuggle': 'rogue',
  'clocktower-secret': 'hero',
  'last-stop-escort': 'hero',
  'last-stop-expose': 'rogue',
  'last-stop-secret': 'hero',
  'two-shadows-attend': 'hero',
  'two-shadows-split': 'hero',
  'two-shadows-rival': 'rogue',
  'two-shadows-evidence': 'rogue',
  'two-shadows-secret': 'hero',
}

/** A district walk: a story's stance wins, then the authored table, then the
 * rotating scenes (investigate on your own = rogue, open rescue = hero). */
export function patrolChoiceLean(choiceId: string, stance?: Lean): Lean | null {
  if (stance) return stance
  const authored = STORY_CHOICE_LEANS[choiceId]
  if (authored) return authored
  if (choiceId.endsWith('-intervene') || choiceId.endsWith('-secret'))
    return 'hero'
  if (choiceId.endsWith('-investigate')) return 'rogue'
  return null
}

/** A board contract. Shared calls only define the person who chose a method:
 * leading a rescue is heroic, chasing the evidence is your own business. */
export function caseLean(
  allegiance: Incident['allegiance'],
  personal: boolean,
  approach?: 'rescue' | 'investigate' | null,
): Lean | null {
  if (allegiance !== 'shared') return allegiance
  if (!personal) return null
  return approach === 'investigate' ? 'rogue' : 'hero'
}

export function recordAlignmentNight(
  log: readonly AlignmentNight[] | undefined,
  day: number,
  marks: Partial<Record<AlignmentActor, Lean>>,
): AlignmentNight[] | undefined {
  if (!Object.keys(marks).length) return log ? [...log] : undefined
  return [
    ...(log ?? []).filter((night) => night.day !== day),
    { day, marks },
  ].sort((a, b) => a.day - b.day)
}

// ----------------------------------------------------------------- arcs

export type ArcBeatNumber = 1 | 2 | 3
export type ArcMemory = { beat: ArcBeatNumber; day: number; choice: string }
export type BetrayalDirection = 'to-villain' | 'to-hero'
export type BetrayalArc = {
  person: StudentId
  direction: BetrayalDirection
  beats: ArcMemory[]
  /** The count the player promised not to raise (beat two, "promise"). */
  promise?: number
  outcome?: 'turned' | 'averted'
}
export type AccompliceArc = {
  person: StudentId
  side: 'villain' | 'rogue'
  beats: ArcMemory[]
  outcome?: 'declined' | 'loyal' | 'sold-out'
}
export type ClassmateArcs = {
  betrayal?: BetrayalArc
  accomplice?: AccompliceArc
}

export type ArcOption = {
  id: string
  label: string
  text: string
  /** The next school morning's closing line. */
  morning: string
}
export type ArcBeatCard = {
  arc: 'betrayal' | 'accomplice'
  beat: ArcBeatNumber
  person: StudentId
  kicker: string
  title: string
  location: string
  scene: string
  options: ArcOption[]
  /** What happens if the player advances without answering. */
  silent: string
  direction?: BetrayalDirection
  side?: 'villain' | 'rogue'
  outcome?: BetrayalArc['outcome'] | AccompliceArc['outcome']
}

/** Everything the arcs read from the run, assembled by rules.ts. */
export type ArcWorld = {
  run: AcademyRun
  /** Roster order, used to break ties without a die. */
  order: readonly StudentId[]
  names: Readonly<Record<StudentId, string>>
  contacts: readonly StudentId[]
}

export const ARC_WINDOW = {
  firstBeat: { from: 7, to: 20 },
  secondBeat: 12,
  betrayalTurn: 17,
  accompliceOffer: 18,
  gap: 3,
  last: 28,
} as const

export const BETRAYAL_CHOICES = {
  1: ['reach', 'tail', 'leave'],
  2: ['promise', 'expose', 'release'],
  turned: ['door', 'cut'],
  averted: ['stand', 'space'],
} as const
export const ACCOMPLICE_CHOICES = {
  1: ['partner', 'hire', 'decline'],
  2: ['share', 'keep', 'burn'],
  loyal: ['double', 'refuse'],
  'sold-out': ['confront', 'let-go'],
} as const

type Pronouns = { they: string; them: string; their: string }
function pronouns(id: StudentId): Pronouns {
  const raw = socialProfile(id)?.pronouns ?? 'they/them'
  return raw.startsWith('she')
    ? { they: 'she', them: 'her', their: 'her' }
    : raw.startsWith('he')
      ? { they: 'he', them: 'him', their: 'his' }
      : { they: 'they', them: 'them', their: 'their' }
}

/** The mastermind's accomplice working the city on a given day. */
export function recruiterFor(villain: VillainPlan, day: number) {
  const index = day >= 26 ? 2 : day >= 17 ? 1 : 0
  return villain.accomplices?.[index] ?? null
}

function excludedFromArcs(world: ArcWorld, id: StudentId): boolean {
  const { run } = world
  const relations = run.relationships
  return (
    !world.contacts.includes(id) ||
    id === campaignBetrayer(run.seed) ||
    id === relations?.romance ||
    TRIAD_ARCS.some(
      (arc) => Boolean(relations?.triads?.[arc.id]) && arc.pair.includes(id),
    )
  )
}

/** Who the radio is calling: a roster classmate whose track has been pushed
 * three clear steps away from a player who has committed to the other side. */
export function betrayalCandidate(
  world: ArcWorld,
): { person: StudentId; direction: BetrayalDirection } | null {
  const log = world.run.alignmentLog
  const side = alignmentSide(alignmentTally(log, 'you'))
  if (side !== 'hero' && side !== 'villain') return null
  const direction: BetrayalDirection =
    side === 'hero' ? 'to-villain' : 'to-hero'
  const taken = world.run.classmateArcs?.accomplice?.person
  const ranked = world.order
    .filter((id) => id !== taken && !excludedFromArcs(world, id))
    .map((id) => ({ id, score: alignmentScore(alignmentTally(log, id)) }))
    .filter((entry) =>
      direction === 'to-villain' ? entry.score <= -3 : entry.score >= 3,
    )
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
  return ranked[0] ? { person: ranked[0].id, direction } : null
}

/** A partner in crime: a villain- or rogue-committed player and a classmate
 * whose own track leans the same way. */
export function accompliceCandidate(
  world: ArcWorld,
): { person: StudentId; side: 'villain' | 'rogue' } | null {
  const log = world.run.alignmentLog
  const side = alignmentSide(alignmentTally(log, 'you'))
  if (side !== 'villain' && side !== 'rogue') return null
  const taken = world.run.classmateArcs?.betrayal?.person
  const ranked = world.order
    .filter((id) => id !== taken && !excludedFromArcs(world, id))
    .map((id) => ({ id, tally: alignmentTally(log, id) }))
    .filter((entry) =>
      side === 'villain'
        ? alignmentScore(entry.tally) <= -2
        : alignmentSide(entry.tally) === 'rogue',
    )
    .sort((a, b) =>
      side === 'villain'
        ? alignmentScore(a.tally) - alignmentScore(b.tally)
        : b.tally.rogue - a.tally.rogue,
    )
  return ranked[0] ? { person: ranked[0].id, side } : null
}

function diverged(
  arc: BetrayalArc,
  log: readonly AlignmentNight[] | undefined,
  day: number,
): boolean {
  const you = alignmentScore(alignmentTally(log, 'you', day))
  const them = alignmentScore(alignmentTally(log, arc.person, day))
  return arc.direction === 'to-villain'
    ? them <= -2 && you >= 0
    : them >= 2 && you <= 0
}

/** The pressure the beat-two promise is about: the dirty jobs you hand them,
 * or (when you are the villain) the dirty jobs you take yourself. */
export function promisePressure(
  arc: Pick<BetrayalArc, 'direction' | 'person'>,
  log: readonly AlignmentNight[] | undefined,
  day: number,
): number {
  return arc.direction === 'to-villain'
    ? alignmentTally(log, arc.person, day).villain
    : alignmentTally(log, 'you', day).villain
}

/** Decided on the night of beat three from the saved track, never a roll. */
export function betrayalOutcome(
  arc: BetrayalArc,
  log: readonly AlignmentNight[] | undefined,
  day: number,
): 'turned' | 'averted' {
  if (arc.beats[1]?.choice === 'promise')
    return promisePressure(arc, log, day) > (arc.promise ?? 0)
      ? 'turned'
      : 'averted'
  return diverged(arc, log, day) ? 'turned' : 'averted'
}

/** Decided by the deal you offered and what you did with the haul. */
export function accompliceOutcome(arc: AccompliceArc): 'loyal' | 'sold-out' {
  return arc.beats[0]?.choice === 'hire' && arc.beats[1]?.choice === 'keep'
    ? 'sold-out'
    : 'loyal'
}

function dueBeat(
  beats: readonly ArcMemory[],
  day: number,
  turnFrom: number,
): ArcBeatNumber | null {
  if (beats.length === 1)
    return day >=
      Math.max(ARC_WINDOW.secondBeat, beats[0]!.day + ARC_WINDOW.gap)
      ? 2
      : null
  if (beats.length === 2)
    return day >= Math.max(turnFrom, beats[1]!.day + ARC_WINDOW.gap) ? 3 : null
  return null
}

/** The beat waiting at tonight's debrief, if any: one per night, betrayal
 * first. Everything here is read from saved state. */
export function pendingArcBeat(world: ArcWorld): ArcBeatCard | null {
  const { run } = world
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'debrief' ||
    run.day < ARC_WINDOW.firstBeat.from ||
    run.day > ARC_WINDOW.last
  )
    return null
  const arcs = run.classmateArcs ?? {}
  const firedTonight = [
    ...(arcs.betrayal?.beats ?? []),
    ...(arcs.accomplice?.beats ?? []),
  ].some((memory) => memory.day === run.day)
  if (firedTonight) return null
  const openingWindow = run.day <= ARC_WINDOW.firstBeat.to
  const betrayal = arcs.betrayal
  if (!betrayal && openingWindow) {
    const candidate = betrayalCandidate(world)
    if (candidate)
      return betrayalCard(world, {
        person: candidate.person,
        direction: candidate.direction,
        beats: [],
      })
  } else if (betrayal && !betrayal.outcome) {
    const beat = dueBeat(betrayal.beats, run.day, ARC_WINDOW.betrayalTurn)
    if (beat) return betrayalCard(world, betrayal)
  }
  const accomplice = arcs.accomplice
  if (!accomplice && openingWindow) {
    const candidate = accompliceCandidate(world)
    if (candidate)
      return accompliceCard(world, {
        person: candidate.person,
        side: candidate.side,
        beats: [],
      })
  } else if (accomplice && !accomplice.outcome) {
    const beat = dueBeat(accomplice.beats, run.day, ARC_WINDOW.accompliceOffer)
    if (beat) return accompliceCard(world, accomplice)
  }
  return null
}

const option = (
  id: string,
  label: string,
  text: string,
  morning: string,
): ArcOption => ({ id, label, text, morning })

function betrayalCard(world: ArcWorld, arc: BetrayalArc): ArcBeatCard {
  const { run } = world
  const beat = (arc.beats.length + 1) as ArcBeatNumber
  const name = world.names[arc.person]
  const p = pronouns(arc.person)
  const villain = campaignVillain(run.seed, run.mastermind)
  const recruiter = recruiterFor(villain, arc.beats[0]?.day ?? run.day)
  const recruiterName = recruiter?.name ?? 'the recruiter'
  const log = run.alignmentLog
  const them = alignmentTally(log, arc.person)
  const you = alignmentTally(log, 'you')
  const toVillain = arc.direction === 'to-villain'
  const kicker = `BETRAYAL · ${name.toUpperCase()} · BEAT ${beat} OF 3`
  const base = {
    arc: 'betrayal' as const,
    beat,
    person: arc.person,
    kicker,
    direction: arc.direction,
  }
  if (beat === 1) {
    const options = toVillain
      ? [
          option(
            'reach',
            `Ask ${name} who is on the second radio`,
            `${name} laughs without much humor. "You hand me the jobs you won't sign, then ask who else is paying? Somebody noticed I'm good at them." No name comes out. But ${name} stays on the bench beside you until the lights go off, and you both know the door is still open.`,
            `${name} saves you a seat at breakfast and says nothing about radios.`,
          ),
          option(
            'tail',
            `Follow ${name} after curfew`,
            `You trail ${name} to a shuttered tram depot. Someone dressed as ${villain.accomplice} hands over a fat envelope and a list of addresses. You photograph the stranger's face and the envelope's return stamp: ${recruiterName}. ${name} never sees you. That is its own kind of betrayal, and you know it.`,
            `The depot photographs sit in your casebook. ${name} waves at you across the quad as if nothing happened.`,
          ),
          option(
            'leave',
            'Let it go. Everyone has rent to pay',
            `You decide a second radio is ${name}'s business. It clicks again on the walk home. Neither of you mentions it.`,
            `Nobody mentions radios this morning. ${name} looks tired.`,
          ),
        ]
      : [
          option(
            'reach',
            `Ask ${name} what the notebook is for`,
            `${name} closes the notebook but does not hide it. "Somebody has to remember what happened to the people on those blocks. I hoped it would not be your name I kept writing." The conversation does not fix anything. It does mean ${name} still talks to you.`,
            `${name} nods to you in the hallway. The notebook stays in ${p.their} bag.`,
          ),
          option(
            'tail',
            `Read the notebook while ${name} sleeps`,
            `The notebook is meticulous: dates, districts, your codename, the people who were hurt on the nights you took the other job. One page lists ${recruiterName}, who works for ${villain.name}, as the person you were helping. You put it back exactly where it was.`,
            `You know every page of ${name}'s notebook now. ${name} does not know that.`,
          ),
          option(
            'leave',
            'Pretend you never saw it',
            `You decide the notebook is ${name}'s business. The pen keeps scratching after lights out.`,
            `${name} is still writing when you leave for class.`,
          ),
        ]
    return {
      ...base,
      title: toVillain ? 'The Second Radio' : 'The Second Notebook',
      location: 'Academy / Locker Row, after the debrief',
      scene: toVillain
        ? `${name} hangs back after the debrief, still wearing the soot from tonight. Your own track reads ${ALIGNMENT_LABELS[alignmentLabel(you)]}; ${name}'s reads ${ALIGNMENT_LABELS[alignmentLabel(them)]}, ${them.villain} villain contracts to ${them.hero} hero ones, nearly all of them jobs you assigned. Tonight a second radio clicks inside ${p.their} jacket, tuned to a frequency the academy does not use. A voice says, "Same rate as last time," and ${name} switches it off too fast.`
        : `${name} writes something down every time you come back from a job. Your track reads ${ALIGNMENT_LABELS[alignmentLabel(you)]}, ${you.villain} villain contracts of your own; ${name} has run ${them.hero} rescues for you, usually on the blocks next to your work. Tonight you glimpse the notebook over ${p.their} shoulder: dates, districts and your codename, in careful handwriting.`,
      options,
      silent: 'leave',
    }
  }
  if (beat === 2) {
    const tailed = arc.beats[0]?.choice === 'tail'
    const options = toVillain
      ? [
          option(
            'promise',
            `Promise: no more villain contracts for ${name}`,
            `You promise it out loud: no more jobs the board marks VILLAIN with ${name}'s name on them. ${name} studies your face for a long time. "Keep it and I stay. Break it and I won't even be angry. I'll just be gone."`,
            `${name} checks the night board before breakfast, looking for ${p.their} own name.`,
          ),
          ...(tailed
            ? [
                option(
                  'expose',
                  `Put the depot photographs on the city desk`,
                  `You lay the photographs on the gravel, then send them to the city desk. By morning ${recruiterName}'s recruiting run is public record, which costs ${villain.name} an operation. It costs you something harder to name: ${name} knows you followed ${p.them}.`,
                  `The morning bulletin names ${recruiterName}. ${name} reads it twice and does not look at you.`,
                ),
              ]
            : []),
          option(
            'release',
            `Tell ${name} the choice is ${p.their} own`,
            `"It's your life," you say, and you mean it. ${name} nods slowly. "First honest thing anybody has said to me this month." Neither of you says goodbye, which is not the same as staying.`,
            `${name}'s locker is still full. The second radio is not in it.`,
          ),
        ]
      : [
          option(
            'promise',
            'Promise to stop taking villain contracts',
            `You promise: no more jobs the board marks VILLAIN with your codename on them. ${name} puts the pen down. "Then I have nothing new to write. Keep it that way and the notebook stays closed."`,
            `${name}'s notebook stays shut through breakfast.`,
          ),
          ...(tailed
            ? [
                option(
                  'expose',
                  'Steal and burn the pages that name you',
                  `Long before dawn the pages with your codename are ash in a dorm sink. ${name} will remember enough to testify, but not enough to prove anything, and will know exactly who made sure of that.`,
                  `${name} finds the torn binding and says nothing at all.`,
                ),
              ]
            : []),
          option(
            'release',
            `Tell ${name} to do what ${p.their} conscience says`,
            `"Write what you saw," you say. "I would rather you hated me honestly." ${name} holds the notebook a little tighter. "I don't hate you. That is the problem."`,
            `${name} has an appointment at City Hall on the calendar by the door.`,
          ),
        ]
    return {
      ...base,
      title: toVillain
        ? 'Same Rate as Last Time'
        : 'Everything in the Notebook',
      location: toVillain
        ? 'Academy Roof / Before patrol'
        : 'Academy Cafeteria / Closing time',
      scene: toVillain
        ? `${name} finds you on the roof. "${recruiterName} works for ${villain.name}. They offered me a real contract: the same jobs you hand me, except nobody pretends they're rescues." Your board record says ${name} has done ${them.villain} villain contracts for you and ${them.hero} hero ones. "Tell me why I should stay."`
        : `${name} sets the notebook on the table between you. "The city wants students who will testify about ${villain.name}'s network. I keep writing your name down, and I hate it." The board record says you have taken ${you.villain} villain contracts yourself while ${name} ran ${them.hero} rescues on the same nights. "Give me a reason to stop writing."`,
      options,
      silent: 'release',
    }
  }
  const outcome = betrayalOutcome(arc, log, run.day)
  const reachedOut = arc.beats[0]?.choice === 'reach'
  if (outcome === 'turned') {
    const broken = arc.beats[1]?.choice === 'promise'
    const why = toVillain
      ? broken
        ? `You promised ${name} no more villain contracts, then put ${p.them} on another one. That was the last one.`
        : `Every job you handed over taught ${name} what ${p.their} talents were worth to somebody else.`
      : broken
        ? `You promised no more villain contracts and took another. ${name} had stopped writing; now ${name} stops waiting.`
        : `${name} cleaned up after your nights for weeks. Tonight ${name} decided the city deserved the truth more than you deserved a friend.`
    return {
      ...base,
      outcome,
      title: toVillain ? 'The Other Side of the Radio' : 'The Testimony',
      location: toVillain
        ? 'Comet City / The academy relay, after midnight'
        : 'City Hall / Witness room',
      scene: toVillain
        ? `${name} does not answer roll call. By midnight the academy relay shows ${p.their} codes signing into ${villain.name}'s network, carrying everything learned riding your calls: your routes, your radio habits, which teammates freeze on rooftops. ${why} ${name} is off your roster and working for ${recruiterName} now.`
        : `${name} leaves the roster and gives sworn testimony about ${villain.name}'s network and, line by line, about you. ${why} The hearing clerk stamps every page.`,
      options: [
        option(
          'door',
          'Leave the door open',
          toVillain
            ? `You record one message on the second radio's frequency: the door stays open, and the only price is the truth. It plays to static. ${reachedOut ? `But ${name} once sat beside you on a bench and almost told you everything. Static is not the same as no.` : 'Nobody on the other end has a reason to believe you yet.'}`
            : `You send ${name} one message: you will be at the prom, and you will not lie about any of it. ${reachedOut ? `${name} once told you the problem was not hating you. That is still true.` : `${name} never told you why ${p.they} kept writing, and you never asked.`}`,
          `${name}'s chair in homeroom stays empty. Somebody has left it pushed in, just in case.`,
        ),
        option(
          'cut',
          toVillain
            ? `Change every code and strike ${name} from the roster`
            : `Cut ${name} off and close ranks`,
          toVillain
            ? `You rotate every radio code before dawn and strike ${name} from the roster yourself. The team sleeps a little easier. You do not.`
            : `You tell everyone who still answers your calls that ${name} is a liar with a grudge. Some of them believe you. ${name} hears about it by lunch.`,
          `The roster has one fewer name. Nobody says it aloud.`,
        ),
      ],
      silent: 'door',
    }
  }
  const kept = arc.beats[1]?.choice === 'promise'
  return {
    ...base,
    outcome,
    title: toVillain ? 'The Radio in the Canal' : 'The Notebook, Torn',
    location: 'Comet City / The canal steps before patrol',
    scene: toVillain
      ? `${name} meets you at the canal steps and drops the second radio into the water. ${kept ? `"You kept your word. No more dirty contracts. ${recruiterName} can find somebody else."` : `"You stopped handing me the jobs you wouldn't touch," ${name} says. "So I stopped needing anybody else's."`} The heel turn everyone at the academy was quietly betting on does not happen.`
      : `${name} tears the notebook in half on the canal steps. ${kept ? `"You kept your word. There is nothing new to write."` : `"You stopped," ${name} says. "I don't know why, and I don't need to."`} The testimony the city was waiting for will not have your name in it.`,
    options: [
      option(
        'stand',
        `Ask ${name} to stand beside you at the prom`,
        `${name} grins for the first time in a week. "Someone has to watch your back on that dance floor." It is a promise, and this time both of you mean to keep it.`,
        `${name} is back on the roster and already arguing about tonight's calls.`,
      ),
      option(
        'space',
        `Tell ${name} the roster will wait`,
        `You do not ask for anything. ${name} seems surprised, then grateful. "Give me a few nights. I'll answer when I'm ready."`,
        `${name} is back on the roster, quieter than before.`,
      ),
    ],
    silent: 'space',
  }
}

function accompliceCard(world: ArcWorld, arc: AccompliceArc): ArcBeatCard {
  const { run } = world
  const beat = (arc.beats.length + 1) as ArcBeatNumber
  const name = world.names[arc.person]
  const p = pronouns(arc.person)
  const villain = campaignVillain(run.seed, run.mastermind)
  const lieutenant = recruiterFor(villain, run.day)
  const lieutenantName = lieutenant?.name ?? 'one of the mastermind’s people'
  const rogue = arc.side === 'rogue'
  const them = alignmentTally(run.alignmentLog, arc.person)
  const base = {
    arc: 'accomplice' as const,
    beat,
    person: arc.person,
    kicker: `ACCOMPLICE · ${name.toUpperCase()} · BEAT ${beat} OF 3`,
    side: arc.side,
  }
  if (beat === 1)
    return {
      ...base,
      title: 'A Job Worth Doing Wrong',
      location: 'Academy / The debrief room, lights off',
      scene: `${name} slides a blueprint across the debrief table: the warehouse where ${villain.name}'s network keeps the parts for its plan to ${villain.method}. ${name}'s track reads ${ALIGNMENT_LABELS[alignmentLabel(them)]}, ${rogue ? `${them.rogue} nights off the books` : `${them.villain} villain contracts`}, the same direction as yours. "We take the jobs nobody wants to sign for anyway. Let's take one worth something. We rob the mastermind, not the city${rogue ? ', and we decide who gets the keys afterwards' : ', and what we take is ours'}."`,
      options: [
        option(
          'partner',
          'Shake on it as equal partners',
          `You shake on it: equal shares, equal say, nobody gets left on a roof. ${name} pockets the blueprint. "Partners. Don't make me regret the word."`,
          `${name} brings two coffees to homeroom and does not explain why.`,
        ),
        option(
          'hire',
          `Run the job yourself and pay ${name} a fee`,
          `You keep the blueprint and offer ${name} a flat fee to open the locks. ${name} takes it, a little too smoothly. "Your plan, your call. I just work here."`,
          `${name} counts the advance twice in the hallway.`,
        ),
        option(
          'decline',
          'Turn it down',
          `"Not with you, not like this." ${name} shrugs and folds the blueprint away. "Then nobody does it, and ${villain.name} keeps the warehouse. Your call."`,
          `${name} sits with somebody else at lunch.`,
        ),
      ],
      silent: 'decline',
    }
  if (beat === 2)
    return {
      ...base,
      title: 'The Night Shift at the Warehouse',
      location: 'Comet City / A bonded warehouse after midnight',
      scene: `The job goes down just after midnight. ${name} opens the locks while you watch the street. Inside are crates stamped with ${lieutenantName}'s seal: the parts ${villain.name} needs, and enough cash and leverage to buy half a council. ${arc.beats[0]?.choice === 'partner' ? `${name} looks at you, partner to partner. "Your call too."` : `${name} waits for the boss to decide.`}`,
      options: [
        option(
          'share',
          'Hand the haul to the neighborhoods',
          `By dawn the cash is in three mutual-aid kitchens and the parts are on a city engineer's doorstep with a note. Nobody can prove who did it. Everybody on those blocks knows.`,
          `The waterfront kitchens are serving breakfast for free and nobody will say why.`,
        ),
        option(
          'keep',
          'Keep the haul as leverage',
          `You stash the crates where only you can reach them. ${villain.name} will feel the hole in the plan, and you will hold the patch. ${name} watches you lock the door${arc.beats[0]?.choice === 'hire' ? ' and is handed the agreed fee, not a share' : ' and asks for half the key'}.`,
          `You have a key on a string around your neck that nobody else can use.`,
        ),
        option(
          'burn',
          `Burn it where ${villain.name} can see the smoke`,
          `The warehouse burns down to the rebar with the parts inside. Nobody is hurt; you checked twice. Across the river, somebody important watches the smoke and cancels a meeting.`,
          `The morning news calls it an electrical fire. ${name} smells of smoke at breakfast.`,
        ),
      ],
      silent: 'burn',
    }
  const outcome = accompliceOutcome(arc)
  const offer = `${villain.name} sends ${lieutenantName} with an offer for ${name}: twice your fee, a clean record, and a place in the new city once the prom is over, if ${name} hands you over.`
  if (outcome === 'loyal') {
    const reason =
      arc.beats[0]?.choice === 'partner'
        ? `"We shook on it as partners," ${name} says.`
        : `"You paid fair, and you didn't sit on the take," ${name} says.`
    return {
      ...base,
      outcome,
      title: "The Mastermind's Counteroffer",
      location: 'Comet City / A rooftop café, closed for the night',
      scene: `${offer} ${name} tells you about it the same night. ${reason} "So what do we do with it?"`,
      options: [
        option(
          'double',
          `Let ${name} take the offer as your double agent`,
          `${name} takes the offer, the clean record and the place in the new city, and leaves your roster in public so it looks real. Only you know ${p.they} will be standing next to ${villain.name}'s console on prom night with a key in ${p.their} pocket.`,
          `People are already whispering that ${name} sold you out. Let them.`,
        ),
        option(
          'refuse',
          `${name} turns the offer down to ${lieutenantName}'s face`,
          `${name} sends ${lieutenantName} back with the offer torn in half. "Tell your boss I have a partner." Now ${villain.name} knows exactly who to watch, and so do you: ${name} is staying.`,
          `${name} is on the roster, loudly, where everybody can see.`,
        ),
      ],
      silent: 'refuse',
    }
  }
  return {
    ...base,
    outcome,
    title: 'Twice the Fee',
    location: 'Academy / An emptied locker',
    scene: `${offer} ${name} took it. The locker is empty except for the fee you paid, returned to the cent. A note reads: "You hired me and kept the haul. I learned the lesson." ${villain.name} now knows where your warehouse key is, and who used to carry it.`,
    options: [
      option(
        'confront',
        `Trace the payment and expose ${lieutenantName}`,
        `You follow the transfer from ${name}'s new account back to ${lieutenantName} and put the trail on the city desk. ${name} is gone, but the operation that bought ${p.them} is now public record.`,
        `The morning bulletin names ${lieutenantName}. ${name}'s name is in the footnotes.`,
      ),
      option(
        'let-go',
        `Let ${name} walk`,
        `You do not chase ${name}. You change the lock on the warehouse key that ${villain.name} already knows about, and you sit alone for a while.`,
        `${name}'s locker has a new name on it by lunch.`,
      ),
    ],
    silent: 'let-go',
  }
}

/** The arc state after answering tonight's beat, plus any effect it carries.
 * Returns null when nothing is pending or the choice is not offered. */
export function resolveArcBeat(
  world: ArcWorld,
  choiceId: string,
): {
  arcs: ClassmateArcs
  card: ArcBeatCard
  option: ArcOption
  /** A mastermind accomplice whose operation this exposed. */
  evidence?: string
  influence?: number
  danger?: number
  cityStanding?: number
} | null {
  const card = pendingArcBeat(world)
  const chosen = card?.options.find((entry) => entry.id === choiceId)
  if (!card || !chosen) return null
  const { run } = world
  const arcs: ClassmateArcs = { ...(run.classmateArcs ?? {}) }
  const memory: ArcMemory = { beat: card.beat, day: run.day, choice: chosen.id }
  const villain = campaignVillain(run.seed, run.mastermind)
  if (card.arc === 'betrayal') {
    const previous: BetrayalArc = arcs.betrayal ?? {
      person: card.person,
      direction: card.direction!,
      beats: [],
    }
    const next: BetrayalArc = {
      ...previous,
      beats: [...previous.beats, memory],
    }
    if (card.beat === 2 && chosen.id === 'promise')
      next.promise = promisePressure(next, run.alignmentLog, run.day)
    if (card.beat === 3) next.outcome = card.outcome as BetrayalArc['outcome']
    arcs.betrayal = next
    const recruiter = recruiterFor(villain, previous.beats[0]?.day ?? run.day)
    return {
      arcs,
      card,
      option: chosen,
      ...(card.beat === 2 &&
      chosen.id === 'expose' &&
      next.direction === 'to-villain' &&
      recruiter
        ? { evidence: recruiter.id, influence: 1 }
        : {}),
    }
  }
  const previous: AccompliceArc = arcs.accomplice ?? {
    person: card.person,
    side: card.side!,
    beats: [],
  }
  const next: AccompliceArc = {
    ...previous,
    beats: [...previous.beats, memory],
  }
  if (card.beat === 1 && chosen.id === 'decline') next.outcome = 'declined'
  if (card.beat === 3) next.outcome = card.outcome as AccompliceArc['outcome']
  arcs.accomplice = next
  const lieutenant = recruiterFor(villain, run.day)
  return {
    arcs,
    card,
    option: chosen,
    ...(card.beat === 2
      ? chosen.id === 'share'
        ? { cityStanding: 1 }
        : chosen.id === 'keep'
          ? { influence: 1 }
          : { danger: -1 }
      : {}),
    ...(card.beat === 3 && chosen.id === 'confront' && lieutenant
      ? { evidence: lieutenant.id }
      : {}),
  }
}

// ------------------------------------------------------------- payoffs

/** A classmate who turned, sold you out, or went undercover is off the
 * night roster from the morning after that beat. */
export function arcSeparated(
  arcs: ClassmateArcs | undefined,
  id: StudentId,
  day: number,
): boolean {
  const betrayal = arcs?.betrayal
  const turn = betrayal?.beats[2]
  if (
    betrayal?.person === id &&
    betrayal.outcome === 'turned' &&
    turn &&
    day > turn.day
  )
    return true
  const accomplice = arcs?.accomplice
  const offer = accomplice?.beats[2]
  return Boolean(
    accomplice?.person === id &&
    offer &&
    day > offer.day &&
    (accomplice.outcome === 'sold-out' || offer.choice === 'double'),
  )
}

/** A partner in crime knows villain and rogue work: +1 on those calls they
 * are sent on, from the night after the handshake until they leave. */
export function accompliceBonus(
  arcs: ClassmateArcs | undefined,
  day: number,
  allegiance: Incident['allegiance'],
  students: readonly StudentId[],
): number {
  const arc = arcs?.accomplice
  const handshake = arc?.beats[0]
  if (
    !arc ||
    !handshake ||
    arc.outcome === 'declined' ||
    day <= handshake.day ||
    arcSeparated(arcs, arc.person, day) ||
    (allegiance !== 'villain' && allegiance !== 'rogue')
  )
    return 0
  return students.includes(arc.person) ? 1 : 0
}

/** Prom-night consequences: a small, earned push on the finale's support
 * and the lines that explain it. Runs without these arcs are unchanged. */
export function arcFinale(world: ArcWorld): {
  support: number
  lines: string[]
} {
  const { run } = world
  const villain = campaignVillain(run.seed, run.mastermind)
  const lines: string[] = []
  let support = 0
  const betrayal = run.classmateArcs?.betrayal
  if (betrayal) {
    const name = world.names[betrayal.person]
    const toVillain = betrayal.direction === 'to-villain'
    const last = betrayal.beats[2]?.choice
    if (betrayal.outcome === 'turned') {
      const reached = betrayal.beats[0]?.choice === 'reach'
      const buried =
        !toVillain && betrayal.beats[1]?.choice === 'expose' ? true : false
      if (last === 'door' && reached) {
        support += 1
        lines.push(
          toVillain
            ? `${name} walked back through the door you left open: at the fourth dance, ${name} cut ${villain.name}'s relay from the inside and came home to face what the jobs had cost.`
            : `${name}'s testimony named ${villain.name}'s whole network, not only you, and the hearing clerk's stamped pages helped the city find the right relays on prom night.`,
        )
      } else if (last === 'cut' && !buried) {
        support -= 1
        lines.push(
          toVillain
            ? `${name} stood beside ${villain.name} at the prom, holding the relay you had taught ${pronouns(betrayal.person).them} to defend.`
            : `${name}'s testimony arrived at graduation with every page intact, and half your allies read it before the fourth dance.`,
        )
      } else
        lines.push(
          toVillain
            ? `${name} never came back through the door, and never quite closed it either. The heel turn stands in the chronicle.`
            : `${name} testified, and the city remembers. ${buried ? 'The pages that named you were ash; the memory was not.' : 'Nobody forgave anybody on prom night.'}`,
        )
    } else if (betrayal.outcome === 'averted') {
      if (last === 'stand') {
        support += 1
        lines.push(
          `${name} kept the promise made at the canal and stood beside you at the fourth dance. The betrayal everyone expected never came.`,
        )
      } else
        lines.push(
          `${name} answered calls again in ${pronouns(betrayal.person).their} own time. The turn that almost happened stayed a rumor.`,
        )
    } else
      lines.push(
        `${name}'s second ${toVillain ? 'radio' : 'notebook'} was still unresolved when the chandelier fell.`,
      )
  }
  const accomplice = run.classmateArcs?.accomplice
  if (accomplice && accomplice.outcome !== 'declined') {
    const name = world.names[accomplice.person]
    const last = accomplice.beats[2]?.choice
    if (accomplice.outcome === 'loyal' && last === 'double') {
      support += 1
      lines.push(
        `${name}, the accomplice everyone thought had sold you out, opened ${villain.name}'s console from the inside at the fourth dance.`,
      )
    } else if (accomplice.outcome === 'loyal')
      lines.push(
        `${name} turned down ${villain.name}'s counteroffer and worked the prom beside you, partners to the end.`,
      )
    else if (accomplice.outcome === 'sold-out' && last === 'let-go') {
      support -= 1
      lines.push(
        `${name} let ${villain.name}'s people in through the warehouse you robbed together. You hired an accomplice and kept the haul; ${name} learned the lesson.`,
      )
    } else if (accomplice.outcome === 'sold-out')
      lines.push(
        `${name} sold you out, and you made sure the people who bought ${pronouns(accomplice.person).them} were named in public.`,
      )
    else
      lines.push(
        `${name}'s job against ${villain.name} was still unfinished on prom night.`,
      )
  }
  return { support, lines }
}

// ------------------------------------------------------------ save guards

const isLean = (value: unknown): value is Lean =>
  typeof value === 'string' && (LEANS as readonly string[]).includes(value)

export function validAlignmentLog(
  raw: unknown,
  day: number,
  roster: readonly StudentId[],
): raw is AlignmentNight[] {
  if (!Array.isArray(raw) || raw.length > 30) return false
  let previous = 0
  for (const night of raw) {
    if (
      !night ||
      typeof night !== 'object' ||
      !Number.isInteger(night.day) ||
      night.day <= previous ||
      night.day < 1 ||
      night.day > day ||
      !night.marks ||
      typeof night.marks !== 'object' ||
      Array.isArray(night.marks)
    )
      return false
    const entries = Object.entries(night.marks as Record<string, unknown>)
    if (
      !entries.length ||
      entries.some(
        ([actor, lean]) =>
          (actor !== 'you' && !roster.includes(actor as StudentId)) ||
          !isLean(lean),
      )
    )
      return false
    previous = night.day
  }
  return true
}

function validBeats(
  beats: unknown,
  day: number,
  choicesFor: (beat: ArcBeatNumber, beats: ArcMemory[]) => readonly string[],
): beats is ArcMemory[] {
  if (!Array.isArray(beats) || beats.length < 1 || beats.length > 3)
    return false
  return beats.every((memory, index) => {
    const prior = beats[index - 1] as ArcMemory | undefined
    return (
      memory &&
      typeof memory === 'object' &&
      memory.beat === index + 1 &&
      Number.isInteger(memory.day) &&
      memory.day >= ARC_WINDOW.firstBeat.from &&
      memory.day <= Math.min(day, ARC_WINDOW.last) &&
      (index > 0 || memory.day <= ARC_WINDOW.firstBeat.to) &&
      (!prior || memory.day >= prior.day + ARC_WINDOW.gap) &&
      choicesFor(memory.beat, beats as ArcMemory[]).includes(memory.choice)
    )
  })
}

/** Structure, timing and choices, plus outcomes recomputed from the saved
 * track so an edited save cannot claim a different ending. */
export function validClassmateArcs(
  raw: unknown,
  run: Pick<AcademyRun, 'seed' | 'day' | 'alignmentLog'>,
  roster: readonly StudentId[],
): raw is ClassmateArcs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const arcs = raw as ClassmateArcs
  const seeded = campaignBetrayer(run.seed)
  const betrayal = arcs.betrayal
  if (betrayal !== undefined) {
    if (
      !betrayal ||
      !roster.includes(betrayal.person) ||
      betrayal.person === seeded ||
      !['to-villain', 'to-hero'].includes(betrayal.direction) ||
      !validBeats(betrayal.beats, run.day, (beat, beats) =>
        beat === 1
          ? BETRAYAL_CHOICES[1]
          : beat === 2
            ? beats[0]!.choice === 'tail'
              ? BETRAYAL_CHOICES[2]
              : BETRAYAL_CHOICES[2].filter((id) => id !== 'expose')
            : betrayal.outcome === 'turned'
              ? BETRAYAL_CHOICES.turned
              : BETRAYAL_CHOICES.averted,
      ) ||
      (betrayal.beats.length >= 2 &&
        betrayal.beats[1]!.day < ARC_WINDOW.secondBeat) ||
      (betrayal.beats.length === 3) !== (betrayal.outcome !== undefined) ||
      (betrayal.beats[1]?.choice === 'promise') !==
        (betrayal.promise !== undefined) ||
      (betrayal.promise !== undefined &&
        betrayal.promise !==
          promisePressure(betrayal, run.alignmentLog, betrayal.beats[1]!.day))
    )
      return false
    const turn = betrayal.beats[2]
    if (
      turn &&
      (turn.day < ARC_WINDOW.betrayalTurn ||
        betrayal.outcome !==
          betrayalOutcome(betrayal, run.alignmentLog, turn.day))
    )
      return false
  }
  const accomplice = arcs.accomplice
  if (accomplice !== undefined) {
    if (
      !accomplice ||
      !roster.includes(accomplice.person) ||
      accomplice.person === seeded ||
      accomplice.person === betrayal?.person ||
      !['villain', 'rogue'].includes(accomplice.side) ||
      !validBeats(accomplice.beats, run.day, (beat) =>
        beat === 1
          ? ACCOMPLICE_CHOICES[1]
          : beat === 2
            ? ACCOMPLICE_CHOICES[2]
            : accompliceOutcome(accomplice) === 'loyal'
              ? ACCOMPLICE_CHOICES.loyal
              : ACCOMPLICE_CHOICES['sold-out'],
      ) ||
      (accomplice.beats[0]!.choice === 'decline'
        ? accomplice.beats.length !== 1 || accomplice.outcome !== 'declined'
        : (accomplice.beats.length === 3) !==
            (accomplice.outcome !== undefined) ||
          (accomplice.outcome !== undefined &&
            accomplice.outcome !== accompliceOutcome(accomplice))) ||
      (accomplice.beats.length >= 2 &&
        accomplice.beats[1]!.day < ARC_WINDOW.secondBeat) ||
      (accomplice.beats.length === 3 &&
        accomplice.beats[2]!.day < ARC_WINDOW.accompliceOffer)
    )
      return false
  }
  // Two arcs never share a debrief.
  const days = [...(betrayal?.beats ?? []), ...(accomplice?.beats ?? [])].map(
    (memory) => memory.day,
  )
  return new Set(days).size === days.length
}
