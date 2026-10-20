export const RESTYLE_MAX_BYTES = 128 * 1024 * 1024
export const RESTYLE_MAX_DURATION_SEC = 15 * 60
export const RESTYLE_CHUNK_SECONDS = 4.5
export const RESTYLE_OVERLAP_SECONDS = 0.5

export const RESTYLE_STYLES = [
  {
    id: 'illustrious',
    label: 'Illustrious cel',
    note: 'Faithful anime linework',
    tone: 'from-cyan-400/40 via-indigo-500/30 to-amber-300/20',
    prompt:
      'Hand-painted Japanese cel animation, clean character silhouettes, expressive ink lines, elegant flowing black trench coat, subtle painterly lighting',
    preview:
      'A hand-painted Japanese cel animation still with crisp expressive ink lines, flat cel shading and soft painterly background light',
  },
  {
    id: 'ink',
    label: 'Ink & shadow',
    note: 'Graphic black-box theater',
    tone: 'from-slate-200/30 via-slate-900 to-red-500/20',
    prompt:
      'Hand-inked experimental animation, high contrast silhouettes, charcoal marks, dramatic stage lighting, monochrome theatrical composition',
    preview:
      'A hand-inked monochrome illustration with bold brush strokes, charcoal smudges and hard theatrical spotlight shadows',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    note: 'Fluid storybook washes',
    tone: 'from-sky-300/50 via-emerald-200/30 to-rose-300/40',
    prompt:
      'Painterly watercolor animation, translucent washes, expressive brushstrokes, handmade paper texture, flowing fabric',
    preview:
      'A loose watercolor painting with translucent pigment washes, soft blooms, expressive brushstrokes and visible cold-press paper grain',
  },
  {
    id: 'storybook',
    label: 'Painted film',
    note: 'Warm animated feature',
    tone: 'from-orange-400/40 via-fuchsia-500/30 to-violet-700/50',
    prompt:
      'Hand-painted 2D animated feature film, luminous theatrical palette, detailed clothing folds, textured backgrounds, expressive movement',
    preview:
      'A hand-painted 2D animated feature film still with a luminous theatrical palette, detailed clothing folds and richly textured painted backgrounds',
  },
  {
    id: 'felt',
    label: 'Felt & thread',
    note: 'Tactile stop-motion feel',
    tone: 'from-rose-300/60 via-amber-700/30 to-teal-700/40',
    prompt:
      'Handcrafted felt puppet animation, wool fibers and fabric seams, stop motion miniature theatre, physical light and shadow',
    preview:
      'Embroidered felt textile art in which every figure and surface is stitched from layered felt shapes, with visible stitching, fuzzy wool fibres, button details and warm handcrafted miniature lighting',
  },
  {
    id: 'noir',
    label: 'Dream noir',
    note: 'Midnight expressionism',
    tone: 'from-violet-700/60 via-slate-950 to-yellow-300/20',
    prompt:
      'Expressionist animated noir, moody indigo and amber spotlights, bold ink shadows, evocative surreal stage, graceful black fabric',
    preview:
      'An expressionist noir painting with moody indigo shadows, amber spotlights, bold ink darks and slanted surreal set pieces',
  },
  {
    id: 'manga',
    label: 'Manga B&W',
    note: 'Ink, screentone, speed lines',
    tone: 'from-white/70 via-slate-400/40 to-slate-950',
    prompt:
      'High-contrast black and white manga animation, crisp ink linework, screentone shading, dynamic speed lines, elegant flowing fabric',
    preview:
      'A high-contrast black-and-white manga illustration with crisp ink linework, screentone shading, dynamic speed lines and pure white highlights',
  },
  {
    id: 'neon-noir',
    label: 'Neon noir',
    note: 'Monochrome with neon accents',
    tone: 'from-slate-950 via-fuchsia-600/40 to-red-500/50',
    prompt:
      'Cinematic neon noir animation, smoky monochrome atmosphere, selective red and magenta neon highlights, glamorous film lighting, flowing fabric',
    preview:
      'A cinematic neon noir scene in smoky near-monochrome greys lit by selective glowing red and magenta neon accents, glamorous film lighting and drifting haze',
  },
  {
    id: 'paper-cut',
    label: 'Paper cut',
    note: 'Layered cut-paper collage',
    tone: 'from-amber-200/60 via-rose-400/40 to-indigo-700/50',
    prompt:
      'Layered paper cut-out animation, stacked cut-paper shapes with crisp edges, soft drop shadows between layers, handcrafted collage, fluttering paper fabric',
    preview:
      'A layered paper-cut illustration built from stacked cut-paper shapes with crisp edges, soft shadows between the layers and a handcrafted collage feel',
  },
  {
    id: 'picture-book',
    label: 'Storybook',
    note: 'Whimsical illustrated page',
    tone: 'from-yellow-200/60 via-orange-300/40 to-sky-400/40',
    prompt:
      'Whimsical storybook illustration animation, soft painterly gouache textures, gentle warm palette, inviting lounge atmosphere, sweeping fabric',
    preview:
      'A whimsical storybook illustration in soft gouache and coloured ink, gentle rounded shapes, warm inviting colours and delicate painterly texture',
  },
  {
    id: 'oil',
    label: 'Oil painting',
    note: 'Thick gallery brushwork',
    tone: 'from-amber-500/50 via-red-800/40 to-stone-900',
    prompt:
      'Expressive oil painting animation, visible impasto brushwork, rich warm candlelit palette, thick painterly texture, sweeping coat movement',
    preview:
      'An expressive oil painting on canvas with thick impasto brushwork, rich warm glazes, visible canvas weave and gallery-quality chiaroscuro',
  },
  {
    id: 'nouveau',
    label: 'Art nouveau',
    note: 'Ornamental flowing curves',
    tone: 'from-lime-200/50 via-amber-400/40 to-emerald-800/50',
    prompt:
      'Art nouveau animation, flowing decorative whiplash lines, elegant ornamental curves, muted gold and sage palette, graceful sweeping fabric',
    preview:
      'An art nouveau illustration with flowing whiplash linework, ornamental floral arches, elegant curves and a muted gold, cream and sage palette',
  },
  {
    id: 'pop-poster',
    label: 'Pop poster',
    note: 'Bold color-block graphics',
    tone: 'from-yellow-300/70 via-pink-500/50 to-cyan-400/60',
    prompt:
      'Bold pop art animation, flat high-saturation colour blocks, thick black outlines, halftone dots, strong graphic shapes, energetic motion',
    preview:
      'Bold pop art graphic design with flat high-saturation colour blocks, thick black outlines, halftone dot shading and a punchy poster composition',
  },
  {
    id: 'clay',
    label: 'Claymation',
    note: 'Sculpted stop-motion clay',
    tone: 'from-orange-300/60 via-rose-400/40 to-teal-600/40',
    prompt:
      'Claymation stop-motion animation, sculpted plasticine figures with thumbprint texture, miniature handmade set, soft studio lighting, chunky fabric folds',
    preview:
      'A claymation stop-motion scene in which every figure, the dancer included, is sculpted from smooth plasticine with rounded simplified features, visible thumbprint texture, a miniature handmade set and soft studio lighting',
  },
  {
    id: 'pixel',
    label: 'Pixel art',
    note: '16-bit arcade sprites',
    tone: 'from-indigo-600/60 via-fuchsia-500/40 to-lime-300/50',
    prompt:
      '16-bit pixel art animation, chunky square pixels, limited retro console palette, dithered shading, crisp sprite motion',
    preview:
      'A 16-bit pixel art scene with chunky square pixels, a limited retro console palette, dithered shading and crisp sprite outlines',
  },
  {
    id: 'stained-glass',
    label: 'Stained glass',
    note: 'Leaded jewel-tone glass',
    tone: 'from-blue-700/60 via-red-600/50 to-amber-300/60',
    prompt:
      'Stained glass animation, jewel-toned glass panes joined by dark lead lines, glowing backlit colour, cathedral light, flowing fabric shapes',
    preview:
      'A stained glass window design with jewel-toned glass panes joined by dark lead lines, glowing backlit colour and radiant cathedral light',
  },
  {
    id: 'synthwave',
    label: 'Synthwave',
    note: 'Retro-future neon sunset',
    tone: 'from-purple-800/70 via-pink-500/50 to-orange-400/60',
    prompt:
      'Synthwave retro-futurist animation, magenta and cyan neon glow, chrome highlights, glowing grid floor, 1980s sunset palette, flowing fabric',
    preview:
      'A synthwave retro-futurist scene with magenta and cyan neon glow, chrome highlights, a glowing grid floor and a striped 1980s sunset gradient',
  },
  {
    id: 'dream-glow',
    label: 'Dream glow',
    note: 'Soft luminous haze',
    tone: 'from-pink-200/60 via-violet-300/40 to-sky-200/60',
    prompt:
      'Ethereal dreamlike animation, soft luminous bloom, pastel light leaks, floating sparkles, hazy glowing atmosphere, weightless flowing fabric',
    preview:
      'An ethereal dreamlike painting bathed in soft luminous bloom, pastel light leaks, floating sparkles and a hazy glowing atmosphere',
  },
  {
    id: 'pastel-anime',
    label: 'Pastel anime',
    note: 'Soft shoujo colour',
    tone: 'from-pink-300/50 via-sky-200/50 to-violet-200/50',
    prompt:
      'Pastel shoujo anime animation, soft candy colours, delicate linework, sparkling highlights, gentle airbrushed shading, flowing fabric',
    preview:
      'A pastel shoujo anime illustration with soft candy colours, delicate linework, sparkling highlights and gentle airbrushed shading',
  },
  {
    id: 'retro-print',
    label: 'Retro print',
    note: 'Two-ink risograph',
    tone: 'from-teal-500/50 via-orange-200/40 to-rose-500/50',
    prompt:
      'Retro risograph print animation, two-ink teal and coral overprint, grainy halftone texture, slightly misregistered layers, flat graphic shapes',
    preview:
      'A retro risograph print in two overprinted inks of teal and coral, grainy halftone texture, slightly misregistered layers and flat graphic shapes',
  },
  {
    id: 'gothic',
    label: 'Gothic romance',
    note: 'Candlelit velvet drama',
    tone: 'from-red-900/70 via-slate-950 to-purple-900/60',
    prompt:
      'Gothic romance animation, candlelit velvet shadows, deep crimson and black palette, ornate baroque details, dramatic sweeping fabric',
    preview:
      'A gothic romance painting with candlelit velvet shadows, a deep crimson and black palette, ornate baroque details and moonlit drama',
  },
  {
    id: 'charcoal',
    label: 'Charcoal sketch',
    note: 'Smudged gestural drawing',
    tone: 'from-stone-200/60 via-stone-500/40 to-stone-900',
    prompt:
      'Charcoal sketch animation, gestural smudged strokes, rough toothy paper, expressive construction lines, boiling hand-drawn motion',
    preview:
      'A gestural charcoal drawing with smudged strokes, rough toothy paper, expressive construction lines and white chalk highlights',
  },
  {
    id: 'colored-pencil',
    label: 'Colored pencil',
    note: 'Layered hand shading',
    tone: 'from-sky-300/50 via-yellow-200/40 to-rose-300/50',
    prompt:
      'Coloured pencil animation, layered hatched strokes, soft waxy texture, visible paper tooth, warm hand-drawn shading, flowing fabric',
    preview:
      'A coloured pencil drawing with layered hatched strokes, soft waxy texture, visible paper tooth and warm hand-blended shading',
  },
  {
    id: 'ukiyo-e',
    label: 'Ukiyo-e',
    note: 'Edo woodblock print',
    tone: 'from-blue-800/60 via-amber-100/40 to-red-600/40',
    prompt:
      'Ukiyo-e woodblock print animation, flat areas of colour, bold carved outlines, Prussian blue and vermilion palette, washi paper texture, flowing robes',
    preview:
      'An Edo-period ukiyo-e woodblock print with bold carved outlines, flat areas of Prussian blue and vermilion, gentle bokashi gradients and washi paper texture',
  },
  {
    id: 'screenprint',
    label: 'Screenprint',
    note: 'Flat spot-ink layers',
    tone: 'from-yellow-400/60 via-red-500/50 to-slate-900',
    prompt:
      'Hand-pulled screenprint animation, three flat spot inks in mustard red and black, bold shapes, visible ink texture, paper grain',
    preview:
      'A hand-pulled screenprint in three flat spot inks of mustard, red and black, bold simplified shapes, visible ink texture and paper grain',
  },
  {
    id: 'low-poly',
    label: 'Low poly 3D',
    note: 'Faceted geometric render',
    tone: 'from-cyan-300/50 via-violet-500/40 to-orange-300/50',
    prompt:
      'Low poly 3D animation, faceted geometric surfaces, flat-shaded triangles, soft gradient lighting, stylised angular fabric',
    preview:
      'A low poly 3D render with faceted geometric surfaces, flat-shaded triangles, soft gradient lighting and a stylised angular world',
  },
  {
    id: 'puppet',
    label: 'Puppet stage',
    note: 'Marionette theatre',
    tone: 'from-red-700/60 via-amber-500/40 to-yellow-200/40',
    prompt:
      'Marionette puppet theatre animation, carved wooden puppet with painted features, velvet curtains, warm footlights, miniature stage, fabric costumes',
    preview:
      'A marionette puppet theatre scene in which the dancer and the crowd are all carved wooden marionettes with painted faces, jointed limbs, visible strings rising from their hands and shoulders, red velvet curtains and warm footlights on a miniature stage',
  },
  {
    id: 'soft-pastel',
    label: 'Soft pastel',
    note: 'Chalky blended colour',
    tone: 'from-rose-200/60 via-amber-100/50 to-teal-200/50',
    prompt:
      'Soft pastel animation, chalky blended colour, velvety textured paper, gentle diffused light, delicate flowing fabric',
    preview:
      'A soft pastel drawing with chalky blended colour, velvety textured paper, gentle diffused light and delicate powdery edges',
  },
  {
    id: 'graphic-novel',
    label: 'Graphic novel',
    note: 'Heavy inks, muted colour',
    tone: 'from-slate-700/60 via-amber-700/40 to-slate-950',
    prompt:
      'Graphic novel animation, heavy brush inks, flat muted colour, dramatic cast shadows, gritty textured shading, flowing coat',
    preview:
      'A moody graphic novel illustration with heavy brush inks, flat muted colour, dramatic cast shadows and gritty textured shading',
  },
  {
    id: 'fantasy-epic',
    label: 'Fantasy epic',
    note: 'Paperback-cover painting',
    tone: 'from-emerald-700/60 via-amber-400/40 to-indigo-900/60',
    prompt:
      'Epic painted fantasy animation, heroic dramatic lighting, rich glazed oils, magical sparkles in the air, sweeping cloak-like fabric',
    preview:
      'An epic painted fantasy illustration in the tradition of classic paperback fantasy art, heroic dramatic lighting, rich glazed oils and magical sparkles drifting in the air',
  },
  {
    id: 'holographic',
    label: 'Holographic club',
    note: 'Iridescent chrome rave',
    tone: 'from-cyan-200/60 via-fuchsia-300/50 to-lime-200/50',
    prompt:
      'Holographic iridescent animation, rainbow chrome sheen, prismatic light refractions, laser beams through haze, shimmering fabric',
    preview:
      'An iridescent holographic scene with rainbow chrome sheen, prismatic light refractions, laser beams cutting through haze and shimmering pearlescent surfaces',
  },
  {
    id: 'cel-3d',
    label: 'Cel-shaded 3D',
    note: 'Toon-shaded render',
    tone: 'from-sky-400/50 via-indigo-400/40 to-orange-300/50',
    prompt:
      'Cel-shaded 3D animation, toon shading with hard light bands, bold ink outlines, saturated colour, smooth stylised fabric',
    preview:
      'A cel-shaded 3D render with toon shading in hard light bands, bold ink outlines, saturated colour and smooth stylised forms',
  },
  {
    id: 'fashion-sketch',
    label: 'Vintage fashion',
    note: 'Couture illustration',
    tone: 'from-rose-100/60 via-stone-300/40 to-stone-800/60',
    prompt:
      'Vintage fashion illustration animation, elongated elegant figure, loose ink and gouache washes, couture sketch energy, sweeping coat',
    preview:
      'A vintage couture fashion illustration with an elongated elegant figure, loose ink lines, gouache washes and plenty of cream paper left bare',
  },
] as const
export type RestyleStyleId = (typeof RESTYLE_STYLES)[number]['id']

