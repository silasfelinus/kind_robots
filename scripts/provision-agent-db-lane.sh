#!/usr/bin/env bash
# Provision a dedicated ProxySQL/MariaDB lane for coding agents such as Claude.
# Run on Alexandria from the Kind Robots repository.
#
# Dry run (default):
#   bash scripts/provision-agent-db-lane.sh
#
# Apply:
#   bash scripts/provision-agent-db-lane.sh --apply
#
# Optional overrides:
#   PROXYSQL_CONTAINER=proxysql
#   MARIADB_CONTAINER=mariadb-kindrobots2
#   APP_DB_USER=kindrobot
#   AGENT_DB_USER=kindrobot_agent
#   PRODUCTION_HOSTGROUP=10
#   AGENT_HOSTGROUP=40
#   AGENT_FRONTEND_MAX=20
#   AGENT_BACKEND_MAX=6
#   PUBLIC_PROXYSQL_HOST=acrocatranch.com
#   PUBLIC_PROXYSQL_PORT=5544
#   OUTPUT_FILE=/mnt/user/pc/kindrobots-db-agent/kindrobots-db-agent.env
#   MARIADB_CONNECTION_RESERVE=30
#
# The agent account is deliberately application-read/write only. It receives
# SELECT, INSERT, UPDATE, DELETE, and SHOW VIEW on the application schema, but
# no schema-changing privileges. Existing credentials are never silently
# rotated unless their password is available from OUTPUT_FILE or the
# AGENT_DB_PASSWORD environment variable.

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
AGENT_DB_USER="${AGENT_DB_USER:-kindrobot_agent}"
PRODUCTION_HOSTGROUP="${PRODUCTION_HOSTGROUP:-10}"
AGENT_HOSTGROUP="${AGENT_HOSTGROUP:-40}"
AGENT_FRONTEND_MAX="${AGENT_FRONTEND_MAX:-20}"
AGENT_BACKEND_MAX="${AGENT_BACKEND_MAX:-6}"
PUBLIC_PROXYSQL_HOST="${PUBLIC_PROXYSQL_HOST:-acrocatranch.com}"
PUBLIC_PROXYSQL_PORT="${PUBLIC_PROXYSQL_PORT:-5544}"
OUTPUT_FILE="${OUTPUT_FILE:-/mnt/user/pc/kindrobots-db-agent/kindrobots-db-agent.env}"
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

for value in "$APP_DB_USER" "$AGENT_DB_USER"; do
  [[ "$value" =~ ^[A-Za-z0-9_.@-]+$ ]] || fail "unsupported database username: $value"
done

[[ "$APP_DB_USER" != "$AGENT_DB_USER" ]] || fail 'Agent database user must differ from the production application user'

for value in "$PRODUCTION_HOSTGROUP" "$AGENT_HOSTGROUP" "$AGENT_FRONTEND_MAX" \
  "$AGENT_BACKEND_MAX" "$PUBLIC_PROXYSQL_PORT" "$MARIADB_CONNECTION_RESERVE"; do
  [[ "$value" =~ ^[0-9]+$ ]] || fail "expected an integer, got: $value"
done

[[ "$PRODUCTION_HOSTGROUP" != "$AGENT_HOSTGROUP" ]] || fail 'Agent hostgroup must differ from production'
[[ "$AGENT_FRONTEND_MAX" -ge 1 ]] || fail 'Agent frontend max must be at least 1'
[[ "$AGENT_BACKEND_MAX" -ge 1 ]] || fail 'Agent backend max must be at least 1'

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
AGENT_DB_PASSWORD="${AGENT_DB_PASSWORD:-}"

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

foreign_rows="$(proxysql_query "
SELECT COUNT(*)
FROM mysql_servers AS target
WHERE target.hostgroup_id=${AGENT_HOSTGROUP}
  AND NOT EXISTS (
    SELECT 1
    FROM mysql_servers AS prod
    WHERE prod.hostgroup_id=${PRODUCTION_HOSTGROUP}
      AND prod.hostname=target.hostname
      AND prod.port=target.port
  );
