/* ================================================================
   CONTACT DETAILS: fill these in and the buttons appear automatically.
   Leave a value empty ("") to hide that button.
   phone / whatsapp: international format without spaces, e.g. "+306912345678"
   ================================================================ */
const CONTACT = {
  phone: "+306972777487",
  whatsapp: "",
  email: "sofia.apt.heraklion@gmail.com",
  // Web app address of the Google Apps Script booking form (scripts/google-apps-script/booking-form.gs).
  // When it is filled in, guests also get an automatic confirmation email in their language.
  // Leave it empty ("") and requests are sent through FormSubmit instead.
  form: "https://script.google.com/macros/s/AKfycbxVfDLdWUupCPgL10W1ImQsyrhMGGV0KxYFlJBgMtbpJPbprIwlLCNkIewjGVx_nGE/exec"
};

/* ---------- language: English and Greek are in the page; German, French, Italian come from js/i18n.js ---------- */
const LANGS = { en: ["EN", "en-GB"], el: ["ΕΛ", "el-GR"], de: ["DE", "de-DE"], fr: ["FR", "fr-FR"], it: ["IT", "it-IT"] };
const ROOT = document.documentElement.dataset.root || "";          // "../" on the language pages
const PAGE_LANG = document.documentElement.dataset.pageLang || "en";
const curLang = () => document.documentElement.lang;
const LOCALE = () => (LANGS[curLang()] || LANGS.en)[1];
(function () {
  const root = document.documentElement, btn = document.getElementById("langToggle"), menu = document.getElementById("langMenu");
  const orig = new WeakMap(), done = new WeakSet();
  let D = null;                                  // dictionary of the current extra language
  const segs = (s) => s.split(" · ");
  function trText(s) {
    if (!D) return s;
    const t = s.trim(); if (!t) return s;
    if (D.text[t] != null) return s.replace(t, D.text[t]);
    for (const [re, rep] of D.pat) { const r = new RegExp(re); if (r.test(t)) { const m = t.match(r); return s.replace(t, rep.replace(/\$(\d)/g, (_, i) => { const g = m[+i]; return D.text[g] != null ? D.text[g] : g; })); } }
    if (t.includes(" · ")) {
      // translate the longest run of " · " pieces that the dictionary knows, then the rest piece by piece
      const p = segs(t), outp = [];
      for (let i = 0; i < p.length;) {
        let k = p.length;
        for (; k > i + 1; k--) { const key = p.slice(i, k).join(" · "); if (D.text[key] != null) break; }
        const key = p.slice(i, k).join(" · ");
        outp.push(D.text[key] != null ? D.text[key] : trText(key)); i = k;
      }
      const j = outp.join(" · "); if (j !== t) return s.replace(t, j);
    }
    return s;
  }
  function trNode(n) {
    if (!D) return;
    if (n.nodeType === 3) {
      if (done.has(n) || !n.parentElement || n.parentElement.closest(".el,script,style,svg,[data-no-tr]")) return;
      const v = trText(n.nodeValue); if (v !== n.nodeValue) { n.nodeValue = v; } done.add(n); return;
    }
    if (n.nodeType !== 1 || n.matches("script,style,svg,.el")) return;
    ["placeholder", "title", "aria-label"].forEach((a) => { if (n.hasAttribute(a)) { const v = trText(n.getAttribute(a)); if (v !== n.getAttribute(a)) n.setAttribute(a, v); } });
    n.querySelectorAll(".en").forEach(trEn);
    if (n.matches(".en")) trEn(n);
    const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let x; while ((x = w.nextNode())) trNode(x);
    n.querySelectorAll("[placeholder],[title],[aria-label]").forEach((e) => ["placeholder", "title", "aria-label"].forEach((a) => { if (e.hasAttribute(a)) { const v = trText(e.getAttribute(a)); if (v !== e.getAttribute(a)) e.setAttribute(a, v); } }));
  }
  function trEn(el) {
    if (!orig.has(el)) orig.set(el, el.innerHTML);
    const o = orig.get(el), v = D && D.html[nk(o)];
    if (v != null && el.innerHTML !== v) el.innerHTML = v;
  }
  const tpl = document.createElement("template");
  const nk = (h) => { tpl.innerHTML = h; return tpl.innerHTML.replace(/\s+/g, " ").trim(); };
  function prep(d) { if (d && !d._n) { const h = {}; for (const k in d.html) h[nk(k)] = d.html[k]; d.html = h; d._n = 1; } return d; }
  function restore() { document.querySelectorAll(".en").forEach((el) => { if (orig.has(el) && el.innerHTML !== orig.get(el)) el.innerHTML = orig.get(el); }); }
  const mo = new MutationObserver((ms) => { if (!D) return; ms.forEach((m) => { if (m.type === "characterData") { done.delete(m.target); trNode(m.target); } else if (m.type === "attributes") trNode(m.target); else m.addedNodes.forEach(trNode); }); });
  function loadDict(l) {
    if (window.I18N) return Promise.resolve(window.I18N[l]);
    return new Promise((res) => { const s = document.createElement("script"); s.src = ROOT + "js/i18n.js?v=8"; s.onload = () => res(window.I18N && window.I18N[l]); s.onerror = () => res(null); document.head.appendChild(s); });
  }
  async function setLang(l, save) {
    if (!LANGS[l]) l = "en";
    root.lang = l;
    document.getElementById("langCur").textContent = LANGS[l][0];
    menu.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-checked", b.dataset.lang === l));
    if (save) try { localStorage.setItem("lang", l); } catch (e) {}
    D = null; restore();
    if (l !== "en" && l !== "el") {
      const dict = await loadDict(l);
      if (root.lang !== l) return;
      if (dict) { D = prep(dict); trNode(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] }); }
    } else mo.disconnect();
    document.dispatchEvent(new Event("langchange"));
  }
  const open = (o) => { menu.hidden = !o; btn.setAttribute("aria-expanded", o); };
  btn.addEventListener("click", (e) => { e.stopPropagation(); open(menu.hidden); });
  // each language has its own page: / (English), /el/, /de/, /fr/, /it/
  const urlFor = (l) => new URL(ROOT + (l === "en" ? "" : l + "/"), location.href).href + location.hash;
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b) return; open(false);
    const l = b.dataset.lang; try { localStorage.setItem("lang", l); } catch (err) {}
    if (/^https?:/.test(location.protocol)) { if (l !== PAGE_LANG) location.href = urlFor(l); }
    else setLang(l, true);
  });
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".lang-wrap")) open(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) open(false); });
  root.lang = PAGE_LANG;
  document.getElementById("langCur").textContent = LANGS[PAGE_LANG][0];
  menu.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-checked", b.dataset.lang === PAGE_LANG));
  if (PAGE_LANG !== "en" && PAGE_LANG !== "el") addEventListener("DOMContentLoaded", () => setLang(PAGE_LANG, false));
  window.setLang = setLang;
})();

