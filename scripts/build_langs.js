/* Builds the language pages el/, de/, fr/, it/ from index.html.
   German, French and Italian texts come from js/i18n.js; Greek is already in index.html.
   Run: node scripts/build_langs.js   (the "Build language pages" GitHub Action runs it on every change) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const SITE = "https://sofia-apt-heraklion.github.io/";
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8"), ctx);
const I18N = ctx.window.I18N;
// photo descriptions (alt) and hidden labels (aria-label, title, placeholder) for every language
const ATTRS = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/attrs-i18n.json"), "utf8"));
const unesc = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function translateAttrs(html, l) {
  const A = ATTRS[l] || {};
  return html.replace(/\s(alt|aria-label|title|placeholder)="([^"]*)"/g, (m, a, v) => {
    const tr = A[unesc(v)];
    return tr != null ? ` ${a}="${esc(tr)}"` : m;
  });
}

const META = {
  el: { locale: "el_GR",
    title: "Sofia Apartments · Διαμερίσματα στο Ηράκλειο Κρήτης",
    desc: "Δύο ανακαινισμένα διαμερίσματα δίπλα στο Πάρκο Γεωργιάδη, 10 λεπτά με τα πόδια από το κέντρο του Ηρακλείου. Wi-Fi, κλιματισμός, αυτόματο check-in. Superhost.",
    og: "Sofia 164 και Sofia 264: δύο ανακαινισμένα διαμερίσματα δίπλα στο Πάρκο Γεωργιάδη, 10 λεπτά με τα πόδια από το κέντρο." },
  de: { locale: "de_DE",
    title: "Sofia Apartments · Ferienwohnungen in Heraklion, Kreta",
    desc: "Zwei renovierte Stadtwohnungen am Georgiadis-Park, 10 Gehminuten von der Altstadt Heraklions. Glasfaser-WLAN, Klimaanlage, Self-Check-in. Superhost, 4,98.",
    og: "Sofia 164 und Sofia 264: zwei renovierte Wohnungen am Georgiadis-Park, 10 Minuten zu Fuß von der Altstadt." },
  fr: { locale: "fr_FR",
    title: "Sofia Apartments · Appartements à Héraklion, Crète",
    desc: "Deux appartements rénovés près du parc Georgiadis, à 10 min à pied de la vieille ville d’Héraklion. Wi-Fi fibre, clim, arrivée autonome. Superhost, 4,98.",
    og: "Sofia 164 et Sofia 264 : deux appartements rénovés à côté du parc Georgiadis, à 10 minutes à pied de la vieille ville." },
  it: { locale: "it_IT",
    title: "Sofia Apartments · Appartamenti a Heraklion, Creta",
    desc: "Due appartamenti ristrutturati accanto al parco Georgiadis, a 10 minuti a piedi dal centro di Heraklion. Wi-Fi in fibra, aria condizionata, self check-in.",
    og: "Sofia 164 e Sofia 264: due appartamenti ristrutturati accanto al parco Georgiadis, a 10 minuti a piedi dal centro storico." }
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

// replace the inner HTML of every element with class "en" that has a translation
function translate(html, dict) {
  const open = /<([a-zA-Z][\w-]*)\b[^>]*\bclass="(?:[^"]*\s)?en(?:\s[^"]*)?"[^>]*>/g;
  let out = "", pos = 0, m, missing = 0;
  while ((m = open.exec(html))) {
    const tag = m[1].toLowerCase(); if (VOID.test(tag)) continue;
    const start = m.index + m[0].length;
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi"); re.lastIndex = start;
    let depth = 1, end = -1, t;
    while ((t = re.exec(html))) { if (t[1]) { if (--depth === 0) { end = t.index; break; } } else if (!t[0].endsWith("/>")) depth++; }
    if (end < 0) continue;
    const inner = html.slice(start, end), tr = dict.html[inner];
    if (tr != null) { out += html.slice(pos, start) + tr; pos = end; open.lastIndex = end; }
    else if (/[A-Za-z]{3}/.test(inner.replace(/<[^>]+>/g, ""))) missing++;
  }
  return { html: out + html.slice(pos), missing };
}

for (const l of ["el", "de", "fr", "it"]) {
  let h = src, missing = 0;
  if (l !== "el") { const r = translate(h, I18N[l]); h = r.html; missing = r.missing; }
  h = translateAttrs(h, l);
  const M = META[l], url = SITE + l + "/";
  h = h.replace(/<html lang="en">/, `<html lang="${l}" data-page-lang="${l}" data-root="../">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${M.title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(M.desc)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(M.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(M.og)}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(M.title)}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(M.og)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${M.locale}">`)
    .replace(/<meta property="og:locale:alternate" content="[^"]*">\n?/g, "")
    // files live one folder up
    .replace(/\b(src|href|poster|data-full)="(?![a-z][a-z0-9+.-]*:|#|\/|\.\.\/|guide\/|privacy\/)([^"]+)"/gi, '$1="../$2"')
    // responsive images: every address in srcset also lives one folder up
    .replace(/\bsrcset="([^"]+)"/g, (m, v) => 'srcset="' + v.split(",").map((part) => { const p = part.trim(); return /^([a-z][a-z0-9+.-]*:|\/|\.\.\/)/i.test(p) ? p : "../" + p; }).join(", ") + '"');
  h = h.replace("<!doctype html>", `<!doctype html>\n<!-- Built automatically from index.html by scripts/build_langs.js. Do not edit this file. -->`);
  fs.mkdirSync(path.join(ROOT, l), { recursive: true });
  fs.writeFileSync(path.join(ROOT, l, "index.html"), h);
  console.log(`${l}/index.html written${missing ? `, ${missing} texts without translation (shown in English)` : ""}`);
}
