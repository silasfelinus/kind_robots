import { readFileSync, writeFileSync } from 'node:fs'

const path = 'cypress/e2e/api/component-reactions.cy.ts'
const source = readFileSync(path, 'utf8')
const target = `    const patchBody = {
      reactionType: 'BOOED',
      reactionCategory: 'COMPONENT',
      comment: 'Actually, I have second thoughts...',
      rating: 2,
    }`
const replacement = `    const patchBody = {
      reactionType: 'BOOED',
      comment: 'Actually, I have second thoughts...',
      rating: 2,
    }`

if (!source.includes(target)) {
  throw new Error('Expected component Reaction PATCH test block was not found.')
}

writeFileSync(path, source.replace(target, replacement), 'utf8')
