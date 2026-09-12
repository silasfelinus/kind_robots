// /server/utils/endingDeckMath.ts
//
// Deck-generic outcome math for Storybook's endings.
//
// Every Storybook shape resolves the same way: a run accumulates stats on the
// axes its ENDING DECK declares, and at the end those axes are read as bits in
// declaration order to produce an `outcomeKey`, which names exactly one ending
// in that deck. The Life deck (formerly Da Vinci) is one such deck with ten
// axes and 1,024 endings; a genre deck is the same idea with three or four axes
// and eight or sixteen. The engine does not know the difference.
//
// DB-FREE ON PURPOSE, exactly like davinciDimensions.ts, which now delegates
// here: importing ./prisma throws at module load when DATABASE_URL is unset, as
// it is in the contract-tests job, so the pure math has to stay importable
// without it.
//
// Bit order is a data contract. `outcomeKey[i]` is `axes[i]`, '1' means the
// stat met the deck's pass value. Reordering a deck's axes renames every one of
// its endings, so a deck's axes may not be reordered after its endings are
// seeded -- see conductor projects/storybook/data/ending-decks/README.md.

export interface DeckAxis {
  /** snake_case stat key, matching LifeStat.key. */
  key: string
  /** Short human label, e.g. "Truth". */
  label: string
  /** One line telling the narrator what moves this axis. */
  description?: string | null
  /** What passing this axis reads as in an ending, e.g. "the case is solved". */
  passLabel?: string | null
  /** What failing it reads as. */
  failLabel?: string | null
}

export interface DeckDefinition {
  key: string
  title?: string
  axes: DeckAxis[]
  /** A stat passes its axis at or above this value. Missing stats fail. */
  passValue: number
}

export const MIN_DECK_AXES = 1
export const MAX_DECK_AXES = 12
export const DEFAULT_DECK_PASS_VALUE = 1

const AXIS_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

/**
 * The deterministic bit string for a run's stats against its deck.
 *
 * Identical in behaviour to davinciDimensions.resolveOutcomeKey for the Life
 * deck; that function is now a one-line delegate, so the 1,024 seeded endings
 * keep resolving to exactly the keys they were generated for.
 */
export function resolveDeckOutcomeKey(
  deck: DeckDefinition,
  stats: Partial<Record<string, number>>,
): string {
  const passValue = Number.isFinite(deck.passValue)
    ? deck.passValue
    : DEFAULT_DECK_PASS_VALUE
  return deck.axes
    .map((axis) => ((stats[axis.key] ?? 0) >= passValue ? '1' : '0'))
    .join('')
}

/** Every outcomeKey a deck can produce, in ascending binary order. */
export function deckOutcomeKeys(deck: DeckDefinition): string[] {
  const total = 2 ** deck.axes.length
  const keys: string[] = []
  for (let index = 0; index < total; index += 1) {
    keys.push(index.toString(2).padStart(deck.axes.length, '0'))
  }
  return keys
}

/** How many endings a deck with these axes must have to be complete. */
export function deckEndingCount(deck: DeckDefinition): number {
  return 2 ** deck.axes.length
}

/**
 * Parse and validate an EndingDeck.axes JSON column.
 *
 * Throws rather than returning a partial list: an axis set that silently loses
 * an entry would renumber every bit after it, which is the one failure mode
 * that corrupts already-seeded endings instead of merely erroring.
 */