export const RESTYLE_GRAB_BAG = {
  id: 'grab-bag',
  label: 'Grab bag',
  note: 'Rotates looks by motion window',
  tone: 'from-fuchsia-400/50 via-amber-300/40 to-cyan-400/50',
} as const
export type RestyleLookId = RestyleStyleId | typeof RESTYLE_GRAB_BAG.id
export type RestyleVariantMode = 'cycle' | 'shuffle_locked'
export const RESTYLE_GRAB_BAG_MIN_STYLES = 2
export const RESTYLE_GRAB_BAG_MAX_STYLES = RESTYLE_STYLES.length
export const RESTYLE_GRAB_BAG_DEFAULT_STYLES: RestyleStyleId[] = [
  'illustrious',
  'noir',
  'paper-cut',
  'watercolor',
]

export const RESTYLE_RENDER_FPS = 16
export const RESTYLE_RENDER_WINDOW_FRAMES = 65
export const RESTYLE_RENDER_WINDOW_STEP = 57

export type RestyleStyleWindow = {
  index: number
  sourceStartSec: number
  styleId: RestyleStyleId
}

export const RESTYLE_PREVIEW_SCENE =
  'A stylish young woman in a fitted black outfit dances in a nightclub, a dramatic white coat flung wide open from her shoulders, caught mid-spin in a joyful celebratory pose, warm hanging lights glowing overhead and a softly blurred nightlife crowd behind her'
