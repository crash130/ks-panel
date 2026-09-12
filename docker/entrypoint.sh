#!/bin/sh
set -e
echo "KS: migracja bazy…"
npx prisma migrate deploy
echo "KS: start aplikacji"
exec node server.js
