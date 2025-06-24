# Repository Size Fix - Remove Large Files from Git History

## The Problem
Your repository has `node_modules` tracked in git history, including a 104MB file that exceeds GitHub's limits.

## Solution Options

### Option 1: Use git filter-branch (Recommended)
```bash
# Remove node_modules from entire git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch -r node_modules' \
  --prune-empty --tag-name-filter cat -- --all

# Force garbage collection
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now

# Add proper .gitignore
echo "node_modules/" >> .gitignore
git add .gitignore
git commit -m "Add node_modules to gitignore"

# Force push to overwrite remote history
git push --force --all origin
```

### Option 2: Fresh Repository (Easier)
```bash
# Create a new directory for clean repo
mkdir ../war-tracker-clean
cd ../war-tracker-clean

# Initialize new git repo
git init
git remote add origin https://github.com/oraclepromea/war-tracker-2.git

# Copy only source files (not node_modules)
cp -r ../War\ Tracker\ 2.0/client/src ./client/
cp -r ../War\ Tracker\ 2.0/server/src ./server/
cp ../War\ Tracker\ 2.0/package*.json ./
cp ../War\ Tracker\ 2.0/*.md ./
cp ../War\ Tracker\ 2.0/.gitignore ./

# Add and commit clean files
git add .
git commit -m "Initial clean commit - source files only"

# Force push to replace remote repository
git push --force origin main
```

### Option 3: GitHub CLI (If installed)
```bash
# Delete and recreate repository
gh repo delete oraclepromea/war-tracker-2 --confirm
gh repo create oraclepromea/war-tracker-2 --public

# Then use Option 2 to push clean code
```
