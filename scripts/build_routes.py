#!/usr/bin/env python3
"""Pre-computes the routes drawn on the favourites map and writes routes.json.

Run by the "Build routes" GitHub Action (Actions -> Build routes -> Run workflow),
and automatically whenever js/places.js changes.
Uses the public OSRM servers of FOSSGIS (routing.openstreetmap.de), politely: one request at a time.
Walking routes for places closer than 2.5 km, driving routes for the rest.
"""
import json, math, os, re, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "js", "places.js"), encoding="utf-8").read()
places = json.loads(re.search(r"window\.PLACES=(\[.*?\]);", src, re.S).group(1))
home = json.loads(re.search(r"window\.HOME=(\[.*?\]);", src).group(1))

def dist(a, b):
    r = math.radians
    x = math.sin(r(b[0] - a[0]) / 2) ** 2 + math.cos(r(a[0])) * math.cos(r(b[0])) * math.sin(r(b[1] - a[1]) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(x))

def route(mode, to):
    profile = "routed-foot/route/v1/foot" if mode == "foot" else "routed-car/route/v1/driving"
    url = (f"https://routing.openstreetmap.de/{profile}/{home[1]},{home[0]};{to[1]},{to[0]}"
           "?overview=full&geometries=polyline")
    req = urllib.request.Request(url, headers={"User-Agent": "sofia-apartments-site/1.0 (route pre-computation)"})
    for attempt in range(3):
        try:
            data = json.load(urllib.request.urlopen(req, timeout=30))
            r = data["routes"][0]
            return {"mode": mode, "m": round(r["distance"]), "s": round(r["duration"]), "line": r["geometry"]}
        except Exception as e:  # noqa: BLE001
            print("  retry", attempt + 1, e)
            time.sleep(2)
    return None

out, seen = {}, set()
for p in places:
    name, lat, lng = p[1], p[5], p[6]
    if name in seen:
        continue
    seen.add(name)
    mode = "foot" if dist(home, [lat, lng]) < 2500 else "car"
    print(mode, name)
    r = route(mode, [lat, lng])
    if r:
        out[name] = r
    time.sleep(0.8)

json.dump(out, open(os.path.join(ROOT, "routes.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "routes written")
