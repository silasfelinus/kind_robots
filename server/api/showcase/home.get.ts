// /server/api/showcase/home.get.ts
//
// Everything the home page shows, in one bounded round trip.
//
// WHY A DEDICATED ENDPOINT. The per-object list routes were built for their own
// galleries and answer a different question: /api/characters returns the whole
// viewable catalog ordered by name, /api/art/image returns every accessible
// row. A home page asking eight of those for "the newest six" would ship tens
// of thousands of records to render forty-eight cards. This asks each table for
// exactly the slice the rails draw, with only the fields kr-art-plate and the
// card body read.
//
// PUBLIC-SAFE BY CONSTRUCTION. This is the first thing a stranger sees, so
// every query is pinned to isPublic + isActive + isMature:false and there is no
// auth path at all -- no token means no way to widen it, and a logged-in
// admin's private work never leaks onto the front page by accident. Anything
// personal (your drafts, your queue) belongs on /dashboard, not here.

import { defineEventHandler, setHeader } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { PROJECT_PLACEMENTS, placementLiveUrl } from '@/utils/projectPlacements'
import type {
  HomeShowcase,
  ShowcaseArt,
  ShowcaseCard,
  ShowcaseHero,
  ShowcaseKind,
} from '@/utils/homeShowcase'

const RAIL_LIMIT = 12
const ART_RAIL_LIMIT = 18
const ANIMATION_RAIL_LIMIT = 8
const PROJECT_LIMIT = 6

/**
 * How many recent dream candidates to inspect before giving up on finding one
 * whose art is finished. Silas, 2026-08-28: "I want the dream, but there is a
 * problem, it isn't always ready with art. So instead of Today's dream, it
 * needs to be the most recent dream that has full art."
 *
 * The art queue runs a day or more behind the dream authoring on a backlog (see
 * conductor RENDER-BACKLOG.md), so "today's" dream routinely has a title, a
 * cast, and no pictures. Twenty candidates is roughly three weeks of daily
 * dreams -- deep enough to skip a bad stretch, shallow enough to stay one
 * indexed query.
 */
const HERO_CANDIDATE_DEPTH = 20

/** A hero worth the top of the page shows its cast, not just its own plate. */
const HERO_MIN_CAST_WITH_ART = 3

/** Public showcase gate, applied to every table this endpoint reads. */
const PUBLIC = {
  isActive: true,
  isPublic: true,
  isMature: false,
} as const

/**
 * The canonical URL for an ArtImage's bytes.
 *
 * NOT the stored imagePath. Silas, 2026-08-29: "it looks like artqueue is
 * giving us a lot of filler images, which is weird for something that should
 * definitely have an image." Two causes, both fixed here and by dropping the
 * path filter below:
 *
 *   - The freshest renders -- exactly what a "fresh from the art queue" rail
 *     exists to show -- often have no stored path at all yet. Their bytes are
 *     still in ArtImage.imageData until offloadArtImageData.ts moves them to
 *     the share, so a `imagePath IS NOT NULL` filter skipped them entirely and
 *     the rail fell back to older rows.
 *   - An older row's stored path can stop serving (the share moved, the file
 *     was never exported), and kr-art-plate then degrades to the stand-in pool
 *     -- filler art on a record that certainly has real art.
 *
 * /api/art/images/[id]/file handles both: it 302s to imagePath when that is
 * set and usable, and serves (and webp-transcodes) the stored bytes when it is
 * not. It also owns the visibility check and an immutable Cache-Control, so
 * this costs one cached redirect rather than a lookup per view. It is the same
 * URL cardPath/heroPath/iconPath already store for entity art.
 */
function artImageFileUrl(id: number): string {
  return `/api/art/images/${id}/file`
}

/**
 * Video ArtImages. NOTE the gap: the video pipeline's default output format is
 * animated WebP (server/api/comfy/utils/videoOutput.ts), which is stored with
 * fileType 'webp' and is therefore indistinguishable from a still here -- those
 * clips land in the art rail and still animate, because they render in an <img>
 * either way. Only the mp4/webm/mov renders can be positively identified as
 * motion, so the animations rail is a floor on what exists, not a census.
 */
