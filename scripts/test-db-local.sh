#!/usr/bin/env bash
# Run the Row Level Security tests against a local Postgres (no Supabase needed).
# Usage: scripts/test-db-local.sh   (needs psql/createdb pointing at a local server)
set -euo pipefail
DB="${DB:-momento_rls_test}"
dropdb --if-exists "$DB"
createdb "$DB"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/local_shim.sql -f supabase/migrations/*_init.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/rls_test.sql
dropdb "$DB"
echo "All database privacy tests passed."
