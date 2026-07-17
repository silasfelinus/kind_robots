// /stores/seeds/packManifests.ts
//
// Packmaker manifest seed — the front-end copy of the approved launch-pack
// manifests (conductor project: packmaker, tasks t-003/t-004). The canonical
// source of truth is conductor's projects/packmaker/packs/*.yaml (schemaVersion
// 1, see SCHEMA.md there); this file mirrors those approved drafts as typed
// data so the admin generator view can run without a conductor round-trip or a
// YAML dependency. New packs can also be pasted into the admin panel as JSON
// with this same shape — see stores/packStore.ts.
//
// Nothing here touches the database. Every item is a draft payload only;
// generation happens item-by-item from the admin panel through the existing
// dreams/facets/characters/rewards + art pipelines, always with
// isPublic: false until the pack is released (interim rule per packmaker
// SPEC.md §4, pending kind-robots t-008's sharing/ACL design).

export type PackItemType = 'location' | 'genre' | 'character' | 'reward'

/** Which kind_robots model a pack item materializes into. */
export type PackItemShape = 'dream' | 'facet' | 'character' | 'reward'

export type PackVisibility = 'draft' | 'released'

export type PackPriceHook = 'free' | 'one-time' | 'dlc'

export interface PackItemDraftPayload {
  title: string
  description: string
  /** Prompt for regenerating the item's text through the chat pipeline. */
  generationPrompt: string
  /** Prompt for the item's art through the art pipeline. */
  artPrompt: string
}

export interface PackManifestItem {
  id: string
  type: PackItemType
  itemShape: PackItemShape
  draftPayload: PackItemDraftPayload
  /** Set once the item has been generated into a real database row. */
  refId?: number | null
  notes?: string
}

export interface PackManifest {
  schemaVersion: 1
  id: string
  title: string
  description: string
  owner: string
  visibility: PackVisibility
  price: { hook: PackPriceHook }
  items: PackManifestItem[]
}

