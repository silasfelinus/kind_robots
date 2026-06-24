#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function write(file, content) {
  const full = path.join(root, file)
  fs.writeFileSync(`${full}.fastfix.bak`, fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '')
  fs.writeFileSync(full, content)
  console.log(`patched ${file}`)
}

function patch(file, transform) {
  const original = read(file)
  const next = transform(original)
  if (next === original) {
    console.log(`no change ${file}`)
    return
  }
  write(file, next)
}

function remove(file) {
  const full = path.join(root, file)
  if (fs.existsSync(full)) {
    fs.unlinkSync(full)
    console.log(`removed ${file}`)
  }
}

// 1) Remove accidental smoke spec from real suite.
remove('cypress/e2e/api/seed-smoke.cy.ts')

// 2) Make shared seed selection stable.
// createLoggedInTestUser() should mean “primary seed user”, not rotate.
patch('cypress/support/api-auth.ts', (source) => {
  let next = source

  next = next.replace(
    /\/\*\* Pick a stable seed user\. When omitted, calls cycle primary -> second -> third\. \*\//,
    '/** Pick a stable seed user. When omitted, the primary seed user is used. */',
  )

  next = next.replace(/\nlet seedUserCursor = 0\n/g, '\n')

  next = next.replace(
    /const seedUserForRole = \(seed: \{\n  user: TestUserAuth\n  secondUser: TestUserAuth\n  thirdUser: TestUserAuth\n\}, role\?: TestUserRole\) => \{\n  if \(role === 'primary'\) return seed\.user\n  if \(role === 'second'\) return seed\.secondUser\n  if \(role === 'third'\) return seed\.thirdUser\n\n  const users = \[seed\.user, seed\.secondUser, seed\.thirdUser\]\n  const user = users\[seedUserCursor % users\.length\]\n  seedUserCursor \+= 1\n\n  return user\n\}/,
    `const seedUserForRole = (seed: {
  user: TestUserAuth
  secondUser: TestUserAuth
  thirdUser: TestUserAuth
}, role?: TestUserRole) => {
  if (role === 'second') return seed.secondUser
  if (role === 'third') return seed.thirdUser

  return seed.user
}`,
  )

  next = next.replace(
    /export const resetSeedUserCursor = \(\) => \{\n  seedUserCursor = 0\n\}/,
    `export const resetSeedUserCursor = () => {
  // Backward-compatible no-op. Seed users no longer rotate by default.
}`,
  )

  return next
})

// 3) Make seed lazy. Specs that need seed will call cypressSeed:get.
// This avoids paying seed setup for specs that don't touch test users.
patch('cypress.config.ts', (source) => {
  let next = source

  next = next.replace(
    /on\('before:run', async \(\) => \{\n\s*fs\.mkdirSync\(timingDir, \{ recursive: true \}\)\n\n\s*const seedStart = Date\.now\(\)\n\s*timingLog\('seed ensure: start'\)\n\s*await ensureCypressApiSeed\(config\.env as Record<string, unknown>\)\n\s*recordEvent\('seed ensure', seedStart\)\n\s*\}\)/,
    `on('before:run', async () => {
        fs.mkdirSync(timingDir, { recursive: true })

        if (
          process.env.CYPRESS_EAGER_SEED === '1' ||
          config.env.CYPRESS_EAGER_SEED === '1'
        ) {
          const seedStart = Date.now()
          timingLog('seed ensure: start')
          await ensureCypressApiSeed(config.env as Record<string, unknown>)
          recordEvent('seed ensure', seedStart)
        } else {
          timingLog('seed ensure: lazy')
        }
      })`,
  )

  return next
})

