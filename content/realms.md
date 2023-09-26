---
title: Realms
subtitle: Explore the creative infinite
description: Exlore the ever expanding locations of Weirdlandia, or create your own
layout: dashboard
image: realms1.png
gallery: fantasycore
tags: ['home']
icon: line-md:home-md-twotone
status: weird
tooltip: When my 11-year-old suggested "just horse guts and human guts, I realized I'd just scratched the surface of awful hybrid ideas
sort: text
underConstruction: text
---

Realms: (TBD)
name=The Island of Reverse Hybrids
pitch= A junkyard for hybrids that weren't deemed aesthetic enough for fairy tales. fish-headed mermaids, a centaur whose horse legs + human legs, and other oddities!
path='/island'

Routes (concept)
generate-realms
generate-story
generate-characters
realm-selector
enter-weirdlandia

type Realm { name: string, pitch: string }
Animal Farm: All messages are turned into animal noises.
Serendipity Space Bar: NPC Chat
The Void: Customizable chat
AMI's Sanctuary: Chat with AMI - The Hyperkinetic Butterfly trying to stop malaria
Acrocat Ranch: Home of the Acrocat Pokestop and Acrocat Foster Kitten Rescue, in the beautiful California northcoast.
Bot Cafe: Chat with our friendly Kind Robots
Ogre Chat: WHY ARE WE YELLING?!?

type Character { name: string, description: string, personality: string, quote: string, special: string}
