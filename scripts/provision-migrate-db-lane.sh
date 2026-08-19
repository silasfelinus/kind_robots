#!/usr/bin/env bash
# Provision (or reconcile) the dedicated ProxySQL/MariaDB migration lane.
# Run on Alexandria from the Kind Robots repository.
#
# Dry run (default):
#   bash scripts/provision-migrate-db-lane.sh
#
# Apply:
#   bash scripts/provision-migrate-db-lane.sh --apply
#
# Optional overrides:
#   PROXYSQL_CONTAINER=proxysql
#   MARIADB_CONTAINER=mariadb-kindrobots2
#   APP_DB_USER=kindrobot
#   MIGRATE_DB_USER=kindrobot_migrate
#   PRODUCTION_HOSTGROUP=10
#   MIGRATE_HOSTGROUP=30
#   MIGRATE_FRONTEND_MAX=8
#   MIGRATE_BACKEND_MAX=4
#   PUBLIC_PROXYSQL_HOST=acrocatranch.com
#   PUBLIC_PROXYSQL_PORT=5544
#   OUTPUT_FILE=/mnt/user/pc/kindrobots-db-migrate/kindrobots-db-migrate.env
#   MIGRATE_DB_PASSWORD=...            # reuse an existing password instead of generating
#   ROTATE_PASSWORD=1                  # generate a new password even if one is known
#   STRICT_PRIVILEGES=1                # REVOKE first, then grant only the set below
#
# This is the sibling of provision-agent-db-lane.sh and the exact inverse of it
# in one respect: the agent lane must NOT be able to change schema, and this one
# must. Everything else -- dry run first, credential handoff file, verification
# through ProxySQL, never printing the password -- is deliberately the same.
#
# WHY THIS EXISTS
# ---------------
# 2026-08-19: a deploy shipped code expecting `User.tokens` while the database
# was three releases behind, and the migration could not be run because nobody
# had a working `kindrobot_migrate` password. The lane itself turned out to be
# fully provisioned in ProxySQL (hostgroup 30, active, correct schema) -- it was
# only the credential that had gone missing. `kindrobot_agent` had a script that
# creates and reconciles it idempotently; this lane did not, which is most
# likely why this is the lane that drifted. Recovering it by hand took four
# rounds of ProxySQL and MariaDB spelunking. This script is that recovery,
# written down.
#
# PRIVILEGES
# ----------
# Additive by default: the migration user is granted the schema-change set on
# the application schema, and nothing is revoked. That is deliberate -- this
# runs against production, and silently narrowing an already-working migration
# identity is a worse failure than leaving it broader than necessary. Pass
# STRICT_PRIVILEGES=1 to revoke first and land exactly the set below, which is
# what you want when reconciling a lane you believe has accumulated extra
# grants. Either way the script verifies afterwards that every privilege a
# Prisma migration needs is present.

set -Eeuo pipefail

MODE='dry-run'
if [[ "${1:-}" == '--apply' ]]; then
  MODE='apply'
elif [[ -n "${1:-}" ]]; then
  printf 'Usage: %s [--apply]\n' "$0" >&2
  exit 2
fi

PROXYSQL_CONTAINER="${PROXYSQL_CONTAINER:-proxysql}"
MARIADB_CONTAINER="${MARIADB_CONTAINER:-mariadb-kindrobots2}"
APP_DB_USER="${APP_DB_USER:-kindrobot}"
MIGRATE_DB_USER="${MIGRATE_DB_USER:-kindrobot_migrate}"
PRODUCTION_HOSTGROUP="${PRODUCTION_HOSTGROUP:-10}"
MIGRATE_HOSTGROUP="${MIGRATE_HOSTGROUP:-30}"
MIGRATE_FRONTEND_MAX="${MIGRATE_FRONTEND_MAX:-8}"
MIGRATE_BACKEND_MAX="${MIGRATE_BACKEND_MAX:-4}"
PUBLIC_PROXYSQL_HOST="${PUBLIC_PROXYSQL_HOST:-acrocatranch.com}"
PUBLIC_PROXYSQL_PORT="${PUBLIC_PROXYSQL_PORT:-5544}"
OUTPUT_FILE="${OUTPUT_FILE:-/mnt/user/pc/kindrobots-db-migrate/kindrobots-db-migrate.env}"
ROTATE_PASSWORD="${ROTATE_PASSWORD:-0}"
STRICT_PRIVILEGES="${STRICT_PRIVILEGES:-0}"

