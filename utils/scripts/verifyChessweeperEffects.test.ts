import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const script = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/visual-effects.js', import.meta.url)),
  'utf8',
)
const children: Array<{
  className: string
  style: { left: string; top: string }
  remove: () => void
}> = []
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
}
const fakeDocument = {
  documentElement: { classList: { contains: (name: string) => flags.has(name) } },
  getElementById: (id: string) => (id === 'chess-fx' ? layer : null),
  createElement: (_name: string) => {
    const node = {
      className: '',
      style: {
        left: '',
        top: '',
        setProperty: (_key: string, _value: string) => {},
      },
      addEventListener: () => {},
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
    addEventListener: (name: string, callback: (event: { detail?: unknown }) => void) => {
      listeners.set(name, callback)
    },
    matchMedia: () => ({ matches: reduced }),
  },
  setTimeout: () => 1,
})
const fire = listeners.get('chessweeper:fx')
assert.ok(fire, 'the gameplay effect listener registers')
fire({ detail: { kind: 'move', square: 0 } })
assert.equal(children.length, 3)
assert.equal(children[0]!.style.left, '6.25%')
assert.equal(children[0]!.style.top, '6.25%')
fire({ detail: { kind: 'capture', square: 119 } })
assert.equal(children.length, 12)
assert.ok(children.some((node) => node.className.includes('chess-fx-capture')))
fire({ detail: { kind: 'invalid', square: 0 } })
assert.equal(children.length, 12, 'unknown effects are ignored')
flags.add('meta-motion-off')
fire({ detail: { kind: 'rush' } })
assert.equal(children.length, 12, 'settings disable emitted effects')
flags.clear()
reduced = true
fire({ detail: { kind: 'victory' } })
assert.equal(children.length, 12, 'reduced motion suppresses particles')
reduced = false
for (let i = 0; i < 20; i++) fire({ detail: { kind: 'mine', square: 34 } })
assert.ok(children.length <= 80, 'particle cap prevents runaway DOM memory')

const html = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/index.html', import.meta.url)),
  'utf8',
)
const css = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/visual-effects.css', import.meta.url)),
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
  assert.ok(html.includes("effect('" + kind + "'") || html.includes(
    kind === 'victory' ? "'victory' : 'defeat'" : "'"+kind+"'",
  ))
}
assert.ok(css.includes('prefers-reduced-motion'))
assert.ok(css.includes('meta-motion-off'))
console.log('chessweeper gameplay visual-effects: ok')
