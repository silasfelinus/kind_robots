import {
  ECOTONE_STORYLINE_ART_PROMPTS,
  ecotoneArtPrompt,
} from '../ecotone/artPrompts'
import { cardArtKey } from '../ecotone/artSlots'
import { DEFAULT_ECOTONE_ART_STYLE, ecotoneArtSrc } from '../ecotone/artStyles'
import {
  CHAPTERS,
  COMPANIONS,
  CROSSROADS,
  ENCOUNTERS,
  ENDING_LEADS,
  LENSES,
  artUrl,
  type Effects,
  type EncounterCard,
  type Fate,
  type EndingLine,
  type LeadId,
  type LensId,
  type SceneKind,
} from '../ecotone/content'
import {
  BEATS,
  EVENTS,
  EVENT_CHOICE,
  FORK_PROMPT,
  FORK_SIZE,
  FUTURES,
  LENS_CODAS,
  ROUTES,
  SIGNATURES,
  type RouteStep,
} from '../ecotone/story'
import { ecotoneMysteryNodes } from './ecotoneMysteries'
import {
  blankNode as blank,
  signedParts,
  storyOrder,
  uniq,
  type NodeKind,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
  type PlaybookVariation,
} from './types'

// The Playbook Manager's view of Ecotone: every route as a chain of story nodes
// (the event choice, fixed spine beats, white-rabbit forks with their card
// pools, the crossroads and the finale), plus every encounter card and the
// ending storylines, each tagged with the days, companions and lens
// variations it is written for.

export type {
  NodeKind,
  Playbook,
  PlaybookChoice,
  PlaybookNode,
  PlaybookPlacement,
  PlaybookRoute,
  PlaybookVariation,
} from './types'

function lensLabel(id: LensId): string {
  return LENSES.find((lens) => lens.id === id)?.label ?? id
}

export function leadLabel(id: EndingLine): string {
  if (id === 'ecotopia') return 'The Wild Way'
  return id === 'alone'
    ? 'Alone'
    : (COMPANIONS.find((c) => c.id === id)?.name ?? id)
}

function stepKey(route: string, step: RouteStep, index: number): string {
  if (step.kind === 'beat') return step.id
  if (step.kind === 'fork') return `fork:${route}:${index}`
  if (step.kind === 'crossroads') return `crossroads:${route}`
  return `finale:${route}`
}

function stepTitle(key: string, nodes: Record<string, PlaybookNode>): string {
  const node = nodes[key]
  return node ? `${node.key} · ${node.title}` : key
}

function effectSummary(effects: Effects): string {
  const parts = signedParts({
    nerve: effects.nerve,
    goodwill: effects.goodwill,
    weird: effects.weird,
  })
  if (effects.evidence) parts.push('evidence')
  if (effects.flag) parts.push(`flag ${effects.flag}`)
  return parts.join(' · ')
}

