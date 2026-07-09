#!/bin/bash
cd /home/ubuntu/Meb_Portal

# Create .env file
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://mebportal:mebportal2026@localhost:5432/mebportal"
JWT_SECRET="mebportal-secret-key-2026-change-in-production"
NEXTAUTH_URL="http://158.160.210.47"
NEXT_PUBLIC_API_URL="http://158.160.210.47"
ENVEOF

# Run Prisma migrations
npx prisma db push

# Install PM2
sudo npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "mebportal" -- start
pm2 save
pm2 startup

echo "Setup complete!"
