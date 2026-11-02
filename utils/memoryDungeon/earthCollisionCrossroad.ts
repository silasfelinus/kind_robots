import { replayEarthJournal } from './earthJournal'
import type { OverworldArt } from './overworldEventCatalog'
import earthCollision from './earthCollision.json'
import {
  earthCollisionHistory,
  recoverEarthCollisionFromJournal,
  type EarthCollisionHistory,
} from './earthCollisionProgress'
import {
  MEMORY_PAIR_ENDINGS,
  chooseMemoryPairEnding,
  completeMemoryExperience,
  type MemoryCampaignProgress,
} from './reimaginerCampaign'

export const EARTH_CROSSROAD_SCENE = {
  title: 'The Evacuation Forecast',
  speaker: 'Morrow, Mara, Oren and the station clerk',
  art: {
    path: '/images/memory-dungeon/e10/evacuation-forecast.webp',
    status: 'placeholder' as OverworldArt['status'],
    prompt:
      'Wide painted dark-fairytale illustration of a midnight city clock tower welded to a fluorescent research office, an evacuation board showing two diverging routes, Morrow and a diverse night shift confronting a glowing predictive machine, commuters waiting beneath forest roots, cinematic warm lanterns and cold blue monitors, no typography',
  },
}

export const EARTH_CROSSROAD_CHOICES = MEMORY_PAIR_ENDINGS.e10.map(
  (choice, index) => ({
    ...choice,
    art: {
      path:
        '/images/memory-dungeon/e10/evacuation-forecast-choice-' +
        (index + 1) +
        '.webp',
      status: 'placeholder' as OverworldArt['status'],
      prompt:
        index === 0
          ? 'Painterly cinematic illustration of Morrow smashing a glowing evacuation prediction ledger while Mara leads workers toward an open fire exit, Oren holds a lantern over a hand-drawn rescue map, lost route diagrams dissolving into autumn leaves, dark fairytale science fantasy, no typography'
          : 'Painterly cinematic illustration of Morrow presenting a redacted evacuation forecast to a circle of consenting workers, Mara posting a witnessed objection, Oren marking safe but longer routes, the night city and Briar roots outside the window, dark fairytale science fantasy, no typography',
    },
  }),
)

type RouteEcho = { opening: string; outcome: string }

