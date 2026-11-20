import { msg } from '@lit/localize';
import { app } from './state';
import { eingabeAlsJSON, eingabeEinlesen } from './eingabe';
import { dateiname, setzeDateiname } from './dateien';
import { duennQ } from './duennQ';
import { alertdialog } from './components/confirm_dialog';

/*
 * Eingabe automatisch sichern und wiederherstellen (wie in d2beam-gui und quer_2).
 *
 * Android und iOS beenden eine App im Hintergrund oft ohne Vorwarnung; beim Zurückkehren wird die
 * Seite neu geladen und die Eingabe wäre weg. Deshalb wird bei jedem Wechsel in den Hintergrund
 * (visibilitychange → hidden), beim Verlassen (pagehide) und beim Schließen (beforeunload) gespeichert
 * und beim Start wieder eingelesen. Doppeltes Speichern schadet nicht, daher auf allen Plattformen.
 */

const SCHLUESSEL = 'DUENNQS_current_input';
const SCHLUESSEL_DEFEKT = 'DUENNQS_current_input_defekt';

interface Sicherung {
    eingabe: string;     // JSON wie in der Datei
    gerechnet: boolean;  // war beim Sichern ein Ergebnis zu sehen?
    dateiname?: string;  // zuletzt geöffnete/gespeicherte Datei
}

/** Aktuelle Eingabe sofort sichern (auch vor dem Neuladen nach einem Update). */
export function sichern(): void {
    try {
        const daten: Sicherung = { eingabe: eingabeAlsJSON(), gerechnet: app.gerechnet, dateiname: dateiname() };
        window.localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
    } catch (e) {
        console.error('autosave: Sichern nicht möglich', e);
    }
}

function wiederherstellen(): void {
    let text: string | null = null;
    try {
        text = window.localStorage.getItem(SCHLUESSEL);
    } catch (e) {
        console.error('autosave: localStorage nicht verfügbar', e);
        return;
    }
    if (!text) return;

    try {
        const daten = JSON.parse(text) as Sicherung;
        if (!eingabeEinlesen(daten.eingabe)) throw new Error('gespeicherte Eingabe wurde abgelehnt');
        setzeDateiname(daten.dateiname ?? '');
        // Ergebnis wiederherstellen, aber im Tab Eingabe bleiben
        if (daten.gerechnet) duennQ(false);
    } catch (error) {
        // Defekte/inkompatible Sicherung: aufheben, löschen und mit dem Startbeispiel weitermachen,
        // damit die App nicht bei jedem Start erneut daran scheitert.
        console.error('autosave: gespeicherte Eingabe konnte nicht gelesen werden', error);
        try {
            window.localStorage.setItem(SCHLUESSEL_DEFEKT, text);
            window.localStorage.removeItem(SCHLUESSEL);
        } catch { /* nichts mehr zu retten */ }
        void alertdialog('ok', msg('Die zuletzt gespeicherte Eingabe konnte nicht gelesen werden. Es wird mit dem Beispiel gestartet.'));
    }
}

/**
 * Letzte Eingabe wiederherstellen und künftig automatisch sichern.
 * @param vordergrund wird nach der Rückkehr aus dem Hintergrund aufgerufen (z.B. 3D neu zeichnen)
 */
export function initAutosave(vordergrund: () => void): void {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sichern();
        else vordergrund();
    });
    window.addEventListener('pagehide', sichern);
    window.addEventListener('beforeunload', sichern);

    wiederherstellen();
}