const EMAIL = CONTACT.email, PHONE = CONTACT.phone;
const ADDRESS = "Αθηνάς 26, Ηράκλειο";
const t = (en, el) => (document.documentElement.lang === "el" ? el : en);
function toast(msg) { const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2200); }
function mailto(subject, body) { return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; }
/* ---------- contact buttons ---------- */
document.querySelectorAll("[data-contact]").forEach((a) => {
  const kind = a.dataset.contact;
  const v = CONTACT[kind];
  if (!v) { a.remove(); return; }
  if (kind === "phone") a.href = "tel:" + v;
  if (kind === "whatsapp") { a.href = "https://wa.me/" + v.replace(/[^0-9]/g, ""); a.target = "_blank"; a.rel = "noopener"; }
  if (kind === "email") a.href = "mailto:" + v;
});

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- lightbox ---------- */
const lb = document.getElementById("lightbox");
const lbImg = lb.querySelector("img");
const lbCap = lb.querySelector("figcaption");
let set = [], idx = 0;
function show(i) {
  idx = (i + set.length) % set.length;
  lbImg.src = set[idx].src;
  lbImg.alt = set[idx].alt;
  lbCap.textContent = `${set[idx].alt}  ·  ${idx + 1} / ${set.length}`;
}
function open(list, i) {
  set = list; show(i);
  if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
}
/* ---------- photo tour by room ---------- */
const ROOMS = {
  living: ["Living room", "Σαλόνι"], kitchen: ["Kitchen & dining", "Κουζίνα & τραπεζαρία"], entrance: ["Entrance & hallway", "Είσοδος & διάδρομος"],
  bedroom: ["Bedroom", "Υπνοδωμάτιο"], master: ["Master bedroom", "Κύριο υπνοδωμάτιο"], bed2: ["Second bedroom", "Δεύτερο υπνοδωμάτιο"],
  bath: ["Bathroom", "Μπάνιο"], balcony: ["Balcony", "Μπαλκόνι"], plan: ["Floor plan", "Κάτοψη"]
};
const ORDER = ["living", "kitchen", "entrance", "bedroom", "master", "bed2", "bath", "balcony", "plan"];
const tour = document.getElementById("tour");
const tourBody = document.getElementById("tourBody"), tourChips = document.getElementById("tourChips");
const L = (k) => (document.documentElement.lang === "el" ? ROOMS[k][1] : ROOMS[k][0]);
function tourList(g) {
  const imgs = [...g.querySelectorAll("img")];
  return ORDER.flatMap((r) => imgs.filter((i) => i.dataset.room === r));
}
function openTour(g, room) {
  const list = tourList(g);
  document.getElementById("tourTitle").textContent = g.dataset.gallery ? "Sofia " + g.dataset.gallery : "";
  tourBody.innerHTML = ""; tourChips.innerHTML = "";
  ORDER.forEach((r) => {
    const items = list.filter((i) => i.dataset.room === r);
    if (!items.length) return;
    const chip = document.createElement("button");
    chip.type = "button"; chip.className = "tchip";
    chip.innerHTML = `<img src="${items[0].src}" alt="" loading="lazy"><span>${L(r)}</span>`;
    chip.addEventListener("click", () => document.getElementById("room-" + r).scrollIntoView({ behavior: "smooth", block: "start" }));
    tourChips.appendChild(chip);
    const sec = document.createElement("section");
    sec.className = "troom"; sec.id = "room-" + r;
    sec.innerHTML = `<h4>${L(r)}</h4><div class="tgrid${r === "plan" ? " one" : ""}"></div>`;
    const grid = sec.querySelector(".tgrid");
    items.forEach((img) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tph";
      const im = document.createElement("img"); im.src = img.src; im.decoding = "async"; im.alt = img.alt; im.loading = "lazy";
      b.appendChild(im);
      b.addEventListener("click", () => {
        if (r === "plan" && g.dataset.gallery && document.querySelector(`[data-plan="${g.dataset.gallery}"]`)) return openPlan(g.dataset.gallery);
        open(list.map((x) => ({ src: x.dataset.full || x.src, alt: `${L(x.dataset.room)} · ${x.alt}` })), list.indexOf(img));
      });
      grid.appendChild(b);
    });
    tourBody.appendChild(sec);
  });
  if (typeof tour.showModal === "function") tour.showModal(); else tour.setAttribute("open", "");
  document.body.style.overflow = "hidden";
  tourBody.scrollTop = 0;
  if (room) setTimeout(() => { const t = document.getElementById("room-" + room); if (t) t.scrollIntoView({ block: "start" }); }, 30);
}
tour.addEventListener("close", () => (document.body.style.overflow = ""));
tour.querySelector(".tour-close").addEventListener("click", () => tour.close());
document.querySelectorAll(".gallery").forEach((g) => {
  const imgs = [...g.querySelectorAll("img")];
  imgs.forEach((img) => img.addEventListener("click", () => openTour(g, img.dataset.room)));
  g.closest(".gwrap").querySelector(".g-all").addEventListener("click", () => openTour(g));
});
/* ---------- interactive floor plans ---------- */
document.querySelectorAll("[data-plan]").forEach((fig) => {
  const apt = fig.dataset.plan;
  const g = document.querySelector(`.gallery[data-gallery="${apt}"]`);
  const img = fig.querySelector(".planwrap img");
  const zones = [...fig.querySelectorAll(".pz")];
  const hl = (room, on) => zones.forEach((z) => z.classList.toggle("hot", on && z.dataset.planRoom === room));
  fig.querySelectorAll("[data-plan-room]").forEach((el) => {
    const room = el.dataset.planRoom;
    el.addEventListener("mouseenter", () => hl(room, true));
    el.addEventListener("mouseleave", () => hl(room, false));
    el.addEventListener("focus", () => hl(room, true));
    el.addEventListener("blur", () => hl(room, false));
    el.addEventListener("click", () => openTour(g, room));
  });
  fig.querySelector(".plan-zoom").addEventListener("click", () => openPlan(apt));
  img.style.cursor = "zoom-in";
});

/* ---------- enlarged interactive floor plan ---------- */
const planbox = document.getElementById("planbox");
function openPlan(apt) {
  const fig = document.querySelector(`[data-plan="${apt}"]`);
  if (!fig || !planbox) return;
  const g = document.querySelector(`.gallery[data-gallery="${apt}"]`);
  const src = fig.querySelector(".planwrap img");
  const stage = planbox.querySelector(".pb-stage"), chipsBox = planbox.querySelector(".pb-chips");
  const wrap = fig.querySelector(".planwrap").cloneNode(true);
  wrap.classList.add("pb-wrap");
  const im = wrap.querySelector("img");
  im.removeAttribute("loading"); im.style.cursor = "default";
  wrap.style.setProperty("--ar", (src.naturalWidth || +src.getAttribute("width")) / (src.naturalHeight || +src.getAttribute("height")));
  stage.innerHTML = ""; stage.appendChild(wrap);
  chipsBox.innerHTML = ""; chipsBox.appendChild(fig.querySelector(".plan-chips").cloneNode(true));
  planbox.querySelector(".pb-title b").textContent = "Sofia " + apt;
  const zones = [...wrap.querySelectorAll(".pz")];
  const hl = (room, on) => zones.forEach((z) => z.classList.toggle("hot", on && z.dataset.planRoom === room));
  planbox.querySelectorAll("[data-plan-room]").forEach((el) => {
    const room = el.dataset.planRoom;
    el.addEventListener("mouseenter", () => hl(room, true));
    el.addEventListener("mouseleave", () => hl(room, false));
    el.addEventListener("focus", () => hl(room, true));
    el.addEventListener("blur", () => hl(room, false));
    el.addEventListener("click", () => { planbox.close(); if (tour.open) tour.close(); openTour(g, room); });
  });
  if (typeof planbox.showModal === "function") planbox.showModal(); else planbox.setAttribute("open", "");
  document.body.style.overflow = "hidden";
}
if (planbox) {
  planbox.querySelector(".pb-close").addEventListener("click", () => planbox.close());
  planbox.addEventListener("close", () => { if (!tour.open) document.body.style.overflow = ""; });
  planbox.addEventListener("click", (e) => { if (e.target === planbox || e.target.classList.contains("pb-inner") || e.target.classList.contains("pb-stage")) planbox.close(); });
}
document.querySelectorAll("[data-plan] .planwrap img").forEach((im) =>
  im.addEventListener("click", () => openPlan(im.closest("[data-plan]").dataset.plan)));
lb.querySelector(".lb-close").addEventListener("click", () => lb.close());
lb.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
lb.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
document.addEventListener("keydown", (e) => {
  if (!lb.open) return;
  if (e.key === "Escape") { e.preventDefault(); lb.close(); return; }
  if (e.key === "ArrowRight") show(idx + 1);
  if (e.key === "ArrowLeft") show(idx - 1);
});

/* ---------- nav: shadow, scroll-spy, mobile menu ---------- */
const nav = document.querySelector(".nav");
const menuBtn = document.getElementById("menuBtn");
function setMenu(o) {
  nav.style.setProperty("--navh", nav.getBoundingClientRect().bottom + "px");
  nav.classList.toggle("open", o);
  document.documentElement.classList.toggle("menu-open", o);
  menuBtn.setAttribute("aria-expanded", o);
  menuBtn.setAttribute("aria-label", o ? "Close menu" : "Menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
document.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) setMenu(false); });
addEventListener("resize", () => { if (innerWidth > 860 && nav.classList.contains("open")) setMenu(false); });
const links = [...document.querySelectorAll(".nav-links > a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
const bookbar = document.getElementById("bookbar");
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y > 20);
  let cur = -1;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.35) cur = i; });
  links.forEach((a, i) => a.classList.toggle("active", i === cur));
  const contact = document.getElementById("contact").getBoundingClientRect().top;
  bookbar.classList.toggle("show", y > window.innerHeight * 0.6 && contact > window.innerHeight * 0.8);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- reveal on scroll: sections appear step by step ---------- */
// add the reveal effect to every main block without touching the HTML
["#sofia-164 .gwrap", "#sofia-264 .gwrap", ".apt .cols > div", ".plan", ".group", ".rv-top", ".rv-track", ".gm-grid", ".gstats",
 "#location .cols > div", ".arr-grid", ".tips", ".fmap-grid", ".flists", ".qas", ".book-grid > *", ".contact .wrap > *",
 ".eyebrow", "section h2", ".choose .card"].forEach((sel) =>
  document.querySelectorAll(sel).forEach((el) => { if (!el.closest(".hero,.nav,dialog,.reveal,.reveal-stagger") || el.matches(".reveal")) el.classList.add("reveal"); }));
document.querySelectorAll(".rv-track, .arr-grid, .tips, .gstats, .qas").forEach((el) => { el.classList.remove("reveal"); el.classList.add("reveal-stagger"); });
const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io ? io.observe(el) : el.classList.add("in"));

