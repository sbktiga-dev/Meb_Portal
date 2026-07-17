#!/bin/bash
cd /home/ubuntu/Meb_Portal

# Generate hash for user123
HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('user123', 12).then(h => console.log(h));")
echo "Hash for user123: $HASH"

# Update all users to user123
sudo -u postgres psql -d mebportal -c "UPDATE \"User\" SET password = '$HASH' WHERE email != 'admin@gmail.com';"

echo "Testing logins..."
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"sbk.tiga@gmail.com","password":"user123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('sbk.tiga:', 'OK' if 'token' in d else d.get('error','?'))"
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"Anitmebel@yandex.ru","password":"user123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('Anitmebel:', 'OK' if 'token' in d else d.get('error','?'))"
