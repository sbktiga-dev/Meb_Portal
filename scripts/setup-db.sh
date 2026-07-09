#!/bin/bash
sudo -u postgres psql -c "CREATE USER mebportal WITH PASSWORD 'mebportal2026';"
sudo -u postgres psql -c "CREATE DATABASE mebportal OWNER mebportal;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mebportal TO mebportal;"
sudo -u postgres psql -d mebportal -c "GRANT ALL ON SCHEMA public TO mebportal;"
echo "DB created!"
