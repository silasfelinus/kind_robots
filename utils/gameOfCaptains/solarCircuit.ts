/**
 * The 20 Serendipity franchises. Each is a bar built ON a living, occupied
 * planet-sized blue person's casino body, never a separate space station.
 * Each has a three-scene quest with independently authored ethical outcomes.
 */
export type CasinoChoice = 'ask' | 'document' | 'override'
export type VenueBeat = {
  title: string
  situation: string
  ask: string
  document: string
  override: string
}
export type Franchise = {
  id: string
  name: string
  theme: string
  illustration: string
  beats: readonly [VenueBeat, VenueBeat, VenueBeat]
}
const beat = (title: string, situation: string, ask: string, document: string, override: string): VenueBeat =>
  ({ title, situation, ask, document, override })
const franchise = (id: string, name: string, theme: string, illustration: string, beats: Franchise['beats']): Franchise =>
  ({ id, name, theme, illustration, beats })

export const SERENDIPITY_FRANCHISES: readonly Franchise[] = [
  franchise('mesa', 'Serendipity: Meteor Mesa', 'Tex-Mex cantina carved into a casino shoulder', 'terracotta archways, neon chili-pepper signs, embroidered booth cushions, brass tortilla presses and a view across an enormous cobalt shoulder',
    [
      beat('The Last Tortilla', 'The cooks are billed for every grain of flour, but the blue host is paid in meal vouchers they cannot eat.', 'Arrange an edible royalty and reopen the kitchen.', 'Publish the ingredient contract before diners order.', 'Seize flour for the hungry and leave the franchise holding the bill.'),
      beat('Border of the Buffet', 'Immigration agents claim the salsa bar is a sovereign border crossing, excluding the host from their own wrist.', 'Help staff and host draft a shared access agreement.', 'Film the checkpoints while keeping visitors safely inside.', 'Take down the turnstiles, provoking a casino lockdown.'),
      beat('The Giant Orders Dinner', 'The host speaks through the heat of the griddle and asks to taste one dish from their lost home.', 'Listen and rebuild an old recipe with their permission.', 'Record the recipe so their descendants can reclaim it.', 'Serve the dish without asking, winning applause but reopening a painful memory.'),
    ]),
  franchise('arcade', 'Serendipity: Token Graveyard', 'crumbling Dave-and-Busters-style arcade sports bar', 'broken neon basketball hoops, dusty skee-ball lanes, ripped party banners, flickering blue prize counters and a giant cobalt forearm visible through cracked glass',
    [
      beat('A Prize Worth Nothing', 'A million expired prize tickets prove the casino has withheld the host’s wages for centuries.', 'Negotiate redemption of the tickets for actual compensation.', 'Archive the prize machine accounting in public.', 'Empty the prize vault and hand it to the host without asking.'),
      beat('The Broken Hoop', 'An arcade basketball game is bolted through the giant’s nerve cluster. Every jackpot causes pain.', 'Work with the host to move the machine.', 'Collect medical evidence without touching the wiring.', 'Pull the machine out during a tournament and risk injury.'),
      beat('Final High Score', 'A retired employee knows who designed the arcade to conceal the host’s voice.', 'Offer them safe passage in exchange for testimony.', 'Recover the game logs and let the host decide disclosure.', 'Broadcast the culprit’s identity from every scoreboard.'),
    ]),
  franchise('library', 'Serendipity: The Silent Index', 'velvet library speakeasy and book bar', 'walnut library ladders, green banker lamps, burgundy velvet reading booths, folded maps and enormous blue fingertips supporting a library balcony',
    [
      beat('The Book of Ownership', 'The casino charter is bound in the giant’s stolen family records.', 'Ask the host which pages may be opened.', 'Catalogue the theft under the host’s name.', 'Unbind the charter before the archivists can censor it.'),
      beat('Quiet Hours', 'Casino management fines the host each time they speak during a poetry recital.', 'Reopen the reading room as a listening circle.', 'Document the fines and the host’s testimony.', 'Cut the recital’s amplifiers in protest.'),
      beat('A Different Ending', 'The book predicting the giant’s future omits the possibility of leaving.', 'Let the host write their own last chapter.', 'Preserve conflicting editions in public.', 'Replace every copy with a liberation manifesto.'),
    ]),
  franchise('orchid', 'Serendipity: Glasshouse Jubilee', 'humid botanical greenhouse tea bar', 'huge stained glass greenhouse, hanging orchids, jade ceramic cups, brass irrigation gears and blue planetary skin beyond the glass',
    [
      beat('Roots in the Nerves', 'A casino garden is draining water from the host’s sensory ducts.', 'Co-design a new irrigation route with the host.', 'Map which plants and nerves are affected.', 'Flood the garden to save the host immediately.'),
      beat('The Last Seed', 'The franchise sells rare flowers from the host’s colonized homeworld as souvenirs.', 'Offer seed custody to surviving gardeners.', 'Trace the botanical theft and name its financiers.', 'Confiscate the seed vault for redistribution.'),
      beat('Bloom Vote', 'Guests are voting on a garden expansion into living tissue.', 'Convene a vote where the host has veto power.', 'Expose who was excluded from the ballot.', 'Shut off construction power during the vote.'),
    ]),
  franchise('rink', 'Serendipity: Zero-G Roller Palace', 'roller-disco milkshake counter', 'mirrored disco balls, chrome skate railings, candy-colored lights, floating milkshake cups and blue giant knuckles beneath the translucent rink',
    [
      beat('Floor Is Alive', 'The skating rink is literally the casino host’s knuckles.', 'Ask the host to design an alternate skating surface.', 'Measure pain responses during the contest.', 'Cancel the competition and unbolt the rink at once.'),
      beat('Disco Strike', 'Skaters work for prize tokens while the host provides unpaid power.', 'Organize a joint skater-host bargaining committee.', 'Project the wage ledger onto the disco ball.', 'Occupy the DJ booth until wages are paid.'),
      beat('One Last Dance', 'The giant wants the music stopped long enough to hear their old lullaby.', 'Let the host choose when the final song ends.', 'Capture the lullaby for an uncensored public record.', 'Play it over every speaker against management’s orders.'),
    ]),
  franchise('opera', 'Serendipity: The Last Aria', 'gilded opera lounge and champagne-free salon', 'crimson opera curtains, gold balconies, powdered blue stage lights and a gigantic living cobalt ear serving as the concert shell',
    [
      beat('Unpaid Orchestra', 'The host’s heartbeat drives the orchestra pit without consent.', 'Negotiate a performance the host can conduct.', 'Record the hidden cardiac score.', 'Stop the pumps midway through the gala.'),
      beat('Voice of the House', 'A singer secretly learned the giant’s language and refuses to perform ownership hymns.', 'Help the singer and host choose a new program.', 'Publish translations of the offending libretto.', 'Hijack opening night for an unsanctioned solo.'),
      beat('The Standing Ovation', 'The applause causes seismic shocks the host cannot escape.', 'Ask the host whether an encore is welcome.', 'Show the audience what their applause does.', 'Evacuate the balconies and end the show.'),
    ]),
  franchise('laundry', 'Serendipity: Spin Cycle', 'twenty-four-hour laundromat diner', 'rows of round chrome washing-machine doors, blue soap neon, red vinyl booths, detergent dispensers and a colossal cobalt wrist under the spinning drum floors',
    [
      beat('The Lost Uniform', 'Maintenance washes away every protest banner the host writes on their own skin.', 'Secure a protected place for the host to speak.', 'Rescue the erased messages from the rinse water.', 'Jam the machines with all the protest flags.'),
      beat('Wash Tax', 'Visitors must pay a fee to rinse the blue skin they stand on.', 'Negotiate sanitation as a shared service.', 'Audit where the tax actually goes.', 'Open the valves and waive the fee.'),
      beat('Permanent Press', 'A machine is pressing casino deeds into the host’s skin.', 'Help the giant choose what the marks should become.', 'Photograph the original inscriptions for a hearing.', 'Destroy the presses before another mark is made.'),
    ]),
  franchise('sauna', 'Serendipity: Nebula Steam', 'quiet orbital sauna and mineral-water bar', 'timber steam rooms, blue ceramic basins, copper pipes, frosted windows and a moon-sized blue alien palm supporting the bathing decks',
    [
      beat('Heat Without Consent', 'The giant’s thermal vents are tapped to warm tourists.', 'Ask the host what temperature they can share safely.', 'Prove how much heat was extracted.', 'Close the vents before guests can leave the baths.'),
      beat('The Mineral Claim', 'The sauna advertises stolen homeworld minerals as a wellness treatment.', 'Arrange a fair stewardship agreement.', 'Trace the mineral cargo back to the dispossession.', 'Confiscate every jar for the host.'),
      beat('Cold Plunge', 'The host wants one quiet night without a visitor or profit meter.', 'Negotiate a paid closure with the workers.', 'Tell the bathers why the host needs peace.', 'Kill the lights and force an immediate shutdown.'),
    ]),
  franchise('bowling', 'Serendipity: Lucky Strikes', 'cosmic bowling alley and noodle bar', 'glowing bowling lanes, floating tenpin constellations, orange lane lamps and immense blue tendons holding the alley aloft',
    [
      beat('The Ten Pins', 'The pins are carved from the giant’s stolen cradle.', 'Ask the host what to do with the heirloom.', 'Identify who sold the cradle and when.', 'Remove every pin while the league is playing.'),
      beat('Strike Insurance', 'The host is billed whenever a player rolls a strike.', 'Renegotiate the absurd insurance policy.', 'Show the league its hidden fine print.', 'Invalidate the insurer’s scorekeeping system.'),
      beat('Perfect Game', 'A champion offers to break a world record if the host endorses the casino.', 'Let the host negotiate the endorsement.', 'Reveal the record’s real cost.', 'Interrupt the championship with the host’s testimony.'),
    ]),
  franchise('chapel', 'Serendipity: Wedding Drive-Thru', 'neon drive-through wedding chapel and café', 'pink wedding arches, paper bouquet bouquets, chrome self-service vows, blue neon wedding rings and colossal living blue shoulder under the chapel',
    [
      beat('A Vow Made by Nobody', 'The casino entered the host into a perpetual lease using a forged wedding vow.', 'Give the host counsel and a chance to reject it.', 'Recover proof of the forged signature.', 'Annul every contract at the chapel at once.'),
      beat('The Witness', 'A wedding photographer holds images of the original colonization.', 'Secure permission from the host to share them.', 'Document the photograph’s chain of custody.', 'Project the images during a mass ceremony.'),
      beat('Speak Now', 'The host is invited to object at an anniversary renewal, but the microphone is disconnected.', 'Put a working microphone within reach.', 'Read the objections into the public record.', 'Stop the ceremony until the host is heard.'),
    ]),
  franchise('cinema', 'Serendipity: Rewind Palace', 'retro drive-in cinema and popcorn counter', 'scarlet cinema seats, giant film reels, glowing projectors, a huge blue alien face in a moon-sized window behind the screen',
    [
      beat('The Censored Reel', 'A film about the giant’s planet cuts to black before the colonists arrive.', 'Work with the host on a complete cut.', 'Find and document the missing footage.', 'Run the uncensored reel without the owners’ approval.'),
      beat('Audience of One', 'The host wants to watch a movie but cannot see the screen attached to their head.', 'Reposition the screen for the host.', 'Prove the theater was designed to exclude its owner.', 'Turn the projector around in the middle of the show.'),
      beat('Credits', 'The colonists listed the giant as scenery in every production.', 'Invite the host to write the next credits.', 'Publish the names behind the omission.', 'Refuse to show the finale until the credits change.'),
    ]),
  franchise('mech', 'Serendipity: Repair Bay 13', 'grease-stained mechanic’s bar and garage', 'robotic vehicle lifts, yellow hazard stripes, old chrome stools, sparking service drones and immense blue knuckles threaded with casino scaffolds',
    [
      beat('Unscheduled Maintenance', 'Casino repair crews call the giant’s pain an equipment fault.', 'Demand the host set repair priorities.', 'Archive maintenance complaints as medical testimony.', 'Remove dangerous drills before inspectors arrive.'),
      beat('Service Contract', 'The host is prohibited from hiring a mechanic of their own.', 'Find an independent technician the host trusts.', 'Show the contract’s conflict of interest.', 'Refit a spare drone for the host without approval.'),
      beat('The Last Bolt', 'One load-bearing bolt secures a profitable wing to the giant’s tendon.', 'Plan a safe removal with the host and crew.', 'Prove which shareholders rejected an earlier repair.', 'Cut the wing loose during a busy shift.'),
    ]),
  franchise('farm', 'Serendipity: Cloudtop Harvest', 'farm-to-table diner with hanging gardens', 'raised herb beds, wicker lamps, seed shelves, pastel tablecloths and a living blue alien shoulder under the terraced greenhouse',
    [
      beat('The Ownership Salad', 'The casino grows herbs in soil taken from the giant’s stolen homeworld.', 'Return cultivation decisions to displaced farmers.', 'Catalogue who moved the topsoil and why.', 'Shut down the dining service and distribute the crops.'),
      beat('A Living Terrace', 'Garden expansion will permanently numb part of the host.', 'Ask the host to mark protected tissue.', 'Publicize the architect’s ignored warnings.', 'Remove the terrace supports immediately.'),
      beat('First Harvest', 'The last farmer who remembers the old blue world offers a seed to its former guardian.', 'Arrange the return on the host’s terms.', 'Record the farmer’s story without selling it.', 'Plant the seed on the giant before consulting anyone.'),
    ]),
  franchise('haunt', 'Serendipity: Ghostline Carriage', 'haunted railway dining car', 'dark mahogany train booths, brass lanterns, spectral luggage racks and enormous living blue fingers serving as railway viaduct supports',
    [
      beat('The Missing Passenger', 'The last transport from the giant’s conquered world is listed as a ghost train.', 'Ask survivors whether to reopen the manifest.', 'Recover the falsified passenger records.', 'Force open the sealed carriage with everyone watching.'),
      beat('Tickets to Nowhere', 'The casino sells rides over the host’s body without any stops that permit disembarking.', 'Negotiate safe exits with workers and the host.', 'Show tourists the hidden route map.', 'Halt the train until real exits exist.'),
      beat('End of the Line', 'The host has never been allowed to say where they wish the line to end.', 'Let the host choose a final station.', 'Publish all alternative routes and their costs.', 'Divert the train across the casino’s private bridge.'),
    ]),
  franchise('karaoke', 'Serendipity: Static Karaoke', 'cryogenic karaoke lounge and soup bar', 'glowing karaoke booths, frosted microphones, hovering lyric holograms, steel soup pots and a giant blue throat behind a frost-covered observation wall',
    [
      beat('The Frozen Singer', 'Casino management muted the host’s voice after an off-key note shook the dance floor.', 'Ask the host for a safe duet.', 'Record the acoustic suppression order.', 'Turn the giant’s microphone back on during finals.'),
      beat('Songs Without Owners', 'The bar profits from songs taken from the giant’s homeworld without credit.', 'Set up a royalty agreement the host accepts.', 'Publish the provenance of the stolen songs.', 'Replace the karaoke playlist with the originals.'),
      beat('Open Mic', 'A crowd offers to sing with the host if management will permit it.', 'Invite the host to set the terms.', 'Read the venue’s censorship notices aloud.', 'Disable every mute switch for a chaotic final chorus.'),
    ]),
  franchise('diner', 'Serendipity: Breakfast at Oblivion', 'all-night breakfast diner', 'checkered turquoise floor, spinning chrome stools, sunny egg lamps, griddles and a blue planet-scale alien’s cheek outside panoramic windows',
    [
      beat('Second Breakfast', 'The colonists charged the host for sunlight falling on their own face.', 'Recalculate the bill with the host at the table.', 'Expose the absurd solar tax to the diners.', 'Refuse payment and black out the meter.'),
      beat('Order Up', 'Every breakfast order is billed as a minor medical procedure on the giant.', 'Offer a new menu that does no harm.', 'Review the medical invoices one by one.', 'Close the griddle until the bills are voided.'),
      beat('The Morning Shift', 'The host wants to sleep through dawn for the first time since colonization.', 'Arrange paid leave and a quiet morning.', 'Let every patron hear the request.', 'Pull the shutters without telling management.'),
    ]),
  franchise('market', 'Serendipity: Midnight Bazaar', 'lantern-lit night market and spice bar', 'saffron market awnings, hanging brass scales, narrow tea stalls, lantern strings and immense blue living forearms beneath the bazaar',
    [
      beat('The Bargain of a Lifetime', 'A trader is auctioning a deed to the giant’s childhood shadow.', 'Help the host challenge the claimed ownership.', 'Record every bidder and the auction terms.', 'Buy and shred the deed before the hammer falls.'),
      beat('The Honest Scale', 'Market scales silently deduct a fraction of every sale for casino management.', 'Negotiate restitution for small traders.', 'Reveal the calibrated theft.', 'Break the scales and stop trading for the night.'),
      beat('The Price of Freedom', 'Traders offer to move their stalls off the host if they can keep their livelihoods.', 'Help build a plan that protects both.', 'Show the cost of relocating each stall.', 'Evict the whole bazaar overnight.'),
    ]),
  franchise('museum', 'Serendipity: Museum of Tomorrow', 'retro-futurist museum café', 'chrome robot exhibits, glass specimen cases, cream tile, mint-green neon and a gigantic blue alien eye behind the museum atrium',
    [
      beat('The Exhibit', 'The host is listed on the museum map as an extinct specimen.', 'Let the host write their own exhibition label.', 'Gather evidence proving they are alive and speaking.', 'Pull down the inaccurate signs during visiting hours.'),
      beat('Future Perfect', 'The simulation predicts the casino will expand until the host disappears.', 'Ask the host what future they actually want.', 'Publish the model’s hidden assumptions.', 'Delete the expansion schedule from the exhibit engine.'),
      beat('Admission Free', 'Schoolchildren want to meet the host, not buy tickets to their body.', 'Arrange a meeting with consent and safeguards.', 'Explain to children how the exhibit was built.', 'Open the security gates for everyone.'),
    ]),
  franchise('observatory', 'Serendipity: Desert Stargazer', 'desert astronomy pub and telescope deck', 'ochre sandstone towers, brass observatory domes, purple night skies, patterned woven stools and a colossal blue alien elbow supporting the telescope platform',
    [
      beat('False Constellation', 'The casino’s light show hides the host’s home planet from every telescope.', 'Let the host point out where home once was.', 'Map the lights that block the view.', 'Switch off the whole casino grid for one clear night.'),
      beat('A Planet for Sale', 'A star-chart trader has listed the giant’s former world as vacant real estate.', 'Bring displaced residents into the negotiation.', 'Verify the forged land records.', 'Intercept the seller’s next broadcast.'),
      beat('First Light', 'The host asks to see the sunrise on their own terms.', 'Rebuild the deck at the angle they choose.', 'Document the sky obstruction.', 'Move the telescope array before authorization arrives.'),
    ]),
  franchise('carnival', 'Serendipity: Gravitational Funfair', 'travelling carnival lounge and pie stall', 'painted carousel horses, striped circus booths, cotton-candy lights, a ferris wheel and giant living blue fingertips bending the carousel rails',
    [
      beat('The Ferris Wheel', 'A ride turns on a blue giant’s bone joint and every revolution hurts.', 'Help the host choose a different power source.', 'Count the painful cycles and tell the visitors.', 'Stop the ride with passengers still aboard.'),
      beat('Everyone Wins', 'The rigged carnival games pay prizes from the host’s unpaid wages.', 'Arrange restitution without harming the workers.', 'Show the mechanics of the rigged games.', 'Empty the prize machines into the street.'),
      beat('The Exit Sign', 'The host wants an exit, but no one designed the casino with a way for them to leave.', 'Work with the host on a safe long-term departure.', 'Expose the architectural impossibility.', 'Force the evacuation now without a landing site.'),
    ]),
] as const

