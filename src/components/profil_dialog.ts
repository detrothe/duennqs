/*
 * Dialog „neue Eingabe“: Querschnittsform wählen (I-Profil, Rechteck-Hohlprofil, U-Profil,
 * Kreis-Hohlprofil oder allgemeine Eingabe wie bisher) und die Abmessungen eingeben.
 * Gestaltung wie der Willkommensdialog von d2beam-gui: Karte, Kacheln mit Linien-Icons, die gewählte
 * Kachel in der Akzentfarbe; darunter Skizze mit Maßlinien und die Felder paarweise in Gruppen.
 * Natives <dialog>, Escape und × = Abbrechen. Styles in styles/main.css (.pd-…).
 */

import { msg } from '@lit/localize';
import { current_unit_length, unit_length_factor } from '../einstellungen';
import { zahlText } from '../eingabe';
import { OHNE_EINHEIT, PROFIL_FELDER, profilFehler, type ProfilArt } from '../profile';

type Form = ProfilArt | 'allgemein';

export type NeueEingabe =
    | { art: 'allgemein' }
    | { art: ProfilArt; werte: Record<string, number>; werteCm: Record<string, number> };   // werte in der Längeneinheit

const SCHLUESSEL = 'DUENNQS_profil_dialog';   // zuletzt gewählte Form und Abmessungen (in cm)

/** Startwerte in cm. */
const STANDARD: Record<ProfilArt, Record<string, number>> = {
    I: { bo: 20, to: 1.5, bu: 20, tu: 1.5, h: 40, ts: 1 },
    RHP: { h: 30, b: 20, t: 1, r: 0, nr: 4 },
    U: { h: 30, b: 10, tf: 1.2, ts: 0.8 },
    KHP: { d: 30, t: 1, n: 24 },
};

interface Gemerkt { art: Form; werte: Record<ProfilArt, Record<string, number>> }

function gemerkt(): Gemerkt {
    const g: Gemerkt = { art: 'I', werte: structuredClone(STANDARD) };
    try {
        const s = JSON.parse(window.localStorage.getItem(SCHLUESSEL) ?? 'null') as Partial<Gemerkt> | null;
        if (s?.art) g.art = s.art;
        for (const art of Object.keys(STANDARD) as ProfilArt[]) Object.assign(g.werte[art], s?.werte?.[art] ?? {});
    } catch { /* nichts gemerkt oder localStorage nicht verfügbar */ }
    return g;
}

function merken(g: Gemerkt): void {
    try {
        window.localStorage.setItem(SCHLUESSEL, JSON.stringify(g));
    } catch { /* localStorage nicht verfügbar */ }
}

//----------------------------------------------------------------------------------------------------------------------
// Beschriftung

const sub = (a: string, b: string) => `${a}<sub>${b}</sub>`;

/** Linien-Icons der Kacheln (24×24, Strich in der Akzentfarbe). */
const ICON: Record<Form, string> = {
    I: '<path d="M5 4h14M12 4v16M5 20h14"/>',
    RHP: '<rect x="5" y="4" width="14" height="16" rx="1"/>',
    U: '<path d="M18 4H7v16h11"/>',
    KHP: '<circle cx="12" cy="12" r="8"/>',
    allgemein: '<path d="M3 7h18M7 7l2 11h7l-1-11"/><circle cx="3" cy="7" r="1.3"/><circle cx="21" cy="7" r="1.3"/>'
        + '<circle cx="9" cy="18" r="1.3"/><circle cx="16" cy="18" r="1.3"/>',
};

function formen(): { art: Form; name: string }[] {
    return [
        { art: 'I', name: msg('I-Profil') },
        { art: 'RHP', name: msg('Rechteck-Hohlprofil') },
        { art: 'U', name: msg('U-Profil') },
        { art: 'KHP', name: msg('Kreis-Hohlprofil') },
        { art: 'allgemein', name: msg('Allgemeine Eingabe') },
    ];
}

