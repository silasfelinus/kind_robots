<template>
  <section class="maker-console" aria-label="Save the Plumber Level Maker">
    <div class="maker-topbar">
      <div class="maker-title">
        <span class="maker-kicker">KIND ROBOTS · COURSE WORKSHOP</span>
        <strong>{{ maker.level.title }}</strong>
        <small>{{ maker.level.rows[0]?.length }} × 24 · WORLD {{ maker.level.theme }} · {{ maker.hasChanges ? 'UNSAVED' : 'SAVED' }}</small>
      </div>
      <div class="maker-actions">
        <button type="button" class="maker-action" @click="maker.newDraft(); mode = 'edit'; drawEditor()">✚ <span>NEW</span></button>
        <button type="button" class="maker-action" @click="save">▣ <span>SAVE</span></button>
        <button type="button" class="maker-action maker-action--play" @click="togglePlay">
          {{ mode === 'play' ? '✎ EDIT' : '▶ PLAYTEST' }}
        </button>
        <button type="button" class="maker-action" :disabled="!shareLink" @click="maker.copyShareLink()">↗ <span>SHARE</span></button>
      </div>
    </div>

    <div class="maker-workspace">
      <aside class="maker-sidebar">
        <div class="maker-tabs" role="group" aria-label="Maker panels">
          <button v-for="tab in panels" :key="tab.id" type="button" :aria-pressed="maker.panel === tab.id"
            @click="maker.panel = tab.id">{{ tab.icon }} <span>{{ tab.label }}</span></button>
        </div>

        <div v-if="maker.panel === 'tools'" class="maker-tools kr-scroll">
          <div class="maker-groups" role="group" aria-label="Object categories">
            <button v-for="group in MAKER_GROUPS" :key="group.name" type="button"
              :aria-pressed="maker.selectedGroup === group.name"
              :title="group.name" @click="maker.selectedGroup = group.name">
              <span>{{ group.icon }}</span><small>{{ group.name }}</small>
            </button>
          </div>
          <div class="maker-tool-head">{{ maker.selectedGroup }} · PICK A TOOL</div>
          <div class="maker-tiles">
            <button v-for="tile in selectedTiles" :key="tile.key" type="button"
              class="maker-tile" :aria-pressed="maker.selectedTile === tile.key"
              :title="tile.label" @click="maker.selectedTile = tile.key">
              <span class="maker-glyph">{{ tile.icon }}</span>
              <span class="maker-tile-name">{{ tile.label }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="maker.panel === 'library'" class="maker-library kr-scroll">
          <p class="maker-tool-head">YOUR SAVED COURSES · {{ maker.drafts.length }}/24</p>
          <p v-if="!maker.drafts.length" class="maker-help">Your levels live on this device. Build a course and choose SAVE to begin your library.</p>
          <div v-for="draft in maker.drafts" :key="draft.id" class="maker-draft">
            <strong>{{ draft.level.title }}</strong>
            <small>WORLD {{ draft.level.theme }} · {{ draft.level.rows[0]?.length }} TILES</small>
            <div class="maker-draft-actions">
              <button type="button" @click="loadDraft(draft.id)">✎ EDIT</button>
              <button type="button" @click="playDraft(draft.id)">▶ PLAY</button>
              <button type="button" aria-label="Delete local draft" @click="removeDraft(draft.id)">✕</button>
            </div>
          </div>
        </div>

        <div v-else class="maker-settings kr-scroll">
          <label>COURSE NAME
            <input :value="maker.level.title" maxlength="64" @change="changeTitle($event)" />
          </label>
          <label>BUILDER
            <input :value="maker.level.author" maxlength="32" @change="changeAuthor($event)" />
          </label>
          <label>WORLD ART + BOSS
            <select :value="maker.level.theme" @change="changeTheme($event)">
              <option v-for="world in PLUMBER_WORLDS" :key="world.id" :value="world.id">{{ world.id }} · {{ world.name }}</option>
            </select>
          </label>
          <label class="maker-check">
            <input type="checkbox" :checked="maker.level.dark" @change="changeDark($event)" />
            DARK / LANTERN MODE
          </label>
          <p class="maker-help">All 8 world styles use the same playable mechanics. A boss uses the selected world's moveset. Place one start, one finish, and matching pipe pairs.</p>
        </div>
      </aside>

      <div class="maker-stage">
        <div class="maker-stage-top">
          <span>{{ mode === 'edit' ? 'BUILD / GRID 16px' : 'PLAY / REAL GAME ENGINE' }}</span>
          <div class="maker-stage-controls">
            <template v-if="mode === 'edit'">
              <button type="button" :disabled="!maker.undoStack.length" @click="maker.undo(); drawEditor()" title="Undo (Ctrl+Z)">↶ UNDO</button>
              <button type="button" :disabled="!maker.redoStack.length" @click="maker.redo(); drawEditor()" title="Redo (Ctrl+Y)">↷ REDO</button>
              <button type="button" @click="zoom = Math.max(0.65, zoom - 0.15)">−</button>
              <span>{{ Math.round(zoom * 100) }}%</span>
              <button type="button" @click="zoom = Math.min(1.5, zoom + 0.15)">+</button>
            </template>
            <template v-else>
              <button type="button" @click="restart">↻ RESTART</button>
              <button type="button" @click="togglePlay">✎ EDIT</button>
            </template>
          </div>
        </div>

        <div v-if="mode === 'edit'" class="maker-grid-scroll kr-scroll"
          :style="{ backgroundImage: 'linear-gradient(#07141d8f, #07141dcf), url(/save-the-plumber/maps/world-' + maker.level.theme + '.webp)' }">
          <canvas ref="editorCanvas" class="maker-grid" width="1536" height="576" tabindex="0"
            role="grid" aria-label="Course editor tile grid. Arrow keys move the cursor; Space paints. Drag to paint on touch or mouse."
            :style="{ width: (maker.level.rows[0]!.length * 24 * zoom) + 'px', height: (576 * zoom) + 'px' }"
            @pointerdown="beginPaint" @pointermove="dragPaint" @pointerup="endPaint"
            @pointercancel="endPaint" @keydown="onGridKey" />
        </div>

        <div v-else class="maker-play-stage">
          <canvas ref="gameCanvas" width="480" height="270" role="img" aria-label="Playable Save the Plumber custom level" />
          <div v-if="completed" class="maker-play-result">
            <strong>COURSE CLEARED! ★</strong>
            <p>How was this level?</p>
            <div class="maker-stars" role="group" aria-label="Rate this course on this device">
              <button v-for="stars in 5" :key="stars" type="button"
                :aria-label="'Rate ' + stars + ' stars'" :aria-pressed="maker.myRating === stars"
                @click="maker.rate(stars)">{{ stars <= maker.myRating ? '★' : '☆' }}</button>
            </div>
            <small>Personal rating saved to this device. Community scores are coming later.</small>
            <button type="button" @click="togglePlay">✎ BACK TO EDITOR</button>
          </div>
          <div v-else-if="gameOver" class="maker-play-result">
            <strong>GIVE IT ANOTHER SHOT</strong>
            <button type="button" @click="restart">↻ RETRY COURSE</button>
            <button type="button" @click="togglePlay">✎ EDIT COURSE</button>
          </div>
        </div>

        <div class="maker-stage-bottom">
          <template v-if="mode === 'edit'">
            <span>SELECTED: <strong>{{ selectedLabel }}</strong> · {{ cursor.x + 1 }},{{ cursor.y + 1 }}</span>
            <span>DRAG / TAP TO PLACE · SPACE TO STAMP</span>
          </template>
          <template v-else>
            <span>ARROWS / WASD MOVE · SPACE JUMP · SHIFT RUN · C WRENCH · V SPECIAL</span>
            <span>CAMPAIGN SAVES UNTOUCHED</span>
          </template>
        </div>
        <div v-if="mode === 'play'" class="maker-touch" aria-label="Touch game controls">
          <button v-for="control in touchControls" :key="control.key" type="button"
            @pointerdown.prevent="pressControl(control.key)" @pointerup.prevent="releaseControl(control.key)"
            @pointercancel.prevent="releaseControl(control.key)" @pointerleave="releaseControl(control.key)">{{ control.icon }}</button>
        </div>
      </div>
    </div>

    <footer class="maker-footer">
      <div class="maker-state" role="status" aria-live="polite">
        {{ maker.error || maker.message || (maker.imported ? 'SHARED COURSE / SAVE A COPY' : '24 LOCAL COURSE SLOTS · SHAREABLE PLAY LINKS') }}
      </div>
      <div class="maker-share-field">
        <label for="plumber-share-link">PLAYABLE LINK</label>
        <input id="plumber-share-link" :value="shareLink" readonly aria-label="Playable course sharing URL" @focus="($event.target as HTMLInputElement).select()" />
        <button type="button" :disabled="!shareLink" @click="maker.copyShareLink()">COPY ↗</button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSavePlumberMakerStore } from '~/stores/savePlumberMakerStore'
