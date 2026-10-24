// Editorial transcripts for Ecotone mysteries: the full case script, then real
// seeded playthroughs (true path to every Real Ending, a cold case, a walk-away),
// read through the engine exactly as a player meets them.
//   npx tsx utils/scripts/ecotoneMysteryTranscript.ts <case-id|all> [--out dir]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  advance,
  cardAsides,
  cardBody,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  findCard,
  type RunState,
} from '../ecotone/engine'
import type { EventId } from '../ecotone/content'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import {
  MYSTERIES,
  caseNumeral,
  mysteryCardMeta,
  mysteryEnding,
  mysteryPasses,
  type Mystery,
} from '../ecotone/mysteries'

type Pick = (state: RunState, cardId: string) => string | undefined

function play(
  seed: number,
  event: EventId,
  mystery: Mystery,
  pick: Pick,
  follow = true,
  area = 0,
) {
  let state = advance(chooseEvent(createRun(seed, 'local', mystery.id), event))
  const lines: string[] = []
  for (let guard = 0; guard < 120 && state.phase !== 'end'; guard += 1) {
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[0]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, follow))
      continue
    }
    const card = findCard(state.card)!
    const meta = mysteryCardMeta(card.id)
    const choices = openingLensChoices(card).filter((c) => !c.locked)
    const choiceId =
      pick(state, card.id) ??
      (choices.some((c) => c.prospect)
        ? choices[area % choices.length]
        : undefined
      )?.id ??
      (choices.find((c) => c.meet === true) ?? choices[0])!.id
    const choice = choices.find((c) => c.id === choiceId) ?? choices[0]!
    if (meta) {
      lines.push(
        `\n### ${card.id} · ${card.title} (${card.place}) · day ${state.day}`,
      )
      if (meta.message)
        lines.push(
          `> ${meta.message.medium.toUpperCase()} from ${meta.message.from}:`,
          ...meta.message.lines.map((l) => `> ${l}`),
        )
      lines.push(...cardBody(card, state), ...cardAsides(card, state))
      lines.push(
        `Options: ${choices
          .map(
            (c) =>
              `${c.label}${c.check ? ` [${c.check.skill} ${c.check.target}]` : ''}`,
          )
          .join(' | ')}`,
      )
    }
    const next = chooseBeat(state, choice.id)
    if (meta) {
      const entry = next.pending?.entry
      const roll = entry?.roll
      lines.push(
        `**Chose:** ${choice.label}${roll ? ` — rolled ${roll.dice.join('+')}${roll.bonus ? ` ${roll.bonus > 0 ? '+' : ''}${roll.bonus}` : ''} = ${roll.total} vs ${roll.target}: ${roll.success ? 'PASS' : 'FAIL'}` : ''}`,
        entry?.text ?? '',
      )
    } else if (lines.length && !lines.at(-1)?.startsWith('(')) {
      lines.push(`(… the weekend continues: ${card.title})`)
    }
    state = advance(next)
  }
  return { state, lines }
}

function caseScript(mystery: Mystery): string {
  const out = [
    `# Case ${caseNumeral(mystery.number)}: ${mystery.title}`,
    `Region: ${mystery.region}`,
    `Tagline: ${mystery.tagline}`,
    `Hook: ${mystery.hook}`,
    `Provenance: ${mystery.provenance}`,
  ]
  return out.join('\n')
}

function leafPaths(mystery: Mystery): string[][] {
  return mystery.reveal.choices.flatMap((choice) =>
    choice.next
      ? mystery.branches[choice.next]!.choices.map((leaf) => [
          choice.id,
          leaf.id,
        ])
      : [[choice.id]],
  )
}

function seedFor(
  mystery: Mystery,
  want: (passes: number) => boolean,
  event: EventId = 'quiet',
  follow = true,
  area = 0,
) {
  for (let seed = 1; seed < 2000; seed += 1) {
    const { state } = play(
      seed,
      event,
      mystery,
      (_s, id) =>
        mysteryCardMeta(id)?.kind === 'gate'
          ? findCard(id)!.choices[0]!.id
          : undefined,
      follow,
      area,
    )
    if (want(mysteryPasses(state.flags))) return seed
  }
  return null
}

function transcript(mystery: Mystery): string {
  const parts = [caseScript(mystery)]
  const gateFirst: Pick = (_s, id) =>
    mysteryCardMeta(id)?.kind === 'gate'
      ? findCard(id)!.choices[0]!.id
      : undefined
  const truth = seedFor(mystery, (p) => p >= 2)
  if (truth !== null) {
    leafPaths(mystery).forEach((path, index) => {
      const queue = [...path]
      const event = (['quiet', 'green-ribbon', 'kinetic'] as EventId[])[
        index % 3
      ]!
      const area = index
      const follow = index % 2 === 1
      const leafSeed =
        seedFor(mystery, (p) => p >= 2, event, follow, area) ?? truth
      const { state, lines } = play(
        leafSeed,
        event,
        mystery,
        (s, id) => {
          const kind = mysteryCardMeta(id)?.kind
          if (kind === 'reveal' || kind === 'branch') return queue.shift()
          return gateFirst(s, id)
        },
        follow,
        area,
      )
      parts.push(
        `\n## Playthrough ${index + 1}: true path via ${path.join(' > ')} (${event}, seed ${leafSeed}, lead: ${state.activeLead ?? 'alone'}) → ${mysteryEnding(state)?.title ?? 'no ending'}`,
        ...lines,
      )
    })
  }
  const cold = seedFor(mystery, (p) => p < 2, 'green-ribbon', false)
  if (cold !== null) {
    const { lines } = play(cold, 'green-ribbon', mystery, gateFirst, false)
    parts.push(
      `\n## Playthrough: the trail goes cold (green-ribbon, seed ${cold})`,
      ...lines,
    )
  }
  const { lines } = play(7, 'kinetic', mystery, (_s, id) =>
    mysteryCardMeta(id)?.gate === 1 ? 'decline' : undefined,
  )
  parts.push(`\n## Playthrough: walking away at Gate I (kinetic)`, ...lines)
  parts.push(
    '\n## Every way the Gate III trap can miss, then the reveal after a miss',
    'Each Gate III failure below is followed by the same reveal.afterMiss body; both must read true together.',
  )
  for (const approach of mystery.gates[2].approaches)
    parts.push(
      `\n**Gate III failed via “${approach.label}”:** ${approach.failure.text}`,
      ...Object.entries(mystery.reveal.recall ?? {})
        .filter(([key]) => key === `g3:${approach.id}` || key === 'g3:fail')
        .map(([key, text]) => `(recall ${key}) ${text}`),
    )
  parts.push(
    '\n**Reveal after a miss (afterMiss):**',
    ...mystery.reveal.afterMiss,
  )
  return parts.join('\n')
}

const target = process.argv[2] ?? 'all'
const outIndex = process.argv.indexOf('--out')
const outDir = outIndex > 0 ? process.argv[outIndex + 1] : null
for (const mystery of MYSTERIES.filter(
  (m) => target === 'all' || m.id === target,
)) {
  const text = transcript(mystery)
  if (outDir) {
    mkdirSync(outDir, { recursive: true })
    writeFileSync(
      join(
        outDir,
        `${String(mystery.number).padStart(2, '0')}-${mystery.id}.md`,
      ),
      text,
    )
    console.log(`${mystery.id}: ${text.split(/\s+/).length} words`)
  } else console.log(text)
}
