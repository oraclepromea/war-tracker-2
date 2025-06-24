# Railway Deployment Fix Instructions

## Immediate Actions Required:

### 1. Database Schema Fix
```bash
# Connect to Railway PostgreSQL database
railway connect

# Run the schema fix migration
\i /path/to/fix-schema.sql

# Or execute manually:
SET search_path TO public;
```

### 2. Environment Variables Check
In Railway dashboard, verify these variables:
- `DATABASE_URL` - Should not reference 'net' schema
- `NODE_ENV=production`
- `PORT=8000` (or your preferred port)

### 3. Deploy Updated Code
```bash
# Commit the schema fixes
git add .
git commit -m "Fix database schema errors - use public schema"
git push origin main

# Railway will auto-deploy
```

### 4. Monitor Logs
After deployment, check Railway logs for:
- ✅ `Connected to database, using schema: public`
- ✅ No more "schema 'net' does not exist" errors
- ✅ Articles inserting successfully

### 5. Manual Database Reset (if needed)
If issues persist, you may need to:
1. Reset Railway database
2. Re-run migrations
3. Let RSS feeds repopulate

## Testing Commands:
```bash
# Test database connection
curl -X GET "https://your-railway-app.railway.app/health"

# Test article endpoint
curl -X GET "https://your-railway-app.railway.app/api/articles"

# Trigger manual RSS sync
curl -X POST "https://your-railway-app.railway.app/api/rss/sync"
```

## Expected Results:
- No more schema errors in logs
- Articles successfully inserting
- API endpoints responding correctly
- Frontend receiving data properly
