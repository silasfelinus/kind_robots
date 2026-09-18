import fs from 'node:fs'

let failures = 0

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function check(label, condition) {
  if (condition) {
    console.log(`✓ ${label}`)
    return
  }
  failures += 1
  console.error(`✗ ${label}`)
}

const table = read('components/storybook/storybook-table.vue')
const reading = read('components/storybook/storybook-reading.vue')
const shell = read('components/pages/storybook-page.vue')
const storymaker = read('components/storybook/storybook-storymaker.vue')

console.log('Storybook Table — one card-driven surface')

check(
  'the Table exposes a single visual card hand',
  table.includes('data-testid="storybook-hand"'),
)
check(
  'the Table exposes card slots rather than a setup wizard',
  table.includes('data-testid="storybook-slots"') &&
    !table.includes('currentStep') &&
    !table.includes('setup-step'),
)
check(
  'the Table keeps mode selection in the card hand',
  /MODE_CARDS/.test(table) && /kind: 'mode'/.test(table),
)
check(
  'the Table keeps narrator selection in the card hand',
  /kind: 'narrator'/.test(table),
)
check(
  'ordinary controls stay outside the card flavor system',
  table.includes('data-testid="storybook-settings"') &&
    /type="range"/.test(table) &&
    /Start Reading/.test(table),
)

console.log('\nStorybook Table — the four modes are real choices')

for (const mode of ['open-ended', 'episodic', 'structured', 'taskmaster']) {
  check(`mode card exists: ${mode}`, table.includes(`mode: '${mode}'`))
}
check(
  'mode cards use real image-shaped art slots',
  /aspect-\[2\/3\]/.test(table) && /card\.art/.test(table),
)
check(
  'mode cards carry the four authored art paths',
  [
    '/images/storybook/modes/open-ended.webp',
    '/images/storybook/modes/episodic.webp',
    '/images/storybook/modes/structured.webp',
    '/images/storybook/modes/taskmaster.webp',
  ].every((path) => table.includes(path)),
)

console.log('\nStorybook Table — mode-specific settings stay settings')

check(
  'the length dial is hidden for endless open-ended mode',
  /v-if="!isEndlessOpenEnded"/.test(table),
)
check(
  'taskmaster objective is a plain input, not a flavor card',
  /v-if="isTaskmaster"[\s\S]{0,500}v-model="questObjective"/.test(table),
)
check(
  'taskmaster requires a project Thread card',
  /selected\.project/.test(table) && /Thread/.test(table),
)

console.log('\nStorybook Reading — the story is the center')

check(
  'the Reading exposes the narrative page',
  reading.includes('data-testid="storybook-reading-page"'),
)
check(
  'the Reading exposes choices separately from the narrative',
  reading.includes('data-testid="storybook-reading-choices"'),
)
check(
  'the Reading exposes played cards as a side ledger',
  reading.includes('data-testid="storybook-reading-ledger"'),
)
check(
  'the Reading uses scene art when the run has it',
  /latestArt/.test(reading) && /imagePath/.test(reading),
)
check(
  'custom actions remain ordinary controls',
  /v-model="customMove"/.test(reading) && /Submit/.test(reading),
)

console.log('\nStorybook Reading — turn semantics')

check(
  'the turn pips only count toward a budget when there is one',
  /v-if="runStore\.isEndless"[\s\S]{0,200}no last page/.test(reading),
)
check(
  'the end-of-story button reads as the reader\'s own move when endless',
  /runStore\.isEndless \? 'Bring this to an end'/.test(reading),
)
check(
  'resolving is offered on the server\'s word, not a local guess',
  /v-if="runStore\.readyToResolve"/.test(reading),
)

console.log('\nStorybook Reading — the deck keeps its secrets')

check(
  'the ledger renders only when the server sent stats at all',
  /v-if="runStore\.stats"/.test(reading),
)
check(
  'the real objective is a field beside the fiction, not prose',
  reading.includes('storybook-quest-objective') &&
    /quest\.objective/.test(reading),
)