import { MAKER_GROUPS, validateMakerLevel, toMakerStage } from '~/utils/arcade/games/savePlumberMaker'
import { PLUMBER_WORLDS } from '~/utils/arcade/games/savePlumberWorlds'
import { createSavePlumberPreview, type PlumberRun } from '~/utils/arcade/games/savePlumberPreview'
import { emptyInput, type ArcadeButton } from '~/utils/arcade/types'

const props = defineProps<{ shareCode?: string }>()
const maker = useSavePlumberMakerStore()
const mode = ref<'edit' | 'play'>('edit')
const editorCanvas = ref<HTMLCanvasElement | null>(null)
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const zoom = ref(1)
const cursor = ref({ x: 3, y: 20 })
const completed = ref(false)
const gameOver = ref(false)
const panels = [
  { id: 'tools' as const, icon: '▦', label: 'TOOLS' },
  { id: 'library' as const, icon: '▣', label: 'FILES' },
  { id: 'settings' as const, icon: '⚙', label: 'OPTIONS' },
]
const touchControls: { key: ArcadeButton; icon: string }[] = [
  { key: 'left', icon: '◀' }, { key: 'right', icon: '▶' },
  { key: 'a', icon: 'A / JUMP' }, { key: 'b', icon: 'B / RUN' },
  { key: 'x', icon: 'X' }, { key: 'y', icon: 'Y' },
]
const selectedTiles = computed(() => MAKER_GROUPS.find((group) => group.name === maker.selectedGroup)?.tiles ?? MAKER_GROUPS[0]!.tiles)
const selectedLabel = computed(() => MAKER_GROUPS.flatMap((group) => group.tiles).find((tile) => tile.key === maker.selectedTile)?.label ?? 'Ground')
const shareLink = computed(() => { try { return maker.shareUrl() } catch { return '' } })
const held = new Set<ArcadeButton>()
const pressed = new Set<ArcadeButton>()
let game: PlumberRun | null = null
let frameId = 0
let lastFrame = 0
let accumulator = 0
let painting = false

