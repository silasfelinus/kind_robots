import stories from './identitySerial.json'
import { identityFor, IDENTITY_ARCS } from './identityArcs'
import type { SignaturePowerId } from './specialPowers'
import type { AcademyRun } from './rules'

export type PersonalChapterDay = 4 | 12 | 21 | 27
export type PersonalChoice =
  | 'investigate'
  | 'conceal'
  | 'delegate'
  | 'ally'
  | 'court'
  | 'distance'
  | 'expose'
  | 'leverage'
  | 'listen'
  | 'hero'
  | 'villain'
  | 'independent'
export type PersonalHistory = {
  day: PersonalChapterDay
  choice: PersonalChoice
}
const CHAPTER_DAYS = [4, 12, 21, 27] as const
const CHOICES: Record<PersonalChapterDay, readonly PersonalChoice[]> = {
  4: ['investigate', 'conceal', 'delegate'],
  12: ['ally', 'court', 'distance'],
  21: ['expose', 'leverage', 'listen'],
  27: ['hero', 'villain', 'independent'],
}
export type PersonalArc = {
  signature: SignaturePowerId
  secret: string
  relationship: string
  betrayal: string
  fallout: string
}
export const PERSONAL_ARCS = stories.episodes as PersonalArc[]
const bySignature = new Map(PERSONAL_ARCS.map((arc) => [arc.signature, arc]))

export function personalArcFor(signature: SignaturePowerId): PersonalArc {
  const arc = bySignature.get(signature)
  if (!arc) throw new Error(`Missing personal adventure for ${signature}`)
  return arc
}

/** Canonical paired supporting person, mutually connected across opposite origins. */
export function personalCounterpart(signature: SignaturePowerId) {
  const index = IDENTITY_ARCS.findIndex((arc) => arc.signature === signature)
  if (index === -1) throw new Error('Unknown original identity')
  return IDENTITY_ARCS[(index + 24) % IDENTITY_ARCS.length]!
}

export function isValidPersonalHistory(
  raw: unknown,
  day: number,
): raw is PersonalHistory[] {
  return (
    Array.isArray(raw) &&
    raw.length <= 4 &&
    raw.every(
      (item, i) =>
        item !== null &&
        typeof item === 'object' &&
        CHAPTER_DAYS.includes(item.day) &&
        item.day <= day &&
        CHOICES[item.day as PersonalChapterDay].includes(item.choice) &&
        (i === 0 || item.day > raw[i - 1].day),
    )
  )
}

const decision = (
  id: PersonalChoice,
  label: string,
  text: string,
  influence: number,
  danger: number,
) => ({ id, label, text, influence, danger })

