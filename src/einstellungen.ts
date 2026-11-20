/*
 * Tab ꔷꔷꔷ (Einstellungen) wie in d2beam-gui/quer_2: Längeneinheit, Farben der Tabellen und Akzentfarbe.
 *
 * Änderungen wirken sofort; dauerhaft (für den nächsten Start) erst nach
 * „Auswahl als Standardwerte im Browser speichern“ – wie in d2beam-gui.
 *
 * Farben wirken über CSS-Variablen am Dokument (werden auch in Shadow-DOMs vererbt):
 *   --table_bg / --table_fg  → dr-tabelle und Titelleiste des Bedienfelds in 3D
 *   --user_accent + <html data-accent> → Shoelace-Primärfarbe (aktiver Tab, Rechnen-Button …), siehe main.css
 *
 * Intern rechnet duennqs in cm und kN/cm². Die Eingabe und alle Ausgaben stehen in der gewählten
 * Längeneinheit; die Spannungseinheit gehört dazu (mm → N/mm², cm → kN/cm², m → MN/m²).
 */

import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import { msg } from '@lit/localize';
import { byId, berechnungErforderlich } from './state';
import { alertdialog } from './components/confirm_dialog';
import { einheitenUmrechnen, spaltenAktualisieren } from './eingabe';
import { setLocale, KEY_LOCALE } from './localization';

export let current_unit_length = 'cm';
export let current_unit_stress = 'kN/cm²';
export let unit_length_factor = 1;   // Multiplikator von cm nach gewählter Einheit
export let unit_stress_factor = 1;   // Multiplikator von kN/cm² nach gewählter Einheit

const EINHEITEN: Record<string, { laenge: number; spannung: number; name: string }> = {
    mm: { laenge: 10, spannung: 10, name: 'N/mm²' },
    cm: { laenge: 1, spannung: 1, name: 'kN/cm²' },
    m: { laenge: 0.01, spannung: 10, name: 'MN/m²' },
};

const STANDARD_TABELLE = '#cfd915';   // wie d2beam-gui
const STANDARD_AKZENT = '#0284c7';    // Shoelace sky-600

// eigener Präfix: lokal laufen mehrere Apps auf localhost und teilen sich sonst den Speicher
const KEY_EINHEIT = 'DUENNQS_unit_length';
const KEY_TABELLE = 'DUENNQS_color_table_out';
const KEY_TEXT = 'DUENNQS_color_table_text';
const KEY_AKZENT = 'DUENNQS_accent_color';

type Picker = HTMLElement & { value: string };

function picker(id: string): Picker {
    return byId(id) as Picker;
}

/** Einheit setzen, ohne vorhandene Werte umzurechnen (Start, Datei einlesen). */
export function set_current_unit_length(einheit: string): void {
    if (!EINHEITEN[einheit]) einheit = 'cm';
    current_unit_length = einheit;
    current_unit_stress = EINHEITEN[einheit].name;
    unit_length_factor = EINHEITEN[einheit].laenge;
    unit_stress_factor = EINHEITEN[einheit].spannung;
    byId<HTMLSelectElement>('unitLength').value = einheit;
    spaltenAktualisieren();
}

/** Einheit im Tab ꔷꔷꔷ geändert: Eingabewerte umrechnen. */
function einheitGeaendert(): void {
    const neu = byId<HTMLSelectElement>('unitLength').value;
    const alt = EINHEITEN[current_unit_length];
    einheitenUmrechnen(EINHEITEN[neu].laenge / alt.laenge, EINHEITEN[neu].spannung / alt.spannung);
    set_current_unit_length(neu);
    berechnungErforderlich();
    geaendert(true);
}

/** schwarz oder weiß, je nachdem was auf der Hintergrundfarbe besser lesbar ist (WCAG-Luminanz, aus d2beam-gui) */
function kontrastfarbe(hex: string): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return '#000000';
    const n = parseInt(m[1], 16);
    const lin = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#000000' : '#ffffff';
}

function tabellenfarben(hintergrund: string, text: string): void {
    const root = document.documentElement;
    root.style.setProperty('--table_bg', hintergrund);
    root.style.setProperty('--table_fg', text);
}

