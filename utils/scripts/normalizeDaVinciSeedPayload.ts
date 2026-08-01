import { readFileSync, writeFileSync } from 'node:fs'

interface GeneratedEnding {
  milestone?: unknown
  achievement?: unknown
  lifeAchievement?: unknown
  [key: string]: unknown
}

function normalizeEnding(ending: GeneratedEnding): GeneratedEnding {
  if (ending.milestone && ending.achievement && !ending.lifeAchievement) {
    const { milestone, achievement, ...rest } = ending
    return {
      ...rest,
      achievement: milestone,
      lifeAchievement: achievement,
    }
  }

  return ending
}

function main(): void {
  const [inputPath, outputPath] = process.argv.slice(2)
  if (!inputPath || !outputPath) {
    throw new Error(
      'Usage: tsx utils/scripts/normalizeDaVinciSeedPayload.ts <input.jsonl> <output.jsonl>',
    )
  }

  const lines = readFileSync(inputPath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim().length > 0)

  const normalized = lines.map((line, index) => {
    try {
      return JSON.stringify(normalizeEnding(JSON.parse(line)))
    } catch {
      throw new Error(`Invalid JSONL at line ${index + 1}`)
    }
  })

  writeFileSync(outputPath, `${normalized.join('\n')}\n`)
  console.log(`Normalized ${normalized.length} Da Vinci ending payloads.`)
}

main()