const VIDEO_FILE_TYPES = ['mp4', 'webm', 'mov', 'm4v', 'ogv']

type ArtPathRecord = {
  imagePath?: string | null
  path?: string | null
  cardPath?: string | null
  heroPath?: string | null
  iconPath?: string | null
  fileType?: string | null
}

/** The art plate's four paths, normalised to null so the shape never varies. */
function artOf(record: ArtPathRecord | null | undefined): ShowcaseArt {
  return {
    imagePath: record?.imagePath || record?.path || null,
    cardPath: record?.cardPath || null,
    heroPath: record?.heroPath || null,
    iconPath: record?.iconPath || null,
    fileType: record?.fileType || null,
  }
}

/**
 * An object's own art fields first, then its linked primary ArtImage. Objects
 * are backfilled with cardPath/heroPath directly (interface-vision t-007), but
 * older rows still carry their art only through the relation.
 */
function artOfEntity(
  entity: ArtPathRecord & { ArtImage?: ArtPathRecord | null },
): ShowcaseArt {
  const own = artOf(entity)
  if (own.imagePath || own.cardPath || own.heroPath || own.iconPath) return own
  return artOf(entity.ArtImage)
}

function hasArt(art: ShowcaseArt): boolean {
  return Boolean(art.imagePath || art.cardPath || art.heroPath || art.iconPath)
}

function iso(value: Date | null | undefined): string {
  return (value ?? new Date()).toISOString()
}

/** First non-empty line of a text field, trimmed to a card-sized subtitle. */
function summarize(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const text = (candidate ?? '').trim()
    if (!text) continue

    const firstLine = text.split('\n').find((line) => line.trim()) ?? text
    const cleaned = firstLine.trim()
    return cleaned.length > 160 ? `${cleaned.slice(0, 157)}…` : cleaned
  }

  return null
}

function card(
  kind: ShowcaseKind,
  fields: {
    id: number
    title: string | null
    subtitle?: string | null
    slug?: string | null
    badge?: string | null
    href?: string | null
    conductorSlug?: string | null
    theme?: string | null
    createdAt: Date | null
    art: ShowcaseArt
  },
): ShowcaseCard {
  return {
    kind,
    id: fields.id,
    title: (fields.title || '').trim() || 'Untitled',
    subtitle: fields.subtitle ?? null,
    slug: fields.slug ?? null,
    badge: fields.badge ?? null,
    href: fields.href ?? null,
    conductorSlug: fields.conductorSlug ?? null,
    theme: fields.theme ?? null,
    createdAt: iso(fields.createdAt),
    art: fields.art,
  }
}

/**
 * Where a project card actually goes: the placement route for its conductor
 * slug when the project has a surface in this app, then its declared liveUrl,
 * then null so showcaseHref falls back to the project record. A project whose
 * tool is live should open the tool.
 */
function projectHref(project: {
  conductorSlug: string | null
  liveUrl: string | null
}): string | null {
  const slug = (project.conductorSlug || '').trim()
  const placement = slug ? PROJECT_PLACEMENTS[slug] : undefined
  if (placement) return placementLiveUrl(placement)

  const live = (project.liveUrl || '').trim()
  return live || null
}

/* ── selects ─────────────────────────────────────────────────────────────── */

const artPathSelect = {
  id: true,
  createdAt: true,
  imagePath: true,
  path: true,
  cardPath: true,
  heroPath: true,
  iconPath: true,
  thumbnailPath: true,
  fileType: true,
  promptString: true,
  artPrompt: true,
} as const satisfies Prisma.ArtImageSelect

/**
 * The art columns an ArtImage row carries. `path` and `fileType` exist HERE and
 * nowhere else -- see entityArtSelect below for why that distinction has teeth.
 */
const artImageRelationSelect = {
  imagePath: true,
  path: true,
  cardPath: true,
  heroPath: true,
  iconPath: true,
  fileType: true,
} as const satisfies Prisma.ArtImageSelect

