<!-- /components/content/screenfx/siege-engine.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

type LauncherType = 'catapult' | 'trebuchet' | 'cannon'

interface Launcher {
  type: LauncherType
  x: number
  y: number
  angle: number // aim angle, radians
  targetAngle: number
  charge: number // 0–1, for held-fire
  recoil: number // pushback on fire, decays
  armPhase: number // idle animation
  wheelPhase: number
}

interface Projectile {
  id: number
  glyph: string
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  radius: number
  life: number
  trail: { x: number; y: number }[]
}

type ImpactType = 'crack' | 'smoke' | 'burst' | 'bonk' | 'shockwave'

interface Impact {
  id: number
  x: number
  y: number
  type: ImpactType
  life: number
  maxLife: number
  text?: string
  angle?: number // crack angle
  radius: number
  particles: Particle[]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  hue: number
}

interface RepairBot {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  phase: number
  life: number // 1 → 0
  done: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PROJECTILE_GLYPHS = ['🪨', '⭐', '🫘', '🦆', '🍞', '💥', '🎃', '🥚', '🪵']
const IMPACT_TEXTS = [
  'BONK',
  'THWACK',
  'KABLAM',
  'OOF',
  'CRUNCH',
  'WHAM',
  'POW',
  'ZAP',
]
const LAUNCHER_TYPES: LauncherType[] = ['catapult', 'trebuchet', 'cannon']
const GRAVITY = 0.22
const MAX_PROJECTILES = 8
const MAX_IMPACTS = 12

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)]!
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const angleDiff = (a: number, b: number) => {
  let d = ((((b - a) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return d
}

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
    // Keep launcher on bottom edge
    launcher.x = canvas.width * 0.5
    launcher.y = canvas.height - 40
  }

  // ── Initial state ──────────────────────────────────────────────────────────

  const launcher: Launcher = {
    type: pick(LAUNCHER_TYPES),
    x: 0, // set in resize
    y: 0,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    charge: 0,
    recoil: 0,
    armPhase: 0,
    wheelPhase: 0,
  }

  const projectiles: Projectile[] = []
  const impacts: Impact[] = []
  const repairBots: RepairBot[] = []

  let mouseX = canvas.width / 2
  let mouseY = canvas.height / 2
  let isHeld = false
  let holdStart = 0
  let frame = 0

  resize()
  window.addEventListener('resize', resize)

  // ── Fire ───────────────────────────────────────────────────────────────────

  const fire = (charge: number) => {
    if (projectiles.length >= MAX_PROJECTILES) return

    const speed = 8 + charge * 14
    const spread = 0.06
    const angle = launcher.angle + rand(-spread, spread)
    const glyph = pick(PROJECTILE_GLYPHS)

    projectiles.push({
      id: uid(),
      glyph,
      x: launcher.x,
      y: launcher.y - 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: 0,
      spin: (Math.random() - 0.5) * 12,
      radius: 14,
      life: 1,
      trail: [],
    })

    launcher.recoil = 0.7
    launcher.armPhase = 0 // reset arm swing

    // Cycle launcher type occasionally
    if (Math.random() > 0.75) {
      launcher.type = pick(LAUNCHER_TYPES)
    }
  }

  // ── Impact spawner ──────────────────────────────────────────────────────────

  const spawnImpact = (x: number, y: number, isEdge = false) => {
    if (impacts.length >= MAX_IMPACTS) {
      impacts.shift()
    }

    const types: ImpactType[] = isEdge
      ? ['crack', 'shockwave', 'burst', 'bonk']
      : ['smoke', 'burst', 'bonk', 'shockwave']

    const type = pick(types)

    const particles: Particle[] = []
    const debrisCount = randInt(6, 16)
    for (let i = 0; i < debrisCount; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(1, 6)
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(1, 3),
        size: rand(2, 8),
        life: 1,
        hue: rand(20, 60),
      })
    }

    impacts.push({
      id: uid(),
      x,
      y,
      type,
      life: 1,
      maxLife: 1,
      text: type === 'bonk' ? pick(IMPACT_TEXTS) : undefined,
      angle: rand(0, Math.PI * 2),
      radius: 0,
      particles,
    })

    // Spawn repair bot after delay
    setTimeout(() => {
      repairBots.push({
        id: uid(),
        x: rand(0, canvas.width),
        y: canvas.height,
        targetX: x,
        targetY: y,
        phase: 0,
        life: 1,
        done: false,
      })
    }, 1200)
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  const onPointerMove = (e: PointerEvent) => {
    mouseX = e.clientX
    mouseY = e.clientY
  }

  const onPointerDown = (e: PointerEvent) => {
    isHeld = true
    holdStart = frame
  }

  const onPointerUp = (e: PointerEvent) => {
    if (!isHeld) return
    const held = frame - holdStart
    const charge = Math.min(1, held / 80)
    fire(charge)
    isHeld = false
    launcher.charge = 0
  }

  const onClick = (e: MouseEvent) => {
    // Single click = instant low-charge fire (pointerup handles charged)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)

  // ── Draw launcher ──────────────────────────────────────────────────────────

  const drawLauncher = () => {
    const { x, y, type, angle, recoil, armPhase, wheelPhase } = launcher
    const W = 52
    const recoilOffset = recoil * 12

    ctx.save()
    ctx.translate(x - Math.cos(angle) * recoilOffset, y)

    // ── Wheels ─────────────────────────────────────────────────────────────

    const drawWheel = (wx: number, wy: number, r: number) => {
      ctx.beginPath()
      ctx.arc(wx, wy, r, 0, Math.PI * 2)
      ctx.fillStyle = '#5c3d1e'
      ctx.fill()
      ctx.strokeStyle = '#3a2510'
      ctx.lineWidth = 2
      ctx.stroke()
      // Spokes
      for (let s = 0; s < 6; s++) {
        const sa = wheelPhase + s * (Math.PI / 3)
        ctx.beginPath()
        ctx.moveTo(wx + Math.cos(sa) * 3, wy + Math.sin(sa) * 3)
        ctx.lineTo(wx + Math.cos(sa) * r, wy + Math.sin(sa) * r)
        ctx.strokeStyle = '#3a2510'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    drawWheel(-W / 2 + 4, -4, 14)
    drawWheel(W / 2 - 4, -4, 14)

    // ── Frame (shared for all types) ────────────────────────────────────────

    ctx.fillStyle = '#7c5a2a'
    ctx.strokeStyle = '#4a3518'
    ctx.lineWidth = 2

    // Base beam
    ctx.beginPath()
    ctx.roundRect(-W / 2, -18, W, 14, 3)
    ctx.fill()
    ctx.stroke()

    // ── Type-specific arm ───────────────────────────────────────────────────

    if (type === 'catapult') {
      // Hinged cup arm
      const armAngle = angle - Math.PI / 2 + Math.sin(armPhase) * 0.15
      ctx.save()
      ctx.translate(0, -18)
      ctx.rotate(armAngle)
      ctx.fillStyle = '#8b6835'
      ctx.strokeStyle = '#4a3518'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -34)
      ctx.stroke()
      // Cup at tip
      ctx.beginPath()
      ctx.arc(0, -34, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#5c3d1e'
      ctx.fill()
      ctx.stroke()
      // Counterweight
      ctx.beginPath()
      ctx.arc(0, 10, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#333'
      ctx.fill()
      ctx.strokeStyle = '#222'
      ctx.stroke()
      ctx.restore()
    } else if (type === 'trebuchet') {
      // Long counterweight arm
      const armAngle = angle - Math.PI / 2 + Math.sin(armPhase * 0.7) * 0.1
      ctx.save()
      ctx.translate(8, -20)
      ctx.rotate(armAngle)
      // Short side
      ctx.fillStyle = '#7c5a2a'
      ctx.strokeStyle = '#4a3518'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, 14)
      ctx.stroke()
      // Long side
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -44)
      ctx.stroke()
      // Sling rope
      ctx.strokeStyle = 'rgba(180,150,80,0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -44)
      ctx.lineTo(6, -52)
      ctx.stroke()
      // Heavy counterweight box
      ctx.fillStyle = '#2a2a3a'
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(-7, 14, 14, 10, 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    } else {
      // Cannon barrel
      const barrelLen = 36
      ctx.save()
      ctx.translate(-4, -20)
      ctx.rotate(angle + Math.PI / 2)
      // Barrel body
      const barGrad = ctx.createLinearGradient(-6, 0, 6, 0)
      barGrad.addColorStop(0, '#3a3a3a')
      barGrad.addColorStop(0.4, '#666')
      barGrad.addColorStop(1, '#2a2a2a')
      ctx.fillStyle = barGrad
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(-6, -barrelLen, 12, barrelLen, [3, 3, 0, 0])
      ctx.fill()
      ctx.stroke()
      // Muzzle ring
      ctx.beginPath()
      ctx.ellipse(0, -barrelLen, 7, 4, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#555'
      ctx.fill()
      ctx.stroke()
      // Touch hole
      ctx.beginPath()
      ctx.arc(0, -8, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#222'
      ctx.fill()
      ctx.restore()
    }

    // ── Charge indicator ───────────────────────────────────────────────────

    if (isHeld && launcher.charge > 0) {
      const cr = 10 + launcher.charge * 12
      const chue = 120 - launcher.charge * 120
      const cg = ctx.createRadialGradient(0, -40, 0, 0, -40, cr)
      cg.addColorStop(0, `hsla(${chue},90%,70%,${launcher.charge * 0.9})`)
      cg.addColorStop(1, `hsla(${chue},90%,55%,0)`)
      ctx.beginPath()
      ctx.arc(0, -40, cr, 0, Math.PI * 2)
      ctx.fillStyle = cg
      ctx.fill()
    }

    ctx.restore()
  }

  // ── Draw projectiles ────────────────────────────────────────────────────────

  const updateProjectiles = () => {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]!
      p.vy += GRAVITY
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.spin
      p.spin *= 0.995
      p.life -= 0.004

      // Trail
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > 10) p.trail.shift()

      // Draw trail
      for (let t = 0; t < p.trail.length - 1; t++) {
        const ta = (t / p.trail.length) * 0.3
        ctx.beginPath()
        ctx.arc(
          p.trail[t]!.x,
          p.trail[t]!.y,
          2 * (t / p.trail.length),
          0,
          Math.PI * 2,
        )
        ctx.fillStyle = `rgba(255,180,60,${ta})`
        ctx.fill()
      }

      // Draw glyph
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.font = `${22}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = Math.min(1, p.life * 4)
      ctx.fillText(p.glyph, 0, 0)
      ctx.restore()

      // Hit screen edges
      const hitLeft = p.x < 20
      const hitRight = p.x > canvas.width - 20
      const hitTop = p.y < 20
      const hitBottom = p.y > canvas.height - 20

      if (hitLeft || hitRight || hitTop || hitBottom || p.life <= 0) {
        spawnImpact(
          Math.max(20, Math.min(canvas.width - 20, p.x)),
          Math.max(20, Math.min(canvas.height - 20, p.y)),
          hitLeft || hitRight || hitTop || hitBottom,
        )
        projectiles.splice(i, 1)
      }
    }
  }

  // ── Draw impacts ────────────────────────────────────────────────────────────

  const updateImpacts = () => {
    for (let i = impacts.length - 1; i >= 0; i--) {
      const imp = impacts[i]!
      imp.life -= 0.008
      imp.radius = Math.min(60, imp.radius + 5)

      if (imp.life <= 0) {
        impacts.splice(i, 1)
        continue
      }

      const alpha = imp.life

      // Update & draw particles
      for (let j = imp.particles.length - 1; j >= 0; j--) {
        const p = imp.particles[j]!
        p.life -= 0.025
        if (p.life <= 0) {
          imp.particles.splice(j, 1)
          continue
        }
        p.vy += 0.15
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.92
        p.vy *= 0.92
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},85%,65%,${p.life * 0.85})`
        ctx.fill()
      }

      switch (imp.type) {
        case 'shockwave': {
          ctx.beginPath()
          ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,200,80,${alpha * 0.7})`
          ctx.lineWidth = alpha * 4
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(imp.x, imp.y, imp.radius * 0.6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`
          ctx.lineWidth = 1
          ctx.stroke()
          break
        }

        case 'crack': {
          // Radiating crack lines from impact point
          const crackCount = 5 + randInt(0, 3)
          ctx.strokeStyle = `rgba(180,160,140,${alpha * 0.6})`
          ctx.lineWidth = alpha * 1.5
          for (let c = 0; c < crackCount; c++) {
            const ca =
              imp.angle! +
              c * ((Math.PI * 2) / crackCount) +
              Math.sin(c * 3.7) * 0.4
            const len = 20 + rand(10, 40) * (1 - imp.life + imp.maxLife * 0.5)
            ctx.beginPath()
            ctx.moveTo(imp.x, imp.y)
            ctx.lineTo(imp.x + Math.cos(ca) * len, imp.y + Math.sin(ca) * len)
            // Branch
            const branchA = ca + rand(-0.6, 0.6)
            ctx.lineTo(
              imp.x + Math.cos(ca) * len + Math.cos(branchA) * len * 0.4,
              imp.y + Math.sin(ca) * len + Math.sin(branchA) * len * 0.4,
            )
            ctx.stroke()
          }
          break
        }

        case 'smoke': {
          for (let s = 0; s < 4; s++) {
            const sr = imp.radius * 0.4 + s * 10
            const sx = imp.x + Math.cos(imp.angle! + s * 1.4) * s * 8
            const sy = imp.y - s * 6
            const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
            sg.addColorStop(0, `rgba(160,160,160,${alpha * 0.18})`)
            sg.addColorStop(1, `rgba(120,120,120,0)`)
            ctx.beginPath()
            ctx.arc(sx, sy, sr, 0, Math.PI * 2)
            ctx.fillStyle = sg
            ctx.fill()
          }
          break
        }

        case 'burst': {
          const bg = ctx.createRadialGradient(
            imp.x,
            imp.y,
            0,
            imp.x,
            imp.y,
            imp.radius,
          )
          bg.addColorStop(0, `rgba(255,220,80,${alpha * 0.7})`)
          bg.addColorStop(0.4, `rgba(255,120,20,${alpha * 0.4})`)
          bg.addColorStop(1, `rgba(255,60,0,0)`)
          ctx.beginPath()
          ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
          ctx.fillStyle = bg
          ctx.fill()
          break
        }

        case 'bonk': {
          if (imp.text) {
            const bounce = Math.sin(imp.life * Math.PI) * 10
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.font = `bold ${Math.round(14 + (1 - imp.life) * 10)}px monospace`
            ctx.fillStyle = `hsl(${40 + imp.life * 20},95%,62%)`
            ctx.strokeStyle = 'rgba(0,0,0,0.4)'
            ctx.lineWidth = 3
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.strokeText(imp.text, imp.x, imp.y - 20 - bounce)
            ctx.fillText(imp.text, imp.x, imp.y - 20 - bounce)
            ctx.restore()
          }
          break
        }
      }
    }
  }

  // ── Repair bots ────────────────────────────────────────────────────────────

  const updateRepairBots = () => {
    for (let i = repairBots.length - 1; i >= 0; i--) {
      const rb = repairBots[i]!
      rb.phase += 0.08
      rb.life -= 0.003

      if (rb.life <= 0) {
        repairBots.splice(i, 1)
        continue
      }

      // Move toward target
      const dx = rb.targetX - rb.x
      const dy = rb.targetY - rb.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 4) {
        rb.x += (dx / d) * 1.6
        rb.y += (dy / d) * 1.6
      } else {
        rb.done = true
        // Emit sparkle repair effect
        if (Math.random() > 0.8) {
          const sparkAngle = rand(0, Math.PI * 2)
          impacts.push({
            id: uid(),
            x: rb.x + Math.cos(sparkAngle) * 8,
            y: rb.y + Math.sin(sparkAngle) * 8,
            type: 'burst',
            life: 0.4,
            maxLife: 0.4,
            radius: 0,
            particles: [],
          })
        }
      }

      // Draw tiny repair bot
      ctx.save()
      ctx.translate(rb.x, rb.y + Math.sin(rb.phase) * 2)
      ctx.globalAlpha = Math.min(1, rb.life * 6)

      // Body
      ctx.fillStyle = '#60a5fa'
      ctx.strokeStyle = '#1d4ed8'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(-5, -5, 10, 8, 2)
      ctx.fill()
      ctx.stroke()

      // Eyes (2 pixels)
      ctx.fillStyle = '#fff'
      ctx.fillRect(-3, -3, 2, 2)
      ctx.fillRect(1, -3, 2, 2)

      // Wrench arm
      ctx.strokeStyle = '#93c5fd'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(rb.done ? 5 : -5, 0)
      ctx.lineTo(rb.done ? 10 : -10, Math.sin(rb.phase * 3) * 4)
      ctx.stroke()

      // Legs
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1
      for (let l = -1; l <= 1; l += 2) {
        ctx.beginPath()
        ctx.moveTo(l * 3, 3)
        ctx.lineTo(l * 5, 7 + Math.sin(rb.phase + l) * 2)
        ctx.stroke()
      }

      ctx.restore()
    }
  }

  // ── Aim line ───────────────────────────────────────────────────────────────

  const drawAimLine = () => {
    if (!isHeld) return
    const charge = launcher.charge
    ctx.save()
    ctx.setLineDash([4, 6])
    ctx.strokeStyle = `rgba(255,200,80,${charge * 0.4})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(launcher.x, launcher.y - 30)
    ctx.lineTo(
      launcher.x + Math.cos(launcher.angle) * 80,
      launcher.y + Math.sin(launcher.angle) * 80,
    )
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // ── Tick ───────────────────────────────────────────────────────────────────

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    frame++

    ctx.clearRect(0, 0, w, h)

    // ── Launcher update ────────────────────────────────────────────────────

    // Aim toward cursor
    const dx = mouseX - launcher.x
    const dy = mouseY - (launcher.y - 30)
    launcher.targetAngle = Math.atan2(dy, dx)

    // Clamp to upward half
    const clampedTarget = Math.max(
      -Math.PI * 1.05,
      Math.min(-Math.PI * -0.05, launcher.targetAngle),
    )
    const diff = angleDiff(launcher.angle, clampedTarget)
    launcher.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.05)

    // Charge
    if (isHeld) {
      launcher.charge = Math.min(1, (frame - holdStart) / 80)
    }

    // Recoil decay
    launcher.recoil = Math.max(0, launcher.recoil - 0.04)
    launcher.armPhase += 0.03
    launcher.wheelPhase += isHeld ? 0 : 0.04

    updateImpacts()
    updateProjectiles()
    updateRepairBots()
    drawAimLine()
    drawLauncher()

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointerup', onPointerUp)
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
  z-index: 52;
}
</style>
