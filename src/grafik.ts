import Two from 'two.js';
import type { Path } from 'two.js/src/path';
import { saveAs } from 'file-saver';
import { msg } from '@lit/localize';
import { byId } from './state';
import { CTrans } from './trans';
import { truss, node, Gesamt_ys, Gesamt_zs, yM, zM, phi0, ymin, ymax, zmin, zmax } from './duennQ';
import { current_unit_length, unit_length_factor } from './einstellungen';
import { app } from './state';
import { myFormat } from './utility';

/*
 * 2D-Grafik des Querschnitts (wie quer_2): Elemente, Koordinatensysteme, Hauptachsen,
 * Schwerpunkt und Schubmittelpunkt. Koordinatenanzeige mit Fangkreuz für Maus, Stift und Finger;
 * Knoten, Schwerpunkt und Schubmittelpunkt fangen den Cursor und zeigen ihre Werte an.
 */

const SCHRIFT = {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    size: 15, alignment: 'left', baseline: 'baseline',
} as const;

const FANGWEITE = 20;   // Pixel, wie in der 3D-Ansicht und in d2beam-gui

const FARBE_SCHWERPUNKT = 'blue';
const FARBE_SCHUBMITTELPUNKT = 'red';

let two: Two | null = null;
let trans: CTrans | null = null;
let beschriftung = false;   // Knoten- und Elementnummern
// Referenz behalten, sonst kann der Garbage Collector den Beobachter entfernen
let groessenBeobachter: ResizeObserver | null = null;

/** Punkt, an dem der Cursor einrastet, mit Text für die Wertanzeige. */
interface Fangpunkt {
    px: number;
    pz: number;
    y: number;          // Weltkoordinaten ȳ, z̄ in cm
    z: number;
    html: string;       // Inhalt der Wertanzeige
    kreis: SVGElement | null;   // Schwerpunkt/Schubmittelpunkt werden beim Fangen orange
}

let fangpunkte: Fangpunkt[] = [];

// Fangkreuz (Finger/Stift), Ring um den gefangenen Punkt und Wertanzeige neben dem Cursor
let cursorH: SVGLineElement;
let cursorV: SVGLineElement;
let ring: SVGCircleElement;
let cursorSvg: SVGSVGElement;
let wertAnzeige: HTMLDivElement;

//----------------------------------------------------------------------------------------------------------------------

/** Zahl im Format der Ergebnistabellen (Dezimalkomma je nach Sprache), ohne „-0,00“. */
function zahl(wert: number, stellen = 2): string {
    const w = Number(wert.toFixed(stellen)) === 0 ? 0 : wert;
    return myFormat(w, stellen, stellen);
}

function laenge(wert_cm: number, stellen = 2): string {
    return zahl(wert_cm * unit_length_factor, stellen);
}

function getTwo(): Two {
    if (!two) {
        const svg = byId('dataviz_area') as unknown as SVGSVGElement;
        two = new Two({ domElement: svg, width: 100, height: 100 });
        initAbfrage(svg);
        byId('button_label_svg').addEventListener('click', () => {
            beschriftung = !beschriftung;
            zeichneQuerschnitt();
        });
        byId('button_copy_svg').addEventListener('click', () => void svgSpeichern());
        // bei geänderter Breite (Fenster, Drehen des Geräts) oder Höhe des Fensters neu zeichnen
        let letzteBreite = 0;
        groessenBeobachter = new ResizeObserver(() => {
            const b = byId('my-svg').clientWidth;
            if (b > 0 && b !== letzteBreite) {
                letzteBreite = b;
                zeichneQuerschnitt();
            }
        });
        groessenBeobachter.observe(byId('my-svg'));
        window.addEventListener('resize', () => {
            if (byId('my-svg').clientWidth > 0) zeichneQuerschnitt();
        });
    }
    return two;
}

//----------------------------------------------------------------------------------------------------------------------
// Koordinatenanzeige und Fangen – Maus, Stift und Finger