/* ---------- mobile gallery counter ---------- */
document.querySelectorAll(".gallery").forEach((g) => {
  const imgs = [...g.querySelectorAll("img")];
  const c = g.closest(".gwrap").querySelector(".g-count");
  const upd = () => {
    const i = Math.round(g.scrollLeft / (imgs[1] ? imgs[1].offsetLeft - imgs[0].offsetLeft : 1));
    c.textContent = `${Math.min(i + 1, imgs.length)} / ${imgs.length}`;
  };
  g.addEventListener("scroll", upd, { passive: true }); upd();
});

/* ---------- lightbox swipe ---------- */
let tx = null;
lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
  tx = null;
});

/* ---------- quick actions ---------- */
document.querySelectorAll("[data-tel]").forEach((a) => (a.href = "tel:" + PHONE));
document.querySelectorAll("[data-sms]").forEach((a) => (a.href = "sms:" + PHONE));
document.querySelectorAll("[data-viber]").forEach((a) => (a.href = "viber://chat?number=" + encodeURIComponent(PHONE)));
document.querySelectorAll("[data-directions]").forEach((a) => (a.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(ADDRESS)));
document.querySelectorAll("[data-mail]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  const apt = a.dataset.mail;
  location.href = mailto(t(`Question about ${apt}`, `Ερώτηση για το ${apt}`), t(`Hello Sofia,\n\nI have a question about ${apt}:\n\n`, `Γεια σας Σοφία,\n\nΘα ήθελα να ρωτήσω για το ${apt}:\n\n`));
}));
async function share(hash) {
  const url = location.href.split("#")[0] + (hash || "");
  const data = { title: "Sofia Apartments · Heraklion", text: t("Two lovely apartments in Heraklion, Crete", "Δύο υπέροχα διαμερίσματα στο Ηράκλειο"), url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(url); toast(t("Link copied", "Ο σύνδεσμος αντιγράφηκε"));
  } catch (e) { if (e && e.name !== "AbortError") prompt(t("Copy this link:", "Αντιγράψτε τον σύνδεσμο:"), url); }
}
document.getElementById("shareBtn").addEventListener("click", () => share(""));
document.querySelectorAll("[data-share]").forEach((b) => b.addEventListener("click", () => share(b.dataset.share)));

/* ---------- booking form: price calculator + request sent from the page ---------- */
const form = document.getElementById("bookForm");
const fin = form.elements["in"], fout = form.elements["out"], fg = form.elements["guests"];
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date(); fin.min = iso(today);
const maxFor = () => ({ "Sofia 164": 4, "Sofia 264": 6 }[form.elements["apt"].value] || 10);
// default guests per apartment (until the visitor changes the number themselves)
const DEF_GUESTS = { "Sofia 164": 2, "Sofia 264": 4 };
let guestsTouched = false;
// country calling codes; names come from the browser in the page language
const DIAL = "GR30 DE49 FR33 IT39 GB44 US1 NL31 BE32 AT43 CH41 CY357 IL972 ES34 PT351 IE353 DK45 SE46 NO47 FI358 PL48 CZ420 SK421 HU36 RO40 BG359 RS381 HR385 SI386 AL355 MK389 TR90 UA380 RU7 CA1 AU61 NZ64 AF93 DZ213 AD376 AO244 AR54 AM374 AZ994 BS1 BH973 BD880 BB1 BY375 BZ501 BJ229 BT975 BO591 BA387 BW267 BR55 BN673 BF226 BI257 KH855 CM237 CV238 CF236 TD235 CL56 CN86 CO57 KM269 CG242 CD243 CR506 CI225 CU53 DJ253 DM1 DO1 EC593 EG20 SV503 GQ240 ER291 EE372 SZ268 ET251 FJ679 GA241 GM220 GE995 GH233 GD1 GT502 GN224 GW245 GY592 HT509 HN504 HK852 IS354 IN91 ID62 IR98 IQ964 JM1 JP81 JO962 KZ7 KE254 KI686 XK383 KW965 KG996 LA856 LV371 LB961 LS266 LR231 LY218 LI423 LT370 LU352 MO853 MG261 MW265 MY60 MV960 ML223 MT356 MH692 MR222 MU230 MX52 FM691 MD373 MC377 MN976 ME382 MA212 MZ258 MM95 NA264 NR674 NP977 NI505 NE227 NG234 KP850 OM968 PK92 PW680 PS970 PA507 PG675 PY595 PE51 PH63 PR1 QA974 RW250 KN1 LC1 VC1 WS685 SM378 ST239 SA966 SN221 SC248 SL232 SG65 SB677 SO252 ZA27 KR82 SS211 LK94 SD249 SR597 SY963 TW886 TJ992 TZ255 TH66 TL670 TG228 TO676 TT1 TN216 TM993 TV688 UG256 AE971 UY598 UZ998 VU678 VA39 VE58 VN84 YE967 ZM260 ZW263 GI350 FO298 GL299 AW297 CW599 RE262 GP590 MQ596 NC687 PF689 BM1 KY1 VG1 AG1 AI1 MS1 TC1 GU1 VI1 JE44 GG44 IM44"
  .split(" ").map((x) => [x.slice(0, 2), x.slice(2)]);
