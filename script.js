/* ================================================================
   CONTACT DETAILS: fill these in and the buttons appear automatically.
   Leave a value empty ("") to hide that button.
   phone / whatsapp: international format without spaces, e.g. "+306912345678"
   ================================================================ */
const CONTACT = {
  phone: "+306972777487",
  whatsapp: "",
  email: "sofia.kokkini64@gmail.com"
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
document.querySelectorAll(".gallery").forEach((g) => {
  const imgs = [...g.querySelectorAll("img")];
  imgs.forEach((img, i) => img.addEventListener("click", () => open(imgs, i)));
  g.querySelector(".g-all").addEventListener("click", () => open(imgs, 0));
});
document.querySelectorAll("[data-zoom]").forEach((img) => img.addEventListener("click", () => open([img], 0)));
lb.querySelector(".lb-close").addEventListener("click", () => lb.close());
lb.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
lb.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
document.addEventListener("keydown", (e) => {
  if (!lb.open) return;
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
  const c = g.querySelector(".g-count");
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
