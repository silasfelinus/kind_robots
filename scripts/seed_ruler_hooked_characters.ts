// scripts/seed_ruler_hooked_characters.ts
//
// ruler-hooked/t-028 -- "Build on the audit's character-parity item rather
// than inventing a parallel system: seed real Character entities, map the
// existing content slugs, and define portrait/expression requirements so
// the art has a schema to target." (FULL-GAME-GAP-AUDIT.md: "repository
// evidence does not show those slugs being seeded/linked as first-class Kind
// Robots Character entities, nor a portrait/expression asset set".)
//
// Idempotent, upserted by `slug` (Character.slug is @unique), sourced
// directly from utils/rulerHooked/content.ts's CharacterRef[] -- one list,
// never a hand-copied second one that can drift. For each Character it also
// upserts one ExpressionMedia placeholder row per
// CHARACTER_EXPRESSION_KEYS (characterArt.ts), carrying the ArtJob prompt
// text but no imagePath -- these are meant to be rendered by a later,
// separate art batch (the render queue is ~1400+ jobs deep as of t-028; this
// script deliberately never blocks on that). It NEVER deletes: a character
// dropped from content.ts is simply no longer touched here, same
// non-destructive posture as seed_bestiary.ts's "never delete" rule.
//
// The offline game itself never reads these rows -- ruler-hooked stays
// fully client-side/localStorage (data-model.md's offline guarantee). This
// is purely the site-wide Character-model parity the audit asked for
// (character detail pages, future cross-game reuse, the render pipeline).
//
// Usage:
//   npx tsx scripts/seed_ruler_hooked_characters.ts            # dry run (default)
//   npx tsx scripts/seed_ruler_hooked_characters.ts --write    # apply
//
// NOTE: not run against production by this task -- a dry run only needs the
// content bundle, not a live DATABASE_URL. `--write` should be run by a
// session with real DB credentials once someone wants these rows live.

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import type { PrismaClient } from '../prisma/generated/prisma/client'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'
import { RULER_HOOKED_CONTENT } from '../utils/rulerHooked/content'
import type { CharacterRef } from '../types/ruler-hooked'
import {
  CHARACTER_EXPRESSION_KEYS,
  characterPortraitPrompt,
  type CharacterExpressionKey,
} from '../utils/rulerHooked/characterArt'

const GENRE = 'ruler-hooked'

// characterArt.ts's four reaction expressions, mapped onto the kind_robots
// Expression enum (server/utils' generated Prisma client) -- kept narrow on
// purpose (a standing advisor/narrator's reaction set, not a full emote rig).
const EXPRESSION_ENUM: Record<CharacterExpressionKey, string> = {
  neutral: 'NEUTRAL',
  pleased: 'PROUD',
  concerned: 'ANXIOUS',
  alarmed: 'AFRAID',
}

export function validateCatalog(): CharacterRef[] {
  const characters = RULER_HOOKED_CONTENT.characters
  if (!characters.length) {
    throw new Error('utils/rulerHooked/content.ts has no characters to seed')
  }
  const slugs = characters.map((c) => c.slug)
  if (slugs.some((slug) => !slug)) {
    throw new Error('Every ruler-hooked CharacterRef must have a slug')
  }
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Duplicate slugs in ruler-hooked content characters')
  }
  return characters
}

function toCharacterUpsertData(ref: CharacterRef) {
  return {
    name: ref.name,
    honorific: ref.honorific,
    alignment: ref.alignment,
    role: ref.role,
    drive: ref.drive,
    quirks: ref.quirks,
    genre: GENRE,
    isPublic: true,
    isActive: true,
  }
}

export async function upsertCharacter(
  prisma: PrismaClient,
  ref: CharacterRef,
): Promise<number> {
  const data = toCharacterUpsertData(ref)
  const existing = await prisma.character.findUnique({
    where: { slug: ref.slug },
    select: { id: true },
  })
  if (existing) {
    await prisma.character.update({ where: { id: existing.id }, data })
    return existing.id
  }
  const created = await prisma.character.create({
    data: { ...data, slug: ref.slug },
    select: { id: true },
  })
  return created.id
}

/**
 * One placeholder ExpressionMedia row per expression key. `imagePath` is
 * deliberately left untouched on update (never overwritten with null) so a
 * later art-backfill pass is never erased by re-running this script --
 * same "generated art is not erased by reconciliation" rule seed_achievements
 * follows for its own imagePath/artImageId fields.
 */
export async function upsertExpressionPlaceholders(
  prisma: PrismaClient,
  characterId: number,
  ref: CharacterRef,
): Promise<void> {
  for (const expression of CHARACTER_EXPRESSION_KEYS) {
    const artPrompt = characterPortraitPrompt({
      name: ref.name,
      role: ref.role,
      quirks: ref.quirks,
      expression,
    })
    const existing = await prisma.expressionMedia.findUnique({
      where: {
        characterId_expressionKey: { characterId, expressionKey: expression },
      },
      select: { id: true },
    })
    if (existing) {
      await prisma.expressionMedia.update({
        where: { id: existing.id },
        data: { artPrompt, label: `${ref.name} — ${expression}` },
      })
      continue
    }
    await prisma.expressionMedia.create({
      data: {
        characterId,
        expressionKey: expression,
        expression: EXPRESSION_ENUM[expression] as never,
        kind: 'EMOTION',
        label: `${ref.name} — ${expression}`,
        artPrompt,
        // No imagePath yet -- rendered by a later art batch (t-028's scope
        // note: "you are NOT expected to render new art in this session").
        isActive: false,
      },
    })
  }
}

async function main() {
  const WRITE = process.argv.includes('--write')

  const characters = validateCatalog()
  console.log(
    `Parsed ${characters.length} ruler-hooked characters from content.ts ` +
      `(${characters.length * CHARACTER_EXPRESSION_KEYS.length} expression placeholders).`,
  )

  if (!WRITE) {
    console.log(
      `[dry run] Catalog is valid. Would upsert ${characters.length} Character rows by ` +
        `slug plus ${CHARACTER_EXPRESSION_KEYS.length} ExpressionMedia placeholder(s) each. ` +
        `Re-run with --write to apply.`,
    )
    for (const c of characters) {
      console.log(
        `  - ${c.slug} (${c.name}${c.honorific ? `, ${c.honorific}` : ''})`,
      )
    }
    return
  }

  await withDatabaseRetry('ruler-hooked character seed', async () => {
    const prisma = createScriptPrismaClient()
    try {
      let done = 0
      for (const ref of characters) {
        const characterId = await upsertCharacter(prisma, ref)
        await upsertExpressionPlaceholders(prisma, characterId, ref)
        done += 1
        console.log(`  ...${done}/${characters.length} ${ref.slug}`)
      }
      console.log(`Done. Seeded/updated ${done} ruler-hooked characters.`)
    } finally {
      await prisma.$disconnect()
    }
  })
}

// Run the CLI only when executed directly, not when imported.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
