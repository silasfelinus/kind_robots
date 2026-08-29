# Developer notes / command cheatsheet

Working notes for people developing on this repo. Not part of the public README because it's
operational scratch, not an introduction to the project.

## Everyday commands

```bash
# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
npm run start

# Lint + prettier
npm run lint

# Prisma studio (DB browser UI)
npx prisma studio
```

## Database

```bash
# Set up / apply pending migrations
npx prisma db pull
npx prisma migrate dev

# Create a new migration after a schema change
npx prisma migrate dev --name <name>
npx prisma generate
```

### Manual migration-diff fix (when the shadow DB path doesn't apply cleanly)

```bash
# 1) Create SQL from live DB vs schema (no shadow)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel   prisma/schema.prisma \
  --script > migration.sql

# 2) Apply it to the DB (reads .env via --schema)
npx prisma db execute --file migration.sql --schema prisma/schema.prisma

# 3) Record it as a proper migration folder
TS=$(date +%Y%m%d%H%M%S); MIGR="${TS}_<name>"
mkdir -p prisma/migrations/"$MIGR"
mv migration.sql prisma/migrations/"$MIGR"/migration.sql
npx prisma migrate resolve --schema=prisma/schema.prisma --applied "$MIGR"

# 4) Regenerate + sanity check
npx prisma generate
npx prisma migrate status --schema=prisma/schema.prisma
```

## Tests

```bash
# TypeScript/unit tests
npm run test

# Cypress (full suite)
npm run cypress:run

# Cypress (single spec)
npx cypress run --spec "cypress/e2e/api/users.cy.ts"
```

## Assets and one-off scripts

```bash
# Regenerate smart icons
node utils/scripts/updateKindIcons.js

# Convert a folder of images to webp
node ./utils/scripts/convertImagesToWebp.mjs <source-dir> <source-dir>/webp

# Smoke-test the ComfyUI prompt endpoint
curl -X POST "https://kindrobots.org/prompt" \
  -H "Content-Type: application/json" \
  --data-binary @utils/fluxKontext.json
```

## Recovering from a whitespace-only git desync

If `git status` shows the working tree diverged from `origin/main` by whitespace-only churn:

```bash
# Confirm the edits are actually minor before discarding anything
git diff --summary
git diff --check
git diff --ignore-space-at-eol --stat

# Then sync
git fetch origin
git reset --hard origin/main
git clean -fd
git status
```
