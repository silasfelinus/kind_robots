// A delayed previous-world load must never paint over the current chessboard.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const source = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/board-art.js', import.meta.url)),
  'utf8',
)
const root: { dataset: Record<string, string> } = {
  dataset: { realm: 'sugar' },
}
const images: MockImage[] = []
const callbacks = new Map<string, () => void>()

class MockImage {
  onload = () => {}
  onerror = () => {}
  src = ''

  constructor() {
    images.push(this)
  }
}

runInNewContext(source, {
  Image: MockImage,
  document: { documentElement: root },
  window: {
    addEventListener: (name: string, callback: () => void) => {
      callbacks.set(name, callback)
    },
  },
})
const stateChanged = callbacks.get('chessweeper:state')
assert.ok(stateChanged, 'board art follows actual game state')

assert.equal(images.length, 1)
assert.equal(images[0]!.src, '/images/chessweeper/sugarbomb-board.webp')
assert.equal(root.dataset.boardArt, undefined, 'no art before load')
images[0]!.onload()
assert.equal(root.dataset.boardArt, 'ready')

stateChanged()
assert.equal(images.length, 1, 'render loop does not issue repeat requests')

root.dataset.realm = 'ashen'
stateChanged()
assert.equal(root.dataset.boardArt, undefined, 'world switch shows fallback')
assert.equal(images[1]!.src, '/images/chessweeper/ashen-board.webp')
images[0]!.onload()
assert.equal(root.dataset.boardArt, undefined, 'obsolete image load ignored')
images[1]!.onerror()
assert.equal(root.dataset.boardArt, undefined, 'missing art stays playable')

root.dataset.realm = 'jackpot'
stateChanged()
assert.equal(images[2]!.src, '/images/chessweeper/jackpot-board.webp')
images[2]!.onload()
assert.equal(root.dataset.boardArt, 'ready')

root.dataset.realm = 'invalid-world'
stateChanged()
assert.equal(root.dataset.boardArt, undefined)
assert.equal(images.length, 3, 'unknown worlds do not request resources')

const page = readFileSync(
  fileURLToPath(new URL('../../public/chessweeper/index.html', import.meta.url)),
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
const manifest = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../public/chessweeper/art-pack.json', import.meta.url)),
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
  styles.includes("meta-scrapbook-world.art-pending"),
  'missing scrapbook imagery keeps a designed world card',
)
console.log('chessweeper board-art fallback and manifest: ok')
