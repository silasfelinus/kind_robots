// /server/api/showcase/detail.get.ts
//
// One showcase card, expanded.
//
// Silas, 2026-08-29: "Whenever I click on one of the new objects, I want it to
// expand to tell me about it, pertinent details, basically what should happen
// after clicking gallery items, with clicking outside the container returning
// to the homepage. This is the interstitial, not quite edit, not quite interact
// select, that leads us to those options, plus review."
//
// WHY A SECOND ENDPOINT AND NOT A FATTER home.get.ts. The home payload draws
// forty-odd tiles; adding every object's backstory, effect text and prompt to it
// would multiply the page's first byte by the number of things nobody clicked.
// This is fetched on the click, for exactly the one record that was clicked.
//
// PUBLIC-SAFE BY CONSTRUCTION, on the same terms as home.get.ts: every read is
// pinned to isPublic + isActive + isMature:false, there is no auth path, and the
// per-kind field lists below are allowlists rather than `select: undefined`.
// `Scenario.secretNotes` is the reason that distinction is written down --
// it is a field the interstitial must never surface, and an allowlist cannot
// grow one by accident the way a spread of the whole row can.

import type { H3Event } from 'h3'
import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import type { Prisma } from '~/prisma/generated/prisma/client'
import type { ShowcaseArt, ShowcaseKind } from '@/utils/homeShowcase'

/** Public showcase gate, applied to every table this endpoint reads. */
const PUBLIC = {
  isActive: true,
  isPublic: true,
  isMature: false,
} as const

/**
 * The art columns kr-art-plate reads.
 *
 * Only `imagePath` is still an entity column. The entity-art slot collapse
 * (1e4ca2a, 2026-09-06) dropped cardPath/heroPath/iconPath from Dream,
 * Character, Bot, Reward, Scenario and Facet -- one primary render per object,
 * cropped per frame on the ArtImage it points at -- so the crops are read
 * through that relation now. Selecting them as entity columns raised
 * "Unknown field `cardPath` for select statement on model `Dream`", a Prisma
 * VALIDATION error that answered 400 for all six kinds while `art` and
 * `project` kept working (2026-09-07).
 */
const ENTITY_ART_COLUMNS = { imagePath: true } as const

/** Where the crops live now: the object's primary render. */
const PRIMARY_RENDER = {
  ArtImage: {
    select: {
      imagePath: true,
      cardPath: true,
      heroPath: true,
      iconPath: true,
      fileType: true,
    },
  },
} as const

const ENTITY_ART = { ...ENTITY_ART_COLUMNS, ...PRIMARY_RENDER } as const

/** Project is the one model that kept its own four slots. */
const PROJECT_ART_COLUMNS = {
  ...ENTITY_ART_COLUMNS,
  cardPath: true,
  heroPath: true,
  iconPath: true,
} as const

const PROJECT_ART = { ...PROJECT_ART_COLUMNS, ...PRIMARY_RENDER } as const

/**
 * Every column above must exist on every model that selects it.
 *
 * `satisfies Prisma.DreamSelect` CANNOT express this: the generated Select
 * types are wrapped in the client's `GetSelect<>` and carry an index signature
 * for client extensions, so they accept any key at all
 * (`'madeUpField' extends keyof Prisma.DreamSelect` is true). `SelectScalar` is
 * the plain columns-only form with no index signature, and is checked one model
 * at a time -- an intersection would accept a field present on only ONE member,
 * which is exactly how Project's surviving cardPath vouched for six models that
 * had lost it. Each entry is `never` while valid and resolves to the offending
 * field name when not, so the assignment fails naming the field.
 */
type UnknownOn<Keys, Model> = Exclude<Keys, keyof Model>
type EntityArtColumn = keyof typeof ENTITY_ART_COLUMNS

