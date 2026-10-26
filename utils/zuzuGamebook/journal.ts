/*
 * The character sheet's journal (BOOK-ONE-OUTLINE.md §2): Honor and Taint are felt, never scored, so the
 * journal shows the deeds themselves, with the dark ones marked, plus debts owed and what Zuzu has learned.
 */
export type JournalEntry = { text: string; dark?: boolean }
export type Journal = {
  deeds: JournalEntry[]
  debts: string[]
  learned: string[]
}

const words = (slug: string) => slug.replace(/-/g, ' ')

/** Debts owed to someone the journal knows by name (debt:looter is the boy who gave his at the arch). */
const DEBT_NAMES: Record<string, string> = {
  looter: 'Jeffery Mittens',
  sister: 'The sister',
  'coyote-cover': 'The Coyote Vagrant',
}

export function journal(flags: string[]): Journal {
  const deeds: JournalEntry[] = []
  const debts: string[] = []
  const learned: string[] = []
  for (const flag of flags) {
    const [kind, rest] = flag.includes(':')
      ? [flag.slice(0, flag.indexOf(':')), flag.slice(flag.indexOf(':') + 1)]
      : ['', flag]
    if (kind === 'honor') deeds.push({ text: words(rest) })
    else if (kind === 'taint') deeds.push({ text: words(rest), dark: true })
    else if (kind === 'debt') debts.push(DEBT_NAMES[rest] ?? words(rest))
    else if (kind === 'met') continue
    else learned.push(words(rest))
  }
  return { deeds, debts, learned }
}