export const RESTYLE_PREVIEW_ENGINE = 'krea2'
export const RESTYLE_PREVIEW_WIDTH = 896
export const RESTYLE_PREVIEW_HEIGHT = 1152
export const RESTYLE_PREVIEW_STEPS = 8
export const RESTYLE_PREVIEW_CFG = 1

export type RestylePreviewState =
  'MISSING' | 'QUEUED' | 'RENDERING' | 'READY' | 'FAILED'

export type RestylePreview = {
  styleId: RestyleStyleId
  state: RestylePreviewState
  artJobId: number | null
  artImageId: number | null
  imageUrl: string | null
  stale: boolean
  error: string | null
}

export function restylePreviewPrompt(styleId: RestyleStyleId): string {
  const style = RESTYLE_STYLES.find((entry) => entry.id === styleId)!
  return `${style.preview}. ${RESTYLE_PREVIEW_SCENE}.`
}

export const RESTYLE_DEFAULT_OVERWRITE_STRENGTH = 100
export function isRestyleOverwriteStrength(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100
}

export type RestyleQuality = '720p' | '1080p'

/**
 * Fast draft samples each motion window with the CausVid distillation LoRA:
 * 8 steps at cfg 1 instead of 20 at cfg 6, about a fifth of the GPU work.
 * Only a relay whose ComfyUI lists that LoRA may claim it.
 */
