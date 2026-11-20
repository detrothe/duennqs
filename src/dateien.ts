/*
 * Eingabe einlesen und speichern (Format wie bisher, siehe eingabe.ts).
 * Dateidialog über die File System Access API, wo vorhanden, sonst Upload bzw. Download.
 */

import { msg } from '@lit/localize';
import { saveAs } from 'file-saver';
import { byId, app } from './state';
import { eingabeAlsJSON, eingabeEinlesen } from './eingabe';
import { alertdialog } from './components/confirm_dialog';

const ENDUNGEN = ['.txt', '.json'];

function dateiWaehlen(): Promise<File | null> {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ENDUNGEN.join(',');
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
    });
}

async function einlesen(): Promise<void> {
    try {
        let datei: File | null;
        if (window.showOpenFilePicker) {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: msg('duennqs-Eingabe'), accept: { 'text/plain': ENDUNGEN } }],
            });
            datei = await handle.getFile();
        } else {
            datei = await dateiWaehlen();
        }
        if (!datei) return;
        if (!eingabeEinlesen(await datei.text())) {
            void alertdialog('ok', msg('Die Datei enthält keine gültige duennqs-Eingabe.'));
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        void alertdialog('ok', error instanceof Error ? error.message : String(error));
    }
}

async function speichern(): Promise<void> {
    const blob = new Blob([eingabeAlsJSON()], { type: 'text/plain' });
    try {
        if (app.hasFSAccess && window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'duennqs.txt',
                types: [{ description: msg('duennqs-Eingabe'), accept: { 'text/plain': ['.txt'] } }],
            });
            const stream = await handle.createWritable();
            await stream.write(blob);
            await stream.close();
        } else {
            const name = window.prompt(msg('Name der Datei (wird im Download-Ordner gespeichert):'), 'duennqs.txt');
            if (name) saveAs(blob, name);
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        void alertdialog('ok', error instanceof Error ? error.message : String(error));
    }
}

export function initDateien(): void {
    byId('readFile').addEventListener('click', () => void einlesen());
    byId('saveFile').addEventListener('click', () => void speichern());
}
