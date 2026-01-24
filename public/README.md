
**Web-Engineering-Semester1
Web-Engineering Projekt von Amica, Tamara, Stefan und Martin.**

# **# Homepage:**

## Beischreibung:

Dieses Paket enthält die HTML-Formulare für Login und Registrierung von Benutzern im Kursforum.
Die Formulare sind vollständig für das Backend vorbereitet.

### Login: Benutzername und Passwort:

| Feld            | Name                | ID                          |
|-----------------|---------------------|-----------------------------|
| Benutzername    | `loginBenutzername` | `textLoginBenutzerName`     |
| Passwort        | `loginPasswort`     | `textLoginBenutzerPasswort` |
| Button (Senden) | —                   | `buttonLogin`               |


### Registrierung: Vorname, Nachname, Benutzername, Passwort und Kurs:

| Feld            | Name              | ID                        |
|-----------------|-------------------|---------------------------|
| Vorname         | `regVorname`      | `textRegBenutzerVorname`  |
| Nachname        | `regNachname`     | `textRegBenutzerNachname` |
| Benutzername    | `regBenutzername` | `textRegBenutzerName`     |
| Passwort        | `regPasswort`     | `textRegBenutzerPasswort` |
| Kurs            | `regKurs`         | `textRegBenutzerKurs`     |
| Button (Senden) | —                 | `buttonRegReg`            |

das hat Chatgpt gemacht :)

1. Alle Input-Felder haben ein eindeutiges ID
2. Alle Felder haben eine requiered-Atribbut - Browser verhindert leere Eingaben
3. Buttons haben type="submit"
4. Sie haben diese Tabelle für alle Name und ID
