import { promArt } from '../cometAcademy/artManifest'
import { promArtPrompt } from '../cometAcademy/artPrompts'
import {
  FINALE_ART_KEY,
  GUEST_LIST_ARRIVAL_ART_KEY,
  GUEST_LIST_ART_KEYS,
  PROM_ENDINGS,
  SPLASH_ART_KEY,
  districtArtKey,
  encounterArtKey,
  endingArtKey,
  incidentArtKey,
  slugify,
  identityArtKey,
  identityKey,
  studentArtKey,
  villainArtKey,
} from '../cometAcademy/artSlots'
import {
  CAMPAIGN_ANCHORS,
  CAMPAIGN_VILLAINS,
  GUEST_LIST_EVENT,
  PROM_FINALE,
} from '../cometAcademy/campaign'
import { CITY_SITES } from '../cometAcademy/cityMap'
import { DISTRICT_ENCOUNTERS } from '../cometAcademy/districtEncounters'
import { CHARACTER_ROSTER } from '../cometAcademy/identityArcs'
import { REAL_NIGHT_CASES } from '../cometAcademy/nightCases'
import { ENCOUNTERS, INCIDENTS, POWERS, STUDENTS } from '../cometAcademy/rules'
import { POWER_VOWS } from '../cometAcademy/specialPowers'
import {
  blankNode,
  signedParts,
  storyOrder,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for Capes & Tassels: Prom of Doom (conductor
// playbook-kit t-013): the thirty-day runtime as beats. Enrolment opens the run;
// six students are the followers; thirty daily anchors, the Guest List and the
// Prom of Doom form the spine; patrol incidents, campus encounters and district
// scenes are encounters and crossroads; four masterminds are the bosses and ten
// endings close it. Art slots are the keys the play page shows
// (cometAcademy/artSlots.ts); text is authored in code, so beats are read-only.

const titleCase = (text: string) =>
  text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

function withArt(node: PlaybookNode, key: string): PlaybookNode {
  node.art = key
  node.artUrl = promArt(key)
  node.needsArt = !node.artUrl
  if (node.needsArt) node.artPrompt = promArtPrompt(key)
  node.provenance = `Art slot public/comet-city-academy/${key}.webp (conductor projects/comet-city-academy/art).`
  return node
}

type Option = {
  id: string
  label: string
  text: string
  influence: number
  danger: number
  trust?: number
}

const optionChoices = (options: readonly Option[]): PlaybookChoice[] =>
  options.map((option) => ({
    id: option.id,
    label: option.label,
    tags: [],
    effect:
      signedParts({
        influence: option.influence,
        danger: option.danger,
        trust: option.trust,
      }).join(' · ') || undefined,
    success: { text: option.text },
  }))

const powerName = (id: string) => POWERS.find((p) => p.id === id)?.name ?? id

export function buildPromOfDoomPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const add = (node: PlaybookNode) => (nodes[node.key] = node)

  const enrol = blankNode('enrol', 'opening', 'Enrolment: choose your power')
  enrol.place = 'Comet City Academy'
  enrol.body = [
    'Your final month begins with a very strange first week. Choose an origin, an affinity and a vow; together they make your signature power and foreshadow your Prom of Doom.',
  ]
  enrol.choices = POWER_VOWS.map((vow) => ({
    id: vow.id,
    label: `Vow: ${vow.name}`,
    tags: [],
    success: { text: vow.promise },
    leadsTo: 'day:01',
  }))
  add(withArt(enrol, SPLASH_ART_KEY))

  // The cast is the identity roster, not the week-one dispatch team: 48
  // origin x affinity people plus two visiting guests. The player becomes one;
  // each run seeds the rest into the training roster, friends, possible
  // romances, a partner or sidekick, hero upgrades and enemies
  // (conductor comet-city-academy IDENTITY-SYSTEM.md, t-016).
  for (const person of CHARACTER_ROSTER) {
    const node = blankNode(
      identityKey(person.signature),
      'follower',
      person.realName,
    )
    node.place = `${person.student.alias} · ${person.hero.alias} · ${person.villain.alias}`
    node.body = [
      person.backstory,
      `Hero turn: ${person.heroDecision}`,
      `Villain turn: ${person.villainDecision}`,
    ]
    node.lenses = ['id' in person ? 'guest' : person.signature]
    node.artVariants = (['student', 'hero', 'villain'] as const).map(
      (form) => ({
        id: form,
        label: `${form.charAt(0).toUpperCase() + form.slice(1)} · ${person[form].alias}`,
        imageUrl: promArt(identityArtKey(person.signature, form)),
        ...('stats' in person[form] ? { stats: person[form].stats } : {}),
      }),
    )
    node.variations = [
      {
        axis: 'form',
        key: 'student',
        label: `Student: ${person.student.alias}`,
        text: person.student.conflict,
      },
      {
        axis: 'form',
        key: 'hero',
        label: `Hero: ${person.hero.alias}`,
        text: person.hero.method,
      },
      {
        axis: 'form',
        key: 'villain',
        label: `Villain: ${person.villain.alias}`,
        text: person.villain.method,
      },
      {
        axis: 'bond',
        key: 'sidekick',
        label: 'As sidekick',
        text: person.sidekick,
      },
      {
        axis: 'bond',
        key: 'partner',
        label: 'As partner',
        text: person.quests.partner,
      },
      {
        axis: 'bond',
        key: 'romance',
        label: 'Optional romance',
        text: person.romance,
      },
      {
        axis: 'track',
        key: 'protagonist',
        label: 'Their own quest',
        text: person.quests.protagonist,
      },
      {
        axis: 'track',
        key: 'antagonist',
        label: 'Against you',
        text: person.quests.antagonist,
      },
    ]
    add(withArt(node, identityArtKey(person.signature, 'student')))
  }

  const draw = blankNode('roster:draw', 'fork', 'The seeded roster')
  draw.place = 'Every new term'
  draw.body = [
    'You become one of the 48. The run seed deals everyone else into roles: the training roster you dispatch, friends, possible romances, a partner or sidekick, hero upgrades and enemies, with a guaranteed heel turn among them.',
    'The playable slice still dispatches the fixed week-one team below; seeding the roster into play is conductor comet-city-academy t-016.',
  ]
  draw.pool = CHARACTER_ROSTER.map((person) => identityKey(person.signature))
  draw.provenance =
    'Design: conductor projects/comet-city-academy/IDENTITY-SYSTEM.md.'
  add(draw)

  for (const student of STUDENTS) {
    const node = blankNode(`student:${student.id}`, 'thread', student.name)
    node.place = `Week-one team · ${student.title} · ${powerName(student.skill)}`
    node.body = [student.note]
    node.companions = [student.id]
    withArt(node, studentArtKey(student.id))
    // A prototype cast the seeded roster replaces: no new art is owed to it.
    node.needsArt = false
    node.provenance =
      'Fixed week-one dispatch team in the playable slice; replaced by the seeded identity roster (t-016).'
    add(node)
  }

  CAMPAIGN_ANCHORS.forEach((anchor, index) => {
    const day = index + 1
    const key = `day:${String(day).padStart(2, '0')}`
    if (day === 29 || day === 30) return
    const node = blankNode(key, 'spine', `Day ${day}`)
    node.place = 'Morning anchor'
    node.chapter = day
    node.body = [anchor]
    node.provenance =
      'A daily anchor is narration over the city map; it has no picture slot of its own.'
    add(node)
  })

  const guest = blankNode('day:29', 'spine', GUEST_LIST_EVENT.title)
  guest.place = GUEST_LIST_EVENT.location
  guest.chapter = 29
  guest.body = [GUEST_LIST_EVENT.scene]
  guest.choices = optionChoices(GUEST_LIST_EVENT.options).map((choice) => ({
    ...choice,
    leadsTo: 'day:30',
  }))
  add(withArt(guest, GUEST_LIST_ARRIVAL_ART_KEY))
  const plan = {
    'guest-open': 'open',
    'guest-private': 'private',
    'guest-duplicate': 'duplicate',
  } as const
  for (const option of GUEST_LIST_EVENT.options) {
    const node = blankNode(
      `guest:${plan[option.id]}`,
      'thread',
      `The Guest List: ${option.label}`,
    )
    node.place = 'Day 29 outcome'
    node.chapter = 29
    node.body = [option.text]
    add(withArt(node, GUEST_LIST_ART_KEYS[plan[option.id]]))
  }

  const finale = blankNode('day:30', 'spine', PROM_FINALE.title)
  finale.place = PROM_FINALE.location
  finale.chapter = 30
  finale.body = [PROM_FINALE.opening]
  finale.choices = PROM_FINALE.choices.map((choice) => ({
    id: choice.id,
    label: choice.title,
    tags: [],
    success: { text: choice.help },
    leadsTo:
      choice.id === 'share'
        ? `ending:${slugify(PROM_ENDINGS[0])}`
        : choice.id === 'command'
          ? `ending:${slugify(PROM_ENDINGS[4])}`
          : `ending:${slugify(PROM_ENDINGS[2])}`,
  }))
  add(withArt(finale, FINALE_ART_KEY))

  for (const incident of INCIDENTS) {
    const node = blankNode(
      `incident:${incident.id}`,
      'encounter',
      incident.title,
    )
    node.place = incident.site
    node.body = [incident.briefing]
    const real = REAL_NIGHT_CASES[incident.id]
    if (real) node.body.push(real.briefing)
    node.lenses = [incident.allegiance]
    node.choices = [
      {
        id: 'dispatch',
        label: `Dispatch students (needs ${powerName(incident.need)})`,
        check: { skill: incident.need, target: incident.risk },
        tags: [`Risk ${incident.risk}`],
        success: real ? { text: real.consequences.honors } : undefined,
        failure: real ? { text: real.consequences.failed } : undefined,
      },
    ]
    if (real)
      node.variations = (['pass', 'partial'] as const).map((grade) => ({
        axis: 'grade',
        key: grade,
        label: titleCase(grade),
        text: real.consequences[grade],
      }))
    add(withArt(node, incidentArtKey(incident.id)))
  }

  for (const card of ENCOUNTERS) {
    const site = CITY_SITES.find(
      (item) => item.encounterIndex === ENCOUNTERS.indexOf(card),
    )
    const node = blankNode(
      `encounter:${slugify(card.title)}`,
      'crossroads',
      card.title,
    )
    node.place = site?.name ?? card.location
    node.body = [card.scene]
    node.choices = optionChoices(card.options as readonly Option[])
    add(withArt(node, encounterArtKey(card.title)))
  }

  for (const [siteId, scene] of Object.entries(DISTRICT_ENCOUNTERS)) {
    const node = blankNode(`district:${siteId}`, 'quest', scene.title)
    node.place = scene.location
    node.body = [scene.scene]
    node.choices = optionChoices(scene.options)
    add(withArt(node, districtArtKey(siteId)))
  }

  for (const villain of CAMPAIGN_VILLAINS) {
    const node = blankNode(`villain:${villain.id}`, 'boss', villain.name)
    node.place = 'Mastermind'
    node.body = [
      `${villain.name} ${villain.method}.`,
      `Clue: ${villain.clue}`,
      `Accomplice: ${villain.accomplice}.`,
    ]
    add(withArt(node, villainArtKey(villain.name)))
  }

  PROM_ENDINGS.forEach((ending, index) => {
    const node = blankNode(
      `ending:${slugify(ending)}`,
      'ending',
      titleCase(ending),
    )
    node.place = index < 6 ? 'The real Prom of Doom' : 'The week-one simulation'
    node.body = [
      index < 6
        ? 'At dawn the survivors decide what graduation and rebuilding mean.'
        : 'The faculty simulation ends; real graduation is still weeks away.',
    ]
    add(withArt(node, endingArtKey(ending)))
  })

  const spine = [
    'enrol',
    ...Array.from(
      { length: 30 },
      (_, i) => `day:${String(i + 1).padStart(2, '0')}`,
    ),
  ]
  const routes: PlaybookRoute[] = [
    {
      id: 'thirty-days',
      name: 'The last thirty days',
      kind: 'Daily anchors over the city map, the Guest List and the Prom of Doom',
      steps: spine,
      headings: {
        1: 'Week one',
        8: 'Week two',
        15: 'Week three',
        22: 'Week four',
        29: 'Prom weekend',
      },
    },
  ]
  spine.forEach((key, step) => {
    const node = nodes[key]
    if (!node || step === 0) return
    node.placements.push({
      route: 'thirty-days',
      routeName: 'The last thirty days',
      day: step,
      dayName: `Day ${step}`,
      step,
    })
  })
  const keysOf = (kind: PlaybookNode['kind']) =>
    Object.values(nodes)
      .filter((n) => n.kind === kind)
      .map((n) => n.key)

  return {
    game: 'comet-city-academy',
    title: 'Prom of Doom',
    blurb: 'Thirty days, six students, four masterminds and ten endings.',
    routes,
    nodes,
    order: storyOrder(routes, [
      ...keysOf('follower'),
      ...keysOf('fork'),
      ...keysOf('encounter'),
      ...keysOf('crossroads'),
      ...keysOf('quest'),
      ...keysOf('thread'),
      ...keysOf('boss'),
      ...keysOf('ending'),
    ]),
    sections: [
      {
        title: 'Identity roster',
        blurb:
          '48 people and two guests: you become one, the seed deals the rest their roles.',
        keys: keysOf('follower'),
      },
      {
        title: 'Week-one team (prototype)',
        blurb: 'The fixed dispatch team the seeded roster replaces.',
        keys: Object.keys(nodes).filter((key) => key.startsWith('student:')),
      },
      {
        title: 'Patrol incidents',
        blurb: 'Night dispatches and their consequences.',
        keys: keysOf('encounter'),
      },
      {
        title: 'Campus encounters',
        blurb: 'Academy landmarks.',
        keys: keysOf('crossroads'),
      },
      {
        title: 'District scenes',
        blurb: 'Two authored routes per city landmark.',
        keys: keysOf('quest'),
      },
      {
        title: 'Masterminds',
        blurb: 'One plots each Prom of Doom.',
        keys: keysOf('boss'),
      },
      {
        title: 'Endings',
        blurb: 'Six real, four from the week-one simulation.',
        keys: keysOf('ending'),
      },
    ],
    people: STUDENTS.map((s) => ({ id: s.id, label: s.name })),
    peopleLabel: 'Week-one team',
    variations: [
      { id: 'hero', label: 'Hero' },
      { id: 'villain', label: 'Villain' },
      { id: 'rogue', label: 'Rogue' },
      { id: 'shared', label: 'Shared' },
    ],
    variationLabel: 'Allegiance',
    dayLabel: 'Day',
    kindLabels: {
      opening: 'Enrolment',
      follower: 'Identity',
      spine: 'Day',
      encounter: 'Patrol incident',
      crossroads: 'Campus encounter',
      quest: 'District scene',
      thread: 'Week-one team or Guest List outcome',
      fork: 'Seeded roster',
      boss: 'Mastermind',
      ending: 'Ending',
    },
    editable: false,
    artProject: 'comet-city-academy',
    artLanes: ['krea2'],
    artPromptsComplete: true,
  }
}
