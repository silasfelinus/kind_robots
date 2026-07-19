import { readFileSync, writeFileSync } from 'node:fs'

const path = '.github/workflows/contract-tests.yml'
const source = readFileSync(path, 'utf8')
const newline = source.includes('\r\n') ? '\r\n' : '\n'
const normalized = source.replace(/\r\n/g, '\n')
const target = `      - name: Database pool defaults contract
        run: npm run test:database-pool-defaults

      - name: Known failed Prisma migration repair contract`
const replacement = `      - name: Database pool defaults contract
        run: npm run test:database-pool-defaults

      - name: Dream store fetch merge contract
        run: npx tsx utils/scripts/verifyDreamStoreFetchMerge.ts

      - name: Known failed Prisma migration repair contract`

if (!normalized.includes(target)) {
  throw new Error(`Expected Dream contract insertion anchor was not found in ${path}.`)
}

writeFileSync(
  path,
  normalized.replace(target, replacement).replace(/\n/g, newline),
  'utf8',
)
