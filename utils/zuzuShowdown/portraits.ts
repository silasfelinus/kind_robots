// /utils/zuzuShowdown/portraits.ts
//
// Zuzu Showdown portraits (conductor zuzu-showdown t-008): four per fighter, re-posed by Flux Kontext from
// each one's canon art and shipped by conductor tools/portraits.py in both render styles: the select
// screen's bust, the VS screen's half-body slam, and the win screen's victory and beaten portraits.
// portraits.json lists the ones that exist; a portrait still being redrawn is simply absent, and the
// screens draw the fighter's sprite in its place.

import type { RenderStyle } from '../arcade/display'
import index from './portraits.json'

/** Where the portrait files are served from. */
export const PORTRAIT_ROOT = '/zuzu-showdown-portraits'

export type PortraitKind = 'bust' | 'vs' | 'victory' | 'beaten'
export const PORTRAIT_KINDS: readonly PortraitKind[] = [
  'bust',
  'vs',
  'victory',
  'beaten',
]

/** One portrait: its file stem and its size in game pixels. */
export type PortraitInfo = { file: string; w: number; h: number }

const INDEX = index as Partial<
  Record<string, Partial<Record<PortraitKind, PortraitInfo>>>
>

/** A fighter's portrait of one kind, if it has been drawn. */
export function portraitInfo(
  slug: string,
  kind: PortraitKind,
): PortraitInfo | undefined {
  return INDEX[slug]?.[kind]
}

/** Every fighter slug with at least one portrait. */
export function portraitFighters(): string[] {
  return Object.keys(INDEX)
}

/** The file a portrait is served from in a render style. */
export function portraitUrl(info: PortraitInfo, style: RenderStyle): string {
  return `${PORTRAIT_ROOT}/${info.file}-${style === 'hd' ? 'hd.webp' : 'pixel.png'}`
}

/** Loaded portrait images, by fighter slug and kind. */
export type LoadedPortraits = Partial<
  Record<string, Partial<Record<PortraitKind, CanvasImageSource>>>
>

type G = CanvasRenderingContext2D

/**
 * Draw a fighter's portrait of `kind` standing on (cx, floor), `flip`ped to face left, at `scale` of its
 * own size. Returns false (drawing nothing) when it isn't loaded, so the caller can draw the sprite.
 */
export function drawPortrait(
  g: G,
  portraits: LoadedPortraits | undefined,
  slug: string,
  kind: PortraitKind,
  cx: number,
  floor: number,
  flip = false,
  scale = 1,
): boolean {
  const info = portraitInfo(slug, kind)
  const image = portraits?.[slug]?.[kind]
  if (!info || !image) return false
  const w = info.w * scale
  const h = info.h * scale
  g.save()
  g.translate(cx, floor - h)
  if (flip) g.scale(-1, 1)
  g.drawImage(image, -w / 2, 0, w, h)
  g.restore()
  return true
}