const uncannyValor: PackManifest = {
  schemaVersion: 1,
  id: 'uncanny-valor',
  title: 'Uncanny Valor',
  description:
    'A street-level superhero launch pack: two home-turf locations, two tonal genres, four powered cast members with distinct origin flavors, and three signature gear rewards tied to those characters.',
  owner: 'silas',
  visibility: 'draft',
  price: { hook: 'dlc' },
  items: [
    {
      id: 'ironclad-skyport',
      type: 'location',
      itemShape: 'dream',
      draftPayload: {
        title: 'Ironclad Skyport',
        description:
          'A retrofitted cargo-blimp dock hovering above the old industrial district, now serving as an unofficial hero headquarters — half landing pad, half squat, entirely held together by donated parts and stubbornness.',
        generationPrompt:
          'Write a short evocative location description (80-120 words) for Ironclad Skyport, a retrofitted cargo-blimp dock turned makeshift superhero headquarters above an industrial district, for use as a kind_robots Dream (dreamType: LOCATION) description. Emphasize scrappy, held-together-by-hand engineering over polished tech.',
        artPrompt:
          'A weathered airship dock bristling with mismatched antennas and patched gas envelopes, floating above smokestacks at dusk, warm window light, painterly comic-inspired illustration.',
      },
      notes: "Home base location; anchors the pack's street-level tone.",
    },
    {
      id: 'sublevel-nine',
      type: 'location',
      itemShape: 'dream',
      draftPayload: {
        title: 'Sublevel Nine',
        description:
          "A decommissioned subway level converted into a containment wing for the city's stranger problems — part holding cell, part evidence locker for things that don't fit in either category.",
        generationPrompt:
          'Write a short evocative location description (80-120 words) for Sublevel Nine, a decommissioned subway level repurposed as a containment and evidence facility for superhuman incidents, for use as a kind_robots Dream (dreamType: LOCATION) description. Favor an uneasy, institutional-but-improvised tone over high-tech polish.',
        artPrompt:
          'A disused subway platform lined with reinforced cell doors and hand-labeled evidence crates, flickering fluorescent light, muted teal and rust color palette, moody illustration.',
      },
      notes: 'Secondary location; source of complication-driven plot hooks.',
    },
    {
      id: 'grounded-heroics',
      type: 'genre',
      itemShape: 'facet',
      draftPayload: {
        title: 'Grounded Heroics',
        description:
          'Personal-stakes superhero stories about rent, relationships, and showing up for your neighborhood — powers are a complication, not a solution.',
        generationPrompt:
          'Write a one-sentence flavor description for a "Grounded Heroics" genre Facet (kind: GENRE), emphasizing personal, street-level stakes over cosmic spectacle.',
        artPrompt:
          'Abstract genre icon: a cracked shield overlapping a house key, muted urban color palette, flat illustration style.',
      },
      notes: "Default tonal register for this pack's characters and locations.",
    },
    {
      id: 'bombastic-showdown',
      type: 'genre',
      itemShape: 'facet',
      draftPayload: {
        title: 'Bombastic Showdown',
        description:
          'Over-the-top set-piece battles where the skyline is the stakes and subtlety took the week off.',
        generationPrompt:
          'Write a one-sentence flavor description for a "Bombastic Showdown" genre Facet (kind: GENRE), emphasizing large-scale, high-energy superhero battles.',
        artPrompt:
          'Abstract genre icon: a lightning bolt shattering a city skyline silhouette, saturated primary colors, flat illustration style.',
      },
      notes: 'Escalation-flavored counterpart to Grounded Heroics.',
    },
    {
      id: 'volta-ferrin',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Volta Ferrin',
        description:
          "A former power-plant engineer who survived a grid-failure accident as a living lightning conduit — now moonlights as backup muscle while trying to keep her old crew's lights on.",
        generationPrompt:
          "Write a short character backstory (100-150 words) for Volta Ferrin, a former power-plant engineer turned living lightning conduit, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. blunt, protective, exhausted).",
        artPrompt:
          'Portrait of a wiry woman in a work jumpsuit crackling with faint blue-white electricity along her arms, safety goggles pushed up on her forehead, industrial backdrop, character concept art.',
      },
      notes:
        "Power source ties directly to Ironclad Skyport's improvised tech.",
    },
    {
      id: 'greyline',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Greyline',
        description:
          'A disgraced ex-cop who can turn intangible for short bursts, now working the same streets from the other side of the badge — equal parts penance and unfinished business.',
        generationPrompt:
          "Write a short character backstory (100-150 words) for Greyline, a disgraced ex-police officer with short-burst intangibility, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. guarded, methodical, self-doubting).",
        artPrompt:
          'Portrait of a lean figure in a faded grey coat partially phasing into translucency at the edges, city alley backdrop at night, noir-tinged character concept art.',
      },
      notes: "Best paired narratively with Sublevel Nine's containment cases.",
    },
    {
      id: 'bastion-ruk',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Bastion Ruk',
        description:
          'A gentle giant with near-total invulnerability, drawn to the team less for the fighting and more for the excuse to keep helping people move apartments.',
        generationPrompt:
          "Write a short character backstory (100-150 words) for Bastion Ruk, an invulnerable strongman with a gentle disposition, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. patient, soft-spoken, fiercely loyal).",
        artPrompt:
          'Portrait of a towering broad-shouldered man with weathered stone-grey skin texture, work gloves, a warm easy smile, soft daylight, character concept art.',
      },
      notes: 'Tonal anchor toward Grounded Heroics.',
    },
    {
      id: 'echo-vance',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Echo Vance',
        description:
          "A former touring musician whose voice can now shatter glass or calm a crowd, depending on which show they're putting on that night.",
        generationPrompt:
          "Write a short character backstory (100-150 words) for Echo Vance, a former musician with sound-manipulation powers, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. theatrical, restless, secretly anxious about losing their old life).",
        artPrompt:
          'Portrait of a stylish androgynous performer with visible sound-wave motifs rippling from their hands, stage lighting, character concept art.',
      },
      notes: 'Bombastic Showdown-leaning character; pairs with big set pieces.',
    },
    {
      id: 'ferrin-coil',
      type: 'reward',
      itemShape: 'reward',
      draftPayload: {
        title: 'Ferrin Coil',
        description:
          "A palm-sized capacitor coil, cool to the touch until it isn't — stores a single stored jolt of borrowed current for later use.",
        generationPrompt:
          'Write flavor text (2-3 sentences) for a kind_robots Reward named "Ferrin Coil" (rewardType: ITEM), themed around stored electrical power and improvised engineering, connected to Volta Ferrin.',
        artPrompt:
          'A small copper-wound coil device with a faint blue glow at its core, item-icon style, soft studio lighting.',
      },
      notes:
        'Linked conceptually to volta-ferrin; no DreamToReward relation until locations are generated.',
    },
    {
      id: 'greylines-badge',
      type: 'reward',
      itemShape: 'reward',
      draftPayload: {
        title: "Greyline's Badge",
        description:
          'A tarnished precinct badge, edges gone faintly translucent — carrying it seems to make its bearer a little harder to notice.',
        generationPrompt:
          'Write flavor text (2-3 sentences) for a kind_robots Reward named "Greyline\'s Badge" (rewardType: ITEM), themed around quiet watchfulness and unfinished justice, connected to Greyline.',
        artPrompt:
          'A worn silver police badge with edges dissolving into faint mist, item-icon style, cool blue-grey lighting.',
      },
      notes: 'Linked conceptually to greyline.',
    },
    {
      id: 'bastions-core-fragment',
      type: 'reward',
      itemShape: 'reward',
      draftPayload: {
        title: "Bastion's Core Fragment",
        description:
          "A fist-sized shard of stone-grey material, warm as skin — said to lend its bearer a measure of Bastion's steadiness under pressure.",
        generationPrompt:
          'Write flavor text (2-3 sentences) for a kind_robots Reward named "Bastion\'s Core Fragment" (rewardType: ITEM), themed around steadiness and quiet endurance, connected to Bastion Ruk.',
        artPrompt:
          'A rough-hewn grey stone shard with faint warm inner light along its cracks, item-icon style, soft studio lighting.',
      },
      notes: 'Linked conceptually to bastion-ruk.',
    },
  ],
}