export const FRANCHISE_COUNT = 20
export const CASINO_ORIGIN =
  'Planet-sized cobalt-blue people lost their homeworld to colonists. Casino operators call the giant hosts agreeing to carry gambling halls on their living bodies a fair settlement, though the hosts had little power to refuse.'
export const GIANT_LOOK =
  'one living planet-sized cobalt-blue alien person with an enormous expressive face, giant arm and shoulder, small bright casino towers and pedestrian galleries built onto and around the living body'
const SYSTEM_SEEDS = [
  ['Copperglass', 'An oxygen union is fighting the colonial charter.', 'Vaela'],
  ['Tin-Choir', 'A debt court has declared memory a commodity.', 'Orun'],
  ['Low Lantern', 'Refugee docking permits are priced in daylight.', 'Seph'],
  ['Moonspindle', 'The gravity regulator has begun charging rent.', 'Tavrin'],
  ['Cold Ledger', 'The science council wants to erase a labor strike.', 'Nerel'],
  ['Bellwake', 'Farmers contest a corporation’s claims to their weather.', 'Bireth'],
  ['Thistle Halo', 'A council classifies spoken testimony as vandalism.', 'Eshra'],
  ['Morrow Gate', 'A cartel monopolizes the only emergency airlock.', 'Daoran'],
  ['Dusk Meridian', 'The people who built the ports cannot enter them.', 'Ione'],
  ['Velvet Umbra', 'A museum buys the legal future of its own residents.', 'Nadri'],
  ['Porcelain Reach', 'Every voter is being charged for the heat of their ballot.', 'Kelan'],
  ['Last Parallax', 'A security service auctions other people’s dreams.', 'Nima'],
] as const

