#!/usr/bin/env node
/**
 * PWA Setup Verification
 * Checks if all PWA files are correctly configured
 */

const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: 'manifest.json exists',
    check: () => fs.existsSync(path.join(__dirname, 'public', 'manifest.json')),
  },
  {
    name: 'service-worker.js exists',
    check: () => fs.existsSync(path.join(__dirname, 'public', 'service-worker.js')),
  },
  {
    name: 'pwa-install.js exists',
    check: () => fs.existsSync(path.join(__dirname, 'public', 'pwa-install.js')),
  },
  {
    name: 'layout.tsx updated with PWA tags',
    check: () => {
      const content = fs.readFileSync(path.join(__dirname, 'src', 'app', 'layout.tsx'), 'utf-8');
      return content.includes('manifest.json') && content.includes('service-worker.js');
    },
  },
  {
    name: 'next.config.mjs updated for PWA',
    check: () => {
      const content = fs.readFileSync(path.join(__dirname, 'next.config.mjs'), 'utf-8');
      return content.includes('headers');
    },
  },
  {
    name: 'Icons available',
    check: () => {
      const sizes = [192, 512];
      return sizes.every((size) => {
        const regular = fs.existsSync(path.join(__dirname, 'public', `icon-${size}x${size}.png`));
        const maskable = fs.existsSync(path.join(__dirname, 'public', `icon-maskable-${size}x${size}.png`));
        return regular || maskable; // At least one should exist
      });
    },
  },
];

console.log('\n🔍 PWA Setup Verification\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

checks.forEach((test) => {
  const result = test.check();
  const status = result ? '✅' : '⚠️';
  console.log(`${status} ${test.name}`);
  if (result) passed++;
  else failed++;
});

console.log('='.repeat(50));
console.log(`\n📊 Results: ${passed}/${checks.length} checks passed\n`);

if (failed === 0) {
  console.log('✅ PWA is fully configured and ready!\n');
  console.log('Next steps:');
  console.log('  1. npm run build');
  console.log('  2. npm run start');
  console.log('  3. Visit http://localhost:3000');
  console.log('  4. Try the Install button!\n');
} else if (failed === 1 && !checks[5].check()) {
  console.log('⚠️  Icons are optional. PWA will work without them.\n');
  console.log('To add icons:');
  console.log('  1. npm install canvas (or use design tool)');
  console.log('  2. npm run pwa:setup (or manually add PNGs to public/)');
  console.log('  3. npm run build\n');
} else {
  console.log('❌ Some files are missing. Check the setup instructions.\n');
}
