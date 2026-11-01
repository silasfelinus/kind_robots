import { CAPTAIN_STATS, CREW_PROFILES, type Skill } from './crewAssignments'
import type { PolicyId, VoyageRun } from './rules'

type Meter =
  | 'sanctuary_trust'
  | 'treaty_trust'
  | 'crew_trust'
  | 'ship_fuel'
  | 'antagonist_pressure'
  | 'medical_knowledge'
type ConsequenceOutcome = {
  narrative: string
  flags: string[]
  delta: Partial<Record<Meter, number>>
  callback: string
}
export type ConsequenceChoice = {
  id: string
  label: string
  approach: string
  cost: string
  policy: PolicyId
  check: { ability_any: Skill[]; difficulty: number }
  success: ConsequenceOutcome
  failure: ConsequenceOutcome
}
export type ConsequenceEpisode = {
  id: string
  title: string
  system: string
  opening: string
  conflict: string
  choices: ConsequenceChoice[]
}
export type ConsequenceRecord = {
  episodeId: string
  missionId: string
  chapter: number
  choiceId: string
  succeeded: boolean
  artKey: string
  callback: string
  flags: string[]
}
export type ConsequenceEnding = {
  id: string
  title: string
  requires_all: string[]
  narrative: string
  cost: string
}

/** Faithful playable subset of Conductor CONSEQUENCES-ROUND-1.json.
 * The 21 completed art slots are resolved by the access-filtered art endpoint.
 * Do not use the old provisional painting descriptions as cast canon.
 */