const palette: Record<string, string> = {
  '#': '#6eaa8f', B: '#f1c66d', '=': '#c6ebda', '<': '#cba7ff',
  '>': '#cba7ff', ':': '#70dcff', w: '#5a9cfc', c: '#a67c56',
  g: '#cb7257', v: '#ffd064', s: '#f9d56e', P: '#b0bbcb', L: '#8bc1b1',
  F: '#a4d5e0', '~': '#c4efff', Q: '#aa9890', D: '#94dcca', E: '#94dcca',
  K: '#ffe396', '^': '#ff8471', X: '#ff7d7d', M: '#fd7799', '@': '#ffffff',
  G: '#fef294', o: '#ffdb80', '*': '#ffea4e', '1': '#fbfe9e', '2': '#a4d7ff',
  '3': '#ebc6ff', '+': '#fba3b1',
}
const symbols = Object.fromEntries(MAKER_GROUPS.flatMap((group) => group.tiles.map((tile) => [tile.key, tile.icon])))

function drawEditor() {
  const canvas = editorCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const rows = maker.level.rows
  const cols = rows[0]!.length
  canvas.width = cols * 24
  canvas.height = rows.length * 24
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = 'bold 16px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = rows[y]![x]!
      if (tile !== '.') {
        ctx.fillStyle = palette[tile] ?? '#efb7b7'
        ctx.globalAlpha = 0.8
        ctx.fillRect(x * 24 + 1, y * 24 + 1, 22, 22)
        ctx.globalAlpha = 1
        ctx.fillStyle = '#1d2938'
        ctx.fillText(symbols[tile] ?? tile, x * 24 + 12, y * 24 + 12)
      }
    }
  }
  ctx.strokeStyle = 'rgba(240,255,249,0.18)'
  ctx.lineWidth = 1
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath(); ctx.moveTo(x * 24 + 0.5, 0); ctx.lineTo(x * 24 + 0.5, canvas.height); ctx.stroke()
  }
  for (let y = 0; y <= rows.length; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * 24 + 0.5); ctx.lineTo(canvas.width, y * 24 + 0.5); ctx.stroke()
  }
  ctx.strokeStyle = '#fff3b2'
  ctx.lineWidth = 2
  ctx.strokeRect(cursor.value.x * 24 + 1, cursor.value.y * 24 + 1, 22, 22)
}