")"
[[ "$foreign_rows" == '0' ]] || fail \
  "hostgroup ${AGENT_HOSTGROUP} already contains backend rows unrelated to production hostgroup ${PRODUCTION_HOSTGROUP}"

generic_routing_rules="$(proxysql_query "
SELECT COUNT(*)
FROM mysql_query_rules
WHERE active=1
  AND (username IS NULL OR username='')
  AND destination_hostgroup IS NOT NULL;
")"
[[ "$generic_routing_rules" == '0' ]] || fail \
  "found ${generic_routing_rules} active generic ProxySQL query rule(s) with destination hostgroups; review routing before isolating agent traffic"

mariadb_global_max="$(mariadb_query 'SELECT @@GLOBAL.max_connections;')"
current_backend_max="$(proxysql_query 'SELECT COALESCE(SUM(max_connections),0) FROM mysql_servers;')"
existing_agent_backend_max="$(proxysql_query "SELECT COALESCE(SUM(max_connections),0) FROM mysql_servers WHERE hostgroup_id=${AGENT_HOSTGROUP};")"
planned_agent_backend_max=$((prod_backend_count * AGENT_BACKEND_MAX))
planned_backend_max=$((current_backend_max - existing_agent_backend_max + planned_agent_backend_max))
backend_budget=$((mariadb_global_max - MARIADB_CONNECTION_RESERVE))
[[ "$planned_backend_max" -le "$backend_budget" ]] || fail \
  "planned ProxySQL backend maxima total ${planned_backend_max}, exceeding MariaDB budget ${backend_budget} (${mariadb_global_max} max minus ${MARIADB_CONNECTION_RESERVE} reserve)"

agent_exists="$(mariadb_query "SELECT COUNT(*) FROM mysql.user WHERE User='${AGENT_DB_USER}' AND Host='%';")"
if [[ "$agent_exists" != '0' && -z "$AGENT_DB_PASSWORD" ]]; then
  fail "MariaDB user ${AGENT_DB_USER}@% already exists but AGENT_DB_PASSWORD is unavailable; reuse $OUTPUT_FILE or provide AGENT_DB_PASSWORD explicitly"
fi

[[ -n "$AGENT_DB_PASSWORD" ]] || AGENT_DB_PASSWORD="$(openssl rand -hex 24)"
[[ "$AGENT_DB_PASSWORD" =~ ^[A-Za-z0-9]+$ ]] || fail 'Agent password must contain only letters and digits for safe non-interactive provisioning'

agent_url="mysql://${AGENT_DB_USER}:${AGENT_DB_PASSWORD}@${PUBLIC_PROXYSQL_HOST}:${PUBLIC_PROXYSQL_PORT}/${DATABASE_NAME}"

info 'Kind Robots coding-agent database lane'
info "Mode: ${MODE}"
info "Database: ${DATABASE_NAME}"
info "Production lane: user=${APP_DB_USER} hostgroup=${PRODUCTION_HOSTGROUP}"
info "Agent lane: user=${AGENT_DB_USER} frontendMax=${AGENT_FRONTEND_MAX} hostgroup=${AGENT_HOSTGROUP} backendMax/server=${AGENT_BACKEND_MAX}"
info 'Agent privileges: SELECT, INSERT, UPDATE, DELETE, SHOW VIEW'
info 'Schema-changing privileges: none'
info "MariaDB backend budget check: planned=${planned_backend_max}, allowed=${backend_budget}, global=${mariadb_global_max}"
info 'Passwords and URLs are intentionally not printed.'

if [[ "$MODE" != 'apply' ]]; then
  info ''
  info 'Dry run complete. Re-run with --apply to provision the agent lane.'
  exit 0
fi

