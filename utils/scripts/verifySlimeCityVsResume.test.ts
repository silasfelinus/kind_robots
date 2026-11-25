// VS CPU match resume (slime-city/t-063, main-game standard save/load): an
// unfinished CPU match is kept on this device as the frozen launch plus the
// move log, and a reload rebuilds the exact board for the same account.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { TEAMS } from '../slimeCity/prototypes'
import {
  allianceStarter,
  cpuAlliance,
  soloStarter,
} from '../slimeCity/alliance'
import {
  applyClashCommand,
  chooseClashCpu,
  createClash,
  replayClash,
  type ClashOptions,
} from '../slimeCity/clash'
import {
  VS_BOUT_KEY,
  VS_BOUT_MAX_AGE_MS,
  clearVsBout,
  readVsBout,
  validVsBout,
  vsBoutMatches,
  writeVsBout,
  type VsBoutSave,
} from '../slimeCity/vsBoutSave'

const crews = TEAMS.map((team) => team.id)
const memory = new Map<string, string>()
const storage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
}

function playSome(
  player: (typeof crews)[number],
  enemy: (typeof crews)[number],
  seed: number,
  opts: ClashOptions,
) {
  let live = createClash(player, enemy, seed, opts)
  for (let turn = 0; !live.victor && turn < 30; turn++)
    live = applyClashCommand(live, chooseClashCpu(live, live.active))
  assert.ok(live.commands.length > 0, 'match is under way')
  return live
}

const now = 1_800_000_000_000

// SOLO practice (guest) and ALLIANCE reward (signed in) both rebuild exactly.
{
  const player = crews[0]!
  const enemy = crews[2]!
  const cards = soloStarter(player)
  const seed = 30611
  const opts: ClashOptions = { decks: { player: cards } }
  const live = playSome(player, enemy, seed, opts)
  const bout: VsBoutSave = {
    version: 1,
    account: 'guest',
    savedAt: now,
    launch: { kind: 'practice', format: 'solo', player, enemy, seed, cards },
    commands: [...live.commands],
  }
  assert.ok(validVsBout(bout))
  assert.ok(writeVsBout(bout, storage))
  const restored = readVsBout(storage)!
  assert.ok(restored, 'solo record round-trips')
  const resumed = replayClash(
    restored.launch.player,
    restored.launch.enemy,
    restored.launch.seed,
    restored.commands,
    { decks: { player: restored.launch.cards! } },
  )
  assert.deepEqual(resumed.hands, live.hands, 'solo board matches live')
  assert.deepEqual(resumed.units, live.units)
  assert.deepEqual(resumed.boss, live.boss)
  assert.equal(resumed.round, live.round)
  assert.deepEqual(resumed.commands, live.commands)
}
{
  const player = crews[1]!
  const enemy = crews[3]!
  const alliance = allianceStarter(player, crews[4]!)
  const seed = 99173
  const opts: ClashOptions = {
    alliance: { player: alliance, enemy: cpuAlliance(enemy, seed) },
  }
  const live = playSome(player, enemy, seed, opts)
  const bout: VsBoutSave = {
    version: 1,
    account: '17',
    savedAt: now,
    launch: {
      kind: 'reward',
      format: 'alliance',
      player,
      enemy,
      seed,
      rewardId: 'c5d1e7a2-0000-4000-8000-000000000001',
      alliance,
    },
    commands: [...live.commands],
  }
  assert.ok(writeVsBout(bout, storage))
  const restored = readVsBout(storage)!
  const resumed = replayClash(player, enemy, seed, restored.commands, {
    alliance: {
      player: restored.launch.alliance!,
      enemy: cpuAlliance(restored.launch.enemy, restored.launch.seed),
    },
  })
  assert.deepEqual(resumed.hands, live.hands, 'alliance board matches live')
  assert.deepEqual(resumed.units, live.units)
  assert.equal(resumed.round, live.round)
  // Only the same account, inside the server's settlement window.
  assert.ok(vsBoutMatches(restored, '17', now + 1000))
  assert.ok(!vsBoutMatches(restored, 'guest', now), 'other account')
  assert.ok(!vsBoutMatches(restored, '18', now))
  assert.ok(!vsBoutMatches(restored, '17', now + VS_BOUT_MAX_AGE_MS), 'stale')
  assert.ok(!vsBoutMatches(restored, '17', now - 3600000), 'from the future')
  assert.ok(!vsBoutMatches(null, '17', now))

  // Tampered or broken records are ignored, never replayed.
  for (const bad of [
    { ...bout, version: 2 },
    { ...bout, savedAt: -1 },
    { ...bout, launch: { ...bout.launch, kind: 'tower' } },
    { ...bout, launch: { ...bout.launch, rewardId: undefined } },
    { ...bout, launch: { ...bout.launch, enemy: 'nobody' } },
    { ...bout, launch: { ...bout.launch, alliance: { general: player } } },
    { ...bout, launch: { ...bout.launch, format: 'solo' } },
    {
      ...bout,
      launch: {
        kind: 'practice',
        format: 'solo',
        player,
        enemy,
        seed,
        cards: [],
      },
    },
    {
      ...bout,
      launch: {
        kind: 'practice',
        format: 'solo',
        player,
        enemy,
        seed,
        cards: ['x'],
        rewardId: 'abc',
      },
    },
    { ...bout, commands: [{ t: 'win', side: 'player' }] },
    { ...bout, commands: Array(5000).fill({ t: 'pass', side: 'player' }) },
  ])
    assert.ok(!validVsBout(bad), JSON.stringify(bad).slice(0, 80))
  memory.set(VS_BOUT_KEY, '{not json')
  assert.equal(readVsBout(storage), null)
  assert.ok(clearVsBout(storage))
  assert.equal(readVsBout(storage), null)
  const throwing = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
    removeItem: () => {
      throw new Error('blocked')
    },
  }
  assert.equal(readVsBout(throwing), null)
  assert.equal(writeVsBout(bout, throwing), false)
  assert.equal(clearVsBout(throwing), false)
  assert.equal(readVsBout(null), null)
}

