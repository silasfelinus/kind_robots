export type Attribute = 'steel' | 'sense' | 'shadow' | 'mercy'
export type Choice = {
  id: string
  label: string
  to: string
  requires?: string
  gain?: string
  spend?: string
  flag?: string
  heal?: number
  cost?: number
  check?: {
    attribute: Attribute
    target: number
    success: string
    failure: string
  }
}
export type Scene = {
  id: string
  chapter: string
  title: string
  text: string
  art: string
  choices?: Choice[]
  battle?: {
    name: string
    hp: number
    guard: number
    attack: number
    win: string
    lose: string
  }
  ending?: 'hope' | 'bittersweet' | 'dark'
}
export type Roll = {
  dice: [number, number]
  modifier: number
  target: number
  total: number
  success: boolean
  label: string
}
export type Battle = { hp: number; exposed: boolean; turn: number; log: string }
export type Run = {
  version: 1
  sceneId: string
  health: number
  resolve: number
  attributes: Record<Attribute, number>
  items: string[]
  flags: string[]
  seed: number
  visited: string[]
  endings: string[]
  battle: Battle | null
  lastRoll: Roll | null
}

const make = (
  id: string,
  chapter: string,
  title: string,
  art: string,
  text: string,
  choices?: Choice[],
  ending?: Scene['ending'],
  battle?: Scene['battle'],
): Scene => ({
  id,
  chapter,
  title,
  art,
  text,
  choices,
  ending,
  battle,
})