function cellFromPointer(event: PointerEvent) {
  const bounds = editorCanvas.value!.getBoundingClientRect()
  const x = Math.floor((event.clientX - bounds.left) / bounds.width * editorCanvas.value!.width / 24)
  const y = Math.floor((event.clientY - bounds.top) / bounds.height * editorCanvas.value!.height / 24)
  return { x, y }
}
function placeAt(x: number, y: number) {
  if (x < 0 || x >= maker.level.rows[0]!.length || y < 0 || y >= 24) return
  cursor.value = { x, y }
  maker.paint(x, y)
  drawEditor()
}
function beginPaint(event: PointerEvent) {
  if (event.button !== 0) return
  painting = true
  maker.beginStroke()
  editorCanvas.value?.setPointerCapture(event.pointerId)
  const { x, y } = cellFromPointer(event)
  placeAt(x, y)
}
function dragPaint(event: PointerEvent) {
  if (!painting) return
  const { x, y } = cellFromPointer(event)
  placeAt(x, y)
}
function endPaint() { painting = false }
function onGridKey(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) {
    event.preventDefault()
    if (event.key.toLowerCase() === 'y' || event.shiftKey) maker.redo()
    else maker.undo()
    drawEditor()
    return
  }
  const movement: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  }
  if (movement[event.key]) {
    event.preventDefault()
    const [dx, dy] = movement[event.key]!
    cursor.value = {
      x: Math.max(0, Math.min(maker.level.rows[0]!.length - 1, cursor.value.x + dx)),
      y: Math.max(0, Math.min(23, cursor.value.y + dy)),
    }
    drawEditor()
  } else if (event.code === 'Space' || event.key === 'Enter') {
    event.preventDefault()
    maker.beginStroke()
    placeAt(cursor.value.x, cursor.value.y)
  }
}
function save() { maker.saveDraft() }
function loadDraft(id: string) { maker.loadDraft(id); maker.panel = 'tools'; mode.value = 'edit'; nextTick(drawEditor) }
function playDraft(id: string) { maker.loadDraft(id); mode.value = 'play' }
function removeDraft(id: string) { if (window.confirm('Delete this local draft?')) maker.deleteDraft(id) }
function changeTitle(e: Event) { maker.updateSettings({ title: (e.target as HTMLInputElement).value }); drawEditor() }
function changeAuthor(e: Event) { maker.updateSettings({ author: (e.target as HTMLInputElement).value }) }
function changeTheme(e: Event) { maker.updateSettings({ theme: Number((e.target as HTMLSelectElement).value) }); drawEditor() }
function changeDark(e: Event) { maker.updateSettings({ dark: (e.target as HTMLInputElement).checked }) }

function togglePlay() {
  if (mode.value === 'play') { stopGame(); mode.value = 'edit'; nextTick(drawEditor); return }
  try {
    validateMakerLevel(maker.level)
    maker.error = ''
    mode.value = 'play'
  } catch (e) {
    maker.error = e instanceof Error ? e.message : 'Course cannot be played'
  }
}
function stopGame() {
  cancelAnimationFrame(frameId)
  frameId = 0
  game = null
  held.clear()
  pressed.clear()
}
function restart() {
  try {
    game = createSavePlumberPreview({
      rng: Math.random, sound: { play: () => undefined }, demo: false, hiScore: 0,
    }, { customLevel: toMakerStage(validateMakerLevel(maker.level)) })
    completed.value = false
    gameOver.value = false
    held.clear()
    pressed.clear()
    lastFrame = 0
    accumulator = 0
    cancelAnimationFrame(frameId)
    frameId = requestAnimationFrame(tickGame)
  } catch (e) {
    maker.error = e instanceof Error ? e.message : 'Cannot start course'
    mode.value = 'edit'
  }
}
function tickGame(now: number) {
  if (!game || !gameCanvas.value) return
  if (!lastFrame) lastFrame = now
  accumulator = Math.min(100, accumulator + now - lastFrame)
  lastFrame = now
  while (accumulator >= 1000 / 60 && !game.over) {
    const input = emptyInput()
    for (const key of held) input.held[key] = true
    for (const key of pressed) input.pressed[key] = true
    game.update(input)
    pressed.clear()
    accumulator -= 1000 / 60
  }
  const context = gameCanvas.value.getContext('2d')
  if (context) game.render(context)
  if (game.over) {
    completed.value = game.cleared.length > 0
    gameOver.value = !completed.value
    return
  }
  frameId = requestAnimationFrame(tickGame)
}
const keyMap: Record<string, ArcadeButton> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'a', KeyZ: 'a', ShiftLeft: 'b', ShiftRight: 'b',
  KeyX: 'b', KeyC: 'x', KeyV: 'y',
}
function onKeyDown(event: KeyboardEvent) {
  if (mode.value !== 'play') return
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select')) return
  const key = keyMap[event.code]
  if (!key) return
  event.preventDefault()
  if (!held.has(key)) pressed.add(key)
  held.add(key)
}
function onKeyUp(event: KeyboardEvent) {
  const key = keyMap[event.code]
  if (key) held.delete(key)
}
function pressControl(key: ArcadeButton) { if (!held.has(key)) pressed.add(key); held.add(key) }
function releaseControl(key: ArcadeButton) { held.delete(key) }

