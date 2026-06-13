// /stores/friendStore.ts
//
// Owns user-to-user relationships for Kind Robots, backed by the UserRelation
// table (see schema-user-relations.prisma). Covers FRIEND, BLOCK, PARENT,
// CHILD, and REFEREE links.
//
// Request model: every relation except BLOCK is created as a PENDING request
// that the other user confirms or rejects. On accept, the server creates the
// inverse row (PARENT⇄CHILD, FRIEND⇄FRIEND) so both users own their side.
//
// "Received" = rows where I'm relatedUserId and status is PENDING — i.e.
// requests waiting on my confirmation. "Sent" = my PENDING rows.
//
// API:
//   GET    /api/relations            -> all relations touching me
//   POST   /api/relations            -> { relatedUserId, type, note? }  (PENDING, or ACCEPTED for BLOCK)
//   PATCH  /api/relations/:id        -> { status: 'ACCEPTED' }          (confirm a received request)
//   DELETE /api/relations/:id        -> reject / cancel / remove (clears both halves)

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'

export type RelationType = 'FRIEND' | 'BLOCK' | 'PARENT' | 'CHILD' | 'REFEREE'
export type RelationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export type UserRelation = {
  id: number
  userId: number
  relatedUserId: number
  type: RelationType
  status: RelationStatus
  note?: string | null
  pairId?: number | null
  createdAt?: string | Date
  updatedAt?: string | Date | null
}