# Everything `prisma migrate deploy` can need on one schema. Kept explicit
# rather than `ALL PRIVILEGES` so the verification below can assert it, and so
# a reader can see exactly what a migration is allowed to do.
MIGRATE_PRIVILEGES='SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES, CREATE VIEW, SHOW VIEW, TRIGGER, EXECUTE, CREATE ROUTINE, ALTER ROUTINE'
# The subset the verification insists on afterwards. A migration that cannot
# CREATE/ALTER/DROP/INDEX is not a migration lane.
REQUIRED_PRIVILEGES="'SELECT','INSERT','UPDATE','DELETE','CREATE','DROP','ALTER','INDEX','REFERENCES'"
REQUIRED_PRIVILEGE_COUNT=9

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

info() {
  printf '%s\n' "$*"
}

command -v docker >/dev/null 2>&1 || fail 'docker is required on the Unraid host'
command -v openssl >/dev/null 2>&1 || fail 'openssl is required to generate credentials'

for container in "$PROXYSQL_CONTAINER" "$MARIADB_CONTAINER"; do
  running="$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)"
  [[ "$running" == 'true' ]] || fail "container $container is not running"
done

for value in "$APP_DB_USER" "$MIGRATE_DB_USER"; do
  [[ "$value" =~ ^[A-Za-z0-9_.@-]+$ ]] || fail "unsupported database username: $value"
done

[[ "$APP_DB_USER" != "$MIGRATE_DB_USER" ]] || fail \
  'The migration user must differ from the production application user; that separation is the whole point of docs/runbooks/migration-credential-boundary.md'

for value in "$PRODUCTION_HOSTGROUP" "$MIGRATE_HOSTGROUP" "$MIGRATE_FRONTEND_MAX" \
  "$MIGRATE_BACKEND_MAX" "$PUBLIC_PROXYSQL_PORT"; do
  [[ "$value" =~ ^[0-9]+$ ]] || fail "expected an integer, got: $value"
done

[[ "$PRODUCTION_HOSTGROUP" != "$MIGRATE_HOSTGROUP" ]] || fail 'Migration hostgroup must differ from production'
[[ "$MIGRATE_FRONTEND_MAX" -ge 1 ]] || fail 'Migration frontend max must be at least 1'
[[ "$MIGRATE_BACKEND_MAX" -ge 1 ]] || fail 'Migration backend max must be at least 1'

container_env_value() {
  local container="$1"
  local key="$2"
  docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$container" 2>/dev/null \
    | sed -n "s/^${key}=//p" \
    | head -n 1
}

find_proxysql_admin_credentials() {
  local credentials
  credentials="$(
    docker exec "$PROXYSQL_CONTAINER" sh -lc '
      for file in /etc/proxysql.cnf /etc/proxysql/proxysql.cnf /var/lib/proxysql/proxysql.cnf; do
        if [ -r "$file" ]; then
          sed -nE '\''s/^[[:space:]]*admin_credentials[[:space:]]*=[[:space:]]*"([^";]+)(;[^"]*)?".*/\1/p'\'' "$file"
          exit 0
        fi
      done
    ' 2>/dev/null || true
  )"

  [[ -n "$credentials" ]] || return 1
  PROXYSQL_ADMIN_USER="${credentials%%:*}"
  PROXYSQL_ADMIN_PASSWORD="${credentials#*:}"
  [[ -n "$PROXYSQL_ADMIN_USER" && -n "$PROXYSQL_ADMIN_PASSWORD" ]]
}

PROXYSQL_ADMIN_USER="${PROXYSQL_ADMIN_USER:-}"
PROXYSQL_ADMIN_PASSWORD="${PROXYSQL_ADMIN_PASSWORD:-}"
if [[ -z "$PROXYSQL_ADMIN_USER" || -z "$PROXYSQL_ADMIN_PASSWORD" ]]; then
  find_proxysql_admin_credentials || fail \
    'could not read ProxySQL admin_credentials; set PROXYSQL_ADMIN_USER and PROXYSQL_ADMIN_PASSWORD'
fi

