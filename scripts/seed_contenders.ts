// scripts/seed_contenders.ts
//
// Idempotent seed for the Challenge Center contender roster.
// Running without --write validates and previews the seed without touching a database.
//
// Usage:
//   npx tsx scripts/seed_contenders.ts
//   npx tsx scripts/seed_contenders.ts --write

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

type ContenderSeed = {
  slug: string
  name: string
  kind: 'AGENT_STACK' | 'LLM_MODEL' | 'ART_GENERATOR'
  provider?: string
  model?: string
  generator?: string
  description: string
  isActive: true
}

export const CONTENDER_SEEDS = [
  {
    slug: 'conductor-claude',
    name: 'Conductor (Claude)',
    kind: 'AGENT_STACK',
    provider: 'anthropic',
    model: undefined,
    generator: 'claude-api',
    description:
      'The AI_Networker Conductor stack using Claude through the Anthropic API.',
    isActive: true
  },
  {
    slug: 'portos-agent',
    name: 'Port0s',
    kind: 'AGENT_STACK',
    provider: undefined,
    model: undefined,
    generator: 'portos-agent',
    description:
      'The Port0s agent stack, registered as a first-class external challenge contender.',
    isActive: true
  },
  {
    slug: 'claude-fable',
    name: 'Claude Fable',
    kind: 'LLM_MODEL',
    provider: 'anthropic',
    model: 'claude-fable-5',
    generator: 'claude-api',
    description:
      'Claude Fable 5 accessed directly through the Anthropic API.',
    isActive: true
  },
  {
    slug: 'claude-opus',
    name: 'Claude Opus',
    kind: 'LLM_MODEL',
    provider: 'anthropic',
    model: 'claude-opus-4-8',
    generator: 'claude-api',
    description:
      'Claude Opus 4.8 accessed directly through the Anthropic API.',
    isActive: true
  },
  {
    slug: 'openai-gpt',
    name: 'OpenAI GPT',
    kind: 'LLM_MODEL',
    provider: 'openai',
    model: undefined,
    generator: 'openai-api',
    description:
      'The configured OpenAI GPT model accessed through the OpenAI API.',
    isActive: true
  },
  {
    slug: 'art-sd',
    name: 'Stable Diffusion',
    kind: 'ART_GENERATOR',
    provider: 'local',
    model: undefined,
    generator: 'art-sd',
    description:
      'The Kind Robots Stable Diffusion backend exposed by server/api/art/sd.',
    isActive: true
  },
  {
    slug: 'art-comfy-flux',
    name: 'ComfyUI FLUX',
    kind: 'ART_GENERATOR',
    provider: 'local',
    model: undefined,
    generator: 'comfy-flux',
    description:
      'The Kind Robots ComfyUI FLUX pipeline exposed by server/api/comfy.',
    isActive: true
  },
  {
    slug: 'art-comfy-sdxl',
    name: 'ComfyUI SDXL',
    kind: 'ART_GENERATOR',
    provider: 'local',
    model: undefined,
    generator: 'comfy-sdxl',
    description:
      'The Kind Robots ComfyUI SDXL pipeline exposed by server/api/comfy.',
    isActive: true
  },
  {
    slug: 'art-openai',
    name: 'OpenAI Images',
    kind: 'ART_GENERATOR',
    provider: 'openai',
    model: undefined,
    generator: 'openai-images',
    description:
      'The Kind Robots OpenAI image-generation backend exposed by server/api/art/generate.',
    isActive: true
  }
] as const satisfies readonly ContenderSeed[]

export function validateContenderSeeds(
  seeds: readonly ContenderSeed[] = CONTENDER_SEEDS
): void {
  if (seeds.length !== 9) {
    throw new Error(`Expected exactly 9 contenders, found ${seeds.length}`)
  }

  const slugs = seeds.map((contender) => contender.slug)
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Contender seed slugs must be unique')
  }

  const kinds = new Set(seeds.map((contender) => contender.kind))
  for (const kind of ['AGENT_STACK', 'LLM_MODEL', 'ART_GENERATOR'] as const) {
    if (!kinds.has(kind)) {
      throw new Error(`Contender seed roster is missing ${kind}`)
    }
  }

  for (const contender of seeds) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(contender.slug)) {
      throw new Error(`Invalid contender slug: ${contender.slug}`)
    }
    if (!contender.name.trim() || !contender.description.trim()) {
      throw new Error(`${contender.slug}: name and description are required`)
    }
    if (!contender.generator?.trim()) {
      throw new Error(`${contender.slug}: generator is required`)
    }
    if (contender.kind === 'LLM_MODEL' && !contender.provider?.trim()) {
      throw new Error(`${contender.slug}: LLM contenders require a provider`)
    }
  }
}

export function createSeedPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when running with --write')
  }
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
}

export async function seedContenders(
  prisma: PrismaClient,
  seeds: readonly ContenderSeed[] = CONTENDER_SEEDS
): Promise<void> {
  validateContenderSeeds(seeds)

  for (const contender of seeds) {
    const data = {
      name: contender.name,
      kind: contender.kind,
      provider: contender.provider ?? null,
      model: contender.model ?? null,
      generator: contender.generator ?? null,
      description: contender.description,
      isActive: contender.isActive
    }

    await prisma.contender.upsert({
      where: { slug: contender.slug },
      update: data,
      create: { slug: contender.slug, ...data }
    })
  }
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write')
  validateContenderSeeds()

  console.table(
    CONTENDER_SEEDS.map(({ slug, name, kind, provider, model, generator }) => ({
      slug,
      name,
      kind,
      provider: provider ?? '',
      model: model ?? '',
      generator: generator ?? ''
    }))
  )

  if (!write) {
    console.log(
      `[dry run] Validated ${CONTENDER_SEEDS.length} contenders. Re-run with --write to upsert them.`
    )
    return
  }

  const prisma = createSeedPrismaClient()
  try {
    await seedContenders(prisma)
    const seededCount = await prisma.contender.count({
      where: { slug: { in: CONTENDER_SEEDS.map((contender) => contender.slug) } }
    })
    if (seededCount !== CONTENDER_SEEDS.length) {
      throw new Error(
        `Post-seed verification found ${seededCount}/${CONTENDER_SEEDS.length} contenders`
      )
    }
    console.log(`Upserted and verified ${seededCount} Challenge Center contenders.`)
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
