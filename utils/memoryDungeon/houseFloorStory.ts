import type { HouseProgress } from './house'

export interface HouseFloorBeat {
  /** A narrative movement, not a public level count. */
  title: string
  text: string
  cost: string
}

type HouseStoryState = Pick<HouseProgress, 'decisions' | 'visited'>
type SceneChoices = Readonly<Record<string, string>>

/**
 * House chapters carry the story from borrowed identity, through
 * disputed testimony, to the cost of judgment. These are live callbacks to
 * decisions already saved by the two maps, not extra one-time rewards or
 * mutable story flags. Shortcuts must not pretend the player met witnesses
 * they bypassed.
 */
export function houseFloorBeat(
  roomId: string | undefined,
  house: HouseStoryState | null | undefined,
  briar: SceneChoices,
): HouseFloorBeat | null {
  if (!house) return null

  if (roomId === 'HD-01') {
    if (briar['6,4'] === 'read')
      return {
        title: 'The Letter That Arrived Open',
        text: 'Pip has already warned the residents about the Brass Knight’s destruction order. Behind the porch door, the House is moving its witnesses to safer rooms instead of preparing a polite reception. You enter as the person who broke a seal to give them time.',
        cost: 'The warning bought safety, but the Knight’s apology never arrived intact.',
      }
    if (briar['6,4'] === 'carry')
      return {
        title: 'The Apology at the Threshold',
        text: 'Pip trusts you with the sealed apology, and the House accepts the envelope before it accepts your name. Somewhere inside, a door closes gently around the people who have not heard the Knight’s other order.',
        cost: 'You preserved the courier’s promise, but the residents still lack the warning.',
      }
    if (briar['5,4'] === 'truth')
      return {
        title: 'A Knight Without a Crossing',
        text: 'You challenged the Brass Knight’s account of the bridge before coming here. The porch chairs scrape backward as though the House has been waiting for somebody to question an oath rather than repeat it.',
        cost: 'The false oath is exposed, but no apology or protection came with you.',
      }
    if (briar['5,4'] === 'errand')
      return {
        title: 'An Errand for a Closed Door',
        text: 'The Brass Knight sent you with an apology that he could not bring himself. The House knows his handwriting. It also remembers who was left on the wrong side of the crossing when he made his promise.',
        cost: 'Carrying the message earns a hearing, not forgiveness.',
      }
    return {
      title: 'A Guest, Not an Owner',
      text: 'The porch has set a chair for the life you remember and another for the life Morrow left you. Neither chair is a throne. The House will ask what you have done with other people’s memories before it considers returning your own.',
      cost: 'Entering earns questions, not a claim to anyone else’s past.',
    }
  }

  if (roomId === 'HD-03') {
    if (house.decisions['HD-03'] === 'route')
      return {
        title: 'Three Roads, No Owners',
        text: "The boot-rack yields three routes: a mill path, a ford and a track that ends at a locked nursery. Oren sketches them without writing the walkers' names. The Index offers a tidy list of suspects, but the mud only proves where somebody traveled, never why.",
        cost: 'You gained a useful route and refused an accusation, but the travelers still have no voice in the record.',
      }
    if (house.decisions['HD-03'] === 'ask')
      return {
        title: 'The Boots Who Were Allowed to Leave',
        text: "A left boot remembers carrying a frightened cook to the river. Its partner remembers coming back alone. Pip listens until the pair agree that leaving was the cook's decision, not evidence of kidnapping. The Index closes its prewritten missing-person form.",
        cost: 'The absent cook keeps their agency, but the route they used remains uncharted for anyone who needs it next.',
      }
    return {
      title: 'Mud Is Not a Confession',
      text: 'Three pairs of boots sit beside three incompatible police reports. The Brass Knight calls every muddy heel a trespass; Oren asks why the servants were never given a map. You may trace the roads or hear the boots describe the people who wore them.',
      cost: 'Without a choice, the House can still mistake a journey for a crime and a silence for consent.',
    }
  }

  if (roomId === 'HD-04') {
    if (house.decisions['HD-04'] === 'share')
      return {
        title: 'A Loaf Divided Without a Ledger',
        text: 'The clockwork cook cuts the loaf into pieces small enough for the guest no one invited to dinner. Pip carries the extra plate upstairs, and the little machine gives you a lantern for acknowledging the shortage. The Index cannot decide whom to invoice.',
        cost: 'The missing guest can eat and you earned light, but no permanent record explains why their place was empty.',
      }
    if (house.decisions['HD-04'] === 'record')
      return {
        title: 'The Place Setting with a Name',
        text: 'You write down the name on the empty plate instead of pretending the meal served everybody. Vesper folds the page so the guest can decide who sees it. The cook counts the uneaten bread twice, ashamed that a correct inventory is not the same as supper.',
        cost: 'You preserved evidence of exclusion, but the hungry guest still needs food and the pantry keeps its lantern.',
      }
    return {
      title: 'Dinner for All but One',
      text: 'A clockwork cook serves a feast to an empty chair and a crust to the person waiting outside. Pip wants to divide the bread. Vesper wants the missing guest named before the House calls the evening generous. Neither answer can replace the other.',
      cost: 'The pantry offers either immediate relief or an accountable record; refusing both leaves the old arrangement intact.',
    }
  }

  if (roomId === 'HD-08') {
    if (
      house.decisions['HD-08'] === 'harm' &&
      house.decisions['HD-04'] === 'record' &&
      house.decisions['HD-05'] === 'test'
    )
      return {
        title: 'An Apology with Receipts',
        text: 'The harmed witness reads your pantry record beside the receipt for the wolf latch. The Brass Knight cannot call the hunger an accident or the locked gate a precaution. He asks what repair would look like; Vesper insists the people excluded must answer first.',
        cost: 'The evidence forces accountability, but the hungry guest still needs supper and the wolf patrol remains outside.',
      }
    if (
      house.decisions['HD-08'] === 'harm' &&
      house.decisions['HD-04'] === 'share'
    )
      return {
        title: 'Bread Before Forgiveness',
        text: 'You place the divided loaf beside the three apologies. The harmed witness eats before reading a single word, then points out that the House still has not named who ordered the empty chair. Pip refuses to turn your generous meal into a pardon.',
        cost: 'Immediate care helped someone today, but the written account still lets those responsible avoid a reckoning.',
      }
    if (house.decisions['HD-08'] === 'harm')
      return {
        title: 'The Apology Measured by Repair',
        text: 'You arrange the apologies by what changed for the people harmed, not by how elegant the Knight sounded. The staircase opens to a draft from above. Vesper asks for a name and a remedy, but your evidence is not yet enough to provide both.',
        cost: 'You established a standard for accountability without proving the missing guest was fed or the patrol protected.',
      }
    if (
      house.decisions['HD-08'] === 'listen' &&
      house.decisions['HD-03'] === 'ask'
    )
      return {
        title: 'The Witness Who Refused an Apology',
        text: 'The cook whose boots you heard at the rack is invited to decide the order. They decline every apology and ask instead for a road out that does not require permission. Oren listens, measures the doorway and begins planning without demanding forgiveness.',
        cost: 'The witness keeps the right to refuse, but hearing their story did not reveal a safe route for their departure.',
      }
    if (house.decisions['HD-08'] === 'listen')
      return {
        title: 'A Staircase That Accepts No',
        text: 'You offer the apologies to the person harmed, who pushes them back and asks why the Knight gets to choose the moment of reconciliation. The stairs open anyway. Pip carries the unanswered letters upstairs without marking them accepted.',
        cost: 'You respected refusal, but the House must still repair the harm rather than treating silence as closure.',
      }
    return {
      title: 'Three Apologies, One Missing Voice',
      text: "The Knight wrote the first apology, the Index edited the second and the third has a blank space where the harmed person might speak. The stairs will open when you choose whether repair or the witness's own judgment matters most.",
      cost: 'Until you act, polished language conceals the unanswered question of what the House actually owes.',
    }
  }

  if (roomId === 'HD-06') {
    if (house.decisions['HD-06'] === 'stock')
      return {
        title: 'Water for the Next Stranger',
        text: 'Oren counts the casks you filled, then removes your name from the inventory. A frightened housekeeper can take water without first owing you a story. Pip asks whether the same courtesy will extend to the witnesses upstairs.',
        cost: 'You spent supplies on people you may never meet; the route itself remains poorly marked.',
      }
    if (house.decisions['HD-06'] === 'route')
      return {
        title: 'A Shortcut Known by Heart',
        text: 'Oren has taught you the return path by its creaking boards and the smell of soap. Scylla can repeat every turn, but the servants carrying heavy buckets have no map. You have learned an escape without making it common knowledge.',
        cost: 'Your party can retreat quickly; the next frightened resident must still ask permission.',
      }
    return {
      title: 'The Inventory of Those Left Behind',
      text: 'Oren has drawn two columns: people who can find the porch and people who have never been shown the way. The House calls the second column guests. He refuses to put a number beside their names until you decide what help you can actually give.',
      cost: 'An untested exit is a promise on paper, not a safe route for the people inside.',
    }
  }

  if (roomId === 'HD-10') {
    if (house.decisions['HD-10'] === 'manifest')
      return {
        title: 'The Shortcut in Scylla’s Hand',
        text: 'Scylla spreads her manifest across the trunks and finds a service stair the House omitted from its public map. Oren confirms the measurements. Char asks who will carry the stranded maid’s parcels while the party takes the quicker way, and Scylla leaves a space for that answer.',
        cost: 'The shortcut saves your party time, but bypassing the servants may leave their testimony unheard.',
      }
    if (house.decisions['HD-10'] === 'improvise')
      return {
        title: 'Two Plans and One Stranded Maid',
        text: 'Char slips through the narrow doorway while Scylla keeps the food and medicines moving. They return together with the maid and her parcels, disagreeing over whose plan succeeded. Oren quietly records both names as responsible for the rescue.',
        cost: 'You helped someone the manifest overlooked, but surrendered the private shortcut Scylla had found.',
      }
    return {
      title: 'The Princesses Disagree in Ink',
      text: 'Scylla has numbered every trunk and every person. Char notices a maid standing outside the inventory with an armful of parcels. Oren refuses to call either sister wrong before the maid is heard. Both plans can work, but they protect different people first.',
      cost: 'Choosing efficiency may miss a person; choosing improvisation may cost the party a safer route.',
    }
  }

  if (roomId === 'HD-11') {
    if (house.decisions['HD-11'] === 'respect')
      return {
        title: 'The Stitch That Was Not Decoration',
        text: 'Char turns the silver cord over and shows you the knots she tied during nights Scylla was busy negotiating for both of them. The charm was made to protect a choice, not to prove Char was brave. She lets you copy the pattern without claiming the story as yours.',
        cost: 'You learned what Char prepared in secret, but left the practical repair of her worn boot for later.',
      }
    if (house.decisions['HD-11'] === 'help')
      return {
        title: 'A Boot Repaired Without a Speech',
        text: 'You hold the heel while Char stitches a buckle back into place with her enormous needle. She laughs when the thread catches your sleeve and thanks you without making it a ceremony. Scylla sees the work but still does not know what Char stitched into her ward.',
        cost: 'The repair makes the next journey easier, but the sisters’ unspoken preparations remain private.',
      }
    return {
      title: 'A Wardrobe That Belongs to Char',
      text: 'Char closes the wardrobe on a row of court-approved dresses and opens the drawer of things she made herself. Scylla recognizes the stitches but not their meaning. You can ask Char about the charm or offer to mend what the road has worn through.',
      cost: 'Admiring the clothes alone does not grant their owner a hearing or help with the journey ahead.',
    }
  }

  if (roomId === 'HD-12') {
    if (house.decisions['HD-12'] === 'open')
      return {
        title: 'A Door Without a Rank',
        text: 'The kitchen workers pass through the service corridor without asking the Index for a badge. Vesper watches one elderly cook take the long way around a frightened guard rather than make a spectacle of him. The door is open; trust will take longer.',
        cost: 'Access is shared, but the officers now know which workers have been using the passage.',
      }
    if (house.decisions['HD-12'] === 'map')
      return {
        title: 'The Route in Pencil',
        text: 'Oren draws every bend of the servants’ passage, including the turn where a stretcher can fit. Pip wants copies for the kitchens; the Index offers to file the only original. You keep the map portable until the people who need it can decide.',
        cost: 'A useful map exists, but a closed passage still cannot be crossed by everyone.',
      }
    return {
      title: 'The Hallway with Two Histories',
      text: 'The servants built this corridor to move hot meals before the House called it a security risk. Char finds the old soot marks under the new warning signs. Nobody has asked the workers whether the passage should belong to them again.',
      cost: 'Leaving the old restriction untouched protects the quiet of those already in charge.',
    }
  }

  if (roomId === 'HD-13') {
    if (house.decisions['HD-05'] === 'open')
      return {
        title: 'The Witnesses Find a Road',
        text: 'The Wolf-Mother’s patrol can reach the service hall through the latch you opened. Their boots leave honest mud across a floor the elders kept spotless. The House must hear them now, whether the village approves or not.',
        cost: 'Opening the route protects testimony but exposes the patrol to public scrutiny.',
      }
    if (house.decisions['HD-05'] === 'test')
      return {
        title: 'A Receipt Where a Door Should Be',
        text: 'You found who paid to bar the wolves, and the second floor has a place for that receipt. The Wolf-Mother is still outside the latch. The Index can inspect your evidence while the people it concerns wait in the rain.',
        cost: 'The payment is documented, but the safe passage remains closed.',
      }
    if (house.decisions['HD-06'] === 'stock')
      return {
        title: 'Oren’s Spare Water',
        text: 'Oren has counted the casks you restocked. A frightened housekeeper can retreat down the stairs with drinking water instead of a ceremonial apology. The second floor is less thirsty, though its records remain contested.',
        cost: 'Supplies buy time; they do not name the person who locked the witnesses out.',
      }
    return {
      title: 'The Floor of Other People’s Stories',
      text: 'The staircase divides into testimony, rumor and the records that somebody paid to keep. Pip wants the witnesses named; Vesper asks who would be endangered by that list. Neither will let you call the choice neutral.',
      cost: 'Listening to one account may leave another person waiting without protection.',
    }
  }

  if (roomId === 'HD-24') {
    if (house.decisions['HD-24'] === 'mark')
      return {
        title: 'An Exit That Can Be Found',
        text: 'Your painted arrows give the cellar a route anyone can follow. Oren tests them from the far end while Vesper asks who else might read the marks. The first person to use them is a cook carrying someone else’s medicine, not a hero.',
        cost: 'Visible directions help the vulnerable escape and may also guide the people hunting them.',
      }
    if (house.decisions['HD-24'] === 'retreat')
      return {
        title: 'The Return You Practiced',
        text: 'You and Char walk the cellar loop without losing your bearings. Oren times the journey and nods once. The test proves your party can get back to the central hall; it does not make the route legible to the frightened stranger behind you.',
        cost: 'Your retreat is reliable, but nobody else has been given its instructions.',
      }
    if (
      house.decisions['HD-12'] === 'open' &&
      house.decisions['HD-06'] === 'stock'
    )
      return {
        title: 'The Quiet Evacuation',
        text: 'The open servants’ passage meets the stocked cellar route. Oren can now guide a cook, a witness and a limping guard out together without demanding their names. Pip notices that the House has become safer through ordinary work, not a verdict.',
        cost: 'A shared escape is possible, but the water and safe passage still need people to maintain them.',
      }
    if (house.decisions['HD-12'] === 'open')
      return {
        title: 'A Passage Without Provisions',
        text: 'The workers can reach the cellar without a badge. Oren checks the empty emergency shelf and quietly shortens his evacuation estimate. Vesper refuses to call the passage a rescue plan while anyone who needs water must turn back.',
        cost: 'You opened the route to everyone, but did not equip it for the people least able to hurry.',
      }
    if (house.decisions['HD-06'] === 'stock')
      return {
        title: 'Water Behind a Locked Door',
        text: 'The emergency casks are ready, but the service passage is still controlled by the Index. Scylla asks who is allowed to reach the supplies. Oren crosses out the phrase “for everyone” on his manifest until the door can actually be used.',
        cost: 'You prepared relief, but the old permissions still decide who receives it.',
      }
    return {
      title: 'The Unmarked Way Back',
      text: 'A white arrow promises an exit, yet nobody can say who last tested it. Pip remembers a servant who found the cellar in the dark; the Index remembers only a closed door. You can still choose to make the route useful rather than merely reassuring.',
      cost: 'Without supplies, shared access or a tested route, the sign offers hope without proof.',
    }
  }

  if (roomId === 'HD-14') {
    if (house.decisions['HD-14'] === 'witness')
      return {
        title: 'The Festival With Its Owners Still Alive',
        text: 'You listen to the festival through the glass without taking the jar. Pip recognizes a familiar song, then stops before naming the singer for the Index. The villagers can now contest the House’s account of that night, if they choose to speak.',
        cost: 'Listening creates testimony, but it also creates a record that someone powerful may demand to see.',
      }
    if (house.decisions['HD-14'] === 'seal')
      return {
        title: 'A Seal for the People in the Jar',
        text: 'You place a new seal beside the old one, naming no owner except the people whose voices fill the glass. Vesper asks the House to find them before any council hears the festival. For now, even your companions must wait outside the story.',
        cost: 'Their privacy survives, but the village cannot yet use the memory to challenge its official history.',
      }
    return {
      title: 'Laughter Under Glass',
      text: 'The jar glows with a festival the village no longer discusses. Pip remembers the tune; Vesper remembers who stopped singing. The Index has already prepared a blank receipt for whoever removes the jar, as though possession were permission.',
      cost: 'Taking the memory would be easy; finding out who wants it remembered takes longer.',
    }
  }

  if (roomId === 'HD-15') {
    if (
      house.decisions['HD-15'] === 'question' &&
      house.decisions['HD-14'] === 'seal'
    )
      return {
        title: 'A Contract Waiting for Its Signers',
        text: 'You bring the sealed festival jar to the guest’s table, not as evidence to seize but as a reminder that the absent speakers have not agreed. When you ask about withdrawing consent, the host must leave a space for their answers. The guest sets down the pen.',
        cost: 'You have prevented a hurried signature, but the guest’s relief and the villagers’ testimony must wait for a fair hearing.',
      }
    if (house.decisions['HD-15'] === 'question')
      return {
        title: 'The Clause That Was Never Written',
        text: 'The guest asks whether a bargain can end. The host produces three pages of hospitality rules and not one line about leaving. Mosswick starts drafting a withdrawal clause while Pip asks who will enforce it after the candles burn down.',
        cost: 'A right to leave is now on the table, but writing it is not the same as making departure safe.',
      }
    if (house.decisions['HD-15'] === 'decline')
      return {
        title: 'Nobody Else Can Sign This Grief',
        text: 'You refuse the quill when the host offers it to you. The guest smiles for the first time without being prompted, then admits they are afraid of remembering alone. Oren offers to escort them home without asking what happened at dinner.',
        cost: 'You kept another person’s grief out of your hands, but their fear still needs companionship.',
      }
    return {
      title: 'The Empty Signature Line',
      text: 'A quill hovers over the guest’s plate. The host calls forgetting a courtesy and the guest calls it exhaustion. Pip wants to know who will answer when the guest wakes tomorrow and asks for the memory back.',
      cost: 'Witnessing a bargain is not the same as proving that its signer can refuse it.',
    }
  }

  if (roomId === 'HD-20') {
    if (house.decisions['HD-20'] === 'protect')
      return {
        title: 'The Address That Is Not a Reward',
        text: 'You return the letters without the daughter’s address. Her family hears that she is alive, but cannot turn your kindness into a map to her door. Vesper promises to carry any reply only if the daughter asks for one.',
        cost: 'You protected her location, but the family must endure uncertainty without the comfort of a reunion.',
      }
    if (house.decisions['HD-20'] === 'testify')
      return {
        title: 'Not Missing, But Gone',
        text: 'You tell the family that their daughter chose to leave. Her father sits down as though the floor has moved; her mother asks whether the choice can be undone. Pip answers that a truthful account is not an invitation to follow her.',
        cost: 'The family receives an answer, but the daughter may now face pressure to justify a departure she already made.',
      }
    return {
      title: 'A Room Kept Ready for Someone Else',
      text: 'The bed is made and the window is open. A family has called this daughter missing for years, though her letters describe the life she built after leaving. Vesper asks whether finding someone means giving other people a claim over them.',
      cost: 'Either truth or privacy can be mishandled when the person concerned is absent.',
    }
  }

  if (roomId === 'HD-21') {
    if (
      house.decisions['HD-21'] === 'archive' &&
      house.decisions['HD-20'] === 'protect'
    )
      return {
        title: 'Evidence Without an Address',
        text: 'You keep the image of Morrow’s humiliation as evidence while refusing to turn the missing daughter’s letters into directions. Pip records what happened in the office, then closes the ledger before anyone can add the names of people who did not consent to be found.',
        cost: 'The harm remains documented, but the record cannot satisfy every demand for someone to blame or locate.',
      }
    if (house.decisions['HD-21'] === 'archive')
      return {
        title: 'The Laughter Kept on Record',
        text: 'You preserve the mirror’s account of Morrow struggling at the research office. The Index offers to file the laughter as proof of a failed life. You insist the record describe an incident, not the sum of a person who may yet change.',
        cost: 'The evidence survives, but every copy risks making an old humiliation into a permanent verdict.',
      }
    if (
      house.decisions['HD-21'] === 'turn' &&
      house.decisions['HD-20'] === 'testify'
    )
      return {
        title: 'Two Truths That Cannot Be Owned',
        text: 'You turn the mirror away after telling the missing daughter’s family she chose to leave. Vesper notices the difference: you offered an answer where one was owed, but refused to make Morrow’s worst office moment a performance for the House.',
        cost: 'You ended the spectacle, but the daughter may still need protection from people who dislike her answer.',
      }
    if (house.decisions['HD-21'] === 'turn')
      return {
        title: 'The Room After the Audience Leaves',
        text: 'You turn the mirror toward the empty chairs. The laughter stops. The memory of losing your work remains painful, but Char asks whether you want to carry the image as proof or let the people involved tell their own accounts later.',
        cost: 'You refused the spectacle, but without a record the office harm may be harder to challenge.',
      }
    return {
      title: 'A Laugh Too Convenient',
      text: 'The mirror shows Morrow fumbling with a machine while other people laugh. It is a true and ugly moment, but the Index has already written “whole life” on the folder. Pip asks who benefits when one photograph becomes a sentence.',
      cost: 'Neither destroying the evidence nor displaying it forever can explain everything that happened.',
    }
  }

  if (roomId === 'HD-25') {
    if (house.decisions['HD-17'] === 'read')
      return {
        title: 'A Name Returned to Its Witness',
        text: 'You carry the testimony you read in the Witness Archive into the Bargain Ledger. The Index must now account for a person, not an empty line. Mosswick offers to keep the copy safe, but asks who authorized him to hold it.',
        cost: 'The evidence can challenge the bargain; publishing it may expose its witness.',
      }
    if (house.decisions['HD-21'] === 'archive')
      return {
        title: 'The Record That Outlived Its Keeper',
        text: 'You preserved the disputed account before entering the Bargain Ledger. Pip recognizes the date; Vesper recognizes the omission. The third floor can no longer pretend the record was lost by accident.',
        cost: 'A durable record gives the claim weight, but does not grant consent to reveal it.',
      }
    if (
      house.decisions['HD-10'] === 'manifest' &&
      !house.visited.includes('HD-13')
    )
      return {
        title: 'The Princess’s Shortcut',
        text: 'Scylla’s manifest led you directly to the Bargain Ledger. Char admires the efficiency and asks which witnesses you walked past to get here. Oren marks the unvisited halls in pencil rather than claiming they were cleared.',
        cost: 'You saved time, but the missing testimony cannot be invented at the verdict.',
      }
    return {
      title: 'The Price of Being Believed',
      text: 'The Bargain Ledger opens to a page with room for a name, a signature and the person who will bear the consequence. The Brass Knight would call that an oath. Pip calls it evidence. Vesper asks whether the signer had a choice.',
      cost: 'A verdict without witnesses may be swift, but it will not settle their claims.',
    }
  }

  if (roomId === 'HD-30') {
    if (
      house.decisions['HD-30'] === 'talk' &&
      house.decisions['HD-10'] === 'improvise' &&
      house.decisions['HD-11'] === 'respect' &&
      (briar['4,4'] === 'escort' || briar['4,4'] === 'question')
    )
      return {
        title: 'The Sisters Choose the Next Road',
        text: 'You met the sisters on the Briar road, gave Char room to rescue the maid, and listened to the reason she made her ward. At the landing, Scylla asks Char before adding her plan to the manifest. Char says yes to the shared route and no to having her reasons entered in the Index.',
        cost: 'They can plan together without surrendering their private history; the court bargain that brought them here is still unresolved.',
      }
    if (
      house.decisions['HD-30'] === 'talk' &&
      house.decisions['HD-10'] === 'manifest' &&
      house.decisions['HD-11'] === 'respect'
    )
      return {
        title: 'The Route That Left Char Behind',
        text: 'Char explains the ward she made while Scylla was busy preparing the route. Scylla listens, then notices that the manifest never included Char’s own decision to stay with the stranded maid. She adds a blank line rather than signing on her sister’s behalf.',
        cost: 'You heard Char’s reasons, but the earlier shortcut still passed by someone she wanted to help.',
      }
    if (
      house.decisions['HD-30'] === 'talk' &&
      house.decisions['HD-10'] === 'improvise' &&
      house.decisions['HD-11'] === 'help'
    )
      return {
        title: 'A Rescue and an Unasked Question',
        text: 'The sisters remember the maid they brought out together and the boot you helped Char repair. Scylla offers to carry the next load. Char accepts, but turns her ward over before anyone can ask why she made it. Oren pours more tea and leaves the silence intact.',
        cost: 'Practical trust has grown, while the promise sewn into Char’s charm remains her untold story.',
      }
    if (house.decisions['HD-30'] === 'talk')
      return {
        title: 'Two Versions of Leaving Home',
        text: 'Scylla describes the journey as a perfectly organized expedition. Char remembers the people who helped when the lists failed. Neither asks you to choose a favorite sister. They agree to ask one another before the next departure, though neither has explained what leaving cost.',
        cost: 'A conversation opens a future choice; it does not settle the sisters’ earlier bargain for them.',
      }
    if (house.decisions['HD-30'] === 'rest')
      return {
        title: 'Tea Before Testimony',
        text: 'Oren divides the remaining food, Scylla checks the blankets, and Char quietly mends a stranger’s ward. You take the offered rest instead of asking the sisters to account for their past. They both seem relieved, and the empty chair remains available.',
        cost: 'The party recovers, but the sisters’ private disagreement waits for another willing conversation.',
      }
    return {
      title: 'The Empty Place at the Landing',
      text: 'Scylla sets a cup beside the empty chair while Char repairs a stranger’s charm. Oren has counted enough food for everyone, but he will not count the unspoken promises between the sisters. You may ask what the House owes or let the party rest without demanding a confession.',
      cost: 'Listening may uncover a disagreement; rest preserves strength but leaves that conversation for later.',
    }
  }

  if (roomId === 'HD-32') {
    if (house.decisions['HD-26'] === 'testify')
      return {
        title: 'A Witness Who Can Refuse',
        text: 'The witness from the Disputed Testimony Hall has agreed to speak for themself. Vesper stands beside the Rootbound Warden, not behind you. The Warden can examine the account without treating the speaker as a possession transferred between keepers.',
        cost: 'A petition may spare a duel, but the witness can still withdraw consent.',
      }
    if (house.decisions['HD-17'] === 'read')
      return {
        title: 'The Archive Is Not a Witness',
        text: 'You bring the account you read in the Witness Archive. Pip can identify its date and Mosswick can verify the ink, but neither can sign for the person whose memory was stored. The Warden waits for a request that acknowledges that difference.',
        cost: 'The record makes a petition possible; it cannot promise the witness will agree.',
      }
    if (house.decisions['HD-16'] === 'return-name')
      return {
        title: 'A Name Returned, Not Claimed',
        text: 'The name you returned at the Naming Desk reaches the Warden ahead of you. The Index has one fewer person it can count as property. The Warden asks whether you will defend that choice when the doors open and other people demand the name.',
        cost: 'Restoring a name is evidence of care, not authority over its owner.',
      }
    if (briar['4,6'] === 'testify')
      return {
        title: 'The Wolf-Mother’s Outside Witness',
        text: 'You unfold the courier’s account of travelers protected by the wolf patrol. The Rootbound Warden recognizes the Index seal but not the village’s accusation. Someone outside this House has finally been allowed into its record.',
        cost: 'A distant witness can support a petition; their safety remains your concern.',
      }
    return {
      title: 'The Guardian Who Will Not Guess',
      text: 'The Warden has guarded people from the village and imprisoned them for the same reason. It asks for testimony you have not brought. Oren sets down his axe, not as a threat but as a reminder that a fair contest remains possible when proof is missing.',
      cost: 'Without testimony you must face the guardian; victory will not invent consent.',
    }
  }

  if (roomId === 'HD-35') {
    if (house.decisions['HD-35'] === 'release')
      return {
        title: 'The Weight of Open Hands',
        text: 'Pip helps the former residents carry their own jars into daylight. The Brass Knight offers guards for the journey; nobody is obliged to accept them. Some people will remember what they had asked the House to keep away.',
        cost: 'Freedom returns the burden of care to people who may disagree about it.',
      }
    if (house.decisions['HD-35'] === 'renew')
      return {
        title: 'A Commons With an Exit',
        text: 'Mosswick writes the first withdrawal clause before he writes the first member’s name. Vesper insists that a refusal must not require a public explanation. The Warden places the keys on the table rather than keeping them in its bark.',
        cost: 'A shared refuge survives only if leaving it remains a genuine choice.',
      }
    if (house.decisions['HD-35'] === 'break')
      return {
        title: 'The Door Without a Keeper',
        text: 'The mechanism breaks and the memories scatter to the people who can recognize them. Char starts a list of those who need help finding shelter. Oren quietly crosses out the column where he had expected to write a new jailer.',
        cost: 'No one inherits the lock, but nobody inherits a ready-made safety net either.',
      }
    if (house.decisions['HD-33'] === 'consent')
      return {
        title: 'Ask Before the Flame',
        text: 'The survivors from the Last Kind Lie have chosen different times to hear the truth. Scylla asks the Hearth to wait for each answer. Even the Brass Knight cannot call the delay cowardice when the choice belongs to those who must remember.',
        cost: 'Waiting protects consent, but it leaves some wounds unresolved tonight.',
      }
    if (house.decisions['HD-33'] === 'reveal')
      return {
        title: 'The Truth Already Walks Outside',
        text: 'The secret you revealed has reached the village before the fire can judge it. Pip reports anger, relief and people asking for privacy in equal measure. The Hearth cannot put that knowledge back into a jar to make the verdict simpler.',
        cost: 'Revelation gave people facts without giving them time to prepare.',
      }
    if (house.decisions['HD-29'] === 'repair')
      return {
        title: 'An Agreement That Can End',
        text: 'You carry the proposed revocation clause from the Indenture Room. Mosswick reads it aloud while Vesper asks who will enforce it when the witnesses leave. The Hearth will accept a promise only if its beneficiaries can say no tomorrow.',
        cost: 'A fairer contract requires continued work, not a single heroic signature.',
      }
    return {
      title: 'The Hearth Cannot Vote for Everyone',
      text: 'The fire holds grief alongside gratitude. The Warden can describe the old bargain, and Pip can name its injuries, but neither speaks for every person whose memory waits in glass. You must choose a future without calling it unanimous.',
      cost: 'Every ending protects something and asks somebody else to bear a risk.',
    }
  }

  return null
}
