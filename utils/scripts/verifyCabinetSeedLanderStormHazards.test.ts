// Seed Lander depth pass, slice 4 (conductor kr-arcade/t-072): Storm Shelf's free-standing lightning
// clouds and the rain that wets the pod and weighs it down.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderStormHazards.test.ts
import assert from 'node:assert/strict'
import {
  STORM,
  boltHits,
  soakStep,
  stormCloudAt,
} from '../arcade/seedLander/hazards'
import { ISLANDS } from '../arcade/seedLander/islands'

const cloud = { x: 100, y: 40, every: 300, offset: 0 }

// The cloud rests, crackles for 1.5 s (the tell), then strikes, on a fixed cycle.
const rest = cloud.every - STORM.charge - STORM.strike
assert.equal(stormCloudAt(cloud, 0).state, 'rest')
assert.equal(stormCloudAt(cloud, rest).state, 'charge')
assert.equal(stormCloudAt(cloud, rest + STORM.charge).state, 'strike')
assert.equal(stormCloudAt(cloud, cloud.every).state, 'rest')
assert.equal(STORM.charge, 90)

// The bolt only hits the column below a striking cloud.
const strike = rest + STORM.charge
assert.ok(boltHits(cloud, strike, 100, 120))
assert.ok(!boltHits(cloud, strike, 130, 120), 'beside the column is safe')
assert.ok(!boltHits(cloud, strike, 100, 20), 'above the cloud is safe')
assert.ok(!boltHits(cloud, 0, 100, 120), 'a resting cloud does not strike')

// Rain soaks a flying pod to full weight and a pad dries it off.
let wet = 0
for (let i = 0; i < 1000; i++) wet = soakStep(wet, true)
assert.equal(wet, 1)
for (let i = 0; i < 200; i++) wet = soakStep(wet, false)
assert.equal(wet, 0)

// Storm Shelf uses them, and nothing off the island does by accident.
const storm = ISLANDS.find((i) => i.id === 'storm')!
assert.ok(storm.missions.some((m) => m.rain && m.clouds?.length))
const moon = ISLANDS.find((i) => i.id === 'moon')!
assert.ok(moon.missions.every((m) => !m.rain && !m.clouds?.length))

console.log('seed lander storm hazards ok')