export const BOOK: Record<string, Scene> = {
  'the-crossing': make(
    'the-crossing',
    'I · WATERS',
    'The Thirsting Road',
    'waterhole',
    'Heat holds the valley by its throat. Beneath a sickle of red stone, a narrow watering hole has survived the summer. A one-eyed coyote watches from the far bank. The hilt of your sword casts a thin shadow over your shoulder. Nothing moves beneath the black water. That, perhaps, is the troubling part.',
    [
      {
        id: 'approach',
        label: 'Approach the stranger. Offer the last of your water.',
        to: 'coyote',
        requires: 'water',
        spend: 'water',
        flag: 'coyote-kindness',
      },
      {
        id: 'listen',
        label: 'Study the ripples before you step closer. (Sense · 9)',
        to: 'crocodile',
        check: {
          attribute: 'sense',
          target: 9,
          success: 'hidden-pool',
          failure: 'crocodile',
        },
      },
      {
        id: 'avoid',
        label: 'Leave the water and follow the long dust road.',
        to: 'dust-road',
      },
    ],
  ),
  'hidden-pool': make(
    'hidden-pool',
    'I · WATERS',
    'The Thing Below',
    'ripples',
    'A disturbance travels against the wind. The silhouette beneath the surface is longer than your sword. You find a ledge above the bank, giving you a heartbeat to prepare while the coyote remains oblivious.',
    [
      {
        id: 'warn',
        label: 'Warn the coyote and draw from high ground.',
        to: 'crocodile',
        flag: 'coyote-warned',
      },
      {
        id: 'withdraw',
        label: 'Slip away before the surface breaks.',
        to: 'dust-road',
      },
    ],
  ),
  coyote: make(
    'coyote',
    'I · WATERS',
    'An Unsteady Truce',
    'coyote',
    'The coyote accepts the canteen without lowering his one good eye. His coat is patched beyond repair. You see a revolver at his right hip, but his fingers tremble with thirst. He passes the canteen back. An impossible ripple splits the water behind him.',
    [
      {
        id: 'defend',
        label: 'Pull him clear and stand your ground.',
        to: 'crocodile',
        flag: 'coyote-warned',
      },
      {
        id: 'alone',
        label: 'Trust him to run. Take the ridge path.',
        to: 'dust-road',
      },
    ],
  ),
  crocodile: make(
    'crocodile',
    'I · WATERS',
    'The Water Has Teeth',
    'crocodile',
    'The surface erupts. An enormous river crocodile tears from the shallows, its jaw wide enough to swallow your kasa. The coyote falls backward, reaching for his gun. There is no time for another plan.',
    undefined,
    undefined,
    {
      name: 'River Crocodile',
      hp: 8,
      guard: 1,
      attack: 3,
      win: 'aftermath',
      lose: 'ending-water',
    },
  ),
  aftermath: make(
    'aftermath',
    'I · WATERS',
    'What Mercy Costs',
    'coyote-wounded',
    'The river falls still. The coyote sits in the dust, his right wrist badly injured. He flinches at your approach, then notices the bandage in your hand. Beyond the ridge, a bell tolls once and stops.',
    [
      {
        id: 'bandage',
        label: 'Bind the wound, leaving your bandage behind.',
        to: 'hollow-bell',
        requires: 'bandage',
        spend: 'bandage',
        flag: 'coyote-trust',
      },
      {
        id: 'apple',
        label: 'Leave an apple and travel on.',
        to: 'hollow-bell',
        requires: 'apple',
        spend: 'apple',
        flag: 'coyote-kindness',
      },
      {
        id: 'road',
        label: 'Save your supplies for the road ahead.',
        to: 'hollow-bell',
      },
    ],
  ),
  'dust-road': make(
    'dust-road',
    'II · ASHES',
    'The Long Way Round',
    'dust-road',
    'You let the water remain a mystery. The trail climbs through dry gullies, where bleached roots hold the dust together. At dusk you discover smoke on the horizon. A hollow bell tower stands over a town that should have been alive.',
    [
      { id: 'hurry', label: 'Descend before the sun dies.', to: 'hollow-bell' },
      {
        id: 'rest',
        label: 'Make a cold camp and recover your breath.',
        to: 'hollow-bell',
        heal: 2,
      },
    ],
  ),
  'hollow-bell': make(
    'hollow-bell',
    'II · ASHES',
    'Hollow Bell',
    'hollow-bell',
    'The town has fallen silent. Empty doors turn on broken hinges. You remove your wide hat in the main street. Something small moves beneath a burned boardwalk. Farther on, a wall is layered with old missing-child posters.',
    [
      { id: 'search', label: 'Kneel beside the boardwalk.', to: 'survivors' },
      {
        id: 'posters',
        label: 'Read the wall before following the sound.',
        to: 'posters',
        flag: 'poster-clue',
      },
    ],
  ),
  survivors: make(
    'survivors',
    'III · THE FOLLOWERS',
    'Teeth and Tears',
    'siblings',
    'Two fennec children emerge from the dark. The older sister, taller than you, wraps her arms around a toddler. Her clothes are ripped by claws and thorn. She bears her teeth when you reach toward them. There is no trust to spend here, only trust to earn.',
    [
      {
        id: 'feed',
        label: 'Set a dry apple on the planks. Then step away.',
        to: 'apple-tree',
        requires: 'apple',
        spend: 'apple',
        flag: 'siblings-fed',
      },
      {
        id: 'wait',
        label: 'Retreat without speaking and let them follow.',
        to: 'apple-tree',
        flag: 'siblings-follow',
      },
      {
        id: 'leave',
        label: 'Keep walking alone. You cannot save everyone.',
        to: 'ending-alone',
      },
    ],
  ),
  'apple-tree': make(
    'apple-tree',
    'III · THE FOLLOWERS',
    'Fruit in the Wasteland',
    'apple-tree',
    'A lone apple tree grows where nothing should. Behind you, two small silhouettes stop when you stop. You gather what fruit you can carry, leave the best on a flat rock, and walk on without turning. The path eventually reaches a mission with a playground choked in cobwebs.',
    [
      {
        id: 'take',
        label: 'Keep one apple and enter the mission.',
        to: 'mission',
        gain: 'apple',
        flag: 'siblings-follow',
      },
      {
        id: 'watch',
        label: 'Watch the mission gates from hiding. (Shadow · 9)',
        to: 'mission',
        check: {
          attribute: 'shadow',
          target: 9,
          success: 'cellar',
          failure: 'mission',
        },
      },
    ],
  ),
  mission: make(
    'mission',
    'IV · THE VEIL',
    'The Kindly Mission',
    'mission',
    'The abbess bows with a face as placid as still water. Inside, the children are led to a table of hot food. Outside, the rusted merry-go-round has not moved in years. There are no footprints in the dust leading away from the orphanage.',
    [
      {
        id: 'investigate',
        label: 'Look for a back entrance. (Sense · 11)',
        to: 'cellar',
        check: {
          attribute: 'sense',
          target: 11,
          success: 'cellar',
          failure: 'posters',
        },
      },
      {
        id: 'town',
        label: 'Walk to town and examine the missing posters.',
        to: 'posters',
        flag: 'abbess-suspicion',
      },
      {
        id: 'go',
        label: 'Accept the abbess at her word and depart.',
        to: 'ending-alone',
      },
    ],
  ),
  posters: make(
    'posters',
    'IV · THE VEIL',
    'The Wall of Names',
    'posters-boardwalk',
    'Under lantern light, the painted faces of missing children look back. The posters name the mission. Every narrow lane seems to point back toward it. The bell tolls again from a town that has no bell ringer.',
    [
      {
        id: 'return',
        label: 'Return through the mission cellar.',
        to: 'cellar',
        flag: 'poster-clue',
      },
      {
        id: 'warning',
        label: 'Warn the nearby settlements and escape.',
        to: 'ending-warning',
      },
    ],
  ),
  cellar: make(
    'cellar',
    'V · THE DARK',
    'Under the Floorboards',
    'altar',
    'A narrow passage descends beneath the mission. Candles burn around an old stone door. Beyond it you hear the muffled cries of the siblings and a voice chanting. Your reflection in a polished bowl shows a blade descending from the darkness.',
    [
      {
        id: 'charge',
        label: 'Draw the sword and confront the abbess.',
        to: 'abbess',
      },
      {
        id: 'slip',
        label: 'Slip past the altar guard. (Shadow · 11)',
        to: 'abbess',
        check: {
          attribute: 'shadow',
          target: 11,
          success: 'rescue',
          failure: 'abbess',
        },
      },
    ],
  ),
  abbess: make(
    'abbess',
    'V · THE DARK',
    'A Knife Behind a Prayer',
    'abbess-crypt',
    'The abbess casts aside her robes. A dagger glints in the candlelight. The altar behind her begins to shake; a shape presses against reality from the other side. She means to buy time with your blood.',
    undefined,
    undefined,
    {
      name: 'The Abbess',
      hp: 9,
      guard: 2,
      attack: 3,
      win: 'rescue',
      lose: 'ending-altar',
    },
  ),
  rescue: make(
    'rescue',
    'V · THE DARK',
    'The Choice That Remains',
    'sister-dagger',
    'The children are alive. Behind them the torn air opens wider, hungry for the world. The sister stands with a dagger in her shaking hand. There is time to flee. There may also be enough time to close the breach, at a price.',
    [
      {
        id: 'together',
        label: 'Carry the toddler into the dawn, all three together.',
        to: 'ending-three',
        flag: 'siblings-saved',
      },
      {
        id: 'seal',
        label: 'Spend your last strength to seal the breach. (2 Resolve)',
        to: 'ending-seal',
        cost: 2,
        flag: 'portal-closed',
      },
    ],
  ),
  'ending-water': make(
    'ending-water',
    'AN ENDING',
    'Silence Beneath the Surface',
    'kasa-on-water',
    'The watering hole returns to stillness. Two hats drift on the black water. Nobody will tell the story of the stranger who almost changed this place.',
    undefined,
    'dark',
  ),
  'ending-alone': make(
    'ending-alone',
    'AN ENDING',
    'One Shadow on the Road',
    'zuzu-moon',
    'At sunrise your tracks run east, alone. The smallest footprints vanish behind you. You survived; the shape of what you left undone will travel farther than you do.',
    undefined,
    'bittersweet',
  ),
  'ending-warning': make(
    'ending-warning',
    'AN ENDING',
    'The Unheard Warning',
    'shuttered-town',
    'You carry news to the neighboring towns. More than one family bolts its doors before nightfall. You cannot be sure who escaped the mission, but your warning will not be forgotten.',
    undefined,
    'bittersweet',
  ),
  'ending-altar': make(
    'ending-altar',
    'AN ENDING',
    'The Bell Without a Ringer',
    'empty-gate',
    'The bell calls out across the wasteland. No hand holds its rope. By dawn, there is no trace of the mission beyond its broken gate.',
    undefined,
    'dark',
  ),
  'ending-three': make(
    'ending-three',
    'AN ENDING',
    'Three Small Shadows',
    'three-road',
    'The mission burns behind the ridge. The sister takes the toddler’s hand. You walk ahead, then slow your step until three shadows fall together along the road. Nothing is settled. Something has begun.',
    undefined,
    'hope',
  ),
  'ending-seal': make(
    'ending-seal',
    'AN ENDING',
    'What the Desert Keeps',
    'kneeling-blade',
    'The breach folds inward. The abbess’s bell cracks and falls silent. When the children look back, they see you alive, on your knees, the sword blackened. The road will be longer. There will be a road.',
    undefined,
    'hope',
  ),
}

