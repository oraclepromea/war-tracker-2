const fs = require('fs');
const path = require('path');

const filesToDelete = [
  './server/src/services/articleService.js',
  './server/src/services/eventService.js'
];

console.log('🧹 Cleaning up problematic JavaScript files...');

filesToDelete.forEach(file => {
  const fullPath = path.resolve(__dirname, file);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted: ${file}`);
    } catch (error) {
      console.error(`❌ Error deleting ${file}:`, error.message);
    }
  } else {
    console.log(`ℹ️  File not found: ${file}`);
  }
});

console.log('🎉 Cleanup complete!');