function hash(seed: number, key: string): number {
  let n = (seed >>> 0) ^ 2166136261
  for (const c of key) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0
  return n
}
export type SolarSystem = {
  id: string
  name: string
  conflict: string
  giant: string
  franchise: Franchise
  casinoName: string
}
export function solarCircuit(seed: number): SolarSystem[] {
  const length = 4 + (hash(seed, 'systems-count') % 4)
  const order = SYSTEM_SEEDS.map((row, i) => ({ row, i })).sort(
    (a, b) => hash(seed, 'system-order-' + a.i) - hash(seed, 'system-order-' + b.i),
  ).slice(0, length)
  const themes = SERENDIPITY_FRANCHISES.map((item, i) => ({ item, i })).sort(
    (a, b) => hash(seed, 'theme-order-' + a.i) - hash(seed, 'theme-order-' + b.i),
  )
  return order.map(({ row, i }, index) => ({
    id: 'sun-' + i,
    name: row[0],
    conflict: row[1],
    giant: row[2],
    franchise: themes[index]!.item,
    casinoName: row[2] + ' Grand Casino',
  }))
}
export function chapterSystem(seed: number, chapter: number): SolarSystem {
  const systems = solarCircuit(seed)
  return systems[(Math.max(1, chapter) - 1) % systems.length]!
}
export function venueArtPrompt(system: SolarSystem): string {
  return `Wide 16:9 sci-fi location illustration of ${GIANT_LOOK}. The alien's name is ${system.giant}; blue skin remains visibly alive and expressive. On its shoulder is ${system.casinoName}: roulette terraces and ringed casino balconies resting on, not cutting through, the titan's skin. INSIDE the casino is the Serendipity franchise "${system.franchise.name}", ${system.franchise.illustration}. Barkeep Vox is a short wrinkled grey-beige humanoid tardigrade in a brown leather apron. A long bright scarlet velvet couch carrying four travelers floats in a transparent atmospheric force bubble alongside the casino. Wide cinematic three-quarter view, warm casino interior lighting against deep violet space. Painted gouache, brown ink outlines, vivid physical scene, legible architectural silhouette, no text labels.`
}
export type VenueProgress = {
  /** Completed authored franchise beats per system. */
  barBeats: Record<string, number>
  /** One casino dilemma and optionally one after-hours Serendipity quest per chapter. */
  completed: string[]
  choices: { systemId: string; chapter: number; venue: 'bar' | 'casino'; choice: CasinoChoice; scene: string }[]
}
export function newVenueProgress(): VenueProgress {
  return { barBeats: {}, completed: [], choices: [] }
}
const CASINO_INCIDENTS = [
  { title: 'The Unauthorized Itch', description: 'A roulette terrace has been constructed over a nerve the host cannot reach; the casino has refused a scratching permit.' },
  { title: 'Colonial Settlement Day', description: 'The casino celebrates the seizure of the blue giants’ homeworld as a holiday and bills the giant host for the fireworks.' },
  { title: 'The House Always Wins', description: 'A table dealer reveals that the giant host is automatically billed for every winning hand.' },
  { title: 'A Question of Consent', description: 'A property inspector insists the giant host consented to carrying the casino, although no translator was present.' },
  { title: 'Night Shift', description: 'The host wants six hours of sleep, but every casino schedule requires them to remain awake.' },
  { title: 'A Fair Agreement', description: 'Colonists offer the giant one percent of profits if they surrender the right to move.' },
  { title: 'Jackpot Evacuation', description: 'A casino fire alarm goes off inside the host’s outer ear, and every emergency exit leads farther onto their body.' },
  { title: 'The Other Owners', description: 'Another blue giant broadcasts a warning that the casino franchise plans to expand into their sleeping sister.' },
] as const
export function casinoIncident(seed: number, chapter: number, system: SolarSystem) {
  return CASINO_INCIDENTS[hash(seed, `casino:${chapter}:${system.id}`) % CASINO_INCIDENTS.length]!
}
export function afterHoursIncident(seed: number, chapter: number, system: SolarSystem) {
  const variants = [
    `A guest at ${system.franchise.name} finds a hidden message from ${system.giant} under the next round of drinks.`,
    `The bar's sentient gravity moves the stools away from a tax collector who claims to own ${system.giant}'s name.`,
    `The night staff want to turn ${system.franchise.name} into a meeting place for the giant's displaced neighbors.`,
    `A patron offers to buy the bar's silence about the casino's plans for ${system.giant}.`,
  ]
  return variants[hash(seed, `bar:${chapter}:${system.id}`) % variants.length]!
}
export function sceneForChoice(beat: VenueBeat, choice: CasinoChoice): string {
  return beat[choice === 'ask' ? 'ask' : choice === 'document' ? 'document' : 'override']
}