export function scene(id: string): Scene {
  const found = BOOK[id]
  if (!found) throw new Error('Unknown gamebook scene: ' + id)
  return found
}

export function startRun(seed: number): Run {
  return {
    version: 1,
    sceneId: 'the-crossing',
    health: 12,
    resolve: 4,
    attributes: { steel: 2, sense: 1, shadow: 1, mercy: 0 },
    items: ['water', 'bandage', 'apple', 'flint'],
    flags: [],
    seed: seed || 1,
    visited: ['the-crossing'],
    endings: [],
    battle: null,
    lastRoll: null,
  }
}

function roll(seed: number): { seed: number; dice: [number, number] } {
  let x = seed >>> 0 || 1
  const next = () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) % 6) + 1
  }
  const dice: [number, number] = [next(), next()]
  return { seed: x >>> 0, dice }
}

function enter(run: Run, target: string): Run {
  const node = scene(target)
  const endings =
    node.ending && !run.endings.includes(target)
      ? [...run.endings, target]
      : run.endings
  return {
    ...run,
    sceneId: target,
    endings,
    visited: [...run.visited, target],
    battle: node.battle
      ? {
          hp: node.battle.hp,
          exposed: false,
          turn: 1,
          log: 'A foe bars your path.',
        }
      : null,
  }
}

