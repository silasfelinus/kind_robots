import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const loader = await readFile('components/admin/kind-loader.vue', 'utf8')
const store = await readFile('stores/achievementStore.ts', 'utf8')
const consoleStore = await readFile('stores/consoleStore.ts', 'utf8')

assert.doesNotMatch(
  loader,
  /achievementStore\.fetchAchievements\s*\(/,
  'global boot must not fetch the full achievement catalog',
)
assert.doesNotMatch(
  loader,
  /achievementStore\.fetchAchievementRecords\s*\(/,
  'global boot must not fetch all remote achievement records',
)
assert.doesNotMatch(
  loader,
  /consoleStore\.initialize|useConsoleStore\(\)\.initialize/,
  'global boot must not initialize console progression',
)
assert.match(
  loader,
  /useConsoleStore\(\)\.logRandomMessage\(\)/,
  'global boot must keep the intentional random console message',
)
assert.doesNotMatch(
  consoleStore,
  /localStorage|fetchConsoleData|saveConsoleData|loadMessagesFromLocal|saveMessagesToLocal/,
  'console startup behavior must remain ephemeral and avoid persistence or backend sync',
)
assert.match(
  loader,
  /achievementStore\.initialize\?\.\(\)/,
  'boot should still hydrate local achievement state',
)
assert.match(
  loader,
  /achievementStore\.migratePendingGuestAchievements\(\)/,
  'boot should still migrate locally queued guest achievements after login',
)
assert.match(
  loader,
  /achievementStore\.rewardAchievementForPath\(route\.path\)/,
  'route-triggered awards must remain wired',
)
assert.match(
  store,
  /if \(!achievements\.value\.length\)\s*{\s*await fetchAchievements\(\)/,
  'code-based awards must retain their lazy catalog fallback',
)
assert.match(
  store,
  /if \(!achievement\)\s*{[\s\S]*await fetchAchievementById\(achievementId\)/,
  'ID-based awards must retain their lazy single-achievement fallback',
)

console.log('Boot achievement budget contract passed: shell startup keeps one random console message while remote catalogs and console persistence stay lazy.')