/** null = Shoelace-Standard (Blau) */
function akzentfarbe(farbe: string | null): void {
    const root = document.documentElement;
    if (farbe) {
        root.style.setProperty('--user_accent', farbe);
        root.dataset.accent = '1';
    } else {
        root.style.removeProperty('--user_accent');
        delete root.dataset.accent;
    }
}

function lesen(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function geaendert(ja: boolean): void {
    byId('id_cb_saveLocalStorage').classList.toggle('speichern_hinweis', ja);
    byId('id_speichern_hinweis').hidden = !ja;
}

function speichern(): void {
    try {
        window.localStorage.setItem(KEY_EINHEIT, current_unit_length);
        window.localStorage.setItem(KEY_LOCALE, byId<HTMLSelectElement>('id_locale').value);
        window.localStorage.setItem(KEY_TABELLE, picker('id_color_table_out').value);
        window.localStorage.setItem(KEY_TEXT, picker('id_color_table_text').value);
        // Akzentfarbe nur speichern, wenn eine eigene gewählt ist (sonst Standard behalten)
        if (document.documentElement.dataset.accent) window.localStorage.setItem(KEY_AKZENT, picker('id_accent_color').value);
        else window.localStorage.removeItem(KEY_AKZENT);
        geaendert(false);
    } catch (e) {
        void alertdialog('ok', msg('Speichern im Browser nicht möglich: ') + (e instanceof Error ? e.message : String(e)));
    }
}

function loeschen(): void {
    try {
        for (const key of [KEY_EINHEIT, KEY_LOCALE, KEY_TABELLE, KEY_TEXT, KEY_AKZENT]) window.localStorage.removeItem(key);
    } catch { /* nichts zu tun */ }
    picker('id_color_table_out').value = STANDARD_TABELLE;
    picker('id_color_table_text').value = kontrastfarbe(STANDARD_TABELLE);
    picker('id_accent_color').value = STANDARD_AKZENT;
    tabellenfarben(STANDARD_TABELLE, kontrastfarbe(STANDARD_TABELLE));
    akzentfarbe(null);
    geaendert(false);
}

/** Gespeicherte Einstellungen anwenden und die Bedienelemente im Tab ꔷꔷꔷ verdrahten. */
export function initEinstellungen(): void {
    set_current_unit_length(lesen(KEY_EINHEIT) ?? 'cm');

    const tabelle = lesen(KEY_TABELLE) ?? STANDARD_TABELLE;
    const text = lesen(KEY_TEXT) ?? kontrastfarbe(tabelle);
    const akzent = lesen(KEY_AKZENT);

    picker('id_color_table_out').value = tabelle;
    picker('id_color_table_text').value = text;
    picker('id_accent_color').value = akzent ?? STANDARD_AKZENT;
    tabellenfarben(tabelle, text);
    akzentfarbe(akzent);
    geaendert(false);

    byId('unitLength').addEventListener('change', einheitGeaendert);
    byId('id_locale').addEventListener('change', () => {
        void setLocale(byId<HTMLSelectElement>('id_locale').value);
        geaendert(true);
    });
    // neue Hintergrundfarbe → Textfarbe automatisch hell oder dunkel
    byId('id_color_table_out').addEventListener('sl-input', () => {
        const bg = picker('id_color_table_out').value;
        const fg = kontrastfarbe(bg);
        picker('id_color_table_text').value = fg;
        tabellenfarben(bg, fg);
        geaendert(true);
    });
    byId('id_color_table_text').addEventListener('sl-input', () => {
        tabellenfarben(picker('id_color_table_out').value, picker('id_color_table_text').value);
        geaendert(true);
    });
    byId('id_accent_color').addEventListener('sl-input', () => {
        akzentfarbe(picker('id_accent_color').value);
        geaendert(true);
    });
    byId('id_accent_color_reset').addEventListener('click', () => {
        akzentfarbe(null);
        picker('id_accent_color').value = STANDARD_AKZENT;
        geaendert(true);
    });
    byId('id_cb_saveLocalStorage').addEventListener('click', speichern);
    byId('id_cb_deleteLocalStorage').addEventListener('click', loeschen);
}