const TOP_CC = ["GR", "DE", "FR", "IT", "GB", "US", "NL", "BE", "AT", "CH", "CY", "IL"];
const ccSel = document.getElementById("ccSel"), ccShow = document.getElementById("ccShow");
function buildCC() {
  const lang = curLang(), keep = ccSel.value;
  let names; try { names = new Intl.DisplayNames([lang], { type: "region" }); } catch (e) { names = null; }
  const nm = (c) => { try { return (names && names.of(c)) || c; } catch (e) { return c; } };
  const opt = ([c, d]) => `<option value="${c}" data-dial="+${d}">${nm(c)} (+${d})</option>`;
  const top = DIAL.filter(([c]) => TOP_CC.includes(c)).sort((a, b) => TOP_CC.indexOf(a[0]) - TOP_CC.indexOf(b[0]));
  const rest = DIAL.filter(([c]) => !TOP_CC.includes(c)).sort((a, b) => nm(a[0]).localeCompare(nm(b[0]), lang));
  ccSel.innerHTML = top.map(opt).join("") + '<option disabled>──────────</option>' + rest.map(opt).join("");
  if (keep) ccSel.value = keep;
  else {
    // Greek page → Greece; otherwise the country of the visitor's browser, else the page language's country
    const fromLang = { el: "GR", de: "DE", fr: "FR", it: "IT", en: "GB" }[lang] || "GR";
    let region = null;
    // English page: any browser region (en-US → +1, de-DE → +49); other pages: only a browser region in the same language (de-AT → +43)
    (navigator.languages || [navigator.language || ""]).some((l) => { const m = /^([a-z]{2,3})-([A-Z]{2})$/i.exec(l || ""); if (m && (lang === "en" || m[1].toLowerCase() === lang)) { region = m[2].toUpperCase(); return true; } return false; });
    ccSel.value = lang === "el" ? "GR" : (region && DIAL.some(([c]) => c === region) ? region : fromLang);
  }
  showCC();
}
function showCC() { const o = ccSel.selectedOptions[0]; ccShow.textContent = o ? o.dataset.dial : "+"; }
ccSel.addEventListener("change", () => { showCC(); ccSel.closest(".cc-wrap").classList.remove("err"); });
buildCC();
document.addEventListener("langchange", () => setTimeout(buildCC, 0));
// full international number, or "" if it does not look like a phone number
function fullPhone() {
  let v = form.elements["phone"].value.trim();
  if (v.startsWith("+") || v.startsWith("00")) { const d = v.replace(/^00/, "").replace(/\D/g, ""); return d.length >= 8 && d.length <= 15 ? "+" + d : ""; }
  let d = v.replace(/\D/g, "");
  if (ccSel.value !== "IT") d = d.replace(/^0+/, "");
  return d.length >= 6 && d.length <= 14 ? `${ccShow.textContent} ${d}` : "";
}
function nights() {
  const el = document.getElementById("nights");
  if (fin.value && fout.value) {
    const n = Math.round((new Date(fout.value) - new Date(fin.value)) / 864e5);
    el.textContent = n > 0 ? t(`${n} night${n > 1 ? "s" : ""}`, `${n} ${n > 1 ? "διανυκτερεύσεις" : "διανυκτέρευση"}`) : t("Check-out must be after check-in", "Η αναχώρηση πρέπει να είναι μετά την άφιξη");
    return n;
  }
  el.textContent = ""; return 0;
}
fin.addEventListener("change", () => {
  if (fin.value) { const d = new Date(fin.value); d.setDate(d.getDate() + 1); fout.min = iso(d); if (!fout.value || fout.value <= fin.value) fout.value = iso(d); }
  nights();
});
fout.addEventListener("change", nights);
document.addEventListener("langchange", () => setTimeout(nights, 0));
form.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
  guestsTouched = true;
  fg.value = Math.max(1, Math.min(maxFor(), (+fg.value || 1) + +b.dataset.step));
}));
fg.addEventListener("input", () => (guestsTouched = true));
form.querySelectorAll('input[name="apt"]').forEach((r) => r.addEventListener("change", () => {
  fg.max = maxFor();
  const a = form.elements["apt"].value;
  if (!guestsTouched) fg.value = DEF_GUESTS[a] || 6;
  if (+fg.value > maxFor()) fg.value = maxFor();
}));
document.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", () => {
  const r = form.querySelector(`input[name="apt"][value="Sofia ${a.dataset.pick}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event("change")); }
}));
const done = document.getElementById("bookDone");
document.getElementById("bookAgain").addEventListener("click", () => { done.hidden = true; form.hidden = false; form.elements["msg"].value = ""; });
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fe = form.elements, name = fe["name"].value.trim(), email = fe["email"].value.trim(), phone = fullPhone(), msg = fe["msg"].value.trim();
  const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  [fin, fout].forEach((f) => f.classList.toggle("err", !f.value));
  fe["name"].classList.toggle("err", !name); fe["email"].classList.toggle("err", !okMail);
  const n = nights();
  if (!fin.value || !fout.value || n <= 0) { toast(t("Please choose your dates", "Επιλέξτε ημερομηνίες")); return; }
  if (!name) { toast(t("Please write your name", "Γράψτε το όνομά σας")); fe["name"].focus(); return; }
  if (!okMail) { toast(t("Please check your email address", "Ελέγξτε τη διεύθυνση email")); fe["email"].focus(); return; }
  fe["phone"].classList.toggle("err", !phone);
  if (!phone) { toast(t("Please enter your mobile number", "Γράψτε τον αριθμό του κινητού σας")); fe["phone"].focus(); return; }
  if (fe["_honey"].value) return;
  const apt = fe["apt"].value;
  const fmt = (v) => new Date(v).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const langName = { en: "English", el: "Greek", de: "German", fr: "French", it: "Italian" }[curLang()] || curLang();
  const data = {
    _subject: `Booking request: ${apt}, ${fin.value} to ${fout.value} (${name})`,
    _template: "table", _captcha: "false",
    Apartment: apt, "Check-in": fmt(fin.value), "Check-out": fmt(fout.value), Nights: n, Guests: fg.value,
    Name: name, email, Phone: phone, Message: msg || "-",
    Language: langName
  };
  const btn = form.querySelector(".submit"); btn.disabled = true; btn.classList.add("busy");
  const mailFallback = () => {
    const body = `Hello Sofia,\n\nI would like to book:\n\nApartment: ${apt}\nCheck-in: ${fmt(fin.value)}\nCheck-out: ${fmt(fout.value)}\nNights: ${n}\nGuests: ${fg.value}\n${phone ? "Mobile: " + phone + "\n" : ""}${msg ? "\n" + msg + "\n" : ""}\nThank you,\n${name}`;
    location.href = mailto(data._subject, body);
    toast(t("Opening your email app…", "Ανοίγει το email σας…"));
  };
  const ctl = window.AbortController ? new AbortController() : null; const tm = setTimeout(() => ctl && ctl.abort(), 15000);
  // 1st choice: our own Google Apps Script (sends you the request and the guest a confirmation in their language)
  // 2nd choice: FormSubmit; last resort: the guest's email app
  const viaFormSubmit = () => fetch("https://formsubmit.co/ajax/8082a41d88223df15dba6f31ad77a571", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data), signal: ctl && ctl.signal })
    .then((r) => r.json()).then((j) => { if (!(j && (j.success === true || j.success === "true"))) throw new Error("not sent"); });
  const viaScript = () => fetch(CONTACT.form, { method: "POST", body: JSON.stringify({
      apt, checkin: fin.value, checkout: fout.value, nights: n, guests: fg.value, name, email, phone, message: msg, lang: curLang(), _honey: fe["_honey"].value
    }), signal: ctl && ctl.signal })
    .then((r) => r.json()).then((j) => { if (!(j && j.ok)) throw new Error("not sent"); });
  (CONTACT.form ? viaScript().catch(viaFormSubmit) : viaFormSubmit())
    .then(() => {
      document.getElementById("bookSum").textContent = `${apt} · ${new Date(fin.value).toLocaleDateString(LOCALE(), { day: "numeric", month: "short" })} – ${new Date(fout.value).toLocaleDateString(LOCALE(), { day: "numeric", month: "short", year: "numeric" })} · ${fg.value} ${t("guests", "άτομα")}`;
      clearTimeout(toast._t); document.getElementById("toast").classList.remove("show");
      form.hidden = true; done.hidden = false; done.focus();
    })
    .catch(mailFallback)
    .finally(() => { clearTimeout(tm); btn.disabled = false; btn.classList.remove("busy"); });
});

/* ---------- vCard ---------- */
document.getElementById("vcardBtn").addEventListener("click", () => {
  const v = ["BEGIN:VCARD", "VERSION:3.0", "N:;Sofia Apartments;;;", "FN:Sofia Apartments · Heraklion", "TEL;TYPE=CELL:" + PHONE, "NOTE:Bookings by email preferred. SMS or Viber " + PHONE + " also welcome. Check-in from 15:00, check-out 11:00.", "EMAIL:" + EMAIL,
    "ADR;TYPE=WORK:;;Athinas 26;Heraklion;Crete;;Greece", "URL:" + location.href.split("#")[0], "END:VCARD"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([v], { type: "text/vcard" }));
  a.download = "Sofia-Apartments.vcf"; document.body.appendChild(a); a.click(); a.remove();
});

/* ---------- QR ---------- */
window.addEventListener("load", () => {
  const box = document.querySelector(".qr");
  try {
    if (window.QRCode && location.protocol.startsWith("http")) new QRCode(document.getElementById("qr"), { text: location.href.split("#")[0], width: 264, height: 264, colorDark: "#23211f", colorLight: "#ffffff" });
    else box.hidden = true;
  } catch (e) { box.hidden = true; }
});

/* ---------- back to top ---------- */
const totop = document.getElementById("totop");
totop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => totop.classList.toggle("show", window.scrollY > 1200), { passive: true });

/* ---------- install as app ---------- */
let deferred = null; const installBtn = document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; installBtn.hidden = false; });
installBtn.addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; installBtn.hidden = true; });
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register(ROOT + "sw.js").catch(() => {});

/* ---------- favourite places: list + interactive map ---------- */
(function () {
  const P = window.PLACES || [], HOME = window.HOME || [35.33287, 25.13791];
  const list = document.getElementById("flist"), mapEl = document.getElementById("fmap");
  if (!list || !mapEl) return;
  const CAT = {
    cafe: { ic: "cup", c: "#9a6b3f" }, food: { ic: "fork", c: "#c25e3a" }, drinks: { ic: "glass", c: "#6a4f8c" },
    sweet: { ic: "icecream", c: "#c47c93" }, sights: { ic: "landmark", c: "#4f7f78" }, beach: { ic: "beach", c: "#2f7fa6" }, daily: { ic: "bag", c: "#6b6f76" }
  };
  const isEl = () => document.documentElement.lang === "el";
  // unique places (a place can be in two categories, e.g. the bakery)
  const items = [];
  P.forEach((p, i) => { if (!items.some((q) => q[1] === p[1] && q[0] === p[0])) items.push({ i, cat: p[0], name: p[1], en: p[2], el: p[3], rate: p[4], lat: p[5], lng: p[6] }); });
  const R = 6371e3, rad = (d) => (d * Math.PI) / 180;
  const dist = (a, b) => { const dLa = rad(b[0] - a[0]), dLo = rad(b[1] - a[1]); const x = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  items.forEach((it) => (it.d = dist(HOME, [it.lat, it.lng])));
  let ROUTES = {};
  const fmtKm = (m) => { const km = m / 1000; return m < 1000 ? Math.round(m / 10) * 10 + " m" : (km < 10 ? km.toFixed(1) : Math.round(km)) + " km"; };
  const routeText = (r) => {
    const min = Math.max(1, Math.round(r.s / 60)), el = isEl();
    return r.mode === "foot" ? (el ? `${min}′ με τα πόδια` : `${min} min walk`) : (el ? `${min}′ με αυτοκίνητο` : `${min} min drive`);
  };
  const away = (m, name) => {
    if (name && ROUTES[name]) return routeText(ROUTES[name]);
    const walk = Math.max(1, Math.round((m * 1.3) / 80));          // street detour, ~80 m per minute
    if (m < 1800) return isEl() ? `${walk}′ με τα πόδια` : `${walk} min walk`;
    return fmtKm(m);
  };
  const gmaps = (it) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.name + ", Heraklion")}`;
  let cat = "all", map = null, markers = {}, active = null, routeLayer = null, st;
  const card = document.getElementById("froute");

  // counters on the tabs
  document.querySelectorAll(".ftab").forEach((b) => {
    b.querySelector("small").textContent = b.dataset.cat === "all" ? new Set(items.map((x) => x.name)).size : items.filter((x) => x.cat === b.dataset.cat).length;
    b.addEventListener("click", () => {
      document.querySelectorAll(".ftab").forEach((x) => x.classList.toggle("on", x === b));
      cat = b.dataset.cat; query = ""; if (search) search.value = ""; clearRoute(); active = null; renderList(); showMarkers(true);
    });
  });
  let query = "";
  const fold = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const LABEL = { cafe: "coffee breakfast cafe καφες πρωινο", food: "food eat restaurant φαγητο εστιατοριο", drinks: "drinks bar cocktail ποτο μπαρ", sweet: "sweets ice cream γλυκα παγωτο", sights: "sightseeing museum αξιοθεατα μουσειο", beach: "beach swim παραλια θαλασσα", daily: "everyday supermarket pharmacy καθημερινα σουπερ μαρκετ φαρμακειο" };
  const matches = (x) => !query || fold(`${x.name} ${x.en} ${x.el} ${LABEL[x.cat]}`).includes(query);
  const visible = () => {
    if (query) { const seen = new Set(); return items.filter((x) => matches(x) && !seen.has(x.name) && seen.add(x.name)).sort((a, b) => a.d - b.d); }
    if (cat !== "all") return items.filter((x) => x.cat === cat).sort((a, b) => a.d - b.d);
    const seen = new Set(); return items.filter((x) => !seen.has(x.name) && seen.add(x.name)).sort((a, b) => a.d - b.d);
  };
  function renderList() {
    const el = isEl();
    const v = visible();
    if (!v.length) { list.innerHTML = `<li class="fnone">${el ? "Δεν βρέθηκε κάτι. Δοκιμάστε άλλη λέξη." : "Nothing found. Try another word."}</li>`; return; }
    list.innerHTML = v.map((it) => `<li><button type="button" data-k="${it.cat}:${it.i}" style="--c:${CAT[it.cat].c}">
      <i class="fdot"></i><span class="fname"><b>${it.name}</b><small>${el ? it.el : it.en}${it.rate && it.rate !== "—" ? ` · ★ ${it.rate}` : ""}</small></span><em>${away(it.d, it.name)}</em></button></li>`).join("");
    list.scrollTop = 0;
    if (active) mark(active, false);
  }
  const keyOf = (it) => `${it.cat}:${it.i}`;
  function mark(k, scroll) {
    active = k;
    if (!k) { list.querySelectorAll("button.on").forEach((b) => b.classList.remove("on")); Object.values(markers).forEach((m) => m._icon && m._icon.classList.remove("on")); return; }
    list.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === k));
    Object.entries(markers).forEach(([mk, m]) => m._icon && m._icon.classList.toggle("on", mk === k));
    if (scroll) { const b = list.querySelector(`[data-k="${k}"]`); if (b) b.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }
  function popup(it) {
    const el = isEl();
    return `<div class="fpop"><b>${it.name}</b><span>${el ? it.el : it.en}${it.rate && it.rate !== "—" ? ` · ★ ${it.rate}` : ""}</span><span class="fpop-d">${away(it.d, it.name)} ${el ? "από εμάς" : "from us"}</span>
      <a href="${gmaps(it)}" target="_blank" rel="noopener">${el ? "Άνοιγμα στο Google Maps" : "Open in Google Maps"} ↗</a></div>`;
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    const k = b.dataset.k, it = items.find((x) => keyOf(x) === k);
    select(it, false);
    if (matchMedia("(max-width:860px)").matches) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  list.addEventListener("mouseover", (e) => { const b = e.target.closest("button[data-k]"); if (b && markers[b.dataset.k] && markers[b.dataset.k]._icon) markers[b.dataset.k]._icon.classList.add("hover"); });
  list.addEventListener("mouseout", (e) => { const b = e.target.closest("button[data-k]"); if (b && markers[b.dataset.k] && markers[b.dataset.k]._icon) markers[b.dataset.k]._icon.classList.remove("hover"); });

  // Google-style encoded polyline (precision 5) -> [[lat,lng],...]
  function decode(str) {
    const pts = []; let i = 0, lat = 0, lng = 0;
    while (i < str.length) {
      for (const k of [0, 1]) {
        let b, shift = 0, res = 0;
        do { b = str.charCodeAt(i++) - 63; res |= (b & 31) << shift; shift += 5; } while (b >= 32);
        const d = res & 1 ? ~(res >> 1) : res >> 1;
        if (k === 0) lat += d; else lng += d;
      }
      pts.push([lat / 1e5, lng / 1e5]);
    }
    return pts;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clearRoute() { if (routeLayer && map) map.removeLayer(routeLayer); routeLayer = null; if (card) card.hidden = true; }
  function drawRoute(it) {
    const L = window.L, r = ROUTES[it.name], color = CAT[it.cat].c;
    const pts = r ? decode(r.line) : [HOME, [it.lat, it.lng]];
    routeLayer = L.layerGroup().addTo(map);
    L.polyline(pts, { color: "#fff", weight: 9, opacity: 0.95, lineCap: "round", lineJoin: "round", interactive: false }).addTo(routeLayer);
    const line = L.polyline(pts, { color, weight: 5, lineCap: "round", lineJoin: "round", interactive: false, dashArray: r ? null : "2 10" }).addTo(routeLayer);
    const path = line.getElement && line.getElement();
    if (path && r && !reduced && path.getTotalLength) {           // the line "writes itself" from our door to the place
      const len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)";
      path.style.strokeDashoffset = 0;
      path.addEventListener("transitionend", () => { path.style.strokeDasharray = ""; path.style.transition = ""; }, { once: true });
    }
    return pts;
  }
  function showCard(it) {
    if (!card) return;
    const r = ROUTES[it.name], el = isEl(), foot = r ? r.mode === "foot" : it.d < 2500;
    const dir = `https://www.google.com/maps/dir/?api=1&origin=${HOME.join(",")}&destination=${encodeURIComponent(it.name + ", Heraklion")}&travelmode=${foot ? "walking" : "driving"}`;
    card.innerHTML = `<span class="fr-ic" style="--c:${CAT[it.cat].c}"><svg class="ic"><use href="#i-${foot ? "pin" : "car"}"/></svg></span>
      <span class="fr-t"><b>${it.name}</b><small>${r ? `${routeText(r)} · ${fmtKm(r.m)}` : `${away(it.d, it.name)} · ${el ? "σε ευθεία" : "as the crow flies"}`}</small></span>
      <a class="fr-go" href="${dir}" target="_blank" rel="noopener">${el ? "Οδηγίες" : "Directions"}</a>
      <button class="fr-x" type="button" aria-label="Close"><svg class="ic"><use href="#i-x"/></svg></button>`;
    card.hidden = false;
    card.querySelector(".fr-x").addEventListener("click", () => { clearRoute(); mark(null, false); map.closePopup(); });
  }
  function select(it, fromMarker) {
    const k = keyOf(it);
    clearTimeout(st);
    mark(k, fromMarker);
    if (!map) return;
    clearRoute();
    const pts = drawRoute(it);
    showCard(it);
    map.flyToBounds(pts.concat([HOME]), { paddingTopLeft: [40, 70], paddingBottomRight: [40, 110], maxZoom: 17, duration: 0.8 });
    if (markers[k]) map.once("moveend", () => markers[k].openPopup());
  }

  function showMarkers(fit) {
    if (!map) return;
    const vis = new Set(visible().map(keyOf));
    Object.entries(markers).forEach(([k, m]) => { if (vis.has(k)) m.addTo(map); else m.remove(); });
    if (fit) {
      const pts = visible().map((x) => [x.lat, x.lng]); pts.push(HOME);
      const near = cat === "all" ? visible().filter((x) => x.d < 2500).map((x) => [x.lat, x.lng]).concat([HOME]) : pts;
      map.flyToBounds(near, { padding: [40, 40], maxZoom: 16, duration: 0.7 });
    }
    if (active) mark(active, false);
  }
  function init() {
    const L = window.L;
    map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: false, attributionControl: true }).setView(HOME, 15);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, subdomains: "abc", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    mapEl.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
    const homeIcon = L.divIcon({ className: "fm-home", html: '<span><svg class="ic"><use href="#i-key"/></svg></span>', iconSize: [44, 44], iconAnchor: [22, 22] });
    L.marker(HOME, { icon: homeIcon, zIndexOffset: 1000, title: "Sofia Apartments" }).addTo(map)
      .bindPopup(() => `<div class="fpop"><b>Sofia Apartments</b><span>${isEl() ? "Αθηνάς 26 · το σπίτι μας" : "Athinas 26 · our home"}</span></div>`);
    const S = matchMedia("(max-width:620px)").matches ? 22 : 26;
    items.forEach((it) => {
      const icon = L.divIcon({ className: "fm-pin", html: `<span style="--c:${CAT[it.cat].c}"><svg class="ic"><use href="#i-${CAT[it.cat].ic}"/></svg></span>`, iconSize: [S, S], iconAnchor: [S / 2, S / 2], popupAnchor: [0, -S / 2] });
      const m = L.marker([it.lat, it.lng], { icon, title: it.name }).bindPopup(() => popup(it), { maxWidth: 240 });
      m.on("click", () => select(it, true));
      markers[keyOf(it)] = m;
    });
    showMarkers(false);
    map.fitBounds(visible().filter((x) => x.d < 2500).map((x) => [x.lat, x.lng]).concat([HOME]), { padding: [40, 40], maxZoom: 16 });
    mapEl.classList.add("ready");
  }
  document.getElementById("fhome").addEventListener("click", () => { if (map) { clearRoute(); mark(null, false); map.closePopup(); map.flyTo(HOME, 16, { duration: 0.8 }); } });

  // ---- search ----
  const search = document.getElementById("fsearch");
  const setPh = () => { if (search) search.placeholder = isEl() ? "Αναζήτηση, π.χ. καφές, παραλία…" : "Search a place, e.g. coffee, beach…"; };
  setPh();
  if (search) search.addEventListener("input", () => {
    query = fold(search.value.trim());
    clearRoute(); active = null; renderList(); showMarkers(false);
    clearTimeout(st); st = setTimeout(() => {
      if (!map || !visible().length) return;
      const pts = (query ? visible() : visible().filter((x) => x.d < 2500)).map((x) => [x.lat, x.lng]).concat([HOME]);
      map.flyToBounds(pts, { padding: [50, 50], maxZoom: 16, duration: 0.6 });
    }, 450);
  });
  // ---- map tools ----
  const tipLang = () => document.querySelectorAll(".ftools button").forEach((b) => { const t = b.dataset[isEl() ? "tipEl" : "tipEn"]; b.title = t; b.setAttribute("aria-label", t); });
  tipLang();
  let ringLayer = null, meLayer = null;
  function renderRings() {
    if (!map) return;
    if (ringLayer) { map.removeLayer(ringLayer); ringLayer = null; }
    if (document.getElementById("fRings").getAttribute("aria-pressed") !== "true") return;
    const L = window.L; ringLayer = L.layerGroup().addTo(map);
    [[5, 300], [10, 620], [15, 940]].forEach(([n, r], k) => {
      L.circle(HOME, { radius: r, color: "#23211f", weight: 1.2, opacity: 0.45 - k * 0.1, dashArray: "4 6", fill: k === 0, fillColor: "#c9a46a", fillOpacity: 0.16, interactive: false }).addTo(ringLayer);
      L.marker([HOME[0] + r / 111320, HOME[1]], { interactive: false, icon: L.divIcon({ className: "", iconSize: null, iconAnchor: [28, 10], html: `<span class="ring-label">${n} ${isEl() ? "λεπτά" : "min"}</span>` }) }).addTo(ringLayer);
    });
    map.flyTo(HOME, 15, { duration: 0.7 });
  }
  document.getElementById("fRings").addEventListener("click", (e) => { const b = e.currentTarget; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); renderRings(); });
  document.getElementById("fSurprise").addEventListener("click", (e) => {
    if (!map) return;
    const pool = visible().filter((x) => x.d < 2500 && keyOf(x) !== active);
    if (!pool.length) return;
    const b = e.currentTarget; b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
    select(pool[Math.floor(Math.random() * pool.length)], true);
  });
  document.getElementById("fLocate").addEventListener("click", () => {
    if (!map || !navigator.geolocation) return;
    const L = window.L;
    navigator.geolocation.getCurrentPosition((pos) => {
      const me = [pos.coords.latitude, pos.coords.longitude];
      if (meLayer) map.removeLayer(meLayer);
      meLayer = L.marker(me, { icon: L.divIcon({ className: "", iconSize: [18, 18], iconAnchor: [9, 9], html: '<div class="fm-me"></div>' }) }).addTo(map)
        .bindPopup(`<div class="fpop"><b>${isEl() ? "Είστε εδώ" : "You are here"}</b><span>${fmtKm(dist(me, HOME))} ${isEl() ? "από το σπίτι μας" : "from our home"}</span></div>`);
      map.flyToBounds([me, HOME], { padding: [80, 80], maxZoom: 16, duration: 0.9 });
      map.once("moveend", () => meLayer.openPopup());
    }, () => {
      if (!card) return;
      card.innerHTML = `<span class="fr-t"><b>${isEl() ? "Δεν βρέθηκε η τοποθεσία σας" : "We couldn't find your location"}</b><small>${isEl() ? "Ελέγξτε ότι επιτρέπετε την τοποθεσία στον browser." : "Check that location is allowed in your browser."}</small></span><button class="fr-x" type="button" aria-label="Close"><svg class="ic"><use href="#i-x"/></svg></button>`;
      card.hidden = false; card.querySelector(".fr-x").addEventListener("click", () => (card.hidden = true));
    }, { enableHighAccuracy: true, timeout: 10000 });
  });
  const grid = document.querySelector(".fmap-grid");
  function toggleFull(force) {
    const on = force !== undefined ? force : !grid.classList.contains("ffull");
    grid.classList.toggle("ffull", on);
    document.getElementById("fFull").setAttribute("aria-pressed", on);
    document.documentElement.classList.toggle("map-full", on);
    if (map) setTimeout(() => map.invalidateSize(), 60);
  }
  document.getElementById("fFull").addEventListener("click", () => toggleFull());
  addEventListener("keydown", (e) => { if (e.key === "Escape" && grid.classList.contains("ffull")) toggleFull(false); });

  // load Leaflet only when the section gets close
  function loadLeaflet() {
    if (window.L) return init();
    const css = document.createElement("link"); css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = () => { const wait = () => (window.L ? init() : setTimeout(wait, 50)); wait(); };
    s.onerror = () => mapEl.classList.add("failed");
    document.head.appendChild(s);
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); loadLeaflet(); } }, { rootMargin: "500px" });
    io.observe(mapEl);
  } else loadLeaflet();
  renderList();
  if (window.fetch && /^https?:/.test(location.protocol)) {
    const get = (u) => fetch(u, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject()));
    get("https://raw.githubusercontent.com/sofia-apt-heraklion/sofia-apt-heraklion.github.io/main/routes.json")
      .catch(() => get(ROOT + "routes.json")).then((d) => { ROUTES = d || {}; renderList(); }).catch(() => {});
  }
  const lt = document.getElementById("langToggle");
  document.addEventListener("langchange", () => setTimeout(() => {
    renderList(); setPh(); tipLang(); renderRings(); if (map) map.closePopup();
    if (active && card && !card.hidden) { const it = items.find((x) => keyOf(x) === active); if (it) showCard(it); }
  }, 0));
})();