const EARTH_ROUTE_ECHOES: Record<string, Record<string, RouteEcho>> = {
  '1,1': {
    'witness-the-guard': {
      opening:
        'Captain Grey arrives with commuters who saw him open the service stair. Their testimony contradicts the forecast that the platform was sealed.',
      outcome:
        'Grey keeps the crossing open as a voluntary escort. The witnesses, not the station computer, decide which names may enter the public rescue log.',
    },
    'hold-the-landing': {
      opening:
        'The quiet escalator landing still shelters families who cannot safely join a rushing evacuation. Grey remains there with the last blankets.',
      outcome:
        'Morrow assigns a staffed return trip to the landing and records the spent supplies. The families are not counted as evacuated until they actually leave.',
    },
  },
  '3,1': {
    'publish-the-forgery': {
      opening:
        'Vesper brings the redacted forged refuge memo. Its false seal is public evidence, but the shelter address remains hidden.',
      outcome:
        'The station clerk attaches the exposed forgery to the review record without revealing the refuge. Vesper must still answer for the first map they sold.',
    },
    'escort-the-moth': {
      opening:
        'The paper moth waits outside with two elected refuge stewards. They will testify in private but refuse to surrender the household list.',
      outcome:
        'Mara accepts a sealed account of the false seal. The refuge stewards retain control of their route, and the public record acknowledges its evidentiary limit.',
    },
  },
  '5,1': {
    'collect-real-consent': {
      opening:
        'Mara brings the actual shift roster. The brass inspector withdrew its invented future hours, but the employer still contests the wages.',
      outcome:
        'The worker board keeps the real signatures separate from the forecast. Mara schedules a wage hearing instead of declaring the unpaid hours settled.',
    },
    'fund-the-walkout': {
      opening:
        'The night crew arrives together with meal vouchers and safe-ride requests. Their collective exit cost supplies and left a wage dispute open.',
      outcome:
        'Oren reserves staffed rides home before reopening the platform. Mara preserves the disputed payroll so solidarity does not become another erased debt.',
    },
  },
  '8,1': {
    'repair-without-exchange': {
      opening:
        'A research technician brings the repaired clock battery. The missing lesson was not sold to make the machine work, and its owner is still owed an answer.',
      outcome:
        'Morrow budgets replacement parts without treating a borrowed memory as payment. The technician keeps the unresolved lesson claim in the witness record.',
    },
    'trace-the-original-gift': {
      opening:
        'The technician found the teacher who first shared the missing lesson. A meeting is possible, but neither memory nor forgiveness can be demanded.',
      outcome:
        'Mara offers a private meeting only if both people agree. The clock remains imperfect, and the forecast cannot count an unaccepted invitation as restitution.',
    },
  },
  '1,3': {
    'landmark-medicine-route': {
      opening:
        'Vesper brings a clinic route marked by public landmarks rather than private doors. Patients have chosen their own escorts and meeting points.',
      outcome:
        'The evacuation keeps those meeting points voluntary. Vesper leaves the private addresses off every published map, even after the corridor straightens.',
    },
    'stabilize-public-exit': {
      opening:
        'A temporary clinic operates at the public underpass stair. The folding corridor is braced, but patients unable to travel still need a return visit.',
      outcome:
        'Oren assigns a staffed return route to the underpass clinic. Morrow records the delay rather than marking the patients safe on the strength of a map.',
    },
  },
  '4,4': {
    'triage-by-medical-need': {
      opening:
        'Imani reaches the tower with a triage record: the oxygen-dependent patient went first, while Char stayed with the people awaiting the lift.',
      outcome:
        'The review board funds a second medical escort. Imani keeps the waiting patients on the active list until the lift actually returns.',
    },
    'build-a-dry-waiting-room': {
      opening:
        'Char and Imani have built a dry pressure vestibule for three patients. The lift is slower, but nobody was ranked by usefulness to the city.',
      outcome:
        'Morrow assigns a relief watch and replacement screens to the vestibule. The slower evacuation remains a cost, not an excuse to erase the patients.',
    },
  },
  '6,5': {
    'witness-chosen-households': {
      opening:
        'Sal arrives with neighbors who volunteered to describe their shared stairwell. The registry spirit can no longer call their friendships borrowed property.',
      outcome:
        'The review board accepts the neighbors as witnesses in their own right. Their spare keys and private relationships stay outside the evacuation inventory.',
    },
    'lease-the-common-stair': {
      opening:
        'Sal carries a temporary common-stair lease that expires at dawn. The paper registry spirit has promised access, not ownership of the people inside.',
      outcome:
        'Morrow schedules a tenant meeting before the lease expires. The evacuation uses the stair tonight without turning a temporary bargain into a permanent claim.',
    },
  },
  '8,7': {
    'keep-uncertain-names': {
      opening:
        'Oren lays out the canal ledger with every unverified name still marked unresolved. The computer cannot turn missing commuters into an empty column.',
      outcome:
        'The search register stays open after the verdict. Scylla refuses to let a floating name tag decide whether Char or any commuter lived or died.',
    },
    'rescue-before-records': {
      opening:
        'Scylla reports two commuters pulled alive from the canal. Her rope crew is still searching, and the rest of the names remain unverified.',
      outcome:
        'The rope crew keeps its rescue shift after the tower decision. Oren records the spent equipment and the people still missing rather than claiming a finished search.',
    },
  },
}

/** Only a replayable walking journal can supply local crisis callbacks. */
function earthCollisionRouteEchoes(journal: unknown): RouteEcho {
  const replayed = replayEarthJournal('e10', journal)
  if (!replayed) return { opening: '', outcome: '' }
  const echoes = Object.entries(EARTH_ROUTE_ECHOES)
    .map(([key, choices]) => choices[replayed.progress.choices[key] ?? ''])
    .filter((echo): echo is RouteEcho => Boolean(echo))
  return {
    opening: echoes.map((echo) => echo.opening).join(' '),
    outcome: echoes.map((echo) => echo.outcome).join(' '),
  }
}

