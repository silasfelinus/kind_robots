<!-- /components/content/screenfx/ascii-aquarium.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const FISH_GLYPHS_R = ['><>', '>=>', '><(((°>', '𓆝', '🐠', '🐟', '🐡']
const FISH_GLYPHS_L = ['<><', '<=<', '<°)))><', '𓆟', '🐠', '🐟', '🐡']
const BUBBLE_GLYPHS = ['o', 'O', '°', '·', '∘']
const CREATURE_GLYPHS = ['🦑', '🐙', '🪼', '🦀', '🦞', '🐚', '⭐']
const SEAWEED_GLYPHS = ['{{{', ')))', '|||', '≋≋≋', '^^^', 'www']
const PELLET_GLYPH = '·'

interface Fish {
  id: number
  glyphR: string
  glyphL: string
  x: number
  y: number
  vx: number
  baseY: number
  size: number
  phase: number
  phaseSpeed: number
  curiosity: number
  direction: 1 | -1
  hue: number
  alpha: number
  targetX: number | null
  targetY: number | null
  isRobot: boolean
}

interface Bubble {
  id: number
  glyph: string
  x: number
  y: number
  vy: number
  size: number
  alpha: number
  phase: number
}

interface Seaweed {
  x: number
  baseY: number
  height: number
  phase: number
  phaseSpeed: number
  glyph: string
  hue: number
}

interface Pellet {
  id: number
  x: number
  y: number
  vy: number
  life: number
}

interface Creature {
  id: number
  glyph: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
  direction: 1 | -1
}

interface Ripple {
  x: number
  y: number
  r: number
  life: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))

const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)]!

let uidValue = 0