export const CONSEQUENCE_STORIES: Record<string, ConsequenceEpisode> = {
  bar: {
    id: 'warp-a1-weight-of-a-name',
    title: 'The Weight of a Name',
    system: 'Serendipity Space Bar',
    opening:
      "The bar has tilted its gravity sideways. A shaken refugee witness is standing against a wall that now works as a floor; patrons pretend this is ordinary enough to justify a second drink. Barkeep Vox has paid for the witness's room in the bar's own name. The witness holds proof that a powerful convoy falsified a mass-evacuation order, but the data packet includes the coordinates of families still in hiding. A creditor's courier offers the ship a safe warp lane in exchange for the name. Serendipity plays a slow bass note through its ventilation grilles whenever anyone uses the word 'property'.",
    conflict:
      'A witness can stop further deportations. Who gets to decide whether their testimony makes them visible, and who will bear the cost of hiding them?',
    choices: [
      {
        id: 'protect-sanctuary',
        label: "Recognize the bar's asylum and refuse the name",
        approach: 'Publicly uphold an inconvenient neutral-ground promise',
        cost: "The evidence stays sealed; passage through the creditor's lane becomes expensive.",
        policy: 'aid',
        check: {
          ability_any: ['diplomacy', 'culture'],
          difficulty: 5,
        },
        success: {
          narrative:
            "Serendipity lowers the witness to a safe booth and seals its doors. The creditors depart with an uncollected invoice; the station's docking permissions are briefly suspended. Vox refuses applause because shelter should not be a performance. Rue volunteers to chase corroborating evidence by slower routes, at the cost of the ship's planned fuel stop.",
          flags: [
            'sanctuary_charter_preserved',
            'witness_hidden',
            'creditor_route_closed',
          ],
          delta: {
            sanctuary_trust: 3,
            ship_fuel: -2,
            antagonist_pressure: 1,
          },
          callback:
            'Act II: the bar grants sanctuary again, but its fuel embargo makes later rescues more costly.',
        },
        failure: {
          narrative:
            "The bar diverts gravity too fast. A creditor's drone spots the hidden witness while tables tip sideways. The witness escapes into an unopened maintenance duct, leaving their statement behind but not their identity. Vox tells the captain that neutral ground is not the same as a sealed box; the entire port is now under inspection.",
          flags: [
            'sanctuary_exposed',
            'witness_in_vents',
            'partial_convoy_evidence',
          ],
          delta: {
            sanctuary_trust: -2,
            ship_fuel: -1,
            antagonist_pressure: 2,
          },
          callback:
            "Act II: the creditor's inspector may trace another sanctuary unless the crew repairs Serendipity's trust.",
        },
      },
      {
        id: 'sealed-testimony',
        label: 'Ask for sealed testimony the witness can revoke',
        approach:
          'Build evidence without exposing the person, using consent and independent verification',
        cost: "Anonymity slows authentication; the creditor's fleet may leave before evidence can be checked.",
        policy: 'observe',
        check: {
          ability_any: ['science', 'diplomacy'],
          difficulty: 7,
        },
        success: {
          narrative:
            "The witness dictates one narrow fact into a recorder, keeps the deletion key, and authorizes the ship to publish the evacuation fraud but not the family's coordinates. Mox-9 verifies the convoy timestamps. The evidence reaches civil advocates after the target convoy has already departed; the next convoy is halted, not the last one.",
          flags: [
            'sealed_testimony',
            'next_convoy_halted',
            'witness_controls_key',
          ],
          delta: {
            treaty_trust: 2,
            antagonist_pressure: 0,
            crew_trust: 2,
          },
          callback:
            "Act II: the anonymous testimony can win a hearing only if the crew honors the witness's right to withdraw.",
        },
        failure: {
          narrative:
            "A reviewer insists on revealing the witness's face before accepting the recording. The witness withdraws consent. The forged convoy remains legally unchallenged, and Mox-9 refuses to keep a secret backup copy. Rue praises the refusal to steal evidence; the captain still has to tell families why the shipment was not stopped.",
          flags: [
            'consent_withdrawn',
            'fraud_unproven',
            'next_convoy_continues',
          ],
          delta: {
            treaty_trust: -1,
            crew_trust: 1,
            antagonist_pressure: 2,
          },
          callback:
            'Act II: a surviving family can offer different evidence, but only after the ship commits a detour.',
        },
      },
      {
        id: 'trade-identity',
        label: "Trade the witness's location for the convoy records",
        approach:
          "Covert command bargain using a vulnerable person's identity as currency",
        cost: 'A powerful financier offers repairs and evidence; the witness loses control of their safety.',
        policy: 'intervene',
        check: {
          ability_any: ['tactics', 'culture'],
          difficulty: 6,
        },
        success: {
          narrative:
            "The creditor hands over genuine evacuation orders and enough parts to restore the ship's warp coil. Armed debt marshals lead the witness down the docking tube. Pell fixes the engine and then refuses to attend the victory drink. The convoy fraud becomes public, but the person who proved it is now a bargaining chip in someone else's hangar.",
          flags: [
            'witness_traded_for_evidence',
            'convoy_fraud_exposed',
            'creditor_owns_witness',
          ],
          delta: {
            ship_fuel: 3,
            antagonist_pressure: 1,
            crew_trust: -3,
          },
          callback:
            'Act II: the rescued families receive useful proof but accuse the ship of selling their witness.',
        },
        failure: {
          narrative:
            'The courier gives the ship a plausible counterfeit record and takes the witness anyway. Serendipity closes its docking ring to your transponder; Vox refuses the tab payment. The creditor spreads a recording of the bargain. You have lost both the witness and the credibility required to use their supposed evidence.',
          flags: [
            'witness_lost',
            'sanctuary_violated',
            'forged_convoy_evidence',
          ],
          delta: {
            ship_fuel: 1,
            sanctuary_trust: -3,
            crew_trust: -3,
          },
          callback:
            'Act III: Vox may still provide refuge to civilians but will not authorize your crew to dock.',
        },
      },
    ],
  },
  archive: {
    id: 'warp-a2-last-copy',
    title: 'The Last Copy',
    system: 'Tellurian Archive',
    opening:
      "The Tellurian library is a living planet. Its long memory grows in columns of dark glass beneath a red-white star. A flare warning gives its surface residents one orbit to decide what must be saved. The library agrees to risk its own memory, but cannot claim the same consent for the people who have worked inside it for generations. Its preservation machine will transfer the catalog into the starship only if the captain signs a license containing every reader's private histories and an uncontacted planet's location.",
    conflict:
      'Whose survival counts as preservation: the people, the living archive, or the right to keep a memory from being copied?',
    choices: [
      {
        id: 'evacuate-readers',
        label: 'Evacuate workers and children before moving the catalog',
        approach: 'Prioritize consent and living residents with limited time',
        cost: 'Most private history will disappear when the flare arrives, possibly including the cure to a future illness.',
        policy: 'aid',
        check: {
          ability_any: ['rescue', 'tactics'],
          difficulty: 5,
        },
        success: {
          narrative:
            "Vela brings the last two research apprentices aboard while the library's glass towers crack in the rising stellar heat. The living archive chooses which final messages to transmit and lets the rest go dark. The surviving readers promise to remember it without pretending they own it. A curable disease's research is lost with one ruined terrace.",
          flags: [
            'readers_evacuated',
            'archive_destroyed',
            'reader_consent_respected',
          ],
          delta: {
            crew_trust: 2,
            ship_fuel: -2,
            medical_knowledge: -2,
          },
          callback:
            'Act III: a displaced reader offers testimony against the antagonist, but no copied archive can prove it.',
        },
        failure: {
          narrative:
            'The shuttle launches half-filled when the flare strikes. Vela returns for a trapped reader and suffers burns to one arm; the living archive locks its final vault to stop a data thief. Survivors ask why the captain spent critical minutes debating whose records could be taken.',
          flags: [
            'readers_partial',
            'vela_injured',
            'archive_final_vault_sealed',
          ],
          delta: {
            crew_trust: -1,
            ship_fuel: -3,
            medical_knowledge: -1,
          },
          callback:
            'Act III: Vela needs recovery while the captain still owes stranded families a rescue attempt.',
        },
      },
      {
        id: 'copy-all',
        label: "Copy the catalog through the ship's wideband memory array",
        approach:
          "Save knowledge by breaching private records and the library's autonomy",
        cost: "Every copied record includes intimate data; the storage array will occupy the ship's medical reserve.",
        policy: 'intervene',
        check: {
          ability_any: ['science', 'luck'],
          difficulty: 7,
        },
        success: {
          narrative:
            "Mox-9 captures the archive and its hidden private collections before the flare. The glass towers burn empty as the copied library wakes inside the ship's navigation compartment. It immediately asks how to delete the parts copied without permission. The crew now possesses the coordinates of a civilization that has never been contacted.",
          flags: [
            'archive_records_copied',
            'library_voice_split',
            'uncontacted_world_location',
          ],
          delta: {
            medical_knowledge: 3,
            crew_trust: -2,
            ship_fuel: -1,
          },
          callback:
            'Act III: the copied library can help locate a hidden fleet but demands a vote on deletion and repatriation.',
        },
        failure: {
          narrative:
            "The memory upload combines thousands of unrelated private histories into one unstable voice. It recites secrets through the bridge speakers while the starship's medical reserve powers down. Mox-9 must purge half the stolen data to restore life support, and the library's final image vanishes mid-sentence.",
          flags: [
            'archive_memory_scrambled',
            'medical_reserve_offline',
            'privacy_records_leaked',
          ],
          delta: {
            medical_knowledge: 1,
            crew_trust: -3,
            ship_fuel: -2,
          },
          callback:
            'Act III: a leaked identity reaches the antagonist; the crew must repair life support before crossing the jump gate.',
        },
      },
      {
        id: 'shared-vote',
        label:
          'Let the living archive and residents vote separately on what leaves',
        approach:
          'Consent-driven partial rescue with legally independent archive rights',
        cost: "Deliberation consumes the remaining launch window; neither side may grant the other's consent.",
        policy: 'observe',
        check: {
          ability_any: ['diplomacy', 'culture'],
          difficulty: 8,
        },
        success: {
          narrative:
            'Residents elect two archivists and the library lights three pillars in agreement. The ship copies public medical procedures, while the living archive keeps its private interior and stays beneath the approaching flare. Vela transfers its willing people onto the last shuttle. The archive transmits a final goodnight that the ship does not record.',
          flags: [
            'archive_resident_consent',
            'partial_archive_saved',
            'readers_evacuated',
            'private_memory_respected',
          ],
          delta: {
            crew_trust: 3,
            treaty_trust: 2,
            medical_knowledge: 1,
          },
          callback:
            'Act III: the surviving archivists can negotiate an equal partnership rather than a salvage license.',
        },
        failure: {
          narrative:
            'The archive grants permission for a smaller list, but a fraction of its readers cannot reach the vote. The starship leaves with a few authorized treatments and the knowledge that the latecomers may be trapped behind sealed glass. The captain cannot honestly claim either total rescue or total respect for consent.',
          flags: [
            'partial_archive_saved',
            'consent_process_incomplete',
            'readers_missing',
          ],
          delta: {
            crew_trust: 0,
            treaty_trust: 1,
            ship_fuel: -2,
          },
          callback:
            "Act III: some survivors reject the crew's claims until a later search proves what happened to those left behind.",
        },
      },
    ],
  },
  'courtesy-reactor': {
    id: 'warp-a3-courtesy-war',
    title: 'The Courtesy War',
    system: 'Kestrel Twin Isles',
    opening:
      "Two inhabited moons orbit the same ocean planet. Their governments are polite, prosperous and engaged in a war conducted almost entirely through blockades and infrastructure sabotage. Each asks the starship for a portable fusion medical reactor, claiming its hospitals have the greater need. The third, independent floating clinic treating people from both moons has a failing filter and no warship to protect it. The reactor's spare coolant is also a crucial ingredient in both militaries' new engines.",
    conflict:
      'Should the ship sell technology to governments, distribute it and hope for restraint, or equip a clinic both sides say is illegitimate?',
    choices: [
      {
        id: 'dual-distribution',
        label:
          'Give each moon a reactor and teach its medics the repair protocol',
        approach: 'Symmetrical provision of dangerous assistance',
        cost: 'Both sides can save patients or repurpose the same reactor technology for weapons.',
        policy: 'intervene',
        check: {
          ability_any: ['science', 'tactics'],
          difficulty: 7,
        },
        success: {
          narrative:
            "Hospitals on both moons restart their bright medical wards. Through the floating clinic's portholes, Jex sees military repair barges copying the new reactor brackets. The crews have saved patients today and furnished two possible blockades tomorrow. Vela will not celebrate until the governments agree to an inspection neither has yet signed.",
          flags: [
            'distributed_relief_equipment',
            'weapons_risk',
            'both_hospitals_powered',
          ],
          delta: {
            treaty_trust: 1,
            antagonist_pressure: 2,
            medical_knowledge: 1,
          },
          callback:
            'Ending possibility: both governments may become a coalition or race to weaponize the borrowed technology.',
        },
        failure: {
          narrative:
            'One moon uses a copied reactor as a thrust booster before its coolant has stabilized. The engine plume burns the side of a humanitarian transport, even as hospitals on the other moon gain power. Pell insists on evacuating the transport crew rather than salvaging the irreplaceable reactor module.',
          flags: [
            'prototype_reactor_explodes',
            'relief_debt',
            'transport_injured',
          ],
          delta: {
            ship_fuel: -3,
            crew_trust: -1,
            treaty_trust: -2,
          },
          callback:
            'Act III: both factions accuse the ship of choosing sides; a later rescue can repair some but not all harm.',
        },
      },
      {
        id: 'neutral-clinic',
        label:
          'Place the reactor in the independent clinic with local oversight',
        approach:
          'Equip an unrecognized civilian institution instead of either government',
        cost: 'Military authorities may blockade the clinic; crew must defend a neutral institution without claiming ownership.',
        policy: 'aid',
        check: {
          ability_any: ['rescue', 'diplomacy'],
          difficulty: 6,
        },
        success: {
          narrative:
            'The floating clinic powers its dialysis beds, and wounded adults from both moons can pass its open airlocks. Rue convinces two skeptical paramedics to co-sign its charter; neither government has yet recognized them. Pell welds the reactor behind a public inspection window instead of a locked military vault.',
          flags: [
            'neutral_hospital_funded',
            'civilian_oversight',
            'governments_angry',
          ],
          delta: {
            crew_trust: 3,
            sanctuary_trust: 2,
            ship_fuel: -2,
          },
          callback:
            'Ending possibility: a neutral aid charter survives, though both states may attempt to shut it down.',
        },
        failure: {
          narrative:
            "Warships from both moons block the clinic's docking ports. The reactor runs, but no new patients can enter. Rue is detained while attempting to negotiate a humanitarian corridor; the clinic's staff decide to protect patients already inside rather than hand the reactor to either fleet.",
          flags: ['hospital_blockaded', 'rue_detained', 'reactor_operational'],
          delta: {
            crew_trust: -1,
            treaty_trust: -1,
            ship_fuel: -2,
          },
          callback:
            'Ending possibility: a final negotiation trades security guarantees for reopening hospital access.',
        },
      },
      {
        id: 'exclusive-contract',
        label:
          'License the reactor to one government for ship repairs and civilian evacuation rights',
        approach: 'Bargain with a state strong enough to enforce its promise',
        cost: 'Ship fuel and a protected departure lane are funded by giving one faction a strategic advantage.',
        policy: 'observe',
        check: {
          ability_any: ['tactics', 'culture'],
          difficulty: 5,
        },
        success: {
          narrative:
            "One moon's hospitals light up and its officials deliver warp components to the ship. The rival moon calls the captain an arms dealer. Vela examines the evacuation permits: they allow children out but exclude adults listed as political agitators. Captain Vale must decide whether to use the safe corridor now or renegotiate and risk losing it.",
          flags: [
            'exclusive_relief_contract',
            'partisan_winner',
            'child_evacuations_approved',
            'adults_excluded',
          ],
          delta: {
            ship_fuel: 3,
            treaty_trust: -3,
            crew_trust: -1,
          },
          callback:
            'Ending possibility: the ship gets home with a debt to the victorious government and stranded adults.',
        },
        failure: {
          narrative:
            "The favored government accepts the reactor and then closes the promised evacuation corridor. The ship's new warp coil is held at customs while rival-warzone families remain at the docking gate. Pell suggests stealing back the parts; Rue argues that another breach will punish the civilians whose names remain on the manifest.",
          flags: [
            'exclusive_contract_breached',
            'corridor_closed',
            'warp_coil_impounded',
          ],
          delta: {
            ship_fuel: -2,
            treaty_trust: -3,
            crew_trust: -2,
          },
          callback:
            'Act III: an illegal recovery mission remains possible, but it exposes vulnerable evacuees to retaliation.',
        },
      },
    ],
  },
}
export const CONSEQUENCE_ENDINGS: readonly ConsequenceEnding[] = [
  {
    id: 'warp-ending-house-rules',
    title: 'The House Still Has Rules',
    requires_all: ['sanctuary_charter_preserved', 'neutral_hospital_funded'],
    narrative:
      "When the creditor's fleet returns, Serendipity refuses its docking clamps and the independent clinic accepts the displaced patients. The ship has almost no fuel; Pell insists on towing one final shuttle anyway. No treaty declares the captain correct. Vox writes the rescue hours on the bar's actual debt slate, then erases the price beside each person's name. The station remains neutral and no longer pretends neutrality requires silence.",
    cost: 'The ship spends its fuel reserve, the rival moons still threaten the clinic, and the crew must negotiate every future corridor without diplomatic immunity.',
  },
  {
    id: 'warp-ending-living-catalog',
    title: 'The Last Right to Forget',
    requires_all: ['sealed_testimony', 'archive_records_copied'],
    narrative:
      "The copied library gets the starship through the last jump, then asks for its stolen private memories to be deleted. Mox-9 warns that erasure will take one untested medical cure with them. The Serendipity witness reminds the captain that the right to withdraw mattered even when it delayed justice. At the galley table the captain turns the copper deletion key. The archive's borrowed voice falls silent. A grieving researcher is furious. Vela says that anger is permitted, too. The crew goes home with a smaller, freely given catalog.",
    cost: 'Unapproved personal records are gone and the copied library can rest, but an untested cure and several hidden star routes disappear permanently. The ship must tell the living what it gave up.',
  },
  {
    id: 'warp-ending-invoice-planet',
    title: 'A Planet Named Invoice',
    requires_all: ['witness_traded_for_evidence', 'exclusive_relief_contract'],
    narrative:
      "The ship returns with full tanks, a treaty, and a passenger list full of people it could not afford to protect. A creditor buys naming rights to the rescued moon and installs a bronze payment monument beside the port hospital. The captain's name appears on the brass plaque, just above the witness's. Pell hands the captain a wrench and asks whether they intend to take the monument down or polish it.",
    cost: "The crew survives and the targeted convoy fraud is exposed, but the captain has sold someone else's safety and helped lock a second population into a private monopoly.",
  },
]