export type RestyleRenderSpeed = 'standard' | 'fast'

export function isRestyleRenderSpeed(
  value: unknown,
): value is RestyleRenderSpeed {
  return value === 'standard' || value === 'fast'
}
export type RestyleStatus =
  | 'STAGED'
  | 'PROCESSING'
  | 'REVIEW'
  | 'DONE'
  | 'FAILED'
  | 'PILOT_QUEUED'
  | 'PILOT_RUNNING'
  | 'PILOT_FAILED'
  | 'PILOT_BLOCKED'
  | 'FULL_QUEUED'
  | 'FULL_RUNNING'
  | 'FULL_FAILED'

export type RestyleSegment = {
  index: number
  sourceStartSec: number
  sourceEndSec: number
  keepFromSec: number
  keepToSec: number
}

export function isRestyleStyle(value: unknown): value is RestyleStyleId {
  return RESTYLE_STYLES.some((style) => style.id === value)
}

export function isRestyleLook(value: unknown): value is RestyleLookId {
  return value === RESTYLE_GRAB_BAG.id || isRestyleStyle(value)
}

export function restyleLookLabel(value: string): string {
  if (value === RESTYLE_GRAB_BAG.id) return RESTYLE_GRAB_BAG.label
  return RESTYLE_STYLES.find((entry) => entry.id === value)?.label || value
}

