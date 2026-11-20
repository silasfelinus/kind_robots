import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { AuthoredDungeon } from '../memoryDungeon/authoredDungeon/engine'
import type { DungeonProgress } from '../memoryDungeon/authoredDungeon/types'
import { worldEvent } from '../memoryDungeon/overworldEventCatalog'
import {
  BRIAR_VAULT,
  BRIAR_VAULT_ENDINGS,
  BRIAR_VAULT_ENTRY_BY_CHOICE,
} from '../memoryDungeon/briarVault'
import {
  SPECIMEN_STACKS,
  SPECIMEN_STACKS_ENDINGS,
  SPECIMEN_STACKS_ENTRY_BY_CHOICE,
} from '../memoryDungeon/specimenStacks'
import {
  WELL_OF_RECORDS,
  WELL_OF_RECORDS_ENDINGS,
  WELL_OF_RECORDS_ENTRY_BY_CHOICE,
} from '../memoryDungeon/wellOfRecords'
import {
  BRINE_TUNNEL,
  BRINE_TUNNEL_ENDINGS,
  BRINE_TUNNEL_ENTRY_BY_CHOICE,
} from '../memoryDungeon/brineTunnel'

type AnyDungeon = AuthoredDungeon<string, string, string>
type Progress = DungeonProgress<string, string, string>

const LATE = [
  {
    world: 'e09',
    site: '3,6',
    dungeon: BRIAR_VAULT as unknown as AnyDungeon,
    endings: BRIAR_VAULT_ENDINGS as readonly string[],
    entries: BRIAR_VAULT_ENTRY_BY_CHOICE as Record<string, string>,
  },
  {
    world: 'e10',
    site: '6,2',
    dungeon: SPECIMEN_STACKS as unknown as AnyDungeon,
    endings: SPECIMEN_STACKS_ENDINGS as readonly string[],
    entries: SPECIMEN_STACKS_ENTRY_BY_CHOICE as Record<string, string>,
  },
  {
    world: 'e11',
    site: '6,2',
    dungeon: WELL_OF_RECORDS as unknown as AnyDungeon,
    endings: WELL_OF_RECORDS_ENDINGS as readonly string[],
    entries: WELL_OF_RECORDS_ENTRY_BY_CHOICE as Record<string, string>,
  },
  {
    world: 'e12',
    site: '6,2',
    dungeon: BRINE_TUNNEL as unknown as AnyDungeon,
    endings: BRINE_TUNNEL_ENDINGS as readonly string[],
    entries: BRINE_TUNNEL_ENTRY_BY_CHOICE as Record<string, string>,
  },
]

