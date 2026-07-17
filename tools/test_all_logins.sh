#!/bin/bash
# Test login with all users
echo "Testing sbk.tiga@gmail.com..."
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"sbk.tiga@gmail.com","password":"user123"}'
echo ""
echo "Testing Anitmebel@yandex.ru..."
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"Anitmebel@yandex.ru","password":"user123"}'
echo ""
echo "Testing admin@gmail.com..."
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@gmail.com","password":"admin123"}'
