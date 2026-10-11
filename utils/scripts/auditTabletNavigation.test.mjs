import assert from 'node:assert/strict'
import test from 'node:test'
import { judge } from './auditTabletNavigation.mjs'

function fixture(columns, left = 100, width = columns * 288 + 16) {
  return {
    columns,
    trigger: { left },
    menu: { left, right: left + width, width },
    rows: 10,
    tallRows: [],
  }
}

test('accepts approved two-column portrait and three-column landscape menus', () => {
  assert.deepEqual(judge(fixture(2), 820), [])
  assert.deepEqual(judge(fixture(3), 1180), [])
})

test('accepts one column clamped to the remaining viewport space', () => {
  assert.deepEqual(judge(fixture(1, 600, 208), 820), [])
})

test('rejects a menu whose width does not match its rendered columns', () => {
  assert.match(judge(fixture(1, 100, 592), 820).join(' '), /WIDTH/)
})

test('rejects columns squeezed into insufficient space', () => {
  assert.match(judge(fixture(3, 100, 708), 820).join(' '), /COLUMNS/)
})

test('rejects overflow, a displaced anchor and excessive columns', () => {
  const overflow = fixture(3)
  assert.match(judge(overflow, 820).join(' '), /INSIDE/)
  const displaced = fixture(1)
  displaced.menu.left += 20
  assert.match(judge(displaced, 820).join(' '), /ANCHOR/)
  assert.match(judge(fixture(4), 1920).join(' '), /COLUMNS/)
})

test('rejects empty menus and tall rows without requiring hidden descriptions', () => {
  const empty = fixture(2)
  empty.rows = 0
  assert.match(judge(empty, 820).join(' '), /no rows/)
  const tall = fixture(2)
  tall.tallRows = ['Example (80px)']
  assert.match(judge(tall, 820).join(' '), /taller/)
})
