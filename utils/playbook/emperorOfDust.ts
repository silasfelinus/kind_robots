import {
  DAYS,
  QUEST_TEMPLATES,
  authoredQuestDef as questDef,
  editorLine,
} from '../emperorOfDust/fortress/content'
import { FOLLOWERS } from '../emperorOfDust/fortress/followers'
import { questBrief } from '../emperorOfDust/fortress/questBriefs'
import { ENDINGS } from '../emperorOfDust/fortress/endings'
import { NPCS } from '../emperorOfDust/fortress/npcs'
import {
  KINGDOM_FACTION_DEFS,
  LOCAL_FACTION_DEFS,
} from '../emperorOfDust/fortress/factions'
import {
  followerPortrait,
  illustration,
} from '../emperorOfDust/fortress/castArt'
import { PETITIONER_ART_PROMPTS } from '../emperorOfDust/fortress/petitionerArtPrompts'
import type {
  AudienceDef,
  Effects,
  QuestDef,
  Requirement,
} from '../emperorOfDust/fortress/types'
import {
  blankNode,
  humanize,
  signedParts,
  storyOrder,
  uniq,
  type Playbook,
  type PlaybookChoice,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Emperor of Dust in the Playbook Manager (conductor weird-humboldt t-036).
// The fortress has no quest graph: fifty authored days post audiences and
// quests, options recruit followers and set flags, and later audiences gate on
// those flags. So the chain is the fifty days; follower lines gather every
// place a follower joins, is required or has their own quest; quest lines are
// the story flags, from the choices that set them to the beats that need them.
// Read-only here, so it never collides with the game's own active work.

const FACTIONS = [...KINGDOM_FACTION_DEFS, ...LOCAL_FACTION_DEFS]
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V']
const TIERS = ['triumph', 'success', 'partial', 'failure'] as const

function followerName(id: string): string {
  return FOLLOWERS.find((f) => f.id === id)?.name ?? id
}

function factionName(id: string): string {
  return FACTIONS.find((f) => f.id === id)?.name ?? humanize(id)
}

function effectSummary(effects: Effects | undefined): string {
  if (!effects) return ''
  const parts = signedParts({ brass: effects.brass })
  for (const [id, n] of Object.entries(effects.affinity ?? {}))
    parts.push(...signedParts({ [`${factionName(id)} affinity`]: n }))
  for (const [id, n] of Object.entries(effects.local ?? {}))
    parts.push(...signedParts({ [factionName(id)]: n }))
  for (const [id, n] of Object.entries(effects.strength ?? {}))
    parts.push(...signedParts({ [`${factionName(id)} strength`]: n }))
  for (const id of effects.recruit ?? [])
    parts.push(`${followerName(id)} joins`)
  for (const id of effects.recruitable ?? [])
    parts.push(`${followerName(id)} can be hired`)
  for (const item of effects.items ?? []) parts.push(`item ${item}`)
  for (const flag of effects.flags ?? []) parts.push(`sets ${flag}`)
  for (const flag of effects.clearFlags ?? []) parts.push(`clears ${flag}`)
  return parts.join(' · ')
}

function requirementTags(req: Requirement | undefined): string[] {
  if (!req) return []
  return [
    ...(req.cost ? [`${req.cost} brass`] : []),
    ...(req.follower ? [`Needs ${followerName(req.follower)}`] : []),
    ...(req.flags ?? []).map((f) => `Needs ${f}`),
    ...(req.notFlags ?? []).map((f) => `Not after ${f}`),
    ...(req.standing
      ? [`${req.standing.min}+ of ${req.standing.flags.length} standing flags`]
      : []),
    ...Object.entries(req.affinity ?? {}).map(
      ([id, tier]) => `${factionName(id)} ${tier}`,
    ),
    ...Object.entries(req.local ?? {}).map(
      ([id, n]) => `${factionName(id)} ${n}+`,
    ),
  ]
}

function factionsIn(
  ...effects: (Effects | Requirement | undefined)[]
): string[] {
  return uniq(
    effects.flatMap((e) => [
      ...Object.keys((e as Effects | undefined)?.affinity ?? {}),
      ...Object.keys((e as Effects | undefined)?.local ?? {}),
      ...Object.keys((e as Effects | undefined)?.strength ?? {}),
    ]),
  )
}

function followersIn(
  effects: Effects | undefined,
  req?: Requirement,
): string[] {
  return uniq([
    ...(effects?.recruit ?? []),
    ...(effects?.recruitable ?? []),
    ...(req?.follower ? [req.follower] : []),
  ])
}

type Ref = { key: string; label: string; via: string }

export function buildEmperorOfDustPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const steps: string[] = []
  const headings: Record<number, string> = {}
  const followerRefs = new Map<string, Ref[]>()
  const flagSetters = new Map<string, Ref[]>()
  const flagNeeders = new Map<string, Ref[]>()
  const push = (map: Map<string, Ref[]>, id: string, ref: Ref) =>
    map.set(id, [...(map.get(id) ?? []), ref])

  const placement = (day: number, step: number) => ({
    route: 'fifty-days',
    routeName: 'The Fifty Days',
    day,
    dayName: `Act ${ROMAN[Math.ceil(day / 10)] ?? ''}, day ${day}`,
    step,
  })

  function questNode(id: string, day: number, step: number): string {
    const quest = questDef(id)
    const key = `quest:${id.split('@')[0]}`
    if (!quest) return key
    if (!nodes[key]) nodes[key] = buildQuest(quest, key)
    nodes[key]!.placements.push(placement(day, step))
    return key
  }

  function buildQuest(quest: QuestDef, key: string): PlaybookNode {
    const node = blankNode(key, 'quest', quest.title)
    node.place = humanize(quest.region)
    node.body = [questBrief(quest.id, quest.summary)]
    node.editable = true
    node.editFields = { body: true, outcomes: true, labels: false }
    node.provenance = `Needs ${quest.requirements
      .map((r) => `${r.stat} ${r.band}${r.hidden ? ' (hidden)' : ''}`)
      .join(
        ', ',
      )}. Party ${quest.party.min}–${quest.party.max}, ${quest.durationDays} day(s), danger ${quest.danger}${quest.lethal ? ', lethal' : ''}.`
    node.choices = [
      ...TIERS.flatMap((tier) => {
        const rewards = quest.rewards[tier]
        const text = quest.outcomes[tier]
        if (!rewards && !text) return []
        return [
          {
            id: tier,
            label: humanize(tier),
            tags: [],
            success: text ? { text } : undefined,
            effect: effectSummary(rewards) || undefined,
          } satisfies PlaybookChoice,
        ]
      }),
      {
        id: 'expired',
        label: 'Left on the board',
        tags: [],
        success: quest.outcomes.expired
          ? { text: quest.outcomes.expired }
          : undefined,
        effect: effectSummary(quest.expired) || undefined,
      },
    ]
    node.companions = uniq([
      ...(quest.mustInclude ? [quest.mustInclude] : []),
      ...TIERS.flatMap((t) => followersIn(quest.rewards[t])),
    ])
    node.lenses = uniq([
      ...(quest.faction ? [quest.faction] : []),
      ...TIERS.flatMap((t) => factionsIn(quest.rewards[t])),
    ])
    if (quest.mustInclude)
      push(followerRefs, quest.mustInclude, {
        key,
        label: quest.title,
        via: 'Their own quest',
      })
    for (const tier of TIERS) {
      const rewards = quest.rewards[tier]
      for (const id of followersIn(rewards))
        push(followerRefs, id, {
          key,
          label: quest.title,
          via: `Joins on ${tier}`,
        })
      for (const flag of rewards?.flags ?? [])
        push(flagSetters, flag, {
          key,
          label: quest.title,
          via: humanize(tier),
        })
    }
    node.provenance += ` Tags: ${(quest.tags ?? []).join(', ') || 'none'}.`
    return node
  }

  function audienceNode(aud: AudienceDef, day: number, step: number): string {
    const key = `aud:${aud.id}`
    const node = blankNode(key, 'encounter', aud.title)
    node.place = aud.speaker
    node.body = aud.lines.map(editorLine)
    node.editable = true
    node.editFields = { body: true, outcomes: true }
    node.placements.push(placement(day, step))
    // A speaker can be a follower (Day 4's letter is read by Pip Thread).
    node.artUrl = aud.npc
      ? (illustration('npcs', aud.npc) ??
        illustration('followers', aud.npc) ??
        null)
      : null
    node.needsArt = Boolean(aud.npc) && !node.artUrl
    if (node.needsArt && aud.npc)
      node.artPrompt = PETITIONER_ART_PROMPTS[aud.npc]
    for (const flag of aud.requires?.flags ?? [])
      push(flagNeeders, flag, { key, label: aud.title, via: 'Appears after' })
    if (aud.requires?.follower)
      push(followerRefs, aud.requires.follower, {
        key,
        label: aud.title,
        via: 'Needed to appear',
      })
    node.choices = aud.options.map((option) => {
      const posted = (option.postsQuests ?? []).map((id) =>
        questNode(id, day, step),
      )
      const recruits = followersIn(option.effects, option.requires)
      for (const id of recruits)
        push(followerRefs, id, {
          key,
          label: `${aud.title}: ${option.label}`,
          via: option.requires?.follower === id ? 'Needed' : 'Recruited',
        })
      for (const flag of option.effects.flags ?? [])
        push(flagSetters, flag, {
          key,
          label: `${aud.title}: ${option.label}`,
          via: 'Chosen',
        })
      for (const flag of option.requires?.flags ?? [])
        push(flagNeeders, flag, {
          key,
          label: `${aud.title}: ${option.label}`,
          via: 'Option needs',
        })
      return {
        id: option.id,
        label: option.label,
        tags: [
          ...requirementTags(option.requires),
          ...posted.map((q) => `Posts ${nodes[q]?.title ?? q}`),
        ],
        success: { text: option.response },
        effect: effectSummary(option.effects) || undefined,
        leadsTo:
          posted[0] ?? (recruits[0] ? `follower:${recruits[0]}` : undefined),
      }
    })
    // Quests a later exchange posts are on the board too (Day 7's galleries).
    const opening = new Set(aud.options.flatMap((o) => o.postsQuests ?? []))
    for (const id of uniq(
      (aud.beats ?? []).flatMap((beat) =>
        beat.options.flatMap((o) => o.postsQuests ?? []),
      ),
    ))
      if (!opening.has(id)) questNode(id, day, step)
    node.companions = uniq(
      aud.options.flatMap((o) => followersIn(o.effects, o.requires)),
    )
    node.lenses = uniq([
      ...(aud.faction ? [aud.faction] : []),
      ...aud.options.flatMap((o) => factionsIn(o.effects, o.requires)),
    ])
    node.provenance = aud.npc
      ? `Speaker: ${NPCS.find((n) => n.slug === aud.npc)?.name ?? aud.npc}.`
      : ''
    nodes[key] = node
    return key
  }

  for (const day of [...DAYS].sort((a, b) => a.day - b.day)) {
    const step = steps.length
    if ((day.day - 1) % 10 === 0)
      headings[step] =
        `Act ${ROMAN[Math.ceil(day.day / 10)]} · days ${day.day}–${day.day + 9}`
    const key = `day:${day.day}`
    const node = blankNode(key, 'spine', day.title)
    node.place = `Day ${day.day}${day.advisor ? ` · ${day.advisor.name} advises` : ''}`
    node.artUrl = day.advisor
      ? (illustration('npcs', day.advisor.npc) ?? null)
      : null
    // Three briefings then Komodo, in order, so a text edit maps straight back.
    node.body = [...day.briefings.map((b) => b.text), day.komodo]
    node.variations = [
      ...day.briefings.map((b, i) => ({
        axis: 'briefing',
        key: b.id,
        label: `Briefing ${i + 1}: ${b.source}`,
        text: `${b.truth ? 'True' : 'False'}${b.komodoLie ? ', and Komodo backs the lie' : ''}.${b.hindsight ? ` After the betrayal: ${b.hindsight}` : ''}`,
      })),
      // Flag-keyed variants of a report (t-013); the first match wins.
      ...day.briefings.flatMap((b, i) =>
        (b.variants ?? []).map((variant, n) => ({
          axis: 'briefing',
          key: `${b.id}:variant-${n + 1}`,
          label: `Briefing ${i + 1} when ${[
            ...(variant.flags ?? []),
            ...(variant.notFlags ?? []).map((flag) => `not ${flag}`),
          ].join(', ')}`,
          text: `${variant.source ? `${variant.source}: ` : ''}${variant.text ?? b.text}`,
        })),
      ),
      {
        axis: 'briefing',
        key: 'komodo',
        label: 'Paragraph 4: Komodo',
        text: 'The vizier’s read on the day.',
      },
    ]
    node.editable = true
    node.editFields = { body: true, outcomes: false, labels: false }
    node.placements.push(placement(day.day, step))
    const audienceChoices: PlaybookChoice[] = day.audiences.map((aud) => ({
      id: aud.id,
      label: aud.title,
      tags: [aud.speaker, ...requirementTags(aud.requires)],
      leadsTo: audienceNode(aud, day.day, step),
    }))
    const questChoices: PlaybookChoice[] = day.quests.map((id) => {
      const questKey = questNode(id, day.day, step)
      return {
        id: `quest-${id}`,
        label: nodes[questKey]?.title ?? id,
        tags: ['Posted at dawn'],
        leadsTo: questKey,
      }
    })
    node.choices = [...audienceChoices, ...questChoices]
    node.companions = uniq(
      day.audiences.flatMap((a) => nodes[`aud:${a.id}`]?.companions ?? []),
    )
    node.lenses = uniq(
      day.audiences.flatMap((a) => nodes[`aud:${a.id}`]?.lenses ?? []),
    )
    nodes[key] = node
    steps.push(key)
  }
  for (const quest of QUEST_TEMPLATES) {
    const key = `quest:${quest.id}`
    nodes[key] ??= buildQuest(quest, key)
    nodes[key]!.body.push('A seeded chore: drawn at dawn on any day.')
  }

  const followerKeys = FOLLOWERS.map((follower) => {
    const key = `follower:${follower.id}`
    const node = blankNode(key, 'follower', follower.name)
    node.place = `${follower.species} · ${factionName(follower.origin)} · ${humanize(follower.region)}`
    node.body = [
      follower.biography,
      `${follower.ability.name}: ${follower.ability.text}`,
    ]
    node.companions = [follower.id]
    node.variations = follower.traits.map((trait) => ({
      axis: trait.kind,
      key: trait.id,
      label: `${humanize(trait.kind)}: ${trait.name}`,
      text: trait.text,
    }))
    node.choices = [
      ...(follower.starter
        ? [{ id: 'starter', label: 'In the roster from day one', tags: [] }]
        : []),
      ...(followerRefs.get(follower.id) ?? []).map((ref, index) => ({
        id: `ref-${index}`,
        label: ref.label,
        tags: [ref.via],
        leadsTo: ref.key,
      })),
    ]
    node.artUrl = followerPortrait(follower.id) ?? null
    node.needsArt = !node.artUrl
    node.provenance = `Recruit fee ${follower.recruitFee} brass${follower.romanceable ? ' · romanceable' : ''}.`
    nodes[key] = node
    return key
  })

  const threadKeys = [...flagNeeders.keys()].sort().map((flag) => {
    const key = `flag:${flag}`
    const node = blankNode(key, 'thread', humanize(flag))
    node.place = 'Quest line'
    const setters = flagSetters.get(flag) ?? []
    const needers = flagNeeders.get(flag) ?? []
    node.body = [
      setters.length
        ? `Set by ${setters.length} choice(s); unlocks ${needers.length} later beat(s).`
        : `Nothing in the authored content sets this flag; ${needers.length} beat(s) wait on it.`,
    ]
    node.choices = [
      ...setters.map((ref, i) => ({
        id: `set-${i}`,
        label: ref.label,
        tags: [`Sets it · ${ref.via}`],
        leadsTo: ref.key,
      })),
      ...needers.map((ref, i) => ({
        id: `need-${i}`,
        label: ref.label,
        tags: [`Needs it · ${ref.via}`],
        leadsTo: ref.key,
      })),
    ]
    node.companions = uniq(
      [...setters, ...needers].flatMap(
        (ref) => nodes[ref.key]?.companions ?? [],
      ),
    )
    nodes[key] = node
    return key
  })

  const endingKeys = Object.values(ENDINGS).map((ending) => {
    const key = `ending:${ending.id}`
    const node = blankNode(key, 'ending', ending.title)
    node.body = [ending.text]
    node.place = 'Day 50'
    nodes[key] = node
    return key
  })

  const questKeys = Object.keys(nodes).filter((k) => k.startsWith('quest:'))
  const routes: PlaybookRoute[] = [
    {
      id: 'fifty-days',
      name: 'The Fifty Days',
      kind: 'Five acts of ten days: briefings, audiences and the quest board',
      steps,
      headings,
    },
  ]
  return {
    game: 'emperor-of-dust',
    title: 'Emperor of Dust',
    blurb: 'Fifty days, twenty followers, the quest board and eight endings.',
    routes,
    nodes,
    order: storyOrder(routes, [
      ...followerKeys,
      ...threadKeys,
      ...questKeys,
      ...endingKeys,
    ]),
    sections: [
      {
        title: 'Follower lines',
        blurb:
          'Every follower: where they join, where they are needed and their own quests.',
        keys: followerKeys,
      },
      {
        title: 'Quest lines',
        blurb:
          'Story flags, from the choices that set them to the beats that wait on them.',
        keys: threadKeys,
      },
      {
        title: 'Endings',
        blurb: 'How the fifty days can close.',
        keys: endingKeys,
      },
    ],
    people: FOLLOWERS.map((f) => ({ id: f.id, label: f.name })),
    peopleLabel: 'Follower',
    variations: FACTIONS.map((f) => ({ id: f.id, label: f.name })),
    variationLabel: 'Faction',
    dayLabel: 'Day',
    kindLabels: {
      spine: 'Day',
      encounter: 'Audience',
      quest: 'Quest',
      follower: 'Follower line',
      thread: 'Quest line',
      ending: 'Ending',
    },
    editable: true,
    artProject: 'emperor-of-dust',
    artLanes: ['arthemy', 'zimage', 'krea2', 'flux2'],
    artPromptsComplete: true,
  }
}
