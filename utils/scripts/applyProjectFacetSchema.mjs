import { mkdir, readFile, writeFile } from 'node:fs/promises'

const schemaPath = new URL('../../prisma/schema.prisma', import.meta.url)
const packagePath = new URL('../../package.json', import.meta.url)
const migrationDir = new URL(
  '../../prisma/migrations/20260710223000_add_project_and_facet_models/',
  import.meta.url,
)
const migrationPath = new URL('migration.sql', migrationDir)

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source
  const matches = source.split(before).length - 1
  if (matches !== 1) {
    throw new Error(`${label}: expected one match, found ${matches}`)
  }
  return source.replace(before, after)
}

let schema = await readFile(schemaPath, 'utf8')

schema = replaceOnce(
  schema,
  `  DreamsPrimary        Dream[]               @relation("DreamPrimaryArtImage")\n  Dreams               Dream[]               @relation("DreamToArtImage")\n`,
  `  DreamsPrimary        Dream[]               @relation("DreamPrimaryArtImage")\n  Dreams               Dream[]               @relation("DreamToArtImage")\n  ProjectsPrimary      Project[]             @relation("ProjectPrimaryArtImage")\n  FacetsPrimary        Facet[]               @relation("FacetPrimaryArtImage")\n  ProjectLinks         ProjectArtImage[]\n  FacetLinks           FacetArtImage[]\n`,
  'ArtImage project/facet relations',
)

schema = replaceOnce(
  schema,
  `  DreamsPrimary Dream[]    @relation("DreamPrimaryArtCollection")\n  Dreams        Dream[]    @relation("DreamToArtCollection")\n`,
  `  DreamsPrimary   Dream[]                 @relation("DreamPrimaryArtCollection")\n  Dreams          Dream[]                 @relation("DreamToArtCollection")\n  ProjectsPrimary Project[]               @relation("ProjectPrimaryArtCollection")\n  FacetsPrimary   Facet[]                 @relation("FacetPrimaryArtCollection")\n  ProjectLinks    ProjectArtCollection[]\n  FacetLinks      FacetArtCollection[]\n`,
  'ArtCollection project/facet relations',
)

schema = replaceOnce(
  schema,
  `  Dreams               Dream[]\n  ChallengeSubmissions ChallengeSubmission[]\n`,
  `  Dreams               Dream[]\n  NarratedDreams       Dream[]               @relation("DreamNarrator")\n  ManagedProjects      Project[]             @relation("ProjectManager")\n  ChallengeSubmissions ChallengeSubmission[]\n`,
  'Bot manager and narrator relations',
)

schema = replaceOnce(
  schema,
  `  dreamId         Int?\n  isActive        Boolean    @default(true)\n`,
  `  dreamId         Int?\n  projectId       Int?\n  isActive        Boolean    @default(true)\n`,
  'Chat projectId',
)

schema = replaceOnce(
  schema,
  `  Dream           Dream?     @relation(fields: [dreamId], references: [id])\n  Prompt          Prompt?    @relation(fields: [promptId], references: [id])\n`,
  `  Dream           Dream?     @relation(fields: [dreamId], references: [id])\n  Project         Project?   @relation(fields: [projectId], references: [id], onDelete: SetNull)\n  Prompt          Prompt?    @relation(fields: [promptId], references: [id])\n`,
  'Chat Project relation',
)

schema = replaceOnce(
  schema,
  `  @@index([dreamId], map: "Chat_dreamId_fkey")\n  @@index([artImageId], map: "Chat_artImageId_fkey")\n`,
  `  @@index([dreamId], map: "Chat_dreamId_fkey")\n  @@index([projectId], map: "Chat_projectId_fkey")\n  @@index([artImageId], map: "Chat_artImageId_fkey")\n`,
  'Chat project index',
)

schema = replaceOnce(
  schema,
  `  artImageId        Int?\n  artCollectionId   Int?\n  // ── Relations`,
  `  artImageId        Int?\n  artCollectionId   Int?\n  narratorId        Int?\n  // ── Relations`,
  'Dream narratorId',
)

