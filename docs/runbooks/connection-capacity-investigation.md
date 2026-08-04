# Current connection-capacity investigation

## Root cause established on 2026-08-04

The live census separated the two connection layers:

- ProxySQL `kindrobot` frontend sessions: **200 / 200**
- ProxySQL hostgroup 10 backend cap: **40**
- observed backend pool: **27 used + 4 free** in the second capture
- MariaDB `kindrobot` sessions: **31**, all sleeping and all from ProxySQL
- MariaDB open transactions: **0**
- ProxySQL denied-user connections: **95,877**
- ProxySQL client connections created: **107,000**

MariaDB was not holding 200 direct application connections. ProxySQL was
successfully multiplexing the cloud clients onto a bounded backend pool. The
immediate outage was ProxySQL refusing connection 201 for the shared frontend
user.

`SILAS-PC` had zero sockets to Alexandria port 5544 and no Kind Robots
Node/Nuxt/Nitro process running during the same capture. The visible ProxySQL
client sources were public AWS us-east addresses rather than the Windows host.

Vercel project inspection supplied the missing ownership evidence:

- the Nuxt server and `/api/*` routes are deployed as Vercel Node functions;
- production and every preview deployment inherit the real `DATABASE_URL`;
- nearly every pushed commit creates another independently warm deployment;
- Vercel runtime logs show thousands of Prisma pool failures across those APIs;
- every function process used the same global `connectionLimit=10`,
  `minimumIdle=1`, `idleTimeout=300` profile.

The decisive defect was **one mandatory warm ProxySQL frontend session per Vercel
function process and preview deployment**. Hidden idle sessions accumulated until
the shared 200-session frontend limit stayed full. The high denial and aborted
connection counters then recorded the resulting retry storm.

PR #1412 repairs both application-side amplifiers:

1. one Prisma client per Node process, without replacement-client generations;
2. separate pool profiles:
   - long-lived local runtime: `10 / minimumIdle 1 / idle 300s`
   - Vercel function runtime: `2 / minimumIdle 0 / idle 15s`

Preview builds already skip migrations and seeds; the remaining preview problem
was their deployed server runtime retaining production-database sessions.

## Recovery order

1. Merge and deploy the runtime-specific pool fix.
2. Confirm the production Vercel runtime logs `poolProfile: vercel-function`.
3. Restart ProxySQL once to release the 200 sessions retained by old deployment
   code.
4. Re-run the Alexandria census and verify frontend sessions fall and remain
   below the user limit.
5. Keep the 200 frontend limit during observation. Raise it only after a measured
   steady state shows legitimate concurrency needs more headroom.

For durable isolation, give Vercel previews a separate database/account or remove
production `DATABASE_URL` from the Preview environment. A preview should not
share the production runtime user's entire connection budget indefinitely.
