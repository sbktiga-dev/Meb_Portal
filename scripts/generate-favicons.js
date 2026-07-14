// Скрипт для генерации PNG фавиконок из SVG
// Запуск: node scripts/generate-favicons.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#F97316"/>
  <path d="M8 14l8-6 8 6v10a1 1 0 01-1 1H9a1 1 0 01-1-1V14z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 24v-5h6v5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const sizes = [16, 32, 192, 512];
const publicDir = path.join(__dirname, '..', 'public');

async function generate() {
  console.log('Generating PNG favicons...');

  for (const size of sizes) {
    const filename = `favicon-${size}x${size}.png`;
    const filepath = path.join(publicDir, filename);

    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(filepath);

    console.log(`Created ${filename}`);
  }

  // Apple touch icon
  const appleIcon = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(appleIcon);
  console.log('Created apple-touch-icon.png');

  console.log('\nDone! All favicons generated.');
}

generate().catch(console.error);
