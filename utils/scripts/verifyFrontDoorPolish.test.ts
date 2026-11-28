import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { GAME_LINK_PREVIEWS } from '../gameLinkPreview'

const root = process.cwd()
const read = (file: string) => readFileSync(join(root, file), 'utf8')

// 1. Share cards must not promise open access to a page a visitor cannot open.
// Silas, 2026-11-14: share cards match the games as they ship. A route gated
// to ADMIN says "private preview"; one that needs any account says "sign in".
type Gate = { role: string; permission: string }
const gates = new Map<string, Gate>()
const channels = join(root, 'content/channels')
for (const dir of readdirSync(channels)) {
  const folder = join(channels, dir)
  if (!existsSync(folder) || !folder.length) continue
  let files: string[]
  try {
    files = readdirSync(folder).filter((file) => file.endsWith('.md'))
  } catch {
    continue
  }
  for (const file of files) {
    const front =
      readFileSync(join(folder, file), 'utf8').split(/^---$/m)[1] ?? ''
    const route = front.match(/^route: (\S+)$/m)?.[1]
    if (!route) continue
    gates.set(route, {
      role: front.match(/^requiredRole: (\S+)$/m)?.[1] ?? '',
      permission: front.match(/^requiredPermission: (\S+)$/m)?.[1] ?? '',
    })
  }
}

const openPromise =
  /free (to browse|to try|in your browser)|no account needed|open it in your browser/i
let gatedCards = 0
for (const [slug, preview] of Object.entries(GAME_LINK_PREVIEWS)) {
  const gate = gates.get(preview.path ?? `/play/${slug}`)
  if (!gate) continue
  const svgPath = join(root, 'public', slug, 'link-preview.svg')
  const svg = existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : ''
  if (gate.role && gate.role !== 'GUEST') {
    gatedCards++
    assert.doesNotMatch(
      preview.description,
      openPromise,
      `${slug}: admin-only page promises open access`,
    )
    assert.match(
      preview.description,
      /private preview/i,
      `${slug}: say it is a private preview`,
    )
    assert.doesNotMatch(
      svg,
      openPromise,
      `${slug}: card art promises open access`,
    )
  } else if (gate.permission === 'authenticated') {
    gatedCards++
    assert.doesNotMatch(
      preview.description,
      openPromise,
      `${slug}: sign-in page promises open access`,
    )
    assert.match(
      preview.description,
      /sign in/i,
      `${slug}: say it needs a free sign-in`,
    )
    if (svg)
      assert.match(svg, /sign in/i, `${slug}: card art names the sign-in`)
  }
}
assert.ok(
  gatedCards >= 6,
  `expected the gated share cards to be checked, saw ${gatedCards}`,
)

// 2. Dedicated pages never inherit a stale content title or the "Robots" fallback.
const app = read('app.vue')
assert.match(
  app,
  /pageStore\.describesPath\(route\.path\)/,
  'app.vue scopes page titles to the route',
)
assert.match(
  app,
  /title: \(\) => routePageTitle\.value \|\| SITE_NAME/,
  'tab title falls back to the site name',
)
for (const page of ['pages/build-bench.vue', 'pages/shared-with-me.vue']) {
  assert.match(
    read(page),
    /useSeoMeta\(\{\s*title: '[^']+\| Kind Robots'/,
    `${page}: own tab title`,
  )
}

// 3. The homepage mission line wraps on phones instead of cutting off mid-word.
const directory = read('components/home/home-visitor-directory.vue')
const mission = directory.match(/<p\s+class="visitor-mission-line([^"]*)"/)
assert.ok(mission, 'mission line present')
assert.doesNotMatch(
  mission?.[1] ?? '',
  /\btruncate\b/,
  'mission line must not truncate',
)
assert.match(directory, /Helping fund mosquito nets\./)

// 4. /register explains what an account is for in plain words and that the
//    games stay free without one (2026-11-20 PT: the link preview read
//    "Register to unlock ... user navigation, jellybean tracking, prompt
//    retention" under the bare title "Registration").
const register = read('content/register.md')
assert.match(register, /^title: 'Create a free account'$/m)
const registerDescription = register.match(/^description: (.+)$/m)?.[1] ?? ''
assert.match(registerDescription, /free/i)
assert.match(registerDescription, /without one/)
assert.doesNotMatch(
  registerDescription,
  /jellybean|prompt retention|navigation/i,
)

// 5. Share descriptions say what a visitor gets in plain words (2026-11-22
//    PT): Memory Dungeon shared a 250-character pitch ending in "the prompt
//    and art modeller", /art opened with an instruction ("Generate new images
//    first"), Cthulhuquarium hid that playing needs an account, and Zuzu
//    Showdown shared only "Duels with Zuzu and friends."
const pageDescription = (file: string) =>
  read(file).match(/^description: '?(.+?)'?$/m)?.[1] ?? ''
const memoryDescription = pageDescription('content/play/memory.md')
assert.ok(memoryDescription.length <= 160, 'Memory Dungeon description fits')
assert.doesNotMatch(memoryDescription, /modeller|roguelite/i)
assert.match(memoryDescription, /free/i)
const artDescription = pageDescription('content/art.md')
assert.doesNotMatch(artDescription, /^Generate/)
assert.match(artDescription, /sign in/i)
assert.match(pageDescription('content/play/aquarium.md'), /sign in/i)
const showdown = GAME_LINK_PREVIEWS['zuzu-showdown']!.description
assert.doesNotMatch(showdown, /^Duels with Zuzu and friends/)
assert.match(showdown, /fighter/i)

