import type { CrewId, VoyageRun } from './rules'
import {
  ROMANCE_STORIES,
  romanceStory,
  type RelationshipStory,
  type StoryRoute,
} from './romanceStories'

export type RomanceRoute = StoryRoute | 'none'
export type RomanceStatus =
  'invited' | 'courting' | 'committed' | 'separated' | 'rejected' | 'friends'
export type RomanceChoiceId =
  | `invite-${StoryRoute}`
  | 'friends'
  | 'listen'
  | 'press'
  | 'step-back'
  | 'commit'
  | 'slow'
  | 'part'
export type RomanceRecord = {
  route: RomanceRoute
  status: RomanceStatus
  lastChapter: number
  result: string
  history: string[]
}
export type RomanceVoyage = VoyageRun & { romance?: RomanceRecord }
export type RomanceChoice = {
  id: RomanceChoiceId
  label: string
  cost: string
}
export type RomanceMoment = {
  title: string
  setting: string
  speakers: readonly { name: string; line: string }[]
  portraits: readonly string[]
  choices: readonly RomanceChoice[]
}

/** Crew keep their jobs and stats regardless of how a romance ends. */
function eligibleStories(run: VoyageRun): RelationshipStory[] {
  return ROMANCE_STORIES.filter((story) =>
    story.people.every((id) => run.crew.includes(id)),
  )
}

function compatible(run: VoyageRun, story: RelationshipStory): boolean {
  return (
    run.trust >= story.trustRequired &&
    run.reputation >= story.reputationFloor &&
    run.intervention <= story.interventionLimit
  )
}

/** Non-romantic crew quests and actions change what participants have witnessed. */
function witnessedHistory(
  run: VoyageRun,
  people: readonly CrewId[],
): string | null {
  const steps = (run.journeyHistory ?? []).filter((stop) =>
    people.includes(stop.crewId),
  )
  if (!steps.length) return null
  const mostRecent = steps[steps.length - 1]!
  const name = mostRecent.crewId.toUpperCase()
  return `We also remember what happened at ${mostRecent.system}. ${name} does not have to forgive it merely because a personal mission ended.`
}

const captainReflections: Record<VoyageRun['captain'], string> = {
  fluke:
    'Fluke resists reading tomorrow’s answer. Nobody gets to skip the uncertain, delicious present.',
  vale: 'Vale does not try to rewrite the other person’s preferences. This may be her most radical invention.',
  solace:
    'Solace checks the exits, then lets someone else keep watch. They make it through the evening alive.',
  rex: 'Rex declines to commission a statue of this feeling, although he has already drafted the inscription.',
  quill:
    'Quill sets down the flask and unseals his suit’s privacy controls. The invitation is a choice, not a protocol.',
  ro: 'Ro postpones the organ music. The velvet-clad master of ceremonies lets affection remain gloriously unrehearsed.',
}

export function romanceMoment(run: VoyageRun): RomanceMoment | null {
  if (run.phase !== 'debrief' || run.chapter < 1 || run.chapter > 3) return null
  const record = (run as RomanceVoyage).romance
  if (record?.lastChapter === run.chapter) return null

  if (!record) {
    if (run.chapter !== 1) return null
    const stories = eligibleStories(run)
    if (!stories.length) return null
    const hasFourple = stories.some((story) => story.id === 'fourple')
    const uniquePeople = [...new Set(stories.flatMap((story) => story.people))]
    return {
      title: 'Off Duty: Feelings Are Not Orders',
      setting:
        'The long red couch coasts through the dark inside its invisible safety bubble. Nobody has to explain their interest to the captain, and nobody can be reassigned for saying no.',
      speakers: hasFourple
        ? [
            {
              name: 'Vela',
              line: 'Is this a personnel evaluation? Mine already comes in writing.',
            },
            {
              name: 'Taal',
              line: 'I do not sign anything warmer than a treaty under an order.',
            },
            {
              name: 'Omi',
              line: 'There are four seats and four people. That is where the accounting must stop.',
            },
          ]
        : stories
            .filter((story) => story.kind === 'solo')
            .map((story) => ({
              name: story.label.split(' · ')[0]!,
              line: story.invitation,
            })),
      portraits: uniquePeople.map((id) => 'crew-' + id),
      choices: [
        ...stories.map((story) => ({
          id: `invite-${story.id}` as RomanceChoiceId,
          label:
            story.kind === 'pair'
              ? `Respectfully explore ${story.label} together`
              : story.kind === 'fourple'
                ? 'Invite Vela, Taal and Omi to talk as equals'
                : `Get to know ${story.label} personally`,
          cost:
            story.kind === 'pair'
              ? 'A possible bond between crewmates, not a captain’s reward'
              : 'An invitation, not anyone’s consent',
        })),
        {
          id: 'friends',
          label: 'Keep your closeness as friendship',
          cost: 'No romantic obligation or penalty',
        },
      ],
    }
  }

  if (record.status !== 'invited' && record.status !== 'courting') return null
  const story = romanceStory(record.route)
  if (!story) return null

  if (run.chapter === 2 && record.status === 'invited') {
    const history = witnessedHistory(run, story.people)
    return {
      ...story.chapter2,
      speakers: history
        ? [...story.chapter2.speakers, { name: 'Captain’s log', line: history }]
        : [...story.chapter2.speakers],
      portraits: story.portraitKeys,
      choices: [
        {
          id: 'listen',
          label:
            story.kind === 'pair'
              ? 'Respect both crewmates’ boundaries and let them choose'
              : 'Hear every boundary and keep the agreement revocable',
          cost: 'No one owes a captain affection',
        },
        {
          id: 'press',
          label: 'Demand a decision immediately',
          cost: 'Pressure ends courtship, not employment',
        },
        {
          id: 'step-back',
          label: 'Step away kindly',
          cost: 'Continue as colleagues',
        },
      ],
    }
  }
  if (run.chapter === 3 && record.status === 'courting') {
    return {
      ...story.chapter3,
      portraits: story.portraitKeys,
      choices: [
        {
          id: 'commit',
          label:
            story.kind === 'fourple'
              ? 'Ask for four freely given signatures'
              : story.kind === 'pair'
                ? 'Support their choice to be together without claiming it'
                : 'Invite a shared future',
          cost: 'Possible only with earned mutual trust',
        },
        {
          id: 'slow',
          label: 'Continue without a promise',
          cost: 'Love need not resolve today',
        },
        {
          id: 'part',
          label: 'Part as partners and stay colleagues',
          cost: 'No one loses their place on the couch',
        },
      ],
    }
  }
  return null
}