/** Symbol und Bedeutung je Feld (Bedeutung als Tooltip und für Screenreader). */
function feldText(art: ProfilArt, k: string): [string, string] {
    const texte: Record<ProfilArt, Record<string, [string, string]>> = {
        I: {
            bo: [sub('b', 'o'), msg('Flanschbreite oben')],
            to: [sub('t', 'o'), msg('Flanschdicke oben')],
            bu: [sub('b', 'u'), msg('Flanschbreite unten')],
            tu: [sub('t', 'u'), msg('Flanschdicke unten')],
            h: ['h', msg('Steghöhe (Abstand der Flanschmittellinien)')],
            ts: [sub('t', 's'), msg('Stegdicke')],
        },
        RHP: {
            b: ['b', msg('Breite')],
            h: ['h', msg('Höhe')],
            t: ['t', msg('Wandstärke')],
            r: ['r', msg('Radius der Ecken (Mittellinie), 0 = ohne Rundung')],
            nr: ['n', msg('Teilung je Bogen (Anzahl Elemente)')],
        },
        U: {
            h: ['h', msg('Höhe (Abstand der Flanschmittellinien)')],
            b: ['b', msg('Breite (bis Stegmittellinie)')],
            tf: [sub('t', 'f'), msg('Flanschdicke (beide Flansche)')],
            ts: [sub('t', 's'), msg('Stegdicke')],
        },
        KHP: {
            d: ['d', msg('Durchmesser (Mittellinie)')],
            t: ['t', msg('Wandstärke')],
            n: ['n', msg('Teilung (Anzahl Elemente, mindestens 3)')],
        },
    };
    return texte[art][k];
}

/** Felder paarweise in Gruppen: Überschrift, Feldschlüssel, Hinweis darunter. */
function gruppen(art: ProfilArt): { titel: string; felder: string[]; hinweis?: string }[] {
    switch (art) {
        case 'I': return [
            { titel: msg('Flansch oben'), felder: ['bo', 'to'] },
            { titel: msg('Flansch unten'), felder: ['bu', 'tu'] },
            { titel: msg('Steg'), felder: ['h', 'ts'], hinweis: msg('h = Abstand der Flanschmittellinien') },
        ];
        case 'RHP': return [
            { titel: msg('Abmessungen'), felder: ['h', 'b'] },
            { titel: msg('Wand'), felder: ['t'] },
            { titel: msg('Runde Ecken'), felder: ['r', 'nr'], hinweis: msg('r = Radius der Mittellinie (0 = ohne Rundung), n = Elemente je Bogen (1 bis 90)') },
        ];
        case 'U': return [
            { titel: msg('Abmessungen'), felder: ['h', 'b'], hinweis: msg('h = Abstand der Flanschmittellinien, b bis zur Stegmittellinie') },
            { titel: msg('Dicken'), felder: ['tf', 'ts'], hinweis: msg('Die Flanschdicke gilt für beide Flansche.') },
        ];
        case 'KHP': return [
            { titel: msg('Rohr'), felder: ['d', 't'], hinweis: msg('d = Durchmesser der Mittellinie') },
            { titel: msg('Teilung'), felder: ['n'], hinweis: msg('Anzahl der Elemente auf dem Umfang (3 bis 360)') },
        ];
    }
}

