import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  PLUMBER_ART,
  drawSprite,
  plumberHeroine,
  plumberStageArt,
  stagePlate,
  tilePattern,
} from './savePlumberArt'
import { drawHeroine } from './savePlumberHeroineArt'
import { drawSheetFrame, keyedSheet } from './savePlumberSheets'
import { actionPoses, rosterFor } from './savePlumberRoster'

const W = 480
const H = 270
const WORLD_W = 1280
const FLOOR_Y = 220
const GRAVITY = 0.43
const JUMP = -8.6
type Platform = { x: number; y: number; width: number }
type Bug = {
  x: number
  y: number
  home: number
  dir: number
  active: boolean
  knocked: number
  flipped: boolean
}
const PUMPBUG_CYCLE = PLUMBER_ART.anim('pumpbug-cycle')
const floors: Platform[] = [
  { x: 0, y: FLOOR_Y, width: 333 },
  { x: 366, y: FLOOR_Y, width: 284 },
  { x: 695, y: FLOOR_Y, width: 271 },
  { x: 1005, y: FLOOR_Y, width: 275 },
]
const balconies: Platform[] = [
  { x: 158, y: 162, width: 84 },
  { x: 440, y: 153, width: 100 },
  { x: 748, y: 166, width: 115 },
  { x: 1050, y: 154, width: 94 },
]
const surfaces = [...floors, ...balconies]
const initialBugs = [270, 515, 830, 1100]

