# Sofia Apartments · Heraklion

Website for **Sofia 164** and **Sofia 264**, live at <https://sofia-apt-heraklion.github.io>.
Plain HTML/CSS/JS, with no build step, hosted free on GitHub Pages.

## Folders

```
index.html            the page (English + Greek)
manifest.json         "install as app" settings
sw.js                 offline cache (must stay in the main folder)
availability.json     booked dates, written automatically every 3 hours (don't edit)
css/styles.css        design
js/script.js          everything interactive + contact details (phone, email)
js/places.js          "Our favourite places" list
js/worldmap.js        world map shapes for the guests map
images/sofia-164/     photos + floor plan of Sofia 164 (-sm = small copy for fast loading)
images/sofia-264/     photos + floor plan of Sofia 264
images/icons/         app icons
videos/               tour videos and their poster images
.github/workflows/    calendar.yml: syncs the Airbnb calendars every 3 hours
```

## Updating a file

Open the folder on GitHub (for example `images/sofia-164`), then **Add file → Upload files**.
A file with the same name replaces the old one.

## Calendar sync

The Airbnb calendar links are stored as secrets `ICAL_164` and `ICAL_264`
(Settings → Secrets and variables → Actions). To sync immediately:
**Actions → Update calendar → Run workflow**.
