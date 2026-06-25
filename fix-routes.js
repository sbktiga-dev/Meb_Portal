const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  return results;
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const files = walkDir(apiDir);
let modified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('export const dynamic')) {
    content = "export const dynamic = 'force-dynamic';\n\n" + content;
    fs.writeFileSync(file, content, 'utf8');
    modified++;
    console.log('Fixed:', file);
  }
});

console.log(`\nDone: ${modified} files modified out of ${files.length} total`);
