/*
 * Standardquerschnitte für „neue Eingabe“: Knoten und Elemente aus wenigen Abmessungen erzeugen.
 *
 * Die Abmessungen beziehen sich auf die Profilmittellinien (Systemlinien) und werden in der
 * eingestellten Längeneinheit eingegeben; die erzeugten Koordinaten und Dicken sind in derselben Einheit.
 * Wie beim Weggrößenverfahren werden die Elemente über gemeinsame Knoten verbunden: An jeder Stelle,
 * an der Bleche zusammenstoßen (z.B. Steg an Flansch), liegt ein Knoten.
 *
 * Koordinatenursprung rechts oben (ȳ zeigt nach links, z̄ nach unten), beim Kreis im Mittelpunkt.
 */

export type ProfilArt = 'I' | 'RHP' | 'U' | 'KHP';

/** Abmessungen je Profilart (Schlüssel der Eingabefelder im Dialog). */
export const PROFIL_FELDER: Record<ProfilArt, readonly string[]> = {
    I: ['bo', 'to', 'bu', 'tu', 'h', 'ts'],
    RHP: ['b', 'h', 't'],
    U: ['h', 'b', 'tf', 'ts'],
    KHP: ['d', 't', 'n'],
};

export interface ProfilGeometrie {
    y: number[];
    z: number[];
    elemente: { nod1: number; nod2: number; t: number }[];   // Knotennummern ab 1
}

/** Knoten und Elemente eines Standardquerschnitts; w enthält die Abmessungen nach PROFIL_FELDER. */
export function profilGeometrie(art: ProfilArt, w: Record<string, number>): ProfilGeometrie {
    switch (art) {
        case 'I': {
            // Steg in der Mitte der breiteren Flansch; Knoten: Flansch oben rechts/Steg/links, unten ebenso
            const B = Math.max(w.bo, w.bu), m = B / 2;
            return {
                y: [m - w.bo / 2, m, m + w.bo / 2, m - w.bu / 2, m, m + w.bu / 2],
                z: [0, 0, 0, w.h, w.h, w.h],
                elemente: [
                    { nod1: 1, nod2: 2, t: w.to }, { nod1: 2, nod2: 3, t: w.to },
                    { nod1: 2, nod2: 5, t: w.ts },
                    { nod1: 4, nod2: 5, t: w.tu }, { nod1: 5, nod2: 6, t: w.tu },
                ],
            };
        }
        case 'RHP':
            return {
                y: [0, w.b, w.b, 0],
                z: [0, 0, w.h, w.h],
                elemente: [
                    { nod1: 1, nod2: 2, t: w.t }, { nod1: 2, nod2: 3, t: w.t },
                    { nod1: 3, nod2: 4, t: w.t }, { nod1: 4, nod2: 1, t: w.t },
                ],
            };
        case 'U':
            // Steg links (bei ȳ = b), Flansche nach rechts offen
            return {
                y: [0, w.b, w.b, 0],
                z: [0, 0, w.h, w.h],
                elemente: [
                    { nod1: 1, nod2: 2, t: w.tf }, { nod1: 2, nod2: 3, t: w.ts }, { nod1: 3, nod2: 4, t: w.tf },
                ],
            };
        case 'KHP': {
            // Polygon mit n Ecken auf dem Mittellinienkreis, Knoten 1 bei ȳ = r, z̄ = 0
            const n = Math.round(w.n), r = w.d / 2;
            const y: number[] = [], z: number[] = [];
            const elemente: ProfilGeometrie['elemente'] = [];
            for (let i = 0; i < n; i++) {
                const phi = 2 * Math.PI * i / n;
                y.push(sauber(r * Math.cos(phi), r));
                z.push(sauber(r * Math.sin(phi), r));
                elemente.push({ nod1: i + 1, nod2: (i + 1) % n + 1, t: w.t });
            }
            return { y, z, elemente };
        }
    }
}

/** Rundungsreste wie 3.06e-15 statt 0 vermeiden. */
function sauber(wert: number, bezug: number): number {
    return Math.abs(wert) < 1e-12 * bezug ? 0 : wert;
}

/** Prüft die Abmessungen; liefert die Schlüssel der ungültigen Felder. */
export function profilFehler(art: ProfilArt, w: Record<string, number>): string[] {
    const fehler = PROFIL_FELDER[art].filter(k => !Number.isFinite(w[k]) || w[k] <= 0);
    if (art === 'KHP' && !fehler.includes('n') && (!Number.isInteger(w.n) || w.n < 3 || w.n > 360)) fehler.push('n');
    return fehler;
}
