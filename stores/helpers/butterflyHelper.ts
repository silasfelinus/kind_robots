// /stores/helpers/butterflyHelper.ts

import { makeNoise2D } from 'open-simplex-noise'
import { generateFunnyName } from '~/utils/generateButterflyNames'
import { generateMessage } from '~/utils/generateMessage'

export interface Butterfly {
  id: string
  x: number
  y: number
  z: number
  zIndex: number
  baseZIndex: number
  rotation: number
  heading: number
  wingTopColor: string
  wingBottomColor: string
  name?: string
  speed: number
  wingSpeed: number
  rarity?: number
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
  scale: number
  scaleMod: number
  artImageId?: number
  message: string
  isExiting?: boolean
  noiseOffsetX: number
  noiseOffsetY: number
  userId?: number
  designer?: string
  exitSide?: 'left' | 'right' | 'top' | 'bottom'
  goal: {
    x: number
    y: number
  }
}

export interface ButterflyState {
  butterflies: Butterfly[]
  scaleModifier: number
  animationFrameId: number | null
  t: number
  animationPaused: boolean
  showNames: boolean
  selectedButterflyId: string

  originalButterflySettings: ButterflySettings
  newButterflySettings: ButterflySettingsWithOptions
  presets: ButterflySettingsWithOptions[]
}

// /stores/helpers/butterflyHelper.ts
export const createLoaderButterfly = (
  settings: ButterflySettingsWithOptions,
  usedNames: string[],
): Butterfly => {
  const primaryColor = randomColor()
  const secondaryColor = applyColorScheme(settings.colorScheme, primaryColor)

  const baseZIndex =
    Math.floor(
      Math.random() * (settings.zIndexRange.max - settings.zIndexRange.min + 1),
    ) + settings.zIndexRange.min

  return {
    id: generateFunnyName(usedNames),
    x: clampToTwoDecimals(
      Math.random() * (settings.xRange.max - settings.xRange.min) +
        settings.xRange.min,
    ),
    y: clampToTwoDecimals(
      Math.random() * (settings.yRange.max - settings.yRange.min) +
        settings.yRange.min,
    ),
    z: clampToTwoDecimals(
      Math.random() * (settings.sizeRange.max - settings.sizeRange.min) +
        settings.sizeRange.min,
    ),
    baseZIndex,
    zIndex: baseZIndex,
    rotation: clampToTwoDecimals(
      Math.random() *
        (settings.rotationRange.max - settings.rotationRange.min) +
        settings.rotationRange.min,
    ),
    heading: 0,
    wingTopColor: primaryColor,
    wingBottomColor: secondaryColor,
    speed: clampToTwoDecimals(
      Math.random() * (settings.speedRange.max - settings.speedRange.min) +
        settings.speedRange.min,
    ),
    wingSpeed: clampToTwoDecimals(
      Math.random() *
        (settings.wingSpeedRange.max - settings.wingSpeedRange.min) +
        settings.wingSpeedRange.min,
    ),
    scale: clampToTwoDecimals(Math.random() * 1.3 + 0.7),
    scaleMod: 1,
    status: settings.status,
    noiseOffsetX: Math.random() * 1000,
    noiseOffsetY: Math.random() * 1000,
    userId: 1,
    message: 'Fluttering ominously...',
    designer: 'ami',
    goal: {
      x: clampToTwoDecimals(Math.random() * 100),
      y: clampToTwoDecimals(Math.random() * 100),
    },
  }
}

export interface ButterflySettings {
  sizeRange: Range
  speedRange: Range
  rotationRange: Range
  wingSpeedRange: Range
  xRange: Range
  yRange: Range
  zIndexRange: Range
}

export interface ButterflySettingsWithOptions extends ButterflySettings {
  status: Butterfly['status']
  colorScheme: ColorScheme
}

export type ColorScheme =
  | 'random'
  | 'complementary'
  | 'analogous'
  | 'same'
  | 'primary'

export interface Range {
  min: number
  max: number
}

const noise2D = makeNoise2D(Date.now())
export const getNoise = () => noise2D

export const clampToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100