schema = replaceOnce(
  schema,
  `  ArtCollection     ArtCollection?  @relation("DreamPrimaryArtCollection", fields: [artCollectionId], references: [id])\n  Scenarios         Scenario[]      @relation("DreamToScenario")\n`,
  `  ArtCollection     ArtCollection?  @relation("DreamPrimaryArtCollection", fields: [artCollectionId], references: [id])\n  Narrator          Bot?            @relation("DreamNarrator", fields: [narratorId], references: [id], onDelete: SetNull)\n  Scenarios         Scenario[]      @relation("DreamToScenario")\n  FacetLinks        DreamFacet[]\n`,
  'Dream narrator and facet relations',
)

schema = replaceOnce(
  schema,
  `  @@index([artCollectionId])\n  @@index([projectStatus])\n`,
  `  @@index([artCollectionId])\n  @@index([narratorId])\n  @@index([projectStatus])\n`,
  'Dream narrator index',
)

const newModels = `
/// Projects are implementation records synchronized with Conductor. Creative world
/// infrastructure belongs to Dream; lightweight reusable flavor belongs to Facet.
model Project {
  id              Int             @id @default(autoincrement())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime?       @default(now()) @updatedAt
  title           String          @db.VarChar(255)
  slug            String?         @unique @db.VarChar(255)
  description     String?         @db.Text
  flavorText      String?         @db.VarChar(512)
  goal            String?         @db.Text
  waypoints       String?         @db.Text
  status          ProjectStatus   @default(BRAINSTORM)
  priority        ProjectPriority @default(NORMAL)
  conductorSlug   String?         @unique @db.VarChar(255)
  repoUrl         String?         @db.VarChar(512)
  liveUrl         String?         @db.VarChar(512)
  channelKey      String?         @db.VarChar(255)
  tabKey          String?         @db.VarChar(255)
  lastSyncedAt    DateTime?
  allowReviews    Boolean         @default(false)
  highlightImage  String?         @db.VarChar(256)
  icon            String?
  imagePath       String?         @db.Text
  cardPath        String?         @db.Text
  heroPath        String?         @db.Text
  designer        String?         @db.VarChar(256)
  creationSource  CreationSource  @default(HUMAN)
  userId          Int             @default(10)
  managerBotId    Int?
  artImageId      Int?
  artCollectionId Int?
  isPublic        Boolean         @default(true)
  isMature        Boolean         @default(false)
  isActive        Boolean         @default(true)

  User              User                   @relation(fields: [userId], references: [id])
  Manager           Bot?                   @relation("ProjectManager", fields: [managerBotId], references: [id], onDelete: SetNull)
  ArtImage           ArtImage?              @relation("ProjectPrimaryArtImage", fields: [artImageId], references: [id], onDelete: SetNull)
  ArtCollection      ArtCollection?         @relation("ProjectPrimaryArtCollection", fields: [artCollectionId], references: [id], onDelete: SetNull)
  ArtImageLinks      ProjectArtImage[]
  ArtCollectionLinks ProjectArtCollection[]
  Chats              Chat[]
  Reactions          Reaction[]
  Todos              Todo[]
  ArtJobs            ArtJob[]
  PitchSheet         PitchSheet?

  @@index([userId])
  @@index([managerBotId])
  @@index([artImageId])
  @@index([artCollectionId])
  @@index([status])
  @@index([priority])
  @@index([channelKey, tabKey])
  @@index([isPublic])
  @@index([isActive])
}

/// Facets are lightweight reusable creative building blocks: genres, animals,
/// colors, themes, cores, moods, styles, settings, and art direction.
model Facet {
  id              Int            @id @default(autoincrement())
  createdAt       DateTime       @default(now())
  updatedAt       DateTime?      @default(now()) @updatedAt
  title           String         @db.VarChar(255)
  slug            String?        @unique @db.VarChar(255)
  kind            FacetKind      @default(OTHER)
  description     String?        @db.Text
  flavorText      String?        @db.VarChar(512)
  examples        String?        @db.LongText
  artPrompt       String?        @db.Text
  imagePath       String?        @db.Text
  cardPath        String?        @db.Text
  heroPath        String?        @db.Text
  icon            String?
  designer        String?        @db.VarChar(256)
  creationSource  CreationSource @default(HUMAN)
  userId          Int            @default(10)
  artImageId      Int?
  artCollectionId Int?
  isPublic        Boolean        @default(true)
  isMature        Boolean        @default(false)
  isActive        Boolean        @default(true)

  User              User                 @relation(fields: [userId], references: [id])
  ArtImage           ArtImage?            @relation("FacetPrimaryArtImage", fields: [artImageId], references: [id], onDelete: SetNull)
  ArtCollection      ArtCollection?       @relation("FacetPrimaryArtCollection", fields: [artCollectionId], references: [id], onDelete: SetNull)
  ArtImageLinks      FacetArtImage[]
  ArtCollectionLinks FacetArtCollection[]
  DreamLinks         DreamFacet[]
  ScenarioLinks      ScenarioFacet[]
  Reactions          Reaction[]
  RelationsFrom      FacetRelation[]      @relation("FacetRelationFrom")
  RelationsTo        FacetRelation[]      @relation("FacetRelationTo")

  @@index([userId])
  @@index([kind])
  @@index([artImageId])
  @@index([artCollectionId])
  @@index([isPublic])
  @@index([isActive])
}

model DreamFacet {
  dreamId  Int
  facetId  Int
  createdAt DateTime @default(now())

  Dream Dream @relation(fields: [dreamId], references: [id], onDelete: Cascade)
  Facet Facet @relation(fields: [facetId], references: [id], onDelete: Cascade)

  @@id([dreamId, facetId])
  @@index([facetId])
}

model ScenarioFacet {
  scenarioId Int
  facetId    Int
  createdAt  DateTime @default(now())

  Scenario Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  Facet    Facet    @relation(fields: [facetId], references: [id], onDelete: Cascade)

  @@id([scenarioId, facetId])
  @@index([facetId])
}

model ProjectArtImage {
  projectId  Int
  artImageId Int
  createdAt  DateTime @default(now())

  Project  Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  ArtImage ArtImage @relation(fields: [artImageId], references: [id], onDelete: Cascade)

  @@id([projectId, artImageId])
  @@index([artImageId])
}

model ProjectArtCollection {
  projectId       Int
  artCollectionId Int
  createdAt       DateTime @default(now())

  Project       Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  ArtCollection ArtCollection @relation(fields: [artCollectionId], references: [id], onDelete: Cascade)

  @@id([projectId, artCollectionId])
  @@index([artCollectionId])
}

model FacetArtImage {
  facetId    Int
  artImageId Int
  createdAt  DateTime @default(now())

  Facet    Facet    @relation(fields: [facetId], references: [id], onDelete: Cascade)
  ArtImage ArtImage @relation(fields: [artImageId], references: [id], onDelete: Cascade)

  @@id([facetId, artImageId])
  @@index([artImageId])
}

model FacetArtCollection {
  facetId         Int
  artCollectionId Int
  createdAt       DateTime @default(now())

  Facet         Facet         @relation(fields: [facetId], references: [id], onDelete: Cascade)
  ArtCollection ArtCollection @relation(fields: [artCollectionId], references: [id], onDelete: Cascade)

  @@id([facetId, artCollectionId])
  @@index([artCollectionId])
}

model FacetRelation {
  id           Int               @id @default(autoincrement())
  createdAt    DateTime          @default(now())
  updatedAt    DateTime?         @default(now()) @updatedAt
  fromFacetId  Int
  toFacetId    Int
  relationType FacetRelationType @default(RELATED)
  note         String?           @db.VarChar(512)

  FromFacet Facet @relation("FacetRelationFrom", fields: [fromFacetId], references: [id], onDelete: Cascade)
  ToFacet   Facet @relation("FacetRelationTo", fields: [toFacetId], references: [id], onDelete: Cascade)

  @@unique([fromFacetId, toFacetId, relationType])
  @@index([fromFacetId])
  @@index([toFacetId])
  @@index([relationType])
}

`

