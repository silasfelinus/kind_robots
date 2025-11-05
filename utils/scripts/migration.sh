#!/bin/bash
# /utils/scripts/migration.sh
set -euo pipefail

MIGRATION_NAME="${1:-manual_update}"
TS=$(date +%Y%m%d%H%M%S)
MIGR="${TS}_${MIGRATION_NAME}"

echo "📜 Generating migration: $MIGR"
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > migration.sql

echo "🧠 Applying migration..."
npx prisma db execute --file migration.sql --schema prisma/schema.prisma > /dev/null

echo "📁 Saving migration folder..."
mkdir -p "prisma/migrations/${MIGR}"
mv migration.sql "prisma/migrations/${MIGR}/migration.sql"
npx prisma migrate resolve --schema=prisma/schema.prisma --applied "${MIGR}" > /dev/null

echo "⚙️ Regenerating Prisma client..."
npx prisma generate > /dev/null

echo "✅ Migration complete: ${MIGR}"