export function createSavePlumberPreview(
  options: ArcadeGameOptions,
): ArcadeGameInstance {
  let x = 54
  let y = FLOOR_Y - 26
  let vx = 0
  let vy = 0
  let ground = true
  let grace = 0
  let jumpBuffer = 0
  let cooldown = 0
  let immune = 55
  let tick = 0
  let camera = 0
  let facing: 1 | -1 = 1
  let stride = 0
  let landed = 0
  let score = 0
  let lives = 3
  let over = false
  let completed = 0
  const bugs: Bug[] = initialBugs.map((home) => ({
    x: home,
    y: FLOOR_Y - 10,
    home,
    dir: 1,
    active: true,
    knocked: 0,
    flipped: false,
  }))
  const coins = [196, 462, 782, 1070].map((x) => ({ x, y: 133, taken: false }))

  function respawn() {
    x = 54
    y = FLOOR_Y - 26
    vx = 0
    vy = 0
    immune = 85
    if (!options.demo && --lives <= 0) over = true
  }

  return {
    get score() {
      return score
    },
    get level() {
      return 1
    },
    get lives() {
      return lives
    },
    get over() {
      return over
    },
    update(input: InputFrame) {
      if (over) return
      tick++
      const keys = input
      if (cooldown) cooldown--
      if (immune) immune--
      const move = options.demo
        ? 1
        : Number(keys.held.right) - Number(keys.held.left)
      vx = move ? Math.max(-2.85, Math.min(2.85, vx + move * 0.44)) : vx * 0.77
      if (move) facing = move > 0 ? 1 : -1
      if (ground) stride += Math.abs(vx) * 0.17
      x = Math.max(10, Math.min(WORLD_W - 15, x + vx))
      if (ground) grace = 7
      else if (grace) grace--
      if (options.demo ? tick % 108 === 2 : keys.pressed.up || keys.pressed.b)
        jumpBuffer = 7
      else if (jumpBuffer) jumpBuffer--
      if (jumpBuffer && grace) {
        vy = JUMP
        ground = false
        grace = 0
        jumpBuffer = 0
        options.sound.play('blip')
      }
      const previousBottom = y + 26
      vy = Math.min(10, vy + GRAVITY)
      y += vy
      const wasGrounded = ground
      ground = false
      if (vy >= 0) {
        for (const surface of surfaces) {
          if (previousBottom > surface.y + 3) continue
          if (
            y + 26 < surface.y ||
            x + 11 < surface.x ||
            x - 11 > surface.x + surface.width
          )
            continue
          y = surface.y - 26
          vy = 0
          ground = true
          break
        }
      }
      if (ground && !wasGrounded) landed = 6
      else if (landed) landed--
      if (y > H + 40) respawn()
      if (!options.demo && keys.pressed.a && !cooldown) {
        cooldown = 23
        const hit = bugs.find(
          (bug) =>
            bug.active &&
            bug.x > x &&
            bug.x - x < 72 &&
            Math.abs(bug.y - (y + 14)) < 28,
        )
        if (hit) {
          hit.active = false
          hit.knocked = 30
          hit.flipped = true
          score += 150
          options.sound.play('pop')
        } else options.sound.play('shoot')
      }
      for (const coin of coins) {
        if (
          coin.taken ||
          Math.abs(coin.x - x) > 16 ||
          Math.abs(coin.y - (y + 10)) > 23
        )
          continue
        coin.taken = true
        score += 50
        options.sound.play('pickup')
      }
      for (const bug of bugs) {
        if (bug.knocked) bug.knocked--
        if (!bug.active) continue
        bug.x += bug.dir * 0.56
        if (Math.abs(bug.x - bug.home) > 34) bug.dir *= -1
        if (
          immune ||
          Math.abs(bug.x - x) >= 17 ||
          Math.abs(bug.y - (y + 18)) >= 20
        )
          continue
        if (vy > 1 && y + 26 <= bug.y + 8) {
          bug.active = false
          bug.knocked = 30
          bug.flipped = false
          vy = -5.2
          score += 100
          options.sound.play('pop')
        } else respawn()
      }
      if (x > WORLD_W - 42) {
        completed++
        score += 1000
        x = 54
        y = FLOOR_Y - 26
        vx = vy = 0
        immune = 70
        coins.forEach((coin) => {
          coin.taken = false
        })
        bugs.forEach((bug) => {
          bug.knocked = 0
          bug.active = true
          bug.x = bug.home
        })
        options.sound.play('level')
      }
      camera = Math.max(0, Math.min(WORLD_W - W, x - W * 0.38))
    },
    render(g: CanvasRenderingContext2D) {
      const back = g.createLinearGradient(0, 0, 0, H)
      back.addColorStop(0, '#76d8d6')
      back.addColorStop(0.55, '#d6f7dc')
      back.addColorStop(1, '#ffe5c8')
      g.fillStyle = back
      g.fillRect(0, 0, W, H)
      const platePath = plumberStageArt('1-1')
      const plate = platePath ? stagePlate(platePath) : null
      if (plate) {
        const cover =
          Math.max(W / plate.naturalWidth, H / plate.naturalHeight) * 1.18
        const pw = plate.naturalWidth * cover
        const ph = plate.naturalHeight * cover
        const pan = (camera / (WORLD_W - W)) * (pw - W)
        g.drawImage(plate, -pan, H - ph, pw, ph)
        const wash = g.createLinearGradient(0, 0, 0, H)
        wash.addColorStop(0, 'rgba(214, 247, 236, 0.1)')
        wash.addColorStop(1, 'rgba(255, 236, 214, 0.28)')
        g.fillStyle = wash
        g.fillRect(0, 0, W, H)
      } else {
        for (let i = 0; i < 12; i++) {
          const bx = ((((i * 123 - camera * 0.28) % 640) + 640) % 640) - 70
          g.fillStyle = i % 2 ? '#d0a5b9aa' : '#f5e8c6aa'
          g.fillRect(bx, 96 + (i % 3) * 14, 72, 160)
          g.fillStyle = '#fff8dc'
          g.fillRect(bx + 9, 112 + (i % 3) * 14, 16, 25)
          g.fillRect(bx + 42, 112 + (i % 3) * 14, 16, 25)
        }
        for (let i = 0; i < 10; i++) {
          const bx = ((((i * 164 - camera * 0.55) % 790) + 790) % 790) - 80
          g.strokeStyle = '#679f9e'
          g.lineWidth = 11
          g.beginPath()
          g.moveTo(bx, H)
          g.lineTo(bx, 165)
          g.quadraticCurveTo(bx + 18, 142, bx + 35, 165)
          g.stroke()
        }
      }
      g.save()
      g.translate(-camera, 0)
      const ground = tilePattern(g, PLUMBER_ART.tile(1), 32)
      for (const floor of surfaces) {
        g.fillStyle = ground ?? '#396d79'
        g.fillRect(
          floor.x,
          floor.y + 4,
          floor.width,
          ground && floor.y === FLOOR_Y ? 46 : 19,
        )
        g.fillStyle = '#c7a473'
        g.fillRect(floor.x, floor.y, floor.width, 7)
        g.fillStyle = '#f3e4a2'
        for (let k = 12; k < floor.width; k += 40)
          g.fillRect(floor.x + k, floor.y + 2, 6, 3)
      }
      for (const coin of coins) {
        if (coin.taken) continue
        const lift = Math.sin(tick / 17) * 2
        if (
          drawSprite(
            g,
            PLUMBER_ART.prop('brass-token'),
            coin.x,
            coin.y + 10 + lift,
            20,
          )
        )
          continue
        g.fillStyle = '#f7b83b'
        g.beginPath()
        g.ellipse(
          coin.x,
          coin.y + Math.sin(tick / 17) * 2,
          7,
          9,
          0,
          0,
          Math.PI * 2,
        )
        g.fill()
        g.strokeStyle = '#fff4c1'
        g.lineWidth = 2
        g.stroke()
      }
      for (const bug of bugs) {
        if (!bug.active) {
          if (bug.knocked)
            drawSheetFrame(
              g,
              PUMPBUG_CYCLE,
              6,
              bug.flipped ? 5 : 4,
              bug.x,
              bug.y + 3,
              24,
              { flipX: bug.dir < 0, alpha: Math.min(1, bug.knocked / 12) },
            )
          continue
        }
        if (
          drawSheetFrame(
            g,
            PUMPBUG_CYCLE,
            6,
            Math.floor(tick / 8 + bug.home) % 4,
            bug.x,
            bug.y + 3,
            24,
            { flipX: bug.dir < 0 },
          )
        )
          continue
        const squash = 1 + Math.sin(tick / 5 + bug.home) * 0.07
        if (
          drawSprite(g, PLUMBER_ART.enemy('pumpbug'), bug.x, bug.y + 3, 26, {
            flipX: bug.dir < 0,
            squash,
          })
        )
          continue
        g.fillStyle = '#b77696'
        g.beginPath()
        g.ellipse(bug.x, bug.y, 12, 9, 0, Math.PI, 2 * Math.PI)
        g.fill()
        g.fillStyle = '#f6ddca'
        g.fillRect(bug.x - 8, bug.y - 5, 4, 4)
        g.fillRect(bug.x + 4, bug.y - 5, 4, 4)
      }
      const goalDrawn = drawSprite(
        g,
        PLUMBER_ART.prop('goal-valve'),
        WORLD_W - 30,
        FLOOR_Y,
        52,
      )
      if (!goalDrawn) {
        g.fillStyle = '#ffe5a6'
        g.fillRect(WORLD_W - 36, FLOOR_Y - 57, 6, 57)
        g.fillStyle = '#e6798b'
        g.beginPath()
        g.moveTo(WORLD_W - 30, FLOOR_Y - 56)
        g.lineTo(WORLD_W - 5, FLOOR_Y - 45)
        g.lineTo(WORLD_W - 30, FLOOR_Y - 34)
        g.fill()
      }
      const visible = !immune || Math.floor(tick / 6) % 2
      const member = rosterFor(plumberHeroine())
      const poses = actionPoses(member)
      const runReady = keyedSheet(member.run, 6) !== null
      if (visible && keyedSheet(member.actions, 6) !== null) {
        const running = ground && Math.abs(vx) > 0.4
        const bob =
          running && !runReady ? Math.abs(Math.sin(stride / 2)) * 3 : 0
        const pose = !ground
          ? { src: member.actions, frame: vy < 0 ? poses.rise : poses.fall }
          : landed
            ? { src: member.actions, frame: poses.land }
            : running && runReady
              ? { src: member.run, frame: Math.floor(stride / 1.8) % 6 }
              : running
                ? {
                    src: member.actions,
                    frame: Math.floor(stride / 3) % 2 ? poses.rise : poses.fall,
                  }
                : { src: member.actions, frame: poses.idle }
        drawSheetFrame(
          g,
          pose.src,
          6,
          pose.frame,
          x,
          y + 27 - bob,
          50 * member.scale,
          { flipX: facing < 0 },
        )
      } else if (visible && typeof Path2D !== 'undefined') {
        drawHeroine(g, plumberHeroine(), x, y + 27, 40, {
          stride,
          run: Math.min(1, Math.abs(vx) / 2.2),
          airborne: !ground,
          rising: vy < 0,
          facing,
          tick,
        })
      } else if (visible) {
        g.save()
        g.translate(x, y)
        g.fillStyle = '#4d656c'
        g.fillRect(-8, 17, 7, 10)
        g.fillRect(2, 17, 7, 10)
        g.fillStyle = '#248e9a'
        g.fillRect(-11, 6, 22, 15)
        g.fillStyle = '#f2bb92'
        g.beginPath()
        g.arc(0, 0, 10, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#49364d'
        g.beginPath()
        g.arc(0, -5, 11, Math.PI, 2 * Math.PI)
        g.fill()
        g.fillStyle = '#fff'
        g.fillRect(3, -1, 3, 3)
        g.fillStyle = '#f37e73'
        g.fillRect(-8, 3, 5, 10)
        g.restore()
      }
      g.restore()
      g.fillStyle = '#1c3f52dd'
      g.fillRect(0, 0, W, 27)
      g.fillStyle = '#fff1ce'
      g.font = 'bold 11px monospace'
      g.fillText('BLUEBELL PIPEWORKS  1-1', 12, 18)
      g.textAlign = 'right'
      g.fillText(`VALVES ${completed}  ·  TOOLS ${score}`, W - 10, 18)
      g.textAlign = 'left'
    },
  }
}
const module: ArcadeGameModule = { create: createSavePlumberPreview }
export default module
export const create = createSavePlumberPreview
