from __future__ import annotations

import re
from pathlib import Path

SCHEMA_PATH = Path("prisma/schema.prisma")

COMPONENT_STATUS_ENUM = """enum ComponentStatus {
  UNREVIEWED
  WORKING
  NEEDS_CONTEXT
  UNDER_CONSTRUCTION
  BROKEN
  RETIRED
  PREVIEW_UNSUPPORTED
}
"""

COMPONENT_MODEL = """model Component {
  id                Int             @id @default(autoincrement())
  createdAt         DateTime        @default(now())
  updatedAt         DateTime?       @default(now()) @updatedAt
  folderName        String
  componentName     String          @unique
  isWorking         Boolean         @default(true)
  underConstruction Boolean         @default(false)
  isBroken          Boolean         @default(false)
  slug              String?         @unique @db.VarChar(255)
  sourcePath        String?         @db.VarChar(1024)
  sourceKey         String?         @unique @db.VarChar(1024)
  sourceHash        String?         @db.VarChar(64)
  status            ComponentStatus @default(UNREVIEWED)
  statusReason      String?         @db.Text
  title             String?
  description       String?         @db.Text
  notes             String?
  category          String?         @db.VarChar(255)
  tags              Json?
  previewMode       String?         @db.VarChar(64)
  previewConfig     Json?
  lastSeenAt        DateTime?
  isDiscovered      Boolean         @default(false)
  artImageId        Int?
  ArtImage          ArtImage?       @relation(fields: [artImageId], references: [id])
  Reactions         Reaction[]

  @@index([artImageId], map: "Component_artImageId_fkey")
  @@index([status])
  @@index([sourcePath])
  @@index([lastSeenAt])
  @@index([isDiscovered])
}
"""


def main() -> None:
    source = SCHEMA_PATH.read_text(encoding="utf-8")

    model_pattern = re.compile(
        r"model Component \{.*?\n\}\n\n/// A Dream",
        flags=re.DOTALL,
    )
    replacement = f"{COMPONENT_MODEL}\n/// A Dream"
    updated, replacements = model_pattern.subn(replacement, source, count=1)

    if replacements != 1:
        raise RuntimeError(
            f"Expected exactly one Component model replacement; found {replacements}."
        )

    if "enum ComponentStatus {" not in updated:
        updated = updated.rstrip() + "\n\n" + COMPONENT_STATUS_ENUM

    SCHEMA_PATH.write_text(updated, encoding="utf-8")


if __name__ == "__main__":
    main()
