/*
 * Umgebung für die aus d2beam-gui übernommenen Komponenten (dr-tabelle.ts).
 *
 * dr-tabelle.ts ist bis auf die Import-Zeilen unverändert aus quer_2 (und damit d2beam-gui) kopiert,
 * damit sich Verbesserungen von dort leicht übernehmen lassen. Die Module, die dr-tabelle in d2beam-gui
 * importiert (querschnitte, haupt, globals, utility, @lit/localize, confirm_dialog), werden hier durch
 * das ersetzt, was duennqs braucht.
 */

import { Detect, berechnungErforderlich } from '../state';

export { Detect, berechnungErforderlich };

// --- pages/querschnitte: duennqs hat keine Auswahlspalten (select) mit Querschnitten
export const nQuerschnittSets = 0;

export function get_querschnittRechteck_name(index: number): string {
    return 'Querschnitt ' + (index + 1);
}

// --- pages/globals
/**
 * Fingerauswahl (Ziehen über mehrere Zellen) in Tabellen erlauben. Standard aus wie in d2beam-gui –
 * einschalten im Tab ꔷꔷꔷ (einstellungen.ts).
 */
export let touch_support_table = false;

export function set_touch_support_table(wert: boolean): void {
    touch_support_table = wert;
}

// --- pages/utility
export function write(text: string): void {
    console.log(text);
}

// --- @lit/localize
export { msg, str } from '@lit/localize';

// --- pages/confirm_dialog: unverändert aus d2beam-gui übernommen
export { ConfirmDialog } from './confirm_dialog';
