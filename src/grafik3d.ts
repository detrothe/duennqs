import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import GUI from 'lil-gui';
import { saveAs } from 'file-saver';
import { byId, myScreen } from './state';
import { truss, node, Gesamt_ys, Gesamt_zs, yM, zM, u0, bezugswerte } from './duennQ';
import { berechnung_erfolgreich } from './globals';
import { current_unit_length, current_unit_stress, unit_length_factor, unit_stress_factor } from './einstellungen';
import { myFormat } from './utility';
import { app } from './index';

/*
 * 3D-Ansicht der Ergebnisse (wie quer_2, nachgeladen als eigener Chunk)
 *
 * Koordinaten
 * -----------
 * Statik: x Stablängsachse, ȳ nach links, z̄ nach unten – wie in der 2D-Grafik.
 * three.js: X = -(ȳ - ȳs),  Y = -(z̄ - z̄s),  Z = Wert · Überhöhung
 * Der Querschnitt liegt in der XY-Ebene, die Werte werden in Z (= Stabachse) aufgetragen.
 *
 * Dargestellt wird jeweils eine Größe: Normalspannung σ (über die Mittellinie oder über die Dicke),
 * Schubspannung τ und Vergleichsspannung σv (an der rechten und linken Seite jedes Elements),
 * Wölbordinate ω oder Verwölbung u (über die Mittellinie).
 *
 * Werteabfrage
 * ------------
 * Wie in d2beam-gui: Der Cursor ist ein Kreuz, dessen halbe Linienlänge der Fangweite entspricht.
 * Liegt ein Punkt der dargestellten Kurve innerhalb der Fangweite, rastet der Cursor dort ein und
 * der Wert steht neben dem Cursor. Bei Fingereingabe sitzt der Cursor versetzt über dem Finger.
 */

type Anzeige = 'keine' | 'sigma' | 'tau' | 'sigmaV' | 'omega' | 'u';

const FARBE_ZUG = 0x2020d0;       // σ > 0
const FARBE_DRUCK = 0xd02020;     // σ < 0 (rot = Druck wie bisher)
const FARBE_TAU = 0x009696;
const FARBE_SIGMAV = 0x8040b0;
const FARBE_POSITIV = 0x109050;   // ω, u
const FARBE_NEGATIV = 0xc07010;
const FARBE_FYRD = 0xc00000;
const FARBE_QUERSCHNITT = 0x8a8a9a;
const TEILUNG = 20;               // Stützstellen je Element für die Kurven
const KREISTEILUNG = 10;          // Segmente im Umfang von Pfeilschaft und Pfeilspitze
const MAX_BILDPIXEL = 16_000_000; // Obergrenze für Canvas-Flächen in Safari/iOS (ca. 16,7 Mio. Pixel)

const optionen = {
    anzeige: 'sigma' as Anzeige,
    beschriftung: false,
    sigmaDicke: true,     // σ über die Dicke (Eckwerte) statt über die Mittellinie
    seiten: true,
    pfeile: true,
    skalierungPfeile: 1,
    fyrd: false,
    seitenLR: false,      // rechte/linke Seite und Richtung der Elemente kennzeichnen
    achsen: true,
    skalierung: 1,
    fangweite: 20,        // Pixel
    bildFaktor: 2,        // Bildexport: Vielfaches der Bildschirmgröße (CSS-Pixel)
    bildWeiss: true,      // Bildexport mit weißem statt grauem Hintergrund
};

/*
 * Fingerbedienung wie in d2beam-gui: Ein Button links unten schaltet um, was ein Finger tut –
 * verschieben (Pan) oder Werte am Fangkreuz anzeigen („123“). Zwei Finger drehen und zoomen immer.
 */
let panModus = false;

const ICON_PAN = `<svg width="1rem" height="1rem" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
<path fill="currentColor" d="M16 8l-3-3v2h-4v-4h2l-3-3-3 3h2v4h-4v-2l-3 3 3 3v-2h4v4h-2l3 3 3-3h-2v-4h4v2z"></path></svg>`;
const ICON_WERTE = `<svg width="1rem" height="1rem" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
<text x="0" y="12" fill="currentColor" style="font: bold 0.6rem sans-serif">123</text></svg>`;

let renderer: THREE.WebGLRenderer;
let labelRenderer: CSS2DRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let host: HTMLElement;
let groessenBeobachter: ResizeObserver | null = null;
let bildButtonName: ((name: string) => void) | null = null;

// aktuelles Modell
let modell: THREE.Group | null = null;
let diagramm: THREE.Group | null = null;
let seitenGruppe: THREE.Group | null = null;
let pfeilGruppe: THREE.Group | null = null;
let achsenGruppe: THREE.Group | null = null;
let beschriftungGruppe: THREE.Group | null = null;

/** Punkt, an dem das Fangkreuz einrastet, mit Text für die Wertanzeige. */
interface Fangpunkt {
    pos: THREE.Vector3;
    html: string;
}

let fangpunkte: Fangpunkt[] = [];
let groesse = 1;          // charakteristische Abmessung des Querschnitts
let kameraGroesse = 0;    // Größe, für die die Kamera zuletzt eingestellt wurde
let kameraNachholen = false;

// Cursor (Fangkreuz) und Wertanzeige
let cursorSvg: SVGSVGElement;
let cursorH: SVGLineElement;
let cursorV: SVGLineElement;
let ring: SVGCircleElement;
let wertAnzeige: HTMLDivElement;
// springen: Kreuz rastet auf dem Punkt ein (Finger/Stift); bei der Maus bleibt es unter dem Zeiger
let letzterZeiger: { x: number; y: number; springen: boolean } | null = null;

//----------------------------------------------------------------------------------------------------------------------
// Texte und Zahlen

function de(): boolean {
    return app.browserLanguage === 'de';
}

function tx(deutsch: string, englisch: string): string {
    return de() ? deutsch : englisch;
}

/** Zahl im Format der Ergebnistabellen (Dezimalkomma je nach Sprache), ohne „-0,00“. */
function zahl(wert: number, stellen: number): string {
    const w = Number(wert.toFixed(stellen)) === 0 ? 0 : wert;
    return myFormat(w, stellen, stellen);
}

const spannung = (s: number) => zahl(s * unit_stress_factor, 3);
const laenge = (l: number) => zahl(l * unit_length_factor, 2);

function koordinaten(y: number, z: number): string {
    return `y&#772; = ${laenge(y)}&nbsp; z&#772; = ${laenge(z)} ${current_unit_length}`;
}

//----------------------------------------------------------------------------------------------------------------------
// Grundgerüst: Renderer, Kamera, Bedienfeld

function toV(y: number, z: number, h = 0): THREE.Vector3 {
    return new THREE.Vector3(-(y - Gesamt_ys), -(z - Gesamt_zs), h);
}

