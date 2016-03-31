#!/bin/bash

# Add a column to indicate user is an agency admin
psql $DATABASE_URL -c "ALTER TABLE midas_user ADD COLUMN "isAgencyAdmin" boolean;"
psql $DATABASE_URL -c "UPDATE midas_user SET \"isAgencyAdmin\" = 'f'";
psql $DATABASE_URL -c "UPDATE schema SET version = 13 WHERE schema = 'current';"
