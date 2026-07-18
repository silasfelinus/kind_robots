import { readFileSync, writeFileSync } from 'node:fs'

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

const path = 'server/api/rewards/index.ts'
let source = readFileSync(path, 'utf8')

source = replaceRequired(
  source,
  `import prisma from '../../utils/prisma'\n`,
  `import prisma from '../../utils/prisma'\nimport {\n  rewardMutationSelect,\n  type RewardMutationResult,\n} from './selects'\n`,
  'Reward mutation selector import',
)

source = replaceRequired(
  source,
  `): Promise<RewardWithRelations> {\n  return await prisma.reward.create({\n    data: buildCreateData(input, authenticatedUserId),\n    include: rewardInclude,\n  })\n}`,
  `): Promise<RewardMutationResult> {\n  return await prisma.reward.create({\n    data: buildCreateData(input, authenticatedUserId),\n    select: rewardMutationSelect,\n  })\n}`,
  'Reward create projection',
)

source = replaceRequired(
  source,
  `  rewards: RewardWithRelations[]\n`,
  `  rewards: RewardMutationResult[]\n`,
  'Reward batch result type',
)

source = replaceRequired(
  source,
  `  const rewards: RewardWithRelations[] = []\n`,
  `  const rewards: RewardMutationResult[] = []\n`,
  'Reward batch array type',
)

source = replaceRequired(
  source,
  `): Promise<RewardWithRelations> {\n  return await prisma.reward.update({\n    where: { id },\n    data: buildUpdateData(input),\n    include: rewardInclude,\n  })\n}`,
  `): Promise<RewardMutationResult> {\n  return await prisma.reward.update({\n    where: { id },\n    data: buildUpdateData(input),\n    select: rewardMutationSelect,\n  })\n}`,
  'Reward update projection',
)

writeFileSync(path, source)
