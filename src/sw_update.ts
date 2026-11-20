/// <reference types="vite-plugin-pwa/client" />
/*
  Service Worker und Prüfung auf neue Versionen (nach d2beam-gui, pages/sw_update.ts).

  registerType "prompt" (vite.config.ts): Eine neue Version wird im Hintergrund geladen, übernimmt
  aber erst, wenn der Nutzer im Dialog zustimmt. Vor dem Neuladen wird die aktuelle Eingabe
  gesichert und danach von autosave.ts wiederhergestellt.

  Der Browser prüft selbst nur beim Laden der Seite. Kommt die installierte App aus dem Hintergrund
  zurück, ist das kein Laden – deshalb wird hier zusätzlich beim Zurückkehren (visibilitychange) und
  per Timer geprüft, jeweils höchstens einmal je PRUEF_ABSTAND_MS. Eine geschlossene oder im
  Hintergrund eingefrorene App prüft nicht.
*/
import {registerSW} from 'virtual:pwa-register';
import {msg} from '@lit/localize';
import {confirmdialog} from './components/confirm_dialog';
import {sichern} from './autosave';

// d2beam-gui prüft höchstens alle 24 h; duennqs (wie quer_2) stündlich, damit eine neue Version (z.B. vor einer
// Vorlesung) noch am selben Tag ankommt. Geladen wird dabei nur die kleine sw.js.
const PRUEF_ABSTAND_MS = 60 * 60 * 1000;
const LETZTE_PRUEFUNG_KEY = 'DUENNQS_sw_letzte_pruefung';

let dialogOffen = false;

function letztePruefung(): number {
    try {
        return Number(localStorage.getItem(LETZTE_PRUEFUNG_KEY)) || 0;
    } catch {
        return 0;
    }
}

function merkePruefung(): void {
    try {
        localStorage.setItem(LETZTE_PRUEFUNG_KEY, String(Date.now()));
    } catch { /* localStorage nicht verfügbar */ }
}

/**
 * Cache des früheren, handgeschriebenen Service Workers (pwabuilder, bis 2025) entfernen.
 * Der neue Service Worker (Workbox) ersetzt ihn unter derselben Adresse sw.js, räumt dessen Cache aber nicht auf.
 */
function alteCachesLoeschen(): void {
    if (!('caches' in window)) return;
    void caches.delete('pwabuilder-offline-page').catch(() => { /* nicht vorhanden */ });
}

export function starteVersionspruefung(): void {
    if (!('serviceWorker' in navigator)) return;
    alteCachesLoeschen();

    const updateSW = registerSW({
        immediate: true,

        async onNeedRefresh() {
            if (dialogOffen) return;
            dialogOffen = true;
            try {
                const ok = await confirmdialog(msg('Jetzt neu laden'), msg('Später'),
                    msg('Es gibt eine neue Version. Jetzt neu laden? Die aktuelle Eingabe bleibt erhalten.'));
                if (ok) {
                    sichern();               // Eingabe bleibt über das Neuladen erhalten
                    await updateSW(true);    // neuen Service Worker aktivieren und Seite neu laden
                }
            } finally {
                dialogOffen = false;
            }
        },

        onRegisteredSW(swUrl, registration) {
            if (!registration) return;
            merkePruefung();   // beim Registrieren prüft der Browser selbst

            const pruefen = async () => {
                if (Date.now() - letztePruefung() < PRUEF_ABSTAND_MS) return;
                if (registration.installing || !navigator.onLine) return;
                merkePruefung();
                try {
                    const resp = await fetch(swUrl, {cache: 'no-store', headers: {'cache-control': 'no-cache'}});
                    if (resp.status === 200) await registration.update();
                } catch (e) {
                    console.log('Versionsprüfung fehlgeschlagen', e);
                }
            };

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') void pruefen();
            });
            setInterval(() => void pruefen(), 15 * 60 * 1000);   // alle 15 min nachsehen, ob der Abstand um ist
        },

        onRegisterError(error) {
            console.log('Service Worker Registrierung fehlgeschlagen', error);
        },
    });
}