function render(): void {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function resize(): void {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w === 0 || h === 0) return;   // ausgeblendet (anderer Tab)
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (kameraNachholen) kameraZuruecksetzen();
    bildNameAktualisieren();
    render();
    if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);
}

/**
 * Kamera schräg von vorn auf den Querschnitt richten. Der Abstand wird so gewählt, dass das Modell
 * sowohl in der Höhe als auch in der Breite ins Bild passt (Smartphones im Hochformat).
 */
function kameraZuruecksetzen(): void {
    if (host.clientWidth === 0 || host.clientHeight === 0) {
        kameraNachholen = true;   // erst beim Einblenden möglich (Seitenverhältnis unbekannt)
        return;
    }
    kameraNachholen = false;
    kameraGroesse = groesse;

    const radius = groesse * 0.6;
    const fovV = THREE.MathUtils.degToRad(camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
    const d = radius / Math.sin(Math.min(fovV, fovH) / 2);
    camera.position.set(0.5, 0.32, 0.8).normalize().multiplyScalar(d);
    camera.near = groesse / 100;
    camera.far = groesse * 100;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
}

function initCursor(): void {
    const svgNS = 'http://www.w3.org/2000/svg';
    cursorSvg = document.createElementNS(svgNS, 'svg');
    cursorSvg.classList.add('view3d-cursor');
    cursorH = document.createElementNS(svgNS, 'line');
    cursorV = document.createElementNS(svgNS, 'line');
    ring = document.createElementNS(svgNS, 'circle');
    ring.setAttribute('r', '7');
    ring.classList.add('ring');
    cursorSvg.append(ring, cursorH, cursorV);
    host.appendChild(cursorSvg);

    wertAnzeige = document.createElement('div');
    wertAnzeige.className = 'view3d-wert';
    host.appendChild(wertAnzeige);

    cursorAusblenden();
}

function init(): void {
    host = byId('view3d-canvas');

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xdddddd);
    host.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'view3d-labels';
    host.appendChild(labelRenderer.domElement);

    initCursor();

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const licht = new THREE.DirectionalLight(0xffffff, 2.0);
    licht.position.set(1, 1.5, 2);
    scene.add(licht);

    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);

    controls = new OrbitControls(camera, renderer.domElement);
    // Ein Finger: Werte abfragen (keine Kamerabewegung), zwei Finger: drehen und zoomen
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    initPanButton();
    // OrbitControls setzt beim Start style.cursor = 'auto' – der Mauspfeil wird durch das Fangkreuz ersetzt
    renderer.domElement.style.cursor = 'none';
    controls.addEventListener('change', () => {
        render();
        if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);
    });

    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', zeigerBewegt);
    canvas.addEventListener('pointerdown', zeigerBewegt);
    canvas.addEventListener('pointerleave', ev => {
        if (ev.pointerType === 'mouse') cursorAusblenden();
    });

    // Referenz behalten: ein nicht referenzierter ResizeObserver kann vom Garbage Collector entfernt werden
    groessenBeobachter = new ResizeObserver(resize);
    groessenBeobachter.observe(host);

    initBedienfeld();
}

function initBedienfeld(): void {
    const neuAufbauen = () => {
        baueDiagramm();
        render();
    };
    const gui = new GUI({ container: byId('view3d-gui'), title: tx('Bedienfeld', 'Controls') });

    const auswahl: Record<string, Anzeige> = {};
    auswahl[tx('nur Querschnitt', 'cross section only')] = 'keine';
    auswahl[tx('Normalspannung σ', 'normal stress σ')] = 'sigma';
    auswahl[tx('Schubspannung τ', 'shear stress τ')] = 'tau';
    auswahl[tx('Vergleichsspannung σv', 'equivalent stress σv')] = 'sigmaV';
    auswahl[tx('Wölbordinate ω', 'warping ordinate ω')] = 'omega';
    auswahl[tx('Verwölbung u', 'warping displacement u')] = 'u';
    // Optionen, die nur zu bestimmten Darstellungen passen, werden nur dort gezeigt
    const nurBei: [ReturnType<GUI['add']>, () => boolean][] = [];
    const optionenZeigen = () => nurBei.forEach(([regler, passt]) => regler.show(passt()));
    const a = () => optionen.anzeige;

    gui.add(optionen, 'anzeige', auswahl).name(tx('Anzeige', 'Display')).onChange(() => {
        optionenZeigen();
        neuAufbauen();
    });
    // fyRd gehört zur Vergleichsspannung und steht direkt unter der Auswahl
    nurBei.push([gui.add(optionen, 'fyrd').name(tx('fyRd anzeigen', 'show fyRd')).onChange(neuAufbauen),
        () => a() === 'sigmaV']);

    gui.add(optionen, 'beschriftung').name(tx('Beschriftung', 'Labels')).onChange(sichtbarkeit);
    gui.add(optionen, 'skalierung', 0.1, 5, 0.1).name(tx('Skalierung', 'Scaling')).onChange(neuAufbauen);
    nurBei.push([gui.add(optionen, 'sigmaDicke').name(tx('σ über die Dicke', 'σ across thickness')).onChange(() => {
        optionenZeigen();
        neuAufbauen();
    }), () => a() === 'sigma' || a() === 'sigmaV']);
    // Seitenflächen gibt es bei σ nur über die Dicke (über der Mittellinie ist die Wand selbst das Diagramm)
    nurBei.push([gui.add(optionen, 'seiten').name(tx('Seiten anzeigen', 'Show sides')).onChange(sichtbarkeit),
        () => (a() === 'sigma' && optionen.sigmaDicke) || a() === 'tau' || a() === 'sigmaV']);
    nurBei.push([gui.add(optionen, 'pfeile').name(tx('Pfeile anzeigen', 'Show arrows')).onChange(sichtbarkeit),
        () => a() === 'sigma' || a() === 'tau']);
    nurBei.push([gui.add(optionen, 'skalierungPfeile', 0.2, 3, 0.1).name(tx('Skalierung Pfeile', 'Scale arrows')).onChange(neuAufbauen),
        () => a() === 'sigma' || a() === 'tau']);
    optionenZeigen();
    gui.add(optionen, 'seitenLR').name(tx('rechts/links anzeigen', 'show right/left')).onChange(neuAufbauen);
    gui.add(optionen, 'achsen').name(tx('Achsen anzeigen', 'Show axes')).onChange(sichtbarkeit);
    gui.add(optionen, 'fangweite', 5, 60, 1).name(tx('Fangweite [px]', 'Snap radius [px]')).onChange(() => {
        if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);
    });

    const bild = gui.addFolder(tx('Bild speichern', 'Save image'));
    bild.add(optionen, 'bildFaktor', { '1×': 1, '2×': 2, '3×': 3, '4×': 4, '6×': 6, '8×': 8 })
        .name(tx('Auflösung', 'Resolution')).onChange(bildNameAktualisieren);
    bild.add(optionen, 'bildWeiss').name(tx('weißer Hintergrund', 'white background'));
    const knopf = bild.add({ speichern: () => void bildExportieren() }, 'speichern');
    bildButtonName = name => knopf.name(name);
    bildNameAktualisieren();
    bild.close();

    gui.add({
        reset() {
            optionen.skalierung = 1;
            optionen.skalierungPfeile = 1;
            gui.controllersRecursive().forEach(c => c.updateDisplay());
            baueDiagramm();
            kameraZuruecksetzen();
            render();
        },
    }, 'reset').name(tx('Zurücksetzen', 'Reset'));

    gui.close();
}

