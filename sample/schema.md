// @ts-nocheck
/* eslint-disable */
// test-ignore

model Sample {
  id         Int       @id @default(autoincrement())
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  // Content Fields
  title      String    @db.VarChar(255)
  description String?  @db.VarChar(512)
  label      String?   @db.VarChar(255)

  // Optional Settings / Metadata
  isPublic   Boolean   @default(true)
  isMature   Boolean   @default(false)
  type       String?   @db.VarChar(128)
  designer   String?   @default("system") @db.VarChar(255)

  // Relations
  userId     Int?      
  user       User?     @relation(fields: [userId], references: [id])

  imageId    Int?      @unique
  image      ArtImage? @relation(fields: [imageId], references: [id])

  // Relations to other content
  Prompts       Prompt[]     

  @@index([userId])
  @@index([type])
}
