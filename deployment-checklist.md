# Deployment Fix Checklist

## Backend Server (Railway) ✅
1. **Add CORS configuration** to allow Netlify domain
2. **Check all API endpoints** are responding correctly
3. **Verify environment variables** are set properly
4. **Test /health endpoint** manually

## Frontend (Netlify) ✅  
1. **Update environment variables** in Netlify dashboard
2. **Add build settings** from netlify.toml
3. **Test API connections** after deployment
4. **Verify image loading** from new sources

## Supabase Database ✅
1. **Check table permissions** for public access
2. **Verify API keys** are correct and active
3. **Test WebSocket connections** manually
4. **Review row-level security** settings

## Immediate Actions Required:
1. Push these fixes to your branch
2. Update Railway backend CORS settings
3. Update Netlify environment variables
4. Test deployment thoroughly

## Testing Commands:
```bash
# Test API endpoints manually
curl -X GET "https://war-tracker-20-production.up.railway.app/health"
curl -X GET "https://war-tracker-20-production.up.railway.app/api/news"

# Test Supabase connection
curl -X GET "https://prmjtsiyeovmkujtbjwi.supabase.co/rest/v1/war_events?select=*&limit=1" \
  -H "apikey: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
