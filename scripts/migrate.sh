#!/bin/bash
PGPASSWORD=mebportal2026 psql -U mebportal -d mebportal -h localhost -f /home/ubuntu/Meb_Portal/scripts/migrate.sql
