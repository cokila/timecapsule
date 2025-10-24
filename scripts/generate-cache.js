#!/usr/bin/env node

// Script per generare hot cache da tutte le predizioni

const fs = require('fs');
const path = require('path');

console.log('🔥 Generating hot cache...');

// Read all predictions
const predictionsDir = path.join(__dirname, '../data/predictions');
const predictions = [];

function readPredictionsRecursive(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      readPredictionsRecursive(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        predictions.push(content);
      } catch (err) {
        console.warn(`⚠️  Error reading ${file}:`, err.message);
      }
    }
  });
}

readPredictionsRecursive(predictionsDir);

console.log(`📦 Found ${predictions.length} predictions`);

// Sort by views (most popular first)
predictions.sort((a, b) => (b.views || 0) - (a.views || 0));

// Generate cache
const cache = {
  generated: Date.now(),
  version: '1.0',
  count: predictions.length,
  
  // Top 50 most viewed
  hot: predictions.slice(0, 50),
  
  // Trending (viewed in last 24h - simplified: just recent)
  trending: predictions
    .filter(p => Date.now() - p.created < 24 * 60 * 60 * 1000)
    .slice(0, 20),
  
  // Recently revealed
  recentRevealed: predictions
    .filter(p => p.revealed)
    .sort((a, b) => (b.revealedAt || 0) - (a.revealedAt || 0))
    .slice(0, 20),
  
  // Near expiry (within 7 days)
  nearExpiry: predictions
    .filter(p => !p.revealed)
    .filter(p => p.revealDate - Date.now() < 7 * 24 * 60 * 60 * 1000)
    .filter(p => p.revealDate > Date.now())
    .sort((a, b) => a.revealDate - b.revealDate)
    .slice(0, 20)
};

// Write cache
const cachePath = path.join(__dirname, '../data/cache/hot.json');
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

console.log('✅ Hot cache generated!');
console.log(`   - Hot: ${cache.hot.length}`);
console.log(`   - Trending: ${cache.trending.length}`);
console.log(`   - Recent revealed: ${cache.recentRevealed.length}`);
console.log(`   - Near expiry: ${cache.nearExpiry.length}`);
console.log(`   - Size: ${(fs.statSync(cachePath).size / 1024).toFixed(2)} KB`);
