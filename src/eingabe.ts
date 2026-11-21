/*
 * Zugriff auf die Eingabe: Knoten- und Elementtabelle (dr-tabelle aus d2beam-gui), die Zähler
 * „Anzahl Knoten/Elemente“ und die übrigen Eingabefelder im Tab Eingabe.
 *
 * dr-tabelle legt ihre Tabelle im (offenen) Shadow DOM an: <table id="mytable">, Zeile 0 ist die
 * Kopfzeile, Spalte 0 die Nummer; in jeder Zelle steckt ein <input>. Alle Zugriffe darauf laufen
 * über dieses Modul.
 *
 * Knotentabelle:   ȳ, z̄                       (Längeneinheit aus Tab ꔷꔷꔷ)
 * Elementtabelle:  E-Modul, ν, Dicke t, nod1, nod2
 */

import { msg } from '@lit/localize';
import { byId, berechnungErforderlich } from './state';
import type { drButtonPM } from './components/dr-button-pm';
import { current_unit_length, current_unit_stress, unit_length_factor, unit_stress_factor, set_current_unit_length } from './einstellungen';

export const KNOTEN_TABELLE = 'id_knoten_tabelle';
export const ELEMENT_TABELLE = 'id_element_tabelle';
export const KNOTEN_ZAEHLER = 'id_button_nknoten';
export const ELEMENT_ZAEHLER = 'id_button_nelem';
export const MIN_KNOTEN = 2;
export const MIN_ELEMENTE = 1;

/** Felder mit Schnittgrößen und Bezugswerten (ids im Tab Eingabe). */
export const SCHNITTGROESSEN = ['Vy', 'Vz', 'Nx', 'Mxp', 'Mxs', 'Momega', 'My', 'Mz'] as const;
const BEZUGSWERTE = ['EMod_ref', 'mue_ref', 'fyRd'] as const;

// Startbeispiel: Hohlkasten mit Flügeln (Werte in cm und kN/cm²)
const START_Y = [0.0, 30.0, 110.0, 140.0, 85.0, 55.0];
const START_Z = [0.0, 0.0, 0.0, 0.0, 60.0, 60.0];
const START_INZIDENZEN = [[1, 2], [2, 3], [3, 4], [3, 5], [2, 6], [5, 6]];
export const START_ANZAHL_KNOTEN = START_Y.length;
export const START_ANZAHL_ELEMENTE = START_INZIDENZEN.length;

type DrTabelle = HTMLElement & {
    set_nzeilen_undo(n: number): void;
    clear_undo?: () => void;
    hide_column(i: number): void;
    show_column(i: number): void;
    columns_languageChanged(spalten: string): void;
    lf_languageChanged(text: string): void;
};

function tabelle(id: string): DrTabelle {
    return byId(id) as DrTabelle;
}

function mytable(id: string): HTMLTableElement {
    const t = tabelle(id).shadowRoot?.getElementById('mytable');
    if (!t) throw new Error('Tabelle noch nicht aufgebaut: ' + id);
    return t as HTMLTableElement;
}

function zelle(id: string, zeile: number, spalte: number): HTMLInputElement {
    return mytable(id).rows[zeile].cells[spalte].firstElementChild as HTMLInputElement;
}

function anzahlZeilen(id: string): number {
    return mytable(id).rows.length - 1;
}

export const anzahlKnoten = () => anzahlZeilen(KNOTEN_TABELLE);
export const anzahlElemente = () => anzahlZeilen(ELEMENT_TABELLE);

/** Zahl als Text ohne Rundungsfehler der Einheitenumrechnung (12 gültige Stellen). */
export function zahlText(zahl: number): string {
    return String(Number(zahl.toPrecision(12)));
}

//----------------------------------------------------------------------------------------------------------------------
// Zähler und Zeilenzahl

function setzeAnzahl(tabId: string, zaehlerId: string, n: number, min: number): void {
    n = Math.max(min, Math.round(n));
    byId<drButtonPM>(zaehlerId).setValue(n);
    tabelle(tabId).setAttribute('nzeilen', String(n));
}

export const setzeAnzahlKnoten = (n: number) => setzeAnzahl(KNOTEN_TABELLE, KNOTEN_ZAEHLER, n, MIN_KNOTEN);
export const setzeAnzahlElemente = (n: number) => setzeAnzahl(ELEMENT_TABELLE, ELEMENT_ZAEHLER, n, MIN_ELEMENTE);

/**
 * Zähler und Tabellen verbinden (wie quer_2): Zähler geändert → Zeilenzahl mit Rückgängig anpassen;
 * dr-tabelle hat selbst Zeilen gelöscht/eingefügt → Zähler nachziehen.
 */
