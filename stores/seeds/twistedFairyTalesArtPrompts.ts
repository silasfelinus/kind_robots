// stores/seeds/twistedFairyTalesArtPrompts.ts
//
// Full-color proposal batch for Coloring Book Book Three: Twisted Fairy Tales.
// Exactly one standalone 1024x1536 portrait image per entry. No collages.

export type TwistedFairyTalesArtPrompt = {
  requestId: string
  number: number
  title: string
  conceptSlug: string
  width: 1024
  height: 1536
  imagePath: string
  sourceImages: string[]
  promptString: string
  negativePrompt: string
}

type ConceptSeed = {
  slug: string
  title: string
  scene: string
  sourceImages?: string[]
}

const STYLE = `Create one standalone full-color portrait illustration for Coloring Book Book Three: Twisted Fairy Tales. Final canvas: exactly 1024 x 1536 pixels, portrait orientation. Use the approved Kind Robots colored fine-detail style: mature young-adult graphic horror-comic illustration, playful darkness, expressive anatomy, one strong visual hook, a clear dominant silhouette, thick clean black outer contours, medium-weight interior linework, flat bounded color, hard-edged graphic shadows, and dense but organized storybook detail. Favor dramatic perspective, purposeful foreshortening, tactile costume and prop design, and many clearly separated enclosed shapes that could later support a coloring-page conversion. Keep the palette vivid, slightly grimy, theatrical, and Hot Topic / Spencer's-adjacent without becoming muddy or photorealistic. All sexualized characters are unambiguously adults. No gradients, soft airbrushing, painterly haze, readable text, logos, watermarks, borders, panels, collage, contact sheet, duplicate poses, or alternate versions on the same canvas.`

const NEGATIVE_PROMPT = `collage, grid, triptych, diptych, contact sheet, multiple poses, duplicate character, extra limbs, malformed hands, fused fingers, unreadable anatomy, childlike sexualization, text, caption, logo, watermark, border, photorealism, painterly blur, soft focus, low detail`

const FRACTURED_FAIRY_TALES_REFERENCE =
  '/images/dreams/fractured-fairy-tales.webp'

