// A delayed previous-world load must never paint over the current chessboard.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const source = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/board-art.js', import.meta.url),
  ),
  'utf8',
)
const root: { dataset: Record<string, string> } = {
  dataset: { realm: 'sugar' },
}
const images: MockImage[] = []
const callbacks = new Map<string, Array<() => void>>()

class MockImage {
  onload = () => {}
  onerror = () => {}
  src = ''
  naturalWidth = 1200
  naturalHeight = 400

  constructor() {
    images.push(this)
  }
}

runInNewContext(source, {
  Image: MockImage,
  document: { documentElement: root },
  window: {
    addEventListener: (name: string, callback: () => void) => {
      const listeners = callbacks.get(name) ?? []
      listeners.push(callback)
      callbacks.set(name, listeners)
    },
  },
})

const stateCallbacks = callbacks.get('chessweeper:state')
assert.equal(stateCallbacks?.length, 2, 'both art loaders track game state')
const stateChanged = () => {
  for (const callback of stateCallbacks!) callback()
}

assert.equal(images.length, 2, 'first realm loads board and piece atlas')
assert.equal(images[0]!.src, '/images/chessweeper/sugarbomb-board.webp')
assert.equal(
  images[1]!.src,
  '/images/chessweeper/sugarbomb-piece-atlas.webp',
)
assert.equal(root.dataset.boardArt, undefined, 'no board art before load')
assert.equal(root.dataset.pieceArt, undefined, 'no piece art before load')
images[0]!.onload()
assert.equal(root.dataset.boardArt, 'ready')
assert.equal(root.dataset.pieceArt, undefined, 'board load cannot reveal pieces')
images[1]!.onload()
assert.equal(root.dataset.pieceArt, 'ready')

stateChanged()
assert.equal(images.length, 2, 'render loop does not issue repeat requests')

root.dataset.realm = 'ashen'
stateChanged()
assert.equal(images.length, 4, 'world switch starts two independent loads')
assert.equal(root.dataset.boardArt, undefined, 'world switch shows board fallback')
assert.equal(root.dataset.pieceArt, undefined, 'world switch shows piece glyphs')
assert.equal(images[2]!.src, '/images/chessweeper/ashen-board.webp')
assert.equal(images[3]!.src, '/images/chessweeper/ashen-piece-atlas.webp')
images[0]!.onload()
images[1]!.onload()
assert.equal(root.dataset.boardArt, undefined, 'obsolete board load ignored')
assert.equal(root.dataset.pieceArt, undefined, 'obsolete piece load ignored')
images[2]!.onerror()
images[3]!.naturalWidth = 300
images[3]!.onload()
assert.equal(root.dataset.boardArt, undefined, 'missing board stays playable')
assert.equal(root.dataset.pieceArt, undefined, 'undersized atlas keeps glyphs')

root.dataset.realm = 'jackpot'
stateChanged()
assert.equal(images.length, 6)
assert.equal(images[4]!.src, '/images/chessweeper/jackpot-board.webp')
assert.equal(
  images[5]!.src,
  '/images/chessweeper/jackpot-piece-atlas.webp',
)
images[5]!.onload()
assert.equal(root.dataset.pieceArt, 'ready')
assert.equal(root.dataset.boardArt, undefined)
images[4]!.onload()
assert.equal(root.dataset.boardArt, 'ready')
images[2]!.onload()
images[3]!.onerror()
assert.equal(root.dataset.boardArt, 'ready', 'stale load cannot remove board')
assert.equal(root.dataset.pieceArt, 'ready', 'stale error cannot remove pieces')

root.dataset.realm = 'invalid-world'
stateChanged()
assert.equal(root.dataset.boardArt, undefined)
assert.equal(root.dataset.pieceArt, undefined)
assert.equal(images.length, 6, 'unknown worlds do not request resources')

const page = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/index.html', import.meta.url),
  ),
  'utf8',
)
const styles = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/art.css', import.meta.url)),
  'utf8',
)
assert.ok(page.includes('src="/chessweeper/board-art.js"'))
for (const realm of ['sugar', 'ashen', 'jackpot']) {
  assert.ok(styles.includes(`data-realm='${realm}'`))
}
assert.ok(styles.includes("data-board-art='ready'"))
assert.ok(styles.includes("data-piece-art='ready'"))
for (const piece of 'KQRBNPkqrbnp') {
  assert.ok(
    styles.includes(`data-piece='${piece}'`),
    `painted atlas maps chess piece ${piece}`,
  )
}
assert.ok(page.includes('data-piece="${p}"'), 'board emits piece identity')
const manifest = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../public/chessweeper/art-pack.json', import.meta.url),
    ),
    'utf8',
  ),
) as {
  deliveryStatus: string
  pendingRequests: Array<{ id: string; path: string; status: string }>
}
assert.ok(
  ['pending', 'partial', 'delivered'].includes(manifest.deliveryStatus),
  'manifest must distinguish requested art from deployed art',
)
assert.equal(new Set(manifest.pendingRequests.map((r) => r.id)).size, 8)
assert.equal(new Set(manifest.pendingRequests.map((r) => r.path)).size, 8)
for (const request of manifest.pendingRequests) {
  assert.match(request.id, /^chessweeper-t003-[a-z-]+-20261121$/)
  assert.ok(request.path.startsWith('public/images/chessweeper/'))
  assert.ok(request.status, 'each image needs explicit delivery status')
}
assert.ok(
  styles.includes('meta-scrapbook-world.art-pending'),
  'missing scrapbook imagery keeps a designed world card',
)
console.log('chessweeper board-art fallback and manifest: ok')
