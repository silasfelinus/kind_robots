// /utils/zuzuShowdown/arcadeScreens.ts
//
// Zuzu Showdown Arcade mode's own screens (conductor zuzu-showdown t-021): the ladder between fights,
// the continue countdown after a loss, the ending, the initials entry and the score in the corner of a
// fight. The ladder shows the climb as a row of busts, the fights won dimmed and ticked, the next one
// framed, and a door at the end. The ending shows its two stills with a line under each; a still not yet
// drawn falls back to the fighter's victory portrait. Reduced motion skips the fades.

import type { RenderStyle } from '../arcade/display'
import { drawText } from '../arcade/font'
import shipped from './endings.json'
import {
  ENDINGS,
  initialsText,
  type ArcadeScore,
  type InitialsEntry,
} from './arcade'
import { drawPortrait, type LoadedPortraits } from './portraits'
import { VIEW_HEIGHT, VIEW_WIDTH } from './render'
import { wrapText } from './screens'
import type { FighterData } from './types'

type G = CanvasRenderingContext2D

/** Frames each ending still holds before the next (LP skips ahead). */
export const ENDING_STILL_FRAMES = 360
/** Frames a still takes to fade in. */
const FADE_FRAMES = 30
/** Frames the ladder shows before the VS screen. */
export const LADDER_FRAMES = 150
/** Seconds the continue countdown runs. */
export const CONTINUE_SECONDS = 9

const SLOT = 40
const SLOT_GAP = 6
const SLOT_TOP = 104