export const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 50 + 50)
  const l = Math.floor(Math.random() * 40 + 30)
  return `hsl(${h},${s}%,${l}%)`
}

export const analogousColor = (hsl: string): string => {
  const hslMatch = hsl.match(/\d+/g)
  if (!hslMatch || hslMatch.length < 3) throw new Error('Invalid color format')
  const [h, s, l] = hslMatch.map(Number)
  const newH = ((h ?? 0) + 30) % 360
  return `hsl(${newH},${s}%,${l}%)`
}

export const complementaryColor = (hsl: string): string => {
  const [h, s, l] = hsl.replace('hsl(', '').replace(')', '').split(',')
  const newH = (parseInt(h || '0') + 180) % 360
  return `hsl(${newH},${s},${l})`
}

export const randomPrimaryColor = (): string => {
  const rainbowHues = [0, 60, 120, 180, 240, 300]
  const randomHue = rainbowHues[Math.floor(Math.random() * rainbowHues.length)]
  return `hsl(${randomHue}, 100%, 50%)`
}

export const applyColorScheme = (
  scheme: ColorScheme,
  primaryColor: string,
): string => {
  switch (scheme) {
    case 'complementary':
      return complementaryColor(primaryColor)
    case 'analogous':
      return analogousColor(primaryColor)
    case 'primary':
      return randomPrimaryColor()
    case 'same':
      return primaryColor
    default:
      return primaryColor
  }
}

const EXIT_SIDES = ['left', 'right', 'top', 'bottom'] as const

export const randomExitGoal = (): {
  goal: { x: number; y: number }
  exitSide: Butterfly['exitSide']
} => {
  const side = EXIT_SIDES[Math.floor(Math.random() * EXIT_SIDES.length)]
  const rand = () => clampToTwoDecimals(Math.random() * 100)
  const goal =
    side === 'left'
      ? { x: -10, y: rand() }
      : side === 'right'
        ? { x: 110, y: rand() }
        : side === 'top'
          ? { x: rand(), y: -10 }
          : { x: rand(), y: 110 }
  return { goal, exitSide: side }
}

export const createNewButterfly = async (
  settings: ButterflySettingsWithOptions,
  usedNames: string[],
): Promise<Butterfly> => {
  const primaryColor = randomColor()
  const secondaryColor = applyColorScheme(settings.colorScheme, primaryColor)
  const message = await generateMessage()

  const baseZIndex =
    Math.floor(
      Math.random() * (settings.zIndexRange.max - settings.zIndexRange.min + 1),
    ) + settings.zIndexRange.min

  return {
    id: generateFunnyName(usedNames),
    x: clampToTwoDecimals(
      Math.random() * (settings.xRange.max - settings.xRange.min) +
        settings.xRange.min,
    ),
    y: clampToTwoDecimals(
      Math.random() * (settings.yRange.max - settings.yRange.min) +
        settings.yRange.min,
    ),
    z: clampToTwoDecimals(
      Math.random() * (settings.sizeRange.max - settings.sizeRange.min) +
        settings.sizeRange.min,
    ),
    baseZIndex,
    zIndex: baseZIndex,
    rotation: clampToTwoDecimals(
      Math.random() *
        (settings.rotationRange.max - settings.rotationRange.min) +
        settings.rotationRange.min,
    ),
    heading: 0,
    wingTopColor: primaryColor,
    wingBottomColor: secondaryColor,
    speed: clampToTwoDecimals(
      Math.random() * (settings.speedRange.max - settings.speedRange.min) +
        settings.speedRange.min,
    ),
    wingSpeed: clampToTwoDecimals(
      Math.random() *
        (settings.wingSpeedRange.max - settings.wingSpeedRange.min) +
        settings.wingSpeedRange.min,
    ),
    scale: clampToTwoDecimals(Math.random() * 1.3 + 0.7),
    scaleMod: 1,
    status: settings.status,
    noiseOffsetX: Math.random() * 1000,
    noiseOffsetY: Math.random() * 1000,
    userId: 1,
    message,
    designer: 'ami',
    goal: {
      x: clampToTwoDecimals(Math.random() * 100),
      y: clampToTwoDecimals(Math.random() * 100),
    },
  }
}
