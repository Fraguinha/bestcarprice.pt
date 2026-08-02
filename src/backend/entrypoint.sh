#!/bin/sh
set -e
node scripts/database.js
exec node dist/server.js
