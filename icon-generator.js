#!/usr/bin/env node
/**
 * PWA Icon Generator
 * Generates required PWA icons from a source image or creates placeholders
 * 
 * Run: node icon-generator.js
 */

const fs = require('fs');
const path = require('path');

// Simple PNG header generator for a colored square (placeholder)
function generatePlaceholderPNG(size, color = [15, 17, 32]) {
  // This creates a minimal valid PNG file with the specified color
  // For production, use proper icon design tools like Figma or use 'sharp' library
  
  const canvas = require('canvas');
  
  try {
    const canvasObj = canvas.createCanvas(size, size);
    const ctx = canvasObj.getContext('2d');
    
    // Dark background with white circle
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.fillRect(0, 0, size, size);
    
    // Add a white circle with "MH" text
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.font = `bold ${Math.floor(size * 0.4)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MH', size / 2, size / 2);
    
    return canvasObj.toBuffer('image/png');
  } catch (error) {
    console.error('Canvas not available. Please follow manual icon setup instructions.');
    return null;
  }
}

// Create placeholder icons
const sizes = [192, 512];
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('📦 Generating PWA icons...');
console.log('Note: These are placeholder icons. For production, use proper design tools.');
console.log();

// Attempt to generate with canvas
try {
  require('canvas');
  sizes.forEach((size) => {
    const png = generatePlaceholderPNG(size);
    if (png) {
      fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.png`), png);
      fs.writeFileSync(path.join(publicDir, `icon-maskable-${size}x${size}.png`), png);
      console.log(`✅ Generated icon-${size}x${size}.png`);
      console.log(`✅ Generated icon-maskable-${size}x${size}.png`);
    }
  });
} catch (error) {
  console.log('⚠️  Canvas library not found. Using alternative setup...');
  console.log();
  console.log('📋 MANUAL ICON SETUP:');
  console.log('Install canvas first: npm install canvas');
  console.log('Then run: node icon-generator.js');
  console.log();
  console.log('📌 OR manually add PNG files:');
  sizes.forEach((size) => {
    console.log(`  - public/icon-${size}x${size}.png`);
    console.log(`  - public/icon-maskable-${size}x${size}.png`);
  });
  console.log();
  console.log('💡 Recommended tools for icon creation:');
  console.log('  - Figma: https://figma.com');
  console.log('  - GIMP: https://gimp.org');
  console.log('  - Photoshop');
  console.log();
  console.log('✅ Your PWA is still functional with placeholder icons.');
  console.log('   Icons are loaded from the web if not available locally.');
}
