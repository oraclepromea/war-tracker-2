# Supabase Database Update Instructions

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your War Tracker project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Schema Updates**
   - Copy the entire SQL from `supabase-table-updates.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

4. **Verify Tables**
   - Go to "Table Editor" 
   - Check that you now have:
     - ✅ `articles` table with all columns
     - ✅ `war_events` table with updated columns
     - ✅ `rss_sources` table (new)

## Method 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Key Changes Made:

### 1. Articles Table (NEW)
- `id` - Primary key
- `title`, `description`, `content` - Article content
- `url` - Unique article URL
- `source` - RSS source name
- `category` - Article category
- `published_at` - Original publish date
- `is_war_related` - Boolean flag for war-related content
- `sentiment` - AI sentiment analysis
- `keywords` - Array of extracted keywords
- `language` - Article language

### 2. War Events Table (UPDATED)
- Added missing columns your backend expects:
  - `event_type` - Type of military event
  - `location` - Event location
  - `severity` - Event severity level
  - `source` - Source of the event
  - `source_url` - Original source URL
  - `event_date` - When the event occurred
  - `coordinates` - Geographic coordinates
  - `tags` - Array of tags

### 3. RSS Sources Table (NEW)
- Tracks your RSS feed sources
- Used by backend to know which feeds to fetch

## Environment Variables to Update:

In your Railway deployment, ensure these match your Supabase project:

```env
SUPABASE_URL=https://prmjtsiyeovmkujtbjwi.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Testing After Update:

1. **Check Railway logs** - Should see no more schema errors
2. **Test API endpoints**:
   ```bash
   curl https://your-railway-app.railway.app/api/articles
   curl https://your-railway-app.railway.app/api/events
   ```
3. **Verify data flow** - Articles should start appearing in Supabase tables
