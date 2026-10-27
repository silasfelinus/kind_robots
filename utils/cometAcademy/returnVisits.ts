import type { SiteId } from './cityMap'
import type { CityEvent } from './districtEncounters'

// The week-gated second visit to every landmark (conductor comet-city-academy
// t-020; DESIGN-BRIEF: "60 unique week-gated location cards"). A site reopens
// seven days after a visit; until now the return replayed the first card with
// a generic line. Each return is its own scene: the first dilemma, a week on,
// with the bill arriving. Option ids are new so first-visit logs stay intact.

const help = { influence: 2, danger: -1, trust: 2 }
const exploit = { influence: -2, danger: 1, trust: -2 }

export const RETURN_VISITS: Record<SiteId, CityEvent> = {
  'academy-roof': {
    title: 'The Forecast Under the Flowerpot',
    location: 'Academy Roof',
    scene:
      "A second report dated tomorrow is tucked under Imani's tomato pot. This one describes the roof giving way during the prom afterparty and lists the night janitor who waters these plants among the injured. He is up here now, humming, with a watering can.",
    options: [
      {
        id: 'return-roof-inspect',
        label: 'Inspect the roof with the janitor',
        text: 'He knows every soft patch by heart. Together you find support beams cut halfway through with a contractor’s saw, and he gives you the name stencilled on the abandoned blade.',
        ...help,
      },
      {
        id: 'return-roof-sell',
        label: 'Sell the forecast to the prom committee',
        text: 'The committee pays well and quietly moves the afterparty indoors. Nobody tells the janitor, who keeps watering tomatoes over a roof that someone wants to fall.',
        ...exploit,
      },
    ],
  },
  'theater-wing': {
    title: 'An Extra in the Rehearsal',
    location: 'Theater Wing',
    scene:
      'The stage that counted down last week now replays the rehearsal on its own, with one extra dancer nobody cast. The projected dancer walks the same path every night, from the wings to a sealed door in the fly loft, and the committee has started charging admission.',
    options: [
      {
        id: 'return-theater-trace',
        label: 'Bring the dancers back to trace the path',
        text: 'The dancers mark the route in tape and open the fly loft together. Behind the sealed door is a relay transmitter aimed at the ballroom, still warm.',
        ...help,
      },
      {
        id: 'return-theater-tickets',
        label: 'Take a cut of the ghost-show tickets',
        text: 'The haunted rehearsal sells out twice. The relay in the loft keeps recording every ticket holder, and the proceeds buy you a front-row seat to the prom.',
        ...exploit,
      },
    ],
  },
  'archive-stacks': {
    title: 'Eleven More Names',
    location: 'Archive Stacks',
    scene:
      'The student the instructor wanted erased is back in the stacks, rebuilding the graduation list by hand from attendance sheets. They have found eleven more names removed the same way, all students who once filed complaints about patrol injuries.',
    options: [
      {
        id: 'return-archive-restore',
        label: 'Restore all twelve names in public',
        text: 'You copy the attendance sheets for the registrar, the student union and the twelve students themselves. The instructor goes on sudden leave, and the staff tunnel door is bricked over by Friday.',
        ...help,
      },
      {
        id: 'return-archive-trade',
        label: 'Trade the eleven names for your own record',
        text: 'The instructor polishes your transcript and loses the attendance sheets. The student who found them stops coming to the stacks, and eleven graduates learn about it only at the ceremony.',
        ...exploit,
      },
    ],
  },
  'transit-gate': {
    title: 'The Warrant Comes Back Signed',
    location: 'Dimensional Gate',
    scene:
      'The gate company returns with a judge’s signature on its warrant for Zuzu, and a second warrant for a family who arrived through the same portal last night. Zuzu stands between them and the company guards and asks, very politely, whether heroes stand where a hired blade would.',
    options: [
      {
        id: 'return-gate-stand',
        label: 'Stand with Zuzu and file the family’s asylum claim',
        text: 'You hold the gate with a koala, a lawyer from the night bazaar and three tired parents until the court reopens. The family stays. Zuzu cleans his sword and tells you that was the first fight he has enjoyed in years.',
        influence: 2,
        danger: 1,
        trust: 2,
      },
      {
        id: 'return-gate-split',
        label: 'Enforce the family’s warrant and let Zuzu go',
        text: 'The company accepts the trade and Zuzu walks free. He does not thank you. The family is returned through a portal nobody has tested in the other direction.',
        ...exploit,
      },
    ],
  },
  observatory: {
    title: 'Triangulating a Kindness',
    location: 'City Observatory',
    scene:
      'The dean’s astronomers have triangulated the one anonymous bearing Tess shared and plan to publish it as a discovery. The paper names a star field where nothing should be. Tess’s crew is already on the line, asking whether the academy keeps its word longer than a week.',
    options: [
      {
        id: 'return-observatory-scramble',
        label: 'Scramble the data with Tess’s crew',
        text: 'Tess walks you through a navigator’s trick: three false bearings that agree with each other. The paper is published, wrong, and the sanctuary keeps its quiet.',
        ...help,
      },
      {
        id: 'return-observatory-coauthor',
        label: 'Co-author the paper',
        text: 'Your name goes on a celebrated discovery. Within a month, survey ships are crossing the star field, and Tess stops answering the observatory’s calls.',
        ...exploit,
      },
    ],
  },
  'city-grants': {
    title: 'The Audit Finds Your Class',
    location: 'Civic Grants Hall',
    scene:
      'The audit someone began last week has reached the prom budget. Your own class’s decorations were paid from the injury scholarship too: a chandelier rental, a smoke machine, four hundred glow sticks. The clerk asks whether you want to see the page before it is filed.',
    options: [
      {
        id: 'return-grants-repay',
        label: 'Testify and return the class’s share',
        text: 'The class votes, grumbling, to sell back the glow sticks and the smoke machine. An injured student gets three months of physical therapy, and the auditor adds a line of thanks to the report.',
        ...help,
      },
      {
        id: 'return-grants-shred',
        label: 'Lose the class’s page',
        text: 'The page disappears and the prom keeps its smoke machine. The clerk who helped you remembers, and so does the auditor who notices a gap in the numbering.',
        ...exploit,
      },
    ],
  },
  'transit-lab': {
    title: 'The Machine Turns Around',
    location: 'Academy Transit Lab',
    scene:
      'The prediction machine has stopped projecting your friend and started projecting you: one future in a rescue coat, one behind a prison desk. Your friend is in the lab, staring at the second one, waiting to see what you will do with your own evidence.',
    options: [
      {
        id: 'return-lab-share',
        label: 'Show your friend both futures and ask for help',
        text: 'You stand together in front of the worst version of yourself. Your friend points out three choices it got wrong already, and the two of you unplug the machine and sell its gears to fund the infirmary.',
        ...help,
      },
      {
        id: 'return-lab-recalibrate',
        label: 'Recalibrate it to flatter you for the dean',
        text: 'The dean sees only the rescue coat. Your friend saw the other one first, and the next time you ask for trust, they ask which projection is talking.',
        ...exploit,
      },
    ],
  },
  'student-commons': {
    title: 'The Balcony Tasting Menu',
    location: 'Student Commons',
    scene:
      'Five courses of catering samples for the prom donors’ balcony arrive at the commons by mistake: scallops, saffron rice, a small ice sculpture of a swan. The pantry line is still twenty students long. The caterer is on the phone asking where the swan went.',
    options: [
      {
        id: 'return-commons-serve',
        label: 'Serve the samples to the pantry line',
        text: 'Everyone in line gets a scallop and a napkin. Mina invites the donors to lunch at the commons, and two of them come back the next week with crates instead of speeches.',
        ...help,
      },
      {
        id: 'return-commons-balcony',
        label: 'Take a seat at the donors’ table',
        text: 'You return the samples personally and are invited to taste the rest upstairs. The swan melts on the balcony. The pantry shelves stay as empty as last week.',
        ...exploit,
      },
    ],
  },
  infirmary: {
    title: 'The Suit Comes Back',
    location: 'Campus Infirmary',
    scene:
      'The defective rescue suit is back in the infirmary, this time on a new patient with a dislocated shoulder. Kit wants a recall. The insurer says the suit passed its inspection, and offers to replace it for whoever signs that it did.',
    options: [
      {
        id: 'return-infirmary-recall',
        label: 'Organize a recall with every injured wearer',
        text: 'Kit lines up six patients and six identical injuries for the review board. The suits are pulled from the armory by evening, and the insurer starts returning calls.',
        ...help,
      },
      {
        id: 'return-infirmary-locker',
        label: 'Move the suit into a rival’s locker',
        text: 'The suit leaves the infirmary and reaches a rival class. Kit stops asking for your help, and the next patient arrives on a stretcher.',
        ...exploit,
      },
    ],
  },
  'training-arena': {
    title: 'The Rematch Nobody Sponsored',
    location: 'Training Arena',
    scene:
      'The maintenance staff have organized an unsponsored rematch after hours: folding chairs, a borrowed microphone and a donation jar for the technician’s back wages. The wealthy trainee has shown up to fight for real. So has a network producer with a contract.',
    options: [
      {
        id: 'return-arena-jar',
        label: 'Fight for the donation jar',
        text: 'The match is ugly and honest. The jar fills with coins and two weeks of wages, and the trainee shakes Sol’s hand at the end, bleeding slightly and grinning.',
        ...help,
      },
      {
        id: 'return-arena-footage',
        label: 'Sell the producer the footage',
        text: 'The rematch airs with a sponsor logo painted over the folding chairs. The technician’s jar is counted as network property, and the staff turn out the lights early.',
        ...exploit,
      },
    ],
  },
  'engineering-workshop': {
    title: 'Every Suit Has One',
    location: 'Engineering Workshop',
    scene:
      'Ash has opened twelve more rescue suits and found twelve more command chips, including one sewn into the lining of Ash’s own weather coat. The faculty insists the chips are for safety. Ash is holding the tweezers very still.',
    options: [
      {
        id: 'return-workshop-teardown',
        label: 'Hold a public teardown',
        text: 'Students line up with their suits and pull the chips together on a long bench. By the end there is a jar of them, and the faculty agrees to a manual release on every suit.',
        ...help,
      },
      {
        id: 'return-workshop-remotes',
        label: 'Keep a remote for every chip',
        text: 'You now control thirteen people’s rescue suits. Ash finds the remote case in your bag a week later and does not ask for an explanation.',
        ...exploit,
      },
    ],
  },
  'botanical-conservatory': {
    title: 'A Cutting in the Mailroom',
    location: 'Botanical Conservatory',
    scene:
      'A parcel in the academy mailroom is leaking soil. Inside is a cutting of the pain-medicine vine, wrapped in wet newspaper and addressed to an offshore lab. The gardener has been searching the greenhouse for it since dawn.',
    options: [
      {
        id: 'return-conservatory-replant',
        label: 'Return it and plant a second vine in the commons',
        text: 'The gardener roots the cutting by the commons windows where anyone can see it grow. By prom it has flowered, and Kit has a second harvest for the waterfront.',
        ...help,
      },
      {
        id: 'return-conservatory-forward',
        label: 'Forward the parcel for a finder’s fee',
        text: 'The offshore lab pays promptly and thanks you by name. Six months later the medicine is for sale on the waterfront at a price nobody there can pay.',
        ...exploit,
      },
    ],
  },
  'student-dormitory': {
    title: 'The Missing Student Writes Back',
    location: 'Student Dormitory',
    scene:
      'The borrowed curfew pass buzzes in its reader with a message from the student who vanished. They are alive, hiding in the staff tunnels, because they saw what the dean keeps in the private corridor. They want to see their family, and they want nobody else to know.',
    options: [
      {
        id: 'return-dormitory-reunite',
        label: 'Guide the family through the tunnels',
        text: 'Nix runs the family through three portals and one laundry chute. The reunion happens beside a boiler at two in the morning, and the student gives you a map of the corridor.',
        ...help,
      },
      {
        id: 'return-dormitory-report',
        label: 'Report the hiding place for honors credit',
        text: 'Security finds the student within the hour. The honors credit arrives on letterhead, and the corridor is emptied before anyone else can see what was inside.',
        ...exploit,
      },
    ],
  },
  'ethics-hall': {
    title: 'The First Complaint',
    location: 'Ethics Hall',
    scene:
      'The review panel has received its first formal complaint from a resident about a student patrol. The complaint is about you: a broken fence, a frightened dog and a door you kicked in on the wrong floor. The dean offers to make it disappear.',
    options: [
      {
        id: 'return-ethics-answer',
        label: 'Answer the complaint in person',
        text: 'You fix the fence on a Saturday and apologize to the dog, who forgives you faster than the owner. The panel publishes the case as an example of what accountability looks like.',
        influence: 2,
        danger: 0,
        trust: 2,
      },
      {
        id: 'return-ethics-dismiss',
        label: 'Let the dean dismiss it',
        text: 'The complaint is closed as unfounded. The resident posts the footage of the broken door instead, and the panel’s next meeting is standing room only.',
        ...exploit,
      },
    ],
  },
  'academy-docks': {
    title: 'The Guard Who Wants to Stay',
    location: 'Academy Docks',
    scene:
      'One of the robot guards from the relief barge has woken up and walked to the union hall. It refuses its activation orders, asks for work and keeps saying that it was built to guard and would like to guard something it chooses. The buyer wants it back.',
    options: [
      {
        id: 'return-docks-hire',
        label: 'Help the union give it a dock job',
        text: 'The dockworkers vote it a probationary card and a hard hat that almost fits. It guards the medicine shipments now, and the buyer’s next crate is opened on the pier in front of everyone.',
        ...help,
      },
      {
        id: 'return-docks-return',
        label: 'Sell it back to the buyer',
        text: 'The guard goes back into its crate without resisting, which is worse. The buyer pays in cash, and the union paints over the spot where it used to stand.',
        ...exploit,
      },
    ],
  },
  'waterfront-market': {
    title: 'Spring Tide',
    location: 'Waterfront Market',
    scene:
      'The first spring tide of the season is rising, and the market will learn tonight whose flood defenses work. The vendors are out with sandbags. Families outside the broker’s barriers are asking whether student heroes charge by the stall.',
    options: [
      {
        id: 'return-market-shovel',
        label: 'Shovel through the night with the vendors',
        text: 'The public channel holds with forty people bailing beside it. By morning the whole market is wet and every stall is still open, and the vendors make you breakfast from what floated.',
        ...help,
      },
      {
        id: 'return-market-fees',
        label: 'Charge rescue fees outside the barriers',
        text: 'The stalls that can pay are saved first. By dawn the poorest row is underwater and the broker is offering you a partnership.',
        ...exploit,
      },
    ],
  },
  'transit-union': {
    title: 'The Brake Report Arrives',
    location: 'Transit Union Hall',
    scene:
      'The hidden brake inspection report has reached the union hall in an unmarked envelope. The mayor’s office has called the same afternoon offering the drivers a raise, as long as the report goes back into its envelope and the strike ends quietly.',
    options: [
      {
        id: 'return-union-read',
        label: 'Read the report aloud with the drivers',
        text: 'Mara reads it from a folding table to a packed hall. The trains stay parked until the brakes are fixed, and the raise arrives anyway, a week later, with an apology attached.',
        ...help,
      },
      {
        id: 'return-union-broker',
        label: 'Broker the raise and take a cut',
        text: 'The strike ends with handshakes and a photo. The report goes back in its envelope, and the next carriage to fail has a full load.',
        ...exploit,
      },
    ],
  },
  'neon-arcade': {
    title: 'The Player the Model Condemned',
    location: 'Neon Arcade',
    scene:
      'The tournament’s behavioral model has flagged one player as a probable future villain, and the scholarship sponsors are pulling her funding. She has come back to the arcade to play one more match and to ask the room what she did wrong.',
    options: [
      {
        id: 'return-arcade-prove',
        label: 'Prove the model wrong with her own data',
        text: 'Sol pulls her records and shows the room the model counted late-night shifts at a laundromat as a warning sign. The sponsor restores the scholarship, and the arcade unplugs the leaderboard.',
        ...help,
      },
      {
        id: 'return-arcade-list',
        label: 'Buy the full list of flagged players',
        text: 'You own a list of everyone the model fears. The flagged player loses her scholarship, and the arcade fills a little more quietly every week.',
        ...exploit,
      },
    ],
  },
  'civic-hospital': {
    title: 'The Child Who Tested Positive',
    location: 'Civic Hospital',
    scene:
      'The child from the bottom of the triage list is back with a fever and a new test result: a minor power, a talent for warming cold hands. Overnight the administrators have moved the family to the top of the list and slipped an academy sponsorship contract into the paperwork.',
    options: [
      {
        id: 'return-hospital-need',
        label: 'Insist the list goes by need',
        text: 'The nurses back you and the camera is turned to face the wall. The child is treated in turn, the family tears up the contract, and the waiting room claps for a nurse for the first time in years.',
        ...help,
      },
      {
        id: 'return-hospital-sponsor',
        label: 'Witness the sponsorship contract',
        text: 'The family signs while the child sleeps. The academy gains a future recruit, and the people still waiting at the bottom of the list learn exactly what it takes to move up.',
        ...exploit,
      },
    ],
  },
  'industrial-foundry': {
    title: 'The Night Shift Votes',
    location: 'Industrial Foundry',
    scene:
      'The foundry crew is voting by hand on whether to keep the militia alloy contract or switch the furnace to flood barriers for the waterfront at lower pay. The vote is tied, and both sides are looking at the student who came back.',
    options: [
      {
        id: 'return-foundry-barriers',
        label: 'Bring the market’s barrier order in person',
        text: 'You come back with a signed order from the vendors and a plan to phase the furnace. The vote passes by six, and the first barrier plates are stamped with the workers’ initials.',
        ...help,
      },
      {
        id: 'return-foundry-bonus',
        label: 'Guarantee the militia bonus',
        text: 'The bonus breaks the tie. The militia’s second shipment leaves on schedule, and the families under the power lines start hearing drills at night.',
        ...exploit,
      },
    ],
  },
  skyport: {
    title: 'The Second Shuttle',
    location: 'Comet Skyport',
    scene:
      'A second shuttle is asking for clearance in a storm, and this one carries the brokers who sold refugees’ sanctuary coordinates last month, now running from their own buyers. The controller looks at you and says this one is your call.',
    options: [
      {
        id: 'return-skyport-hearing',
        label: 'Land them and let a public hearing decide',
        text: 'The shuttle lands hard and everyone walks off. The brokers face the families they sold, in a hangar full of folding chairs, and testify to save themselves.',
        ...help,
      },
      {
        id: 'return-skyport-storm',
        label: 'Turn them back into the storm',
        text: 'The shuttle climbs away into the weather and its beacon goes dark over the harbor. Nobody at the skyport mentions it again, and the volunteer pilots stop coming.',
        influence: -2,
        danger: 2,
        trust: -2,
      },
    ],
  },
  'media-spire': {
    title: 'The Third Camera',
    location: 'Media Spire',
    scene:
      'A resident who lives on the bridge has brought a third recording from her balcony. It shows both network feeds were cut from the same rescue, and that the rescuer never blocked the exit at all. She wants it aired with her name on it, or not at all.',
    options: [
      {
        id: 'return-spire-air',
        label: 'Air the raw footage under her name',
        text: 'The footage runs uncut at midnight with her name across the bottom. Both networks retract, and she is invited to teach a class on balcony journalism.',
        ...help,
      },
      {
        id: 'return-spire-exclusive',
        label: 'Buy the footage exclusively',
        text: 'You own the truth about the bridge and can release it when it helps you. The resident sees her recording air two weeks later under someone else’s name.',
        ...exploit,
      },
    ],
  },
  'labor-museum': {
    title: 'The Old Crews Drill Again',
    location: 'Labor Museum',
    scene:
      'The retired engineers have rigged a pulley rescue under the museum statue to teach academy recruits the method that was never credited to them. The estate’s lawyers have arrived to stop what they call unauthorized use of an exhibit.',
    options: [
      {
        id: 'return-museum-drill',
        label: 'Run the drill in front of a crowd',
        text: 'Thirty recruits learn to lift a beam with rope and patience while the lawyers take notes. The museum renames the gallery after the crews by the end of the month.',
        ...help,
      },
      {
        id: 'return-museum-sponsor',
        label: 'Let the estate film it as a sponsored event',
        text: 'The drill runs under the estate’s banner with the founder’s name read aloud twice. The engineers finish the lesson, fold their rope and do not come back.',
        ...exploit,
      },
    ],
  },
  'night-bazaar': {
    title: 'The Depot Manager’s Wound',
    location: 'Night Bazaar',
    scene:
      'The manager of the corrupt medicine depot has staggered into the lantern clinic with a knife wound, afraid to go to the hospital where his own stolen stock is missing. The medic is already threading a needle. The academy is offering a reward for him.',
    options: [
      {
        id: 'return-bazaar-treat',
        label: 'Treat him and ask for the depot records',
        text: 'He is stitched, frightened and grateful. Before dawn he hands over the depot’s real records, and the clinic’s shelves are restocked legally within the week.',
        ...help,
      },
      {
        id: 'return-bazaar-reward',
        label: 'Hand him to the raid for the reward',
        text: 'The patrol drags him out half-stitched. You collect the reward, the depot records burn that night, and the medic closes the curtain on you.',
        ...exploit,
      },
    ],
  },
}

export const returnVisitFor = (siteId: SiteId): CityEvent | undefined =>
  Object.prototype.hasOwnProperty.call(RETURN_VISITS, siteId)
    ? RETURN_VISITS[siteId]
    : undefined
