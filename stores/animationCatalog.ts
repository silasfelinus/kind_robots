// /stores/animationCatalog.ts

export type FxRegion = 'header' | 'sheet' | 'page' | 'hand'

interface AnimationEffectDefinition {
  id: string
  label: string
  reveal: string
  icon: string
  tooltip: string
  color: string
  generationSafe: boolean
  blocksInput?: boolean
  preferredSurface?: FxRegion | 'fullscreen'
}

export const ANIMATION_EFFECTS = [
  {
    id: 'starfield-effect',
    label: 'Warp Drive',
    reveal: 'Hyperspace!',
    icon: 'kind-icon:star',
    tooltip: 'Punch it, Chewie ✨',
    color: '#6366f1',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'constellation-effect',
    label: 'Constellation',
    reveal: 'Star map',
    icon: 'kind-icon:sparkle',
    tooltip: 'Drifting stars connect into patterns 🔭',
    color: '#60a5fa',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'wishing-stars',
    label: 'Wishing Stars',
    reveal: '✨ Wish granted',
    icon: 'kind-icon:star',
    tooltip: 'Shooting stars streak across the sky 🌠',
    color: '#fbbf24',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'orbit-effect',
    label: 'Orrery',
    reveal: 'Solar system',
    icon: 'kind-icon:orbit',
    tooltip: 'Glowing orbs trace orbital paths 🪐',
    color: '#a855f7',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    reveal: 'Happy butterflies',
    icon: 'kind-icon:butterfly',
    tooltip: 'Release AMI into the world 🦋',
    color: '#e879f9',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'firefly-effect',
    label: 'Fireflies',
    reveal: 'Golden hour',
    icon: 'kind-icon:sparkle',
    tooltip: 'Organic warm glow drifting through the dark 🌿',
    color: '#f59e0b',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    reveal: 'Just a drizzle',
    icon: 'kind-icon:raindrop',
    tooltip: "Rain doesn't have to be sad 🌧️",
    color: '#7ba7c0',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'snow-effect',
    label: 'Snow Globe',
    reveal: 'Cozy ❄️',
    icon: 'kind-icon:snowflake',
    tooltip: 'Soft particle snowfall ❄️',
    color: '#93c5fd',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'floating-hearts',
    label: 'Love Bomb',
    reveal: 'So much love',
    icon: 'kind-icon:heart',
    tooltip: 'Click anywhere to burst 💖',
    color: '#f43f5e',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    reveal: 'Carbonation!',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    color: '#38bdf8',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'bubble-effect',
    label: 'Soap Bubbles',
    reveal: 'Bubbles!',
    icon: 'kind-icon:bubbles',
    tooltip: 'Colorful bubbles drift up and pop 🫧',
    color: '#67e8f9',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'ripple-effect',
    label: 'Ripple',
    reveal: 'Still waters',
    icon: 'kind-icon:raindrop',
    tooltip: 'Move your cursor to ripple the surface 💧',
    color: '#0ea5e9',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'bioluminescent-tide',
    label: 'Bioluminescent Tide',
    reveal: 'The deep is awake',
    icon: 'kind-icon:wave',
    tooltip: 'Drifting lantern life follows your wake; click for a tide pulse 🌊',
    color: '#2dd4bf',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'gravity-garden',
    label: 'Gravity Garden',
    reveal: 'The garden noticed you',
    icon: 'kind-icon:sprout',
    tooltip: 'Orbiting seeds grow a luminous garden; click for a gravity bloom 🌱',
    color: '#4ade80',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fireworks-effect',
    label: 'Fireworks',
    reveal: '🎆 Celebration!',
    icon: 'kind-icon:sparkle',
    tooltip: 'Click anywhere to fire 🎆',
    color: '#ef4444',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'lightning-effect',
    label: 'Storm Caller',
    reveal: 'Feel the power',
    icon: 'kind-icon:lightning',
    tooltip: 'Recursive arc strikes from the sky ⚡',
    color: '#eab308',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fire-effect',
    label: 'Wildfire',
    reveal: 'Everything is fine',
    icon: 'kind-icon:flame',
    tooltip: 'This is fine 🔥',
    color: '#ea580c',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'glitch-effect',
    label: 'Glitch',
    reveal: 'ERR_404',
    icon: 'kind-icon:lightning',
    tooltip: 'Signal corruption detected 📺',
    color: '#7c3aed',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'kaleidoscope-effect',
    label: 'Kaleidoscope',
    reveal: 'Infinite mirror',
    icon: 'kind-icon:gem',
    tooltip: 'Sacred geometry in motion 🔮',
    color: '#9333ea',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'plasma-effect',
    label: 'Plasma',
    reveal: 'Sine wave soup',
    icon: 'kind-icon:wave',
    tooltip: 'Summed sine waves, After Dark plasma 🌊',
    color: '#8b5cf6',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'nyan-trail',
    label: 'Nyan Trail',
    reveal: 'Nyan nyan nyan',
    icon: 'kind-icon:rainbow',
    tooltip: 'Rainbow particle trail follows your cursor 🌈',
    color: '#ec4899',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'matrix-rain',
    label: 'Matrix Rain',
    reveal: 'There is no spoon',
    icon: 'kind-icon:code',
    tooltip: 'Follow the white rabbit 🐇',
    color: '#22c55e',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'pixel-rain',
    label: 'Pixel Rain',
    reveal: "It's raining bits",
    icon: 'kind-icon:pixel',
    tooltip: 'Retro pixel blocks fall and pile up 🕹️',
    color: '#06b6d4',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'pixel-explosion',
    label: 'Pixel Smash',
    reveal: 'Everything is pixels',
    icon: 'kind-icon:pixel',
    tooltip: 'Click anything to shatter it into pixels 💥',
    color: '#dc2626',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'wandering-creatures',
    label: 'Creatures',
    reveal: 'They live here now',
    icon: 'kind-icon:butterfly',
    tooltip: 'Critters with distinct personalities roam the screen 🐾',
    color: '#10b981',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'toaster-effect',
    label: 'Flying Toasters',
    reveal: 'Toast incoming!',
    icon: 'kind-icon:toast',
    tooltip: 'After Dark tribute, the original screensaver 🍞',
    color: '#f97316',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'ascii-aquarium',
    label: 'Aquarium',
    reveal: 'Glub glub',
    icon: 'kind-icon:fish',
    tooltip: 'Click to feed, Move cursor to spook 🐠',
    color: '#06b6d4',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
  {
    id: 'pacbot-effect',
    label: 'Pac-Bot',
    reveal: 'Nom nom nom',
    icon: 'kind-icon:robot',
    tooltip: 'Move to leave crumbs, Click for power, Dbl-click for crumb storm 🤖',
    color: '#eab308',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
  {
    id: 'pocket-gremlin',
    label: 'Gremlin',
    reveal: 'beep?',
    icon: 'kind-icon:ghost',
    tooltip: 'Click it to pet it, Ignore it at your peril 👾',
    color: '#a78bfa',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
  {
    id: 'siege-engine',
    label: 'Siege Engine',
    reveal: 'FIRE!!!',
    icon: 'kind-icon:flame',
    tooltip: 'Hold to charge, Release to launch 🪨',
    color: '#b45309',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
] as const satisfies readonly AnimationEffectDefinition[]

export type AnimationEffectId = (typeof ANIMATION_EFFECTS)[number]['id']

export type AnimationEffect = Omit<AnimationEffectDefinition, 'id'> & {
  id: AnimationEffectId
}

export const animationEffects: readonly AnimationEffect[] = ANIMATION_EFFECTS

export function isAnimationEffectId(value: unknown): value is AnimationEffectId {
  return (
    typeof value === 'string' &&
    animationEffects.some((effect) => effect.id === value)
  )
}

export function getAnimationComponentName(id: AnimationEffectId): string {
  const pascalName = id
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')

  return `Lazy${pascalName}`
}