watch(() => maker.level, () => { if (mode.value === 'edit') nextTick(drawEditor) })
watch(mode, async (next) => {
  await nextTick()
  if (next === 'play') restart()
  else { stopGame(); drawEditor() }
})
onMounted(async () => {
  maker.initialize(props.shareCode)
  if (props.shareCode && !maker.error) mode.value = 'play'
  await nextTick()
  if (mode.value === 'edit') drawEditor()
  else restart()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onUnmounted(() => {
  stopGame()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<style scoped>
.maker-console{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100%;min-height:0;color:#f8f4d8;background:#091c2a;border:2px solid #759c91;border-radius:1rem;overflow:hidden;font:700 .78rem system-ui,sans-serif}
.maker-topbar,.maker-footer{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.5rem .7rem;background:#142d3e}
.maker-title{display:grid;gap:.1rem;min-width:0}
.maker-title strong{font-size:clamp(.95rem,1.65vw,1.5rem);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.maker-title small,.maker-kicker{font-size:.65rem;letter-spacing:.1em;color:#a5cec7}
.maker-actions,.maker-stage-controls,.maker-draft-actions,.maker-tabs,.maker-touch{display:flex;gap:.25rem}
button{font:inherit;cursor:pointer}
button:disabled{opacity:.35;cursor:default}
button:focus-visible,canvas:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #fff1a8;outline-offset:2px}
.maker-action,.maker-stage-controls button,.maker-draft-actions button,.maker-share-field button,.maker-play-result>button{background:#25495c;border:1px solid #69949f;border-radius:.45rem;color:#fff7df;padding:.42rem .55rem;white-space:nowrap}
.maker-action--play{background:#e5ad59;color:#152a35;border-color:#ffeab1}
.maker-workspace{display:grid;grid-template-columns:clamp(10rem,19%,16rem) minmax(0,1fr);min-width:0;min-height:0}
.maker-sidebar{display:grid;grid-template-rows:auto minmax(0,1fr);min-width:0;min-height:0;background:#102538;border-right:2px solid #416a77}
.maker-tabs button{min-width:0;flex:1;padding:.5rem .15rem;background:#1b3446;color:#b9d3d0;border-bottom:2px solid transparent;font-size:.67rem}
.maker-tabs button[aria-pressed=true]{background:#254c5b;color:#fff2be;border-bottom-color:#ffd78a}
.maker-tools,.maker-library,.maker-settings{min-height:0;overflow:auto;padding:.6rem}
.maker-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.25rem}
.maker-groups button{display:grid;place-items:center;gap:.1rem;padding:.35rem .1rem;background:#1e3c4b;color:#e6f4e8;border-radius:.45rem;border:1px solid #365d66}
.maker-groups button span{font-size:1.4rem}
.maker-groups button small{font-size:.57rem}
.maker-groups button[aria-pressed=true]{border-color:#ffd078;background:#466056}
.maker-tool-head{font-size:.62rem;letter-spacing:.12em;color:#e9d4a0;margin:.65rem 0 .4rem}
.maker-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.3rem}
.maker-tile{display:grid;justify-items:center;gap:.1rem;min-height:3.4rem;padding:.28rem .15rem;background:#203d4d;color:#e7f1e6;border:1px solid #396071;border-radius:.45rem;min-width:0}
.maker-tile[aria-pressed=true]{background:#5c6041;border-color:#ffd684;box-shadow:inset 0 0 0 1px #ffdf91}
.maker-glyph{font-size:1.5rem;line-height:1.4}
.maker-tile-name{font-size:.6rem;line-height:1.1;text-align:center}
.maker-library{display:grid;align-content:start;gap:.5rem}
.maker-draft{display:grid;gap:.25rem;padding:.5rem;border-radius:.55rem;background:#244253}
.maker-draft strong{overflow-wrap:anywhere}
.maker-draft small,.maker-help{font-size:.67rem;color:#b7d8d4;line-height:1.45}
.maker-draft-actions button{font-size:.65rem;flex:1}
.maker-settings{display:grid;align-content:start;gap:.7rem}
.maker-settings label{display:grid;gap:.25rem;font-size:.68rem;color:#dfd49d}
.maker-settings input,.maker-settings select,.maker-share-field input{min-width:0;width:100%;background:#eaf2e4;color:#162c38;border-radius:.35rem;border:1px solid #9db9b2;padding:.35rem}
.maker-settings .maker-check{display:flex;align-items:center}
.maker-check input{width:auto}
.maker-stage{display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;min-width:0;min-height:0;background:#0b1a25}
.maker-stage-top,.maker-stage-bottom{display:flex;align-items:center;justify-content:space-between;gap:.4rem;padding:.3rem .55rem;background:#152a38;font-size:.65rem;letter-spacing:.06em}
.maker-stage-controls{align-items:center}
.maker-stage-controls button{font-size:.64rem;padding:.25rem .4rem}
.maker-grid-scroll{min-width:0;min-height:0;overflow:auto;background-position:center;background-size:cover}
.maker-grid{display:block;max-width:none;touch-action:none;cursor:crosshair}
.maker-play-stage{position:relative;display:grid;place-items:center;min-height:0;background:#111925;overflow:hidden}
.maker-play-stage canvas{display:block;width:min(100%,calc((100cqh - 2rem)* 480 / 270));max-height:100%;aspect-ratio:16/9;object-fit:contain;image-rendering:pixelated}
.maker-play-result{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:.6rem;background:#0a1a27e8;text-align:center;padding:1rem}
.maker-play-result strong{font-size:clamp(1.2rem,3vw,2.3rem);color:#ffe49c}
.maker-play-result p{margin:0}
.maker-play-result small{color:#c5d8d4}
.maker-stars button{background:none;border:0;color:#ffe08b;font-size:2.5rem;padding:0 .1rem}
.maker-touch{justify-content:center;background:#193548;padding:.25rem;touch-action:none}
.maker-touch button{flex:1;max-width:6rem;border-radius:.35rem;background:#345c6b;border:1px solid #80abb2;color:#fff0ba;padding:.4rem;font-size:.68rem;touch-action:none;user-select:none}
.maker-footer{min-height:2.7rem}
.maker-state{max-width:38%;font-size:.65rem;line-height:1.3;color:#f9dca0}
.maker-share-field{display:flex;align-items:center;gap:.3rem;min-width:0;flex:1}
.maker-share-field label{white-space:nowrap;font-size:.59rem}
.maker-share-field input{flex:1;font-size:.65rem;padding:.3rem}
.maker-share-field button{font-size:.64rem;padding:.3rem .5rem}
@media(max-width:760px){
 .maker-console{font-size:.69rem}
 .maker-topbar{padding:.3rem;flex-wrap:wrap}
 .maker-title{flex:1}
 .maker-actions{width:100%;justify-content:space-around}
 .maker-action{flex:1;padding:.34rem .2rem}
 .maker-actions .maker-action span{display:none}
 .maker-workspace{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) minmax(7.5rem,35%)}
 .maker-stage{grid-row:1}
 .maker-sidebar{grid-row:2;border-right:0;border-top:2px solid #416a77}
 .maker-groups{grid-template-columns:repeat(5,minmax(0,1fr))}
 .maker-groups button{padding:.15rem}
 .maker-groups button small{font-size:.52rem}
 .maker-tiles{grid-template-columns:repeat(5,minmax(0,1fr))}
 .maker-tile{min-height:2.6rem}
 .maker-tile-name{font-size:.53rem}
 .maker-stage-bottom{display:none}
 .maker-footer{padding:.25rem;flex-wrap:wrap}
 .maker-state{max-width:100%;width:100%}
 .maker-share-field label{display:none}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>
