import { availableFollowers, createCampaign, dayAt } from './engine'
import { FOLLOWER_POOL, followerProfile, starterFollowers } from './followers'
import type { Campaign, Follower } from './types'

export const startEmperorCampaign = (seed: number): Campaign =>
  createCampaign(seed, starterFollowers())

export const remainingRecoveryDays = (
  campaign: Campaign,
  follower: Follower,
): number => Math.max(0, (follower.injuredUntilDay ?? 0) - dayAt(campaign.hour))

export const recruitmentStatus = (
  campaign: Campaign,
  followerId: string,
): { eligible: boolean; reason: string; cost: number } => {
  const profile = followerProfile(followerId)
  if (!profile || profile.starter) {
    return { eligible: false, reason: 'Not a recruitable candidate', cost: 0 }
  }
  if (campaign.followers.some((entry) => entry.id === profile.id)) {
    return {
      eligible: false,
      reason: 'Already enlisted or remembered in the court',
      cost: profile.recruitCost,
    }
  }
  if (dayAt(campaign.hour) < profile.earliestDay) {
    return {
      eligible: false,
      reason: `First appears on Day ${profile.earliestDay}`,
      cost: profile.recruitCost,
    }
  }
  const required = profile.requiredFlags.find(
    (flag) => !(campaign.flags ?? []).includes(flag),
  )
  if (required) {
    return {
      eligible: false,
      reason: 'Story allegiance not yet earned',
      cost: profile.recruitCost,
    }
  }
  if (campaign.prosperity < profile.recruitCost) {
    return {
      eligible: false,
      reason: 'Insufficient Prosperity',
      cost: profile.recruitCost,
    }
  }
  return { eligible: true, reason: 'May join after one day of travel', cost: profile.recruitCost }
}

export const recruitFollower = (
  campaign: Campaign,
  followerId: string,
): Campaign => {
  const status = recruitmentStatus(campaign, followerId)
  if (!status.eligible) throw new Error(status.reason)
  const profile = followerProfile(followerId)!
  return {
    ...campaign,
    prosperity: campaign.prosperity - profile.recruitCost,
    followers: [
      ...campaign.followers,
      {
        id: profile.id,
        name: profile.name,
        specialties: [...profile.specialties],
        stats: { ...profile.stats },
        availableOnDay: dayAt(campaign.hour) + 1,
      },
    ],
    log: [
      ...campaign.log,
      {
        hour: campaign.hour,
        incidentId: `recruit:${followerId}`,
        type: 'resolved',
        detail: `${profile.name} accepted a commission and will arrive tomorrow.`,
      },
    ],
  }
}

export const earnStoryFlag = (campaign: Campaign, flag: string): Campaign => {
  if (
    !/^[a-z][a-z0-9-]{1,79}$/.test(flag) ||
    (campaign.flags ?? []).length >= 500
  ) {
    throw new Error('Invalid story flag')
  }
  return {
    ...campaign,
    flags: [...new Set([...(campaign.flags ?? []), flag])],
  }
}

/**
 * A follower can only die through an explicitly authored, forewarned story event.
 * The fatal-risk flag must be earned beforehand; no random failure can call this.
 */
export const scriptedFollowerDeath = (
  campaign: Campaign,
  followerId: string,
  eventId: string,
  reason: string,
): Campaign => {
  if (
    !/^[a-z][a-z0-9-]{1,79}$/.test(eventId) ||
    !(campaign.flags ?? []).includes(`fatal-risk-${eventId}`) ||
    reason.trim().length < 15
  ) {
    throw new Error('Fatal danger must be authored and telegraphed')
  }
  const leader = campaign.followers.find((entry) => entry.id === followerId)
  if (!leader || leader.dead || campaign.memorials?.some((entry) => entry.incidentId === eventId)) {
    throw new Error('Cannot repeat an unearned death')
  }
  const next = campaign.followers.map((entry) =>
    entry.id === followerId ? { ...entry, dead: true } : entry,
  )
  return {
    ...campaign,
    followers: next,
    memorials: [
      ...(campaign.memorials ?? []),
      { followerId, incidentId: eventId, reason: reason.trim() },
    ],
    flags: (campaign.flags ?? []).filter((flag) => flag !== `fatal-risk-${eventId}`),
    log: [
      ...campaign.log,
      {
        hour: campaign.hour,
        incidentId: eventId,
        type: 'resolved',
        detail: `${leader.name} was lost: ${reason.trim()}`,
      },
    ],
  }
}

export const recruitedLeaders = (campaign: Campaign): Follower[] =>
  campaign.followers.filter((follower) => !follower.dead)

export const eligibleLeaders = availableFollowers

export const remainingCandidates = (campaign: Campaign) =>
  FOLLOWER_POOL.filter(
    (entry) => !entry.starter && !campaign.followers.some((follower) => follower.id === entry.id),
  )
