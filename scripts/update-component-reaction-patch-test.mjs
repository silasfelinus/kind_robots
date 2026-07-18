import { readFileSync, writeFileSync } from 'node:fs'

const testPath = 'cypress/e2e/api/component-reactions.cy.ts'
const testSource = readFileSync(testPath, 'utf8')
const testTarget = `    const patchBody = {
      reactionType: 'BOOED',
      reactionCategory: 'COMPONENT',
      comment: 'Actually, I have second thoughts...',
      rating: 2,
    }`
const testReplacement = `    const patchBody = {
      reactionType: 'BOOED',
      comment: 'Actually, I have second thoughts...',
      rating: 2,
    }`

if (!testSource.includes(testTarget)) {
  throw new Error('Expected component Reaction PATCH test block was not found.')
}

writeFileSync(testPath, testSource.replace(testTarget, testReplacement), 'utf8')

const auditPath = 'docs/architecture/thin-resource-api-audit.md'
const auditSource = readFileSync(auditPath, 'utf8')
const auditTarget = '| Reaction                  | Store sent partial updates while PATCH required type and category, then passed raw `Partial<Reaction>` into Prisma; delete returned fake arrays   | PATCH now accepts only optional type, comment, and rating fields while keeping owner, category, and target immutable. Delete responses use `data: null`, and Cypress covers ownership and partial-update behavior                                           |'
const auditReplacement = '| Reaction                  | Store sent partial updates while PATCH required type and category; generic and target-specific routes passed raw `Partial<Reaction>` into Prisma | Generic PATCH now accepts only optional type, comment, and rating while keeping owner, category, and target immutable. Redundant chat/component PATCH routes were removed; target GET routes remain for hydration                                            |'

if (!auditSource.includes(auditTarget)) {
  throw new Error('Expected Reaction audit row was not found.')
}

writeFileSync(
  auditPath,
  auditSource.replace(auditTarget, auditReplacement),
  'utf8',
)
