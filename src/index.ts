import { byId } from './state';
import 'font-awesome/css/font-awesome.min.css';

import './styles/main.css';
import './styles/contextMenu.css';

import { myScreen } from './state'
import './einstellungen'

import "./duenn3D.js";
import './ergebnisse.js'
import './base_tabelle.js'
import './mypdf'

import { createTables } from './duennQ'

import { sichtbar, currentTab } from "./utility.js";

import DetectOS from 'detectos.js';
import { init_contextmenu } from './contextMenu.js';

import { logo_3D, main_3D, ttf_logo_3D } from "./grafik_3D";
import { setNewUnits, body_width, current_body_width } from './einstellungen';
import { berechnungErforderlich, set_text_berechnung_erforderlich } from "./globals.js"

export const infoBox = byId("infoBox");

addEventListener("resize", (event) => {
    set_myScreen()
});

//-------------------------------------------------------------------------------
export function set_myScreen() {
    //---------------------------------------------------------------------------

    console.log("body_width", body_width)

    if (body_width < document.documentElement.clientWidth) {
        document.body.style.width = body_width + 'px'
        document.body.style.position = 'relative'
        document.body.style.left = (document.documentElement.clientWidth - body_width) / 2 + 'px'
    } else {
        document.body.style.width = '100%'   //document.documentElement.clientWidth
        document.body.style.position = 'relative'
        document.body.style.left = '0px'
        document.body.style.right = '0px'
    }

    myScreen.clientWidth = document.documentElement.clientWidth;
    myScreen.clientHeight = document.documentElement.clientHeight;

    console.log("myScreen", myScreen.clientWidth, myScreen.clientHeight, myScreen.svgWidth)
    console.log("devicePixelRatio", window.devicePixelRatio, screen.width, screen.height, screen.orientation)

    if (myScreen.clientWidth > body_width) {
        myScreen.svgWidth = body_width;  //myScreen.clientWidth - 900;
    } else {
        myScreen.svgWidth = myScreen.clientWidth;
    }

}

//-------------------------------------------------------------------------------

export const app = {
    appName: 'duennQs',
    browserLanguage: 'de',
    file: {
        handle: null,
        name: null,
        isModified: false,
    },
    options: {
        captureTabs: true,
        fontSize: 16,
        monoSpace: false,
        wordWrap: true,
    },
    hasFSAccess: 'chooseFileSystemEntries' in window ||
        'showOpenFilePicker' in window ||
        'showSaveFilePicker' in window,
    isMac: navigator.userAgent.includes('Mac OS X'),

};

const portrait = window.matchMedia("(orientation: portrait)");

portrait.addEventListener("change", function (e) {
    if (e.matches) {
        // Portrait mode
        sichtbar(currentTab)
    } else {
        // Landscape
        sichtbar(currentTab)
    }
})

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------

set_myScreen();

export const Detect = new DetectOS();
{
    let txt = navigator.language
    let txtArray = txt.split("-")

    app.browserLanguage = txtArray[0]
    console.log("app.browserLanguage", app.browserLanguage)
}
init_contextmenu();

createTables();

setNewUnits();

document.body.style.display = 'block'

{
    let myInfoDiv = byId("id_hilfe");  //in div

    let tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_infoDiv");
    let text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "devicePixelRatio " + window.devicePixelRatio;
    myInfoDiv.appendChild(tag);

    console.log("my locale", navigator.language)

    if (window.devicePixelRatio >= 1.5) {
        byId<HTMLInputElement>("id_body_width").disabled = true
    }
}

main_3D();

window.eingabe1();  // Tabellenblatt eingabe sichtbar schalten
berechnungErforderlich(true);

logo_3D();

ttf_logo_3D();

