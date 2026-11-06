/*
 * What a card or a pack slot costs and does, in words a player can read on a phone (t-008 UI polish). The engine
 * in adventure.ts decides; these lines only describe what it will do, so each one is pinned by a test against it.
 */
import {
  checkChance,
  checkModifier,
  moveCheck,
  scene,
  SLOTS,
  type BattleAction,
} from './adventure'
import type { Choice, Run } from './types'

export type ItemInfo = {
  /** What the pack slot is called on the sheet. */
  name: string
  /** What it is for. */
  use: string
  /** When it leaves the pack. */
  spent: string
}

/** Every item the book hands out, asks for or takes (the test keeps this list complete). */
export const ITEM_INFO: Record<string, ItemInfo> = {
  water: {
    name: 'Canteen of water',
    use: 'Water to share with someone thirstier than you.',
    spent:
      'Gone once you give it or pour it out; the road may refill it later.',
  },
  bandage: {
    name: 'Bandage',
    use: "Clean linen to bind a wound, yours or someone else's, or to trade.",
    spent: 'Used up when you bind a wound or trade it.',
  },
  apple: {
    name: 'Dried apple',
    use: 'Food to give away, trade or leave as payment.',
    spent: 'Gone once you give, trade or leave it.',
  },
  flint: {
    name: 'Flint',
    use: 'Strikes a small fire at a cold camp, for a warm rest.',
    spent: 'Kept when you light a fire; gone only if you trade it.',
  },
}

/** An item's sheet entry; an item the list does not know yet still gets a readable one. */
export function itemInfo(item: string): ItemInfo {
  return (
    ITEM_INFO[item] ?? {
      name: item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, ' '),
      use: 'Something picked up on the road.',
      spent: 'Kept until a choice asks for it.',
    }
  )
}

const ATTRIBUTE_NAMES = {
  steel: 'Steel',
  sense: 'Sense',
  shadow: 'Shadow',
  mercy: 'Mercy',
} as const

const signed = (n: number) => (n < 0 ? '- ' + -n : '+ ' + n)

/**
 * A label's rules note less the roll it restates: the card already quotes that roll with its odds ("Sense 9+ ·
 * 42%"), so "(Sense · 9; fail: hurt, cornered)" leaves only "Fail: hurt, cornered". A note that names some other
 * roll than the choice's own check is left whole, and a note with nothing beyond the roll leaves nothing.
 */
export function noteBeyondRoll(
  note: string | undefined,
  check: Choice['check'],
): string | undefined {
  if (!note) return undefined
  const match = /^(\w+) · (\d+)\s*(?:;\s*(.*))?$/.exec(note.trim())
  if (
    !check ||
    !match ||
    match[1] !== ATTRIBUTE_NAMES[check.attribute] ||
    Number(match[2]) !== check.target
  )
    return note
  const rest = (match[3] ?? '').trim().replace(/^failure:/i, 'fail:')
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : undefined
}

/**
 * The short chip parts and longer caption lines for a story choice: the roll and its odds, the Resolve it costs,
 * the item it uses or needs, the health it restores and the find it brings. A part the label's own note already
 * names (e.g. "(2 Resolve)") is not repeated in the chip.
 */
export function choiceTerms(
  run: Run,
  choice: Choice,
  note = '',
): { chip: string[]; details: string[] } {
  const said = note.toLowerCase()
  const chip: string[] = []
  const details: string[] = []
  const check = choice.check
  if (check) {
    const { modifier, bonus } = checkModifier(run, check)
    const chance = checkChance(modifier, check.target)
    const name = ATTRIBUTE_NAMES[check.attribute]
    chip.push(name + ' ' + check.target + '+ · ' + chance + '%')
    details.push(
      'Roll 2d6 ' +
        signed(run.attributes[check.attribute]) +
        ' ' +
        name +
        (bonus ? ' ' + signed(bonus) + ' for what you know' : '') +
        ', needing ' +
        check.target +
        ': about ' +
        chance +
        '% to succeed.',
    )
  }
  if (choice.cost) {
    if (!said.includes('resolve')) chip.push(choice.cost + ' Resolve')
    details.push(
      'Costs ' +
        choice.cost +
        ' Resolve (you have ' +
        run.resolve +
        '). Some moments on the road restore it.',
    )
  }
  const spend = choice.spend ? itemInfo(choice.spend) : null
  if (choice.spend && spend) {
    if (
      !said.includes(choice.spend) &&
      !said.includes(spend.name.toLowerCase())
    )
      chip.push('Uses ' + choice.spend)
    details.push('Uses up your ' + spend.name.toLowerCase() + '.')
  } else if (choice.requires) {
    chip.push('Needs ' + choice.requires)
    details.push(
      'Needs your ' +
        itemInfo(choice.requires).name.toLowerCase() +
        '; you keep it.',
    )
  }
  if (choice.heal) {
    chip.push('+' + choice.heal + ' HP')
    details.push('Restores up to ' + choice.heal + ' health.')
  }
  if (choice.gain) {
    const find = itemInfo(choice.gain).name.toLowerCase()
    chip.push('Gain ' + choice.gain)
    details.push(
      run.items.length >= SLOTS
        ? 'Finds a ' +
            find +
            '; your pack is full, so you will choose what to leave.'
        : 'Adds a ' + find + ' to your pack.',
    )
  }
  return { chip, details }
}

/** A combat move card: its roll and odds this round, and what a hit or a miss costs each side. */
export function moveTerms(
  run: Run,
  action: BattleAction,
): { chip: string; hint: string; details: string[] } | null {
  const check = moveCheck(run, action)
  const foe = scene(run.sceneId).battle
  if (!check || !foe) return null
  const chance = checkChance(check.modifier, check.target)
  const roll =
    ATTRIBUTE_NAMES[check.attribute] +
    ' ' +
    check.target +
    '+ · ' +
    chance +
    '%'
  const back = foe.attack
  const feintBack = Math.max(1, back - 2)
  const odds =
    'Roll 2d6 ' +
    signed(check.modifier) +
    ' ' +
    ATTRIBUTE_NAMES[check.attribute] +
    ', needing ' +
    check.target +
    ': about ' +
    chance +
    '%.'
  if (action === 'guard')
    return {
      chip: roll,
      hint: 'Block · opens the foe',
      details: [
        odds,
        'Held: you take no wound and the next attack needs 2 less.',
        'Slipped: you take 1.',
      ],
    }
  if (action === 'feint')
    return {
      chip: roll,
      hint: '3 dmg · opens the foe',
      details: [
        odds,
        'Hit: 3 damage, you take ' +
          feintBack +
          ', and the next attack needs 2 less.',
        'Miss: you take ' + back + '.',
      ],
    }
  const damage = action === 'quiet-draw' ? 5 : 3
  return {
    chip: (action === 'quiet-draw' ? '2 Resolve · ' : '') + roll,
    hint: damage + ' dmg · you take ' + back,
    details: [
      odds,
      'Hit: ' +
        damage +
        ' damage. Hit or miss, you take ' +
        back +
        ' unless the foe falls.',
      ...(action === 'quiet-draw'
        ? ['Costs 2 Resolve (you have ' + run.resolve + ').']
        : []),
    ],
  }
}