schema = replaceOnce(
  schema,
  `enum DreamRelationType {\n  IS_A // taxonomy: WeirdWest IS_A WeirdCore\n  APPEARS_IN // membership: Space Bar APPEARS_IN Space Adventures\n  CONTAINS // explicit inverse authoring, if you ever want to author top-down\n  RELATED // generic catch-all, the safe default\n  INSPIRED_BY // soft creative lineage\n}\n\n`,
  `enum DreamRelationType {\n  IS_A // taxonomy: WeirdWest IS_A WeirdCore\n  APPEARS_IN // membership: Space Bar APPEARS_IN Space Adventures\n  CONTAINS // explicit inverse authoring, if you ever want to author top-down\n  RELATED // generic catch-all, the safe default\n  INSPIRED_BY // soft creative lineage\n}\n\n${newModels}`,
  'Project and Facet models',
)

schema = replaceOnce(
  schema,
  `  dreamId Int   @unique\n  Dream   Dream @relation(fields: [dreamId], references: [id], onDelete: Cascade)\n`,
  `  dreamId   Int?     @unique\n  projectId Int?     @unique\n  Dream     Dream?   @relation(fields: [dreamId], references: [id], onDelete: Cascade)\n  Project   Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)\n`,
  'PitchSheet dual ownership',
)

