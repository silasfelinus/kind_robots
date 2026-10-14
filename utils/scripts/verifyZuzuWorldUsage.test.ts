import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ZUZU_SLOT_MAX,
  ZUZU_USAGE_ROLES,
  parseZuzuUsage,
  zuzuUsageRoleOf,
  type ZuzuRepoMediaEntry,
} from '../zuzuWorld'
import {
  dedupeZuzuRepoMedia,
  filterZuzuRepoMedia,
  repoExportsByArtImage,
  resolveZuzuRepoFileStatus,
  zuzuRepoMediaIndex,
} from '../zuzuRepoMedia'
import {
  applyZuzuUsage,
  parseZuzuAssignment,
  runZuzuAssignment,
  type ZuzuAssignmentDeps,
  type ZuzuUsageStore,
} from '../../server/utils/zuzuProjectUsage'
import {
  zuzuPublicRoots,
  zuzuRepoFileProbe,
} from '../../server/utils/zuzuRepoMediaFiles'

let failures = 0
const pending: Promise<void>[] = []

function check(label: string, fn: () => void | Promise<void>): void {
  pending.push(
    (async () => {
      try {
        await fn()
        console.log(`ok - ${label}`)
      } catch (error) {
        failures += 1
        console.error(`FAIL - ${label}`)
        console.error(error instanceof Error ? error.stack : error)
      }
    })(),
  )
}

async function rejectsWith(
  promise: Promise<unknown>,
  statusCode: number,
): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.equal((error as { statusCode?: number }).statusCode, statusCode)
    return true
  })
}

type Row = {
  projectId: number
  artImageId: number
  role: string | null
  slot: string | null
  pinnedVersion: string | null
}

function memoryStore() {
  const rows: Row[] = []
  const artImages = new Set([101, 102, 103])
  const calls: string[] = []
  const matches = (
    row: Row,
    pairs: { projectId: number; artImageId: number }[],
  ) =>
    pairs.some(
      (pair) =>
        pair.projectId === row.projectId && pair.artImageId === row.artImageId,
    )
  const store: ZuzuUsageStore = {
    projectArtImage: {
      async createMany({ data }) {
        calls.push('createMany')
        let count = 0
        for (const entry of data) {
          if (matches(entry as Row, rows)) continue
          rows.push({
            projectId: entry.projectId,
            artImageId: entry.artImageId,
            role: entry.role ?? null,
            slot: entry.slot ?? null,
            pinnedVersion: entry.pinnedVersion ?? null,
          })
          count += 1
        }
        return { count }
      },
      async updateMany({ where, data }) {
        calls.push('updateMany')
        let count = 0
        for (const row of rows) {
          if (!matches(row, where.OR)) continue
          Object.assign(row, data)
          count += 1
        }
        return { count }
      },
      async deleteMany({ where }) {
        calls.push('deleteMany')
        const before = rows.length
        for (let index = rows.length - 1; index >= 0; index -= 1) {
          if (matches(rows[index]!, where.OR)) rows.splice(index, 1)
        }
        return { count: before - rows.length }
      },
    },
  }
  return { store, rows, artImages, calls }
}

function deps(
  store: ZuzuUsageStore,
  overrides: Partial<ZuzuAssignmentDeps> = {},
): ZuzuAssignmentDeps {
  return {
    requireAdmin: async () => ({ isAdmin: true }),
    accessIsAdmin: async () => true,
    ledgerHas: async (id) => [101, 102, 103, 999].includes(id),
    accessibleArtImageIds: async (ids) => ids.filter((id) => id !== 999),
    zuzuProjects: async (ids) =>
      ids.map((id) => ({
        id,
        conductorSlug:
          id === 66 ? 'private-unrelated-project' : 'zuzu-gamebook',
      })),
    store,
    ...overrides,
  }
}

check('every production role parses, general is stored as null', () => {
  for (const role of ZUZU_USAGE_ROLES) {
    const parsed = parseZuzuUsage({ role: role.value })
    assert.equal(parsed.ok, true)
    if (parsed.ok) {
      assert.equal(
        parsed.value.role,
        role.value === 'general' ? null : role.value,
      )
    }
  }
  const missing = parseZuzuUsage({})
  assert.deepEqual(missing, {
    ok: true,
    value: { role: null, slot: null, pinnedVersion: null },
  })
  assert.equal(zuzuUsageRoleOf(null), 'general')
  assert.equal(zuzuUsageRoleOf('retired-role'), 'general')
  assert.equal(zuzuUsageRoleOf('shot-keyframe'), 'shot-keyframe')
})