export function personalEncounter(run: AcademyRun) {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'campus' ||
    !run.signature ||
    !CHAPTER_DAYS.includes(run.day as PersonalChapterDay)
  )
    return null
  const day = run.day as PersonalChapterDay
  const person = identityFor(run.signature)
  const other = personalCounterpart(run.signature)
  const story = personalArcFor(run.signature)
  const history = run.identityHistory ?? []
  const early = history.find((item) => item.day === 4)?.choice
  const bond = history.find((item) => item.day === 12)?.choice
  const crisis = history.find((item) => item.day === 21)?.choice
  const trust = crisis === 'expose' || crisis === 'listen'
  const proposal = bond === 'court' && trust && (run.cityStanding ?? 0) >= -2
  const relationshipStatus =
    bond === 'court'
      ? proposal
        ? `${other.realName} freely agrees to explore dating after the crisis, while keeping the right to change their mind.`
        : `${other.realName} declines romance for now; their answer is respected and they owe nobody affection.`
      : bond === 'ally'
        ? `${other.realName} remains an independent ally, not a sidekick owned by your decisions.`
        : `${other.realName} respects the distance you asked for; no relationship is owed.`
  if (day === 4)
    return {
      title: `${person.student.alias}: A File That Should Not Exist`,
      location: 'Comet City / Identity Dossier',
      scene: `${person.realName} thought their origin was a private disaster. ${person.backstory} ${story.secret} ${other.realName}, whose power grew from a very different life, offers to examine the evidence without claiming ownership. ${person.student.conflict}`,
      options: [
        decision(
          'investigate',
          'Share the evidence with the people it affects',
          `${person.realName} and ${other.realName} let witnesses keep copies. ${person.quests.protagonist} The investigation gains public legitimacy even as a powerful suspect learns they are being watched.`,
          2,
          -1,
        ),
        decision(
          'conceal',
          'Keep the evidence for personal leverage',
          `${person.realName} hides the file and gains privileged access. ${person.quests.antagonist} A witness starts wondering why the truth belongs to only one person.`,
          -1,
          2,
        ),
        decision(
          'delegate',
          'Ask the other hero to lead the inquiry',
          `${other.realName} makes their own choice about the file, and ${person.realName} practices trusting someone without control. The mystery stays open, but the partnership has boundaries.`,
          1,
          0,
        ),
      ],
    }
  if (day === 12)
    return {
      title: `${person.student.alias}: Between Two Masks`,
      location: 'Comet City / Private Conversation',
      scene: `${person.realName} must decide whom to trust. ${story.relationship} ${other.realName} has a different origin and will not automatically share ${person.realName}'s solution. ${person.quests.partner} ${early === 'conceal' ? 'The hidden file still casts a shadow over this meeting.' : 'The early search gives both people grounds to speak honestly.'} A strong alliance, an adult romance, or separate paths can all be honorable choices.`,
      options: [
        decision(
          'ally',
          'Propose an equal field partnership with clear boundaries',
          `${other.realName} agrees to work together without giving up their own goals. ${person.sidekick} An equal partnership is not a claim on anyone's body or loyalty.`,
          2,
          -1,
        ),
        decision(
          'court',
          'Ask whether they would welcome a future date',
          `${person.realName} extends an invitation, not a demand. ${person.romance} ${other.realName} asks for time and a separate choice after the crisis; nothing romantic is presumed yet.`,
          1,
          0,
        ),
        decision(
          'distance',
          'Respect separate goals and keep the friendship open',
          `${other.realName} says no explanation is required to retain independence. ${person.realName} steps away without retaliating, and they both keep the freedom to reconnect later.`,
          0,
          -1,
        ),
      ],
    }
  if (day === 21)
    return {
      title: `${person.student.alias}: The Price of a Secret`,
      location: 'Comet City / Betrayed Promises',
      scene: `${person.realName} receives an impossible bargain. ${story.betrayal} The offer echoes ${person.villainDecision} ${other.realName} insists that protecting a friend never means covering up harm to strangers. ${early === 'conceal' ? 'The original withheld evidence is now part of the blackmail.' : 'The public evidence makes the attempted cover-up harder.'}`,
      options: [
        decision(
          'expose',
          'Protect witnesses and make the deal public',
          `${person.realName} publishes the coercive offer with witnesses' consent. ${other.realName} helps protect people affected by the fallout, but refuses to call exposure forgiveness.`,
          2,
          -1,
        ),
        decision(
          'leverage',
          'Accept the secret bargain and hold the key',
          `${person.realName} gains power from the deal. ${other.realName} withdraws trust and a dangerous actor gains access through the bargain. The betrayal cannot be erased by a later apology.`,
          -2,
          2,
        ),
        decision(
          'listen',
          'Hear the threatened party before ruling',
          `${person.realName} hears testimony from everyone endangered, including ${other.realName}. The offer is rejected without pretending the person who made it had no motive or no obligation to repair harm.`,
          1,
          0,
        ),
      ],
    }
  return {
    title: `${person.student.alias}: The Person Behind the Legend`,
    location: 'Comet City / Personal Reckoning',
    scene: `${person.realName} confronts the person they have become. ${story.fallout} ${person.heroDecision} Or ${person.villainDecision} ${relationshipStatus} ${crisis === 'leverage' ? `${other.realName} has not forgotten the betrayal and will not play a convenient supporting role.` : `${other.realName} recognizes the choice to hear people who were harmed.`}`,
    options: [
      decision(
        'hero',
        `Carry the cost as ${person.hero.alias}`,
        `${person.heroDecision} ${person.hero.method} ${story.fallout} ${relationshipStatus} No victory absolves the earlier decisions.`,
        2,
        -1,
      ),
      decision(
        'villain',
        `Seize control as ${person.villain.alias}`,
        `${person.villainDecision} ${person.villain.method} ${story.fallout} ${other.realName} retains the agency to oppose this choice. Power buys control, not love.`,
        -2,
        2,
      ),
      decision(
        'independent',
        'Give affected people the final say',
        `${person.realName} gives evidence, tools and decisions back to the people living with the consequences. ${other.realName} can offer support but is never compelled to follow.`,
        1,
        -1,
      ),
    ],
  }
}

export function personalEnding(run: AcademyRun): string {
  if (!run.signature || !run.identityHistory?.length) return ''
  const arc = personalArcFor(run.signature)
  const person = identityFor(run.signature)
  const peer = personalCounterpart(run.signature)
  const outcome = run.identityHistory.find((step) => step.day === 27)?.choice
  const bond = run.identityHistory.find((step) => step.day === 12)?.choice
  const betrayal = run.identityHistory.find((step) => step.day === 21)?.choice
  const core =
    outcome === 'hero'
      ? `${person.hero.alias} becomes a hero by living with the consequences of ${person.heroDecision}`
      : outcome === 'villain'
        ? `${person.villain.alias} takes the dangerous path: ${person.villainDecision}`
        : `${person.realName} leaves the city's future in the hands of its residents, not a crowned individual.`
  const connection =
    bond === 'court'
      ? betrayal === 'leverage'
        ? `${peer.realName} does not owe romance or forgiveness after the betrayal.`
        : `${peer.realName} is free to answer the invitation in their own time; consent is not a prize.`
      : bond === 'ally'
        ? `${peer.realName} can remain a field partner without surrendering an independent future.`
        : `${peer.realName} remains a distinct person with a separate story.`
  return `${person.realName}: ${core} ${arc.fallout} ${betrayal === 'leverage' ? 'Their broken promise remains part of the public record.' : 'They chose to hear the people affected by their power.'} ${connection}`
}

export function personalOutcomeArt(run: AcademyRun): string | null {
  if (!run.signature || !run.identityHistory?.length) return null
  const choices = run.identityHistory
  const last = choices[choices.length - 1]
  const outcome =
    last?.day === 27
      ? last.choice === 'villain'
        ? 'villain'
        : 'hero'
      : last?.day === 21
        ? last.choice === 'leverage'
          ? 'betrayal'
          : 'partner'
        : last?.day === 12
          ? 'partner'
          : null
  return outcome ? `identities/${run.signature}/outcomes/${outcome}` : null
}

export function personalOutcomeModifier(
  history: readonly PersonalHistory[] | undefined,
): number {
  if (!history?.length) return 0
  return history.reduce(
    (sum, step) =>
      sum +
      (step.choice === 'investigate' ||
      step.choice === 'ally' ||
      step.choice === 'expose' ||
      step.choice === 'hero'
        ? 1
        : step.choice === 'conceal' ||
            step.choice === 'leverage' ||
            step.choice === 'villain'
          ? -1
          : 0),
    0,
  )
}

export const PERSONAL_CHAPTER_DAYS = CHAPTER_DAYS