export function playbookCardNode(card: EncounterCard): PlaybookNode {
  const variations: PlaybookVariation[] = []
  for (const [key, text] of Object.entries(card.lensLines ?? {}))
    variations.push({
      axis: 'lens',
      key,
      label: lensLabel(key as LensId),
      text,
    })
  for (const [key, text] of Object.entries(card.leadLines ?? {}))
    variations.push({
      axis: 'lead',
      key,
      label: `With ${leadLabel(key as LeadId)}`,
      text,
    })
  if (card.aloneLine)
    variations.push({
      axis: 'alone',
      key: 'alone',
      label: 'Alone',
      text: card.aloneLine,
    })
  for (const [flag, lines] of Object.entries(card.flagLines ?? {}))
    for (const [who, text] of Object.entries(lines))
      variations.push({
        axis: 'flag',
        key: `${flag}.${who}`,
        label: `After ${flag.replaceAll('_', ' ')}${who === 'all' ? '' : `, with ${leadLabel(who as LeadId)}`}`,
        text,
      })
  for (const [flag, body] of Object.entries(card.flagBody ?? {}))
    variations.push({
      axis: 'flag',
      key: flag,
      label:
        flag === 'mystery_g3_fail'
          ? 'Body if Gate III failed'
          : `Body after ${flag.replaceAll('_', ' ')}`,
      text: body.join('\n\n'),
    })
  for (const [key, text] of Object.entries(card.variants ?? {}))
    variations.push({
      axis: card.variantBy === 'lead' ? 'lead' : 'prospect',
      key,
      label: `Body for ${leadLabel(key as LeadId)}`,
      text: text.join('\n\n'),
    })
  if (card.presence) {
    const name = leadLabel(card.presence.companion)
    variations.push(
      {
        axis: 'lead',
        key: card.presence.companion,
        label: `${name} leads`,
        text: card.presence.lead,
      },
      {
        axis: 'prospect',
        key: card.presence.companion,
        label: `${name} met`,
        text: card.presence.met,
      },
      {
        axis: 'prospect',
        key: card.presence.companion,
        label: `${name} not met yet`,
        text: card.presence.unmet,
      },
    )
  }
  const choices: PlaybookChoice[] = card.choices.map((choice) => {
    const tags: string[] = []
    if (choice.lens) tags.push(`Lens: ${lensLabel(choice.lens)}`)
    if (choice.prospect) tags.push(`Leads to ${leadLabel(choice.prospect)}`)
    if (choice.meet === true) tags.push('Travel together')
    if (choice.meet === false) tags.push('Go alone')
    if (choice.locked) tags.push(choice.locked)
    if (choice.wild) tags.push('Animal-first')
    return {
      id: choice.id,
      label: choice.label,
      check: choice.check,
      cost: choice.cost,
      locked: choice.locked,
      tags,
      success: { text: choice.success.text },
      failure: choice.failure ? { text: choice.failure.text } : undefined,
      effect: effectSummary(choice.success.effects) || undefined,
    }
  })
  const companions = uniq<LeadId>([
    ...(Object.keys(card.variants ?? {}) as LeadId[]),
    ...(Object.keys(card.leadLines ?? {}) as LeadId[]),
    ...(card.presence ? [card.presence.companion] : []),
    ...card.choices.flatMap((c) => (c.prospect ? [c.prospect] : [])),
    ...(card.aloneLine ? ['alone' as const] : []),
    ...(card.choices.some((c) => c.meet === false) ? ['alone' as const] : []),
  ])
  const lenses = uniq<LensId>([
    ...(Object.keys(card.lensLines ?? {}) as LensId[]),
    ...card.choices.flatMap((c) => (c.lens ? [c.lens] : [])),
  ])
  const own = cardArtKey(card.id)
  const ownUrl = ecotoneArtSrc(own, DEFAULT_ECOTONE_ART_STYLE)
  const url = ownUrl ?? artUrl(card.art)
  return {
    key: card.id,
    kind: card.kind === 'spine' ? 'spine' : 'encounter',
    title: card.title,
    place: card.place,
    placements: [],
    chapter: card.chapter,
    companions,
    lenses,
    body: card.body,
    variations,
    choices,
    pool: [],
    scene: card.scene,
    art: ownUrl ? own : url ? (card.art ?? null) : null,
    artUrl: url,
    needsArt: !url,
    artPrompt: ecotoneArtPrompt(own),
    provenance: card.provenance,
    editable: true,
  }
}

function blankNode(
  key: string,
  kind: NodeKind,
  title: string,
  scene: SceneKind,
): PlaybookNode {
  return { ...blank(key, kind, title), scene }
}

