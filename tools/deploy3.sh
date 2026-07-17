#!/bin/bash
cd /home/ubuntu/Meb_Portal

# Copy updated files
cp /tmp/stats_route.ts src/app/api/stats/route.ts
cp /tmp/HomeContent.tsx src/components/HomeContent.tsx
cp /tmp/admin_page.tsx src/app/admin/page.tsx

# Insert new GOST
sudo -u postgres psql -d mebportal -f /tmp/gost_priemka.sql

# Rebuild
pm2 stop mebportal
rm -rf .next
npm run build 2>&1 | tail -5
pm2 restart mebportal
sleep 3
pm2 status
