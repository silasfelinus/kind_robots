import type { HouseRoomId } from './house'

/**
 * Every card is a concrete part of a remembered event. Different objects form
 * a pair, so play requires attention to what happened rather than identical art.
 * The boards work before any queued illustration has reached the website.
 */
export interface DarkHouseMemoryFace {
  id: string
  pair: string
  symbol: string
  label: string
}
export interface DarkHouseMemoryTrial {
  room: HouseRoomId
  title: string
  story: string
  pairs: readonly (readonly [string, string, string, string])[]
}
export interface DarkHouseLogicOption {
  id: string
  label: string
  response: string
}
export interface DarkHouseLogicPuzzle {
  room: HouseRoomId
  title: string
  evidence: string
  question: string
  answer: string
  hint: string
  options: readonly DarkHouseLogicOption[]
}

export const DARK_HOUSE_TRIALS: Readonly<Record<string, DarkHouseMemoryTrial>> = {
  'HD-09': {
    room: 'HD-09',
    title: 'Hearth-Guard: the flame and its keeper',
    story: 'The brass sentry remembers dangers as enemies. Pair the physical problem with the tool that actually helped someone.',
    pairs: [
      ['🔥', 'Loose ember', '🪣', 'Water bucket'],
      ['🗝️', 'Locked hearth', '🚪', 'Open furnace door'],
      ['🥖', 'Unbaked loaf', '♨️', 'Warm oven'],
      ['🕯️', 'Dark corridor', '🏮', 'Carried lantern'],
    ],
  },
  'HD-16': {
    room: 'HD-16',
    title: 'Housekeeper: work and its witness',
    story: 'The House counted chores but erased workers. Reconnect each finished task to the person who performed it.',
    pairs: [
      ['🧹', 'Clean stair', '👣', 'Sweeper’s footsteps'],
      ['🧺', 'Fresh linens', '🧵', 'Sewing kit'],
      ['🥣', 'Warm supper', '🥄', 'Cook’s ladle'],
      ['🕰️', 'Unpaid hour', '💰', 'Wage purse'],
    ],
  },
  'HD-19': {
    room: 'HD-19',
    title: 'Morrow: three reflections and a choice',
    story: 'Every reflection tells a partial truth about Morrow. Pair evidence with the life in which it was used.',
    pairs: [
      ['💼', 'Work badge', '🚇', 'Commuter pass'],
      ['🍂', 'Forest cloak', '🪄', 'Fey wand'],
      ['📊', 'Research charts', '🖥️', 'Office terminal'],
      ['🪞', 'Cracked mirror', '🧩', 'Matching shard'],
    ],
  },
  'HD-22': {
    room: 'HD-22',
    title: 'Index Collector: reclaim the missing lives',
    story: 'The collector assigned numbers to people. Pair the belongings with the memories he filed under the wrong titles.',
    pairs: [
      ['📚', 'Bound biography', '🗣️', 'Living testimony'],
      ['🔏', 'Closed archive', '🗝️', 'Owner’s key'],
      ['✉️', 'Unsent letter', '📬', 'Home mailbox'],
      ['🖼️', 'Unclaimed portrait', '🪞', 'Known reflection'],
      ['⚖️', 'Old contract', '✍️', 'New signature'],
    ],
  },
  'HD-28': {
    room: 'HD-28',
    title: 'Twinned Guards: two orders, one protection',
    story: 'Each guard carries a different order that points to the same human need. Restore the links before either strikes.',
    pairs: [
      ['🛡️', 'Raised shield', '👶', 'Protected child'],
      ['📜', 'Sealed order', '🕯️', 'Signal candle'],
      ['🪖', 'Empty armor', '🪑', 'Unoccupied throne'],
      ['⚔️', 'Drawn sword', '🤝', 'Lowered hand'],
      ['🔔', 'Alarm bell', '🏘️', 'Village gate'],
    ],
  },
  'HD-32': {
    room: 'HD-32',
    title: 'Rootbound Warden: eight voices before judgment',
    story: 'The Warden claims one perfect account. Restore six pairs of contradictory but equally real evidence before offering a verdict.',
    pairs: [
      ['🗝️', 'Warden’s key', '🚪', 'Unlocked exit'],
      ['💡', 'Memory lantern', '👁️', 'Witness’s gaze'],
      ['🏚️', 'Abandoned home', '🏡', 'Chosen home'],
      ['📃', 'Confiscation record', '🧰', 'Returned tools'],
      ['💔', 'Old hurt', '🩹', 'Voluntary repair'],
      ['🌱', 'New seed', '🌳', 'Living tree'],
    ],
  },
}

