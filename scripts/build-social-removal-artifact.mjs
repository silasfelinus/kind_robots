import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'

function read(path) {
  return readFileSync(path, 'utf8')
}

function write(path, content) {
  writeFileSync(path, content)
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Missing expected source block: ${label}`)
  }

  return source.replace(search, replacement)
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Missing expected source pattern: ${label}`)
  }

  pattern.lastIndex = 0
  return source.replace(pattern, replacement)
}

function removeNamedPrismaBlock(source, kind, name) {
  return replaceRegexRequired(
    source,
    new RegExp(`\\n${kind} ${name} \\{\\n[\\s\\S]*?\\n\\}\\n`, 'm'),
    '\n',
    `${kind} ${name}`,
  )
}

function removeFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Expected removable file was not found: ${path}`)
  }

  rmSync(path)
}

const removedFiles = [
  'components/giftshop/social-publisher.vue',
  'cypress/e2e/api/social.cy.ts',
  'server/api/socials/[id].delete.ts',
  'server/api/socials/[id].get.ts',
  'server/api/socials/[id].patch.ts',
  'server/api/socials/[id]/publish.post.ts',
  'server/api/socials/index.get.ts',
  'server/api/socials/index.post.ts',
  'server/api/socials/selects.ts',
  'server/utils/socialMedia.ts',
  'stores/socialStore.ts',
  'utils/social/formatSocialPost.ts',
]

for (const path of removedFiles) removeFile(path)

let schema = read('prisma/schema.prisma')
schema = removeNamedPrismaBlock(schema, 'model', 'SocialPost')
schema = removeNamedPrismaBlock(schema, 'model', 'SocialTarget')
schema = removeNamedPrismaBlock(schema, 'enum', 'SocialPlatform')
schema = removeNamedPrismaBlock(schema, 'enum', 'PostAudience')
schema = removeNamedPrismaBlock(schema, 'enum', 'PostStatus')
schema = removeNamedPrismaBlock(schema, 'enum', 'TargetStatus')
schema = replaceRequired(
  schema,
  '  SocialPosts            SocialPost[]\n',
  '',
  'User.SocialPosts relation',
)
schema = replaceRequired(
  schema,
  '  MESSAGE\n  POST\n  PROMPT\n',
  '  MESSAGE\n  PROMPT\n',
  'Reaction POST category',
)
write('prisma/schema.prisma', schema)

let dashboardHelper = read('stores/helpers/dashboardHelper.ts')
dashboardHelper = replaceRegexRequired(
  dashboardHelper,
  /      \{\n        key: 'social',\n[\s\S]*?        title: 'Social Publisher',\n[\s\S]*?        route: '\/sanctuary',\n      \},\n/,
  '',
  'giftshop Social dashboard tab',
)
write('stores/helpers/dashboardHelper.ts', dashboardHelper)

let giftshopManager = read('components/giftshop/giftshop-manager.vue')
giftshopManager = replaceRegexRequired(
  giftshopManager,
  /\n      <section\n        v-else-if="activeTab === 'social'"[\s\S]*?      <\/section>\n/,
  '\n',
  'giftshop Social Publisher panel',
)
giftshopManager = replaceRegexRequired(
  giftshopManager,
  /\n    social:\n      'Broadcast tower humming\.[^\n]+',/,
  '',
  'giftshop social swarm memo',
)
write('components/giftshop/giftshop-manager.vue', giftshopManager)

let purge = read('server/utils/userPurge.ts')
purge = replaceRegexRequired(
  purge,
  /\n      track\(\n        'socialPosts',\n        await tx\.socialPost\.deleteMany\(\{ where: \{ userId \} \}\),\n      \)\n/,
  '\n',
  'SocialPost user purge step',
)
write('server/utils/userPurge.ts', purge)

let restriction = read('server/utils/restriction.ts')
restriction = replaceRegexRequired(
  restriction,
  /\n    prisma\.socialPost\.updateMany\(\{\n      where: \{ userId \},\n      data: \{ isPublic: false \},\n    \}\),/,
  '',
  'SocialPost restriction update',
)
write('server/utils/restriction.ts', restriction)

let reactions = read('server/api/reactions/index.post.ts')
reactions = replaceRequired(
  reactions,
  '  POST: Reaction_reactionCategory.POST,\n',
  '',
  'POST reaction alias',
)
reactions = replaceRequired(
  reactions,
  '    [Reaction_reactionCategory.POST]: null,\n',
  '',
  'POST reaction target mapping',
)
write('server/api/reactions/index.post.ts', reactions)

let feedPreferences = read('stores/feedPreferenceStore.ts')
feedPreferences = replaceRequired(
  feedPreferences,
  'pattern (stores/navStore.ts, stores/socialStore.ts) rather than a database',
  'pattern (stores/navStore.ts) rather than a database',
  'newsfeed persistence precedent comment',
)
write('stores/feedPreferenceStore.ts', feedPreferences)

let audit = read('docs/architecture/thin-resource-api-audit.md')
audit = replaceRequired(
  audit,
  '| SocialPost | Creates owned SocialTarget children as part of the post aggregate | Keep aggregate creation; replace full target rows with the smallest useful response where callers allow it |',
  '| SocialPost / SocialTarget | Abandoned publishing prototype had no active product workflow | Removed the models, enums, migration surface, API routes, Pinia store, formatter, dashboard tab, component, and Cypress suite |',
  'SocialPost audit row',
)
audit = replaceRequired(
  audit,
  '- Social publish commands\n',
  '',
  'Social publish workflow exception',
)
audit = replaceRequired(
  audit,
  '4. Bot, Project, PitchSheet, and SocialPost response cleanup. Bot, Project, and PitchSheet are complete; SocialPost is next.',
  '4. ✅ Bot, Project, and PitchSheet response cleanup; retired the unused SocialPost/SocialTarget prototype instead of preserving dead CRUD.',
  'thin API execution order item 4',
)
write('docs/architecture/thin-resource-api-audit.md', audit)

let backendSweep = read('docs/notes/backend-sweep-2026-07-05.md')
backendSweep = replaceRequired(
  backendSweep,
  '(`codeStore`,\n> `compositionStore`, `socialStore`, `componentStore`) have since been fixed',
  '(`codeStore`,\n> `compositionStore`, `componentStore`) have since been fixed; the unused `socialStore` and SocialPost publishing prototype were removed',
  'backend sweep fixed-store status',
)
backendSweep = replaceRequired(
  backendSweep,
  '- **`socialStore.ts`** (389 lines, 1 use) — identical twin of compositionStore.',
  '- **`socialStore.ts`** — removed with the abandoned SocialPost/SocialTarget publishing prototype.',
  'backend sweep socialStore finding',
)
backendSweep = replaceRequired(
  backendSweep,
  '2. `compositionStore` + `socialStore` — same bug, small files, one rewrite each',
  '2. `compositionStore` — same bug pattern; `socialStore` was removed with the abandoned publishing prototype',
  'backend sweep store fix order',
)
backendSweep = replaceRequired(
  backendSweep,
  '2. Batch the store CRITICAL fixes (codeStore, composition/social, component)',
  '2. Batch the remaining store CRITICAL fixes (codeStore, composition, component)',
  'backend sweep suggested steps',
)
write('docs/notes/backend-sweep-2026-07-05.md', backendSweep)

const migrationPath =
  'prisma/migrations/20260718200000_remove_social_publishing/migration.sql'
if (existsSync(migrationPath)) {
  throw new Error(`Migration already exists: ${migrationPath}`)
}
mkdirSync(dirname(migrationPath), { recursive: true })
write(
  migrationPath,
  `-- Remove the abandoned SocialPost/SocialTarget publishing prototype.\n-- POST reactions had no target foreign key and only existed for that prototype.\nDELETE FROM \`Reaction\` WHERE \`reactionCategory\` = 'POST';\n\nDROP TABLE IF EXISTS \`SocialTarget\`;\nDROP TABLE IF EXISTS \`SocialPost\`;\n\nALTER TABLE \`Reaction\`\n  MODIFY \`reactionCategory\` ENUM(\n    'ART_IMAGE',\n    'ART_COLLECTION',\n    'BOT',\n    'BUTTERFLY',\n    'CHALLENGE_SUBMISSION',\n    'CHARACTER',\n    'CHAT_EXCHANGE',\n    'COMPONENT',\n    'DREAM',\n    'FACET',\n    'PROJECT',\n    'MESSAGE',\n    'PROMPT',\n    'RESOURCE',\n    'REWARD',\n    'SCENARIO',\n    'THEME'\n  ) NOT NULL DEFAULT 'ART_IMAGE';\n`,
)

const liveReferencePatterns = [
  'SocialPost',
  'SocialTarget',
  'SocialPlatform',
  'PostAudience',
  'PostStatus',
  'TargetStatus',
  '/api/socials',
  'socialStore',
  'social-publisher',
]

for (const pattern of liveReferencePatterns) {
  try {
    const output = execFileSync(
      'git',
      [
        'grep',
        '-n',
        pattern,
        '--',
        'components',
        'cypress',
        'server',
        'stores',
        'utils',
        'prisma/schema.prisma',
      ],
      { encoding: 'utf8' },
    )

    if (output.trim()) {
      throw new Error(`Live references remain for ${pattern}:\n${output}`)
    }
  } catch (error) {
    if (error?.status === 1) continue
    throw error
  }
}

console.log(
  `Prepared social publishing removal: ${removedFiles.length} files deleted plus schema, migration, UI, utility, and documentation cleanup.`,
)