/** Distinct, known looks in the exact order they will rotate, or null. */
export function normalizeGrabBagStyles(
  value: unknown,
): RestyleStyleId[] | null {
  const list =
    typeof value === 'string'
      ? value.split(',').map((entry) => entry.trim())
      : value
  if (!Array.isArray(list)) return null
  if (
    list.length < RESTYLE_GRAB_BAG_MIN_STYLES ||
    list.length > RESTYLE_GRAB_BAG_MAX_STYLES ||
    !list.every(isRestyleStyle) ||
    new Set(list).size !== list.length
  ) {
    return null
  }
  return [...list]
}

export function shuffleRestyleStyles(
  styleIds: readonly RestyleStyleId[],
  random: () => number = Math.random,
): RestyleStyleId[] {
  const order = [...styleIds]
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap]!, order[index]!]
  }
  return order
}

/** Same window count as the VACE worker: 65-frame windows every 57 frames. */
export function restyleRenderWindowCount(durationSec: number): number {
  const frames = Math.max(1, Math.round(durationSec * RESTYLE_RENDER_FPS))
  return (
    Math.ceil(
      Math.max(0, frames - RESTYLE_RENDER_WINDOW_FRAMES) /
        RESTYLE_RENDER_WINDOW_STEP,
    ) + 1
  )
}

