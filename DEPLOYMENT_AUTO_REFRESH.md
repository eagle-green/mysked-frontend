# Auto-Refresh System for Deployment Updates

## Problem Solved

When deploying new code to production, users with cached HTML may try to load chunk files that no longer exist, resulting in:
```
Failed to fetch dynamically imported module: /assets/create-DPQfoGsB.js
```

This system **prevents this error from ever appearing** by automatically detecting new deployments and refreshing the page.

---

## How It Works

### 1. **Build-Time Version Generation** 
   - **File:** `vite.config.ts` (lines 12-27)
   - During each build, a `meta.json` file is generated with:
     ```json
     {
       "version": "7.0.0",
       "buildTime": "2025-10-21T20:00:00.000Z"
     }
     ```
   - The `buildTime` changes with every deployment, serving as a unique identifier

### 2. **Periodic Version Checking**
   - **File:** `src/hooks/use-version-check.ts`
   - **Frequency:** Every 5 minutes + when user returns to tab
   - **Process:**
     1. Stores initial `buildTime` when app loads
     2. Periodically fetches `/meta.json` to check current `buildTime`
     3. If different → Auto-reload immediately
   - **Session Storage:** Uses `sessionStorage` so version persists during navigation

### 3. **Instant Chunk Error Recovery**
   - **File:** `src/app.tsx` (lines 35-64)
   - **Global error handler** that catches chunk loading errors
   - **Automatic refresh** when chunk error detected
   - **Loop prevention:** Won't refresh more than once per 10 seconds

### 4. **Cache Configuration**
   - **File:** `public/_headers`
   - Ensures `meta.json` is NEVER cached
   - Properly caches chunk files (they have content hashes)
   - Works with Netlify, Vercel, Cloudflare Pages, etc.

---

## User Experience

### Before (Bad UX):
1. User navigates to a page
2. ❌ Red error screen: "Failed to fetch dynamically imported module"
3. User confused, has to manually refresh

### After (Great UX):
1. New deployment happens
2. User continues using the app normally
3. ✅ Within 5 minutes, page auto-refreshes seamlessly
4. ✅ OR if they navigate and hit a chunk error, instant auto-refresh
5. User never sees an error screen!

---

## Deployment Checklist

When deploying to production, ensure:

1. ✅ `public/meta.json` is deployed with your build
2. ✅ `public/_headers` is recognized by your hosting provider
3. ✅ Build script runs: `yarn build` (which runs `prebuild` → generates meta.json)
4. ✅ Vercel cache headers are configured in `vercel.json` to prevent caching of `meta.json`

### Alternative: Manual Headers Configuration

If `_headers` file isn't supported by your host, configure via:

**Netlify (`netlify.toml`):**
```toml
[[headers]]
  for = "/meta.json"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

**Vercel (`vercel.json`):**
```json
{
  "headers": [
    {
      "source": "/meta.json",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

**Nginx:**
```nginx
location /meta.json {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## Configuration

### Adjust Check Frequency

Edit `src/hooks/use-version-check.ts`:
```typescript
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes (adjust as needed)
```

**Recommendations:**
- Production: 5-10 minutes (balance between freshness and server load)
- Development: Not needed (hot module replacement handles this)

### Disable Version Checking

If needed, comment out in `src/app.tsx`:
```typescript
// useVersionCheck();
```

---

## Relationship with Service Worker (PWA)

This project also has a **Service Worker PWA system** (`src/utils/register-sw.ts`) that shows an "UPDATE NOW" button.

### How They Work Together:

1. **Auto-Refresh (this system):** 
   - Primary mechanism
   - Automatic, silent updates
   - Works for all users

2. **Service Worker "UPDATE NOW" button:**
   - Backup mechanism for PWA users
   - Requires user interaction
   - Only shows if Service Worker is registered

**Note:** The Service Worker is currently NOT activated in `main.tsx`. If you want both systems:
```typescript
// In main.tsx
import { registerServiceWorker } from 'src/utils/register-sw';

if (import.meta.env.PROD) {
  registerServiceWorker();
}
```

**Recommendation:** Keep only the auto-refresh system (current state) for a simpler, more automatic experience.

---

## Benefits

✅ **Zero Error Screens:** Users never see chunk loading errors  
✅ **Automatic Updates:** New deployments roll out smoothly  
✅ **No Manual Refresh:** Users don't need to clear cache  
✅ **Background Checking:** Doesn't interrupt user workflow  
✅ **Focus-Aware:** Checks when user returns to tab  
✅ **Loop Prevention:** Won't refresh infinitely if there's a real error  

---

## Testing

### Test Auto-Refresh on New Deployment:

1. Load the app in production
2. Open browser console
3. Deploy a new version
4. Wait 5 minutes (or switch tabs and come back)
5. Should see: `🔄 New version detected! Auto-refreshing...`
6. Page reloads automatically

### Test Chunk Error Recovery:

1. Build app: `yarn build`
2. Deploy version A
3. User loads the app
4. Deploy version B (chunks change)
5. User navigates to new page
6. Instead of error screen → Auto-refresh!

---

## Monitoring

Check browser console for these logs:

- `📦 App version loaded: 7.0.0 Build time: 2025-10-21...` - Initial load
- `🔄 New version detected! Auto-refreshing...` - Auto-refresh triggered
- `🔄 Chunk loading error detected, auto-refreshing...` - Chunk error recovery

---

## Files Created/Modified

1. ✅ `public/meta.json` - Version manifest (auto-generated)
2. ✅ `public/_headers` - Cache control headers
3. ✅ `scripts/generate-meta.js` - Build script that generates meta.json before build
4. ✅ `src/hooks/use-version-check.ts` - Version checking hook with improved logging
5. ✅ `src/app.tsx` - Integrated version check + error handler
6. ✅ `vite.config.ts` - Build plugin for meta.json generation (backup)
7. ✅ `package.json` - Added prebuild script
8. ✅ `vercel.json` - Added cache control headers for meta.json

---

**Result:** Users will have a seamless experience even during deployments! 🚀