const uid = () => {
  uidValue += 1
  return uidValue
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let rafId: number | null = null
let cleanupHandlers: (() => void) | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const fish: Fish[] = []
  const bubbles: Bubble[] = []
  const pellets: Pellet[] = []
  const creatures: Creature[] = []
  const ripples: Ripple[] = []

  let seaweed: Seaweed[] = []
  let mouseX = -999
  let mouseY = -999
  let lastMouseX = -999
  let lastMouseY = -999
  let mouseSpeed = 0
  let frame = 0
  let nextFish = 90
  let nextBubble = 30
  let nextCreature = 1800 + randInt(0, 1200)

  const buildSeaweed = () => {
    seaweed = []

    const count = Math.floor(canvas.width / 90) + 4

    for (let i = 0; i < count; i++) {
      seaweed.push({
        x: rand(20, canvas.width - 20),
        baseY: canvas.height,
        height: rand(40, 140),
        phase: rand(0, Math.PI * 2),
        phaseSpeed: rand(0.012, 0.028),
        glyph: pick(SEAWEED_GLYPHS),
        hue: rand(90, 160),
      })
    }
  }

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    buildSeaweed()
  }

  const spawnFish = () => {
    const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1
    const isRobot = Math.random() > 0.85
    const glyphIdx = randInt(0, FISH_GLYPHS_R.length - 1)
    const y = rand(canvas.height * 0.1, canvas.height * 0.8)

    fish.push({
      id: uid(),
      glyphR: isRobot ? '🤖' : FISH_GLYPHS_R[glyphIdx]!,
      glyphL: isRobot ? '🤖' : FISH_GLYPHS_L[glyphIdx]!,
      x: dir === 1 ? -60 : canvas.width + 60,
      y,
      vx: dir * rand(0.5, 2.2),
      baseY: y,
      size: rand(12, 22),
      phase: rand(0, Math.PI * 2),
      phaseSpeed: rand(0.02, 0.05),
      curiosity: 0,
      direction: dir,
      hue: rand(0, 360),
      alpha: 0,
      targetX: null,
      targetY: null,
      isRobot,
    })
  }

  const spawnBubble = (atX?: number) => {
    bubbles.push({
      id: uid(),
      glyph: pick(BUBBLE_GLYPHS),
      x: atX ?? rand(10, canvas.width - 10),
      y: canvas.height + 10,
      vy: rand(0.4, 1.4),
      size: rand(8, 18),
      alpha: rand(0.4, 0.9),
      phase: rand(0, Math.PI * 2),
    })
  }

  const spawnCreature = () => {
    const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1

    creatures.push({
      id: uid(),
      glyph: pick(CREATURE_GLYPHS),
      x: dir === 1 ? -80 : canvas.width + 80,
      y: rand(canvas.height * 0.15, canvas.height * 0.75),
      vx: dir * rand(0.3, 0.9),
      vy: 0,
      size: rand(28, 48),
      phase: rand(0, Math.PI * 2),
      direction: dir,
    })
  }

  const onPointerMove = (e: PointerEvent) => {
    const dx = e.clientX - mouseX
    const dy = e.clientY - mouseY

    mouseSpeed = Math.sqrt(dx * dx + dy * dy)

    lastMouseX = mouseX
    lastMouseY = mouseY
    mouseX = e.clientX
    mouseY = e.clientY
  }

  const onClick = (e: MouseEvent) => {
    for (let i = 0; i < randInt(3, 6); i++) {
      pellets.push({
        id: uid(),
        x: e.clientX + rand(-20, 20),
        y: e.clientY,
        vy: rand(0.4, 1.2),
        life: 1,
      })
    }

    ripples.push({
      x: e.clientX,
      y: e.clientY,
      r: 0,
      life: 1,
    })

    for (const f of fish) {
      if (Math.random() > 0.4) {
        f.targetX = e.clientX + rand(-30, 30)
        f.targetY = e.clientY + rand(-20, 20)
        f.curiosity = 1
      }
    }
  }

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    alpha: number,
    hue?: number,
    extraFilter?: string,
  ) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = `${size}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle =
      hue !== undefined ? `hsl(${hue},80%,70%)` : 'rgba(255,255,255,0.9)'

    if (extraFilter) {
      ctx.filter = extraFilter
    }

    ctx.fillText(text, x, y)
    ctx.restore()
  }

  const drawSeaweed = () => {
    for (const sw of seaweed) {
      sw.phase += sw.phaseSpeed

      const segments = Math.floor(sw.height / 14)

      for (let s = 0; s < segments; s++) {
        const t = s / segments
        const wave = Math.sin(sw.phase + s * 0.5) * (6 + t * 4)
        const sx = sw.x + wave
        const sy = sw.baseY - s * 14
        const alpha = 0.35 + t * 0.45

        drawText(sw.glyph, sx, sy, 13 + t * 4, alpha, sw.hue + s * 3)
      }
    }
  }

  const updateBubbles = () => {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]!

      b.phase += 0.04
      b.y -= b.vy
      b.x += Math.sin(b.phase) * 0.4
      b.alpha = Math.max(0, b.alpha - 0.003)

      if (b.y < -20 || b.alpha <= 0) {
        bubbles.splice(i, 1)
        continue
      }

      drawText(
        b.glyph,
        b.x,
        b.y,
        b.size,
        b.alpha * (0.6 + Math.sin(b.phase) * 0.4),
      )
    }
  }

  const updatePellets = () => {
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i]!

      p.y += p.vy
      p.life -= 0.005

      if (p.life <= 0 || p.y > canvas.height + 20) {
        pellets.splice(i, 1)
        continue
      }

      drawText(PELLET_GLYPH, p.x, p.y, 12, p.life * 0.9, 45)
    }
  }

  const updateFish = () => {
    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i]!

      f.phase += f.phaseSpeed
      f.alpha = Math.min(1, f.alpha + 0.015)

      const dcx = mouseX - f.x
      const dcy = mouseY - f.y
      const distCursor = Math.sqrt(dcx * dcx + dcy * dcy)

      if (distCursor < 120 && mouseSpeed > 12) {
        f.targetX = f.x - dcx * 0.8
        f.targetY = f.y - dcy * 0.8
        f.curiosity = 0.6
      } else if (distCursor < 200 && mouseSpeed < 4 && Math.random() > 0.97) {
        f.targetX = mouseX
        f.targetY = mouseY
        f.curiosity = 0.5
      }

      if (f.targetX !== null && f.targetY !== null && f.curiosity > 0) {
        const dtx = f.targetX - f.x
        const dty = f.targetY - f.y
        const dtd = Math.sqrt(dtx * dtx + dty * dty)

        if (dtd < 25 || f.curiosity < 0.02) {
          f.targetX = null
          f.targetY = null
          f.curiosity = 0
        } else {
          const t = f.curiosity * 0.04
          const speed = Math.max(0.5, Math.abs(f.vx))

          f.vx += (dtx / dtd) * t * speed
          f.baseY += (dty / dtd) * t * 10
          f.curiosity *= 0.98
        }
      } else {
        f.curiosity = Math.max(0, f.curiosity - 0.01)
      }

      f.x += f.vx

      const bob = Math.sin(f.phase) * (8 + f.size * 0.3)

      f.y += (f.baseY + bob - f.y) * 0.04

      f.baseY = Math.max(
        canvas.height * 0.08,
        Math.min(canvas.height * 0.82, f.baseY),
      )

      f.baseY += rand(-0.2, 0.2)

      if (f.vx > 0.1) {
        f.direction = 1
      }

      if (f.vx < -0.1) {
        f.direction = -1
      }

      if (f.x > canvas.width + 100 || f.x < -100) {
        fish.splice(i, 1)
        continue
      }

      const glyph = f.direction === 1 ? f.glyphR : f.glyphL
      const filter =
        f.curiosity > 0.3
          ? `drop-shadow(0 0 4px hsl(${f.hue},90%,70%))`
          : undefined

      drawText(glyph, f.x, f.y, f.size, f.alpha * 0.9, f.hue, filter)
    }
  }

  const updateCreatures = () => {
    for (let i = creatures.length - 1; i >= 0; i--) {
      const c = creatures[i]!

      c.phase += 0.025
      c.x += c.vx
      c.y += Math.sin(c.phase) * 0.8

      if (c.x > canvas.width + 120 || c.x < -120) {
        creatures.splice(i, 1)
        continue
      }

      const filter = 'drop-shadow(0 0 8px rgba(100,200,255,0.5))'

      drawText(c.glyph, c.x, c.y, c.size, 0.85, undefined, filter)
    }
  }

  const updateRipples = () => {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]!

      r.r += 4
      r.life -= 0.04

      if (r.life <= 0) {
        ripples.splice(i, 1)
        continue
      }

      ctx.save()
      ctx.globalAlpha = r.life * 0.35
      ctx.strokeStyle = 'rgba(120,200,255,0.8)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  }

  const drawWater = () => {
    const w = canvas.width
    const h = canvas.height

    const g = ctx.createLinearGradient(0, h * 0.6, 0, h)

    g.addColorStop(0, 'rgba(0,40,60,0)')
    g.addColorStop(1, 'rgba(0,30,50,0.18)')

    ctx.fillStyle = g
    ctx.fillRect(0, h * 0.6, w, h * 0.4)

    ctx.save()
    ctx.globalAlpha = 0.025 + Math.sin(frame * 0.012) * 0.01

    for (let x = 0; x < w; x += 40) {
      const wx = x + Math.sin(frame * 0.018 + x * 0.01) * 12

      ctx.strokeStyle = 'rgba(100,220,255,0.8)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(wx, 0)
      ctx.lineTo(wx + 20, h * 0.12)
      ctx.stroke()
    }

    ctx.restore()

    const sg = ctx.createLinearGradient(0, h - 18, 0, h)

    sg.addColorStop(0, 'rgba(180,150,90,0)')
    sg.addColorStop(1, 'rgba(160,130,70,0.22)')

    ctx.fillStyle = sg
    ctx.fillRect(0, h - 18, w, 18)
  }

  const tick = () => {
    const w = canvas.width
    const h = canvas.height

    frame += 1

    ctx.clearRect(0, 0, w, h)

    drawWater()
    drawSeaweed()
    updateRipples()
    updateBubbles()
    updatePellets()
    updateFish()
    updateCreatures()

    nextFish -= 1

    if (nextFish <= 0 && fish.length < 20) {
      spawnFish()
      nextFish = randInt(60, 180)
    }

    nextBubble -= 1

    if (nextBubble <= 0) {
      const count = randInt(1, 3)

      for (let i = 0; i < count; i++) {
        spawnBubble()
      }

      nextBubble = randInt(20, 60)
    }

    nextCreature -= 1

    if (nextCreature <= 0 && creatures.length < 2) {
      spawnCreature()
      nextCreature = 1800 + randInt(0, 1800)
    }

    rafId = requestAnimationFrame(tick)
  }

  resize()

  for (let i = 0; i < 14; i++) {
    spawnFish()

    const newFish = fish[fish.length - 1]

    if (newFish) {
      newFish.x = rand(0, canvas.width)
      newFish.alpha = rand(0.3, 1)
    }
  }

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('click', onClick)

  rafId = requestAnimationFrame(tick)

  cleanupHandlers = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('click', onClick)
  }
})

onBeforeUnmount(() => {
  cleanupHandlers?.()
  cleanupHandlers = null
})
</script>

<style scoped>
.effect-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
}
</style>
