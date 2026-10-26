/** Canonical Capes & Tassels 48 two-step signatures. Source mirrored from Conductor. */

export const POWER_FORMS = [
  {
    "id": "impact",
    "name": "Impact",
    "legacy": "kinetic",
    "mechanic": "Focused contact",
    "requirement": "Reach a target at arm's length; gloves and body take recoil",
    "view": "Close three-quarter view of a pair of navy-clad arms beside"
  },
  {
    "id": "arc",
    "name": "Arc",
    "legacy": "elemental",
    "mechanic": "Directed ranged projection",
    "requirement": "Maintain an open line of sight; the beam can strike bystanders",
    "view": "Wide side view of a person in a navy academy coat aiming one hand across"
  },
  {
    "id": "veil",
    "name": "Veil",
    "legacy": "empathy",
    "mechanic": "Defensive surrounding layer",
    "requirement": "Hold a protective stance; visibility or movement is reduced",
    "view": "Full-figure rear view of a standing caped person beside"
  },
  {
    "id": "step",
    "name": "Step",
    "legacy": "spatial",
    "mechanic": "Short-range repositioning",
    "requirement": "Choose a safe landing surface; injured companions cannot always follow",
    "view": "Low-angle side view of boots and lower legs crossing"
  },
  {
    "id": "weave",
    "name": "Weave",
    "legacy": "technopathy",
    "mechanic": "Construct tools and terrain",
    "requirement": "Needs nearby material and a free hand; constructs decay under stress",
    "view": "Eye-level view of two gloved hands building a structure across"
  },
  {
    "id": "beacon",
    "name": "Beacon",
    "legacy": "biotech",
    "mechanic": "Area pulse and rally support",
    "requirement": "Needs sustained exposure; an enemy can trace the source",
    "view": "High three-quarter view of a person holding both palms outward above"
  }
] as const

export const POWER_AFFINITIES = [
  {
    "id": "fire",
    "name": "Fire",
    "palette": "orange coals, visible smoke and yellow sparks",
    "prop": "a cracked brick rescue training floor",
    "risk": "Heat harms shelter materials",
    "icon": "a small burning copper ring"
  },
  {
    "id": "ice",
    "name": "Ice",
    "palette": "pale blue frost, transparent crystalline ice and white vapor",
    "prop": "a canal-side platform with wet railings",
    "risk": "Brittle ice fails in sudden temperature changes",
    "icon": "a six-point crystalline star"
  },
  {
    "id": "storm",
    "name": "Storm",
    "palette": "forked white-blue electricity, copper wires and sparks",
    "prop": "the academy rooftop beneath grey rain clouds",
    "risk": "Electronics and heart monitors can be disrupted",
    "icon": "a jagged copper lightning rod"
  },
  {
    "id": "stone",
    "name": "Stone",
    "palette": "rough ochre granite shards and pale limestone dust",
    "prop": "a collapsed concrete bridge beside the transit tracks",
    "risk": "Heavy stone blocks exits and cracks foundations",
    "icon": "a grey cut-stone hexagon"
  },
  {
    "id": "light",
    "name": "Light",
    "palette": "focused golden-white rays, prismatic reflections and amber halos",
    "prop": "a sunlit medical atrium with tall glass windows",
    "risk": "Bright flashes blind rescuers and reveal hiding civilians",
    "icon": "a gold eight-point crystal"
  },
  {
    "id": "shadow",
    "name": "Shadow",
    "palette": "deep indigo silhouettes, violet edges and black vapor",
    "prop": "a dim backstage corridor beside the ballroom",
    "risk": "Hidden people and evidence can become impossible to identify",
    "icon": "a black crescent with violet trim"
  },
  {
    "id": "bloom",
    "name": "Bloom",
    "palette": "thick green vines, pink flowers and wet leaves",
    "prop": "the botanical greenhouse behind the academy",
    "risk": "Living growth can entangle unwilling people and damage plumbing",
    "icon": "a copper seed pod opening"
  },
  {
    "id": "gravity",
    "name": "Gravity",
    "palette": "floating pebbles, tilted brass railings and bent blue grid lines",
    "prop": "a suspension bridge above the harbor",
    "risk": "Mass shifts injure bystanders and destabilize structural supports",
    "icon": "three small orbiting iron spheres"
  }
] as const

export const POWER_VOWS = [
  {
    "id": "shelter",
    "name": "Shelter",
    "promise": "Defend the people nearest the danger even when the larger plan becomes harder.",
    "ending_type": "hero",
    "prom_effect": "The player places their body and ability between trapped guests and the shattered chandelier."
  },
  {
    "id": "unmask",
    "name": "Unmask",
    "promise": "Expose who controls a crisis, even when the truth ends a comfortable alliance.",
    "ending_type": "rogue",
    "prom_effect": "The player reveals the control mechanism and gives independent rescuers a route the academy cannot supervise."
  },
  {
    "id": "claim",
    "name": "Claim",
    "promise": "Seize direct command before somebody indecisive has a chance to spend lives.",
    "ending_type": "villain",
    "prom_effect": "The player redirects the chandelier control to a personal emergency console; the city survives with an uncomfortable new owner."
  }
] as const

