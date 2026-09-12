import assert from 'node:assert/strict'

import {
  hasShallowDuplicateTitleBlock,
  type TemplateNode,
} from './layoutHeaderContract.js'

/*
 * Pins the six fixture cases documented in
 * tests/python/README-layout-header-contract.md against the audited
 * false-positive boundary from docs/interface-vision-t-127-header-audit.md.
 * The real verifier builds these nodes via verifyLayoutContract.ts's own
 * parseTemplate(); these are hand-built to the same { tag, classTokens,
 * children } shape so the detector can be pinned without a template string.
 */
function node(
  tag: string,
  classTokens: string[],
  children: TemplateNode[] = [],
): TemplateNode {
  return { tag, classTokens, children }
}

function page(rootChildren: TemplateNode[]): TemplateNode[] {
  return [node('div', ['kr-page'], rootChildren)]
}

// positive: a shallow page-chrome toolbar with a direct text-3xl font-black
// title plus sibling eyebrow/description copy
const shellToolbarTitle = page([
  node('div', ['kr-toolbar'], [
    node('p', ['text-xs', 'uppercase'], []),
    node('p', ['text-3xl', 'font-black'], []),
    node('p', ['text-sm'], []),
  ]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(shellToolbarTitle),
  true,
  'shallow toolbar title + eyebrow/description should be flagged',
)

// positive: the same shape with responsive md:text-2xl title sizing
const responsiveShellToolbarTitle = page([
  node('div', ['kr-toolbar'], [
    node('p', ['text-xs', 'uppercase'], []),
    node('p', ['md:text-2xl', 'font-black'], []),
  ]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(responsiveShellToolbarTitle),
  true,
  'responsive md:text-2xl title should still be flagged',
)

// negative: a text-3xl font-black runtime profile name nested inside an article
const runtimeProfileNameInArticle = page([
  node('article', [], [
    node('h2', ['text-3xl', 'font-black'], []),
    node('p', [], []),
  ]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(runtimeProfileNameInArticle),
  false,
  'a content-surface <article> title must not be flagged',
)

// negative: a dynamic result title nested inside a section
const dynamicResultTitleInSection = page([
  node('section', [], [
    node('p', ['text-3xl', 'font-black'], []),
    node('p', [], []),
  ]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(dynamicResultTitleInSection),
  false,
  'a content-surface <section> title must not be flagged',
)

// negative: a lone large font-black rank/score value with no sibling copy
const loneRankValue = page([
  node('div', ['kr-rank-tile'], [node('span', ['text-3xl', 'font-black'], [])]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(loneRankValue),
  false,
  'a lone large value with no sibling copy must not be flagged',
)

// negative: a large title inside a kr-panel*/card surface
const titleInsidePanelSurface = page([
  node('div', ['kr-panel-header'], [
    node('p', ['text-3xl', 'font-black'], []),
    node('p', [], []),
  ]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(titleInsidePanelSurface),
  false,
  'a title inside a kr-panel*/card surface must not be flagged',
)

// negative: a hero/CTA block -- large title, description, an icon, and a
// donate button -- says something the shell's own title does not and is not
// a bare eyebrow+title+description toolbar (kind_robots
// components/pages/giving-page.vue, conductor interface-vision/t-127)
const heroWithIconAndCta = page([
  node('div', ['rounded-2xl', 'border', 'bg-primary/10', 'p-6'], [
    node('icon', [], []),
    node('p', ['text-3xl', 'font-black'], []),
    node('p', [], []),
    node('a', ['btn', 'btn-primary', 'btn-lg'], []),
  ]),
])
assert.equal(
  hasShallowDuplicateTitleBlock(heroWithIconAndCta),
  false,
  'a title block that also carries its own icon and CTA button must not be flagged',
)

console.log('layoutHeaderContract.test.ts: all assertions passed')
