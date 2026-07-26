// scripts/seed_resource_commercial_safe.ts
//
// One-off seed pass for kind-robots/t-045 (conductor pitch
// pitches/2026-07-15-resource-commercial-safe-field.md). The
// `Resource.commercialSafe` column (migration
// 20260726040000_resource_commercial_safe) defaults every row to
// false/unsafe/unknown, per CONTROL.md's commercial-generation licensing
// rule. This script flips it true ONLY for rows that match a known-clean
// backend, so the digital-storefront print-eligibility gate can start
// reading a real field instead of its current conservative
// checkpointResourceId-IS-NULL default-deny.
//
// Known-safe backends (CONTROL.md, projects/art-generator-connect/docs/
// creative-engines.md):
//   - OpenAI / ChatGPT image generation (commercial use allowed by its terms)
//   - FLUX.1 schnell (Apache-2.0) -- NOT Flux.1 dev, which stays unsafe
//   - Flux.2 Klein (Apache-2.0)
//   - BFL Kontext pro/max API -- NOT Kontext dev
//   - fal.ai / Replicate hosted licensed endpoints
//
// Explicitly EXCLUDED (default-deny, do not special-case): Krea 2 Turbo
// (krea2) is "Community (<50 seats, needs content filter)" licensing, a
// different tier than Apache-2.0 flux2-klein -- it stays unsafe/unknown
// even though it is the current coloring-book color-master default engine.
// SDXL/A1111 checkpoints and LoRAs of unknown provenance also stay
// unsafe/unknown; this is a floor, not a guess.
//
// Matching is heuristic (civitaiUrl/huggingUrl/localPath/generation/name
// text plus supportedServer) because there is no dedicated license field on
// Resource yet -- that's exactly the gap this column exists to close. Review
// the dry-run output before passing --write.
//
// Usage:
//   npx tsx scripts/seed_resource_commercial_safe.ts            # dry run (default)
//   npx tsx scripts/seed_resource_commercial_safe.ts --write    # apply

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import {
  PrismaClient,
  SupportedServer,
  type Resource,
} from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

type Classification = {
  safe: boolean
  reason: string
}

function textFieldsOf(resource: Resource): string {
  return [
    resource.name,
    resource.customLabel,
    resource.localPath,
    resource.huggingUrl,
    resource.civitaiUrl,
    resource.customUrl,
    resource.generation,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()
}

export function classifyResource(resource: Resource): Classification {
  if (resource.supportedServer === SupportedServer.OPENAI) {
    return { safe: true, reason: 'OpenAI/ChatGPT image generation' }
  }

  const text = textFieldsOf(resource)
  const mentionsDev = /\bdev\b/.test(text)

  if (/flux[.\s-]?2[.\s-]?klein/.test(text)) {
    return { safe: true, reason: 'Flux.2 Klein (Apache-2.0)' }
  }

  if (
    resource.supportedServer === SupportedServer.FLUX &&
    /schnell/.test(text) &&
    !mentionsDev
  ) {
    return { safe: true, reason: 'FLUX.1 schnell (Apache-2.0)' }
  }

  if (
    resource.supportedServer === SupportedServer.KONTEXT &&
    /\b(pro|max)\b/.test(text) &&
    !mentionsDev
  ) {
    return { safe: true, reason: 'BFL Kontext pro/max API' }
  }

  if (
    /(^|\/\/|\.)fal\.ai\b/.test(text) ||
    /(^|\/\/|\.)replicate\.com\b/.test(text)
  ) {
    return { safe: true, reason: 'fal.ai/Replicate hosted licensed endpoint' }
  }

  return { safe: false, reason: 'no known-safe backend match (default-deny)' }
}

function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

async function main() {
  const WRITE = process.argv.includes('--write')

  const prisma = createSeedPrismaClient()
  try {
    const resources = await prisma.resource.findMany()
    const matches = resources
      .map((resource) => ({
        resource,
        classification: classifyResource(resource),
      }))
      .filter(({ classification }) => classification.safe)

    console.log(`Scanned ${resources.length} Resource row(s).`)
    console.log(`${matches.length} row(s) match a known-safe backend:`)
    for (const { resource, classification } of matches) {
      console.log(
        `  #${resource.id} "${resource.name}" (${resource.supportedServer}) -- ${classification.reason} -- currently commercialSafe=${resource.commercialSafe}`,
      )
    }

    const toFlip = matches.filter(({ resource }) => !resource.commercialSafe)

    if (!WRITE) {
      console.log(
        `[dry run] Would set commercialSafe=true on ${toFlip.length} row(s) (${matches.length - toFlip.length} already true). Re-run with --write to apply.`,
      )
      return
    }

    const result = await prisma.resource.updateMany({
      where: { id: { in: toFlip.map(({ resource }) => resource.id) } },
      data: { commercialSafe: true },
    })
    console.log(`Updated ${result.count} row(s) to commercialSafe=true.`)
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
