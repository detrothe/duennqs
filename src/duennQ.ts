
import { berechnungErfolgreich } from "./globals.js";
import { resizeTable, tabulate } from "./base_tabelle.js"
import './dateien.js';
import { gauss } from "./gauss.js"
import { testeZahl, sichtbar, testNumber } from './utility.js';
import { clear_Tabelle, nelem, nnodes } from "./duennQ_tabelle.js";
import { label_svg } from "./systemlinien";
import { set_myScreen } from "./index.js"
import { draw_elements } from "./grafik_3D";
//import {set_nnodes, set_nelem} from "./duennQ_tabelle.js"


export let ymin = -50.0, zmin = -50.0, ymax = 50.0, zmax = 50.0, slmax = 0.0;

//------------------------------------------------------------------------------------------------



function setMaterialEqual(ev) {
    const input = document.getElementById('material_equal') as HTMLInputElement | null;
    console.log("in setMaterialEqual", input.checked);


    const tabelle = document.getElementById("elemTable") as HTMLTableElement | null;

    //let nSpalten = tabelle.rows[0].cells.length;

    if (ev.target.checked) {
        console.log("editable", document.getElementById("EMod_ref").isContentEditable);
        document.getElementById("EMod_ref").hidden = true;
        document.getElementById("mue_ref").hidden = true;
        console.log("Anzahl Zeilen", tabelle.rows.length);
        for (let i = 1; i < tabelle.rows.length; i++) {
            for (let j = 1; j < 3; j++) {
                //tabelle.rows[i].cells[j].innerText = 'NO';
                tabelle.rows[i].cells[j].contentEditable = 'false';
                tabelle.rows[i].cells[j].classList.add('unsichtbar');
            }
        }
    } else {
        console.log("editable", document.getElementById("EMod_ref").isContentEditable);
        document.getElementById("EMod_ref").hidden = false;
        document.getElementById("mue_ref").hidden = false;
        for (let i = 1; i < tabelle.rows.length; i++) {
            for (let j = 1; j < 3; j++) {
                //tabelle.rows[i].cells[j].innerText = 'edit';
                tabelle.rows[i].cells[j].contentEditable = 'true';
                tabelle.rows[i].cells[j].classList.remove('unsichtbar');
            }
        }
    }
    /*
        if ( input.checked ) {
            document.getElementById("EMod_ref").contentEditable = 'false'; //.hidden=true;
            document.getElementById("mue_ref").hidden=true;
        } else {
            document.getElementById("EMod_ref").contentEditable = 'true'; //.hidden=false;
            document.getElementById("mue_ref").hidden=false;
        }

     */
}


export let node = []
export let truss = []
export let I_omega: number
export let Gesamt_ys: number
export let Gesamt_zs: number
export let yM: number
export let zM: number                              // Schubmittelpunkt bezogen auf Schwerpunkt im yz-Koordinatensystem
export let phi0: number

class TNode {
    y: number = 1.0
    z: number = 1.0
    yh: number = 1.0                                // entspricht Koordinate in Hauptrichtung 1 (eta), Ursprung liegt im Schwerpunkt
    zh: number = 1.0                                // entspricht Koordinate in Hauptrichtung 2 (ksi)
    omega: number = 0.0
    Lx: number = 0                                  // Lagerbedingung  bei Eingabe: 0=frei, 1=fest, später enthält L() die Gleichungsnummern
}

class TElement {
    EModul: number
    GModul: number
    mue: number                                    // Querdehnzahl
    ni: number                                     // Verhältnis Ei/E
    ngi: number                                    // Verhältnis Gi/G
    dicke: number
    sl: number                                     // Stablänge
    nod = [0, 0]                                   // globale Knotennummer der Stabenden
    lm = [0, 0]
    estiff = [[0.0, 0.0], [0.0, 0.0]]
    F = [0.0, 0.0]
    cosinus: number
    sinus: number
    alpha: number
    rt: number
    Flaeche: number
    Iyy: number
    Izz: number
    Iyz: number
    Hebely: number
    Hebelz: number
    R = [0.0, 0.0]                               // rechte Seite
    R2 = [0.0, 0.0]
    omegaQ = [0.0, 0.0]
    y1: number                                 // Koordinaten im Hauptsystem
    y2: number
    z1: number
    z2: number
    omega = [0.0, 0.0]
    u = [0.0, 0.0]
    ry: number                                 // Querschnittswerte für Biegedrillknicken
    rz: number
    rOmega: number
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
}


