import {
  BRIAR_START,
  BRIAR_TILES,
  briarConnected,
  type BriarMapCard,
  type BriarSave,
} from '../memoryDungeonWorld'

export interface DarkBriarChoice {
  id: string
  label: string
  outcome: string
}

export interface DarkBriarScene {
  key: string
  title: string
  opening: string
  artPrompt: string
  originalCallback?: { key: string; choice: string; line: string; alternate: string }
  choices: readonly [DarkBriarChoice, DarkBriarChoice]
}

function scene(
  key: string,
  title: string,
  opening: string,
  artPrompt: string,
  choices: readonly [DarkBriarChoice, DarkBriarChoice],
  originalCallback?: DarkBriarScene['originalCallback'],
): DarkBriarScene {
  return { key, title, opening, artPrompt, choices, originalCallback }
}

/**
 * First vertical slice: sixteen connected, individually authored reflections
 * of stable Briar locations. Other 48 map coordinates have NOT been written;
 * they stay visually veiled rather than displaying fake generic events.
 * This is a real playable entry, not a claim that World Two is complete.
 */
export const DARK_BRIAR_SCENES: Record<string, DarkBriarScene> = {
  '2,4': scene(
    '2,4', 'The Camp That Knows You',
    'Your campfire is burning under a glass bell. Beside it sits the courier you thought you helped. Here, the courier remembers the price you never agreed to pay. There are two chairs and neither casts your shadow.',
    'Enchanted dark mirror Briar camp under an enormous glass bell, two empty mismatched chairs, an anxious courier with sealed letters, familiar forest landmarks under reverse moonlight, cinematic frame, no text.',
    [
      { id: 'listen', label: 'Ask whose memory was spent', outcome: 'The courier names the village as the creditor. Your questions will travel ahead of you, though not everybody will welcome them.' },
      { id: 'name', label: 'Offer your own name as evidence', outcome: 'The glass bell cracks. For one alarming second, both the life you lost and the one you inhabit answer when called.' },
    ],
    { key: '2,4', choice: 'terms', line: 'Your careful original bargain survives as a smudged signature beneath the bell.', alternate: 'The silver flower you carried from Earth has become a pressed accusation.' },
  ),
  '3,4': scene(
    '3,4', 'The Courier Who Received Both Letters',
    'Two royal orders lie opened on a roadside stone. Both were delivered, and both were followed. The courier is exhausted by the idea that you can solve this by choosing which to burn.',
    'Cinematic fairy tale courier by a stone table with two opened wax-sealed orders, twin conflicting roads visible behind, violet dusk, no legible words.',
    [
      { id: 'trace', label: 'Trace who issued each order', outcome: 'The handwriting belongs to different kings. The seal belongs to the same machine. You have found a mechanism, not a liar.' },
      { id: 'shelter', label: 'Shelter the courier from both factions', outcome: 'A grateful courier gives you a safe route, but the palace calls your act an obstruction of justice.' },
    ],
  ),
  '4,4': scene(
    '4,4', 'The Princesses Who Disagree with Your Memory',
    'Scylla reads the escort proclamation with immaculate outrage. Char has found her drawing on the back, but the skull looks like a warning now. They remember helping you. They disagree about who paid for it.',
    'Two sturdy identical-faced adult princesses in tailored proper and unmistakably goth travelling attire, one gripping a decree, the other studying a sinister skull sketch, thick forest shadows, no text.',
    [
      { id: 'scylla', label: 'Hear Scylla’s account of the escort', outcome: 'Scylla remembers a frightened household turned away because her rescue party took the only carriage. Her embarrassment does not diminish her resolve to help them.' },
      { id: 'char', label: 'Ask Char who drew the warning', outcome: 'Char drew it to make a joke. Now she recognizes the pattern in the House windows. For once she asks you to believe a serious thing she said by accident.' },
    ],
    { key: '4,4', choice: 'escort', line: 'The proclamation you accepted hangs here beside a list of people the carriage could not carry.', alternate: 'Even the lantern from their skeptical offer now bears the seal of their court.' },
  ),
  '4,3': scene(
    '4,3', 'Oren’s Ledger of Absences',
    'Oren has counted every missing passenger twice, once under those who left, once under those nobody saw arrive. He does not remove his hood. He has placed his axe across a bridge to stop a stampede.',
    'Masked royal headsman with broad axe laid across a bridge, exacting supply manifests covered with illegible tally marks, silhouettes of travelers on both banks, no text.',
    [
      { id: 'counts', label: 'Reconcile the passenger counts', outcome: 'There are exactly two extra seats. Oren calmly announces that the road has been transporting wishes without their owners.' },
      { id: 'rescue', label: 'Help Oren guide the stranded back', outcome: 'The evacuation works, but a bridge toll collector adds your name to a future account. Oren keeps the receipt.' },
    ],
  ),
  '5,3': scene(
    '5,3', 'The Manifest of Lost Tomorrows',
    'A ledger shows errands scheduled for people whose histories were removed. Someone has continued paying them for futures they can no longer imagine.',
    'Dark fantasy office-like ledger chained to thorn tree, rows rendered as unreadable marks, ghostly workers waiting beside a winding forest road, no text.',
    [
      { id: 'publish', label: 'Show the wages to the workers', outcome: 'The workers demand back pay in memories. Their collective claim will inconvenience the House far more than a heroic duel.' },
      { id: 'audit', label: 'Follow the invoices to their source', outcome: 'A second ledger exists beneath the Sleeping Sigil, promising to explain who benefited from the exchange.' },
    ],
  ),
  '5,2': scene(
    '5,2', 'The Sleeping Sigil Wakes',
    'The seal has opened, but it does not reveal a key. It reveals the name of someone you once called a monster, written in the handwriting of the person they protected.',
    'A split sigil rooted in forest soil, contrasting handprints, reflected silhouettes of a wolf guard and a frightened villager, supernatural engraved marks but no lettering.',
    [
      { id: 'testify', label: 'Carry both names to the House', outcome: 'You copy the two testimonies without choosing which person deserves to be believed first. The House cannot dismiss either witness.' },
      { id: 'shield', label: 'Conceal the protected witness’s name', outcome: 'You carry the accusation but hide its vulnerable source. The House may challenge your evidence, but nobody can trace it back to the witness.' },
    ],
  ),
  '5,4': scene(
    '5,4', 'The Knight at the Wrong Bridge',
    'The Brass Knight stands guard over a crossing that never existed. People queue anyway because his perfect manners make it feel safer than admitting the road has gone.',
    'Stout weathered brass knight carefully guarding an absent bridge, spectral travelers queuing before an impossible ravine, tragicomic twilight, no text.',
    [
      { id: 'draw', label: 'Help the knight build a real crossing', outcome: 'There is no spell. You spend the night carrying planks. The knight learns a promise can be honored without its original object.' },
      { id: 'release', label: 'Release him from the oath', outcome: 'He walks away smiling; the queue panics. You must find another way for ordinary travelers to cross.' },
    ],
  ),
  '6,4': scene(
    '6,4', 'The Two Orders of the Crown',
    'A royal courier delivered both contradictory orders and now two neighborhoods have followed them into the same square. Both have documents proving they belong here.',
    'Clashing small villages occupying overlapping fairy tale street plan, displaced townsfolk holding unreadable decrees, luminous mirrored borders, no text.',
    [
      { id: 'mediate', label: 'Let the displaced residents negotiate', outcome: 'Neither village is restored exactly. They agree on shared water and refuse the king’s claim to decide who is real.' },
      { id: 'trace', label: 'Seek the Reimaginer’s original instruction', outcome: 'The machine obeyed an earnest request to make everyone feel at home. It did not know that two homes occupied the same land.' },
    ],
  ),
  '6,3': scene(
    '6,3', 'The House Has an Ear',
    'Its walls now listen without moving. The carved names from your first journey have become doorbells; to ring one is to summon a person who may not want to be found.',
    'Living manor facade with individual brass bells and carved nameless lintels, dim lit windows with human silhouettes, heavy roots entwined with listening horns, no text.',
    [
      { id: 'consent', label: 'Ask before summoning the witnesses', outcome: 'Only three answer. Their agreement is more valuable than the dozens a coercive bell could produce.' },
      { id: 'records', label: 'Copy the bells without ringing them', outcome: 'You collect a route map without exposing anybody. The House calls your silence obstruction.' },
    ],
  ),
  '6,2': scene(
    '6,2', 'The Unremembered House',
    'The Warden offers you a remarkable victory: erase every debt of memory by erasing everybody who remembers the debt. It would make the village happy, briefly, and leave nobody who could explain why.',
    'Dark twin of living rooted manor, enormous memory vault containing luminous human testimonies, imposing Warden behind veil, doors opening onto contradictory outcomes, no text.',
    [
      { id: 'witness', label: 'Reconcile the witnesses instead', outcome: 'The House cannot manufacture agreement. People leave with competing memories and a newly enforceable right to tell the truth. The dark forest stays strange, but not silent.' },
      { id: 'refuse', label: 'Deny the House the power to decide', outcome: 'You refuse its painless blank slate. The ledger survives in many imperfect hands; every future wish will have to contend with them.' },
    ],
  ),
  '2,5': scene(
    '2,5', 'The Photograph with Two Shadows',
    'The Earth photo still shows Morrow carrying a box from the research office. A second shadow suggests someone tried to help. The image was true; your interpretation of it was incomplete.',
    'Contemporary research office photograph seen through ghostly forest mirror, androgynous Morrow with moving box and another person reaching from doorway, no text.',
    [
      { id: 'question', label: 'Ask who took the photograph', outcome: 'The photographer had come to offer a lift. You cannot recover their reply from the image alone, and finally stop treating photographs as verdicts.' },
      { id: 'preserve', label: 'Keep both shadows in the Chronicle', outcome: 'The contradictory evidence survives. This matters when a future asks you to erase a scene you dislike.' },
    ],
    { key: '2,5', choice: 'archive', line: 'You archived the original photo; the negative reveals the helping hand outside its frame.', alternate: 'The photo you left behind has returned anyway, complete with a hand the first print excluded.' },
  ),
  '2,6': scene(
    '2,6', 'The Rune That Reads Backward',
    'Leaf, leaf, sun becomes sun, leaf, leaf when the stones are held up to the sky. The inscription was not wrong. It was written for somebody walking in the other direction.',
    'Three rune stones alongside reflected river, leaf and sun pictograms rearranged in reverse order, luminous moss, no words.',
    [
      { id: 'reverse', label: 'Solve the sequence from the other shore', outcome: 'The stones open a shortcut from the dark camp to the old witness road. A familiar solution becomes useful only after changing viewpoint.' },
      { id: 'guide', label: 'Leave a two-sided clue for future travelers', outcome: 'Both sequences glow. Nobody else has to guess which bank the author considered the beginning.' },
    ],
  ),
  '3,6': scene(
    '3,6', 'The Cache That Already Paid',
    'The wildflowers are gone from the creekside chest. An old receipt says they were used to buy medicine for someone who never knew a stranger had saved them.',
    'Open mossy treasure box by a river containing only a silver receipt and one pressed wildflower, moonlit water, no text.',
    [
      { id: 'follow', label: 'Find the person who received the medicine', outcome: 'The recipient remembers waking without fever. They cannot repay a gift they never requested, and they shouldn’t have to.' },
      { id: 'honor', label: 'Leave the gift anonymous', outcome: 'For the first time, a treasure chest teaches you what is valuable about something you cannot reclaim.' },
    ],
  ),
  '4,6': scene(
    '4,6', 'The People the Warden Forgot',
    'Three witnesses disagree about which monsters attacked the village. They agree on one point: the House took a memory as payment from each of them, and called their gratitude consent.',
    'Three distinct adult witnesses gathered at a ruined bridge, fading storybook memories hovering in glass lanterns, faint manor in distance, no letters.',
    [
      { id: 'hear', label: 'Hear all three incompatible accounts', outcome: 'The details contradict; the pattern does not. Each was offered rescue without being told its price.' },
      { id: 'protect', label: 'Let the witnesses choose a spokesperson', outcome: 'They elect the quietest among them. The House will hear their evidence without deciding who must speak.' },
    ],
  ),
  '4,5': scene(
    '4,5', 'The Bridge That Never Burned',
    'In the first Briar you believed a bridge had burned. Here it has never been built, but ash lies beneath the river. Someone remembered a disaster so vividly that nobody dared build it.',
    'Ash swirling below pristine river with absent wooden bridge, waiting workmen on banks of dark fairy forest, atmospheric cinematic landscape, no text.',
    [
      { id: 'build', label: 'Help build a cautious crossing', outcome: 'The workers set safety rules based on a disaster none can prove. Memory becomes a warning instead of a prison.' },
      { id: 'study', label: 'Follow the ash to its source', outcome: 'You discover the river is carrying discarded imagined futures from the House. Your missing bridge may exist in one of them.' },
    ],
  ),
  '3,5': scene(
    '3,5', 'A Traveler Who Took the Other Road',
    'The traveler you directed into the marsh is alive, but carries a map of a life in which you sent them home instead. Both paths have left scars. They want a say in where they go next.',
    'Rugged adult wayfarer holding two overlapping translucent road maps through mirrored shadow-marsh, warm distant firelight, no text.',
    [
      { id: 'apologize', label: 'Own your choice without claiming their future', outcome: 'The traveler accepts your honesty and chooses a third road. It is not the road you would have picked.' },
      { id: 'ask', label: 'Ask what they actually wanted', outcome: 'To be consulted, they say. Your attempt to help was real, and so was the harm of deciding for them.' },
    ],
  ),
}

