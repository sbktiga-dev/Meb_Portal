#!/bin/bash
# Check for Chinese characters in GOST content
sudo -u postgres psql -d mebportal -c "SELECT id, title FROM \"Reference\" WHERE category = 'ГОСТ';"
echo "---"
echo "Searching for Chinese characters..."
sudo -u postgres psql -d mebportal -c "SELECT id, title, position('应当' in content) as has_yingdai FROM \"Reference\" WHERE category = 'ГOST' AND content LIKE '%应当%';"
sudo -u postgres psql -d mebportal -c "SELECT id, title, position('標準' in content) as has_biaozhun FROM \"Reference\" WHERE category = 'ГОСТ' AND content LIKE '%標準%';"
sudo -u postgres psql -d mebportal -c "SELECT id, title, position('规则' in content) as has_guize FROM \"Reference\" WHERE category = 'ГОСТ' AND content LIKE '%规则%';"