/* ---------- reviews carousel (moves by itself every 6 s while visible; pauses on hover or touch) ---------- */
(function () {
  const t = document.getElementById("rvTrack");
  if (!t) return;
  let timer = null, paused = false;
  const step = () => {
    const c = t.querySelector(".rv"), w = c ? c.getBoundingClientRect().width + 16 : 320;
    if (t.scrollLeft + t.clientWidth >= t.scrollWidth - 4) t.scrollTo({ left: 0, behavior: "smooth" }); else t.scrollBy({ left: w, behavior: "smooth" });
  };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(() => !paused && !document.hidden && step(), 6000);
    }, { threshold: 0.4 }).observe(t);
    ["mouseenter", "focusin", "touchstart"].forEach((ev) => t.addEventListener(ev, () => (paused = true), { passive: true }));
    ["mouseleave", "focusout"].forEach((ev) => t.addEventListener(ev, () => (paused = false)));
  }
  document.querySelectorAll("[data-rv]").forEach((b) =>
    b.addEventListener("click", () => {
      const card = t.querySelector(".rv");
      const step = card ? card.getBoundingClientRect().width + 16 : 320;
      const end = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
      if (+b.dataset.rv > 0 && end) t.scrollTo({ left: 0, behavior: "smooth" });
      else t.scrollBy({ left: step * +b.dataset.rv, behavior: "smooth" });
    })
  );
})();