export function chooseRomance(
  run: VoyageRun,
  choice: RomanceChoiceId,
): VoyageRun {
  const moment = romanceMoment(run)
  if (!moment || !moment.choices.some((item) => item.id === choice)) return run
  const previous = (run as RomanceVoyage).romance
  const route: RomanceRoute = choice.startsWith('invite-')
    ? (choice.slice('invite-'.length) as StoryRoute)
    : (previous?.route ?? 'none')
  const story = romanceStory(route)
  let status: RomanceStatus
  let text: string

  if (choice === 'friends') {
    status = 'friends'
    text =
      'Their friendships remain their own. Nobody loses a job, a mission assignment, or a skill point.'
  } else if (choice === 'step-back' || choice === 'part') {
    status = 'separated'
    text =
      story?.separation ??
      'The relationship ends without orders or reprisals. Everyone remains aboard by choice.'
  } else if (choice === 'press') {
    status = 'rejected'
    text = story
      ? `No one can be ordered to love. ${story.refusal}`
      : 'Affection is not subject to the captain’s authority.'
  } else if (choice.startsWith('invite-') && story) {
    status = 'invited'
    text = story.invitation
  } else if (choice === 'listen' && story) {
    status = compatible(run, story) ? 'courting' : 'rejected'
    text = status === 'courting' ? story.negotiation : story.refusal
  } else if (choice === 'slow') {
    status = 'courting'
    text = story
      ? `${story.negotiation} Nothing is signed and nobody is owed a final answer.`
      : 'Nobody signs anything. Their future remains an open question.'
  } else if (choice === 'commit' && story) {
    status = compatible(run, story) ? 'committed' : 'separated'
    text = status === 'committed' ? story.acceptance : story.refusal
  } else return run

  const message = `Relationship / chapter ${run.chapter}: ${text}`
  const romance: RomanceRecord = {
    route,
    status,
    result: text,
    lastChapter: run.chapter,
    history: [...(previous?.history ?? []), message],
  }
  return { ...run, romance, log: [...run.log, message] } as RomanceVoyage
}

export function relationshipEpilogue(run: VoyageRun): VoyageRun {
  if (run.phase !== 'ending') return run
  const record = (run as RomanceVoyage).romance
  if (!record || record.route === 'none') return run
  if (run.log.some((line) => line.startsWith('Relationship epilogue: ')))
    return run
  const story = romanceStory(record.route)
  const text = story
    ? record.status === 'committed'
      ? `${story.ending} ${captainReflections[run.captain]}`
      : record.status === 'courting' || record.status === 'invited'
        ? `${story.negotiation} Their future remains unwritten, not promised.`
        : `${story.separation} ${story.fault}`
    : 'No captain can demand an ending to somebody else’s heart.'
  return {
    ...run,
    scene: run.scene + ' ' + text,
    log: [...run.log, 'Relationship epilogue: ' + text],
  }
}
