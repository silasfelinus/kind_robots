// /utils/scripts/verifyCthulhuquariumSettings.test.ts
//
// cthulhuquarium/t-100: the settings panel's stored values are read
// defensively, so a corrupted or old localStorage entry can never break the
// game or set an impossible value.
import assert from 'node:assert/strict'

import {
  CTHULHUQUARIUM_DEFAULT_SETTINGS as DEFAULT_SETTINGS,
  readCthulhuquariumSettings as readSettings,
} from '../cthulhuquariumSettings.js'

assert.deepEqual(readSettings(null), DEFAULT_SETTINGS)
assert.deepEqual(readSettings('not json'), DEFAULT_SETTINGS)
assert.deepEqual(readSettings('{"volume": 7}').volume, 1, 'volume clamps')
assert.equal(readSettings('{"volume": -2}').volume, 0)
assert.equal(readSettings('{"textSpeed": "ludicrous"}').textSpeed, 'normal')
assert.equal(readSettings('{"textSpeed": "instant"}').textSpeed, 'instant')
assert.equal(readSettings('{"motion": "reduced"}').motion, 'reduced')
assert.equal(readSettings('{"motion": 3}').motion, 'system')
assert.equal(readSettings('{"largeText": "yes"}').largeText, false)
assert.equal(readSettings('{"highContrast": true}').highContrast, true)
console.log('✅ readSettings: every stored value is validated or defaulted')
