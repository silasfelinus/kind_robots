import catalog from './personalQuests.json'
import { identityFor } from './identityArcs'
import type { AcademyRun } from './rules'
import type { SignaturePowerId } from './specialPowers'

export type PersonalChoice = 'protect' | 'confront' | 'exploit'
export type PersonalMemory = { day: number; choice: PersonalChoice }
export type PersonalArtForm = 'student' | 'hero' | 'villain'
export const PERSONAL_DAYS = [6, 9, 19, 22] as const

export type PersonalQuest = {
  signature: SignaturePowerId
  location: string
  ally: string
  proof: string
  betrayal: string
  repair: string
  boundary: string
  illustrations: Record<PersonalArtForm, string>
}
export const PERSONAL_QUESTS = catalog.quests as PersonalQuest[]
const bySignature = new Map(
  PERSONAL_QUESTS.map((entry) => [entry.signature, entry]),
)

export function personalQuestForId(signature: SignaturePowerId): PersonalQuest {
  const quest = bySignature.get(signature)
  if (!quest) throw new Error('Missing personal quest for ' + signature)
  return quest
}

export function validPersonalHistory(
  raw: unknown,
  currentDay: number,
): raw is PersonalMemory[] {
  if (!Array.isArray(raw) || raw.length > PERSONAL_DAYS.length) return false
  let previous = 0
  for (const event of raw) {
    if (
      !event ||
      typeof event !== 'object' ||
      !Number.isInteger(event.day) ||
      event.day <= previous ||
      event.day > currentDay ||
      !PERSONAL_DAYS.some((day) => day === event.day) ||
      !['protect', 'confront', 'exploit'].includes(event.choice)
    )
      return false
    previous = event.day
  }
  return true
}

export function personalStanding(
  memory: readonly PersonalMemory[] | undefined,
): number {
  return (memory ?? []).reduce(
    (value, event) =>
      value +
      (event.choice === 'protect' ? 2 : event.choice === 'exploit' ? -2 : 0),
    0,
  )
}

export function personalOutcomeArtKey(
  signature: SignaturePowerId,
  memory: readonly PersonalMemory[] | undefined,
  day: number,
): string | null {
  const event = memory?.findLast((item) => item.day === day)
  if (!event) return null
  const form: PersonalArtForm =
    day < 16
      ? 'student'
      : event.choice === 'protect'
        ? 'hero'
        : event.choice === 'exploit'
          ? 'villain'
          : 'student'
  return 'identities/' + signature + '/outcomes/' + form
}

