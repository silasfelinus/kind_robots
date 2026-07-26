// /utils/scripts/verifyDreamRandomCompatibility.ts
import { readFile } from 'node:fs/promises'

async function main(): Promise<void> {
  const [helper, store, randomStore] = await Promise.all([
    readFile('stores/helpers/dreamHelper.ts', 'utf8'),
    readFile('stores/dreamStore.ts', 'utf8'),
    readFile('stores/randomStore.ts', 'utf8'),
  ])

  const compatibility = helper.match(
    /export function randomEntry[\s\S]*?\n}\n\nexport function extractExamples/,
  )?.[0]
  if (!compatibility) {
    throw new Error('Dream randomEntry compatibility boundary is missing.')
  }
  if (!compatibility.includes('return dreamName')) {
    throw new Error('Dream randomEntry must be a deterministic compatibility adapter.')
  }
  if (
    compatibility.includes('.examples') ||
    compatibility.includes('Math.random') ||
    compatibility.includes('extractExamples(')
  ) {
    throw new Error('Dream randomEntry must not sample Dream examples.')
  }
  if (!store.includes('helperRandomEntry(dreamName, dreams.value)')) {
    throw new Error('Legacy dreamStore compatibility call changed unexpectedly.')
  }
  if (randomStore.includes('dreamStore') || randomStore.includes('/api/dreams')) {
    throw new Error('randomStore must not depend on Dreams.')
  }

  process.stdout.write('Dream random compatibility contract verified.\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