const _artColumnsAreValid: [never, never, never, never, never, never, never] =
  [] as unknown as [
    UnknownOn<EntityArtColumn, Prisma.DreamSelectScalar>,
    UnknownOn<EntityArtColumn, Prisma.CharacterSelectScalar>,
    UnknownOn<EntityArtColumn, Prisma.BotSelectScalar>,
    UnknownOn<EntityArtColumn, Prisma.RewardSelectScalar>,
    UnknownOn<EntityArtColumn, Prisma.ScenarioSelectScalar>,
    UnknownOn<EntityArtColumn, Prisma.FacetSelectScalar>,
    UnknownOn<keyof typeof PROJECT_ART_COLUMNS, Prisma.ProjectSelectScalar>,
  ]
void _artColumnsAreValid

export type ShowcaseFact = { label: string; value: string }

export type ShowcaseDetail = {
  kind: ShowcaseKind
  id: number
  title: string
  subtitle: string | null
  /** The long text: a backstory, a pitch, an effect. Rendered as prose. */
  body: string | null
  theme: string | null
  art: ShowcaseArt
  /** Short labelled attributes, rendered as a definition grid. */
  facts: ShowcaseFact[]
  createdAt: string
  /** Where "open it properly" goes -- the manager page for this record. */
  href: string
}

const KINDS = new Set<ShowcaseKind>([
  'art',
  'animation',
  'dream',
  'character',
  'bot',
  'reward',
  'scenario',
  'facet',
  'project',
])

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

/** Only facts that actually have a value; an empty grid cell says nothing. */
function facts(entries: Array<[string, unknown]>): ShowcaseFact[] {
  const out: ShowcaseFact[] = []
  for (const [label, raw] of entries) {
    // Numeric columns (steps, level, seed) arrive as number or bigint and would
    // otherwise be dropped by text()'s string check.
    const value =
      typeof raw === 'bigint' ||
      (typeof raw === 'number' && Number.isFinite(raw))
        ? String(raw)
        : text(raw)
    if (value)
      out.push({
        label,
        value: value.length > 240 ? `${value.slice(0, 237)}…` : value,
      })
  }
  return out
}

/**
 * The object's own art columns, filled in per field from its primary render.
 *
 * Merged rather than "own or else the relation": since the slot collapse the
 * six non-Project entities carry only `imagePath` themselves and their crops
 * live on the ArtImage they point at, so both halves are needed to describe one
 * plate. Project's own values simply win each field, and an ArtImage row (the
 * `art`/`animation` kinds) has no relation to merge and is unaffected.
 */
function art(
  row: Partial<Record<keyof ShowcaseArt, string | null>> & {
    ArtImage?: Partial<Record<keyof ShowcaseArt, string | null>> | null
  },
): ShowcaseArt {
  const primary = row.ArtImage
  return {
    imagePath: row.imagePath || primary?.imagePath || null,
    cardPath: row.cardPath || primary?.cardPath || null,
    heroPath: row.heroPath || primary?.heroPath || null,
    iconPath: row.iconPath || primary?.iconPath || null,
    fileType: row.fileType || primary?.fileType || null,
  }
}

function iso(value: Date | null | undefined): string {
  return (value ?? new Date()).toISOString()
}

/**
 * The response envelope, matching home.get.ts rather than returning the record
 * bare.
 *
 * Two reasons. It keeps both showcase endpoints on the one shape every store
 * here consumes through `performFetch`, and returning bare made Nuxt's typed
 * `$fetch` overload resolution blow up on the call site with TS2589 "type
 * instantiation is excessively deep" -- the envelope plus performFetch avoids
 * inventing a second convention to work around a compiler limit.
 */
export type ShowcaseDetailResponse = {
  success: boolean
  message: string
  data: ShowcaseDetail | null
}

