# Umstellung von duennqs nach dem Vorbild quer_2

Übergabe aus der quer_2-Sitzung vom 20.11.2026. Ziel: duennqs (dünnwandige Querschnitte) technisch und optisch
so aufstellen wie quer_2 (polyQuer, v1.0.0), das sich wiederum an d2beam-gui orientiert.

Vorbilder (lokal):
- quer_2: `/home/detlef/git-code/quer_2` (github detrothe/quer_2, Netlify polyquerschnitt.netlify.app)
- d2beam-gui: `/home/detlef/git-code/d2beam-gui-5-11-2026-claude` – maßgeblich für Stil und Verhalten

## Arbeitsweise des Nutzers

- Kommunikation auf Deutsch, Code-Kommentare und Bezeichner ebenfalls deutsch.
- Committen nur, wenn er „committen“ sagt; nach jeder Änderung kurz zusammenfassen und fragen.
  Commits direkt auf master/main. Pushen macht er selbst (danach baut Netlify).
- `push.followTags` ist global gesetzt: annotierte Tags (`git tag -a`) gehen mit `git push` mit.
- Er prüft mit `npm run dev` und auf Tablet/Smartphone (Android, iPad, iPhone).
- Die App soll schlank bleiben (Lehr-App für Vorlesung und Übung).

## Ausgangslage duennqs (Stand 20.11.2026)

- Build mit esbuild (`src/index.js` → `dist/index.js`), `dist/` ist eingecheckt, inkl. handgeschriebenem `sw.js`,
  `manifest.webmanifest`, `offline.html`, Doku-HTML (deutsch + `docu_en.html`), Bilder, Fonts.
- Gemischt JS/TS (~10 000 Zeilen). Größte Teile: `grafik_3D.ts` (2550), `duennQ.ts` (1759, Berechnung),
  `mypdf.ts` (846, PDF mit jspdf + FreeSans-Fonts), `base_tabelle.ts` + `duennQ_tabelle.js` (Tabellen-
  Zwischenlösung mit zwei Tabellen), `contextMenu.js`, `einstellungen.ts`, `systemlinien.ts`.
- Abhängigkeiten: d3 7, three 0.151 (dazu eigene Kopien von OrbitControls, CSS2DRenderer, TextGeometry,
  TTFLoader, opentype, MeshLine in `src/`), lil-gui 0.18, jspdf, html2canvas, html-to-pdfmake, file-saver.
- **Nicht committete Änderungen** in `dist/index.html`, `package.json`, `dist/sitemap.xml` – vor dem Umbau mit
  dem Nutzer klären (committen oder verwerfen).

## Zielbild (wie quer_2)

| Bereich | quer_2 | Datei(en) in quer_2 |
|---|---|---|
| Build | Vite 8 + vite-plugin-pwa 2, `tsc && vite build`, `dist/` nicht im Git | `vite.config.ts`, `package.json` |
| Sprache | TypeScript strict, `"type": "module"` | `tsconfig.json` |
| Oberfläche | Lit 3 (`dr-haupt` ohne Shadow DOM) + Shoelace-Tabs: Eingabe · Ergebnisse · 3D · Info · ꔷꔷꔷ | `src/components/dr-haupt.ts`, `styles/main.css` |
| Hell/Dunkel | Shoelace light/dark nach Systemeinstellung, Klasse `sl-theme-dark` | `src/index.ts` |
| Einstellungen | Tab ꔷꔷꔷ: Tabellenfarbe, Akzentfarbe, CSS-Variablen `--table_bg/--table_fg/--user_accent`, localStorage mit App-Präfix | `src/einstellungen.ts` |
| Tabelle | `dr-tabelle` aus d2beam-gui, unverändert kopiert; Abhängigkeiten über eine Umgebungsdatei ersetzt | `src/components/dr-tabelle.ts`, `tabelle_umgebung.ts` |
| Dialoge | confirm/alert-Dialog aus d2beam-gui | `src/components/confirm_dialog.ts` |
| Hilfetexte | langes Drücken zeigt `title` (wie d2beam-gui) | `src/components/touch_hint.ts` |
| 2D-Grafik | Two.js statt d3, Fangkreuz/Koordinatenanzeige auch per Finger | `src/grafik.ts`, `src/trans.ts` |
| 3D | three.js aus npm (kein Vendoring), als eigener Chunk per `import()` nachgeladen; lil-gui als „Bedienfeld“ (deutsch, „Zurücksetzen“), Fangkreuz mit Werteanzeige, Pan/Werte-Umschalter für Finger, PNG-Export mit wählbarer Auflösung und weißem Hintergrund | `src/grafik3d.ts`, `src/rechnen.ts` |
| Dateien | Speichern/Öffnen wie d2beam-gui, eigene Endung (`.polyquer`, Android `.polyquer.json`), Dateidialog (File System Access) sonst Download, Rückfrage nur bei ungespeicherten Änderungen, Drag & Drop | `src/dateien.ts` |
| Autosave | Eingabe bei visibilitychange/pagehide/beforeunload in localStorage, Wiederherstellen beim Start | `src/autosave.ts` |
| PWA-Update | `registerType: 'prompt'`, Prüfung auch beim Zurückkehren aus dem Hintergrund (stündlich), vorher sichern | `src/sw_update.ts` |
| Apple | iPadOS-Schleier: Inhalt in installierter PWA tiefer; theme-color hell/dunkel | `index.html`, `styles/main.css` |
| Icons | im Stil des blauen d2beam-Icons, Quelle als SVG, mit Inkscape gerendert (192, 512, maskable, apple-touch, favicon-48) | `icon-quelle/`, `public/` |
| Version | aus `package.json` (`__APP_VERSION__`), Build-Datum `__BUILD_DATE__`, beides in der Fußzeile im Tab Info | `vite.config.ts`, `src/types/globals.d.ts` |
| Netlify | `netlify.toml`: `npm run build`, `dist`, Node 22, kein Caching für `sw.js` und Manifest | `netlify.toml` |
| README | für GitHub mit Screenshot | `README.md` |

