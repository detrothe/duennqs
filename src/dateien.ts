/*
 * Eingabe einlesen und speichern wie in d2beam-gui und quer_2 (Format siehe eingabe.ts).
 *
 * - eigene Endung .duennqs (Android: .duennqs.json, weil der Speichern-Dialog dort sonst ".txt" anhängt);
 *   ältere duennqs-Dateien (.txt) werden weiter eingelesen
 * - Dateidialog über die File System Access API, sonst Download
 * - Rückfrage vor dem Verwerfen nur, wenn Änderungen noch nicht in einer Datei gespeichert sind
 * - Drag & Drop einer Datei im Tab Eingabe
 */

import { msg } from '@lit/localize';
import { app, byId } from './state';
import { eingabeAlsJSON, eingabeEinlesen, eingabeLeer } from './eingabe';
import { alertdialog, confirmdialog } from './components/confirm_dialog';

const ENDUNG = '.duennqs';
const GESPEICHERT_KEY = 'DUENNQS_gespeicherter_stand';

let aktuellerName = '';
let letzterFileHandle: FileSystemFileHandle | null = null;
let hinweisUeberschreibenGezeigt = false;

const isAndroid = /Android/i.test(navigator.userAgent);

//----------------------------------------------------------------------------------------------------------------------
// Dateiname, gespeicherter Stand und Rückfrage vor dem Verwerfen (wie d2beam-gui, pages/dateien.ts)

/** Aktuellen Dateinamen setzen und im Tab Eingabe anzeigen. */
export function setzeDateiname(name: string): void {
    aktuellerName = name;
    byId('id_dateiname').textContent = name;
}

export function dateiname(): string {
    return aktuellerName;
}

/** Name ohne Endungen und Android-Zähler, z.B. "test.duennqs (2).json" → "test" */
function basisname(name: string): string {
    let basis = String(name).trim();
    let alt = '';
    while (alt !== basis) {
        alt = basis;
        basis = basis.replace(/\.(txt|json|duennqs)$/i, '').replace(/\s*\(\d+\)$/, '');
    }
    return basis === '' ? 'querschnitt' : basis;
}

/** Dateiname für Ausgaben (pdf, Bilder) passend zur aktuellen Eingabe, z.B. "test_3d.png". */
export function vorschlag(zusatz: string): string {
    return basisname(aktuellerName === '' ? 'duennqs' : aktuellerName) + zusatz;
}