export function personalQuestEvent(run: AcademyRun) {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'campus' ||
    !run.signature ||
    !PERSONAL_DAYS.some((day) => day === run.day)
  )
    return null
  const identity = identityFor(run.signature)
  const quest = personalQuestForId(run.signature)
  const past = run.personalHistory ?? []
  const last = past[past.length - 1]
  const callback = last
    ? last.choice === 'protect'
      ? 'The people you protected at the last meeting are still willing to testify.'
      : last.choice === 'confront'
        ? 'After you demanded the truth, the witness will speak only with clear ground rules.'
        : 'Word of your earlier bargain has reached this room. Nobody is certain they can trust you.'
    : 'Nobody can predict which version of this story will become public.'
  const role = run.playerEvolution?.form ?? 'student'
  const persona =
    role === 'hero'
      ? identity.hero
      : role === 'villain'
        ? identity.villain
        : identity.student
  const title = (
    {
      6: 'A Secret with a Witness',
      9: 'Terms of Affection and Trust',
      19: 'The Friend Who Sold a Key',
      22: 'A Name Worth Becoming',
    } as Record<number, string>
  )[run.day]!
  const frames: Record<number, string> = {
    6:
      identity.quests.protagonist +
      ' ' +
      quest.proof +
      '. ' +
      quest.ally +
      ' has kept an original copy. ' +
      'The first person who helped you now needs protection from the institution that made your powers possible.',
    9:
      identity.quests.partner +
      ' ' +
      quest.ally +
      ' offers to help, but will not surrender their own ambitions. ' +
      quest.boundary +
      '. ' +
      quest.repair +
      '. Being a teammate does not imply dating, and either person may decline.',
    19:
      'The private evidence becomes public without your permission. ' +
      quest.betrayal +
      '. ' +
      quest.ally +
      ' refuses to excuse the betrayal simply because the accused was once a friend. ' +
      'The real mastermind is still active; this personal breach is a separate case.',
    22:
      'Prom is eight days away. ' +
      identity.realName +
      ' stands at ' +
      quest.location +
      ' with evidence of the original wrong. ' +
      'As ' +
      persona.alias +
      ', you can use a changed toolkit to help, negotiate or dominate. ' +
      'Heroic option: ' +
      identity.hero.method +
      ' Villainous option: ' +
      identity.villain.method,
  }
  const options = [
    {
      id: 'personal-' + run.day + '-protect',
      label:
        run.day === 9
          ? 'Offer an equal partnership with a right to refuse'
          : run.day === 19
            ? 'Protect witnesses, even if the betrayer walks free for now'
            : 'Put the people at risk first, without claiming ownership',
      text:
        (run.day === 9
          ? quest.repair +
            '. ' +
            quest.boundary +
            '. Your ally chooses the terms; this is not an automatic romance.'
          : run.day === 19
            ? 'The witness gets safe independent counsel. The accused must still answer for ' +
              quest.betrayal.toLowerCase() +
              '.'
            : identity.heroDecision + ' ' + quest.repair + '.') +
        ' The cost is real: you surrender a tactical advantage to protect someone else.',
      influence: 2,
      danger: -1,
      trust: 2,
    },
    {
      id: 'personal-' + run.day + '-confront',
      label:
        run.day === 9
          ? 'Share the evidence and accept their own decision'
          : 'Confront the responsible party in front of independent witnesses',
      text:
        quest.ally +
        ' helps present the evidence: ' +
        quest.proof +
        '. ' +
        identity.quests.antagonist +
        ' ' +
        'The accused is offered a hearing, not an instant pardon. An ally may decline any relationship afterward.',
      influence: 0,
      danger: 0,
      trust: 1,
    },
    {
      id: 'personal-' + run.day + '-exploit',
      label:
        run.day === 9
          ? 'Treat a private confidence as leverage'
          : 'Use the evidence to secure personal control',
      text:
        identity.villainDecision +
        ' ' +
        identity.villain.method +
        ' The witness withdraws support: ' +
        quest.boundary +
        '. The betrayal is not forgotten, and the resulting power comes with public consequences.',
      influence: -2,
      danger: 2,
      trust: -2,
    },
  ] as const
  return {
    title: identity.realName + ' · ' + title,
    location: quest.location,
    scene: frames[run.day] + ' ' + callback,
    options,
  }
}

export function personalFinale(
  signature: SignaturePowerId | undefined,
  history: readonly PersonalMemory[] | undefined,
): string {
  if (!signature || !history?.length) return ''
  const identity = identityFor(signature)
  const quest = personalQuestForId(signature)
  const final = history[history.length - 1]!
  const relationship = history.some(
    (event) => event.day === 9 && event.choice === 'protect',
  )
    ? quest.ally +
      ' returns by choice as an equal and helps rebuild. ' +
      quest.boundary +
      '.'
    : history.some((event) => event.day === 9 && event.choice === 'exploit')
      ? quest.ally +
        ' will not be used again; trust is not something graduation restores.'
      : quest.ally + ' remains independent and may collaborate on new terms.'
  const betrayal = history.some(
    (event) => event.day === 19 && event.choice === 'confront',
  )
    ? 'Independent testimony holds the person responsible for ' +
      quest.betrayal.toLowerCase() +
      '.'
    : history.some((event) => event.day === 19 && event.choice === 'protect')
      ? 'The witness survived, though the original betrayer still owes accountability.'
      : 'The betrayal left an open wound in the case.'
  const outcome =
    final.choice === 'protect'
      ? identity.hero.alias +
        ' chooses a public rescue: ' +
        identity.heroDecision
      : final.choice === 'exploit'
        ? identity.villain.alias + ' takes command: ' + identity.villainDecision
        : identity.student.alias +
          ' refuses the false binary and makes space for testimony: ' +
          quest.repair
  return (
    identity.realName +
    ' closes a personal four-act case at ' +
    quest.location +
    '. ' +
    outcome +
    '. ' +
    relationship +
    ' ' +
    betrayal
  )
}
