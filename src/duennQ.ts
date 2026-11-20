import { msg, str } from '@lit/localize';
import { byId, app, berechnungErforderlich } from './state';
import { gauss } from "./gauss";
import { testeZahl, myFormat } from './utility';
import { current_unit_length, current_unit_stress, unit_length_factor, unit_stress_factor } from "./einstellungen";
import { leseTabellen, materialGleich } from './eingabe';
import { alertdialog } from './components/confirm_dialog';

export let ymin = -50.0, zmin = -50.0, ymax = 50.0, zmax = 50.0, slmax = 0.0;
export let u0 = 0.0
export let nnodes = 0, nelem = 0                // Anzahl Knoten und Elemente der letzten Berechnung
export let kappa_1 = 0.0, kappa_2 = 0.0   // Schubkorrekturfaktoren

//------------------------------------------------------------------------------------------------

class TTabQWerte {  // Tabelle Querschnittswerte für pdf
    zs: string = ''
    ys: string = ''
    area: string = ''
    area_geom: string = ''
    Iyy: string = ''
    Izz: string = ''
    Iyz: string = ''
    I11: string = ''
    I22: string = ''
    phi_h: string = ''
    yM: string = ''
    zM: string = ''
    It: string = ''
    Iomega: string = ''
    r1: string = ''
    r2: string = ''
    r_omega: string = ''
    i_M2: string = ''
    i_p2: string = ''
}

class TSchnittgroessen {
    Vy: number = 0
    Vz: number = 0
    Mxp: number = 0
    Mxs: number = 0
    M_omega: number = 0
    N: number = 0
    My: number = 0
    Mz: number = 0
}

class TBezugswerte {
    emodul: number = 0
    mue: number = 0
    fyrd: number = 0
}

export const tabQWerte = new TTabQWerte;
export const schnittgroesse = new TSchnittgroessen;
export const bezugswerte = new TBezugswerte

export let node = [] as TNode[]
export let truss = [] as TElement[]
export let I_omega: number = 0
export let Gesamt_ys: number = 0
export let Gesamt_zs: number = 0
export let yM: number = 0
export let zM: number = 0                              // Schubmittelpunkt bezogen auf Schwerpunkt im yz-Koordinatensystem
export let phi0: number = 0

export let Mxp: number = 0

class TNode {
    y: number = 1.0                                 // Knotenkoordinaten bezogen auf Hilfskoordinatensystem
    z: number = 1.0
    yh: number = 1.0                                // entspricht Koordinate in Hauptrichtung 1 (eta), Ursprung liegt im Schwerpunkt
    zh: number = 1.0                                // entspricht Koordinate in Hauptrichtung 2 (ksi)
    omega: number = 0.0
    Lx: number = 0                                  // Lagerbedingung  bei Eingabe: 0=frei, 1=fest, später enthält L() die Gleichungsnummern
    ys: number = 0.0                                // Knotenkoordinaten bezogen auf den Schwerpunkt
    zs: number = 0.0
    nel: number = 0                                 // Anzahl der Elemente, die an dem Knoten hängen
}

class TElement {
    EModul: number = 0
    GModul: number = 0
    mue: number = 0                                    // Querdehnzahl
    ni: number = 0                                     // Verhältnis Ei/E
    ngi: number = 0                                    // Verhältnis Gi/G
    dicke: number = 0
    sl: number = 0                                     // Stablänge
    nod = [0, 0]                                   // globale Knotennummer der Stabenden
    lm = [0, 0]
    estiff = [[0.0, 0.0], [0.0, 0.0]]
    F = [0.0, 0.0]
    F34 = [0.0, 0.0]
    cosinus: number = 0
    sinus: number = 0
    alpha: number = 0
    rt: number = 0
    Flaeche: number = 0
    Iyy: number = 0
    Izz: number = 0
    Iyz: number = 0
    Hebely: number = 0
    Hebelz: number = 0
    R = [0.0, 0.0]                               // rechte Seite
    R2 = [0.0, 0.0]
    omegaQ = [0.0, 0.0]
    y1: number = 0                                 // Koordinaten im Hauptsystem
    y2: number = 0
    y3: number = 0; y4: number = 0
    z1: number = 0
    z2: number = 0
    z3: number = 0; z4: number = 0
    omega = [0.0, 0.0, 0.0, 0.0]
    u = [0.0, 0.0, 0.0, 0.0]
    u34 = [0.0, 0.0]                            // Vertforungen innere Knoten
    ry: number = 0                                 // Querschnittswerte für Biegedrillknicken
    rz: number = 0
    rOmega: number = 0
    tau_p0R = [0.0, 0.0, 0.0]
    tau_p0L = [0.0, 0.0, 0.0]
    tau_p1 = [0.0, 0.0, 0.0]
    tau_s = [0.0, 0.0, 0.0]
    sigma_x = [0.0, 0.0, 0.0]
    sigma_v = [0.0, 0.0, 0.0]
    stress_R = [0.0, 0.0, 0.0]
    stress_L = [0.0, 0.0, 0.0]
    pts_y = [0.0, 0.0, 0.0, 0.0]
    pts_z = [0.0, 0.0, 0.0, 0.0]
    sigma_xe = [0.0, 0.0, 0.0, 0.0]
}

//----------------------------------------------------------------------------------------------

