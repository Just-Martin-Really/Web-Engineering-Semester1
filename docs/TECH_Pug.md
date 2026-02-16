# Pug (Template Engine)

## Was ist Pug?
Pug (früher „Jade“) ist eine Template‑Sprache, um HTML einfacher zu schreiben.
Statt vieler `</div>` verwendet Pug Einrückungen (Indentation).

**Wichtig:** Pug erzeugt am Ende ganz normales HTML, das der Browser bekommt.

---

## Wie wird Pug im Projekt genutzt?
In `server.js`:
- `app.set('views', path.join(__dirname, 'views'))`
- `app.set('view engine', 'pug')`

Routes in `routes/pageRoutes.js` rendern Seiten:
- `/` → `views/index.pug`
- `/register` → `views/registration.pug`
- `/forum` → `views/forumpage.pug`
- `/404` → `views/404.pug`

---

## Was ist „statisch mit Pug“?
Auch wenn eine Seite „statisch“ ist (kein personalisierter Inhalt), kann man sie als Template pflegen:
- ein Layout in `views/layout.pug`
- Seiten, die dieses Layout „erben“ und nur Inhalte setzen

Vorteile:
- einheitlicher Aufbau
- weniger Kopieren von Header/Footer
- CSS/JS einmal zentral einbinden

---

## Typische Syntax (zum Verständnis)
- `div.container` bedeutet `<div class="container">...`.
- `a(href="/forum") Forum` bedeutet `<a href="/forum">Forum</a>`.
- Einrückung = Verschachtelung.

---

## Häufige Fehlerbilder
- Falsche Einrückung → Pug kann nicht kompilieren.
- Falscher Template‑Name in `res.render('...')`.
- Statische Assets (CSS/JS) liegen nicht in `public/` oder werden nicht referenziert.

---

## Best Practices
- Möglichst ein gemeinsames Layout nutzen.
- In Pug keine Business‑Logik, nur Darstellung.
- Für JS/CSS: klare, stabile Selektoren (IDs/Klassen), damit Frontend‑Skripte nicht „brechen“.

