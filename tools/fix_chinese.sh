#!/bin/bash
# Fix Chinese characters in GOSTs

# Replace 应当 (should) with должно
sudo -u postgres psql -d mebportal -c "UPDATE \"Reference\" SET content = replace(content, '应当', 'должно') WHERE category = 'ГОСТ';"

# Replace 外观 (appearance) with внешний вид
sudo -u postgres psql -d mebportal -c "UPDATE \"Reference\" SET content = replace(content, '外观', 'внешний вид') WHERE category = 'ГОСТ';"

# Replace 型号 (model) with型号
sudo -u postgres psql -d mebportal -c "UPDATE \"Reference\" SET content = replace(content, '型号', 'модель') WHERE category = 'ГОСТ';"

echo "Done! Checking results..."
sudo -u postgres psql -d mebportal -c "SELECT id, title FROM \"Reference\" WHERE category = 'ГОСТ';"
