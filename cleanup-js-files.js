const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'server/src/services/articleService.js',
  'server/src/services/eventService.js'
];

console.log('🧹 Cleaning up problematic JavaScript files...');

filesToRemove.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Removed: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to remove ${filePath}:`, error.message);
    }
  } else {
    console.log(`ℹ️  File not found (already removed?): ${filePath}`);
  }
});

console.log('🎉 Cleanup completed!');
