// @ts-nocheck
/* eslint-disable */
// test-ignore

TEMPLATE — copy this model block into prisma/schema.prisma, rename
Sample → YourModel, then create an additive migration:

  npx prisma migrate dev --name add_your_model
  npx prisma generate

Migration rules (see AGENTS.md): additive-only (CREATE TABLE / ADD COLUMN /
CREATE INDEX / ADD CONSTRAINT). Never edit or rename a migration that may
already be applied anywhere — ship a new one. Never run migrate reset.

model Sample {
  id          Int       @id @default(autoincrement())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime? @default(now()) @updatedAt

  // Content fields — short strings get @db.VarChar sizes, long text @db.Text
  title       String    @db.VarChar(764)
  description String?   @db.Text
  label       String?   @db.VarChar(255)

  // Flags — every user-generated content model carries these two
  isPublic    Boolean   @default(true)
  isMature    Boolean   @default(false)

  // Loose metadata. If a field has a fixed set of values, prefer a real
  // enum (see ChallengeType / ChallengeStatus in schema.prisma).
  type        String?   @db.VarChar(128)
  designer    String?   @default("system") @db.VarChar(255)

  // Owner relation — relation fields are Capitalized in this schema.
  // Guest/system rows use userId 10 (the guest user).
  userId      Int?
  User        User?     @relation(fields: [userId], references: [id])

  // Optional one-to-one art image
  imageId     Int?      @unique
  Image       ArtImage? @relation(fields: [imageId], references: [id])

  @@index([userId])
  @@index([type])
}

Remember the back-relation: the User (and ArtImage) models need a
`Samples Sample[]` line added, or prisma validate will fail.
