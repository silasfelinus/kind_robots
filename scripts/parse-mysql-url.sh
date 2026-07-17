#!/usr/bin/env bash
# scripts/parse-mysql-url.sh <mysql-url> <field>
#
# Shared by .github/workflows/fallback-snapshot.yml's "Connectivity probe"
# and "Dump and encrypt database" steps (kind-robots/t-036 in conductor's
# roadmap.yaml) -- both steps parsed a `mysql://user:pass@host:port/db` URL
# by hand with near-identical shell substring slicing, including the same
# "default to port 3306 when the URL omits one" conditional. That duplicated
# logic had no regression test; a future edit to it was only ever verified
# by hand or by pushing a commit and watching the nightly cron run.
#
# <field> is one of: user, password, host, port, name. Prints that single
# field to stdout. No network I/O -- this only ever touches the string
# it's given, and the caller captures it via `$(...)` rather than `eval` so
# a password containing shell metacharacters can't be re-interpreted as
# code.
set -euo pipefail

url="$1"
field="$2"

proto_stripped="${url#mysql://}"
creds="${proto_stripped%%@*}"
rest="${proto_stripped#*@}"
db_user="${creds%%:*}"
db_pass="${creds#*:}"
hostport="${rest%%/*}"
db_host="${hostport%%:*}"
db_port="${hostport#*:}"
[ "$db_port" = "$db_host" ] && db_port=3306
db_and_query="${rest#*/}"
db_name="${db_and_query%%\?*}"

case "$field" in
  user) printf '%s' "$db_user" ;;
  password) printf '%s' "$db_pass" ;;
  host) printf '%s' "$db_host" ;;
  port) printf '%s' "$db_port" ;;
  name) printf '%s' "$db_name" ;;
  *)
    echo "unknown field '$field' (expected one of: user, password, host, port, name)" >&2
    exit 1
    ;;
esac