function initAbfrage(svg: SVGSVGElement): void {
    const container = byId('my-svg');
    const svgNS = 'http://www.w3.org/2000/svg';
    cursorSvg = document.createElementNS(svgNS, 'svg');
    cursorSvg.classList.add('grafik-cursor');
    cursorH = document.createElementNS(svgNS, 'line');
    cursorV = document.createElementNS(svgNS, 'line');
    ring = document.createElementNS(svgNS, 'circle');
    ring.setAttribute('r', '7');
    ring.classList.add('ring');
    cursorSvg.append(ring, cursorH, cursorV);
    container.appendChild(cursorSvg);

    wertAnzeige = document.createElement('div');
    wertAnzeige.className = 'grafik-wert';
    container.appendChild(wertAnzeige);
    abfrageAusblenden();

    const bewegt = (ev: PointerEvent) => {
        if (!trans) return;
        const rect = svg.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        // Finger: Cursor über dem Finger, damit man sieht, wo man ist (wie in 3D und d2beam-gui)
        if (ev.pointerType === 'touch') y -= Math.hypot(rect.width, rect.height) / 10;
        abfragen(x, y, ev.pointerType !== 'mouse');
    };
    svg.addEventListener('pointermove', bewegt);
    svg.addEventListener('pointerdown', bewegt);
    svg.addEventListener('pointerleave', ev => {
        if (ev.pointerType === 'mouse') abfrageAusblenden();
    });
}

function kreiseZuruecksetzen(): void {
    for (const p of fangpunkte) if (p.kreis) p.kreis.style.fill = '';
}

function abfrageAusblenden(): void {
    cursorSvg.style.display = 'none';
    wertAnzeige.style.display = 'none';
    kreiseZuruecksetzen();
}

