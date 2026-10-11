// The cabinet suite runner (runArcadeCabinetSuites.ts) picks this file up by its name, which pins
// the convention: a cabinet's depth-pass tests live in utils/scripts/verifyCabinet<Game>*.test.ts.
import assert from 'node:assert/strict'
import { ARCADE_GAMES } from '../arcade/games'

assert.ok(ARCADE_GAMES.length > 0, 'the cabinet registry loads')
console.log('verifyCabinetRunner: ok')