/**
 * Complete one interactive casino or bar quest action. The player can finish
 * a franchise's three-act story during one stop; subsequent visits draw
 * new seeded after-hours dilemmas, never an empty location.
 */
export function visitCasinoVenue(
  run: import('./rules').VoyageRun,
  venue: 'bar' | 'casino',
  choice: CasinoChoice,
): import('./rules').VoyageRun {
  if (run.phase !== 'expedition' || !['ask', 'document', 'override'].includes(choice))
    return run
  const system = chapterSystem(run.seed, run.chapter)
  const state = run.venueProgress ?? newVenueProgress()
  const completed = [...state.completed]
  const stage = Math.min(3, state.barBeats[system.id] ?? 0)
  const key = `${run.chapter}:${system.id}:${venue}`
  if (completed.includes(key)) return run
  const narrative =
    venue === 'bar' && stage < 3
      ? sceneForChoice(system.franchise.beats[stage]!, choice)
      : venue === 'bar'
        ? afterHoursIncident(run.seed, run.chapter, system)
        : casinoIncident(run.seed, run.chapter, system).description
  const reaction =
    choice === 'ask'
      ? `${system.giant} was asked directly; the host's response is entered into the decision, rather than assumed.`
      : choice === 'document'
        ? `The evidence is filed publicly so the blue hosts and local workers can challenge the terms.`
        : `The captain intervenes without a full agreement. Some workers cheer; ${system.giant} asks who decided this was help.`
  if (venue === 'casino' || stage >= 2) completed.push(key)
  const nextStage = venue === 'bar' && stage < 3 ? stage + 1 : stage
  const scene = `${narrative} ${reaction}`
  return {
    ...run,
    venueProgress: {
      barBeats: { ...state.barBeats, [system.id]: nextStage },
      completed,
      choices: [
        ...state.choices,
        { systemId: system.id, chapter: run.chapter, venue, choice, scene },
      ],
    },
    supplies: Math.max(0, run.supplies + (choice === 'ask' ? -1 : choice === 'override' ? 1 : 0)),
    trust: Math.max(0, run.trust + (choice === 'ask' ? 1 : choice === 'override' ? -1 : 0)),
    reputation: run.reputation + (choice === 'document' ? 1 : 0),
    intervention: run.intervention + (choice === 'override' ? 1 : 0),
    worldFlags: [...(run.worldFlags ?? []), `casino:${system.id}:${venue}:${choice}`],
    scene,
    log: [...run.log, `Ship day ${run.day ?? run.chapter}: ${system.franchise.name} on ${system.giant}'s occupied body. ${scene}`],
  }
}