/** Koordinaten an (x, y) anzeigen; liegt ein Fangpunkt innerhalb der Fangweite, dort einrasten. */
function abfragen(x: number, y: number, kreuz: boolean): void {
    if (!trans) return;

    let fang: Fangpunkt | null = null;
    let bestD = FANGWEITE;
    for (const p of fangpunkte) {
        const d = Math.hypot(p.px - x, p.pz - y);
        if (d <= bestD) {
            bestD = d;
            fang = p;
        }
    }
    if (fang) {
        x = fang.px;
        y = fang.pz;
    }

    const yw = fang ? fang.y : trans.yWorld(x);
    const zw = fang ? fang.z : trans.zWorld(y);
    byId('cursor_coordy').innerHTML = 'y&#772;: ' + laenge(yw, 1);
    byId('cursor_coordz').innerHTML = 'z&#772;: ' + laenge(zw, 1);

    // Fangkreuz nur bei Finger/Stift (die Maus hat ihren eigenen Zeiger), Ring bei jedem gefangenen Punkt
    cursorSvg.style.display = kreuz || fang ? 'block' : 'none';
    cursorSvg.classList.toggle('gefangen', !!fang);
    cursorSvg.classList.toggle('ohne_kreuz', !kreuz);
    cursorH.setAttribute('x1', String(x - FANGWEITE));
    cursorH.setAttribute('x2', String(x + FANGWEITE));
    cursorH.setAttribute('y1', String(y));
    cursorH.setAttribute('y2', String(y));
    cursorV.setAttribute('x1', String(x));
    cursorV.setAttribute('x2', String(x));
    cursorV.setAttribute('y1', String(y - FANGWEITE));
    cursorV.setAttribute('y2', String(y + FANGWEITE));
    ring.setAttribute('cx', String(x));
    ring.setAttribute('cy', String(y));
    ring.style.display = fang && !fang.kreis ? '' : 'none';

    kreiseZuruecksetzen();
    if (fang?.kreis) fang.kreis.style.fill = 'orange';

    if (fang) {
        wertAnzeige.innerHTML = fang.html;
        wertAnzeige.style.display = 'block';
        // rechts oben neben das Kreuz, am Rand nach innen klappen
        const w = byId('my-svg').clientWidth;
        const bw = wertAnzeige.offsetWidth, bh = wertAnzeige.offsetHeight;
        let lx = x + FANGWEITE + 6, ly = y - FANGWEITE - bh - 2;
        if (lx + bw > w) lx = x - FANGWEITE - 6 - bw;
        if (ly < 0) ly = y + FANGWEITE + 2;
        wertAnzeige.style.left = lx + 'px';
        wertAnzeige.style.top = ly + 'px';
    } else {
        wertAnzeige.style.display = 'none';
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Zeichnen

/**
 * Linie mit gefüllter Pfeilspitze am Ende.
 * Die Spitze ist wie der frühere SVG-Marker proportional zur Linienbreite (Länge 6·b, Breite 4·b).
 */
function pfeil(t: Two, x1: number, y1: number, x2: number, y2: number, farbe: string, breite: number): void {
    const linie = t.makeLine(x1, y1, x2, y2);
    linie.stroke = farbe;
    linie.linewidth = breite;

    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len === 0) return;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;   // Richtung
    const nx = -uy, ny = ux;                              // Normale
    const l2 = 3 * breite, b2 = 2 * breite;

    const spitze: Path = t.makePath(
        x2 + ux * l2, y2 + uy * l2,
        x2 - ux * l2 + nx * b2, y2 - uy * l2 + ny * b2,
        x2 - ux * l2 - nx * b2, y2 - uy * l2 - ny * b2,
    );
    spitze.fill = farbe;
    spitze.noStroke();
}

/** Querschnitt in die Two-Instanz zeichnen; liefert die Fangpunkte (ohne Bezug zu SVG-Elementen). */
function zeichne(t: Two, tr: CTrans, faktor: number, mitNummern: boolean) {
    const py = (v: number) => Math.round(tr.yPix(v));
    const pz = (v: number) => Math.round(tr.zPix(v));
    const text = (inhalt: string, x: number, y: number, farbe = 'black') =>
        t.makeText(inhalt, x, y, { ...SCHRIFT, size: SCHRIFT.size * faktor, fill: farbe });

    // Elemente
    for (const el of truss) {
        const punkte: number[] = [];
        for (let j = 0; j < 4; j++) punkte.push(py(el.pts_y[j]), pz(el.pts_z[j]));
        const poly = t.makePath(...punkte);
        poly.stroke = 'dimgrey';
        poly.fill = 'lightgrey';
        poly.linewidth = 1;
    }

    const sl = Math.min(ymax - ymin, zmax - zmin) / 3;
    const ys = py(Gesamt_ys);
    const zs = pz(Gesamt_zs);

    // Koordinatenkreuz im Ursprung
    pfeil(t, py(0), pz(0), py(sl / 2), pz(0), 'darkslategrey', 2);
    text('ȳ', py(sl / 2) + 5, pz(0) - 7, 'darkslategrey');
    pfeil(t, py(0), pz(0), py(0), pz(sl / 2), 'darkslategrey', 2);
    text('z̄', py(0) + 5, pz(sl / 2) - 6, 'darkslategrey');

    // y-z Koordinatensystem im Schwerpunkt
    pfeil(t, ys, zs, py(Gesamt_ys + sl / 2), zs, 'blue', 1.5);
    text('y', py(Gesamt_ys + sl / 2) + 5, zs - 5, 'blue');
    pfeil(t, ys, zs, ys, pz(Gesamt_zs + sl / 2), 'blue', 1.5);
    text('z', ys + 5, pz(Gesamt_zs + sl / 2) - 5, 'blue');

    // Hauptachsen
    const achse = (winkel: number) => {
        const si = Math.sin(winkel) * sl;
        const co = Math.cos(winkel) * sl;
        return { y1: py(Gesamt_ys - co), z1: pz(Gesamt_zs - si), y2: py(Gesamt_ys + co), z2: pz(Gesamt_zs + si) };
    };
    const a1 = achse(phi0);
    pfeil(t, a1.y1, a1.z1, a1.y2, a1.z2, 'black', 2);
    text(' 1', a1.y2 + 5, a1.z2 - 5);
    const a2 = achse(phi0 + Math.PI / 2);
    pfeil(t, a2.y1, a2.z1, a2.y2, a2.z2, 'black', 2);
    text(' 2', a2.y2 + 5, a2.z2 - 5);

    // Knoten- und Elementnummern
    if (mitNummern) {
        node.forEach((k, i) => text(String(i + 1), py(k.y) + 5, pz(k.z) - 10, 'darkslategrey'));
        truss.forEach((el, i) => {
            const a = node[el.nod[0]], b = node[el.nod[1]];
            text(String(i + 1), py((a.y + b.y) / 2) + 5, pz((a.z + b.z) / 2) - 10, 'darkblue');
        });
    }

    // Schwerpunkt und Schubmittelpunkt
    const sKreis = t.makeCircle(ys, zs, 5);
    sKreis.fill = FARBE_SCHWERPUNKT;
    sKreis.noStroke();
    const yMg = yM + Gesamt_ys, zMg = zM + Gesamt_zs;   // yM, zM sind auf den Schwerpunkt bezogen
    const mKreis = t.makeCircle(py(yMg), pz(zMg), 5);
    mKreis.fill = FARBE_SCHUBMITTELPUNKT;
    mKreis.noStroke();

    return { py, pz, sKreis, mKreis, yMg, zMg };
}

/** Fangpunkte: Knoten (doppelte zusammengefasst), Schwerpunkt und Schubmittelpunkt. */
function bestimmeFangpunkte(py: (v: number) => number, pz: (v: number) => number,
                            sKreis: SVGElement | null, mKreis: SVGElement | null,
                            yMg: number, zMg: number): Fangpunkt[] {
    const e = current_unit_length;
    const punkte: Fangpunkt[] = [];

    const nummern = new Map<string, number[]>();
    node.forEach((k, i) => {
        const key = `${k.y}|${k.z}`;
        nummern.set(key, [...(nummern.get(key) ?? []), i]);
    });
    for (const nr of nummern.values()) {
        const k = node[nr[0]];
        const titel = msg('Knoten', { id: 'knoten_nummer', desc: 'ein Knoten mit Nummer, z.B. Knoten 3' }) + ' ' + nr.map(i => i + 1).join(', ');
        punkte.push({
            px: py(k.y), pz: pz(k.z), y: k.y, z: k.z, kreis: null,
            html: `<b>${titel}</b><br>y&#772; = ${laenge(k.y)}&nbsp; z&#772; = ${laenge(k.z)} ${e}`
                + `<br>&omega; = ${zahl(k.omega * unit_length_factor ** 2)} ${e}²`,
        });
    }
    punkte.push({
        px: py(yMg), pz: pz(zMg), y: yMg, z: zMg, kreis: mKreis,
        html: `<b>${msg('Schubmittelpunkt')}</b><br>y<sub>M</sub> = ${laenge(yM)}&nbsp; z<sub>M</sub> = ${laenge(zM)} ${e}`
            + `<br>y&#772; = ${laenge(yMg)}&nbsp; z&#772; = ${laenge(zMg)} ${e}`,
    });
    // Schwerpunkt zuletzt: bei gleichem Abstand gewinnt er (doppelt symmetrische Querschnitte)
    punkte.push({
        px: py(Gesamt_ys), pz: pz(Gesamt_zs), y: Gesamt_ys, z: Gesamt_zs, kreis: sKreis,
        html: `<b>${msg('Schwerpunkt')}</b><br>y&#772;<sub>s</sub> = ${laenge(Gesamt_ys)}&nbsp; z&#772;<sub>s</sub> = ${laenge(Gesamt_zs)} ${e}`,
    });
    return punkte;
}

/**
 * Querschnitt in der Ansicht „System“ zeichnen. Die Grafik füllt die Breite und reicht bis zum
 * unteren Fensterrand. Vor der ersten erfolgreichen Berechnung bleibt sie leer.
 */
export function zeichneQuerschnitt(): void {
    const container = byId('my-svg');
    const breite = container.clientWidth;
    const hoehe = container.clientHeight;
    if (breite === 0 || hoehe === 0) return;   // Tab nicht sichtbar – beim Einblenden wird neu gezeichnet

    const t = getTwo();
    t.renderer.setSize(breite, hoehe);
    t.width = breite;
    t.height = hoehe;
    t.clear();
    fangpunkte = [];
    trans = null;

    if (app.gerechnet && truss.length > 0) {
        const tr = new CTrans(ymin, zmin, ymax, zmax, breite, hoehe);
        const z = zeichne(t, tr, 1, beschriftung);
        t.update();
        const elem = (o: unknown) => (o as { renderer?: { elem?: SVGElement } }).renderer?.elem ?? null;
        fangpunkte = bestimmeFangpunkte(z.py, z.pz, elem(z.sKreis), elem(z.mKreis), z.yMg, z.zMg);
        trans = tr;
    } else {
        t.update();
    }
    abfrageAusblenden();
}

/** Querschnitt als eigenständiges SVG (für die pdf-Ausgabe), mit Nummern und vergrößerter Schrift. */
export function querschnittSvg(breite: number, hoehe: number, faktor: number): string {
    const t = new Two({ type: Two.Types.svg, width: breite, height: hoehe });
    const tr = new CTrans(ymin, zmin, ymax, zmax, breite, hoehe);
    zeichne(t, tr, faktor, true);
    t.update();
    const svg = t.renderer.domElement as SVGSVGElement;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return svg.outerHTML;
}

/** Aktuelle Grafik als SVG-Datei speichern (Button „Save“). */
async function svgSpeichern(): Promise<void> {
    if (!two) return;
    const svg = (two.renderer.domElement as SVGSVGElement).cloneNode(true) as SVGSVGElement;
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const blob = new Blob([preface, svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });

    let filename = 'duennqs.svg';
    if (app.hasFSAccess && app.isMac) {
        filename = window.prompt(
            msg('Name der Datei (wird im Download-Ordner gespeichert):'),
            filename) ?? filename;
    }
    try {
        saveAs(blob, filename);
    } catch (error) {
        alert((error as Error).message);
    }
}
