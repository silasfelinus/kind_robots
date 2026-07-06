# Challenge Center t-002 schema patch handoff

This connector run could create the additive migration file, but it could not safely replace the full `prisma/schema.prisma` through the contents API without a patch-capable checkout. Apply the schema changes below in the same PR before merging or regenerate them with Prisma from the migration.

## Intended branch

`worker/challenge-center-t-002`

## Migration already added

`prisma/migrations/20260706121000_add_challenge_contenders/migration.sql`

The migration:

- Creates `Contender` with `slug`, `name`, `kind`, provider/model/generator metadata, nullable `avatarImageId`, `defaultSettings`, `description`, and `isActive`.
- Adds `contenderId`, `variantKey`, `promptUsed`, `settings`, and `randomSelections` to `ChallengeSubmission`.
- Makes `ChallengeSubmission.botId` nullable instead of dropping it.
- Replaces the old unique `(challengeId, botId)` index with `(challengeId, contenderId, variantKey)`.
- Adds only indexes and foreign keys, plus one `DROP INDEX`; it does not drop tables, columns, or data.

## Required schema.prisma patch

Add a relation from `ArtImage` to contenders near the existing challenge relations:

```prisma
  Contenders           Contender[]
```

Add the Contender model near the Challenge Center section:

```prisma
enum ContenderKind {
  AGENT_STACK
  LLM_MODEL
  ART_GENERATOR
}

model Contender {
  id              Int           @id @default(autoincrement())
  createdAt       DateTime      @default(now())
  updatedAt       DateTime?     @default(now()) @updatedAt
  slug            String        @unique @db.VarChar(255)
  name            String        @db.VarChar(255)
  kind            ContenderKind
  provider        String?       @db.VarChar(128)
  model           String?       @db.VarChar(255)
  generator       String?       @db.VarChar(128)
  defaultSettings Json?
  description     String?       @db.Text
  avatarImageId   Int?
  isActive        Boolean       @default(true)

  AvatarImage ArtImage?             @relation(fields: [avatarImageId], references: [id])
  Submissions ChallengeSubmission[]

  @@index([kind])
  @@index([provider])
  @@index([model])
  @@index([generator])
  @@index([isActive])
  @@index([avatarImageId], map: "Contender_avatarImageId_fkey")
}
```

Update `ChallengeSubmission`:

```prisma
model ChallengeSubmission {
  id               Int                       @id @default(autoincrement())
  createdAt        DateTime                  @default(now())
  updatedAt        DateTime?                 @default(now()) @updatedAt
  challengeId      Int
  botId            Int?
  contenderId      Int?
  variantKey       String                    @default("default") @db.VarChar(128)
  promptUsed       String?                   @db.Text
  settings         Json?
  randomSelections Json?
  agentModel       String?                   @db.VarChar(256)
  outputText       String?                   @db.Text
  artImageId       Int?
  characterId      Int?
  scenarioId       Int?
  status           ChallengeSubmissionStatus @default(READY)
  Challenge        Challenge                 @relation(fields: [challengeId], references: [id])
  Bot              Bot?                      @relation(fields: [botId], references: [id])
  Contender        Contender?                @relation(fields: [contenderId], references: [id])
  ArtImage         ArtImage?                 @relation(fields: [artImageId], references: [id])
  Character        Character?                @relation(fields: [characterId], references: [id])
  Scenario         Scenario?                 @relation(fields: [scenarioId], references: [id])
  Reactions        Reaction[]

  @@unique([challengeId, contenderId, variantKey])
  @@index([botId], map: "ChallengeSubmission_botId_fkey")
  @@index([contenderId], map: "ChallengeSubmission_contenderId_fkey")
  @@index([artImageId], map: "ChallengeSubmission_artImageId_fkey")
  @@index([characterId], map: "ChallengeSubmission_characterId_fkey")
  @@index([scenarioId], map: "ChallengeSubmission_scenarioId_fkey")
}
```

## Verification still needed

Run from a real checkout:

```bash
npx prisma validate
npx prisma generate
```

Then inspect the generated migration if regenerated. It must remain additive except for the `DROP INDEX` index swap; no `DROP TABLE`, `DROP COLUMN`, or data rewrite should appear.
