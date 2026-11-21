import { defineStore } from 'pinia'
import { useArtJobStore } from '~/stores/artJobStore'
import { useUserStore } from '~/stores/userStore'
import {
  OCTOBER_ART_RECEIPTS,
  octoberArtReceipt,
  type OctoberArtSlot,
} from '~/utils/cometAcademy/octoberArtReceipts'

/** Retrieve source art only through the authenticated ArtImage store. */
export const useOctoberCastArtStore = defineStore('octoberCastArt', () => {
  const artJobs = useArtJobStore()
  const user = useUserStore()

  async function loadFor(memberKey: string): Promise<void> {
    if (!user.isAdmin) return
    const finished = OCTOBER_ART_RECEIPTS.filter(
      (receipt) =>
        receipt.memberKey === memberKey &&
        receipt.status === 'DONE' &&
        receipt.artImageId !== null,
    )
    await Promise.all(
      finished.map(async (receipt) => {
        if (receipt.artImageId !== null)
          await artJobs.loadJobImage(receipt.artImageId)
      }),
    )
  }

  function imageFor(memberKey: string, slot: OctoberArtSlot): string | null {
    if (!user.isAdmin) return null
    const receipt = octoberArtReceipt(memberKey, slot)
    if (!receipt || receipt.status !== 'DONE' || !receipt.artImageId)
      return null
    return artJobs.imageSrcById[receipt.artImageId] || null
  }

  return { loadFor, imageFor }
})
