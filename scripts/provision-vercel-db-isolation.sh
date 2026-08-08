#!/usr/bin/env bash
# Provision isolated ProxySQL/MariaDB identities for Vercel Preview and
# production migrations. Run on Alexandria from the Kind Robots repository.
#
# Dry run (default):
#   bash scripts/provision-vercel-db-isolation.sh
#
# Apply:
#   bash scripts/provision-vercel-db-isolation.sh --apply
#
# Optional overrides:
#   PROXYSQL_CONTAINER=proxysql
#   MARIADB_CONTAINER=mariadb-kindrobots2
#   APP_DB_USER=kindrobot
#   PREVIEW_DB_USER=kindrobot_preview
#   MIGRATION_DB_USER=kindrobot_migrate
#   PRODUCTION_HOSTGROUP=10
#   PREVIEW_HOSTGROUP=20
#   MIGRATION_HOSTGROUP=30
#   PREVIEW_FRONTEND_MAX=40
#   MIGRATION_FRONTEND_MAX=8
#   PREVIEW_BACKEND_MAX=8
#   MIGRATION_BACKEND_MAX=4
#   PROXYSQL_WAIT_TIMEOUT_MS=600000
#   PUBLIC_PROXYSQL_HOST=acrocatranch.com
#   PUBLIC_PROXYSQL_PORT=5544
#   OUTPUT_FILE=/mnt/user/pc/kindrobots-db-isolation.env
#
# Existing dedicated users are never silently rotated. If they already exist,
# reuse the generated OUTPUT_FILE or explicitly provide their passwords.

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
PREVIEW_DB_USER="${PREVIEW_DB_USER:-kindrobot_preview}"
MIGRATION_DB_USER="${MIGRATION_DB_USER:-kindrobot_migrate}"
PRODUCTION_HOSTGROUP="${PRODUCTION_HOSTGROUP:-10}"
PREVIEW_HOSTGROUP="${PREVIEW_HOSTGROUP:-20}"
MIGRATION_HOSTGROUP="${MIGRATION_HOSTGROUP:-30}"
PREVIEW_FRONTEND_MAX="${PREVIEW_FRONTEND_MAX:-40}"
MIGRATION_FRONTEND_MAX="${MIGRATION_FRONTEND_MAX:-8}"
PREVIEW_BACKEND_MAX="${PREVIEW_BACKEND_MAX:-8}"
MIGRATION_BACKEND_MAX="${MIGRATION_BACKEND_MAX:-4}"
PROXYSQL_WAIT_TIMEOUT_MS="${PROXYSQL_WAIT_TIMEOUT_MS:-600000}"
PUBLIC_PROXYSQL_HOST="${PUBLIC_PROXYSQL_HOST:-acrocatranch.com}"
PUBLIC_PROXYSQL_PORT="${PUBLIC_PROXYSQL_PORT:-5544}"
OUTPUT_FILE="${OUTPUT_FILE:-/mnt/user/pc/kindrobots-db-isolation.env}"
MARIADB_CONNECTION_RESERVE="${MARIADB_CONNECTION_RESERVE:-30}"

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

for value in "$APP_DB_USER" "$PREVIEW_DB_USER" "$MIGRATION_DB_USER"; do
  [[ "$value" =~ ^[A-Za-z0-9_.@-]+$ ]] || fail "unsupported database username: $value"
done

for value in "$PRODUCTION_HOSTGROUP" "$PREVIEW_HOSTGROUP" "$MIGRATION_HOSTGROUP" \
  "$PREVIEW_FRONTEND_MAX" "$MIGRATION_FRONTEND_MAX" "$PREVIEW_BACKEND_MAX" \
  "$MIGRATION_BACKEND_MAX" "$PROXYSQL_WAIT_TIMEOUT_MS" "$PUBLIC_PROXYSQL_PORT" \
  "$MARIADB_CONNECTION_RESERVE"; do
  [[ "$value" =~ ^[0-9]+$ ]] || fail "expected an integer, got: $value"
done

[[ "$PRODUCTION_HOSTGROUP" != "$PREVIEW_HOSTGROUP" ]] || fail 'Preview hostgroup must differ from production'
[[ "$PRODUCTION_HOSTGROUP" != "$MIGRATION_HOSTGROUP" ]] || fail 'Migration hostgroup must differ from production'
[[ "$PREVIEW_HOSTGROUP" != "$MIGRATION_HOSTGROUP" ]] || fail 'Preview and migration hostgroups must differ'
[[ "$PROXYSQL_WAIT_TIMEOUT_MS" -ge 300000 ]] || fail 'ProxySQL wait timeout must remain at least 5 minutes'

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