const concepts: ConceptSeed[] = [
  {
    slug: `three-little-dead`,
    title: `The Three Little Dead`,
    scene: `Three reanimated zombie pigs shamble together through a ruined fairy-tale village, preserving the recognizable Kind Robots trio. One wiry pig clutches rotten straw, one splintered rogue carries broken sticks, and one broad bricklayer hugs a single brick like a love letter. Their tattered overalls, exposed storybook bones, hungry grins, and leaning straw-stick-brick homes make them gross, affectionate, and instantly iconic rather than realistically gory.`,
    sourceImages: [
      '/images/bots/three-dead.webp',
      FRACTURED_FAIRY_TALES_REFERENCE,
    ],
  },
  {
    slug: `not-by-the-hair`,
    title: `Not by the Hair`,
    scene: `Stage the Three Little Dead at the door of a terrified cottage in a low, theatrical action angle. One pig knocks politely with a detached hoof, one sniffs around the windows, and one strains to blow the house down with decomposing lungs while loose straw and dust whirl around him. The residents' frightened silhouettes hide behind curtains; the pigs look more eager than evil.`,
  },
  {
    slug: `wolf-wasnt-the-problem`,
    title: `The Wolf Wasn't the Problem`,
    scene: `Show the adult Big Bad Wolf backed against a claw-scarred brick wall, honestly overwhelmed by the undead pigs returning from the village. He is a lanky punk werewolf in a patched coat with a bent cigarette, worried eyes, and a paper bag of groceries spilled at his boots. The composition should read like a suspect trying to explain an impossible crime scene to unseen authorities.`,
  },
  {
    slug: `red-midnight-delivery`,
    title: `Red Riding Hood: Midnight Delivery`,
    scene: `Frame adult Red as a dangerous goth courier striding through a moonlit forest, viewed slightly from below so she owns the path. She is freckled, curvy, field-strong, scarred from old close calls, and tired of fairy-tale emergencies. Her basket carries eggs, butter, medicine, wolfsbane, and a small chipped hand axe; watching eyes and bent trees surround her, but she never breaks stride.`,
  },
  {
    slug: `red-grandmothers-door`,
    title: `Red at the Grandmother's Door`,
    scene: `Use a tight half-torso action composition at the cottage threshold. Adult Red thrusts a small chipped hand axe toward the viewer in foreshortening while holding the door with her other hand, her expression alert, annoyed, and fully in control. A long-clawed silhouette waits near the bed inside; scars, freckles, practical muscle, worn leather, hinges, ivy, and her battered basket tell the story before violence begins.`,
  },
  {
    slug: `grandma-teeth-tonight`,
    title: `Grandma Has Teeth Tonight`,
    scene: `Show Grandma as an adult trans wolf burlesque headliner revealed beneath the lace nightcap. She has a broad masculine frame, angular muzzle, strong hands, and a magnificent push-up corset under a glamorous nightgown and feathered robe. Spectacles hang from one claw, silver curls frame dramatic makeup, and her enormous grin is feral, fabulous, and knowingly theatrical.`,
  },
  {
    slug: `huntsman-retired`,
    title: `The Huntsman, Retired`,
    scene: `Portrait an older, broad, scarred woodsman who has survived far too many enchanted crises and wants no part of another. He wears faded red flannel, patched work trousers, heavy boots, and a collection of practical tools rather than heroic armor. He sits on a stump sharpening an axe beside warning signs, wolf pelts, thermoses, and a stack of unpaid royal summons, staring at the viewer with exhausted suspicion.`,
  },
  {
    slug: `jack-giant-killer`,
    title: `Jack the Giant Killer`,
    scene: `Present adult Jack as a disturbingly cheerful nursery-rhyme slasher icon, boyish in face but unmistakably grown. He poses on a severed beanstalk stair with an oversized butcher knife, a trophy sack of giant keys, buttons, and jewelry, and a toy-like grin that never reaches his eyes. Keep the violence implied through trophies, stains, and scale rather than explicit gore.`,
  },
  {
    slug: `giantess-mourning`,
    title: `The Giantess in Mourning`,
    scene: `Show a massive widow giantess collapsing in genuine grief as tiny teddy-bear police haul her bound husband toward a cloud-sized prison wagon. Her huge shawl, tear-soaked face, wedding ring, and crushed bouquet carry the emotion while the tiny officers remain absurdly procedural. Jack is a distant, guilty speck on the beanstalk below.`,
  },
  {
    slug: `teddy-bear-police`,
    title: `Teddy Bear Police`,
    scene: `Focus on one hard-bitten female teddy-bear detective in a battered plush uniform, tiny boots, stitched badge, and impossible confidence. She collars a much larger dark-puppet suspect with tattoos, torn felt, brass rings, and practical-effects monster texture in a rain-soaked alley while two junior plush officers secure the scene. Cute proportions meet gritty police-drama framing.`,
  },
  {
    slug: `fee-fi-fo-funeral`,
    title: `Fee-Fi-Fo-Funeral`,
    scene: `Stage an enormous funeral procession across storm clouds and broken castle stones. Giant mourners carry a carved coffin decorated with beanstalks, bells, and colossal flowers while the grieving widow walks beside it beneath black banners. Far below, Jack watches from the vine as a tiny silhouette clutching one stolen golden keepsake.`,
  },
  {
    slug: `puss-alley-king`,
    title: `Puss in Boots: Alley King`,
    scene: `Show adult Puss as a mangy, tattooed, sexy-ugly alley monarch lounging on a broken fountain throne. He has a scarred muzzle, torn ear, crooked teeth, heavy-lidded eyes, extravagant boots, belts, rings, and a fishbone necklace. Stolen jewels, fish crates, alley cats, cracked statues, and wanted posters create trash-glam pirate swagger.`,
  },
  {
    slug: `puss-cleans-up`,
    title: `Puss Cleans Up Nice`,
    scene: `Place the same scarred adult tomcat at a decadent royal masquerade in stolen velvet, lace cuffs, jeweled rings, layered chains, and polished thigh-high boots. He raises a crystal goblet while slipping a key or gemstone into his coat; tiny mice assist beneath the banquet table and a palace dog watches suspiciously. He looks expensive at a distance and feral up close.`,
  },
  {
    slug: `marquis-scam`,
    title: `The Marquis Scam`,
    scene: `Show Puss directing an elaborate roadside fraud like a criminal stage manager. His terrified adult human companion wears borrowed finery while mice and alley cats repaint heraldry, drag stolen furniture into place, and disguise a collapsing estate before a royal carriage arrives. Puss dominates the foreground, calm, magnetic, and delighted by the scale of the lie.`,
  },
  {
    slug: `ogre-penthouse`,
    title: `Ogre Penthouse Takeover`,
    scene: `Puss lounges victoriously across an ogre-sized throne in a lavish castle apartment he has stolen through fraud. One boot hangs over the armrest as he drinks from an enormous goblet; a furious transformed mouse-ogre is trapped under a glass nearby. Giant silverware, trophies, jewels, sausages, cracked marble, and tiny cat servants make the scene decadent and ridiculous.`,
  },
  {
    slug: `hansel-factory-gates`,
    title: `Hansel at the Factory Gates`,
    scene: `Show adult Hansel and Gretel arriving at a magical candy factory hidden in a dark forest. Hansel reaches toward a sample in hungry amazement while Gretel studies gingerbread masonry, peppermint pipes, gumdrop smokestacks, syrup carts, and smiling mascots with growing suspicion. Delightful spectacle conceals locked doors, oven chimneys, and footprints that abruptly stop.`,
  },
  {
    slug: `gretel-doesnt-trust`,
    title: `Gretel Doesn't Trust This Place`,
    scene: `Make adult Gretel the clear foreground hero on the candy-factory floor. Strong hands, rolled sleeves, practical boots, and a hidden bread knife contrast with nervous gingerbread workers, suspicious molds, child-sized footprints, bones in sugar sacks, and cheerful decorations covering locks. Hansel laughs in the distance, oblivious.`,
  },
  {
    slug: `candy-witch-ceo`,
    title: `The Candy Witch, CEO`,
    scene: `Show the adult candy witch as a beloved industrial magnate on a brass-railed platform above her factory. Spun-sugar hair, cat-eye spectacles, stained gloves, jeweled oven keys, tailored dress, apron, and candy-cane wand create a commanding silhouette. Children cheer for her treats while locked controls, unsettling ingredient jars, and portraits of former workers hide in plain sight.`,
  },
  {
    slug: `so-much-sugar`,
    title: `So Much Sugar`,
    scene: `Center adult Hansel in a maximal candy-feast room, blissful and increasingly overwhelmed as syrup fountains, lollipop bouquets, animated pastries, and conveyor belts deliver more. Gretel tries to pull him away while smiling workers approach with measuring tapes and a person-shaped candy mold. The scene is funny first and ominous second.`,
  },
  {
    slug: `oven-room`,
    title: `The Oven Room`,
    scene: `Stage the climax beneath the factory with adult Gretel dominating the foreground, both hands correctly gripping a heavy iron oven peel or wrench. A vast smiling gingerbread oven cracks open to reveal scorched metal, gears, chains, and claw-like mechanisms while the Candy Witch approaches still smiling. Hansel remains frightened but unharmed in a rolling sugar cage as Gretel prepares to reverse the trap.`,
  },
  {
    slug: `cinderella-after-midnight`,
    title: `Cinderella After Midnight`,
    scene: `Show adult Cinderella standing amid carriage wreckage after midnight, transformed not into a servant but into a glittering vengeance icon. Her torn ballgown, one glass slipper, soot, mascara streaks, and improvised weapon create heartbreak and dangerous glamour. Mice gather behind her like loyal street soldiers while palace lights burn in the distance.`,
  },
  {
    slug: `godmother-side-hustle`,
    title: `The Fairy Godmother Has a Side Hustle`,
    scene: `Portray an adult fairy godmother as an overworked magical fixer running an illegal midnight consultancy. She wears glamorous robes over office clothes, holds a cigarette holder and sparkling wand, and juggles contracts, receipts, transformation permits, and desperate clients. Mice in livery manage filing cabinets and pumpkin-carriage parts around her cluttered backroom.`,
  },
  {
    slug: `stepsisters-revenge-glam`,
    title: `The Ugly Stepsisters' Revenge Glam`,
    scene: `Show two adult stepsisters as grotesque, formidable fashion-horror icons preparing for their own revenge debut. Their couture is overbuilt, asymmetrical, feathered, jeweled, and almost architectural; makeup is excessive but intentional, and their expressions mix envy, cruelty, and absolute commitment. Broken mirrors, shoe forms, dressmaker mannequins, and discarded invitations frame them.`,
  },
  {
    slug: `glass-slipper-crime-scene`,
    title: `Glass Slipper Crime Scene`,
    scene: `Treat the abandoned glass slipper as evidence in a bizarre royal procedural. Grim palace investigators surround it on a velvet cushion beneath a dramatic lamp while guards measure footprints, question mice, dust a pumpkin wheel, and pin maps behind them. The tiny glittering object should feel both sacred relic and absurd cause of a kingdom-wide manhunt.`,
  },
  {
    slug: `snow-white-roommates`,
    title: `Snow White and the Seven Deadly Roommates`,
    scene: `Show adult Snow White as the exhausted pretty-goth manager of a cottage shared with seven chaotic little weirdos, each embodying a different vice through costume and behavior rather than labels. She stands amid laundry, dishes, mining gear, broken furniture, vanity clutter, and poison-apple cosmetics with a coffee cup and dead-eyed patience. The roommates adore her and make everything worse.`,
  },
  {
    slug: `queen-self-care`,
    title: `The Evil Queen's Mirror Self-Care Ritual`,
    scene: `Frame the adult Evil Queen at a black vanity performing beauty as a severe magical religion. A razor-sharp crown, poisoned cosmetics, ritual brushes, jeweled gloves, and perfect posture surround her while the living mirror evaluates every detail. She is elegant, disciplined, terrifying, and not remotely rushed.`,
  },
  {
    slug: `mirror-lie-to-me`,
    title: `Mirror, Mirror, Lie to Me`,
    scene: `Make the demonic mirror the central character: a slick silver-faced sycophant emerging through liquid glass with elegant hands, a lying smile, and eyes fixed on the Queen. Ornate frame creatures whisper contradictory compliments while reflections distort beauty, age, and power. The Queen appears only partly in foreground silhouette, willingly accepting the performance.`,
  },
  {
    slug: `poison-apple-wake`,
    title: `Poison Apple Girl Dinner`,
    scene: `Stage adult Snow White in a glass coffin at an impossibly aesthetic gothic wake, arranged like a saintly corpse among flowers, ravens, ribbons, poison apples, and seven little candles. Her seven roommates hover in different forms of grief while the Queen's disguised hand offers one final apple from the edge of frame. Tragic, beautiful, and just slightly too curated.`,
  },
  {
    slug: `beauty-beast-dance`,
    title: `Beauty and the Beast: Late-Night Slow Dance`,
    scene: `Show adult Beauty and a huge grotesque Beast dancing sincerely in a ruined ballroom after everyone else has gone. He has tusks, scars, fur, claws, and careful tenderness; she wears a glamorous but lived-in gown and rests confidently against him. Candle-creatures, cracked mirrors, fallen roses, and torn curtains watch like affectionate chaperones.`,
  },
  {
    slug: `beast-unmasked`,
    title: `The Beast Unmasked`,
    scene: `Create a commanding full-body portrait of the adult Beast without softening his creature design. Heavy fur, tusks, scars, tail, claws, old jewelry, and regal posture should feel ugly-beautiful and deeply dignified. He removes a ceremonial mask among overgrown roses, showing vulnerability without becoming conventionally handsome.`,
  },
  {
    slug: `gaston-taxidermy`,
    title: `Gaston's Taxidermy Club`,
    scene: `Show an adult peacock-hunter villain posing in his grotesquely luxurious trophy room. He has enormous muscles, a perfect smirk, polished boots, and total self-love while walls overflow with dubious taxidermy, antlers, mirrors, medals, and portraits of himself. Tiny club members applaud as one mounted creature rolls its eyes.`,
  },
  {
    slug: `rapunzel-hair-cult`,
    title: `Rapunzel's Hair Cult`,
    scene: `Transform adult Rapunzel's tower into a strange devotional chamber where endless living hair drapes the walls like sacred webbing. She sits at the center as serene cult leader, surrounded by candles, combs, scissors, braids, and hooded attendants tending the strands. The hair should feel beautiful, intelligent, and possibly hungry.`,
  },
  {
    slug: `prince-called-first`,
    title: `The Prince Who Should Have Called First`,
    scene: `Show an adult prince trapped halfway up Rapunzel's tower, tangled head-to-toe in living hair that clearly resents the intrusion. His heroic pose has collapsed into comic panic while roses, shears, combs, and discarded climbing gear fall below. Rapunzel watches from the window with amused, unreadable calm.`,
  },
  {
    slug: `sea-witch-office`,
    title: `Little Mermaid: Sea Witch Contract Office`,
    scene: `Create an original adult deep-sea contract queen in a bioluminescent office carved into a whale-bone reef. She has elegant tentacles, pearl-like teeth, jeweled glasses, ink-stained claws, and glowing legal scrolls orbiting her desk. Nervous clients wait among bottled voices, signed shells, eels, and abyssal filing cabinets; fabulous villainy with no direct character copying.`,
  },
  {
    slug: `mermaid-land-badly`,
    title: `The Little Mermaid on Land, Badly`,
    scene: `Show an adult former mermaid attempting to pass as human at a moonlit fish market and hating every second. Her glamorous dress is damp, her smile painful, her sharp teeth difficult to hide, and her new shoes obviously torture her. Fish stare accusingly from stalls while gulls, puddles, and tangled seaweed follow her like a curse.`,
  },
  {
    slug: `ensemble`,
    title: `Twisted Fairy Tales Ensemble`,
    scene: `Create a unified book-poster scene rather than a collage: the Three Little Dead anchor the center while adult Red, Puss, the Candy Witch, Giantess, Jack, Gretel, the Mirror Queen, and select supporting creatures spiral around one crooked carnival street. Use overlapping depth, a shared moon, banners without text, and one coherent light source. Every figure should be readable, energetic, and part of the same chaotic parade.`,
  },
  {
    slug: `frog-prince-diseased`,
    title: `The Frog Prince: Pondside Lounge Lizard`,
    scene: `Show an adult frog prince who is visibly diseased, damp, and strangely suave, reclining in a ruined palace bath like a lounge singer. He wears a tiny crown, silk robe, rings, and a seductive smile despite warts, bandages, flies, and suspicious pond scum. A horrified but intrigued royal guest holds the promised kiss at arm's length.`,
  },
  {
    slug: `goldilocks-riot-goblin`,
    title: `Goldilocks, Home-Invasion Riot Goblin`,
    scene: `Portray adult Goldilocks as a feral home-invading riot goblin caught mid-rampage in the bears' cottage. She wears stolen pajamas, heavy boots, a saucepan helmet, and pockets full of porridge spoons while smashing furniture and testing beds with reckless enthusiasm. The bear family watches from the doorway, deeply confused and slightly afraid.`,
  },
  {
    slug: `baba-yaga-rideshare`,
    title: `Baba Yaga's Rideshare Service`,
    scene: `Show adult Baba Yaga operating a chaotic magical rideshare from her chicken-legged cottage. She leans from the driver's window with aviator goggles, scarf, map charms, and a five-star confidence she has not earned while passengers cling to luggage on the roof. The hut gallops through traffic between fairy-tale worlds, scattering toll signs and terrified geese.`,
  },
  {
    slug: `rumpel-contract-goblin`,
    title: `Rumpelstiltskin, Contract Goblin`,
    scene: `Create an adult tiny contract goblin in towering platform boots, a razor-cut velvet suit, too many rings, and a briefcase full of impossible clauses. He stands on a spinning wheel like a courtroom podium while desperate royals sign glowing contracts around him. His grin is charming, litigious, and absolutely predatory.`,
  },
  {
    slug: `pied-piper-glam-plague`,
    title: `The Pied Piper, Glam Plague Musician`,
    scene: `Show an adult glam-rock piper leading a nocturnal procession through a plague-struck town. He wears feathered hair, platform boots, a jeweled coat, rat-tooth jewelry, and a luminous pipe that sends ribbons of music through rats, masked citizens, and dancing shadows. Beautiful stage presence hides the fact that no one following him is coming back.`,
  },
  {
    slug: `sleeping-beauty-alarms`,
    title: `Sleeping Beauty and the Alarm Curse`,
    scene: `Show adult Sleeping Beauty resting inside a coffin-like bed tangled in thorns, clocks, bells, cuckoos, and broken alarm mechanisms. She looks peacefully glamorous while every device screams silently around her and exhausted rescuers collapse outside the briars. A single eye may be half-open, suggesting she is choosing not to wake.`,
  },
  {
    slug: `pinocchio-weaponized-nose`,
    title: `Pinocchio, Sweet-Faced Liar`,
    scene: `Show an adult carved wooden liar with visible joints, polished cheeks, and a gentle innocent expression while his growing nose has become an elaborate accidental weapon. It spears through curtains, cages a cricket advisor, knocks over furniture, and exposes hidden stolen objects. He keeps smiling as if none of this is his fault.`,
  },
  {
    slug: `bluebeard-showroom`,
    title: `Bluebeard's Bridal Showroom`,
    scene: `Stage an adult Bluebeard as a luxury bridal impresario presenting a sinister showroom of gowns, keys, portraits, and locked fitting-room doors. Prospective brides inspect couture while mannequins resemble former clients a little too closely. Bluebeard is charming, immaculate, and framed by an enormous ring of keys.`,
  },
  {
    slug: `goose-girl-bodyguards`,
    title: `The Goose Girl's Feral Bodyguards`,
    scene: `Show an adult exiled goose girl striding across a royal courtyard with a squad of enormous, scarred, furious geese protecting her. She wears practical farm clothes beneath stolen ceremonial jewelry and carries herself like a reluctant crime boss. Feathers, snapped spears, muddy footprints, and terrified courtiers establish that the birds have chosen violence.`,
  },
  {
    slug: `emperor-fashion-humiliation`,
    title: `The Emperor's New Clothes: Runway Disaster`,
    scene: `Show an adult emperor on a high-fashion runway realizing too late that the entire court can see the scam. Keep him strategically covered by an absurd cloud of feathers, jewelry, banners, and frantic attendants rather than explicit nudity. Designers, critics, and citizens react with delight, horror, and sketchbooks raised as the humiliation becomes an industry event.`,
  },
]

export const twistedFairyTalesArtPrompts: TwistedFairyTalesArtPrompt[] =
  concepts.map((seed, index) => {
    const number = index + 1
    const padded = String(number).padStart(2, '0')

    return {
      requestId: `twisted-fairy-tales-${padded}-${seed.slug}-color`,
      number,
      title: seed.title,
      conceptSlug: seed.slug,
      width: 1024 as const,
      height: 1536 as const,
      imagePath: `public/images/artcollections/twisted-fairy-tales/proposals/${padded}-${seed.slug}.webp`,
      sourceImages: seed.sourceImages ?? [FRACTURED_FAIRY_TALES_REFERENCE],
      promptString: `${seed.scene}\n\n${STYLE}`,
      negativePrompt: NEGATIVE_PROMPT,
    }
  })
