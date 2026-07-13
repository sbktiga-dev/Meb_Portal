const fs = require('fs');
const c = fs.readFileSync('src/app/profile/[userId]/page.tsx', 'utf8').split('\n');
let b = 0;
for (let i = 0; i < c.length; i++) {
  const o = (c[i].match(/<div[\s>]/g) || []).length;
  const cl = (c[i].match(/<\/div>/g) || []).length;
  if (o || cl) {
    b += o - cl;
    console.log('L' + (i+1) + ': balance=' + b + ' +' + o + ' -' + cl + '  ' + c[i].trim().substring(0, 60));
  }
}
console.log('FINAL:', b);