//----------------------------------------------------------------------------------------------------------------------
// Geometrie-Hilfen

function dispose(obj: THREE.Object3D): void {
    obj.traverse(o => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
            o.geometry.dispose();
            const m = o.material as THREE.Material | THREE.Material[];
            (Array.isArray(m) ? m : [m]).forEach(x => x.dispose());
        }
        if (o instanceof CSS2DObject) o.element.remove();
    });
}

function label(text: string, pos: THREE.Vector3, klasse = 'label3d'): CSS2DObject {
    const div = document.createElement('div');
    div.className = klasse;
    div.textContent = text;
    const obj = new CSS2DObject(div);
    obj.position.copy(pos);
    return obj;
}

function linie(punkte: THREE.Vector3[], farbe: number, geschlossen = false): THREE.Line {
    const geo = new THREE.BufferGeometry().setFromPoints(punkte);
    const mat = new THREE.LineBasicMaterial({ color: farbe });
    return geschlossen ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
}

function flaechenMaterial(farbe: number, opacity: number): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
        color: farbe, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
    });
}

function flaeche(dreiecke: THREE.Vector3[], farbe: number, opacity: number): THREE.Mesh {
    return new THREE.Mesh(new THREE.BufferGeometry().setFromPoints(dreiecke), flaechenMaterial(farbe, opacity));
}

/** Punkt in der Querschnittsebene mit Wert w (Höhe = w · faktor). */
interface Punkt {
    y: number;
    z: number;
    w: number;
}

/**
 * „Wand“ über einem Linienzug: Fläche zwischen Querschnittsebene und Wertekurve, beim Vorzeichenwechsel
 * geteilt. Liefert die Dreiecke für positive und negative Werte getrennt.
 */
function wandDreiecke(p: Punkt[], faktor: number): { pos: THREE.Vector3[]; neg: THREE.Vector3[] } {
    const pos: THREE.Vector3[] = [], neg: THREE.Vector3[] = [];
    const ziel = (w: number) => (w >= 0 ? pos : neg);
    for (let i = 0; i + 1 < p.length; i++) {
        const a = p[i], b = p[i + 1];
        const a0 = toV(a.y, a.z), b0 = toV(b.y, b.z);
        const a1 = toV(a.y, a.z, a.w * faktor), b1 = toV(b.y, b.z, b.w * faktor);
        if (a.w * b.w >= 0) {
            ziel(a.w + b.w).push(a0, b0, b1, a0, b1, a1);
        } else {
            const t = a.w / (a.w - b.w);
            const c = toV(a.y + t * (b.y - a.y), a.z + t * (b.z - a.z));
            ziel(a.w).push(a0, c, a1);
            ziel(b.w).push(c, b0, b1);
        }
    }
    return { pos, neg };
}

/** Polygon auf die Seite vorzeichen·w ≥ 0 zuschneiden (Sutherland–Hodgman an der Nulllinie). */
function zuschneiden(poly: Punkt[], vorzeichen: 1 | -1): Punkt[] {
    const res: Punkt[] = [];
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const fa = vorzeichen * a.w;
        const fb = vorzeichen * b.w;
        if (fa >= 0) res.push(a);
        if ((fa > 0 && fb < 0) || (fa < 0 && fb > 0)) {
            const t = fa / (fa - fb);
            res.push({ y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z), w: 0 });
        }
    }
    return res;
}

/** Räumlicher Pfeil (Zylinderschaft + Kegelspitze) vom Ursprung in Richtung dir. */
function raumPfeil(dir: THREE.Vector3, l: number, farbe: number): THREE.Group {
    const spitzeL = l * 0.25;
    const schaftL = l - spitzeL;
    const material = new THREE.MeshStandardMaterial({ color: farbe });
    const schaft = new THREE.Mesh(new THREE.CylinderGeometry(l * 0.025, l * 0.025, schaftL, KREISTEILUNG), material);
    schaft.position.y = schaftL / 2;
    const spitze = new THREE.Mesh(new THREE.ConeGeometry(l * 0.08, spitzeL, KREISTEILUNG), material);
    spitze.position.y = schaftL + spitzeL / 2;
    const pfeil = new THREE.Group();
    pfeil.add(schaft, spitze);
    pfeil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return pfeil;
}

/**
 * Flacher Pfeil in der Querschnittsebene (etwas vor dem Querschnitt) mit Mitte bei (y, z)
 * in Richtung (ey, ez); liefert Dreiecke.
 */
function flachPfeil(y: number, z: number, ey: number, ez: number, l: number): THREE.Vector3[] {
    const vor = groesse * 0.002;
    const ny = -ez, nz = ey;              // Normale in der Ebene
    const b = l * 0.08, kb = l * 0.25, kl = l * 0.35;
    const p = (s: number, q: number) => toV(y + ey * s + ny * q, z + ez * s + nz * q, vor);
    const s0 = -l / 2, s1 = l / 2 - kl, s2 = l / 2;
    return [
        p(s0, -b), p(s1, -b), p(s1, b), p(s0, -b), p(s1, b), p(s0, b),   // Schaft
        p(s1, -kb), p(s2, 0), p(s1, kb),                                 // Spitze
    ];
}

//----------------------------------------------------------------------------------------------------------------------
// Werte entlang der Elemente

/** Quadratischer Verlauf durch die Werte am Anfang, in der Mitte und am Ende (xi von 0 bis sl). */
function quadratisch(w: number[], xi: number, sl: number): number {
    return ((sl ** 2 - 3 * sl * xi + 2 * xi ** 2) * w[0] + 4 * xi * (sl - xi) * w[1] + xi * (2 * xi - sl) * w[2]) / sl / sl;
}

