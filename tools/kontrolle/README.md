# Kontrolle der Querschnittswerte

Unabhängige Nachrechnung der Querschnittswerte von duennqs und Vergleich mit den Werten, die die gebaute
App (`dist/`) anzeigt. Entstanden im November 2026 (Version 2.5.1), dabei wurden drei Fehler bei r_ω,
r_y/r_z (gemischtes Material) und der Richtung der Hauptachsen gefunden und behoben.

## Aufruf

```bash
npm run build
bash tools/kontrolle/kontrolle.sh
```

Voraussetzungen: `python3` mit `numpy`, `node`, `google-chrome`. Das Skript startet `vite preview`
(Port 4173) und headless Chrome (Port 9333) mit frischem Profil, lädt jeden Testquerschnitt als
automatische Sicherung, lässt rechnen und liest die Werte im Tab Ergebnisse aus.
In Claude Code außerhalb der Sandbox starten, dort stürzt headless Chrome ab.

Rückgabewert 0: alle Werte stimmen bis auf die Rundung der Anzeige; 1: Abweichungen (markiert mit `<<<`).

## Dateien

| Datei | Inhalt |
|---|---|
| `qwerte.py` | Kontrollrechnung: Linienmodell wie duennqs (ohne Eigenanteile t³), ideelle Werte über E/E_ref und G/G_ref. Wölbfunktion durch Integration entlang eines Spannbaums, geschlossene Zellen über das Bredt'sche Gleichungssystem (bewusst ein anderer Weg als die FE-Lösung in duennqs). Wagner-Koeffizienten in Hauptachsen wie bei Kindmann. |
| `faelle.py` | 11 Testquerschnitte und geschlossene Formeln (I-Profil mit ungleichen Flanschen, U-Profil, Kasten nach Bredt, Rohr, Rechteck mit runden Ecken). Gibt zur Kontrolle von `qwerte.py` die Formelwerte aus. |
| `browser.mjs` | Steuert die App über das Chrome DevTools Protocol und schreibt die angezeigten Werte nach `duennqs.json`. |
| `vergleich.py` | Gegenüberstellung duennqs ↔ Kontrolle je Querschnitt und Wert. |
| `kontrolle.sh` | alles zusammen; Ergebnisse in einem temporären Ordner (wird am Ende angezeigt). |

## Hinweise

- Verglichen werden alle 19 Werte des Tabs Ergebnisse in cm. Die Schubkorrekturfaktoren und die
  Spannungen sind nicht enthalten.
- φ_h ist bei I11 = I22 (Kreis, Quadrat) unbestimmt und wird dann nicht verglichen.
- `qwerte.py` enthält zusätzlich die alten, fehlerhaften duennqs-Formeln bis 2.5.0
  (`_r1_alt_bis_2_5_0`, `_rw_alt_bis_2_5_0`), mit denen sich die damaligen Abweichungen genau nachrechnen ließen.
