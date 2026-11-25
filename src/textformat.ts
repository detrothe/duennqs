/*
 * Eingabe als einfacher Text, z.B. von einer KI aus einer Zeichnung erzeugt oder aus einer Tabellenkalkulation
 * kopiert. Das Format ist bewusst schlicht, damit eine KI es aus der Beschreibung im Prompt zuverlässig
 * erzeugen kann (Beschreibung auch in der Kurzdokumentation, Abschnitt „Eingabe als Text und mit KI“):
 *
 *   einheit mm          # mm | cm | m (Längen; E und fyRd in N/mm², kN/cm², MN/m²)
 *   y_rechts            # horizontale Koordinaten nach rechts positiv → die App setzt ȳ = −Wert
 *   E 210000            # Bezugswerte E, nu, fyRd
 *   nu 0.3
 *   My 120              # Schnittgrößen N, Vy, Vz, My, Mz, Mxp, Mxs, Mw (kN, kNm, kNm²)
 *   text HEB 300        # freier Text (mehrere Zeilen möglich)
 *   knoten
 *   1  -150  0          # [nr] y z
 *   …
 *   elemente
 *   1  1 2  19          # [nr] nod1 nod2 t [E nu]
 *
 * Schlüsselwörter deutsch oder englisch (unit, y_right, nodes, elements), Groß-/Kleinschreibung egal.
 * Trennzeichen: Leerzeichen, Tabulator, ';' oder '|'; '=' und ':' werden ignoriert. Komma als Dezimaltrenner
 * erlaubt. Kommentare mit '#' oder '//'. Zeilen mit ``` (Codeblock aus einer KI-Antwort) werden übersprungen.
 *
 * Eine vollständige .duennqs-Datei (JSON) wird ebenfalls angenommen.
 */

import { msg, str } from '@lit/localize';
import { getLocale } from './localization';
import { EINHEITEN, current_unit_length } from './einstellungen';
import { byId } from './state';
import { eingabeAlsJSON, zahlText, type EingabeDaten } from './eingabe';

/** Schnittgrößen: Schlüsselwort im Text (klein geschrieben) → Feld im Tab Eingabe. */
const LASTEN: Record<string, string> = {
    n: 'Nx', nx: 'Nx', vy: 'Vy', vz: 'Vz', my: 'My', mz: 'Mz',
    mxp: 'Mxp', mxs: 'Mxs', mw: 'Momega', momega: 'Momega', 'mω': 'Momega',
};
const LASTEN_REIHENFOLGE: [string, string][] = [
    ['N', 'Nx'], ['Vy', 'Vy'], ['Vz', 'Vz'], ['My', 'My'], ['Mz', 'Mz'], ['Mxp', 'Mxp'], ['Mxs', 'Mxs'], ['Mw', 'Momega'],
];
const BEZUG: Record<string, 'EMod_ref' | 'mue_ref' | 'fyRd'> = {
    e: 'EMod_ref', emod: 'EMod_ref', e_ref: 'EMod_ref',
    nu: 'mue_ref', 'ν': 'mue_ref', mue: 'mue_ref', mu: 'mue_ref',
    fyrd: 'fyRd', fy: 'fyRd', fy_rd: 'fyRd',
};
const KNOTEN_WORT = ['knoten', 'nodes', 'node'];
const ELEMENT_WORT = ['elemente', 'element', 'elements'];
const EINHEIT_WORT = ['einheit', 'unit'];
const Y_RECHTS_WORT = ['y_rechts', 'y-rechts', 'y_right', 'y-right'];
const TEXT_WORT = ['text', 'titel', 'title'];

/** Schlüsselwörter für Ausgabe und Prompt: deutsch nur in der deutschen Oberfläche. */
function worte() {
    return getLocale() === 'de'
        ? { einheit: 'einheit', y_rechts: 'y_rechts', knoten: 'knoten', elemente: 'elemente' }
        : { einheit: 'unit', y_rechts: 'y_right', knoten: 'nodes', elemente: 'elements' };
}

export type TextErgebnis =
    | { ok: true; daten: EingabeDaten; knoten: number; elemente: number }
    | { ok: false; fehler: string[] };

function zahl(token: string): number {
    const t = token.replace(/,/g, '.');
    return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t) ? Number(t) : NaN;
}

/**
 * Text lesen und in die Daten einer .duennqs-Datei umsetzen. Nicht angegebene Bezugswerte (E, ν, fyRd)
 * werden aus der aktuellen Eingabe übernommen und in die Einheit des Textes umgerechnet.
 */