/**
 * The art columns the seven showcase OBJECTS carry. Only the four *Path fields:
 * `path` and `fileType` are ArtImage-only columns.
 *
 * THIS CONSTANT SHIPPED WRONG AND BROKE THE WHOLE ENDPOINT (2026-08-29). It
 * included `path` and `fileType`, so every entity query raised
 * "Unknown field `path` for select statement on model `Dream`" -- a Prisma
 * VALIDATION error, thrown before any connection is attempted -- and because
 * the handler fans out through Promise.all, one bad select 500'd all ten
 * queries. The home page rendered its error note and nothing else.
 *
 * WHY TYPESCRIPT DIDN'T CATCH IT, AND WHY THIS LINE IS THE FIX. Excess-property
 * checking only applies to FRESH object literals. Spreading a variable
 * (`select: { id: true, ...entityArtSelect }`) launders its properties past that
 * check, so `vue-tsc` passed a query Prisma rejects at runtime. Adding
 * `satisfies` at each call site does not help either -- the spread is still not
 * fresh. Constraining the shared constant itself is what works: the
 * intersection below means a field must exist on ALL SEVEN models to live here,
 * and adding an eighth model to the union is what forces the next person to
 * check. Verified by reverting this line locally -- `path` and `fileType` are
 * reported as excess properties.
 */
const entityArtSelect = {
  imagePath: true,
  cardPath: true,
  heroPath: true,
  iconPath: true,
} as const satisfies Prisma.DreamSelect &
  Prisma.CharacterSelect &
  Prisma.BotSelect &
  Prisma.RewardSelect &
  Prisma.ScenarioSelect &
  Prisma.FacetSelect &
  Prisma.ProjectSelect

/* ── hero ────────────────────────────────────────────────────────────────── */

/**
 * The daily dream cycle's own output, identified the same three ways
 * /api/dreams/daily-archive.get.ts identifies it. Kept in sync with that route
 * on purpose: the home hero and the digest archive should never disagree about
 * what counts as a daily dream.
 */
/*
 * Annotated rather than `as const`: an `as const` OR is a readonly tuple, and
 * Prisma's Exact<> constraint rejects readonly arrays outright -- which then
 * degrades the whole findMany's inferred return type and cascades into
 * pickHero.
 */
const DAILY_DREAM_WHERE: Prisma.DreamWhereInput = {
  ...PUBLIC,
  dreamType: 'PITCH',
  OR: [
    { designer: 'dream-cycle' },
    { designer: 'Daily Dream Facet Engine' },
    { slug: { startsWith: 'daily-dream-' } },
  ],
}

/**
 * Cast members carry `theme` so the hero's strip is as colour-varied as the
 * rails. Kept out of entityArtSelect on purpose -- Project has no `theme`
 * column, and that constant is constrained against ProjectSelect too.
 */
const heroCastSelect = {
  id: true,
  createdAt: true,
  slug: true,
  theme: true,
  ...entityArtSelect,
} as const

const heroDreamInclude = {
  PitchSheet: {
    select: { hook: true, pitch: true, subtitle: true, title: true },
  },
  ArtImage: { select: artImageRelationSelect },
  Characters: {
    where: PUBLIC,
    select: { ...heroCastSelect, name: true, title: true, role: true },
    take: 4,
  },
  Rewards: {
    where: PUBLIC,
    select: {
      ...heroCastSelect,
      name: true,
      rewardType: true,
      rarity: true,
      description: true,
    },
    take: 4,
  },
  Scenarios: {
    where: PUBLIC,
    select: { ...heroCastSelect, title: true, description: true },
    take: 3,
  },
  FacetLinks: {
    select: {
      Facet: {
        select: { ...heroCastSelect, title: true, flavorText: true },
      },
    },
    take: 4,
  },
} as const

type HeroDream = Prisma.DreamGetPayload<{
  include: typeof heroDreamInclude
}>