MARIADB_ROOT_PASSWORD="${MARIADB_ROOT_PASSWORD:-}"
if [[ -z "$MARIADB_ROOT_PASSWORD" ]]; then
  MARIADB_ROOT_PASSWORD="$(container_env_value "$MARIADB_CONTAINER" MARIADB_ROOT_PASSWORD)"
fi
if [[ -z "$MARIADB_ROOT_PASSWORD" ]]; then
  MARIADB_ROOT_PASSWORD="$(container_env_value "$MARIADB_CONTAINER" MYSQL_ROOT_PASSWORD)"
fi

proxysql_query() {
  local sql="$1"
  docker exec \
    -e MYSQL_PWD="$PROXYSQL_ADMIN_PASSWORD" \
    -e KR_SQL="$sql" \
    -e KR_ADMIN_USER="$PROXYSQL_ADMIN_USER" \
    "$PROXYSQL_CONTAINER" sh -lc '
      client="$(command -v mariadb || command -v mysql || true)"
      [ -n "$client" ] || exit 127
      "$client" --protocol=tcp -h127.0.0.1 -P6032 -u"$KR_ADMIN_USER" --batch --skip-column-names --raw -e "$KR_SQL"
    '
}

mariadb_query() {
  local sql="$1"
  if [[ -n "$MARIADB_ROOT_PASSWORD" ]]; then
    docker exec \
      -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" \
      -e KR_SQL="$sql" \
      "$MARIADB_CONTAINER" sh -lc '
        client="$(command -v mariadb || command -v mysql || true)"
        [ -n "$client" ] || exit 127
        "$client" --protocol=socket -uroot --batch --skip-column-names --raw -e "$KR_SQL"
      '
  else
    docker exec \
      -e KR_SQL="$sql" \
      "$MARIADB_CONTAINER" sh -lc '
        client="$(command -v mariadb || command -v mysql || true)"
        [ -n "$client" ] || exit 127
        "$client" --protocol=socket -uroot --batch --skip-column-names --raw -e "$KR_SQL"
      ' || fail 'root login failed; set MARIADB_ROOT_PASSWORD for provisioning'
  fi
}

load_saved_credentials() {
  [[ -f "$OUTPUT_FILE" ]] || return 0
  local mode
  mode="$(stat -c '%a' "$OUTPUT_FILE" 2>/dev/null || true)"
  [[ "$mode" == '600' || "$mode" == '400' ]] || fail \
    "refusing to source $OUTPUT_FILE because its mode is ${mode:-unknown}; chmod 600 first"
  # shellcheck disable=SC1090
  source "$OUTPUT_FILE"
}

load_saved_credentials
MIGRATE_DB_PASSWORD="${MIGRATE_DB_PASSWORD:-}"
# An `[[ ... ]] && x=y` one-liner returns non-zero when the test fails, which
# under `set -e` exits the script -- the opposite of "leave it alone".
if [[ "$ROTATE_PASSWORD" == '1' ]]; then
  MIGRATE_DB_PASSWORD=''
fi

# Routing comes from the production user's live row rather than from constants,
# so the migration lane can never end up pointed at a schema or an SSL setting
# the application does not itself use.
prod_user_row="$(proxysql_query "
SELECT default_schema, use_ssl
FROM runtime_mysql_users
WHERE username='${APP_DB_USER}' AND frontend=1
LIMIT 1;
")"
[[ -n "$prod_user_row" ]] || fail "ProxySQL runtime user ${APP_DB_USER} was not found"

IFS=$'\t' read -r DATABASE_NAME PROD_USE_SSL <<<"$prod_user_row"
[[ "$DATABASE_NAME" =~ ^[A-Za-z0-9_]+$ ]] || fail "unsupported database name: $DATABASE_NAME"
[[ "$PROD_USE_SSL" =~ ^[01]$ ]] || fail "unexpected use_ssl value for ${APP_DB_USER}: $PROD_USE_SSL"

prod_backend_count="$(proxysql_query "SELECT COUNT(*) FROM mysql_servers WHERE hostgroup_id=${PRODUCTION_HOSTGROUP};")"
[[ "$prod_backend_count" -gt 0 ]] || fail "production hostgroup ${PRODUCTION_HOSTGROUP} has no backend servers"

foreign_rows="$(proxysql_query "
SELECT COUNT(*)
FROM mysql_servers AS target
WHERE target.hostgroup_id=${MIGRATE_HOSTGROUP}
  AND NOT EXISTS (
    SELECT 1
    FROM mysql_servers AS prod
    WHERE prod.hostgroup_id=${PRODUCTION_HOSTGROUP}
      AND prod.hostname=target.hostname
      AND prod.port=target.port
  );