async function loadDetail(event: H3Event): Promise<ShowcaseDetail> {
  const query = getQuery(event)
  const kind = String(query.kind || '').trim() as ShowcaseKind
  const id = Number(query.id)

  if (!KINDS.has(kind)) {
    throw createError({ statusCode: 400, statusMessage: 'unknown kind' })
  }
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  // Public and immutable enough to cache briefly at the edge: the same card
  // is opened repeatedly while browsing the shelves.
  setHeader(event, 'Cache-Control', 'public, max-age=60')

  const missing = () =>
    createError({ statusCode: 404, statusMessage: 'not found' })

  if (kind === 'art' || kind === 'animation') {
    const row = await prisma.artImage.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        promptString: true,
        negativePrompt: true,
        checkpoint: true,
        sampler: true,
        steps: true,
        seed: true,
        cfg: true,
        designer: true,
        genres: true,
        fileType: true,
        imagePath: true,
        cardPath: true,
        heroPath: true,
        iconPath: true,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.promptString)?.slice(0, 80) || `Render #${row.id}`,
      subtitle: text(row.checkpoint),
      body: text(row.promptString),
      // ArtImage has no `theme` column -- see the note in home-rail.vue about
      // what an id-derived theme did to letterboxed renders.
      theme: null,
      art: {
        ...art(row),
        // The canonical URL: 302s to imagePath when set, serves the stored
        // bytes when the render has not been written to disk yet.
        imagePath: `/api/art/images/${row.id}/file`,
      },
      facts: facts([
        ['Checkpoint', row.checkpoint],
        ['Sampler', row.sampler],
        ['Steps', row.steps],
        ['CFG', row.cfg],
        ['Seed', row.seed],
        ['Designer', row.designer],
        ['Genres', row.genres],
        ['Negative', row.negativePrompt],
      ]),
      createdAt: iso(row.createdAt),
      href: `/art?art=${row.id}`,
    }
  }

  if (kind === 'dream') {
    const row = await prisma.dream.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        title: true,
        slug: true,
        description: true,
        pitch: true,
        flavorText: true,
        dreamType: true,
        designer: true,
        examples: true,
        theme: true,
        ...ENTITY_ART,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.title) || 'Untitled dream',
      subtitle: text(row.flavorText),
      body: text(row.description) || text(row.pitch),
      theme: row.theme,
      art: art(row),
      facts: facts([
        ['Type', row.dreamType],
        ['Designer', row.designer],
        ['Examples', row.examples],
      ]),
      createdAt: iso(row.createdAt),
      href: `/dreams?dream=${row.id}`,
    }
  }

  if (kind === 'character') {
    const row = await prisma.character.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        name: true,
        honorific: true,
        title: true,
        backstory: true,
        personality: true,
        drive: true,
        quirks: true,
        genre: true,
        species: true,
        class: true,
        alignment: true,
        role: true,
        level: true,
        designer: true,
        theme: true,
        ...ENTITY_ART,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.name) || 'Unnamed character',
      subtitle: text(row.title) || text(row.honorific) || text(row.role),
      body: text(row.backstory) || text(row.personality),
      theme: row.theme,
      art: art(row),
      facts: facts([
        ['Species', row.species],
        ['Class', row.class],
        ['Alignment', row.alignment],
        ['Genre', row.genre],
        ['Level', row.level],
        ['Drive', row.drive],
        ['Quirks', row.quirks],
        ['Designer', row.designer],
      ]),
      createdAt: iso(row.createdAt),
      href: `/characters?characterId=${row.id}`,
    }
  }

  if (kind === 'bot') {
    const row = await prisma.bot.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        name: true,
        subtitle: true,
        description: true,
        botIntro: true,
        tagline: true,
        personality: true,
        BotType: true,
        narrativeVoice: true,
        designer: true,
        theme: true,
        ...ENTITY_ART,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.name) || 'Unnamed bot',
      subtitle: text(row.subtitle) || text(row.tagline),
      body: text(row.description) || text(row.botIntro),
      theme: row.theme,
      art: art(row),
      facts: facts([
        ['Type', row.BotType],
        ['Personality', row.personality],
        ['Voice', row.narrativeVoice],
        ['Designer', row.designer],
      ]),
      createdAt: iso(row.createdAt),
      href: `/bots?botId=${row.id}`,
    }
  }

  if (kind === 'reward') {
    const row = await prisma.reward.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        name: true,
        description: true,
        effect: true,
        flavorText: true,
        rewardType: true,
        rarity: true,
        collection: true,
        theme: true,
        ...ENTITY_ART,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.name) || 'Unnamed reward',
      subtitle: text(row.flavorText),
      body: text(row.description) || text(row.effect),
      theme: row.theme,
      art: art(row),
      facts: facts([
        ['Kind', row.rewardType],
        ['Rarity', row.rarity],
        ['Collection', row.collection],
        ['Effect', row.effect],
      ]),
      createdAt: iso(row.createdAt),
      href: `/rewards?reward=${row.id}`,
    }
  }

  if (kind === 'scenario') {
    const row = await prisma.scenario.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        title: true,
        description: true,
        locations: true,
        genres: true,
        inspirations: true,
        difficulty: true,
        tier: true,
        cast: true,
        outputType: true,
        theme: true,
        // secretNotes is deliberately NOT selected. See the header note.
        ...ENTITY_ART,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.title) || 'Untitled scenario',
      subtitle: text(row.locations),
      body: text(row.description),
      theme: row.theme,
      art: art(row),
      facts: facts([
        ['Difficulty', row.difficulty],
        ['Tier', row.tier],
        ['Genres', row.genres],
        ['Cast', row.cast],
        ['Output', row.outputType],
        ['Inspirations', row.inspirations],
      ]),
      createdAt: iso(row.createdAt),
      href: `/stories?scenario=${row.id}`,
    }
  }

  if (kind === 'facet') {
    const row = await prisma.facet.findFirst({
      where: { id, ...PUBLIC },
      select: {
        id: true,
        createdAt: true,
        title: true,
        slug: true,
        description: true,
        flavorText: true,
        examples: true,
        designer: true,
        theme: true,
        ...ENTITY_ART,
      },
    })
    if (!row) throw missing()

    return {
      kind,
      id: row.id,
      title: text(row.title) || 'Untitled facet',
      subtitle: text(row.flavorText),
      body: text(row.description),
      theme: row.theme,
      art: art(row),
      facts: facts([
        ['Examples', row.examples],
        ['Designer', row.designer],
      ]),
      createdAt: iso(row.createdAt),
      href: row.slug
        ? `/facets?facet=${encodeURIComponent(row.slug)}`
        : '/facets',
    }
  }

  const row = await prisma.project.findFirst({
    where: { id, ...PUBLIC },
    select: {
      id: true,
      createdAt: true,
      title: true,
      slug: true,
      description: true,
      pitch: true,
      goal: true,
      flavorText: true,
      status: true,
      priority: true,
      conductorSlug: true,
      liveUrl: true,
      repoUrl: true,
      ...PROJECT_ART,
    },
  })
  if (!row) throw missing()

  return {
    kind: 'project',
    id: row.id,
    title: text(row.title) || 'Untitled project',
    subtitle: text(row.flavorText) || text(row.goal),
    body: text(row.description) || text(row.pitch),
    theme: null,
    art: art(row),
    facts: facts([
      ['Status', row.status],
      ['Priority', row.priority],
      ['Goal', row.goal],
      ['Conductor', row.conductorSlug],
      ['Live', row.liveUrl],
      ['Repo', row.repoUrl],
    ]),
    createdAt: iso(row.createdAt),
    href: row.conductorSlug
      ? `/conductor?project=${encodeURIComponent(row.conductorSlug)}`
      : '/conductor',
  }
}

export default defineEventHandler(
  async (event): Promise<ShowcaseDetailResponse> => {
    try {
      return {
        success: true,
        message: 'Showcase detail loaded successfully.',
        data: await loadDetail(event),
      }
    } catch (error) {
      const handled = errorHandler(error)
      const statusCode = handled.statusCode || 500
      event.node.res.statusCode = statusCode

      return {
        success: false,
        // Fixed text, never the caught message: a Prisma failure here would
        // otherwise print a query dump onto the front page.
        message:
          statusCode === 404
            ? "That item isn't available."
            : "Couldn't load that item just now.",
        data: null,
      }
    }
  },
)
