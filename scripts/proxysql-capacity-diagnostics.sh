#!/usr/bin/env bash
# Read-only connection census for the Alexandria Kind Robots database path.
# Run on the Unraid host:
#   bash scripts/proxysql-capacity-diagnostics.sh
#
# Optional overrides:
#   PROXYSQL_CONTAINER=proxysql
#   MARIADB_CONTAINER=mariadb-kindrobots2
#   APP_DB_USER=kindrobot
#   PROXYSQL_ADMIN_USER=...
#   PROXYSQL_ADMIN_PASSWORD=...
#   MARIADB_ROOT_PASSWORD=...
#
# The script prints aggregate connection state only. It never prints passwords,
# runs KILL, changes runtime configuration, or restarts a container.

set -Eeuo pipefail

PROXYSQL_CONTAINER="${PROXYSQL_CONTAINER:-proxysql}"
MARIADB_CONTAINER="${MARIADB_CONTAINER:-mariadb-kindrobots2}"
APP_DB_USER="${APP_DB_USER:-kindrobot}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || fail 'docker is required on the Unraid host'

for container in "$PROXYSQL_CONTAINER" "$MARIADB_CONTAINER"; do
  running="$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)"
  [[ "$running" == 'true' ]] || fail "container $container is not running"
done

[[ "$APP_DB_USER" =~ ^[A-Za-z0-9_.@-]+$ ]] || fail 'APP_DB_USER contains unsupported characters'

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

proxysql_sql() {
  local title="$1"
  local sql="$2"
  printf '\n===== ProxySQL: %s =====\n' "$title"
  docker exec \
    -e MYSQL_PWD="$PROXYSQL_ADMIN_PASSWORD" \
    -e DIAG_SQL="$sql" \
    -e DIAG_USER="$PROXYSQL_ADMIN_USER" \
    "$PROXYSQL_CONTAINER" sh -lc '
      client="$(command -v mariadb || command -v mysql || true)"
      [ -n "$client" ] || { echo "No MariaDB/MySQL client in ProxySQL container" >&2; exit 1; }
      "$client" --protocol=tcp -h127.0.0.1 -P6032 -u"$DIAG_USER" --batch --raw -e "$DIAG_SQL"
    '
}

mariadb_sql() {
  local title="$1"
  local sql="$2"
  printf '\n===== MariaDB: %s =====\n' "$title"

  if [[ -n "$MARIADB_ROOT_PASSWORD" ]]; then
    docker exec \
      -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" \
      -e DIAG_SQL="$sql" \
      "$MARIADB_CONTAINER" sh -lc '
        client="$(command -v mariadb || command -v mysql || true)"
        [ -n "$client" ] || { echo "No MariaDB/MySQL client in MariaDB container" >&2; exit 1; }
        "$client" --protocol=socket -uroot --batch --raw -e "$DIAG_SQL"
      '
  else
    docker exec \
      -e DIAG_SQL="$sql" \
      "$MARIADB_CONTAINER" sh -lc '
        client="$(command -v mariadb || command -v mysql || true)"
        [ -n "$client" ] || { echo "No MariaDB/MySQL client in MariaDB container" >&2; exit 1; }
        "$client" --protocol=socket -uroot --batch --raw -e "$DIAG_SQL"
      ' || fail 'root login failed; set MARIADB_ROOT_PASSWORD for the diagnostic only'
  fi
}

proxysql_sql 'backend server limits and state' "
SELECT hostgroup_id, hostname, port, status, weight, max_connections,
       max_replication_lag, use_ssl, comment
FROM runtime_mysql_servers
ORDER BY hostgroup_id, hostname, port;
"

proxysql_sql 'application user limits' "
SELECT username, active, frontend, backend, default_hostgroup, default_schema,
       max_connections, transaction_persistent, fast_forward
FROM runtime_mysql_users
WHERE username = '${APP_DB_USER}'
ORDER BY frontend DESC, backend DESC;
"

