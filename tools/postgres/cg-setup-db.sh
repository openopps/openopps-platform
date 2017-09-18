#!/bin/bash

set -e

# shellcheck disable=SC2162
# shellcheck disable=SC2046
read DB_USER \
     DB_PASSWORD \
     DB_HOST \
     DB_PORT \
     DB_NAME <<< \
     $(
        echo "$DATABASE_URL" | \
        sed -E 's/postgres:\/\/|@|:|\// /g' | \
        awk -F"|" '{print $1" "$2" "$3" "$4" "$5}'
      )

# shellcheck disable=SC2016
echo -n '"$DB_PASSWORD" for your copy-paste convenience: '
echo "$DB_PASSWORD"

echo "Dropping the ${DB_NAME} database. Enter / paste the password above when prompted."
dropdb \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -W \
  -p "$DB_PORT" \
  "$DB_NAME"

echo "Creating the ${DB_NAME} database. Enter / paste the password above when prompted."
createdb \
  -U "$DB_USER" \
  -h "$DB_HOST" \
  -W \
  -p "$DB_PORT" \
  "$DB_NAME"
