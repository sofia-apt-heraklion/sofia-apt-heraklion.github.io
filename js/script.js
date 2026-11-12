/* ================================================================
   CONTACT DETAILS: fill these in and the buttons appear automatically.
   Leave a value empty ("") to hide that button.
   phone / whatsapp: international format without spaces, e.g. "+306912345678"
   ================================================================ */
const CONTACT = {
  phone: "+306972777487",
  whatsapp: "",
  email: "sofia.apt.heraklion@gmail.com"
};

/* ---------- language ---------- */
(function () {
  const root = document.documentElement;
  let lang = null;
  try { lang = localStorage.getItem("lang"); } catch (e) {}
  if (!lang) lang = (navigator.language || "en").toLowerCase().startsWith("el") ? "el" : "en";
  root.lang = lang;
  document.getElementById("langToggle").addEventListener("click", () => {
    root.lang = root.lang === "el" ? "en" : "el";
    try { localStorage.setItem("lang", root.lang); } catch (e) {}
  });
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
menuBtn.addEventListener("click", () => {
  const o = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", o);
});
document.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));
const links = [...document.querySelectorAll(".nav-links a")];
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

/* ---------- reveal on scroll ---------- */
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

/* ---------- booking form ---------- */
const form = document.getElementById("bookForm");
const fin = form.elements["in"], fout = form.elements["out"], fg = form.elements["guests"];
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date(); fin.min = iso(today);
const maxFor = () => ({ "Sofia 164": 4, "Sofia 264": 6 }[form.elements["apt"].value] || 10);
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
form.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
  fg.value = Math.max(1, Math.min(maxFor(), (+fg.value || 1) + +b.dataset.step));
}));
form.querySelectorAll('input[name="apt"]').forEach((r) => r.addEventListener("change", () => { fg.max = maxFor(); if (+fg.value > maxFor()) fg.value = maxFor(); }));
document.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", () => {
  const r = form.querySelector(`input[name="apt"][value="Sofia ${a.dataset.pick}"]`); if (r) { r.checked = true; r.dispatchEvent(new Event("change")); }
}));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  [fin, fout].forEach((f) => f.classList.toggle("err", !f.value));
  const n = nights();
  if (!fin.value || !fout.value || n <= 0) { toast(t("Please choose your dates", "Επιλέξτε ημερομηνίες")); return; }
  const apt = form.elements["apt"].value, name = form.elements["name"].value.trim(), msg = form.elements["msg"].value.trim();
  const fmt = (v) => new Date(v).toLocaleDateString(t("en-GB", "el-GR"), { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const subject = t(`Booking request: ${apt}, ${fin.value} to ${fout.value}`, `Αίτημα κράτησης: ${apt}, ${fin.value} έως ${fout.value}`);
  const body = t(
    `Hello Sofia,\n\nI would like to book:\n\nApartment: ${apt}\nCheck-in: ${fmt(fin.value)}\nCheck-out: ${fmt(fout.value)}\nNights: ${n}\nGuests: ${fg.value}\n${msg ? "\n" + msg + "\n" : ""}\nThank you,\n${name}`,
    `Γεια σας Σοφία,\n\nΘα ήθελα να κάνω κράτηση:\n\nΔιαμέρισμα: ${apt}\nΆφιξη: ${fmt(fin.value)}\nΑναχώρηση: ${fmt(fout.value)}\nΔιανυκτερεύσεις: ${n}\nΆτομα: ${fg.value}\n${msg ? "\n" + msg + "\n" : ""}\nΕυχαριστώ,\n${name}`);
  location.href = mailto(subject, body);
  toast(t("Opening your email app…", "Ανοίγει το email σας…"));
});

