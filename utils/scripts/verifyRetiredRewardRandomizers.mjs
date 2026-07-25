// /utils/scripts/verifyRetiredRewardRandomizers.mjs
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'

for (const path of [
  'stores/utils/randomInventory.ts',
  'stores/utils/randomItem.ts',
]) {
  let exists = true
  try {
    await access(path)
  } catch {
    exists = false
  }
  assert.equal(
    exists,
    false,
    `${path} must stay removed; reusable items belong to Reward records.`,
  )
}

console.log('Retired Reward randomizers verified.')
