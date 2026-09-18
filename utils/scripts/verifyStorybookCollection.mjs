import { readFileSync } from 'node:fs'

const path = 'components/storybook/storybook-collection.vue'
const source = readFileSync(path, 'utf8')

const checks = [
  [
    'ending cards keep the shared 2:3 collectible shape',
    /v-for="ending in runStore\.collection\.endings"[\s\S]{0,260}aspect-\[2\/3\]/.test(source),
  ],
  [
    'hero art is rendered only for unlocked endings',
    /v-if="ending\.unlocked && ending\.heroImage"/.test(source),
  ],
  [
    'locked endings never render their title',
    /ending\.unlocked \? ending\.title : 'Undiscovered ending'/.test(source),
  ],
  [
    'locked endings never render their summary',
    /v-if="ending\.unlocked && ending\.summary"/.test(source),
  ],
  [
    'locked endings use a lock instead of their private icon',
    /ending\.unlocked && ending\.icon \? ending\.icon : 'kind-icon:lock'/.test(source),
  ],
]

let failures = 0
for (const [label, passed] of checks) {
  if (passed) {
    console.log(`PASS ${label}`)
  } else {
    failures += 1
    console.error(`FAIL ${label}`)
  }
}

if (failures) {
  console.error(`\n${failures} Storybook Collection contract check(s) failed`)
  process.exit(1)
}

console.log('\nStorybook Collection contract passed.')
