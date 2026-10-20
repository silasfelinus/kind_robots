import type { CompanionId, EncounterCard, LensId } from './content'

export type GatedEncounter = EncounterCard & {
  requiresLead?: CompanionId
  requiresLens?: LensId
}

// The first expansion wave uses the existing 2d6, seed, save and Playbook contracts.
// Requirements are checked before the deterministic fork draw; absent guides and
// unopened lenses never silently receive somebody else's personal quest.
export const QUEST_CARDS: GatedEncounter[] = [
  {
    id: 'WH-003',
    kind: 'encounter',
    chapter: 1,
    place: 'Arcata Plaza farmers market',
    title: 'Four Minutes to Farmers Market',
    scene: 'plaza',
    body: [
      'A peach vendor has posted a sign: FOUR MINUTES UNTIL YESTERDAY. The fruit tastes like late summer, though the calendar disagrees. Every basket has a handwritten year, and the vendor refuses to sell the one marked NEXT.',
      'A teenager is trying to photograph the sign. On their phone the date keeps changing. The vendor offers you a peach and an actual, perfectly normal paper receipt.',
    ],
    choices: [
      {
        id: 'receipt',
        label: 'Ask for a receipt and keep the timeline honest',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'The receipt carries three different dates in the same ink. The vendor asks you to make a copy before it fades.',
          effects: {
            evidence: 'Three dates on one farmers market receipt',
            flag: 'peach_receipt_kept',
          },
        },
        failure: {
          text: 'The register prints TOMORROW and jams. The vendor still gives you the peach, and you are no less hungry.',
          effects: { goodwill: 1 },
        },
      },
      {
        id: 'share',
        label: 'Buy the mislabeled basket for the community table',
        success: {
          text: 'People argue over when the peaches grew, then stop arguing long enough to eat together. Nobody has to agree about time to share lunch.',
          effects: { goodwill: 1, flag: 'peaches_shared' },
        },
      },
    ],
    provenance:
      'The Arcata Plaza farmers market is real; vendor, impossible fruit, receipts and dialogue are invented.',
  },
  {
    id: 'WH-012',
    kind: 'encounter',
    chapter: 1,
    requiresLead: 'juniper',
    place: 'Arcata Community Forest',
    title: 'Juniper and the Volunteer Tree Census',
    scene: 'grove',
    body: [
      'Juniper shows you three redwoods with small numbered tags. One grew an extra ring overnight. The volunteer tree counter has a payroll ledger, a broken measuring tape and an offer from a private foundation to fence the entire block.',
      '“I could keep everyone out,” Juniper says. “But I do not know how to keep the water clean with only myself to answer for it.” She waits for an answer, not obedience.',
    ],
    choices: [
      {
        id: 'corroborate',
        label: 'Measure the damaged creek and invite the workers to verify it',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'A trail worker finds old runoff measurements. Your new count stands beside theirs, and Juniper agrees the people who work here deserve a say.',
          effects: {
            evidence: 'Corroborated creek census',
            goodwill: 1,
            flag: 'juniper_habitat_verified',
          },
        },
        failure: {
          text: 'Your figures disagree, but the trail worker keeps their appointment for another survey. Juniper learns that being wrong in public need not be fatal.',
          effects: { flag: 'juniper_followup_survey' },
        },
      },
      {
        id: 'gate',
        label: 'Let Juniper close the path herself, for now',
        success: {
          text: 'The ferns rise across the trail. It is safe behind them, and the hikers are furious. Juniper gives you a long look: “That was easier than listening.”',
          effects: { nerve: 1, flag: 'juniper_closed_path' },
        },
      },
      {
        id: 'neighbors',
        label: 'Arrange a meeting with the trail crews before any fence',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'Two workers and a gardener bring their own maps. Juniper disagrees with half their plan but asks for copies of every page.',
          effects: { goodwill: 1, flag: 'juniper_human_allies_trusted' },
        },
        failure: {
          text: 'Nobody trusts a surprise meeting in the rain. You leave invitations and a place for names; the conversation is only postponed.',
          effects: { flag: 'juniper_meeting_invited' },
        },
      },
    ],
    provenance:
      'Arcata Community Forest is real. The extra tree ring, private foundation offer, nymph and workers are fictional; no real land claim is implied.',
  },
  {
    id: 'WH-004',
    kind: 'encounter',
    chapter: 1,
    requiresLens: 'cocaine',
    place: 'Arcata Plaza',
    title: 'A Fast Hour in a Bottle',
    scene: 'plaza',
    body: [
      'Everything feels urgently unfinished. A man selling used fog offers to bottle one hour of your attention and sell it back at a premium. Nearby, stagehands from a fictional workers cooperative are comparing a rushed contract with the one they signed last week.',
      'The offer on the table will save a festival today and cut the crew out of tomorrow. You can move quickly. The question is what deserves haste.',
    ],
    choices: [
      {
        id: 'terms',
        label: 'Slow down enough to read the crew contract together',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'You catch the missing wage clause. The crew rewrites the terms in plain language, and the seller has to give the hour back.',
          effects: {
            evidence: 'Revised cooperative wage terms',
            goodwill: 1,
            flag: 'cocaine_union_terms',
          },
        },
        failure: {
          text: 'You miss one clause, but the stage manager catches it while you are reading aloud. Nobody pretends speed is a substitute for a second set of eyes.',
          effects: { flag: 'crew_second_reader' },
        },
      },
      {
        id: 'fog',
        label: 'Buy the bottled hour and race to the next clue',
        success: {
          text: 'The jar ticks. You gain a fragment of a tomorrow nobody else remembers, but the stage crew finishes its argument without you.',
          effects: { weird: 1, evidence: 'An hour dated tomorrow' },
        },
      },
    ],
    provenance:
      'Arcata Plaza is real; fog seller, fictional crew and contracts are invented. Voluntary adult cocaine opening is not a source of magical powers or a moral alignment.',
  },
  {
    id: 'WH-024',
    kind: 'encounter',
    chapter: 2,
    requiresLead: 'kit',
    place: 'Moonstone Beach',
    title: 'Kit and the Shadow Left at Low Tide',
    scene: 'beach',
    body: [
      'Kit has rigged a little kinetic sculpture out of driftwood and bicycle cable. Its shadow moves when the sculpture holds still. A sponsor wants the moving silhouette for an exclusive ad, with nobody on the crew named in the contract.',
      'Kit says the show could fund a real workshop. Then she reads the list of people whose labor would become the sponsor’s property.',
    ],
    choices: [
      {
        id: 'credit',
        label: 'Negotiate collective credit and pay before the photo shoot',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'Kit calls her collaborators over to the table. The revised release names the welders, dancers and riggers and pays them for every use.',
          effects: { goodwill: 1, flag: 'kit_collaborator_credit_kept' },
        },
        failure: {
          text: 'The sponsor walks. Kit looks disappointed, then asks who has a truck to move the sculpture to a free show.',
          effects: { flag: 'kit_refused_buyout' },
        },
      },
      {
        id: 'public',
        label: 'Build a traveling free workshop from the installation',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'Children on the beach start making their own impossible shadows. Kit pins up an invitation for the first open workshop.',
          effects: { goodwill: 1, flag: 'kit_workshop_kept_public' },
        },
        failure: {
          text: 'The sculpture folds into a pile of wet spokes. Kit laughs, shows you the repair, and schedules the workshop anyway.',
          effects: { flag: 'kit_workshop_planned' },
        },
      },
      {
        id: 'license',
        label: 'Take the exclusive deal and keep the original model',
        success: {
          text: 'The check is real. So is the new clause that bars Kit from exhibiting her own shadow anywhere else.',
          effects: { nerve: -1, flag: 'kit_exclusive_license' },
        },
      },
    ],
    provenance:
      'Moonstone Beach is real; artist contracts, sculpture and people are invented. Kit is Hmong American; this is a labor and art-access choice, not an invented ancestry tale.',
  },
  {
    id: 'WH-027',
    kind: 'encounter',
    chapter: 2,
    place: 'Trinidad Harbor',
    title: 'The Seagull Union Bargain',
    scene: 'beach',
    body: [
      'The gulls have elected a shop steward. She is a small gray bird with a booming voice and a list of grievances about public trash cans. Her demand is not more stolen lunches: it is a harbor that people and birds can live beside.',
      'A dockworker translates with the weary fluency of someone who has been negotiating with gulls all summer.',
    ],
    choices: [
      {
        id: 'repair',
        label: 'Organize a cleanup with covered bins and paid labor',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'The dockworkers get a small maintenance contract, and the gulls stop stealing half the picnic lunches. The steward insists this is a provisional agreement.',
          effects: { goodwill: 1, flag: 'harbor_bins_funded' },
        },
        failure: {
          text: 'The first meeting ends in a dispute about who speaks for the gulls. You leave the draft agreement posted where everyone can read it.',
          effects: { flag: 'harbor_talks_started' },
        },
      },
      {
        id: 'feed',
        label: 'Placate the union with your lunch',
        success: {
          text: 'You are immediately outvoted by forty gulls and one extremely pleased dockworker. It solves lunch, not the harbor.',
          effects: { weird: 1 },
        },
      },
    ],
    provenance:
      'Trinidad Harbor is real; speaking gulls, steward, dockworker and negotiations are invented.',
  },
  {
    id: 'WH-037',
    kind: 'encounter',
    chapter: 2,
    requiresLens: 'meth',
    place: 'Mad River trail',
    title: 'The River Does Not Sleep',
    scene: 'rivermouth',
    body: [
      'You have been awake too long. A three-inch river official stands on a stone and asks for a witness, not a toll. A maintenance crew found a damaged warning sign upstream. Someone has been claiming the river is safe without checking the current.',
      'The official speaks very quickly; the workers do not. A tired person can still deserve respect, rest and a chance to be heard. The river will be here when you wake up.',
    ],
    choices: [
      {
        id: 'witness',
        label: 'Record the workers’ account and ask for an independent check',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'The crew photographs the broken warning and files a report with their names on it. Nobody needs your interpretation to verify their work.',
          effects: {
            evidence: 'Independent river warning report',
            goodwill: 1,
            flag: 'meth_vigilant_witness',
          },
        },
        failure: {
          text: 'Your notes wander. A worker offers to write the report while you listen, then makes sure you get somewhere safe to rest.',
          effects: { goodwill: 1, flag: 'river_worker_helped' },
        },
      },
      {
        id: 'rest',
        label: 'Hand over the notes and accept a safe place to rest',
        success: {
          text: 'You sleep while other people follow through. When you wake the warning sign has been replaced, signed by the crew, and the tiny official has left a thank-you pebble.',
          effects: { nerve: 1, flag: 'meth_accepted_rest' },
        },
      },
    ],
    provenance:
      'Mad River and its trails are real; the river official and this report are fiction. The adult meth opening offers no procurement, instructions, stereotypes or supernatural competence.',
  },
  {
    id: 'WH-043',
    kind: 'encounter',
    chapter: 3,
    requiresLead: 'mara',
    place: 'Old Town Eureka',
    title: 'Mara and the Fog Machine Union',
    scene: 'bay',
    body: [
      'An invented promoters’ office has been distributing Mara’s original flash designs as free festival branding. Her clients never agreed to be advertisements. The fog machine union offers to make the logos disappear, but its preferred method also erases the names of the artists who painted them.',
      'Mara sets her sketchbook on the table. “I want to keep my work,” she says, “without owning everyone else’s future.”',
    ],
    choices: [
      {
        id: 'consent',
        label: 'Protect the client files and document whose art was used',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The confidential designs stay private. Public records prove the promoters copied a different, commissioned design without paying for it.',
          effects: {
            evidence: 'Documented art licensing breach',
            goodwill: 1,
            flag: 'mara_client_trust_kept',
          },
        },
        failure: {
          text: 'You nearly put a confidential sketch on the record; Mara stops you. You withdraw it and the investigation continues without betraying a client.',
          effects: { flag: 'mara_confidentiality_respected' },
        },
      },
      {
        id: 'studio',
        label:
          'Build a transparent studio licensing and apprenticeship agreement',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'A young artist insists on their own contract, not Mara’s old template. She agrees. The new studio keeps both independence and paid apprenticeships.',
          effects: { goodwill: 1, flag: 'mara_studio_autonomy_secured' },
        },
        failure: {
          text: 'The deal needs another meeting. Mara takes her sketchbook home and offers to show the apprentice how to negotiate for themself.',
          effects: { flag: 'mara_apprenticeship_invited' },
        },
      },
      {
        id: 'erase',
        label: 'Let the fog erase the advertisements tonight',
        success: {
          text: 'At dawn every stolen logo is blank. Unfortunately so are the bylines on a dozen honest murals. Mara does not thank you for deciding for her.',
          effects: { nerve: -1, flag: 'mara_fog_erasure' },
        },
      },
    ],
    provenance:
      'Eureka Old Town is real; promoters, union, licensing breach and people are fictional. Mara’s identity conveys no supernatural permission or real tribal endorsement.',
  },
  {
    id: 'WH-055',
    kind: 'encounter',
    chapter: 3,
    requiresLead: 'cedar',
    place: 'Humboldt Bay waterfront',
    title: 'Cedar and the Underwater Radio',
    scene: 'bay',
    body: [
      'A radio call-in show is taking questions before listeners ask them. A developer says that means the county should lease every fiber strand and creek sensor to a single private company. Cedar recognizes the transmitter parts. He also knows the people who would have to maintain them.',
      'He calls his mother, a fictional former Luna tree-sit support volunteer, and his Hispanic logger father. They disagree about the contract and agree about showing up. They are still very much married.',
    ],
    choices: [
      {
        id: 'charter',
        label: 'Draft a publicly auditable network charter with local workers',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The union electricians and watershed volunteers put their names on a community-owned access charter with an energy budget and a real right to audit.',
          effects: {
            evidence: 'Auditable county network charter',
            goodwill: 1,
            flag: 'cedar_network_charter',
          },
        },
        failure: {
          text: 'A rushed draft excludes two rural neighborhoods. Cedar refuses to call it good enough, and schedules another round with them included.',
          effects: { flag: 'cedar_charter_rewrite' },
        },
      },
      {
        id: 'sensors',
        label: 'Fund creek sensors and a local maintenance crew first',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'The equipment is repairable with local parts. The crew publishes the measurements and makes sure the sensors never substitute for people who know the river.',
          effects: { goodwill: 1, flag: 'cedar_watershed_sensors' },
        },
        failure: {
          text: 'The prototype fails in salt air. Cedar calls the crew back to fix it rather than signing a thirty-year maintenance monopoly.',
          effects: { flag: 'cedar_sensor_repair' },
        },
      },
      {
        id: 'private',
        label: 'Accept the single-owner deal to get the network running now',
        success: {
          text: 'The towers light up by nightfall. The draft agreement is forty pages long, and the public audit right fits on none of them.',
          effects: { nerve: -1, flag: 'cedar_private_network' },
        },
      },
    ],
    provenance:
      'Humboldt Bay is real; broadcaster and contract are invented. Cedar’s parents’ marriage persists; mother’s specific fictional Luna support role must not be represented as historical testimony.',
  },
  {
    id: 'WH-058',
    kind: 'encounter',
    chapter: 3,
    requiresLens: 'mdma',
    place: 'Sequoia Park',
    title: 'The Peacock Has a Warrant',
    scene: 'grove',
    body: [
      'A peacock in a little paper badge demands an investigation into stolen colors. Every person at the park has a story about what they wish another person understood. Tonight your own feelings are unusually close to the surface.',
      'The bird insists empathy is a beginning, not a legal document. The park volunteers need a decision about who can actually use their small workshop tomorrow.',
    ],
    choices: [
      {
        id: 'listen',
        label: 'Listen, then help the volunteers write an access agreement',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The agreement names accessible hours, paid instructors and a dispute process. The peacock signs with one feather, then denies everything.',
          effects: { goodwill: 1, flag: 'mdma_mutual_aid' },
        },
        failure: {
          text: 'People feel heard, but no one agrees on keys. You arrange a sober follow-up rather than calling a warm evening a solved problem.',
          effects: { flag: 'mdma_followup_meeting' },
        },
      },
      {
        id: 'comfort',
        label: 'Help one overwhelmed volunteer get home safely',
        success: {
          text: 'You stay, find their friend, and make sure they have water and a ride from someone they trust. The county will still need its meeting tomorrow.',
          effects: { goodwill: 1, flag: 'mdma_compassionate_choice' },
        },
      },
    ],
    provenance:
      'Sequoia Park is real; the peacock, workshops and visitors are fiction. An adult voluntary MDMA lens does not confer magic, consent or a guaranteed civic outcome.',
  },
]