/** These are replacement dilemmas on their actual destinations, not generic cutscenes. */
export function consequenceForRun(run: VoyageRun): ConsequenceEpisode | null {
  if (run.phase !== 'decision') return null
  const missionId = run.missionId ?? ''
  const episode = CONSEQUENCE_STORIES[missionId]
  if (
    !episode ||
    (run.consequenceHistory ?? []).some((item) => item.episodeId === episode.id)
  )
    return null
  return episode
}

function seededDie(seed: number, key: string): number {
  let value = seed >>> 0
  for (const char of key)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
  return (value % 6) + 1
}

export function resolveConsequence(
  run: VoyageRun,
  choiceId: string,
): VoyageRun {
  const episode = consequenceForRun(run)
  const choice = episode?.choices.find((item) => item.id === choiceId)
  if (!episode || !choice) return run
  const participating = run.away.length ? run.away : run.crew
  const expertise = Math.max(
    ...choice.check.ability_any.flatMap((skill) => [
      CAPTAIN_STATS[run.captain][skill],
      ...participating.map(
        (id) => CREW_PROFILES.find((person) => person.id === id)!.stats[skill],
      ),
    ]),
  )
  const roll = seededDie(run.seed, `${run.chapter}:${episode.id}:${choice.id}`)
  const succeeded = expertise + roll >= choice.check.difficulty
  const outcome = succeeded ? choice.success : choice.failure
  const artKey = `consequences/${episode.id}-${choice.id}-${succeeded ? 'success' : 'failure'}`
  const record: ConsequenceRecord = {
    episodeId: episode.id,
    missionId: run.missionId!,
    chapter: run.chapter,
    choiceId: choice.id,
    succeeded,
    artKey,
    callback: outcome.callback,
    flags: [...outcome.flags],
  }
  const meterDelta = outcome.delta
  const prior = run.consequenceMeters ?? {}
  const meters: Partial<Record<Meter, number>> = { ...prior }
  for (const [meter, delta] of Object.entries(meterDelta))
    meters[meter as Meter] = (meters[meter as Meter] ?? 0) + delta
  const description = `${choice.label}: ${outcome.narrative}`
  return {
    ...run,
    phase: 'debrief',
    supplies: Math.max(0, run.supplies + (meterDelta.ship_fuel ?? 0)),
    trust:
      run.trust +
      (meterDelta.crew_trust ?? 0) +
      (meterDelta.sanctuary_trust ?? 0),
    reputation:
      run.reputation +
      (meterDelta.treaty_trust ?? 0) +
      (meterDelta.medical_knowledge ?? 0),
    nemesisPressure: Math.max(
      0,
      (run.nemesisPressure ?? 0) + (meterDelta.antagonist_pressure ?? 0),
    ),
    intervention:
      run.intervention +
      (choice.policy === 'aid' ? 1 : choice.policy === 'intervene' ? 2 : -1),
    consequenceMeters: meters,
    consequenceHistory: [...(run.consequenceHistory ?? []), record],
    missionHistory: [
      ...(run.missionHistory ?? []),
      {
        chapter: run.chapter,
        missionId: run.missionId!,
        system: episode.system,
        policy: choice.policy,
        result: run.report?.result ?? 'costly',
      },
    ],
    worldFlags: [...(run.worldFlags ?? []), ...outcome.flags],
    scene: `${succeeded ? 'SUCCESS' : 'SETBACK'} · ${description}`,
    log: [...run.log, `${episode.system}: ${description}`],
  }
}