export function leseText(text: string): TextErgebnis {
    // ganze .duennqs-Datei eingefügt?
    const roh = text.trim();
    if (roh.startsWith('{')) {
        try {
            const d = JSON.parse(roh) as EingabeDaten;
            if (Array.isArray(d.node) && Array.isArray(d.elem) && d.node.length > 0 && d.elem.length > 0) {
                return { ok: true, daten: d, knoten: d.node.length, elemente: d.elem.length };
            }
        } catch { /* weiter unten als Fehler melden */ }
        return { ok: false, fehler: [msg('Der Text beginnt mit „{“, ist aber keine gültige duennqs-Datei.')] };
    }

    const fehler: string[] = [];
    let einheit = current_unit_length;
    let einheitGesetzt = false;
    let yRechts = false;
    let abschnitt: '' | 'knoten' | 'elemente' = '';
    const bezug: Partial<Record<'EMod_ref' | 'mue_ref' | 'fyRd', number>> = {};
    const lasten: Record<string, number> = {};
    const freitext: string[] = [];
    const knoten: { y: number; z: number }[] = [];
    const elemente: { a: number; b: number; t: number; E?: number; nu?: number; zeile: number }[] = [];

    const zeilen = text.split(/\r?\n/);
    zeilen.forEach((original, index) => {
        const nr = index + 1;
        if (/^\s*```/.test(original)) return;
        const zeile = original.replace(/(#|\/\/).*$/, '').trim();
        if (zeile === '') return;
        const tokens = zeile.replace(/[=:]/g, ' ').split(/[\s;|]+/).filter(t => t !== '');
        if (tokens.length === 0) return;
        const wort = tokens[0].toLowerCase();

        if (TEXT_WORT.includes(wort)) {
            freitext.push(zeile.replace(/^\S+\s*[:=]?\s*/, ''));
            return;
        }
        if (KNOTEN_WORT.includes(wort)) { abschnitt = 'knoten'; return; }
        if (ELEMENT_WORT.includes(wort)) { abschnitt = 'elemente'; return; }
        if (Y_RECHTS_WORT.includes(wort)) { yRechts = true; return; }
        if (EINHEIT_WORT.includes(wort)) {
            const e = (tokens[1] ?? '').toLowerCase();
            if (EINHEITEN[e]) {
                einheit = e;
                einheitGesetzt = true;
            } else {
                fehler.push(msg(str`Zeile ${nr}: Einheit muss mm, cm oder m sein.`));
            }
            return;
        }
        if (wort in BEZUG || wort in LASTEN) {
            const w = zahl(tokens[1] ?? '');
            if (tokens.length !== 2 || !Number.isFinite(w)) {
                fehler.push(msg(str`Zeile ${nr}: Nach „${tokens[0]}“ wird genau eine Zahl erwartet.`));
            } else if (wort in BEZUG) {
                bezug[BEZUG[wort]] = w;
            } else {
                lasten[LASTEN[wort]] = w;
            }
            return;
        }

        const werte = tokens.map(zahl);
        if (werte.some(w => !Number.isFinite(w))) {
            fehler.push(Number.isFinite(werte[0])
                ? msg(str`Zeile ${nr}: Die Zeile enthält etwas, das keine Zahl ist.`)
                : msg(str`Zeile ${nr}: Unbekanntes Schlüsselwort „${tokens[0]}“.`));
            return;
        }
        if (abschnitt === 'knoten') {
            if (werte.length !== 2 && werte.length !== 3) {
                fehler.push(msg(str`Zeile ${nr}: Ein Knoten braucht y und z (davor optional die Nummer).`));
                return;
            }
            if (werte.length === 3 && werte[0] !== knoten.length + 1) {
                fehler.push(msg(str`Zeile ${nr}: Knotennummer ${werte[0]} erwartet ${knoten.length + 1} (fortlaufend ab 1).`));
                return;
            }
            const [y, z] = werte.slice(-2);
            knoten.push({ y, z });
        } else if (abschnitt === 'elemente') {
            if (werte.length < 3 || werte.length > 6) {
                fehler.push(msg(str`Zeile ${nr}: Ein Element braucht nod1, nod2 und t (davor optional die Nummer, dahinter optional E und ν).`));
                return;
            }
            const mitNummer = werte.length === 4 || werte.length === 6;
            if (mitNummer && werte[0] !== elemente.length + 1) {
                fehler.push(msg(str`Zeile ${nr}: Elementnummer ${werte[0]} erwartet ${elemente.length + 1} (fortlaufend ab 1).`));
                return;
            }
            const [a, b, t, E, nu] = mitNummer ? werte.slice(1) : werte;
            elemente.push({ a, b, t, E, nu, zeile: nr });
        } else {
            fehler.push(msg(str`Zeile ${nr}: Zahlen vor „knoten“ bzw. „elemente“ – zu welchem Abschnitt gehören sie?`));
        }
    });

    if (knoten.length < 2) fehler.push(msg('Es werden mindestens 2 Knoten gebraucht.'));
    if (elemente.length < 1) fehler.push(msg('Es wird mindestens 1 Element gebraucht.'));
    for (const el of elemente) {
        for (const k of [el.a, el.b]) {
            if (!Number.isInteger(k) || k < 1 || k > knoten.length) {
                fehler.push(msg(str`Zeile ${el.zeile}: Knoten ${k} gibt es nicht (1 bis ${knoten.length}).`));
            }
        }
        if (el.a === el.b) fehler.push(msg(str`Zeile ${el.zeile}: Anfangs- und Endknoten sind gleich.`));
        if (!(el.t > 0)) fehler.push(msg(str`Zeile ${el.zeile}: Die Dicke t muss größer 0 sein.`));
        if (el.E !== undefined && !(el.E > 0)) fehler.push(msg(str`Zeile ${el.zeile}: Der E-Modul muss größer 0 sein.`));
    }
    if (bezug.EMod_ref !== undefined && !(bezug.EMod_ref > 0)) fehler.push(msg('Der E-Modul (Bezugswert) muss größer 0 sein'));
    if (fehler.length > 0) return { ok: false, fehler };

    // nicht angegebene Bezugswerte aus der aktuellen Eingabe, umgerechnet in die Einheit des Textes
    const fSpannung = EINHEITEN[einheit].spannung / EINHEITEN[current_unit_length].spannung;
    const aktuell = (id: string, f: number) => {
        const w = Number(byId<HTMLInputElement>(id).value.replace(/,/g, '.'));
        return byId<HTMLInputElement>(id).value.trim() === '' || !Number.isFinite(w) ? undefined : w * f;
    };
    const E = bezug.EMod_ref ?? aktuell('EMod_ref', fSpannung) ?? 21000 * EINHEITEN[einheit].spannung;
    const nu = bezug.mue_ref ?? aktuell('mue_ref', 1) ?? 0.3;
    const fyRd = bezug.fyRd ?? aktuell('fyRd', fSpannung);
    const eigenesMaterial = elemente.some(el => el.E !== undefined || el.nu !== undefined);
    const z = (w: number | undefined) => (w === undefined ? '' : zahlText(w));
    const y = (w: number) => zahlText(yRechts && w !== 0 ? -w : w);

    const daten: EingabeDaten = {
        unit_length: einheitGesetzt ? einheit : current_unit_length,
        nnodes: knoten.length,
        nelem: elemente.length,
        EMod_ref: zahlText(E),
        mue_ref: zahlText(nu),
        fyRd: z(fyRd),
        material_equal: !eigenesMaterial,
        freetext: freitext.join('\n'),
        node: knoten.map(k => [y(k.y), zahlText(k.z)]),
        elem: elemente.map(el => [zahlText(el.E ?? E), zahlText(el.nu ?? nu), zahlText(el.t), el.a, el.b]),
        profil: null,
    };
    for (const [, id] of LASTEN_REIHENFOLGE) (daten as unknown as Record<string, string>)[id] = z(lasten[id]);
    return { ok: true, daten, knoten: knoten.length, elemente: elemente.length };
}

//----------------------------------------------------------------------------------------------------------------------

/** Aktuelle Eingabe im Textformat (zum Nachbearbeiten, als Vorlage oder um sie einer KI zu geben). */
export function eingabeAlsText(): string {
    const d = JSON.parse(eingabeAlsJSON()) as EingabeDaten;
    const w = worte();
    const s = (v: unknown) => String(v ?? '').trim();
    const zeilen: string[] = [`${w.einheit} ${d.unit_length ?? 'cm'}`];
    if (s(d.EMod_ref)) zeilen.push(`E ${s(d.EMod_ref)}`);
    if (s(d.mue_ref)) zeilen.push(`nu ${s(d.mue_ref)}`);
    if (s(d.fyRd)) zeilen.push(`fyRd ${s(d.fyRd)}`);
    for (const [wort, id] of LASTEN_REIHENFOLGE) {
        const v = s((d as unknown as Record<string, unknown>)[id]);
        if (v !== '' && Number(v.replace(/,/g, '.')) !== 0) zeilen.push(`${wort} ${v}`);
    }
    for (const t of s(d.freetext).split(/\r?\n/)) if (t.trim() !== '') zeilen.push(`text ${t}`);
    zeilen.push('', w.knoten);
    d.node.forEach((k, i) => zeilen.push(`${i + 1}  ${s(k[0])}  ${s(k[1])}`));
    zeilen.push('', w.elemente);
    d.elem.forEach((e, i) => {
        const material = d.material_equal ? '' : `  ${s(e[0])}  ${s(e[1])}`;
        zeilen.push(`${i + 1}  ${s(e[3])}  ${s(e[4])}  ${s(e[2])}${material}`);
    });
    return zeilen.join('\n') + '\n';
}

/** Beispiel im Textformat: HEB 300 vereinfacht (Mittellinienmodell). */
export function beispielText(): string {
    const w = worte();
    return `# HEB 300: h = 300, b = 300, tf = 19, tw = 11 (mm) → ${msg('Abstand der Flanschmittellinien')} 300 − 19 = 281
${w.einheit} mm
${w.y_rechts}
E 210000
nu 0.3
fyRd 235
My 120
text HEB 300

${w.knoten}
1  -150    0
2     0    0
3   150    0
4  -150  281
5     0  281
6   150  281

${w.elemente}
1  1  2  19
2  2  3  19
3  2  5  11
4  4  5  19
5  5  6  19
`;
}

/** Prompt für eine KI (Claude, ChatGPT, …): Aufgabe, Modellannahmen, Format und Beispiel. */
export function kiPrompt(): string {
    const w = worte();
    return `${msg('Ich hänge die Zeichnung eines dünnwandigen Querschnitts an. Erzeuge daraus eine Eingabe für die Web-App duennQs (Querschnittswerte und Spannungen dünnwandiger Querschnitte, Mittellinienmodell) im unten beschriebenen Textformat.')}

${msg('Modell:')}
- ${msg('Der Querschnitt besteht aus geraden Elementen zwischen Knoten auf der Profilmittellinie. Jedes Element hat eine konstante Dicke t.')}
- ${msg('Maße, die sich auf Außenkanten beziehen, auf die Mittellinien umrechnen (jeweils die halbe Blechdicke abziehen oder addieren). Sag dazu, welche Maße du als Außenmaß und welche als Achsmaß gelesen hast.')}
- ${msg('Ausrundungen, Walzradien und Schweißnähte weglassen. Gekrümmte Teile (Rohre, runde Ecken) durch mehrere gerade Elemente annähern, z. B. 24 Elemente für einen Kreis.')}
- ${msg('Alle Elemente müssen zusammenhängen. Wo Bleche sich treffen oder abzweigen, liegt ein gemeinsamer Knoten; ein Blech, an das ein anderes anschließt, wird dort in zwei Elemente geteilt.')}
- ${msg(str`Koordinaten: z nach unten positiv. Die horizontale Koordinate wie in der Zeichnung nach rechts positiv angeben und die Zeile „${w.y_rechts}“ schreiben (die y-Achse der App zeigt nach links, sie spiegelt dann selbst). Der Ursprung ist beliebig.`)}
- ${msg('Material und Schnittgrößen nur aus der Zeichnung oder meinen Angaben übernehmen, nicht aus dem Beispiel. Ohne Materialangabe Stahl annehmen (E = 210000 N/mm², nu = 0.3) und das als Annahme nennen.')}

${msg('Format (eine Angabe je Zeile, Zahlen mit Dezimalpunkt und durch Leerzeichen getrennt, Kommentare mit #):')}
${w.einheit} mm          # ${msg('mm, cm oder m für alle Längen; E und fyRd dann in N/mm², kN/cm² bzw. MN/m²')}
${w.y_rechts}
E 210000         # ${msg('E-Modul')}
nu 0.3           # ${msg('Querdehnzahl')}
fyRd 235         # ${msg('optional: Bemessungswert der Streckgrenze')}
My 120           # ${msg('optional, je Zeile eine Schnittgröße: N, Vy, Vz (kN), My, Mz, Mxp, Mxs (kNm), Mw (kNm²)')}
text ...         # ${msg('optional: Bezeichnung für die PDF-Ausgabe')}
${w.knoten}
nr  y  z         # ${msg('fortlaufend ab 1')}
${w.elemente}
nr  nod1  nod2  t   # ${msg('Anfangsknoten, Endknoten, Dicke; nur bei abweichendem Material dahinter noch E und nu')}

${msg('Beispiel:')}
${beispielText()}
${msg('Antwort:')}
1. ${msg('Liste kurz die abgelesenen Maße und alle Annahmen auf, besonders was unklar oder unleserlich war.')}
2. ${msg('Gib dann die Eingabe als einen einzigen Codeblock aus, ohne weiteren Text darin.')}
${msg('Nicht bemaßte Lagen und Längen aus dem Maßstab der Zeichnung abschätzen (bekannte Maße als Bezug nehmen) und in der Liste der Annahmen ausdrücklich als „geschätzt“ kennzeichnen. Nur nachfragen, wenn sich ein Maß gar nicht ermitteln lässt.')}
`;
}
