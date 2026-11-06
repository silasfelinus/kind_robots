// /utils/scripts/verifyCthulhuquariumConsoleNav.test.ts
//
// cthulhuquarium/t-098: the console's five deck tabs over the game's six
// rooms (utils/cthulhuquariumConsole.ts). Pure mapping, no DOM.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import {
  averageFed,
  CONSOLE_TABS,
  cycleConsoleTab,
  tabForPanel,
  tabForStoryFocus,
  tankDayNumber,
} from '../cthulhuquariumConsole.js'
import { rarityKey, rarityLabel, rarityRank } from '../cthulhuquariumRarity.js'

assert.deepEqual(
  CONSOLE_TABS.map((tab) => tab.id),
  ['tank', 'feed', 'creatures', 'relics', 'market'],
  'the deck is Tank, Feed, Creatures, Relics, Market in that order',
)

assert.equal(tabForPanel(null, false), 'tank')
assert.equal(tabForPanel(null, true), 'feed')
assert.equal(
  tabForPanel('scenery', false),
  'tank',
  'World & story is off the Tank',
)
assert.equal(tabForPanel('shop', true), 'market', 'a room wins over feeding')
assert.equal(tabForPanel('roster', false), 'creatures')
assert.equal(tabForPanel('bestiary', false), 'creatures')
assert.equal(tabForPanel('sets', false), 'relics')
assert.equal(tabForPanel('decor', false), 'relics')

assert.equal(cycleConsoleTab('tank', -1), 'market', 'L wraps to the last tab')
assert.equal(cycleConsoleTab('market', 1), 'tank', 'R wraps to the first tab')
assert.equal(cycleConsoleTab('feed', 1), 'creatures')
assert.equal(cycleConsoleTab('relics', -1), 'creatures')

assert.equal(tabForStoryFocus('shop'), 'market')
assert.equal(tabForStoryFocus('bestiary'), 'creatures')
assert.equal(tabForStoryFocus('decor'), 'relics')
assert.equal(tabForStoryFocus('feed'), 'feed')
assert.equal(tabForStoryFocus('coins'), null)
assert.equal(tabForStoryFocus(null), null)

assert.equal(averageFed([]), null, 'an empty tank shows no fed meter')
assert.equal(averageFed([100, 50, 0]), 50)
assert.equal(averageFed([33, 34]), 34)

const created = Date.parse('2026-11-01T12:00:00Z')
assert.equal(tankDayNumber(null, created), null)
assert.equal(tankDayNumber('not a date', created), null)
assert.equal(tankDayNumber('2026-11-01T12:00:00Z', created), 1)
assert.equal(
  tankDayNumber('2026-11-01T12:00:00Z', created + 13 * 86_400_000 + 5),
  14,
)

assert.equal(rarityKey('MYTHIC'), 'mythic')
assert.equal(rarityKey('unknown'), 'common')
assert.equal(rarityLabel('LEGENDARY'), 'Legendary')
assert.ok(rarityRank('MYTHIC') > rarityRank('EPIC'))

const artComponent = readFileSync(
  'components/cthulhuquarium/cthulhuquarium-ui-art.vue',
  'utf8',
)
for (const tab of CONSOLE_TABS) {
  assert.match(
    artComponent,
    new RegExp(`name === '${tab.art}'`),
    `${tab.art} has an SVG fallback until its painted render lands`,
  )
}
for (const name of [
  'coin',
  'plinth',
  'corner-ornament',
  'meter-hunger',
  'meter-clean',
  'meter-mood',
  'capacity',
  'day-moon',
]) {
  assert.match(
    artComponent,
    new RegExp(`name === '${name}'`),
    `${name} has an SVG fallback until its painted render lands`,
  )
}
assert.match(
  artComponent,
  /import\.meta\.glob<string>\(\s*'\.\.\/\.\.\/assets\/images\/cthulhuquarium\/ui\/\*\.webp'/,
  'painted UI renders are picked up from assets/images/cthulhuquarium/ui/',
)
assert.ok(
  existsSync(
    'assets/images/cthulhuquarium/portraits/charlotte-fishmonger-presenting.webp',
  ),
  'the Market keeper has her canon portrait',
)

console.log('verifyCthulhuquariumConsoleNav: all assertions passed')
