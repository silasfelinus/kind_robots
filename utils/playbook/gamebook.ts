import { BOOK, SCENE_ORDER } from '../zuzuGamebook/book'
import { platePath, sectionPlate } from '../zuzuGamebook/art'
import type { Choice, Scene } from '../zuzuGamebook/types'
import {
  blankNode,
  storyOrder,
  type NodeKind,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// The Zuzu gamebook in the Playbook Manager (conductor weird-humboldt t-036).
// A different flow from the card games: every scene names the scene each
// choice turns to, so the chain is the book itself, in reading order, split by
// chapter. Read-only here: the reader does not read overlays.

const TONES = ['hope', 'bittersweet', 'dark']

function choiceView(choice: Choice): PlaybookChoice {
  const tags: string[] = []
  if (choice.requires) tags.push(`Needs ${choice.requires}`)
  if (choice.needs) tags.push(`Needs ${choice.needs}`)
  if (choice.unless) tags.push(`Unless ${choice.unless}`)
  if (choice.needsHonor) tags.push(`Honor ${choice.needsHonor}`)
  if (choice.needsTaint) tags.push(`Taint ${choice.needsTaint}`)
  if (choice.maxTaint !== undefined) tags.push(`Taint ≤ ${choice.maxTaint}`)
  if (choice.check)
    tags.push(
      `Fails to ${BOOK[choice.check.failure]?.title ?? choice.check.failure}`,
    )
  const effect = [
    choice.gain ? `gain ${choice.gain}` : '',
    choice.spend ? `spend ${choice.spend}` : '',
    choice.flag ? `flag ${choice.flag}` : '',
    ...(choice.flags ?? []).map((f) => `flag ${f}`),
    choice.heal ? `heal ${choice.heal}` : '',
    choice.cost ? `cost ${choice.cost}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  return {
    id: choice.id,
    label: choice.label,
    check: choice.check
      ? { skill: choice.check.attribute, target: choice.check.target }
      : undefined,
    cost: choice.hint,
    tags,
    effect: effect || undefined,
    leadsTo: choice.check?.success ?? choice.to,
  }
}

function kindOf(scene: Scene): NodeKind {
  if (scene.ending) return 'ending'
  if (scene.battle) return 'boss'
  return (scene.choices?.length ?? 0) > 1 ? 'spine' : 'encounter'
}

export function buildGamebookPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const headings: Record<number, string> = {}
  SCENE_ORDER.forEach((id, index) => {
    const scene = BOOK[id]
    if (!scene) return
    const previous = BOOK[SCENE_ORDER[index - 1] ?? '']
    if (scene.chapter !== previous?.chapter) headings[index] = scene.chapter
    const node = blankNode(id, kindOf(scene), scene.title)
    node.place = scene.chapter
    node.body = scene.text.split(/\n\s*\n/)
    node.editable = true
    node.editFields = { body: true, outcomes: false }
    node.choices = (scene.choices ?? []).map(choiceView)
    if (scene.battle)
      node.choices.push(
        {
          id: 'win',
          label: `Defeat ${scene.battle.name}`,
          tags: [`HP ${scene.battle.hp}`],
          leadsTo: scene.battle.win,
        },
        {
          id: 'lose',
          label: `Fall to ${scene.battle.name}`,
          tags: [],
          leadsTo: scene.battle.lose,
        },
      )
    if (scene.ending) node.lenses = [scene.ending]
    try {
      node.artUrl = platePath(sectionPlate(scene))
    } catch {
      node.artUrl = null
    }
    node.needsArt = !node.artUrl
    node.placements.push({
      route: 'book-one',
      routeName: 'Book One',
      day: 1,
      dayName: scene.chapter,
      step: index,
    })
    nodes[id] = node
  })
  const endingKeys = SCENE_ORDER.filter((id) => BOOK[id]?.ending)
  const routes: PlaybookRoute[] = [
    {
      id: 'book-one',
      name: 'Book One: The Bell That Never Rang',
      kind: 'Scenes in reading order; choices name the scene they turn to',
      steps: [...SCENE_ORDER],
      headings,
    },
  ]
  return {
    game: 'zuzu-gamebook',
    title: 'Zuzu Gamebook',
    blurb: 'Book One as a chain of scenes with explicit turns.',
    routes,
    nodes,
    order: storyOrder(routes, []),
    sections: [
      {
        title: 'Endings',
        blurb: 'Every scene that closes the book.',
        keys: endingKeys,
      },
    ],
    people: [],
    peopleLabel: 'Written for',
    variations: TONES.map((tone) => ({
      id: tone,
      label: tone.charAt(0).toUpperCase() + tone.slice(1),
    })),
    variationLabel: 'Ending tone',
    dayLabel: 'Chapter',
    kindLabels: {
      spine: 'Scene with a choice',
      encounter: 'Scene',
      boss: 'Battle',
      ending: 'Ending',
    },
    editable: true,
    artProject: 'zuzu-gamebook',
    artLanes: ['arthemy', 'zimage', 'krea2', 'flux2'],
  }
}
