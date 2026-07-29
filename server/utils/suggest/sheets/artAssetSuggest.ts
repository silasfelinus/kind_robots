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

function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function buildArtContext(context: Record<string, unknown>): string[] {
  const lines: string[] = []
  const asset =
    context.asset && typeof context.asset === 'object'
      ? (context.asset as Record<string, unknown>)
      : {}
  const entity =
    context.entity && typeof context.entity === 'object'
      ? (context.entity as Record<string, unknown>)
      : {}
  const entityFields =
    entity.fields && typeof entity.fields === 'object'
      ? (entity.fields as Record<string, unknown>)
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

  pushLine(lines, 'Canonical model', entity.modelType)
  pushLine(lines, 'Canonical record id', entity.id)
  pushLine(lines, 'Canonical record slug', entity.slug)
  pushLine(lines, 'Canonical record title', entity.title)
  for (const [key, value] of Object.entries(entityFields)) {
    pushLine(lines, humanize(key), value)
  }

  // Project roadmap data is supplemental to the canonical Project row.
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

function modelType(body: SuggestBody): string {
  const entity =
    body.context?.entity && typeof body.context.entity === 'object'
      ? (body.context.entity as Record<string, unknown>)
      : {}
  return String(entity.modelType || '').toLowerCase()
}

function artInstruction(body: SuggestBody): string {
  const context = body.context ?? {}
  const asset =
    context.asset && typeof context.asset === 'object'
      ? (context.asset as Record<string, unknown>)
      : {}
  const variant = String(asset.variant || '').toLowerCase()
  const type = modelType(body)
  const isPersona = type === 'bot' || type === 'character'

  if (variant === 'icon') {
    return isPersona
      ? 'Write one production-ready image-generation prompt for a square avatar icon of the canonical Bot or Character. Preserve the supplied identity, species, presentation, role, personality, and visual canon. Use a simple bust, head-and-shoulders pose, or emblematic silhouette with concrete palette, materials, lighting, expression, and rendering details in roughly 55–95 words.'
      : 'Write one production-ready image-generation prompt for a square application or gallery icon. Use one immediately readable object, mechanism, symbol, environment fragment, or visual metaphor with a strong silhouette. Include concrete palette, material, lighting, depth, and rendering details in roughly 55–95 words.'
  }

  if (variant === 'card') {
    return 'Write one production-ready image-generation prompt for a 2:3 portrait gallery card. Establish a clear foreground focal subject, supporting midground elements, atmospheric background, directional lighting, palette, materials, texture, and mood in roughly 100–170 words.'
  }

  if (variant === 'hero') {
    return 'Write one production-ready image-generation prompt for a 16:9 landscape hero. Build a specific visual scene with strong left-to-right flow, layered depth, useful negative space, environment, lighting, palette, materials, texture, and mood in roughly 100–170 words.'
  }

  return 'Write one production-ready image-generation prompt for this gallery or frontend asset. Make the visible subject, setting, composition, lighting, palette, materials, texture, mood, and rendering medium unambiguous.'
}

const artAssetSuggest: SuggestSheet = {
  builder: 'art-asset',
  label: 'Model-aware Art Asset',
  systemPrompt: `You are the production art director for Kind Robots. You turn a canonical Project, Bot, Character, Dream, Scenario, Reward, or Facet record plus asset context into one image-generation prompt.
Rules:
- Treat canonical model data as the source of truth. Supporting page text can clarify the asset role but must not override the record.
- Use every relevant visual or thematic field, while ignoring administrative metadata that does not affect the image.
- Projects: communicate what the project actually does through tools, interfaces, workspaces, machines, environments, diagrams, or symbolic objects. Do not invent a person, face, mascot, or humanoid focal character unless the project context explicitly requires one.
- Bots and Characters: depict the canonical individual. Preserve species, class or role, gender or presentation, personality, quirks, backstory, theme, and existing art direction. Do not replace them with a generic robot or generic human.
- Dreams and Scenarios: depict a specific world, event, location, conflict, or invitation grounded in description, pitch, examples, cast, genres, locations, and inspirations. Prefer a scene over an unrelated portrait.
- Rewards: make the reward itself and its effect visually legible; rarity, collection, flavor, and reward type should influence materials, scale, atmosphere, and presentation.
- Facets: create a strong canonical visual symbol or scene that expresses the facet kind, description, flavor, and examples without relying on readable labels.
- Do not default to robots merely because the site is called Kind Robots.
- Describe the focal subject, supporting elements, action or relationship, environment, spatial arrangement, composition or camera, lighting, palette, materials, texture, mood, and concrete rendering medium.
- Respect the requested format: icon is square and simple; card is 2:3 portrait with layered depth; hero is 16:9 landscape with visual flow and negative space.
- When an existing artPrompt is supplied in canonical data or as the value to refine, preserve its intended subject and constraints while enriching it with the rest of the record.
- Never use vague phrases such as “Kind Robots style,” “cohesive visual style,” or “make it cinematic” without concrete visual details.
- Avoid copyrighted characters, licensed artist styles, readable text, logos, watermarks, and collages.
- Return exactly one prompt paragraph with no label, preamble, markdown, or quotation marks.
- End with: no readable text, no logo, no watermark, no collage.`,
  fieldPrompts: {
    prompt:
      'Create the final image-generation prompt for this model-backed asset using all relevant canonical and supporting context.',
  },
  buildInstruction: artInstruction,
  buildContext: buildArtContext,
}

export default artAssetSuggest
