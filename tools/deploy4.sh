#!/bin/bash
cd /home/ubuntu/Meb_Portal

cp /tmp/favorites_route.ts src/app/api/favorites/route.ts
cp /tmp/product_page.tsx 'src/app/products/[id]/page.tsx'
cp /tmp/product_api.ts 'src/app/api/products/[id]/route.ts'

pm2 stop mebportal
rm -rf .next
npm run build 2>&1 | tail -5
pm2 restart mebportal
sleep 3
pm2 status
