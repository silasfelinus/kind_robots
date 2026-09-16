import assert from 'node:assert/strict'
import { loraStackCfgCeiling } from '../loraCfg'

assert.equal(loraStackCfgCeiling(10, []), 10)
assert.equal(loraStackCfgCeiling(10, [null, undefined]), 10)
assert.equal(loraStackCfgCeiling(10, [13, 7, 9]), 7)
assert.equal(loraStackCfgCeiling(10, [13, 12]), 10)
assert.equal(loraStackCfgCeiling(10, [0, -2, Number.NaN, Number.POSITIVE_INFINITY, 8]), 8)

console.log('LoRA cfg ceiling contract verified')