function endingNode(lead: EndingLine): PlaybookNode {
  const node = blankNode(
    `ending:${lead}`,
    'ending',
    `${leadLabel(lead)}: the Humboldt of your future`,
    'dunes',
  )
  node.companions = [lead]
  node.place = 'The finale'
  node.body = FUTURES[lead].hope
  node.needsArt = true
  node.artPrompt = ECOTONE_STORYLINE_ART_PROMPTS[lead]
  node.variations.push({
    axis: 'fate',
    key: 'dark',
    label: 'Dark future',
    text: FUTURES[lead].dark.join('\n\n'),
  })
  const lenses = LENSES.filter((lens) => lens.open).map((lens) => lens.id)
  node.lenses = lenses
  // Every lead × lens × fate ending is painted as endings/<lead>-<lens>-<fate>;
  // the storyline shows the first one that has art in the default style.
  const painted = lenses
    .flatMap((lens) =>
      (['hope', 'dark'] as Fate[]).map(
        (fate) => `endings/${lead}-${lens}-${fate}`,
      ),
    )
    .find((asset) => ecotoneArtSrc(asset, DEFAULT_ECOTONE_ART_STYLE))
  if (painted) {
    node.art = painted
    node.artUrl = ecotoneArtSrc(painted, DEFAULT_ECOTONE_ART_STYLE)
    node.needsArt = false
  }
  for (const lens of lenses) {
    for (const fate of ['hope', 'dark'] as Fate[]) {
      const signature = SIGNATURES[`${lead}.${lens}`]?.[fate]
      if (!signature) continue
      node.choices.push({
        id: `${lens}.${fate}`,
        label: signature.title,
        tags: [lensLabel(lens), fate === 'hope' ? 'Hopeful' : 'Dark'],
        success: { text: signature.line },
      })
    }
    const coda = LENS_CODAS[lens]
    if (coda)
      node.variations.push({
        axis: 'lens',
        key: lens,
        label: `${lensLabel(lens)} coda`,
        text: coda,
      })
  }
  node.provenance = `Ending IDs ${lead}.<lens>.hope|dark. Signature titles for the companions come from conductor weird-humboldt ECOTONE-32-ENDINGS.md.`
  return node
}