/* ---------- live weather (Open-Meteo, no key) ---------- */
(function () {
  const box = document.getElementById("wx");
  if (!box || !window.fetch || !/^https?:/.test(location.protocol)) return;
  const LAT = 35.336, LON = 25.139;
  const icon = (c) => c === 0 ? "sun" : c <= 2 ? "cloudsun" : c === 3 ? "cloud" : c <= 48 ? "fog" :
    (c >= 71 && c <= 77) || c === 85 || c === 86 ? "snow" : c >= 95 ? "storm" : "rain";
  const TXT = { sun: ["Sunny", "Λιακάδα"], cloudsun: ["Partly cloudy", "Αραιή συννεφιά"], cloud: ["Cloudy", "Συννεφιά"],
    fog: ["Mist", "Ομίχλη"], rain: ["Rain", "Βροχή"], snow: ["Snow", "Χιόνι"], storm: ["Thunderstorm", "Καταιγίδα"] };
  const f = (u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject()));
  const w = f(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FAthens&forecast_days=5`);
  const m = f(`https://marine-api.open-meteo.com/v1/marine?latitude=35.35&longitude=25.14&current=sea_surface_temperature&timezone=Europe%2FAthens`).catch(() => null);
  let data = null;
  function render() {
    if (!data) return;
    const [W, M] = data, el = document.documentElement.lang === "el";
    const k = icon(W.current.weather_code);
    box.querySelector(".wx-ic use").setAttribute("href", "#i-" + k);
    document.getElementById("wxT").textContent = Math.round(W.current.temperature_2m) + "°C";
    document.getElementById("wxD").textContent = TXT[k][el ? 1 : 0];
    const sea = M && M.current && M.current.sea_surface_temperature;
    box.querySelector(".wx-sea").hidden = sea == null;
    if (sea != null) document.getElementById("wxS").textContent = Math.round(sea) + "°C";
    const days = W.daily.time.map((d, i) => {
      const name = i === 0 ? (el ? "Σήμερα" : "Today") : new Date(d + "T12:00").toLocaleDateString(LOCALE(), { weekday: "short" });
      return `<li><span>${name}</span><svg class="ic"><use href="#i-${icon(W.daily.weather_code[i])}"/></svg><b>${Math.round(W.daily.temperature_2m_max[i])}°</b><small>${Math.round(W.daily.temperature_2m_min[i])}°</small></li>`;
    });
    document.getElementById("wxDays").innerHTML = days.join("");
    box.hidden = false;
  }
  Promise.all([w, m]).then((d) => { data = d; render(); }).catch(() => {});
  const lt = document.getElementById("langToggle");
  document.addEventListener("langchange", () => setTimeout(render, 0));
})();