check('unknown roles and malformed labels are rejected', () => {
  assert.equal(parseZuzuUsage({ role: 'hero-shot' }).ok, false)
  assert.equal(parseZuzuUsage({ role: 7 }).ok, false)
  assert.equal(parseZuzuUsage({ slot: 42 }).ok, false)
  assert.equal(
    parseZuzuUsage({ slot: 'x'.repeat(ZUZU_SLOT_MAX + 1) }).ok,
    false,
  )
  assert.equal(parseZuzuUsage({ slot: 'scene\u00004' }).ok, false)
  assert.equal(parseZuzuUsage({ pinnedVersion: 'r3; DROP' }).ok, false)
  const normalized = parseZuzuUsage({
    role: 'stage-background',
    slot: '  Act 2 \n scene   4 ',
    pinnedVersion: ' ArtJob #34959 ',
  })
  assert.deepEqual(normalized, {
    ok: true,
    value: {
      role: 'stage-background',
      slot: 'Act 2 scene 4',
      pinnedVersion: 'ArtJob #34959',
    },
  })
  assert.equal(
    parseZuzuUsage({ slot: '   ', pinnedVersion: '' }).ok &&
      (parseZuzuUsage({ slot: '   ' }) as { value: { slot: null } }).value.slot,
    null,
  )
})

check('assignment parsing rejects bad ids, actions and usage', () => {
  assert.throws(() => parseZuzuAssignment(null), { statusCode: 400 })
  assert.throws(
    () =>
      parseZuzuAssignment({
        artImageIds: [1, 1],
        projectIds: [2],
        action: 'link',
      }),
    { statusCode: 400 },
  )
  assert.throws(
    () =>
      parseZuzuAssignment({
        artImageIds: [1],
        projectIds: [2],
        action: 'delete',
      }),
    { statusCode: 400 },
  )
  assert.throws(
    () =>
      parseZuzuAssignment({
        artImageIds: [1],
        projectIds: [2],
        action: 'link',
        usage: { role: 'cover-art' },
      }),
    { statusCode: 400 },
  )
  const legacy = parseZuzuAssignment({
    artImageIds: [1],
    projectIds: [2],
    action: 'link',
  })
  assert.equal(legacy.usage, null)
})

check(
  're-linking is idempotent and a role change updates in place',
  async () => {
    const { store, rows, artImages } = memoryStore()
    const plan = parseZuzuAssignment({
      artImageIds: [101, 102],
      projectIds: [5],
      action: 'link',
      usage: { role: 'shot-keyframe', slot: 'Act 1 · s3' },
    })
    const first = await applyZuzuUsage(store, plan)
    assert.equal(first.created, 2)
    assert.equal(first.updated, 0)
    const again = await applyZuzuUsage(store, plan)
    assert.equal(again.created, 0)
    assert.equal(rows.length, 2)
    assert.ok(rows.every((row) => row.role === 'shot-keyframe'))

    const legacyRelink = await applyZuzuUsage(
      store,
      parseZuzuAssignment({
        artImageIds: [101],
        projectIds: [5],
        action: 'link',
      }),
    )
    assert.equal(legacyRelink.changed, 0)
    assert.equal(
      rows.find((row) => row.artImageId === 101)?.role,
      'shot-keyframe',
    )

    const retag = await applyZuzuUsage(
      store,
      parseZuzuAssignment({
        artImageIds: [101],
        projectIds: [5, 6],
        action: 'link',
        usage: { role: 'character-design', pinnedVersion: 'r3' },
      }),
    )
    assert.equal(retag.updated, 1)
    assert.equal(retag.created, 1)
    assert.equal(rows.length, 3)
    const retagged = rows.find(
      (row) => row.artImageId === 101 && row.projectId === 5,
    )
    assert.deepEqual(
      {
        role: retagged?.role,
        slot: retagged?.slot,
        pin: retagged?.pinnedVersion,
      },
      { role: 'character-design', slot: null, pin: 'r3' },
    )

    const general = await applyZuzuUsage(
      store,
      parseZuzuAssignment({
        artImageIds: [101],
        projectIds: [5],
        action: 'link',
        usage: { role: 'general' },
      }),
    )
    assert.equal(general.updated, 1)
    assert.equal(
      rows.find((row) => row.artImageId === 101 && row.projectId === 5)?.role,
      null,
    )
    assert.deepEqual([...artImages], [101, 102, 103])
  },
)

