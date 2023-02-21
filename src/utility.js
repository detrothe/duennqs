//import {currentTab} from "./globals.js";
import {myScreen, set_myScreen} from "./index.js";
import { systemlinien } from "./systemlinien";
import { duennQ } from "./duennQ";
import { draw_elements } from "./grafik_3D.js";

export let currentTab;

export function testeZahl(wert) {
    wert = wert.replace(/,/g, '.');
    //console.log('Komma entfernt',wert);
    if (isNaN(wert)) {
        //window.alert("Das ist keine Zahl ");

        return 0;
    }
    return wert;
}

//------------------------------------------------------------------------------------------------


export function testNumber(wert, zeile, spalte, id) {
    wert = wert.replace(/,/g, '.');
    //console.log('Komma entfernt',wert);
    if (isNaN(wert)) {
        //window.alert("Das ist keine Zahl ");


        document.getElementById(id).rows.item(zeile).cells.item(spalte).classList.add("selected");
        return 0;
    }
    return wert;
}

//------------------------------------------------------------------------------------------------

export function SDuennTruss() {
    this.emodul = null
    this.Iy = null
    this.r = [1, 1]
}

//------------------------------------------------------------------------------------------------

export function sichtbar(displayName) {

    currentTab = displayName;
    
    if (displayName === 'eingabe') {
        //document.getElementById("eingabe").style.display = "block";
        document.getElementById("knotentabelle").style.display = "block";
        document.getElementById("elementtabelle").style.display = "block";
        document.getElementById("eingabe_duennQ_top").style.display = "block";
        document.getElementById("duennQ_save_daten").style.display = "block";
    } else {
        //document.getElementById("eingabe").style.display = "none";
        document.getElementById("knotentabelle").style.display = "none";
        document.getElementById("elementtabelle").style.display = "none";
        document.getElementById("eingabe_duennQ_top").style.display = "none";
        document.getElementById("duennQ_save_daten").style.display = "none";
    }

    if (displayName === 'ergebnisse') {
        document.getElementById("ergebnisse").style.display = "block";
        document.getElementById("querschnittswerte").style.display = "block";

        document.getElementById("spannung_mxp").style.display = "block";
        document.getElementById("spannung_mxs").style.display = "block";
        document.getElementById("normalspannung").style.display = "block";
        document.getElementById("vergleichsspannung").style.display = "block";
        document.getElementById("schubspannung").style.display = "block";
    } else {
        document.getElementById("ergebnisse").style.display = "none";
        document.getElementById("querschnittswerte").style.display = "none";

        document.getElementById("spannung_mxp").style.display = "none";
        document.getElementById("spannung_mxs").style.display = "none";
        document.getElementById("normalspannung").style.display = "none";
        document.getElementById("vergleichsspannung").style.display = "none";
        document.getElementById("schubspannung").style.display = "none";
    }
    if (displayName === 'duennQ') {
        set_myScreen();
        systemlinien();
        document.getElementById("my-svg").style.display = "block";
    } else {
        document.getElementById("my-svg").style.display = "none";
    }

    if (displayName === 'duenn3D') {
        //set_myScreen();
        draw_elements();
        document.getElementById("my-webgl").style.display = "block";
        window.dispatchEvent(new Event("resize"));
        //window.dispatchEvent(new Event("forceRender"));
    } else {
        document.getElementById("my-webgl").style.display = "none";
    }
    
    if (displayName === 'hilfe') {
        set_myScreen();
        let breite = Math.min(myScreen.clientWidth,700);
        document.getElementById("id_doc").setAttribute("width", breite + "px");
        document.getElementById("id_doc").setAttribute("height", myScreen.clientHeight + "px");
    
        document.getElementById("id_hilfe").style.display = "block";
    } else {
        document.getElementById("id_hilfe").style.display = "none";
    }
}

/*
let stab = new mystruct();

stab.Iy = 10.0
*/