function buildHeroCast(dream: HeroDream): ShowcaseCard[] {
  const cast: ShowcaseCard[] = []

  for (const character of dream.Characters ?? []) {
    cast.push(
      card('character', {
        id: character.id,
        title: character.name,
        subtitle: summarize(character.title, character.role),
        slug: character.slug,
        theme: character.theme,
        badge: 'Character',
        createdAt: character.createdAt,
        art: artOf(character),
      }),
    )
  }

  for (const reward of dream.Rewards ?? []) {
    cast.push(
      card('reward', {
        id: reward.id,
        title: reward.name,
        subtitle: summarize(reward.description),
        slug: reward.slug,
        theme: reward.theme,
        badge: reward.rewardType === 'SKILL' ? 'Skill' : 'Item',
        createdAt: reward.createdAt,
        art: artOf(reward),
      }),
    )
  }

  for (const scenario of dream.Scenarios ?? []) {
    cast.push(
      card('scenario', {
        id: scenario.id,
        title: scenario.title,
        subtitle: summarize(scenario.description),
        slug: scenario.slug,
        theme: scenario.theme,
        badge: 'Scenario',
        createdAt: scenario.createdAt,
        art: artOf(scenario),
      }),
    )
  }

  for (const link of dream.FacetLinks ?? []) {
    const facet = link.Facet
    if (!facet) continue

    cast.push(
      card('facet', {
        id: facet.id,
        title: facet.title,
        subtitle: summarize(facet.flavorText),
        slug: facet.slug,
        theme: facet.theme,
        badge: 'Facet',
        createdAt: facet.createdAt,
        art: artOf(facet),
      }),
    )
  }

  return cast
}

/**
 * The newest daily dream that is actually finished enough to headline.
 *
 * Three tiers, strictly in recency order within each: a dream with its own art
 * AND at least HERO_MIN_CAST_WITH_ART arted cast members; failing that, one
 * with its own art and any arted cast; failing that, any with its own art. A
 * dream with no art of its own is never the hero -- an empty plate at the top
 * of the page is worse than no plate at all, and the rails below still have
 * plenty to show.
 */
function pickHero(candidates: HeroDream[]): ShowcaseHero | null {
  type Scored = { hero: ShowcaseHero; castWithArt: number }
  const scored: Scored[] = []

  for (const dream of candidates) {
    const art = artOfEntity(dream)
    if (!hasArt(art)) continue

    const cast = buildHeroCast(dream)
    const castWithArt = cast.filter((member) => hasArt(member.art)).length

    scored.push({
      castWithArt,
      hero: {
        dream: card('dream', {
          id: dream.id,
          title: dream.PitchSheet?.title || dream.title,
          subtitle: summarize(dream.PitchSheet?.subtitle, dream.flavorText),
          slug: dream.slug,
          theme: dream.theme,
          badge: 'Dream',
          createdAt: dream.createdAt,
          art,
        }),
        // Arted cast first: the strip along the bottom of the hero should open
        // with pictures, not with the members still waiting on the queue.
        cast: [...cast].sort(
          (a, b) => Number(hasArt(b.art)) - Number(hasArt(a.art)),
        ),
        hook: summarize(dream.PitchSheet?.hook, dream.flavorText, dream.pitch),
        pitch: summarize(
          dream.PitchSheet?.pitch,
          dream.pitch,
          dream.description,
        ),
        castWithArt,
      },
    })
  }

  if (!scored.length) return null

  const complete = scored.find(
    (entry) => entry.castWithArt >= HERO_MIN_CAST_WITH_ART,
  )
  if (complete) return complete.hero

  const partial = scored.find((entry) => entry.castWithArt > 0)
  return (partial ?? scored[0])!.hero
}

async function loadHero(): Promise<ShowcaseHero | null> {
  const candidates = await prisma.dream.findMany({
    where: DAILY_DREAM_WHERE,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: HERO_CANDIDATE_DEPTH,
    include: heroDreamInclude,
  })

  const daily = pickHero(candidates)
  if (daily) return daily

  /*
   * Nothing from the dream cycle qualified -- a fresh database, or a long
   * enough art outage to empty the candidate window. Rather than leave the top
   * of the page blank, fall back to any public dream that has art, which is
   * still a real dream leading to a real page.
   */
  const fallback = await prisma.dream.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: HERO_CANDIDATE_DEPTH,
    include: heroDreamInclude,
  })

  return pickHero(fallback)
}

