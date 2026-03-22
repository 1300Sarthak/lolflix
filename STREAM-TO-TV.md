# How to Stream adfreetv to Your Smart TV

Your laptop and Smart TV are on the same network — here are your options, ranked by ease.

---

## Option 1: Screen Mirror (Easiest, Zero Setup)

Most Smart TVs support screen mirroring natively.

**macOS → Any Smart TV:**
- **AirPlay (Samsung/LG/Sony 2019+):** Click the AirPlay icon in the macOS menu bar → select your TV → mirror or extend display
- **Chromecast built-in (Sony/TCL/Hisense):** Open Chrome → click the three-dot menu → Cast → select your TV
- **Miracast (most Android-based TVs):** May need a third-party app like [Mirror for Samsung TV](https://apps.apple.com/us/app/mirror-for-samsung-tv/id1456540177)

Works right now with no code changes.

---

## Option 2: Access via Local IP (Best for Quality)

Since the app runs locally, you can access it directly from your TV's browser.

1. Find your laptop's local IP:
   ```bash
   ipconfig getifaddr en0
   # e.g. 192.168.1.42
   ```

2. Start the dev server binding to all interfaces:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   Or update `package.json`:
   ```json
   "dev": "next dev -H 0.0.0.0 -p 3000"
   ```

3. On your Smart TV, open the browser and go to:
   ```
   http://192.168.1.42:3000
   ```

This gives you the full app experience on the TV browser, no mirroring needed. Quality is native — no compression.

**Note:** Some Smart TV browsers have limited JS support. If the app doesn't render well, use Option 3.

---

## Option 3: Cast a Tab from Chrome (Good Balance)

1. Open the app in Chrome on your laptop
2. Right-click anywhere → "Cast" → select your TV
3. Choose "Cast tab" (not desktop) for best performance

Works if your TV has Chromecast built-in or you have a Chromecast dongle plugged in.

---

## Option 4: DLNA / UPnP (For Video Files Only)

If you're playing local video files (not streaming embeds), you can serve them via DLNA:
- Install [Universal Media Server](https://www.universalmediaserver.com/) or [Plex](https://www.plex.tv/)
- Most Smart TVs discover DLNA servers automatically

This won't work for the embedded streaming links in the app — only for local files.

---

## Recommendation

For this app specifically:
1. **Try Option 2 first** — open the TV browser and navigate to your laptop's IP. If the TV browser handles React well, this is the cleanest experience.
2. **Fall back to Option 1 (AirPlay/Chromecast)** if the TV browser struggles. Screen mirroring is seamless on macOS.