export function takeChoice(run: Run, id: string): Run {
  if (run.battle || scene(run.sceneId).ending) return run
  const choice = scene(run.sceneId).choices?.find((c) => c.id === id)
  if (
    !choice ||
    (choice.requires && !run.items.includes(choice.requires)) ||
    (choice.spend && !run.items.includes(choice.spend)) ||
    (choice.cost && run.resolve < choice.cost)
  )
    return run
  let next: Run = {
    ...run,
    items: [...run.items],
    flags: [...run.flags],
    resolve: run.resolve - (choice.cost ?? 0),
    health: Math.min(12, run.health + (choice.heal ?? 0)),
    lastRoll: null,
  }
  if (choice.spend) next.items.splice(next.items.indexOf(choice.spend), 1)
  if (choice.gain && next.items.length < 5) next.items.push(choice.gain)
  if (choice.flag && !next.flags.includes(choice.flag))
    next.flags.push(choice.flag)
  let target = choice.to
  if (choice.check) {
    const result = roll(run.seed)
    const modifier = run.attributes[choice.check.attribute]
    const total = result.dice[0] + result.dice[1] + modifier
    next = {
      ...next,
      seed: result.seed,
      lastRoll: {
        dice: result.dice,
        modifier,
        total,
        target: choice.check.target,
        success: total >= choice.check.target,
        label: choice.check.attribute.toUpperCase(),
      },
    }
    target =
      total >= choice.check.target ? choice.check.success : choice.check.failure
  }
  return enter(next, target)
}

