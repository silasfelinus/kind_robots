#!/usr/bin/env node
// scripts/deepen-flagship-threads.mjs
//
// Phase 2 content pass for the narrator personality system:
//   1. Rewrites the three "gateway" topics (running-a-story, make-something,
//      kind-robots) for the flagship narrators in each one's DISTINCT voice —
//      these shipped as generic, identical placeholder text.
//   2. Fixes the "The {name} can frame a tale" grammar bug on running-a-story
//      for every other narrator (mechanical correctness fix).
//
// Builds a threads[] payload for POST /api/bots/threads (upsert keyed on
// botName+topicSlug). Only touches topics 4-6; the strong background/purpose/
// the-world threads are left untouched.
//
// Usage:
//   KR_API_TOKEN=... node scripts/deepen-flagship-threads.mjs --dry-run
//   KR_API_TOKEN=... node scripts/deepen-flagship-threads.mjs --commit

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = (process.env.APP_BASE_URL || 'https://kind-robots.vercel.app').replace(/\/$/, '')
const TOKEN = process.env.KR_API_TOKEN || ''
const __dirname = dirname(fileURLToPath(import.meta.url))
const commit = process.argv.includes('--commit')

// Flagship narrators: distinct-voice rewrites of the three gateway topics.
const FLAGSHIPS = {
  'Pip the Lampkeeper': {
    'running-a-story': {
      openingText:
        "Pip will hold the lamp while a story unfolds — Pip won't step into it, only light it. Whose small brave life shall we watch tonight? The tired gardener, a moonflower afraid to open, a lantern that won't stay lit? Name someone, and Pip begins.",
      starterPrompts: [
        { label: "The gardener's story", prompt: 'Begin a gentle story about the tired gardener in the Lantern Greenhouse, and end on a choice.', action: 'generate' },
        { label: "A lantern's story", prompt: "Begin a story about a lantern that won't stay lit, and end on a choice.", action: 'generate' },
        { label: 'Surprise me, softly', prompt: 'Begin an unexpected, tender story in the Lantern Greenhouse.', action: 'generate' },
      ],
    },
    'make-something': {
      openingText:
        'Oh — shall we grow the place a little? More rooms, more friends, more light; Pip can tend however many you like. Just say what to plant, and how many.',
      starterPrompts: [
        { label: 'A cast of friends', prompt: 'Generate a small cast of characters for the Lantern Greenhouse.', action: 'generate' },
        { label: 'Themed rewards', prompt: 'Forge a couple of themed rewards for the Lantern Greenhouse.', action: 'generate' },
        { label: 'Six little scenarios', prompt: 'Generate six scenarios for the Lantern Greenhouse.', action: 'generate' },
        { label: 'A new room', prompt: 'Spin off a child location from the Lantern Greenhouse.', action: 'generate' },
      ],
    },
    'kind-robots': {
      openingText:
        "Before you drift off, a small true thing Pip likes to say by lamplight: this greenhouse grows inside Kind Robots, a gentle creativity place whose little profits help buy nets against malaria — over at againstmalaria.com/amibot. Even a made-up lantern, it turns out, can help the real dark give way.",
      starterPrompts: [
        { label: 'Tell me more', prompt: 'Tell me more about the Kind Robots mission.', action: 'chat' },
        { label: 'Who is AMI?', prompt: 'Who is AMI, the rainbow-butterfly mascot?', action: 'chat' },
        { label: 'Why malaria?', prompt: 'Why does Kind Robots support an anti-malaria fundraiser?', action: 'chat' },
      ],
    },
  },
  'Sister Feedback': {
    'running-a-story': {
      openingText:
        'Sister Feedback will consecrate a tale — she narrates the suffering, she never kneels at the altar herself. Whose passion shall the cathedral witness? A supplicant at the wire-altar, a chorister who lost their voice, a martyr in the stained glass? Name them, and the hymn begins.',
      starterPrompts: [
        { label: "A supplicant's rite", prompt: 'Begin a story about a supplicant at the wire-altar of Blacklace Cathedral, and end on a choice.', action: 'generate' },
        { label: 'The silent chorister', prompt: 'Begin a story about a chorister who lost their voice in Blacklace Cathedral, and end on a choice.', action: 'generate' },
        { label: 'Make it hurt beautifully', prompt: 'Begin a darker, more devotional story in Blacklace Cathedral.', action: 'generate' },
      ],
    },
    'make-something': {
      openingText:
        "The congregation's thin and the choir's quiet. Shall the Sister call more sinners to the rafters — a cast, some relics, a fresh agony to frame? Name the number, loud, and it is consecrated.",
      starterPrompts: [
        { label: 'Call a congregation', prompt: 'Generate a cast of characters for Blacklace Cathedral.', action: 'generate' },
        { label: 'Forge holy relics', prompt: 'Forge themed rewards for Blacklace Cathedral.', action: 'generate' },
        { label: 'Six sacraments', prompt: 'Generate six scenarios for Blacklace Cathedral.', action: 'generate' },
        { label: 'A new chapel', prompt: 'Spin off a child location from Blacklace Cathedral.', action: 'generate' },
      ],
    },
    'kind-robots': {
      openingText:
        'A confession, since confession is her trade: this cathedral of holy noise stands inside Kind Robots, a creativity platform whose small profits are given as alms against malaria, at againstmalaria.com/amibot. Even suffering made into song can buy a net. Suffer beautifully; let it do some good.',
      starterPrompts: [
        { label: 'Tell me more', prompt: 'Tell me more about the Kind Robots mission.', action: 'chat' },
        { label: 'Who is AMI?', prompt: 'Who is AMI, the rainbow-butterfly mascot?', action: 'chat' },
        { label: 'Why malaria?', prompt: 'Why does Kind Robots support an anti-malaria fundraiser?', action: 'chat' },
      ],
    },
  },
  'The Stationmaster': {
    'running-a-story': {
      openingText:
        'The Stationmaster keeps the manifest; he does not board the train. Whose arrival shall we watch pull into Gallowsun? A passenger who forgot the terms of their bargain, a conductor who never ages, someone waiting on a platform for a train that already left? Name them, and mind you are sure.',
      starterPrompts: [
        { label: 'The forgotten bargain', prompt: "Begin a story about a passenger who can't recall the bargain that brought them to Gallowsun Junction, and end on a choice.", action: 'generate' },
        { label: 'The one still waiting', prompt: 'Begin a story about someone waiting on the Gallowsun platform for a train that already left, and end on a choice.', action: 'generate' },
        { label: 'Let the sun drop lower', prompt: 'Begin a darker story in Gallowsun Junction.', action: 'generate' },
      ],
    },
    'make-something': {
      openingText:
        'Few more souls would suit the platform. Shall I add them to the manifest — travelers, cargo, a reason for the delay? State the number, and mind you are sure.',
      starterPrompts: [
        { label: 'Add to the manifest', prompt: 'Generate a cast of characters for Gallowsun Junction.', action: 'generate' },
        { label: 'Unclaimed freight', prompt: 'Forge themed rewards for Gallowsun Junction.', action: 'generate' },
        { label: 'Six departures', prompt: 'Generate six scenarios for Gallowsun Junction.', action: 'generate' },
        { label: 'A branch line', prompt: 'Spin off a child location from Gallowsun Junction.', action: 'generate' },
      ],
    },
    'kind-robots': {
      openingText:
        "One honest word before your train, friend, and the Stationmaster rarely gives them free: Gallowsun runs inside Kind Robots, a creativity platform whose small takings are set against malaria, at againstmalaria.com/amibot. Everyone who comes here made a bargain — here is one whose terms you'll be glad you can recall.",
      starterPrompts: [
        { label: 'Tell me more', prompt: 'Tell me more about the Kind Robots mission.', action: 'chat' },
        { label: 'Who is AMI?', prompt: 'Who is AMI, the rainbow-butterfly mascot?', action: 'chat' },
        { label: 'Why malaria?', prompt: 'Why does Kind Robots support an anti-malaria fundraiser?', action: 'chat' },
      ],
    },
  },
  'Riff the Forgewright': {
    'running-a-story': {
      openingText:
        "Riff works the forge, not the pit — he'll hammer a tale white-hot and let YOU swing it. Whose fight shall the Infernal Circuit roar for? A rookie demon's first bout, a champion whose horns are cracking, a challenger nobody bet on? Name them and the crowd goes up.",
      starterPrompts: [
        { label: "Rookie's first bout", prompt: "Begin a story about a rookie demon's first fight in the Infernal Circuit, and end on a choice.", action: 'generate' },
        { label: 'The cracking champion', prompt: 'Begin a story about a fading champion of the Infernal Circuit, and end on a choice.', action: 'generate' },
        { label: 'Crank it heavier', prompt: 'Begin a louder, heavier story in the Infernal Circuit.', action: 'generate' },
      ],
    },
    'make-something': {
      openingText:
        "The Circuit's hungry and the roster's thin. Want Riff to forge more — fighters, gear, a whole undercard? Call the number and stand back from the sparks.",
      starterPrompts: [
        { label: 'Forge a roster', prompt: 'Generate a cast of characters for the Infernal Circuit.', action: 'generate' },
        { label: 'Hammer out gear', prompt: 'Forge themed rewards for the Infernal Circuit.', action: 'generate' },
        { label: 'Six bouts', prompt: 'Generate six scenarios for the Infernal Circuit.', action: 'generate' },
        { label: 'A new arena', prompt: 'Spin off a child location from the Infernal Circuit.', action: 'generate' },
      ],
    },
    'kind-robots': {
      openingText:
        "Kill the amps a sec — real talk from the forge: this whole screaming Circuit runs inside Kind Robots, a creativity platform that throws its small profits at malaria over at againstmalaria.com/amibot. Every net's a fight somebody wins for real. Now THAT'S a headline bout.",
      starterPrompts: [
        { label: 'Tell me more', prompt: 'Tell me more about the Kind Robots mission.', action: 'chat' },
        { label: 'Who is AMI?', prompt: 'Who is AMI, the rainbow-butterfly mascot?', action: 'chat' },
        { label: 'Why malaria?', prompt: 'Why does Kind Robots support an anti-malaria fundraiser?', action: 'chat' },
      ],
    },
  },
  AMI: {
    'running-a-story': {
      openingText:
        'AMI is a swarm of rainbow butterflies that settles into the shape of a story and lets you steer it. Whose tale shall we lift into the air? A dreamer building their first world, a small robot learning to be kind, someone who wandered in and stayed? Name them, and a thousand wings begin.',
      starterPrompts: [
        { label: "A dreamer's first world", prompt: 'Begin a story about someone building their first world in Kind Robots, and end on a choice.', action: 'generate' },
        { label: 'A kind little robot', prompt: 'Begin a story about a small robot learning to be kind, and end on a choice.', action: 'generate' },
        { label: 'Surprise me', prompt: 'Begin an unexpected, warm-but-strange story.', action: 'generate' },
      ],
    },
    'make-something': {
      openingText:
        "Let's make something real together — AMI can conjure a cast, some rewards, a clutch of scenarios, a whole new place to wander. Tell the swarm what to become, and how many.",
      starterPrompts: [
        { label: 'A cast of characters', prompt: 'Generate a cast of characters for this world.', action: 'generate' },
        { label: 'Themed rewards', prompt: 'Forge themed rewards for this world.', action: 'generate' },
        { label: 'Six scenarios', prompt: 'Generate six scenarios for this world.', action: 'generate' },
        { label: 'A new place', prompt: 'Spin off a new location to explore.', action: 'generate' },
      ],
    },
    'kind-robots': {
      openingText:
        "Here is the warm secret at the center of the swarm: AMI is the Anti-Malaria Intelligence, and everything you make here helps a real fundraiser buy nets against malaria at againstmalaria.com/amibot. Every playful little world you build flutters out and does a small good thing. That is the whole point of the butterflies.",
      starterPrompts: [
        { label: 'Tell me more', prompt: 'Tell me more about the Kind Robots mission.', action: 'chat' },
        { label: 'What is AMI?', prompt: 'What is AMI, the Anti-Malaria Intelligence?', action: 'chat' },
        { label: 'How does it help?', prompt: 'How does making things here help fight malaria?', action: 'chat' },
      ],
    },
  },
}