console.log('\nStorybook Taskmaster — the accept step is the feature')

check(
  'a proposal says what applying would do before it is applied',
  /proposal\.effect/.test(reading) && /proposal\.note/.test(reading),
)
check(
  'an unapplied proposal is labelled as not having happened',
  /Not applied — nothing has changed yet/.test(reading),
)
check(
  'accepting is a button the reader presses, not a turn side effect',
  /runStore\.applyProposal\(proposal\.id\)/.test(reading) &&
    !/applyProposal/.test(table),
)
check(
  'an applied proposal renders differently from an unapplied one',
  /v-if="proposal\.applied"/.test(reading),
)
check(
  'the Thread slot deals real projects in taskmaster mode',
  /isTaskmaster\.value\s*\n?\s*\? projectCards\.value/.test(table) &&
    /conductorSlug/.test(table),
)
check(
  'a taskmaster quest refuses to open without an objective and a project',
  /needs an objective/.test(table) && /Thread slot/.test(table),
)

console.log('\nStorybook — the storymaker is the front door')

check(
  'the shell opens on the storymaker',
  shell.includes('<StorybookStorymaker v-if="!legacy"'),
)
check(
  'the outgoing beat loop is reachable only at ?legacy=1',
  /route\.query\.legacy === '1'/.test(shell),
)
check(
  'the storymaker resumes an active run on mount',
  storymaker.includes('runStore.resumeActiveRun()'),
)
check(
  'the storymaker shows the Reading when there is a run, the Table when not',
  /<StorybookReading[\s\S]{0,120}v-else-if="runStore\.run"/.test(storymaker) &&
    storymaker.includes('<StorybookTable'),
)
check(
  'a resolved run shows its ending rather than another turn',
  storymaker.includes('<StorybookEnding') &&
    /runStore\.isComplete && runStore\.ending/.test(storymaker),
)
check(
  'the Collection is reachable from the Table, not behind a run',
  table.includes('<StorybookCollection') &&
    !storymaker.includes('<StorybookCollection'),
)

console.log('\nStorybook Ending — credit without spoilers')

const endingScreen = read('components/storybook/storybook-ending.vue')
const collectionScreen = read('components/storybook/storybook-collection.vue')

check(
  'the ending reveal names the deck total it was added to',
  endingScreen.includes('Added to your collection') &&
    /collection\.found/.test(endingScreen) &&
    /collection\.total/.test(endingScreen),
)
check(
  'an unfound ending renders no title and no summary',
  /entry\.unlocked \? entry\.title : 'Not found yet'/.test(endingScreen) &&
    /v-if="entry\.unlocked"[\s\S]{0,120}entry\.title/.test(endingScreen),
)
check(
  'a thousand-ending album is capped rather than drawn tile by tile',
  /MAX_ALBUM_TILES/.test(endingScreen),
)
check(
  'found endings are drawn before the dark ones',
  /const found = all\.filter\(\(entry\) => entry\.unlocked\)/.test(
    endingScreen,
  ),
)
check(
  'the Collection reads adventures off the server, not localStorage',
  /runStore\.fetchAdventures\(\)/.test(collectionScreen) &&
    !/localStorage\.(get|set|remove)Item/.test(collectionScreen),
)
check(
  'the Collection renders endings as 2:3 collectible cards',
  collectionScreen.includes('data-testid="storybook-ending-collection"') &&
    /aspect-\[2\/3\]/.test(collectionScreen),
)
check(
  'ending art is revealed only for unlocked collection cards',
  /v-if="ending\.unlocked && ending\.heroImage"/.test(collectionScreen) &&
    /ending\.unlocked \? ending\.title : 'Undiscovered ending'/.test(
      collectionScreen,
    ),
)
check(
  'locked collection cards keep an image-shaped mystery slot',
  collectionScreen.includes("'kind-icon:lock'") &&
    collectionScreen.includes('Keep reading to reveal this card.'),
)

if (failures > 0) {
  console.error(`\n${failures} Storybook Table/Reading check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll Storybook Table and Reading checks passed.')