/**
 * Resolve one concrete look per motion window. The rotation is anchored to
 * SOURCE time, so a pilot at 2:38 shows the looks the full film will use at
 * 2:38, and every re-render or retry reproduces the identical sequence.
 */
export function planRestyleStyleSchedule(
  startSec: number,
  durationSec: number,
  styleIds: readonly RestyleStyleId[],
): RestyleStyleWindow[] {
  if (!styleIds.length) throw new Error('Grab bag needs at least one look.')
  const firstFrame = Math.round(startSec * RESTYLE_RENDER_FPS)
  const middle = Math.floor(RESTYLE_RENDER_WINDOW_FRAMES / 2)
  return Array.from(
    { length: restyleRenderWindowCount(durationSec) },
    (_, index) => {
      const frame = firstFrame + index * RESTYLE_RENDER_WINDOW_STEP
      const slot = Math.floor((frame + middle) / RESTYLE_RENDER_WINDOW_STEP)
      return {
        index,
        sourceStartSec: Number((frame / RESTYLE_RENDER_FPS).toFixed(3)),
        styleId: styleIds[slot % styleIds.length]!,
      }
    },
  )
}

/** Compact worker recipe: per-window ids plus each used look's prompt once. */
export function restyleScheduleRecipe(schedule: readonly RestyleStyleWindow[]) {
  const used = [...new Set(schedule.map((window) => window.styleId))]
  return {
    styleSchedule: schedule.map(({ index, styleId }) => ({ index, styleId })),
    stylePrompts: Object.fromEntries(
      used.map((id) => [
        id,
        RESTYLE_STYLES.find((entry) => entry.id === id)!.prompt,
      ]),
    ) as Record<string, string>,
  }
}

export function planRestyleSegments(
  durationSec: number,
  chunkSec = RESTYLE_CHUNK_SECONDS,
  overlapSec = RESTYLE_OVERLAP_SECONDS,
): RestyleSegment[] {
  if (
    !Number.isFinite(durationSec) ||
    durationSec <= 0 ||
    durationSec > RESTYLE_MAX_DURATION_SEC
  ) {
    throw new Error('Source duration is outside the supported range.')
  }
  if (!(chunkSec > overlapSec && overlapSec >= 0)) {
    throw new Error('Invalid segment overlap.')
  }
  const segments: RestyleSegment[] = []
  const step = chunkSec - overlapSec
  for (let index = 0; index * step < durationSec; index += 1) {
    const sourceStartSec = Number((index * step).toFixed(3))
    const sourceEndSec = Number(
      Math.min(durationSec, sourceStartSec + chunkSec).toFixed(3),
    )
    const keepFromSec = Number(
      (index === 0 ? sourceStartSec : sourceStartSec + overlapSec / 2).toFixed(
        3,
      ),
    )
    const keepToSec = Number(
      (sourceEndSec >= durationSec
        ? durationSec
        : sourceEndSec - overlapSec / 2
      ).toFixed(3),
    )
    segments.push({
      index,
      sourceStartSec,
      sourceEndSec,
      keepFromSec,
      keepToSec,
    })
    if (sourceEndSec >= durationSec) break
  }
  return segments
}

export function formatRestyleTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}