/** Berechnung; zeigeErgebnisse: danach auf den Tab Ergebnisse wechseln (nicht beim Sprachwechsel). */
export function duennQ(zeigeErgebnisse = true) {
    //----------------------------------------------------------------------------------------------

    let i: number, neq: number,
        j: number, k: number, nod1: number, nod2: number, lmi: number, lmj: number, kn: number, ieq: number,
        y1: number, y2: number, z1: number, z2: number, ys: number, zs: number, dy: number, dz: number, t: number,
        sl: number, h: number, si2: number, co2: number,
        si: number, co: number, sico: number, si0: number, co0: number, cc: number, bb: number, cr: number,
        Hebely: number, Hebelz: number,
        iP2: number, iM2: number,
        fact: number, A_omegaQ: number, A_yOmegaQ: number, A_zOmegaQ: number, rOmega: number, dOmega: number,
        It_geschlossen: number, omega_m: number, area: number,
        rt: number, ry: number, rz: number, y_m: number, z_m: number;

    let Gesamtflaeche: number, I11: number, I22: number, area_geom: number,
        Gesamt_Iyy: number, Gesamt_Izz: number, Gesamt_Iyz: number, Gesamt_It: number, It_offen: number,
        yMh: number, zMh: number                             // Schubmittelpunkt bezogen auf Schwerpunkt im Hauptachsensystem

    let tau_xs1: number, tau_xs2: number, tau_xsm: number, tau_xs_1: number, tau_xs_0: number,
        normalkraft: number, moment_y: number, moment_z: number, moment_1: number, moment_2: number,
        M_omega: number,
        Vy: number, Vz: number, V1: number, V2: number, Mt1: number, Mt2: number;

    let yj: number, zj: number, nodj: number
    let sigma: number, sigma2: number, tau_L: number, tau_R: number, fyRd: number

    let wert: any

    let EModul: number, mue: number;

    app.gerechnet = false;

    // Tabellen lesen (ungültige Zellen werden markiert)
    const eingabe = leseTabellen();
    nnodes = eingabe.knoten.y.length;
    nelem = eingabe.elemente.dicke.length;
    if (eingabe.fehler > 0) {
        return fehler(msg('Die Eingabe enthält ungültige Zahlen (rot markiert).'));
    }
    // Schnittgrößen einlesen
    let input = byId('Vy') as HTMLInputElement;
    schnittgroesse.Vy = Vy = Number(testeZahl(input.value));
    input = byId('Vz') as HTMLInputElement;
    schnittgroesse.Vz = Vz = Number(testeZahl(input.value));
    input = byId('Nx') as HTMLInputElement;
    schnittgroesse.N = normalkraft = Number(testeZahl(input.value));
    input = byId('Mxp') as HTMLInputElement;
    schnittgroesse.Mxp = Mxp = Mt1 = Number(testeZahl(input.value)) * 100.0;  // in kNcm
    input = byId('Mxs') as HTMLInputElement;
    schnittgroesse.Mxs = Mt2 = Number(testeZahl(input.value)) * 100.0;
    input = byId('Momega') as HTMLInputElement;
    schnittgroesse.M_omega = M_omega = Number(testeZahl(input.value)) * 10000.0;  // in kNcm²
    input = byId('My') as HTMLInputElement;
    schnittgroesse.My = moment_y = Number(testeZahl(input.value)) * 100.0;
    input = byId('Mz') as HTMLInputElement;
    schnittgroesse.Mz = moment_z = Number(testeZahl(input.value)) * 100.0;

    input = byId('fyRd') as HTMLInputElement;
    bezugswerte.fyrd = fyRd = Number(testeZahl(input.value)) / unit_stress_factor;
    console.log("fyRd", fyRd)

    while (node.length > 0) node.pop();
    while (truss.length > 0) truss.pop();

    for (i = 0; i < nnodes; i++) {
        node.push(new TNode())
    }

    for (i = 0; i < nelem; i++) {
        truss.push(new TElement())
    }

    input = byId('EMod_ref') as HTMLInputElement;
    bezugswerte.emodul = EModul = Number(testeZahl(input.value)) / unit_stress_factor;
    if (EModul < 1e-12) return fehler(msg('Der E-Modul (Bezugswert) muss größer 0 sein'));
    input = byId('mue_ref') as HTMLInputElement;
    bezugswerte.mue = mue = Number(testeZahl(input.value));
    if (mue < 0) return fehler(msg('Die Querdehnzahl (Bezugswert) muss größer oder gleich 0 sein'));
    const GModul = EModul / 2.0 / (1.0 + mue)

    // Knoten
    for (i = 0; i < nnodes; i++) {
        node[i].y = eingabe.knoten.y[i];
        node[i].z = eingabe.knoten.z[i];
    }

    // Elemente
    const gleich = materialGleich();
    for (i = 0; i < nelem; i++) {
        if (gleich) {
            truss[i].EModul = bezugswerte.emodul;
            truss[i].mue = bezugswerte.mue;
        } else {
            truss[i].EModul = eingabe.elemente.E[i];
            truss[i].mue = eingabe.elemente.mue[i];
            if (truss[i].EModul < 1e-12) return fehler(msg(str`E-Modul von Element ${i + 1} muss größer 0 sein`));
            if (truss[i].mue < 0) return fehler(msg(str`Querdehnzahl von Element ${i + 1} muss größer oder gleich 0 sein`));
        }
        truss[i].dicke = eingabe.elemente.dicke[i];
        if (truss[i].dicke < 1e-12) return fehler(msg(str`Dicke von Element ${i + 1} muss größer 0 sein`));

        truss[i].nod[0] = eingabe.elemente.nod1[i] - 1;
        truss[i].nod[1] = eingabe.elemente.nod2[i] - 1;
        for (const nod of truss[i].nod) {
            if (nod < 0 || nod > nnodes - 1) {
                return fehler(msg(str`Knoteninzidenzen von Element ${i + 1} müssen zwischen 1 und der Anzahl der Knoten liegen`));
            }
            node[nod].nel++;
        }
        truss[i].GModul = truss[i].EModul / 2.0 / (1.0 + truss[i].mue)
        truss[i].ni = truss[i].EModul / EModul
        truss[i].ngi = truss[i].GModul / GModul
    }

    for (i = 0; i < nnodes; i++) {
        if (node[i].nel === 0) return fehler(msg(str`An Knoten ${i + 1} hängt kein Element`));
    }

    const t0 = performance.now();

    node[0].Lx = 1                               // ein Freiheitsgrad muss gelagert werden

    // Berechnung der Gleichungsnummern

    neq = 0;
    for (i = 0; i < nnodes; i++) {
        if (node[i].Lx > 0) {
            node[i].Lx = -1;
        } else {
            node[i].Lx = neq;
            neq = neq + 1;
        }
    }
    console.log("neq=", neq)

    // Berechnung der Stablänge, der Inzidenzen und Elementsteifigkeitsmatrix

    Gesamtflaeche = 0.0;
    area_geom = 0.0;
    Gesamt_ys = 0.0;
    Gesamt_zs = 0.0;
    It_offen = 0.0;
    for (i = 0; i < nelem; i++) {
        nod1 = truss[i].nod[0];
        nod2 = truss[i].nod[1];
        y1 = node[nod1].y;
        y2 = node[nod2].y;
        z1 = node[nod1].z;
        z2 = node[nod2].z;

        dy = y2 - y1;
        dz = z2 - z1;
        truss[i].sl = Math.sqrt(dy * dy + dz * dz);      // Stablänge

        if (truss[i].sl < 1e-12) return fehler(msg(str`Die Länge von Element ${i + 1} ist null`));

        truss[i].alpha = Math.atan2(dz, dy) //*180.0/Math.PI
        console.log("sl=", i, truss[i].sl, truss[i].alpha)

        truss[i].lm[0] = node[nod1].Lx;
        truss[i].lm[1] = node[nod2].Lx;

        t = truss[i].dicke;
        sl = truss[i].sl;

        truss[i].Flaeche = sl * t;
        I11 = 0.0;

        I22 = t * sl * sl * sl / 12.0;
        si = dz / sl;
        co = dy / sl;
        truss[i].sinus = si
        truss[i].cosinus = co
        sico = si * co;
        co2 = co * co;
        si2 = si * si;

        truss[i].Iyy = truss[i].ni * (I11 * co2 + I22 * si2);
        truss[i].Izz = truss[i].ni * (I11 * si2 + I22 * co2);
        truss[i].Iyz = -truss[i].ni * (I11 - I22) * sico;
        truss[i].Hebely = (y1 + y2) / 2.0;
        truss[i].Hebelz = (z1 + z2) / 2.0;

        Gesamtflaeche = Gesamtflaeche + truss[i].ni * truss[i].Flaeche;
        area_geom += truss[i].Flaeche;
        Gesamt_ys = Gesamt_ys + truss[i].ni * truss[i].Flaeche * (y1 + y2) / 2.0;
        Gesamt_zs = Gesamt_zs + truss[i].ni * truss[i].Flaeche * (z1 + z2) / 2.0;
        It_offen = It_offen + truss[i].ngi * sl * t * t * t / 3.0;

        h = t / 2.0

        truss[i].pts_y[0] = y1 + si * h      // für Grafik
        truss[i].pts_z[0] = z1 - co * h
        truss[i].pts_y[1] = y2 + si * h
        truss[i].pts_z[1] = z2 - co * h
        truss[i].pts_y[2] = y2 - si * h
        truss[i].pts_z[2] = z2 + co * h
        truss[i].pts_y[3] = y1 - si * h
        truss[i].pts_z[3] = z1 + co * h

    }

    Gesamt_ys = Gesamt_ys / Gesamtflaeche;
    Gesamt_zs = Gesamt_zs / Gesamtflaeche;

    Gesamt_Iyy = 0.0;
    Gesamt_Izz = 0.0;
    Gesamt_Iyz = 0.0;
    for (i = 0; i < nelem; i++) {
        Hebelz = truss[i].Hebelz - Gesamt_zs;
        Gesamt_Iyy = Gesamt_Iyy + Hebelz * Hebelz * truss[i].ni * truss[i].Flaeche + truss[i].Iyy;
        Hebely = truss[i].Hebely - Gesamt_ys;
        Gesamt_Izz = Gesamt_Izz + Hebely * Hebely * truss[i].ni * truss[i].Flaeche + truss[i].Izz;
        Gesamt_Iyz = Gesamt_Iyz + Hebely * Hebelz * truss[i].ni * truss[i].Flaeche + truss[i].Iyz;
    }

    console.log("Gesamt_ys", Gesamt_ys);
    console.log("Gesamt_zs", Gesamt_zs);
    console.log("Gesamtflaeche", Gesamtflaeche);
    console.log("Gesamt_Iyy", Gesamt_Iyy);
    console.log("Gesamt_Izz", Gesamt_Izz);
    console.log("Gesamt_Iyz", Gesamt_Iyz);

    cc = (Gesamt_Iyy + Gesamt_Izz) * 0.5;
    bb = (Gesamt_Iyy - Gesamt_Izz) * 0.5;
    cr = Math.sqrt(bb * bb + Gesamt_Iyz * Gesamt_Iyz);
    I11 = cc + cr;
    I22 = cc - cr;

    if ((Math.abs(Gesamt_Iyz) < 1.e-10) && (Math.abs(bb) < 1.e-10)) phi0 = 0.0;        // zum Beispiel ein Quadrat
    else phi0 = 0.5 * Math.atan2(-Gesamt_Iyz, bb);

    console.log("I11", I11);
    console.log("I22", I22);
    console.log("phi0", phi0 * 180.0 / Math.PI);

    // Verschieben in den Schwerpunkt und drehen der Koordinaten in das Hauptachsensystem
    si0 = Math.sin(phi0);
    co0 = Math.cos(phi0);
    for (i = 0; i < nnodes; i++) {
        ys = node[i].y - Gesamt_ys;
        zs = node[i].z - Gesamt_zs;
        node[i].ys = ys;
        node[i].zs = zs;
        node[i].yh = co0 * ys + si0 * zs;
        node[i].zh = -si0 * ys + co0 * zs;
    }

    V1 = co0 * Vy + si0 * Vz                     // Querkräfte im Hauptachsensystem
    V2 = -si0 * Vy + co0 * Vz

    moment_1 = co0 * moment_y + si0 * moment_z   // Biegemomente im Hauptachsensystem
    moment_2 = -si0 * moment_y + co0 * moment_z

    for (i = 0; i < nelem; i++) {
        nod1 = truss[i].nod[0];
        nod2 = truss[i].nod[1];
        y1 = node[nod1].yh;
        y2 = node[nod2].yh;
        z1 = node[nod1].zh;
        z2 = node[nod2].zh;
        truss[i].y1 = y1;
        truss[i].y2 = y2;
        truss[i].z1 = z1;
        truss[i].z2 = z2;

        dy = (y2 - y1) / 3;
        dz = (z2 - z1) / 3;
        truss[i].y3 = y1 + dy;
        truss[i].y4 = y1 + 2 * dy;
        truss[i].z3 = z1 + dz;
        truss[i].z4 = z1 + 2 * dz;

        fact = truss[i].GModul * truss[i].dicke / truss[i].sl;

        truss[i].estiff[0][0] = fact;
        truss[i].estiff[0][1] = -fact;
        truss[i].estiff[1][0] = -fact;
        truss[i].estiff[1][1] = fact;

        truss[i].rt = (y1 * z2 - y2 * z1) / truss[i].sl;
        truss[i].R[0] = -truss[i].GModul * truss[i].dicke * truss[i].rt;
        truss[i].R[1] = -truss[i].R[0];

    }

    // Aufstellen der Steifigkeitsmatrix


    const stiff = Array.from(Array(neq), () => new Array(neq).fill(0.0));
    const stiff2 = Array.from(Array(neq), () => new Array(neq).fill(0.0));
    const R = Array(neq);
    const u = Array(neq);

    for (k = 0; k < nelem; k++) {

        for (i = 0; i < 2; i++) {
            lmi = truss[k].lm[i];
            if (lmi >= 0) {
                for (j = 0; j < 2; j++) {
                    lmj = truss[k].lm[j];
                    if (lmj >= 0) {
                        stiff[lmi][lmj] = stiff[lmi][lmj] + truss[k].estiff[i][j];
                    }
                }
            }
        }
    }

    for (i = 0; i < neq; i++) {
        for (j = 0; j < neq; j++) {
            stiff2[i][j] = stiff[i][j];
        }
    }

    // Aufstellen der rechten Seite

    for (i = 0; i < neq; i++) R[i] = 0.0;

    for (k = 0; k < nelem; k++) {
        for (i = 0; i < 2; i++) {
            lmi = truss[k].lm[i];
            if (lmi >= 0) {
                R[lmi] = R[lmi] + truss[k].R[i];
            }
        }
    }

    for (i = 0; i < neq; i++) {
        console.log("R", i, R[i])
    }
    // Gleichungssystem lösen
    let error = gauss(neq, stiff, R);
    if (error != 0) {
        return fehler(msg('Das Gleichungssystem ist singulär.'));
    }

    for (i = 0; i < neq; i++) u[i] = R[i];

    for (i = 0; i < nnodes; i++) {     // Ausgabe der Verschiebungen der einzelnen Knoten
        ieq = node[i].Lx;
        if (ieq === -1) {
            node[i].omega = 0.0;
        } else {
            node[i].omega = u[ieq];
        }
    }

    // Rückrechnung

    A_omegaQ = 0.0;
    A_yOmegaQ = 0.0;
    A_zOmegaQ = 0.0;

    for (k = 0; k < nelem; k++) {
        for (j = 0; j < 2; j++) {      // Stabverformungen im globalen System
            ieq = truss[k].lm[j];
            if (ieq === -1) {
                truss[k].omegaQ[j] = 0;
            } else {
                truss[k].omegaQ[j] = u[ieq];
            }
        }
        // Normierung der Wölbordinate

        area = truss[k].Flaeche * truss[k].ni;
        A_omegaQ = A_omegaQ + 0.5 * (truss[k].omegaQ[0] + truss[k].omegaQ[1]) * area;
        A_yOmegaQ = A_yOmegaQ + ((2.0 * truss[k].y1 + truss[k].y2) * truss[k].omegaQ[0] + (truss[k].y1 + 2.0 * truss[k].y2) * truss[k].omegaQ[1]) * area / 6.0;
        A_zOmegaQ = A_zOmegaQ + ((2.0 * truss[k].z1 + truss[k].z2) * truss[k].omegaQ[0] + (truss[k].z1 + 2.0 * truss[k].z2) * truss[k].omegaQ[1]) * area / 6.0;
    }
    A_omegaQ = A_omegaQ / Gesamtflaeche;
    yMh = A_zOmegaQ / I11;
    zMh = -A_yOmegaQ / I22;
    yM = co0 * yMh - si0 * zMh;       // Schubmittelpunkt im originalen Koordinatensystem, bezogen auf Schwerpunkt
    zM = si0 * yMh + co0 * zMh;

    console.log("A_omegaQ", A_omegaQ);
    console.log("A_yOmegaQ", A_yOmegaQ);
    console.log("A_zOmegaQ", A_zOmegaQ);
    console.log("yM", yM);
    console.log("zM", zM);

    if (Number.isNaN(yM) || Number.isNaN(zM)) return;

    for (i = 0; i < nnodes; i++) {     // Berechnung der normierten Wölbordinaten
        node[i].omega = node[i].omega - A_omegaQ - node[i].zh * yMh + node[i].yh * zMh;
    }

    I_omega = 0.0;
    It_geschlossen = 0.0;
    for (k = 0; k < nelem; k++) {
        for (j = 0; j < 2; j++) {       // Stabverformungen im globalen System
            kn = truss[k].nod[j];
            truss[k].omega[j] = node[kn].omega;
        }
        I_omega = I_omega + truss[k].ni * truss[k].Flaeche * (truss[k].omega[0] * truss[k].omega[0] + truss[k].omega[0] * truss[k].omega[1] + truss[k].omega[1] * truss[k].omega[1]) / 3.0;
        rt = (truss[k].y1 - yMh) * (truss[k].z2 - truss[k].z1) / truss[k].sl - (truss[k].z1 - zMh) * (truss[k].y2 - truss[k].y1) / truss[k].sl;
        truss[k].rt = rt;
        It_geschlossen = It_geschlossen + truss[k].ngi * truss[k].dicke * rt * (rt * truss[k].sl + truss[k].omega[0] - truss[k].omega[1]);

        dOmega = (truss[k].omega[1] - truss[k].omega[0]) / 3
        truss[k].omega[2] = truss[k].omega[0] + dOmega
        truss[k].omega[3] = truss[k].omega[0] + 2 * dOmega
    }
    Gesamt_It = It_offen + It_geschlossen;
    console.log("I_omega", I_omega);
    console.log("It_gesamt", Gesamt_It);

    ry = 0;
    rz = 0;
    rOmega = 0;
    for (k = 0; k < nelem; k++) {
        y_m = (truss[k].y1 + truss[k].y2) / 2;
        z_m = (truss[k].z1 + truss[k].z2) / 2;
        omega_m = (truss[k].omega[0] + truss[k].omega[1]) / 2;
        dy = truss[k].y2 - truss[k].y1;
        dz = truss[k].z2 - truss[k].z1;
        dOmega = truss[k].omega[1] - truss[k].omega[0];
        ry = ry + (y_m * y_m * y_m + y_m * dy * dy / 4 + y_m * z_m * z_m + (y_m * dz * dz + 2 * z_m * dy * dz) / 12) * truss[k].Flaeche;
        rz = rz + (z_m * z_m * z_m + z_m * dz * dz / 4 + z_m * y_m * y_m + (z_m * dy * dy + 2 * y_m * dz * dy) / 12) * truss[k].Flaeche;
        rOmega = rOmega + (yMh * yMh * omega_m + (omega_m * dy * dy + 2 * y_m * dy * dOmega) / 12) * truss[k].Flaeche;
        rOmega = rOmega + (zMh * zMh * omega_m + (omega_m * dz * dz + 2 * z_m * dz * dOmega) / 12) * truss[k].Flaeche;
    }

    ry = ry / I22 - 2 * yMh;
    rz = rz / I11 - 2 * zMh;
    if (I_omega > 0.0000000000001) rOmega = rOmega / I_omega;
    console.log("ry", ry);
    console.log("rz", rz);
    console.log("rOmega", rOmega);
    iP2 = (I11 + I22) / Gesamtflaeche;
    iM2 = iP2 + yMh * yMh + zMh * zMh;
    console.log("iM2", iM2);
    console.log("iP2", iP2);

    //--------------------------------------------------------------- N E U

    for (k = 0; k < nelem; k++) {
        tau_xs_1 = ((truss[k].omega[0] - truss[k].omega[1]) / truss[k].sl + truss[k].rt) * truss[k].ngi * Mt1 / Gesamt_It
        tau_xs_0 = truss[k].ngi * Mt1 / Gesamt_It * truss[k].dicke
        for (i = 0; i < 3; i++) {
            truss[k].tau_p0R[i] = tau_xs_0
            truss[k].tau_p0L[i] = -tau_xs_0
            truss[k].tau_p1[i] = tau_xs_1
        }
    }

    //----------------------------
    // Schub und sekundäre Torsion
    //----------------------------

    for (i = 0; i < nelem; i++) {
        if (I_omega > 0.0000000000001) {
            truss[i].F[0] = V2 / I11 * truss[i].z1 + V1 / I22 * truss[i].y1 + Mt2 / I_omega * truss[i].omega[0]
            truss[i].F[1] = V2 / I11 * truss[i].z2 + V1 / I22 * truss[i].y2 + Mt2 / I_omega * truss[i].omega[1]
            //truss[i].F34[0] = V2 / I11 * truss[i].z3 + V1 / I22 * truss[i].y3 + Mt2 / I_omega * truss[i].omega[2]
            //truss[i].F34[1] = V2 / I11 * truss[i].z4 + V1 / I22 * truss[i].y4 + Mt2 / I_omega * truss[i].omega[3]
        } else {
            // wölbfreier Querschnitt
            truss[i].F[0] = V2 / I11 * truss[i].z1 + V1 / I22 * truss[i].y1
            truss[i].F[1] = V2 / I11 * truss[i].z2 + V1 / I22 * truss[i].y2
            //truss[i].F34[0] = V2 / I11 * truss[i].z3 + V1 / I22 * truss[i].y3
            //truss[i].F34[1] = V2 / I11 * truss[i].z4 + V1 / I22 * truss[i].y4
        }

        truss[i].R2[0] = truss[i].ni * truss[i].Flaeche * (truss[i].F[0] + 0.5 * truss[i].F[1]) / 3.0          // .ni ist korrekt 26.11.2025
        truss[i].R2[1] = truss[i].ni * truss[i].Flaeche * (0.5 * truss[i].F[0] + truss[i].F[1]) / 3.0

        // entspricht F1 und F2 nach Krause für 4 Knotenelement
        truss[i].F34[0] = truss[i].ni * truss[i].Flaeche * (13 * truss[i].F[0] + 2 * truss[i].F[1]) / 120.0
        truss[i].F34[1] = truss[i].ni * truss[i].Flaeche * (2 * truss[i].F[0] + 13 * truss[i].F[1]) / 120.0

        // truss[i].R2[0] =  truss[i].Flaeche * (truss[i].F[0] + 0.5 * truss[i].F[1]) / 3.0
        // truss[i].R2[1] =  truss[i].Flaeche * (0.5 * truss[i].F[0] + truss[i].F[1]) / 3.0

        // // entspricht F1 und F2 nach Krause für 4 Knotenelement
        // truss[i].F34[0] = truss[i].Flaeche * (13 * truss[i].F[0] + 2 * truss[i].F[1]) / 120.0
        // truss[i].F34[1] = truss[i].Flaeche * (2 * truss[i].F[0] + 13 * truss[i].F[1]) / 120.0
    }

    for (k = 0; k < neq; k++) R[k] = 0.0        // Aufstellen der rechten Seite

    for (k = 0; k < nelem; k++) {
        for (i = 0; i < 2; i++) {
            lmi = truss[k].lm[i]
            if (lmi >= 0) {
                R[lmi] = R[lmi] + truss[k].R2[i]
            }
        }
    }


    // Gleichungssystem lösen

    for (i = 0; i < neq; i++) {
        for (j = 0; j < neq; j++) {
            stiff[i][j] = stiff2[i][j];
        }
    }

    if (gauss(neq, stiff, R) != 0) {
        return fehler(msg('Das Gleichungssystem ist singulär.') + ' (2)');
    }

    for (i = 0; i < neq; i++) u[i] = R[i];


    u0 = 0.0   // Integration der Verschiebungen u über Querschnittsfläche, u0 wird bei Grafik von den berechneten Verschiebungen u abgezogen

    kappa_1 = 0.0
    kappa_2 = 0.0

    for (k = 0; k < nelem; k++) {

        for (j = 0; j < 2; j++) {                           // Elementverformungen am Anfang und Ende
            ieq = truss[k].lm[j]
            if (ieq === -1) {
                truss[k].u[j] = 0
            } else {
                truss[k].u[j] = u[ieq]
            }
        }

        tau_xs1 = truss[k].GModul / truss[k].sl * (truss[k].u[1] - truss[k].u[0])
        tau_xsm = tau_xs1
        tau_xs2 = tau_xs1
        tau_xs1 = tau_xs1 + truss[k].ni * truss[k].sl * (8 * truss[k].F[0] + 4 * truss[k].F[1]) / 24
        tau_xsm = tau_xsm + truss[k].ni * truss[k].sl * (-truss[k].F[0] + truss[k].F[1]) / 24
        tau_xs2 = tau_xs2 + truss[k].ni * truss[k].sl * (-4 * truss[k].F[0] - 8 * truss[k].F[1]) / 24

        truss[k].tau_s[0] = tau_xs1
        truss[k].tau_s[1] = tau_xsm
        truss[k].tau_s[2] = tau_xs2

        // Verformungen in den Mittelknoten

        truss[k].u[2] = (2 * truss[k].u[0] + truss[k].u[1]) / 3.0
            + (5 * truss[k].F[0] + 4 * truss[k].F[1]) * truss[k].sl * truss[k].sl / truss[k].GModul / 81;
        truss[k].u[3] = (truss[k].u[0] + 2 * truss[k].u[1]) / 3.0
            + (4 * truss[k].F[0] + 5 * truss[k].F[1]) * truss[k].sl * truss[k].sl / truss[k].GModul / 81;

        console.log("U", k, truss[k].u[0], truss[k].u[2], truss[k].u[3], truss[k].u[1])

        u0 = u0 + truss[k].ni * truss[k].Flaeche * (truss[k].u[0] + 3.0 * truss[k].u[2] + 3.0 * truss[k].u[3] + truss[k].u[1]) / 8.0

        kappa_1 += truss[k].dicke / truss[k].sl * (truss[k].u[0] - truss[k].u[1]) ** 2 + truss[k].dicke * truss[k].sl / 45.0 * (truss[k].sl * V1 / truss[k].GModul / I22) ** 2 * (truss[k].y1 ** 2 + 7.0 / 4.0 * truss[k].y1 * truss[k].y2 + truss[k].y2 ** 2)
        kappa_2 += truss[k].dicke / truss[k].sl * (truss[k].u[0] - truss[k].u[1]) ** 2 + truss[k].dicke * truss[k].sl / 45.0 * (truss[k].sl * V2 / truss[k].GModul / I11) ** 2 * (truss[k].z1 ** 2 + 7.0 / 4.0 * truss[k].z1 * truss[k].z2 + truss[k].z2 ** 2)
    }

    u0 = u0 / Gesamtflaeche
    console.log("###################  U 0 = ", u0)

    kappa_1 = V1 * V1 / Gesamtflaeche / kappa_1 / GModul / GModul
    console.log("###################  kappa_1 = ", kappa_1, V1, I11)
    kappa_2 = V2 * V2 / Gesamtflaeche / kappa_2 / GModul / GModul
    console.log("###################  kappa_2 = ", kappa_2, V2, I22)

    //---------------------------------
    // Normalspannungen aus N + My + Mz
    //---------------------------------
    for (i = 0; i < nelem; i++) {
        for (j = 0; j < 2; j++) {
            nodj = truss[i].nod[j]
            yj = node[nodj].yh
            zj = node[nodj].zh
            if (I_omega > 0.0000000000001) {
                sigma = truss[i].ni * (normalkraft / Gesamtflaeche + moment_1 / I11 * zj - moment_2 / I22 * yj + M_omega / I_omega * truss[i].omega[j])
            } else {
                sigma = truss[i].ni * (normalkraft / Gesamtflaeche + moment_1 / I11 * zj - moment_2 / I22 * yj)
            }
            if (j === 0) {
                truss[i].sigma_x[0] = sigma
            } else {
                truss[i].sigma_x[2] = sigma
            }
        }
        truss[i].sigma_x[1] = (truss[i].sigma_x[0] + truss[i].sigma_x[2]) / 2

        // Berechnung der Spannungen in den 4 Eckpunkten der Elementfläche für Grafik

        for (j = 0; j < 4; j++) {
            if (j === 0 || j === 3) { k = 0 }
            else { k = 1 };
            ys = truss[i].pts_y[j] - Gesamt_ys
            zs = truss[i].pts_z[j] - Gesamt_zs
            yj = co0 * ys + si0 * zs;         // Umrechnung ins Hauptachensystem
            zj = -si0 * ys + co0 * zs;
            if (I_omega > 0.0000000000001) {
                truss[i].sigma_xe[j] = truss[i].ni * (normalkraft / Gesamtflaeche + moment_1 / I11 * zj - moment_2 / I22 * yj + M_omega / I_omega * truss[i].omega[k])
            } else {
                truss[i].sigma_xe[j] = truss[i].ni * (normalkraft / Gesamtflaeche + moment_1 / I11 * zj - moment_2 / I22 * yj)
            }
        }
    }

    //---------------------------------
    // Berechne Vergleichsspannung
    //---------------------------------

    for (i = 0; i < nelem; i++) {
        for (j = 0; j < 3; j++) {
            sigma2 = truss[i].sigma_x[j] ** 2
            tau_R = truss[i].tau_p0R[j] + truss[i].tau_p1[j] + truss[i].tau_s[j]
            tau_L = truss[i].tau_p0L[j] + truss[i].tau_p1[j] + truss[i].tau_s[j]
            truss[i].stress_R[j] = tau_R
            truss[i].stress_L[j] = tau_L
            tau_R = Math.abs(tau_R)
            tau_L = Math.abs(tau_L)
            if (tau_R > tau_L) {
                truss[i].sigma_v[j] = Math.sqrt(sigma2 + 3 * tau_R ** 2)
            } else {
                truss[i].sigma_v[j] = Math.sqrt(sigma2 + 3 * tau_L ** 2)
            }
        }
    }

    const t1 = performance.now();
    console.log(`FEM Berechnung took ${t1 - t0} milliseconds`)

    tabQWerte.ys = byId("ys").innerText = myFormat(Gesamt_ys * unit_length_factor, 2, 2)   // Gesamt_ys.toFixed(2);
    tabQWerte.zs = byId("zs").innerText = myFormat(Gesamt_zs * unit_length_factor, 2, 2);
    tabQWerte.area = byId("area").innerText = myFormat(Gesamtflaeche, 2, 2);
    tabQWerte.area_geom = byId("area_geom").innerText = myFormat(area_geom, 2, 2);
    tabQWerte.Iyy = byId("Iys").innerText = myFormat(Gesamt_Iyy, 2, 2);
    tabQWerte.Izz = byId("Izs").innerText = myFormat(Gesamt_Izz, 2, 2);
    tabQWerte.Iyz = byId("Iyzs").innerText = myFormat(Gesamt_Iyz, 2, 2);
    tabQWerte.I11 = byId("I11").innerText = myFormat(I11, 1, 2);
    tabQWerte.I22 = byId("I22").innerText = myFormat(I22, 1, 2);
    tabQWerte.phi_h = byId("phi_h").innerText = myFormat((phi0 * 180.0 / Math.PI), 2, 2);

    tabQWerte.yM = byId("yM").innerText = myFormat(yM * unit_length_factor, 2, 2);
    tabQWerte.zM = byId("zM").innerText = myFormat(zM * unit_length_factor, 2, 2);
    tabQWerte.It = byId("I_t").innerText = myFormat(Gesamt_It, 1, 2);
    tabQWerte.Iomega = byId("I_omega").innerText = myFormat(I_omega, 1, 2);

    tabQWerte.r1 = byId("r_1").innerText = myFormat(ry, 2, 2);
    tabQWerte.r2 = byId("r_2").innerText = myFormat(rz, 2, 2);
    if (I_omega > 0.0000000000001) {
        tabQWerte.r_omega = byId("r_omega").innerText = myFormat(rOmega, 2, 2);
    } else {
        tabQWerte.r_omega = byId("r_omega").innerText = "-";
    }
    tabQWerte.i_M2 = byId("i_M2").innerText = myFormat(iM2, 2, 2);
    tabQWerte.i_p2 = byId("i_p2").innerText = myFormat(iP2, 2, 2);

    const collection = document.getElementsByClassName('unit_laenge');

    for (i = 0; i < collection.length; i++) {
        collection[i].innerHTML = current_unit_length;
    }

    // Altes löschen

    document.getElementById('id_spannung_mxp')?.remove();
    document.getElementById('id_spannung_mxs')?.remove();
    document.getElementById('id_schubspannung')?.remove();
    document.getElementById('id_normalspannung')?.remove();
    document.getElementById('id_vergleichsspannung')?.remove();

    document.getElementById('id_table_spannung_mxp')?.remove();
    document.getElementById('id_table_spannung_mxs')?.remove();
    document.getElementById('id_table_schubspannung')?.remove();
    document.getElementById('id_table_normalspannung')?.remove();
    document.getElementById('id_table_vergleichsspannung')?.remove();

    document.getElementById('id_schubkorrektur')?.remove();

    // Spannungen aus primärer Torsion
    {
        const myTableDiv = byId("spannung_mxp");  //in div

        const tag = document.createElement("p"); // <p></p>
        tag.setAttribute("id", "id_spannung_mxp");
        const text = document.createTextNode("xxx");
        tag.appendChild(text);
        tag.innerHTML = msg('Alle Spannungen in') + ' ' + current_unit_stress + '<br><br>' + msg('Schubspannungen aus primärer Torsion M<sub>xp</sub>')
        myTableDiv.appendChild(tag);

        const table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
        table.setAttribute("id", "id_table_spannung_mxp");
        table.style.border = 'none';
        myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)

        const thead = table.createTHead();
        const row = thead.insertRow();

        const th0 = thead.appendChild(document.createElement("th"));
        th0.innerHTML = "El No";
        th0.title = msg('Elementnummer')
        th0.setAttribute("class", "table_spannung_cell_center");
        row.appendChild(th0);
        const th1 = thead.appendChild(document.createElement("th"));
        th1.innerHTML = "&tau;<sub>xs0,L</sub>";
        th1.title = msg('Schubspannung linke Seite aus Anteil offener Querschnitt')
        row.appendChild(th1);
        const th2 = thead.appendChild(document.createElement("th"));
        th2.innerHTML = "&tau;<sub>xs0,R</sub>";
        th2.title = msg('Schubspannung rechte Seite aus Anteil offener Querschnitt')
        row.appendChild(th2);
        const th3 = thead.appendChild(document.createElement("th"));
        th3.innerHTML = "&tau;<sub>xs1</sub>";
        th3.title = msg('Schubspannung aus Anteil geschlossener Querschnitt')
        row.appendChild(th3);

        for (i = 0; i < nelem; i++) {

            let newRow = table.insertRow(-1);
            let newCell, newText
            newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

            newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
            newCell.appendChild(newText);
            newCell.setAttribute("class", "table_spannung_cell_center");

            newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].tau_p0L[0] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].tau_p0R[0] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].tau_p1[0] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);
        }
    }

    // Spannungen aus Querkraft und sekundärer Torsion
    {
        const myTableDiv = byId("spannung_mxs");  //in div

        const tag = document.createElement("p"); // <p></p>
        tag.setAttribute("id", "id_spannung_mxs");
        const text = document.createTextNode("xxx");
        tag.appendChild(text);
        tag.innerHTML = msg('Schubspannungen aus Querkräften und sekundärer Torsion M<sub>xs</sub>')
        myTableDiv.appendChild(tag);

        const table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
        table.setAttribute("id", "id_table_spannung_mxs");
        table.style.border = 'none';
        myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)

        let thead = table.createTHead();
        let row = thead.insertRow();

        const th0 = thead.appendChild(document.createElement("th"));
        th0.innerHTML = "El No";
        th0.title = msg('Elementnummer')
        row.appendChild(th0);
        th0.setAttribute("class", "table_spannung_cell_center");
        const th1 = thead.appendChild(document.createElement("th"));
        th1.innerHTML = "&tau;<sub>xsa</sub>";
        th1.title = msg('Schubspannung am Elementanfang, Elementknoten 1')
        row.appendChild(th1);
        const th2 = thead.appendChild(document.createElement("th"));
        th2.innerHTML = "&tau;<sub>xsm</sub>";
        th2.title = msg('Schubspannung in Elementmitte')
        row.appendChild(th2);
        const th3 = thead.appendChild(document.createElement("th"));
        th3.innerHTML = "&tau;<sub>xse</sub>";
        th3.title = msg('Schubspannung am Elementende, Elementknoten 2')
        row.appendChild(th3);

        let tbody = table.createTBody();

        for (i = 0; i < nelem; i++) {

            let newRow = tbody.insertRow(-1);
            let newCell, newText
            newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

            newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
            newCell.appendChild(newText);
            newCell.setAttribute("class", "table_spannung_cell_center");

            newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].tau_s[0] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].tau_s[1] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].tau_s[2] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);
        }
    }

    // Schubspannungen aus allen Anteilen
    {
        const myTableDiv = byId("schubspannung");  //in div

        const tag = document.createElement("p"); // <p></p>
        tag.setAttribute("id", "id_schubspannung");
        let text: Text
        text = document.createTextNode(msg('Schubspannungen aus Querkräften, primärem und sekundärem Torsionsmoment'));
        tag.appendChild(text);
        myTableDiv.appendChild(tag);

        const table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
        table.setAttribute("id", "id_table_schubspannung");
        table.style.border = 'none';
        myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)

        const thead = table.createTHead();
        const row = thead.insertRow();

        const th0 = thead.appendChild(document.createElement("th"));
        th0.innerHTML = "El No";
        th0.title = msg('Elementnummer')
        th0.setAttribute("class", "table_spannung_cell_center");
        row.appendChild(th0);
        const th1 = thead.appendChild(document.createElement("th"));
        th1.innerHTML = "&tau;<sub>a,L</sub>";
        th1.title = msg('Schubspannung am Elementanfang, Elementknoten 1, linke Seite')
        row.appendChild(th1);
        const th2 = thead.appendChild(document.createElement("th"));
        th2.innerHTML = "&tau;<sub>m,L</sub>";
        th2.title = msg('Schubspannung in Elementmitte, linke Seite')
        row.appendChild(th2);
        const th3 = thead.appendChild(document.createElement("th"));
        th3.innerHTML = "&tau;<sub>e,L</sub>";
        th3.title = msg('Schubspannung am Elementende, Elementknoten 2, linke Seite')
        row.appendChild(th3);
        const th4 = thead.appendChild(document.createElement("th"));
        th4.innerHTML = "&tau;<sub>a,R</sub>";
        th4.title = msg('Schubspannung am Elementanfang, Elementknoten 1, rechte Seite')
        row.appendChild(th4);
        const th5 = thead.appendChild(document.createElement("th"));
        th5.innerHTML = "&tau;<sub>m,R</sub>";
        th5.title = msg('Schubspannung in Elementmitte, rechte Seite')
        row.appendChild(th5);
        const th6 = thead.appendChild(document.createElement("th"));
        th6.innerHTML = "&tau;<sub>e,R</sub>";
        th6.title = msg('Schubspannung am Elementende, Elementknoten 2, rechte Seite')
        row.appendChild(th6);

        let newRow = table.insertRow(-1);
        let newCell, newText
        newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0
        newText = document.createTextNode(" ");  // Append a text node to the cell
        newCell.appendChild(newText);
        newCell.colSpan = 1

        newCell = newRow.insertCell(1);  // Insert a cell in the row at index 0
        newText = document.createTextNode(msg('linke Seite'));
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center1");
        newCell.colSpan = 3
        newCell = newRow.insertCell(2);  // Insert a cell in the row at index 0
        newText = document.createTextNode(msg('rechte Seite'));
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center1");
        newCell.colSpan = 3

        for (i = 0; i < nelem; i++) {

            let newRow = table.insertRow(-1);
            let newCell, newText
            newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

            newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
            newCell.appendChild(newText);
            newCell.setAttribute("class", "table_spannung_cell_center");

            newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].stress_L[0] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].stress_L[1] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].stress_L[2] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(4);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].stress_R[0] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(5);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].stress_R[1] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(6);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].stress_R[2] * unit_stress_factor, 2, 2));  // Append a text node to the cell
            newCell.appendChild(newText);
        }
    }

    // Spannungen aus Normalkraft, Biegemoment und Wölbbimoment
    {
        const myTableDiv = byId("normalspannung");  //in div

        const tag = document.createElement("p"); // <p></p>
        tag.setAttribute("id", "id_normalspannung");
        const text = document.createTextNode("xxx");
        tag.appendChild(text);
        tag.innerHTML = msg('Normalspannungen aus Normalkraft, Biegemomenten und Wölbbimoment')
        myTableDiv.appendChild(tag);

        const table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
        table.setAttribute("id", "id_table_normalspannung");
        table.style.border = 'none';
        myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)

        const thead = table.createTHead();
        const row = thead.insertRow();

        const th0 = thead.appendChild(document.createElement("th"));
        th0.innerHTML = "El No";
        th0.title = msg('Elementnummer')
        th0.setAttribute("class", "table_spannung_cell_center");
        row.appendChild(th0);
        const th1 = thead.appendChild(document.createElement("th"));
        th1.innerHTML = "&sigma;<sub>xa</sub>";
        th1.title = msg('Normalspannung in Mittellinie, Elementanfang')
        row.appendChild(th1);
        const th2 = thead.appendChild(document.createElement("th"));
        th2.innerHTML = "&sigma;<sub>xe</sub>";
        th2.title = msg('Normalspannung in Mittellinie, Elementende')
        row.appendChild(th2);

        for (i = 0; i < nelem; i++) {

            let newRow = table.insertRow(-1);
            let newCell, newText
            newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

            newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
            newCell.appendChild(newText);
            newCell.setAttribute("class", "table_spannung_cell_center");

            newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].sigma_x[0] * unit_stress_factor, 3, 3));  // Append a text node to the cell
            newCell.appendChild(newText);

            newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].sigma_x[2] * unit_stress_factor, 3, 3));  // Append a text node to the cell
            newCell.appendChild(newText);

        }
    }
    // Vergleichsspannungen
    {
        const myTableDiv = byId("vergleichsspannung");  //in div

        const tag = document.createElement("p"); // <p></p>
        tag.setAttribute("id", "id_vergleichsspannung");
        const text = document.createTextNode("xxx");
        tag.appendChild(text);
        tag.innerHTML = msg('von Mises Vergleichsspannungen')
        myTableDiv.appendChild(tag);

        const table = document.createElement("TABLE") as HTMLTableElement;
        table.setAttribute("id", "id_table_vergleichsspannung");
        table.style.border = 'none';
        myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)

        const thead = table.createTHead();
        const row = thead.insertRow();

        const th0 = thead.appendChild(document.createElement("th"));
        th0.innerHTML = "El No";
        th0.title = msg('Elementnummer')
        th0.setAttribute("class", "table_spannung_cell_center");
        row.appendChild(th0);
        const th1 = thead.appendChild(document.createElement("th"));
        th1.innerHTML = "&sigma;<sub>va</sub>";
        th1.title = msg('Größtwert der Vergleichsspannung, Elementanfang')
        row.appendChild(th1);
        const th2 = thead.appendChild(document.createElement("th"));
        th2.innerHTML = "&sigma;<sub>vm</sub>";
        th2.title = msg('Größtwert der Vergleichsspannung, Elementmitte')
        row.appendChild(th2);
        const th3 = thead.appendChild(document.createElement("th"));
        th3.innerHTML = "&sigma;<sub>ve</sub>";
        th3.title = msg('Größtwert der Vergleichsspannung, Elementende')
        row.appendChild(th3);

        for (i = 0; i < nelem; i++) {

            let newRow = table.insertRow(-1);
            let newCell, newText
            newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

            newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
            newCell.appendChild(newText);
            newCell.setAttribute("class", "table_spannung_cell_center");

            newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].sigma_v[0] * unit_stress_factor, 3, 3));  // Append a text node to the cell
            newCell.appendChild(newText);
            if (truss[i].sigma_v[0] > fyRd) newCell.style.color = 'red'

            newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].sigma_v[1] * unit_stress_factor, 3, 3));  // Append a text node to the cell
            newCell.appendChild(newText);
            if (truss[i].sigma_v[1] > fyRd) newCell.style.color = 'red'

            newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
            newText = document.createTextNode(myFormat(truss[i].sigma_v[2] * unit_stress_factor, 3, 3));  // Append a text node to the cell
            newCell.appendChild(newText);
            if (truss[i].sigma_v[2] > fyRd) newCell.style.color = 'red'

        }
    }

    // Berechnung der Schubkorrekturfaktoren

    let disp = new Array(4).fill(0.0)
    kappa_1 = 0.0
    kappa_2 = 0.0

    for (let loop = 0; loop < 2; loop++) {
        if (loop === 0) {  // 1-Richtung
            V1 = 1.0
            V2 = 0.0
            Mt2 = 0.0
        } else {   // 2-Richtung
            V1 = 0.0
            V2 = 1.0
            Mt2 = 0.0
        }

        //V1 = co0 * Vy + si0 * Vz                     // Querkräfte im Hauptachsensystem
        //V2 = -si0 * Vy + co0 * Vz

        for (i = 0; i < nelem; i++) {
            if (I_omega > 0.0000000000001) {
                truss[i].F[0] = V2 / I11 * truss[i].z1 + V1 / I22 * truss[i].y1 + Mt2 / I_omega * truss[i].omega[0]
                truss[i].F[1] = V2 / I11 * truss[i].z2 + V1 / I22 * truss[i].y2 + Mt2 / I_omega * truss[i].omega[1]
            } else {
                // wölbfreier Querschnitt
                truss[i].F[0] = V2 / I11 * truss[i].z1 + V1 / I22 * truss[i].y1
                truss[i].F[1] = V2 / I11 * truss[i].z2 + V1 / I22 * truss[i].y2
            }

            truss[i].R2[0] = truss[i].ni * truss[i].Flaeche * (truss[i].F[0] + 0.5 * truss[i].F[1]) / 3.0
            truss[i].R2[1] = truss[i].ni * truss[i].Flaeche * (0.5 * truss[i].F[0] + truss[i].F[1]) / 3.0
        }

        R.fill(0.0)        // Aufstellen der rechten Seite

        for (k = 0; k < nelem; k++) {
            for (i = 0; i < 2; i++) {
                lmi = truss[k].lm[i]
                if (lmi >= 0) {
                    R[lmi] = R[lmi] + truss[k].R2[i]
                }
            }
        }

        // Gleichungssystem lösen

        for (i = 0; i < neq; i++) {
            for (j = 0; j < neq; j++) {
                stiff[i][j] = stiff2[i][j];
            }
        }

        if (gauss(neq, stiff, R) != 0) {
            return fehler(msg('Das Gleichungssystem ist singulär.') + ' (3)');
        }

        for (i = 0; i < neq; i++) u[i] = R[i];

        for (k = 0; k < nelem; k++) {

            for (j = 0; j < 2; j++) {                           // Elementverformungen
                ieq = truss[k].lm[j]
                if (ieq === -1) {
                    disp[j] = 0.0
                } else {
                    disp[j] = u[ieq]
                }
            }

            // Verformungen in den Mittelknoten

            disp[2] = (2 * disp[0] + disp[1]) / 3.0 + (5 * truss[k].F[0] + 4 * truss[k].F[1]) * truss[k].sl * truss[k].sl / truss[k].GModul / 81;
            disp[3] = (disp[0] + 2 * disp[1]) / 3.0 + (4 * truss[k].F[0] + 5 * truss[k].F[1]) * truss[k].sl * truss[k].sl / truss[k].GModul / 81;

            if (loop === 0) {
                kappa_1 += truss[k].dicke / truss[k].sl * (disp[0] - disp[1]) ** 2 + truss[k].dicke * truss[k].sl / 45.0 * (truss[k].sl * V1 / truss[k].GModul / I22) ** 2 * (truss[k].y1 ** 2 + 7.0 / 4.0 * truss[k].y1 * truss[k].y2 + truss[k].y2 ** 2)
            } else {
                kappa_2 += truss[k].dicke / truss[k].sl * (disp[0] - disp[1]) ** 2 + truss[k].dicke * truss[k].sl / 45.0 * (truss[k].sl * V2 / truss[k].GModul / I11) ** 2 * (truss[k].z1 ** 2 + 7.0 / 4.0 * truss[k].z1 * truss[k].z2 + truss[k].z2 ** 2)
            }
        }
        if (loop === 0) {
            kappa_1 = V1 * V1 / Gesamtflaeche / kappa_1 / GModul / GModul
        } else {
            kappa_2 = V2 * V2 / Gesamtflaeche / kappa_2 / GModul / GModul
        }

    }

    console.log("Loop 0: V1 = 1, V2 = 0");
    console.log("###################  kappa_1 = ", kappa_1)

    console.log("Loop 1: V1 = 0, V2 = 1");
    console.log("###################  kappa_2 = ", kappa_2)

    {
        const myTableDiv = byId("schubkorrektur");  //in div

        const tag = document.createElement("p"); // <p></p>
        tag.setAttribute("id", "id_schubkorrektur");
        const text = document.createTextNode("xxx");
        tag.appendChild(text);
        tag.innerHTML = '<b>' + msg('Schubkorrekturfaktoren') + '</b><br>'
            + msg('für Querkraft V<sub>1</sub> in Hauptrichtung 1') + ': &kappa;<sub>&tau;</sub> = ' + myFormat(kappa_1, 3, 3) + '<br>'
            + msg('für Querkraft V<sub>2</sub> in Hauptrichtung 2') + ': &kappa;<sub>&tau;</sub> = ' + myFormat(kappa_2, 3, 3) + '<br>'
        myTableDiv.appendChild(tag);

    }

    // für die Grafik 

    ymin = 1.e30
    zmin = 1.e30
    ymax = -1.e30
    zmax = -1.e30

    for (i = 0; i < nnodes; i++) {
        if (node[i].y < ymin) ymin = node[i].y;
        if (node[i].z < zmin) zmin = node[i].z;
        if (node[i].y > ymax) ymax = node[i].y;
        if (node[i].z > zmax) zmax = node[i].z;
    }

    // Schubmittelpunkt kann ausserhalb liegen

    const yMq = yM + Gesamt_ys  // bezogen auf Hilfskoordinatensystem
    const zMq = zM + Gesamt_zs

    if (yMq < ymin) ymin = yMq;
    if (zMq < zmin) zmin = zMq;
    if (yMq > ymax) ymax = yMq;
    if (zMq > zmax) zmax = zMq;

    slmax = Math.sqrt((ymax - ymin) ** 2 + (zmax - zmin) ** 2)

    app.gerechnet = true;
    berechnungErforderlich(false);
    document.dispatchEvent(new CustomEvent('berechnet', { detail: { zeigeErgebnisse } }));
}

/** Berechnung abbrechen und den Grund anzeigen. */
function fehler(text: string): void {
    app.gerechnet = false;
    void alertdialog('ok', text);
}

