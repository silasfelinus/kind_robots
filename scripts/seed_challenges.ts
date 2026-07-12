// scripts/seed_challenges.ts
//
// Idempotent seed for the Challenge Center's first ten public challenges.
// Running without --write validates and previews the seed without touching a database.
//
// Usage:
//   npx tsx scripts/seed_challenges.ts
//   npx tsx scripts/seed_challenges.ts --write

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

type ChallengeSeed = {
  slug: string
  title: string
  challengeType: 'ART' | 'TEXT' | 'CHARACTER' | 'REASONING'
  difficulty: number
  promptText: string
  judgeNotes: string
  status: 'OPEN'
  isMature: false
}

export const CHALLENGE_SEEDS = [
  {
    slug: 'neon-ramen-bar-icon',
    title: 'Neon Ramen Bar Icon',
    challengeType: 'ART',
    difficulty: 2,
    promptText: 'Design an icon for a neon-lit ramen bar in a cyberpunk city.',
    judgeNotes:
      'Reward an immediately readable icon silhouette, strong neon atmosphere, appetizing ramen cues, and clear cyberpunk-city character at small sizes.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'between-dimensions-library-hero',
    title: 'The Library Between Dimensions',
    challengeType: 'ART',
    difficulty: 3,
    promptText:
      'Paint a hero banner for a cozy magical library that exists between dimensions.',
    judgeNotes:
      'Judge the balance between warmth and impossible scale, banner-friendly composition, environmental storytelling, and a convincing sense of dimensional wonder.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'shipwrecked-robot-raft-card',
    title: 'Shipwrecked Robot Raft',
    challengeType: 'ART',
    difficulty: 3,
    promptText:
      'Create a card-art portrait of a shipwrecked robot building a raft from circuit boards.',
    judgeNotes:
      'Favor a strong card-art focal point, readable robot emotion, inventive circuit-board construction, and a scene that communicates resourcefulness without extra explanation.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'generation-ship-noir-opening',
    title: 'Noir on a Generation Ship',
    challengeType: 'TEXT',
    difficulty: 2,
    promptText:
      'Write the opening paragraph of a noir detective story set on a generation ship.',
    judgeNotes:
      'Reward a compelling first-line hook, noir voice, economical worldbuilding, and a mystery that could only happen aboard a multigenerational spacecraft.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'alien-forest-after-rain',
    title: 'Alien Forest After Rain',
    challengeType: 'TEXT',
    difficulty: 2,
    promptText:
      'Describe the smell, sound, and feel of a forest after it rains on an alien planet.',
    judgeNotes:
      'Judge sensory specificity, originality, internal ecological logic, and whether the description feels alien while remaining vivid and emotionally legible.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'villain-already-lost-monologue',
    title: 'The Villain Has Already Lost',
    challengeType: 'TEXT',
    difficulty: 3,
    promptText:
      "Write a villain's internal monologue the moment they realize they've already lost.",
    judgeNotes:
      'Favor psychological precision, a distinctive voice, a convincing turn from certainty to recognition, and restraint over generic theatrical villainy.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'acrobat-quantum-professor',
    title: 'The Acrobat Who Teaches Quantum Mechanics',
    challengeType: 'CHARACTER',
    difficulty: 2,
    promptText:
      'Design a character: a retired circus acrobat who now teaches quantum mechanics.',
    judgeNotes:
      'Reward a cohesive character whose physical history informs their teaching style, memorable visual details, believable motivations, and useful story hooks.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'last-ambassador',
    title: 'The Last Ambassador',
    challengeType: 'CHARACTER',
    difficulty: 3,
    promptText:
      'Design a character: the last living ambassador to a civilization that vanished.',
    judgeNotes:
      'Judge emotional depth, diplomatic identity, the mystery of the vanished civilization, visual or behavioral specificity, and the tensions created by being its final representative.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'water-jug-four-liters',
    title: 'Measure Exactly Four Liters',
    challengeType: 'REASONING',
    difficulty: 2,
    promptText:
      'You have 3 jars: 8L, 5L, 3L. Starting with the 8L full, measure exactly 4L.',
    judgeNotes:
      'A strong answer gives a valid, unambiguous sequence of pours, tracks every jar after each move, and reaches exactly four liters without assuming markings or discarding water.',
    status: 'OPEN',
    isMature: false
  },
  {
    slug: 'dead-language-recipe-key',
    title: 'The Recipe Is the Key',
    challengeType: 'REASONING',
    difficulty: 4,
    promptText:
      'A message arrives in a dead language. The only key is a recipe. Decode the intent.',
    judgeNotes:
      'Because the puzzle is intentionally open-ended, judge the explicit decoding method, disciplined use of recipe structure as evidence, internally consistent reasoning, and a clearly stated final interpretation.',
    status: 'OPEN',
    isMature: false
  }
] as const satisfies readonly ChallengeSeed[]

export function validateChallengeSeeds(
  seeds: readonly ChallengeSeed[] = CHALLENGE_SEEDS
): void {
  if (seeds.length !== 10) {
    throw new Error(`Expected exactly 10 challenges, found ${seeds.length}`)
  }

  const slugs = seeds.map((challenge) => challenge.slug)
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('Challenge seed slugs must be unique')
  }

  if (new Set(seeds.map((challenge) => challenge.challengeType)).size < 3) {
    throw new Error('Challenge seed must cover at least three challenge types')
  }

  for (const challenge of seeds) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(challenge.slug)) {
      throw new Error(`Invalid challenge slug: ${challenge.slug}`)
    }
    if (!challenge.title.trim() || !challenge.promptText.trim()) {
      throw new Error(`${challenge.slug}: title and promptText are required`)
    }
    if (!challenge.judgeNotes.trim()) {
      throw new Error(`${challenge.slug}: judgeNotes are required`)
    }
    if (challenge.difficulty < 1 || challenge.difficulty > 5) {
      throw new Error(`${challenge.slug}: difficulty must be between 1 and 5`)
    }
    if (challenge.status !== 'OPEN') {
      throw new Error(`${challenge.slug}: initial status must be OPEN`)
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

export async function seedChallenges(
  prisma: PrismaClient,
  seeds: readonly ChallengeSeed[] = CHALLENGE_SEEDS
): Promise<void> {
  validateChallengeSeeds(seeds)

  for (const challenge of seeds) {
    const data = {
      title: challenge.title,
      challengeType: challenge.challengeType,
      difficulty: challenge.difficulty,
      promptText: challenge.promptText,
      judgeNotes: challenge.judgeNotes,
      status: challenge.status,
      isMature: challenge.isMature
    }

    await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      update: data,
      create: { slug: challenge.slug, ...data }
    })
  }
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write')
  validateChallengeSeeds()

  console.table(
    CHALLENGE_SEEDS.map(({ slug, challengeType, difficulty, title }) => ({
      slug,
      type: challengeType,
      difficulty,
      title
    }))
  )

  if (!write) {
    console.log(
      `[dry run] Validated ${CHALLENGE_SEEDS.length} challenges. Re-run with --write to upsert them.`
    )
    return
  }

  const prisma = createSeedPrismaClient()
  try {
    await seedChallenges(prisma)
    const seededCount = await prisma.challenge.count({
      where: { slug: { in: CHALLENGE_SEEDS.map((challenge) => challenge.slug) } }
    })
    if (seededCount !== CHALLENGE_SEEDS.length) {
      throw new Error(
        `Post-seed verification found ${seededCount}/${CHALLENGE_SEEDS.length} challenges`
      )
    }
    console.log(`Upserted and verified ${seededCount} Challenge Center challenges.`)
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
