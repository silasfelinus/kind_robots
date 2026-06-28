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

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
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
  const direct = cleanString(data.output_text)
  if (direct) return direct

  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' || part.text) {
        const text = cleanString(part.text)
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
      pageUrl: cleanString(body.pageUrl),
      pageTitle: cleanString(body.pageTitle),
      pageDescription: cleanString(body.pageDescription),
      nearestHeading: cleanString(body.nearestHeading),
      nearbyText: cleanString(body.nearbyText),
    },
    imageContext: {
      alt: cleanString(body.alt),
      label: cleanString(body.label),
      className: cleanString(body.imageClass),
    },
  }

  return JSON.stringify(context, null, 2)
}

export async function buildContextualArtPrompt(
  body: ArtPromptRequestBody,
  target: ArtPromptTarget,
  fallbackPrompt: string,
): Promise<string> {
  const explicit = cleanString(body.prompt)
  if (explicit) return explicit

  const token = openAiKey()
  if (!token) return fallbackPrompt

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAiModel(),
        instructions: [
          'You write production-ready image generation prompts for the Kind Robots website.',
          'Infer what missing web artwork should be from the asset path, page URL, image label, and page context.',
          'Return one vivid prompt only. No markdown, no JSON, no quotes.',
          'Always include the intended composition, mood, subject matter, style direction, and "no text".',
          'Respect the requested variant: icon is square and simple, card is 2:3 portrait, hero is 16:9 landscape.',
          'Avoid copyrighted characters, logos, brands, text in the image, and vague filler.',
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
        max_output_tokens: 260,
      }),
    })

    if (!res.ok) return fallbackPrompt

    const data = (await res.json()) as OpenAIResponse
    const generated = sanitizePrompt(responseText(data))

    return generated || fallbackPrompt
  } catch {
    return fallbackPrompt
  }
}
