import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { auditArcadeArt, type ArtRequest } from './lib/arcadeArtAudit'

const args = process.argv.slice(2)
const ledgerFlag = args.indexOf('--ledger')
const ledgerPath = ledgerFlag < 0 ? null : args[ledgerFlag + 1]
if (!ledgerPath || ledgerPath.startsWith('--')) {
  console.error(
    'Usage: npm run audit:arcade-art -- --ledger <conductor/projects/art-prompts.yaml> [--json] [--unrequested]',
  )
  process.exitCode = 2
} else {
  const ledger: unknown = parse(readFileSync(path.resolve(ledgerPath), 'utf8'))
  if (
    !ledger ||
    typeof ledger !== 'object' ||
    !Array.isArray((ledger as { requests?: unknown }).requests)
  )
    throw new Error('Art ledger must contain a requests array')
  const report = auditArcadeArt(
    process.cwd(),
    (ledger as { requests: ArtRequest[] }).requests,
  )
  const sites = args.includes('--unrequested')
    ? report.sites.filter((site) => !site.requests.length)
    : report.sites
  if (args.includes('--json'))
    console.log(JSON.stringify({ ...report, sites }, null, 2))
  else {
    console.log(
      'Code-drawn Arcade art sites; request coverage does not prove delivery or replacement.\n',
    )
    for (const game of report.games) {
      const rows = sites.filter((site) => site.game === game)
      console.log(`${game}: ${rows.length} code-drawn sites`)
      for (const site of rows) {
        const requests = site.requests
          .map(
            (request) =>
              `${request.id} (${request.status}, ArtJob ${request.jobId ?? 'unknown'})`,
          )
          .join(', ')
        console.log(
          `  ${site.source}:${site.line} #${site.symbol} [${site.operations.join(', ')}]${site.functionalUiCandidate ? ' (functional UI candidate)' : ''}`,
        )
        console.log(
          `    ${requests || 'NO MATCHING PAINTED REQUEST; inspect this slot before enqueueing'}`,
        )
        if (site.imagePatterns.length)
          console.log(
            `    runtime image patterns: ${site.imagePatterns.join(', ')}`,
          )
      }
    }
    console.log(
      `\n${report.games.length} cabinets; ${report.sites.length} code-drawn sites; ${report.sites.filter((site) => !site.requests.length).length} without a matching runtime-image request.`,
    )
  }
}