export function initTabellen(): void {
    const verbinden = (tabId: string, zaehlerId: string, min: number) => {
        byId(zaehlerId).addEventListener('change', () => {
            const n = Math.max(min, byId<drButtonPM>(zaehlerId).getValue());
            tabelle(tabId).set_nzeilen_undo(n);
            if (tabId === ELEMENT_TABELLE) materialSpalten();   // neue Zeilen: ausgeblendete Spalten beachten
        });
        byId(tabId).addEventListener('rows-changed', ev => {
            const n = (ev as CustomEvent).detail.value;
            byId<drButtonPM>(zaehlerId).setValue(n);
            tabelle(tabId).setAttribute('nzeilen', String(n));
        });
    };
    verbinden(KNOTEN_TABELLE, KNOTEN_ZAEHLER, MIN_KNOTEN);
    verbinden(ELEMENT_TABELLE, ELEMENT_ZAEHLER, MIN_ELEMENTE);

    byId('material_equal').addEventListener('change', () => {
        materialSpalten();
        berechnungErforderlich();
    });
    for (const id of [...SCHNITTGROESSEN, ...BEZUGSWERTE]) {
        byId(id).addEventListener('input', () => berechnungErforderlich());
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Spaltenüberschriften und Material

export function materialGleich(): boolean {
    return byId<HTMLInputElement>('material_equal').checked;
}

/** Bei gleichen Materialdaten für alle Elemente die Spalten E-Modul und ν ausblenden. */
export function materialSpalten(): void {
    const t = tabelle(ELEMENT_TABELLE);
    for (const spalte of [1, 2]) {
        if (materialGleich()) t.hide_column(spalte);
        else t.show_column(spalte);
    }
}

export function knotenSpalten(): string {
    const e = current_unit_length;
    return `["No", "y&#772; [${e}]", "z&#772; [${e}]"]`;
}

export function elementSpalten(): string {
    return `["El No", "E [${current_unit_stress.replace('/', '/<wbr>')}]", "&nu;", "${msg('Dicke')} t [${current_unit_length}]", "nod1", "nod2"]`;
}

/** Überschriften an die eingestellte Einheit (und Sprache) anpassen. */
export function spaltenAktualisieren(): void {
    tabelle(KNOTEN_TABELLE).columns_languageChanged(knotenSpalten());
    tabelle(ELEMENT_TABELLE).columns_languageChanged(elementSpalten());
    // Tooltips und Undo/Redo-Texte der Tabellen in der aktuellen Sprache (wie d2beam-gui)
    for (const id of [KNOTEN_TABELLE, ELEMENT_TABELLE]) tabelle(id).lf_languageChanged('');
    for (const el of document.querySelectorAll('.unit_stress')) el.textContent = current_unit_stress;
}

//----------------------------------------------------------------------------------------------------------------------
// Lesen für die Berechnung

/**
 * Zahl aus einer Tabellenzelle lesen. Ungültige Eingaben werden markiert und als 0 gewertet;
 * leere Zellen zählen als 0.
 */
function leseZelle(id: string, zeile: number, spalte: number, fehler: { n: number }): number {
    const input = zelle(id, zeile, spalte);
    const wert = Number(input.value.replace(/,/g, '.'));
    const ungueltig = input.validity.badInput || !Number.isFinite(wert);
    input.style.backgroundColor = ungueltig ? 'salmon' : '';
    if (ungueltig) fehler.n++;
    return ungueltig ? 0 : wert;
}

export interface KnotenEingabe {
    y: number[];   // in cm
    z: number[];
}

export interface ElementEingabe {
    E: number[];       // in kN/cm² (bei gleichem Material leer)
    mue: number[];
    dicke: number[];   // in cm
    nod1: number[];    // Knotennummern ab 1
    nod2: number[];
}

/** Knoten- und Elementtabelle lesen und in cm bzw. kN/cm² umrechnen; fehler = Anzahl ungültiger Zellen. */
export function leseTabellen(): { knoten: KnotenEingabe; elemente: ElementEingabe; fehler: number } {
    const fehler = { n: 0 };
    const knoten: KnotenEingabe = { y: [], z: [] };
    for (let i = 1; i <= anzahlKnoten(); i++) {
        knoten.y.push(leseZelle(KNOTEN_TABELLE, i, 1, fehler) / unit_length_factor);
        knoten.z.push(leseZelle(KNOTEN_TABELLE, i, 2, fehler) / unit_length_factor);
    }
    const gleich = materialGleich();
    const elemente: ElementEingabe = { E: [], mue: [], dicke: [], nod1: [], nod2: [] };
    for (let i = 1; i <= anzahlElemente(); i++) {
        if (!gleich) {
            elemente.E.push(leseZelle(ELEMENT_TABELLE, i, 1, fehler) / unit_stress_factor);
            elemente.mue.push(leseZelle(ELEMENT_TABELLE, i, 2, fehler));
        }
        elemente.dicke.push(leseZelle(ELEMENT_TABELLE, i, 3, fehler) / unit_length_factor);
        elemente.nod1.push(Math.round(leseZelle(ELEMENT_TABELLE, i, 4, fehler)));
        elemente.nod2.push(Math.round(leseZelle(ELEMENT_TABELLE, i, 5, fehler)));
    }
    return { knoten, elemente, fehler: fehler.n };
}

/** Zahl aus einem Eingabefeld (leer = 0, Komma als Dezimaltrenner erlaubt). */
export function leseFeld(id: string): number {
    const wert = Number(byId<HTMLInputElement>(id).value.replace(/,/g, '.'));
    return Number.isFinite(wert) ? wert : 0;
}

//----------------------------------------------------------------------------------------------------------------------
// Rohwerte (Text) lesen und schreiben – Dateien, Autosave, Einheitenwechsel

function leseRoh(id: string): string[][] {
    const t = mytable(id);
    const zeilen: string[][] = [];
    for (let i = 1; i < t.rows.length; i++) {
        const z: string[] = [];
        for (let j = 1; j < t.rows[i].cells.length; j++) z.push(zelle(id, i, j).value);
        zeilen.push(z);
    }
    return zeilen;
}

function setzeRoh(id: string, zeilen: (string | number | null)[][]): void {
    const t = mytable(id);
    for (let i = 0; i < zeilen.length && i + 1 < t.rows.length; i++) {
        for (let j = 0; j < zeilen[i].length && j + 1 < t.rows[i + 1].cells.length; j++) {
            const w = zeilen[i][j];
            const input = zelle(id, i + 1, j + 1);
            input.value = w === null || w === undefined ? '' : String(w);
            input.style.backgroundColor = '';
        }
    }
    // neue Eingabe: altes Undo/Redo passt nicht mehr
    tabelle(id).clear_undo?.();
}

export function setzeKnoten(zeilen: (string | number | null)[][]): void {
    setzeAnzahlKnoten(zeilen.length);
    setzeRoh(KNOTEN_TABELLE, zeilen);
}

export function setzeElemente(zeilen: (string | number | null)[][]): void {
    setzeAnzahlElemente(zeilen.length);
    setzeRoh(ELEMENT_TABELLE, zeilen);
    materialSpalten();
}

/**
 * Werte nach einem Wechsel der Längeneinheit umrechnen (Koordinaten, Dicken, E-Moduln,
 * Bezugswerte, fyRd). Faktoren: neue Einheit / alte Einheit.
 */
export function einheitenUmrechnen(fLaenge: number, fSpannung: number): void {
    const umrechnen = (text: string, f: number) => {
        const w = Number(text.replace(/,/g, '.'));
        return text.trim() === '' || !Number.isFinite(w) ? text : zahlText(w * f);
    };
    setzeRoh(KNOTEN_TABELLE, leseRoh(KNOTEN_TABELLE).map(z => z.map(w => umrechnen(w, fLaenge))));
    setzeRoh(ELEMENT_TABELLE, leseRoh(ELEMENT_TABELLE).map(z => [
        umrechnen(z[0], fSpannung), z[1], umrechnen(z[2], fLaenge), z[3], z[4],
    ]));
    for (const id of ['EMod_ref', 'fyRd']) {
        const input = byId<HTMLInputElement>(id);
        input.value = umrechnen(input.value, fSpannung);
    }
}

/** Startbeispiel in der eingestellten Einheit. */
export function setzeBeispiel(): void {
    const lf = unit_length_factor, sf = unit_stress_factor;
    setzeKnoten(START_Y.map((y, i) => [zahlText(y * lf), zahlText(START_Z[i] * lf)]));
    setzeElemente(START_INZIDENZEN.map(([a, b]) => [zahlText(21000 * sf), '0.3', zahlText(1.5 * lf), a, b]));
    for (const id of SCHNITTGROESSEN) byId<HTMLInputElement>(id).value = '';
    byId<HTMLInputElement>('Vz').value = '500';
    byId<HTMLInputElement>('My').value = '600';
    byId<HTMLInputElement>('EMod_ref').value = zahlText(21000 * sf);
    byId<HTMLInputElement>('mue_ref').value = '0.3';
    byId<HTMLInputElement>('fyRd').value = zahlText(23.5 * sf);
    byId<HTMLInputElement>('material_equal').checked = false;
    byId<HTMLTextAreaElement>('freetext').value = '';
    materialSpalten();
}

/** Neue, leere Eingabe (Zeilenzahl bleibt, Bezugswerte bleiben). */
export function leereEingabe(): void {
    for (const id of [KNOTEN_TABELLE, ELEMENT_TABELLE]) tabelle(id).setAttribute('clear', String(Date.now()));
    for (const id of SCHNITTGROESSEN) byId<HTMLInputElement>(id).value = '';
    byId<HTMLTextAreaElement>('freetext').value = '';
}

/** true, wenn Tabellen, Schnittgrößen und freier Text leer sind (dann gibt es nichts zu verlieren). */
export function eingabeLeer(): boolean {
    const werte = [
        ...leseRoh(KNOTEN_TABELLE).flat(), ...leseRoh(ELEMENT_TABELLE).flat(),
        ...SCHNITTGROESSEN.map(id => byId<HTMLInputElement>(id).value),
        byId<HTMLTextAreaElement>('freetext').value,
    ];
    return werte.every(w => w.trim() === '');
}

//----------------------------------------------------------------------------------------------------------------------
// Datei- und Sicherungsformat (kompatibel zu den bisherigen duennqs-Dateien)

interface EingabeDaten {
    unit_length?: string;
    nnodes: number;
    nelem: number;
    Vy?: string; Vz?: string; Nx?: string; Mxp?: string; Mxs?: string; Momega?: string; My?: string; Mz?: string;
    fyRd?: string;
    EMod_ref?: string;
    mue_ref?: string;
    material_equal?: boolean;
    freetext?: string;
    node: (string | number | null)[][];
    elem: (string | number | null)[][];
}

export function eingabeAlsJSON(): string {
    const feld = (id: string) => byId<HTMLInputElement>(id).value;
    const daten: EingabeDaten = {
        unit_length: current_unit_length,
        nnodes: anzahlKnoten(),
        nelem: anzahlElemente(),
        Vy: feld('Vy'), Vz: feld('Vz'), Nx: feld('Nx'), Mxp: feld('Mxp'), Mxs: feld('Mxs'),
        Momega: feld('Momega'), My: feld('My'), Mz: feld('Mz'),
        fyRd: feld('fyRd'),
        EMod_ref: feld('EMod_ref'),
        mue_ref: feld('mue_ref'),
        material_equal: materialGleich(),
        freetext: byId<HTMLTextAreaElement>('freetext').value,
        node: leseRoh(KNOTEN_TABELLE),
        elem: leseRoh(ELEMENT_TABELLE),
    };
    return JSON.stringify(daten);
}

/** Eingabe aus einer Datei bzw. Sicherung übernehmen; false, wenn der Inhalt nicht passt. */
export function eingabeEinlesen(text: string): boolean {
    let daten: EingabeDaten;
    try {
        daten = JSON.parse(text) as EingabeDaten;
    } catch {
        return false;
    }
    if (!Array.isArray(daten.node) || !Array.isArray(daten.elem) || daten.node.length === 0 || daten.elem.length === 0) {
        return false;
    }

    // Einheit der Datei übernehmen (ältere Dateien ohne Angabe: cm)
    set_current_unit_length(daten.unit_length ?? 'cm');

    const feld = (id: string, wert: string | undefined) => {
        byId<HTMLInputElement>(id).value = wert ?? '';
    };
    feld('Vy', daten.Vy); feld('Vz', daten.Vz); feld('Nx', daten.Nx);
    feld('Mxp', daten.Mxp); feld('Mxs', daten.Mxs); feld('Momega', daten.Momega);
    feld('My', daten.My); feld('Mz', daten.Mz);
    if (daten.fyRd !== undefined) feld('fyRd', daten.fyRd);
    if (daten.EMod_ref !== undefined) feld('EMod_ref', daten.EMod_ref);
    if (daten.mue_ref !== undefined) feld('mue_ref', daten.mue_ref);
    byId<HTMLInputElement>('material_equal').checked = !!daten.material_equal;
    byId<HTMLTextAreaElement>('freetext').value = daten.freetext ?? '';

    setzeKnoten(daten.node);
    setzeElemente(daten.elem);
    spaltenAktualisieren();
    berechnungErforderlich();
    return true;
}