export const DARK_BRIAR_KEYS = Object.keys(DARK_BRIAR_SCENES)

export const DARK_BRIAR_WITNESSES = ['2,5', '4,4', '4,6', '5,2'] as const
export const DARK_BRIAR_CLIMAX = '6,2'

export interface DarkBriarProgress {
  version: 1
  phase: 'matching' | 'exploring'
  mapCards: BriarMapCard[]
  revealed: string[]
  visited: string[]
  player: string
  sceneChoices: Record<string, string>
  attempts: number
  completed: boolean
  status: string
}

export function newDarkBriarProgress(): DarkBriarProgress {
  return {
    version: 1, phase: 'matching', mapCards: [], revealed: [], visited: [],
    player: BRIAR_START, sceneChoices: {}, attempts: 0, completed: false,
    status: 'The forest remembers different things. Match the paired pictures to find its altered roads.',
  }
}

export function restoreDarkBriarProgress(input: unknown): DarkBriarProgress {
  const initial = newDarkBriarProgress()
  if (!input || typeof input !== 'object') return initial
  const saved = input as Partial<DarkBriarProgress>
  const keyset = new Set(DARK_BRIAR_KEYS)
  const validKeys = (value: unknown) => Array.isArray(value)
    ? [...new Set(value.filter((key): key is string => typeof key === 'string' && keyset.has(key)))]
    : []
  const cards = Array.isArray(saved.mapCards) && saved.mapCards.length === DARK_BRIAR_KEYS.length
    ? saved.mapCards
    : []
  const validCards = cards.length === DARK_BRIAR_KEYS.length
    && new Set(cards.map((card) => card.tile)).size === DARK_BRIAR_KEYS.length
    && cards.every((card) => keyset.has(card.tile) && typeof card.image === 'string'
      && typeof card.pairId === 'number' && typeof card.matched === 'boolean')
    && [...new Set(cards.map((card) => card.pairId))].every(
      (pairId) => cards.filter((card) => card.pairId === pairId).length === 2,
    )
  const mapCards = validCards ? cards.map((card) => ({
    ...card, flipped: Boolean(card.matched), matched: Boolean(card.matched),
  })) : []
  const revealed = mapCards.filter((card) => card.matched).map((card) => card.tile)
  const allMatched = mapCards.length > 0 && mapCards.every((card) => card.matched)
  const choices: Record<string, string> = {}
  if (saved.sceneChoices && typeof saved.sceneChoices === 'object') {
    for (const [key, choice] of Object.entries(saved.sceneChoices)) {
      if (DARK_BRIAR_SCENES[key]?.choices.some((c) => c.id === choice)) choices[key] = choice
    }
  }
  const visited = validKeys(saved.visited).filter((key) => revealed.includes(key))
  const player = typeof saved.player === 'string' && visited.includes(saved.player)
    ? saved.player : BRIAR_START
  return {
    ...initial, mapCards, phase: allMatched ? 'exploring' : 'matching',
    revealed, visited, player, sceneChoices: choices,
    attempts: Number.isSafeInteger(saved.attempts) && (saved.attempts ?? 0) >= 0
      ? saved.attempts! : 0,
    completed: Boolean(choices[DARK_BRIAR_CLIMAX]) && allMatched,
    status: typeof saved.status === 'string' ? saved.status.slice(0, 450) : initial.status,
  }
}