export const useFriendStore = defineStore('friendStore', () => {
  const userStore = useUserStore()

  const relations = ref<UserRelation[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const isSaving = ref(false)

  const meId = computed(() => userStore.user?.id ?? null)

  const ownedRelations = computed(() =>
    relations.value.filter((r) => r.userId === meId.value),
  )
  const receivedRelations = computed(() =>
    relations.value.filter((r) => r.relatedUserId === meId.value),
  )

  // ── Generic, per-type selectors ───────────────────────────────────────────
  // Accepted relations of a type, returning the *other* user's id.
  function acceptedOfType(type: RelationType): number[] {
    return ownedRelations.value
      .filter((r) => r.type === type && r.status === 'ACCEPTED')
      .map((r) => r.relatedUserId)
  }
  // Requests of a type I sent, still pending.
  function sentOfType(type: RelationType): number[] {
    return ownedRelations.value
      .filter((r) => r.type === type && r.status === 'PENDING')
      .map((r) => r.relatedUserId)
  }
  // Requests of a type aimed at me, awaiting my confirmation.
  function receivedOfType(type: RelationType): number[] {
    return receivedRelations.value
      .filter((r) => r.type === type && r.status === 'PENDING')
      .map((r) => r.userId)
  }

  // ── Friend conveniences (back-compat with friend-gallery.vue) ─────────────
  const friendIds = computed(() => acceptedOfType('FRIEND'))
  const outgoingIds = computed(() => sentOfType('FRIEND'))
  const incomingIds = computed(() => receivedOfType('FRIEND'))
  const blockedIds = computed(() =>
    ownedRelations.value
      .filter((r) => r.type === 'BLOCK')
      .map((r) => r.relatedUserId),
  )
  const childIds = computed(() => acceptedOfType('PARENT')) // my children
  const parentIds = computed(() => acceptedOfType('CHILD')) // my parents
  const refereeingIds = computed(() => acceptedOfType('REFEREE'))

  // Every pending request aimed at me, across all types — for a unified inbox.
  const allIncomingRequests = computed(() =>
    receivedRelations.value.filter(
      (r) => r.status === 'PENDING' && r.type !== 'BLOCK',
    ),
  )

  const friendCount = computed(() => friendIds.value.length)
  const incomingCount = computed(() => incomingIds.value.length)
  const incomingRequestCount = computed(() => allIncomingRequests.value.length)

  // ── Queries ──────────────────────────────────────────────────────────────
  function isFriend(userId: number): boolean {
    return friendIds.value.includes(userId)
  }
  function hasOutgoingRequest(userId: number): boolean {
    return outgoingIds.value.includes(userId)
  }
  function hasIncomingRequest(userId: number): boolean {
    return incomingIds.value.includes(userId)
  }
  function isBlocked(userId: number): boolean {
    return blockedIds.value.includes(userId)
  }
  function relationship(
    userId: number,
  ): 'friend' | 'outgoing' | 'incoming' | 'blocked' | 'none' {
    if (isBlocked(userId)) return 'blocked'
    if (isFriend(userId)) return 'friend'
    if (hasIncomingRequest(userId)) return 'incoming'
    if (hasOutgoingRequest(userId)) return 'outgoing'
    return 'none'
  }

  // The pending request row aimed at me from a given user, of a given type.
  function findReceivedRequest(
    fromUserId: number,
    type: RelationType,
  ): UserRelation | undefined {
    return relations.value.find(
      (r) =>
        r.type === type &&
        r.status === 'PENDING' &&
        r.userId === fromUserId &&
        r.relatedUserId === meId.value,
    )
  }
  // A row I own toward a user, of a given type (pending or accepted).
  function findOwnedRelation(
    userId: number,
    type: RelationType,
  ): UserRelation | undefined {
    return relations.value.find(
      (r) =>
        r.type === type &&
        r.userId === meId.value &&
        r.relatedUserId === userId,
    )
  }

  // ── Persistence helpers ────────────────────────────────────────────────────
  function upsertLocal(relation: UserRelation): void {
    const i = relations.value.findIndex((r) => r.id === relation.id)
    if (i === -1) relations.value.push(relation)
    else relations.value.splice(i, 1, relation)
  }
  function removeLocal(id: number): void {
    relations.value = relations.value.filter(
      (r) => r.id !== id && r.pairId !== id,
    )
  }

  // ── Generic actions ────────────────────────────────────────────────────────
  // Send (or, for BLOCK, immediately apply) a relation request of any type.
  async function requestRelation(
    relatedUserId: number,
    type: RelationType,
    note?: string,
  ): Promise<UserRelation | null> {
    if (!meId.value || relatedUserId === meId.value) return null
    isSaving.value = true
    try {
      const res = await performFetch<UserRelation>('/api/relations', {
        method: 'POST',
        body: JSON.stringify({ relatedUserId, type, note }),
      })
      if (res.success && res.data) {
        upsertLocal(res.data)
        // An auto-accept (target had a matching pending request) may have
        // created an inverse row server-side — reload to pick it up.
        if ((res as { pairCreated?: boolean }).pairCreated) await load(true)
        return res.data
      }
      throw new Error(res.message || 'Failed to create relation')
    } catch (error) {
      handleError(error, 'requestRelation')
      return null
    } finally {
      isSaving.value = false
    }
  }

  // Confirm a received request (by the requester's id + type, or by row id).
  async function acceptRequest(rowId: number): Promise<void> {
    isSaving.value = true
    try {
      const res = await performFetch<UserRelation>(`/api/relations/${rowId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACCEPTED' }),
      })
      if (res.success) await load(true) // pull both halves of the new pair
    } catch (error) {
      handleError(error, 'acceptRequest')
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRelation(id: number): Promise<void> {
    isSaving.value = true
    try {
      const res = await performFetch(`/api/relations/${id}`, {
        method: 'DELETE',
      })
      if (res.success) removeLocal(id)
    } catch (error) {
      handleError(error, 'deleteRelation')
    } finally {
      isSaving.value = false
    }
  }

  // ── Friend wrappers (unchanged surface for friend-gallery.vue) ────────────
  async function sendFriendRequest(userId: number): Promise<void> {
    if (!userId || userId === meId.value) return
    if (isFriend(userId) || hasOutgoingRequest(userId)) return
    if (hasIncomingRequest(userId)) {
      await acceptFriendRequest(userId)
      return
    }
    await requestRelation(userId, 'FRIEND')
  }
  async function cancelFriendRequest(userId: number): Promise<void> {
    const row = findOwnedRelation(userId, 'FRIEND')
    if (row && row.status === 'PENDING') await deleteRelation(row.id)
  }
  async function acceptFriendRequest(userId: number): Promise<void> {
    const row = findReceivedRequest(userId, 'FRIEND')
    if (row) await acceptRequest(row.id)
  }
  async function declineFriendRequest(userId: number): Promise<void> {
    const row = findReceivedRequest(userId, 'FRIEND')
    if (row) await deleteRelation(row.id)
  }
  async function removeFriend(userId: number): Promise<void> {
    const row = findOwnedRelation(userId, 'FRIEND')
    if (row) await deleteRelation(row.id)
  }

  // ── Block (immediate, no request) ──────────────────────────────────────────
  async function blockUser(userId: number): Promise<void> {
    const friendRow = findOwnedRelation(userId, 'FRIEND')
    if (friendRow) await deleteRelation(friendRow.id)
    if (!isBlocked(userId)) await requestRelation(userId, 'BLOCK')
  }
  async function unblockUser(userId: number): Promise<void> {
    const row = findOwnedRelation(userId, 'BLOCK')
    if (row) await deleteRelation(row.id)
  }

  // ── Family / referee requests ──────────────────────────────────────────────
  async function requestParentOf(userId: number): Promise<void> {
    await requestRelation(userId, 'PARENT')
  }
  async function requestChildOf(userId: number): Promise<void> {
    await requestRelation(userId, 'CHILD')
  }
  async function requestReferee(userId: number): Promise<void> {
    await requestRelation(userId, 'REFEREE')
  }

  // Confirm/reject any received request by its row id (unified inbox).
  async function confirmRequest(rowId: number): Promise<void> {
    await acceptRequest(rowId)
  }
  async function rejectRequest(rowId: number): Promise<void> {
    await deleteRelation(rowId)
  }
  // Remove any owned relation of a type (unfriend, drop a referee, etc.).
  async function removeRelationOfType(
    userId: number,
    type: RelationType,
  ): Promise<void> {
    const row = findOwnedRelation(userId, type)
    if (row) await deleteRelation(row.id)
  }

  // ── Load / reset ───────────────────────────────────────────────────────────
  async function load(force = false): Promise<void> {
    if (isLoaded.value && !force) return
    if (!meId.value) {
      relations.value = []
      return
    }
    isLoading.value = true
    try {
      const res = await performFetch<UserRelation[]>('/api/relations')
      relations.value = res.success && Array.isArray(res.data) ? res.data : []
      isLoaded.value = true
    } catch (error) {
      handleError(error, 'loading relations')
      relations.value = []
    } finally {
      isLoading.value = false
    }
  }
  function reset(): void {
    relations.value = []
    isLoaded.value = false
  }

  return {
    // state
    relations,
    isLoaded,
    isLoading,
    isSaving,
    // friend getters
    friendIds,
    outgoingIds,
    incomingIds,
    blockedIds,
    childIds,
    parentIds,
    refereeingIds,
    allIncomingRequests,
    friendCount,
    incomingCount,
    incomingRequestCount,
    // generic selectors
    acceptedOfType,
    sentOfType,
    receivedOfType,
    // queries
    isFriend,
    hasOutgoingRequest,
    hasIncomingRequest,
    isBlocked,
    relationship,
    findReceivedRequest,
    findOwnedRelation,
    // generic actions
    requestRelation,
    confirmRequest,
    rejectRequest,
    removeRelationOfType,
    // friend actions
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    // block
    blockUser,
    unblockUser,
    // family / referee
    requestParentOf,
    requestChildOf,
    requestReferee,
    // lifecycle
    load,
    reset,
  }
})
