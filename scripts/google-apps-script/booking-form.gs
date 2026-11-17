/**
 * Sofia Apartments · booking form
 * --------------------------------------------------------------
 * Runs in YOUR Google account (sofia.apt.heraklion@gmail.com).
 * For every request sent from the website it:
 *   1. emails you the request (press Reply to answer the guest),
 *   2. sends the guest an automatic confirmation in their language,
 *      from your own Gmail,
 *   3. adds a row to the Google Sheet "Sofia Apartments · booking requests".
 * Setup: see the instructions in the message from Claude, or README below.
 * --------------------------------------------------------------
 */
var HOST_EMAIL = "sofia.apt.heraklion@gmail.com";
var HOST_COPY = "iasonas.mast@gmail.com";   // every booking request is also copied here (leave "" for none)
var SENDER_NAME = "Sofia Apartments";
var MAX_PER_DAY = 40;             // safety limit against abuse

var T = {
  en: { subj: "Your booking request at Sofia Apartments", hi: "Hello", body: "Thank you for your booking request. We have received it and will reply by email, usually within an hour, with the price and availability. Nothing is booked or paid yet.", sum: "Your request", apt: "Apartment", in: "Check-in", out: "Check-out", nights: "Nights", guests: "Guests", reply: "If you would like to add something, just reply to this email.", bye: "See you soon in Heraklion," },
  el: { subj: "Το αίτημα κράτησής σας στα Sofia Apartments", hi: "Γεια σας", body: "Σας ευχαριστούμε για το αίτημα κράτησης. Το λάβαμε και θα σας απαντήσουμε με email, συνήθως μέσα σε μία ώρα, με την τιμή και τη διαθεσιμότητα. Δεν έχει γίνει ακόμα κράτηση ούτε πληρωμή.", sum: "Το αίτημά σας", apt: "Διαμέρισμα", in: "Άφιξη", out: "Αναχώρηση", nights: "Διανυκτερεύσεις", guests: "Άτομα", reply: "Αν θέλετε να προσθέσετε κάτι, απαντήστε απλώς σε αυτό το email.", bye: "Τα λέμε σύντομα στο Ηράκλειο," },
  de: { subj: "Ihre Buchungsanfrage bei Sofia Apartments", hi: "Hallo", body: "Vielen Dank für Ihre Buchungsanfrage. Wir haben sie erhalten und antworten per E-Mail, meist innerhalb einer Stunde, mit Preis und Verfügbarkeit. Es ist noch nichts gebucht oder bezahlt.", sum: "Ihre Anfrage", apt: "Wohnung", in: "Anreise", out: "Abreise", nights: "Nächte", guests: "Gäste", reply: "Wenn Sie etwas ergänzen möchten, antworten Sie einfach auf diese E-Mail.", bye: "Bis bald in Heraklion," },
  fr: { subj: "Votre demande de réservation chez Sofia Apartments", hi: "Bonjour", body: "Merci pour votre demande de réservation. Nous l’avons bien reçue et vous répondrons par e-mail, en général en moins d’une heure, avec le prix et la disponibilité. Rien n’est encore réservé ni payé.", sum: "Votre demande", apt: "Appartement", in: "Arrivée", out: "Départ", nights: "Nuits", guests: "Voyageurs", reply: "Pour ajouter quelque chose, répondez simplement à cet e-mail.", bye: "À bientôt à Héraklion," },
  it: { subj: "La vostra richiesta di prenotazione a Sofia Apartments", hi: "Buongiorno", body: "Grazie per la richiesta di prenotazione. L’abbiamo ricevuta e vi risponderemo via e-mail, di solito entro un’ora, con prezzo e disponibilità. Non è ancora stato prenotato né pagato nulla.", sum: "La vostra richiesta", apt: "Appartamento", in: "Arrivo", out: "Partenza", nights: "Notti", guests: "Ospiti", reply: "Se volete aggiungere qualcosa, rispondete semplicemente a questa e-mail.", bye: "A presto a Heraklion," }
};

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (d._honey) return out({ ok: true });                       // spam trap
    var email = clean(d.email, 120), name = clean(d.name, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !name) return out({ ok: false, error: "invalid" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.checkin || "") || !/^\d{4}-\d{2}-\d{2}$/.test(d.checkout || "")) return out({ ok: false, error: "dates" });
    // the same checks as on the website, so nobody can skip them
    var phoneDigits = String(d.phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) return out({ ok: false, error: "phone" });
    if ((String(d.name || "").match(/\p{L}/gu) || []).length < 2 || /[@<>]|https?:|www\./i.test(d.name)) return out({ ok: false, error: "name" });
    var din = new Date(d.checkin + "T12:00:00"), dout = new Date(d.checkout + "T12:00:00"), today = new Date(); today.setHours(0, 0, 0, 0);
    var nn = Math.round((dout - din) / 864e5);
    if (din < today || nn < 1 || nn > 60) return out({ ok: false, error: "dates" });
    if (!underLimit()) return out({ ok: false, error: "limit" });

    var L = T[d.lang] ? d.lang : "en", t = T[L];
    var apt = ["Sofia 164", "Sofia 264", "Sofia 164 + Sofia 264"].indexOf(d.apt) > -1 ? d.apt : "Sofia 164";
    var guests = Math.max(1, Math.min(10, parseInt(d.guests, 10) || 1)), nights = Math.max(1, Math.min(365, parseInt(d.nights, 10) || 1));
    var phone = clean(d.phone, 40), msg = clean(d.message, 2000, true);

    // 1. email to you; "Reply" goes straight to the guest
    var hostBody = "New booking request from the website\n\n" +
      "Apartment: " + apt + "\nCheck-in: " + d.checkin + "\nCheck-out: " + d.checkout + "\nNights: " + nights + "\nGuests: " + guests +
      "\n\nName: " + name + "\nEmail: " + email + "\nMobile: " + (phone || "-") + "\nLanguage: " + L.toUpperCase() +
      "\n\nMessage:\n" + (msg || "-") + "\n\n(Press Reply to answer the guest.)";
    GmailApp.sendEmail(HOST_EMAIL, "Booking request: " + apt + ", " + d.checkin + " to " + d.checkout + " (" + name + ")", hostBody, { replyTo: email, name: "Sofia Apartments website", cc: HOST_COPY || undefined });

    // 2. automatic confirmation to the guest, in their language
    var fmt = function (s) { var p = s.split("-"); return Utilities.formatDate(new Date(+p[0], +p[1] - 1, +p[2], 12), "Europe/Athens", "dd/MM/yyyy"); };
    var rows = [[t.apt, apt], [t.in, fmt(d.checkin)], [t.out, fmt(d.checkout)], [t.nights, nights], [t.guests, guests]];
    // plain text only, no links: reads like a personal email and is far less likely to land in spam
    var text = t.hi + " " + name + ",\n\n" + t.body + "\n\n" + t.sum + ":\n" + rows.map(function (r) { return "- " + r[0] + ": " + r[1]; }).join("\n") +
      "\n\n" + t.reply + "\n\n" + t.bye + "\nSofia & Iasonas\nSofia Apartments, Athinas 26, Heraklion, Crete";
    GmailApp.sendEmail(email, t.subj, text, { name: SENDER_NAME });

    // 3. keep a list in Google Sheets
    try { sheet().appendRow([new Date(), apt, d.checkin, d.checkout, nights, guests, name, email, phone, L, msg]); } catch (err) {}

    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() { return out({ ok: true, service: "Sofia Apartments booking form" }); }

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function clean(s, max, multiline) { s = String(s == null ? "" : s); s = multiline ? s.replace(/\r/g, "") : s.replace(/[\r\n\t]+/g, " "); return s.trim().slice(0, max); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function underLimit() {
  var p = PropertiesService.getScriptProperties(), day = Utilities.formatDate(new Date(), "Europe/Athens", "yyyy-MM-dd");
  var k = "count-" + day, n = parseInt(p.getProperty(k) || "0", 10);
  if (n >= MAX_PER_DAY) return false;
  p.setProperty(k, String(n + 1)); return true;
}
function sheet() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty("sheetId"), ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create("Sofia Apartments · booking requests");
    ss.getSheets()[0].appendRow(["Received", "Apartment", "Check-in", "Check-out", "Nights", "Guests", "Name", "Email", "Mobile", "Language", "Message"]);
    p.setProperty("sheetId", ss.getId());
  }
  return ss.getSheets()[0];
}

/** Run this once from the editor (select "testSetup" and press Run) to give permissions and send yourself a test. */
function testSetup() {
  var r = doPost({ postData: { contents: JSON.stringify({ apt: "Sofia 264", checkin: "2027-07-10", checkout: "2027-07-14", nights: 4, guests: 2, name: "Test", email: HOST_EMAIL, lang: "el", message: "Test" }) } });
  Logger.log(r.getContent());
}