/* ---------- guests world map ---------- */
(function () {
  const box = document.getElementById("gmMap"), top = document.getElementById("gmTop"), tip = document.getElementById("gmTip");
  const G = window.GUESTS;
  if (!box || !G) return;
  const ISO2 = { GRC: "GR", FRA: "FR", GBR: "GB", USA: "US", ISR: "IL", DEU: "DE", UKR: "UA", CAN: "CA", NLD: "NL", ITA: "IT", IND: "IN", BRA: "BR", BEL: "BE", AUS: "AU", ARE: "AE", TUR: "TR", CHE: "CH", SWE: "SE", KOR: "KR", SVK: "SK", SGP: "SG", FIN: "FI", EST: "EE", DNK: "DK", CYP: "CY", ARG: "AR" };
  const cname = (iso) => {
    const l = document.documentElement.lang, g = G[iso];
    if (l === "el") return g[2];
    if (l === "en" || !window.Intl || !Intl.DisplayNames) return g[1];
    try { return new Intl.DisplayNames([l], { type: "region" }).of(ISO2[iso]) || g[1]; } catch (e) { return g[1]; }
  };
  const lvl = (n) => (n >= 40 ? 5 : n >= 9 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : 1);
  const isEl = () => document.documentElement.lang === "el";
  const label = (iso) => {
    const g = G[iso]; const el = isEl();
    return `<b>${cname(iso)}</b>`;
  };
  function list() {
    const rows = Object.entries(G).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8);
    const max = rows[0][1][0];
    top.innerHTML = rows.map(([iso, g]) =>
      `<li data-iso="${iso}"><span>${cname(iso)}</span><i style="--w:${Math.max(4, (g[0] / max) * 100)}%"></i></li>`).join("") +
      `<li class="gm-more">${isEl() ? "και πολλές ακόμα χώρες" : "and many more countries"}</li>`;
  }
  function draw() {
    const W = window.WORLD; if (!W) return;
    let svg = `<svg viewBox="0 0 ${W.w} ${W.h}" role="img"><g class="gm-land">`;
    for (const [iso, d] of W.p) {
      const g = G[iso];
      svg += `<path d="${d}"${g ? ` class="v l${lvl(g[0])}${iso === "GRC" ? " home" : ""}" data-iso="${iso}" tabindex="0"` : ""}/>`;
    }
    for (const iso in W.dots) if (G[iso]) { const [x, y] = W.dots[iso]; svg += `<circle cx="${x}" cy="${y}" r="4" class="v l${lvl(G[iso][0])}" data-iso="${iso}" tabindex="0"/>`; }
    svg += `</g><circle class="gm-pin" cx="0" cy="0" r="5"/></svg>`;
    box.insertAdjacentHTML("afterbegin", svg);
    const gr = box.querySelector('[data-iso="GRC"]');
    if (gr) { const b = gr.getBBox(); const pin = box.querySelector(".gm-pin"); pin.setAttribute("cx", b.x + b.width * 0.62); pin.setAttribute("cy", b.y + b.height * 0.93); }
    box.classList.add("ready");
  }
  // world / europe zoom (animated viewBox)
  let anim;
  function zoom(to) {
    const W = window.WORLD, svg = box.querySelector("svg"); if (!W || !svg) return;
    const from = svg.getAttribute("viewBox").split(" ").map(Number);
    const target = to === "eu" ? W.eu : [0, 0, W.w, W.h];
    const t0 = performance.now(), D = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 650;
    cancelAnimationFrame(anim); hide();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / D), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      svg.setAttribute("viewBox", from.map((v, i) => v + (target[i] - v) * e).join(" "));
      svg.classList.toggle("zoomed", to === "eu");
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  document.querySelectorAll(".gm-zoom button").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".gm-zoom button").forEach((x) => x.classList.toggle("on", x === b));
    zoom(b.dataset.z);
  }));
  function show(iso, ev) {
    if (!G[iso]) return hide();
    tip.innerHTML = label(iso); tip.hidden = false;
    const r = box.getBoundingClientRect();
    let x, y;
    if (ev && ev.clientX != null) { x = ev.clientX - r.left; y = ev.clientY - r.top; }
    else { const t = box.querySelector(`[data-iso="${iso}"]`).getBoundingClientRect(); x = t.left + t.width / 2 - r.left; y = t.top + t.height / 2 - r.top; }
    tip.style.left = Math.min(Math.max(x, 70), r.width - 70) + "px"; tip.style.top = y + "px";
    box.querySelectorAll(".on").forEach((e) => e.classList.remove("on"));
    box.querySelectorAll(`[data-iso="${iso}"]`).forEach((e) => e.classList.add("on"));
    top.querySelectorAll("li").forEach((li) => li.classList.toggle("on", li.dataset.iso === iso));
  }
  function hide() { tip.hidden = true; box.querySelectorAll(".on").forEach((e) => e.classList.remove("on")); top.querySelectorAll(".on").forEach((e) => e.classList.remove("on")); }
  box.addEventListener("pointermove", (e) => { const t = e.target.closest("[data-iso]"); t ? show(t.dataset.iso, e) : hide(); });
  box.addEventListener("pointerleave", hide);
  box.addEventListener("click", (e) => { const t = e.target.closest("[data-iso]"); t ? show(t.dataset.iso, e) : hide(); });
  box.addEventListener("focusin", (e) => { const t = e.target.closest("[data-iso]"); if (t) show(t.dataset.iso); });
  top.addEventListener("pointerover", (e) => { const li = e.target.closest("li[data-iso]"); if (li) show(li.dataset.iso); });
  top.addEventListener("pointerleave", hide);
  list();
  // load the map only when the section gets close
  const load = () => { if (window.WORLD) return draw(); const s = document.createElement("script"); s.src = ROOT + "js/worldmap.js?v=2"; s.onload = draw; document.head.appendChild(s); };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "600px" });
    io.observe(box);
  } else load();
  const lt = document.getElementById("langToggle");
  document.addEventListener("langchange", () => setTimeout(() => { list(); hide(); }, 0));
})();

