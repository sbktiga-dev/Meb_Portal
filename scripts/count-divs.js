const fs = require('fs');
const content = fs.readFileSync('src/app/profile/[userId]/page.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Simple count: count <div and </div occurrences
  const opens = (line.match(/<div[\s>/]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
  if (balance < 0) {
    console.log(`UNDERFLOW at L${i+1}: balance=${balance}  ${line.trim().substring(0, 80)}`);
  }
}
console.log('Final balance:', balance);