export const SIGNATURE_POWERS = [
  {
    "id": "impact-fire",
    "form": "impact",
    "element": "fire",
    "name": "Flaming Fists",
    "legacy": "kinetic",
    "action": "Punch a flaming opening through a jammed blast door",
    "cost": "Smoke fills the evacuation hallway",
    "training": "Flaming Fists lets the player punch a flaming opening through a jammed blast door during training, but smoke fills the evacuation hallway.",
    "limitation": "Smoke fills the evacuation hallway",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a fire-sensitive route appears, Flaming Fists can punch a flaming opening through a jammed blast door.",
      "tradeoff": "Smoke fills the evacuation hallway"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Flaming Fists is used to break the ballroom doors without burning the guests' escape route. Smoke fills the evacuation hallway. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Flaming Fists helps weld a secret opening for dock volunteers behind faculty barricades. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Flaming Fists is used to seal the prom guests inside a fireproof ring under personal command. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-ice",
    "form": "impact",
    "element": "ice",
    "name": "Glacier Knuckles",
    "legacy": "kinetic",
    "action": "Freeze a failing steel support at the exact point of contact",
    "cost": "A struck joint shatters if the load shifts",
    "training": "Glacier Knuckles lets the player freeze a failing steel support at the exact point of contact during training, but a struck joint shatters if the load shifts.",
    "limitation": "A struck joint shatters if the load shifts",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a ice-sensitive route appears, Glacier Knuckles can freeze a failing steel support at the exact point of contact.",
      "tradeoff": "A struck joint shatters if the load shifts"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Glacier Knuckles is used to hold a staircase together until every dancer crosses. A struck joint shatters if the load shifts. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Glacier Knuckles helps leave a frosted tunnel the city volunteers can share. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Glacier Knuckles is used to freeze the entrance shut while deciding who is allowed past. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-storm",
    "form": "impact",
    "element": "storm",
    "name": "Thunder Hammers",
    "legacy": "kinetic",
    "action": "Discharge twin arcs into an overloaded tram connector",
    "cost": "Shock spreads through wet equipment",
    "training": "Thunder Hammers lets the player discharge twin arcs into an overloaded tram connector during training, but shock spreads through wet equipment.",
    "limitation": "Shock spreads through wet equipment",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a storm-sensitive route appears, Thunder Hammers can discharge twin arcs into an overloaded tram connector.",
      "tradeoff": "Shock spreads through wet equipment"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Thunder Hammers is used to interrupt the chandelier power without electrocuting the musicians. Shock spreads through wet equipment. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Thunder Hammers helps trip the city shield relays in a sequence that reveals the villain's remote link. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Thunder Hammers is used to make every city power line answer a single pair of conductor gloves. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-stone",
    "form": "impact",
    "element": "stone",
    "name": "Quarry Breaker",
    "legacy": "kinetic",
    "action": "Drive a wedge-shaped crack through a damaged foundation",
    "cost": "Rubble may bury people below the fracture",
    "training": "Quarry Breaker lets the player drive a wedge-shaped crack through a damaged foundation during training, but rubble may bury people below the fracture.",
    "limitation": "Rubble may bury people below the fracture",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a stone-sensitive route appears, Quarry Breaker can drive a wedge-shaped crack through a damaged foundation.",
      "tradeoff": "Rubble may bury people below the fracture"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Quarry Breaker is used to split a fallen marble beam to release dancers pinned underneath. Rubble may bury people below the fracture. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Quarry Breaker helps expose an illicit maintenance passage through stone. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Quarry Breaker is used to raise stone barricades around the ballroom and appoint yourself gatekeeper. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-light",
    "form": "impact",
    "element": "light",
    "name": "Sunstrike Palms",
    "legacy": "kinetic",
    "action": "Compress a flash of light against a sealed door panel",
    "cost": "People facing the flash lose sight temporarily",
    "training": "Sunstrike Palms lets the player compress a flash of light against a sealed door panel during training, but people facing the flash lose sight temporarily.",
    "limitation": "People facing the flash lose sight temporarily",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a light-sensitive route appears, Sunstrike Palms can compress a flash of light against a sealed door panel.",
      "tradeoff": "People facing the flash lose sight temporarily"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Sunstrike Palms is used to open a glowing seam in the ballroom evacuation doors. People facing the flash lose sight temporarily. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Sunstrike Palms helps expose hidden ink and false tickets with contact flashes. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Sunstrike Palms is used to blind every witness while taking command of the shield panel. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-shadow",
    "form": "impact",
    "element": "shadow",
    "name": "Eclipse Punch",
    "legacy": "kinetic",
    "action": "Strike and extinguish a bright security lamp without touching wires",
    "cost": "A darkened corridor hides casualties and evidence",
    "training": "Eclipse Punch lets the player strike and extinguish a bright security lamp without touching wires during training, but a darkened corridor hides casualties and evidence.",
    "limitation": "A darkened corridor hides casualties and evidence",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a shadow-sensitive route appears, Eclipse Punch can strike and extinguish a bright security lamp without touching wires.",
      "tradeoff": "A darkened corridor hides casualties and evidence"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Eclipse Punch is used to kill the surveillance spotlight long enough for trapped students to escape. A darkened corridor hides casualties and evidence. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Eclipse Punch helps create a blind strip through cameras to expose the council's locked exit. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Eclipse Punch is used to erase all security recordings, including evidence of the player's command. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-bloom",
    "form": "impact",
    "element": "bloom",
    "name": "Briar Gauntlets",
    "legacy": "kinetic",
    "action": "Grow thorny wooden handholds from a shattered wall",
    "cost": "Thorns tear clothing and block narrow exits",
    "training": "Briar Gauntlets lets the player grow thorny wooden handholds from a shattered wall during training, but thorns tear clothing and block narrow exits.",
    "limitation": "Thorns tear clothing and block narrow exits",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a bloom-sensitive route appears, Briar Gauntlets can grow thorny wooden handholds from a shattered wall.",
      "tradeoff": "Thorns tear clothing and block narrow exits"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Briar Gauntlets is used to pull the injured across a broken landing on living wood grips. Thorns tear clothing and block narrow exits. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Briar Gauntlets helps create a climbing route from the kitchens for independent rescuers. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Briar Gauntlets is used to bind the prom's double doors with a thorn fence under player control. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "impact-gravity",
    "form": "impact",
    "element": "gravity",
    "name": "Gravity Hammer",
    "legacy": "kinetic",
    "action": "Compress weight into one strike that steadies a falling metal frame",
    "cost": "A misjudged mass shift throws bystanders sideways",
    "training": "Gravity Hammer lets the player compress weight into one strike that steadies a falling metal frame during training, but a misjudged mass shift throws bystanders sideways.",
    "limitation": "A misjudged mass shift throws bystanders sideways",
    "special_route": {
      "skill": "kinetic",
      "trigger": "When a gravity-sensitive route appears, Gravity Hammer can compress weight into one strike that steadies a falling metal frame.",
      "tradeoff": "A misjudged mass shift throws bystanders sideways"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Gravity Hammer is used to hold the chandelier support while guests exit from beneath it. A misjudged mass shift throws bystanders sideways. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Gravity Hammer helps float the frame aside to reveal a hidden antenna coupler. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Gravity Hammer is used to pin the chandelier and every nearby guard in place until commands are obeyed. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-fire",
    "form": "arc",
    "element": "fire",
    "name": "Phoenix Lance",
    "legacy": "elemental",
    "action": "Send a narrow flame jet across a flooded electrical bay",
    "cost": "A long-range fire jet can ignite escape ropes",
    "training": "Phoenix Lance lets the player send a narrow flame jet across a flooded electrical bay during training, but a long-range fire jet can ignite escape ropes.",
    "limitation": "A long-range fire jet can ignite escape ropes",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a fire-sensitive route appears, Phoenix Lance can send a narrow flame jet across a flooded electrical bay.",
      "tradeoff": "A long-range fire jet can ignite escape ropes"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Phoenix Lance is used to cut the incoming chandelier beam without crossing the crowd. A long-range fire jet can ignite escape ropes. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Phoenix Lance helps trace the malicious fuel conduit by following flame-resistant gaps. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Phoenix Lance is used to write a permanent hot barrier between the ballroom and the waterfront. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-ice",
    "form": "arc",
    "element": "ice",
    "name": "Frostline Ray",
    "legacy": "elemental",
    "action": "Project a narrow freezing line into a cracked coolant pipe",
    "cost": "The frozen section may burst when pressure returns",
    "training": "Frostline Ray lets the player project a narrow freezing line into a cracked coolant pipe during training, but the frozen section may burst when pressure returns.",
    "limitation": "The frozen section may burst when pressure returns",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a ice-sensitive route appears, Frostline Ray can project a narrow freezing line into a cracked coolant pipe.",
      "tradeoff": "The frozen section may burst when pressure returns"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Frostline Ray is used to freeze the overloaded core long enough to unplug it. The frozen section may burst when pressure returns. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Frostline Ray helps expose the hidden flow of coolant through a frosted map on the floor. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Frostline Ray is used to ice-lock the city cooling loop until the player's orders are accepted. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-storm",
    "form": "arc",
    "element": "storm",
    "name": "Chain Lightning",
    "legacy": "elemental",
    "action": "Jump electrical arcs along a row of conductive devices",
    "cost": "The chain can enter a life-support unit unexpectedly",
    "training": "Chain Lightning lets the player jump electrical arcs along a row of conductive devices during training, but the chain can enter a life-support unit unexpectedly.",
    "limitation": "The chain can enter a life-support unit unexpectedly",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a storm-sensitive route appears, Chain Lightning can jump electrical arcs along a row of conductive devices.",
      "tradeoff": "The chain can enter a life-support unit unexpectedly"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Chain Lightning is used to disable three municipal shield transmitters in a safe sequence. The chain can enter a life-support unit unexpectedly. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Chain Lightning helps make the remote controls flash one by one to expose the saboteur. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Chain Lightning is used to link every shield relay to a personal amplifier. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-stone",
    "form": "arc",
    "element": "stone",
    "name": "Stone Spire",
    "legacy": "elemental",
    "action": "Raise one sharp column from a distant patch of paving",
    "cost": "A new column can pierce power or water lines",
    "training": "Stone Spire lets the player raise one sharp column from a distant patch of paving during training, but a new column can pierce power or water lines.",
    "limitation": "A new column can pierce power or water lines",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a stone-sensitive route appears, Stone Spire can raise one sharp column from a distant patch of paving.",
      "tradeoff": "A new column can pierce power or water lines"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Stone Spire is used to raise a bridge over a fallen orchestra pit. A new column can pierce power or water lines. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Stone Spire helps lift an abandoned antenna for public inspection above the dancers. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Stone Spire is used to build a watchtower in the ballroom with the player above everyone. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-light",
    "form": "arc",
    "element": "light",
    "name": "Prism Beam",
    "legacy": "elemental",
    "action": "Split a bright ray around obstacles with hanging crystal",
    "cost": "Reflections can reveal hidden civilians to the villain",
    "training": "Prism Beam lets the player split a bright ray around obstacles with hanging crystal during training, but reflections can reveal hidden civilians to the villain.",
    "limitation": "Reflections can reveal hidden civilians to the villain",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a light-sensitive route appears, Prism Beam can split a bright ray around obstacles with hanging crystal.",
      "tradeoff": "Reflections can reveal hidden civilians to the villain"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Prism Beam is used to divert the central light beam into empty skylight panes. Reflections can reveal hidden civilians to the villain. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Prism Beam helps reveal the forged beam's path across a mirrored ceiling. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Prism Beam is used to send an unmistakable ownership signal across the whole city. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-shadow",
    "form": "arc",
    "element": "shadow",
    "name": "Dusk Thread",
    "legacy": "elemental",
    "action": "Aim a filament of shadow that disconnects illumination",
    "cost": "Invisible threads can cut rescue cables",
    "training": "Dusk Thread lets the player aim a filament of shadow that disconnects illumination during training, but invisible threads can cut rescue cables.",
    "limitation": "Invisible threads can cut rescue cables",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a shadow-sensitive route appears, Dusk Thread can aim a filament of shadow that disconnects illumination.",
      "tradeoff": "Invisible threads can cut rescue cables"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Dusk Thread is used to separate the chandelier's control shadow from its rotating core. Invisible threads can cut rescue cables. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Dusk Thread helps follow its dark cable backward to the hidden operator. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Dusk Thread is used to enclose the promenade in an unlit zone no rival can navigate. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-bloom",
    "form": "arc",
    "element": "bloom",
    "name": "Thorn Spear",
    "legacy": "elemental",
    "action": "Grow a pointed vine in a straight line from a seed",
    "cost": "The spear roots into structures it touches",
    "training": "Thorn Spear lets the player grow a pointed vine in a straight line from a seed during training, but the spear roots into structures it touches.",
    "limitation": "The spear roots into structures it touches",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a bloom-sensitive route appears, Thorn Spear can grow a pointed vine in a straight line from a seed.",
      "tradeoff": "The spear roots into structures it touches"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Thorn Spear is used to pin a collapsing balcony railing to a stable wall. The spear roots into structures it touches. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Thorn Spear helps mark a safe tunnel across a closed staff greenhouse. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Thorn Spear is used to turn living roots into compulsory barriers around dissenters. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "arc-gravity",
    "form": "arc",
    "element": "gravity",
    "name": "Orbit Ray",
    "legacy": "elemental",
    "action": "Bend the trajectory of falling debris with a narrow mass field",
    "cost": "A miss can redirect debris toward another crowd",
    "training": "Orbit Ray lets the player bend the trajectory of falling debris with a narrow mass field during training, but a miss can redirect debris toward another crowd.",
    "limitation": "A miss can redirect debris toward another crowd",
    "special_route": {
      "skill": "elemental",
      "trigger": "When a gravity-sensitive route appears, Orbit Ray can bend the trajectory of falling debris with a narrow mass field.",
      "tradeoff": "A miss can redirect debris toward another crowd"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Orbit Ray is used to turn the chandelier's glass fragments away from the dance floor. A miss can redirect debris toward another crowd. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Orbit Ray helps expose an incoming projectile's true origin through a visible curved path. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Orbit Ray is used to suspend city projectiles motionless until the mayor yields. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-fire",
    "form": "veil",
    "element": "fire",
    "name": "Ember Mantle",
    "legacy": "empathy",
    "action": "Wrap a moving person in a warm curtain of fire",
    "cost": "Heat exhausts allies trapped inside the shield",
    "training": "Ember Mantle lets the player wrap a moving person in a warm curtain of fire during training, but heat exhausts allies trapped inside the shield.",
    "limitation": "Heat exhausts allies trapped inside the shield",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a fire-sensitive route appears, Ember Mantle can wrap a moving person in a warm curtain of fire.",
      "tradeoff": "Heat exhausts allies trapped inside the shield"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Ember Mantle is used to keep guests warm while ferry crews evacuate them through rain. Heat exhausts allies trapped inside the shield. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Ember Mantle helps walk through forbidden heat sensors without supplying false identity data. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Ember Mantle is used to keep the ballroom sealed inside a fire curtain under one command. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-ice",
    "form": "veil",
    "element": "ice",
    "name": "Rime Cloak",
    "legacy": "empathy",
    "action": "Form a translucent ice shell around two moving people",
    "cost": "The icy cover reduces hearing and makes floors slippery",
    "training": "Rime Cloak lets the player form a translucent ice shell around two moving people during training, but the icy cover reduces hearing and makes floors slippery.",
    "limitation": "The icy cover reduces hearing and makes floors slippery",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a ice-sensitive route appears, Rime Cloak can form a translucent ice shell around two moving people.",
      "tradeoff": "The icy cover reduces hearing and makes floors slippery"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Rime Cloak is used to protect the injured from glass while they cross the ballroom. The icy cover reduces hearing and makes floors slippery. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Rime Cloak helps carry rescued guests through the damp service route without guards seeing faces. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Rime Cloak is used to encase dissenting faculty in transparent ice until they sign over access. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-storm",
    "form": "veil",
    "element": "storm",
    "name": "Static Shroud",
    "legacy": "empathy",
    "action": "Wrap a crew in a web of grounded electrical threads",
    "cost": "The field interrupts medical monitors and hearing aids",
    "training": "Static Shroud lets the player wrap a crew in a web of grounded electrical threads during training, but the field interrupts medical monitors and hearing aids.",
    "limitation": "The field interrupts medical monitors and hearing aids",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a storm-sensitive route appears, Static Shroud can wrap a crew in a web of grounded electrical threads.",
      "tradeoff": "The field interrupts medical monitors and hearing aids"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Static Shroud is used to shield the orchestra from the transmitter's charged metal shards. The field interrupts medical monitors and hearing aids. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Static Shroud helps mask the electrical signatures of an independent rescue crew. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Static Shroud is used to jam all non-player radios inside the academy. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-stone",
    "form": "veil",
    "element": "stone",
    "name": "Granite Skin",
    "legacy": "empathy",
    "action": "Turn the outer surface of a rescue cape into layered rock armor",
    "cost": "Weight makes stairs and ceilings more fragile",
    "training": "Granite Skin lets the player turn the outer surface of a rescue cape into layered rock armor during training, but weight makes stairs and ceilings more fragile.",
    "limitation": "Weight makes stairs and ceilings more fragile",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a stone-sensitive route appears, Granite Skin can turn the outer surface of a rescue cape into layered rock armor.",
      "tradeoff": "Weight makes stairs and ceilings more fragile"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Granite Skin is used to stand beneath a collapsing beam while classmates pass. Weight makes stairs and ceilings more fragile. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Granite Skin helps show the public the compromised support hidden inside stone. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Granite Skin is used to occupy the control platform as an immovable armored ruler. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-light",
    "form": "veil",
    "element": "light",
    "name": "Halo Guard",
    "legacy": "empathy",
    "action": "Surround a group with a soft-edged dome of concentrated light",
    "cost": "The bright dome makes hiding impossible",
    "training": "Halo Guard lets the player surround a group with a soft-edged dome of concentrated light during training, but the bright dome makes hiding impossible.",
    "limitation": "The bright dome makes hiding impossible",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a light-sensitive route appears, Halo Guard can surround a group with a soft-edged dome of concentrated light.",
      "tradeoff": "The bright dome makes hiding impossible"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Halo Guard is used to block the chandelier blast while injured dancers crawl to the exits. The bright dome makes hiding impossible. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Halo Guard helps project the actual casualty count on the shield so officials cannot conceal it. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Halo Guard is used to keep everyone inside the glowing dome until they agree to the rescue plan. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-shadow",
    "form": "veil",
    "element": "shadow",
    "name": "Nightfall Veil",
    "legacy": "empathy",
    "action": "Cast a moving patch of darkness over a group",
    "cost": "People inside cannot read signs or see each other clearly",
    "training": "Nightfall Veil lets the player cast a moving patch of darkness over a group during training, but people inside cannot read signs or see each other clearly.",
    "limitation": "People inside cannot read signs or see each other clearly",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a shadow-sensitive route appears, Nightfall Veil can cast a moving patch of darkness over a group.",
      "tradeoff": "People inside cannot read signs or see each other clearly"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Nightfall Veil is used to hide frightened guests from searching surveillance drones. People inside cannot read signs or see each other clearly. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Nightfall Veil helps conceal the volunteer evacuation path through the faculty hall. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Nightfall Veil is used to cover the ballroom in darkness while replacing the city access keys. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-bloom",
    "form": "veil",
    "element": "bloom",
    "name": "Moss Armor",
    "legacy": "empathy",
    "action": "Grow a thick living mat around a rescuer",
    "cost": "Vines need water and may constrict the person inside",
    "training": "Moss Armor lets the player grow a thick living mat around a rescuer during training, but vines need water and may constrict the person inside.",
    "limitation": "Vines need water and may constrict the person inside",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a bloom-sensitive route appears, Moss Armor can grow a thick living mat around a rescuer.",
      "tradeoff": "Vines need water and may constrict the person inside"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Moss Armor is used to cushion falling glass and release the dancers unharmed. Vines need water and may constrict the person inside. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Moss Armor helps hide evidence inside flowering growth for the independent student auditors. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Moss Armor is used to restrain every faculty guard with living foliage. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "veil-gravity",
    "form": "veil",
    "element": "gravity",
    "name": "Eventide Shell",
    "legacy": "empathy",
    "action": "Wrap nearby objects in a low-gravity spherical zone",
    "cost": "Loose objects inside drift and may strike rescuers",
    "training": "Eventide Shell lets the player wrap nearby objects in a low-gravity spherical zone during training, but loose objects inside drift and may strike rescuers.",
    "limitation": "Loose objects inside drift and may strike rescuers",
    "special_route": {
      "skill": "empathy",
      "trigger": "When a gravity-sensitive route appears, Eventide Shell can wrap nearby objects in a low-gravity spherical zone.",
      "tradeoff": "Loose objects inside drift and may strike rescuers"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Eventide Shell is used to slow debris until guests walk through the ballroom doors. Loose objects inside drift and may strike rescuers. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Eventide Shell helps float the damaged transmitter core into the public courtyard. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Eventide Shell is used to suspend every opponent in a silent sphere around the command desk. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-fire",
    "form": "step",
    "element": "fire",
    "name": "Cinder Dash",
    "legacy": "spatial",
    "action": "Move through a short passage as a trail of hot ash",
    "cost": "The trail can ignite curtains and reveal the route",
    "training": "Cinder Dash lets the player move through a short passage as a trail of hot ash during training, but the trail can ignite curtains and reveal the route.",
    "limitation": "The trail can ignite curtains and reveal the route",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a fire-sensitive route appears, Cinder Dash can move through a short passage as a trail of hot ash.",
      "tradeoff": "The trail can ignite curtains and reveal the route"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Cinder Dash is used to carry extinguishers between burning sections of the balcony. The trail can ignite curtains and reveal the route. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Cinder Dash helps slip through the hot transmitter vents to find the villain's connection. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Cinder Dash is used to burn escape paths behind the player to isolate command rivals. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-ice",
    "form": "step",
    "element": "ice",
    "name": "Icewalk",
    "legacy": "spatial",
    "action": "Freeze temporary footholds beneath each moving step",
    "cost": "Footprints melt and cannot support a slow follower",
    "training": "Icewalk lets the player freeze temporary footholds beneath each moving step during training, but footprints melt and cannot support a slow follower.",
    "limitation": "Footprints melt and cannot support a slow follower",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a ice-sensitive route appears, Icewalk can freeze temporary footholds beneath each moving step.",
      "tradeoff": "Footprints melt and cannot support a slow follower"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Icewalk is used to create a line of ice steps across flooded orchestra seats. Footprints melt and cannot support a slow follower. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Icewalk helps reach the security controls without activating pressure plates. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Icewalk is used to make a private stair of ice accessible only to the player's boots. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-storm",
    "form": "step",
    "element": "storm",
    "name": "Lightning Skip",
    "legacy": "spatial",
    "action": "Jump between grounded electrical contacts in one flash",
    "cost": "An ungrounded destination throws the traveler off balance",
    "training": "Lightning Skip lets the player jump between grounded electrical contacts in one flash during training, but an ungrounded destination throws the traveler off balance.",
    "limitation": "An ungrounded destination throws the traveler off balance",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a storm-sensitive route appears, Lightning Skip can jump between grounded electrical contacts in one flash.",
      "tradeoff": "An ungrounded destination throws the traveler off balance"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Lightning Skip is used to reach a high control relay before the chandelier locks. An ungrounded destination throws the traveler off balance. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Lightning Skip helps follow the antagonist's current through three staff consoles. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Lightning Skip is used to appear beside a city switchboard before rival responders arrive. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-stone",
    "form": "step",
    "element": "stone",
    "name": "Faultstep",
    "legacy": "spatial",
    "action": "Move between cracks in adjacent stone surfaces",
    "cost": "A misplaced step opens a dangerous floor fracture",
    "training": "Faultstep lets the player move between cracks in adjacent stone surfaces during training, but a misplaced step opens a dangerous floor fracture.",
    "limitation": "A misplaced step opens a dangerous floor fracture",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a stone-sensitive route appears, Faultstep can move between cracks in adjacent stone surfaces.",
      "tradeoff": "A misplaced step opens a dangerous floor fracture"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Faultstep is used to pull trapped guests through cracks in the ballroom floor. A misplaced step opens a dangerous floor fracture. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Faultstep helps enter a buried maintenance chamber to reveal the alternate evacuation route. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Faultstep is used to collapse rival staircases while leaving a private stone path. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-light",
    "form": "step",
    "element": "light",
    "name": "Sunpath",
    "legacy": "spatial",
    "action": "Move between connected patches of direct light",
    "cost": "Shadowed exits cannot be reached without another source",
    "training": "Sunpath lets the player move between connected patches of direct light during training, but shadowed exits cannot be reached without another source.",
    "limitation": "Shadowed exits cannot be reached without another source",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a light-sensitive route appears, Sunpath can move between connected patches of direct light.",
      "tradeoff": "Shadowed exits cannot be reached without another source"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Sunpath is used to escort dancers along glowing skylight patches to safety. Shadowed exits cannot be reached without another source. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Sunpath helps expose secret hall windows by lighting the true route to the control room. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Sunpath is used to control movement by switching the arena lamps on and off. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-shadow",
    "form": "step",
    "element": "shadow",
    "name": "Shadow Slip",
    "legacy": "spatial",
    "action": "Pass from one unlit surface to another",
    "cost": "Unlit surfaces conceal hazards and missing people",
    "training": "Shadow Slip lets the player pass from one unlit surface to another during training, but unlit surfaces conceal hazards and missing people.",
    "limitation": "Unlit surfaces conceal hazards and missing people",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a shadow-sensitive route appears, Shadow Slip can pass from one unlit surface to another.",
      "tradeoff": "Unlit surfaces conceal hazards and missing people"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Shadow Slip is used to reach the medical bay without crossing the searchlights. Unlit surfaces conceal hazards and missing people. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Shadow Slip helps follow a hidden watcher from one dark doorway to another. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Shadow Slip is used to enter private apartments through shadows without permission. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-bloom",
    "form": "step",
    "element": "bloom",
    "name": "Vine Vault",
    "legacy": "spatial",
    "action": "Spring between firm roots and anchored vines",
    "cost": "Anchors tear loose from damaged structures",
    "training": "Vine Vault lets the player spring between firm roots and anchored vines during training, but anchors tear loose from damaged structures.",
    "limitation": "Anchors tear loose from damaged structures",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a bloom-sensitive route appears, Vine Vault can spring between firm roots and anchored vines.",
      "tradeoff": "Anchors tear loose from damaged structures"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Vine Vault is used to lift injured dancers over a broken balcony on a green vine bridge. Anchors tear loose from damaged structures. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Vine Vault helps cross the closed greenhouse roofs to deliver evidence. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Vine Vault is used to build a high thorn walkway guarded by roots. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "step-gravity",
    "form": "step",
    "element": "gravity",
    "name": "Gravity Leap",
    "legacy": "spatial",
    "action": "Invert gravity briefly around the jumper",
    "cost": "The landing pulse sends unsecured objects flying",
    "training": "Gravity Leap lets the player invert gravity briefly around the jumper during training, but the landing pulse sends unsecured objects flying.",
    "limitation": "The landing pulse sends unsecured objects flying",
    "special_route": {
      "skill": "spatial",
      "trigger": "When a gravity-sensitive route appears, Gravity Leap can invert gravity briefly around the jumper.",
      "tradeoff": "The landing pulse sends unsecured objects flying"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Gravity Leap is used to carry an injured violinist to the terrace across an open shaft. The landing pulse sends unsecured objects flying. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Gravity Leap helps approach the roof antenna without using monitored staircases. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Gravity Leap is used to leap to the city shield control balcony ahead of elected officials. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-fire",
    "form": "weave",
    "element": "fire",
    "name": "Smokesmith",
    "legacy": "technopathy",
    "action": "Mold hot smoke into temporary physical rescue tools",
    "cost": "Tools disperse when ventilation starts",
    "training": "Smokesmith lets the player mold hot smoke into temporary physical rescue tools during training, but tools disperse when ventilation starts.",
    "limitation": "Tools disperse when ventilation starts",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a fire-sensitive route appears, Smokesmith can mold hot smoke into temporary physical rescue tools.",
      "tradeoff": "Tools disperse when ventilation starts"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Smokesmith is used to make a smoke ladder that collapses after the last evacuation. Tools disperse when ventilation starts. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Smokesmith helps trace the air ducts with a smoke marker the crowd can follow. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Smokesmith is used to build a smoke throne over the sealed command area. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-ice",
    "form": "weave",
    "element": "ice",
    "name": "Icewright",
    "legacy": "technopathy",
    "action": "Assemble clear ice into precise hinges and medical braces",
    "cost": "Ice tools melt and jam metal when the room warms",
    "training": "Icewright lets the player assemble clear ice into precise hinges and medical braces during training, but ice tools melt and jam metal when the room warms.",
    "limitation": "Ice tools melt and jam metal when the room warms",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a ice-sensitive route appears, Icewright can assemble clear ice into precise hinges and medical braces.",
      "tradeoff": "Ice tools melt and jam metal when the room warms"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Icewright is used to repair a broken door hinge long enough for families to exit. Ice tools melt and jam metal when the room warms. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Icewright helps cast a transparent copy of the hidden control key for the auditors. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Icewright is used to replace every metal access key with an ice copy that only the player can maintain. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-storm",
    "form": "weave",
    "element": "storm",
    "name": "Circuit Weaver",
    "legacy": "technopathy",
    "action": "Thread glowing conductors between unrelated machines",
    "cost": "One crossed wire can short a medical device",
    "training": "Circuit Weaver lets the player thread glowing conductors between unrelated machines during training, but one crossed wire can short a medical device.",
    "limitation": "One crossed wire can short a medical device",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a storm-sensitive route appears, Circuit Weaver can thread glowing conductors between unrelated machines.",
      "tradeoff": "One crossed wire can short a medical device"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Circuit Weaver is used to give every emergency beacon independent power during the attack. One crossed wire can short a medical device. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Circuit Weaver helps expose the illegal network by laying its wires across the ballroom floor. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Circuit Weaver is used to feed all civilian equipment through a controlled personal circuit. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-stone",
    "form": "weave",
    "element": "stone",
    "name": "Mason's Hand",
    "legacy": "technopathy",
    "action": "Knit loose rubble into arches, ramps and braces",
    "cost": "Stolen foundation stone weakens the remaining structure",
    "training": "Mason's Hand lets the player knit loose rubble into arches, ramps and braces during training, but stolen foundation stone weakens the remaining structure.",
    "limitation": "Stolen foundation stone weakens the remaining structure",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a stone-sensitive route appears, Mason's Hand can knit loose rubble into arches, ramps and braces.",
      "tradeoff": "Stolen foundation stone weakens the remaining structure"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Mason's Hand is used to build a strong exit ramp across the collapsed orchestra stage. Stolen foundation stone weakens the remaining structure. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Mason's Hand helps raise a public stair to the maintenance chamber hidden behind the dean's office. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Mason's Hand is used to wall off the damaged market beneath a fortress of stone. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-light",
    "form": "weave",
    "element": "light",
    "name": "Light Sculptor",
    "legacy": "technopathy",
    "action": "Create rigid translucent prisms from beams",
    "cost": "Prisms bend emergency signal lights in unsafe directions",
    "training": "Light Sculptor lets the player create rigid translucent prisms from beams during training, but prisms bend emergency signal lights in unsafe directions.",
    "limitation": "Prisms bend emergency signal lights in unsafe directions",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a light-sensitive route appears, Light Sculptor can create rigid translucent prisms from beams.",
      "tradeoff": "Prisms bend emergency signal lights in unsafe directions"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Light Sculptor is used to construct a temporary glowing bridge for the crowd. Prisms bend emergency signal lights in unsafe directions. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Light Sculptor helps project the antagonist's hidden circuitry in gold above the dance floor. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Light Sculptor is used to fill the ballroom with identical false images of the player. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-shadow",
    "form": "weave",
    "element": "shadow",
    "name": "Umbra Tailor",
    "legacy": "technopathy",
    "action": "Fold shadow into opaque flexible screens and straps",
    "cost": "Woven shadow hides injuries and removes visual cues",
    "training": "Umbra Tailor lets the player fold shadow into opaque flexible screens and straps during training, but woven shadow hides injuries and removes visual cues.",
    "limitation": "Woven shadow hides injuries and removes visual cues",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a shadow-sensitive route appears, Umbra Tailor can fold shadow into opaque flexible screens and straps.",
      "tradeoff": "Woven shadow hides injuries and removes visual cues"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Umbra Tailor is used to catch a falling guest in a wide indigo fabric net. Woven shadow hides injuries and removes visual cues. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Umbra Tailor helps cover security cameras while volunteers enter the locked staff corridor. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Umbra Tailor is used to bind every official in dark fabric until the command transfer is signed. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-bloom",
    "form": "weave",
    "element": "bloom",
    "name": "Root Architect",
    "legacy": "technopathy",
    "action": "Grow intricate vine scaffolds from buried seeds",
    "cost": "Roots may break water mains or crowd soil beneath buildings",
    "training": "Root Architect lets the player grow intricate vine scaffolds from buried seeds during training, but roots may break water mains or crowd soil beneath buildings.",
    "limitation": "Roots may break water mains or crowd soil beneath buildings",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a bloom-sensitive route appears, Root Architect can grow intricate vine scaffolds from buried seeds.",
      "tradeoff": "Roots may break water mains or crowd soil beneath buildings"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Root Architect is used to raise living support beams beneath the failing glass ceiling. Roots may break water mains or crowd soil beneath buildings. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Root Architect helps make a public pathway through the sealed greenhouse wall. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Root Architect is used to wall the academy in high thorn hedges to control entry. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "weave-gravity",
    "form": "weave",
    "element": "gravity",
    "name": "Mass Tether",
    "legacy": "technopathy",
    "action": "Connect two objects with a visible low-gravity band",
    "cost": "Linked masses can pull nearby people off their feet",
    "training": "Mass Tether lets the player connect two objects with a visible low-gravity band during training, but linked masses can pull nearby people off their feet.",
    "limitation": "Linked masses can pull nearby people off their feet",
    "special_route": {
      "skill": "technopathy",
      "trigger": "When a gravity-sensitive route appears, Mass Tether can connect two objects with a visible low-gravity band.",
      "tradeoff": "Linked masses can pull nearby people off their feet"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Mass Tether is used to tether the falling chandelier core to an empty loading dock. Linked masses can pull nearby people off their feet. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Mass Tether helps tie a hidden remote switch to the public hearing platform. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Mass Tether is used to attach every municipal shield lever to the player's single command chair. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-fire",
    "form": "beacon",
    "element": "fire",
    "name": "Hearth Signal",
    "legacy": "biotech",
    "action": "Send a steady wave of heat that nearby people can follow",
    "cost": "Warmth draws enemies and overheats fragile supplies",
    "training": "Hearth Signal lets the player send a steady wave of heat that nearby people can follow during training, but warmth draws enemies and overheats fragile supplies.",
    "limitation": "Warmth draws enemies and overheats fragile supplies",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a fire-sensitive route appears, Hearth Signal can send a steady wave of heat that nearby people can follow.",
      "tradeoff": "Warmth draws enemies and overheats fragile supplies"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Hearth Signal is used to guide guests through rain to the illuminated rescue boats. Warmth draws enemies and overheats fragile supplies. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Hearth Signal helps mark an ignored neighborhood as the safest gathering place. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Hearth Signal is used to keep every citizen in a warm controlled enclosure. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-ice",
    "form": "beacon",
    "element": "ice",
    "name": "Snow Lantern",
    "legacy": "biotech",
    "action": "Broadcast a cold glimmer that reveals dangerous surfaces",
    "cost": "Frost blankets the floor and slows people without insulated boots",
    "training": "Snow Lantern lets the player broadcast a cold glimmer that reveals dangerous surfaces during training, but frost blankets the floor and slows people without insulated boots.",
    "limitation": "Frost blankets the floor and slows people without insulated boots",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a ice-sensitive route appears, Snow Lantern can broadcast a cold glimmer that reveals dangerous surfaces.",
      "tradeoff": "Frost blankets the floor and slows people without insulated boots"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Snow Lantern is used to mark slick stair edges before injured dancers descend. Frost blankets the floor and slows people without insulated boots. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Snow Lantern helps reveal the hidden route by tracing breath in an unlit hallway. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Snow Lantern is used to freeze the fountain into a monument to the player's command. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-storm",
    "form": "beacon",
    "element": "storm",
    "name": "Storm Choir",
    "legacy": "biotech",
    "action": "Emit a rhythmic electric pulse audible through damaged radios",
    "cost": "The pulse may overwrite distress messages from other teams",
    "training": "Storm Choir lets the player emit a rhythmic electric pulse audible through damaged radios during training, but the pulse may overwrite distress messages from other teams.",
    "limitation": "The pulse may overwrite distress messages from other teams",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a storm-sensitive route appears, Storm Choir can emit a rhythmic electric pulse audible through damaged radios.",
      "tradeoff": "The pulse may overwrite distress messages from other teams"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Storm Choir is used to synchronize volunteer rescue lights across all remaining districts. The pulse may overwrite distress messages from other teams. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Storm Choir helps make each hijacked city relay sing the villain's location in turn. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Storm Choir is used to require every city transmitter to repeat the player's new laws. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-stone",
    "form": "beacon",
    "element": "stone",
    "name": "Standing Stone",
    "legacy": "biotech",
    "action": "Cause pillars to rise in a circular pattern around a location",
    "cost": "Pillars seal passages and strain the ground beneath nearby buildings",
    "training": "Standing Stone lets the player cause pillars to rise in a circular pattern around a location during training, but pillars seal passages and strain the ground beneath nearby buildings.",
    "limitation": "Pillars seal passages and strain the ground beneath nearby buildings",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a stone-sensitive route appears, Standing Stone can cause pillars to rise in a circular pattern around a location.",
      "tradeoff": "Pillars seal passages and strain the ground beneath nearby buildings"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Standing Stone is used to provide stable roof supports while guests evacuate. Pillars seal passages and strain the ground beneath nearby buildings. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Standing Stone helps raise the contractor's buried records to public view. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Standing Stone is used to build a stone ring that turns the academy into a guarded citadel. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-light",
    "form": "beacon",
    "element": "light",
    "name": "Dawn Choir",
    "legacy": "biotech",
    "action": "Send a bright pulsing light through a chain of volunteer mirrors",
    "cost": "The signal exposes people hiding from armed patrols",
    "training": "Dawn Choir lets the player send a bright pulsing light through a chain of volunteer mirrors during training, but the signal exposes people hiding from armed patrols.",
    "limitation": "The signal exposes people hiding from armed patrols",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a light-sensitive route appears, Dawn Choir can send a bright pulsing light through a chain of volunteer mirrors.",
      "tradeoff": "The signal exposes people hiding from armed patrols"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Dawn Choir is used to guide ferries safely through the harbor blackout. The signal exposes people hiding from armed patrols. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Dawn Choir helps project truthful evacuation instructions above the city skyline. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Dawn Choir is used to display the player's crest on every shield tower at dawn. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-shadow",
    "form": "beacon",
    "element": "shadow",
    "name": "Midnight Bell",
    "legacy": "biotech",
    "action": "Emit a low-frequency dark pulse that masks surveillance optics",
    "cost": "The darkness prevents the injured from spotting emergency signs",
    "training": "Midnight Bell lets the player emit a low-frequency dark pulse that masks surveillance optics during training, but the darkness prevents the injured from spotting emergency signs.",
    "limitation": "The darkness prevents the injured from spotting emergency signs",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a shadow-sensitive route appears, Midnight Bell can emit a low-frequency dark pulse that masks surveillance optics.",
      "tradeoff": "The darkness prevents the injured from spotting emergency signs"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Midnight Bell is used to keep guests out of the villain's camera lock while they retreat. The darkness prevents the injured from spotting emergency signs. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Midnight Bell helps interrupt surveillance long enough to publish the private control contract. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Midnight Bell is used to blanket the entire city in an ordered blackout. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-bloom",
    "form": "beacon",
    "element": "bloom",
    "name": "Bloom Chorus",
    "legacy": "biotech",
    "action": "Send a growth pulse through planted seeds in a neighborhood",
    "cost": "Pollen makes breathing difficult and roots tangle public utilities",
    "training": "Bloom Chorus lets the player send a growth pulse through planted seeds in a neighborhood during training, but pollen makes breathing difficult and roots tangle public utilities.",
    "limitation": "Pollen makes breathing difficult and roots tangle public utilities",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a bloom-sensitive route appears, Bloom Chorus can send a growth pulse through planted seeds in a neighborhood.",
      "tradeoff": "Pollen makes breathing difficult and roots tangle public utilities"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Bloom Chorus is used to grow a protective canopy above outdoor emergency cots. Pollen makes breathing difficult and roots tangle public utilities. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Bloom Chorus helps turn abandoned courtyards into independent food gardens. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Bloom Chorus is used to wrap municipal control towers in thick living vines. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  },
  {
    "id": "beacon-gravity",
    "form": "beacon",
    "element": "gravity",
    "name": "Gravity Well",
    "legacy": "biotech",
    "action": "Emit a broad mass-altering field around a chosen center",
    "cost": "People at the edge lose balance when the field changes",
    "training": "Gravity Well lets the player emit a broad mass-altering field around a chosen center during training, but people at the edge lose balance when the field changes.",
    "limitation": "People at the edge lose balance when the field changes",
    "special_route": {
      "skill": "biotech",
      "trigger": "When a gravity-sensitive route appears, Gravity Well can emit a broad mass-altering field around a chosen center.",
      "tradeoff": "People at the edge lose balance when the field changes"
    },
    "finales": {
      "shelter": "At the Prom of Doom, Gravity Well is used to keep debris hovering above evacuated streets until dawn. People at the edge lose balance when the field changes. The survivors remember the protection, and the repairs remain visible after graduation.",
      "unmask": "At the Prom of Doom, Gravity Well helps make the hidden antenna visible by bending scattered metal toward it. The academy's monopoly breaks, but the player must answer to the independent people now holding the evidence.",
      "claim": "At the Prom of Doom, Gravity Well is used to hold the city guards suspended around an unaccountable command post. The immediate catastrophe is contained at the cost of public trust; classmates decide whether to keep serving the new regime."
    }
  }
] as const

export type PowerFormId = (typeof POWER_FORMS)[number]['id']

export type PowerAffinityId = (typeof POWER_AFFINITIES)[number]['id']

export type PowerVowId = (typeof POWER_VOWS)[number]['id']

export type SignaturePowerId = (typeof SIGNATURE_POWERS)[number]['id']

export function signatureFor(form: PowerFormId, element: PowerAffinityId) {

  return SIGNATURE_POWERS.find(power => power.form === form && power.element === element)!

}

export function signatureById(id: string) {

  return SIGNATURE_POWERS.find(power => power.id === id)

}

