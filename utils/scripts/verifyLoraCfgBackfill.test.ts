import assert from 'node:assert/strict'
import { ponyCfgFromClipping, PONY_CFG_CLIPPING_CURVE } from '../loraCfg'

assert.equal(ponyCfgFromClipping(Number.NaN), null)
assert.equal(ponyCfgFromClipping(-0.01), null)
assert.equal(ponyCfgFromClipping(0), 3)
assert.equal(ponyCfgFromClipping(0.0011), 3)
assert.equal(ponyCfgFromClipping(0.0539), 13)
assert.equal(ponyCfgFromClipping(0.2), 13)

for (const point of PONY_CFG_CLIPPING_CURVE) {
  assert.equal(ponyCfgFromClipping(point.clippedFraction), point.cfg)
}

assert.equal(ponyCfgFromClipping((0.0203 + 0.0343) / 2), 8)
assert.equal(ponyCfgFromClipping((0.0348 + 0.0487) / 2), 10.5)

console.log('LoRA recommended-CFG backfill interpolation contract passed.')
