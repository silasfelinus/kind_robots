import {
  DEPARTMENTS,
  ENDINGS,
  stationArt,
  type Choice,
  type Encounter,
  type Outcome,
  type Pack,
} from '../shiftingDesks/rules'
import {
  blankNode,
  humanize,
  signedParts,
  storyOrder,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Shifting Desks in the Playbook Manager (conductor weird-humboldt t-036). Each
// department deals one weighted file per location, then any window-shift
// applicants, then its boss; the boss's department outcome picks the ending.
// Read-only here: the game does not read overlays.

const POLARITIES = ['good', 'bad', 'mixed']

function outcomeSummary(outcome: Outcome | null): string {
  if (!outcome) return ''
  const parts = signedParts({ ...outcome.effects, ...(outcome.grades ?? {}) })
  for (const flag of outcome.add_flags) parts.push(`+ ${flag}`)
  for (const flag of outcome.remove_flags) parts.push(`− ${flag}`)
  if (outcome.department_outcome)
    parts.push(`outcome ${outcome.department_outcome}`)
  return parts.join(' · ')
}

function choiceView(choice: Choice): PlaybookChoice {
  const requires = choice.requires
  return {
    id: choice.id,
    label: choice.label,
    check: choice.roll
      ? { skill: choice.roll.skill, target: choice.roll.target }
      : undefined,
    cost:
      signedParts(
        Object.fromEntries(
          Object.entries(choice.cost).map(([k, v]) => [k, v ? -v : 0]),
        ),
      ).join(' · ') || undefined,
    tags: [
      choice.intent,
      choice.risk_hint,
      ...(requires?.flag ? [`Needs ${requires.flag}`] : []),
      ...(requires?.clearance ? [`Clearance ${requires.clearance}`] : []),
      ...(requires?.forms ? [`${requires.forms} forms`] : []),
      ...Object.entries(requires?.grade ?? {}).map(
        ([grade, n]) => `${humanize(grade)} ${n}`,
      ),
    ].filter(Boolean),
    success: { text: choice.success.text },
    failure: choice.failure ? { text: choice.failure.text } : undefined,
    effect: outcomeSummary(choice.success) || undefined,
  }
}

function encounterNode(card: Encounter, dept: Pack): PlaybookNode {
  const node = blankNode(card.id, 'encounter', card.title)
  const location = dept.locations.find(
    (l) => l.location_id === card.location_id,
  )
  node.place = `${location?.title ?? card.location_id}, ${dept.department.title}`
  node.chapter = dept.department.order
  node.body = [card.flavor_text]
  node.editable = true
  node.editFields = { body: true, outcomes: true }
  node.choices = card.choices.map(choiceView)
  node.lenses = [card.polarity]
  node.artUrl = stationArt('cards', card.id, dept.department.id)
  node.provenance = `Tags: ${card.tags.join(', ') || 'none'} · weight ${card.weight}. Art prompt: ${card.art_prompt}`
  return node
}

export function buildShiftingDesksPlaybook(): Playbook {
  const departments = [...DEPARTMENTS].sort(
    (a, b) => a.department.order - b.department.order,
  )
  const nodes: Record<string, PlaybookNode> = {}
  const steps: string[] = []
  const headings: Record<number, string> = {}

  for (const dept of departments) {
    const { id, title, order } = dept.department
    const placement = () => ({
      route: 'tower',
      routeName: 'The Tower',
      day: order,
      dayName: title,
      step: steps.length,
    })
    headings[steps.length] = `Level ${order} · ${title}`
    for (const location of dept.locations) {
      const key = `loc:${id}:${location.location_id}`
      const node = blankNode(key, 'fork', location.title)
      node.place = title
      node.chapter = order
      node.body = [
        location.description,
        `Deals one weighted file from these ${location.encounter_ids.length} when the department opens.`,
      ]
      node.pool = location.encounter_ids
      node.artUrl = stationArt('locations', location.location_id)
      node.placements.push(placement())
      for (const cardId of location.encounter_ids) {
        const card = dept.encounters.find((e) => e.id === cardId)
        if (!card) continue
        nodes[cardId] ??= encounterNode(card, dept)
        nodes[cardId]!.placements.push(placement())
      }
      node.choices = location.encounter_ids.map((cardId) => ({
        id: cardId,
        label: nodes[cardId]?.title ?? cardId,
        tags: [humanize(nodes[cardId]?.lenses[0] ?? '')].filter(Boolean),
        leadsTo: cardId,
      }))
      nodes[key] = node
      steps.push(key)
    }
    const shift = dept.window_shift
    if (shift) {
      const key = `window:${id}`
      const node = blankNode(key, 'spine', shift.title)
      node.place = `${shift.memo.title}, ${title}`
      node.chapter = order
      node.body = [
        shift.flavor_text,
        ...shift.memo.rules.map((rule) => `Rule: ${rule.text}`),
      ]
      node.artUrl = stationArt('window', shift.id)
      node.placements.push(placement())
      node.choices = shift.applicants.map((applicant) => {
        const appKey = `applicant:${applicant.id}`
        const appNode = blankNode(appKey, 'encounter', applicant.name)
        appNode.place = `${shift.title}, ${title}`
        appNode.chapter = order
        appNode.body = [applicant.request, applicant.plea]
        appNode.variations = applicant.documents.map((doc) => ({
          axis: 'document',
          key: doc.label,
          label: doc.label,
          text: `${doc.value}${doc.breaks ? ` (breaks ${doc.breaks})` : ''}`,
        }))
        appNode.editable = true
        appNode.editFields = { body: true, outcomes: true }
        appNode.choices = applicant.choices.map(choiceView)
        appNode.artUrl = stationArt('window', applicant.id)
        appNode.placements.push(placement())
        nodes[appKey] = appNode
        return {
          id: applicant.id,
          label: applicant.name,
          tags: [applicant.request],
          leadsTo: appKey,
        }
      })
      nodes[key] = node
      steps.push(key)
    }
    const boss = dept.boss
    const bossKey = `boss:${id}`
    const bossNode = blankNode(bossKey, 'boss', boss.title)
    bossNode.place = title
    bossNode.chapter = order
    bossNode.body = [boss.flavor_text]
    bossNode.editable = true
    bossNode.editFields = { body: true, outcomes: true }
    bossNode.choices = boss.choices.map(choiceView)
    bossNode.variations = boss.department_outcomes.map((outcome) => ({
      axis: 'outcome',
      key: outcome.id,
      label: outcome.title,
      text: outcome.summary,
    }))
    bossNode.artUrl = stationArt('departments', id)
    bossNode.placements.push(placement())
    nodes[bossKey] = bossNode
    steps.push(bossKey)
  }

  const endingKeys = ENDINGS.map((ending) => `ending:${ending.id}`)
  for (const ending of ENDINGS) {
    const node = blankNode(`ending:${ending.id}`, 'ending', ending.title)
    node.place = humanize(ending.kind)
    node.body = [ending.epilogue.title, ending.epilogue.text]
    node.variations = ending.variants.map((variant) => ({
      axis: 'flag',
      key: variant.when_flag,
      label: `With ${variant.when_flag}`,
      text: variant.text,
    }))
    node.provenance = `Triggered by ${
      Object.entries(ending.trigger)
        .map(([k, v]) => `${k} ${v}`)
        .join(', ') || 'the run'
    }.`
    node.artUrl = stationArt('endings', ending.id)
    nodes[node.key] = node
  }

  const routes: PlaybookRoute[] = [
    {
      id: 'tower',
      name: 'The Tower',
      kind: 'Five departments, deepest last',
      steps,
      headings,
    },
  ]
  return {
    game: 'shifting-desks',
    title: 'Shifting Desks',
    blurb: 'Five departments of dealt files, window shifts and bosses.',
    routes,
    nodes,
    order: storyOrder(routes, [
      ...departments.flatMap((d) => d.encounters.map((e) => e.id)),
      ...endingKeys,
    ]),
    sections: [
      {
        title: 'Endings',
        blurb: 'Every way a run can end, with flag-keyed closing lines.',
        keys: endingKeys,
      },
    ],
    people: [],
    peopleLabel: 'Written for',
    variations: POLARITIES.map((p) => ({ id: p, label: humanize(p) })),
    variationLabel: 'Polarity',
    dayLabel: 'Level',
    kindLabels: {
      fork: 'Desk draw',
      encounter: 'File',
      spine: 'Window shift',
      boss: 'Boss',
      ending: 'Ending',
    },
    editable: true,
    artProject: 'shifting-desks',
    artLanes: ['zimage', 'krea2', 'flux2', 'arthemy'],
  }
}
