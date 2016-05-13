#!/bin/sh
set -o verbose
dropdb midas
createdb midas
npm run migrate
npm run init

