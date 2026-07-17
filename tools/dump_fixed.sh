#!/bin/bash
sudo -u postgres psql -d mebportal -c "SELECT content FROM \"Reference\" WHERE title = 'ГОСТ 19917-2014';" > /tmp/gost1_fixed.txt 2>&1
sudo -u postgres psql -d mebportal -c "SELECT content FROM \"Reference\" WHERE title = 'ГОСТ 20400-2017';" > /tmp/gost2_fixed.txt 2>&1
echo "Done"