schema = replaceOnce(
  schema,
  `  @@index([layoutKey])\n  @@index([artImageId])\n`,
  `  @@index([layoutKey])\n  @@index([projectId])\n  @@index([artImageId])\n`,
  'PitchSheet project index',
)

schema = replaceOnce(
  schema,
  `  dreamId               Int?\n  artCollectionId       Int?\n`,
  `  dreamId               Int?\n  projectId             Int?\n  facetId               Int?\n  artCollectionId       Int?\n`,
  'Reaction project/facet ids',
)

schema = replaceOnce(
  schema,
  `  Dream                 Dream?                    @relation(fields: [dreamId], references: [id])\n  Prompt                Prompt?                   @relation(fields: [promptId], references: [id])\n`,
  `  Dream                 Dream?                    @relation(fields: [dreamId], references: [id])\n  Project               Project?                  @relation(fields: [projectId], references: [id], onDelete: SetNull)\n  Facet                 Facet?                    @relation(fields: [facetId], references: [id], onDelete: SetNull)\n  Prompt                Prompt?                   @relation(fields: [promptId], references: [id])\n`,
  'Reaction project/facet relations',
)

schema = replaceOnce(
  schema,
  `  @@index([dreamId], map: "Reaction_dreamId_fkey")\n  @@index([promptId], map: "Reaction_promptId_fkey")\n`,
  `  @@index([dreamId], map: "Reaction_dreamId_fkey")\n  @@index([projectId], map: "Reaction_projectId_fkey")\n  @@index([facetId], map: "Reaction_facetId_fkey")\n  @@index([promptId], map: "Reaction_promptId_fkey")\n`,
  'Reaction project/facet indexes',
)

schema = replaceOnce(
  schema,
  `  Characters           Character[]           @relation("CharacterToScenario")\n  Compositions         Composition[]\n`,
  `  Characters           Character[]           @relation("CharacterToScenario")\n  FacetLinks           ScenarioFacet[]\n  Compositions         Composition[]\n`,
  'Scenario facets',
)

schema = replaceOnce(
  schema,
  `  Dreams                Dream[]\n  Logs                  Log[]\n`,
  `  Dreams                Dream[]\n  Projects              Project[]\n  Facets                Facet[]\n  Logs                  Log[]\n`,
  'User project/facet relations',
)

schema = replaceOnce(
  schema,
  `  projectSlug String? @db.VarChar(255)\n  artImageId  Int?\n`,
  `  projectSlug String? @db.VarChar(255)\n  projectId   Int?\n  artImageId  Int?\n`,
  'ArtJob projectId',
)

schema = replaceOnce(
  schema,
  `  User   User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([status, priority, id])\n`,
  `  User    User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  Project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)\n\n  @@index([status, priority, id])\n`,
  'ArtJob Project relation',
)

