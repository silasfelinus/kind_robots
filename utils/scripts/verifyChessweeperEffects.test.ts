import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const script = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/visual-effects.js', import.meta.url),
  ),
  'utf8',
)
const children: Array<{
  className: string
  style: { left: string; top: string }
  attributes: Record<string, string>
  remove: () => void
}> = []
const documentListeners = new Map<string, () => void>()
const listeners = new Map<string, (event: { detail?: unknown }) => void>()
const flags = new Set<string>()
let reduced = false
const layer = {
  get childElementCount() {
    return children.length
  },
  get firstElementChild() {
    return children[0]
  },
  append(child: (typeof children)[number]) {
    children.push(child)
  },
  getBoundingClientRect: () => ({ width: 640, height: 640 }),
}
const fakeDocument = {
  hidden: false,
  addEventListener: (name: string, callback: () => void) => {
    documentListeners.set(name, callback)
  },
  documentElement: {
    classList: { contains: (name: string) => flags.has(name) },
  },
  getElementById: (id: string) =>
    id === 'chess-fx'
      ? layer
      : id === 'board'
        ? { querySelector: () => ({ cloneNode: () => ({}) }) }
        : null,
  createElement: (_name: string) => {
    const node = {
      className: '',
      style: {
        left: '',
        top: '',
        setProperty: (_key: string, _value: string) => {},
      },
      attributes: {} as Record<string, string>,
      textContent: '',
      setAttribute(key: string, value: string) {
        node.attributes[key] = value
      },
      addEventListener: () => {},
      append: () => {},
      remove() {
        const at = children.indexOf(node)
        if (at >= 0) children.splice(at, 1)
      },
    }
    return node
  },
}
runInNewContext(script, {
  document: fakeDocument,
  window: {
    addEventListener: (
      name: string,
      callback: (event: { detail?: unknown }) => void,
    ) => {
      listeners.set(name, callback)
    },
    matchMedia: () => ({ matches: reduced }),
  },
  setTimeout: () => 1,
  clearTimeout: () => {},
})
const fire = listeners.get('chessweeper:fx')
assert.ok(fire, 'the gameplay effect listener registers')
fire({ detail: { kind: 'move', square: 0 } })
assert.equal(children.length, 3)
assert.equal(children[0]!.style.left, '6.25%')
assert.equal(children[0]!.style.top, '6.25%')
fire({ detail: { kind: 'capture', square: 119 } })
assert.equal(children.length, 13)
assert.ok(children.some((node) => node.className.includes('chess-fx-capture')))
fire({ detail: { kind: 'invalid', square: 0 } })
assert.equal(children.length, 13, 'unknown effects are ignored')
flags.add('meta-motion-off')
fire({ detail: { kind: 'rush' } })
assert.equal(children.length, 13, 'settings disable emitted effects')
flags.clear()
reduced = true
fire({ detail: { kind: 'victory' } })
assert.equal(children.length, 13, 'reduced motion suppresses particles')
reduced = false
for (let i = 0; i < 20; i++) fire({ detail: { kind: 'mine', square: 34 } })
assert.ok(children.length <= 80, 'particle cap prevents runaway DOM memory')
fire({ detail: { kind: 'capture', from: 0, square: 119 } })
const traveler = children.find((node) =>
  node.className.includes('chess-fx-traveler-capture'),
)
assert.ok(traveler, 'capturing chess pieces travel from source to destination')
assert.equal(traveler.style.left, '6.25%')
assert.equal(traveler.style.top, '6.25%')
assert.ok(
  children.some((node) => node.className.includes('chess-fx-impact-capture')),
  'captures trigger an additional impact choreography',
)
assert.ok(children.length <= 80, 'animated pieces also respect the DOM cap')
fire({ detail: { kind: 'laststand' } })
assert.ok(
  children.some((node) => node.className.includes('chess-fx-impact-laststand')),
  'Ashen Last Stand has a distinct cinematic pulse',
)

fire({ detail: { kind: 'move', from: 128, square: 0 } })
assert.ok(
  !children.some((node) => node.className.includes('chess-fx-traveler-move')),
  'invalid off-board source never creates a moving piece',
)
fire({ detail: { kind: 'move', from: 16, square: 32 } })
const movedPiece = children.find((node) =>
  node.className.includes('chess-fx-traveler-move'),
)
assert.ok(movedPiece, 'ordinary legal moves create animated travelers')
assert.equal(movedPiece.style.left, '6.25%')
assert.equal(movedPiece.style.top, '18.75%')
assert.ok(children.length <= 80, 'ordinary chess moves respect the DOM cap')

const cinematicCount = () =>
  children.filter((node) => node.className.includes('chess-fx-cinematic'))
    .length
assert.equal(
  cinematicCount(),
  0,
  'reduced motion suppressed the earlier cinematic',
)
fire({ detail: { kind: 'victory', realm: 'ashen' } })
const victory = children.find((node) =>
  node.className.includes('chess-fx-cinematic-ashen'),
)
assert.ok(victory, 'victory shows a world-specific cinematic')
assert.equal(victory.attributes.role, 'status')
assert.equal(victory.attributes['aria-label'], 'THE EMBERS ENDURE')
fire({ detail: { kind: 'defeat', realm: 'sugar' } })
assert.equal(
  cinematicCount(),
  1,
  'a new outcome replaces the previous cinematic',
)
fakeDocument.hidden = true
documentListeners.get('visibilitychange')?.()
assert.equal(cinematicCount(), 0, 'hiding the page clears the cinematic')
fakeDocument.hidden = false
fire({ detail: { kind: 'victory', realm: 'unknown' } })
assert.equal(cinematicCount(), 0, 'unknown worlds never render a cinematic')

const html = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/index.html', import.meta.url),
  ),
  'utf8',
)
const css = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/visual-effects.css', import.meta.url),
  ),
  'utf8',
)
assert.ok(html.includes('id="chess-fx"'))
assert.ok(html.includes('src="/chessweeper/visual-effects.js"'))
assert.ok(html.includes('href="/chessweeper/visual-effects.css"'))
for (const kind of [
  'capture',
  'mine',
  'blade',
  'rush',
  'laststand',
  'wager',
  'jackpot',
  'victory',
  'defeat',
]) {
  assert.ok(
    html.includes("effect('" + kind + "'") ||
      html.includes(
        kind === 'victory' ? "'victory' : 'defeat'" : "'" + kind + "'",
      ),
  )
}
assert.ok(css.includes('prefers-reduced-motion'))
assert.ok(css.includes('meta-motion-off'))
assert.ok(css.includes('chess-fx-travel'))
assert.ok(css.includes('chess-fx-impact-rush'))
assert.ok(css.includes('chess-fx-impact-jackpot'))
assert.ok(html.includes('from: chosen[0]'))
console.log('chessweeper gameplay visual-effects: ok')
