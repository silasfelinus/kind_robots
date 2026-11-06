import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  navigationPermissions,
  permissionAllows,
  type NavigationAccessContext,
} from '../../stores/helpers/navigationAccess'

function read(path: string): string {
  return readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
}

function context(
  showMature: boolean,
  isAdmin: boolean,
): NavigationAccessContext {
  return {
    role: isAdmin ? 'ADMIN' : 'USER',
    roles: isAdmin ? ['ADMIN'] : ['USER'],
    isAdmin,
    permissions: navigationPermissions({
      isLoggedIn: true,
      isMember: false,
      isFamily: false,
      showMature,
      isAdmin,
    }),
  }
}

assert.equal(permissionAllows('mature', context(false, true)), false)
assert.equal(permissionAllows('mature', context(true, true)), true)
assert.equal(permissionAllows('mature', context(true, false)), true)
assert.equal(permissionAllows('admin', context(false, true)), true)
assert.equal(permissionAllows('admin', context(true, false)), false)

const api = read('server/api/monstress-convention/access.get.ts')
assert.match(api, /requireAdminApiUser\(event\)/)
assert.match(api, /viewerShowsMature\(auth\.user\)/)
assert.match(api, /Cache-Control', 'private, no-store'/)

const page = read('pages/admin/monstrexx.vue')
assert.match(page, /caseStore\.authorized && user\.isAdmin && user\.showMature/)
assert.match(page, /v-if="!mayPlay"/)
assert.match(page, /<PlaybookKitShell[\s\S]*v-else/)
assert.match(page, /<MonstrexxFront/)
assert.match(page, /monstrexxKitId\(user\.user\?\.id \?\? 0\)/)
assert.match(
  read('pages/admin/monstress-convention.vue'),
  /navigateTo\('\/admin\/monstrexx'/,
)
const tab = read('content/channels/admin/monstress-convention.md')
assert.match(tab, /requiredRole: ADMIN/)
assert.match(tab, /requiredPermission: mature/)
assert.doesNotMatch(tab, /route: \/play\//)
assert.match(tab, /route: \/admin\/monstrexx/)

const project = read('server/utils/conductorMatureProjects.ts')
assert.match(project, /monstress-convention/)
assert.match(project, /viewerShowsMature && \(isPublic \|\| isAdmin\)/)

console.log(
  'Monstress preview access: mature child/admin precedence and route guards passed',
)
