# Progressive Web App (PWA) Setup

## Overview

Mysked is now configured as a Progressive Web App (PWA), allowing users to install it on their devices and use it with offline capabilities.

## Features

✅ **Installable** - Users can install the app on their home screen (mobile/desktop)
✅ **Offline Support** - Basic offline functionality with service worker caching
✅ **App-like Experience** - Runs in standalone mode without browser UI
✅ **Push Notifications** - Infrastructure ready for push notifications
✅ **Fast Loading** - Cached assets load instantly

## Files Added/Modified

### New Files:
1. **`public/manifest.json`** - PWA manifest with app metadata
2. **`public/service-worker.js`** - Service worker for offline caching
3. **`src/utils/register-sw.ts`** - Service worker registration utilities

### Modified Files:
1. **`index.html`** - Added PWA meta tags and manifest link
2. **`src/main.tsx`** - Registered service worker in production mode

## How to Use

### For Users

#### Mobile (iOS/Android):
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the browser menu (⋮ or share icon)
3. Select "Add to Home Screen"
4. The app will appear on your home screen like a native app

#### Desktop (Chrome/Edge):
1. Open the app in Chrome or Edge
2. Click the install icon (⊕) in the address bar
3. Click "Install" in the prompt
4. The app will open in its own window

### For Developers

#### Testing PWA Locally:
```bash
# Build the production version
yarn build

# Preview the production build
yarn preview

# Open http://localhost:8081
# PWA features only work in production build
```

#### Check PWA Readiness:
1. Open Chrome DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" section
4. Check "Service Workers" section
5. Use Lighthouse to audit PWA score

## Caching Strategy

### Cache-First (Static Assets):
- HTML, CSS, JavaScript files
- Images, fonts, icons
- Loads instantly from cache, updates in background

### Network-First (API Calls):
- All `/api/*` requests
- Fresh data when online
- Fallback to cache when offline
- Returns 503 when both fail

## Offline Functionality

The app will:
- ✅ Load previously visited pages when offline
- ✅ Display cached data
- ✅ Queue actions for when connection returns (future enhancement)
- ⚠️ Show appropriate offline messages for failed API calls

## Configuration

### Update App Name/Colors:
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "App",
  "theme_color": "#00A76F",
  "background_color": "#ffffff"
}
```

### Update Cached URLs:
Edit `public/service-worker.js`:
```javascript
const urlsToCache = [
  '/',
  '/index.html',
  // Add more static assets
];
```

### Disable PWA (if needed):
In `src/main.tsx`, comment out:
```typescript
// registerServiceWorker();
```

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ⚠️ Safari (Desktop) - Limited support

## Security Notes

- Service worker only works over HTTPS in production
- Use `localhost` or `127.0.0.1` for local development
- Service worker is automatically registered in production mode only

## Future Enhancements

- [ ] Add offline form submission queue
- [ ] Add background sync for pending actions
- [ ] Implement push notifications for job assignments
- [ ] Add periodic background sync for updates
- [ ] Create app shortcuts for quick actions
- [ ] Add share target for receiving shared content

## Troubleshooting

### PWA not installing:
1. Ensure you're using HTTPS (production)
2. Check manifest.json is accessible
3. Verify service worker registration in DevTools
4. Clear cache and hard reload

### Updates not appearing:
1. Unregister old service worker in DevTools
2. Clear all caches
3. Hard reload (Cmd+Shift+R or Ctrl+Shift+R)

### Service worker errors:
1. Check console for errors
2. Verify service-worker.js is in public folder
3. Ensure service worker scope is correct

## Learn More

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

