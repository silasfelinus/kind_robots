import assert from 'node:assert/strict'
import test from 'node:test'
import { judge, judgeLegacy } from './auditTabletNavigation.mjs'

function fixture(viewport = 820, left = 100) {
  const width = Math.max(480, Math.min(1760, viewport - left - 12))
  return {
    trigger: { left },
    menu: { left, right: left + width, width },
    channels: 4,
    cards: 12,
  }
}

test('accepts the launcher filling the available portrait and landscape width', () => {
  assert.deepEqual(judge(fixture(820), 820), [])
  assert.deepEqual(judge(fixture(1180), 1180), [])
})

test('accepts the 480px minimum launcher width when room is narrow', () => {
  assert.deepEqual(judge(fixture(820, 330), 820), [])
})

test('rejects a launcher width that fails to use the available viewport', () => {
  const narrow = fixture()
  narrow.menu.width -= 50
  assert.match(judge(narrow, 820).join(' '), /WIDTH/)
})

test('rejects a displaced anchor and a launcher beyond viewport bounds', () => {
  const displaced = fixture()
  displaced.menu.left += 20
  assert.match(judge(displaced, 820).join(' '), /ANCHOR/)

  const overflow = fixture()
  overflow.menu.right += 30
  assert.match(judge(overflow, 820).join(' '), /INSIDE/)
})

test('rejects a launcher with empty channel rail or destination cards', () => {
  const noChannels = fixture()
  noChannels.channels = 0
  assert.match(judge(noChannels, 820).join(' '), /CHANNELS/)

  const noCards = fixture()
  noCards.cards = 0
  assert.match(judge(noCards, 820).join(' '), /CARDS/)
})

function legacyFixture(columns, left = 100, width = columns * 288 + 16) {
  return {
    columns,
    trigger: { left },
    menu: { left, right: left + width, width },
    rows: 10,
    tallRows: [],
  }
}

test('still validates deployed two-column and three-column tab menus', () => {
  assert.deepEqual(judgeLegacy(legacyFixture(2), 820), [])
  assert.deepEqual(judgeLegacy(legacyFixture(3), 1180), [])
})

test('legacy geometry flags misplaced, too-wide and empty tab menus', () => {
  const misplaced = legacyFixture(2)
  misplaced.menu.left += 20
  assert.match(judgeLegacy(misplaced, 820).join(' '), /ANCHOR/)

  const tooWide = legacyFixture(3)
  assert.match(judgeLegacy(tooWide, 820).join(' '), /INSIDE|COLUMNS/)

  const empty = legacyFixture(2)
  empty.rows = 0
  assert.match(judgeLegacy(empty, 820).join(' '), /DENSITY/)
})
