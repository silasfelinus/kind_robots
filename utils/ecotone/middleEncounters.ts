import type { EncounterCard } from './content'

/**
 * The eight curated middle encounters (conductor weird-humboldt t-027, built at
 * Silas's direction, 2026-11-19 PT: "Go ahead and build the 8 candidate
 * encounters"). Source: projects/weird-humboldt/candidates/
 * MIDDLE-CANDIDATES-2026-11-09.yaml.
 *
 * Each card is a value conflict from IDEOLOGICAL-ECOTONES.md in which a
 * different stock position pays a real cost and earns a real dividend. Every
 * choice is credible, no choice hands out a moral score or a fate, and the
 * slower third way is honest about what it costs. Places, people, agencies and
 * anomalies are fictional; no tribe-specific sites, held material or real
 * individuals appear.
 */
export const MIDDLE_ENCOUNTERS: EncounterCard[] = [
  // MC-002 · Continuity / Reinvention · Kit's heritage-versus-reinvention arc
  {
    id: 'MC-002',
    kind: 'encounter',
    chapter: 2,
    place: 'A fictional harbor diner near Trinidad',
    title: 'The Shop That Would Not Franchise',
    scene: 'bay',
    body: [
      'The Lighthouse Counter has served the same marionberry pie since before the harbor got a stoplight. This morning the pie case is full of slices that will not cut: the knife goes through, and the slice closes up behind it like water. The regulars say this happens every time the place is about to change.',
      'A restaurant group has offered to buy the diner, keep all six jobs, and make it a little more like its four other locations. The owner is seventy-one and tired. The cook, who has worked the grill for nineteen years, says a rescue that keeps the jobs and loses the room is still a kind of closing. A regular in a fishing jacket says nobody asked the room.',
    ],
    leadLines: {
      kit: 'Kit looks at the pie case for a long time. “My grandma’s recipes changed every time she moved. They were still hers. I don’t know which side of that this is.”',
      mara: '“Ask who owns the recipe,” Mara says quietly. “Not legally. Who taught it to whom.”',
      juniper:
        'Juniper eats the uncuttable pie with a spoon, which seems to be allowed.',
      cedar:
        'Cedar knows the cook’s cousin. He also knows what a winter with no tourist traffic does to a counter.',
    },
    aloneLine:
      'Nobody here knows you, which makes you the only person in the room without a side.',
    choices: [
      {
        id: 'keep-menu',
        label:
          'Help the owner keep the original menu and find a way through the winter',
        cost: 'Shorter hours and a smaller staff; the diner stays itself and gets smaller',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'You dig through the harbor association’s old minutes and find the diner was saved once before, in 1983, by regulars prepaying for a winter of breakfasts. The owner laughs until she cries and writes up a punch card. The counter stays open four days a week. The cook stays; the dishwasher takes a job on the coast. The pie cuts cleanly for the first time all week.',
          effects: { goodwill: 1, flag: 'diner_kept_original' },
          leadLines: {
            kit: '“Smaller isn’t smaller if it’s still yours,” Kit says, then frowns. “Ask me again in February.”',
          },
        },
        failure: {
          text: 'The old minutes say the 1983 rescue happened, but nobody can find who organized it, and the owner is too proud to ask regulars to pay in advance. She cuts the hours anyway. The cook leaves for a job in Crescent City with a polite handshake and a bad feeling. The menu survives. The room is quieter.',
          effects: { nerve: -1, flag: 'diner_kept_smaller' },
        },
      },
      {
        id: 'take-buyout',
        label:
          'Help the staff negotiate the buyout so every job is kept in writing',
        cost: 'The diner becomes the fifth location; something the regulars love will change',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'You get the restaurant group to put all six jobs, the cook’s seniority and the booth by the window into the contract. They simplify the pie: no marionberries, a frozen crust, faster. The cook keeps his health insurance. An old regular stops coming, and the waitress mails him a slice once a month anyway.',
          effects: { goodwill: 1, flag: 'diner_jobs_kept' },
        },
        failure: {
          text: 'The group agrees to keep the jobs for a year, which is not the same as keeping them. The contract is signed before anyone notices the difference. The pie case goes dark for remodeling, and every uncuttable slice inside is found neatly sliced the next morning, as if the place had given up.',
          effects: { nerve: -1, flag: 'diner_jobs_temporary' },
        },
      },
      {
        id: 'co-op',
        label: 'Back the staff’s idea of buying the diner together as a co-op',
        cost: 'Slow, fragile, and if it fails the staff own the failure by name',
        success: {
          text: 'You help the cook and the two waitresses write a one-page plan on a placemat. It is not a business plan yet, just a list of who would do what and how much they could each put in. The owner keeps the placemat. It might work. If it does not, at least the people who tried will have their names on it.',
          effects: { goodwill: 1, flag: 'diner_coop_started' },
          leadLines: {
            mara: '“Good,” Mara says. “Owning your failures is underrated. So is owning your pie.”',
          },
        },
      },
    ],
    provenance:
      'Original fictional diner, staff, restaurant group and pie near Trinidad; a composite of small coastal diners, not a real business. The 1983 rescue is fictional.',
  },

  // MC-007 · Continuity / Reinvention · Mara's craft and mentorship
  {
    id: 'MC-007',
    kind: 'encounter',
    chapter: 2,
    place: 'A fictional underpass on the Hammond Trail',
    title: 'The Mural That Outlived Its Argument',
    scene: 'dunes',
    body: [
      'Under the trail bridge, a thirty-year-old mural of salmon and bicycles has faded to the colors of a wet newspaper. At low tide the fish in it are swimming upstream. At high tide they are swimming down. Nobody painted it that way.',
      'A young muralist has a grant and a plan to repaint the whole wall with the faces of people who live along the trail now. Half the neighbors love the old wall because it was there when their kids learned to ride. The other half resent it because nobody asked them in 1994. The original painter moved to Oregon and answers email once a season.',
    ],
    leadLines: {
      mara: 'Mara runs a thumb along a faded fin. “Cover-ups are their own craft. You can hide a line or you can carry it.”',
      kit: '“Thirty years is a good run for a wall,” Kit says. “Most of my work lasts a weekend.”',
      juniper:
        'Juniper says the salmon have been arguing about direction since they were painted.',
      cedar:
        'Cedar remembers riding under this bridge on training wheels. He also remembers the kid who was never in the picture.',
    },
    aloneLine:
      'You never rode a bike under this bridge, so you get to look at the wall as a wall.',
    choices: [
      {
        id: 'restore',
        label: 'Restore the old mural exactly as it was painted',
        cost: 'The muralist and the people who were never painted may walk away',
        check: { skill: 'lore', target: 7 },
        success: {
          text: 'You track down the original color notes in a library binder and match the salmon pinks by hand. The neighborhood relaxes; strangers stop to photograph their childhoods. The young muralist thanks you politely and takes her grant to a wall in Eureka. The fish settle on swimming upstream.',
          effects: { goodwill: 1, flag: 'mural_restored' },
        },
        failure: {
          text: 'The binder has the wrong year’s colors, and the restoration comes out bright and slightly strange, like a remembered photograph. Nobody is quite satisfied. The muralist leaves. The fish now swim in circles, which the neighbors have decided is a joke.',
          effects: { nerve: -1, flag: 'mural_restored_wrong' },
        },
      },
      {
        id: 'repaint',
        label:
          'Back the muralist’s plan to repaint it with the people living here now',
        cost: 'It divides the street, at least for a while',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The muralist holds a sketch night under the bridge, and forty people show up to argue over whose face goes where. Some of them leave angry. More of them come back the next week with photographs. The new wall is louder and less loved, for now, and the trail is talking to itself again.',
          effects: { goodwill: 1, flag: 'mural_repainted' },
        },
        failure: {
          text: 'The sketch night turns into a shouting match about property values. The muralist paints anyway, faster than planned, and the wall comes out handsome and somehow empty. A neighbor paints one old salmon back into the corner overnight. Nobody covers it up.',
          effects: { nerve: -1, flag: 'mural_repaint_divided' },
        },
      },
      {
        id: 'new-panel',
        label:
          'Propose a new panel beside the old one, painted by the muralist and taught by the original painter',
        cost: 'Slow to fund, and it depends on an email from Oregon that may never come',
        success: {
          text: 'You write to the original painter, and in a rare reply she offers to teach the young muralist her layering technique by video. The new panel will go up beside the old one, next spring if the money comes through. The old salmon and the new faces will share a wall. You will not be here to see whether they get along.',
          effects: { goodwill: 1, flag: 'mural_new_panel' },
          leadLines: {
            mara: '“Teaching someone to work next to your lines,” Mara says, “is the whole job, honestly.” She looks pleased in a way she will deny later.',
          },
        },
      },
    ],
    provenance:
      'Original fictional mural, underpass, muralist, neighbors and original painter on the Hammond Trail; no real public artwork, artist or grant is depicted.',
  },

  // MC-001 · Ecology / Engineering · both experts are right for different years
  {
    id: 'MC-001',
    kind: 'encounter',
    chapter: 3,
    place: 'A fictional county watershed hearing in an Old Town meeting hall',
    title: 'The Hearing Where Both Experts Were Right',
    scene: 'bay',
    body: [
      'The county is deciding what to do about a failing culvert on a creek that runs under a rural road. A fish biologist says the culvert blocks a spawning reach and must be replaced with an open bridge. A county engineer says the road is the only route out for forty households during fire season, and a bridge means closing it for a summer.',
      'Both of them have a single number on the whiteboard, and both numbers are correct. The biologist’s is for next year. The engineer’s is for the year after a fire. The clock over the door shows both years at once and will not pick.',
    ],
    leadLines: {
      cedar:
        'Cedar leans in. “I could put a cheap sensor on that culvert. Then at least we’d be arguing about the same water.”',
      juniper:
        'Juniper is not watching the experts. She is watching the window, where the creek would be if this were a creek.',
      kit: 'Kit whispers that the two experts are standing exactly the way rival jugglers do before a pass.',
      mara: 'Mara reads the engineer’s handout twice. “Forty households is forty households,” she says. “So is a creek.”',
    },
    aloneLine:
      'You have no vote here, which the clerk reminds you of twice. You do have a public comment card.',
    choices: [
      {
        id: 'biologist',
        label:
          'Speak for the biologist: replace the culvert with an open bridge now',
        cost: 'The rural road closes for a whole summer',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'You point out that the summer closure can avoid the worst fire months if construction starts in April. The board votes for the bridge. Next year, salmon reach water they have not seen in two decades. Forty households drive the long way around all summer and do not thank anyone for the salmon.',
          effects: { goodwill: 1, flag: 'hearing_bridge_built' },
          leadLines: {
            juniper:
              'Juniper says nothing at all for a full minute, which from her is a parade.',
            cedar:
              '“Put a sensor on the new bridge,” Cedar says. “Prove it worked. Then do it again somewhere.”',
          },
        },
        failure: {
          text: 'Your timing argument falls apart when the engineer shows the contractors are booked until July. The board approves the bridge anyway, and the closure lands in fire season. Nothing burns. Everyone remembers that it could have.',
          effects: { nerve: -1, flag: 'hearing_bridge_risky' },
        },
      },
      {
        id: 'engineer',
        label:
          'Speak for the engineer: repair the culvert and keep the road open',
        cost: 'The spawning reach stays blocked for another decade',
        check: { skill: 'lore', target: 7 },
        success: {
          text: 'You remind the board of the last fire, when this road was the only way out. The repair passes. The road holds. The spawning reach stays empty for another ten years, and the biologist shakes your hand like someone who has lost this argument before.',
          effects: { goodwill: 1, flag: 'hearing_road_kept' },
          leadLines: {
            juniper:
              'Juniper nods, slowly. “Okay,” she says, in a voice that means she will remember this.',
          },
        },
        failure: {
          text: 'You get the fire year wrong in front of people who were evacuated that year. The repair passes anyway, on the engineer’s numbers, not yours. A woman in the back row tells you, kindly, to check your dates before you invoke her worst week.',
          effects: { nerve: -1, flag: 'hearing_road_kept_badly' },
        },
      },
      {
        id: 'both',
        label:
          'Ask for an ugly compromise: a temporary fish passage now and a bridge after fire season',
        cost: 'Slower, more expensive, and neither side will thank you',
        success: {
          text: 'The board tables the vote and asks both experts for a phased plan. A temporary fish ladder goes in by fall; the bridge waits two years. The biologist calls it half a river. The engineer calls it half a road. They leave together, arguing, which may be the first useful thing that has happened in this room.',
          effects: { goodwill: 1, flag: 'hearing_phased_plan' },
          leadLines: {
            cedar:
              '“Half a river with a sensor on it,” Cedar says, “is a whole lot of data.”',
          },
        },
      },
    ],
    provenance:
      'Original fictional county hearing, creek, culvert, biologist and engineer in a fictional Old Town meeting hall. Culvert-versus-bridge fish passage is a real kind of local dilemma; no real project, agency decision or official is depicted.',
  },

  // MC-004 · Autonomy / Solidarity · a rule that excludes someone
  {
    id: 'MC-004',
    kind: 'encounter',
    chapter: 3,
    place: 'A fictional church-basement food share off F Street, Eureka',
    title: 'Mutual Aid Has a Waiting List',
    scene: 'plaza',
    body: [
      'The Thursday food share runs on one rule, written on the door in marker: EVERYONE EATS, EVERYONE SHIFTS. Twelve volunteers sort produce from the farms that did not sell out at market. Each of them is tired in a specific way. Somebody has been leaving a crate of apples on the steps every week, and nobody has ever seen who.',
      'A newcomer is at the door with an empty bag. She works nights and cannot do shifts. The coordinator says the rule exists because the last time it was waived, half the volunteers quit. The newcomer says she understands, and does not leave.',
    ],
    leadLines: {
      kit: 'Kit is already carrying a crate. “I didn’t sign up,” she says. “I just think crates should be carried.”',
      mara: 'Mara reads the rule on the door. “Every rule like that has a story behind it,” she says. “Ask the story first.”',
      juniper:
        'Juniper says the apples on the steps are from a tree that is not on any map. She says it fondly.',
      cedar:
        'Cedar knows the coordinator from high school, and knows exactly how many years she has been doing this unpaid.',
    },
    aloneLine: 'You are a stranger at a door that has a rule about strangers.',
    choices: [
      {
        id: 'waive',
        label:
          'Ask the coordinator to waive the shift rule for her, just this once',
        cost: 'Some volunteers will resent the exception',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'The coordinator lets her in. The newcomer fills her bag and thanks everyone by name. Two volunteers exchange a look that says the next exception will be harder, and one of them stays late to make a point. Goodwill rises in the room and so does a quiet ledger of who gave what.',
          effects: { goodwill: 1, flag: 'foodshare_rule_waived' },
        },
        failure: {
          text: 'The coordinator says no, gently, and you push too hard. A volunteer takes off his apron and leaves. The newcomer leaves too, apologizing for causing trouble, which is the worst part. The apples are still on the steps.',
          effects: { nerve: -1, flag: 'foodshare_rule_fight' },
        },
      },
      {
        id: 'enforce',
        label:
          'Back the rule: the food share only survives if the shifts get covered',
        cost: 'The newcomer leaves hurt',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'You help the coordinator explain why the rule exists: the volunteers who burned out, the week it almost closed. The newcomer listens and nods and leaves with nothing. The share survives the winter. You do not feel good about it, and that seems correct.',
          effects: { flag: 'foodshare_rule_held' },
        },
        failure: {
          text: 'You explain the rule badly, as if it were obvious. The newcomer leaves with her empty bag, and a volunteer tells you afterward that you made it sound like a punishment. It is not supposed to be one. The share survives anyway.',
          effects: { nerve: -1, flag: 'foodshare_rule_harsh' },
        },
      },
      {
        id: 'lighter-way',
        label:
          'Help design a lighter, honest way to contribute for people who work nights',
        cost: 'Takes the whole evening and sets a precedent someone will have to maintain',
        success: {
          text: 'You and the newcomer and the coordinator sit on the basement stairs and invent a night-shift job: picking up the unsold bread from the bakery at 5 a.m., on the newcomer’s way home. It is a real shift. It counts. The rule on the door gets one new line in smaller marker. In the morning the apple crate is there, plus a second one.',
          effects: { goodwill: 1, flag: 'foodshare_night_shift' },
          leadLines: {
            kit: '“That’s the trick,” Kit says. “Not no rule. A rule with more doors.”',
          },
        },
      },
    ],
    provenance:
      'Original fictional volunteer food share, coordinator, newcomer and apples in a fictional church basement near F Street; no real organization or person is depicted.',
  },

  // MC-003 · Agency / Fate · the forecast is evidence, not destiny
  {
    id: 'MC-003',
    kind: 'encounter',
    chapter: 4,
    place: 'A fictional ridge-top radio repeater shack near Kneeland',
    title: 'The Forecast That Asked to Be Wrong',
    scene: 'highway',
    body: [
      'A volunteer keeps an old radio repeater running on the ridge so the backroads have reception when the power goes out. Tonight, between the weather and the static, it is broadcasting a forecast from a Humboldt that has not happened yet: a slide closing the road below Kneeland on Saturday, with a school bus on the wrong side of it.',
      'The voice reading the forecast sounds tired, and it ends every bulletin the same way: “Somebody please make me wrong.” The volunteer has recorded it four times. She does not know whether to tell anyone, because the last time she shared one of these, people said she caused it.',
    ],
    leadLines: {
      cedar:
        'Cedar goes very still. “That’s my CB’s voice,” he says. “That’s the same guy. I never knew he said please.”',
      juniper:
        'Juniper puts her hand flat on the shack’s wall like she is checking it for a pulse. “The hill is listening too,” she says.',
      kit: '“Okay, so either it’s a prophecy or it’s a really specific warning,” Kit says. “Both of those mean move the bus.”',
      mara: 'Mara asks to hear the recording again, and writes down every word, exactly, in pencil.',
    },
    aloneLine:
      'You are the only person besides the volunteer who has heard it. That is either a responsibility or a coincidence.',
    choices: [
      {
        id: 'act-early',
        label: 'Act on the forecast quietly: get the bus rerouted for Saturday',
        cost: 'If nothing happens, you will look ridiculous, and if it is partly averted, nobody will know why',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'You find the school district’s backup route and convince the transportation office to run it Saturday for “road work.” On Saturday a small slide does close the road, a quarter mile short of the forecast. The bus is already on the other side. The voice on the repeater says only, “Thank you,” and then goes back to weather.',
          effects: {
            evidence: 'A forecast recording that came partly true',
            flag: 'forecast_acted_early',
          },
          leadLines: {
            cedar:
              'Cedar is quiet on the drive down. “Did we change it,” he finally asks, “or did we just hear it right?” Nobody can answer that, and he seems glad.',
          },
        },
        failure: {
          text: 'The transportation office laughs you off the phone. You and the volunteer drive down Saturday morning and stand at the bad curve with flashlights, waving the bus to wait. The slide comes. The bus waits. It was not a plan, but it worked, and both of you are shaking afterward.',
          effects: { nerve: -1, flag: 'forecast_flagged_bus' },
        },
      },
      {
        id: 'share-publicly',
        label:
          'Share the recording publicly and let the community decide what to do',
        cost: 'Coalition support grows, and so does the pressure on the volunteer',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'You post the recording on the community board with the volunteer’s permission and a clear note: this is evidence, not a prophecy. Neighbors organize a road watch. The slide comes; everyone is ready. The volunteer gets thanked and also gets three angry phone calls from people who think she made it happen. She keeps the repeater running.',
          effects: { goodwill: 1, flag: 'forecast_shared' },
        },
        failure: {
          text: 'The recording spreads without your note attached. By Friday it is a conspiracy, and people show up at the volunteer’s gate. The road watch happens anyway, organized by the same people who were angry. The slide is caught early. She is not sure she will keep the repeater.',
          effects: { nerve: -1, flag: 'forecast_backlash' },
        },
      },
      {
        id: 'let-it-be',
        label:
          'Respect the volunteer’s fear: do nothing loud, and stay to help after',
        cost: 'The forecast will probably come true',
        success: {
          text: 'You do not try to change Saturday. You help the volunteer write down what she knows, and you stay. The slide comes; the bus is stuck on the wrong side for six hours, cold and frightened and unhurt. You and the volunteer bring blankets and thermoses. Nobody is punished for not acting, and nobody pretends nothing happened.',
          effects: { goodwill: 1, flag: 'forecast_repair' },
        },
      },
    ],
    provenance:
      'Original fictional repeater, volunteer, forecast voice and slide near Kneeland. Backroads landslides and volunteer radio are real kinds of local context; no real road closure, school route or person is depicted.',
  },

  // MC-006 · Ecology / Engineering · timber and grower families, shared survey
  {
    id: 'MC-006',
    kind: 'encounter',
    chapter: 4,
    place: 'A fictional shared ridge parcel above Willow Creek',
    title: 'Old Growth, Old Grudge, New Lease',
    scene: 'grove',
    body: [
      'Two families share a ridge parcel: a timber family that has logged and replanted it for four generations, and a grower family that came in the seventies and stayed. They have argued about the fence line for fifty years. A drone survey paid for by the county shows exactly where a fire break would save both houses.',
      'It also shows everything else: the timber family’s unpermitted shed, the grower family’s old greenhouse foundations, and a lone cabin chimney in the middle of the fence line, ringed by flowers somebody still plants. The survey drone is still circling. Every pass it makes, the map shows the parcel a little further into a summer that has not come yet.',
    ],
    leadLines: {
      cedar:
        'Cedar laughs out loud. “This is my parents. This is every Thanksgiving. Except my parents worked it out, eventually, mostly by yelling and then cooking.”',
      juniper:
        'Juniper sits down between the two families’ trees as if waiting to be asked her opinion. Nobody asks. She seems fine with that.',
      kit: 'Kit wants to know who paid for the drone, which is somehow the question nobody else had asked.',
      mara: 'Mara looks at the flowers around the chimney on the map and asks, quietly, who has been planting them.',
    },
    aloneLine:
      'Neither family knows you, which is why both of them start explaining themselves to you at once.',
    choices: [
      {
        id: 'open-survey',
        label:
          'Open the survey to both families and the fire crew so the break gets built',
        cost: 'Both families lose some privacy, and the shed and the greenhouse become everyone’s business',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'You get both families to the same picnic table with the full map. There is shouting. Then the timber grandfather points at the chimney and says it was his uncle’s cabin, and the grower matriarch says she has been planting those flowers for thirty years without knowing whose it was. The fire break goes in by August.',
          effects: { goodwill: 1, flag: 'parcel_survey_open' },
          leadLines: {
            cedar:
              'Cedar drives home quiet. “I’m calling my folks,” he says. “No reason. They’re still married. I just want to hear them argue.”',
          },
        },
        failure: {
          text: 'The map comes out before either family is ready. The grower family’s son posts a photo of the shed. The timber family calls a lawyer. The fire crew builds the break anyway, on county authority, through the middle of an argument that will outlast the fire season.',
          effects: { nerve: -1, flag: 'parcel_survey_leaked' },
        },
      },
      {
        id: 'county-keeps',
        label:
          'Let the county keep the survey and build the break on its own authority',
        cost: 'Faster and private, and both families will trust the county less',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'You help the fire crew find a route that needs the least of the map. The break goes in within a month. Neither family sees what the drone saw. Both families say, separately, that the county did not ask them, and both are right.',
          effects: { flag: 'parcel_county_break' },
        },
        failure: {
          text: 'The county route clips the grower family’s old foundation, and the crew does not stop to ask why it is there. The break is built. A complaint is filed. The drone footage sits on a county server, seen by no one who has to live there.',
          effects: { nerve: -1, flag: 'parcel_county_complaint' },
        },
      },
      {
        id: 'co-own',
        label:
          'Propose the families co-own the survey data and decide on the break together',
        cost: 'Slow, and the break may not be built before the summer the drone keeps showing',
        success: {
          text: 'You draft a one-paragraph agreement: both families hold the data, neither can sell it, and the fire crew gets the map when both sign. It takes three weeks and two dinners. The timber grandmother and the grower matriarch sign on the same afternoon, separately, and both refuse to say so. The drone lands.',
          effects: { goodwill: 1, flag: 'parcel_co_owned' },
          leadLines: {
            cedar:
              '“That’s the only version my parents would recognize,” Cedar says. “Slow, stubborn, and fair. They’d hate how long it took. They’d sign it.”',
          },
        },
      },
    ],
    provenance:
      'Original fictional families, parcel, drone survey, shed, greenhouse and cabin chimney above Willow Creek. Timber and grower histories in the region are real context; no real family, property or survey is depicted. Cedar’s parents are not these families and remain together.',
  },

  // MC-005 · Autonomy / Solidarity · consent and care at a festival
  {
    id: 'MC-005',
    kind: 'encounter',
    chapter: 5,
    place: 'A fictional summer music night at an Eel River campground',
    title: 'The Quiet Person at the Festival Gate',
    scene: 'grove',
    body: [
      'At the edge of a riverside music night, an adult is sitting alone on a log by the gate, hood up, watching the lanterns. Every few minutes someone kind comes over to ask if they are okay. The person says yes each time, politely, a little more tired each time.',
      'Around the log the lanterns have started burning a shade dimmer whenever somebody asks. The gate volunteer cannot tell whether the person wants to be left alone or is too worn out to say otherwise. Neither can you, yet.',
    ],
    leadLines: {
      juniper:
        'Juniper sits down on the far end of the log without saying anything. That seems to be the right amount of company.',
      kit: '“I’ve been that person,” Kit says. “After a show. You just need the noise to be somewhere else for a while.”',
      mara: 'Mara watches for a long moment. “People check on you so they feel better,” she says. “Ask what helps them feel better.”',
      cedar:
        'Cedar has a thermos of tea in the truck and a policy of offering it once.',
    },
    aloneLine:
      'You know what it is like to be a stranger at an event. You do not know if that is what this is.',
    choices: [
      {
        id: 'ask-once',
        label:
          'Ask once, plainly, what would help, and accept whatever the answer is',
        cost: 'If they say they are fine, you have to actually leave',
        check: { skill: 'psyche', target: 7 },
        success: {
          text: 'You crouch at a respectful distance and ask whether they want company, quiet, or someone to keep the well-meaning people away. “The last one,” they say, and almost laugh. You stand near the gate and redirect the next three helpers. Later they nod to you on their way out, the kind of thanks that earns trust.',
          effects: { goodwill: 1, flag: 'festival_asked_once' },
        },
        failure: {
          text: 'You ask, but your question comes out like another check-in. They say they are fine, and you cannot tell whether they mean it. You leave, as promised. Their hood stays up. You will never know whether that was the right call, which is sometimes how it goes.',
          effects: { flag: 'festival_asked_unclear' },
        },
      },
      {
        id: 'stay-close',
        label: 'Stay nearby and keep checking, in case they are not okay',
        cost: 'Care that ignores their answer can become an intrusion',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'You stay close but quiet, and when they finally stand up, wobbly with exhaustion, you are there to walk them to the first-aid tent. It turns out they had not eaten since morning. They thank you, a little embarrassed. It worked this time. It was still a gamble with someone else’s evening.',
          effects: { goodwill: 1, flag: 'festival_stayed_helped' },
        },
        failure: {
          text: 'You keep hovering. They get up and leave early, and their friends, who were coming back with food, find an empty log. The lanterns along the path dim and stay dim. The evening is worse for it, and you were trying to make it better.',
          effects: { nerve: -1, flag: 'festival_hovered' },
        },
      },
      {
        id: 'check-later',
        label: 'Leave them be, and come back once later without pressure',
        cost: 'No guarantee you will get a real answer, or any answer',
        success: {
          text: 'You come back an hour later with nothing but a nod. This time they move over on the log. You sit. After a while they tell you their dog died on Tuesday and they did not want to cancel on their friends. You say that sounds hard. That is the whole conversation. The lanterns burn steadily for the rest of the night.',
          effects: { goodwill: 1, flag: 'festival_checked_later' },
        },
      },
    ],
    provenance:
      'Original fictional music night, campground, gate volunteer and festivalgoer on the Eel River; no one is shown using any substance, and the person’s reasons are their own.',
  },

  // MC-008 · Ecology / Engineering · hazard, habitat and swimming hole
  {
    id: 'MC-008',
    kind: 'encounter',
    chapter: 5,
    place: 'A fictional small dam on an Eel River tributary',
    title: 'A Dam Nobody Wanted to Name',
    scene: 'rivermouth',
    body: [
      'The dam was built by a sawmill in 1931 and abandoned in 1958. It is cracked, it blocks a fish run, and below it is the best swimming hole in the county. Every summer, families spread towels on the same warm rocks. Every winter, a state engineer writes the same letter calling it a hazard.',
      'Nobody ever named the dam. Now the state wants a decision before the next rainy season, and the families, the fishing club and the engineer have all come to the rocks on the same afternoon. When the creek is quiet you can hear the dam humming, a little off-key, like someone who knows the song is ending.',
    ],
    leadLines: {
      juniper:
        'Juniper wades into the swimming hole up to her knees and stands there listening to the hum. “It’s old,” she says. “Old things deserve to be asked.”',
      cedar:
        'Cedar learned to swim here. He also knows a cracked dam is a bad bet in a big storm.',
      kit: 'Kit is teaching two kids to skip stones while the adults argue, which is a kind of argument too.',
      mara: 'Mara has a client whose father helped build this dam’s last repair, and she is not sure he would want it saved.',
    },
    aloneLine:
      'Nobody here asks who you are. They are too busy asking what this place is.',
    choices: [
      {
        id: 'remove',
        label: 'Back full removal: open the river and let the fish return',
        cost: 'The swimming hole is gone for a generation',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'You find the 1958 abandonment records and show the families that the swimming hole was dug by the mill crew, not made by the river. They decide to dig a new one downstream after the removal. Fish return within three seasons. The new hole is shallower and the kids call it the Bathtub. It is not the same.',
          effects: { goodwill: 1, flag: 'dam_removed' },
          leadLines: {
            juniper:
              'Juniper watches the first winter flow go through the gap. She does not say anything. She does not need to.',
          },
        },
        failure: {
          text: 'You argue for removal without understanding what the families lose. The state removes the dam anyway, on schedule. The fish come back. The families do not, and the fishing club and the swimming families stop speaking to each other for a decade.',
          effects: { nerve: -1, flag: 'dam_removed_bitter' },
        },
      },
      {
        id: 'repair',
        label:
          'Back a repair: keep the dam safe and the swimming hole where it is',
        cost: 'The fish run stays blocked',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'You help the families find a structural engineer who agrees to inspect the dam for free. The repair is approved. The swimming hole survives, safe and beloved, and every summer the towels go back on the warm rocks. The fishing club writes a letter every winter now instead of the state.',
          effects: { goodwill: 1, flag: 'dam_repaired' },
        },
        failure: {
          text: 'The free inspection finds a deeper crack than anyone wanted. The repair costs triple, and the families raise it anyway, bake sale by bake sale. It takes two years. For two summers the swimming hole is fenced off, waiting.',
          effects: { nerve: -1, flag: 'dam_repair_delayed' },
        },
      },
      {
        id: 'partial-breach',
        label: 'Propose a partial breach with a public goodbye on the rocks',
        cost: 'Costs time and a summer of argument, and nobody gets everything',
        success: {
          text: 'You suggest notching the dam so fish can pass and the pool keeps half its depth, and holding a last swim on the day the notch is cut. The engineer says it is unusual and probably sound. Two hundred people come to the goodbye swim. They name the dam that afternoon, finally, after the mill cook who used to bring the crew pie. The humming stops when the notch opens.',
          effects: { goodwill: 1, flag: 'dam_partial_breach' },
          leadLines: {
            juniper:
              '“That’s how you let something go,” Juniper says, dripping on the warm rocks. “You give it a name first.”',
          },
        },
      },
    ],
    provenance:
      'Original fictional dam, sawmill, swimming hole, families, fishing club and state engineer on a fictional Eel River tributary. Small-dam removal is a real kind of regional dilemma; no real dam, agency decision or person is depicted.',
  },
]
