#!/bin/bash
sudo -u postgres psql -d mebportal -c "SELECT id, title, category FROM \"Reference\";"
