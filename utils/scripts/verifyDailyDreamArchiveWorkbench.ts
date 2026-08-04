import { readFileSync } from 'node:fs'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function expectContains(path: string, needles: string[]): void {
  const source = read(path)
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${path} is missing Daily Dream archive contract: ${needle}`)
    }
  }
}

expectContains('components/dreams/daily-digest-object-gallery.vue', [
  '<daily-digest-object-dialog',
  'Open details',
  'xl:grid-cols-6',
  'xl:min-h-32',
  'item.meta.slice(0, 1)',
  "makeItem('dream', 'World'",
  "makeItem('character', 'Cast'",
  "makeItem('reward', 'Discovery'",
  "makeItem('scenario', 'Scenario'",
])

expectContains('components/dreams/daily-digest-object-dialog.vue', [
  "type TabKey = 'overview' | 'edit' | 'art'",
  '<daily-dream-object-art-workbench',
  'archiveStore.updateObject(',
  'Save changes',
  'Art prompt',
])

expectContains('components/dreams/daily-dream-object-art-workbench.vue', [
  'Redo from prompt',
  'Modify current image',
  '<option value="kontext">Kontext edit</option>',
  'Keep the current version as inspiration',
  'archiveStore.queueObjectArt({',
  'archiveStore.fetchArtJob(jobId)',
  'archiveStore.applyDreamArt({',
])

expectContains('stores/dailyDreamArchiveStore.ts', [
  "'/api/art/enqueue'",
  '`/api/art/queue/${jobId}`',
  'entityArt:',
  'async function updateObject(',
  'async function queueObjectArt(',
  'async function applyDreamArt(',
  "await updateObject('dream'",
])

expectContains('server/api/dreams/daily-archive.get.ts', [
  'Characters:',
  'Rewards:',
  'Scenarios:',
  'Bots:',
  'RelationsFrom:',
  'RelationsTo:',
])

console.log('Daily Dream archive workbench contract verified.')
