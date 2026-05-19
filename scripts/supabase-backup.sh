#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="data/backups"
if ! [ -d "$BACKUP_DIR" ]; then
  echo "Backup directory $BACKUP_DIR does not exist"
  exit 1
fi

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
git_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "nogit")
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  git_hash="${git_hash}-dirty"
fi

data="$PWD/${BACKUP_DIR}/${timestamp}.${git_hash}"
mkdir -p "$data"
cd "$data"
supabase db dump --local -f roles.sql --role-only
supabase db dump --local -f schema.sql
supabase db dump --local -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
cd -
echo "Done."
