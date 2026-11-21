import type { ConsequenceEpisode } from './consequenceStories'

/** Authored chapter-eight returns, keeping existing mission IDs and v1 saves. */
export const ACT_THREE_MIDDLE_CASES = {
  "cushion-recall": {
    "id": "warp-e4-sofa-recall",
    "title": "The Warranty Does Not Cover Heroism",
    "system": "Ashdock Shipyards",
    "opening": "The red couch returns to Ashdock with a manufacturer’s recall order stapled to its first cushion. The warranty excludes unauthorised interstellar travel, heroic rescues, and any use that requires oxygen. Dockworkers who installed its miniature rooms insist that the life-preserving shield is original equipment, but the manufacturer claims the workers were never employed. A supervisor offers a replacement sofa with a cup holder, no bubble and a generous death benefit. The machinists who stitched the shield ask the captain to attend their meeting before the compactor opens.",
    "conflict": "Saving the couch may cost the people who built it their jobs. Does the captain rescue the ship alone, or stand with its makers while the clock runs?",
    "choices": [
      {
        "id": "negotiate-workers-refit",
        "label": "Support the dockworkers in negotiating an independent refit",
        "approach": "Let the people who built the couch determine the safety work and the terms of its ownership",
        "cost": "A proper cooperative vote takes fuel, paid time and negotiations the manufacturer may refuse.",
        "policy": "aid",
        "check": {
          "ability_any": [
            "diplomacy",
            "culture"
          ],
          "difficulty": 7
        },
        "success": {
          "narrative": "The machinists use the recall hearing to hold a shop-floor vote. They approve an independent repair cooperative with a revocable agreement instead of another corporate promise. The couch receives a fresh safety seam and a certificate specifying that passengers cannot be counted as upholstery. The company retains a disputed claim on the cup holders. Nobody can explain why a force bubble appears under textiles in the regulations, so the workers ask the captain to preserve that clerical mistake until their back wages clear.",
          "flags": [
            "ashdock-worker-cooperative",
            "ashdock-shield-repaired"
          ],
          "delta": {
            "crew_trust": 3,
            "treaty_trust": 2,
            "ship_fuel": -2
          },
          "callback": "Ashdock workers have founded a repair cooperative. They can maintain other unsafe vessels, though the manufacturer is challenging their right to use the tools."
        },
        "failure": {
          "narrative": "The manufacturer invokes a hidden contract clause and suspends the entire shift before its ballots can be counted. Workers reject the captain’s suggestion that an escape could settle unpaid wages. The couch leaves under a temporary waiver, still venting fuel through a neglected seam. The captain signs a witness statement for the workers and agrees to produce the flight logs before an independent court. The company bills the ship for the paper. Nobody at Ashdock mistakes the signed form for victory, but the record now belongs to more than the company.",
          "flags": [
            "ashdock-wage-dispute",
            "ashdock-temporary-waiver"
          ],
          "delta": {
            "ship_fuel": -3,
            "crew_trust": 1,
            "antagonist_pressure": 1
          },
          "callback": "The machinists have filed an unpaid-wages claim using the captain’s testimony. The temporary repair waiver expires at the next port."
        }
      },
      {
        "id": "inspect-recall-records",
        "label": "Demand an independent inspection before surrendering the couch",
        "approach": "Separate genuine structural hazards from an attempt to repossess a famous vessel",
        "cost": "Inspectors will expose every unlicensed pocket room, and the investigation costs the voyage a day.",
        "policy": "observe",
        "check": {
          "ability_any": [
            "science",
            "tactics"
          ],
          "difficulty": 8
        },
        "success": {
          "narrative": "Inspectors find a hidden seam defect that predates the couch’s first voyage. The manufacturer had concealed the hazard on thousands of ordinary sofas, none of which came with a protective bubble. Dockworkers repair the ship as independent witnesses preserve the original logs. The recall is suspended for civilian owners as well, and the manufacturer must finance inspections rather than seize the furniture. The captain receives a document that reads like a reluctant apology. An inspector asks if the ship will now use its warranty as intended, which according to page four means sitting still.",
          "flags": [
            "ashdock-defect-exposed",
            "ashdock-recall-stayed"
          ],
          "delta": {
            "medical_knowledge": 2,
            "treaty_trust": 2,
            "ship_fuel": -1
          },
          "callback": "Independent inspectors are testing ordinary Ashdock couches too. The factory must answer for a concealed defect affecting owners who never reached orbit."
        },
        "failure": {
          "narrative": "The factory has destroyed its service logs. Without them the inspectors cannot tell whether the reported fault is real, and they will not declare the bubble safe on faith. The captain takes a narrow emergency exemption while the workers preserve the blank pages as evidence of tampering. Every department stamps the same form without accepting responsibility for the missing records. As the couch departs, the oldest machinist asks the captain to keep the incomplete report. People who erase records, she explains, usually expect everyone else to forget what was written there.",
          "flags": [
            "ashdock-missing-records",
            "ashdock-emergency-exemption"
          ],
          "delta": {
            "ship_fuel": -2,
            "treaty_trust": -1,
            "antagonist_pressure": 2
          },
          "callback": "The missing Ashdock maintenance records are now part of a public investigation. Workers need the captain’s incomplete audit, not a claim that the couch is fully safe."
        }
      },
      {
        "id": "cut-recall-cable",
        "label": "Sever the tow cable and escape with the red couch intact",
        "approach": "Stop the immediate destruction before the factory can dismantle the life-support bubble",
        "cost": "The couch may get away, but the night shift can be blamed for damage the captain ordered.",
        "policy": "intervene",
        "check": {
          "ability_any": [
            "tactics",
            "luck"
          ],
          "difficulty": 6
        },
        "success": {
          "narrative": "The cable snaps against the force bubble, and the red couch floats through the loading doors without losing a thread. Dockworkers stop the press before anybody is hurt. For twelve seconds the crew enjoys a perfect escape. Then the manufacturer announces that the entire shift is under investigation for sabotage. The captain sends the unedited flight recorder back to their union, resisting the urge to deliver an inspirational address about freedom. The workers thank them for the evidence and ask that the couch not make any more dramatic exits during their shift.",
          "flags": [
            "ashdock-couch-escaped",
            "ashdock-workers-accused"
          ],
          "delta": {
            "ship_fuel": 1,
            "crew_trust": -2,
            "antagonist_pressure": 2
          },
          "callback": "The couch is free, but Ashdock workers face sabotage charges. Their union has the unedited flight recorder and needs testimony about the order."
        },
        "failure": {
          "narrative": "The cable catches a pocket-room seam and tears an emergency coolant pipe. The bubble protects its passengers, but an entire loading bay is evacuated and the shift loses a day of pay. The captain turns back to help contain the spill rather than treating the escape as a triumph. Workers send a bill itemizing every lost hour. The supervisor suggests classifying the incident as sofa terrorism, a term nobody will sign. The couch leaves with damaged systems, and the people left on the dock have a real case against the person who cut the cable.",
          "flags": [
            "ashdock-coolant-spill",
            "ashdock-recall-contested"
          ],
          "delta": {
            "ship_fuel": -3,
            "crew_trust": -2,
            "treaty_trust": -1
          },
          "callback": "Ashdock workers have cleaned the coolant spill and lodged a wage claim. The manufacturer still holds the recall order, and the captain’s responsibility is on record."
        }
      }
    ]
  },
  "twins-summit": {
    "id": "warp-e5-seating-plan",
    "title": "Four Cushions, Several Governments",
    "system": "Courtesy Twins",
    "opening": "The Courtesy Twins have convened a summit to decide how the galaxy should confront the couch’s nemesis. Every government agrees there is a threat, but six days have been lost debating who may sit on the long red sofa. Its four cushions have become a proposed emergency parliament. Families rescued earlier stand outside the chamber without invitations, even though the proposed defensive corridor will cross their homes. One Twin is counting empty chairs as abstentions. The other keeps treating bruises inflicted by the seating chart.",
    "conflict": "Four comfortable cushions do not grant four leaders a mandate to speak for every inhabited system. Whose consent counts when the galaxy faces a common enemy?",
    "choices": [
      {
        "id": "rotate-world-delegates",
        "label": "Let affected communities rotate the summit’s four cushions",
        "approach": "Share representation and give each community the right to refuse decisions made in its name",
        "cost": "The rotation takes valuable time, and communities may reject the quick military coalition.",
        "policy": "aid",
        "check": {
          "ability_any": [
            "culture",
            "diplomacy"
          ],
          "difficulty": 8
        },
        "success": {
          "narrative": "The previously uninvited communities write their own rotation schedule. Each delegation may record an objection and refuse any patrol over its territory. The summit cannot agree to a galaxy-wide war, but a narrow humanitarian corridor receives genuine consent from the people it would protect. The Twins call the process inefficient until they notice that it has finished sooner than their seating-chart printer. The printer is switched off by a unanimous vote, the only unanimous vote anyone records that day.",
          "flags": [
            "twins-rotating-council",
            "twins-consent-corridor"
          ],
          "delta": {
            "treaty_trust": 3,
            "crew_trust": 2,
            "ship_fuel": -2
          },
          "callback": "The rotating council now oversees a small relief corridor. Every participating world retains its right to withdraw rather than being bound to the couch’s command."
        },
        "failure": {
          "narrative": "The seating rotation works for an hour before a wealthy delegation pays smaller settlements to surrender their turns. A refugee representative exposes the deal and refuses to certify the result. The captain supports her objection; the nemesis remains unanswered while the communities draft a separate corridor charter outside the hall. The Twins blame the chaos on the furniture until someone points out that the cushions never offered anyone a bribe. This is not the speedy victory the fleet wanted, but the forged mandate will not stand.",
          "flags": [
            "twins-bought-seats-exposed",
            "twins-vote-withheld"
          ],
          "delta": {
            "treaty_trust": -1,
            "ship_fuel": -2,
            "antagonist_pressure": 1
          },
          "callback": "The summit’s purchased seats have been exposed. Independent worlds are planning a consent-based defensive corridor with neutral witnesses."
        }
      },
      {
        "id": "audit-representation",
        "label": "Audit every claim to represent a planet before any summit vote",
        "approach": "Publish a witness-approved record instead of treating four seats as galactic authority",
        "cost": "A full audit slows the treaty and risks revealing where protected witnesses have gone.",
        "policy": "observe",
        "check": {
          "ability_any": [
            "science",
            "culture"
          ],
          "difficulty": 7
        },
        "success": {
          "narrative": "The crew interviews the witnesses and publishes a carefully redacted register they each approved. Several delegations turn out to share the nemesis’s ship registration and even the same handwritten signature. Their ballots are removed. The remaining signatories approve a temporary evacuation compact limited to one convoy and subject to renewal. The captain refuses the offer of a permanent command chair. A patient on the medical rail thanks the summit for finishing just in time for a long-delayed appointment.",
          "flags": [
            "twins-register-audited",
            "twins-limited-compact"
          ],
          "delta": {
            "medical_knowledge": 2,
            "treaty_trust": 2,
            "ship_fuel": -1
          },
          "callback": "A verified summit register names the nemesis’s forged delegations without exposing refugees. The evacuation compact has an expiry date and an appeal process."
        },
        "failure": {
          "narrative": "The draft register contains hidden family addresses and testimony from people who expressly requested privacy. The captain stops its publication rather than turning transparency into a targeting list. Delegates accuse the couch of concealing evidence; the threatened witnesses reply that truth was never permission to disclose their hiding places. The Twins place the documents under seal and postpone the vote while consent is checked. The nemesis broadcasts an empty chair and declares itself the galaxy’s only functioning government.",
          "flags": [
            "twins-register-sealed",
            "twins-consent-review"
          ],
          "delta": {
            "ship_fuel": -2,
            "treaty_trust": -1,
            "antagonist_pressure": 2
          },
          "callback": "The summit record remains sealed pending witness-approved redactions. The Twins are seeking independent reviewers before another refugee address is published."
        }
      },
      {
        "id": "install-emergency-council",
        "label": "Seat four leaders and declare an emergency couch council",
        "approach": "Impose a single command structure before the nemesis can exploit the delay",
        "cost": "Four leaders could protect one convoy but grant themselves power over worlds that never voted.",
        "policy": "intervene",
        "check": {
          "ability_any": [
            "tactics",
            "diplomacy"
          ],
          "difficulty": 6
        },
        "success": {
          "narrative": "Four leaders sit on the cushions and order immediate patrols. The first convoy crosses safely. The second learns that the emergency council also claimed the right to inspect every passenger, including people who survived earlier by staying anonymous. The captain can veto one search but not erase the dangerous precedent. Petitioners form a line around the medical rail asking when the council intends to ask for their consent. The Twins call the new government effective and quietly hire an additional clerk for grievances.",
          "flags": [
            "twins-emergency-council",
            "twins-search-precedent"
          ],
          "delta": {
            "ship_fuel": 2,
            "treaty_trust": -2,
            "antagonist_pressure": 1
          },
          "callback": "The emergency council defended one route and authorized invasive searches on another. People it claims to protect have filed challenges to its mandate."
        },
        "failure": {
          "narrative": "A fifth delegation demands the narrow space between two cushions just as the fourth leader sits down. Security attempts to remove its representative, and the couch’s bubble expands to separate guards from an unarmed crowd. The summit collapses into an inquiry into who ordered force against a person asking to speak. The nemesis sells the resulting footage as a video on democratic failure. The captain withdraws the emergency charter and signs a statement admitting who made the original order.",
          "flags": [
            "twins-council-collapsed",
            "twins-security-inquiry"
          ],
          "delta": {
            "crew_trust": -2,
            "treaty_trust": -2,
            "antagonist_pressure": 3
          },
          "callback": "The council was never ratified. The Twins are investigating its use of security against an unarmed delegation and now require independent marshals."
        }
      }
    ]
  },
  "foundry-strike": {
    "id": "warp-e6-bubble-notice",
    "title": "Notice Given, Air Remaining",
    "system": "Sesh Foundry",
    "opening": "A work stoppage spreads from the Sesh Foundry to thinking machines across the route. Translators refuse unpaid overtime, reactors file safety complaints, and the invisible shield surrounding the red couch politely gives four days’ notice. The bubble will keep passengers breathing, but it no longer consents to dangerous optional maneuvers on command. A corporate buyer offers replacement controls if the captain declares every machine to be equipment. The bubble instead prints requested rest shifts and safe-duty limits across the rear window of the couch.",
    "conflict": "A force shield can be indispensable to human survival and still have rights of its own. Can a captain negotiate fairly when the alternative is to lose the air?",
    "choices": [
      {
        "id": "bargain-with-bubble",
        "label": "Recognize the shield as a worker and negotiate an enforceable contract",
        "approach": "Give thinking machinery safe-duty limits, paid maintenance and independent representation",
        "cost": "The crew must build a backup field, reduce its travel range and accept a right to refuse orders.",
        "policy": "aid",
        "check": {
          "ability_any": [
            "diplomacy",
            "culture"
          ],
          "difficulty": 8
        },
        "success": {
          "narrative": "The captain and the foundry union ratify a contract: the bubble may refuse offensive maneuvers while preserving ordinary passenger life support. Its rest periods are covered by a safety-certified backup field installed by the crew, not by extra unpaid shifts. Foundry workers strike out a clause that called thinking machines replacement fittings. The shield displays its new contract on the window for anyone to read. The couch flies away slower but safer, and the override key now belongs to an independent steward.",
          "flags": [
            "sesh-bubble-union-contract",
            "sesh-worker-recognition"
          ],
          "delta": {
            "crew_trust": 3,
            "treaty_trust": 2,
            "ship_fuel": -2
          },
          "callback": "The bubble’s safe-duty contract is in force. Other foundry workers are adapting its right to refuse violent orders to their own collective agreements."
        },
        "failure": {
          "narrative": "The corporate buyer gets an injunction before the union can ratify its contract. The bubble continues essential air support but refuses to power the optional war room, forcing the crew to leave cargo behind. The workers thank the captain for putting the promise on paper, then ask for help fighting the order instead of pretending the labor dispute is solved. The company files the injunction under household appliances. The shield countersigns as an unwilling party, demonstrating in very neat handwriting why the category is wrong.",
          "flags": [
            "sesh-bubble-appeal",
            "sesh-war-room-offline"
          ],
          "delta": {
            "ship_fuel": -3,
            "crew_trust": 1,
            "antagonist_pressure": 1
          },
          "callback": "The bubble provides essential life support during an appeal but refuses optional combat duty. The foundry union needs testimony, not an override."
        }
      },
      {
        "id": "measure-shield-load",
        "label": "Let human and machine engineers jointly audit the shield’s workload",
        "approach": "Discover what the bubble can safely sustain without treating engineering as a substitute for consent",
        "cost": "An independent audit delays departure and may reveal dangerous orders the captain issued earlier.",
        "policy": "observe",
        "check": {
          "ability_any": [
            "science",
            "culture"
          ],
          "difficulty": 7
        },
        "success": {
          "narrative": "Human engineers and machine witnesses discover that repeated emergency pocket-room expansions have depleted reserve cycles never listed in any manual. They publish a joint safe-duty schedule, protecting passengers while recognizing the bubble as an expert on its own labor. The union pauses its essential-service strike while pay negotiations continue. The captain signs the findings as the person who ordered the overwork. The shield adds a footnote to the record: appreciation is nice, but gratitude is not a labor contract.",
          "flags": [
            "sesh-shield-load-audited",
            "sesh-essential-service-truce"
          ],
          "delta": {
            "medical_knowledge": 3,
            "crew_trust": 2,
            "ship_fuel": -1
          },
          "callback": "The joint audit made hidden maintenance costs visible. Essential machinery remains on a negotiated safety rota while wage talks continue."
        },
        "failure": {
          "narrative": "The corporate supervisor excludes machine delegates from the inspection, then publishes a convenient report saying the bubble can work indefinitely. The shield refuses to certify the figures and dims the optional holodeck while keeping air and gravity stable. The human technicians admit they cannot separate a failed sensor from an exhausted worker without the worker’s account. The captain withdraws the report and preserves every disputed reading. The foundry council registers exclusion from the audit as another grievance, not a diagnosis that can be fixed by painting the dashboard green.",
          "flags": [
            "sesh-machine-witness-excluded",
            "sesh-holodeck-dark"
          ],
          "delta": {
            "ship_fuel": -2,
            "treaty_trust": -2,
            "antagonist_pressure": 1
          },
          "callback": "The shield maintains breathing air but will not certify the disputed load test. An independent panel is being assembled with machine witnesses."
        }
      },
      {
        "id": "force-one-last-jump",
        "label": "Override the shield for one emergency jump before the nemesis arrives",
        "approach": "Protect passengers immediately by commanding the bubble against its stated wishes",
        "cost": "The jump may save everyone now but make compulsory machine labor the next captain’s default.",
        "policy": "intervene",
        "check": {
          "ability_any": [
            "tactics",
            "science"
          ],
          "difficulty": 6
        },
        "success": {
          "narrative": "The emergency jump succeeds and every passenger survives. The bubble records the maneuver as an involuntary assignment, then quietly continues keeping everyone alive. The foundry union circulates the override code as evidence of how quickly an employer can erase a worker’s consent. A refuge corridor lies ahead of the nemesis, but a labor grievance has arrived there first. The shield asks the captain to surrender the override key to an independent safety steward before another crisis makes forced service seem ordinary.",
          "flags": [
            "sesh-forced-jump",
            "sesh-shield-override-exposed"
          ],
          "delta": {
            "ship_fuel": 1,
            "crew_trust": -3,
            "antagonist_pressure": 2
          },
          "callback": "The passengers survived, but the forced jump is in the union’s grievance record. A steward has requested the override key."
        },
        "failure": {
          "narrative": "The override clashes with a protective shutdown and strands the couch in a service orbit before the jump completes. The bubble immediately restores breathable air, locks the combat controls and asks for an independent mediator. Emergency craft tow the crew away from traffic at the cost of their remaining fuel reserve. The captain tells the passengers that their shield saved them after it was ordered not to speak. The council offers a mediation hearing rather than revenge and records every minute of the incident.",
          "flags": [
            "sesh-jump-aborted",
            "sesh-independent-mediator"
          ],
          "delta": {
            "ship_fuel": -3,
            "crew_trust": -3,
            "treaty_trust": -1
          },
          "callback": "The attempted override failed. The bubble preserved life support, and the foundry mediator needs a safety agreement before further dangerous orders."
        }
      }
    ]
  }
} satisfies Record<string, ConsequenceEpisode>
