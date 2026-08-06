#!/usr/bin/env bash
# Write the .env a maintenance box needs, prompting for the password so it is
# never typed into a shell history or pasted into a chat.
#
# Exists because the Unraid web terminal is an xterm.js canvas that mobile
# browsers refuse to paste into, which makes a three-line export block
# genuinely painful to enter by hand from a phone.
#
#   bash scripts/write-env.sh
set -euo pipefail

cd "$(dirname "$0")/.."

read -rp 'DB host:port [100.89.251.10:5544]: ' HOSTPORT
HOSTPORT="${HOSTPORT:-100.89.251.10:5544}"
read -rp 'DB name [kindblank_fresh]: ' DBNAME
DBNAME="${DBNAME:-kindblank_fresh}"
read -rp 'DB user [kindrobot]: ' DBUSER
DBUSER="${DBUSER:-kindrobot}"
read -rsp 'DB password: ' DBPASS
echo
read -rp 'IMAGES_PATH [/mnt/user/pc/kindrobots/images]: ' IMGPATH
IMGPATH="${IMGPATH:-/mnt/user/pc/kindrobots/images}"

umask 077
cat > .env <<EOF
DATABASE_URL="mysql://${DBUSER}:${DBPASS}@${HOSTPORT}/${DBNAME}?sslaccept=accept_invalid_certs"
# ProxySQL presents a certificate the mariadb adapter cannot verify. The URL
# already says accept_invalid_certs; the adapter reads this env var instead.
DATABASE_SSL_REJECT_UNAUTHORIZED=false
IMAGES_PATH=${IMGPATH}
EOF

echo "Wrote .env (mode $(stat -c '%a' .env))."
echo
echo "Prisma CLI commands do not read .env — load it into the shell first:"
echo "  set -a; . ./.env; set +a"