")"
[[ "$foreign_rows" == '0' ]] || fail \
  "hostgroup ${MIGRATE_HOSTGROUP} already contains backend rows unrelated to production hostgroup ${PRODUCTION_HOSTGROUP}"

migrate_backend_count="$(proxysql_query "SELECT COUNT(*) FROM mysql_servers WHERE hostgroup_id=${MIGRATE_HOSTGROUP};")"
migrate_user_exists="$(mariadb_query "SELECT COUNT(*) FROM mysql.user WHERE User='${MIGRATE_DB_USER}' AND Host='%';")"

if [[ "$migrate_user_exists" != '0' && -z "$MIGRATE_DB_PASSWORD" ]]; then
  info "NOTE: MariaDB user ${MIGRATE_DB_USER}@% already exists and no password is known."
  info '      A new one will be generated and set on BOTH MariaDB and ProxySQL.'
  info "      Anything still holding the old password stops working -- that is the"
  info '      intended recovery when the credential has been lost. Set'
  info '      MIGRATE_DB_PASSWORD to keep the existing one instead.'
fi

[[ -n "$MIGRATE_DB_PASSWORD" ]] || MIGRATE_DB_PASSWORD="$(openssl rand -hex 24)"
[[ "$MIGRATE_DB_PASSWORD" =~ ^[A-Za-z0-9]+$ ]] || fail \
  'Migration password must contain only letters and digits: it is embedded in a URL and in SQL, and every escaping layer it crosses is a place to lose an hour'

migrate_url="mysql://${MIGRATE_DB_USER}:${MIGRATE_DB_PASSWORD}@${PUBLIC_PROXYSQL_HOST}:${PUBLIC_PROXYSQL_PORT}/${DATABASE_NAME}"

info 'Kind Robots migration database lane'
info "Mode: ${MODE}"
info "Database: ${DATABASE_NAME}"
info "Production lane: user=${APP_DB_USER} hostgroup=${PRODUCTION_HOSTGROUP} backends=${prod_backend_count}"
info "Migration lane: user=${MIGRATE_DB_USER} frontendMax=${MIGRATE_FRONTEND_MAX} hostgroup=${MIGRATE_HOSTGROUP} backendMax/server=${MIGRATE_BACKEND_MAX}"
info "Migration hostgroup backends currently present: ${migrate_backend_count} (will be reconciled to ${prod_backend_count})"
info "MariaDB user exists: $([[ "$migrate_user_exists" == '0' ]] && echo no || echo yes)"
info "Privileges: ${MIGRATE_PRIVILEGES}"
info "Revoke before granting: $([[ "$STRICT_PRIVILEGES" == '1' ]] && echo yes || echo 'no (additive)')"
info 'Passwords and URLs are intentionally not printed.'

if [[ "$MODE" != 'apply' ]]; then
  info ''
  info 'Dry run complete. Re-run with --apply to provision the migration lane.'
  exit 0
fi

output_dir="$(dirname "$OUTPUT_FILE")"
mkdir -p "$output_dir"
chmod 700 "$output_dir"
snapshot_file="${OUTPUT_FILE%.env}-before-$(date -u +%Y%m%dT%H%M%SZ).txt"
{
  printf 'ProxySQL migration user (password omitted)\n'
  proxysql_query "SELECT username,active,use_ssl,default_hostgroup,default_schema,schema_locked,transaction_persistent,frontend,backend,max_connections FROM mysql_users WHERE username='${MIGRATE_DB_USER}';"
  printf '\nProxySQL target servers\n'
  proxysql_query "SELECT hostgroup_id,hostname,port,status,weight,max_connections,use_ssl,comment FROM mysql_servers WHERE hostgroup_id=${MIGRATE_HOSTGROUP} ORDER BY hostname,port;"
  printf '\nMariaDB migration grants before change\n'
  mariadb_query "SHOW GRANTS FOR '${MIGRATE_DB_USER}'@'%';" 2>/dev/null || true
} >"$snapshot_file"
chmod 600 "$snapshot_file"