//const elemObj = {};
//const nodeObj = {};
const elemArray = [];
const nodeArray = [];

// @ts-ignore
//elemObj.elemArray = elemArray;
// @ts-ignore
//nodeObj.nodeArray = nodeArray;

for (let i = 1; i <= nnodes; i++) {
    let punkt = {
        "1": 1,
        "2": 2
    }

    // @ts-ignore
    //    nodeObj.nodeArray.push(punkt);
    nodeArray.push(punkt);
}

for (let i = 1; i <= nelem; i++) {
    //selectedCellPoly.selColY.push(false);
    //selectedCellPoly.selColZ.push(false);

    let punkt = {
        "1": 1,
        "2": 2,
    }

    // @ts-ignore
    //    elemObj.elemArray.push(punkt);
    elemArray.push(punkt);
}

//const xx = [-10.0, 20.0, 50.0, 20.0, 40.0, 0.0];
//const yy = [0.0, 0.0, 0.0, 40.0, 40.0, 40.0];

const xx = [0.0, 20.0, 20.0, 0.0];
const yy = [0.0, 0.0, 20.0, 20.0];



tabulate('#knotentabelle', 'nodeTable', nodeArray, ['No', 'y [cm]', 'z [cm]']);  // nodeObj.

tabulate('#elementtabelle', 'elemTable', elemArray, ["El No", 'E-Modul [kN/cm²]', 'ν', 'Dicke t [cm]', 'nod1', 'nod2']);  // elemObj.


const nTabelle = document.getElementById("nodeTable") as HTMLTableElement;
let objCells = nTabelle.rows.item(0).cells;  // Überschrift Punkt zentrieren
objCells.item(0).style.textAlign = "center";

let nSpalten = nTabelle.rows[0].cells.length - 1;

nTabelle.rows.item(0).cells.item(0).style.width = '50px'

for (let i = 1; i < nTabelle.rows.length; i++) {
    const objCells = nTabelle.rows.item(i).cells;
    objCells.item(0).contentEditable = 'false';
    objCells.item(0).style.textAlign = "center";
    objCells.item(0).style.backgroundColor = 'rgb(150,180, 180)';
    objCells.item(0).style.border = 'none';
    objCells.item(0).style.width = '50px'

    for (let j = 1; j <= nSpalten; j++) {
        objCells.item(j).id = "nodeTable-" + i + "-" + j;
        if (j === 1) {
            objCells.item(j).innerText = String(xx[i - 1]);
        } else if (j === 2) {
            objCells.item(j).innerText = String(yy[i - 1]);
        }
        // @ts-ignore
        objCells.item(j).wrap = false;
        // @ts-ignore
        objCells.item(j).selekt = false;
        //objCells.item(j).setAttribute("selekt", "false");
    }
    //console.log(objCells.item(0));
}

const eTabelle = document.getElementById("elemTable") as HTMLTableElement;
objCells = eTabelle.rows.item(0).cells;  // Überschrift Punkt zentrieren
objCells.item(0).style.textAlign = "center";
nSpalten = eTabelle.rows[0].cells.length - 1;

eTabelle.rows.item(0).cells.item(0).style.width = '50px'

