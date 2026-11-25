export const CLASH_GLOSSARY = [
  {
    term: 'Alley',
    definition: 'One of the five fighting lanes.',
    aliases: ['alley', 'alleys'],
  },
  {
    term: 'Ambush',
    definition:
      'A new fighter can strike immediately and gains 1 attack on its first strike.',
    aliases: ['ambush'],
  },
  { term: 'Armor', definition: 'Reduces incoming damage.', aliases: ['armor'] },
  {
    term: 'Arrive',
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
    definition:
      'Extra damage after defeating a fighter hits the rival boss. A 5-damage hit on an unarmored fighter with 2 life deals 3 damage to the boss.',
    aliases: ['bulldoze'],
  },
  {
    term: 'Cast',
    definition: 'Use a spell for its stated effect.',
    aliases: ['cast'],
  },
  {
    term: 'Collect',
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
    definition: 'Ignore 1 point of armor.',
    aliases: ['pierce'],
  },
  {
    term: 'Regen',
    definition: 'Heal 1 life after each round.',
    aliases: ['regen'],
  },
  {
    term: 'Shield',
    definition: 'Temporary protection against damage.',
    aliases: ['shield', 'shielded'],
  },
  {
    term: 'Snare',
    definition: 'A struck rival skips a strike.',
    aliases: ['snare'],
  },
  {
    term: 'Stun',
    definition: 'A stunned fighter skips a strike.',
    aliases: ['stun', 'stuns', 'stunned'],
  },
  {
    term: 'Swarm',
    definition: 'Gain 1 attack when beside an ally.',
    aliases: ['swarm'],
  },
  {
    term: 'Tap',
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
    definition: 'A hidden card that triggers when its condition is met.',
    aliases: ['trap', 'traps'],
  },
  {
    term: 'Volatile',
    definition: 'Explodes when defeated.',
    aliases: ['volatile'],
  },
]

export type ClashGlossaryEntry = (typeof CLASH_GLOSSARY)[number]

const byAlias = new Map(
  CLASH_GLOSSARY.flatMap((entry) =>
    entry.aliases.map((alias) => [alias, entry] as const),
  ),
)
const pattern = Array.from(byAlias.keys())
  .sort((a, b) => b.length - a.length)
  .join('|')

export function clashGlossaryParts(text: string) {
  return text
    .split(new RegExp('\\b(' + pattern + ')\\b', 'gi'))
    .filter(Boolean)
    .map((text) => ({ text, entry: byAlias.get(text.toLowerCase()) }))
}
