#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'

const files = [
  '.github/workflows/fallback-snapshot.yml',
  '.github/workflows/publish-container.yml',
  '.github/workflows/stored-art-paths.yml',
  'scripts/db-write-repro.mjs',
  'scripts/db-write-smoke.mjs',
  'scripts/run_facet_catalog_maintenance.ts',
  'utils/scripts/auditGalleryChrome.ts',
  'utils/scripts/exportPageBackdropArt.ts',
  'utils/scripts/offloadArtImageData.ts',
  'utils/scripts/repairRewardImagePaths.ts',
  'utils/scripts/seedFacetCatalog.ts',
  'utils/scripts/verifyAdminFlagCasts.ts',
  'utils/scripts/verifyArtImageCaching.ts',
  'utils/scripts/verifyCaptureGroupGuards.ts',
  'utils/scripts/verifyFetchGenericPinning.ts',
  'utils/scripts/verifyNoPrismaJsonCast.ts',
  'utils/scripts/verifyNoPromiseInStoreState.ts',
  'utils/scripts/verifyNoUnquotedReservedWordTables.ts',
]

const replacements = [
  [/kind-robots\.vercel\.app/gi, 'kindrobots.org'],
  [/Vercel serverless/g, 'legacy serverless profile'],
  [/Vercel function invocations/g, 'server function invocations'],
  [/Vercel 503 handler/g, 'production 503 handler'],
  [/Vercel's 307s/g, 'production redirects'],
  [/Vercel env vars/g, 'runtime env vars'],
  [/especially on Vercel,/g, 'especially in a containerized runtime,'],
  [/JWT in Vercel \(or wherever Nuxt is running\)/g, 'JWT in the Nuxt runtime'],
  [/Removed from vercel-build/g, 'Separated from application image builds'],
  [/The old in-build ordering/g, 'The established maintenance ordering'],
  [/scripts\/vercel-build\.mjs/g, 'the deployment build'],
  [/vercel-build\.mjs/g, 'deployment build'],
]

for (const path of files) {
  let source = await readFile(path, 'utf8')
  const before = source
  source = source
    .replace(/^\s*['"]\.vercel['"],?\s*$/gm, '')
    .replace(/,\s*['"]\.vercel['"]/g, '')
  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement)
  }
  if (source !== before) {
    await writeFile(path, source, 'utf8')
    console.log(`updated ${path}`)
  }
}
