import { readFileSync, rmSync, writeFileSync } from 'node:fs'

function replaceOnce(path, pattern, replacement) {
  const before = readFileSync(path, 'utf8')
  const after = before.replace(pattern, replacement)
  if (after === before) {
    throw new Error(`Taskmaster cutover pattern did not match ${path}`)
  }
  writeFileSync(path, after)
}

replaceOnce(
  'stores/helpers/dashboardHelper.ts',
  /      \{\n        key: 'serendipity',\n[\s\S]*?        route: '\/serendipity',\n      \},\n(?=      \{\n        key: 'serendipity-voice',)/,
  `      {
        key: 'taskmaster',
        label: 'Taskmaster',
        icon: 'kind-icon:gearhammer',
        title: 'Taskmaster',
        summary: 'Turn real objectives into a choice-driven adventure.',
        // Shared temporarily until the dedicated Taskmaster art set lands.
        image: tabImage('scenario', 'storymaker'),
        narrative:
          'Taskmaster wraps real work in a second-person quest while keeping the actual objective visible and every write-back explicit.',
        route: '/taskmaster',
      },
`,
)

replaceOnce(
  'stores/helpers/tutorialCards.ts',
  /      \{\n        key: 'serendipity',\n[\s\S]*?        image: tutorialImage\('scenario', 'serendipity'\),\n      \},\n(?=      \{\n        key: 'storymaker',)/,
  `      {
        key: 'taskmaster',
        title: 'Taskmaster',
        body: 'Choose a project or enter an objective, select narrative ingredients, and advance real work through a playful second-person quest. Taskmaster directs story art automatically and never applies real-world changes without review.',
        // Shared temporarily until the dedicated Taskmaster tutorial art lands.
        image: tutorialImage('scenario', 'storymaker'),
      },
`,
)

for (const path of [
  'content/taskmaster.md',
  'content/channels/play/taskmaster.md',
]) {
  replaceOnce(path, 'dashboardTab: serendipity', 'dashboardTab: taskmaster')
}

rmSync('plugins/taskmaster-product-config.ts')

const dashboard = readFileSync('stores/helpers/dashboardHelper.ts', 'utf8')
const tutorials = readFileSync('stores/helpers/tutorialCards.ts', 'utf8')
if (dashboard.includes("route: '/serendipity'")) {
  throw new Error('The obsolete /serendipity dashboard route survived the cutover.')
}
if (dashboard.includes("key: 'serendipity',")) {
  throw new Error('The obsolete Serendipity dashboard key survived the cutover.')
}
if (tutorials.includes("key: 'serendipity',")) {
  throw new Error('The obsolete Serendipity tutorial key survived the cutover.')
}

rmSync('utils/scripts/applyTaskmasterSourceCutover.mjs')
rmSync('.github/workflows/taskmaster-source-cutover.yml')
