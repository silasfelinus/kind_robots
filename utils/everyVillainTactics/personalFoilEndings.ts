import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import { personalCastFor } from './personalCasts'

export const PERSONAL_FOIL_ENDINGS: Readonly<
  Record<SignaturePowerId, readonly [string, string, string, string]>
> = {
  'accident-fire': [
    "I'll reopen the maintenance ledger, Backdraft. No safety waiver gets signed while a worker is still inside.",
    "I'll hand over the bypass invoices. My board cannot call the missing signatures a clerical error.",
    "I'll keep the company gates open during the inquiry, but you and I still disagree about who should run the kitchens.",
    "You own the emergency switch now. I know how easily an owner starts calling other people's injuries overhead.",
  ],
  'accident-air': [
    'The ground crews chose their own route. I will put that choice into the next flight agreement.',
    "My delegation will submit the original lightning warnings, not the treaty's approved summary.",
    'We can negotiate access to the airfield without pretending the people below us signed the deal.',
    'Your clearance is the only one the city hears tonight. I will ask the next council whether it consented.',
  ],
  'accident-earth': [
    "The workers who held the exit deserve the first word. I won't let another institution classify them as rescued property.",
    "The quarry survey and the delivery register belong together. I will challenge the curator's label with both.",
    'Your union has a witness in me, even though we still disagree about the way the keeper fell.',
    'A locked door has a new keeper. I know what it is to be kept behind glass by someone who calls it protection.',
  ],
  'accident-water': [
    'The dock crews are opening the next route themselves. I will make sure their petitions are heard before the board meets.',
    'The eleven missing minutes and the harbor accounts can finally be read side by side.',
    "I'll go back to the pier and ask the families what the reports still omit.",
    'You can hold the valve keys. The dock families will still ask for a key of their own.',
  ],
  'accident-discipline': [
    "The rescue didn't end when the clock stopped. I'll add the workers' own procedures to our training manual.",
    "Your unaltered timestamps make the copied instructions impossible to excuse. I'll bring my original notes.",
    'We can disagree about the right move without erasing the people who made it possible.',
    "A faster order is not necessarily a better one. I won't teach your new command as the only correct answer.",
  ],
  'accident-genius': [
    'I can make the equipment repairable by the people who used it tonight. That is a better result than a patent.',
    "I'll bring the second invoice to the same reviewers as your raw trial data.",
    'The model still has omissions. Let the technicians and the evacuees change it before we try again.',
    'One owner of the archive is still a closed system. I will build an alternative the city can inspect.',
  ],
  'accident-birthright': [
    "The foundation can pay for public exits instead of another family portrait. I'll insist on an independent account.",
    'I will produce the company shipment log, even if it ruins the next gala.',
    "The crest and the company seal are not the same as a witness statement. Let's leave both out of the inquiry.",
    'You inherited one kind of authority and won another. I know the temptation to sell both as a public service.',
  ],
  'accident-social': [
    "I'll leave the rescued people's names out of the paper unless they ask to tell their story.",
    'The unedited relay logs are enough to investigate the planted secrets without exposing the innocent.',
    'I can preserve the record without demanding that every witness listen to your version or mine.',
    "You hold the microphone. I won't trade a source's privacy for a place beside it.",
  ],
  'mutant-fire': [
    "Your notebook can stay private. I'll help the displaced residents find care without turning their history into a demonstration.",
    "The registry orders and the suppressed safety reports can be reviewed without disclosing anybody's treatment.",
    "I'll keep my own response to those reports separate from the testimony of the missing people.",
    'You have control of the list now. I refuse to let a new registry decide how its subjects ought to feel.',
  ],
  'mutant-air': [
    "The ground crews can use the hangar without a camera or a demonstration. I'll put that in the permit conditions.",
    "The pursuit authorizations and my contractor's clearance dates belong in the same independent review.",
    "I'll make the next flight route accessible to people who never agreed to be filmed.",
    'You can control the airspace tonight. Nobody has to surrender their wings to earn a landing permit.',
  ],
  'mutant-earth': [
    "The people I waited beside deserve the same dignity as yours. Let's leave the camera packed.",
    "I'll bring the quarry records and let the witnesses decide whether they want to appear in your photographs.",
    'The union can ask the residents what a safe exit means before commissioning its next portrait.',
    "I know the weight of a closed floor. I won't help turn your command into another reason to leave people below.",
  ],
  'mutant-water': [
    "The families can run the rescue pier themselves. I'll bring the dry-route plan and listen to their changes.",
    "I'll preserve the valve log next to the council's missing petitions, with the witnesses' permission.",
    "The waterfront still has work to do. I'll attend the next meeting as a resident, not its answer.",
    "You have the harbor's command frequency. I won't call it a public rescue channel until the families can use it freely.",
  ],
  'mutant-discipline': [
    "The children can learn the dance without buying a guild contract. I'll stand watch while they set the terms.",
    'My warrant archive and your consent records need the same independent custodian.',
    'I can withdraw the contract without asking the dancers to forgive every decision I made.',
    "I chose my own contract. I won't sign one that makes your choreography compulsory for the rest of the city.",
  ],
  'mutant-genius': [
    "Local technicians can maintain the exits. Let's ask them which of our contingency plans actually worked.",
    "I'll turn over the equipment invoice beside the contradictory forecasts, including the numbers that make my work look bad.",
    'We should leave the unresolved cases visible, not sell the city a revised prediction of certainty.',
    "Your forecast owns the grid tonight. I'll help build a system where a technician can disagree with it.",
  ],
  'mutant-birthright': [
    "The family's crest can fund the residents' new shelter, but no resident owes it loyalty.",
    'I will take the old Guardian clauses to the households named in them before the family rewrites the archive.',
    "We both have an inherited obligation. We can choose to honor it without agreeing about the family's future.",
    "You've claimed the authority our ancestors wanted. I will not ask the city to inherit another oath.",
  ],
  'mutant-social': [
    "I'll protect the names of everyone who refused the collective or the patch. Their decision belongs to them.",
    'The trial buyers can answer for their orders without a witness surrendering a private thought.',
    'We can investigate persuasion without making people feel that they have to agree with either of us.',
    'You control the network, not its listeners. I will defend the right to leave it.',
  ],
  'tech-fire': [
    "The tenants can inspect the new exits before the insurer approves a single invoice. I'll open the purchasing books.",
    "I'll give the independent inspectors the original certificates and the board's altered copies.",
    'The repair club can keep its workshop even if we never agree who should own the patents.',
    "You hold the switches our company used to sell. Don't make the tenants buy their freedom back from you.",
  ],
  'tech-air': [
    "The flight board can give ground crews permanent access without a sponsorship waiver. I'll sign the transfer.",
    "I'll submit the turbine procurement records next to the safety complaints the contractor suppressed.",
    'The next flight permit will include the people who maintain the landing strip, not just the pilots.',
    'You seized the clearance network. I know what happens when the company turns a safety rule into a price.',
  ],
  'tech-earth': [
    "The families can appoint their own building inspector. I'll provide the structural drawings without licensing conditions.",
    "I'll hand over the actual approval dates, including the board member who signed the unsafe design.",
    "The repair crews need an independent budget and an open report; I'll stop insisting on a corporate spokesperson.",
    "You control the emergency doors. The people living behind them deserve more than another owner's assurance.",
  ],
  'tech-water': [
    "I'll transfer the missing rescue equipment to a service the dock volunteers can supervise.",
    "The captain's purchase records and our own invoices will go to the same public inquiry.",
    "I'll fund ordinary rescue equipment without asking the volunteers to endorse the company.",
    "The distress channel is yours tonight. I won't let you turn an unanswered call into a premium service.",
  ],
  'tech-discipline': [
    "The injured students can set their own recovery schedule. The review board won't get another exclusive demonstration from us.",
    "I'll return the unedited accident report and the sponsor's eligibility criteria to the athletes.",
    'The team deserves a separate medical opinion before anyone announces a comeback.',
    "You won the competition and the rulebook. I won't endorse a score that makes injured teammates expendable.",
  ],
  'tech-genius': [
    "The lab can use ordinary medical supplies without a prototype trial. I'll authorize an unconditional equipment transfer.",
    "I'll turn over the altered trial results alongside the sponsor's instructions, with participants' records protected.",
    'The repairable rig can stay in the workshop while independent researchers review what went wrong.',
    'You own the test conditions now. The next subject must be able to refuse you as freely as they could refuse me.',
  ],
  'tech-birthright': [
    "I'll keep the landing strip open to people who can't afford a Sterling clearance code.",
    "The original flight permits will go to the investigators without your board's publicity filter.",
    "We can separate the ground crew's livelihood from your decision about the future of the company.",
    "You have the whole command network, Sterling. I'll keep flying routes it doesn't own.",
  ],
  'tech-social': [
    "The witnesses can decide whether to appear in the final footage. I'll keep the patch on while they make that choice.",
    "The sponsor's editing instructions can be examined without forcing witnesses to reenact their private experiences.",
    "I won't demand a favorable interview to prove our work tonight was useful.",
    'You own the broadcast feed. I will defend the people who choose not to watch it.',
  ],
  'magic-fire': [
    'The displaced residents can share the new shelter without a magical bargain or a citizenship hearing.',
    "I'll put the spirit contracts beside the officials' exclusion orders. Neither set gets to erase the other.",
    "The salamander can decide where it goes; I'll ask the colony to offer an invitation, not a claim.",
    'You have the emergency grid. No displaced person should have to promise a lifetime of service to use it.',
  ],
  'magic-air': [
    'The residents can sing in their own languages without having their verses approved by my delegation.',
    "I'll submit the treaty's hidden provisions alongside your censored storm song.",
    'The next agreement should protect the right not to perform, even if our versions of the melody differ.',
    'You command the transmitter now. A treaty that forbids dissent is still coercion when sung beautifully.',
  ],
  'magic-earth': [
    "I'll fund the housing council's repairs without buying a seat at its next meeting.",
    "The old deeds belong beside the company's property purchases; I'll produce both sets for independent review.",
    'The neighbors may keep the community room even if they never invite my board back for tea.',
    "You hold the keys now. Don't let a new landlord's name be the only change the tenants remember.",
  ],
  'magic-water': [
    'The people on the waterfront can choose their own rescue route, even if your bowl showed a different one.',
    "I'll give the inquiry the actual valve measurements beside the broker's forecasts.",
    'We can keep predictions and measurements in separate columns until the witnesses have spoken.',
    "You control the next warning broadcast. I won't let an uncertain future become an order nobody can question.",
  ],
  'magic-discipline': [
    "I'll withdraw the guild's warrant and let the residents choose their own shelter without pledging allegiance.",
    "The sealed relief correspondence and the broker's warrants should be examined by the same independent reviewer.",
    'The order may refuse to forgive me; I can still keep its former subjects out of the registry.',
    'You have the power to issue the next command. I chose not to deliver a child to a broker, and I will make that choice again.',
  ],
  'magic-genius': [
    "I'll give the local researchers the tools to verify our results without another proprietary instrument.",
    'The omitted conditions and the duplicate invoice can stand together as evidence, not as claims of genius.',
    "Let's retain the failed examples in the public report. Neither of us needs to own its final proof.",
    'Your theorem now governs the grid. I will insist that independent technicians can produce counterexamples.',
  ],
  'magic-birthright': [
    'The former subjects of my household can use your wards without choosing another royal family.',
    "I'll release the palace correspondence beside your mother's journal, keeping the witnesses' private names safe.",
    'Our families can argue about inheritance after the residents have chosen where to live.',
    "You have the authority my court wanted. I won't replace a throne with a ward that demands the same loyalty.",
  ],
  'magic-social': [
    "Your audience can leave without paying in promises. I'll keep the patch on while they choose whether to return.",
    "The broker's contract and the persuasion trials belong in an inquiry that protects the people who signed them.",
    'I can decline the next performance without asking the audience to dislike you.',
    "You own the stage tonight. I won't help make its next audience captive, whether through magic or persuasion.",
  ],
  'alien-fire': [
    "I'll open the company housing contracts to residents who were denied citizenship and remove the corporate conditions.",
    "I'll produce the shipment manifest for the escape pods, including the buyer who canceled their delivery.",
    'The displaced families deserve a place to live while the board and the officials dispute responsibility.',
    "You command the district now. Don't turn the residence permit into a license issued by another exclusive authority.",
  ],
  'alien-air': [
    "The ground crew can use both the old and new flight routes without signing a treaty they didn't negotiate.",
    "I'll provide the contractor's original flight clearances to the treaty reviewers.",
    'We can keep the local hangar open while people renegotiate the airspace without us.',
    "You hold the command grid. I won't accept a clearance that requires the city to surrender its right to negotiate.",
  ],
  'alien-earth': [
    "The workers can take their own belongings with them. I know why the museum's definition of property matters here.",
    "I'll bring the original quarry logs alongside the accession correspondence, without deciding which resident belongs to whom.",
    'The union hall is available to the former exhibits if they want to use it. Nobody owes us a photograph.',
    "You control the archive now. Don't turn the rescued people into another collection held for their own good.",
  ],
  'alien-water': [
    'The waterfront crews can keep the routes open without asking either of us what counts as home.',
    "The suppressed reef observations belong alongside the valve logs; I'll preserve both originals.",
    "I'll let the coastal families decide where the inquiry starts, even if that means questioning my earlier choices.",
    "You hold the warning channel. A shore isn't a home if the people living there cannot call for rescue themselves.",
  ],
  'alien-discipline': [
    "I'll return the copied instruction to its original teachers and make room for your former targets to decline a lesson.",
    "The warrant instructions and the security firm's purchase records can be examined without naming the child.",
    "I can teach a different response to danger without claiming the guild's decisions were all mine to excuse.",
    "You won the contract and the command grid. I won't teach that obedience to either is the only honorable move.",
  ],
  'alien-genius': [
    "I'll give local technicians the drawings and the tools without another exclusive Sterling license.",
    "The company resold your donated equipment. I'll deliver both invoices and preserve the original purchase record.",
    'The workshop can remain independent of the sponsor while its technicians choose which systems to replace.',
    "You command the grid. If local people can't repair it without your permission, we've only exchanged suppliers.",
  ],
  'alien-birthright': [
    "The residents can use my family foundation's shelter without adopting either kingdom's crest.",
    "I'll bring the original coup testimony to the families before my own household edits the account.",
    'We can dispute the inheritance after every displaced neighbor has chosen a home.',
    "You claimed a throne's power without a throne. I will not require the city to address you by a royal title.",
  ],
  'alien-social': [
    "I'll protect the names of the people who chose solitude, even if the collective never forgets them.",
    'The forced-link procurement instructions can be examined without reading a private mind.',
    'We can investigate the sponsor without requiring any witness to join a shared account.',
    'The network is yours tonight. I will keep a private channel for the people who decline its connection.',
  ],
  'psychic-fire': [
    'The displaced families can find shelter without agreeing to a public display of anger or gratitude.',
    "I'll submit the exclusion orders alongside your unsafe-demonstration reports; no medical file is a bargaining chip.",
    'We can acknowledge what the sponsors did without telling the rescued people how they ought to feel.',
    "You control the district's warning system. Don't make a person's distress a condition of receiving help.",
  ],
  'psychic-air': [
    'The residents may choose a grounded route instead of joining a flight agreement. My delegation will honor that.',
    "The suppressed platform inspection and the treaty's clearance provisions can be reviewed together.",
    'Your family can hear what happened from you, without a spokesperson negotiating the story for them.',
    'You command the airspace now. The people who cannot float still deserve the right to veto a dangerous route.',
  ],
  'psychic-earth': [
    "I'll release the cornerstone archive to the independent reviewers without asking you to extract a single memory.",
    'The documents that our board hid can be verified through ordinary records; your private impressions remain yours.',
    'The people named in the archive can choose to speak, and the company can answer even when they refuse.',
    "You own the archive's access controls. Don't make consent another password that only the powerful can issue.",
  ],
  'psychic-water': [
    'The harbor crews can open the shelters without making the people inside adopt a reassuring mood.',
    'The compulsory synchronization purchase records and our ignored petitions belong in the same public account.',
    "I'll listen to the dock families' actual concerns, even if they prefer not to share their feelings with you.",
    "You hold the signal. I won't let a new command turn the residents' relief into a required performance.",
  ],
  'psychic-discipline': [
    'The guild can withdraw its warrants and let the residents learn whatever skills they choose.',
    "I'll put the original warrant instructions beside the copied manuals without offering the child as evidence.",
    'The teachers can correct the lesson without signing another contract to prove their loyalty.',
    'You own the rulebook now. I will decline any order that requires me to abandon someone I chose to protect.',
  ],
  'psychic-genius': [
    'Local researchers can check the examination results without being required to open their minds to anyone.',
    "I'll preserve the unauthorized answer-key sales beside the duplicate technology invoices.",
    "We can question the sponsor's results without another mental examination of its subjects.",
    "Your examination now determines who controls the grid. I'll insist on equipment that does not read its user's thoughts.",
  ],
  'psychic-birthright': [
    'The board will provide ordinary safety equipment without requiring anyone to believe your forecast.',
    "I'll surrender the order that suppressed your warning, alongside the company's dated shipment record.",
    'The residents can ask the company about its decisions without pretending your vision answered every question.',
    'You control the warning grid now. The next prediction must still be something the city can question.',
  ],
  'psychic-social': [
    "I'll keep the patch on while the witnesses choose which parts of the record they want made public.",
    "The planted stories and the trial orders can be investigated without revealing anybody's unrelated secrets.",
    'You can protect a source while I protect the right to disagree with their account.',
    "You command the broadcast tonight. I won't make somebody love the story in order to keep their privacy.",
  ],
}

export function personalFoilEnding(
  lead: SignaturePowerId,
  foil: SignaturePowerId | null,
  index: number,
  castVersion: number | undefined,
): string {
  if (
    castVersion !== 2 ||
    !foil ||
    personalCastFor(lead)?.foil !== foil ||
    !Object.hasOwn(PERSONAL_FOIL_ENDINGS, lead)
  )
    return ''
  return PERSONAL_FOIL_ENDINGS[lead][index] ?? ''
}
