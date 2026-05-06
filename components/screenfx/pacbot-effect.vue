<!-- /components/content/screenfx/pacbot-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PacBot {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  angle: number
  mouthPhase: number
  mouthDir: number
  powerUntil: number
  trail: { x: number; y: number; a: number }[]
}

type PelletType = 'normal' | 'cursor' | 'power'

interface Pellet {
  id: number
  x: number
  y: number
  radius: number
  type: PelletType
  life: number
  phase: number
}

interface Bug {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  scared: boolean
  glitchPhase: number
  hue: number
}

interface FloatingText {
  id: number
  text: string
  x: number
  y: number
  vy: number
  life: number
  hue: number
}

interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
  size: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_PELLETS = 28
const MAX_BUGS = 5
const POWER_DURATION = 420 // frames
const CHOMP_TEXTS = [
  'CHOMP',
  'BUG SNACK',
  '+10',
  'CRUNCH',
  'NOM',
  'BZZZT',
  'DELICIOUS ERROR',
  'BYTE EATEN',
]
const BUG_GLYPHS = ['ꓸ', '✕', '×', '⁕', '⊠', '◈']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))
const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)

let _uid = 0
const uid = () => ++_uid

// ─── Component ────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  // ── Initial state ───────────────────────────────────────────────────────────

  const bot: PacBot = {
    x: canvas.width * 0.5,
    y: canvas.height * 0.5,
    vx: 0,
    vy: 0,
    speed: 2.2,
    angle: 0,
    mouthPhase: 0,
    mouthDir: 1,
    powerUntil: 0,
    trail: [],
  }

  const pellets: Pellet[] = []
  const bugs: Bug[] = []
  const floats: FloatingText[] = []
  const sparkles: Sparkle[] = []

  let mouseX = -999,
    mouseY = -999
  let lastMouseX = -999,
    lastMouseY = -999
  let crumbAccum = 0
  let frame = 0
  let score = 0
  let nextBug = 180
  let nextPellet = 30
  let nextCrumbStorm = 0

  // ── Pellet spawner ──────────────────────────────────────────────────────────

  const spawnPellet = (type: PelletType = 'normal', x?: number, y?: number) => {
    const margin = 40
    pellets.push({
      id: uid(),
      x: x ?? rand(margin, canvas.width - margin),
      y: y ?? rand(margin, canvas.height - margin),
      radius: type === 'power' ? 10 : type === 'cursor' ? 4 : 5,
      type,
      life: type === 'cursor' ? 0.9 : 1,
      phase: rand(0, Math.PI * 2),
    })
  }

  // Seed initial pellets
  for (let i = 0; i < MAX_PELLETS * 0.6; i++) spawnPellet()

  // ── Bug spawner ─────────────────────────────────────────────────────────────

  const spawnBug = () => {
    const edge = randInt(0, 3)
    const w = canvas.width,
      h = canvas.height
    const pos = [
      { x: rand(0, w), y: -20 },
      { x: rand(0, w), y: h + 20 },
      { x: -20, y: rand(0, h) },
      { x: w + 20, y: rand(0, h) },
    ][edge]!
    bugs.push({
      id: uid(),
      x: pos.x,
      y: pos.y,
      vx: rand(-1.2, 1.2),
      vy: rand(-1.2, 1.2),
      scared: false,
      glitchPhase: rand(0, Math.PI * 2),
      hue: rand(0, 360),
    })
  }

  // ── Float text ──────────────────────────────────────────────────────────────

  const spawnFloat = (text: string, x: number, y: number, hue = 60) => {
    floats.push({ id: uid(), text, x, y, vy: -1.2, life: 1, hue })
  }

  // ── Sparkle burst ───────────────────────────────────────────────────────────

  const spawnSparkles = (x: number, y: number, hue: number, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(1.5, 4.5)
      sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        hue: hue + rand(-30, 30),
        size: rand(2, 5),
      })
    }
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  const onPointerMove = (e: PointerEvent) => {
    lastMouseX = mouseX
    lastMouseY = mouseY
    mouseX = e.clientX
    mouseY = e.clientY
    const dx = mouseX - lastMouseX
    const dy = mouseY - lastMouseY
    const moved = Math.sqrt(dx * dx + dy * dy)

    // Drop cursor crumbs every ~8px of movement
    crumbAccum += moved
    if (
      crumbAccum > 8 &&
      pellets.filter((p) => p.type === 'cursor').length < 18
    ) {
      crumbAccum = 0
      spawnPellet('cursor', mouseX + rand(-5, 5), mouseY + rand(-5, 5))
    }
  }

  const onClick = (e: MouseEvent) => {
    spawnPellet('power', e.clientX, e.clientY)
    spawnSparkles(e.clientX, e.clientY, 60, 6)
  }

  let clickCount = 0
  let lastClickTime = 0
  const onDblClick = (e: MouseEvent) => {
    // Crumb storm
    nextCrumbStorm = 0
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        spawnPellet(
          'cursor',
          e.clientX + rand(-80, 80),
          e.clientY + rand(-80, 80),
        )
      }, i * 40)
    }
    spawnFloat('CRUMB STORM!', e.clientX, e.clientY - 30, 45)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('click', onClick)
  window.addEventListener('dblclick', onDblClick)

  // ── Draw Pac-Bot ────────────────────────────────────────────────────────────

  const drawBot = () => {
    const now = frame
    const isPowered = now < bot.powerUntil
    const R = isPowered ? 18 : 15
    const hue = isPowered ? (now * 4) % 360 : 55

    // Trail
    for (let i = 0; i < bot.trail.length; i++) {
      const t = bot.trail[i]!
      const ta = t.a * (i / bot.trail.length) * 0.5
      ctx.beginPath()
      ctx.arc(t.x, t.y, R * 0.5 * (i / bot.trail.length), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue},90%,65%,${ta})`
      ctx.fill()
    }

    ctx.save()
    ctx.translate(bot.x, bot.y)
    ctx.rotate(bot.angle)

    // Outer glow
    if (isPowered) {
      const g = ctx.createRadialGradient(0, 0, R, 0, 0, R * 3)
      g.addColorStop(0, `hsla(${hue},100%,70%,0.3)`)
      g.addColorStop(1, `hsla(${hue},100%,60%,0)`)
      ctx.beginPath()
      ctx.arc(0, 0, R * 3, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
    }

    // Body
    const mouthAngle = 0.25 + Math.abs(Math.sin(bot.mouthPhase)) * 0.35
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, R, mouthAngle, Math.PI * 2 - mouthAngle)
    ctx.closePath()
    ctx.fillStyle = `hsl(${hue},90%,62%)`
    ctx.fill()

    // Body highlight
    ctx.beginPath()
    ctx.arc(-R * 0.2, -R * 0.25, R * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue},80%,82%,0.3)`
    ctx.fill()

    // Eye
    ctx.beginPath()
    ctx.arc(R * 0.1, -R * 0.45, R * 0.18, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(R * 0.14, -R * 0.45, R * 0.09, 0, Math.PI * 2)
    ctx.fillStyle = '#111'
    ctx.fill()

    // Antenna
    ctx.strokeStyle = `hsl(${hue},60%,75%)`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-R * 0.1, -R)
    ctx.lineTo(-R * 0.2, -R * 1.5)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(-R * 0.2, -R * 1.6, 3, 0, Math.PI * 2)
    ctx.fillStyle = isPowered ? `hsl(${hue},100%,75%)` : '#88aaff'
    ctx.fill()

    // Robot panel lines
    ctx.strokeStyle = `hsla(${hue},40%,40%,0.5)`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(0, 0, R * 0.65, Math.PI * 0.6, Math.PI * 1.2)
    ctx.stroke()

    ctx.restore()
  }

  // ── Draw pellets ─────────────────────────────────────────────────────────────

  const updatePellets = () => {
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i]!
      p.phase += 0.06
      if (p.type === 'cursor') p.life -= 0.004

      if (p.life <= 0) {
        pellets.splice(i, 1)
        continue
      }

      // Check eat
      if (dist(bot.x, bot.y, p.x, p.y) < 16 + p.radius) {
        if (p.type === 'power') {
          bot.powerUntil = frame + POWER_DURATION
          spawnFloat('POWER MODE!', p.x, p.y - 20, 55)
          spawnSparkles(p.x, p.y, 55, 16)
          // Scare bugs
          for (const b of bugs) b.scared = true
        } else {
          score++
          spawnSparkles(p.x, p.y, p.type === 'cursor' ? 200 : 60, 5)
        }
        pellets.splice(i, 1)
        continue
      }

      // Draw
      const a = p.life * (0.7 + Math.sin(p.phase) * 0.3)
      if (p.type === 'power') {
        const pulse = 1 + Math.sin(p.phase) * 0.3
        const g = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius * 2.5 * pulse,
        )
        g.addColorStop(0, `rgba(255,240,80,${a})`)
        g.addColorStop(0.5, `rgba(255,180,0,${a * 0.6})`)
        g.addColorStop(1, `rgba(255,120,0,0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 2.5 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,150,${a})`
        ctx.fill()
      } else if (p.type === 'cursor') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100,220,255,${a * 0.85})`
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,240,160,${a})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,220,${a})`
        ctx.fill()
      }
    }
  }

  // ── Draw bugs ────────────────────────────────────────────────────────────────

  const updateBugs = () => {
    const isPowered = frame < bot.powerUntil

    for (let i = bugs.length - 1; i >= 0; i--) {
      const b = bugs[i]!
      b.glitchPhase += 0.12
      b.scared = isPowered

      // Steering
      const dbx = bot.x - b.x
      const dby = bot.y - b.y
      const dbd = Math.sqrt(dbx * dbx + dby * dby) || 1

      if (b.scared) {
        // Flee — run from bot
        b.vx += (-dbx / dbd) * 0.18
        b.vy += (-dby / dbd) * 0.18
      } else if (dbd < 300) {
        // Chase — approach bot slowly
        b.vx += (dbx / dbd) * 0.04
        b.vy += (dby / dbd) * 0.04
      }

      // Speed limit
      const bspd = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
      const maxSpd = b.scared ? 3.5 : 1.4
      if (bspd > maxSpd) {
        b.vx = (b.vx / bspd) * maxSpd
        b.vy = (b.vy / bspd) * maxSpd
      }

      b.x += b.vx
      b.y += b.vy

      // Wrap
      if (b.x < -30) b.x = canvas.width + 30
      if (b.x > canvas.width + 30) b.x = -30
      if (b.y < -30) b.y = canvas.height + 30
      if (b.y > canvas.height + 30) b.y = -30

      // Powered bot eats bugs
      if (isPowered && dbd < 20) {
        spawnFloat(
          CHOMP_TEXTS[randInt(0, CHOMP_TEXTS.length - 1)]!,
          b.x,
          b.y - 20,
          (frame * 5) % 360,
        )
        spawnSparkles(b.x, b.y, b.hue, 12)
        bugs.splice(i, 1)
        continue
      }

      // Draw — glitchy pixel-art bug
      ctx.save()
      ctx.translate(b.x, b.y)
      const glitch = b.scared ? Math.sin(b.glitchPhase * 3) * 4 : 0
      ctx.translate(glitch, 0)

      ctx.font = `${b.scared ? 14 : 12}px monospace`
      ctx.fillStyle = b.scared
        ? `hsla(${b.hue},100%,70%,0.9)`
        : `hsla(${b.hue},80%,65%,0.85)`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(BUG_GLYPHS[randInt(0, BUG_GLYPHS.length - 1)]!, 0, 0)

      // Bug legs (tiny lines)
      ctx.strokeStyle = `hsla(${b.hue},70%,60%,0.5)`
      ctx.lineWidth = 0.8
      for (let l = 0; l < 3; l++) {
        const lx = (l - 1) * 4
        ctx.beginPath()
        ctx.moveTo(lx, 4)
        ctx.lineTo(lx - 3, 9)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(lx, 4)
        ctx.lineTo(lx + 3, 9)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  // ── Float text & sparkles ───────────────────────────────────────────────────

  const updateFloats = () => {
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]!
      f.life -= 0.018
      f.y += f.vy
      if (f.life <= 0) {
        floats.splice(i, 1)
        continue
      }
      ctx.save()
      ctx.globalAlpha = f.life
      ctx.font = `bold ${Math.round(11 + f.life * 6)}px monospace`
      ctx.fillStyle = `hsl(${f.hue},90%,70%)`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = `hsl(${f.hue},90%,55%)`
      ctx.shadowBlur = 8
      ctx.fillText(f.text, f.x, f.y)
      ctx.restore()
    }
  }

  const updateSparkles = () => {
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i]!
      s.life -= 0.035
      s.x += s.vx
      s.y += s.vy
      s.vx *= 0.92
      s.vy *= 0.92
      if (s.life <= 0) {
        sparkles.splice(i, 1)
        continue
      }
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${s.hue},95%,72%,${s.life})`
      ctx.fill()
    }
  }

  // ── Score display ───────────────────────────────────────────────────────────

  const drawHUD = () => {
    const isPowered = frame < bot.powerUntil
    if (!isPowered && score === 0) return

    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.font = '11px monospace'
    ctx.fillStyle = isPowered
      ? `hsl(${(frame * 4) % 360},90%,70%)`
      : 'rgba(255,240,120,0.8)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    let label = `PAC-BOT  ${score} crumbs`
    if (isPowered) {
      const remaining = Math.ceil((bot.powerUntil - frame) / 60)
      label += `  ⚡ POWER ${remaining}s`
    }
    ctx.fillText(label, 14, 10)
    ctx.restore()
  }

  // ── Bot AI & movement ────────────────────────────────────────────────────────

  const updateBot = () => {
    const isPowered = frame < bot.powerUntil
    bot.mouthPhase += 0.18 * bot.mouthDir
    if (Math.abs(Math.sin(bot.mouthPhase)) > 0.95) bot.mouthDir *= -1

    // Choose target
    let targetX = bot.x,
      targetY = bot.y

    if (isPowered && bugs.length > 0) {
      // Chase nearest bug
      let nearest = bugs[0]!
      let nd = dist(bot.x, bot.y, nearest.x, nearest.y)
      for (const b of bugs) {
        const d = dist(bot.x, bot.y, b.x, b.y)
        if (d < nd) {
          nd = d
          nearest = b
        }
      }
      targetX = nearest.x
      targetY = nearest.y
    } else if (pellets.length > 0) {
      // Prioritize: cursor > power > normal
      const priority = ['cursor', 'power', 'normal'] as PelletType[]
      let best: Pellet | null = null
      let bestScore = Infinity

      for (const p of pellets) {
        const d = dist(bot.x, bot.y, p.x, p.y)
        const typeWeight = priority.indexOf(p.type)
        const score = d + typeWeight * 60
        if (score < bestScore) {
          bestScore = score
          best = p
        }
      }

      if (best) {
        targetX = best.x
        targetY = best.y
      }
    }

    // Steer toward target
    const dx = targetX - bot.x,
      dy = targetY - bot.y
    const d = Math.sqrt(dx * dx + dy * dy) || 1
    const spd = isPowered ? bot.speed * 1.7 : bot.speed

    bot.vx += (dx / d) * 0.35
    bot.vy += (dy / d) * 0.35

    // Speed limit
    const bspd = Math.sqrt(bot.vx * bot.vx + bot.vy * bot.vy)
    if (bspd > spd) {
      bot.vx = (bot.vx / bspd) * spd
      bot.vy = (bot.vy / bspd) * spd
    }

    // Update angle
    if (bspd > 0.3) bot.angle = Math.atan2(bot.vy, bot.vx)

    bot.x += bot.vx
    bot.y += bot.vy

    // Wrap
    if (bot.x < -20) bot.x = canvas.width + 20
    if (bot.x > canvas.width + 20) bot.x = -20
    if (bot.y < -20) bot.y = canvas.height + 20
    if (bot.y > canvas.height + 20) bot.y = -20

    // Trail
    bot.trail.push({ x: bot.x, y: bot.y, a: 1 })
    if (bot.trail.length > 18) bot.trail.shift()
  }

  // ── Tick ─────────────────────────────────────────────────────────────────────

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    frame++

    ctx.clearRect(0, 0, w, h)

    updateBot()
    updateSparkles()
    updatePellets()
    updateBugs()
    drawBot()
    updateFloats()
    drawHUD()

    // Spawn timers
    nextPellet--
    if (
      nextPellet <= 0 &&
      pellets.filter((p) => p.type === 'normal').length < MAX_PELLETS
    ) {
      spawnPellet()
      nextPellet = randInt(40, 100)
    }

    nextBug--
    if (nextBug <= 0 && bugs.length < MAX_BUGS) {
      spawnBug()
      nextBug = randInt(200, 420)
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('click', onClick)
    window.removeEventListener('dblclick', onDblClick)
  })
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
  z-index: 51;
}
</style>
