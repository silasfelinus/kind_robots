import { createHash } from 'node:crypto'
import {
  decodeMakerLevel,
  type MakerLevel,
} from '~/utils/arcade/games/savePlumberMaker'

/** Hash canonical, validated course contents, never an unverified client ID. */
export function courseFromShareCode(code: unknown): {
  level: MakerLevel
  fingerprint: string
  payload: string
} {
  if (typeof code !== 'string') {
    throw new Error('A valid playable course share code is required.')
  }
  const level = decodeMakerLevel(code)
  const payload = JSON.stringify(level)
  return {
    level,
    payload,
    fingerprint: createHash('sha256').update(payload).digest('hex'),
  }
}
