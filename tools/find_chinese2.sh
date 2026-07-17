#!/bin/bash
# Search for various Chinese characters
for char in "的" "是" "在" "了" "不" "有" "和" "人" "这" "中" "大" "为" "上" "个" "国" "到" "说" "们" "为" "子" "作" "种" "面" "美" "而" "记" "黄" "皮" "五" "品" "定" "规" "则" "际" "标" "准" "产" "品" "生" "制" "造" "工" "艺" "技" "术" "条" "件"; do
  result=$(sudo -u postgres psql -d mebportal -t -c "SELECT count(*) FROM \"Reference\" WHERE category = 'ГОСТ' AND content LIKE '%$char%';" 2>/dev/null | tr -d ' ')
  if [ "$result" != "0" ]; then
    echo "Found '$char': $result rows"
  fi
done
