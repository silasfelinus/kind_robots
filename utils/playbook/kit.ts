import type { KitArt, PlaybookKitSpec } from '../playbookKit/types'
import {
  blankNode,
  storyOrder,
  type NodeKind,
  type Playbook,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for every game built on the Playbook Kit (conductor
// playbook-kit t-013). A kit spec is already a playbook: its premise opens the
// run, acts form the spine, followers, villains and figures are the cast,
// reveals are quest beats, cinematic moments are encounters and endings close
// it. A kit game is code-authored, so Studio shows it read-only; its art
// briefs become the beats' picture slots.

export const KIT_STUDIO_PREFIX = 'kit-'

function withArt(node: PlaybookNode, art: KitArt) {
  node.art = art.brief
  node.artUrl = art.src ?? null
  node.needsArt = !art.src
  if (art.prompt) node.artPrompt = art.prompt
  return node
}

const CAST_KIND: Record<string, NodeKind> = {
  follower: 'follower',
  villain: 'boss',
  figure: 'thread',
}

export function buildKitPlaybook(spec: PlaybookKitSpec): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const add = (node: PlaybookNode) => (nodes[node.key] = node)
  const factionName = (id?: string) =>
    spec.factions.find((f) => f.id === id)?.name ?? ''

  const opening = blankNode('premise', 'opening', spec.title)
  opening.place = spec.tagline
  opening.body = [spec.premise]
  add(withArt(opening, spec.keyArt))

  for (const act of spec.acts) {
    const node = blankNode(`act:${act.id}`, 'spine', act.title)
    node.place = `Act ${act.id}`
    node.chapter = act.id
    node.body = [act.blurb]
    node.provenance = 'An act is the frame for its moments and reveals.'
    add(node)
  }

  for (const member of spec.cast) {
    const node = blankNode(
      `cast:${member.id}`,
      CAST_KIND[member.role] ?? 'thread',
      member.name,
    )
    node.place = [member.tagline, factionName(member.faction)]
      .filter(Boolean)
      .join(' · ')
    node.body = [member.tagline]
    if (member.romance)
      node.variations.push(
        {
          axis: 'romance',
          key: 'arc',
          label: 'Romance arc',
          text: member.romance.arc,
        },
        ...member.romance.moments.map((text, index) => ({
          axis: 'romance',
          key: `moment-${index + 1}`,
          label: `Romance moment ${index + 1}`,
          text,
        })),
      )
    if (member.faction) node.lenses = [member.faction]
    add(withArt(node, member.portrait))
  }

  for (const reveal of spec.reveals) {
    const node = blankNode(`reveal:${reveal.id}`, 'quest', reveal.title)
    node.place = `Act ${reveal.act} reveal`
    node.chapter = reveal.act
    node.body = [reveal.teaser, reveal.text]
    node.companions = reveal.about.filter((id) =>
      spec.cast.some((c) => c.id === id),
    )
    node.provenance =
      'Reveals are text cards in the kit shell; no picture slot.'
    add(node)
  }

  for (const moment of spec.moments) {
    const node = blankNode(`moment:${moment.id}`, 'encounter', moment.title)
    node.place = `Act ${moment.act} · ${moment.kind}`
    node.chapter = moment.act
    node.body = [moment.caption]
    node.companions = moment.about.filter((id) =>
      spec.cast.some((c) => c.id === id),
    )
    add(withArt(node, moment.art))
  }

  for (const ending of spec.endings) {
    const node = blankNode(`ending:${ending.id}`, 'ending', ending.title)
    node.place = `${ending.tone} ending`
    node.body = [ending.summary, `How to reach it: ${ending.hint}`]
    node.companions = ending.about.filter((id) =>
      spec.cast.some((c) => c.id === id),
    )
    add(withArt(node, ending.art))
  }

  const routes: PlaybookRoute[] = [
    {
      id: 'acts',
      name: `${spec.title} in acts`,
      kind: 'The premise, then each act',
      steps: ['premise', ...spec.acts.map((act) => `act:${act.id}`)],
      headings: {},
    },
  ]
  const keysOf = (kind: NodeKind) =>
    Object.values(nodes)
      .filter((n) => n.kind === kind)
      .map((n) => n.key)

  return {
    game: `${KIT_STUDIO_PREFIX}${spec.id}`,
    title: spec.title,
    blurb: spec.tagline,
    routes,
    nodes,
    order: storyOrder(routes, [
      ...keysOf('follower'),
      ...keysOf('boss'),
      ...keysOf('thread'),
      ...keysOf('encounter'),
      ...keysOf('quest'),
      ...keysOf('ending'),
    ]),
    sections: [
      {
        title: 'Cast',
        blurb: 'Followers, villains and figures.',
        keys: [...keysOf('follower'), ...keysOf('boss'), ...keysOf('thread')],
      },
      {
        title: 'Moments',
        blurb: 'The scrapbook of cinematic moments.',
        keys: keysOf('encounter'),
      },
      {
        title: 'Reveals',
        blurb: 'What the player learns, act by act.',
        keys: keysOf('quest'),
      },
      {
        title: 'Endings',
        blurb: 'Every way it can end.',
        keys: keysOf('ending'),
      },
    ],
    people: spec.cast.map((c) => ({ id: c.id, label: c.name })),
    peopleLabel: 'Cast',
    variations: spec.factions.map((f) => ({ id: f.id, label: f.name })),
    variationLabel: 'Faction',
    dayLabel: 'Act',
    kindLabels: {
      opening: 'Premise',
      spine: 'Act',
      follower: 'Follower',
      boss: 'Villain',
      thread: 'Figure',
      quest: 'Reveal',
      encounter: 'Moment',
      ending: 'Ending',
    },
    editable: false,
    artProject: spec.conductorSlug,
    artLanes: ['krea2'],
    artPromptsComplete: spec.artPromptsComplete,
  }
}
