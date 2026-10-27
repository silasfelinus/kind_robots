import { ecotoneArtPrompt } from '../ecotone/artPrompts'
import { DEFAULT_ECOTONE_ART_STYLE, ecotoneArtSrc } from '../ecotone/artStyles'
import { findCard } from '../ecotone/engine'
import { EVENTS, ROUTES } from '../ecotone/story'
import {
  MYSTERIES,
  caseNumeral,
  compileMystery,
  gateTriggers,
  mysteryCardId,
  mysteryEndingArtKey,
  type Mystery,
  type MysteryMessage,
  type MysteryScene,
} from '../ecotone/mysteries'
import { playbookCardNode } from './ecotone'
import { blankNode, type PlaybookNode, type PlaybookSection } from './types'

// Ecotone's mysteries in the Playbook Manager (conductor weird-humboldt t-063):
// each case's gates, cold case, reveal, branches and Real Endings as nodes,
// chained the way play reaches them, with one Collection per case.

const MEDIUM: Record<MysteryMessage['medium'], string> = {
  text: 'Text',
  voicemail: 'Voicemail',
  note: 'Note',
  flyer: 'Flyer',
  radio: 'Radio',
  email: 'Email',
}

const TONE = { true: 'True', bittersweet: 'Bittersweet', strange: 'Strange' }

export function mysteryEndingKey(mystery: Mystery, endingId: string): string {
  return `mystery-ending:${mystery.id}:${endingId}`
}

function caseNodes(mystery: Mystery): PlaybookNode[] {
  const label = `Case ${caseNumeral(mystery.number)}`
  const gateKey = (n: number) => mysteryCardId(mystery, `G${n}` as 'G1')
  const cardNodes = compileMystery(mystery).map((compiled) => {
    const node = playbookCardNode(findCard(compiled.id) ?? compiled)
    node.kind = 'quest'
    node.place = `${label} · ${node.place}`
    return node
  })
  const byKey = new Map(cardNodes.map((node) => [node.key, node]))

  mystery.gates.forEach((gate, index) => {
    const n = index + 1
    const node = byKey.get(gateKey(n))
    if (!node) return
    node.title = `Gate ${caseNumeral(n)}: ${node.title}`
    node.variations.unshift({
      axis: 'digression',
      key: gate.message.medium,
      label: `${MEDIUM[gate.message.medium]} from ${gate.message.from}`,
      text: gate.message.lines.join('\n'),
    })
    const next = n < 3 ? gateKey(n + 1) : mysteryCardId(mystery, 'REVEAL')
    for (const choice of node.choices) {
      if (choice.id === 'decline') {
        choice.tags.push('Closes the case for the run')
        continue
      }
      choice.tags.push(`Pass or fail gate ${caseNumeral(n)}`)
      choice.leadsTo = next
      if (n === 3)
        choice.tags.push(
          'Two passes open the reveal; fewer and the trail goes cold',
        )
    }
    for (const event of EVENTS) {
      const route = ROUTES[event.id]
      const at = gateTriggers(route)[index] ?? route.length
      const step = route[Math.min(at, route.length - 1)]
      node.placements.push({
        route: event.id,
        routeName: event.name,
        day: step?.day ?? 1,
        dayName: event.days[(step?.day ?? 1) - 1] ?? `Day ${step?.day ?? 1}`,
        step: at,
      })
    }
  })

  const cold = byKey.get(mysteryCardId(mystery, 'COLD'))
  if (cold) {
    cold.title = `Cold case: ${cold.title}`
    for (const choice of cold.choices) choice.tags.push('Trail goes cold')
  }

  const finaleChoices = (key: string, scene: MysteryScene) => {
    const node = byKey.get(key)
    if (!node) return
    for (const choice of node.choices) {
      const authored = scene.choices.find((c) => c.id === choice.id)
      if (authored?.next) {
        choice.leadsTo = mysteryCardId(mystery, `B-${authored.next}`)
        choice.tags.push('Choice tree')
      }
      if (authored?.ending) {
        const ending = mystery.endings.find((e) => e.id === authored.ending)
        choice.leadsTo = mysteryEndingKey(mystery, authored.ending)
        if (ending) choice.tags.push(`Real Ending: ${ending.title}`)
      }
    }
  }
  const reveal = mysteryCardId(mystery, 'REVEAL')
  const revealNode = byKey.get(reveal)
  if (revealNode) revealNode.title = `The reveal: ${revealNode.title}`
  finaleChoices(reveal, mystery.reveal)
  for (const [key, scene] of Object.entries(mystery.branches))
    finaleChoices(mysteryCardId(mystery, `B-${key}`), scene)

  const endings = mystery.endings.map((ending) => {
    const node = blankNode(
      mysteryEndingKey(mystery, ending.id),
      'ending',
      `Real Ending: ${ending.title}`,
    )
    const art = mysteryEndingArtKey(mystery.id, ending.id)
    const url = ecotoneArtSrc(art, DEFAULT_ECOTONE_ART_STYLE)
    node.scene = mystery.reveal.scene
    node.place = `${label} · ${mystery.title}`
    node.chapter = mystery.reveal.chapter
    node.body = ending.text
    node.art = art
    node.artUrl = url
    node.needsArt = !url
    node.artPrompt = ecotoneArtPrompt(art)
    node.choices = [
      {
        id: ending.tone,
        label: `${TONE[ending.tone]} ending`,
        tags: [
          'Edit its text on the choice that reaches it',
          'Logs evidence: case closed',
        ],
      },
    ]
    node.provenance = mystery.provenance
    return node
  })
  return [...cardNodes, ...endings]
}

/** Every mystery node, and one Collection per case in case order. */
export function ecotoneMysteryNodes(): {
  nodes: PlaybookNode[]
  sections: PlaybookSection[]
} {
  const nodes: PlaybookNode[] = []
  const sections: PlaybookSection[] = []
  for (const mystery of MYSTERIES) {
    const own = caseNodes(mystery)
    nodes.push(...own)
    sections.push({
      title: `Case ${caseNumeral(mystery.number)}: ${mystery.title.replace(/^The Mystery of /, '')}`,
      blurb: `${mystery.tagline} ${mystery.region}. Three gates as digressions; two passes open the reveal and its Real Endings.`,
      keys: own.map((node) => node.key),
    })
  }
  return { nodes, sections }
}
