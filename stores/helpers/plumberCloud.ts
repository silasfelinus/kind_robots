import {
  readPlumberFile,
  reconcilePlumberSaves,
  validPlumberCloudSave,
  type PlumberFile,
  type PlumberConflictChoice,
} from '../../utils/arcade/games/savePlumberSave'

export type PlumberCloudStatus =
  'local' | 'checking' | 'saving' | 'synced' | 'offline' | 'conflict'

export type PlumberAccountCopy = {
  save: PlumberFile
  revision: number
}

export type PlumberCloudConflict = {
  slots: number[]
  device: PlumberFile
  account: PlumberFile
  revision: number | null
}

type Cache = {
  save: PlumberFile
  baseline: PlumberFile | null
}

type Dependencies = {
  read: (owner: string) => unknown
  write: (owner: string, cache: Cache) => void
  get: (token: string) => Promise<PlumberAccountCopy | null>
  put: (
    token: string,
    save: PlumberFile,
    expectedRevision: number | null,
  ) => Promise<number>
  changed: (
    save: PlumberFile,
    status: PlumberCloudStatus,
    conflict: PlumberCloudConflict | null,
  ) => void
}

function same(left: PlumberFile, right: PlumberFile): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export class PlumberCloud {
  private owner: string | null = null
  private epoch = 0
  private save = readPlumberFile(null)
  private baseline: PlumberFile | null = null
  private revision: number | null = null
  private known = false
  private status: PlumberCloudStatus = 'local'
  private conflict: PlumberCloudConflict | null = null
  private pulling: Promise<void> | null = null
  private pushing: Promise<void> | null = null

  constructor(private readonly deps: Dependencies) {}

  select(owner: string, legacyGuest: unknown) {
    if (owner === this.owner) return
    this.owner = owner
    this.epoch++
    this.pulling = null
    this.pushing = null
    this.known = false
    this.revision = null
    this.conflict = null
    const raw = this.deps.read(owner) as Partial<Cache> | null
    this.save = readPlumberFile(
      raw?.save ?? (owner === 'guest' ? legacyGuest : null),
    )
    this.baseline = validPlumberCloudSave(raw?.baseline)
      ? readPlumberFile(raw.baseline)
      : null
    this.persist()
    this.publish('local')
  }

  private publish(status: PlumberCloudStatus) {
    this.status = status
    if (status !== 'conflict') this.conflict = null
    this.deps.changed(this.save, status, this.conflict)
  }

  private persist() {
    if (!this.owner) return
    this.deps.write(this.owner, {
      save: this.save,
      baseline: this.baseline,
    })
  }

  async sync(owner: string, token: string | null, legacyGuest: unknown) {
    this.select(owner, legacyGuest)
    if (owner === 'guest' || !token) return
    const epoch = this.epoch
    if (this.pushing) await this.pushing
    if (epoch !== this.epoch) return
    if (this.pulling) return this.pulling
    const work = this.pull(epoch, token)
    this.pulling = work
    try {
      await work
    } finally {
      if (epoch === this.epoch) this.pulling = null
    }
  }

  private async pull(epoch: number, token: string) {
    this.known = false
    this.publish('checking')
    try {
      const remote = await this.deps.get(token)
      if (epoch !== this.epoch) return
      if (
        remote &&
        (!Number.isSafeInteger(remote.revision) ||
          remote.revision < 0 ||
          !validPlumberCloudSave(remote.save))
      )
        throw new Error('Invalid account save')
      if (remote || this.baseline) {
        const account = readPlumberFile(remote?.save)
        const merged = reconcilePlumberSaves(
          this.save,
          account,
          this.baseline,
          undefined,
          !remote,
        )
        if (!remote || merged.status === 'conflict') {
          this.conflict = {
            slots: merged.status === 'conflict' ? merged.slots : [],
            device: this.save,
            account,
            revision: remote?.revision ?? null,
          }
          this.publish('conflict')
          return
        }
        this.save = merged.save
      }
      this.baseline = remote ? readPlumberFile(remote.save) : null
      this.revision = remote?.revision ?? null
      this.known = true
      this.persist()
      this.publish('synced')
      if (!this.baseline || !same(this.save, this.baseline))
        this.retry(this.owner!, token)
    } catch {
      if (epoch === this.epoch) this.publish('offline')
    }
  }

  async resolve(
    owner: string,
    token: string | null,
    choice: PlumberConflictChoice,
    snapshot: PlumberCloudConflict,
  ) {
    if (
      owner !== this.owner ||
      owner === 'guest' ||
      !token ||
      this.pulling ||
      this.pushing ||
      this.status !== 'conflict' ||
      !this.conflict ||
      snapshot.revision !== this.conflict.revision ||
      !same(snapshot.device, this.conflict.device) ||
      !same(snapshot.account, this.conflict.account)
    )
      return
    const epoch = this.epoch
    const work = this.resolveCopy(epoch, token, choice, snapshot)
    this.pushing = work
    try {
      await work
    } finally {
      if (epoch === this.epoch) {
        this.pushing = null
        if (this.status === 'synced') this.retry(owner, token)
      }
    }
  }

  private async resolveCopy(
    epoch: number,
    token: string,
    choice: PlumberConflictChoice,
    snapshot: PlumberCloudConflict,
  ) {
    this.publish('checking')
    try {
      const remote = await this.deps.get(token)
      if (epoch !== this.epoch) return
      if (
        remote &&
        (!Number.isSafeInteger(remote.revision) ||
          remote.revision < 0 ||
          !validPlumberCloudSave(remote.save))
      )
        throw new Error('Invalid account save')
      if (
        (remote?.revision ?? null) !== snapshot.revision ||
        !same(readPlumberFile(remote?.save), snapshot.account) ||
        !same(this.save, snapshot.device)
      ) {
        await this.pull(epoch, token)
        return
      }
      const merged = reconcilePlumberSaves(
        this.save,
        snapshot.account,
        this.baseline,
        choice,
        snapshot.revision === null,
      )
      if (merged.status !== 'merged' || !validPlumberCloudSave(merged.save))
        throw new Error('Invalid resolved save')
      const selected = merged.save
      this.publish('saving')
      const revision =
        remote && same(remote.save, selected)
          ? remote.revision
          : await this.deps.put(token, selected, snapshot.revision)
      if (epoch !== this.epoch) return
      if (!Number.isSafeInteger(revision) || revision < 0)
        throw new Error('Invalid save revision')
      if (!same(this.save, snapshot.device)) {
        await this.pull(epoch, token)
        return
      }
      this.save = selected
      this.baseline = selected
      this.revision = revision
      this.known = true
      this.persist()
      this.publish('synced')
    } catch (error) {
      if (epoch !== this.epoch) return
      const response = error as { status?: number; statusCode?: number }
      if (response.status === 409 || response.statusCode === 409) {
        await this.pull(epoch, token)
      } else {
        this.known = false
        this.conflict = snapshot
        this.publish('conflict')
      }
    }
  }

  record(owner: string, token: string | null, raw: unknown) {
    if (owner !== this.owner || !raw) return
    const save = readPlumberFile(raw)
    if (!validPlumberCloudSave(save) || same(save, this.save)) return
    this.save = save
    if (this.status === 'conflict') this.conflict = null
    this.persist()
    this.publish(this.status)
    this.retry(owner, token)
  }

  retry(owner: string, token: string | null) {
    if (
      owner !== this.owner ||
      owner === 'guest' ||
      !token ||
      !this.known ||
      this.pushing ||
      this.status === 'conflict' ||
      (this.baseline && same(this.save, this.baseline))
    )
      return
    const epoch = this.epoch
    const work = this.push(epoch, token)
    this.pushing = work
    void work.finally(() => {
      if (epoch === this.epoch) this.pushing = null
    })
  }

  private async push(epoch: number, token: string) {
    this.publish('saving')
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        if (epoch !== this.epoch) return
        const sent = this.save
        if (this.baseline && same(sent, this.baseline)) break
        const revision = await this.deps.put(token, sent, this.revision)
        if (epoch !== this.epoch) return
        if (!Number.isSafeInteger(revision) || revision < 0)
          throw new Error('Invalid save revision')
        this.revision = revision
        this.baseline = sent
        this.persist()
      }
      this.publish(
        this.baseline && same(this.save, this.baseline) ? 'synced' : 'offline',
      )
    } catch (error) {
      if (epoch !== this.epoch) return
      const response = error as { status?: number; statusCode?: number }
      if (response.status === 409 || response.statusCode === 409) {
        this.known = false
        this.publish('conflict')
      } else {
        this.publish('offline')
      }
    }
  }
}