/* ── rails ───────────────────────────────────────────────────────────────── */

async function loadArtRail(): Promise<ShowcaseCard[]> {
  const images = await prisma.artImage.findMany({
    where: {
      isActive: true,
      isPublic: true,
      isMature: false,
      NOT: { fileType: { in: VIDEO_FILE_TYPES } },
    },
    orderBy: { createdAt: 'desc' },
    take: ART_RAIL_LIMIT,
    select: artPathSelect,
  })

  return images.map((image) =>
    card('art', {
      id: image.id,
      title:
        summarize(image.promptString, image.artPrompt) || 'Untitled render',
      subtitle: null,
      createdAt: image.createdAt,
      art: { ...artOf(image), imagePath: artImageFileUrl(image.id) },
    }),
  )
}

async function loadAnimationRail(): Promise<ShowcaseCard[]> {
  const clips = await prisma.artImage.findMany({
    where: {
      isActive: true,
      isPublic: true,
      isMature: false,
      fileType: { in: VIDEO_FILE_TYPES },
    },
    orderBy: { createdAt: 'desc' },
    take: ANIMATION_RAIL_LIMIT,
    select: artPathSelect,
  })

  return clips.map((clip) =>
    card('animation', {
      id: clip.id,
      title: summarize(clip.promptString, clip.artPrompt) || 'Untitled clip',
      subtitle: null,
      badge: (clip.fileType || 'clip').toUpperCase(),
      createdAt: clip.createdAt,
      art: { ...artOf(clip), imagePath: artImageFileUrl(clip.id) },
    }),
  )
}

