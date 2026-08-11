// /utils/narrativeRoles.ts
//
// WHO SOMEONE IS IN THE STORY, not just that they are in it.
//
// Storybook could already say WHICH Characters were in a story -- setupDraft
// carried `castSlugs: string[]`, a flat list -- but not what any of them were
// FOR. So a story bible said:
//
//   Cast:
//   - Ami Butterfly — a cheerful chaos moth
//   - Cthulhu — sleeping god, presidential hopeful
//
// and the narrator had to guess which one the story was about. Silas,
// 2026-08-06, describing what he actually wanted: "a user can choose specific
// characters and assign them as protagonist, villain, love interest....etc."
//
// WHY NOT REUSE THE STAGE ROLES DIRECTLY. stores/helpers/stageCards.ts already
// has a working role system -- min/max cardinality, badge art, and a
// promptDescriptor woven into generation -- and this deliberately borrows that
// SHAPE (see StageRole in stores/helpers/stageHelper.ts). What it does not
// borrow is the vocabulary: those roles are per-format and describe a SHOW
// (`host`, `bailiff`, `goblin-investor`, `musical-guest`). A story needs roles
// that hold across every premise, which is a different list even though the
// machinery is the same.
//
// The two can converge later -- a stage preset is arguably a story frame with
// its cast list pre-filled -- but merging the vocabularies before either is
// integrated would be inventing a third thing neither side asked for.

/** A part someone plays in a story. Mirrors StageRole minus the show framing. */
export type NarrativeRole = {
  /** Stable, persisted into the setup draft. Renaming one is a data migration. */
  key: string
  label: string
  /** Shown under the role in the picker. */
  description: string
  icon: string
  /**
   * How the role is explained TO THE NARRATOR, in the second person of the
   * story bible. This is the whole point of the feature: the model is told
   * that Ami Butterfly is the one the story follows, rather than inferring it
   * from list order.
   */
  promptDescriptor: string
  /**
   * Roles a story should have at most one of. Two protagonists is usually a
   * mistake; two allies is not. Advisory -- the picker warns rather than
   * blocks, because "usually" is not "always".
   */
  singular?: boolean
}

export const NARRATIVE_ROLES: readonly NarrativeRole[] = [
  {
    key: 'protagonist',
    label: 'Protagonist',
    description: 'The one the story follows and whose choices drive it.',
    icon: 'kind-icon:star',
    promptDescriptor:
      'is the protagonist. The story follows them, their choices drive it, and the questions posed to the reader are theirs to answer.',
    singular: true,
  },
  {
    key: 'antagonist',
    label: 'Antagonist',
    description: 'The opposing force. Need not be a villain.',
    icon: 'kind-icon:swords',
    promptDescriptor:
      'is the antagonist. They want something incompatible with what the protagonist wants, and the story keeps putting them in the way. They are not required to be evil, only opposed.',
    singular: true,
  },
  {
    key: 'love-interest',
    label: 'Love Interest',
    description: 'The romantic thread, requited or otherwise.',
    icon: 'kind-icon:heart',
    promptDescriptor:
      'is the love interest. Their scenes carry romantic tension, and the story treats the relationship as a thread with its own stakes rather than as decoration.',
  },
  {
    key: 'mentor',
    label: 'Mentor',
    description: 'Knows something the protagonist needs.',
    icon: 'kind-icon:book',
    promptDescriptor:
      'is the mentor. They hold knowledge, skill, or perspective the protagonist lacks, and giving it away costs them something.',
  },
  {
    key: 'foil',
    label: 'Foil',
    description: 'Contrast that sharpens the lead.',
    icon: 'kind-icon:mirror',
    promptDescriptor:
      'is the foil. They are close enough to the protagonist to be compared and different enough that the comparison reveals something.',
  },
  {
    key: 'ally',
    label: 'Ally',
    description: 'On the protagonist’s side, with their own reasons.',
    icon: 'kind-icon:handshake',
    promptDescriptor:
      'is an ally. They help, but out of their own motives, and those motives can pull the story sideways.',
  },
  {
    key: 'wildcard',
    label: 'Wildcard',
    description: 'Loyal to nothing but their own logic.',
    icon: 'kind-icon:dice',
    promptDescriptor:
      'is a wildcard. Their allegiance is unstable and their appearances should change the situation rather than comment on it.',
  },
  {
    key: 'ensemble',
    label: 'Ensemble',
    description: 'Present and alive, but not steering.',
    icon: 'kind-icon:people',
    promptDescriptor:
      'is part of the ensemble. They are present and characterised, but the story does not turn on them.',
  },
]