check(
  'unlink removes only the chosen references and never ArtImages',
  async () => {
    const { store, rows, artImages } = memoryStore()
    await applyZuzuUsage(
      store,
      parseZuzuAssignment({
        artImageIds: [101, 102],
        projectIds: [5, 6],
        action: 'link',
      }),
    )
    assert.equal(rows.length, 4)
    const result = await applyZuzuUsage(
      store,
      parseZuzuAssignment({
        artImageIds: [101],
        projectIds: [5],
        action: 'unlink',
      }),
    )
    assert.equal(result.changed, 1)
    assert.equal(rows.length, 3)
    assert.ok(
      !rows.some((row) => row.artImageId === 101 && row.projectId === 5),
    )
    const repeat = await applyZuzuUsage(
      store,
      parseZuzuAssignment({
        artImageIds: [101],
        projectIds: [5],
        action: 'unlink',
      }),
    )
    assert.equal(repeat.changed, 0)
    assert.deepEqual([...artImages], [101, 102, 103])
  },
)

check('non-admin callers are rejected before the body is read', async () => {
  const { store, calls } = memoryStore()
  let bodyRead = false
  const readBody = async () => {
    bodyRead = true
    return { artImageIds: [101], projectIds: [5], action: 'link' }
  }
  await rejectsWith(
    runZuzuAssignment(
      deps(store, {
        requireAdmin: async () => {
          throw Object.assign(new Error('Admin access required.'), {
            statusCode: 403,
          })
        },
      }),
      readBody,
    ),
    403,
  )
  await rejectsWith(
    runZuzuAssignment(
      deps(store, { accessIsAdmin: async () => false }),
      readBody,
    ),
    403,
  )
  assert.equal(bodyRead, false)
  assert.deepEqual(calls, [])
})

check(
  'inaccessible art, unknown art and non-Zuzu projects are refused',
  async () => {
    const { store, calls } = memoryStore()
    await rejectsWith(
      runZuzuAssignment(deps(store), async () => ({
        artImageIds: [101, 999],
        projectIds: [5],
        action: 'link',
      })),
      403,
    )
    await rejectsWith(
      runZuzuAssignment(deps(store), async () => ({
        artImageIds: [555],
        projectIds: [5],
        action: 'link',
      })),
      400,
    )
    await rejectsWith(
      runZuzuAssignment(deps(store), async () => ({
        artImageIds: [101],
        projectIds: [66],
        action: 'link',
      })),
      400,
    )
    assert.deepEqual(calls, [])
    const ok = await runZuzuAssignment(deps(store), async () => ({
      artImageIds: [101],
      projectIds: [5],
      action: 'link',
      usage: { role: 'animation-clip' },
    }))
    assert.equal(ok.created, 1)
  },
)

check(
  'repository index has one entry per file and merges shared plates',
  () => {
    const index = zuzuRepoMediaIndex()
    const keys = index.map((entry) => entry.key)
    assert.equal(new Set(keys).size, keys.length)
    assert.ok(index.length > 300)
    for (const collection of [
      'gamebook-plate',
      'gamebook-section',
      'showdown-sprite',
      'showdown-portrait',
      'showdown-stage',
      'ghost-trail-plate',
    ]) {
      assert.ok(
        index.some((entry) => entry.collection === collection),
        `missing ${collection}`,
      )
    }
    const waterhole = index.find(
      (entry) => entry.key === 'public/zuzu-gamebook/scenes/waterhole.webp',
    )
    assert.ok(waterhole)
    assert.ok(waterhole.usedBy.includes('waterhole'))
    assert.ok(waterhole.usedBy.includes('gun-shallows'))
    assert.equal(waterhole.fit, 'exact')
    assert.equal(waterhole.artImageId, 242684)
    assert.ok(index.every((entry) => entry.key.startsWith('public/')))
    assert.ok(
      index
        .filter((entry) => entry.collection === 'ghost-trail-plate')
        .every((entry) => entry.storage === 'delivered'),
    )
  },
)

