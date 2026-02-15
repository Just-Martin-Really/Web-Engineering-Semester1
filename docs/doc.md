# Web-Engineering - Semester 1
## Projektdokumentation

---

## Frontend

### Unsere Aufgabe

Die Webapplikation besteht aus den folgenden funktionalen Bestandteilen:

1. Alle Webseiten mit responsivem Design
2. Interaktion des Benutzers mit Webseite über grafische Bedienelemente (Textfelder, Zahlenfelder, Buttons, …)
3. Registrierungsformular für Benutzer der Web-Applikation
4. Login-Formular für Benutzer der Web-Applikation
5. Dynamische Antwortseiten auf Basis clientseitigen Code und serverseitigem Code

Für das Frontend war unsere erste Aufgabe das Design der Website. Unsere erste Idee war, dass unser Projekt aus zwei verschiedenen Seiten besteht:

- **Homepage-Seite**
- **Kursforum-Seite**

Die erste Seite ist die Homepage. Sie besteht aus einer Navigationsleiste ganz oben sowie aus drei verschiedenen Sektionen und einer Footer-Sektion:

1. **Home-Sektion:** Enthält ein großes Foto als Thumbnail mit einer Willkommensnachricht sowie einen Login-Button. Die Fotos haben wir von [Pixabay](https://pixabay.com) gefunden.
2. **About-Sektion:** Beschreibt, worum es auf unserer Website geht und was die wichtigste Aufgabe der Website ist.
3. **Login/Registration-Sektion:** Besteht aus zwei Divisionen: ein Bereich für Login und ein Bereich für Registration.

Am Ende der Seite befindet sich eine **Footer-Sektion** mit Kontaktinformationen sowie einer kleinen Navigationsleiste.

> Auf der nächsten Seite können Sie die erste Skizze dieses Projekts sehen.

---

### Programmierung der Homepage-Seite

Für die Programmierung dieser Homepage-Seite haben wir zunächst nur **HTML** und **CSS** verwendet, um ein erstes gutes Aussehen zu erreichen.

#### Public-Bereich Dateien

- `Homepage.html` – enthält ausschließlich den HTML-Code für die Homepage
- `Homepage.css` – enthält ausschließlich den CSS-Code für die Homepage
- `Kursforum.html` – enthält den HTML-Code für die Kursforum-Seite
- `Kursforum.css` – enthält den CSS-Code für die Kursforum-Seite

---

### HTML Dokumentation

Das HTML-Dokument der Homepage ist in die Bereiche `<head>` und `<body>` gegliedert.

- Im `<head>` Bereich befinden sich Meta-Daten, und der CSS-Code wird über eine separate CSS-Datei verlinkt.
- Der `<body>`-Bereich enthält den sichtbaren Inhalt der Seite.

#### Aufbau des `<body>`-Bereichs

- **Navigationsleiste:** Mithilfe einer Liste erstellt. Jeder Punkt repräsentiert eine einzelne Sektion der Seite und führt direkt zu dieser Sektion (über Links und IDs).
- **Home-Sektion („Thumbnail“):** Zwei Divisionen: ein großes Foto und ein Login-Button, die direkt zu den Sektionen Login und Registration führen.
- **About-Us-Sektion:** Zwei Divisionen: ein Bild und ein Absatz Text.
- **Login/Registration-Sektion:**
    - **LoginBox**
        - Textfeld für den Benutzernamen
        - Textfeld für das Passwort
        - Login-Button: leitet bei korrekten Daten direkt zur Forum-Seite weiter
        - Link zur Registration
    - **RegistrationBox**
        - Textfeld für Vorname, Nachname, Benutzername, Passwort, Kurs
        - Registration-Button: sendet Daten an den Server zur Verarbeitung
- **Footer-Sektion:**
    - Absatz mit Kontaktinformationen
    - Liste mit allen Sektionen (führt direkt zu den entsprechenden Sektionen)
    - Footer-Button mit Hinweis, wer die Website gestaltet hat

Wir haben außerdem zwei Fotos im Public-Ordner hinzugefügt, die für das Design und Layout der Home- und About-Us-Sektion verwendet wurden.

---

## CSS Dokumentation

1. **Allgemeine Klassen:**  
   Wir haben im HTML-Code für alle Divisionen, Sektionen und Elemente eindeutige Klassen erstellt, daher war das CSS leichter programmierbar.

2. **Body & Box-Sizing:**
    - Margins, Padding und Box-Sizing für die gesamte Seite definiert
    - Hintergrundfarbe für den Body festgelegt

3. **Hero-Bild / Thumbnail:**
    - Ganze Sektion positioniert
    - Bild innerhalb der Sektion platziert
    - Inhalt zentriert
    - Willkommensnachricht konfiguriert
    - Optimiert für Handys und Tablets mit Media Queries
    - Button in der Mitte gestaltet, optisch ansprechend
    - Hover- und Active-Effekte für den Button hinzugefügt

4. **Navigationsleiste:**
    - Listenelemente nebeneinander angeordnet
    - Abstand zwischen den Elementen
    - Textfarbe und Schriftgröße angepasst
    - Hover- und Active-Effekte: leichte Transparenz beim Darüberfahren oder Anklicken

5. **About Us-Sektion:**
    - Zwei Boxen, jeweils 50% der Breite
    - Eine Box enthält das Foto, die andere Titel und Text
    - Schriftart und Schriftgröße für Text festgelegt
    - Optimierung für Handys via Media Queries

6. **Login/Registrierungs-Sektion:**
    - Zwei gleich große Boxen mit mehreren Textfeldern
    - Einheitliche Größe, Schriftart und Schriftgröße der Textfelder
    - Hintergrundfarbe und Box-Größe identisch
    - Überschriften zentriert und gleiche Größe
    - Buttons zentriert, verschiedene Farben für besseren Kontrast
    - Registrierungslink: andere Farbe, Hover-Effekt
    - Optimiert für mobile Geräte via Media Queries

7. **Footer-Sektion:**
    - Hintergrundfarbe, Größe und Schriftart definiert
    - Listen innerhalb der Sektion gestaltet und Größe angepasst
    - Links mit Hover-Unterstreichung
    - Footer Bottom gestaltet, Text formatiert
    - Media Queries für mobile Geräte implementiert

---

# Dokumentation der Änderungen am Header und Scroll-Verhalten 26.01.2025.

## 1. Navigation im Header platziert
- Der Menübereich wurde in das `<header>`-Element verschoben.
- Die Navigation ist nun semantisch korrekt in der Kopfzeile der Seite integriert.

## 2. Fixierte Position des Headers
- Im CSS wurde der Header auf `position: fixed` gesetzt.
- Der Header bleibt beim Scrollen immer oben auf der Seite sichtbar.

## 3. Smooth Scroll aktiviert
- Das HTML-Verhalten beim Anklicken von Ankerlinks wurde so angepasst, dass das Scrollen **sanft und flüssig** erfolgt.
- Dies geschieht durch die CSS-Eigenschaft `scroll-behavior: smooth`.

## 4. Scroll-Margin für Sektionen
- In allen Sektionen wurde ein oberer Abstand von 80px (`scroll-margin-top: 80px`) definiert.
- Dadurch werden Sektionen beim Scrollen nicht unter dem fixierten Header angezeigt, sondern korrekt direkt darunter.

## 5. Pop in Animation für Wilkommens-nachricht und für loginbutton

**Pop-In Animation** (`@keyframes popIn`) hinzugefügt.
- **Welcome-Nachricht (Überschrift)** animiert beim Laden der Seite:
    - `.thumbnailContent h1` → `animation: popIn 1s ease-out forwards;`
- **Login-Button** animiert beim Laden der Seite:
    - `.buttonToLogin` → `animation: popIn 2s ease-out forwards;`
- Animationen starten automatisch **beim Laden der Seite**.


## Umsetzung der HTML-Struktur

Ich habe festgestellt, dass wir immer `<article>`-Elemente anstelle von `<div>` verwenden sollen.  
Daher habe ich alle entsprechenden `<div>`-Blöcke in `<article>`-Elemente ersetzt.

Nun enthält jede `<section>` mindestens zwei `<article>`-Elemente, wie es in der Aufgabenstellung verlangt wird.

Die Dokumentation werde ich später noch ausführlicher und besser formulieren.