export const NARRATIVE_ROLE_KEYS: readonly string[] = NARRATIVE_ROLES.map(
  (role) => role.key,
)

/**
 * Persisted role keys are untrusted input — a draft can outlive a rename, and
 * localStorage is hand-editable. Callers validate before use rather than
 * casting, the same discipline IS_GALLERY_MODE applies to stored view modes.
 */
export const isNarrativeRoleKey = (value: string): boolean =>
  NARRATIVE_ROLE_KEYS.includes(value)

export function narrativeRole(
  key: string | null | undefined,
): NarrativeRole | null {
  if (!key) return null
  return NARRATIVE_ROLES.find((role) => role.key === key) ?? null
}

export function narrativeRoleLabel(key: string | null | undefined): string {
  return narrativeRole(key)?.label ?? 'Unassigned'
}

/**
 * Roles assigned more than once that should not be.
 *
 * Returned rather than thrown so the picker can warn in place; a story with
 * two antagonists is unusual, not invalid, and refusing to render it would be
 * the tool arguing with the author.
 */
export function duplicateSingularRoles(
  roleKeys: readonly (string | null | undefined)[],
): string[] {
  const counts = new Map<string, number>()
  for (const key of roleKeys) {
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([key, count]) => count > 1 && narrativeRole(key)?.singular)
    .map(([key]) => key)
    .sort()
}

/** The casting board's three tiers. Lead is split into its two opposed parts
 * so a caller can seat protagonist(s) and antagonist(s) on opposite sides
 * rather than mixed into one row. */
export type NarrativeCastTier =
  'protagonist' | 'antagonist' | 'support' | 'back'

/**
 * Which tier of the casting board a role belongs in.
 *
 * `protagonist`/`antagonist` lead, given prominence and set opposite each
 * other. The other five real roles (`love-interest`, `mentor`, `foil`,
 * `ally`, `wildcard`) hold the supporting middle row. `ensemble` and an
 * unassigned member (`null`) share the back row — ranked behind without
 * being hidden, since roles stay optional and an unassigned card still has
 * to be readable and pressable. Extracted from narrative-role-assigner.vue
 * (t-011) so the grouping is a pure function CI can exercise directly rather
 * than logic only reachable by mounting the component.
 */
export function narrativeCastTier(
  roleKey: string | null | undefined,
): NarrativeCastTier {
  if (roleKey === 'protagonist') return 'protagonist'
  if (roleKey === 'antagonist') return 'antagonist'
  if (!roleKey || roleKey === 'ensemble') return 'back'
  return 'support'
}

/**
 * The Cast line for the story bible.
 *
 * `Ami Butterfly — a cheerful chaos moth` becomes
 * `Ami Butterfly [Protagonist] — a cheerful chaos moth. Ami Butterfly is the
 * protagonist. The story follows them...`
 *
 * An unassigned member keeps exactly the old line, so adding roles to a story
 * that has none changes nothing about how it generates.
 */
export function castLineWithRole(
  description: string,
  title: string,
  roleKey: string | null | undefined,
): string {
  const role = narrativeRole(roleKey)
  if (!role) return description
  return `${description} [${role.label}] ${title} ${role.promptDescriptor}`
}