/** Verwölbung u (kubisch, Werte am Anfang, Ende, 1/3 und 2/3), bezogen auf den Mittelwert u0. */
function verwoelbung(u: number[], xi: number, sl: number): number {
    const x2 = xi * xi, x3 = x2 * xi, sl2 = sl * sl, sl3 = sl2 * sl;
    const N0 = -(9 * x3 - 18 * sl * x2 + 11 * sl2 * xi - 2 * sl3) / (2 * sl3);
    const N1 = (9 * x3 - 9 * sl * x2 + 2 * sl2 * xi) / (2 * sl3);
    const N2 = (27 * x3 - 45 * sl * x2 + 18 * sl2 * xi) / (2 * sl3);
    const N3 = -(27 * x3 - 36 * sl * x2 + 9 * sl2 * xi) / (2 * sl3);
    return N0 * u[0] + N1 * u[1] + N2 * u[2] + N3 * u[3] - u0;
}

type Seite = 'R' | 'L';

/** Lage auf der rechten (Ecken 0→1) bzw. linken Seite (Ecken 3→2) des Elements bei t = xi/sl. */
function seitenPunkt(i: number, seite: Seite, t: number): { y: number; z: number } {
    const el = truss[i];
    const [a, b] = seite === 'R' ? [0, 1] : [3, 2];
    return {
        y: el.pts_y[a] + t * (el.pts_y[b] - el.pts_y[a]),
        z: el.pts_z[a] + t * (el.pts_z[b] - el.pts_z[a]),
    };
}

function mittelPunkt(i: number, t: number): { y: number; z: number } {
    const a = node[truss[i].nod[0]], b = node[truss[i].nod[1]];
    return { y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
}

/** Richtung des Elements (Anfangs- zum Endknoten). */
function richtung(i: number): { ey: number; ez: number } {
    const a = node[truss[i].nod[0]], b = node[truss[i].nod[1]];
    const l = Math.hypot(b.y - a.y, b.z - a.z) || 1;
    return { ey: (b.y - a.y) / l, ez: (b.z - a.z) / l };
}

function tauSeite(i: number, seite: Seite, xi: number): number {
    const el = truss[i];
    return quadratisch(seite === 'R' ? el.stress_R : el.stress_L, xi, el.sl);
}

function sigmaSeite(i: number, seite: Seite, t: number): number {
    const el = truss[i];
    if (optionen.sigmaDicke) {
        const [a, b] = seite === 'R' ? [0, 1] : [3, 2];
        return el.sigma_xe[a] + t * (el.sigma_xe[b] - el.sigma_xe[a]);
    }
    return el.sigma_x[0] + t * (el.sigma_x[2] - el.sigma_x[0]);
}

//----------------------------------------------------------------------------------------------------------------------
// Modell aufbauen

function baueQuerschnitt(): THREE.Group {
    const g = new THREE.Group();
    const dicke = groesse * 0.01;
    const material = new THREE.MeshStandardMaterial({ color: FARBE_QUERSCHNITT });
    const kanten = new THREE.LineBasicMaterial({ color: 0x555566 });
    for (const el of truss) {
        const shape = new THREE.Shape(el.pts_y.map((y, j) => {
            const v = toV(y, el.pts_z[j]);
            return new THREE.Vector2(v.x, v.y);
        }));
        const geo = new THREE.ExtrudeGeometry(shape, { depth: dicke, bevelEnabled: false });
        geo.translate(0, 0, -dicke);   // Scheibe hinter der Ebene x = 0
        g.add(new THREE.Mesh(geo, material));
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), kanten));
    }

    // Schwerpunkt und Schubmittelpunkt
    const kugel = new THREE.SphereGeometry(groesse * 0.008, 16, 8);
    const s = new THREE.Mesh(kugel, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
    s.position.copy(toV(Gesamt_ys, Gesamt_zs));
    const m = new THREE.Mesh(kugel, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    m.position.copy(toV(yM + Gesamt_ys, zM + Gesamt_zs));
    g.add(s, m);
    return g;
}

function baueAchsen(): THREE.Group {
    const g = new THREE.Group();
    const l = groesse * 0.2;
    const achsen: [THREE.Vector3, number, string][] = [
        [new THREE.Vector3(0, 0, 1), 0xdd2222, 'x'],
        [new THREE.Vector3(-1, 0, 0), 0x22aa44, 'y'],
        [new THREE.Vector3(0, -1, 0), 0x2222dd, 'z'],
    ];
    for (const [dir, farbe, name] of achsen) {
        g.add(raumPfeil(dir, l, farbe));
        g.add(label(name, dir.clone().multiplyScalar(l * 1.12), 'label3d achse'));
    }
    return g;
}

/** Senkrechte Pfeile (Schaft + Kegel) von der Querschnittsebene bis zur Wertekurve. */
function senkrechtePfeile(punkte: Punkt[], faktor: number, maxAbs: number, farbe: (w: number) => number): THREE.Group {
    const g = new THREE.Group();
    const kegel = new THREE.ConeGeometry(0.5, 1, KREISTEILUNG);
    kegel.translate(0, 0.5, 0);
    kegel.rotateX(Math.PI / 2);
    const materialien = new Map<number, [THREE.LineBasicMaterial, THREE.MeshStandardMaterial]>();
    for (const p of punkte) {
        const l = Math.abs(p.w) * faktor;
        if (l < 1e-9 * groesse) continue;
        const f = farbe(p.w);
        if (!materialien.has(f)) {
            materialien.set(f, [new THREE.LineBasicMaterial({ color: f }), new THREE.MeshStandardMaterial({ color: f })]);
        }
        const [linienMat, kegelMat] = materialien.get(f)!;
        const kopf = Math.min(l * 0.9, groesse * 0.04 * optionen.skalierungPfeile * Math.abs(p.w) / maxAbs);
        const r = Math.sign(p.w);
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            toV(p.y, p.z), toV(p.y, p.z, r * (l - kopf)),
        ]), linienMat));
        const spitze = new THREE.Mesh(kegel, kegelMat);
        spitze.position.copy(toV(p.y, p.z, r * (l - kopf)));
        spitze.scale.set(kopf * 0.5, kopf * 0.5, r * kopf);
        g.add(spitze);
    }
    return g;
}

/** Hilfsobjekt zum Sammeln von Beschriftungen ohne Doppelte an gleicher Stelle. */
function beschrifter(gruppe: THREE.Group) {
    // gleicher Text in geringem Abstand nur einmal (rechte und linke Seite dünner Wände liegen fast übereinander)
    const gesetzt: { text: string; pos: THREE.Vector3 }[] = [];
    const abstand = groesse / 40;
    return (text: string, pos: THREE.Vector3) => {
        if (gesetzt.some(g => g.text === text && g.pos.distanceTo(pos) < abstand)) return;
        gesetzt.push({ text, pos });
        gruppe.add(label(text, pos));
    };
}

