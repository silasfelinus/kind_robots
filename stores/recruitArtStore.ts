import { defineStore } from 'pinia'
import { useArtJobStore } from '~/stores/artJobStore'
import { useUserStore } from '~/stores/userStore'
import {
  RECRUIT_ART_RECEIPTS,
  recruitArtReceipt,
  type RecruitArtSlot,
} from '~/utils/cometAcademy/recruitArtReceipts'

/** Private recruit pictures are inspectable by admins, never served as public URLs. */
export const useRecruitArtStore = defineStore('recruitArt', () => {
  const artJobs = useArtJobStore()
  const user = useUserStore()

  async function loadAll(): Promise<void> {
    if (!user.isAdmin) return
    const imageIds = Object.values(RECRUIT_ART_RECEIPTS).flatMap((slots) =>
      Object.values(slots).flatMap((receipt) =>
        receipt ? [receipt.artImageId] : [],
      ),
    )
    await Promise.all(imageIds.map((id) => artJobs.loadJobImage(id)))
  }

  function imageFor(id: string, slot: RecruitArtSlot): string | null {
    if (!user.isAdmin) return null
    const receipt = recruitArtReceipt(id, slot)
    return receipt ? artJobs.imageSrcById[receipt.artImageId] || null : null
  }

  return { loadAll, imageFor }
})