export function buildEcotonePlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  for (const card of [...BEATS, ...ENCOUNTERS])
    nodes[card.id] = playbookCardNode(card)

  const opening = blankNode(
    'event',
    'opening',
    EVENT_CHOICE.title,
    EVENT_CHOICE.scene,
  )
  opening.place = EVENT_CHOICE.place
  opening.body = EVENT_CHOICE.body
  opening.art = EVENT_CHOICE.art
  opening.artUrl = artUrl(EVENT_CHOICE.art)
  opening.companions = COMPANIONS.map((c) => c.id)
  opening.provenance = EVENTS.map((e) => e.provenance).join(' ')
  opening.choices = EVENTS.map((event) => {
    const first = ROUTES[event.id][0]
    return {
      id: event.id,
      label: event.name,
      tags: [
        `${event.days.length} days`,
        `Meets ${event.companions.map(leadLabel).join(' or ')}`,
        `Offers ${event.lenses.map(lensLabel).join(', ')}`,
      ],
      success: { text: event.pick },
      leadsTo: first ? stepKey(event.id, first, 0) : undefined,
    }
  })
  nodes.event = opening

  for (const event of EVENTS) {
    const route = ROUTES[event.id]
    route.forEach((step, index) => {
      const key = stepKey(event.id, step, index)
      if (step.kind === 'fork') {
        const node = blankNode(key, 'fork', step.title, step.scene)
        const pool = ENCOUNTERS.filter((c) => step.pools.includes(c.chapter))
        node.pool = pool.map((c) => c.id)
        node.chapter = step.pools[0] ?? null
        node.place = step.pools
          .map((n) => CHAPTERS.find((c) => c.number === n)?.name ?? `Ch ${n}`)
          .join(' · ')
        node.body = [
          FORK_PROMPT,
          `Deals up to ${FORK_SIZE} face-up cards from ${pool.length} in the pool, never one already played this run.`,
        ]
        node.choices = pool.map((card) => ({
          id: card.id,
          label: card.title,
          tags: [`Ch ${card.chapter}`, card.place],
          leadsTo: card.id,
        }))
        nodes[key] = node
      }
      if (step.kind === 'crossroads') {
        const node = blankNode(key, 'crossroads', 'Crossroads', 'bay')
        node.place = 'Whoever you haven’t met yet'
        node.body = [
          'Another companion crosses your path, chosen by the run’s seed from the ones you haven’t met. Stay with your guide (or keep going alone), or follow the newcomer.',
        ]
        node.companions = COMPANIONS.map((c) => c.id)
        node.variations = COMPANIONS.map((c) => ({
          axis: 'lead' as const,
          key: c.id,
          label: `${c.name} arrives`,
          text: CROSSROADS[c.id].join('\n\n'),
        }))
        node.choices = [
          {
            id: 'stay',
            label: 'Stay with your guide, or keep going alone',
            tags: ['Newcomer goes their own way'],
          },
          {
            id: 'follow',
            label: 'Follow the newcomer',
            tags: ['Changes your guide'],
          },
        ]
        node.provenance = 'Invented characters.'
        nodes[key] = node
      }
      if (step.kind === 'finale') {
        const node = blankNode(
          key,
          'ending',
          'The Humboldt of Your Future',
          'dunes',
        )
        node.place = event.name
        node.body = [
          `Hopeful if goodwill + evidence + a nerve modifier reaches ${event.futureTarget}; dark otherwise. The ending is who you finish with (or nobody) × the lens you opened with × that fate.`,
          ...(event.wildTarget
            ? [
                `Finish alone on this route and it is the Wild Way instead: ${event.wildTarget} or more animal-first choices earns the ecological paradise; fewer, the hermit's bittersweet retirement.`,
              ]
            : []),
        ]
        node.companions = [...ENDING_LEADS]
        node.choices = ENDING_LEADS.map((lead) => ({
          id: lead,
          label: leadLabel(lead),
          tags: ['Ending storyline'],
          leadsTo: `ending:${lead}`,
        }))
        nodes[key] = node
      }
      const node = nodes[key]
      if (node)
        node.placements.push({
          route: event.id,
          routeName: event.name,
          day: step.day,
          dayName: event.days[step.day - 1] ?? `Day ${step.day}`,
          step: index,
        })
      if (step.kind === 'fork')
        for (const id of nodes[key]?.pool ?? [])
          nodes[id]?.placements.push({
            route: event.id,
            routeName: event.name,
            day: step.day,
            dayName: event.days[step.day - 1] ?? `Day ${step.day}`,
            step: index,
          })
    })
    // Spine choices lead to the next step on the route.
    route.forEach((step, index) => {
      const node = nodes[stepKey(event.id, step, index)]
      const next = route[index + 1]
      if (!node || !next || step.kind !== 'beat') return
      const nextKey = stepKey(event.id, next, index + 1)
      for (const choice of node.choices) choice.leadsTo ??= nextKey
    })
  }
  for (const lead of ENDING_LEADS) nodes[`ending:${lead}`] = endingNode(lead)
  const mysteries = ecotoneMysteryNodes()
  for (const node of mysteries.nodes) nodes[node.key] = node

  const routes: PlaybookRoute[] = EVENTS.map((event) => {
    const steps = ROUTES[event.id]
    const headings: Record<number, string> = { 0: 'Before it begins' }
    steps.forEach((step, i) => {
      if (step.day !== steps[i - 1]?.day)
        headings[i + 1] = `Day ${step.day} · ${event.days[step.day - 1] ?? ''}`
    })
    return {
      id: event.id,
      name: event.name,
      kind: event.kind,
      steps: ['event', ...steps.map((s, i) => stepKey(event.id, s, i))],
      headings,
    }
  })
  const endingKeys = ENDING_LEADS.map((lead) => `ending:${lead}`)
  return {
    game: 'ecotone',
    title: 'Ecotone',
    blurb:
      'Weird Humboldt: three routes, four companions, the endings and twelve local mysteries.',
    routes,
    nodes,
    order: storyOrder(routes, [
      ...ENCOUNTERS.map((c) => c.id),
      ...endingKeys,
      ...mysteries.nodes.map((node) => node.key),
    ]),
    sections: [
      {
        title: 'Ending storylines',
        blurb:
          'Who you finish with (or nobody, or the Wild Way) × opening lens × hopeful or dark.',
        keys: endingKeys,
      },
      ...mysteries.sections,
    ],
    people: ENDING_LEADS.map((id) => ({ id, label: leadLabel(id) })),
    peopleLabel: 'Written for',
    variations: LENSES.map((lens) => ({ id: lens.id, label: lens.short })),
    variationLabel: 'Has a variation for',
    dayLabel: 'Day',
    kindLabels: {
      fork: 'White rabbit',
      encounter: 'Random encounter',
      spine: 'Story spine',
      ending: 'Ending storyline',
      quest: 'Mystery',
    },
    editable: true,
    artProject: 'weird-humboldt',
    artLanes: ['zimage', 'krea2', 'arthemy', 'novacomic'],
    artNegative: 'anthro, furry',
    artStyle:
      'north coast california, coastal fog, redwood greens, teal and amber light',
    artPromptsComplete: true,
  }
}

export function describeLeadsTo(
  playbook: Playbook,
  key: string | undefined,
): string {
  return key ? stepTitle(key, playbook.nodes) : ''
}