/** Kennzeichnung der rechten und linken Seite und der Elementrichtung (Pfeil am Anfang). */
function baueSeitenLR(): THREE.Group {
    const g = new THREE.Group();
    const dreiecke: THREE.Vector3[] = [];
    truss.forEach((_, i) => {
        const { ey, ez } = richtung(i);
        const a = groesse * 0.025;
        const m = mittelPunkt(i, 0);
        dreiecke.push(...flachPfeil(m.y + ey * a * 1.2, m.z + ez * a * 1.2, ey, ez, 2 * a));
        for (const seite of ['R', 'L'] as const) {
            const p = seitenPunkt(i, seite, 0.3);
            const n = seite === 'R' ? 1 : -1;   // nach außen: rechts (ez, −ey), links (−ez, ey)
            g.add(label(seite, toV(p.y + n * ez * a, p.z - n * ey * a), 'label3d seite'));
        }
    });
    g.add(flaeche(dreiecke, 0x333333, 1));
    return g;
}

function baueDiagramm(): void {
    if (!modell) return;
    for (const g of [diagramm, beschriftungGruppe]) {
        if (g) {
            modell.remove(g);
            dispose(g);
        }
    }
    diagramm = new THREE.Group();
    seitenGruppe = new THREE.Group();
    pfeilGruppe = new THREE.Group();
    beschriftungGruppe = new THREE.Group();
    diagramm.add(seitenGruppe, pfeilGruppe);
    const beschrifte = beschrifter(beschriftungGruppe);

    fangpunkte = [];
    let einheit = '';
    let minmax = '';

    // Knoten, Schwerpunkt und Schubmittelpunkt fangen immer
    node.forEach((k, i) => fangpunkte.push({
        pos: toV(k.y, k.z),
        html: `<b>${tx('Knoten', 'Node')} ${i + 1}</b><br>${koordinaten(k.y, k.z)}`,
    }));
    fangpunkte.push({
        pos: toV(yM + Gesamt_ys, zM + Gesamt_zs),
        html: `<b>${tx('Schubmittelpunkt', 'Shear center')}</b><br>${koordinaten(yM + Gesamt_ys, zM + Gesamt_zs)}`,
    });
    fangpunkte.push({
        pos: toV(Gesamt_ys, Gesamt_zs),
        html: `<b>${tx('Schwerpunkt', 'Centroid')}</b><br>${koordinaten(Gesamt_ys, Gesamt_zs)}`,
    });

    const anzeige = optionen.anzeige;
    const hoehe = (maxAbs: number) => maxAbs > 1e-12 ? groesse * 0.25 / maxAbs * optionen.skalierung : 0;

    if (anzeige === 'keine') {
        node.forEach((k, i) => beschrifte(String(i + 1), toV(k.y, k.z)));
        truss.forEach((_, i) => {
            const m = mittelPunkt(i, 0.5);
            beschriftungGruppe!.add(label(String(i + 1), toV(m.y, m.z), 'label3d element'));
        });

    } else if (anzeige === 'sigma') {
        einheit = tx('Spannungen in ', 'Stresses in ') + current_unit_stress;
        const werte = truss.flatMap(el => optionen.sigmaDicke ? el.sigma_xe : [el.sigma_x[0], el.sigma_x[2]]);
        const maxAbs = Math.max(...werte.map(Math.abs));
        const f = hoehe(maxAbs);
        const farbe = (w: number) => (w >= 0 ? FARBE_ZUG : FARBE_DRUCK);
        const pfeilPunkte: Punkt[] = [];

        truss.forEach((el, i) => {
            const titel = `${tx('Element', 'Element')} ${i + 1}`;
            if (optionen.sigmaDicke) {
                // Spannungskörper über der Elementfläche (Eckwerte, linear)
                const poly: Punkt[] = el.pts_y.map((y, j) => ({ y, z: el.pts_z[j], w: el.sigma_xe[j] }));
                for (const vz of [1, -1] as const) {
                    const teil = zuschneiden(poly, vz);
                    if (teil.length < 3 || !teil.some(p => vz * p.w > 1e-12 * maxAbs)) continue;
                    const top = teil.map(p => toV(p.y, p.z, p.w * f));
                    const deck: THREE.Vector3[] = [];
                    for (let k = 1; k + 1 < top.length; k++) deck.push(top[0], top[k], top[k + 1]);
                    diagramm!.add(flaeche(deck, farbe(vz), 0.45));
                    diagramm!.add(linie(top, farbe(vz), true));
                    const seiten: THREE.Vector3[] = [];
                    for (let k = 0; k < teil.length; k++) {
                        const a = teil[k], b = teil[(k + 1) % teil.length];
                        seiten.push(toV(a.y, a.z), toV(b.y, b.z), top[(k + 1) % teil.length],
                            toV(a.y, a.z), top[(k + 1) % teil.length], top[k]);
                    }
                    seitenGruppe!.add(flaeche(seiten, farbe(vz), 0.2));
                }
                poly.forEach((p, j) => {
                    const pos = toV(p.y, p.z, p.w * f);
                    beschrifte(spannung(p.w), pos);
                    fangpunkte.push({
                        pos, html: `<b>σ = ${spannung(p.w)}</b> ${current_unit_stress}<br>${titel}, ${tx('Ecke', 'corner')} ${j + 1}<br>${koordinaten(p.y, p.z)}`,
                    });
                });
                for (const seite of ['R', 'L'] as const) {
                    for (let k = 1; k < TEILUNG; k++) {
                        const t = k / TEILUNG, p = seitenPunkt(i, seite, t), w = sigmaSeite(i, seite, t);
                        fangpunkte.push({
                            pos: toV(p.y, p.z, w * f),
                            html: `<b>σ = ${spannung(w)}</b> ${current_unit_stress}<br>${titel}, ${tx('Seite', 'side')} ${seite}<br>${koordinaten(p.y, p.z)}`,
                        });
                    }
                }
            } else {
                // Spannungen über der Mittellinie
                const punkte: Punkt[] = [];
                for (let k = 0; k <= TEILUNG; k++) {
                    const t = k / TEILUNG, m = mittelPunkt(i, t);
                    punkte.push({ ...m, w: el.sigma_x[0] + t * (el.sigma_x[2] - el.sigma_x[0]) });
                }
                const { pos, neg } = wandDreiecke(punkte, f);
                diagramm!.add(flaeche(pos, FARBE_ZUG, 0.45), flaeche(neg, FARBE_DRUCK, 0.45));
                diagramm!.add(linie(punkte.map(p => toV(p.y, p.z, p.w * f)), 0x333333));
                for (const p of [punkte[0], punkte[TEILUNG]]) beschrifte(spannung(p.w), toV(p.y, p.z, p.w * f));
                punkte.forEach(p => fangpunkte.push({
                    pos: toV(p.y, p.z, p.w * f),
                    html: `<b>σ = ${spannung(p.w)}</b> ${current_unit_stress}<br>${titel}<br>${koordinaten(p.y, p.z)}`,
                }));
            }
            for (const t of [0, 0.25, 0.5, 0.75, 1]) {
                const m = mittelPunkt(i, t);
                pfeilPunkte.push({ ...m, w: el.sigma_x[0] + t * (el.sigma_x[2] - el.sigma_x[0]) });
            }
        });
        pfeilGruppe.add(senkrechtePfeile(pfeilPunkte, f, maxAbs, farbe));
        minmax = `min/max σ : ${zahl(Math.min(...werte) * unit_stress_factor, 2)} / ${zahl(Math.max(...werte) * unit_stress_factor, 2)}`;

    } else if (anzeige === 'tau' || anzeige === 'sigmaV') {
        einheit = tx('Spannungen in ', 'Stresses in ') + current_unit_stress;
        const istTau = anzeige === 'tau';
        const farbe = istTau ? FARBE_TAU : FARBE_SIGMAV;
        const name = istTau ? 'τ' : 'σ<sub>v</sub>';
        const wert = (i: number, seite: Seite, t: number) => {
            const tau = tauSeite(i, seite, t * truss[i].sl);
            if (istTau) return tau;
            const s = sigmaSeite(i, seite, t);
            return Math.sqrt(s * s + 3 * tau * tau);
        };

        // Werte an allen Stützstellen (für Maximum und Zeichnung)
        const kurven = truss.map((_, i) => {
            const k: Record<Seite, Punkt[]> = { R: [], L: [] };
            for (const seite of ['R', 'L'] as const) {
                for (let j = 0; j <= TEILUNG; j++) {
                    const t = j / TEILUNG;
                    k[seite].push({ ...seitenPunkt(i, seite, t), w: wert(i, seite, t) });
                }
            }
            return k;
        });
        const alle = kurven.flatMap(k => [...k.R, ...k.L].map(p => p.w));
        const maxAbs = Math.max(...alle.map(Math.abs), !istTau && optionen.fyrd ? bezugswerte.fyrd : 0);
        const f = hoehe(maxAbs);
        const pfeile: THREE.Vector3[] = [];

        kurven.forEach((k, i) => {
            const el = truss[i];
            const titel = `${tx('Element', 'Element')} ${i + 1}`;
            const top = (p: Punkt) => toV(p.y, p.z, p.w * f);

            // Deckfläche zwischen rechter und linker Kurve
            const deck: THREE.Vector3[] = [];
            for (let j = 0; j < TEILUNG; j++) {
                const r0 = top(k.R[j]), r1 = top(k.R[j + 1]), l0 = top(k.L[j]), l1 = top(k.L[j + 1]);
                deck.push(l0, r0, r1, l0, r1, l1);
            }
            diagramm!.add(flaeche(deck, farbe, 0.6));

            for (const seite of ['R', 'L'] as const) {
                const kurve = k[seite];
                const { pos, neg } = wandDreiecke(kurve, f);
                seitenGruppe!.add(flaeche([...pos, ...neg], farbe, 0.15));
                diagramm!.add(linie([toV(kurve[0].y, kurve[0].z), ...kurve.map(top), toV(kurve[TEILUNG].y, kurve[TEILUNG].z)], 0x385d8a));
                kurve.forEach(p => fangpunkte.push({
                    pos: top(p),
                    html: `<b>${name} = ${spannung(p.w)}</b> ${current_unit_stress}<br>${titel}, ${tx('Seite', 'side')} ${seite}<br>${koordinaten(p.y, p.z)}`,
                }));
                // Beschriftung: Enden und betragsgrößter Wert
                beschrifte(spannung(kurve[0].w), top(kurve[0]));
                beschrifte(spannung(kurve[TEILUNG].w), top(kurve[TEILUNG]));
                const mx = kurve.reduce((a, b) => (Math.abs(b.w) > Math.abs(a.w) ? b : a));
                if (mx !== kurve[0] && mx !== kurve[TEILUNG]) beschrifte(spannung(mx.w), top(mx));

                // Richtung der Schubspannungen (Pfeile in der Ebene bei 1/4, 1/2, 3/4)
                if (istTau) {
                    const { ey, ez } = richtung(i);
                    for (const t of [0.25, 0.5, 0.75]) {
                        const tau = tauSeite(i, seite, t * el.sl);
                        if (Math.abs(tau) < 1e-12 * maxAbs) continue;
                        const p = seitenPunkt(i, seite, t);
                        const sg = Math.sign(tau);
                        pfeile.push(...flachPfeil(p.y, p.z, sg * ey, sg * ez, groesse * 0.03 * optionen.skalierungPfeile));
                    }
                }
            }

            // Streckgrenze als Ebene über dem Element
            if (!istTau && optionen.fyrd) {
                const h = bezugswerte.fyrd * f;
                const e = el.pts_y.map((y, j) => toV(y, el.pts_z[j], h));
                diagramm!.add(flaeche([e[0], e[1], e[2], e[0], e[2], e[3]], FARBE_FYRD, 0.35));
                if (i === 0) {
                    const l = label('f_yRd = ' + zahl(bezugswerte.fyrd * unit_stress_factor, 1), e[0], 'label3d fyrd');
                    beschriftungGruppe!.add(l);
                }
            }
        });
        if (pfeile.length > 0) pfeilGruppe.add(flaeche(pfeile, 0x004040, 1));

        if (istTau) {
            minmax = `min/max τ : ${zahl(Math.min(...alle) * unit_stress_factor, 2)} / ${zahl(Math.max(...alle) * unit_stress_factor, 2)}`;
        } else {
            minmax = `max σ<sub>v</sub> : ${zahl(Math.max(...alle) * unit_stress_factor, 2)}`;
            if (bezugswerte.fyrd > 0) {
                minmax += `&nbsp; (${zahl(Math.max(...alle) / bezugswerte.fyrd * 100, 1)} % f<sub>yRd</sub>)`;
            }
        }

    } else {
        // Wölbordinate ω (linear zwischen den Knoten) oder Verwölbung u (kubisch) über der Mittellinie
        const istOmega = anzeige === 'omega';
        const lf = istOmega ? unit_length_factor ** 2 : unit_length_factor;
        const einheitWert = current_unit_length + (istOmega ? '²' : '');
        einheit = istOmega ? tx('Wölbordinate ω in ', 'Warping ordinate ω in ') + einheitWert
            : tx('Verwölbung u in ', 'Warping displacement u in ') + einheitWert;
        const name = istOmega ? 'ω' : 'u';
        const kurven = truss.map((el, i) => {
            const p: Punkt[] = [];
            for (let j = 0; j <= TEILUNG; j++) {
                const t = j / TEILUNG;
                const w = istOmega
                    ? node[el.nod[0]].omega + t * (node[el.nod[1]].omega - node[el.nod[0]].omega)
                    : verwoelbung(el.u, t * el.sl, el.sl);
                p.push({ ...mittelPunkt(i, t), w });
            }
            return p;
        });
        const alle = kurven.flat().map(p => p.w);
        const maxAbs = Math.max(...alle.map(Math.abs));
        const f = hoehe(maxAbs);
        // mindestens 2 Nachkommastellen, bei kleinen Werten (Verwölbung) 3 gültige Ziffern
        const stellen = maxAbs > 0 ? Math.min(8, Math.max(2, 2 - Math.floor(Math.log10(maxAbs * lf)))) : 2;
        const text = (w: number) => zahl(w * lf, stellen);
        kurven.forEach((kurve, i) => {
            const { pos, neg } = wandDreiecke(kurve, f);
            diagramm!.add(flaeche(pos, FARBE_POSITIV, 0.45), flaeche(neg, FARBE_NEGATIV, 0.45));
            const top = (p: Punkt) => toV(p.y, p.z, p.w * f);
            diagramm!.add(linie(kurve.map(top), 0x333333));
            kurve.forEach(p => fangpunkte.push({
                pos: top(p),
                html: `<b>${name} = ${text(p.w)}</b> ${einheitWert}<br>${tx('Element', 'Element')} ${i + 1}<br>${koordinaten(p.y, p.z)}`,
            }));
            beschrifte(text(kurve[0].w), top(kurve[0]));
            beschrifte(text(kurve[TEILUNG].w), top(kurve[TEILUNG]));
            if (!istOmega) {
                const mx = kurve.reduce((a, b) => (Math.abs(b.w) > Math.abs(a.w) ? b : a));
                if (mx !== kurve[0] && mx !== kurve[TEILUNG]) beschrifte(text(mx.w), top(mx));
            }
        });
        minmax = `min/max ${name} : ${text(Math.min(...alle))} / ${text(Math.max(...alle))}`;
    }

    if (optionen.seitenLR) diagramm.add(baueSeitenLR());

    modell.add(diagramm);
    modell.add(beschriftungGruppe);

    byId('v3d-einheit').textContent = einheit;
    byId('v3d-minmax').innerHTML = minmax;

    sichtbarkeit();
}

