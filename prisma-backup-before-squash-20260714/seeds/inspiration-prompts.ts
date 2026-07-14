// prisma/seeds/inspiration-prompts.ts
// Run: npx ts-node prisma/seeds/inspiration-prompts.ts
// Or call seedInspirationPrompts() from your main seed script.
import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

interface InspirationEntry {
  imagePath: string
  artPrompt: string
}

function t(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

const INSPIRATIONS: InspirationEntry[] = [
  // sketchy
  {
    imagePath: 'public/images/artcollections/sketchy/sketchy-inspiration-01.webp',
    artPrompt: t('A luminous sketch-practice room where simple shapes become confident character drawings on floating transparent layers, an encouraging tiny robot art coach gesturing toward the next exercise, premium cozy creative-tool concept art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/sketchy/sketchy-inspiration-02.webp',
    artPrompt: t('Close-up of a tactile sketchbook page with graphite studies, eraser crumbs, gesture thumbnails, and one charming character breaking out of the page into the real desk light, crisp professional illustration, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/sketchy/sketchy-inspiration-03.webp',
    artPrompt: t('A friendly critique interface imagined as physical art objects: pinned sketches, color chips, tiny spark badges, and a pencil companion guiding improvement without judgment, polished product key art, no text, no collage'),
  },
  // art-generator-connect
  {
    imagePath: 'public/images/artcollections/art-generator-connect/art-generator-connect-inspiration-01.webp',
    artPrompt: t('A conductor-like robot routing prompt cards through glowing image machines into neatly labeled visual asset folders, cinematic creative pipeline energy without readable UI text, professional sci-fi product art, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/art-generator-connect/art-generator-connect-inspiration-02.webp',
    artPrompt: t('Macro view of generated thumbnails crystallizing from light inside transparent tubes, each landing into a project collection tray, premium post-Flux image-generation visual metaphor, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/art-generator-connect/art-generator-connect-inspiration-03.webp',
    artPrompt: t('A calm operations desk where failed placeholders are transformed into finished art assets by small robot technicians and luminous validation rails, crisp studio illustration, no text, no collage'),
  },
  // storymaker
  {
    imagePath: 'public/images/artcollections/storymaker/storymaker-inspiration-01.webp',
    artPrompt: t('A tabletop map blooming into multiple possible scenes at once: forest, airship, castle, sea cave, and dragon trail, with players shaping the story through glowing choice tokens, high-end cozy fantasy game art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/storymaker/storymaker-inspiration-02.webp',
    artPrompt: t('A robot narrator opening a starry book while diverse adventurers step from the pages into a shared world, expressive character design and cinematic depth, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/storymaker/storymaker-inspiration-03.webp',
    artPrompt: t('A branching story tree made of portals and miniature scenes, each branch held by different hands, paws, claws, and robot fingers, polished collaborative storytelling key art, no text, no collage'),
  },
  // media-watchlist
  {
    imagePath: 'public/images/artcollections/media-watchlist/media-watchlist-inspiration-01.webp',
    artPrompt: t('A personal media observatory where books, films, games, comics, and podcasts orbit as glowing constellations around a calm archive console, diverse fans browsing together, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/media-watchlist/media-watchlist-inspiration-02.webp',
    artPrompt: t('A cozy reading-and-watch room with story portals opening from shelves into tiny genre worlds, polished editorial app art, warm lighting, no readable titles, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/media-watchlist/media-watchlist-inspiration-03.webp',
    artPrompt: t('A decade-spanning memory timeline rendered as an elegant knowledge atlas, with media objects becoming paths through a cross-dimensional library, no text, no collage'),
  },
  // conductor-app
  {
    imagePath: 'public/images/artcollections/conductor-app/conductor-app-inspiration-01.webp',
    artPrompt: t('Mobile and desktop dashboards as physical glass cards floating above a command table, agent status pulses and approval tokens moving between screens, futuristic productivity key art, no readable UI text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/conductor-app/conductor-app-inspiration-02.webp',
    artPrompt: t('A diverse multi-species operations crew coordinating project cards from phones, tablets, and desktop monitors, calm high-stakes command-center mood, premium app launch art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/conductor-app/conductor-app-inspiration-03.webp',
    artPrompt: t('Close-up of a hand approving a glowing project card while tiny robot agents carry subtasks into folders and checklists, crisp tactile product illustration, no readable text, no collage'),
  },
  // alexa-integration
  {
    imagePath: 'public/images/artcollections/alexa-integration/alexa-integration-inspiration-01.webp',
    artPrompt: t('Luminous voice ribbons traveling from a smart speaker through a home server into project cards, todos, approvals, and art requests, cinematic smart-home automation art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/alexa-integration/alexa-integration-inspiration-02.webp',
    artPrompt: t('Cozy workshop bench with a relay box, tidy cables, glowing audio waveforms, and household helpers testing hands-free task control, practical hacker-home charm, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/alexa-integration/alexa-integration-inspiration-03.webp',
    artPrompt: t('A cross-room home automation scene where spoken requests become gentle light paths connecting family spaces, maker tools, and Conductor workflows, warm polished product art, no text, no collage'),
  },
  // approval-portal
  {
    imagePath: 'public/images/artcollections/approval-portal/approval-portal-inspiration-01.webp',
    artPrompt: t('A calm glass-enclosed decision chamber where project cards, pitch proposals, and progress rings float above a single approval console; a lone operator navigates quietly between options, cinematic productivity key art, no readable text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/approval-portal/approval-portal-inspiration-02.webp',
    artPrompt: t('Close-up of a confident approval gesture over a glowing project card stack, nearby thumbnails show PR diffs, roadmaps, and achievement rings, premium editorial software art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/approval-portal/approval-portal-inspiration-03.webp',
    artPrompt: t('A control room scene where approved and rejected cards flow into orderly git history stacks, a robot archivist logs each decision as a crystalline commit record, polished software product illustration, no text, no collage'),
  },
  // brainstorm
  {
    imagePath: 'public/images/artcollections/brainstorm/brainstorm-inspiration-01.webp',
    artPrompt: t('A luminous idea factory where concept sparks become fully-formed pitch cards sorted by category — products, content, revenue, upgrades — diverse robots and humans collaborating in a warm creative engine space, premium product art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/brainstorm/brainstorm-inspiration-02.webp',
    artPrompt: t('A diverse voting circle of humans, robots, and creatures casting approval tokens toward rising pitch proposals in a warm strategic planning space, polished collaborative product illustration, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/brainstorm/brainstorm-inspiration-03.webp',
    artPrompt: t('Close-up of AI-generated ideas crystallizing from light into tangible product concepts and content series cards on a reviewer\'s desk, cinematic creative technology art, no text, no collage'),
  },
  // coat-dance
  {
    imagePath: 'public/images/artcollections/coat-dance/coat-dance-inspiration-01.webp',
    artPrompt: t('An expressive stage where coats and garments choreograph themselves into sweeping abstract dance formations, luminous movement trails, high-fashion surrealism, editorial art direction, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/coat-dance/coat-dance-inspiration-02.webp',
    artPrompt: t('A behind-the-scenes creative atelier where a director and ensemble craft the coat-dance concept, mood boards and fabric swatches pinned under warm studio lighting, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/coat-dance/coat-dance-inspiration-03.webp',
    artPrompt: t('A surreal cityscape where figure and coat become one flowing performance across rooftops, bridges, and courtyards, cinematic dance film visual language, no text, no collage'),
  },
  // conductor
  {
    imagePath: 'public/images/artcollections/conductor/conductor-inspiration-01.webp',
    artPrompt: t('An elevated conductor\'s podium overlooking a vast agent network, robot workers and AI threads streaming across a luminous stage under precise baton direction, orchestral metaphor for software coordination, cinematic art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/conductor/conductor-inspiration-02.webp',
    artPrompt: t('A living dependency graph rendered as interconnected glowing orbs and task bridges, agents claiming and completing work nodes in real time, futuristic project management visualization art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/conductor/conductor-inspiration-03.webp',
    artPrompt: t('A control tower where a calm AI director dispatches Workers, receives Reviewer signals, and escalates one glowing task to a lit human desk, premium sci-fi ops center art, no text, no collage'),
  },
  // digital-storefront
  {
    imagePath: 'public/images/artcollections/digital-storefront/digital-storefront-inspiration-01.webp',
    artPrompt: t('A gleaming multi-genre digital marketplace where product tiles for printables, courses, and digital goods float in elegant showcase columns, diverse shoppers and creator-robots browsing, premium e-commerce product art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/digital-storefront/digital-storefront-inspiration-02.webp',
    artPrompt: t('A content creation pipeline room where raw ideas on one wall become finished digital products on the other through illustrated production stages, satisfying factory-to-shelf visual storytelling, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/digital-storefront/digital-storefront-inspiration-03.webp',
    artPrompt: t('A marketing launch scene with glowing channel portals opening as polished digital products travel through them into growing audience clusters, cinematic digital marketing art, no text, no collage'),
  },
  // humboldt-scoop
  {
    imagePath: 'public/images/artcollections/humboldt-scoop/humboldt-scoop-inspiration-01.webp',
    artPrompt: t('A bright professional yard-care crew finishing a clean sweep of a sunny residential property while pets play freely in the background, warm neighborhood service art with a friendly team of varied ages and backgrounds, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/humboldt-scoop/humboldt-scoop-inspiration-02.webp',
    artPrompt: t('Happy dogs and cats of every breed enjoying a freshly maintained backyard, playful and expressive character designs, idyllic neighborhood setting, premium pet-friendly service brand illustration, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/humboldt-scoop/humboldt-scoop-inspiration-03.webp',
    artPrompt: t('A cheerful service route map showing scheduled yard visits flowing across a neighborhood grid, tiny crew icons completing each property with satisfaction checkmarks, polished local business illustration, no text, no collage'),
  },
  // humboldt-scoop-cms
  {
    imagePath: 'public/images/artcollections/humboldt-scoop-cms/humboldt-scoop-cms-inspiration-01.webp',
    artPrompt: t('A friendly CMS dashboard rendered as a warm physical desk: customer cards with pet profiles, service calendars, and billing summaries arranged for a smiling service coordinator, premium small business software art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/humboldt-scoop-cms/humboldt-scoop-cms-inspiration-02.webp',
    artPrompt: t('A field tech logs a completed yard visit on a tablet while a dog watches happily nearby, the submission linking to a customer profile with pet records, visit history, and upcoming schedule, polished service app art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/humboldt-scoop-cms/humboldt-scoop-cms-inspiration-03.webp',
    artPrompt: t('A scheduling visualization where recurring service routes ripple across a calendar-map hybrid, crew assignments color-coded, customer preferences noted on each card, satisfying operational clarity art, no text, no collage'),
  },
  // kind-robots
  {
    imagePath: 'public/images/artcollections/kind-robots/kind-robots-inspiration-01.webp',
    artPrompt: t('A grand Kind Robots hub where portals to every project world open across a luminous consortium floor, a diverse array of robots, humans, creatures, and companions navigating between sketching studios, storytelling tables, media archives, and orchestration towers, epic welcome key art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/kind-robots/kind-robots-inspiration-02.webp',
    artPrompt: t('The Kind Robots world-tree: branching platforms where every project is a distinct zone — a pencil tower, a story map table, a film archive, an image factory, a voice relay station — interconnected by glowing paths, premium world-building illustration, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/kind-robots/kind-robots-inspiration-03.webp',
    artPrompt: t('A Kind Robots community gathering where agents, creators, reviewers, and users of all species interact across project portals, trade work tokens, and celebrate shipped achievements, warm cinematic consortium art, no text, no collage'),
  },
  // wishmaster
  {
    imagePath: 'public/images/artcollections/wishmaster/wishmaster-inspiration-01.webp',
    artPrompt: t('A genie-like bot interface glowing with soft warm light where a user speaks a wish and the Wishmaster unfolds it into a glowing project tree: images, text, rewards, and tasks branching outward, cinematic fantasy meets product art, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/wishmaster/wishmaster-inspiration-02.webp',
    artPrompt: t('A modular composition workbench where a diverse team selects output tiles — image cards, text blocks, icon slots, story fragments — snapping them together into a custom generation template, premium interactive product illustration, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/wishmaster/wishmaster-inspiration-03.webp',
    artPrompt: t('A glowing contract materializing between a user and a bot: the wish written in light becomes a project card, ArtImages, Characters, and Rewards orbiting around it into a new dream, cinematic Kind Robots world-building art, no text, no collage'),
  },
  // mermaids-of-venice
  {
    imagePath: 'public/images/artcollections/mermaids-of-venice/mermaids-of-venice-inspiration-01.webp',
    artPrompt: t('Mermaids gliding through the submerged streets of a moonlit Venice, lanterns casting golden ripples across flooded piazzas, gondolas drifting above their tails, lush fantasy editorial illustration, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/mermaids-of-venice/mermaids-of-venice-inspiration-02.webp',
    artPrompt: t('An underwater view of a Venetian canal ceiling — gondola keels, trailing scarves, and bridges silhouetted above while mermaids gather in an ancient mosaic hall below, cinematic fantasy depth, no text, no collage'),
  },
  {
    imagePath: 'public/images/artcollections/mermaids-of-venice/mermaids-of-venice-inspiration-03.webp',
    artPrompt: t('A Carnival scene where mermaids emerge at dusk, masked and costumed among Venetian revelers, seamlessly blending myth and history in luminous pageant key art, no text, no collage'),
  },
]

export async function seedInspirationPrompts() {
  console.log(`Seeding ${INSPIRATIONS.length} inspiration prompts...`)

  for (const entry of INSPIRATIONS) {
    await prisma.prompt.upsert({
      where: {
        // imagePath is not a unique field, so we use a findFirst + create approach
        // Prisma upsert needs a unique field; use a workaround via create-if-not-exists
        id: -1, // dummy — will never match, falls through to create
      },
      // Since imagePath is not @unique, we use findFirst then create
      update: {},
      create: {
        prompt: entry.artPrompt,
        artPrompt: entry.artPrompt,
        imagePath: entry.imagePath,
        artStatus: 'PENDING',
        creationSource: 'AI',
        isPublic: true,
        isActive: true,
        isMature: false,
        userId: 1,
      },
    })
  }

  console.log('Done.')
}

async function main() {
  // Skip prompts that already have this imagePath to avoid duplicates
  for (const entry of INSPIRATIONS) {
    const existing = await prisma.prompt.findFirst({
      where: { imagePath: entry.imagePath },
    })
    if (existing) {
      console.log(`  skip (exists): ${entry.imagePath}`)
      continue
    }
    await prisma.prompt.create({
      data: {
        prompt: entry.artPrompt,
        artPrompt: entry.artPrompt,
        imagePath: entry.imagePath,
        artStatus: 'PENDING',
        creationSource: 'AI',
        isPublic: true,
        isActive: true,
        isMature: false,
        userId: 1,
      },
    })
    console.log(`  seeded: ${entry.imagePath}`)
  }
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
