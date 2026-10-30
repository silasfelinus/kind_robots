// Picnic Panic: the City Plaza one-shot. Civilians are board markers the
// squad evacuates (1 AP from an adjacent tile) while Foreman Thumpkin's
// Warren Wreckers surface beside them. Scenes are pure functions of the
// battle's fired-trigger history, so saves replay them exactly once.
import type { StoryLine } from './firstBellStory'
import { aliasFor, recordTrigger, type TrainingState } from './training'

export type OneShotScene = {
  id: string
  kicker: string
  title: string
  lines: StoryLine[]
}

/** Scene triggers in the order they can appear. */
export const PICNIC_TRIGGERS = [
  'picnic:opening',
  'picnic:first-emergence',
  'picnic:civilian-lost',
  'picnic:all-rescued',
  'picnic:victory',
  'picnic:defeat',
] as const
export const PICNIC_KNOWN_TRIGGERS: readonly string[] = [
  ...PICNIC_TRIGGERS,
  ...PICNIC_TRIGGERS.map((id) => 'seen:' + id),
]

const line = (speaker: string, text: string): StoryLine => ({ speaker, text })

export function picnicCounts(state: TrainingState) {
  const civilians = state.civilians ?? []
  return {
    rescued: civilians.filter((c) => c.status === 'rescued').length,
    lost: civilians.filter((c) => c.status === 'lost').length,
    waiting: civilians.filter((c) => c.status === 'waiting').length,
    total: civilians.length,
  }
}

function sceneFor(state: TrainingState, id: string): OneShotScene {
  const lead = state.units.find((u) => u.team === 'squad')
  const leadName = lead ? aliasFor(lead).toUpperCase() : 'SQUAD LEAD'
  const { rescued, lost, total } = picnicCounts(state)
  if (id === 'picnic:opening')
    return {
      id,
      kicker: 'ONE-SHOT · CITY PLAZA · NOON',
      title: 'Picnic Panic',
      lines: [
        line(
          'NARRATOR',
          'Checkered blankets cover the plaza lawn. A brass band is tuning up, and someone has brought a lemonade cooler the size of a footlocker.',
        ),
        line(
          'FOREMAN THUMPKIN',
          'Attention, picnickers! This lawn sits on a Cornerstone tunnel right-of-way. Please vacate in an orderly hop.',
        ),
        line(
          leadName,
          'Families first. Walk them clear before those hard hats come up through the grass. Then we deal with the bunnies.',
        ),
      ],
    }
  if (id === 'picnic:first-emergence')
    return {
      id,
      kicker: 'TRIGGERED · THE LAWN ERUPTS',
      title: 'Dust and Diamond Teeth',
      lines: [
        line(
          'NARRATOR',
          'The turf bulges, splits and spits out a Warren Wrecker, chalk map in one paw and a wrench in the other.',
        ),
        line(
          'WARREN WRECKER',
          'Survey says this blanket is load-bearing. Nothing personal, folks.',
        ),
        line(
          leadName,
          'Watch the dust rings. Wherever one opens next to a family, they get pulled under.',
        ),
      ],
    }
  if (id === 'picnic:civilian-lost')
    return {
      id,
      kicker: 'TRIGGERED · SOMEONE WENT UNDER',
      title: 'A Blanket Folds Into the Ground',
      lines: [
        line(
          'NARRATOR',
          'A family and their picnic basket slide into a fresh tunnel. Their muffled shouting heads somewhere underneath the fountain.',
        ),
        line(
          'FOREMAN THUMPKIN',
          'Relax! The union contract guarantees every relocated guest a hard hat and a juice box.',
        ),
        line(
          leadName,
          'That is not a rescue plan. Get the rest of them out, now.',
        ),
      ],
    }
  if (id === 'picnic:all-rescued')
    return {
      id,
      kicker: 'TRIGGERED · LAWN CLEAR',
      title: 'Everyone Behind the Bandstand',
      lines: [
        line(
          'NARRATOR',
          'The last family reaches the bandstand. The tuba player hands out lemonade like battlefield rations.',
        ),
        line(
          leadName,
          'Nobody else is standing on a tunnel. Now the bunnies have to come to us.',
        ),
      ],
    }
  const won = id === 'picnic:victory'
  return {
    id,
    kicker: won ? 'FINALE · PLAZA SECURED' : 'FINALE · THE PICNIC IS LOST',
    title: won ? 'Leftovers for Everyone' : 'Tunnels Under Every Blanket',
    lines: [
      line(
        'NARRATOR',
        won
          ? 'The last hard hat rolls to a stop on the grass. Foreman Thumpkin files a grievance against gravity.'
          : 'The plaza lawn sags into a maze of fresh tunnels. Somewhere below, the brass band is still playing.',
      ),
      line(
        'FIELD REPORT',
        rescued +
          ' of ' +
          total +
          ' families evacuated' +
          (lost ? ', ' + lost + ' pulled into the tunnels' : ', none lost') +
          '. Round ' +
          state.turn +
          '.',
      ),
      line(
        won ? 'FOREMAN THUMPKIN' : leadName,
        won
          ? lost
            ? 'Fine. The relocated guests will be returned, with souvenir hard hats.'
            : 'Not one blanket relocated. The union will want to know how you did that.'
          : 'We come back tomorrow with shovels, and we bring everyone home.',
      ),
    ],
  }
}

/** The next unseen scene, or null. Finales appear once the battle ends. */
export function pendingPicnicScene(state: TrainingState): OneShotScene | null {
  if (!state.civilians || !state.fired?.includes('picnic:opening')) return null
  const fired = state.fired
  const finale =
    state.phase === 'victory'
      ? 'picnic:victory'
      : state.phase === 'defeat'
        ? 'picnic:defeat'
        : null
  const next = PICNIC_TRIGGERS.find(
    (id) =>
      !fired.includes('seen:' + id) && (fired.includes(id) || id === finale),
  )
  return next ? sceneFor(state, next) : null
}

/** Records that the player has watched a scene (and that a finale fired). */
export function dismissPicnicScene(state: TrainingState, id: string): boolean {
  if (pendingPicnicScene(state)?.id !== id) return false
  recordTrigger(state, id)
  recordTrigger(state, 'seen:' + id)
  return true
}