output_dir="$(dirname "$OUTPUT_FILE")"
mkdir -p "$output_dir"
chmod 700 "$output_dir"
snapshot_file="${OUTPUT_FILE%.env}-before-$(date -u +%Y%m%dT%H%M%SZ).txt"
{
  printf 'ProxySQL agent user (password omitted)\n'
  proxysql_query "SELECT username,active,use_ssl,default_hostgroup,default_schema,schema_locked,transaction_persistent,frontend,backend,max_connections FROM mysql_users WHERE username='${AGENT_DB_USER}';"
  printf '\nProxySQL target servers\n'
  proxysql_query "SELECT hostgroup_id,hostname,port,status,weight,max_connections,use_ssl,comment FROM mysql_servers WHERE hostgroup_id=${AGENT_HOSTGROUP} ORDER BY hostname,port;"
  printf '\nMariaDB agent grants before change\n'
  mariadb_query "SHOW GRANTS FOR '${AGENT_DB_USER}'@'%';" 2>/dev/null || true
} >"$snapshot_file"
chmod 600 "$snapshot_file"
info "Saved pre-change configuration snapshot: $snapshot_file"

mariadb_query "
CREATE USER IF NOT EXISTS '${AGENT_DB_USER}'@'%' IDENTIFIED BY '${AGENT_DB_PASSWORD}';
ALTER USER '${AGENT_DB_USER}'@'%' IDENTIFIED BY '${AGENT_DB_PASSWORD}';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${AGENT_DB_USER}'@'%';
GRANT USAGE ON *.* TO '${AGENT_DB_USER}'@'%' WITH MAX_USER_CONNECTIONS ${AGENT_BACKEND_MAX};
GRANT SELECT, INSERT, UPDATE, DELETE, SHOW VIEW ON \`${DATABASE_NAME}\`.* TO '${AGENT_DB_USER}'@'%';
"

proxysql_query "
DELETE FROM mysql_servers WHERE hostgroup_id=${AGENT_HOSTGROUP};
INSERT INTO mysql_servers (
  hostgroup_id,hostname,port,gtid_port,status,weight,compression,
  max_connections,max_replication_lag,use_ssl,max_latency_ms,comment
)
SELECT ${AGENT_HOSTGROUP},hostname,port,gtid_port,status,weight,compression,
       ${AGENT_BACKEND_MAX},max_replication_lag,use_ssl,max_latency_ms,
       'Kind Robots coding-agent lane'
FROM mysql_servers
WHERE hostgroup_id=${PRODUCTION_HOSTGROUP};

UPDATE mysql_users
SET password=MYSQL_NATIVE_PASSWORD('${AGENT_DB_PASSWORD}'),
    active=1,
    use_ssl=${PROD_USE_SSL},
    default_hostgroup=${AGENT_HOSTGROUP},
    default_schema='${DATABASE_NAME}',
    schema_locked=1,
    transaction_persistent=1,
    fast_forward=0,
    backend=1,
    frontend=1,
    max_connections=${AGENT_FRONTEND_MAX}
WHERE username='${AGENT_DB_USER}';
INSERT INTO mysql_users (
  username,password,active,use_ssl,default_hostgroup,default_schema,
  schema_locked,transaction_persistent,fast_forward,backend,frontend,max_connections
)
SELECT '${AGENT_DB_USER}',MYSQL_NATIVE_PASSWORD('${AGENT_DB_PASSWORD}'),1,${PROD_USE_SSL},
       ${AGENT_HOSTGROUP},'${DATABASE_NAME}',1,1,0,1,1,${AGENT_FRONTEND_MAX}
WHERE NOT EXISTS (SELECT 1 FROM mysql_users WHERE username='${AGENT_DB_USER}');

LOAD MYSQL SERVERS TO RUNTIME;
SAVE MYSQL SERVERS TO DISK;
LOAD MYSQL USERS TO RUNTIME;
SAVE MYSQL USERS TO DISK;
"

runtime_agent="$(proxysql_query "SELECT default_hostgroup,max_connections FROM runtime_mysql_users WHERE username='${AGENT_DB_USER}' AND frontend=1 LIMIT 1;")"
agent_server_count="$(proxysql_query "SELECT COUNT(*) FROM runtime_mysql_servers WHERE hostgroup_id=${AGENT_HOSTGROUP} AND max_connections=${AGENT_BACKEND_MAX};")"
dangerous_privileges="$(mariadb_query "
SELECT COUNT(*)
FROM information_schema.SCHEMA_PRIVILEGES
WHERE GRANTEE=CONCAT(CHAR(39),'${AGENT_DB_USER}',CHAR(39),'@',CHAR(39),'%',CHAR(39))
  AND TABLE_SCHEMA='${DATABASE_NAME}'
  AND PRIVILEGE_TYPE IN (
    'ALTER','ALTER ROUTINE','CREATE','CREATE ROUTINE','CREATE TEMPORARY TABLES',
    'CREATE VIEW','DROP','EVENT','EXECUTE','INDEX','REFERENCES','TRIGGER'
  );
")"
expected_privileges="$(mariadb_query "
SELECT COUNT(*)
FROM information_schema.SCHEMA_PRIVILEGES
WHERE GRANTEE=CONCAT(CHAR(39),'${AGENT_DB_USER}',CHAR(39),'@',CHAR(39),'%',CHAR(39))
  AND TABLE_SCHEMA='${DATABASE_NAME}'
  AND PRIVILEGE_TYPE IN ('SELECT','INSERT','UPDATE','DELETE','SHOW VIEW');
")"

[[ "$runtime_agent" == "${AGENT_HOSTGROUP}"$'\t'"${AGENT_FRONTEND_MAX}" ]] || fail "Agent runtime user verification failed: ${runtime_agent:-missing}"
[[ "$agent_server_count" == "$prod_backend_count" ]] || fail "Agent hostgroup verification failed: expected ${prod_backend_count} backend row(s), got ${agent_server_count}"
[[ "$dangerous_privileges" == '0' ]] || fail "Agent MariaDB user unexpectedly has ${dangerous_privileges} schema-changing privilege(s)"
[[ "$expected_privileges" == '5' ]] || fail 'Agent MariaDB user is missing one or more expected application privileges'

# Verify authentication through ProxySQL without printing the URL or password.
docker exec \
  -e MYSQL_PWD="$AGENT_DB_PASSWORD" \
  -e KR_AGENT_USER="$AGENT_DB_USER" \
  -e KR_AGENT_DB="$DATABASE_NAME" \
  "$PROXYSQL_CONTAINER" sh -lc '
    client="$(command -v mariadb || command -v mysql || true)"
    [ -n "$client" ] || exit 127
    "$client" --protocol=tcp -h127.0.0.1 -P6033 -u"$KR_AGENT_USER" "$KR_AGENT_DB" --batch --skip-column-names -e "SELECT 1;" >/dev/null
  ' || fail 'Agent authentication through ProxySQL failed'

umask 077
cat >"$OUTPUT_FILE" <<EOF
# Kind Robots coding-agent database credentials generated $(date -u +%Y-%m-%dT%H:%M:%SZ)
# Keep this file private. For Claude, set DATABASE_URL to AGENT_DATABASE_URL.
AGENT_DB_USER=${AGENT_DB_USER}
AGENT_DB_PASSWORD=${AGENT_DB_PASSWORD}
DATABASE_NAME=${DATABASE_NAME}
PUBLIC_PROXYSQL_HOST=${PUBLIC_PROXYSQL_HOST}
PUBLIC_PROXYSQL_PORT=${PUBLIC_PROXYSQL_PORT}
AGENT_DATABASE_URL=${agent_url}
EOF
chmod 600 "$OUTPUT_FILE"

info ''
info 'Provisioning succeeded.'
info "Credential handoff file: $OUTPUT_FILE (mode 600; contents not printed)"
info "Agent user ${AGENT_DB_USER} is isolated to hostgroup ${AGENT_HOSTGROUP}."
info 'Agent application read/write privileges verified; schema-changing privileges absent.'
info 'ProxySQL authentication verified.'
info ''
info "Next: replace Claude's existing DATABASE_URL with the AGENT_DATABASE_URL value."
info 'Do not give Claude MIGRATION_DATABASE_URL unless intentionally performing a migration.'