schema = replaceOnce(
  schema,
  `  @@index([projectSlug])\n}\n`,
  `  @@index([projectSlug])\n  @@index([projectId])\n}\n`,
  'ArtJob project index',
)

schema = replaceOnce(
  schema,
  `  Bot\n}\n\n`,
  `  Bot\n  Project\n}\n\n`,
  'ChatType Project value',
)

schema = replaceOnce(
  schema,
  `enum ProjectStatus {\n  ACTIVE\n  PAUSED\n  DONE\n  ARCHIVED\n  BRAINSTORM\n}\n\nenum DreamPriority`,
  `enum ProjectStatus {\n  ACTIVE\n  PAUSED\n  DONE\n  ARCHIVED\n  BRAINSTORM\n}\n\nenum ProjectPriority {\n  LOW\n  NORMAL\n  HIGH\n}\n\nenum FacetKind {\n  GENRE\n  ANIMAL\n  COLOR\n  THEME\n  CORE\n  MOOD\n  STYLE\n  SETTING\n  ART_DIRECTION\n  OTHER\n}\n\nenum FacetRelationType {\n  IS_A\n  APPEARS_IN\n  CONTAINS\n  RELATED\n  INSPIRED_BY\n}\n\nenum DreamPriority`,
  'Project and Facet enums',
)

schema = replaceOnce(
  schema,
  `  DREAM\n  MESSAGE\n`,
  `  DREAM\n  FACET\n  PROJECT\n  MESSAGE\n`,
  'Reaction categories',
)

schema = replaceOnce(
  schema,
  `  dreamId     Int? // project scope: links to a PROJECT Dream\n  order       Int? // display order within category (used by DESIRED_FEATURE)\n  Dream       Dream?       @relation(fields: [dreamId], references: [id], onDelete: SetNull)\n`,
  `  dreamId     Int? // legacy project scope during migration\n  projectId   Int?\n  order       Int? // display order within category (used by DESIRED_FEATURE)\n  Dream       Dream?       @relation(fields: [dreamId], references: [id], onDelete: SetNull)\n  Project     Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)\n`,
  'Todo project relation',
)

schema = replaceOnce(
  schema,
  `  @@index([dreamId])\n}\n\nenum ArtStatus`,
  `  @@index([dreamId])\n  @@index([projectId])\n}\n\nenum ArtStatus`,
  'Todo project index',
)

await writeFile(schemaPath, schema)

const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
packageJson.scripts ??= {}
packageJson.scripts['audit:schema-shift'] =
  'tsx utils/scripts/auditProjectDreamFacet.ts'
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