{

    infoBox.innerHTML = '<br><b>Einige System-Informationen</b><br>';
    infoBox.innerHTML += 'ScreenWidth≈' + Math.round(screen.width * window.devicePixelRatio)
        + " px &nbsp;,&nbsp;&nbsp;    ScreenHeight≈ " + Math.round(screen.height * window.devicePixelRatio) + ' px';
    infoBox.innerHTML += "<br>Browser: clientwidth=" + myScreen.clientWidth + "&nbsp;,&nbsp;&nbsp;    clientheight=" + myScreen.clientHeight;
    infoBox.innerHTML += "<br>Browser: " + Detect.browser + " Version " + Detect.version;
    infoBox.innerHTML += "<br>OS: " + Detect.OS + " , isMac: " + app.isMac;

    const uaData = (navigator as Navigator & { userAgentData?: { mobile: boolean; platform: string } }).userAgentData;
    if (uaData) {
        infoBox.innerHTML += "<br>navigator.userAgentData.mobile: " + uaData.mobile;
        infoBox.innerHTML += "<br>navigator.userAgentData.platform: " + uaData.platform;
    }
    infoBox.innerHTML += "<br><br>Browser Language: " + navigator.language;
    if (app.hasFSAccess) {
        infoBox.innerHTML += "<br>showSaveFilePicker wird unterstützt";
    } else {
        infoBox.innerHTML += "<br>showSaveFilePicker wird NICHT unterstützt";
    }
    const div = document.body;

    infoBox.innerHTML += "<br>used font-size: " + css(div, 'font-size')
    let txt = Intl.NumberFormat().resolvedOptions().locale
    let txtArray = txt.split("-")
    infoBox.innerHTML += "<br>OS Language by NumberFormat: " + txtArray[0]
    infoBox.innerHTML += "<br>URL: " + window.location
    infoBox.innerHTML += "<br>Hostname: " + window.location.hostname
}
{

    if (app.browserLanguage != 'de') {

        byId<HTMLIFrameElement>("id_doc").src = "docu_en.html";

        byId("lab_headline").innerHTML = "<b>Properties and stresses of thin-walled cross sections</b>";

        byId("lab_freier_text").innerText = "free text with HTML formatting for bold :";

        byId("id_eingabe").textContent = "Input";
        byId("id_results").textContent = "Results";
        byId("lab_nnodes").innerText = "Number of nodes :";
        byId("lab_nelem").innerText = "Number of elements :";
        byId("lab_schnittgroessen").innerHTML = "<b>Internal forces</b>";
        byId("lab_bezugswerte").innerHTML = "<b>Reference values</b>";
        byId("lab_material_equal").innerHTML = "all elements have the same material data";
        byId("lab_vergleichsspannung").innerHTML = "<b>Equivalent stress</b>";
        byId("lab_knoten").innerHTML = "<b>Nodes</b>";
        byId("lab_elemente").innerHTML = "<b>Elements</b>";

        byId("readFile").innerHTML = "read input data";
        byId("saveFile").innerHTML = "save input data";

        byId("resize").innerHTML = "resize table";
        byId("clearTable").innerHTML = "clear tables";
        byId("rechnen").innerHTML = "calculate";

        set_text_berechnung_erforderlich('New calculation required')

        byId("lab_einheiten").innerText = "Units for tables and stresses";
        byId("lab_unit_length").innerText = "Unit of length :";
        byId("lab_font_size").innerText = "Font size :";
        byId("lab_width_browser").innerText = "Width browser window :";
        byId("lab_tableColor_outside").innerText = "Table color outside :";
        byId("lab_tableColor_inside").innerText = "Table color inside :";
        byId("id_cb_saveLocalStorage").innerHTML = "Save selection as default values in browser";
        byId("id_cb_deleteLocalStorage").innerHTML = "Delete default values in browser memory";

        byId("lab_ergebnisse").innerHTML = "Results";
        byId("lab_ideelle_Querschnittswerte").innerHTML = "Ideal cross section properties";

    }
}

function css(element: Element, property: string) {
    return window.getComputedStyle(element, null).getPropertyValue(property);
}