// Source contract: the store freezes and records VS launches, a finished
// match clears the record, the Clash board records every move, and the VS
// screen offers RESUME / ABANDON.
{
  const store = readFileSync('stores/slimeCity.ts', 'utf8')
  const clash = readFileSync('components/slime-city-clash.vue', 'utf8')
  const vs = readFileSync('components/slime-city-vs.vue', 'utf8')
  assert.match(store, /function recordVsCommands\(/)
  assert.match(store, /function resumeVsBout\(\)/)
  assert.match(
    store,
    /recordVsCommands\(clashLaunch\.value\.id, next\.resume \?\? \[\]\)/,
  )
  assert.match(
    store,
    /launch\.kind === 'practice' \|\| launch\.kind === 'reward'\) forgetVsBout\(\)/,
    'a finished VS match clears its record',
  )
  assert.match(
    clash,
    /lab\.recordClashCommands\(dealtLaunch, game\.value\.commands\)/,
  )
  assert.match(vs, /data-testid="slime-vs-resume-cpu"/)
  assert.match(vs, /@click="lab\.resumeVsBout\(\)"/)
  assert.match(vs, /data-testid="slime-vs-forget-cpu"/)
  assert.match(vs, /lab\.hydrateVsBout\(\)/)
  assert.match(vs, /data-testid="slime-vs-roster"/)
  assert.match(vs, /v-for="team in lab\.teams"/)
  assert.match(vs, /@click="selectCrew\(team\.id\)"/)
  assert.match(vs, /lab\.chooseTeam\(id\)/)
  assert.match(vs, /slimeArtId\('crews', lab\.activeTeam\)/)
  assert.match(vs, /lab\.team\.hook/)
  assert.match(vs, /factionPower\(lab\.activeTeam\)/)
  assert.match(vs, /power\.text/)
  assert.match(vs, /power\.overcharge/)
  assert.match(vs, /v-for="game in activeGames"/)
  assert.match(vs, /game\.stage === 'waiting' \|\| game\.stage === 'battle'/)
  assert.doesNotMatch(vs, /v-for="game in pvp\.games"/)
  assert.doesNotMatch(vs, /<SlimeCityCrewSelect/)
}

console.log('verifySlimeCityVsResume: ok')