# --- MariaDB ---------------------------------------------------------------
# IDENTIFIED VIA mysql_native_password is not a style choice: ProxySQL cannot
# authenticate to the backend with MariaDB's newer default plugin, and the
# resulting failure surfaces as a plain "Access denied" that looks exactly like
# a wrong password.
if [[ "$STRICT_PRIVILEGES" == '1' ]]; then
  mariadb_query "REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${MIGRATE_DB_USER}'@'%';" >/dev/null 2>&1 || true
fi

mariadb_query "
CREATE USER IF NOT EXISTS '${MIGRATE_DB_USER}'@'%' IDENTIFIED VIA mysql_native_password USING PASSWORD('${MIGRATE_DB_PASSWORD}');
ALTER USER '${MIGRATE_DB_USER}'@'%' IDENTIFIED VIA mysql_native_password USING PASSWORD('${MIGRATE_DB_PASSWORD}');
GRANT USAGE ON *.* TO '${MIGRATE_DB_USER}'@'%' WITH MAX_USER_CONNECTIONS ${MIGRATE_FRONTEND_MAX};
GRANT ${MIGRATE_PRIVILEGES} ON \`${DATABASE_NAME}\`.* TO '${MIGRATE_DB_USER}'@'%';
FLUSH PRIVILEGES;
" >/dev/null

# --- ProxySQL --------------------------------------------------------------
proxysql_query "
INSERT INTO mysql_servers (hostgroup_id,hostname,port,gtid_port,status,weight,compression,max_connections,max_replication_lag,use_ssl,max_latency_ms,comment)
SELECT ${MIGRATE_HOSTGROUP},prod.hostname,prod.port,prod.gtid_port,prod.status,prod.weight,prod.compression,${MIGRATE_BACKEND_MAX},prod.max_replication_lag,prod.use_ssl,prod.max_latency_ms,'kind robots migration lane'
  FROM mysql_servers AS prod
 WHERE prod.hostgroup_id=${PRODUCTION_HOSTGROUP}
   AND NOT EXISTS (
     SELECT 1 FROM mysql_servers AS existing
      WHERE existing.hostgroup_id=${MIGRATE_HOSTGROUP}
        AND existing.hostname=prod.hostname
        AND existing.port=prod.port
   );

UPDATE mysql_servers SET max_connections=${MIGRATE_BACKEND_MAX} WHERE hostgroup_id=${MIGRATE_HOSTGROUP};

UPDATE mysql_users
   SET password=MYSQL_NATIVE_PASSWORD('${MIGRATE_DB_PASSWORD}'),
       active=1,
       use_ssl=${PROD_USE_SSL},
       default_hostgroup=${MIGRATE_HOSTGROUP},
       default_schema='${DATABASE_NAME}',
       schema_locked=1,
       transaction_persistent=1,
       fast_forward=0,
       backend=1,
       frontend=1,
       max_connections=${MIGRATE_FRONTEND_MAX}
 WHERE username='${MIGRATE_DB_USER}';

INSERT INTO mysql_users (
  username,password,active,use_ssl,default_hostgroup,default_schema,
  schema_locked,transaction_persistent,fast_forward,backend,frontend,max_connections
)
SELECT '${MIGRATE_DB_USER}',MYSQL_NATIVE_PASSWORD('${MIGRATE_DB_PASSWORD}'),1,${PROD_USE_SSL},
       ${MIGRATE_HOSTGROUP},'${DATABASE_NAME}',1,1,0,1,1,${MIGRATE_FRONTEND_MAX}
WHERE NOT EXISTS (SELECT 1 FROM mysql_users WHERE username='${MIGRATE_DB_USER}');

LOAD MYSQL SERVERS TO RUNTIME;
SAVE MYSQL SERVERS TO DISK;
LOAD MYSQL USERS TO RUNTIME;
SAVE MYSQL USERS TO DISK;
" >/dev/null

# --- verify ----------------------------------------------------------------
runtime_migrate="$(proxysql_query "SELECT default_hostgroup,max_connections FROM runtime_mysql_users WHERE username='${MIGRATE_DB_USER}' AND frontend=1 LIMIT 1;")"
[[ "$runtime_migrate" == "${MIGRATE_HOSTGROUP}"$'\t'"${MIGRATE_FRONTEND_MAX}" ]] || fail \
  "Migration runtime user verification failed: ${runtime_migrate:-missing}"

migrate_server_count="$(proxysql_query "SELECT COUNT(*) FROM runtime_mysql_servers WHERE hostgroup_id=${MIGRATE_HOSTGROUP};")"
[[ "$migrate_server_count" == "$prod_backend_count" ]] || fail \
  "Migration hostgroup verification failed: expected ${prod_backend_count} backend row(s), got ${migrate_server_count}"

granted_privileges="$(mariadb_query "
SELECT COUNT(*)
FROM information_schema.SCHEMA_PRIVILEGES
WHERE GRANTEE=CONCAT(CHAR(39),'${MIGRATE_DB_USER}',CHAR(39),'@',CHAR(39),'%',CHAR(39))
  AND TABLE_SCHEMA='${DATABASE_NAME}'
  AND PRIVILEGE_TYPE IN (${REQUIRED_PRIVILEGES});
")"
[[ "$granted_privileges" == "$REQUIRED_PRIVILEGE_COUNT" ]] || fail \
  "Migration user is missing schema-change privileges on ${DATABASE_NAME}: expected ${REQUIRED_PRIVILEGE_COUNT}, found ${granted_privileges}"

# A migration identity has no business holding global privileges. Scoped
# schema-change rights are the point; server-wide ones are a different blast
# radius entirely.
global_privileges="$(mariadb_query "
SELECT COUNT(*)
FROM information_schema.USER_PRIVILEGES
WHERE GRANTEE=CONCAT(CHAR(39),'${MIGRATE_DB_USER}',CHAR(39),'@',CHAR(39),'%',CHAR(39))
  AND PRIVILEGE_TYPE <> 'USAGE';
")"
[[ "$global_privileges" == '0' ]] || fail \
  "Migration user unexpectedly holds ${global_privileges} server-wide privilege(s); it should be scoped to ${DATABASE_NAME}"

# Authentication through ProxySQL, without printing the URL or the password.
docker exec \
  -e MYSQL_PWD="$MIGRATE_DB_PASSWORD" \
  -e KR_MIGRATE_USER="$MIGRATE_DB_USER" \
  -e KR_MIGRATE_DB="$DATABASE_NAME" \
  "$PROXYSQL_CONTAINER" sh -lc '
    client="$(command -v mariadb || command -v mysql || true)"
    [ -n "$client" ] || exit 127
    "$client" --protocol=tcp -h127.0.0.1 -P6033 -u"$KR_MIGRATE_USER" "$KR_MIGRATE_DB" --batch --skip-column-names -e "SELECT 1;" >/dev/null
  ' || fail 'Migration authentication through ProxySQL failed'

umask 077
cat >"$OUTPUT_FILE" <<EOF
# Kind Robots migration credentials generated $(date -u +%Y-%m-%dT%H:%M:%SZ)
# Keep this file private. Source it in the deploying shell; it is deliberately
# NOT part of the application env file (docs/runbooks/migration-credential-boundary.md).
MIGRATE_DB_USER=${MIGRATE_DB_USER}
MIGRATE_DB_PASSWORD=${MIGRATE_DB_PASSWORD}
DATABASE_NAME=${DATABASE_NAME}
PUBLIC_PROXYSQL_HOST=${PUBLIC_PROXYSQL_HOST}
PUBLIC_PROXYSQL_PORT=${PUBLIC_PROXYSQL_PORT}
MIGRATION_DATABASE_URL=${migrate_url}
EOF
chmod 600 "$OUTPUT_FILE"

info ''
info 'Provisioning succeeded.'
info "Credential handoff file: $OUTPUT_FILE (mode 600; contents not printed)"
info "Pre-change snapshot: $snapshot_file"
info "Migration user ${MIGRATE_DB_USER} is isolated to hostgroup ${MIGRATE_HOSTGROUP}."
info "Schema-change privileges verified on ${DATABASE_NAME}; no server-wide privileges."
info 'ProxySQL authentication verified.'
info ''
info 'Next, from the repository on this host:'
info "  set -a; . ${OUTPUT_FILE}; set +a"
info '  docker pull ghcr.io/silasfelinus/kind_robots:latest'
info '  docker run --rm --network cafepurr --env-file .env -e MIGRATION_DATABASE_URL \'
info '    ghcr.io/silasfelinus/kind_robots:latest node scripts/prisma-migrate-deploy.mjs'
info 'Then Force Update the container so the code and the schema match.'