// 6. Plain first-visit copy (2026-11-23 PT): the 404 tab read "Direction",
//    /login promised a "suite of AI-enhanced tools", and the signed-in
//    Jellybeans and Chats pages never said they need a free account.
const notFound = read('content/error.md')
assert.match(notFound, /^title: '?Page not found'?$/m)
assert.match(notFound, /\]\(\/navigation\)/, '404 links to the site map')
const loginDescription = pageDescription('content/login.md')
assert.doesNotMatch(loginDescription, /AI-enhanced|suite of/i)
assert.match(loginDescription, /free/i)
assert.match(loginDescription, /without one/)
for (const file of ['content/achievements.md', 'content/chats.md']) {
  const description = pageDescription(file)
  assert.match(description, /sign in free/i, `${file} says it needs a sign-in`)
  assert.doesNotMatch(description, /delightful quest|digital domains/i)
}
assert.doesNotMatch(pageDescription('content/themes.md'), /plethora|vibe/i)

// 7. Pages linked from the front door describe themselves plainly
//    (2026-11-24 PT): /stories read "A surreal odyssey powered by ChatGPT",
//    /bots "View the many promptbots", the private /dashboard "This is your
//    space!", /login kept placeholder copy ("login and registration link
//    here") and /button's tooltip read "an leadboard race".
const storiesDescription = pageDescription('content/stories.md')
assert.doesNotMatch(storiesDescription, /odyssey|ChatGPT/i)
assert.match(storiesDescription, /Storybook/)
assert.doesNotMatch(pageDescription('content/bots.md'), /promptbots/i)
assert.match(pageDescription('content/dashboard.md'), /sign in free/i)
const login = read('content/login.md')
assert.doesNotMatch(login, /Login here|registration link here/)
const button = read('content/button.md')
assert.doesNotMatch(button, /leadboard|an leaderboard/)
assert.match(pageDescription('content/button.md'), /told not to press/)

// 8. Community and support pages say what they hold (2026-11-25 PT): /giving
//    named only "AMF", /sanctuary listed "mana" with no context, /forum asked
//    visitors to "collide creatively ... or just vibe", /privacy promised only
//    "why we think you'll like it" and /rewards described "prompts that twist
//    the rules of our AI storytelling worlds".
const giving = pageDescription('content/giving.md')
assert.match(giving, /Against Malaria Foundation/)
assert.doesNotMatch(giving, /\bAMF\b/)
assert.match(pageDescription('content/sanctuary.md'), /gift shop/i)
assert.match(pageDescription('content/sanctuary.md'), /forum/i)
assert.doesNotMatch(pageDescription('content/forum.md'), /collide|vibe/i)
const privacy = pageDescription('content/privacy.md')
assert.doesNotMatch(privacy, /you'll like it/i)
assert.match(privacy, /don't sell/i)
assert.doesNotMatch(
  pageDescription('content/rewards.md'),
  /AI storytelling worlds/i,
)

// 9. Member and creator pages say what they do (2026-11-26 PT): /wallet
//    listed "karma" and "mana" with no meaning, /characters promised only
//    "quirks and quests", /dreams spoke of "users" instead of the visitor,
//    /friends said "control blocks" and /messages "consent-aware messaging".
const wallet = pageDescription('content/wallet.md')
assert.match(wallet, /budget you spend to make AI art/)
assert.match(wallet, /Sign in free/)
assert.match(pageDescription('content/characters.md'), /chat with/)
assert.doesNotMatch(pageDescription('content/dreams.md'), /\busers\b/i)
assert.doesNotMatch(pageDescription('content/friends.md'), /control blocks/i)
const messages = pageDescription('content/messages.md')
assert.doesNotMatch(messages, /consent-aware/i)
assert.match(messages, /only friends/)

// 10. Header tooltips match what the page does (2026-11-27 PT): /chats'
//     tooltip promised "the things bots and users have actually said" on a
//     private page of your own chats, /dashboard read "User customizations",
//     /register "Step through the gateway", /forum "let your ideas unfold"
//     and /account described "tune privacy and consent".
const pageTooltip = (file: string) =>
  read(file).match(/^tooltip: '?(.+?)'?$/m)?.[1] ?? ''
assert.match(pageTooltip('content/chats.md'), /your own conversations/)
assert.doesNotMatch(pageTooltip('content/chats.md'), /users have actually said/)
assert.doesNotMatch(pageTooltip('content/dashboard.md'), /User customizations/)
assert.match(pageTooltip('content/register.md'), /free account/)
assert.match(pageTooltip('content/forum.md'), /Start a topic/)
const account = pageDescription('content/account.md')
assert.doesNotMatch(account, /privacy and consent/)
assert.match(account, /Sign in free/)

// 11. Public page tooltips say what a visitor can do (2026-11-28 PT): /bots'
//     tooltip read "generating infinite designer content", /stories "Share in
//     a multiverse of possibilities", /dreams "bend the experience together",
//     /wallet named karma and mana without meaning and /characters promised
//     only "the characters behind the chaos".
const bots = pageTooltip('content/bots.md')
assert.doesNotMatch(bots, /infinite designer content/)
assert.match(bots, /talk with it/)
assert.match(pageTooltip('content/stories.md'), /illustrated Storybook story/)
assert.doesNotMatch(pageTooltip('content/dreams.md'), /bend the experience/)
assert.match(pageTooltip('content/dreams.md'), /other visitors/)
assert.match(pageTooltip('content/wallet.md'), /spend to make AI art/)
const characters = pageTooltip('content/characters.md')
assert.doesNotMatch(characters, /behind the chaos/)
assert.match(characters, /chat with or cast in a story/)

console.log(`front door polish checks passed (${gatedCards} gated share cards)`)
