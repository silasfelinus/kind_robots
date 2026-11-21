import type { SignaturePowerId } from './specialPowers'
import type { PatrolChoice, PatrolMemory, PatrolZoneId } from './nightPatrols'
import { henchmanForVillain } from './villainHenchmen'

type CrewPatrolRun = {
  day: number
  opponentSignature?: SignaturePowerId | null
  patrolHistory?: readonly PatrolMemory[]
}

/** A single earned encounter with the known rival's canonical one-hit crew.
 * Authored story windows take precedence; old rotating patrols stay valid. */
export function patrolCrewFor(run: CrewPatrolRun, zone: PatrolZoneId) {
  const rival = run.opponentSignature
  if (
    !rival ||
    run.day < 15 ||
    run.day > 29 ||
    run.day % 4 !== 1 ||
    run.patrolHistory?.some((memory) => memory.choiceId.startsWith('crew-'))
  )
    return null

  const crew = henchmanForVillain(rival)
  const crewId = `crew-${rival}`
  const scene =
    `A squad of ${crew.name} blocks your path through the ${zone} district. ` +
    `${crew.captain} directs the one-hit recruits, telegraphing ${crew.move} ` +
    `Their orders are tied to ${crew.story} There is time to stop them, ` +
    'but you must decide what happens to the people under those orders.'
  const choices: readonly PatrolChoice[] = [
    {
      id: `${crewId}-counter-investigate`,
      label: `Read the warning and counter ${crew.name}`,
      result:
        `You watch ${crew.captain} signal their attack and exploit the tell: ` +
        `${crew.counter} The one-hit ${crew.name} retreat before any bystander ` +
        'is hurt. Your evidence makes the rival network easier to expose, ' +
        'though the captain now knows you have learned their trick.',
      influence: 1,
      danger: 1,
      standing: 1,
    },
    {
      id: `${crewId}-mercy-intervene`,
      label: `Offer ${crew.captain} and the recruits a way out`,
      result:
        `You refuse to use a finishing blow on ${crew.captain}'s ${crew.name}. ` +
        `You ask who benefits from ${crew.story} The captain lowers their ` +
        'hand. The squad clears a passage for civilians and walks away ' +
        'without a casualty, though their employer still controls the district.',
      influence: 0,
      danger: -1,
      standing: 2,
    },
    {
      id: `${crewId}-command-exploit`,
      label: `Threaten to turn ${crew.captain}'s crew against their boss`,
      result:
        `You demonstrate ${crew.counter} ${crew.captain} sees how easily ` +
        `the ${crew.name} could be defeated and obeys your ultimatum. ` +
        'You gain leverage and a frightened squad for the night. The ' +
        'witnesses remember you used people as bargaining chips.',
      influence: 2,
      danger: 2,
      standing: -2,
    },
  ]
  return { rival, crew, title: `${crew.name} on Patrol`, scene, choices }
}

/** Prevent a retroactively edited scrapbook from revealing an unearned crew. */
export function witnessedPatrolCrew(
  run: CrewPatrolRun,
  zone: PatrolZoneId,
  choiceId: string,
) {
  if (!choiceId.startsWith('crew-')) return null
  const encounter = patrolCrewFor(
    {
      day: run.day,
      opponentSignature: run.opponentSignature,
      patrolHistory: [],
    },
    zone,
  )
  const choice = encounter?.choices.find((entry) => entry.id === choiceId)
  return encounter && choice ? { ...encounter, choice } : null
}

/** One-night-later consequences of the player's crew choice, read from the
 * existing patrol history so old save formats remain untouched. */
export function crewPatrolAftermath(run: CrewPatrolRun): string | null {
  const previous = run.patrolHistory?.at(-1)
  if (!previous || run.day !== previous.day + 1) return null
  const witnessed = witnessedPatrolCrew(
    {
      day: previous.day,
      opponentSignature: run.opponentSignature,
    },
    previous.zone,
    previous.choiceId,
  )
  if (!witnessed) return null
  const { crew, choice } = witnessed
  if (choice.id.endsWith('-counter-investigate'))
    return `Last night's evidence reached the neighborhood before the sirens. ${crew.captain} is hiding the ${crew.name}'s warning signal, but residents are repeating your counter: ${crew.counter} The district knows how to protect itself now.`
  if (choice.id.endsWith('-mercy-intervene'))
    return `The ${crew.name} you spared are quietly clearing safe passages for families. ${crew.captain} has not joined you, but a civilian brings a message: the crew remembers who offered them a choice instead of a beating.`
  return `Your threat worked too well. ${crew.captain}'s ${crew.name} stand down when you pass, but shopkeepers shutter their windows first. People are no longer sure whose patrol they should fear.`
}

/** The captain a player actually confronted can change later mission odds.
 * Mercy creates rescue routes, an exposed signal aids investigations, and
 * coercion helps villainous orders but frightens would-be rescuers.
 * Everything is derived from witnessed patrol history: no new save key. */
export function crewPatrolNetwork(
  run: CrewPatrolRun,
  allegiance: string,
): { modifier: number; report: string } | null {
  for (const memory of run.patrolHistory ?? []) {
    if (memory.day >= run.day) continue
    const witnessed = witnessedPatrolCrew(
      { day: memory.day, opponentSignature: run.opponentSignature },
      memory.zone,
      memory.choiceId,
    )
    if (!witnessed) continue
    const { crew, choice } = witnessed
    if (choice.id.endsWith('-counter-investigate')) {
      if (allegiance === 'villain') return null
      return {
        modifier: 1,
        report:
          `CREW COUNTER (+1): ${crew.captain}'s warning was decoded. ` +
          `${crew.counter} The ${crew.name} cannot surprise this dispatch.`,
      }
    }
    if (choice.id.endsWith('-mercy-intervene')) {
      if (allegiance === 'villain') return null
      const modifier = allegiance === 'rogue' ? 1 : 2
      return {
        modifier,
        report:
          `CREW MERCY (+${modifier}): ${crew.captain} and the ${crew.name} ` +
          'honor your offer of safe passage and help civilians reach cover.',
      }
    }
    if (choice.id.endsWith('-command-exploit')) {
      const modifier = allegiance === 'villain' ? 2 : -1
      return {
        modifier,
        report:
          `CREW COERCION (${modifier > 0 ? '+' : ''}${modifier}): ` +
          `${crew.captain}'s ${crew.name} obey the threat you made. ` +
          (modifier > 0
            ? "Their forced support clears the way for tonight's order."
            : 'Residents hide from the patrol instead of helping the rescue.'),
      }
    }
  }
  return null
}
