#!/bin/bash

# Add a data column for tagEntities
psql -U midas -d midas -c "ALTER TABLE ONLY midas_user ADD CONSTRAINT midas_user_username_key UNIQUE (username);"

# Update the schema version
psql -U midas -d midas -c "UPDATE schema SET version = 6 WHERE schema = 'current';"
