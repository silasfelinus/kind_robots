// /utils/zuzuShowdown/sprites.ts
//
// Zuzu Showdown fighter sprites (conductor zuzu-showdown t-010). The atlases and frame maps come from
// conductor's rig (projects/zuzu-showdown/tools/rig.py): one row per animation, every frame with its
// rect in the atlas and the fighter's ground anchor, so a sprite is placed with its anchor on the
// fighter's (x, floor) whatever the pose. This module is pure: it picks which frame of which
// animation a fighter shows, and draws it. Loading the images is the stage component's job.

import type { FighterState } from './types'

export type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
  anchor: { x: number; y: number }
  hurt?: { x: number; y: number; w: number; h: number }
}

export type SpriteAnimation = {
  fps: number
  loop: boolean
  frames: SpriteFrame[]
}

/** A rig frame map (conductor tools/rig.py writes `<slug>-<style>.json`). */
export type SpriteSheet = {
  fighter: string
  style: 'pixel' | 'hd'
  /** Atlas pixels per game pixel (pixel 1, HD 4). */
  scale: number
  height: number
  atlas: string
  atlas_p2: string
  animations: Record<string, SpriteAnimation>
}

export type LoadedSprites = {
  sheet: SpriteSheet
  image: CanvasImageSource
  /** P2's alternate colours, used for the second fighter in a mirror match. */
  p2: CanvasImageSource | null
}

/** Where the rig's pixel atlases are served from. */
export const SPRITE_ROOT = '/zuzu-showdown-sprites'

/** Fighters whose rig has been exported to the game so far. */
export const SPRITE_FIGHTERS = ['zuzu', 'coyote-vagrant'] as const

/** The rig names the Coyote `coyote`; the game's slug is `coyote-vagrant`. */
export function spriteFile(slug: string): string {
  return slug === 'coyote-vagrant' ? 'coyote' : slug
}

const SIM_FPS = 60

/** An animation name and the frame of it to show. */
export type SpritePick = { name: string; index: number }

// Moves whose attack id names a rig animation directly ('wild-shot' -> 'wild_shot').
function moveAnimation(id: string): string {
  return id.replace(/-/g, '_')
}

/** The animations to try, best first, for a fighter's current state; `idle` always ends the list. */
export function animationCandidates(f: FighterState): string[] {
  const low = f.prev.down
  switch (f.action) {
    case 'walk':
      return f.vx * f.facing >= 0
        ? ['walk_forward']
        : ['walk_back', 'walk_forward']
    case 'crouch':
      return ['crouch']
    case 'prejump':
    case 'jump':
      return ['jump_up']
    case 'attack': {
      const id = f.attack?.id ?? ''
      if (id.startsWith('crouch_')) return [moveAnimation(id), 'crouch']
      if (id.startsWith('jump_')) return [moveAnimation(id), 'jump_up']
      return [moveAnimation(id), 'stand_hp']
    }
    case 'throwing':
    case 'throwHold':
    case 'throwWhiff':
    case 'breakout':
      return ['throw', 'stand_hp']
    case 'taunt':
      return ['taunt']
    case 'hitstun':
    case 'airhit':
      return low ? ['hit_low', 'hit_high'] : ['hit_high']
    case 'blockstun':
      return low ? ['block_low', 'crouch'] : ['block_high']
    case 'knockdown':
    case 'thrown':
      return ['knockdown', 'ko']
    case 'ko':
      return ['ko', 'knockdown']
    case 'victory':
      return ['victory_button', 'victory', 'taunt']
    default:
      return []
  }
}

/** Which frame of which animation the fighter shows now, or null when the sheet has nothing usable. */
export function pickSprite(
  f: FighterState,
  sheet: SpriteSheet,
): SpritePick | null {
  const names = [...animationCandidates(f), 'idle']
  const name = names.find((n) => sheet.animations[n]?.frames.length)
  if (!name) return null
  const anim = sheet.animations[name]!
  // Attacks follow the move's own clock; everything else the frames spent in the action.
  const elapsed = Math.max(
    0,
    (f.action === 'attack' && f.attack ? f.attack.frame : f.frame) - 1,
  )
  const step = Math.floor((elapsed * anim.fps) / SIM_FPS)
  const count = anim.frames.length
  const index = anim.loop ? step % count : Math.min(step, count - 1)
  return { name, index }
}

type G = CanvasRenderingContext2D

/**
 * Draw a frame with its anchor on (x, floor), in game pixels. Rig art faces right; a fighter facing
 * left is mirrored about its anchor.
 */
export function drawSprite(
  g: G,
  image: CanvasImageSource,
  frame: SpriteFrame,
  scale: number,
  x: number,
  floor: number,
  facing: 1 | -1,
): void {
  const w = frame.w / scale
  const h = frame.h / scale
  const ax = frame.anchor.x / scale
  const ay = frame.anchor.y / scale
  g.save()
  g.translate(x, floor)
  if (facing === -1) g.scale(-1, 1)
  g.drawImage(image, frame.x, frame.y, frame.w, frame.h, -ax, -ay, w, h)
  g.restore()
}
