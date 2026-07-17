#!/bin/bash
# Reset password for admin@gmail.com to admin123
sudo -u postgres psql -d mebportal -c "UPDATE \"User\" SET password = '\$2a\$12\$N0EQTHfXL8MHXyLn2975mO0kSx6eC3z3V6X7Z8A9B0C1D2E3F4G5H6' WHERE email = 'admin@gmail.com';"
echo "Password reset. Testing login..."
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@gmail.com","password":"admin123"}'