mariadb_user_exists() {
  local username="$1"
  mariadb_query "SELECT COUNT(*) FROM mysql.user WHERE User='${username}' AND Host='%';"
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
PREVIEW_DB_PASSWORD="${PREVIEW_DB_PASSWORD:-}"
MIGRATION_DB_PASSWORD="${MIGRATION_DB_PASSWORD:-}"

prod_user_row="$(proxysql_query "
SELECT default_schema, use_ssl
FROM runtime_mysql_users
WHERE username='${APP_DB_USER}' AND frontend=1
LIMIT 1;
")"
[[ -n "$prod_user_row" ]] || fail "ProxySQL runtime user ${APP_DB_USER} was not found"

IFS=$'\t' read -r DATABASE_NAME PROD_USE_SSL <<<"$prod_user_row"
DATABASE_NAME="${DATABASE_NAME:-kindblank_fresh}"
PROD_USE_SSL="${PROD_USE_SSL:-0}"
[[ "$DATABASE_NAME" =~ ^[A-Za-z0-9_]+$ ]] || fail "unsupported database name: $DATABASE_NAME"
[[ "$PROD_USE_SSL" =~ ^[01]$ ]] || fail "unexpected use_ssl value for ${APP_DB_USER}: $PROD_USE_SSL"

prod_backend_count="$(proxysql_query "SELECT COUNT(*) FROM mysql_servers WHERE hostgroup_id=${PRODUCTION_HOSTGROUP};")"
[[ "$prod_backend_count" -gt 0 ]] || fail "production hostgroup ${PRODUCTION_HOSTGROUP} has no backend servers"

for target_hostgroup in "$PREVIEW_HOSTGROUP" "$MIGRATION_HOSTGROUP"; do
  foreign_rows="$(proxysql_query "
SELECT COUNT(*)
FROM mysql_servers AS target
WHERE target.hostgroup_id=${target_hostgroup}
  AND NOT EXISTS (
    SELECT 1
    FROM mysql_servers AS prod
    WHERE prod.hostgroup_id=${PRODUCTION_HOSTGROUP}
      AND prod.hostname=target.hostname
      AND prod.port=target.port
  );
")"
  [[ "$foreign_rows" == '0' ]] || fail \
    "hostgroup ${target_hostgroup} already contains backend rows unrelated to production hostgroup ${PRODUCTION_HOSTGROUP}"
done

generic_routing_rules="$(proxysql_query "
SELECT COUNT(*)
FROM mysql_query_rules
WHERE active=1
  AND (username IS NULL OR username='')
  AND destination_hostgroup IS NOT NULL;
")"
[[ "$generic_routing_rules" == '0' ]] || fail \
  "found ${generic_routing_rules} active generic ProxySQL query rule(s) with destination hostgroups; review routing before isolating users"

mariadb_global_max="$(mariadb_query 'SELECT @@GLOBAL.max_connections;')"
prod_backend_max="$(proxysql_query "SELECT COALESCE(SUM(max_connections),0) FROM mysql_servers WHERE hostgroup_id=${PRODUCTION_HOSTGROUP};")"
planned_backend_max=$((
  prod_backend_max +
  prod_backend_count * PREVIEW_BACKEND_MAX +
  prod_backend_count * MIGRATION_BACKEND_MAX
))
backend_budget=$((mariadb_global_max - MARIADB_CONNECTION_RESERVE))
[[ "$planned_backend_max" -le "$backend_budget" ]] || fail \
  "planned ProxySQL backend maxima total ${planned_backend_max}, exceeding MariaDB budget ${backend_budget} (${mariadb_global_max} max minus ${MARIADB_CONNECTION_RESERVE} reserve)"

preview_exists="$(mariadb_user_exists "$PREVIEW_DB_USER")"
migration_exists="$(mariadb_user_exists "$MIGRATION_DB_USER")"

if [[ "$preview_exists" != '0' && -z "$PREVIEW_DB_PASSWORD" ]]; then
  fail "MariaDB user ${PREVIEW_DB_USER}@% already exists but PREVIEW_DB_PASSWORD is unavailable; reuse $OUTPUT_FILE or provide PREVIEW_DB_PASSWORD explicitly"
fi
if [[ "$migration_exists" != '0' && -z "$MIGRATION_DB_PASSWORD" ]]; then
  fail "MariaDB user ${MIGRATION_DB_USER}@% already exists but MIGRATION_DB_PASSWORD is unavailable; reuse $OUTPUT_FILE or provide MIGRATION_DB_PASSWORD explicitly"
fi

[[ -n "$PREVIEW_DB_PASSWORD" ]] || PREVIEW_DB_PASSWORD="$(openssl rand -hex 24)"
[[ -n "$MIGRATION_DB_PASSWORD" ]] || MIGRATION_DB_PASSWORD="$(openssl rand -hex 24)"
[[ "$PREVIEW_DB_PASSWORD" =~ ^[A-Za-z0-9]+$ ]] || fail 'Preview password must contain only letters and digits for safe non-interactive provisioning'
[[ "$MIGRATION_DB_PASSWORD" =~ ^[A-Za-z0-9]+$ ]] || fail 'Migration password must contain only letters and digits for safe non-interactive provisioning'

preview_url="mysql://${PREVIEW_DB_USER}:${PREVIEW_DB_PASSWORD}@${PUBLIC_PROXYSQL_HOST}:${PUBLIC_PROXYSQL_PORT}/${DATABASE_NAME}"
migration_url="mysql://${MIGRATION_DB_USER}:${MIGRATION_DB_PASSWORD}@${PUBLIC_PROXYSQL_HOST}:${PUBLIC_PROXYSQL_PORT}/${DATABASE_NAME}"

info 'Kind Robots Vercel database isolation'
info "Mode: ${MODE}"
info "Database: ${DATABASE_NAME}"
info "Production lane: user=${APP_DB_USER} hostgroup=${PRODUCTION_HOSTGROUP} backendMax=${prod_backend_max}"
info "Preview lane: user=${PREVIEW_DB_USER} frontendMax=${PREVIEW_FRONTEND_MAX} hostgroup=${PREVIEW_HOSTGROUP} backendMax/server=${PREVIEW_BACKEND_MAX} privileges=read-only"
info "Migration lane: user=${MIGRATION_DB_USER} frontendMax=${MIGRATION_FRONTEND_MAX} hostgroup=${MIGRATION_HOSTGROUP} backendMax/server=${MIGRATION_BACKEND_MAX} privileges=schema-all"
info "ProxySQL client idle timeout: ${PROXYSQL_WAIT_TIMEOUT_MS}ms"
info "MariaDB backend budget check: planned=${planned_backend_max}, allowed=${backend_budget}, global=${mariadb_global_max}"
info 'Passwords and URLs are intentionally not printed.'

if [[ "$MODE" != 'apply' ]]; then
  info ''
  info 'Dry run complete. Re-run with --apply to provision these lanes.'
  exit 0
fi

snapshot_dir="$(dirname "$OUTPUT_FILE")"
mkdir -p "$snapshot_dir"
chmod 700 "$snapshot_dir" 2>/dev/null || true
snapshot_file="${OUTPUT_FILE%.env}-before-$(date -u +%Y%m%dT%H%M%SZ).txt"
{
  printf 'ProxySQL users (password omitted)\n'
  proxysql_query "SELECT username,active,use_ssl,default_hostgroup,default_schema,schema_locked,transaction_persistent,frontend,backend,max_connections FROM mysql_users ORDER BY username,frontend DESC;"
  printf '\nProxySQL servers\n'
  proxysql_query "SELECT hostgroup_id,hostname,port,status,weight,max_connections,use_ssl,comment FROM mysql_servers ORDER BY hostgroup_id,hostname,port;"
  printf '\nProxySQL wait timeout\n'
  proxysql_query "SELECT variable_name,variable_value FROM global_variables WHERE variable_name='mysql-wait_timeout';"
} >"$snapshot_file"
chmod 600 "$snapshot_file"

info "Saved pre-change configuration snapshot: $snapshot_file"

mariadb_query "
CREATE USER IF NOT EXISTS '${PREVIEW_DB_USER}'@'%' IDENTIFIED BY '${PREVIEW_DB_PASSWORD}';
ALTER USER '${PREVIEW_DB_USER}'@'%' IDENTIFIED BY '${PREVIEW_DB_PASSWORD}';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${PREVIEW_DB_USER}'@'%';
GRANT USAGE ON *.* TO '${PREVIEW_DB_USER}'@'%' WITH MAX_USER_CONNECTIONS ${PREVIEW_BACKEND_MAX};
GRANT SELECT, SHOW VIEW ON \`${DATABASE_NAME}\`.* TO '${PREVIEW_DB_USER}'@'%';

CREATE USER IF NOT EXISTS '${MIGRATION_DB_USER}'@'%' IDENTIFIED BY '${MIGRATION_DB_PASSWORD}';
ALTER USER '${MIGRATION_DB_USER}'@'%' IDENTIFIED BY '${MIGRATION_DB_PASSWORD}';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${MIGRATION_DB_USER}'@'%';
GRANT USAGE ON *.* TO '${MIGRATION_DB_USER}'@'%' WITH MAX_USER_CONNECTIONS ${MIGRATION_BACKEND_MAX};
GRANT ALL PRIVILEGES ON \`${DATABASE_NAME}\`.* TO '${MIGRATION_DB_USER}'@'%';
"

proxysql_query "
INSERT OR REPLACE INTO mysql_servers (
  hostgroup_id, hostname, port, status, weight, max_connections,
  max_replication_lag, use_ssl, comment
)
SELECT ${PREVIEW_HOSTGROUP}, hostname, port, status, weight, ${PREVIEW_BACKEND_MAX},
       max_replication_lag, use_ssl, 'Kind Robots Vercel Preview isolation'
FROM mysql_servers
WHERE hostgroup_id=${PRODUCTION_HOSTGROUP};

INSERT OR REPLACE INTO mysql_servers (
  hostgroup_id, hostname, port, status, weight, max_connections,
  max_replication_lag, use_ssl, comment
)
SELECT ${MIGRATION_HOSTGROUP}, hostname, port, status, weight, ${MIGRATION_BACKEND_MAX},
       max_replication_lag, use_ssl, 'Kind Robots production migration isolation'
FROM mysql_servers
WHERE hostgroup_id=${PRODUCTION_HOSTGROUP};

UPDATE mysql_users
SET password=MYSQL_NATIVE_PASSWORD('${PREVIEW_DB_PASSWORD}'),
    active=1,
    use_ssl=${PROD_USE_SSL},
    default_hostgroup=${PREVIEW_HOSTGROUP},
    default_schema='${DATABASE_NAME}',
    schema_locked=1,
    transaction_persistent=1,
    fast_forward=0,
    backend=1,
    frontend=1,
    max_connections=${PREVIEW_FRONTEND_MAX}
WHERE username='${PREVIEW_DB_USER}';
INSERT INTO mysql_users (
  username,password,active,use_ssl,default_hostgroup,default_schema,
  schema_locked,transaction_persistent,fast_forward,backend,frontend,max_connections
)
SELECT '${PREVIEW_DB_USER}',MYSQL_NATIVE_PASSWORD('${PREVIEW_DB_PASSWORD}'),1,${PROD_USE_SSL},
       ${PREVIEW_HOSTGROUP},'${DATABASE_NAME}',1,1,0,1,1,${PREVIEW_FRONTEND_MAX}
WHERE NOT EXISTS (SELECT 1 FROM mysql_users WHERE username='${PREVIEW_DB_USER}');

UPDATE mysql_users
SET password=MYSQL_NATIVE_PASSWORD('${MIGRATION_DB_PASSWORD}'),
    active=1,
    use_ssl=${PROD_USE_SSL},
    default_hostgroup=${MIGRATION_HOSTGROUP},
    default_schema='${DATABASE_NAME}',
    schema_locked=1,
    transaction_persistent=1,
    fast_forward=0,
    backend=1,
    frontend=1,
    max_connections=${MIGRATION_FRONTEND_MAX}
WHERE username='${MIGRATION_DB_USER}';
INSERT INTO mysql_users (
  username,password,active,use_ssl,default_hostgroup,default_schema,
  schema_locked,transaction_persistent,fast_forward,backend,frontend,max_connections
)
SELECT '${MIGRATION_DB_USER}',MYSQL_NATIVE_PASSWORD('${MIGRATION_DB_PASSWORD}'),1,${PROD_USE_SSL},
       ${MIGRATION_HOSTGROUP},'${DATABASE_NAME}',1,1,0,1,1,${MIGRATION_FRONTEND_MAX}
WHERE NOT EXISTS (SELECT 1 FROM mysql_users WHERE username='${MIGRATION_DB_USER}');

UPDATE global_variables
SET variable_value='${PROXYSQL_WAIT_TIMEOUT_MS}'
WHERE variable_name='mysql-wait_timeout';

LOAD MYSQL SERVERS TO RUNTIME;
SAVE MYSQL SERVERS TO DISK;
LOAD MYSQL USERS TO RUNTIME;
SAVE MYSQL USERS TO DISK;
LOAD MYSQL VARIABLES TO RUNTIME;
SAVE MYSQL VARIABLES TO DISK;
"

runtime_preview="$(proxysql_query "SELECT default_hostgroup,max_connections FROM runtime_mysql_users WHERE username='${PREVIEW_DB_USER}' AND frontend=1 LIMIT 1;")"
runtime_migration="$(proxysql_query "SELECT default_hostgroup,max_connections FROM runtime_mysql_users WHERE username='${MIGRATION_DB_USER}' AND frontend=1 LIMIT 1;")"
runtime_wait_timeout="$(proxysql_query "SELECT variable_value FROM runtime_global_variables WHERE variable_name='mysql-wait_timeout';")"
preview_server_count="$(proxysql_query "SELECT COUNT(*) FROM runtime_mysql_servers WHERE hostgroup_id=${PREVIEW_HOSTGROUP} AND max_connections=${PREVIEW_BACKEND_MAX};")"
migration_server_count="$(proxysql_query "SELECT COUNT(*) FROM runtime_mysql_servers WHERE hostgroup_id=${MIGRATION_HOSTGROUP} AND max_connections=${MIGRATION_BACKEND_MAX};")"

[[ "$runtime_preview" == "${PREVIEW_HOSTGROUP}"$'\t'"${PREVIEW_FRONTEND_MAX}" ]] || fail "Preview runtime user verification failed: ${runtime_preview:-missing}"
[[ "$runtime_migration" == "${MIGRATION_HOSTGROUP}"$'\t'"${MIGRATION_FRONTEND_MAX}" ]] || fail "Migration runtime user verification failed: ${runtime_migration:-missing}"
[[ "$runtime_wait_timeout" == "$PROXYSQL_WAIT_TIMEOUT_MS" ]] || fail "ProxySQL wait timeout verification failed: ${runtime_wait_timeout:-missing}"
[[ "$preview_server_count" == "$prod_backend_count" ]] || fail "Preview hostgroup verification failed: expected ${prod_backend_count} backend row(s), got ${preview_server_count}"
[[ "$migration_server_count" == "$prod_backend_count" ]] || fail "Migration hostgroup verification failed: expected ${prod_backend_count} backend row(s), got ${migration_server_count}"

umask 077
cat >"$OUTPUT_FILE" <<EOF
# Kind Robots database isolation credentials generated $(date -u +%Y-%m-%dT%H:%M:%SZ)
# Keep this file private. It is intended only as a handoff into Vercel environment settings.
PREVIEW_DB_USER=${PREVIEW_DB_USER}
PREVIEW_DB_PASSWORD=${PREVIEW_DB_PASSWORD}
MIGRATION_DB_USER=${MIGRATION_DB_USER}
MIGRATION_DB_PASSWORD=${MIGRATION_DB_PASSWORD}
DATABASE_NAME=${DATABASE_NAME}
PUBLIC_PROXYSQL_HOST=${PUBLIC_PROXYSQL_HOST}
PUBLIC_PROXYSQL_PORT=${PUBLIC_PROXYSQL_PORT}
VERCEL_PREVIEW_DATABASE_URL=${preview_url}
VERCEL_PRODUCTION_MIGRATION_DATABASE_URL=${migration_url}
EOF
chmod 600 "$OUTPUT_FILE"

info ''
info 'Provisioning succeeded.'
info "Credential handoff file: $OUTPUT_FILE (mode 600; contents not printed)"
info "Preview user ${PREVIEW_DB_USER} is read-only and isolated to hostgroup ${PREVIEW_HOSTGROUP}."
info "Migration user ${MIGRATION_DB_USER} is isolated to hostgroup ${MIGRATION_HOSTGROUP}."
info "ProxySQL mysql-wait_timeout is now ${PROXYSQL_WAIT_TIMEOUT_MS}ms."
info ''
info 'Next: set Vercel Preview DATABASE_URL from VERCEL_PREVIEW_DATABASE_URL and'
info 'set Vercel Production MIGRATION_DATABASE_URL from VERCEL_PRODUCTION_MIGRATION_DATABASE_URL,'
info 'then redeploy both environments and run scripts/proxysql-capacity-diagnostics.sh.'
