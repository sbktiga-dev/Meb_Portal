#!/bin/bash
sudo -u postgres psql -d mebportal -c "SELECT email, role FROM \"User\";"
