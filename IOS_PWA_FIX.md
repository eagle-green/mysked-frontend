# iOS PWA Auto-Refresh Fix

## Problem

After deploying version 1.1.1 to production:
- ✅ Works on Chrome (MacBook)
- ✅ Works on PWA (MacBook)  
- ❌ **Stuck on version 1.0.19 on iPhone PWA** (even after closing and reopening)

## Root Causes

### 1. **Service Worker Was Caching `meta.json`**
The service worker used a cache-first strategy for ALL requests, including `meta.json`. This meant iOS PWA would serve the old cached `meta.json` instead of fetching the latest version.

### 2. **iOS PWA Doesn't Fire `focus` Event Reliably**
Unlike desktop browsers, iOS PWAs don't consistently trigger the `focus` event when returning to the app. This prevented the version check from running when users opened the PWA.

### 3. **iOS Aggressive Caching**
iOS is known for very aggressive caching in PWAs, especially with service workers. Even with `cache: 'no-cache'`, iOS can still serve stale content if the service worker has it cached.

---

## What Was Fixed

### 1. **Service Worker: Network-First for `meta.json`**

**Before:**
```javascript
// Cache-first for everything (including meta.json)
event.respondWith(
  caches.match(event.request).then((response) => {
    if (response) {
      return response; // ❌ Returns cached meta.json
    }
    return fetch(event.request);
  })
);
```

**After:**
```javascript
// NEVER cache meta.json - always fetch fresh
if (event.request.url.includes('/meta.json')) {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  );
  return;
}
// Cache-first for everything else...
```

### 2. **Added iOS-Specific Event Listeners**

**Before:**
```javascript
// Only focus event (doesn't work well on iOS PWA)
window.addEventListener('focus', handleFocus);
```

**After:**
```javascript
// 1. visibilitychange - Works better on mobile/PWA
document.addEventListener('visibilitychange', handleVisibilityChange);

// 2. focus - Backup for desktop
window.addEventListener('focus', handleFocus);

// 3. pageshow - iOS Safari/PWA specific (detects back-forward cache)
window.addEventListener('pageshow', handlePageShow);
```

### 3. **Clear Service Worker Cache on Update**

**Before:**
```javascript
// Just reload
window.location.reload();
```

**After:**
```javascript
// Clear ALL caches before reload (iOS needs this)
if ('serviceWorker' in navigator && 'caches' in window) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      if (cacheName.includes('mysked')) {
        console.log('🗑️ Clearing cache:', cacheName);
        caches.delete(cacheName);
      }
    });
  });
}

// Reload with slight delay to allow cache clearing
setTimeout(() => {
  window.location.reload();
}, 100);
```

---

## How It Works Now (iOS PWA)

### Scenario 1: User Opens PWA
1. **User opens PWA** → `visibilitychange` event fires
2. **Version check runs** → Fetches fresh `/meta.json` (network-first, bypasses cache)
3. **If new version** → Clear caches → Reload app
4. **User sees latest version** ✅

### Scenario 2: User Switches Back to PWA
1. **User switches to another app** → PWA goes to background
2. **You deploy new version** → New `meta.json` on server
3. **User switches back to PWA** → `visibilitychange` fires
4. **Version check runs** → Detects new version → Auto-refresh! ✅

### Scenario 3: Periodic Check (Every 5 Minutes)
1. **User actively using PWA** → Interval timer running
2. **5 minutes pass** → Automatic version check
3. **If new version** → Auto-refresh seamlessly ✅

---

## Testing on iPhone

### Before Next Deployment:

1. **Check current version on iPhone:**
   - Open PWA
   - Open Safari Developer Tools (via Mac + iPhone cable)
   - Console should show: `📦 App version loaded: 1.1.3`

### After You Deploy v1.1.3:

1. **Keep PWA open on iPhone**
2. **Deploy to production**
3. **Switch away from PWA (go to home screen or another app)**
4. **Switch back to PWA**
5. **Should see in console:**
   ```
   📱 App visible, checking version...
   🔄 New version detected! Auto-refreshing...
   🗑️ Clearing cache: mysked-1.1.3
   ```
6. **App reloads with new version** ✨

### Alternative Test (Close & Reopen):

1. **Close PWA completely** (swipe up in app switcher)
2. **Reopen PWA from home screen**
3. **Should load with new version immediately**

---

## Changes Summary

### Files Modified:

1. ✅ `public/service-worker.js` (v1.1.3)
   - Added network-first strategy for `meta.json`
   - Prevents service worker from caching version info

2. ✅ `src/hooks/use-version-check.ts`
   - Fixed `INITIAL_VERSION_KEY` (was empty string)
   - Added `visibilitychange` event (iOS PWA friendly)
   - Added `pageshow` event (iOS back-forward cache)
   - Added cache clearing before reload (iOS needs this)

3. ✅ `package.json` → v1.1.3
4. ✅ `public/manifest.json` → v1.1.3

---

## Why This Should Work on iOS Now

### Before (v1.1.1):
- 🔴 Service worker cached `meta.json` → Always served old version
- 🔴 Only `focus` event → Didn't fire on iOS PWA
- 🔴 No cache clearing → iOS held onto old files

### After (v1.1.3):
- 🟢 Service worker **never caches** `meta.json` → Always fetches fresh
- 🟢 Multiple event listeners → `visibilitychange` + `pageshow` + `focus`
- 🟢 Cache clearing on update → Forces iOS to fetch new files
- 🟢 Better logging → Can debug in Safari Developer Tools

---

## Next Steps

### 1. Push Changes [[memory:2508668]]
```bash
cd /Users/kiwoon/Desktop/works/mysked-teamwork/mysked-frontend
git push && git push --tags
```

### 2. Merge to Production
Merge to your production branch

### 3. Test on iPhone
After deployment:
1. Connect iPhone to Mac with cable
2. Open Safari → Develop → [Your iPhone] → [Your PWA]
3. Watch console logs
4. Switch away and back to PWA
5. Should see auto-refresh! 🎉

---

## Additional Notes

### iOS PWA Quirks:
- iOS PWAs run in a separate "app mode" with different caching behavior
- Service workers are more aggressive on iOS
- Events like `focus` don't fire reliably in iOS PWA mode
- The `visibilitychange` and `pageshow` events are more reliable
- Sometimes need to clear caches manually for iOS to pick up changes

### If It Still Doesn't Work:
Users can force clear the PWA cache by:
1. Remove the PWA from home screen
2. Clear Safari cache (Settings → Safari → Clear History and Website Data)
3. Re-add PWA to home screen

But with v1.1.3, this shouldn't be necessary! The auto-refresh should work seamlessly.

---

**Expected Result:** iPhone PWA will now auto-update just like Chrome and MacBook PWA! 🚀📱

