# Alexandria automatic deployment

Kind Robots production runs on the Alexandria Unraid host as the `KindRobots` DockerMan container. A GitHub merge publishes `ghcr.io/silasfelinus/kind_robots:latest`; it does **not** by itself update Alexandria or apply Prisma migrations.

The production path is therefore host-driven:

1. Alexandria polls the registry every five minutes.
2. A new image is pulled locally.
3. Pending Prisma migrations from that image run through the isolated `kindrobot_migrate` credential.
4. Only after migrations succeed does Unraid's own DockerMan updater recreate `KindRobots` from its saved template.
5. The script waits for the container health check before reporting success.

If migration fails, the container update is not attempted. The long-running application never receives `MIGRATION_DATABASE_URL`.

## One-time installation

On Alexandria:

```bash
cd /mnt/user/appdata/kind_robots
git switch main
git pull --ff-only
bash scripts/install-unraid-auto-deploy.sh
```

The installer writes only deployment scheduling state to the flash drive:

- `/boot/config/plugins/kindrobots-auto-deploy/run.sh`
- `/boot/config/plugins/custom_cron/kindrobots-auto-deploy.cron`

It then calls Unraid's `update_cron`, so the schedule survives reboot without depending on the Community Applications User Scripts plugin.

The migration credential remains where it already belongs:

```text
/mnt/user/appdata/kind_robots/.secrets/kindrobots-db-migrate.env
```

The installer immediately runs one deployment check. That is intentional: missing credentials, a missing DockerMan template, or a broken migration should fail during installation instead of becoming a silent cron problem.

## Normal operation

No human migration step is required after ordinary merges once the installer is active.

The scheduled launcher refreshes a clean `main` checkout with `git pull --ff-only`, then runs:

```bash
bash /mnt/user/appdata/kind_robots/scripts/deploy-unraid.sh
```

The deployer uses `flock`, so overlapping cron runs cannot race each other. It also records the image whose migrations were last verified and rechecks migrations at least once per day even when the image has not changed. This repairs the common failure mode where a container was manually Force Updated while the migration step was skipped.

Logs are written to:

```text
/var/log/kindrobots-auto-deploy.log
```

Useful checks:

```bash
tail -n 100 /var/log/kindrobots-auto-deploy.log
cat /boot/config/plugins/custom_cron/kindrobots-auto-deploy.cron
docker inspect KindRobots --format '{{.Image}} {{.State.Health.Status}}'
```

## Manual deployment

The same guarded path can be run at any time:

```bash
cd /mnt/user/appdata/kind_robots
bash scripts/deploy-unraid.sh
```

Do not use the Unraid **Force Update** button as the normal Kind Robots deployment path. It recreates the container but has no awareness of Prisma migrations. The CLI deployer calls the same DockerMan update machinery only after the matching image has successfully migrated the database.

## Agent handoff contract

A change can be **merged** without yet being **published**, and can be **published** without yet being **deployed**. Agents must keep those states distinct.

Any agent that adds or changes `prisma/schema.prisma` or `prisma/migrations/**` must:

- call out that the change is schema-affecting in its PR/handoff;
- rely on this automatic Alexandria path rather than assuming GitHub or container publication applied the migration;
- never describe production as migrated merely because CI passed;
- if automation is unavailable or known unhealthy, give Silas the exact `scripts/deploy-unraid.sh` command before calling the operational work complete.

See `AGENTS.md` and `docs/runbooks/migration-credential-boundary.md` for the standing database safety rules.
