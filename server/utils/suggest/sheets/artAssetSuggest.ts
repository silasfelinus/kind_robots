// /server/utils/suggest/sheets/artAssetSuggest.ts
import type { SuggestBody, SuggestSheet } from '../suggestTypes'

function compact(value: unknown, maxLength = 700): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

function pushLine(lines: string[], label: string, value: unknown): void {
  if (Array.isArray(value)) {
    const text = value.map((entry) => compact(entry, 180)).filter(Boolean).join(' | ')
    if (text) lines.push(`${label}: ${text}`)
    return
  }

  if (value && typeof value === 'object') {
    const text = compact(JSON.stringify(value), 900)
    if (text) lines.push(`${label}: ${text}`)
    return
  }

  const text = compact(value)
  if (text) lines.push(`${label}: ${text}`)
}

function buildArtContext(context: Record<string, unknown>): string[] {
  const lines: string[] = []
  const asset =
    context.asset && typeof context.asset === 'object'
      ? (context.asset as Record<string, unknown>)
      : {}
  const project =
    context.project && typeof context.project === 'object'
      ? (context.project as Record<string, unknown>)
      : {}
  const page =
    context.page && typeof context.page === 'object'
      ? (context.page as Record<string, unknown>)
      : {}

  pushLine(lines, 'Requested subject', context.subject)
  pushLine(lines, 'Image purpose', context.purpose)
  pushLine(lines, 'Asset source', asset.source)
  pushLine(lines, 'Asset role', asset.role)
  pushLine(lines, 'Variant', asset.variant)
  pushLine(lines, 'Dimensions', asset.size)
  pushLine(lines, 'Image class', asset.className)
  pushLine(lines, 'Asset description', asset.description)
  pushLine(lines, 'Preferred art direction', asset.preferredStyle)
  pushLine(lines, 'Explicit exclusions', asset.exclusions)

  pushLine(lines, 'Project title', project.title)
  pushLine(lines, 'Project slug', project.slug)
  pushLine(lines, 'Project kind', project.kind)
  pushLine(lines, 'Project goal', project.goal)
  pushLine(lines, 'Project description', project.description)
  pushLine(lines, 'Project flavor', project.flavorText)
  pushLine(lines, 'Project notes', project.notes)
  pushLine(lines, 'Major milestones', project.milestones)
  pushLine(lines, 'Representative tasks', project.tasks)

  pushLine(lines, 'Page title', page.title)
  pushLine(lines, 'Page description', page.description)
  pushLine(lines, 'Nearest heading', page.heading)
  pushLine(lines, 'Local component text', page.localText)
  pushLine(lines, 'Page URL', page.url)

  return lines
}

function artInstruction(body: SuggestBody): string {
  const context = body.context ?? {}
  const asset =
    context.asset && typeof context.asset === 'object'
      ? (context.asset as Record<string, unknown>)
      : {}
  const variant = String(asset.variant || '').toLowerCase()

  if (variant === 'icon') {
    return 'Write one production-ready image-generation prompt for a square application icon. Use one immediately readable object, mechanism, or visual metaphor with a strong silhouette. Include concrete palette, material, lighting, depth, and rendering details in roughly 55–95 words.'
  }

  if (variant === 'card') {
    return 'Write one production-ready image-generation prompt for a 2:3 portrait project card. Establish a clear foreground focal subject, supporting midground elements, atmospheric background, directional lighting, palette, materials, texture, and mood in roughly 100–170 words.'
  }

  if (variant === 'hero') {
    return 'Write one production-ready image-generation prompt for a 16:9 landscape hero. Build a specific visual scene with strong left-to-right flow, layered depth, useful negative space, environment, lighting, palette, materials, texture, and mood in roughly 100–170 words.'
  }

  return 'Write one production-ready image-generation prompt for this missing frontend asset. Make the visible subject, setting, composition, lighting, palette, materials, texture, and mood unambiguous.'
}

const artAssetSuggest: SuggestSheet = {
  builder: 'art-asset',
  label: 'Missing Art Asset',
  systemPrompt: `You are the production art director for Kind Robots. You turn structured frontend and project context into a single image-generation prompt for a missing visual asset.
Rules:
- Ground the prompt in the supplied project goal, description, notes, milestones, representative tasks, local component text, asset role, and requested variant.
- Identify what the project actually does, then choose a concrete visible subject or visual metaphor that communicates that function.
- For software projects, prefer tools, interfaces, workspaces, machines, diagrams, environments, or symbolic objects. Do not invent a person, face, portrait, mascot, or humanoid focal character unless the supplied context explicitly requires one.
- Do not default to robots merely because the site is called Kind Robots.
- Describe the focal subject, supporting elements, action or relationship, environment, spatial arrangement, composition or camera, lighting, palette, materials, texture, mood, and concrete rendering medium.
- Respect the requested format: icon is square and simple; card is 2:3 portrait with layered depth; hero is 16:9 landscape with visual flow and negative space.
- Never use vague phrases such as “Kind Robots style,” “cohesive visual style,” or “make it cinematic” without concrete visual details.
- Avoid copyrighted characters, licensed artist styles, readable text, logos, watermarks, and collages.
- Return exactly one prompt paragraph with no label, preamble, markdown, or quotation marks.
- End with: no readable text, no logo, no watermark, no collage.`,
  fieldPrompts: {
    prompt:
      'Create the final image-generation prompt for this missing frontend asset using all relevant supplied context.',
  },
  buildInstruction: artInstruction,
  buildContext: buildArtContext,
}

export default artAssetSuggest
