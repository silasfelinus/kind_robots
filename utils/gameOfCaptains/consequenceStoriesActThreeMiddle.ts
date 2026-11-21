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
  }
} satisfies Record<string, ConsequenceEpisode>