function sichtbarkeit(): void {
    if (seitenGruppe) seitenGruppe.visible = optionen.seiten;
    if (pfeilGruppe) pfeilGruppe.visible = optionen.pfeile;
    if (achsenGruppe) achsenGruppe.visible = optionen.achsen;
    if (beschriftungGruppe) beschriftungGruppe.visible = optionen.beschriftung;
    if (letzterZeiger) fangen(letzterZeiger.x, letzterZeiger.y, letzterZeiger.springen);
    render();
}

//----------------------------------------------------------------------------------------------------------------------
// Werteabfrage mit Fangkreuz

function cursorAusblenden(): void {
    letzterZeiger = null;
    cursorSvg.style.display = 'none';
    wertAnzeige.style.display = 'none';
}

/** Button links unten: ein Finger verschiebt (Pan) oder fragt Werte ab (123). Nur auf Touch-Geräten. */
function initPanButton(): void {
    if (navigator.maxTouchPoints === 0) return;   // nur Maus: kein Umschalten nötig

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'view3d-pan';
    const aktualisieren = () => {
        btn.innerHTML = panModus ? ICON_PAN : ICON_WERTE;
        btn.title = panModus
            ? tx('Ein Finger verschiebt – tippen für Werteanzeige', 'One finger pans – tap to show values')
            : tx('Ein Finger zeigt Werte – tippen zum Verschieben', 'One finger shows values – tap to pan');
        controls.touches.ONE = panModus ? THREE.TOUCH.PAN : null;
        if (panModus) cursorAusblenden();
    };
    btn.addEventListener('click', () => {
        panModus = !panModus;
        aktualisieren();
    });
    aktualisieren();
    byId('view3d').appendChild(btn);
}