export function darkBriarCanTravel(from: string, to: string, revealed: readonly string[]): boolean {
  return DARK_BRIAR_SCENES[to] !== undefined && briarConnected(from, to, revealed)
}

export function darkBriarOpening(scene: DarkBriarScene, original: BriarSave): string {
  const echo = scene.originalCallback
  if (!echo) return scene.opening
  return `${scene.opening} ${original.sceneChoices[echo.key] === echo.choice ? echo.line : echo.alternate}`
}

export function darkBriarCanChoose(progress: DarkBriarProgress, key: string): boolean {
  if (progress.phase !== 'exploring' || progress.player !== key
    || !progress.visited.includes(key) || Boolean(progress.sceneChoices[key])) return false
  if (key === DARK_BRIAR_CLIMAX) {
    return DARK_BRIAR_WITNESSES.every((witness) => Boolean(progress.sceneChoices[witness]))
  }
  return Boolean(DARK_BRIAR_SCENES[key])
}

export function darkBriarChoose(progress: DarkBriarProgress, key: string, choiceId: string): DarkBriarProgress {
  const sceneAt = DARK_BRIAR_SCENES[key]
  if (!sceneAt || !darkBriarCanChoose(progress, key)
    || !sceneAt.choices.some((choice) => choice.id === choiceId)) return progress
  const ending = key === DARK_BRIAR_CLIMAX
  return {
    ...progress, sceneChoices: { ...progress.sceneChoices, [key]: choiceId },
    completed: ending || progress.completed,
    status: sceneAt.choices.find((choice) => choice.id === choiceId)!.outcome,
  }
}

export function validateDarkBriarSlice(): string[] {
  const errors: string[] = []
  if (DARK_BRIAR_KEYS.length !== 16) errors.push('The pilot must have sixteen authored encounters')
  if (!DARK_BRIAR_KEYS.includes(BRIAR_START)) errors.push('Missing canonical Briar start')
  if (!DARK_BRIAR_KEYS.includes(DARK_BRIAR_CLIMAX)) errors.push('Missing mirrored House')
  const full = new Set(DARK_BRIAR_KEYS)
  for (const site of Object.values(DARK_BRIAR_SCENES)) {
    if (!BRIAR_TILES.some((tile) => tile.key === site.key)) errors.push(`Out-of-bounds site ${site.key}`)
    if (site.choices.length !== 2 || site.choices[0].id === site.choices[1].id
      || !site.choices.every((choice) => choice.label && choice.outcome)) {
      errors.push(`Missing two different outcomes at ${site.key}`)
    }
    if (!site.artPrompt || !site.opening) errors.push(`Missing story/art at ${site.key}`)
    if (!briarConnected(BRIAR_START, site.key, [...full])) {
      errors.push(`Unreachable Dark Briar location ${site.key}`)
    }
  }
  return errors
}
