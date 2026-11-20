import DetectOS from 'detectos.js';

/** Liefert ein Element per id; wirft, wenn es fehlt (Fehler im HTML). */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} nicht gefunden`);
    return el as T;
}

/** Größe des Browserfensters in Pixeln (für die Geräteinfo im Tab Info). */
export const myScreen = {
    clientWidth: 0,
    clientHeight: 0,
};

export const app = {
    appName: 'duennQs',
    browserLanguage: navigator.language.split('-')[0],
    hasFSAccess: 'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),
    gerechnet: false,                // liegt ein Ergebnis der aktuellen oder einer früheren Eingabe vor?
    berechnungErforderlich: true,    // Eingabe nach dem letzten Rechnen geändert (oder noch nie gerechnet)
};

export const Detect = new DetectOS();

/** Zeilenumbruch passend zum Betriebssystem (für die Zwischenablage). */
export const newLine = Detect.OS === 'Windows' ? '\r\n' : '\n';

/** Eingabe geändert: angezeigte Ergebnisse passen nicht mehr dazu (Rechnen-Button in Akzentfarbe). */
export function berechnungErforderlich(erforderlich = true): void {
    app.berechnungErforderlich = erforderlich;
    document.dispatchEvent(new CustomEvent('berechnung-erforderlich', { detail: { erforderlich } }));
}