/** A number with thousands separators, in the pixel font's characters. */
export function formatScore(score: number): string {
  return Math.floor(score)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Where the `index`-th of `count` ladder slots sits. */
export function ladderSlot(
  index: number,
  count: number,
): { x: number; y: number; w: number; h: number } {
  const width = count * SLOT + (count - 1) * SLOT_GAP
  const left = Math.round((VIEW_WIDTH - width) / 2)
  return { x: left + index * (SLOT + SLOT_GAP), y: SLOT_TOP, w: SLOT, h: SLOT }
}

function drawDoor(g: G, slot: { x: number; y: number; w: number; h: number }) {
  g.fillStyle = '#0b0614'
  g.fillRect(slot.x, slot.y, slot.w, slot.h)
  g.fillStyle = '#3b2a1a'
  g.fillRect(slot.x + 10, slot.y + 4, slot.w - 20, slot.h - 4)
  g.fillStyle = '#facc15'
  g.fillRect(slot.x + slot.w / 2 - 3, slot.y + 16, 6, 3)
  g.fillStyle = '#000000'
  g.fillRect(slot.x + slot.w / 2 - 1, slot.y + 16, 2, 3)
}

/**
 * The climb: `ladder` is the opponents in order, `rung` the next fight (0-based; the ladder's length
 * is the door). `t` counts frames on the screen. At the door, `doorLine` is what the challenger says
 * to it (matchups.yaml boss lines; the Thing answers with nothing).
 */
export function drawLadderScreen(
  g: G,
  player: FighterData,
  ladder: readonly FighterData[],
  rung: number,
  score: ArcadeScore,
  portraits: LoadedPortraits | undefined,
  t: number,
  reduced: boolean,
  doorLine?: string,
): void {
  g.fillStyle = '#120c18'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  drawText(g, 'ARCADE', VIEW_WIDTH / 2, 18, {
    align: 'center',
    scale: 3,
    color: '#fdba74',
    shadow: '#000000',
  })
  drawText(g, player.name.toUpperCase(), VIEW_WIDTH / 2, 52, {
    align: 'center',
    color: '#fde68a',
    shadow: '#000000',
  })
  const count = ladder.length + 1
  for (let i = 0; i < count; i += 1) {
    const slot = ladderSlot(i, count)
    g.fillStyle = '#000000'
    g.fillRect(slot.x - 1, slot.y - 1, slot.w + 2, slot.h + 2)
    if (i < ladder.length) {
      g.save()
      g.beginPath()
      g.rect(slot.x, slot.y, slot.w, slot.h)
      g.clip()
      g.fillStyle = '#1c1917'
      g.fillRect(slot.x, slot.y, slot.w, slot.h)
      const drawn = drawPortrait(
        g,
        portraits,
        ladder[i]!.slug,
        'bust',
        slot.x + slot.w / 2,
        slot.y + slot.h,
        false,
        slot.w / 50,
      )
      if (!drawn) {
        g.fillStyle = ladder[i]!.look?.body ?? '#57534e'
        g.fillRect(slot.x + 10, slot.y + 8, slot.w - 20, slot.h - 8)
      }
      if (i < rung) {
        g.fillStyle = 'rgba(0, 0, 0, 0.6)'
        g.fillRect(slot.x, slot.y, slot.w, slot.h)
      }
      g.restore()
      if (i < rung)
        drawText(g, 'OK', slot.x + slot.w / 2, slot.y + slot.h / 2 - 4, {
          align: 'center',
          color: '#86efac',
          shadow: '#000000',
        })
    } else drawDoor(g, slot)
    if (i === rung && (reduced || t % 30 < 22)) {
      g.strokeStyle = '#fb923c'
      g.lineWidth = 2
      g.strokeRect(slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 4)
    }
  }
  const next =
    rung < ladder.length
      ? `NEXT: ${ladder[rung]!.name.toUpperCase()}`
      : 'NEXT: THE THING BEHIND THE DOOR'
  drawText(g, next, VIEW_WIDTH / 2, SLOT_TOP + SLOT + 22, {
    align: 'center',
    color: '#ffffff',
    shadow: '#000000',
  })
  drawText(
    g,
    `FIGHT ${Math.min(rung + 1, count)} OF ${count}`,
    VIEW_WIDTH / 2,
    SLOT_TOP + SLOT + 38,
    { align: 'center', color: '#d6d3d1' },
  )
  if (doorLine)
    wrapText(doorLine, VIEW_WIDTH - 60, 1).forEach((line, i) =>
      drawText(g, line, VIEW_WIDTH / 2, SLOT_TOP + SLOT + 60 + i * 12, {
        align: 'center',
        color: '#e9d5ff',
        shadow: '#000000',
      }),
    )
  drawText(g, `SCORE ${formatScore(score.total)}`, VIEW_WIDTH / 2, 236, {
    align: 'center',
    color: '#fde047',
    shadow: '#000000',
  })
}

/** After a loss: the countdown, with `t` frames gone. */
export function drawContinueScreen(g: G, score: ArcadeScore, t: number): void {
  g.fillStyle = 'rgba(0, 0, 0, 0.75)'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  const left = Math.max(0, CONTINUE_SECONDS - Math.floor(t / 60))
  drawText(g, 'CONTINUE?', VIEW_WIDTH / 2, 70, {
    align: 'center',
    scale: 3,
    color: '#fdba74',
    shadow: '#000000',
  })
  drawText(g, String(left), VIEW_WIDTH / 2, 112, {
    align: 'center',
    scale: 4,
    color: '#ffffff',
    shadow: '#000000',
  })
  drawText(g, 'PRESS START OR LP', VIEW_WIDTH / 2, 176, {
    align: 'center',
    color: '#fde047',
  })
  drawText(
    g,
    `THE SCORE STARTS OVER (${formatScore(score.total)})`,
    VIEW_WIDTH / 2,
    196,
    { align: 'center', color: '#d6d3d1' },
  )
}

/** Loaded ending stills, by file stem (arcade.ts ENDINGS). */
export type LoadedEndings = Partial<Record<string, CanvasImageSource>>

/** Where the ending stills are served from (conductor tools/endings.py ships them). */
export const ENDING_ROOT = '/zuzu-showdown-endings'

/** The ending stills that have shipped (endings.json); the rest fall back to the portrait. */
export function shippedEndings(): readonly string[] {
  return shipped as string[]
}

export function endingUrl(file: string, style: RenderStyle): string {
  return `${ENDING_ROOT}/${file}-${style === 'hd' ? 'hd.webp' : 'pixel.png'}`
}

/** Which still the ending is on after `t` frames (2 once both have played). */
export function endingStill(t: number): number {
  return Math.min(2, Math.floor(t / ENDING_STILL_FRAMES))
}

/** The ending of `fighter`, `t` frames in. */
export function drawEndingScreen(
  g: G,
  fighter: FighterData,
  endings: LoadedEndings | undefined,
  portraits: LoadedPortraits | undefined,
  t: number,
  reduced: boolean,
): void {
  g.fillStyle = '#000000'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  const stills = ENDINGS[fighter.slug]
  if (!stills) return
  const index = endingStill(t) >= 1 ? 1 : 0
  const still = stills[index]
  const into = t - index * ENDING_STILL_FRAMES
  const alpha = reduced ? 1 : Math.min(1, into / FADE_FRAMES)
  g.save()
  g.globalAlpha = alpha
  const image = endings?.[still.file]
  if (image) g.drawImage(image, 0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  else
    drawPortrait(
      g,
      portraits,
      fighter.slug,
      'victory',
      VIEW_WIDTH / 2,
      VIEW_HEIGHT - 50,
    )
  g.fillStyle = 'rgba(0, 0, 0, 0.7)'
  g.fillRect(0, VIEW_HEIGHT - 44, VIEW_WIDTH, 44)
  wrapText(still.line, VIEW_WIDTH - 40, 1).forEach((line, i) =>
    drawText(g, line, VIEW_WIDTH / 2, VIEW_HEIGHT - 32 + i * 12, {
      align: 'center',
      color: '#ffffff',
      shadow: '#000000',
    }),
  )
  g.restore()
}

/** The run's end: the score, the tallies and the initials being entered. */
export function drawInitialsScreen(
  g: G,
  score: ArcadeScore,
  entry: InitialsEntry,
  cleared: boolean,
  t: number,
  reduced: boolean,
): void {
  g.fillStyle = '#120c18'
  g.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT)
  drawText(g, cleared ? 'THE DOOR IS SHUT' : 'GAME OVER', VIEW_WIDTH / 2, 28, {
    align: 'center',
    scale: 3,
    color: cleared ? '#86efac' : '#fca5a5',
    shadow: '#000000',
  })
  drawText(g, `SCORE ${formatScore(score.total)}`, VIEW_WIDTH / 2, 70, {
    align: 'center',
    scale: 2,
    color: '#fde047',
    shadow: '#000000',
  })
  drawText(
    g,
    `FIGHTS ${score.fights}  PERFECTS ${score.perfects}  READS ${score.reads}  BEST COMBO ${score.bestCombo}`,
    VIEW_WIDTH / 2,
    98,
    { align: 'center', color: '#d6d3d1' },
  )
  drawText(g, 'ENTER YOUR INITIALS', VIEW_WIDTH / 2, 132, {
    align: 'center',
    color: '#ffffff',
  })
  const text = initialsText(entry)
  for (let i = 0; i < 3; i += 1) {
    const x = VIEW_WIDTH / 2 - 36 + i * 36
    const active = i === entry.pos
    drawText(g, text[i]!, x, 152, {
      align: 'center',
      scale: 3,
      color: active ? '#fb923c' : '#ffffff',
      shadow: '#000000',
    })
    if (active && (reduced || t % 30 < 20)) {
      g.fillStyle = '#fb923c'
      g.fillRect(x - 10, 180, 20, 3)
    }
  }
  drawText(g, 'UP/DOWN LETTER - LP NEXT - HP BACK', VIEW_WIDTH / 2, 206, {
    align: 'center',
    color: '#a8a29e',
  })
}

/** The score and the fight's place on the ladder, along the bottom edge of a fight. */
export function drawArcadeHud(
  g: G,
  score: ArcadeScore,
  rung: number,
  fights: number,
): void {
  drawText(
    g,
    `${formatScore(score.total)}  ${Math.min(rung + 1, fights)}/${fights}`,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT - 12,
    { align: 'center', color: '#fde047', shadow: '#000000' },
  )
}
