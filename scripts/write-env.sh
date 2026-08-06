#!/usr/bin/env bash
# Write the .env a maintenance box needs, prompting for each value.
#
# Exists because the Unraid web terminal is an xterm.js canvas that mobile
# browsers refuse to paste into, which makes a multi-line export block painful
# to enter by hand from a phone.
#
# NO DEFAULTS FOR INFRASTRUCTURE VALUES, deliberately. The first version of this
# script shipped the real host, port, database name and user as prompt defaults
# "for convenience", and GitGuardian flagged it immediately -- correctly. A
# tailnet address, a port, a schema name and a username are not secrets in the
# credential sense, but publishing them narrows an attacker's problem from "the
# internet" to "this host, this port, this account, now guess the password."
# Saving four keystrokes is not a reason to put them in a public repository.
#
# A re-run seeds from the existing .env instead, so the values stay on the box
# that needs them and never enter git.
#
#   bash scripts/write-env.sh
set -euo pipefail

cd "$(dirname "$0")/.."

CURRENT_URL=""
CURRENT_IMAGES=""
if [ -f .env ]; then
  CURRENT_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' || true)"
  CURRENT_IMAGES="$(grep -E '^IMAGES_PATH=' .env | head -1 | cut -d= -f2- | tr -d '"' || true)"
fi

REUSE=n
if [ -n "$CURRENT_URL" ]; then
  read -rp 'An .env exists. Reuse its DATABASE_URL? [Y/n]: ' REUSE
  REUSE="${REUSE:-Y}"
fi

case "$REUSE" in
  Y | y)
    DB_URL="$CURRENT_URL"
    ;;
  *)
    read -rp 'DB host: ' DBHOST
    read -rp 'DB port: ' DBPORT
    read -rp 'DB name: ' DBNAME
    read -rp 'DB user: ' DBUSER
    read -rsp 'DB password: ' DBPASS
    echo
    DB_URL="mysql://${DBUSER}:${DBPASS}@${DBHOST}:${DBPORT}/${DBNAME}?sslaccept=accept_invalid_certs"
    ;;
esac

if [ -n "$CURRENT_IMAGES" ]; then
  read -rp "IMAGES_PATH [keep existing]: " IMGPATH
  IMGPATH="${IMGPATH:-$CURRENT_IMAGES}"
else
  read -rp 'IMAGES_PATH (media share root): ' IMGPATH
fi

if [ -z "$DB_URL" ] || [ -z "$IMGPATH" ]; then
  echo 'A database URL and IMAGES_PATH are both required. Nothing written.' >&2
  exit 1
fi

umask 077
cat > .env <<EOF
DATABASE_URL="${DB_URL}"
# ProxySQL presents a certificate the mariadb adapter cannot verify. The URL
# already says accept_invalid_certs; the adapter reads this env var instead.
DATABASE_SSL_REJECT_UNAUTHORIZED=false
IMAGES_PATH=${IMGPATH}
EOF

echo "Wrote .env (mode $(stat -c '%a' .env 2>/dev/null || echo 600))."
echo
echo "Prisma CLI commands do not read .env — load it into the shell first:"
echo "  set -a; . ./.env; set +a"
