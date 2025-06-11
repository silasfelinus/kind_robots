// /stores/helpers/butterflyHelper.ts

import { makeNoise2D } from 'open-simplex-noise'
import { generateFunnyName } from '~/utils/generateButterflyNames'
import { generateMessage } from '~/utils/generateMessage'

// TYPES

export interface Butterfly {
  id: string
  x: number
  y: number
  z: number
  zIndex: number
  rotation: number
  wingTopColor: string
  wingBottomColor: string
  speed: number
  wingSpeed: number
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
  scale: number
  message: string
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

// SHARED UTILITY

const noise2D = makeNoise2D(Date.now())
export const getNoise = () => noise2D

export const clampToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100

// COLOR HELPERS

export const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 50 + 50)
  const l = Math.floor(Math.random() * 40 + 30)
  return `hsl(${h},${s}%,${l}%)`
}

export const analogousColor = (hsl: string): string => {
  const hslMatch = hsl.match(/\d+/g)
  if (!hslMatch) throw new Error('Invalid color format')
  const [h, s, l] = hslMatch.map(Number)
  const newH = (h + 30) % 360
  return `hsl(${newH},${s}%,${l}%)`
}

export const complementaryColor = (hsl: string): string => {
  const [h, s, l] = hsl.replace('hsl(', '').replace(')', '').split(',')
  const newH = (parseInt(h) + 180) % 360
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

// CREATE BUTTERFLY

export const createNewButterfly = async (
  settings: ButterflySettingsWithOptions,
  usedNames: string[],
): Promise<Butterfly> => {
  const primaryColor = randomColor()
  const secondaryColor = applyColorScheme(settings.colorScheme, primaryColor)
  const message = await generateMessage()

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
    zIndex:
      Math.floor(
        Math.random() *
          (settings.zIndexRange.max - settings.zIndexRange.min + 1),
      ) + settings.zIndexRange.min,
    rotation: clampToTwoDecimals(
      Math.random() *
        (settings.rotationRange.max - settings.rotationRange.min) +
        settings.rotationRange.min,
    ),
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
    scale: clampToTwoDecimals(Math.random() * 0.5 + 0.75),
    status: settings.status,
    message,
    goal: {
      x: clampToTwoDecimals(Math.random() * 100),
      y: clampToTwoDecimals(Math.random() * 100),
    },
  }
}