for (const late of LATE) {
  const D = late.dungeon
  const P = D.def.prefix
  const id = (n: number) => P + '-' + String(n).padStart(2, '0')
  assert.deepEqual(D.validate(), [], late.world + ' dungeon validates')
  assert.equal(Object.keys(D.rooms).length, 36)

  const entrance = worldEvent(late.world, late.site)
  assert.ok(entrance, late.world + ' entrance site exists')
  assert.equal(entrance.kind, 'dungeon', late.world + ' entrance is a dungeon')
  assert.deepEqual(
    Object.keys(late.entries).sort(),
    entrance.choices.map((choice) => choice.id).sort(),
    late.world + ': every entrance choice opens the dungeon one way',
  )

  const goTo = (progress: Progress, target: string): Progress => {
    const previous = new Map<string, string>()
    const queue = [progress.current]
    const seen = new Set(queue)
    for (let i = 0; i < queue.length && !seen.has(target); i++)
      for (const next of D.exits(progress, queue[i]!))
        if (!seen.has(next)) {
          seen.add(next)
          previous.set(next, queue[i]!)
          queue.push(next)
        }
    assert.ok(seen.has(target), late.world + ': no open route to ' + target)
    const path: string[] = []
    for (let s = target; s !== progress.current; s = previous.get(s)!)
      path.unshift(s)
    for (const step of path) {
      const moved = D.travel(progress, step)
      assert.notEqual(moved, progress, late.world + ': blocked at ' + step)
      progress = moved
    }
    return progress
  }
  const settle = (progress: Progress): Progress => {
    const room = D.rooms[progress.current]!
    if (progress.decisions[room.id]) return progress
    const open = room.choices.filter((c) => !D.choiceLock(progress, c))
    assert.ok(open.length, room.id + ' has no playable choice')
    const pick = [...open].sort(
      (a, b) =>
        (b.gain?.evidence ?? 0) +
        (b.gain?.battery ?? 0) -
        ((a.gain?.evidence ?? 0) + (a.gain?.battery ?? 0)),
    )[0]!
    return D.choose(progress, pick.id)
  }

  const fresh = D.newProgress(Object.values(late.entries)[0]!)
  assert.ok(!D.exits(fresh, id(32)).includes(id(33)), 'guardian gates vault')
  assert.ok(!D.exits(fresh, id(35)).includes(id(36)), 'climax gates exit')

  for (const entry of Object.values(late.entries)) {
    let upper = settle(D.newProgress(entry))
    for (let n = 2; n <= 31; n++) upper = settle(goTo(upper, id(n)))
    assert.equal(upper.visited.length, 31, late.world + '/' + entry)
    const atGuardian = goTo(upper, id(32))
    const answers = D.rooms[id(32)]!.choices.filter(
      (c) => !D.choiceLock(atGuardian, c),
    )
    assert.ok(answers.length, late.world + ': the guardian can be answered')
    const passed = D.choose(atGuardian, answers[0]!.id)
    assert.ok(passed.guardianPassed)
    for (const ending of late.endings) {
      let run = settle(goTo(passed, id(33)))
      run = settle(goTo(run, id(34)))
      run = D.choose(goTo(run, id(35)), ending)
      assert.equal(run.ending, ending)
      run = settle(goTo(run, id(36)))
      assert.ok(run.completed, late.world + '/' + entry + '/' + ending)
      const saved = JSON.parse(
        JSON.stringify({
          version: 1,
          visited: run.visited,
          order: run.order,
          current: run.current,
        }),
      )
      assert.deepEqual(D.restore(saved, entry), run)
    }
  }

  const forged = D.restore(
    {
      version: 1,
      visited: [id(1), id(32), id(35)],
      order: [[id(35), late.endings[0]]],
      current: id(35),
      guardianPassed: true,
    },
    Object.values(late.entries)[0]!,
  )
  assert.equal(forged.ending, null, late.world + ': forged ending rejected')
  assert.equal(forged.guardianPassed, false)
}

const sublevelView = readFileSync(
  'components/pages/memory-dungeon-sublevel.vue',
  'utf8',
)
const page = readFileSync('components/pages/memory-dungeon.vue', 'utf8')
for (const key of [
  'briar-vault',
  'specimen-stacks',
  'well-of-records',
  'brine-tunnel',
]) {
  assert.ok(sublevelView.includes(`props.dungeon === '${key}'`), key)
  assert.ok(page.includes(`lateDungeon = '${key}'`), key)
}
assert.ok(
  readFileSync(
    'components/pages/memory-dungeon-briar-collision.vue',
    'utf8',
  ).includes('data-testid="memory-enter-briar-vault"'),
)
assert.ok(
  readFileSync(
    'components/pages/memory-dungeon-earth-collision.vue',
    'utf8',
  ).includes('data-testid="memory-enter-specimen-stacks"'),
)
assert.ok(
  readFileSync(
    'components/pages/memory-dungeon-finale-collision.vue',
    'utf8',
  ).includes('data-testid="memory-enter-late-dungeon"'),
)

console.log(
  'Memory late dungeons e09-e12: 4 x 36 rooms validate; both entries per dungeon explore 31 rooms, pass the guardian and reach all three endings and the exit; restores replay; forged saves rejected; entrances wired',
)
