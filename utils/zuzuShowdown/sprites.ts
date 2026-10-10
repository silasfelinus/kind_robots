// /utils/zuzuShowdown/sprites.ts
//
// Zuzu Showdown fighter sprites (conductor zuzu-showdown t-010). The atlases and frame maps come from
// conductor's rig (projects/zuzu-showdown/tools/rig.py): one row per animation, every frame with its
// rect in the atlas and the fighter's ground anchor, so a sprite is placed with its anchor on the
// fighter's (x, floor) whatever the pose. This module is pure: it picks which frame of which
// animation a fighter shows, and draws it. Loading the images is the stage component's job.

import type { RenderStyle } from '../arcade/display'
import type { P2Rule } from './recolour'
import { SUB, type FighterState } from './types'

export type SpriteFrame = {
  x: number
  y: number
  w: number
  h: number
  anchor: { x: number; y: number }
  hurt?: { x: number; y: number; w: number; h: number }
  /**
   * An attack's reach in this frame, measured from the striking layer alone (the blade arm, the
   * kicking leg), in game units from the fighter's spot like the kits' hitboxes.
   */
  hit?: { x: number; y: number; w: number; h: number }
}

export type SpriteAnimation = {
  fps: number
  loop: boolean
  frames: SpriteFrame[]
}

/**
 * A rig frame map (conductor tools/rig.py writes `<slug>-<style>.json`; tools/ship_hd.py repacks the HD
 * one at 3x as WebP).
 */
