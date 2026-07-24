import { createError } from 'h3'
import {
  assessArtPrompt,
  cleanArtPrompt,
  isGenericArtLabel,
} from './artPromptQuality'

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
    900,
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

  const prompt = [
    `Create artwork for ${subject}.`,
    `Visible subject and scene context: ${context}.`,
    compositionFor(target),
    'modern western animation for young adults, crisp expressive linework, saturated but balanced color, readable silhouettes, tactile environmental detail, intentional cinematic lighting',
    'no readable text, no logos, no watermark, no collage',
  ].join(' ')

  return assessArtPrompt(prompt).useful ? compact(prompt, 900) : ''
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
  if (explicit) {
    return assessArtPrompt(explicit).useful ? explicit : insufficientContext()
  }

  const fallback = contextualFallback(body, target, fallbackPrompt)
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
          'You write production-ready image generation prompts for the Kind Robots website.',
          'Infer the actual visible subject from the asset path, page URL, meaningful image label, and surrounding page context.',
          'Never treat a database id, filename number, or phrases such as “Image 529” as a subject.',
          'Never say “Kind Robots style” or “cohesive visual style”; those phrases give an image model no visual information.',
          'Use concrete art direction instead: modern western animation for young adults, crisp expressive linework, saturated color, readable silhouettes, and intentional cinematic lighting when suitable.',
          'Return one vivid prompt only. No markdown, no JSON, no quotes.',
          'Always describe the visible subject, action or pose, setting, composition, mood, and concrete rendering style, ending with no readable text.',
          'Respect the requested variant: icon is square and simple, card is 2:3 portrait, hero is 16:9 landscape.',
          'Avoid copyrighted characters, logos, brands, text in the image, collages, and vague filler.',
          'If the supplied context does not identify a real subject, return exactly INSUFFICIENT_CONTEXT.',
        ].join(' '),
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Create the best image prompt for this missing asset.\n\n${promptContext(body, target)}`,
              },
            ],
          },
        ],
        max_output_tokens: 300,
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