await mkdir(migrationDir, { recursive: true })
await writeFile(
  migrationPath,
  `-- Add Project and Facet as first-class models without deleting legacy Dream data.
-- PitchSheet permits either a Dream or Project owner during the transition; the
-- application and audit script enforce exactly one owner.

ALTER TABLE \`Chat\`
  ADD COLUMN \`projectId\` INTEGER NULL,
  MODIFY \`type\` ENUM('ToBot','BotResponse','ToForum','ToUser','ToCharacter','Weirdlandia','Dream','Reward','Story','Scenario','Character','Bot','Project') NOT NULL;

ALTER TABLE \`Dream\` ADD COLUMN \`narratorId\` INTEGER NULL;

CREATE TABLE \`Project\` (
  \`id\` INTEGER NOT NULL AUTO_INCREMENT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`title\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NULL,
  \`description\` TEXT NULL,
  \`flavorText\` VARCHAR(512) NULL,
  \`goal\` TEXT NULL,
  \`waypoints\` TEXT NULL,
  \`status\` ENUM('ACTIVE','PAUSED','DONE','ARCHIVED','BRAINSTORM') NOT NULL DEFAULT 'BRAINSTORM',
  \`priority\` ENUM('LOW','NORMAL','HIGH') NOT NULL DEFAULT 'NORMAL',
  \`conductorSlug\` VARCHAR(255) NULL,
  \`repoUrl\` VARCHAR(512) NULL,
  \`liveUrl\` VARCHAR(512) NULL,
  \`channelKey\` VARCHAR(255) NULL,
  \`tabKey\` VARCHAR(255) NULL,
  \`lastSyncedAt\` DATETIME(3) NULL,
  \`allowReviews\` BOOLEAN NOT NULL DEFAULT false,
  \`highlightImage\` VARCHAR(256) NULL,
  \`icon\` VARCHAR(191) NULL,
  \`imagePath\` TEXT NULL,
  \`cardPath\` TEXT NULL,
  \`heroPath\` TEXT NULL,
  \`designer\` VARCHAR(256) NULL,
  \`creationSource\` ENUM('HUMAN','AI','HYBRID','UPLOAD','UNKNOWN') NOT NULL DEFAULT 'HUMAN',
  \`userId\` INTEGER NOT NULL DEFAULT 10,
  \`managerBotId\` INTEGER NULL,
  \`artImageId\` INTEGER NULL,
  \`artCollectionId\` INTEGER NULL,
  \`isPublic\` BOOLEAN NOT NULL DEFAULT true,
  \`isMature\` BOOLEAN NOT NULL DEFAULT false,
  \`isActive\` BOOLEAN NOT NULL DEFAULT true,
  UNIQUE INDEX \`Project_slug_key\`(\`slug\`),
  UNIQUE INDEX \`Project_conductorSlug_key\`(\`conductorSlug\`),
  INDEX \`Project_userId_idx\`(\`userId\`),
  INDEX \`Project_managerBotId_idx\`(\`managerBotId\`),
  INDEX \`Project_artImageId_idx\`(\`artImageId\`),
  INDEX \`Project_artCollectionId_idx\`(\`artCollectionId\`),
  INDEX \`Project_status_idx\`(\`status\`),
  INDEX \`Project_priority_idx\`(\`priority\`),
  INDEX \`Project_channelKey_tabKey_idx\`(\`channelKey\`, \`tabKey\`),
  INDEX \`Project_isPublic_idx\`(\`isPublic\`),
  INDEX \`Project_isActive_idx\`(\`isActive\`),
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`Facet\` (
  \`id\` INTEGER NOT NULL AUTO_INCREMENT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`title\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NULL,
  \`kind\` ENUM('GENRE','ANIMAL','COLOR','THEME','CORE','MOOD','STYLE','SETTING','ART_DIRECTION','OTHER') NOT NULL DEFAULT 'OTHER',
  \`description\` TEXT NULL,
  \`flavorText\` VARCHAR(512) NULL,
  \`examples\` LONGTEXT NULL,
  \`artPrompt\` TEXT NULL,
  \`imagePath\` TEXT NULL,
  \`cardPath\` TEXT NULL,
  \`heroPath\` TEXT NULL,
  \`icon\` VARCHAR(191) NULL,
  \`designer\` VARCHAR(256) NULL,
  \`creationSource\` ENUM('HUMAN','AI','HYBRID','UPLOAD','UNKNOWN') NOT NULL DEFAULT 'HUMAN',
  \`userId\` INTEGER NOT NULL DEFAULT 10,
  \`artImageId\` INTEGER NULL,
  \`artCollectionId\` INTEGER NULL,
  \`isPublic\` BOOLEAN NOT NULL DEFAULT true,
  \`isMature\` BOOLEAN NOT NULL DEFAULT false,
  \`isActive\` BOOLEAN NOT NULL DEFAULT true,
  UNIQUE INDEX \`Facet_slug_key\`(\`slug\`),
  INDEX \`Facet_userId_idx\`(\`userId\`),
  INDEX \`Facet_kind_idx\`(\`kind\`),
  INDEX \`Facet_artImageId_idx\`(\`artImageId\`),
  INDEX \`Facet_artCollectionId_idx\`(\`artCollectionId\`),
  INDEX \`Facet_isPublic_idx\`(\`isPublic\`),
  INDEX \`Facet_isActive_idx\`(\`isActive\`),
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`DreamFacet\` (
  \`dreamId\` INTEGER NOT NULL,
  \`facetId\` INTEGER NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX \`DreamFacet_facetId_idx\`(\`facetId\`),
  PRIMARY KEY (\`dreamId\`, \`facetId\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`ScenarioFacet\` (
  \`scenarioId\` INTEGER NOT NULL,
  \`facetId\` INTEGER NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX \`ScenarioFacet_facetId_idx\`(\`facetId\`),
  PRIMARY KEY (\`scenarioId\`, \`facetId\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`ProjectArtImage\` (
  \`projectId\` INTEGER NOT NULL,
  \`artImageId\` INTEGER NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX \`ProjectArtImage_artImageId_idx\`(\`artImageId\`),
  PRIMARY KEY (\`projectId\`, \`artImageId\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`ProjectArtCollection\` (
  \`projectId\` INTEGER NOT NULL,
  \`artCollectionId\` INTEGER NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX \`ProjectArtCollection_artCollectionId_idx\`(\`artCollectionId\`),
  PRIMARY KEY (\`projectId\`, \`artCollectionId\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`FacetArtImage\` (
  \`facetId\` INTEGER NOT NULL,
  \`artImageId\` INTEGER NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX \`FacetArtImage_artImageId_idx\`(\`artImageId\`),
  PRIMARY KEY (\`facetId\`, \`artImageId\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`FacetArtCollection\` (
  \`facetId\` INTEGER NOT NULL,
  \`artCollectionId\` INTEGER NOT NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX \`FacetArtCollection_artCollectionId_idx\`(\`artCollectionId\`),
  PRIMARY KEY (\`facetId\`, \`artCollectionId\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE \`FacetRelation\` (
  \`id\` INTEGER NOT NULL AUTO_INCREMENT,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`fromFacetId\` INTEGER NOT NULL,
  \`toFacetId\` INTEGER NOT NULL,
  \`relationType\` ENUM('IS_A','APPEARS_IN','CONTAINS','RELATED','INSPIRED_BY') NOT NULL DEFAULT 'RELATED',
  \`note\` VARCHAR(512) NULL,
  UNIQUE INDEX \`FacetRelation_fromFacetId_toFacetId_relationType_key\`(\`fromFacetId\`, \`toFacetId\`, \`relationType\`),
  INDEX \`FacetRelation_fromFacetId_idx\`(\`fromFacetId\`),
  INDEX \`FacetRelation_toFacetId_idx\`(\`toFacetId\`),
  INDEX \`FacetRelation_relationType_idx\`(\`relationType\`),
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE \`PitchSheet\`
  MODIFY \`dreamId\` INTEGER NULL,
  ADD COLUMN \`projectId\` INTEGER NULL;

ALTER TABLE \`Reaction\`
  ADD COLUMN \`projectId\` INTEGER NULL,
  ADD COLUMN \`facetId\` INTEGER NULL,
  MODIFY \`reactionCategory\` ENUM('ART_IMAGE','ART_COLLECTION','BOT','BUTTERFLY','CHALLENGE_SUBMISSION','CHARACTER','CHAT_EXCHANGE','COMPONENT','COMPOSITION','DREAM','FACET','PROJECT','MESSAGE','POST','PROMPT','RESOURCE','REWARD','SCENARIO','THEME') NOT NULL DEFAULT 'ART_IMAGE';

ALTER TABLE \`Todo\` ADD COLUMN \`projectId\` INTEGER NULL;
ALTER TABLE \`ArtJob\` ADD COLUMN \`projectId\` INTEGER NULL;

CREATE UNIQUE INDEX \`PitchSheet_projectId_key\` ON \`PitchSheet\`(\`projectId\`);
CREATE INDEX \`PitchSheet_projectId_idx\` ON \`PitchSheet\`(\`projectId\`);
CREATE INDEX \`Chat_projectId_fkey\` ON \`Chat\`(\`projectId\`);
CREATE INDEX \`Dream_narratorId_idx\` ON \`Dream\`(\`narratorId\`);
CREATE INDEX \`Reaction_projectId_fkey\` ON \`Reaction\`(\`projectId\`);
CREATE INDEX \`Reaction_facetId_fkey\` ON \`Reaction\`(\`facetId\`);
CREATE INDEX \`Todo_projectId_idx\` ON \`Todo\`(\`projectId\`);
CREATE INDEX \`ArtJob_projectId_idx\` ON \`ArtJob\`(\`projectId\`);

ALTER TABLE \`Project\` ADD CONSTRAINT \`Project_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE \`Project\` ADD CONSTRAINT \`Project_managerBotId_fkey\` FOREIGN KEY (\`managerBotId\`) REFERENCES \`Bot\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Project\` ADD CONSTRAINT \`Project_artImageId_fkey\` FOREIGN KEY (\`artImageId\`) REFERENCES \`ArtImage\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Project\` ADD CONSTRAINT \`Project_artCollectionId_fkey\` FOREIGN KEY (\`artCollectionId\`) REFERENCES \`ArtCollection\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Facet\` ADD CONSTRAINT \`Facet_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE \`Facet\` ADD CONSTRAINT \`Facet_artImageId_fkey\` FOREIGN KEY (\`artImageId\`) REFERENCES \`ArtImage\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Facet\` ADD CONSTRAINT \`Facet_artCollectionId_fkey\` FOREIGN KEY (\`artCollectionId\`) REFERENCES \`ArtCollection\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`DreamFacet\` ADD CONSTRAINT \`DreamFacet_dreamId_fkey\` FOREIGN KEY (\`dreamId\`) REFERENCES \`Dream\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`DreamFacet\` ADD CONSTRAINT \`DreamFacet_facetId_fkey\` FOREIGN KEY (\`facetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`ScenarioFacet\` ADD CONSTRAINT \`ScenarioFacet_scenarioId_fkey\` FOREIGN KEY (\`scenarioId\`) REFERENCES \`Scenario\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`ScenarioFacet\` ADD CONSTRAINT \`ScenarioFacet_facetId_fkey\` FOREIGN KEY (\`facetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`ProjectArtImage\` ADD CONSTRAINT \`ProjectArtImage_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`ProjectArtImage\` ADD CONSTRAINT \`ProjectArtImage_artImageId_fkey\` FOREIGN KEY (\`artImageId\`) REFERENCES \`ArtImage\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`ProjectArtCollection\` ADD CONSTRAINT \`ProjectArtCollection_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`ProjectArtCollection\` ADD CONSTRAINT \`ProjectArtCollection_artCollectionId_fkey\` FOREIGN KEY (\`artCollectionId\`) REFERENCES \`ArtCollection\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`FacetArtImage\` ADD CONSTRAINT \`FacetArtImage_facetId_fkey\` FOREIGN KEY (\`facetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`FacetArtImage\` ADD CONSTRAINT \`FacetArtImage_artImageId_fkey\` FOREIGN KEY (\`artImageId\`) REFERENCES \`ArtImage\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`FacetArtCollection\` ADD CONSTRAINT \`FacetArtCollection_facetId_fkey\` FOREIGN KEY (\`facetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`FacetArtCollection\` ADD CONSTRAINT \`FacetArtCollection_artCollectionId_fkey\` FOREIGN KEY (\`artCollectionId\`) REFERENCES \`ArtCollection\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`FacetRelation\` ADD CONSTRAINT \`FacetRelation_fromFacetId_fkey\` FOREIGN KEY (\`fromFacetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`FacetRelation\` ADD CONSTRAINT \`FacetRelation_toFacetId_fkey\` FOREIGN KEY (\`toFacetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`Chat\` ADD CONSTRAINT \`Chat_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Dream\` ADD CONSTRAINT \`Dream_narratorId_fkey\` FOREIGN KEY (\`narratorId\`) REFERENCES \`Bot\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`PitchSheet\` ADD CONSTRAINT \`PitchSheet_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE \`Reaction\` ADD CONSTRAINT \`Reaction_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Reaction\` ADD CONSTRAINT \`Reaction_facetId_fkey\` FOREIGN KEY (\`facetId\`) REFERENCES \`Facet\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`Todo\` ADD CONSTRAINT \`Todo_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE \`ArtJob\` ADD CONSTRAINT \`ArtJob_projectId_fkey\` FOREIGN KEY (\`projectId\`) REFERENCES \`Project\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
`,
)
