# Sofia Apartments · Heraklion

Static website for **Sofia 164** and **Sofia 264**. Plain HTML/CSS/JS, with no build step and no dependencies, hosted for free on GitHub Pages.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site (English + Greek) |
| `styles.css` | Design |
| `script.js` | Language switch, photo viewer, **contact details** |
| `assets/img/164`, `assets/img/264` | Photos and floor plans |
| `assets/video` | Tour videos and their poster images |
| `.nojekyll` | Tells GitHub Pages to serve files as they are |

## Publish on GitHub Pages (first time)

1. Create a free account at <https://github.com/signup>.
2. Create a new repository: **+** (top right) → **New repository**.
   - Name it **`<your-username>.github.io`**, for example `sofiaheraklion.github.io`, so the site lives at `https://sofiaheraklion.github.io`.
   - Visibility **Public**. Leave the other options unchecked. Click **Create repository**.
3. On the empty repository page, click **uploading an existing file**.
4. Unzip `sofia-apartments-site.zip` on your computer. Open the unzipped folder, select **everything inside it** (not the folder itself) and drag it into the browser window. Wait until all files are listed, then click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
6. After 1–2 minutes the site is live at `https://<your-username>.github.io`.

## Features
Bilingual (EN/EL, auto-detected), swipeable galleries with full-screen viewer, tour videos, floor plans, booking-request form that opens a pre-filled email, quick actions (email, call, Viber, directions, share), FAQ, Google map (Athinas 26), save-contact (vCard), QR code, installable as an app (PWA), SEO structured data, mobile booking bar, back-to-top, reduced-motion support.

## Change contact details

Open `script.js` on GitHub, click the pencil icon (**Edit**), fill in:

```js
const CONTACT = {
  phone: "+306972777487",
  whatsapp: "",
  email: "sofia.kokkini64@gmail.com"
};
```

Then click **Commit changes**. Empty values hide their button.

## Replace a photo

Upload a new image with **exactly the same file name** into the same folder (`assets/img/164/...`) via **Add file → Upload files**. It replaces the old one.

## Custom domain (optional)

Buy a domain (e.g. from papaki.gr or Namecheap), then in **Settings → Pages → Custom domain** enter it and follow GitHub's DNS instructions.
