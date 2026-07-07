import { PrismaClient } from './prisma/generated/prisma/index.js'
const p = new PrismaClient()
const q = async (label, sql) => console.log(label, JSON.stringify(await p.$queryRawUnsafe(sql)))
await q('Contender table :', "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Contender'")
await q('CS new columns  :', "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ChallengeSubmission' AND COLUMN_NAME IN ('contenderId','variantKey','promptUsed','settings','randomSelections')")
await q('botId nullable? :', "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ChallengeSubmission' AND COLUMN_NAME='botId'")
await q('CS indexes      :', "SELECT DISTINCT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ChallengeSubmission' AND INDEX_NAME IN ('ChallengeSubmission_challengeId_botId_key','ChallengeSubmission_challengeId_contenderId_variantKey_key','ChallengeSubmission_contenderId_fkey')")
await q('Foreign keys    :', "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND CONSTRAINT_NAME IN ('Contender_avatarImageId_fkey','ChallengeSubmission_contenderId_fkey')")
await p.$disconnect()
