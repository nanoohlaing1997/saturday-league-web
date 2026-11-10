#!/bin/bash
# Rebuild index.html from src/saturday-league.html.
# The source is the app with no document shell; this wraps it in the head the
# installable web app needs (manifest, icons, status bar, service worker).
set -euo pipefail
cd "$(dirname "$0")"

python3 - <<'PY'
body = open("src/saturday-league.html").read()
head_bits, rest = body.split("<style>", 1)
rest = "<style>" + rest

head = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#111E1A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Saturday League">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png">
<script src="firebase-config.js"></script>
""" + head_bits.strip() + """
</head>
<body>
"""

tail = """
<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* offline cache unavailable */ });
  });
}
</script>
</body>
</html>
"""

open("index.html", "w").write(head + rest.strip() + tail)
print("built index.html")
PY

# bump the cache so phones pick the new build up
current=$(grep -o 'saturday-league-v[0-9]*' sw.js | head -1)
next="saturday-league-v$(( ${current##*-v} + 1 ))"
sed -i '' "s/$current/$next/" sw.js
echo "service worker cache -> $next"