/** The final crisis remembers who actually crossed, not invented witness flags. */
export function earthCollisionCrossroadStory(
  history: EarthCollisionHistory | null,
  verdict?: string,
  journal?: unknown,
): { opening: string; outcome: string } {
  if (!history) return { opening: '', outcome: '' }

  const tideVariants: Record<string, string> = {
    'open-the-tide-gate':
      'The board still marks the train Char died holding open. Scylla has not consented to calling that loss an acceptable efficiency.',
    'seal-the-tide-gate':
      'The sealed-gate commuters remain on the missing-person list. The machine has filed their absence as a completed evacuation.',
    'divert-the-current':
      'The maintenance district the tide swallowed appears as an empty square, although its displaced residents have signed testimony.',
  }
  const tide = tideVariants[history.tideGate]
  const charter =
    history.charter === 'consent'
      ? 'Vesper unfolds a consent-bound Hoshimori charter: even a refuge must let its guests leave.'
      : 'Vesper carries the village open-door charter: a public road is not permission to publish private homes.'
  const officeVariants: Record<string, string> = {
    'translate-shift-oath':
      'Pip brings the translated shift oath; the wolf guards can testify without becoming company property.',
    'redact-and-witness':
      'Pip brings redacted worker testimony; the machine cannot demand the names behind it.',
    'break-midnight-clock':
      'Pip carries the broken midnight clock; its stopped hands expose a missing hour the forecast pretends never existed.',
  }
  const office = officeVariants[history.office]
  if (!tide || !office) return { opening: '', outcome: '' }

  const routeEchoes = earthCollisionRouteEchoes(journal)
  const opening =
    'At the clock tower, the evacuation computer offers Morrow a perfect plan: save the largest number by leaving seventeen night workers behind. Its prediction treats every person as a cost and every unverified address as an empty room. MARA: "It has already written our obituaries. Are we allowed to disagree?" MORROW: "I used to think numbers were kinder than bargains. They are only kinder when someone can challenge them." OREN: "Two roads remain. Neither is free." ' +
    tide +
    ' ' +
    charter +
    ' ' +
    office +
    (routeEchoes.opening ? ' ' + routeEchoes.opening : '')

  const outcome =
    verdict === 'destroy-price-ledger'
      ? 'MORROW: "A forecast is not a warrant." He destroys the machine\'s sacrifice ledger, including the shortcut it predicted through the collapsing district. Mara and Oren escort the seventeen workers along a slower witnessed route; the station clerk keeps the missing-person register open until everyone is accounted for. The city loses its best prediction of the next rupture. Morrow writes down that cost instead of promising a painless victory. ' +
        (history.charter === 'consent'
          ? 'The hearth spirit offers beds without retaining names or restricting departure.'
          : "Vesper posts an open route but refuses to mark the refugees' doors.") +
        ' The tide-gate survivors and losses remain part of the record.'
      : verdict === 'publish-price-ledger'
        ? 'MORROW: "Publish the uncertainty, not the people." Mara convenes a worker review board with a binding right to opt out, while Oren strips private addresses from the forecast and marks each closed shortcut in red. Seventeen workers contest the evacuation ranking and leave by a longer staffed corridor. The disputed prediction survives as evidence, not an order. A clinic transfer is delayed and the station clerk records that debt publicly. ' +
          (history.charter === 'consent'
            ? 'Vesper requires fresh consent before the Hoshimori shelter appears on any map.'
            : "Vesper leaves the village's private household paths off the public chart.") +
          ' Nobody is counted as rescued merely because a spreadsheet says so.'
        : ''
  return {
    opening,
    outcome:
      outcome && routeEchoes.outcome
        ? outcome + ' ' + routeEchoes.outcome
        : outcome,
  }
}

/** A chapter exit is earned from replayed movement, both choices and a final verdict. */
export function concludeEarthCollisionFromJournal(
  campaign: MemoryCampaignProgress,
  journal: unknown,
  hoshimoriSave: unknown,
  briarJournal: unknown,
  verdict: string,
): MemoryCampaignProgress | null {
  if (campaign.completed.includes('e10') || campaign.pairDecisions?.e10)
    return null
  const history = earthCollisionHistory(campaign, hoshimoriSave, briarJournal)
  if (
    !history ||
    !EARTH_CROSSROAD_CHOICES.some((choice) => choice.id === verdict)
  )
    return null
  const replayed = replayEarthJournal('e10', journal)
  if (
    !replayed ||
    replayed.position !== '8,8' ||
    Object.keys(replayed.progress.choices).length < 12 ||
    earthCollision.some(
      (scene) =>
        !scene.choices.some(
          (choice) => choice.id === replayed.progress.choices[scene.key],
        ),
    )
  )
    return null

  const recovered = recoverEarthCollisionFromJournal(
    campaign,
    journal,
    hoshimoriSave,
    briarJournal,
  )
  if (!recovered) return null
  try {
    return completeMemoryExperience(
      chooseMemoryPairEnding(recovered, 'e10', verdict),
      'e10',
    )
  } catch {
    return null
  }
}
