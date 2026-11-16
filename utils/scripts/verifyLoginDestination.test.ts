import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  LOGIN_PAGE_TITLE,
  loginPageTitle,
  loginRedirectPath,
} from '../loginDestination'

assert.equal(loginRedirectPath('/play/slime-city'), '/play/slime-city')
assert.equal(loginRedirectPath(['/art-archive?x=1#y']), '/art-archive')
assert.equal(loginRedirectPath('//evil.test/x'), '')
assert.equal(loginRedirectPath('https://evil.test/x'), '')
assert.equal(loginRedirectPath('/\\evil.test'), '')
assert.equal(loginRedirectPath('/login?redirect=/x'), '')
assert.equal(loginRedirectPath(undefined), '')

assert.equal(loginPageTitle(''), LOGIN_PAGE_TITLE)
assert.equal(
  loginPageTitle('Slime City'),
  'Sign in to open Slime City | Kind Robots',
)

// The login page must set its own head; the page-store fallback is "Robots".
const page = readFileSync(
  join(process.cwd(), 'components/user/login-page.vue'),
  'utf8',
)
assert.ok(page.includes('useSeoMeta('), 'login page sets its own title')
assert.ok(page.includes('loginRedirectPath('), 'login page reads ?redirect=')
assert.ok(page.includes('destinationTitle'), 'login page names the destination')

console.log('login destination checks passed')