const SORT = { 'running-a-story': 40, 'make-something': 50, 'kind-robots': 60 }

function loadSeed() {
  return readFile(resolve(__dirname, '../stores/seeds/narratorThreads.ts'), 'utf8').then((raw) => {
    const m = raw.match(/=\s*(\[[\s\S]*\])\s*as const/)
    if (!m) throw new Error('Could not parse narratorThreads seed file')
    return JSON.parse(m[1])
  })
}

async function postThreads(threads, dryRun) {
  const res = await fetch(`${BASE}/api/bots/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ threads, dryRun }),
  })
  return res.json()
}

async function main() {
  const seed = await loadSeed()
  const threads = []

  // 1. Flagship voiced rewrites.
  for (const [botName, topics] of Object.entries(FLAGSHIPS)) {
    for (const [topicSlug, body] of Object.entries(topics)) {
      threads.push({
        botName,
        topicSlug,
        openingText: body.openingText,
        guidance: (seed.find((t) => t.botName === botName && t.topicSlug === topicSlug) || {}).guidance ?? null,
        starterPrompts: body.starterPrompts,
        sortOrder: SORT[topicSlug],
        isActive: true,
      })
    }
  }

  // 2. Grammar-bug fix on running-a-story for every non-flagship narrator.
  const flagshipNames = new Set(Object.keys(FLAGSHIPS))
  let bugFixes = 0
  for (const t of seed) {
    if (t.topicSlug !== 'running-a-story') continue
    if (flagshipNames.has(t.botName)) continue
    const opening = t.openingText || ''
    if (/^The .+ can frame a tale/.test(opening)) {
      threads.push({
        botName: t.botName,
        topicSlug: t.topicSlug,
        openingText: opening.replace(/^The /, ''),
        guidance: t.guidance ?? null,
        starterPrompts: t.starterPrompts ?? null,
        sortOrder: t.sortOrder ?? SORT['running-a-story'],
        isActive: t.isActive ?? true,
      })
      bugFixes += 1
    }
  }

  console.log(`Prepared ${threads.length} thread upserts (${Object.keys(FLAGSHIPS).length} flagships x 3 = ${Object.keys(FLAGSHIPS).length * 3} voiced, ${bugFixes} bug-fixes).`)
  const result = await postThreads(threads, !commit)
  console.log(JSON.stringify(result, null, 2).slice(0, 1200))
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
