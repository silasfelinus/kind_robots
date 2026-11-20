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
} as const

export function rainbowBossBloomFlares(
  sparks: readonly RainbowBloomSource[],
  calm: boolean,
  width = 480,
  height = 270,
) {
  const flares: Array<{
    x: number
    y: number
    radius: number
    alpha: number
  }> = []
  if (calm) return flares

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
    flares.push({
      x: spark.x,
      y: spark.y,
      radius: 28 + progress * (RAINBOW_BOSS_BLOOM.maxRadius - 28),
      alpha: RAINBOW_BOSS_BLOOM.maxOpacity * (1 - progress) ** 2,
    })
  }
  return flares
}

export function drawRainbowBossBloom(
  g: CanvasRenderingContext2D,
  sparks: readonly RainbowBloomSource[],
  calm: boolean,
): void {
  for (const flare of rainbowBossBloomFlares(sparks, calm)) {
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
    g.restore()
  }
}
