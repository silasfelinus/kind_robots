import fs from 'node:fs'
import path from 'node:path'

const schemaPath = 'prisma/schema.prisma'
let schema = fs.readFileSync(schemaPath, 'utf8')

function replaceExact(from, to, label) {
  if (!schema.includes(from)) throw new Error(`Missing expected schema fragment: ${label}`)
  schema = schema.replace(from, to)
}

replaceExact('  Components           Component[]\n', '', 'ArtImage.Components reverse relation')
replaceExact('  componentId           Int?\n', '', 'Reaction.componentId field')
replaceExact('  Component             Component?                @relation(fields: [componentId], references: [id])\n', '', 'Reaction.Component relation')
replaceExact('  @@index([componentId], map: "Reaction_componentId_fkey")\n', '', 'Reaction component index')

const componentModel = /\/\/\/ Components track all the components we use making kindrobots[\s\S]*?\nmodel Component \{[\s\S]*?\n\}\n\n(?=\/\/\/ A Dream is the canonical)/
if (!componentModel.test(schema)) throw new Error('Component model block was not found')
schema = schema.replace(componentModel, '')

const componentStatus = /\nenum ComponentStatus \{\n  UNREVIEWED\n  WORKING\n  NEEDS_CONTEXT\n  UNDER_CONSTRUCTION\n  BROKEN\n  RETIRED\n  PREVIEW_UNSUPPORTED\n\}\n/
if (!componentStatus.test(schema)) throw new Error('ComponentStatus enum was not found')
schema = schema.replace(componentStatus, '\n')

for (const forbidden of [
  /model Component\s*\{/,
  /\bcomponentId\s+Int\?/,
  /\bComponent\s+Component\?/,
  /Components\s+Component\[\]/,
  /enum ComponentStatus\s*\{/,
]) {
  if (forbidden.test(schema)) throw new Error(`Schema retirement incomplete: ${forbidden}`)
}

fs.writeFileSync(schemaPath, schema)

const migrationDir = 'prisma/migrations/20260812040500_retire_component_schema'
fs.mkdirSync(migrationDir, { recursive: true })
fs.writeFileSync(
  path.join(migrationDir, 'migration.sql'),
  `-- WonderLab/Component is retired. The 39 checked-in voice-corpus JSON files\n-- are the canonical migration source and do not depend on these database rows.\n\n-- ReviewDraft.componentId is NOT NULL with a RESTRICT FK to Component, so the\n-- draft table must disappear before Component can be dropped.\nDROP TABLE IF EXISTS \`ReviewDraft\`;\n\n-- Component reactions are historical museum reviews. Their useful prose survives\n-- in config/wonderlab-voice-polish-batch-001.json through -039.json.\nDELETE FROM \`Reaction\`\nWHERE \`componentId\` IS NOT NULL\n   OR \`reactionCategory\` = 'COMPONENT';\n\nALTER TABLE \`Reaction\`\n  DROP FOREIGN KEY \`Reaction_componentId_fkey\`;\n\nALTER TABLE \`Reaction\`\n  DROP INDEX \`Reaction_componentId_fkey\`,\n  DROP COLUMN \`componentId\`;\n\nDROP TABLE \`Component\`;\n`,
)

for (const retired of [
  'cypress/e2e/api/component-reactions.cy.ts',
  'utils/scripts/verify-component-canonical-contract.mjs',
  'utils/scripts/verifyComponentCanonicalRuntime.ts',
]) {
  if (fs.existsSync(retired)) fs.rmSync(retired)
}

console.log('Component schema retirement transform applied.')
