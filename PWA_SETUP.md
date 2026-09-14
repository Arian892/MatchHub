# MatchHub PWA Setup Guide

Your app is now configured as a Progressive Web App (PWA)! 🎉

## What's a PWA?

A PWA allows users to:
- **Install** the app on their device (desktop, tablet, mobile)
- **Use offline** (app syncs when connection returns)
- **Launch** like a native app
- **Receive push notifications** (can be added later)
- **Skip the app store** - just download from browser

## Setup Steps

### 1. **Icons Setup** (Optional but recommended)

Icons appear when users install your app. 

**Option A: Auto-generate placeholder icons**
```bash
npm install canvas  # One-time install
node icon-generator.js
```

**Option B: Create custom icons** (Recommended for production)
- Design 192x192 and 512x512 PNG icons
- Place in `public/` folder:
  - `icon-192x192.png`
  - `icon-512x512.png`
  - `icon-maskable-192x192.png` (for adaptive icons)
  - `icon-maskable-512x512.png`

Tools: Figma, Photoshop, GIMP, or Canva

### 2. **Build and Deploy**

```bash
# Build for production
npm run build

# Test locally
npm run start
# Visit http://localhost:3000
```

### 3. **Deploy to Vercel** (Already done!)

Your app is already on Vercel. PWA features work automatically!

### 4. **Users Install Your App**

#### On Desktop (Chrome, Edge, Firefox):
1. Visit your app URL
2. Look for "Install" button in address bar
3. Click "Install" / "Add to Home Screen"
4. App launches in standalone window

#### On Mobile (iOS/Android):
1. Visit in mobile browser
2. Tap Share → Add to Home Screen
3. App icon appears on home screen
4. Tap to launch

#### On iOS (Alternative):
1. Safari menu → Add to Home Screen
2. Choose app name and add

## Features Included

✅ **Offline Support** - App works when offline (syncs when online)
✅ **Service Worker** - Handles caching and network requests
✅ **Install Prompt** - "Install" button appears for users
✅ **App Metadata** - Manifest defines app behavior
✅ **PWA Icons** - Shows in app drawer/home screen
✅ **Dark Theme** - Configured with theme color

## How It Works

- **manifest.json**: Defines app metadata (name, icons, colors)
- **service-worker.js**: Caches content for offline use
- **pwa-install.js**: Shows install prompts
- **Layout updates**: Added PWA meta tags

## Customization

### Change App Color
Edit `manifest.json`:
```json
"background_color": "#0F1120",
"theme_color": "#0F1120"
```

### Change App Name
Edit `manifest.json`:
```json
"name": "MatchHub - Football Match Tracker",
"short_name": "MatchHub"
```

### Add Custom Categories
Edit `manifest.json` categories field:
```json
"categories": ["sports", "lifestyle"]
```

## Testing PWA Locally

```bash
npm run build
npm run start
```

Then check DevTools → Application → Manifest & Service Workers

## Performance Tips

1. **Compress images** - Reduce icon file sizes
2. **Optimize assets** - Minify CSS/JS
3. **Test caching** - Verify offline functionality
4. **Monitor build size** - Keep under 5MB for fast install

## Troubleshooting

**Icons not showing?**
- Check `public/` folder has PNG files
- Verify paths in `manifest.json`
- Clear browser cache (Ctrl+Shift+Del)

**Install button not appearing?**
- Only shows over HTTPS (or localhost)
- App must be reliable (good Lighthouse score)
- Wait 30+ days for engagement (Chrome requirement)

**Offline not working?**
- Check Service Worker in DevTools
- Verify cache paths in `service-worker.js`
- Network might take 30 seconds to sync

## Next Steps

1. Add custom icons
2. Test on mobile device
3. Share app URL with users
4. Monitor installs in browser developer tools

---

**Questions?** Check [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
