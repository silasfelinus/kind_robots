# Coding-agent database lane runbook

This runbook provisions a dedicated Kind Robots database identity for coding agents such as Claude. The purpose is to stop agent sessions from sharing the production `kindrobot` ProxySQL frontend budget while still allowing ordinary application reads and writes.

## Target topology

```text
Production app
  DATABASE_URL -> kindrobot -> ProxySQL hostgroup 10

Vercel Preview
  DATABASE_URL -> kindrobot_preview -> ProxySQL hostgroup 20
  read-only

Production migrations
  MIGRATION_DATABASE_URL -> kindrobot_migrate -> ProxySQL hostgroup 30
  schema-changing privileges

Coding agents such as Claude
  DATABASE_URL -> kindrobot_agent -> ProxySQL hostgroup 40
  application read/write only
```

The agent lane defaults to:

- ProxySQL frontend limit: 20 sessions;
- ProxySQL/MariaDB backend limit: 6 connections per production backend row;
- MariaDB privileges on the application schema: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `SHOW VIEW`;
- no `CREATE`, `ALTER`, `DROP`, migration, routine, trigger, event, index, reference, or temporary-table privileges.

This is intentionally not a migration identity. An agent that needs a schema change should produce or review the migration, but the schema-changing command should run only through the dedicated migration lane with explicit intent.

## Provision on Alexandria

From the Kind Robots checkout on Alexandria, first run the dry run:

```bash
bash scripts/provision-agent-db-lane.sh
```

The dry run checks the existing production hostgroup, rejects unrelated rows in hostgroup 40, rejects generic ProxySQL routing rules that could defeat user isolation, and verifies that the planned backend capacity stays within the MariaDB reserve.

If the dry run is clean:

```bash
bash scripts/provision-agent-db-lane.sh --apply
```

The apply step:

1. creates or reconciles `kindrobot_agent` in MariaDB;
2. removes any prior grants from that user, then grants only application read/write privileges;
3. creates ProxySQL hostgroup 40 by cloning the production backend destinations with a smaller connection cap;
4. creates or reconciles the ProxySQL frontend user with its own frontend ceiling;
5. loads and saves ProxySQL server/user configuration;
6. verifies the final grants and confirms schema-changing privileges are absent;
7. verifies authentication through ProxySQL;
8. writes a private credential handoff file.

Default handoff path:

```text
/mnt/user/pc/kindrobots-db-agent/kindrobots-db-agent.env
```

The directory is mode 700 and the file is mode 600. Do not paste the file into chat, issues, PRs, logs, or source control.

## Configure Claude

The handoff file contains component fields plus one finished URL:

```text
AGENT_DATABASE_URL=...
```

In the Claude environment, replace the old production connection with:

```text
DATABASE_URL=<value of AGENT_DATABASE_URL>
```

Do not name it `AGENT_DATABASE_URL` unless another wrapper specifically expects that name. Kind Robots runtime and Prisma code expect `DATABASE_URL` for ordinary application access.

Remove the old production `DATABASE_URL` value instead of keeping both credentials around.

Do **not** set a standing `MIGRATION_DATABASE_URL` for Claude. `prisma.config.ts` gives `MIGRATION_DATABASE_URL` precedence over `DATABASE_URL`, so defining it globally would silently give Prisma commands the schema-changing lane instead of the constrained agent lane.

If Claude already has database TLS environment variables such as the ProxySQL CA settings, keep those unchanged. If the old `DATABASE_URL` carried transport-only query parameters, preserve only those required transport parameters on the new agent URL. Never preserve the old username or password.

## Expected behavior

Claude should still be able to:

- read application records;
- create normal application rows through existing scripts or APIs;
- update and delete normal application data when the workflow legitimately requires it;
- run ordinary Prisma Client queries and transactions.

Claude should not be able to:

- run `prisma migrate deploy` successfully using only its normal `DATABASE_URL`;
- create, alter, or drop tables;
- create triggers, routines, events, indexes, or temporary tables;
- consume the production `kindrobot` ProxySQL frontend allowance.

A schema-permission failure from the agent lane is therefore a safety boundary working as designed, not a reason to broaden the standing credential.

## Verify after switching Claude

Run the capacity diagnostic on Alexandria:

```bash
bash scripts/proxysql-capacity-diagnostics.sh
```

The ProxySQL user census should show `kindrobot_agent` independently from `kindrobot`, `kindrobot_preview`, and `kindrobot_migrate`. Normal Claude work should increment the agent lane rather than the production lane.

If Claude cannot connect after the credential swap, first compare the old and new URL's transport settings and confirm that any existing ProxySQL CA environment variables are still present. Do not fall back to the production credential merely to make the error disappear.