const arcaneWhimsy: PackManifest = {
  schemaVersion: 1,
  id: 'arcane-whimsy',
  title: 'Arcane Whimsy',
  description:
    'A cozy-to-eerie magic launch pack: a hidden market and a moonlit observatory as home locations, two tonal genres spanning whimsical and wyrd, four spellcasting cast members, and three enchanted-item rewards tied to those characters.',
  owner: 'silas',
  visibility: 'draft',
  price: { hook: 'dlc' },
  items: [
    {
      id: 'bramblewick-market',
      type: 'location',
      itemShape: 'dream',
      draftPayload: {
        title: 'The Bramblewick Market',
        description:
          "A hidden bazaar that only opens on foggy mornings, tucked between two buildings that don't quite touch — stalls sell talking teapots, secondhand luck, and directions to places that no longer exist.",
        generationPrompt:
          'Write a short evocative location description (80-120 words) for The Bramblewick Market, a hidden bazaar that only appears on foggy mornings between two buildings, for use as a kind_robots Dream (dreamType: LOCATION) description. Favor a cozy, whimsical tone with a light undercurrent of the uncanny.',
        artPrompt:
          'A narrow cobblestone alley market strung with lanterns and fabric canopies, stalls overflowing with curious trinkets, soft fog, warm painterly fantasy illustration.',
      },
      notes: "Home base location; anchors the pack's cozy-conjuring tone.",
    },
    {
      id: 'hollow-moon-observatory',
      type: 'location',
      itemShape: 'dream',
      draftPayload: {
        title: 'Hollow Moon Observatory',
        description:
          "A cliffside spellcasting academy built around a telescope that hasn't pointed at a real star in decades — its lenses show somewhere else entirely, and the faculty have opinions about where.",
        generationPrompt:
          'Write a short evocative location description (80-120 words) for Hollow Moon Observatory, a cliffside magic academy whose central telescope shows an uncanny otherworld instead of the sky, for use as a kind_robots Dream (dreamType: LOCATION) description. Favor an eerie, wyrd tone appropriate for a higher-stakes counterpart to a cozy market.',
        artPrompt:
          'A stone observatory perched on a moonlit sea cliff, an oversized brass telescope aimed at a swirling violet aperture instead of the stars, atmospheric fantasy illustration.',
      },
      notes:
        'Secondary location; source of higher-stakes, Wyrd Peril plot hooks.',
    },
    {
      id: 'cozy-conjuring',
      type: 'genre',
      itemShape: 'facet',
      draftPayload: {
        title: 'Cozy Conjuring',
        description:
          'Low-stakes, slice-of-life magic stories about tea, mending charms, and small kindnesses done with a wand.',
        generationPrompt:
          'Write a one-sentence flavor description for a "Cozy Conjuring" genre Facet (kind: GENRE), emphasizing gentle, low-stakes, slice-of-life magic.',
        artPrompt:
          'Abstract genre icon: a teacup with a swirl of sparkling steam shaped like a small star, warm pastel palette, flat illustration style.',
      },
      notes:
        "Default tonal register for this pack's lighter characters and market location.",
    },
    {
      id: 'wyrd-peril',
      type: 'genre',
      itemShape: 'facet',
      draftPayload: {
        title: 'Wyrd Peril',
        description:
          'Eerie, fae-touched danger where the rules of magic bend and the bill always comes due, one way or another.',
        generationPrompt:
          'Write a one-sentence flavor description for a "Wyrd Peril" genre Facet (kind: GENRE), emphasizing eerie, higher-stakes fae-touched danger.',
        artPrompt:
          'Abstract genre icon: a crescent moon cracked open with thorned vines spilling out, deep violet and black palette, flat illustration style.',
      },
      notes: 'Escalation-flavored counterpart to Cozy Conjuring.',
    },
    {
      id: 'marigold-thistlewick',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Marigold Thistlewick',
        description:
          'A hedge witch who brews potions out of a market stall, more interested in fixing small everyday problems than in grand magic — though the grand magic keeps finding her anyway.',
        generationPrompt:
          "Write a short character backstory (100-150 words) for Marigold Thistlewick, a hedge witch and potion brewer working out of a market stall, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. practical, warm, quietly stubborn).",
        artPrompt:
          'Portrait of a middle-aged woman in a patched apron surrounded by floating bottles and dried herbs, warm lantern light, character concept art.',
      },
      notes: 'Anchors Bramblewick Market and the Cozy Conjuring tone.',
    },
    {
      id: 'corvid-nightshade',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Corvid Nightshade',
        description:
          'An illusionist bonded to a raven familiar who may or may not be the one actually in charge — their tricks are gorgeous, unsettling, and never quite what they first appear to be.',
        generationPrompt:
          "Write a short character backstory (100-150 words) for Corvid Nightshade, a raven-familiar-bonded illusionist, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. sly, theatrical, hard to pin down).",
        artPrompt:
          'Portrait of a slender figure in a feathered cloak with a raven perched on one shoulder, faint illusory duplicates shimmering at the edges, moody violet lighting, character concept art.',
      },
      notes:
        'Wyrd Peril-leaning character; pairs with Hollow Moon Observatory.',
    },
    {
      id: 'pell-wickstone',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'Pell Wickstone',
        description:
          'An apprentice enchanter at Hollow Moon who is earnest, clumsy, and one accidental miscast away from a very interesting afternoon — beloved by the market stallholders for the same reason the faculty find them exhausting.',
        generationPrompt:
          "Write a short character backstory (100-150 words) for Pell Wickstone, a well-meaning but clumsy apprentice enchanter, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. eager, accident-prone, kind).",
        artPrompt:
          'Portrait of a young apprentice in an ill-fitting robe with singed sleeve cuffs, sparks fizzling from an overloaded wand, sheepish expression, character concept art.',
      },
      notes:
        'Bridges both locations; comic relief with real stakes underneath.',
    },
    {
      id: 'hollow-warden',
      type: 'character',
      itemShape: 'character',
      draftPayload: {
        title: 'The Hollow Warden',
        description:
          "An ancient moss-covered golem that has guarded the observatory's telescope for longer than anyone living can account for — slow to speak, slower to trust, and the only one who remembers what the telescope used to point at.",
        generationPrompt:
          "Write a short character backstory (100-150 words) for The Hollow Warden, an ancient moss-covered golem guardian of a magical observatory, for use as a kind_robots Character row's flavor text. Suggest a class/species and a short list of notable traits (e.g. ancient, taciturn, unexpectedly gentle).",
        artPrompt:
          'Portrait of a massive stone golem overgrown with moss and small flowering vines, glowing faint violet runes across its chest, moonlit cliff backdrop, character concept art.',
      },
      notes:
        'Wyrd Peril anchor character tied directly to Hollow Moon Observatory.',
    },
    {
      id: 'thistlewicks-ledger',
      type: 'reward',
      itemShape: 'reward',
      draftPayload: {
        title: "Thistlewick's Ledger",
        description:
          'A small leather-bound recipe book whose pages rearrange themselves to show whichever potion its holder needs most, whether they asked for it or not.',
        generationPrompt:
          'Write flavor text (2-3 sentences) for a kind_robots Reward named "Thistlewick\'s Ledger" (rewardType: ITEM), themed around practical potion-craft and quiet helpfulness, connected to Marigold Thistlewick.',
        artPrompt:
          'A worn leather recipe book with a pressed flower bookmark and faint golden text shimmering across an open page, item-icon style, warm lighting.',
      },
      notes: 'Linked conceptually to marigold-thistlewick.',
    },
    {
      id: 'nightshade-feather',
      type: 'reward',
      itemShape: 'reward',
      draftPayload: {
        title: 'Nightshade Feather',
        description:
          'A single raven feather that shivers faintly when an illusion is nearby — tucked in a pocket, it has a habit of making its bearer just slightly harder to look directly at.',
        generationPrompt:
          'Write flavor text (2-3 sentences) for a kind_robots Reward named "Nightshade Feather" (rewardType: ITEM), themed around illusion and misdirection, connected to Corvid Nightshade.',
        artPrompt:
          'A single glossy black feather with a faint violet shimmer along its edge, item-icon style, moody lighting.',
      },
      notes: 'Linked conceptually to corvid-nightshade.',
    },
    {
      id: 'wardens-lichen-cloak',
      type: 'reward',
      itemShape: 'reward',
      draftPayload: {
        title: "Warden's Lichen Cloak",
        description:
          'A cloak woven from moss and lichen scraped from an ancient guardian — heavier than it looks, and it seems to steady the nerves of whoever wears it near something uncanny.',
        generationPrompt:
          'Write flavor text (2-3 sentences) for a kind_robots Reward named "Warden\'s Lichen Cloak" (rewardType: ITEM), themed around ancient steadiness and quiet protection, connected to The Hollow Warden.',
        artPrompt:
          'A heavy moss-green cloak textured with small lichen patches and faint glowing rune-threads along the hem, item-icon style, soft moonlit lighting.',
      },
      notes: 'Linked conceptually to hollow-warden.',
    },
  ],
}

export const seedPackManifests: PackManifest[] = [uncannyValor, arcaneWhimsy]
