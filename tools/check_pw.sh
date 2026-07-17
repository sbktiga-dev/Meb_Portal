#!/bin/bash
sudo -u postgres psql -d mebportal -c "SELECT email, substring(password from 1 for 30) as pw_prefix FROM \"User\";"