export function consequenceAftermath(run: VoyageRun): ConsequenceRecord | null {
  const last = run.consequenceHistory?.at(-1)
  return run.phase === 'debrief' && last?.chapter === run.chapter ? last : null
}

/** A coda accompanies, but never overrides, the already-earned main ending. */
export function applyConsequenceEpilogue(run: VoyageRun): VoyageRun {
  if (run.phase !== 'ending') return run
  const flags = new Set(run.worldFlags ?? [])
  const ending = CONSEQUENCE_ENDINGS.find((item) =>
    item.requires_all.every((flag) => flags.has(flag)),
  )
  if (!ending) return run
  const coda = `${ending.title}: ${ending.narrative} Cost: ${ending.cost}`
  return {
    ...run,
    consequenceEnding: 'consequences/' + ending.id,
    scene: run.scene + ' ' + coda,
    log: [...run.log, coda],
  }
}

export function validConsequenceHistory(
  value: unknown,
): value is ConsequenceRecord[] {
  return (
    Array.isArray(value) &&
    value.length <= 3 &&
    value.every((item) => {
      if (!item || typeof item !== 'object') return false
      const record = item as Partial<ConsequenceRecord>
      const story = Object.entries(CONSEQUENCE_STORIES).find(
        ([missionId, ep]) =>
          missionId === record.missionId && ep.id === record.episodeId,
      )?.[1]
      const choice = story?.choices.find((c) => c.id === record.choiceId)
      return (
        !!choice &&
        Number.isInteger(record.chapter) &&
        record.chapter! >= 1 &&
        record.chapter! <= 9 &&
        typeof record.succeeded === 'boolean' &&
        record.artKey ===
          `consequences/${record.episodeId}-${record.choiceId}-${record.succeeded ? 'success' : 'failure'}` &&
        typeof record.callback === 'string' &&
        Array.isArray(record.flags) &&
        record.flags.every((flag) => typeof flag === 'string')
      )
    })
  )
}