## Reihenfolge, die sich in quer_2 bewährt hat (siehe `git log` dort)

1. Bundler auf Vite + vite-plugin-pwa umstellen, `dist/` aus dem Git nehmen, Netlify-Konfiguration.
2. Altlasten entfernen (jQuery, auskommentierter Code, unbenutzte Dateien, vendorte Bibliotheken durch npm ersetzen).
3. Auf TypeScript umstellen (strict).
4. Grafik-Bibliotheken: d3 → Two.js (2D), three.js aktuell aus npm (3D).
5. Autosave, dann neues Design mit Lit + Shoelace-Tabs.
6. Feinschliff wie d2beam-gui: Einstellungen-Tab, Dialoge, Touch-Hinweise, Dateiformat, Service-Worker-Update,
   Icons, Themenfarbe, Version, README. Am Ende Version 1.0.0 taggen.

Jeder Schritt ein eigener Commit, die App bleibt nach jedem Schritt lauffähig.

## Offene Entscheidungen für duennqs (mit dem Nutzer klären)

- **dr-tabelle als gemeinsames Paket?** Geplant war, bei der duennqs-Überarbeitung `dr-tabelle` (+ dr-button-pm,
  confirm_dialog, Kontextmenü) als Paket für d2beam-gui, quer_2 und duennqs auszulagern. Vorher entkoppeln:
  `berechnungErforderlich` als Event, Querschnitts-Selects als Property, Touch-Support als Attribut.
  Knackpunkt Übersetzungen: `lit-localize extract` erfasst `node_modules` nicht → deutsche Standardtexte im Paket,
  die App reicht übersetzte Texte per Property herein. Einbindung als Git-Abhängigkeit
  (`github:detrothe/…#vX`), beim Entwickeln lokal verlinkt. Alternativ erst wie in quer_2 kopieren.
- **Zwei Tabellen** (Zwischenlösung in duennqs) → wie viele `dr-tabelle`-Instanzen braucht die neue Eingabe?
- **PDF-Ausgabe** (jspdf, html2canvas, FreeSans): behalten, vereinfachen oder ersetzen? quer_2 hat keine.
- **Englisch**: duennqs hat englische Doku (`docu_en.html`) – Mehrsprachigkeit (lit-localize wie d2beam-gui)
  oder nur Deutsch wie quer_2?
- **3D-Umfang**: `grafik_3D.ts` ist sehr groß (Text-Geometrie, TTF-Fonts, MeshLine). Was davon wird gebraucht,
  was ersetzen CSS2D-Labels und die quer_2-Lösungen?
- **Dateiendung** für duennqs-Dateien und Kompatibilität zu bestehenden gespeicherten Eingaben.
- **localStorage-Präfix** (z.B. `DUENNQS_`), weil lokal mehrere Apps auf localhost laufen.
- Netlify-Site und Domain von duennqs.

## Hinweise zum Testen

- `npm run dev` bzw. `npm run preview` (Build + Vorschau) und TypeScript-Prüfung mit `npx tsc --noEmit -p .`.
- Headless-Tests der 3D-Ansicht mit WebGL in Echtzeit (Chrome DevTools Protocol), nicht mit
  `--virtual-time-budget` – der Zeitraffer erzeugt Scheinfehler.