function zeigerBewegt(ev: PointerEvent): void {
    if (!modell) return;
    if (ev.pointerType === 'touch' && panModus) return;   // Finger verschiebt, keine Werteabfrage
    const x = ev.offsetX;
    let y = ev.offsetY;
    // Finger: Cursor über dem Finger, damit man sieht, wo man ist (wie d2beam-gui)
    if (ev.pointerType === 'touch') y -= Math.hypot(host.clientWidth, host.clientHeight) / 10;
    const springen = ev.pointerType !== 'mouse';
    letzterZeiger = { x, y, springen };
    fangen(x, y, springen);
}

/**
 * Kreuz an (x, y) zeichnen und den nächsten Fangpunkt innerhalb der Fangweite suchen.
 * Er wird mit einem Ring markiert; mit springen = true (Finger/Stift) rastet auch das Kreuz dort ein.
 */
function fangen(x: number, y: number, springen: boolean): void {
    const w = host.clientWidth, h = host.clientHeight;
    const fw = optionen.fangweite;

    let best: Fangpunkt | null = null;
    let bx = 0, by = 0;
    let bestD = fw;
    const s = new THREE.Vector3();
    for (const p of fangpunkte) {
        s.copy(p.pos).project(camera);
        if (s.z > 1) continue;   // hinter der Kamera
        const px = (s.x + 1) / 2 * w, py = (1 - s.y) / 2 * h;
        const d = Math.hypot(px - x, py - y);
        if (d <= bestD) {
            bestD = d;
            best = p;
            bx = px;
            by = py;
        }
    }

    let cx = x, cy = y;
    if (best && springen) {
        cx = bx;
        cy = by;
    }
    ring.setAttribute('cx', String(bx));
    ring.setAttribute('cy', String(by));
    ring.style.display = best ? '' : 'none';

    cursorSvg.style.display = 'block';
    cursorH.setAttribute('x1', String(cx - fw));
    cursorH.setAttribute('x2', String(cx + fw));
    cursorH.setAttribute('y1', String(cy));
    cursorH.setAttribute('y2', String(cy));
    cursorV.setAttribute('x1', String(cx));
    cursorV.setAttribute('x2', String(cx));
    cursorV.setAttribute('y1', String(cy - fw));
    cursorV.setAttribute('y2', String(cy + fw));
    cursorSvg.classList.toggle('gefangen', !!best);

    if (best) {
        wertAnzeige.innerHTML = best.html;
        wertAnzeige.style.display = 'block';
        // rechts oben neben das Kreuz, am Rand nach innen klappen
        const bw = wertAnzeige.offsetWidth, bh = wertAnzeige.offsetHeight;
        let lx = cx + fw + 6, ly = cy - fw - bh - 2;
        if (lx + bw > w) lx = cx - fw - 6 - bw;
        if (ly < 0) ly = cy + fw + 2;
        wertAnzeige.style.left = lx + 'px';
        wertAnzeige.style.top = ly + 'px';
    } else {
        wertAnzeige.style.display = 'none';
    }
}

