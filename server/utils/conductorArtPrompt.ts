import { createError } from 'h3'
import {
  assessArtPrompt,
  cleanArtPrompt,
  isGenericArtLabel,
} from './artPromptQuality'
import {
  DEFAULT_ASSET_ART_STYLE,
  DEFAULT_CAST_ART_DIRECTION,
  DEFAULT_UNPEOPLED_ART_DIRECTION,
} from './artJobNormalization'

type ArtPromptTarget = {
  sourceUrl: string
  targetRepo: string
  targetRef: string
  imagePath: string
  publicPath: string
  variant: string
  size: string
  slug: string
}

type ArtPromptRequestBody = {
  pageUrl?: string
  alt?: string
  label?: string
  prompt?: string
  pageTitle?: string
  pageDescription?: string
  nearestHeading?: string
  nearbyText?: string
  imageClass?: string
}

type OpenAITextContent = {
  type?: string
  text?: string
}

type OpenAIOutputItem = {
  type?: string
  content?: OpenAITextContent[]
}

type OpenAIResponse = {
  output_text?: string
  output?: OpenAIOutputItem[]
}

const PROJECT_ASSET_VARIANTS = new Set(['icon', 'card', 'hero'])

function compact(value: string, maxLength = 1200): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1).trim()}…`
}

function openAiKey(): string {
  return String(process.env.OPENAI_API_KEY || '').trim()
}

function openAiModel(): string {
  return String(
    process.env.OPENAI_ART_PROMPT_MODEL ||
      process.env.OPENAI_MODEL ||
      'gpt-5.5-mini',
  ).trim()
}

function responseText(data: OpenAIResponse): string {
  const direct = cleanArtPrompt(data.output_text)
  if (direct) return direct

  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' || part.text) {
        const text = cleanArtPrompt(part.text)
        if (text) return text
      }
    }
  }

  return ''
}

function sanitizePrompt(value: string): string {
  return compact(
    value
      .replace(/^```[a-z]*\s*/i, '')
      .replace(/```$/i, '')
      .replace(/^prompt\s*:\s*/i, '')
      .trim(),
    1200,
  )
}

function meaningfulLabel(body: ArtPromptRequestBody): string {
  const label = cleanArtPrompt(body.alt || body.label)
  return isGenericArtLabel(label) ? '' : label
}

function promptContext(body: ArtPromptRequestBody, target: ArtPromptTarget): string {
  const context = {
    requestedAsset: {
      imagePath: target.imagePath,
      publicPath: target.publicPath,
      sourceUrl: target.sourceUrl,
      targetRepo: target.targetRepo,
      variant: target.variant,
      size: target.size,
      slug: target.slug,
    },
    pageContext: {
      pageUrl: cleanArtPrompt(body.pageUrl),
      pageTitle: cleanArtPrompt(body.pageTitle),
      pageDescription: cleanArtPrompt(body.pageDescription),
      nearestHeading: cleanArtPrompt(body.nearestHeading),
      nearbyText: cleanArtPrompt(body.nearbyText),
    },
    imageContext: {
      alt: meaningfulLabel(body),
      label: meaningfulLabel(body),
      className: cleanArtPrompt(body.imageClass),
      draftPrompt: sanitizePrompt(cleanArtPrompt(body.prompt)),
    },
  }

  return JSON.stringify(context, null, 2)
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function compositionFor(target: ArtPromptTarget): string {
  if (target.variant === 'icon') {
    return 'square premium app-icon composition with one bold, instantly readable silhouette'
  }
  if (target.variant === 'card') {
    return '2:3 portrait key-art composition with a clear foreground subject and layered depth'
  }
  if (target.variant === 'hero') {
    return '16:9 cinematic landscape composition with strong left-to-right visual flow'
  }
  return 'balanced website illustration with a clear focal subject and uncluttered background'
}

function promptWordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length
}

function shouldExpandProjectPrompt(
  prompt: string,
  target: ArtPromptTarget,
): boolean {
  if (!PROJECT_ASSET_VARIANTS.has(target.variant)) return false
  const minimumWords = target.variant === 'icon' ? 45 : 80
  return promptWordCount(prompt) < minimumWords
}

function promptLengthDirection(target: ArtPromptTarget): string {
  if (target.variant === 'icon') {
    return 'Use roughly 45 to 90 words: enough detail to control subject, silhouette, palette, materials, and lighting without overcrowding the icon.'
  }
  if (target.variant === 'card' || target.variant === 'hero') {
    return 'Use roughly 90 to 160 words with concrete visual direction for subject, secondary elements, spatial arrangement, camera or framing, environment, lighting, palette, materials, texture, mood, and exclusions.'
  }
  return 'Use enough concrete detail to make the visible result unambiguous.'
}

function contextualFallback(
  body: ArtPromptRequestBody,
  target: ArtPromptTarget,
  legacyFallback: string,
): string {
  const legacy = sanitizePrompt(legacyFallback)
  if (assessArtPrompt(legacy).useful) return legacy

  const label = meaningfulLabel(body)
  const slugTitle = titleFromSlug(target.slug)
  const subject = label || (!isGenericArtLabel(slugTitle) ? slugTitle : '')
  const context = compact(
    [
      cleanArtPrompt(body.nearestHeading),
      cleanArtPrompt(body.pageDescription),
      cleanArtPrompt(body.nearbyText),
      cleanArtPrompt(body.pageTitle),
    ]
      .filter(Boolean)
      .join('. '),
    420,
  )

  if (!subject || !context) return ''

  // No LLM ran, so nothing here knows whether the subject has people in it.
  // Default to the unpeopled direction: these are project, page, and product
  // assets, where a spurious crowd is the common failure and a missing one is
  // not. Prompts that want a cast get it from the LLM path below.
  const prompt = [
    `Create artwork for ${subject}.`,
    `Visible subject and scene context: ${context}.`,
    compositionFor(target),
    DEFAULT_ASSET_ART_STYLE,
    DEFAULT_UNPEOPLED_ART_DIRECTION,
    'no readable text, no logos, no watermark, no collage',
  ].join(' ')

  return assessArtPrompt(prompt).useful ? compact(prompt, 1200) : ''
}

function insufficientContext(): never {
  throw createError({
    statusCode: 422,
    message:
      'Missing image was not queued because its subject could not be identified. Add a meaningful alt/label or explicit prompt instead of an image id.',
  })
}

export async function buildContextualArtPrompt(
  body: ArtPromptRequestBody,
  target: ArtPromptTarget,
  fallbackPrompt: string,
): Promise<string> {
  const explicit = sanitizePrompt(cleanArtPrompt(body.prompt))
  if (explicit && !assessArtPrompt(explicit).useful) insufficientContext()

  const fallback = explicit || contextualFallback(body, target, fallbackPrompt)
  const expandExplicit = Boolean(
    explicit && shouldExpandProjectPrompt(explicit, target),
  )

  if (explicit && !expandExplicit) return explicit

  const token = openAiKey()
  if (!token) return fallback || insufficientContext()

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAiModel(),
        instructions: [
          'You write production-ready image generation prompts for a multidimensional asset-creation platform.',
          'Infer the actual visible subject from the asset path, page URL, meaningful image label, surrounding page context, and draft prompt.',
          'When a draft prompt is supplied, preserve its intended subject, objects, relationships, and exclusions. Enrich it; do not replace it with a different concept.',
          'Never treat a database id, filename number, or phrases such as “Image 529” as a subject.',
          'Never use “Kind Robots style”, “Kind Robots visual style”, “Kind Robots visual language”, or “cohesive visual style”; those phrases give an image model no visual information and often cause unwanted robots.',
          `Use this concrete default art direction when the surrounding context does not specify another medium: ${DEFAULT_ASSET_ART_STYLE}.`,
          'Robots are not a default mascot. Include a robot only when the requested subject, story, or surrounding page context explicitly requires one.',
          'For software tools, dashboards, and project assets, prefer a concrete object, environment, mechanism, or visual metaphor over a generic character portrait.',
          'Do not invent a person, human face, headshot, mascot, or humanoid focal character unless the supplied context explicitly calls for one.',
          // The image model cannot evaluate "only when the scene calls for it";
          // you can. Decide here, and emit exactly one of these two clauses.
          'Decide whether the finished image contains people at all, then commit to it in the prompt you return.',
          `If people belong in the frame, include this clause verbatim: ${DEFAULT_CAST_ART_DIRECTION}.`,
          `If the subject is an object, product, tool, mechanism, landscape, or empty interior, include this clause verbatim instead: ${DEFAULT_UNPEOPLED_ART_DIRECTION}.`,
          'Never include both clauses. Never include the casting clause for an inanimate subject — image models read it as a literal instruction to paint a crowd, which erases the requested object.',
          'Return one vivid prompt only. No markdown, no JSON, no quotes.',
          'Describe the visible focal subject, supporting elements, action or state, setting, spatial arrangement, composition, camera or framing, lighting, color palette, materials or texture, mood, and concrete rendering style.',
          promptLengthDirection(target),
          'Respect the requested variant: icon is square and simple, card is 2:3 portrait, hero is 16:9 landscape.',
          'Avoid copyrighted characters, licensed style names, logos, brands, text in the image, collages, and vague filler.',
          'End with no readable text, no logo, no watermark, no collage.',
          'If the supplied context does not identify a real subject, return exactly INSUFFICIENT_CONTEXT.',
        ].join(' '),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Create or expand the best image prompt for this asset.\n\n${promptContext(body, target)}`,
              },
            ],
          },
        ],
        max_output_tokens: 500,
      }),
    })
  } catch {
    return fallback || insufficientContext()
  }

  if (!res.ok) return fallback || insufficientContext()

  const data = (await res.json()) as OpenAIResponse
  const generated = sanitizePrompt(responseText(data))
  if (!generated || generated === 'INSUFFICIENT_CONTEXT') {
    return fallback || insufficientContext()
  }

  return assessArtPrompt(generated).useful
    ? generated
    : fallback || insufficientContext()
}
