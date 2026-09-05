// /scripts/generate_facet_art.ts
//
// Stable entrypoint for Facet catalog artwork. Keep automation and operator
// commands pointed here while the implementation version remains explicit and
// auditable in generate_facet_art_v4.ts.

import { fileURLToPath } from 'node:url'
import { main } from './generate_facet_art_v4'

export * from './generate_facet_art_v4'

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
