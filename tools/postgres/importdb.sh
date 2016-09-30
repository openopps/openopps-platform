#!/bin/sh

set -e
set -o verbose

if [ -z "$DB_DUMP_FILE" ]; then
  echo "must specify \$DB_DUMP_FILE" >&2
  exit 1
fi

dropdb midas
createdb midas
psql midas < "$DB_DUMP_FILE"
