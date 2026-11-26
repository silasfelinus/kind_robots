export interface ClashGlossaryEntry {
  term: string
  definition: string
  aliases: string[]
  icon?: string
}

export const CLASH_GLOSSARY: ClashGlossaryEntry[] = [
  {
    term: 'Alley',
    definition: 'One of the five fighting lanes.',
    aliases: ['alley', 'alleys'],
  },
  {
    term: 'Ambush',
    icon: 'ϟ',
    definition:
      'A new fighter can strike immediately and gains 1 attack on its first strike.',
    aliases: ['ambush'],
  },
  { term: 'Armor', definition: 'Reduces incoming damage.', aliases: ['armor'] },
  {
    term: 'Arrive',
    icon: '↘',
    definition:
      'An effect that happens when the fighter enters the battlefield.',
    aliases: ['arrive', 'arrival'],
  },
  {
    term: 'Attack / power',
    definition: 'How much damage a fighter deals.',
    aliases: ['attack', 'power'],
  },
  {
    term: 'Boss',
    definition: 'Your crew leader. Lose when your boss runs out of life.',
    aliases: ['boss', 'bosses'],
  },
  {
    term: 'Bulldoze',
    icon: '»',
    definition:
      'Extra damage after defeating a fighter hits the rival boss. A 5-damage hit on an unarmored fighter with 2 life deals 3 damage to the boss.',
    aliases: ['bulldoze'],
  },
  {
    term: 'Cast',
    icon: '✦',
    definition: 'Use a spell for its stated effect.',
    aliases: ['cast'],
  },
  {
    term: 'Collect',
    icon: '✚',
    definition: 'Gain 1 attack when defeating a fighter.',
    aliases: ['collect'],
  },
  {
    term: 'Evolution',
    definition:
      'Playing a card unlocks its next level for the match, up to level 3.',
    aliases: ['evolution', 'evolve', 'evolves'],
  },
  {
    term: 'Faction power',
    definition: "A crew's special ability, usable once per match.",
    aliases: ['faction power', 'faction powers'],
  },
  {
    term: 'Leech',
    icon: '♥',
    definition: 'Heal 1 life when this fighter hits.',
    aliases: ['leech'],
  },
  {
    term: 'New',
    definition:
      'A fighter that just entered play; normally it can block but cannot strike yet.',
    aliases: ['new'],
  },
  {
    term: 'Overcharge',
    definition:
      'A stronger faction power when your boss is at half life or less, or you fill all five alleys.',
    aliases: ['overcharge', 'overcharged'],
  },
  {
    term: 'Overkill',
    definition:
      'Damage left over after a fighter runs out of life. Normally this extra damage is lost.',
    aliases: ['overkill', 'extra damage'],
  },
  {
    term: 'Pierce',
    icon: '➶',
    definition: 'Ignore 1 point of armor.',
    aliases: ['pierce'],
  },
  {
    term: 'Regen',
    icon: '✿',
    definition: 'Heal 1 life after each round.',
    aliases: ['regen'],
  },
  {
    term: 'Shield',
    icon: '⬟',
    definition: 'Temporary protection against damage.',
    aliases: ['shield', 'shielded'],
  },
  {
    term: 'Snare',
    icon: '⌗',
    definition: 'A struck rival skips a strike.',
    aliases: ['snare'],
  },
  {
    term: 'Stun',
    icon: '⊘',
    definition:
      'Root and stun mean the same thing in Clash. The fighter cannot attack, counterattack or use Tap until the end of its next turn; it still occupies its lane.',
    aliases: ['stun', 'stuns', 'stunned', 'root', 'roots', 'rooted', 'rooting'],
  },
  {
    term: 'Swarm',
    icon: '✣',
    definition: 'Gain 1 attack when beside an ally.',
    aliases: ['swarm'],
  },
  {
    term: 'Tap',
    icon: '↷',
    definition:
      'Use the stated ability instead of this fighter’s strike for the turn.',
    aliases: ['tap', 'skip strike'],
  },
  {
    term: 'Toughness / life',
    definition: 'Damage a fighter can still take. At zero life it is defeated.',
    aliases: ['toughness', 'life', 'hp'],
  },
  {
    term: 'Trap',
    icon: '◇',
    definition: 'A hidden card that triggers when its condition is met.',
    aliases: ['trap', 'traps'],
  },
  {
    term: 'Volatile',
    icon: '✹',
    definition:
      'When defeated, the fighter deals 1 damage (2 for some cards) to the opposing fighter in its lane, or the rival boss if empty. Removing Volatile prevents that explosion.',
    aliases: ['volatile'],
  },
]

const byAlias = new Map(
  CLASH_GLOSSARY.flatMap((entry) =>
    entry.aliases.map((alias) => [alias, entry] as const),
  ),
)
const pattern = Array.from(byAlias.keys())
  .sort((a, b) => b.length - a.length)
  .join('|')

export function clashGlossaryEntry(term: string) {
  return byAlias.get(term.toLowerCase())
}

export function clashGlossaryParts(text: string) {
  return text
    .split(new RegExp('\\b(' + pattern + ')\\b', 'gi'))
    .filter(Boolean)
    .map((text) => ({ text, entry: byAlias.get(text.toLowerCase()) }))
}
