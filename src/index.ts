// Shoelace-Themes wie in d2beam-gui: hell/dunkel folgt der Systemeinstellung
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import './styles/main.css';
import './styles/contextMenu.css';

import { msg } from '@lit/localize';
import './components/dr-haupt';
import { app, byId, Detect } from './state';
import { duennQ } from './duennQ';
import { initTabellen, setzeBeispiel, leereEingabe, spaltenAktualisieren } from './eingabe';
import { initEinstellungen } from './einstellungen';
import { initDateien, verwerfenBestaetigt, setzeDateiname, gespeichertenStandInitialisieren } from './dateien';
import { zeichneQuerschnitt } from './grafik';
import { alertdialog } from './components/confirm_dialog';
import { setLocale, startSprache, seitenMetaAktualisieren } from './localization';
import { initAutosave } from './autosave';
import { starteVersionspruefung } from './sw_update';
import { enableTouchHints } from './components/touch_hint';

// dunkles Theme von Shoelace über die Klasse sl-theme-dark (wie d2beam-gui)
const dunkel = window.matchMedia('(prefers-color-scheme: dark)');
const themaSetzen = () => document.documentElement.classList.toggle('sl-theme-dark', dunkel.matches);
themaSetzen();
dunkel.addEventListener('change', themaSetzen);

function geraeteInfo(): void {
    const info = byId('infoBox');
    const zeilen = [
        `${msg('Bildschirm')}: ${document.documentElement.clientWidth} × ${document.documentElement.clientHeight} px, ${msg('Pixeldichte')} ${window.devicePixelRatio}`,
        `Browser: ${Detect.browser} ${Detect.version ?? ''}, ${msg('Sprache')} ${navigator.language}`,
        `${msg('Betriebssystem')}: ${Detect.OS}${app.isMac ? ' (Mac)' : ''}`,
        `${msg('Touch-Punkte')}: ${navigator.maxTouchPoints}`,
        `${msg('Dateidialog (showSaveFilePicker)')}: ${app.hasFSAccess ? msg('ja') : msg('nein, Speichern als Download')}`,
    ];
    info.innerHTML = zeilen.join('<br>');
}

async function neueEingabe(): Promise<void> {
    // wie d2beam-gui: Rückfrage nur, wenn Änderungen noch nicht in einer Datei gespeichert sind
    if (!await verwerfenBestaetigt(true)) return;
    leereEingabe();
    setzeDateiname('');
}

let dreiDGeladen = false;   // three.js erst laden, wenn der Tab 3D geöffnet wurde

/** Sprache geändert: alles, was nicht von Lit gezeichnet wird, neu aufbauen. */
function spracheAktualisieren(haupt: HTMLElementTagNameMap['dr-haupt']): void {
    spaltenAktualisieren();
    geraeteInfo();
    if (app.gerechnet) duennQ(false);   // Ergebnistabellen in der neuen Sprache
    const aktiv = haupt.querySelector('sl-tab[active]')?.getAttribute('panel');
    if (aktiv === 'system') zeichneQuerschnitt();
    if (dreiDGeladen) void import('./grafik3d').then(m => m.spracheGeaendert());
}

async function start(): Promise<void> {
    const haupt = byId('id_haupt') as HTMLElementTagNameMap['dr-haupt'];
    await setLocale(startSprache());
    seitenMetaAktualisieren();
    await haupt.updateComplete;

    initEinstellungen();   // Längeneinheit und Farben (vor dem Startbeispiel, das in der Einheit eingetragen wird)
    setzeBeispiel();
    spaltenAktualisieren();
    initTabellen();
    initDateien();
    geraeteInfo();

    // Hilfetext bei langem Drücken (Finger/Stift) bzw. Überfahren (Maus) wie in d2beam-gui.
    // Nicht auf Bereiche mit Eingabefeldern anwenden (user-select: none stört dort unter iOS),
    // deshalb bei den Schnittgrößen nur die Namenszellen.
    for (const id of ['id_file_toolbar', 'id_ergebnis_toolbar', 'id_grafik_buttons', 'id_panel_einstellungen']) {
        enableTouchHints(byId(id));
    }
    for (const zelle of haupt.querySelectorAll<HTMLElement>('.schnittgroessen td.name')) enableTouchHints(zelle);

    byId('rechnen').addEventListener('click', () => duennQ());
    byId('neueEingabe').addEventListener('click', () => void neueEingabe());
    byId('id_pdf').addEventListener('click', () => {
        // PDF-Ausgabe (jspdf, Schriften ca. 1,5 MB) erst bei Bedarf nachladen, wie die 3D-Ansicht
        if (app.gerechnet) void import('./mypdf').then(m => m.my_jspdf());
        else void alertdialog('ok', msg('Es liegt keine fehlerfreie Berechnung vor.'));
    });

    // vor dem ersten Rechnen ist eine Berechnung erforderlich → Rechnen-Button in Akzentfarbe
    byId('rechnen').classList.add('veraltet');
    document.addEventListener('berechnung-erforderlich', ev => {
        byId('rechnen').classList.toggle('veraltet', (ev as CustomEvent).detail?.erforderlich !== false);
    });

    // nach dem Rechnen auf den Tab Ergebnisse wechseln
    document.addEventListener('berechnet', ev => {
        byId('id_hinweis_rechnen').hidden = true;
        if ((ev as CustomEvent).detail?.zeigeErgebnisse !== false) haupt.zeigeTab('ergebnisse');
    });

    // Sprachwechsel im Tab ꔷꔷꔷ (lit-localize meldet, wenn die Übersetzung geladen ist)
    window.addEventListener('lit-localize-status', ev => {
        if ((ev as CustomEvent).detail.status !== 'ready') return;
        seitenMetaAktualisieren();
        void haupt.updateComplete.then(() => spracheAktualisieren(haupt));
    });

    // Grafiken erst zeichnen, wenn ihr Tab sichtbar ist (vorher haben sie keine Größe);
    // die 3D-Ansicht (three.js) wird beim ersten Öffnen nachgeladen
    haupt.addEventListener('sl-tab-show', ev => {
        const name = (ev as CustomEvent).detail?.name;
        if (name === 'system') requestAnimationFrame(zeichneQuerschnitt);
        if (name === 'drei_d') dreiDGeladen = true;
        if (name === 'drei_d') requestAnimationFrame(() => void import('./grafik3d').then(m => m.zeige3D()));
    });

    // letzte Eingabe wiederherstellen und künftig automatisch sichern; zurück aus dem Hintergrund:
    // WebGL-Kontext kann verloren gegangen sein → 3D neu zeichnen
    initAutosave(() => {
        if (dreiDGeladen && app.gerechnet) void import('./grafik3d').then(m => m.neuZeichnen());
    });
    gespeichertenStandInitialisieren();

    // Service Worker registrieren und auf neue Versionen prüfen (auch beim Zurückkehren aus dem Hintergrund)
    starteVersionspruefung();
}

void start();