export function parseDeckAxes(value: string | null | undefined): DeckAxis[] {
  if (!value || !value.trim()) throw new Error('A deck must declare its axes.')

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch (error) {
    throw new Error("A deck's axes column is not valid JSON.", { cause: error })
  }
  if (!Array.isArray(parsed)) throw new Error("A deck's axes must be an array.")
  if (parsed.length < MIN_DECK_AXES || parsed.length > MAX_DECK_AXES) {
    throw new Error(
      `A deck must declare ${MIN_DECK_AXES}-${MAX_DECK_AXES} axes (got ${parsed.length}).`,
    )
  }

  const axes: DeckAxis[] = []
  const seen = new Set<string>()
  for (const raw of parsed) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Each deck axis must be an object.')
    }
    const entry = raw as Record<string, unknown>
    const key = typeof entry.key === 'string' ? entry.key.trim() : ''
    if (!AXIS_KEY_PATTERN.test(key)) {
      throw new Error(
        `Deck axis key "${key}" must be snake_case starting with a letter.`,
      )
    }
    if (seen.has(key)) throw new Error(`Duplicate deck axis key "${key}".`)
    seen.add(key)

    axes.push({
      key,
      label:
        typeof entry.label === 'string' && entry.label.trim()
          ? entry.label.trim()
          : key,
      description:
        typeof entry.description === 'string' && entry.description.trim()
          ? entry.description.trim()
          : null,
      passLabel:
        typeof entry.passLabel === 'string' && entry.passLabel.trim()
          ? entry.passLabel.trim()
          : null,
      failLabel:
        typeof entry.failLabel === 'string' && entry.failLabel.trim()
          ? entry.failLabel.trim()
          : null,
    })
  }
  return axes
}

/** Serialize axes back to the shape parseDeckAxes accepts. */
export function serializeDeckAxes(axes: DeckAxis[]): string {
  return JSON.stringify(
    axes.map((axis) => ({
      key: axis.key,
      label: axis.label,
      description: axis.description ?? null,
      passLabel: axis.passLabel ?? null,
      failLabel: axis.failLabel ?? null,
    })),
  )
}

// The Life deck, in the bit order fixed by conductor
// projects/davinci/data/ending-dimensions.yaml and reproduced by
// scripts/generate_davinci_endings.py. Labels and descriptions come from that
// file's pass_label/pass_summary; the keys and their order must not change
// while 1,024 seeded LifeEnding rows depend on them.
export const LIFE_DECK_KEY = 'life'

export const LIFE_DECK: DeckDefinition = {
  key: LIFE_DECK_KEY,
  title: 'A whole life',
  passValue: DEFAULT_DECK_PASS_VALUE,
  axes: [
    {
      key: 'legacy',
      label: 'Legacy',
      description: 'What the life leaves behind once it is over.',
      passLabel: 'remembered',
      failLabel: 'forgotten',
    },
    {
      key: 'wealth',
      label: 'Wealth',
      description:
        'Whether material needs are met and resources can be directed.',
      passLabel: 'prosperous',
      failLabel: 'wanting',
    },
    {
      key: 'love',
      label: 'Love',
      description: 'Bonds of affection, trust, and chosen family.',
      passLabel: 'beloved',
      failLabel: 'alone',
    },
    {
      key: 'wisdom',
      label: 'Wisdom',
      description:
        'Whether experience turns into discernment rather than certainty.',
      passLabel: 'wise',
      failLabel: 'foolish',
    },
    {
      key: 'health',
      label: 'Health',
      description: 'What the body and mind can still carry.',
      passLabel: 'vital',
      failLabel: 'diminished',
    },
    {
      key: 'freedom',
      label: 'Freedom',
      description: 'How much of the path the protagonist still chooses.',
      passLabel: 'free',
      failLabel: 'bound',
    },
    {
      key: 'fame',
      label: 'Fame',
      description: 'How widely the name, work, or myth is known.',
      passLabel: 'renowned',
      failLabel: 'obscure',
    },
    {
      key: 'creation',
      label: 'Creation',
      description: 'What the protagonist actually made and finished.',
      passLabel: 'creator',
      failLabel: 'barren',
    },
    {
      key: 'community',
      label: 'Community',
      description:
        'Belonging to a shared place, practice, movement, or network.',
      passLabel: 'rooted',
      failLabel: 'exiled',
    },
    {
      key: 'mystery',
      label: 'Mystery',
      description: 'Contact with the strange, sacred, uncanny, or unknowable.',
      passLabel: 'awakened',
      failLabel: 'mundane',
    },
  ],
}
