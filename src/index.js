
import './styles/main.css';
import './styles/contextMenu.css';

import { myScreen } from './first.js'
//import "./globals.js";
import './einstellungen'

import "./duenn3D.js";
import './ergebnisse.js'
import './base_tabelle.js'
import './mypdf'

import { createTables } from './duennQ'

import { sichtbar, currentTab } from "./utility.js";

import DetectOS from './detectos.js'
import { init_contextmenu } from './contextMenu.js';


import { logo_3D, main_3D, ttf_logo_3D } from "./grafik_3D";
//import { duennQ } from "./duennQ"
import { setNewUnits, body_width, current_body_width } from './einstellungen';
import { berechnungErforderlich, set_text_berechnung_erforderlich } from "./globals.js"



// myScreen.clientWidth = document.documentElement.clientWidth;
// myScreen.clientHeight = document.documentElement.clientHeight;

export const infoBox = document.getElementById("infoBox");


addEventListener("resize", (event) => {
    //console.log("in resize")
    set_myScreen()
});

//-------------------------------------------------------------------------------
export function set_myScreen() {
    //---------------------------------------------------------------------------

    console.log("body_width", body_width)

    //const currentBodyWidth = document.body.style.width

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
        //    } else if (myScreen.clientWidth < 600) {
        //        myScreen.svgWidth = myScreen.clientWidth
    } else {
        myScreen.svgWidth = myScreen.clientWidth;
    }
    //document.getElementById("my-svg").style.width = myScreen.svgWidth + 'px';
    //document.getElementById("my-svg").style.height = myScreen.clientHeight + 'px';

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
        //console.log("portrait mode")
        sichtbar(currentTab)
    } else {
        // Landscape
        //console.log("landscape mode")
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
    let myInfoDiv = document.getElementById("id_hilfe");  //in div

    let tag = document.createElement("p"); // <p></p>
    tag.setAttribute("id", "id_infoDiv");
    let text = document.createTextNode("xxx");
    tag.appendChild(text);
    tag.innerHTML = "devicePixelRatio " + window.devicePixelRatio;
    myInfoDiv.appendChild(tag);

    console.log("my locale", navigator.language)

    if (window.devicePixelRatio >= 1.5) {
        const el = document.getElementById("id_body_width").setAttribute('disabled', true)
    }
}

main_3D();

