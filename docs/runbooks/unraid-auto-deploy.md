# Alexandria automatic deployment

Kind Robots production runs on the Alexandria Unraid host as the `KindRobots` DockerMan container. A GitHub merge publishes `ghcr.io/silasfelinus/kind_robots:latest`; it does **not** by itself update Alexandria or apply Prisma migrations.

The production path is therefore host-driven:

1. Unraid User Scripts runs the Kind Robots deployment launcher on a schedule.
2. The launcher fast-forwards the clean production checkout to `origin/main`.
3. The deployer pulls the current `ghcr.io/silasfelinus/kind_robots:latest` image.
4. Pending Prisma migrations from that image run through the isolated `kindrobot_migrate` credential.
5. Only after migrations succeed does Unraid's own DockerMan updater recreate `KindRobots` from its saved template.
6. The script waits for the container health check before reporting success.
7. After a healthy handoff, the deployer removes dangling Docker images carrying Kind Robots' `org.opencontainers.image.source` label. It does not run a host-wide image prune or touch other projects' images.

If migration fails, the container update is not attempted. The long-running application never receives `MIGRATION_DATABASE_URL`.

## One-time setup in Unraid User Scripts

First make sure Alexandria has the current scripts:

```bash
cd /mnt/user/appdata/kind_robots
git switch main
git pull --ff-only
bash scripts/unraid-user-script.sh
```

That last line performs one guarded deployment check immediately. Once it succeeds, create one User Script in the Unraid UI named something like **Kind Robots Auto Deploy** with this body:

```bash
#!/bin/bash
exec /bin/bash /mnt/user/appdata/kind_robots/scripts/unraid-user-script.sh
```

Schedule it for every **5 minutes**. User Scripts owns the schedule and persistence across Unraid restarts; the repository owns the deployment behavior.

The migration credential remains where it already belongs:

```text
/mnt/user/appdata/kind_robots/.secrets/kindrobots-db-migrate.env
```

The deployer's persistent state also lives under the appdata checkout, not in Unraid's volatile root filesystem:

```text
/mnt/user/appdata/kind_robots/.deploy-state/
```

## Normal operation

No human migration step is required after ordinary merges once the User Script is active.

The scheduled launcher refreshes a clean `main` checkout with `git pull --ff-only`, then runs `scripts/deploy-unraid.sh`.

The deployer uses `flock`, so overlapping User Script runs cannot race each other. It records the image whose migrations were last verified and rechecks migrations at least once per day even when the image has not changed. This repairs the common failure mode where a container was manually Force Updated while the migration step was skipped.

DockerMan's `latest`-tag handoff can leave the previously running image untagged, which Unraid displays as an **orphan image**. Each scheduled deploy check now removes only dangling images labeled as originating from `silasfelinus/kind_robots`, including backlog from earlier deploys. Images belonging to Kapowarr or any other container are outside this cleanup's scope.

User Scripts captures each run's output. For direct troubleshooting, run:

```bash
cd /mnt/user/appdata/kind_robots
bash scripts/unraid-user-script.sh
docker inspect KindRobots --format '{{.Image}} {{.State.Health.Status}}'
```

## Manual deployment

The same guarded path can be run at any time:

```bash
cd /mnt/user/appdata/kind_robots
bash scripts/deploy-unraid.sh
```

Do not use the Unraid **Force Update** button as the normal Kind Robots deployment path. It recreates the container but has no awareness of Prisma migrations. The CLI deployer calls the same DockerMan update machinery only after the matching image has successfully migrated the database.

## Migration compatibility rule

The normal automatic deployment path migrates the database before replacing the currently running container. Therefore migrations shipped through this path must be compatible with both the old and new application builds during that short handoff window.

Additive migrations are the default: new tables, nullable columns, indexes, and other changes the previous build can safely ignore. Destructive contract migrations such as dropping or renaming a column still used by the current production image require an explicit staged rollout. Do not put a destructive schema contraction into ordinary unattended deployment and assume timing will save it.

## Agent handoff contract

A change can be **merged** without yet being **published**, and can be **published** without yet being **deployed**. Agents must keep those states distinct.

Any agent that adds or changes `prisma/schema.prisma` or `prisma/migrations/**` must:

- call out that the change is schema-affecting in its PR/handoff;
- verify the migration is safe for the automatic old-build/new-schema handoff, or explicitly stage it if destructive;
- rely on this automatic Alexandria path rather than assuming GitHub or container publication applied the migration;
- never describe production as migrated merely because CI passed;
- if automation is unavailable or known unhealthy, give Silas the exact `scripts/deploy-unraid.sh` command before calling the operational work complete.

See `AGENTS.md` and `docs/runbooks/migration-credential-boundary.md` for the standing database safety rules.