import assert from 'node:assert/strict'
import {
  adjacentChannelIndex,
  canScrollVertically,
} from '../channelWheelNavigation'

const scroll = (scrollTop: number, scrollHeight = 1600, clientHeight = 600) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
})

assert.equal(canScrollVertically(scroll(200), 100), true, 'wheel down scrolls within the gallery')
assert.equal(canScrollVertically(scroll(200), -100), true, 'wheel up scrolls within the gallery')
assert.equal(canScrollVertically(scroll(1000), 100), false, 'wheel down can cross at the bottom')
assert.equal(canScrollVertically(scroll(0), -100), false, 'wheel up can cross at the top')
assert.equal(canScrollVertically(scroll(0, 400, 600), 100), false, 'a short gallery can cross channels')
assert.equal(canScrollVertically(scroll(1), -100), false, 'subpixel top jitter is ignored')
assert.equal(canScrollVertically(scroll(999), 100), false, 'subpixel bottom jitter is ignored')
assert.equal(canScrollVertically(scroll(200), 0), false, 'zero wheel movement has no scroll')

assert.equal(adjacentChannelIndex(1, 3, 120), 2, 'down reaches the next channel')
assert.equal(adjacentChannelIndex(1, 3, -120), 0, 'up reaches the previous channel')
assert.equal(adjacentChannelIndex(0, 3, -120), null, 'first channel has no predecessor')
assert.equal(adjacentChannelIndex(2, 3, 120), null, 'last channel has no successor')
assert.equal(adjacentChannelIndex(-1, 3, 120), null, 'unknown channel is ignored')
assert.equal(adjacentChannelIndex(0, 0, 120), null, 'no visible channels is safe')
assert.equal(adjacentChannelIndex(1, 3, 0), null, 'zero wheel movement is ignored')

console.log('Channel wheel navigation checks passed')
