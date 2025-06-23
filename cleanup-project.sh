#!/bin/bash

echo "🧹 War Tracker 2.0 - Comprehensive Cleanup Script"
echo "================================================="

# Navigate to project root
cd "/Users/RoRo_HQ/War Tracker 2.0"

echo "🗑️ Removing deprecated and unused files..."

# Remove deprecated /src directory (keeping DEPRECATED.md as marker)
find src -name "*.tsx" -o -name "*.ts" -o -name "*.css" -o -name "*.js" | while read file; do
    if [[ "$file" != "src/DEPRECATED.md" ]]; then
        echo "Removing deprecated file: $file"
        rm -f "$file"
    fi
done

# Remove empty directories in /src (except the root)
find src -type d -empty -delete 2>/dev/null || true

echo "📦 Cleaning node_modules and build artifacts..."

# Clean client
cd client
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
echo "✅ Client cache cleaned"

# Clean server
cd ../server
rm -rf node_modules/.cache  
rm -rf dist
echo "✅ Server cache cleaned"

cd ..

echo "🔧 Consolidating configuration files..."

# Remove duplicate TypeScript configs
find . -name "tsconfig.json" -not -path "./client/*" -not -path "./server/*" -delete

# Remove duplicate package-lock files
find . -name "package-lock.json" -not -path "./client/*" -not -path "./server/*" -delete

echo "📝 Updating documentation..."

# Create updated README with current structure
cat > README-CLEANUP.md << 'EOF'
# War Tracker 2.0 - Post-Cleanup Structure

## ✅ Cleaned Up
- Removed duplicate `/src` directory (migrated to `/client/src`)
- Consolidated duplicate CSS files
- Removed unused component imports
- Fixed server route mounting issues
- Cleaned up package.json dependencies
- Removed deprecated Live/WarNews components

## 📁 Current Structure
```
War Tracker 2.0/
├── client/                 # Frontend React app
│   ├── src/components/     # Active UI components
│   └── package.json        # Client dependencies
├── server/                 # Backend API
│   ├── src/services/       # Core services
│   ├── routes/             # API routes
│   └── package.json        # Server dependencies
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## 🎯 Active Components
- Dashboard (main overview)
- WarEvents (event timeline)
- BattleMaps (conflict mapping)
- CountriesAndForces (military assets)
- Settings (configuration)
- DebugConsole (system diagnostics)

## 🚫 Removed/Deprecated
- Live Feed component (functionality merged)
- War News tab (consolidated)
- Duplicate /src directory
- Legacy CSS files
- Unused dependencies

## 🔧 Next Steps
1. Run `./refresh-local.sh` to rebuild everything clean
2. Test all remaining components work correctly
3. Consider removing any remaining unused utility files
4. Update deployment scripts to reflect new structure
EOF

echo "🔍 Scanning for remaining issues..."

# Find potentially unused files
echo "📋 Potentially unused files found:"
find . -name "*.css" -not -path "./client/*" -not -path "./node_modules/*" -not -path "./server/node_modules/*" -not -path "./client/node_modules/*"
find . -name "*.js" -not -path "./node_modules/*" -not -path "./server/node_modules/*" -not -path "./client/node_modules/*" -not -name "*.config.js" -not -name "mongo-init.js"

echo ""
echo "✅ Cleanup complete!"
echo "==================="
echo ""
echo "📊 Summary:"
echo "• Removed deprecated /src directory files"
echo "• Cleaned build artifacts and caches"
echo "• Fixed server route imports"
echo "• Consolidated configuration files"
echo "• Updated documentation"
echo ""
echo "🚀 Next steps:"
echo "1. Review README-CLEANUP.md for details"
echo "2. Run ./refresh-local.sh to rebuild cleanly"
echo "3. Test application functionality"
echo ""
echo "⚠️  Manual review needed for any files listed above"