for (let i = 1; i < eTabelle.rows.length; i++) {
    const objCells = eTabelle.rows.item(i).cells;
    objCells.item(0).contentEditable = 'false';
    objCells.item(0).style.textAlign = "center";
    objCells.item(0).style.backgroundColor = 'rgb(150,180, 180)';
    objCells.item(0).style.border = 'none';
    objCells.item(0).style.width = '50px'

    for (let j = 1; j <= nSpalten; j++) {
        objCells.item(j).id = "elemTable-" + i + "-" + j;
        if (j === 1) {
            objCells.item(j).innerText = String(21000);
        } else if (j === 2) {
            objCells.item(j).innerText = String(0.3);
        } else if (j === 3) {
            objCells.item(j).innerText = String(0.5);
        }
        // @ts-ignore
        objCells.item(j).wrap = false;
        // @ts-ignore
        objCells.item(j).selekt = false;
        //objCells.item(j).setAttribute("selekt", "false");


    }
}
// Inzidenzen
/*
eTabelle.rows[1].cells[4].innerText = "1";
eTabelle.rows[1].cells[5].innerText = "2";
eTabelle.rows[2].cells[4].innerText = "2";
eTabelle.rows[2].cells[5].innerText = "3";
eTabelle.rows[3].cells[4].innerText = "2";
eTabelle.rows[3].cells[5].innerText = "4";
eTabelle.rows[4].cells[4].innerText = "5";
eTabelle.rows[4].cells[5].innerText = "4";
eTabelle.rows[5].cells[4].innerText = "4";
eTabelle.rows[5].cells[5].innerText = "6";
*/
eTabelle.rows[1].cells[4].innerText = "1";
eTabelle.rows[1].cells[5].innerText = "2";
eTabelle.rows[2].cells[4].innerText = "2";
eTabelle.rows[2].cells[5].innerText = "3";
eTabelle.rows[3].cells[4].innerText = "3";
eTabelle.rows[3].cells[5].innerText = "4";
eTabelle.rows[4].cells[4].innerText = "4";
eTabelle.rows[4].cells[5].innerText = "1";


//----------------------------------------------------------------------------------------------