export const DARK_HOUSE_PUZZLES: Readonly<Record<string, DarkHouseLogicPuzzle>> = {
  'HD-03': {
    room: 'HD-03',
    title: 'The boot-rack route',
    evidence: 'The northern boots carry fresh snow. The southern boots are stained with river mud. The traveler needs the river, not the mountain.',
    question: 'Which boots point toward the river passage?',
    answer: 'south',
    hint: 'Mud comes from the river bank. Snow comes from the northern ridge.',
    options: [
      { id: 'north', label: 'The snow-covered northern boots', response: 'Snow falls on the ridge. The river crossing remains hidden.' },
      { id: 'south', label: 'The muddy southern boots', response: 'The river route settles into place and a real staircase appears.' },
      { id: 'same', label: 'Both pairs mark the same road', response: 'The two pairs bear different soil and different wear.' },
    ],
  },
  'HD-08': {
    room: 'HD-08',
    title: 'Three apologies and their recipients',
    evidence: 'The first apology names a borrowed coat. The second admits a broken bridge. The third concerns a lost letter. A bridge mason is waiting on the middle landing.',
    question: 'Which apology belongs to the mason?',
    answer: 'second',
    hint: 'The mason repaired the bridge. The coat and letter belong to other witnesses.',
    options: [
      { id: 'first', label: 'The apology about the borrowed coat', response: 'The coat’s owner is elsewhere. The stairs keep moving.' },
      { id: 'second', label: 'The apology about the broken bridge', response: 'The mason acknowledges the account. The middle staircase stops moving.' },
      { id: 'third', label: 'The apology about the lost letter', response: 'The letter’s recipient has not yet arrived.' },
    ],
  },
  'HD-13': {
    room: 'HD-13',
    title: 'The clockwork pantry discrepancy',
    evidence: 'The machine reports zero kitchen mistakes by scheduling zero meals. The cook baked one imperfect loaf and fed four neighbors.',
    question: 'What changed the kitchen’s results?',
    answer: 'count',
    hint: 'Zero mistakes can also mean zero meals.',
    options: [
      { id: 'cook', label: 'The cook became incapable of making bread', response: 'The loaf is on the table, and four people ate.' },
      { id: 'count', label: 'The machine measured mistakes rather than meals served', response: 'The false measure is exposed. The kitchen may cook again.' },
      { id: 'oven', label: 'The oven stopped producing any heat', response: 'The finished loaf is still warm.' },
    ],
  },
  'HD-25': {
    room: 'HD-25',
    title: 'The bargain with two creditors',
    evidence: 'An older ledger lists the House as creditor and the village as debtor. A newer receipt shows the House used the villagers’ wages to settle its own bill.',
    question: 'Whose work paid the House’s debt?',
    answer: 'workers',
    hint: 'Follow the source of the wages, rather than the name on the ledger.',
    options: [
      { id: 'house', label: 'The House paid from its own savings', response: 'The savings account is empty.' },
      { id: 'workers', label: 'The villagers whose wages were withheld', response: 'The account balances when the workers are named as creditors.' },
      { id: 'warden', label: 'The Warden donated its private wealth', response: 'The Warden’s personal column contains no payment.' },
    ],
  },
  'HD-34': {
    room: 'HD-34',
    title: 'Build a passage people can leave',
    evidence: 'A locked door protects the House but traps its residents. An open arch permits exit yet lets floodwater into the cellar. The workshop has a hinged floodgate and a raised ramp.',
    question: 'Which repair preserves both movement and flood protection?',
    answer: 'hinge',
    hint: 'A raised, hinged threshold can open for people and close against rising water.',
    options: [
      { id: 'lock', label: 'Rebuild the permanently locked door', response: 'The residents still cannot leave.' },
      { id: 'arch', label: 'Remove every barrier around the opening', response: 'Riverwater spills across the lowest step.' },
      { id: 'hinge', label: 'Fit the raised ramp and hinged floodgate', response: 'Residents gain a usable exit and can shut the floodgate during a storm.' },
    ],
  },
}

export function darkHouseTrialFaces(room: string): DarkHouseMemoryFace[] {
  const trial = DARK_HOUSE_TRIALS[room]
  if (!trial) return []
  const faces = trial.pairs.flatMap(([leftSymbol, leftLabel, rightSymbol, rightLabel], i) => [
    { id: room + '-a-' + i, pair: String(i), symbol: leftSymbol, label: leftLabel },
    { id: room + '-b-' + i, pair: String(i), symbol: rightSymbol, label: rightLabel },
  ])
  // Seeded Fisher-Yates. Exactly the same layout survives navigation, refreshes
  // and save migrations, without storing any generated image or random seed.
  let seed = [...room].reduce((total, ch) => (Math.imul(total, 31) + ch.charCodeAt(0)) >>> 0, 217)
  for (let i = faces.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = seed % (i + 1)
    const previous = faces[i]!
    faces[i] = faces[j]!
    faces[j] = previous
  }
  return faces
}

export function validateDarkHouseChallenges(): string[] {
  const errors: string[] = []
  const ids = new Set([...Object.keys(DARK_HOUSE_TRIALS), ...Object.keys(DARK_HOUSE_PUZZLES)])
  if (ids.size !== 11) errors.push('Expected eleven distinct matching and deduction chambers')
  for (const [room, challenge] of Object.entries(DARK_HOUSE_TRIALS)) {
    const faces = darkHouseTrialFaces(room)
    if (faces.length !== challenge.pairs.length * 2) errors.push(room + ': incomplete cards')
    if (new Set(faces.map(face => face.id)).size !== faces.length) errors.push(room + ': duplicate card ids')
    if (faces.some(face => !face.symbol || !face.label)) errors.push(room + ': blank card face')
    if (challenge.room !== room) errors.push(room + ': wrong trial key')
    if (challenge.pairs.length < 4) errors.push(room + ': trial is too short')
  }
  for (const [room, puzzle] of Object.entries(DARK_HOUSE_PUZZLES)) {
    if (puzzle.room !== room || !puzzle.options.some(option => option.id === puzzle.answer)) errors.push(room + ': puzzle answer missing')
    if (puzzle.options.length !== 3 || new Set(puzzle.options.map(option => option.id)).size !== 3) errors.push(room + ': ambiguous options')
  }
  return errors
}
