export type RainbowBloomSource = {
  x: number
  y: number
  age: number
  life: number
  ring?: boolean
}

export const RAINBOW_BOSS_BLOOM = {
  maxFlares: 2,
  minLife: 72,
  frames: 22,
  maxRadius: 78,
  maxOpacity: 0.22,
  /** A thin anamorphic lens streak across each flare: wider than the glow, much fainter. */
  streakWidthScale: 2.4,
  streakHalfHeight: 2,
  streakOpacityScale: 0.6,
} as const

export function rainbowBossBloomFlares(
  sparks: readonly RainbowBloomSource[],
  calm: boolean,
  width = 480,
  height = 270,
  contrast = false,
) {
  const flares: Array<{
    x: number
    y: number
    radius: number
    alpha: number
    streakHalfWidth: number
    streakAlpha: number
  }> = []
  // Calm motion drops every flash; high-contrast shots drop the glow so no wash lifts the scenery
  // behind a pellet's black halo.
  if (calm || contrast) return flares

  for (
    let i = sparks.length - 1;
    i >= 0 && flares.length < RAINBOW_BOSS_BLOOM.maxFlares;
    i--
  ) {
    const spark = sparks[i]!
    if (
      !spark.ring ||
      spark.life < RAINBOW_BOSS_BLOOM.minLife ||
      spark.age < 0 ||
      spark.age >= RAINBOW_BOSS_BLOOM.frames ||
      spark.x < -60 ||
      spark.x > width + 60 ||
      spark.y < -60 ||
      spark.y > height + 60
    )
      continue
    const progress = spark.age / RAINBOW_BOSS_BLOOM.frames
    const radius = 28 + progress * (RAINBOW_BOSS_BLOOM.maxRadius - 28)
    const alpha = RAINBOW_BOSS_BLOOM.maxOpacity * (1 - progress) ** 2
    flares.push({
      x: spark.x,
      y: spark.y,
      radius,
      alpha,
      streakHalfWidth: radius * RAINBOW_BOSS_BLOOM.streakWidthScale,
      streakAlpha: alpha * RAINBOW_BOSS_BLOOM.streakOpacityScale,
    })
  }
  return flares
}

export function drawRainbowBossBloom(
  g: CanvasRenderingContext2D,
  sparks: readonly RainbowBloomSource[],
  calm: boolean,
  contrast = false,
): void {
  for (const flare of rainbowBossBloomFlares(
    sparks,
    calm,
    480,
    270,
    contrast,
  )) {
    g.save()
    g.globalCompositeOperation = 'screen'
    g.globalAlpha = flare.alpha
    const glow = g.createRadialGradient(
      flare.x,
      flare.y,
      0,
      flare.x,
      flare.y,
      flare.radius,
    )
    glow.addColorStop(0, '#fffdf4')
    glow.addColorStop(0.2, '#fff5bb')
    glow.addColorStop(0.5, '#ff9fd8')
    glow.addColorStop(1, '#ff9fd800')
    g.fillStyle = glow
    g.beginPath()
    g.arc(flare.x, flare.y, flare.radius, 0, Math.PI * 2)
    g.fill()
    // The lens streak: one horizontal sliver, brightest at the flare's core and fading at both ends.
    g.globalAlpha = flare.streakAlpha
    const streak = g.createLinearGradient(
      flare.x - flare.streakHalfWidth,
      flare.y,
      flare.x + flare.streakHalfWidth,
      flare.y,
    )
    streak.addColorStop(0, '#9fe8ff00')
    streak.addColorStop(0.5, '#e8fbff')
    streak.addColorStop(1, '#9fe8ff00')
    g.fillStyle = streak
    g.fillRect(
      flare.x - flare.streakHalfWidth,
      flare.y - RAINBOW_BOSS_BLOOM.streakHalfHeight,
      flare.streakHalfWidth * 2,
      RAINBOW_BOSS_BLOOM.streakHalfHeight * 2,
    )
    g.restore()
  }
}
