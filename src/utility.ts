import { byId } from './state';
import { berechnung_erfolgreich } from "./globals.js";
import { myScreen } from './state'
import { set_myScreen } from "./index.js";
import { zeichneQuerschnitt } from "./grafik";
import { my_jspdf } from "./mypdf.js";

export let currentTab = '';

//------------------------------------------------------------------------------------------------
export function testeZahl(wert: string): string | number {
    //--------------------------------------------------------------------------------------------
    wert = wert.replace(/,/g, '.');
    if (isNaN(Number(wert))) {
        return 0;
    }
    return wert;
}

//------------------------------------------------------------------------------------------------
export function testNumber(wert: string, zeile: number, spalte: number, id: string): string | number {
    //--------------------------------------------------------------------------------------------

    wert = wert.replace(/,/g, '.');
    if (isNaN(Number(wert))) {
        byId<HTMLTableElement>(id).rows[zeile].cells[spalte].classList.add("selected");
        return 0;
    }
    return wert;
}

//------------------------------------------------------------------------------------------------
export function myFormat(wert: number, minDecimal: number, maxDecimal: number) {
    //--------------------------------------------------------------------------------------------

    return new Intl.NumberFormat(navigator.language, { minimumFractionDigits: minDecimal, maximumFractionDigits: maxDecimal }).format(wert);
}

//------------------------------------------------------------------------------------------------

export function sichtbar(displayName: string) {

    currentTab = displayName;

    if (displayName === 'eingabe') {
        byId("eingabe_duennQ_top").style.display = "block";
        byId("duennQ_save_daten").style.display = "block";
    } else {
        byId("eingabe_duennQ_top").style.display = "none";
        byId("duennQ_save_daten").style.display = "none";
    }

    if (displayName === 'ergebnisse') {
        byId("ergebnisse").style.display = "block";

    } else {
        byId("ergebnisse").style.display = "none";

    }
    if (displayName === 'duennQ') {
        set_myScreen();
        byId("my-svg").style.display = "block";
    } else {
        byId("my-svg").style.display = "none";
    }

    if (displayName === 'duenn3D') {
        set_myScreen();
        byId("my-webgl").style.display = "block";
    } else {
        byId("my-webgl").style.display = "none";
    }

    if (displayName === 'hilfe') {
        set_myScreen();
        let breite = Math.min(myScreen.clientWidth, 760);
        byId("id_doc").setAttribute("width", breite + "px");
        byId("id_doc").setAttribute("height", myScreen.clientHeight + "px");
        let left = (myScreen.svgWidth - breite) / 2
        if (left < 0) left = 0
        byId("id_doc_frame").style.left = left + 'px';
        console.log("id_doc_frame", (myScreen.clientWidth - breite) / 2)

        byId("id_hilfe").style.display = "block";
    } else {
        byId("id_hilfe").style.display = "none";
    }

    if (displayName === 'mypdf') {
        byId("id_pdf").style.display = "block";
        if (berechnung_erfolgreich) {
            my_jspdf();
        } else {
            alert('Es liegt keine fehlerfreie Berechnung vor')
        }
    } else {
        byId("id_pdf").style.display = "none";
    }

    if (displayName === 'einstellungen') {
        byId("id_einstellungen").style.display = "block";
    } else {
        byId("id_einstellungen").style.display = "none";
    }


    // erst zeichnen, wenn alle anderen Tabs ausgeblendet sind (sonst stimmt die Breite nicht)
    if (displayName === 'duennQ') zeichneQuerschnitt();
    if (displayName === 'duenn3D') zeige3D();
}

/** 3D-Ansicht (eigener Chunk, wird erst beim ersten Öffnen geladen) einblenden bzw. neu aufbauen. */
export function zeige3D(): void {
    import('./grafik3d').then(m => m.zeige3D());
}
