// /utils/scripts/verifyChannelLauncher.test.ts
//
// Silas, 2026-11-14: in the desktop nav window the Retired and Storybook
// folders "should be collapsed", and visitors "should be able to scroll to the
// different channels from each other". utils/channelLauncher.ts holds the
// rules; this checks them and that channel-select.vue renders through them.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import {
  channelAtScroll,
  initiallyExpandedSections,
  isCollapsibleSection,
  launcherSectionId,
  launcherSections,
} from '../channelLauncher.js'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '../../stores/helpers/channelContent.js'

function tab(
  channelKey: string,
  tabKey: string,
  options: { parent?: string; route?: string } = {},
): ResolvedTab {
  return {
    channelKey,
    tabKey,
    parentTabKey: options.parent ?? '',
    key: tabKey,
    label: tabKey,
    title: tabKey,
    route: options.route ?? `/${tabKey}`,
    requiredRole: '',
    navigation: true,
  } as ResolvedTab
}

const admin = {
  channelKey: 'admin',
  tabs: [
    tab('admin', 'artjob'),
    tab('admin', 'retired', { route: '' }),
    tab('admin', 'forum', { parent: 'retired' }),
    tab('admin', 'mermaids', { parent: 'retired' }),
  ],
} as ResolvedChannel

const projects = {
  channelKey: 'projects',
  tabs: [
    tab('projects', 'art'),
    tab('projects', 'storybook'),
    tab('projects', 'bots', { parent: 'storybook' }),
    tab('projects', 'characters', { parent: 'storybook' }),
  ],
} as ResolvedChannel

const adminSections = launcherSections(admin)
const retired = adminSections.find(
  (entry) => entry.parent?.tabKey === 'retired',
)
assert.ok(retired, 'Retired renders as its own launcher section')
assert.ok(isCollapsibleSection(retired), 'Retired is a collapsible folder')
assert.deepEqual(
  retired.tabs.map((entry) => entry.tabKey),
  ['forum', 'mermaids'],
  'a route-less parent lists only its children',
)

const projectSections = launcherSections(projects)
const storybook = projectSections.find(
  (entry) => entry.parent?.tabKey === 'storybook',
)
assert.ok(storybook && isCollapsibleSection(storybook))
assert.deepEqual(
  storybook.tabs.map((entry) => entry.tabKey),
  ['storybook', 'bots', 'characters'],
  'a routed parent stays reachable as the first card in its folder',
)
const leaves = projectSections.find((entry) => entry.parent === null)
assert.ok(leaves && !isCollapsibleSection(leaves))
assert.deepEqual(
  leaves.tabs.map((entry) => entry.tabKey),
  ['art'],
)

assert.equal(
  initiallyExpandedSections(projects, tab('projects', 'art')).size,
  0,
  'folders start collapsed',
)
assert.equal(
  initiallyExpandedSections(projects, projects.tabs[1]!).size,
  0,
  'standing on the Storybook parent page does not unfold the folder',
)
assert.deepEqual(
  [...initiallyExpandedSections(projects, projects.tabs[2]!)],
  [launcherSectionId('projects', storybook.key)],
  'the folder holding the current page opens, like the phone menu',
)
assert.equal(initiallyExpandedSections(null, null).size, 0)

const offsets = [
  { channelKey: 'arcade', top: 120 },
  { channelKey: 'projects', top: 900 },
  { channelKey: 'admin', top: 1800 },
]
assert.equal(channelAtScroll(offsets, 0), 'arcade')
assert.equal(channelAtScroll(offsets, 851), 'arcade')
assert.equal(channelAtScroll(offsets, 852), 'projects')
assert.equal(channelAtScroll(offsets, 1752), 'admin')
assert.equal(
  channelAtScroll(offsets, 700, true),
  'admin',
  'a short last channel still lights up once the stage hits bottom',
)
assert.equal(channelAtScroll([], 400), null)
assert.equal(channelAtScroll([], 400, true), null)

const launcher = readFileSync(
  'components/navigation/channel-select.vue',
  'utf8',
)
assert.match(launcher, /v-for="block in channelBlocks"/)
assert.match(launcher, /:data-channel-key="block\.channel\.channelKey"/)
assert.match(launcher, /@scroll\.passive="scheduleScrollSync"/)
assert.match(
  launcher,
  /:aria-expanded="isSectionOpen\(block\.channel, section\)"/,
)
assert.match(launcher, /v-if="isSectionOpen\(block\.channel, section\)"/)
assert.match(launcher, /initiallyExpandedSections\(/)
assert.doesNotMatch(
  launcher,
  /@wheel=/,
  'channels are crossed by ordinary scrolling, not a wheel hand-off',
)
assert.equal(existsSync('utils/channelWheelNavigation.ts'), false)

console.log(
  'Channel launcher contract passed: nested folders start collapsed (unless ' +
    'they hold the current page) and every channel shares one scroll.',
)
