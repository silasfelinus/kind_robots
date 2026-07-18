// /utils/scripts/verifyWonderLabUiFixtures.ts
import assert from 'node:assert/strict'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtures'

const editIcon = getWonderLabPreviewFixture('edit-icon')
assert.ok(editIcon?.props?.icon)
assert.equal(editIcon?.props?.allowSave, false)
assert.equal(editIcon?.props?.showFooterActions, false)

const iconDisplay = getWonderLabPreviewFixture('icon-display')
assert.ok(iconDisplay?.props?.icon)
assert.equal(iconDisplay?.props?.allowEditActions, false)
assert.equal(
  (iconDisplay?.props?.icon as { link?: unknown } | undefined)?.link,
  '',
)

const checkpoint = getWonderLabPreviewFixture('checkpoint-card')
assert.ok(checkpoint?.props?.checkpoint)
assert.equal(checkpoint?.props?.showImage, false)
assert.equal(checkpoint?.props?.showReaction, false)
assert.equal(checkpoint?.props?.showSelectButton, false)
assert.equal(checkpoint?.props?.allowSelect, false)

const server = getWonderLabPreviewFixture('server-card')
assert.ok(server?.props?.server)
assert.equal(server?.props?.showActions, false)
assert.equal(server?.props?.showUseButtons, false)
assert.equal(server?.props?.allowEdit, false)
assert.equal(server?.props?.allowTest, false)

const theme = getWonderLabPreviewFixture('theme-card')
assert.equal(theme?.props?.theme, 'cupcake')
assert.equal(theme?.props?.showActions, false)
assert.equal(theme?.props?.showApplyButton, false)
assert.equal(theme?.props?.allowEdit, false)
assert.equal(theme?.props?.allowCopy, false)
assert.equal(theme?.props?.allowApply, false)

const heading = getWonderLabPreviewFixture('section-heading')
assert.equal(typeof heading?.props?.title, 'string')
assert.equal(typeof heading?.props?.hint, 'string')

const flipPanel = getWonderLabPreviewFixture('flip-panel')
assert.ok(flipPanel?.skipReason)
assert.match(flipPanel?.skipReason || '', /slot/i)

console.log('WonderLab UI preview fixture verification passed.')
