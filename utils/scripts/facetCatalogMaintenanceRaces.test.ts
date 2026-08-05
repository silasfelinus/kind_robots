import assert from 'node:assert/strict'
import {
  createFacetMaintenanceLockGuard,
  facetMaintenanceAbortReason,
  FacetMaintenanceLockLostError,
  lockOwnerMatchesConnection,
  runSerializedFacetMaintenanceSteps,
} from '../../scripts/facetCatalogMaintenanceRuntime'
import {
  shouldAssignAliasToFacet,
  updateFacetWithSlugRaceRecovery,
} from './facetCatalogWriteRace'

async function verifyLockLossStopsRemainingSteps(): Promise<void> {
  const guard = createFacetMaintenanceLockGuard()
  const visited: string[] = []
  let firstStarted: (() => void) | undefined
  const started = new Promise<void>((resolve) => {
    firstStarted = resolve
  })

  const run = runSerializedFacetMaintenanceSteps(
    ['first', 'second'],
    async (step, signal) => {
      visited.push(step)
      if (step !== 'first') return

      firstStarted?.()
      await new Promise<void>((_resolve, reject) => {
        const rejectForAbort = () => reject(facetMaintenanceAbortReason(signal))
        if (signal.aborted) {
          rejectForAbort()
          return
        }
        signal.addEventListener('abort', rejectForAbort, { once: true })
      })
    },
    guard.signal,
  )

  await started
  assert.equal(guard.loseLock(new Error('socket closed')), true)
  assert.equal(guard.loseLock(new Error('duplicate notification')), false)
  await assert.rejects(run, FacetMaintenanceLockLostError)
  assert.deepEqual(visited, ['first'])
}

function verifyLockOwnershipRows(): void {
  assert.equal(
    lockOwnerMatchesConnection([{ connectionId: 42, ownerId: 42 }]),
    true,
  )
  assert.equal(
    lockOwnerMatchesConnection([{ connectionId: 42, ownerId: 43 }]),
    false,
  )
  assert.equal(
    lockOwnerMatchesConnection([{ connectionId: 42, ownerId: null }]),
    false,
  )
}

async function verifySlugUpdateRaceRecoversWinner(): Promise<void> {
  const uniqueError = Object.assign(new Error('slug already claimed'), {
    code: 'P2002',
  })
  const updatedIds: number[] = []

  const row = await updateFacetWithSlugRaceRecovery({
    existingId: 7,
    slug: 'storm-caller',
    updateById: async (id) => {
      updatedIds.push(id)
      if (id === 7) throw uniqueError
      return { id }
    },
    findBySlug: async (slug) => {
      assert.equal(slug, 'storm-caller')
      return { id: 11 }
    },
  })

  assert.deepEqual(updatedIds, [7, 11])
  assert.equal(row.id, 11)
}

async function verifySlugUpdateRaceDoesNotMaskMissingWinner(): Promise<void> {
  const uniqueError = Object.assign(new Error('slug already claimed'), {
    code: 'P2002',
  })

  await assert.rejects(
    updateFacetWithSlugRaceRecovery({
      existingId: 7,
      slug: 'storm-caller',
      updateById: async () => {
        throw uniqueError
      },
      findBySlug: async () => null,
    }),
    (error) => error === uniqueError,
  )
}

function verifyCanonicalAliasCanFollowRaceWinner(): void {
  assert.equal(shouldAssignAliasToFacet(7, 11, true), true)
  assert.equal(shouldAssignAliasToFacet(7, 11, false), false)
  assert.equal(shouldAssignAliasToFacet(11, 11, false), true)
}

async function main(): Promise<void> {
  await verifyLockLossStopsRemainingSteps()
  verifyLockOwnershipRows()
  await verifySlugUpdateRaceRecoversWinner()
  await verifySlugUpdateRaceDoesNotMaskMissingWinner()
  verifyCanonicalAliasCanFollowRaceWinner()
  console.log('Facet maintenance lock-loss and slug-race tests passed.')
}

void main()
