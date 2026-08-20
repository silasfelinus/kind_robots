import type { DailyDreamBlueprint } from './dailyDreamFacetBlueprint'

const GROUNDED_NAMES = [
  'Nadia Reyes',
  'Mateo Silva',
  'Priya Nair',
  'Amina Yusuf',
  'Hana Mori',
  'Idris Cole',
  'Leila Haddad',
  'Jun Park',
  'Mara Bennett',
  'Theo Mercer',
  'Imani Brooks',
  'Ravi Shah',
  'Noor Rahman',
  'Elena Costa',
  'Darius Bell',
  'Sofia Marin',
  'Nia Okafor',
  'Arlo Chen',
  'Celia Ortiz',
  'Samir Khan',
  'Keiko Tanaka',
  'Rowan Price',
  'Lucia Vega',
  'Omar Haddad',
] as const

const MONONYMS = [
  'Pebble',
  'Tern',
  'Mica',
  'Latch',
  'Pollen',
  'Saffron',
  'Orbit',
  'Pocket',
  'Nudge',
  'Lark',
  'Mallow',
  'Kestrel',
  'Flicker',
  'Cobalt',
  'Wicket',
  'Sundae',
  'Tide',
  'Bramble',
  'Button',
  'Cork',
  'Dapple',
  'Fig',
  'Hush',
  'Tempo',
] as const

const INITIAL_NAMES = [
  'J. Calder',
  'M. Reyes',
  'A. Bell',
  'T. Mori',
  'K. Vale',
  'R. Chen',
  'S. Mercer',
  'N. Price',
  'I. Brooks',
  'L. Ortiz',
  'P. Shah',
  'C. Costa',
  'D. Marin',
  'H. Park',
  'E. Reed',
  'V. Cole',
  'O. Bennett',
  'F. Rahman',
] as const

const TITLE_NAMES = [
  'Captain Elena Costa',
  'Chef Haru Sato',
  'Detective Nadia Reyes',
  'Archivist Omar Haddad',
  'Courier Nia Okafor',
  'Doctor Imani Brooks',
  'Professor Jun Park',
  'Pilot Sofia Marin',
  'Caretaker Rowan Price',
  'Inspector Celia Ortiz',
  'Quartermaster Theo Mercer',
  'Engineer Priya Nair',
  'Keeper Leila Haddad',
  'Guide Arlo Chen',
  'Clerk Darius Bell',
  'Mechanic Mateo Silva',
  'Ranger Hana Mori',
  'Steward Amina Yusuf',
] as const

const BYNAMES = [
  'Elena from Platform Four',
  'Mateo at the West Window',
  'Nadia of Late Checkout',
  'Jun from the Parcel Room',
  'Amina of Second Shift',
  'Theo at Gate C',
  'Keiko from the Roof Garden',
  'Celia of Quiet Hours',
  'Samir from the Signal Desk',
  'Priya at Intake',
  'Rowan from the Long Hall',
  'Nia of Spare Keys',
  'Idris at the Dawn Desk',
  'Sofia from Found Objects',
  'Hana at the Freight Lift',
  'Darius of Table Nine',
] as const

const NAME_STYLE_POOLS = [
  GROUNDED_NAMES,
  MONONYMS,
  INITIAL_NAMES,
  TITLE_NAMES,
  BYNAMES,
] as const

type NameAssignment = {
  before: string
  after: string
}

function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pickUniqueName(options: {
  dateKey: string
  userId: number
  slot: number
  used: Set<string>
}): string {
  const styleIndex =
    (hashSeed(`${options.dateKey}:${options.userId}:style`) + options.slot) %
    NAME_STYLE_POOLS.length
  const pool = NAME_STYLE_POOLS[styleIndex]!
  const start = hashSeed(
    `${options.dateKey}:${options.userId}:name:${options.slot}`,
  ) % pool.length

  for (let offset = 0; offset < pool.length; offset++) {
    const candidate = pool[(start + offset) % pool.length]!
    if (!options.used.has(candidate)) {
      options.used.add(candidate)
      return candidate
    }
  }

  const fallback = `Traveler ${options.slot + 1}`
  options.used.add(fallback)
  return fallback
}

function replaceFirst(text: string, assignment: NameAssignment): string {
  const index = text.indexOf(assignment.before)
  if (index < 0) return text
  return `${text.slice(0, index)}${assignment.after}${text.slice(index + assignment.before.length)}`
}

function replaceAll(text: string, assignment: NameAssignment): string {
  return text.split(assignment.before).join(assignment.after)
}

function replaceSequence(
  text: string,
  assignments: readonly NameAssignment[],
): string {
  return assignments.reduce(replaceFirst, text)
}

export function diversifyDailyDreamNames(
  blueprint: DailyDreamBlueprint,
  options: { dateKey: string; userId: number },
): DailyDreamBlueprint {
  const used = new Set<string>()
  let slot = 0
  const narratorAssignment: NameAssignment | null = blueprint.narrator
    ? {
        before: blueprint.narrator.name,
        after: pickUniqueName({ ...options, slot: slot++, used }),
      }
    : null
  const characterAssignments = blueprint.characters.map((character) => ({
    before: character.name,
    after: pickUniqueName({ ...options, slot: slot++, used }),
  }))
  const descriptionOrder = [
    ...characterAssignments,
    ...(narratorAssignment ? [narratorAssignment] : []),
  ]
  const pitchOrder = [
    ...(narratorAssignment ? [narratorAssignment] : []),
    ...(characterAssignments[0] ? [characterAssignments[0]] : []),
  ]

  return {
    ...blueprint,
    description: replaceSequence(blueprint.description, descriptionOrder),
    pitch: replaceSequence(blueprint.pitch, pitchOrder),
    flavorText: replaceSequence(blueprint.flavorText, descriptionOrder),
    artPrompt: replaceSequence(blueprint.artPrompt, descriptionOrder),
    narrator:
      blueprint.narrator && narratorAssignment
        ? {
            ...blueprint.narrator,
            name: narratorAssignment.after,
            voice: replaceAll(blueprint.narrator.voice, narratorAssignment),
            artPrompt: replaceAll(
              blueprint.narrator.artPrompt,
              narratorAssignment,
            ),
          }
        : null,
    locations: blueprint.locations.map((location) => ({
      ...location,
      description: replaceSequence(location.description, descriptionOrder),
    })),
    characters: blueprint.characters.map((character, index) => {
      const assignment = characterAssignments[index]!
      return {
        ...character,
        name: assignment.after,
        personality: replaceAll(character.personality, assignment),
        quirks: replaceAll(character.quirks, assignment),
        backstory: replaceAll(character.backstory, assignment),
        artPrompt: replaceAll(character.artPrompt, assignment),
      }
    }),
    rewards: blueprint.rewards.map((reward) => ({
      ...reward,
      description: replaceSequence(reward.description, descriptionOrder),
      effect: replaceSequence(reward.effect, descriptionOrder),
      flavorText: replaceSequence(reward.flavorText, descriptionOrder),
      artPrompt: replaceSequence(reward.artPrompt, descriptionOrder),
    })),
  }
}
