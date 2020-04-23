#!/bin/bash

set -ex

host="${1}"
shift
cmd="${@}"

until [ $(psql -h "${host}" -U midas -c 'select * from migrations;' | grep rows | grep -oE '[0-9]') -ge 3 ]
do
  >&2 echo "Migrations havn't completed yet - sleeping"
  sleep 1
done

>&2 echo "Migrations have completed - executing command"
${cmd}