proxysql_sql 'multiplexing and retention settings' "
SELECT variable_name, variable_value
FROM runtime_global_variables
WHERE variable_name IN (
  'mysql-multiplexing',
  'mysql-free_connections_pct',
  'mysql-connection_warming',
  'mysql-connection_delay_multiplex_ms',
  'mysql-auto_increment_delay_multiplex',
  'mysql-max_connections',
  'mysql-threads',
  'mysql-wait_timeout',
  'mysql-max_transaction_time',
  'mysql-threshold_resultset_size',
  'mysql-connect_timeout_server',
  'mysql-connect_retries_on_failure'
)
ORDER BY variable_name;
"

proxysql_sql 'backend pool usage' "
SELECT hostgroup, srv_host, srv_port, status, ConnUsed, ConnFree, ConnOK,
       ConnERR, MaxConnUsed, Queries, Latency_us
FROM stats_mysql_connection_pool
ORDER BY hostgroup, srv_host, srv_port;
"

proxysql_sql 'frontend user counters' "
SELECT *
FROM stats_mysql_users
WHERE username = '${APP_DB_USER}';
"

proxysql_sql 'frontend sessions by pinning state' "
SELECT user, hostgroup, command, transaction_found, multiplex_disabled,
       COUNT(*) AS sessions, MAX(time_ms) AS oldest_ms
FROM stats_mysql_processlist
WHERE user = '${APP_DB_USER}'
GROUP BY user, hostgroup, command, transaction_found, multiplex_disabled
ORDER BY sessions DESC, oldest_ms DESC;
"

mariadb_sql 'global and account ceilings' "
SELECT @@GLOBAL.max_connections AS global_max_connections,
       @@GLOBAL.max_user_connections AS global_default_user_limit;
SELECT User, Host, max_user_connections
FROM mysql.user
WHERE User = '${APP_DB_USER}';
SHOW GLOBAL STATUS
WHERE Variable_name IN (
  'Threads_connected',
  'Threads_running',
  'Max_used_connections',
  'Connection_errors_max_connections',
  'Aborted_clients',
  'Aborted_connects'
);
"

mariadb_sql 'kindrobot sessions by source and state' "
SELECT SUBSTRING_INDEX(HOST, ':', 1) AS source_host,
       COMMAND,
       COALESCE(STATE, '') AS state,
       COUNT(*) AS sessions,
       MAX(TIME) AS oldest_seconds
FROM information_schema.PROCESSLIST
WHERE USER = '${APP_DB_USER}'
GROUP BY source_host, COMMAND, COALESCE(STATE, '')
ORDER BY sessions DESC, oldest_seconds DESC;

SELECT COUNT(*) AS total_sessions,
       COALESCE(SUM(COMMAND = 'Sleep'), 0) AS sleeping_sessions,
       COALESCE(SUM(COMMAND <> 'Sleep'), 0) AS active_sessions
FROM information_schema.PROCESSLIST
WHERE USER = '${APP_DB_USER}';
"

mariadb_sql 'open kindrobot transactions' "
SELECT p.ID, SUBSTRING_INDEX(p.HOST, ':', 1) AS source_host, p.DB, p.COMMAND,
       p.TIME AS process_seconds, t.trx_state, t.trx_started,
       t.trx_rows_locked, t.trx_rows_modified
FROM information_schema.INNODB_TRX AS t
JOIN information_schema.PROCESSLIST AS p
  ON p.ID = t.trx_mysql_thread_id
WHERE p.USER = '${APP_DB_USER}'
ORDER BY t.trx_started;
"

cat <<'EOF'

===== Reading the result =====
- MariaDB source_host matching the ProxySQL container/network means ProxySQL owns
  those backend sessions. Other source hosts are direct bypass clients.
- High ConnFree with low ConnUsed means ProxySQL is retaining idle backend
  sessions. Capture the output before changing free_connections_pct or limits.
- High transaction_found or multiplex_disabled counts explain why frontend
  sessions cannot share backend connections.
- runtime_mysql_servers.max_connections should remain below the MariaDB
  kindrobot max_user_connections limit, leaving separate headroom for migrations
  and emergency direct access.
EOF