check(
  'dedupe prefers the exact plate over a stand-in for the same file',
  () => {
    const base: ZuzuRepoMediaEntry = {
      key: 'public/zuzu-gamebook/scenes/camp.webp',
      url: '/zuzu-gamebook/scenes/camp.webp',
      title: 'Camp',
      projectSlug: 'zuzu-gamebook',
      collection: 'gamebook-plate',
      storage: 'git',
      manifest: 'utils/zuzuGamebook/art.ts',
      usedBy: ['fever'],
      artImageId: 243339,
      provenance: 'Stand-in (camp)',
      fit: 'stand-in',
      alt: null,
    }
    const merged = dedupeZuzuRepoMedia([
      base,
      {
        ...base,
        usedBy: ['camp'],
        provenance: 'Gamebook round 2',
        fit: 'exact',
      },
      { ...base, usedBy: ['fever'] },
    ])
    assert.equal(merged.length, 1)
    assert.equal(merged[0]!.fit, 'exact')
    assert.equal(merged[0]!.provenance, 'Gamebook round 2')
    assert.deepEqual(merged[0]!.usedBy.sort(), ['camp', 'fever'])
    assert.deepEqual(base.usedBy, ['fever'])
  },
)

check(
  'file status degrades gracefully for missing or unprobeable files',
  () => {
    const index = zuzuRepoMediaIndex().slice(0, 3)
    assert.ok(
      resolveZuzuRepoFileStatus(index, () => false).every(
        (entry) => entry.fileStatus === 'missing',
      ),
    )
    assert.ok(
      resolveZuzuRepoFileStatus(index, () => null).every(
        (entry) => entry.fileStatus === 'unverified',
      ),
    )
    assert.ok(
      resolveZuzuRepoFileStatus(index, () => {
        throw new Error('EACCES')
      }).every((entry) => entry.fileStatus === 'unverified'),
    )

    const dir = mkdtempSync(join(tmpdir(), 'zuzu-repo-media-'))
    try {
      mkdirSync(join(dir, 'public', 'zuzu-gamebook', 'scenes'), {
        recursive: true,
      })
      writeFileSync(
        join(dir, 'public', 'zuzu-gamebook', 'scenes', 'camp.webp'),
        '',
      )
      writeFileSync(join(dir, 'secret.txt'), 'nope')
      const roots = zuzuPublicRoots(dir)
      assert.equal(roots.length, 1)
      const probe = zuzuRepoFileProbe(roots)
      assert.equal(probe('public/zuzu-gamebook/scenes/camp.webp'), true)
      assert.equal(probe('public/zuzu-gamebook/scenes/missing.webp'), false)
      assert.equal(probe('public/../secret.txt'), false)
      assert.equal(probe('secret.txt'), false)
      assert.equal(
        zuzuRepoFileProbe(zuzuPublicRoots(join(dir, 'nowhere')))(
          'public/x.webp',
        ),
        null,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  },
)

check('every committed manifest file exists in this checkout', () => {
  const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
  const probe = zuzuRepoFileProbe([join(repoRoot, 'public')])
  const resolved = resolveZuzuRepoFileStatus(
    zuzuRepoMediaIndex().filter((entry) => entry.storage === 'git'),
    probe,
  )
  const missing = resolved.filter((entry) => entry.fileStatus !== 'present')
  assert.deepEqual(
    missing.map((entry) => entry.key),
    [],
  )
})

check('ArtImage crosslinks come from manifests without new rows', () => {
  const exports = repoExportsByArtImage(zuzuRepoMediaIndex())
  const waterhole = exports.get(242684) ?? []
  assert.ok(
    waterhole.some(
      (entry) => entry.key === 'public/zuzu-gamebook/scenes/waterhole.webp',
    ),
  )
  assert.equal(
    new Set(waterhole.map((entry) => entry.key)).size,
    waterhole.length,
  )
  const filtered = filterZuzuRepoMedia(zuzuRepoMediaIndex(), {
    search: '242684',
    project: 'zuzu-gamebook',
  })
  assert.ok(filtered.length >= 1)
  assert.ok(filtered.every((entry) => entry.projectSlug === 'zuzu-gamebook'))
  assert.equal(
    filterZuzuRepoMedia(zuzuRepoMediaIndex(), { collection: 'showdown-stage' })
      .length,
    8,
  )
})

await Promise.all(pending)
if (failures) {
  console.error(`${failures} Zuzu World usage check(s) failed`)
  process.exit(1)
}
console.log('Zuzu World usage and repository media checks passed')