function standHash(s: string): string {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Aktuellen Stand als gespeichert merken (nach Speichern, Einlesen, neuer Eingabe). */
export function alsGespeichertMerken(): void {
    try {
        window.localStorage.setItem(GESPEICHERT_KEY, standHash(eingabeAlsJSON()));
    } catch (error) {
        console.error('alsGespeichertMerken: localStorage nicht verfügbar', error);
    }
}

/** Beim allerersten Start gilt das Startbeispiel als gespeichert (sonst käme sofort eine Rückfrage). */
export function gespeichertenStandInitialisieren(): void {
    try {
        if (window.localStorage.getItem(GESPEICHERT_KEY) === null) alsGespeichertMerken();
    } catch { /* localStorage nicht verfügbar */ }
}

function hatUngespeicherteAenderungen(): boolean {
    if (eingabeLeer()) return false;   // leere Eingabe, nichts zu verlieren
    let gemerkt: string | null = null;
    try {
        gemerkt = window.localStorage.getItem(GESPEICHERT_KEY);
    } catch (error) {
        console.error('hatUngespeicherteAenderungen: localStorage nicht verfügbar', error);
    }
    return gemerkt !== standHash(eingabeAlsJSON());
}

/** Rückfrage nur, wenn es Änderungen gibt, die noch nicht in einer Datei gespeichert sind. */
export async function verwerfenBestaetigt(neueEingabe = false): Promise<boolean> {
    if (!hatUngespeicherteAenderungen()) return true;
    return await confirmdialog(
        neueEingabe ? msg('Trotzdem neu beginnen') : msg('Trotzdem öffnen'),
        msg('Abbrechen'),
        neueEingabe
            ? msg('Die aktuelle Eingabe hat Änderungen, die noch nicht in einer Datei gespeichert sind. Sie gehen bei einer neuen Eingabe verloren.')
            : msg('Die aktuelle Eingabe hat Änderungen, die noch nicht in einer Datei gespeichert sind. Sie gehen beim Öffnen einer anderen Datei verloren.')
    ) as boolean;
}

//----------------------------------------------------------------------------------------------------------------------
// Einlesen

function dateiEinlesen(f: File): void {
    const reader = new FileReader();
    reader.onload = () => {
        if (eingabeEinlesen(String(reader.result))) {   // ungültige Dateien werden abgelehnt, bevor etwas geändert wird
            setzeDateiname(f.name);
            alsGespeichertMerken();
        } else {
            void alertdialog('ok', msg('Die Datei enthält keine gültige duennqs-Eingabe.'));
        }
    };
    reader.onerror = () => {
        console.error('dateiEinlesen: Datei konnte nicht gelesen werden', reader.error);
        void alertdialog('ok', msg('Die Datei konnte nicht gelesen werden.'));
    };
    reader.readAsText(f);
}

async function handleFileSelect_read(): Promise<void> {
    if (!(await verwerfenBestaetigt())) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = () => {
        const file = fileInput.files?.[0];
        if (file) dateiEinlesen(file);
    };
    fileInput.click();
}

//----------------------------------------------------------------------------------------------------------------------
// Drag & Drop einer Eingabedatei, nur im Tab Eingabe, Ablegen auf dem ganzen Fenster (wie d2beam-gui)

let dragZaehler = 0;          // dragenter/dragleave feuern auch für jedes Kind-Element
let dropOverlay: HTMLDivElement | null = null;
let dropLaeuft = false;       // Rückfrage oder Einlesen noch nicht fertig
const popoverMoeglich = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

function istTabEingabe(): boolean {
    return !!document.querySelector('sl-tab[panel="eingabe"]')?.hasAttribute('active');
}

function ziehtDateien(e: DragEvent): boolean {
    return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
}

function zeigeDropOverlay(sichtbar: boolean): void {
    if (!dropOverlay) {
        dropOverlay = document.createElement('div');
        dropOverlay.style.cssText =
            'position:fixed; inset:0; z-index:100000; display:none; align-items:center; justify-content:center;' +
            'background:rgba(0,0,0,0.45); pointer-events:none;';
        const box = document.createElement('div');
        box.style.cssText =
            'padding:2rem 3rem; border:3px dashed #fff; border-radius:12px; color:#fff;' +
            'font-size:1.5rem; font-weight:600; text-align:center; max-width:80vw;';
        dropOverlay.appendChild(box);
        // als Popover in der obersten Ebene, damit es auch über offenen Dialogen liegt
        if (popoverMoeglich) {
            dropOverlay.popover = 'manual';
            dropOverlay.style.cssText +=
                'width:100%; height:100%; max-width:none; max-height:none; margin:0; border:0; padding:0;';
        }
        document.body.appendChild(dropOverlay);
    }
    (dropOverlay.firstElementChild as HTMLElement).textContent = msg('Datei hier ablegen, um sie zu öffnen');
    dropOverlay.style.display = sichtbar ? 'flex' : 'none';
    if (popoverMoeglich) {
        const offen = dropOverlay.matches(':popover-open');
        if (sichtbar && !offen) dropOverlay.showPopover();
        else if (!sichtbar && offen) dropOverlay.hidePopover();
    }
}

async function dateiAbgelegt(e: DragEvent): Promise<void> {
    const dt = e.dataTransfer;
    if (!dt || dt.files.length === 0) return;
    if (dt.files.length > 1) {
        void alertdialog('ok', msg('Bitte nur eine Datei ablegen.'));
        return;
    }
    const eintrag = dt.items?.[0]?.webkitGetAsEntry?.();
    if (eintrag?.isDirectory) {
        void alertdialog('ok', msg('Ein Ordner kann nicht geöffnet werden. Bitte eine Datei ablegen.'));
        return;
    }
    const f = dt.files[0];   // vor dem ersten await holen, danach ist dataTransfer leer
    dropLaeuft = true;
    try {
        if (await verwerfenBestaetigt()) dateiEinlesen(f);
    } finally {
        dropLaeuft = false;
    }
}

function initDrop(): void {
    // dragover/drop für Dateien immer abfangen, sonst öffnet der Browser die Datei selbst.
    // Außerhalb des Tabs Eingabe wird das Ablegen nur verweigert.
    window.addEventListener('dragenter', e => {
        if (!ziehtDateien(e)) return;
        e.preventDefault();
        dragZaehler++;
        if (istTabEingabe() && !dropLaeuft) zeigeDropOverlay(true);
    });
    window.addEventListener('dragleave', e => {
        if (!ziehtDateien(e)) return;
        dragZaehler = Math.max(0, dragZaehler - 1);
        if (dragZaehler === 0) zeigeDropOverlay(false);
    });
    window.addEventListener('dragover', e => {
        if (!ziehtDateien(e)) return;
        e.preventDefault();
        e.dataTransfer!.dropEffect = istTabEingabe() && !dropLaeuft ? 'copy' : 'none';
    });
    window.addEventListener('drop', e => {
        if (!ziehtDateien(e)) return;
        e.preventDefault();
        dragZaehler = 0;
        zeigeDropOverlay(false);
        if (!istTabEingabe() || dropLaeuft) return;
        void dateiAbgelegt(e);
    });
}

//----------------------------------------------------------------------------------------------------------------------
// Speichern

/** Download über einen temporären Link (für Browser ohne showSaveFilePicker). */
export function download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // nicht sofort freigeben, manche Browser starten den Download asynchron
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function handleFileSelect_save(): Promise<void> {
    const json = eingabeAlsJSON();

    if (app.hasFSAccess && window.showSaveFilePicker) {
        try {
            const blob = new Blob([json], { type: isAndroid ? 'application/json' : 'text/plain' });
            const fileHandle = await window.showSaveFilePicker(isAndroid
                ? {
                    suggestedName: basisname(aktuellerName) + ENDUNG + '.json',
                    startIn: letzterFileHandle ?? undefined,
                    types: [{ description: 'duennQs (JSON)', accept: { 'application/json': ['.json'] } }],
                }
                : {
                    suggestedName: basisname(aktuellerName) + ENDUNG,
                    startIn: letzterFileHandle ?? undefined,
                    types: [{ description: msg('duennqs-Eingabe'), accept: { 'text/plain': [ENDUNG] } }],
                });
            letzterFileHandle = fileHandle;
            const fileStream = await fileHandle.createWritable();
            await fileStream.write(blob);
            await fileStream.close();
            setzeDateiname(fileHandle.name);
            alsGespeichertMerken();

            // Android legt bei vorhandenem Namen über "Speichern" eine neue Datei "name (1).json" an
            if (isAndroid && !hinweisUeberschreibenGezeigt && /\s\(\d+\)\.json$/i.test(fileHandle.name)) {
                hinweisUeberschreibenGezeigt = true;
                const nameHtml = String(fileHandle.name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                void alertdialog('ok', msg('Die Datei war schon vorhanden. Android hat deshalb eine neue Datei angelegt:') + '<br>' + nameHtml +
                    '<br><br>' + msg('Zum Überschreiben im Speichern-Dialog nicht auf „Speichern“ tippen, sondern die vorhandene Datei in der Liste antippen und das Ersetzen bestätigen.'));
            }
        } catch (error) {
            // Abbruch im Dateidialog ist kein Fehler
            if (error instanceof DOMException && error.name === 'AbortError') return;
            void alertdialog('ok', error instanceof Error ? error.message : String(error));
        }
    } else {
        // Vorschlag ohne angehängtes ".txt" früherer Speicherungen
        const vorschlag = aktuellerName ? aktuellerName.replace(/\.txt$/i, '') : basisname('') + ENDUNG;
        let filename = window.prompt(msg('Name der Datei (wird im Download-Ordner gespeichert):'), vorschlag);
        if (filename === null) return;          // Abbruch
        filename = filename.trim();
        if (filename === '') return;
        if (!/\.[^./\\]+$/.test(filename)) filename += ENDUNG;   // ohne Endung: .duennqs anhängen
        // nicht text/plain, sonst hängen Android und iPadOS ".txt" an
        const blob = new Blob([json], { type: isAndroid ? 'application/x-duennqs' : 'application/octet-stream' });
        download(blob, filename);
        setzeDateiname(filename);
        alsGespeichertMerken();
    }
}

/**
 * Datei (Bild, pdf, SVG) speichern: mit Dateidialog, wenn vorhanden, sonst als Download.
 * Der Dateidialog muss direkt aus dem Klick heraus geöffnet werden – der Inhalt wird deshalb erst danach erzeugt.
 */
export async function dateiSpeichern(erzeuge: () => Promise<Blob> | Blob, vorschlag: string,
                                     beschreibung: string, mime: string, endung: string): Promise<boolean> {
    try {
        if (app.hasFSAccess && window.showSaveFilePicker) {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: vorschlag,
                types: [{ description: beschreibung, accept: { [mime]: [endung] } }],
            });
            const blob = await erzeuge();
            const fileStream = await fileHandle.createWritable();
            await fileStream.write(blob);
            await fileStream.close();
        } else {
            download(await erzeuge(), vorschlag);
        }
        return true;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return false;
        void alertdialog('ok', error instanceof Error ? error.message : String(error));
        return false;
    }
}

export function initDateien(): void {
    byId('readFile').addEventListener('click', () => void handleFileSelect_read());
    byId('saveFile').addEventListener('click', () => void handleFileSelect_save());
    initDrop();
}
