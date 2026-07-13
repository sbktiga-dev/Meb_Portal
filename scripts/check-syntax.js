const fs = require('fs');
const lines = fs.readFileSync('src/app/profile/[userId]/page.tsx', 'utf8').split('\n');
// Check the area where side banners were added
lines.slice(328, 370).forEach((l, i) => console.log((i + 329) + ': ' + l));