//----------------------------------------------------------------------------------------------------------------------
// Bildexport (PNG) der aktuellen Ansicht

/** Tatsächlicher Vergrößerungsfaktor: gewünschter Faktor, begrenzt durch WebGL und die Canvas-Fläche. */
function bildFaktor(): number {
    const w = host.clientWidth, h = host.clientHeight;
    if (w === 0 || h === 0) return optionen.bildFaktor;
    const gl = renderer.getContext();
    const maxSeite = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number, renderer.capabilities.maxTextureSize);
    return Math.min(optionen.bildFaktor, maxSeite / Math.max(w, h), Math.sqrt(MAX_BILDPIXEL / (w * h)));
}

function bildNameAktualisieren(): void {
    if (!bildButtonName || !host) return;
    const f = bildFaktor();
    const w = Math.round(host.clientWidth * f), h = Math.round(host.clientHeight * f);
    const name = tx('PNG speichern', 'Save PNG');
    bildButtonName(w > 0 ? `${name} (${w} × ${h} px)` : name);
}

/**
 * Szene in höherer Auflösung rendern und die (HTML-)Beschriftungen dazuzeichnen.
 * Alles geschieht in einer Aufgabe ohne Zwischenzeichnen des Browsers – auf dem Schirm flackert nichts.
 */
function bildErzeugen(): Promise<Blob> {
    const w = host.clientWidth, h = host.clientHeight;
    const f = bildFaktor();
    const bw = Math.round(w * f), bh = Math.round(h * f);

    const leinwand = document.createElement('canvas');
    leinwand.width = bw;
    leinwand.height = bh;
    const ctx = leinwand.getContext('2d')!;

    const altRatio = renderer.getPixelRatio();
    const altFarbe = renderer.getClearColor(new THREE.Color());
    if (optionen.bildWeiss) renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(f);
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, 0, 0, bw, bh);
    renderer.setClearColor(altFarbe);
    renderer.setPixelRatio(altRatio);
    renderer.setSize(w, h, false);
    render();

    // Beschriftungen: Lage und Aussehen aus dem DOM des CSS2DRenderer übernehmen
    const basis = labelRenderer.domElement.getBoundingClientRect();
    ctx.scale(f, f);
    for (const el of labelRenderer.domElement.querySelectorAll<HTMLElement>('.label3d')) {
        if (el.style.display === 'none' || !el.textContent) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;   // ausgeblendete Gruppe
        const st = getComputedStyle(el);
        const x = r.left - basis.left, y = r.top - basis.top;
        const rand = parseFloat(st.borderTopWidth) || 0;
        if (st.backgroundColor !== 'rgba(0, 0, 0, 0)' && st.backgroundColor !== 'transparent') {
            ctx.fillStyle = st.backgroundColor;
            ctx.beginPath();
            ctx.roundRect(x, y, r.width, r.height, parseFloat(st.borderTopLeftRadius) || 0);
            ctx.fill();
            if (rand > 0) {
                ctx.strokeStyle = st.borderTopColor;
                ctx.lineWidth = rand;
                ctx.stroke();
            }
        }
        ctx.fillStyle = st.color;
        ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.textContent, x + r.width / 2, y + r.height / 2);
    }

    return new Promise((resolve, reject) => leinwand.toBlob(
        b => b ? resolve(b) : reject(new Error('Bild konnte nicht erzeugt werden (zu groß?)')), 'image/png'));
}

/** PNG speichern: Dateidialog (File System Access), sonst Download. */
async function bildExportieren(): Promise<void> {
    if (!modell || host.clientWidth === 0) return;
    const vorschlag = 'duennqs_3d.png';
    try {
        if (app.hasFSAccess && window.showSaveFilePicker) {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: vorschlag,
                types: [{ description: tx('PNG-Bild', 'PNG image'), accept: { 'image/png': ['.png'] } }],
            });
            const blob = await bildErzeugen();
            const fileStream = await fileHandle.createWritable();
            await fileStream.write(blob);
            await fileStream.close();
        } else {
            saveAs(await bildErzeugen(), vorschlag);
        }
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        alert(error instanceof Error ? error.message : String(error));
    }
}

//----------------------------------------------------------------------------------------------------------------------

/**
 * 3D-Ansicht einblenden (Tab 3D) und mit dem Ergebnis der letzten erfolgreichen Berechnung aufbauen.
 * Die Ansicht reicht bis zum unteren Fensterrand.
 */
export function zeige3D(): void {
    // Breite fest vorgeben: die Spalte des Layouts richtet sich nach ihrem Inhalt (wie bisher, bis zum neuen Layout)
    const container = byId('my-webgl');
    container.style.width = myScreen.svgWidth + 'px';
    container.style.height = Math.max(250, document.documentElement.clientHeight
        - byId('input-container').getBoundingClientRect().height - byId('footer').offsetHeight) + 'px';

    if (!renderer) init();

    if (modell) {
        scene.remove(modell);
        dispose(modell);
        modell = null;
    }

    const ok = berechnung_erfolgreich && truss.length > 0;
    byId('view3d-hinweis').hidden = ok;
    byId('view3d-info').hidden = !ok;
    if (ok) {
        let ymin = Infinity, ymax = -Infinity, zmin = Infinity, zmax = -Infinity;
        for (const el of truss) {
            for (let j = 0; j < 4; j++) {
                ymin = Math.min(ymin, el.pts_y[j]);
                ymax = Math.max(ymax, el.pts_y[j]);
                zmin = Math.min(zmin, el.pts_z[j]);
                zmax = Math.max(zmax, el.pts_z[j]);
            }
        }
        groesse = Math.max(ymax - ymin, zmax - zmin) || 1;

        modell = new THREE.Group();
        modell.add(baueQuerschnitt());
        achsenGruppe = baueAchsen();
        modell.add(achsenGruppe);
        scene.add(modell);
        baueDiagramm();

        // Kamera nur neu setzen, wenn sich die Abmessungen deutlich ändern – sonst bleibt die Blickrichtung erhalten
        if (kameraGroesse === 0 || groesse / kameraGroesse > 2 || kameraGroesse / groesse > 2) {
            kameraZuruecksetzen();
        }
    }
    cursorAusblenden();
    resize();
}