async function loadDreamRail(): Promise<ShowcaseCard[]> {
  const dreams = await prisma.dream.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RAIL_LIMIT,
    select: {
      id: true,
      createdAt: true,
      title: true,
      slug: true,
      flavorText: true,
      pitch: true,
      dreamType: true,
      theme: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return dreams.map((dream) =>
    card('dream', {
      id: dream.id,
      title: dream.title,
      subtitle: summarize(dream.flavorText, dream.pitch),
      slug: dream.slug,
      theme: dream.theme,
      createdAt: dream.createdAt,
      art: artOfEntity(dream),
    }),
  )
}

async function loadCharacterRail(): Promise<ShowcaseCard[]> {
  const characters = await prisma.character.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RAIL_LIMIT,
    select: {
      id: true,
      createdAt: true,
      name: true,
      slug: true,
      title: true,
      role: true,
      species: true,
      theme: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return characters.map((character) =>
    card('character', {
      id: character.id,
      title: character.name,
      subtitle: summarize(character.title, character.role, character.species),
      slug: character.slug,
      theme: character.theme,
      createdAt: character.createdAt,
      art: artOfEntity(character),
    }),
  )
}

async function loadBotRail(): Promise<ShowcaseCard[]> {
  const bots = await prisma.bot.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RAIL_LIMIT,
    select: {
      id: true,
      createdAt: true,
      name: true,
      slug: true,
      subtitle: true,
      tagline: true,
      avatarImage: true,
      theme: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return bots.map((bot) =>
    card('bot', {
      id: bot.id,
      title: bot.name,
      subtitle: summarize(bot.subtitle, bot.tagline),
      slug: bot.slug,
      theme: bot.theme,
      createdAt: bot.createdAt,
      // avatarImage is the Bot-only art field, and it predates the shared
      // path fields -- a bot with nothing else still has a face.
      art: hasArt(artOfEntity(bot))
        ? artOfEntity(bot)
        : artOf({ imagePath: bot.avatarImage }),
    }),
  )
}

async function loadRewardRail(): Promise<ShowcaseCard[]> {
  const rewards = await prisma.reward.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RAIL_LIMIT,
    select: {
      id: true,
      createdAt: true,
      name: true,
      slug: true,
      description: true,
      flavorText: true,
      rewardType: true,
      rarity: true,
      theme: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return rewards.map((reward) =>
    card('reward', {
      id: reward.id,
      title: reward.name,
      subtitle: summarize(reward.flavorText, reward.description),
      slug: reward.slug,
      theme: reward.theme,
      badge: reward.rewardType === 'SKILL' ? 'Skill' : 'Item',
      createdAt: reward.createdAt,
      art: artOfEntity(reward),
    }),
  )
}

async function loadScenarioRail(): Promise<ShowcaseCard[]> {
  const scenarios = await prisma.scenario.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RAIL_LIMIT,
    select: {
      id: true,
      createdAt: true,
      title: true,
      slug: true,
      description: true,
      genres: true,
      locations: true,
      theme: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return scenarios.map((scenario) =>
    card('scenario', {
      id: scenario.id,
      title: scenario.title,
      subtitle: summarize(scenario.description, scenario.locations),
      slug: scenario.slug,
      theme: scenario.theme,
      createdAt: scenario.createdAt,
      art: artOfEntity(scenario),
    }),
  )
}

async function loadFacetRail(): Promise<ShowcaseCard[]> {
  const facets = await prisma.facet.findMany({
    where: PUBLIC,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: RAIL_LIMIT,
    select: {
      id: true,
      createdAt: true,
      title: true,
      slug: true,
      flavorText: true,
      description: true,
      theme: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return facets.map((facet) =>
    card('facet', {
      id: facet.id,
      title: facet.title,
      subtitle: summarize(facet.flavorText, facet.description),
      slug: facet.slug,
      theme: facet.theme,
      createdAt: facet.createdAt,
      art: artOfEntity(facet),
    }),
  )
}

/**
 * The work Silas actually wants surfaced: HIGH priority first, then the rest of
 * what is live, so the strip is never empty on a day when nothing is flagged.
 */
async function loadProjects(): Promise<ShowcaseCard[]> {
  const projects = await prisma.project.findMany({
    where: {
      ...PUBLIC,
      status: { in: ['ACTIVE', 'CONTINUOUS'] },
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
    take: PROJECT_LIMIT,
    select: {
      id: true,
      createdAt: true,
      title: true,
      slug: true,
      pitch: true,
      description: true,
      goal: true,
      status: true,
      priority: true,
      conductorSlug: true,
      liveUrl: true,
      ...entityArtSelect,
      ArtImage: { select: artImageRelationSelect },
    },
  })

  return projects.map((project) =>
    card('project', {
      id: project.id,
      title: project.title,
      subtitle: summarize(project.pitch, project.goal, project.description),
      slug: project.slug,
      badge: project.priority,
      conductorSlug: project.conductorSlug,
      href: projectHref(project),
      createdAt: project.createdAt,
      art: artOfEntity(project),
    }),
  )
}

export default defineEventHandler(async (event) => {
  try {
    const [
      hero,
      art,
      animations,
      dreams,
      characters,
      bots,
      rewards,
      scenarios,
      facets,
      projects,
    ] = await Promise.all([
      loadHero(),
      loadArtRail(),
      loadAnimationRail(),
      loadDreamRail(),
      loadCharacterRail(),
      loadBotRail(),
      loadRewardRail(),
      loadScenarioRail(),
      loadFacetRail(),
      loadProjects(),
    ])

    const data: HomeShowcase = {
      hero,
      rails: {
        art,
        animations,
        dreams,
        characters,
        bots,
        rewards,
        scenarios,
        facets,
      },
      projects,
      generatedAt: new Date().toISOString(),
    }

    /*
     * The payload is entirely public and changes only as fast as the queue
     * lands new work, so a shared minute of caching absorbs a burst of first
     * visits without ever showing one user another user's content.
     */
    setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60')
    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Home showcase loaded successfully.',
      data,
    }
  } catch (error: unknown) {
    /*
     * A FIXED message, unlike most routes in this repo, which forward
     * `handled.message`. This one is unauthenticated and its failures render
     * inside a visible note on the front page, so a database error would put a
     * full Prisma query dump in front of every stranger who happens to visit
     * during an outage. errorHandler has already logged the real cause with its
     * detail intact, which is where it is useful.
     */
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: "The showcase couldn't be loaded just now.",
      data: null,
    }
  }
})