eingabe1();  // Tabellenblatt eingabe sichtbar schalten
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

    if (navigator.userAgentData) {
        infoBox.innerHTML += "<br>navigator.userAgentData.mobile: " + navigator.userAgentData.mobile;
        infoBox.innerHTML += "<br>navigator.userAgentData.platform: " + navigator.userAgentData.platform;
    }
    infoBox.innerHTML += "<br><br>Browser Language: " + navigator.language;
    if (app.hasFSAccess) {
        infoBox.innerHTML += "<br>showSaveFilePicker wird unterstützt";
    } else {
        infoBox.innerHTML += "<br>showSaveFilePicker wird NICHT unterstützt";
    }
    const div = document.querySelector('body') //document.getElementById('eingabe_duennQ_top');

    infoBox.innerHTML += "<br>used font-size: " + css(div, 'font-size')
    //let txt = Intl.DateTimeFormat().resolvedOptions().locale
    let txt = Intl.NumberFormat().resolvedOptions().locale
    let txtArray = txt.split("-")
    infoBox.innerHTML += "<br>OS Language by NumberFormat: " + txtArray[0]
    infoBox.innerHTML += "<br>URL: " + window.location
    infoBox.innerHTML += "<br>Hostname: " + window.location.hostname
    //geht nicht infoBox.innerHTML += "<br>width of body: " + document.body.style.width
    //geht nicht infoBox.innerHTML += "<br>width of grid-container: " + document.createElement("grid-container").style.width
    //infoBox.innerHTML += "<br>getComputedStyle: " + getComputedStyle(div).font
    //infoBox.innerHTML += "<br>getRenderedFontFamilyName: " + getRenderedFontFamilyName(document.querySelector('body'));
}
{

    if (app.browserLanguage != 'de') {

        document.getElementById("id_doc").src = "docu_en.html";
        //console.log("language not de", app.browserLanguage)

        document.getElementById("lab_headline").innerHTML = "<b>Properties and stresses of thin-walled cross sections</b>";

        document.getElementById("lab_freier_text").innerText = "free text with HTML formatting for bold :";

        document.getElementById("id_eingabe").text = "Input";
        document.getElementById("id_results").text = "Results";
        document.getElementById("lab_nnodes").innerText = "Number of nodes :";
        document.getElementById("lab_nelem").innerText = "Number of elements :";
        document.getElementById("lab_schnittgroessen").innerHTML = "<b>Internal forces</b>";
        document.getElementById("lab_bezugswerte").innerHTML = "<b>Reference values</b>";
        document.getElementById("lab_material_equal").innerHTML = "all elements have the same material data";
        document.getElementById("lab_vergleichsspannung").innerHTML = "<b>Equivalent stress</b>";
        document.getElementById("lab_knoten").innerHTML = "<b>Nodes</b>";
        document.getElementById("lab_elemente").innerHTML = "<b>Elements</b>";

        document.getElementById("readFile").innerHTML = "read input data";
        document.getElementById("saveFile").innerHTML = "save input data";

        document.getElementById("resize").innerHTML = "resize table";
        document.getElementById("clearTable").innerHTML = "clear tables";
        document.getElementById("rechnen").innerHTML = "calculate";

        set_text_berechnung_erforderlich('New calculation required')

        document.getElementById("lab_einheiten").innerText = "Units for tables and stresses";
        document.getElementById("lab_unit_length").innerText = "Unit of length :";
        document.getElementById("lab_font_size").innerText = "Font size :";
        document.getElementById("lab_width_browser").innerText = "Width browser window :";
        document.getElementById("lab_tableColor_outside").innerText = "Table color outside :";
        document.getElementById("lab_tableColor_inside").innerText = "Table color inside :";
        document.getElementById("id_cb_saveLocalStorage").innerHTML = "Save selection as default values in browser";
        document.getElementById("id_cb_deleteLocalStorage").innerHTML = "Delete default values in browser memory";

        document.getElementById("lab_ergebnisse").innerHTML = "Results";
        document.getElementById("lab_ideelle_Querschnittswerte").innerHTML = "Ideal cross section properties";

    }
}
/*
{


    let j, k, l, sum

    const n = 500;
    const a = Array.from(Array(n), () => new Array(n).fill(1.0));
    const b = Array.from(Array(n), () => new Array(n).fill(2.0));
    const c = Array.from(Array(n), () => new Array(n).fill(0.0));
    const t0 = performance.now();

    for (j = 0; j < n; j++) {
        for (k = 0; k < n; k++) {
            sum = 0.0;
            for (l = 0; l < n; l++) {
                sum = sum + a[j][l] * b[l][k];
            }
            c[j][k] = sum;
        }
    }

    const t1 = performance.now();
    console.log(`Matrix multiplication took ${t1 - t0} milliseconds`)

    infoBox.innerHTML += `<br>Matrix multiplication took ${t1 - t0} milliseconds`
    infoBox.innerHTML += '<br>' + c[n - 1][n - 1]

}
*/

function css(element, property) {
    return window.getComputedStyle(element, null).getPropertyValue(property);
}
/*
function getRenderedFontFamilyName(element) {
    // Font families set in CSS for the element
    const fontFamilies = window.getComputedStyle(element, null).getPropertyValue("font-family");
    // const hardcodedFamilies = '-apple-system, BlinkMacSystemFont, "Segoe UI Adjusted", "Segoe UI", "Liberation Sans", sans-serif';

    // Remove the " sign from names (font families with spaces in their names) and split names to the array
    const fontFamiliesArr = fontFamilies.replaceAll('"', "").split(", ");

    // Find the first loaded font from the array
    return fontFamiliesArr.find(e => document.fonts.check(`12px ${e}`));
}
*/