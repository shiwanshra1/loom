-- Runs once, only on a fresh postgres_data volume (Postgres's own
-- docker-entrypoint-initdb.d convention). Creates a second, fully separate
-- database for the test suite so it can be dropped/reset without ever
-- touching forgeloom_dev — mirrors the existing forgeloom vs forgeloom_test
-- split already used for Mongo.
CREATE DATABASE forgeloom_test;