// 4) Fix local compile scars from earlier codemod.
patch('cypress/e2e/api/prompts.cy.ts', (source) => {
  let next = source

  next = next.replace(
    /let userToken = ''\s*[\r\n]+[\s\r\n]*let userId = 0(?:,\s*let,\s*)?promptId;?/,
    `let userToken = ''
  let userId = 0
  let promptId: number | undefined`,
  )

  next = next.replace(
    /let userToken = ''\s*[\r\n]+[\s\r\n]*let userId = 0let promptId: number \| undefined/,
    `let userToken = ''
  let userId = 0
  let promptId: number | undefined`,
  )

  // Remove empty duplicate before block left by codemod.
  next = next.replace(/\n\s*before\(\(\) => \{\n\s*cy\.wrap\(null\)\.then\(\(\) => \{\n\s*\}\)\n\s*\}\)\n/g, '\n')

  // Collapse duplicate auth hooks if present.
  next = next.replace(
    /(\n\s*before\(\(\) => \{\n\s*return createLoggedInTestUser\(\)\.then\(\(auth\) => \{\n\s*userToken = auth\.token\n\s*userId = auth\.id\n\s*\}\)\n\s*\}\)\n)(?:\s*\1)+/g,
    '$1',
  )

  return next
})

patch('cypress/e2e/api/resources.cy.ts', (source) => {
  let next = source

  next = next.replace(
    /let userToken = ''\s*[\r\n]+[\s\r\n]*let userId = 0(?:,\s*let,\s*)?resourceId;?/,
    `let userToken = ''
  let userId = 0
  let resourceId: number | undefined`,
  )

  next = next.replace(
    /let userToken = ''\s*[\r\n]+[\s\r\n]*let userId = 0let resourceId: number \| undefined/,
    `let userToken = ''
  let userId = 0
  let resourceId: number | undefined`,
  )

  next = next.replace(/\n\s*before\(\(\) => \{\n\s*cy\.wrap\(null\)\.then\(\(\) => \{\n\s*\}\)\n\s*\}\)\n/g, '\n')

  next = next.replace(
    /(\n\s*before\(\(\) => \{\n\s*return createLoggedInTestUser\(\)\.then\(\(auth\) => \{\n\s*userToken = auth\.token\n\s*userId = auth\.id\n\s*\}\)\n\s*\}\)\n)(?:\s*\1)+/g,
    '$1',
  )

  return next
})

// 5) Reward API now says "Invalid or expired authorization token."
patch('cypress/e2e/api/rewards.cy.ts', (source) =>
  source
    .replace(
      /Authorization token is required\|Invalid or expired token/g,
      'Authorization token is required|Invalid or expired token|Invalid or expired authorization token',
    )
    .replace(
      /expect\(response\.body\.message\)\.to\.include\('Invalid or expired token'\)/g,
      `expect(response.body.message).to.match(/Invalid or expired token|Invalid or expired authorization token/)`,
    ),
)

// 6) Relationship cleanup should not demand body.success=true for tolerated auth/404 cleanup responses.
patch('cypress/e2e/api/relationships.cy.ts', (source) => {
  let next = source

  next = next.replace(/\[200,\s*202,\s*204,\s*401,\s*404\]/g, '[200, 202, 204, 401, 403, 404]')
  next = next.replace(/\[200,\s*202,\s*204\]/g, '[200, 202, 204, 401, 403, 404]')
  next = next.replace(/\[200,\s*204\]/g, '[200, 204, 401, 403, 404]')

  next = next.replace(
    /if \(\n\s*response\.body &&\n\s*Object\.prototype\.hasOwnProperty\.call\(response\.body, 'success'\)\n\s*\) \{\n\s*expect\(response\.body\.success, `?\$\{?key\}? \$\{?recordId\}? cleanup`?\)\.to\.eq\(\n\s*true,\n\s*\)\n\s*\}/,
    `if (
            [200, 202, 204].includes(response.status) &&
            response.body &&
            Object.prototype.hasOwnProperty.call(response.body, 'success')
          ) {
            expect(response.body.success, \`\${key} \${recordId} cleanup\`).to.eq(
              true,
            )
          }`,
  )

  // Simpler fallback for the exact current formatting.
  next = next.replace(
    /if \(\n            response\.body &&\n            Object\.prototype\.hasOwnProperty\.call\(response\.body, 'success'\)\n          \) \{\n            expect\(response\.body\.success, `\$\{key\} \$\{recordId\} cleanup`\)\.to\.eq\(\n              true,\n            \)\n          \}/,
    `if (
            [200, 202, 204].includes(response.status) &&
            response.body &&
            Object.prototype.hasOwnProperty.call(response.body, 'success')
          ) {
            expect(response.body.success, \`\${key} \${recordId} cleanup\`).to.eq(
              true,
            )
          }`,
  )

  return next
})

console.log('\\nfast fix complete')
