import { factionPower } from './alliance'
import { clashCardText, clashLevel, type ClashState } from './clash'
import { clashTwistText } from './clashTwists'
import { cardById, type Side, type TeamId } from './prototypes'

export type ClashSpectacleGrade = 'flash' | 'feature' | 'legend'
export type ClashSpectacleKind = 'play' | 'strike' | 'power' | 'victory'

export interface ClashSpectacle {
  kind: ClashSpectacleKind
  grade: ClashSpectacleGrade
  side: Side
  lane: number
  crew: TeamId | 'mercenary'
  cardId: string | null
  eyebrow: string
  title: string
  detail: string
}

const rivalOf = (side: Side): Side =>
  side === 'player' ? 'enemy' : 'player'

/**
 * Translate committed, replayable commands into cosmetic VFX cues.
 * No extra RNG, hidden state, combat effects, or timers in the rules engine.
 */
export function clashSpectacle(
  before: ClashState,
  after: ClashState,
): ClashSpectacle | null {
  if (after.commands.length !== before.commands.length + 1) return null
  const command = after.commands[after.commands.length - 1]!
  if (command.t === 'play') {
    const card = cardById(command.card)
    const level = clashLevel(before, command.side, card.id)
    const newlySummoned = after.units.filter(
      (u) =>
        u.side === command.side &&
        !before.units.some((previous) => previous.uid === u.uid),
    ).length
    const levelThree = level === 3
    const evolvedTwist = level > 1 && !!clashTwistText(card.id, level)
    const grade: ClashSpectacleGrade = levelThree
      ? 'legend'
      : evolvedTwist || card.signature || newlySummoned > 1
        ? 'feature'
        : 'flash'
    const isReplacement =
      card.kind === 'creature' &&
      before.units.some(
        (u) => u.side === command.side && u.lane === command.lane,
      )
    const detail =
      newlySummoned > 1
        ? `${newlySummoned} fighters take the field`
        : isReplacement && card.id === 'broker' && level > 1
          ? 'A sacrifice pays for a stronger body'
          : clashTwistText(card.id, level) ||
            clashCardText(card, level) ||
            'A new challenger enters the arena'
    return {
      kind: 'play',
      grade,
      side: command.side,
      lane: command.lane,
      crew: card.team,
      cardId: card.id,
      eyebrow: levelThree
        ? 'LEVEL THREE · FINAL FORM'
        : level === 2
          ? 'LEVEL TWO · EVOLVED'
          : card.kind === 'creature'
            ? 'NEW CHALLENGER'
            : card.kind === 'trap'
              ? 'SECRET WEAPON'
              : 'POWER PLAY',
      title: card.name,
      detail,
    }
  }
  if (command.t === 'power') {
    const power = factionPower(before.teams[command.side])
    return {
      kind: 'power',
      grade: 'legend',
      side: command.side,
      lane: command.lane,
      crew: before.teams[command.side],
      cardId: null,
      eyebrow: 'ALLIANCE · ONE-TIME POWER',
      title: power.name,
      detail: power.text,
    }
  }
  if (command.t !== 'strike' || !after.strike) return null
  const hit = after.strike
  const card = cardById(hit.trap ?? hit.attacker)
  const knockout = hit.attackerFell || hit.defenderFell
  const lethal =
    after.victor !== null && before.victor === null
  const grade: ClashSpectacleGrade = lethal || hit.dealt >= 9
    ? 'legend'
    : knockout || !!hit.trap || hit.dealt >= 6
      ? 'feature'
      : 'flash'
  const miss = hit.dealt === 0 && hit.returned === 0 && !hit.trap
  const enemy = rivalOf(hit.side)
  return {
    kind: lethal ? 'victory' : 'strike',
    grade,
    side: hit.side,
    lane: hit.lane,
    crew: card.team,
    cardId: card.id,
    eyebrow: lethal
      ? after.victor === 'draw'
        ? 'DOUBLE KNOCKOUT'
        : after.victor === hit.side
          ? 'FINISHING BLOW'
          : 'LAST STAND'
      : hit.trap
        ? 'TRAP SPRUNG'
        : knockout
          ? 'KNOCKOUT'
          : miss
            ? 'MISFIRE'
            : hit.target === 'boss'
              ? 'DIRECT BOSS HIT'
              : 'ALLEY IMPACT',
    title: lethal
      ? after.victor === 'draw'
        ? 'TOTAL MAYHEM'
        : after.victor === hit.side
          ? 'VICTORY!'
          : 'RIVAL VICTORY'
      : hit.trap
        ? card.name
        : cardById(hit.attacker).name,
    detail: lethal
      ? `Boss health: ${after.boss.player} to ${after.boss.enemy}`
      : hit.trap
        ? `The trap catches ${cardById(hit.attacker).name}!`
        : miss
          ? 'No damage! The alley holds.'
          : hit.target === 'boss'
            ? `${hit.dealt} damage to the ${enemy === 'enemy' ? 'rival' : 'player'} boss`
            : knockout
              ? `${hit.dealt} dealt · ${hit.returned} returned`
              : `${hit.dealt} dealt · ${hit.returned} returned`,
  }
}
