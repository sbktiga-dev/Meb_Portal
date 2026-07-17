#!/bin/bash
cd /home/ubuntu/Meb_Portal
HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 12).then(h => console.log(h));")
echo "Generated hash: $HASH"
sudo -u postgres psql -d mebportal -c "UPDATE \"User\" SET password = '$HASH' WHERE email = 'admin@gmail.com';"
echo "Testing login..."
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@gmail.com","password":"admin123"}'