export function duennQ() {
    //----------------------------------------------------------------------------------------------

    //let node = []
    //let truss = []


    let i: number, neq: number
    let j: number, k: number, nod1: number, nod2: number, lmi: number, lmj: number, kn: number, ieq: number;
    let y1: number, y2: number, z1: number, z2: number, ys: number, zs: number, dy: number, dz: number, t: number,
        sl: number, h: number, si2: number, co2: number;
    let si: number, co: number, sico: number, si0: number, co0: number, cc: number, bb: number, cr: number;
    let Hebely: number, Hebelz: number;
    let iP2: number, iM2: number;
    let fact: number, A_omegaQ: number, A_yOmegaQ: number, A_zOmegaQ: number, rOmega: number, dOmega: number;
    let It_geschlossen: number, omega_m: number, area: number;
    let rt: number, ry: number, rz: number, y_m: number, z_m: number;

    let Gesamtflaeche: number, I11: number, I22: number,
        Gesamt_Iyy: number, Gesamt_Izz: number, Gesamt_Iyz: number, Gesamt_It: number, It_offen: number,
        yMh: number, zMh: number                             // Schubmittelpunkt bezogen auf Schwerpunkt im Hauptachsensystem

    let tau_xs1: number, tau_xs2: number, tau_xsm: number, tau_xs_1: number, tau_xs_0: number
    let normalkraft: number, moment_y: number, moment_z: number, moment_1: number, moment_2: number
    let M_omega: number
    let Vy: number, Vz: number, V1: number, V2: number, Mt1: number, Mt2: number

    let yj: number, zj: number, nodj: number
    let sigma: number, sigma2: number, tau_L: number, tau_R: number, fyRd: number

    let wert: any

    let EModul: number, mue: number;
    //let nelem: number = 2

    berechnungErfolgreich( false );
    
    set_myScreen();

    // Schnittgrößen einlesen
    let input = document.getElementById('Vy') as HTMLInputElement | null;
    Vy = Number(testeZahl(input.value));
    input = document.getElementById('Vz') as HTMLInputElement | null;
    Vz = Number(testeZahl(input.value));
    input = document.getElementById('Nx') as HTMLInputElement | null;
    normalkraft = Number(testeZahl(input.value));
    input = document.getElementById('Mxp') as HTMLInputElement | null;
    Mt1 = Number(testeZahl(input.value));
    input = document.getElementById('Mxs') as HTMLInputElement | null;
    Mt2 = Number(testeZahl(input.value));
    input = document.getElementById('Momega') as HTMLInputElement | null;
    M_omega = Number(testeZahl(input.value));
    input = document.getElementById('My') as HTMLInputElement | null;
    moment_y = Number(testeZahl(input.value));
    input = document.getElementById('Mz') as HTMLInputElement | null;
    moment_z = Number(testeZahl(input.value));

    input = document.getElementById('fyRd') as HTMLInputElement | null;
    fyRd = Number(testeZahl(input.value));

    while (node.length > 0) node.pop();
    while (truss.length > 0) truss.pop();

    for (i = 0; i < nnodes; i++) {
        node.push(new TNode())
    }

    for (i = 0; i < nelem; i++) {
        truss.push(new TElement())
    }

    const material_equal = document.getElementById('material_equal') as HTMLInputElement | null;
    console.log("in setMaterialEqual", material_equal.checked);


    if (material_equal.checked) {
        EModul = 21000.0;
        mue = 0.3;
    } else {
        input = document.getElementById('EMod_ref') as HTMLInputElement | null;
        EModul = Number(testeZahl(input.value));
        if (EModul < 1e-12) {
            alert("Referenz-Emodul muss größer 0 sein")
            return;
        }
        input = document.getElementById('mue_ref') as HTMLInputElement | null;
        mue = Number(testeZahl(input.value));
        if (mue < 0) {
            alert("Referenz-Querdehnung muss größer oder gleich 0 sein")
            return;
        }
    }
    const GModul = EModul / 2.0 / (1.0 + mue)
    console.log("Bezugswerte", EModul, mue, GModul)

    // Knoten Eingabe einlesen

    const nTabelle = document.getElementById("nodeTable") as HTMLTableElement;

    for (i = 0; i < nnodes; i++) {

        wert = nTabelle.rows[i + 1].cells[1].innerText
        node[i].y = Number(testNumber(wert, i + 1, 1, 'nodeTable'));
        wert = nTabelle.rows[i + 1].cells[2].innerText
        node[i].z = Number(testNumber(wert, i + 1, 2, 'nodeTable'));
        console.log("node,y,z", i, node[i].y, node[i].z)
    }

    // Elemente Eingabe einlesen

    const eTabelle = document.getElementById("elemTable") as HTMLTableElement;

    for (i = 0; i < nelem; i++) {

        if (material_equal.checked) {
            truss[i].EModul = 21000.0;
            truss[i].mue = 0.3;
        } else {
            wert = eTabelle.rows[i + 1].cells[1].innerText
            truss[i].EModul = Number(testNumber(wert, i + 1, 1, 'elemTable'));
            if (truss[i].EModul < 1e-12) {
                alert("Emodul von Element " + String(i + 1) + " muss größer 0 sein")
                return;
            }
            wert = eTabelle.rows[i + 1].cells[2].innerText
            truss[i].mue = Number(testNumber(wert, i + 1, 2, 'elemTable'));
            if (truss[i].mue < 0) {
                alert("Querdehnung von Element " + String(i + 1) + " muss größer oder gleich 0 sein")
                return;
            }
        }
        wert = eTabelle.rows[i + 1].cells[3].innerText
        truss[i].dicke = Number(testNumber(wert, i + 1, 3, 'elemTable'));
        if (truss[i].dicke < 1e-12) {
            alert("Dicke von Element " + String(i + 1) + " muss größer 0 sein")
            return;
        }
        wert = eTabelle.rows[i + 1].cells[4].innerText
        truss[i].nod[0] = Number(testNumber(wert, i + 1, 4, 'elemTable')) - 1;
        if (truss[i].nod[0] < 0) {
            alert("Knoteninzidenz nod1 von Element " + String(i + 1) + " muss größer 0 sein")
            return;
        }
        wert = eTabelle.rows[i + 1].cells[5].innerText
        truss[i].nod[1] = Number(testNumber(wert, i + 1, 5, 'elemTable')) - 1;
        if (truss[i].nod[1] < 0) {
            alert("Knoteninzidenz nod2 von Element " + String(i + 1) + " muss größer 0 sein")
            return;
        }
        console.log("truss", i, truss[i].EModul, truss[i].mue, truss[i].dicke, truss[i].nod[0], truss[i].nod[1])
        truss[i].GModul = truss[i].EModul / 2.0 / (1.0 + truss[i].mue)
        truss[i].ni = truss[i].EModul / EModul
        truss[i].ngi = truss[i].GModul / GModul
    }


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

        if (truss[i].sl < 1e-12) {
            alert("Länge von Element " + String(i + 1) + " ist null")
            return;
        }

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

    //    ReDim stiff(neq, neq), R(neq), u(neq), stiff2(neq, neq)
    //    TFMatrix2D<double> stiff(neq, neq), stiff2(neq, neq);
    //    TFVector<double>   R(neq), u(neq);

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
            //console.log("GlSystem", stiff[i][j]);
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
        console.log("Gleichungssystem singulär");
        return 1;
    }

    for (i = 0; i < neq; i++) u[i] = R[i];

    //for (i = 0; i < neq; i++) {       // Ausgabe der Verformungen mit interner Nummerierung
    //    console.log("u", i, u[i])
    //}

    for (i = 0; i < nnodes; i++) {     // Ausgabe der Verschiebungen der einzelnen Knoten
        ieq = node[i].Lx;
        if (ieq === -1) {
            //Sheets("Knoten").Cells(5 + i, 7) = 0
            node[i].omega = 0.0;
        } else {
            //Sheets("Knoten").Cells(5 + i, 7) = u(ieq)
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

    for (i = 0; i < nnodes; i++) {     // Berechnung der normierten Wölbordinaten
        node[i].omega = node[i].omega - A_omegaQ - node[i].zh * yMh + node[i].yh * zMh;
        //Sheets("Knoten").Cells(5 + i, 8) = node[i].omega;
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
        //Sheets("Eingabe").Cells(20 + k, 13) = tau_xs_1
        tau_xs_0 = truss[k].ngi * Mt1 / Gesamt_It * truss[k].dicke
        //Sheets("Eingabe").Cells(20 + k, 11) = tau_xs_0
        //((Sheets("Eingabe").Cells(20 + k, 12) = -tau_xs_0
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
        } else {
            // wölbfreier Querschnitt
            truss[i].F[0] = V2 / I11 * truss[i].z1 + V1 / I22 * truss[i].y1
            truss[i].F[1] = V2 / I11 * truss[i].z2 + V1 / I22 * truss[i].y2
        }

        truss[i].R2[0] = truss[i].ni * truss[i].Flaeche * (truss[i].F[0] + 0.5 * truss[i].F[1]) / 3.0
        truss[i].R2[1] = truss[i].ni * truss[i].Flaeche * (0.5 * truss[i].F[0] + truss[i].F[1]) / 3.0
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

    //For i = 1 To neq
    //Sheets("GlSystem").Cells(i + neq + 1, neq + 4) = R(i)
    //Next i

    // Gleichungssystem lösen

    if (gauss(neq, stiff2, R) != 0) {
        console.log("Gleichungssystem 2 singulär");
        return 1
    }

    for (i = 0; i < neq; i++) u[i] = R[i];

    //For i = 1 To neq                             ' Ausgabe der Verformungen mit interner Nummerierung
    //Sheets("GlSystem").Cells(i + neq + 1, neq + 2) = u(i)
    //Next i

    for (k = 0; k < nelem; k++) {
        for (j = 0; j < 2; j++) {                           // Stabverformungen
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
        //Sheets("Eingabe").Cells(20 + k, 8) = tau_xs1
        //Sheets("Eingabe").Cells(20 + k, 9) = tau_xsm
        //Sheets("Eingabe").Cells(20 + k, 10) = tau_xs2
        truss[k].tau_s[0] = tau_xs1
        truss[k].tau_s[1] = tau_xsm
        truss[k].tau_s[2] = tau_xs2
    }

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
            //Sheets("Eingabe").Cells(20 + i, 21 + j) = sigma
            if (j === 0) {
                truss[i].sigma_x[0] = sigma
            } else {
                truss[i].sigma_x[2] = sigma
            }
        }
        truss[i].sigma_x[1] = (truss[i].sigma_x[0] + truss[i].sigma_x[2]) / 2
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
            //Sheets("Eingabe").Cells(20 + i, 24 + j) = truss[i].sigma_v(j)
            if (truss[i].sigma_v[j] > fyRd) {
                //Sheets("Eingabe").Cells(20 + i, 24 + j).Font.Color = -16776961
            } else {
                //Sheets("Eingabe").Cells(20 + i, 24 + j).Font.ColorIndex = xlAutomatic
            }

        }
    }

    document.getElementById("ys").innerText = Gesamt_ys.toFixed(2);
    document.getElementById("zs").innerText = Gesamt_zs.toFixed(2);
    document.getElementById("area").innerText = Gesamtflaeche.toFixed(2);
    document.getElementById("Iys").innerText = Gesamt_Iyy.toFixed(2);
    document.getElementById("Izs").innerText = Gesamt_Izz.toFixed(2);
    document.getElementById("Iyzs").innerText = Gesamt_Iyz.toFixed(2);
    document.getElementById("I11").innerText = I11.toFixed(2);
    document.getElementById("I22").innerText = I22.toFixed(2);
    document.getElementById("phi_h").innerText = (phi0 * 180.0 / Math.PI).toFixed(2);

    document.getElementById("yM").innerText = yM.toFixed(2);
    document.getElementById("zM").innerText = zM.toFixed(2);
    document.getElementById("I_t").innerText = Gesamt_It.toFixed(2);
    document.getElementById("I_omega").innerText = I_omega.toFixed(2);

    document.getElementById("r_1").innerText = ry.toFixed(2);
    document.getElementById("r_2").innerText = rz.toFixed(2);
    if (I_omega > 0.0000000000001) {
        document.getElementById("r_omega").innerText = rOmega.toFixed(2);
    } else {
        document.getElementById("r_omega").innerText = "-";
    }
    document.getElementById("i_M2").innerText = iM2.toFixed(2);
    document.getElementById("i_p2").innerText = iP2.toFixed(2);


    // Altes löschen

    let elem = document.getElementById('id_spannung_mxp');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_spannung_mxs');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_schubspannung');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_normalspannung');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_vergleichsspannung');
    if (elem !== null) elem.parentNode.removeChild(elem);

    elem = document.getElementById('id_table_spannung_mxp');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_table_spannung_mxs');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_table_schubspannung');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_table_normalspannung');
    if (elem !== null) elem.parentNode.removeChild(elem);
    elem = document.getElementById('id_table_vergleichsspannung');
    if (elem !== null) elem.parentNode.removeChild(elem);

    // Spannungen aus primärer Torsion

    let myTableDiv = document.getElementById("spannung_mxp");  //in div


    let tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_spannung_mxp");
    let text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "Alle Spannungen in kN/cm²<br><br>Schubspannungen aus primärer Torsion M<sub>xp</sub>"
    myTableDiv.appendChild(tag);

    let table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
    table.setAttribute("id", "id_table_spannung_mxp");
    table.border = '0';
    myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)


    table.createTHead();

    let th0 = table.tHead.appendChild(document.createElement("th"));
    th0.innerHTML = "El No";
    th0.title = "Elementnummer"
    th0.setAttribute("class", "table_spannung_cell_center");
    let th1 = table.tHead.appendChild(document.createElement("th"));
    th1.innerHTML = "&tau;<sub>xs0,L</sub>";
    th1.title = "Schubspannung linke Seite aus Anteil offener Querschnitt"
    let th2 = table.tHead.appendChild(document.createElement("th"));
    th2.innerHTML = "&tau;<sub>xs0,R</sub>";
    th2.title = "Schubspannung rechte Seite aus Anteil offener Querschnitt"
    let th3 = table.tHead.appendChild(document.createElement("th"));
    th3.innerHTML = "&tau;<sub>xs1</sub>";
    th3.title = "Schubspannung aus Anteil geschlossener Querschnitt"

    for (i = 0; i < nelem; i++) {

        let newRow = table.insertRow(-1);
        let newCell, newText
        newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

        newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center");

        newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].tau_p0L[0].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].tau_p0R[0].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].tau_p1[0].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);
    }

    // Spannungen aus Querkraft und sekundärer Torsion

    myTableDiv = document.getElementById("spannung_mxs");  //in div


    tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_spannung_mxs");
    text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "Schubspannungen aus Querkraft und sekundärer Torsion M<sub>xs</sub>"
    myTableDiv.appendChild(tag);

    table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
    table.setAttribute("id", "id_table_spannung_mxs");
    table.border = '0';
    myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)


    table.createTHead();

    th0 = table.tHead.appendChild(document.createElement("th"));
    th0.innerHTML = "El No";
    th0.title = "Elementnummer"
    th0.setAttribute("class", "table_spannung_cell_center");
    th1 = table.tHead.appendChild(document.createElement("th"));
    th1.innerHTML = "&tau;<sub>xs1</sub>";
    th1.title = "Schubspannung am Elementanfang, Elementknoten 1"
    th2 = table.tHead.appendChild(document.createElement("th"));
    th2.innerHTML = "&tau;<sub>xsm</sub>";
    th2.title = "Schubspannung in Elementmitte"
    th3 = table.tHead.appendChild(document.createElement("th"));
    th3.innerHTML = "&tau;<sub>xs2</sub>";
    th3.title = "Schubspannung am Elementende, Elementknoten 2"

    for (i = 0; i < nelem; i++) {

        let newRow = table.insertRow(-1);
        let newCell, newText
        newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

        newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center");

        newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].tau_s[0].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].tau_s[1].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].tau_s[2].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);
    }


    // Schubspannungen aus allen Anteilen

    myTableDiv = document.getElementById("schubspannung");  //in div


    tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_schubspannung");
    text = document.createTextNode("Schubspannungen aus Querkraft, primärer und sekundärer Torsion");
    tag.appendChild(text);
    myTableDiv.appendChild(tag);

    table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
    table.setAttribute("id", "id_table_schubspannung");
    table.border = '0';
    myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)


    table.createTHead();

    th0 = table.tHead.appendChild(document.createElement("th"));
    th0.innerHTML = "El No";
    th0.title = "Elementnummer"
    th0.setAttribute("class", "table_spannung_cell_center");
    th1 = table.tHead.appendChild(document.createElement("th"));
    th1.innerHTML = "&tau;<sub>1,L</sub>";
    th1.title = "Schubspannung am Elementanfang, Elementknoten 1, linke Seite"
    th2 = table.tHead.appendChild(document.createElement("th"));
    th2.innerHTML = "&tau;<sub>m,L</sub>";
    th2.title = "Schubspannung in Elementmitte, linke Seite"
    th3 = table.tHead.appendChild(document.createElement("th"));
    th3.innerHTML = "&tau;<sub>2,L</sub>";
    th3.title = "Schubspannung am Elementende, Elementknoten 2, linke Seite"
    let th4 = table.tHead.appendChild(document.createElement("th"));
    th4.innerHTML = "&tau;<sub>1,R</sub>";
    th4.title = "Schubspannung am Elementanfang, Elementknoten 1, rechte Seite"
    let th5 = table.tHead.appendChild(document.createElement("th"));
    th5.innerHTML = "&tau;<sub>m,R</sub>";
    th5.title = "Schubspannung in Elementmitte, rechte Seite"
    let th6 = table.tHead.appendChild(document.createElement("th"));
    th6.innerHTML = "&tau;<sub>2,R</sub>";
    th6.title = "Schubspannung am Elementende, Elementknoten 2, rechte Seite"

    let newRow = table.insertRow(-1);
    let newCell, newText
    newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0
    newText = document.createTextNode(" ");  // Append a text node to the cell
    newCell.appendChild(newText);
    newCell.colSpan = "1"

    newCell = newRow.insertCell(1);  // Insert a cell in the row at index 0
    newText = document.createTextNode("linke Seite");  // Append a text node to the cell
    newCell.appendChild(newText);
    newCell.setAttribute("class", "table_spannung_cell_center1");
    newCell.colSpan = "3"
    newCell = newRow.insertCell(2);  // Insert a cell in the row at index 0
    newText = document.createTextNode("rechte Seite");  // Append a text node to the cell
    newCell.appendChild(newText);
    newCell.setAttribute("class", "table_spannung_cell_center1");
    newCell.colSpan = "3"

    for (i = 0; i < nelem; i++) {

        let newRow = table.insertRow(-1);
        let newCell, newText
        newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

        newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center");

        newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].stress_L[0].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].stress_L[1].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].stress_L[2].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(4);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].stress_R[0].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(5);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].stress_R[1].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(6);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].stress_R[2].toFixed(2));  // Append a text node to the cell
        newCell.appendChild(newText);
    }


    // Spannungen aus Normalkraft, Biegemoment und Wölbbimoment

    myTableDiv = document.getElementById("normalspannung");  //in div


    tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_normalspannung");
    text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "Normalspannungen aus Normalkraft, Biegemoment und Wölbbimoment"
    myTableDiv.appendChild(tag);

    table = document.createElement("TABLE") as HTMLTableElement;   //TABLE??
    table.setAttribute("id", "id_table_normalspannung");
    table.border = '0';
    myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)


    table.createTHead();

    th0 = table.tHead.appendChild(document.createElement("th"));
    th0.innerHTML = "El No";
    th0.title = "Elementnummer"
    th0.setAttribute("class", "table_spannung_cell_center");
    th1 = table.tHead.appendChild(document.createElement("th"));
    th1.innerHTML = "&sigma;<sub>x1</sub>";
    th1.title = "Normalspannung in Mittellinie, Elementanfang"
    th2 = table.tHead.appendChild(document.createElement("th"));
    th2.innerHTML = "&sigma;<sub>x2</sub>";
    th2.title = "Normalspannung in Mittellinie, Elementende"

    for (i = 0; i < nelem; i++) {

        let newRow = table.insertRow(-1);
        let newCell, newText
        newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

        newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center");

        newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].sigma_x[0].toFixed(3));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].sigma_x[2].toFixed(3));  // Append a text node to the cell
        newCell.appendChild(newText);

    }

    // Vergleichsspannungen

    myTableDiv = document.getElementById("vergleichsspannung");  //in div


    tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_vergleichsspannung");
    text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "Vergleichsspannungen"
    myTableDiv.appendChild(tag);

    table = document.createElement("TABLE") as HTMLTableElement;
    table.setAttribute("id", "id_table_vergleichsspannung");
    table.border = '0';
    myTableDiv.appendChild(table);  //appendChild() insert it in the document (table --> myTableDiv)


    table.createTHead();

    th0 = table.tHead.appendChild(document.createElement("th"));
    th0.innerHTML = "El No";
    th0.title = "Elementnummer"
    th0.setAttribute("class", "table_spannung_cell_center");
    th1 = table.tHead.appendChild(document.createElement("th"));
    th1.innerHTML = "&sigma;<sub>v1</sub>";
    th1.title = "Größtwert der Vergleichsspannung, Elementanfang"
    th2 = table.tHead.appendChild(document.createElement("th"));
    th2.innerHTML = "&sigma;<sub>vm</sub>";
    th2.title = "Größtwert der Vergleichsspannung, Elementmitte"
    th3 = table.tHead.appendChild(document.createElement("th"));
    th3.innerHTML = "&sigma;<sub>v2</sub>";
    th3.title = "Größtwert der Vergleichsspannung, Elementende"

    for (i = 0; i < nelem; i++) {

        let newRow = table.insertRow(-1);
        let newCell, newText
        newCell = newRow.insertCell(0);  // Insert a cell in the row at index 0

        newText = document.createTextNode(String(i + 1));  // Append a text node to the cell
        newCell.appendChild(newText);
        newCell.setAttribute("class", "table_spannung_cell_center");

        newCell = newRow.insertCell(1);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].sigma_v[0].toFixed(3));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(2);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].sigma_v[1].toFixed(3));  // Append a text node to the cell
        newCell.appendChild(newText);

        newCell = newRow.insertCell(3);  // Insert a cell in the row at index 1
        newText = document.createTextNode(truss[i].sigma_v[2].toFixed(3));  // Append a text node to the cell
        newCell.appendChild(newText);

    }

    // für die Grafik 

    ymin = 1.e30
    zmin = 1.e30
    ymax = -1.e30
    zmax = -1.e30

    for (i = 0; i < nnodes; i++) {
        //console.log(i, y[i], z[i]);
        if (node[i].y < ymin) ymin = node[i].y;
        if (node[i].z < zmin) zmin = node[i].z;
        if (node[i].y > ymax) ymax = node[i].y;
        if (node[i].z > zmax) zmax = node[i].z;
    }

    slmax = Math.sqrt((ymax - ymin) ** 2 + (zmax - zmin) ** 2)

    //systemlinien();
    berechnungErfolgreich( true );

    draw_elements();

}

//------------------------------------------------------------------------------------------------

const btn1 = document.getElementById("rechnen");
btn1.addEventListener('click', duennQ);

const btn2 = document.getElementById("resize");
btn2.addEventListener('click', resizeTable);

const btn3 = document.getElementById("clearTable");
btn3.addEventListener('click', clear_Tabelle);

document.getElementById("material_equal").addEventListener('change', setMaterialEqual);
document.getElementById('button_label_svg').addEventListener('click', label_svg, false);

// @ts-ignore
window.setMaterialEqual = setMaterialEqual;   // jetzt auch in html sichtbar
