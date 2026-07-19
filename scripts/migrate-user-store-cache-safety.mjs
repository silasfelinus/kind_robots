import { readFileSync, writeFileSync } from 'node:fs'

const path = 'stores/userStore.ts'
const source = readFileSync(path, 'utf8')
const newline = source.includes('\r\n') ? '\r\n' : '\n'
let updated = source.replace(/\r\n/g, '\n')

function replaceExact(target, replacement, label) {
  if (!updated.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  updated = updated.replace(target, replacement)
}

replaceExact(
  `import { performFetch, handleError } from './utils'
import { useAchievementStore } from './achievementStore'`,
  `import { performFetch, handleError } from './utils'
import { mergeRecordsById } from './helpers/recordMerge'
import { useAchievementStore } from './achievementStore'`,
  'user cache merge helper import',
)

replaceExact(
  `        if (response.success && response.data) {
          users.value = response.data
          return users.value
        }

        throw new Error(response.message || 'Failed to fetch users')
      } catch (error) {
        handleError(error, 'fetching users')
        users.value = []
        return []`,
  `        if (response.success && response.data) {
          users.value = mergeRecordsById(users.value, response.data)
          lastError.value = null
          return users.value
        }

        throw new Error(response.message || 'Failed to fetch users')
      } catch (error) {
        handleError(error, 'fetching users')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to fetch users'
        return users.value`,
  'user directory merge and outage preservation',
)

writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
