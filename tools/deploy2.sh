#!/bin/bash
cd /home/ubuntu/Meb_Portal

# Copy all changed files
cp /tmp/admin_page.tsx src/app/admin/page.tsx
cp /tmp/admin_docs_page.tsx src/app/admin/documents/page.tsx
cp /tmp/refs_page.tsx src/app/refs/page.tsx
cp /tmp/refs_route.ts src/app/api/refs/route.ts
cp /tmp/docs_route.ts src/app/api/documents/route.ts
cp /tmp/docs_id_route.ts src/app/api/documents/\[id\]/route.ts

# Rebuild
pm2 stop mebportal
rm -rf .next
npm run build 2>&1 | tail -10
pm2 restart mebportal
sleep 3
pm2 status
