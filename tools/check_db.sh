#!/bin/bash
sudo -u postgres psql -d mebportal -c "SELECT id, email, name, role FROM \"User\" LIMIT 5;"
