import assert from 'node:assert/strict'
import { allianceStarter } from '../slimeCity/alliance'
import { chooseClashCpu, createClash, type ClashUnit } from '../slimeCity/clash'

const fighter = (lane: number): ClashUnit => ({
  uid: 101 + lane,
  side: 'player',
  lane,
  cardId: 'lynx',
  hp: 12,
  maxHp: 12,
  attack: 6,
  armor: 1,
  keywords: [],
  surge: 0,
  rooted: false,
  ambushUsed: false,
  attacked: false,
  fresh: false,
  gear: [],
  level: 1,
})

// Earlier the Alliance CPU skipped all gear synergy and generic investment
// payoffs, leaving useful two-play cards unplayed in 30-card drafts.
{
  const s = createClash('catgirls', 'riot', 507, {
    alliance: {
      player: allianceStarter('catgirls', 'undertow'),
      enemy: allianceStarter('riot', 'ironjaw'),
    },
  })
  s.round = 5
  s.units = Array.from({ length: 5 }, (_, lane) => fighter(lane))
  s.hands.player = ['merc-emergency-wings', 'mau']
  s.plays.player = 0
  // Isolate the play heuristic from the one-time faction power.
  s.powerUsed = { player: true, enemy: true }
  const before = structuredClone(s)
  const command = chooseClashCpu(s, 'player')
  assert.equal(command.t, 'play')
  if (command.t === 'play')
    assert.equal(
      command.card,
      'merc-emergency-wings',
      'invest in an existing fighter',
    )
  assert.deepEqual(s, before, 'evaluation cannot mutate actual battle state')
  assert.deepEqual(
    chooseClashCpu(s, 'player'),
    command,
    'decision is deterministic',
  )
}
console.log(
  'Alliance CPU selects previously neglected long-lived gear instead of replacing healthy fighters PASS',
)