/* ---------- vCard ---------- */
document.getElementById("vcardBtn").addEventListener("click", () => {
  const v = ["BEGIN:VCARD", "VERSION:3.0", "N:;Sofia Apartments;;;", "FN:Sofia Apartments · Heraklion", "TEL;TYPE=CELL:" + PHONE, "NOTE:Viber " + PHONE + ". Check-in from 15:00, check-out 11:00.", "EMAIL:" + EMAIL,
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
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

/* ---------- favourite places ---------- */
(function () {
  const P = window.PLACES || [];
  const grid = document.getElementById("fgrid"), more = document.getElementById("fmore");
  if (!grid) return;
  const ICON = { cafe: "cup", food: "fork", drinks: "glass", sweet: "icecream", sights: "landmark", beach: "beach", daily: "bag" };
  const LIMIT = 12; let cat = "all", expanded = false;
  document.querySelectorAll(".ftab").forEach((b) => {
    const n = b.dataset.cat === "all" ? new Set(P.map((p) => p[1])).size : P.filter((p) => p[0] === b.dataset.cat).length;
    b.querySelector("small").textContent = n;
    b.addEventListener("click", () => {
      document.querySelectorAll(".ftab").forEach((x) => x.classList.toggle("on", x === b));
      cat = b.dataset.cat; expanded = false; render();
    });
  });
  function render() {
    const el = document.documentElement.lang === "el";
    let list;
    if (cat === "all") { // mix categories so the first cards show a bit of everything
      const by = {}; P.forEach((p) => (by[p[0]] = by[p[0]] || []).push(p));
      const keys = Object.keys(by), seen = new Set(); list = [];
      for (let i = 0; keys.some((k) => by[k][i]); i++) keys.forEach((k) => { const p = by[k][i]; if (p && !seen.has(p[1])) { seen.add(p[1]); list.push(p); } });
    } else list = P.filter((p) => p[0] === cat);
    const shown = expanded ? list : list.slice(0, LIMIT);
    grid.innerHTML = shown.map((p) => {
      const q = encodeURIComponent(p[1] + ", Heraklion");
      const r = p[4] && p[4] !== "—" ? `<span class="frate"><svg class="ic"><use href="#i-star"/></svg>${p[4]}</span>` : "";
      return `<a class="fcard" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">
        <span class="fic"><svg class="ic"><use href="#i-${ICON[p[0]]}"/></svg></span>
        <span class="ftxt"><b>${p[1]}</b><small>${el ? p[3] : p[2]}</small></span>${r}
        <svg class="ic fgo"><use href="#i-ext"/></svg></a>`;
    }).join("");
    more.hidden = expanded || list.length <= LIMIT;
  }
  more.addEventListener("click", () => { expanded = true; render(); });
  document.getElementById("langToggle").addEventListener("click", () => setTimeout(render, 0));
  render();
})();

/* ---------- reviews carousel ---------- */
(function () {
  const t = document.getElementById("rvTrack");
  if (!t) return;
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
      const name = i === 0 ? (el ? "Σήμερα" : "Today") : new Date(d + "T12:00").toLocaleDateString(el ? "el-GR" : "en-GB", { weekday: "short" });
      return `<li><span>${name}</span><svg class="ic"><use href="#i-${icon(W.daily.weather_code[i])}"/></svg><b>${Math.round(W.daily.temperature_2m_max[i])}°</b><small>${Math.round(W.daily.temperature_2m_min[i])}°</small></li>`;
    });
    document.getElementById("wxDays").innerHTML = days.join("");
    box.hidden = false;
  }
  Promise.all([w, m]).then((d) => { data = d; render(); }).catch(() => {});
  const lt = document.getElementById("langToggle");
  if (lt) lt.addEventListener("click", () => setTimeout(render, 0));
})();

/* ---------- guests world map ---------- */
(function () {
  const box = document.getElementById("gmMap"), top = document.getElementById("gmTop"), tip = document.getElementById("gmTip");
  const G = window.GUESTS;
  if (!box || !G) return;
  const lvl = (n) => (n >= 40 ? 5 : n >= 9 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : 1);
  const isEl = () => document.documentElement.lang === "el";
  const label = (iso) => {
    const g = G[iso]; const el = isEl();
    return `<b>${g[el ? 2 : 1]}</b>`;
  };
  function list() {
    const rows = Object.entries(G).sort((a, b) => b[1][0] - a[1][0]).slice(0, 8);
    const max = rows[0][1][0];
    top.innerHTML = rows.map(([iso, g]) =>
      `<li data-iso="${iso}"><span>${g[isEl() ? 2 : 1]}</span><i style="--w:${Math.max(4, (g[0] / max) * 100)}%"></i></li>`).join("") +
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
  const load = () => { if (window.WORLD) return draw(); const s = document.createElement("script"); s.src = "js/worldmap.js?v=2"; s.onload = draw; document.head.appendChild(s); };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "600px" });
    io.observe(box);
  } else load();
  const lt = document.getElementById("langToggle");
  if (lt) lt.addEventListener("click", () => setTimeout(() => { list(); hide(); }, 0));
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
    const busy = nightsOf(apt()), n = perView(), lang = el() ? "el-GR" : "en-GB";
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
  const lt = document.getElementById("langToggle"); if (lt) lt.addEventListener("click", () => setTimeout(render, 0));
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
    get(RAW).catch(() => get("availability.json")).then((d) => { data = d; showUpdated(); render(); cal.classList.add("synced"); }).catch(() => {});
  if (lt) lt.addEventListener("click", () => setTimeout(showUpdated, 0));
})();