export type BattleAction = 'strike' | 'guard' | 'feint' | 'quiet-draw'
export function fight(run: Run, action: BattleAction): Run {
  const enemy = scene(run.sceneId).battle
  const battle = run.battle
  if (!enemy || !battle || (action === 'quiet-draw' && run.resolve < 2))
    return run
  const result = roll(run.seed)
  const modifier =
    action === 'feint'
      ? run.attributes.shadow
      : action === 'guard'
        ? run.attributes.sense
        : run.attributes.steel
  const target =
    action === 'guard' ? 8 : 7 + enemy.guard - (battle.exposed ? 2 : 0)
  const total = result.dice[0] + result.dice[1] + modifier
  const success = total >= target
  const damage =
    action === 'guard'
      ? 0
      : success
        ? action === 'feint'
          ? 1
          : action === 'quiet-draw'
            ? 6
            : 3
        : 0
  const enemyHp = Math.max(0, battle.hp - damage)
  const incoming =
    enemyHp === 0
      ? 0
      : action === 'guard' && success
        ? 0
        : action === 'guard'
          ? 1
          : Math.max(1, enemy.attack - (success && action === 'feint' ? 1 : 0))
  const health = Math.max(0, run.health - incoming)
  const next: Run = {
    ...run,
    health,
    seed: result.seed,
    resolve: run.resolve - (action === 'quiet-draw' ? 2 : 0),
    lastRoll: {
      dice: result.dice,
      modifier,
      target,
      total,
      success,
      label: action.toUpperCase(),
    },
    battle: {
      hp: enemyHp,
      exposed: action === 'feint' && success,
      turn: battle.turn + 1,
      log:
        (success ? 'Your move connects.' : 'Your move fails.') +
        (incoming
          ? ' You suffer ' + incoming + ' damage.'
          : ' You avoid the counterblow.'),
    },
  }
  if (!health) return enter(next, enemy.lose)
  if (!enemyHp) return enter(next, enemy.win)
  return next
}

export function isSavedRun(value: unknown): value is Run {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<Run>
  return (
    s.version === 1 &&
    typeof s.sceneId === 'string' &&
    !!BOOK[s.sceneId] &&
    typeof s.seed === 'number' &&
    Number.isFinite(s.seed) &&
    typeof s.health === 'number' &&
    s.health >= 0 &&
    s.health <= 12 &&
    typeof s.resolve === 'number' &&
    s.resolve >= 0 &&
    s.resolve <= 4 &&
    !!s.attributes &&
    ['steel', 'sense', 'shadow', 'mercy'].every((k) =>
      Number.isFinite(s.attributes?.[k as Attribute]),
    ) &&
    Array.isArray(s.items) &&
    s.items.length <= 5 &&
    s.items.every((x) => typeof x === 'string') &&
    Array.isArray(s.flags) &&
    s.flags.every((x) => typeof x === 'string') &&
    Array.isArray(s.visited) &&
    Array.isArray(s.endings) &&
    s.visited.every((x) => typeof x === 'string' && !!BOOK[x]) &&
    s.endings.every((x) => typeof x === 'string' && !!BOOK[x]?.ending) &&
    (s.battle === null ||
      (!!s.battle &&
        !!BOOK[s.sceneId]?.battle &&
        typeof s.battle.hp === 'number' &&
        Number.isFinite(s.battle.hp) &&
        s.battle.hp >= 0)) &&
    (s.lastRoll === null ||
      (!!s.lastRoll &&
        Array.isArray(s.lastRoll.dice) &&
        s.lastRoll.dice.length === 2))
  )
}