function fehlertext(art: ProfilArt): string {
    switch (art) {
        case 'KHP': return msg('Bitte alle Abmessungen als positive Zahlen eingeben (Teilung: ganze Zahl von 3 bis 360).');
        case 'RHP': return msg('Bitte h, b und t als positive Zahlen eingeben. Der Radius r geht von 0 bis zur Hälfte der kleineren Seite, die Teilung n des Bogens ist eine ganze Zahl von 1 bis 90.');
        default: return msg('Bitte alle Abmessungen als positive Zahlen eingeben.');
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Skizzen (Systemlinien mit Knoten und Maßlinien, Ursprung mit ȳ nach links und z̄ nach unten), viewBox 240 × 232

const txt = (x: number, y: number, s: string, klasse = 'pd-mt', anker = 'middle') => {
    const t = s.replace(/<sub>(.*?)<\/sub>/g, '<tspan font-size="13" dy="4">$1</tspan>');
    return `<text class="${klasse}" x="${x}" y="${y}" text-anchor="${anker}">${t}</text>`;
};

const knoten = (punkte: number[][]) => punkte.map(([x, y]) => `<circle class="pd-knoten" cx="${x}" cy="${y}" r="4"/>`).join('');

/** Maßlinie mit Schrägstrichen an den Enden. */
const mass = (d: string) => `<path class="pd-mass" d="${d}" marker-start="url(#pd-strich)" marker-end="url(#pd-strich)"/>`;
const hilfslinie = (d: string) => `<path class="pd-mass" d="${d}"/>`;

function achsen(x: number, y: number): string {
    return `<line class="pd-achse" x1="${x}" y1="${y}" x2="${x - 36}" y2="${y}" marker-end="url(#pd-pfeil)"/>
        <line class="pd-achse" x1="${x}" y1="${y}" x2="${x}" y2="${y + 38}" marker-end="url(#pd-pfeil)"/>
        <circle class="pd-ursprung" cx="${x}" cy="${y}" r="4"/>
        ${txt(x - 40, y - 6, 'y&#772;', 'pd-at')} ${txt(x + 10, y + 42, 'z&#772;', 'pd-at')}`;
}

function skizze(art: Form, rund = false): string {
    let inhalt = '';
    switch (art) {
        case 'I':
            inhalt = `<path class="pd-linie" d="M50 50H190M120 50V180M65 180H175"/>
                ${knoten([[50, 50], [120, 50], [190, 50], [65, 180], [120, 180], [175, 180]])}
                ${mass('M50 22H190')} ${hilfslinie('M50 16V42M190 16V42')} ${txt(110, 16, sub('b', 'o'))}
                ${mass('M65 208H175')} ${hilfslinie('M65 188V214M175 188V214')} ${txt(120, 228, sub('b', 'u'))}
                ${mass('M25 50V180')} ${hilfslinie('M18 50H42M18 180H57')} ${txt(16, 120, 'h', 'pd-mt', 'end')}
                ${txt(140, 72, sub('t', 'o'), 'pd-mt', 'start')} ${txt(140, 172, sub('t', 'u'), 'pd-mt', 'start')}
                ${txt(128, 120, sub('t', 's'), 'pd-mt', 'start')} ${achsen(190, 50)}`;
            break;
        case 'RHP':
            inhalt = rund
                ? `<path class="pd-linie" d="M84 50H156A24 24 0 0 1 180 74V161A24 24 0 0 1 156 185H84A24 24 0 0 1 60 161V74A24 24 0 0 1 84 50Z"/>
                ${knoten([[84, 50], [156, 50], [173, 57], [180, 74], [180, 161], [173, 178], [156, 185], [84, 185], [67, 178], [60, 161], [60, 74], [67, 57]])}
                <path class="pd-mass" d="M84 161L68.5 176.5" marker-end="url(#pd-strich)"/> ${txt(90, 160, 'r', 'pd-mt', 'start')}`
                : `<path class="pd-linie" d="M60 50H180V185H60Z"/>
                ${knoten([[60, 50], [180, 50], [180, 185], [60, 185]])}`;
            inhalt += `
                ${mass('M60 22H180')} ${hilfslinie('M60 16V42M180 16V42')} ${txt(110, 16, 'b')}
                ${mass('M30 50V185')} ${hilfslinie('M23 50H52M23 185H52')} ${txt(21, 122, 'h', 'pd-mt', 'end')}
                ${txt(72, 122, 't', 'pd-mt', 'start')} ${achsen(180, 50)}`;
            break;
        case 'U':
            inhalt = `<path class="pd-linie" d="M180 50H70V185H180"/>
                ${knoten([[180, 50], [70, 50], [70, 185], [180, 185]])}
                ${mass('M70 22H180')} ${hilfslinie('M70 16V42M180 16V42')} ${txt(115, 16, 'b')}
                ${mass('M38 50V185')} ${hilfslinie('M31 50H62M31 185H62')} ${txt(29, 122, 'h', 'pd-mt', 'end')}
                ${txt(115, 72, sub('t', 'f'))} ${txt(115, 177, sub('t', 'f'))}
                ${txt(80, 122, sub('t', 's'), 'pd-mt', 'start')} ${achsen(180, 50)}`;
            break;
        case 'KHP': {
            const n = 16, r = 72, cx = 120, cy = 110;
            const ecken: number[][] = [];
            for (let i = 0; i < n; i++) {
                const phi = 2 * Math.PI * i / n;
                ecken.push([+(cx - r * Math.cos(phi)).toFixed(1), +(cy + r * Math.sin(phi)).toFixed(1)]);
            }
            inhalt = `<polygon class="pd-linie" points="${ecken.map(p => p.join(',')).join(' ')}"/> ${knoten(ecken)}
                ${mass(`M${cx - r} 210H${cx + r}`)} ${hilfslinie(`M${cx - r} ${cy + 8}V216M${cx + r} ${cy + 8}V216`)}
                ${txt(cx, 228, 'd')} ${txt(cx + 22, cy - r + 26, 't', 'pd-mt', 'start')} ${achsen(cx, cy)}`;
            break;
        }
        case 'allgemein':
            inhalt = `<path class="pd-linie" d="M30 60H210M70 60L90 175H160L150 60"/>
                ${knoten([[30, 60], [70, 60], [150, 60], [210, 60], [90, 175], [160, 175]])}`;
            break;
    }
    return `<svg viewBox="0 0 240 232" aria-hidden="true">
        <defs>
            <marker id="pd-pfeil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="#c0392b"/></marker>
            <marker id="pd-strich" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                <path d="M2 8L8 2" class="pd-strich"/></marker>
        </defs>${inhalt}</svg>`;
}

//----------------------------------------------------------------------------------------------------------------------

/** Dialog anzeigen; null bei Abbrechen. */
export function profilDialog(vorschlag: { art: ProfilArt; werte: Record<string, number> } | null = null): Promise<NeueEingabe | null> {
    const g = gemerkt();
    // Maße des aktuellen Querschnitts (aus der Projektdatei bzw. Sicherung, in cm) haben Vorrang vor den gemerkten
    if (vorschlag) {
        g.art = vorschlag.art;
        Object.assign(g.werte[vorschlag.art], vorschlag.werte);
    }
    let gewaehlt: Form = g.art;

    const dialog = document.createElement('dialog');
    dialog.classList.add('pd');
    dialog.setAttribute('aria-labelledby', 'pd-titel');

    const kacheln = formen().map(f => `<button type="button" class="pd-kachel" data-art="${f.art}">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[f.art]}</svg>
            <span>${f.name}</span></button>`).join('');
    dialog.innerHTML = `
        <section class="pd-karte">
            <button type="button" class="pd-schliessen" title="${msg('Abbrechen')}" aria-label="${msg('Abbrechen')}">×</button>
            <div>
                <h2 id="pd-titel">${msg('Neue Eingabe')}</h2>
                <p class="pd-unterzeile">${msg('Welche Querschnittsform? Knoten und Elemente werden daraus berechnet.')}</p>
            </div>
            <div class="pd-kacheln" role="group" aria-label="${msg('Querschnittsform')}">${kacheln}</div>
            <div class="pd-inhalt">
                <div class="pd-skizze"></div>
                <div class="pd-gruppen"></div>
            </div>
            <p class="pd-hinweis"></p>
            <p class="pd-fehler" hidden></p>
            <div class="pd-fuss">
                <button type="button" class="pd-knopf" value="abbrechen">${msg('Abbrechen')}</button>
                <button type="button" class="pd-knopf pd-primaer" value="ok">${msg('Übernehmen')}</button>
            </div>
        </section>`;

    const q = <T extends Element>(sel: string) => dialog.querySelector(sel) as T;
    const eingaben = () => dialog.querySelectorAll<HTMLInputElement>('.pd-gruppen input');

    /** Eingabefelder lesen (Komma als Dezimaltrenner erlaubt), Längen in der eingestellten Einheit. */
    const leseWerte = (a: ProfilArt): Record<string, number> => {
        const w: Record<string, number> = {};
        for (const input of eingaben()) {
            const text = input.value.trim().replace(/,/g, '.');
            w[input.name] = text === '' ? NaN : Number(text);
        }
        for (const k of PROFIL_FELDER[a]) w[k] ??= NaN;
        return w;
    };

    /** Eingaben der angezeigten Form merken (auch beim Wechsel der Form, damit nichts verloren geht). */
    const formMerken = (a: Form) => {
        if (a === 'allgemein') return;
        const w = leseWerte(a);
        const fehler = profilFehler(a, w);
        for (const k of PROFIL_FELDER[a]) {
            if (Number.isFinite(w[k]) && !fehler.includes(k)) g.werte[a][k] = OHNE_EINHEIT.includes(k) ? w[k] : w[k] / unit_length_factor;
        }
    };

    const zeigeForm = () => {
        const a = gewaehlt;
        for (const k of dialog.querySelectorAll<HTMLButtonElement>('.pd-kachel')) {
            const an = k.dataset.art === a;
            k.classList.toggle('pd-gewaehlt', an);
            k.setAttribute('aria-pressed', String(an));
        }
        q<HTMLElement>('.pd-skizze').innerHTML = skizze(a, a === 'RHP' && g.werte.RHP.r > 0);
        q<HTMLElement>('.pd-fehler').hidden = true;
        const box = q<HTMLElement>('.pd-gruppen');
        const hinweis = q<HTMLElement>('.pd-hinweis');
        if (a === 'allgemein') {
            box.innerHTML = `<p class="pd-text">${msg('Du trägst die Knoten und Elemente selbst in die Tabellen ein. Sie werden vorher geleert.')}</p>`;
            hinweis.textContent = '';
            return;
        }
        box.innerHTML = gruppen(a).map(gr => `<div class="pd-gruppe">
                <div class="pd-gruppentitel">${gr.titel}</div>
                <div class="pd-felder">${gr.felder.map(k => {
                    const [symbol, text] = feldText(a, k);
                    const ohne = OHNE_EINHEIT.includes(k);
                    const wert = ohne ? g.werte[a][k] : g.werte[a][k] * unit_length_factor;
                    return `<label class="pd-feld" title="${text}"><b>${symbol}</b>
                        <input name="${k}" type="text" inputmode="${ohne ? 'numeric' : 'decimal'}" value="${zahlText(wert)}" aria-label="${text}">
                        <span>${ohne ? '' : current_unit_length}</span></label>`;
                }).join('')}</div>
                ${gr.hinweis ? `<div class="pd-gruppenhinweis">${gr.hinweis}</div>` : ''}
            </div>`).join('');
        hinweis.textContent = a === 'KHP'
            ? msg('Abmessungen bezogen auf die Profilmittellinien. Koordinatenursprung im Kreismittelpunkt, Knoten und Elemente werden berechnet und in die Tabellen eingetragen.')
            : msg('Abmessungen bezogen auf die Profilmittellinien. Koordinatenursprung rechts oben, Knoten und Elemente werden berechnet und in die Tabellen eingetragen.');
        // Rechteck: Skizze mit runden Ecken, sobald ein Radius > 0 eingegeben ist
        const radius = dialog.querySelector<HTMLInputElement>('.pd-gruppen input[name="r"]');
        radius?.addEventListener('input', () => {
            const r = Number(radius.value.trim().replace(/,/g, '.'));
            q<HTMLElement>('.pd-skizze').innerHTML = skizze('RHP', Number.isFinite(r) && r > 0);
        });
    };

    zeigeForm();
    for (const k of dialog.querySelectorAll<HTMLButtonElement>('.pd-kachel')) {
        k.addEventListener('click', () => {
            formMerken(gewaehlt);
            gewaehlt = k.dataset.art as Form;
            zeigeForm();
        });
    }

    return new Promise(resolve => {
        let ergebnis: NeueEingabe | null = null;

        const ok = () => {
            const a = gewaehlt;
            if (a === 'allgemein') {
                ergebnis = { art: 'allgemein' };
            } else {
                const w = leseWerte(a);
                const fehler = profilFehler(a, w);
                for (const input of eingaben()) {
                    input.closest('.pd-feld')?.classList.toggle('pd-ungueltig', fehler.includes(input.name));
                }
                const meldung = q<HTMLElement>('.pd-fehler');
                meldung.textContent = fehlertext(a);
                meldung.hidden = fehler.length === 0;
                if (fehler.length > 0) return;
                formMerken(a);
                ergebnis = { art: a, werte: w, werteCm: { ...g.werte[a] } };
            }
            g.art = a;
            merken(g);
            dialog.close();
        };

        q<HTMLButtonElement>('button[value="ok"]').addEventListener('click', ok);
        q<HTMLButtonElement>('button[value="abbrechen"]').addEventListener('click', () => dialog.close());
        q<HTMLButtonElement>('.pd-schliessen').addEventListener('click', () => dialog.close());
        dialog.addEventListener('keydown', ev => {
            if (ev.key === 'Enter' && (ev.target as HTMLElement).tagName === 'INPUT') {
                ev.preventDefault();
                ok();
            }
        });
        // jedes Schließen landet hier, auch Escape (dann bleibt ergebnis null = Abbrechen)
        dialog.addEventListener('close', () => {
            dialog.remove();
            resolve(ergebnis);
        }, { once: true });

        document.body.appendChild(dialog);
        dialog.showModal();
        q<HTMLElement>('.pd-gewaehlt')?.focus();
    });
}