export type SpriteSheet = {
  fighter: string
  style: 'pixel' | 'hd'
  /** Atlas pixels per game pixel (pixel 1, HD 3 as shipped). */
  scale: number
  height: number
  atlas: string
  /** P2's atlas; null when the sheet ships `p2_rules` for the game to recolour its own atlas (HD). */
  atlas_p2: string | null
  p2_rules?: P2Rule[]
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
export const SPRITE_FIGHTERS = [
  'zuzu',
  'coyote-vagrant',
  'the-abbess',
  'the-siblings',
] as const

/** The rig's short names for fighters whose game slug is longer. */
const RIG_NAMES: Partial<Record<string, string>> = {
  'coyote-vagrant': 'coyote',
  'the-abbess': 'abbess',
  'the-siblings': 'siblings',
}

/** The file name the rig gives a fighter's sheets (`coyote` for the game's `coyote-vagrant`). */
export function spriteFile(slug: string): string {
  return RIG_NAMES[slug] ?? slug
}

/** A fighter's frame map in a render style. */
export function spriteSheetFile(slug: string, style: RenderStyle): string {
  return `${spriteFile(slug)}-${style}.json`
}

// ---------------------------------------------------------------- puppets
//
// A puppet is drawn with its fighter from its own pose sheet, keyed to the fighter's state: the Siblings'
// toddler (t-011), who is never a hurtbox (fighters.yaml children_rules). His sheet is a rig frame map
// whose animations are his poses, one frame each.

/** Fighters who bring a puppet, and its sheet's file name. */
export const SPRITE_PUPPETS: Partial<Record<string, string>> = {
  'the-siblings': 'toddler',
}

/** Where a fighter's puppet sheet sits among the loaded sprites. */
export function puppetKey(slug: string): string {
  return `${slug}:puppet`
}

export type PuppetPose =
  'stand' | 'duck' | 'throw' | 'proud' | 'wave' | 'raspberry'

/**
 * The puppet's pose and spot: `back` game pixels behind the fighter (toward her back), `up` above the
 * floor, drawn behind her or (`front`) before her.
 */
export type PuppetPlace = {
  pose: PuppetPose
  back: number
  up: number
  front: boolean
}

/** A step behind her, toddling: where he stands when nothing calls him. */
const TODDLE = 17

/** What the toddler does, and where, from his sister's state (fighters.yaml's Siblings). */
export function puppetPlace(
  f: FighterState,
  context: SpriteContext = {},
): PuppetPlace {
  const behind = (pose: PuppetPose, back = TODDLE): PuppetPlace => ({
    pose,
    back,
    up: 0,
    front: false,
  })
  // Off the ground he rides her back.
  const riding: PuppetPlace = {
    pose: 'stand',
    back: 9,
    up: Math.round(f.y / SUB) + 34,
    front: false,
  }
  if (context.intro !== undefined && f.action === 'idle')
    // He peeks out from behind her; she pushes him back.
    return behind('stand', context.intro < 50 ? 6 : TODDLE)
  switch (f.action) {
    case 'attack':
      switch (f.attack?.id) {
        case 'apple-toss':
          return behind('throw', 12)
        case 'rain-of-apples':
          // Up on her shoulders, hurling.
          return { pose: 'throw', back: 6, up: 48, front: true }
        case 'shield-him':
          // She turns her back and wraps around him.
          return behind('duck', 6)
        default:
          return f.attack?.id.startsWith('jump_') ? riding : behind('stand')
      }
    case 'prejump':
    case 'jump':
      return riding
    case 'hitstun':
    case 'airhit':
    case 'blockstun':
    case 'thrown':
    case 'knockdown':
    case 'wakeup':
    case 'tech':
    case 'breakout':
      // He ducks behind her legs.
      return behind('duck', 10)
    case 'ko':
      // She scoops him up to run: held close.
      return { pose: 'duck', back: -2, up: 16, front: true }
    case 'taunt':
      return behind('raspberry', 12)
    case 'victory':
      return context.perfect ? behind('wave') : behind('proud', 12)
    default:
      return behind('stand')
  }
}

const SIM_FPS = 60

/** An animation name and the frame of it to show. */
export type SpritePick = { name: string; index: number }

/** What the fighter's own state can't tell the sprite: the match around it. */
export type SpriteContext = {
  /** Frames into the round intro, while the match is in its intro phase. */
  intro?: number
  /** The round was won without taking a hit (the Perfect pose replaces the victory). */
  perfect?: boolean
}

// Moves whose attack id names a rig animation directly ('wild-shot' -> 'wild_shot').
function moveAnimation(id: string): string {
  return id.replace(/-/g, '_')
}

/** The animations to try, best first, for a fighter's current state; `idle` always ends the list. */
export function animationCandidates(
  f: FighterState,
  context: SpriteContext = {},
): string[] {
  const low = f.prev.down
  if (context.intro !== undefined && f.action === 'idle') return ['intro']
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
    case 'land':
      return ['land', 'crouch']
    case 'dodge':
      return f.dodgeDir === 1
        ? ['dodge_forward', 'crouch']
        : ['dodge_back', 'walk_back']
    case 'wakeup':
      return ['wakeup', 'crouch']
    case 'tech':
      return ['dodge_back', 'block_high']
    case 'attack': {
      const id = f.attack?.id ?? ''
      if (id.startsWith('crouch_')) return [moveAnimation(id), 'crouch']
      if (id.startsWith('jump_')) return [moveAnimation(id), 'jump_up']
      return [moveAnimation(id), 'stand_hp']
    }
    case 'throwing':
      return ['throw', 'stand_hp']
    case 'throwHold':
      return ['throw_hold', 'throw', 'stand_hp']
    case 'throwWhiff':
      return ['throw_whiff', 'throw', 'stand_hp']
    case 'breakout':
      return ['breakout', 'block_high']
    case 'taunt':
      return ['taunt']
    case 'hitstun':
    case 'airhit':
      return low ? ['hit_low', 'hit_high'] : ['hit_high']
    case 'blockstun':
      return low ? ['block_low', 'crouch'] : ['block_high']
    case 'thrown':
      return ['thrown', 'hit_high', 'knockdown']
    case 'knockdown':
      return ['knockdown', 'ko']
    case 'ko':
      return ['ko', 'knockdown']
    case 'victory': {
      const won = ['victory_button', 'victory', 'taunt']
      return context.perfect ? ['perfect', ...won] : won
    }
    default:
      return []
  }
}

/** Which frame of which animation the fighter shows now, or null when the sheet has nothing usable. */
export function pickSprite(
  f: FighterState,
  sheet: SpriteSheet,
  context: SpriteContext = {},
): SpritePick | null {
  const names = [...animationCandidates(f, context), 'idle']
  const name = names.find((n) => sheet.animations[n]?.frames.length)
  if (!name) return null
  const anim = sheet.animations[name]!
  // Attacks follow the move's own clock, the intro the round's; everything else the frames spent in
  // the action.
  const clock =
    name === 'intro' && context.intro !== undefined
      ? context.intro
      : f.action === 'attack' && f.attack
        ? f.attack.frame
        : f.frame
  const elapsed = Math.max(0, clock - 1)
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