/* ---------- availability calendar (synced from Airbnb via availability.json) ---------- */
(function () {
  const cal = document.getElementById("cal");
  if (!cal || !form) return;
  const msgEl = document.getElementById("calMsg"), upd = document.getElementById("calUpd");
  const months = cal.querySelector(".cal-months"), titles = cal.querySelector(".cal-titles");
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const el = () => document.documentElement.lang === "el";
  const T0 = new Date(); T0.setHours(0, 0, 0, 0);
  let data = null, view = new Date(T0.getFullYear(), T0.getMonth(), 1), selA = null, selB = null;

  // booked nights per apartment, as a Set of "YYYY-MM-DD"
  const nightsOf = (apt) => {
    const out = new Set(); if (!data) return out;
    const keys = apt === "Sofia 164" ? ["164"] : apt === "Sofia 264" ? ["264"] : ["164", "264"];
    keys.forEach((k) => (data[k] || []).forEach(([a, b]) => { for (let d = parse(a); d < parse(b); d.setDate(d.getDate() + 1)) out.add(key(d)); }));
    return out;
  };
  const apt = () => form.elements["apt"].value;
  const perView = () => (matchMedia("(max-width:620px)").matches ? 1 : 2);

  function render() {
    const busy = nightsOf(apt()), n = perView(), lang = LOCALE();
    const wd = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang, { weekday: "narrow" }));
    let html = "", tt = "";
    for (let m = 0; m < n; m++) {
      const first = new Date(view.getFullYear(), view.getMonth() + m, 1);
      const name = first.toLocaleDateString(lang, { month: "long", year: "numeric" });
      tt += `<b>${name}</b>`;
      html += `<div class="cal-m"><div class="cal-mname">${name}</div><div class="cal-g">${wd.map((w) => `<span class="cal-w">${w}</span>`).join("")}`;
      const lead = (first.getDay() + 6) % 7;
      for (let i = 0; i < lead; i++) html += "<span></span>";
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dt = new Date(first.getFullYear(), first.getMonth(), d), k = key(dt);
        const prev = new Date(dt); prev.setDate(d - 1);
        const past = dt < T0, b = busy.has(k);
        const turn = !b && busy.has(key(prev));      // a guest leaves this morning: free to arrive
        const cls = ["cal-d"];
        if (past) cls.push("past"); else if (b) cls.push(busy.has(key(prev)) ? "busy" : "busy start");
        if (turn && !past) cls.push("turn");
        if (selA && k === selA) cls.push("sel a");
        if (selB && k === selB) cls.push("sel b");
        if (selA && selB && k > selA && k < selB) cls.push("in");
        if (+dt === +T0) cls.push("today");
        html += `<button type="button" class="${cls.join(" ")}" data-d="${k}"${past ? " disabled" : ""}>${d}</button>`;
      }
      html += "</div></div>";
    }
    months.innerHTML = html; titles.innerHTML = tt;
    cal.querySelector('[data-cal="-1"]').disabled = view <= new Date(T0.getFullYear(), T0.getMonth(), 1);
    check();
  }
  function rangeBusy(a, b) {
    const busy = nightsOf(apt());
    for (let d = parse(a); key(d) < b; d.setDate(d.getDate() + 1)) if (busy.has(key(d))) return true;
    return false;
  }
  function say(ok, text) {
    msgEl.hidden = !text; if (!text) return;
    msgEl.className = "cal-msg " + (ok ? "ok" : "bad");
    msgEl.innerHTML = `<svg class="ic"><use href="#i-${ok ? "check" : "alert"}"/></svg>${text}`;
  }
  function check() {
    if (!selA || !selB) return say(true, "");
    if (!data) return say(true, "");
    if (rangeBusy(selA, selB)) say(false, el() ? "Κάποιες από αυτές τις νύχτες είναι ήδη κλεισμένες. Δοκιμάστε άλλες ημερομηνίες ή το άλλο διαμέρισμα." : "Some of these nights are already booked. Try other dates or the other apartment.");
    else say(true, el() ? "Διαθέσιμο για τις ημερομηνίες σας" : "Available for your dates");
  }
  function setInputs() {
    fin.value = selA || ""; fout.value = selB || "";
    fin.dispatchEvent(new Event("change")); if (selB) { fout.value = selB; fout.dispatchEvent(new Event("change")); }
  }
  months.addEventListener("click", (e) => {
    const b = e.target.closest(".cal-d"); if (!b || b.disabled) return;
    const k = b.dataset.d, busy = nightsOf(apt());
    if (!selA || selB || k <= selA) {
      if (busy.has(k)) { say(false, el() ? "Αυτή η μέρα είναι κλεισμένη για άφιξη." : "This day is booked for arrival."); return; }
      selA = k; selB = null;
    } else {
      selB = k;
    }
    syncing = true; setInputs(); syncing = false; render();
  });
  cal.querySelectorAll("[data-cal]").forEach((b) => b.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() + +b.dataset.cal, 1); render();
  }));
  let syncing = false;
  [fin, fout].forEach((f) => f.addEventListener("change", () => {
    if (syncing) return;
    selA = fin.value || null; selB = fout.value && fout.value > (fin.value || "") ? fout.value : null;
    if (selA) { const d = parse(selA); view = new Date(d.getFullYear(), d.getMonth(), 1); }
    render();
  }));
  form.querySelectorAll('input[name="apt"]').forEach((r) => r.addEventListener("change", render));
  const lt = document.getElementById("langToggle"); document.addEventListener("langchange", () => setTimeout(render, 0));
  let rw; addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(render, 200); });

  function showUpdated() {
    if (!data || !data.updated) { upd.textContent = ""; return; }
    upd.textContent = (el() ? "Συγχρονισμός με Airbnb" : "Synced with Airbnb");
  }
  render();
  // fresh copy from GitHub first, then the site's own copy
  const RAW = "https://raw.githubusercontent.com/sofia-apt-heraklion/sofia-apt-heraklion.github.io/main/availability.json";
  const get = (u) => fetch(u, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject()));
  if (/^https?:/.test(location.protocol) && window.fetch)
    get(RAW).catch(() => get(ROOT + "availability.json")).then((d) => { data = d; showUpdated(); render(); cal.classList.add("synced"); freeWeekend(); }).catch(() => {});
  // "Free this weekend": Friday and Saturday night free, shown under the hero buttons
  function freeWeekend() {
    const box = document.getElementById("freeWk"); if (!box || !data) return;
    const fri = new Date(T0); const dow = fri.getDay();
    fri.setDate(fri.getDate() + (dow === 6 ? 6 : dow === 0 ? 5 : 5 - dow));
    const sat = new Date(fri); sat.setDate(sat.getDate() + 1); const sun = new Date(fri); sun.setDate(sun.getDate() + 2);
    const free = ["Sofia 164", "Sofia 264"].filter((a) => { const b = nightsOf(a); return !b.has(key(fri)) && !b.has(key(sat)); });
    if (!free.length) { box.hidden = true; return; }
    const f = (d, o) => d.toLocaleDateString(LOCALE(), o);
    box.innerHTML = `<span class="fw-dot" aria-hidden="true"></span><span class="fw-t"><b>${t("Free this weekend", "Ελεύθερο αυτό το Σαββατοκύριακο")}</b> <span class="fw-d">${f(fri, { weekday: "short", day: "numeric" })} – ${f(sun, { weekday: "short", day: "numeric", month: "short" })}</span></span>` +
      free.map((a) => `<button type="button" class="fw-apt" data-apt="${a}">${a}<svg class="ic" aria-hidden="true"><use href="#i-chev-r"/></svg></button>`).join("");
    box.hidden = false;
    box.querySelectorAll(".fw-apt").forEach((b) => b.addEventListener("click", () => {
      const r = form.querySelector(`input[name="apt"][value="${b.dataset.apt}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event("change")); }
      fin.value = key(fri); fin.dispatchEvent(new Event("change")); fout.value = key(sun); fout.dispatchEvent(new Event("change"));
      document.getElementById("book").scrollIntoView({ behavior: "smooth" });
    }));
  }
  document.addEventListener("langchange", () => setTimeout(freeWeekend, 0));
  document.addEventListener("langchange", () => setTimeout(showUpdated, 0));
})();


/* ---------- numbers count up and bars fill when they come into view ---------- */
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nums = [...document.querySelectorAll(".rv-score b, .rv-bars b, .gstats b")];
  nums.forEach((n) => {
    const m = n.textContent.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/s);
    if (!m) return;
    n.dataset.pre = m[1]; n.dataset.to = m[2].replace(",", "."); n.dataset.suf = m[3];
    n.dataset.dec = (m[2].split(/[.,]/)[1] || "").length;
  });
  const run = (n) => {
    if (!n.dataset.to || n.dataset.done) return;
    n.dataset.done = 1;
    if (reduced) return;
    const to = parseFloat(n.dataset.to), dec = +n.dataset.dec, t0 = performance.now(), dur = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      n.textContent = n.dataset.pre + (to * e).toFixed(dec) + n.dataset.suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    n.textContent = n.dataset.pre + (0).toFixed(dec) + n.dataset.suf;
    requestAnimationFrame(tick);
  };
  const fill = (el) => el.classList.add("filled");
  if (!("IntersectionObserver" in window)) { document.querySelectorAll(".rv-bars, .gm-top").forEach(fill); return; }
  const ob = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    ob.unobserve(e.target);
    if (e.target.matches(".rv-bars, .gm-top")) fill(e.target); else run(e.target);
  }), { threshold: 0.5 });
  nums.forEach((n) => ob.observe(n));
  document.querySelectorAll(".rv-bars, .gm-top").forEach((el) => ob.observe(el));
  // the guests list is rebuilt when the language changes: keep it filled
  const gt = document.getElementById("gmTop");
  if (gt) new MutationObserver(() => { if (gt.dataset.seen) fill(gt); }).observe(gt, { childList: true });
  if (gt) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { gt.dataset.seen = 1; o.disconnect(); } }).observe(gt);
})();


/* ---------- hero: slow zoom on load and gentle parallax while scrolling ---------- */
(function () {
  const img = document.querySelector(".hero-img");
  if (!img || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  img.classList.add("kb");
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, innerHeight);
      img.style.setProperty("--py", (y * 0.25).toFixed(1) + "px");
      ticking = false;
    });
  }, { passive: true });
})();
