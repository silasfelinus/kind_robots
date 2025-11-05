# 1) Create SQL from live DB vs schema (no shadow)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel   prisma/schema.prisma \
  --script > migration.sql

# 2) Apply it to the DB (reads .env via --schema)
npx prisma db execute --file migration.sql --schema prisma/schema.prisma

# 3) Record it as a proper migration folder
TS=$(date +%Y%m%d%H%M%S); MIGR="${TS}_smartIcon_better_nav"
mkdir -p prisma/migrations/"$MIGR"
mv migration.sql prisma/migrations/"$MIGR"/migration.sql
npx prisma migrate resolve --schema=prisma/schema.prisma --applied "$MIGR"

# 4) Regenerate + sanity check
npx prisma generate
npx prisma migrate status --schema=prisma/schema.prisma
